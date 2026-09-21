/**
 * Rules 691 to 697 — the entry on its paper's equations, read by what a
 * wrong entry would show. 21 September 2026, IMP-2 of ROADMAP.md M11,
 * written and pushed before any of the runs they describe.
 *
 * RULE 691. WHAT THIS ROUND IS. The candidate of rules 667 to 675 and 676 to
 * 682, unchanged: `DEFAULT_ENTRY_EQUATIONS` from `program` to `paper`, for
 * the reasons of rules 668 to 670 (`entryPaperRules.ts`). Asked a third time
 * because both refusals were by an instrument that could not tell a ring the
 * height of burst shrinks from a ring a defect shrinks, and said so; since
 * rules 683 to 690 the harness can.
 *
 * RULE 692. WHY NOT A COUNT. A change to the entry moves every breakup
 * altitude, and with them which rings the height of burst shrinks, which
 * airburst magnitudes fall — the program's relation, a known defect — and
 * which bodies land whole. A count of failures in a known kind moves with
 * it, up or down, and says nothing of whether the change is right; rules 676
 * to 682 were refused by such a count, three rings the height of burst
 * shrank. What a wrong entry would show is a new kind of failure, or a
 * source that jumps. This round reads those, and lists the rest.
 *
 * RULE 693. THE RUNS. On one commit, where the default is still `program`,
 * with the statement of rules 683 to 690 wired: the sweep's own seed and
 * `ENTRY_THIRD_HELD_OUT_SEED`, which no run has used, each under both
 * entries (`NIMBUS_ENTRY_EQUATIONS=paper` for the paper's). Then the default
 * moves, the validation report is regenerated once, and I2's script is run.
 *
 * RULE 694. WHAT DECIDES. Adopted when all of these hold:
 *
 *   (a) the report regenerated on the paper's entry keeps the release gate
 *       at PASS;
 *   (b) I2's script on the paper's entry reads 352 fireballs within 1 %, 4
 *       through BM-13, none beyond, 1 refused by the program, and I2 MET;
 *   (c) every test that holds what the program prints passes on the
 *       program's arm;
 *   (d) `effects/entryExactBreakup.test.ts` passes;
 *   (e) on each seed, no key G5 reads appears under the paper's entry that
 *       the program's run on the same seed does not print;
 *   (f) on each seed, no blast ring is counted under the paper's entry for a
 *       source that jumps, but where the paper's own I_f crosses 1 within
 *       the step — B-091, which both entries have — and none of those the
 *       program's run counts at B-089's seam, where its doubled I_f crosses
 *       1, is counted under the paper's;
 *   (g) a test in CI holds that on the default, B-089's body grows through
 *       the old seam with no step in its share of energy at the ground, or in
 *       its field.
 *
 * Otherwise refused, the default stays `program`, B-089 stays open, and the
 * failing items are printed.
 *
 * RULE 695. WHAT IS LISTED AND NOT READ. For every key G5 reads, the
 * scenarios that fail under one entry and not the other, each with its I_f,
 * so that a reader sees what moved. No condition reads the list.
 *
 * RULE 696. WHAT THE REFUSED RUNS SHOWED THAT NO CONDITION READS, printed
 * again with (a): the paper's entry misses the sky's bolides a little more
 * than the program's, because twice Eq. 12's I_f breaks a body lower and the
 * model bursts too high (rule 681).
 *
 * RULE 697. WHAT THIS DOES NOT CLAIM, as rule 675: that Eq. 11 is right for
 * real bodies — B-091 is the paper's own jump, and stays open — or that G5 is
 * met.
 */

/*
 * ===========================================================================
 * The outcome, written after the runs of 21 September 2026: ADOPTED
 * ===========================================================================
 *
 * The rules were pushed in `63a2ff4` and the four sweeps made on that commit
 * (`benchmark/results/invariants-2026-09-21-19.json` and `-20` on the own
 * seed, the program's entry and the paper's; `-21` and `-22` on
 * `benchmark-2026-09-21-heldout-entry-3`). Then the default moved.
 *
 *                                   program's entry   paper's entry
 *   own seed, count G5 reads                    39              39
 *   unseen seed, count G5 reads                 46              46
 *   blast rings explained, own seed            396             392
 *   blast rings explained, unseen seed         347             354
 *
 * (a) HOLDS. The report regenerated on the paper's entry: release gate PASS
 *     (strict), tolls 13 of 18, waves 10 of 16, replay 3 of 3, golden 12 of
 *     12. The grid's breakup altitudes read 1.00–1.01× of the program's, burst
 *     altitudes 1.00–1.05×, airburst overpressures 1.00–1.01×. And rule 696's
 *     line: on the 357 bolides the body with no class misses the sky by
 *     +12.8 km on average where it missed by +12.7; the stony class by a
 *     median 8.3 km where it missed by 8.1, 99 within 5 km where 105 were.
 * (b) HOLDS. I2's script: 352 within 1 %, 4 through BM-13, none beyond, 1
 *     refused by the program; the model implements the reference; I2 MET.
 * (c) HOLDS. Every test holding what the program prints passes on the
 *     program's arm, which each names; every test of every project passes on
 *     the new default, 2 779.
 * (d) HOLDS. `effects/entryExactBreakup.test.ts` passes.
 * (e) HOLDS. On both seeds the keys G5 reads are the same under both
 *     entries, and so are their counts.
 * (f) HOLDS. No blast ring is counted for a jumping source under the paper's
 *     entry on either seed; the program's runs drew no body at B-089's seam
 *     on these two seeds, so there was none to lose.
 * (g) HOLDS. `entryPaperThirdRules.test.ts`: across the old seam, in steps of
 *     0.005 %, the share of energy at the ground moves by less than 0.01 %
 *     at a time, and rule 662's search finds no jump in the field at 1 km.
 *
 * Rule 695's list is empty: on both seeds, for every key G5 reads, the same
 * scenarios fail under both entries.
 *
 * So `DEFAULT_ENTRY_EQUATIONS` is `paper`, the departure from the program is
 * named in I1 with its reason, and B-089 is closed. B-091, the paper's own
 * jump where I_f crosses 1, stays open.
 */

/** Rule 693: the seed of the run on scenarios nobody has seen. */
export const ENTRY_THIRD_HELD_OUT_SEED = 'benchmark-2026-09-21-heldout-entry-3';

export const ENTRY_PAPER_THIRD_RULES = 'rules 691 to 697, fixed 21 September 2026';
