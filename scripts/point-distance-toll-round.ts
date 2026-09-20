import { simulateEarthquake } from '../src/physics/events/earthquake/simulate.js';
import {
  centralEstimate,
  compareWithRecord,
  RECORDED_EVENTS,
  sampleToll,
  type RecordedEvent,
} from '../src/physics/validation/recordedTolls.js';
import { UNSEEN_EARTHQUAKES } from '../src/physics/validation/unseenSetData.js';
import { UNSEEN_SITES } from '../src/physics/validation/unseenSiteData.js';
import { siteVs30 } from '../src/physics/validation/siteVs30.js';
import { isQuiet } from '../src/physics/validation/depthRules.js';
import { unseenEarthquakeEvent } from '../src/physics/validation/unseenSet.js';
import { intervalScore } from '../src/physics/validation/intervalScoreRules.js';
import {
  bandWidthLn,
  medianOf,
  QUIET_TOLL_THRESHOLD,
} from '../src/physics/validation/quietBandRules.js';
import { CITED } from '../src/physics/validation/pointDistanceTollRules.js';

/**
 * The round of rules 478 to 482: what Thompson & Worden's distance costs
 * on the dead and on the quiet, with the peak held fixed by construction.
 *
 * Usage:
 *   pnpm exec tsx scripts/point-distance-toll-round.ts
 */

const SITES = new Map(UNSEEN_SITES.map((s) => [s.key, s]));
const ARMS = [
  { key: 'ships', on: false },
  { key: 'boore + Thompson-Worden', on: true },
] as const;

function withDistance(event: RecordedEvent, on: boolean): RecordedEvent {
  if (!on) return event;
  const run = event.run;
  return {
    ...event,
    run: () => {
      const r = run();
      if (r.type !== 'earthquake') return r;
      return {
        type: 'earthquake',
        data: simulateEarthquake({
          ...r.data.inputs,
          pointSourceDistance: 'thompsonWorden2018',
        }),
      };
    },
  };
}

function main(): void {
  console.log('### rule 479(a) and (b) — cited from af2ffe4, not re-run');
  console.log(
    `  the peak: +${CITED.peakMeanBias.toFixed(2)} MMI, identical to the shipped law ` +
      `(R_JB is horizontal; the test of rule 478 pins it)`
  );
  console.log(
    `  the areas: ${CITED.shippedAreaBias.toFixed(3)}x → ${CITED.areaBias.toFixed(3)}x, ` +
      `scatter 1.579 → ${CITED.areaScatter.toFixed(3)}`
  );

  console.log('\n### rule 479(c) — the dead, on the net rows');
  const base = RECORDED_EVENTS.map((r) => compareWithRecord(r));
  const inside0 = base.filter((c) => c.contains).length;
  const netScore = new Map<string, number>();
  for (const arm of ARMS) {
    let inside = 0;
    let score = 0;
    const lost: string[] = [];
    const gained: string[] = [];
    RECORDED_EVENTS.forEach((row, i) => {
      const a = base[i];
      if (a === undefined) return;
      const b = arm.on ? compareWithRecord(withDistance(row, true)) : a;
      if (b.contains) inside += 1;
      if (a.contains && !b.contains) lost.push(row.name);
      if (!a.contains && b.contains) gained.push(row.name);
      score += intervalScore(b.low, b.high, row.recordedDeaths);
    });
    netScore.set(arm.key, score);
    console.log(
      `  ${arm.key.padEnd(24)} score ${score.toFixed(1)} · inside ${inside.toString()}/${inside0.toString()} · ` +
        `lost ${lost.length === 0 ? 'none' : lost.join(', ')} · ` +
        `gained ${gained.length === 0 ? 'none' : gained.join(', ')}`
    );
  }

  console.log('\n### rule 479(d) — the quiet, on 805');
  const quiet = UNSEEN_EARTHQUAKES.filter(isQuiet);
  const quietScore = new Map<string, number>();
  const quietLoud = new Map<string, number>();
  for (const arm of ARMS) {
    let loud = 0;
    let zero = 0;
    let banded = 0;
    let score = 0;
    const widths: number[] = [];
    for (const row of quiet) {
      const vs30 = siteVs30('pick', SITES.get(row.comcat));
      const event = withDistance(unseenEarthquakeEvent(row, { vs30 }), arm.on);
      if ((centralEstimate(event)?.deaths ?? 0) >= QUIET_TOLL_THRESHOLD) loud += 1;
      const band = sampleToll(event);
      if (band === null) continue;
      banded += 1;
      if (band.low.deaths <= 0) zero += 1;
      score += intervalScore(band.low.deaths, band.high.deaths, 0);
      const w = bandWidthLn(band.low.deaths, band.high.deaths);
      if (w !== null) widths.push(w);
    }
    quietScore.set(arm.key, score);
    quietLoud.set(arm.key, loud);
    const width = medianOf(widths);
    console.log(
      `  ${arm.key.padEnd(24)} score ${score.toFixed(0)} · toll >= 10: ${loud.toString()} · ` +
        `band reaches zero ${zero.toString()}/${banded.toString()} · median width ` +
        (width === null ? '—' : width.toFixed(2))
    );
  }

  console.log('\n### rule 480 — the verdict');
  const candidate = ARMS[1].key;
  const n = netScore.get(candidate) ?? Number.POSITIVE_INFINITY;
  const nb = netScore.get('ships') ?? Number.POSITIVE_INFINITY;
  const q = quietScore.get(candidate) ?? Number.POSITIVE_INFINITY;
  const qb = quietScore.get('ships') ?? Number.POSITIVE_INFINITY;
  const l = quietLoud.get(candidate) ?? Number.POSITIVE_INFINITY;
  const lb = quietLoud.get('ships') ?? Number.POSITIVE_INFINITY;
  const ok = n <= nb && q <= qb && l <= lb;
  console.log(
    `  net ${n.toFixed(1)} vs ${nb.toFixed(1)} ${n <= nb ? 'OK' : 'worse'} · ` +
      `quiet ${q.toFixed(0)} vs ${qb.toFixed(0)} ${q <= qb ? 'OK' : 'worse'} · ` +
      `toll >= 10: ${l.toString()} vs ${lb.toString()} ${l <= lb ? 'OK' : 'worse'} → ` +
      (ok ? 'DISPLACES' : 'refused')
  );

  console.log('\n### rule 481 — the attribution, whichever way it fell');
  console.log(
    `  the rings alone moved from 0.393x to 1.087x with the peak untouched, and the tolls went ` +
      `${q > qb ? 'WORSE' : 'no worse'} on the quiet and ${n > nb ? 'WORSE' : 'no worse'} on the net.`
  );
  console.log(
    q > qb
      ? '  → the cost follows the EXPOSURE: the toll chain is calibrated against rings too small.'
      : '  → the cost does NOT follow the footprint; the peak and the shape carry it.'
  );
}

main();
