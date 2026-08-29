/**
 * Development harness for the impact renderer.
 *
 * Not part of the application: it exists so the renderer can be driven
 * against real streaming tiles and the real physics without first
 * rebuilding the whole simulator UI around it. Served by the Vite dev
 * server at /impact-dev.html; the production build never sees it,
 * because Vite only bundles entry points named in the config.
 */
import { EXPLOSION_PRESETS, simulateExplosion } from '../../physics/events/explosion/index.js';
import { IMPACT_PRESETS, simulateImpact } from '../../physics/simulate.js';
import { s } from '../../physics/units.js';
import { loadMosaic } from '../geo/tileMosaic.js';
import { SimClock, scrubToTime, timeToScrub } from '../simClock.js';
import { DEFAULT_ORBIT, clampOrbit, type OrbitState } from './camera.js';
import { ImpactRenderer } from './ImpactRenderer.js';
import { frameAt, sceneFromExplosion, sceneFromImpact, type ImpactScene } from './scene.js';

interface Site {
  readonly label: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly build: () => ImpactScene;
}

const SITES: readonly Site[] = [
  {
    label: '1 Mt · Yucca Flat',
    latitude: 37.1,
    longitude: -116.05,
    build: () =>
      sceneFromExplosion(simulateExplosion(EXPLOSION_PRESETS.ONE_MEGATON.input), {
        latitude: 37.1,
        longitude: -116.05,
      }),
  },
  {
    label: 'Meteor Crater',
    latitude: 35.0272,
    longitude: -111.0225,
    build: () =>
      sceneFromImpact(simulateImpact(IMPACT_PRESETS.METEOR_CRATER.input), {
        latitude: 35.0272,
        longitude: -111.0225,
      }),
  },
  {
    label: 'Chicxulub',
    latitude: 21.4,
    longitude: -89.5,
    build: () =>
      sceneFromImpact(simulateImpact(IMPACT_PRESETS.CHICXULUB.input), {
        latitude: 21.4,
        longitude: -89.5,
      }),
  },
];

function byId(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (el === null) throw new Error(`devHarness: #${id} is missing`);
  return el;
}
function byInputId(id: string): HTMLInputElement {
  return byId(id) as HTMLInputElement;
}
function byCanvasId(id: string): HTMLCanvasElement {
  return byId(id) as HTMLCanvasElement;
}

const canvas = byCanvasId('gl');
const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
if (gl === null) {
  byId('status').textContent = 'WebGL2 non disponibile.';
} else {
  const renderer = new ImpactRenderer(gl);
  let scene = SITES[0]?.build() ?? null;
  let orbit: OrbitState = DEFAULT_ORBIT;
  let siteIndex = 0;
  const clock = new SimClock({ duration: scene?.duration ?? s(60) });

  const status = byId('status');
  const readout = byId('readout');
  const slider = byInputId('scrub');

  async function selectSite(index: number): Promise<void> {
    const site = SITES[index];
    if (site === undefined || gl === null) return;
    siteIndex = index;
    scene = site.build();
    clock.setDuration(scene.duration);
    clock.seek(s(0));
    status.textContent = `${site.label} — scarico i tile…`;
    document.querySelectorAll<HTMLButtonElement>('[data-site]').forEach((b) => {
      b.setAttribute('aria-pressed', String(Number(b.dataset.site) === index));
    });
    try {
      const mosaic = await loadMosaic({
        latitude: site.latitude,
        longitude: site.longitude,
        spanMeters: scene.framingReach * 12,
        tiles: 6,
      });
      renderer.setMosaic(mosaic);
      const holes = mosaic.missing.imagery + mosaic.missing.elevation;
      status.textContent =
        `${site.label} · quota a GZ ${mosaic.elevationAtOrigin.toFixed(0)} m · ` +
        `imagery z${String(mosaic.imageryBlock.z)} · quota z${String(mosaic.elevationBlock.z)}` +
        (holes > 0 ? ` · ${String(holes)} tile mancanti` : '');
      clock.play();
    } catch (error) {
      status.textContent = `${site.label} — caricamento fallito: ${String(error)}`;
    }
  }

  let last = 0;
  function tick(now: number): void {
    const dt = last === 0 ? 0 : now - last;
    last = now;
    clock.advance(dt);
    const state = clock.getState();
    if (scene !== null) {
      renderer.resize(canvas.clientWidth, canvas.clientHeight, window.devicePixelRatio);
      const frame = frameAt(scene, state.time);
      renderer.render(scene, frame, orbit);
      slider.value = String(Math.round(timeToScrub(state.time, scene.duration) * 1_000));
      readout.textContent =
        `t ${state.time.toFixed(2)} s · fuoco ${(frame.fireballRadius / 1_000).toFixed(2)} km · ` +
        `fronte ${(frame.shockRadius / 1_000).toFixed(2)} km · ` +
        `${(frame.fireballTemperature / 1_000).toFixed(1)} kK`;
    }
    requestAnimationFrame(tick);
  }

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointerup', () => (dragging = false));
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    orbit = clampOrbit({
      yaw: orbit.yaw + (e.clientX - lastX) * 0.006,
      pitch: orbit.pitch - (e.clientY - lastY) * 0.004,
      zoom: orbit.zoom,
    });
    lastX = e.clientX;
    lastY = e.clientY;
  });
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      orbit = clampOrbit({ ...orbit, zoom: orbit.zoom * Math.exp(e.deltaY * 0.0011) });
    },
    { passive: false }
  );

  slider.addEventListener('input', () => {
    if (scene === null) return;
    clock.seek(scrubToTime(Number(slider.value) / 1_000, scene.duration));
  });
  byId('play').addEventListener('click', () => clock.toggle());
  document.querySelectorAll<HTMLButtonElement>('[data-site]').forEach((b) => {
    b.addEventListener('click', () => void selectSite(Number(b.dataset.site)));
  });

  void selectSite(siteIndex);
  requestAnimationFrame(tick);
}
