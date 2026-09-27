/**
 * Rules 1295 (c) V3, 1314 and 1315 (`src/physics/validation/blastSolverRules.ts`):
 * Brode's point source. The ground burst of 1 kt read as the mirrored
 * free-air burst of 2 kt (ε = 435.5 m), started from the Taylor–Sedov
 * similarity solution with its shock 40 m out, on 5, 2.5 and 1.25 m cells
 * (GPU); the ground's recorded peak at λ = 1.0 … 2.8 against RM-1363's
 * Eq. 17, extrapolated from the three grids by rule 1256 (c), within 3 %.
 *
 *   pnpm exec tsx scripts/verify-blast-v3.ts [5,2.5,1.25]
 *
 * Writes src/physics/validation/verifyBlastV3.json (the runs cached in
 * scripts/tmp/blast2d-v3/).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withGpuPage } from './blast2d-gpu.js';

const P0 = 101_325;
const E = 4.184e12;
const EPS = Math.cbrt((2 * E) / P0);
const LAMBDAS = [1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8];
const GRIDS = (process.argv[2] ?? '5,2.5,1.25').split(',').map(Number);
const CACHE = 'scripts/tmp/blast2d-v3';
const TOLERANCE = 0.03;

/** Brode's Eq. 17 (Pa). */
const brode = (l: number): number => (0.137 / l ** 3 + 0.119 / l ** 2 + 0.269 / l - 0.019) * P0;

interface Run {
  ranges: number[];
  peaks: number[];
  steps: number;
  seconds: number;
}

async function run(dx: number): Promise<Run> {
  mkdirSync(CACHE, { recursive: true });
  const file = join(CACHE, `v3-${String(dx)}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')) as Run;
  const c = {
    atmosphere: { kind: 'uniform', rho0: 1.225, p0: P0 },
    energy: E,
    height: 0,
    radius: 40,
    sedovShock: 40,
    dx,
    rMax: 1_250,
    zMax: 1_250,
    soundFloor: 1.1,
    limiter: 'has',
  };
  const out = (await withGpuPage(async (page) =>
    page.evaluate(async (cc) => window.blast2dGpu?.runCaseGpu(cc as never), c)
  )) as unknown as Run;
  writeFileSync(file, `${JSON.stringify(out)}\n`);
  console.log(`${String(dx)} m: ${String(out.steps)} steps, ${out.seconds.toFixed(0)} s`);
  return out;
}

/** The peak at range r, linearly between the rings' centres; and rule
 *  1311 (d)'s uncertainty there (half the local |second difference|). */
function readAt(r: Run, range: number): { value: number; uncertainty: number } {
  const { ranges, peaks } = r;
  let i = 0;
  while (i + 2 < ranges.length && (ranges[i + 1] ?? Infinity) < range) i++;
  const a = ranges[i] ?? 0;
  const b = ranges[i + 1] ?? 1;
  const pa = peaks[i] ?? 0;
  const pb = peaks[i + 1] ?? 0;
  const value = pa + ((pb - pa) * (range - a)) / (b - a);
  const second = (k: number): number =>
    Math.abs((peaks[k - 1] ?? 0) - 2 * (peaks[k] ?? 0) + (peaks[k + 1] ?? 0));
  return { value, uncertainty: 0.5 * Math.max(second(i), second(i + 1)) };
}

const runs: Run[] = [];
for (const dx of GRIDS) runs.push(await run(dx));

const rows = LAMBDAS.map((l) => {
  const reads = runs.map((r) => readAt(r, l * EPS));
  const v = reads.map((x) => x.value);
  const want = brode(l);
  const [r1, r2, r3] = v;
  let extrapolated: number | null = null;
  let order: number | null = null;
  let judged: number;
  let band: number;
  if (r1 !== undefined && r2 !== undefined && r3 !== undefined) {
    const d1 = r1 - r2;
    const d2 = r2 - r3;
    if (d1 * d2 > 0 && Math.abs(d1) > Math.abs(d2)) {
      order = Math.log2(d1 / d2);
      extrapolated = r3 + (r3 - r2) / (2 ** order - 1);
      judged = extrapolated;
      band = 0;
    } else {
      judged = r3;
      band = Math.abs(d2);
    }
  } else {
    judged = v[v.length - 1] ?? NaN;
    band = 0;
  }
  const off = judged / want - 1;
  const within = Math.abs(off) + band / want <= TOLERANCE;
  return {
    lambda: l,
    brodeKPa: want / 1000,
    gridsKPa: v.map((x) => x / 1000),
    uncertaintyKPa: reads.map((x) => x.uncertainty / 1000),
    order,
    extrapolatedKPa: extrapolated === null ? null : extrapolated / 1000,
    bandKPa: band / 1000,
    off,
    within,
  };
});
for (const r of rows)
  console.log(
    `λ ${r.lambda.toFixed(1)}: Brode ${r.brodeKPa.toFixed(3)} kPa; grids ${r.gridsKPa.map((x) => x.toFixed(3)).join(' / ')} (± ${r.uncertaintyKPa.map((x) => x.toFixed(3)).join(' / ')}); order ${r.order === null ? '—' : r.order.toFixed(2)}; judged ${(r.off * 100).toFixed(2)} %${r.bandKPa > 0 ? ` ± ${r.bandKPa.toFixed(3)} kPa` : ''} — ${r.within ? 'within' : 'beyond'}`
  );
const passes = GRIDS.length === 3 && rows.every((r) => r.within);
console.log(`V3 ${passes ? 'PASSES' : 'FAILS'}`);
if (GRIDS.length === 3)
  writeFileSync(
    'src/physics/validation/verifyBlastV3.json',
    `${JSON.stringify({ rule: '1295 (c) V3, 1314, 1315', tolerance: TOLERANCE, grids: GRIDS, steps: runs.map((r) => r.steps), rows, passes }, null, 2)}\n`
  );
