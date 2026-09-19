/**
 * The harness counts what the product counts.
 *
 * WHY THIS BLOCK EXISTS, and it is not because the first one failed. Rules
 * 342 to 348 asked whether pointing rule 11's footprints at the structures
 * the model can name makes the dead come out better. It failed that bar by
 * five thousandths of a log unit and was refused, and the refusal stands in
 * `heldOutStrikeRules.ts` where it happened.
 *
 * The bar was the wrong question, and saying so is not a way of reversing a
 * verdict — the verdict is left exactly where it is. It is that "do the dead
 * get better" is a question about a PROPOSED IMPROVEMENT, and this is not
 * one. The globe already counts a reader's earthquake in the footprint the
 * lookup orients: `useAppStore.ts` calls `strikeAnswerAt` and sets the strike
 * whenever the tiles answer. The harness, on the 408 rows the validation
 * report scores, does not ask. So the two count differently, and the bias the
 * report publishes — 0.92x over all sizes since 286c061 — is a statement
 * about a geometry Nimbus does not ship.
 *
 * That is a defect whatever the dead do. A validation report is a claim about
 * the model a reader can run, and ours is measured on a model nobody can run.
 *
 * And it is one missing call and nothing else. Both sides read the SAME
 * shipped tiles — `shippedFaults.ts` reads `public/data/faults/`, which is
 * what the browser fetches — and both reach the SAME function,
 * `chooseStrike` of `strikeSource.ts`. `shippedFaults.ts` even says so in its
 * own header: "Rule 322 says the three call sites must have ONE answer behind
 * them. This is that answer on the Node side." The answer is there. Rule 11's
 * rows never ask it.
 *
 * WHAT IS ALREADY KNOWN, stated at the top because pretending otherwise would
 * make this block worthless. The cost of aligning them has ALREADY BEEN
 * MEASURED and published, in 96e5fbc, on this very set:
 *
 *   bias 1.98x -> 1.99x, |ln bias| 0.681 -> 0.688, sigma_ln 2.29 -> 2.38,
 *   inside 31/34 -> 32/34, and 0 of 350 rows below Mw 7.5 move.
 *
 * So no bar written here is a prediction, and this block may not pretend to
 * be a blind measurement. What it is instead is a decision about what the
 * harness is FOR, taken with the price list in hand and in the open. Rule 352
 * says which part of that is allowed to decide anything.
 *
 * WHAT WAS LOOKED AT: everything in `heldOutStrikeRules.ts`, including its
 * full run, plus the two call sites read on 21 September 2026
 * (`useAppStore.ts` line 3025, `shippedFaults.ts`) and that they share their
 * data and their code.
 *
 * 349. WHAT THE HARNESS IS FOR. The calibration harness measures the model
 *      the product runs. Where the product uses knowledge the model ships,
 *      the harness uses the same knowledge, by the same call, on the same
 *      data; where the product is ignorant, the harness is ignorant in the
 *      same way. A figure the report publishes about a configuration the
 *      product cannot produce is not a validation of Nimbus, whatever its
 *      value.
 *
 * 350. THE CHANGE. `RULE_EARTHQUAKES` is built through
 *      `pointingWhereTheFaultPoints`, the decorator the calibration net
 *      already uses — the candidate of rule 344, committed in ef433bd before
 *      any score was read, and unchanged since. The set counted without it is
 *      kept under a name of its own for the before-and-after, exactly as
 *      `NET_WITHOUT_STRIKE_LOOKUP` is kept for rule 328, and is read by
 *      nothing else.
 *
 * 351. WHAT MUST BE TRUE, and these are the clauses that decide. They are
 *      about identity, not about quality, because identity is the point:
 *      (a) for every one of the 408 rows, the strike the harness counts in is
 *          the strike `chooseStrike` gives for that row's epicentre,
 *          hypocentral depth and rupture length — the same call, the same
 *          tiles, the same clause of rule 300 — and where it answers nothing,
 *          the row keeps rule 291's sweep and no north is assumed;
 *      (b) the rows below Mw 7.5 do not move by one figure, since none of
 *          them is an extended source;
 *      (c) no preset and no row of the calibration net moves at all: the net
 *          already calls the lookup, so movement there would mean the two
 *          paths disagree, which is the defect this block exists to deny;
 *      (d) the release gate stays PASS in strict mode, its audits stay clean,
 *          and `docs/VALIDATION_REPORT.md` and its JSON are regenerated and
 *          committed with the change — they WILL move, and a report that did
 *          not move would mean the harness never asked.
 *
 * 352. WHAT THE DEAD ARE ALLOWED TO DECIDE, which is not whether this is
 *      done. They are reported in full, before and after, cell by cell and
 *      row by row. They decide one thing only: a STOP. If aligning the
 *      harness with the product moved |ln bias| on the Mw >= 7.5 cell by more
 *      than 0.10 — a factor of 1.11 on the bias — the change is held back and
 *      the disagreement is investigated instead of shipped, because a gap
 *      that size between two geometries means one of them is broken and we
 *      do not yet know which.
 *
 *      This number is written knowing the measured cost is 0.007, and saying
 *      so is the point: it is a guard rail and not a hurdle, it is fourteen
 *      times the distance actually travelled, and it exists so that
 *      "consistency" can never be the reason a large regression is waved
 *      through. A guard rail set after seeing the road is still a guard rail;
 *      a HURDLE set after seeing the jump would be a fraud, and rule 353
 *      forbids that one.
 *
 * 353. WHAT MAY NOT HAPPEN. Rule 346(b)'s verdict is not reversed, re-run or
 *      re-scored: rules 342 to 348 asked their question, got their answer,
 *      and keep it. No bar in this block may be turned into a claim that the
 *      model predicts better — it cannot, on a set this thoroughly read (rule
 *      345), and the report must not say it does. No strike is invented, no
 *      band widened, no row dropped for getting worse, and rule 302 still
 *      stands: nothing here sets `subductionInterface` on a row the lookup
 *      calls an interface. And no other set is spent: rule 23's quiet
 *      earthquakes and rule 329's E1 rows are not touched.
 *
 * 354. WHAT THE REPORT MUST SAY, in its own words and not only here. The
 *      section that prints these rows says that they are counted in the
 *      footprint the shipped fault and slab tiles orient, as the globe counts
 *      them, and that the rows the tiles cannot answer are counted in rule
 *      291's sweep, with how many of each. A reader must be able to tell
 *      which of the two a figure came from without reading this file.
 *
 * 355. WHAT IS PRINTED: the four-cell table before and after; the count of
 *      rows the lookup answers and of rows left to the sweep, by cell; every
 *      row of Mw >= 7.5 with its strike, its source, its dead before and
 *      after and whether its band still holds its record; the rows below
 *      Mw 7.5 that moved, which rule 351(b) says is none; and the net's rows,
 *      which rule 351(c) says are unmoved.
 *
 * WHAT THIS BLOCK CANNOT SETTLE. Whether the structure the lookup names is
 * the structure that would break — there is no published strike for these
 * rows to check against, which is why rule 351 asks for identity and not for
 * correctness. Whether a sweep or a mapped strike is the better estimator of
 * a single row: rules 342 to 348 measured that they disagree row by row and
 * agree on the median, and neither is thereby right. And whether the dead
 * this harness counts are the dead that fell, which no wiring decides.
 */

/*
 * ===========================================================================
 * THE OUTCOME, 21 September 2026: REFUSED on rule 351(b)
 * ===========================================================================
 *
 * The change of rule 350 was made, the report regenerated and the whole of it
 * read. Then it was put back, because a clause of rule 351 is not true.
 *
 *   351(a) identity        : the strike counted in is `chooseStrike`'s, for
 *                            all 358 rows it answers; 50 keep the sweep  MET
 *   351(c) net and presets : unmoved                                     MET
 *   351(d) gate            : PASS (strict)                               MET
 *   352  drift |ln bias|   : 0.007 against a stop at 0.10        not triggered
 *   Mw >= 7.5              : bias 1.98x -> 1.99x, inside 31/34 -> 32/34
 *   351(b) below Mw 7.5    : the Mw 6.5-7.5 cell MOVED               NOT MET
 *
 * WHAT MOVED, AND WHY THE CLAUSE WAS WRONG. Rule 351(b) said the rows below
 * Mw 7.5 could not move "since none of them is an extended source". None of
 * the ROWS is. Their REALISATIONS are: the band draws a magnitude from the
 * published scatter, and for a row at Mw 7.2 a good share of the two hundred
 * draws land above 7.5, become extended ruptures, and are counted in a
 * footprint an orientation can turn. The central estimate cannot move and
 * does not — 0 of 350 rows, measured — but the band can, and does.
 *
 * On the 87 rows between Mw 7.0 and 7.5, THIRTY-SIX have a band that moves
 * and none has a central estimate that moves. They narrow, sharply, because
 * the high tail was made of extended realisations pointing wherever the
 * sweep put them:
 *
 *   | row                   |  Mw | central   | band before      | band after   |
 *   |-----------------------|----:|-----------|------------------|--------------|
 *   | Iran: Kermanshah 2017 | 7.3 | 197 -> 197| 110 – 359 017    | 1 – 48 914   |
 *   | Haiti 2021            | 7.2 |7941 ->7941| 640 – 1 187 327  | 23 – 505 897 |
 *   | Nepal: Dolakha 2015   | 7.3 |  46 -> 46 | 12 – 168 408     | 0 – 27 847   |
 *
 * In the report's own cells that reads as the Mw 6.5-7.5 rows "with
 * something" falling from 118 to 113 — five rows whose band no longer clears
 * zero — with bias and scatter unchanged at 0.33x and 2.35.
 *
 * SO IT IS REFUSED, and the refusal is honest rather than convenient: the
 * clause that failed is a clause this file wrote, on a premise about the
 * model that turned out to be false. That is a reason to write a better
 * clause in a new block, and it is not a reason to declare this one
 * satisfied. Rules 5, 6 and 353 do not have an exception for a bar its own
 * author now regrets, and a protocol that bends for its author is not a
 * protocol. Rules 342 to 348 were refused two hours earlier for five
 * thousandths of a log unit; this one is refused for the same reason, which
 * is that the rule said so.
 *
 * WHAT IS CARRIED FORWARD, and what may not be. Rules 356 onward may write
 * the clause correctly — central estimates below Mw 7.5 hold, bands may move
 * and the reason is named — because that is the correction of a false
 * statement about the mechanism and not the loosening of a criterion. What
 * may NOT be carried forward is the bar on the dead: rule 352's stop of 0.10
 * stays exactly where it is, and rule 351(a), (c) and (d) stay as they are.
 * The measured cost stays what it was measured to be.
 */

/** Rule 352's stop: how far |ln bias| on the Mw >= 7.5 cell may move before
 *  the alignment is held back and the disagreement investigated. Fourteen
 *  times the cost measured in 96e5fbc, and declared as a guard rail. */
export const ALIGNMENT_STOP_LN_BIAS = 0.1;

/** The cell rule 352 watches, as commit 286c061's report printed it. */
export const MW75_BEFORE_ALIGNMENT = {
  bias: 1.98,
  absLnBias: 0.681,
  scatterLn: 2.29,
  inside: 31,
  withSomething: 34,
} as const;
