/**
 * Rules 1334 (a)(7), 1336–1338 (`src/physics/validation/blastSolverRules.ts`):
 * the blended equation of state (`airGammaBlended`, `airBlended` in
 * `src/physics/solvers/blast2d/airEos.ts`) checked before the solver uses it.
 *
 *   (1) Hilsenrath & Klein's 49 points: p within 5 %, the median within 2 %;
 *   (2) on a fine grid (Y every 0.01 from −7.495 to 3.495, Z every 0.002 from
 *       −0.499 to 4.2 — both between the table's nodes, rules 1344 and 1348 —
 *       the held and clamped zones included): γ̃ > 1,
 *       ∂p/∂e > 0, c² > 0 everywhere, and the fundamental derivative 𝒢 > 0
 *       (by central differences along the isentrope) at and below Z_h —
 *       beyond it reported, not claimed (rule 1338 (c));
 *   (3) the derivatives γ̃_Y, γ̃_Z against central differences of γ̃ (h =
 *       10⁻⁶) at every grid point: C¹ across every seam, within 10⁻⁵ of
 *       max(1, |γ̃_Y|, |γ̃_Z|);
 *   (4) the entropy wave at constant pressure (Eulero's test, rule 1334 (a)):
 *       10 atm, u = 100 m/s, Z = 1.4 + 0.6 exp(−((x − 50)/15)²) over 100 m,
 *       periodic, one period, the scheme in one planar dimension; max |Δp|/p
 *       falling at every halving over 100, 200, 400 and 800 cells.
 *
 *   pnpm exec tsx scripts/verify-air-eos-blended.ts [table]
 *
 * With 'table' (rule 1347 (d)) the checks run on the bicubic table the
 * solvers read, and (5) compares it with the blended function.
 *
 * Writes src/physics/validation/verifyAirEosBlended.json.
 */

import { writeFileSync } from 'node:fs';
import {
  AIR_RHO0,
  airBlended,
  airBlendedCounts,
  airEffectiveEdge,
  airGammaBlended,
  airGammaTable,
  airTabled,
  rp1181,
} from '../src/physics/solvers/blast2d/airEos.js';
import table from '../src/physics/validation/hilsenrathKlein49.json';

// Rule 1347 (d): 'table' checks the bicubic table the solvers read, and
// compares it with the blended function.
const useTable = process.argv[2] === 'table';
const gammaOf = useTable ? airGammaTable : airGammaBlended;
const stateOf = useTable ? airTabled : airBlended;
const RT0 = rp1181.RT0;

// (1) Hilsenrath & Klein.
const {
  R_cal_per_mol_K: rCal,
  M_g_per_mol: m,
  calorie_J: cal,
  rho0_kg_per_m3: rho0hk,
} = table.constants;
const R = (rCal / m) * cal * 1000;
function read(s: string | null | undefined): number {
  const t = (s ?? '').replace(/\s/g, '');
  const match = /^([-+]?\d*\.?\d+)([-+]\d+)$/.exec(t);
  return match === null ? Number(t) : Number(match[1]) * 10 ** Number(match[2]);
}
const hk = table.points.map((pt) => {
  const values = pt.values as Record<string, string | null>;
  const rho = rho0hk * 10 ** pt.logRho;
  const e = read(values['E/RT']) * R * pt.T;
  const pTable = read(values.Z) * rho * R * pt.T;
  const pModule = stateOf(e, rho).p;
  return { T: pt.T, logRho: pt.logRho, off: pModule / pTable - 1 };
});
const hkOffs = hk.map((r) => Math.abs(r.off)).sort((a, b) => a - b);
const hkWorst = hkOffs[hkOffs.length - 1] ?? NaN;
const hkMedian = hkOffs[Math.floor(hkOffs.length / 2)] ?? NaN;
const hkPasses = hkWorst <= 0.05 && hkMedian <= 0.02;
console.log(
  `(1) Hilsenrath–Klein: worst ${(hkWorst * 100).toFixed(2)} %, median ${(hkMedian * 100).toFixed(2)} % — ${hkPasses ? 'PASSES' : 'FAILS'}`
);

// (2) and (3) the fine grid.
const minima = { gamma: Infinity, dpde: Infinity, c2: Infinity, fundamental: Infinity };
const where = { gamma: '', dpde: '', c2: '', fundamental: '' };
let fundamentalBeyond = Infinity;
let fundamentalBeyondWhere = '';
let negativeBeyond = 0;
let derivWorst = 0;
let derivWhere = '';
let points = 0;
airBlendedCounts.held = 0;
airBlendedCounts.clamped = 0;
const H = 1e-6;
function soundAt(e: number, rho: number): number {
  return Math.sqrt(stateOf(e, rho).c2);
}
for (let iy = 0; iy < 1100; iy++) {
  const y = -7.495 + iy / 100;
  const zh = airEffectiveEdge(y).z;
  for (let iz = 0; iz <= 2350; iz++) {
    const z = -0.499 + iz / 500;
    points++;
    const rho = AIR_RHO0 * 10 ** y;
    const e = RT0 * 10 ** z;
    const g = gammaOf(y, z);
    const s = stateOf(e, rho);
    const at = `Y ${y.toFixed(2)}, Z ${z.toFixed(3)}`;
    const dpdeRel = s.dpde / (g.f - 1);
    const c2Rel = s.c2 / (e * g.f * (g.f - 1));
    // 𝒢 = 1 + (ρ/c)(∂c/∂ρ)_s, the isentrope de = (p/ρ²)dρ.
    // One-sided where a central difference would straddle the clamp's lines
    // Y = −7 and 3 (rule 1337 (a)).
    const eps = 1e-4;
    const de = (s.p / rho) * eps;
    const isClamped = (v: number): boolean => v < -7 || v > 3;
    const up = isClamped(Math.log10((rho * (1 + eps)) / AIR_RHO0)) === isClamped(y) ? 1 : 0;
    const down = isClamped(Math.log10((rho * (1 - eps)) / AIR_RHO0)) === isClamped(y) ? 1 : 0;
    const cPlus = up ? soundAt(e + de, rho * (1 + eps)) : Math.sqrt(s.c2);
    const cMinus = down ? soundAt(e - de, rho * (1 - eps)) : Math.sqrt(s.c2);
    const fundamental = 1 + (cPlus - cMinus) / ((up + down) * eps * Math.sqrt(s.c2));
    const beyond = z > zh;
    if (beyond) {
      if (!(fundamental > 0)) negativeBeyond++;
      if (!(fundamental >= fundamentalBeyond)) {
        fundamentalBeyond = fundamental;
        fundamentalBeyondWhere = at;
      }
    }
    const checks: [keyof typeof minima, number][] = [
      ['gamma', g.f - 1],
      ['dpde', dpdeRel],
      ['c2', c2Rel],
      ...(beyond ? [] : [['fundamental', fundamental] as [keyof typeof minima, number]]),
    ];
    for (const [k, v] of checks)
      if (!(v >= minima[k])) {
        minima[k] = v;
        where[k] = at;
      }
    const fy = (gammaOf(y + H, z).f - gammaOf(y - H, z).f) / (2 * H);
    const fz = (gammaOf(y, z + H).f - gammaOf(y, z - H).f) / (2 * H);
    // At the clamp's own ends (Y = −7, 3) the derivative in Y is one-sided.
    const onClampEnd = Math.abs(y + 7) < 1e-9 || Math.abs(y - 3) < 1e-9;
    const scale = Math.max(1, Math.abs(g.fY), Math.abs(g.fZ));
    const off = Math.max(onClampEnd ? 0 : Math.abs(fy - g.fY), Math.abs(fz - g.fZ)) / scale;
    if (off > derivWorst) {
      derivWorst = off;
      derivWhere = at;
    }
  }
}
const gridPasses = minima.gamma > 0 && minima.dpde > 0 && minima.c2 > 0 && minima.fundamental > 0;
const derivPasses = derivWorst <= 1e-5;
console.log(
  `(2) ${String(points)} points: min γ̃ − 1 ${minima.gamma.toPrecision(4)} (${where.gamma}), min (∂p/∂e)/[ρ(γ̃ − 1)] ${minima.dpde.toPrecision(4)} (${where.dpde}), min c²/[eγ̃(γ̃ − 1)] ${minima.c2.toPrecision(4)} (${where.c2}), min 𝒢 at and below Z_h ${minima.fundamental.toPrecision(4)} (${where.fundamental}) — ${gridPasses ? 'PASSES' : 'FAILS'}; beyond Z_h (not claimed) min 𝒢 ${fundamentalBeyond.toPrecision(4)} (${fundamentalBeyondWhere}), 𝒢 ≤ 0 at ${String(negativeBeyond)} points; continued ${String(airBlendedCounts.held)}, clamped ${String(airBlendedCounts.clamped)} evaluations`
);
console.log(
  `(3) derivatives against central differences: worst ${derivWorst.toExponential(2)} (${derivWhere}) — ${derivPasses ? 'PASSES' : 'FAILS'}`
);

// (4) the entropy wave.
function eos(e: number, rho: number): { p: number; c2: number; pe: number } {
  const s = stateOf(e, rho);
  return { p: s.p, c2: s.c2, pe: rho * s.dpde };
}
function eOf(p: number, rho: number, guess: number): number {
  let e = guess;
  for (let it = 0; it < 40; it++) {
    const s = eos(e, rho);
    const de = (s.p - p) / s.pe;
    e -= de;
    if (Math.abs(de) < 1e-14 * e) break;
  }
  return e;
}
function weno(a: number, b: number, c: number, d: number, e: number): number {
  const q0 = (2 * a - 7 * b + 11 * c) / 6;
  const q1 = (-b + 5 * c + 2 * d) / 6;
  const q2 = (2 * c + 5 * d - e) / 6;
  const b0 = (13 / 12) * (a - 2 * b + c) ** 2 + 0.25 * (a - 4 * b + 3 * c) ** 2;
  const b1 = (13 / 12) * (b - 2 * c + d) ** 2 + 0.25 * (b - d) ** 2;
  const b2 = (13 / 12) * (c - 2 * d + e) ** 2 + 0.25 * (3 * c - 4 * d + e) ** 2;
  const tau = Math.abs(b0 - b2);
  const w0 = 0.1 * (1 + tau / (b0 + 1e-40));
  const w1 = 0.6 * (1 + tau / (b1 + 1e-40));
  const w2 = 0.3 * (1 + tau / (b2 + 1e-40));
  return (w0 * q0 + w1 * q1 + w2 * q2) / (w0 + w1 + w2);
}
function entropyWave(n: number): number {
  const L = 100;
  const dx = L / n;
  const G = 3;
  const N = n + 2 * G;
  const P0 = 10 * 101_325;
  const U0 = 100;
  const rho = new Float64Array(N);
  const mom = new Float64Array(N);
  const en = new Float64Array(N);
  const eCell = new Float64Array(N);
  for (let i = G; i < n + G; i++) {
    const x = (i - G + 0.5) * dx;
    const e = RT0 * 10 ** (1.4 + 0.6 * Math.exp(-(((x - 50) / 15) ** 2)));
    let r = P0 / (0.25 * e);
    for (let it = 0; it < 80; it++) r = P0 / (e * (stateOf(e, r).gamma - 1));
    rho[i] = r;
    mom[i] = r * U0;
    en[i] = r * e + 0.5 * r * U0 * U0;
  }
  const wr = new Float64Array(N);
  const wu = new Float64Array(N);
  const wp = new Float64Array(N);
  const wc2 = new Float64Array(N);
  const D = [new Float64Array(N), new Float64Array(N), new Float64Array(N)] as const;
  const F = [0, 0, 0];
  function hllc(
    rL: number,
    uL: number,
    pL: number,
    eL: number,
    cL: number,
    rR: number,
    uR: number,
    pR: number,
    eR: number,
    cR: number
  ): void {
    const EL = rL * eL + 0.5 * rL * uL * uL;
    const ER = rR * eR + 0.5 * rR * uR * uR;
    const sL = Math.min(uL - cL, uR - cR);
    const sR = Math.max(uL + cL, uR + cR);
    if (sL >= 0) {
      F[0] = rL * uL;
      F[1] = rL * uL * uL + pL;
      F[2] = uL * (EL + pL);
      return;
    }
    if (sR <= 0) {
      F[0] = rR * uR;
      F[1] = rR * uR * uR + pR;
      F[2] = uR * (ER + pR);
      return;
    }
    const aL = rL * (sL - uL);
    const aR = rR * (sR - uR);
    const s = (pR - pL + uL * aL - uR * aR) / (aL - aR);
    const left = s >= 0;
    const r = left ? rL : rR;
    const u = left ? uL : uR;
    const p = left ? pL : pR;
    const E = left ? EL : ER;
    const sK = left ? sL : sR;
    const a = left ? aL : aR;
    const f = a / (sK - s);
    F[0] = r * u + sK * (f - r);
    F[1] = r * u * u + p + sK * (f * s - r * u);
    F[2] = u * (E + p) + sK * (f * (E / r + (s - u) * (s + p / a)) - E);
  }
  const x1 = new Float64Array(6);
  const x2 = new Float64Array(6);
  const x3 = new Float64Array(6);
  function rhs(): number {
    let fast = 0;
    for (let i = G; i < n + G; i++) {
      const r = rho[i] ?? 0;
      const u = (mom[i] ?? 0) / r;
      const e = ((en[i] ?? 0) - 0.5 * r * u * u) / r;
      const s = eos(e, r);
      wr[i] = r;
      wu[i] = u;
      wp[i] = s.p;
      wc2[i] = s.c2;
      eCell[i] = e;
      fast = Math.max(fast, Math.abs(u) + Math.sqrt(s.c2));
    }
    for (let g = 1; g <= G; g++)
      for (const w of [wr, wu, wp, wc2, eCell]) {
        w[G - g] = w[n + G - g] ?? 0;
        w[n + G - 1 + g] = w[G + g - 1] ?? 0;
      }
    for (const d of D) d.fill(0);
    for (let f = G; f <= n + G; f++) {
      const l = f - 1;
      const rr = f;
      const ra = 0.5 * ((wr[l] ?? 0) + (wr[rr] ?? 0));
      const c2 = 0.5 * ((wc2[l] ?? 0) + (wc2[rr] ?? 0));
      const zz = ra * Math.sqrt(c2);
      for (let j = 0; j < 6; j++) {
        const i = l - 2 + j;
        x1[j] = (wp[i] ?? 0) - zz * (wu[i] ?? 0);
        x2[j] = c2 * (wr[i] ?? 0) - (wp[i] ?? 0);
        x3[j] = (wp[i] ?? 0) + zz * (wu[i] ?? 0);
      }
      const at = (x: Float64Array, k: number): number => x[k] ?? 0;
      const a1 = weno(at(x1, 0), at(x1, 1), at(x1, 2), at(x1, 3), at(x1, 4));
      const a2 = weno(at(x2, 0), at(x2, 1), at(x2, 2), at(x2, 3), at(x2, 4));
      const a3 = weno(at(x3, 0), at(x3, 1), at(x3, 2), at(x3, 3), at(x3, 4));
      const b1 = weno(at(x1, 5), at(x1, 4), at(x1, 3), at(x1, 2), at(x1, 1));
      const b2 = weno(at(x2, 5), at(x2, 4), at(x2, 3), at(x2, 2), at(x2, 1));
      const b3 = weno(at(x3, 5), at(x3, 4), at(x3, 3), at(x3, 2), at(x3, 1));
      const pL = 0.5 * (a1 + a3);
      const uL = (a3 - a1) / (2 * zz);
      const rL = (a2 + pL) / c2;
      const pR = 0.5 * (b1 + b3);
      const uR = (b3 - b1) / (2 * zz);
      const rR = (b2 + pR) / c2;
      // Rule 1334 (b): the face's e by Newton from the upwind cell's.
      const eL = eOf(pL, rL, eCell[l] ?? 0);
      const eR = eOf(pR, rR, eCell[rr] ?? 0);
      hllc(rL, uL, pL, eL, Math.sqrt(eos(eL, rL).c2), rR, uR, pR, eR, Math.sqrt(eos(eR, rR).c2));
      for (const [q, d] of D.entries()) {
        const flux = (F[q] ?? 0) / dx;
        if (l >= G) d[l] = (d[l] ?? 0) - flux;
        if (rr < n + G) d[rr] = (d[rr] ?? 0) + flux;
      }
    }
    return fast;
  }
  const U: Float64Array[] = [rho, mom, en];
  const K: Float64Array[] = [new Float64Array(N), new Float64Array(N), new Float64Array(N)];
  const Ds: Float64Array[] = [...D];
  const tEnd = L / U0;
  let t = 0;
  let worstEver = 0;
  const stages = [
    [0, 1],
    [0.75, 0.25],
    [1 / 3, 2 / 3],
  ] as const;
  while (t < tEnd - 1e-12) {
    for (const [q, k] of K.entries()) k.set(U[q] ?? k);
    let dt = 0;
    for (const [s, [keep, add]] of stages.entries()) {
      const fast = rhs();
      if (s === 0) dt = Math.min((0.4 * dx) / fast, tEnd - t);
      for (const [q, u] of U.entries()) {
        const k = K[q] ?? u;
        const d = Ds[q] ?? u;
        for (let i = G; i < n + G; i++)
          u[i] = keep * (k[i] ?? 0) + add * ((u[i] ?? 0) + dt * (d[i] ?? 0));
      }
    }
    t += dt;
    for (let i = G; i < n + G; i++) {
      const r = rho[i] ?? 0;
      const u = (mom[i] ?? 0) / r;
      worstEver = Math.max(
        worstEver,
        Math.abs(eos(((en[i] ?? 0) - 0.5 * r * u * u) / r, r).p / P0 - 1)
      );
    }
  }
  return worstEver;
}
const waveCells = [100, 200, 400, 800];
const wave = waveCells.map((n) => entropyWave(n));
const waveOrders = wave.slice(1).map((v, k) => Math.log2((wave[k] ?? NaN) / v));
const wavePasses = wave.every((v, k) => k === 0 || v < (wave[k - 1] ?? 0));
console.log(
  `(4) entropy wave, max |Δp|/p over the run on ${waveCells.join(', ')} cells: ${wave.map((v) => v.toExponential(2)).join(', ')}; orders ${waveOrders.map((o) => o.toFixed(2)).join(', ')} — ${wavePasses ? 'PASSES' : 'FAILS'}`
);

// (5) Rule 1347 (d), the table only: against the blended function at
// 300 000 points (a fixed seed), γ̃ − 1 within 10⁻³ and c² within 2 %.
let tableGamma = 0;
let tableC2 = 0;
let tableWhere = '';
let seed = 20260927;
const random = (): number => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
if (useTable)
  for (let k = 0; k < 300_000; k++) {
    const y = -7 + 10 * random();
    const z = 0.58 + 3.9 * random();
    const rho = AIR_RHO0 * 10 ** y;
    const e = RT0 * 10 ** z;
    const a = airBlended(e, rho);
    const b = airTabled(e, rho);
    const dg = Math.abs((b.gamma - 1) / (a.gamma - 1) - 1);
    const dc = Math.abs(b.c2 / a.c2 - 1);
    if (dg > tableGamma) tableGamma = dg;
    if (dc > tableC2) {
      tableC2 = dc;
      tableWhere = `Y ${y.toFixed(3)}, Z ${z.toFixed(3)}`;
    }
  }
const tablePasses = !useTable || (tableGamma <= 1e-3 && tableC2 <= 0.02);
if (useTable)
  console.log(
    `(5) the table against the blended function: γ̃ − 1 within ${tableGamma.toExponential(2)}, c² within ${tableC2.toExponential(2)} (${tableWhere}) — ${tablePasses ? 'PASSES' : 'FAILS'}`
  );

// The cost of one evaluation (rule 1334 (d)), measured apart.
const reps = 200_000;
let sink = 0;
const started = performance.now();
for (let k = 0; k < reps; k++) sink += stateOf(1e6 * (1 + (k % 97) / 97), 1.2).p;
const nsPerState = ((performance.now() - started) * 1e6) / reps;
console.log(`cost: ${nsPerState.toFixed(0)} ns a hot state (${String(sink > 0)})`);

const passes = hkPasses && gridPasses && derivPasses && wavePasses && tablePasses;
console.log(`blended equation of state ${passes ? 'PASSES' : 'FAILS'}`);
writeFileSync(
  useTable
    ? 'src/physics/validation/verifyAirEosTable.json'
    : 'src/physics/validation/verifyAirEosBlended.json',
  `${JSON.stringify(
    {
      rule: useTable ? '1334 (a)(7), 1347 (d)' : '1334 (a)(7), 1336, 1337, 1338',
      ...(useTable
        ? { table: { gamma: tableGamma, c2: tableC2, where: tableWhere, passes: tablePasses } }
        : {}),
      hilsenrathKlein: { worst: hkWorst, median: hkMedian, passes: hkPasses },
      grid: {
        points,
        minima,
        where,
        fundamentalBeyond: {
          least: fundamentalBeyond,
          where: fundamentalBeyondWhere,
          nonPositive: negativeBeyond,
        },
        continued: airBlendedCounts.held,
        clamped: airBlendedCounts.clamped,
        passes: gridPasses,
      },
      derivatives: { worst: derivWorst, where: derivWhere, passes: derivPasses },
      entropyWave: { cells: waveCells, maxDeltaP: wave, orders: waveOrders, passes: wavePasses },
      passes,
    },
    null,
    2
  )}\n`
);
