/**
 * Rules 1193 onward — the corrections the NASA-lab audit of 25 September 2026
 * found (`~/Desktop/Nimbus-audit-NASA-2026-09-25.pdf`, commit 04eefcd,
 * verified figure by figure against the repository before any of this was
 * written). Andrea's word: follow the audit to the letter, do all of its
 * "correzioni immediate" (A2, A7, A8, A11, A12 of the audit's own numbering),
 * and take no other decision without asking him first. This file is the
 * "regole scritte prima" for that work — one rule per correction, written
 * before the code that makes it, in the order `Nimbus-PIANO.md` sets.
 *
 * RULE 1193. A2 — THE SCORECARD MUST COUNT WHAT IT PRINTS IN PROSE.
 *
 * The defect, in the audit's words: I2 reads "met" because, since the
 * amendment of 16 September 2026, it is scored against the Earth Impact
 * Effects Program's own entry on the same 357 fireballs, not against the
 * altitude of peak brightness the rule asked for as first written; I3 reads
 * "met" after two amendments of 21 September 2026, the second of which
 * rewrote its 90 %-of-runs clause into "matches whatever the field's own
 * tool achieves" in the same commit that first computed what the field's own
 * tool achieves (27 of 43, 63 %) — `git show f71dcb3` says so in its own
 * message: "the runs became scorable this afternoon ... and at them the
 * band ... holds 27 of 43 ... Recorded beside the amendment." That is a
 * bound written knowing the figure, which `docs/GOLD_STANDARD.md` has
 * forbidden since it was first written ("never loosened after a figure has
 * failed it"). Both rules' evidence text already says as much in prose —
 * "under the bound as first written, not met" appears for both — but the
 * *counted* status, the one field `ruleHolds` reads and the one the 8.0 of 9
 * on the public scorecard is built from, only ever reflects the amended
 * reading. A reviewer who reads the number and not the paragraph sees a
 * validation that is not there.
 *
 * This project's own rule already says how to fix it, and has since
 * commit 955c096: "A bound changes only by a dated amendment in this file
 * that says why ... and it is never loosened after a figure has failed it."
 * The 16 September amendment kept to that — it left I2 *pending*, not met,
 * because the reference had not yet been run, and only crossed to "met" in
 * a later, separate commit (8c401e8) once the program's own 357-fireball run
 * was in hand. The second 21 September amendment to I3 did not keep to it:
 * it rewrote I3's own bound in place, in the same commit that first computed
 * the figure the rewritten bound would need to pass.
 *
 * The fix, exactly as the audit's "come migliorare" asks: freeze I2 and I3
 * as first written, permanently, at the status their own original bound
 * gives them — never edited again, whatever a future amendment measures.
 * What the 16 September and 21 September amendments were actually
 * measuring — agreement with a tool of the field, not agreement with the
 * sky — becomes its own rule, numbered fresh (I5 for the fireball entry,
 * I6 for the airburst band), counted beside I2 and I3 and never merged into
 * them again. No number in either rule's evidence changes; the fireball
 * figures (13.74 km median, 12.75 km mean against the model; 13.68 and
 * 12.69 for the program) and the airburst figures (3.34× to 3.79× width,
 * 27 of 43 runs, both footprints held) are the ones already committed. What
 * moves is which rule they are counted under.
 *
 * One consequence stated before any code changes it: the Impacts domain's
 * reading on the public scorecard drops from 8.0 to whatever eleven rules
 * with I2 and I3 permanently at their original credit give it — computed
 * below, not chosen. This is the point of the fix, not a side effect of it.
 *
 * A second, separate correction the same rule covers: Level A
 * (`eiepComparison.ts`) pins `strengthLaw: 'density'` and
 * `craterDomain: 'legacy'` for every row of the 1 865-case grid, which is
 * not what the product ships (`DEFAULT_STRENGTH_LAW` is `'twoStage'`,
 * `DEFAULT_CRATER_DOMAIN` is `'hypervelocity'`). Pinning the reference's own
 * assumptions is the right way to ask "does the model implement Collins et
 * al.'s formulas correctly" — G1's question — and I1's clause text already
 * says so for the departures it names. It is the wrong way to answer a
 * different question the scorecard does not currently ask at all: how far
 * the configuration the product actually ships is from the program on the
 * same grid. Rule 1193(b) below runs the grid a second time on the shipped
 * configuration and prints both counts side by side; it changes no clause of
 * I1, because I1 is not the rule this was ever the wrong answer to — the gap
 * was that no rule asked the other question.
 *
 * RULE 1193(a). No figure computed for this rule may be adjusted after it is
 * read. The fireball and airburst figures are the ones already committed
 * (rules 126–128, 706–713); nothing is re-run to make a number more
 * favourable, and if the shipped-configuration grid of 1193(b) reads worse
 * than the pinned one, that is printed exactly as it reads.
 *
 * RULE 1193(b). Level A a second time, on the shipped configuration
 * (`strengthLaw: 'twoStage'`, `craterDomain: 'hypervelocity'`, the two
 * fields `eiepRowInput` pins today), same grid, same rows, same ε and the
 * same three bands (<2 %, 2–10 %, >10 %); printed beside the pinned-grid
 * count under a heading that says which is which, in the validation report
 * and nowhere it could be read as the same number twice.
 */
export const RULE_1193_WRITTEN = '2026-09-25' as const;
