import { describe, expect, it } from 'vitest';
import { m } from '../units.js';
import {
  ejectaBlanketOuterEdge,
  ejectaThickness,
  ejectaThicknessAt10R,
  ejectaThicknessAt2R,
} from './ejecta.js';

// A simple crater: D_fr = 1.25 · D_tc (Collins et al. 2005 Eq. 22*).
const Dtc = m(1_000);
const Rfr = m(625);

describe('ejectaThickness (Collins et al. 2005 Eq. 47*)', () => {
  it('is zero inside the final rim, where the deposit is not reported', () => {
    expect(ejectaThickness(m(100), Dtc, Rfr)).toBe(0);
    expect(ejectaThickness(m(624), Dtc, Rfr)).toBe(0);
  });

  it('is D_tc⁴ / (112 r³)', () => {
    expect(ejectaThickness(m(2_000), Dtc, Rfr) as number).toBeCloseTo(1e12 / (112 * 8e9), 9);
  });

  it('at the final rim of a simple crater equals the rim height of Eq. 48*', () => {
    // h_fr = 0.07 · D_tc⁴ / D_fr³; Eq. 47* at r = D_fr / 2 gives D_tc⁴ / (14 D_fr³),
    // which Collins et al. round to 0.07.
    const Dfr = 2 * (Rfr as number);
    const hfr = (0.07 * (Dtc as number) ** 4) / Dfr ** 3;
    const t = ejectaThickness(Rfr, Dtc, Rfr) as number;
    expect(Math.abs(t - hfr) / hfr).toBeLessThan(0.021);
  });

  it('drops with the inverse cube of distance', () => {
    const t2 = ejectaThickness(m(2_000), Dtc, Rfr) as number;
    const t4 = ejectaThickness(m(4_000), Dtc, Rfr) as number;
    expect(t2 / t4).toBeCloseTo(8, 9);
  });

  it('is ≈ 2.4× thinner than the same law written with the final rim radius', () => {
    // The error this module once carried: 0.14 · R (R/r)³ with R the final
    // rim radius instead of the transient one, (1.25)⁴ · 0.98 ≈ 2.4 too thick.
    const r = 5_000;
    const withFinalRim = 0.14 * (Rfr as number) * ((Rfr as number) / r) ** 3;
    const t = ejectaThickness(m(r), Dtc, Rfr) as number;
    expect(withFinalRim / t).toBeCloseTo((1.25 ** 4 * (0.14 * 112)) / 16, 2);
  });

  it('rejects nonsense instead of returning NaN', () => {
    expect(ejectaThickness(m(Number.NaN), Dtc, Rfr)).toBe(0);
    expect(ejectaThickness(m(2_000), m(0), Rfr)).toBe(0);
    expect(ejectaThickness(m(2_000), Dtc, m(-1))).toBe(0);
  });
});

describe('ejectaThicknessAt2R / ejectaThicknessAt10R', () => {
  it('are taken at 2 and 10 final-crater radii, 125× apart', () => {
    const t2R = ejectaThicknessAt2R(Dtc, Rfr) as number;
    const t10R = ejectaThicknessAt10R(Dtc, Rfr) as number;
    expect(t2R).toBeCloseTo(ejectaThickness(m(1_250), Dtc, Rfr), 9);
    expect(t2R / t10R).toBeCloseTo(125, 6);
  });
});

describe('ejectaBlanketOuterEdge', () => {
  it('inverts ejectaThickness: t(edge) = the requested thickness', () => {
    const edge = ejectaBlanketOuterEdge(Dtc, Rfr, m(0.001));
    expect(ejectaThickness(edge, Dtc, Rfr) as number).toBeCloseTo(0.001, 9);
  });

  it('expands with the transient crater', () => {
    const small = ejectaBlanketOuterEdge(m(100), m(62.5)) as number;
    const big = ejectaBlanketOuterEdge(m(100_000), m(62_500)) as number;
    expect(big).toBeGreaterThan(small);
  });

  it('is zero when the deposit is already thinner than that at the final rim', () => {
    // D_tc = 10 m: at the rim (6.25 m) the deposit is ≈ 0.37 m, so there
    // is no 1 m blanket outside the crater.
    expect(ejectaBlanketOuterEdge(m(10), m(6.25), m(1))).toBe(0);
    expect(ejectaBlanketOuterEdge(m(10), m(6.25), m(0.001)) as number).toBeGreaterThan(6.25);
  });

  it('puts the 1 mm edge of a Chicxulub-size crater thousands of km out', () => {
    // D_tc ≈ 92 km, final rim ≈ 83 km: (D_tc⁴ / (112 · 1 mm))^(1/3) ≈ 8 600 km.
    const edge = ejectaBlanketOuterEdge(m(91_500), m(82_800), m(0.001)) as number;
    expect(edge).toBeGreaterThan(8_000_000);
    expect(edge).toBeLessThan(9_000_000);
  });
});
