import type { CalibrationRole, EnvelopeEventType } from './calibrationEnvelope.js';

/**
 * How accurate and how precise the model is, measured on the rows of
 * the calibration net and scored separately on the rows nothing in the
 * model was set on.
 *
 * Accuracy is the absence of a systematic error: the geometric mean of
 * model over record, which is one for a model that is not biased, and
 * the scatter of that ratio in natural-log units. Precision is a band
 * that is narrow and still honest: for a predictive band — the death
 * toll's fifth to ninety-fifth percentile — that means holding about
 * nine records in ten, not four and not ten, while being as narrow as it
 * can. Forecasters call the two calibration and sharpness, and ask for
 * the second only subject to the first (Gneiting, Balabdaoui & Raftery
 * 2007, J. R. Stat. Soc. B 69: 243–268).
 *
 * Waves and eruption columns carry no predictive band of their own: a
 * wave row is inside when the model lands in the observed range, a
 * column row when it lands within the observation's uncertainty plus
 * the fit's scatter. Their "inside" is an acceptance, counted but never
 * set against nine in ten.
 *
 * The score is split by event family and by the size of the event on
 * the family's axis — magnitude, energy, volume — because a custom
 * scenario asks how good the model is near its own inputs, not on
 * average.
 */

export type ScoredQuantity = 'toll' | 'wave' | 'plume';

export interface ScoreRowInput {
  name: string;
  quantity: ScoredQuantity;
  family: EnvelopeEventType;
  /** The event's position on its family's envelope axis: Mw, joules or
   *  cubic metres. */
  size: number;
  role: CalibrationRole;
  /** The recorded value; for a record given as a range, its central
   *  figure; null for a range that starts at zero, which has none. */
  record: number | null;
  model: number;
  inside: boolean;
  /** Width of the model's predictive band in decades, where the row has
   *  one. */
  bandDecades: number | null;
  /** The band's high end, where the row has a band. */
  bandHigh?: number;
}

/**
 * Whether a row can earn its "inside": its record, or the high end of
 * its band — its model, where it has none — is above zero. A band of
 * nothing about a record of nothing is inside by construction, and a
 * set with many such rows would read as calibrated for it.
 */
export function isInformative(row: ScoreRowInput): boolean {
  return (row.record ?? 0) > 0 || (row.bandHigh ?? row.model) > 0;
}

export interface ScoreStats {
  rows: number;
  /** Rows with both record and model above zero, which the ratio needs. */
  scored: number;
  /** Geometric mean of model over record; null below two scored rows. */
  bias: number | null;
  /** Standard deviation of ln(model / record); null below two scored rows. */
  scatterLn: number | null;
  inside: number;
  /** Both zero: a record of nothing, and a model that says so. */
  bothZero: number;
  /** A record of nothing where the model says something. */
  falseAlarms: number;
  /** A record of something where the model says nothing. */
  missedToZero: number;
  /** Median width of the predictive bands, in decades; null where the
   *  rows have none. */
  medianBandDecades: number | null;
}

export interface ScoreCell {
  quantity: ScoredQuantity;
  family: EnvelopeEventType;
  /** The size band, or null for the family as a whole. */
  sizeBand: string | null;
  heldOut: ScoreStats;
  all: ScoreStats;
}

/** Whether a quantity's "inside" is a predictive band's claim of nine in
 *  ten, or an acceptance. */
export const PREDICTIVE_BAND: Readonly<Record<ScoredQuantity, boolean>> = {
  toll: true,
  wave: false,
  plume: false,
};

const KILOTON_J = 4.184e12;
const MEGATON_J = 4.184e15;
const GIGATON_J = 4.184e18;

/** The size bands of each family, upper bounds exclusive. */
export const SIZE_BANDS: Readonly<
  Record<EnvelopeEventType, readonly { label: string; below: number }[]>
> = {
  earthquake: [
    { label: 'Mw < 6.5', below: 6.5 },
    { label: 'Mw 6.5–7.5', below: 7.5 },
    { label: 'Mw ≥ 7.5', below: Number.POSITIVE_INFINITY },
  ],
  explosion: [
    { label: '< 1 kt', below: KILOTON_J },
    { label: '1 kt – 1 Mt', below: MEGATON_J },
    { label: '≥ 1 Mt', below: Number.POSITIVE_INFINITY },
  ],
  impact: [
    { label: '< 1 Mt', below: MEGATON_J },
    { label: '1 Mt – 1 Gt', below: GIGATON_J },
    { label: '≥ 1 Gt', below: Number.POSITIVE_INFINITY },
  ],
  volcano: [
    { label: '< 10⁸ m³', below: 1e8 },
    { label: '10⁸ – 10¹⁰ m³', below: 1e10 },
    { label: '≥ 10¹⁰ m³', below: Number.POSITIVE_INFINITY },
  ],
  landslide: [
    { label: '< 10⁹ m³', below: 1e9 },
    { label: '≥ 10⁹ m³', below: Number.POSITIVE_INFINITY },
  ],
};

export function sizeBandOf(family: EnvelopeEventType, size: number): string {
  const bands = SIZE_BANDS[family];
  return (bands.find((b) => size < b.below) ?? bands[bands.length - 1])?.label ?? '';
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[mid] ?? null)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

export function scoreStats(rows: readonly ScoreRowInput[]): ScoreStats {
  const logs = rows.flatMap((r) =>
    r.record !== null && r.record > 0 && r.model > 0 ? [Math.log(r.model / r.record)] : []
  );
  const mean = logs.length > 0 ? logs.reduce((a, b) => a + b, 0) / logs.length : 0;
  const scatter =
    logs.length >= 2
      ? Math.sqrt(logs.reduce((a, b) => a + (b - mean) ** 2, 0) / logs.length)
      : null;
  const bands = rows.map((r) => r.bandDecades).filter((b): b is number => b !== null);
  return {
    rows: rows.length,
    scored: logs.length,
    bias: logs.length >= 2 ? Math.exp(mean) : null,
    scatterLn: scatter,
    inside: rows.filter((r) => r.inside).length,
    bothZero: rows.filter((r) => r.record !== null && r.record <= 0 && r.model <= 0).length,
    falseAlarms: rows.filter((r) => r.record !== null && r.record <= 0 && r.model > 0).length,
    missedToZero: rows.filter((r) => r.record !== null && r.record > 0 && r.model <= 0).length,
    medianBandDecades: median(bands),
  };
}

const QUANTITY_ORDER: readonly ScoredQuantity[] = ['toll', 'wave', 'plume'];
const FAMILY_ORDER: readonly EnvelopeEventType[] = [
  'earthquake',
  'explosion',
  'impact',
  'volcano',
  'landslide',
];

/**
 * The scorecard: for every quantity and family with rows, a cell for
 * the family as a whole and one per size band that has rows, each
 * scored on the held-out rows and on all of them.
 */
export function scorecard(inputs: readonly ScoreRowInput[]): ScoreCell[] {
  const cells: ScoreCell[] = [];
  for (const quantity of QUANTITY_ORDER) {
    for (const family of FAMILY_ORDER) {
      const rows = inputs.filter((r) => r.quantity === quantity && r.family === family);
      if (rows.length === 0) continue;
      const cell = (subset: readonly ScoreRowInput[], sizeBand: string | null): ScoreCell => ({
        quantity,
        family,
        sizeBand,
        heldOut: scoreStats(subset.filter((r) => r.role === 'heldOut')),
        all: scoreStats(subset),
      });
      cells.push(cell(rows, null));
      for (const band of SIZE_BANDS[family]) {
        const inBand = rows.filter((r) => sizeBandOf(family, r.size) === band.label);
        if (inBand.length > 0) cells.push(cell(inBand, band.label));
      }
    }
  }
  return cells;
}
