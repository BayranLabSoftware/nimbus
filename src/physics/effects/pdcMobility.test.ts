import { describe, expect, it } from 'vitest';

import {
  OGBURN_2016_MOBILITY,
  OGBURN_X_ORIGIN_M3,
  POOLED_FIT,
  pdcMobilityBandLn,
  pdcMobilityHoverL,
  pdcReachFromEnergyLine,
} from './pdcMobility.js';
import { m } from '../units.js';

/**
 * Rule 220's transcription, checked against the published table, and rule 226's
 * arithmetic kept where a reader will trip over it: the volume this law wants is
 * one current's, and the volume Nimbus has is an eruption's.
 */

describe('how mobile a pyroclastic current is', () => {
  it('carries Table 1 of Ogburn et al. (2016) exactly', () => {
    expect(OGBURN_2016_MOBILITY.fits.colima).toEqual({
      slope: -0.224,
      intercept: -0.386,
      msr: 66.5e-4,
      channelized: false,
    });
    expect(OGBURN_2016_MOBILITY.fits.semeru?.slope).toBe(-0.314);
    expect(Object.keys(OGBURN_2016_MOBILITY.fits)).toHaveLength(5);
    // The pooled pair is the median of the five, and nothing is fitted here.
    expect(POOLED_FIT.slope).toBe(-0.201);
    expect(POOLED_FIT.intercept).toBe(-0.386);
  });

  it('returns 10^α at the volume the paper measures its intercept at', () => {
    expect(OGBURN_X_ORIGIN_M3).toBeCloseTo(316_227.766, 3);
    for (const fit of Object.values(OGBURN_2016_MOBILITY.fits)) {
      expect(pdcMobilityHoverL(OGBURN_X_ORIGIN_M3, fit)).toBeCloseTo(10 ** fit.intercept, 12);
    }
  });

  it('falls with the size of the flow, as the field has known since Heim', () => {
    const small = pdcMobilityHoverL(1e5);
    const large = pdcMobilityHoverL(1e8);
    expect(large).toBeLessThan(small);
    // A thousand times the volume is 10^(3β) of the mobility.
    expect(pdcMobilityHoverL(1e9) / pdcMobilityHoverL(1e6)).toBeCloseTo(
      10 ** (3 * POOLED_FIT.slope),
      10
    );
  });

  it('gives nothing for a flow that is not there', () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(pdcMobilityHoverL(bad)).toBe(0);
      expect(pdcMobilityBandLn(bad)).toBe(0);
      expect(pdcReachFromEnergyLine(m(1_000), bad)).toBe(0);
    }
    expect(pdcReachFromEnergyLine(m(0), 1e7)).toBe(0);
  });

  it('is narrowest where the five volcanoes agree and widens either side', () => {
    // The five fitted lines cross near 3 × 10⁷ m³, not at the paper's x-origin:
    // that origin was chosen to decorrelate each volcano's own slope and
    // intercept, not to make the volcanoes agree. So the band is a factor of
    // 1.22 there and wider both ways — 1.41 at the origin, 1.72 at Tambora's
    // erupted volume, which is five and a half orders past the data.
    const band = (v: number): number => Math.exp(pdcMobilityBandLn(v));
    expect(band(3e7)).toBeLessThan(1.25);
    expect(band(OGBURN_X_ORIGIN_M3)).toBeGreaterThan(1.39);
    expect(band(OGBURN_X_ORIGIN_M3)).toBeLessThan(1.43);
    expect(band(1.4e11)).toBeGreaterThan(1.7);
    expect(band(1e4)).toBeGreaterThan(band(1e7));
    expect(band(1e10)).toBeGreaterThan(band(1e7));
  });

  it('is a law about one current, not about an eruption', () => {
    // Rule 226, as a number: Mount St Helens 1980 dropped 1 850 m and its pumice
    // flows stopped at 8 km, so its mobility was 0.231. The volume at which this
    // law returns that is 5.5 × 10⁶ m³, where the eruption made 1.2 × 10⁹ — a
    // factor of two hundred, which is the gap V1 for flows actually has.
    const observed = 1_850 / 8_000;
    const x = (Math.log10(observed) - POOLED_FIT.intercept) / POOLED_FIT.slope;
    const wanted = OGBURN_X_ORIGIN_M3 * 10 ** x;
    expect(wanted / 1e6).toBeCloseTo(5.5, 0);
    expect(1.2e9 / wanted).toBeGreaterThan(150);
  });
});
