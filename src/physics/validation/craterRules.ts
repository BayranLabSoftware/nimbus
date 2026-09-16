import type { BookCraterMedium } from '../effects/nuclearCrater.js';
import type { ExplosionGroundType } from '../events/explosion/simulate.js';

/**
 * The crater a burst on the ground leaves, from the numbers the book prints.
 *
 * Nimbus draws the apparent crater of a nuclear surface burst as
 * D_a = K · W_kt^0.3, with a coefficient K for each of five ground types. Two
 * of the five stand on nothing: hard rock's 29 m is "0.8 of dry soil, a
 * project value", and clay's 105 m is "a project value above wet soil, with no
 * source". A third, firm ground's 36.6 m, was read from a sentence of the book
 * (§6.09, "about 60 ft" of radius in dry soil). The book does better than that
 * sentence: because a crater's size changes so fast as the burst passes
 * through the surface, its Figures 6.72a and b print the contact-surface-burst
 * radius and depth of a 1 kt explosion in four media on the page, in words —
 * 82, 61, 58 and 49 feet of radius and 31, 28, 28 and 22 feet of depth — and
 * §6.72 scales both as W^0.3. docs/GOLD_STANDARD asks (N1) the crater within
 * 20 % of the book, and that no fit of the project's stand in where the book
 * gives a number. These rules close that clause, or say why not.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out: Figures 6.72a and b, their legends and the eight printed numbers;
 * §§6.70 to 6.72 and the worked example facing Fig. 6.72a; and the five
 * coefficients already in cratering.ts with the comments that say where each
 * came from. No row of the calibration net is scored on a nuclear crater —
 * none exists — so none was run under the candidate, and none can judge it.
 *
 * The rules, fixed on 16 September 2026, and numbered after the eighty-nine
 * before them:
 *
 *  90. The numbers. The eight the book prints, in effects/nuclearCrater.ts,
 *      with the medium each belongs to and the exponent §6.72 gives. They are
 *      read by eye from the page, not traced: a contact surface burst is the
 *      one point of each curve the book states in words. craterRules.test.ts
 *      holds the module to them, and to the exponent by the book's own
 *      arithmetic — its example divides a 270-foot depth at 20 kt by 2.46 and
 *      multiplies the answer back by the same 2.46, and 20^0.3 = 2.4622.
 *  91. The candidate. Each of the project's ground types is read as one of the
 *      book's media: hard rock as dry hard rock, firm ground and dry soil as
 *      dry soil or dry soft rock, wet soil as wet soil or wet soft rock. Clay
 *      is not one of the book's media — it has no clay — and is therefore not
 *      a candidate at all. The coefficient becomes twice the book's radius in
 *      metres, and the law and the exponent do not change.
 *  92. What decides, medium by medium. The candidate is adopted for a ground
 *      type unless a guard fails:
 *        (a) rule 90's numbers and exponent, as the test holds them;
 *        (b) the release gate stays PASS;
 *        (c) no coefficient moves by more than a factor of two, which a
 *            misread number could not pass;
 *        (d) the project's coefficient was not set on a crater somebody
 *            measured at a yield the book's figure does not cover. Wet soil's
 *            92 m was set on the craters Castle Bravo and Ivy Mike left in the
 *            Bikini reef, at 15 and 10.4 Mt; the book's figure is drawn for
 *            1 kt, and carrying it four decades up in yield is weaker evidence
 *            than a crater measured at the yield in question. So wet soil
 *            keeps its coefficient, and both numbers are printed side by side
 *            with what each makes of those two craters. Clay is left where it
 *            is by rule 91 and stays a declared project value.
 *      The order of the five — hard rock smallest, then dry soil and firm
 *      ground, then wet soil, then clay — must survive whatever is adopted;
 *      if it does not, nothing is adopted and the reason is printed.
 *  93. What is printed, and what an adoption does. For each ground type: the
 *      coefficient before and after, the medium of the book it was read as,
 *      and the crater of every explosion preset before and after. Beside,
 *      deciding nothing: the crater depth the book gives, which the product
 *      does not draw, and what the book's wet-soil number would make of the
 *      Bravo and Mike craters. An adoption moves the constants in
 *      cratering.ts, with the book's figure named beside each; the methodology
 *      page and the report say which number came from where. The rules that
 *      decided before keep their verdicts and their printed figures move, as
 *      rule 44 has it, and nothing is re-tuned (rules 5 and 6).
 *
 * What these rules cannot settle. No toll and no scored row of this project
 * depends on a nuclear crater, so this is a reading of the book against the
 * project's own constants and not of either against the ground. The book's
 * numbers are for a 1 kt explosion and are carried by W^0.3, which §6.72 calls
 * "the best empirical fit" and not a law; at megaton yields nobody has fired a
 * contact surface burst in dry soil to check it. The product's ground types
 * are coarser than the book's media — it has no separate wet hard rock, and
 * its clay is nowhere in the book — and a real site is coarser still: §6.72
 * says a change in the moisture of a soil alone moves the crater
 * significantly. And the apparent crater is not the hole a visitor imagines:
 * the true crater reaches further, and the lip further again (§6.71).
 */

/** Rule 91: which of the book's media each ground type is read as. Clay is not
 *  one of them, and is not a candidate. */
export const CRATER_MEDIUM_OF: Readonly<Partial<Record<ExplosionGroundType, BookCraterMedium>>> = {
  HARD_ROCK: 'dryHardRock',
  FIRM_GROUND: 'drySoilOrSoftRock',
  DRY_SOIL: 'drySoilOrSoftRock',
  WET_SOIL: 'wetSoilOrSoftRock',
};

/** Rule 92 (d): the ground types whose coefficient was set on a measured
 *  crater at a yield the book's figure does not cover. */
export const CRATER_SET_ON_A_MEASUREMENT: readonly ExplosionGroundType[] = ['WET_SOIL'];

/** Rule 92 (c): the most a coefficient may move and still be believed. */
export const CRATER_MOVE_FACTOR = 2;

/** Rule 90's checks on the numbers. */
export interface CraterNumberChecks {
  /** The eight printed numbers are in the module, in feet, as printed. */
  eight: boolean;
  /** The exponent is the one the book's own arithmetic gives: 20^0.3 = 2.46. */
  exponent: boolean;
  /** The book's four media keep their order, widest crater to narrowest. */
  ordered: boolean;
}

export function craterNumbersPass(checks: CraterNumberChecks): boolean {
  return checks.eight && checks.exponent && checks.ordered;
}

/** Rule 92: whether the candidate is adopted, and for which ground types. */
export function chooseCraterCoefficients(input: {
  numbers: CraterNumberChecks;
  gatePasses: boolean;
  /** The largest factor any replaced coefficient moves by. */
  worstMove: number;
  /** The five coefficients that would result keep the project's order. */
  orderSurvives: boolean;
}): { adopted: boolean; numbers: boolean; gate: boolean; move: boolean; order: boolean } {
  const numbers = craterNumbersPass(input.numbers);
  const move =
    Number.isFinite(input.worstMove) &&
    input.worstMove <= CRATER_MOVE_FACTOR &&
    input.worstMove >= 1 / CRATER_MOVE_FACTOR;
  return {
    adopted: numbers && input.gatePasses && move && input.orderSurvives,
    numbers,
    gate: input.gatePasses,
    move,
    order: input.orderSurvives,
  };
}
