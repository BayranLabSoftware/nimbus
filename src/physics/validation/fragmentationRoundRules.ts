/**
 * Rules 959 to 967 — the round on the dynamics of fragmentation: its frame.
 * Written on 23 September 2026, evening, on Andrea's word («Entrambi, in
 * ordine»), after B-124 was closed and refined (961fbfc, 3931764), in the
 * order the reviewer set and with the clause he asked for. Written before any
 * variant's physics: each variant is written by rules of its own, before its
 * code, inside this frame.
 *
 * RULE 959. WHAT THIS IS. Level B's second round named three faults of the
 * entry, apart from the crater's (rule 945): the second stage of the
 * strength is one threshold for the whole body, so a stone whose dynamic
 * pressure peaks near it stays whole or breaks at once, where 2022 WJ1
 * fragmented step by step; the first stage stands at 61 to 66 km for every
 * body; and the cloud of fragments is held at f_p L0 and slowed as one. The
 * reviewer adds a fourth question, to be asked alone: Eq. 15, Collins et
 * al.'s approximation, against the solution of Eq. 14 it approximates. This
 * round changes one thing at a time, measures it on development cases, and
 * leaves the third set (rules 933 to 944) closed until the model it judges
 * is frozen.
 *
 * RULE 960. THE VARIANTS — three axes, each against today's model (the
 * baseline: Eq. 15, the two-stage strength of rules 896 to 902, the cloud of
 * `entryPath`):
 *   (P) the pancake's growth: Eq. 15 | the solution of Eq. 14, integrated on
 *       the profile of rules 908 to 918 (the exponential, operative);
 *   (S) the strength: the pancake starting at S2 whole, S1 only reported |
 *       mass lost by stages between S1 and S2, its law and its priors — from
 *       Borovička, Spurný & Shrbený (2020) alone — written in its own rules;
 *   (F) after the burst: the cloud held at f_p L0 and slowed as one |
 *       fragments that slow each by its own size, written in its own rules.
 * A variant changes one axis from the baseline; combinations are asked only
 * after each single change has been adopted or refused.
 *
 * RULE 961. THE DEVELOPMENT CASES, with the roles the reviewer gave them:
 *   - Chelyabinsk and Tunguska: large systems and historical controls — no
 *     threshold is set on either, point by point;
 *   - 2008 TC3, 2018 LA and 2022 EB5: seen cases, regressions of the entry and
 *     its altitudes;
 *   - 2023 CX1, 2024 BX1 and 2022 WJ1: the crucial regressions, metre-sized
 *     bodies observed, fragmenting in stages;
 *   - Carancas: a control of survival and of the outcome at the ground — its
 *     mass, partly circular, is never calibrated;
 *   - Borovička et al. (2020): the source of priors, never a test and never a
 *     sample to choose parameters from, event by event.
 * No event of the third set is read (rules 937 and 944).
 *
 * RULE 962. THE METRICS, on every development case, for the baseline and for
 * each variant, on the draws the level B rounds pinned (their seeds and
 * inputs):
 *   (m1) the altitude of the first stage, against the observed where it was
 *        measured and is unique (rule 940), as the case's median's absolute
 *        miss;
 *   (m2) the altitude where the energy is released, against the brightest
 *        flare, as the median's absolute miss;
 *   (m3) the probability of reaching the ground — the share of draws whose
 *        body or swarm reaches it — against the discrete outcome observed;
 *   (m4) the share of the energy that reaches the ground, against the value
 *        step 2 pins from each case's source, where one exists.
 * Beside them, published and never a metric: the share of each crater state
 * (computed, none, out of the domain — the reviewer: a variant that moves
 * cases out of the domain has not improved the physics by it), the frequency
 * of each regime, and the 5 %–95 % width of every band.
 *
 * RULE 963. STEP 2, before any variant runs: a table of the development cases
 * — for each metric, the observed value, its interval, its source and page,
 * or the reason it has none — drawn only from what the repository holds
 * (the level B rounds' targets and sources, the seen rows, the presets'
 * references), committed and pushed; and the baseline's metrics on it,
 * computed and committed with it.
 *
 * RULE 964. THE CLAUSE (the reviewer). A variant is adopted only if all hold:
 *   (a) it improves at least two of m1 to m4: m1 or m2 improves when the mean
 *       over the cases of the absolute miss falls by 1 km or more; m3 when the
 *       mean over the cases of |share reaching the ground − observed (0 or
 *       1)| falls by 0.1 or more; m4 when the mean absolute miss falls by 0.1
 *       or more;
 *   (b) it worsens no discrete outcome already right: where the baseline
 *       answers as observed in at least 90 % of a case's draws, the variant
 *       must too;
 *   (c) it widens no band to buy an improvement: an improvement on a case
 *       whose band of that metric is at least doubled does not count;
 *   (d) G5 reads nothing new; level A does not move (its harness on the
 *       legacy crater and Eq. 9, and a variant switched off in it unless the
 *       program has it); the whole suite, the strict gate and the end-to-end
 *       suite pass; the seal moves only where the variant acts, each moving
 *       scenario listed.
 * Coverage is no metric of this round.
 *
 * RULE 965. PUBLISHED FOR EVERY VARIANT, adopted or refused: the table of
 * rule 962 — metrics, crater states, regimes and widths — case by case,
 * beside the baseline's, in the repository and in the validation report.
 *
 * RULE 966. WHAT MAY NOT HAPPEN. No parameter is chosen to match one
 * development case; every parameter a variant brings comes from its own rules'
 * sources, fixed before its run; one run per variant; no event of the third
 * set is read; the development table of rule 963 does not change after the
 * first variant runs.
 *
 * RULE 967. THE ORDER. (P) first — the isolated question the reviewer asked;
 * then (S); then (F); then the combinations of what was adopted. The model
 * that comes out is then frozen and judged on the third set, with its
 * appendix S1 if one is closed before that round's predictions.
 */

/** The axes of rule 960. */
export type FragmentationAxis = 'pancake' | 'strength' | 'fragments';

/** Rule 964: what improves a metric. */
export const FRAGMENTATION_CLAUSE = {
  altitudeImproveKm: 1,
  groundShareImprove: 0.1,
  energyShareImprove: 0.1,
  minMetricsImproved: 2,
  rightOutcomeShare: 0.9,
  bandDoubling: 2,
} as const;

/** The outcome of the round, written after its last variant. */
export const FRAGMENTATION_ROUND_OUTCOME: string | null = null;
