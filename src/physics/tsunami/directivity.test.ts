import { describe, expect, it } from 'vitest';
import { directivityFactor } from './directivity.js';

/**
 * Written before the module, and pinning only what a line source has
 * to do: radiate across itself, not along itself, and do it the same
 * way on both sides.
 *
 * A megathrust seven hundred kilometres long does not push the ocean
 * outward in a circle. It pushes it perpendicular to the fault, in a
 * beam, and the longer the rupture the narrower the beam — which is
 * why Tōhoku flooded Sanriku and then crossed the Pacific to Chile
 * while leaving the Sea of Okhotsk, a few hundred kilometres off the
 * end of the same rupture, comparatively alone.
 */

const strike = 200; // Japan Trench, NNE–SSW
const rupture = { strikeDeg: strike, ruptureLengthM: 700_000, wavelengthM: 200_000 };

describe('directivityFactor', () => {
  it('is at its strongest square across the fault, on both sides', () => {
    const east = directivityFactor({ ...rupture, bearingDeg: (strike + 90) % 360 });
    const west = directivityFactor({ ...rupture, bearingDeg: (strike + 270) % 360 });
    expect(east).toBeCloseTo(1, 9);
    expect(west).toBeCloseTo(1, 9);
  });

  it('is weak off the end of the rupture, where the fault points', () => {
    const alongStrike = directivityFactor({ ...rupture, bearingDeg: strike });
    expect(alongStrike).toBeLessThan(0.2);
    expect(alongStrike).toBeGreaterThanOrEqual(0);
  });

  it('narrows as the rupture lengthens, for the same wave', () => {
    const offAxis = 20;
    const bearing = (strike + 90 + offAxis) % 360;
    const short = directivityFactor({ ...rupture, ruptureLengthM: 100_000, bearingDeg: bearing });
    const long = directivityFactor({ ...rupture, ruptureLengthM: 1_000_000, bearingDeg: bearing });
    expect(long).toBeLessThan(short);
    // A rupture shorter than its own wave has no beam to speak of.
    expect(
      directivityFactor({ ...rupture, ruptureLengthM: 20_000, bearingDeg: bearing })
    ).toBeGreaterThan(0.9);
  });

  it('never exceeds the peak, and never goes negative', () => {
    for (let b = 0; b < 360; b += 1) {
      const f = directivityFactor({ ...rupture, bearingDeg: b });
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
    }
  });

  it('is symmetric about the fault, so the two sides of a trench agree', () => {
    for (const off of [5, 20, 45, 70]) {
      const a = directivityFactor({ ...rupture, bearingDeg: (strike + 90 + off) % 360 });
      const b = directivityFactor({ ...rupture, bearingDeg: (strike + 90 - off + 360) % 360 });
      expect(a).toBeCloseTo(b, 12);
    }
  });

  it('says nothing when it has nothing to say', () => {
    // No strike, no rupture, no wavelength: an isotropic source is
    // the honest default rather than an arbitrary beam.
    expect(
      directivityFactor({
        bearingDeg: 42,
        strikeDeg: undefined,
        ruptureLengthM: 700_000,
        wavelengthM: 200_000,
      })
    ).toBe(1);
    expect(directivityFactor({ ...rupture, bearingDeg: 42, ruptureLengthM: 0 })).toBe(1);
    expect(directivityFactor({ ...rupture, bearingDeg: Number.NaN })).toBe(1);
  });

  it('puts the Tōhoku buoy off the beam and the Japanese coast on it', () => {
    // DART 21413 lies at bearing 131° from the epicentre, 21° off the
    // seaward perpendicular; the Sanriku coast is on the landward one.
    const buoy = directivityFactor({ ...rupture, bearingDeg: 131 });
    const coast = directivityFactor({ ...rupture, bearingDeg: 290 });
    expect(buoy).toBeLessThan(0.5);
    expect(coast).toBeGreaterThan(0.9);
  });
});
