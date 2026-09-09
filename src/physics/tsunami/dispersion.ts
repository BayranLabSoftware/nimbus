/**
 * Frequency dispersion, and why one number could not do it.
 *
 * A tsunami keeps its shape only while its wavelength dwarfs the
 * water it is crossing. Once the depth is an appreciable fraction of
 * the wavelength the longer components outrun the shorter ones, the
 * single crest spreads into a train, and the leading wave loses
 * height faster than geometry alone would take it. Kajiura (1963)
 * wrote the parameter that says when this matters; Watada, Kusumoto
 * & Satake (2014) showed how much of a real ocean-crossing wave it
 * accounts for.
 *
 * `dispersionAmplitudeFactor` in `events/tsunami/extendedEffects.ts`
 * has carried this for the published far-field rows as a fixed
 * exponential with a 2 500 km scale length, calibrated on the DART
 * record of megathrust waves. That scale is a property of those waves
 * and not of dispersion: a rupture seven hundred kilometres long over
 * four kilometres of ocean makes a wave that barely disperses at all,
 * while the wave from a flank collapse or a depth charge is a
 * kilometre or two long and has spread into a train within a few
 * hundred. One scale length cannot describe both, and the amplitude
 * field — the veil on the globe — has therefore carried no dispersion
 * at all rather than the wrong one.
 *
 * This is the parameter itself, so the veil can carry the right one.
 *
 * References:
 *   Kajiura, K. (1963). "The leading wave of a tsunami." Bull.
 *     Earthquake Res. Inst. 41, 535–571.
 *   Watada, S., Kusumoto, S. & Satake, K. (2014). "Simulating tsunami
 *     waveforms using long-period dispersive wave models." JGR Solid
 *     Earth 119 (5), 4287–4310.
 */

/**
 * Leading coefficient of the dispersion parameter.
 *
 * The linear shallow-water phase speed carries its first correction
 * as c ≈ √(gh)·(1 − (kh)²/6), so a train travelling r spreads by
 * r·(kh)²/6 relative to itself; with k = 2π/λ that is
 * (4π²/6)·r·h²/λ³ ≈ 6.6·r·h²/λ³. The coefficient is the algebra of
 * that expansion rather than a fit.
 */
const DISPERSION_COEFFICIENT = (4 * Math.PI * Math.PI) / 6;

export interface DispersionInput {
  /** Distance travelled from the source (m). */
  rangeM: number;
  /** Water depth along the path (m). */
  depthM: number;
  /** Wavelength of the source disturbance (m). */
  wavelengthM: number;
}

/**
 * How much dispersion a wave of this length has accumulated over this
 * distance in this depth. Dimensionless, zero when nothing disperses,
 * of order one when the leading wave has begun to lose its identity.
 */
export function dispersionParameter(input: DispersionInput): number {
  const r = Number.isFinite(input.rangeM) ? Math.max(0, input.rangeM) : 0;
  const h = Number.isFinite(input.depthM) ? Math.max(0, input.depthM) : 0;
  const lambda = Number.isFinite(input.wavelengthM) ? input.wavelengthM : 0;
  if (r <= 0 || h <= 0 || lambda <= 0) return 0;
  const value = (DISPERSION_COEFFICIENT * r * h * h) / lambda ** 3;
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/**
 * Exponent of the dispersive decay, and why it is a half.
 *
 * This project has always had two far-field laws and treated them as
 * a choice: the veil spreads as 1/√r, the published rows of a compact
 * source decay as 1/r, and reconciling them was written up as work to
 * be done. They are not a choice. They are the same law at its two
 * ends.
 *
 * On a water surface, energy conservation over a growing circumference
 * gives 1/√r for any source at all — that is the geometry, and it is
 * what the veil computes. A dispersing wave loses height a second
 * time, because its energy is spreading not only around the
 * circumference but along a train that lengthens as it travels; in
 * the fully dispersive limit that second spreading is itself r^(−1/2),
 * and the two together are r^(−1) — the 1/r that `propagation.ts` has
 * cited from Lamb since it was written. So the exponent is a half
 * because it has to be, and the dispersion parameter is what carries
 * a wave from one end to the other.
 *
 * The one event measured at two ranges agrees. Crossroads Baker was
 * about thirty metres at three hundred and about 1.8 at five and a
 * half kilometres; this puts the model at 23.4 and 1.90.
 */
const DISPERSION_DECAY_EXPONENT = 0.5;

/**
 * What is left of the leading wave, as a fraction, for a given
 * accumulated dispersion. One where nothing has dispersed, and
 * falling as the inverse square root of the parameter thereafter, so
 * that geometry and dispersion together carry a wave from 1/√r near
 * its source to 1/r far from it.
 */
export function dispersionDecay(parameter: number): number {
  if (!Number.isFinite(parameter) || parameter <= 0) return 1;
  const factor = (1 + parameter) ** -DISPERSION_DECAY_EXPONENT;
  return Number.isFinite(factor) ? Math.min(1, Math.max(0, factor)) : 0;
}

/**
 * The whole law in one call: how much of its height a wave of this
 * length keeps after crossing this distance in this depth.
 *
 * Every path in the simulator goes through here — the veil on the
 * globe, the published far-field rows of a report, the seismic
 * tsunami, the calibration net — so that one wave never has two
 * amplitudes depending on which surface the reader is looking at.
 */
export function dispersionFactor(input: DispersionInput): number {
  return dispersionDecay(dispersionParameter(input));
}
