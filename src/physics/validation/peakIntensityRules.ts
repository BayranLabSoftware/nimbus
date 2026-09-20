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
