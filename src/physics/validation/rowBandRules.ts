/**
 * A pair beside a number is a claim about that number.
 *
 * Every summary figure the casualties panel prints carries a pair in
 * parentheses, and the caption under them says what the pair is: "the 5–95 %
 * band: run the same event again with the published scatter of its inputs and
 * nine times out of ten the count lands in there". For the total that is
 * exactly what it is. For the deferred deaths it is not, and on 19 September
 * 2026 a reader saw it: a 1 km stone on Miami printed
 *
 *   di cui entro settimane   510 000   (470 000 – 46 000)
 *
 * — descending, and with the figure outside both ends.
 *
 * Why. `bandFromPlans` draws a few hundred scenarios, runs each, sorts them by
 * TOTAL deaths and keeps the fifth and ninety-fifth realisations whole.
 * `withPredictiveBand` then takes every summary figure from those two worlds.
 * For the total that is the total's own percentile, because the total is what
 * the sort is on. For the deferred deaths it is the deferred deaths OF the
 * world that had the fifth-lowest total, which is a different quantity and
 * need not even be ordered: deferred deaths run against the total, a harsher
 * world killing outright and leaving fewer injured to lose in the weeks after.
 * So the low-total world held 470 000 of them and the high-total world 46 000,
 * and the panel printed them in that order. B-066 ordered the pair on the
 * screen on 19 September 2026 and said in the registry that ordering it was
 * not fixing it.
 *
 * The wave's row is not in this: `tsunamiDeathsLow/High` are the low and high
 * vulnerability of the run-up table, a parameter range and not a percentile,
 * and the caption already says so in as many words.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out: `bandFromPlans` and `withPredictiveBand` in full; the reading
 * above; and that only two summary quantities are grafted from the two
 * realisations, the total and the deferred deaths.
 *
 * The rules, fixed on 19 September 2026, before the candidate was written, and
 * numbered after the two hundred and fifty-four before them:
 *
 * 255. The candidate. A summary row's pair is that row's own fifth and
 *      ninety-fifth percentile across the same draws, by the same index rule
 *      the total's band already uses. The deferred deaths are the only row
 *      this moves, because the total is already its own percentile and the
 *      wave's pair is a parameter range that says so.
 *
 * 256. What is not in the candidate. The per-annulus table and the counter
 *      that ticks up along the front keep the two whole realisations they are
 *      built from: a ring's dead in the low column and the same ring's dead in
 *      the high column must be one world apiece, or the columns stop adding up
 *      — which is what rule 44's `foldOnto` was written for. A summary row is
 *      not a ring and does not owe the table that coherence; what it owes is
 *      the sentence in the caption.
 *
 * 257. What decides.
 *      (a) Exact: the deferred pair equals the fifth and ninety-fifth
 *          percentile of the deferred deaths over the draws, at the same
 *          indices the total's band is taken at.
 *      (b) Ordered by construction, at every scenario of every family: low is
 *          never above high. Not by sorting the two on the way to the screen,
 *          which is what B-066 did, but because they are drawn in order.
 *      (c) The total's band does not move by one person anywhere: it is
 *          already the total's own percentile and must stay identical.
 *      (d) The per-annulus columns do not move by one person anywhere.
 *      (e) The release gate stays PASS.
 *      Any of these failing refuses the candidate.
 *
 * 258. What is measured and recorded rather than gated: how often the new pair
 *      contains the figure it stands beside. It need not. The pair is a
 *      percentile over sampled draws and the figure is the single unsampled
 *      run the application shows, so the two can part company — and saying
 *      "the band must contain the central figure" would be the same mistake as
 *      the one being corrected, a promise made because it reads well rather
 *      than because it is true. Every preset of every family is run and the
 *      share reported.
 *
 * 259. What an adoption does. The registry takes the row; B-066's own row is
 *      amended to point here, because it was half of this. The ordering guard
 *      on the way to the screen stays where it is: it costs nothing and it
 *      records that the display was once the only thing holding the promise.
 *
 * 260. What may not happen. No sampler, no sigma, no vulnerability table and
 *      no mortality is touched. If a printed band widens or narrows, that is
 *      the result (rules 5 and 6).
 *
 * What these rules cannot settle. Whether a few hundred draws are enough for a
 * fifth percentile of a quantity that is not what the draws were sorted on —
 * the tails of a derived quantity are noisier than the tails of the ranking
 * key, and nothing here measures that noise. And whether a reader takes a pair
 * in parentheses to mean a percentile at all, which is a question about the
 * caption and not about the arithmetic.
 */

/** The quantiles a row's pair is taken at — the same the total's band uses. */
export const ROW_BAND_LOW_Q = 0.05;
export const ROW_BAND_HIGH_Q = 0.95;

/**
 * The index rule, kept in one place so a row's percentile and the total's
 * cannot drift apart: round the quantile onto the sorted draws.
 */
export function quantileIndex(count: number, q: number): number {
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(q * (count - 1))));
}

/** The value of a sorted sample at a quantile, by {@link quantileIndex}. */
export function quantileOf(sorted: readonly number[], q: number): number {
  return sorted[quantileIndex(sorted.length, q)] ?? 0;
}

/**
 * The outcome of the round, written after the candidate was measured, on
 * 19 September 2026. The rules above were pushed in commit c40b296 before the
 * candidate was written.
 *
 * ADOPTED. Rule 257 holds on every clause.
 *
 * (a) The deferred pair is the percentile of the deferred deaths, recomputed
 *     the long way round from the same draws and equal to the bit.
 *
 * (b) Ordered by construction at all thirty-five presets of the four families.
 *     And the finding turned out to be larger than the one report that found
 *     it: the whole-realisation pair was printed backwards on SEVEN of the
 *     thirty-five, most of them nuclear. Andrea's Miami run was not unlucky,
 *     it was ordinary.
 *
 * (c) and (d) The total's band and the per-annulus columns do not move by one
 *     person: the whole suite is green and docs/VALIDATION_REPORT.json
 *     regenerates byte for byte identical. The total was always its own
 *     percentile, because the draws are sorted on it.
 *
 * (e) Gate PASS in strict mode.
 *
 * Rule 258, recorded and not gated. The row's own pair contains the figure
 * beside it on 35 of 35 presets. The whole-realisation pair, ordered first so
 * the comparison is fair, contained it on 31 of 35. So the band that was
 * supposed to be a claim about the row failed to contain the row on four
 * presets, and the one that is a claim about the row contains it everywhere
 * that was looked. That is a result and not a guarantee: nothing here forces
 * a percentile over sampled draws to contain the single unsampled run, and
 * rule 258 said in advance that demanding it would be the same mistake in a
 * new place.
 *
 * What is left standing. The tails of a derived quantity are noisier than the
 * tails of the ranking key, and a few hundred draws are what there are;
 * nothing here measures that noise. And the wave's pair is still a parameter
 * range rather than a percentile — the caption says so, and making it one is a
 * different round, because the run-up's vulnerability is not sampled at all.
 */
export const ROW_BAND_OUTCOME =
  "ADOPTED 19 September 2026: a summary row's pair is that row's own 5–95 percentile over the same draws. Ordered at all 35 presets, where the whole-realisation pair was backwards on 7; contains the figure beside it on 35 of 35, where the old one managed 31. The total's band and the per-annulus columns did not move.";
