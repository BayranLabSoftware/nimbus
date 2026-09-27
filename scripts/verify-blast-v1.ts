/**
 * Rule 1295 (c) V1 (`src/physics/validation/blastSolverRules.ts`): the
 * blast solver's order of accuracy on a smooth problem with an exact
 * solution. A spherical acoustic pulse of 10⁻⁶ p₀ at rest, centred on the
 * axis at the ground, in a uniform atmosphere without gravity, on rule
 * 1277's limiter; the exact linear solution R·p' = ½[(R − ct)g(R − ct) +
 * (R + ct)g(R + ct)]. Four grids, the pulse's width over 4, 8, 16 and 32
 * cells; the relative L1 error of the cell averages of p'.
 *
 *   pnpm exec tsx scripts/verify-blast-v1.ts
 *
 * Writes src/physics/validation/verifyBlastV1.json.
 */

import { writeFileSync } from 'node:fs';
import { uniformAtmosphere } from '../src/physics/solvers/blast2d/atmosphere.js';
import { BlastSolver2D } from '../src/physics/solvers/blast2d/solver.js';

const RHO = 1.225;
const P0 = 101_325;
const GAMMA = 1.4;
const C = Math.sqrt((GAMMA * P0) / RHO);
const AMPLITUDE = 1e-6 * P0;
/** The pulse's width (m): g(R) = A·exp(−(R/W)²). */
const W = 100;
/** The time the error is read at (s): the pulse some two widths out. */
const T_END = 0.6;
/** The domain's side (m): nothing reaches it by T_END (c·T + 4W ≈ 610 m). */
const L = 700;
const WIDTH_CELLS = [4, 8, 16, 32];

const g = (s: number): number => AMPLITUDE * Math.exp(-((s / W) ** 2));
/** The exact linear solution at distance R from the centre, time t. */
function exact(radius: number, t: number): number {
  if (t === 0) return g(radius);
  const a = radius - C * t;
  const b = radius + C * t;
  if (radius < 1e-9) {
    // The limit R → 0: d/ds [s·g(s)] at s = ct.
    const s = C * t;
    return g(s) * (1 - (2 * s * s) / (W * W));
  }
  return (a * g(Math.abs(a)) + b * g(b)) / (2 * radius);
}

/** Four-point Gauss–Legendre on [0, 1]. */
const GAUSS = [
  [0.5 - 0.5 * 0.8611363115940526, 0.5 * 0.3478548451374538],
  [0.5 - 0.5 * 0.3399810435848563, 0.5 * 0.6521451548625461],
  [0.5 + 0.5 * 0.3399810435848563, 0.5 * 0.6521451548625461],
  [0.5 + 0.5 * 0.8611363115940526, 0.5 * 0.3478548451374538],
] as const;

/** The average of f(r, z) over a ring cell, weighted by r. */
function cellAverage(
  i: number,
  j: number,
  dx: number,
  f: (r: number, z: number) => number
): number {
  let sum = 0;
  let weight = 0;
  for (const [a, wa] of GAUSS)
    for (const [b, wb] of GAUSS) {
      const r = (i + a) * dx;
      const z = (j + b) * dx;
      sum += wa * wb * r * f(r, z);
      weight += wa * wb * r;
    }
  return sum / weight;
}

interface Row {
  widthCells: number;
  dx: number;
  cells: number;
  steps: number;
  seconds: number;
  relativeL1: number;
  maxOverAmplitude: number;
  limitedFaces: number;
  scaledFaces: number;
}
const results: Row[] = [];
for (const cells of WIDTH_CELLS) {
  const dx = W / cells;
  const n = Math.round(L / dx);
  const solver = new BlastSolver2D({ nr: n, nz: n, dx }, uniformAtmosphere(RHO, P0), {
    limiter: 'has',
  });
  // The isentropic pulse at rest: ρ' = p'/c², no velocity.
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const p = cellAverage(i, j, dx, (r, z) => g(Math.hypot(r, z)));
      const k = solver.index(i, j);
      solver.rho[k] = RHO + p / (C * C);
      solver.mr[k] = 0;
      solver.mz[k] = 0;
      solver.en[k] = (P0 + p) / (GAMMA - 1);
    }
  const started = Date.now();
  while (solver.time < T_END) solver.step(T_END - solver.time);
  let error = 0;
  let norm = 0;
  let worst = 0;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const volume = solver.cellVolume(i);
      const want = cellAverage(i, j, dx, (r, z) => exact(Math.hypot(r, z), solver.time));
      const got = solver.pressure(i, j) - P0;
      error += Math.abs(got - want) * volume;
      norm += Math.abs(want) * volume;
      worst = Math.max(worst, Math.abs(got - want));
    }
  const row: Row = {
    widthCells: cells,
    dx,
    cells: n * n,
    steps: solver.steps,
    seconds: (Date.now() - started) / 1000,
    relativeL1: error / norm,
    maxOverAmplitude: worst / AMPLITUDE,
    limitedFaces: solver.limitedFaces,
    scaledFaces: solver.scaledFaces,
  };
  results.push(row);
  console.log(
    `${String(cells)} cells per width: L1 ${row.relativeL1.toExponential(3)}, max ${row.maxOverAmplitude.toExponential(3)} of A, ${String(row.steps)} steps, ${row.seconds.toFixed(1)} s`
  );
}
const orders = results
  .slice(1)
  .map((r, k) => Math.log2((results[k]?.relativeL1 ?? NaN) / r.relativeL1));
const finest = results[results.length - 1];
const lastOrder = orders[orders.length - 1] ?? NaN;
const passes = lastOrder >= 3 && (finest?.relativeL1 ?? Infinity) <= 0.01;
console.log(
  `observed orders ${orders.map((o) => o.toFixed(2)).join(', ')} — ${passes ? 'PASSES' : 'FAILS'}`
);
writeFileSync(
  'src/physics/validation/verifyBlastV1.json',
  `${JSON.stringify({ rule: '1295 (c) V1', criteria: { order: 3, relativeL1: 0.01 }, results, orders, passes }, null, 2)}\n`
);
