import { describe, expect, it } from 'vitest';
import { mps2 } from '../../units.js';
import {
  mmiFromPgaEuropean,
  modifiedMercalliIntensity,
  pgaFromMercalliIntensity,
} from './intensity.js';

describe('modifiedMercalliIntensity (Worden et al. 2012)', () => {
  it('PGA ≈ 1.8 m/s² (Northridge-like) → MMI ≈ 6.7 (strong shaking)', () => {
    const mmi = modifiedMercalliIntensity(mps2(1.81));
    expect(mmi).toBeGreaterThan(6);
    expect(mmi).toBeLessThan(7.5);
  });

  it('matches the piecewise break at MMI ≈ 4.21 (both branches join)', () => {
    // Break-point: log₁₀(PGA_cm/s²) = 1.57 → PGA = 37.2 cm/s² = 0.372 m/s².
    const mmi = modifiedMercalliIntensity(mps2(0.372));
    expect(mmi).toBeCloseTo(4.21, 1);
  });

  it('returns MMI in [1, 2] for barely-detectable ground motion (floor at ≈ not-felt)', () => {
    // 1 cm/s² is the Worden "below this it is not felt" floor. At that
    // PGA the piecewise fit produces MMI ≈ 1.78, which we accept as the
    // "just barely reported" lower bound — deliberately above the
    // [1, 12] hard clamp to keep the output monotone.
    const mmi = modifiedMercalliIntensity(mps2(1e-6));
    expect(mmi).toBeGreaterThanOrEqual(1);
    expect(mmi).toBeLessThan(2);
  });

  it('clamps to XII for implausibly large PGA', () => {
    expect(modifiedMercalliIntensity(mps2(1_000))).toBe(12);
  });
});

describe('pgaFromMercalliIntensity (inverse of Worden 2012)', () => {
  it('round-trips to a smooth fit through the piecewise break', () => {
    for (const mmi of [2, 4, 4.21, 6, 8, 10]) {
      const back = modifiedMercalliIntensity(pgaFromMercalliIntensity(mmi));
      expect(back).toBeCloseTo(mmi, 2);
    }
  });

  it('MMI VII → PGA ≈ 2 m/s² per the Worden inversion', () => {
    // Inversion: log₁₀(PGA_cm/s²) = (7 + 1.6)/3.7 = 2.324 → 210.9 cm/s²
    // = 2.11 m/s². USGS ShakeMap "Very Strong" band nominally runs
    // 0.34–0.65 g; the formula's central value sits at the upper edge
    // of that band, which is expected given its California calibration.
    const pga = pgaFromMercalliIntensity(7) as number;
    expect(pga).toBeGreaterThan(1.5);
    expect(pga).toBeLessThan(3.0);
  });
});

describe('mmiFromPgaEuropean (Faenza & Michelini 2010, MCS in Italy)', () => {
  it('PGA = 1 m/s² (100 cm/s²) → MCS ≈ 6.84 per the linear regression', () => {
    // MCS = 1.68 + 2.58·log₁₀(100) = 1.68 + 5.16 = 6.84.
    expect(mmiFromPgaEuropean(mps2(1))).toBeCloseTo(6.84, 2);
  });

  it('grows monotonically with PGA and floors at the not-felt cutoff', () => {
    expect(mmiFromPgaEuropean(mps2(2))).toBeGreaterThan(mmiFromPgaEuropean(mps2(0.5)));
    // At the 1 cm/s² not-felt floor: MCS = 1.68 + 2.58·log10(1) = 1.68.
    expect(mmiFromPgaEuropean(mps2(1e-6))).toBeCloseTo(1.68, 2);
  });

  it('clamps to the [1, 12] intensity range', () => {
    expect(mmiFromPgaEuropean(mps2(1_000))).toBe(12);
  });
});
