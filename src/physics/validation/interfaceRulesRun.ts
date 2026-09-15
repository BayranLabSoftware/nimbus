import { EARTHQUAKE_PRESETS, simulateEarthquake } from '../events/earthquake/index.js';
import { contourPairs, type QuakeInputs } from './contourComparison.js';
import { scoreContours, type ContourCell, type ContourPair } from './contourLaws.js';
import { falseAlarmShare, isQuiet } from './depthRules.js';
import { RULE_EARTHQUAKES, ruleEarthquakeEvent, ruleSiteVs30 } from './heldOutByRule.js';
import {
  adoptInterfaceLaw,
  chooseInterfaceLaw,
  INTERFACE_LAWS,
  INTERFACE_READINGS,
  INTERFACE_STATIONS_AT_LEAST,
  isInterfaceEvent,
  type InterfaceClass,
  type InterfaceLaw,
  type InterfaceReading,
} from './interfaceRules.js';
import { INTERFACE_CLASSES } from './interfaceSetData.js';
import { centralEstimate, compareWithRecord, type RecordedEvent } from './recordedTolls.js';
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
 * Rules 35 to 39 of interfaceRules.ts, run: the three laws on the
 * ShakeMaps of the interface earthquakes, rule 37's choice, rule 38's check
 * on the dead where there is a winner, and what rule 39 prints beside. One
 * computation for the script that first ran them, the report that prints
 * them and the test that keeps the report honest about them.
 */

/** Rule 37's reference rock. */
const ROCK_VS30 = 760;

const classes = (set: InterfaceClass['set']): Map<string, InterfaceClass> =>
  new Map(INTERFACE_CLASSES.filter((c) => c.set === set).map((c) => [c.comcat, c]));
const RULE11_CLASSES = classes('rule11');
const RULE23_CLASSES = classes('rule23');

const interfaceIn =
  (byId: Map<string, InterfaceClass>) =>
  (row: { comcat: string }): boolean => {
    const c = byId.get(row.comcat);
    return c !== undefined && isInterfaceEvent(c);
  };

/** Rule 35's earthquakes of rule 11's set, on rules 1 to 3's inputs. */
export const INTERFACE_RULE11_ROWS: readonly QuakeInputs[] = RULE_EARTHQUAKES.map(
  (q) => q.row
).filter(interfaceIn(RULE11_CLASSES));

/** Rule 35's earthquakes of rule 23's set. */
export const INTERFACE_RULE23_ROWS = UNSEEN_EARTHQUAKES.filter(interfaceIn(RULE23_CLASSES));

const UNSEEN_SITE_MAP = new Map(UNSEEN_SITES.map((site) => [site.key, site]));
const unseenGround = (row: { comcat: string }): number | undefined =>
  siteVs30('pick', UNSEEN_SITE_MAP.get(row.comcat));

const RULE23_MAPS = unseenShakemaps(INTERFACE_RULE23_ROWS);

/** One law's pairs in one of rule 37's readings, every row an interface
 *  scenario. */
function readingPairs(
  law: InterfaceLaw,
  reading: InterfaceReading,
  keep: (row: { comcat: string }) => boolean = () => true
): ContourPair[] {
  const rock = (): number => ROCK_VS30;
  switch (reading) {
    case 'rule11Rock':
      return contourPairs(
        law,
        RULE_SHAKEMAPS,
        rock,
        INTERFACE_RULE11_ROWS.filter(keep),
        'pga',
        true
      );
    case 'rule11Ground':
      return contourPairs(
        law,
        RULE_SHAKEMAPS,
        (row) => ruleSiteVs30(row),
        INTERFACE_RULE11_ROWS.filter(keep),
        'pga',
        true
      );
    case 'rule23Rock':
      return contourPairs(law, RULE23_MAPS, rock, INTERFACE_RULE23_ROWS.filter(keep), 'pga', true);
    case 'rule23Ground':
      return contourPairs(
        law,
        RULE23_MAPS,
        unseenGround,
        INTERFACE_RULE23_ROWS.filter(keep),
        'pga',
        true
      );
  }
}

/** An event run as an interface scenario under one law. */
export function withInterfaceLaw(event: RecordedEvent, law: InterfaceLaw): RecordedEvent {
  return {
    ...event,
    run: () => {
      const result = event.run();
      if (result.type !== 'earthquake') return result;
      return {
        type: 'earthquake',
        data: simulateEarthquake({
          ...result.data.inputs,
          contourLaw: law,
          subductionInterface: true,
        }),
      };
    },
  };
}

export type TollCells = { group: string; stats: ScoreStats }[];

/** Rule 38: rule 19's cells on rule 11's held-out tolls of rule 35's
 *  earthquakes, on the browser's ground. */
export function interfaceTollCells(law: InterfaceLaw): TollCells {
  const isInterface = interfaceIn(RULE11_CLASSES);
  const rows = RULE_EARTHQUAKES.filter((q) => q.role === 'heldOut' && isInterface(q.row)).map(
    (q) => {
      const toll = compareWithRecord(
        withInterfaceLaw(ruleEarthquakeEvent(q.row, { vs30: ruleSiteVs30(q.row) }), law)
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
    }
  );
  return SIZE_BANDS.earthquake.map((b) => ({
    group: b.label,
    stats: scoreStats(
      rows.filter((r) => sizeBandOf('earthquake', r.size) === b.label && isInformative(r))
    ),
  }));
}

/** Rule 38: the share of rule 23's quiet interface earthquakes whose median
 *  toll is ten or more, on the browser's ground. */
export function interfaceQuietShare(law: InterfaceLaw): { share: number; quiet: number } {
  const tolls = INTERFACE_RULE23_ROWS.filter(isQuiet).map(
    (row) =>
      centralEstimate(
        withInterfaceLaw(unseenEarthquakeEvent(row, { vs30: unseenGround(row) }), law)
      )?.deaths ?? 0
  );
  return { share: falseAlarmShare(tolls), quiet: tolls.length };
}

/** Rule 39: the megathrust presets, whose rings each law draws. */
export const INTERFACE_PRESETS = [
  'TOHOKU_2011',
  'SUMATRA_2004',
  'VALDIVIA_1960',
  'ALASKA_1964',
  'LISBON_1755',
] as const;

export interface PresetRings {
  preset: (typeof INTERFACE_PRESETS)[number];
  law: InterfaceLaw;
  /** MMI VII, VIII and IX ring radii beyond the stadium (km). */
  radiiKm: readonly [number, number, number];
}

export interface InterfaceRulesRun {
  events: { rule11: number; rule23: number };
  scores: Record<InterfaceReading, Record<InterfaceLaw, ContourCell[]>>;
  choice: ReturnType<typeof chooseInterfaceLaw>;
  /** Rule 38, where rule 37 found a winner. */
  dead: {
    tolls: Partial<Record<InterfaceLaw, TollCells>>;
    quiet: Partial<Record<InterfaceLaw, { share: number; quiet: number }>>;
    decision: ReturnType<typeof adoptInterfaceLaw>;
  } | null;
  /** Rule 39, deciding nothing. */
  beside: {
    stations: Record<InterfaceLaw, ContourCell[]>;
    stationsEvents: number;
    byModelSet: Record<string, { events: number; cells: Record<InterfaceLaw, ContourCell[]> }>;
    presets: PresetRings[];
  };
}

/** The family of the interface models a map was drawn with. */
export function modelSetFamily(c: InterfaceClass): string {
  if (c.interfaceSet.includes('nshmp2023')) return 'NSHMP 2023';
  if (c.interfaceSet.includes('nshmp2014')) return 'NSHMP 2014';
  if (c.interfaceSet.includes('chile')) return 'Chile';
  return 'other';
}

function classOf(row: { comcat: string }): InterfaceClass | undefined {
  return RULE11_CLASSES.get(row.comcat) ?? RULE23_CLASSES.get(row.comcat);
}

/** Pairs on the browser's ground, both sets together, for the rows kept. */
function groundPairs(law: InterfaceLaw, keep: (row: { comcat: string }) => boolean): ContourPair[] {
  return [...readingPairs(law, 'rule11Ground', keep), ...readingPairs(law, 'rule23Ground', keep)];
}

export function runInterfaceRules(): InterfaceRulesRun {
  const scores = Object.fromEntries(
    INTERFACE_READINGS.map((reading) => [
      reading,
      Object.fromEntries(
        INTERFACE_LAWS.map((law) => [law, scoreContours(readingPairs(law, reading))])
      ),
    ])
  ) as Record<InterfaceReading, Record<InterfaceLaw, ContourCell[]>>;
  const choice = chooseInterfaceLaw(scores);

  let dead: InterfaceRulesRun['dead'] = null;
  if (choice.winner !== 'boore2014') {
    const tolls = {
      boore2014: interfaceTollCells('boore2014'),
      [choice.winner]: interfaceTollCells(choice.winner),
    };
    const quiet = {
      boore2014: interfaceQuietShare('boore2014'),
      [choice.winner]: interfaceQuietShare(choice.winner),
    };
    const test = (cells: TollCells) =>
      cells.map((c) => ({ bias: c.stats.bias, inside: c.stats.inside, rows: c.stats.rows }));
    dead = {
      tolls,
      quiet,
      decision: adoptInterfaceLaw(
        { inPlace: test(tolls.boore2014), winner: test(tolls[choice.winner] ?? []) },
        {
          inPlaceShare: quiet.boore2014.share,
          winnerShare: quiet[choice.winner]?.share ?? Number.POSITIVE_INFINITY,
        }
      ),
    };
  }

  const recorded = (row: { comcat: string }): boolean =>
    (classOf(row)?.stations ?? 0) >= INTERFACE_STATIONS_AT_LEAST;
  const stations = Object.fromEntries(
    INTERFACE_LAWS.map((law) => [law, scoreContours(groundPairs(law, recorded))])
  ) as Record<InterfaceLaw, ContourCell[]>;
  const allRows = [...INTERFACE_RULE11_ROWS, ...INTERFACE_RULE23_ROWS];
  const families = [
    ...new Set(
      allRows
        .map((row) => classOf(row))
        .filter((c) => c !== undefined)
        .map(modelSetFamily)
    ),
  ].sort();
  const byModelSet = Object.fromEntries(
    families.map((family) => {
      const keep = (row: { comcat: string }): boolean => {
        const c = classOf(row);
        return c !== undefined && modelSetFamily(c) === family;
      };
      return [
        family,
        {
          events: allRows.filter(keep).length,
          cells: Object.fromEntries(
            INTERFACE_LAWS.map((law) => [law, scoreContours(groundPairs(law, keep))])
          ) as Record<InterfaceLaw, ContourCell[]>,
        },
      ];
    })
  );
  const presets: PresetRings[] = INTERFACE_PRESETS.flatMap((preset) =>
    INTERFACE_LAWS.map((law) => {
      const r = simulateEarthquake({ ...EARTHQUAKE_PRESETS[preset].input, contourLaw: law });
      return {
        preset,
        law,
        radiiKm: [
          (r.shaking.mmi7Radius as number) / 1_000,
          (r.shaking.mmi8Radius as number) / 1_000,
          (r.shaking.mmi9Radius as number) / 1_000,
        ] as const,
      };
    })
  );

  return {
    events: { rule11: INTERFACE_RULE11_ROWS.length, rule23: INTERFACE_RULE23_ROWS.length },
    scores,
    choice,
    dead,
    beside: {
      stations,
      stationsEvents: allRows.filter(recorded).length,
      byModelSet,
      presets,
    },
  };
}
