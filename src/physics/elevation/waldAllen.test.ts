import { describe, expect, it } from 'vitest';
import { nehrpClassFromVs30, waldAllen2007Vs30FromSlope } from './waldAllen.js';

describe('waldAllen2007Vs30FromSlope', () => {
  const at = (gradient: number): number => waldAllen2007Vs30FromSlope(Math.atan(gradient));

  it('reads the USGS active-tectonic table exactly at its edges', () => {
    // grad2vs30.c, earthquake-global_vs30 (Allen & Wald 2009).
    for (const [gradient, vs30] of [
      [3.5e-3, 240],
      [0.01, 300],
      [0.018, 360],
      [0.05, 490],
      [0.1, 620],
    ] as const) {
      expect(at(gradient)).toBeCloseTo(vs30, 6);
    }
  });

  it('calls steep ground rock: 760 m/s from a gradient of 0.14 up', () => {
    // Until 14 September 2026 every slope past 0.138 read 685 m/s: the
    // last bin interpolated towards the logarithm of infinity.
    expect(at(0.14)).toBe(760);
    expect(at(0.3)).toBe(760);
  });

  it('holds flat ground at 180 m/s below the first edge', () => {
    expect(at(1e-4)).toBe(180);
    expect(waldAllen2007Vs30FromSlope(0)).toBe(180);
  });

  it('interpolates in log slope and log Vs30 inside a bin', () => {
    // Halfway in log slope between 0.018 and 0.05 is the geometric mean
    // of the Vs30 at the two edges.
    expect(at(Math.sqrt(0.018 * 0.05))).toBeCloseTo(Math.sqrt(360 * 490), 6);
  });

  it('increases with slope', () => {
    const slopes = [1e-4, 1e-3, 0.005, 0.02, 0.07, 0.12, 0.25];
    const vs30s = slopes.map(at);
    for (let i = 1; i < vs30s.length; i++) {
      expect(vs30s[i]).toBeGreaterThanOrEqual(vs30s[i - 1] ?? 0);
    }
  });

  it('handles NaN and negative slopes defensively (defaults to 760)', () => {
    expect(waldAllen2007Vs30FromSlope(Number.NaN)).toBe(760);
    expect(waldAllen2007Vs30FromSlope(-0.1)).toBe(760);
  });
});

describe('nehrpClassFromVs30', () => {
  it('classifies the canonical FEMA 2015 bins correctly', () => {
    expect(nehrpClassFromVs30(1_800)).toBe('A'); // Hard rock
    expect(nehrpClassFromVs30(760)).toBe('B'); // Rock boundary
    expect(nehrpClassFromVs30(500)).toBe('C'); // Very dense soil
    expect(nehrpClassFromVs30(250)).toBe('D'); // Stiff soil
    expect(nehrpClassFromVs30(150)).toBe('E'); // Soft clay
  });

  it('defaults to the softest class on invalid inputs', () => {
    expect(nehrpClassFromVs30(-1)).toBe('E');
    expect(nehrpClassFromVs30(Number.NaN)).toBe('E');
  });
});
