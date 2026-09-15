import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ProspectiveScore } from '../../src/physics/validation/prospectiveRules.js';
import { SLAB_CANDIDATES } from '../../src/physics/validation/slabRules.js';
import { runSlab, type SlabDeadReading } from '../../src/physics/validation/slabRun.js';

/**
 * Rules 66 to 70 of src/physics/validation/slabRules.ts, run once and
 * printed: rule 28's score for every candidate on rule 66's ShakeMaps, rule
 * 68's choice, rule 69's guard on the dead where there is a winner, and what
 * rule 70 prints beside.
 *
 *   pnpm exec tsx scripts/benchmark/slab.ts [<out.json>]
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const started = Date.now();
const run = runSlab();
const f = (x: number | null, digits = 3): string => (x === null ? '—' : x.toFixed(digits));

const scoreText = (s: ProspectiveScore): string =>
  `${s.bands
    .map(
      (b) =>
        `MMI ${b.band.toString()} H${b.outcome.hits.toString()} M${b.outcome.misses.toString()} F${b.outcome.falseAlarms.toString()} S${b.outcome.silences.toString()} skill ${f(b.skill)}${b.scored ? '' : ' (not scored)'}`
    )
    .join(' | ')}; score ${f(s.score)}, sharpness ${f(s.sharpness)}`;

const deadText = (r: SlabDeadReading): string =>
  `score ${f(r.score)}, held ${r.held.toString()} of ${r.rows.toString()} (${r.cells
    .map((c) => `${c.group} ${c.held.toString()} of ${c.rows.toString()}`)
    .join(' | ')})`;

console.log(
  `rule 66: ${run.events.earthquakes.toString()} earthquakes (${run.events.byCell.join(' / ')} by cell), ${run.events.leastModelled.toString()} least modelled, ${run.events.quiet.toString()} quiet, ${run.events.deeper.toString()} deeper than 150 km`
);
for (const c of SLAB_CANDIDATES) {
  const s = run.scores[c.key];
  if (s === undefined) continue;
  console.log(`rule 68 ${c.key}: ${scoreText(s.all)}`);
  console.log(`        least modelled: ${scoreText(s.leastModelled)}`);
}
console.log('rule 68:', JSON.stringify(run.choice));
if (run.dead !== null) {
  console.log(
    `rule 69 on ${run.events.guard.toString()} of rule 61's earthquakes deeper than 70 km`
  );
  console.log(`        boore2014: ${deadText(run.dead.readings.inPlace)}`);
  console.log(`        ${run.dead.winner}: ${deadText(run.dead.readings.winner)}`);
  console.log('rule 69: adopted', run.dead.adopted);
}
for (const [label, reading] of Object.entries(run.beside)) {
  for (const c of SLAB_CANDIDATES) {
    const s = reading.scores[c.key];
    if (s === undefined) continue;
    console.log(
      `rule 70 beside, ${label} (${reading.maps.toString()} maps), ${c.key}: ${scoreText(s)}`
    );
  }
}
console.log(`\n${((Date.now() - started) / 1000).toFixed(0)} s`);

const out = process.argv[2];
if (out !== undefined) {
  writeFileSync(out.startsWith('/') ? out : join(ROOT, out), `${JSON.stringify(run, null, 1)}\n`);
}
