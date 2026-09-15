import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { meanAbsoluteBias, type ContourCell } from '../../src/physics/validation/contourLaws.js';
import type { TollCells } from '../../src/physics/validation/interfaceRulesRun.js';
import { recordedScore } from '../../src/physics/validation/interfaceStadiumRules.js';
import {
  POINT_SOURCE_CANDIDATES,
  POINT_SOURCE_CELLS,
  POINT_SOURCE_INTERFACE_CANDIDATES,
  POINT_SOURCE_READINGS,
} from '../../src/physics/validation/pointSourceRules.js';
import { runPointSource } from '../../src/physics/validation/pointSourceRun.js';

/**
 * Rules 50 to 55 of src/physics/validation/pointSourceRules.ts, run once and
 * printed: both distances on rule 50's ShakeMaps, rule 52's choice, rule
 * 53's check on the dead where the candidate is eligible, rule 54's
 * interface models, and what rule 55 prints beside.
 *
 *   pnpm exec tsx scripts/benchmark/point-source.ts [<out.json>]
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const started = Date.now();
const run = runPointSource();
const f = (x: number | null, digits = 2): string => (x === null ? '—' : x.toFixed(digits));

const cellsText = (cells: readonly ContourCell[]): string =>
  `${cells
    .map(
      (c) =>
        `${c.sizeBand} ${f(c.bias)} (${c.pairs.toString()}, invented ${c.invented.toString()}, missed ${c.missed.toString()})`
    )
    .join(' | ')}; below Mw 7.5 ${f(
    meanAbsoluteBias(cells.filter((c) => POINT_SOURCE_CELLS.includes(c.sizeBand)))
  )}, all ${f(meanAbsoluteBias(cells))}`;

const tollText = (cells: TollCells): string =>
  cells
    .map(
      (c) =>
        `${c.group} ×${f(c.stats.bias)} inside ${c.stats.inside.toString()}/${c.stats.rows.toString()}`
    )
    .join(' | ');

console.log(
  `rule 50: ${run.events.earthquakes.toString()} earthquakes, ${run.events.leastModelled.toString()} least modelled, ${run.events.interface.toString()} interface`
);
for (const reading of POINT_SOURCE_READINGS) {
  for (const distance of POINT_SOURCE_CANDIDATES) {
    console.log(`rule 52 ${reading} ${distance}: ${cellsText(run.shaking[reading][distance])}`);
    console.log(`        least modelled: ${cellsText(run.leastModelled[reading][distance])}`);
  }
}
console.log('rule 52:', JSON.stringify(run.choice));
if (run.dead !== null) {
  for (const distance of POINT_SOURCE_CANDIDATES) {
    console.log(`rule 53 rule 11 ${distance}: ${tollText(run.dead.tolls[distance])}`);
    console.log(
      `        rule 23 quiet raised to ten: ${(100 * run.dead.quiet[distance].share).toFixed(1)} % of ${run.dead.quiet[distance].quiet.toString()}`
    );
  }
  console.log('rule 53:', run.dead.decision);
}
console.log(`rule 54 runs the law in place at: ${run.distance}`);
for (const reading of POINT_SOURCE_READINGS) {
  console.log(`rule 54 ${reading} boore2014: ${cellsText(run.interface.shaking[reading].inPlace)}`);
  for (const law of POINT_SOURCE_INTERFACE_CANDIDATES) {
    console.log(`        ${law}: ${cellsText(run.interface.shaking[reading].candidates[law])}`);
  }
}
console.log('rule 54:', JSON.stringify(run.interface.choice));
if (run.interface.dead !== null) {
  const d = run.interface.dead;
  console.log(`rule 54 rule 11 interface boore2014: ${tollText(d.tolls.inPlace)}`);
  console.log(`        ${d.winner}: ${tollText(d.tolls.winner)}`);
  console.log(
    `        rule 23 quiet interface raised to ten: ${(100 * d.quiet.inPlace.share).toFixed(1)} % against ${(100 * d.quiet.winner.share).toFixed(1)} % of ${d.quiet.inPlace.quiet.toString()}`
  );
  console.log('rule 54 on the dead:', d.decision);
}
for (const distance of POINT_SOURCE_CANDIDATES) {
  const rows = run.beside.recorded[distance];
  console.log(
    `rule 55 beside, the set's recorded below Mw 7.5, ${distance}: score ${recordedScore(rows).toFixed(3)}, held ${rows.filter((r) => r.inside).length.toString()}/${rows.length.toString()}`
  );
}
for (const reading of POINT_SOURCE_READINGS) {
  for (const distance of POINT_SOURCE_CANDIDATES) {
    console.log(
      `rule 55 beside ${reading} ${distance}: finite rupture ${cellsText(run.beside.finiteFault[reading][distance])}`
    );
    console.log(
      `        ten stations or more ${cellsText(run.beside.stations[reading][distance])}`
    );
  }
  for (const law of POINT_SOURCE_INTERFACE_CANDIDATES) {
    console.log(
      `rule 55 beside ${reading} ${law} at rule 36's distance: ${cellsText(run.beside.hypocentral[reading][law])}`
    );
  }
}
for (const net of run.beside.net) {
  const km = (x: number): string => (x / 1_000).toFixed(1);
  console.log(
    `rule 55 beside, ${net.name} (Mw ${net.magnitude.toString()}): VII/VIII/IX ${km(net.rings.epicentral.mmi7)}/${km(net.rings.epicentral.mmi8)}/${km(net.rings.epicentral.mmi9)} km → ${km(net.rings.thompsonWorden2018.mmi7)}/${km(net.rings.thompsonWorden2018.mmi8)}/${km(net.rings.thompsonWorden2018.mmi9)} km`
  );
}
console.log(`\n${((Date.now() - started) / 1000).toFixed(0)} s`);

const out = process.argv[2];
if (out !== undefined) {
  writeFileSync(out.startsWith('/') ? out : join(ROOT, out), `${JSON.stringify(run, null, 1)}\n`);
}
