/**
 * Runs many blast-solver cases at once, one process each
 * (`scripts/blast2d-run.ts`), a few at a time, keeping every finished run in
 * a cache directory so an interrupted batch resumes where it stopped.
 */

import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BlastCase, BlastRun } from './blast2d-run.js';

/** Read the runs made under a commit's code, making none (a test judged
 *  again from its runs, rule 1276 (c)); unset, the code on disk. */
const CODE_AT = process.env.BLAST2D_CODE_AT;

/** Rule 1281 (e): BLAST2D_ENGINE=gpu makes the runs on the GPU (the same
 *  cases, the GPU's code in the key as well). */
const ENGINE = process.env.BLAST2D_ENGINE === 'gpu' ? 'gpu' : 'cpu';
const GPU_CODE =
  ENGINE === 'gpu'
    ? [
        'src/physics/solvers/blast2d/gpu/kernels.ts',
        'src/physics/solvers/blast2d/gpu/solverGpu.ts',
        'src/physics/solvers/blast2d/gpu/browserEntry.ts',
        'src/physics/solvers/blast2d/gpu/webgpu.ts',
      ]
        .map((f) => readFileSync(f, 'utf8'))
        .join('\n')
    : '';

/** A run's key: the case and the solver's code, so a mended solver never
 *  reuses a run of the old one. */
const CODE = [
  'src/physics/solvers/blast2d/solver.ts',
  'src/physics/solvers/blast2d/atmosphere.ts',
  'scripts/blast2d-run.ts',
]
  .map((f) =>
    CODE_AT === undefined
      ? readFileSync(f, 'utf8')
      : execFileSync('git', ['show', `${CODE_AT}:${f}`], { encoding: 'utf8' })
  )
  .join('\n');

export function caseKey(c: BlastCase): string {
  const hash = createHash('sha256').update(CODE);
  if (ENGINE === 'gpu') hash.update('\ngpu\n').update(GPU_CODE);
  return hash.update(JSON.stringify(c)).digest('hex').slice(0, 16);
}

/** The GPU's runs, `parallel` pages at a time, into the same cache. */
async function runPoolGpu(
  cases: readonly BlastCase[],
  cacheDir: string,
  parallel: number,
  log: (line: string) => void
): Promise<BlastRun[]> {
  const { withGpuPages } = await import('./blast2d-gpu.js');
  const out: (BlastRun | undefined)[] = new Array<BlastRun | undefined>(cases.length);
  let next = 0;
  let done = 0;
  await withGpuPages(parallel, (pages) =>
    Promise.all(
      pages.map(async (page) => {
        for (;;) {
          const i = next++;
          const c = cases[i];
          if (c === undefined) return;
          const file = join(cacheDir, `${caseKey(c)}.json`);
          if (!existsSync(file)) {
            const run = await page.evaluate(
              async (cc) => window.blast2dGpu?.runCaseGpu(cc as never),
              c as unknown
            );
            if (run === undefined) throw new Error(`gpu run ${String(i)} failed`);
            writeFileSync(file, `${JSON.stringify(run)}\n`);
          }
          const run = JSON.parse(readFileSync(file, 'utf8')) as BlastRun;
          out[i] = run;
          done++;
          log(
            `${String(done)}/${String(cases.length)} h=${String(c.height)} dx=${String(c.dx)} ` +
              `${String(run.steps)} steps ${run.seconds.toFixed(0)} s (gpu)`
          );
        }
      })
    )
  );
  return out.map((r, i) => {
    if (r === undefined) throw new Error(`run ${String(i)} missing`);
    return r;
  });
}

export async function runPool(
  cases: readonly BlastCase[],
  cacheDir: string,
  parallel = 4,
  log: (line: string) => void = console.log
): Promise<BlastRun[]> {
  mkdirSync(cacheDir, { recursive: true });
  if (ENGINE === 'gpu') return runPoolGpu(cases, cacheDir, parallel, log);
  const out: (BlastRun | undefined)[] = new Array<BlastRun | undefined>(cases.length);
  let next = 0;
  let done = 0;
  const one = async (): Promise<void> => {
    for (;;) {
      const i = next++;
      const c = cases[i];
      if (c === undefined) return;
      const file = join(cacheDir, `${caseKey(c)}.json`);
      if (!existsSync(file)) {
        if (CODE_AT !== undefined)
          throw new Error(`no run of ${CODE_AT}'s code for case ${String(i)}; none is made`);
        await new Promise<void>((resolve, reject) => {
          const child = spawn(
            'pnpm',
            ['exec', 'tsx', 'scripts/blast2d-run.ts', JSON.stringify(c), file],
            {
              stdio: ['ignore', 'ignore', 'inherit'],
            }
          );
          child.on('error', reject);
          child.on('exit', (code) =>
            code === 0 ? resolve() : reject(new Error(`run ${String(i)} exited ${String(code)}`))
          );
        });
      }
      const run = JSON.parse(readFileSync(file, 'utf8')) as BlastRun;
      out[i] = run;
      done++;
      log(
        `${String(done)}/${String(cases.length)} h=${String(c.height)} dx=${String(c.dx)} ` +
          `${String(run.steps)} steps ${run.seconds.toFixed(0)} s`
      );
    }
  };
  await Promise.all(Array.from({ length: parallel }, () => one()));
  return out.map((r, i) => {
    if (r === undefined) throw new Error(`run ${String(i)} missing`);
    return r;
  });
}
