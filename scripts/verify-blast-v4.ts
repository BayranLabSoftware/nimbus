/**
 * Rules 1295 (c) V4 and 1303 (`src/physics/validation/blastSolverRules.ts`):
 * Lamb's wave. In the isothermal atmosphere with gravity the mode with no
 * vertical velocity is exact in the linear equations — p' = c²ρ' =
 * P(r, t)e^{−z/(γH)}, u = U(r, t)e^{(γ−1)z/(γH)}, P obeying the cylindrical
 * wave equation at c. Started from a Gaussian ring at rest, read at 30 s on
 * four grids: the vertical velocity, the vertical profile and the ground's P
 * against the exact solution (a Hankel transform, checked before use).
 *
 *   pnpm exec tsx scripts/verify-blast-v4.ts
 *
 * Writes src/physics/validation/verifyBlastV4.json.
 */

import { writeFileSync } from 'node:fs';
import { isothermalAtmosphere } from '../src/physics/solvers/blast2d/atmosphere.js';
import { BlastSolver2D } from '../src/physics/solvers/blast2d/solver.js';

const RHO0 = 1.225;
const P0 = 101_325;
const GRAV = 9.80665;
const GAMMA = 1.4;
const H = P0 / (RHO0 * GRAV);
const GH = GAMMA * H;
const C = Math.sqrt((GAMMA * P0) / RHO0);
const A = 1e-5 * P0;
const R0 = 10_000;
const W = 2_000;
const T_END = 30;
const R_MAX = 30_000;
const Z_MAX = 40_000;
const DX = [500, 250, 125, 62.5];

const start = (r: number): number => A * Math.exp(-(((r - R0) / W) ** 2));

/** J₀(x): the trapezoid rule on (1/π)∫₀^π cos(x sin θ) dθ, exact to rounding
 *  once 2N passes |x| by a margin (its error is 2J_{2N}(x)). */
function j0(x: number, refine = 1): number {
  const n = Math.ceil(refine * (0.5 * Math.abs(x) + 10 * Math.cbrt(Math.abs(x)) + 20));
  let sum = 0;
  for (let m = 0; m < n; m++) sum += Math.cos(x * Math.sin((Math.PI * m) / n));
  return sum / n;
}

const GAUSS8 = [
  [-0.9602898564975363, 0.1012285362903763],
  [-0.7966664774136267, 0.2223810344533745],
  [-0.525532409916329, 0.3137066458778873],
  [-0.1834346424956498, 0.362683783378362],
  [0.1834346424956498, 0.362683783378362],
  [0.525532409916329, 0.3137066458778873],
  [0.7966664774136267, 0.2223810344533745],
  [0.9602898564975363, 0.1012285362903763],
] as const;

/** Composite eight-point Gauss nodes and weights on [a, b] in `panels` panels. */
function nodes(a: number, b: number, panels: number): [number, number][] {
  const out: [number, number][] = [];
  const h = (b - a) / panels;
  for (let p = 0; p < panels; p++)
    for (const [x, w] of GAUSS8) out.push([a + h * (p + 0.5 * (x + 1)), 0.5 * h * w]);
  return out;
}

/** The exact P(r, t) at the radii, the quadratures scaled by `refine`. */
function exactP(radii: number[], t: number, refine = 1): Float64Array {
  const kMax = 10 / W;
  const rNodes = nodes(0, R0 + 8 * W, Math.ceil(refine * 104));
  const kNodes = nodes(0, kMax, Math.ceil(refine * 200));
  const phi = kNodes.map(([k]) => {
    let s = 0;
    for (const [r, w] of rNodes) s += w * r * start(r) * j0(k * r, refine);
    return s;
  });
  const out = new Float64Array(radii.length);
  for (const [n, r] of radii.entries()) {
    let s = 0;
    for (const [m, [k, w]] of kNodes.entries())
      s += w * k * (phi[m] ?? 0) * j0(k * r, refine) * Math.cos(C * k * t);
    out[n] = s;
  }
  return out;
}

// ---- the exact solution's checks (rule 1303 (d)) ----
const J0_KNOWN: [number, number][] = [
  [1, 0.7651976865579666],
  [10, -0.2459357644513483],
  [100, 0.019985850304223122],
];
const j0Error = Math.max(...J0_KNOWN.map(([x, v]) => Math.abs(j0(x) - v)));
const probe = Array.from({ length: 121 }, (_, n) => (n * R_MAX) / 120);
const atStart = exactP(probe, 0);
const startError = Math.max(...probe.map((r, n) => Math.abs((atStart[n] ?? 0) - start(r)))) / A;
const coarse = exactP(probe, T_END);
const fine = exactP(probe, T_END, 2);
const refineChange =
  Math.max(...probe.map((_, n) => Math.abs((coarse[n] ?? 0) - (fine[n] ?? 0)))) / A;
console.log(
  `exact solution: J0 within ${j0Error.toExponential(1)}; at T = 0 within ${startError.toExponential(2)} A; doubled quadratures move P(r, T) by ${refineChange.toExponential(2)} A`
);
if (!(startError <= 1e-6 && refineChange <= 1e-7 && j0Error <= 1e-12))
  throw new Error('verify-blast-v4: the exact solution fails its own checks (rule 1303 (d))');

const GAUSS4 = [
  [0.5 - 0.5 * 0.8611363115940526, 0.5 * 0.3478548451374538],
  [0.5 - 0.5 * 0.3399810435848563, 0.5 * 0.6521451548625461],
  [0.5 + 0.5 * 0.3399810435848563, 0.5 * 0.6521451548625461],
  [0.5 + 0.5 * 0.8611363115940526, 0.5 * 0.3478548451374538],
] as const;

/** r-weighted cell averages of a radial profile known at the Gauss points. */
function ringAverages(nr: number, dx: number, values: (radii: number[]) => ArrayLike<number>) {
  const radii: number[] = [];
  for (let i = 0; i < nr; i++) for (const [a] of GAUSS4) radii.push((i + a) * dx);
  const v = values(radii);
  const out = new Float64Array(nr);
  for (let i = 0; i < nr; i++) {
    let sum = 0;
    let weight = 0;
    for (const [q, [a, w]] of GAUSS4.entries()) {
      const r = (i + a) * dx;
      sum += w * r * (v[4 * i + q] ?? 0);
      weight += w * r;
    }
    out[i] = sum / weight;
  }
  return out;
}

/** The exact average of e^{sz} over row j. */
const rowAverage = (j: number, dx: number, s: number): number =>
  (Math.exp(s * (j + 1) * dx) - Math.exp(s * j * dx)) / (s * dx);

interface Row {
  dx: number;
  cells: number;
  steps: number;
  seconds: number;
  wOverU: number;
  profile: number;
  groundL1: number;
  uProfile: number;
}
const rows: Row[] = [];
for (const dx of DX) {
  const nr = Math.round(R_MAX / dx);
  const nz = Math.round(Z_MAX / dx);
  const solver = new BlastSolver2D({ nr, nz, dx }, isothermalAtmosphere(RHO0, P0, GRAV), {
    limiter: 'has',
  });
  const p0Ring = ringAverages(nr, dx, (radii) => radii.map(start));
  for (let j = 0; j < nz; j++) {
    const e = rowAverage(j, dx, -1 / GH);
    for (let i = 0; i < nr; i++) {
      const k = solver.index(i, j);
      const p = (p0Ring[i] ?? 0) * e;
      solver.rho[k] = (solver.rho[k] ?? 0) + p / (C * C);
      solver.en[k] = (solver.en[k] ?? 0) + p / (GAMMA - 1);
    }
  }
  const started = Date.now();
  while (solver.time < T_END) solver.step(T_END - solver.time);
  const seconds = (Date.now() - started) / 1000;

  // The cells with their top at or below 3H.
  const rowsIn = Math.floor((3 * H) / dx);
  const over = (i: number, j: number): number =>
    solver.pressure(i, j) - solver.backgroundPressure(j);
  const velocity = (i: number, j: number): [number, number] => {
    const k = solver.index(i, j);
    const rho = solver.rho[k] ?? NaN;
    return [(solver.mr[k] ?? 0) / rho, (solver.mz[k] ?? 0) / rho];
  };
  let maxU = 0;
  let maxW = 0;
  for (let j = 0; j < rowsIn; j++)
    for (let i = 0; i < nr; i++) {
      const [u, w] = velocity(i, j);
      maxU = Math.max(maxU, Math.abs(u));
      maxW = Math.max(maxW, Math.abs(w));
    }
  const e0 = rowAverage(0, dx, -1 / GH);
  const ground = Array.from({ length: nr }, (_, i) => over(i, 0));
  const groundMax = Math.max(...ground.map(Math.abs));
  let profile = 0;
  for (let i = 0; i < nr; i++) {
    const g0 = ground[i] ?? 0;
    if (Math.abs(g0) < 0.5 * groundMax) continue;
    for (let j = 1; j < rowsIn; j++) {
      const want = rowAverage(j, dx, -1 / GH) / e0;
      profile = Math.max(profile, Math.abs(over(i, j) / g0 / want - 1));
    }
  }
  const uGround = Array.from({ length: nr }, (_, i) => velocity(i, 0)[0]);
  const uMax = Math.max(...uGround.map(Math.abs));
  const u0 = rowAverage(0, dx, (GAMMA - 1) / GH);
  let uProfile = 0;
  for (let i = 0; i < nr; i++) {
    const g0 = uGround[i] ?? 0;
    if (Math.abs(g0) < 0.5 * uMax) continue;
    for (let j = 1; j < rowsIn; j++) {
      const want = rowAverage(j, dx, (GAMMA - 1) / GH) / u0;
      uProfile = Math.max(uProfile, Math.abs(velocity(i, j)[0] / g0 / want - 1));
    }
  }
  const exactRing = ringAverages(nr, dx, (radii) => exactP(radii, solver.time));
  let err = 0;
  let norm = 0;
  for (let i = 0; i < nr; i++) {
    const v = solver.cellVolume(i);
    const want = exactRing[i] ?? 0;
    err += Math.abs((ground[i] ?? 0) / e0 - want) * v;
    norm += Math.abs(want) * v;
  }
  const row: Row = {
    dx,
    cells: nr * nz,
    steps: solver.steps,
    seconds,
    wOverU: maxW / maxU,
    profile,
    groundL1: err / norm,
    uProfile,
  };
  rows.push(row);
  console.log(
    `${String(dx)} m: |w|/|u| ${row.wOverU.toExponential(2)}, profile ${row.profile.toExponential(2)}, ground L1 ${row.groundL1.toExponential(3)}, u profile ${row.uProfile.toExponential(2)}, ${String(row.steps)} steps, ${seconds.toFixed(1)} s`
  );
}
const orders = rows.slice(1).map((r, k) => Math.log2((rows[k]?.groundL1 ?? NaN) / r.groundL1));
const finest = rows[rows.length - 1];
const lastOrder = orders[orders.length - 1] ?? NaN;
const checks = {
  verticalVelocity: (finest?.wOverU ?? Infinity) <= 0.01,
  profile: (finest?.profile ?? Infinity) <= 0.01,
  ground: (finest?.groundL1 ?? Infinity) <= 0.01 && lastOrder >= 2,
};
const passes = checks.verticalVelocity && checks.profile && checks.ground;
console.log(
  `observed orders ${orders.map((o) => o.toFixed(2)).join(', ')}; ${JSON.stringify(checks)} — ${passes ? 'PASSES' : 'FAILS'}`
);
writeFileSync(
  'src/physics/validation/verifyBlastV4.json',
  `${JSON.stringify(
    {
      rule: '1295 (c) V4, 1303',
      criteria: { wOverU: 0.01, profile: 0.01, groundL1: 0.01, order: 2 },
      exactChecks: { j0Error, startError, refineChange },
      results: rows,
      orders,
      checks,
      passes,
    },
    null,
    2
  )}\n`
);
