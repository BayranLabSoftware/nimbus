import { simulateEarthquake } from '../events/earthquake/simulate.js';
import { falseAlarmShare, isQuiet } from './depthRules.js';
import { RULE_EARTHQUAKES, ruleEarthquakeEvent, ruleSiteVs30 } from './heldOutByRule.js';
import {
  chooseLowIntensityToll,
  guardLowIntensityToll,
  LOW_INTENSITY_TOLLS,
  type LowIntensityToll,
  type ModerateEarthquake,
  type TollRun,
} from './lowIntensityRules.js';
import { MODERATE_EARTHQUAKES, MODERATE_READ_ON } from './moderateSetData.js';
import { MODERATE_SITES } from './moderateSiteData.js';
import { alertLevelOf, pagerSetEvents, type TollCells } from './pagerChainRun.js';
import { PAGER_PRODUCTS } from './pagerProductsData.js';
import { centralEstimate, compareWithRecord, type RecordedEvent } from './recordedTolls.js';
import {
  isInformative,
  scoreStats,
  SIZE_BANDS,
  sizeBandOf,
  type ScoreRowInput,
  type ScoreStats,
} from './scorecard.js';
import { siteVs30 } from './siteVs30.js';
import { unseenEarthquakeEvent } from './unseenSet.js';
import { UNSEEN_EARTHQUAKES } from './unseenSetData.js';
import { UNSEEN_SITES } from './unseenSiteData.js';

/**
 * Rules 45 to 49 of lowIntensityRules.ts, run: the three tolls on rule
 * 45's moderate earthquakes, rule 47's choice, rule 48's guards where
 * there is a winner, and what rule 49 prints beside. One computation for
 * the script that first ran them, the report that prints them and the
 * test that keeps the report honest about them.
 */

const NCEI = 'NCEI/WDS Global Significant Earthquake Database (doi:10.7289/V5TD9V7K)';

const MODERATE_SITE_MAP = new Map(MODERATE_SITES.map((site) => [site.key, site]));
const UNSEEN_SITE_MAP = new Map(UNSEEN_SITES.map((site) => [site.key, site]));

/** Rule 45: an earthquake of the moderate set as the net's harness runs a
 *  row of rule 11's — inputs by rules 1 to 3, the record by rule 13 — on
 *  the browser's ground. */
export function moderateEarthquakeEvent(row: ModerateEarthquake): RecordedEvent {
  const vs30 = siteVs30('pick', MODERATE_SITE_MAP.get(row.comcat));
  return {
    ...ruleEarthquakeEvent({ ...row, rakes: null }, { vs30 }),
    source: `${NCEI}, record ${row.nceiIds.join(' and ')}, read ${MODERATE_READ_ON}; origin, magnitude and moment tensor USGS ComCat ${row.comcat}`,
  };
}

/** An event run with one of rule 46's tolls, everything else as the event
 *  sets it. */
export function withLowIntensity(event: RecordedEvent, toll: LowIntensityToll): RecordedEvent {
  return {
    ...event,
    run: () => {
      const result = event.run();
      if (result.type !== 'earthquake') return result;
      return {
        type: 'earthquake',
        data: simulateEarthquake({ ...result.data.inputs, lowIntensityDeaths: toll }),
      };
    },
  };
}

/** One of rule 45's earthquakes under one toll, with what the report
 *  prints of it beside rule 47's columns. */
export interface ModerateRun extends TollRun {
  magnitude: number;
  recordHigh: number;
  low: number;
  high: number;
}

/** Rule 47: every earthquake of rule 45's set under one toll. */
export function moderateRuns(toll: LowIntensityToll): ModerateRun[] {
  return MODERATE_EARTHQUAKES.map((row) => {
    const event = withLowIntensity(moderateEarthquakeEvent(row), toll);
    const result = compareWithRecord(event);
    return {
      comcat: row.comcat,
      record: event.recordedDeaths,
      recordHigh: event.recordedDeathsHigh ?? event.recordedDeaths,
      central: result.deaths,
      inside: result.contains,
      magnitude: row.magnitude,
      low: result.low,
      high: result.high,
    };
  });
}

/** Rule 48 (a): rule 19's cells on rule 11's held-out tolls under one
 *  toll, on the browser's ground. */
export function lowIntensityTollCells(toll: LowIntensityToll): TollCells {
  const rows = RULE_EARTHQUAKES.filter((q) => q.role === 'heldOut').map((q) => {
    const result = compareWithRecord(
      withLowIntensity(ruleEarthquakeEvent(q.row, { vs30: ruleSiteVs30(q.row) }), toll)
    );
    const row: ScoreRowInput = {
      name: q.event.name,
      quantity: 'toll',
      family: 'earthquake',
      size: q.row.magnitude,
      role: q.role,
      record: q.event.recordedDeaths,
      model: result.deaths,
      inside: result.contains,
      bandDecades: Math.log10(Math.max(result.high, 1) / Math.max(result.low, 1)),
      bandHigh: result.high,
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

/** Rule 48 (b): the share of rule 23's quiet earthquakes whose median toll
 *  is ten or more under one toll, on the browser's ground. */
export function lowIntensityQuietShare(toll: LowIntensityToll): { share: number; quiet: number } {
  const tolls = UNSEEN_EARTHQUAKES.filter(isQuiet).map(
    (row) =>
      centralEstimate(
        withLowIntensity(
          unseenEarthquakeEvent(row, { vs30: siteVs30('pick', UNSEEN_SITE_MAP.get(row.comcat)) }),
          toll
        )
      )?.deaths ?? 0
  );
  return { share: falseAlarmShare(tolls), quiet: tolls.length };
}

/** Rule 49, beside: a toll's central figure against PAGER's estimate on
 *  the campaign's PAGER products, as rule 34 reads it. */
export interface AgainstPager {
  stats: ScoreStats;
  alertAgreement: number;
  events: number;
}

export function lowIntensityAgainstPager(toll: LowIntensityToll): AgainstPager {
  const set = pagerSetEvents();
  const rows: ScoreRowInput[] = [];
  let agree = 0;
  for (const product of PAGER_PRODUCTS) {
    const found = set.get(product.comcat);
    if (found === undefined) continue;
    const event = withLowIntensity(found.event, toll);
    const result = event.run();
    if (result.type !== 'earthquake') continue;
    const deaths = centralEstimate(event)?.deaths ?? 0;
    rows.push({
      name: product.comcat,
      quantity: 'toll',
      family: 'earthquake',
      size: result.data.inputs.magnitude,
      role: 'heldOut',
      record: product.fatalities,
      model: deaths,
      inside: false,
      bandDecades: null,
    });
    if (alertLevelOf(deaths) === alertLevelOf(product.fatalities)) agree += 1;
  }
  return {
    stats: scoreStats(rows),
    alertAgreement: rows.length === 0 ? 0 : agree / rows.length,
    events: rows.length,
  };
}

export interface LowIntensityRun {
  events: { earthquakes: number; recorded: number; tenOrMore: number; missing: number };
  selection: Record<LowIntensityToll, ModerateRun[]>;
  choice: ReturnType<typeof chooseLowIntensityToll>;
  /** Rules 48 and 49 for the winner beside the toll in place; null when
   *  no candidate is eligible, and nothing else runs. */
  winner: {
    toll: LowIntensityToll;
    tolls: Record<'inPlace' | 'winner', TollCells>;
    quiet: Record<'inPlace' | 'winner', { share: number; quiet: number }>;
    decision: ReturnType<typeof guardLowIntensityToll>;
    againstPager: Record<'inPlace' | 'winner', AgainstPager>;
  } | null;
}

export function runLowIntensity(): LowIntensityRun {
  const selection = Object.fromEntries(
    LOW_INTENSITY_TOLLS.map((toll) => [toll, moderateRuns(toll)])
  ) as Record<LowIntensityToll, ModerateRun[]>;
  const choice = chooseLowIntensityToll(selection);

  let winner: LowIntensityRun['winner'] = null;
  if (choice.winner !== 'none') {
    const cellsOf = (cells: TollCells) =>
      cells.map((c) => ({ bias: c.stats.bias, inside: c.stats.inside, rows: c.stats.rows }));
    const tolls = {
      inPlace: lowIntensityTollCells('none'),
      winner: lowIntensityTollCells(choice.winner),
    };
    const quiet = {
      inPlace: lowIntensityQuietShare('none'),
      winner: lowIntensityQuietShare(choice.winner),
    };
    winner = {
      toll: choice.winner,
      tolls,
      quiet,
      decision: guardLowIntensityToll(
        { inPlace: cellsOf(tolls.inPlace), winner: cellsOf(tolls.winner) },
        { inPlaceShare: quiet.inPlace.share, winnerShare: quiet.winner.share }
      ),
      againstPager: {
        inPlace: lowIntensityAgainstPager('none'),
        winner: lowIntensityAgainstPager(choice.winner),
      },
    };
  }

  return {
    events: {
      earthquakes: MODERATE_EARTHQUAKES.length,
      recorded: MODERATE_EARTHQUAKES.filter((q) => q.deaths > 0).length,
      tenOrMore: MODERATE_EARTHQUAKES.filter((q) => q.deaths >= 10).length,
      missing: MODERATE_EARTHQUAKES.filter((q) => q.missing > 0).length,
    },
    selection,
    choice,
    winner,
  };
}
