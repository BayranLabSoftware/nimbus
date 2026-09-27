import { describe, expect, it } from 'vitest';
import {
  AIR_R,
  AIR_RHO0,
  AIR_T0,
  airBlended,
  airBlendedCounts,
  airEffectiveEdge,
  airGamma,
  airGammaBlended,
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

/** Rules 1334 (a), 1335 (c) and 1336: the fit blended for the solver. */
describe('the blended equation of state', () => {
  it('is the ideal gas at γ = 1.4 exactly in the cold branch', () => {
    for (const [e, rho] of [
      [2e5, 1.225],
      [2e5, 1e-4],
      [1e5, 50],
    ] as const) {
      const s = airBlended(e, rho);
      expect(s.gamma).toBe(1.4);
      expect(s.p).toBe(rho * e * (1.4 - 1));
      expect(s.dpde).toBe(1.4 - 1);
    }
  });

  it('is C¹ across the column and band seams and at the continuation', () => {
    const h = 1e-7;
    const value = (y: number, z: number): number => airGammaBlended(y, z).f;
    const seams: [number, number][] = [
      [0.3, 0.58],
      [0.3, 0.72],
      [0.3, 1.65],
      [0.3, 1.75],
      [-1, 1.45],
      [0, airEffectiveEdge(0).z],
      [-3, airEffectiveEdge(-3).z],
    ];
    for (const [y, z] of seams) {
      const below = airGammaBlended(y, z - 1e-9);
      const above = airGammaBlended(y, z + 1e-9);
      expect(Math.abs(above.f - below.f)).toBeLessThan(1e-7);
      expect(Math.abs(above.fZ - below.fZ)).toBeLessThan(1e-4);
      const v = airGammaBlended(y, z + 1e-3);
      expect(v.fZ).toBeCloseTo((value(y, z + 1e-3 + h) - value(y, z + 1e-3 - h)) / (2 * h), 5);
      expect(v.fY).toBeCloseTo((value(y + h, z + 1e-3) - value(y - h, z + 1e-3)) / (2 * h), 5);
    }
    // The band seams' blends end at Y = −4.6, −4.4 (rule 1342) and −0.55,
    // −0.45: f and f_Y continuous across each end, in Y.
    for (const y of [-4.6, -4.4, -0.55, -0.45])
      for (const z of [1.2, 2.0, 2.6]) {
        const lo = airGammaBlended(y - 1e-9, z);
        const hi = airGammaBlended(y + 1e-9, z);
        expect(Math.abs(hi.f - lo.f)).toBeLessThan(1e-7);
        expect(Math.abs(hi.fY - lo.fY)).toBeLessThan(1e-4);
      }
  });

  it('continues the fit beyond Z_h with γ̃ > 1 and ∂p/∂e > 0, counting it', () => {
    airBlendedCounts.held = 0;
    for (const y of [-6, -2, 0, 2])
      for (const dz of [0.01, 0.5, 2]) {
        const z = airEffectiveEdge(y).z + dz;
        const v = airGammaBlended(y, z);
        expect(v.f).toBeGreaterThan(1);
        expect(v.f - 1 + v.fZ / Math.log(10)).toBeGreaterThan(0);
      }
    expect(airBlendedCounts.held).toBe(12);
  });

  it('holds Y at the nearer end beyond −7 … 3, counting it', () => {
    airBlendedCounts.clamped = 0;
    expect(airGammaBlended(-8, 1.5).f).toBe(airGammaBlended(-7, 1.5).f);
    expect(airGammaBlended(4, 1.5).fY).toBe(0);
    expect(airBlendedCounts.clamped).toBe(2);
  });
});
