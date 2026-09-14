import { describe, expect, it } from 'vitest';
import { TNT_SPECIFIC_ENERGY } from '../../constants.js';
import { groupVelocity, wavelengthForPeriod } from '../../tsunami/linearWaves.js';
import { J, m } from '../../units.js';
import {
  DEEP_WATER_FROM_SCALED_DEPTH,
  explosionTsunami,
  explosionWave,
  MICHE_LIMITING_STEEPNESS,
  SHALLOW_WATER_BELOW_SCALED_DEPTH,
} from './underwaterBurst.js';

/**
 * The burst's wave is Glasstone & Dolan's, so these tests read like the
 * book: the numbers in §6.119 and §6.121, in the units they were
 * printed in, and the places where the model has to say something the
 * book does not.
 */

const FOOT_M = 0.3048;
const FT2 = FOOT_M * FOOT_M;
const kt = (kilotons: number): ReturnType<typeof J> => J(kilotons * TNT_SPECIFIC_ENERGY * 1e6);

describe("Glasstone & Dolan's relations", () => {
  it('in deep water, H·R = 40 500·W^0.54 ft² (§6.119)', () => {
    // A megatonne in 800 m of water: 2 625 ft, inside 1 440–4 780 ft.
    const wave = explosionWave(1_000, 800);
    expect(wave?.regime).toBe('deep');
    expect(wave?.withinStatedRange).toBe(true);
    expect(wave?.heightTimesRangeM2).toBeCloseTo(40_500 * 1_000 ** 0.54 * FT2, 6);
  });

  it('in shallow water, H·R = 150·d_w·W^0.25 ft² (§6.121) — Crossroads Baker', () => {
    // 23 kt in "about 200 feet" of lagoon: 200 < 100·23^0.25 = 219.
    const wave = explosionWave(23, 200 * FOOT_M);
    expect(wave?.regime).toBe('shallow');
    expect(wave?.withinStatedRange).toBe(true);
    expect(wave?.heightTimesRangeM2).toBeCloseTo(150 * 200 * 23 ** 0.25 * FT2, 6);
  });

  it('between the two relations, carries one into the other without a jump at either end', () => {
    for (const yieldKt of [0.01, 1, 23, 1_000, 50_000]) {
      const w025 = yieldKt ** 0.25;
      const at = (scaled: number): number =>
        explosionWave(yieldKt, scaled * w025 * FOOT_M)?.heightTimesRangeM2 ?? Number.NaN;
      const eps = 1e-7;
      for (const edge of [SHALLOW_WATER_BELOW_SCALED_DEPTH, DEEP_WATER_FROM_SCALED_DEPTH]) {
        expect(at(edge * (1 + eps)) / at(edge * (1 - eps))).toBeCloseTo(1, 5);
      }
      expect(explosionWave(yieldKt, 160 * w025 * FOOT_M)?.regime).toBe('between');
      expect(explosionWave(yieldKt, 160 * w025 * FOOT_M)?.withinStatedRange).toBe(false);
    }
  });

  it('never gives a deeper sea a smaller wave', () => {
    for (const yieldKt of [0.5, 23, 1_000]) {
      let previous = 0;
      for (let depth = 1; depth <= 6_000; depth *= 1.05) {
        const hr = explosionWave(yieldKt, depth)?.heightTimesRangeM2 ?? 0;
        expect(hr).toBeGreaterThanOrEqual(previous * (1 - 1e-12));
        previous = hr;
      }
    }
  });

  it('says when the water is deeper than the deep relation was stated for', () => {
    // A kilotonne in 4 km of ocean: 850·1^0.25 ft is 259 m.
    expect(explosionWave(1, 4_000)?.regime).toBe('deep');
    expect(explosionWave(1, 4_000)?.withinStatedRange).toBe(false);
  });

  it("gives the peak wave the period of §6.119, and that period's deep-water length is the book's", () => {
    for (const yieldKt of [1, 23, 1_000]) {
      const wave = explosionWave(yieldKt, 4_000);
      const period = wave?.peakPeriodS ?? Number.NaN;
      expect(period).toBeCloseTo(14.1 * yieldKt ** 0.144, 9);
      // L ≈ 1 010·W^0.288 ft: the length a wave of that period has in
      // deep water, which is how the two §6.119 figures agree.
      const bookLength = 1_010 * yieldKt ** 0.288 * FOOT_M;
      expect(wavelengthForPeriod(period, 20_000) / bookLength).toBeGreaterThan(0.98);
      expect(wavelengthForPeriod(period, 20_000) / bookLength).toBeLessThan(1.03);
    }
  });
});

describe('the wave of a burst within the water', () => {
  const megatonne = (burstDepth: number, waterDepth = 800): ReturnType<typeof explosionTsunami> =>
    explosionTsunami({
      yieldEnergy: kt(1_000),
      burstDepth: m(burstDepth),
      waterDepth: m(waterDepth),
    });

  it('is half the relation’s height, beyond the near field', () => {
    const r = megatonne(40);
    expect(r).not.toBeNull();
    if (r === null) return;
    expect(r.amplitudeAt100km as number).toBeCloseTo(r.heightTimesRange / (2 * 100_000), 9);
    expect(r.amplitudeAt1000km as number).toBeCloseTo(r.heightTimesRange / (2 * 1_000_000), 9);
    // And the published source sits on the same relation at its radius.
    expect((r.sourceAmplitude as number) * (r.cavityRadius as number)).toBeCloseTo(
      r.heightTimesRange / 2,
      6
    );
  });

  it('is the same at any depth within the water, and does not exist outside it', () => {
    const shallow = megatonne(5);
    const deep = megatonne(700);
    expect(shallow?.amplitudeAt100km).toBe(deep?.amplitudeAt100km);
    expect(megatonne(0)).toBeNull(); // on the surface
    expect(megatonne(-30)).toBeNull(); // in the air
    expect(megatonne(801)).toBeNull(); // in the seabed
  });

  it('is held near the burst where the relation would stand steeper than the water can', () => {
    for (const [yieldKt, depth] of [
      [23, 200 * FOOT_M],
      [1_000, 800],
      [1, 30],
    ] as const) {
      const r = explosionTsunami({ yieldEnergy: kt(yieldKt), waterDepth: m(depth) });
      expect(r).not.toBeNull();
      if (r === null) return;
      const length = wavelengthForPeriod(r.dominantPeriod, depth);
      const steepest =
        MICHE_LIMITING_STEEPNESS * length * Math.tanh((2 * Math.PI * depth) / length);
      expect(2 * (r.sourceAmplitude as number)).toBeLessThanOrEqual(steepest * (1 + 1e-9));
      const bubble = (256 * yieldKt ** 0.25 * FOOT_M) / 2;
      expect(r.cavityRadius as number).toBeGreaterThanOrEqual(bubble * (1 - 1e-9));
    }
  });

  it("crosses the basin at its peak wave's group velocity, not the long-wave speed", () => {
    const r = explosionTsunami({
      yieldEnergy: kt(1_000),
      waterDepth: m(800),
      meanOceanDepth: m(4_000),
    });
    expect(r).not.toBeNull();
    if (r === null) return;
    // A 38 s wave over 4 km of ocean is a deep-water wave: g·T/(4π).
    const expected = groupVelocity(r.dominantPeriod, 4_000);
    expect(r.deepWaterCelerity as number).toBeCloseTo(expected, 9);
    expect(r.deepWaterCelerity as number).toBeGreaterThan(28);
    expect(r.deepWaterCelerity as number).toBeLessThan(32);
    expect(r.travelTimeTo100km as number).toBeCloseTo(100_000 / expected, 6);
  });

  it('is nothing for nothing', () => {
    expect(explosionTsunami({ yieldEnergy: J(0), waterDepth: m(100) })).toBeNull();
    expect(explosionTsunami({ yieldEnergy: kt(1), waterDepth: m(0) })).toBeNull();
    expect(explosionWave(Number.NaN, 100)).toBeNull();
    expect(explosionWave(1, Number.POSITIVE_INFINITY)).toBeNull();
  });
});
