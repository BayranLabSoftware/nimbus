import {
  burnExposureCalPerCm2,
  type BurnExposureSource,
  type BurnSkin,
} from '../effects/burnExposure.js';
import { BURN_CURVES, BURN_CURVE_YIELDS_KT } from '../effects/burnExposureData.js';
import {
  EXPLOSION_PRESETS,
  simulateExplosion,
  type ExplosionScenarioInput,
} from '../events/explosion/simulate.js';
import {
  BURN_CANDIDATE,
  BURN_IN_PLACE,
  chooseBurnExposure,
  type BurnTraceChecks,
} from './burnRules.js';
import { compareWithRecord, RECORDED_EVENTS, type RecordedEvent } from './recordedTolls.js';

/**
 * Rules 80 to 84 of burnRules.ts, run: the traced curves checked as rule 80
 * asks, the rings of every explosion preset and of the net's explosions under
 * the exposure in place and under the book's, and rule 82's choice. One
 * computation for the script that first runs them, the report that prints
 * them and the test that keeps the report honest about them.
 */

const KILOTONS_PER_MEGATON = 1_000;

/** Rule 80's checks, read from the table itself. */
export function burnTraceChecks(): BurnTraceChecks {
  const rows = BURN_CURVES.map(([, , values]) => values);
  const nine = rows.length === 9 && rows.every((r) => r.length === BURN_CURVE_YIELDS_KT.length);
  const risesWithYield = rows.every((values) =>
    values.every((v, i) => i === 0 || v >= (values[i - 1] ?? 0) - 0.02)
  );
  const neverCrosses = rows.every((values, i) => {
    if (i === 0) return true;
    const above = rows[i - 1] ?? [];
    return values.every((v, j) => v < (above[j] ?? Infinity));
  });
  // The book's own example at 1 Mt: a population between 4.5 and 6 cal/cm²
  // takes first-degree burns, with some of it second-degree — so the
  // first-degree line lies below 4.5 and the second-degree one above it.
  const first = burnExposureCalPerCm2('first', 1_000);
  const second = burnExposureCalPerCm2('second', 1_000);
  const matchesTheExample = first < 4.5 && second > 4.5 && second <= 7;
  return { nine, risesWithYield, neverCrosses, matchesTheExample };
}

export interface BurnRingRow {
  name: string;
  yieldKt: number;
  heightOfBurstM: number;
  exposure: Record<'first' | 'second' | 'third', number>;
  inPlaceKm: Record<'first' | 'second' | 'third', number>;
  candidateKm: Record<'first' | 'second' | 'third', number>;
}

const ringsOf = (
  preset: ExplosionScenarioInput,
  source: BurnExposureSource,
  skin: BurnSkin
): Record<'first' | 'second' | 'third', number> => {
  const result = simulateExplosion({ ...preset, burnExposure: source, burnSkin: skin });
  return {
    first: (result.thermal.firstDegreeBurnRadius as number) / 1_000,
    second: (result.thermal.secondDegreeBurnRadius as number) / 1_000,
    third: (result.thermal.thirdDegreeBurnRadius as number) / 1_000,
  };
};

/** Rule 83: every explosion preset's rings under both exposures. */
export function burnRingRows(skin: BurnSkin = 'medium'): BurnRingRow[] {
  return Object.values(EXPLOSION_PRESETS).map((preset) => {
    const input: ExplosionScenarioInput = preset.input;
    const yieldKt = input.yieldMegatons * KILOTONS_PER_MEGATON;
    return {
      name: preset.name,
      yieldKt,
      heightOfBurstM: (input.heightOfBurst as number | undefined) ?? 0,
      exposure: {
        first: burnExposureCalPerCm2('first', yieldKt, skin),
        second: burnExposureCalPerCm2('second', yieldKt, skin),
        third: burnExposureCalPerCm2('third', yieldKt, skin),
      },
      inPlaceKm: ringsOf(input, BURN_IN_PLACE, skin),
      candidateKm: ringsOf(input, BURN_CANDIDATE, skin),
    };
  });
}

/** An event whose explosion realisations draw `source`, everything else as
 *  the event sets it. */
export function withBurnExposure(event: RecordedEvent, source: BurnExposureSource): RecordedEvent {
  return {
    ...event,
    run: () => {
      const result = event.run();
      if (result.type !== 'explosion') return result;
      return {
        type: 'explosion',
        data: simulateExplosion({ ...result.data.inputs, burnExposure: source }),
      };
    },
  };
}

export interface BurnTollRow {
  name: string;
  record: number;
  gated: boolean;
  inPlace: [number, number, number];
  candidate: [number, number, number];
  insideInPlace: boolean;
  insideCandidate: boolean;
}

/** Rule 82: the net's explosions under both exposures. */
export function burnTollRows(): BurnTollRow[] {
  return RECORDED_EVENTS.filter((event) => event.run().type === 'explosion').map((event) => {
    const read = (source: BurnExposureSource) => compareWithRecord(withBurnExposure(event, source));
    const a = read(BURN_IN_PLACE);
    const b = read(BURN_CANDIDATE);
    return {
      name: event.name,
      record: event.recordedDeaths,
      gated: event.gated,
      inPlace: [a.low, a.deaths, a.high],
      candidate: [b.low, b.deaths, b.high],
      insideInPlace: a.contains,
      insideCandidate: b.contains,
    };
  });
}

export interface BurnRunResult {
  trace: BurnTraceChecks;
  rings: BurnRingRow[];
  tolls: BurnTollRow[];
  /** The ring that moves most, as candidate over in place. */
  worstRingFactor: number;
  decision: ReturnType<typeof chooseBurnExposure>;
  /** Rule 83, beside: the light and dark curves at the presets' yields. */
  beside: { skin: BurnSkin; rows: BurnRingRow[] }[];
}

export function runBurn(): BurnRunResult {
  const trace = burnTraceChecks();
  const rings = burnRingRows();
  const tolls = burnTollRows();
  let worst = 1;
  for (const row of rings) {
    for (const degree of ['first', 'second', 'third'] as const) {
      const before = row.inPlaceKm[degree];
      const after = row.candidateKm[degree];
      if (!(before > 0) || !(after > 0)) continue;
      const ratio = after / before;
      if (Math.abs(Math.log(ratio)) > Math.abs(Math.log(worst))) worst = ratio;
    }
  }
  const gatePasses = tolls.every((t) => !t.gated || t.insideCandidate);
  return {
    trace,
    rings,
    tolls,
    worstRingFactor: worst,
    decision: chooseBurnExposure({ trace, gatePasses, worstRingFactor: worst }),
    beside: (['light', 'dark'] as const).map((skin) => ({ skin, rows: burnRingRows(skin) })),
  };
}
