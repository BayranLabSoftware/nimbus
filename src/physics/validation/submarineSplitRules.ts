/**
 * Rules 509 to 517 — the submarine slide inside its own fitted range,
 * 20 September 2026, written and pushed before the candidate ran.
 *
 * WHERE THIS COMES FROM. Rules 500 to 508 transcribed Watts et al. 2005's
 * Eqs. (17) and (18), held them to every worked example their sources print,
 * and were REFUSED as a default: Storegga, the one recorded submarine wave
 * this project holds, lies outside the equations' own fitted range at
 * d/B = 0.018 against a required 0.06, and there Eq. (17) returns 458 m
 * against a record of 0.3 to 3.0 m at a thousand kilometres.
 *
 * RULE 509. WHAT THIS ROUND IS. The submarine regime draws Eq. (17) where the
 * scenario is inside every range the equations were fitted on, and the
 * project's prefactor where it is not, and the result says which drew the
 * number.
 *
 * Why this is not an amendment of the refused round. The threshold is not
 * chosen here and was not chosen after a figure: d/B > 0.06 is printed in
 * Enet & Grilli 2007 immediately below their Eq. (18), and rule 504 wrote it
 * into this repository BEFORE the refused round ran. What is new is the
 * decision to stop at it rather than extrapolate past it, and that decision
 * is taken here, before this round runs, with its own bars below.
 *
 * RULE 510. THE TENSION, NAMED RATHER THAN HIDDEN. The subaerial regime
 * satisfies its half of L1 the OTHER way: it draws the impulse wave manual at
 * every scenario and names the limits it is outside of, and the report counts
 * that as the manual being the relation. A split submarine branch is not the
 * same shape as its sibling, and an outside reader may fairly say that a
 * relation used only sometimes is not "the relation that makes the wave".
 *
 * Two readings of L1, and this round takes the second:
 *
 *   (a) The relation must make every wave of its regime, warning outside its
 *       ranges. This is what the subaerial branch does, and it is what the
 *       refused round did. It prints 458 m for Storegga.
 *   (b) The relation is "held ... to the ranges of the experiments it was
 *       fitted on" — L1's own words — so it makes the waves inside those
 *       ranges, the product warns outside, and what is drawn outside is
 *       declared. This is the split.
 *
 * Neither reading is obviously right and this file does not pretend
 * otherwise. What decides it for now is that (a) is measured and gives a
 * number 150 times a record, and a public instrument that prints that with a
 * footnote is not more honest than one that says which relation it used.
 * **If a reviewer reads L1 as (a), this round does not close it** and the
 * report must say so rather than claiming the rule.
 *
 * RULE 511. THE SEAM, WHICH IS THIS ROUND'S REAL RISK. A switch between two
 * relations at d/B = 0.06 makes a discontinuity, and this project has been
 * bitten by exactly that: B-083 is a tenfold jump in shaken ground across a
 * threshold that no test could see, because the shape changed underneath.
 *
 * So the seam is MEASURED, at d/B = 0.0599 and 0.0601 with every other input
 * held, and the candidate is refused if the two amplitudes differ by more
 * than a factor of two. Two is not chosen here either: it is the landslide
 * source scatter this project already declares from Tappin (2017),
 * Earth-Science Reviews 169: 73–101, cited in `events/volcano/tsunami.ts`
 * since long before this round. A seam inside the scatter the field itself
 * reports is not a discontinuity a reader can distinguish from the physics; a
 * seam outside it is a defect, and would be registered as one.
 *
 * RULE 512. THE BAR THAT REFUSED THE LAST ROUND STAYS. Storegga's recorded
 * wave, 0.3 to 3.0 m at a thousand kilometres, must be held. So must every
 * other recorded wave, and every bar green today.
 *
 * RULE 513. THE SUBAERIAL SET MAY NOT MOVE. L2 is met on 43 rows, all of them
 * a slide entering open water from above. A submarine change that moved one
 * of them reached outside what it claims, whichever way the number went.
 *
 * RULE 514. WHAT THE PRODUCT MUST SAY. For a submarine scenario the result
 * names which relation drew the wave, and — where it is the prefactor —
 * which of the fitted ranges put it there. A split that is silent about
 * itself is worse than no split, because a reader cannot tell which number
 * they are holding.
 *
 * RULE 515. THE REACH, REPORTED WHATEVER IT IS. The round measures how many
 * of the 5 000 scenarios of the landslide sweep fall inside every fitted
 * range, and prints it. If the answer is ZERO the split is cosmetic — it
 * would never once draw the field's equations — and the candidate is refused
 * for that alone, however well every other bar holds.
 *
 * RULE 516. WHAT REFUSES IT.
 *
 *   (a) A seam wider than a factor of two at d/B = 0.06 (rule 511).
 *   (b) Any recorded wave leaving its band, or any bar green today going red
 *       (rule 512).
 *   (c) Any row of L2's set moving by more than a thousandth (rule 513).
 *   (d) A submarine result that does not say which relation drew it, or does
 *       not name the range that sent it to the prefactor (rule 514).
 *   (e) A reach of zero (rule 515).
 *   (f) The sweep of G5 failing on landslides where it passes today.
 *
 * RULE 517. ONE RUN, NO RE-TUNING, AND NO THIRD SHAPE. If this candidate is
 * refused, the submarine regime keeps the prefactor and L1's submarine half
 * stays open, with both readings and both figures published. A third
 * arrangement is not invented after this one fails; it would be the round
 * after, with its own rules pushed first.
 */

/** Rule 511: the seam is read at these two relative submergences, one either
 *  side of the fitted limit, with every other input held. */
export const SEAM_PROBE_RELATIVE_SUBMERGENCE = [0.0599, 0.0601] as const;

/**
 * Rule 511: the widest seam that is not a defect — the landslide source
 * scatter Tappin (2017) reports and this project has declared since the
 * volcanic tsunami module was written.
 */
export const SEAM_LIMIT_FACTOR = 2;

/** Rule 513: a row of L2's set may not move by more than this. */
export const SUBAERIAL_ROW_TOLERANCE = 1e-3;

/** Rule 515: a reach of zero refuses the candidate on its own. */
export const MINIMUM_REACH = 1;

/** Rule 514: what a submarine result has to name. */
export type SubmarineRelation = 'predictiveEquations' | 'projectPrefactor';

export const SUBMARINE_SPLIT_RULES = 'rules 509 to 517, fixed 20 September 2026';
