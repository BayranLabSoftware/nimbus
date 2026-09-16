import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runDose } from '../../src/physics/validation/doseRun.js';

/**
 * Rules 85 to 89 of src/physics/validation/doseRules.ts, run once and printed:
 * the traced figures checked, the initial-radiation rings of every explosion
 * preset and of a grid of yields under the project's fit and under Glasstone &
 * Dolan's own dose–range figures, and rule 87's choice.
 *
 *   pnpm exec tsx scripts/benchmark/dose.ts [<out.json>]
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const run = runDose();
const km = (x: number): string => (x > 0 ? x.toFixed(2) : '—');
const three = (r: readonly number[]): string => r.map(km).join(' · ');

console.log('rule 85 trace:', JSON.stringify(run.trace));
console.log(
  `rule 88 rings (km), LD100 · LD50 · threshold at ${run.doses.ld100.toString()} / ${run.doses.ld50.toString()} / ${run.doses.ars.toString()} rads, the fit → the book:`
);
for (const row of [...run.presets, ...run.grid]) {
  console.log(
    `  ${row.name.padEnd(22)} ${row.yieldKt.toString().padStart(7)} kt  HOB ${row.heightOfBurstM.toString().padStart(5)} m  ${row.weapon.padEnd(13)} ${three(row.inPlaceKm)} → ${three(row.candidateKm)}   the book at the fit's LD50: ${row.doseAtTheFitRad.toFixed(0)} rads${row.outsideTheFigures ? '  (outside the figures)' : ''}`
  );
}
console.log("rule 88, beside — the book's own reliability on LD50 (km):");
for (const row of run.reliability) {
  console.log(
    `  ${row.name.padEnd(12)} ${row.weapon.padEnd(13)} ${km(row.low)} … ${km(row.middle)} … ${km(row.high)}`
  );
}
console.log(
  `step at 100 kt: ${run.stepAt100Kt.toFixed(3)}; rings behave: ${String(run.ringsBehave)}`
);
console.log('rule 87:', JSON.stringify(run.decision));

const out = process.argv[2];
if (out !== undefined) {
  writeFileSync(out.startsWith('/') ? out : join(ROOT, out), `${JSON.stringify(run, null, 1)}\n`);
}
