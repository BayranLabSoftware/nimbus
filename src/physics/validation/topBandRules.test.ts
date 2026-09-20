import { describe, expect, it } from 'vitest';
import { topBandIntensity } from './topBandRules.js';

/**
 * Rule 440, pinned before the run.
 *
 * The clause that matters most here is the one that costs the candidate:
 * the bound works in BOTH directions, and a great earthquake's top band
 * goes UP. A round that kept only the half that lowers tolls would have
 * been choosing its answer.
 */
describe('rule 440: the top band is charged what it spans', () => {
  it('charges the middle between the threshold and the peak', () => {
    // Haiti's Mw 6.0: top band MMI 8, peak 8.25, so 8.125 and not 8.5.
    expect(topBandIntensity(8, 8.25)).toBeCloseTo(8.125, 12);
    // Nepal's, whose peak barely clears the threshold at all.
    expect(topBandIntensity(8, 8.02)).toBeCloseTo(8.01, 12);
  });

  it('leaves a band that genuinely spans a whole degree where it is', () => {
    // The behaviour shipping today, recovered exactly: a peak a whole
    // degree above the threshold gives the midpoint the model uses now.
    expect(topBandIntensity(7, 8)).toBe(7.5);
    expect(topBandIntensity(8, 9)).toBe(8.5);
    expect(topBandIntensity(9, 10)).toBe(9.5);
  });

  it('goes UP for an earthquake whose peak is far above its top band', () => {
    // This is the half of the rule that costs the candidate, and it is
    // here on purpose. A great earthquake reaching MMI 11 in its MMI 9
    // band is charged 10, not 9.5.
    expect(topBandIntensity(9, 11)).toBe(10);
    expect(topBandIntensity(9, 10.8)).toBeCloseTo(9.9, 12);
  });

  it('never charges less than the band it is', () => {
    // A peak below the threshold would mean the band should not exist.
    // Charging below it would be inventing gentleness.
    expect(topBandIntensity(8, 7.4)).toBe(8);
    expect(topBandIntensity(8, 0)).toBe(8);
  });

  it('keeps the midpoint where there is no peak to read', () => {
    expect(topBandIntensity(8, Number.NaN)).toBe(8.5);
    expect(topBandIntensity(7, Number.POSITIVE_INFINITY)).toBe(7.5);
  });
});
