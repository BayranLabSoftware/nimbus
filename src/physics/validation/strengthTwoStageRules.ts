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

/** The outcome, written after the run. */
export const STRENGTH_TWO_STAGE_OUTCOME: string | null = null;
