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
