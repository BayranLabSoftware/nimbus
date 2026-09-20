/**
 * One input, and the question the last eleven rounds could not separate.
 *
 * Rules 472 to 477 printed a side arm and refused it on the half it
 * cannot do. `boore2014` with `pointSourceDistance: 'thompsonWorden2018'`
 * — ONE scenario input, the same law, the same geometry, the same curves
 * — reads, on figures already published in af2ffe4:
 *
 *   the peak, 1 100 events   +1.96, sd 1.12, 16 % within a degree
 *                            IDENTICAL to the shipped law, to the last
 *                            digit, because R_JB is horizontal and a
 *                            correction to it cannot carry depth
 *   the areas, the 116       0.393x -> **1.087x**, scatter 1.579 -> 1.288
 *
 * WHY THIS IS THE EXPERIMENT NOBODY HAS RUN. Eleven rounds have found
 * that every improvement to the map makes the tolls worse, over four
 * geometries and three laws. But every one of those changes moved the
 * footprint AND something else — the peak, the shape, the law. None of
 * them could say whether the tolls suffer because more people are inside
 * the rings, or because the intensity charged to them moved too.
 *
 * This candidate moves the rings and NOTHING ELSE. Its peak is the
 * shipped law's to the digit. So:
 *
 *   if the tolls get worse here too, the cost is the EXPOSURE, and the
 *   toll chain is calibrated against rings that are two and a half times
 *   too small — which is a statement about what has to be re-derived;
 *
 *   if they do not, then the eleven rounds' pattern was never about the
 *   footprint at all, and what has been wrecking the tolls is the peak
 *   and the shape, which are separately measurable and separately wrong.
 *
 * Either answer is worth more than another candidate, and it costs one
 * run because two thirds of the evidence is already published.
 *
 * WHAT THIS ROUND SPENDS: only the tolls. The peak and the areas were
 * measured and published by rules 472 to 477 and are cited, not re-run.
 *
 * The rules, fixed on 20 September 2026, numbered after the 477 before
 * them:
 *
 *  478. The candidate: `boore2014` with
 *       `pointSourceDistance: 'thompsonWorden2018'`. Nothing else. A test
 *       holds its epicentral intensity equal to the shipped law's at every
 *       magnitude and depth, so that what moves is the rings alone.
 *
 *  479. The sets, ALL THREE, and this is rule 476's fault corrected. Rule
 *       476 asked the peak and the areas because the round was about a law
 *       and a geometry, and so recommended a pair that rules 435 to 454
 *       had already measured as harmful. This round asks:
 *
 *       (a) the peak, on rule 465's 1 100 — cited from af2ffe4, where it
 *           is identical, and re-checked by the test of rule 478;
 *       (b) the areas, on rule 405's 116 — cited from af2ffe4;
 *       (c) THE DEAD, on the net rows, by rule 448's interval score and
 *           by membership;
 *       (d) THE QUIET, on rule 23's 805, by the same score, with the
 *           count raised to a toll of ten and the count whose band still
 *           reaches zero.
 *
 *  480. The verdict. The candidate displaces the shipped law only if the
 *       areas improve (they do, and it is published), the peak does not
 *       move (it does not, and a test says so), AND neither toll figure
 *       is worse: the interval score no higher on the net rows and no
 *       higher on the quiet, and the count raised to ten no higher.
 *
 *       No clause is weakened because this candidate is cheap. A cheap
 *       candidate that shipped a worse toll would be worse than an
 *       expensive one that shipped nothing.
 *
 *  481. And whichever way it falls, the ATTRIBUTION is published: whether
 *       the tolls follow the footprint alone. That is the finding this
 *       round exists for, and it does not depend on the verdict.
 *
 *  482. One run, no re-tuning.
 */

export const POINT_DISTANCE_TOLL_RULES = 'rules 478 to 482, fixed 20 September 2026';

/** Rule 479: what af2ffe4 published for this arm, pinned so this round
 *  cannot quietly find different numbers for the two thirds it cites. */
export const CITED = {
  peakMeanBias: 1.96,
  peakWithinOne: 0.16,
  areaBias: 1.087,
  areaScatter: 1.288,
  shippedAreaBias: 0.393,
} as const;
