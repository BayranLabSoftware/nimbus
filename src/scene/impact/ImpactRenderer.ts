import type { LoadedMosaic } from '../geo/tileMosaic.js';
import { effectColorArray } from './effectStyle.js';
import type { CameraPose } from './camera.js';
import { FOV_Y, poseFor, rayBasis, viewProjection, type OrbitState } from './camera.js';
import { effectArrival, effectRadius, type ImpactFrame, type ImpactScene } from './scene.js';
import {
  BLUR_FS,
  BRIGHT_FS,
  COMPOSITE_FS,
  PARTICLE_FS,
  PARTICLE_VS,
  QUAD_VS,
  SCENE_FS,
} from './shaders.js';

/**
 * WebGL2 renderer for the close-up impact view.
 *
 * Owns GPU resources and nothing else: no clock, no input handling, no
 * physics. `render()` takes a frame that is already a pure function of
 * simulation time, so the same call always produces the same picture —
 * which is what makes the view scrubbable and screenshot-testable.
 *
 * Pipeline, four passes:
 *   1. scene   — full-screen raymarch: sky, real terrain, crater,
 *                volumetric fireball and dust, into an HDR target
 *   2. ejecta  — additive points over the same target
 *   3. bloom   — bright-pass then separable blur at two scales
 *   4. composite — ACES tone map, vignette, grain, to the canvas
 *
 * The two bloom scales are not decoration: a single blur either loses
 * the tight rim of the fireball or fails to give it the wide halo that
 * reads as "brighter than the screen can show".
 */

const TEXTURE_UNITS = {
  scene: 0,
  bloomNear: 1,
  bloomWide: 2,
  imagery: 3,
  elevation: 4,
  imageryFar: 5,
  elevationFar: 6,
  imageryWorld: 7,
  elevationWorld: 8,
} as const;

/** Fraction of the device pixel grid we actually render at. The scene
 *  pass is a raymarch with a volume integral; full native resolution
 *  buys detail nobody sees and costs frames everybody feels. */
const RENDER_SCALE = 0.78;
const MAX_DEVICE_PIXEL_RATIO = 1.5;

/** Ejecta fragments drawn per frame. */
const PARTICLE_COUNT = 52_000;

/**
 * The DOM typings declare `gl.createTexture()` and friends as
 * non-nullable, but the WebGL specification has them return null when
 * the context is lost — which this project already handles elsewhere.
 * Funnelling every allocation through one generic guard keeps the
 * runtime check honest without seven suppressions.
 */
function required<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) {
    throw new Error(`ImpactRenderer: could not create ${what} (context lost?)`);
  }
  return value;
}

/** Which level of the terrain pyramid a mosaic belongs to. */
export type MosaicLayer = 'near' | 'far' | 'world';

interface RenderTarget {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
}

export interface ImpactRendererOptions {
  /** Direction TO the sun, in the local frame. Normalised internally. */
  readonly sunDirection?: readonly [number, number, number];
}

export class ImpactRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly programs: {
    scene: WebGLProgram;
    particles: WebGLProgram;
    bright: WebGLProgram;
    blur: WebGLProgram;
    composite: WebGLProgram;
  };
  private readonly vao: WebGLVertexArrayObject;
  private readonly uniforms = new Map<WebGLProgram, Map<string, WebGLUniformLocation | null>>();
  private readonly anisotropy: number;
  private readonly effectColors = effectColorArray();
  private readonly anisotropyExt: EXT_texture_filter_anisotropic | null;

  private scene: RenderTarget | null = null;
  private nearA: RenderTarget | null = null;
  private nearB: RenderTarget | null = null;
  private wideA: RenderTarget | null = null;
  private wideB: RenderTarget | null = null;

  private imageryTexture: WebGLTexture;
  private elevationTexture: WebGLTexture;
  private imageryFarTexture: WebGLTexture;
  private elevationFarTexture: WebGLTexture;
  private imageryWorldTexture: WebGLTexture;
  private elevationWorldTexture: WebGLTexture;
  private mosaic: LoadedMosaic | null = null;
  private farMosaic: LoadedMosaic | null = null;
  private worldMosaic: LoadedMosaic | null = null;

  private width = 0;
  private height = 0;
  private readonly sun: readonly [number, number, number];

  constructor(gl: WebGL2RenderingContext, options: ImpactRendererOptions = {}) {
    this.gl = gl;
    gl.getExtension('EXT_color_buffer_float');
    // The ground is nearly always seen edge-on. Without anisotropic
    // filtering the UV derivatives explode at grazing incidence, the
    // sampler falls to the top mip levels, and the satellite imagery
    // collapses to its own average colour — a flat brown plain.
    this.anisotropyExt = gl.getExtension('EXT_texture_filter_anisotropic');
    this.anisotropy =
      this.anisotropyExt === null
        ? 1
        : Math.min(
            16,
            gl.getParameter(this.anisotropyExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number
          );

    this.programs = {
      scene: this.link(QUAD_VS, SCENE_FS, 'scene'),
      particles: this.link(PARTICLE_VS, PARTICLE_FS, 'particles'),
      bright: this.link(QUAD_VS, BRIGHT_FS, 'bright'),
      blur: this.link(QUAD_VS, BLUR_FS, 'blur'),
      composite: this.link(QUAD_VS, COMPOSITE_FS, 'composite'),
    };
    this.vao = required(gl.createVertexArray(), 'a vertex array');

    this.imageryTexture = this.placeholder([120, 108, 88, 255]);
    this.elevationTexture = this.placeholder([128, 128, 128, 255]);
    this.imageryFarTexture = this.placeholder([120, 108, 88, 255]);
    this.elevationFarTexture = this.placeholder([128, 128, 128, 255]);
    this.imageryWorldTexture = this.placeholder([120, 108, 88, 255]);
    this.elevationWorldTexture = this.placeholder([128, 128, 128, 255]);

    const sun = options.sunDirection ?? [-0.42, 0.2, -0.88];
    const len = Math.hypot(sun[0], sun[1], sun[2]) || 1;
    this.sun = [sun[0] / len, sun[1] / len, sun[2] / len];
  }

  // ---- resources -------------------------------------------------

  private compile(type: number, source: string, label: string): WebGLShader {
    const { gl } = this;
    const shader = required(gl.createShader(type), `shader ${label}`);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) !== true) {
      const log = gl.getShaderInfoLog(shader) ?? '(no log)';
      gl.deleteShader(shader);
      throw new Error(`ImpactRenderer: ${label} failed to compile\n${log}`);
    }
    return shader;
  }

  private link(vertexSource: string, fragmentSource: string, label: string): WebGLProgram {
    const { gl } = this;
    const program = required(gl.createProgram(), `program ${label}`);
    const vs = this.compile(gl.VERTEX_SHADER, vertexSource, `${label}.vert`);
    const fs = this.compile(gl.FRAGMENT_SHADER, fragmentSource, `${label}.frag`);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (gl.getProgramParameter(program, gl.LINK_STATUS) !== true) {
      const log = gl.getProgramInfoLog(program) ?? '(no log)';
      throw new Error(`ImpactRenderer: ${label} failed to link\n${log}`);
    }
    return program;
  }

  /**
   * Uniform locations, cached PER PROGRAM. Keying a shared cache on the
   * program object stringifies every program to the same value, so all
   * five silently share one set of locations and four of them bind to
   * the wrong slots.
   */
  private location(program: WebGLProgram, name: string): WebGLUniformLocation | null {
    let perProgram = this.uniforms.get(program);
    if (perProgram === undefined) {
      perProgram = new Map();
      this.uniforms.set(program, perProgram);
    }
    if (!perProgram.has(name)) perProgram.set(name, this.gl.getUniformLocation(program, name));
    return perProgram.get(name) ?? null;
  }

  private placeholder(rgba: readonly [number, number, number, number]): WebGLTexture {
    const { gl } = this;
    const texture = required(gl.createTexture(), 'a placeholder texture');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array(rgba)
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
  }

  private target(width: number, height: number): RenderTarget {
    const { gl } = this;
    const texture = required(gl.createTexture(), 'a render target texture');
    const framebuffer = required(gl.createFramebuffer(), 'a framebuffer');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { texture, framebuffer, width, height };
  }

  private disposeTarget(target: RenderTarget | null): void {
    if (target === null) return;
    this.gl.deleteTexture(target.texture);
    this.gl.deleteFramebuffer(target.framebuffer);
  }

  /** Match the render targets to the canvas. Cheap when unchanged. */
  resize(cssWidth: number, cssHeight: number, devicePixelRatio = 1): boolean {
    const dpr = Math.min(devicePixelRatio, MAX_DEVICE_PIXEL_RATIO);
    const width = Math.max(2, Math.round(cssWidth * dpr * RENDER_SCALE));
    const height = Math.max(2, Math.round(cssHeight * dpr * RENDER_SCALE));
    if (width === this.width && height === this.height) return false;
    this.width = width;
    this.height = height;
    this.gl.canvas.width = width;
    this.gl.canvas.height = height;
    for (const t of [this.scene, this.nearA, this.nearB, this.wideA, this.wideB]) {
      this.disposeTarget(t);
    }
    const half = (v: number): number => Math.max(2, v >> 1);
    const eighth = (v: number): number => Math.max(2, v >> 3);
    this.scene = this.target(width, height);
    this.nearA = this.target(half(width), half(height));
    this.nearB = this.target(half(width), half(height));
    this.wideA = this.target(eighth(width), eighth(height));
    this.wideB = this.target(eighth(width), eighth(height));
    return true;
  }

  /**
   * Upload a mosaic. `layer` picks which one: the close tile the
   * viewer starts on, or the wide one that keeps the ground real once
   * they pull back past its edge. Safe to call repeatedly.
   */
  setMosaic(mosaic: LoadedMosaic, layer: MosaicLayer = 'near'): void {
    const { gl } = this;
    if (layer === 'near') this.mosaic = mosaic;
    else if (layer === 'far') this.farMosaic = mosaic;
    else this.worldMosaic = mosaic;

    const oldImagery =
      layer === 'near'
        ? this.imageryTexture
        : layer === 'far'
          ? this.imageryFarTexture
          : this.imageryWorldTexture;
    gl.deleteTexture(oldImagery);
    const imagery = required(gl.createTexture(), 'the imagery texture');
    gl.bindTexture(gl.TEXTURE_2D, imagery);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mosaic.imagery);
    this.finishTexture();
    if (layer === 'near') this.imageryTexture = imagery;
    else if (layer === 'far') this.imageryFarTexture = imagery;
    else this.imageryWorldTexture = imagery;

    const oldElevation =
      layer === 'near'
        ? this.elevationTexture
        : layer === 'far'
          ? this.elevationFarTexture
          : this.elevationWorldTexture;
    gl.deleteTexture(oldElevation);
    const elevation = required(gl.createTexture(), 'the elevation texture');
    const { bytes, width, height } = mosaic.elevation;
    // One byte per sample, expanded to RGBA: WebGL2's single-channel
    // R8 path needs an unpack alignment dance that buys nothing here.
    const rgba = new Uint8Array(width * height * 4);
    for (let i = 0; i < bytes.length; i++) {
      const v = bytes[i] ?? 0;
      rgba[i * 4] = v;
      rgba[i * 4 + 1] = v;
      rgba[i * 4 + 2] = v;
      rgba[i * 4 + 3] = 255;
    }
    gl.bindTexture(gl.TEXTURE_2D, elevation);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
    this.finishTexture();
    if (layer === 'near') this.elevationTexture = elevation;
    else if (layer === 'far') this.elevationFarTexture = elevation;
    else this.elevationWorldTexture = elevation;
  }

  private finishTexture(): void {
    const { gl } = this;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    if (this.anisotropyExt !== null) {
      gl.texParameterf(
        gl.TEXTURE_2D,
        this.anisotropyExt.TEXTURE_MAX_ANISOTROPY_EXT,
        this.anisotropy
      );
    }
  }

  // ---- drawing ---------------------------------------------------

  /** Camera pose for a frame — exposed so a caller can reuse it for
   *  picking or for an overlay without recomputing. */
  poseFor(scene: ImpactScene, frame: ImpactFrame, orbit: OrbitState): CameraPose {
    return poseFor(
      {
        reach: scene.framingReach,
        fireballRadius: frame.fireballRadius,
        fireballAltitude: frame.fireballAltitude,
        craterRadius: scene.craterRadius,
      },
      orbit
    );
  }

  render(scene: ImpactScene, frame: ImpactFrame, orbit: OrbitState): void {
    const { gl } = this;
    if (this.scene === null || this.nearA === null || this.nearB === null) return;
    if (this.wideA === null || this.wideB === null) return;

    const pose = this.poseFor(scene, frame, orbit);
    const km = (metres: number): number => metres / 1_000;
    const aspect = this.width / this.height;

    gl.bindVertexArray(this.vao);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);

    // ---- 1. scene ------------------------------------------------
    const p = this.programs.scene;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.scene.framebuffer);
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(p);
    gl.uniform2f(this.location(p, 'uRes'), this.width, this.height);
    gl.uniform3f(
      this.location(p, 'uCam'),
      km(pose.position[0]),
      km(pose.position[1]),
      km(pose.position[2])
    );
    gl.uniformMatrix3fv(this.location(p, 'uBasis'), false, rayBasis(pose));
    gl.uniform1f(this.location(p, 'uTan'), Math.tan(FOV_Y / 2));
    gl.uniform3f(this.location(p, 'uSun'), this.sun[0], this.sun[1], this.sun[2]);
    gl.uniform1f(this.location(p, 'uTime'), frame.time);
    gl.uniform1f(this.location(p, 'uFireR'), km(frame.fireballRadius));
    gl.uniform1f(this.location(p, 'uFireT'), frame.fireballTemperature);
    gl.uniform1f(this.location(p, 'uFireY'), km(frame.fireballAltitude));
    gl.uniform1f(this.location(p, 'uStemR'), km(frame.stemRadius));
    gl.uniform1f(this.location(p, 'uShock'), km(frame.shockRadius));
    gl.uniform1f(this.location(p, 'uCraterR'), km(scene.craterRadius));
    gl.uniform1f(this.location(p, 'uCraterD'), km(frame.craterDepth));
    gl.uniform1f(this.location(p, 'uScour'), km(frame.scourRadius));
    gl.uniform1f(this.location(p, 'uDust'), frame.dustOpacity);
    gl.uniform1f(this.location(p, 'uFlash'), frame.flash);
    gl.uniform1f(this.location(p, 'uFogK'), 3.5 / Math.max(km(scene.framingReach), 0.5) / 1_000);
    gl.uniform1f(this.location(p, 'uGrainF'), 6 / Math.max(km(scene.craterRadius), 0.05));

    const mosaic = this.mosaic;
    const imgBounds = mosaic?.imageryBlock.bounds;
    const demBounds = mosaic?.elevationBlock.bounds;
    gl.uniform4f(
      this.location(p, 'uImgBnd'),
      imgBounds?.lonWest ?? -1,
      imgBounds?.lonEast ?? 1,
      imgBounds?.latNorth ?? 1,
      imgBounds?.latSouth ?? -1
    );
    gl.uniform4f(
      this.location(p, 'uDemBnd'),
      demBounds?.lonWest ?? -1,
      demBounds?.lonEast ?? 1,
      demBounds?.latNorth ?? 1,
      demBounds?.latSouth ?? -1
    );
    gl.uniform3f(
      this.location(p, 'uElev'),
      mosaic?.elevation.min ?? 0,
      mosaic?.elevation.max ?? 1,
      mosaic?.elevationAtOrigin ?? 0
    );
    gl.uniform2f(this.location(p, 'uOrg'), scene.latitude, scene.longitude);
    gl.uniform3f(this.location(p, 'uAvg'), 0.5, 0.46, 0.38);

    // Wide mosaic
    const far = this.farMosaic;
    const farImg = far?.imageryBlock.bounds;
    const farDem = far?.elevationBlock.bounds;
    gl.uniform1f(this.location(p, 'uHasFar'), far === null ? 0 : 1);
    gl.uniform4f(
      this.location(p, 'uImgBnd2'),
      farImg?.lonWest ?? -1,
      farImg?.lonEast ?? 1,
      farImg?.latNorth ?? 1,
      farImg?.latSouth ?? -1
    );
    gl.uniform4f(
      this.location(p, 'uDemBnd2'),
      farDem?.lonWest ?? -1,
      farDem?.lonEast ?? 1,
      farDem?.latNorth ?? 1,
      farDem?.latSouth ?? -1
    );
    gl.uniform2f(this.location(p, 'uElev2'), far?.elevation.min ?? 0, far?.elevation.max ?? 1);
    gl.activeTexture(gl.TEXTURE0 + TEXTURE_UNITS.imageryFar);
    gl.bindTexture(gl.TEXTURE_2D, this.imageryFarTexture);
    gl.uniform1i(this.location(p, 'uImg2'), TEXTURE_UNITS.imageryFar);
    gl.activeTexture(gl.TEXTURE0 + TEXTURE_UNITS.elevationFar);
    gl.bindTexture(gl.TEXTURE_2D, this.elevationFarTexture);
    gl.uniform1i(this.location(p, 'uDem2'), TEXTURE_UNITS.elevationFar);

    // World level
    const world = this.worldMosaic;
    const wImg = world?.imageryBlock.bounds;
    const wDem = world?.elevationBlock.bounds;
    gl.uniform1f(this.location(p, 'uHasWorld'), world === null ? 0 : 1);
    gl.uniform4f(
      this.location(p, 'uImgBndW'),
      wImg?.lonWest ?? -1,
      wImg?.lonEast ?? 1,
      wImg?.latNorth ?? 1,
      wImg?.latSouth ?? -1
    );
    gl.uniform4f(
      this.location(p, 'uDemBndW'),
      wDem?.lonWest ?? -1,
      wDem?.lonEast ?? 1,
      wDem?.latNorth ?? 1,
      wDem?.latSouth ?? -1
    );
    gl.uniform2f(this.location(p, 'uElevW'), world?.elevation.min ?? 0, world?.elevation.max ?? 1);
    gl.activeTexture(gl.TEXTURE0 + TEXTURE_UNITS.imageryWorld);
    gl.bindTexture(gl.TEXTURE_2D, this.imageryWorldTexture);
    gl.uniform1i(this.location(p, 'uImgW'), TEXTURE_UNITS.imageryWorld);
    gl.activeTexture(gl.TEXTURE0 + TEXTURE_UNITS.elevationWorld);
    gl.bindTexture(gl.TEXTURE_2D, this.elevationWorldTexture);
    gl.uniform1i(this.location(p, 'uDemW'), TEXTURE_UNITS.elevationWorld);

    // Effect footprints. Zero disables an effect the event lacks —
    // an airburst has no crater and a conventional charge no EMP.
    gl.uniform3f(
      this.location(p, 'uThermal'),
      km(effectRadius(scene, 'thermal3')),
      km(effectRadius(scene, 'thermal2')),
      km(effectRadius(scene, 'thermal1'))
    );
    gl.uniform3f(
      this.location(p, 'uBlastR'),
      km(effectRadius(scene, 'blast5')),
      km(effectRadius(scene, 'blast1')),
      km(effectRadius(scene, 'blastLight'))
    );
    gl.uniform2f(
      this.location(p, 'uFireEj'),
      km(effectRadius(scene, 'firestorm')),
      km(effectRadius(scene, 'ejecta'))
    );
    gl.uniform2f(
      this.location(p, 'uRadEmp'),
      km(effectRadius(scene, 'radiation')),
      km(effectRadius(scene, 'emp'))
    );
    gl.uniform1f(this.location(p, 'uEjArrival'), effectArrival(scene, 'ejecta'));
    gl.uniform3fv(this.location(p, 'uEffectColor'), this.effectColors);
    // Camera distance over framing reach: the crossfade from a place
    // you are standing in to a map you are reading.
    gl.uniform1f(this.location(p, 'uScale'), pose.distance / Math.max(scene.framingReach, 1));
    gl.activeTexture(gl.TEXTURE0 + TEXTURE_UNITS.imagery);
    gl.bindTexture(gl.TEXTURE_2D, this.imageryTexture);
    gl.uniform1i(this.location(p, 'uImg'), TEXTURE_UNITS.imagery);
    gl.activeTexture(gl.TEXTURE0 + TEXTURE_UNITS.elevation);
    gl.bindTexture(gl.TEXTURE_2D, this.elevationTexture);
    gl.uniform1i(this.location(p, 'uDem'), TEXTURE_UNITS.elevation);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // ---- 2. ejecta -----------------------------------------------
    if (scene.ejectaLaunchSpeed > 0) {
      const q = this.programs.particles;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.useProgram(q);
      gl.uniformMatrix4fv(
        this.location(q, 'uVP'),
        false,
        viewProjection(
          {
            ...pose,
            position: [km(pose.position[0]), km(pose.position[1]), km(pose.position[2])],
            target: [km(pose.target[0]), km(pose.target[1]), km(pose.target[2])],
          },
          aspect,
          FOV_Y,
          Math.max(km(scene.framingReach) * 1e-4, 1e-4),
          km(scene.framingReach) * 400
        )
      );
      gl.uniform3f(
        this.location(q, 'uCam'),
        km(pose.position[0]),
        km(pose.position[1]),
        km(pose.position[2])
      );
      gl.uniform2f(this.location(q, 'uRes'), this.width, this.height);
      gl.uniform1f(this.location(q, 'uTime'), frame.time);
      gl.uniform1f(this.location(q, 'uCraterR'), km(scene.craterRadius));
      gl.uniform1f(this.location(q, 'uMaxSpeed'), km(scene.ejectaLaunchSpeed));
      gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);
      gl.disable(gl.BLEND);
    }

    // ---- 3. bloom ------------------------------------------------
    this.brightPass(this.scene, this.nearA);
    this.blurPass(this.nearA, this.nearB, [1, 0]);
    this.blurPass(this.nearB, this.nearA, [0, 1]);
    this.brightPass(this.nearA, this.wideA);
    this.blurPass(this.wideA, this.wideB, [1, 0]);
    this.blurPass(this.wideB, this.wideA, [0, 1]);

    // ---- 4. composite --------------------------------------------
    const c = this.programs.composite;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(c);
    this.bind(c, 'uScene', this.scene.texture, TEXTURE_UNITS.scene);
    this.bind(c, 'uBloomNear', this.nearA.texture, TEXTURE_UNITS.bloomNear);
    this.bind(c, 'uBloomWide', this.wideA.texture, TEXTURE_UNITS.bloomWide);
    gl.uniform2f(this.location(c, 'uRes'), this.width, this.height);
    // Seeded from simulation time, not wall time: the grain must not
    // shimmer while the view is paused.
    gl.uniform1f(this.location(c, 'uGrainSeed'), (frame.time * 977) % 997);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private bind(program: WebGLProgram, name: string, texture: WebGLTexture, unit: number): void {
    const { gl } = this;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(this.location(program, name), unit);
  }

  private brightPass(from: RenderTarget, to: RenderTarget): void {
    const { gl } = this;
    const p = this.programs.bright;
    gl.bindFramebuffer(gl.FRAMEBUFFER, to.framebuffer);
    gl.viewport(0, 0, to.width, to.height);
    gl.useProgram(p);
    this.bind(p, 'uTex', from.texture, TEXTURE_UNITS.scene);
    gl.uniform2f(this.location(p, 'uRes'), to.width, to.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private blurPass(
    from: RenderTarget,
    to: RenderTarget,
    direction: readonly [number, number]
  ): void {
    const { gl } = this;
    const p = this.programs.blur;
    gl.bindFramebuffer(gl.FRAMEBUFFER, to.framebuffer);
    gl.viewport(0, 0, to.width, to.height);
    gl.useProgram(p);
    this.bind(p, 'uTex', from.texture, TEXTURE_UNITS.scene);
    gl.uniform2f(this.location(p, 'uRes'), to.width, to.height);
    gl.uniform2f(this.location(p, 'uDir'), direction[0], direction[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose(): void {
    const { gl } = this;
    for (const t of [this.scene, this.nearA, this.nearB, this.wideA, this.wideB]) {
      this.disposeTarget(t);
    }
    this.scene = this.nearA = this.nearB = this.wideA = this.wideB = null;
    gl.deleteTexture(this.imageryTexture);
    gl.deleteTexture(this.elevationTexture);
    gl.deleteTexture(this.imageryFarTexture);
    gl.deleteTexture(this.elevationFarTexture);
    gl.deleteTexture(this.imageryWorldTexture);
    gl.deleteTexture(this.elevationWorldTexture);
    gl.deleteVertexArray(this.vao);
    for (const program of Object.values(this.programs)) gl.deleteProgram(program);
    this.uniforms.clear();
  }
}
