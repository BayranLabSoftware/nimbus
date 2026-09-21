import { describe, expect, it } from 'vitest';
import {
  OVERPRESSURE_BUILDING_COLLAPSE,
  OVERPRESSURE_LIGHT_DAMAGE,
  OVERPRESSURE_WINDOW_BREAK,
} from '../events/impact/damageRings.js';
import { simulateImpact, type ImpactScenarioInput } from '../simulate.js';
import { blastRingOf, blastSourceOf, explainBlastShrink } from './blastSource.js';
import { BLAST_SOURCE_HELD_OUT_SEED } from './blastShrinkSourceRules.js';

/** Rules 683 to 690: the statement, on the bodies that shaped it. */

const RINGS = [
  ['overpressure5psi', OVERPRESSURE_BUILDING_COLLAPSE],
  ['overpressure1psi', OVERPRESSURE_WINDOW_BREAK],
  ['lightDamage', OVERPRESSURE_LIGHT_DAMAGE],
] as const;

const run = (input: ImpactScenarioInput, k: number): ReturnType<typeof simulateImpact> =>
  simulateImpact({ ...input, impactorDiameter: (Number(input.impactorDiameter) * k) as never });

const cause = (
  input: ImpactScenarioInput,
  threshold: number,
  ring: (typeof RINGS)[number][0]
): ReturnType<typeof explainBlastShrink> => {
  const a = run(input, 1);
  const b = run(input, 1.01);
  return explainBlastShrink(
    threshold,
    Number(a.damage[ring]),
    blastSourceOf(a),
    blastSourceOf(b),
    (k) => blastSourceOf(run(input, k)),
    1.01
  );
};

const B089 = {
  entryEquations: 'program',
  impactorDiameter: 30.35083106505634 * 1.005,
  impactVelocity: 13632.485304726288,
  impactorDensity: 9127.968714106828,
  targetDensity: 2456.329144537449,
  impactAngle: 0.2988136637231071,
} as unknown as ImpactScenarioInput;

const B090 = {
  entryEquations: 'program',
  impactorDiameter: 6.775448268956815,
  impactVelocity: 9247.191035188735,
  impactorDensity: 7234.419007087126,
  targetDensity: 1010.1746190339327,
  impactAngle: 1.0018638518184344,
} as unknown as ImpactScenarioInput;

/** A 33.6 m body of the seed of rules 638 to 646 that passes from a complete
 *  airburst to a partial one within the step. */
const SWITCH = {
  impactorDiameter: 33.61108900828292,
  impactVelocity: 27611.772210802883,
  impactorDensity: 6730.170172872022,
  targetDensity: 1949.2406593635678,
  impactAngle: 1.5242830946323949,
  waterDepth: 2436.4562315696285,
} as unknown as ImpactScenarioInput;

describe('rules 683 to 690: the blast rings a source moves', () => {
  it('reads its unseen seed from the rules', () => {
    expect(BLAST_SOURCE_HELD_OUT_SEED).toBe('benchmark-2026-09-21-heldout-blast');
  });

  it('draws each blast ring from its source, in the air and below the ground (rule 685 ii)', () => {
    for (const input of [B090, SWITCH, { ...SWITCH, impactorDiameter: 34 } as never]) {
      const r = run(input, 1);
      for (const [ring, threshold] of RINGS) {
        expect(blastRingOf(threshold, blastSourceOf(r as never))).toBeCloseTo(
          Number(r.damage[ring]),
          6
        );
      }
    }
  });

  it('joins the two laws where the source passes the ground (rule 684)', () => {
    let lo = 1;
    let hi = 1.01;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      if (run(SWITCH, mid).entry.regime === 'COMPLETE_AIRBURST') lo = mid;
      else hi = mid;
    }
    const air = run(SWITCH, lo);
    const ground = run(SWITCH, hi);
    expect(air.entry.regime).toBe('COMPLETE_AIRBURST');
    expect(ground.entry.regime).toBe('PARTIAL_AIRBURST');
    for (const [ring] of RINGS) {
      expect(Math.abs(Number(ground.damage[ring]) - Number(air.damage[ring]))).toBeLessThan(0.1);
    }
  });

  it('explains the knee, B-090, by the source altitude', () => {
    for (const [ring, threshold] of RINGS) {
      const a = run(B090, 1);
      const b = run(B090, 1.01);
      if (!(Number(b.damage[ring]) < Number(a.damage[ring]))) continue;
      expect(cause(B090, threshold, ring), ring).toBe('the source altitude');
    }
  });

  it('explains the passage from the air to the ground by the source altitude', () => {
    for (const [ring, threshold] of RINGS) {
      expect(cause(SWITCH, threshold, ring), ring).toBe('the source altitude');
    }
  });

  it('explains nothing at B-089’s seam, where the source jumps (rule 687)', () => {
    for (const [ring, threshold] of RINGS) {
      expect(cause(B089, threshold, ring), ring).toBeNull();
    }
  });
});
