import { simulateEarthquake, type EarthquakeScenarioInput } from '../events/earthquake/simulate.js';
import {
  ATLAS_CANDIDATES,
  chooseAtlasCandidate,
  type AtlasCandidate,
  type AtlasEarthquake,
  type AtlasScores,
} from './atlasRules.js';
import { ATLAS_EARTHQUAKES } from './atlasSetData.js';
import { ATLAS_SITES } from './atlasSiteData.js';
import { contourPairs, type QuakeInputs, type RowVs30 } from './contourComparison.js';
import type { ShakemapAreas } from './contourLaws.js';
import { falseAlarmShare, isQuiet } from './depthRules.js';
import { RULE_EARTHQUAKES, ruleEarthquakeEvent, ruleSiteVs30 } from './heldOutByRule.js';
import { adoptInterfaceLaw } from './interfaceRules.js';
import type { TollCells } from './interfaceRulesRun.js';
import { isLeastModelled } from './pointSourceRules.js';
import { pointSourceGround } from './pointSourceRun.js';
import { POINT_SOURCE_EARTHQUAKES } from './pointSourceSetData.js';
import { prospectiveScore, type ProspectiveScore } from './prospectiveRules.js';
import { centralEstimate, compareWithRecord, type RecordedEvent } from './recordedTolls.js';
import { RULE_SHAKEMAPS } from './ruleShakemapData.js';
import {
  isInformative,
  scoreStats,
  SIZE_BANDS,
  sizeBandOf,
  type ScoreRowInput,
} from './scorecard.js';
import { siteVs30 } from './siteVs30.js';
import { unseenEarthquakeEvent, unseenShakemaps } from './unseenSet.js';
import { UNSEEN_EARTHQUAKES } from './unseenSetData.js';
import { UNSEEN_SITES } from './unseenSiteData.js';

/**
 * Rules 56 to 60 of atlasRules.ts, run: rule 28's score for every candidate
 * on rule 56's ShakeMaps, rule 58's choice, rule 59's check on the dead
 * where there is a winner, and what rule 60 prints beside. One computation
 * for the script that first runs them, the report that prints them and the
 * test that keeps the report honest about them.
 */

/** Reference rock, printed beside. */
const ROCK_VS30 = 760;

const ATLAS_SITE_MAP = new Map(ATLAS_SITES.map((site) => [site.key, site]));
const UNSEEN_SITE_MAP = new Map(UNSEEN_SITES.map((site) => [site.key, site]));

/** Rule 56: the Vs30 the browser reads under one of its epicentres. */
export function atlasGround(row: { comcat: string }): number | undefined {
  return siteVs30('pick', ATLAS_SITE_MAP.get(row.comcat));
}

const unseenGround = (row: { comcat: string }): number | undefined =>
  siteVs30('pick', UNSEEN_SITE_MAP.get(row.comcat));

/** The scenario inputs a candidate sets. */
export function atlasInputs(candidate: AtlasCandidate): Partial<EarthquakeScenarioInput> {
  return {
    contourLaw: candidate.law,
    ...(candidate.measure === undefined ? {} : { intensityMeasure: candidate.measure }),
    ...(candidate.distance === undefined ? {} : { pointSourceDistance: candidate.distance }),
  };
}

/** An event run with one of rule 58's candidates, everything else as the
 *  event sets it. */
export function withAtlasCandidate(event: RecordedEvent, candidate: AtlasCandidate): RecordedEvent {
  return {
    ...event,
    run: () => {
      const result = event.run();
      if (result.type !== 'earthquake') return result;
      return {
        type: 'earthquake',
        data: simulateEarthquake({ ...result.data.inputs, ...atlasInputs(candidate) }),
      };
    },
  };
}

function scoreOn(
  candidate: AtlasCandidate,
  maps: readonly ShakemapAreas[],
  rows: readonly QuakeInputs[],
  vs30For: RowVs30
): ProspectiveScore {
  return prospectiveScore(
    contourPairs(
      candidate.law,
      maps,
      vs30For,
      rows,
      candidate.measure ?? 'pga',
      false,
      undefined,
      candidate.distance
    )
  );
}

type ByCandidate<T> = Record<string, T>;

function everyCandidate<T>(of: (candidate: AtlasCandidate) => T): ByCandidate<T> {
  return Object.fromEntries(ATLAS_CANDIDATES.map((c) => [c.key, of(c)]));
}

/** Rule 57: every candidate's score on rule 56's maps, all and least
 *  modelled, on the browser's ground. */
export function atlasScores(rows: readonly AtlasEarthquake[] = ATLAS_EARTHQUAKES): AtlasScores {
  const least = rows.filter(isLeastModelled);
  const maps = unseenShakemaps(rows);
  const leastMaps = unseenShakemaps(least);
  return everyCandidate((c) => ({
    all: scoreOn(c, maps, rows, atlasGround),
    leastModelled: scoreOn(c, leastMaps, least, atlasGround),
  }));
}

/** Rule 59: rule 19's cells on rule 11's held-out tolls under one candidate,
 *  on the browser's ground. */
export function atlasTollCells(candidate: AtlasCandidate): TollCells {
  const scored = RULE_EARTHQUAKES.filter((q) => q.role === 'heldOut').map((q) => {
    const toll = compareWithRecord(
      withAtlasCandidate(ruleEarthquakeEvent(q.row, { vs30: ruleSiteVs30(q.row) }), candidate)
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
      scored.filter((r) => sizeBandOf('earthquake', r.size) === b.label && isInformative(r))
    ),
  }));
}

/** Rule 59: the share of rule 23's quiet earthquakes whose median toll is
 *  ten or more under one candidate, on the browser's ground. */
export function atlasQuietShare(candidate: AtlasCandidate): { share: number; quiet: number } {
  const tolls = UNSEEN_EARTHQUAKES.filter(isQuiet).map(
    (row) =>
      centralEstimate(
        withAtlasCandidate(unseenEarthquakeEvent(row, { vs30: unseenGround(row) }), candidate)
      )?.deaths ?? 0
  );
  return { share: falseAlarmShare(tolls), quiet: tolls.length };
}

const cellsOf = (cells: TollCells) =>
  cells.map((c) => ({ bias: c.stats.bias, inside: c.stats.inside, rows: c.stats.rows }));

export interface AtlasRun {
  events: {
    earthquakes: number;
    leastModelled: number;
    quiet: number;
    byCell: number[];
  };
  scores: AtlasScores;
  choice: ReturnType<typeof chooseAtlasCandidate>;
  /** Rule 59 beside the law in place; null when nothing displaced it. */
  dead: {
    winner: string;
    tolls: Record<'inPlace' | 'winner', TollCells>;
    quiet: Record<'inPlace' | 'winner', { share: number; quiet: number }>;
    decision: ReturnType<typeof adoptInterfaceLaw>;
  } | null;
  /** Rule 60, beside: the same score on rock, and on the maps already read. */
  beside: {
    rock: ByCandidate<ProspectiveScore>;
    rule11: ByCandidate<ProspectiveScore>;
    rule23: ByCandidate<ProspectiveScore>;
    rule50: ByCandidate<ProspectiveScore>;
  };
}

export function runAtlas(): AtlasRun {
  const rows = ATLAS_EARTHQUAKES;
  const scores = atlasScores(rows);
  const choice = chooseAtlasCandidate(scores);
  const inPlace = ATLAS_CANDIDATES[0];
  const winner = ATLAS_CANDIDATES.find((c) => c.key === choice.winner);

  let dead: AtlasRun['dead'] = null;
  if (inPlace !== undefined && winner !== undefined) {
    const tolls = { inPlace: atlasTollCells(inPlace), winner: atlasTollCells(winner) };
    const quiet = { inPlace: atlasQuietShare(inPlace), winner: atlasQuietShare(winner) };
    dead = {
      winner: winner.key,
      tolls,
      quiet,
      decision: adoptInterfaceLaw(
        { inPlace: cellsOf(tolls.inPlace), winner: cellsOf(tolls.winner) },
        { inPlaceShare: quiet.inPlace.share, winnerShare: quiet.winner.share }
      ),
    };
  }

  const ruleRows: QuakeInputs[] = RULE_EARTHQUAKES.map((q) => q.row);
  return {
    events: {
      earthquakes: rows.length,
      leastModelled: rows.filter(isLeastModelled).length,
      quiet: rows.filter(isQuiet).length,
      byCell: SIZE_BANDS.earthquake.map(
        (b) => rows.filter((q) => sizeBandOf('earthquake', q.magnitude) === b.label).length
      ),
    },
    scores,
    choice,
    dead,
    beside: {
      rock: everyCandidate((c) => scoreOn(c, unseenShakemaps(rows), rows, () => ROCK_VS30)),
      rule11: everyCandidate((c) =>
        scoreOn(c, RULE_SHAKEMAPS, ruleRows, (row) => ruleSiteVs30(row))
      ),
      rule23: everyCandidate((c) =>
        scoreOn(c, unseenShakemaps(UNSEEN_EARTHQUAKES), UNSEEN_EARTHQUAKES, unseenGround)
      ),
      rule50: everyCandidate((c) =>
        scoreOn(
          c,
          unseenShakemaps(POINT_SOURCE_EARTHQUAKES),
          POINT_SOURCE_EARTHQUAKES,
          pointSourceGround
        )
      ),
    },
  };
}
