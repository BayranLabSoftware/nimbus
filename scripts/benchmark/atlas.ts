import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ATLAS_CANDIDATES } from '../../src/physics/validation/atlasRules.js';
import { runAtlas } from '../../src/physics/validation/atlasRun.js';
import type { TollCells } from '../../src/physics/validation/interfaceRulesRun.js';
import type { ProspectiveScore } from '../../src/physics/validation/prospectiveRules.js';

/**
 * Rules 56 to 60 of src/physics/validation/atlasRules.ts, run once and
 * printed: rule 28's score for every candidate on rule 56's ShakeMaps, rule
 * 58's choice, rule 59's check on the dead where there is a winner, and what
 * rule 60 prints beside.
 *
 *   pnpm exec tsx scripts/benchmark/atlas.ts [<out.json>]
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const started = Date.now();
const run = runAtlas();
const f = (x: number | null, digits = 3): string => (x === null ? '—' : x.toFixed(digits));

const scoreText = (s: ProspectiveScore): string =>
  `${s.bands
    .map(
      (b) =>
        `MMI ${b.band.toString()} H${b.outcome.hits.toString()} M${b.outcome.misses.toString()} F${b.outcome.falseAlarms.toString()} S${b.outcome.silences.toString()} skill ${f(b.skill)}${b.scored ? '' : ' (not scored)'}`
    )
    .join(' | ')}; score ${f(s.score)}, sharpness ${f(s.sharpness)}`;

const tollText = (cells: TollCells): string =>
  cells
    .map(
      (c) =>
        `${c.group} ×${f(c.stats.bias, 2)} inside ${c.stats.inside.toString()}/${c.stats.rows.toString()}`
    )
    .join(' | ');

console.log(
  `rule 56: ${run.events.earthquakes.toString()} earthquakes (${run.events.byCell.join(' / ')} by cell), ${run.events.leastModelled.toString()} least modelled, ${run.events.quiet.toString()} quiet`
);
for (const c of ATLAS_CANDIDATES) {
  const s = run.scores[c.key];
  if (s === undefined) continue;
  console.log(`rule 57 ${c.key}: ${scoreText(s.all)}`);
  console.log(`        least modelled: ${scoreText(s.leastModelled)}`);
}
console.log('rule 58:', JSON.stringify(run.choice));
if (run.dead !== null) {
  console.log(`rule 59 rule 11 boore2014: ${tollText(run.dead.tolls.inPlace)}`);
  console.log(`        ${run.dead.winner}: ${tollText(run.dead.tolls.winner)}`);
  console.log(
    `        rule 23 quiet raised to ten: ${(100 * run.dead.quiet.inPlace.share).toFixed(1)} % against ${(100 * run.dead.quiet.winner.share).toFixed(1)} % of ${run.dead.quiet.inPlace.quiet.toString()}`
  );
  console.log('rule 59:', run.dead.decision);
}
for (const [label, scores] of Object.entries(run.beside)) {
  for (const c of ATLAS_CANDIDATES) {
    const s = scores[c.key];
    if (s === undefined) continue;
    console.log(`rule 60 beside, ${label}, ${c.key}: ${scoreText(s)}`);
  }
}
console.log(`\n${((Date.now() - started) / 1000).toFixed(0)} s`);

const out = process.argv[2];
if (out !== undefined) {
  writeFileSync(out.startsWith('/') ? out : join(ROOT, out), `${JSON.stringify(run, null, 1)}\n`);
}
