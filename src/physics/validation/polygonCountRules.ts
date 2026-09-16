/**
 * How many people the rupture stadiums actually hold.
 *
 * Rules 94 to 97 measured the circle counter and found it up to 10.4 % from an
 * exact count of the same cells; they said in their own text that the polygon
 * counter beside it kept its 4 × 4 sub-grid until a round measured that too,
 * and that this was the obvious next round. This is it.
 *
 * The polygon counter is not the circle counter with a different shape. It
 * splits *every* cell of the footprint's bounding box, not only the ones the
 * edge crosses, because a ring has no cheap "wholly inside" test the way a
 * circle has its centre-to-centre distance. So a cell deep inside a stadium is
 * counted as 16 point-in-ring tests that all say yes, and the arithmetic that
 * matters — the rim — is the same 4 × 4 the circles were. And unlike the
 * circles, this one reaches scored rows: every extended-rupture earthquake of
 * the calibration net counts its people through it.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out: `sumGridRing` itself and what rules 94 to 97 found about its
 * sibling.
 *
 * And, as in the round before it, one thing said rather than hidden: these
 * rules were written in full — the set, the reference, the bar and what
 * decides — and then the set was counted, and only then were they committed.
 * A reader therefore has the author's word, and not a commit, that nothing
 * moved in between. It is the same weakness rules 94 to 97 declared, for the
 * same reason: a counter checked against a finer count of its own cells has
 * nothing to tune towards, so the cost is small, but it is a cost and the
 * reader should weigh it.
 *
 * The rules, fixed on 16 September 2026 and numbered after the ninety-seven
 * before them:
 *
 *   98. The polygons. Rupture stadiums, built by a fixed rule from the same
 *       centres rule 94 built its circles from: the eight most populous cells
 *       of the shipped 0.125° planet and two geometric cases, the antimeridian
 *       and 70° N, each at three shapes — a 40 km half-length with a 25 km
 *       contour, a 120 km half-length with 60 km, and a 250 km half-length
 *       with 90 km, which are about an M 6.5, an M 7.5 and a megathrust — and
 *       at a strike that turns 37° with each polygon so no two share an
 *       orientation. Thirty in all, drawn by the same
 *       `buildRuptureStadiumLatLon` the simulator draws them with.
 *   99. The exact count. The same raster, the same cells, the same ring, with
 *       every cell split 32 × 32 instead of 4 × 4. It is checked for
 *       convergence against 48 × 48 on every fifth polygon, and the two must
 *       agree to within a tenth of the bar, or the reference is not a
 *       reference and the run says so instead of scoring.
 *  100. The measure and the bar. For each polygon, |counted − exact| / exact,
 *       and the bar is docs/GOLD_STANDARD's own: every polygon within 5 %. The
 *       median, the ninetieth percentile, the worst and the three worst
 *       polygons by name are printed either way.
 *  101. What decides. If nothing misses, nothing changes. If anything misses,
 *       the candidate is the same arithmetic split 12 × 12 — the number rules
 *       94 to 97 adopted for the circle, so the two counters agree on how
 *       finely a rim is cut — and it is adopted if it brings every polygon
 *       inside the bar, costs no more than five times the wall-clock of the
 *       set, and leaves the release gate passing. The budget is looser than
 *       the circle's three because this counter splits every cell and not only
 *       the rim, so the same sub-grid costs it more; if the cost is what
 *       fails, the run says so and the obvious answer — a cheap test for the
 *       cells that are wholly inside — is left to a later round rather than
 *       invented here. The gate is not a claim that the old count was right:
 *       if a truer count takes a gated row out of its band, that is a finding
 *       about the row, but it is not something to land unattended, so the run
 *       declares it and leaves the change to whoever reads the report. No toll
 *       is re-tuned and no other rule's verdict moves; the printed figures move
 *       where the count does, as rule 44 has it.
 *
 * What these rules cannot settle. As with the circles, the reference shares
 * every assumption of the thing it checks: a cell's people spread evenly over
 * its land, the raster's planet, the ring's own vertices. A stadium is drawn
 * with a fixed number of vertices and the reference uses the same ones, so
 * nothing here says whether that polygon is the right polygon for a rupture —
 * only whether the people inside the polygon drawn are added up correctly.
 * And the smallest stadium of rule 98's set is far larger than the smallest
 * circle of rule 94's: about 130 km by 80 km against a circle 40 km across.
 * Whatever this round finds is therefore about the size a rupture stadium
 * actually has, which is the size that matters here, and says nothing about
 * what the same counter would do on a footprint a few cells wide.
 */

/** Rule 98: the three stadium shapes, in metres. */
export const POLYGON_COUNT_SHAPES: readonly {
  name: string;
  halfLengthM: number;
  halfWidthM: number;
  contourRadiusM: number;
}[] = [
  { name: 'M 6.5', halfLengthM: 40_000, halfWidthM: 15_000, contourRadiusM: 25_000 },
  { name: 'M 7.5', halfLengthM: 120_000, halfWidthM: 20_000, contourRadiusM: 60_000 },
  { name: 'megathrust', halfLengthM: 250_000, halfWidthM: 75_000, contourRadiusM: 90_000 },
];

/** Rule 98: how many populous centres the set takes, and the turn of strike
 *  between one polygon and the next. */
export const POLYGON_COUNT_CENTRES = 8;
export const POLYGON_COUNT_STRIKE_STEP_DEG = 37;

/** What the product splits a cell into, and rule 99's reference and its
 *  convergence check. */
export const POLYGON_COUNT_IN_PLACE_SUBSAMPLES = 4;
export const POLYGON_COUNT_EXACT_SUBSAMPLES = 32;
export const POLYGON_COUNT_CONVERGENCE_SUBSAMPLES = 48;

/** Rule 100: the bar. */
export const POLYGON_COUNT_BAR = 0.05;

/** Rule 101: the candidate's sub-grid, and the most time it may cost. */
export const POLYGON_COUNT_CANDIDATE_SUBSAMPLES = 12;
export const POLYGON_COUNT_TIME_FACTOR = 5;

export interface PolygonCountReading {
  scored: number;
  medianError: number;
  ninetiethError: number;
  worstError: number;
  meetsBar: boolean;
}

/** Rule 101: whether anything has to change, and whether the candidate does it. */
export function choosePolygonCount(input: {
  referenceConverged: boolean;
  inPlace: PolygonCountReading;
  candidate: PolygonCountReading;
  timeFactor: number;
  gatePasses: boolean;
}): { changes: boolean; adopted: boolean; reason: string } {
  if (!input.referenceConverged) {
    return {
      changes: false,
      adopted: false,
      reason: 'the reference did not converge, so nothing was scored (rule 99)',
    };
  }
  if (input.inPlace.meetsBar) {
    return {
      changes: false,
      adopted: false,
      reason: 'every polygon is already within the bar (rule 101)',
    };
  }
  const fits = input.timeFactor <= POLYGON_COUNT_TIME_FACTOR;
  const adopted = input.candidate.meetsBar && fits && input.gatePasses;
  return {
    changes: true,
    adopted,
    reason: adopted
      ? 'the finer sub-grid brings every polygon inside the bar within the time budget'
      : !input.candidate.meetsBar
        ? 'the finer sub-grid does not bring every polygon inside the bar (rule 101)'
        : !fits
          ? 'the finer sub-grid works but costs more than the budget, and the cheap test for the cells wholly inside is left to a later round (rule 101)'
          : 'the finer sub-grid works, but a gated row leaves its band under it, so it is declared and left to the reader (rule 101)',
  };
}
