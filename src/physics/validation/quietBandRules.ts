import { QUIET_DEATHS_BELOW } from './depthRules.js';

/**
 * What a toll model says about earthquakes that killed nobody.
 *
 * THIS ROUND BEGAN AS A DIFFERENT ONE, and says so first because the
 * correction is the useful part. The round of rules 427 to 434 refused arm
 * C — the best geometry measured, which improves every cell of the map —
 * on one net row: Pohang 2017, a Mw 5.5 that killed nobody and whose
 * predictive band lifted off zero, [0–37746] to [1–81833]. Its closing
 * note called the next block "the band at small magnitude... how a toll
 * model says 'possibly nobody' about an earthquake that hurt nobody".
 *
 * That premise was measured before these rules were written, on rule 23's
 * 805 quiet earthquakes — events the NCEI database holds no record for,
 * which means fewer than ten dead — with the geometry in place:
 *
 *   805  quiet earthquakes
 *   799  whose predictive band reaches zero
 *     6  whose band does not
 *    23  whose CENTRAL toll is ten or more (2.9 %, which is rule 38's own
 *        published figure for the shipped law, so nothing new was spent
 *        to learn it)
 *
 * The premise is false. The band says "possibly nobody" for 99.3 % of the
 * earthquakes that killed nobody. Pohang is not the tip of a defect in the
 * band; it is one of six, and the six are not alike in magnitude or in
 * region. Writing a round to widen a low tail that is already reaching
 * zero would have been fixing a fault that was not there.
 *
 * WHAT THE SAME MEASUREMENT SHOWS INSTEAD, and it is worse:
 *
 *   usp000h60j  Mw 6.0  central 6204  [42–271621]   Grangwav, Haiti
 *   us6000rcnw  Mw 6.2  central  353  [5–39039]     Mene Grande, Venezuela
 *   us7000pn9z  Mw 6.7  central  174  [1–43347]     Myanmar
 *   us6000hz9v  Mw 6.0  central  123  [2–10133]     Bandar-e Lengeh, Iran
 *   us20004zp9  Mw 6.3  central  103  [1–6454]      Waingapu, Indonesia
 *   us20002bi4  Mw 6.1  central   66  [1–25985]     Dhulikhel, Nepal
 *
 *   Six thousand dead where fewer than ten died. These are not band
 *   failures, they are central-estimate failures, and the bands around
 *   them span four and five orders of magnitude — a band from 42 to
 *   271 621 contains almost any answer and can hardly be wrong.
 *
 * SO THIS ROUND ASKS THE QUESTION THAT IS ACTUALLY OPEN, and it is the one
 * arm C's refusal turns on. Rule 433(d) refused the best geometry on
 * ONE row of eighteen. Rule 38 has a second, larger test of the same kind
 * — the share of quiet earthquakes raised to a toll of ten — and it has
 * never been run on arm C. Arm C draws BIGGER footprints below Mw 6.5
 * (1.24x against 0.56x), so it should raise that share, and if it raises
 * it materially then Pohang was not an unlucky single row but the visible
 * corner of a real cost. If it does not, the refusal rests on one row out
 * of eighteen and the report should say so.
 *
 * WHAT HAS BEEN READ. Rule 23's quiet set is not held out: rule 38 scored
 * it, rule 59 scored it again, and its in-place figures are published
 * (2.9 %). What has never been read is any figure of the new geometry on
 * it. That is the one thing this round spends.
 *
 * The rules, fixed on 20 September 2026, numbered after the 434 before
 * them:
 *
 *  435. The set. Rule 23's quiet earthquakes — every event of
 *       `UNSEEN_EARTHQUAKES` that `isQuiet` accepts, 805 of 809 — each run
 *       on the ground rule 22 picks for it, as rule 38 and rule 59 ran
 *       them. No event is added, dropped or reweighted.
 *
 *  436. The arms, two, in one run: the geometry in place, and arm C of
 *       rules 427 to 434 — the surface projection, the stadium at every
 *       magnitude, and the dip of the structure the strike came from.
 *       Nothing else differs, so what moves is that geometry.
 *
 *  437. What is measured, all of it published whichever way it falls:
 *
 *       (a) rule 38's own share: quiet earthquakes whose CENTRAL toll is
 *           `QUIET_DEATHS_BELOW` or more, which is ten;
 *       (b) the share whose predictive band reaches zero;
 *       (c) the median width of the band in natural logs, over the quiet
 *           earthquakes that have a band with a positive high end — the
 *           sharpness, so that a band which contains the record by
 *           containing everything gets no credit for it;
 *       (d) every quiet earthquake whose central toll is ten or more,
 *           by id, magnitude, place and toll, under both arms.
 *
 *  438. The verdict, and it adopts nothing by itself. This round decides
 *       one thing: whether the quiet evidence CORROBORATES rule 433(d)'s
 *       refusal of arm C or contradicts it.
 *
 *       (a) It corroborates if arm C raises the COUNT of rule 437(a) by
 *           more than one earthquake, so that a single event crossing a
 *           threshold is not read as a trend. Counts and not shares: the
 *           set is the same 805 under both arms, and an integer cannot
 *           round its way past a bound.
 *       (b) It contradicts if arm C's count is the same or lower.
 *
 *       Either way the geometry in place stays, because adopting a
 *       geometry is rules 427 to 434's business and that round has run.
 *       What this one produces is evidence, and a sentence in the report
 *       saying which way it fell.
 *
 *  439. One run, no re-tuning. The set, the arms and the measurements are
 *       not adjusted after a number is seen, and the six earthquakes named
 *       above are not treated differently from the other 799.
 */

/**
 * THE OUTCOME, run once on 20 September 2026 under rule 439 and published
 * as it came out: the quiet evidence CORROBORATES rule 433(d)'s refusal of
 * arm C, and not narrowly.
 *
 *   | arm      | toll >= 10 | share | band reaches zero | median width (ln) |
 *   | -------- | ---------- | ----- | ----------------- | ----------------- |
 *   | in place | 23         | 2.9 % | 799 of 805        | 3.69              |
 *   | arm C    | **51**     | 6.3 % | 784 of 805        | 4.43              |
 *
 * Rule 438(a) asked for more than one earthquake. It got twenty-eight.
 * The geometry that draws the best map this project has measured — every
 * cell improved, the hole between Mw 6.5 and 7.5 closed — more than
 * DOUBLES the number of earthquakes it kills ten or more people in, among
 * 805 that killed fewer than ten. Twenty-four of the fifty-one are new:
 * Chile, the Philippines, Papua New Guinea, Ecuador, Indonesia, Costa
 * Rica, all between Mw 6.0 and 6.9. And the bands get WIDER as well, 3.69
 * to 4.43 in log width, so the model is both more wrong and less sure.
 *
 *   usp000h60j  Mw 6.0  Haiti       6204 → 10356
 *   us6000rcnw  Mw 6.2  Venezuela    353 →  3337
 *   us7000pn9z  Mw 6.7  Myanmar      174 →   630
 *   us20002bi4  Mw 6.1  Nepal         66 →   430
 *
 * So Pohang was not an unlucky single row out of eighteen. It was the
 * visible corner of a cost that this set shows the size of.
 *
 * AND THE TWO RESULTS TOGETHER SAY SOMETHING NEITHER SAYS ALONE. The
 * footprint of the geometry in place is 0.393x of the ground the ShakeMaps
 * record; arm C's is 1.137x. Fixing that — putting roughly the right
 * number of people inside the rings at last — makes the tolls WORSE, on
 * 805 earthquakes, by a factor of more than two.
 *
 * A vulnerability curve is fitted by hindcasting recorded deaths against
 * an exposure. PAGER fits its curves against PAGER's exposure. This model
 * has been feeding those curves an exposure that was two and a half times
 * too small, and its tolls came out roughly right — which means the
 * curves, as this model uses them, have been absorbing the geometric
 * error. Correct the geometry alone and the compensation goes with it.
 *
 * That is not an argument for keeping a footprint that is wrong. It is the
 * measurement of why the two cannot be adopted one at a time, and it is
 * the reason rule 433(d) exists.
 *
 * WHAT THIS ROUND LEAVES, and it is a different block from the one that
 * was expected two rounds ago:
 *
 *   1. THE GEOMETRY AND THE CURVES MOVE TOGETHER OR NOT AT ALL. Arm C
 *      cannot be adopted with the vulnerability table as it stands, and
 *      the table cannot be judged against a footprint known to be 0.393x.
 *      A round that changes both and is scored on both — the areas of the
 *      116 and the tolls of the 18 and the 805 — is the one that can
 *      settle it. Rules first, and they will need to say what "both" means
 *      before either number is seen.
 *
 *   2. THE BAND IS NOT THE PROBLEM, which is what these rules set out to
 *      test and what they found. 799 of 805 already reach zero. What the
 *      bands are is UNINFORMATIVE: a median log width of 3.69 is a factor
 *      of forty between the ends, and Haiti's 42 to 271 621 is five orders
 *      of magnitude. Rule 433(d) and rule 19 both decide by asking whether
 *      a record falls inside such a band. That test is very hard to fail,
 *      and a clause that cannot fail is not evidence. A sharpness bound
 *      belongs beside every coverage clause this project has.
 */

export const QUIET_BAND_RULES = 'rules 435 to 439, fixed 20 September 2026';

/** Rule 437(a): ten dead, which is what `QUIET_DEATHS_BELOW` has always
 *  meant — an event the NCEI database would have held a record for. */
export const QUIET_TOLL_THRESHOLD = QUIET_DEATHS_BELOW;

/**
 * Rule 438(a): one earthquake in the set, so that a single event crossing
 * a threshold is not read as a trend.
 *
 * On COUNTS and not on shares. The rule says "by more than one
 * earthquake", and a share is that count divided by 805: comparing
 * `candidate - inPlace > 1 / 805` in floating point answers true for a
 * difference of exactly one, because 0.029 + 1/805 does not subtract back
 * to 1/805. The counts are integers and cannot lie about it.
 */
export function corroboratesRefusal(inPlaceCount: number, candidateCount: number): boolean {
  return candidateCount - inPlaceCount > 1;
}

/** Rule 437(c): the sharpness of a band, in natural logs. A band with no
 *  positive high end has no width to report and is left out rather than
 *  counted as perfectly sharp. */
export function bandWidthLn(low: number, high: number): number | null {
  if (!(high > 0)) return null;
  // The low end reaches zero for 99 % of these, so the width is measured
  // from one death upwards: ln((high + 1) / (low + 1)), which is finite
  // for a band that starts at nothing and grows with what it spans.
  return Math.log((high + 1) / (Math.max(0, low) + 1));
}

/** The median of a list, or null where there is nothing to take one of. */
export function medianOf(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? null;
  const a = sorted[middle - 1];
  const b = sorted[middle];
  return a === undefined || b === undefined ? null : (a + b) / 2;
}
