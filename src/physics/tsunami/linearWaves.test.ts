import { describe, expect, it } from 'vitest';
import { STANDARD_GRAVITY } from '../constants.js';
import { groupVelocity, propagationSpeed, wavelengthForPeriod, wavenumber } from './linearWaves.js';

const g = STANDARD_GRAVITY;

describe('linear waves of a given period', () => {
  it('solves the dispersion relation, in any water', () => {
    for (const period of [5, 22, 38, 600, 3_600]) {
      for (const depth of [1, 50, 61, 800, 4_000, 11_000]) {
        const k = wavenumber(period, depth);
        const omega = (2 * Math.PI) / period;
        expect((g * k * Math.tanh(k * depth)) / (omega * omega)).toBeCloseTo(1, 9);
      }
    }
  });

  it('is a long wave in shallow water and a deep-water wave in deep water', () => {
    // A tsunami-period wave over the abyss still feels the bottom…
    expect(groupVelocity(3_600, 4_000) / Math.sqrt(g * 4_000)).toBeGreaterThan(0.999);
    // …and an explosion's 38 s wave does not.
    const period = 38;
    expect(groupVelocity(period, 4_000) / ((g * period) / (4 * Math.PI))).toBeCloseTo(1, 6);
    expect(
      wavelengthForPeriod(period, 4_000) / ((g * period * period) / (2 * Math.PI))
    ).toBeCloseTo(1, 6);
  });

  it('is the long-wave speed wherever no period is given', () => {
    for (const depth of [10, 61, 4_000]) {
      expect(propagationSpeed(depth, undefined)).toBe(Math.sqrt(g * depth));
    }
    expect(propagationSpeed(0, 38)).toBe(0);
    expect(propagationSpeed(4_000, 38)).toBeCloseTo(groupVelocity(38, 4_000), 12);
  });

  it('shoals as Glasstone & Dolan describe: a little down, then up (§6.120)', () => {
    // A ∝ c_g^(−1/2). Moving from deep water towards the shore the
    // group velocity first rises above its deep value, then falls.
    const period = 22;
    const deep = groupVelocity(period, 4_000);
    const intermediate = groupVelocity(period, 60);
    const shoal = groupVelocity(period, 5);
    expect(intermediate).toBeGreaterThan(deep);
    expect(shoal).toBeLessThan(deep);
  });

  it('survives nonsense', () => {
    expect(Number.isNaN(wavenumber(0, 100))).toBe(true);
    expect(Number.isNaN(groupVelocity(10, -1))).toBe(true);
  });
});
