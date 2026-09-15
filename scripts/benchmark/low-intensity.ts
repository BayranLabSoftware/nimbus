import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LOW_INTENSITY_TOLLS,
  lowIntensityScore,
} from '../../src/physics/validation/lowIntensityRules.js';
import { runLowIntensity, type ModerateRun } from '../../src/physics/validation/lowIntensityRun.js';
import type { TollCells } from '../../src/physics/validation/pagerChainRun.js';

/**
 * Rules 45 to 49 of src/physics/validation/lowIntensityRules.ts, run once
 * and printed: the three tolls on rule 45's moderate earthquakes, rule
 * 47's choice, and where there is a winner rule 48's guards and what rule
 * 49 prints beside.
 *
 *   pnpm exec tsx scripts/benchmark/low-intensity.ts [<out.json>]
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const started = Date.now();
const run = runLowIntensity();
const f = (x: number | null, digits = 2): string => (x === null ? '—' : x.toFixed(digits));

const classes: { label: string; holds: (r: ModerateRun) => boolean }[] = [
  { label: 'record 0', holds: (r) => r.record === 0 },
  { label: 'record 1–9', holds: (r) => r.record > 0 && r.record < 10 },
  { label: 'record ≥ 10', holds: (r) => r.record >= 10 },
];

const cellsText = (cells: TollCells): string =>
  cells
    .map(
      (c) =>
        `${c.group} ×${f(c.stats.bias)} inside ${c.stats.inside.toString()}/${c.stats.rows.toString()}`
    )
    .join(' | ');

console.log(
  `rule 45: ${run.events.earthquakes.toString()} earthquakes, ${run.events.recorded.toString()} with deaths, ${run.events.tenOrMore.toString()} with ten or more, ${run.events.missing.toString()} with missing`
);
for (const toll of LOW_INTENSITY_TOLLS) {
  const rows = run.selection[toll];
  console.log(
    `  ${toll.padEnd(8)} score ${lowIntensityScore(rows).toFixed(3)}  held ${rows.filter((r) => r.inside).length.toString()}/${rows.length.toString()}`
  );
  for (const c of classes) {
    const some = rows.filter(c.holds);
    console.log(
      `      ${c.label.padEnd(12)} ${some.length.toString().padStart(3)}: score ${lowIntensityScore(some).toFixed(3)}, held ${some.filter((r) => r.inside).length.toString()}, central ≥ 1 ${some.filter((r) => r.central >= 1).length.toString()}, central ≥ 10 ${some.filter((r) => r.central >= 10).length.toString()}, sum ${Math.round(some.reduce((a, r) => a + r.central, 0)).toString()} against ${some.reduce((a, r) => a + r.record, 0).toString()}`
    );
  }
}
console.log('rule 47:', {
  winner: run.choice.winner,
  eligible: run.choice.eligible,
  score: run.choice.score,
  held: run.choice.held,
});

if (run.winner !== null) {
  const w = run.winner;
  console.log(`rule 48 (a), rule 11's held-out tolls:`);
  console.log(`  none     ${cellsText(w.tolls.inPlace)}`);
  console.log(`  ${w.toll.padEnd(8)} ${cellsText(w.tolls.winner)}`);
  console.log(
    `rule 48 (b), rule 23's quiet earthquakes: none ${(100 * w.quiet.inPlace.share).toFixed(1)} % of ${w.quiet.inPlace.quiet.toString()}, ${w.toll} ${(100 * w.quiet.winner.share).toFixed(1)} %`
  );
  console.log('rule 48:', w.decision);
  for (const [side, a] of Object.entries(w.againstPager)) {
    console.log(
      `rule 49, beside, against PAGER (${side}): ${a.events.toString()} events, ×${f(a.stats.bias)} on ${a.stats.scored.toString()}, alerts ${(100 * a.alertAgreement).toFixed(0)} %`
    );
  }
}
console.log(`\n${((Date.now() - started) / 1000).toFixed(0)} s`);

const out = process.argv[2];
if (out !== undefined) {
  writeFileSync(out.startsWith('/') ? out : join(ROOT, out), `${JSON.stringify(run, null, 1)}\n`);
}
