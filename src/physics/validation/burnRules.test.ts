import { describe, expect, it } from 'vitest';
import {
  FIRST_DEGREE_BURN_FLUENCE,
  SECOND_DEGREE_BURN_FLUENCE,
  THIRD_DEGREE_BURN_FLUENCE,
} from '../constants.js';
import {
  burnExposureCalPerCm2,
  burnFluenceThreshold,
  DEFAULT_BURN_EXPOSURE,
  JOULES_PER_CAL_CM2,
} from '../effects/burnExposure.js';
import { BURN_CURVES, BURN_CURVE_YIELDS_KT } from '../effects/burnExposureData.js';
import { simulateExplosion } from '../events/explosion/simulate.js';
import {
  BURN_CANDIDATE,
  BURN_IN_PLACE,
  BURN_RING_FACTOR,
  burnTracePasses,
  chooseBurnExposure,
} from './burnRules.js';
import { burnTraceChecks } from './burnRun.js';

/**
 * Rules 80 to 84 of burnRules.ts, before the candidate is run on the net: the
 * traced curves are nine, rise with the yield and never cross; the exposure a
 * scenario reads is the book's; and rule 82's choice does what it says.
 */

describe('rule 80: the curves traced from the book', () => {
  it('are nine, at nine yields, rising and never crossing', () => {
    expect(BURN_CURVES).toHaveLength(9);
    expect(BURN_CURVE_YIELDS_KT).toEqual([1, 3, 10, 30, 100, 300, 1000, 3000, 10000]);
    const checks = burnTraceChecks();
    expect(checks).toEqual({
      nine: true,
      risesWithYield: true,
      neverCrosses: true,
      matchesTheExample: true,
    });
    expect(burnTracePasses(checks)).toBe(true);
  });

  it('keep the values the trace read, so a re-trace that moves them is seen', () => {
    // Third, second and first degree at 1 kt and at 10 Mt, medium skin.
    expect(burnExposureCalPerCm2('third', 1)).toBeCloseTo(6.21, 6);
    expect(burnExposureCalPerCm2('second', 1)).toBeCloseTo(4.04, 6);
    expect(burnExposureCalPerCm2('first', 1)).toBeCloseTo(2.08, 6);
    expect(burnExposureCalPerCm2('third', 10_000)).toBeCloseTo(11.75, 6);
    expect(burnExposureCalPerCm2('second', 10_000)).toBeCloseTo(7.62, 6);
    expect(burnExposureCalPerCm2('first', 10_000)).toBeCloseTo(4.16, 6);
  });

  it('put the darker skin below the lighter at every yield', () => {
    for (const degree of ['first', 'second', 'third'] as const) {
      for (const kt of BURN_CURVE_YIELDS_KT) {
        expect(burnExposureCalPerCm2(degree, kt, 'dark')).toBeLessThan(
          burnExposureCalPerCm2(degree, kt, 'medium')
        );
        expect(burnExposureCalPerCm2(degree, kt, 'medium')).toBeLessThan(
          burnExposureCalPerCm2(degree, kt, 'light')
        );
      }
    }
  });
});

describe('rule 81: the exposure a scenario reads', () => {
  it('interpolates in the logarithm of the yield and holds flat past the figure', () => {
    const at1 = burnExposureCalPerCm2('second', 1);
    const at3 = burnExposureCalPerCm2('second', 3);
    const middle = burnExposureCalPerCm2('second', Math.sqrt(3));
    expect(middle).toBeCloseTo((at1 + at3) / 2, 6);
    expect(burnExposureCalPerCm2('second', 0.1)).toBe(at1);
    expect(burnExposureCalPerCm2('second', 1e6)).toBe(burnExposureCalPerCm2('second', 10_000));
  });

  it('gives the project fluences where the scenario names the project', () => {
    expect(burnFluenceThreshold('third', 4.184e13, 'project')).toBe(THIRD_DEGREE_BURN_FLUENCE);
    expect(burnFluenceThreshold('second', 4.184e13, 'project')).toBe(SECOND_DEGREE_BURN_FLUENCE);
    expect(burnFluenceThreshold('first', 4.184e13, 'project')).toBe(FIRST_DEGREE_BURN_FLUENCE);
    // Rule 84, since the adoption of 16 September 2026: a scenario that names
    // no source draws the book's curves. An impact names the project for
    // itself, in events/impact/damageRings.ts.
    expect(DEFAULT_BURN_EXPOSURE).toBe(BURN_CANDIDATE);
  });

  it('gives the book’s curve where the scenario names the book', () => {
    const tenKt = 10 * 4.184e12;
    expect(burnFluenceThreshold('third', tenKt, 'glasstone1977')).toBeCloseTo(
      burnExposureCalPerCm2('third', 10) * JOULES_PER_CAL_CM2,
      6
    );
  });

  it('draws a nuclear explosion’s rings with it, and a chemical charge none either way', () => {
    const preset = { yieldMegatons: 1 };
    const inPlace = simulateExplosion({ ...preset, burnExposure: BURN_IN_PLACE });
    const unnamed = simulateExplosion(preset);
    const book = simulateExplosion({ ...preset, burnExposure: BURN_CANDIDATE });
    expect(unnamed.thermal).toEqual(book.thermal);
    expect(book.thermal.thirdDegreeBurnRadius).not.toBe(inPlace.thermal.thirdDegreeBurnRadius);
    // At 1 Mt the book asks more than 8 cal/cm² for a third-degree burn, so
    // the ring is smaller than the project's.
    expect(book.thermal.thirdDegreeBurnRadius).toBeLessThan(inPlace.thermal.thirdDegreeBurnRadius);
    const chemical = { yieldMegatons: 0.0005, chargeType: 'chemical' } as const;
    const a = simulateExplosion({ ...chemical, burnExposure: BURN_IN_PLACE });
    const b = simulateExplosion({ ...chemical, burnExposure: BURN_CANDIDATE });
    expect(a.thermal.thirdDegreeBurnRadius).toBe(0);
    expect(b.thermal.thirdDegreeBurnRadius).toBe(0);
  });
});

describe('rule 82: the choice', () => {
  const trace = { nine: true, risesWithYield: true, neverCrosses: true, matchesTheExample: true };

  it('adopts the book unless the trace, the gate or the rings say otherwise', () => {
    expect(chooseBurnExposure({ trace, gatePasses: true, worstRingFactor: 0.7 })).toEqual({
      adopted: true,
      trace: true,
      gate: true,
      rings: true,
    });
    expect(chooseBurnExposure({ trace, gatePasses: false, worstRingFactor: 0.7 }).adopted).toBe(
      false
    );
    expect(
      chooseBurnExposure({ trace, gatePasses: true, worstRingFactor: BURN_RING_FACTOR + 0.01 })
        .rings
    ).toBe(false);
    expect(
      chooseBurnExposure({
        trace: { ...trace, neverCrosses: false },
        gatePasses: true,
        worstRingFactor: 1,
      }).trace
    ).toBe(false);
  });
});
