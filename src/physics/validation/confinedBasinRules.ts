/**
 * Rules 532 to 540 — rewiring the confined basin onto the manual,
 * 21 September 2026, written and pushed before the candidate was built.
 *
 * WHAT IS BEING REPLACED. A landslide entering a confined basin draws
 *
 *     η_source = min( V / A_basin × confinementDynamicFactor , h )
 *
 * with the factor defaulting to 1.8. That 1.8 was chosen so that the Vaiont
 * preset stands at 162 m, inside the 125–165 m the record allows: it is
 * tuned on the single event it is checked against, and `recordedWaves.ts`
 * says so in its own caveat. L1 exists to remove exactly this.
 *
 * WHAT IT IS BEING REPLACED WITH. The impulse wave manual, which is a
 * manual for reservoirs and has the case already: generation by Eqs. 3.26 to
 * 3.28 (`effects/impulseWave.ts`, verified on 143 cases), three-dimensional
 * propagation by Eqs. 3.22 to 3.25 and 3.29 to 3.31
 * (`effects/impulseWavePropagation.ts`, verified on eleven printed numbers),
 * and the two-dimensional channel decay of Eq. 3.19
 * (`effects/channelDecay.ts`, verified on the manual's own worked leg) where
 * the reservoir narrows. All three are already in CI and none of them is
 * fitted here.
 *
 * RULE 532. THE ROUND'S REAL DIFFICULTY, named first because everything
 * else depends on it. The manual's equations want a **geometry**: a slide
 * width b, a still water depth h on the slide axis, a radial distance r, a
 * propagation angle γ, and the place where the reservoir stops being a basin
 * and becomes a channel. Nimbus has none of that for a confined basin. It
 * has one number, `confinedBasinArea`, and a volume.
 *
 * So the first thing this round must do is decide how that one number maps
 * onto the manual's geometry — and **the mapping must be derivable from the
 * manual**, from its §3.2.4.1 "Values independent of 2D or 3D" and its
 * Figure 3-2, or from a source the report can cite. A mapping chosen because
 * it makes Vaiont come out at 162 m is the incumbent's sin with extra steps.
 *
 * If no such mapping exists, **the round is refused and says so**: the
 * finding is then that the product needs a reservoir geometry it does not
 * ask for, and the next step is an input, not a law.
 *
 * RULE 533. VAIONT CANNOT JUDGE THIS. It is a tuning row — rule 5 has
 * always said a row used to set a parameter cannot validate what replaced
 * it, and the incumbent hits 162 m by construction. So:
 *
 *   (a) the candidate's Vaiont figure is REPORTED against the observed
 *       125–165 m, with the word "tuned" beside the incumbent's;
 *   (b) "the incumbent is closer to Vaiont" is **not** evidence and may not
 *       be written as if it were;
 *   (c) the candidate is neither adopted for hitting it nor refused for
 *       missing it. What refuses it is rule 537.
 *
 * This is the clause most likely to be quietly broken, because Vaiont is the
 * only confined-basin event this project holds and it is very tempting to
 * read it as a score.
 *
 * RULE 534. THE SEAM BETWEEN THE MANUAL'S OWN TWO CASES. The candidate
 * switches from 3D propagation to 2D channel decay somewhere, as the
 * manual's Example 2 does at point C. That switch is measured either side,
 * every other input held, and reported. Unlike rules 509 to 517, there is no
 * refusal threshold on it here and the reason is stated: this seam is
 * between two relations of the SAME reference, which the reference itself
 * switches between in its own worked example, so a limit would be this
 * project's opinion about the manual rather than a bar from the field. It is
 * measured and published, and if it is large that is a fact about the
 * manual worth publishing.
 *
 * RULE 535. WHAT MAY NOT MOVE.
 *   (a) L2's 43 rows. They are a slide entering open water from above; a
 *       confined-basin change that moved one reached outside its claim.
 *   (b) Every recorded wave except Vaiont, and every bar green today.
 *   (c) Every scenario that is NOT a confined basin — `confinedBasinArea`
 *       unset — to the bit.
 *
 * RULE 536. WHAT THE PRODUCT MUST SAY. Which of the manual's two reservoir
 * shapes drew the number, where the switch between them fell, and which of
 * the manual's limits the scenario is outside of. The same G4 duty the
 * subaerial branch already carries.
 *
 * RULE 537. WHAT REFUSES IT.
 *   (a) No mapping derivable from the manual (rule 532).
 *   (b) Anything of rule 535 moving.
 *   (c) A result that does not say which case drew it (rule 536).
 *   (d) The G5 sweep of 5 000 landslides failing where it passes today, or
 *       any non-finite or negative amplitude anywhere in it.
 *   (e) The candidate reaching a scenario with no `confinedBasinArea`.
 *
 * RULE 538. WHAT AN ADOPTION WOULD CLOSE, and what it would not. It would
 * make the relation that draws a confined basin's wave the manual's, held to
 * the manual's own worked examples, with its ranges declared — which is
 * L1's confined-basin half in full. It would NOT close L1, because L1 is one
 * rule over the whole domain and the submarine half stayed open on
 * 20 September.
 *
 * RULE 539. THE WARNING FROM RULE 522, repeated here because it is the
 * mistake this round is most likely to make. Eq. (3.19) is a decay law
 * fitted in the propagation zone, not a continuation of the peak. An
 * amplitude carried down the channel starts from the amplitude where the
 * channel begins — as Example 2 starts from a_c2 at point C — and starting
 * it from H_M of Eq. (3.13) is wrong by up to a quarter before the wave has
 * travelled anywhere. The two zones of the manual's Figure 3-3a do not join.
 *
 * RULE 540. ONE RUN, NO RE-TUNING. No coefficient, mapping, threshold or
 * clause above changes after a number is seen. `confinementDynamicFactor`
 * is not re-fitted; if the candidate is adopted the factor and its basin-fill
 * form stay reachable under `waveLaw: 'project'`, as every superseded law of
 * this project does, so that the comparison remains runnable.
 */

/** Rule 533: what the record allows at the dam, and what the incumbent does
 *  by construction rather than by agreement. */
export const VAIONT = {
  observedLowM: 125,
  observedHighM: 165,
  incumbentM: 162,
  incumbentIsTuned: true,
  tunedParameter: 'confinementDynamicFactor = 1.8',
} as const;

/** Rule 535(a): a row of L2's set may not move by more than this. */
export const SUBAERIAL_ROW_TOLERANCE = 1e-3;

/** Rule 536: which of the manual's two reservoir shapes drew a number. */
export type ReservoirShape = 'basin3D' | 'channel2D' | 'projectBasinFill';

export const CONFINED_BASIN_RULES = 'rules 532 to 540, fixed 21 September 2026';
