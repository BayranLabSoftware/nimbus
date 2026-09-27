/**
 * Rules 1295 (c) V2 and 1301 (`src/physics/validation/blastSolverRules.ts`):
 * Sod's shock tube along z — ρ = 1, p = 1 below z = ½, ρ = 0.125, p = 0.1
 * above, at rest, γ = 1.4 — uniform in r and without gravity, on rule 1277's
 * limiter, read at t = 0.2 against Toro's exact solution. The L1 error of
 * density on 100, 200, 400 and 800 cells in z; the observed order between
 * the two finest at least 0.8; the shock within one cell on the finest.
 *
 *   pnpm exec tsx scripts/verify-blast-v2.ts
 *
 * Writes src/physics/validation/verifyBlastV2.json.
 */

import { writeFileSync } from 'node:fs';
import { uniformAtmosphere } from '../src/physics/solvers/blast2d/atmosphere.js';
import { BlastSolver2D } from '../src/physics/solvers/blast2d/solver.js';

const GAMMA = 1.4;
const LOW = { rho: 1, u: 0, p: 1 };
const HIGH = { rho: 0.125, u: 0, p: 0.1 };
const Z0 = 0.5;
const T_END = 0.2;
const CELLS = [100, 200, 400, 800];
const NR = 4;

interface Side {
  rho: number;
  u: number;
  p: number;
}

/**
 * Toro's (Riemann Solvers and Numerical Methods for Fluid Dynamics, ch. 4)
 * exact solution: the star pressure and velocity, and the state at x/t.
 */
function riemann(l: Side, r: Side, g: number) {
  const cl = Math.sqrt((g * l.p) / l.rho);
  const cr = Math.sqrt((g * r.p) / r.rho);
  // His pressure function f_K(p) and its derivative, for side K.
  const f = (p: number, k: Side, c: number): [number, number] => {
    if (p > k.p) {
      const a = 2 / ((g + 1) * k.rho);
      const b = ((g - 1) / (g + 1)) * k.p;
      const s = Math.sqrt(a / (p + b));
      return [(p - k.p) * s, s * (1 - (p - k.p) / (2 * (b + p)))];
    }
    const x = p / k.p;
    return [
      ((2 * c) / (g - 1)) * (x ** ((g - 1) / (2 * g)) - 1),
      (1 / (k.rho * c)) * x ** (-(g + 1) / (2 * g)),
    ];
  };
  const du = r.u - l.u;
  // The primitive-variable guess, then Newton to a relative change of 10⁻¹⁴.
  let p = Math.max(1e-12, 0.5 * (l.p + r.p) - 0.125 * du * (l.rho + r.rho) * (cl + cr));
  for (let n = 0; n < 100; n++) {
    const [fl, dl] = f(p, l, cl);
    const [fr, dr] = f(p, r, cr);
    const next = Math.max(1e-12, p - (fl + fr + du) / (dl + dr));
    const change = (2 * Math.abs(next - p)) / (next + p);
    p = next;
    if (change < 1e-14) break;
  }
  const pStar = p;
  const uStar = 0.5 * (l.u + r.u) + 0.5 * (f(pStar, r, cr)[0] - f(pStar, l, cl)[0]);
  const g6 = (g - 1) / (g + 1);
  const shockL = pStar > l.p;
  const shockR = pStar > r.p;
  const rhoStarL = shockL
    ? (l.rho * (pStar / l.p + g6)) / (g6 * (pStar / l.p) + 1)
    : l.rho * (pStar / l.p) ** (1 / g);
  const rhoStarR = shockR
    ? (r.rho * (pStar / r.p + g6)) / (g6 * (pStar / r.p) + 1)
    : r.rho * (pStar / r.p) ** (1 / g);
  const speedL = l.u - cl * Math.sqrt(((g + 1) / (2 * g)) * (pStar / l.p) + (g - 1) / (2 * g));
  const speedR = r.u + cr * Math.sqrt(((g + 1) / (2 * g)) * (pStar / r.p) + (g - 1) / (2 * g));
  const headL = l.u - cl;
  const tailL = uStar - cl * (pStar / l.p) ** ((g - 1) / (2 * g));
  const headR = r.u + cr;
  const tailR = uStar + cr * (pStar / r.p) ** ((g - 1) / (2 * g));
  /** The density at s = x/t. */
  const density = (s: number): number => {
    if (s <= uStar) {
      if (shockL) return s <= speedL ? l.rho : rhoStarL;
      if (s <= headL) return l.rho;
      if (s >= tailL) return rhoStarL;
      return l.rho * (2 / (g + 1) + ((g - 1) / ((g + 1) * cl)) * (l.u - s)) ** (2 / (g - 1));
    }
    if (shockR) return s >= speedR ? r.rho : rhoStarR;
    if (s >= headR) return r.rho;
    if (s <= tailR) return rhoStarR;
    return r.rho * (2 / (g + 1) - ((g - 1) / ((g + 1) * cr)) * (r.u - s)) ** (2 / (g - 1));
  };
  const waves = [
    ...(shockL ? [speedL] : [headL, tailL]),
    uStar,
    ...(shockR ? [speedR] : [headR, tailR]),
  ];
  return { pStar, uStar, rhoStarL, rhoStarR, speedR, shockR, waves, density };
}

const exact = riemann(LOW, HIGH, GAMMA);

/** Eight-point Gauss–Legendre on [−1, 1]. */
const GAUSS8 = [
  [0.1834346424956498, 0.362683783378362],
  [0.525532409916329, 0.3137066458778873],
  [0.7966664774136267, 0.2223810344533745],
  [0.9602898564975363, 0.1012285362903763],
] as const;

/** The exact density's average over [a, b] at time t: split at the waves. */
function exactAverage(a: number, b: number, t: number): number {
  const cuts = [a, ...exact.waves.map((s) => Z0 + s * t).filter((x) => x > a && x < b), b];
  let sum = 0;
  for (let n = 0; n + 1 < cuts.length; n++) {
    const lo = cuts[n] ?? a;
    const hi = cuts[n + 1] ?? b;
    const mid = 0.5 * (lo + hi);
    const half = 0.5 * (hi - lo);
    for (const [x, w] of GAUSS8)
      for (const sign of [-1, 1]) sum += w * half * exact.density((mid + sign * x * half - Z0) / t);
  }
  return sum / (b - a);
}

interface Row {
  cells: number;
  steps: number;
  seconds: number;
  l1: number;
  columnSpread: number;
  shock: number;
}
const rows: Row[] = [];
for (const nz of CELLS) {
  const dz = 1 / nz;
  const solver = new BlastSolver2D({ nr: NR, nz, dx: dz }, uniformAtmosphere(1, 1), {
    limiter: 'has',
  });
  for (let j = 0; j < nz; j++) {
    const s = (j + 0.5) * dz < Z0 ? LOW : HIGH;
    for (let i = 0; i < NR; i++) {
      const k = solver.index(i, j);
      solver.rho[k] = s.rho;
      solver.mr[k] = 0;
      solver.mz[k] = 0;
      solver.en[k] = s.p / (GAMMA - 1);
    }
  }
  const started = Date.now();
  while (solver.time < T_END) solver.step(T_END - solver.time);
  let l1 = 0;
  let spread = 0;
  const mean = new Float64Array(nz);
  for (let j = 0; j < nz; j++) {
    const want = exactAverage(j * dz, (j + 1) * dz, solver.time);
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < NR; i++) {
      const got = solver.rho[solver.index(i, j)] ?? NaN;
      l1 += (Math.abs(got - want) * dz) / NR;
      mean[j] = (mean[j] ?? 0) + got / NR;
      lo = Math.min(lo, got);
      hi = Math.max(hi, got);
    }
    spread = Math.max(spread, hi - lo);
  }
  // The shock: the highest crossing of the mean of the post- and pre-shock densities.
  const level = 0.5 * (exact.rhoStarR + HIGH.rho);
  let shock = NaN;
  for (let j = nz - 2; j >= 0; j--) {
    const a = mean[j] ?? 0;
    const b = mean[j + 1] ?? 0;
    if (a >= level && b < level) {
      shock = (j + 0.5) * dz + ((a - level) / (a - b)) * dz;
      break;
    }
  }
  const row: Row = {
    cells: nz,
    steps: solver.steps,
    seconds: (Date.now() - started) / 1000,
    l1,
    columnSpread: spread,
    shock,
  };
  rows.push(row);
  console.log(
    `${String(nz)} cells: L1 ${l1.toExponential(3)}, shock at ${shock.toFixed(5)}, columns within ${spread.toExponential(2)}, ${String(row.steps)} steps, ${row.seconds.toFixed(1)} s`
  );
}
const orders = rows.slice(1).map((r, k) => Math.log2((rows[k]?.l1 ?? NaN) / r.l1));
const finest = rows[rows.length - 1];
const shockExact = Z0 + exact.speedR * T_END;
const shockOff = Math.abs((finest?.shock ?? NaN) - shockExact) * (finest?.cells ?? NaN);
const lastOrder = orders[orders.length - 1] ?? NaN;
const passes = lastOrder >= 0.8 && shockOff <= 1;
console.log(
  `p* ${exact.pStar.toFixed(6)}, u* ${exact.uStar.toFixed(6)}, exact shock at ${shockExact.toFixed(5)}; observed orders ${orders.map((o) => o.toFixed(2)).join(', ')}; the finest's shock ${shockOff.toFixed(2)} cells off — ${passes ? 'PASSES' : 'FAILS'}`
);
writeFileSync(
  'src/physics/validation/verifyBlastV2.json',
  `${JSON.stringify(
    {
      rule: '1295 (c) V2, 1301',
      criteria: { order: 0.8, shockCells: 1 },
      exact: { pStar: exact.pStar, uStar: exact.uStar, shock: shockExact },
      results: rows,
      orders,
      shockCellsOff: shockOff,
      passes,
    },
    null,
    2
  )}\n`
);
