import type { Meters } from '../../units.js';
import { m } from '../../units.js';

/**
 * Macroseismic intensity straight from magnitude and hypocentral
 * distance: the intensity prediction equation of Allen, Wald & Worden
 * (2012) for active crustal regions, in its hypocentral form.
 *
 *   Allen, T. I., Wald, D. J. & Worden, C. B. (2012). "Intensity
 *     attenuation for active crustal regions." Journal of Seismology
 *     16 (3), 409–433. DOI: 10.1007/s10950-012-9278-7.
 *
 *   MMI = c₀ + c₁·M + c₂·ln √(R_hyp² + R_M²) + c₄·ln(R_hyp / 50)  [R_hyp > 50 km]
 *   R_M = m₁ + m₂·exp(M − 5)
 *
 * R in km; c₀ = 2.085, c₁ = 1.428, c₂ = −1.402, c₄ = 0.078,
 * m₁ = −0.209, m₂ = 2.042, and a total standard deviation of
 * s₁ + s₂ / (1 + (R_hyp / s₃)²) with s₁ = 0.82, s₂ = 0.37, s₃ = 22.9.
 * Fitted on earthquakes of Mw 5.0 to 7.9 within 300 km. The equation and
 * its coefficients were read from OpenQuake's implementation,
 * `AllenEtAl2012Rhypo` in openquake.hazardlib (GEM Foundation), which
 * cites the paper; the paper itself was not read here, and the
 * validation page says so. What is coded agrees with the values an
 * independent Matlab implementation gives, kept in OpenQuake's test data,
 * to within a millionth (validation/ringVerification.ts).
 *
 * The authors give the hypocentral form for when a rupture's extent is
 * not known, which is a custom scenario's case, and it carries what
 * Boore et al. 2014 does not: how deep the source is. It has no site
 * term; its intensities stand on the ground of the reports it was
 * fitted on.
 */

const C0 = 2.085;
const C1 = 1.428;
const C2 = -1.402;
const C4 = 0.078;
const M1 = -0.209;
const M2 = 2.042;
const S1 = 0.82;
const S2 = 0.37;
const S3 = 22.9;
/** Hypocentral distance (km) past which the far term applies. */
const FAR_KM = 50;

/** The median intensity at a hypocentral distance (km). */
export function allen2012HypocentralMmi(magnitude: number, hypocentralKm: number): number {
  const r = Math.max(hypocentralKm, 0);
  const rM = M1 + M2 * Math.exp(magnitude - 5);
  const near = C0 + C1 * magnitude + C2 * Math.log(Math.sqrt(r * r + rM * rM));
  return r > FAR_KM ? near + C4 * Math.log(r / FAR_KM) : near;
}

/** The equation's total standard deviation, in intensity units. */
export function allen2012HypocentralSigma(hypocentralKm: number): number {
  return S1 + S2 / (1 + (Math.max(hypocentralKm, 0) / S3) ** 2);
}

/**
 * The distance along the ground from the epicentre at which the
 * intensity falls to `mmi`, for a source `depthKm` down. Zero when the
 * ground above the source does not reach it. `shiftMmi` moves the whole
 * field up or down, as a ground-motion residual does.
 *
 * The intensity falls monotonically with distance on both sides of the
 * 50 km hinge (c₂ + c₄ < 0), so a bisection finds the one crossing.
 */
export function epicentralDistanceForIntensityAllen2012(
  magnitude: number,
  depthKm: number,
  mmi: number,
  shiftMmi = 0
): Meters {
  const z = Math.max(depthKm, 0);
  const at = (epicentralKm: number): number =>
    allen2012HypocentralMmi(magnitude, Math.hypot(epicentralKm, z)) + shiftMmi;
  if (at(0) < mmi) return m(0);
  let lo = 0;
  let hi = 5_000;
  if (at(hi) >= mmi) return m(hi * 1_000);
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi);
    if (at(mid) >= mmi) lo = mid;
    else hi = mid;
  }
  return m(0.5 * (lo + hi) * 1_000);
}
