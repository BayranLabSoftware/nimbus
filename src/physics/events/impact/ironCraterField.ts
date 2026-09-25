/**
 * The crater of an iron that breaks up in the air (B-098).
 *
 * An iron's fragments are strong and heavy, and do not spread as the pancake
 * of Collins et al. (2005) spreads a stony body: they reach the ground and dig.
 * How they dig depends on how far apart they land. Bland & Artemieva (2006,
 * "The rate of small impacts on Earth", Meteoritics & Planetary Science 41,
 * 607–631), running their separated-fragments model on irons of 1 kg to
 * 10⁸ kg at an average 18 km/s and 45 degrees, find that fragmented irons
 * under 2–3 × 10⁶ kg form multiple craters, and that above 10⁷ kg closely
 * spaced fragments form single simple craters, as Melosh (1981) had proposed;
 * between, a strewn field becomes an irregular crater and then a single one
 * as the mass grows (their Fig. 13: Henbury, Macha, Amguid and Wolfe Creek).
 * The terrestrial record agrees: of the fourteen craters under 0.3 km, nine
 * are multiple, and none of those of 0.3 to 1.5 km is.
 */

/**
 * How the crater of an iron that breaks up is drawn.
 *
 * - `cut`: a strewn field below 20 m, whatever the entry's regime, whose
 *   largest crater is 0.15 of the whole body's at its entry speed
 *   (Sikhote-Alin's calibration, B-004); from 20 m the entry's own answer,
 *   which for a complete airburst is no crater. The cut is the project's,
 *   with no source, and a crater vanishes there.
 * - `mass`: by the body's mass, after Bland & Artemieva (2006). Up to
 *   {@link IRON_FIELD_MULTIPLE_KG} a strewn field as under `cut`; from
 *   {@link IRON_FIELD_SINGLE_KG} one crater, dug by fragments that strike
 *   together — the whole body's crater at the speed the entry leaves it,
 *   whatever the pancake calls its burst; between, the craters overlap, and
 *   the largest is the geometric mean of the two, weighted by the logarithm
 *   of the mass.
 */
import type { Kilograms, Meters } from '../../units.js';

export type IronCraterField = 'cut' | 'mass';

/** What an impact that names no iron crater field uses: `mass`, since rules
 *  764 to 771 of validation/ironCraterFieldRules.ts. */
export const DEFAULT_IRON_CRATER_FIELD: IronCraterField = 'mass';

/** The density from which a body is drawn as an iron (kg/m³): the project's,
 *  with no primary source (rule 1194, A11) -- flagged, not replaced. */
export const IRON_DENSITY = 6_000;

/** Under `cut`, the diameter below which an iron that breaks up is a strewn
 *  field (m): the project's, with no source. */
export const IRON_FIELD_CUT_DIAMETER = 20;

/** Under `mass`, the mass up to which a fragmented iron forms multiple craters
 *  (kg): the upper end of Bland & Artemieva's "< 2–3 × 10⁶ kg". */
export const IRON_FIELD_MULTIPLE_KG = 3e6;

/** Under `mass`, the mass from which a fragmented iron forms one crater (kg):
 *  Bland & Artemieva's "> 10⁷ kg". */
export const IRON_FIELD_SINGLE_KG = 1e7;

/** The share of the strewn field in the crater of an iron that breaks up: 1
 *  where it is a field of separate craters, 0 where its fragments dig one.
 *  Rule 1194, item 11: `massKg`/`diameterM` branded, not plain `number`, so
 *  a caller cannot pass one unit where the other is meant. */
export function ironFieldShare(law: IronCraterField, massKg: Kilograms, diameterM: Meters): number {
  const mass = massKg as number;
  const diameter = diameterM as number;
  if (law === 'cut') return diameter < IRON_FIELD_CUT_DIAMETER ? 1 : 0;
  if (!(mass > IRON_FIELD_MULTIPLE_KG)) return 1;
  if (mass >= IRON_FIELD_SINGLE_KG) return 0;
  return (
    1 -
    Math.log(mass / IRON_FIELD_MULTIPLE_KG) /
      Math.log(IRON_FIELD_SINGLE_KG / IRON_FIELD_MULTIPLE_KG)
  );
}
