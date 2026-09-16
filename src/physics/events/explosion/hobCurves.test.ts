import { describe, expect, it } from 'vitest';
import { glasstoneGroundRangeFt, glasstoneGroundRangeM } from './hobCurves.js';
import {
  HOB_CURVE_CHECKS,
  HOB_CURVE_PSI,
  HOB_CURVE_RHO_FT,
  HOB_CURVE_THETA_DEG,
} from './hobCurvesData.js';

/**
 * Rule 169 of validation/hobRules.ts: the curves of Glasstone & Dolan's Figure
 * 3.73c as traced, held to the checks the trace was made against and to the
 * book's own worked example.
 */
describe('the traced height-of-burst curves', () => {
  it('carries the seven curves of Figure 3.73c on every ray from the ground to overhead', () => {
    expect([...HOB_CURVE_PSI]).toEqual([1, 2, 4, 6, 8, 10, 15]);
    expect(HOB_CURVE_THETA_DEG[0]).toBe(0);
    expect(HOB_CURVE_THETA_DEG[HOB_CURVE_THETA_DEG.length - 1]).toBe(90);
    expect(HOB_CURVE_RHO_FT).toHaveLength(7);
    for (const row of HOB_CURVE_RHO_FT) expect(row).toHaveLength(HOB_CURVE_THETA_DEG.length);
  });

  it('passed the checks it was written against', () => {
    expect(HOB_CURVE_CHECKS.gridRmsPx).toBeLessThanOrEqual(2);
    expect(HOB_CURVE_CHECKS.gridRmsPxB).toBeLessThanOrEqual(2);
    expect(HOB_CURVE_CHECKS.raysNotNested.length).toBeLessThanOrEqual(5);
    expect(HOB_CURVE_CHECKS.crossFigure.heights).toBeGreaterThanOrEqual(20);
    expect(HOB_CURVE_CHECKS.crossFigure.worst10).toBeLessThanOrEqual(0.06);
    expect(HOB_CURVE_CHECKS.crossFigure.worst15).toBeLessThanOrEqual(0.06);
    expect(HOB_CURVE_CHECKS.jumpsOver5Percent).toEqual([]);
  });

  it('keeps the lower overpressure outside the higher on every ray but where the figure draws them touching', () => {
    let crossings = 0;
    for (let k = 0; k < HOB_CURVE_THETA_DEG.length; k++) {
      for (let i = 0; i + 1 < HOB_CURVE_RHO_FT.length; i++) {
        const outer = HOB_CURVE_RHO_FT[i]?.[k] ?? 0;
        const inner = HOB_CURVE_RHO_FT[i + 1]?.[k] ?? 0;
        if (!(outer > inner)) crossings++;
      }
    }
    expect(crossings).toBeLessThanOrEqual(3);
  });
});

describe("Figure 3.73c's worked example", () => {
  it('puts the farthest 4 psi at 2 600 ft, for a burst at about 1 100 ft', () => {
    let best = { d: 0, h: 0 };
    for (let h = 0; h <= 3_000; h += 5) {
      const d = glasstoneGroundRangeFt(4, h);
      if (d > best.d) best = { d, h };
    }
    expect(Math.abs(best.d / 2_600 - 1)).toBeLessThan(0.03);
    expect(Math.abs(best.h / 1_100 - 1)).toBeLessThan(0.1);
  });

  it('scales it to 125 kt as the book does: 13 000 ft at a burst height of 5 500 ft', () => {
    // "the maximum ground distance to which 4 psi extends for a 1 KT weapon is
    // 2,600 feet ... for a 125 KT detonation ... 5,500 feet ... 13,000 feet".
    const FT = 0.3048;
    const d = glasstoneGroundRangeM(4, 125, 5_500 * FT) / FT;
    expect(Math.abs(d / 13_000 - 1)).toBeLessThan(0.03);
  });
});

describe('a ring read off the curves', () => {
  it('is zero above the top of its contour, and the contact surface burst at a height of zero', () => {
    expect(glasstoneGroundRangeFt(15, 1_200)).toBe(0);
    expect(glasstoneGroundRangeFt(1, 5_200)).toBe(0);
    expect(glasstoneGroundRangeFt(1, 0)).toBeCloseTo(HOB_CURVE_RHO_FT[0]?.[0] ?? 0, 6);
  });

  it('lies between the two drawn curves for an overpressure between them', () => {
    for (const h of [0, 300, 700, 1_000]) {
      const four = glasstoneGroundRangeFt(4, h);
      const five = glasstoneGroundRangeFt(5, h);
      const six = glasstoneGroundRangeFt(6, h);
      expect(five).toBeLessThanOrEqual(four);
      expect(five).toBeGreaterThanOrEqual(six);
    }
  });

  it('carries 1 psi below it by the ratio a caller gives, and nothing above 15 psi', () => {
    expect(glasstoneGroundRangeFt(0.5, 500, 1.8)).toBeCloseTo(
      1.8 * glasstoneGroundRangeFt(1, 500 / 1.8),
      -2
    );
    expect(glasstoneGroundRangeFt(20, 100)).toBeNaN();
  });

  it('scales with the cube root of the yield', () => {
    const one = glasstoneGroundRangeM(5, 1, 200);
    const thousand = glasstoneGroundRangeM(5, 1_000, 2_000);
    expect(thousand / one).toBeCloseTo(10, 6);
  });
});
