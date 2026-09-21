/**
 * Rules 654 to 659 — the seafloor taper, asked again. 21 September 2026,
 * IMP-2 of ROADMAP.md M11, written and pushed before the run.
 *
 * RULE 654. WHY IT IS ASKED AGAIN. An ocean impact sends to the seafloor a
 * share of its energy e^(−d/d_c) up to a disruption depth, and none beyond:
 * at that depth the share steps from e^(−3) to zero, and a body 1 % larger
 * that lands on the shallow side of its own cutoff sends 5 % less of its
 * energy into the water. G5 counts two tsunami amplitudes for it. Rules 132
 * to 137 measured a taper that reaches zero at the cutoff instead of
 * stepping there, `SeafloorCutoff` `taper` of effects/oceanCoupling.ts, and
 * REFUSED it on 16 September on one condition only, 136 (b): a crater
 * failure grew from two to three, because the taper moved a 139 m body into
 * 51 m of water onto Collins et al.'s simple-to-complex step, 3 186 to
 * 2 941 m. Rules 647 to 653 have joined that step since, so the one reason
 * for the refusal is gone, and the candidate is asked again. Nothing about
 * the taper has changed.
 *
 * RULE 655. THE BAR IS RULE 136's, word for word. Adopted when all hold:
 *
 *   (a) no tsunami amplitude fails either invariant in its run;
 *   (b) no other invariant fails more often than in the run with the step,
 *       and none fails that did not;
 *   (c) the partition's calibration ends hold — a body under no water
 *       strikes the seafloor with all its energy, and none reaches it from
 *       the disruption depth on — and no number in the crater, damage and
 *       tsunami blocks of the ocean preset moves by more than a factor
 *       1 / (1 − e^(−3)) = 1.052;
 *   (d) with the taper as the default, every test of the suite passes but
 *       those that pin an ocean impact, which are read and updated, and the
 *       validation report regenerated on it keeps the release gate at PASS.
 *
 * RULE 656. THE RUN. The impact sweep's 5 000 scenarios on one commit, first
 * with the step, then with the taper, the default set by the one line that
 * names it.
 *
 * RULE 657. WHAT IT DOES NOT SETTLE, as rule 137 said: whether the seafloor
 * share ends at the cutoff smoothly or at once. The Eltanin record says no
 * crater is left, not how the share falls on the way there. The taper is the
 * continuous reading, and G5 asks continuity where the physics has no step.
 *
 * RULE 658. The refusal of 16 September stays recorded beside this.
 *
 * RULE 659. NO RE-TUNING, and one run.
 */

export const SEAFLOOR_TAPER_RULES = 'rules 654 to 659, fixed 21 September 2026';
