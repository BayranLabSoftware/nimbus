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
  const { strikeDeg, bearingDeg } = input;
  if (strikeDeg === undefined || !Number.isFinite(strikeDeg)) return 1;
  if (!Number.isFinite(bearingDeg)) return 1;
  const L = Number.isFinite(input.ruptureLengthM) ? Math.max(0, input.ruptureLengthM) : 0;
  const lambda = Number.isFinite(input.wavelengthM) ? Math.max(0, input.wavelengthM) : 0;
  if (L <= 0 || lambda <= 0) return 1;

  // Angle from the perpendicular to the strike, folded into the first
  // quadrant: the pattern is symmetric across the fault and along it,
  // so all four quadrants say the same thing.
  const fromStrike = (((bearingDeg - strikeDeg) % 360) + 360) % 360;
  // The sine of the angle off the perpendicular is the cosine of the
  // angle off the strike, and the absolute value folds all four
  // quadrants together — the pattern is symmetric across the fault
  // and along it.
  const sinTheta = Math.abs(Math.cos((fromStrike * Math.PI) / 180));

  const u = (Math.PI * L * sinTheta) / lambda;
  if (u < 1e-9) return 1;
  const factor = Math.abs(Math.sin(u) / u);
  return Number.isFinite(factor) ? Math.min(1, Math.max(0, factor)) : 1;
}
