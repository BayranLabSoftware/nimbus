import { create } from 'zustand';
import {
  findNearbyOceanDepth,
  OCEAN_FLOOR_M,
  sampleElevation,
  sampleSlope,
  waldAllen2007Vs30FromSlope,
  type ElevationGrid,
} from '../physics/elevation/index.js';
import {
  computeBathymetricTsunami,
  type BathymetricTsunamiResult,
} from '../physics/tsunami/index.js';
import { distanceForOverpressure } from '../physics/events/impact/index.js';
import { validateScenario, type ScenarioType } from '../physics/validation/inputSchema.js';
import type {
  PopulationLookupMethod,
  PopulationLookupResult,
  PopulationPolygon,
  PopulationLookupOptions,
} from '../scene/populationLookup.js';
import { buildRuptureStadiumLatLon } from '../scene/stadiumPolygon.js';
import {
  blastCasualtyPlan,
  estimateCasualties,
  pyroclasticCasualtyPlan,
  shakingCasualtyPlan,
  type CasualtyEstimate,
  type CasualtyPlan,
} from '../physics/casualties.js';
import { findPropagationSeeds, type PropagationSeed } from '../physics/tsunami/index.js';
import { wrap, type Remote } from 'comlink';
import {
  type EarthquakeMonteCarloMetrics,
  type ExplosionMonteCarloMetrics,
  type ImpactMonteCarloMetrics,
  type MonteCarloOutput,
  type VolcanoMonteCarloMetrics,
} from '../physics/montecarlo/index.js';
import type { MonteCarloWorkerApi } from '../physics/montecarlo/worker.js';
import type { SimulationApi } from '../physics/worker.js';
import type { SaintVenant1DInput, SaintVenant1DResult } from '../physics/tsunami/saintVenant1D.js';
import {
  EARTHQUAKE_PRESETS,
  simulateEarthquake,
  type EarthquakePresetId,
  type EarthquakeScenarioInput,
  type EarthquakeScenarioResult,
} from '../physics/events/earthquake/index.js';
import {
  LANDSLIDE_PRESETS,
  simulateLandslide,
  type LandslidePresetId,
  type LandslideScenarioInput,
  type LandslideScenarioResult,
} from '../physics/events/landslide/index.js';
import {
  EXPLOSION_PRESETS,
  simulateExplosion,
  type ExplosionPresetId,
  type ExplosionScenarioInput,
  type ExplosionScenarioResult,
} from '../physics/events/explosion/index.js';
import {
  VOLCANO_PRESETS,
  simulateVolcano,
  type VolcanoPresetId,
  type VolcanoScenarioInput,
  type VolcanoScenarioResult,
} from '../physics/events/volcano/index.js';
import {
  IMPACT_PRESETS,
  simulateImpact,
  type ImpactPresetId,
  type ImpactScenarioInput,
  type ImpactScenarioResult,
} from '../physics/simulate.js';
import { deg, degreesToRadians, J, kgPerM3, m, mps, Pa, sqm } from '../physics/units.js';
import { IMPACT_BLAST_COUPLING } from '../physics/constants.js';
import { arrivalFunctionFor, buildCasualtyTimeline } from '../physics/casualtyTimeline.js';
import type { CasualtyTimeline } from '../physics/casualtyTimeline.js';

/** Top-level event categories the simulator supports. */
export type EventType = 'impact' | 'explosion' | 'earthquake' | 'volcano' | 'landslide';

/**
 * Geographic pick point from the Cesium globe. Latitude in [−90, 90],
 * longitude in [−180, 180] — WGS84 surface coordinates, no altitude
 * (detonation altitude is a property of the scenario, not the location).
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** `impact` is the close-up renderer: the same simulation seen from
 *  ground level instead of from orbit. It is only meaningful for the
 *  event families that produce a fireball and a crater. */
export type ViewMode = 'landing' | 'globe' | 'impact' | 'methodology' | 'report';
export type SimulationStatus = 'idle' | 'running' | 'error';
export type MonteCarloStatus = 'idle' | 'running' | 'error';
export type TransitionPhase = 'idle' | 'fading-out' | 'fading-in';

/**
 * Lazy-instantiated Monte-Carlo worker. The underlying Worker is
 * only spawned on first use, so a user who never clicks "Run Monte
 * Carlo" pays no bundle/memory cost. Comlink wraps the worker's
 * exposed API so the store calls it as if it were a local function.
 */
let mcWorker: Remote<MonteCarloWorkerApi> | null = null;
function getMonteCarloWorker(): Remote<MonteCarloWorkerApi> {
  if (mcWorker === null) {
    const worker = new Worker(new URL('../physics/montecarlo/worker.ts', import.meta.url), {
      type: 'module',
    });
    mcWorker = wrap<MonteCarloWorkerApi>(worker);
  }
  return mcWorker;
}

/**
 * Lazy-instantiated main physics worker. Hosts the per-event
 * `simulate*` evaluators AND the bathymetric-tsunami fast-marching
 * solver, which is the single biggest CPU sink in the pipeline
 * (≈ 200 ms – 2 s on continental grids). Spawning happens on first
 * `evaluate()`; the worker stays alive for the lifetime of the tab so
 * subsequent "Simula" clicks pay no cold-start cost.
 *
 * Test/SSR fallback: vitest's jsdom environment does NOT ship a real
 * Worker constructor, so spawning would throw at module-load time.
 * When `Worker` is missing (or `new Worker(...)` throws), we hand
 * back a synchronous shim that runs the same Layer-2 functions on
 * the calling thread but still returns Promises — preserving the
 * uniform `await sim.simulateXxx(...)` shape in `evaluate()`.
 */
type SimulationProxy = {
  [K in keyof SimulationApi]: SimulationApi[K] extends (...args: infer P) => infer R
    ? (...args: P) => Promise<R>
    : never;
};
let simWorker: SimulationProxy | null = null;

/**
 * Phase-21d — lazy Saint-Venant 1D Tier 2 worker. Spawned on the
 * first "Coastal Deep Dive" click; the chunk is dynamic-imported so
 * the ~30 KB of solver code is NOT in the eager landing-page bundle.
 * Falls back to the calling thread if Worker is unavailable (jsdom).
 */
interface SaintVenantProxy {
  simulateSaintVenant1D: (input: SaintVenant1DInput) => Promise<SaintVenant1DResult>;
}
let svWorker: SaintVenantProxy | null = null;
async function getSaintVenantWorker(): Promise<SaintVenantProxy> {
  if (svWorker !== null) return svWorker;
  if (typeof Worker !== 'undefined') {
    try {
      const worker = new Worker(
        new URL('../physics/tsunami/saintVenantWorker.ts', import.meta.url),
        { type: 'module' }
      );
      const proxy = wrap<{
        simulateSaintVenant1D: SaintVenantProxy['simulateSaintVenant1D'];
      }>(worker);
      svWorker = proxy;
      return proxy;
    } catch (err) {
      console.warn('[store] Saint-Venant worker spawn failed, falling back to sync:', err);
    }
  }
  // Sync fallback: imports the solver dynamically and runs it on the
  // calling thread. Same deterministic Layer-2 function, still wrapped
  // in a Promise so callers can `await` uniformly.
  const mod = await import('../physics/tsunami/saintVenant1D.js');
  const fallback: SaintVenantProxy = {
    simulateSaintVenant1D: (input) => Promise.resolve(mod.simulateSaintVenant1D(input)),
  };
  svWorker = fallback;
  return fallback;
}

/**
 * Phase 12a — monotone evaluation token. Each evaluate() invocation
 * bumps this counter and stashes its value; when the asynchronous
 * physics worker eventually resolves, the resolution checks whether
 * the token still matches `currentEvaluationId`. Mismatched (i.e.
 * superseded by a newer Launch) writes are dropped, so a stale
 * bathymetricTsunami can never overwrite a fresh one — fixes the
 * "square comes back occasionally" race the user observed.
 */
let currentEvaluationId = 0;
function getSimulationWorker(): SimulationProxy {
  if (simWorker !== null) return simWorker;

  if (typeof Worker !== 'undefined') {
    try {
      const worker = new Worker(new URL('../physics/worker.ts', import.meta.url), {
        type: 'module',
      });
      simWorker = wrap<SimulationApi>(worker);
      return simWorker;
    } catch (err) {
      console.warn('[store] simulation worker spawn failed, falling back to sync:', err);
    }
  }

  // Sync fallback: runs the SAME deterministic Layer-2 functions
  // (no behavioural drift), but on the calling thread. Still wrapped
  // in async so the caller's `await` works the same in both modes.
  const fallback: SimulationProxy = {
    simulateImpact: (input) => Promise.resolve(simulateImpact(input)),
    simulateExplosion: (input) => Promise.resolve(simulateExplosion(input)),
    simulateEarthquake: (input) => Promise.resolve(simulateEarthquake(input)),
    simulateVolcano: (input) => Promise.resolve(simulateVolcano(input)),
    simulateLandslide: (input) => Promise.resolve(simulateLandslide(input)),
    computeBathymetricTsunami: (input) => Promise.resolve(computeBathymetricTsunami(input)),
  };
  simWorker = fallback;
  return fallback;
}

/** Milliseconds spent in each half of the crossfade. */
export const TRANSITION_HALF_MS = 750;

export type ActiveImpactPreset = ImpactPresetId | 'CUSTOM';
export type ActiveExplosionPreset = ExplosionPresetId | 'CUSTOM';
export type ActiveEarthquakePreset = EarthquakePresetId | 'CUSTOM';
export type ActiveVolcanoPreset = VolcanoPresetId | 'CUSTOM';

/** UI-facing overrides for the impact scenario (plain numbers, SI). */
export interface ImpactInputOverrides {
  impactorDiameter?: number;
  impactVelocity?: number;
  impactorDensity?: number;
  targetDensity?: number;
  impactAngle?: number;
  surfaceGravity?: number;
  /** Compass azimuth (° from N) the impactor travels toward. Drives
   *  the downrange orientation of the asymmetric ejecta blanket. */
  impactAzimuthDeg?: number;
  /** Tensile strength (Pa) — drives the atmospheric-entry regime via
   *  the Chyba-Collins ram-pressure breakup criterion. Set together
   *  with `impactorDensity` whenever the user picks an asteroid class
   *  (Iron, S-type, …) so the airburst behaviour matches the body's
   *  material, not the STONY default. */
  impactorStrength?: number;
}

/** UI-facing overrides for the explosion scenario. */
export interface ExplosionInputOverrides {
  yieldMegatons?: number;
  groundType?: ExplosionScenarioInput['groundType'];
  /** Height of burst (m) — 0 = contact surface burst. */
  heightOfBurst?: number;
  /** Ambient wind speed at burst altitude (m s⁻¹). 0 = calm. Drives
   *  the Glasstone & Dolan §7.20 thermal-pulse drift envelope on the
   *  thermal-burn ring's rendered shape. */
  windSpeed?: number;
  /** Compass azimuth (° clockwise from N) the wind is blowing TOWARD. */
  windDirectionDeg?: number;
}

/** UI-facing overrides for the earthquake scenario. */
export interface EarthquakeInputOverrides {
  magnitude?: number;
  depth?: number;
  faultType?: EarthquakeScenarioInput['faultType'];
  /** Vs30 (m/s) site reference. */
  vs30?: number;
  /** Megathrust rupture scaling flag (Strasser 2010). */
  subductionInterface?: boolean;
}

/** UI-facing overrides for the landslide scenario. */
export interface LandslideInputOverrides {
  volumeM3?: number;
  slopeAngleDeg?: number;
  meanOceanDepth?: number;
  regime?: LandslideScenarioInput['regime'];
}

/** UI-facing overrides for the volcano scenario. */
export interface VolcanoInputOverrides {
  volumeEruptionRate?: number;
  totalEjectaVolume?: number;
  /** Optional lahar total volume (m³) — triggers Iverson runout. */
  laharVolume?: number;
  /** Optional wind speed (m/s) at plume-top altitude — triggers the
   *  Suzuki-Bonadonna wind-advected ashfall footprint. */
  windSpeed?: number;
  /** Optional wind direction (° clockwise from North) — orients the
   *  ashfall footprint on the globe. */
  windDirectionDegrees?: number;
}

/** Any preset id across event types. Used by the polymorphic
 *  {@link AppStore.selectPreset} action, which routes to the right
 *  slice based on which PRESETS table the id belongs to. */
export type AnyPresetId =
  | ImpactPresetId
  | ExplosionPresetId
  | EarthquakePresetId
  | VolcanoPresetId
  | LandslidePresetId;

/**
 * Discriminated result blob: either null (no run yet), or tagged with
 * the originating event type so UIs can switch on `type` to choose a
 * render path.
 */
/** Phase-21d Tier 2 Saint-Venant 1D-radial solver output, sampled at
 *  a fixed list of probe ranges from the source. Surfaced to the
 *  report panel as the "Coastal Deep Dive" diagnostic. */
export interface DeepDiveResult {
  /** Probe distances from the source (m). Same order as
   *  {@link peakAmplitudesM}. */
  rangesM: number[];
  /** Peak |η| observed at each probe over the simulated duration (m). */
  peakAmplitudesM: number[];
  /** Wall-clock cost of the solver call (ms). Surfaced so the user
   *  knows the Tier-2 latency vs the closed-form default. */
  computeMs: number;
  /** Source amplitude actually fed to the solver (m). Echoes the
   *  value derived from the active scenario so the report panel
   *  can label the chart axis. */
  sourceAmplitudeM: number;
  /** Mean basin depth (m) used for the solver. */
  basinDepthM: number;
  /** Number of grid cells × cell width — used as the chart-x range
   *  upper bound. */
  gridCells: number;
  cellWidthM: number;
}

export type ActiveResult =
  | { type: 'impact'; data: ImpactScenarioResult }
  | { type: 'explosion'; data: ExplosionScenarioResult }
  | { type: 'earthquake'; data: EarthquakeScenarioResult }
  | { type: 'volcano'; data: VolcanoScenarioResult }
  | { type: 'landslide'; data: LandslideScenarioResult };

/**
 * Per-event Monte-Carlo percentile summary. Each variant re-uses the
 * discriminator of {@link ActiveResult} so UIs can branch on `type`
 * in the same way as the deterministic result.
 */
export type ActiveMonteCarlo =
  | { type: 'impact'; data: MonteCarloOutput<ImpactMonteCarloMetrics> }
  | { type: 'explosion'; data: MonteCarloOutput<ExplosionMonteCarloMetrics> }
  | { type: 'earthquake'; data: MonteCarloOutput<EarthquakeMonteCarloMetrics> }
  | { type: 'volcano'; data: MonteCarloOutput<VolcanoMonteCarloMetrics> };

export type ActiveLandslidePreset = LandslidePresetId | 'CUSTOM';

export type CasualtyStatus = 'idle' | 'fetching' | 'error' | 'unsupported';

export interface CasualtyResult extends CasualtyEstimate {
  /** Human-readable population source. */
  source: string;
  /** Coarsest backend that contributed a band. */
  method: PopulationLookupMethod;
  /** True while the figure comes from the shipped 0.125° raster alone,
   *  answered in milliseconds so the bar can start counting; the fine
   *  backends replace it when they land. */
  provisional: boolean;
}

export interface AppStore {
  // --- Event selection -------------------------------------------------
  eventType: EventType;
  impact: { preset: ActiveImpactPreset; input: ImpactScenarioInput };
  explosion: { preset: ActiveExplosionPreset; input: ExplosionScenarioInput };
  earthquake: { preset: ActiveEarthquakePreset; input: EarthquakeScenarioInput };
  volcano: { preset: ActiveVolcanoPreset; input: VolcanoScenarioInput };
  landslide: { preset: ActiveLandslidePreset; input: LandslideScenarioInput };

  // --- Geographic picker -----------------------------------------------
  location: Coordinates | null;

  // --- Aftershock detail selection ------------------------------------
  /** Index of the aftershock currently "pinned" by a click on its
   *  globe entity, or null when no aftershock is selected. The
   *  Globe layer reads this to render a dim MMI V/VI/VII contour
   *  set around the picked aftershock and to surface the detail
   *  card. Resets whenever the result, location, event type, or
   *  earthquake inputs change. */
  selectedAftershockIndex: number | null;

  // --- Per-ring visibility toggle ------------------------------------
  /** Set of ring keys (matching `RingTooltipKind` in the legend) the
   *  user has hidden via the legend toggle. Empty by default — every
   *  ring renders. The Globe layer reads this through a CallbackProperty
   *  on each entity's `show` field so flipping a row toggles visibility
   *  immediately, without rebuilding the entity collection (and therefore
   *  without restarting the ring-grow animation). Resets on event type,
   *  preset, location, or evaluate so a stale "I hid the 5 m wave-front"
   *  doesn't persist into the next scenario. */
  hiddenRingKeys: ReadonlySet<string>;
  /** Camera flight asked for by the UI — the city search in the
   *  simulator panel. The globe consumes it by `seq`; the store never
   *  moves the camera itself. */
  cameraRequest: CameraRequest | null;

  // --- Simulation lifecycle -------------------------------------------
  result: ActiveResult | null;
  /** Optional bathymetric-tsunami isochrones from the Fast Marching
   *  solver. Populated next to `result` whenever the current scenario
   *  triggers a tsunami AND the elevation grid is loaded. Layered out
   *  of the main result envelope because it depends on data the Layer-
   *  2 physics never sees (grid + location) — the store orchestrates. */
  bathymetricTsunami: BathymetricTsunamiResult | null;
  /** Optional population-exposure number derived from a Cloud-
   *  Optimised GeoTIFF lookup (see src/scene/populationLookup.ts).
   *  Populated asynchronously after `evaluate()` writes a result;
   *  null while pending or when the lookup is unavailable. The
   *  `ringLabel` and `radiusM` echo which damage threshold drove
   *  the count so the UI can render "≥ 5 psi: 1.2 M people". */
  populationExposure: (PopulationLookupResult & { ringLabel: string }) | null;
  /** Status of the population fetch — drives a tiny spinner in the
   *  result panel. 'idle' both before any run and after success. */
  populationStatus: 'idle' | 'fetching' | 'error';
  /** Estimated dead and injured — WorldPop counts inside each hazard
   *  band times a published vulnerability function (OTA 1979 blast,
   *  PAGER shaking, Auker 2013 pyroclastic). See src/physics/casualties.ts.
   *  Null while pending, when unavailable, or for event families the
   *  model does not cover (`casualtyStatus` says which). */
  casualties: CasualtyResult | null;
  casualtyStatus: CasualtyStatus;
  /** The estimate as a sweep in time — when the hazard front reaches
   *  each band — rebuilt with every estimate. */
  casualtyTimeline: CasualtyTimeline | null;
  /** `performance.now()` when the first estimate for the current
   *  result landed: the bar's counter starts its clock there and keeps
   *  it when the provisional figure is refined. */
  casualtyClockStartedAt: number | null;
  /** Optional Monte-Carlo P10/P50/P90 summary. Populated only when
   *  the user explicitly triggers `evaluateMonteCarlo` — the default
   *  single-shot `evaluate` leaves this as `null`. */
  monteCarlo: ActiveMonteCarlo | null;
  /** Status of the Monte-Carlo worker — `running` while the sweep
   *  is in flight, `error` on failure. UI uses this to show a
   *  loading spinner without freezing the rest of the panel. */
  monteCarloStatus: MonteCarloStatus;
  /** Phase-21d Tier 2 Coastal Deep Dive — Saint-Venant 1D-radial
   *  solver output for the active scenario. `null` until the user
   *  triggers it explicitly via `evaluateDeepDive`. */
  deepDive: DeepDiveResult | null;
  /** Status of the Saint-Venant solver: `idle` until the user
   *  triggers Deep Dive; `running` while the worker is integrating;
   *  `error` on failure. The button shows a small spinner during
   *  `running`. */
  deepDiveStatus: 'idle' | 'running' | 'error';
  /** Last error message from `evaluateDeepDive`, surfaced under the
   *  button when status === 'error'. */
  deepDiveError: string | null;
  status: SimulationStatus;
  error: string | null;
  lastEvaluatedAt: number | null;
  /** Coordinates the most recent `evaluate()` was run against. Used by
   *  the `setElevationGrid` catch-up to decide whether a freshly
   *  arrived DEM tile should re-run the simulation: a re-run is the
   *  right move only when the user is still pointing at the same
   *  location. Click somewhere else without pressing Launch and the
   *  catch-up stops, so we don't auto-fire a new sim every time the
   *  user pans across the globe. */
  lastEvaluatedAtLocation: Coordinates | null;

  // --- Global elevation / bathymetry grid -----------------------------
  /** Optional local high-resolution DEM raster (zoom-8, ~600 m/pixel)
   *  centred on the active source. Drives Vs30 via Wald & Allen 2007
   *  for earthquake scenarios and the high-detail near-source layer of
   *  the bathymetric tsunami pipeline. */
  elevationGrid: ElevationGrid | null;
  /** Phase 11 — global low-resolution bathymetric mosaic (zoom-2,
   *  ~40 km/pixel, full planet). Loaded once at app startup; powers the
   *  trans-oceanic FMM layer that draws iso-contours beyond the local
   *  tile bbox so a Chicxulub-class tsunami no longer truncates at
   *  ~75 km from source. */
  globalBathymetricGrid: ElevationGrid | null;

  // --- View state ------------------------------------------------------
  mode: ViewMode;
  /** Playhead of the close-up view, in simulation seconds. Part of the
   *  shareable state: a link can hand someone one exact frame, not
   *  just the scenario. Null until the close-up has been opened. */
  simTime: number | null;
  transitionPhase: TransitionPhase;

  // --- Actions ---------------------------------------------------------
  selectEventType: (type: EventType) => void;
  /** Polymorphic preset-switch: detects the event category from the id
   *  and flips `eventType` if needed. */
  selectPreset: (id: AnyPresetId) => void;
  /** Impact-only input overrides (degrees → radians, brand-wrap, mark
   *  the impact preset as CUSTOM). */
  setImpactInput: (overrides: ImpactInputOverrides) => void;
  /** Explosion-input overrides. Marks the explosion preset as CUSTOM. */
  setExplosionInput: (overrides: ExplosionInputOverrides) => void;
  /** Earthquake-input overrides. Marks the earthquake preset as CUSTOM. */
  setEarthquakeInput: (overrides: EarthquakeInputOverrides) => void;
  /** Volcano-input overrides. Marks the volcano preset as CUSTOM. */
  setVolcanoInput: (overrides: VolcanoInputOverrides) => void;
  /** Landslide-input overrides. Marks the landslide preset as CUSTOM. */
  setLandslideInput: (overrides: LandslideInputOverrides) => void;
  setLocation: (coords: Coordinates) => void;
  clearLocation: () => void;
  /** Pin a specific aftershock for click-through detail. The globe
   *  draws three dim MMI V/VI/VII contours around the picked event;
   *  the detail card surfaces magnitude, time-since-mainshock and
   *  estimated felt-intensity reach. */
  selectAftershock: (index: number) => void;
  /** Clear the pinned aftershock selection. */
  clearAftershock: () => void;
  /** Flip the visibility of a single legend row + its globe ring. */
  toggleRingVisibility: (key: string) => void;
  /** Reset every legend toggle so all rings render again. Wired to a
   *  "show all" button in the legend header. */
  showAllRings: () => void;
  /** Ask the globe to fly the camera over `target`, framing `rangeM`
   *  metres around it. Idempotent per call: every request gets a new
   *  sequence number so the same city can be flown to twice. */
  requestCameraFlight: (target: Coordinates, rangeM: number) => void;
  /** Install the global DEM raster. Called once at startup by the app
   *  shell after fetching the binary asset. `null` reverts to the
   *  rock-reference (Vs30 = 760) default. */
  setElevationGrid: (grid: ElevationGrid | null) => void;
  /** Phase 11 — install the global bathymetric mosaic (zoom-2, full
   *  planet). Wired by the Globe layer once the 16-tile fetch resolves;
   *  the next evaluate() picks it up and the FMM layer extends to
   *  trans-oceanic ranges. */
  setGlobalBathymetricGrid: (grid: ElevationGrid | null) => void;
  evaluate: () => Promise<void>;
  /** Run a Monte-Carlo sweep around the active scenario's nominal
   *  inputs. Uses a seed derived from the scenario preset so the
   *  same URL gives the same percentiles. */
  evaluateMonteCarlo: (iterations?: number) => void;
  /** Phase-21d — run the Tier 2 Saint-Venant 1D-radial solver
   *  against the active scenario. The seed source amplitude comes
   *  from the active result (impact / earthquake / explosion
   *  tsunami block). No-op when the active scenario has no tsunami
   *  source. */
  evaluateDeepDive: () => Promise<void>;
  /** Reset the Deep Dive state to idle. */
  clearDeepDive: () => void;
  setMode: (mode: ViewMode) => void;
  setSimTime: (seconds: number | null) => void;
  transitionTo: (mode: ViewMode, options?: { instant?: boolean }) => void;
  reset: () => void;
}

const INITIAL_IMPACT_PRESET: ImpactPresetId = 'CHICXULUB';
const INITIAL_EXPLOSION_PRESET: ExplosionPresetId = 'HIROSHIMA_1945';
const INITIAL_EARTHQUAKE_PRESET: EarthquakePresetId = 'TOHOKU_2011';
const INITIAL_VOLCANO_PRESET: VolcanoPresetId = 'KRAKATAU_1883';
const INITIAL_LANDSLIDE_PRESET: LandslidePresetId = 'STOREGGA_8200_BP';

function isImpactPresetId(id: AnyPresetId): id is ImpactPresetId {
  return id in IMPACT_PRESETS;
}
function isExplosionPresetId(id: AnyPresetId): id is ExplosionPresetId {
  return id in EXPLOSION_PRESETS;
}
function isEarthquakePresetId(id: AnyPresetId): id is EarthquakePresetId {
  return id in EARTHQUAKE_PRESETS;
}
function isVolcanoPresetId(id: AnyPresetId): id is VolcanoPresetId {
  return id in VOLCANO_PRESETS;
}
function isLandslidePresetId(id: AnyPresetId): id is LandslidePresetId {
  return id in LANDSLIDE_PRESETS;
}

type InitialSlice = Pick<
  AppStore,
  | 'eventType'
  | 'impact'
  | 'explosion'
  | 'earthquake'
  | 'volcano'
  | 'landslide'
  | 'location'
  | 'selectedAftershockIndex'
  | 'hiddenRingKeys'
  | 'cameraRequest'
  | 'result'
  | 'bathymetricTsunami'
  | 'populationExposure'
  | 'populationStatus'
  | 'casualties'
  | 'casualtyStatus'
  | 'casualtyTimeline'
  | 'casualtyClockStartedAt'
  | 'monteCarlo'
  | 'monteCarloStatus'
  | 'deepDive'
  | 'deepDiveStatus'
  | 'deepDiveError'
  | 'status'
  | 'error'
  | 'lastEvaluatedAt'
  | 'lastEvaluatedAtLocation'
  | 'elevationGrid'
  | 'globalBathymetricGrid'
  | 'mode'
  | 'simTime'
  | 'transitionPhase'
>;

/**
 * City names are always drawn now. Earlier builds let a visitor hide
 * them and remembered the choice under this key; the privacy notice
 * promises the app keeps a single preference (the language), so the
 * stale key is removed on start-up rather than left behind.
 */
const CITY_LABELS_PREF_KEY = 'nimbus.showCityLabels';

function forgetCityLabelsPreference(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(CITY_LABELS_PREF_KEY);
  } catch {
    // Private mode / blocked storage: nothing to forget.
  }
}
forgetCityLabelsPreference();

export interface CameraRequest {
  latitude: number;
  longitude: number;
  /** Radius (m) the globe should frame around the target. */
  rangeM: number;
  /** Monotonic counter so identical consecutive requests still fire. */
  seq: number;
}

let cameraRequestSeq = 0;

function initialState(): InitialSlice {
  return {
    eventType: 'impact',
    impact: {
      preset: INITIAL_IMPACT_PRESET,
      input: IMPACT_PRESETS[INITIAL_IMPACT_PRESET].input,
    },
    explosion: {
      preset: INITIAL_EXPLOSION_PRESET,
      input: EXPLOSION_PRESETS[INITIAL_EXPLOSION_PRESET].input,
    },
    earthquake: {
      preset: INITIAL_EARTHQUAKE_PRESET,
      input: EARTHQUAKE_PRESETS[INITIAL_EARTHQUAKE_PRESET].input,
    },
    volcano: {
      preset: INITIAL_VOLCANO_PRESET,
      input: VOLCANO_PRESETS[INITIAL_VOLCANO_PRESET].input,
    },
    landslide: {
      preset: INITIAL_LANDSLIDE_PRESET,
      input: LANDSLIDE_PRESETS[INITIAL_LANDSLIDE_PRESET].input,
    },
    location: null,
    selectedAftershockIndex: null,
    hiddenRingKeys: new Set<string>(),
    cameraRequest: null,
    result: null,
    bathymetricTsunami: null,
    populationExposure: null,
    populationStatus: 'idle',
    casualties: null,
    casualtyTimeline: null,
    casualtyClockStartedAt: null,
    casualtyStatus: 'idle',
    monteCarlo: null,
    monteCarloStatus: 'idle',
    deepDive: null,
    deepDiveStatus: 'idle',
    deepDiveError: null,
    status: 'idle',
    error: null,
    lastEvaluatedAt: null,
    lastEvaluatedAtLocation: null,
    elevationGrid: null,
    globalBathymetricGrid: null,
    mode: 'landing',
    simTime: null,
    transitionPhase: 'idle',
  };
}

/** Lower-bound on a beach slope we are willing to use in the
 *  Synolakis run-up: 1:1 000 (≈ 0.057°). Below that the surface is
 *  closer to a tidal flat than a beach and the analytical fit fails. */
const MIN_BEACH_SLOPE_RAD = Math.atan(1 / 1000);
/** Upper-bound on a beach slope: 1:3 (≈ 18°). Above that the surface
 *  is a cliff or steep dune face, not a run-up beach. */
const MAX_BEACH_SLOPE_RAD = Math.atan(1 / 3);

/**
 * Derive the coastal beach slope (rad) from the loaded DEM tile when
 * the click sits on land with a slope inside the
 * [MIN_BEACH_SLOPE_RAD, MAX_BEACH_SLOPE_RAD] envelope. Returns
 * `undefined` when the click is over open water (z < 0) — the source
 * slope of a deep-ocean impact is not a "beach slope" — or when the
 * sampled slope falls outside the envelope. Callers (the per-event
 * branches in `evaluate()`) pass the result straight through to the
 * scenario input; the physics fallback is the textbook 1:100 plane
 * beach.
 *
 * Why we check z first: a 0 m flat seafloor returns slope = 0,
 * which is below the lower bound, so the envelope check would
 * already reject it — but checking elevation first short-circuits
 * the more expensive `sampleSlope` call for the dominant
 * mid-ocean-impact case.
 */
function deriveBeachSlope(
  grid: ElevationGrid | null,
  location: Coordinates | null
): number | undefined {
  if (grid === null || location === null) return undefined;
  if (!gridCoversLocation(grid, location)) return undefined;
  const z = sampleElevation(grid, location.latitude, location.longitude);
  if (z < 0) return undefined;
  const slope = sampleSlope(grid, location.latitude, location.longitude);
  if (!Number.isFinite(slope)) return undefined;
  if (slope < MIN_BEACH_SLOPE_RAD || slope > MAX_BEACH_SLOPE_RAD) return undefined;
  return slope;
}

/**
 * Strip terrestrial-only effects from an impact result when the click
 * is over open water. Two cascade entries depend on having continental
 * crust and saturated sediment under the impactor:
 *
 *   - the local firestorm — Glasstone & Dolan §7 burn-fluence radii
 *     are computed from incident thermal flux, but the cascade only
 *     develops in the presence of flammable terrestrial fuel; mid-
 *     ocean fireballs irradiate water, not forests. (The global
 *     ejecta-reentry ignition pulse, modelled separately as
 *     `cascade.impact.ejectaReentry`, still fires for GLOBAL- and
 *     EXTINCTION-tier events regardless of the click point.)
 *   - the impact-induced liquefaction ring — Youd & Idriss (2001)
 *     explicitly ties the trigger to saturated sandy soils within
 *     reach of the seismic radiator, which doesn't apply when the
 *     epicentre is itself in a deep-ocean basin.
 *
 * Returns the result with those fields zeroed when the click is in
 * open water, otherwise hands the result back unchanged. Cascade
 * builders and the globe renderer both treat the zero radii as "no
 * stage".
 */
/** 5 km — the lattice radius `findNearbyOceanDepth` walks in search
 *  of nearby ocean cells. Used here as the credibility threshold for
 *  the coastal-impact tsunami gate (see {@link gateImpactByTerrain}). */
const COASTAL_OCEAN_SEARCH_RADIUS_M = 5_000;

/**
 * Fin dove cercare il mare, per un evento di energia data.
 *
 * Il valore fisso di 5 km sopra nasceva dai casi costieri (Beirut sul
 * molo, Castle Bravo sulla scogliera di Bikini) ed è giusto per loro.
 * Ma è la ragione per cui una testata enorme sulla penisola della
 * Florida non produceva alcuno tsunami: il mare sta a decine di
 * chilometri, la ricerca non lo trovava, e il ramo dell'onda restava
 * spento in silenzio. Fisicamente è falso — un'esplosione che rade al
 * suolo tutto per duecento chilometri solleva l'oceano che ha accanto.
 *
 * Il criterio: il mare si accoppia se cade dentro il raggio in cui la
 * sovrappressione vale ancora 5 psi, cioè dove l'onda d'urto abbatte
 * gli edifici. È la stessa soglia che la scena disegna come «crollo
 * edifici», quindi la regola è leggibile e verificabile: se il mare è
 * dentro quell'anello, l'onda parte. Sotto i 5 km resta il valore
 * storico, così i casi costieri già tarati non cambiano.
 */
function coastalSearchRadiusForYield(yieldJoules: number): number {
  if (!Number.isFinite(yieldJoules) || yieldJoules <= 0) {
    return COASTAL_OCEAN_SEARCH_RADIUS_M;
  }
  const r5psi = distanceForOverpressure(J(yieldJoules), Pa(34_474)) as number;
  if (!Number.isFinite(r5psi)) return COASTAL_OCEAN_SEARCH_RADIUS_M;
  // Tetto a 400 km: oltre, la geometria «sorgente puntiforme in acqua»
  // del modello non regge più e prometteremmo una precisione che non
  // abbiamo.
  return Math.min(400_000, Math.max(COASTAL_OCEAN_SEARCH_RADIUS_M, r5psi));
}

export function gateImpactByTerrain(
  data: ImpactScenarioResult,
  isOpenWater: boolean
): ImpactScenarioResult {
  // The coastal credibility rule lives in the physics now: the store
  // hands `shoreDistance` to simulateImpact and the tsunami block is
  // emitted only when crater, cavity or the 1 m ejecta isopach reach
  // the sea (see the sea-coupling block there). This gate only zeroes
  // the terrestrial-only effects of an open-water strike.
  if (!isOpenWater) return data;
  return {
    ...data,
    firestorm: {
      ...data.firestorm,
      ignitionRadius: m(0),
      sustainRadius: m(0),
      ignitionArea: sqm(0),
    },
    seismic: {
      ...data.seismic,
      liquefactionRadius: m(0),
    },
  };
}

/**
 * Dove comincia il mare per un impatto sulla terraferma.
 *
 * I semi di propagazione (`findPropagationSeeds`) rispondono alla
 * domanda giusta: acqua abbastanza profonda da farci correre l'onda e
 * abbastanza estesa da essere un bacino — non il lago di Winter Haven,
 * non il St Johns, non una baia di sette metri. Cercati sul mosaico
 * planetario (che decide cos'è mare) e sulla tessera locale vagliata
 * dal mosaico; il più vicino dà la distanza dalla riva che la fisica
 * usa per decidere se e quanto l'evento arriva al mare. La profondità
 * del bacino è la mediana del mare intorno, non quella della cella di
 * riva.
 */
const IMPACT_SEA_SEARCH_M = 2_500_000;

function nearestSeaForImpact(
  local: ElevationGrid,
  global: ElevationGrid | null,
  location: Coordinates
): { distanceM: number; basinDepthM: number } | null {
  // Shoreline, not solver floor: for the coupling question any
  // sea-connected water counts — a bay a few metres deep is where the
  // crater rim meets the sea — so the search runs at 1 m with a body
  // large enough to exclude ponds and rivers (≈ 75 km² on the tile),
  // and lets the planetary mask vouch through its neighbouring cells
  // (a bay's own 40 km cell averages to land).
  const shoreline = {
    maxRadiusM: IMPACT_SEA_SEARCH_M,
    minDepthM: 1,
    minBodyCells: 200,
    seaMaskNeighbourhoodCells: 1,
  };
  const seeds: PropagationSeed[] = [
    ...findPropagationSeeds(local, location.latitude, location.longitude, {
      ...shoreline,
      ...(global !== null && { seaMask: global }),
    }),
    ...(global !== null
      ? findPropagationSeeds(global, location.latitude, location.longitude, {
          maxRadiusM: IMPACT_SEA_SEARCH_M,
          minDepthM: 1,
        })
      : []),
  ].sort((a, b) => a.distanceM - b.distanceM);
  const nearest = seeds[0];
  if (nearest === undefined) return null;
  const depthGrid = global ?? local;
  const basin =
    findNearbyOceanDepth(
      depthGrid,
      location.latitude,
      location.longitude,
      Math.max(50_000, nearest.distanceM * 2)
    ) ?? nearest.depthM;
  return { distanceM: nearest.distanceM, basinDepthM: basin };
}

/**
 * Fin dove cercare i semi di propagazione per un risultato. Per un
 * impatto è la portata che la fisica ha già calcolato (cratere, cavità
 * o isopaca di 1 m degli ejecta); per un'esplosione il raggio dei
 * 5 psi; per gli altri eventi, che nascono in mare, basta il vicinato.
 */
function propagationReachFor(result: ActiveResult): number {
  if (result.type === 'impact' && result.data.tsunami !== undefined) {
    return Math.min(IMPACT_SEA_SEARCH_M, Math.max(5_000, result.data.tsunami.seaCoupling.reach));
  }
  if (result.type === 'explosion') {
    return coastalSearchRadiusForYield(result.data.yield.joules);
  }
  const meta = extractTsunamiMeta(result);
  return Math.max(50_000, meta !== null ? meta.sourceCavityRadiusM * 3 : 0);
}

/**
 * Same idea for explosions: a detonation in open water (mid-Pacific
 * test, abyssal-ocean click) leaves no surface crater — the energy
 * goes into a steam/gas bubble pulse, not into excavating bedrock —
 * and there is no flammable terrestrial fuel inside the ignition
 * radius. Coastal contact-water bursts (Beirut, Castle Bravo on the
 * Bikini reef) sit at z >= -10 and are therefore not gated here:
 * they keep their firestorm and crater outputs because real-world
 * observations confirm both happen.
 */
export function gateExplosionByTerrain(
  data: ExplosionScenarioResult,
  isOpenWater: boolean
): ExplosionScenarioResult {
  if (!isOpenWater) return data;
  return {
    ...data,
    firestorm: {
      ...data.firestorm,
      ignitionRadius: m(0),
      sustainRadius: m(0),
      ignitionArea: sqm(0),
      sustainArea: sqm(0),
    },
    crater: {
      ...data.crater,
      apparentDiameter: m(0),
    },
  };
}

/**
 * Liquefaction needs saturated cohesionless terrestrial sediment
 * (Youd & Idriss 2001). For a submarine epicentre the centre of the
 * ring sits in seafloor sediments where neither the surface-PGA
 * correlation nor the resulting structural-damage interpretation
 * carry over. Tōhoku-class coastal liquefaction is still flagged via
 * the MMI contour rings, which the renderer keeps drawing across the
 * shoreline at a dimmed alpha.
 */
export function gateEarthquakeByTerrain(data: EarthquakeScenarioResult): EarthquakeScenarioResult {
  if (!data.isSubmarine) return data;
  return {
    ...data,
    shaking: {
      ...data.shaking,
      liquefactionRadius: m(0),
    },
  };
}

/** True when the loaded DEM tile actually contains the click point.
 *  Each Terrarium tile covers ≈ 156 km × 156 km (zoom 8); when the
 *  user clicks far away from the previous fetch we can still hold a
 *  stale grid, in which case `sampleElevation` would clamp to the
 *  tile edge and produce a misleading bathymetry value. */
function gridCoversLocation(grid: ElevationGrid, c: Coordinates): boolean {
  return (
    c.latitude >= grid.minLat &&
    c.latitude <= grid.maxLat &&
    c.longitude >= grid.minLon &&
    c.longitude <= grid.maxLon
  );
}

/** Strip out the source-amplitude metadata the FMM amplitude module
 *  needs from whichever event-type tsunami block fired. Returns null
 *  when no headline amplitude can be derived (e.g. an earthquake
 *  tsunami missing its initialAmplitude). */
function extractTsunamiMeta(result: ActiveResult): {
  sourceAmplitudeM: number;
  sourceCavityRadiusM: number;
  sourceDepthM: number;
  /** Radial spreading exponent for the amplitude field. Omitted →
   *  the field's cylindrical 0.5 default. */
  spreadingExponent?: number;
} | null {
  if (result.type === 'impact' && result.data.tsunami !== undefined) {
    const t = result.data.tsunami;
    // Impact sources propagate the Wünnemann, Collins & Weiss (2010)
    // rim wave: its height at the cavity rim, min(0.14 R_w, h), and
    // its regime-dependent exponent q_r. This is what the panel's
    // "Wünnemann" rows report, so the veil on the globe and the
    // numbers beside it come from the same law.
    return {
      sourceAmplitudeM: t.rimWaveSourceAmplitude,
      sourceCavityRadiusM: t.cavityRadius,
      sourceDepthM: t.meanOceanDepth,
      spreadingExponent: t.rimWaveExponent,
    };
  }
  if (result.type === 'explosion' && result.data.tsunami !== undefined) {
    const t = result.data.tsunami;
    return {
      sourceAmplitudeM: t.sourceAmplitude,
      sourceCavityRadiusM: t.cavityRadius,
      sourceDepthM: t.meanOceanDepth,
    };
  }
  if (result.type === 'volcano' && result.data.tsunami !== undefined) {
    const t = result.data.tsunami;
    return {
      sourceAmplitudeM: t.sourceAmplitude,
      sourceCavityRadiusM: t.cavityRadius,
      sourceDepthM: t.meanOceanDepth,
    };
  }
  if (result.type === 'landslide' && result.data.tsunami !== null) {
    const t = result.data.tsunami;
    return {
      sourceAmplitudeM: t.sourceAmplitude,
      sourceCavityRadiusM: t.cavityRadius,
      sourceDepthM: t.meanOceanDepth,
    };
  }
  if (result.type === 'earthquake' && result.data.tsunami !== undefined) {
    const t = result.data.tsunami;
    // Earthquake tsunami doesn't carry a cavity radius — back-derive
    // one from the rupture length so the geometric-spreading factor
    // has a sensible R₀. The 1 000 m default depth covers most
    // megathrust subduction zones.
    return {
      sourceAmplitudeM: t.initialAmplitude,
      sourceCavityRadiusM: Math.max((result.data.ruptureLength as number) / 4, 10_000),
      sourceDepthM: 4_000,
    };
  }
  return null;
}

/**
 * Terrain rasters `evaluate()` needs before it can simulate honestly:
 * the local Terrarium tile (water depth under the click, Vs30 slope,
 * beach slope) and the planetary bathymetric mosaic (the trans-oceanic
 * tsunami layer). Both are fetched by the scene layer; the app shell
 * registers the loaders once at boot (`useUrlStateSync`) and the store
 * awaits them at every Launch. Unit tests leave them unset, so no
 * network is touched there.
 *
 * Why the store waits instead of "the next Launch picks it up": a
 * user who clicks the ocean and presses Launch a second later used to
 * get a result computed against the PREVIOUS click's tile (no water
 * depth → no tsunami), and a Launch issued before the 800 KB mosaic
 * arrived drew the tsunami on a 150 km square only — the "impact
 * gives tsunami numbers but no tsunami on the map" report. Waiting
 * for the rasters costs at most a couple of seconds on first load and
 * nothing afterwards (both are cached for the session).
 */
export interface TerrainLoaders {
  local: (latitude: number, longitude: number) => Promise<ElevationGrid>;
  global: () => Promise<ElevationGrid>;
}

let terrainLoaders: TerrainLoaders | null = null;

export function configureTerrainLoaders(loaders: TerrainLoaders | null): void {
  terrainLoaders = loaders;
}

/** Population-inside-a-circle backend the casualty estimate runs on
 *  (WorldPop API / coarse raster, see src/scene/populationLookup.ts).
 *  Registered by the app shell like the terrain loaders; unit tests
 *  leave it unset and the estimate simply stays idle. */
export type PopulationLookup = (
  latitude: number,
  longitude: number,
  radiusM: number,
  polygon?: PopulationPolygon,
  options?: PopulationLookupOptions
) => Promise<PopulationLookupResult | null>;

let populationLookup: PopulationLookup | null = null;

export function configurePopulationLookup(lookup: PopulationLookup | null): void {
  populationLookup = lookup;
}

/** How long a Launch waits for the planetary mosaic before going
 *  ahead with the local tile only. Generous for a slow connection,
 *  short enough that a stalled fetch never holds the button hostage;
 *  if the mosaic lands later, {@link AppStore.setGlobalBathymetricGrid}
 *  completes the tsunami layer of the result already on screen. */
const GLOBAL_MOSAIC_WAIT_MS = 8_000;

function settleWithin<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise<T | null>((resolve) => {
    const timer = setTimeout(() => {
      resolve(null);
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      }
    );
  });
}

async function ensureTerrainForEvaluate(
  get: () => AppStore,
  set: (partial: Partial<AppStore>) => void
): Promise<void> {
  const loaders = terrainLoaders;
  if (loaders === null) return;
  const { location, elevationGrid, globalBathymetricGrid } = get();
  const pending: Promise<void>[] = [];
  if (
    location !== null &&
    (elevationGrid === null || !gridCoversLocation(elevationGrid, location))
  ) {
    pending.push(
      settleWithin(
        loaders.local(location.latitude, location.longitude),
        GLOBAL_MOSAIC_WAIT_MS
      ).then((grid) => {
        if (grid === null) return;
        const now = get();
        // The user may have clicked elsewhere while the tile was in
        // flight: only install it if it still serves the pick.
        if (now.location !== null && gridCoversLocation(grid, now.location)) {
          set({ elevationGrid: grid });
        }
      })
    );
  }
  if (globalBathymetricGrid === null) {
    pending.push(
      settleWithin(loaders.global(), GLOBAL_MOSAIC_WAIT_MS).then((grid) => {
        if (grid !== null && get().globalBathymetricGrid === null) {
          set({ globalBathymetricGrid: grid });
        }
      })
    );
  }
  await Promise.all(pending);
}

/** True when the result carries a tsunami source the bathymetric
 *  pipeline can propagate. */
function resultTriggersTsunami(result: ActiveResult): boolean {
  return (
    (result.type === 'impact' && result.data.tsunami !== undefined) ||
    (result.type === 'earthquake' && result.data.tsunami !== undefined) ||
    (result.type === 'explosion' && result.data.tsunami !== undefined) ||
    (result.type === 'volcano' && result.data.tsunami !== undefined) ||
    (result.type === 'landslide' && result.data.tsunami !== null)
  );
}

interface BathymetricContext {
  /** Where the simulation was run — the FMM source point. */
  location: Coordinates;
  /** Local high-res tile covering `location`. */
  elevationGrid: ElevationGrid;
  /** Planetary mosaic, when it has arrived. */
  globalBathymetricGrid: ElevationGrid | null;
}

/**
 * Bathymetric-tsunami layer (FMM arrival field, amplitude veil,
 * run-up) for a result. Shared by `evaluate()` and by the late-mosaic
 * completion in `setGlobalBathymetricGrid`, so both paths seed the
 * propagation identically. Routed through the physics worker — on
 * continental grids this is the slowest step in the pipeline
 * (200 ms – 2 s) and keeping it on the main thread is what froze
 * the UI before the worker existed. Returns null when the result has
 * no tsunami source or the compute fails.
 */
async function computeBathymetricLayerForResult(
  result: ActiveResult,
  ctx: BathymetricContext,
  sim: ReturnType<typeof getSimulationWorker>
): Promise<BathymetricTsunamiResult | null> {
  if (!resultTriggersTsunami(result)) return null;
  const tsunamiStart = performance.now();
  let bathymetricTsunami: BathymetricTsunamiResult | null = null;
  try {
    // Pull the source amplitude + cavity radius from whichever
    // event-type tsunami block fired. The amplitude module
    // gracefully no-ops when the metadata is missing, but
    // forwarding it lets the Globe render the wave-height
    // heatmap on top of the arrival contours.
    const tsunamiMeta = extractTsunamiMeta(result);
    // Dove nasce l'onda. Se il punto colpito è terraferma la
    // propagazione non può partire da lì: il campo dei tempi d'arrivo
    // è definito solo sull'acqua. I semi sono il punto di mare
    // percorribile più vicino in ogni settore di bussola entro la
    // portata dell'evento — per la Florida il Golfo E l'Atlantico —
    // cercati sul mosaico planetario alla sua risoluzione e sulla
    // tessera locale vagliata dal mosaico (un lago che la tessera
    // mostra come acqua non lo è). Tutti partono a t = 0.
    const reachM = propagationReachFor(result);
    const globalSeeds: PropagationSeed[] =
      ctx.globalBathymetricGrid !== null
        ? findPropagationSeeds(
            ctx.globalBathymetricGrid,
            ctx.location.latitude,
            ctx.location.longitude,
            { maxRadiusM: reachM }
          )
        : [];
    const localSeeds: PropagationSeed[] = findPropagationSeeds(
      ctx.elevationGrid,
      ctx.location.latitude,
      ctx.location.longitude,
      {
        maxRadiusM: reachM,
        ...(ctx.globalBathymetricGrid !== null && { seaMask: ctx.globalBathymetricGrid }),
      }
    );
    const primary = localSeeds[0] ?? globalSeeds[0];
    if (primary === undefined) {
      if (import.meta.env.DEV) {
        console.info(
          `[store] bathymetric tsunami: no propagable sea within ${(reachM / 1_000).toFixed(0)} km — layer skipped`
        );
      }
      return null;
    }
    if (import.meta.env.DEV) {
      console.info(
        `[store] tsunami seeds: ${localSeeds.length.toString()} local, ${globalSeeds.length.toString()} global (reach ${(reachM / 1_000).toFixed(0)} km, nearest ${(primary.distanceM / 1_000).toFixed(0)} km)`
      );
    }
    bathymetricTsunami = await sim.computeBathymetricTsunami({
      grid: ctx.elevationGrid,
      sourceLatitude: primary.latitude,
      sourceLongitude: primary.longitude,
      seeds: localSeeds,
      globalSeeds,
      ...(tsunamiMeta !== null && {
        sourceAmplitudeM: tsunamiMeta.sourceAmplitudeM,
        sourceCavityRadiusM: tsunamiMeta.sourceCavityRadiusM,
        sourceDepthM: tsunamiMeta.sourceDepthM,
        ...(tsunamiMeta.spreadingExponent !== undefined && {
          spreadingExponent: tsunamiMeta.spreadingExponent,
        }),
      }),
      // Phase 11 — splice in the global low-res mosaic when
      // available so the orchestrator emits trans-oceanic
      // iso-contours alongside the local high-res ones.
      ...(ctx.globalBathymetricGrid !== null && {
        globalGrid: ctx.globalBathymetricGrid,
      }),
    });
  } catch (err) {
    // If the grid doesn't cover the source, FMM won't throw but
    // isochrones may be empty — fall back to null silently.
    // We still log the error in dev mode so a real bug doesn't
    // hide behind the "expected silent fallback" semantics.
    if (import.meta.env.DEV) {
      console.warn('[store] bathymetric tsunami compute failed:', err);
    }
    bathymetricTsunami = null;
  }
  if (import.meta.env.DEV) {
    const elapsed = performance.now() - tsunamiStart;
    const hasGlobal = bathymetricTsunami?.global !== undefined;
    console.info(
      `[store] bathymetric tsunami: ${elapsed.toFixed(0)}ms ${hasGlobal ? '(local + global)' : '(local only)'}`
    );
  }
  return bathymetricTsunami;
}

/**
 * Which casualty model applies to a result, and its bands. Impacts and
 * explosions: OTA 1979 blast bands anchored on the drawn 5 / 1 psi
 * contours (HOB-corrected for explosions). Earthquakes: PAGER shaking
 * bands on the MMI VII / VIII / IX radii (point-source circles even for
 * extended ruptures — the stadium footprint is inside the VII circle).
 * Volcanoes: the pyroclastic runout and the lateral-blast sector.
 * Landslides: nothing — their only hazard is the tsunami, which the
 * model does not convert.
 */
function casualtyPlanForResult(result: ActiveResult, location: Coordinates): CasualtyPlan | null {
  switch (result.type) {
    case 'impact':
      return blastCasualtyPlan({
        blastEnergy: result.data.impactor.kineticEnergy,
        overpressure5psiRadius: result.data.damage.overpressure5psi,
        overpressure1psiRadius: result.data.damage.overpressure1psi,
      });
    case 'explosion':
      return blastCasualtyPlan({
        blastEnergy: result.data.yield.joules,
        overpressure5psiRadius: result.data.blast.overpressure5psiRadiusHob,
        overpressure1psiRadius: result.data.blast.overpressure1psiRadiusHob,
      });
    case 'earthquake': {
      const plan = shakingCasualtyPlan({
        mmi7Radius: result.data.shaking.mmi7Radius,
        mmi8Radius: result.data.shaking.mmi8Radius,
        mmi9Radius: result.data.shaking.mmi9Radius,
      });
      // Extended source: the MMI contours are the rupture stadium the
      // globe draws, not circles round the epicentre — an offshore
      // megathrust's VIII band runs 500 km along the coast while a
      // circle of the same radius sits at sea and counts nobody.
      if (plan !== null && result.data.isExtendedSource) {
        const halfL = (result.data.ruptureLength as number) / 2;
        const halfW = (result.data.ruptureWidth as number) / 2;
        const strike = result.data.inputs.strikeAzimuthDeg ?? 0;
        for (const band of plan.bands) {
          band.polygon = buildRuptureStadiumLatLon({
            centerLatDeg: location.latitude,
            centerLonDeg: location.longitude,
            strikeAzimuthDeg: strike,
            halfLengthAlongStrikeM: halfL,
            halfWidthAcrossStrikeM: halfW,
            contourRadiusM: band.outerRadiusM,
          });
        }
      }
      return plan;
    }
    case 'volcano':
      return pyroclasticCasualtyPlan({
        pyroclasticRunout: result.data.pyroclasticRunout,
        ...(result.data.lateralBlast !== undefined && {
          lateralBlastRunout: result.data.lateralBlast.runout,
          lateralBlastSectorDeg: result.data.lateralBlast.sectorAngleDeg,
        }),
      });
    case 'landslide':
      return null;
  }
}

const METHOD_RANK: Record<PopulationLookupMethod, number> = {
  cog: 0,
  'worldpop-api': 1,
  'coarse-raster': 2,
};

/** The estimate as a sweep: the arrival function of the hazard front
 *  for this event family, applied to the bands the estimate has. */
function casualtyTimelineFor(result: ActiveResult, estimate: CasualtyEstimate): CasualtyTimeline {
  const maxRadiusM = estimate.bands.reduce((mx, b) => Math.max(mx, b.outerRadiusM), 0);
  // The air shock of an impact carries `IMPACT_BLAST_COUPLING` of the
  // kinetic energy — the same energy the rings are drawn with.
  const blastEnergy =
    result.type === 'impact'
      ? J((result.data.impactor.kineticEnergy as number) * IMPACT_BLAST_COUPLING)
      : result.type === 'explosion'
        ? result.data.yield.joules
        : undefined;
  return buildCasualtyTimeline(
    estimate,
    arrivalFunctionFor({
      model: estimate.model,
      maxRadiusM,
      ...(blastEnergy !== undefined && { blastEnergy }),
    })
  );
}

/**
 * Fetch the population inside every band (and the headline exposure
 * ring), then turn the plan into an estimate. Two passes: the shipped
 * coarse raster first, which answers in milliseconds and gives the bar
 * a provisional figure to start counting from; then the fine backends
 * (COG, WorldPop API — 15–45 s a band), which replace it. Every radius
 * is queried once per pass; the population backend caches and
 * throttles. Stale guard: a newer result in the store means this run's
 * numbers are dropped.
 */
async function runCasualtyLookup(
  result: ActiveResult,
  plan: CasualtyPlan | null,
  headline: { radiusM: number; label: string } | null,
  location: Coordinates,
  get: () => AppStore,
  set: (partial: Partial<AppStore>) => void
): Promise<void> {
  const lookup = populationLookup;
  if (lookup === null) {
    set({ populationStatus: 'idle', casualtyStatus: 'idle' });
    return;
  }
  // One query per distinct footprint: bands keyed by radius plus
  // polygon, the headline ring by radius alone (it is a circle even
  // when the bands are stadiums).
  const queryKey = (radiusM: number, polygon?: PopulationPolygon): string =>
    polygon === undefined
      ? `r:${radiusM.toString()}`
      : `p:${radiusM.toString()}:${polygon.length.toString()}`;
  const queries = new Map<string, { radiusM: number; polygon?: PopulationPolygon }>();
  if (plan !== null) {
    for (const band of plan.bands) {
      queries.set(queryKey(band.outerRadiusM, band.polygon), {
        radiusM: band.outerRadiusM,
        ...(band.polygon !== undefined && { polygon: band.polygon }),
      });
    }
  }
  if (headline !== null) {
    queries.set(queryKey(headline.radiusM), { radiusM: headline.radiusM });
  }

  const collect = async (
    options: PopulationLookupOptions
  ): Promise<Map<string, PopulationLookupResult | null>> => {
    const lookups = new Map<string, PopulationLookupResult | null>();
    try {
      await Promise.all(
        [...queries].map(async ([key, q]) => {
          lookups.set(
            key,
            await lookup(location.latitude, location.longitude, q.radiusM, q.polygon, options)
          );
        })
      );
    } catch (err) {
      console.warn('[populationLookup] dispatch failed:', err);
    }
    return lookups;
  };

  const publish = (
    lookups: Map<string, PopulationLookupResult | null>,
    provisional: boolean
  ): void => {
    if (headline !== null) {
      const hit = lookups.get(queryKey(headline.radiusM)) ?? null;
      if (hit !== null) {
        set({
          populationExposure: { ...hit, ringLabel: headline.label },
          populationStatus: 'idle',
        });
      } else if (!provisional) {
        set({ populationExposure: null, populationStatus: 'error' });
      }
    }
    if (plan === null) return;
    const cumulative: number[] = [];
    let method: PopulationLookupMethod = 'cog';
    let source = '';
    for (const band of plan.bands) {
      const hit = lookups.get(queryKey(band.outerRadiusM, band.polygon)) ?? null;
      if (hit === null) {
        // A failed fine pass keeps the provisional figure, if any,
        // rather than replacing a number with nothing.
        if (!provisional) {
          set(
            get().casualties === null
              ? { casualties: null, casualtyStatus: 'error' }
              : { casualtyStatus: 'idle' }
          );
        }
        return;
      }
      cumulative.push(hit.exposed);
      if (METHOD_RANK[hit.method] > METHOD_RANK[method]) method = hit.method;
      source = hit.source;
    }
    const estimate = estimateCasualties(plan, cumulative);
    set({
      casualties: { ...estimate, source, method, provisional },
      casualtyTimeline: casualtyTimelineFor(result, estimate),
      casualtyClockStartedAt: get().casualtyClockStartedAt ?? performance.now(),
      casualtyStatus: provisional ? 'fetching' : 'idle',
    });
  };

  const fast = await collect({ fast: true });
  if (get().result !== result) return; // superseded by a newer evaluate
  publish(fast, true);
  const fine = await collect({});
  if (get().result !== result) return;
  publish(fine, false);
}

/** Pick the most representative damage radius for the population
 *  lookup, per event type. Each return value carries a short i18n
 *  label key the UI can render alongside the count ("Population
 *  exposed to ≥ 5 psi: …"). Returns null when the result genuinely
 *  has no land-based damage radius worth measuring (e.g. landslides
 *  — they generate tsunamis, the population at risk is on the far
 *  shore, not at the slide source). */
function headlineRingForResult(result: ActiveResult): { radiusM: number; label: string } | null {
  switch (result.type) {
    case 'impact': {
      const r = result.data.damage.overpressure5psi as number;
      return r > 0 ? { radiusM: r, label: 'population.ring.overpressure5psi' } : null;
    }
    case 'explosion': {
      const r = result.data.blast.overpressure5psiRadiusHob as number;
      return r > 0 ? { radiusM: r, label: 'population.ring.overpressure5psi' } : null;
    }
    case 'earthquake': {
      const r = result.data.shaking.mmi8Radius as number;
      return r > 0 ? { radiusM: r, label: 'population.ring.mmi8' } : null;
    }
    case 'volcano': {
      const r = result.data.pyroclasticRunout as number;
      return r > 0 ? { radiusM: r, label: 'population.ring.pyroclasticRunout' } : null;
    }
    case 'landslide':
      return null;
  }
}

function isValidCoordinates(c: Coordinates): boolean {
  return (
    Number.isFinite(c.latitude) &&
    Number.isFinite(c.longitude) &&
    c.latitude >= -90 &&
    c.latitude <= 90 &&
    c.longitude >= -180 &&
    c.longitude <= 180
  );
}

/**
 * Run the centralized inputSchema validator on a fully-merged scenario
 * input and return either the validated payload (status != 'invalid')
 * or null when the input is rejected at the schema boundary.
 *
 * Replaces the previous `auditStoreInput` which only logged. Now the
 * validator is the single classification authority: setters apply the
 * classified payload OR no-op if invalid. No more inline silent drops
 * competing with the schema (closes the consolidation gap from
 * `CONSOLIDATION_AUDIT.md` L1).
 */
function classifyStoreInput<T>(
  type: ScenarioType,
  merged: T
): { ok: true; classified: T } | { ok: false } {
  const v = validateScenario(type, merged as unknown as Record<string, unknown>);
  if (v.result.status === 'invalid') {
    if (import.meta.env.DEV) {
      console.warn(`[store] ${type} input rejected at schema (state unchanged):`, v.result.errors);
    }
    return { ok: false };
  }
  if (import.meta.env.DEV) {
    for (const w of v.result.warnings) {
      console.warn(`[store] ${type} ${w.field} ${w.code}: ${w.message}`);
    }
  }
  return { ok: true, classified: v.result.input as T };
}

/**
 * Canonical app store. See docs/ARCHITECTURE.md §"The store" for the
 * layering rationale: it sits between the headless physics layer (L2)
 * and the React UI (L4), exposing actions that the UI invokes and
 * typed-result slices that Globe / Stage read via selectors.
 */
export const useAppStore = create<AppStore>((set, get) => ({
  ...initialState(),

  selectEventType: (type) => {
    set({
      eventType: type,
      selectedAftershockIndex: null,
      hiddenRingKeys: new Set<string>(),
      result: null,
      bathymetricTsunami: null,
      populationExposure: null,
      populationStatus: 'idle',
      casualties: null,
      casualtyTimeline: null,
      casualtyClockStartedAt: null,
      casualtyStatus: 'idle',
      monteCarlo: null,
      monteCarloStatus: 'idle',
      status: 'idle',
      error: null,
      lastEvaluatedAt: null,
      lastEvaluatedAtLocation: null,
    });
  },

  toggleRingVisibility: (key) => {
    set((state) => {
      const next = new Set(state.hiddenRingKeys);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { hiddenRingKeys: next };
    });
  },

  showAllRings: () => {
    set({ hiddenRingKeys: new Set<string>() });
  },

  requestCameraFlight: (target, rangeM) => {
    if (!isValidCoordinates(target)) {
      throw new Error(`Invalid camera target: ${JSON.stringify(target)}.`);
    }
    cameraRequestSeq += 1;
    set({
      cameraRequest: {
        latitude: target.latitude,
        longitude: target.longitude,
        rangeM: Number.isFinite(rangeM) && rangeM > 0 ? rangeM : 100_000,
        seq: cameraRequestSeq,
      },
    });
  },

  selectPreset: (id) => {
    if (isImpactPresetId(id)) {
      set({
        eventType: 'impact',
        impact: { preset: id, input: IMPACT_PRESETS[id].input },
        selectedAftershockIndex: null,
        result: null,
        bathymetricTsunami: null,
        populationExposure: null,
        populationStatus: 'idle',
        casualties: null,
        casualtyTimeline: null,
        casualtyClockStartedAt: null,
        casualtyStatus: 'idle',
        monteCarlo: null,
        monteCarloStatus: 'idle',
        deepDive: null,
        deepDiveStatus: 'idle',
        deepDiveError: null,
        status: 'idle',
        error: null,
        lastEvaluatedAt: null,
        lastEvaluatedAtLocation: null,
      });
      return;
    }
    if (isExplosionPresetId(id)) {
      set({
        eventType: 'explosion',
        explosion: { preset: id, input: EXPLOSION_PRESETS[id].input },
        selectedAftershockIndex: null,
        result: null,
        bathymetricTsunami: null,
        populationExposure: null,
        populationStatus: 'idle',
        casualties: null,
        casualtyTimeline: null,
        casualtyClockStartedAt: null,
        casualtyStatus: 'idle',
        monteCarlo: null,
        monteCarloStatus: 'idle',
        deepDive: null,
        deepDiveStatus: 'idle',
        deepDiveError: null,
        status: 'idle',
        error: null,
        lastEvaluatedAt: null,
        lastEvaluatedAtLocation: null,
      });
      return;
    }
    if (isEarthquakePresetId(id)) {
      set({
        eventType: 'earthquake',
        earthquake: { preset: id, input: EARTHQUAKE_PRESETS[id].input },
        selectedAftershockIndex: null,
        result: null,
        bathymetricTsunami: null,
        populationExposure: null,
        populationStatus: 'idle',
        casualties: null,
        casualtyTimeline: null,
        casualtyClockStartedAt: null,
        casualtyStatus: 'idle',
        monteCarlo: null,
        monteCarloStatus: 'idle',
        deepDive: null,
        deepDiveStatus: 'idle',
        deepDiveError: null,
        status: 'idle',
        error: null,
        lastEvaluatedAt: null,
        lastEvaluatedAtLocation: null,
      });
      return;
    }
    if (isVolcanoPresetId(id)) {
      set({
        eventType: 'volcano',
        volcano: { preset: id, input: VOLCANO_PRESETS[id].input },
        selectedAftershockIndex: null,
        result: null,
        bathymetricTsunami: null,
        populationExposure: null,
        populationStatus: 'idle',
        casualties: null,
        casualtyTimeline: null,
        casualtyClockStartedAt: null,
        casualtyStatus: 'idle',
        monteCarlo: null,
        monteCarloStatus: 'idle',
        deepDive: null,
        deepDiveStatus: 'idle',
        deepDiveError: null,
        status: 'idle',
        error: null,
        lastEvaluatedAt: null,
        lastEvaluatedAtLocation: null,
      });
      return;
    }
    if (isLandslidePresetId(id)) {
      set({
        eventType: 'landslide',
        landslide: { preset: id, input: LANDSLIDE_PRESETS[id].input },
        selectedAftershockIndex: null,
        result: null,
        bathymetricTsunami: null,
        populationExposure: null,
        populationStatus: 'idle',
        casualties: null,
        casualtyTimeline: null,
        casualtyClockStartedAt: null,
        casualtyStatus: 'idle',
        monteCarlo: null,
        monteCarloStatus: 'idle',
        deepDive: null,
        deepDiveStatus: 'idle',
        deepDiveError: null,
        status: 'idle',
        error: null,
        lastEvaluatedAt: null,
        lastEvaluatedAtLocation: null,
      });
      return;
    }
    throw new Error(`Unknown preset id: ${String(id)}`);
  },

  setImpactInput: (overrides) => {
    set((state) => {
      // Stage 1: type-wrap the raw overrides into branded units. NO
      // inline `> 0` / `>= 0` checks — the validator owns that.
      const merged: ImpactScenarioInput = { ...state.impact.input };
      if (overrides.impactorDiameter !== undefined)
        merged.impactorDiameter = m(overrides.impactorDiameter);
      if (overrides.impactVelocity !== undefined)
        merged.impactVelocity = mps(overrides.impactVelocity);
      if (overrides.impactorDensity !== undefined)
        merged.impactorDensity = kgPerM3(overrides.impactorDensity);
      if (overrides.targetDensity !== undefined)
        merged.targetDensity = kgPerM3(overrides.targetDensity);
      if (overrides.impactAngle !== undefined)
        merged.impactAngle = degreesToRadians(deg(overrides.impactAngle));
      if (overrides.surfaceGravity !== undefined) merged.surfaceGravity = overrides.surfaceGravity;
      if (overrides.impactAzimuthDeg !== undefined)
        merged.impactAzimuthDeg = overrides.impactAzimuthDeg;
      if (overrides.impactorStrength !== undefined)
        merged.impactorStrength = Pa(overrides.impactorStrength);

      // Stage 2: classify via the schema. If invalid, no-op the set call.
      const classification = classifyStoreInput('impact', merged);
      if (!classification.ok) return state;
      const next = classification.classified;

      return {
        eventType: 'impact',
        impact: { preset: 'CUSTOM', input: next },
        selectedAftershockIndex: null,
        result: null,
        bathymetricTsunami: null,
        populationExposure: null,
        populationStatus: 'idle',
        casualties: null,
        casualtyTimeline: null,
        casualtyClockStartedAt: null,
        casualtyStatus: 'idle',
        monteCarlo: null,
        monteCarloStatus: 'idle',
        deepDive: null,
        deepDiveStatus: 'idle',
        deepDiveError: null,
        status: 'idle',
        error: null,
        lastEvaluatedAt: null,
        lastEvaluatedAtLocation: null,
      };
    });
  },

  setExplosionInput: (overrides) => {
    set((state) => {
      const merged: ExplosionScenarioInput = { ...state.explosion.input };
      if (overrides.yieldMegatons !== undefined) merged.yieldMegatons = overrides.yieldMegatons;
      if (overrides.groundType !== undefined) merged.groundType = overrides.groundType;
      if (overrides.heightOfBurst !== undefined) merged.heightOfBurst = m(overrides.heightOfBurst);
      if (overrides.windSpeed !== undefined) merged.windSpeed = mps(overrides.windSpeed);
      if (overrides.windDirectionDeg !== undefined)
        merged.windDirectionDeg = overrides.windDirectionDeg;

      const classification = classifyStoreInput('explosion', merged);
      if (!classification.ok) return state;
      const next = classification.classified;

      return {
        eventType: 'explosion',
        explosion: { preset: 'CUSTOM', input: next },
        selectedAftershockIndex: null,
        result: null,
        bathymetricTsunami: null,
        populationExposure: null,
        populationStatus: 'idle',
        casualties: null,
        casualtyTimeline: null,
        casualtyClockStartedAt: null,
        casualtyStatus: 'idle',
        monteCarlo: null,
        monteCarloStatus: 'idle',
        deepDive: null,
        deepDiveStatus: 'idle',
        deepDiveError: null,
        status: 'idle',
        error: null,
        lastEvaluatedAt: null,
        lastEvaluatedAtLocation: null,
      };
    });
  },

  setEarthquakeInput: (overrides) => {
    set((state) => {
      const merged: EarthquakeScenarioInput = { ...state.earthquake.input };
      if (overrides.magnitude !== undefined) merged.magnitude = overrides.magnitude;
      if (overrides.depth !== undefined) merged.depth = m(overrides.depth);
      if (overrides.faultType !== undefined) merged.faultType = overrides.faultType;
      if (overrides.vs30 !== undefined) merged.vs30 = overrides.vs30;
      if (overrides.subductionInterface !== undefined)
        merged.subductionInterface = overrides.subductionInterface;

      const classification = classifyStoreInput('earthquake', merged);
      if (!classification.ok) return state;
      const next = classification.classified;

      return {
        eventType: 'earthquake',
        earthquake: { preset: 'CUSTOM', input: next },
        selectedAftershockIndex: null,
        result: null,
        bathymetricTsunami: null,
        populationExposure: null,
        populationStatus: 'idle',
        casualties: null,
        casualtyTimeline: null,
        casualtyClockStartedAt: null,
        casualtyStatus: 'idle',
        monteCarlo: null,
        monteCarloStatus: 'idle',
        deepDive: null,
        deepDiveStatus: 'idle',
        deepDiveError: null,
        status: 'idle',
        error: null,
        lastEvaluatedAt: null,
        lastEvaluatedAtLocation: null,
      };
    });
  },

  setVolcanoInput: (overrides) => {
    set((state) => {
      const merged: VolcanoScenarioInput = { ...state.volcano.input };
      if (overrides.volumeEruptionRate !== undefined)
        merged.volumeEruptionRate = overrides.volumeEruptionRate;
      if (overrides.totalEjectaVolume !== undefined)
        merged.totalEjectaVolume = overrides.totalEjectaVolume;
      if (overrides.laharVolume !== undefined) merged.laharVolume = overrides.laharVolume;
      if (overrides.windSpeed !== undefined) merged.windSpeed = overrides.windSpeed;
      if (overrides.windDirectionDegrees !== undefined)
        merged.windDirectionDegrees = overrides.windDirectionDegrees;

      const classification = classifyStoreInput('volcano', merged);
      if (!classification.ok) return state;
      const next = classification.classified;

      return {
        eventType: 'volcano',
        volcano: { preset: 'CUSTOM', input: next },
        selectedAftershockIndex: null,
        result: null,
        bathymetricTsunami: null,
        populationExposure: null,
        populationStatus: 'idle',
        casualties: null,
        casualtyTimeline: null,
        casualtyClockStartedAt: null,
        casualtyStatus: 'idle',
        monteCarlo: null,
        monteCarloStatus: 'idle',
        deepDive: null,
        deepDiveStatus: 'idle',
        deepDiveError: null,
        status: 'idle',
        error: null,
        lastEvaluatedAt: null,
        lastEvaluatedAtLocation: null,
      };
    });
  },

  setLandslideInput: (overrides) => {
    set((state) => {
      const merged: LandslideScenarioInput = { ...state.landslide.input };
      if (overrides.volumeM3 !== undefined) merged.volumeM3 = overrides.volumeM3;
      if (overrides.slopeAngleDeg !== undefined) merged.slopeAngleDeg = overrides.slopeAngleDeg;
      if (overrides.meanOceanDepth !== undefined)
        merged.meanOceanDepth = m(overrides.meanOceanDepth);
      if (overrides.regime !== undefined) merged.regime = overrides.regime;

      const classification = classifyStoreInput('landslide', merged);
      if (!classification.ok) return state;
      const next = classification.classified;

      return {
        eventType: 'landslide',
        landslide: { preset: 'CUSTOM', input: next },
        selectedAftershockIndex: null,
        result: null,
        bathymetricTsunami: null,
        populationExposure: null,
        populationStatus: 'idle',
        casualties: null,
        casualtyTimeline: null,
        casualtyClockStartedAt: null,
        casualtyStatus: 'idle',
        monteCarlo: null,
        monteCarloStatus: 'idle',
        deepDive: null,
        deepDiveStatus: 'idle',
        deepDiveError: null,
        status: 'idle',
        error: null,
        lastEvaluatedAt: null,
        lastEvaluatedAtLocation: null,
      };
    });
  },

  setLocation: (coords) => {
    if (!isValidCoordinates(coords)) {
      throw new Error(
        `Invalid coordinates: ${JSON.stringify(coords)}. Latitude must be [−90, 90], longitude [−180, 180].`
      );
    }
    // A fresh epicentre pick supersedes any pinned aftershock — the
    // selection points at an entity that the next render pass will
    // tear down.
    set({ location: coords, selectedAftershockIndex: null });
  },

  clearLocation: () => {
    set({ location: null, selectedAftershockIndex: null });
  },

  selectAftershock: (index) => {
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(
        `Aftershock index must be a non-negative integer (received ${String(index)}).`
      );
    }
    set({ selectedAftershockIndex: index });
  },

  clearAftershock: () => {
    set({ selectedAftershockIndex: null });
  },

  setElevationGrid: (grid) => {
    // Just store the tile. Earlier versions ran a "race-condition
    // catch-up" here — when a Launch click landed before the Terrarium
    // tile arrived, the catch-up re-fired evaluate behind the scenes
    // so the tsunami cascade would still appear. The user-facing
    // contract turned out to be more important than that convenience:
    // Launch is the only thing that should ever start a simulation,
    // and clicking elsewhere on the globe must not surprise the user
    // with an auto-restart. If the first Launch happened before the
    // tile loaded, the next Launch will pick up the populated grid
    // and produce the full result.
    set({ elevationGrid: grid });
  },

  setGlobalBathymetricGrid: (grid) => {
    set({ globalBathymetricGrid: grid });
    if (grid === null) return;
    // A mosaic that lands AFTER a Launch completes the tsunami layer
    // of the result already on screen. This is not a re-simulation —
    // the physics result and every number in the panel stay exactly
    // as they are; only the trans-oceanic propagation that was
    // missing gets drawn. Guarded by the evaluation token so a Launch
    // issued meanwhile always wins.
    const state = get();
    if (
      state.status === 'running' ||
      state.result === null ||
      state.lastEvaluatedAtLocation === null ||
      state.elevationGrid === null ||
      !gridCoversLocation(state.elevationGrid, state.lastEvaluatedAtLocation) ||
      !resultTriggersTsunami(state.result) ||
      state.bathymetricTsunami?.global !== undefined
    ) {
      return;
    }
    const result = state.result;
    const evaluationAtStart = currentEvaluationId;
    void computeBathymetricLayerForResult(
      result,
      {
        location: state.lastEvaluatedAtLocation,
        elevationGrid: state.elevationGrid,
        globalBathymetricGrid: grid,
      },
      getSimulationWorker()
    ).then((layer) => {
      if (layer === null) return;
      if (evaluationAtStart !== currentEvaluationId) return;
      if (get().result !== result) return;
      set({ bathymetricTsunami: layer });
    });
  },

  evaluate: async () => {
    // Phase 12a — cancellation token. Bumped every evaluate() so that
    // a previous in-flight run whose physics finishes AFTER a fresh
    // Launch is detected and its writes are dropped. Prevents the
    // "square comes back" race where a stale bathymetricTsunami with
    // an undefined .global field overwrites a fresh one.
    const evaluationId = (currentEvaluationId += 1);
    set({ status: 'running', error: null });
    // Terrain before physics: the local tile under the pick and the
    // planetary mosaic decide whether there is water to displace and
    // how far the wave is drawn. See `ensureTerrainForEvaluate`.
    await ensureTerrainForEvaluate(get, set);
    if (evaluationId !== currentEvaluationId) return;
    const state = get();
    const sim = getSimulationWorker();
    try {
      let result: ActiveResult;
      if (state.eventType === 'impact') {
        // Auto-derive waterDepth from bathymetry when:
        //   1. user hasn't manually set it (preset CHICXULUB_OCEAN ships
        //      with explicit waterDepth; custom inputs leave it
        //      undefined),
        //   2. an elevation grid is loaded that actually covers the
        //      pick point (per-click Terrarium tile, see
        //      src/scene/terrainSampling.ts), and
        //   3. the pick point sits below sea level. Terrarium encodes
        //      bathymetry from ETOPO1, so negative samples are real
        //      water depths. The −10 m floor filters DEM noise around
        //      the coastline so a sandbar one pixel below MSL doesn't
        //      misfire the tsunami cascade.
        let impactInput = state.impact.input;
        // Sample terrain once and reuse: the same z drives both the
        // waterDepth auto-derivation and the post-simulation gate
        // for terrestrial-only effects (firestorm / liquefaction).
        const impactClickZ =
          state.elevationGrid !== null &&
          state.location !== null &&
          gridCoversLocation(state.elevationGrid, state.location)
            ? sampleElevation(
                state.elevationGrid,
                state.location.latitude,
                state.location.longitude
              )
            : undefined;
        const impactClickIsOpenWater = impactClickZ !== undefined && impactClickZ < OCEAN_FLOOR_M;
        if (
          impactInput.waterDepth === undefined &&
          impactClickZ !== undefined &&
          state.elevationGrid !== null &&
          state.location !== null
        ) {
          if (impactClickIsOpenWater) {
            impactInput = { ...impactInput, waterDepth: m(-impactClickZ) };
          } else {
            // Impatto sulla terraferma. Il mare più vicino che un'onda può
            // attraversare (non un lago, non un fiume) dà la distanza dalla
            // riva; la fisica decide se cratere, cavità o coltre di ejecta
            // lo raggiungono e quanta energia entra in acqua. La profondità
            // sintetica resta tappata a 200 m: è la piattaforma su cui la
            // cavità si forma, non l'abisso oltre.
            const sea = nearestSeaForImpact(
              state.elevationGrid,
              state.globalBathymetricGrid,
              state.location
            );
            if (sea !== null) {
              impactInput = {
                ...impactInput,
                waterDepth: m(Math.min(sea.basinDepthM, 200)),
                shoreDistance: m(sea.distanceM),
              };
            }
          }
        }
        // DEM-driven beach slope for the Synolakis run-up — see
        // `deriveBeachSlope` for the envelope check. Open-ocean
        // clicks return undefined and the physics falls back to the
        // 1:100 reference, which is the right behaviour for a
        // mid-ocean impact whose run-up is computed at an
        // unspecified far-field coast.
        if (impactInput.coastalBeachSlopeRad === undefined) {
          const beachSlope = deriveBeachSlope(state.elevationGrid, state.location);
          if (beachSlope !== undefined) {
            impactInput = { ...impactInput, coastalBeachSlopeRad: beachSlope };
          }
        }
        const impactData = await sim.simulateImpact(impactInput);
        result = {
          type: 'impact',
          data: gateImpactByTerrain(impactData, impactClickIsOpenWater),
        };
      } else if (state.eventType === 'explosion') {
        // Auto-derive waterDepth from bathymetry (same pattern as
        // impact above): if the user picked an ocean point and the
        // Terrarium tile covers it, feed the negative elevation as
        // the burst-water depth. The Glasstone underwater-burst
        // tsunami branch then fires automatically.
        //
        // Coastal fall-through: if the click cell itself is land
        // (positive elevation — a quay, a beach, a pier), we still
        // search a 5 km neighbourhood for ocean cells. Beirut 2020
        // sat on +0–10 m of reclaimed quay yet generated a small
        // wave train into the harbour; without this fall-through the
        // store would set no waterDepth and the cascade would silently
        // drop the coastal-tsunami branch. The coupling efficiency
        // for a near-shore burst is lower than a true contact-water
        // burst, so we cap the synthetic depth at 200 m and rely on
        // the existing Glasstone factor in `explosionTsunami` to
        // dampen the headline amplitude — a separate follow-up will
        // introduce a "near-shore" coupling correction proper.
        let explosionInput = state.explosion.input;
        let explosionClickIsOpenWater = false;
        if (
          state.elevationGrid !== null &&
          state.location !== null &&
          gridCoversLocation(state.elevationGrid, state.location)
        ) {
          const z = sampleElevation(
            state.elevationGrid,
            state.location.latitude,
            state.location.longitude
          );
          explosionClickIsOpenWater = z < OCEAN_FLOOR_M;
          if (explosionInput.waterDepth === undefined) {
            if (explosionClickIsOpenWater) {
              explosionInput = { ...explosionInput, waterDepth: m(-z) };
            } else {
              // Cella di terra: si cerca il mare fin dove l'onda d'urto
              // lo solleverebbe ancora (raggio dei 5 psi), non entro un
              // raggio fisso. Con una testata enorme nell'entroterra
              // della Florida il mare è a decine di chilometri: col
              // vecchio limite di 5 km non veniva mai trovato e lo
              // tsunami spariva senza dirlo a nessuno.
              const raggio = coastalSearchRadiusForYield(explosionInput.yieldMegatons * 4.184e15);
              // La tessera locale copre ~150 km: oltre, si interroga il
              // mosaico batimetrico planetario, se già caricato.
              const coastalDepth =
                findNearbyOceanDepth(
                  state.elevationGrid,
                  state.location.latitude,
                  state.location.longitude,
                  raggio
                ) ??
                (state.globalBathymetricGrid !== null
                  ? findNearbyOceanDepth(
                      state.globalBathymetricGrid,
                      state.location.latitude,
                      state.location.longitude,
                      raggio
                    )
                  : null);
              if (coastalDepth !== null) {
                const cappedDepth = Math.min(coastalDepth, 200);
                explosionInput = { ...explosionInput, waterDepth: m(cappedDepth) };
              }
            }
          }
        }
        // DEM-driven beach slope for the Synolakis run-up. For coastal
        // bursts (Beirut, Castle Bravo) the click sits on land with a
        // real local slope — exactly the case where the local DEM is
        // more meaningful than the 1:100 textbook reference.
        if (explosionInput.coastalBeachSlopeRad === undefined) {
          const beachSlope = deriveBeachSlope(state.elevationGrid, state.location);
          if (beachSlope !== undefined) {
            explosionInput = { ...explosionInput, coastalBeachSlopeRad: beachSlope };
          }
        }
        const explosionData = await sim.simulateExplosion(explosionInput);
        result = {
          type: 'explosion',
          data: gateExplosionByTerrain(explosionData, explosionClickIsOpenWater),
        };
      } else if (state.eventType === 'earthquake') {
        // Auto-derive Vs30 from the topographic-slope proxy when the
        // user has not specified one AND an elevation grid is loaded.
        let earthquakeInput = state.earthquake.input;
        if (
          state.earthquake.input.vs30 === undefined &&
          state.location !== null &&
          state.elevationGrid !== null
        ) {
          const slope = sampleSlope(
            state.elevationGrid,
            state.location.latitude,
            state.location.longitude
          );
          const vs30 = waldAllen2007Vs30FromSlope(slope);
          earthquakeInput = { ...earthquakeInput, vs30 };
        }
        // Auto-derive waterDepth from the bathymetry sample when the
        // user has not specified one AND an elevation grid is loaded.
        // Negative elevation = below sea level. The 10 m floor matches
        // the explosion branch — anything shallower is treated as a
        // foreshore /tidal flat where the submarine tsunami pipeline
        // is not appropriate.
        if (
          state.earthquake.input.waterDepth === undefined &&
          state.location !== null &&
          state.elevationGrid !== null &&
          gridCoversLocation(state.elevationGrid, state.location)
        ) {
          const z = sampleElevation(
            state.elevationGrid,
            state.location.latitude,
            state.location.longitude
          );
          if (z < OCEAN_FLOOR_M) {
            earthquakeInput = { ...earthquakeInput, waterDepth: m(-z) };
          }
        }
        // DEM-driven beach slope for the seismic-tsunami run-up.
        // For coastal megathrusts (Tōhoku, Sumatra) the relevant
        // shore is far from the rupture and the source slope is the
        // continental slope (too steep) — the envelope check filters
        // those out. For shallow continental events (L'Aquila,
        // Northridge) tsunami doesn't trigger anyway. The fallback
        // 1:100 reference covers both cases honestly.
        if (earthquakeInput.coastalBeachSlopeRad === undefined) {
          const beachSlope = deriveBeachSlope(state.elevationGrid, state.location);
          if (beachSlope !== undefined) {
            earthquakeInput = { ...earthquakeInput, coastalBeachSlopeRad: beachSlope };
          }
        }
        const earthquakeData = await sim.simulateEarthquake(earthquakeInput);
        result = { type: 'earthquake', data: gateEarthquakeByTerrain(earthquakeData) };
      } else if (state.eventType === 'volcano') {
        result = { type: 'volcano', data: await sim.simulateVolcano(state.volcano.input) };
      } else {
        result = { type: 'landslide', data: await sim.simulateLandslide(state.landslide.input) };
      }

      // Bathymetric-tsunami layer (FMM arrival field + amplitude veil
      // + run-up) — see `computeBathymetricLayerForResult`. The grids
      // are re-read here rather than taken from `state`: the terrain
      // wait above may have installed them after `state` was captured.
      let bathymetricTsunami: BathymetricTsunamiResult | null = null;
      const terrainNow = get();
      if (state.location !== null && terrainNow.elevationGrid !== null) {
        bathymetricTsunami = await computeBathymetricLayerForResult(
          result,
          {
            location: state.location,
            elevationGrid: terrainNow.elevationGrid,
            globalBathymetricGrid: terrainNow.globalBathymetricGrid,
          },
          sim
        );
      }

      // Cancellation guard — drop the write if a newer evaluate()
      // has been kicked off while this one was awaiting the physics
      // worker. The freshly-issued evaluation will land its own
      // result and bathymetricTsunami; this stale resolution must
      // not overwrite it.
      if (evaluationId !== currentEvaluationId) {
        return;
      }
      set({
        result,
        bathymetricTsunami,
        populationExposure: null,
        populationStatus: 'fetching',
        casualties: null,
        casualtyTimeline: null,
        casualtyClockStartedAt: null,
        casualtyStatus: 'idle',
        status: 'idle',
        lastEvaluatedAt: Date.now(),
        lastEvaluatedAtLocation: state.location,
      });

      // Casualties + exposure, fire-and-forget. The physics result is
      // already in the store; WorldPop takes 15–45 s per band and the
      // UI shows the estimate when (and if) it lands. A failure writes
      // 'error'; nothing here ever blocks the simulator.
      const plan = state.location !== null ? casualtyPlanForResult(result, state.location) : null;
      const headline = headlineRingForResult(result);
      if (state.location === null || (plan === null && headline === null)) {
        set({
          populationStatus: 'idle',
          casualtyStatus: plan === null ? 'unsupported' : 'idle',
        });
      } else {
        set({
          populationStatus: headline !== null ? 'fetching' : 'idle',
          casualtyStatus: plan === null ? 'unsupported' : 'fetching',
        });
        void runCasualtyLookup(result, plan, headline, state.location, get, set);
      }
    } catch (err) {
      // Same cancellation guard as the success path: if a newer
      // evaluate() superseded this one, do not let its error
      // propagate into the visible store state.
      if (evaluationId !== currentEvaluationId) return;
      set({
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
        selectedAftershockIndex: null,
        result: null,
        bathymetricTsunami: null,
        populationExposure: null,
        populationStatus: 'idle',
        casualties: null,
        casualtyTimeline: null,
        casualtyClockStartedAt: null,
        casualtyStatus: 'idle',
        monteCarlo: null,
      });
    }
  },

  evaluateMonteCarlo: (iterations) => {
    const state = get();
    // Landslide is deterministic-only at this layer (no parameter
    // distributions wired through the MC worker yet). Refuse the
    // sweep gracefully so the UI gets a clear error rather than a
    // worker timeout.
    if (state.eventType === 'landslide') {
      set({
        monteCarloStatus: 'error',
        error: 'Monte Carlo not yet supported for landslide scenarios',
      });
      return;
    }
    // Default bumped to 1 000 iterations now that the sweep runs off
    // the main thread; UI stays at 60 fps during the ~25 ms sweep.
    const n = iterations ?? 1_000;
    const presetTag =
      state.eventType === 'impact'
        ? state.impact.preset
        : state.eventType === 'explosion'
          ? state.explosion.preset
          : state.eventType === 'earthquake'
            ? state.earthquake.preset
            : state.volcano.preset;
    const seed = `${state.eventType}:${presetTag}:${n.toString()}`;

    set({ monteCarloStatus: 'running' });
    const worker = getMonteCarloWorker();
    const run = async (): Promise<void> => {
      try {
        let mc: ActiveMonteCarlo;
        if (state.eventType === 'impact') {
          mc = { type: 'impact', data: await worker.runImpact(state.impact.input, n, seed) };
        } else if (state.eventType === 'explosion') {
          mc = {
            type: 'explosion',
            data: await worker.runExplosion(state.explosion.input, n, seed),
          };
        } else if (state.eventType === 'earthquake') {
          mc = {
            type: 'earthquake',
            data: await worker.runEarthquake(state.earthquake.input, n, seed),
          };
        } else {
          mc = { type: 'volcano', data: await worker.runVolcano(state.volcano.input, n, seed) };
        }
        // Only apply if the active scenario hasn't been swapped out
        // from under us while the sweep was in flight.
        const current = get();
        if (current.eventType === state.eventType) {
          set({ monteCarlo: mc, monteCarloStatus: 'idle' });
        }
      } catch (err) {
        console.error('[Monte Carlo] worker sweep failed:', err);
        set({ monteCarloStatus: 'error' });
      }
    };
    void run();
  },

  evaluateDeepDive: async () => {
    const state = get();
    const result = state.result;
    if (result === null) {
      set({ deepDiveStatus: 'error', deepDiveError: 'No active simulation result' });
      return;
    }
    // Pull the source amplitude + basin depth from the active result.
    // Supports impact (Ward-Asphaug cavity), earthquake (megathrust
    // uplift) and explosion (underwater-burst cavity); volcano +
    // landslide are out of scope for the seismic radial pipeline.
    let sourceAmplitudeM = 0;
    let basinDepthM = 4_000;
    if (result.type === 'impact' && result.data.tsunami !== undefined) {
      sourceAmplitudeM = result.data.tsunami.sourceAmplitude;
      basinDepthM = result.data.tsunami.meanOceanDepth;
    } else if (result.type === 'earthquake' && result.data.tsunami !== undefined) {
      sourceAmplitudeM = result.data.tsunami.initialAmplitude;
      basinDepthM = 4_000;
    } else if (result.type === 'explosion' && result.data.tsunami !== undefined) {
      sourceAmplitudeM = result.data.tsunami.sourceAmplitude;
      basinDepthM = result.data.tsunami.meanOceanDepth;
    } else {
      set({
        deepDiveStatus: 'error',
        deepDiveError:
          'Active scenario has no tsunami source — Deep Dive only runs on tsunami-bearing events',
      });
      return;
    }
    if (!Number.isFinite(sourceAmplitudeM) || sourceAmplitudeM <= 0) {
      set({
        deepDiveStatus: 'error',
        deepDiveError: 'Source amplitude is zero — nothing to propagate',
      });
      return;
    }

    // Setup. 400 cells × 10 km = 4 000 km domain. Source: Gaussian
    // centred at the symmetry axis with σ = 35 cells (350 km).
    // Probes at 100 / 500 / 1 000 / 2 000 / 3 000 km from source.
    const N = 400;
    const dx = 10_000;
    const sigmaCells = 35;
    const z: number[] = new Array<number>(N).fill(-Math.abs(basinDepthM));
    const eta0: number[] = new Array<number>(N).fill(0);
    for (let i = 0; i < N; i++) {
      const rCells = i + 0.5;
      eta0[i] = sourceAmplitudeM * Math.exp(-(rCells * rCells) / (2 * sigmaCells * sigmaCells));
    }
    const probeRangesKm = [100, 500, 1_000, 2_000, 3_000];
    const probeIndices = probeRangesKm.map((km) =>
      Math.min(N - 1, Math.max(0, Math.round((km * 1_000) / dx - 0.5)))
    );

    set({ deepDiveStatus: 'running', deepDiveError: null });
    const t0 = performance.now();
    try {
      const worker = await getSaintVenantWorker();
      const r = await worker.simulateSaintVenant1D({
        bathymetryM: z,
        cellWidthM: dx,
        initialDisplacementM: eta0,
        durationS: 12_000,
        manningN: 0.025,
        scheme: 'muscl-rk2',
        geometry: 'radial',
        probeCellIndices: probeIndices,
      });
      const computeMs = performance.now() - t0;
      const peakAmplitudesM = r.probes.map((p) => p.peakAbsAmplitudeM);
      const dd: DeepDiveResult = {
        rangesM: probeRangesKm.map((km) => km * 1_000),
        peakAmplitudesM,
        computeMs,
        sourceAmplitudeM,
        basinDepthM,
        gridCells: N,
        cellWidthM: dx,
      };
      set({ deepDive: dd, deepDiveStatus: 'idle', deepDiveError: null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Deep Dive] solver failed:', err);
      set({ deepDiveStatus: 'error', deepDiveError: msg });
    }
  },

  clearDeepDive: () => {
    set({ deepDive: null, deepDiveStatus: 'idle', deepDiveError: null });
  },

  setMode: (mode) => {
    set({ mode, transitionPhase: 'idle' });
  },

  setSimTime: (seconds) => {
    set({ simTime: seconds === null || !Number.isFinite(seconds) ? null : Math.max(seconds, 0) });
  },

  transitionTo: (target, options) => {
    const { mode, transitionPhase } = get();
    if (mode === target && transitionPhase === 'idle') return;
    if (transitionPhase !== 'idle') return;

    if (options?.instant ?? false) {
      set({ mode: target, transitionPhase: 'idle' });
      return;
    }

    set({ transitionPhase: 'fading-out' });
    setTimeout(() => {
      set({ mode: target, transitionPhase: 'fading-in' });
      setTimeout(() => {
        set({ transitionPhase: 'idle' });
      }, TRANSITION_HALF_MS);
    }, TRANSITION_HALF_MS);
  },

  reset: () => {
    set(initialState());
  },
}));

/** Reset the singleton store to its initial state (tests / HMR). */
export function resetAppStore(): void {
  useAppStore.setState(initialState());
}
