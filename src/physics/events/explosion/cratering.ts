import type { Joules, Meters } from '../../units.js';
import { joulesToMegatons, m } from '../../units.js';

/**
 * Target-ground coefficient K (metres) in the apparent-crater scaling
 *     D_a = K · W_kt^0.3
 *
 * Project estimates, with no source that gives them:
 *   HARD_ROCK    40   — granite, basalt, competent bedrock.
 *   FIRM_GROUND  60   — tuff, limestone, dense soil (default).
 *   DRY_SOIL     75   — sand, gravel, loose earth.
 *   WET_SOIL     92   — saturated alluvium, coral reef.
 *   CLAY        105   — water-saturated clay / soft muck.
 *
 * Earlier comments credited them to Murphey & Vortman (1961), a
 * "Nordyke 1977" and Young (1997); none of those was found to give
 * these numbers. Glasstone & Dolan (1977, §6.09) put the apparent
 * radius of a 1 kt surface burst in dry soil or dry soft rock at about
 * 60 ft — a diameter of 37 m, half the DRY_SOIL value and 0.6 of the
 * default — with hard rock "somewhat less" and water-saturated soil
 * appreciably more.
 */
export const NUCLEAR_CRATER_COEFFICIENT = {
  HARD_ROCK: 40,
  FIRM_GROUND: 60,
  DRY_SOIL: 75,
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
   * Target-ground coefficient K (m). Defaults to 60 (firm ground).
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
 *   - The K values are project estimates (see
 *     {@link NUCLEAR_CRATER_COEFFICIENT}).
 */
export function nuclearApparentCraterDiameter(input: NuclearCraterInput): Meters {
  const W_kt = (joulesToMegatons(input.yieldEnergy) as number) * 1000;
  const K = input.groundCoefficient ?? NUCLEAR_CRATER_COEFFICIENT.FIRM_GROUND;
  return m(K * W_kt ** 0.3);
}
