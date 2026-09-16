import { bookCraterCoefficient } from '../../effects/nuclearCrater.js';
import type { Joules, Meters } from '../../units.js';
import { joulesToMegatons, m } from '../../units.js';

/**
 * Target-ground coefficient K (metres) in the apparent-crater scaling
 *     D_a = K · W_kt^0.3
 *
 * Three of the five are the book's own, adopted on 16 September 2026 by
 * rule 92 of validation/craterRules.ts. Glasstone & Dolan print the
 * contact-surface-burst radius of a 1 kt explosion on Figures 6.72a and b
 * themselves, because a crater's size changes too fast near the surface
 * to be read off the curve, and §6.72 scales every dimension by W^0.3:
 *
 *   DRY_SOIL     37.19 — sand, gravel, loose earth.
 *   FIRM_GROUND  37.19 — tuff, limestone, dense soil (default). Both are
 *     the book's "dry soil or dry soft rock", 61 ft of radius (Fig.
 *     6.72a, curve 2). They were 36.6, read from §6.09's "about 60 ft".
 *   HARD_ROCK    29.87 — granite, basalt, competent bedrock: the book's
 *     "dry hard rock", 49 ft (curve 4). It was 29, which was 0.8 of dry
 *     soil and a project value with no source.
 *
 * Two are not the book's, and rule 92 says why each stays:
 *
 *   WET_SOIL     92   — saturated alluvium, coral reef. The book's "wet
 *     soil or wet soft rock" is 82 ft, a coefficient of 49.99, which
 *     would put Castle Bravo's crater at 0.89 km and Ivy Mike's at 0.80.
 *     92 m puts them at 1.6 and 1.5 km, the "mile-wide" craters both left
 *     in the reef (Kunkle & Ristvet 2013, DTRIAC SR-12-001). The figure
 *     is drawn for 1 kt and these were 15 and 10.4 Mt: a curve carried
 *     four decades up in yield is weaker evidence than a crater somebody
 *     measured at the yield in question, so the measurement stays and the
 *     validation report prints both.
 *   CLAY        105   — water-saturated clay / soft muck. A project
 *     value above wet soil, with no source. The book has no clay.
 *
 * Until 14 September 2026 dry soil and firm ground were 75 and 60 and
 * hard rock 40 — twice the book's dry-soil crater, credited to papers
 * that do not give them.
 */
export const NUCLEAR_CRATER_COEFFICIENT = {
  HARD_ROCK: bookCraterCoefficient('dryHardRock'),
  FIRM_GROUND: bookCraterCoefficient('drySoilOrSoftRock'),
  DRY_SOIL: bookCraterCoefficient('drySoilOrSoftRock'),
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
 *   - K comes from Glasstone & Dolan's Figure 6.72a for dry soil, firm
 *     ground and hard rock, from the Bravo and Mike craters for
 *     saturated reef, and is a project value for clay (see
 *     {@link NUCLEAR_CRATER_COEFFICIENT}).
 */
export function nuclearApparentCraterDiameter(input: NuclearCraterInput): Meters {
  const W_kt = (joulesToMegatons(input.yieldEnergy) as number) * 1000;
  const K = input.groundCoefficient ?? NUCLEAR_CRATER_COEFFICIENT.FIRM_GROUND;
  return m(K * W_kt ** 0.3);
}
