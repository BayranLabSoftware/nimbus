/**
 * Rule 1270 (d) G1 (`src/physics/validation/blastSolverRules.ts`): the same
 * eight cases on the CPU (the reference, from the runs' cache) and on the GPU,
 * same grid — T2 at four heights on 20 m cells, T4's 5 Mt static and moving
 * and T3 at two heights on their coarse grids. Criterion: every reach at 1,
 * 2, 4 and 10 psi within 0.5 %, and the ground's peak overpressure within 1 %
 * wherever it exceeds 1 kPa. On rule 1277's limiter (rule 1278 (e)): each
 * case is the old batch's, with rule 1274's floor and the limiter added, its
 * CPU run made (or found) under the present code; the old scheme's outcome
 * is kept in blast2dG1.mood.json.
 *
 *   pnpm exec tsx scripts/blast2d-g1.ts
 *
 * Writes src/physics/validation/blast2dG1.json.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runPool } from './blast2d-pool.js';
import { reachOf, type BlastCase, type BlastRun } from './blast2d-run.js';
import { withGpuPage } from './blast2d-gpu.js';

const CACHE = 'scripts/tmp/blast2d-cache';
const S250 = Math.cbrt(250e3);
const S5 = Math.cbrt(5e3);
const near = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));

interface Want {
  label: string;
  match: (c: BlastCase) => boolean;
  /** The commit whose solver made the old batch's run (the cache is keyed
   *  to the code): d09d6aa for T2's and T4's runs, e6aed73 for T3's (made
   *  again with rule 1274's floor); only its case is used now. */
  commit: string;
}

/** The cache key `scripts/blast2d-pool.ts` gave a case under a commit's code
 *  ('disk': the files as they are). */
function keyAt(commit: string, c: BlastCase): string {
  const code = [
    'src/physics/solvers/blast2d/solver.ts',
    'src/physics/solvers/blast2d/atmosphere.ts',
    'scripts/blast2d-run.ts',
  ]
    .map((f) =>
      commit === 'disk'
        ? readFileSync(f, 'utf8')
        : execFileSync('git', ['show', `${commit}:${f}`], { encoding: 'utf8' })
    )
    .join('\n');
  return createHash('sha256').update(code).update(JSON.stringify(c)).digest('hex').slice(0, 16);
}
const wants: Want[] = [
  ...[0.0476, 0.1587, 0.4762, 0.9524].map((h) => ({
    label: `T2 1 kt at ${String(h)} km, 20 m`,
    commit: 'd09d6aa',
    match: (c: BlastCase) =>
      c.atmosphere.kind === 'uniform' && near(c.dx, 20) && near(c.height, h * 1_000),
  })),
  ...([0, 1 / 3] as const).map((k) => ({
    label: `T4 5 Mt ${k === 0 ? 'static' : 'moving'}, coarse`,
    commit: 'd09d6aa',
    match: (c: BlastCase) =>
      c.atmosphere.kind === 'isothermal' &&
      c.atmosphere.rho0 === 1 &&
      near(c.energy, 5e6 * 4.184e9) &&
      near(c.dx, 20 * S5) &&
      near(c.kineticShare ?? 0, k) &&
      c.radius > 100,
  })),
  ...[0.0476, 0.4762].map((h) => ({
    label: `T3 250 Mt at ${String(h)} km scaled, coarse`,
    commit: 'e6aed73',
    match: (c: BlastCase) =>
      c.atmosphere.kind === 'isothermal' &&
      c.atmosphere.rho0 !== 1 &&
      c.soundFloor === 1.1 &&
      near(c.dx, 20 * S250) &&
      near(c.height, h * 1_000 * S250) &&
      c.atmosphere.rho0 > 1.5,
  })),
];

const runs = readdirSync(CACHE).map((f) => ({
  file: f,
  run: JSON.parse(readFileSync(join(CACHE, f), 'utf8')) as BlastRun,
}));
const olds = wants.map((w) => {
  const found = runs.find(
    (r) => w.match(r.run.case) && r.file === `${keyAt(w.commit, r.run.case)}.json`
  );
  if (found === undefined || !existsSync(join(CACHE, found.file)))
    throw new Error(`no CPU run of ${w.commit} for ${w.label}`);
  return found.run.case;
});
// The same cases on rule 1277's limiter, with rule 1274's floor, as the
// batches from now on carry them (the floor last but for the limiter).
const cases: BlastCase[] = olds.map((c) => ({
  ...c,
  soundFloor: c.soundFloor ?? 1.1,
  limiter: 'has',
}));
const cpuRuns = await runPool(cases, CACHE, 4);
const pairs = wants.map((w, n) => {
  const cpu = cpuRuns[n];
  if (cpu === undefined) throw new Error(`no CPU run for ${w.label}`);
  return { label: w.label, cpu };
});

const results = await withGpuPage(async (page) => {
  const out = [];
  for (const p of pairs) {
    const gpu = (await page.evaluate(
      async (c) => window.blast2dGpu?.runCaseGpu(c as never),
      p.cpu.case as unknown
    )) as unknown as BlastRun & { seconds: number; adapter: string };
    const reaches = [1, 2, 4, 10].map((psi) => {
      const a = reachOf(p.cpu, psi * 6_894.757);
      const b = reachOf(gpu, psi * 6_894.757);
      return { psi, cpu: a, gpu: b, rel: a > 0 ? b / a - 1 : b > 0 ? Infinity : 0 };
    });
    let worstPeak = 0;
    for (let i = 0; i < Math.min(p.cpu.peaks.length, gpu.peaks.length); i++) {
      const a = p.cpu.peaks[i] ?? 0;
      if (a > 1_000) worstPeak = Math.max(worstPeak, Math.abs((gpu.peaks[i] ?? 0) / a - 1));
    }
    const worstReach = Math.max(...reaches.map((r) => Math.abs(r.rel)));
    const row = {
      label: p.label,
      cpuSeconds: p.cpu.seconds,
      gpuSeconds: gpu.seconds,
      cpuSteps: p.cpu.steps,
      gpuSteps: gpu.steps,
      adapter: gpu.adapter,
      reaches,
      worstReach,
      worstPeak,
      passes: worstReach <= 0.005 && worstPeak <= 0.01,
    };
    console.log(
      `${p.label}: reach ${(100 * worstReach).toFixed(3)} %, peak ${(100 * worstPeak).toFixed(3)} %, ` +
        `CPU ${p.cpu.seconds.toFixed(0)} s / GPU ${gpu.seconds.toFixed(1)} s, steps ${String(p.cpu.steps)}/${String(gpu.steps)}`
    );
    out.push(row);
  }
  return out;
});
const passes = results.every((r) => r.passes);
writeFileSync(
  'src/physics/validation/blast2dG1.json',
  `${JSON.stringify({ rule: '1270 (d) G1, on rule 1277', passes, results }, null, 1)}\n`
);
console.log(passes ? 'G1 PASSES' : 'G1 FAILS');
