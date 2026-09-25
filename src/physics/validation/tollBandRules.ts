/**
 * The death toll's band, and what it leaves out.
 *
 * Andrea ran four scenarios through the product on 17 September 2026 and
 * scored the reports himself. On the ten-megatonne burst over Rome he wrote
 * that the band — 2 700 000 to 2 900 000 dead about 2 800 000, four per cent
 * either way — is "troppo stretta rispetto al fatto che il report stesso
 * esclude molta incertezza strutturale dai tassi di mortalità". He is right,
 * and `uq/tollBand.ts` says so itself: a realisation draws the scenario's
 * inputs, and for shaking it also draws PAGER's own scatter G, but "plans
 * without a published scatter — blast, pyroclastic — draw nothing, so their
 * bands do not move". What such a band carries is the yield's ten per cent and
 * the height of burst. What it leaves out is the part the report calls
 * uncertain by a factor of two: how many of the people inside a ring the blast,
 * the burns and the fire actually kill.
 *
 * The vulnerability table already says how little it knows. Every mortality in
 * `casualties.ts` comes as a triple — the third-degree burn mortality 0.3, 0.5
 * and 0.8; the firestorm's 0.1, 0.3 and 0.8; the share of the injured who die
 * later 0.1, 0.3 and 0.6 — and every band of a plan carries its own
 * `mortalityLow` and `mortalityHigh`. Until 14 September those ends were the
 * band the product printed, and they were replaced because a pair like that is
 * not a claim about one event: it contains almost anything. The answer is not
 * to bring them back as the band, but to draw from them.
 *
 * The rules, fixed on 18 September 2026 and numbered after the hundred and
 * eighty-one before them, pushed before the candidate draws a band anywhere:
 *
 *  182. **What was looked at.** Andrea's four reports of 17 September and his
 *       scoring of them; the band the product prints today on those four
 *       scenarios; `uq/tollBand.ts`'s own account of what it draws and what it
 *       does not; the triples of `casualties.ts`; and the rows of the
 *       validation report that carry a band today, with their widths and their
 *       "inside" marks. No candidate has been run on any row.
 *
 *  183. **The candidate (`vulnerabilityScatter`).** Each realisation draws one
 *       factor for each hazard family — blast, burns, fire, the later deaths —
 *       from the spread the table itself declares, a lognormal of σ =
 *       ln(high / low) / 3.29, which is the σ a 5–95 % interval of that width
 *       would have. The factor multiplies that family's mortality in every band
 *       of the realisation, capped at one, exactly as the shaking's PAGER draw
 *       already does with G. The central estimate is untouched: it stays the
 *       table's middle setting. A plan whose hazard has no triple draws
 *       nothing.
 *
 *  184. **What decides.** Adopted unless a guard fails:
 *       (a) the central toll of every row of the calibration net moves by less
 *           than {@link TOLL_BAND_CENTRE_TOLERANCE} — the candidate widens a
 *           band, it does not move an estimate;
 *       (b) the release gate stays PASS;
 *       (c) no row's band narrows;
 *       (d) the application prints what Node computes on every preset.
 *       Printed, and deciding nothing: how many rows the band holds before and
 *       after, and how wide it is. **A wider band holds more records by
 *       construction, so that count is a record of what changed and never a
 *       score.** The rules that read coverage — G3 and its followers — are not
 *       read here and stay where they are.
 *
 *  185. **What an adoption does.** The panel, the report and the scorecard
 *       print the wider band; `docs/SCIENCE.md` says what it now carries and
 *       what it still does not (the census, and the shape of the footprint);
 *       and the rows of the validation report that read "inside" say the band
 *       changed on 18 September 2026, so that a reader does not take the change
 *       for an improvement in accuracy.
 *
 *  186. **What these rules cannot settle.** Whether the band is calibrated.
 *       That asks a held-out set with rows enough to count coverage, and the
 *       explosions have two tolls, both tuned. The band is honest about what
 *       the model does not know; whether it is the right width is a question
 *       for a set nobody has.
 */

/**
 * What a realisation of the toll draws: `inputsOnly`, the scenario's inputs and
 * the shaking's own published scatter, as it has been since 14 September 2026;
 * or `withVulnerability`, those and the spread the vulnerability table declares
 * for its mortalities (rule 183).
 */
export type TollBandScatter = 'inputsOnly' | 'withVulnerability';

/** Rule 183's candidate and the law in place. */
export const TOLL_BAND_IN_PLACE: TollBandScatter = 'inputsOnly';
export const TOLL_BAND_CANDIDATE: TollBandScatter = 'withVulnerability';

/*
 * ===========================================================================
 * The outcome of rules 182 to 186, 18 September 2026: ADOPTED
 * ===========================================================================
 *
 * The rules were pushed in `fda8ef6`, with the candidate reachable by name and
 * drawn by nothing; then the guard ran on every row of the calibration net,
 * both settings in the same run (`scripts/benchmark/toll-band.ts`,
 * `benchmark/results/toll-band-2026-09-18.json`).
 *
 * (a) No central toll moved: 0.000 % on all eighteen rows, which is what the
 *     median plan going unsampled looks like.
 * (b) The release gate stays PASS.
 * (c) No band narrowed. Five widened, and they are the rows whose hazards have
 *     a spread to draw: Beirut 2020 ×1.22 → ×4.62 (1 289–1 576 dead becomes
 *     768–3 549), Hiroshima 1945 ×1.22 → ×1.71 (99 039–120 820 becomes
 *     87 236–149 129), Mount St Helens 1980 ×6.10 → ×39.83, Fuego 2018
 *     ×17.00 → ×50.62, Unzen 1991 ×1.75 → ×15.00. The thirteen earthquake
 *     rows do not move: their bands are the ground-motion residual and PAGER's
 *     G, which they already drew.
 * (d) The application prints what Node computes on every volcano preset (eight
 *     of them, 0 of 75 numbers different) and every explosion preset.
 *
 * Recorded, and not a score (rule 184): the rows whose band holds the record
 * go from 12 to 13 of 18 — Mount St Helens comes inside, on a band eleven
 * times wider. A wider band holds more records by construction. What the band
 * says now is what the model does not know; whether it is the right width is a
 * question for a held-out set nobody has (rule 186).
 *
 * `DEFAULT_TOLL_BAND_SCATTER` is `withVulnerability`.
 */

/** Rule 184 (a): how far a row's central toll may move, as a fraction. */
export const TOLL_BAND_CENTRE_TOLERANCE = 0.005;

/** Rule 183: the σ a triple implies, reading its ends as a 5–95 % interval.
 *  A `low` of 0 or less reads as "this hazard's own rate carries no
 *  dispersion" — true by construction for the one triple this project gives
 *  a `low` of exactly 0 (`casualties.ts`'s `FIRESTORM_MORTALITY`), where 0
 *  means the hazard's occurrence, not its rate, is what is unknown (rule
 *  1194, A11). */
export function tripleSigmaLn(low: number, high: number): number {
  if (!(low > 0) || !(high > 0) || high <= low) return 0;
  return Math.log(high / low) / 3.29;
}

export interface TollBandGuard {
  /** (a) The worst relative move of a central toll over the net's rows. */
  worstCentreMove: number;
  /** (b) */
  releaseGatePasses: boolean;
  /** (c) Rows whose band came back narrower than before. */
  rowsNarrowed: number;
  /** (d) Numbers the application prints that Node does not. */
  applicationDepartures: number;
}

/** Rule 184: whether the candidate is adopted. */
export function adoptVulnerabilityScatter(guard: TollBandGuard): boolean {
  return (
    Number.isFinite(guard.worstCentreMove) &&
    guard.worstCentreMove <= TOLL_BAND_CENTRE_TOLERANCE &&
    guard.releaseGatePasses &&
    guard.rowsNarrowed === 0 &&
    guard.applicationDepartures === 0
  );
}
