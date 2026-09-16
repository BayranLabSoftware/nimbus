import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  hobGuard,
  hobNukemapRows,
  hobPresetRows,
  hobTracePasses,
  hobWaterline,
} from '../../src/physics/validation/hobRun.js';

/**
 * Rules 169 to 172 of src/physics/validation/hobRules.ts, run once and printed:
 * the trace's checks, rule 171 (c)'s guard, and the rings rule 172 prints. The
 * release gate is the validation report's (`pnpm validation-report`).
 *
 *   pnpm exec tsx scripts/benchmark/hob-blast.ts [<out.json>]
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const km = (x: number): string => (x > 0 ? (x / 1_000).toFixed(2) : '0');
const trace = hobTracePasses();
const guard = hobGuard();
const presets = hobPresetRows();
const cases = JSON.parse(
  readFileSync(join(ROOT, 'benchmark', 'matrices', 'nuclear.json'), 'utf8')
) as { id: string; yieldKt: number; heightOfBurstM: number }[];
const nukemap = hobNukemapRows(cases);

console.log(`rule 169, the trace's checks: ${trace ? 'pass' : 'FAIL'}`);
console.log('rule 171 (c), the guard:', JSON.stringify(guard));
console.log('rule 172, presets (km), 5 · 1 · 0.5 psi, the factor → the book:');
for (const r of presets) {
  console.log(
    `  ${r.name.padEnd(28)} ${r.yieldKt.toString().padStart(8)} kt  HOB ${r.heightOfBurstM.toString().padStart(6)} m ${r.chemical ? 'chemical' : 'nuclear '}  ${km(r.inPlace.fivePsiM)} · ${km(r.inPlace.onePsiM)} · ${km(r.inPlace.halfPsiM)}  →  ${km(r.candidate.fivePsiM)} · ${km(r.candidate.onePsiM)} · ${km(r.candidate.halfPsiM)}`
  );
}
console.log('rule 172, the NUKEMAP rings the campaign kept (m):');
for (const n of nukemap) {
  console.log(
    `  ${n.caseId.padEnd(28)} ${n.psi.toString()} psi  NUKEMAP ${n.nukemapM.toFixed(0).padStart(6)}  factor ${n.inPlaceM.toFixed(0).padStart(6)} (${(n.inPlaceM / n.nukemapM).toFixed(3)}×)  book ${n.candidateM.toFixed(0).padStart(6)} (${(n.candidateM / n.nukemapM).toFixed(3)}×)`
  );
}
const waterline = {
  surfaceRelation: hobWaterline('surfaceRelation'),
  glasstone1977: hobWaterline('glasstone1977'),
};
console.log('rule 176, the step across the waterline (5 · 1 · 0.5 psi), in place → candidate:');
for (let i = 0; i < waterline.glasstone1977.rows.length; i++) {
  const a = waterline.surfaceRelation.rows[i];
  const b = waterline.glasstone1977.rows[i];
  if (a === undefined || b === undefined) continue;
  const pct = (x: number): string => `${(100 * x).toFixed(2)} %`;
  console.log(
    `  ${a.yieldKt.toString().padStart(7)} kt  ${pct(a.stepFivePsi)} · ${pct(a.stepOnePsi)} · ${pct(a.stepHalfPsi)}  →  ${pct(b.stepFivePsi)} · ${pct(b.stepOnePsi)} · ${pct(b.stepHalfPsi)}`
  );
}
console.log(
  `rule 176 (a): worst excess step under the candidate ${waterline.glasstone1977.worstExcessStep.toExponential(2)}`
);
const out = process.argv[2];
if (out !== undefined) {
  writeFileSync(
    out.startsWith('/') ? out : join(ROOT, out),
    `${JSON.stringify({ rules: 'src/physics/validation/hobRules.ts, rules 168 to 176', trace, guard, presets, nukemap, waterline }, null, 1)}\n`
  );
}
