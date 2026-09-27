/**
 * Rule 1334 (c) V7 (`src/physics/validation/blastSolverRules.ts`): the cold
 * limit, to the bit. Five short cases on the CPU — an acoustic pulse, Sod's
 * tube along z, a Lamb ring in the isothermal atmosphere, a weak shock
 * (Mach 1.3) along z, and a short T2 (1 kt in a 45 m hemisphere) — each
 * hashed (SHA-256 of ρ, ρu, ρv, E, the ground's peaks and the time) after a
 * fixed number of steps.
 *
 *   pnpm exec tsx scripts/verify-blast-v7.ts baseline   (on the code before the
 *       equation of state's interface: writes blastV7Baseline.json)
 *   pnpm exec tsx scripts/verify-blast-v7.ts check
 *
 * check: (i) with the ideal gas every case hashes as the baseline; (ii) with
 * real air the cases that stay below Z = 0.58 (pulse, Lamb, weak shock) hash
 * as the ideal gas's; (iii) T2 in ideal and in real air, the difference in
 * the ground's peaks reported. Writes verifyBlastV7.json.
 */

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import {
  isothermalAtmosphere,
  uniformAtmosphere,
} from '../src/physics/solvers/blast2d/atmosphere.js';
import { BlastSolver2D, type BlastOptions } from '../src/physics/solvers/blast2d/solver.js';

type Eos = 'ideal' | 'air';
const RHO = 1.225;
const P0 = 101_325;
const GAMMA = 1.4;
const C = Math.sqrt((GAMMA * P0) / RHO);
const BASELINE = 'src/physics/validation/blastV7Baseline.json';

function solverFor(
  grid: { nr: number; nz: number; dx: number },
  atmosphere: ReturnType<typeof uniformAtmosphere>,
  eos: Eos
): BlastSolver2D {
  // The ideal gas is the default: its options are left exactly as before.
  const options: BlastOptions = eos === 'ideal' ? { limiter: 'has' } : { limiter: 'has', eos };
  return new BlastSolver2D(grid, atmosphere, options);
}

function hash(s: BlastSolver2D): string {
  const h = createHash('sha256');
  for (const a of [s.rho, s.mr, s.mz, s.en, s.groundPeak])
    h.update(new Uint8Array(a.buffer, a.byteOffset, a.byteLength));
  h.update(new Uint8Array(Float64Array.of(s.time).buffer));
  return h.digest('hex');
}

function pulse(eos: Eos): BlastSolver2D {
  const dx = 12.5;
  const n = 56;
  const s = solverFor({ nr: n, nz: n, dx }, uniformAtmosphere(RHO, P0), eos);
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const p = 1e-4 * P0 * Math.exp(-((Math.hypot((i + 0.5) * dx, (j + 0.5) * dx) / 100) ** 2));
      const k = s.index(i, j);
      s.rho[k] = RHO + p / (C * C);
      s.en[k] = (P0 + p) / (GAMMA - 1);
    }
  for (let n2 = 0; n2 < 40; n2++) s.step();
  return s;
}

function sod(eos: Eos): BlastSolver2D {
  const nz = 200;
  const s = solverFor({ nr: 4, nz, dx: 1 / nz }, uniformAtmosphere(1, 1), eos);
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < 4; i++) {
      const left = (j + 0.5) / nz < 0.5;
      const k = s.index(i, j);
      s.rho[k] = left ? 1 : 0.125;
      s.mr[k] = 0;
      s.mz[k] = 0;
      s.en[k] = (left ? 1 : 0.1) / (GAMMA - 1);
    }
  for (let n2 = 0; n2 < 60; n2++) s.step();
  return s;
}

function lamb(eos: Eos): BlastSolver2D {
  const dx = 250;
  const nr = 60;
  const nz = 40;
  const s = solverFor({ nr, nz, dx }, isothermalAtmosphere(RHO, P0, 9.80665), eos);
  const h = P0 / (RHO * 9.80665);
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nr; i++) {
      const r = (i + 0.5) * dx;
      const z = (j + 0.5) * dx;
      const p = 1e-5 * P0 * Math.exp(-(((r - 5000) / 2000) ** 2)) * Math.exp(-z / (GAMMA * h));
      const k = s.index(i, j);
      s.rho[k] = (s.rho[k] ?? 0) + p / (C * C);
      s.en[k] = (s.en[k] ?? 0) + p / (GAMMA - 1);
    }
  for (let n2 = 0; n2 < 40; n2++) s.step();
  return s;
}

function weakShock(eos: Eos): BlastSolver2D {
  const nz = 200;
  const dz = 1;
  const mach = 1.3;
  const g = GAMMA;
  const p1 = P0 * (1 + ((2 * g) / (g + 1)) * (mach * mach - 1));
  const rho1 = (RHO * ((g + 1) * mach * mach)) / ((g - 1) * mach * mach + 2);
  const v1 = mach * C * (1 - RHO / rho1);
  const s = solverFor({ nr: 4, nz, dx: dz }, uniformAtmosphere(RHO, P0), eos);
  for (let j = 0; j < 40; j++)
    for (let i = 0; i < 4; i++) {
      const k = s.index(i, j);
      s.rho[k] = rho1;
      s.mz[k] = rho1 * v1;
      s.en[k] = p1 / (g - 1) + 0.5 * rho1 * v1 * v1;
    }
  for (let n2 = 0; n2 < 60; n2++) s.step();
  return s;
}

function t2(eos: Eos): BlastSolver2D {
  const s = solverFor({ nr: 40, nz: 40, dx: 10 }, uniformAtmosphere(RHO, P0), eos);
  s.deposit({ energy: 4.184e12, height: 0, radius: 45 });
  for (let n2 = 0; n2 < 30; n2++) s.step();
  return s;
}

const cases = { pulse, sod, lamb, weakShock, t2 } as const;
const mode = process.argv[2] ?? 'check';

if (mode === 'baseline') {
  const commit = execSync('git rev-parse --short HEAD').toString().trim();
  const hashes = Object.fromEntries(Object.entries(cases).map(([n, f]) => [n, hash(f('ideal'))]));
  writeFileSync(
    BASELINE,
    `${JSON.stringify({ rule: '1334 (c) V7 (i)', commit, hashes }, null, 2)}\n`
  );
  console.log(`baseline on ${commit}:`, hashes);
} else {
  const base = JSON.parse(readFileSync(BASELINE, 'utf8')) as {
    commit: string;
    hashes: Record<string, string>;
  };
  const ideal = Object.fromEntries(Object.entries(cases).map(([n, f]) => [n, hash(f('ideal'))]));
  const same = Object.entries(ideal).map(([n, h]) => ({ case: n, same: h === base.hashes[n] }));
  const iPasses = same.every((x) => x.same);
  const cold = (['pulse', 'lamb', 'weakShock'] as const).map((n) => ({
    case: n,
    same: hash(cases[n]('air')) === ideal[n],
  }));
  const iiPasses = cold.every((x) => x.same);
  const a = t2('ideal');
  const b = t2('air');
  // Where the ideal gas's ground peak is at least 1 % of its largest: the
  // wave has arrived there on both.
  const top = Math.max(...a.groundPeak);
  const t2Rows: { r: number; ideal: number; air: number }[] = [];
  for (let i = 0; i < a.nr; i++) {
    const pa = a.groundPeak[i] ?? 0;
    if (pa >= 0.01 * top) t2Rows.push({ r: a.radius(i), ideal: pa, air: b.groundPeak[i] ?? 0 });
  }
  const worst = Math.max(...t2Rows.map((x) => Math.abs(x.air / x.ideal - 1)));
  console.log(`(i) ideal gas against ${base.commit}:`, same, iPasses ? 'PASSES' : 'FAILS');
  console.log('(ii) real air in the cold cases:', cold, iiPasses ? 'PASSES' : 'FAILS');
  console.log(
    `(iii) short T2 (30 steps), the ground's peaks where the ideal gas's reach 1 % of its largest, real air against ideal: worst ${(worst * 100).toFixed(1)} %; ${t2Rows
      .filter((_, k) => k % 4 === 0)
      .map(
        (x) => `${x.r.toFixed(0)} m ${(x.ideal / 1000).toFixed(0)}/${(x.air / 1000).toFixed(0)} kPa`
      )
      .join(', ')}; face Newton iterations ${String(b.faceIterations)}`
  );
  writeFileSync(
    'src/physics/validation/verifyBlastV7.json',
    `${JSON.stringify({ rule: '1334 (c) V7', baseline: base.commit, ideal: same, cold, t2: { rows: t2Rows, worst, faceIterations: b.faceIterations }, passes: iPasses && iiPasses }, null, 2)}\n`
  );
}
