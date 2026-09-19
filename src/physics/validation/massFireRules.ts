import { IGNITION_YIELDS_KT } from '../effects/ignitionExposure.js';

/**
 * The fire storm is smaller than the fire, from the book the project cites
 * for both.
 *
 * Nimbus draws two fire rings. The outer one is where kindling ignites, at a
 * fixed 10 cal/cm²; the inner one is where a fire storm sustains itself, at a
 * fixed 6 cal/cm². A lower threshold is a longer reach, so the inner ring is
 * the larger of the two at every scale, and between them lies a ring of ground
 * where the model says a self-sustaining fire storm burns and, at the same
 * time, that nothing has caught fire. The audit of 19 September 2026 found it
 * at every scale it looked (docs/IMPACT_AUDIT.md §2.1): an iron impactor 50 m
 * across ignites to 8.5 km and sustains to 11.0 km, Chicxulub ignites to
 * 1 303 km and sustains to 1 308 km. Both numbers are the project's own, and
 * constants.ts already says so.
 *
 * Glasstone & Dolan (1977), The Effects of Nuclear Weapons, 3rd edition, is
 * the book both constants are hung on, and it says something different from
 * either of them. Its §7.58 refuses the premise outright — "apart from a
 * description of the observed phenomena, there is as yet no generally accepted
 * definition of a fire storm", and "the conditions, e.g., weather,
 * ignition-point density, fuel density, etc., under which a fire storm may be
 * expected are not known" — and then gives four minimum requirements some
 * authorities hold to: at least 8 pounds of combustibles per square foot of
 * fire area, at least half the structures in the area on fire simultaneously,
 * a wind under 8 miles per hour, and a minimum burning area of about half a
 * square mile. None of the four is a radiant exposure.
 *
 * Its §7.71 then reads Hiroshima and gives the ordering in a sentence: the
 * inward draft of the fire storm "was a decisive factor in limiting the spread
 * of fire beyond the initial ignited area. It accounts for the fact that the
 * radius of the burned-out area was so uniform in Hiroshima and was not much
 * greater than the range in which fires started soon after the explosion."
 * The fire storm is contained by the fire, not the other way round.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out: Table 7.40 on page 289 of the public scan (DTIC ADA087568), read
 * off the page image rather than its OCR, which confuses 8 and 9 in this
 * table; §7.58, §7.62, §7.71 and §7.72 in full; the four radii the audit
 * printed; and, while the candidate was being chosen, an order-of-magnitude
 * figure for Hiroshima's mass-fire radius worked out by hand from the table
 * and the inverse-square law. No toll, no row of the calibration net and no
 * run of the simulator under the candidate was seen before these rules were
 * fixed.
 *
 * The rules, fixed on 19 September 2026, before the candidate was written, and
 * numbered after the two hundred and twenty-six before them:
 *
 * 227. The table. Table 7.40 of the 1977 edition, page 289, "Approximate
 *      radiant exposures for ignition of various materials for low air
 *      bursts", whose three columns are 35 kilotons, 1.4 megatons and
 *      20 megatons. Two of its rows are transcribed by hand into
 *      effects/ignitionExposure.ts, committed before the candidate is run on
 *      anything: "Newspaper, shredded — ignites — 4, 6, 11" from the household
 *      tinder block, and "Plywood, douglas fir — flaming during exposure —
 *      9, 16, 20" from the construction block. The table's own footnote comes
 *      with them: the exposures are good to ±25 % under standard laboratory
 *      conditions and to ±50 % in the field, "with a greater likelihood of
 *      higher rather than lower values".
 *
 * 228. The candidate. Both rings are read from the table, interpolated in the
 *      logarithm of the yield between its three columns and held flat outside
 *      them, exactly as rule 81 reads Figure 12.64 for the burns.
 *      (a) The ignition ring is the shredded newspaper: the lightest household
 *          tinder the table lists, and the material Nimbus's own constant
 *          already claimed to be — "dry newsprint / light kindling".
 *      (b) The mass-fire ring is the douglas fir plywood, the table's one
 *          structural surface whose recorded effect is flaming during the
 *          exposure itself. It stands for §7.58's second requirement, half the
 *          structures in the area on fire simultaneously, which is the only
 *          one of the four that a radiant exposure can speak to at all.
 *      (c) An explosion's fire rings are solved through the same atmosphere as
 *          its burn rings — the Beer-Lambert path of events/explosion/
 *          thermal.ts, given the height of burst — instead of the clear vacuum
 *          they used. One flash, one atmosphere, one geometry; §7.41 of the
 *          book says the range cannot be had from the exposure without it.
 *          An impact's rings keep the program's own fluence law, which is
 *          where they already are.
 *      Nothing else moves: the thermal partition, the luminous efficiency, the
 *      fireball horizon, the spherical cap, the water and altitude gates.
 *
 * 229. The gate the model did not have. §7.58's fourth requirement — a minimum
 *      burning area of about half a square mile, 1.295 km². Below it the model
 *      reports no fire storm at all: radius zero, area zero. The other three
 *      requirements Nimbus cannot evaluate, having neither a fuel map nor a
 *      wind, and they are declared assumed rather than met — together with
 *      §7.58's own sentence that nobody knows the conditions anyway.
 *
 * 230. What decides. The burnt-out area at Hiroshima. §7.62: "the total area
 *      severely damaged by fire, about 4.4 square miles" — 11.396 km², an
 *      equivalent radius of 1 904 m. The candidate's mass-fire radius must
 *      land within the band the table's own field footnote implies: a
 *      threshold uncertain by ±50 % is a radius uncertain by ×0.816 to ×1.414,
 *      so the test is |ln(R / 1 904 m)| ≤ ln 1.414.
 *      The toll decides nothing, in either direction. Hiroshima's raster
 *      counts the 1.2 million people who live there now against the 350 000
 *      who did in 1945, and rule 82 of burnRules.ts has already recorded that
 *      its toll is tuned on its own mortality.
 *
 * 231. The guard that is not negotiable. The ordering. For every yield from
 *      1 kt to 10^8 Mt, and in both families, the mass-fire radius is less
 *      than or equal to the ignition radius, and the mass-fire area to the
 *      ignition area. This is the finding itself and it is §7.71's reading of
 *      Hiroshima. A candidate that fails it is refused whatever else it does.
 *
 * 232. What is printed. For Hiroshima and for Nagasaki, and for four impact
 *      scales: the two radii and the two areas before and after, the ring the
 *      globe draws, and the toll. Beside them, deciding nothing: the same
 *      radii computed without rule 228(c)'s atmosphere, so a reader can see
 *      what the threshold did and what the transmission did; Nagasaki's own
 *      burnt area, which §7.62 puts at roughly a quarter of Hiroshima's; and
 *      §7.72's verdict that no definite fire storm occurred there. The model
 *      has no terrain and no fuel map and cannot tell a fire storm from a
 *      conflagration — which is what §7.58 says nobody can do.
 *
 * 233. What an adoption does. The two project fluences leave constants.ts and
 *      the table replaces them for both families; the entity contract, the
 *      legend and the tooltip follow the ring they describe; the report and
 *      the methodology page name Table 7.40 and §7.58. What a refusal does:
 *      rule 231 is applied anyway, because the contradiction is not a matter
 *      of calibration — the two project constants are put back in their right
 *      order, the mass fire inside the fire — and the thresholds' gap is
 *      written into the report as a gap.
 *
 * 234. What is not touched. FIRESTORM_MORTALITY, the exposed fraction, the
 *      delayed-death fraction, the population raster, the burn rings, the
 *      thermal partition, the luminous efficiency. If a toll moves, it moves
 *      and is recorded; rules 5 and 6 forbid re-tuning anything to catch it in
 *      the same round.
 *
 * What these rules cannot settle. Whether a fire storm forms at all: §7.58
 * says the conditions are not known, and three of its four requirements are
 * outside anything Nimbus holds. Whether douglas fir plywood is the right
 * stand-in for half a city's structures alight: it is a laboratory coupon
 * facing the fireball square-on, and a real structure catches through its
 * curtains and its rubbish, which §7.63 records at Hiroshima. Whether the
 * table transfers to an impact at all: its three columns stop at 20 Mt, its
 * pulse is a nuclear fireball's, and an impact's is longer by orders of
 * magnitude, so a longer pulse needs a higher exposure and the held-flat value
 * above 20 Mt understates it — which makes the impact rings an upper bound on
 * the reach, and the report must say so. And below 35 kt the same holding flat
 * runs the other way: the true exposure is lower, so the reach is a little
 * further than the model draws.
 */

/** Table 7.40's three yield columns, in kilotons — the table itself lives in
 *  effects/ignitionExposure.ts, where rule 227 put it. */
export const TABLE_740_YIELDS_KT = IGNITION_YIELDS_KT;

/** Hiroshima's severely fire-damaged area, §7.62: 4.4 square miles. */
export const HIROSHIMA_BURNT_AREA_M2 = 4.4 * 2_589_988.110336;

/** The radius of the disc of that area — 1 904 m. */
export const HIROSHIMA_BURNT_RADIUS_M = Math.sqrt(HIROSHIMA_BURNT_AREA_M2 / Math.PI);

/**
 * §7.62 gives Hiroshima's burnt area as "roughly four times as great as in
 * Nagasaki". Printed beside the result by rule 232; it decides nothing.
 */
export const NAGASAKI_BURNT_AREA_M2 = HIROSHIMA_BURNT_AREA_M2 / 4;

/** §7.58's fourth requirement: a minimum burning area of about half a square
 *  mile. Below it, rule 229 reports no fire storm. */
export const MINIMUM_BURNING_AREA_M2 = 0.5 * 2_589_988.110336;

/**
 * The band rule 230 tests in: the table's ±50 % field footnote carried through
 * the inverse-square law, where a radius goes as the inverse square root of
 * the threshold. 1/√0.5 = 1.414.
 */
export const FIELD_BAND_FACTOR = Math.SQRT2;

/** True when a modelled radius lands within rule 230's band of the record. */
export function withinFieldBand(modelledM: number, recordedM: number): boolean {
  if (!(modelledM > 0) || !(recordedM > 0)) return false;
  return Math.abs(Math.log(modelledM / recordedM)) <= Math.log(FIELD_BAND_FACTOR);
}

/** The guards of rule 231, named so a test can fail on the name. */
export const MASS_FIRE_GUARDS = {
  /** Rule 231: the mass fire never reaches past the fire that feeds it. */
  orderedAtEveryYield: true,
  /** The yields rule 231 is checked over, in joules. */
  yieldSweepJoules: { lowest: 4.184e12, highest: 4.184e23 },
  /** Rule 229's gate, in square metres. */
  minimumBurningAreaM2: MINIMUM_BURNING_AREA_M2,
} as const;

/**
 * The outcome of the round, written after the candidate was measured, on
 * 19 September 2026. The rules above were pushed in commit 6fdf58b before the
 * candidate existed.
 *
 * ADOPTED. Rule 230 is met and rule 231 holds.
 *
 * Rule 230. Hiroshima, 15 kt at 580 m, draws its mass fire at 2.02 km against
 * the 1.90 km of §7.62's 4.4 square miles: 1.062×, inside the band whichever
 * way the band is read — the symmetric one the rule states in its last clause
 * (×0.707 to ×1.414) and the narrower one its prose derives (×0.816 to
 * ×1.414). Before the round the same scenario put the mass fire at 2.64 km,
 * 1.39× the ground that burned, and the fire that fed it at 2.04 km, inside
 * it. Without rule 228(c)'s atmosphere the mass fire reads 2.15 km, so the
 * threshold did most of the work and the transmission the rest.
 *
 * Rule 231. Checked over seven yields from 1 kt to 1 000 Mt and four impact
 * scales from an iron 50 m to a Chicxulub: the mass fire is inside the fire
 * everywhere, in both families, by construction — Table 7.40 asks more of
 * plywood than of newspaper in all three of its columns — and again by the
 * explicit floor the two simulators apply.
 *
 * Rule 229. The gate bites where nothing else in the model does: below about
 * 2 kt the burning ground falls under half a square mile and the model reports
 * no fire storm at all. A 1 kt device ignites to 0.81 km and sustains nothing.
 *
 * Rule 232, and deciding nothing. Nagasaki draws 2.37 km where a quarter of
 * Hiroshima's burnt ground is 0.95 km — 2.48× — and §7.72 records that no
 * definite fire storm occurred there at all: the wind carried the fire up a
 * valley with nothing to burn, and the narrow valley held too few dwellings to
 * feed one. Both are conditions this model does not hold. It has no terrain
 * and no fuel map, and it will draw a fire storm over Nagasaki every time.
 * That is the honest shape of the gap, and §7.58 says the field has it too.
 *
 * The ignition ring reads 2.95 km at Hiroshima, 1.55× the ground that burned.
 * §7.71 says the burnt-out radius "was not much greater than the range in
 * which fires started", which this does not contradict: the table's exposures
 * are laboratory coupons facing the fireball square-on, and a city's kindling
 * is behind walls. The table's own footnote leans the same way — the field
 * needs more heat than the laboratory, "with a greater likelihood of higher
 * rather than lower values" — so the ignition ring is the outer bound of where
 * anything at all could catch, not the edge of the fire.
 *
 * What it cost, recorded and not caught (rule 234). Hiroshima's toll falls
 * from 109 102 to 93 466 against a record of 105 000, and its band from
 * 87 236 – 149 129 to 77 893 – 119 850, which still contains the record. The
 * ratio crosses from 1.04× to 0.89×, and the row's caveat expects an
 * overshoot: the raster counts the 1.2 million who live in Hiroshima now
 * against the 350 000 who were there in 1945. So the model now undershoots a
 * record it should overshoot, which says its mortality per head inside the
 * fire is too low by roughly the same factor it was too high before. Nothing
 * was re-tuned to catch it: FIRESTORM_MORTALITY, the exposed fraction and the
 * delayed-death fraction are exactly where they were, and this is the next
 * thing to look at, not a thing this round may touch.
 */
export const MASS_FIRE_OUTCOME =
  'ADOPTED 19 September 2026: Table 7.40 replaces both project fluences, the mass fire is inside the fire in both families, §7.58 gates it at half a square mile, and Hiroshima draws 2.02 km against 1.90 km of burnt ground (1.06×).';
