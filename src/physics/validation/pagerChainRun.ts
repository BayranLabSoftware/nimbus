import { simulateEarthquake } from '../events/earthquake/simulate.js';
import { contourPairs, type QuakeInputs } from './contourComparison.js';
import { meanAbsoluteBias, scoreContours, type ContourCell } from './contourLaws.js';
import { RULE_EARTHQUAKES, ruleEarthquakeEvent, ruleSiteVs30 } from './heldOutByRule.js';
import { HELD_OUT_EARTHQUAKES } from './heldOutEvents.js';
import {
  adoptPagerChain,
  PEOPLE_LEVELS,
  pagerPeopleAtLeast,
  peopleScoreOf,
  scorePeople,
  SHAKING_CHAINS,
  type ChainEvidence,
  type PeopleCell,
  type PeoplePair,
  type ShakingChain,
  type ShakingChainName,
} from './pagerChain.js';
import { PAGER_PRODUCTS } from './pagerProductsData.js';
import { prospectiveScore, type ProspectiveScore } from './prospectiveRules.js';
import {
  centralEstimate,
  compareWithRecord,
  RECORDED_EVENTS,
  type RecordedEvent,
} from './recordedTolls.js';
import { RULE_SHAKEMAPS } from './ruleShakemapData.js';
import {
  isInformative,
  scoreStats,
  SIZE_BANDS,
  sizeBandOf,
  type ScoreRowInput,
  type ScoreStats,
} from './scorecard.js';
import { siteVs30 } from './siteVs30.js';
import { unseenEarthquakeEvent, unseenShakemaps } from './unseenSet.js';
import { UNSEEN_EARTHQUAKES } from './unseenSetData.js';
import { UNSEEN_SITES } from './unseenSiteData.js';

/**
 * Rules 31 to 34 of pagerChain.ts, run: each chain on the campaign's
 * PAGER earthquakes, on rule 11's held-out tolls and on rule 18's maps,
 * and rule 33's decision. One computation for the script that first ran
 * them, the report that prints them and the test that keeps the report
 * honest about them.
 */

/** The benchmark campaign's net earthquakes, by their ComCat ids. */
export const PAGER_NET: Readonly<Record<string, string>> = {
  ci3144585: 'Northridge 1994',
  usp000gvtu: "L'Aquila 2009",
  us10006g7d: 'Amatrice 2016',
  us20002926: 'Gorkha (Nepal) 2015',
  official20110311054624120_30: 'Tōhoku 2011',
  usp000asvm: 'Kokoxili (Kunlun) 2001',
  usp000huvq: 'Christchurch 2011',
  us20005iis: 'Kumamoto 2016',
  us1000778i: 'Kaikōura 2016',
  us70006d0m: 'Durrës (Albania) 2019',
};

/** The events the campaign's EQ-PAGER track ran, by ComCat id: rule 23's
 *  earthquakes on the browser's ground, rule 11's rows, and the net's. */
export function pagerSetEvents(): Map<string, { event: RecordedEvent; net: boolean }> {
  const out = new Map<string, { event: RecordedEvent; net: boolean }>();
  const sites = new Map(UNSEEN_SITES.map((s) => [s.key, s]));
  for (const q of UNSEEN_EARTHQUAKES) {
    out.set(q.comcat, {
      event: unseenEarthquakeEvent(q, { vs30: siteVs30('pick', sites.get(q.comcat)) }),
      net: false,
    });
  }
  for (const r of RULE_EARTHQUAKES) out.set(r.row.comcat, { event: r.event, net: false });
  const named = [...RECORDED_EVENTS, ...HELD_OUT_EARTHQUAKES];
  for (const [comcat, name] of Object.entries(PAGER_NET)) {
    const event = named.find((e) => e.name === name);
    if (event !== undefined) out.set(comcat, { event, net: true });
  }
  return out;
}

/** An event run on a chain: its earthquake simulated again with the
 *  chain's measure and banding, everything else as the event sets it. */
export function withShakingChain(event: RecordedEvent, chain: ShakingChain): RecordedEvent {
  return {
    ...event,
    run: () => {
      const result = event.run();
      if (result.type !== 'earthquake') return result;
      return {
        type: 'earthquake',
        data: simulateEarthquake({
          ...result.data.inputs,
          intensityMeasure: chain.measure,
          intensityBanding: chain.bands,
        }),
      };
    },
  };
}

const ALERT_THRESHOLDS = [1, 100, 1_000] as const;
/** PAGER's fatality alert from a toll: green, yellow, orange, red. */
export const alertLevelOf = (deaths: number): number =>
  ALERT_THRESHOLDS.filter((t) => deaths >= t).length;

export interface PeopleRun {
  pairs: PeoplePair[];
  cells: PeopleCell[];
  score: number;
  /** Rule 34: central toll against PAGER's estimate, and the alerts. */
  tollAgainstPager: ScoreStats;
  alertAgreement: number;
  events: number;
}

/** Rule 32 for one chain. */
export function runPeople(chain: ShakingChain): PeopleRun {
  const set = pagerSetEvents();
  const pairs: PeoplePair[] = [];
  const tollRows: ScoreRowInput[] = [];
  let agree = 0;
  let events = 0;
  for (const product of PAGER_PRODUCTS) {
    const found = set.get(product.comcat);
    if (found === undefined) continue;
    const event = withShakingChain(found.event, chain);
    const result = event.run();
    if (result.type !== 'earthquake') continue;
    const estimate = centralEstimate(event);
    const people = (key: string): number =>
      estimate?.bands.find((b) => b.key === key)?.population ?? 0;
    const magnitude = result.data.inputs.magnitude;
    for (const level of PEOPLE_LEVELS) {
      const keys = PEOPLE_LEVELS.filter((k) => k >= level).map((k) => `mmi${k.toString()}`);
      pairs.push({
        magnitude,
        level,
        model: keys.reduce((sum, key) => sum + people(key), 0),
        pager: pagerPeopleAtLeast(product, level),
      });
    }
    const deaths = estimate?.deaths ?? 0;
    tollRows.push({
      name: product.comcat,
      quantity: 'toll',
      family: 'earthquake',
      size: magnitude,
      role: 'heldOut',
      record: product.fatalities,
      model: deaths,
      inside: false,
      bandDecades: null,
    });
    if (alertLevelOf(deaths) === alertLevelOf(product.fatalities)) agree += 1;
    events += 1;
  }
  const cells = scorePeople(pairs);
  return {
    pairs,
    cells,
    score: peopleScoreOf(cells),
    tollAgainstPager: scoreStats(tollRows),
    alertAgreement: events === 0 ? 0 : agree / events,
    events,
  };
}

export type TollCells = { group: string; stats: ScoreStats }[];

/** Rule 33 (b) for one chain: rule 19's cells on rule 11's held-out
 *  tolls, on the browser's ground. */
export function runTolls(chain: ShakingChain): TollCells {
  const rows = RULE_EARTHQUAKES.filter((q) => q.role === 'heldOut').map((q) => {
    const toll = compareWithRecord(
      withShakingChain(ruleEarthquakeEvent(q.row, { vs30: ruleSiteVs30(q.row) }), chain)
    );
    const row: ScoreRowInput = {
      name: q.event.name,
      quantity: 'toll',
      family: 'earthquake',
      size: q.row.magnitude,
      role: q.role,
      record: q.event.recordedDeaths,
      model: toll.deaths,
      inside: toll.contains,
      bandDecades: Math.log10(Math.max(toll.high, 1) / Math.max(toll.low, 1)),
      bandHigh: toll.high,
    };
    return row;
  });
  return SIZE_BANDS.earthquake.map((b) => ({
    group: b.label,
    stats: scoreStats(
      rows.filter((r) => sizeBandOf('earthquake', r.size) === b.label && isInformative(r))
    ),
  }));
}

/** Rule 33 (c) for one chain: rule 18's cells on its maps, the rings at
 *  7.0, 8.0 and 9.0, on the browser's ground. */
export function runShaking(chain: ShakingChain): ContourCell[] {
  return scoreContours(
    contourPairs(
      'boore2014',
      RULE_SHAKEMAPS,
      (row) => ruleSiteVs30(row),
      RULE_EARTHQUAKES.map((q) => q.row),
      chain.measure
    )
  );
}

/** Rule 34: rule 28's counts on rule 23's maps, for one chain. */
export function runQuietMaps(chain: ShakingChain): ProspectiveScore {
  const sites = new Map(UNSEEN_SITES.map((s) => [s.key, s]));
  const rows: QuakeInputs[] = UNSEEN_EARTHQUAKES.map((q) => q);
  return prospectiveScore(
    contourPairs(
      'boore2014',
      unseenShakemaps(UNSEEN_EARTHQUAKES),
      (row) => siteVs30('pick', sites.get(row.comcat)),
      rows,
      chain.measure
    )
  );
}

export interface ChainRun {
  people: PeopleRun;
  tolls: TollCells;
  shaking: ContourCell[];
  shakingScore: number;
  quietMaps: ProspectiveScore;
}

export interface PagerChainRun {
  chains: Record<ShakingChainName, ChainRun>;
  /** Rule 33 for PAGER's chain, and for each half-chain as rule 34
   *  prints it. */
  decision: ReturnType<typeof adoptPagerChain>;
  halves: Record<'pgaWithPagerBands' | 'pgvWithRings', ReturnType<typeof adoptPagerChain>>;
}

const evidenceOf = (run: ChainRun): ChainEvidence => ({
  people: run.people.score,
  tolls: run.tolls.map((c) => ({
    bias: c.stats.bias,
    inside: c.stats.inside,
    rows: c.stats.rows,
  })),
  shaking: run.shakingScore,
});

export function runOneChain(chain: ShakingChain): ChainRun {
  const shaking = runShaking(chain);
  return {
    people: runPeople(chain),
    tolls: runTolls(chain),
    shaking,
    shakingScore: meanAbsoluteBias(shaking),
    quietMaps: runQuietMaps(chain),
  };
}

export function runPagerChains(): PagerChainRun {
  const chains = Object.fromEntries(
    (Object.keys(SHAKING_CHAINS) as ShakingChainName[]).map((name) => [
      name,
      runOneChain(SHAKING_CHAINS[name]),
    ])
  ) as Record<ShakingChainName, ChainRun>;
  const inPlace = evidenceOf(chains.inPlace);
  return {
    chains,
    decision: adoptPagerChain(inPlace, evidenceOf(chains.pager)),
    halves: {
      pgaWithPagerBands: adoptPagerChain(inPlace, evidenceOf(chains.pgaWithPagerBands)),
      pgvWithRings: adoptPagerChain(inPlace, evidenceOf(chains.pgvWithRings)),
    },
  };
}
