import {
  DEEP_LAW_FROM_KM,
  simulateEarthquake,
  type EarthquakeScenarioInput,
} from '../events/earthquake/simulate.js';
import type { SmallDeepEarthquake } from './allenTollRules.js';
import { smallDeepEarthquakeEvent } from './allenTollRun.js';
import { contourPairs, type RowVs30 } from './contourComparison.js';
import { isQuiet } from './depthRules.js';
import { lowIntensityScore } from './lowIntensityRules.js';
import { isLeastModelled } from './pointSourceRules.js';
import { prospectiveScore, type ProspectiveScore } from './prospectiveRules.js';
import { compareWithRecord, type RecordedEvent } from './recordedTolls.js';
import { SIZE_BANDS, sizeBandOf } from './scorecard.js';
import { siteVs30 } from './siteVs30.js';
import {
  chooseSlabCandidate,
  guardSlabLaw,
  SLAB_CANDIDATES,
  SLAB_DEPTH_SPLIT_KM,
  SLAB_MODEL_GROUPS,
  type SlabCandidate,
  type SlabEarthquake,
  type SlabScores,
} from './slabRules.js';
import { SLAB_EARTHQUAKES } from './slabSetData.js';
import { SLAB_SITES } from './slabSiteData.js';
import { SMALL_DEEP_EARTHQUAKES } from './smallDeepSetData.js';
import { unseenShakemaps } from './unseenSet.js';

/**
 * Rules 66 to 70 of slabRules.ts, run: rule 28's score for every candidate
 * on rule 66's ShakeMaps, rule 68's choice, rule 69's guard on the dead
 * where there is a winner, and what rule 70 prints beside. One computation
 * for the script that first runs them, the report that prints them and the
 * test that keeps the report honest about them.
 */

/** Reference rock, printed beside. */
const ROCK_VS30 = 760;

const SITE_MAP = new Map(SLAB_SITES.map((site) => [site.key, site]));

/** Rule 66: the Vs30 the browser reads under one of its epicentres. */
export function slabGround(row: { comcat: string }): number | undefined {
  return siteVs30('pick', SITE_MAP.get(row.comcat));
}

/** The scenario inputs a candidate sets. */
export function slabInputs(candidate: SlabCandidate): Partial<EarthquakeScenarioInput> {
  return { deepLaw: candidate.deepLaw };
}

/** An event run with one of rule 67's candidates, everything else as the
 *  event sets it. */
export function withSlabCandidate(event: RecordedEvent, candidate: SlabCandidate): RecordedEvent {
  return {
    ...event,
    run: () => {
      const result = event.run();
      if (result.type !== 'earthquake') return result;
      return {
        type: 'earthquake',
        data: simulateEarthquake({ ...result.data.inputs, ...slabInputs(candidate) }),
      };
    },
  };
}

function scoreOn(
  candidate: SlabCandidate,
  rows: readonly SlabEarthquake[],
  vs30For: RowVs30
): ProspectiveScore {
  return prospectiveScore(
    contourPairs(
      'boore2014',
      unseenShakemaps(rows),
      vs30For,
      rows,
      'pga',
      false,
      undefined,
      undefined,
      candidate.deepLaw
    )
  );
}

type ByCandidate<T> = Record<string, T>;

function everyCandidate<T>(of: (candidate: SlabCandidate) => T): ByCandidate<T> {
  return Object.fromEntries(SLAB_CANDIDATES.map((c) => [c.key, of(c)]));
}

/** Rule 68: every candidate's score on rule 66's maps, all and least
 *  modelled, on the browser's ground. */
export function slabScores(rows: readonly SlabEarthquake[] = SLAB_EARTHQUAKES): SlabScores {
  const least = rows.filter(isLeastModelled);
  return everyCandidate((c) => ({
    all: scoreOn(c, rows, slabGround),
    leastModelled: scoreOn(c, least, slabGround),
  }));
}

/** Rule 69: rule 61's earthquakes whose ComCat depth is more than 70 km. */
export const SLAB_GUARD_EARTHQUAKES: readonly SmallDeepEarthquake[] = SMALL_DEEP_EARTHQUAKES.filter(
  (q) => q.depthKm > DEEP_LAW_FROM_KM
);

/** One earthquake of rule 69's guard under one candidate. */
export interface SlabDeadRun {
  comcat: string;
  magnitude: number;
  record: number;
  central: number;
  low: number;
  high: number;
  inside: boolean;
}

export function slabDeadRuns(candidate: SlabCandidate): SlabDeadRun[] {
  return SLAB_GUARD_EARTHQUAKES.map((row) => {
    const event = withSlabCandidate(smallDeepEarthquakeEvent(row), candidate);
    const result = compareWithRecord(event);
    return {
      comcat: row.comcat,
      magnitude: row.magnitude,
      record: event.recordedDeaths,
      central: result.deaths,
      low: result.low,
      high: result.high,
      inside: result.contains,
    };
  });
}

/** Rule 69's reading of one candidate's runs: rule 47's score, and the
 *  records its band holds, in all and by magnitude cell, printed. */
export interface SlabDeadReading {
  score: number;
  held: number;
  rows: number;
  cells: { group: string; held: number; rows: number }[];
}

export function readSlabDead(runs: readonly SlabDeadRun[]): SlabDeadReading {
  return {
    score: lowIntensityScore(runs),
    held: runs.filter((r) => r.inside).length,
    rows: runs.length,
    cells: SIZE_BANDS.earthquake.map((b) => {
      const inCell = runs.filter((r) => sizeBandOf('earthquake', r.magnitude) === b.label);
      return {
        group: b.label,
        held: inCell.filter((r) => r.inside).length,
        rows: inCell.length,
      };
    }),
  };
}

/** Rule 70's readings beside, in the order the report prints them. */
export const SLAB_BESIDE = [
  'rock',
  'shallower',
  'deeper',
  ...Object.keys(SLAB_MODEL_GROUPS),
] as const;

export interface SlabRun {
  events: {
    earthquakes: number;
    leastModelled: number;
    quiet: number;
    byCell: number[];
    deeper: number;
    guard: number;
  };
  scores: SlabScores;
  choice: ReturnType<typeof chooseSlabCandidate>;
  /** Rule 69 beside the law in place; null when nothing displaced it. */
  dead: {
    winner: string;
    readings: Record<'inPlace' | 'winner', SlabDeadReading>;
    runs: Record<'inPlace' | 'winner', SlabDeadRun[]>;
    adopted: boolean;
  } | null;
  /** Rule 70, beside: every candidate's score on rock, by depth and by the
   *  slab models that drew the maps, with the maps each reading holds. */
  beside: Record<string, { maps: number; scores: ByCandidate<ProspectiveScore> }>;
}

export function runSlab(): SlabRun {
  const rows = SLAB_EARTHQUAKES;
  const scores = slabScores(rows);
  const choice = chooseSlabCandidate(scores);
  const inPlace = SLAB_CANDIDATES[0];
  const winner = SLAB_CANDIDATES.find((c) => c.key === choice.winner);

  let dead: SlabRun['dead'] = null;
  if (inPlace !== undefined && winner !== undefined) {
    const runs = { inPlace: slabDeadRuns(inPlace), winner: slabDeadRuns(winner) };
    const readings = { inPlace: readSlabDead(runs.inPlace), winner: readSlabDead(runs.winner) };
    dead = {
      winner: winner.key,
      readings,
      runs,
      adopted: guardSlabLaw({ inPlace: readings.inPlace.score, winner: readings.winner.score }),
    };
  }

  const beside: SlabRun['beside'] = {};
  const read = (label: string, subset: readonly SlabEarthquake[], vs30For: RowVs30) => {
    beside[label] = {
      maps: subset.length,
      scores: everyCandidate((c) => scoreOn(c, subset, vs30For)),
    };
  };
  read('rock', rows, () => ROCK_VS30);
  read(
    'shallower',
    rows.filter((q) => q.depthKm <= SLAB_DEPTH_SPLIT_KM),
    slabGround
  );
  read(
    'deeper',
    rows.filter((q) => q.depthKm > SLAB_DEPTH_SPLIT_KM),
    slabGround
  );
  for (const [label, sets] of Object.entries(SLAB_MODEL_GROUPS)) {
    read(
      label,
      rows.filter((q) => sets.includes(q.slabSet)),
      slabGround
    );
  }

  return {
    events: {
      earthquakes: rows.length,
      leastModelled: rows.filter(isLeastModelled).length,
      quiet: rows.filter(isQuiet).length,
      byCell: SIZE_BANDS.earthquake.map(
        (b) => rows.filter((q) => sizeBandOf('earthquake', q.magnitude) === b.label).length
      ),
      deeper: rows.filter((q) => q.depthKm > SLAB_DEPTH_SPLIT_KM).length,
      guard: SLAB_GUARD_EARTHQUAKES.length,
    },
    scores,
    choice,
    dead,
    beside,
  };
}
