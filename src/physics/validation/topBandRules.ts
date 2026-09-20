/**
 * Geometry and curves together: the footprint that is right, and a band
 * that stops charging an intensity the earthquake never reaches.
 *
 * WHAT WAS LOOKED AT BEFORE THESE RULES WERE WRITTEN, all of it from runs
 * already published, and two new measurements named as such.
 *
 * Rules 427 to 434 built a geometry — the surface projection, the stadium
 * at every magnitude, the dip of the structure the strike came from — that
 * reads 1.15x at MMI VII and 1.11x at MMI VIII against 110 and 59 of the
 * jury's ShakeMaps, where the geometry in place reads 0.51x and 0.24x. It
 * was refused on the dead. Rules 435 to 439 then measured what it costs on
 * rule 23's 805 quiet earthquakes: the count raised to a toll of ten goes
 * from 23 to 51.
 *
 * Their joint conclusion was that the vulnerability curves had been
 * absorbing the geometric error. Before writing a round on that, three
 * things were checked, and the first two say it is NOT so:
 *
 *   1. The shape the toll counts in. The tolls count people inside a
 *      STADIUM while the map is measured on a FIELD, so the two could have
 *      disagreed. Measured on the same 116: the stadium reads 0.206x where
 *      the field reads 0.393x, and 0.843x where the field reads 1.137x.
 *      The stadium is SMALLER, so nothing is over-counted by it; if
 *      anything the toll chain has been fed an exposure five times too
 *      small, not two and a half.
 *
 *   2. The band's representative intensity, against the area-weighted mean
 *      of PAGER's own curve across that band. For Korea, Haiti, Chile and
 *      the Philippines at Mw 6.2 the midpoint is 0.8x to 1.1x of the true
 *      mean. The banding is sound and was not the compensation.
 *
 *   3. The TOP band, which has no ceiling. `casualties.ts` charges the
 *      topmost ring a fixed midpoint — 9.5, 8.5 or 7.5 — whatever the
 *      earthquake actually reaches. Every other band is bounded above by
 *      the next ring and its midpoint is right. The top one is bounded by
 *      the event's own peak, and nothing bounds it.
 *
 * WHAT THAT COSTS, measured on the six loudest quiet earthquakes — the
 * ones the last round named, where the model kills people who did not die:
 *
 *   usp000h60j  Mw 6.0  Haiti       peak MMI 8.25, charged 8.5
 *   us6000rcnw  Mw 6.2  Venezuela   peak MMI 8.33, charged 8.5
 *   us7000pn9z  Mw 6.7  Myanmar     peak MMI 8.21, charged 8.5
 *   us20002bi4  Mw 6.1  Nepal       peak MMI 8.02, charged 8.5
 *   us6000hz9v  Mw 6.0  Iran        peak MMI 8.19, charged 8.5
 *   us20004zp9  Mw 6.3  Indonesia   peak MMI 8.33, charged 8.5
 *
 *   Not one of them reaches 8.5 anywhere, and every person in their
 *   topmost band is charged the fatality rate of 8.5. On Haiti's curve
 *   (theta 10.50, beta 0.169) that is 1.6 times the rate its true middle
 *   of 8.12 deserves; on Korea's (beta 0.10) it is more than three.
 *
 *   It bites hardest exactly where the false alarms are. A great
 *   earthquake's peak sits well above its top threshold and the midpoint is
 *   about right; a moderate one's peak sits just above, and the model
 *   charges half a degree of shaking that does not exist. With a footprint
 *   five times too small that error was carried by few people. With the
 *   footprint right it is carried by all of them.
 *
 * SO THIS IS NOT A RE-FIT. Nothing here touches PAGER's theta, beta or g.
 * The curve is PAGER's, unchanged; what changes is that the model stops
 * evaluating it at an intensity it has itself said does not occur.
 *
 * The rules, fixed on 20 September 2026, numbered after the 439 before
 * them:
 *
 *  440. The band's candidate, with no free parameter. The representative
 *       intensity of the TOPMOST band of a shaking plan is the middle of
 *       what that band actually spans: (threshold + peak) / 2, where the
 *       peak is the intensity the scenario's own law gives at the
 *       epicentre, on the ground the scenario stands on. Every other band
 *       keeps threshold + 0.5, because the ring above it is its ceiling and
 *       that midpoint is already the middle of what it spans.
 *
 *       Both directions, not one. Where the peak is below threshold + 1 the
 *       rate falls; where a great earthquake's peak is above it the rate
 *       RISES, and the round does not get to keep only the half that
 *       flatters it. A candidate written to lower tolls would have capped
 *       it at threshold + 0.5; this one does not.
 *
 *  441. And nothing else about the plan moves. The bands' radii, the
 *       population, the hazards, the delayed dead, the scatter drawn from
 *       PAGER's g: all unchanged. A test holds a plan whose peak is exactly
 *       threshold + 1 to be identical to the plan built today, to the last
 *       digit, so that what moves is only what rule 440 says.
 *
 *  442. The arms, four, in one run, because this round changes two things
 *       and has to show each on its own:
 *
 *         in place  the geometry and the bands as they ship;
 *         C         the geometry of rules 427 to 434, bands as they ship;
 *         D         the band of rule 440, geometry as it ships;
 *         E         both — the proposal.
 *
 *       C is already measured and is run again here so that all four come
 *       from one run. D is what isolates the band.
 *
 *  443. Judged on all three sets, in the same run, because the whole point
 *       is that they cannot be judged apart:
 *
 *       (a) THE MAP, on rule 405's 116 ShakeMaps: rule 424's six clauses,
 *           unchanged, with `boore2014` deciding.
 *       (b) THE DEAD, on the net rows: no fewer records inside their
 *           predictive band than the geometry in place, and none lost.
 *       (c) THE QUIET, on rule 23's 805: the count raised to a toll of ten
 *           no higher than the 23 the geometry in place reads.
 *
 *  444. Adoption. An arm is adopted only if it passes (a), (b) and (c)
 *       together. If arm E passes and the others do not, the pair is
 *       adopted as a pair and the report says that neither half would have
 *       passed alone — which is the finding this round exists to test.
 *
 *  445. What is printed whatever happens: all four arms on all three sets,
 *       the six quiet earthquakes above by name and toll under each arm,
 *       and — because rules 435 to 439 found the bands uninformative — the
 *       median log width of the quiet bands under each arm, deciding
 *       nothing.
 *
 *  446. One run, no re-tuning. No threshold, bound, dip or curve is
 *       adjusted after a number is seen. If every arm fails, what ships
 *       stays and the numbers are published as they came.
 *
 *  447. And what this round may not do. It may not change PAGER's theta,
 *       beta or g, nor which country borrows which curve, nor the
 *       population raster. If the tolls are still wrong when the footprint
 *       is right and the band is bounded, that is a finding about the
 *       vulnerability table, and it belongs to a round that says so before
 *       it runs.
 */

/**
 * THE OUTCOME, run once on 20 September 2026 under rule 446 and published
 * as it came out: every arm is REFUSED. What ships stays. And the round
 * answered the question it was built for — the halves DO need each other —
 * while failing on a clause that, read closely, is barely a clause at all.
 *
 * Rule 443(a), the map on 116 ShakeMaps. Arms D and E share a geometry
 * with the two above them, so there are two rows and not four:
 *
 *   | geometry   | bands | mean   | scatter | Mw < 6.5 | Mw 6.5–7.5 | Mw >= 7.5 |
 *   | ---------- | ----- | ------ | ------- | -------- | ---------- | --------- |
 *   | in place   | 165   | 0.393x | 1.579   | 0.56x    | 0.22x      | 1.27x     |
 *   | C geometry | 169   | 1.137x | 1.273   | 1.24x    | 1.15x      | 0.97x     |
 *
 * Rule 443(b), the dead on the net rows:
 *
 *   in place     13/13   —                                    PASS
 *   C geometry   13/13   lost Pohang, gained Amatrice         FAIL
 *   D top band   12/13   lost Sumatra–Andaman                 FAIL
 *   E both       13/13   lost Sumatra–Andaman, gained Amatrice FAIL
 *
 * Rule 443(c), the quiet on 805:
 *
 *   | arm        | toll >= 10 | band reaches zero | median width (ln) |
 *   | ---------- | ---------- | ----------------- | ----------------- |
 *   | in place   | 23         | 799 of 805        | 3.69              |
 *   | C geometry | 51         | 784 of 805        | 4.43              |
 *   | D top band | **18**     | **801 of 805**    | **3.58**          |
 *   | E both     | 36         | 794 of 805        | 4.31              |
 *
 * WHAT THE ROUND WAS BUILT TO TEST, AND WHAT IT FOUND. The halves need
 * each other, and the evidence is one row:
 *
 *   Pohang 2017, record 0, peak MMI 8.15
 *     in place     129  [0–37746]   in
 *     C geometry   428  [1–81833]   OUT   <- the row that refused arm C
 *     D top band    98  [0–40212]   in
 *     E both       241  [0–67295]   **in**
 *
 *   The band bound recovers exactly the row the geometry lost. Two rounds
 *   turned on Pohang; together the two halves put it back, because the
 *   model stops charging 8.5 to an earthquake that reaches 8.15.
 *
 * AND THE TOP BAND ALONE IS A FREE IMPROVEMENT ON THE QUIET SET. Arm D
 * lowers the false alarms below what ships — 23 to 18 — raises the count
 * of bands that can say "nobody" from 799 to 801, and NARROWS the bands
 * from 3.69 to 3.58. Nothing else in this whole line of rounds has moved
 * all three the right way at once.
 *
 * WHY IT IS REFUSED ANYWAY, and the reason is not what rule 440 predicted.
 * That rule warned its upward half would cost the candidate: where a great
 * earthquake's peak sits above threshold + 1, the rate RISES. It was
 * written in deliberately and a test pins it. It is not what happened.
 *
 *   Sumatra–Andaman 2004, record 227 898, peak MMI **8.89**
 *     in place    4263  [115–277275]  in
 *     D and E     3724  [54–202718]   OUT
 *
 *   Its peak is BELOW 9, so its top band is the MMI VIII one and the bound
 *   lowers it, from 8.5 to 8.445. The toll falls 13 %. And the high end of
 *   its band falls from 277 275 to 202 718 — just under the record.
 *
 *   So the model misses Sumatra–Andaman by a factor of FIFTY-THREE, 4 263
 *   against 227 898, and was counted as containing it because a band
 *   spanning 115 to 277 275 — a factor of 2 400 — happened to reach past
 *   it. Thirteen per cent of movement in the right direction of accuracy
 *   is what pushed the record out. Rules 435 to 439 said a clause that
 *   cannot fail is not evidence; here is the other face of it, a clause
 *   that fails for a reason that has nothing to do with being right.
 *
 * WHAT IS STILL UNEXPLAINED, and it is the honest remainder. The geometry
 * costs 28 false alarms on the quiet set, from 23 to 51. The band bound
 * gives back 15 of them, from 51 to 36. Half the compensation is
 * accounted for and half is not. The top band was one real defect, and it
 * is not the only one.
 *
 * WHAT THIS ROUND LEAVES:
 *
 *   1. The clauses, before any more physics. Rule 443(b) is decided by
 *      whether a record falls inside bands spanning factors of thousands,
 *      and it has now refused two candidates for movements of 13 % and
 *      for one row in eighteen. It needs a sharpness bound and a statement
 *      about accuracy, not only membership, and that is a round of rules
 *      with no new model in it at all.
 *
 *   2. The remaining half of the compensation. With the footprint right
 *      and the top band bounded, the quiet false alarms are still 36
 *      against 23. Something else in the chain was absorbing the
 *      geometric error, and rule 447 forbids this round from guessing
 *      which — the vulnerability table, the population raster and the
 *      country assignment are each a candidate and each needs its own
 *      rules written first.
 *
 *   3. Arm D is the cheapest thing on the table. It improves the quiet set
 *      on all three measures, costs nothing on the map, and is refused by
 *      one row it moves 13 %. When the clauses of (1) exist, it should be
 *      the first candidate put through them.
 */

export const TOP_BAND_RULES = 'rules 440 to 447, fixed 20 September 2026';

/**
 * Rule 440: the intensity the topmost band is charged at.
 *
 * `threshold` is the band's own MMI — 7, 8 or 9 — and `peakMmi` what the
 * scenario reaches at its epicentre. A band that is not the topmost one
 * has the next ring above it and keeps the midpoint it has today, which
 * this function gives when the peak is a whole degree above or more.
 */
export function topBandIntensity(threshold: number, peakMmi: number): number {
  if (!Number.isFinite(peakMmi)) return threshold + 0.5;
  // A peak below the band's own threshold means the band should not exist;
  // charging less than the threshold would be inventing gentleness, so the
  // floor is the threshold itself.
  const top = Math.max(threshold, peakMmi);
  return (threshold + top) / 2;
}
