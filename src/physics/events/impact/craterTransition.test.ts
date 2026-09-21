import { describe, expect, it } from 'vitest';
import { m } from '../../units.js';
import { finalCraterDiameter } from './crater.js';
import { simulateImpact } from '../../simulate.js';
import { CRATER_JOIN_RANGE_EARTH_M } from '../../validation/craterJoinRules.js';

/**
 * The simple-to-complex transition, joined by rules 647 to 653 on
 * 21 September 2026.
 *
 * Collins, Melosh & Marcus (2005) give the final crater two fits that do not
 * meet — `crater.ts` has said so since it was written: "at D_tc = 2.56 km the
 * simple rule gives 3.20 km and the complex one 2.91 km". Until the join, a
 * body whose transient crossed 2.56 km cut a final crater nine per cent
 * smaller than one a hair smaller, and G5 counted it twice on the sweep: a
 * 50.88 m body at 52.7 km/s, grown by one per cent, went from a final crater
 * of 3 194.1 m to 2 949.4 m.
 *
 * Since the join, where the complex fit applies the final crater is the
 * larger of that fit and the transition diameter, so it holds at 3.2 km from
 * a transient of 2 560 m until Eq. 27 reaches 3.2 km at 2 784.9 m. Nothing
 * changes outside that gap, and no crater row of the I1 grid and no preset
 * lies in it.
 */

const complexFit = (dtc: number): number => (1.17 * dtc ** 1.13) / 3_200 ** 0.13;

describe('the simple-to-complex transition, joined', () => {
  it('still has two fits that do not meet — the paper’s, recorded', () => {
    expect(1.25 * 2_560).toBeCloseTo(3_200, 6);
    expect(complexFit(2_560)).toBeCloseTo(2_909.56, 1);
    expect(complexFit(2_560) / 3_200).toBeCloseTo(0.909, 3);
  });

  it('holds the final crater at the transition diameter across the gap', () => {
    const [lo, hi] = CRATER_JOIN_RANGE_EARTH_M;
    expect(complexFit(hi)).toBeCloseTo(3_200, 0);
    for (const dtc of [lo + 1, 2_600, 2_700, hi - 1]) {
      expect(Number(finalCraterDiameter(m(dtc))), `${String(dtc)} m`).toBe(3_200);
    }
    // And outside it, the published fits to the bit.
    expect(Number(finalCraterDiameter(m(2_000)))).toBe(1.25 * 2_000);
    expect(Number(finalCraterDiameter(m(3_500)))).toBe(complexFit(3_500));
  });

  it('never lets a larger transient cut a smaller crater', () => {
    let previous = 0;
    for (let dtc = 2_000; dtc <= 3_500; dtc += 5) {
      const d = Number(finalCraterDiameter(m(dtc)));
      expect(d, `${String(dtc)} m`).toBeGreaterThanOrEqual(previous);
      previous = d;
    }
  });

  it('mends the sweep’s own scenario', () => {
    const input = {
      impactorDiameter: 50.88474335340288,
      impactVelocity: 52_667.18393936753,
      impactorDensity: 6_494.265721412376,
      targetDensity: 1_175.919302739203,
      impactAngle: 1.4879430361408708,
    } as const;
    const a = simulateImpact(input as never);
    const b = simulateImpact({
      ...input,
      impactorDiameter: input.impactorDiameter * 1.01,
    } as never);
    expect(Number(a.crater.transientDiameter)).toBeLessThan(2_560);
    expect(Number(b.crater.transientDiameter)).toBeGreaterThan(2_560);
    expect(Number(a.crater.finalDiameter)).toBeCloseTo(3_194.1, 0);
    // Where the paper's fit gave 2 949.4 m, the join holds 3 200.
    expect(Number(b.crater.finalDiameter)).toBe(3_200);
    expect(Number(b.damage.craterRim)).toBeGreaterThan(Number(a.damage.craterRim));
  });
});
