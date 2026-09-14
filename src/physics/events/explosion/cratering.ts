import type { Joules, Meters } from '../../units.js';
import { joulesToMegatons, m } from '../../units.js';

/**
 * Target-ground coefficient K (metres) in the apparent-crater scaling
 *     D_a = K · W_kt^0.3
 *
 *   DRY_SOIL     36.6 — sand, gravel, loose earth.
 *   FIRM_GROUND  36.6 — tuff, limestone, dense soil (default).
 *     Glasstone & Dolan (1977, §6.09) put the apparent radius of a
 *     1 kt surface burst in dry soil or dry soft rock at about 60 ft,
 *     a diameter of 36.6 m, and scale every crater dimension by W^0.3.
 *   HARD_ROCK    29   — granite, basalt, competent bedrock. The book
 *     says only "somewhat less"; 0.8 of dry soil is a project value.
 *   WET_SOIL     92   — saturated alluvium, coral reef. Water-saturated
 *     soil makes an appreciably larger crater (§6.09). 92 m puts Castle
 *     Bravo (15 Mt) at 1.6 km and Ivy Mike (10.4 Mt) at 1.5 km, the
 *     "mile-wide" craters both left in the reef (Kunkle & Ristvet 2013,
 *     DTRIAC SR-12-001).
 *   CLAY        105   — water-saturated clay / soft muck. A project
 *     value above wet soil, with no source.
 *
 * Until 14 September 2026 dry soil and firm ground were 75 and 60 and
 * hard rock 40 — twice the book's dry-soil crater, credited to papers
 * that do not give them.
 */
export const NUCLEAR_CRATER_COEFFICIENT = {
  HARD_ROCK: 29,
  FIRM_GROUND: 36.6,
  DRY_SOIL: 36.6,
  WET_SOIL: 92,
  CLAY: 105,
} as const;

/**
 * Inputs for {@link nuclearApparentCraterDiameter}.
 */
export interface NuclearCraterInput {
  /** Total explosive yield (J). */
  yieldEnergy: Joules;
  /**
   * Target-ground coefficient K (m). Defaults to 36.6 (firm ground).
   * See {@link NUCLEAR_CRATER_COEFFICIENT} for named presets.
   */
  groundCoefficient?: number;
}

/**
 * Apparent (post-collapse rim-to-rim) crater diameter for a nuclear
 * contact surface burst, via Nordyke's cube-root-ish yield scaling:
 *
 *     D_a = K · W_kt^0.3            (W in kilotons TNT-equivalent)
 *
 * The exponent 0.3 is slightly less than cube-root scaling.
 *
 * Source: Glasstone & Dolan (1977), "The Effects of Nuclear Weapons"
 * (3rd ed.), U.S. DoD/DoE, §6.09 (dimensions ∝ W^0.3). Nordyke (1962),
 * "An analysis of cratering data from desert alluvium", J. Geophys.
 * Res. 67(5), 1965–1974, DOI: 10.1029/JZ067i005p01965, derived
 * W^(1/3.4) for desert alluvium.
 *
 * Caveats for popular-science display:
 *   - Surface contact burst. Airbursts at practical heights form no
 *     measurable crater; subsurface bursts (Plowshare-style) excavate
 *     much more than the apparent formula predicts.
 *   - K comes from Glasstone & Dolan for dry soil, from the Bravo and
 *     Mike craters for saturated reef, and is a project value for hard
 *     rock and clay (see {@link NUCLEAR_CRATER_COEFFICIENT}).
 */
export function nuclearApparentCraterDiameter(input: NuclearCraterInput): Meters {
  const W_kt = (joulesToMegatons(input.yieldEnergy) as number) * 1000;
  const K = input.groundCoefficient ?? NUCLEAR_CRATER_COEFFICIENT.FIRM_GROUND;
  return m(K * W_kt ** 0.3);
}
