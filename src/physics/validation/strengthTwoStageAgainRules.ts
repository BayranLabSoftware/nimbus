/**
 * Rules 896 to 902 — a body's strength in two stages, asked again. Written on
 * 23 September 2026 on Andrea's word («inizia», for the three rounds that
 * followed the refusal of rules 881 to 889), after rules 890 to 895 were
 * adopted (9c3b652) and before this round's candidate is written.
 *
 * RULE 896. WHAT THIS IS. Rules 881 to 889 asked again: the same law (rule
 * 882), the same source (883), the same measures (885) and the same bars
 * (886 (a) to (d)), with two changes written here, before the run:
 *   (i) rule 882(c) done where the first candidate did not do it: under
 *       `twoStage`, for a body the law covers and no strength given, the
 *       Monte Carlo draws S1 and S2 log-uniform over their intervals — the
 *       first candidate drew neither, so its Monte Carlo ran every draw at
 *       the midpoints;
 *   (ii) the tests an adoption may update, listed in rule 898 before the
 *       run, so that none is chosen after it.
 *
 * RULE 897. WHY. Rules 881 to 889 were refused by rule 886(d) alone: the
 * Monte Carlo's median firestorm at Tunguska, a quantity zero in about half
 * its draws under the law. Rules 890 to 895 replaced that summary with how
 * often and how large (adopted, 9c3b652), and under the law the new test
 * passed (reported there). Nothing else of the refusal needed mending.
 *
 * RULE 898. WHAT AN ADOPTION MAY UPDATE — every test the first run saw fail,
 * each with its reason, and nothing else:
 *   (a) checks against the reference program, which computes the entry with
 *       Eq. 9: pinned to `density`, as level A's harness is — the four
 *       airburst-blast tests against the program's printed overpressures
 *       (effects/airburstBlast.test.ts), I2's cell-by-cell agreement with
 *       the program (entryCellsReading.test.ts, rule 726(c)), B-032's entry
 *       in the regression registry, and rule 77's run of a bolide
 *       (fireballRun.test.ts);
 *   (b) records of earlier rounds, pinned to the law they were measured
 *       under: rule 733's magnitudes of the presets
 *       (airburstSeismicRules.test.ts) and rule 847's body at the switch
 *       (craterFieldJoinedRules.test.ts);
 *   (c) records of the model, re-taken with what moved: the seal (rule 833);
 *       the entry band's ten numbers, computed as rules 739 to 747 compute
 *       them; I3's band for Tunguska — its two numbers, while its claim, the
 *       felled forest's 26.5 km inside the band, must still hold; the
 *       evidence table's figure for the 357 bolides, as the validation
 *       report measures it; and the candidate's own tests.
 * Any other test that fails with the default switched is a failure of rule
 * 886(d).
 *
 * RULE 899. WHAT DECIDES. Rule 886 (a) to (d) as written, (d) read after
 * rule 898's updates; and (e) the coverage test of rule 892 passes with the
 * default switched and S1 and S2 drawn.
 *
 * RULE 900. WHAT WAS LOOKED AT BEFORE THESE RULES: the whole of the first
 * run (85816ca) — I2's 5.30 km, G5's zeros, the regression cases, the
 * fifteen tests — and the Monte Carlo under the law without strength draws
 * (9c3b652). This asking is not blind to them and does not claim to be: its
 * deciding clauses read development data and the code's integrity; whether
 * the law holds on bodies it has not met is level B's second round to say.
 *
 * RULE 901. WHAT MAY NOT HAPPEN. S1, S2, their intervals and the share of two
 * in three stay the source's. No test is updated beyond rule 898's list, and
 * none of that list beyond what its reason allows. One run.
 *
 * RULE 902. WHAT AN ADOPTION DOES. What rule 889 says, and: the entry's card
 * says what the law is and that it is measured on bodies of 0.2 to 1.3 m and
 * extrapolated above; its level B text, which says the model "ties strength
 * to density alone", is put in the past, as what the first round tested; the
 * validation report is regenerated once. A refusal records why.
 */

/** The outcome, written after the run. */
export const STRENGTH_TWO_STAGE_AGAIN_OUTCOME: string | null = null;
