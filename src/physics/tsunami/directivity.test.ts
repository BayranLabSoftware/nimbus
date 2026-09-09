import { describe, expect, it } from 'vitest';
import { directivityFactor, directivityIsCoherent, INCOHERENT_FLOOR } from './directivity.js';

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
// Tōhoku's own numbers: 700 km of rupture radiating on twice its
// down-dip width, which is what the recorded period says a megathrust
// radiates on. Only 1.25 wavelengths of array, so its beam is real
// but gentle — the sharp ones belong to the very long ruptures.
const rupture = { strikeDeg: strike, ruptureLengthM: 700_000, wavelengthM: 560_000 };
// Sumatra–Andaman: 1 300 km on a 400 km wave, three and a quarter
// wavelengths of array and a beam to match.
const longRupture = { strikeDeg: 330, ruptureLengthM: 1_300_000, wavelengthM: 400_000 };

describe('directivityFactor', () => {
  it('is at its strongest square across the fault, on both sides', () => {
    const east = directivityFactor({ ...rupture, bearingDeg: (strike + 90) % 360 });
    const west = directivityFactor({ ...rupture, bearingDeg: (strike + 270) % 360 });
    expect(east).toBeCloseTo(1, 9);
    expect(west).toBeCloseTo(1, 9);
  });

  it('is weaker off the end of the rupture, where the fault points', () => {
    const alongStrike = directivityFactor({ ...rupture, bearingDeg: strike });
    const broadside = directivityFactor({ ...rupture, bearingDeg: (strike + 90) % 360 });
    expect(alongStrike).toBeLessThan(broadside);
    expect(alongStrike).toBeGreaterThan(0);
  });

  it('a longer array reaches the floor sooner, off a smaller angle', () => {
    // Twenty degrees off broadside. The short array is still radiating
    // in step there; the long one has already dropped through its
    // first null onto the floor.
    const short = directivityFactor({ ...rupture, bearingDeg: (strike + 70) % 360 });
    const long = directivityFactor({ ...longRupture, bearingDeg: (330 + 70) % 360 });
    expect(long).toBeLessThan(short);
    expect(directivityIsCoherent({ ...rupture, bearingDeg: (strike + 70) % 360 })).toBe(true);
    expect(directivityIsCoherent({ ...longRupture, bearingDeg: (330 + 70) % 360 })).toBe(false);
  });

  it('never falls below what the pieces of a rupture radiate on their own', () => {
    // A coherent line source has zeros and a fault does not: it moves
    // together over a correlation length ℓ and breaks into N = L/ℓ
    // pieces, and N incoherent sources add as √N where N coherent
    // ones add as N. The floor is √(ℓ/L), one number for every
    // rupture because the correlation length scales with the fault
    // (Mai & Beroza 2002), anchored on Melgar & Hayes (2019): 150 km
    // of correlation on a 700 km rupture.
    for (const r of [rupture, longRupture]) {
      for (let b = 0; b < 360; b += 3) {
        expect(
          directivityFactor({ ...r, bearingDeg: b }),
          `${r.ruptureLengthM.toString()} m at ${b.toString()}°`
        ).toBeGreaterThanOrEqual(INCOHERENT_FLOOR - 1e-12);
      }
    }
  });

  it('says whether the fault is moving in step or its pieces are', () => {
    // Inside the main lobe the array factor is the answer. Past the
    // first null a real rupture's incoherence fills in what a
    // coherent line source zeroes out, and two records say so: DART
    // 21413 is inside Tōhoku's main lobe and the pattern takes the
    // model from 1.65× the record to 1.14×, while Cocos Island is
    // past the first null of the 2004 rupture, where the pattern says
    // 3 % of the peak and the tide gauge recorded twenty times that.
    expect(directivityIsCoherent({ ...rupture, bearingDeg: (strike + 90) % 360 })).toBe(true);
    expect(directivityIsCoherent({ ...rupture, bearingDeg: 131 })).toBe(true);
    // Cocos lies at bearing 176 from the 2004 centroid, 154° off the
    // perpendicular to a strike of 330 — well past the null of an
    // array three and a quarter wavelengths long.
    expect(directivityIsCoherent({ ...longRupture, bearingDeg: 176 })).toBe(false);
  });

  it('a source with no orientation has no null to be past', () => {
    expect(directivityIsCoherent({ ...rupture, strikeDeg: undefined, bearingDeg: 10 })).toBe(true);
    expect(directivityIsCoherent({ ...rupture, ruptureLengthM: 0, bearingDeg: 10 })).toBe(true);
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
    expect(buoy).toBeLessThan(0.8);
    expect(coast).toBeGreaterThan(0.9);
  });
});
