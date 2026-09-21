import { describe, expect, it } from 'vitest';
import { m as meters } from '../../units.js';
import {
  massEruptionRateFromPlume,
  plumeHeight,
  volumeEruptionRateFromPlume,
} from './plumeHeight.js';

describe('plumeHeight (Mastin et al. 2009, Eq. 1)', () => {
  it('Krakatoa-class V̇ ≈ 2 × 10⁵ m³/s → plume within ±50 % of observed ~40 km', () => {
    const H = plumeHeight({ volumeEruptionRate: 2e5 }) as number;
    // Mastin 2009 Fig. 2 shows a ±factor-2 scatter on real eruption
    // data around the fitted median; Aubry et al. (2023) GRL confirms
    // the same 1σ band. Honest tolerance is the full published scatter,
    // not the nominal fit — expected observational range 20–60 km.
    const observed = 40_000;
    expect(Math.abs(H - observed) / observed).toBeLessThan(0.5);
  });

  it('Mt St. Helens 1980 V̇ ≈ 4 × 10³ m³/s → plume within ±50 % of observed ~15 km', () => {
    const H = plumeHeight({ volumeEruptionRate: 4e3 }) as number;
    // Time-averaged peak plume 14–19 km per USGS Open-File 81-250.
    const observed = 15_000;
    expect(Math.abs(H - observed) / observed).toBeLessThan(0.5);
  });

  it('grows with the Mastin exponent 0.241', () => {
    const low = plumeHeight({ volumeEruptionRate: 1e3 }) as number;
    const high = plumeHeight({ volumeEruptionRate: 1e6 }) as number;
    // 1000× the volume rate → 1000^0.241 ≈ 5.24× the height.
    expect(high / low).toBeCloseTo(1000 ** 0.241, 6);
  });
});

describe('volumeEruptionRateFromPlume (inverse of Mastin 2009)', () => {
  it('round-trips to the original V̇ within floating-point epsilon', () => {
    for (const Vdot of [10, 1_000, 100_000, 1e6]) {
      const back = volumeEruptionRateFromPlume(plumeHeight({ volumeEruptionRate: Vdot }));
      expect(back).toBeCloseTo(Vdot, 4);
    }
  });

  it('saturates above the ceiling, because there is no rate that goes higher', () => {
    // Rules 593 to 604 put a physical ceiling on the forward relation at
    // 71.89 km above vent, so above the rate that reaches it the forward map
    // is constant and has no inverse. What comes back is the rate AT the
    // ceiling, which is the true answer to "what sustains a column this
    // tall": nothing sustains a taller one. The test used to run this at
    // 10⁷ m³/s and round-trip it to 10⁷, which was the defect B-085
    // registered.
    const back = volumeEruptionRateFromPlume(plumeHeight({ volumeEruptionRate: 1e7 }));
    expect(back).toBeCloseTo(2.85e6, -5);
    expect(back).toBeLessThan(1e7);
    // And the inverse itself is untouched: it is still Mastin's, exactly, so
    // a height asked for above the ceiling still answers with the rate the
    // fit would need. It is the forward map that carries the bound.
    expect(volumeEruptionRateFromPlume(meters(100_000))).toBeCloseTo(50 ** (1 / 0.241), -5);
  });

  it('40 km plume implies ≈ 2.5 × 10⁵ m³/s (Krakatoa-class)', () => {
    const V = volumeEruptionRateFromPlume(meters(40_000));
    expect(V).toBeGreaterThan(1.5e5);
    expect(V).toBeLessThan(4e5);
  });
});

describe('massEruptionRateFromPlume', () => {
  it('applies the DRE density (2 500 kg/m³) by default', () => {
    const Vdot = volumeEruptionRateFromPlume(meters(10_000));
    const Mdot = massEruptionRateFromPlume(meters(10_000));
    expect(Mdot).toBeCloseTo(Vdot * 2_500, 3);
  });
});
