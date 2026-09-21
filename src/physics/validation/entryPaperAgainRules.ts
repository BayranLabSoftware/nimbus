/**
 * Rules 676 to 682 — the entry on its paper's equations, asked again.
 * 21 September 2026, IMP-2 of ROADMAP.md M11, written and pushed before any
 * of the runs they describe.
 *
 * RULE 676. WHAT THIS ROUND IS. The candidate of rules 667 to 675
 * (`entryPaperRules.ts`), unchanged: `DEFAULT_ENTRY_EQUATIONS` from `program`
 * to `paper`. Rule 673 (e) refused it by one key the sweep printed that G5
 * does not read. Its reasons, rules 668 to 670, are untouched by that run.
 * These rules are written after it and knowing all its numbers, so nothing
 * read on the own seed is evidence for them; the test that can fail is on a
 * seed no run has used.
 *
 * RULE 677. WHAT (e) MEANT, written as meant. A key G5 reads is one rule 664
 * of `fieldJumpRules.ts` does not set apart. The keys it sets apart — the
 * checks as they were, printed beside the corrected ones, and the field the
 * search found continuous — are printed for a reader to compare, and they
 * may appear or vanish whenever the model moves. They are not failures, and
 * no condition of this round reads them.
 *
 * RULE 678. THE RUNS. On one commit, where the default is still `program`,
 * the harness reads the paper's entry through `NIMBUS_ENTRY_EQUATIONS=paper`,
 * added for this round as `NIMBUS_GROUND_BLAST` was for rules 630 to 637.
 * Four runs of 5 000 impacts: the sweep's own seed and `ENTRY_HELD_OUT_SEED`,
 * each under both entries. Then the default moves, the validation report is
 * regenerated once, and I2's script is run again.
 *
 * RULE 679. WHAT DECIDES. Adopted when all of these hold:
 *
 *   (a) the report regenerated on the paper's entry keeps the release gate
 *       at PASS;
 *   (b) I2's script, on the paper's entry against the program's stored
 *       answers, reads 352 fireballs within 1 %, 4 through BM-13, none
 *       beyond, 1 refused by the program, and I2 MET;
 *   (c) every test that holds what the program prints passes on the
 *       program's arm, which each of them names since `26afe63`;
 *   (d) `effects/entryExactBreakup.test.ts` passes;
 *   (e) on each seed, no key G5 reads appears under the paper's entry that
 *       the program's run on the same seed does not print, and the count G5
 *       reads does not rise;
 *   (f) a test holds that on the default, B-089's body grows through the old
 *       seam with no step in its field.
 *
 * Otherwise refused: the default stays `program`, B-089 stays open, and the
 * failing items are printed.
 *
 * RULE 680. WHAT IS EXPECTED on the unseen seed, so that the run can say
 * otherwise: the paper's entry prints no kind of failure the program's does
 * not, and no more of them. Where a ring shrinks under the paper's entry
 * and not under the program's, the outcome lists the scenario with its I_f.
 *
 * RULE 681. WHAT THE REFUSED RUN SHOWED THAT NO CONDITION READS, and is
 * printed again when this one is: on the 357 bolides the paper's entry
 * misses the sky a little more than the program's — twice Eq. 12's I_f
 * breaks a body lower, and a model that bursts too high is helped by what
 * lowers it. That is not a reason for a relation, and it is not one against.
 *
 * RULE 682. WHAT THIS DOES NOT CLAIM, as rule 675: that Eq. 11 is right for
 * real bodies, or that G5 is met.
 */

/*
 * ===========================================================================
 * The outcome, written after the runs of 21 September 2026: REFUSED, by
 * rule 679 (e) on the unseen seed
 * ===========================================================================
 *
 * The rules were pushed in `167c1ed` and the four runs made on that commit,
 * the default `program` and the paper's entry read through
 * `NIMBUS_ENTRY_EQUATIONS=paper` (`benchmark/results/invariants-2026-09-21-
 * 11.json` and `-12` on the own seed, `-13` and `-14` on
 * `benchmark-2026-09-21-heldout-entry`).
 *
 *                                   program's entry   paper's entry
 *   own seed, count G5 reads                   435             431
 *   unseen seed, count G5 reads                409             412
 *   keys G5 reads, new on the paper's           —         none, on either
 *
 * (e) fails on the unseen seed: the count rises by three — 1 psi rings 124 to
 * 126, light-damage rings 135 to 137, airburst magnitudes 29 to 28. The run
 * stopped there; (a) to (d) and (f) were not read again.
 *
 * What rule 680 asks to be listed. Six rings shrink on the paper's entry and
 * not on the program's, all three blast rings of two bodies: a 7.15 m iron
 * at 17.9 km/s and 81°, I_f 0.436, a complete airburst; and a 24.6 m iron at
 * 21.3 km/s and 35°, I_f 0.221, a partial one. Two rings shrink on the
 * program's and not on the paper's, one 5 psi ring each of a 49.3 m stone
 * at 1.5 km/s (I_f 0.116) and a 42.2 m body at 17.3 km/s (0.003). Every one
 * is where the doubling of I_f moves the breakup — I_f from 0.1 to 0.44 —
 * and on the paper's entry each of the six has a source that moves without
 * a step and, at the larger body's energy and the smaller body's altitude, a
 * ring that does not shrink: the altitude moved it, as the height of burst
 * does (`blastSource.ts`, read after the run).
 *
 * So what (e) measured is how many rings the height of burst shrinks, which
 * moves with every breakup altitude, and not whether the paper's entry adds
 * a kind of failure — which it did not, on either seed. The criterion was
 * the wrong instrument, and it was written before the run; the round is
 * refused as it says. The default stays `program`, and B-089 stays open.
 *
 * What comes next follows from it. Until the harness can tell a ring the
 * height of burst shrinks from a ring a defect shrinks, no change to the
 * entry can be read against G5 by its count. That is IMP-2b's statement,
 * refused on B-089's seam: asked again as the source's altitude and energy,
 * on the program's entry, with the seam's rings counted by name — and then
 * the paper's entry, read by the failures no cause explains.
 */

/** Rule 678: the seed of the run on scenarios nobody has seen. */
export const ENTRY_HELD_OUT_SEED = 'benchmark-2026-09-21-heldout-entry';

export const ENTRY_PAPER_AGAIN_RULES = 'rules 676 to 682, fixed 21 September 2026';
