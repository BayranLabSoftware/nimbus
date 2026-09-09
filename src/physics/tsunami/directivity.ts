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
 * Where this can be believed, and where it cannot. A coherent line
 * source has zeros; a fault does not. The pattern assumes the whole
 * rupture radiates one wavelength in step, and a fault that took ten
 * minutes to tear thirteen hundred kilometres through patchy slip
 * does neither — its nulls are filled in by everything that makes it
 * a real rupture rather than an antenna. Two records say so from
 * opposite sides. DART 21413 lies inside the main lobe of the Tōhoku
 * rupture, and applying this pattern takes the modelled amplitude
 * there from 1.65× the recorded peak to 1.14×. Cocos Island lies past
 * the first null of the 2004 rupture, where the pattern says three
 * per cent of the peak, and the tide gauge recorded a wave twenty
 * times larger than that.
 *
 * So `directivityTrusted` says which side of the first null a bearing
 * falls on, and callers that need an estimate rather than a shape use
 * the pattern inside the main lobe and decline to use it outside.
 * What would extend it past the null is the slip correlation length —
 * how far along a rupture the seafloor really does move in step —
 * which this project has no measurement of and will not invent.
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
  const factor = Math.abs(Math.sin(u) / u);
  return Number.isFinite(factor) ? Math.min(1, Math.max(0, factor)) : 1;
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
 * Whether the pattern can be believed at this bearing: true inside
 * the main lobe, false past the first null, where a real rupture's
 * incoherence fills in what a coherent line source zeroes out.
 *
 * A source with no orientation, or one shorter than its own wave, has
 * no null to be past and is trusted everywhere.
 */
export function directivityTrusted(input: DirectivityInput): boolean {
  const u = arrayArgument(input);
  return u === null || u <= Math.PI;
}
