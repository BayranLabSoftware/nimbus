import { describe, expect, it } from 'vitest';
import {
  AIR_R,
  AIR_RHO0,
  AIR_T0,
  airGamma,
  airPressure,
  airSoundSpeed,
  airTemperature,
  grabau,
  rp1181,
} from './airEos.js';

/** Rules 1308 and 1312: the equation of state of real air (NASA RP-1181). */

describe('the real-air fits of RP-1181', () => {
  it('reduce to the ideal gas at sea level and room temperature', () => {
    const e = (AIR_R * 300) / 0.4;
    expect(airPressure(e, 1.225) / (1.225 * e)).toBeCloseTo(0.4, 2);
    expect(airTemperature(e, 1.225)).toBeGreaterThan(297);
    expect(airTemperature(e, 1.225)).toBeLessThan(303);
    expect(airSoundSpeed(e, 1.225)).toBeGreaterThan(345);
    expect(airSoundSpeed(e, 1.225)).toBeLessThan(349);
    expect(AIR_RHO0).toBeCloseTo(1.29224, 4);
  });

  it('take the exact derivatives of γ̃ in both variables', () => {
    for (const band of rp1181.pressureBands)
      for (const c of band.columns) {
        const y = 0.5 * (band.yMin + band.yMax);
        const z = c.zMin === null ? 0.5 : c.zMax === null ? c.zMin + 0.2 : 0.5 * (c.zMin + c.zMax);
        const g = grabau(c.coefficients, c.sign, y, z);
        const h = 1e-5;
        const fy =
          (grabau(c.coefficients, c.sign, y + h, z).f -
            grabau(c.coefficients, c.sign, y - h, z).f) /
          (2 * h);
        const fz =
          (grabau(c.coefficients, c.sign, y, z + h).f -
            grabau(c.coefficients, c.sign, y, z - h).f) /
          (2 * h);
        expect(Math.abs(g.fY - fy)).toBeLessThan(1e-6 * Math.max(1, Math.abs(fy)));
        expect(Math.abs(g.fZ - fz)).toBeLessThan(1e-6 * Math.max(1, Math.abs(fz)));
      }
  });

  it('give back Table 12 with the two misprints of Table A5 corrected (rule 1312 (b))', () => {
    const band = rp1181.temperatureBands[1];
    const first = band?.columns[0];
    const third = band?.columns[2];
    expect(first).toBeDefined();
    expect(third).toBeDefined();
    if (first === undefined || third === undefined) return;
    // Point A, upper side (Z = 0.25), density ratio 10⁻²: printed 481 K.
    const a = AIR_T0 * 10 ** grabau(first.coefficients, first.sign, -2, 0.25).f;
    expect(Math.abs(a - 481)).toBeLessThan(2);
    // Point D, lower side (Z = 2.00), density ratio 10⁻⁴: printed 10 364 K.
    const d = AIR_T0 * 10 ** grabau(third.coefficients, third.sign, -4, 2).f;
    expect(Math.abs(d / 10_364 - 1)).toBeLessThan(0.002);
  });

  it('is continuous across the density bands (rule 1312 (c))', () => {
    const e = rp1181.RT0 * 10 ** 1.8;
    for (const edge of [-4.5, -0.5]) {
      const w = edge === -4.5 ? 0.025 : 0.005;
      const below = airGamma(e, AIR_RHO0 * 10 ** (edge - w - 1e-9));
      const inside = airGamma(e, AIR_RHO0 * 10 ** (edge - w + 1e-9));
      expect(Math.abs(inside - below)).toBeLessThan(1e-6);
    }
  });
});
