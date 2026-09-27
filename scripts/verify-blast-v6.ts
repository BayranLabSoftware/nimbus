/**
 * Rules 1334 (c) V6 and 1345 (`src/physics/validation/blastSolverRules.ts`):
 * real air's Riemann problem, the solver against the exact solution
 * (`scripts/riemann-air-exact.ts`, sharing only the blended equation of
 * state).
 *
 * The exact solver's own checks first: with the ideal gas it gives V2's
 * exact solution (Toro) within 10⁻¹²; the Rankine–Hugoniot residuals of its
 * shocks at most 10⁻¹²; halving its RK4 step (10⁻⁴ in ln v) moves p*, u*, the
 * star states and the sampled density under 10⁻¹⁰.
 *
 * Cases, the states from (p, T) by RP-1181's T(e, ρ): (a) 50 atm, 8 000 K
 * against 1 atm, 300 K; (b) 1 000 atm, 15 000 K against 1 atm, 300 K; (c) 4
 * atm, 5 500 K against 1 atm, 4 500 K — all four states in one column of one
 * band, away from every blend. At rest; along z, uniform in r (4 columns), no
 * gravity, the limiter 'has', real air. On 100, 200, 400 and 800 cells over
 * 1 m, the diaphragm at 0.45 m, read when the fastest wave has run 0.4 m:
 * the L1 error of density against the exact cell averages, its order between
 * the two finest at least 0.8; on the finest the shock within one cell (the
 * crossing of the mean of the densities either side) and the plateau's mean
 * pressure — its cells more than three from either end — within 0.5 % of p*.
 *
 *   pnpm exec tsx scripts/verify-blast-v6.ts
 *
 * Writes src/physics/validation/verifyBlastV6.json.
 */

import { writeFileSync } from 'node:fs';
import { AIR_RHO0, airTabled, airTemperature } from '../src/physics/solvers/blast2d/airEos.js';
import { uniformAtmosphere } from '../src/physics/solvers/blast2d/atmosphere.js';
import { BlastSolver2D } from '../src/physics/solvers/blast2d/solver.js';
import { exactRiemann, type Eos, type Solution, type State } from './riemann-air-exact.js';
import { riemann } from './riemann-toro.js';

const ATM = 101_325;
const DS = 1e-4;
// Rule 1347 (e): the same table the solver reads.
const air: Eos = { p: (e, rho) => airTabled(e, rho).p, c2: (e, rho) => airTabled(e, rho).c2 };

// The exact solver's checks.
const g = 1.4;
const ideal: Eos = { p: (e, rho) => (g - 1) * rho * e, c2: (e) => g * (g - 1) * e };
const sodL: State = { rho: 1, u: 0, p: 1, e: 1 / (0.4 * 1) };
const sodR: State = { rho: 0.125, u: 0, p: 0.1, e: 0.1 / (0.4 * 0.125) };
const toro = riemann({ rho: 1, u: 0, p: 1 }, { rho: 0.125, u: 0, p: 0.1 }, g);
const sod = exactRiemann(ideal, sodL, sodR, DS);
let toroWorst = Math.max(
  Math.abs(sod.pStar / toro.pStar - 1),
  Math.abs(sod.uStar / toro.uStar - 1),
  Math.abs(sod.left.star.rho / toro.rhoStarL - 1),
  Math.abs(sod.right.star.rho / toro.rhoStarR - 1)
);
for (let k = 0; k <= 400; k++) {
  const xi = -1.5 + (k / 400) * 3.5;
  toroWorst = Math.max(toroWorst, Math.abs(sod.sample(xi).rho / toro.density(xi) - 1));
}
const toroPasses = toroWorst <= 1e-12;
console.log(
  `exact solver, ideal gas against Toro: worst ${toroWorst.toExponential(2)} — ${toroPasses ? 'PASSES' : 'FAILS'}`
);

/** The state at (p, T): ρ by bisection in ln ρ near p/(RT), e from p. */
function eFromP(p: number, rho: number): number {
  let lo = 1e3;
  let hi = p / (0.05 * rho);
  for (let n = 0; n < 200; n++) {
    const m = Math.sqrt(lo * hi);
    if (air.p(m, rho) > p) hi = m;
    else lo = m;
  }
  return Math.sqrt(lo * hi);
}
function stateFromPT(pAtm: number, T: number): State {
  const p = pAtm * ATM;
  const guess = p / (287.06 * T);
  let lo = Math.log(guess / 5);
  let hi = Math.log(guess * 1.2);
  for (let n = 0; n < 200; n++) {
    const m = 0.5 * (lo + hi);
    const rho = Math.exp(m);
    if (airTemperature(eFromP(p, rho), rho) > T) lo = m;
    else hi = m;
  }
  const rho = Math.exp(0.5 * (lo + hi));
  return { rho, u: 0, p, e: eFromP(p, rho) };
}

/** Rankine–Hugoniot residuals of a shock, relative. */
function hugoniot(k: State, s: State, speed: number): number {
  const wk = k.u - speed;
  const ws = s.u - speed;
  const mass = Math.abs(k.rho * wk - s.rho * ws) / Math.abs(k.rho * wk);
  const mom = Math.abs(k.p + k.rho * wk * wk - (s.p + s.rho * ws * ws)) / (k.p + k.rho * wk * wk);
  const hk = k.e + k.p / k.rho + 0.5 * wk * wk;
  const hs = s.e + s.p / s.rho + 0.5 * ws * ws;
  return Math.max(mass, mom, Math.abs(hk - hs) / hk);
}

const GAUSS8 = [
  [0.1834346424956498, 0.362683783378362],
  [0.525532409916329, 0.3137066458778873],
  [0.7966664774136267, 0.2223810344533745],
  [0.9602898564975363, 0.1012285362903763],
] as const;

const Z0 = 0.45;
const LENGTH = 1;
const CELLS = [100, 200, 400, 800];
const NR = 4;

function exactAverage(ex: Solution, a: number, b: number, t: number): number {
  const cuts = [a, ...ex.speeds.map((s) => Z0 + s * t).filter((x) => x > a && x < b), b];
  let sum = 0;
  for (let n = 0; n + 1 < cuts.length; n++) {
    const lo = cuts[n] ?? a;
    const hi = cuts[n + 1] ?? b;
    const mid = 0.5 * (lo + hi);
    const half = 0.5 * (hi - lo);
    for (const [x, w] of GAUSS8)
      for (const sign of [-1, 1]) sum += w * half * ex.sample((mid + sign * x * half - Z0) / t).rho;
  }
  return sum / (b - a);
}

const CASES: [string, [number, number], [number, number]][] = [
  ['a', [50, 8000], [1, 300]],
  ['b', [1000, 15000], [1, 300]],
  ['c', [4, 5500], [1, 4500]],
];
const results = [];
let allPass = toroPasses;
for (const [name, [pl, tl], [pr, tr]] of CASES) {
  const l = stateFromPT(pl, tl);
  const r = stateFromPT(pr, tr);
  const ex = exactRiemann(air, l, r, DS);
  const half = exactRiemann(air, l, r, DS / 2);
  let halving = Math.max(
    Math.abs(half.pStar / ex.pStar - 1),
    Math.abs(half.uStar / ex.uStar - 1),
    Math.abs(half.left.star.rho / ex.left.star.rho - 1),
    Math.abs(half.right.star.rho / ex.right.star.rho - 1)
  );
  const fastest = Math.max(...ex.speeds.map(Math.abs));
  const tEnd = 0.4 / fastest;
  for (let k = 0; k <= 200; k++) {
    const xi = (-0.45 + (k / 200) * 0.99) / tEnd;
    halving = Math.max(halving, Math.abs(half.sample(xi).rho / ex.sample(xi).rho - 1));
  }
  let rh = 0;
  if (ex.left.shock) rh = Math.max(rh, hugoniot(l, ex.left.star, ex.left.speed));
  if (ex.right.shock) rh = Math.max(rh, hugoniot(r, ex.right.star, ex.right.speed));
  const exactPasses = rh <= 1e-12 && halving <= 1e-10;
  const rows: {
    cells: number;
    steps: number;
    l1: number;
    shockOffCells: number;
    plateau: number;
    faceIterations: number;
  }[] = [];
  for (const nz of CELLS) {
    const dz = LENGTH / nz;
    const solver = new BlastSolver2D({ nr: NR, nz, dx: dz }, uniformAtmosphere(r.rho, r.p), {
      limiter: 'has',
      eos: 'air',
    });
    for (let j = 0; j < nz; j++) {
      const s = (j + 0.5) * dz < Z0 ? l : r;
      for (let i = 0; i < NR; i++) {
        const k = solver.index(i, j);
        solver.rho[k] = s.rho;
        solver.mr[k] = 0;
        solver.mz[k] = 0;
        solver.en[k] = s.rho * s.e;
      }
    }
    while (solver.time < tEnd) solver.step(tEnd - solver.time);
    const t = solver.time;
    let l1 = 0;
    const mean = new Float64Array(nz);
    const pres = new Float64Array(nz);
    for (let j = 0; j < nz; j++) {
      const want = exactAverage(ex, j * dz, (j + 1) * dz, t);
      for (let i = 0; i < NR; i++) {
        const got = solver.rho[solver.index(i, j)] ?? NaN;
        l1 += (Math.abs(got - want) * dz) / NR;
        mean[j] = (mean[j] ?? 0) + got / NR;
        pres[j] = (pres[j] ?? 0) + solver.pressure(i, j) / NR;
      }
    }
    // The right shock (every case has one): the highest crossing of the mean
    // of the densities either side.
    const level = 0.5 * (ex.right.star.rho + r.rho);
    let shock = NaN;
    for (let j = nz - 2; j >= 0; j--) {
      const a = mean[j] ?? 0;
      const b = mean[j + 1] ?? 0;
      if ((a - level) * (b - level) <= 0 && a !== b) {
        shock = (j + 0.5) * dz + ((a - level) / (a - b)) * dz;
        break;
      }
    }
    // The plateau: from the left wave's tail to the right shock, three cells
    // in from each end.
    const from = Z0 + (ex.left.shock ? ex.left.speed : ex.left.tail) * t;
    const to = Z0 + ex.right.speed * t;
    let sum = 0;
    let count = 0;
    for (let j = 0; j < nz; j++) {
      const zc = (j + 0.5) * dz;
      if (zc > from + 3 * dz && zc < to - 3 * dz) {
        sum += pres[j] ?? 0;
        count++;
      }
    }
    const plateau = sum / count / ex.pStar - 1;
    rows.push({
      cells: nz,
      steps: solver.steps,
      l1,
      shockOffCells: Math.abs(shock - (Z0 + ex.right.speed * t)) / dz,
      plateau,
      faceIterations: solver.faceIterations,
    });
    console.log(
      `(${name}) ${String(nz)} cells: L1 ${l1.toExponential(3)}, shock ${Math.abs(shock - (Z0 + ex.right.speed * t)) / dz < 99 ? (Math.abs(shock - (Z0 + ex.right.speed * t)) / dz).toFixed(2) : '—'} cells off, plateau ${(plateau * 100).toFixed(3)} %, ${String(solver.steps)} steps`
    );
  }
  const orders = rows.slice(1).map((x, k) => Math.log2((rows[k]?.l1 ?? NaN) / x.l1));
  const finest = rows[rows.length - 1];
  const schemePasses =
    (orders[orders.length - 1] ?? 0) >= 0.8 &&
    (finest?.shockOffCells ?? Infinity) <= 1 &&
    Math.abs(finest?.plateau ?? Infinity) <= 0.005;
  allPass = allPass && exactPasses && schemePasses;
  const y = (s: State): number => Math.log10(s.rho / AIR_RHO0);
  console.log(
    `(${name}) p* ${(ex.pStar / ATM).toFixed(4)} atm, u* ${ex.uStar.toFixed(2)} m/s; exact solver RH ${rh.toExponential(2)}, halving ${halving.toExponential(2)} — ${exactPasses ? 'PASSES' : 'FAILS'}; orders ${orders.map((o) => o.toFixed(2)).join(', ')} — ${schemePasses ? 'PASSES' : 'FAILS'}`
  );
  results.push({
    case: name,
    left: { ...l, Y: y(l) },
    right: { ...r, Y: y(r) },
    pStar: ex.pStar,
    uStar: ex.uStar,
    speeds: ex.speeds,
    tEnd,
    rankineHugoniot: rh,
    halving,
    exactPasses,
    rows,
    orders,
    schemePasses,
  });
}
console.log(`V6 ${allPass ? 'PASSES' : 'FAILS'}`);
writeFileSync(
  'src/physics/validation/verifyBlastV6.json',
  `${JSON.stringify({ rule: '1334 (c) V6, 1345', toro: { worst: toroWorst, passes: toroPasses }, cases: results, passes: allPass }, null, 2)}\n`
);
