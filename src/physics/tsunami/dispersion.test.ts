import { describe, expect, it } from 'vitest';
import { dispersionParameter, dispersionDecay } from './dispersion.js';

/**
 * Written before the thing it tests, and it pins only what is certain
 * about frequency dispersion in shallow water: which waves it eats,
 * which it leaves alone, and that it never adds anything.
 *
 * A tsunami is non-dispersive only while its wavelength dwarfs the
 * water depth. The megathrust waves that made the fixed 2 500 km
 * scale length of `dispersionAmplitudeFactor` are hundreds of
 * kilometres long over four kilometres of ocean, and barely disperse
 * at all across a basin. The wave a compact source makes — a
 * kilometre or two long, over a shelf — is a different animal and
 * spreads its energy into a train within a few hundred kilometres.
 * One fixed scale length cannot describe both, which is why the veil
 * has carried no dispersion at all rather than the wrong one.
 */

const KM = 1_000;

describe('dispersionParameter', () => {
  it('grows with distance and with depth, and falls hard with wavelength', () => {
    const base = dispersionParameter({ rangeM: 100 * KM, depthM: 100, wavelengthM: 2 * KM });
    expect(dispersionParameter({ rangeM: 200 * KM, depthM: 100, wavelengthM: 2 * KM })).toBeCloseTo(
      2 * base,
      9
    );
    expect(dispersionParameter({ rangeM: 100 * KM, depthM: 200, wavelengthM: 2 * KM })).toBeCloseTo(
      4 * base,
      9
    );
    expect(dispersionParameter({ rangeM: 100 * KM, depthM: 100, wavelengthM: 4 * KM })).toBeCloseTo(
      base / 8,
      9
    );
  });

  it('is nothing for the long wave of a megathrust across an ocean', () => {
    // 700 km of rupture over 4 km of water, out to 1 500 km.
    const d = dispersionParameter({ rangeM: 1_500 * KM, depthM: 4_000, wavelengthM: 700 * KM });
    expect(d).toBeLessThan(0.01);
  });

  it('is large for the short wave of a compact source over a shelf', () => {
    // Anak Krakatau: a cavity a few hundred metres across, in the
    // Sunda Strait, a hundred kilometres out.
    const d = dispersionParameter({ rangeM: 100 * KM, depthM: 50, wavelengthM: 1.3 * KM });
    expect(d).toBeGreaterThan(0.1);
  });
});

describe('dispersionDecay', () => {
  it('leaves an undispersed wave alone and never amplifies one', () => {
    expect(dispersionDecay(0)).toBe(1);
    for (const d of [0.001, 0.1, 1, 10, 100]) {
      expect(dispersionDecay(d)).toBeLessThanOrEqual(1);
      expect(dispersionDecay(d)).toBeGreaterThanOrEqual(0);
    }
  });

  it('never rises', () => {
    let previous = 1;
    for (let d = 0; d <= 30; d += 0.1) {
      const f = dispersionDecay(d);
      expect(f).toBeLessThanOrEqual(previous + 1e-12);
      previous = f;
    }
  });

  it('survives nonsense', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
      const f = dispersionDecay(bad);
      expect(Number.isFinite(f)).toBe(true);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
    }
    const p = dispersionParameter({ rangeM: Number.NaN, depthM: -1, wavelengthM: 0 });
    expect(Number.isFinite(p)).toBe(true);
    expect(p).toBeGreaterThanOrEqual(0);
  });
});
