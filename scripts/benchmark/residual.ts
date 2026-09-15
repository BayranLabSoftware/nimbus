import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runResidual, type ResidualSetReading } from '../../src/physics/validation/residualRun.js';

/**
 * Rules 71 to 75 of src/physics/validation/residualRules.ts, run once and
 * printed: every earthquake of rule 11's, rule 45's and rule 61's sets banded
 * under the residual in place, the candidate and the residual printed
 * beside; rules 73 and 74's choice; and the net's earthquakes beside.
 *
 *   pnpm exec tsx scripts/benchmark/residual.ts [<out.json>]
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const started = Date.now();
const run = runResidual();
const f = (x: number | null, digits = 3): string => (x === null ? '—' : x.toFixed(digits));
const text = (r: ResidualSetReading): string =>
  `interval score ${f(r.meanIntervalScore)}, held ${r.held.toString()} of ${r.rows.toString()} (${f(r.rows === 0 ? null : r.held / r.rows)}), median width 10^${f(r.medianWidthDecades, 2)} | ${r.cells
    .map(
      (c) =>
        `${c.group}: ${f(c.meanIntervalScore)} · ${c.held.toString()} of ${c.rows.toString()} · 10^${f(c.medianWidthDecades, 2)}`
    )
    .join(' | ')}`;

console.log(
  `rule 72: ${run.events.rule11.toString()}, ${run.events.rule45.toString()} and ${run.events.rule61.toString()} earthquakes`
);
for (const key of ['rule11', 'rule45', 'rule61'] as const) {
  for (const side of ['inPlace', 'candidate', 'beside'] as const) {
    console.log(`${key} ${side}: ${text(run.readings[key][side])}`);
  }
}
console.log('rules 73 and 74:', JSON.stringify(run.decision));
for (const n of run.net) {
  console.log(
    `rule 75 beside, ${n.name} (${n.record.toString()}): in place ${n.bands.inPlace.join('–')}, candidate ${n.bands.candidate.join('–')}, law total ${n.bands.beside.join('–')}`
  );
}
console.log(`\n${((Date.now() - started) / 1000).toFixed(0)} s`);

const out = process.argv[2];
if (out !== undefined) {
  writeFileSync(out.startsWith('/') ? out : join(ROOT, out), `${JSON.stringify(run, null, 1)}\n`);
}
