/**
 * Rule 1352 (b) (`src/physics/validation/blastSolverRules.ts`): the GPU's
 * ideal gas to the bit across real air's entry into the kernels. Three short
 * GPU runs — T2's 1 kt hemisphere on 20 m cells, the same in the isothermal
 * atmosphere, and a burst at 2 km on 20 m cells — each to a fixed end time;
 * the SHA-256 of their recorded peaks, ranges, peak times and step counts.
 *
 *   pnpm exec tsx scripts/verify-blast-gpu-v7.ts baseline   (before the change)
 *   pnpm exec tsx scripts/verify-blast-gpu-v7.ts check
 *
 * baseline writes blastGpuV7Baseline.json; check compares, and runs each case
 * twice first to show the GPU's runs are themselves reproducible.
 */

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { withGpuPage } from './blast2d-gpu.js';

const BASELINE = 'src/physics/validation/blastGpuV7Baseline.json';
const uniform = { kind: 'uniform', rho0: 1.225, p0: 101_325 };
const isothermal = { kind: 'isothermal', rho0: 1.225, p0: 101_325, g: 9.80665 };
const CASES: Record<string, { c: Record<string, unknown>; tEnd: number }> = {
  t2: {
    c: {
      atmosphere: uniform,
      energy: 4.184e12,
      height: 0,
      radius: 45,
      dx: 20,
      rMax: 1_000,
      zMax: 800,
      limiter: 'has',
    },
    tEnd: 0.8,
  },
  t2Isothermal: {
    c: {
      atmosphere: isothermal,
      energy: 4.184e12,
      height: 0,
      radius: 45,
      dx: 20,
      rMax: 1_000,
      zMax: 800,
      limiter: 'has',
    },
    tEnd: 0.8,
  },
  aloft: {
    c: {
      atmosphere: isothermal,
      energy: 4.184e13,
      height: 2_000,
      radius: 100,
      dx: 20,
      rMax: 1_500,
      zMax: 3_000,
      limiter: 'has',
    },
    tEnd: 1.5,
  },
};

async function hashOf(name: string): Promise<string> {
  const { c, tEnd } = CASES[name] ?? { c: {}, tEnd: 0 };
  const out = (await withGpuPage(async (page) =>
    page.evaluate(async ([cc, t]) => window.blast2dGpu?.runCaseGpu(cc as never, t), [
      c,
      tEnd,
    ] as const)
  )) as unknown as { peaks: number[]; ranges: number[]; peakTimes: number[]; steps: number };
  return createHash('sha256')
    .update(JSON.stringify([out.peaks, out.ranges, out.peakTimes, out.steps]))
    .digest('hex');
}

const mode = process.argv[2] ?? 'check';
const names = Object.keys(CASES);
if (mode === 'baseline') {
  const commit = execSync('git rev-parse --short HEAD').toString().trim();
  const hashes: Record<string, string> = {};
  for (const n of names) {
    const a = await hashOf(n);
    const b = await hashOf(n);
    if (a !== b) throw new Error(`gpu v7: ${n} is not reproducible on the GPU`);
    hashes[n] = a;
  }
  writeFileSync(BASELINE, `${JSON.stringify({ rule: '1352 (b)', commit, hashes }, null, 2)}\n`);
  console.log(`baseline on ${commit}, each case run twice:`, hashes);
} else {
  const base = JSON.parse(readFileSync(BASELINE, 'utf8')) as {
    commit: string;
    hashes: Record<string, string>;
  };
  let all = true;
  for (const n of names) {
    const same = (await hashOf(n)) === base.hashes[n];
    all = all && same;
    console.log(`${n}: ${same ? 'the same' : 'DIFFERENT'} as on ${base.commit}`);
  }
  console.log(all ? 'PASSES' : 'FAILS');
}
