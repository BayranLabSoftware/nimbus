/**
 * Rule 1299 (c) (`src/physics/validation/blastSolverRules.ts`): V1's order
 * by self-convergence. The spherical pulse of rule 1295 (c) at 10⁻⁴ p₀, on
 * the pulse's width over 8, 16, 32 and 64 cells; the relative L1 norm of the
 * differences between successive grids' cell averages of p', the finer grid
 * brought to the coarser by volume-weighted averages of its four cells; the
 * observed order between the two finest differences at least 3, and the
 * finest grid's relative L1 error against the exact linear solution at most
 * 1 %.
 *
 *   pnpm exec tsx scripts/verify-blast-v1-self.ts
 *
 * Writes src/physics/validation/verifyBlastV1Self.json.
 */

import { writeFileSync } from 'node:fs';
import { uniformAtmosphere } from '../src/physics/solvers/blast2d/atmosphere.js';
import { BlastSolver2D } from '../src/physics/solvers/blast2d/solver.js';

const RHO = 1.225;
const P0 = 101_325;
const GAMMA = 1.4;
const C = Math.sqrt((GAMMA * P0) / RHO);
const AMPLITUDE = 1e-4 * P0;
const W = 100;
const T_END = 0.6;
const L = 700;
const WIDTH_CELLS = [8, 16, 32, 64];

const g = (s: number): number => AMPLITUDE * Math.exp(-((s / W) ** 2));
function exact(radius: number, t: number): number {
  const a = radius - C * t;
  const b = radius + C * t;
  if (radius < 1e-9) {
    const s = C * t;
    return g(s) * (1 - (2 * s * s) / (W * W));
  }
  return (a * g(Math.abs(a)) + b * g(b)) / (2 * radius);
}

const GAUSS = [
  [0.5 - 0.5 * 0.8611363115940526, 0.5 * 0.3478548451374538],
  [0.5 - 0.5 * 0.3399810435848563, 0.5 * 0.6521451548625461],
  [0.5 + 0.5 * 0.3399810435848563, 0.5 * 0.6521451548625461],
  [0.5 + 0.5 * 0.8611363115940526, 0.5 * 0.3478548451374538],
] as const;

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

interface Grid {
  n: number;
  dx: number;
  /** p' by cell, row-major in (j, i). */
  over: Float64Array;
  volume: Float64Array;
}

const grids: Grid[] = [];
const rows: {
  widthCells: number;
  dx: number;
  steps: number;
  seconds: number;
  relativeL1Exact: number;
}[] = [];
for (const cells of WIDTH_CELLS) {
  const dx = W / cells;
  const n = Math.round(L / dx);
  const solver = new BlastSolver2D({ nr: n, nz: n, dx }, uniformAtmosphere(RHO, P0), {
    limiter: 'has',
  });
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
  const over = new Float64Array(n * n);
  const volume = new Float64Array(n);
  let error = 0;
  let norm = 0;
  for (let i = 0; i < n; i++) volume[i] = solver.cellVolume(i);
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const got = solver.pressure(i, j) - P0;
      over[j * n + i] = got;
      const want = cellAverage(i, j, dx, (r, z) => exact(Math.hypot(r, z), solver.time));
      error += Math.abs(got - want) * (volume[i] ?? 0);
      norm += Math.abs(want) * (volume[i] ?? 0);
    }
  grids.push({ n, dx, over, volume });
  const row = {
    widthCells: cells,
    dx,
    steps: solver.steps,
    seconds: (Date.now() - started) / 1000,
    relativeL1Exact: error / norm,
  };
  rows.push(row);
  console.log(
    `${String(cells)} cells per width: against the exact solution L1 ${row.relativeL1Exact.toExponential(3)}, ${String(row.steps)} steps, ${row.seconds.toFixed(1)} s`
  );
}

/** The relative L1 norm of coarse − (fine brought to the coarse grid). */
function difference(coarse: Grid, fine: Grid): number {
  let diff = 0;
  let norm = 0;
  for (let j = 0; j < coarse.n; j++)
    for (let i = 0; i < coarse.n; i++) {
      let sum = 0;
      let weight = 0;
      for (let b = 0; b < 2; b++)
        for (let a = 0; a < 2; a++) {
          const v = fine.volume[2 * i + a] ?? 0;
          sum += (fine.over[(2 * j + b) * fine.n + 2 * i + a] ?? 0) * v;
          weight += v;
        }
      const v = coarse.volume[i] ?? 0;
      const c = coarse.over[j * coarse.n + i] ?? 0;
      diff += Math.abs(c - sum / weight) * v;
      norm += Math.abs(c) * v;
    }
  return diff / norm;
}

const differences = grids.slice(1).map((fine, k) => {
  const coarse = grids[k];
  return coarse === undefined ? NaN : difference(coarse, fine);
});
const orders = differences.slice(1).map((d, k) => Math.log2((differences[k] ?? NaN) / d));
const lastOrder = orders[orders.length - 1] ?? NaN;
const finestExact = rows[rows.length - 1]?.relativeL1Exact ?? Infinity;
const passes = lastOrder >= 3 && finestExact <= 0.01;
console.log(
  `differences ${differences.map((d) => d.toExponential(3)).join(', ')}; observed orders ${orders.map((o) => o.toFixed(2)).join(', ')} — ${passes ? 'PASSES' : 'FAILS'}`
);
writeFileSync(
  'src/physics/validation/verifyBlastV1Self.json',
  `${JSON.stringify({ rule: '1299 (c)', criteria: { order: 3, relativeL1Exact: 0.01 }, amplitudeOverP0: 1e-4, results: rows, differences, orders, passes }, null, 2)}\n`
);
