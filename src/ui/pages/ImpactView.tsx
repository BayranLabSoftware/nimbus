import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { s } from '../../physics/units.js';
import { localToGeo, zoomForSpan, zoomForTexel } from '../../scene/geo/mercator.js';
import { changedLevels, planPyramid } from '../../scene/geo/pyramid.js';
import { loadBuildingsForSite } from '../../scene/impact/buildings.js';
import { loadMosaic } from '../../scene/geo/tileMosaic.js';
import { MAX_LAYERS, ImpactRenderer } from '../../scene/impact/ImpactRenderer.js';
import {
  DEFAULT_ORBIT,
  FOV_Y,
  clampOrbit,
  maxCameraDistance,
  maxZoomForReach,
  type OrbitState,
} from '../../scene/impact/camera.js';
import {
  frameAt,
  openingTime,
  sceneFromExplosion,
  sceneFromImpact,
  type ImpactScene,
} from '../../scene/impact/scene.js';
import { SimClock, scrubToTime, timeToScrub } from '../../scene/simClock.js';
import { effectCss } from '../../scene/impact/effectStyle.js';
import { useAppStore, type ActiveResult, type Coordinates } from '../../store/index.js';
import { AppBar } from '../components/AppBar.js';
import styles from './ImpactView.module.css';

/** Block side, in tiles, for every level of the terrain pyramid.
 *  2 x 256 px is exactly the array-texture layer the renderer holds,
 *  so every level reaches the GPU without being resampled. */
const PYRAMID_TILES = 2;

/** What the terrain ladder needs to know about the current view:
 *  the nearest ground on screen (anchor and sharpness of the finest
 *  level) and the ground at the view centre (where the coarse levels
 *  slide toward). */
interface TerrainView {
  readonly near: { readonly latitude: number; readonly longitude: number };
  readonly centre: { readonly latitude: number; readonly longitude: number };
  /** Camera to the near ground point, metres. */
  readonly nearDistance: number;
}

/**
 * Close-up view: the same simulation the globe shows as rings, seen
 * from ground level as matter.
 *
 * Only the event families that actually produce a fireball and a
 * crater have one — an earthquake has nothing to look at from here.
 * The view says so rather than rendering an empty landscape.
 *
 * Everything drawn is a pure function of (scene, simulation time), so
 * the sequence can be paused and orbited, and a shared link that
 * carries a time reproduces the exact frame.
 */

/** Build a scene, or null when this event family has no close-up. */
function buildScene(result: ActiveResult | null, at: Coordinates | null): ImpactScene | null {
  if (result === null || at === null) return null;
  const origin = { latitude: at.latitude, longitude: at.longitude };
  if (result.type === 'impact') return sceneFromImpact(result.data, origin);
  if (result.type === 'explosion') return sceneFromExplosion(result.data, origin);
  return null;
}

type TerrainState = 'idle' | 'loading' | 'ready' | 'failed';

export function ImpactView(): JSX.Element {
  const { t } = useTranslation();
  const result = useAppStore((st) => st.result);
  const evaluatedAt = useAppStore((st) => st.lastEvaluatedAtLocation);
  const urlTime = useAppStore((st) => st.simTime);
  const setSimTime = useAppStore((st) => st.setSimTime);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<ImpactRenderer | null>(null);
  const clockRef = useRef<SimClock | null>(null);
  const orbitRef = useRef<OrbitState>(DEFAULT_ORBIT);
  /** Level index to the block key it is holding, so a camera nudge
   *  re-fetches only the levels that actually moved. */
  const loadedLevels = useRef(new Map<number, string>());
  /** Latest terrain sync, so the render loop — which is registered
   *  once — never calls a stale closure over the camera limits. */
  const syncRef = useRef<((view: TerrainView) => void) | null>(null);
  const zoomFineRef = useRef<number | null>(null);
  const maxZoomRef = useRef(4);
  const sceneRef = useRef<ImpactScene | null>(null);
  const scrubRef = useRef<HTMLInputElement | null>(null);
  const hudRef = useRef<Record<string, HTMLSpanElement | null>>({});

  const [playing, setPlaying] = useState(true);
  // Flipped by the render loop when the camera crosses into map
  // range. Kept as a boolean, not the raw distance, so pulling back
  // does not re-render React on every frame.
  const [mapRange, setMapRange] = useState(false);
  const [nowSeconds, setNowSeconds] = useState(0);
  const [terrain, setTerrain] = useState<TerrainState>('idle');
  // Distinguishing these two matters: "no WebGL2" sends the reader to
  // check their browser, while a shader that failed to compile is our
  // bug and the console has the line number. Collapsing both into one
  // message costs whoever debugs it the obvious first question.
  const [glFailure, setGlFailure] = useState<'none' | 'unsupported' | 'shader'>('none');

  const scene = buildScene(result, evaluatedAt);
  sceneRef.current = scene;

  // Effects key on stable primitives rather than on the scene object:
  // `buildScene` returns a fresh object every render, so depending on
  // it directly would tear the renderer down sixty times a second.
  const hasScene = scene !== null;
  const originLat = scene?.latitude ?? 0;
  const originLon = scene?.longitude ?? 0;
  const reachMeters = scene?.framingReach ?? 0;
  const effectsReach = scene?.effectsReach ?? 0;
  // Stable primitive for the buildings effect: the 5 psi ring is what
  // sizes the loaded disc.
  const blast5 = scene?.effects.find((e) => e.id === 'blast5')?.radius ?? 0;
  const maxZoom = maxZoomForReach(reachMeters, effectsReach);
  /* Three levels, sized to what can actually end up on screen.
     Nothing past the horizon is visible, so the outermost level does
     not have to be the whole planet — it has to reach the horizon.
     A fixed planet-wide level was 20 km per pixel, and where it met
     the middle tile it drew a row of rectangular notches along the
     skyline out of its own texels. */
  const cameraRange = maxCameraDistance(reachMeters, effectsReach);
  // Camera height at full pitch, and the horizon from there.
  const cameraHeight = Math.max(cameraRange * 0.234 * 1.35, 1_000);
  const horizonRange = Math.sqrt(2 * 6_371_008 * cameraHeight);
  /** Working area: the ground the viewer actually studies. */
  /** Everything out to the skyline. Clamped to the equator, at which
   *  point the planner drops to the coarsest level and the block
   *  covers most of the hemisphere anyway. */
  /** Everything out to the skyline: the coarsest level has to reach it,
   *  or pulling all the way back shows a square of map in empty space. */
  const horizonSpan = Math.min(40_075_017, 2.4 * (cameraRange + horizonRange));
  const durationSeconds = scene?.duration ?? 0;
  const blastEnergy = scene?.blastEnergy ?? 0;

  const unsupported = result !== null && scene === null;
  const missing = result === null;

  // ---- renderer lifecycle ------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null || !hasScene) return;
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
    if (gl === null) {
      setGlFailure('unsupported');
      return;
    }
    let renderer: ImpactRenderer;
    try {
      renderer = new ImpactRenderer(gl);
    } catch (error) {
      console.error('[ImpactView] renderer init failed:', error);
      setGlFailure('shader');
      return;
    }
    rendererRef.current = renderer;
    return () => {
      rendererRef.current = null;
      renderer.dispose();
    };
  }, [hasScene]);

  // ---- clock, retargeted whenever the scenario changes -------------
  useEffect(() => {
    if (!hasScene) return;
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clock = new SimClock({
      duration: s(durationSeconds),
      rateMultiplier: reduced ? 0.5 : 1,
    });
    clockRef.current = clock;
    const current = sceneRef.current;
    if (urlTime !== null) {
      // A link that carries a playhead opens on that exact frame,
      // paused, because the sender chose it.
      clock.seek(s(urlTime));
    } else if (current !== null) {
      clock.seek(openingTime(current));
      clock.play();
    }
    setPlaying(clock.getState().playing);
    const off = clock.subscribe((state) => {
      setPlaying(state.playing);
      // Publish the playhead only when it settles. Writing it on every
      // frame would rewrite the URL sixty times a second; writing it
      // on a pause or a scrub is exactly when someone means to share.
      setSimTime(state.playing ? null : state.time);
    });
    return () => {
      off();
      clockRef.current = null;
    };
    // `urlTime` is read once, when the scenario mounts: re-seeking on
    // every publish would fight the playhead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasScene, durationSeconds, blastEnergy]);

  // Keep the adaptive zoom ceiling in a ref so the wheel handler,
  // which is registered once, always sees the current scene's.
  useEffect(() => {
    maxZoomRef.current = maxZoom;
  }, [maxZoom]);

  /* ---- terrain -----------------------------------------------------
     The pyramid follows the camera. See scene/geo/pyramid.ts for why
     centring it on the event cannot be made sharp; the short version
     is that sharpness is bounded by a block's pixel count, so the
     sharp blocks are small, and a small block is only useful where
     the small pixels are — under the camera. */
  const syncTerrain = useCallback(
    (view: TerrainView): void => {
      const renderer = rendererRef.current;
      if (renderer === null) return;

      /* Two numbers set the ladder. The sharpest zoom matches the
         pixel footprint at the NEAREST ground actually on screen —
         asking for more downloads detail no pixel will sample, asking
         for less is the blur. The coarsest has to reach the skyline,
         or pulling all the way back shows a square of map floating in
         nothing. If the span between them needs more levels than
         there are slots, the step widens rather than the far end
         being dropped.

         The sharp zoom follows the CURRENT camera, with hysteresis:
         re-planning the ladder every time a zoom gesture grazes a
         threshold would churn tiles for nothing, so the ladder only
         moves once the footprint has crossed the threshold by a third. */
      const wantedTexel = Math.max((view.nearDistance * 2 * Math.tan(FOV_Y / 2)) / 900, 0.05);
      let zoomFine = zoomForTexel(view.near.latitude, wantedTexel);
      const held = zoomFineRef.current;
      if (held !== null && zoomFine !== held) {
        const heldTexel =
          (40_075_017 * Math.cos((view.near.latitude * Math.PI) / 180)) / (256 * 2 ** held);
        if (wantedTexel > heldTexel / 1.33 && wantedTexel < heldTexel * 1.33) zoomFine = held;
      }
      zoomFineRef.current = zoomFine;
      const zoomCoarse = zoomForSpan(view.near.latitude, horizonSpan, PYRAMID_TILES, 19);

      /* Per-level anchors: the sharp levels sit under the nearest
         ground on screen, the coarse ones slide out to where the view
         centre lands. See scene/geo/pyramid.ts for why one anchor
         cannot serve both. */
      const anchors = Array.from({ length: MAX_LAYERS }, (_, i) => {
        const t = Math.min(1, i / 5);
        return {
          latitude: view.near.latitude + (view.centre.latitude - view.near.latitude) * t,
          longitude: view.near.longitude + (view.centre.longitude - view.near.longitude) * t,
        };
      });

      const plan = planPyramid({
        latitude: view.near.latitude,
        longitude: view.near.longitude,
        anchors,
        zoomFine,
        zoomCoarse,
        step: Math.max(1, Math.ceil((zoomFine - zoomCoarse) / (MAX_LAYERS - 1))),
        levels: MAX_LAYERS,
        tiles: PYRAMID_TILES,
      });

      for (const entry of changedLevels(plan, loadedLevels.current)) {
        // Claim the slot before awaiting, or a camera that keeps moving
        // re-requests the same block on every tick until it lands.
        loadedLevels.current.set(entry.level, entry.key);
        loadMosaic({
          latitude: entry.latitude,
          longitude: entry.longitude,
          // Ignored once the zoom is forced; the block size follows
          // from the tile count.
          spanMeters: Math.max(reachMeters, 1_000),
          tiles: PYRAMID_TILES,
          zoom: entry.zoom,
        })
          .then((mosaic) => {
            // The camera may have moved on while this was in flight.
            if (loadedLevels.current.get(entry.level) !== entry.key) return;
            rendererRef.current?.setMosaic(mosaic, entry.level);
            if (entry.level === 0) setTerrain('ready');
          })
          .catch((error: unknown) => {
            if (loadedLevels.current.get(entry.level) === entry.key) {
              loadedLevels.current.delete(entry.level);
            }
            console.warn(`[ImpactView] terrain z${String(entry.zoom)} unavailable:`, error);
            // Only the sharpest level failing is worth reporting: the
            // rest degrade to the level below.
            if (entry.level === 0) setTerrain('failed');
          });
      }
    },
    [horizonSpan, reachMeters]
  );

  useEffect(() => {
    syncRef.current = syncTerrain;
  }, [syncTerrain]);

  // ---- buildings ---------------------------------------------------
  // Extruded OSM footprints around ground zero. Null is a fine
  // answer — deserts and oceans simply have none — so failures only
  // warn: the scene must never depend on this layer existing.
  useEffect(() => {
    if (!hasScene) return;
    let cancelled = false;
    rendererRef.current?.setBuildings(null);
    loadBuildingsForSite(
      { latitude: originLat, longitude: originLon, r5psiMeters: blast5 },
      { isCancelled: () => cancelled }
    )
      .then((mesh) => {
        if (!cancelled && mesh !== null) rendererRef.current?.setBuildings(mesh);
      })
      .catch((error: unknown) => {
        console.warn('[ImpactView] buildings unavailable:', error);
      });
    return () => {
      cancelled = true;
      rendererRef.current?.setBuildings(null);
    };
  }, [hasScene, originLat, originLon, blast5]);

  // A change of site or of scale invalidates every block we hold.
  useEffect(() => {
    if (!hasScene) return;
    loadedLevels.current.clear();
    zoomFineRef.current = null;
    setTerrain('loading');
    // Before the first frame there is no pose: seed the ladder at
    // ground zero from the closest the camera can get. The render
    // loop refines it within a fifth of a second.
    const nearest = (cameraRange * 0.25) / Math.max(maxZoom, 0.25);
    syncTerrain({
      near: { latitude: originLat, longitude: originLon },
      centre: { latitude: originLat, longitude: originLon },
      nearDistance: Math.max(nearest, 500),
    });
  }, [hasScene, originLat, originLon, syncTerrain, cameraRange, maxZoom]);

  // ---- render loop -------------------------------------------------
  useEffect(() => {
    if (!hasScene) return;
    let handle = 0;
    let last = 0;
    let lastSync = 0;
    const step = (now: number): void => {
      handle = requestAnimationFrame(step);
      const renderer = rendererRef.current;
      const clock = clockRef.current;
      const canvas = canvasRef.current;
      const current = sceneRef.current;
      if (renderer === null || clock === null || canvas === null || current === null) return;

      const delta = last === 0 ? 0 : now - last;
      last = now;
      const state = clock.advance(delta);
      renderer.resize(canvas.clientWidth, canvas.clientHeight, window.devicePixelRatio);
      const frame = frameAt(current, state.time);
      renderer.render(current, frame, orbitRef.current);

      if (scrubRef.current !== null && document.activeElement !== scrubRef.current) {
        scrubRef.current.value = String(
          Math.round(timeToScrub(state.time, current.duration) * 1_000)
        );
      }
      const set = (key: string, value: string): void => {
        const el = hudRef.current[key];
        if (el !== null && el !== undefined && el.textContent !== value) el.textContent = value;
      };
      set('clock', `t = ${formatTime(state.time)}`);
      set('fireball', formatLength(frame.fireballRadius));
      set('shock', formatLength(frame.shockRadius));
      set('temperature', `${(frame.fireballTemperature / 1_000).toFixed(1)} kK`);
      set('crater', `${formatLength(current.craterRadius * 2)} ø`);

      const pose = renderer.poseFor(current, frame, orbitRef.current);

      /* Keep the pyramid under the VIEW. Five times a second is
         plenty: planning is sixteen tile-index computations and a
         string compare per level, and anything that has not crossed a
         block boundary resolves to no work at all.
         Two ground points describe the view: where the bottom of the
         frame meets the ground (the nearest pixels, which set the
         sharpest level) and where the view centre lands (which the
         coarse levels slide toward). */
      if (now - lastSync > 200) {
        lastSync = now;
        const hit = (dir: readonly [number, number, number]): [number, number] | null => {
          if (dir[1] >= -1e-4) return null;
          const t = Math.min(-pose.position[1] / dir[1], 600_000);
          return [pose.position[0] + dir[0] * t, pose.position[2] + dir[2] * t];
        };
        const tanY = Math.tan(FOV_Y / 2);
        const down: [number, number, number] = [
          pose.forward[0] - pose.up[0] * 0.85 * tanY,
          pose.forward[1] - pose.up[1] * 0.85 * tanY,
          pose.forward[2] - pose.up[2] * 0.85 * tanY,
        ];
        const nearXZ = hit(down) ?? [pose.position[0], pose.position[2]];
        const centreXZ = hit(pose.forward) ?? [current.framingReach * 0, 0];
        const near = localToGeo(nearXZ[0], nearXZ[1], current.latitude, current.longitude);
        const centre = localToGeo(centreXZ[0], centreXZ[1], current.latitude, current.longitude);
        syncRef.current?.({
          near: { latitude: near.lat, longitude: near.lon },
          centre: { latitude: centre.lat, longitude: centre.lon },
          nearDistance: Math.max(
            Math.hypot(
              nearXZ[0] - pose.position[0],
              pose.position[1],
              nearXZ[1] - pose.position[2]
            ),
            50
          ),
        });
      }

      const scale = pose.distance / Math.max(current.framingReach, 1);
      const inMapRange = scale > 1.9;
      setMapRange((prev) => (prev === inMapRange ? prev : inMapRange));
      // One update per second is enough to grey out the effects that
      // have not arrived yet; the HUD itself is written imperatively.
      setNowSeconds((prev) => (Math.abs(prev - state.time) > 0.5 ? state.time : prev));
    };
    handle = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(handle);
    };
  }, [hasScene]);

  // ---- input --------------------------------------------------------
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    dragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);
  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);
  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return;
    orbitRef.current = clampOrbit(
      {
        yaw: orbitRef.current.yaw + (e.clientX - lastPointer.current.x) * 0.006,
        pitch: orbitRef.current.pitch - (e.clientY - lastPointer.current.y) * 0.004,
        zoom: orbitRef.current.zoom,
      },
      maxZoomRef.current
    );
    lastPointer.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      orbitRef.current = clampOrbit(
        { ...orbitRef.current, zoom: orbitRef.current.zoom * Math.exp(e.deltaY * 0.0011) },
        maxZoomRef.current
      );
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [hasScene]);

  // ---- markup --------------------------------------------------------
  if (missing || unsupported || glFailure !== 'none') {
    return (
      <div className={styles.root}>
        <AppBar />
        <p className={styles.placeholder}>
          {glFailure === 'unsupported'
            ? t('impactView.noWebgl')
            : glFailure === 'shader'
              ? t('impactView.renderFailed')
              : unsupported
                ? t('impactView.unsupported')
                : t('impactView.needsResult')}
        </p>
      </div>
    );
  }

  const bind =
    (key: string) =>
    (el: HTMLSpanElement | null): void => {
      hudRef.current[key] = el;
    };

  return (
    <div className={styles.root}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerMove={onPointerMove}
        aria-label={t('impactView.title')}
      />
      <AppBar />
      <p className={styles.place}>
        {scene !== null
          ? `${formatCoordinate(scene.latitude, 'NS')} ${formatCoordinate(scene.longitude, 'EW')}` +
            (terrain === 'loading' ? ` · ${t('impactView.loading')}` : '') +
            (terrain === 'failed' ? ` · ${t('impactView.terrainFailed')}` : '')
          : ''}
      </p>

      <div className={styles.hud}>
        {(
          [
            ['fireball', 'impactView.fireball'],
            ['shock', 'impactView.shock'],
            ['temperature', 'impactView.temperature'],
            ['crater', 'impactView.crater'],
          ] as const
        ).map(([key, label]) => (
          <div className={styles.hudRow} key={key}>
            <span className={styles.hudLabel}>{t(label)}</span>
            <span className={styles.hudValue} ref={bind(key)}>
              —
            </span>
          </div>
        ))}
      </div>

      {scene !== null && scene.effects.length > 0 && (
        <div
          className={styles.legend}
          style={{ opacity: mapRange ? 1 : 0 }}
          aria-hidden={!mapRange}
        >
          <p className={styles.legendTitle}>{t('impactView.legendTitle')}</p>
          {scene.effects
            .slice()
            .reverse()
            .map((effect) => (
              <div
                key={effect.id}
                className={
                  nowSeconds < effect.arrival
                    ? `${styles.legendRow ?? ''} ${styles.legendPending ?? ''}`
                    : (styles.legendRow ?? '')
                }
              >
                <i
                  className={styles.legendSwatch}
                  style={{ background: effectCss(effect.id) }}
                  aria-hidden="true"
                />
                <span>{t(`impactView.${effect.labelKey}`)}</span>
                <span className={styles.legendValue}>{formatLength(effect.radius)}</span>
              </div>
            ))}
        </div>
      )}

      <p className={styles.hint}>
        {t('impactView.hint')}
        {!mapRange && scene !== null && scene.effectsReach > scene.framingReach * 6
          ? ` · ${t('impactView.legendHint')}`
          : ''}
      </p>
      <p className={styles.sources}>{t('impactView.sources')}</p>

      <div className={styles.transport}>
        <button
          type="button"
          className={styles.play}
          aria-label={playing ? t('impactView.pause') : t('impactView.play')}
          onClick={() => clockRef.current?.toggle()}
        >
          <svg width="11" height="12" viewBox="0 0 11 12" aria-hidden="true">
            <path
              d={playing ? 'M1 1H4V11H1ZM7 1H10V11H7Z' : 'M1 1L10 6L1 11Z'}
              fill="currentColor"
            />
          </svg>
        </button>
        <input
          ref={scrubRef}
          type="range"
          min="0"
          max="1000"
          defaultValue="0"
          className={styles.scrub}
          aria-label={t('impactView.time')}
          onInput={(e) => {
            const current = sceneRef.current;
            if (current === null) return;
            clockRef.current?.seek(
              scrubToTime(Number(e.currentTarget.value) / 1_000, current.duration)
            );
          }}
        />
        <span className={styles.clock} ref={bind('clock')}>
          t = 0.00 s
        </span>
      </div>
    </div>
  );
}

function formatLength(metres: number): string {
  return metres >= 1_000
    ? `${(metres / 1_000).toLocaleString(undefined, {
        maximumFractionDigits: metres >= 1e5 ? 0 : 2,
      })} km`
    : `${metres.toLocaleString(undefined, { maximumFractionDigits: 0 })} m`;
}

function formatTime(value: number): string {
  if (value < 10) return `${value.toFixed(2)} s`;
  if (value < 90) return `${value.toFixed(1)} s`;
  return `${(value / 60).toFixed(1)} min`;
}

function formatCoordinate(value: number, axis: 'NS' | 'EW'): string {
  const hemisphere = axis === 'NS' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
  return `${Math.abs(value).toFixed(3)}° ${hemisphere}`;
}

/** Re-export so the lazy chunk has a stable default-ish shape. */
export default ImpactView;
