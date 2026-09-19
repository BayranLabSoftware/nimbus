import { describe, expect, it } from 'vitest';
import { J, megatonsToJoules, Mt } from '../units.js';
import {
  MINIMUM_BURNING_AREA_M2,
  firestormSustainRadius,
  flammableIgnitionRadius,
  passesMinimumBurningArea,
} from './firestorm.js';
import { IGNITION_EXPOSURE_CAL_CM2, ignitionExposureCalPerCm2 } from './ignitionExposure.js';

describe('firestorm (Glasstone & Dolan 1977 Table 7.40)', () => {
  it('reads the book at the three yields the table is printed at', () => {
    // Page 289: "Newspaper, shredded — ignites — 4, 6, 11" and "Plywood,
    // douglas fir — flaming during exposure — 9, 16, 20", for 35 kt, 1.4 Mt
    // and 20 Mt.
    expect(IGNITION_EXPOSURE_CAL_CM2.tinder).toEqual([4, 6, 11]);
    expect(IGNITION_EXPOSURE_CAL_CM2.structural).toEqual([9, 16, 20]);
    for (const [kt, tinder, structural] of [
      [35, 4, 9],
      [1_400, 6, 16],
      [20_000, 11, 20],
    ] as const) {
      expect(ignitionExposureCalPerCm2('tinder', kt)).toBeCloseTo(tinder, 6);
      expect(ignitionExposureCalPerCm2('structural', kt)).toBeCloseTo(structural, 6);
    }
  });

  it('holds the table flat outside its own columns, and says so by doing it', () => {
    expect(ignitionExposureCalPerCm2('tinder', 1)).toBe(4);
    expect(ignitionExposureCalPerCm2('tinder', 1e9)).toBe(11);
    expect(ignitionExposureCalPerCm2('structural', 0.001)).toBe(9);
    expect(ignitionExposureCalPerCm2('structural', 1e12)).toBe(20);
  });

  it('rises with the yield between the columns, and never crosses the other row', () => {
    let previousTinder = 0;
    let previousStructural = 0;
    for (const kt of [1, 35, 100, 500, 1_400, 5_000, 20_000, 1e6]) {
      const tinder = ignitionExposureCalPerCm2('tinder', kt);
      const structural = ignitionExposureCalPerCm2('structural', kt);
      expect(tinder).toBeGreaterThanOrEqual(previousTinder);
      expect(structural).toBeGreaterThanOrEqual(previousStructural);
      // A structure needs more heat than shredded newspaper, at every yield.
      expect(structural).toBeGreaterThan(tinder);
      previousTinder = tinder;
      previousStructural = structural;
    }
  });

  it('puts the mass fire inside the fire at every yield (rule 231)', () => {
    for (const mt of [1e-3, 0.015, 0.021, 1, 50, 1e3, 1e5, 1e8]) {
      const W = megatonsToJoules(Mt(mt));
      const ignite = flammableIgnitionRadius({ yieldEnergy: W }) as number;
      const sustain = firestormSustainRadius({ yieldEnergy: W }) as number;
      expect(sustain).toBeLessThan(ignite);
    }
  });

  it('scales as sqrt(W) where the table is held flat — 4× yield doubles the radius', () => {
    // Below 35 kt the threshold does not move, so the inverse-square law is
    // all that is left.
    const r1 = flammableIgnitionRadius({ yieldEnergy: megatonsToJoules(Mt(0.005)) }) as number;
    const r2 = flammableIgnitionRadius({ yieldEnergy: megatonsToJoules(Mt(0.02)) }) as number;
    expect(r2 / r1).toBeCloseTo(2, 2);
  });

  it('grows more slowly than sqrt(W) across the table, because the threshold grows too', () => {
    const r1 = flammableIgnitionRadius({ yieldEnergy: megatonsToJoules(Mt(0.035)) }) as number;
    const r2 = flammableIgnitionRadius({ yieldEnergy: megatonsToJoules(Mt(1.4)) }) as number;
    expect(r2 / r1).toBeLessThan(Math.sqrt(1.4 / 0.035));
    expect(r2 / r1).toBeCloseTo(Math.sqrt((1.4 / 0.035) * (4 / 6)), 2);
  });

  it('atmospheric transmission scales the radius as sqrt(τ)', () => {
    const W = megatonsToJoules(Mt(1));
    const rFull = flammableIgnitionRadius({ yieldEnergy: W }) as number;
    const rHalf = flammableIgnitionRadius({
      yieldEnergy: W,
      atmosphericTransmission: 0.5,
    }) as number;
    expect(rHalf / rFull).toBeCloseTo(Math.sqrt(0.5), 3);
  });

  it('zero or negative yield produces zero radius', () => {
    expect(flammableIgnitionRadius({ yieldEnergy: J(0) })).toBe(0);
    expect(firestormSustainRadius({ yieldEnergy: J(0) })).toBe(0);
  });

  it('holds §7.58 fourth requirement: half a square mile of burning ground', () => {
    expect(MINIMUM_BURNING_AREA_M2).toBeCloseTo(1_294_994.06, 1);
    expect(passesMinimumBurningArea(MINIMUM_BURNING_AREA_M2)).toBe(true);
    expect(passesMinimumBurningArea(MINIMUM_BURNING_AREA_M2 * 0.999)).toBe(false);
    expect(passesMinimumBurningArea(0)).toBe(false);
    expect(passesMinimumBurningArea(Number.NaN)).toBe(false);
  });

  it('accepts a custom thermal partition (impacts use ~0.003, not 0.35)', () => {
    const W = megatonsToJoules(Mt(100_000)); // Chicxulub-class
    const rNuclear = flammableIgnitionRadius({ yieldEnergy: W }) as number;
    const rImpact = flammableIgnitionRadius({
      yieldEnergy: W,
      thermalPartition: 0.003,
    }) as number;
    // 100× less partition → sqrt(100)× less radius.
    expect(rImpact / rNuclear).toBeCloseTo(Math.sqrt(0.003 / 0.35), 3);
  });
});
