import { describe, expect, it } from 'vitest';
import { Mt, megatonsToJoules } from '../../units.js';
import { NUCLEAR_CRATER_COEFFICIENT, nuclearApparentCraterDiameter } from './cratering.js';

describe('nuclearApparentCraterDiameter (Glasstone & Dolan 1977, §6.09 scaling)', () => {
  it('gives the 60 ft apparent radius Glasstone & Dolan give a 1 kt burst in dry soil', () => {
    const D = nuclearApparentCraterDiameter({
      yieldEnergy: megatonsToJoules(Mt(0.001)),
      groundCoefficient: NUCLEAR_CRATER_COEFFICIENT.DRY_SOIL,
    }) as number;
    expect(D / 2).toBeCloseTo(60 * 0.3048, 0);
  });

  it('defaults to firm ground, the dry-soil-or-soft-rock crater: ≈ 291 m at 1 Mt', () => {
    const D = nuclearApparentCraterDiameter({ yieldEnergy: megatonsToJoules(Mt(1)) }) as number;
    expect(D).toBeCloseTo(36.6 * 1000 ** 0.3, 3);
  });

  it('orders the ground presets: hard rock < firm = dry < wet < clay', () => {
    const yieldJ = megatonsToJoules(Mt(1));
    const D = (k: number): number =>
      nuclearApparentCraterDiameter({ yieldEnergy: yieldJ, groundCoefficient: k });
    const c = NUCLEAR_CRATER_COEFFICIENT;
    expect(D(c.HARD_ROCK)).toBeLessThan(D(c.FIRM_GROUND));
    expect(D(c.FIRM_GROUND)).toBe(D(c.DRY_SOIL));
    expect(D(c.DRY_SOIL)).toBeLessThan(D(c.WET_SOIL));
    expect(D(c.WET_SOIL)).toBeLessThan(D(c.CLAY));
  });

  it('scales as W^0.3: 1 000× the yield → ≈ 7.94× the diameter', () => {
    const small = nuclearApparentCraterDiameter({
      yieldEnergy: megatonsToJoules(Mt(0.001)), // 1 kt
    }) as number;
    const big = nuclearApparentCraterDiameter({
      yieldEnergy: megatonsToJoules(Mt(1)), // 1 Mt = 1000 kt
    }) as number;
    expect(big / small).toBeCloseTo(1000 ** 0.3, 8);
  });

  it('puts Castle Bravo and Ivy Mike near the mile-wide craters they left in the reef', () => {
    // Kunkle & Ristvet 2013 (DTRIAC SR-12-001): both left a "mile-wide"
    // crater, 1.6 km. K = 92 gives 1.65 km for Bravo (15 Mt) and
    // 1.48 km for Mike (10.4 Mt).
    const D = (mt: number): number =>
      nuclearApparentCraterDiameter({
        yieldEnergy: megatonsToJoules(Mt(mt)),
        groundCoefficient: NUCLEAR_CRATER_COEFFICIENT.WET_SOIL,
      });
    const mile = 1_609;
    expect(Math.abs(D(15) - mile) / mile).toBeLessThan(0.1);
    expect(Math.abs(D(10.4) - mile) / mile).toBeLessThan(0.1);
  });
});
