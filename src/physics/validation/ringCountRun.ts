import { _internals } from '../../scene/populationLookup.js';
import { mulberry32 } from '../montecarlo/sampling.js';
import {
  chooseRingCount,
  RING_COUNT_BAR,
  RING_COUNT_CANDIDATE_SUBSAMPLES,
  RING_COUNT_CONVERGENCE_SUBSAMPLES,
  RING_COUNT_DRAWN,
  RING_COUNT_EXACT_SUBSAMPLES,
  RING_COUNT_IN_PLACE_SUBSAMPLES,
  RING_COUNT_MOST_POPULOUS,
  RING_COUNT_RADII_M,
  type RingCountReading,
} from './ringCountRules.js';
import { shippedCoarseView } from './shippedPopulation.js';

/**
 * Rules 94 to 97 of ringCountRules.ts, run: the circles rule 94 builds, the
 * count the product takes and the far finer one rule 95 takes of the same
 * cells, and rule 97's choice. One computation for the script that first runs
 * them, the report that prints them and the test that keeps the report honest.
 *
 * Everything here reads the shipped 0.125° planet, which is the raster every
 * ring wider than 1 500 km is counted on and the fallback for all the rest. It
 * is the one raster an offline run can always reach, and the one whose cells
 * are largest — so the sub-grid has the most to do on it.
 */

type GridView = ReturnType<(typeof _internals)['coarseView']>;

export interface RingCountCircle {
  name: string;
  latitude: number;
  longitude: number;
}

/** Rule 94's centres, built from the raster itself and a seeded generator. */
export function ringCountCentres(view: GridView): RingCountCircle[] {
  const cells: { people: number; row: number; col: number }[] = [];
  for (let r = 0; r < view.nLat; r++) {
    for (let c = 0; c < view.nLon; c++) {
      const people = view.cellAt(r, c).people;
      if (people > 0) cells.push({ people, row: r, col: c });
    }
  }
  const centreOf = (row: number, col: number): { latitude: number; longitude: number } => ({
    latitude: view.maxLat - (row + 0.5) * view.cellDeg,
    longitude: view.minLon + (col + 0.5) * view.cellDeg,
  });
  const byPeople = [...cells].sort((a, b) =>
    b.people === a.people ? a.row - b.row || a.col - b.col : b.people - a.people
  );
  const out: RingCountCircle[] = byPeople
    .slice(0, RING_COUNT_MOST_POPULOUS)
    .map((cell, i) => ({ name: `busiest ${(i + 1).toString()}`, ...centreOf(cell.row, cell.col) }));
  const rng = mulberry32('rule-94');
  for (let i = 0; i < RING_COUNT_DRAWN; i++) {
    const pick = cells[Math.min(cells.length - 1, Math.floor(rng.next() * cells.length))];
    if (pick === undefined) continue;
    out.push({ name: `drawn ${(i + 1).toString()}`, ...centreOf(pick.row, pick.col) });
  }
  out.push(
    { name: 'antimeridian', latitude: 0.0625, longitude: 179.9375 },
    { name: '70 N', latitude: 70.0625, longitude: 20.0625 },
    { name: 'equator', latitude: 0.0625, longitude: 32.0625 },
    { name: 'southern ocean', latitude: -55.0625, longitude: -100.0625 }
  );
  return out;
}

/**
 * Rule 95's count: the same cells and the same geometry, with the cells the
 * edge crosses split `subsamples × subsamples`.
 */
export function exactCircleCount(
  view: GridView,
  latitude: number,
  longitude: number,
  radiusM: number,
  subsamples: number
): number {
  return _internals.sumGridCircle(view, latitude, longitude, radiusM, subsamples);
}

/** The width of one cell of `view` at this latitude (m), the smaller side. */
export function cellWidthM(view: GridView, latitude: number): number {
  const cellLatM = (view.cellDeg * Math.PI * 6_371_000) / 180;
  const cellLonM = cellLatM * Math.max(Math.cos((latitude * Math.PI) / 180), 1e-6);
  return Math.min(cellLatM, cellLonM);
}

export interface RingCountRow {
  name: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  /** Below one cell of the raster, so rule 94 leaves it out of the bar. */
  belowACell: boolean;
  exact: number;
  inPlace: number;
  candidate: number;
  /** |counted − exact| / exact, for the count in place. */
  error: number;
  candidateError: number;
}

function reading(
  rows: readonly RingCountRow[],
  pick: (r: RingCountRow) => number
): RingCountReading {
  const scored = rows.filter((r) => !r.belowACell && r.exact > 0);
  const errors = scored.map(pick).sort((a, b) => a - b);
  const at = (q: number): number =>
    errors.length === 0
      ? 0
      : (errors[Math.min(errors.length - 1, Math.floor(q * errors.length))] ?? 0);
  return {
    scored: scored.length,
    belowACell: rows.length - scored.length,
    medianError: at(0.5),
    ninetiethError: at(0.9),
    worstError: errors.length === 0 ? 0 : (errors[errors.length - 1] ?? 0),
    meetsBar: errors.every((e) => e <= RING_COUNT_BAR),
  };
}

export interface RingCountRunResult {
  raster: { cellDeg: number; nLon: number; nLat: number };
  circles: number;
  rows: RingCountRow[];
  /** Rule 95: the largest disagreement between the 48 × 48 reference and the
   *  96 × 96 one, over the circles it was taken on. */
  convergence: { checked: number; worst: number; passes: boolean };
  inPlace: RingCountReading;
  candidate: RingCountReading;
  timeFactor: number;
  /** The three worst circles of the count in place. */
  worstRows: RingCountRow[];
  decision: ReturnType<typeof chooseRingCount>;
}

export function runRingCount(): RingCountRunResult {
  const view = shippedCoarseView();
  const centres = ringCountCentres(view);
  const rows: RingCountRow[] = [];
  let inPlaceMs = 0;
  let candidateMs = 0;
  for (const centre of centres) {
    for (const radiusM of RING_COUNT_RADII_M) {
      const exact = exactCircleCount(
        view,
        centre.latitude,
        centre.longitude,
        radiusM,
        RING_COUNT_EXACT_SUBSAMPLES
      );
      const t0 = performance.now();
      const inPlace = exactCircleCount(
        view,
        centre.latitude,
        centre.longitude,
        radiusM,
        RING_COUNT_IN_PLACE_SUBSAMPLES
      );
      inPlaceMs += performance.now() - t0;
      const t1 = performance.now();
      const candidate = exactCircleCount(
        view,
        centre.latitude,
        centre.longitude,
        radiusM,
        RING_COUNT_CANDIDATE_SUBSAMPLES
      );
      candidateMs += performance.now() - t1;
      rows.push({
        name: centre.name,
        latitude: centre.latitude,
        longitude: centre.longitude,
        radiusKm: radiusM / 1_000,
        belowACell: 2 * radiusM < cellWidthM(view, centre.latitude),
        exact,
        inPlace,
        candidate,
        error: exact > 0 ? Math.abs(inPlace - exact) / exact : 0,
        candidateError: exact > 0 ? Math.abs(candidate - exact) / exact : 0,
      });
    }
  }

  // Rule 95's convergence check, on every fourth circle.
  let checked = 0;
  let worst = 0;
  for (let i = 0; i < rows.length; i += 4) {
    const row = rows[i];
    if (row === undefined || row.exact <= 0 || row.belowACell) continue;
    const finer = exactCircleCount(
      view,
      row.latitude,
      row.longitude,
      row.radiusKm * 1_000,
      RING_COUNT_CONVERGENCE_SUBSAMPLES
    );
    checked += 1;
    worst = Math.max(worst, Math.abs(finer - row.exact) / row.exact);
  }
  const convergence = { checked, worst, passes: checked > 0 && worst <= RING_COUNT_BAR / 10 };

  const inPlace = reading(rows, (r) => r.error);
  const candidate = reading(rows, (r) => r.candidateError);
  const timeFactor = inPlaceMs > 0 ? candidateMs / inPlaceMs : Number.POSITIVE_INFINITY;
  const worstRows = [...rows]
    .filter((r) => !r.belowACell && r.exact > 0)
    .sort((a, b) => b.error - a.error)
    .slice(0, 3);
  return {
    raster: { cellDeg: view.cellDeg, nLon: view.nLon, nLat: view.nLat },
    circles: rows.length,
    rows,
    convergence,
    inPlace,
    candidate,
    timeFactor,
    worstRows,
    decision: chooseRingCount({
      referenceConverged: convergence.passes,
      inPlace,
      candidate,
      timeFactor,
    }),
  };
}
