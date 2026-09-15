import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { meanAbsoluteBias, type ContourCell } from '../../src/physics/validation/contourLaws.js';
import { INTERFACE_LAWS, INTERFACE_READINGS } from '../../src/physics/validation/interfaceRules.js';
import { runInterfaceRules } from '../../src/physics/validation/interfaceRulesRun.js';

/**
 * Rules 35 to 39 of src/physics/validation/interfaceRules.ts, run once and
 * printed: each law's score in rule 37's four readings, the choice, rule
 * 38's check on the dead where there is a winner, and what rule 39 prints
 * beside.
 *
 *   pnpm exec tsx scripts/benchmark/interface-rings.ts [<out.json>]
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const run = runInterfaceRules();
const f = (x: number | null, digits = 2): string => (x === null ? '—' : x.toFixed(digits));
const cellsText = (cells: readonly ContourCell[]): string =>
  cells
    .map(
      (c) =>
        `${c.sizeBand} ${c.bias === null ? '—' : `×${f(Math.exp(c.bias))}`} (${c.pairs.toString()}; +${c.invented.toString()} −${c.missed.toString()})`
    )
    .join(' | ');

console.log(
  `rule 35: ${run.events.rule11.toString()} interface earthquakes of rule 11, ${run.events.rule23.toString()} of rule 23`
);
for (const reading of INTERFACE_READINGS) {
  console.log(`\n## ${reading}`);
  for (const law of INTERFACE_LAWS) {
    console.log(
      `  ${law.padEnd(24)} ${f(run.choice.meanAbsoluteBias[reading][law], 3)}  ${cellsText(run.scores[reading][law])}`
    );
  }
}
console.log(
  `\nrule 37: eligible ${JSON.stringify(run.choice.eligible)}, winner ${run.choice.winner}`
);
if (run.dead !== null) {
  for (const [law, cells] of Object.entries(run.dead.tolls)) {
    console.log(
      `  tolls ${law.padEnd(24)} ${cells.map((c) => `${c.group} ×${f(c.stats.bias)} ${c.stats.inside.toString()}/${c.stats.rows.toString()}`).join(' | ')}`
    );
  }
  for (const [law, q] of Object.entries(run.dead.quiet)) {
    console.log(
      `  quiet ${law.padEnd(24)} ${(100 * q.share).toFixed(1)} % of ${q.quiet.toString()}`
    );
  }
  console.log('rule 38:', run.dead.decision);
}
console.log(`\nrule 39, maps with ten stations or more (${run.beside.stationsEvents.toString()}):`);
for (const law of INTERFACE_LAWS) {
  console.log(
    `  ${law.padEnd(24)} ${f(meanAbsoluteBias(run.beside.stations[law]), 3)}  ${cellsText(run.beside.stations[law])}`
  );
}
for (const [family, set] of Object.entries(run.beside.byModelSet)) {
  console.log(`rule 39, maps drawn with ${family} (${set.events.toString()}):`);
  for (const law of INTERFACE_LAWS) {
    console.log(
      `  ${law.padEnd(24)} ${f(meanAbsoluteBias(set.cells[law]), 3)}  ${cellsText(set.cells[law])}`
    );
  }
}
console.log('\nrule 39, the presets (MMI VII, VIII, IX beyond the stadium, km):');
for (const p of run.beside.presets) {
  console.log(
    `  ${p.preset.padEnd(14)} ${p.law.padEnd(24)} ${p.radiiKm.map((r) => r.toFixed(1)).join(', ')}`
  );
}

const out = process.argv[2];
if (out !== undefined) {
  writeFileSync(out.startsWith('/') ? out : join(ROOT, out), `${JSON.stringify(run, null, 1)}\n`);
}
