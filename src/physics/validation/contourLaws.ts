import type { ContourLaw } from '../events/earthquake/simulate.js';
import { SIZE_BANDS, sizeBandOf } from './scorecard.js';
import type { MmiThreshold } from './shakemapFootprint.js';

/**
 * Which law draws the intensity rings: chosen on the ground's shaking,
 * checked on the dead.
 *
 * On 14 September 2026, once the harness counted a great earthquake's
 * rupture stadium as the simulator does (B-022), the earthquakes of
 * Mw 7.5 and above held out by rule read 13.85 times their record. The
 * rings are Joyner & Boore 1981's, a relation fitted on data that stop
 * near Mw 7.7 and draw no saturation beyond, stretched along the
 * rupture. Choosing a replacement on those same death tolls would fit
 * the law to the set that found the fault. So the choice is made on the
 * quantity the law predicts — how much ground shook how hard, which
 * USGS ShakeMap measures for every one of these earthquakes — and the
 * tolls only check it.
 *
 * The rules, fixed before any candidate but the shipped law was run on a
 * ShakeMap or a toll of these earthquakes, and numbered after the
 * sixteen in heldOutEvents.ts and heldOutByRule.ts:
 *
 *  17. The candidates, each written before this rule (`ContourLaw` in
 *      events/earthquake/simulate.ts): the shipped `joynerBoore1981`;
 *      `boore2014`, Boore et al. 2014's median PGA with its fault-type
 *      and site terms, the law tried on 9 September 2026 and implemented
 *      since as `distanceForPgaNGAWest2`; and `boore2014FromMw7.5`, the
 *      first below Mw 7.5 and the second from it, where the rings become
 *      a stadium. All take each intensity's PGA from Worden et al. 2012,
 *      and none has a coefficient fitted to anything here.
 *  18. Selection on shaking. For every earthquake of rule 11's set
 *      whose USGS ComCat event carries a ShakeMap, the ground area at or
 *      above MMI VII, VIII and IX in the preferred ShakeMap's
 *      low-resolution MMI coverage, summed as `pnpm shakemap:build` sums
 *      it (scripts/build-rule-shakemaps.ts writes them, before any
 *      candidate is run on them). Each candidate's area is the
 *      simulator's, disc or stadium, on rule 12's inputs. A pair where
 *      either area is above zero scores half the log of the ratio of
 *      the two areas, each plus 10 km² — a radius ratio, floored at
 *      about the smallest footprint either side resolves. A candidate's
 *      bias in a magnitude cell of the scorecard is the mean of its
 *      scores there; the winner has the smallest mean absolute bias over
 *      the three cells. The shipped law stays unless the winner beats it
 *      by 0.05 or more.
 *  19. Checked on the dead. A winner other than the shipped law runs
 *      once on rule 11's tolls, with the harness as B-022 left it, and
 *      the report prints both laws' figures whatever they read. It
 *      replaces the shipped law in the simulator if its mean absolute
 *      log bias over the three magnitude cells of the tolls is no larger
 *      than the shipped law's, and its band holds at least eight records
 *      in ten, among the rows with something, in every cell. Rows of the
 *      net that then leave their band are ungated with their cause and
 *      never re-tuned (rules 5 and 6).
 *
 * ShakeMap is not a pure measurement either: it blends the stations and
 * felt reports with a ground-motion model and a map of site conditions,
 * where the candidates stand on reference rock (rule 3). Both sides of
 * every comparison carry that, and a candidate that reads high on rock
 * has an unearned advantage over one that is right on rock; the report
 * says so beside the figures.
 */

/** A ShakeMap's footprint, as scripts/build-rule-shakemaps.ts stores it. */
export interface ShakemapAreas {
  /** The ComCat event, which is also the rule-11 row's key. */
  comcat: string;
  maxMmi: number;
  areaKm2: Readonly<Record<MmiThreshold, number>>;
}

/** Added to both areas before their ratio is taken (rule 18). */
export const CONTOUR_AREA_FLOOR_KM2 = 10;

/** How much better a candidate must do to replace the shipped law. */
export const CONTOUR_LAW_MARGIN = 0.05;

export const CONTOUR_LAWS: readonly ContourLaw[] = [
  'joynerBoore1981',
  'boore2014',
  'boore2014FromMw7.5',
];

/** Half the log of the floored area ratio: a log radius ratio. Null
 *  when neither side reaches the threshold. */
export function contourScore(modelKm2: number, observedKm2: number): number | null {
  if (!(modelKm2 > 0) && !(observedKm2 > 0)) return null;
  return (
    0.5 *
    Math.log(
      (Math.max(modelKm2, 0) + CONTOUR_AREA_FLOOR_KM2) /
        (Math.max(observedKm2, 0) + CONTOUR_AREA_FLOOR_KM2)
    )
  );
}

export interface ContourPair {
  magnitude: number;
  threshold: MmiThreshold;
  modelKm2: number;
  observedKm2: number;
}

export interface ContourCell {
  sizeBand: string;
  /** Pairs scored: at least one side above zero. */
  pairs: number;
  /** Mean log radius ratio; null without pairs. */
  bias: number | null;
  /** Standard deviation of the log radius ratio; null below two pairs. */
  scatter: number | null;
  /** The model shakes ground at an intensity the ShakeMap never
   *  reached. */
  invented: number;
  /** The ShakeMap reached an intensity the model never does. */
  missed: number;
}

export function scoreContours(pairs: readonly ContourPair[]): ContourCell[] {
  return SIZE_BANDS.earthquake.map((band) => {
    const inBand = pairs.filter((p) => sizeBandOf('earthquake', p.magnitude) === band.label);
    const scores = inBand
      .map((p) => contourScore(p.modelKm2, p.observedKm2))
      .filter((s): s is number => s !== null);
    const mean = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    const scatter =
      mean !== null && scores.length >= 2
        ? Math.sqrt(scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length)
        : null;
    return {
      sizeBand: band.label,
      pairs: scores.length,
      bias: mean,
      scatter,
      invented: inBand.filter((p) => p.modelKm2 > 0 && !(p.observedKm2 > 0)).length,
      missed: inBand.filter((p) => p.observedKm2 > 0 && !(p.modelKm2 > 0)).length,
    };
  });
}

/** Mean absolute bias over the cells that have pairs. */
export function meanAbsoluteBias(cells: readonly { bias: number | null }[]): number {
  const biases = cells.map((c) => c.bias).filter((b): b is number => b !== null);
  return biases.length === 0
    ? Number.POSITIVE_INFINITY
    : biases.reduce((a, b) => a + Math.abs(b), 0) / biases.length;
}

/** Rule 18's choice among any candidates: the one with the smallest
 *  mean absolute bias, if it beats the one in place by the margin, and
 *  the one in place otherwise. Rules 21 and 22 of siteVs30.ts choose
 *  with it too. */
export function chooseCandidate<T extends string>(
  candidates: readonly T[],
  inPlace: T,
  scores: Readonly<Record<T, readonly { bias: number | null }[]>>
): { winner: T; meanAbsoluteBias: Record<T, number> } {
  const measured = Object.fromEntries(
    candidates.map((c) => [c, meanAbsoluteBias(scores[c])])
  ) as Record<T, number>;
  let best = inPlace;
  for (const c of candidates) {
    if (measured[c] < measured[best]) best = c;
  }
  const winner = measured[inPlace] - measured[best] >= CONTOUR_LAW_MARGIN ? best : inPlace;
  return { winner, meanAbsoluteBias: measured };
}

/** Rule 18's winner. The law in place was Joyner & Boore 1981 when rule
 *  18 ran, and is Boore et al. 2014 since rule 19 adopted it. */
export function chooseContourLaw(
  scores: Readonly<Record<ContourLaw, readonly ContourCell[]>>,
  inPlace: ContourLaw
): { winner: ContourLaw; meanAbsoluteBias: Record<ContourLaw, number> } {
  return chooseCandidate(CONTOUR_LAWS, inPlace, scores);
}

/** Rule 19's test of a winner on the tolls: per magnitude cell, the
 *  log of the toll bias and the share inside among rows with
 *  something. */
export function adoptOnTolls(
  shipped: readonly { bias: number | null }[],
  winner: readonly { bias: number | null; inside: number; rows: number }[]
): boolean {
  const logged = (cells: readonly { bias: number | null }[]) =>
    cells.map((c) => ({ bias: c.bias === null ? null : Math.log(c.bias) }));
  if (meanAbsoluteBias(logged(winner)) > meanAbsoluteBias(logged(shipped))) return false;
  return winner.every((c) => c.rows === 0 || c.inside / c.rows >= 0.8);
}
