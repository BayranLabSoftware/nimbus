import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pagerSetEvents } from '../../src/physics/validation/pagerChainRun.js';
import { centralEstimate } from '../../src/physics/validation/recordedTolls.js';
import { sizeBandOf } from '../../src/physics/validation/scorecard.js';
import { printStats, summarise, type Pair } from './stats.js';

/**
 * Track EQ-PAGER of the benchmark protocol: the people Nimbus puts inside
 * its MMI VII, VIII and IX footprints, and its central toll, against the
 * USGS PAGER loss product of the same earthquake (population exposure by
 * intensity, empirical fatality estimate), for every earthquake of the
 * net, rule 11 and rule 23 that has one (scripts/benchmark/pager-bench.ts).
 *
 *   pnpm exec tsx scripts/benchmark/compare-pager.ts <pager.jsonl> [<pairs.json>]
 *
 * Nimbus's side is the validation harness's own run of each row
 * (`centralEstimate` in recordedTolls.ts): the shipped population raster
 * counted in the footprints the application draws, on the browser's
 * ground, with the country's PAGER curve at the epicentre. PAGER counts
 * people on a ShakeMap built with the recordings; Nimbus on its rings.
 * The fatality alert of both sides is read from its central toll with
 * PAGER's thresholds: green below 1, yellow below 100, orange below
 * 1 000, red above.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

interface PagerRow {
  comcat: string;
  status: string;
  exposures?: { population_exposure?: { mmi: number[]; aggregated_exposure: number[] } } | null;
  losses?: { empirical_fatality?: { total_fatalities: number } } | null;
}

const ALERTS = ['green', 'yellow', 'orange', 'red'] as const;
const alertOf = (deaths: number): number =>
  deaths < 1 ? 0 : deaths < 100 ? 1 : deaths < 1_000 ? 2 : 3;

export function comparePairs(pagerPath: string): { pairs: Pair[]; missing: string[] } {
  const rows = readFileSync(pagerPath, 'utf8')
    .split('\n')
    .filter((l) => l.trim() !== '')
    .map((l) => JSON.parse(l) as PagerRow);
  const events = pagerSetEvents();
  const pairs: Pair[] = [];
  const missing: string[] = [];
  for (const row of rows) {
    const exposure = row.exposures?.population_exposure;
    const fatalities = row.losses?.empirical_fatality?.total_fatalities;
    if (row.status !== 'ok' || exposure === undefined || fatalities === undefined) continue;
    const found = events.get(row.comcat);
    if (found === undefined) {
      missing.push(row.comcat);
      continue;
    }
    const { event, net } = found;
    const result = event.run();
    if (result.type !== 'earthquake') continue;
    const estimate = centralEstimate(event);
    const base = {
      track: 'EQ-PAGER',
      caseId: `${row.comcat} ${event.name}`,
      source: net ? ('preset' as const) : ('custom' as const),
      band: sizeBandOf('earthquake', result.data.inputs.magnitude),
      cls: 'C' as const,
    };
    const annulus = (key: string): number =>
      estimate?.bands.find((b) => b.key === key)?.population ?? 0;
    const nimbusAtLeast: Record<number, number> = {
      9: annulus('mmi9'),
      8: annulus('mmi9') + annulus('mmi8'),
      7: annulus('mmi9') + annulus('mmi8') + annulus('mmi7'),
    };
    for (const mmi of [7, 8, 9]) {
      const pager = exposure.mmi.reduce(
        (sum, level, k) => (level >= mmi ? sum + (exposure.aggregated_exposure[k] ?? 0) : sum),
        0
      );
      pairs.push({
        ...base,
        quantity: `exposureMmi${mmi.toString()}Plus`,
        detail: `MMI ≥ ${mmi.toString()}`,
        nimbus: nimbusAtLeast[mmi] ?? 0,
        reference: pager,
      });
    }
    const deaths = estimate?.deaths ?? 0;
    pairs.push({
      ...base,
      quantity: 'centralToll',
      detail: '',
      nimbus: deaths,
      reference: fatalities,
    });
    pairs.push({
      ...base,
      quantity: 'fatalityAlert',
      detail: `PAGER ${ALERTS[alertOf(fatalities)] ?? ''}, Nimbus ${ALERTS[alertOf(deaths)] ?? ''}`,
      nimbus: alertOf(deaths),
      reference: alertOf(fatalities),
      categorical: true,
    });
  }
  return { pairs, missing };
}

const pagerPath = process.argv[2];
if (pagerPath !== undefined) {
  const { pairs, missing } = comparePairs(pagerPath);
  const stats = summarise(pairs);
  // How far apart the alerts are, where they differ.
  const alerts = pairs.filter((p) => p.quantity === 'fatalityAlert');
  const confusion: Record<string, number> = {};
  for (const p of alerts) {
    const key = `PAGER ${ALERTS[p.reference ?? 0] ?? ''} → Nimbus ${ALERTS[p.nimbus ?? 0] ?? ''}`;
    confusion[key] = (confusion[key] ?? 0) + 1;
  }
  mkdirSync(join(ROOT, 'benchmark', 'results'), { recursive: true });
  writeFileSync(
    join(ROOT, 'benchmark', 'results', 'pager.json'),
    `${JSON.stringify({ track: 'EQ-PAGER', reference: 'USGS PAGER loss products via ComCat', events: alerts.length, unmatched: missing, alertConfusion: confusion, stats }, null, 1)}\n`
  );
  const pairsOut = process.argv[3];
  if (pairsOut !== undefined) writeFileSync(pairsOut, JSON.stringify(pairs));
  printStats(stats);
  console.log(
    `events ${alerts.length.toString()}, unmatched ${missing.length.toString()}`,
    confusion
  );
}
