import { describe, expect, it } from 'vitest';
import { m as meters } from '../../units.js';
import {
  WUNNEMANN_DEEP_WATER_RATIO,
  wunnemannAttenuation,
  wunnemannCollapseWaveAmplitude,
  wunnemannFarField,
  wunnemannRimWaveAmplitude,
  wunnemannRimWaveSourceAmplitude,
  wunnemannUpperBoundAmplitude,
} from './wunnemann.js';

/** Eltanin-class: 1 km asteroid into 4 km of water (the Shuvalov &
 *  Trubetskaya 2002 case the review discusses), R_w ≈ 10 km. */
const DEEP = {
  impactorDiameter: meters(1_000),
  waterDepth: meters(4_000),
  cavityRadius: meters(10_000),
};
/** Chicxulub on the 100 m carbonate shelf: L ≫ h. */
const SHALLOW = {
  impactorDiameter: meters(14_000),
  waterDepth: meters(100),
  cavityRadius: meters(26_000),
};

describe('wunnemannAttenuation (eqs. 10a / 10b)', () => {
  it('deep water: rim wave capped at q_r = 1.2, collapse wave forms with q_c ≈ 2.5', () => {
    const a = wunnemannAttenuation(DEEP);
    expect(a.depthToImpactorRatio).toBe(4);
    expect(a.rimWaveExponent).toBeCloseTo(1.2, 6);
    // q_c = 3·e^(−0.8·0.25) = 3·e^(−0.2)
    expect(a.collapseWaveExponent).toBeCloseTo(3 * Math.exp(-0.2), 6);
    expect(a.collapseWaveForms).toBe(true);
  });

  it('shallow water: rim wave in the r^−0.5 limit and no collapse wave', () => {
    const a = wunnemannAttenuation(SHALLOW);
    expect(a.rimWaveExponent).toBeCloseTo(0.5, 6);
    expect(a.collapseWaveExponent).toBeCloseTo(0, 6);
    expect(a.collapseWaveForms).toBe(false);
  });

  it('collapse wave switches on exactly at h/L = 2', () => {
    const just = wunnemannAttenuation({
      impactorDiameter: meters(500),
      waterDepth: meters(500 * WUNNEMANN_DEEP_WATER_RATIO),
    });
    const below = wunnemannAttenuation({
      impactorDiameter: meters(500),
      waterDepth: meters(500 * WUNNEMANN_DEEP_WATER_RATIO - 1),
    });
    expect(just.collapseWaveForms).toBe(true);
    expect(below.collapseWaveForms).toBe(false);
  });

  it('degenerate inputs fall back to the shallow-water limit', () => {
    const a = wunnemannAttenuation({ impactorDiameter: meters(0), waterDepth: meters(0) });
    expect(a.rimWaveExponent).toBe(0.5);
    expect(a.collapseWaveForms).toBe(false);
  });
});

describe('wunnemannRimWaveSourceAmplitude (eq. 9a at the rim)', () => {
  it('is 0.14 R_w in deep water', () => {
    expect(
      wunnemannRimWaveSourceAmplitude(DEEP.cavityRadius, DEEP.waterDepth) as number
    ).toBeCloseTo(1_400, 6);
  });

  it('is limited by the water depth on a shelf', () => {
    expect(
      wunnemannRimWaveSourceAmplitude(SHALLOW.cavityRadius, SHALLOW.waterDepth) as number
    ).toBe(100);
  });

  it('returns 0 without a cavity or without water', () => {
    expect(wunnemannRimWaveSourceAmplitude(meters(0), meters(4_000)) as number).toBe(0);
    expect(wunnemannRimWaveSourceAmplitude(meters(10_000), meters(0)) as number).toBe(0);
  });
});

describe('wunnemannRimWaveAmplitude (eq. 9a)', () => {
  it('Eltanin-class at 1 000 km: ≈ 5.6 m (1400 m · (10/1000)^1.2)', () => {
    const A = wunnemannRimWaveAmplitude({ ...DEEP, distance: meters(1_000_000) }) as number;
    expect(A).toBeCloseTo(1_400 * 0.01 ** 1.2, 3);
    expect(A).toBeGreaterThan(5);
    expect(A).toBeLessThan(6);
  });

  it('decays as r^−q_r in the far field', () => {
    const near = wunnemannRimWaveAmplitude({ ...DEEP, distance: meters(100_000) }) as number;
    const far = wunnemannRimWaveAmplitude({ ...DEEP, distance: meters(1_000_000) }) as number;
    expect(near / far).toBeCloseTo(10 ** 1.2, 6);
  });

  it('shallow shelf impact decays only as r^−0.5 (classical tsunami spreading)', () => {
    const near = wunnemannRimWaveAmplitude({ ...SHALLOW, distance: meters(100_000) }) as number;
    const far = wunnemannRimWaveAmplitude({ ...SHALLOW, distance: meters(400_000) }) as number;
    expect(near / far).toBeCloseTo(2, 6);
  });

  it('clamps to the source height inside the cavity', () => {
    expect(wunnemannRimWaveAmplitude({ ...DEEP, distance: meters(5_000) }) as number).toBeCloseTo(
      1_400,
      6
    );
  });
});

describe('wunnemannUpperBoundAmplitude (eq. 7)', () => {
  it('Eltanin-class at 1 000 km: 28 m (2800 m · 10/1000)', () => {
    expect(
      wunnemannUpperBoundAmplitude({ ...DEEP, distance: meters(1_000_000) }) as number
    ).toBeCloseTo(28, 6);
  });

  it('decays as 1/r regardless of regime', () => {
    const near = wunnemannUpperBoundAmplitude({ ...SHALLOW, distance: meters(100_000) }) as number;
    const far = wunnemannUpperBoundAmplitude({ ...SHALLOW, distance: meters(1_000_000) }) as number;
    expect(near / far).toBeCloseTo(10, 6);
  });
});

describe('wunnemannCollapseWaveAmplitude (eq. 9b)', () => {
  it('is null for shallow-water impacts', () => {
    expect(wunnemannCollapseWaveAmplitude({ ...SHALLOW, distance: meters(1_000_000) })).toBeNull();
  });

  it('Eltanin-class at 1 000 km is a decimetre-scale wave', () => {
    const A = wunnemannCollapseWaveAmplitude({ ...DEEP, distance: meters(1_000_000) });
    expect(A).not.toBeNull();
    // 0.06 · min(3333, 4000) · (50/1000)^(3e^−0.2)
    const expected = 0.06 * (10_000 / 3) * 0.05 ** (3 * Math.exp(-0.2));
    expect(A as number).toBeCloseTo(expected, 6);
    expect(A as number).toBeGreaterThan(0.1);
    expect(A as number).toBeLessThan(0.2);
  });

  it('holds its 5 R_w value inside the breaking zone instead of extrapolating', () => {
    const at5 = wunnemannCollapseWaveAmplitude({ ...DEEP, distance: meters(50_000) }) as number;
    const at2 = wunnemannCollapseWaveAmplitude({ ...DEEP, distance: meters(20_000) }) as number;
    expect(at2).toBe(at5);
  });
});

describe('wunnemannFarField (eqs. 7 + 8, ordered)', () => {
  it('deep water: lower bound is the collapse wave, upper bound is eq. 7, rim wave sits between', () => {
    const e = wunnemannFarField({ ...DEEP, distance: meters(1_000_000) });
    expect(e.lower as number).toBeCloseTo(e.collapseWave as number, 9);
    expect(e.upper as number).toBeCloseTo(28, 6);
    expect(e.rimWave as number).toBeGreaterThan(e.lower);
    expect(e.rimWave as number).toBeLessThan(e.upper);
  });

  it('shallow water: eq. 8 reduces to the rim wave and the envelope stays ordered', () => {
    const e = wunnemannFarField({ ...SHALLOW, distance: meters(1_000_000) });
    expect(e.collapseWave).toBeNull();
    expect(e.eq8 as number).toBe(e.rimWave);
    expect(e.upper as number).toBeGreaterThanOrEqual(e.lower);
    // Beyond 4 R_w the r^−0.5 rim wave exceeds the 1/r eq. 7 envelope:
    // the ordered `upper` must therefore be the rim wave itself.
    expect(e.upper as number).toBe(e.rimWave);
  });

  it('every member of the envelope decreases monotonically with distance', () => {
    let prev = wunnemannFarField({ ...DEEP, distance: meters(20_000) });
    for (const r of [50_000, 100_000, 300_000, 1_000_000, 5_000_000, 15_000_000]) {
      const next = wunnemannFarField({ ...DEEP, distance: meters(r) });
      expect(next.rimWave as number).toBeLessThanOrEqual(prev.rimWave);
      expect(next.upper as number).toBeLessThanOrEqual(prev.upper);
      expect(next.lower as number).toBeLessThanOrEqual(prev.lower);
      prev = next;
    }
  });
});
