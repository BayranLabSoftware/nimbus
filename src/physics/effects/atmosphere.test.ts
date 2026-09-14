import { describe, expect, it } from 'vitest';
import { J, mps } from '../units.js';
import { climateTier, shockAcidRainMass, stratosphericDustMass } from './atmosphere.js';

const MEGATON = 4.184e15;

describe('atmosphere — Toon et al. 1997 / Prinn & Fegley 1987', () => {
  describe('stratosphericDustMass (Toon et al. 1997 eq. 10, §8.2)', () => {
    it('is 0.1 % of 4 Tg of pulverized rock per Mt at 25 km/s', () => {
      const m = stratosphericDustMass(J(MEGATON), mps(25_000)) as number;
      expect(m).toBeCloseTo(4e6, 0);
    });

    it('comes to about 30 % of the impactor mass at 25 km/s', () => {
      // 1 Mt at 25 km/s is 1.34 × 10⁷ kg of impactor.
      const impactorMass = (2 * MEGATON) / 25_000 ** 2;
      const m = stratosphericDustMass(J(MEGATON), mps(25_000)) as number;
      expect(m / impactorMass).toBeCloseTo(0.3, 1);
    });

    it('puts a 10⁸ Mt impact at 20 km/s near 4 × 10¹⁴ kg', () => {
      const m = stratosphericDustMass(J(1e8 * MEGATON), mps(20_000)) as number;
      expect(m).toBeCloseTo(4e14 * 1.25 ** 0.33, -12);
    });

    it('scales linearly with energy and as v^−0.33 with speed', () => {
      const base = stratosphericDustMass(J(1e20), mps(20_000)) as number;
      expect((stratosphericDustMass(J(1e21), mps(20_000)) as number) / base).toBeCloseTo(10, 9);
      expect((stratosphericDustMass(J(1e20), mps(40_000)) as number) / base).toBeCloseTo(
        2 ** -0.33,
        9
      );
    });

    it('returns zero for non-positive energy or speed', () => {
      expect(stratosphericDustMass(J(0), mps(20_000))).toBe(0);
      expect(stratosphericDustMass(J(-5), mps(20_000))).toBe(0);
      expect(stratosphericDustMass(J(1e20), mps(0))).toBe(0);
    });
  });

  describe('shockAcidRainMass (Prinn & Fegley 1987)', () => {
    it("gives Prinn & Fegley's asteroid its 3 × 10³⁸ NO molecules as HNO₃", () => {
      // 5 × 10¹⁴ kg at 20 km/s = 1.0 × 10²³ J; 3e38 / N_A × 63.013 g/mol.
      const m = shockAcidRainMass(J(1e23)) as number;
      expect(m).toBeCloseTo((3e38 / 6.02214076e23) * 0.063013, -9);
      expect(m).toBeGreaterThan(3.1e13);
      expect(m).toBeLessThan(3.2e13);
    });

    it('lands within 15 % of their comet, 7 × 10⁴⁰ molecules at 2.6 × 10²⁵ J', () => {
      const comet = (7e40 / 6.02214076e23) * 0.063013;
      const m = shockAcidRainMass(J(0.5 * 1.25e16 * 65_000 ** 2)) as number;
      expect(Math.abs(m - comet) / comet).toBeLessThan(0.15);
    });

    it('scales linearly with energy', () => {
      const small = shockAcidRainMass(J(1e21)) as number;
      const big = shockAcidRainMass(J(1e23)) as number;
      expect(big / small).toBeCloseTo(100, 6);
    });

    it('returns zero for non-positive energy', () => {
      expect(shockAcidRainMass(J(0))).toBe(0);
      expect(shockAcidRainMass(J(-5))).toBe(0);
    });
  });

  describe('climateTier', () => {
    it('places Tunguska (~2 × 10¹⁶ J) in LOCAL/REGIONAL depending on exact energy', () => {
      expect(climateTier(J(2e16))).toBe('LOCAL');
      expect(climateTier(J(5e18))).toBe('REGIONAL');
    });

    it('places 1 Gt TNT (4 × 10¹⁸ J) in REGIONAL', () => {
      expect(climateTier(J(4.184e18))).toBe('REGIONAL');
    });

    it('places 4 × 10²³ J in GLOBAL', () => {
      expect(climateTier(J(4e23))).toBe('GLOBAL');
    });

    it('flags an extinction-class event above 10²⁴ J', () => {
      expect(climateTier(J(2e24))).toBe('EXTINCTION');
    });

    it('returns LOCAL for zero / non-finite input', () => {
      expect(climateTier(J(0))).toBe('LOCAL');
      expect(climateTier(J(Number.NaN))).toBe('LOCAL');
    });
  });
});
