/**
 * The harness counts what the product counts — the clause written correctly.
 *
 * THIS IS THE THIRD BLOCK ON ONE CHANGE, and the first thing it owes a reader
 * is why that is not "trying until it passes". The change never varies: rule
 * 11's 408 rows ask the strike lookup the calibration net already asks, so
 * that the report measures the geometry the product ships. What varied is the
 * question put to it, and each answer stands where it was given:
 *
 *   rules 342 to 348 — "do the dead get better?" REFUSED, by 0.005 of a log
 *      unit. That question has its answer and this block does not reopen it:
 *      the dead do NOT get better, and nothing here claims they do.
 *   rules 349 to 355 — "may the harness count differently from the product?"
 *      REFUSED on its own rule 351(b), which asserted that rows below Mw 7.5
 *      cannot move "since none of them is an extended source". None of the
 *      ROWS is; a good share of their REALISATIONS are, because the band
 *      draws a magnitude and some draws land above 7.5. The clause was false
 *      about the model, not strict about it.
 *
 * So this block corrects a false statement about the mechanism, and to make
 * sure that correction cannot smuggle in a loosening, IT IS STRICTLY TIGHTER
 * THAN THE BLOCK IT REPLACES. Rule 352's stop on the dead is carried over
 * unchanged at 0.10. Rule 351(a), (c) and (d) are carried over unchanged. And
 * rule 358 adds a clause the refused block did not have: no row that was
 * inside its band may fall outside it. A third attempt that asks MORE of the
 * candidate than the second is not a lowered bar.
 *
 * WHAT IS ALREADY KNOWN, and stating it is the condition for any of this
 * being worth writing. The full run was made and read, in 96e5fbc and again
 * before the refusal of 775172a:
 *
 *   Mw >= 7.5 : bias 1.98x -> 1.99x, sigma_ln 2.29 -> 2.38,
 *               inside 31/34 -> 32/34
 *   Mw 6.5-7.5: bias and scatter unchanged at 0.33x and 2.35; rows "with
 *               something" 118 -> 113; inside over all rows unchanged at
 *               190/196
 *   Mw < 6.5  : nothing moves at all
 *   below 7.5 : 0 of 350 central estimates move; 36 of the 87 rows between
 *               7.0 and 7.5 have a band that moves, all of them narrowing
 *   gate      : PASS (strict); net and presets unmoved
 *
 * No bar below is a prediction. They are the conditions under which the
 * alignment is the right thing to ship, written in the open with the numbers
 * already on the table, and rule 359 is the only one the dead can trip.
 *
 * 356. WHAT THE HARNESS IS FOR, unchanged from rule 349 and restated because
 *      it is the whole argument. The calibration harness measures the model
 *      the product runs. Where the product uses knowledge the model ships,
 *      the harness uses the same knowledge, by the same call, on the same
 *      data; where the product is ignorant, the harness is ignorant the same
 *      way. A published figure about a configuration the product cannot
 *      produce is not a validation of Nimbus, whatever its value — and today
 *      the report's 0.92x is exactly that, because `useAppStore.ts` orients a
 *      reader's rupture with `strikeAnswerAt` and `RULE_EARTHQUAKES` does not
 *      ask.
 *
 * 357. THE CHANGE, unchanged from rule 350. `RULE_EARTHQUAKES` is built
 *      through `pointingWhereTheFaultPoints`, the decorator the net already
 *      uses and the candidate committed in ef433bd before any score was read.
 *      The undecorated set is kept for the before-and-after, as
 *      `NET_WITHOUT_STRIKE_LOOKUP` is kept for rule 328, and read by nothing
 *      else.
 *
 * 358. WHAT MUST BE TRUE. Identity first, because identity is the point:
 *      (a) for every one of the 408 rows the strike counted in is the strike
 *          `chooseStrike` gives that row — same call, same tiles, same clause
 *          of rule 300 — and where it answers nothing the row keeps rule
 *          291's sweep and no north is assumed;
 *      (b) below Mw 7.5, EVERY CENTRAL ESTIMATE HOLDS, to the figure. This is
 *          what rule 351(b) should have said: a row below the threshold is a
 *          point source and its median cannot feel an orientation, so a
 *          central estimate that moved there would be a defect of the wiring
 *          and refuses the round;
 *      (c) below Mw 7.5, bands MAY move, and the reason is named rather than
 *          tolerated: a realisation draws its own magnitude, so a row at
 *          Mw 7.2 has draws above 7.5 that are extended ruptures and do feel
 *          the orientation. Two things are still required of them — the band
 *          may not move in a direction that loses a record (358(d)), and the
 *          cell's bias and scatter, which are read over central estimates,
 *          may not move at all;
 *      (d) NO ROW THAT WAS INSIDE ITS BAND MAY FALL OUTSIDE IT, in any cell.
 *          The bands below Mw 7.5 narrow by large factors, and a narrower
 *          band that drops a record it used to hold would be buying
 *          sharpness with honesty. Read over all rows, not only the rows with
 *          something, so that a row leaving cannot hide behind a change in
 *          the denominator;
 *      (e) no preset and no row of the calibration net moves at all: the net
 *          already calls the lookup, so movement there would mean the two
 *          paths disagree, which is the defect this block exists to deny;
 *      (f) the release gate stays PASS in strict mode, its audits stay clean,
 *          and `docs/VALIDATION_REPORT.md` and its JSON are regenerated and
 *          committed with the change.
 *
 * 359. WHAT THE DEAD MAY DECIDE, carried over from rule 352 at the same
 *      number and not relaxed: a STOP, nothing else. If the alignment moved
 *      |ln bias| on the Mw >= 7.5 cell by more than 0.10 — a factor of 1.11 —
 *      it is held back and the disagreement investigated, because a gap that
 *      size between two geometries means one of them is broken. Written
 *      knowing the measured drift is 0.007, and saying so: a guard rail set
 *      after seeing the road is still a guard rail.
 *
 * 360. WHAT MAY NOT HAPPEN. The verdicts of rules 346(b) and 351(b) are not
 *      reversed, re-run or re-scored. No bar here may be read as a claim that
 *      the model predicts better: it cannot, on a set this thoroughly read
 *      (rule 345), and the report must not say it does — what improves is
 *      what the report is ABOUT, not how good the model is. No strike is
 *      invented, no band widened, no row dropped for getting worse. Rule 302
 *      still stands: nothing here sets `subductionInterface` on a row the
 *      lookup calls an interface. No other set is spent: rule 23's quiet
 *      earthquakes and rule 329's E1 rows are untouched.
 *
 * 361. WHAT THE REPORT MUST SAY, in its own words. The section printing these
 *      rows states that they are counted in the footprint the shipped fault
 *      and slab tiles orient, as the globe counts a reader's earthquake, with
 *      how many rows each of the two geometries accounts for; and it states
 *      that the bands below Mw 7.5 narrowed because a realisation may exceed
 *      the extended-source threshold its row sits below. A reader must be
 *      able to tell which geometry a figure came from, and why a band moved,
 *      without opening this file.
 *
 * 362. WHAT IS PRINTED: the four cells before and after; rows answered and
 *      rows left to the sweep, by cell; every row of Mw >= 7.5 with its
 *      strike, its source, its dead before and after, and whether its band
 *      still holds its record; the count of central estimates that moved
 *      below Mw 7.5, which rule 358(b) says is zero, beside the count of
 *      bands that moved, which it says may be many; and every row that
 *      changed from inside its band to outside, which rule 358(d) says is
 *      none.
 *
 * WHAT THIS BLOCK CANNOT SETTLE, unchanged: whether the structure the lookup
 * names is the structure that would break; whether a sweep or a mapped strike
 * is the better estimator of one row, which rules 342 to 348 measured and did
 * not settle; and whether the dead this harness counts are the dead that
 * fell.
 */

/*
 * ===========================================================================
 * THE OUTCOME, 21 September 2026: REFUSED on rule 358(d)
 * ===========================================================================
 *
 * The change of rule 357 was made and run over every one of the 408 rows,
 * with the band, on both sides — `scripts/benchmark/held-out-strike.ts`,
 * `benchmark/results/held-out-strike-2026-09-21.json` — and then put back.
 *
 *   358(a) identity            : `chooseStrike`'s answer for the 358 rows
 *                                it answers, sweep for the other 50     MET
 *   358(b) central below 7.5   : 350 rows, 0 moved                      MET
 *   358(c) bands below 7.5     : 36 moved, expected and allowed          ok
 *   358(d) none left its band  : ONE DID                             NOT MET
 *   358(e) net and presets     : unmoved                                MET
 *   358(f) gate                : PASS (strict)                          MET
 *   359    drift |ln bias|     : 0.007 against a stop at 0.10   not triggered
 *
 * THE ROW. El Salvador, Gulf of Fonseca, 14 October 2014, Mw 7.3, one death
 * recorded. Counted in the sweep its band is 0 to 4 and holds that death.
 * Counted in the footprint the tiles orient, the rupture points out to sea
 * and its band is 0 to 0: in none of the two hundred realisations does
 * anybody die. The central estimate is 0 either way. So the alignment makes
 * the model, on that row, MORE CERTAIN AND WRONG — and that is the one thing
 * rule 358(d) was added to catch, written before the run by an author who
 * knew the bands would narrow and did not know which row would pay for it.
 *
 * It is refused, on one row of 408, with a record of one. Saying that plainly
 * is the point: the bar is not "the change is bad", it is "the change costs a
 * record we used to hold", and that price is now measured instead of
 * imagined. A band of [0, 0] beside a record of one is a claim that cannot be
 * right, and the project has met it before — docs/SCIENCE.md, "The rings of a
 * subduction interface", records the same shape of failure among moderate
 * interface earthquakes with a few dead.
 *
 * WHAT MAY NOT BE DONE NEXT, and it is the whole lesson of three refusals in
 * one evening. A fourth block that exempts this row, or reads 358(d) over the
 * rows with something, or replaces "no row" with "no more than one row",
 * would be the amendment rules 5, 6, 353 and 360 all forbid — and unlike
 * rules 356's correction of a false premise, it would be a LOOSENING chosen
 * after seeing which row failed. Three questions have now been put to this
 * change and answered honestly: the dead do not improve (346(b)); rows below
 * the threshold do move, through their realisations (351(b)); and aligning
 * the harness with the product costs one held record (358(d)).
 *
 * What is left is not another bar. It is the [0, 0] band itself: a predictive
 * interval that excludes a death which happened is a defect of the band, not
 * of the geometry that revealed it, and the geometry is the one the product
 * ships either way. That is a block about bands, on a set not yet spent, and
 * it is not written here.
 */

import { ALIGNMENT_STOP_LN_BIAS } from './harnessMatchesProductRules.js';

/** Rule 359's stop. Not a new number and not even a copy of one: it is rule
 *  352's own constant, re-exported, so that "carried over unchanged" is a
 *  fact about the code and not a promise in a comment. */
export { ALIGNMENT_STOP_LN_BIAS };

/** What rule 358(d) is read against: the rows inside their band today, over
 *  ALL rows of each cell, as commit 286c061's report prints them. */
export const INSIDE_BEFORE_ALIGNMENT = {
  all: { inside: 386, rows: 406 },
  belowMw65: { inside: 141, rows: 152 },
  mw65to75: { inside: 190, rows: 196 },
  fromMw75: { inside: 55, rows: 58 },
} as const;
