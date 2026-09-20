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
