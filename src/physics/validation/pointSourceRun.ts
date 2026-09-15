import {
  simulateEarthquake,
  type ContourLaw,
  type PointSourceDistance,
} from '../events/earthquake/simulate.js';
import { contourPairs } from './contourComparison.js';
import { scoreContours, type ContourCell } from './contourLaws.js';
import { falseAlarmShare, isQuiet } from './depthRules.js';
import { RULE_EARTHQUAKES, ruleEarthquakeEvent, ruleSiteVs30 } from './heldOutByRule.js';
import { isInterfaceEvent } from './interfaceRules.js';
import {
  INTERFACE_RULE11_ROWS,
  INTERFACE_RULE23_ROWS,
  type TollCells,
} from './interfaceRulesRun.js';
import type { RecordedRun } from './interfaceStadiumRules.js';
import {
  adoptPointSourceDistance,
  adoptPointSourceInterfaceLaw,
  choosePointSourceInterfaceLaw,
  isLeastModelled,
  POINT_SOURCE_CANDIDATES,
  POINT_SOURCE_INTERFACE_CANDIDATES,
  POINT_SOURCE_READINGS,
  POINT_SOURCE_STATIONS_AT_LEAST,
  pointSourceEligible,
  type PointSourceEarthquake,
  type PointSourceInterfaceCandidate,
  type PointSourceReading,
} from './pointSourceRules.js';
import { POINT_SOURCE_EARTHQUAKES } from './pointSourceSetData.js';
import { POINT_SOURCE_SITES } from './pointSourceSiteData.js';
import {
  centralEstimate,
  compareWithRecord,
  RECORDED_EVENTS,
  type RecordedEvent,
} from './recordedTolls.js';
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
 * Rules 50 to 55 of pointSourceRules.ts, run: both distances on rule 50's
 * ShakeMaps, rule 52's choice, rule 53's check on the dead where the
 * candidate is eligible, rule 54's interface models, and what rule 55
 * prints beside. One computation for the script that first runs them, the
 * report that prints them and the test that keeps the report honest about
 * them.
 */

/** Rule 52's reference rock. */
const ROCK_VS30 = 760;

const SITE_MAP = new Map(POINT_SOURCE_SITES.map((site) => [site.key, site]));
const UNSEEN_SITE_MAP = new Map(UNSEEN_SITES.map((site) => [site.key, site]));

/** Rule 50: the Vs30 the browser reads under one of its epicentres. */
export function pointSourceGround(row: { comcat: string }): number | undefined {
  return siteVs30('pick', SITE_MAP.get(row.comcat));
}

const unseenGround = (row: { comcat: string }): number | undefined =>
  siteVs30('pick', UNSEEN_SITE_MAP.get(row.comcat));

const groundOf =
  (reading: PointSourceReading) =>
  (row: { comcat: string }): number | undefined =>
    reading === 'rock' ? ROCK_VS30 : pointSourceGround(row);

/** How a scenario's rings are drawn in these rules: the distance of a disc,
 *  and for rule 54 a law on a scenario marked a subduction interface. */
export interface PointSourceRings {
  distance: PointSourceDistance;
  law?: ContourLaw;
  marked?: boolean;
}

/** An event run with rule 51's distance, and rule 54's law and mark where
 *  given, everything else as the event sets it. */
export function withPointSourceRings(event: RecordedEvent, rings: PointSourceRings): RecordedEvent {
  return {
    ...event,
    run: () => {
      const result = event.run();
      if (result.type !== 'earthquake') return result;
      return {
        type: 'earthquake',
        data: simulateEarthquake({
          ...result.data.inputs,
          pointSourceDistance: rings.distance,
          ...(rings.law === undefined ? {} : { contourLaw: rings.law }),
          ...(rings.marked === true ? { subductionInterface: true } : {}),
        }),
      };
    },
  };
}

/** Rule 18's cells for rows of rule 50's set under one way of drawing, in
 *  one reading. */
function shaking(
  rows: readonly PointSourceEarthquake[],
  rings: PointSourceRings,
  reading: PointSourceReading
): ContourCell[] {
  return scoreContours(
    contourPairs(
      rings.law ?? 'boore2014',
      unseenShakemaps(rows),
      groundOf(reading),
      rows,
      'pga',
      rings.marked === true,
      undefined,
      rings.distance
    )
  );
}

type ByReading<T> = Record<PointSourceReading, T>;
type ByDistance<T> = Record<PointSourceDistance, T>;

function bothReadings<T>(of: (reading: PointSourceReading) => T): ByReading<T> {
  return Object.fromEntries(POINT_SOURCE_READINGS.map((r) => [r, of(r)])) as ByReading<T>;
}

function bothDistances<T>(of: (distance: PointSourceDistance) => T): ByDistance<T> {
  return Object.fromEntries(POINT_SOURCE_CANDIDATES.map((d) => [d, of(d)])) as ByDistance<T>;
}

function tollCellsOf(
  rows: readonly (typeof RULE_EARTHQUAKES)[number][],
  rings: PointSourceRings
): TollCells {
  const scored = rows.map((q) => {
    const toll = compareWithRecord(
      withPointSourceRings(ruleEarthquakeEvent(q.row, { vs30: ruleSiteVs30(q.row) }), rings)
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

/** Rules 53 and 54: rule 19's cells on rule 11's held-out tolls, all of
 *  them or rule 35's interface earthquakes, on the browser's ground. */
export function pointSourceTollCells(rings: PointSourceRings): TollCells {
  const interfaces = new Set(INTERFACE_RULE11_ROWS.map((row) => row.comcat));
  return tollCellsOf(
    RULE_EARTHQUAKES.filter(
      (q) => q.role === 'heldOut' && (rings.marked !== true || interfaces.has(q.row.comcat))
    ),
    rings
  );
}

/** Rules 53 and 54: the share of rule 23's quiet earthquakes — all of them,
 *  or rule 35's interface ones — whose median toll is ten or more, on the
 *  browser's ground. */
export function pointSourceQuietShare(rings: PointSourceRings): { share: number; quiet: number } {
  const rows = (rings.marked === true ? INTERFACE_RULE23_ROWS : UNSEEN_EARTHQUAKES).filter(isQuiet);
  const tolls = rows.map(
    (row) =>
      centralEstimate(
        withPointSourceRings(unseenEarthquakeEvent(row, { vs30: unseenGround(row) }), rings)
      )?.deaths ?? 0
  );
  return { share: falseAlarmShare(tolls), quiet: tolls.length };
}

const cellsOf = (cells: TollCells) =>
  cells.map((c) => ({ bias: c.stats.bias, inside: c.stats.inside, rows: c.stats.rows }));

/** Rule 55, beside: rule 50's recorded earthquakes below Mw 7.5 under one
 *  distance, on the browser's ground. */
export function pointSourceRecorded(distance: PointSourceDistance): RecordedRun[] {
  return POINT_SOURCE_EARTHQUAKES.filter((row) => !isQuiet(row) && row.magnitude < 7.5).map(
    (row) => {
      const event = withPointSourceRings(
        unseenEarthquakeEvent(row, { vs30: pointSourceGround(row) }),
        { distance }
      );
      const toll = compareWithRecord(event);
      return {
        comcat: row.comcat,
        sizeBand: sizeBandOf('earthquake', row.magnitude),
        record: event.recordedDeaths,
        central: toll.deaths,
        inside: toll.contains,
      };
    }
  );
}

/** Rule 55, beside: a net earthquake's rings below Mw 7.5 (m). */
export interface NetRings {
  name: string;
  magnitude: number;
  rings: ByDistance<{ mmi7: number; mmi8: number; mmi9: number }>;
}

export function pointSourceNetRings(): NetRings[] {
  const out: NetRings[] = [];
  for (const event of RECORDED_EVENTS) {
    const result = event.run();
    if (result.type !== 'earthquake' || result.data.inputs.magnitude >= 7.5) continue;
    const inputs = result.data.inputs;
    out.push({
      name: event.name,
      magnitude: inputs.magnitude,
      rings: bothDistances((distance) => {
        const s = simulateEarthquake({ ...inputs, pointSourceDistance: distance }).shaking;
        return { mmi7: s.mmi7Radius, mmi8: s.mmi8Radius, mmi9: s.mmi9Radius };
      }),
    });
  }
  return out;
}

export interface PointSourceRun {
  events: {
    earthquakes: number;
    leastModelled: number;
    interface: number;
  };
  shaking: ByReading<ByDistance<ContourCell[]>>;
  leastModelled: ByReading<ByDistance<ContourCell[]>>;
  choice: ReturnType<typeof pointSourceEligible>;
  /** Rule 53 beside the distance in place; null when the candidate is not
   *  eligible, and nothing runs on the dead. */
  dead: {
    tolls: ByDistance<TollCells>;
    quiet: ByDistance<{ share: number; quiet: number }>;
    decision: ReturnType<typeof adoptPointSourceDistance>;
  } | null;
  /** The distance rule 54 runs the law in place at. */
  distance: PointSourceDistance;
  interface: {
    shaking: ByReading<{
      inPlace: ContourCell[];
      candidates: Record<PointSourceInterfaceCandidate, ContourCell[]>;
    }>;
    choice: ReturnType<typeof choosePointSourceInterfaceLaw>;
    dead: {
      winner: PointSourceInterfaceCandidate;
      tolls: Record<'inPlace' | 'winner', TollCells>;
      quiet: Record<'inPlace' | 'winner', { share: number; quiet: number }>;
      decision: ReturnType<typeof adoptPointSourceInterfaceLaw>;
    } | null;
  };
  beside: {
    recorded: ByDistance<RecordedRun[]>;
    finiteFault: ByReading<ByDistance<ContourCell[]>>;
    stations: ByReading<ByDistance<ContourCell[]>>;
    hypocentral: ByReading<Record<PointSourceInterfaceCandidate, ContourCell[]>>;
    net: NetRings[];
  };
}

export function runPointSource(): PointSourceRun {
  const rows = POINT_SOURCE_EARTHQUAKES;
  const least = rows.filter(isLeastModelled);
  const shakingOf = (subset: readonly PointSourceEarthquake[]) =>
    bothReadings((reading) => bothDistances((distance) => shaking(subset, { distance }, reading)));
  const all = shakingOf(rows);
  const leastModelled = shakingOf(least);
  const pair = (cells: ByReading<ByDistance<ContourCell[]>>) =>
    bothReadings((reading) => ({
      inPlace: cells[reading].epicentral,
      candidate: cells[reading].thompsonWorden2018,
    }));
  const choice = pointSourceEligible(pair(all), pair(leastModelled));

  let dead: PointSourceRun['dead'] = null;
  if (choice.eligible) {
    const tolls = bothDistances((distance) => pointSourceTollCells({ distance }));
    const quiet = bothDistances((distance) => pointSourceQuietShare({ distance }));
    dead = {
      tolls,
      quiet,
      decision: adoptPointSourceDistance(
        { inPlace: cellsOf(tolls.epicentral), winner: cellsOf(tolls.thompsonWorden2018) },
        { inPlaceShare: quiet.epicentral.share, winnerShare: quiet.thompsonWorden2018.share }
      ),
    };
  }
  const distance: PointSourceDistance =
    dead?.decision.adopted === true ? 'thompsonWorden2018' : 'epicentral';

  const interfaces = rows.filter(isInterfaceEvent);
  const inPlaceRings: PointSourceRings = { distance, law: 'boore2014', marked: true };
  const candidateRings = (law: PointSourceInterfaceCandidate): PointSourceRings => ({
    distance: 'thompsonWorden2018',
    law,
    marked: true,
  });
  const interfaceShaking = bothReadings((reading) => ({
    inPlace: shaking(interfaces, inPlaceRings, reading),
    candidates: Object.fromEntries(
      POINT_SOURCE_INTERFACE_CANDIDATES.map((law) => [
        law,
        shaking(interfaces, candidateRings(law), reading),
      ])
    ) as Record<PointSourceInterfaceCandidate, ContourCell[]>,
  }));
  const interfaceChoice = choosePointSourceInterfaceLaw(interfaceShaking);
  let interfaceDead: PointSourceRun['interface']['dead'] = null;
  if (interfaceChoice.winner !== null) {
    const winnerRings = candidateRings(interfaceChoice.winner);
    const tolls = {
      inPlace: pointSourceTollCells(inPlaceRings),
      winner: pointSourceTollCells(winnerRings),
    };
    const quiet = {
      inPlace: pointSourceQuietShare(inPlaceRings),
      winner: pointSourceQuietShare(winnerRings),
    };
    interfaceDead = {
      winner: interfaceChoice.winner,
      tolls,
      quiet,
      decision: adoptPointSourceInterfaceLaw(
        { inPlace: cellsOf(tolls.inPlace), winner: cellsOf(tolls.winner) },
        { inPlaceShare: quiet.inPlace.share, winnerShare: quiet.winner.share }
      ),
    };
  }

  return {
    events: {
      earthquakes: rows.length,
      leastModelled: least.length,
      interface: interfaces.length,
    },
    shaking: all,
    leastModelled,
    choice,
    dead,
    distance,
    interface: { shaking: interfaceShaking, choice: interfaceChoice, dead: interfaceDead },
    beside: {
      recorded: bothDistances(pointSourceRecorded),
      finiteFault: shakingOf(rows.filter((row) => row.finiteFault)),
      stations: shakingOf(rows.filter((row) => row.stations >= POINT_SOURCE_STATIONS_AT_LEAST)),
      hypocentral: bothReadings(
        (reading) =>
          Object.fromEntries(
            POINT_SOURCE_INTERFACE_CANDIDATES.map((law) => [
              law,
              shaking(interfaces, { distance: 'epicentral', law, marked: true }, reading),
            ])
          ) as Record<PointSourceInterfaceCandidate, ContourCell[]>
      ),
      net: pointSourceNetRings(),
    },
  };
}
