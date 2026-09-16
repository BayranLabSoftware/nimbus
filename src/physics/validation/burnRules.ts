import type { BurnExposureSource } from '../effects/burnExposure.js';

/**
 * The radiant exposure that burns, from the book the project cites for it.
 *
 * Nimbus draws its burn rings at 8, 5 and 2 cal/cm², whatever the explosion.
 * Those three numbers are the project's own: Glasstone & Dolan give no fixed
 * thresholds. In their book the exposure that burns grows with the yield,
 * because a larger explosion spreads the same heat over a longer pulse and
 * the skin sheds more of it as it arrives, and their Figure 12.64 (page 564 of
 * the 1977 edition) draws nine curves of it — first, second and third degree,
 * each for light, medium and dark skin — from 1 kt to 10 Mt. The validation report has carried the difference as a
 * declared gap since 14 September 2026. These rules close it, or say why not.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out: the page itself and the book's own worked example at 1 Mt (§12.65:
 * between 4.5 and 6 cal/cm², 18 % of a population take second-degree burns
 * and the rest first-degree); the curves as scripts/benchmark/burn-curves.py
 * traced them, and the rings a scenario draws under them at six yields, which
 * is what rule 83 prints. No toll and no row of the calibration net was run
 * under the candidate before these rules were fixed.
 *
 * The rules, fixed on 16 September 2026, before any row of the net was run
 * with the curves, and numbered after the seventy-nine before them:
 *
 *  80. The curves. Nine, traced from the public scan of the book (DTIC
 *      ADA087568, page 564) by scripts/benchmark/burn-curves.py: it finds the
 *      frame and the axis, seeds one point per curve in a column clear of the
 *      legend, follows each by continuity and slope, and refuses to write
 *      anything unless there are nine of them, each rising with the yield and
 *      none crossing another. They are read at 1, 3, 10, 30, 100, 300, 1 000,
 *      3 000 and 10 000 kt into effects/burnExposureData.ts, committed before
 *      the candidate is run on anything. The reading is good to about a tenth
 *      of a cal/cm², half the thickness of a printed curve; burnRules.test.ts
 *      holds the table to the book's own example at 1 Mt and to the three
 *      checks above.
 *  81. The candidate (`glasstone1977`). An explosion's burn rings are drawn at
 *      the exposure the book gives for that yield and the middle of its three
 *      skin pigmentations — the average exposed population — interpolated in
 *      the logarithm of the yield and held flat below 1 kt and above 10 Mt,
 *      where the figure says nothing. Everything else is shared: the thermal
 *      partition, the transmission, the fireball. An impact's burn rings keep
 *      the project's fluences: the book's curves are the thermal pulse of a
 *      nuclear fireball, and an impact's is a separate gap.
 *      (Corrected on 16 September 2026, after this round was run and adopted:
 *      "the average exposed population" is wrong and the numbers are not.
 *      Figure 12.64 is captioned "Radiant exposure required to produce skin
 *      burns for different skin pigmentations" and attaches no probability to
 *      any curve; "50 % of an average exposed population" belongs to the solid
 *      lines of the neighbouring Figure 12.65, which this project does not
 *      read. The middle curve is the middle pigmentation and nothing more. The
 *      last paragraph says what that costs.)
 *  82. What decides. The candidate replaces three numbers of the project's own
 *      with the curves of the book the project cites for them, so it is
 *      adopted unless a guard fails: (a) rule 80's three checks on the trace;
 *      (b) the release gate stays PASS — no gated row of the calibration net
 *      leaves its band; (c) no ring of a net explosion moves by more than a
 *      factor of two, which a misread figure could not pass. The tolls of the
 *      net's explosions are read and printed; Hiroshima's is tuned on its own
 *      mortality and Beirut's charge is chemical, which draws no flash, so
 *      neither can decide.
 *  83. What is printed. For every explosion preset and for the net's rows: the
 *      exposure the book gives at that yield, the three rings before and
 *      after, and the toll. Beside, deciding nothing: the same at the light
 *      and dark curves, which bracket the middle one, and the yields where the
 *      trace is held flat.
 *  84. What an adoption does. `burnExposure` defaults to `glasstone1977`, in
 *      the simulator and in the harness; constants.ts keeps the three project
 *      fluences for the impact rings and says so; the methodology page and the
 *      report name the book's figure. The rules that decided before keep their
 *      verdicts and their printed figures move, as rule 44 has it, and nothing
 *      is re-tuned (rules 5 and 6).
 *
 * What these rules cannot settle. The curves were traced from a scan by
 * machine, and a systematic error in the axis would move every threshold
 * together; the checks catch a crossing or a fall, not a shift. The book's
 * lines are for exposed skin with no evasive action and no protection from
 * structures or clothing (§12.64), in the lower atmosphere, and the exposure
 * is what reaches the skin — clothing, shade and pigment move it by more than
 * the reading error.
 *
 * And one thing these rules read wrongly, found on 16 September 2026 after
 * they had been run and adopted, and left here rather than quietly mended.
 * Figure 12.64 gives the exposure *required to produce* a burn of a degree on
 * a pigmentation. It carries no probability. The book's Figure 12.65, on the
 * next page, gives the same thing as probabilities — solid lines for 50 % of
 * an average exposed population, broken lines for the 18 % and 82 % bands —
 * and the worked example rule 80 checks against (§12.65: between 4.5 and
 * 6 cal/cm² at 1 Mt, 18 % second-degree and the rest first) is read off *that*
 * figure, not this one. So rule 80's fourth check is a consistency check
 * across two figures and not a reproduction of an example on the one traced,
 * and it is weaker than it was described as being. What the example does say
 * is where the traced curves sit beside it: at 1 Mt the first-degree curve for
 * a middling skin asks 3.32 cal/cm², below the 4.5-to-6 band in which §12.65
 * puts 18 % of an exposed population at second-degree burns and the rest at
 * first, and the second-degree curve asks 6.30, just above it. Whether the
 * rings this project draws are wider or narrower than 12.65's 50 % rings is
 * not settled here, because 12.65 has not been traced. Doing so — which would
 * also give the product the book's own 18 % and 82 % bands around each ring —
 * is a round nobody has run. Nimbus's own
 * transmission and partition sit between the yield and the exposure, and
 * neither is the book's (the partition is a straight line where the book
 * gives a table). And the tolls cannot judge the change: no row of the net
 * counts the burned apart from the dead.
 */

/** Rule 81's candidate and the exposure in place. */
export const BURN_IN_PLACE: BurnExposureSource = 'project';
export const BURN_CANDIDATE: BurnExposureSource = 'glasstone1977';

/** Rule 82 (c): the most a ring may move and still be believed. */
export const BURN_RING_FACTOR = 2;

/** Rule 80's checks on the traced table. */
export interface BurnTraceChecks {
  nine: boolean;
  risesWithYield: boolean;
  neverCrosses: boolean;
  /** The book's §12.65 example at 1 Mt: between 4.5 and 6 cal/cm² lies above
   *  the first-degree line and below the second-degree one. */
  matchesTheExample: boolean;
}

export function burnTracePasses(checks: BurnTraceChecks): boolean {
  return checks.nine && checks.risesWithYield && checks.neverCrosses && checks.matchesTheExample;
}

/** Rule 82: whether the candidate is adopted. */
export function chooseBurnExposure(input: {
  trace: BurnTraceChecks;
  gatePasses: boolean;
  worstRingFactor: number;
}): { adopted: boolean; trace: boolean; gate: boolean; rings: boolean } {
  const trace = burnTracePasses(input.trace);
  const gate = input.gatePasses;
  const rings =
    Number.isFinite(input.worstRingFactor) &&
    input.worstRingFactor <= BURN_RING_FACTOR &&
    input.worstRingFactor >= 1 / BURN_RING_FACTOR;
  return { adopted: trace && gate && rings, trace, gate, rings };
}
