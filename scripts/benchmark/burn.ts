import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBurn } from '../../src/physics/validation/burnRun.js';

/**
 * Rules 80 to 84 of src/physics/validation/burnRules.ts, run once and
 * printed: the traced curves checked, the rings of every explosion preset and
 * of the net's explosions under the project's fixed exposures and under
 * Glasstone & Dolan's own, and rule 82's choice.
 *
 *   pnpm exec tsx scripts/benchmark/burn.ts [<out.json>]
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const run = runBurn();
const km = (x: number): string => x.toFixed(2);

console.log('rule 80 trace:', JSON.stringify(run.trace));
console.log('rule 83 rings (km), first · second · third, in place → the book:');
for (const row of run.rings) {
  console.log(
    `  ${row.name.padEnd(22)} ${row.yieldKt.toString().padStart(7)} kt  exposure ${row.exposure.first.toFixed(2)}/${row.exposure.second.toFixed(2)}/${row.exposure.third.toFixed(2)} cal/cm²  ${km(row.inPlaceKm.first)} · ${km(row.inPlaceKm.second)} · ${km(row.inPlaceKm.third)} → ${km(row.candidateKm.first)} · ${km(row.candidateKm.second)} · ${km(row.candidateKm.third)}`
  );
}
console.log('rule 82 tolls:');
for (const t of run.tolls) {
  console.log(
    `  ${t.name.padEnd(22)} record ${t.record.toString().padStart(7)}  in place ${t.inPlace.join(' / ')} ${t.insideInPlace ? 'inside' : 'OUT'}  book ${t.candidate.join(' / ')} ${t.insideCandidate ? 'inside' : 'OUT'}${t.gated ? ' (gated)' : ''}`
  );
}
console.log('worst ring factor', run.worstRingFactor.toFixed(3));
console.log('rule 82:', JSON.stringify(run.decision));

const out = process.argv[2];
if (out !== undefined) {
  writeFileSync(out.startsWith('/') ? out : join(ROOT, out), `${JSON.stringify(run, null, 1)}\n`);
}
