import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runRingCount } from '../../src/physics/validation/ringCountRun.js';

/**
 * Rules 94 to 97 of src/physics/validation/ringCountRules.ts, run once and
 * printed: the circles rule 94 builds, the count the product takes of each and
 * the far finer count rule 95 takes of the same cells, and rule 97's choice.
 *
 *   pnpm exec tsx scripts/benchmark/ring-count.ts [<out.json>]
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const run = runRingCount();
const pc = (x: number): string => `${(100 * x).toFixed(3)} %`;

console.log(
  `raster ${run.raster.cellDeg.toString()}°, ${run.circles.toString()} circles; reference converged: ${String(run.convergence.passes)} (worst ${pc(run.convergence.worst)} over ${run.convergence.checked.toString()} circles)`
);
const line = (label: string, r: typeof run.inPlace): string =>
  `  ${label.padEnd(10)} scored ${r.scored.toString().padStart(4)}  median ${pc(r.medianError)}  90th ${pc(r.ninetiethError)}  worst ${pc(r.worstError)}  within the bar: ${String(r.meetsBar)}`;
console.log('rule 96:');
console.log(line('4 x 4', run.inPlace));
console.log(line('12 x 12', run.candidate));
console.log(`  circles below one cell, counted apart: ${run.inPlace.belowACell.toString()}`);
console.log('the three worst circles of the count in place:');
for (const row of run.worstRows) {
  console.log(
    `  ${row.name.padEnd(14)} ${row.latitude.toFixed(4)}, ${row.longitude.toFixed(4)}  ${row.radiusKm.toString().padStart(5)} km  ${row.inPlace.toFixed(0)} against ${row.exact.toFixed(0)}  ${pc(row.error)}`
  );
}
console.log(`time factor of the candidate: ${run.timeFactor.toFixed(2)}`);
console.log('rule 97:', JSON.stringify(run.decision));

const out = process.argv[2];
if (out !== undefined) {
  writeFileSync(out.startsWith('/') ? out : join(ROOT, out), `${JSON.stringify(run, null, 1)}\n`);
}
