import type { RadiationSource } from '../effects/initialRadiation.js';

/**
 * The initial nuclear radiation, from the figures the book actually draws.
 *
 * Nimbus draws its three initial-radiation rings from a project fit: an LD₅₀
 * range of 700 m at 1 kt growing as the yield to the 0.18, with LD₁₀₀ at
 * 0.7 of it and the acute-radiation threshold at 1.4. The fit's own comment
 * credits its anchors to a "Glasstone Fig. 8.46", which is not a dose–range
 * figure of the book — the dose–range figures are 8.33a and b for gamma rays
 * and 8.64a and b for neutrons — and says the anchors were never rechecked
 * against it. The fit ignores the height of burst, which those figures do not:
 * they give a slant range, for a burst at 290·W^0.4 feet, corrected towards a
 * contact surface burst below 300 feet. The validation report has carried the
 * difference as a declared gap since 14 September 2026, and docs/GOLD_STANDARD
 * asks (N1) that no fit of the project's stand in where the book gives a
 * curve. These rules close it, or say why not.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out: the four figures and their captions; Table 8.37 and §§8.33 to 8.37
 * and 8.63 to 8.65, which say what the curves are drawn for and how to correct
 * them; the book's own worked example at §8.34 (2 000 yards from a 50 kt
 * fission air burst: "somewhat less than 300 rads … about 250"); the curves as
 * scripts/benchmark/dose-curves.py traced them; and the rings a handful of
 * yields draw under them, which is what rule 88 prints. No toll and no row of
 * the calibration net was run under the candidate before these rules were
 * fixed — and none can be, since no death in this model is counted from
 * radiation at all.
 *
 * The rules, fixed on 16 September 2026, before the candidate drew a ring for
 * any preset of the product, and numbered after the eighty-four before them:
 *
 *  85. The curves. Twenty-four, traced from the public scan of the book (DTIC
 *      ADA087568, printed pages 333, 334, 346 and 347) by
 *      scripts/benchmark/dose-curves.py: it calibrates each frame against that
 *      figure's own decade ticks, seeds one point per curve in a column clear
 *      of the labels, and follows each by continuity and slope. It refuses to
 *      write anything unless (a) each figure holds six curves, (b) each rises
 *      with the yield, (c) none crosses another, (d) the fission and
 *      thermonuclear figures of one radiation agree within 18 % where they
 *      meet at 100 kt — they are different weapons, so they need not be equal,
 *      but a misread axis would part them further — and (e) the traced gamma
 *      table reproduces the book's own worked example at §8.34, between 180
 *      and 320 rads where the book reads about 250. They are read at eleven
 *      yields from 1 to 100 kt and twelve from 100 kt to 20 Mt into
 *      effects/initialRadiationData.ts, committed before the candidate is run
 *      on anything. doseRules.test.ts holds the table to those checks.
 *  86. The candidate (`glasstone1977`). The dose at a slant range is the
 *      gamma-ray dose of Figure 8.33 plus the neutron dose of Figure 8.64,
 *      each interpolated in the logarithm of the yield between the traced
 *      points and in the logarithm of the dose between the curves, held flat
 *      in yield outside the figures. A yield below 100 kt reads the fission
 *      figures and one at or above it the thermonuclear pair, which is the
 *      book's own division. The burst's height enters twice, as the book has
 *      it: below 300 feet the dose is corrected towards a contact surface
 *      burst, by Table 8.37 for gamma rays and by one half for neutrons
 *      (§8.37, §8.65); and since the figures give a slant range, the ring on
 *      the ground is √(slant² − height²). The three doses the rings are drawn
 *      at do not move: 800, 450 and 100 rads, project values from UNSCEAR and
 *      BEIR VII, not from this book.
 *  87. What decides. The candidate replaces a fit of the project's, whose own
 *      anchors cite a figure that does not exist, with the curves of the book
 *      the project cites for them, so it is adopted unless a guard fails:
 *      (a) rule 85's five checks on the trace; (b) the release gate stays PASS
 *      — which no toll can disturb, since radiation kills nobody in this model,
 *      and the guard is kept only to catch a change that reaches further than
 *      it should; (c) at a fixed height of burst the three radii keep their
 *      order, LD₁₀₀ inside LD₅₀ inside the threshold, and each grows with the
 *      yield across the figures' whole span — save at 100 kt, where the book
 *      itself changes from a fission weapon to one of half that fission yield
 *      and its own two figures step down; that step is rule 85 (d)'s to bound
 *      and rule 88's to print, and is not re-checked here. A misread axis
 *      could not pass (c).
 *  88. What is printed. For every explosion preset and for a grid of yields:
 *      the three ranges before and after, the dose the book gives at the
 *      range the fit drew, and which of them read a yield or a height outside
 *      the figures. Beside, deciding nothing: the same ranges at the book's
 *      own reliability factors — 0.5 to 2 for fission weapons, 0.25 to 1.5 for
 *      thermonuclear ones — and the step at 100 kt where the weapon changes.
 *  89. What an adoption does. `radiationSource` defaults to `glasstone1977`,
 *      in the simulator and in the harness; radiation.ts keeps the fit and
 *      says what it was; the methodology page and the report name the four
 *      figures and carry the book's reliability. The rules that decided before
 *      keep their verdicts and their printed figures move, as rule 44 has it,
 *      and nothing is re-tuned (rules 5 and 6).
 *
 * What these rules cannot settle. No death in Nimbus is counted from initial
 * radiation, so no toll of the calibration net can judge this: it is a reading
 * of the book against a fit, not of either against the world. The curves were
 * traced from a scan by machine, and a systematic error in an axis would move
 * a whole figure together; the checks catch a crossing, a fall or a parting at
 * 100 kt, not a shift — though the book's own worked example would catch a
 * large one in the gamma pair. The figures stop at 1 kt and 20 Mt and are held
 * flat outside, so a 50 Mt burst is read as a 20 Mt one and its rings are too
 * small by an unknown amount. Rads of neutrons and of gamma rays are added
 * here as if they were worth the same, where the book says the same number of
 * rads of neutrons is often worth more (§8.65, §12.97). The book's own
 * reliability is a factor of two either way for a fission weapon, which is
 * wider than the distance between the fit and the curves at some yields. And
 * the whole of it is for an unshielded target on flat ground: a building, a
 * hill or a trench moves the dose by more than any of this.
 */

/** Rule 86's candidate and the law in place. */
export const DOSE_IN_PLACE: RadiationSource = 'project';
export const DOSE_CANDIDATE: RadiationSource = 'glasstone1977';

/** Rule 85's checks on the traced figures. */
export interface DoseTraceChecks {
  /** Six curves in each of the four figures, at the yields they were read. */
  six: boolean;
  risesWithYield: boolean;
  neverCrosses: boolean;
  /** The fission and thermonuclear figures of one radiation agree within 18 %
   *  where they meet at 100 kt. */
  meetsAt100Kt: boolean;
  /** The book's §8.34 example: 2 000 yards from a 50 kt fission air burst is
   *  "somewhat less than 300 rads … about 250". */
  matchesTheExample: boolean;
}

/** Rule 85 (d): how far apart the two figures of one radiation may stand where
 *  they meet. */
export const DOSE_MEET_TOLERANCE = 0.18;

/** Rule 85 (e): the band the book's own worked example has to land in. */
export const DOSE_EXAMPLE_RAD: readonly [number, number] = [180, 320];

export function doseTracePasses(checks: DoseTraceChecks): boolean {
  return (
    checks.six &&
    checks.risesWithYield &&
    checks.neverCrosses &&
    checks.meetsAt100Kt &&
    checks.matchesTheExample
  );
}

/** Rule 87: whether the candidate is adopted. */
export function chooseRadiationSource(input: {
  trace: DoseTraceChecks;
  gatePasses: boolean;
  /** Rule 87 (c): the three radii keep their order and grow with the yield. */
  ringsBehave: boolean;
}): { adopted: boolean; trace: boolean; gate: boolean; rings: boolean } {
  const trace = doseTracePasses(input.trace);
  return {
    adopted: trace && input.gatePasses && input.ringsBehave,
    trace,
    gate: input.gatePasses,
    rings: input.ringsBehave,
  };
}
