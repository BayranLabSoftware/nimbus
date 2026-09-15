import { simulateEarthquake, type InterfaceStadium } from '../events/earthquake/simulate.js';
import { contourPairs, type QuakeInputs } from './contourComparison.js';
import { scoreContours, type ContourCell } from './contourLaws.js';
import { DEEP_INTERFACE_EARTHQUAKES } from './deepInterfaceSetData.js';
import { falseAlarmShare, isQuiet } from './depthRules.js';
import { RULE_EARTHQUAKES, ruleEarthquakeEvent, ruleSiteVs30 } from './heldOutByRule.js';
import { INTERFACE_STATIONS_AT_LEAST, isInterfaceEvent } from './interfaceRules.js';
import { INTERFACE_RULE11_ROWS, INTERFACE_RULE23_ROWS } from './interfaceRulesRun.js';
import {
  adoptFromMw75,
  INTERFACE_STADIUMS,
  stadiumEligible,
  type RecordedRun,
} from './interfaceStadiumRules.js';
import { centralEstimate, compareWithRecord, type RecordedEvent } from './recordedTolls.js';
import { RULE_SHAKEMAPS } from './ruleShakemapData.js';
import { sizeBandOf } from './scorecard.js';
import { siteVs30 } from './siteVs30.js';
import { unseenEarthquakeEvent, unseenShakemaps } from './unseenSet.js';
import { UNSEEN_SITES } from './unseenSiteData.js';

/**
 * Rules 40 to 44 of interfaceStadiumRules.ts, run: both geometries of a
 * scenario marked a subduction interface on rule 40's interface
 * earthquakes, rule 42's choice, rule 43's check on the dead where the
 * candidate is eligible, and what rule 44 prints beside. One computation
 * for the script that first ran them, the report that prints them and the
 * test that keeps the report honest about them.
 */

/** Rule 41's reference rock. */
const ROCK_VS30 = 760;

/** Rule 40's interface earthquakes. */
export const STADIUM_ROWS = DEEP_INTERFACE_EARTHQUAKES.filter(isInterfaceEvent);

const STADIUM_MAPS = unseenShakemaps(STADIUM_ROWS);

/** An event run as a scenario marked a subduction interface, with one of
 *  rule 41's geometries. */
export function withInterfaceStadium(
  event: RecordedEvent,
  geometry: InterfaceStadium
): RecordedEvent {
  return {
    ...event,
    run: () => {
      const result = event.run();
      if (result.type !== 'earthquake') return result;
      return {
        type: 'earthquake',
        data: simulateEarthquake({
          ...result.data.inputs,
          subductionInterface: true,
          interfaceStadium: geometry,
        }),
      };
    },
  };
}

function shaking(
  geometry: InterfaceStadium,
  maps: typeof RULE_SHAKEMAPS,
  rows: readonly QuakeInputs[],
  vs30For: (row: { comcat: string }) => number | undefined
): ContourCell[] {
  return scoreContours(contourPairs('boore2014', maps, vs30For, rows, 'pga', true, geometry));
}

/** Rule 43 (a): the share of rule 40's quiet interface earthquakes whose
 *  median toll is ten or more, on rock. */
export function stadiumQuietShare(geometry: InterfaceStadium): { share: number; quiet: number } {
  const tolls = STADIUM_ROWS.filter(isQuiet).map(
    (row) =>
      centralEstimate(
        withInterfaceStadium(unseenEarthquakeEvent(row, { vs30: ROCK_VS30 }), geometry)
      )?.deaths ?? 0
  );
  return { share: falseAlarmShare(tolls), quiet: tolls.length };
}

/** Rule 43 (b): each recorded interface earthquake of rule 40's set under
 *  one geometry, on rock. */
export function stadiumRecorded(geometry: InterfaceStadium): RecordedRun[] {
  return STADIUM_ROWS.filter((row) => !isQuiet(row)).map((row) => {
    const event = withInterfaceStadium(unseenEarthquakeEvent(row, { vs30: ROCK_VS30 }), geometry);
    const toll = compareWithRecord(event);
    return {
      comcat: row.comcat,
      sizeBand: sizeBandOf('earthquake', row.magnitude),
      record: event.recordedDeaths,
      central: toll.deaths,
      inside: toll.contains,
    };
  });
}

export interface StadiumRun {
  events: { interface: number; quiet: number; recorded: number };
  shaking: Record<InterfaceStadium, ContourCell[]>;
  choice: ReturnType<typeof stadiumEligible>;
  dead: {
    quiet: Record<InterfaceStadium, { share: number; quiet: number }>;
    recorded: Record<InterfaceStadium, RecordedRun[]>;
    decision: ReturnType<typeof adoptFromMw75>;
  } | null;
  beside: {
    /** Rule 35's interface earthquakes below Mw 7.5, where the candidate
     *  is the unmarked scenario. */
    seen: Record<
      'rule11Rock' | 'rule11Ground' | 'rule23Rock' | 'rule23Ground',
      Record<InterfaceStadium, ContourCell[]>
    >;
    stations: Record<InterfaceStadium, ContourCell[]>;
    stationsEvents: number;
  };
}

const UNSEEN_SITE_MAP = new Map(UNSEEN_SITES.map((site) => [site.key, site]));

export function runInterfaceStadium(): StadiumRun {
  const rock = (): number => ROCK_VS30;
  const shakingOf = Object.fromEntries(
    INTERFACE_STADIUMS.map((g) => [g, shaking(g, STADIUM_MAPS, STADIUM_ROWS, rock)])
  ) as Record<InterfaceStadium, ContourCell[]>;
  const choice = stadiumEligible(shakingOf.always, shakingOf['fromMw7.5']);

  let dead: StadiumRun['dead'] = null;
  if (choice.eligible) {
    const quiet = {
      always: stadiumQuietShare('always'),
      'fromMw7.5': stadiumQuietShare('fromMw7.5'),
    };
    const recorded = {
      always: stadiumRecorded('always'),
      'fromMw7.5': stadiumRecorded('fromMw7.5'),
    };
    dead = {
      quiet,
      recorded,
      decision: adoptFromMw75(
        { inPlaceShare: quiet.always.share, candidateShare: quiet['fromMw7.5'].share },
        { inPlace: recorded.always, candidate: recorded['fromMw7.5'] }
      ),
    };
  }

  const below = <T extends { magnitude: number }>(rows: readonly T[]): T[] =>
    rows.filter((row) => row.magnitude < 7.5);
  const rule11Rows = below(INTERFACE_RULE11_ROWS);
  const rule23Rows = below(INTERFACE_RULE23_ROWS);
  const rule23Maps = unseenShakemaps(rule23Rows);
  const unseenGround = (row: { comcat: string }): number | undefined =>
    siteVs30('pick', UNSEEN_SITE_MAP.get(row.comcat));
  const both = (
    maps: typeof RULE_SHAKEMAPS,
    rows: readonly QuakeInputs[],
    vs30For: (row: { comcat: string }) => number | undefined
  ): Record<InterfaceStadium, ContourCell[]> =>
    Object.fromEntries(
      INTERFACE_STADIUMS.map((g) => [g, shaking(g, maps, rows, vs30For)])
    ) as Record<InterfaceStadium, ContourCell[]>;
  const recordedWell = STADIUM_ROWS.filter((row) => row.stations >= INTERFACE_STATIONS_AT_LEAST);

  return {
    events: {
      interface: STADIUM_ROWS.length,
      quiet: STADIUM_ROWS.filter(isQuiet).length,
      recorded: STADIUM_ROWS.filter((row) => !isQuiet(row)).length,
    },
    shaking: shakingOf,
    choice,
    dead,
    beside: {
      seen: {
        rule11Rock: both(RULE_SHAKEMAPS, rule11Rows, rock),
        rule11Ground: both(RULE_SHAKEMAPS, rule11Rows, (row) => ruleSiteVs30(row)),
        rule23Rock: both(rule23Maps, rule23Rows, rock),
        rule23Ground: both(rule23Maps, rule23Rows, unseenGround),
      },
      stations: both(unseenShakemaps(recordedWell), recordedWell, rock),
      stationsEvents: recordedWell.length,
    },
  };
}

/** Rule 44, printed beside: rule 11's held-out interface tolls below Mw 7.5
 *  under both geometries, on the browser's ground, where the candidate's are
 *  the unmarked scenario's. */
export function seenRecordedBelow(geometry: InterfaceStadium): RecordedRun[] {
  const ids = new Set(INTERFACE_RULE11_ROWS.map((row) => row.comcat));
  return RULE_EARTHQUAKES.filter(
    (q) => q.role === 'heldOut' && ids.has(q.row.comcat) && q.row.magnitude < 7.5
  ).map((q) => {
    const event = withInterfaceStadium(
      ruleEarthquakeEvent(q.row, { vs30: ruleSiteVs30(q.row) }),
      geometry
    );
    const toll = compareWithRecord(event);
    return {
      comcat: q.row.comcat,
      sizeBand: sizeBandOf('earthquake', q.row.magnitude),
      record: event.recordedDeaths,
      central: toll.deaths,
      inside: toll.contains,
    };
  });
}
