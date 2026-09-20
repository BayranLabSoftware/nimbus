/**
 * The peak, measured at last: which law reaches the intensity the
 * earthquake actually reached.
 *
 * Rules 455 to 458 found that the model's epicentral intensity sits
 * +1.33 MMI above the record on the 23 quiet earthquakes it kills people
 * in, and +2.89 on the other 694 — and that its peak is 8.0 to 8.4 for
 * every Mw 6 in the world, whatever its depth. Boore et al. 2014 is a law
 * in Joyner-Boore distance; at the epicentre of a scenario ten kilometres
 * deep the model asks it for the ground motion at a distance of zero.
 *
 * Rule 458 named the candidate and refused to run it in that round:
 * Campbell & Bozorgnia 2014, which carries the depth at the source, built
 * and checked against its own reference under rules 384 to 404, refused
 * FOUR TIMES on areas, and never once measured on the peak.
 *
 * THE COMPARISON IS UNFAIR TO THE RECORD, AND SAYS SO. The model's number
 * is its intensity AT THE EPICENTRE. The record's `maxMmi` is the highest
 * intensity anywhere on that ShakeMap, which is at least its epicentral
 * value and usually more, because the highest cell is often a soft-soil
 * pocket off to one side. So every bias measured here is a LOWER BOUND on
 * how much too hot the model is. It is used anyway, because it is the
 * comparison the data allows and erring towards the model is the right
 * direction for an error to lie in.
 *
 * WHAT HAS BEEN READ. Rule 457 spent the quiet set's `maxMmi` on the
 * shipped law: +1.33 and +2.89 are published. No candidate's peak has
 * been read on anything. Rule 56's ATLAS carries `maxMmi` for all 1 101 of
 * its earthquakes and NO rule has ever read it — not rule 57's run, not
 * rules 405 to 454, which read areas. That is the held-out reading this
 * round spends, and it is spent once.
 *
 * The rules, fixed on 20 September 2026, numbered after the 458 before
 * them:
 *
 *  459. The set. Rule 405's 116 — the atlas's least-modelled maps, the
 *       same jury every geometry round has used — read on `maxMmi`, which
 *       none of them read. Rule 23's 805 quiet earthquakes are measured
 *       beside them and reported, with the shipped law's figures on them
 *       already published, so that the two sets can disagree in public.
 *
 *  460. The contenders, all three already in the repository and none
 *       written for this round:
 *
 *         `boore2014`                 what ships. Joyner-Boore distance,
 *                                     no depth at the source.
 *         `campbellBozorgnia2014`     NGA-West2 with the depth, the top of
 *                                     rupture of rule 399 and the dip of
 *                                     rule 427.
 *         `allen2012Hypocentral`      an intensity equation in HYPOCENTRAL
 *                                     distance, which at the epicentre is
 *                                     the depth itself. It predicts MMI
 *                                     directly rather than through a PGA.
 *
 *       The third is here because rule 398 recorded that nobody had ever
 *       measured it without its Mw 7.5 switch, and because a law whose
 *       distance is hypocentral cannot evaluate itself at zero.
 *
 *  461. The measurement. For each earthquake and each law, the model's
 *       epicentral intensity minus the record's `maxMmi`, in MMI degrees.
 *       Published: the mean, the standard deviation, the share within one
 *       whole degree, and the worst overshoot.
 *
 *  462. The verdict. A law displaces the shipped one only if ALL hold:
 *
 *       (a) its mean peak bias is closer to zero than the shipped law's by
 *           at least a quarter of an MMI degree — a quarter, because the
 *           comparison of rule 461 is a lower bound and a margin smaller
 *           than the slack in it would be reading noise;
 *       (b) the spread of its peak bias is no wider;
 *       (c) it does not lose the areas: on the same 116, rule 424's cells
 *           may not get worse by more than `EXTENDED_SOURCE_MARGIN`, and
 *           the overall bias may not move further from 1. This round is
 *           allowed to overturn four refusals on areas only by showing the
 *           areas do not pay for it.
 *
 *  463. And what an adoption would mean, said before the numbers so it
 *       cannot be softened after them: adopting a new law here overturns
 *       rule 19's choice and the four refusals of rules 384 to 411, all of
 *       which were decided on AREAS. The report must print that those
 *       rounds measured a different quantity and did not measure this one,
 *       and every figure they published moves, as rule 44 has it.
 *
 *  464. One run, no re-tuning. Nothing is adjusted after a number is seen;
 *       if no law passes rule 462, the shipped law stays and the peak
 *       remains wrong by a published amount.
 */

/**
 * THE OUTCOME, run once on 20 September 2026 under rule 464 and published
 * as it came out: both candidates are REFUSED, the shipped law stays —
 * and the run found that RULE 459 PICKED A JURY THAT CANNOT SEE THE
 * DEFECT IT WAS BUILT TO MEASURE. That is the finding, and it is a
 * mistake in these rules, not in the model.
 *
 * Rule 461, the peak, on rule 459's 116:
 *
 *   | law                   | mean bias | sd   | within 1 degree | worst |
 *   | --------------------- | --------- | ---- | --------------- | ----- |
 *   | boore2014             | **-0.12** | 0.74 | 78 %            | +1.25 |
 *   | campbellBozorgnia2014 | +0.06     | 0.89 | 74 %            | +1.98 |
 *   | allen2012Hypocentral  | -0.66     | 0.83 | 64 %            | +1.01 |
 *
 * Rule 461, the peak, on rule 23's 805 quiet:
 *
 *   | law                   | mean bias | sd   | within 1 degree | worst |
 *   | --------------------- | --------- | ---- | --------------- | ----- |
 *   | boore2014             | **+2.84** | 1.20 | **6 %**         | +5.72 |
 *   | campbellBozorgnia2014 | +2.20     | 1.30 | 18 %            | +5.78 |
 *   | allen2012Hypocentral  | **+1.50** | 1.30 | **43 %**        | +5.10 |
 *
 * THE SAME LAW READS -0.12 ON ONE SET AND +2.84 ON THE OTHER. A law
 * cannot be unbiased and nearly three degrees too hot at once, so one of
 * the two juries is not measuring what it claims. Both were checked
 * afterwards, on the records alone and not on any model:
 *
 *   the 116 of rule 459      record peak: min 7.01, MEDIAN 8.24
 *   the whole atlas, 1 101   record peak: min 3.60, MEDIAN 6.27
 *   the 805 quiet             record peak: min 2.39, MEDIAN 5.38
 *
 *   Rule 405 admits an earthquake to the 116 only if its ShakeMap reaches
 *   MMI 7. So the 116 are, by construction, the earthquakes whose records
 *   are HOT — a median of 8.24. And the defect rules 455 to 458 described
 *   is that the model's peak saturates near 8.3 for anything of Mw 6 and
 *   up. A model that always says 8.3, measured only on earthquakes whose
 *   records average 8.25, comes out unbiased. It would come out unbiased
 *   if it ignored its inputs entirely.
 *
 *   RULE 459 CONDITIONED ITS JURY ON THE QUANTITY IT WAS MEASURING. That
 *   is the oldest mistake there is and it went in unnoticed, because the
 *   116 had been the right jury for the four rounds before this one —
 *   AREAS at MMI VII need an MMI VII band to exist, and peaks do not.
 *
 * SO WHAT DOES THE ROUND ACTUALLY SHOW. Not that the shipped law's peak
 * is fine; rules 455 to 458 measured it wrong and nothing here undoes
 * that. What it shows is that on the only set of the two whose records
 * span the range — the quiet 805, median 5.38 — the ranking is the
 * OPPOSITE of the one rule 462 read, and it is the ranking the physics
 * predicts:
 *
 *   boore2014, no depth at the source,   6 % of peaks within a degree
 *   campbellBozorgnia2014, depth,       18 %
 *   allen2012Hypocentral, hypocentral,  **43 %**
 *
 *   A law whose distance is hypocentral cannot be asked for the shaking
 *   at zero: at the epicentre its distance IS the depth. It is seven times
 *   better at getting the peak within a degree than the law that ships.
 *
 * AND BOTH CANDIDATES FAIL RULE 462(c) ANYWAY, on the areas, in the cell
 * above Mw 7.5 — CB14 at 1.45x where the shipped law is 1.27x, and Allen
 * at **3.79x**, which is not a near miss. Allen draws the peak far better
 * and the big rings far worse. Nothing in the repository is good at both,
 * and this round is the first to know that because it is the first to
 * have measured both.
 *
 * WHAT THIS ROUND LEAVES:
 *
 *   1. The jury, before the physics. The peak must be measured on a set
 *      that is not selected on intensity, and one exists and is unread:
 *      rule 56's atlas entire, 1 101 earthquakes with a median record peak
 *      of 6.27. Rule 459 named it in its own preamble and then did not use
 *      it. The next round uses it, and its rules say so before it runs.
 *
 *   2. The two halves of the problem are now separate and both measured:
 *      a law that gets the AREAS right (Boore with the geometry of rules
 *      427 to 434, 1.137x) and a law that gets the PEAK right (Allen,
 *      hypocentral). No candidate does both, and pretending one does by
 *      measuring only one is exactly what the last five rounds did.
 *
 *   3. And a rule about rules, earned twice now. Rules 416(b) and 459 both
 *      failed by being written for the quantity in front of them without
 *      asking what their set was selected on. A clause is only as good as
 *      the jury it reads, and the jury has to be checked against the
 *      measurement, not against the round before.
 */

import { EXTENDED_SOURCE_MARGIN } from './extendedSourceRules.js';

export const PEAK_INTENSITY_RULES = 'rules 459 to 464, fixed 20 September 2026';

/** Rule 462(a): a quarter of an MMI degree, because rule 461's comparison
 *  is a lower bound and a smaller margin would be reading its slack. */
export const PEAK_MARGIN_MMI = 0.25;

/** Rule 462(c): the areas may not pay for the peak, by the same margin
 *  every cell clause in this project already uses. */
export const PEAK_AREA_MARGIN = EXTENDED_SOURCE_MARGIN;

export interface PeakReading {
  /** How many earthquakes had both numbers. */
  events: number;
  /** Mean of (model peak − record peak), MMI degrees. */
  meanBias: number;
  /** Standard deviation of the same. */
  sdBias: number;
  /** Share within one whole MMI degree either way. */
  withinOne: number;
  /** The largest overshoot, and the earthquake it happened on. */
  worst: { bias: number; id: string } | null;
}

/** Rule 461, on whatever pairs it is handed. */
export function readPeaks(
  rows: readonly { id: string; modelPeakMmi: number; recordPeakMmi: number }[]
): PeakReading {
  const kept = rows.filter(
    (r) =>
      Number.isFinite(r.modelPeakMmi) && Number.isFinite(r.recordPeakMmi) && r.recordPeakMmi > 0
  );
  if (kept.length === 0) {
    return { events: 0, meanBias: Number.NaN, sdBias: Number.NaN, withinOne: 0, worst: null };
  }
  const biases = kept.map((r) => r.modelPeakMmi - r.recordPeakMmi);
  const mean = biases.reduce((a, b) => a + b, 0) / biases.length;
  const sd =
    biases.length < 2
      ? 0
      : Math.sqrt(biases.reduce((a, b) => a + (b - mean) ** 2, 0) / (biases.length - 1));
  let worst: { bias: number; id: string } | null = null;
  kept.forEach((r, i) => {
    const bias = biases[i] ?? 0;
    if (worst === null || bias > worst.bias) worst = { bias, id: r.id };
  });
  return {
    events: kept.length,
    meanBias: mean,
    sdBias: sd,
    withinOne: biases.filter((b) => Math.abs(b) <= 1).length / biases.length,
    worst,
  };
}

/** Rule 462(a) and (b) together, on two readings of the same set. */
export function displacesOnPeak(inPlace: PeakReading, candidate: PeakReading): boolean {
  if (!Number.isFinite(inPlace.meanBias) || !Number.isFinite(candidate.meanBias)) return false;
  const closer = Math.abs(inPlace.meanBias) - Math.abs(candidate.meanBias) >= PEAK_MARGIN_MMI;
  return closer && candidate.sdBias <= inPlace.sdBias;
}
