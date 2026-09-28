/**
 * Rules 1333 (c) and 1352 (c) (`src/physics/validation/blastSolverRules.ts`):
 * C1's two-dimensional check. The free-air burst of 1 kt as the ground's
 * mirror — W/2 in the half space, the 40 m hot sphere, uniform real air, no
 * gravity — on the GPU, against the one-dimensional run at the same cell
 * (`scripts/blast1d-c1-runs.ts`): the ground row's peak at r (the cell
 * centres at height dx/2) against the one-dimensional peak at √(r² +
 * (dx/2)²), within 1 % at C1's ranges read for f_b = 0.600 and 0.936
 * (R/f_b^(1/3)); on 5, 2.5 and 1.25 m, the domain 2.7 km.
 *
 *   pnpm exec tsx scripts/verify-blast-c1-2d.ts [5,2.5,1.25]
 *
 * The GPU runs cached in scripts/tmp/blast2d-c1/; writes
 * src/physics/validation/verifyBlastC1TwoD.json.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { withGpuPage } from './blast2d-gpu.js';

const GRIDS = (process.argv[2] ?? '5,2.5,1.25').split(',').map(Number);
const C1_RANGES = [100, 150, 200, 300, 500, 700, 1_000, 1_500, 2_000];
const SHARES = [0.6, 0.936];
const CACHE = 'scripts/tmp/blast2d-c1';
mkdirSync(CACHE, { recursive: true });

interface Run2D {
  ranges: number[];
  peaks: number[];
  steps: number;
  seconds: number;
  newtonResiduals?: number;
}
async function run2d(dx: number): Promise<Run2D> {
  const file = `${CACHE}/c1-2d-${String(dx)}.json`;
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')) as Run2D;
  const c = {
    atmosphere: { kind: 'uniform', rho0: 1.225, p0: 101_325 },
    energy: 4.184e12 / 2,
    height: 0,
    radius: 40,
    dx,
    rMax: 2_700,
    zMax: 2_700,
    soundFloor: 1.1,
    limiter: 'has',
    eos: 'air',
  };
  const out = (await withGpuPage(async (page) =>
    page.evaluate(async (cc) => window.blast2dGpu?.runCaseGpu(cc as never), c)
  )) as unknown as Run2D;
  writeFileSync(file, `${JSON.stringify(out)}\n`);
  console.log(`${String(dx)} m: ${String(out.steps)} steps, ${out.seconds.toFixed(0)} s`);
  return out;
}

const between = (xs: number[], ys: number[], x: number): number => {
  let k = 0;
  while (k + 2 < xs.length && (xs[k + 1] ?? Infinity) < x) k++;
  const x0 = xs[k] ?? NaN;
  const x1 = xs[k + 1] ?? NaN;
  return (ys[k] ?? NaN) + (((ys[k + 1] ?? NaN) - (ys[k] ?? NaN)) * (x - x0)) / (x1 - x0);
};

const rows = [];
let passes = true;
for (const dx of GRIDS) {
  const two = await run2d(dx);
  const file = `scripts/tmp/blast1d-c1/c1-air-${String(dx)}-40.json`;
  if (!existsSync(file)) throw new Error(`C1 2D: no one-dimensional run at ${String(dx)} m`);
  const one = JSON.parse(readFileSync(file, 'utf8')) as { cells: [number, number, number][] };
  const rs = one.cells.map((c) => c[0]);
  const ps = one.cells.map((c) => c[1]);
  for (const fb of SHARES)
    for (const range of C1_RANGES) {
      const r = range / Math.cbrt(fb);
      const p2 = between(two.ranges, two.peaks, r);
      const p1 = between(rs, ps, Math.hypot(r, dx / 2));
      const off = p2 / p1 - 1;
      const within = Math.abs(off) <= 0.01;
      passes = passes && within;
      rows.push({ dx, fb, range, r, twoD: p2, oneD: p1, off, within });
    }
  const worst = Math.max(...rows.filter((x) => x.dx === dx).map((x) => Math.abs(x.off)));
  console.log(
    `${String(dx)} m: the 2D against the 1D within ${(worst * 100).toFixed(2)} % at C1's ranges (Newton residuals ${String(two.newtonResiduals)})`
  );
}
console.log(`C1's two-dimensional check ${passes ? 'PASSES' : 'FAILS'} on ${GRIDS.join(', ')} m`);
if (GRIDS.length === 3)
  writeFileSync(
    'src/physics/validation/verifyBlastC1TwoD.json',
    `${JSON.stringify({ rule: '1333 (c), 1352 (c)', grids: GRIDS, rows, passes }, null, 2)}\n`
  );
