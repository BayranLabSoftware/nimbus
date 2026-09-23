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

/**
 * Rules 973 to 977 — the reviewer's answers, amending the frame before step 2.
 * Written on 23 September 2026, evening, on Andrea's word («Sì, tutto in
 * ordine»). What is not amended here stands as written above.
 *
 * RULE 973. THE VARIANTS PUBLISHED (amends rule 967). Not the eight cells of
 * the matrix: the baseline (Eq. 15, the two-stage strength with the whole body
 * broken at S2, one cloud), P alone, S alone, F alone, and combinations only
 * of the variants that met rule 964 alone — one axis at a time keeps each
 * change's effect its own and no search over combinations for a favourable
 * one. One interaction, optional and exploratory: P with S, only if both are
 * adopted alone, since lateral growth and mass loss may not add; a note,
 * deciding nothing, no parameter chosen from it.
 *
 * RULE 974. m2 IS A PROXY (amends rule 962). The brightest flare is not the
 * largest release of energy; m2 is labelled a proxy wherever it is published.
 *
 * RULE 975. m3 AND m4 (amend rules 962 and 964 (a)). m3, on a case, is
 * Δp = p_variant(the observed outcome) − p_baseline(the observed outcome),
 * reaching the ground and not reaching it treated alike; it improves when its
 * mean over the counted cases is 0.10 or more. m4 is counted on a case only as
 * a fraction of the initial kinetic energy, between 0 and 1, against an
 * observation whose uncertainty is declared; an observation in joules is
 * compared as the same quantity — both fractions of the initial kinetic
 * energy, or both joules — and an indirect estimate is never converted
 * without its uncertainty propagated. Otherwise m4 is not counted on that
 * case.
 *
 * RULE 976. THE BANDS (amends rule 964 (c)). An improvement on a case does
 * not count if that metric's band on it widens by more than 50 %.
 *
 * RULE 977. THE TABLE (amends rules 963 and 966). Fixed once for the whole
 * round: its sources, its observed intervals and the baseline's metrics do
 * not change after P's run; only new columns are added, for P, S, F and the
 * adopted combinations. Two columns are required in it: the quality of the
 * target — direct, reconstructed or model-dependent — and whether it is
 * counted for adoption, yes or no, with the reason.
 */

/**
 * Rules 978 to 981 — step 2: the development table and the baseline's draws.
 * Written on 23 September 2026, evening, on Andrea's word («Sì, tutto in
 * ordine»), before the baseline is computed on any case.
 *
 * RULE 978. THE DRAWS (fills rule 962). Every case runs on today's model, the
 * baseline of rule 960, entering at sea level as the level B rounds ran it:
 *   - 2024 BX1, 2023 CX1 and Carancas on the inputs of levelBSources.ts, and
 *     2022 WJ1 on those of levelB2Sources.ts, each on the second round's
 *     stream (its seed and the event's name), 1 000 draws — the draws that
 *     round ran;
 *   - 2008 TC3 and 2018 LA on the first round's inputs and stream (its seed,
 *     the event's name and "scored"), 1 000 draws;
 *   - Chelyabinsk and Tunguska, one run at the preset's inputs, and 2022 EB5,
 *     one run at the body I2 reads from its CNEOS row (rule 77: 3 000 kg/m³,
 *     its diameter from its energy and speed, its angle from its velocity) —
 *     the repository pins no uncertainty for them, and rule 963 opens no
 *     source. On a single run m3 is 0 or 1, and rule 976 reads no band.
 *
 * RULE 979. THE MODEL'S SIDE OF EACH METRIC. m1: the two-stage law's first
 * fragmentation altitude, 0 where the body never reaches S1. m2: the burst
 * altitude of a complete airburst, 0 where the body or its swarm reaches the
 * ground and releases its energy there — a proxy (rule 974). m3: the share of
 * draws whose body or swarm reaches the ground (the regimes INTACT and
 * PARTIAL_AIRBURST), read as the probability of the observed outcome. m4: the
 * share of the kinetic energy that reaches the ground. m1, m2 and m4 are read
 * by their median over all the draws; a miss is the distance from the median
 * to the observed interval, none inside it; a band is the 5 %–95 % width over
 * all the draws.
 *
 * RULE 980. THE TABLE (fragmentationDevTable.ts): for each case and metric
 * the observed value or outcome, its interval, its source and place, the
 * quality of the target and whether it is counted, with the reason — all from
 * what the repository holds. Counted: m1 on BX1, CX1, TC3 and 2018 LA; m2 on
 * those four, WJ1 and EB5; m3 on those five, Carancas, Chelyabinsk and
 * Tunguska; m4 on none, since no source in the repository gives the energy
 * that reached the ground as a fraction with its uncertainty (rule 975) — so
 * in this round a variant must improve two of m1 to m3. Chelyabinsk's and
 * Tunguska's observed altitudes are not in the repository; whether to open a
 * source for them is asked of the reviewer before P runs.
 *
 * RULE 981. THE BASELINE, computed once by scripts/fragmentation-baseline.ts
 * into fragmentationBaseline.json and docs/FRAGMENTATION_DEV_TABLE.md, and
 * committed with the table. The outcomes already right of rule 964 (b) are
 * read from it: the counted cases where the baseline gives the observed
 * outcome a probability of 0.9 or more. After P's run nothing of rules 978 to
 * 981 changes (rule 977); before it, only by the reviewer's answer.
 */

/** The axes of rule 960. */
export type FragmentationAxis = 'pancake' | 'strength' | 'fragments';

/** Rule 964, as rules 975 and 976 amend it: what improves a metric. */
export const FRAGMENTATION_CLAUSE = {
  altitudeImproveKm: 1,
  /** Rule 975: the mean over the counted cases of Δp on the observed outcome. */
  observedOutcomeGain: 0.1,
  energyShareImprove: 0.1,
  minMetricsImproved: 2,
  rightOutcomeShare: 0.9,
  /** Rule 976: a band wider than this ratio voids the case's improvement. */
  bandWidening: 1.5,
} as const;

/** Rule 977: the quality of a target in the development table. */
export type TargetQuality = 'direct' | 'reconstructed' | 'modelDependent';

/** The outcome of the round, written after its last variant. */
export const FRAGMENTATION_ROUND_OUTCOME: string | null = null;
