import { describe, expect, it } from 'vitest';
import { groundFireballShare, type LowBurstFlash } from '../effects/atmosphericEntry.js';
import { impactThermalExposureAt } from '../events/impact/impactField.js';
import { IMPACT_PRESETS, simulateImpact, type ImpactScenarioInput } from '../simulate.js';
import { m } from '../units.js';
import { searchFieldJump } from './fieldJump.js';
import { LOW_BURST_HELD_OUT_SEED } from './lowBurstFlashRules.js';

/** Rules 714 to 721: a low airburst's flash, where its fireball meets the
 *  ground (B-093). */

type Result = ReturnType<typeof simulateImpact>;
const thermalRings = (r: Result): number[] => [
  Number(r.damage.thirdDegreeBurn),
  Number(r.damage.secondDegreeBurn),
  Number(r.firestorm.ignitionRadius),
  Number(r.firestorm.sustainRadius),
];
const thermalField = (r: Result): number[] =>
  Object.entries(r.field)
    .filter(([key]) => key.startsWith('thermalExposure'))
    .map(([, value]) => value);

/** Rule 715's two bodies: B-093's, on the own seed, and the one the unseen
 *  seed of rules 698 to 705 prints. */
const STEPS = [
  {
    impactorDiameter: 115.54168333676154,
    impactVelocity: 71577.55170948803,
    impactorDensity: 8060.689800418913,
    targetDensity: 1841.2443483248353,
    impactAngle: 0.28660277114121135,
    waterDepth: 35.313907257168985,
  },
  {
    impactorDiameter: 130.33239052083107,
    impactVelocity: 59463.34591857158,
    impactorDensity: 7000.854970887303,
    targetDensity: 4338.26972451061,
    impactAngle: 0.27913770428010143,
    waterDepth: 4.705367046968833,
  },
] as unknown as ImpactScenarioInput[];

const run = (input: ImpactScenarioInput, size: number, flash: LowBurstFlash): Result =>
  simulateImpact({
    ...input,
    impactorDiameter: m(Number(input.impactorDiameter) * size),
    lowBurstFlash: flash,
  });

/** The sizes, as multiples of the body's, either side of the one at which it
 *  stops bursting in the air and reaches the ground. */
function switchOf(input: ImpactScenarioInput): { below: number; above: number } {
  const complete = (size: number): boolean =>
    run(input, size, 'fireball').entry.regime === 'COMPLETE_AIRBURST';
  let below = 1;
  let above = 1.01;
  expect(complete(below)).toBe(true);
  expect(complete(above)).toBe(false);
  for (let n = 0; n < 60; n++) {
    const mid = (below + above) / 2;
    if (complete(mid)) below = mid;
    else above = mid;
  }
  return { below, above };
}

describe('rules 714 to 721: a low airburst’s flash where its fireball meets the ground', () => {
  it('reads its unseen seed from the rules', () => {
    expect(LOW_BURST_HELD_OUT_SEED).toBe('benchmark-2026-09-21-heldout-lowburst');
  });

  it('rule 714: puts on the ground 1 − z/R of the kept energy, none from R up', () => {
    const energy = 4.184e15;
    const radius = 0.002 * Math.cbrt(energy);
    expect(groundFireballShare(0, energy)).toBe(1);
    expect(groundFireballShare(radius / 4, energy)).toBeCloseTo(0.75, 12);
    expect(groundFireballShare(radius, energy)).toBe(0);
    expect(groundFireballShare(10 * radius, energy)).toBe(0);
    expect(groundFireballShare(0, 0)).toBe(0);
  });

  it('(b) meets the partial airburst at the switch: rings to 1e-6, the field steep', () => {
    for (const input of STEPS) {
      const { below, above } = switchOf(input);
      const before = thermalRings(run(input, below, 'fireball'));
      const after = thermalRings(run(input, above, 'fireball'));
      before.forEach((ring, i) => {
        expect(Math.abs((after[i] ?? NaN) - ring)).toBeLessThanOrEqual(1e-6 * ring);
      });
      for (const range of [10_000, 50_000, 100_000]) {
        const at = (size: number): number =>
          impactThermalExposureAt(run(input, size, 'fireball'), range);
        const lo = below * 0.9999;
        const hi = above * 1.0001;
        const atLo = at(lo);
        const atHi = at(hi);
        expect(searchFieldJump(at, lo, hi, atLo, atHi, 0.01 * Math.max(atLo, atHi)).kind).toBe(
          'steep'
        );
        expect(Math.abs(at(above) - at(below))).toBeLessThanOrEqual(1e-6 * at(below));
      }
      // The step itself, under the law before: the second-degree ring falls
      // by more than 1 % as the body grows past its switch.
      const stepBefore = thermalRings(run(input, below, 'air'))[1] ?? NaN;
      const stepAfter = thermalRings(run(input, above, 'air'))[1] ?? NaN;
      expect(stepAfter).toBeLessThan(0.99 * stepBefore);
    }
  });

  it('(b) keeps the flash in the air to the bit at or above the fireball radius', () => {
    const bodies = Object.values(IMPACT_PRESETS).map((p) => p.input as ImpactScenarioInput);
    let clear = 0;
    for (const input of bodies) {
      const air = run(input, 1, 'air');
      const taper = run(input, 1, 'fireball');
      expect(thermalRings(taper)).toEqual(thermalRings(air));
      expect(thermalField(taper)).toEqual(thermalField(air));
      if (air.entry.regime === 'COMPLETE_AIRBURST') clear += 1;
    }
    expect(clear).toBe(3);
  });
});
