/**
 * Runs many blast-solver cases at once, one process each
 * (`scripts/blast2d-run.ts`), a few at a time, keeping every finished run in
 * a cache directory so an interrupted batch resumes where it stopped.
 */

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BlastCase, BlastRun } from './blast2d-run.js';

/** A run's key: the case and the solver's code, so a mended solver never
 *  reuses a run of the old one. */
const CODE = [
  'src/physics/solvers/blast2d/solver.ts',
  'src/physics/solvers/blast2d/atmosphere.ts',
  'scripts/blast2d-run.ts',
]
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

export function caseKey(c: BlastCase): string {
  return createHash('sha256').update(CODE).update(JSON.stringify(c)).digest('hex').slice(0, 16);
}

export async function runPool(
  cases: readonly BlastCase[],
  cacheDir: string,
  parallel = 4,
  log: (line: string) => void = console.log
): Promise<BlastRun[]> {
  mkdirSync(cacheDir, { recursive: true });
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
