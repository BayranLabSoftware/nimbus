/**
 * Rule 1273 (d)(1) and rule 1274 (b) (`src/physics/validation/blastSolverRules.ts`):
 * the runs of the cache, under a commit's code (or the code on disk), whose
 * stop came with the incident wave short of the farthest range read — the
 * signature: beyond the tenth cell, a ground peak more than 1.3 times the
 * next cell's.
 *
 *   pnpm exec tsx scripts/blast2d-cut-scan.ts [commit | disk]
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import type { BlastCase, BlastRun } from './blast2d-run.js';

const CACHE = 'scripts/tmp/blast2d-cache';
const FILES = [
  'src/physics/solvers/blast2d/solver.ts',
  'src/physics/solvers/blast2d/atmosphere.ts',
  'scripts/blast2d-run.ts',
];

/** Where a run's ground peaks fall more than 1.3 times from one cell to the
 *  next beyond the tenth: the cell and the ratio (none: undefined). */
export function cutOf(run: BlastRun): { cell: number; ratio: number } | undefined {
  let worst = 1.3;
  let cell = -1;
  for (let i = 10; i < run.peaks.length - 1; i++) {
    const a = run.peaks[i] ?? 0;
    const b = run.peaks[i + 1] ?? 0;
    if (b > 0 && a / b > worst) {
      worst = a / b;
      cell = i;
    }
  }
  return cell < 0 ? undefined : { cell, ratio: worst };
}

if (process.argv[1]?.endsWith('blast2d-cut-scan.ts')) {
  const commit = process.argv[2] ?? 'disk';
  const code = FILES.map((f) =>
    commit === 'disk'
      ? readFileSync(f, 'utf8')
      : execFileSync('git', ['show', `${commit}:${f}`], { encoding: 'utf8' })
  ).join('\n');
  const key = (c: BlastCase): string =>
    createHash('sha256').update(code).update(JSON.stringify(c)).digest('hex').slice(0, 16);
  const groups = new Map<string, { runs: number; cut: number }>();
  for (const f of readdirSync(CACHE)) {
    const run = JSON.parse(readFileSync(`${CACHE}/${f}`, 'utf8')) as BlastRun;
    if (f !== `${key(run.case)}.json`) continue;
    const c = run.case;
    const group = `${c.atmosphere.kind} ρ₀ ${c.atmosphere.rho0.toFixed(3)}, ${(c.energy / 4.184e12).toFixed(0)} kt`;
    const g = groups.get(group) ?? { runs: 0, cut: 0 };
    g.runs++;
    const cut = cutOf(run);
    if (cut !== undefined) {
      g.cut++;
      const at = (run.ranges[cut.cell] ?? 0) / 1_000;
      const end = (run.ranges.at(-1) ?? 0) / 1_000;
      console.log(
        `cut: ${group}, h ${c.height.toFixed(0)} m, Δx ${c.dx.toFixed(1)} m: at ${at.toFixed(1)} of ${end.toFixed(1)} km, ` +
          `${((run.peaks[cut.cell] ?? 0) / 1_000).toFixed(2)} → ${((run.peaks[cut.cell + 1] ?? 0) / 1_000).toFixed(2)} kPa, stopped at ${run.time.toFixed(1)} s`
      );
    }
    groups.set(group, g);
  }
  for (const [group, g] of groups)
    console.log(`${commit}: ${group}: ${String(g.runs)} runs, ${String(g.cut)} cut`);
}
