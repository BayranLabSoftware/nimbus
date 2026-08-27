import {
  ArcGISTiledElevationTerrainProvider,
  BoundingSphere,
  CallbackProperty,
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  HeadingPitchRange,
  HeightReference,
  HorizontalOrigin,
  ImageMaterialProperty,
  LabelStyle,
  Ion,
  JulianDate,
  Math as CesiumMath,
  PolygonHierarchy,
  PolylineDashMaterialProperty,
  PolylineGlowMaterialProperty,
  Rectangle,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  UrlTemplateImageryProvider,
  Viewer,
  type Entity,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';
import { EARTH_GREAT_CIRCLE_MAX, clampToGreatCircle } from '../../physics/earthScale.js';
import { ISOTROPIC_RING, type RingAsymmetry } from '../../physics/effects/asymmetry.js';
import { aftershockShakingFootprint } from '../../physics/events/earthquake/aftershocks.js';
import type { ImpactDamageRadii } from '../../physics/events/impact/damageRings.js';
import {
  useAppStore,
  type ActiveMonteCarlo,
  type ActiveResult,
  type Coordinates,
} from '../../store/index.js';
import type { WindAdvectedAshfall } from '../../physics/events/volcano/index.js';
// extractAmplitudeContours is back (it left in Phase 16 with the old
// triangle layers): the approved tsunami direction draws the NOAA
// thresholds as marching-squares contour lines over a continuous
// amplitude veil.
import { buildExceedanceProbability } from '../../physics/uq/ecdf.js';
import {
  drawContourOverlay,
  renderScalarFieldHeatmap,
  smoothFieldForContours,
  toDeepWaterEquivalent,
  WAVE_CONTOUR_STYLES,
} from '../heatmap.js';
import { computeRunupField, extractAmplitudeContours } from '../../physics/tsunami/index.js';
import { renderRadialEcdfBitmap } from '../radialEcdfBitmap.js';
import {
  buildCrestFrames,
  extractFrontContour,
  pickRunupPeaks,
  stitchSegmentsIntoChains,
} from '../tsunamiCrest.js';
import {
  animateAftershocksImperatively,
  type AftershockAnimationSpec,
} from '../aftershockAnimation.js';
import {
  animateRingsImperatively,
  RING_INITIAL_RADIUS_M,
  type RingAnimationSpec,
  type RingKind,
} from '../ringAnimation.js';
import {
  fetchGlobalBathymetricMosaic,
  fetchTerrainGridForLocation,
  getCachedGlobalBathymetricMosaic,
} from '../terrainSampling.js';
import { buildRuptureStadiumPolygon } from '../stadiumPolygon.js';
import { AftershockDetailCard } from './AftershockDetailCard.js';
import { mushroomCloudAltitudeMeters, spawnExplosionVfxFromJoules } from './explosionVfx.js';
import { spawnEruptionColumn } from './eruptionVfx.js';
import { radialDamageMaterial } from './radialDamageMaterial.js';
import { RingTooltip, type HoverInfo, type RingTooltipKind } from './RingTooltip.js';
import styles from './Globe.module.css';

/**
 * We do not use Cesium.Ion-hosted assets (imagery, terrain) because the
 * project is open-source and we don't want to ship a bundled token or
 * force contributors to provision one. Clearing the default token also
 * silences the "Ion access token" warning at viewer startup.
 */
Ion.defaultAccessToken = '';

// Regia «documentario satellitare» (tavola 2, approvata): il globo è
// fotografia orbitale, non cartografia. Esri World Imagery è servito
// senza chiave da qualunque origine — a differenza dello Stadia/Stamen
// usato in precedenza, che fuori da localhost rispondeva 429 e lasciava
// una sfera nera — quindi il look di produzione e quello di sviluppo
// coincidono. Lo schema tile di ArcGIS è {z}/{y}/{x}, non {z}/{x}/{y}.
const BASE_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const BASE_TILE_ATTRIBUTION = 'Esri, Maxar, Earthstar Geographics, and the GIS User Community';

/**
 * Ring palette — every hex is chosen for two constraints:
 *   1. **Within-event distinguishability**. The four impact rings (or
 *      four explosion rings) coexist on the same scene; they must be
 *      separable both by hue AND by luminance, so red-green colourblind
 *      viewers still read them as a four-step damage gradient.
 *   2. **Legibility on dark backgrounds**. Every swatch must have
 *      enough lightness to register on the legend's `#0C0E14`-ish glass
 *      panel — colours like `#5B1010` looked great on the OSM tile but
 *      vanished into the legend background.
 *
 * Cross-event hex collisions (e.g. mmi9 = same wine red as the impact
 * crater rim) are accepted: the two rings never appear on the same
 * scene, and the felt-intensity gradient deliberately mirrors the
 * "violent → severe → strong" cratering palette.
 */
const RING_COLORS: Record<keyof ImpactDamageRadii, Color> = {
  craterRim: Color.fromCssColorString('#B91C1C'),
  thirdDegreeBurn: Color.fromCssColorString('#F97316'),
  /** 2nd-degree burn (5 cal/cm² Glasstone Table 7.41) — sits between
   *  the strong-orange 3rd-degree contour and the gold overpressure
   *  rings. The amber tone reads as "less severe burn" without
   *  collapsing into either neighbouring contour. */
  secondDegreeBurn: Color.fromCssColorString('#FB923C'),
  overpressure5psi: Color.fromCssColorString('#FACC15'),
  overpressure1psi: Color.fromCssColorString('#FDE047'),
  /** Outermost overpressure ring (0.5 psi scattered window damage).
   *  Pale-cream so it sits OUTSIDE the gold 1 psi contour without
   *  fighting it for visual weight. */
  lightDamage: Color.fromCssColorString('#FEF3C7'),
};

/** Initial-radiation lethal-dose contour (Glasstone §8 — drawn only
 *  for nuclear scenarios, where the dose actually escapes the
 *  fireball envelope). Purple-violet keeps it separate from the
 *  thermal/blast warm gradient so users read it as a different
 *  hazard family, not "yet another orange ring". */
const RADIATION_LD50_COLOR = Color.fromCssColorString('#A855F7');

/** Electromagnetic-pulse footprint — the line at which a typical
 *  unhardened consumer electronic is at risk of damage from the E1
 *  spike. Deep teal so the EMP ring (often huge for HEMP shots)
 *  reads as cool / electronic vs the warm thermal/blast palette. */
const EMP_AFFECTED_COLOR = Color.fromCssColorString('#06B6D4');

/** Cool-blue palette for tsunami overlays — the only oceanic element
 *  on the globe, kept distinct from the warm damage rings. Brighter
 *  sky-cyan rather than the previous mid-blue so the cavity reads as
 *  "water moving fast", not "polite map symbol". */
const TSUNAMI_CAVITY_COLOR = Color.fromCssColorString('#38BDF8');

/**
 * Wave-front amplitude rings — three concentric circles centered on
 * the source at the ground ranges where the open-ocean wave amplitude
 * drops to 5 m / 1 m / 0.3 m. Painted as outline-only ellipses so the
 * eye reads them as propagating wave fronts, not as filled damage
 * zones. Colour ramp goes warm → cool with decreasing amplitude:
 *
 *   - 5 m  (deep destructive coastal wave) — magenta-rose, the
 *     equivalent of "Tōhoku-class damage" along the closest coast.
 *   - 1 m  (significant inundation, harbours flooded, small craft
 *     destroyed) — sky-cyan.
 *   - 0.3 m (notable but rarely fatal — basin-wide tide-gauge
 *     signature of a moderate event) — pale cyan.
 *
 * The thresholds match the IUGG / Tinti 2009 tsunami-intensity scale
 * tiers used in the runup-damage description (see SimulatorPanel),
 * so the ring on the globe and the damage-tier text in the panel
 * read as the same hazard story.
 */
// Wave-front tier colours (5 m / 1 m / 0.3 m red/cyan/azure) retired
// in Phase 16; tsunami amplitude is now encoded by the discrete-band
// heatmap palette (`WAVE_AMPLITUDE_BANDS` from heatmap.ts).

/** Felt-intensity contour colours, ordered inside → outside. The
 *  ramp goes orange → red → wine so the eye reads VII–IX as an
 *  intensification rather than three flavours of the same red. */
const MMI_RING_COLORS = {
  mmi9: Color.fromCssColorString('#7F1D1D'),
  mmi8: Color.fromCssColorString('#DC2626'),
  mmi7: Color.fromCssColorString('#FB923C'),
} as const;

/** Pyroclastic-density-current reach. Rose-red rather than the
 *  previous orange-red so it reads as distinct from the magenta
 *  lateral-blast ring on the same scene. */
const PYROCLASTIC_RING_COLOR = Color.fromCssColorString('#E11D48');

/** Lateral-blast envelope (Mt St Helens-class flank decompression).
 *  Magenta-pink instead of the previous dark red — clearly different
 *  from the pyroclastic ring it shares the scene with, and the cooler
 *  hue suggests "directional pressure release" vs the thermal/runout
 *  warmth of the pyroclastic disc. */
const LATERAL_BLAST_COLOR = Color.fromCssColorString('#BE185D');

/** Wind-advected ashfall 1-mm isopach — pale grey, low-opacity fill. */
const ASHFALL_PLUME_COLOR = Color.fromCssColorString('#9CA3AF');

/** Ejecta-blanket footprint — chocolate brown rather than the previous
 *  mid-amber so it never visually merges with the gold 5 psi
 *  overpressure ring on the same impact scene. */
const EJECTA_BLANKET_COLOR = Color.fromCssColorString('#78350F');

const MARKER_ID = 'impact-marker';
const MARKER_HALO_ID = 'impact-marker-halo';
/** Marker tint — warm gold matching the existing accent token, with
 *  a soft white outline so the dot reads cleanly on both lit and
 *  shadowed terrain. */
const MARKER_COLOR = Color.fromCssColorString('#FCD34D');
const WAVEFRONT_INDICATOR_ID = 'cascade-wavefront-indicator';
/**
 * Oltre questo raggio la campitura interna sparisce e resta solo il
 * contorno acceso. Il velo interno serve alla scala in cui l'area
 * colpita è un luogo — una città, una regione; quando l'anello copre
 * un oceano intero (l'impulso termico di Chicxulub arriva
 * all'antipode, 20 015 km) i dischi pieni si sommano in una poltiglia
 * che seppellisce tutto quello che succede in mare. Alla scala
 * continentale il bordo dice già tutto: è la legge «contorni, non
 * campiture» applicata dove le campiture fanno più danno, ed è ciò
 * che rende leggibili insieme gli effetti di terra e quelli d'acqua
 * negli eventi misti.
 */
const GLOBAL_FILL_CUTOFF_M = 800_000;

/** True quando l'anello è abbastanza piccolo da meritare il velo interno. */
function fillsAtRadius(radiusM: number): boolean {
  return Number.isFinite(radiusM) && radiusM < GLOBAL_FILL_CUTOFF_M;
}

/**
 * True quando il browser disegna WebGL via software (SwiftShader,
 * llvmpipe, Mesa) invece che sulla GPU: macchine virtuali, runner di
 * CI, portatili con driver mancanti. Lì ogni fotogramma costa cento
 * volte tanto e la scena piena — imagery satellitare, HDR, bloom —
 * blocca il thread principale al punto che la pagina non risponde
 * più ai click. In quel caso vale la pena rinunciare alla regia
 * costosa e restituire un globo che si può usare.
 */
function detectsSoftwareRenderer(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') ?? probe.getContext('webgl');
    if (gl === null) return false;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(
      info === null ? gl.getParameter(gl.RENDERER) : gl.getParameter(info.UNMASKED_RENDERER_WEBGL)
    );
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
  } catch {
    return false;
  }
}

/**
 * requestAnimationFrame a cadenza limitata, che si ferma quando la
 * scheda è nascosta. Le animazioni della scena (cresta, fronte
 * d'urto) girano in ciclo per tutta la durata della visita: a 60 Hz
 * su un rasterizzatore software tengono il thread principale occupato
 * al punto che i click non vengono più serviti. A 20 Hz la
 * propagazione si legge lo stesso e la pagina resta viva.
 */
function loopAtFps(fps: number, step: (nowMs: number) => void): () => void {
  const minDeltaMs = 1_000 / fps;
  let handle = 0;
  let cancelled = false;
  let last = 0;
  const tick = (now: number): void => {
    if (cancelled) return;
    handle = requestAnimationFrame(tick);
    if (typeof document !== 'undefined' && document.hidden) return;
    if (now - last < minDeltaMs) return;
    last = now;
    step(now);
  };
  handle = requestAnimationFrame(tick);
  return (): void => {
    cancelled = true;
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(handle);
  };
}

const RING_ID_PREFIX = 'damage-ring-';
const TSUNAMI_CAVITY_ID = 'tsunami-cavity';
/** Entity ids for the three concentric wave-front rings painted at
 *  the source-amplitude → 5 m / 1 m / 0.3 m thresholds. */
// TsunamiWaveFrontId retired in Phase 16 with the closed-form ring tiers.
type MmiRingId = 'mmi-ring-7' | 'mmi-ring-8' | 'mmi-ring-9';
const PYROCLASTIC_RING_ID = 'pyroclastic-ring';
const ASHFALL_PLUME_ID = 'ashfall-plume';
const EJECTA_BLANKET_ID = 'ejecta-blanket';
const LATERAL_BLAST_ID = 'lateral-blast';
const AFTERSHOCK_ID_PREFIX = 'aftershock-';
/** Entity ids for the three "click-through" felt-intensity contours we
 *  paint around the aftershock the user has pinned. Kept as a tuple so
 *  the teardown / setup sweep stays tightly scoped. */
const AFTERSHOCK_DETAIL_IDS = [
  'aftershock-detail-mmi5',
  'aftershock-detail-mmi6',
  'aftershock-detail-mmi7',
] as const;
/** Aftershock points are colour-graded by magnitude — pale-orange for
 *  Mc-class events, deep-red for Båth-ceiling-class. */
const AFTERSHOCK_COLOR_LOW = Color.fromCssColorString('#fbbf24');
const AFTERSHOCK_COLOR_HIGH = Color.fromCssColorString('#b91c1c');
// Isochrone polylines and the arrival-time heatmap retired in Phase 16.
const FMM_AMPLITUDE_HEATMAP_ID = 'tsunami-fmm-amplitude';
const SIGMA_BAND_SUFFIX = '-sigma-band';

/**
 * Per-ring 1σ scatter expressed as a fractional half-range on the
 * radius. Sourced from the same papers cited in
 * src/physics/uq/conventions.ts and src/physics/confidence.ts —
 * single source-of-truth, just expressed in linear-radius form
 * because the visual band is rendered in metres.
 *
 * Phase 8b of the defensibility plan: render an "upper σ" band ring
 * at R(1+σ) for every entity in this table so the published scatter
 * is visually proportional to the band width. A 1.5 km MMI VII ring
 * with σ=0.25 shows a soft halo extending out to 1.875 km; the same
 * ring at σ=0.7 (e.g. pyroclastic runout) shows a halo nearly twice
 * the inner radius — visible at a glance. Rings with σ < 0.18 do not
 * qualify (the halo would be < 1 mm at typical zoom, not legible).
 *
 * The lower-bound R(1−σ) is implicit in the visualisation: the user
 * reads the inner solid ring as "the wave at least gets here" and
 * the outer halo as "but might extend this far". A symmetrical
 * inner halo would double entity count without adding clarity.
 */
const RING_RADIUS_SIGMA: Record<string, number> = {
  // Impact damage rings (Collins 2005 ± Glasstone)
  craterRim: 0.1,
  thirdDegreeBurn: 0.3,
  secondDegreeBurn: 0.3,
  overpressure5psi: 0.18,
  overpressure1psi: 0.18,
  // MMI shaking radii — Worden 2012 GMICE ±0.5 MMI ≈ ±25 % radius.
  mmi7: 0.25,
  mmi8: 0.25,
  mmi9: 0.3,
  // Radiation / EMP
  radiationLD50: 0.25,
  empAffected: 0.4,
  // Volcanic
  pyroclasticRunout: 0.7,
  lateralBlast: 0.5,
  ashfallPlume: 1.0,
  // Ejecta + tsunami cavity
  ejectaBlanket: 0.5,
  tsunamiCavity: 0.3,
};

/**
 * Every entity id the simulator pipeline creates starts with one of
 * these prefixes (or matches one of them exactly). The render effect
 * does a granular per-id sweep on the way in, and a final defensive
 * pass over this list at the end to catch anything a future addition
 * forgets to enumerate — re-running on a different click then never
 * leaves a ghost ring behind.
 */
const SIM_ENTITY_PREFIXES: readonly string[] = [
  'impact-marker', // marker dot + halo
  'damage-ring-', // RING_ID_PREFIX
  'mmi-ring-', // mmi-ring-7 / -8 / -9 (point-source disks)
  'mmi-stadium-', // mmi-stadium-7 / -8 / -9 (extended-source rupture polygons)
  'explosion-', // explosion-crater / -thermal / -5psi / -1psi / -emp / …
  'tsunami-', // cavity, wavefronts, FMM heatmaps, isochrones
  'aftershock-', // AFTERSHOCK_ID_PREFIX + AFTERSHOCK_DETAIL_IDS
  'pyroclastic-', // PYROCLASTIC_RING_ID
  'ashfall-', // ASHFALL_PLUME_ID
  'ejecta-', // EJECTA_BLANKET_ID
  'lateral-blast', // LATERAL_BLAST_ID
  'cascade-', // WAVEFRONT_INDICATOR_ID
  'fuzzy-mc-', // FUZZY_RING_ID_PREFIX
  'beacon-', // altitude beacons: airburst flash, HOB, eruption column
  'eruption-vfx-', // colonna eruttiva 3D + ombrello
  'fault-', // rupture trace polyline
];

function purgeSimulationEntities(viewer: Viewer): void {
  if (viewer.isDestroyed()) return;
  const stale = viewer.entities.values
    .filter((e) => typeof e.id === 'string' && SIM_ENTITY_PREFIXES.some((p) => e.id.startsWith(p)))
    .slice();
  for (const e of stale) viewer.entities.remove(e);
}
// Isochrone palette retired in Phase 16 with the polyline layer.
type ExplosionRingId =
  | 'explosion-crater'
  | 'explosion-thermal'
  | 'explosion-thermal-2nd'
  | 'explosion-5psi'
  | 'explosion-1psi'
  | 'explosion-light-damage'
  | 'explosion-radiation-ld50'
  | 'explosion-emp';
const FUZZY_RING_ID_PREFIX = 'fuzzy-mc-';

/**
 * Compute the {@link JulianDate} at which the sun reaches its highest
 * elevation over the supplied longitude on today's UTC date.
 *
 * Earth rotates at 15°/hour, so local solar noon at longitude L°
 * occurs at UTC 12:00 − L/15 hours. Anchoring `viewer.clock` to that
 * instant guarantees the picked point is always lit without sacrificing
 * the URL-shareability contract (every visitor opening the same link
 * sees the same lighting state, since the offset depends only on the
 * picked longitude, not on the visitor's wall clock).
 *
 * The today's-UTC-date floor keeps the seasonal sun declination — and
 * hence the realistic illumination angle on Earth's axial tilt — close
 * to "what the planet looks like right now from space," instead of
 * freezing to an arbitrary epoch.
 */
function localSolarNoonForLongitude(longitudeDeg: number): JulianDate {
  const now = new Date();
  const noonUtcMs = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    12,
    0,
    0,
    0
  );
  const offsetMs = (longitudeDeg / 15) * 3_600_000;
  return JulianDate.fromDate(new Date(noonUtcMs - offsetMs));
}

export function Globe(): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);

  // --- Hover-tooltip plumbing ----------------------------------------
  // Metadata for every "tooltip-aware" entity, keyed by entity id.
  // Populated when rings/aftershocks are added to the scene; cleared
  // when they're torn down. The mousemove handler reads this map to
  // map a picked entity back to its plain-language description.
  const tooltipMetaRef = useRef<Map<string, HoverInfo>>(new Map());
  // DOM ref used to mutate the tooltip's style.left/top imperatively
  // on every mousemove — avoids re-rendering React 60 times a second
  // just to track the cursor.
  const tooltipElRef = useRef<HTMLDivElement | null>(null);
  // The *content* of the tooltip — only changes when the cursor enters
  // or leaves a tooltip-aware entity, so React re-renders are sparse.
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  // True while a Terrarium tile fetch is in-flight for the current
  // pick. Read by the marker halo's CallbackProperty to drive the
  // breathing pulse — gives the user a visible signal that the
  // bathymetry / Vs30 data is on its way without occupying screen
  // real-estate with a separate spinner.
  const terrainPulsingRef = useRef(false);

  const setLocation = useAppStore((s) => s.setLocation);
  const selectAftershock = useAppStore((s) => s.selectAftershock);
  const selectedAftershockIndex = useAppStore((s) => s.selectedAftershockIndex);
  const location = useAppStore((s) => s.location);
  // The location at which the most recent simulation was actually
  // run. Pin marker follows the live `location` (so the user sees
  // their click move the dot), but the result entities — damage rings,
  // tsunami cavity, isochrones, all the cascading payload — stay
  // anchored on this so the previous simulation's overlay doesn't
  // teleport across the globe when the user clicks somewhere new
  // without pressing Launch.
  const lastEvaluatedAtLocation = useAppStore((s) => s.lastEvaluatedAtLocation);
  const result = useAppStore((s) => s.result);
  const bathymetricTsunami = useAppStore((s) => s.bathymetricTsunami);
  const monteCarlo = useAppStore((s) => s.monteCarlo);
  const setElevationGrid = useAppStore((s) => s.setElevationGrid);
  const setGlobalBathymetricGrid = useAppStore((s) => s.setGlobalBathymetricGrid);
  const hiddenRingKeys = useAppStore((s) => s.hiddenRingKeys);

  // The entity-rebuild useEffect below depends on `result` and friends,
  // not on `hiddenRingKeys` — flipping a legend toggle must NOT restart
  // the ring-grow animation. We mirror the current set into a ref so the
  // CallbackProperty attached to each entity's `show` can read the live
  // value every frame without triggering a re-render of the React effect.
  const hiddenRingKeysRef = useRef<ReadonlySet<string>>(hiddenRingKeys);
  useEffect(() => {
    hiddenRingKeysRef.current = hiddenRingKeys;
    // Cesium runs in request-render mode in some configurations; nudge
    // the scene so a toggle takes effect on the very next frame even
    // when the camera is idle.
    const viewer = viewerRef.current;
    if (viewer && !viewer.isDestroyed()) {
      viewer.scene.requestRender();
    }
  }, [hiddenRingKeys]);

  // Fetch a real elevation tile (AWS terrarium, zoom 8) for every
  // location the user picks. The resulting grid feeds the Wald &
  // Allen 2007 Vs30 proxy for earthquakes AND the Synolakis coastal
  // slope for tsunami run-up — replacing the default 760 m/s rock
  // reference and the 1:100 textbook beach slope with site values.
  useEffect(() => {
    if (location === null) return;
    let cancelled = false;
    terrainPulsingRef.current = true;
    fetchTerrainGridForLocation(location.latitude, location.longitude)
      .then((grid) => {
        if (!cancelled) setElevationGrid(grid);
      })
      .catch((err: unknown) => {
        // Silent fallback: no grid loaded → Vs30 stays at 760, the
        // uniform-depth tsunami model falls back. Log once so devs
        // see network failures without scaring the user.
        console.warn('[Globe] terrain tile fetch failed, falling back to defaults:', err);
      })
      .finally(() => {
        if (!cancelled) terrainPulsingRef.current = false;
      });
    return () => {
      cancelled = true;
      terrainPulsingRef.current = false;
    };
  }, [location, setElevationGrid]);

  /**
   * Phase 11 — fetch the global low-res bathymetric mosaic (16 tiles
   * @ zoom 2, ~800 KB total). Loaded once at component mount in the
   * background; cached LRU for the rest of the session. The next
   * Launch after the fetch resolves picks it up and the FMM layer
   * extends to trans-oceanic ranges. If the fetch fails the mosaic
   * stays null and the simulator falls through to the local-only
   * Phase 7 behaviour (truncated at ~75 km from source).
   */
  useEffect(() => {
    let cancelled = false;
    const cached = getCachedGlobalBathymetricMosaic();
    if (cached !== null) {
      setGlobalBathymetricGrid(cached);
      return;
    }
    fetchGlobalBathymetricMosaic()
      .then((grid) => {
        if (!cancelled) setGlobalBathymetricGrid(grid);
      })
      .catch((err: unknown) => {
        console.warn(
          '[Globe] global bathymetric mosaic fetch failed; trans-oceanic isos will be limited to the local tile:',
          err
        );
      });
    return () => {
      cancelled = true;
    };
  }, [setGlobalBathymetricGrid]);

  // --- Viewer lifecycle ------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let viewer: Viewer | null = null;
    let handler: ScreenSpaceEventHandler | null = null;

    // Cesium reaches into OffscreenCanvas and other browser APIs that
    // not every engine exposes in its dev-build configuration (WebKit
    // in particular). Swallow init failures so the surrounding
    // SimulatorPanel / About / Glossary overlay still mounts and the
    // user can at least interact with the scenario controls.
    try {
      viewer = new Viewer(container, {
        animation: false,
        baseLayerPicker: false,
        baseLayer: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        navigationHelpButton: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
      });

      // Instrumentation hook, opt-in via `?probe` in the URL: exposes
      // the viewer so an automated audit (Playwright + script) can read
      // the entity geometry actually handed to Cesium — drawn radii,
      // positions, screen projection — instead of guessing from pixels.
      // Inert for normal visitors: no query param, no handle.
      const debugParams = new URLSearchParams(window.location.search);
      if (debugParams.has('probe')) {
        (window as unknown as { __nimbusViewer?: Viewer }).__nimbusViewer = viewer;
      }
      // `?fps` mostra il contatore di fotogrammi di Cesium in un angolo
      // della scena. Serve a rispondere alla domanda che conta prima di
      // aggiungere qualunque effetto: quanto margine ha DAVVERO la
      // macchina di chi guarda? Leggere il numero sullo schermo evita
      // di dover aprire la console del browser. Inerte senza il
      // parametro, esattamente come `?probe`.
      if (debugParams.has('fps')) {
        viewer.scene.debugShowFramesPerSecond = true;
      }

      viewer.imageryLayers.removeAll();
      const baseLayer = viewer.imageryLayers.addImageryProvider(
        new UrlTemplateImageryProvider({
          url: BASE_TILE_URL,
          credit: BASE_TILE_ATTRIBUTION,
          maximumLevel: 18,
        })
      );
      // Colour grade della fotografia satellitare: desaturata di poco e
      // con un filo piu' di contrasto, verso il registro documentario —
      // mai la cartolina. Valori scelti dal vivo sulla scena reale.
      baseLayer.saturation = 0.82;
      baseLayer.contrast = 1.08;
      baseLayer.brightness = 0.92;
      baseLayer.gamma = 1.05;
      // Web Mercator si ferma a ±85°: oltre, il globo mostrerebbe il
      // proprio baseColor come un disco nero sul polo. Un tono ghiaccio
      // spento fa leggere la calotta scoperta come banchisa.
      viewer.scene.globe.baseColor = Color.fromCssColorString('#c6d1d8');

      // Phase 14 — open-data 3D terrain provider.
      //
      // Pre-Phase-14 the simulator ran on the default
      // EllipsoidTerrainProvider (a smooth sphere). Every entity drawn
      // with `height: 0` therefore sat at sea level regardless of
      // local elevation: rings around a Mt-Blanc click rendered half-
      // buried in the mountain, tsunami contours hugged the geoid
      // instead of real coastlines. The audit's "rappresentazione
      // grafica non realistica" complaint had this as a root cause.
      //
      // We use Esri/AGI's WorldElevation3D Terrain3D ImageServer —
      // the same global 30 m DEM mosaic NASA's Worldview surfaces.
      // It is a public REST endpoint and does NOT require a Cesium
      // Ion access token, matching the project's open-source policy
      // (Ion.defaultAccessToken stays empty above).
      //
      // The fetch is async: we wire the provider after the viewer is
      // constructed to keep the synchronous init path simple. If the
      // network fetch fails we silently fall back to the ellipsoid
      // surface — every entity below uses HeightReference.CLAMP_TO_
      // GROUND so the visual "downgrades" gracefully to the previous
      // flat-sphere look without throwing.
      ArcGISTiledElevationTerrainProvider.fromUrl(
        'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer'
      )
        .then((tp) => {
          if (viewer && !viewer.isDestroyed()) {
            viewer.terrainProvider = tp;
            viewer.scene.requestRender();
          }
        })
        .catch((err: unknown) => {
          console.warn('[Globe] terrain provider fetch failed; falling back to ellipsoid:', err);
        });

      // Il DEM ArcGIS (come l'imagery) è Web Mercator: oltre ±85° non
      // esistono tile di terreno e il globo resta con un foro nero sul
      // polo. Due calotte disegnate sull'ellissoide lo chiudono: a nord
      // banchisa al livello del mare, a sud il plateau antartico alla
      // sua quota reale, così non affonda sotto il bordo del DEM.
      const POLAR_CAP_COLOR = Color.fromCssColorString('#c6d1d8');
      const POLAR_CAP_RADIUS = 590_000; // 85°→90° ≈ 556 km, più un soprammesso
      for (const cap of [
        { id: 'polar-cap-north', lat: 90, height: 0 },
        { id: 'polar-cap-south', lat: -90, height: 2_700 },
      ]) {
        viewer.entities.add({
          id: cap.id,
          position: Cartesian3.fromDegrees(0, cap.lat),
          ellipse: {
            semiMajorAxis: POLAR_CAP_RADIUS,
            semiMinorAxis: POLAR_CAP_RADIUS,
            height: cap.height,
            material: POLAR_CAP_COLOR,
          },
        });
      }

      // Live solar illumination: the globe is shaded by the sun's real
      // position at the clock's current time. When a location is later
      // picked, `viewer.clock.currentTime` is anchored to the local
      // solar noon of that longitude (see `localSolarNoonForLongitude`)
      // so the event point is always lit AND every visitor opening
      // the same URL sees the same lighting state. The night fade
      // distances are stretched so the terminator stays visible at the
      // wide camera framings the simulator uses for global-scale events
      // (Tōhoku tsunami, Chicxulub thermal pulse, …) instead of the
      // day-side hemisphere washing out into uniform daylight.
      const softwareRenderer = detectsSoftwareRenderer();
      softwareRendererRef.current = softwareRenderer;
      viewer.scene.globe.enableLighting = !softwareRenderer;
      viewer.scene.globe.dynamicAtmosphereLighting = true;
      viewer.scene.globe.nightFadeOutDistance = 40_000_000;
      viewer.scene.globe.nightFadeInDistance = 100_000_000;
      // Modest atmosphere boost — the default `10` reads flat next
      // to the bright OSM imagery; bumping to 12 gives the lit side a
      // slightly richer "Apollo image" sheen without sliding into the
      // saturated-postcard look the art-direction doc rules out.
      viewer.scene.globe.atmosphereLightIntensity = 12;
      // Limb atmosphere: a touch more saturated, a touch dimmer so
      // the day–night terminator carries more visible depth. Cesium
      // types `skyAtmosphere` as optional because some build modes
      // strip it; in our default Viewer config it is always present.
      if (viewer.scene.skyAtmosphere !== undefined) {
        viewer.scene.skyAtmosphere.brightnessShift = 0.08;
        viewer.scene.skyAtmosphere.saturationShift = 0.22;
        viewer.scene.skyAtmosphere.hueShift = -0.015;
      }
      // Un velo d'aria sui fianchi del globo: alle inquadrature larghe
      // del simulatore ammorbidisce l'orizzonte senza mangiare dettaglio.
      viewer.scene.fog.density = 0.00012;
      if (softwareRenderer) viewer.scene.fog.enabled = false;
      // Su un rasterizzatore software la regia costosa va lasciata
      // perdere: senza GPU ogni fotogramma con bloom+HDR arriva a
      // centinaia di ms e il globo smette di rispondere.
      if (softwareRenderer) {
        // Numeri misurati su questa scena a 1440×900 con SwiftShader,
        // partendo da 590 ms per fotogramma (≈ 1,7 fps: i click
        // arrivavano dopo secondi):
        //   LOD del terreno grossolano   590 → 103 ms
        //   atmosfera + nebbia spente    → −200 ms
        //   illuminazione solare spenta  → −35 ms
        //   risoluzione ridotta          → −25 ms
        // Insieme riportano la scena a ~10 fps: si perde la regia
        // atmosferica, ma su una macchina senza GPU l'alternativa è
        // un globo che non risponde.
        console.info('[Globe] software WebGL rilevato: scena alleggerita');
        viewer.resolutionScale = 0.6;
        viewer.scene.globe.maximumScreenSpaceError = 12;
        viewer.scene.globe.showGroundAtmosphere = false;
        viewer.scene.fog.enabled = false;
        viewer.scene.globe.enableLighting = false;
        if (viewer.scene.skyAtmosphere !== undefined) viewer.scene.skyAtmosphere.show = false;
      }
      // HDR: con l'imagery fotografica lascia respirare le alte luci
      // (ghiacci, deserti) invece di tosarle al bianco.
      viewer.scene.highDynamicRange = !softwareRenderer;
      // Bloom tenue sui bordi caldi (anelli, cresta d'onda, marker):
      // valori scelti dal vivo — sotto questa soglia non si nota,
      // sopra scivola nel videogioco.
      const bloom = viewer.scene.postProcessStages.bloom;
      bloom.enabled = !softwareRenderer;
      // Cesium tipizza `uniforms` come `any`; il contratto reale del
      // BloomStage è questo quintetto numerico.
      const bloomUniforms = bloom.uniforms as {
        contrast: number;
        brightness: number;
        delta: number;
        sigma: number;
        stepSize: number;
      };
      bloomUniforms.contrast = 110;
      bloomUniforms.brightness = -0.4;
      bloomUniforms.delta = 0.9;
      bloomUniforms.sigma = 2.2;
      bloomUniforms.stepSize = 1.6;

      // --- Camera controls -------------------------------------------
      // Cesium ships with all six gestures wired to the trackball
      // (left-drag pan, wheel zoom, right-drag rotate, mid-drag tilt,
      // shift-drag spin, ctrl-drag look). For a popular-science
      // simulator targeting users who don't regularly fly cameras
      // around 3D scenes, the rotate / tilt / look set is the source
      // of "I lost the globe" reports — a stray right-drag flips the
      // pole and the user has no anchor to recover from. Lock the
      // camera to a north-up trackball: pan + zoom + click-pick is
      // the entire interaction surface.
      const ctrl = viewer.scene.screenSpaceCameraController;
      // Left-drag (Cesium's "rotate" gesture in 3D mode) stays on —
      // that's the natural "spin the globe under the camera" feel
      // people expect from a 3D Earth. We only disable the gestures
      // that lose orientation: middle-drag tilt and ctrl-drag look.
      ctrl.enableRotate = true;
      ctrl.enableTilt = false;
      ctrl.enableLook = false;
      // Bound the zoom so a wheel-spin off the limb doesn't fling the
      // camera into deep space. 1 km close is enough for "smallest
      // ring still readable" framings; 30 000 km out fits the entire
      // visible disc without showing the void around it.
      ctrl.minimumZoomDistance = 1_000;
      ctrl.maximumZoomDistance = 30_000_000;
      // Tone down the inertia so a gentle drag doesn't drift for
      // half a second after release — predictable feels less
      // "lost in space".
      ctrl.inertiaTranslate = 0.5;
      ctrl.inertiaZoom = 0.4;
      ctrl.inertiaSpin = 0;

      handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((event: ScreenSpaceEventHandler.PositionedEvent) => {
        const activeViewer = viewerRef.current;
        if (!activeViewer || activeViewer.isDestroyed()) return;

        // Click-through aftershock detail: when the user clicks a
        // dot in the post-mainshock cloud we pin that aftershock
        // instead of shifting the epicentre. drillPick walks every
        // pickable at the cursor, so the dot is preferred over the
        // imagery layer behind it.
        const picks = activeViewer.scene.drillPick(event.position);
        for (const p of picks) {
          const pickedId = (p as { id?: { id?: unknown } | undefined }).id?.id;
          if (typeof pickedId === 'string' && pickedId.startsWith(AFTERSHOCK_ID_PREFIX)) {
            const idxString = pickedId.slice(AFTERSHOCK_ID_PREFIX.length);
            const idx = Number.parseInt(idxString, 10);
            if (Number.isFinite(idx) && idx >= 0) {
              selectAftershock(idx);
              return;
            }
          }
        }

        // Empty-globe click: shift the simulation epicentre (which
        // also clears any pinned aftershock — see store action).
        const cartesian = viewer?.camera.pickEllipsoid(
          event.position,
          viewer.scene.globe.ellipsoid
        );
        if (!cartesian) return;
        const carto = Cartographic.fromCartesian(cartesian);
        const coords: Coordinates = {
          latitude: CesiumMath.toDegrees(carto.latitude),
          longitude: CesiumMath.toDegrees(carto.longitude),
        };
        setLocation(coords);
      }, ScreenSpaceEventType.LEFT_CLICK);

      // Hover tooltip: track the cursor and resolve picked entities to
      // plain-language ring / aftershock descriptions.
      //   - Position update is a direct DOM mutation (no React render).
      //   - Content swap goes through `setHoverInfo`, which only fires
      //     when the picked entity actually changes (reference compare).
      //   - drillPick walks every entity at the cursor so we can pick
      //     the *smallest* containing ring rather than whichever
      //     happens to be on top — the smallest ring is the most
      //     specific damage threshold and the most useful tooltip.
      handler.setInputAction((event: ScreenSpaceEventHandler.MotionEvent) => {
        const activeViewer = viewerRef.current;
        if (!activeViewer || activeViewer.isDestroyed()) return;
        const tooltipEl = tooltipElRef.current;
        if (tooltipEl !== null) {
          tooltipEl.style.left = `${(event.endPosition.x + 16).toString()}px`;
          tooltipEl.style.top = `${(event.endPosition.y + 16).toString()}px`;
        }
        const picks = activeViewer.scene.drillPick(event.endPosition);
        let bestRing: HoverInfo | null = null;
        let bestRadius = Infinity;
        let aftershockHit: HoverInfo | null = null;
        for (const p of picks) {
          const pickedId = (p as { id?: { id?: unknown } | undefined }).id?.id;
          if (typeof pickedId !== 'string') continue;
          const meta = tooltipMetaRef.current.get(pickedId);
          if (!meta) continue;
          if (meta.type === 'ring' && meta.radiusM < bestRadius) {
            bestRing = meta;
            bestRadius = meta.radiusM;
          } else if (meta.type === 'aftershock' && aftershockHit === null) {
            aftershockHit = meta;
          }
        }
        const next = bestRing ?? aftershockHit;
        setHoverInfo((prev) => (prev === next ? prev : next));
      }, ScreenSpaceEventType.MOUSE_MOVE);

      viewerRef.current = viewer;

      // WebGL context-loss survival ----------------------------------
      // When the user resizes the window aggressively, switches the
      // browser to a backgrounded power-saver tab, or the GPU driver
      // hiccups, the underlying WebGL context is destroyed without a
      // JS-visible error. Without these handlers the canvas freezes
      // on its last drawn frame (or fades to a flat clear colour)
      // and the user sees no globe — but every Cesium primitive is
      // still alive in JS, so it looks like a hang. The default
      // browser behaviour for `webglcontextlost` is to NOT fire
      // `webglcontextrestored` unless we call `preventDefault()`
      // here.
      const canvasEl = viewer.scene.canvas;
      const onContextLost = (e: Event): void => {
        e.preventDefault();
        console.warn('[Globe] WebGL context lost; awaiting restoration.');
      };
      const onContextRestored = (): void => {
        console.warn('[Globe] WebGL context restored; forcing re-render.');
        const v = viewerRef.current;
        if (v && !v.isDestroyed()) {
          v.resize();
          v.scene.requestRender();
        }
      };
      canvasEl.addEventListener('webglcontextlost', onContextLost, false);
      canvasEl.addEventListener('webglcontextrestored', onContextRestored, false);

      // Cesium's MOUSE_MOVE only fires while the cursor is over the
      // canvas. When the cursor crosses into an overlay (the
      // SimulatorPanel, the ring legend, a Radix dialog) no leave
      // event reaches the screen-space handler, so the ring tooltip
      // stays stuck at its last canvas-relative position — which on
      // screen ends up sitting on top of the panel the user just
      // moved over. A DOM-level mouseleave on the canvas dismisses
      // the tooltip the moment the cursor exits the WebGL surface.
      const onCanvasLeave = (): void => {
        setHoverInfo(null);
      };
      canvasEl.addEventListener('mouseleave', onCanvasLeave, false);

      // Belt-and-braces resize observer. Cesium has its own internal
      // resize listener wired to the window-level `resize` event, but
      // it doesn't fire when the *parent container* resizes
      // independently of the window (e.g. CSS layout reflow, mobile
      // panel collapsing, devtools docking). Without this observer
      // the drawing buffer stays at the original size and primitives
      // appear to vanish even though the entities are still alive.
      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          const v = viewerRef.current;
          if (v && !v.isDestroyed()) {
            v.resize();
            v.scene.requestRender();
          }
        });
        resizeObserver.observe(container);
      }
      // Stash the cleanup hooks on the viewer so the unmount path can
      // tear them down without re-resolving the canvas reference.
      (
        viewer as Viewer & {
          __visTeardown?: () => void;
        }
      ).__visTeardown = (): void => {
        canvasEl.removeEventListener('webglcontextlost', onContextLost, false);
        canvasEl.removeEventListener('webglcontextrestored', onContextRestored, false);
        canvasEl.removeEventListener('mouseleave', onCanvasLeave, false);
        resizeObserver?.disconnect();
      };
    } catch (err) {
      // Browser can't run Cesium (e.g. Safari < 16.4 without
      // OffscreenCanvas). Log once; the rest of the app keeps working.
      console.warn('[Globe] Cesium viewer initialisation failed:', err);
      viewerRef.current = null;
      return undefined;
    }

    const cleanupViewer = viewer;
    const cleanupHandler = handler;
    return () => {
      cleanupHandler.destroy();
      // Detach the WebGL-context-loss listeners and the
      // ResizeObserver before destroying the viewer — the destroy
      // call clears the canvas reference, after which removeEventListener
      // would silently succeed against a stale element.
      const teardown = (
        cleanupViewer as Viewer & {
          __visTeardown?: () => void;
        }
      ).__visTeardown;
      if (teardown) teardown();
      cleanupViewer.destroy();
      viewerRef.current = null;
    };
  }, [setLocation, selectAftershock]);

  // --- Marker + damage rings ------------------------------------------
  // Cancel function for the currently-running ring animation; reset
  // on every re-evaluate so stale rAF loops don't keep writing into
  // entities that have been removed.
  const cancelRingAnimationRef = useRef<(() => void) | null>(null);
  // Same for the aftershock progressive-reveal loop; aftershocks live
  // longer than rings (15 s UI window vs ≤ 4 s for shockwaves) so
  // a re-evaluate while one is still mid-flight is the common case.
  const cancelAftershockAnimationRef = useRef<(() => void) | null>(null);
  // Cleanup for the impact / explosion mushroom-cloud particle VFX —
  // each spawn returns a teardown function, we hold it here and run it
  // on the next evaluate so stale particle systems don't accumulate
  // when the user re-runs a scenario or jumps between event types.
  const cancelExplosionVfxRef = useRef<(() => void) | null>(null);
  // Cleanup for the wavefront-indicator rAF loop (the bright outline
  // ring that grows linearly at the head of the cascade). Cancelled
  // on every re-evaluate so stale loops don't keep mutating an entity
  // that's about to be removed by the stale-entity sweep.
  const cancelWavefrontRef = useRef<(() => void) | null>(null);
  const cancelCrestRef = useRef<(() => void) | null>(null);
  /** Rasterizzatore software: la scena gira in modalità leggera. */
  const softwareRendererRef = useRef(false);
  /** Annulla la ritirata programmata della camera (battuta 2). */
  const cancelOverviewFlyRef = useRef<(() => void) | null>(null);
  // Track the previous result/MC/bathy references so the render
  // effect can short-circuit when only `location` changed: we still
  // want the pin marker to move with the click, but the heavy
  // result-rendering work (sweep + ring rebuild + cascade + camera
  // fly) must NOT re-run, otherwise panning the pin looks like a
  // fresh simulation kicked off.
  const prevResultRef = useRef<typeof result>(null);
  const prevBathymetricRef = useRef<typeof bathymetricTsunami>(null);
  const prevMonteCarloRef = useRef<typeof monteCarlo>(null);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    // Cancel any ring animation still in flight from the previous
    // evaluate — its entities are about to be removed below.
    if (cancelRingAnimationRef.current) {
      cancelRingAnimationRef.current();
      cancelRingAnimationRef.current = null;
    }
    if (cancelAftershockAnimationRef.current) {
      cancelAftershockAnimationRef.current();
      cancelAftershockAnimationRef.current = null;
    }
    // Tear down any lingering explosion-VFX particle systems before
    // we set up the new scenario; otherwise the previous mushroom
    // cloud would keep emitting smoke through the new event's cascade.
    if (cancelExplosionVfxRef.current) {
      cancelExplosionVfxRef.current();
      cancelExplosionVfxRef.current = null;
    }
    // Same for the wavefront-indicator rAF loop — stop it before its
    // entity is removed by the stale-entity sweep below.
    if (cancelWavefrontRef.current) {
      cancelWavefrontRef.current();
      cancelWavefrontRef.current = null;
    }
    if (cancelCrestRef.current) {
      cancelCrestRef.current();
      cancelCrestRef.current = null;
    }
    if (cancelOverviewFlyRef.current) {
      cancelOverviewFlyRef.current();
      cancelOverviewFlyRef.current = null;
    }

    // Drop tooltip metadata that's about to belong to vanished entities,
    // and clear any in-flight hover so a stale reference doesn't survive
    // into the next scenario.
    tooltipMetaRef.current.clear();
    setHoverInfo(null);

    /** Register tooltip metadata for an entity. Called inline at every
     *  add() site so the metadata Map stays in lock-step with the
     *  Cesium entity collection. Also wires a `CallbackProperty` to the
     *  entity's `show` flag so the legend's per-row visibility toggle
     *  takes effect immediately — without rebuilding the entity (and
     *  therefore without restarting the ring-grow animation). */
    const registerRingTooltip = (
      entityId: string,
      kind: RingTooltipKind,
      radiusM: number,
      tint: Color
    ): void => {
      tooltipMetaRef.current.set(entityId, {
        type: 'ring',
        kind,
        radiusM,
        color: tint.toCssHexString(),
      });
      const entity = viewer.entities.getById(entityId);
      if (entity === undefined) return;
      const showProperty = new CallbackProperty(() => !hiddenRingKeysRef.current.has(kind), false);
      // The ring may be rendered as either an ellipse (point-source
      // disk) or a polygon (extended-source rupture stadium for big
      // earthquakes). Wire the legend toggle to whichever Graphics
      // primitive the entity actually carries.
      if (entity.ellipse !== undefined) entity.ellipse.show = showProperty;
      if (entity.polygon !== undefined) entity.polygon.show = showProperty;
    };

    /** Aftershock counterpart: stores the magnitude + onset so the
     *  tooltip can show "Mw 5.4 · ≈ 2 h after the mainshock". */
    const registerAftershockTooltip = (
      entityId: string,
      magnitude: number,
      timeAfterMainshock: number,
      tint: Color
    ): void => {
      tooltipMetaRef.current.set(entityId, {
        type: 'aftershock',
        magnitude,
        timeAfterMainshock,
        color: tint.toCssHexString(),
      });
    };

    // Detect whether anything has changed beyond the pin position. If
    // only `location` shifted (the user clicked a new point without
    // pressing Launch) we just want to move the marker — the result
    // rings, tsunami cavity, isochrones and FMM heatmap should keep
    // pointing at wherever evaluate last ran. Comparing references is
    // enough: every store action that mutates these slices writes a
    // new object via Zustand's set, so a stable reference means the
    // payload genuinely hasn't changed.
    const resultChanged =
      prevResultRef.current !== result ||
      prevBathymetricRef.current !== bathymetricTsunami ||
      prevMonteCarloRef.current !== monteCarlo;
    prevResultRef.current = result;
    prevBathymetricRef.current = bathymetricTsunami;
    prevMonteCarloRef.current = monteCarlo;

    // The marker (pin + halo) always tracks the live click position,
    // so we tear it down and rebuild it on every render — cheap, two
    // entities. The heavier result-derived sweep is gated below.
    const existingMarker = viewer.entities.getById(MARKER_ID);
    if (existingMarker) viewer.entities.remove(existingMarker);
    const existingHalo = viewer.entities.getById(MARKER_HALO_ID);
    if (existingHalo) viewer.entities.remove(existingHalo);

    if (!location) {
      // No pin → wipe everything (result + marker) and bail.
      purgeSimulationEntities(viewer);
      viewer.scene.requestRender();
      return;
    }

    // Result didn't change since the last render — just refresh the
    // marker and stop. Skips the prefix sweep, the cascade animation
    // and the camera fly-to, so panning the pin doesn't replay the
    // ring-grow sequence on the screen.
    if (!resultChanged) {
      // Re-create the marker at the new pin and exit.
      const movedPin = Cartesian3.fromDegrees(location.longitude, location.latitude);
      const haloOutlineProp = new CallbackProperty(() => {
        if (!terrainPulsingRef.current) return MARKER_COLOR.withAlpha(0.5);
        const t = (Date.now() % 1_400) / 1_400;
        const alpha = 0.55 + 0.3 * Math.sin(t * Math.PI * 2);
        return MARKER_COLOR.withAlpha(alpha);
      }, false);
      viewer.entities.add({
        id: MARKER_HALO_ID,
        position: movedPin,
        point: {
          pixelSize: 18,
          color: MARKER_COLOR.withAlpha(0.0),
          outlineColor: haloOutlineProp,
          outlineWidth: 1.5,
        },
      });
      viewer.entities.add({
        id: MARKER_ID,
        position: movedPin,
        point: {
          pixelSize: 8,
          color: MARKER_COLOR,
          outlineColor: Color.WHITE.withAlpha(0.55),
          outlineWidth: 1.5,
        },
      });
      viewer.scene.requestRender();
      return;
    }

    // Result genuinely changed — sweep the previous run's overlays
    // (tsunami contours, MMI rings, FMM heatmap, etc.) and rebuild
    // from the new payload. The prefix sweep also pulls down the
    // stale marker, which the block below re-creates.
    purgeSimulationEntities(viewer);

    // Anchor the sun to local solar noon over the picked longitude.
    // Driven from the rendering effect (not the viewer-init effect) so
    // every click recomputes the illumination — the lighting follows
    // the user across the globe instead of freezing at the first
    // location. Determinism: the result depends only on `longitude` and
    // today's UTC date, which is identical for all visitors opening the
    // same URL within the same day.
    viewer.clock.currentTime = localSolarNoonForLongitude(location.longitude);

    // Pin marker is at the live click point. Result-derived overlays
    // (rings, tsunami cavity, FMM heatmap, …) anchor on the location
    // the simulator was last run against — so panning the pin to a
    // new spot does not drag the previous run's rings along with it.
    const pinCartesian = Cartesian3.fromDegrees(location.longitude, location.latitude);
    const ringAnchor = lastEvaluatedAtLocation ?? location;
    const centerCartesian = Cartesian3.fromDegrees(ringAnchor.longitude, ringAnchor.latitude);
    /** Accumulates ring-animation specs as we register entities with
     *  initial semiMajor/Minor = 0. After every branch has added its
     *  entities we fire `animateRingsImperatively(specs)` to ramp
     *  them all from 0 to the final radius in one coordinated pass. */
    const ringSpecs: RingAnimationSpec[] = [];
    const scheduleRing = (
      entity: Entity,
      kind: RingKind,
      semiMajor: number,
      semiMinor?: number
    ): void => {
      const spec: RingAnimationSpec = { entity, kind, finalSemiMajor: semiMajor };
      if (semiMinor !== undefined) spec.finalSemiMinor = semiMinor;
      ringSpecs.push(spec);
    };

    /**
     * Resolve a {@link RingAsymmetry} record produced by Layer 2 into
     * the four numbers a Cesium ellipse needs to render the asymmetric
     * shape: a shifted geographic centre, the two ramped axes, and
     * the rotation angle.
     *
     * Compass azimuth (CW from North) is converted to Cesium's
     * counter-clockwise-from-East (`cesiumRotation = π/2 − azimuthRad`).
     * The 1° = 111 km approximation matches the existing inline
     * pattern used for the ejecta blanket and the ashfall plume.
     */
    const computeAsymmetricGeometry = (
      asymmetry: RingAsymmetry,
      nominalRadius: number,
      centerLat: number,
      centerLon: number
    ): {
      position: Cartesian3;
      semiMajor: number;
      semiMinor: number;
      cesiumRotation: number;
    } => {
      const azimuthRad = (asymmetry.azimuthDeg * Math.PI) / 180;
      const semiMajor = nominalRadius * asymmetry.semiMajorMultiplier;
      const semiMinor = nominalRadius * asymmetry.semiMinorMultiplier;
      const offset = asymmetry.centerOffsetMeters;
      const latRad = (centerLat * Math.PI) / 180;
      const dLat = offset === 0 ? 0 : (offset * Math.cos(azimuthRad)) / 111_000;
      const dLon =
        offset === 0
          ? 0
          : (offset * Math.sin(azimuthRad)) / (111_000 * Math.max(Math.cos(latRad), 1e-6));
      return {
        position: Cartesian3.fromDegrees(centerLon + dLon, centerLat + dLat),
        semiMajor,
        semiMinor,
        cesiumRotation: Math.PI / 2 - azimuthRad,
      };
    };

    /**
     * Paint the three tsunami wave-front contours at the radii where
     * the open-ocean amplitude drops to 5 m / 1 m / 0.3 m.
     *
     * Two rendering paths, picked at call time:
     *
     *   - **Bathymetric path (preferred).** When `bathymetricTsunami
     *     .amplitude` is populated by the orchestrator (i.e. an
     *     elevation grid was available at simulate time), we extract
     *     iso-amplitude contours from the Green-shoaled FMM amplitude
     *     field via marching squares. The resulting polylines follow
     *     the actual coastlines — no more circles cutting across the
     *     Alps or the Tibetan plateau.
     *   - **Closed-form fallback.** When no bathymetric grid is
     *     available, we draw concentric circles using the inverse of
     *     the same amplitude-vs-distance law the simulator uses:
     *       Cavity sources (Ward & Asphaug 2000):
     *         A(r) = A₀ · R_C / r          ⇒  r = A₀ · R_C / A_target
     *       Cylindrical line sources (megathrust):
     *         A(r) = A₀ · √(R₀ / r)        ⇒  r = R₀ · (A₀ / A_target)²
     *
     * Both paths register the same hover-tooltip vocabulary so the
     * user reads identical "what happens at this distance" text on
     * both circle and polyline contours. Rings clamped past the
     * great-circle antipode use {@link clampToGreatCircle}; tiers
     * whose amplitude exceeds the source value are skipped.
     */
    // Phase 16 — wave-direction triangle-glyph helpers. The previous
    // tier-based wave-front cascade (5 m / 1 m / 0.3 m closed-form
    // ellipses + iso-amplitude polylines/triangles) has been retired
    // in favour of a unified "regular-grid arrows over a discrete-
    // band amplitude heatmap" representation: the heatmap encodes the
    // wave height in NOAA-standard amplitude bands (≥ 1 m only) and
    // the arrows encode the local eikonal-ray direction (∇T). Both
    // layers are honest to the FMM math — arrows appear ONLY where
    // the simulation says the wave actually reaches with > 1 m
    // amplitude, on ocean cells (FMM marks land / unreachable as
    // Infinity arrival time). No synthetic closed-form fallback;
    // events that don't propagate to a useful amplitude simply do
    // not get a tsunami overlay, which is the physically honest
    // outcome.
    /**
     * Scia-cometa (regia tsunami): un breve tratto luminoso orientato
     * col fronte, testa avanti e coda che sfuma (taper del materiale
     * glow). Sostituisce il tappeto di freccine: un ordine di
     * grandezza in meno di segni, e la densità — non la forma —
     * racconta l'ampiezza.
     */
    const buildCometPositions = (
      lat0: number,
      lon0: number,
      dirEast: number,
      dirNorth: number,
      lengthM: number
    ): Cartesian3[] | null => {
      const mag = Math.hypot(dirEast, dirNorth);
      if (mag === 0) return null;
      const dx = dirEast / mag;
      const dy = dirNorth / mag;
      const cosLat = Math.max(Math.cos((lat0 * Math.PI) / 180), 1e-6);
      const mPerLat = 111_000;
      const mPerLon = 111_000 * cosLat;
      const headLat = lat0 + (0.35 * lengthM * dy) / mPerLat;
      const headLon = lon0 + (0.35 * lengthM * dx) / mPerLon;
      const tailLat = lat0 - (0.65 * lengthM * dy) / mPerLat;
      const tailLon = lon0 - (0.65 * lengthM * dx) / mPerLon;
      if (Math.abs(headLat) > 89 || Math.abs(tailLat) > 89) return null;
      return [
        Cartesian3.fromDegrees(headLon, headLat, 1_500),
        Cartesian3.fromDegrees(tailLon, tailLat, 1_500),
      ];
    };

    /** Hash deterministico cella→[0,1) per la semina pesata: stessa
     *  URL, stessa scena — niente Math.random nella regia. */
    const cellHash01 = (a: number, b: number): number => {
      let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0;
      h = Math.imul(h ^ (h >>> 13), 1274126177) | 0;
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };

    /**
     * Marcatori d'impatto costiero (regia tsunami): dove il run-up
     * Synolakis supera la soglia, un punto pulsante sulla costa,
     * dimensionato e tinto sul run-up. Il battito vive in una
     * CallbackProperty sull'alone; con prefers-reduced-motion il
     * marcatore resta acceso fisso.
     */
    const addRunupMarkers = (
      peaks: readonly { latitude: number; longitude: number; runupM: number }[],
      idPrefix: string
    ): void => {
      const reduce =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      peaks.forEach((peak, index) => {
        const tint =
          peak.runupM >= 10
            ? Color.fromCssColorString('#CC3C26')
            : peak.runupM >= 5
              ? Color.fromCssColorString('#E06E28')
              : Color.fromCssColorString('#E8A33D');
        const size = 7 + 9 * Math.min(1, peak.runupM / 15);
        const phase = (index * 467) % 1_400;
        const haloColor = reduce
          ? tint.withAlpha(0.5)
          : new CallbackProperty(() => {
              const t = ((Date.now() + phase) % 1_400) / 1_400;
              return tint.withAlpha(0.25 + 0.35 * Math.sin(t * Math.PI * 2) ** 2);
            }, false);
        viewer.entities.add({
          id: `${idPrefix}-${index.toString()}`,
          position: Cartesian3.fromDegrees(peak.longitude, peak.latitude, 2_000),
          point: {
            pixelSize: size,
            color: tint.withAlpha(0.9),
            outlineColor: haloColor,
            outlineWidth: 5,
          },
        });
        registerRingTooltip(`${idPrefix}-${index.toString()}`, 'tsunamiRunup', peak.runupM, tint);
      });
    };

    /**
     * Faro di quota (tavola 4): un segno verticale al punto in cui
     * succede la cosa — lo scoppio dell'airburst, la detonazione in
     * quota, la sommità della colonna eruttiva — con la tacca
     * dell'altitudine in mono. Un fusto luminoso che sfuma verso il
     * suolo e un vertice che pulsa piano: l'unica cosa che distingue
     * un evento in quota da uno al suolo, prima invisibile.
     */
    const addAltitudeBeacon = (opts: {
      idPrefix: string;
      latitude: number;
      longitude: number;
      altitudeM: number;
      color: Color;
    }): void => {
      if (!Number.isFinite(opts.altitudeM) || opts.altitudeM < 500) return;
      const top = Cartesian3.fromDegrees(opts.longitude, opts.latitude, opts.altitudeM);
      viewer.entities.add({
        id: `${opts.idPrefix}-shaft`,
        polyline: {
          // Vertice per primo: il taper del glow lascia il fusto
          // acceso in alto e lo sfuma verso terra.
          positions: [top, Cartesian3.fromDegrees(opts.longitude, opts.latitude, 0)],
          width: 4,
          material: new PolylineGlowMaterialProperty({
            color: opts.color.withAlpha(0.8),
            glowPower: 0.35,
            taperPower: 0.55,
          }),
        },
      });
      const reduce =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const haloColor = reduce
        ? opts.color.withAlpha(0.45)
        : new CallbackProperty(() => {
            const t = (Date.now() % 1_800) / 1_800;
            return opts.color.withAlpha(0.2 + 0.35 * Math.sin(t * Math.PI * 2) ** 2);
          }, false);
      const km = opts.altitudeM / 1_000;
      viewer.entities.add({
        id: `${opts.idPrefix}-top`,
        position: top,
        point: {
          pixelSize: 9,
          color: Color.WHITE.withAlpha(0.95),
          outlineColor: haloColor,
          outlineWidth: 6,
        },
        label: {
          text: `${km >= 10 ? km.toFixed(0) : km.toFixed(1)} km`,
          font: '11px "JetBrains Mono", monospace',
          fillColor: opts.color.withAlpha(0.95),
          outlineColor: Color.fromCssColorString('#0A0E16').withAlpha(0.85),
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cartesian2(26, 0),
          horizontalOrigin: HorizontalOrigin.LEFT,
        },
      });
    };

    const sampleArrivalGradient = (
      arrivalTimes: Float32Array,
      gnLat: number,
      gnLon: number,
      gMinLat: number,
      gMaxLat: number,
      gMinLon: number,
      gMaxLon: number,
      lat: number,
      lon: number
    ): { east: number; north: number } => {
      const ti = ((gnLat - 1) * (gMaxLat - lat)) / (gMaxLat - gMinLat);
      const tj = ((gnLon - 1) * (lon - gMinLon)) / (gMaxLon - gMinLon);
      const i = Math.round(ti);
      const j = Math.round(tj);
      if (i <= 0 || i >= gnLat - 1 || j <= 0 || j >= gnLon - 1) return { east: 0, north: 0 };
      const tC = arrivalTimes[i * gnLon + j] ?? Number.POSITIVE_INFINITY;
      if (!Number.isFinite(tC)) return { east: 0, north: 0 };
      const tN = arrivalTimes[(i - 1) * gnLon + j] ?? Number.POSITIVE_INFINITY;
      const tS = arrivalTimes[(i + 1) * gnLon + j] ?? Number.POSITIVE_INFINITY;
      const tE = arrivalTimes[i * gnLon + (j + 1)] ?? Number.POSITIVE_INFINITY;
      const tW = arrivalTimes[i * gnLon + (j - 1)] ?? Number.POSITIVE_INFINITY;
      let dNorth = 0;
      if (Number.isFinite(tN) && Number.isFinite(tS)) dNorth = (tN - tS) / 2;
      else if (Number.isFinite(tN)) dNorth = tN - tC;
      else if (Number.isFinite(tS)) dNorth = tC - tS;
      let dEast = 0;
      if (Number.isFinite(tE) && Number.isFinite(tW)) dEast = (tE - tW) / 2;
      else if (Number.isFinite(tE)) dEast = tE - tC;
      else if (Number.isFinite(tW)) dEast = tC - tW;
      return { north: dNorth, east: dEast };
    };

    /**
     * Phase 8b — make the published 1σ scatter visually proportional
     * to the band width on the globe. After the main ring is spawned
     * via scheduleRing, this helper adds a sibling "upper-σ" entity
     * at R(1+σ) with a soft fill + thin outline. The eye reads the
     * inner solid contour as "best estimate" and the outer halo as
     * "the wave might extend this far".
     *
     * Pulls σ from RING_RADIUS_SIGMA. Returns silently when σ is
     * below 0.18 (halo would be < 1 mm at typical zoom — not legible).
     */
    const addUpperSigmaBand = (
      baseEntityId: string,
      sigmaKey: string,
      kind: RingKind,
      baseSemiMajor: number,
      baseSemiMinor: number,
      position: Cartesian3,
      color: Color,
      cesiumRotation: number
    ): void => {
      const sigma = RING_RADIUS_SIGMA[sigmaKey];
      if (sigma === undefined || sigma < 0.18) return;
      const upperSemiMajor = clampToGreatCircle(baseSemiMajor * (1 + sigma));
      const upperSemiMinor = clampToGreatCircle(baseSemiMinor * (1 + sigma));
      if (!Number.isFinite(upperSemiMajor) || upperSemiMajor <= baseSemiMajor) return;
      const bandEntity = viewer.entities.add({
        id: `${baseEntityId}${SIGMA_BAND_SUFFIX}`,
        position,
        ellipse: {
          semiMajorAxis: RING_INITIAL_RADIUS_M,
          semiMinorAxis: RING_INITIAL_RADIUS_M,
          rotation: cesiumRotation,
          // Translucent fill keeps the halo readable without the
          // sharp outline competing with the main ring's outline.
          material: color.withAlpha(0.08),
          outline: true,
          outlineColor: color.withAlpha(0.3),
          height: 0,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
      });
      scheduleRing(bandEntity, kind, upperSemiMajor, upperSemiMinor);
    };

    // Bullseye marker: a tight gold core dot wrapped in a faint
    // gold halo. Two entities so the halo can render with a
    // transparent fill (Cesium points don't allow per-channel alpha
    // on the fill of a single primitive without flickering against
    // the OSM imagery).
    //
    // The halo's outline alpha is wired through a CallbackProperty
    // that breathes (sinusoidally pulses 0.25 → 0.85) while the
    // terrain tile is in-flight, then settles to a steady 0.5 once
    // the fetch resolves. Free "we're working on it" signal that
    // doesn't need a separate DOM spinner.
    const haloOutline = new CallbackProperty(() => {
      if (!terrainPulsingRef.current) return MARKER_COLOR.withAlpha(0.5);
      const t = (Date.now() % 1_400) / 1_400;
      const alpha = 0.55 + 0.3 * Math.sin(t * Math.PI * 2);
      return MARKER_COLOR.withAlpha(alpha);
    }, false);
    viewer.entities.add({
      id: MARKER_HALO_ID,
      position: pinCartesian,
      point: {
        pixelSize: 18,
        color: MARKER_COLOR.withAlpha(0.0),
        outlineColor: haloOutline,
        outlineWidth: 1.5,
      },
    });
    viewer.entities.add({
      id: MARKER_ID,
      position: pinCartesian,
      point: {
        pixelSize: 8,
        color: MARKER_COLOR,
        outlineColor: Color.WHITE.withAlpha(0.55),
        outlineWidth: 1.5,
      },
    });

    if (!result) return;

    // --- Impact: 4 damage rings + optional tsunami cavity ------------
    if (result.type === 'impact') {
      // Faro di quota: solo quando il bolide scoppia davvero in aria.
      // Un impatto INTACT arriva al suolo e non ha nulla da segnare.
      const entry = result.data.entry;
      if (entry.regime === 'COMPLETE_AIRBURST' || entry.regime === 'PARTIAL_AIRBURST') {
        addAltitudeBeacon({
          idPrefix: 'beacon-airburst',
          latitude: ringAnchor.latitude,
          longitude: ringAnchor.longitude,
          altitudeM: entry.burstAltitude,
          color: Color.fromCssColorString('#FFD98A'),
        });
      }
      const radii = result.data.damage;
      const asymmetries = result.data.damageAsymmetry;
      const impactRingKind: Record<keyof ImpactDamageRadii, RingKind> = {
        craterRim: 'crater',
        thirdDegreeBurn: 'thermal',
        secondDegreeBurn: 'thermal',
        overpressure5psi: 'overpressure',
        overpressure1psi: 'overpressure',
        lightDamage: 'overpressure',
      };
      (Object.keys(RING_COLORS) as (keyof ImpactDamageRadii)[]).forEach((key) => {
        const radius = radii[key] as number;
        if (!Number.isFinite(radius) || radius <= 0) return;
        const entityId = `${RING_ID_PREFIX}${key}`;
        // Per-ring asymmetry: oblique impacts elongate downrange and
        // shrink cross-range per Pierazzo & Melosh / Pierazzo &
        // Artemieva envelopes. The geometry helper folds in the
        // azimuthal rotation and the centre offset.
        const geom = computeAsymmetricGeometry(
          asymmetries[key],
          radius,
          ringAnchor.latitude,
          ringAnchor.longitude
        );
        const entity = viewer.entities.add({
          id: entityId,
          position: geom.position,
          ellipse: {
            semiMajorAxis: RING_INITIAL_RADIUS_M,
            semiMinorAxis: RING_INITIAL_RADIUS_M,
            rotation: geom.cesiumRotation,
            material: radialDamageMaterial(RING_COLORS[key], 0.85),
            fill: fillsAtRadius(radius),
            outline: true,
            outlineColor: RING_COLORS[key].withAlpha(0.5),
            height: 0,
            heightReference: HeightReference.CLAMP_TO_GROUND,
          },
        });
        scheduleRing(entity, impactRingKind[key], geom.semiMajor, geom.semiMinor);
        addUpperSigmaBand(
          entityId,
          key,
          impactRingKind[key],
          geom.semiMajor,
          geom.semiMinor,
          geom.position,
          RING_COLORS[key],
          geom.cesiumRotation
        );
        // Tooltip continues to report the NOMINAL ground-range radius
        // (not the elongated semi-major) — that is what is
        // scientifically meaningful and what the tooltip text claims
        // ("crater rim 8.5 km"). The asymmetric on-screen shape is
        // a rendering refinement, not a different physical quantity.
        registerRingTooltip(entityId, key, radius, RING_COLORS[key]);
      });
      if (result.data.tsunami) {
        const cavityRadius = result.data.tsunami.cavityRadius as number;
        if (Number.isFinite(cavityRadius) && cavityRadius > 0) {
          const entity = viewer.entities.add({
            id: TSUNAMI_CAVITY_ID,
            position: centerCartesian,
            ellipse: {
              semiMajorAxis: RING_INITIAL_RADIUS_M,
              semiMinorAxis: RING_INITIAL_RADIUS_M,
              material: radialDamageMaterial(TSUNAMI_CAVITY_COLOR, 0.65),
              outline: true,
              outlineColor: TSUNAMI_CAVITY_COLOR.withAlpha(0.45),
              height: 0,
              heightReference: HeightReference.CLAMP_TO_GROUND,
            },
          });
          scheduleRing(entity, 'tsunamiCavity', cavityRadius);
          registerRingTooltip(
            TSUNAMI_CAVITY_ID,
            'tsunamiCavity',
            cavityRadius,
            TSUNAMI_CAVITY_COLOR
          );
        }
        // Phase 16 — wave-front rings retired. The propagating wave is
        // now rendered globally as the discrete-band amplitude heatmap
        // + uniform-grid direction arrows further down, driven directly
        // by the FMM amplitude field. Only the cavity ring at the
        // source point survives at the per-event level.
      }

      // --- Impact ejecta blanket: asymmetric ellipse offset downrange.
      // Schultz & Anderson (1996) oblique-impact asymmetry: the ellipse
      // stretches along the impactor's downrange azimuth and slides
      // forward by the same amount, producing the "butterfly" pattern
      // visible at θ < 30° while staying near-circular for steep
      // impacts (asymmetryFactor → 0 above 45°).
      const blanketRadius = result.data.ejecta.blanketEdge1mm as number;
      if (Number.isFinite(blanketRadius) && blanketRadius > 0) {
        const f = result.data.ejecta.asymmetryFactor;
        const azimuthRad = (result.data.ejecta.azimuthDeg * Math.PI) / 180;
        const offsetMeters = result.data.ejecta.downrangeOffset as number;
        const semiMajor = blanketRadius * (1 + 0.4 * f);
        const semiMinor = blanketRadius * (1 - 0.25 * f);
        // Convert (north, east) offset in metres to lat/lon deltas.
        const latRad = (ringAnchor.latitude * Math.PI) / 180;
        const northOffsetDeg = (offsetMeters * Math.cos(azimuthRad)) / 111_000;
        const eastOffsetDeg =
          (offsetMeters * Math.sin(azimuthRad)) / (111_000 * Math.max(Math.cos(latRad), 1e-6));
        const blanketLat = ringAnchor.latitude + northOffsetDeg;
        const blanketLon = ringAnchor.longitude + eastOffsetDeg;
        // Cesium ellipse rotation: CCW from East (+x). Azimuth is CW
        // from North → cesiumRotation = π/2 − azimuthRad.
        const cesiumRotation = Math.PI / 2 - azimuthRad;
        // Ejecta blanket joins the ring cascade so it grows from
        // r=0 to its asymmetric ellipse instead of popping in at
        // full size on the same frame the result lands. The
        // asymmetric semi-major / semi-minor pair is honored by
        // the animator just like every other ring.
        const ejectaEntity = viewer.entities.add({
          id: EJECTA_BLANKET_ID,
          position: Cartesian3.fromDegrees(blanketLon, blanketLat),
          ellipse: {
            semiMajorAxis: RING_INITIAL_RADIUS_M,
            semiMinorAxis: RING_INITIAL_RADIUS_M,
            rotation: cesiumRotation,
            material: radialDamageMaterial(EJECTA_BLANKET_COLOR, 0.7),
            fill: fillsAtRadius(blanketRadius),
            outline: true,
            outlineColor: EJECTA_BLANKET_COLOR.withAlpha(0.45),
            height: 0,
            heightReference: HeightReference.CLAMP_TO_GROUND,
          },
        });
        // Use the 'crater' kind so the ejecta reveals on the same
        // ~300 ms beat as the crater rim — they're the same physical
        // event (excavation) and visually belong together.
        scheduleRing(
          ejectaEntity,
          'crater',
          clampToGreatCircle(semiMajor),
          clampToGreatCircle(semiMinor)
        );
        registerRingTooltip(
          EJECTA_BLANKET_ID,
          'ejectaBlanket',
          blanketRadius,
          EJECTA_BLANKET_COLOR
        );
      }
    }

    // --- Earthquake: aftershock point cloud ------------------------
    if (result.type === 'earthquake' && result.data.aftershocks.events.length > 0) {
      const latRad = (ringAnchor.latitude * Math.PI) / 180;
      const cosLat = Math.max(Math.cos(latRad), 1e-6);
      const bath = result.data.aftershocks.bathCeiling;
      const mc = result.data.aftershocks.completenessCutoff;
      const span = Math.max(bath - mc, 0.1);
      const aftershockSpecs: AftershockAnimationSpec[] = [];
      result.data.aftershocks.events.forEach((event, idx) => {
        const dlat = (event.northOffsetM as number) / 111_000;
        const dlon = (event.eastOffsetM as number) / (111_000 * cosLat);
        // Linearly interpolate colour and pixel size between Mc and
        // the Båth ceiling — a magnitude-3 dot stays small and pale,
        // an M(main−1.5) dot stands out as a deep red marker.
        const t = Math.max(0, Math.min(1, (event.magnitude - mc) / span));
        const color = Color.lerp(AFTERSHOCK_COLOR_LOW, AFTERSHOCK_COLOR_HIGH, t, new Color());
        const pixelSize = 4 + 8 * t;
        const entityId = `${AFTERSHOCK_ID_PREFIX}${idx.toString()}`;
        const entity = viewer.entities.add({
          id: entityId,
          position: Cartesian3.fromDegrees(ringAnchor.longitude + dlon, ringAnchor.latitude + dlat),
          point: {
            // animateAftershocksImperatively flips show=true at the
            // log-compressed onset; we start hidden so the loop owns
            // the reveal.
            show: false,
            pixelSize,
            color: color.withAlpha(0.85),
            outlineColor: Color.BLACK,
            outlineWidth: 1,
          },
        });
        aftershockSpecs.push({
          entity,
          physicalTimeSeconds: event.timeAfterMainshock,
          finalPixelSize: pixelSize,
          haloColor: color,
        });
        registerAftershockTooltip(entityId, event.magnitude, event.timeAfterMainshock, color);
      });
      cancelAftershockAnimationRef.current = animateAftershocksImperatively(aftershockSpecs);
    }

    // --- Earthquake: three MMI felt-intensity contours ---------------
    if (result.type === 'earthquake') {
      const { mmi7Radius, mmi8Radius, mmi9Radius } = result.data.shaking;
      // Submarine epicentres: the felt-intensity radii remain
      // physically valid (Joyner-Boore is a magnitude/distance
      // attenuation; both are well-defined under water) but on the
      // open ocean the contours have no built environment to act on
      // and the dominant story is the tsunami. Fade the rings down
      // (0.85 → 0.35) so the eye reads "land sites within this radius
      // get this MMI", not "the water is shaking at MMI VIII". The
      // tsunami amplitude/isochrone heatmaps painted further down
      // own the rest of the visual budget.
      const isSubmarine = result.data.isSubmarine;
      const fillAlpha = isSubmarine ? 0.35 : 0.85;
      const outlineAlpha = isSubmarine ? 0.25 : 0.5;

      if (result.data.isExtendedSource) {
        // Phase 13b — extended-source MMI contour. The rupture is a
        // surface-projection rectangle of (L × W) inflated by the
        // Joyner-Boore distance r_jb at which the MMI level is
        // reached. The polygon hugs that contour: a stadium when
        // W → 0 (strike-slip line source), a rounded rectangle when
        // W ~ L (megathrust). Visual contracts: mmi{7,8,9}Stadium in
        // src/scene/visualContracts.ts.
        //
        // Animation: the polygon appears statically (no grow-from-0)
        // because the extended-source contour is a footprint, not a
        // propagating front. The point-source ring branch below keeps
        // the cinematic cascade for small / continental events.
        const halfL = (result.data.ruptureLength as number) / 2;
        const halfW = (result.data.ruptureWidth as number) / 2;
        const strikeAzimuthDeg = result.data.inputs.strikeAzimuthDeg ?? 0;
        const stadiumContours: {
          id: 'mmi-stadium-7' | 'mmi-stadium-8' | 'mmi-stadium-9';
          radius: number;
          color: Color;
          tooltipKind: RingTooltipKind;
        }[] = [
          {
            id: 'mmi-stadium-7',
            radius: mmi7Radius,
            color: MMI_RING_COLORS.mmi7,
            tooltipKind: 'mmi7',
          },
          {
            id: 'mmi-stadium-8',
            radius: mmi8Radius,
            color: MMI_RING_COLORS.mmi8,
            tooltipKind: 'mmi8',
          },
          {
            id: 'mmi-stadium-9',
            radius: mmi9Radius,
            color: MMI_RING_COLORS.mmi9,
            tooltipKind: 'mmi9',
          },
        ];
        // Render outermost first (VII larger than IX) so the inner
        // bands paint on top and remain visible.
        for (const { id, radius, color, tooltipKind } of stadiumContours) {
          if (!Number.isFinite(radius) || radius <= 0) continue;
          const verts = buildRuptureStadiumPolygon({
            centerLatDeg: ringAnchor.latitude,
            centerLonDeg: ringAnchor.longitude,
            strikeAzimuthDeg,
            halfLengthAlongStrikeM: halfL,
            halfWidthAcrossStrikeM: halfW,
            contourRadiusM: radius,
          });
          viewer.entities.add({
            id,
            polygon: {
              hierarchy: new PolygonHierarchy(verts),
              // Legge del contorno (tavola 4): il poligono di rottura
              // tiene un velo del 10% e affida il segnale al bordo,
              // come gli anelli ellittici col materiale radiale.
              material: color.withAlpha(fillAlpha * 0.12),
              outline: true,
              outlineColor: color.withAlpha(Math.min(1, outlineAlpha * 1.8)),
              height: 0,
              heightReference: HeightReference.CLAMP_TO_GROUND,
            },
          });
          registerRingTooltip(id, tooltipKind, radius, color);
        }

        // ── La faglia in scena (tavola 4) ─────────────────────────
        // La rottura come traccia luminosa lungo lo strike, che si
        // accende propagandosi dall'ipocentro verso le due estremità
        // (~1,2 s). I dati ci sono già: ruptureLength e strike sono
        // gli stessi che disegnano lo stadio. Sugli eventi sottomarini
        // la traccia vola a quota fissa (il DEM è il fondale, e il
        // velo tsunami la coprirebbe); a terra drappeggia il rilievo.
        {
          const θ = (strikeAzimuthDeg * Math.PI) / 180;
          const eastDir = Math.sin(θ);
          const northDir = Math.cos(θ);
          const cosLat = Math.max(Math.cos((ringAnchor.latitude * Math.PI) / 180), 1e-6);
          const mPerLat = 111_000;
          const mPerLon = 111_000 * cosLat;
          const SAMPLE_M = 12_000;
          const steps = Math.max(4, Math.ceil(halfL / SAMPLE_M));
          const tracePoint = (sM: number): Cartesian3 => {
            const lat = ringAnchor.latitude + (sM * northDir) / mPerLat;
            const lon = ringAnchor.longitude + (sM * eastDir) / mPerLon;
            return isSubmarine
              ? Cartesian3.fromDegrees(lon, lat, 2_500)
              : Cartesian3.fromDegrees(lon, lat);
          };
          // Punti simmetrici attorno all'ipocentro: indice 0 = centro.
          const half: number[] = [];
          for (let k = 0; k <= steps; k++) half.push((k / steps) * halfL);
          const fullPositions = [
            ...half
              .slice(1)
              .reverse()
              .map((d) => tracePoint(-d)),
            tracePoint(0),
            ...half.slice(1).map((d) => tracePoint(d)),
          ];
          const faultMaterial = new PolylineGlowMaterialProperty({
            color: Color.fromCssColorString('#FF8A5C').withAlpha(0.95),
            glowPower: 0.32,
          });
          const faultEntity = viewer.entities.add({
            id: 'fault-trace',
            polyline: {
              positions: fullPositions,
              width: 6,
              material: faultMaterial,
              ...(isSubmarine ? {} : { clampToGround: true }),
            },
          });
          const faultReduce =
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (!faultReduce) {
            const IGNITION_MS = 1_200;
            const centreIndex = steps; // indice del punto-ipocentro
            const t0 = performance.now();
            const tick = (): void => {
              if (viewer.isDestroyed()) return;
              // Se la purge ha rimosso la traccia (nuova simulazione),
              // il ciclo muore da solo.
              if (viewer.entities.getById('fault-trace') !== faultEntity) return;
              const f = Math.min(1, (performance.now() - t0) / IGNITION_MS);
              const reach = Math.max(1, Math.round(f * steps));
              const poly = faultEntity.polyline;
              if (poly !== undefined) {
                (poly as unknown as { positions: Cartesian3[] }).positions = fullPositions.slice(
                  centreIndex - reach,
                  centreIndex + reach + 1
                );
              }
              viewer.scene.requestRender();
              if (f < 1) requestAnimationFrame(tick);
            };
            (faultEntity.polyline as unknown as { positions: Cartesian3[] }).positions =
              fullPositions.slice(centreIndex - 1, centreIndex + 2);
            requestAnimationFrame(tick);
          }
        }
      } else {
        // Small / continental event: the rupture rectangle is well
        // inside the MMI VII point-source radius, so a circular ring
        // is the geometrically correct representation.
        const contours: { id: MmiRingId; radius: number; color: Color }[] = [
          { id: 'mmi-ring-7', radius: mmi7Radius, color: MMI_RING_COLORS.mmi7 },
          { id: 'mmi-ring-8', radius: mmi8Radius, color: MMI_RING_COLORS.mmi8 },
          { id: 'mmi-ring-9', radius: mmi9Radius, color: MMI_RING_COLORS.mmi9 },
        ];
        const mmiKindFor: Record<MmiRingId, RingTooltipKind> = {
          'mmi-ring-7': 'mmi7',
          'mmi-ring-8': 'mmi8',
          'mmi-ring-9': 'mmi9',
        };
        contours.forEach(({ id, radius, color }) => {
          if (!Number.isFinite(radius) || radius <= 0) return;
          const entity = viewer.entities.add({
            id,
            position: centerCartesian,
            ellipse: {
              semiMajorAxis: RING_INITIAL_RADIUS_M,
              semiMinorAxis: RING_INITIAL_RADIUS_M,
              material: radialDamageMaterial(color, fillAlpha),
              fill: fillsAtRadius(radius),
              outline: true,
              outlineColor: color.withAlpha(outlineAlpha),
              height: 0,
              heightReference: HeightReference.CLAMP_TO_GROUND,
            },
          });
          scheduleRing(entity, 'mmi', radius);
          addUpperSigmaBand(id, mmiKindFor[id], 'mmi', radius, radius, centerCartesian, color, 0);
          registerRingTooltip(id, mmiKindFor[id], radius, color);
        });
      }
    }

    // --- Explosion: blast / burn / crater rings + radiation / EMP ----
    if (result.type === 'explosion') {
      const hob = result.data.inputs.heightOfBurst;
      if (hob !== undefined) {
        addAltitudeBeacon({
          idPrefix: 'beacon-hob',
          latitude: ringAnchor.latitude,
          longitude: ringAnchor.longitude,
          altitudeM: hob,
          color: Color.fromCssColorString('#FFD98A'),
        });
      }
      const blast = result.data.blast;
      const thermal = result.data.thermal;
      const crater = result.data.crater;
      const radiation = result.data.radiation;
      const emp = result.data.emp;
      const asymmetry = result.data.asymmetry;
      const explosionRings: {
        id: ExplosionRingId;
        radius: number;
        color: Color;
        kind: RingKind;
        tooltipKind: RingTooltipKind;
        asymmetry: RingAsymmetry;
      }[] = [
        {
          id: 'explosion-crater',
          radius: crater.apparentDiameter / 2,
          color: RING_COLORS.craterRim,
          kind: 'crater',
          tooltipKind: 'craterRim',
          asymmetry: asymmetry.crater,
        },
        {
          id: 'explosion-thermal',
          radius: thermal.thirdDegreeBurnRadius,
          color: RING_COLORS.thirdDegreeBurn,
          kind: 'thermal',
          tooltipKind: 'thirdDegreeBurn',
          asymmetry: asymmetry.thermal,
        },
        {
          id: 'explosion-thermal-2nd',
          radius: thermal.secondDegreeBurnRadius,
          color: RING_COLORS.secondDegreeBurn,
          kind: 'thermal',
          tooltipKind: 'secondDegreeBurn',
          asymmetry: asymmetry.secondDegreeBurn,
        },
        // Phase-17 calibration. Use the HOB-corrected blast radii
        // (`overpressure*RadiusHob` / `lightDamageRadiusHob`) instead
        // of the bare surface-burst values, so an airburst at
        // optimum HOB renders its Mach-stem-amplified ring on the
        // map rather than the smaller surface-burst contour. For a
        // surface burst the HOB factor is 1.0 and the two values
        // coincide, so this is backwards-compatible with every
        // ground-burst preset (Castle Bravo, surface-1Mt, …).
        {
          id: 'explosion-5psi',
          radius: blast.overpressure5psiRadiusHob,
          color: RING_COLORS.overpressure5psi,
          kind: 'overpressure',
          tooltipKind: 'overpressure5psi',
          asymmetry: asymmetry.overpressure5psi,
        },
        {
          id: 'explosion-1psi',
          radius: blast.overpressure1psiRadiusHob,
          color: RING_COLORS.overpressure1psi,
          kind: 'overpressure',
          tooltipKind: 'overpressure1psi',
          asymmetry: asymmetry.overpressure1psi,
        },
        {
          id: 'explosion-light-damage',
          radius: blast.lightDamageRadiusHob,
          color: RING_COLORS.lightDamage,
          kind: 'overpressure',
          tooltipKind: 'lightDamage',
          asymmetry: asymmetry.lightDamage,
        },
      ];

      // Initial-radiation lethal-dose ring (Glasstone §8 / UNSCEAR
      // 2000). Drawn only when LD50 actually escapes the fireball;
      // for very large yields the prompt-radiation envelope is
      // dwarfed by thermal so the ring is conventionally suppressed.
      if (Number.isFinite(radiation.ld50Radius) && radiation.ld50Radius > 0) {
        explosionRings.push({
          id: 'explosion-radiation-ld50',
          radius: radiation.ld50Radius,
          color: RADIATION_LD50_COLOR,
          // Treat as an "overpressure"-class arrival in the cascade
          // animation — radiation is essentially light-speed at our
          // 0–4 s compressed timescale, so the same near-instant
          // expansion timing is appropriate.
          kind: 'thermal',
          tooltipKind: 'radiationLD50',
          asymmetry: ISOTROPIC_RING,
        });
      }

      // EMP affected-electronics footprint (Glasstone §11 / IEC
      // 61000-2-9). Negligible-regime bursts (low-altitude, small
      // yield) fall here; HEMP detonations like Starfish Prime
      // produce continent-scale EMP rings.
      if (
        emp.regime !== 'NEGLIGIBLE' &&
        Number.isFinite(emp.affectedRadius) &&
        emp.affectedRadius > 0
      ) {
        explosionRings.push({
          id: 'explosion-emp',
          radius: emp.affectedRadius,
          color: EMP_AFFECTED_COLOR,
          // EMP propagates at light-speed too — keep it in the
          // "thermal" cinematic bucket alongside the burn rings.
          kind: 'thermal',
          tooltipKind: 'empAffected',
          asymmetry: ISOTROPIC_RING,
        });
      }
      // Contact-water surface bursts — Glasstone & Dolan §6 — couple
      // only ≈ 5–15 % of the yield into the atmosphere, so the
      // overpressure / thermal / crater radii emitted from the
      // baseline land formulas drastically overstate the airborne
      // reach. The published radii are still rendered (a follow-up
      // will scale them with the Glasstone Tab 6.31 coupling factor)
      // but at reduced opacity so the eye reads the tsunami branch
      // as the headline. The hover tooltip continues to surface the
      // numerical radius for users who want the land-equivalent
      // reference.
      const isContactWaterBurst = result.data.isContactWaterBurst;
      const explosionFillAlpha = isContactWaterBurst ? 0.4 : 0.85;
      const explosionOutlineAlpha = isContactWaterBurst ? 0.3 : 0.5;
      explosionRings.forEach(({ id, radius, color, kind, tooltipKind, asymmetry: asym }) => {
        if (!Number.isFinite(radius) || radius <= 0) return;
        // Surface-burst nuclear/conventional explosions are rotationally
        // symmetric in still air — the asymmetry block is ISOTROPIC by
        // default and only the thermal ring drifts when a positive wind
        // is supplied (Glasstone & Dolan §7.20). The same geometry
        // helper applies regardless: it short-circuits to a centred
        // circle when the multipliers are 1 and the offset is 0.
        const geom = computeAsymmetricGeometry(
          asym,
          radius,
          ringAnchor.latitude,
          ringAnchor.longitude
        );
        const entity = viewer.entities.add({
          id,
          position: geom.position,
          ellipse: {
            semiMajorAxis: RING_INITIAL_RADIUS_M,
            semiMinorAxis: RING_INITIAL_RADIUS_M,
            rotation: geom.cesiumRotation,
            material: radialDamageMaterial(color, explosionFillAlpha),
            fill: fillsAtRadius(radius),
            outline: true,
            outlineColor: color.withAlpha(explosionOutlineAlpha),
            height: 0,
            heightReference: HeightReference.CLAMP_TO_GROUND,
          },
        });
        scheduleRing(entity, kind, geom.semiMajor, geom.semiMinor);
        addUpperSigmaBand(
          id,
          tooltipKind,
          kind,
          geom.semiMajor,
          geom.semiMinor,
          geom.position,
          color,
          geom.cesiumRotation
        );
        registerRingTooltip(id, tooltipKind, radius, color);
      });
      // Underwater / contact-water burst cavity. Same colour as the
      // impact-tsunami cavity so the two cascades read as the same
      // family of phenomena on the globe.
      if (result.data.tsunami) {
        const cavityRadius = result.data.tsunami.cavityRadius as number;
        if (Number.isFinite(cavityRadius) && cavityRadius > 0) {
          const entity = viewer.entities.add({
            id: TSUNAMI_CAVITY_ID,
            position: centerCartesian,
            ellipse: {
              semiMajorAxis: RING_INITIAL_RADIUS_M,
              semiMinorAxis: RING_INITIAL_RADIUS_M,
              material: radialDamageMaterial(TSUNAMI_CAVITY_COLOR, 0.65),
              outline: true,
              outlineColor: TSUNAMI_CAVITY_COLOR.withAlpha(0.45),
              height: 0,
              heightReference: HeightReference.CLAMP_TO_GROUND,
            },
          });
          scheduleRing(entity, 'tsunamiCavity', cavityRadius);
          registerRingTooltip(
            TSUNAMI_CAVITY_ID,
            'tsunamiCavity',
            cavityRadius,
            TSUNAMI_CAVITY_COLOR
          );
        }
        // Wave-front rings retired in Phase 16 — see impact branch.
      }
    }

    // --- Landslide: tsunami cavity ---------------------------------
    if (result.type === 'landslide' && result.data.tsunami !== null) {
      const cavityRadius = result.data.tsunami.cavityRadius as number;
      if (Number.isFinite(cavityRadius) && cavityRadius > 0) {
        const entity = viewer.entities.add({
          id: TSUNAMI_CAVITY_ID,
          position: centerCartesian,
          ellipse: {
            semiMajorAxis: RING_INITIAL_RADIUS_M,
            semiMinorAxis: RING_INITIAL_RADIUS_M,
            material: radialDamageMaterial(TSUNAMI_CAVITY_COLOR, 0.65),
            outline: true,
            outlineColor: TSUNAMI_CAVITY_COLOR.withAlpha(0.45),
            height: 0,
            heightReference: HeightReference.CLAMP_TO_GROUND,
          },
        });
        scheduleRing(entity, 'tsunamiCavity', cavityRadius);
        registerRingTooltip(TSUNAMI_CAVITY_ID, 'tsunamiCavity', cavityRadius, TSUNAMI_CAVITY_COLOR);
      }
      // Wave-front rings retired in Phase 16 — see impact branch.
    }

    // --- Volcano: collapse-driven tsunami cavity --------------------
    if (result.type === 'volcano' && result.data.tsunami) {
      const cavityRadius = result.data.tsunami.cavityRadius as number;
      if (Number.isFinite(cavityRadius) && cavityRadius > 0) {
        const entity = viewer.entities.add({
          id: TSUNAMI_CAVITY_ID,
          position: centerCartesian,
          ellipse: {
            semiMajorAxis: RING_INITIAL_RADIUS_M,
            semiMinorAxis: RING_INITIAL_RADIUS_M,
            material: radialDamageMaterial(TSUNAMI_CAVITY_COLOR, 0.65),
            outline: true,
            outlineColor: TSUNAMI_CAVITY_COLOR.withAlpha(0.45),
            height: 0,
            heightReference: HeightReference.CLAMP_TO_GROUND,
          },
        });
        scheduleRing(entity, 'tsunamiCavity', cavityRadius);
        registerRingTooltip(TSUNAMI_CAVITY_ID, 'tsunamiCavity', cavityRadius, TSUNAMI_CAVITY_COLOR);
      }
      // Wave-front rings retired in Phase 16 — see impact branch.
    }

    // --- Earthquake: source-region cavity ring + bathymetric wave fronts.
    // Subduction-interface megathrust seeds a wave train whose amplitude
    // decays as A₀·√(R₀/r) (line-source spreading) rather than the
    // cavity-collapse 1/r law, but for the OVERLAY we now route through
    // the same `cavity` mode used by impacts/explosions/volcanoes/
    // landslides — this keeps the visual cascade coherent across event
    // types and lets the bathymetric iso-amplitude path (which doesn't
    // care about the closed-form propagation law) take precedence
    // wherever the FMM amplitude field has segments to extract. The
    // canonical equivalent cavity radius for a megathrust is
    // ruptureLength / 4 — the same value `extractTsunamiMeta` feeds
    // into computeBathymetricTsunami, so the cavity ring on screen and
    // the FMM source seed are physically consistent.
    if (result.type === 'earthquake' && result.data.tsunami !== undefined) {
      const eqCavityRadius = Math.max((result.data.ruptureLength as number) / 4, 10_000);
      if (Number.isFinite(eqCavityRadius) && eqCavityRadius > 0) {
        const entity = viewer.entities.add({
          id: TSUNAMI_CAVITY_ID,
          position: centerCartesian,
          ellipse: {
            semiMajorAxis: RING_INITIAL_RADIUS_M,
            semiMinorAxis: RING_INITIAL_RADIUS_M,
            material: radialDamageMaterial(TSUNAMI_CAVITY_COLOR, 0.65),
            outline: true,
            outlineColor: TSUNAMI_CAVITY_COLOR.withAlpha(0.45),
            height: 0,
            heightReference: HeightReference.CLAMP_TO_GROUND,
          },
        });
        scheduleRing(entity, 'tsunamiCavity', eqCavityRadius);
        registerRingTooltip(
          TSUNAMI_CAVITY_ID,
          'tsunamiCavity',
          eqCavityRadius,
          TSUNAMI_CAVITY_COLOR
        );
      }
      // Wave-front rings retired in Phase 16 — see impact branch.
    }

    // --- Volcano: pyroclastic-flow reach ring ------------------------
    if (result.type === 'volcano') {
      addAltitudeBeacon({
        idPrefix: 'beacon-volcano-column',
        latitude: ringAnchor.latitude,
        longitude: ringAnchor.longitude,
        altitudeM: result.data.plumeHeight,
        color: Color.fromCssColorString('#E3DCCB'),
      });
    }
    const pyroRadius = result.type === 'volcano' ? result.data.pyroclasticRunout : 0;
    if (result.type === 'volcano' && Number.isFinite(pyroRadius) && pyroRadius > 0) {
      const entity = viewer.entities.add({
        id: PYROCLASTIC_RING_ID,
        position: centerCartesian,
        ellipse: {
          semiMajorAxis: RING_INITIAL_RADIUS_M,
          semiMinorAxis: RING_INITIAL_RADIUS_M,
          material: radialDamageMaterial(PYROCLASTIC_RING_COLOR, 0.85),
          outline: true,
          outlineColor: PYROCLASTIC_RING_COLOR.withAlpha(0.5),
          height: 0,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
      });
      scheduleRing(entity, 'overpressure', pyroRadius);
      addUpperSigmaBand(
        PYROCLASTIC_RING_ID,
        'pyroclasticRunout',
        'overpressure',
        pyroRadius,
        pyroRadius,
        centerCartesian,
        PYROCLASTIC_RING_COLOR,
        0
      );
      registerRingTooltip(
        PYROCLASTIC_RING_ID,
        'pyroclasticRunout',
        pyroRadius,
        PYROCLASTIC_RING_COLOR
      );
    }

    // --- Volcano: lateral-blast envelope (sector flank collapse) ---
    const lateralBlast = result.type === 'volcano' ? result.data.lateralBlast : undefined;
    if (
      result.type === 'volcano' &&
      lateralBlast !== undefined &&
      (lateralBlast.runout as number) > 0
    ) {
      const runout = lateralBlast.runout as number;
      const dirRad = (lateralBlast.directionDeg * Math.PI) / 180;
      // Render the wedge as an oriented ellipse offset half its
      // runout downrange — the same trick used for the ashfall plume
      // and the impact ejecta blanket. The crosswind axis scales with
      // sectorAngleDeg / 180 so a narrower blast looks more focused.
      const halfRange = runout / 2;
      const crosswindHalfWidth =
        runout * Math.sin(((lateralBlast.sectorAngleDeg / 2) * Math.PI) / 180);
      const latRad = (ringAnchor.latitude * Math.PI) / 180;
      const northOffsetDeg = (halfRange * Math.cos(dirRad)) / 111_000;
      const eastOffsetDeg =
        (halfRange * Math.sin(dirRad)) / (111_000 * Math.max(Math.cos(latRad), 1e-6));
      const blastLat = ringAnchor.latitude + northOffsetDeg;
      const blastLon = ringAnchor.longitude + eastOffsetDeg;
      const cesiumRotation = Math.PI / 2 - dirRad;
      viewer.entities.add({
        id: LATERAL_BLAST_ID,
        position: Cartesian3.fromDegrees(blastLon, blastLat),
        ellipse: {
          semiMajorAxis: clampToGreatCircle(halfRange),
          semiMinorAxis: clampToGreatCircle(crosswindHalfWidth),
          rotation: cesiumRotation,
          material: radialDamageMaterial(LATERAL_BLAST_COLOR, 0.9),
          outline: true,
          outlineColor: LATERAL_BLAST_COLOR.withAlpha(0.55),
          height: 0,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
      });
      registerRingTooltip(LATERAL_BLAST_ID, 'lateralBlast', runout, LATERAL_BLAST_COLOR);
    }

    // --- Volcano: wind-advected ashfall plume -----------------------
    const ashfall = result.type === 'volcano' ? result.data.windAdvectedAshfall : undefined;
    if (
      result.type === 'volcano' &&
      ashfall !== undefined &&
      (ashfall.downwindRange as number) > 0 &&
      (ashfall.crosswindHalfWidth as number) > 0
    ) {
      const downwind = ashfall.downwindRange as number;
      const crosswind = ashfall.crosswindHalfWidth as number;
      const windDirRad = (ashfall.windDirectionDegrees * Math.PI) / 180;
      // Offset the ellipse centre half-way along the wind direction so
      // the plume extends from ~vent to vent + downwindRange.
      const halfRange = downwind / 2;
      // Convert (north, east) offsets in metres to lat/lon deltas.
      const latRad = (ringAnchor.latitude * Math.PI) / 180;
      const northOffsetDeg = (halfRange * Math.cos(windDirRad)) / 111_000;
      const eastOffsetDeg =
        (halfRange * Math.sin(windDirRad)) / (111_000 * Math.max(Math.cos(latRad), 1e-6));
      const plumeLat = ringAnchor.latitude + northOffsetDeg;
      const plumeLon = ringAnchor.longitude + eastOffsetDeg;
      // Cesium ellipse rotation is counter-clockwise from East (+x).
      // Wind direction is clockwise from North. Convert: ccwFromEast =
      // π/2 − windDirRad.
      const cesiumRotation = Math.PI / 2 - windDirRad;
      viewer.entities.add({
        id: ASHFALL_PLUME_ID,
        position: Cartesian3.fromDegrees(plumeLon, plumeLat),
        ellipse: {
          semiMajorAxis: clampToGreatCircle(halfRange),
          semiMinorAxis: clampToGreatCircle(crosswind),
          rotation: cesiumRotation,
          material: radialDamageMaterial(ASHFALL_PLUME_COLOR, 0.55),
          outline: false,
          height: 0,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
      });
      registerRingTooltip(ASHFALL_PLUME_ID, 'ashfallPlume', downwind, ASHFALL_PLUME_COLOR);
      // Isopaca 1 mm tratteggiata — il linguaggio delle mappe VAAC.
      // Il perimetro dell'ellisse di ricaduta ridisegnato come
      // polilinea a tratti sopra la velatura del riempimento.
      const ISO_POINTS = 96;
      const isoPositions: Cartesian3[] = [];
      const aM = clampToGreatCircle(halfRange);
      const bM = clampToGreatCircle(crosswind);
      for (let k = 0; k <= ISO_POINTS; k++) {
        const t = (k / ISO_POINTS) * Math.PI * 2;
        // Frame locale: x lungo il vento, y trasversale.
        const x = aM * Math.cos(t);
        const y = bM * Math.sin(t);
        const north = x * Math.cos(windDirRad) - y * Math.sin(windDirRad);
        const east = x * Math.sin(windDirRad) + y * Math.cos(windDirRad);
        const lat = plumeLat + north / 111_000;
        const lon = plumeLon + east / (111_000 * Math.max(Math.cos(latRad), 1e-6));
        isoPositions.push(Cartesian3.fromDegrees(lon, lat));
      }
      viewer.entities.add({
        id: 'ashfall-isopach-1mm',
        polyline: {
          positions: isoPositions,
          width: 2,
          clampToGround: true,
          material: new PolylineDashMaterialProperty({
            color: ASHFALL_PLUME_COLOR.withAlpha(0.8),
            dashLength: 14,
          }),
        },
      });
    }

    // --- Tsunami amplitude heatmap + wave-direction arrows (Phase 16).
    // When the scenario triggered a tsunami AND a bathymetric grid was
    // loaded, the store orchestrator fills `bathymetricTsunami` with
    // the FMM amplitude field (local high-res tile + planetary global
    // layer). We render TWO things from it: a discrete-band amplitude
    // heatmap (NOAA palette, ≥ 1 m only) and a uniform 1°×1° grid of
    // small dark direction arrows pointing along ∇T. No isochrone
    // polylines, no run-up coastal markers, no closed-form rings —
    // anything the simulator computes about onshore inundation goes
    // to the analysis panel as text.
    if (bathymetricTsunami !== null) {
      const grid = useAppStore.getState().elevationGrid;
      // Cesium Rectangle.fromDegrees enforces lon ∈ [−180, 180] and
      // lat ∈ [−90, 90]. Normalise via modular arithmetic so grids
      // that happen to use 200°E (= −160°) still render — Cesium
      // handles antimeridian crossing when east < west.
      const normLon = (lon: number): number => ((((lon + 180) % 360) + 360) % 360) - 180;

      // ---- Phase 11 GLOBAL layer FIRST (independent of local tile) ----
      // The Phase 11 global layer must render even when the local
      // tile is missing or unusable. Drawn at the BOTTOM of the
      // visual stack so the local high-res layer (if present) sits
      // on top and dominates near-source detail.
      //
      // Phase 14 amplitude gate: if the global amplitude field's
      // peak value is below 0.5 m there is nothing rendered anyway
      // (every pixel falls under the `transparentBelow` threshold)
      // and we'd just be paying the planet-wide rectangle cost for
      // an invisible result. More importantly, we never want to add
      // the rectangle entity for a tsunami that doesn't materially
      // exist — under the previous logic a 100 m bolide partial
      // airburst still produced a 0.5–1 m peak field that painted
      // sparse pixels world-wide and read as "covers half the globe".
      // Skipping the entity entirely keeps the visualisation honest.
      // ──────────────────────────────────────────────────────────────
      // Phase 16 — global tsunami layer: discrete-band amplitude
      // heatmap + uniform-grid wave-direction arrows.
      //
      // Concept: every event whose physics produces a tsunami amplitude
      // field is rendered with the SAME two-layer primitive,
      // independent of source magnitude:
      //
      //   1. Heatmap rectangle painting the global amplitude field
      //      with NOAA-standard discrete amplitude bands
      //      (`WAVE_AMPLITUDE_BANDS` from heatmap.ts) — green / yellow
      //      / orange / red for ≥1, ≥3, ≥6, ≥10 m. Below 1 m the
      //      pixel is fully transparent so sub-metre swell never
      //      paints "macchie" on the open ocean.
      //
      //   2. Uniform 1° × 1° geographic grid of small dark triangle
      //      arrows pointing along the local eikonal-ray direction
      //      (∇T from the FMM arrival-time field). Each arrow is
      //      placed only on cells whose amplitude is ≥ 1 m AND whose
      //      arrival time is finite (i.e. ocean, reachable from the
      //      source). Land cells, sub-threshold cells and cells the
      //      wave never reached emit nothing — the visualisation is
      //      strictly honest to the simulation.
      //
      // No synthetic closed-form rings, no per-tier ellipses, no iso-
      // contour glyphs. Coastal run-up and onshore inundation are
      // described textually in the analysis panel, never as marker
      // points on the globe.
      const globalAmpField = bathymetricTsunami.global?.amplitude;
      const globalArrivalField = bathymetricTsunami.global?.field;
      if (
        globalAmpField !== undefined &&
        globalArrivalField !== undefined &&
        globalAmpField.maxAmplitude >= 1
      ) {
        const tGlobalStart = performance.now();
        try {
          const gAmp = globalAmpField;
          // Velatura d'ampiezza (regia tsunami approvata): LUT continua
          // fredda→calda ad alpha basso al posto delle quattro campiture
          // NOAA — l'oceano si scurisce dove l'onda è debole e scalda
          // oltre i 3 m, ma il pianeta resta leggibile sotto. La soglia
          // di onestà resta 1 m: sotto, nessun pixel.
          // Il campo levigato serve sia alla velatura sia ai contorni:
          // senza, l'amplificazione di Green sulle celle costiere
          // singole spruzza coriandoli caldi lungo ogni litorale.
          const gGridForVeil = useAppStore.getState().globalBathymetricGrid;
          const gDeep =
            gGridForVeil !== null
              ? toDeepWaterEquivalent(gAmp.amplitudes, gGridForVeil.samples)
              : gAmp.amplitudes;
          const gDisplay = smoothFieldForContours(gDeep, gAmp.nLat, gAmp.nLon, 2);
          const gHeatmap = renderScalarFieldHeatmap(gDisplay, gAmp.nLat, gAmp.nLon, {
            opacity: 0.38,
            opacityByValue: { min: 0.22, max: 0.62 },
            colormap: 'waveVeil',
            valueMin: 1,
            valueMax: 10,
            transparentBelow: 1,
            scale: 'sqrt',
            // downsample 2× — the global 1024² grid maps to a 512²
            // canvas that Cesium stretches over the planet rectangle.
            downsample: 2,
          });
          // Le soglie NOAA diventano linee di contorno (marching
          // squares) tracciate sullo stesso canvas: registrazione
          // perfetta con la velatura e nessuna entità in più.
          drawContourOverlay(
            gHeatmap.canvas,
            WAVE_CONTOUR_STYLES.map(({ threshold, css }) => ({
              css,
              segments:
                extractAmplitudeContours({
                  amplitudes: gDisplay,
                  nLat: gAmp.nLat,
                  nLon: gAmp.nLon,
                  minLat: -85,
                  maxLat: 85,
                  minLon: -180,
                  maxLon: 180,
                  thresholds: [threshold],
                })[0]?.segments ?? [],
            })),
            { minLat: -85, maxLat: 85, minLon: -180, maxLon: 180 }
          );
          viewer.entities.add({
            id: 'tsunami-fmm-amplitude-global',
            rectangle: {
              coordinates: Rectangle.fromDegrees(-180, -85, 180, 85),
              material: new ImageMaterialProperty({
                image: gHeatmap.canvas,
                transparent: true,
              }),
              height: 0,
            },
          });
        } catch (err: unknown) {
          console.warn('[Globe] global amplitude heatmap render failed:', err);
        }
        try {
          const gAmp = globalAmpField;
          const gT = globalArrivalField;
          const gGrid = useAppStore.getState().globalBathymetricGrid;
          if (gGrid !== null) {
            // Wave-direction arrows on a uniform 1°×1° geographic grid.
            // The arrow is dark grey (neutral against the coloured
            // amplitude bands underneath) and a constant 30 km long —
            // size and colour do NOT encode intensity (the heatmap
            // does that). Only the rotation varies, which is the
            // local direction of propagation.
            const COMET_COLOR = Color.fromCssColorString('#BFE8F5');
            const cometMaterial = new PolylineGlowMaterialProperty({
              color: COMET_COLOR.withAlpha(0.55),
              glowPower: 0.3,
              taperPower: 0.45,
            });
            const ARROW_SIZE_M = 30_000;
            const MIN_AMPLITUDE_M = 1.0;
            // Cap on total arrow entities. 39 000 entities for a
            // Chicxulub-class run cluttered the globe AND made every
            // subsequent purge / camera fly-to stutter on lower-end
            // hardware. ~3 000 is the sweet spot: still dense enough
            // to read as a continuous flow-field on a 1920px viewport,
            // cheap enough that creation + purge + render stay
            // sub-200 ms even on planetary footprints.
            // La semina pesata sull'ampiezza sotto taglia ancora, quindi
            // il tetto geometrico può stare più basso del vecchio 3 000:
            // il risultato tipico è qualche centinaio di comete.
            const MAX_ARROWS = softwareRendererRef.current ? 220 : 1_200;
            const latLo = Math.max(-85, Math.ceil(gGrid.minLat));
            const latHi = Math.min(85, Math.floor(gGrid.maxLat));
            const lonLo = Math.max(-180, Math.ceil(gGrid.minLon));
            const lonHi = Math.min(180, Math.floor(gGrid.maxLon));
            // ── Pass 1: count candidate cells at 1°×1° (qualifying =
            // ocean + amp ≥ 1 m + reachable). Cheap: just amplitude
            // and arrival lookups, no entity allocation. ────────────
            let candidateCount = 0;
            for (let lat = latLo; lat <= latHi; lat += 1) {
              for (let lon = lonLo; lon <= lonHi; lon += 1) {
                const ti = Math.round(
                  ((gAmp.nLat - 1) * (gGrid.maxLat - lat)) / (gGrid.maxLat - gGrid.minLat)
                );
                const tj = Math.round(
                  ((gAmp.nLon - 1) * (lon - gGrid.minLon)) / (gGrid.maxLon - gGrid.minLon)
                );
                if (ti < 0 || ti >= gAmp.nLat || tj < 0 || tj >= gAmp.nLon) continue;
                const amplitude = gAmp.amplitudes[ti * gAmp.nLon + tj] ?? 0;
                if (!Number.isFinite(amplitude) || amplitude < MIN_AMPLITUDE_M) continue;
                const arrival = gT.arrivalTimes[ti * gT.nLon + tj] ?? Number.POSITIVE_INFINITY;
                if (!Number.isFinite(arrival)) continue;
                candidateCount += 1;
              }
            }
            // ── Adaptive step. step = ceil(√(candidates / MAX_ARROWS))
            // keeps geographic uniformity within a single event (every
            // grid step is the same in degrees) while bounding total
            // count: a Chicxulub-class footprint with 39 000 candidates
            // collapses to ~3 000 arrows at step 4°; a regional event
            // with 244 candidates stays at step 1° (no thinning).
            const stepDeg = Math.max(
              1,
              Math.ceil(Math.sqrt(Math.max(candidateCount, 1) / MAX_ARROWS))
            );
            // ── Pass 2: emit arrows at the adaptive step. ──────────
            let totalArrows = 0;
            for (let lat = latLo; lat <= latHi; lat += stepDeg) {
              for (let lon = lonLo; lon <= lonHi; lon += stepDeg) {
                // Look up amplitude at this geographic point. Map
                // (lat, lon) to (i, j) in the global grid via the same
                // row-major-north-to-south convention as the FMM.
                const ti = Math.round(
                  ((gAmp.nLat - 1) * (gGrid.maxLat - lat)) / (gGrid.maxLat - gGrid.minLat)
                );
                const tj = Math.round(
                  ((gAmp.nLon - 1) * (lon - gGrid.minLon)) / (gGrid.maxLon - gGrid.minLon)
                );
                if (ti < 0 || ti >= gAmp.nLat || tj < 0 || tj >= gAmp.nLon) continue;
                const amplitude = gAmp.amplitudes[ti * gAmp.nLon + tj] ?? 0;
                if (!Number.isFinite(amplitude) || amplitude < MIN_AMPLITUDE_M) continue;
                const arrival = gT.arrivalTimes[ti * gT.nLon + tj] ?? Number.POSITIVE_INFINITY;
                if (!Number.isFinite(arrival)) continue;
                const dir = sampleArrivalGradient(
                  gT.arrivalTimes,
                  gT.nLat,
                  gT.nLon,
                  gGrid.minLat,
                  gGrid.maxLat,
                  gGrid.minLon,
                  gGrid.maxLon,
                  lat,
                  lon
                );
                if (dir.east === 0 && dir.north === 0) continue;
                // Semina pesata sull'ampiezza: ogni cella tira un hash
                // deterministico e sopravvive con probabilità che
                // cresce con l'onda locale. Dove il mare è alto le
                // comete si addensano; dove è appena ≥ 1 m ne resta
                // una su sei.
                const weight = Math.min(1, 0.15 + (0.85 * amplitude) / 6);
                if (cellHash01(lat, lon) > weight) continue;
                const lengthM = ARROW_SIZE_M * 2.4 * Math.min(stepDeg, 3);
                const positions = buildCometPositions(lat, lon, dir.east, dir.north, lengthM);
                if (positions === null) continue;
                const id = `tsunami-arrow-${lat.toString()}-${lon.toString()}`;
                viewer.entities.add({
                  id,
                  polyline: {
                    positions,
                    width: 3,
                    material: cometMaterial,
                  },
                });
                // Tooltip: hovering over a streak shows the local wave
                // height at that point in metres, sourced directly
                // from the FMM amplitude field. The tooltip's
                // `radiusM` slot is repurposed as the amplitude — the
                // formatter switches based on `kind`.
                registerRingTooltip(id, 'tsunamiWaveAmplitude', amplitude, COMET_COLOR);
                totalArrows++;
              }
            }
            if (import.meta.env.DEV) {
              console.info(
                `[Globe] tsunami arrows: ${totalArrows.toString()} placed (${candidateCount.toString()} candidates, step ${stepDeg.toString()}°×${stepDeg.toString()}°, cap ${MAX_ARROWS.toString()})`
              );
            }
          }
        } catch (err: unknown) {
          console.warn('[Globe] tsunami arrow render failed:', err);
        }
        // ── La cresta che si propaga (regia tsunami approvata) ──────
        // Il campo dei tempi FMM viene ricampionato in ~28 fotogrammi
        // di iso-contorno (marching squares + concatenazione), e un
        // ciclo rAF li fa avanzare: un fronte luminoso che segue le
        // coste vere, con due fotogrammi di scia che sfumano. Con il
        // bloom della scena il bordo emette — è il protagonista.
        try {
          const lite = softwareRendererRef.current;
          const frames = buildCrestFrames({
            arrivalTimes: globalArrivalField.arrivalTimes,
            nLat: globalArrivalField.nLat,
            nLon: globalArrivalField.nLon,
            minLat: -85,
            maxLat: 85,
            minLon: -180,
            maxLon: 180,
            frameCount: lite ? 12 : 28,
            endPercentile: 0.85,
            stride: 2,
            minChainPoints: 6,
          });
          const MAX_CHAINS_PER_FRAME = lite ? 5 : 12;
          // Blu dell'acqua per la cresta in mare (richiesta di Andrea,
          // e coerente con l'art direction: «il blu è dell'acqua»);
          // l'onda d'urto sulla terraferma resta il cerchio dorato
          // della cascata. Testa azzurra accesa, coda che scivola
          // verso il blu profondo.
          const CREST_HEAD = Color.fromCssColorString('#2A80D8');
          const CREST_TAIL = Color.fromCssColorString('#154E8F');
          // Un colore-istanza dedicato per fotogramma, passato al
          // materiale UNA volta e poi mutato sul posto. La prima
          // versione scambiava tre MaterialProperty condivisi a ogni
          // passo: ogni scambio ricostruiva le primitive ed era la
          // causa dello scatto. Qui niente swap e niente allocazioni
          // per tick — solo uniform che cambiano mentre la scena
          // renderizza.
          const frameColors = frames.map(() => CREST_HEAD.withAlpha(0));
          const frameEntities: Entity[][] = frames.map((frame, k) => {
            const chains = [...frame.chains]
              .sort((a, b) => b.length - a.length)
              .slice(0, MAX_CHAINS_PER_FRAME);
            // CallbackProperty (non-costante): una ConstantProperty
            // verrebbe letta una volta sola e la mutazione in place
            // non arriverebbe mai alla GPU.
            const material = new PolylineGlowMaterialProperty({
              color: new CallbackProperty(() => frameColors[k] ?? Color.TRANSPARENT, false),
              // Glow contenuto: con l'HDR+bloom della scena un glow
              // pieno satura l'azzurro verso il bianco e l'acqua
              // smette di essere blu.
              glowPower: 0.2,
            });
            return chains.map((chain, i) =>
              viewer.entities.add({
                id: `tsunami-crest-${k.toString()}-${i.toString()}`,
                polyline: {
                  // Quota fissa di 2 km, come le frecce: il DEM ArcGIS
                  // include la batimetria, quindi una polilinea
                  // drappeggiata finirebbe sul fondale, sotto il
                  // rettangolo della velatura. Entità sempre accese:
                  // la visibilità la governa l'alpha del materiale.
                  positions: chain.map((pt) => Cartesian3.fromDegrees(pt.lon, pt.lat, 2_000)),
                  width: 8,
                  material,
                },
              })
            );
          });
          if (frameEntities.length > 0) {
            const CREST_LOOP_MS = 9_000;
            // Scia dietro la testa e accensione morbida davanti,
            // misurate in fotogrammi: la posizione continua p scorre
            // e ogni contorno si accende e si spegne in dissolvenza.
            const TRAIL_SPAN = 3.2;
            const LEAD_SPAN = 0.6;
            const paint = (pos: number): void => {
              for (let k = 0; k < frameColors.length; k++) {
                const tint = frameColors[k];
                if (tint === undefined) continue;
                const d = pos - k;
                let a = 0;
                if (d >= 0 && d <= TRAIL_SPAN) a = 0.88 * (1 - d / TRAIL_SPAN);
                else if (d < 0 && -d <= LEAD_SPAN) a = 0.88 * (1 + d / LEAD_SPAN);
                if (a <= 0) {
                  tint.alpha = 0;
                  continue;
                }
                const mix = d > 0 ? Math.min(1, d / TRAIL_SPAN) : 0;
                Color.lerp(CREST_HEAD, CREST_TAIL, mix, tint);
                tint.alpha = a;
              }
            };
            const crestReduceMotion =
              typeof window.matchMedia === 'function' &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (crestReduceMotion) {
              // Fotogramma intermedio fisso, come da regia: niente
              // animazione, ma la cresta esiste e racconta la scena.
              paint(frameColors.length * 0.4);
              viewer.scene.requestRender();
            } else {
              // Impulso alla sorgente: un battito radiale che parte
              // insieme al primo fotogramma di ogni giro della cresta.
              const PULSE_MS = 900;
              const pulseCenter = Cartesian3.fromDegrees(
                bathymetricTsunami.sourceLongitude,
                bathymetricTsunami.sourceLatitude
              );
              const cavityEntity = viewer.entities.getById(TSUNAMI_CAVITY_ID);
              const pulseBaseM = Math.max(
                40_000,
                Number(
                  cavityEntity?.ellipse?.semiMajorAxis?.getValue(viewer.clock.currentTime) ?? 0
                ) || 120_000
              );
              const pulseColor = Color.fromCssColorString('#9FD9FF');
              const pulseEntity = viewer.entities.add({
                id: 'tsunami-crest-pulse',
                position: pulseCenter,
                show: false,
                ellipse: {
                  semiMajorAxis: pulseBaseM,
                  semiMinorAxis: pulseBaseM,
                  fill: false,
                  outline: true,
                  outlineColor: pulseColor.withAlpha(0),
                  outlineWidth: 3,
                  height: 2_000,
                },
              });
              const crestT0 = performance.now();
              let lastLoop = -1;
              let pulseT0 = -1;
              const crestStep = (): void => {
                if (viewer.isDestroyed()) return;
                const now = performance.now();
                const elapsed = now - crestT0;
                const loopN = Math.floor(elapsed / CREST_LOOP_MS);
                if (loopN !== lastLoop) {
                  lastLoop = loopN;
                  pulseT0 = now; // battito a ogni giro nuovo
                }
                paint(((elapsed % CREST_LOOP_MS) / CREST_LOOP_MS) * frameColors.length);
                if (pulseT0 >= 0) {
                  const pt = (now - pulseT0) / PULSE_MS;
                  const ellipse = pulseEntity.ellipse;
                  if (pt >= 1 || ellipse === undefined) {
                    pulseEntity.show = false;
                    pulseT0 = -1;
                  } else {
                    // Entrambi gli assi nella stessa istruzione
                    // sincrona: due CallbackProperty indipendenti
                    // farebbero scattare l'invariante minor ≤ major
                    // di EllipseGeometry.
                    const r = pulseBaseM * (0.6 + 1.1 * pt);
                    (
                      ellipse as unknown as { semiMajorAxis: number; semiMinorAxis: number }
                    ).semiMajorAxis = r;
                    (
                      ellipse as unknown as { semiMajorAxis: number; semiMinorAxis: number }
                    ).semiMinorAxis = r;
                    (ellipse as unknown as { outlineColor: Color }).outlineColor =
                      pulseColor.withAlpha(0.7 * (1 - pt));
                    pulseEntity.show = true;
                  }
                }
                viewer.scene.requestRender();
              };
              cancelCrestRef.current = loopAtFps(lite ? 12 : 24, crestStep);
            }
          }
        } catch (err: unknown) {
          console.warn('[Globe] tsunami crest render failed:', err);
        }
        // ── Isocrone orarie (revival della Fase 16) ─────────────────
        // Il linguaggio delle mappe NOAA: anelli tratteggiati sottili a
        // +1h / +2h / +4h / +8h con etichetta mono, estratti dallo
        // stesso campo dei tempi con lo stesso estrattore del fronte
        // (quindi niente coste ricalcate). Statici: il tempo che scorre
        // lo racconta la cresta, le isocrone sono la scala graduata.
        try {
          const ISOCHRONE_HOURS = [1, 2, 4, 8];
          const isoMaterial = new PolylineDashMaterialProperty({
            color: Color.fromCssColorString('#CFE8F2').withAlpha(0.4),
            dashLength: 12,
          });
          const isoLabelColor = Color.fromCssColorString('#CFE8F2').withAlpha(0.85);
          for (const hours of ISOCHRONE_HOURS) {
            const chains = stitchSegmentsIntoChains(
              extractFrontContour({
                values: globalArrivalField.arrivalTimes,
                nLat: globalArrivalField.nLat,
                nLon: globalArrivalField.nLon,
                minLat: -85,
                maxLat: 85,
                minLon: -180,
                maxLon: 180,
                threshold: hours * 3_600,
              }),
              8
            )
              .sort((a, b) => b.length - a.length)
              .slice(0, 6);
            chains.forEach((chain, i) => {
              viewer.entities.add({
                id: `tsunami-isochrone-${hours.toString()}h-${i.toString()}`,
                polyline: {
                  positions: chain.map((pt) => Cartesian3.fromDegrees(pt.lon, pt.lat, 2_000)),
                  width: 1.6,
                  material: isoMaterial,
                },
              });
            });
            const longest = chains[0];
            const anchor = longest?.[Math.floor((longest.length * 2) / 3)];
            if (anchor !== undefined) {
              viewer.entities.add({
                id: `tsunami-isochrone-${hours.toString()}h-label`,
                position: Cartesian3.fromDegrees(anchor.lon, anchor.lat, 2_000),
                label: {
                  text: `+${hours.toString()} h`,
                  font: '11px "JetBrains Mono", monospace',
                  fillColor: isoLabelColor,
                  outlineColor: Color.fromCssColorString('#0A0E16').withAlpha(0.8),
                  outlineWidth: 2,
                  style: LabelStyle.FILL_AND_OUTLINE,
                  scale: 1,
                },
              });
            }
          }
        } catch (err: unknown) {
          console.warn('[Globe] tsunami isochrones render failed:', err);
        }
        // ── Impatti costieri globali ────────────────────────────────
        // Run-up Synolakis sul mosaico planetario: pochi picchi, uno
        // per bacino di 3°, esclusa la zona già coperta dal tile
        // locale ad alta risoluzione.
        try {
          const gGridRunup = useAppStore.getState().globalBathymetricGrid;
          if (gGridRunup !== null) {
            const gRunup = computeRunupField({
              amplitudeField: globalAmpField,
              grid: gGridRunup,
            });
            const peaks = pickRunupPeaks(
              gRunup.cells.filter(
                (c) =>
                  Math.abs(c.latitude - ringAnchor.latitude) > 1.5 ||
                  Math.abs(c.longitude - ringAnchor.longitude) > 1.5
              ),
              { binDeg: 3, minRunupM: 2, maxCount: 14 }
            );
            addRunupMarkers(peaks, 'tsunami-runup-global');
          }
        } catch (err: unknown) {
          console.warn('[Globe] global runup markers failed:', err);
        }
        if (import.meta.env.DEV) {
          console.info(
            `[Globe] global tsunami layer render: ${(performance.now() - tGlobalStart).toFixed(0)}ms`
          );
        }
      }
      // ──────────────────────────────────────────────────────────────
      // Local high-res tile (~150 km, ~600 m/pixel). Renders the same
      // discrete-band amplitude heatmap as the global layer, just on
      // a tighter rectangle anchored on the source. Adds near-source
      // resolution detail (sub-km pixels visible when the camera is
      // zoomed in). Arrival-time heatmap retired in Phase 16 — the
      // arrows + amplitude bands carry the visualisation; per-tier
      // isochrones, run-up coastal point markers and per-cell colour
      // dots are now exposed only in the analysis panel, never on the
      // globe (per the Phase 16 directive that the map should never
      // show indicators on land).
      // Il tile locale è un rettangolo a bordi netti: sopra il velo
      // planetario si vedrebbe come una toppa quadrata attorno alla
      // sorgente. Quando il layer globale copre già la scena il tile
      // locale non aggiunge informazione, solo un artefatto — quindi
      // resta un fallback per gli eventi che il globale non serve.
      const globalVeilActive =
        bathymetricTsunami.global?.amplitude !== undefined &&
        bathymetricTsunami.global.amplitude.maxAmplitude >= 1;
      if (
        !globalVeilActive &&
        grid !== null &&
        Number.isFinite(grid.minLat) &&
        Number.isFinite(grid.maxLat) &&
        Math.abs(grid.minLat) <= 90 &&
        Math.abs(grid.maxLat) <= 90 &&
        bathymetricTsunami.amplitude !== undefined
      ) {
        try {
          const ampField = bathymetricTsunami.amplitude;
          const localDisplay = smoothFieldForContours(
            toDeepWaterEquivalent(ampField.amplitudes, grid.samples),
            ampField.nLat,
            ampField.nLon,
            2
          );
          const ampHeatmap = renderScalarFieldHeatmap(localDisplay, ampField.nLat, ampField.nLon, {
            opacity: 0.45,
            colormap: 'waveVeil',
            valueMin: 1,
            valueMax: 10,
            transparentBelow: 1,
            scale: 'sqrt',
          });
          drawContourOverlay(
            ampHeatmap.canvas,
            WAVE_CONTOUR_STYLES.map(({ threshold, css }) => ({
              css,
              segments:
                extractAmplitudeContours({
                  amplitudes: localDisplay,
                  nLat: ampField.nLat,
                  nLon: ampField.nLon,
                  minLat: grid.minLat,
                  maxLat: grid.maxLat,
                  minLon: grid.minLon,
                  maxLon: grid.maxLon,
                  thresholds: [threshold],
                })[0]?.segments ?? [],
            })),
            { minLat: grid.minLat, maxLat: grid.maxLat, minLon: grid.minLon, maxLon: grid.maxLon },
            1.5
          );
          viewer.entities.add({
            id: FMM_AMPLITUDE_HEATMAP_ID,
            rectangle: {
              coordinates: Rectangle.fromDegrees(
                normLon(grid.minLon),
                grid.minLat,
                normLon(grid.maxLon),
                grid.maxLat
              ),
              material: new ImageMaterialProperty({
                image: ampHeatmap.canvas,
                transparent: true,
              }),
              height: 0,
            },
          });
        } catch (err: unknown) {
          console.warn('[Globe] local amplitude heatmap render failed:', err);
        }
        // ── Local wave-direction arrows ──────────────────────────
        // Sample a coarse cell stride on the local FMM tile (~150 km,
        // ~600 m/pixel) so events that don't propagate widely enough
        // on the global 40 km/pixel grid (sub-megaton explosions in
        // confined basins, modest landslides, M9-class shelf events)
        // STILL get a visual hint of the wave direction near the
        // source, instead of leaving the user with an empty map.
        // Same gating as the global pass: amplitude ≥ 1 m and arrival
        // finite. Same glyph (comet streak, amplitude-weighted
        // seeding) and same tooltip kind, so the user reads the two
        // layers as a single uniform field. The whole local block is
        // already gated on the global layer being absent, so these
        // streaks never double the planetary ones.
        try {
          const ampField = bathymetricTsunami.amplitude;
          const arrField = bathymetricTsunami.field;
          const LOCAL_COMET_COLOR = Color.fromCssColorString('#BFE8F5');
          const localCometMaterial = new PolylineGlowMaterialProperty({
            color: LOCAL_COMET_COLOR.withAlpha(0.55),
            glowPower: 0.3,
            taperPower: 0.45,
          });
          const LOCAL_ARROW_SIZE_M = 6_000;
          const LOCAL_MIN_AMPLITUDE_M = 1.0;
          // Aim for ~10 arrows per side on the tile (~100 total).
          // Stride is computed from the actual nLat / nLon so it
          // adapts if the local tile resolution changes.
          const TARGET_LOCAL_PER_SIDE = 10;
          const stride = Math.max(
            1,
            Math.floor(Math.min(ampField.nLat, ampField.nLon) / TARGET_LOCAL_PER_SIDE)
          );
          let localArrows = 0;
          for (let i = 0; i < ampField.nLat; i += stride) {
            for (let j = 0; j < ampField.nLon; j += stride) {
              const amp = ampField.amplitudes[i * ampField.nLon + j] ?? 0;
              if (!Number.isFinite(amp) || amp < LOCAL_MIN_AMPLITUDE_M) continue;
              const arrival =
                arrField.arrivalTimes[i * arrField.nLon + j] ?? Number.POSITIVE_INFINITY;
              if (!Number.isFinite(arrival)) continue;
              const cellLat = grid.maxLat - (i / (ampField.nLat - 1)) * (grid.maxLat - grid.minLat);
              const cellLon = grid.minLon + (j / (ampField.nLon - 1)) * (grid.maxLon - grid.minLon);
              const dir = sampleArrivalGradient(
                arrField.arrivalTimes,
                arrField.nLat,
                arrField.nLon,
                grid.minLat,
                grid.maxLat,
                grid.minLon,
                grid.maxLon,
                cellLat,
                cellLon
              );
              if (dir.east === 0 && dir.north === 0) continue;
              const weight = Math.min(1, 0.15 + (0.85 * amp) / 6);
              if (cellHash01(i, j) > weight) continue;
              const positions = buildCometPositions(
                cellLat,
                cellLon,
                dir.east,
                dir.north,
                LOCAL_ARROW_SIZE_M * 2.4
              );
              if (positions === null) continue;
              const id = `tsunami-arrow-local-${i.toString()}-${j.toString()}`;
              viewer.entities.add({
                id,
                polyline: {
                  positions,
                  width: 3,
                  material: localCometMaterial,
                },
              });
              registerRingTooltip(id, 'tsunamiWaveAmplitude', amp, LOCAL_COMET_COLOR);
              localArrows += 1;
            }
          }
          if (import.meta.env.DEV) {
            console.info(
              `[Globe] tsunami local arrows: ${localArrows.toString()} placed (stride ${stride.toString()} cells over ${ampField.nLat.toString()}×${ampField.nLon.toString()} tile)`
            );
          }
        } catch (err: unknown) {
          console.warn('[Globe] local tsunami arrow render failed:', err);
        }
        // ── Impatti costieri locali (tile ~150 km, run-up già in
        // bathymetricTsunami.runup) ─────────────────────────────────
        try {
          const runupField = bathymetricTsunami.runup;
          if (runupField !== undefined) {
            const peaks = pickRunupPeaks(runupField.cells, {
              binDeg: 0.25,
              minRunupM: 2,
              maxCount: 8,
            });
            addRunupMarkers(peaks, 'tsunami-runup-local');
          }
        } catch (err: unknown) {
          console.warn('[Globe] local runup markers failed:', err);
        }
      }
    }

    // Ring animation start is deferred until after the camera fly-to
    // resolves below — see the `complete:` callback on
    // `flyToBoundingSphere`. Letting both run concurrently meant the
    // user watched the camera pull back at the same instant the rings
    // expanded, washing out the staggered cascade. The new sequence:
    //   1. camera flies to its framing (~0.6 s),
    //   2. then the cascade plays with its physical-front-stagger.
    // Scenes with no frame radius (no positive ring outputs) fall
    // through to the immediate-start branch in the camera block.

    // --- Monte-Carlo fuzzy bounds (P10/P90 around the nominal P50) -
    // When the user has run the MC sweep, draw two faint extra rings
    // per representative metric: an inner P10 (optimistic) and an
    // outer P90 (pessimistic). Alpha is intentionally low (0.10 fill,
    // 0.4 outline) so the bands read as "uncertainty halo", not as
    // additional damage zones. We render at most two metric pairs
    // per event type to keep the globe legible.
    if (monteCarlo !== null && monteCarlo.type === result.type) {
      const fuzzyMetrics = pickFuzzyMetrics(monteCarlo);
      fuzzyMetrics.forEach((spec, idx) => {
        const drawBand = (suffix: string, radius: number, color: Color, alpha: number): void => {
          if (!Number.isFinite(radius) || radius <= 0) return;
          // Fuzzy P10/P90 bands are an *uncertainty halo*, not an
          // additional damage threshold. Suppress the outline (so
          // they don't read as "another ring") and dim the body
          // alpha further so they live as quiet whispers around the
          // deterministic ring.
          viewer.entities.add({
            id: `${FUZZY_RING_ID_PREFIX}${idx.toString()}-${suffix}`,
            position: centerCartesian,
            ellipse: {
              semiMajorAxis: clampToGreatCircle(radius),
              semiMinorAxis: clampToGreatCircle(radius),
              material: radialDamageMaterial(color, alpha * 0.18),
              outline: false,
              height: 0,
              heightReference: HeightReference.CLAMP_TO_GROUND,
            },
          });
        };
        drawBand('p10', spec.p10, spec.color, 0.4);
        drawBand('p90', spec.p90, spec.color, 0.4);

        // Phase 8c — radial ECDF heatmap underneath the bands. When
        // the MC engine returned the raw sample set, build an
        // exceedance-probability oracle and render its 256-step
        // radial alpha gradient as a Cesium Rectangle. The result
        // visually conveys "darker = very likely, fading = rare worst
        // case" on top of the existing P10/P90 reference rings.
        if (spec.samples !== undefined && spec.samples.length > 0) {
          // Convert diameter samples to radii so the bitmap's
          // halfEdge matches the ground-range radius the rings live
          // in.
          const radiusSamples =
            spec.scale === 'diameter' ? spec.samples.map((s) => s / 2) : spec.samples;
          const ecdf = buildExceedanceProbability(radiusSamples);
          try {
            const bitmap = renderRadialEcdfBitmap(ecdf, {
              size: 256,
              maxAlpha: 0.35,
              rgb: [
                Math.round(spec.color.red * 255),
                Math.round(spec.color.green * 255),
                Math.round(spec.color.blue * 255),
              ],
            });
            if (bitmap !== null) {
              const halfEdgeM = bitmap.halfEdgeMeters;
              // Convert metres to a Cesium Rectangle in degrees,
              // adjusting the longitude span by cos(latitude) so the
              // bitmap stays geometrically square at non-equatorial
              // latitudes.
              const latDeg = halfEdgeM / 111_000;
              const cosLat = Math.max(Math.cos((ringAnchor.latitude * Math.PI) / 180), 1e-6);
              const lonDeg = latDeg / cosLat;
              viewer.entities.add({
                id: `${FUZZY_RING_ID_PREFIX}${idx.toString()}-ecdf`,
                rectangle: {
                  coordinates: Rectangle.fromDegrees(
                    ringAnchor.longitude - lonDeg,
                    ringAnchor.latitude - latDeg,
                    ringAnchor.longitude + lonDeg,
                    ringAnchor.latitude + latDeg
                  ),
                  material: new ImageMaterialProperty({
                    image: bitmap.canvas,
                    transparent: true,
                  }),
                  // Phase 14a hotfix — flat at sea level (see above).
                  height: 0,
                },
              });
            }
          } catch (err: unknown) {
            console.warn('[Globe] radial ECDF heatmap render failed:', err);
          }
        }
      });
    }

    // --- Unified camera auto-framing -------------------------------
    // Pull the camera back so the damage / ashfall / EMP overlays
    // fit in frame. The tsunami amplitude footprint is sampled from
    // the global FMM amplitude field — we walk the planetary grid,
    // measure the great-circle distance from the source to every
    // cell with amplitude ≥ 1 m, and take the maximum so the camera
    // sees the whole tsunami reach (which can be antipodal for
    // Chicxulub-class events and small for a megaton-class
    // explosion in a confined basin).
    let tsunamiReachM = 0;
    if (bathymetricTsunami?.global?.amplitude !== undefined) {
      const gAmp = bathymetricTsunami.global.amplitude;
      const gGrid = useAppStore.getState().globalBathymetricGrid;
      if (gGrid !== null) {
        const latStep = (gGrid.maxLat - gGrid.minLat) / Math.max(1, gAmp.nLat - 1);
        const lonStep = (gGrid.maxLon - gGrid.minLon) / Math.max(1, gAmp.nLon - 1);
        const lat0Rad = (ringAnchor.latitude * Math.PI) / 180;
        const cosLat0 = Math.max(Math.cos(lat0Rad), 1e-6);
        for (let i = 0; i < gAmp.nLat; i += 4) {
          const lat = gGrid.maxLat - i * latStep;
          for (let j = 0; j < gAmp.nLon; j += 4) {
            const a = gAmp.amplitudes[i * gAmp.nLon + j] ?? 0;
            if (!Number.isFinite(a) || a < 1) continue;
            const lon = gGrid.minLon + j * lonStep;
            const dLat = (lat - ringAnchor.latitude) * 111_000;
            const dLon = (lon - ringAnchor.longitude) * 111_000 * cosLat0;
            const r = Math.sqrt(dLat * dLat + dLon * dLon);
            if (r > tsunamiReachM) tsunamiReachM = r;
          }
        }
      }
    }
    const frameRadius = Math.min(
      computeFrameRadius(result, ashfall, tsunamiReachM),
      EARTH_GREAT_CIRCLE_MAX
    );
    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startCascade = (): void => {
      if (ringSpecs.length === 0) return;
      cancelRingAnimationRef.current = animateRingsImperatively(ringSpecs);

      // Fronte d'urto — la controparte di terra della cresta tsunami
      // (richiesta di Andrea): un bordo che viaggia IN CICLO con due
      // anelli di scia che sfumano, e che cambia colore attraversando
      // le soglie della legenda — dentro la zona del cratere è rosso
      // cratere, superata la soglia termica prende l'arancio, e così
      // via fino al giallo pallido dell'ultimo anello. I colori non
      // sono una seconda tavolozza: vengono letti dagli anelli veri
      // della cascata, così legenda, anelli e fronte dicono la stessa
      // cosa per ogni tipo di evento.
      const cascadeMaxRadiusM = ringSpecs.reduce((m, s) => Math.max(m, s.finalSemiMajor), 0);
      if (cascadeMaxRadiusM > 0) {
        // Zone di colore: (raggio, colore) dagli anelli disegnati,
        // ordinate dal centro verso fuori.
        const zones = ringSpecs
          .map((spec) => {
            const c = spec.entity.ellipse?.outlineColor?.getValue(viewer.clock.currentTime) as
              | Color
              | undefined;
            return c === undefined ? null : { r: spec.finalSemiMajor, color: c };
          })
          .filter((z): z is { r: number; color: Color } => z !== null)
          .sort((a, b) => a.r - b.r);
        const fallbackGold = Color.fromCssColorString('#facc15');
        const blendBandM = cascadeMaxRadiusM * 0.08;
        const zoneColorAt = (r: number, out: Color): Color => {
          if (zones.length === 0) return Color.clone(fallbackGold, out);
          let idx = zones.findIndex((z) => z.r >= r);
          if (idx === -1) idx = zones.length - 1;
          const current = zones[idx];
          if (current === undefined) return Color.clone(fallbackGold, out);
          const previous = idx > 0 ? zones[idx - 1] : undefined;
          if (previous !== undefined && blendBandM > 0) {
            const d = r - previous.r;
            if (d >= 0 && d < blendBandM) {
              return Color.lerp(previous.color, current.color, d / blendBandM, out);
            }
          }
          return Color.clone(current.color, out);
        };

        const makeFrontRing = (suffix: string, width: number): Entity =>
          viewer.entities.add({
            id: `${WAVEFRONT_INDICATOR_ID}${suffix}`,
            position: centerCartesian,
            ellipse: {
              semiMajorAxis: RING_INITIAL_RADIUS_M,
              semiMinorAxis: RING_INITIAL_RADIUS_M,
              // No fill — the wavefront is a propagating EDGE. The
              // outline renders as a ground polyline, always visible
              // regardless of camera pitch.
              fill: false,
              outline: true,
              outlineColor: fallbackGold.withAlpha(0),
              outlineWidth: width,
              // Quota fissa invece dell'aggancio al terreno: un'ellisse
              // clampata viene ri-tassellata E ri-classificata sul DEM
              // a ogni fotogramma, e con il fronte che gira in ciclo
              // questo costo non finisce mai — su un rasterizzatore
              // software basta a bloccare i click. A 2 km lo scarto
              // visivo è nullo alle scale in gioco, ed è la stessa
              // scelta già fatta per la cresta dello tsunami.
              height: 2_000,
            },
          });
        const frontHead = makeFrontRing('', 6);
        const frontTrailA = makeFrontRing('-trail-a', 4);
        const frontTrailB = makeFrontRing('-trail-b', 3);
        const rings: { entity: Entity; lagM: number; alpha: number; scratch: Color }[] = [
          { entity: frontHead, lagM: 0, alpha: 0.95, scratch: new Color() },
          {
            entity: frontTrailA,
            lagM: cascadeMaxRadiusM * 0.06,
            alpha: 0.45,
            scratch: new Color(),
          },
          { entity: frontTrailB, lagM: cascadeMaxRadiusM * 0.13, alpha: 0.2, scratch: new Color() },
        ];
        const reduceMotionFront = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        // Primo passaggio in sincrono con la cascata (5 s), poi il
        // fronte continua a girare come la cresta tsunami. Con
        // prefers-reduced-motion: un solo passaggio veloce e via.
        const FRONT_LOOP_MS = reduceMotionFront ? 1_800 : 7_000;
        const cascadeT0 = performance.now();
        let stopFront: (() => void) | null = null;
        const removeFrontRings = (): void => {
          if (viewer.isDestroyed()) return;
          for (const ring of rings) {
            const stale = viewer.entities.getById(ring.entity.id);
            if (stale) viewer.entities.remove(stale);
          }
        };
        const wavefrontStep = (): void => {
          if (viewer.isDestroyed()) return;
          const elapsed = performance.now() - cascadeT0;
          if (reduceMotionFront && elapsed >= FRONT_LOOP_MS) {
            stopFront?.();
            removeFrontRings();
            return;
          }
          const rHead = cascadeMaxRadiusM * ((elapsed % FRONT_LOOP_MS) / FRONT_LOOP_MS);
          for (const ring of rings) {
            const ellipse = ring.entity.ellipse;
            if (ellipse === undefined) continue;
            const r = rHead - ring.lagM;
            if (r <= RING_INITIAL_RADIUS_M) {
              ring.scratch.alpha = 0;
              (ellipse as unknown as { outlineColor: Color }).outlineColor = ring.scratch;
              continue;
            }
            // CRITICAL: entrambi gli assi nella stessa istruzione
            // sincrona — due CallbackProperty indipendenti farebbero
            // scattare l'invariante minor ≤ major di EllipseGeometry
            // (vedi l'header di ringAnimation.ts).
            (ellipse as unknown as { semiMajorAxis: number; semiMinorAxis: number }).semiMajorAxis =
              r;
            (ellipse as unknown as { semiMajorAxis: number; semiMinorAxis: number }).semiMinorAxis =
              r;
            zoneColorAt(r, ring.scratch);
            // La testa si spegne dolcemente sull'ultimo 6% del giro,
            // così il riavvio dal centro non è uno stacco secco.
            const tail = 1 - rHead / cascadeMaxRadiusM;
            ring.scratch.alpha = ring.alpha * Math.min(1, tail / 0.06);
            (ellipse as unknown as { outlineColor: Color }).outlineColor = ring.scratch;
          }
          viewer.scene.requestRender();
        };
        stopFront = loopAtFps(softwareRendererRef.current ? 12 : 24, wavefrontStep);
        const stopFrontLoop = stopFront;
        cancelWavefrontRef.current = (): void => {
          stopFrontLoop();
          removeFrontRings();
        };
      }

      // Mushroom-cloud / fireball VFX (impacts + explosions only).
      // Synchronised with the ring cascade so the user sees the flash
      // bloom alongside the thermal ring's reveal — same beat.
      // PROTOTIPO `?vol`: palla di fuoco volumetrica con shader al
      // posto degli ellissoidi colorati, per confrontare le due rese
      // sullo stesso evento. Mai su rasterizzatore software: sei
      // campioni di rumore per frammento lo metterebbero in ginocchio.
      // `?vol` la accende dove c'è una GPU; `?vol=force` la accende
      // comunque, che serve a collaudare lo shader in ambienti senza
      // scheda grafica (il browser headless dei test lo è).
      const volParam = new URLSearchParams(window.location.search).get('vol');
      const fireballVolumetrica =
        volParam !== null && (volParam === 'force' || !softwareRendererRef.current);
      if (result.type === 'impact') {
        cancelExplosionVfxRef.current = spawnExplosionVfxFromJoules({
          viewer,
          latitude: ringAnchor.latitude,
          longitude: ringAnchor.longitude,
          energyJoules: result.data.impactor.kineticEnergy,
          volumetricFireball: fireballVolumetrica,
        });
      } else if (result.type === 'explosion') {
        cancelExplosionVfxRef.current = spawnExplosionVfxFromJoules({
          viewer,
          latitude: ringAnchor.latitude,
          longitude: ringAnchor.longitude,
          energyJoules: result.data.yield.joules,
          volumetricFireball: fireballVolumetrica,
        });
      } else if (result.type === 'volcano') {
        // La colonna eruttiva col suo ombrello: il corpo che all'evento
        // vulcanico mancava (il faro di quota resta come tacca leggibile
        // dall'alto, quando la colonna non è inquadrata di profilo).
        cancelExplosionVfxRef.current = spawnEruptionColumn({
          viewer,
          latitude: ringAnchor.latitude,
          longitude: ringAnchor.longitude,
          plumeHeightM: result.data.plumeHeight,
        });
      }
    };
    // ── Camera a due tempi ──────────────────────────────────────────
    // Nessuna inquadratura può mostrare insieme una nube alta 30 km e
    // anelli larghi 6 000: sono tre ordini di grandezza. Quindi il
    // racconto si spezza in due battute, come farebbe un documentario:
    //   1. primo piano obliquo sull'evento mentre i volumi crescono,
    //   2. ritirata sulla vista analitica, dove gli anelli sono la
    //      storia.
    // Con prefers-reduced-motion la prima battuta salta e si va dritti
    // alla seconda.
    const cloudTopM =
      result.type === 'impact'
        ? mushroomCloudAltitudeMeters(result.data.impactor.kineticEnergy / 4.184e12)
        : result.type === 'explosion'
          ? mushroomCloudAltitudeMeters(result.data.yield.joules / 4.184e12)
          : result.type === 'volcano'
            ? (result.data.plumeHeight as number)
            : 0;
    const wantsCloseUp = !reduceMotion && cloudTopM > 2_000;
    if (wantsCloseUp) {
      // Distanza tarata sull'altezza del volume, non sul raggio degli
      // anelli: il soggetto di questa battuta è la colonna.
      const closeRange = Math.max(90_000, cloudTopM * 4.5);
      viewer.camera.flyToBoundingSphere(new BoundingSphere(centerCartesian, cloudTopM * 0.6), {
        duration: 1.2,
        // 40° fuori dalla verticale: abbastanza obliquo perché i volumi
        // abbiano profondità, abbastanza alto da non perdere il suolo.
        offset: new HeadingPitchRange(
          CesiumMath.toRadians(35),
          -CesiumMath.toRadians(50),
          closeRange
        ),
        complete: startCascade,
      });
    }
    if (frameRadius > 0) {
      // Cap padded radius at half-Earth so planetary-scale scenarios
      // (Chicxulub light-damage ≈ 6 800 km) don't push the camera
      // beyond the visible disc — past that point a wider frame just
      // shows more void and makes mouse drags feel like the planet
      // is sliding away.
      const padded = Math.min(Math.max(frameRadius * 1.2, 30_000), 8_500_000);
      // Camera pitch:
      //  - Ground-pattern events (earthquake, volcano, landslide):
      //    pure top-down (−90°). The rings are the whole story.
      //  - Cloud events (impact, explosion): a *gentle* tilt 15° off
      //    the vertical (−75°) so the mushroom cloud reads as a
      //    profile against the imagery without breaking the
      //    "aerial map" mental model. The previous −60° (30° off)
      //    tilt was too oblique: combined with the wide pull-back it
      //    caused `enableRotate` left-drags to orbit the camera around
      //    a pick-point in deep space whenever the cursor missed the
      //    Earth disc, drifting the epicentre off-centre.
      // Eventi con un volume in quota: la vista analitica conserva una
      // leggera obliquità, altrimenti la colonna o il fungo tornano a
      // essere un cerchio visto dall'alto.
      const isCloudEvent =
        result.type === 'impact' || result.type === 'explosion' || result.type === 'volcano';
      const cameraPitchRad = isCloudEvent ? -CesiumMath.toRadians(75) : -Math.PI / 2;
      // Range = camera-to-target distance. The previous ×2.5 multiplier
      // pushed the camera 14 000 km up for planetary scenarios — past
      // half the Earth–Moon distance, where any wheel-zoom or drag
      // overshot wildly. ×1.6 keeps a 60 % visual margin around the
      // bounding sphere while staying close enough that the screen-space
      // picker keeps catching the globe under the cursor. Range is
      // additionally clamped so the post-fly camera stays inside the
      // configured `maximumZoomDistance`.
      const range = Math.min(padded * 1.6, 28_000_000);
      const flyToOverview = (): void => {
        if (viewer.isDestroyed()) return;
        viewer.camera.flyToBoundingSphere(new BoundingSphere(centerCartesian, padded), {
          duration: reduceMotion ? 0 : 1.4,
          offset: new HeadingPitchRange(0, cameraPitchRad, range),
          // La cascata parte con la vista analitica solo quando NON
          // c'è stata la battuta ravvicinata (che l'ha già avviata).
          ...(wantsCloseUp ? {} : { complete: startCascade }),
        });
      };
      if (wantsCloseUp) {
        // Sei secondi di primo piano: il tempo che la nube impiega a
        // salire e il cappello ad aprirsi (vedi explosionVfx).
        const overviewTimer = window.setTimeout(flyToOverview, 6_000);
        cancelOverviewFlyRef.current = (): void => {
          window.clearTimeout(overviewTimer);
        };
      } else {
        flyToOverview();
      }
    } else {
      // No camera fly required (e.g. landslide scenarios with no
      // surface ring) — kick the cascade off immediately so the
      // tsunami cavity still gets its expansion animation.
      startCascade();
    }

    // Cesium runs in request-render mode by default once initialised;
    // entity adds usually wake it up but a few of the heatmap and
    // isochrone branches above wire their primitives through async
    // CallbackProperties that don't trigger an automatic render. Nudge
    // the scene at the end so the new tsunami cavity / wave-fronts /
    // FMM heatmap appear on the very next frame instead of waiting for
    // the user to mouse over the canvas.
    viewer.scene.requestRender();
  }, [location, lastEvaluatedAtLocation, result, bathymetricTsunami, monteCarlo]);

  // --- Aftershock click-through detail rings ---------------------------
  // When the user clicks an aftershock dot, paint three dim MMI V/VI/VII
  // contours around its offset position. We compute radii on demand via
  // the same Joyner–Boore + Worden 2012 chain used for the mainshock —
  // see `aftershockShakingFootprint` in
  // src/physics/events/earthquake/aftershocks.ts. The detail rings are
  // *non-cascading* (they pop in at full size) because they answer a
  // direct user question ("what's the reach of this aftershock?")
  // rather than dramatising a wavefront — adding the cascade animation
  // would just delay the answer for no pedagogical gain.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    // Tear down any pre-existing detail rings (covers re-pin onto a
    // different aftershock and dismissal alike).
    AFTERSHOCK_DETAIL_IDS.forEach((id) => {
      const e = viewer.entities.getById(id);
      if (e) viewer.entities.remove(e);
    });

    if (selectedAftershockIndex === null || result?.type !== 'earthquake' || location === null) {
      return;
    }

    const event = result.data.aftershocks.events[selectedAftershockIndex];
    if (event === undefined) return;

    const footprint = aftershockShakingFootprint(event.magnitude);
    const latRad = (location.latitude * Math.PI) / 180;
    const cosLat = Math.max(Math.cos(latRad), 1e-6);
    const dlat = (event.northOffsetM as number) / 111_000;
    const dlon = (event.eastOffsetM as number) / (111_000 * cosLat);
    const center = Cartesian3.fromDegrees(location.longitude + dlon, location.latitude + dlat);

    const contours: { id: string; radius: number; color: Color; alpha: number }[] = [
      // The MMI ramp goes "lightest contour at the largest radius" so
      // the eye reads outward → safer, mirroring how the mainshock
      // mmi7/8/9 rings are painted.
      {
        id: AFTERSHOCK_DETAIL_IDS[0],
        radius: footprint.mmi5Radius,
        color: MMI_RING_COLORS.mmi7,
        alpha: 0.25,
      },
      {
        id: AFTERSHOCK_DETAIL_IDS[1],
        radius: footprint.mmi6Radius,
        color: MMI_RING_COLORS.mmi8,
        alpha: 0.35,
      },
      {
        id: AFTERSHOCK_DETAIL_IDS[2],
        radius: footprint.mmi7Radius,
        color: MMI_RING_COLORS.mmi9,
        alpha: 0.45,
      },
    ];

    contours.forEach(({ id, radius, color, alpha }) => {
      if (!Number.isFinite(radius) || radius <= 0) return;
      viewer.entities.add({
        id,
        position: center,
        ellipse: {
          semiMajorAxis: clampToGreatCircle(radius),
          semiMinorAxis: clampToGreatCircle(radius),
          material: radialDamageMaterial(color, alpha),
          outline: true,
          outlineColor: color.withAlpha(0.55),
          height: 0,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
      });
    });

    return (): void => {
      if (viewer.isDestroyed()) return;
      AFTERSHOCK_DETAIL_IDS.forEach((id) => {
        const e = viewer.entities.getById(id);
        if (e) viewer.entities.remove(e);
      });
    };
  }, [selectedAftershockIndex, result, location]);

  return (
    <>
      <div ref={containerRef} className={styles.container} data-testid="globe-viewer" />
      <RingTooltip ref={tooltipElRef} info={hoverInfo} />
      <AftershockDetailCard />
    </>
  );
}

/**
 * Collect the widest ground-range reach across every overlay the
 * scene is about to render, so the camera frame encloses them all.
 *
 * Per event type:
 *   - impact: damage.overpressure1psi, firestorm sustain, ejecta 1 m
 *     edge, impact-tsunami cavity (when oceanic).
 *   - explosion: 1 psi ring, thermal 3°, firestorm sustain, EMP
 *     affected radius (dominates for HEMP exoatmospheric bursts like
 *     Starfish Prime — ~2 300 km).
 *   - earthquake: rupture length / 2, MMI VII contour, liquefaction
 *     radius (the last dominates for megathrusts like Tōhoku).
 *   - volcano: pyroclastic runout, ashfall plume downwind extent.
 *   - bathymetric tsunami isochrones (via `isochroneReach` argument).
 *
 * Returns 0 when nothing can be framed (e.g. before evaluate).
 */
/**
 * Choose up to two representative MC metrics whose P10/P90 percentiles
 * are worth painting as fuzzy uncertainty bands on the globe. Each
 * spec carries the radius pair (m) and the colour to use; the colour
 * matches the nominal-result ring of the same physical quantity so
 * the eye reads "halo around the deterministic ring" rather than
 * "extra rings to memorise".
 *
 * Why two and not all of them: rendering P10/P90 for every metric
 * blows past visual budget — four impact metrics × two percentiles
 * = eight extra rings on a busy globe. We pick the metric the user
 * most often asks "how confident are we about this?" about.
 */
interface FuzzyMetric {
  p10: number;
  p90: number;
  color: Color;
  /** Sorted ascending raw samples behind this metric. Optional —
   *  only populated when the MC engine returned them (Phase 8c).
   *  Used to render the radial ECDF heatmap underneath the
   *  deterministic ring. */
  samples?: readonly number[];
  /** True when the metric is a *radius* in metres, false when it is
   *  a diameter (e.g. finalCraterDiameter). Drives the per-sample
   *  ÷2 transform used for the ECDF bitmap. */
  scale: 'radius' | 'diameter';
}

function pickFuzzyMetrics(mc: ActiveMonteCarlo): FuzzyMetric[] {
  switch (mc.type) {
    case 'impact':
      return [
        {
          p10: mc.data.metrics.finalCraterDiameter.p10 / 2,
          p90: mc.data.metrics.finalCraterDiameter.p90 / 2,
          color: RING_COLORS.craterRim,
          ...(mc.data.rawSamples.finalCraterDiameter !== undefined && {
            samples: mc.data.rawSamples.finalCraterDiameter,
          }),
          scale: 'diameter',
        },
        {
          p10: mc.data.metrics.firestormIgnition.p10,
          p90: mc.data.metrics.firestormIgnition.p90,
          color: RING_COLORS.thirdDegreeBurn,
          ...(mc.data.rawSamples.firestormIgnition !== undefined && {
            samples: mc.data.rawSamples.firestormIgnition,
          }),
          scale: 'radius',
        },
      ];
    case 'explosion':
      return [
        {
          p10: mc.data.metrics.fivePsiRadius.p10,
          p90: mc.data.metrics.fivePsiRadius.p90,
          color: RING_COLORS.overpressure5psi,
          ...(mc.data.rawSamples.fivePsiRadius !== undefined && {
            samples: mc.data.rawSamples.fivePsiRadius,
          }),
          scale: 'radius',
        },
        {
          p10: mc.data.metrics.onePsiRadius.p10,
          p90: mc.data.metrics.onePsiRadius.p90,
          color: RING_COLORS.overpressure1psi,
          ...(mc.data.rawSamples.onePsiRadius !== undefined && {
            samples: mc.data.rawSamples.onePsiRadius,
          }),
          scale: 'radius',
        },
      ];
    case 'earthquake':
      return [
        {
          p10: mc.data.metrics.mmi8Radius.p10,
          p90: mc.data.metrics.mmi8Radius.p90,
          color: MMI_RING_COLORS.mmi8,
          ...(mc.data.rawSamples.mmi8Radius !== undefined && {
            samples: mc.data.rawSamples.mmi8Radius,
          }),
          scale: 'radius',
        },
        {
          p10: mc.data.metrics.liquefactionRadius.p10,
          p90: mc.data.metrics.liquefactionRadius.p90,
          color: MMI_RING_COLORS.mmi7,
          ...(mc.data.rawSamples.liquefactionRadius !== undefined && {
            samples: mc.data.rawSamples.liquefactionRadius,
          }),
          scale: 'radius',
        },
      ];
    case 'volcano':
      return [
        {
          p10: mc.data.metrics.pyroclasticRunout.p10,
          p90: mc.data.metrics.pyroclasticRunout.p90,
          color: PYROCLASTIC_RING_COLOR,
          ...(mc.data.rawSamples.pyroclasticRunout !== undefined && {
            samples: mc.data.rawSamples.pyroclasticRunout,
          }),
          scale: 'radius',
        },
      ];
  }
}

function computeFrameRadius(
  result: ActiveResult,
  ashfall: WindAdvectedAshfall | undefined,
  isochroneReach: number
): number {
  let r = 0;
  const bump = (v: number | undefined): void => {
    if (typeof v === 'number' && Number.isFinite(v) && v > r) r = v;
  };
  if (result.type === 'impact') {
    bump(result.data.damage.overpressure1psi);
    bump(result.data.firestorm.sustainRadius);
    bump(result.data.ejecta.blanketEdge1m);
    // The asymmetric blanket extends past blanketEdge1mm by the
    // downrange-offset + the stretched semi-major axis; account for
    // that explicitly so a low-angle impact frames its butterfly tail.
    const f = result.data.ejecta.asymmetryFactor;
    bump(
      (result.data.ejecta.blanketEdge1mm as number) * (1 + 0.4 * f) +
        (result.data.ejecta.downrangeOffset as number)
    );
    if (result.data.tsunami) bump(result.data.tsunami.cavityRadius);
  } else if (result.type === 'explosion') {
    bump(result.data.blast.overpressure1psiRadiusHob);
    bump(result.data.thermal.thirdDegreeBurnRadius);
    bump(result.data.firestorm.sustainRadius);
    if (result.data.emp.regime !== 'NEGLIGIBLE') bump(result.data.emp.affectedRadius);
    bump(result.data.crater.apparentDiameter / 2);
    if (result.data.tsunami) bump(result.data.tsunami.cavityRadius);
  } else if (result.type === 'earthquake') {
    bump(result.data.ruptureLength / 2);
    bump(result.data.shaking.mmi7Radius);
    bump(result.data.shaking.liquefactionRadius);
  } else if (result.type === 'volcano') {
    bump(result.data.pyroclasticRunout);
    bump(result.data.pyroclasticRunoutEnergyLine);
    if (ashfall !== undefined) bump(ashfall.downwindRange);
    if (result.data.lateralBlast !== undefined) bump(result.data.lateralBlast.runout);
    if (result.data.tsunami !== undefined) bump(result.data.tsunami.cavityRadius);
  } else {
    // landslide — only the tsunami cavity is renderable.
    if (result.data.tsunami !== null) bump(result.data.tsunami.cavityRadius);
  }
  if (isochroneReach > r) r = isochroneReach;
  return r;
}
