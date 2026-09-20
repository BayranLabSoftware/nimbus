import { ATLAS_EARTHQUAKES } from './atlasSetData.js';
import type { AtlasEarthquake } from './atlasRules.js';

/**
 * The peak on a jury that was not chosen for its peak.
 *
 * Rules 459 to 464 measured the epicentral intensity of three laws and
 * refused both candidates — on a jury that could not see the defect.
 * Rule 405 admits an earthquake to the 116 only if its ShakeMap reaches
 * MMI 7, so their records have a median peak of 8.24; the defect is that
 * the model's peak saturates near 8.3; and a model that always says 8.3
 * came out unbiased there, as it would have done if it ignored its inputs
 * entirely. The same law read -0.12 on that set and +2.84 on the 805
 * quiet, whose records have a median of 5.38.
 *
 * THE RULE THAT ROUND EARNED, and this one is built on it: a jury must
 * not be selected on the quantity it is used to measure, and saying so is
 * not enough — it has to be shown. Rule 466 below is that showing, and it
 * runs before the laws do.
 *
 * THE SET. Rule 56's atlas entire: every event ComCat returns for 1973 to
 * 1999, magnitude 6 and up, no deeper than 40 km, with a ShakeMap, less
 * the two the project had already read. 1 101 earthquakes, of which 1 100
 * carry a peak. Its admission criteria are a magnitude, a depth, a date
 * and the existence of a map. NOT ONE OF THEM MENTIONS INTENSITY. Its
 * records run from MMI 3.60 to 9.69 with a median of 6.27, which is the
 * spread a saturating model cannot hide inside.
 *
 * Its `maxMmi` has never been read by any rule — not rule 57's run, which
 * read hits and misses at fixed thresholds, not rules 405 to 454, which
 * read areas, not rules 459 to 464, which read the peak of a subset. This
 * is the held-out reading, and it is spent here.
 *
 * WHAT IS MEASURED WHERE, and the split is the last round's lesson made
 * into a rule. The PEAK is measured on all 1 100, because a peak needs
 * no band to exist and a jury selected on intensity cannot judge it. The
 * AREAS stay on rule 405's 116, because an area above MMI VII needs the
 * record to have an MMI VII band, and asking for one is not conditioning
 * on the answer — it is the only way the question exists at all.
 *
 * The rules, fixed on 20 September 2026, numbered after the 464 before
 * them:
 *
 *  465. The set. `ATLAS_EARTHQUAKES` entire, every row with a positive
 *       `maxMmi`. No event is dropped, added or reweighted, and the six
 *       fixtures and the 805 quiet are not mixed in.
 *
 *  466. The jury is shown unconditioned BEFORE the laws are run, and the
 *       round stops if it is not. Printed first: the count, the minimum,
 *       median and maximum of the record peak, and the share of the set
 *       below MMI 7 — which on rule 459's jury was zero by construction
 *       and is what made it blind. A jury with no records below the
 *       saturation the model is accused of cannot test that accusation.
 *
 *  467. The contenders, unchanged from rule 460 and all already in the
 *       repository: `boore2014`, `campbellBozorgnia2014`,
 *       `allen2012Hypocentral`.
 *
 *  468. The measurement, unchanged from rule 461 — model peak minus
 *       record peak, in MMI degrees, with the mean, the spread, the share
 *       within one degree and the worst overshoot.
 *
 *       AND, because this round exists to catch saturation, the same
 *       figures SPLIT BY THE RECORD'S OWN PEAK, in whole degrees. A law
 *       that saturates reads near zero where the records are hot and
 *       climbs as they cool; a law that carries the source reads flat.
 *       That table is the point of the round and is printed whatever the
 *       verdict is.
 *
 *  469. The verdict, the clauses of rule 462 with the jury replaced:
 *
 *       (a) the mean peak bias closer to zero than the shipped law's by
 *           `PEAK_MARGIN_MMI`, on all 1 100;
 *       (b) the spread no wider;
 *       (c) the areas, on rule 405's 116, no worse by more than
 *           `PEAK_AREA_MARGIN` in any cell and no further from 1 overall.
 *
 *  470. And if a law wins the peak and loses the areas, or the reverse,
 *       that is published as the finding and nothing is adopted. Rules 459
 *       to 464 already saw the shape of it — Allen draws the peak best and
 *       the rings above Mw 7.5 at 3.79x — and a round that quietly took
 *       the half it liked would be worth nothing.
 *
 *  471. One run, no re-tuning. If no law passes rule 469 the shipped law
 *       stays, and the peak is wrong by whatever this round measures.
 */

/**
 * THE OUTCOME, run once on 20 September 2026 under rule 471 and published
 * as it came out: BOTH CANDIDATES WIN THE PEAK AND LOSE THE AREAS, so
 * rule 470 applies, nothing is adopted, and the shipped law stays.
 *
 * Rule 466 first, before any law: 1 100 earthquakes, record peak 3.60 to
 * 10.00, median 6.27, **78 % below MMI 7**. Rule 459's jury, put through
 * the same gate: 116 events, median 8.23, **0 % below MMI 7 — REFUSED**.
 * The test that would have stopped the last round, run on the last
 * round's jury, stops it.
 *
 * Rule 468, the peak, on all 1 100:
 *
 *   | law                   | mean bias | sd   | within 1 degree |
 *   | --------------------- | --------- | ---- | --------------- |
 *   | boore2014             | **+1.96** | 1.12 | **16 %**        |
 *   | campbellBozorgnia2014 | +1.35     | 1.03 | 36 %            |
 *   | allen2012Hypocentral  | **+0.58** | 0.98 | **68 %**        |
 *
 * AND THE TABLE THIS ROUND EXISTS FOR — the same bias, split by how hot
 * the record itself was:
 *
 *   | record band | n   | boore2014 | CB14  | allen2012 |
 *   | ----------- | --- | --------- | ----- | --------- |
 *   | below 5     | 141 | **+3.68** | +2.84 | +2.00     |
 *   | 5 to 6      | 290 | +2.66     | +1.65 | +0.86     |
 *   | 6 to 7      | 423 | +1.79     | +1.23 | +0.46     |
 *   | 7 to 8      | 158 | +0.87     | +0.78 | +0.02     |
 *   | 8 and up    |  88 | **-0.38** | -0.44 | -1.03     |
 *
 *   THAT COLUMN IS SATURATION, WRITTEN OUT. The shipped law's error falls
 *   straight from +3.68 to -0.38 as the record warms. It is not a law
 *   that is a bit too hot; it is a law that says nearly the same thing
 *   whatever happened, and so looks right exactly where the earthquake
 *   happened to be as hot as it always says.
 *
 *   And the bottom row is the last round in one number. Rule 459's jury
 *   was the "8 and up" band and nothing else — 88 events of this shape —
 *   where the shipped law reads -0.38. The -0.12 it measured there was
 *   never a property of the law. It was the property of a jury.
 *
 *   Allen's column is flatter by half and crosses zero where the records
 *   are 7 to 8 (+0.02). A law whose distance is hypocentral has the depth
 *   in it at the epicentre, and it shows.
 *
 * Rule 469(c), the areas, on the 116 where an area exists:
 *
 *   | law                   | mean   | Mw < 6.5 | Mw 6.5–7.5 | Mw >= 7.5 |
 *   | --------------------- | ------ | -------- | ---------- | --------- |
 *   | boore2014             | 0.393x | 0.56x    | 0.22x      | 1.27x     |
 *   | campbellBozorgnia2014 | 0.656x | 0.99x    | 0.42x      | 1.45x     |
 *   | allen2012Hypocentral  | 1.256x | 1.03x    | 0.87x      | **3.79x** |
 *
 * THE VERDICT, and it is rule 470's case exactly:
 *
 *   campbellBozorgnia2014   peak PASS   areas fail (Mw >= 7.5)   refused
 *   allen2012Hypocentral    peak PASS   areas fail (Mw >= 7.5)   refused
 *
 *   Both beat the shipped law on the peak by more than rule 462's quarter
 *   degree AND with a narrower spread. Both are refused on the rings
 *   above Mw 7.5. Allen draws the peak four times better and the great
 *   earthquakes' rings three times too wide.
 *
 * WHAT THIS ROUND LEAVES, and it is the clearest statement of the
 * project's position that these rounds have produced:
 *
 *   1. THE SHIPPED LAW'S PEAK IS WRONG BY +1.96 MMI ON AVERAGE AND BY
 *      +3.68 WHERE THE EARTHQUAKE WAS WEAK. Sixteen per cent of its peaks
 *      are within a whole degree. That is now measured on 1 100
 *      earthquakes with a jury that was shown able to see it first, and
 *      nothing about it is in dispute.
 *
 *   2. ONE EQUATION IS BEING ASKED TWO QUESTIONS. The intensity field has
 *      to set the peak AND the fall-off, and no law in this repository is
 *      good at both: the one in Joyner-Boore distance has the far field
 *      and saturates at the source; the one in hypocentral distance has
 *      the source and spreads the far field three times too wide. Every
 *      round from 384 to here has been judging single laws on one of the
 *      two and calling the answer a verdict on the law.
 *
 *   3. So the next round is not another candidate from the same shelf. It
 *      is whether the near field and the far field are one question or
 *      two — and if two, what says so before any number is seen. There
 *      are NGA-West2 models built for near-source saturation that this
 *      project has not read, and there is the honest alternative of
 *      declaring the split. Either needs its rules first.
 */

export const WHOLE_ATLAS_PEAK_RULES = 'rules 465 to 471, fixed 20 September 2026';

/** Rule 465: every atlas row whose ShakeMap has a peak to compare. */
export function wholeAtlasPeakJury(
  events: readonly AtlasEarthquake[] = ATLAS_EARTHQUAKES
): readonly AtlasEarthquake[] {
  return events.filter((e) => Number.isFinite(e.maxMmi) && e.maxMmi > 0);
}

export interface JuryShape {
  events: number;
  minMmi: number;
  medianMmi: number;
  maxMmi: number;
  /** Rule 466: the share whose record never reaches MMI 7. On rule 459's
   *  jury this was zero, which is why it could not see a model that
   *  saturates at 8.3. */
  shareBelowSeven: number;
}

/** Rule 466: what the jury is, before any law touches it. */
export function shapeOf(events: readonly AtlasEarthquake[]): JuryShape {
  const peaks = events.map((e) => e.maxMmi).sort((a, b) => a - b);
  if (peaks.length === 0) {
    return {
      events: 0,
      minMmi: Number.NaN,
      medianMmi: Number.NaN,
      maxMmi: Number.NaN,
      shareBelowSeven: 0,
    };
  }
  const middle = Math.floor(peaks.length / 2);
  const median =
    peaks.length % 2 === 1
      ? (peaks[middle] ?? Number.NaN)
      : ((peaks[middle - 1] ?? Number.NaN) + (peaks[middle] ?? Number.NaN)) / 2;
  return {
    events: peaks.length,
    minMmi: peaks[0] ?? Number.NaN,
    medianMmi: median,
    maxMmi: peaks[peaks.length - 1] ?? Number.NaN,
    shareBelowSeven: peaks.filter((p) => p < 7).length / peaks.length,
  };
}

/**
 * Rule 466's gate: a jury that holds no record below the intensity the
 * model is accused of saturating at cannot test the accusation.
 *
 * A quarter is not a tuned number — it is "a substantial minority", and
 * the two juries this round is written against sit at 0 % (the 116, which
 * failed) and 66 % (the atlas). Anything in between would need its own
 * argument, and the rule would rather refuse than make one silently.
 */
export const JURY_NEEDS_BELOW_SEVEN = 0.25;

export function juryCanSeeSaturation(shape: JuryShape): boolean {
  return shape.events > 0 && shape.shareBelowSeven >= JURY_NEEDS_BELOW_SEVEN;
}
