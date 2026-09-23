/**
 * Rules 890 to 895 — the Monte Carlo summarises a quantity that is often zero
 * by how often it happens and how large it is when it does. Written on 23
 * September 2026 on Andrea's word («inizia»), after rules 881 to 889 were
 * refused (85816ca), and before the candidate is written or any draw is read
 * under it.
 *
 * RULE 890. WHAT THIS IS. A quantity the Monte Carlo draws can be zero in part
 * of its draws: no crater where the body bursts in the air, no ejecta ring
 * without a crater, no firestorm where the flash is too weak. Every summary of
 * the engine (montecarlo/engine.ts) gains two things: `share`, the fraction of
 * its finite draws above zero, and `given`, the P10, P50 and P90 of those
 * draws alone (null where there are none). The P10, P50 and P90 over all
 * draws stay as they are, beside them. The panel shows a row whose share is
 * at most 0.9 as "in N % of the runs" and the P10, P50 and P90 of those runs;
 * a row whose share is above 0.9 as today; its footer says which is which.
 *
 * RULE 891. WHY. Rules 881 to 889 were refused by one test: 200 draws no
 * longer held Tunguska's median firestorm ignition radius within 10 % of
 * 2 000. Read after that run: the median of a quantity zero in about half
 * its draws jumps between zero and a kilometre, whatever the law; under
 * today's law the test held only because both medians were zero, and the
 * panel printed a median of zero for a scenario in which some of the draws
 * light a firestorm. The median over all draws misreads such a quantity. How
 * often it happens and how large it is when it does are what a reader needs,
 * and what can be held.
 *
 * RULE 892. WHAT THE COVERAGE TEST HOLDS (montecarlo/coverage.test.ts: its
 * four quantities at Tunguska, 200 draws against 2 000, its seeds as they
 * are). For each quantity, with s the reference's share:
 *   (a) the share of the 200 draws lies within 3 √(s (1 − s) / 200) of s;
 *   (b) where s is above 0.9, the P10 and P90 over all draws lie within 15 %
 *       of the reference's and the P50 within 10 %, as the test holds today;
 *   (c) where s is above 0 and at most 0.9, and n, the number of the 200
 *       draws above zero, is at least 10: the P10, P50 and P90 of those n
 *       draws each lie between the reference's own quantiles of its draws
 *       above zero at p ± 2.576 √(p (1 − p) / n) — the distribution-free
 *       99 % interval of a quantile estimated from n draws (Conover,
 *       Practical Nonparametric Statistics, the confidence interval for a
 *       quantile); with fewer than 10, (a) alone;
 *   (d) where s is 0, the 200 draws' share is 0.
 * These replace the claims over all draws for a quantity zero in more than a
 * tenth of its reference draws, and only those: every other claim of the test
 * stays word for word.
 *
 * RULE 893. WHAT DECIDES. Every clause, or nothing changes:
 *   (a) the test of rule 892 passes under the model's default laws, on the
 *       test's own seeds;
 *   (b) no number of the product outside the Monte Carlo moves: the seal to
 *       the bit, level A unchanged;
 *   (c) the globe's probability view, which reads the draws and not the
 *       summary, answers as before: its tests pass unchanged;
 *   (d) typecheck, lint, format, the whole suite, the strict gate PASS (the
 *       validation report regenerated if and only if it changes), and
 *       Chromium's end-to-end suite with the panel's new row.
 * Reported, never deciding: the same test with the strength law of rules
 * 881 to 889 — that law's next asking reads it.
 *
 * RULE 894. WHAT MAY NOT HAPPEN. The seeds, the 200 and 2 000 draws, the
 * 15 % and 10 % of (b), the 0.9 and the 10 draws of (c), the 99 % interval
 * and the three standard deviations of (a) are fixed here. One run. No claim
 * the test holds for a quantity that is never zero in a tenth of its draws is
 * touched.
 *
 * RULE 895. WHAT AN ADOPTION DOES. The engine, the panel and the test as
 * rules 890 and 892 write them; the CHANGELOG and the ROADMAP record it. A
 * refusal records why.
 */

/** Rule 890: the share above which a row is shown over all its draws. */
export const MC_SHARE_SHOWN_WHOLE = 0.9;

/** Rule 892(c): the fewest draws above zero a quantile is held on. */
export const MC_GIVEN_MIN_DRAWS = 10;

/** Rule 892(c): the normal quantile of the 99 % interval. */
export const MC_QUANTILE_Z = 2.576;

/** Rule 892(a): standard deviations of the share. */
export const MC_SHARE_SIGMAS = 3;

/**
 * The outcome, written on 23 September 2026 after the one run, on the
 * candidate of 106378e. The rules were pushed in 8a0d5d7 first.
 *
 * ADOPTED: every clause of rule 893 holds.
 *
 * (a) MET. Under the default laws the coverage test passes whole: kinetic
 *     energy (share 1) by its three old claims word for word; the final
 *     crater, the ejecta's edge and the firestorm's ignition — each zero in
 *     more than a tenth of Tunguska's draws — by their share and by the
 *     percentiles of their draws above zero, each with ten draws or more.
 * (b) MET. The whole suite passes, the seal to the bit and level A with it.
 * (c) MET. The globe's probability view's tests pass unchanged.
 * (d) MET. Typecheck, lint, format; 3 026 tests; the validation report,
 *     regenerated once, identical, and its strict gate PASS; Chromium's
 *     end-to-end suite, 33 passed and 14 skipped as before. The panel's row
 *     read in the running app, Tunguska at 1 000 draws: "Innesco firestorm —
 *     nel 47 % dei campioni: 2,4 km, 4,8 km, 7,5 km" where it printed a median
 *     of zero; the crater and the ejecta ring "nel 17 % dei campioni".
 *
 * Reported, not deciding: with the strength law of rules 881 to 889 the same
 * test passes too — the firestorm in 52.6 % of the 2 000 draws against
 * 52.0 % of the 200, its median above zero 4.6 km.
 */
export const MC_SHARE_OUTCOME: string | null =
  "ADOPTED 23 September 2026: the Monte Carlo reports how often a quantity happens and how large it is when it does, and the coverage test holds both; nothing outside the Monte Carlo moved. Tunguska's firestorm reads 'in 47 % of the runs' where it read a median of zero.";
