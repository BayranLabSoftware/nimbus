import { EXTENDED_SOURCE_CELLS, EXTENDED_SOURCE_MARGIN } from './extendedSourceRules.js';

/**
 * The stadium on the rupture's surface projection: a vertical fault
 * outcrops as a line, not as a fifteen-kilometre band.
 *
 * WHAT WAS LOOKED AT BEFORE THESE RULES WERE WRITTEN. The round of rules
 * 412 to 418 ran once and was published whole (6846268). It refused
 * `extendedSource: 'always'` on the dead — Pohang 2017 killed nobody and
 * the candidate's band lifted off zero, [0–37746] to [2–91004] — while
 * showing that the shape IS the cause of the hole between Mw 6.5 and 7.5:
 * the broken cell moved from 0.22x to 1.62x and the cell above Mw 7.5 did
 * not move at all. Its closing note named where the overshoot comes from,
 * and this round is that note turned into a candidate.
 *
 * THE DEFECT. A rupture is a plane of length L along strike and width W
 * DOWN DIP, and `surfaceRuptureWidth` returns W and says so in as many
 * words: "Returned as a true down-dip distance (NOT the surface
 * projection). For megathrusts with shallow dip the surface projection
 * W·cos(δ) is within ~5 % of W; the renderer uses W directly when laying
 * out the stadium polygon and absorbs the small projection mismatch into
 * the contour caveat list."
 *
 * That is sound for what the stadium was built for. The stadium was drawn
 * from Mw 7.5, which in 2025 meant mostly megathrusts, and a megathrust
 * dips shallowly, so cos δ is near 1 and W is very nearly its own shadow.
 *
 * It is not sound anywhere else, and the simulator's own dip table says so:
 *
 *   strike-slip   dip 90°   cos δ = 0.00
 *   normal        dip 55°   cos δ = 0.57
 *   reverse       dip 45°   cos δ = 0.71
 *
 * A vertical strike-slip fault has NO surface width. It reaches the ground
 * as a line. The model lays W kilometres of footprint across it anyway —
 * for a Mw 7.3 that is about fifteen kilometres of ground, on both flanks,
 * that the rupture does not project onto. And an unknown mechanism is
 * drawn as strike-slip, which is 80 of the 116 earthquakes of rule 405's
 * jury, so this is the common case and not the corner.
 *
 * The projection is ALREADY COMPUTED. `simulate.ts` works out
 * `halfWidthKm = (W / 2) · cos δ` and has since rule 391, because Campbell
 * & Bozorgnia's hanging-wall term needs R_x, the distance across strike
 * from the rupture's surface trace. The number the footprint should be
 * using is sitting two hundred lines above the place it is not used.
 *
 * The rules, fixed on 20 September 2026, numbered after the 418 before
 * them:
 *
 *  419. The candidate, with no free parameter and no new constant.
 *       `stadiumWidth: 'surfaceProjection'` — the footprint's half width
 *       across strike is (W / 2) · cos δ, on the dip the simulator already
 *       assigns by style and the projection it already computes. The
 *       rupture itself does not change: `ruptureWidth` stays the true
 *       down-dip width, because that is what it is and the tsunami source
 *       reads it. What changes is only the shape laid on the ground.
 *
 *  420. Two arms, because the fix can only bite where a stadium is drawn.
 *       Below Mw 7.5 an unmarked scenario is a disc, so on its own the
 *       projection cannot touch the cell that is broken. Both are measured
 *       against the geometry in place, in one run:
 *
 *         A  `surfaceProjection` alone, the disc below Mw 7.5 as now. It
 *            can move only the Mw ≥ 7.5 cell. It is expected to FAIL rule
 *            424(a) by construction, and it is run anyway, because it is
 *            what isolates the width change from the threshold change.
 *         B  `surfaceProjection` together with `extendedSource: 'always'`.
 *            This is the proposal: the stadium at every magnitude, laid on
 *            the ground the rupture actually projects onto.
 *
 *       Printing A is what stops B from being two changes measured as one.
 *
 *  421. The domain, and a limit stated before the run rather than after it.
 *       The candidate reaches a scenario that is neither marked a
 *       subduction interface nor deeper than 70 km — the domain of rule
 *       412, unchanged. A MARKED scenario keeps both rule 44's threshold
 *       and its width, and the reason is not deference: the dip table above
 *       has no megathrust in it. A real interface dips 15 to 25 degrees and
 *       that table would hand it 45, so projecting a megathrust with this
 *       dip would be worse physics and not better. The table is a crustal
 *       stand-in and is used only where it stands for something.
 *
 *       This is the honest weakness of the candidate and it is written here
 *       first: the dip is a constant per style, not a measured dip. Where a
 *       fault's real dip is known — the GEM tiles carry one — reading it is
 *       a later round, and it can only help.
 *
 *  422. The jury and the measurement, unchanged from rules 405 to 407 and
 *       414: the same 116 earthquakes, the scenario built from each ComCat
 *       row, the model's area off the FIELD, the record's area the atlas's
 *       own, `boore2014` deciding and Campbell & Bozorgnia 2014 printed
 *       beside it. The six fixtures reported and deciding nothing.
 *
 *  423. Exactly what it claims and nothing else. A test holds the candidate
 *       to draw what the geometry in place draws, to the last digit, for
 *       every scenario marked a subduction interface, every scenario deeper
 *       than 70 km, and — for arm A — every scenario below Mw 7.5. And it
 *       holds `ruptureWidth` itself equal under both, so that nothing
 *       downstream of the rupture, the tsunami above all, can have moved.
 *
 *  424. The verdict, the five clauses of rule 416 and a sixth. An arm
 *       replaces the geometry in place only if ALL hold:
 *
 *       (a) the worst of the three cells improves by at least
 *           `EXTENDED_SOURCE_MARGIN`;
 *       (b) no cell's |ln bias| grows by more than that margin;
 *       (c) overall, the geometric mean no further from 1 and the scatter
 *           no wider;
 *       (d) the dead, on the net rows: no fewer records inside their
 *           predictive band, and none lost;
 *       (e) monotonicity in magnitude, zero inversions;
 *
 *       (f) AND NO CELL CHANGES THE SIGN of its ln bias unless its |ln
 *           bias| falls by at least the margin. This is the clause rule
 *           416(b) turned out not to be. Last round the smallest cell went
 *           from 0.56x to 1.84x — under by 1.8, then over by 1.8 — and
 *           (b) waved it through, because |ln| grew by only 0.037 and a
 *           clause that measures distance from centred cannot see a sign
 *           change. Trading an under-draw for an equal over-draw is not an
 *           improvement, and from here it fails.
 *
 *  425. What an adoption does. Adopted, the arm's settings become the
 *       defaults, every consumer that lays a stadium on the ground reads
 *       the footprint width rather than the rupture width — the field, the
 *       harness footprint, the casualty stadium and the globe — and the
 *       figures of the rules that ran on the old geometry move, as rule 44
 *       has it. If arm B is adopted, rule 417's note about rule 51's
 *       distance applies with it.
 *
 *  426. One run, no re-tuning. If a clause of rule 424 fails for an arm,
 *       that arm is not adopted, the numbers are published as they came
 *       out, and what was learned is written down. No dip, bound or
 *       threshold is adjusted after a number is seen.
 */

export const SURFACE_PROJECTION_RULES = 'rules 419 to 426, fixed 20 September 2026';

/** Rule 424: the cells and the margin, both imported so that this round
 *  and the one before it cannot drift apart. */
export const SURFACE_PROJECTION_CELLS = EXTENDED_SOURCE_CELLS;
export const SURFACE_PROJECTION_MARGIN = EXTENDED_SOURCE_MARGIN;

/**
 * Rule 424(f): a cell that crossed from under-drawing to over-drawing, or
 * back, without getting materially closer to centred.
 *
 * Returns the labels that fail. A cell missing from either reading is not
 * judged — there is nothing to compare — rather than counted as passing.
 */
export function cellsThatFlippedSign(
  before: Readonly<Record<string, number | null>>,
  after: Readonly<Record<string, number | null>>,
  margin = SURFACE_PROJECTION_MARGIN
): string[] {
  const failed: string[] = [];
  for (const [label, was] of Object.entries(before)) {
    // Typed wide on purpose: a label absent from `after` reads undefined at
    // run time whatever the Record type says, and that cell must be skipped
    // rather than judged.
    const now: number | null | undefined = after[label];
    if (was === null || now === null || now === undefined) continue;
    if (!(was > 0) || !(now > 0)) continue;
    const a = Math.log(was);
    const b = Math.log(now);
    // Sign unchanged, or one side is exactly centred: nothing to judge.
    if (a === 0 || b === 0 || a * b > 0) continue;
    if (Math.abs(a) - Math.abs(b) < margin) failed.push(label);
  }
  return failed;
}
