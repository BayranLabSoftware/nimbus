/**
 * A long rupture does not push the ocean outward in a circle.
 *
 * It pushes it across itself. Seven hundred kilometres of seafloor
 * rising together radiate a wave the way a long antenna radiates a
 * signal — strongest square across the line, weakest off its ends,
 * and the longer the line the narrower the beam. Tōhoku flooded
 * Sanriku and then crossed the whole Pacific to break boats in Chile,
 * while the Sea of Okhotsk, a few hundred kilometres off the northern
 * end of the same rupture, was comparatively spared. Ben-Menahem &
 * Rosenman (1972) wrote the pattern down for tsunamis; it is the
 * array factor of a line of sources, and it is the same mathematics
 * that describes a row of loudspeakers.
 *
 * The simulator has radiated its megathrusts in a circle until now,
 * at the amplitude of the peak, which puts the strongest wave the
 * fault can make in every direction at once and quietly manufactures
 * energy. This is the pattern it was missing.
 *
 *     f(θ) = | sin(πL sinθ / λ) / (πL sinθ / λ) |
 *
 * with θ measured from the perpendicular to the strike, L the rupture
 * length and λ the wavelength of the disturbance. It is 1 across the
 * fault, falls to its first null when L sinθ = λ, and tends to λ/(πL)
 * off the ends. A rupture shorter than its own wave has no beam and
 * the factor is 1 everywhere, which is the right answer for a small
 * earthquake and the reason nothing needs a special case for one.
 *
 * A coherent line source has zeros; a fault does not, and two records
 * say so from opposite sides. DART 21413 lies inside the main lobe of
 * the Tōhoku rupture, and the pattern takes the modelled amplitude
 * there from 1.65× the recorded peak to 1.14×. Cocos Island lies past
 * the first null of the 2004 rupture, where the pattern says three
 * per cent of the peak, and the tide gauge recorded twenty times
 * that.
 *
 * The nulls are filled in by everything that makes a rupture a
 * rupture rather than an antenna. The pattern assumes the whole fault
 * radiates one wavelength in step, and a fault that took ten minutes
 * to tear thirteen hundred kilometres through patchy slip does not.
 * It moves together over a correlation length ℓ and breaks into
 * N = L/ℓ pieces that do not agree with each other, and N incoherent
 * sources add as √N in amplitude where N coherent ones add as N. So
 * the radiation cannot fall below √(ℓ/L) of its own peak, and the
 * floor is one number for every rupture rather than one per event:
 * Mai & Beroza (2002) found the correlation length scales with the
 * fault's own dimensions, so ℓ/L does not depend on magnitude.
 *
 * What sets it is a measurement. Melgar & Hayes (2019), as reported
 * by Sepúlveda et al. (2020), put the along-strike correlation length
 * of a magnitude 9 rupture near 150 km, against the seven hundred
 * kilometres such a rupture runs — a fifth of its length. The floor is
 * the root of that, near 0.46, and it is the only number in this file.
 * It is not fitted to the two records; it is measured elsewhere and
 * happens to reproduce them, which is the difference worth insisting
 * on. With it, Cocos reads 0.83× of the tide-gauge record where the
 * bare pattern read 0.06×, and DART is untouched at 1.14× because a
 * main lobe is above the floor by definition.
 *
 * References for the floor:
 *   Mai, P. M. & Beroza, G. C. (2002). "A spatial random field model
 *     to characterize complexity in earthquake slip." J. Geophys.
 *     Res. 107 (B11), 2308. DOI: 10.1029/2001JB000588.
 *   Melgar, D. & Hayes, G. P. (2019). "The correlation lengths and
 *     hypocentral positions of great earthquakes." Bull. Seismol.
 *     Soc. Am. 109 (6), 2582–2593.
 *   Sepúlveda, I. et al. (2020). "Effects of earthquake spatial slip
 *     correlation on variability of tsunami potential energy and
 *     intensities." Sci. Rep. 10, 8296.
 *
 * The peak is left where it is rather than being renormalised upward.
 * The amplitude this multiplies is derived from the peak seafloor
 * uplift, so it already belongs on the peak axis; spreading it evenly
 * was the error, and the fix is to take it away from the other
 * directions, not to add more to this one.
 *
 * Reference:
 *   Ben-Menahem, A. & Rosenman, M. (1972). "Amplitude patterns of
 *     tsunami waves from submarine earthquakes." J. Geophys. Res.
 *     77 (17), 3097–3128.
 */

/**
 * The along-strike slip correlation length as a fraction of the
 * rupture length: how much of a fault moves in step with itself.
 *
 * One number for every megathrust, because Mai & Beroza (2002) found
 * the correlation length scales with the fault dimension rather than
 * with magnitude independently. Anchored on Melgar & Hayes (2019),
 * whose along-strike correlation length for a magnitude 9 rupture is
 * about 150 km where such a rupture is about 700 km long.
 */
export const SLIP_CORRELATION_FRACTION = 150 / 700;

/**
 * The level a rupture's radiation cannot fall below, whatever the
 * array factor says: N = L/ℓ incoherent pieces add as √N where N
 * coherent ones add as N, so the pattern floors at √(ℓ/L) ≈ 0.46.
 */
export const INCOHERENT_FLOOR = Math.sqrt(SLIP_CORRELATION_FRACTION);

export interface DirectivityInput {
  /** Bearing from the source to the point being asked about (° from
   *  north, clockwise). */
  bearingDeg: number;
  /** Strike of the rupture (° from north). Undefined for a source
   *  with no orientation, which then radiates evenly. */
  strikeDeg: number | undefined;
  /** Length of the rupture along strike (m). */
  ruptureLengthM: number;
  /** Wavelength of the disturbance (m). */
  wavelengthM: number;
}

/**
 * How much of the peak wave reaches a given bearing: 1 across the
 * fault, less off its ends, never more and never negative. An
 * unoriented or short source radiates evenly and gets 1 everywhere.
 */
export function directivityFactor(input: DirectivityInput): number {
  const u = arrayArgument(input);
  if (u === null || u < 1e-9) return 1;
  const coherent = Math.abs(Math.sin(u) / u);
  if (!Number.isFinite(coherent)) return 1;
  // The larger of what the fault radiates in step and what its pieces
  // radiate out of step. Across the fault the first is 1 and wins; off
  // its ends the first goes to zero and the second is what is left.
  return Math.min(1, Math.max(0, Math.max(coherent, INCOHERENT_FLOOR)));
}

/**
 * The argument of the array factor, πL sinθ / λ, or null when the
 * source has no orientation and radiates evenly.
 */
function arrayArgument(input: DirectivityInput): number | null {
  const { strikeDeg, bearingDeg } = input;
  if (strikeDeg === undefined || !Number.isFinite(strikeDeg)) return null;
  if (!Number.isFinite(bearingDeg)) return null;
  const L = Number.isFinite(input.ruptureLengthM) ? Math.max(0, input.ruptureLengthM) : 0;
  const lambda = Number.isFinite(input.wavelengthM) ? Math.max(0, input.wavelengthM) : 0;
  if (L <= 0 || lambda <= 0) return null;
  const fromStrike = (((bearingDeg - strikeDeg) % 360) + 360) % 360;
  const sinTheta = Math.abs(Math.cos((fromStrike * Math.PI) / 180));
  return (Math.PI * L * sinTheta) / lambda;
}

/**
 * Whether the value at this bearing comes from the fault moving in
 * step — the array factor's main lobe — or from the incoherent floor
 * beneath it. Both are believable; they are believable for different
 * reasons, and a caller reporting a far-field amplitude may want to
 * say which.
 *
 * A source with no orientation, or one shorter than its own wave, is
 * coherent everywhere because it has no null to be past.
 */
export function directivityIsCoherent(input: DirectivityInput): boolean {
  const u = arrayArgument(input);
  if (u === null) return true;
  return Math.abs(Math.sin(u) / u) >= INCOHERENT_FLOOR;
}
