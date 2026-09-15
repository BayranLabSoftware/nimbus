import { simulateEarthquake } from '../events/earthquake/simulate.js';
import {
  ALLEN_TOLL_BESIDE,
  ALLEN_TOLL_CANDIDATES,
  chooseAllenToll,
  guardAllenToll,
  type AllenTollCandidate,
  type AllenTollReading,
  type SmallDeepEarthquake,
} from './allenTollRules.js';
import { falseAlarmShare, isQuiet } from './depthRules.js';
import { RULE_EARTHQUAKES, ruleEarthquakeEvent, ruleSiteVs30 } from './heldOutByRule.js';
import type { TollCells } from './interfaceRulesRun.js';
import { lowIntensityScore } from './lowIntensityRules.js';
import { moderateEarthquakeEvent } from './lowIntensityRun.js';
import { MODERATE_EARTHQUAKES } from './moderateSetData.js';
import { centralEstimate, compareWithRecord, type RecordedEvent } from './recordedTolls.js';
import {
  isInformative,
  scoreStats,
  SIZE_BANDS,
  sizeBandOf,
  type ScoreRowInput,
} from './scorecard.js';
import { siteVs30 } from './siteVs30.js';
import { SMALL_DEEP_EARTHQUAKES, SMALL_DEEP_READ_ON } from './smallDeepSetData.js';
import { SMALL_DEEP_SITES } from './smallDeepSiteData.js';
import { unseenEarthquakeEvent } from './unseenSet.js';
import { UNSEEN_EARTHQUAKES } from './unseenSetData.js';
import { UNSEEN_SITES } from './unseenSiteData.js';

/**
 * Rules 61 to 65 of allenTollRules.ts, run: every toll on rule 61's
 * earthquakes, rule 63's choice, rule 64's guards where there is a winner,
 * and what rule 65 prints beside. One computation for the script that first
 * runs them, the report that prints them and the test that keeps the report
 * honest about them.
 */

const NCEI = 'NCEI/WDS Global Significant Earthquake Database (doi:10.7289/V5TD9V7K)';

const SITE_MAP = new Map(SMALL_DEEP_SITES.map((site) => [site.key, site]));
const UNSEEN_SITE_MAP = new Map(UNSEEN_SITES.map((site) => [site.key, site]));

/** Rule 61: an earthquake of the set as the net's harness runs a row of
 *  rule 11's — inputs by rules 1 to 3, the record by rule 13 — on the
 *  browser's ground. */
export function smallDeepEarthquakeEvent(row: SmallDeepEarthquake): RecordedEvent {
  const vs30 = siteVs30('pick', SITE_MAP.get(row.comcat));
  return {
    ...ruleEarthquakeEvent({ ...row, rakes: null }, { vs30 }),
    source: `${NCEI}, record ${row.nceiIds.join(' and ')}, read ${SMALL_DEEP_READ_ON}; origin, magnitude and moment tensor USGS ComCat ${row.comcat}`,
  };
}

/** An event run with one of rule 62's tolls, everything else as the event
 *  sets it. */
export function withAllenToll(event: RecordedEvent, toll: AllenTollCandidate): RecordedEvent {
  return {
    ...event,
    run: () => {
      const result = event.run();
      if (result.type !== 'earthquake') return result;
      return {
        type: 'earthquake',
        data: simulateEarthquake({
          ...result.data.inputs,
          contourLaw: toll.law,
          lowIntensityDeaths: toll.low,
        }),
      };
    },
  };
}

/** One earthquake of rule 61's set under one toll. */
export interface SmallDeepRun {
  comcat: string;
  window: SmallDeepEarthquake['window'];
  magnitude: number;
  record: number;
  recordHigh: number;
  central: number;
  low: number;
  high: number;
  inside: boolean;
}

export function smallDeepRuns(toll: AllenTollCandidate): SmallDeepRun[] {
  return SMALL_DEEP_EARTHQUAKES.map((row) => {
    const event = withAllenToll(smallDeepEarthquakeEvent(row), toll);
    const result = compareWithRecord(event);
    return {
      comcat: row.comcat,
      window: row.window,
      magnitude: row.magnitude,
      record: event.recordedDeaths,
      recordHigh: event.recordedDeathsHigh ?? event.recordedDeaths,
      central: result.deaths,
      low: result.low,
      high: result.high,
      inside: result.contains,
    };
  });
}

function scoreRow(name: string, magnitude: number, run: Omit<SmallDeepRun, 'comcat' | 'window'>) {
  const row: ScoreRowInput = {
    name,
    quantity: 'toll',
    family: 'earthquake',
    size: magnitude,
    role: 'heldOut',
    record: run.record,
    model: run.central,
    inside: run.inside,
    bandDecades: Math.log10(Math.max(run.high, 1) / Math.max(run.low, 1)),
    bandHigh: run.high,
  };
  return row;
}

function cellsOfRows(rows: readonly ScoreRowInput[]): TollCells {
  return SIZE_BANDS.earthquake.map((b) => ({
    group: b.label,
    stats: scoreStats(
      rows.filter((r) => sizeBandOf('earthquake', r.size) === b.label && isInformative(r))
    ),
  }));
}

/** Rule 63's reading of one toll's runs. */
export function readAllenToll(runs: readonly SmallDeepRun[]): AllenTollReading & {
  tollCells: TollCells;
} {
  const tollCells = cellsOfRows(runs.map((r) => scoreRow(r.comcat, r.magnitude, r)));
  return {
    score: lowIntensityScore(runs),
    held: runs.filter((r) => r.inside).length,
    cells: tollCells.map((c) => ({ inside: c.stats.inside, rows: c.stats.rows })),
    tollCells,
  };
}

/** Rule 64 (a): rule 19's cells on rule 11's held-out tolls under one toll. */
export function allenTollRule11Cells(toll: AllenTollCandidate): TollCells {
  return cellsOfRows(
    RULE_EARTHQUAKES.filter((q) => q.role === 'heldOut').map((q) => {
      const result = compareWithRecord(
        withAllenToll(ruleEarthquakeEvent(q.row, { vs30: ruleSiteVs30(q.row) }), toll)
      );
      return scoreRow(q.event.name, q.row.magnitude, {
        magnitude: q.row.magnitude,
        record: q.event.recordedDeaths,
        recordHigh: q.event.recordedDeathsHigh ?? q.event.recordedDeaths,
        central: result.deaths,
        low: result.low,
        high: result.high,
        inside: result.contains,
      });
    })
  );
}

/** Rule 64 (b): the share of rule 23's quiet earthquakes whose median toll
 *  is ten or more under one toll. */
export function allenTollQuietShare(toll: AllenTollCandidate): { share: number; quiet: number } {
  const tolls = UNSEEN_EARTHQUAKES.filter(isQuiet).map(
    (row) =>
      centralEstimate(
        withAllenToll(
          unseenEarthquakeEvent(row, { vs30: siteVs30('pick', UNSEEN_SITE_MAP.get(row.comcat)) }),
          toll
        )
      )?.deaths ?? 0
  );
  return { share: falseAlarmShare(tolls), quiet: tolls.length };
}

/** Rule 64 (c): the rule 47 score of rule 45's moderate earthquakes under
 *  one toll. */
export function allenTollModerateScore(toll: AllenTollCandidate): number {
  return lowIntensityScore(
    MODERATE_EARTHQUAKES.map((row) => {
      const event = withAllenToll(moderateEarthquakeEvent(row), toll);
      const result = compareWithRecord(event);
      return {
        comcat: row.comcat,
        record: event.recordedDeaths,
        central: result.deaths,
        inside: result.contains,
      };
    })
  );
}

type Reading = ReturnType<typeof readAllenToll>;

export interface AllenTollRun {
  events: { earthquakes: number; small: number; deep: number; recorded: number };
  readings: Record<string, Reading>;
  runs: Record<string, SmallDeepRun[]>;
  choice: ReturnType<typeof chooseAllenToll>;
  /** Rule 64 beside the toll in place; null with no winner. */
  guards: {
    winner: string;
    rule11: Record<'inPlace' | 'winner', TollCells>;
    quiet: Record<'inPlace' | 'winner', { share: number; quiet: number }>;
    moderate: Record<'inPlace' | 'winner', number>;
    decision: ReturnType<typeof guardAllenToll>;
  } | null;
  /** Rule 65, beside: the other tolls on the set, and every toll on the small
   *  and deep earthquakes apart. */
  beside: {
    readings: Record<string, Reading>;
    windows: Record<
      string,
      Record<SmallDeepEarthquake['window'], { score: number; held: number; rows: number }>
    >;
  };
}

export function runAllenToll(): AllenTollRun {
  const runs: Record<string, SmallDeepRun[]> = {};
  for (const toll of [...ALLEN_TOLL_CANDIDATES, ...ALLEN_TOLL_BESIDE]) {
    runs[toll.key] = smallDeepRuns(toll);
  }
  const read = (tolls: readonly AllenTollCandidate[]): Record<string, Reading> =>
    Object.fromEntries(tolls.map((t) => [t.key, readAllenToll(runs[t.key] ?? [])]));
  const readings = read(ALLEN_TOLL_CANDIDATES);
  const choice = chooseAllenToll(readings);

  let guards: AllenTollRun['guards'] = null;
  const inPlace = ALLEN_TOLL_CANDIDATES[0];
  const winner = ALLEN_TOLL_CANDIDATES.find((t) => t.key === choice.winner);
  if (inPlace !== undefined && winner !== undefined) {
    const cellsOf = (cells: TollCells) =>
      cells.map((c) => ({ bias: c.stats.bias, inside: c.stats.inside, rows: c.stats.rows }));
    const rule11 = { inPlace: allenTollRule11Cells(inPlace), winner: allenTollRule11Cells(winner) };
    const quiet = { inPlace: allenTollQuietShare(inPlace), winner: allenTollQuietShare(winner) };
    const moderate = {
      inPlace: allenTollModerateScore(inPlace),
      winner: allenTollModerateScore(winner),
    };
    guards = {
      winner: winner.key,
      rule11,
      quiet,
      moderate,
      decision: guardAllenToll(
        { inPlace: cellsOf(rule11.inPlace), winner: cellsOf(rule11.winner) },
        { inPlaceShare: quiet.inPlace.share, winnerShare: quiet.winner.share },
        { inPlaceScore: moderate.inPlace, winnerScore: moderate.winner }
      ),
    };
  }

  const windows = Object.fromEntries(
    [...ALLEN_TOLL_CANDIDATES, ...ALLEN_TOLL_BESIDE].map((t) => {
      const all = runs[t.key] ?? [];
      const part = (w: SmallDeepEarthquake['window']) => {
        const rows = all.filter((r) => r.window === w);
        return {
          score: lowIntensityScore(rows),
          held: rows.filter((r) => r.inside).length,
          rows: rows.length,
        };
      };
      return [t.key, { small: part('small'), deep: part('deep') }];
    })
  );

  return {
    events: {
      earthquakes: SMALL_DEEP_EARTHQUAKES.length,
      small: SMALL_DEEP_EARTHQUAKES.filter((q) => q.window === 'small').length,
      deep: SMALL_DEEP_EARTHQUAKES.filter((q) => q.window === 'deep').length,
      recorded: SMALL_DEEP_EARTHQUAKES.filter((q) => q.deaths > 0).length,
    },
    readings,
    runs,
    choice,
    guards,
    beside: { readings: read(ALLEN_TOLL_BESIDE), windows },
  };
}
