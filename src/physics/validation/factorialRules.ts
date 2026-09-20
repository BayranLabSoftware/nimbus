/**
 * The whole space at once: a factorial design over the model's choice
 * points, and a frontier instead of a gate.
 *
 * WHY. Thirteen rounds, rules 405 to 487, changed one thing each and
 * adopted nothing. Every piece of physics in them was right — Campbell &
 * Bozorgnia checked to 1e-15 against its own reference on 2 268 cases,
 * the surface projection correct geometry, the dip read from Slab2's own
 * grid, Thompson & Worden held to ps2ff. What failed was never the
 * mathematics. It was four things:
 *
 *   errors that cancel      two real defects that hid each other, so
 *                           repairing one alone made the model worse
 *   a conditioned jury      rule 459 measured saturation on a set
 *                           admitted for having high intensity
 *   faulty clauses          one blind to a sign change, one that dropped
 *                           an evidence set, one that rewards timidity
 *   coupled calibration     PAGER's coefficients are bound to PAGER's
 *                           exposure and cannot be judged apart from it
 *
 * ONE FACTOR AT A TIME IS KNOWN TO FAIL WHEN FACTORS INTERACT, and rules
 * 478 to 487 proved these interact: fixing the rings alone costs about
 * twenty false alarms, fixing the peak with them gives back three
 * quarters. Thirteen rounds were thirteen probes in the dark of a space
 * nobody had mapped.
 *
 * So this round maps it. Six choice points, ninety-six cells, four
 * objectives, one night of compute — and, for the first time, the MAIN
 * EFFECTS and the TWO-FACTOR INTERACTIONS, which one-at-a-time can never
 * see by construction.
 *
 * The rules, fixed on 20 September 2026, numbered after the 487 before
 * them:
 *
 *  488. The grid. Six factors, every level already built, justified and
 *       measured under its own rules; nothing is invented here:
 *
 *        contourLaw          boore2014 | campbellBozorgnia2014 |
 *                            allen2012Hypocentral      (rules 17, 384, 460)
 *        extendedSource      fromMw7.5 | always        (rule 412)
 *        stadiumWidth        downDip | surfaceProjection (rule 419)
 *        dip                 style | structure         (rule 427)
 *        topBand             midpoint | toPeak         (rule 440)
 *        pointSourceDistance epicentral | thompsonWorden2018 (rule 51)
 *
 *       3 x 2 x 2 x 2 x 2 x 2 = 96 cells, all of them run. The grid is
 *       not pruned, before or after: a cell that looks pointless is run
 *       anyway, because "pointless" is a prediction and this round is
 *       here because predictions about this model have been wrong.
 *
 *  489. The objectives, four, each established by its own earlier rules
 *       and none weakened or re-defined here:
 *
 *        (a) PEAK      |mean bias| on rule 465's 1 100, MMI degrees
 *        (b) AREAS     |ln of the geometric mean area ratio| on rule
 *                      405's 116
 *        (c) DEAD      rule 448's interval score, summed over the net rows
 *        (d) QUIET     rule 448's interval score, summed over rule 23's 805
 *
 *       Lower is better in all four, by construction, so "dominates"
 *       needs no sign conventions.
 *
 *  490. The frontier. A cell DOMINATES another when it is no worse on all
 *       four and better on at least one. The non-dominated set is the
 *       frontier, and it is published entire — every cell on it, with its
 *       six settings and its four numbers.
 *
 *  491. THE DECISION RULE, FIXED HERE BEFORE THE FRONTIER IS SEEN,
 *       because that is the whole discipline of this round:
 *
 *       (a) If any cell DOMINATES the shipped model — no worse on all
 *           four objectives and better on at least one — the best such
 *           cell is ADOPTED. There is no value judgement in that case and
 *           no clause should pretend there is. "Best" is the one with the
 *           largest total relative improvement.
 *
 *       (b) If no cell dominates the shipped model, NOTHING IS ADOPTED
 *           AUTOMATICALLY. The frontier is published, and beside it one
 *           cell is named as the RECOMMENDATION by minimax regret: each
 *           objective expressed as its relative change against the
 *           shipped model, and the recommended cell is the one whose
 *           WORST relative change is smallest, ties broken by total
 *           improvement. No weights are chosen, because choosing weights
 *           is the value judgement this rule refuses to make.
 *
 *       The choice among frontier cells in case (b) belongs to the person
 *       who owns the project and not to a rule written inside it. Every
 *       clause from rule 405 onward pretended that judgement did not
 *       exist, and that pretence is why thirteen rounds could refuse
 *       everything while the model stayed measurably wrong.
 *
 *  492. What the factorial must report that no round before it could:
 *
 *        (a) the MAIN EFFECT of each factor on each objective — the mean
 *            change from switching that factor, averaged over every
 *            setting of the others;
 *        (b) the TWO-FACTOR INTERACTIONS, the same mean change computed
 *            within each level of a second factor, wherever they differ
 *            in sign or by more than half the main effect. Those are the
 *            couplings that made thirteen rounds unreadable, and this is
 *            the first design that can see them.
 *
 *  493. Degenerate cells are found and named, not hidden. Some factors do
 *       nothing under some settings — `stadiumWidth` where no stadium is
 *       drawn, `pointSourceDistance` where the source is extended. Cells
 *       whose four objectives are identical to another cell's are
 *       reported as duplicates with the factor that made no difference,
 *       because that is itself a finding about the model.
 *
 *  494. One run, no re-tuning. No factor, level, objective or decision
 *       rule is changed after a number is seen. If rule 491(a) finds
 *       nothing, the shipped model stays until its owner chooses from the
 *       frontier.
 */

/**
 * THE OUTCOME, run once on 20 September 2026 under rule 494: NO CELL
 * DOMINATES the shipped model, so nothing is adopted — and rule 491(b)
 * turns out to be VACUOUS, which is the fifth fault these rounds have
 * found in their own clauses and the first that is a plain logical error.
 *
 * The shipped model: peak 1.956 · areas 0.935 · dead 204.1 · quiet 1 195.
 *
 * RULE 491(a): nothing dominates it. Zero cells of ninety-six.
 *
 * RULE 491(b) RECOMMENDS THE SHIPPED MODEL, and it could never have
 * recommended anything else. Minimax regret measures each cell's worst
 * relative change AGAINST the baseline, and the baseline is in the
 * candidate set, so its worst change is zero by construction while every
 * other cell is worse somewhere. The rule can only ever return the
 * incumbent when 491(a) is empty. It was written to hand a judgement to
 * the project's owner and instead it hands back "change nothing", dressed
 * as a recommendation.
 *
 * It is not amended. It is recorded, and the frontier is published so
 * that the judgement can actually be made.
 *
 * THE FRONTIER: 26 cells of 96. Its corners, against the shipped model:
 *
 *   | cell                                                    | peak  | areas | dead  | quiet |
 *   | ------------------------------------------------------- | ----- | ----- | ----- | ----- |
 *   | SHIPPED  boore/7.5/downDip/style/midpoint/epicentral     | 1.956 | 0.935 | 204.1 | 1195  |
 *   | best areas  boore/7.5/projection/style/toPeak/T-W        | 1.956 | **0.022** | **198.2** | 1547 |
 *   | best dead   boore/always/downDip/-/toPeak/-              | 1.956 | 0.471 | **197.5** | 1736 |
 *   | best quiet  boore/7.5/downDip/-/toPeak/epicentral        | 1.956 | 0.935 | 212.6 | **1117** |
 *   | best peak   allen/7.5/projection/style/toPeak/-          | **0.582** | 0.176 | 207.0 | 1698 |
 *
 *   Three of the four objectives have a cell that beats the shipped
 *   model: the areas by a factor of forty in log bias, the dead by 6.6
 *   points, the quiet by 78. None of them beats it on all four, which is
 *   why the conjunctions of thirteen rounds refused everything.
 *
 *   The cell worth looking at hardest is the second row. Its areas read
 *   1.022x — the map essentially centred — its dead are BETTER than what
 *   ships, its peak is untouched, and it pays 29 % on the quiet. One law,
 *   one geometry switch, one band rule, one distance. Nobody had run it.
 *
 * RULE 492(a), THE MAIN EFFECTS — what each knob does, averaged over every
 * setting of the others. This is what thirteen one-at-a-time rounds could
 * not have produced at any cost:
 *
 *   | factor                 | peak   | areas  | dead | quiet |
 *   | ---------------------- | ------ | ------ | ---- | ----- |
 *   | CB14 over boore        | -0.750 | +0.081 |  +26 |  +198 |
 *   | Allen over boore       | -1.374 | +0.178 |  +14 |  +551 |
 *   | extendedSource always  |  0.000 | +0.157 |   +7 |  +583 |
 *   | surfaceProjection      |  0.000 | -0.157 |   +1 |   -73 |
 *   | structure dip          | -0.097 | +0.035 |   -0 |    +1 |
 *   | **topBand toPeak**     |  0.000 |  0.000 |  -12 |  -297 |
 *   | Thompson-Worden        |  0.000 | -0.153 |   -1 |   +85 |
 *
 *   ONE FACTOR IS GOOD OR NEUTRAL ON ALL FOUR: the top band bounded by the
 *   peak. It costs nothing on the map and takes 12 off the dead and 297
 *   off the quiet. It is the only free move in the whole space, and it was
 *   refused in the round that introduced it for losing Sumatra-Andaman by
 *   thirteen per cent of a toll the model misses by a factor of fifty
 *   three.
 *
 *   (Its cell in the SHIPPED configuration still does not dominate: the
 *   dead go 204.1 to 212.6 there. The gain is an average over the grid,
 *   and the loss is that one row. Both are true and both are printed.)
 *
 * RULE 492(b), THE INTERACTIONS — the couplings that made thirteen rounds
 * unreadable, now visible. The four that matter most:
 *
 *   Thompson-Worden moves the areas by -0.460 under boore2014 and by
 *   EXACTLY ZERO under CB14 and under Allen. Mechanically right: those two
 *   do not take R_JB, so a correction to it cannot reach them. The design
 *   found that on its own.
 *
 *   `extendedSource: always` moves the areas by -0.007 WITH the surface
 *   projection and by +0.321 without it. The stadium at every magnitude is
 *   only worth having if it is laid on what the rupture projects — which
 *   is rules 419 to 426's finding, arrived at over two rounds, here in one
 *   line.
 *
 *   The top band takes 400 off the quiet WITH `always` and 195 without.
 *   The two halves do need each other, as rules 483 to 487 concluded, and
 *   the size of the help is twice.
 *
 *   The structure dip moves the peak by -0.290 under CB14 and by zero
 *   under boore2014. The dip only reaches the peak through a law that
 *   measures its distance to the rupture.
 *
 * RULE 493: 50 of 96 cells duplicate another cell's four numbers. More
 * than half this grid is inert, because most factors do nothing under most
 * settings of the others. That is a fact about the model worth knowing
 * before anybody designs the next experiment on it.
 *
 * WHAT THIS ROUND HAS ACTUALLY DELIVERED, and it is not a verdict:
 *
 *   The space is mapped. For the first time this project knows what each
 *   of its six choice points does to each of its four measures, which of
 *   them interact and by how much, and where the frontier of what is
 *   achievable runs. Thirteen rounds of one-at-a-time produced thirteen
 *   points and no map; one night produced ninety-six points, a frontier
 *   and seven main effects.
 *
 *   And the decision is now genuinely, visibly a value judgement: three of
 *   the four objectives can be improved and none of them for free. No
 *   clause can make that choice, and the one that claimed it could has
 *   been shown to return the incumbent by construction.
 */

/**
 * THE ADOPTION THAT WAS TRIED AND BLOCKED, 20 September 2026.
 *
 * The project's owner chose from the published frontier — which is what
 * rule 491(b) failed to do and what rule 491 says is his to do — and
 * chose the best-areas cell:
 *
 *   boore2014 | fromMw7.5 | surfaceProjection | style | toPeak |
 *   thompsonWorden2018
 *   peak 1.956 (unchanged) · areas 0.022 · dead 198.2 · quiet 1547
 *
 * Its three defaults were flipped and the suite was run. SEVENTEEN tests
 * failed. Sixteen were figures that rule 44 says move when a model is
 * adopted. THE SEVENTEENTH WAS NOT:
 *
 *   P-MONO-MW: the MMI VII radius is 29.17 km at Mw 7.4 and 14.88 km at
 *   Mw 7.5. It HALVES.
 *
 * Thompson & Worden's distance is read only where a scenario is a point
 * source — `!isExtendedSource`, which today means below Mw 7.5 — so at
 * that threshold the model switches distance convention and the most
 * visible number it draws falls by half. Rule 398 is binding and was
 * written before any of this: a property outranks a score, and an
 * adoption that fails a property test does not take effect.
 *
 * The defaults were reverted. The suite is green at 2 014.
 *
 * AND THE FAULT IS IN RULE 489, WHICH IS MINE. It named four objectives —
 * peak, areas, dead, quiet — and omitted the PROPERTY GATES that rules
 * 402(c), 416(e) and 424(e) had every one of them carried. A frontier
 * computed without them offers cells that cannot be shipped, and the
 * owner made a good-faith choice from a menu that should not have
 * contained that dish. Sixth fault found in these clauses, and the first
 * that reached as far as flipping a default.
 *
 * WHAT THE PROPERTY GATE SAYS ABOUT THE FRONTIER, measured after the
 * revert on all 26 cells: TWENTY-FOUR HOLD P-MONO-MW. The two that fail
 * are exactly the two carrying `thompsonWorden2018` with
 * `extendedSource: fromMw7.5`.
 *
 * AND THAT IS THE WHOLE OF THOMPSON & WORDEN'S REACH. With
 * `extendedSource: always` every scenario is an extended source, so the
 * correction is never read and its cells are byte-identical duplicates —
 * which is why rule 492(b) found it moving the areas by EXACTLY ZERO
 * there. So the only configuration in which that distance does anything
 * is the one in which it also halves a radius. AS WIRED, IT CANNOT BE
 * ADOPTED AT ALL.
 *
 * WHICH LEAVES A DIAGNOSIS WORTH MORE THAN THE CELL. At Mw 7.5 the same
 * earthquake has two representations — a point source at Thompson &
 * Worden's averaged rupture distance, and an explicit finite rupture —
 * and they disagree about the MMI VII reach by a factor of two, 29.2 km
 * against 14.9. They are meant to be the same earthquake. One of the two
 * is wrong by that factor and nobody had ever put them side by side,
 * because nothing in this project ever crossed that threshold with the
 * correction on.
 *
 * The frontier cells that hold the property, best areas first:
 *
 *   | cell                                            | peak  | areas | dead  | quiet |
 *   | ----------------------------------------------- | ----- | ----- | ----- | ----- |
 *   | allen/7.5/projection/style/toPeak               | 0.582 | 0.176 | 207.3 | 1698  |
 *   | CB14/7.5/downDip/style/toPeak                   | 1.351 | 0.421 | 217.8 | 1378  |
 *   | boore/always/downDip/style/toPeak               | 1.956 | 0.471 | **197.5** | 1736 |
 *   | CB14/7.5/downDip/structure/toPeak               | 1.061 | 0.588 | 218.3 | 1356  |
 *   | boore/7.5/downDip/style/toPeak/epicentral       | 1.956 | 0.935 | 212.6 | **1117** |
 *   | SHIPPED                                         | 1.956 | 0.935 | 204.1 | 1195  |
 *
 * None of them dominates the shipped model either, so rule 491(a) is
 * still empty and the choice is still a judgement — but now it is a
 * judgement over cells that can actually be shipped.
 */

export const FACTORIAL_RULES = 'rules 488 to 494, fixed 20 September 2026';

/** Rule 489: lower is better in all four, so domination needs no signs. */
export interface Objectives {
  peak: number;
  areas: number;
  dead: number;
  quiet: number;
}

export const OBJECTIVE_KEYS = ['peak', 'areas', 'dead', 'quiet'] as const;

/** Rule 490: no worse on all four, better on at least one. */
export function dominates(a: Objectives, b: Objectives): boolean {
  let strictlyBetter = false;
  for (const k of OBJECTIVE_KEYS) {
    if (a[k] > b[k]) return false;
    if (a[k] < b[k]) strictlyBetter = true;
  }
  return strictlyBetter;
}

/** Rule 490's frontier: the cells nothing dominates. */
export function frontierOf<T extends { objectives: Objectives }>(cells: readonly T[]): T[] {
  return cells.filter((c) => !cells.some((o) => o !== c && dominates(o.objectives, c.objectives)));
}

/** Rule 491: each objective as its relative change against the shipped
 *  model. Negative is an improvement. A shipped value of zero would make
 *  the ratio meaningless, so it falls back to the absolute change. */
export function relativeChange(shipped: Objectives, candidate: Objectives): Objectives {
  const out = {} as Objectives;
  for (const k of OBJECTIVE_KEYS) {
    const base = Math.abs(shipped[k]);
    out[k] = base > 0 ? (candidate[k] - shipped[k]) / base : candidate[k] - shipped[k];
  }
  return out;
}

/** Rule 491(a): no worse on all four and better on at least one. */
export function dominatesShipped(shipped: Objectives, candidate: Objectives): boolean {
  return dominates(candidate, shipped);
}

/** Rule 491(b): the smallest worst relative change, ties to the largest
 *  total improvement. */
export function minimaxRegret<T extends { objectives: Objectives }>(
  shipped: Objectives,
  cells: readonly T[]
): T | null {
  let best: { cell: T; worst: number; total: number } | null = null;
  for (const cell of cells) {
    const rel = relativeChange(shipped, cell.objectives);
    const worst = Math.max(...OBJECTIVE_KEYS.map((k) => rel[k]));
    const total = OBJECTIVE_KEYS.reduce((a, k) => a + rel[k], 0);
    if (best === null || worst < best.worst || (worst === best.worst && total < best.total)) {
      best = { cell, worst, total };
    }
  }
  return best === null ? null : best.cell;
}
