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

/**
 * Rules 982 to 986 — a versioned rectification of step 2, on the reviewer's
 * reply of 23 September 2026, evening, and Andrea's word («Sì, tutto in
 * ordine»). Written before the baseline is recomputed.
 *
 * RULE 982. WHAT THIS IS. Rule 979 read two absences as altitudes: a first
 * stage the model does not produce as 0 km, and the release of a body that
 * reaches the ground as a burst at 0 km. Zero is not an altitude; averaging it
 * mixes a frequency of outcomes with a height (the reviewer). The first
 * version of the table and its baseline (b1bf097) are kept as they were, in
 * fragmentationBaseline.v1.json and docs/FRAGMENTATION_DEV_TABLE.v1.md; the
 * second is written beside them. No case, no threshold and no draw is added.
 *
 * RULE 983. m1, REDEFINED (amends rule 979). On each case, two results: p₁,
 * the share of draws in which the model produces a first stage (the two-stage
 * law covers the body and its dynamic pressure reaches S1), and the altitude
 * of that stage over those draws only. The miss is the distance from that
 * conditional median to the observed interval. Where the model produces a first
 * stage in no draw, m1 is not applicable: 2008 TC3, whose density lies below
 * the law's range — its one breakup (Eq. 11) is shown in a diagnostic column,
 * "the altitude of the single breakup", and enters no mean.
 *
 * RULE 984. m2, REDEFINED (amends rule 979). On each case, p_b, the share of
 * draws that burst in the air (a complete airburst), and the burst altitude
 * over those draws only; the miss is the distance from that conditional median
 * to the observed interval. A case with no burst in any draw has no m2 miss.
 *
 * RULE 985. THE CREDIT (amends rule 964 (a) for m1 and m2). A variant's gain
 * on m1 or m2 is read case by case, over the counted cases where both the
 * baseline and the variant give a conditional altitude: on a case, a gain
 * counts only if the variant does not lower the probability of the event the
 * altitude belongs to — p₁ for m1, and for m2 the probability it gives the
 * observed outcome (m3) — otherwise the better altitude is diagnostic and
 * only a loss is kept. m1 or m2 improves when the mean over those cases of
 * the credited change of the miss is 1 km or more. So no variant looks better
 * by moving cases between the ground and the air, which changes which
 * altitudes enter the mean. The bands of rule 976 are the conditional
 * altitudes' 5 %–95 % widths.
 *
 * RULE 986. THE CASES (amends rule 980). Carancas is not counted for adoption
 * in this round: its entry is computed down to sea level, where the site lies
 * at about 3 800 m, a boundary condition that can change the very survival m3
 * judges; it stays in the table as a diagnostic, the limit written beside it,
 * until the site's altitude is mended apart. Chelyabinsk and Tunguska stay
 * controls of m3 alone, and m4 counted nowhere. Counted: m1 on 2018 LA,
 * 2023 CX1 and 2024 BX1; m2 on 2008 TC3, 2018 LA, 2022 EB5, 2023 CX1,
 * 2024 BX1 and 2022 WJ1; m3 on Chelyabinsk, Tunguska, 2008 TC3, 2018 LA,
 * 2023 CX1, 2024 BX1 and 2022 WJ1. The baseline is recomputed on the draws of
 * rule 978, once.
 */

/**
 * Rules 992 to 998 — variant P: the solution of Eq. 14 in place of Eq. 15.
 * Written on 23 September 2026, night, on the reviewer's leave (after the
 * rectification of rules 982 to 986) and Andrea's word («Sì, P ora»), before
 * any line of the variant. The development table is version 2 (09bae54), its
 * baseline fragmentationBaseline.json as committed there; B-126 stays
 * refused; nothing of the effects, the rings, the climate or the casualties
 * is touched in this round (the reviewer).
 *
 * RULE 992. WHAT P IS. Collins, Melosh & Marcus (2005), p. 821, read on the
 * page: after the breakup the pancake's diameter obeys d²L/dt² =
 * C_D ρ(z) v²(z) / (ρ_i L) (their Eq. 13, Chyba et al. 1993), which, "if L does
 * not increase too much over the scale height H", becomes
 *     L d²L/dz² = C_D ρ(z) / (ρ_i sin²θ)          (their Eq. 14),
 * with L = L0 at z = z*; their Eq. 15* is "an analytic approximation to the
 * full solution of this equation". Under P the diameter is Eq. 14 solved, with
 * L(z*) = L0 and dL/dz(z*) = 0 — the slope Eq. 15* itself has there — on the
 * exponential atmosphere of the operative branch. Everything else is as
 * today: the breakup of Eq. 11 (at S2 for a stony body under the two-stage
 * law); the burst where L reaches f_p L0, Eq. 18's own condition; the speed of
 * Eq. 17*, its integral of e^((z*−z)/H) L² taken on this L; below a burst the
 * cloud as today (axis F is apart); the swarm's spread at the ground, L(0), and
 * `entryPath`'s diameter and speed before the burst, from the same solution.
 * The virtual burst altitude of a swarm that reaches the ground stays Eq. 18's
 * — a convention the ground blast reads only under the program's laws, not the
 * product's `surface`. Only the paper's equations on the exponential are
 * touched: the program's branch and the tabulated profiles keep Eq. 15.
 *
 * RULE 993. THE NUMERICS, fixed now: the classical fourth-order Runge–Kutta
 * in altitude on (L, dL/dz, the integral of Eq. 17*), from z* down, with a step
 * of 10 m (the last step cut at the ground); the burst placed inside its step
 * by linear interpolation of L, and its speed and integral read there alike.
 * Measured before these rules: 0.075 ms a run on a grid of 45 bodies — 75 ms
 * for a Monte Carlo of 1 000 draws. Verified before the run, on a grid of
 * bodies that are none of the development cases: (a) at 5 m the burst
 * altitude moves by less than 1 m and the speed at the burst or the ground by
 * less than 10⁻⁶ of itself; (b) at the breakup L, dL/dz and d²L/dz² are those
 * of Eq. 14; (c) near the breakup L agrees with Eq. 15* to second order in
 * (z* − z)/l — both are L0 (1 + (z* − z)²/(2l²)) there; (d) with the variant
 * off, every number is the product's to the bit.
 *
 * RULE 994. THE SWITCH. `pancakeGrowth: 'eq15' | 'eq14'` on the input, 'eq15'
 * by default until an adoption; level A's comparisons with the program pin
 * 'eq15' (the program's); G5 reads a branch through NIMBUS_PANCAKE.
 *
 * RULE 995. THE RUN, once, on the draws of rule 978 with the variant on:
 * published for every case beside the baseline — p₁ and the first stage's
 * conditional altitude, p_b and the conditional burst altitude, the
 * probability of the observed outcome, the energy to the ground, the
 * frequency of the three crater states, the regimes and the bands — in
 * fragmentationVariantP.json and docs/FRAGMENTATION_VARIANT_P.md, written by
 * scripts/fragmentation-variant.ts; the verdict read by
 * fragmentationScore.ts, written and pushed before the run, on rules 964,
 * 975, 976, 981 and 985. Rule 964 (d) — G5, level A, the suite, the gate, the
 * end-to-end suite and the seal on the variant as default — is run only if
 * (a) to (c) hold.
 *
 * RULE 996. WHAT P CAN MOVE, said before: the first stage precedes the
 * pancake, so P moves no m1 — the metric reads the same on both sides and
 * credits nothing. P is therefore adopted only if m2 and m3 both improve.
 *
 * RULE 997. WHAT AN ADOPTION MAY UPDATE: a test that pins a number of
 * Eq. 15* or of the closed forms of Eqs. 17* to 20 on the operative branch,
 * re-read on the solution of Eq. 14 with the rule named; the seal, re-taken,
 * each moving scenario listed; the development table's P columns. Any other
 * test that fails refuses P.
 *
 * RULE 998. WHAT MAY NOT HAPPEN. No constant moves — C_D, f_p, H, ρ0, the
 * strengths; the step is not changed after the run; the third set is not
 * opened; the commit that carries P's outcome carries nothing else (the
 * reviewer): no change to the atmosphere, the crater, the effects or the
 * climate.
 */

/**
 * Rule 999 — the step, amended before the run. Written on 23 September 2026,
 * night, when rule 993's verification, run on its grid of 108 bodies that are
 * none of the development cases, failed, and before P has run on any case.
 *
 * RULE 999. (a) With the fixed 10 m step the speed moved by more than 10⁻⁶
 * when the step halved on 31 bodies of the 108, by up to 2.3 %: bodies of a
 * metre, whose dispersion length l (Eq. 16*) is some 12 m at 8 km, so that the
 * pancake reaches f_p L0 within a few steps and the burst's integral is read
 * across one of them. The step becomes the smaller of 10 m and l/200, and (a)
 * halves that step; with it alone one body still moved by 1.1 × 10⁻⁶, the
 * linear interpolation of the integral across the burst's step, so the burst
 * is found inside its step by Newton's method on a partial Runge–Kutta step
 * from the step's start, and its integral read there. Nothing else of rule 993
 * moves. The cost, measured again: 0.148 ms a solution on the grid, and a
 * whole simulation from 4.8 to 5.2 ms (+7 %) on 45 bodies. (c) was first written against the bare quadratic
 * L0 (1 + (z* − z)²/(2l²)) at 0.01 l, with 1 % of the growth allowed, and
 * failed by 0.03 points on one body whose l is about twice H — where the
 * density's own rise over the depth, a third-order term, weighs; it is
 * rewritten as the rule states it: Eq. 14's and Eq. 15*'s growths agree to
 * second order — their difference, a third-order term, is within 1 % of the
 * growth at a depth of 0.001 of the smaller of l and H (it is about a sixth of
 * depth/H there). Both found and changed on the grid alone.
 */

/**
 * RULE 1000. THE SCORE, as fragmentationScore.ts reads it, pushed with the
 * dormant candidate before P runs. m1 and m2 as rule 985 says: case by case,
 * over the counted cases that have a conditional altitude on both sides (a
 * case without one on either side is listed apart and averages nothing); the
 * probability of the event the altitude belongs to is p₁ for m1, and for m2
 * the probability of the observed outcome — or, where no outcome is observed
 * (2022 EB5), the probability of the burst; a gain counts only where that
 * probability does not fall and the conditional altitude's 5 %–95 % width does
 * not grow by more than half (rule 976; a single run reads no band); a loss
 * always counts; the metric improves when the mean credited fall of the miss is
 * 1 km or more. m3: the mean over its counted cases of Δp, 0.10 or more. The
 * outcomes already right are the baseline's list, each kept at 0.9 or more.
 * Rule 964 (a) to (c) hold when two metrics improve and every one is kept.
 */

/** Rule 994: the pancake's growth after the breakup. */
export type PancakeGrowth = 'eq15' | 'eq14';

/** Rule 993: the Runge–Kutta step in altitude (m), at most. */
export const EQ14_STEP_M = 10;

/** Rule 999: the step is at most this fraction of the dispersion length. */
export const EQ14_STEPS_PER_DISPERSION_LENGTH = 200;

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

/**
 * The outcome of variant P, written on 23 September 2026, night, after its one
 * run (rules pushed first, f735c70; the dormant candidate and the score,
 * e71c7d0; fragmentationVariantP.json and docs/FRAGMENTATION_VARIANT_P.md).
 *
 * REFUSED by rule 964 (a): no metric improves.
 * - m1 reads the same on every case, as rule 996 said it would.
 * - m2 worsens by 0.15 km on average. Eq. 14 solved spreads the pancake faster
 *   than Eq. 15* and every body bursts higher, by 0.1 to 2.3 km: 0.4 to 0.5 km on 2018 LA,
 *   2023 CX1 and 2024 BX1, 1.9 km on 2008 TC3 and 2022 EB5; Chelyabinsk from
 *   27.1 to 29.4 km and Tunguska from 8.2 to 9.2 km, uncounted. The model
 *   already burst above the flares it is read against, so higher is worse
 *   everywhere but on EB5 (31.1 to 33.0 km, the flare at 33.3). One case, 2018
 *   LA, saw its band widen by more than half; it lost, and a loss counts.
 * - m3 does not move: no case changes its outcome, and 2022 WJ1 stays wrong —
 *   its body stays whole below S2 and never reaches the pancake P changes.
 * - Every outcome already right is kept. Rule 964 (d) was not run.
 * Read after, not decided by: Collins et al.'s approximation is not what holds
 * the altitudes wrong — it errs, but on the side that helps — and the largest
 * misses sit before the pancake, in the first stage (27 km) and in a body that
 * does not break at all (WJ1). The code stays in the product, off, as the
 * record of this run. Next, in rule 967's order: S, mass lost by stages
 * between S1 and S2, by rules of its own.
 */
export const VARIANT_P_OUTCOME: string | null =
  'REFUSED 23 September 2026 by rule 964 (a): the solution of Eq. 14 improves no metric — m1 unchanged, m2 worse by 0.15 km on average (every body bursts higher, by 0.1 to 2.3 km, above flares it already overshot), m3 unchanged.';

/**
 * Rules 1001 to 1008 — variant S, its specification, frozen before any line of
 * it, as the reviewer asked on 23 September 2026, night (trigger, evolution of
 * the mass, closure, and a budget of mass, momentum and energy), on Andrea's
 * word («Sì, specifica e regole»). From Borovička, Spurný & Shrbený (2020),
 * AJ 160, 42 (arXiv:2006.07080v1, downloaded again with Andrea's leave), alone.
 *
 * RULE 1001. WHAT THE SOURCE SAYS, read before this specification. Two phases,
 * not a continuous loss: the first at 0.04–0.12 MPa, catastrophic or nearly —
 * at least 40 % of the mass lost — in 2/3 of cases (abstract; pp. 12, 14–15);
 * then a quiet interval in which the dynamic pressure grows 5 to 10 times with
 * no gross fragmentation (p. 15; none at 0.12–0.96 MPa among the falls,
 * p. 12); the second phase at 0.9–5 MPa, from about 0.5 MPa for smaller bodies
 * (abstract), "a smooth distribution of crack strengths" (p. 18), its events
 * more numerous and each of less mass (p. 13), into pieces of 20–40 MPa that
 * survive as meteorites (p. 20); where the pressure never reaches the
 * strength "the body can land as a meteorite" (p. 20), and "the second phase
 * was sometimes not observed at all ... decelerated before the dynamic
 * pressure reached 5 MPa" (p. 17). The first phase's pieces "move together for
 * some time" (p. 15) and break in the second phase themselves (p. 13). The
 * mass loss between S1 and S2 the round first named (rule 960) is therefore
 * read as the paper gives it: a step at S1, nothing between, and a loss spread
 * over the second phase.
 *
 * RULE 1002. THE VARIABLE: the dynamic pressure q = ρ(z) v(z)², the paper's,
 * on the body's path, the exponential atmosphere and Eq. 8's speed before any
 * piece breaks in the second phase.
 *
 * RULE 1003. THE TRIGGER AND THE FIRST PHASE. At q = S1 (0.04–0.12 MPa, its
 * geometric midpoint as today) the body separates: its largest piece keeps
 * 1 − f1 of the mass. f1 is 0.5, the median of the paper's 21 bodies as its
 * text classes them — among the fireballs 6 lost ≳ 60 %, 4 about 50 % and 4
 * ≲ 30 % (pp. 14–15); among the falls 4 lost more than half, Košice about
 * 40 %, Renchen and Jesenice less than 25 % (p. 12); its prior, for a Monte
 * Carlo that draws it, those classes at their stated edges: 0.6 six times, 0.5
 * eight times, 0.4 once, 0.3 four times and 0.25 twice. The
 * separated pieces move with the largest and break in the second phase too:
 * the assembly's mass and path are unchanged by the first phase, which sets the
 * largest piece's mass; the wake of dust it leaves is given no mass (the paper
 * gives none).
 *
 * RULE 1004. THE SECOND PHASE, the evolution of the mass. The assembly's
 * cracks have strengths distributed log-uniformly on [0.9, 5] MPa — the
 * paper's interval and the product's own prior on S2 (rule 882(c)): by the
 * time q reaches q, the share F(q) = ln(q/0.9 MPa) / ln(5/0.9) of the mass has
 * broken, 0 ≤ F ≤ 1, F(0.9 MPa) = 0, continuous, no share ever mended. The
 * share that breaks at a strength Y follows Collins et al.'s closure from the
 * altitude where q first reaches Y: the breakup of Eq. 11 at Y, the pancake of
 * Eq. 15*, the burst at f_p L0 or the swarm on the ground, the speed of
 * Eq. 17*. Numerically, 64 shares at the quantiles of the distribution. With
 * the distribution collapsed to one strength the model is today's.
 *
 * RULE 1005. THE CLOSURE. What the second phase leaves unbroken, 1 − F(q_max)
 * with q_max the largest pressure the assembly reaches, is the surviving body:
 * carried to the ground on Eq. 8's path, never below the terminal speed of a
 * body of its own mass. The largest fragment is the smaller of the first
 * phase's largest piece and the surviving body. Each share ends as one of
 * three: a burst in the air, a swarm on the ground, or the surviving body; the
 * crater states are read, as today, of what reaches the ground.
 *
 * RULE 1006. THE BUDGET, checked on every run: the shares' masses sum to the
 * body's; the kinetic energy at entry equals, within 10⁻⁹ of itself, the energy
 * deposited in the air plus the energy that reaches the ground; likewise the
 * momentum along the path. Published for every case: the mass kept and lost
 * at S1, at 0.9 and 5 MPa and at the ground; the speed and kinetic energy of
 * each component; the energy deposited per kilometre of altitude; the largest
 * fragment's mass and speed; the frequency of a burst, a swarm on the ground,
 * a surviving body and the state out of the crater's domain. No mass
 * disappears: none leaves the budget but by a named component.
 *
 * RULE 1007. HOW S IS READ BY THE TABLE — OPEN. Rule 979 reads m3 by the
 * regimes, a body or swarm on the ground being INTACT or PARTIAL; the table
 * codes the observed falls — meteorites in dark flight — as not reaching the
 * ground, while the baseline's 2022 WJ1, a whole body at 98 m/s, a meteorite
 * of its full mass in dark flight, counts as reaching it. Under S nearly every
 * body leaves a surviving piece: read by the regimes it would reach the ground
 * wherever a meteorite fell. This is a question of the frozen table (rule
 * 977), asked of the reviewer before any code of S; no reading is chosen here.
 *
 * RULE 1008. NO CODE of S before the reviewer answers rule 1007 and reads
 * rules 1001 to 1006. What may not happen, as for P: no constant moves; no
 * parameter is chosen on a development case; one run; the commit that
 * carries S's outcome carries nothing else.
 */

/** Rule 1003: the first phase's mass loss, f1 (the median of the paper's 21). */
export const S_FIRST_PHASE_LOSS = 0.5;

/** Rule 1004: the second phase's crack strengths, log-uniform (Pa), and the
 *  shares they are read in. */
export const S_SECOND_PHASE_RANGE = [900_000, 5_000_000] as const;
export const S_SECOND_PHASE_SHARES = 64;

/** The outcome of the round, written after its last variant. */
export const FRAGMENTATION_ROUND_OUTCOME: string | null = null;
