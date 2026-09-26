/**
 * The judgement of tests T2 and T3 (rules 1254 (c) and 1256 of
 * `src/physics/validation/blastSolverRules.ts`): the solver's reach against a
 * digitised height-of-burst curve, at each read height, with the readings
 * where the reference is ill-conditioned left out and listed, and the
 * convergence of T5 over three grids. A reach at the farthest range read is
 * a lower bound (rule 1276).
 */

import { reachOf, type BlastRun } from './blast2d-run.js';

/** The tolerance on a single judged reach (rule 1254 (c), T2 and T3). */
export const TOLERANCE = 0.1;

/** Rule 1276: the ground's peak at the farthest range read still at or above
 *  the threshold, so the run's reach is only a lower bound. */
export function beyondDomain(run: BlastRun, threshold: number): boolean {
  return (run.peaks.at(-1) ?? 0) >= threshold;
}

export interface Reading {
  h: number;
  r: number[];
}

/** The reference's farthest reach (km scaled) at a height, linear between
 *  read heights; 0 above its last reading. */
export function referenceReach(rows: readonly Reading[], h: number): number {
  const pts = rows.map((x) => ({ h: x.h, r: Math.max(...x.r) })).sort((a, b) => a.h - b.h);
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (first === undefined || last === undefined || h < first.h || h > last.h) return 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i] as { h: number; r: number };
    const b = pts[i + 1] as { h: number; r: number };
    if (h >= a.h && h <= b.h)
      return b.h === a.h ? a.r : a.r + ((h - a.h) / (b.h - a.h)) * (b.r - a.r);
  }
  return 0;
}

/** Rule 1256 (a): ill-conditioned where ±0.02 km of height moves the
 *  reference's reach by more than 10 %. */
export function illConditioned(rows: readonly Reading[], h: number): boolean {
  const r = referenceReach(rows, h);
  if (!(r > 0)) return true;
  const up = referenceReach(rows, h + 0.02);
  const down = referenceReach(rows, Math.max(0, h - 0.02));
  return Math.abs(up - down) / 2 / r > 0.1;
}

export interface Convergence {
  reaches: number[];
  order: number | null;
  extrapolated: number | null;
  error: number;
  /** Rule 1276: a grid's reach is a lower bound, so no order is drawn. */
  lowerBound: boolean;
}

/** Rule 1256 (c): the observed order and the extrapolated reach. */
export function converge(coarseToFine: readonly number[]): Convergence {
  const [r1, r2, r3] = coarseToFine as [number, number, number];
  const d12 = r1 - r2;
  const d23 = r2 - r3;
  if (
    d12 !== 0 &&
    d23 !== 0 &&
    Math.sign(d12) === Math.sign(d23) &&
    Math.abs(d23) < Math.abs(d12)
  ) {
    const order = Math.log2(d12 / d23);
    const extrapolated = r3 + (r3 - r2) / (2 ** order - 1);
    return {
      reaches: [...coarseToFine],
      order,
      extrapolated,
      error: Math.abs(r3 - extrapolated),
      lowerBound: false,
    };
  }
  return {
    reaches: [...coarseToFine],
    order: null,
    extrapolated: null,
    error: Math.max(r1, r2, r3) - Math.min(r1, r2, r3),
    lowerBound: false,
  };
}

/** Rule 1276: T5 leaves out a grid series with a reach beyond the domain. */
export function convergeBounded(
  coarseToFine: readonly number[],
  bounded: readonly boolean[]
): Convergence {
  if (!bounded.some(Boolean)) return converge(coarseToFine);
  return {
    reaches: [...coarseToFine],
    order: null,
    extrapolated: null,
    error: NaN,
    lowerBound: true,
  };
}

export interface JudgedRow {
  psi: number;
  h: number;
  reference: number;
  solver: number;
  ratio: number | null;
  /** Rule 1276: the finest grid's reach is a lower bound («≥»). */
  lowerBound: boolean;
  left: 'judged' | 'illConditioned' | 'zero' | 'beyondDomain';
  convergence: Convergence;
}

/**
 * Judge one threshold: `runs[g][k]` is grid g's (coarse to fine) run at the
 * k-th height; distances in km scaled by `scale` (km of the run per km at
 * 1 kt).
 */
export function judge(
  psi: number,
  heights: readonly number[],
  reference: readonly Reading[],
  runs: readonly (readonly BlastRun[])[],
  scaleKm: number
): JudgedRow[] {
  const pa = psi * 6_894.757;
  return heights.map((h, k) => {
    const gridRuns = runs.map((grid) => {
      const run = grid[k];
      if (run === undefined) throw new Error('missing run');
      return run;
    });
    const reaches = gridRuns.map((run) => reachOf(run, pa) / 1_000 / scaleKm);
    const bounded = gridRuns.map((run) => beyondDomain(run, pa));
    const lowerBound = bounded[bounded.length - 1] ?? false;
    const solver = reaches[reaches.length - 1] ?? 0;
    const ref = referenceReach(reference, h);
    // Rule 1276: a lower bound counts only where the bound itself fails.
    const left: JudgedRow['left'] =
      !(ref > 0) || !(solver > 0)
        ? 'zero'
        : illConditioned(reference, h)
          ? 'illConditioned'
          : lowerBound && !(solver / ref - 1 > TOLERANCE)
            ? 'beyondDomain'
            : 'judged';
    return {
      psi,
      h,
      reference: ref,
      solver,
      ratio: ref > 0 ? solver / ref : null,
      lowerBound,
      left,
      convergence: convergeBounded(reaches, bounded),
    };
  });
}

export function verdict(rows: readonly JudgedRow[]): {
  judged: number;
  left: number;
  /** Rule 1276: readings left out as beyond the domain, to be run again. */
  beyond: number;
  /** Judged readings whose deviation is only a lower bound. */
  bounds: number;
  worst: number;
  median: number;
  passes: boolean;
} {
  const judged = rows.filter((x) => x.left === 'judged' && x.ratio !== null);
  const dev = judged.map((x) => Math.abs((x.ratio ?? NaN) - 1)).sort((a, b) => a - b);
  const mid = (dev.length - 1) / 2;
  const median =
    dev.length === 0 ? NaN : ((dev[Math.floor(mid)] ?? NaN) + (dev[Math.ceil(mid)] ?? NaN)) / 2;
  const worst = dev.length === 0 ? NaN : (dev[dev.length - 1] ?? NaN);
  const beyond = rows.filter((x) => x.left === 'beyondDomain').length;
  return {
    judged: dev.length,
    left: rows.length - dev.length,
    beyond,
    bounds: judged.filter((x) => x.lowerBound).length,
    worst,
    median,
    passes: dev.length > 0 && beyond === 0 && worst <= TOLERANCE && median <= 0.05,
  };
}
