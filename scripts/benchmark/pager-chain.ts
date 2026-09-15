import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHAKING_CHAINS, type ShakingChainName } from '../../src/physics/validation/pagerChain.js';
import { runPagerChains } from '../../src/physics/validation/pagerChainRun.js';

/**
 * Rules 31 to 34 of src/physics/validation/pagerChain.ts, run once and
 * printed: each chain's people against PAGER's, its held-out tolls, its
 * ShakeMap score, what rule 34 prints beside, and rule 33's decision.
 *
 *   pnpm exec tsx scripts/benchmark/pager-chain.ts [<out.json>]
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const run = runPagerChains();
const names = Object.keys(SHAKING_CHAINS) as ShakingChainName[];
const f = (x: number | null, digits = 2): string => (x === null ? '—' : x.toFixed(digits));

for (const name of names) {
  const c = run.chains[name];
  console.log(`\n## ${name} (${SHAKING_CHAINS[name].measure}, ${SHAKING_CHAINS[name].bands})`);
  console.log(`people score ${f(c.people.score, 3)} over ${c.people.events.toString()} events`);
  for (const cell of c.people.cells) {
    console.log(
      `  MMI ≥ ${cell.level.toString()} ${cell.sizeBand.padEnd(11)} pairs ${cell.pairs.toString().padStart(3)} bias ${cell.bias === null ? '—' : `${f(cell.bias, 3)} (×${f(Math.exp(cell.bias))})`}`
    );
  }
  console.log(
    `toll vs PAGER: bias ×${f(c.people.tollAgainstPager.bias)} over ${c.people.tollAgainstPager.scored.toString()} pairs; alert agreement ${(100 * c.people.alertAgreement).toFixed(0)} %`
  );
  for (const t of c.tolls) {
    console.log(
      `  tolls ${t.group.padEnd(11)} bias ×${f(t.stats.bias)} inside ${t.stats.inside.toString()} of ${t.stats.rows.toString()}`
    );
  }
  console.log(`shaking (rule 18) ${f(c.shakingScore, 3)}`);
  for (const cell of c.shaking) {
    console.log(
      `  maps ${cell.sizeBand.padEnd(11)} pairs ${cell.pairs.toString()} bias ${f(cell.bias, 3)} invented ${cell.invented.toString()} missed ${cell.missed.toString()}`
    );
  }
  const q = c.quietMaps;
  console.log(
    `rule 28 on rule 23's maps: score ${f(q.score, 3)} sharpness ${f(q.sharpness, 3)} ` +
      q.bands
        .map(
          (b) =>
            `MMI ${b.band.toString()}: hits ${b.outcome.hits.toString()} misses ${b.outcome.misses.toString()} false alarms ${b.outcome.falseAlarms.toString()} silences ${b.outcome.silences.toString()}`
        )
        .join('; ')
  );
}
console.log('\nrule 33, PAGER’s chain:', run.decision);
console.log('rule 34, the halves:', run.halves);

const out = process.argv[2];
if (out !== undefined) {
  writeFileSync(
    out.startsWith('/') ? out : join(ROOT, out),
    `${JSON.stringify(
      {
        decision: run.decision,
        halves: run.halves,
        chains: Object.fromEntries(
          names.map((name) => {
            const c = run.chains[name];
            return [
              name,
              {
                people: { score: c.people.score, cells: c.people.cells },
                tollAgainstPager: c.people.tollAgainstPager,
                alertAgreement: c.people.alertAgreement,
                tolls: c.tolls,
                shaking: { score: c.shakingScore, cells: c.shaking },
                quietMaps: c.quietMaps,
              },
            ];
          })
        ),
      },
      null,
      1
    )}\n`
  );
}
