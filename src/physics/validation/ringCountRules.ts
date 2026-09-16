/**
 * How many people the rings actually hold.
 *
 * Every toll this project prints begins with a count: the people inside a
 * circle on a raster. The raster's cells are squares in degrees and the circle
 * is a circle, so the cells its edge crosses have to be split. Nimbus splits
 * them into a 4 × 4 sub-grid and counts the sub-cells whose centres fall
 * inside, and the module's own header calls the leftovers "the ±few-percent
 * noise floor" without ever having measured them.
 *
 * docs/GOLD_STANDARD asks (I4, and the same clause under every other letter)
 * that the people inside each ring be counted within 5 % of an exact count on
 * the same raster. That has never been measured. These rules measure it.
 *
 * This is a verification, not a validation: the reference is not the world but
 * a far finer count of the very same cells, so what it can say is whether the
 * arithmetic of the footprint is right, and nothing at all about whether the
 * raster knows where people live. The rasters' own error against a census is a
 * separate matter, declared elsewhere in the validation report.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out: `sumGridCircle` itself and the 4 × 4 sub-grid it uses; the shipped
 * rasters' shape (0.125° planet, 2.5′ tiles) and the radius at which the
 * harness moves from one to the other.
 *
 * And one thing more, which is said rather than hidden: unlike rules 76 to 93,
 * these were not committed before their set was first counted. The set was
 * counted once while they were being written, and what it showed — that the
 * count in place misses the bar on small circles and that a finer sub-grid
 * makes it — was known before rule 97 was finished. The guard about the
 * release gate in rule 97 was added after that first count. It costs less here
 * than it would anywhere else in this protocol, because the reference is
 * arithmetic on the very same cells and not a measurement of the world: there
 * is nothing to tune towards, and a rule written to flatter the result would
 * have to be a rule about arithmetic. But it is a weaker pre-registration than
 * the rounds before it, and the reader should weigh it as one.
 *
 * The rules, fixed on 16 September 2026 and numbered after the ninety-three
 * before them:
 *
 *  94. The circles. Built by a fixed rule, not chosen: the sixteen most
 *      populous cells of the shipped 0.125° planet, eight more drawn from the
 *      populated cells by a seeded generator, and four fixed geometric cases —
 *      a circle straddling the antimeridian, one at 70° N where the cells are
 *      a quarter as wide as they are tall, one on the equator, and one in the
 *      southern ocean where almost every cell is empty. Each centre is counted
 *      at radii of 20, 50, 100, 200, 500, 1 000, 2 000 and 5 000 km. A circle
 *      narrower than one cell of the raster it is read on is left out of the
 *      bar and counted apart: the raster does not say where inside a cell its
 *      people live, so there is no exact answer to compare against, and what
 *      the code does there — the cell's land density times the circle's area —
 *      is a model and not an arithmetic.
 *  95. The exact count. The same raster, the same cells, the same view the
 *      product reads, and the same geometry — a cell wholly inside counts in
 *      full and one wholly outside not at all, both exact by definition — with
 *      the cells the edge crosses split 48 × 48 instead of 4 × 4. It is
 *      checked for convergence: on every fourth circle the same count is taken
 *      at 96 × 96, and the two must agree to within a tenth of the bar, or the
 *      reference is not a reference and the run says so instead of scoring.
 *  96. The measure and the bar. For each circle, |counted − exact| / exact.
 *      I4 says "within 5 %", of each ring and not of the median, so the bar is
 *      that every circle of rule 94's set that is at least one cell across
 *      lies within 5 %. The median, the ninetieth percentile, the worst and
 *      the three worst circles by name are printed either way.
 *  97. What decides. If nothing misses, nothing changes and the clause is met:
 *      the run says so and the report prints it. If anything misses, the
 *      candidate is the same arithmetic with the edge cells split 12 × 12
 *      instead of 4 × 4 — the plainest fix there is, and no new physics — and
 *      it is adopted if three things hold: it brings every circle inside the
 *      bar; it costs no more than three times the wall-clock of the set, which
 *      is the budget a globe redrawing its rings can pay; and the release gate
 *      stays PASS. The last is not a claim that the old count was right. If a
 *      truer count takes a gated row out of its band, that is a finding about
 *      the row and not a reason to keep counting wrongly — but it is also not
 *      something to land unattended, so the run declares it and leaves the
 *      change to whoever reads the report. Only the circle count moves: the
 *      polygon counter beside it, which an extended rupture uses and which
 *      scored rows depend on, keeps its 4 × 4 until a round measures it too.
 *      Whatever happens, no toll is re-tuned and no other rule's verdict
 *      moves; the printed figures move where the count does, as rule 44 has
 *      it.
 *
 * What these rules cannot settle. The reference shares every assumption of the
 * thing it checks: that a cell's people are spread evenly over its land, that
 * the raster's 0.125° planet is the right planet, that a great-circle distance
 * is the right distance. If the cell's people are all in one corner, both
 * counts are wrong together and this says nothing. Nor does it touch the
 * polygon counter that an extended rupture uses, the stadium counter beside
 * it, or the WorldPop zonal-statistics backend, which no offline run can
 * reach.
 */

/** Rule 94: the radii every centre is counted at (m). */
export const RING_COUNT_RADII_M: readonly number[] = [
  20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000,
];

/** Rule 94: how many centres come from where. */
export const RING_COUNT_MOST_POPULOUS = 16;
export const RING_COUNT_DRAWN = 8;

/** Rule 95: the sub-grid the exact count splits an edge cell into, and the
 *  finer one it is checked against. */
export const RING_COUNT_EXACT_SUBSAMPLES = 48;
export const RING_COUNT_CONVERGENCE_SUBSAMPLES = 96;

/** Rule 96: the bar I4 sets. */
export const RING_COUNT_BAR = 0.05;

/** Rule 97: the candidate's sub-grid, and the most time it may cost. */
export const RING_COUNT_CANDIDATE_SUBSAMPLES = 12;
export const RING_COUNT_TIME_FACTOR = 3;

export interface RingCountReading {
  /** Circles at least one cell across — the ones the bar is about. */
  scored: number;
  /** Circles narrower than a cell, counted apart (rule 94). */
  belowACell: number;
  medianError: number;
  ninetiethError: number;
  worstError: number;
  /** Every scored circle is within the bar. */
  meetsBar: boolean;
}

/** Rule 97: whether anything has to change, and whether the candidate does it. */
export function chooseRingCount(input: {
  /** Rule 95's convergence check passed, so the reference is a reference. */
  referenceConverged: boolean;
  inPlace: RingCountReading;
  candidate: RingCountReading | null;
  /** The candidate's wall-clock over the count in place. */
  timeFactor: number | null;
  /** The release gate still passes under the candidate. */
  gatePasses?: boolean;
}): { changes: boolean; adopted: boolean; reason: string } {
  if (!input.referenceConverged) {
    return {
      changes: false,
      adopted: false,
      reason: 'the reference did not converge, so nothing was scored (rule 95)',
    };
  }
  if (input.inPlace.meetsBar) {
    return {
      changes: false,
      adopted: false,
      reason: 'every circle is already within the bar (rule 97)',
    };
  }
  if (input.candidate === null || input.timeFactor === null) {
    return { changes: false, adopted: false, reason: 'the candidate was not run' };
  }
  const fits = input.timeFactor <= RING_COUNT_TIME_FACTOR;
  const gate = input.gatePasses ?? true;
  const adopted = input.candidate.meetsBar && fits && gate;
  return {
    changes: true,
    adopted,
    reason: adopted
      ? 'the finer sub-grid brings every circle inside the bar within the time budget'
      : !input.candidate.meetsBar
        ? 'the finer sub-grid does not bring every circle inside the bar (rule 97)'
        : !fits
          ? 'the finer sub-grid works but costs more than the budget (rule 97)'
          : 'the finer sub-grid works, but a gated row leaves its band under it, so it is declared and left to the reader (rule 97)',
  };
}
