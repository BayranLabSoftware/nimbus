import { simulateEarthquake } from '../events/earthquake/simulate.js';
import type { GroundMotionResidual } from '../uq/groundMotionResidual.js';
import { smallDeepEarthquakeEvent } from './allenTollRun.js';
import { RULE_EARTHQUAKES, ruleEarthquakeEvent, ruleSiteVs30 } from './heldOutByRule.js';
import { moderateEarthquakeEvent } from './lowIntensityRun.js';
import { MODERATE_EARTHQUAKES } from './moderateSetData.js';
import { compareWithRecord, RECORDED_EVENTS, type RecordedEvent } from './recordedTolls.js';
import {
  chooseResidual,
  intervalScore,
  RESIDUAL_BESIDE,
  RESIDUAL_CANDIDATE,
  RESIDUAL_IN_PLACE,
  type ResidualReading,
} from './residualRules.js';
import {
  isInformative,
  scoreStats,
  SIZE_BANDS,
  sizeBandOf,
  type ScoreRowInput,
} from './scorecard.js';
import { SMALL_DEEP_EARTHQUAKES } from './smallDeepSetData.js';

/**
 * Rules 71 to 75 of residualRules.ts, run: every earthquake of rule 11's,
 * rule 45's and rule 61's sets banded under the residual in place, the
 * candidate and the residual printed beside, rules 73 and 74's choice, and
 * what rule 75 prints beside. One computation for the script that first runs
 * them, the report that prints them and the test that keeps the report honest
 * about them.
 */

/** An event whose earthquake realisations draw `residual`, everything else
 *  as the event sets it. The median scenario, and so the central figure, does
 *  not move. */
export function withResidual(event: RecordedEvent, residual: GroundMotionResidual): RecordedEvent {
  return {
    ...event,
    run: () => {
      const result = event.run();
      if (result.type !== 'earthquake') return result;
      return {
        type: 'earthquake',
        data: simulateEarthquake({ ...result.data.inputs, groundMotionResidual: residual }),
      };
    },
  };
}

/** One earthquake's band under one residual. */
export interface ResidualRow {
  name: string;
  magnitude: number;
  record: number;
  central: number;
  low: number;
  high: number;
  inside: boolean;
}

interface SetEvent {
  event: RecordedEvent;
  magnitude: number;
}

/** Rule 72's sets, as rule 63 runs a toll: on the browser's ground. */
export function residualSets(): Record<'rule11' | 'rule45' | 'rule61', SetEvent[]> {
  return {
    rule11: RULE_EARTHQUAKES.filter((q) => q.role === 'heldOut').map((q) => ({
      event: ruleEarthquakeEvent(q.row, { vs30: ruleSiteVs30(q.row) }),
      magnitude: q.row.magnitude,
    })),
    rule45: MODERATE_EARTHQUAKES.map((row) => ({
      event: moderateEarthquakeEvent(row),
      magnitude: row.magnitude,
    })),
    rule61: SMALL_DEEP_EARTHQUAKES.map((row) => ({
      event: smallDeepEarthquakeEvent(row),
      magnitude: row.magnitude,
    })),
  };
}

export function residualRows(
  events: readonly SetEvent[],
  residual: GroundMotionResidual
): ResidualRow[] {
  return events.map(({ event, magnitude }) => {
    const result = compareWithRecord(withResidual(event, residual));
    return {
      name: event.name,
      magnitude,
      record: event.recordedDeaths,
      central: result.deaths,
      low: result.low,
      high: result.high,
      inside: result.contains,
    };
  });
}

/** Rule 72's reading of one residual on one set, overall and by cell. */
export interface ResidualSetReading extends ResidualReading {
  medianWidthDecades: number | null;
  cells: (ResidualReading & { group: string; medianWidthDecades: number | null })[];
}

function read(
  rows: readonly ResidualRow[]
): ResidualReading & { medianWidthDecades: number | null } {
  const scoreRows: ScoreRowInput[] = rows.map((r) => ({
    name: r.name,
    quantity: 'toll',
    family: 'earthquake',
    size: r.magnitude,
    role: 'heldOut',
    record: r.record,
    model: r.central,
    inside: r.inside,
    bandDecades: Math.log10(Math.max(r.high, 1) / Math.max(r.low, 1)),
    bandHigh: r.high,
  }));
  const stats = scoreStats(scoreRows.filter(isInformative));
  return {
    meanIntervalScore:
      rows.length === 0
        ? 0
        : rows.reduce((a, r) => a + intervalScore(r.record, r.low, r.high), 0) / rows.length,
    held: stats.inside,
    rows: stats.rows,
    medianWidthDecades: stats.medianBandDecades,
  };
}

export function readResidual(rows: readonly ResidualRow[]): ResidualSetReading {
  return {
    ...read(rows),
    cells: SIZE_BANDS.earthquake.map((b) => ({
      group: b.label,
      ...read(rows.filter((r) => sizeBandOf('earthquake', r.magnitude) === b.label)),
    })),
  };
}

type Side = 'inPlace' | 'candidate' | 'beside';

const SIDES: Readonly<Record<Side, GroundMotionResidual>> = {
  inPlace: RESIDUAL_IN_PLACE,
  candidate: RESIDUAL_CANDIDATE,
  beside: RESIDUAL_BESIDE,
};

export interface ResidualRunResult {
  events: Record<'rule11' | 'rule45' | 'rule61', number>;
  readings: Record<'rule11' | 'rule45' | 'rule61', Record<Side, ResidualSetReading>>;
  rows: Record<'rule11' | 'rule45' | 'rule61', Record<Side, ResidualRow[]>>;
  decision: ReturnType<typeof chooseResidual>;
  /** Rule 75, beside: the net's earthquakes under each residual. */
  net: { name: string; record: number; bands: Record<Side, [number, number]> }[];
}

export function runResidual(): ResidualRunResult {
  const sets = residualSets();
  const rows = {} as ResidualRunResult['rows'];
  const readings = {} as ResidualRunResult['readings'];
  for (const key of ['rule11', 'rule45', 'rule61'] as const) {
    const bySide = {} as Record<Side, ResidualRow[]>;
    const readBySide = {} as Record<Side, ResidualSetReading>;
    for (const side of ['inPlace', 'candidate', 'beside'] as const) {
      bySide[side] = residualRows(sets[key], SIDES[side]);
      readBySide[side] = readResidual(bySide[side]);
    }
    rows[key] = bySide;
    readings[key] = readBySide;
  }
  const decision = chooseResidual({
    rule11: { inPlace: readings.rule11.inPlace, candidate: readings.rule11.candidate },
    rule45: { inPlace: readings.rule45.inPlace, candidate: readings.rule45.candidate },
    rule61: { inPlace: readings.rule61.inPlace, candidate: readings.rule61.candidate },
  });
  const net = RECORDED_EVENTS.filter((event) => event.run().type === 'earthquake').map((event) => {
    const band = (side: Side): [number, number] => {
      const result = compareWithRecord(withResidual(event, SIDES[side]));
      return [result.low, result.high];
    };
    return {
      name: event.name,
      record: event.recordedDeaths,
      bands: { inPlace: band('inPlace'), candidate: band('candidate'), beside: band('beside') },
    };
  });
  return {
    events: { rule11: sets.rule11.length, rule45: sets.rule45.length, rule61: sets.rule61.length },
    readings,
    rows,
    decision,
    net,
  };
}
