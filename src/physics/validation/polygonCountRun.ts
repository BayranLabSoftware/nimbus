import { _internals } from '../../scene/populationLookup.js';
import { buildRuptureStadiumLatLon } from '../../scene/stadiumPolygon.js';
import {
  choosePolygonCount,
  POLYGON_COUNT_BAR,
  POLYGON_COUNT_CANDIDATE_SUBSAMPLES,
  POLYGON_COUNT_CENTRES,
  POLYGON_COUNT_CONVERGENCE_SUBSAMPLES,
  POLYGON_COUNT_EXACT_SUBSAMPLES,
  POLYGON_COUNT_IN_PLACE_SUBSAMPLES,
  POLYGON_COUNT_SHAPES,
  POLYGON_COUNT_STRIKE_STEP_DEG,
  type PolygonCountReading,
} from './polygonCountRules.js';
import { ringCountCentres } from './ringCountRun.js';
import { shippedCoarseView } from './shippedPopulation.js';

/**
 * Rules 98 to 101 of polygonCountRules.ts, run: the rupture stadiums rule 98
 * builds, the count the product takes of each and the far finer one rule 99
 * takes of the same cells, and rule 101's choice. One computation for the
 * script that first runs them, the report that prints them and the test that
 * keeps the report honest.
 */

type GridView = ReturnType<(typeof _internals)['coarseView']>;

export interface PolygonCountCase {
  name: string;
  latitude: number;
  longitude: number;
  strikeDeg: number;
  shape: (typeof POLYGON_COUNT_SHAPES)[number];
}

/** Rule 98's polygons: the same centres as rule 94's circles, three shapes,
 *  and a strike that turns with each one. */
export function polygonCountCases(view: GridView): PolygonCountCase[] {
  const centres = ringCountCentres(view);
  const chosen = [
    ...centres.slice(0, POLYGON_COUNT_CENTRES),
    ...centres.filter((c) => c.name === 'antimeridian' || c.name === '70 N'),
  ];
  const out: PolygonCountCase[] = [];
  for (const centre of chosen) {
    for (const shape of POLYGON_COUNT_SHAPES) {
      out.push({
        name: `${centre.name} · ${shape.name}`,
        latitude: centre.latitude,
        longitude: centre.longitude,
        strikeDeg: (out.length * POLYGON_COUNT_STRIKE_STEP_DEG) % 360,
        shape,
      });
    }
  }
  return out;
}

/** The ring the simulator would draw for one case. */
export function ringOf(one: PolygonCountCase): [number, number][] {
  return buildRuptureStadiumLatLon({
    centerLatDeg: one.latitude,
    centerLonDeg: one.longitude,
    strikeAzimuthDeg: one.strikeDeg,
    halfLengthAlongStrikeM: one.shape.halfLengthM,
    halfWidthAcrossStrikeM: one.shape.halfWidthM,
    contourRadiusM: one.shape.contourRadiusM,
  }).map((p) => [p.lonDeg, p.latDeg] as [number, number]);
}

export interface PolygonCountRow {
  name: string;
  latitude: number;
  longitude: number;
  strikeDeg: number;
  shape: string;
  exact: number;
  inPlace: number;
  candidate: number;
  error: number;
  candidateError: number;
}

function reading(
  rows: readonly PolygonCountRow[],
  pick: (r: PolygonCountRow) => number
): PolygonCountReading {
  const scored = rows.filter((r) => r.exact > 0);
  const errors = scored.map(pick).sort((a, b) => a - b);
  const at = (q: number): number =>
    errors.length === 0
      ? 0
      : (errors[Math.min(errors.length - 1, Math.floor(q * errors.length))] ?? 0);
  return {
    scored: scored.length,
    medianError: at(0.5),
    ninetiethError: at(0.9),
    worstError: errors.length === 0 ? 0 : (errors[errors.length - 1] ?? 0),
    meetsBar: errors.every((e) => e <= POLYGON_COUNT_BAR),
  };
}

export interface PolygonCountRunResult {
  polygons: number;
  rows: PolygonCountRow[];
  convergence: { checked: number; worst: number; passes: boolean };
  inPlace: PolygonCountReading;
  candidate: PolygonCountReading;
  timeFactor: number;
  worstRows: PolygonCountRow[];
  decision: ReturnType<typeof choosePolygonCount>;
}

export function runPolygonCount(gatePasses = true): PolygonCountRunResult {
  const view = shippedCoarseView();
  const cases = polygonCountCases(view);
  const rows: PolygonCountRow[] = [];
  let inPlaceMs = 0;
  let candidateMs = 0;
  const rings = cases.map(ringOf);
  cases.forEach((one, i) => {
    const ring = rings[i] ?? [];
    const exact = _internals.sumGridRing(view, ring, POLYGON_COUNT_EXACT_SUBSAMPLES);
    const t0 = performance.now();
    const inPlace = _internals.sumGridRing(view, ring, POLYGON_COUNT_IN_PLACE_SUBSAMPLES);
    inPlaceMs += performance.now() - t0;
    const t1 = performance.now();
    const candidate = _internals.sumGridRing(view, ring, POLYGON_COUNT_CANDIDATE_SUBSAMPLES);
    candidateMs += performance.now() - t1;
    rows.push({
      name: one.name,
      latitude: one.latitude,
      longitude: one.longitude,
      strikeDeg: one.strikeDeg,
      shape: one.shape.name,
      exact,
      inPlace,
      candidate,
      error: exact > 0 ? Math.abs(inPlace - exact) / exact : 0,
      candidateError: exact > 0 ? Math.abs(candidate - exact) / exact : 0,
    });
  });

  let checked = 0;
  let worst = 0;
  for (let i = 0; i < rows.length; i += 5) {
    const row = rows[i];
    const ring = rings[i];
    if (row === undefined || ring === undefined || row.exact <= 0) continue;
    const finer = _internals.sumGridRing(view, ring, POLYGON_COUNT_CONVERGENCE_SUBSAMPLES);
    checked += 1;
    worst = Math.max(worst, Math.abs(finer - row.exact) / row.exact);
  }
  const convergence = { checked, worst, passes: checked > 0 && worst <= POLYGON_COUNT_BAR / 10 };

  const inPlace = reading(rows, (r) => r.error);
  const candidate = reading(rows, (r) => r.candidateError);
  const timeFactor = inPlaceMs > 0 ? candidateMs / inPlaceMs : Number.POSITIVE_INFINITY;
  const worstRows = [...rows]
    .filter((r) => r.exact > 0)
    .sort((a, b) => b.error - a.error)
    .slice(0, 3);
  return {
    polygons: rows.length,
    rows,
    convergence,
    inPlace,
    candidate,
    timeFactor,
    worstRows,
    decision: choosePolygonCount({
      referenceConverged: convergence.passes,
      inPlace,
      candidate,
      timeFactor,
      gatePasses,
    }),
  };
}
