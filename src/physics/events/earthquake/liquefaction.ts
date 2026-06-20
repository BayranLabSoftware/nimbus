import { STANDARD_GRAVITY } from '../../constants.js';
import type { Meters, MetersPerSecondSquared } from '../../units.js';
import { mps2 } from '../../units.js';
import { distanceForPga } from './attenuation.js';

/**
 * Soil-liquefaction potential thresholds following:
 *   Youd, T. L. & Idriss, I. M. (2001). "Liquefaction resistance of
 *    soils: Summary report from the 1996 NCEER and 1998 NCEER/NSF
 *    workshops on evaluation of liquefaction resistance of soils."
 *    ASCE Journal of Geotechnical and Geoenvironmental Engineering
 *    127 (4): 297–313. DOI: 10.1061/(ASCE)1090-0241(2001)127:4(297).
 *   Idriss MSF (NCEER lower-bound form), as tabulated in Youd & Idriss
 *    (2001) Eq. 11: MSF = 10^2.24 / M_w^2.56.
 *
 * The engineering procedure is complex (CSR vs. CRR curves, fines
 * content correction, effective-stress reduction with depth). This
 * module condenses the headline outcome into a single "PGA threshold
 * for liquefaction on susceptible saturated sandy soil" plus the
 * magnitude scaling factor.
 */

/** Reference PGA threshold for liquefaction at Mw 7.5 (g units). */
const PGA_THRESHOLD_M75_G = 0.1;

/** Idriss magnitude scaling factor (Youd & Idriss 2001, NCEER form):
 *  MSF = 10^2.24 / M_w^2.56, which accounts for the longer shaking
 *  duration of larger events triggering liquefaction at lower PGA.
 *  Written here in the algebraically-identical pivot form (M/7.5)^−2.56
 *  — note 7.5^2.56 = 10^2.24, so the two are the same expression with
 *  MSF(7.5) = 1 by construction. */
export function liquefactionMagnitudeScalingFactor(magnitude: number): number {
  if (!Number.isFinite(magnitude) || magnitude <= 0) return 1;
  return Math.pow(magnitude / 7.5, -2.56);
}

/** PGA threshold (m/s²) above which liquefaction is likely on a
 *  susceptible saturated sandy soil, for a given magnitude. */
export function liquefactionPgaThreshold(magnitude: number): MetersPerSecondSquared {
  const msf = liquefactionMagnitudeScalingFactor(magnitude);
  return mps2(PGA_THRESHOLD_M75_G * msf * STANDARD_GRAVITY);
}

/** Ground-range radius (m) within which liquefaction is likely on
 *  saturated sandy soil for a given magnitude, using the legacy
 *  Joyner–Boore PGA attenuation as the ground-motion model.
 *
 *  `groundMotionScale` (default 1) multiplies the ground motion to
 *  carry a GMPE aleatory residual: a realisation with factor g reaches
 *  the liquefaction threshold where the MEDIAN PGA = threshold / g, so
 *  g > 1 pushes the radius out and g < 1 pulls it in. The deterministic
 *  pipeline and the impact-cascade caller leave it at 1. */
export function liquefactionRadius(magnitude: number, groundMotionScale = 1): Meters {
  const threshold = liquefactionPgaThreshold(magnitude);
  const g = Number.isFinite(groundMotionScale) && groundMotionScale > 0 ? groundMotionScale : 1;
  return distanceForPga(magnitude, mps2((threshold as number) / g));
}
