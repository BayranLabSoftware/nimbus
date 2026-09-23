import type { CellVerdict } from './measuredCells.js';

/**
 * Rules 739 to 747 of `entryBandRules.ts`: the band of an impact's entry
 * altitude. The model's burst altitude plus the 5th and 95th percentiles of
 * its error — the altitude of peak brightness the sensors recorded, less the
 * model's burst altitude — over the fireballs of the scenario's measured cell,
 * frozen below and recomputed from the rows in `entryBandRules.test.ts`.
 */

/** One fireball as the band reads it: its measured cell, and the model's
 *  error on it (km, the record less the model). */
export interface EntryBandRow {
  cell: number;
  errorKm: number;
}

/** Rule 741: the band's groups — each of the four cells of twenty rows or
 *  more on its own, and the two above 3 kT pooled. */
export const ENTRY_BAND_GROUPS: readonly { name: string; cells: readonly number[] }[] = [
  { name: 'below 0.3 kt, below 17 km/s', cells: [0] },
  { name: 'below 0.3 kt, from 17 km/s', cells: [1] },
  { name: '0.3 to 3 kt, below 17 km/s', cells: [2] },
  { name: '0.3 to 3 kt, from 17 km/s', cells: [3] },
  { name: 'from 3 kt', cells: [4, 5] },
];

/** Rule 740: a percentile as the linear interpolation between order
 *  statistics (type 7 of Hyndman & Fan 1996). */
export function percentileType7(values: readonly number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return Number.NaN;
  const h = (sorted.length - 1) * p;
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  const a = sorted[lo] ?? Number.NaN;
  const b = sorted[hi] ?? Number.NaN;
  return a + (h - lo) * (b - a);
}

export interface EntryBandGroupReading {
  name: string;
  rows: number;
  /** The 5th and 95th percentiles of the error (km). */
  lowKm: number;
  highKm: number;
}

/** Rules 740 and 741: the band's percentiles, group by group. */
export function entryBandPercentiles(rows: readonly EntryBandRow[]): EntryBandGroupReading[] {
  return ENTRY_BAND_GROUPS.map((group) => {
    const errors = rows.filter((r) => group.cells.includes(r.cell)).map((r) => r.errorKm);
    return {
      name: group.name,
      rows: errors.length,
      lowKm: percentileType7(errors, 0.05),
      highKm: percentileType7(errors, 0.95),
    };
  });
}

/**
 * Rule 743: the band as frozen, group by group (km), and when, in the order of
 * {@link ENTRY_BAND_GROUPS}. The error is the record less the model. First
 * computed on 21 September 2026 after rules 739 to 747 were pushed
 * (`5e9e951`), when the model burst a body higher than the sky does and the
 * band lay mostly below its burst altitude; re-taken on 23 September 2026 as
 * rule 898(c) lets an adoption of rules 896 to 902 re-take it, computed as
 * rule 743 computes it: under the two-stage strength five of the fireballs
 * reach the ground (351 rows, not 356) and the band straddles the burst
 * altitude.
 */
export const ENTRY_ALTITUDE_BAND: {
  frozenOn: string;
  groups: readonly { lowKm: number; highKm: number; rows: number }[];
} = {
  frozenOn: '2026-09-23',
  groups: [
    { lowKm: -10.842038234961874, highKm: 14.060752569647434, rows: 94 },
    { lowKm: -18.94106639990732, highKm: 18.575133332555033, rows: 101 },
    { lowKm: -10.244869337803781, highKm: 11.477627220245148, rows: 58 },
    { lowKm: -13.357540628132691, highKm: 5.4022013978429895, rows: 70 },
    { lowKm: -9.228668762573413, highKm: 10.431569988089112, rows: 28 },
  ],
};

/** Rule 742: the band on a scenario's burst altitude (m), or null outside the
 *  measured cells or for a body the model does not burst in the air. */
export function entryAltitudeBand(
  verdict: CellVerdict,
  burstAltitudeM: number,
  bursts: boolean
): { low: number; high: number } | null {
  if (!verdict.inside || !bursts || !(burstAltitudeM > 0)) return null;
  const index = ENTRY_BAND_GROUPS.findIndex((g) => g.cells.includes(verdict.cell));
  const group = ENTRY_ALTITUDE_BAND.groups[index];
  if (group === undefined) return null;
  return {
    low: Math.max(0, burstAltitudeM + group.lowKm * 1_000),
    high: Math.max(0, burstAltitudeM + group.highKm * 1_000),
  };
}
