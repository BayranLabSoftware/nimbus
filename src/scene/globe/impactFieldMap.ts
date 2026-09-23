/**
 * An impact drawn as the field's own map (ROADMAP M11, IMP-7b, approved by
 * Andrea on 22 September 2026): one quantity at a time as a continuous surface
 * in its units, the model's thresholds as isolines carrying their value, a
 * colour scale that says what they mean, and the uncertainty in a view of its
 * own. The way USGS ShakeMap draws shaking and Glasstone & Dolan draw a blast.
 *
 * This module decides WHAT is drawn and computes it; `impactFieldRenderer.ts`
 * hands it to Cesium and `ui/components/ImpactFieldLegend.tsx` explains it.
 * It holds no copy of any law: every value is read from the functions the
 * model publishes (`events/impact/impactField.ts`, the ejecta and seismic
 * relations), and every isoline stands at a radius the result prints or the
 * field reaches.
 *
 * One geometry for the isoline and for the colour (B-105, and the lesson of
 * B-053 and B-059): a family of contours is the model's oblique ellipse about
 * its downrange centre, self-similar about the point of impact —
 * `levelGeometry` draws the isoline of any nominal radius, and
 * `nominalRangeAt` reads the nominal radius back from a point, which is how
 * the ground is coloured.
 */
import type { TFunction } from 'i18next';
import { thermalHorizonRadius } from '../../physics/casualties.js';
import { EARTH_RADIUS } from '../../physics/constants.js';
import { clampToGreatCircle } from '../../physics/earthScale.js';
import { impactFireballRadius } from '../../physics/effects/blastWave.js';
import { airburstBlastBand } from '../../physics/effects/airburstBlast.js';
import type { RingAsymmetry } from '../../physics/effects/asymmetry.js';
import { ejectaBlanketOuterEdge, ejectaThickness } from '../../physics/effects/ejecta.js';
import {
  OVERPRESSURE_BUILDING_COLLAPSE,
  OVERPRESSURE_LIGHT_DAMAGE,
  OVERPRESSURE_WINDOW_BREAK,
} from '../../physics/events/impact/damageRings.js';
import {
  impactFieldReach,
  impactOverpressureAt,
  impactPeakWindAt,
  impactThermalExposureAt,
  programOverpressureForWind,
  programPeakWind,
  type ImpactFieldSource,
} from '../../physics/events/impact/impactField.js';
import {
  PROGRAM_SHAKING_LEVELS,
  programSeismicAttenuation,
  programShakingRadiusKm,
} from '../../physics/events/impact/seismic.js';
import type { ImpactScenarioResult } from '../../physics/simulate.js';
import { DEFAULT_MIN_DEPTH_M } from '../../physics/tsunami/sourcePlacement.js';
import { SHORE_DEPTH_CAP_M } from '../../physics/validation/shoreDepthRules.js';
import { J, m, Pa } from '../../physics/units.js';
import {
  heatmapColorAt,
  WAVE_CREST_CSS,
  WAVE_ISOCHRONE_CSS,
  WAVE_RUNUP_TIERS,
  WAVE_STREAK_CSS,
} from '../heatmap.js';
import { projectAlongAzimuth } from '../stadiumPolygon.js';
import type { EvidenceQuantity } from '../../physics/validation/evidenceClasses.js';
import { evidenceText, type EvidenceText } from './evidenceText.js';
import { RING_RADIUS_SIGMA } from './ringSigma.js';
import { INTENSITY_BANDS } from './shakingOverlay.js';
import {
  BELOW_THRESHOLD_DECADES,
  type BeyondEdge,
  type EpistemicState,
  type MapState,
  type ProvenanceCard,
} from './mapGrammarRules.js';

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

export interface GeoPoint {
  latDeg: number;
  lonDeg: number;
}

/** A family of an impact's contours: the ellipse the model draws a ring of
 *  each nominal radius R on — semi-axes R·majorMult and R·minorMult along and
 *  across `azimuthDeg`, its centre R·offsetPerMeter downrange of the point of
 *  impact. */
export interface FamilyShape {
  azimuthDeg: number;
  majorMult: number;
  minorMult: number;
  offsetPerMeter: number;
}

export const CIRCLE_SHAPE: FamilyShape = {
  azimuthDeg: 0,
  majorMult: 1,
  minorMult: 1,
  offsetPerMeter: 0,
};

/** The family a ring's asymmetry record belongs to. The record's offset is in
 *  metres for that ring's radius, and the model scales it with the radius
 *  (`obliqueImpactCentreOffset`), so it is carried per metre. */
export function familyShape(
  asymmetry: RingAsymmetry | undefined,
  nominalRadiusM: number
): FamilyShape {
  if (asymmetry === undefined || !(nominalRadiusM > 0)) return CIRCLE_SHAPE;
  return {
    azimuthDeg: asymmetry.azimuthDeg,
    majorMult: asymmetry.semiMajorMultiplier,
    minorMult: asymmetry.semiMinorMultiplier,
    offsetPerMeter: asymmetry.centerOffsetMeters / nominalRadiusM,
  };
}

export interface LevelGeometry {
  centerLatDeg: number;
  centerLonDeg: number;
  semiMajorM: number;
  semiMinorM: number;
  /** Cesium's ellipse rotation, the convention `computeAsymmetricGeometry`
   *  hands the ring entities: π/2 − the azimuth. */
  rotationRad: number;
}

/** The isoline of nominal radius `nominalRadiusM` in a family: the model's
 *  ellipse about its own downrange centre. */
export function levelGeometry(
  anchor: GeoPoint,
  shape: FamilyShape,
  nominalRadiusM: number
): LevelGeometry {
  const azimuthRad = (shape.azimuthDeg * Math.PI) / 180;
  const offset = shape.offsetPerMeter * nominalRadiusM;
  const centre =
    offset === 0 ? anchor : projectAlongAzimuth(anchor.latDeg, anchor.lonDeg, azimuthRad, offset);
  return {
    centerLatDeg: centre.latDeg,
    centerLonDeg: centre.lonDeg,
    semiMajorM: clampToGreatCircle(nominalRadiusM * shape.majorMult),
    semiMinorM: clampToGreatCircle(nominalRadiusM * shape.minorMult),
    rotationRad: Math.PI / 2 - azimuthRad,
  };
}

const R_EARTH = EARTH_RADIUS as number;

/**
 * The nominal radius whose isoline passes through a point: the inverse of
 * {@link levelGeometry}, solved in the azimuthal-equidistant plane about the
 * point of impact, where the family is a set of ellipses scaled about the
 * origin: ((u − kR)/(aR))² + (v/(bR))² = 1, u along the azimuth. Exact for a
 * round family; for an oblique one it differs from the sphere's ellipse by
 * the offset's curvature, which is second order in the offset over the
 * Earth's radius. The isolines themselves are always the model's ellipses.
 */
export function nominalRangeAt(
  anchor: GeoPoint,
  shape: FamilyShape,
  latDeg: number,
  lonDeg: number
): number {
  const { distanceM, bearingRad } = distanceAndBearing(anchor, latDeg, lonDeg);
  return nominalRangeFromPolar(shape, distanceM, bearingRad);
}

/** {@link nominalRangeAt} from a distance and a compass bearing (rad). */
export function nominalRangeFromPolar(
  shape: FamilyShape,
  distanceM: number,
  bearingRad: number
): number {
  if (!(distanceM > 0)) return 0;
  const theta = bearingRad - (shape.azimuthDeg * Math.PI) / 180;
  const u = distanceM * Math.cos(theta);
  const v = distanceM * Math.sin(theta);
  const alpha = 1 / (shape.majorMult * shape.majorMult);
  const beta = 1 / (shape.minorMult * shape.minorMult);
  const k = shape.offsetPerMeter;
  const a = alpha * k * k - 1;
  const b = -2 * alpha * k * u;
  const c = alpha * u * u + beta * v * v;
  if (a === 0) return c / -b;
  const disc = Math.max(b * b - 4 * a * c, 0);
  return (-b - Math.sqrt(disc)) / (2 * a);
}

/** Great-circle distance (m) and initial compass bearing (rad) from a point. */
export function distanceAndBearing(
  from: GeoPoint,
  latDeg: number,
  lonDeg: number
): { distanceM: number; bearingRad: number } {
  const f1 = (from.latDeg * Math.PI) / 180;
  const f2 = (latDeg * Math.PI) / 180;
  const dl = ((lonDeg - from.lonDeg) * Math.PI) / 180;
  const sdf = Math.sin((f2 - f1) / 2);
  const sdl = Math.sin(dl / 2);
  const h = sdf * sdf + Math.cos(f1) * Math.cos(f2) * sdl * sdl;
  const distanceM = 2 * R_EARTH * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(1 - h, 0)));
  const bearingRad = Math.atan2(
    Math.sin(dl) * Math.cos(f2),
    Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl)
  );
  return { distanceM, bearingRad };
}

/** The point at a compass bearing (deg) on the isoline of a nominal radius:
 *  where a label is written. A bearing is read on [0, 360), so no bearing past
 *  180° folds onto the south (the defect of `outlinePointAtBearing`, noted on
 *  21 September 2026 and left, with its callers, to their modules). */
export function isolinePointAtBearing(
  anchor: GeoPoint,
  shape: FamilyShape,
  nominalRadiusM: number,
  bearingDeg: number
): GeoPoint {
  const bearingRad = ((((bearingDeg % 360) + 360) % 360) * Math.PI) / 180;
  // Along the bearing the nominal radius grows with the distance: halve on it.
  let lo = 0;
  let hi =
    nominalRadiusM *
    (Math.max(shape.majorMult, shape.minorMult) + Math.abs(shape.offsetPerMeter)) *
    2;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (nominalRangeFromPolar(shape, mid, bearingRad) < nominalRadiusM) lo = mid;
    else hi = mid;
  }
  return projectAlongAzimuth(anchor.latDeg, anchor.lonDeg, bearingRad, (lo + hi) / 2);
}

// ---------------------------------------------------------------------------
// What an impact's map is made of
// ---------------------------------------------------------------------------

export type ImpactLayerId =
  | 'overpressure'
  | 'wind'
  | 'thermal'
  | 'ejecta'
  | 'shaking'
  | 'tsunami'
  | 'uncertainty';

export const IMPACT_LAYER_ORDER: readonly ImpactLayerId[] = [
  'overpressure',
  'wind',
  'thermal',
  'ejecta',
  'shaking',
  'tsunami',
  'uncertainty',
];

/** The layers drawn as a field of this module. The tsunami's is the wave
 *  map the globe has always drawn for it (`Globe.tsx`), which the report's
 *  flat maps cannot draw: it prints the wave in its numbers instead. */
export function isFieldLayer(id: ImpactLayerId): boolean {
  return id !== 'tsunami';
}

export type FamilyId = 'blast' | 'heat' | 'ejecta' | 'crater' | 'circle';

export interface MapIsoline {
  /** Stable suffix of the entity id. */
  id: string;
  family: FamilyId;
  radiusM: number;
  /** The value written on the line, formatted for the reader's language. */
  label: string;
  /** Compass bearing (deg) the label is written at. */
  labelBearingDeg: number;
  /** Tooltip: what the line is, and where it comes from. */
  title: string;
  description: string;
  source: string;
  /** The thresholds a drawn line stands for when they coincide at the
   *  map's scale (B-119), each at its own radius. */
  members?: readonly { label: string; title: string; description: string; radiusM: number }[];
  /** Rule 1031 (a): a line that stands on a limit of the model is no isoline
   *  of damage — the globe writes this callout on the limit instead. */
  atLimit?: string;
}

/** The thresholds a drawn line stands for, each with its own radius: the
 *  line itself, or the lines it joins (B-119). A table lists these. */
export function isolineMembers(
  line: MapIsoline
): { id: string; label: string; title: string; description: string; radiusM: number }[] {
  if (line.members === undefined) return [line];
  return line.members.map((m, k) => ({ id: `${line.id}#${k.toString()}`, ...m }));
}

export interface ColorbarSpec {
  /** Colour stops from the low end to the high end. */
  palette: readonly string[];
  /** Domain ends, in log10 of `unitScale`-scaled values when `log`. */
  lo: number;
  hi: number;
  log: boolean;
  ticks: readonly { value: number; label: string }[];
  /** The thresholds, on the bar: what each means and how far it reaches. */
  marks: readonly { value: number; label: string; detail: string }[];
}

/**
 * Where a colour bar puts its ticks and its thresholds, `top` to `top +
 * height` from the high end down: each tick at its value, each threshold's
 * mark at its value and its words spread upward so that no two print within
 * `minGap` of each other, lifted back inside the bar if the spread ran past
 * its top. The globe's legend and the printed report both lay their bars out
 * with it, so the two cannot place a threshold differently.
 */
export function layoutColorbar(
  spec: ColorbarSpec,
  top: number,
  height: number,
  minGap: number
): {
  yOf: (value: number) => number;
  ticks: { y: number; label: string }[];
  marks: { y: number; ly: number; label: string; detail: string }[];
} {
  const at = (v: number): number => (spec.log ? Math.log10(v) : v);
  const yOf = (v: number): number => top + (1 - (at(v) - spec.lo) / (spec.hi - spec.lo)) * height;
  const ticks = spec.ticks
    .filter((tk) => at(tk.value) >= spec.lo - 1e-9 && at(tk.value) <= spec.hi + 1e-9)
    .map((tk) => ({ y: yOf(tk.value), label: tk.label }));
  const marks = spec.marks
    .map((m) => ({ y: yOf(m.value), ly: yOf(m.value), label: m.label, detail: m.detail }))
    .sort((a, b) => b.y - a.y);
  let previous = Number.POSITIVE_INFINITY;
  for (const m of marks) {
    m.ly = Math.min(m.y, previous - minGap);
    previous = m.ly;
  }
  const lift = marks.length > 0 ? Math.max(0, top + 10 - Math.min(...marks.map((m) => m.ly))) : 0;
  for (const m of marks) m.ly += lift;
  return { yOf, ticks, marks };
}

export interface CategoryKey {
  color: string;
  hatched: boolean;
  label: string;
  /** What it is on the globe when not an area: a line, a dashed line or a
   *  point; the key is drawn the same way. */
  shape?: 'line' | 'dashed' | 'dot';
}

/** How the ground is coloured: a colour for each nominal radius, read in the
 *  family's shape out to `maxRangeM`. */
export interface GroundField {
  family: FamilyId;
  minRangeM: number;
  maxRangeM: number;
  /** RGBA (0–255) at a nominal radius, or null where nothing is painted. */
  colorAt: (rangeM: number) => readonly [number, number, number, number] | null;
  /** True where the colour is hatched rather than filled (the field's band). */
  hatchedAt?: (rangeM: number) => boolean;
  /** Nothing is painted inside this nominal radius: a band or an area that
   *  starts at another's edge (rule 1030). */
  holeM?: number;
}

export interface UncertaintyChoice {
  key: string;
  label: string;
  kind: 'probability' | 'agreement';
  family: FamilyId;
  medianM: number;
  /** Published 1σ scatter of the radius, for a probability. */
  sigma?: number;
  /** The field's band, for an agreement. */
  lowM?: number;
  highM?: number;
  /** Why the threshold carries no band, where it carries none. */
  unavailable?: string;
}

/** Rule 1030: an isoline as the globe draws it, with its visual state. */
export type DrawnIsoline = MapIsoline & { state: MapState };

/** Rule 1032 (b): where a layer's field ends, and what lies beyond. */
export interface LayerEdge {
  /** The nominal radius the field is drawn to (m). */
  atM: number;
  beyond: BeyondEdge;
  /** An ordinary last isoline, or a limit of the model (rule 1030 (3)). */
  kind: 'lastIsoline' | 'modelLimit';
}

/** Rule 1030 (2)–(4): an object drawn for a state other than computed — the
 *  faint band below the display threshold, a limit of the model, an area the
 *  model does not compute — each with its card (rule 1029). */
export interface StateMark {
  /** Stable suffix of the entity id. */
  id: string;
  state: Exclude<MapState, 'computed'>;
  family: FamilyId;
  /** The nominal radii it spans (m); a line stands at `fromM`, `toM` equal. */
  fromM: number;
  toM: number;
  /** What the globe writes on it (rule 1030): its state, never a value. */
  label: string;
  labelBearingDeg: number;
  /** What lies past it, in words, for its tooltip. */
  description: string;
  card: ProvenanceCard;
}

export interface ImpactMapLayer {
  id: ImpactLayerId;
  tab: string;
  title: string;
  unit: string;
  field: GroundField | null;
  isolines: DrawnIsoline[];
  colorbar: ColorbarSpec | null;
  categories: CategoryKey[];
  notes: { label: string; text: string }[];
  uncertainty?: { choices: UncertaintyChoice[]; selected: UncertaintyChoice | null };
  /** What the layer's numbers can claim (physics/validation/evidenceClasses.ts):
   *  the legend prints it above everything else the layer says. */
  evidence: LayerEvidence;
  /** Rule 1030: the layer's visual state as a whole. */
  state: MapState;
  /** Rule 1029: its provenance card. */
  card: ProvenanceCard;
  /** Rule 1032 (b): its field's edge, null for a layer with no field. */
  edge: LayerEdge | null;
  /** Rule 1030 (2)–(4): what it draws past its edge, in the order drawn. */
  marks: StateMark[];
}

/** Rule 1030 (2): how a layer's field goes on past its painted edge. */
interface BelowField {
  /** The field at a nominal radius, in the unit its thresholds are written in. */
  valueAt: (rangeM: number) => number;
  /** A magnitude falls a decade of amplitude by one unit; anything else by
   *  ten times. */
  scale: 'ratio' | 'magnitude';
  /** A value as the legend writes it. */
  format: (value: number) => string;
  /** The band's words, where the layer's own are not «continua sotto
   *  soglia» (the ejecta, rule 1031 (b)). */
  label?: string;
}

/** A layer as its builder makes it, before its evidence, state, card, edge
 *  and marks are attached. */
type RawLayer = Omit<
  ImpactMapLayer,
  'evidence' | 'state' | 'card' | 'edge' | 'marks' | 'isolines'
> & {
  isolines: MapIsoline[];
  /** Rule 1030 (2): the field below its display threshold, where the layer's
   *  quantity goes on falling; absent where it does not (a zone, an
   *  agreement) or where its own step draws it (the ejecta, rule 1031 (b)). */
  below?: BelowField;
  /** What lies past an ordinary last edge, where it is not the field going on
   *  below its threshold. */
  beyond?: BeyondEdge;
};

export type LayerEvidence = Pick<
  EvidenceText,
  'quantity' | 'klass' | 'label' | 'short' | 'summary'
>;

/** The family of numbers each layer draws; the uncertainty view takes the
 *  family of the threshold it reads. */
const LAYER_EVIDENCE: Readonly<Record<Exclude<ImpactLayerId, 'uncertainty'>, EvidenceQuantity>> = {
  overpressure: 'blast',
  wind: 'blast',
  thermal: 'thermal',
  ejecta: 'ejecta',
  shaking: 'seismic',
  tsunami: 'tsunami',
};

const FAMILY_EVIDENCE: Readonly<Record<FamilyId, EvidenceQuantity>> = {
  blast: 'blast',
  heat: 'thermal',
  ejecta: 'ejecta',
  crater: 'crater',
  circle: 'seismic',
};

function layerEvidence(layer: RawLayer, ctx: ImpactMapContext): LayerEvidence {
  const quantity =
    layer.id === 'uncertainty'
      ? FAMILY_EVIDENCE[layer.uncertainty?.selected?.family ?? 'blast']
      : LAYER_EVIDENCE[layer.id];
  const { klass, label, short, summary } = evidenceText(quantity, ctx.t, ctx.language);
  return { quantity, klass, label, short, summary };
}

export interface ImpactMapContext {
  t: TFunction;
  language: string;
  /** The threshold the uncertainty view reads; the first it has when null. */
  uncertaintyKey?: string | null;
  /** What the globe's wave map has drawn, for the tsunami's layer to name
   *  it and nothing else; null while it has drawn nothing. */
  waveMap?: WaveMapKey | null;
  /** Set when the wave found no sea deep enough to carry it within this
   *  reach (m), so that nothing will be drawn (B-120). */
  waveUnpropagatedReachM?: number | null;
}

/**
 * What the globe's wave map has on the globe (`Globe.tsx`, the tsunami's
 * drawing of every module), as it drew it: a key is a promise that something
 * is drawn (B-107), so the tsunami's layer lists these and only these.
 */
export interface WaveMapKey {
  /** The planet's grid, or the tile about the source where the planet's
   *  grid has no wave of a metre. */
  scope: 'global' | 'local';
  /** The veil's scale: its colour map runs from 1 m to this height (m), on
   *  a square root; null when no cell of the veil passes 1 m. */
  veilTop: number | null;
  /** The veil's opacity at the foot and at the top of its scale. */
  veilOpacity: { min: number; max: number };
  /** The NOAA heights (m) drawn as isolines, with their colours. */
  contours: readonly { threshold: number; css: string }[];
  /** The hours drawn as dashed lines of arrival. */
  isochroneHours: readonly number[];
  /** The running crest, and the streaks of the wave's direction. */
  crest: boolean;
  streaks: boolean;
  /** The tiers of the run-up markers on the coast, those drawn. */
  runup: readonly { from: number; css: string }[];
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const localeOf = (language: string): string =>
  language.toLowerCase().startsWith('it') ? 'it-IT' : 'en-US';

export function formatNumber(value: number, digits: number, language: string): string {
  return value.toLocaleString(localeOf(language), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** A radius as the legend prints it: metres below a kilometre, one decimal
 *  below 100 km, whole kilometres beyond (as the ring captions did). */
export function formatRange(radiusM: number, language: string): string {
  if (!Number.isFinite(radiusM) || radiusM <= 0) return '—';
  const r = clampToGreatCircle(radiusM) as number;
  if (r < 1_000) return `${formatNumber(r, 0, language)} m`;
  const km = r / 1_000;
  return `${formatNumber(km, km < 100 ? 1 : 0, language)} km`;
}

/** Two significant figures, the precision a threshold is known to. */
function twoFigures(value: number, language: string): string {
  if (!(value > 0)) return '0';
  return Number(value.toPrecision(2)).toLocaleString(localeOf(language), {
    maximumFractionDigits: value >= 10 ? 0 : 1,
  });
}

/** Two significant figures, however small: the values below a display
 *  threshold (rule 1030 (2)). */
function sigFigures(value: number, language: string): string {
  if (!(value > 0)) return '0';
  return value.toLocaleString(localeOf(language), { maximumSignificantDigits: 2 });
}

// ---------------------------------------------------------------------------
// Colour
// ---------------------------------------------------------------------------

/** ColorBrewer YlOrRd from its fourth class: the pale end is 0.5 psi. */
export const OVERPRESSURE_PALETTE = [
  '#fed976',
  '#feb24c',
  '#fd8d3c',
  '#fc4e2a',
  '#e31a1c',
  '#bd0026',
  '#800026',
] as const;
/** Air in motion: deep blue to white. */
export const WIND_PALETTE = [
  '#123a6b',
  '#1f5f99',
  '#2b86c0',
  '#3fb0d6',
  '#78d2df',
  '#bfeee8',
  '#f3fcf8',
] as const;
/** The upper part of matplotlib's inferno: the hottest is the brightest. */
export const THERMAL_PALETTE = [
  '#6a176e',
  '#932667',
  '#bc3754',
  '#dd513a',
  '#f37819',
  '#fca50a',
  '#f6d746',
  '#fcffa4',
] as const;
/** Deposit: thin and pale to thick and dark. */
export const EJECTA_PALETTE = [
  '#fff3c4',
  '#f7d58b',
  '#eab35a',
  '#d98b3a',
  '#bf6a2a',
  '#9a4c1d',
  '#6e3514',
] as const;
/** viridis, for a probability. */
export const PROBABILITY_PALETTE = [
  '#440154',
  '#482878',
  '#3e4989',
  '#31688e',
  '#26828e',
  '#1f9e89',
  '#35b779',
  '#6ece58',
  '#b5de2b',
  '#fde725',
] as const;
export const AGREEMENT_ALL = '#e6550d';
export const AGREEMENT_SOME = '#fdae6b';

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function rampColor(palette: readonly string[], t: number): [number, number, number] {
  const x = Math.min(1, Math.max(0, t)) * (palette.length - 1);
  const i = Math.min(palette.length - 2, Math.floor(x));
  const u = x - i;
  const a = hexToRgb(palette[i] ?? '#000000');
  const b = hexToRgb(palette[i + 1] ?? '#000000');
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
}

/** A field coloured on a log scale from `lo` (where it starts being drawn)
 *  to `hi` (where the scale stops), more opaque where stronger. */
function logColor(
  palette: readonly string[],
  value: number,
  lo: number,
  hi: number
): readonly [number, number, number, number] | null {
  if (!(value >= lo)) return null;
  const t = Math.min(1, Math.log(value / lo) / Math.log(hi / lo));
  const [r, g, b] = rampColor(palette, t);
  return [r, g, b, Math.round(255 * (0.42 + 0.4 * t))];
}

function cssToRgba(css: string, alphaScale = 1): readonly [number, number, number, number] {
  const m = /rgba?\(([^)]+)\)/.exec(css);
  if (m === null) {
    const [r, g, b] = hexToRgb(css);
    return [r, g, b, Math.round(255 * alphaScale)];
  }
  const parts = (m[1] ?? '').split(',').map((p) => Number(p.trim()));
  return [
    parts[0] ?? 0,
    parts[1] ?? 0,
    parts[2] ?? 0,
    Math.round(255 * (parts[3] ?? 1) * alphaScale),
  ];
}

/** Where a state's words stand (rule 1030), the globe and the report alike: a
 *  little way into what they name — on a line, on it; in a band, just past the
 *  field's edge; in an area, just past its own. */
export function markLabelRadius(mark: StateMark): number {
  if (mark.state === 'modelLimit') return mark.fromM;
  if (mark.state === 'belowThreshold') return mark.fromM * Math.pow(mark.toM / mark.fromM, 0.06);
  return mark.fromM * 1.08;
}

/** Rule 1030 (2): the band's shading, one neutral veil on every layer, where
 *  it leaves the field's edge; it fades to nothing a decade out, so that its
 *  end reads as no edge. On the globe's dark ground it is white; on paper,
 *  where white does not show, a grey (rule 1037). */
export const BELOW_BAND_CSS = '#ffffff';
export const BELOW_BAND_PAPER_CSS = '#4a4a4a';
export const BELOW_BAND_ALPHA = 0.12;
/** Rule 1030 (4): the hatch of an area the model does not compute — a grey,
 *  never the colour of zero, which is no colour; darker on paper. */
export const NOT_MODELLED_CSS = '#cfcfcf';
export const NOT_MODELLED_PAPER_CSS = '#6f6f6f';

/** The ground a state's mark paints (rule 1030): the band's faint shading,
 *  the not-modelled area's hatch; a line paints none. */
export function markGroundField(
  mark: StateMark,
  tone: 'globe' | 'paper' = 'globe'
): GroundField | null {
  if (mark.state === 'modelLimit' || !(mark.toM > mark.fromM)) return null;
  if (mark.state === 'belowThreshold') {
    const [r, g, b] = cssToRgba(tone === 'paper' ? BELOW_BAND_PAPER_CSS : BELOW_BAND_CSS);
    const span = Math.log(mark.toM / mark.fromM);
    return {
      family: mark.family,
      minRangeM: mark.fromM,
      maxRangeM: mark.toM,
      holeM: mark.fromM,
      colorAt: (x) => {
        const u = Math.log(x / mark.fromM) / span;
        if (!(u >= 0 && u <= 1)) return null;
        return [r, g, b, Math.round(255 * BELOW_BAND_ALPHA * (1 - u))];
      },
    };
  }
  const grey = cssToRgba(tone === 'paper' ? NOT_MODELLED_PAPER_CSS : NOT_MODELLED_CSS, 0.45);
  return {
    family: mark.family,
    minRangeM: mark.fromM,
    // An oblique family's nominal radius can pass the antipode's distance:
    // the area runs on to cover it.
    maxRangeM: mark.toM * 1.5,
    holeM: mark.fromM,
    colorAt: () => grey,
    hatchedAt: () => true,
  };
}

// ---------------------------------------------------------------------------
// The layers
// ---------------------------------------------------------------------------

export function fieldSourceOf(result: ImpactScenarioResult): ImpactFieldSource {
  return {
    inputs: result.inputs,
    impactor: { kineticEnergy: result.impactor.kineticEnergy },
    entry: result.entry,
    radiantHeat: result.radiantHeat,
  };
}

/** Every family of the result, as the model's own asymmetry records give it. */
export function familyShapes(result: ImpactScenarioResult): Record<FamilyId, FamilyShape> {
  const a = result.damageAsymmetry;
  const d = result.damage;
  const heatRadius = Math.max(d.thirdDegreeBurn, d.secondDegreeBurn);
  return {
    blast: familyShape(a.lightDamage, d.lightDamage),
    heat: familyShape(
      heatRadius === d.thirdDegreeBurn ? a.thirdDegreeBurn : a.secondDegreeBurn,
      heatRadius
    ),
    ejecta: familyShape(a.ejectaBlanket, result.ejecta.blanketEdge1mm),
    crater: familyShape(a.craterRim, d.craterRim),
    circle: CIRCLE_SHAPE,
  };
}

const PSI = [
  { key: 'overpressure5psi', threshold: OVERPRESSURE_BUILDING_COLLAPSE as number, psi: 5 },
  { key: 'overpressure1psi', threshold: OVERPRESSURE_WINDOW_BREAK as number, psi: 1 },
  { key: 'lightDamage', threshold: OVERPRESSURE_LIGHT_DAMAGE as number, psi: 0.5 },
] as const;

/** The winds the wind layer draws a line at (km/h). */
export const WIND_LEVELS_KMH = [100, 200, 300, 500, 1_000] as const;
/** Where the wind's scale stops (km/h): past it the colour saturates. */
const WIND_SCALE_TOP_KMH = 1_000;
/** Where the overpressure's scale stops (kPa). */
const OVERPRESSURE_SCALE_TOP_KPA = 1_000;
const CAL_PER_CM2 = 41_840;

/** Labels at bearings spread wherever two neighbours are closer than a
 *  quarter of their radius, so no two values print over each other. */
function spreadBearings(radii: readonly number[], base = 45): number[] {
  const order = radii.map((r, i) => ({ r, i })).sort((x, y) => x.r - y.r);
  const out: number[] = new Array<number>(radii.length).fill(base);
  const steps = [base, base - 32, base + 32, base - 64, base + 64];
  let run = 0;
  for (let k = 0; k < order.length; k++) {
    const here = order[k];
    const before = order[k - 1];
    if (here === undefined) continue;
    run = before !== undefined && here.r < before.r * 1.25 ? run + 1 : 0;
    out[here.i] = steps[run % steps.length] ?? base;
  }
  return out;
}

function withBearings(lines: Omit<MapIsoline, 'labelBearingDeg'>[]): MapIsoline[] {
  const bearings = spreadBearings(lines.map((l) => l.radiusM));
  return lines.map((l, i) => ({ ...l, labelBearingDeg: bearings[i] ?? 45 }));
}

function isCompleteAirburst(result: ImpactScenarioResult): boolean {
  return result.entry.regime === 'COMPLETE_AIRBURST';
}

function overpressureLayer(result: ImpactScenarioResult, ctx: ImpactMapContext): RawLayer | null {
  const { t, language } = ctx;
  const source = fieldSourceOf(result);
  const present = PSI.filter((p) => (result.damage[p.key] as number) > 0);
  if (present.length === 0) return null;
  const loKpa = (OVERPRESSURE_LIGHT_DAMAGE as number) / 1_000;
  const psiLabel = (psi: number): string => `${formatNumber(psi, psi < 1 ? 1 : 0, language)} psi`;
  const blastSource = t(
    isCompleteAirburst(result)
      ? 'globe.impactMap.source.airBlast'
      : 'globe.impactMap.source.groundBlast'
  );
  const isolines = withBearings(
    present.map((p) => ({
      id: `psi-${p.key}`,
      family: 'blast' as const,
      radiusM: result.damage[p.key],
      label: psiLabel(p.psi),
      title: t(`globe.ringLabel.${p.key}`),
      description: t('globe.impactMap.isoline.overpressure', {
        wind: formatNumber(programPeakWind(p.threshold) * 3.6, 0, language),
      }),
      source: blastSource,
    }))
  );
  const outer = Math.max(...present.map((p) => result.damage[p.key] as number));
  return {
    id: 'overpressure',
    tab: t('globe.impactMap.layer.overpressure.tab'),
    title: t('globe.impactMap.layer.overpressure.title'),
    unit: t('globe.impactMap.layer.overpressure.unit'),
    field: {
      family: 'blast',
      minRangeM: 1,
      maxRangeM: outer,
      colorAt: (r) =>
        logColor(
          OVERPRESSURE_PALETTE,
          impactOverpressureAt(source, r) / 1_000,
          loKpa,
          OVERPRESSURE_SCALE_TOP_KPA
        ),
    },
    below: {
      valueAt: (r) => impactOverpressureAt(source, r) / 1_000,
      scale: 'ratio',
      format: (v) => `${sigFigures(v, language)} kPa`,
    },
    isolines,
    colorbar: {
      palette: OVERPRESSURE_PALETTE,
      lo: Math.log10(loKpa),
      hi: Math.log10(OVERPRESSURE_SCALE_TOP_KPA),
      log: true,
      ticks: [10, 30, 100, 300, 1_000].map((v) => ({
        value: v,
        label: formatNumber(v, 0, language),
      })),
      marks: present.map((p) => ({
        value: p.threshold / 1_000,
        label: t(`globe.ringLabel.${p.key}`),
        detail: t('globe.impactMap.markWithWind', {
          range: formatRange(result.damage[p.key] as number, language),
          wind: formatNumber(programPeakWind(p.threshold) * 3.6, 0, language),
        }),
      })),
    },
    categories: [],
    notes: [
      {
        label: t('globe.impactMap.noteLabel.isolines'),
        text: t('globe.impactMap.note.isolinesMedian'),
      },
      {
        label: t('globe.impactMap.noteLabel.uncertainty'),
        text: t(
          isCompleteAirburst(result)
            ? 'globe.impactMap.note.bandAgreement'
            : 'globe.impactMap.note.bandSigma',
          {
            sigma: formatNumber((RING_RADIUS_SIGMA.overpressure5psi ?? 0) * 100, 0, language),
          }
        ),
      },
      { label: t('globe.impactMap.noteLabel.source'), text: blastSource },
      {
        label: t('globe.impactMap.noteLabel.limit'),
        text: t('globe.impactMap.note.belowLowestBlast'),
      },
    ],
  };
}

/** The wind the impact's blast sets moving, at a level (km/h): where it is
 *  still reached, on the field the blast is drawn from. */
export function windReachM(result: ImpactScenarioResult, kmh: number): number {
  const source = fieldSourceOf(result);
  const outer = Math.max(
    result.damage.lightDamage,
    result.damage.overpressure1psi,
    result.damage.overpressure5psi
  );
  if (!(outer > 0)) return 0;
  return impactFieldReach((r) => impactPeakWindAt(source, r), kmh / 3.6, 1, outer * 1.01);
}

function windLayer(result: ImpactScenarioResult, ctx: ImpactMapContext): RawLayer | null {
  const { t, language } = ctx;
  const source = fieldSourceOf(result);
  const outer = Math.max(
    result.damage.lightDamage,
    result.damage.overpressure1psi,
    result.damage.overpressure5psi
  );
  if (!(outer > 0)) return null;
  // Rule 947: a crater out of its law's domain has no radius; the wind's
  // levels are then read from the ground up, as for no crater.
  const crater = Number.isFinite(result.damage.craterRim) ? result.damage.craterRim : 0;
  const loKmh = programPeakWind(OVERPRESSURE_LIGHT_DAMAGE) * 3.6;
  const levels = WIND_LEVELS_KMH.map((kmh) => ({ kmh, r: windReachM(result, kmh) })).filter(
    (x) => x.r > Math.max(crater, 0) && x.r > 0
  );
  const windSource = t('globe.impactMap.source.wind');
  return {
    id: 'wind',
    tab: t('globe.impactMap.layer.wind.tab'),
    title: t('globe.impactMap.layer.wind.title'),
    unit: t('globe.impactMap.layer.wind.unit'),
    field: {
      family: 'blast',
      minRangeM: 1,
      maxRangeM: outer,
      colorAt: (r) =>
        logColor(WIND_PALETTE, impactPeakWindAt(source, r) * 3.6, loKmh, WIND_SCALE_TOP_KMH),
    },
    below: {
      valueAt: (r) => impactPeakWindAt(source, r) * 3.6,
      scale: 'ratio',
      format: (v) => `${sigFigures(v, language)} km/h`,
    },
    isolines: withBearings(
      levels.map((x) => ({
        id: `wind-${x.kmh.toString()}`,
        family: 'blast' as const,
        radiusM: x.r,
        label: `${formatNumber(x.kmh, 0, language)} km/h`,
        title: t('globe.impactMap.isoline.windTitle', { value: formatNumber(x.kmh, 0, language) }),
        description: t('globe.impactMap.isoline.wind'),
        source: windSource,
      }))
    ),
    colorbar: {
      palette: WIND_PALETTE,
      lo: Math.log10(loKmh),
      hi: Math.log10(WIND_SCALE_TOP_KMH),
      log: true,
      ticks: [50, 100, 200, 500, 1_000].map((v) => ({
        value: v,
        label: formatNumber(v, 0, language),
      })),
      marks: levels.map((x) => ({
        value: x.kmh,
        label: `${formatNumber(x.kmh, 0, language)} km/h`,
        detail: formatRange(x.r, language),
      })),
    },
    categories: [],
    notes: [
      { label: t('globe.impactMap.noteLabel.what'), text: t('globe.impactMap.note.windWhat') },
      { label: t('globe.impactMap.noteLabel.source'), text: windSource },
      {
        label: t('globe.impactMap.noteLabel.uncertainty'),
        text: t(
          isCompleteAirburst(result)
            ? 'globe.impactMap.note.bandAgreement'
            : 'globe.impactMap.note.bandSigma',
          {
            sigma: formatNumber((RING_RADIUS_SIGMA.overpressure5psi ?? 0) * 100, 0, language),
          }
        ),
      },
      { label: t('globe.impactMap.noteLabel.limit'), text: t('globe.impactMap.note.windLimit') },
    ],
  };
}

function thermalLayer(result: ImpactScenarioResult, ctx: ImpactMapContext): RawLayer | null {
  const { t, language } = ctx;
  const source = fieldSourceOf(result);
  const rings = [
    { key: 'massFire', radius: result.firestorm.sustainRadius as number },
    { key: 'fireIgnition', radius: result.firestorm.ignitionRadius as number },
    { key: 'thirdDegreeBurn', radius: result.damage.thirdDegreeBurn as number },
    { key: 'secondDegreeBurn', radius: result.damage.secondDegreeBurn as number },
  ].filter((x) => x.radius > 0);
  if (rings.length === 0) return null;
  // Each line's value is the field at the line: the threshold it stands at.
  const withValue = rings.map((x) => ({ ...x, q: impactThermalExposureAt(source, x.radius) }));
  const lowest = Math.min(...withValue.map((x) => x.q));
  const horizon = thermalHorizonRadius(impactFireballRadius(J(result.impactor.kineticEnergy)));
  const outer = Math.max(...rings.map((x) => x.radius));
  const top = lowest * 30;
  const thermalSource = t('globe.impactMap.source.thermal');
  return {
    id: 'thermal',
    tab: t('globe.impactMap.layer.thermal.tab'),
    title: t('globe.impactMap.layer.thermal.title'),
    unit: t('globe.impactMap.layer.thermal.unit'),
    field: {
      family: 'heat',
      minRangeM: 1,
      maxRangeM: outer,
      colorAt: (r) =>
        horizon > 0 && r > horizon
          ? null
          : logColor(THERMAL_PALETTE, impactThermalExposureAt(source, r), lowest, top),
    },
    below: {
      valueAt: (r) => impactThermalExposureAt(source, r) / CAL_PER_CM2,
      scale: 'ratio',
      format: (v) => `${sigFigures(v, language)} cal/cm²`,
    },
    isolines: withBearings(
      withValue.map((x) => ({
        id: `heat-${x.key}`,
        family: 'heat' as const,
        radiusM: x.radius,
        label: twoFigures(x.q / CAL_PER_CM2, language),
        title: t(`globe.ringLabel.${x.key}`),
        description: t('globe.impactMap.isoline.thermal', {
          value: twoFigures(x.q / CAL_PER_CM2, language),
        }),
        source: thermalSource,
      }))
    ),
    colorbar: {
      palette: THERMAL_PALETTE,
      lo: Math.log10(lowest / 1_000),
      hi: Math.log10(top / 1_000),
      log: true,
      ticks: [lowest, lowest * 3, lowest * 10, lowest * 30].map((v) => ({
        value: v / 1_000,
        label: formatNumber(Number((v / 1_000).toPrecision(2)), 0, language),
      })),
      marks: withValue.map((x) => ({
        value: x.q / 1_000,
        label: `${twoFigures(x.q / CAL_PER_CM2, language)} · ${t(`globe.ringLabel.${x.key}`)}`,
        detail: formatRange(x.radius, language),
      })),
    },
    categories: [],
    notes: [
      {
        label: t('globe.impactMap.noteLabel.isolines'),
        text: t('globe.impactMap.note.isolinesThermal'),
      },
      {
        label: t('globe.impactMap.noteLabel.uncertainty'),
        text: t('globe.impactMap.note.bandSigma', {
          sigma: formatNumber((RING_RADIUS_SIGMA.thirdDegreeBurn ?? 0) * 100, 0, language),
        }),
      },
      { label: t('globe.impactMap.noteLabel.source'), text: thermalSource },
      { label: t('globe.impactMap.noteLabel.limit'), text: t('globe.impactMap.note.thermalLimit') },
    ],
  };
}

/** The thicknesses the ejecta layer draws a line at (m). */
export const EJECTA_LEVELS_M = [1, 0.1, 0.01, 0.001] as const;

function ejectaLayer(result: ImpactScenarioResult, ctx: ImpactMapContext): RawLayer | null {
  const { t, language } = ctx;
  const edge = result.ejecta.blanketEdge1mm as number;
  if (!(edge > 0)) return null;
  const dtc = result.crater.transientDiameter;
  const rim = m((result.crater.finalDiameter as number) / 2);
  const thickLabel = (th: number): string =>
    th >= 1
      ? `${formatNumber(th, 0, language)} m`
      : th >= 0.01
        ? `${formatNumber(th * 100, 0, language)} cm`
        : `${formatNumber(th * 1_000, 0, language)} mm`;
  const levels = EJECTA_LEVELS_M.map((th) => ({
    th,
    // The 1 mm edge is the one the result publishes; the others are the same
    // law at their own thickness.
    r: th === 0.001 ? edge : (ejectaBlanketOuterEdge(dtc, rim, m(th)) as number),
  })).filter((x) => x.r > 0);
  const ejectaSource = t('globe.impactMap.source.ejecta');
  return {
    id: 'ejecta',
    tab: t('globe.impactMap.layer.ejecta.tab'),
    title: t('globe.impactMap.layer.ejecta.title'),
    unit: t('globe.impactMap.layer.ejecta.unit'),
    field: {
      family: 'ejecta',
      minRangeM: 1,
      maxRangeM: edge,
      colorAt: (r) => logColor(EJECTA_PALETTE, ejectaThickness(m(r), dtc, rim), 0.001, 10),
    },
    // Rule 1031 (b): past the 1 mm isopach the law goes on thinning, but a
    // deposit there may be under a millimetre or beyond what this scale
    // resolves — never said to "continue".
    below: {
      valueAt: (r) => ejectaThickness(m(r), dtc, rim),
      scale: 'ratio',
      format: (v) => `${sigFigures(v * 1_000, language)} mm`,
      label: t('globe.impactMap.mark.label.belowThresholdEjecta'),
    },
    isolines: withBearings(
      levels.map((x) => ({
        id: `ejecta-${x.th.toString()}`,
        family: 'ejecta' as const,
        radiusM: x.r,
        label: thickLabel(x.th),
        title: t('globe.impactMap.isoline.ejectaTitle', { value: thickLabel(x.th) }),
        description: t('globe.impactMap.isoline.ejecta'),
        source: ejectaSource,
      }))
    ),
    colorbar: {
      palette: EJECTA_PALETTE,
      lo: -3,
      hi: 1,
      log: true,
      ticks: [0.001, 0.01, 0.1, 1, 10].map((v) => ({ value: v, label: thickLabel(v) })),
      marks: levels.map((x) => ({
        value: x.th,
        label: x.th === 0.001 ? t('globe.impactMap.ejectaEdge') : thickLabel(x.th),
        detail: formatRange(x.r, language),
      })),
    },
    categories: [],
    notes: [
      {
        label: t('globe.impactMap.noteLabel.isolines'),
        text: t('globe.impactMap.note.isolinesEjecta'),
      },
      {
        label: t('globe.impactMap.noteLabel.uncertainty'),
        text: t('globe.impactMap.note.bandSigma', {
          sigma: formatNumber((RING_RADIUS_SIGMA.ejectaBlanket ?? 0) * 100, 0, language),
        }),
      },
      { label: t('globe.impactMap.noteLabel.source'), text: ejectaSource },
      { label: t('globe.impactMap.noteLabel.shown'), text: t('globe.impactMap.note.ejectaShown') },
      { label: t('globe.impactMap.noteLabel.limit'), text: t('globe.impactMap.note.ejectaInside') },
    ],
  };
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'] as const;
const romanOf = (level: string): number => ROMAN.indexOf(level as (typeof ROMAN)[number]) + 1;

/** The program's shaking levels an impact reaches, and their radii (m). */
export function shakingLevels(
  result: ImpactScenarioResult
): { mercalli: string; radiusM: number; lowM: number; highM: number }[] {
  const M = result.seismic.magnitude;
  if (M === null) return [];
  const range = result.seismic.magnitudeRange;
  return PROGRAM_SHAKING_LEVELS.map((level) => ({
    mercalli: level.mercalli,
    radiusM: clampToGreatCircle(programShakingRadiusKm(M, level.magnitude) * 1_000),
    lowM:
      range === null
        ? 0
        : (clampToGreatCircle(
            programShakingRadiusKm(range.low, level.magnitude) * 1_000
          ) as number),
    highM:
      range === null
        ? 0
        : (clampToGreatCircle(
            programShakingRadiusKm(range.high, level.magnitude) * 1_000
          ) as number),
  })).filter((x) => x.radiusM > 0);
}

/** The band of the earthquake map's palette a Mercalli level falls in, as
 *  the earthquakes are painted; below V nothing is filled (shakingOverlay). */
function intensityBandCss(level: number): string | null {
  let chosen: string | null = null;
  for (const band of INTENSITY_BANDS) if (level >= band.minValue) chosen = band.css;
  return chosen;
}

function shakingLayer(result: ImpactScenarioResult, ctx: ImpactMapContext): RawLayer | null {
  const { t, language } = ctx;
  const levels = shakingLevels(result);
  if (levels.length === 0) return null;
  const M = result.seismic.magnitude ?? 0;
  const range = result.seismic.magnitudeRange;
  const spread = range !== null && range.high - range.low > 1e-6;
  const air =
    result.seismic.magnitudeSource === 'air' || result.seismic.magnitudeSource === 'ground';
  const liquefaction = result.seismic.liquefactionRadius as number;
  // A zone runs from its level's line in to the next level's.
  const zones = [...levels].sort((a, b) => a.radiusM - b.radiusM);
  const colorOfZone = (r: number): readonly [number, number, number, number] | null => {
    for (const z of zones) {
      if (r <= z.radiusM) {
        const css = intensityBandCss(romanOf(z.mercalli));
        return css === null ? null : cssToRgba(css);
      }
    }
    return null;
  };
  const shakeSource = t('globe.impactMap.source.shaking');
  const lines: Omit<MapIsoline, 'labelBearingDeg'>[] = levels.map((x) => ({
    id: `mercalli-${x.mercalli}`,
    family: 'circle' as const,
    radiusM: x.radiusM,
    label: x.mercalli,
    title: t('globe.impactMap.isoline.mercalliTitle', { level: x.mercalli }),
    description: spread
      ? t('globe.impactMap.isoline.mercalliSpread', {
          low: formatRange(x.lowM, language),
          high: formatRange(x.highM, language),
        })
      : t('globe.impactMap.isoline.mercalli'),
    source: shakeSource,
  }));
  if (liquefaction > 0) {
    lines.push({
      id: 'liquefaction',
      family: 'circle',
      radiusM: liquefaction,
      label: t('globe.impactMap.liquefactionLabel'),
      title: t('globe.impactMap.isoline.liquefactionTitle'),
      description: t('globe.impactMap.isoline.liquefaction'),
      source: t('globe.impactMap.source.liquefaction'),
    });
  }
  const notes = [
    {
      label: t('globe.impactMap.noteLabel.magnitude'),
      text: air
        ? t('globe.impactMap.note.magnitudeAir', { m: formatNumber(M, 1, language) })
        : spread
          ? t('globe.impactMap.note.magnitudeSpread', {
              m: formatNumber(M, 1, language),
              low: formatNumber(range.low, 1, language),
              high: formatNumber(range.high, 1, language),
            })
          : t('globe.impactMap.note.magnitude', { m: formatNumber(M, 1, language) }),
    },
    { label: t('globe.impactMap.noteLabel.source'), text: shakeSource },
    {
      label: t('globe.impactMap.noteLabel.liquefaction'),
      text:
        liquefaction > 0
          ? t('globe.impactMap.note.liquefactionReach', {
              range: formatRange(liquefaction, language),
            })
          : t('globe.impactMap.note.liquefactionNone'),
    },
    { label: t('globe.impactMap.noteLabel.limit'), text: t('globe.impactMap.note.shakingBelowV') },
  ];
  if (isCompleteAirburst(result)) {
    notes.push({
      label: t('globe.impactMap.noteLabel.caveat'),
      text: t('globe.impactMap.note.shakingAirburst'),
    });
  }
  // A zone holds the intensities from its own level up to the one below the
  // level just inside it — or, innermost, below the next level the program
  // draws, which this impact does not reach. Listed from the strongest out.
  const programLevels = PROGRAM_SHAKING_LEVELS.map((l) => romanOf(l.mercalli));
  const categories: CategoryKey[] = [];
  for (let i = 0; i < zones.length; i++) {
    const z = zones[i];
    if (z === undefined) continue;
    const level = romanOf(z.mercalli);
    const inner = zones[i - 1];
    const nextDrawn = programLevels.find((l) => l > level) ?? 13;
    const top = inner !== undefined ? romanOf(inner.mercalli) - 1 : nextDrawn - 1;
    const css = intensityBandCss(level);
    categories.push({
      color: css ?? 'transparent',
      hatched: false,
      label: t(css === null ? 'globe.impactMap.shakingZoneLine' : 'globe.impactMap.shakingZone', {
        levels: top > level ? `${z.mercalli}–${ROMAN[top - 1] ?? ''}` : z.mercalli,
        range: formatRange(z.radiusM, language),
      }),
    });
  }
  return {
    id: 'shaking',
    tab: t('globe.impactMap.layer.shaking.tab'),
    title: t('globe.impactMap.layer.shaking.title'),
    unit: t('globe.impactMap.layer.shaking.unit'),
    field: {
      family: 'circle',
      minRangeM: 1,
      maxRangeM: Math.max(...levels.map((x) => x.radiusM)),
      colorAt: colorOfZone,
    },
    // Past III the program's effective magnitude goes on falling: a decade of
    // ground motion is one unit of it.
    below: {
      valueAt: (r) => M - programSeismicAttenuation(r / 1_000),
      scale: 'magnitude',
      format: (v) =>
        t('globe.impactMap.mark.effectiveMagnitude', { m: formatNumber(v, 1, language) }),
    },
    isolines: withBearings(lines),
    colorbar: null,
    categories,
    notes,
  };
}

/** Every threshold the uncertainty view can read for this result. */
export function uncertaintyChoices(
  result: ImpactScenarioResult,
  ctx: ImpactMapContext
): UncertaintyChoice[] {
  const { t, language } = ctx;
  const out: UncertaintyChoice[] = [];
  const airburst = isCompleteAirburst(result);
  const band = result.airburstBand;
  for (const p of PSI) {
    const median = result.damage[p.key] as number;
    if (!(median > 0)) continue;
    const label = `${formatNumber(p.psi, p.psi < 1 ? 1 : 0, language)} psi`;
    if (airburst && band !== null) {
      out.push({
        key: p.key,
        label,
        kind: 'agreement',
        family: 'blast',
        medianM: median,
        lowM: band[p.key].low,
        highM: band[p.key].high,
      });
    } else {
      const sigma = RING_RADIUS_SIGMA[p.key];
      out.push({
        key: p.key,
        label,
        kind: 'probability',
        family: 'blast',
        medianM: median,
        ...(sigma === undefined ? { unavailable: t('globe.impactMap.noBand') } : { sigma }),
      });
    }
  }
  for (const kmh of airburst ? [100, 200] : [200]) {
    const median = windReachM(result, kmh);
    if (!(median > 0)) continue;
    const label = t('globe.impactMap.windChoice', { value: formatNumber(kmh, 0, language) });
    if (airburst) {
      // Rule 706's band read at the overpressure this wind needs, the same
      // function the blast rings' band is (airburstBlastBand), held about the
      // line as the product holds it about a ring.
      const b = airburstBlastBand(
        Pa(programOverpressureForWind(kmh / 3.6)),
        result.entry.burstAltitude,
        J(Math.max(result.entry.blastYieldMegatons * 4.184e15, 0))
      );
      out.push({
        key: `wind${kmh.toString()}`,
        label,
        kind: 'agreement',
        family: 'blast',
        medianM: median,
        lowM: Math.min(b.low, median),
        highM: Math.max(b.high, median),
      });
    } else {
      out.push({
        key: `wind${kmh.toString()}`,
        label,
        kind: 'probability',
        family: 'blast',
        medianM: median,
        sigma: RING_RADIUS_SIGMA.overpressure5psi ?? 0.18,
      });
    }
  }
  const sigmaRing = (key: string, radius: number, family: FamilyId): void => {
    if (!(radius > 0)) return;
    const sigma = RING_RADIUS_SIGMA[key];
    out.push({
      key,
      label: t(`globe.impactMap.choice.${key}`),
      kind: 'probability',
      family,
      medianM: radius,
      ...(sigma === undefined ? { unavailable: t('globe.impactMap.noBand') } : { sigma }),
    });
  };
  sigmaRing('thirdDegreeBurn', result.damage.thirdDegreeBurn, 'heat');
  sigmaRing('secondDegreeBurn', result.damage.secondDegreeBurn, 'heat');
  sigmaRing('massFire', result.firestorm.sustainRadius, 'heat');
  sigmaRing('fireIgnition', result.firestorm.ignitionRadius, 'heat');
  sigmaRing('ejectaBlanket', result.ejecta.blanketEdge1mm, 'ejecta');
  return out;
}

const Z90 = 1.2815515655446004;
/** The probability the uncertainty view paints down to, and the standard
 *  normal's quantile at 98 %, where a lognormal radius falls to it. */
const PROBABILITY_FLOOR = 0.02;
const Z98 = 2.053748910631823;

/** The standard normal distribution function (Abramowitz & Stegun 7.1.26). */
function normalCdf(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const k = 1 / (1 + 0.3275911 * x);
  const erf =
    1 -
    ((((1.061405429 * k - 1.453152027) * k + 1.421413741) * k - 0.284496736) * k + 0.254829592) *
      k *
      Math.exp(-x * x);
  return 0.5 * (1 + (z < 0 ? -erf : erf));
}

/** Where a threshold is exceeded with probability p, for a radius scattered
 *  lognormally with the published 1σ: R · exp(±z σ_ln), σ_ln = ln(1 + σ). */
export function probabilityRadius(medianM: number, sigma: number, p: number): number {
  const sl = Math.log(1 + sigma);
  const z = p === 0.9 ? -Z90 : p === 0.1 ? Z90 : 0;
  return medianM * Math.exp(z * sl);
}

function uncertaintyLayer(result: ImpactScenarioResult, ctx: ImpactMapContext): RawLayer | null {
  const { t, language } = ctx;
  const choices = uncertaintyChoices(result, ctx);
  const usable = choices.filter((c) => c.unavailable === undefined);
  if (usable.length === 0) return null;
  const selected = usable.find((c) => c.key === ctx.uncertaintyKey) ?? usable[0] ?? null;
  const agreementTab = isCompleteAirburst(result);
  const base = {
    id: 'uncertainty' as const,
    tab: t(
      agreementTab ? 'globe.impactMap.layer.agreement.tab' : 'globe.impactMap.layer.probability.tab'
    ),
    uncertainty: { choices, selected },
  };
  if (selected === null) return null;
  if (selected.kind === 'probability') {
    const sigma = selected.sigma ?? 0;
    const sl = Math.log(1 + sigma);
    const levels = [0.9, 0.5, 0.1].map((p) => ({
      p,
      r: probabilityRadius(selected.medianM, sigma, p),
    }));
    return {
      ...base,
      title: t('globe.impactMap.layer.probability.title', { threshold: selected.label }),
      unit: t('globe.impactMap.layer.probability.unit'),
      field: {
        family: selected.family,
        minRangeM: 1,
        // Painted down to 2 %: there is the field's edge (rule 1032 (b)).
        maxRangeM: selected.medianM * Math.exp(Z98 * sl),
        colorAt: (r) => {
          const p = normalCdf(-Math.log(r / selected.medianM) / sl);
          if (p < PROBABILITY_FLOOR) return null;
          const [cr, cg, cb] = rampColor(PROBABILITY_PALETTE, p);
          return [cr, cg, cb, Math.round(255 * 0.74 * Math.pow(p, 0.55))];
        },
      },
      isolines: withBearings(
        levels.map((x) => ({
          id: `probability-${Math.round(x.p * 100).toString()}`,
          family: selected.family,
          radiusM: x.r,
          label: `${formatNumber(x.p * 100, 0, language)} %`,
          title: t('globe.impactMap.isoline.probabilityTitle', {
            p: formatNumber(x.p * 100, 0, language),
            threshold: selected.label,
          }),
          description: t('globe.impactMap.isoline.probability', {
            sigma: formatNumber(sigma * 100, 0, language),
          }),
          source: t('globe.impactMap.source.probability'),
        }))
      ),
      below: {
        valueAt: (r) => normalCdf(-Math.log(r / selected.medianM) / sl),
        scale: 'ratio',
        format: (v) => `${sigFigures(v * 100, language)} %`,
      },
      colorbar: {
        palette: PROBABILITY_PALETTE,
        lo: 0,
        hi: 1,
        log: false,
        ticks: [0, 0.25, 0.5, 0.75, 1].map((v) => ({
          value: v,
          label: `${formatNumber(v * 100, 0, language)} %`,
        })),
        marks: levels.map((x) => ({
          value: x.p,
          label: t(
            x.p === 0.5 ? 'globe.impactMap.probabilityMedian' : 'globe.impactMap.probabilityLevel',
            {
              p: formatNumber(x.p * 100, 0, language),
            }
          ),
          detail: t('globe.impactMap.upTo', { range: formatRange(x.r, language) }),
        })),
      },
      categories: [],
      notes: [
        {
          label: t('globe.impactMap.noteLabel.from'),
          text: t('globe.impactMap.note.probabilityFrom', {
            sigma: formatNumber(sigma * 100, 0, language),
          }),
        },
        {
          label: t('globe.impactMap.noteLabel.isolines'),
          text: t('globe.impactMap.note.probabilityIsolines'),
        },
      ],
    };
  }
  const low = selected.lowM ?? selected.medianM;
  const high = selected.highM ?? selected.medianM;
  const allColor = cssToRgba(AGREEMENT_ALL, 0.55);
  const someColor = cssToRgba(AGREEMENT_SOME, 0.9);
  return {
    ...base,
    title: t('globe.impactMap.layer.agreement.title', { threshold: selected.label }),
    unit: t('globe.impactMap.layer.agreement.unit'),
    field: {
      family: selected.family,
      minRangeM: 1,
      maxRangeM: Math.max(high, selected.medianM),
      colorAt: (r) => (r <= low ? allColor : r <= high ? someColor : null),
      hatchedAt: (r) => r > low && r <= high,
    },
    // Past the band's upper edge not even that edge passes the threshold: a
    // computed no.
    beyond: 'computedZero',
    isolines: withBearings([
      {
        id: 'agreement-median',
        family: selected.family,
        radiusM: selected.medianM,
        label: selected.label,
        title: t('globe.impactMap.isoline.agreementTitle', { threshold: selected.label }),
        description: t('globe.impactMap.isoline.agreement'),
        source: t('globe.impactMap.source.agreement'),
      },
    ]),
    colorbar: null,
    categories: [
      {
        color: AGREEMENT_ALL,
        hatched: false,
        label: t('globe.impactMap.agreementAll', {
          range: low > 0 ? formatRange(low, language) : '—',
        }),
      },
      {
        color: AGREEMENT_SOME,
        hatched: true,
        label: t('globe.impactMap.agreementSome', { range: formatRange(high, language) }),
      },
    ],
    notes: [
      {
        label: t('globe.impactMap.noteLabel.reading'),
        text:
          low > 0
            ? t('globe.impactMap.note.agreementReading', {
                low: formatRange(low, language),
                high: formatRange(high, language),
              })
            : t('globe.impactMap.note.agreementNowhere', { high: formatRange(high, language) }),
      },
      { label: t('globe.impactMap.noteLabel.not'), text: t('globe.impactMap.note.agreementNot') },
    ],
  };
}

/** The veil's colour map in the legend, from its foot to its top, as the
 *  heatmap paints it (`heatmapColorAt`): the bar is logarithmic, so each of
 *  its stops is sampled at its own height. */
function veilPalette(top: number): string[] {
  const hex = (c: number): string => Math.round(c).toString(16).padStart(2, '0');
  return Array.from({ length: 17 }, (_, i) => {
    const height = 10 ** ((i / 16) * Math.log10(top));
    const [r, g, b] = heatmapColorAt(height, 1, top, 'waveVeil', 'sqrt');
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  });
}

/**
 * The wave, where the impact raises one (Andrea's choice of 22 September
 * 2026): a layer of its own in the map's tabs, which takes the field off the
 * globe so that the wave map the globe has always drawn is seen as it was
 * before the field covered it. What is drawn is that map's, untouched; this
 * layer names what it has drawn (`ctx.waveMap`) and says where it comes from.
 */
function tsunamiLayer(result: ImpactScenarioResult, ctx: ImpactMapContext): RawLayer | null {
  const wave = result.tsunami;
  if (wave === undefined) return unsizedWaveLayer(result, ctx);
  const { t, language } = ctx;
  const drawn = ctx.waveMap ?? null;
  const metres = (v: number, digits: number): string => `${formatNumber(v, digits, language)} m`;
  const source = wave.rimWaveSourceAmplitude as number;
  const onLand = ((result.inputs.shoreDistance as number | undefined) ?? 0) > 0;
  const depth = (result.inputs.waterDepth as number | undefined) ?? 0;
  const top = drawn?.veilTop ?? null;
  const colorbar: ColorbarSpec | null =
    top === null
      ? null
      : {
          palette: veilPalette(top),
          lo: 0,
          hi: Math.log10(top),
          log: true,
          ticks: [1, 3, 6, 10, ...(top >= 20 ? [top] : [])]
            .filter((h) => h <= top)
            .map((h) => ({ value: h, label: metres(h, 0) })),
          marks: [],
        };
  const categories: CategoryKey[] =
    drawn === null
      ? []
      : [
          ...drawn.contours.map((c) => ({
            color: c.css,
            hatched: false,
            shape: 'line' as const,
            label: t('globe.impactMap.tsunamiContour', { height: metres(c.threshold, 0) }),
          })),
          ...(drawn.isochroneHours.length > 0
            ? [
                {
                  color: WAVE_ISOCHRONE_CSS,
                  hatched: false,
                  shape: 'dashed' as const,
                  label: t('globe.impactMap.tsunamiIsochrones', {
                    hours: drawn.isochroneHours.map((h) => `+${h.toString()} h`).join(' · '),
                  }),
                },
              ]
            : []),
          ...(drawn.crest
            ? [
                {
                  color: WAVE_CREST_CSS,
                  hatched: false,
                  shape: 'line' as const,
                  label: t('globe.impactMap.tsunamiCrest'),
                },
              ]
            : []),
          ...(drawn.streaks
            ? [
                {
                  color: WAVE_STREAK_CSS,
                  hatched: false,
                  shape: 'line' as const,
                  label: t('globe.impactMap.tsunamiStreaks'),
                },
              ]
            : []),
          ...drawn.runup.map((tier) => {
            const next = WAVE_RUNUP_TIERS.find((c) => c.from > tier.from);
            return {
              color: tier.css,
              hatched: false,
              shape: 'dot' as const,
              label:
                next === undefined
                  ? t('globe.impactMap.tsunamiRunupFrom', { height: metres(tier.from, 0) })
                  : t('globe.impactMap.tsunamiRunupBand', {
                      low: formatNumber(tier.from, 0, language),
                      high: metres(next.from, 0),
                    }),
            };
          }),
        ];
  return {
    id: 'tsunami',
    tab: t('globe.impactMap.layer.tsunami.tab'),
    title: t('globe.impactMap.layer.tsunami.title'),
    unit: t('globe.impactMap.layer.tsunami.unit'),
    field: null,
    isolines: [],
    colorbar,
    categories,
    notes: [
      {
        label: t('globe.impactMap.noteLabel.source'),
        text: t(
          wave.farFieldLaw === 'program'
            ? 'globe.impactMap.note.tsunamiSourceProgram'
            : 'globe.impactMap.note.tsunamiSourceRimWave',
          {
            amplitude: metres(source, source < 10 ? 2 : 0),
            // On land the water is the mean within the crater (rules 798 to
            // 804); at sea, the water under the point of impact.
            depth: onLand
              ? t(
                  depth >= SHORE_DEPTH_CAP_M
                    ? 'globe.impactMap.note.depthWithinCraterCapped'
                    : 'globe.impactMap.note.depthWithinCrater',
                  { depth: metres(depth, depth < 10 ? 2 : 0) }
                )
              : metres(depth, depth < 10 ? 2 : 0),
          }
        ),
      },
      {
        label: t('globe.impactMap.noteLabel.reading'),
        text:
          drawn === null
            ? ctx.waveUnpropagatedReachM !== undefined && ctx.waveUnpropagatedReachM !== null
              ? t('globe.impactMap.note.tsunamiNoSea', {
                  amplitude: metres(source, source < 10 ? 2 : 0),
                  reach: formatRange(ctx.waveUnpropagatedReachM, language),
                  floor: metres(DEFAULT_MIN_DEPTH_M, 0),
                })
              : t('globe.impactMap.note.tsunamiNothing')
            : top === null
              ? t('globe.impactMap.note.tsunamiLinesOnly')
              : t(
                  drawn.scope === 'global'
                    ? 'globe.impactMap.note.tsunamiVeilGlobal'
                    : 'globe.impactMap.note.tsunamiVeilLocal',
                  { top: metres(top, 0) }
                ),
      },
      {
        label: t('globe.impactMap.noteLabel.limit'),
        text: t(
          onLand ? 'globe.impactMap.note.tsunamiLimitLand' : 'globe.impactMap.note.tsunamiLimitSea'
        ),
      },
    ],
  };
}

/** B-119: isolines closer than this share of their radius are one line at
 *  the map's scale, and are drawn as one. */
export const COINCIDENT_SHARE = 0.005;

/**
 * The isolines of a layer as they can be drawn (B-119). A line that reaches
 * the antipode is no line — the zone it bounds is the whole Earth — so it is
 * named in the notes and not drawn; and lines of different thresholds that
 * fall within `COINCIDENT_SHARE` of their radius of each other are drawn as
 * one, labelled with every threshold, each kept at its own radius in
 * `members`, and the notes say which and why — on the fireball's horizon when
 * that is where they gather (`horizonM`). Until 22 September 2026 Chicxulub's
 * map drew the ignition of clothing, the third-degree and the second-degree
 * burns as three circles within 6 km of each other at 1 610 km.
 */
function settleIsolines(layer: RawLayer, ctx: ImpactMapContext, horizonM: number | null): RawLayer {
  if (layer.isolines.length === 0) return layer;
  const { t, language } = ctx;
  const halfEarth = Math.PI * (EARTH_RADIUS as number);
  const atAntipode = (r: number): boolean => r >= halfEarth * (1 - 1e-6);
  const whole = layer.isolines.filter((l) => atAntipode(l.radiusM));
  const kept = layer.isolines.filter((l) => !atAntipode(l.radiusM));
  const sorted = [...kept].sort((a, b) => a.radiusM - b.radiusM);
  const groups: MapIsoline[][] = [];
  for (const line of sorted) {
    const group = groups[groups.length - 1];
    const last = group?.[group.length - 1];
    if (
      group !== undefined &&
      last !== undefined &&
      line.radiusM - last.radiusM <= COINCIDENT_SHARE * line.radiusM
    ) {
      group.push(line);
    } else {
      groups.push([line]);
    }
  }
  const notes = [...layer.notes];
  // Each group is drawn once, where its first line stood: the order the
  // layer gave its lines is the order the legend and the report read.
  const drawnFor = new Map<MapIsoline, MapIsoline>();
  for (const group of groups) {
    const outer = group[group.length - 1];
    const inner = group[0];
    if (outer === undefined || inner === undefined) continue;
    const onHorizon =
      horizonM !== null &&
      horizonM > 0 &&
      Math.abs(outer.radiusM - horizonM) <= 2 * COINCIDENT_SHARE * horizonM;
    if (group.length === 1) {
      // Rule 1031 (a): a threshold pressed against the horizon is a callout.
      drawnFor.set(
        outer,
        onHorizon
          ? {
              ...outer,
              atLimit: t('globe.impactMap.mark.label.compressedOne', { value: outer.label }),
            }
          : outer
      );
      continue;
    }
    // A title may hold a «·» of its own; thresholds are told apart by «;».
    const titles = group.map((l) => l.title).join('; ');
    notes.push({
      label: t('globe.impactMap.noteLabel.coincide'),
      text: onHorizon
        ? t('globe.impactMap.note.coincideHorizon', {
            lines: titles,
            gap: formatRange(outer.radiusM - inner.radiusM, language),
            horizon: formatRange(horizonM, language),
          })
        : t('globe.impactMap.note.coincide', {
            lines: titles,
            gap: formatRange(outer.radiusM - inner.radiusM, language),
            range: formatRange(outer.radiusM, language),
          }),
    });
    const joined: MapIsoline = {
      ...outer,
      id: group.map((l) => l.id).join('+'),
      label: group.map((l) => l.label).join(' · '),
      title: titles,
      description: group.map((l) => `${l.title}: ${formatRange(l.radiusM, language)}`).join(' · '),
      members: group.map((l) => ({
        label: l.label,
        title: l.title,
        description: l.description,
        radiusM: l.radiusM,
      })),
      // Rule 1031 (a): thresholds merged at the horizon are one callout,
      // from the lowest (the outermost) to the highest.
      ...(onHorizon
        ? {
            atLimit: t('globe.impactMap.mark.label.compressed', {
              lo: outer.label,
              hi: inner.label,
            }),
          }
        : {}),
    };
    for (const l of group) drawnFor.set(l, joined);
  }
  const isolines: MapIsoline[] = [];
  for (const l of kept) {
    const drawn = drawnFor.get(l);
    if (drawn !== undefined && !isolines.includes(drawn)) isolines.push(drawn);
  }
  if (whole.length > 0) {
    notes.push({
      label: t('globe.impactMap.noteLabel.wholeEarth'),
      text: t('globe.impactMap.note.wholeEarth', { lines: whole.map((l) => l.title).join('; ') }),
    });
  }
  return { ...layer, isolines, notes };
}

/**
 * The tsunami's layer where the model raises no wave but the impact reaches
 * the sea another way (B-120): the final crater encloses the coast, so the
 * sea pours back into it, or the ejecta blanket falls on the coast. Neither
 * wave has a published law (rules 267 to 273), and the globe says so where
 * it used to say nothing: Chicxulub on Houston, whose crater swallows the
 * coast, and on Austin, where 44 m of rock fall into the Gulf, drew no tab.
 */
function unsizedWaveLayer(result: ImpactScenarioResult, ctx: ImpactMapContext): RawLayer | null {
  const shore = (result.inputs.shoreDistance as number | undefined) ?? 0;
  const transient = (result.crater.transientDiameter as number) / 2;
  const rim = (result.crater.finalDiameter as number) / 2;
  if (!(shore > 0) || !(transient > 0)) return null;
  const thickness = ejectaThickness(m(shore), result.crater.transientDiameter, m(rim)) as number;
  const encloses = rim >= shore;
  const blanket = thickness >= 0.001;
  if (!encloses && !blanket) return null;
  const { t, language } = ctx;
  const thick =
    thickness >= 1
      ? `${formatNumber(thickness, thickness < 10 ? 1 : 0, language)} m`
      : thickness >= 0.01
        ? `${formatNumber(thickness * 100, 0, language)} cm`
        : `${formatNumber(thickness * 1_000, 0, language)} mm`;
  const causes = [
    ...(encloses
      ? [t('globe.impactMap.note.unsizedResurge', { rim: formatRange(rim, language) })]
      : []),
    ...(blanket ? [t('globe.impactMap.note.unsizedEjecta', { thickness: thick })] : []),
  ].join('; ');
  return {
    id: 'tsunami',
    tab: t('globe.impactMap.layer.tsunami.tab'),
    title: t('globe.impactMap.layer.tsunami.title'),
    unit: t('globe.impactMap.layer.tsunami.unitUnsized'),
    field: null,
    isolines: [],
    colorbar: null,
    categories: [],
    notes: [
      {
        label: t('globe.impactMap.noteLabel.why'),
        text: t('globe.impactMap.note.tsunamiWhyNone', {
          crater: formatRange(transient, language),
          shore: formatRange(shore, language),
        }),
      },
      {
        label: t('globe.impactMap.noteLabel.limit'),
        text: t('globe.impactMap.note.tsunamiUnsized', { causes }),
      },
    ],
  };
}

/** The layers this result draws, in the order the legend offers them. */
export function availableImpactLayers(
  result: ImpactScenarioResult,
  ctx: ImpactMapContext
): ImpactMapLayer[] {
  return IMPACT_LAYER_ORDER.map((id) => buildImpactLayer(result, id, ctx)).filter(
    (layer): layer is ImpactMapLayer => layer !== null
  );
}

export function buildImpactLayer(
  result: ImpactScenarioResult,
  id: ImpactLayerId,
  ctx: ImpactMapContext
): ImpactMapLayer | null {
  const layer = buildRawLayer(result, id, ctx);
  if (layer === null) return null;
  const fireballHorizon =
    id === 'thermal'
      ? thermalHorizonRadius(impactFireballRadius(J(result.impactor.kineticEnergy)))
      : null;
  const horizon =
    fireballHorizon !== null && Number.isFinite(fireballHorizon) ? fireballHorizon : null;
  const { below, beyond, ...settled } = settleIsolines(layer, ctx, horizon);
  const evidence = layerEvidence(settled, ctx);
  const edge = layerEdge(settled, horizon, beyond);
  const card = layerCard(settled, evidence, edge, ctx);
  const marks = stateMarks(settled, below, edge, horizon, card, ctx);
  // Rule 1031 (a): where the heat stops at its horizon, what else heats the
  // ground beyond it is named, and said not to be in this layer.
  const notes =
    id === 'thermal' && marks.some((mk) => mk.state === 'notModelled')
      ? [
          ...settled.notes,
          {
            label: ctx.t('globe.impactMap.noteLabel.notModelled'),
            text: ctx.t('globe.impactMap.note.thermalNotModelled'),
          },
        ]
      : settled.notes;
  return {
    ...settled,
    notes,
    isolines: settled.isolines.map((l) => ({
      ...l,
      state: l.atLimit !== undefined ? ('modelLimit' as const) : ('computed' as const),
    })),
    evidence,
    state: 'computed',
    card,
    edge,
    marks,
  };
}

const ANTIPODE_M = Math.PI * (EARTH_RADIUS as number);

/** Rule 1032 (b): a field's edge — at the fireball's horizon a limit of the
 *  model, beyond which nothing is computed; at the antipode nothing lies
 *  beyond; otherwise the last isoline, below which the model goes on. */
function layerEdge(
  layer: RawLayer,
  horizon: number | null,
  beyond: BeyondEdge | undefined
): LayerEdge | null {
  const field = layer.field;
  if (field === null || !(field.maxRangeM > 0)) return null;
  const atM = field.maxRangeM;
  if (atM >= ANTIPODE_M * 0.999) return { atM, beyond: 'notApplicable', kind: 'modelLimit' };
  if (horizon !== null && horizon > 0 && atM >= horizon * 0.995)
    return { atM, beyond: 'notModelled', kind: 'modelLimit' };
  return { atM, beyond: beyond ?? 'belowThreshold', kind: 'lastIsoline' };
}

/** Where the globe writes each state's words: south, clear of the values,
 *  which stand between 19° west of north and 109° (`spreadBearings`), and of
 *  the legend and the panel at the screen's sides. */
const MARK_BEARING_DEG = { below: 150, limit: 195, notModelled: 170 } as const;

/**
 * Rule 1030 (2)–(4): what a layer draws past its edge. Past an ordinary last
 * edge, where the field goes on below its threshold, a faint band out to one
 * decade below the edge's value (`BELOW_THRESHOLD_DECADES`) or to the model's
 * limit, whichever comes first. Where the model stops — the fireball's direct
 * horizon — a line of the limit, and past it, to the antipode, an area it
 * does not compute. Each with its card; nothing here reads a number the layer
 * does not already give.
 */
function stateMarks(
  layer: RawLayer,
  below: BelowField | undefined,
  edge: LayerEdge | null,
  horizon: number | null,
  card: ProvenanceCard,
  ctx: ImpactMapContext
): StateMark[] {
  const field = layer.field;
  if (field === null || edge === null) return [];
  const { t, language } = ctx;
  const marks: StateMark[] = [];
  const past = (beyond: BeyondEdge): string =>
    `${t('globe.impactMap.card.beyond')}: ${t(`globe.impactMap.beyond.${beyond}`)}`;
  let limitM: number | null =
    edge.kind === 'modelLimit' && edge.beyond === 'notModelled' ? horizon : null;
  if (edge.kind === 'lastIsoline' && edge.beyond === 'belowThreshold' && below !== undefined) {
    const cap = horizon !== null && horizon > edge.atM ? Math.min(horizon, ANTIPODE_M) : ANTIPODE_M;
    const atEdge = below.valueAt(edge.atM);
    const floor =
      below.scale === 'magnitude'
        ? atEdge - BELOW_THRESHOLD_DECADES
        : atEdge / 10 ** BELOW_THRESHOLD_DECADES;
    const toM = atEdge > 0 && floor > 0 ? impactFieldReach(below.valueAt, floor, edge.atM, cap) : 0;
    if (toM > edge.atM * 1.001) {
      const cut = horizon !== null && cap === horizon && toM >= cap * (1 - 1e-6);
      marks.push({
        id: 'below',
        state: 'belowThreshold',
        family: field.family,
        fromM: edge.atM,
        toM,
        label: below.label ?? t('globe.impactMap.mark.label.belowThreshold'),
        labelBearingDeg: MARK_BEARING_DEG.below,
        description: past(cut ? 'notModelled' : 'belowThreshold'),
        card: {
          ...card,
          source: t('globe.impactMap.mark.source.below'),
          extent: t('globe.impactMap.mark.extent.below', {
            from: below.format(atEdge),
            to: below.format(below.valueAt(toM)),
            inner: formatRange(edge.atM, language),
            outer: formatRange(toM, language),
          }),
          beyond: cut ? 'notModelled' : 'belowThreshold',
        },
      });
      if (cut) limitM = horizon;
    }
  }
  if (limitM !== null) {
    const range = formatRange(limitM, language);
    const source = t(`globe.impactMap.mark.limitSource.${layer.id}`, { range });
    marks.push(
      {
        id: 'limit',
        state: 'modelLimit',
        family: field.family,
        fromM: limitM,
        toM: limitM,
        label: t('globe.impactMap.mark.label.modelLimit'),
        labelBearingDeg: MARK_BEARING_DEG.limit,
        description: past('notModelled'),
        card: {
          ...card,
          source,
          extent: t('globe.impactMap.mark.extent.limit', { range }),
          beyond: 'notModelled',
        },
      },
      {
        id: 'not-modelled',
        state: 'notModelled',
        family: field.family,
        fromM: limitM,
        toM: ANTIPODE_M,
        label: t(`globe.impactMap.mark.label.notModelled.${layer.id}`),
        labelBearingDeg: MARK_BEARING_DEG.notModelled,
        description: past('notApplicable'),
        card: {
          ...card,
          state: 'outOfDomain',
          source,
          extent: t('globe.impactMap.mark.extent.notModelled', { range }),
          beyond: 'notApplicable',
        },
      }
    );
  }
  return marks;
}

/** Rule 1029: a layer's provenance card. */
function layerCard(
  layer: RawLayer,
  evidence: LayerEvidence,
  edge: LayerEdge | null,
  ctx: ImpactMapContext
): ProvenanceCard {
  const { t, language } = ctx;
  const sourceLabel = t('globe.impactMap.noteLabel.source');
  const source = layer.notes.find((n) => n.label === sourceLabel)?.text ?? evidence.summary;
  // Each threshold at its own radius: a line joined for the map's scale
  // (B-119) stands for several.
  const byRadius = layer.isolines.flatMap(isolineMembers).sort((a, b) => b.radiusM - a.radiusM);
  const outer = byRadius[0];
  const inner = byRadius[byRadius.length - 1];
  const reach = (m: number): string =>
    `${(m / 1_000).toLocaleString(language, { maximumFractionDigits: m < 10_000 ? 1 : 0 })} km`;
  const extent =
    outer !== undefined && inner !== undefined
      ? outer.label === inner.label
        ? t('globe.impactMap.card.extentOne', {
            value: outer.label,
            reach: reach(edge?.atM ?? outer.radiusM),
          })
        : t('globe.impactMap.card.extentValue', {
            outer: outer.label,
            inner: inner.label,
            reach: reach(edge?.atM ?? outer.radiusM),
          })
      : layer.id === 'tsunami'
        ? t('globe.impactMap.card.extentWaveMap')
        : layer.categories.length > 0
          ? layer.categories.map((c) => c.label).join(' · ')
          : t('globe.impactMap.card.extentNone');
  const state: EpistemicState = evidence.klass === 'exploratory' ? 'exploratory' : 'verified';
  return {
    quantity: layer.title,
    unit: layer.unit,
    state,
    source,
    extent,
    beyond: edge?.beyond ?? 'notApplicable',
  };
}

/** Rule 1032 (c): a layer this result does not draw, and why. */
export interface LayerAbsence {
  id: ImpactLayerId;
  tab: string;
  beyond: BeyondEdge;
  why: string;
}

/** Rule 1032 (c): every layer the result does not draw, each with its reason —
 *  a tab is never simply missing. */
export function absentImpactLayers(
  result: ImpactScenarioResult,
  ctx: ImpactMapContext
): LayerAbsence[] {
  const { t, language } = ctx;
  const drawn = new Set(availableImpactLayers(result, ctx).map((l) => l.id));
  const source = fieldSourceOf(result);
  const outOfDomain = result.crater.state === 'outOfDomain';
  const kpa = (pa: number): string =>
    `${(pa / 1_000).toLocaleString(language, { maximumSignificantDigits: 2 })} kPa`;
  const km = (m: number): string =>
    `${(m / 1_000).toLocaleString(language, { maximumFractionDigits: 1 })} km`;
  const out: LayerAbsence[] = [];
  for (const id of IMPACT_LAYER_ORDER) {
    if (drawn.has(id)) continue;
    const tab = t(`globe.impactMap.layer.${id === 'uncertainty' ? 'probability' : id}.tab`);
    const key = `globe.impactMap.absent.${id}`;
    const say = (beyond: BeyondEdge, reason: string, vars?: Record<string, string>): void => {
      out.push({ id, tab, beyond, why: t(`${key}.${reason}`, vars ?? {}) });
    };
    switch (id) {
      case 'overpressure':
      case 'wind': {
        const peak = impactOverpressureAt(source, 1);
        if (peak > 0) say('belowThreshold', 'belowThreshold', { value: kpa(peak) });
        else say('computedZero', 'computedZero');
        break;
      }
      case 'thermal': {
        const first = result.entry.flashBurnRadii.firstDegree as number;
        if (first > 0) say('belowThreshold', 'belowThreshold', { reach: km(first) });
        else if (impactThermalExposureAt(source, 1) > 0)
          say('belowThreshold', 'belowThresholdNoReach');
        else say('computedZero', 'computedZero');
        break;
      }
      case 'ejecta':
        if (outOfDomain) say('notModelled', 'notModelled');
        else say('computedZero', 'computedZero');
        break;
      case 'shaking':
        if (outOfDomain) say('notModelled', 'outOfDomain');
        else if (result.seismic.magnitude === null) say('notModelled', 'notModelled');
        else say('belowThreshold', 'belowThreshold');
        break;
      case 'tsunami': {
        const water =
          ((result.inputs.waterDepth as number | undefined) ?? 0) > 0 ||
          result.inputs.shoreDistance !== undefined;
        if (water) say('computedZero', 'computedZero');
        else say('notApplicable', 'notApplicable');
        break;
      }
      case 'uncertainty':
        say('notApplicable', 'notApplicable');
        break;
    }
  }
  return out;
}

function buildRawLayer(
  result: ImpactScenarioResult,
  id: ImpactLayerId,
  ctx: ImpactMapContext
): RawLayer | null {
  switch (id) {
    case 'overpressure':
      return overpressureLayer(result, ctx);
    case 'wind':
      return windLayer(result, ctx);
    case 'thermal':
      return thermalLayer(result, ctx);
    case 'ejecta':
      return ejectaLayer(result, ctx);
    case 'shaking':
      return shakingLayer(result, ctx);
    case 'tsunami':
      return tsunamiLayer(result, ctx);
    case 'uncertainty':
      return uncertaintyLayer(result, ctx);
  }
}

/** The layer to draw: the one asked for where this result has it, else the
 *  first it has (overpressure, as Andrea decided, wherever there is a blast). */
export function resolveImpactLayer(
  result: ImpactScenarioResult,
  asked: ImpactLayerId,
  ctx: ImpactMapContext
): ImpactMapLayer | null {
  return buildImpactLayer(result, asked, ctx) ?? availableImpactLayers(result, ctx)[0] ?? null;
}

// ---------------------------------------------------------------------------
// The ground, as an image
// ---------------------------------------------------------------------------

export interface RasterTile {
  west: number;
  south: number;
  east: number;
  north: number;
  width: number;
  height: number;
  /** RGBA, row by row from the north-west corner. */
  data: Uint8ClampedArray<ArrayBuffer>;
}

const MAX_LAT = 85;

/**
 * The field painted onto one or two latitude–longitude tiles around the point
 * of impact, texel by texel: each texel's distance and bearing on the sphere,
 * the nominal radius its family's isoline would need there, and the layer's
 * colour at that radius — read from a table in the logarithm of the radius,
 * 2 048 entries across the span, so the model is asked two thousand times and
 * not once a texel. A cap that crosses ±180° is two tiles; one that reaches a
 * pole, or a quarter of the Earth, is a band of latitude around the globe.
 */
export function rasterizeGround(
  field: GroundField,
  shape: FamilyShape,
  anchor: GeoPoint,
  texelsAcross = 640
): RasterTile[] {
  const lutN = 2_048;
  const lo = Math.log(Math.max(field.minRangeM, 1));
  const hi = Math.log(Math.max(field.maxRangeM, field.minRangeM * 1.001, 2));
  const lut = new Uint8ClampedArray(lutN * 4);
  const hatch = new Uint8Array(lutN);
  for (let i = 0; i < lutN; i++) {
    const r = Math.exp(lo + ((hi - lo) * (i + 0.5)) / lutN);
    const c = field.colorAt(r);
    if (c !== null) lut.set(c, i * 4);
    hatch[i] = field.hatchedAt?.(r) === true ? 1 : 0;
  }
  const hole = field.holeM ?? 0;
  const reachM =
    field.maxRangeM *
    (Math.max(shape.majorMult, shape.minorMult) + Math.abs(shape.offsetPerMeter)) *
    1.03;
  const delta = Math.min(reachM / R_EARTH, Math.PI);
  const deltaDeg = (delta * 180) / Math.PI;
  const lat0 = anchor.latDeg;
  const boxes: { west: number; south: number; east: number; north: number }[] = [];
  const polar = lat0 + deltaDeg >= MAX_LAT || lat0 - deltaDeg <= -MAX_LAT || delta >= Math.PI / 2;
  if (polar) {
    boxes.push({
      west: -180,
      east: 180,
      south: Math.max(lat0 - deltaDeg, -MAX_LAT),
      north: Math.min(lat0 + deltaDeg, MAX_LAT),
    });
  } else {
    const dLon =
      (Math.asin(Math.min(1, Math.sin(delta) / Math.cos((lat0 * Math.PI) / 180))) * 180) / Math.PI;
    const west = anchor.lonDeg - dLon;
    const east = anchor.lonDeg + dLon;
    const south = lat0 - deltaDeg;
    const north = lat0 + deltaDeg;
    if (west < -180) {
      boxes.push({ west: west + 360, east: 180, south, north }, { west: -180, east, south, north });
    } else if (east > 180) {
      boxes.push({ west, east: 180, south, north }, { west: -180, east: east - 360, south, north });
    } else {
      boxes.push({ west, east, south, north });
    }
  }
  // Texels square on the ground at the anchor's latitude, the cap about
  // `texelsAcross` of them wide.
  const texelM = Math.max((2 * reachM) / texelsAcross, 1);
  const cosLat0 = Math.max(Math.cos((lat0 * Math.PI) / 180), 0.05);
  return boxes.map((box) => {
    const width = Math.min(
      1_536,
      Math.max(
        8,
        Math.round(((box.east - box.west) * (Math.PI / 180) * R_EARTH * cosLat0) / texelM)
      )
    );
    const height = Math.min(
      1_536,
      Math.max(8, Math.round(((box.north - box.south) * (Math.PI / 180) * R_EARTH) / texelM))
    );
    const data = new Uint8ClampedArray(width * height * 4);
    const f1 = (anchor.latDeg * Math.PI) / 180;
    const sinF1 = Math.sin(f1);
    const cosF1 = Math.cos(f1);
    const lonSin = new Float64Array(width);
    const lonCos = new Float64Array(width);
    const lonHalfSin = new Float64Array(width);
    for (let x = 0; x < width; x++) {
      const lon = box.west + ((x + 0.5) / width) * (box.east - box.west);
      const dl = ((lon - anchor.lonDeg) * Math.PI) / 180;
      lonSin[x] = Math.sin(dl);
      lonCos[x] = Math.cos(dl);
      lonHalfSin[x] = Math.sin(dl / 2);
    }
    for (let y = 0; y < height; y++) {
      const lat = box.north - ((y + 0.5) / height) * (box.north - box.south);
      const f2 = (lat * Math.PI) / 180;
      const sinF2 = Math.sin(f2);
      const cosF2 = Math.cos(f2);
      const sdf = Math.sin((f2 - f1) / 2);
      for (let x = 0; x < width; x++) {
        const sdl = lonHalfSin[x] ?? 0;
        const h = sdf * sdf + cosF1 * cosF2 * sdl * sdl;
        const d = 2 * R_EARTH * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(1 - h, 0)));
        const bearing = Math.atan2(
          (lonSin[x] ?? 0) * cosF2,
          cosF1 * sinF2 - sinF1 * cosF2 * (lonCos[x] ?? 1)
        );
        const r = nominalRangeFromPolar(shape, d, bearing);
        if (!(r > 0) || r > field.maxRangeM || r < hole) continue;
        const li = Math.min(
          lutN - 1,
          Math.max(0, Math.floor(((Math.log(Math.max(r, 1)) - lo) / (hi - lo)) * lutN))
        );
        const o = (y * width + x) * 4;
        const j = li * 4;
        const alpha = lut[j + 3] ?? 0;
        if (alpha === 0) continue;
        if (hatch[li] === 1 && (x + y) % 7 >= 2) {
          // The field's band: stripes, with a faint wash between them.
          data[o] = lut[j] ?? 0;
          data[o + 1] = lut[j + 1] ?? 0;
          data[o + 2] = lut[j + 2] ?? 0;
          data[o + 3] = Math.round(alpha * 0.16);
          continue;
        }
        data[o] = lut[j] ?? 0;
        data[o + 1] = lut[j + 1] ?? 0;
        data[o + 2] = lut[j + 2] ?? 0;
        data[o + 3] = alpha;
      }
    }
    return { ...box, width, height, data };
  });
}
