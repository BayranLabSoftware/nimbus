/**
 * Rules 571 to 578 — I3's band from the reference's own three models,
 * 21 September 2026, written and pushed before the measurement.
 *
 * WHERE THIS COMES FROM. Rules 563 to 570 measured I3 and found three
 * things: the felled forest at Tunguska sits between the two thresholds the
 * field names rather than outside one of them; the model reads 0.66 to 0.90
 * of Collins et al. 2017's published ranges, with Chelyabinsk inside; and
 * I3's ×3 width cannot come from a band over the impactor population,
 * because at the 99th percentile of burst altitude the thresholds are not
 * reached at all. A band for I3 has to be conditioned on the scenario.
 *
 * RULE 571. WHAT THE BAND IS MADE OF. Not a spread this project chooses.
 * Collins et al. 2017's abstract, in full:
 *
 *   "Predicted overpressures from all three models are broadly consistent at
 *    radial distances from ground zero that exceed three times the burst
 *    height. At smaller radial distances, the moving-source model predicts
 *    overpressures two times greater than the static-source model, whereas
 *    the cylindrical line-source model predicts overpressures two times
 *    lower than the static-source model."
 *
 * The product draws the static source. The band is therefore the static
 * source's own overpressure taken at half and at double, inside three burst
 * heights, and the static source itself beyond them — the reference's
 * assessment of its own approximation, evaluated at the scenario's own burst
 * altitude and yield.
 *
 * In radius at a threshold T that is:
 *
 *     R_high(T) = R_static(T / 2)     the moving source reaches T where the
 *                                     static reaches half of it
 *     R_low(T)  = R_static(2 T)       the line source, the other way
 *
 * both clipped to three burst heights, beyond which all three agree and the
 * band is the static value.
 *
 * RULE 572. WHAT THE BODY OF THE PAPER SAYS, which is not the same. Its
 * §"Airblast model comparison" reads "The cylindrical line-source
 * approximation predicts overpressures 2–4 times lower than the
 * static-source approximation depending on the airburst energy". The
 * abstract rounds that to two. The round measures the band BOTH ways — with
 * the low edge at T×2 and at T×4 — and reports both, because which one a
 * band should use is a question about the reference and not about this
 * model. Neither is chosen here.
 *
 * RULE 573. THE THREE CHECKS, fixed now.
 *
 *   (a) WIDTH. I3 allows a band no wider than ×3 in radius. Measured at
 *       each of the three published cases and reported.
 *   (b) TUNGUSKA. The band must hold the felled forest's 26.5 km equivalent
 *       radius at a plausible energy. Measured at 5, 10, 15, 20 and 30 Mt
 *       at both tree-damage thresholds, and every answer printed.
 *   (c) CHELYABINSK. The band must hold the ~50 km of broken windows.
 *
 * RULE 574. WHAT WOULD MAKE THIS FAIL HONESTLY. Any of:
 *   (a) a width above ×3 under the abstract's factor of two;
 *   (b) the band missing Tunguska at every energy between 5 and 30 Mt;
 *   (c) the band missing Chelyabinsk;
 *   (d) the band not containing the static source, which would mean the
 *       arithmetic is the wrong way round.
 *
 * (d) is there because it is the mistake this construction invites: the
 * higher-overpressure model gives the LARGER radius, so the band's high
 * edge is the static reach at HALF the threshold, and getting that backwards
 * would produce a band that looks plausible and is inverted.
 *
 * RULE 575. NO ADOPTION HERE EITHER. This round measures whether the band
 * I3 needs can be built this way. Building it into the product means the
 * report and the panel print three numbers where they print one, and that
 * is a round with its own rules. Three measurements in a row without an
 * adoption is not indecision: each one told the next where to look, and the
 * first two would have built the wrong band.
 *
 * RULE 576. WHAT IS NOT CLAIMED. That the band is right. It is the
 * reference's own statement of how much its approximations disagree, which
 * is not the same as the uncertainty of the true answer — the three models
 * could agree and all be wrong. I3 asks for a band that holds the measured
 * footprints and 90 % of the shock-physics runs, and holding them is
 * evidence the band is not too narrow, never that it is right.
 *
 * RULE 577. THE 90 % OF THE RUNS is NOT measured here. It needs Table 2's
 * numbers, which do not extract from the paper's PDF — the table is set
 * sideways and every text extractor this repository has returns the page
 * without it. Reading them off an image is a job for a careful hour, not a
 * guess at four in the morning, and I3 is not closable until it is done.
 * The round says so rather than quietly scoring the two checks it can make.
 *
 * RULE 578. ONE RUN.
 */

/** Rule 571: the abstract's factor, on overpressure, relative to the static
 *  source, inside three burst heights. */
export const MOVING_SOURCE_FACTOR = 2;
export const LINE_SOURCE_FACTOR_ABSTRACT = 2;
/** Rule 572: what the body says instead, at the far end of its range. */
export const LINE_SOURCE_FACTOR_BODY = 4;

/** Rule 571: beyond this many burst heights the three models agree and the
 *  band closes to the static source. */
export const AGREEMENT_BURST_HEIGHTS = 3;

/** Rule 573(a): I3's limit on a band's width in radius. */
export const WIDTH_LIMIT = 3;

export const THREE_MODEL_RULES = 'rules 571 to 578, fixed 21 September 2026';
