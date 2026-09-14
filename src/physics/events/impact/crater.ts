import { SIMPLE_COMPLEX_TRANSITION_EARTH, STANDARD_GRAVITY } from '../../constants.js';
import type { KilogramPerCubicMeter, Meters, MetersPerSecond, Radians } from '../../units.js';
import { m } from '../../units.js';

/**
 * Crater morphology pipeline (Collins, Melosh & Marcus 2005, "Earth Impact
 * Effects Program", MAPS 40 (6)). The simulator applies the three stages
 * strictly in this order — every other physics module that consumes a
 * crater diameter expects the *final* (Eq. 22 / 27) value, except the
 * ejecta deposit, which Eq. 47 writes with the transient one:
 *
 *   1. {@link transientCraterDiameter}  — Eq. 21, pi-group transient bowl
 *   2. {@link finalCraterDiameter}       — Eq. 22 (simple) or Eq. 27 (complex)
 *   3. {@link craterDepth}               — Eqs. 23–26 (simple) or Eq. 28 (complex)
 *
 * The depth shown in the UI is `craterDepth(finalCraterDiameter(
 * transientCraterDiameter(input)))`. Taking the transient bowl for the
 * final crater would make a simple crater 20 % too narrow (Eq. 22).
 *
 * Inputs for the transient-bowl scaling. Angles are measured from the
 * target horizontal (0° = grazing, 90° = vertical). `surfaceGravity`
 * defaults to Earth's standard gravity; override for other bodies.
 */
export interface TransientCraterInput {
  impactorDiameter: Meters;
  impactVelocity: MetersPerSecond;
  impactorDensity: KilogramPerCubicMeter;
  targetDensity: KilogramPerCubicMeter;
  impactAngle: Radians;
  surfaceGravity?: number;
}

/**
 * Transient crater diameter, measured at the pre-impact surface, from
 * pi-group scaling:
 *
 *     D_tc = 1.161 · (ρ_i / ρ_t)^(1/3) · L^0.78 · v^0.44 · g^(−0.22) · sin(θ)^(1/3)
 *
 * Collins, Melosh & Marcus (2005) build it on Holsapple & Schmidt (1982),
 * Schmidt & Housen (1987) and Gault (1974), combining small-scale
 * hypervelocity and nuclear-explosion cratering data. It holds for solid
 * rock where gravity stops the crater's growth — every terrestrial crater
 * more than a couple of hundred metres across — and the constant 1.161 is
 * a best estimate within 0.8–1.5. L and v are the impactor's diameter and
 * speed after atmospheric entry.
 *
 * Source: Collins, Melosh & Marcus (2005), Meteoritics & Planetary Science
 * 40(6), pp. 817–840, Eq. 21*. DOI: 10.1111/j.1945-5100.2005.tb00157.x.
 */
export function transientCraterDiameter(input: TransientCraterInput): Meters {
  const L = input.impactorDiameter as number;
  const v = input.impactVelocity as number;
  const rhoI = input.impactorDensity as number;
  const rhoT = input.targetDensity as number;
  const theta = input.impactAngle as number;
  const g = input.surfaceGravity ?? STANDARD_GRAVITY;

  const diameter =
    1.161 *
    (rhoI / rhoT) ** (1 / 3) *
    L ** 0.78 *
    v ** 0.44 *
    g ** -0.22 *
    Math.sin(theta) ** (1 / 3);

  return m(diameter);
}

/**
 * Final (post-modification) crater rim-to-rim diameter.
 *
 * Branches by morphology at the simple-to-complex transition diameter:
 *
 *   - If the simple-morphology prediction (1.25 · D_tc) stays below D_c,
 *     the crater keeps its bowl shape:
 *        D_fr = 1.25 · D_tc          (Eq. 22)
 *
 *   - Otherwise the bowl collapses into a complex crater (central peak,
 *     terraces, shallower floor):
 *        D_fr = 1.17 · D_tc^1.13 · D_c^(−0.13)   (Eq. 27)
 *
 * Collins et al. apply Eq. 27 when D_tc exceeds 2.56 km, the same test.
 * The two fits do not join: at D_tc = 2.56 km the simple rule gives
 * 3.20 km and the complex one 2.91 km. The exponents of Eq. 27 sum to
 * one, so it holds in metres as printed for kilometres.
 *
 * Source: Collins, Melosh & Marcus (2005), Eqs. 22* & 27*.
 * DOI: 10.1111/j.1945-5100.2005.tb00157.x.
 *
 * @param transient          transient crater diameter D_tc
 * @param transitionDiameter simple-to-complex transition diameter D_c
 *                           (defaults to Earth, competent rock)
 */
export function finalCraterDiameter(
  transient: Meters,
  transitionDiameter: Meters = SIMPLE_COMPLEX_TRANSITION_EARTH
): Meters {
  const Dtc = transient as number;
  const Dc = transitionDiameter as number;
  const simple = 1.25 * Dtc;
  if (simple < Dc) {
    return m(simple);
  }
  return m((1.17 * Dtc ** 1.13) / Dc ** 0.13);
}

/**
 * Rim-to-floor depth of a fresh final crater, as the Earth Impact Effects
 * Program estimates it (Collins, Melosh & Marcus 2005).
 *
 *   - Simple craters (D_fr < D_c): the transient bowl, less the breccia
 *     lens that slides back into it, plus the rim —
 *        d_tc = D_tc / (2√2)                        (Eq. 25*)
 *        h_fr = 0.07 · D_tc⁴ / D_fr³                (Eq. 48*)
 *        V_br = 0.032 · D_fr³                       (Eq. 23*)
 *        t_br = 2.8 · V_br · (d_tc + h_fr) / (d_tc · D_fr²)   (Eq. 24*)
 *        d_fr = d_tc + h_fr − t_br                  (Eq. 26*)
 *     with D_tc = D_fr / 1.25 (Eq. 22* inverted), which makes the depth
 *     a fixed 0.213 of the diameter.
 *   - Complex craters (D_fr ≥ D_c): d_fr = 0.4 · D_fr^0.3, both in km
 *     (Eq. 28*) — the fit Herrick et al. (1997) made to fresh complex
 *     craters on Venus, whose gravity is close to Earth's; Collins et al.
 *     prefer it to terrestrial data, which are few and eroded.
 *
 * The two branches do not join: at D_c = 3.2 km the simple rule gives
 * 681 m and the complex one 567 m.
 *
 * Source: Collins, Melosh & Marcus (2005), Meteoritics & Planetary
 * Science 40 (6), 817–840, Eqs. 22*–28*, 48*.
 * DOI: 10.1111/j.1945-5100.2005.tb00157.x. Herrick, Sharpton, Malin,
 * Lyons & Feely (1997), "Morphology and morphometry of impact craters",
 * in Venus II, University of Arizona Press, pp. 1015–1046.
 *
 * These are fresh-crater depths; erosion and infill change what a real
 * crater preserves.
 */
export function craterDepth(
  diameter: Meters,
  transitionDiameter: Meters = SIMPLE_COMPLEX_TRANSITION_EARTH
): Meters {
  const Dfr = diameter as number;
  const Dc = transitionDiameter as number;
  if (!Number.isFinite(Dfr) || Dfr <= 0) return m(0);
  if (Dfr < Dc) {
    const Dtc = Dfr / 1.25;
    const dtc = Dtc / (2 * Math.SQRT2);
    const hfr = (0.07 * Dtc ** 4) / Dfr ** 3;
    const Vbr = 0.032 * Dfr ** 3;
    const tbr = (2.8 * Vbr * (dtc + hfr)) / (dtc * Dfr ** 2);
    return m(dtc + hfr - tbr);
  }
  return m(1000 * 0.4 * (Dfr / 1000) ** 0.3);
}
