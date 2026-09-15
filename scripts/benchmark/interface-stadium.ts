import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { meanAbsoluteBias, type ContourCell } from '../../src/physics/validation/contourLaws.js';
import {
  INTERFACE_STADIUMS,
  recordedScore,
  STADIUM_CELLS,
} from '../../src/physics/validation/interfaceStadiumRules.js';
import {
  runInterfaceStadium,
  seenRecordedBelow,
} from '../../src/physics/validation/interfaceStadiumRun.js';

/**
 * Rules 40 to 44 of src/physics/validation/interfaceStadiumRules.ts, run
 * once and printed: both geometries' scores on rule 40's interface
 * earthquakes, rule 42's choice, rule 43's check on the dead, and what rule
 * 44 prints beside.
 *
 *   pnpm exec tsx scripts/benchmark/interface-stadium.ts [<out.json>]
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const run = runInterfaceStadium();
const f = (x: number | null, digits = 2): string => (x === null ? '—' : x.toFixed(digits));
const below = (cells: readonly ContourCell[]): ContourCell[] =>
  cells.filter((c) => STADIUM_CELLS.includes(c.sizeBand));
const cellsText = (cells: readonly ContourCell[]): string =>
  below(cells)
    .map(
      (c) =>
        `${c.sizeBand} ${c.bias === null ? '—' : `×${f(Math.exp(c.bias))}`} (${c.pairs.toString()}; +${c.invented.toString()} −${c.missed.toString()})`
    )
    .join(' | ');

console.log(
  `rule 40: ${run.events.interface.toString()} interface earthquakes, ${run.events.quiet.toString()} quiet, ${run.events.recorded.toString()} recorded`
);
for (const g of INTERFACE_STADIUMS) {
  console.log(
    `  ${g.padEnd(10)} ${f(meanAbsoluteBias(below(run.shaking[g])), 3)}  ${cellsText(run.shaking[g])}`
  );
}
console.log('rule 42:', run.choice);
if (run.dead !== null) {
  for (const g of INTERFACE_STADIUMS) {
    const q = run.dead.quiet[g];
    const rec = run.dead.recorded[g];
    console.log(
      `  ${g.padEnd(10)} quiet ${(100 * q.share).toFixed(1)} % of ${q.quiet.toString()}; recorded score ${recordedScore(rec).toFixed(3)}, inside ${STADIUM_CELLS.map((c) => `${c} ${rec.filter((r) => r.sizeBand === c && r.inside).length.toString()}/${rec.filter((r) => r.sizeBand === c).length.toString()}`).join(', ')}`
    );
    for (const r of rec) {
      console.log(
        `      ${r.comcat.padEnd(14)} ${r.sizeBand.padEnd(11)} record ${r.record.toString().padStart(4)} central ${Math.round(r.central).toString().padStart(6)} ${r.inside ? 'in' : 'out'}`
      );
    }
  }
  console.log('rule 43:', run.dead.decision);
}
console.log('\nrule 44, beside:');
for (const [reading, cells] of Object.entries(run.beside.seen)) {
  console.log(`  ${reading}`);
  for (const g of INTERFACE_STADIUMS) {
    console.log(
      `    ${g.padEnd(10)} ${f(meanAbsoluteBias(below(cells[g])), 3)}  ${cellsText(cells[g])}`
    );
  }
}
console.log(
  `  rule 40's maps with ten stations or more (${run.beside.stationsEvents.toString()}):`
);
for (const g of INTERFACE_STADIUMS) {
  console.log(
    `    ${g.padEnd(10)} ${f(meanAbsoluteBias(below(run.beside.stations[g])), 3)}  ${cellsText(run.beside.stations[g])}`
  );
}
for (const g of INTERFACE_STADIUMS) {
  const rec = seenRecordedBelow(g);
  console.log(
    `  rule 11's held-out interface tolls below Mw 7.5, ${g}: score ${recordedScore(rec).toFixed(3)}, inside ${STADIUM_CELLS.map((c) => `${c} ${rec.filter((r) => r.sizeBand === c && r.inside).length.toString()}/${rec.filter((r) => r.sizeBand === c).length.toString()}`).join(', ')}`
  );
}

const out = process.argv[2];
if (out !== undefined) {
  writeFileSync(out.startsWith('/') ? out : join(ROOT, out), `${JSON.stringify(run, null, 1)}\n`);
}
