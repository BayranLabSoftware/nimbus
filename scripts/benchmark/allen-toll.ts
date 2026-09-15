import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ALLEN_TOLL_BESIDE,
  ALLEN_TOLL_CANDIDATES,
} from '../../src/physics/validation/allenTollRules.js';
import { runAllenToll } from '../../src/physics/validation/allenTollRun.js';
import type { TollCells } from '../../src/physics/validation/interfaceRulesRun.js';

/**
 * Rules 61 to 65 of src/physics/validation/allenTollRules.ts, run once and
 * printed: every toll on rule 61's earthquakes, rule 63's choice, rule 64's
 * guards where there is a winner, and what rule 65 prints beside.
 *
 *   pnpm exec tsx scripts/benchmark/allen-toll.ts [<out.json>]
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const started = Date.now();
const run = runAllenToll();
const f = (x: number | null, digits = 3): string => (x === null ? '—' : x.toFixed(digits));

const cellsText = (cells: TollCells): string =>
  cells
    .map(
      (c) =>
        `${c.group} ×${f(c.stats.bias, 2)} inside ${c.stats.inside.toString()}/${c.stats.rows.toString()}`
    )
    .join(' | ');

console.log(
  `rule 61: ${run.events.earthquakes.toString()} earthquakes (${run.events.small.toString()} small, ${run.events.deep.toString()} deep), ${run.events.recorded.toString()} with deaths`
);
for (const toll of [...ALLEN_TOLL_CANDIDATES, ...ALLEN_TOLL_BESIDE]) {
  const r = run.readings[toll.key] ?? run.beside.readings[toll.key];
  const w = run.beside.windows[toll.key];
  if (r === undefined || w === undefined) continue;
  const rows = run.runs[toll.key] ?? [];
  console.log(
    `${ALLEN_TOLL_CANDIDATES.includes(toll) ? 'rule 63' : 'rule 65 beside'} ${toll.key}: score ${f(r.score)}, held ${r.held.toString()}/${rows.length.toString()}; ${cellsText(r.tollCells)}; small ${f(w.small.score)} held ${w.small.held.toString()}/${w.small.rows.toString()}, deep ${f(w.deep.score)} held ${w.deep.held.toString()}/${w.deep.rows.toString()}; dead counted ${Math.round(rows.reduce((a, x) => a + x.central, 0)).toString()} against ${rows.reduce((a, x) => a + x.record, 0).toString()}`
  );
}
console.log('rule 63:', JSON.stringify(run.choice));
if (run.guards !== null) {
  const g = run.guards;
  console.log(`rule 64 (a) rule 11 boore2014: ${cellsText(g.rule11.inPlace)}`);
  console.log(`            ${g.winner}: ${cellsText(g.rule11.winner)}`);
  console.log(
    `rule 64 (b) rule 23 quiet raised to ten: ${(100 * g.quiet.inPlace.share).toFixed(1)} % against ${(100 * g.quiet.winner.share).toFixed(1)} % of ${g.quiet.inPlace.quiet.toString()}`
  );
  console.log(
    `rule 64 (c) rule 45 score: ${f(g.moderate.inPlace)} against ${f(g.moderate.winner)}`
  );
  console.log('rule 64:', g.decision);
}
console.log(`\n${((Date.now() - started) / 1000).toFixed(0)} s`);

const out = process.argv[2];
if (out !== undefined) {
  writeFileSync(out.startsWith('/') ? out : join(ROOT, out), `${JSON.stringify(run, null, 1)}\n`);
}
