/**
 * Every correction this project has measured, together, once.
 *
 * WHAT THE LAST ROUND'S CLOSING LINE GOT WRONG, corrected here because it
 * was this file's own premise. It said the remaining obstacle was "six
 * earthquakes and a band width". Measured before these rules were
 * written, on the 805 quiet earthquakes under CB14 + the geometry of
 * rules 427 to 434 against what ships:
 *
 *   360 events score WORSE, 428 unchanged, 17 better
 *   the twenty worst carry only 40 % of the change
 *   the loud count moves 23 -> 29 as ELEVEN newly loud and FIVE no longer
 *
 * It is not six earthquakes and it is not a handful. It is broad.
 *
 * AND IT IS ONE MECHANISM, which the same measurement shows in a single
 * row. `us2000k7vu`, Santa Elena in Ecuador, scores 8.5 and then 48.1 —
 * while the HIGH end of its band barely moves, 4 932 to 5 122. The
 * interval score is width plus twenty times the miss per natural log, and
 * a record of zero can only be missed from below. That event's band
 * simply stopped reaching zero.
 *
 * Across the set: 799 of 805 bands reach zero under the shipped law and
 * 776 under CB14 + geometry. Twenty-three earthquakes that killed nobody
 * lost the model's ability to say "possibly nobody", and each costs about
 * thirty points of a total change of 1 085. THE PENALTY IS NOT WIDTH. IT
 * IS POHANG, TWENTY-THREE TIMES.
 *
 * AND THE CURE IS ALREADY MEASURED. Rules 440 to 447 bounded the topmost
 * casualty band by the intensity the scenario actually reaches — it had
 * been charged a flat 8.5 by events peaking at 8.15 — and that change
 * ALONE moved the quiet set the right way on all three of its figures:
 * the loud count from 23 to 18, the bands reaching zero from 799 to 801,
 * the median width from 3.69 to 3.58. It was refused for losing
 * Sumatra-Andaman by thirteen per cent of a toll the model misses by a
 * factor of fifty-three.
 *
 * SO THE CANDIDATE IS THE UNION, and it has never been run. Every round
 * since 405 has moved one piece, faithfully, and the pieces were
 * measured against a model still carrying the others:
 *
 *   the law        CB14, which carries the depth to the epicentre
 *                  (rules 384 to 404, 459 to 471)
 *   the geometry   the surface projection, the stadium at every magnitude,
 *                  the dip of the structure the strike came from
 *                  (rules 412 to 434)
 *   the band       the topmost band bounded by the peak
 *                  (rules 440 to 447)
 *
 * Arm E of rule 442 was the geometry and the band WITHOUT the law. This
 * is the same with the law, and the law is what cools the peak from +1.96
 * to +1.06 — which rules 478 to 482 measured as worth about three
 * quarters of what the rings cost.
 *
 * The rules, fixed on 20 September 2026, numbered after the 482 before
 * them:
 *
 *  483. The candidate: `campbellBozorgnia2014`, `stadiumWidth:
 *       'surfaceProjection'`, `extendedSource: 'always'`, the dip from
 *       `shippedDipAnswer`, and `topBand: 'toPeak'`. Nothing that has not
 *       already been built, justified and measured under its own rules.
 *
 *  484. No attribution is claimed. This moves four things and cannot say
 *       which did what; the rounds that isolated each are cited. It
 *       answers one question — whether the union is better than what
 *       ships — and rule 486 is what "better" means.
 *
 *  485. The sets, ALL FOUR, which is rule 476's fault not repeated:
 *
 *       (a) the peak, on rule 465's 1 100;
 *       (b) the areas, on rule 405's 116, by rule 424's cells;
 *       (c) the dead, on the net rows, by rule 448's interval score and
 *           by membership;
 *       (d) the quiet, on rule 23's 805, by the score, the loud count and
 *           the count whose band still reaches zero.
 *
 *  486. The verdict. The union displaces what ships only if ALL hold:
 *
 *       (a) the peak's mean bias closer to zero by `PEAK_MARGIN_MMI` and
 *           no wider a spread;
 *       (b) no area cell worse by more than `PEAK_AREA_MARGIN`, and the
 *           overall bias no further from 1;
 *       (c) the net rows' interval score no higher;
 *       (d) the quiet's interval score no higher AND the loud count no
 *           higher AND no fewer bands reaching zero.
 *
 *       Four clauses, one of which has refused everything this project has
 *       tried. If the union fails, what ships stays and these rounds will
 *       have produced a complete, measured description of a model that
 *       cannot be improved one piece at a time — which is worth writing
 *       down even so.
 *
 *  487. One run, no re-tuning.
 */

/**
 * THE OUTCOME, run once on 20 September 2026 under rule 487: REFUSED on
 * the two toll clauses — and it is the closest anything has come, with
 * one figure beaten for the first time.
 *
 *   (a) the peak, 1 100    ships +1.96, 16 %      union **+1.06, 48 %**   PASS
 *   (b) the areas, 116     ships 0.393x           union **1.376x**        PASS
 *                          cells 0.56 / 0.22 / 1.27  →  1.62 / 1.36 / 1.16
 *   (c) the dead, net      ships 204.1            union 232.4             FAIL
 *   (d) the quiet, 805     ships 1195             union 1847              FAIL
 *                          toll >= 10:  23        union **22**
 *                          reaches zero: 799      union 791
 *
 * WHAT THE TOP BAND WAS WORTH, which is why this round was run. Against
 * CB14 + geometry without it, measured in rules 478 to 482:
 *
 *   quiet score     2280  ->  1847
 *   toll >= 10        29  ->  **22**
 *   bands at zero    776  ->  791
 *
 *   The diagnosis was right. The penalty was bands losing their zero, the
 *   bound put fifteen of the twenty-three back, and the loud count is now
 *   BELOW the shipped law's — the first toll figure any corrected-map
 *   candidate has ever won.
 *
 * AND IT IS STILL REFUSED, on the interval score of both toll sets. What
 * remains is eight quiet bands that no longer reach zero, and 652 points
 * of quiet score, and 28 on the net.
 *
 * A FOURTH THING TO SAY ABOUT THESE CLAUSES, and it is structural rather
 * than a mistake. For an earthquake that killed nobody the interval score
 * is ln(high + 1) when the band reaches zero, so it is simply how large a
 * toll the model was willing to contemplate. A model that draws smaller
 * footprints contemplates smaller tolls and scores better, and a model
 * that predicted nothing at all would score ZERO on all 805. The quiet set
 * cannot be won by being right; it can be won by being timid.
 *
 * That is not an argument for ignoring it — rule 485(c) exists precisely
 * to stop timidity, and the union fails that one too. But it does mean the
 * two sets pull in opposite directions by construction, 805 events that
 * reward drawing less against 18 that reward drawing enough, and this
 * project has never weighed them against each other on purpose.
 *
 * WHAT THIRTEEN ROUNDS HAVE PRODUCED, stated plainly because the honest
 * summary is now more useful than another candidate:
 *
 *   THE MAP IS SOLVED, as far as measurement can say. The union reads
 *   1.376x on areas against 0.393x, with every cell closer to 1, and
 *   +1.06 on the peak against +1.96 with three times as many peaks within
 *   a degree. Both numbers come from juries shown fit for the question
 *   first. Nothing in this project is in doubt about the map any more.
 *
 *   THE TOLLS ARE NOT, AND THE REASON IS MEASURED. The toll chain reads
 *   correctly only when it is fed a footprint two and a half times too
 *   small. Rules 478 to 482 proved the cost follows the exposure by
 *   holding the peak fixed to the digit. Rule 455 acquitted PAGER's table
 *   on a count. Rule 440 found one piece of the compensation, worth
 *   fifteen of twenty-three lost zeros. The rest of the compensation is
 *   still somewhere in how this project applies PAGER, and it is worth
 *   about 650 points of quiet score.
 *
 *   SO THE NEXT STEP IS NOT A ROUND. Every remaining candidate of this
 *   shape will fail the same clause for the same reason. What has to
 *   happen is a decision about whether the toll chain is re-derived
 *   against the corrected map — which means departing from PAGER as this
 *   project currently applies it, and which is a choice about what Nimbus
 *   is, not a measurement. That belongs to whoever owns the project and
 *   not to a rule written inside it.
 */

export const UNION_RULES = 'rules 483 to 487, fixed 20 September 2026';

/** Rule 483's candidate, in one place so the round and any later
 *  adoption cannot drift apart. The dip is not here because it is a
 *  lookup the caller makes, as rule 428 has it. */
export const UNION_SETTINGS = {
  contourLaw: 'campbellBozorgnia2014',
  stadiumWidth: 'surfaceProjection',
  extendedSource: 'always',
  topBand: 'toPeak',
} as const;

/** What the diagnosis measured before these rules, pinned. */
export const QUIET_DIAGNOSIS = {
  worse: 360,
  unchanged: 428,
  better: 17,
  bandsLosingZero: 23,
  totalScoreChange: 1085,
} as const;
