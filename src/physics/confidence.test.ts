import { describe, expect, it } from 'vitest';
import { bandFor, CONFIDENCE_SIGMA } from './confidence.js';

describe('bandFor', () => {
  it('returns symmetric ±30 % band for firestorm radii', () => {
    const b = bandFor(1_000, 'firestormIgnition');
    expect(b.sigma).toBe(0.3);
    expect(b.low).toBeCloseTo(700, 6);
    expect(b.high).toBeCloseTo(1_300, 6);
  });

  it('returns a multiplicative factor-2 band for ashfall area and lahar runout', () => {
    const ash = bandFor(100, 'ashfallArea');
    expect(ash.high).toBeCloseTo(200, 6); // 2× value
    expect(ash.low).toBeCloseTo(50, 6); // value/2 — NOT zero (regression guard)
    const lahar = bandFor(100, 'laharRunout');
    expect(lahar.high).toBeCloseTo(200, 6);
    expect(lahar.low).toBeCloseTo(50, 6);
    expect(lahar.low).toBeGreaterThan(0);
  });

  it('returns a multiplicative factor-3 band for tsunami far-field', () => {
    const b = bandFor(30, 'tsunamiWunnemannFarField');
    expect(b.high).toBeCloseTo(90, 6); // 3× value
    expect(b.low).toBeCloseTo(10, 6); // value/3 — NOT zero
    expect(b.low).toBeGreaterThan(0);
  });

  it('collapses to zero on non-positive or non-finite input', () => {
    expect(bandFor(0, 'firestormIgnition').value).toBe(0);
    expect(bandFor(-5, 'plumeHeight').high).toBe(0);
    expect(bandFor(Number.NaN, 'laharRunout').low).toBe(0);
  });

  it('every declared sigma is positive and below 4 (sanity bounds)', () => {
    for (const s of Object.values(CONFIDENCE_SIGMA)) {
      expect(s).toBeGreaterThan(0);
      expect(s).toBeLessThan(4);
    }
  });
});
