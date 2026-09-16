import {
  DEFAULT_RADIATION_SOURCE,
  groundRangeForDoseM,
  type RadiationSource,
} from '../../effects/initialRadiation.js';
import type { Meters } from '../../units.js';
import { m } from '../../units.js';

/**
 * Initial nuclear-radiation (gamma + neutron) lethal-dose contours.
 *
 * References:
 *   Glasstone & Dolan (1977), "The Effects of Nuclear Weapons"
 *    (3rd ed.), §8.21–§8.50 and Table 8.50.
 *   UNSCEAR 2000 Report, "Sources and Effects of Ionizing Radiation",
 *    Annex C — Dose responses for lethality.
 *   BEIR VII Phase 2 (2006), "Health Risks from Exposure to Low Levels
 *    of Ionizing Radiation", National Research Council.
 *
 * LD₅₀/60 for acute whole-body gamma exposure is about 4–4.5 Gy; LD₁₀₀
 * sits near 8 Gy. At these dose levels, the death window is 30–60 d
 * post-exposure without intensive medical support.
 *
 * Two laws are here. Under `project` the headline radii scale with
 * yield^0.18, a project fit whose anchors cite a "Fig. 8.46" that is not
 * one of the book's dose–range figures. Under `glasstone1977` they are
 * read off those figures themselves — 8.33a/b for gamma rays and 8.64a/b
 * for neutrons, summed — as `effects/initialRadiation.ts` traces them;
 * rules 85 to 89 of `validation/doseRules.ts` say which one a scenario
 * that names none draws. Atmospheric scattering and terrain shadowing are
 * ignored either way; the radii are for a flat, unshielded target.
 */

/** Reference LD₅₀/60 radius for a 1 kt burst (project fit). */
const LD50_REFERENCE_RADIUS_KT1 = 700;
/** LD₁₀₀ sits at roughly 70 % of the LD₅₀ distance. */
const LD100_TO_LD50_RATIO = 0.7;
/** Yield-scaling exponent for the initial radiation envelope.
 *
 * Phase 10 audit: re-fit against anchor points credited to a Glasstone
 * "Fig. 8.46" (not a dose–range figure; unverified).
 * The previous 0.4 over-predicted by factor 2 at 15 kt (Hiroshima
 * lit ~1.0 km, simulator was 2.07 km) and by factor 10+ at 50 Mt
 * because atmospheric attenuation makes the dose envelope grow much
 * more slowly than a square-root on yield. Anchors:
 *   1 kt   → ~0.7 km    (Glasstone Fig 8.46)
 *   15 kt  → ~1.0 km    (Hiroshima reconstruction)
 *   1 Mt   → ~2.5 km    (Glasstone scaling curve)
 * The 0.18 exponent fits all three within 15 %. */
const YIELD_EXPONENT = 0.18;

export interface RadiationDoseResult {
  /** Ground range at which the initial gamma + neutron dose reaches
   *  ≈4.5 Gy (LD₅₀/60 for unshielded adults). */
  ld50Radius: Meters;
  /** Ground range at which the initial dose reaches ≈8 Gy (LD₁₀₀). */
  ld100Radius: Meters;
  /** Ground range at which the dose drops to 1 Gy — the acute-
   *  radiation-syndrome threshold (ARS "mild" symptoms). */
  arsThresholdRadius: Meters;
}

/** The absorbed doses (rads in tissue) the three radii are drawn at: LD₁₀₀
 *  near 8 Gy, LD₅₀/60 near 4.5 Gy and the acute-radiation-syndrome threshold
 *  at 1 Gy. Project values, from UNSCEAR and BEIR VII rather than from
 *  Glasstone & Dolan, and unchanged by which law draws the range. */
export const LD100_RAD = 800;
export const LD50_RAD = 450;
export const ARS_THRESHOLD_RAD = 100;

export interface RadiationRadiiOptions {
  /** Which law draws the ranges. Omitted, {@link DEFAULT_RADIATION_SOURCE}. */
  source?: RadiationSource;
  /** Height of burst (m). The book's figures are drawn for 290·W^0.4 feet and
   *  corrected below 300 feet (§8.37, §8.65), and they give a slant range, so
   *  the ring on the ground depends on it. The project fit ignores it. */
  heightOfBurstM?: number;
}

/** Headline initial-radiation radii for a given TNT-equivalent yield
 *  (megatons). See module header for references. */
export function initialRadiationRadii(
  yieldMegatons: number,
  options: RadiationRadiiOptions = {}
): RadiationDoseResult {
  const yieldKt = yieldMegatons * 1_000;
  if (!Number.isFinite(yieldKt) || yieldKt <= 0) {
    return { ld50Radius: m(0), ld100Radius: m(0), arsThresholdRadius: m(0) };
  }
  if ((options.source ?? DEFAULT_RADIATION_SOURCE) === 'glasstone1977') {
    const h = options.heightOfBurstM ?? 0;
    return {
      ld50Radius: m(groundRangeForDoseM(LD50_RAD, yieldKt, h)),
      ld100Radius: m(groundRangeForDoseM(LD100_RAD, yieldKt, h)),
      arsThresholdRadius: m(groundRangeForDoseM(ARS_THRESHOLD_RAD, yieldKt, h)),
    };
  }
  const ld50 = LD50_REFERENCE_RADIUS_KT1 * Math.pow(yieldKt, YIELD_EXPONENT);
  const ld100 = ld50 * LD100_TO_LD50_RATIO;
  // ARS-threshold (1 Gy) sits ~1.4× the LD₅₀ distance (a project
  // ratio).
  const ars = ld50 * 1.4;
  return {
    ld50Radius: m(ld50),
    ld100Radius: m(ld100),
    arsThresholdRadius: m(ars),
  };
}
