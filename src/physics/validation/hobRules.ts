import type { HobBlastSource } from '../events/explosion/hob.js';

/**
 * An air burst's blast rings, from the curves the book draws for them.
 *
 * N1 of docs/GOLD_STANDARD.md asks that an explosion's overpressure with height
 * of burst be held to Glasstone & Dolan (1977) within 10 % in range, and that
 * where the book gives a curve no fit of the project's stand in for it. The
 * rings of a burst in the air are drawn today by a piecewise factor on the
 * surface burst's radii — 1.0 on the ground rising to 1.5 between 150 and
 * 300 m·kt⁻¹ᐟ³ and falling to 0.25 above 1 500 — which `events/explosion/
 * hob.ts` itself calls "a piecewise function chosen by the project ... not
 * read from a published curve". The book draws those curves: Figures 3.73a,
 * b and c. These rules put them in, or say why not.
 *
 * The rules, fixed on 17 September 2026 and numbered after the hundred and
 * sixty-seven before them, pushed before the candidate draws a ring for any
 * preset of the product or any row of the calibration net:
 *
 *  168. **What was looked at.** The pages of Figures 3.73a, b and c of the
 *       public scan (DTIC ADA087568, printed pages 111, 113 and 115) and
 *       §§3.73 and 3.74, with the worked examples of the three captions; the
 *       rings the project's factor draws for a 1-kiloton burst at ten heights
 *       from the ground to 5 000 ft, printed while judging whether the round
 *       was worth running, and the trace's own rings at the same heights (at
 *       500 ft the factor draws 1 psi 25 % beyond where the figure puts it, at
 *       3 000 ft 38 % short); the trace of rule 169 as
 *       it was built, overlaid on the page to see it follow the ink; the
 *       candidate's rings at the scaled height of the Hiroshima preset (5 psi
 *       at 1.62 km and 1 psi at 4.49 km, where the factor draws 1.7 and 5.0);
 *       and the five worst pairs the benchmark campaign kept of its comparison
 *       with NUKEMAP 2.76 (`benchmark/results/nuclear.json`), whose NUKEMAP
 *       rings rule 172 prints. No toll, no preset and no row of the release
 *       gate has been run under the candidate.
 *
 *  169. **The curves.** The seven curves of Figure 3.73c — 1, 2, 4, 6, 8, 10
 *       and 15 psi, for a 1-kiloton burst, over 7 500 ft of distance and
 *       5 000 ft of height — traced by `scripts/benchmark/hob-curves.py` into
 *       `events/explosion/hobCurvesData.ts`: each curve's scaled slant range
 *       on rays from ground zero every half degree. The script locates every
 *       grid line and maps pixels to feet through all of them; takes the grid
 *       off the ink and drops the dashes of the triple-point line and the
 *       labels; lets the curves cut the plot into regions and names each
 *       region's level by a point; and reads each ray where it passes from one
 *       level to the next. It refuses to write unless (a) the grid map fits
 *       every line within 2 px rms; (b) the curves are nested on every ray but
 *       at most five, where the figure draws two touching; (c) the book's own
 *       example holds — 4 psi reaches farthest, 2 600 ft, for a burst at about
 *       1 100 ft — within 3 % in distance and 10 % in height; (d) the 10 and
 *       15 psi curves agree within 6 % in distance, at every height read below
 *       their knees, with the same two curves as Figure 3.73b draws them, read
 *       from that page on its own grid; and (e) no curve jumps by more than 5 %
 *       between rays half a degree apart outside the triple-point bends. The
 *       trace committed with these rules passed all five: 0.88 px, four rays,
 *       2 618 ft at 1 080 ft, 3.8 % and 3.9 % on 28 heights, no jump. Above
 *       5 000 ft the 1 psi curve leaves the frame nearly level with it, and it
 *       is carried to the height axis along a parabola fitted to its last
 *       300 ft of height (apex 5 045 ft), the one reading not on the page.
 *
 *  170. **The candidate (`glasstone1977`).** For a nuclear burst in the air or
 *       on the ground, the 5, 1 and 0.5 psi rings are the farthest distance at
 *       which the book's contour for that overpressure crosses the burst's
 *       scaled height, scaled as the cube root of the yield (the captions'
 *       law): 1 psi on its own curve, 5 psi between the 4 and 6 psi curves in
 *       the logarithms of both range and overpressure along each ray, and
 *       0.5 psi — which the figure does not draw — the 1 psi curve carried out
 *       on each ray by the ratio the project's surface relation gives between
 *       0.5 and 1 psi, declared as the project's. Above a contour's top the
 *       ring is zero. A contact surface burst is the curves at a height of
 *       zero. A chemical charge keeps its surface radii, which N1 holds to
 *       Kingery–Bulmash, and takes the book's change with height at twice its
 *       yield, the nuclear yield whose blast it matches in this model. A burst
 *       in the water and one above 30 km keep what they had. The rings drawn
 *       at the surface burst's radii — the panel's "5 psi ring" and "1 psi
 *       ring" beside the height-of-burst section — and the peak overpressures
 *       at 1 and 5 km are the surface burst's and do not move.
 *
 *  171. **What decides.** The candidate replaces a factor its own module says
 *       was chosen, with the curves of the book the project cites for it, so
 *       it is adopted unless a guard fails: (a) rule 169's five checks, held in
 *       CI by `hobCurves.test.ts` together with the example scaled to 125 kt
 *       (13 000 ft at a burst height of 5 500 ft, within 3 %); (b) the release
 *       gate stays PASS with the candidate in place; (c) on a grid of yields
 *       from 1 t to 50 Mt and heights from the ground to 30 km, nuclear and
 *       chemical, every ring is finite and not negative, the 5 psi ring lies
 *       inside the 1 psi ring and the 1 psi ring inside the 0.5 psi ring, and
 *       each ring grows or holds as the yield grows at a fixed height.
 *
 *  172. **What is printed, deciding nothing.** The three rings of every
 *       explosion preset under both sources; the tolls of the calibration net
 *       under both; the explosion family's sweep of 5 000 scenarios under
 *       both, in the same session; and the five NUKEMAP rings the campaign
 *       kept, beside both sources' rings for the same cases.
 *
 *  173. **How the verdict is read.** Adopted, `DEFAULT_HOB_BLAST_SOURCE` is
 *       `glasstone1977`, and N1's clause "overpressure with height of burst"
 *       is met; with every other clause met since 16 September, N1 holds. The
 *       tolls that move are not re-tuned (rules 5 and 6): Hiroshima and
 *       Nagasaki were set on the rings of the factor, and whatever they read
 *       now is printed as it falls. Refused, the clause stays not met.
 *
 * What these rules cannot settle. The figure is for nearly ideal surfaces and a
 * sea-level atmosphere, and a precursor over a dusty or heated surface
 * changes the rings (§3.79); a burst above 5 000 ft is read without the
 * altitude corrections the captions mention. The trace is only as good as the
 * drawing: two figures of the same book disagree by up to 4 % on the same
 * curves. The light-damage ring below 1 psi is this project's closure. And
 * none of it is the world: the rings are the book's idealised overpressure,
 * not the damage a city shows.
 */

/** Rule 170's candidate and the law in place. */
export const HOB_IN_PLACE: HobBlastSource = 'project';
export const HOB_CANDIDATE: HobBlastSource = 'glasstone1977';

/** Rule 171 (c): the grid the guard runs. */
export const HOB_GUARD_YIELDS_KT = [0.001, 0.01, 0.1, 1, 15, 100, 1_000, 10_000, 50_000] as const;
export const HOB_GUARD_HEIGHTS_M = [
  0, 10, 50, 100, 200, 300, 500, 800, 1_200, 2_000, 3_000, 5_000, 8_000, 12_000, 20_000, 29_999,
] as const;

/** Rule 172: the NUKEMAP 2.76 rings the campaign kept among its worst pairs
 *  (`benchmark/results/nuclear.json`, quantity blastRingAsDrawn), by case of
 *  `benchmark/matrices/nuclear.json`. */
export const HOB_NUKEMAP_KEPT: readonly { caseId: string; psi: number; nukemapM: number }[] = [
  { caseId: 'nuc-preset-NAGASAKI_1945', psi: 1, nukemapM: 4_640.812874099859 },
  { caseId: 'nuc-preset-TSAR_BOMBA_1961', psi: 1, nukemapM: 54_436.32919672976 },
  { caseId: 'nuc-grid-002', psi: 1, nukemapM: 371.6780788461611 },
  { caseId: 'nuc-grid-004', psi: 1, nukemapM: 800.9277201678478 },
  { caseId: 'nuc-grid-006', psi: 1, nukemapM: 1_726.349594940111 },
];

export interface HobGuardResult {
  cases: number;
  notFinite: number;
  outOfOrder: number;
  shrinksWithYield: number;
}

/** Rule 171: whether the candidate is adopted. */
export function chooseHobBlastSource(input: {
  traceChecksPass: boolean;
  releaseGatePasses: boolean;
  guard: HobGuardResult;
}): HobBlastSource {
  const g = input.guard;
  const guardPasses =
    g.cases > 0 && g.notFinite === 0 && g.outOfOrder === 0 && g.shrinksWithYield === 0;
  return input.traceChecksPass && input.releaseGatePasses && guardPasses
    ? HOB_CANDIDATE
    : HOB_IN_PLACE;
}
