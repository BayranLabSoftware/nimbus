/**
 * Rules 541 to 547 — the ceiling B-084 needs, 21 September 2026, written and
 * pushed before the candidate ran.
 *
 * WHAT IS BROKEN. B-084: the impulse wave manual's generation is what this
 * product ships for a subaerial slide, and outside the ranges it was fitted
 * on it has no upper bound at all. A 3×10⁸ m³ slide at 35° into 30 m of
 * water draws 594 m of wave, twenty times the column, and the invariant
 * sweep finds 278 of its 1 827 subaerial scenarios above their own water
 * depth, the worst at 1 102×.
 *
 * WHY THERE IS NO CEILING. There was one, and removing it was right.
 * Rule 163 took away a 0.4 h ceiling on 17 September 2026 because the manual
 * reaches far more than that inside its own experiments, so the ceiling was
 * cutting the field's method where the field had measured it. What nobody
 * did was put anything in its place outside that range.
 *
 * RULE 541. WHAT THIS ROUND IS. A ceiling on the first crest, and nothing
 * else. It repairs a registered defect in a shipped law; it is not a
 * candidate competing with another law and there is no score.
 *
 * RULE 542. THE CEILING IS COMPUTED, NOT CHOSEN. It is the largest first
 * crest the manual's own Eq. (3.26) can produce anywhere inside the box its
 * own Table 3-3 fits it in:
 *
 *     a_0,c1 / h = 0.2 P^0.5 (b/h)^0.75 (cos α_eff)^0.25
 *
 * maximised over P ≤ 2.08, b/h ≤ 5 and α ≥ 30° (so α_eff = (6/7)α ≥ 25.71°,
 * whose cosine is largest at the smallest α). That maximum is
 *
 *     0.939651 h
 *
 * and it is the same 0.94 the code comment in `events/volcano/tsunami.ts`
 * has cited since 17 September without deriving. Nothing about this number
 * comes from a scenario, a record or a score: it is the manual's own
 * equations read at the corner of the manual's own limits. A ceiling set
 * anywhere else — at the water column, at McCowan's 0.78, at a round
 * number — would be this project's opinion, and this one is not.
 *
 * RULE 543. RULE 163'S DECISION IS PRESERVED EXACTLY, and that is checked
 * rather than asserted. By construction the ceiling cannot bind on any slide
 * inside the fitted box, because it IS that box's maximum. The test walks
 * the box — its corners and a grid inside it — and requires the ceiling to
 * change nothing anywhere in it. If it binds even once inside, the
 * derivation is wrong and the round is refused.
 *
 * RULE 544. IT APPLIES EVERYWHERE, not only outside the box. Since rule 543
 * says it binds on nothing inside, a gate would be a branch that never
 * fires — and this project has learned what a branch with a threshold costs
 * (B-083, and the 21× seam of rules 509 to 517). One expression, no seam.
 *
 * RULE 545. THE FIRST CREST ONLY. The manual's other two amplitudes have
 * their own maxima over the same box — the first trough reaches 1.071370 h
 * and the second crest 0.244942 h — so a single ceiling applied to all three
 * would cut the trough inside the fitted range, which is exactly the mistake
 * rule 163 undid. The first crest is what this product hands downstream as
 * its source amplitude, and it is the only thing this round touches.
 *
 * (This file said 1.4666 and 0.3923 when it was pushed. Those came from a
 * misreading of Eqs. (3.27) and (3.28) out of a PDF extractor — P and cos
 * α_eff at the wrong powers. `impulseWave.ts` has the right exponents and is
 * verified to the manual's worked Examples 1 and 2 to their last digit, so
 * the implementation was right and the derivation in this file was not. The
 * argument survives unchanged: the trough still passes the water column
 * inside the box, so one ceiling on all three would still cut it.)
 *
 * RULE 546. WHAT MAY NOT MOVE, with a prediction attached so the clause can
 * be wrong.
 *
 *   (a) L2's 43 rows. **Predicted: none of them moves**, because a row the
 *       manual's spreadsheet agrees with is a row inside the manual's box,
 *       and rule 543 says the ceiling does not bind there. If one moves,
 *       either the prediction or the derivation is wrong and the round is
 *       refused until it is known which.
 *   (b) Every recorded wave, and every landslide preset. Predicted: none
 *       moves — Lituya Bay stands at 0.78 h, Anak Krakatau at 0.75 h,
 *       Vaiont at 0.68 h, all under the ceiling.
 *   (c) Every domain that is not a landslide wave, to the bit.
 *
 * RULE 547. WHAT REFUSES IT.
 *   (a) The ceiling binding anywhere inside the fitted box (rule 543).
 *   (b) Anything of rule 546 moving.
 *   (c) Any remaining subaerial scenario of the 5 000-scenario sweep whose
 *       source amplitude still exceeds its own water depth.
 *   (d) The sweep failing where it passes today.
 *
 * One run, no re-tuning: the ceiling is not adjusted after a figure is seen,
 * and if it is refused B-084 stays open with the refusal published.
 */

/**
 * Rule 542: the corner of the manual's Table 3-3 at which its first crest is
 * largest, and the value there. Written down so the test can re-derive it
 * rather than trust the constant.
 */
export const CEILING_DERIVATION = {
  /** Largest impulse product parameter the manual fits. */
  impulseProduct: 2.08,
  /** Largest relative slide width. */
  relativeWidth: 5,
  /** Smallest slide impact angle, whose α_eff has the largest cosine. */
  angleDeg: 30,
  /** a_0,c1 / h there. */
  ceiling: 0.939651,
} as const;

/** Rule 545: the other two amplitudes' maxima over the same box, recorded so
 *  that nobody later applies this one ceiling to all three. */
export const OTHER_MAXIMA = {
  firstTrough: 1.07137,
  secondCrest: 0.244942,
} as const;

/** Rule 546(b): where the presets stand, as fractions of their own depth. */
export const PRESET_HEADROOM = {
  LITUYA_BAY_1958: 0.78,
  ANAK_KRAKATAU_2018: 0.75,
  VAIONT_1963: 0.68,
} as const;

export const AMPLITUDE_CEILING_RULES = 'rules 541 to 547, fixed 21 September 2026';
