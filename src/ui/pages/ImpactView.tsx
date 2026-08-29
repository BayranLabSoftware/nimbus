import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { s } from '../../physics/units.js';
import { loadMosaic } from '../../scene/geo/tileMosaic.js';
import { ImpactRenderer } from '../../scene/impact/ImpactRenderer.js';
import { DEFAULT_ORBIT, clampOrbit, type OrbitState } from '../../scene/impact/camera.js';
import {
  frameAt,
  sceneFromExplosion,
  sceneFromImpact,
  type ImpactScene,
} from '../../scene/impact/scene.js';
import { SimClock, scrubToTime, timeToScrub } from '../../scene/simClock.js';
import { useAppStore, type ActiveResult, type Coordinates } from '../../store/index.js';
import { AppBar } from '../components/AppBar.js';
import styles from './ImpactView.module.css';

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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<ImpactRenderer | null>(null);
  const clockRef = useRef<SimClock | null>(null);
  const orbitRef = useRef<OrbitState>(DEFAULT_ORBIT);
  const sceneRef = useRef<ImpactScene | null>(null);
  const scrubRef = useRef<HTMLInputElement | null>(null);
  const hudRef = useRef<Record<string, HTMLSpanElement | null>>({});

  const [playing, setPlaying] = useState(true);
  const [terrain, setTerrain] = useState<TerrainState>('idle');
  const [webglFailed, setWebglFailed] = useState(false);

  const scene = buildScene(result, evaluatedAt);
  sceneRef.current = scene;

  // Effects key on stable primitives rather than on the scene object:
  // `buildScene` returns a fresh object every render, so depending on
  // it directly would tear the renderer down sixty times a second.
  const hasScene = scene !== null;
  const originLat = scene?.latitude ?? 0;
  const originLon = scene?.longitude ?? 0;
  const reachMeters = scene?.framingReach ?? 0;
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
      setWebglFailed(true);
      return;
    }
    let renderer: ImpactRenderer;
    try {
      renderer = new ImpactRenderer(gl);
    } catch (error) {
      console.warn('[ImpactView] renderer init failed:', error);
      setWebglFailed(true);
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
    clock.play();
    setPlaying(true);
    const off = clock.subscribe((state) => setPlaying(state.playing));
    return () => {
      off();
      clockRef.current = null;
    };
  }, [hasScene, durationSeconds, blastEnergy]);

  // ---- terrain -----------------------------------------------------
  useEffect(() => {
    if (!hasScene) return;
    let cancelled = false;
    setTerrain('loading');
    loadMosaic({
      latitude: originLat,
      longitude: originLon,
      spanMeters: reachMeters * 12,
      tiles: 6,
    })
      .then((mosaic) => {
        if (cancelled) return;
        rendererRef.current?.setMosaic(mosaic);
        setTerrain('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.warn('[ImpactView] terrain unavailable:', error);
        setTerrain('failed');
      });
    return () => {
      cancelled = true;
    };
  }, [hasScene, originLat, originLon, reachMeters]);

  // ---- render loop -------------------------------------------------
  useEffect(() => {
    if (!hasScene) return;
    let handle = 0;
    let last = 0;
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
    orbitRef.current = clampOrbit({
      yaw: orbitRef.current.yaw + (e.clientX - lastPointer.current.x) * 0.006,
      pitch: orbitRef.current.pitch - (e.clientY - lastPointer.current.y) * 0.004,
      zoom: orbitRef.current.zoom,
    });
    lastPointer.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      orbitRef.current = clampOrbit({
        ...orbitRef.current,
        zoom: orbitRef.current.zoom * Math.exp(e.deltaY * 0.0011),
      });
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [hasScene]);

  // ---- markup --------------------------------------------------------
  if (missing || unsupported || webglFailed) {
    return (
      <div className={styles.root}>
        <AppBar />
        <p className={styles.placeholder}>
          {webglFailed
            ? t('impactView.noWebgl')
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

      <p className={styles.hint}>{t('impactView.hint')}</p>
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
