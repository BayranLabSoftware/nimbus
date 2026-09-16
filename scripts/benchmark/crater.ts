import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCrater } from '../../src/physics/validation/craterRun.js';

/**
 * Rules 90 to 93 of src/physics/validation/craterRules.ts, run once and
 * printed: the book's own printed contact-surface crater numbers checked, each
 * ground type's coefficient before and after, the crater of every explosion
 * preset both ways, and rule 92's choice.
 *
 *   pnpm exec tsx scripts/benchmark/crater.ts [<out.json>]
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const run = runCrater();
const m = (x: number | null): string => (x === null ? '—' : x.toFixed(2));

console.log('rule 90 numbers:', JSON.stringify(run.numbers));
console.log('rule 93 coefficients (m of diameter at 1 kt):');
for (const row of run.coefficients) {
  console.log(
    `  ${row.groundType.padEnd(12)} ${row.mediumName.padEnd(26)} ${m(row.inPlace)} → ${m(row.book)}  adopted ${m(row.adopted)}${row.kept === null ? '' : `  kept: ${row.kept}`}`
  );
}
console.log('rule 93 presets (apparent diameter, m):');
for (const row of run.presets) {
  console.log(
    `  ${row.name.padEnd(22)} ${row.yieldKt.toString().padStart(7)} kt  ${row.groundType.padEnd(12)} ${m(row.inPlaceM)} → ${m(row.adoptedM)}   the book's depth: ${m(row.bookDepthM)} m`
  );
}
console.log("beside — what the book's wet soil would make of the reef craters:");
for (const row of run.bikini) {
  console.log(`  ${row.name.padEnd(22)} ${m(row.inPlaceM)} → ${m(row.bookM)}`);
}
console.log(`worst move ${run.worstMove.toFixed(3)}; order survives ${String(run.orderSurvives)}`);
console.log('rule 92:', JSON.stringify(run.decision));

const out = process.argv[2];
if (out !== undefined) {
  writeFileSync(out.startsWith('/') ? out : join(ROOT, out), `${JSON.stringify(run, null, 1)}\n`);
}
