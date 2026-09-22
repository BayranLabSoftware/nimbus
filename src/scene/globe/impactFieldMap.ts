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
  programShakingRadiusKm,
} from '../../physics/events/impact/seismic.js';
import type { ImpactScenarioResult } from '../../physics/simulate.js';
import { J, m, Pa } from '../../physics/units.js';
import { projectAlongAzimuth } from '../stadiumPolygon.js';
import { RING_RADIUS_SIGMA } from './ringSigma.js';
import { INTENSITY_BANDS } from './shakingOverlay.js';

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
  | 'uncertainty';

export const IMPACT_LAYER_ORDER: readonly ImpactLayerId[] = [
  'overpressure',
  'wind',
  'thermal',
  'ejecta',
  'shaking',
  'uncertainty',
];

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

export interface ImpactMapLayer {
  id: ImpactLayerId;
  tab: string;
  title: string;
  unit: string;
  field: GroundField | null;
  isolines: MapIsoline[];
  colorbar: ColorbarSpec | null;
  categories: CategoryKey[];
  notes: { label: string; text: string }[];
  uncertainty?: { choices: UncertaintyChoice[]; selected: UncertaintyChoice | null };
}

export interface ImpactMapContext {
  t: TFunction;
  language: string;
  /** The threshold the uncertainty view reads; the first it has when null. */
  uncertaintyKey?: string | null;
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

function overpressureLayer(
  result: ImpactScenarioResult,
  ctx: ImpactMapContext
): ImpactMapLayer | null {
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

function windLayer(result: ImpactScenarioResult, ctx: ImpactMapContext): ImpactMapLayer | null {
  const { t, language } = ctx;
  const source = fieldSourceOf(result);
  const outer = Math.max(
    result.damage.lightDamage,
    result.damage.overpressure1psi,
    result.damage.overpressure5psi
  );
  if (!(outer > 0)) return null;
  const crater = result.damage.craterRim;
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

function thermalLayer(result: ImpactScenarioResult, ctx: ImpactMapContext): ImpactMapLayer | null {
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

function ejectaLayer(result: ImpactScenarioResult, ctx: ImpactMapContext): ImpactMapLayer | null {
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

function shakingLayer(result: ImpactScenarioResult, ctx: ImpactMapContext): ImpactMapLayer | null {
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

function uncertaintyLayer(
  result: ImpactScenarioResult,
  ctx: ImpactMapContext
): ImpactMapLayer | null {
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
        maxRangeM: selected.medianM * Math.exp(3.5 * sl),
        colorAt: (r) => {
          const p = normalCdf(-Math.log(r / selected.medianM) / sl);
          if (p < 0.02) return null;
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
        if (!(r > 0) || r > field.maxRangeM) continue;
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
