import type { BurnExposureSource } from '../effects/burnExposure.js';
import {
  EXPLOSION_PRESETS,
  simulateExplosion,
  type ExplosionScenarioInput,
} from '../events/explosion/simulate.js';
import { withBurnExposure } from './burnRun.js';
import {
  BURN_PROBABILITY_CANDIDATE,
  BURN_PROBABILITY_IN_PLACE,
  burnProbabilityChecks,
  chooseBurnProbability,
  type BurnProbabilityChecks,
} from './burnProbabilityRules.js';
import { compareWithRecord, RECORDED_EVENTS } from './recordedTolls.js';

/**
 * Rules 114 to 117 of burnProbabilityRules.ts, run: every explosion preset's
 * burn rings under Figure 12.64 and under Figure 12.65's 50 % lines, the net's
 * explosions under both, and rule 117's choice with the invariants read in the
 * same run. One computation for the script that runs them and the test that
 * keeps the report honest about them.
 */

type Degree = 'first' | 'second' | 'third';

export interface BurnProbabilityRingRow {
  name: string;
  yieldKt: number;
  inPlaceKm: Record<Degree, number>;
  candidateKm: Record<Degree, number>;
}

const ringsOf = (
  input: ExplosionScenarioInput,
  source: BurnExposureSource
): Record<Degree, number> => {
  const r = simulateExplosion({ ...input, burnExposure: source });
  return {
    first: (r.thermal.firstDegreeBurnRadius as number) / 1_000,
    second: (r.thermal.secondDegreeBurnRadius as number) / 1_000,
    third: (r.thermal.thirdDegreeBurnRadius as number) / 1_000,
  };
};

export function burnProbabilityRingRows(): BurnProbabilityRingRow[] {
  return Object.values(EXPLOSION_PRESETS).map((preset) => ({
    name: preset.name,
    yieldKt: preset.input.yieldMegatons * 1_000,
    inPlaceKm: ringsOf(preset.input, BURN_PROBABILITY_IN_PLACE),
    candidateKm: ringsOf(preset.input, BURN_PROBABILITY_CANDIDATE),
  }));
}

export interface BurnProbabilityTollRow {
  name: string;
  record: number;
  gated: boolean;
  inPlace: [number, number, number];
  candidate: [number, number, number];
  insideInPlace: boolean;
  insideCandidate: boolean;
}

export function burnProbabilityTollRows(): BurnProbabilityTollRow[] {
  return RECORDED_EVENTS.filter((event) => event.run().type === 'explosion').map((event) => {
    const a = compareWithRecord(withBurnExposure(event, BURN_PROBABILITY_IN_PLACE));
    const b = compareWithRecord(withBurnExposure(event, BURN_PROBABILITY_CANDIDATE));
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

export interface BurnProbabilityRunResult {
  checks: BurnProbabilityChecks;
  rings: BurnProbabilityRingRow[];
  tolls: BurnProbabilityTollRow[];
  worstRingMove: number;
  gatePasses: boolean;
  decision: ReturnType<typeof chooseBurnProbability>;
}

/** Rule 117, with the two invariant counts the same run measured. */
export function runBurnProbability(
  invariantsInPlace: number,
  invariantsWithCandidate: number
): BurnProbabilityRunResult {
  const checks = burnProbabilityChecks();
  const rings = burnProbabilityRingRows();
  const tolls = burnProbabilityTollRows();
  let worst = 1;
  for (const row of rings) {
    for (const d of ['first', 'second', 'third'] as const) {
      const before = row.inPlaceKm[d];
      const after = row.candidateKm[d];
      if (!(before > 0) || !(after > 0)) continue;
      const ratio = after / before;
      if (Math.abs(Math.log(ratio)) > Math.abs(Math.log(worst))) worst = ratio;
    }
  }
  const gatePasses = tolls.every((t) => !t.gated || t.insideCandidate);
  return {
    checks,
    rings,
    tolls,
    worstRingMove: Math.max(worst, 1 / worst),
    gatePasses,
    decision: chooseBurnProbability({
      checks,
      gatePasses,
      worstRingMove: Math.max(worst, 1 / worst),
      invariantsInPlace,
      invariantsWithCandidate,
    }),
  };
}
