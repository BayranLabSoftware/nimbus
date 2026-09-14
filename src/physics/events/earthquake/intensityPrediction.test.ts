import { describe, expect, it } from 'vitest';
import {
  allen2012HypocentralMmi,
  allen2012HypocentralSigma,
  epicentralDistanceForIntensityAllen2012,
} from './intensityPrediction.js';

/**
 * The equation as written in intensityPrediction.ts, pinned on values
 * worked out by hand from it: MMI = 2.085 + 1.428·M − 1.402·ln √(R² +
 * R_M²), R_M = −0.209 + 2.042·exp(M − 5), plus 0.078·ln(R/50) past 50 km.
 */

describe('Allen, Wald & Worden 2012, hypocentral form', () => {
  it('gives the intensities the equation gives', () => {
    // M 6 at 20 km: R_M = 5.3417, √(400 + 28.53) = 20.701, ln 3.0302.
    expect(allen2012HypocentralMmi(6, 20)).toBeCloseTo(6.4047, 3);
    expect(allen2012HypocentralMmi(6, 5)).toBeCloseTo(7.8628, 3);
    expect(allen2012HypocentralMmi(7, 20)).toBeCloseTo(7.5722, 3);
    expect(allen2012HypocentralMmi(5, 10)).toBeCloseTo(5.9736, 3);
    // Past the 50 km hinge the far term adds 0.078·ln(80/50).
    expect(allen2012HypocentralMmi(6.5, 80)).toBeCloseTo(5.2514, 3);
  });

  it('is continuous at the hinge and falls on both sides of it', () => {
    expect(allen2012HypocentralMmi(7, 50 + 1e-9)).toBeCloseTo(allen2012HypocentralMmi(7, 50), 6);
    let previous = Number.POSITIVE_INFINITY;
    for (let r = 0; r <= 400; r += 5) {
      const v = allen2012HypocentralMmi(7, r);
      expect(v).toBeLessThan(previous);
      previous = v;
    }
  });

  it('scatters as s1 + s2 / (1 + (R/s3)²)', () => {
    expect(allen2012HypocentralSigma(0)).toBeCloseTo(1.19, 10);
    expect(allen2012HypocentralSigma(22.9)).toBeCloseTo(1.005, 10);
    expect(allen2012HypocentralSigma(1_000)).toBeGreaterThan(0.82);
  });

  it('draws a ring that shrinks with depth and vanishes when the ground above never reaches it', () => {
    const shallow = epicentralDistanceForIntensityAllen2012(6.5, 10, 7) as number;
    expect(shallow / 1_000).toBeCloseTo(18.1, 1);
    // At 35 km the epicentre reads MMI 6.34: no ring of VII at all.
    expect(epicentralDistanceForIntensityAllen2012(6.5, 35, 7)).toBe(0);
    // A residual moves the whole field: one intensity unit up widens it.
    const shifted = epicentralDistanceForIntensityAllen2012(6.5, 10, 7, 1) as number;
    expect(shifted).toBeGreaterThan(shallow);
    // And the ring is where the intensity crosses the threshold.
    expect(allen2012HypocentralMmi(6.5, Math.hypot(shallow / 1_000, 10))).toBeCloseTo(7, 6);
  });
});
