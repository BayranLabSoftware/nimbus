import { TNT_SPECIFIC_ENERGY } from '../constants.js';
import type { Meters, Pascals } from '../units.js';
import { m, Pa } from '../units.js';

/**
 * The air blast of a charge on the ground: Kingery & Bulmash's compilation for
 * a hemispherical TNT surface burst, in the simplified form Swisdak published.
 *
 * Kingery & Bulmash (1984) fitted high-order polynomials to explosive trials
 * from under a kilogramme to over four hundred tonnes, and those curves are
 * what the field computes a charge's blast with — CONWEP, the United States
 * explosives safety standard, NATO's AASTP-1 and the United Nations' IATG all
 * read them. Swisdak (1994) republished the same curves as one-line
 * polynomials, "accurate to within 1 % of the original Kingery values", and it
 * is his form that is written here.
 *
 * Reference:
 *   Swisdak, M. M. Jr. (1994). "Simplified Kingery Airblast Calculations."
 *     Minutes of the 26th DoD Explosives Safety Seminar, Miami, 16–18 August
 *     1994. Naval Surface Warfare Center, Indian Head. DTIC ADA526744,
 *     approved for public release; distribution unlimited. Table 1, the
 *     metric incident-pressure block (page 8 of the scan, "1 of 3"), read from
 *     the copy whose SHA-256 is recorded in validation/chemicalBlastRules.ts.
 *   Kingery, C. N. & Bulmash, G. (1984). "Airblast Parameters From TNT
 *     Spherical Air Bursts and Hemispherical Surface Bursts", ARBRL-TR-02555.
 *
 * The coefficients below are the ones Table 1 prints, not a fit of this
 * project's and not a transcription of anyone's code. Three readings check the
 * transcription, and `kingeryBulmash.test.ts` runs all three in CI: the
 * worked examples of IATG 01.80 (2021) Table 5, the paper's own English-unit
 * coefficients converted to metric, and the two joins between ranges.
 *
 * What it is not. Kingery's compilation carries the weather and the charge
 * performance of the trials it was fitted on, Swisdak's paper says its curves
 * "should not be extrapolated beyond the ranges shown", and it warns that at
 * low pressures, where weather rules, a measurement may differ from the
 * standard by a long way. The product says as much wherever it draws a ring
 * from these curves.
 */

/** The function Table 1 gives: P = exp(A + B·ln Z + C·ln²Z + … + G·ln⁶Z), with
 *  Z the scaled distance in metres per cube-root kilogramme of TNT and P the
 *  peak incident (side-on) overpressure in kilopascals. */
interface ScaledRange {
  /** Lowest scaled distance the fit is printed for (m·kg⁻¹ᐟ³). */
  readonly from: number;
  /** Highest scaled distance the fit is printed for (m·kg⁻¹ᐟ³). */
  readonly to: number;
  /** A to G, in that order; Table 1 leaves F and G at zero for this quantity. */
  readonly coefficients: readonly number[];
}

/** Incident pressure in kPa against Z in m·kg⁻¹ᐟ³ (Swisdak 1994, Table 1). */
const INCIDENT_PRESSURE_KPA: readonly ScaledRange[] = [
  { from: 0.2, to: 2.9, coefficients: [7.2106, -2.1069, -0.3229, 0.1117, 0.0685, 0, 0] },
  { from: 2.9, to: 23.8, coefficients: [7.5938, -3.0523, 0.40977, 0.0261, -0.01267, 0, 0] },
  { from: 23.8, to: 198.5, coefficients: [6.0536, -1.4066, 0, 0, 0, 0, 0] },
];

/** The same fit in the paper's English units: psi against Z in ft·lb⁻¹ᐟ³.
 *  Kept because it is a second printing of the same curves, and the test holds
 *  the two against each other. */
const INCIDENT_PRESSURE_PSI: readonly ScaledRange[] = [
  { from: 0.5, to: 7.25, coefficients: [6.9137, -1.4398, -0.2815, -0.1416, 0.0685, 0, 0] },
  { from: 7.25, to: 60, coefficients: [8.8035, -3.7001, 0.2709, 0.0733, -0.0127, 0, 0] },
  { from: 60, to: 500, coefficients: [5.4233, -1.4066, 0, 0, 0, 0, 0] },
];

/** The lowest scaled distance Table 1 prints an incident pressure for
 *  (m·kg⁻¹ᐟ³): about 41 MPa, closer in than any ring the product draws. */
export const KINGERY_BULMASH_MIN_SCALED = 0.2;

/** The highest scaled distance Table 1 prints an incident pressure for
 *  (m·kg⁻¹ᐟ³): about 0.25 kPa, a tenth of the lightest ring the product draws.
 *  Swisdak: the fits "should not be extrapolated beyond the ranges shown". */
export const KINGERY_BULMASH_MAX_SCALED = 198.5;

/** Kilogrammes of TNT in a kilotonne of TNT equivalent: a kilotonne is
 *  4.184 × 10¹² J by definition and TNT carries {@link TNT_SPECIFIC_ENERGY}
 *  joules to the kilogramme, so a million. */
export const TNT_KG_PER_KILOTON = 4.184e12 / TNT_SPECIFIC_ENERGY;

const PSI_PER_KPA = 0.14503773800721814;
const FOOT_PER_METRE = 3.280839895013123;
const POUND_PER_KILOGRAMME = 2.2046226218487757;

function evaluate(table: readonly ScaledRange[], scaled: number): number {
  if (!Number.isFinite(scaled)) return Number.NaN;
  const first = table[0];
  const last = table[table.length - 1];
  if (first === undefined || last === undefined) return Number.NaN;
  if (scaled < first.from || scaled > last.to) return Number.NaN;
  const band = table.find((range) => scaled <= range.to) ?? last;
  const lnZ = Math.log(scaled);
  let sum = 0;
  let power = 1;
  for (const coefficient of band.coefficients) {
    sum += coefficient * power;
    power *= lnZ;
  }
  return Math.exp(sum);
}

/**
 * Peak incident overpressure (Pa) at a scaled distance (m·kg⁻¹ᐟ³) from a
 * hemispherical TNT surface burst. NaN outside the range Table 1 prints.
 */
export function kingeryBulmashIncidentPressure(scaled: number): Pascals {
  return Pa(evaluate(INCIDENT_PRESSURE_KPA, scaled) * 1_000);
}

/**
 * The same curve as the paper prints it in English units: peak incident
 * overpressure (Pa) at a scaled distance given in ft·lb⁻¹ᐟ³. Only the test
 * reads this; the product reads the metric fit.
 */
export function kingeryBulmashIncidentPressureEnglish(scaledFtLb: number): Pascals {
  return Pa((evaluate(INCIDENT_PRESSURE_PSI, scaledFtLb) / PSI_PER_KPA) * 1_000);
}

/** The same scaled distance in the paper's English units: a range in
 *  m·kg⁻¹ᐟ³ read as ft·lb⁻¹ᐟ³. */
export function scaledMetricToEnglish(scaled: number): number {
  return (scaled * FOOT_PER_METRE) / Math.cbrt(POUND_PER_KILOGRAMME);
}

/**
 * The scaled distance (m·kg⁻¹ᐟ³) at which the incident overpressure falls to
 * `target`, by bisection on the curve above. NaN where the curve does not
 * reach that pressure inside the range Table 1 prints — closer in than
 * 0.2 m·kg⁻¹ᐟ³, or farther out than 198.5.
 *
 * The curve falls with distance over the whole range (the test walks it), so
 * the bisection has one root.
 */
export function kingeryBulmashScaledRange(target: Pascals): number {
  const wanted = target as number;
  if (!(wanted > 0)) return Number.NaN;
  let lo = KINGERY_BULMASH_MIN_SCALED;
  let hi = KINGERY_BULMASH_MAX_SCALED;
  if ((kingeryBulmashIncidentPressure(lo) as number) < wanted) return Number.NaN;
  if ((kingeryBulmashIncidentPressure(hi) as number) > wanted) return Number.NaN;
  for (let i = 0; i < 80; i++) {
    const mid = Math.sqrt(lo * hi);
    if ((kingeryBulmashIncidentPressure(mid) as number) > wanted) lo = mid;
    else hi = mid;
  }
  return Math.sqrt(lo * hi);
}

/**
 * The ratio between the ranges of two overpressures on this curve, which the
 * charge's mass cancels out of: r(target) / r(reference). NaN where either
 * pressure falls outside the range Table 1 prints.
 *
 * The casualty bands read it, to put their inner edges — 12 psi inside the
 * 5 psi ring, 2 psi inside the 1 psi ring — on the same curve that drew the
 * rings (rule 179 of validation/chemicalBlastRules.ts).
 */
export function kingeryBulmashRadiusRatio(target: Pascals, reference: Pascals): number {
  const wanted = kingeryBulmashScaledRange(target);
  const against = kingeryBulmashScaledRange(reference);
  if (!Number.isFinite(wanted) || !Number.isFinite(against) || against <= 0) return Number.NaN;
  return wanted / against;
}

/**
 * How far from a charge of `tntKilograms` on the ground the peak incident
 * overpressure falls to `target` (m). Zero where the curves do not reach that
 * pressure, which for the rings the product draws they always do.
 */
export function kingeryBulmashRange(tntKilograms: number, target: Pascals): Meters {
  if (!(tntKilograms > 0)) return m(0);
  const scaled = kingeryBulmashScaledRange(target);
  if (!Number.isFinite(scaled)) return m(0);
  return m(scaled * Math.cbrt(tntKilograms));
}
