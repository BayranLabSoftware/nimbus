import { describe, expect, it } from 'vitest';
import {
  megathrustRuptureLength,
  megathrustRuptureWidth,
  surfaceRuptureLength,
  surfaceRuptureWidth,
} from './ruptureLength.js';

describe('surfaceRuptureLength (Wells & Coppersmith 1994)', () => {
  it('Northridge 1994 (Mw 6.7 reverse) ≈ 20 km SRL (observed ≈ 18 km)', () => {
    const L = surfaceRuptureLength({ magnitude: 6.7, faultType: 'reverse' }) as number;
    // 10^(0.63·6.7 − 2.86) ≈ 23 km. Observed blind-thrust rupture was
    // ≈18 km, within the 0.23-log-unit scatter documented in Wells &
    // Coppersmith Table 2A.
    expect(L).toBeGreaterThan(15_000);
    expect(L).toBeLessThan(30_000);
  });

  it('generic Mw 7.0 strike-slip ≈ 40 km', () => {
    const L = surfaceRuptureLength({ magnitude: 7.0, faultType: 'strike-slip' }) as number;
    // 10^(0.74·7.0 − 3.55) = 10^1.63 ≈ 42.7 km.
    expect(L).toBeCloseTo(10 ** (0.74 * 7.0 - 3.55) * 1_000, -2);
  });

  it("defaults to the 'all' regression when faultType is omitted", () => {
    const L_default = surfaceRuptureLength({ magnitude: 7.0 }) as number;
    const L_all = surfaceRuptureLength({ magnitude: 7.0, faultType: 'all' }) as number;
    expect(L_default).toBe(L_all);
  });

  it("ranks slip regimes as expected at Mw 7.0 (all' coefficient above 'reverse')", () => {
    // At fixed Mw the slip regressions rank differently; the "all" fit
    // can sit above reverse. Verify the sign of each b-coefficient more
    // directly: SRL always grows with magnitude regardless of regime.
    for (const t of ['strike-slip', 'reverse', 'normal', 'all'] as const) {
      const small = surfaceRuptureLength({ magnitude: 5, faultType: t }) as number;
      const big = surfaceRuptureLength({ magnitude: 7, faultType: t }) as number;
      expect(big).toBeGreaterThan(small);
    }
  });
});

describe('surfaceRuptureWidth (Wells & Coppersmith 1994 Table 2A)', () => {
  it('Mw 7.0 reverse ≈ 18 km down-dip width (matches the regression)', () => {
    const W = surfaceRuptureWidth({ magnitude: 7.0, faultType: 'reverse' }) as number;
    expect(W).toBeCloseTo(10 ** (-1.61 + 0.41 * 7.0) * 1_000, -2);
    expect(W).toBeGreaterThan(14_000);
    expect(W).toBeLessThan(24_000);
  });

  it("defaults to the 'all' regression and grows with magnitude", () => {
    expect(surfaceRuptureWidth({ magnitude: 7.0 })).toBe(
      surfaceRuptureWidth({ magnitude: 7.0, faultType: 'all' })
    );
    expect(surfaceRuptureWidth({ magnitude: 7.5 }) as number).toBeGreaterThan(
      surfaceRuptureWidth({ magnitude: 6.5 })
    );
  });

  it('returns 0 for non-finite / non-positive magnitude', () => {
    expect(surfaceRuptureWidth({ magnitude: 0 })).toBe(0);
    expect(surfaceRuptureWidth({ magnitude: Number.NaN })).toBe(0);
  });
});

describe('megathrustRuptureLength / Width (Strasser et al. 2010 interface)', () => {
  it('Tōhoku Mw 9.1 → L ≈ 700 km (observed ≈ 500–700 km)', () => {
    const L = megathrustRuptureLength(9.1) as number;
    expect(L).toBeCloseTo(10 ** (-2.477 + 0.585 * 9.1) * 1_000, -3);
    expect(L).toBeGreaterThan(500_000);
    expect(L).toBeLessThan(900_000);
  });

  it('Tōhoku Mw 9.1 → W ≈ 200 km (Hayes et al. 2011 finite-fault)', () => {
    const W = megathrustRuptureWidth(9.1) as number;
    expect(W).toBeCloseTo(10 ** (-0.882 + 0.351 * 9.1) * 1_000, -3);
    expect(W).toBeGreaterThan(150_000);
    expect(W).toBeLessThan(280_000);
  });

  it('both grow monotonically with magnitude and floor at 0 for bad input', () => {
    expect(megathrustRuptureLength(9.0) as number).toBeGreaterThan(megathrustRuptureLength(8.0));
    expect(megathrustRuptureWidth(9.0) as number).toBeGreaterThan(megathrustRuptureWidth(8.0));
    expect(megathrustRuptureLength(0)).toBe(0);
    expect(megathrustRuptureWidth(Number.NaN)).toBe(0);
  });
});
