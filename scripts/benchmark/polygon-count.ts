import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPolygonCount } from '../../src/physics/validation/polygonCountRun.js';

/**
 * Rules 98 to 101 of src/physics/validation/polygonCountRules.ts, run once and
 * printed: the rupture stadiums rule 98 builds, the count the product takes of
 * each and the far finer count rule 99 takes of the same cells, and rule 101's
 * choice.
 *
 *   pnpm exec tsx scripts/benchmark/polygon-count.ts [<out.json>]
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const run = runPolygonCount();
const pc = (x: number): string => `${(100 * x).toFixed(3)} %`;

console.log(
  `${run.polygons.toString()} stadiums; reference converged: ${String(run.convergence.passes)} (worst ${pc(run.convergence.worst)} over ${run.convergence.checked.toString()})`
);
const line = (label: string, r: typeof run.inPlace): string =>
  `  ${label.padEnd(10)} scored ${r.scored.toString().padStart(3)}  median ${pc(r.medianError)}  90th ${pc(r.ninetiethError)}  worst ${pc(r.worstError)}  within the bar: ${String(r.meetsBar)}`;
console.log('rule 100:');
console.log(line('4 x 4', run.inPlace));
console.log(line('12 x 12', run.candidate));
console.log('the three worst stadiums of the count in place:');
for (const row of run.worstRows) {
  console.log(
    `  ${row.name.padEnd(26)} strike ${row.strikeDeg.toString().padStart(3)}  ${row.inPlace.toFixed(0)} against ${row.exact.toFixed(0)}  ${pc(row.error)}`
  );
}
console.log(`time factor of the candidate: ${run.timeFactor.toFixed(2)}`);
console.log('rule 101:', JSON.stringify(run.decision));

const out = process.argv[2];
if (out !== undefined) {
  writeFileSync(out.startsWith('/') ? out : join(ROOT, out), `${JSON.stringify(run, null, 1)}\n`);
}
