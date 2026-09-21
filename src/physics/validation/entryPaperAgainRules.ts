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

/** Rule 678: the seed of the run on scenarios nobody has seen. */
export const ENTRY_HELD_OUT_SEED = 'benchmark-2026-09-21-heldout-entry';

export const ENTRY_PAPER_AGAIN_RULES = 'rules 676 to 682, fixed 21 September 2026';
