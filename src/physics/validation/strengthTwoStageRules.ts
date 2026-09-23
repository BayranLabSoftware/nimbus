/**
 * Rules 881 to 889 — a body's strength in two stages, drawn from what
 * meteoroids do in the air, not one number from its density. Phase 4 of the
 * plan, its first item, named by level B's outcome (d130dfa) and by the
 * reviewer's reply of 23 September 2026. Written that day on Andrea's word
 * («Vai avanti»), after level B's second round was frozen (3b2ff78) and
 * before the candidate is written, before any sweep is run on it and before
 * any case is read under it.
 *
 * RULE 881. WHAT THIS IS. A law, `strengthLaw`: `density` — today's: Collins,
 * Melosh & Marcus (2005) Eq. 9 from the density, or the strength the input
 * gives — or `twoStage`. `DEFAULT_STRENGTH_LAW` goes from `density` to
 * `twoStage` if rule 886 holds.
 *
 * RULE 882. THE LAW. Under `twoStage`, for a stony body (a density of 2 500 to
 * 5 000 kg/m³):
 *   (a) the main fragmentation, the second phase of Borovička, Spurný &
 *       Shrbený (2020), happens at a strength S2; the pancake of Collins et
 *       al. (2005, Eqs. 11 to 20) starts where the dynamic pressure reaches
 *       S2 — its breakup altitude, its burst altitude and everything that
 *       follows them are computed from S2 as they are today from Eq. 9;
 *   (b) the first fragmentation, their first phase, happens where the whole
 *       body's dynamic pressure, ρ(z) v(z)² with Eq. 8's speed, first
 *       reaches a strength S1; the model reports that altitude as
 *       `entry.firstFragmentationAltitude`, and the share of bodies whose
 *       first phase takes at least 40 % of the mass, two in three, as
 *       `entry.firstFragmentationMajorShare`;
 *   (c) S1 and S2 are the geometric midpoints of the source's intervals,
 *       0.069 MPa and 2.12 MPa; their uncertainty is log-uniform over 0.04
 *       to 0.12 MPa and 0.9 to 5 MPa, and is drawn wherever the model's
 *       inputs are drawn;
 *   (d) a strength the input gives is taken as S2, the first stage keeping
 *       its own;
 *   (e) the mass the first phase loses is not yet taken from the body: its
 *       energy stays with the pancake's burst. A later round may model it;
 *       this one does not.
 * Outside it the law is today's: an iron (5 000 kg/m³ and more), for which
 * the reviewer knows no standard prior, and a body under 2 500 kg/m³ —
 * carbonaceous, porous, cometary — for which no source is pinned here.
 *
 * RULE 883. THE SOURCE. Borovička, Spurný & Shrbený (2020), "Two strengths of
 * ordinary chondritic meteoroids as derived from their atmospheric
 * fragmentation modeling", AJ 160, 42 (arXiv:2006.07080v1, downloaded with
 * Andrea's leave on 23 September): the abstract ("The first phase typically
 * corresponds to low strengths of 0.04 – 0.12 MPa. In 2/3 of cases, the first
 * phase was catastrophic or nearly catastrophic with at least 40% of mass
 * lost. The second phase corresponds to 0.9 – 5 MPa for confirmed meteorite
 * falls"), and Sect. 4.1, p. 12 (the second phase "at 1 – 5 MPa (for Košice
 * at 0.96 - 5.7 MPa)"). The reviewer's table of 23 September names the same
 * intervals for ordinary chondrites of a metre, and a log-uniform
 * distribution. Their sample — seven falls and fourteen fireballs, bodies of
 * about 0.2 to 1.3 m — is excluded from level B (rule 876(d)); the paper
 * names Carancas once, qualitatively, as a rare body that lost little mass
 * (p. 13).
 *
 * RULE 884. WHAT WAS LOOKED AT BEFORE THESE RULES: that paper; the first
 * round's predictions and outcome (the model breaks 2023 CX1 at 47 km
 * against 29.4 km, and bursts too high everywhere); I2's median miss of
 * 13.7 km over the 357 CNEOS fireballs; the development and seen cases, read
 * many times. No run of the candidate: it does not exist.
 *
 * RULE 885. WHAT IS MEASURED, once, on the candidate committed with the
 * default unchanged:
 *   (a) level A, with the law pinned to `density` in its harness — level A
 *       verifies Collins et al.'s equations, and the reference program uses
 *       Eq. 9;
 *   (b) I2: the 357 CNEOS fireballs, under each law, their median absolute
 *       altitude miss;
 *   (c) the regression cases (2023 CX1, 2024 BX1, Carancas) and the seen
 *       ones (2008 TC3, 2018 LA), on the first round's pinned inputs and
 *       draws, with S1 and S2 drawn as rule 882(c) says;
 *   (d) the development presets (Chelyabinsk, Tunguska, Sikhote-Alin);
 *   (e) G5, on the benchmark's own draw and on the seed
 *       `benchmark-2026-09-23-heldout-strength`, never used;
 *   (f) the seal: which scenarios move, and in what.
 *
 * RULE 886. WHAT DECIDES. Every clause, or the default stays `density`:
 *   (a) level A does not move by more than one part in 10¹²;
 *   (b) I2's median absolute altitude miss under `twoStage` is below its
 *       miss under `density` — the law must move the model toward what
 *       fireballs do, on data phase 4 may learn from (rule 877);
 *   (c) G5 reads no failure under `twoStage` that it does not read under
 *       `density`, but at the densities where the law changes (2 500 and
 *       5 000 kg/m³), each listed;
 *   (d) typecheck, lint, format, the whole suite, the strict gate PASS with
 *       the validation report regenerated once, Chromium's end-to-end suite.
 * Reported, never deciding: (c) and (d) of rule 885, each with the direction
 * it moved — the regression cases may not be fitted to (rule 877), and
 * whether the law holds on unseen bodies is level B's second round to say.
 *
 * RULE 887. WHAT IT COSTS, DECLARED. A step where the law changes, at 2 500
 * and at 5 000 kg/m³. Strengths measured on bodies of 0.2 to 1.3 m applied
 * to every stony body: above a few metres the law is an extrapolation, and
 * the entry's card will say so. The first phase's mass loss is not modelled.
 * The pancake that starts at S2 bursts lower than today's for most bodies,
 * so the blast, the heat and the tolls of stony airbursts move with it.
 *
 * RULE 888. WHAT MAY NOT HAPPEN. S1, S2, their intervals and the share of two
 * in three are the source's; none is tuned on I2, on a preset or on a
 * regression case. One run. Nothing of rule 876's events is opened. No test
 * is weakened to let the candidate through.
 *
 * RULE 889. WHAT AN ADOPTION DOES. `DEFAULT_STRENGTH_LAW` becomes `twoStage`;
 * level A keeps `density`; the entry's card says what the law is and where
 * it is measured; the seal is re-taken with the list of what moved; the
 * ROADMAP, the CHANGELOG and the validation report record it. A refusal
 * records why, and the default stays `density`.
 */

/** Rule 882(c), in pascals. */
export const TWO_STAGE_S1_RANGE_PA = [40_000, 120_000] as const;
export const TWO_STAGE_S2_RANGE_PA = [900_000, 5_000_000] as const;
export const TWO_STAGE_S1_PA = Math.sqrt(TWO_STAGE_S1_RANGE_PA[0] * TWO_STAGE_S1_RANGE_PA[1]);
export const TWO_STAGE_S2_PA = Math.sqrt(TWO_STAGE_S2_RANGE_PA[0] * TWO_STAGE_S2_RANGE_PA[1]);

/** Rule 882(b): the share of first phases that take at least 40 % of the mass. */
export const TWO_STAGE_FIRST_MAJOR_SHARE = 2 / 3;

/** Rule 882: the stony densities the law covers, kg/m³. */
export const TWO_STAGE_DENSITY_RANGE = [2_500, 5_000] as const;

/** Rule 885(e). */
export const STRENGTH_HELD_OUT_SEED = 'benchmark-2026-09-23-heldout-strength';

/**
 * The outcome, written on 23 September 2026 after the one run of rule 885, on
 * the candidate of 887fc48. The rules were pushed in 6bcf346 first.
 *
 * REFUSED, by clause (d) of rule 886 alone. The default stays `density`.
 *
 * (a) MET. With the default set to `twoStage`, level A — its harness pinned to
 *     `density` — answers as before: its test passes unchanged.
 * (b) MET. I2's median absolute altitude miss over the 357 CNEOS fireballs,
 *     the body the evidence table reads (3 000 kg/m³, no strength given):
 *     13.74 km under `density`, 5.30 km under `twoStage`; 356 and 351 of 357
 *     burst in the air. The bodies given a strength do not move (8.29 km for
 *     1 MPa; 20.68 km for the iron). The 5 km bar of I2 is still not met.
 * (c) MET. G5 reads 0 on the benchmark's own draw and 0 on the unseen seed
 *     `benchmark-2026-09-23-heldout-strength`, under both laws
 *     (benchmark/results/invariants-2026-09-23-8 to -11).
 * (d) NOT MET. With the default set to `twoStage`, 15 tests fail. Fourteen
 *     are records of what the old law answered, or checks against the
 *     reference program, which runs on Eq. 9 and would be pinned to it as
 *     level A is: four of the airburst blast against the program, I2's
 *     cell-by-cell agreement with it, B-032's registry entry, rule 77's run,
 *     rule 733's and rule 847's own rounds, the entry band's ten numbers (5
 *     fireballs now reach the ground: 351 rows, not 356), I3's band for
 *     Tunguska — which moves from 4.0–29.4 km to 7.0–34.3 km and still holds
 *     the felled forest's 26.5 km — the seal, and this candidate's own two.
 *     One is not a record: the Monte Carlo's coverage test holds that 200
 *     draws give the median firestorm ignition radius at Tunguska within
 *     10 % of 2 000 draws. Under `twoStage` they give 2 290 m against
 *     1 983 m, 15.5 % off. Rule 888 forbids weakening it.
 *
 * Read after the run, and declared so. The test held under `density` only
 * vacuously: more than half of Tunguska's draws lit no firestorm, so both
 * medians were zero. Under `twoStage` about half do, and the median of a
 * quantity that is zero in half its draws jumps between zero and a
 * kilometre: over 40 seeds, 4 of 40 medians of 200 draws fall within 10 %
 * (median error 40 %). A median is the wrong summary for it; the chance of
 * a firestorm and its size when there is one are the right ones. That is a
 * defect of the Monte Carlo's summary, revealed by the law, not of the law.
 *
 * (f) Not read: the refusal comes from (d), and a seal re-taken for a law the
 *     default does not run would record nothing.
 *
 * Reported, never deciding (rule 885(c), (d)): the regression cases, on the
 * first round's inputs and draws, S1 and S2 drawn log-uniform — the main
 * breakup and the burst fall to 27–43 km and 26–41 km for 2024 BX1 (flares
 * observed at 34–35 km), 26–39 km for 2023 CX1 (27–28 km), 29–43 km for
 * 2018 LA (28 km); the first fragmentation lands at 59–71 km, above every
 * observed one; Carancas still digs no crater in any draw. 2008 TC3 is
 * outside the law (2 100–2 500 kg/m³): the run first passed it a drawn
 * strength by a fault of the measuring script, corrected and declared.
 * Tunguska's preset bursts at 8.2 km, not 9.8; Chelyabinsk's and
 * Sikhote-Alin's do not move (a strength given, an iron).
 *
 * Also read after, for phase 4's next item: the model's exponential
 * atmosphere (ρ₀ = 1 kg/m³, H = 8 km) is 1.5 to 1.9 times denser than the
 * standard atmosphere between 40 and 60 km, which lifts every altitude a
 * dynamic pressure is reached at by some 4 to 5 km — the first
 * fragmentation's among them.
 */
export const STRENGTH_TWO_STAGE_OUTCOME: string | null =
  "REFUSED 23 September 2026 by rule 886(d): I2's miss falls from 13.7 to 5.3 km and G5 reads nothing, but the Monte Carlo's median firestorm ignition at Tunguska, zero in half its draws under the new law, no longer holds within 10 % at 200 draws. The default stays `density`.";
