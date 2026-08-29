import { geoToMosaicUV, type MosaicBounds } from '../geo/mercator.js';
import { sampleNormalised } from '../geo/terrarium.js';
import type { LoadedMosaic } from '../geo/tileMosaic.js';
import type { BuildingMesh } from '../geo/extrude.js';
import { effectColorArray } from './effectStyle.js';
import type { CameraPose } from './camera.js';
import { FOV_Y, poseFor, rayBasis, viewProjection, type OrbitState } from './camera.js';
import {
  collapseSpan,
  effectArrival,
  effectRadius,
  type ImpactFrame,
  type ImpactScene,
} from './scene.js';
import {
  BLUR_FS,
  BRIGHT_FS,
  BUILDING_FS,
  BUILDING_VS,
  COMPOSITE_FS,
  DUST_FS,
  DUST_VS,
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
  bldAlbedo: 5,
  bldNormalT: 6,
  bldData: 7,
} as const;

/**
 * Beyond this the tallest building is under a pixel and the whole
 * raster pass is spent on nothing. Metres of camera distance.
 */
const BUILDING_VISIBLE_M = 60_000;

/**
 * Levels in the terrain pyramid, coarsest first. Two array textures
 * hold all of them, so a level is an index rather than another pair of
 * samplers and another five uniforms — which is what a real streaming
 * quadtree will need when it replaces this fixed set.
 *
 * Must match MAX_LAYERS in the shader.
 */
export const MAX_LAYERS = 16;

/**
 * Every layer of an array texture is the same size, so each mosaic is
 * resampled onto this grid on upload. 512 is a 2x2 tile block at its
 * native resolution, and twelve of them cost 12 x 512^2 x 4 B = 12 MB
 * per array — which is what buys twelve levels instead of six.
 *
 * Small blocks are not a compromise here. A level's half-extent is 256
 * texels, and the pixel footprint at that distance is about a quarter
 * of a texel, so the block runs out at almost exactly the distance
 * where the next level down is the right sharpness anyway.
 */
const LAYER_PX = 512;
const LAYER_MIPS = 10; // log2(512) + 1

/**
 * Bounds for a level that has not loaded yet. Chosen so the shader's
 * insideUV falls to exactly zero rather than relying on a NaN: the
 * longitude denominator is 1 degree wide and a billion degrees away,
 * so u is around -1e9 and the smoothstep clamps off. Using a real
 * degenerate box (zero width) would divide by zero instead.
 */
const ABSENT_BOUNDS: MosaicBounds = {
  lonWest: 1e9,
  lonEast: 1e9 + 1,
  latNorth: 1,
  latSouth: 0,
};

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
    buildings: WebGLProgram;
    dust: WebGLProgram;
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

  private readonly imageryArray: WebGLTexture;
  private readonly elevationArray: WebGLTexture;
  /** Finest first. A hole is a level still in flight, not an error. */
  private readonly layers: (LoadedMosaic | null)[] = Array.from({ length: MAX_LAYERS }, () => null);
  /** Wall-clock arrival of each level, for the fade-up. Cosmetic
   *  only: the simulation stays a pure function of its own clock. */
  private readonly layerArrival: number[] = Array.from({ length: MAX_LAYERS }, () => 0);
  private scratch: HTMLCanvasElement | null = null;
  private staging: HTMLCanvasElement | null = null;

  // ---- buildings -------------------------------------------------
  private bldTarget: {
    framebuffer: WebGLFramebuffer;
    albedo: WebGLTexture;
    normalT: WebGLTexture;
    depth: WebGLRenderbuffer;
  } | null = null;
  private bldVao: WebGLVertexArrayObject | null = null;
  private bldBuffers: WebGLBuffer[] = [];
  private bldDataTexture: WebGLTexture | null = null;
  private bldIndexCount = 0;
  private bldCount = 0;
  /** Dust points per frame: enough that every block gets a share,
   *  capped so a metropolis does not become a particle benchmark. */
  private dustCount = 0;

  /** Elevation at ground zero, cached per pyramid generation: the
   *  camera-anchored levels each carry their block centre's origin,
   *  which is NOT the scene's datum. */
  private layerGeneration = 0;
  private originCache: { generation: number; lat: number; lon: number; value: number } | null =
    null;

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
      buildings: this.link(BUILDING_VS, BUILDING_FS, 'buildings'),
      dust: this.link(DUST_VS, DUST_FS, 'dust'),
      bright: this.link(QUAD_VS, BRIGHT_FS, 'bright'),
      blur: this.link(QUAD_VS, BLUR_FS, 'blur'),
      composite: this.link(QUAD_VS, COMPOSITE_FS, 'composite'),
    };
    this.vao = required(gl.createVertexArray(), 'a vertex array');

    this.imageryArray = this.layerArray();
    this.elevationArray = this.layerArray();

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

  /**
   * One array texture for the whole pyramid. Storage is allocated up
   * front for every level: WebGL zero-fills it, and a level that has
   * not arrived is kept out of the shader by its bounds, not by an
   * unbound sampler.
   */
  private layerArray(): WebGLTexture {
    const { gl } = this;
    const texture = required(gl.createTexture(), 'a pyramid array texture');
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, LAYER_MIPS, gl.RGBA8, LAYER_PX, LAYER_PX, MAX_LAYERS);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (this.anisotropyExt !== null) {
      gl.texParameterf(
        gl.TEXTURE_2D_ARRAY,
        this.anisotropyExt.TEXTURE_MAX_ANISOTROPY_EXT,
        this.anisotropy
      );
    }
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
    this.disposeBuildingTarget();
    this.bldTarget = this.buildingTarget(width, height);
    this.nearA = this.target(half(width), half(height));
    this.nearB = this.target(half(width), half(height));
    this.wideA = this.target(eighth(width), eighth(height));
    this.wideB = this.target(eighth(width), eighth(height));
    return true;
  }

  /**
   * Upload one level of the pyramid. `level` is 0 for the SHARPEST and
   * MAX_LAYERS - 1 for the coarsest; the shader walks outwards from 0
   * and stops as soon as the levels it has passed cover the pixel.
   * Levels may arrive in any order — the planet-wide fallback is four
   * tiles and lands long before the close block does. Safe to call
   * repeatedly on the same level.
   */
  setMosaic(mosaic: LoadedMosaic, level = 0): void {
    const { gl } = this;
    const slot = Math.min(Math.max(level, 0), MAX_LAYERS - 1);
    // A REPLACEMENT block fades up too — but only when it is actually
    // a different block, or every camera nudge would blink the ground.
    if (this.layers[slot]?.imageryBlock.bounds !== mosaic.imageryBlock.bounds) {
      this.layerArrival[slot] = performance.now();
    }
    this.layers[slot] = mosaic;
    this.layerGeneration++;

    const dst = this.fit(mosaic.imagery);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.imageryArray);
    gl.texSubImage3D(
      gl.TEXTURE_2D_ARRAY,
      0,
      0,
      0,
      slot,
      LAYER_PX,
      LAYER_PX,
      1,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      dst
    );
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);

    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.elevationArray);
    gl.texSubImage3D(
      gl.TEXTURE_2D_ARRAY,
      0,
      0,
      0,
      slot,
      LAYER_PX,
      LAYER_PX,
      1,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      this.fit(this.elevationCanvas(mosaic))
    );
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
  }

  /**
   * The normalised DEM arrives as one byte per sample. Painting it into
   * a canvas lets the same resampling path serve both layers, and lets
   * the GPU take a canvas instead of a hand-built RGBA buffer.
   */
  private elevationCanvas(mosaic: LoadedMosaic): HTMLCanvasElement {
    const { bytes, width, height } = mosaic.elevation;
    this.staging ??= document.createElement('canvas');
    const canvas = this.staging;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx === null) throw new Error('ImpactRenderer: 2D canvas context unavailable');
    const image = ctx.createImageData(width, height);
    for (let i = 0; i < bytes.length; i++) {
      const v = bytes[i] ?? 0;
      image.data[i * 4] = v;
      image.data[i * 4 + 1] = v;
      image.data[i * 4 + 2] = v;
      image.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
  }

  /** Resample a mosaic onto the array's fixed grid. */
  private fit(source: HTMLCanvasElement): HTMLCanvasElement {
    if (source.width === LAYER_PX && source.height === LAYER_PX) return source;
    this.scratch ??= document.createElement('canvas');
    const canvas = this.scratch;
    canvas.width = LAYER_PX;
    canvas.height = LAYER_PX;
    const ctx = canvas.getContext('2d');
    if (ctx === null) throw new Error('ImpactRenderer: 2D canvas context unavailable');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, LAYER_PX, LAYER_PX);
    ctx.drawImage(source, 0, 0, LAYER_PX, LAYER_PX);
    return canvas;
  }

  /**
   * The building G-buffer: albedo, normal + view distance, and a real
   * depth buffer so facades occlude each other. Sized with the scene
   * target — the raymarch reads it with texelFetch at 1:1.
   */
  private buildingTarget(width: number, height: number): NonNullable<typeof this.bldTarget> {
    const { gl } = this;
    const albedo = required(gl.createTexture(), 'the building albedo target');
    gl.bindTexture(gl.TEXTURE_2D, albedo);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const normalT = required(gl.createTexture(), 'the building normal target');
    gl.bindTexture(gl.TEXTURE_2D, normalT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const depth = required(gl.createRenderbuffer(), 'the building depth buffer');
    gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, width, height);
    const framebuffer = required(gl.createFramebuffer(), 'the building framebuffer');
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, albedo, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, normalT, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { framebuffer, albedo, normalT, depth };
  }

  private disposeBuildingTarget(): void {
    const { gl } = this;
    const t = this.bldTarget;
    if (t === null) return;
    gl.deleteFramebuffer(t.framebuffer);
    gl.deleteTexture(t.albedo);
    gl.deleteTexture(t.normalT);
    gl.deleteRenderbuffer(t.depth);
    this.bldTarget = null;
  }

  /**
   * Upload the extruded city, or clear it with null. One interleaved
   * set of buffers, one draw per frame.
   */
  setBuildings(mesh: BuildingMesh | null): void {
    const { gl } = this;
    if (this.bldVao !== null) gl.deleteVertexArray(this.bldVao);
    for (const buffer of this.bldBuffers) gl.deleteBuffer(buffer);
    if (this.bldDataTexture !== null) gl.deleteTexture(this.bldDataTexture);
    this.bldVao = null;
    this.bldBuffers = [];
    this.bldDataTexture = null;
    this.bldIndexCount = 0;
    this.bldCount = 0;
    this.dustCount = 0;
    if (mesh === null || mesh.triangleCount === 0) return;

    // Per-building data — centre, base, height — as a float texture
    // the vertex shader indexes by building id: the collapse needs the
    // BLOCK's distance from ground zero, not each vertex's own.
    this.bldCount = mesh.buildingCount;
    this.dustCount = Math.min(120_000, mesh.buildingCount * 8);
    // Two RGBA32F texels per building: geometry, then roof + footprint.
    const rows = Math.max(1, Math.ceil((mesh.buildingCount * 2) / 1024));
    const padded = new Float32Array(1024 * rows * 4);
    padded.set(mesh.data);
    const dataTexture = required(gl.createTexture(), 'the building data texture');
    gl.bindTexture(gl.TEXTURE_2D, dataTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 1024, rows, 0, gl.RGBA, gl.FLOAT, padded);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.bldDataTexture = dataTexture;

    const program = this.programs.buildings;
    const vao = required(gl.createVertexArray(), 'the building vertex array');
    gl.bindVertexArray(vao);

    const attach = (
      name: string,
      data: Float32Array | Int8Array,
      size: number,
      type: number,
      normalised: boolean
    ): WebGLBuffer => {
      const buffer = required(gl.createBuffer(), `the building ${name} buffer`);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const location = gl.getAttribLocation(program, name);
      if (location >= 0) {
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, type, normalised, 0, 0);
      }
      return buffer;
    };
    this.bldBuffers.push(attach('aPos', mesh.positions, 3, gl.FLOAT, false));
    this.bldBuffers.push(attach('aNrm', mesh.normals, 4, gl.BYTE, true));
    this.bldBuffers.push(attach('aId', mesh.ids, 1, gl.FLOAT, false));
    const index = required(gl.createBuffer(), 'the building index buffer');
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
    this.bldBuffers.push(index);

    gl.bindVertexArray(null);
    this.bldVao = vao;
    this.bldIndexCount = mesh.indices.length;
  }

  /**
   * Terrain elevation at ground zero, from the finest pyramid level
   * covering it. The levels follow the camera and each records its own
   * block-centre origin, so none of them can be trusted as the datum
   * directly — but their FIELDS still contain ground zero while the
   * camera is anywhere near the event, and the datum must not drift
   * when the camera crosses a block boundary.
   */
  private originElevation(lat: number, lon: number): number {
    const cached = this.originCache;
    if (
      cached !== null &&
      cached.generation === this.layerGeneration &&
      cached.lat === lat &&
      cached.lon === lon
    ) {
      return cached.value;
    }
    let value = 0;
    for (const layer of this.layers) {
      if (layer === null) continue;
      const uv = geoToMosaicUV(lon, lat, layer.elevationBlock.bounds);
      if (uv.u < 0.002 || uv.u > 0.998 || uv.v < 0.002 || uv.v > 0.998) continue;
      value = sampleNormalised(layer.elevation, uv.u, uv.v);
      break;
    }
    this.originCache = { generation: this.layerGeneration, lat, lon, value };
    return value;
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

    gl.disable(gl.BLEND);

    // ---- 0. buildings --------------------------------------------
    // Raster first, raymarch second: the scene pass composites this
    // G-buffer by distance and lights the facades itself, so the two
    // worlds share one sun instead of wearing two.
    const bldPose = viewProjection(
      {
        ...pose,
        position: [km(pose.position[0]), km(pose.position[1]), km(pose.position[2])],
        target: [km(pose.target[0]), km(pose.target[1]), km(pose.target[2])],
      },
      aspect,
      FOV_Y,
      Math.max(km(pose.distance) * 1e-4, 2e-3),
      300
    );
    const drawBuildings =
      this.bldIndexCount > 0 && this.bldTarget !== null && pose.distance < BUILDING_VISIBLE_M;
    if (drawBuildings && this.bldTarget !== null && this.bldVao !== null) {
      const b = this.programs.buildings;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.bldTarget.framebuffer);
      gl.viewport(0, 0, this.width, this.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clearDepth(1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      // Winding is normalised by the extruder and pinned by its tests,
      // which is what buys dropping every interior face here.
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      gl.useProgram(b);
      gl.uniformMatrix4fv(this.location(b, 'uVP'), false, bldPose);
      gl.uniform3f(
        this.location(b, 'uCam'),
        km(pose.position[0]),
        km(pose.position[1]),
        km(pose.position[2])
      );
      gl.activeTexture(gl.TEXTURE0 + TEXTURE_UNITS.bldData);
      gl.bindTexture(gl.TEXTURE_2D, this.bldDataTexture);
      gl.uniform1i(this.location(b, 'uBldData'), TEXTURE_UNITS.bldData);
      /* The destruction, wired to the numbers the scene already
         computed. The fireball's ground print — an airburst's fireball
         can hang entirely above the roofline, which is why Hiroshima's
         dome stood at ground zero — the crater, the front, and the
         span it covered in the last 1.6 s of simulated time. */
      const fireY = km(frame.fireballAltitude);
      const fireR = km(frame.fireballRadius);
      const vapR = fireY < fireR ? Math.sqrt(fireR * fireR - fireY * fireY) : 0;
      gl.uniform1f(this.location(b, 'uShock'), km(frame.shockRadius));
      gl.uniform1f(this.location(b, 'uSpan'), km(collapseSpan(scene, frame.time)));
      gl.uniform1f(this.location(b, 'uVapR'), vapR);
      gl.uniform1f(this.location(b, 'uCraterR'), km(scene.craterRadius));
      gl.uniform1f(this.location(b, 'uR5'), km(effectRadius(scene, 'blast5')));
      gl.uniform1f(this.location(b, 'uR1'), km(effectRadius(scene, 'blast1')));
      gl.bindVertexArray(this.bldVao);
      gl.drawElements(gl.TRIANGLES, this.bldIndexCount, gl.UNSIGNED_INT, 0);
      gl.disable(gl.CULL_FACE);
      gl.disable(gl.DEPTH_TEST);
    } else if (this.bldTarget !== null) {
      // Stale facades from the last site must not haunt this one.
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.bldTarget.framebuffer);
      gl.viewport(0, 0, this.width, this.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    gl.bindVertexArray(this.vao);
    gl.disable(gl.DEPTH_TEST);

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
    // Dust loading only. The air's own extinction is a constant in the
    // shader now; tying it to the scene's framing reach made the haze
    // scale with how small the event was, which is backwards.
    gl.uniform1f(this.location(p, 'uFogK'), 1);
    gl.uniform1f(this.location(p, 'uGrainF'), 6 / Math.max(km(scene.craterRadius), 0.05));

    /* ── The terrain pyramid ────────────────────────────────────
       Every level is handed to the shader with its own bounds, its own
       elevation range and its own mean colour, and the shader picks
       the finest that covers each pixel. Levels still in flight get
       ABSENT_BOUNDS so they simply never cover anything. */
    const imgBnd = new Float32Array(MAX_LAYERS * 4);
    const demBnd = new Float32Array(MAX_LAYERS * 4);
    const elev = new Float32Array(MAX_LAYERS * 2);
    const mean = new Float32Array(MAX_LAYERS * 3);
    // Neutral desert, in linear light: what an absent level's exposure
    // is matched against so a division never blows up.
    const NEUTRAL: readonly [number, number, number] = [0.25, 0.21, 0.14];
    for (let i = 0; i < MAX_LAYERS; i++) {
      const layer = this.layers[i] ?? null;
      const ib = layer?.imageryBlock.bounds ?? ABSENT_BOUNDS;
      const db = layer?.elevationBlock.bounds ?? ABSENT_BOUNDS;
      imgBnd.set([ib.lonWest, ib.lonEast, ib.latNorth, ib.latSouth], i * 4);
      demBnd.set([db.lonWest, db.lonEast, db.latNorth, db.latSouth], i * 4);
      elev.set([layer?.elevation.min ?? 0, layer?.elevation.max ?? 1], i * 2);
      mean.set(layer?.meanColor ?? NEUTRAL, i * 3);
    }
    gl.uniform4fv(this.location(p, 'uLayerImgBnd'), imgBnd);
    gl.uniform4fv(this.location(p, 'uLayerDemBnd'), demBnd);
    gl.uniform2fv(this.location(p, 'uLayerElev'), elev);
    gl.uniform3fv(this.location(p, 'uLayerMean'), mean);
    const fades = new Float32Array(MAX_LAYERS);
    const wall = performance.now();
    for (let i = 0; i < MAX_LAYERS; i++) {
      fades[i] =
        this.layers[i] === null
          ? 0
          : Math.min(1, Math.max(0, (wall - (this.layerArrival[i] ?? 0)) / 600));
    }
    gl.uniform1fv(this.location(p, 'uLayerFade'), fades);
    gl.uniform1i(this.location(p, 'uLayerCount'), MAX_LAYERS);

    // Ground zero sits at y = 0 in the local frame, so the scene needs
    // the elevation there from the sharpest level that has it.
    const finest = this.layers.find((l) => l !== null) ?? null;
    gl.uniform3f(
      this.location(p, 'uElev'),
      finest?.elevation.min ?? 0,
      finest?.elevation.max ?? 1,
      // NOT finest.elevationAtOrigin: the camera-anchored levels each
      // carry their own block centre, and a datum that jumps when the
      // camera crosses a block boundary pops the whole landscape.
      this.originElevation(scene.latitude, scene.longitude)
    );
    gl.uniform2f(this.location(p, 'uOrg'), scene.latitude, scene.longitude);
    gl.uniform3f(this.location(p, 'uAvg'), 0.5, 0.46, 0.38);

    /* Bracket the raymarch on a MIDDLE level's relief. The sharpest
       block spans a few hundred metres and knows nothing about the
       mountains on the horizon; the planet's range is 20 km thick and
       nothing the march can afford resolves anything inside it. */
    const mid = Math.floor(MAX_LAYERS / 2);
    const marchLayer =
      this.layers.slice(mid).find((l) => l !== null) ??
      [...this.layers].reverse().find((l) => l !== null) ??
      finest;
    gl.uniform2f(
      this.location(p, 'uMarchRange'),
      marchLayer?.elevation.min ?? 0,
      marchLayer?.elevation.max ?? 1
    );

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
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.imageryArray);
    gl.uniform1i(this.location(p, 'uImgArr'), TEXTURE_UNITS.imagery);
    gl.activeTexture(gl.TEXTURE0 + TEXTURE_UNITS.elevation);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.elevationArray);
    gl.uniform1i(this.location(p, 'uDemArr'), TEXTURE_UNITS.elevation);
    if (this.bldTarget !== null) {
      gl.activeTexture(gl.TEXTURE0 + TEXTURE_UNITS.bldAlbedo);
      gl.bindTexture(gl.TEXTURE_2D, this.bldTarget.albedo);
      gl.uniform1i(this.location(p, 'uBldAlb'), TEXTURE_UNITS.bldAlbedo);
      gl.activeTexture(gl.TEXTURE0 + TEXTURE_UNITS.bldNormalT);
      gl.bindTexture(gl.TEXTURE_2D, this.bldTarget.normalT);
      gl.uniform1i(this.location(p, 'uBldNT'), TEXTURE_UNITS.bldNormalT);
    }
    gl.uniform1f(this.location(p, 'uHasBld'), drawBuildings ? 1 : 0);
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
      if (this.bldTarget !== null) {
        gl.activeTexture(gl.TEXTURE0 + TEXTURE_UNITS.bldNormalT);
        gl.bindTexture(gl.TEXTURE_2D, this.bldTarget.normalT);
        gl.uniform1i(this.location(q, 'uBldNT'), TEXTURE_UNITS.bldNormalT);
      }
      gl.uniform1f(this.location(q, 'uHasBld'), drawBuildings ? 1 : 0);
      gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);
      gl.disable(gl.BLEND);
    }

    // ---- 2b. collapse dust ---------------------------------------
    // One draw for every puff in the city. Premultiplied over, not
    // additive: dust covers what is behind it, it does not glow.
    if (drawBuildings && this.dustCount > 0) {
      const dprog = this.programs.dust;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(dprog);
      gl.uniformMatrix4fv(this.location(dprog, 'uVP'), false, bldPose);
      gl.uniform3f(
        this.location(dprog, 'uCam'),
        km(pose.position[0]),
        km(pose.position[1]),
        km(pose.position[2])
      );
      gl.uniform2f(this.location(dprog, 'uRes'), this.width, this.height);
      gl.activeTexture(gl.TEXTURE0 + TEXTURE_UNITS.bldData);
      gl.bindTexture(gl.TEXTURE_2D, this.bldDataTexture);
      gl.uniform1i(this.location(dprog, 'uBldData'), TEXTURE_UNITS.bldData);
      gl.uniform1i(this.location(dprog, 'uBldCount'), this.bldCount);
      const fireY = km(frame.fireballAltitude);
      const fireR = km(frame.fireballRadius);
      const vapR = fireY < fireR ? Math.sqrt(fireR * fireR - fireY * fireY) : 0;
      gl.uniform1f(this.location(dprog, 'uShock'), km(frame.shockRadius));
      gl.uniform1f(this.location(dprog, 'uSpan'), km(collapseSpan(scene, frame.time)));
      gl.uniform1f(this.location(dprog, 'uVapR'), vapR);
      gl.uniform1f(this.location(dprog, 'uCraterR'), km(scene.craterRadius));
      gl.uniform1f(this.location(dprog, 'uR5'), km(effectRadius(scene, 'blast5')));
      gl.uniform1f(this.location(dprog, 'uR1'), km(effectRadius(scene, 'blast1')));
      if (this.bldTarget !== null) {
        gl.activeTexture(gl.TEXTURE0 + TEXTURE_UNITS.bldNormalT);
        gl.bindTexture(gl.TEXTURE_2D, this.bldTarget.normalT);
        gl.uniform1i(this.location(dprog, 'uBldNT'), TEXTURE_UNITS.bldNormalT);
      }
      gl.uniform1f(this.location(dprog, 'uHasBld'), 1);
      gl.drawArrays(gl.POINTS, 0, this.dustCount);
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
    gl.deleteTexture(this.imageryArray);
    gl.deleteTexture(this.elevationArray);
    this.disposeBuildingTarget();
    if (this.bldVao !== null) gl.deleteVertexArray(this.bldVao);
    for (const buffer of this.bldBuffers) gl.deleteBuffer(buffer);
    if (this.bldDataTexture !== null) gl.deleteTexture(this.bldDataTexture);
    this.bldBuffers = [];
    gl.deleteVertexArray(this.vao);
    for (const program of Object.values(this.programs)) gl.deleteProgram(program);
    this.uniforms.clear();
  }
}
