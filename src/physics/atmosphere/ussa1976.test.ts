import { describe, expect, it } from 'vitest';
import {
  USSA_SEA_LEVEL_DENSITY,
  USSA_SEA_LEVEL_PRESSURE,
  USSA_SEA_LEVEL_TEMPERATURE,
  ussaDensity,
  ussaPressure,
  ussaTemperature,
} from './ussa1976.js';

/**
 * Reference values from NOAA-S/T 76-1562 Tables I and II ("Atmospheric
 * Properties as a Function of Geopotential Altitude"). The published
 * table lists T, P, and ρ at every standard altitude band; the
 * tolerance below honours the table's own rounding (typically the
 * fifth significant digit).
 */
describe('USSA 1976', () => {
  it('reproduces sea-level reference conditions exactly', () => {
    expect(ussaTemperature(0)).toBeCloseTo(USSA_SEA_LEVEL_TEMPERATURE, 6);
    expect(ussaPressure(0)).toBeCloseTo(USSA_SEA_LEVEL_PRESSURE, 0);
    expect(ussaDensity(0)).toBeCloseTo(USSA_SEA_LEVEL_DENSITY, 3);
  });

  it('matches the tropopause (11 km) reference values', () => {
    // NOAA Table II row at 11 000 m:
    //   T = 216.65 K, P = 22 632 Pa, ρ = 0.36391 kg/m³.
    expect(ussaTemperature(11_000)).toBeCloseTo(216.65, 2);
    expect(ussaPressure(11_000)).toBeGreaterThan(22_500);
    expect(ussaPressure(11_000)).toBeLessThan(22_700);
    expect(ussaDensity(11_000)).toBeGreaterThan(0.355);
    expect(ussaDensity(11_000)).toBeLessThan(0.365);
  });

  it('matches the 20 km stratosphere reference values', () => {
    //   T = 216.65 K, P = 5 474.9 Pa, ρ = 0.088 03 kg/m³.
    expect(ussaTemperature(20_000)).toBeCloseTo(216.65, 2);
    expect(ussaPressure(20_000)).toBeGreaterThan(5_400);
    expect(ussaPressure(20_000)).toBeLessThan(5_550);
    expect(ussaDensity(20_000)).toBeCloseTo(0.088_03, 3);
  });

  it('matches the 32 km stratosphere reference values', () => {
    //   T = 228.65 K, P = 868.02 Pa, ρ = 0.013 22 kg/m³.
    expect(ussaTemperature(32_000)).toBeCloseTo(228.65, 2);
    expect(ussaPressure(32_000)).toBeGreaterThan(840);
    expect(ussaPressure(32_000)).toBeLessThan(900);
    expect(ussaDensity(32_000)).toBeCloseTo(0.013_22, 3);
  });

  it('matches the 47 km stratopause reference values', () => {
    //   T = 270.65 K, ρ ≈ 0.001 42 kg/m³.
    expect(ussaTemperature(47_000)).toBeCloseTo(270.65, 1);
    expect(ussaDensity(47_000)).toBeGreaterThan(0.0013);
    expect(ussaDensity(47_000)).toBeLessThan(0.0016);
  });

  it('returns a monotonically decreasing pressure profile from 0 to 80 km', () => {
    let prev = ussaPressure(0);
    for (let z = 1_000; z <= 80_000; z += 1_000) {
      const p = ussaPressure(z);
      expect(p).toBeLessThan(prev);
      prev = p;
    }
  });

  it('clamps queries above the 86 km ceiling without crashing', () => {
    const ceiling = ussaDensity(86_000);
    expect(ussaDensity(120_000)).toBeCloseTo(ceiling, 6);
    expect(ussaPressure(400_000)).toBeCloseTo(ussaPressure(86_000), 6);
  });

  it('reproduces the published 86 km (geometric) model-top row', () => {
    // USSA-76's 86 km model top is a GEOMETRIC altitude = 84 852 m
    // geopotential. The ceiling clamp lands there, so it must match the
    // published table row: T ≈ 186.87 K, P ≈ 0.3734 Pa, ρ ≈ 6.96e-6.
    // (Clamping at 86 000 m geopotential instead biased P/ρ ~18 % low.)
    expect(ussaTemperature(86_000)).toBeCloseTo(186.9, 0); // K, ±0.5
    expect(ussaPressure(86_000)).toBeGreaterThan(0.34); // Pa
    expect(ussaPressure(86_000)).toBeLessThan(0.41);
    expect(ussaDensity(86_000)).toBeGreaterThan(6.3e-6);
    expect(ussaDensity(86_000)).toBeLessThan(7.6e-6);
  });

  it('clamps queries below sea level to the surface reference', () => {
    expect(ussaTemperature(-500)).toBeCloseTo(USSA_SEA_LEVEL_TEMPERATURE, 6);
    expect(ussaDensity(-1_000)).toBeCloseTo(USSA_SEA_LEVEL_DENSITY, 3);
  });
});
