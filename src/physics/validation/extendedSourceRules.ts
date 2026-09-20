import { CONTOUR_LAW_MARGIN } from './contourLaws.js';
import { SIZE_BANDS } from './scorecard.js';

/**
 * The hole between Mw 6.5 and 7.5: an earthquake drawn as a circle when
 * its rupture is already sixty kilometres long.
 *
 * WHAT WAS LOOKED AT BEFORE THESE RULES WERE WRITTEN, and is therefore not
 * held out. The round of rules 405 to 411 ran once on 20 September 2026 and
 * was published whole (96b2049). Slicing its already-published numbers by
 * magnitude — no new measurement, the same run read a second way — gives
 * the shipped law's area against the ShakeMaps' at MMI VII:
 *
 *   Mw 6.00–6.50   0.81x   (33 events)
 *   Mw 6.50–7.00   0.34x   (32)
 *   Mw 7.00–7.25   0.41x   (14)
 *   Mw 7.25–7.50   **0.19x**  (11)
 *   Mw 7.50–7.75   **0.80x**  (13)
 *   Mw 7.75–8.40   1.09x   ( 7)
 *
 * The model is close to the record below Mw 6.5 and above Mw 7.5, and
 * draws a fifth of the ground in between. Across Mw 7.5 — two adjacent
 * magnitude bins, eleven events on one side and thirteen on the other —
 * the ratio jumps by a factor of 4.2.
 *
 * Nothing in the earth changes at Mw 7.5. One thing in the code does:
 * `isExtendedSource` in `simulate.ts`, which is true from Mw 7.5 and false
 * below it. Above it the footprint is a rupture stadium — the rupture
 * rectangle grown by the ring's radius on every side. Below it the
 * footprint is a disc about the epicentre, of the same radius. A Mw 7.3
 * breaks about sixty kilometres of fault and is drawn as a circle around
 * the point where the break started.
 *
 * The comment that sets the threshold says that below 7.5 "the stadium
 * contour collapses inside the existing point-source ring, so there is
 * nothing to gain by upgrading the geometry". The stadium and the disc
 * share a radius, and a stadium of that radius is the disc PLUS the
 * rectangle and its two flanks, so it never collapses inside anything:
 * it is larger by L·W + 2r(L + W). The threshold was reasoning about the
 * picture, not about the ground, and no measurement stood behind it. The
 * jury of 116 is the first set wide enough to have shown it.
 *
 * WHAT THIS ROUND IS NOT ALLOWED TO DISTURB. Two decisions already govern
 * the geometry in their own domains and neither is reopened here:
 *
 *   - rules 40 to 44 chose the disc below Mw 7.5 for a scenario marked a
 *     SUBDUCTION INTERFACE, on 64 interface earthquakes 40 to 70 km deep,
 *     where it read 0.99 against the stadium's 2.29. Every earthquake of
 *     rule 405's jury is crustal, 0 to 36 km deep and unmarked, so the two
 *     sets do not meet. A marked scenario keeps rule 44's geometry;
 *   - rules 66 to 70 draw a scenario deeper than 70 km as a disc at every
 *     magnitude. Untouched.
 *
 * The rules, fixed on 20 September 2026, numbered after the 411 before
 * them:
 *
 *  412. The candidate, with no free parameter. `extendedSource: 'always'`
 *       — the footprint is a rupture stadium at every magnitude, on the
 *       rupture the scenario's own scaling law already gives it. Not a
 *       lower threshold: a threshold is a number, and any number picked
 *       here would have been picked knowing where the hole is. The stadium
 *       degenerates into the disc on its own as the rupture shortens, which
 *       is why it needs no threshold — at Mw 5 the rectangle is a few
 *       kilometres and the shape is a circle to the eye, and at Mw 7.3 it
 *       is sixty and it is not.
 *
 *  413. Exactly one thing changes, and it is the SHAPE. The radius of every
 *       ring is untouched: `contourAt` does not read `isExtendedSource`.
 *       Rule 51's Thompson & Worden distance is read only when a scenario
 *       asks for `pointSourceDistance`, which no row of this round sets, so
 *       it moves nothing here either — and rule 417 says what to do about
 *       it if the candidate is adopted. A test holds the candidate to draw
 *       what the geometry in place draws, to the last digit, for every
 *       scenario at Mw 7.5 and above, every scenario marked a subduction
 *       interface, and every scenario deeper than 70 km. A candidate that
 *       moved a number outside the domain it claims to change would be two
 *       changes wearing one name.
 *
 *  414. The jury and the measurement, unchanged from rules 405 to 407: the
 *       same 116 earthquakes, the scenario built from each ComCat row and
 *       not from a preset, the model's area read off the FIELD, the
 *       record's area the atlas's own. The six fixtures are reported beside
 *       them as rule 410 has it, deciding nothing.
 *
 *  415. Measured on the law the product draws. The geometry is scored with
 *       `boore2014`, the shipped contour law, because that is the pairing
 *       the simulator would ship. Campbell & Bozorgnia 2014 is run beside
 *       it and printed, deciding nothing: a round that moved the geometry
 *       and the law together could not say which one had done the work.
 *
 *  416. The verdict. The candidate replaces the geometry in place only if
 *       ALL of these hold, on the same run:
 *
 *       (a) The worst cell improves. Over the three magnitude cells the
 *           repository already uses — `SIZE_BANDS.earthquake`, Mw < 6.5,
 *           Mw 6.5–7.5, Mw ≥ 7.5 — the worst cell's |ln of the geometric
 *           mean area ratio|, pooled over the bands of that cell, is
 *           smaller than the geometry in place's worst cell by at least
 *           `CONTOUR_LAW_MARGIN`, which is rule 18's own 0.05 and not a
 *           number invented here.
 *
 *       (b) No cell is made materially worse. No cell's |ln bias| grows by
 *           more than `CONTOUR_LAW_MARGIN`. This is the clause that stops
 *           the candidate from buying the middle by overshooting the small
 *           end, which is the obvious way for it to cheat: every stadium is
 *           larger than its disc, so a geometry that only ever grows can
 *           improve a cell that under-draws while ruining one that does
 *           not.
 *
 *       (c) Overall, on rule 409's statistic: the geometric mean of the
 *           area ratio no further from 1, and the scatter no wider.
 *
 *       (d) The dead, on rule 11's held-out tolls: no fewer records inside
 *           their predictive band than the geometry in place, and none
 *           lost. A footprint that grows puts more people inside it, so
 *           this clause is not a formality — it is the one that decides
 *           whether a better-drawn map is also a better-counted one.
 *
 *       (e) Monotonicity in magnitude, P-MONO-MW: zero inversions of the
 *           MMI VII radius over Mw 4.0 to 9.0. Printed beside it, deciding
 *           nothing but worth having: the same count on the AREA, which the
 *           geometry in place fails by construction at Mw 7.5 and which no
 *           test has ever asked, because P-MONO-MW reads the radius and the
 *           radius is continuous across a threshold that the area is not.
 *
 *  417. What an adoption does. Adopted, `extendedSource` defaults to
 *       `'always'`, the simulator and the harness draw every unmarked,
 *       shallow scenario as a stadium at every magnitude, and the figures
 *       of the rules that ran on the old geometry move, as rule 44 has it.
 *       Rule 51's distance is then read by a scenario that is no longer a
 *       point source at any magnitude; the report must say so, and the
 *       rules that chose it are re-read rather than assumed — that is
 *       written here, before the run, so it cannot be forgotten after a
 *       result that suits.
 *
 *  418. One run, no re-tuning. If a clause of rule 416 fails, the geometry
 *       in place stays, the numbers are published as they came out, and
 *       what was learned is written down. No threshold, bound or scaling
 *       law is adjusted after a number is seen.
 */

/**
 * THE OUTCOME, run once on 20 September 2026 under rule 418 and published
 * as it came out: the candidate is REFUSED, on rule 416(d), the dead.
 *
 * The map, on the 116, with `boore2014` as rule 415 asks:
 *
 *   | geometry   | bands | mean    | scatter | Mw < 6.5 | Mw 6.5–7.5 | Mw >= 7.5 |
 *   | ---------- | ----- | ------- | ------- | -------- | ---------- | --------- |
 *   | fromMw7.5  | 165   | 0.393x  | 1.579   | 0.56x    | **0.22x**  | 1.27x     |
 *   | always     | 169   | 1.601x  | 1.211   | 1.84x    | **1.62x**  | 1.27x     |
 *
 *   (a) the worst cell   PASS  1.536 to 0.612
 *   (b) no cell worse    PASS  worst growth +0.037, under the 0.05 margin
 *   (c) overall          PASS  |ln bias| 0.935 to 0.470, scatter 1.579 to 1.211
 *   (d) the dead         FAIL  one record lost
 *   (e) monotonicity     PASS  0 inversions, both geometries, radius and area
 *
 * THE DIAGNOSIS WAS RIGHT AND THE SHAPE WAS THE CAUSE. Closing the hole
 * moves the broken cell from 0.22x to 1.62x, and the cell above Mw 7.5 does
 * not move at all — 1.273x before and 1.273x after, to the digit, because
 * nothing there changed. A geometry that touched more than it claimed would
 * have moved that number, and it did not.
 *
 * WHY IT IS REFUSED, and it is not a formality. Of the 18 net rows the
 * geometry moves 7, and two cross their band in opposite directions:
 *
 *   Amatrice 2016   Mw 6.2, 299 dead:  [0–235] MISSED  ->  [0–917] contains
 *   Pohang 2017     Mw 5.5, 0 dead:    [0–37746] contains  ->  **[2–91004]**
 *
 *   Pohang killed nobody. Under the candidate the LOW end of its predictive
 *   band lifts off zero: two hundred realisations and not one of them lets
 *   everybody live. A model that has stopped being able to say "possibly
 *   nobody" about a Mw 5.5 has lost something a wider footprint does not pay
 *   for, and rule 416(d) is the clause that noticed.
 *
 * WHAT THE ROUND FOUND OUT ABOUT ITS OWN RULE, published because it is the
 * most useful thing here. Clause (b) was written to stop the candidate
 * "buying the middle by overshooting the small end". It passed, and the
 * small end overshot anyway: Mw < 6.5 goes from 0.56x to 1.84x — under by
 * 1.8 times, then over by 1.8 times. The clause measures |ln bias|, those
 * two are 0.574 and 0.612, and the growth of 0.037 slipped under a margin
 * of 0.05. A clause that treats "too small by 1.8" and "too big by 1.8" as
 * the same distance cannot see a sign change, and a sign change is exactly
 * what over-correction looks like. The clause is not amended here — it did
 * what it was written to do, and what it was written to do was not enough.
 * The next round needs one that reads the sign.
 *
 * And one prediction in rule 416(e) was simply WRONG. It said the geometry
 * in place "fails by construction at Mw 7.5" on the area, and no test had
 * ever asked. A test asks now, and it passes: the area JUMPS at Mw 7.5, it
 * does not drop, and a jump upward is not an inversion. The discontinuity
 * is real and P-MONO-MW cannot see it, but neither can a monotonicity count
 * on the area — it needs a test of continuity, which is a different thing
 * and does not exist.
 *
 * WHERE THE OVERSHOOT COMES FROM, named rather than guessed, and this is
 * the handover. `surfaceRuptureWidth` returns Wells & Coppersmith's
 * DOWN-DIP width, and says so: "Returned as a true down-dip distance (NOT
 * the surface projection). For megathrusts with shallow dip the surface
 * projection W·cos(δ) is within ~5 % of W; the renderer uses W directly
 * when laying out the stadium polygon." That reasoning is sound for what
 * the stadium was built for — shallow megathrusts at Mw 7.5 and above,
 * where cos δ is near 1. This candidate took the same stadium down to every
 * crustal earthquake, where the faults are steep and often vertical, and a
 * vertical rupture has a surface projection of W·cos(90°) = 0. So the
 * candidate lays ten kilometres of down-dip width flat on the ground for a
 * fault that outcrops as a line, and the footprint grows on both flanks by
 * ground that is not there.
 *
 * That is a testable claim, it is about the rupture and not about the
 * threshold, and it is what the next round should put rules around: not
 * "stadium or disc", but whether the stadium is laid on the rupture's
 * SURFACE PROJECTION. The hole between Mw 6.5 and 7.5 is still open, the
 * shape is still its cause, and the geometry in place still draws a fifth
 * of the ground there.
 */

export const EXTENDED_SOURCE_RULES = 'rules 412 to 418, fixed 20 September 2026';

/** Rule 416's cells: the repository's own, imported rather than restated. */
export const EXTENDED_SOURCE_CELLS = SIZE_BANDS.earthquake;

/** Rule 416(a) and (b): rule 18's margin, reused. */
export const EXTENDED_SOURCE_MARGIN = CONTOUR_LAW_MARGIN;

/** The cell a magnitude falls in, by `SIZE_BANDS.earthquake`. */
export function magnitudeCell(magnitude: number): string {
  const cells = EXTENDED_SOURCE_CELLS;
  return (cells.find((c) => magnitude < c.below) ?? cells[cells.length - 1])?.label ?? '';
}

/**
 * Rule 416(a): the worst cell's distance from centred.
 *
 * A cell with no band is not a cell that passed — it is a cell with
 * nothing in it, and it is left out rather than scored as zero.
 */
export function worstCell(biasByCell: Readonly<Record<string, number | null>>): {
  label: string;
  distance: number;
} | null {
  let worst: { label: string; distance: number } | null = null;
  for (const [label, bias] of Object.entries(biasByCell)) {
    if (bias === null || !(bias > 0)) continue;
    const distance = Math.abs(Math.log(bias));
    if (worst === null || distance > worst.distance) worst = { label, distance };
  }
  return worst;
}
