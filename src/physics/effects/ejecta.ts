import type { Meters } from '../units.js';
import { m } from '../units.js';

/**
 * Thickness of the ejecta deposit around an impact crater, as the Earth
 * Impact Effects Program computes it (Collins, Melosh & Marcus 2005,
 * "Earth Impact Effects Program", Meteoritics & Planetary Science 40 (6),
 * 817–840, Eq. 47*; DOI: 10.1111/j.1945-5100.2005.tb00157.x):
 *
 *     t_e(r) = D_tc⁴ / (112 · r³)
 *
 * with D_tc the transient crater diameter and r the distance from the
 * crater centre. Collins et al. make the deposit as thick at the
 * transient rim as the rim is high (h_tr = D_tc / 14.1, from equating
 * the ejected volume with the transient bowl's, Eqs. 43–46) and thin it
 * as r⁻³, the decay McGetchin, Settle & Head (1973) measured around
 * explosion craters (EPSL 20 (2), 226–236, DOI:
 * 10.1016/0012-821X(73)90162-3). Written with the transient diameter,
 * one law serves simple and complex craters. It is a lower bound — no
 * bulking, no ground swept up where the ejecta lands — and it is
 * reported only outside the final rim, since a complex crater's
 * collapse takes the thickest part of the blanket back inside.
 *
 * One departure: Collins et al. stop the deposit at the fireball's edge
 * for impacts under 200 Mt, where the air stifles the ejecta's flight.
 * Nimbus does not make that cut, so for a small impact the thinnest
 * isopachs (the 1 mm edge drawn on the globe) extend the r⁻³ law beyond
 * the range the Earth Impact Effects Program would report.
 */

/** Eq. 47* denominator, from the transient rim height h_tr = D_tc / 14.1
 *  inserted in the r⁻³ law of Eq. 43. */
const COLLINS_EJECTA_DENOMINATOR = 112;

/** Ejecta thickness at ground range `distance` from the impact centre,
 *  for a crater of transient diameter `transientDiameter` whose final
 *  rim lies at `finalRimRadius`. Zero inside the final rim, where the
 *  deposit is not reported. */
export function ejectaThickness(
  distance: Meters,
  transientDiameter: Meters,
  finalRimRadius: Meters
): Meters {
  const r = distance as number;
  const Dtc = transientDiameter as number;
  const Rfr = finalRimRadius as number;
  if (!Number.isFinite(r) || !Number.isFinite(Dtc) || !Number.isFinite(Rfr)) return m(0);
  if (Dtc <= 0 || Rfr <= 0 || r < Rfr) return m(0);
  return m(Dtc ** 4 / (COLLINS_EJECTA_DENOMINATOR * r ** 3));
}

/** Distance at which the deposit thins to `minThickness` (default
 *  1 mm): Eq. 47* inverted, r = (D_tc⁴ / (112 · t))^(1/3). Zero when
 *  the deposit is already thinner than that at the final rim — no
 *  blanket that thick lies outside the crater. */
export function ejectaBlanketOuterEdge(
  transientDiameter: Meters,
  finalRimRadius: Meters,
  minThickness: Meters = m(0.001)
): Meters {
  const Dtc = transientDiameter as number;
  const Rfr = finalRimRadius as number;
  const t = minThickness as number;
  if (!Number.isFinite(Dtc) || Dtc <= 0 || !Number.isFinite(Rfr) || Rfr <= 0) return m(0);
  if (!Number.isFinite(t) || t <= 0) return m(0);
  const edge = Math.cbrt(Dtc ** 4 / (COLLINS_EJECTA_DENOMINATOR * t));
  return m(edge >= Rfr ? edge : 0);
}

/** Ejecta thickness at two final-crater radii from the centre, where
 *  most proximal deposits lie. */
export function ejectaThicknessAt2R(transientDiameter: Meters, finalRimRadius: Meters): Meters {
  return ejectaThickness(m((finalRimRadius as number) * 2), transientDiameter, finalRimRadius);
}

/** Ejecta thickness at ten final-crater radii, where the continuous
 *  blanket grades into discontinuous deposits. */
export function ejectaThicknessAt10R(transientDiameter: Meters, finalRimRadius: Meters): Meters {
  return ejectaThickness(m((finalRimRadius as number) * 10), transientDiameter, finalRimRadius);
}
