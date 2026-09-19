import { pagerFatalityRate } from '../../casualties.js';
import {
  bandOfIntensity,
  peopleInCell,
  FIELD_TOLL_BUDGET_MS,
} from '../../validation/fieldTollRules.js';
import { frameToGeographic, type ShakingField } from './shakingField.js';

/** PAGER's two fitted parameters, as `pagerFatalityRate` takes them. The type
 *  is not exported from `casualties.ts`, so it is read off the function. */
type PagerParameters = Parameters<typeof pagerFatalityRate>[1];

/**
 * The dead, counted cell by cell over the shaking field.
 *
 * Rules 335 to 341 of `validation/fieldTollRules.ts`. What changes against
 * `shakingCasualtyPlan` is not the curve — it is PAGER's, unchanged, and the
 * vulnerability is the same triplet — but WHERE it is evaluated: at each
 * cell's own intensity, on the people that cell holds, instead of once per
 * annulus on everybody inside it.
 *
 * Nothing here decides which country's curve applies: the caller passes the
 * vulnerability, as the plan does today, and rule 337 records that a footprint
 * crossing a border still gets one country's.
 */

export interface FieldTollInput {
  field: ShakingField;
  /** People per square kilometre at a place — land density, not cell total. */
  densityAt: (latitude: number, longitude: number) => number;
  vulnerability: { low: PagerParameters; mid: PagerParameters; high: PagerParameters };
  /** The lowest band the plan carries: rule 46's V, or VII. */
  lowestBand: 5 | 7;
}

export interface FieldToll {
  deaths: number;
  low: number;
  high: number;
  /** People and dead of each band, for the report's columns (rule 336). */
  byBand: Record<string, { people: number; deaths: number }>;
  /** Cells that held anybody at all. */
  populatedCells: number;
  exposed: number;
  elapsedMs: number;
}

const EARTH_MEAN_RADIUS_M = 6_371_008;
const DEG = Math.PI / 180;

/**
 * Rule 335: the sum over the field's cells.
 *
 * A cell's ground area shrinks with the cosine of its own latitude, and its
 * people are its density times that area — so a field finer than the
 * population raster counts nobody twice and a coarser one misses nobody.
 */
export function tollOverField(input: FieldTollInput): FieldToll {
  const started = Date.now();
  const { field, densityAt, vulnerability, lowestBand } = input;
  const n = field.points;
  const byBand: Record<string, { people: number; deaths: number }> = {};
  let deaths = 0;
  let low = 0;
  let high = 0;
  let exposed = 0;
  let populatedCells = 0;

  for (let row = 0; row + 1 < n; row += 1) {
    for (let col = 0; col + 1 < n; col += 1) {
      // The cell's value is the mean of its corners, as `areaAbove` reads it.
      const mmi =
        ((field.mmi[row * n + col] ?? 0) +
          (field.mmi[row * n + col + 1] ?? 0) +
          (field.mmi[(row + 1) * n + col] ?? 0) +
          (field.mmi[(row + 1) * n + col + 1] ?? 0)) /
        4;
      const band = bandOfIntensity(mmi, lowestBand);
      if (band === null) continue;
      const centre = frameToGeographic(field.rupture, {
        x: -field.halfSpanM + (col + 0.5) * field.stepM,
        y: -field.halfSpanM + (row + 0.5) * field.stepM,
      });
      const areaM2 = field.stepM * field.stepM * Math.cos(centre.latitude * DEG);
      const people = peopleInCell(densityAt(centre.latitude, centre.longitude), areaM2);
      if (people <= 0) continue;
      populatedCells += 1;
      exposed += people;
      deaths += people * pagerFatalityRate(mmi, vulnerability.mid);
      low += people * pagerFatalityRate(mmi, vulnerability.low);
      high += people * pagerFatalityRate(mmi, vulnerability.high);
      const cell = byBand[band] ?? { people: 0, deaths: 0 };
      cell.people += people;
      cell.deaths += people * pagerFatalityRate(mmi, vulnerability.mid);
      byBand[band] = cell;
    }
  }

  return {
    deaths,
    low: Math.min(low, high),
    high: Math.max(low, high),
    byBand,
    populatedCells,
    exposed,
    elapsedMs: Date.now() - started,
  };
}

/** Rule 340: a toll costs what a field costs. */
export const TOLL_BUDGET_MS = FIELD_TOLL_BUDGET_MS;

/** The metre a cell of the field spans on the ground, for a caller sizing its
 *  own raster against it. */
export function cellSizeM(field: ShakingField): number {
  return field.stepM;
}

/** How far a field reaches, in metres from the rupture's centre — the radius
 *  a caller must have population for. */
export function fieldReachM(field: ShakingField): number {
  return Math.hypot(field.halfSpanM, field.halfSpanM) + EARTH_MEAN_RADIUS_M * 0;
}
