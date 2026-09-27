/**
 * Rules 1334 (c) V8 and 1346 (`src/physics/validation/blastSolverRules.ts`):
 * a contact at constant pressure carried through every blend of the real-air
 * equation of state. Entropy waves at constant p, u = 100 m/s along z, Z =
 * 0.4 + (Z_top − 0.4)·exp(−((z − 120)/15)²): (I) 30 atm to Z 2.6, (II) 1 atm
 * to 3.0, (III) 10⁻⁴ atm to 3.2, (IV) 10⁻⁵ atm to 1.2, planar on 4 columns
 * (2, 1, 0.5, 0.25 m cells over 200 m); (V) wave II as a ring about r = 30 m
 * (4, 2, 1, 0.5 m cells, 60 m × 200 m). Read at t = 0.15 s above 80 m and
 * below 190 m: max |p/p₀ − 1| falling with an observed order of at least 2
 * between the two finest grids.
 *
 *   pnpm exec tsx scripts/verify-blast-v8.ts [I,II,III,IV,V]
 *
 * Writes src/physics/validation/verifyBlastV8.json.
 */

import { writeFileSync } from 'node:fs';
import { airTabled, rp1181 } from '../src/physics/solvers/blast2d/airEos.js';
import { uniformAtmosphere } from '../src/physics/solvers/blast2d/atmosphere.js';
import { BlastSolver2D } from '../src/physics/solvers/blast2d/solver.js';

const ATM = 101_325;
const U = 100;
const T_END = 0.15;
const HEIGHT = 200;

interface Wave {
  name: string;
  pAtm: number;
  zTop: number;
  ring: boolean;
}
const WAVES: Wave[] = [
  { name: 'I', pAtm: 30, zTop: 2.6, ring: false },
  { name: 'II', pAtm: 1, zTop: 3.0, ring: false },
  { name: 'III', pAtm: 1e-4, zTop: 3.2, ring: false },
  { name: 'IV', pAtm: 1e-5, zTop: 1.2, ring: false },
  { name: 'V', pAtm: 1, zTop: 3.0, ring: true },
];
const wanted = (process.argv[2] ?? 'I,II,III,IV,V').split(',');

/** Z at (r, z) for a wave. */
function zAt(w: Wave, r: number, z: number): number {
  const d2 = w.ring ? (r - 30) ** 2 + (z - 120) ** 2 : (z - 120) ** 2;
  return 0.4 + (w.zTop - 0.4) * Math.exp(-d2 / 15 ** 2);
}

/** ρ at pressure p and specific energy e (fixed point on γ̃). */
function rhoAt(p: number, e: number): number {
  let r = p / (0.4 * e);
  for (let it = 0; it < 200; it++) {
    const next = p / (e * (airTabled(e, r).gamma - 1));
    if (Math.abs(next - r) <= 1e-15 * r) return next;
    r = next;
  }
  return r;
}

function run(w: Wave, dx: number): { error: number; steps: number } {
  const p = w.pAtm * ATM;
  const nr = w.ring ? Math.round(60 / dx) : 4;
  const nz = Math.round(HEIGHT / dx);
  const eBg = rp1181.RT0 * 10 ** 0.4;
  const solver = new BlastSolver2D({ nr, nz, dx }, uniformAtmosphere(rhoAt(p, eBg), p), {
    limiter: 'has',
    eos: 'air',
  });
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nr; i++) {
      // Cell-centre values: the wave is smooth and the measure is pressure,
      // uniform in the exact solution whatever the averaging.
      const e = rp1181.RT0 * 10 ** zAt(w, (i + 0.5) * dx, (j + 0.5) * dx);
      const r = rhoAt(p, e);
      const k = solver.index(i, j);
      solver.rho[k] = r;
      solver.mr[k] = 0;
      solver.mz[k] = r * U;
      solver.en[k] = r * e + 0.5 * r * U * U;
    }
  while (solver.time < T_END) solver.step(T_END - solver.time);
  let error = 0;
  for (let j = 0; j < nz; j++) {
    const zc = (j + 0.5) * dx;
    if (zc < 80 || zc > 190) continue;
    for (let i = 0; i < nr; i++) error = Math.max(error, Math.abs(solver.pressure(i, j) / p - 1));
  }
  return { error, steps: solver.steps };
}

const results = [];
let allPass = true;
for (const w of WAVES) {
  if (!wanted.includes(w.name)) continue;
  const grids = w.ring ? [4, 2, 1, 0.5] : [2, 1, 0.5, 0.25];
  const rows = grids.map((dx) => {
    const r = run(w, dx);
    console.log(
      `(${w.name}) ${String(dx)} m: max |Δp|/p ${r.error.toExponential(3)}, ${String(r.steps)} steps`
    );
    return { dx, ...r };
  });
  const orders = rows.slice(1).map((r, k) => Math.log2((rows[k]?.error ?? NaN) / r.error));
  const passes = (orders[orders.length - 1] ?? 0) >= 2;
  allPass = allPass && passes;
  console.log(
    `(${w.name}) orders ${orders.map((o) => o.toFixed(2)).join(', ')} — ${passes ? 'PASSES' : 'FAILS'}`
  );
  results.push({ ...w, rows, orders, passes });
}
console.log(
  `V8 ${
    allPass
      ? 'PASSES'
      : `FAILS (${results
          .filter((r) => !r.passes)
          .map((r) => r.name)
          .join(', ')})`
  }`
);
if (wanted.length === WAVES.length)
  writeFileSync(
    'src/physics/validation/verifyBlastV8.json',
    `${JSON.stringify({ rule: '1334 (c) V8, 1346', uMs: U, tEnd: T_END, waves: results, passes: allPass }, null, 2)}\n`
  );
