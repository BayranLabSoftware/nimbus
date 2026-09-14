import { describe, expect, it } from 'vitest';
import { J, Mt, megatonsToJoules } from '../../units.js';
import { SEISMIC_EFFICIENCY_RANGE, seismicMagnitude } from './seismic.js';

describe('seismicMagnitude (Collins et al. 2005 Eq. 40*)', () => {
  it('gives M ≈ 9.9 for a Chicxulub-class event (3.14 × 10²³ J)', () => {
    const M = seismicMagnitude(J(3.1416e23));
    // 0.67 × log10(3.1416e23) − 5.87 ≈ 9.86
    expect(M).toBeCloseTo(9.86, 1);
  });

  it('gives M ≈ 5.4 for 15 Mt TNT delivered to the ground', () => {
    // 15 Mt = 6.276 × 10¹⁶ J; 0.67 × 16.798 − 5.87 ≈ 5.38.
    const M = seismicMagnitude(megatonsToJoules(Mt(15)));
    expect(M).toBeCloseTo(5.38, 1);
  });

  it('increases by exactly 0.67 per decade of energy', () => {
    const a = seismicMagnitude(J(1e20));
    const b = seismicMagnitude(J(1e21));
    expect(b - a).toBeCloseTo(0.67, 10);
  });

  it('moves by 0.67 per decade of seismic efficiency, ±0.67 across 10⁻⁵–10⁻³', () => {
    const E = J(1e23);
    const central = seismicMagnitude(E);
    expect(seismicMagnitude(E, 1e-4)).toBe(central);
    expect(central - seismicMagnitude(E, SEISMIC_EFFICIENCY_RANGE.low)).toBeCloseTo(0.67, 10);
    expect(seismicMagnitude(E, SEISMIC_EFFICIENCY_RANGE.high) - central).toBeCloseTo(0.67, 10);
  });

  it('is an energy magnitude: reading 10⁻⁴·E as a seismic moment would be ≈ 2.9 lower', () => {
    // Hanks & Kanamori with M₀ = 10⁻⁴·E. The gap is the factor ≈ 2 × 10⁴
    // between an earthquake's moment and its radiated energy (Kanamori
    // 1977), which is why Nimbus does not report that reading.
    const E = 1e23;
    const momentReading = (2 / 3) * Math.log10(1e-4 * E) - 6.07;
    expect(seismicMagnitude(J(E)) - momentReading).toBeCloseTo(2.93, 1);
  });

  it('returns 0 for non-positive energy or efficiency', () => {
    expect(seismicMagnitude(J(0))).toBe(0);
    expect(seismicMagnitude(J(-5))).toBe(0);
    expect(seismicMagnitude(J(1e20), 0)).toBe(0);
  });
});
