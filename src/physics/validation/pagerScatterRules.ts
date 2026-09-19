/**
 * How well the field's own tool does on the rows we are scored on.
 *
 * E3 of `docs/GOLD_STANDARD.md` asks for the death toll to be "within ×1.5
 * overall and in every cell, and σ_ln no more than PAGER's own estimates read
 * on the same rows plus 0.25", and the amendment of 16 September 2026 took the
 * allowance away: as good as the field leaves none. Nimbus's side has been read
 * — on rule 11's set, 0.90× with σ_ln 2.42 — and the rule has stood *pending*
 * ever since for one reason, which the scorecard states in a single sentence:
 * "PAGER's own σ_ln on the same rows has not been read."
 *
 * It can be. PAGER publishes a fatality estimate for every earthquake it runs,
 * and the harness that fetched its exposure products for BM's EQ-PAGER track
 * fetches its `losses.json` in the same request. What has never been done is
 * the obvious thing: put PAGER's own number beside the record, on the rows
 * Nimbus is scored on, and read the same statistic.
 *
 * One property of this set makes the reading worth trusting. PAGER's empirical
 * fatality curves were calibrated on earthquakes from 1973 to 2007 (Jaiswal &
 * Wald 2010), and this project's standing rule — written after the mistake of
 * 15 September 2026 — is that deaths inside that window can never be decisive,
 * because a model read on its own calibration data is not being tested. Every
 * one of the 409 rows of `heldOutByRuleData.ts` is dated **2008 or later**. So
 * this set reads PAGER out of sample, which is the only way a reference's
 * scatter means anything.
 *
 * The rules, fixed on 19 September 2026 and numbered after the two hundred and
 * fourteen before them, written before PAGER's losses are joined to a single
 * row of ours:
 *
 *  215. **What is looked at, and what it costs.** The rows of rule 11's set
 *       that `allenTollRun.ts` already scores as held out, each with its NCEI
 *       record. The set has been read by this project many times; reading it
 *       again spends nothing, and no unread set is touched. What has never
 *       been read is the reference's own scatter on it.
 *
 *  216. **The reference.** PAGER's own published estimate, from the
 *       `losspager` product of the same ComCat event: the total fatalities of
 *       its `losses.json`, which is the number PAGER puts on the event. Beside
 *       it, and deciding nothing, the σ PAGER declares for itself — the
 *       country's `gnormvalue`, which this project already carries in
 *       `pagerCountries.ts` and already draws its own toll band with. The two
 *       are different quantities: one is how far PAGER lands from the record,
 *       the other is how wide PAGER says its own answer is.
 *
 *  217. **What is measured.** The statistic the report already prints, from
 *       `scorecard.ts`'s own `scoreStats`, computed twice on the same rows:
 *       once with our central estimate as the model and once with PAGER's.
 *       Bias is the geometric mean of model over record over the rows where
 *       both are above zero; the scatter is the standard deviation of
 *       ln(model / record) on those rows. Rows where PAGER has no product, or
 *       no estimate, are named and left out of both columns, so the two are
 *       always read on one set of rows.
 *
 *  218. **What decides.** E3's bound as amended: **σ_ln(ours) ≤ σ_ln(PAGER) on
 *       the same rows**, with the bias already inside ×1.5. Two guards, and a
 *       failure of either means nothing is read from the round:
 *       (a) our column must reproduce what the report publishes for these rows
 *           — 0.90× and σ_ln 2.42 — to the two figures it prints them at. A
 *           column that does not is a join that has gone wrong, not a result;
 *       (b) at least a hundred rows must carry a PAGER estimate, because that
 *           is the size E3 names.
 *       Whichever way it falls it is published. If PAGER's scatter is the
 *       smaller, E3 is **not met** and the gap has a measured size for the
 *       first time; if ours is, the clause turns on the bias and the cells.
 *
 *  219. **What this cannot settle.** PAGER's number is the one its product
 *       carries now, which for an old earthquake is not the one it published in
 *       the first hour: an operational estimate is revised, and some revisions
 *       will have seen the toll they are being scored against. That is a
 *       limitation of using a live product as a reference and it cannot be
 *       removed from this side of the wire — the archive of first estimates is
 *       not in the product. It is declared, and it cuts against us: a
 *       reference that has seen the answer sets a bar that is too high, not
 *       too low. Nor does this touch E3's other clause, the 2 % of quiet
 *       earthquakes, or E4's band.
 */

/** Rule 218(a). What the report publishes for these rows, and what this round
 *  must reproduce before any of its numbers may be read. */
export const PUBLISHED_RULE_11_TOLL = { bias: 0.9, scatterLn: 2.42 } as const;

/** Rule 218(b). E3's own set size. */
export const MINIMUM_ROWS_WITH_PAGER = 100;

/** Rule 215. PAGER's fatality curves were calibrated here (Jaiswal & Wald
 *  2010), and no row of this set falls inside it. */
export const PAGER_CALIBRATION_WINDOW = { fromYear: 1973, toYear: 2007 } as const;

/**
 * Rule 218. E3's bound after the amendment of 16 September 2026: no worse than
 * the reference on the same rows, with no allowance.
 */
export function meetsE3Scatter(oursLn: number, pagerLn: number): boolean {
  return oursLn <= pagerLn;
}
