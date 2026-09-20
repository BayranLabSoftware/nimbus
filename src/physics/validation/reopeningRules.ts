/**
 * Re-opening rules 52 and 53, declared as a re-opening.
 *
 * WHAT HAPPENED, and it is mine to own. On 20 September the cell chosen
 * from the re-filtered frontier was adopted and pushed. It set
 * `pointSourceDistance` to `thompsonWorden2018`. The validation report
 * then refused to generate:
 *
 *   Rules 52 and 53 decide epicentral; the simulator draws thompsonWorden2018
 *
 * Rules 52 and 53 had already run that comparison and decided. Their
 * outcome is published in `pointSourceRules.ts`: below Mw 7.5 the
 * candidate read rule 50's maps at 1.53 on rock and 1.78 on the browser's
 * ground against 0.88 and 1.17 in place, and on the least-modelled maps
 * 0.83 and 1.16 against 0.20 and 0.55. "It is not eligible, so by rule 52
 * nothing ran on the dead and `epicentral` stays."
 *
 * The factorial of rules 488 to 494 put that factor in its grid citing
 * rule 51 — the rule that IMPLEMENTS the distance — and never noticed
 * that rules 52 and 53 had JUDGED it. It re-opened a closed question
 * without saying so, and without touching the guard that encodes the
 * verdict. The adoption was reverted; this round is the re-opening done
 * as one.
 *
 * WHAT IS ALREADY KNOWN AND CHANGES NOTHING. Rule 52 scores only the two
 * magnitude cells BELOW Mw 7.5, where every scenario is a point source
 * and no stadium is drawn — so `stadiumWidth` cannot touch its numbers,
 * and re-running it on the adopted geometry will give the same 1.53 and
 * 1.78. That is checked rather than assumed, by rule 497, but it is not
 * where an argument can live.
 *
 * WHAT THE TWO ROUNDS ACTUALLY DISAGREE ABOUT, stated before the run:
 *
 *   rule 52    rule 50's maps, rule 18's mean absolute bias per cell with
 *              its floor, BELOW Mw 7.5 only, on rock and on the browser's
 *              ground, with a guard on the least-modelled maps.
 *   the grid   rule 405's 116, the geometric mean of the area ratio, at
 *              EVERY magnitude, on the browser's ground.
 *
 *   And the published cells of rules 472 to 477 say where the candidate's
 *   gain comes from: with Thompson & Worden the area bias reads 1.49x
 *   below Mw 6.5, 0.88x from 6.5 to 7.5 and 1.27x above — against 0.56x,
 *   0.22x and 1.27x in place. It OVERSHOOTS the small earthquakes and
 *   repairs the middle. Rule 52 looks only below Mw 7.5 and weights the
 *   small cell; the grid averages over everything and is dominated by the
 *   seam the middle cell carries.
 *
 *   So the two are not contradicting each other about a fact. They are
 *   measuring different regimes with different statistics, and the honest
 *   question is which evidence should set a DEFAULT.
 *
 * THE RULES, fixed on 20 September 2026, numbered after the 494 before
 * them, and written before anything is re-measured:
 *
 *  495. This is a re-opening of rules 52 and 53 and says so. Their verdict
 *       stands until this round replaces it, and if this round does not
 *       replace it the guard in `generate-validation-report.ts` stays
 *       exactly as it is.
 *
 *  496. WHAT WOULD JUSTIFY REPLACING IT, fixed here so that it cannot be
 *       chosen after the numbers. One of two things, and nothing else:
 *
 *       (a) THE CRITERION ITSELF TURNS OVER. Rule 52's own test — its set,
 *           its statistic, its two readings, its least-modelled guard —
 *           run on the geometry now proposed, makes the candidate
 *           eligible. Then there is no conflict to resolve: rules 52 and
 *           53 simply answer differently on a different model, which is
 *           what they were always going to do.
 *
 *       (b) THE CRITERION IS SHOWN TO BE BLIND TO THE DEFECT AT ISSUE, in
 *           the way B-083 showed P-MONO-MW was. Rule 52 scores below
 *           Mw 7.5 only. If the candidate's whole value is a
 *           discontinuity AT Mw 7.5, then rule 52 cannot see that value —
 *           not because it is wrong, but because it does not look there.
 *           Showing that requires measuring the candidate's gain WITH the
 *           seam and WITHOUT it, and finding that the gain is the seam.
 *
 *       Anything else — a different set, a nicer statistic, an appeal to
 *       the grid having "more evidence" — is NOT a justification. The grid
 *       measured more; it did not measure rule 52's question.
 *
 *  497. What is measured, in one run:
 *
 *       (a) rule 52's criterion exactly as `runPointSource` computes it,
 *           with the surface projection in place, to confirm or refute
 *           the claim above that the geometry cannot touch it;
 *       (b) the candidate's area bias by magnitude cell on rule 405's
 *           116, with and without the surface projection, so that 496(b)
 *           can be answered with numbers;
 *       (c) the seam itself, P-CONT-AREA's worst step, for the same four
 *           combinations — because if the gain is the seam, the seam is
 *           where it will show.
 *
 *  498. The verdict, and it has three outcomes and not two:
 *
 *       REPLACED     496(a) or 496(b) holds. Rules 52 and 53's verdict is
 *                    replaced, the guard is updated IN THE SAME COMMIT as
 *                    the default, and the report prints both verdicts.
 *       NOT REPLACED Neither holds. `epicentral` stays, the guard stays,
 *                    and the cell chosen from the frontier CANNOT SHIP as
 *                    it is. The report says why, and the alternative on
 *                    the frontier that reaches the same end without
 *                    contradicting anybody is named.
 *       BLOCKED      The run cannot answer. Nothing moves.
 *
 *  499. One run, no re-tuning, and one more thing this round may not do:
 *       it may not widen its own question. If the answer is NOT REPLACED,
 *       the next move is a different cell of the existing frontier and not
 *       a new candidate, because the frontier was measured under rules
 *       written before it and a new candidate would not be.
 */

/**
 * THE OUTCOME, run once under rule 499: **NOT REPLACED.** Rules 52 and 53
 * keep their verdict, `epicentral` stays, the guard stays, and the cell
 * chosen from the frontier cannot ship as it is.
 *
 * RULE 496(a) — does rule 52's own test turn over on the proposed
 * geometry? NO, and it cannot. Measured directly: the MMI VII ring of a
 * point source is IDENTICAL with and without the surface projection at
 * Mw 5.2, 6.0, 6.8 and 7.4 — 1.16, 7.60, 10.53 and 14.21 km either way —
 * because below Mw 7.5 no stadium is drawn and there is nothing to
 * project. Rule 52 scores only those cells. Its numbers stand exactly as
 * published: 1.53 and 1.78 against 0.88 and 1.17.
 *
 * RULE 496(b) — is rule 52's test BLIND to the defect at issue, as
 * P-MONO-MW was? NO, and the numbers say the opposite. The area bias by
 * magnitude cell on rule 405's 116:
 *
 *   | arm                          | overall | Mw<6.5 | 6.5–7.5 | >=7.5 | worst step |
 *   | ---------------------------- | ------- | ------ | ------- | ----- | ---------- |
 *   | shipped  downDip+epicentral  | 0.393x  | 0.56x  | 0.22x   | 1.27x | x9.19      |
 *   | projection + epicentral      | 0.353x  | 0.56x  | 0.22x   | 0.73x | x4.91      |
 *   | downDip + Thompson-Worden    | 1.087x  | 1.49x  | 0.88x   | 1.27x | x2.07      |
 *   | projection + T-W (proposed)  | 0.978x  | 1.49x  | 0.88x   | 0.73x | x1.87      |
 *   | always + downDip (no T-W)    | 1.601x  | 1.84x  | 1.62x   | 1.27x | x1.41      |
 *
 *   Read the Thompson & Worden rows against the ones above them. The
 *   correction moves the two cells BELOW Mw 7.5 and leaves the one above
 *   untouched — 1.27x to 1.27x. Its entire effect is in the regime rule
 *   52 scores.
 *
 *   SO RULE 52 IS NOT BLIND TO IT. It is looking exactly where the
 *   candidate acts, and it says the candidate is worse there. And the
 *   cells say why: the correction takes the smallest earthquakes from
 *   0.56x to 1.49x — from under by 1.8 to OVER by 1.5 — while repairing
 *   the middle from 0.22x to 0.88x. Rule 52's statistic weights both
 *   cells below Mw 7.5, so the overshoot at the small end costs it
 *   eligibility, and it is right to.
 *
 *   The overall figure of 0.978x that the frontier reported is those two
 *   movements averaging out, plus the projection's separate gain above
 *   Mw 7.5. An average over three cells can hide one going the wrong way;
 *   rule 52 looks at the two it cares about and does not.
 *
 * SO BOTH DOORS RULE 496 LEFT OPEN ARE SHUT, and neither is shut by a
 * technicality. `epicentral` stays.
 *
 * RULE 498 ALSO ASKS FOR THE ALTERNATIVE, and there is exactly one. Of
 * the 26 frontier cells, five hold every property; four of those are
 * duplicates of one another and the fifth is the cell just refused. What
 * remains is a single distinct option:
 *
 *   boore2014 / extendedSource: always / downDip / style / toPeak /
 *   epicentral
 *
 *     areas   |ln bias| 0.471 against 0.935 — twice as centred
 *     peak    1.956, untouched
 *     dead    197.5 against 204.1 — better
 *     quiet   1 736 against 1 195 — worse by 45 %
 *     seam    x1.41, the smallest measured anywhere
 *
 *   It contradicts no rule's verdict that this round can find: rules 40
 *   to 44 decided `fromMw7.5` for a MARKED subduction interface and this
 *   touches only unmarked scenarios; rules 412 to 418 refused it on their
 *   own clause and rules 488 to 494 re-measured it under rules written
 *   first. Whether the repository agrees is not a matter of opinion —
 *   the report's guards will say, and they are the test.
 *
 *   It is named here and not adopted here. Rule 491 gives that choice to
 *   the owner of the project and this file does not take it.
 */

export const REOPENING_RULES = 'rules 495 to 499, fixed 20 September 2026';

/** Rule 496(a): rule 52's own bar, restated so the run can be read against
 *  it — lower by this much in BOTH readings, and no higher on the
 *  least-modelled maps. Imported from where rule 52 keeps it. */
export { CONTOUR_LAW_MARGIN as REOPENING_MARGIN } from './contourLaws.js';

/** Rule 496(b): what "the gain is the seam" means as a number. The
 *  candidate's improvement in the overall area bias, less the improvement
 *  it still has once the seam is closed by other means. If the remainder
 *  is small, the gain was the seam. */
export function gainBeyondTheSeam(input: {
  /** |ln area bias| without the candidate, seam open. */
  base: number;
  /** with the candidate, seam open. */
  withCandidate: number;
  /** without the candidate, seam closed another way. */
  seamClosed: number;
  /** with the candidate, seam closed another way. */
  both: number;
}): { total: number; beyondTheSeam: number; shareFromSeam: number } {
  const total = input.base - input.withCandidate;
  const beyondTheSeam = input.seamClosed - input.both;
  return {
    total,
    beyondTheSeam,
    shareFromSeam: total === 0 ? 0 : 1 - beyondTheSeam / total,
  };
}
