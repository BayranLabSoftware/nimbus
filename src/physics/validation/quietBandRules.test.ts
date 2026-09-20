import { describe, expect, it } from 'vitest';
import { QUIET_DEATHS_BELOW } from './depthRules.js';
import {
  bandWidthLn,
  corroboratesRefusal,
  medianOf,
  QUIET_TOLL_THRESHOLD,
} from './quietBandRules.js';

describe('rule 438: one earthquake is not a trend', () => {
  it('needs more than a single event to corroborate', () => {
    // 23 quiet earthquakes cross ten under the geometry in place.
    expect(corroboratesRefusal(23, 24)).toBe(false);
    expect(corroboratesRefusal(23, 25)).toBe(true);
  });

  it('contradicts where the candidate is no worse', () => {
    expect(corroboratesRefusal(23, 23)).toBe(false);
    expect(corroboratesRefusal(23, 11)).toBe(false);
  });

  it('reads ten from the constant that has always meant it', () => {
    expect(QUIET_TOLL_THRESHOLD).toBe(QUIET_DEATHS_BELOW);
    expect(QUIET_TOLL_THRESHOLD).toBe(10);
  });
});

describe('rule 437(c): a band that contains everything is not sharp', () => {
  it('grows with what the band spans', () => {
    expect(bandWidthLn(0, 0)).toBeNull();
    const narrow = bandWidthLn(0, 9) ?? Number.NaN;
    const wide = bandWidthLn(0, 271_621) ?? Number.NaN;
    expect(wide).toBeGreaterThan(narrow);
    // Haiti's band, 42 to 271 621, against one of 0 to 9.
    expect(bandWidthLn(42, 271_621)).toBeGreaterThan(narrow);
  });

  it('is finite for a band that starts at nothing', () => {
    // 99 % of these bands reach zero, so a plain ln(high/low) would be
    // infinite for almost all of them and the median meaningless.
    expect(Number.isFinite(bandWidthLn(0, 1000) ?? Number.NaN)).toBe(true);
  });

  it('is zero for a band that says one thing', () => {
    expect(bandWidthLn(5, 5)).toBeCloseTo(0, 12);
  });
});

describe('the median', () => {
  it('takes the middle, and the mean of two middles', () => {
    expect(medianOf([3, 1, 2])).toBe(2);
    expect(medianOf([4, 1, 2, 3])).toBe(2.5);
    expect(medianOf([])).toBeNull();
  });
});
