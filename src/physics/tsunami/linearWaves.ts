import { STANDARD_GRAVITY } from '../constants.js';

/**
 * Linear water waves of a given period: how long they are, and how
 * fast what they carry travels, in water of a given depth.
 *
 * Everything else in the tsunami pipeline assumes the long-wave limit,
 * where a wave feels the whole water column and travels at √(g·h)
 * whatever its period. That is right for a megathrust, whose wave is
 * hundreds of kilometres long, and wrong for an explosion: Glasstone &
 * Dolan's peak wave for a megatonne has a period of 38 s and is 2.3 km
 * long (§6.119), so over four kilometres of ocean it does not feel the
 * bottom at all, and its energy travels at under a sixth of the
 * long-wave speed. Height, arrival time and shoaling all follow from
 * the one relation below.
 *
 *     ω² = g·k·tanh(k·h)                (Airy; Lamb 1932 §228)
 *
 * solved for the wavenumber k from an explicit first guess (Fenton &
 * McKee 1990, accurate to about 1.5 %) refined by Newton's method.
 * The group velocity c_g = n·ω/k with n = ½·(1 + 2kh / sinh 2kh) is
 * the speed of the wave's energy; conserving its flux gives the
 * shoaling law A ∝ c_g^(−1/2), which is Green's law (h^(−1/4)) for a
 * long wave and no change at all for a wave in deep water — the
 * "initial small decrease, then increase" Glasstone & Dolan describe
 * for an explosion train running into shoal water (§6.120).
 *
 * References:
 *   Lamb, H. (1932). "Hydrodynamics" (6th ed.), §228–§237. Cambridge.
 *   Fenton, J. D. & McKee, W. D. (1990). "On calculating the lengths of
 *     water waves." Coastal Engineering 14, 499–513.
 */

/** Wavenumber k (rad/m) of a linear wave of this period in this depth. */
export function wavenumber(periodS: number, depthM: number, g: number = STANDARD_GRAVITY): number {
  if (!(periodS > 0) || !(depthM > 0) || !(g > 0)) return Number.NaN;
  const omega = (2 * Math.PI) / periodS;
  const k0 = (omega * omega) / g;
  // Fenton & McKee: k ≈ k₀ · coth((k₀h)^(3/4))^(2/3).
  let k = k0 / Math.tanh((k0 * depthM) ** 0.75) ** (2 / 3);
  for (let i = 0; i < 3; i++) {
    const kh = k * depthM;
    const t = Math.tanh(kh);
    const f = g * k * t - omega * omega;
    const sech = kh > 350 ? 0 : 1 / Math.cosh(kh);
    const df = g * t + g * kh * sech * sech;
    if (!(df > 0)) break;
    k -= f / df;
  }
  return k;
}

/** Wavelength (m) of a linear wave of this period in this depth. */
export function wavelengthForPeriod(
  periodS: number,
  depthM: number,
  g: number = STANDARD_GRAVITY
): number {
  return (2 * Math.PI) / wavenumber(periodS, depthM, g);
}

/** Speed (m/s) at which the energy of a wave of this period travels in
 *  this depth. √(g·h) for a long wave, g·T/(4π) in deep water. */
export function groupVelocity(
  periodS: number,
  depthM: number,
  g: number = STANDARD_GRAVITY
): number {
  const k = wavenumber(periodS, depthM, g);
  if (!Number.isFinite(k) || k <= 0) return Number.NaN;
  const omega = (2 * Math.PI) / periodS;
  const twoKh = 2 * k * depthM;
  const n = twoKh > 50 ? 0.5 : 0.5 * (1 + twoKh / Math.sinh(twoKh));
  return (n * omega) / k;
}

/**
 * The speed a wave front moves at over water of this depth: the group
 * velocity of the source's period where it has one, and the long-wave
 * speed √(g·h) otherwise. The arrival-time solver and the amplitude
 * veil both take their speeds from here, so a period-carrying wave
 * cannot arrive by one speed and be spread by another.
 */
export function propagationSpeed(
  depthM: number,
  periodS: number | undefined,
  g: number = STANDARD_GRAVITY
): number {
  if (!(depthM > 0)) return 0;
  if (periodS === undefined || !(periodS > 0)) return Math.sqrt(g * depthM);
  const cg = groupVelocity(periodS, depthM, g);
  return Number.isFinite(cg) && cg > 0 ? cg : Math.sqrt(g * depthM);
}
