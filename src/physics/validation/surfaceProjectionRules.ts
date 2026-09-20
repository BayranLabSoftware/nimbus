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

/**
 * THE OUTCOME, run once on 20 September 2026 under rule 426 and published
 * as it came out: BOTH ARMS ARE REFUSED, the geometry in place stays, and
 * the round found the weakness rule 421 had declared before it ran.
 *
 * The map, on the 116, with `boore2014`:
 *
 *   | arm                  | bands | mean   | scatter | Mw < 6.5 | Mw 6.5–7.5 | Mw >= 7.5 |
 *   | -------------------- | ----- | ------ | ------- | -------- | ---------- | --------- |
 *   | in place             | 165   | 0.393x | 1.579   | 0.56x    | 0.22x      | 1.27x     |
 *   | A projection         | 165   | 0.353x | 1.507   | 0.56x    | 0.22x      | 0.73x     |
 *   | B projection+always  | 169   | 0.865x | 1.283   | **1.01x** | **0.85x** | 0.73x     |
 *
 * THE PREDICTION WAS RIGHT, and it is worth saying plainly because the
 * point of writing a closing note is that it can be wrong. Rules 412 to
 * 418 refused `extendedSource: 'always'` for overshooting — 1.84x and
 * 1.62x in the two lower cells — and named the down-dip width as the
 * reason. Project the width and the overshoot is gone: the same two cells
 * read 1.01x and 0.85x. The smallest earthquakes, which the geometry in
 * place draws at 0.56x and the last candidate at 1.84x, land on ONE. The
 * hole between Mw 6.5 and 7.5 goes from 0.22x to 0.85x. Overall the bias
 * moves from 0.393x to 0.865x and the scatter from 1.579 to 1.283 — the
 * best geometry measured in this whole line of rounds.
 *
 * AND IT IS STILL REFUSED, for two reasons that are now located exactly.
 *
 * FIRST, rule 424(b) and (f), on the largest cell: Mw >= 7.5 goes from
 * 1.273x to 0.731x. It crosses from over-drawing to under-drawing and its
 * |ln bias| grows by 0.072, past the 0.05 margin — so the clause written
 * last round to catch a sign change caught one, on its first outing, and
 * caught the candidate that introduced it. Arm A isolates the cause
 * completely: it changes NOTHING but the width, the two lower cells do not
 * move by a digit, and that cell alone falls from 1.273x to 0.731x.
 *
 * WHY, measured: of the 20 earthquakes of the jury at Mw 7.5 and above,
 * ELEVEN have no mechanism in the catalogue. CB14's neutral case is
 * strike-slip, strike-slip means dip 90 degrees, and cos 90 is zero, so
 * their footprint width comes out at exactly 0.0 km. They are:
 *
 *   usp0000888  Mw 7.6  77 km WSW of Callao, Peru
 *   hv19755025  Mw 7.7  Hawaii
 *   usp0000ex3  Mw 7.5  Los Amates, Guatemala
 *   usp0000hvb  Mw 7.9  Palimbang, Philippines
 *   usp0000xp7  Mw 7.7  San Agustín Loxicha, Mexico
 *
 *   Peru, Guatemala, the Philippines, Oaxaca. These are SUBDUCTION
 *   earthquakes. They dip fifteen to twenty-five degrees, their surface
 *   projection is about 0.95 W, and the model hands them a vertical fault
 *   and a projection of nothing. They are not marked `subductionInterface`
 *   because that flag is a thing a user ticks, and an atlas row does not
 *   tick it.
 *
 *   Rule 421 said this before the run, in its own words: "the dip is a
 *   constant per style, not a measured dip... Where a fault's real dip is
 *   known — the GEM tiles carry one — reading it is a later round, and it
 *   can only help." The run did not discover a new problem; it measured
 *   the size of the one that was declared. What it adds is that the
 *   declared weakness is not small and not confined to marked scenarios:
 *   it is more than half of the largest cell.
 *
 * SECOND, rule 424(d), the dead: Pohang 2017 is still lost, and the
 * projection nearly but does not quite rescue it —
 *
 *   in place            central 129  band [0–37746]  contains 0
 *   always only         central 501  band [2–91004]  misses
 *   projection + always central 428  band [1–81833]  misses
 *
 *   The projection pulls the low end from 2 to 1 and the central figure
 *   from 501 to 428, and the band still cannot say "possibly nobody" about
 *   an earthquake that killed nobody. This one is not the width: at Mw 5.5
 *   the projected width is zero already, so what is left is the stadium's
 *   length — five kilometres of line grown by the ring radius — and that
 *   alone is enough to put somebody inside the lethal band in all two
 *   hundred realisations. Amatrice 2016 is gained in exchange, as before.
 *
 * WHAT THIS ROUND LEAVES, and the next one is not a guess:
 *
 *   1. THE DIP. Read the fault's real dip where the repository already
 *      knows it. `shippedStrikeAnswer` consults the slab model and the GEM
 *      fault tiles for the strike already, on the same call, for the same
 *      scenario; the dip is beside the strike in both. A round that takes
 *      the dip from where the strike comes from would give those eleven
 *      subduction earthquakes something near 0.95 W instead of zero, and
 *      it is the largest cell's whole problem. Rules first, as always.
 *
 *   2. POHANG. A Mw 5.5 whose band cannot reach zero is a statement about
 *      the toll model, not about the map: the geometry in place gets there
 *      only because a disc of that radius holds fewer people than a
 *      stadium of the same radius, which is luck rather than physics. It
 *      deserves its own look, not a geometry chosen to keep it.
 *
 *   3. And the hole is still open. The simulator still draws 0.22x of the
 *      ground between Mw 6.5 and 7.5, and this round measured a geometry
 *      that draws 0.85x of it and cannot be adopted yet.
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
