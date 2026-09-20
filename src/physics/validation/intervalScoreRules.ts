/**
 * A clause that can fail for the right reason: the interval score.
 *
 * THIS ROUND IS WRITTEN KNOWING HOW THE LAST THREE FELL, and says so at
 * the top, as rule 398 did, because a reader is entitled to weigh that.
 * What follows is the argument for why it is not an amendment dressed up.
 *
 * THE DEFECT, demonstrated twice and not argued:
 *
 *   1. A clause that cannot fail. Rules 435 to 439 measured the predictive
 *      bands of 805 quiet earthquakes: median log width 3.69, a factor of
 *      forty between the ends, and Haiti's runs 42 to 271 621. Rule 19 and
 *      rule 443(b) both decide by asking whether a record falls inside
 *      such a band. Almost anything does.
 *
 *   2. A clause that fails for the wrong reason. Rules 440 to 447 refused
 *      arm D on Sumatra–Andaman 2004. The model misses that earthquake by
 *      a factor of fifty-three — 4 263 dead against 227 898 — and was
 *      counted as containing it because a band spanning a factor of 2 400
 *      reached past it. Arm D moved the toll 13 % towards the record and
 *      the high end fell just under it, so the row was "lost".
 *
 *   Coverage alone rewards a model for being vague and punishes it for
 *   being slightly less vague. That is not a property of these two rounds;
 *   it is a property of coverage.
 *
 * WHAT MAKES THIS NOT AN AMENDMENT. Three things, and they are checkable
 * rather than rhetorical:
 *
 *   - The score is not invented here. It is the INTERVAL SCORE of Gneiting
 *     & Raftery (2007), "Strictly Proper Scoring Rules, Prediction, and
 *     Estimation", JASA 102(477), 359–378, equation 43 — the standard
 *     scoring rule for a central prediction interval, used across
 *     forecasting.
 *   - Its central property is a THEOREM, not a measurement. It is strictly
 *     proper: no forecaster improves their expected score by reporting an
 *     interval other than their honest one, and in particular widening an
 *     interval can never improve it. That is exactly defect (1), closed by
 *     construction and not by a bound anybody chose.
 *   - Its one parameter is already fixed. The score takes the interval's
 *     own nominal level; these bands are 5 % to 95 %, so alpha is 0.10 and
 *     there is nothing to pick.
 *
 *   What is chosen here, and is a choice: that the score is taken on
 *   ln(deaths + 1) rather than on deaths. Tolls span seven orders of
 *   magnitude and every comparison in this project is already in logs;
 *   the plus one is what lets a record of zero, which most of these are,
 *   have a place on the axis at all.
 *
 * The rules, fixed on 20 September 2026, numbered after the 447 before
 * them:
 *
 *  448. The score. For a predictive interval [l, u] at nominal level
 *       1 − alpha and an observation y, all three in ln(deaths + 1):
 *
 *         S = (u − l)
 *             + (2 / alpha) · (l − y)  where y < l
 *             + (2 / alpha) · (y − u)  where y > u
 *
 *       Lower is better. A band that contains the record scores its own
 *       width; one that misses pays the width plus twenty times how far it
 *       missed by, in logs. alpha is 0.10, which is what these bands are.
 *
 *  449. What it replaces, and what it does not. It becomes the measure of
 *       rule 443(b) and of any clause that until now asked only whether a
 *       record fell inside a band. Coverage is NOT discarded: it is
 *       reported beside the score, with the median width, so that a reader
 *       can see which of the two moved. No clause about the MAP changes —
 *       rule 424's six stay exactly as they are.
 *
 *  450. Property tests before any arm is scored, and the round stops if
 *       one fails. The score must, on constructed cases and not on
 *       candidates:
 *
 *       (a) never improve when an interval is widened about a record it
 *           already contains — the theorem, checked;
 *       (b) prefer a narrow interval that contains to a wide one that
 *           contains;
 *       (c) prefer a band that misses by a little to one that misses by a
 *           lot, at equal width;
 *       (d) prefer containing to missing, at equal width;
 *       (e) reduce exactly to the width where the record is inside.
 *
 *  451. The verdict. The four arms of rule 442 — what ships, the geometry,
 *       the top band, and both — are re-scored on the net rows and on rule
 *       23's 805 quiet earthquakes, in one run, with the sum of the score
 *       over the rows as the figure. An arm displaces what ships only if
 *       BOTH hold:
 *
 *       (a) its total score is lower on the net rows AND on the quiet
 *           earthquakes — not one bought with the other;
 *       (b) it passes rule 424's six map clauses, which are untouched.
 *
 *  452. And the old clause is printed beside the new one, for every arm.
 *       If the two disagree — if an arm that rule 443(b) refused wins on
 *       the score, or the reverse — that disagreement is the finding and
 *       is published as such. It is the whole reason this round exists and
 *       it is not allowed to be quietly absorbed.
 *
 *  453. One run, no re-tuning. The score, its alpha, its transform and the
 *       arms are fixed here. Nothing is adjusted after a number is seen,
 *       and if no arm wins, what ships stays.
 *
 *  454. What this round may not do. It may not change what the model
 *       computes: no geometry, no curve, no band, no population. It
 *       changes how the answers are judged, and a round that changed both
 *       at once would be unreadable.
 */

/**
 * THE OUTCOME, run once on 20 September 2026 under rule 453 and published
 * as it came out: no arm passes rule 451, what ships stays — and rule 452
 * has its disagreement.
 *
 * THE DEAD, on the net rows. Lower is better:
 *
 *   | arm        | score | the old clause                              |
 *   | ---------- | ----- | ------------------------------------------- |
 *   | in place   | 204.1 | 13/13, nothing lost                  PASS   |
 *   | C geometry | 208.2 | lost Pohang, gained Amatrice         FAIL   |
 *   | D top band | 212.6 | lost Sumatra–Andaman                 FAIL   |
 *   | E both     | **201.6** | lost Sumatra, gained Amatrice    FAIL   |
 *
 * RULE 452'S FINDING: the two clauses disagree about arm E, and it is the
 * arm the last round called the proposal. Membership refused it for
 * losing one row. The score says it is the BEST of the four on these
 * eighteen earthquakes — better than what ships. Row by row:
 *
 *   Sumatra–Andaman 2004   in place  7.8   E  10.6   (E worse by 2.8)
 *   Pohang 2017            in place 10.5   E  11.1   (E worse by 0.6)
 *   Amatrice 2016          in place 10.3   E   6.4   (E better by 3.9)
 *
 *   The row E loses is paid for by the row it gains, with change to
 *   spare. Membership could not see that, because membership counts rows
 *   and not distances: Amatrice moving from a band that missed 299 dead to
 *   one that holds them is worth one row to it, exactly as Sumatra's high
 *   end slipping under a record the model misses by fifty-three times
 *   costs one row.
 *
 *   And the score is not being kind to arm C. It agrees with membership
 *   there, and says why: Pohang alone costs C 24.5 against the 10.5 it
 *   costs the law in place, because a band that cannot reach a record of
 *   zero is penalised twenty times over per natural log of the miss.
 *
 * THE QUIET, on 805 earthquakes. Lower is better:
 *
 *   | arm        | score    | toll >= 10 | reaches zero | median width |
 *   | ---------- | -------- | ---------- | ------------ | ------------ |
 *   | in place   | 1195     | 23         | 799          | 3.69         |
 *   | C geometry | 1889     | 51         | 784          | 4.43         |
 *   | D top band | **1117** | **18**     | **801**      | **3.58**     |
 *   | E both     | 1644     | 36         | 794          | 4.31         |
 *
 * AND THE SCORE DOES NOT RESCUE THE GEOMETRY, which is the thing to check
 * when a project writes its own new measure knowing which candidate it
 * would like to see pass. On the quiet earthquakes the new score agrees
 * with the old count and by a wider margin: C is 1889 against 1195, E is
 * 1644. The geometry's cost there is real under both measures. A clause
 * built to let a favourite through would not have done that.
 *
 * SO NOBODY PASSES. Rule 451(a) asks for a lower score on the net rows AND
 * on the quiet, "not one bought with the other", and each arm buys one
 * with the other:
 *
 *   C   net worse,  quiet worse
 *   D   net worse,  quiet BETTER
 *   E   net BETTER, quiet worse
 *
 * WHAT THIS ROUND LEAVES, and it is narrower than what it found:
 *
 *   1. The clause is fixed, and it fails for reasons that survive reading.
 *      Rule 443(b) refused arm E for one row in eighteen; the score says
 *      that row was paid for. Rule 443(b) refused arm D for a 13 % move
 *      towards a record; the score agrees D is worse on the net, but says
 *      so with a number — 212.6 against 204.1 — that can be argued with
 *      instead of a yes or no.
 *
 *   2. The split is now clean and it is not about the clause. Everything
 *      that improves the MAP and the NET rows makes the QUIET set worse,
 *      under either measure. That is one tension, in one place, and it is
 *      the last one standing between a measurably correct footprint and
 *      the product.
 *
 *   3. Where it must be looked for, as rule 447 already listed and this
 *      round may not touch: the vulnerability table, the population
 *      raster, the country assignment. The quiet earthquakes are moderate
 *      events over populated ground in countries that borrow another
 *      country's curve. That is the shape of the remaining error, and it
 *      is a round with its own rules.
 */

export const INTERVAL_SCORE_RULES = 'rules 448 to 453, fixed 20 September 2026';

/** Rule 448: these bands are the 5th to 95th percentile, so alpha is the
 *  0.10 they leave outside. Not a choice — a property of the band. */
export const INTERVAL_ALPHA = 0.1;

/** Rule 448's transform: tolls span orders of magnitude and most of these
 *  records are zero, which only has a place on a log axis with the one. */
export function tollAxis(deaths: number): number {
  return Math.log(Math.max(0, deaths) + 1);
}

/**
 * Rule 448: the interval score of Gneiting & Raftery (2007), equation 43,
 * on the toll axis. Lower is better.
 *
 * Read from the paper's definition; the implementation is this file's own.
 */
export function intervalScore(
  low: number,
  high: number,
  record: number,
  alpha: number = INTERVAL_ALPHA
): number {
  const l = tollAxis(low);
  const u = tollAxis(high);
  const y = tollAxis(record);
  const width = Math.max(0, u - l);
  const below = y < l ? (2 / alpha) * (l - y) : 0;
  const above = y > u ? (2 / alpha) * (y - u) : 0;
  return width + below + above;
}
