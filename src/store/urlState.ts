import { EARTHQUAKE_PRESETS } from '../physics/events/earthquake/index.js';
import { EXPLOSION_PRESETS } from '../physics/events/explosion/index.js';
import { LANDSLIDE_PRESETS } from '../physics/events/landslide/index.js';
import { VOLCANO_PRESETS } from '../physics/events/volcano/index.js';
import { STANDARD_GRAVITY } from '../physics/constants.js';
import { IMPACT_PRESETS } from '../physics/simulate.js';
import { deg, degreesToRadians, kgPerM3, m, mps, radiansToDegrees } from '../physics/units.js';
import type { AppStore, EventType, ViewMode } from './useAppStore.js';
import { CLOSE_UP_VIEW_ENABLED } from './useAppStore.js';

/**
 * Schema version. Bump when the URL keys or semantics change; older
 * URLs should then be migrated or dropped gracefully in the decoder.
 */
export const URL_STATE_VERSION = 1;

/**
 * Short, stable URL keys. Kept terse so a link fits in a tweet or a
 * QR code; verbose names go in docs not on the query string.
 */
export const URL_KEYS = {
  version: 'v',
  eventType: 't',
  preset: 'p',
  latitude: 'lat',
  longitude: 'lon',
  mode: 'm',
  // `t` is already the event type, so the playhead gets its own key.
  simTime: 'ts',
  // impact CUSTOM inputs
  diameter: 'd',
  velocity: 's',
  // Degrees, the unit a link written by hand uses.
  angleDeg: 'a',
  impactorDensity: 'rho',
  targetDensity: 'trho',
  gravity: 'g',
  impactAzimuthDeg: 'az',
  impactorStrength: 'str',
  // The depths are shared with explosions, and `od` with landslides.
  waterDepth: 'wd',
  meanOceanDepth: 'od',
  shoreDistance: 'sh',
  // explosion CUSTOM inputs
  yieldMegatons: 'y',
  // Signed: a negative height is a depth below the water surface.
  heightOfBurst: 'h',
  groundType: 'gt',
  // Wind: the explosion's thermal drift and the volcano's ash plume.
  windSpeed: 'ws',
  windDirectionDeg: 'wdir',
  chargeType: 'ct',
  // earthquake CUSTOM inputs
  magnitude: 'mw',
  depth: 'dep',
  faultType: 'ft',
  vs30: 'vs30',
  subductionInterface: 'si',
  strikeAzimuthDeg: 'st',
  ruptureLengthOverride: 'rl',
  ruptureWidthOverride: 'rw',
  // Seconds, or `none` for a basin with no warning system.
  warningIssueS: 'wi',
  // volcano CUSTOM inputs
  volumeEruptionRate: 'ver',
  totalEjectaVolume: 'vol',
  laharVolume: 'lah',
  evacuationRadiusM: 'ev',
  flankVolumeM3: 'fcv',
  flankSlopeDeg: 'fcs',
  flankMeanOceanDepth: 'fco',
  flankSourceWaterDepth: 'fcw',
  lateralBlastDirectionDeg: 'lbd',
  lateralBlastSectorDeg: 'lbs',
  // landslide CUSTOM inputs (the basin depth reuses `od`)
  slideVolumeM3: 'lv',
  slideSlopeDeg: 'sl',
  slideFootprintArea: 'fa',
  confinedBasinArea: 'ba',
  confinementDynamicFactor: 'bf',
  slideRegime: 'rg',
  slideDensity: 'sd',
  slideThicknessM: 'sth',
  slideWidthM: 'swd',
  slideImpactVelocityMS: 'svs',
  slideDropHeightM: 'sdz',
} as const;

/** Scenario types whose custom inputs a link restores wholesale. */
export type RestorableScenario = EventType;

const EXPLOSION_GROUND_TYPES = ['HARD_ROCK', 'FIRM_GROUND', 'DRY_SOIL', 'WET_SOIL'] as const;
const FAULT_TYPES = ['strike-slip', 'reverse', 'normal', 'all'] as const;
const SLIDE_REGIMES = ['submarine', 'subaerial'] as const;

/** The deepest a burst can be placed: the schema refuses more. */
const MAX_BURST_DEPTH_M = 11_000;

/**
 * A number as the shortest string that reads back to the same double.
 * A custom scenario is rebuilt from the link bit for bit, because the
 * object it rebuilds is what seeds the predictive band.
 */
function exact(n: number): string {
  return String(n);
}

type SyncableState = Pick<
  AppStore,
  | 'eventType'
  | 'impact'
  | 'explosion'
  | 'earthquake'
  | 'volcano'
  | 'landslide'
  | 'location'
  | 'mode'
  | 'simTime'
>;

function isEventType(value: string | null): value is EventType {
  return (
    value === 'impact' ||
    value === 'explosion' ||
    value === 'earthquake' ||
    value === 'volcano' ||
    value === 'landslide'
  );
}

function isViewMode(value: string | null): value is ViewMode {
  return (
    value === 'landing' ||
    value === 'globe' ||
    value === 'impact' ||
    value === 'methodology' ||
    value === 'report' ||
    value === 'validation'
  );
}

function numberParam(search: URLSearchParams, key: string): number | null {
  const raw = search.get(key);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Fixed-precision formatter: trims trailing zeros from `toFixed(digits)`
 * so latitude 21.5 stays "21.5" rather than "21.5000" in the URL.
 */
function trim(n: number, digits: number): string {
  return Number(n.toFixed(digits)).toString();
}

/*
 * Custom inputs, one encoder per scenario. Each writes every field the
 * stored input carries and nothing it does not: the stored input is the
 * validator's output, so a recipient who validates the same fields gets
 * the same object back.
 */

function setNumber(params: URLSearchParams, key: string, value: number | undefined): void {
  if (value !== undefined) params.set(key, exact(value));
}

function encodeImpact(params: URLSearchParams, input: AppStore['impact']['input']): void {
  setNumber(params, URL_KEYS.diameter, input.impactorDiameter);
  setNumber(params, URL_KEYS.velocity, input.impactVelocity);
  // The exact double in degrees comes back through the validator as
  // the same radians: checked over 29 000 angles, typed and random.
  setNumber(params, URL_KEYS.angleDeg, radiansToDegrees(input.impactAngle));
  setNumber(params, URL_KEYS.impactorDensity, input.impactorDensity);
  setNumber(params, URL_KEYS.targetDensity, input.targetDensity);
  setNumber(params, URL_KEYS.gravity, input.surfaceGravity);
  setNumber(params, URL_KEYS.impactAzimuthDeg, input.impactAzimuthDeg);
  setNumber(params, URL_KEYS.impactorStrength, input.impactorStrength);
  setNumber(params, URL_KEYS.waterDepth, input.waterDepth);
  setNumber(params, URL_KEYS.meanOceanDepth, input.meanOceanDepth);
  setNumber(params, URL_KEYS.shoreDistance, input.shoreDistance);
}

function encodeExplosion(params: URLSearchParams, input: AppStore['explosion']['input']): void {
  setNumber(params, URL_KEYS.yieldMegatons, input.yieldMegatons);
  setNumber(params, URL_KEYS.heightOfBurst, input.heightOfBurst);
  if (input.groundType !== undefined) params.set(URL_KEYS.groundType, input.groundType);
  setNumber(params, URL_KEYS.windSpeed, input.windSpeed);
  setNumber(params, URL_KEYS.windDirectionDeg, input.windDirectionDeg);
  if (input.chargeType !== undefined) params.set(URL_KEYS.chargeType, input.chargeType);
  setNumber(params, URL_KEYS.waterDepth, input.waterDepth);
  setNumber(params, URL_KEYS.meanOceanDepth, input.meanOceanDepth);
}

function encodeEarthquake(params: URLSearchParams, input: AppStore['earthquake']['input']): void {
  setNumber(params, URL_KEYS.magnitude, input.magnitude);
  setNumber(params, URL_KEYS.depth, input.depth);
  if (input.faultType !== undefined) params.set(URL_KEYS.faultType, input.faultType);
  setNumber(params, URL_KEYS.vs30, input.vs30);
  if (input.subductionInterface !== undefined) {
    params.set(URL_KEYS.subductionInterface, input.subductionInterface ? '1' : '0');
  }
  setNumber(params, URL_KEYS.strikeAzimuthDeg, input.strikeAzimuthDeg);
  setNumber(params, URL_KEYS.ruptureLengthOverride, input.ruptureLengthOverride);
  setNumber(params, URL_KEYS.ruptureWidthOverride, input.ruptureWidthOverride);
  if (input.warningIssueS !== undefined) {
    params.set(
      URL_KEYS.warningIssueS,
      input.warningIssueS === Number.POSITIVE_INFINITY ? 'none' : exact(input.warningIssueS)
    );
  }
}

function encodeVolcano(params: URLSearchParams, input: AppStore['volcano']['input']): void {
  setNumber(params, URL_KEYS.volumeEruptionRate, input.volumeEruptionRate);
  setNumber(params, URL_KEYS.totalEjectaVolume, input.totalEjectaVolume);
  setNumber(params, URL_KEYS.laharVolume, input.laharVolume);
  setNumber(params, URL_KEYS.windSpeed, input.windSpeed);
  setNumber(params, URL_KEYS.windDirectionDeg, input.windDirectionDegrees);
  setNumber(params, URL_KEYS.evacuationRadiusM, input.evacuationRadiusM);
  if (input.flankCollapse !== undefined) {
    setNumber(params, URL_KEYS.flankVolumeM3, input.flankCollapse.volumeM3);
    setNumber(params, URL_KEYS.flankSlopeDeg, input.flankCollapse.slopeAngleDeg);
    setNumber(params, URL_KEYS.flankMeanOceanDepth, input.flankCollapse.meanOceanDepth);
    setNumber(params, URL_KEYS.flankSourceWaterDepth, input.flankCollapse.sourceWaterDepth);
  }
  if (input.lateralBlast !== undefined) {
    setNumber(params, URL_KEYS.lateralBlastDirectionDeg, input.lateralBlast.directionDeg);
    setNumber(params, URL_KEYS.lateralBlastSectorDeg, input.lateralBlast.sectorAngleDeg);
  }
}

function encodeLandslide(params: URLSearchParams, input: AppStore['landslide']['input']): void {
  setNumber(params, URL_KEYS.slideVolumeM3, input.volumeM3);
  setNumber(params, URL_KEYS.slideSlopeDeg, input.slopeAngleDeg);
  setNumber(params, URL_KEYS.meanOceanDepth, input.meanOceanDepth);
  setNumber(params, URL_KEYS.slideFootprintArea, input.slideFootprintArea);
  setNumber(params, URL_KEYS.confinedBasinArea, input.confinedBasinArea);
  setNumber(params, URL_KEYS.confinementDynamicFactor, input.confinementDynamicFactor);
  if (input.regime !== undefined) params.set(URL_KEYS.slideRegime, input.regime);
  setNumber(params, URL_KEYS.slideDensity, input.slideDensity);
  setNumber(params, URL_KEYS.slideThicknessM, input.slideThicknessM);
  setNumber(params, URL_KEYS.slideWidthM, input.slideWidthM);
  setNumber(params, URL_KEYS.slideImpactVelocityMS, input.impactVelocityMS);
  setNumber(params, URL_KEYS.slideDropHeightM, input.dropHeightM);
}

/**
 * Serialise the shareable slice of the app state into URL search
 * params. Location, non-landing view mode, and the inputs of a CUSTOM
 * scenario are only included when they differ from defaults, so the
 * baseline "land on the page and pick a preset" URL stays short.
 */
export function encodeStateToSearchParams(state: SyncableState): URLSearchParams {
  const params = new URLSearchParams();
  params.set(URL_KEYS.version, URL_STATE_VERSION.toString());
  params.set(URL_KEYS.eventType, state.eventType);

  if (state.eventType === 'impact') {
    params.set(URL_KEYS.preset, state.impact.preset);
    if (state.impact.preset === 'CUSTOM') encodeImpact(params, state.impact.input);
  } else if (state.eventType === 'explosion') {
    params.set(URL_KEYS.preset, state.explosion.preset);
    if (state.explosion.preset === 'CUSTOM') encodeExplosion(params, state.explosion.input);
  } else if (state.eventType === 'earthquake') {
    params.set(URL_KEYS.preset, state.earthquake.preset);
    if (state.earthquake.preset === 'CUSTOM') encodeEarthquake(params, state.earthquake.input);
  } else if (state.eventType === 'volcano') {
    params.set(URL_KEYS.preset, state.volcano.preset);
    if (state.volcano.preset === 'CUSTOM') encodeVolcano(params, state.volcano.input);
  } else {
    params.set(URL_KEYS.preset, state.landslide.preset);
    if (state.landslide.preset === 'CUSTOM') encodeLandslide(params, state.landslide.input);
  }

  if (state.location) {
    params.set(URL_KEYS.latitude, trim(state.location.latitude, 4));
    params.set(URL_KEYS.longitude, trim(state.location.longitude, 4));
  }
  if (state.mode !== 'landing') {
    params.set(URL_KEYS.mode, state.mode);
  }

  // The playhead only belongs in the URL when there is a view that
  // uses it. Emitting it from the globe would put a number in every
  // shared link that nothing reads back.
  if (state.mode === 'impact' && state.simTime !== null) {
    params.set(URL_KEYS.simTime, trim(state.simTime, 2));
  }

  return params;
}

/**
 * Output of {@link decodeSearchParamsToIntent}. Null-typed fields
 * mean "do not override the existing store value"; they correspond
 * to URL keys that were absent or invalid.
 */
export interface DecodedStateIntent {
  eventType: EventType | null;
  /** Only set when the preset id is known in the relevant PRESETS table. */
  preset: string | null;
  /** Present only when both lat and lon parsed into valid ranges. */
  location: { latitude: number; longitude: number } | null;
  mode: ViewMode | null;
  /** Playhead in simulation seconds; null when the URL carries none. */
  simTime: number | null;
  /** A link whose preset is 'CUSTOM': the input fields it carried, each
   *  checked against its domain. The store validates them as a whole
   *  when it restores them. */
  customInput: { type: RestorableScenario; raw: Record<string, unknown> } | null;
}

function looksLikeCustomPreset(preset: string): boolean {
  return preset === 'CUSTOM';
}

function presetBelongsTo(preset: string, table: EventType): boolean {
  if (table === 'impact') return preset in IMPACT_PRESETS || looksLikeCustomPreset(preset);
  if (table === 'explosion') return preset in EXPLOSION_PRESETS || looksLikeCustomPreset(preset);
  if (table === 'earthquake') return preset in EARTHQUAKE_PRESETS || looksLikeCustomPreset(preset);
  if (table === 'volcano') return preset in VOLCANO_PRESETS || looksLikeCustomPreset(preset);
  return preset in LANDSLIDE_PRESETS || looksLikeCustomPreset(preset);
}

/** Fields a link carried for one custom scenario, each dropped when it
 *  is outside the domain its schema allows. Null when none parsed. */
function decodeCustomInput(
  type: RestorableScenario,
  search: URLSearchParams
): DecodedStateIntent['customInput'] {
  const raw: Record<string, unknown> = {};
  const number = (field: string, key: string, ok: (v: number) => boolean): void => {
    const v = numberParam(search, key);
    if (v !== null && ok(v)) raw[field] = v;
  };
  const oneOf = (field: string, key: string, allowed: readonly string[]): void => {
    const v = search.get(key);
    const match = allowed.find((a) => a === v);
    if (match !== undefined) raw[field] = match;
  };
  // Never stricter than the validator: Elm 1881 fell on dry land, and
  // a link that refused its zero-depth basin rebuilt a different slide.
  const any = (): boolean => true;
  const positive = (v: number): boolean => v > 0;
  const nonNegative = (v: number): boolean => v >= 0;
  const slope = (v: number): boolean => v > 0 && v < 90;

  if (type === 'impact') {
    number('impactorDiameter', URL_KEYS.diameter, positive);
    number('impactVelocity', URL_KEYS.velocity, positive);
    number('impactAngleDeg', URL_KEYS.angleDeg, positive);
    number('impactorDensity', URL_KEYS.impactorDensity, positive);
    number('targetDensity', URL_KEYS.targetDensity, positive);
    number('surfaceGravity', URL_KEYS.gravity, positive);
    number('impactAzimuthDeg', URL_KEYS.impactAzimuthDeg, any);
    number('impactorStrength', URL_KEYS.impactorStrength, positive);
    number('waterDepth', URL_KEYS.waterDepth, nonNegative);
    number('meanOceanDepth', URL_KEYS.meanOceanDepth, positive);
    number('shoreDistance', URL_KEYS.shoreDistance, nonNegative);
    // A link written by hand may leave gravity out. The input's own
    // default is Earth's; the app's links always carry it.
    if (Object.keys(raw).length > 0 && raw.surfaceGravity === undefined) {
      raw.surfaceGravity = STANDARD_GRAVITY;
    }
  } else if (type === 'explosion') {
    number('yieldMegatons', URL_KEYS.yieldMegatons, positive);
    number('heightOfBurst', URL_KEYS.heightOfBurst, (v) => v >= -MAX_BURST_DEPTH_M);
    oneOf('groundType', URL_KEYS.groundType, EXPLOSION_GROUND_TYPES);
    number('windSpeed', URL_KEYS.windSpeed, nonNegative);
    number('windDirectionDeg', URL_KEYS.windDirectionDeg, any);
    oneOf('chargeType', URL_KEYS.chargeType, ['nuclear', 'chemical'] as const);
    number('waterDepth', URL_KEYS.waterDepth, nonNegative);
    number('meanOceanDepth', URL_KEYS.meanOceanDepth, positive);
  } else if (type === 'earthquake') {
    number('magnitude', URL_KEYS.magnitude, positive);
    number('depth', URL_KEYS.depth, nonNegative);
    oneOf('faultType', URL_KEYS.faultType, FAULT_TYPES);
    number('vs30', URL_KEYS.vs30, positive);
    const si = search.get(URL_KEYS.subductionInterface);
    if (si === '1' || si === '0') raw.subductionInterface = si === '1';
    number('strikeAzimuthDeg', URL_KEYS.strikeAzimuthDeg, any);
    number('ruptureLengthOverride', URL_KEYS.ruptureLengthOverride, positive);
    number('ruptureWidthOverride', URL_KEYS.ruptureWidthOverride, positive);
    if (search.get(URL_KEYS.warningIssueS) === 'none') {
      raw.warningIssueS = Number.POSITIVE_INFINITY;
    } else {
      number('warningIssueS', URL_KEYS.warningIssueS, nonNegative);
    }
  } else if (type === 'volcano') {
    number('volumeEruptionRate', URL_KEYS.volumeEruptionRate, positive);
    number('totalEjectaVolume', URL_KEYS.totalEjectaVolume, positive);
    number('laharVolume', URL_KEYS.laharVolume, nonNegative);
    number('windSpeed', URL_KEYS.windSpeed, nonNegative);
    number('windDirectionDegrees', URL_KEYS.windDirectionDeg, any);
    number('evacuationRadiusM', URL_KEYS.evacuationRadiusM, nonNegative);
    const flankVolume = numberParam(search, URL_KEYS.flankVolumeM3);
    if (flankVolume !== null && flankVolume > 0) {
      const flank: Record<string, number> = { volumeM3: flankVolume };
      const flankSlope = numberParam(search, URL_KEYS.flankSlopeDeg);
      if (flankSlope !== null && slope(flankSlope)) flank.slopeAngleDeg = flankSlope;
      const basin = numberParam(search, URL_KEYS.flankMeanOceanDepth);
      if (basin !== null && basin >= 0) flank.meanOceanDepth = basin;
      const source = numberParam(search, URL_KEYS.flankSourceWaterDepth);
      if (source !== null && source >= 0) flank.sourceWaterDepth = source;
      raw.flankCollapse = flank;
    }
    const blastDirection = numberParam(search, URL_KEYS.lateralBlastDirectionDeg);
    if (blastDirection !== null) {
      const blast: Record<string, number> = { directionDeg: blastDirection };
      const sector = numberParam(search, URL_KEYS.lateralBlastSectorDeg);
      if (sector !== null && sector > 0 && sector <= 360) blast.sectorAngleDeg = sector;
      raw.lateralBlast = blast;
    }
  } else {
    number('volumeM3', URL_KEYS.slideVolumeM3, positive);
    number('slopeAngleDeg', URL_KEYS.slideSlopeDeg, slope);
    number('meanOceanDepth', URL_KEYS.meanOceanDepth, nonNegative);
    number('slideFootprintArea', URL_KEYS.slideFootprintArea, positive);
    number('confinedBasinArea', URL_KEYS.confinedBasinArea, positive);
    number('confinementDynamicFactor', URL_KEYS.confinementDynamicFactor, positive);
    oneOf('regime', URL_KEYS.slideRegime, SLIDE_REGIMES);
    number('slideDensity', URL_KEYS.slideDensity, positive);
    number('slideThicknessM', URL_KEYS.slideThicknessM, positive);
    number('slideWidthM', URL_KEYS.slideWidthM, positive);
    number('impactVelocityMS', URL_KEYS.slideImpactVelocityMS, positive);
    number('dropHeightM', URL_KEYS.slideDropHeightM, positive);
  }
  return Object.keys(raw).length > 0 ? { type, raw } : null;
}

/**
 * Parse URL search params into an "intent" describing which slices
 * the app store should update after this hydration. The caller is
 * responsible for applying the intent via the store actions; this
 * function is pure and returns null for every field the URL did not
 * express (or expressed invalidly).
 */
export function decodeSearchParamsToIntent(search: URLSearchParams): DecodedStateIntent {
  const rawType = search.get(URL_KEYS.eventType);
  const eventType = isEventType(rawType) ? rawType : null;

  let preset: string | null = null;
  const rawPreset = search.get(URL_KEYS.preset);
  if (rawPreset !== null && eventType !== null && presetBelongsTo(rawPreset, eventType)) {
    preset = rawPreset;
  }

  const lat = numberParam(search, URL_KEYS.latitude);
  const lon = numberParam(search, URL_KEYS.longitude);
  const location =
    lat !== null && lon !== null && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
      ? { latitude: lat, longitude: lon }
      : null;

  const rawMode = search.get(URL_KEYS.mode);
  // A link shared while the close-up existed must not reopen it once
  // the view is off; it lands on the globe, which is where the
  // simulation lives anyway.
  const decodedMode = isViewMode(rawMode) ? rawMode : null;
  const mode =
    decodedMode === 'impact' && !CLOSE_UP_VIEW_ENABLED ? ('globe' as ViewMode) : decodedMode;

  const rawTime = numberParam(search, URL_KEYS.simTime);
  const simTime = rawTime !== null && rawTime >= 0 && rawTime < 1e7 ? rawTime : null;

  const customInput: DecodedStateIntent['customInput'] =
    eventType !== null && preset === 'CUSTOM' ? decodeCustomInput(eventType, search) : null;

  return { eventType, preset, location, mode, simTime, customInput };
}

/**
 * Convenience: turn a bare URL (relative or absolute) into the
 * decoded intent. Pass `window.location.href` from the browser; tests
 * pass crafted strings directly.
 */
export function decodeUrl(url: string, base = 'http://localhost/'): DecodedStateIntent {
  try {
    const parsed = new URL(url, base);
    return decodeSearchParamsToIntent(parsed.searchParams);
  } catch {
    return {
      eventType: null,
      preset: null,
      location: null,
      mode: null,
      simTime: null,
      customInput: null,
    };
  }
}

/**
 * Apply a decoded intent to the app store. Uses the existing typed
 * actions (`selectEventType`, `selectPreset`, `restoreCustomInput`,
 * `setLocation`, `setMode`) so each slice validates its own inputs.
 * Anything left `null` in the intent is ignored.
 */
export function applyIntentToStore(intent: DecodedStateIntent, store: AppStore): void {
  if (intent.eventType !== null) store.selectEventType(intent.eventType);

  if (intent.preset !== null && intent.preset !== 'CUSTOM') {
    // selectPreset routes to the correct event-type slice by itself.
    store.selectPreset(intent.preset as Parameters<AppStore['selectPreset']>[0]);
  }

  if (intent.customInput !== null) {
    store.restoreCustomInput(intent.customInput.type, intent.customInput.raw);
  }

  if (intent.location !== null) {
    store.setLocation(intent.location);
  }

  if (intent.mode !== null) {
    store.setMode(intent.mode);
  }
  store.setSimTime(intent.simTime);
}

/**
 * Reconstruct a SyncableState projection from the full app store.
 * Used by the hook that writes URL params when the store changes —
 * we keep this selector in one place so the set of tracked fields
 * lives next to encode/decode.
 */
export function projectSyncableState(store: AppStore): SyncableState {
  return {
    eventType: store.eventType,
    impact: store.impact,
    explosion: store.explosion,
    earthquake: store.earthquake,
    volcano: store.volcano,
    landslide: store.landslide,
    location: store.location,
    mode: store.mode,
    simTime: store.simTime,
  };
}

/**
 * Helper kept alongside the encoder so the test suite has access to
 * the canonical sets of recognised keys without re-deriving them.
 */
export function knownUrlKeys(): string[] {
  return Object.values(URL_KEYS);
}

// Re-exports to give the unit tests a direct dependency on the SI
// conversions that encode/decode implies — saves a level of
// indirection in the spec file.
export { degreesToRadians, kgPerM3, m as meters, mps, deg };
