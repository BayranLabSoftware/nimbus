/**
 * Putting the strike in the picture and in the count.
 *
 * WHAT IS STILL TRUE TODAY, five commits after the strike lookup was accepted:
 * nothing reads it. `scene/globe/Globe.tsx` and `validation/recordedTolls.ts`
 * still take `strikeAzimuthDeg ?? 0`, and `store/useAppStore.ts` passes the
 * same default into the stadium it builds for the toll. Every earthquake a
 * reader places is drawn, and counted, as a fault striking due north — which
 * is what rules 286 to 294 were written against, and what rules 295 to 303 then
 * measured a cure for: six presets of six, worst error 11.5°, north beaten on
 * every one.
 *
 * And it is not cosmetic. Rule 308 measured what north was worth, with
 * ShakeMap: turning the rupture from north to the strike the lookup finds moves
 * 18 % to 68 % of the MMI VII footprint onto different ground at almost
 * unchanged area, and under Sumatra it takes the population inside that
 * footprint from 7.35 M to 19.93 M.
 *
 * So this round is the wiring, and it is the first of this series that MOVES
 * PUBLISHED FIGURES. Eight of the twelve earthquakes in the calibration net
 * carry no strike of their own and are therefore counted today inside a
 * north–south stadium; with the lookup wired they will be counted inside the
 * stadium of the fault the lookup finds. Their tolls will move. That is the
 * point, and it is also the risk, and rule 326 is how it is judged.
 *
 * WHAT WAS LOOKED AT before these rules were fixed: the three call sites above;
 * that the net holds twelve earthquakes and that four of them name a strike
 * (Tōhoku, Sumatra, Valdivia, Alaska, Gorkha, Kokoxili and Lisbon name one in
 * the preset table — four of them are net rows); the size of what would have to
 * ship, 2 875 030 bytes of fault tiles with a worst tile of 92 373 and 218 911
 * bytes of slab tiles with a worst tile of 7 267; and everything rules 286 to 308
 * already recorded. NOT looked at: any toll, band or report figure computed
 * with the lookup wired. Not one row has been run that way.
 *
 * 322. THE THREE CALL SITES, and one answer behind them. The globe, the store's
 *      stadium and the recorded tolls stop defaulting to north. They call ONE
 *      function — the lookup of rule 300 — and where a reader has typed a
 *      strike, his own strike wins over it, because a reader's statement about
 *      his own scenario is not the model's to overrule.
 *
 * 323. WHAT THE PRESETS DO, which is nothing. A preset that names a published
 *      strike keeps it (rule 286). Their tolls, bands, waves, replays and
 *      golden figures must not move by one unit, and a preset whose figure
 *      moves is a defect of the wiring and not a result.
 *
 * 324. WHAT A READER PAYS. The tiles ship: 2.88 MB of faults and 0.22 MB of
 *      slabs, and a click loads the one tile of each that holds its point — at
 *      most 92 kB and 8 kB. Nothing is fetched until an earthquake is placed,
 *      and a globe that never places one loads neither. The budgets of rules
 *      292(f) and 301(f) are the bounds, unchanged and not re-opened here.
 *
 * 325. WHERE THE LOOKUP SAYS NOTHING, the picture and the count say so too, as
 *      rules 290 and 291 already fixed: no oriented rectangle is drawn, and no
 *      north is assumed. This round implements those two rules as written; it
 *      does not reinterpret them. What it may NOT do is quietly fall back to
 *      north and call it an assumption.
 *
 * 326. WHAT DECIDES, and the bar is the amendment of 16 September, not a hope
 *      that the dead improve.
 *      (a) Every row of the calibration net that is gated stays inside its
 *          band. A row that leaves its band refuses the round outright: the
 *          band is the project's own statement of what it knows about that
 *          earthquake, and a more correct orientation that pushes a toll out of
 *          it is telling us something we do not understand yet.
 *      (b) On the net's earthquakes, the bias of the modelled dead against the
 *          recorded dead is no further from 1 than it is today, and σ_ln is no
 *          wider. Measured on the same rows, before and after, and printed row
 *          by row.
 *      (c) No preset moves at all (rule 323).
 *      (d) The release gate stays PASS in strict mode, and
 *          `docs/VALIDATION_REPORT.md` and its JSON are regenerated and
 *          committed together — they will change, because the figures they
 *          report change, and a report that did not change would mean the
 *          wiring did nothing.
 *      (e) The globe audit stays at its thirty scenarios with no finding.
 *
 * 327. WHAT MAY NOT HAPPEN. No strike is invented to move a toll; no bound of
 *      rules 286 to 303 is touched; no band is widened to keep a row inside it;
 *      and the ground-motion model, the contour law and the site term stay
 *      exactly as they are — this round changes WHERE the rectangle points and
 *      nothing else.
 *
 * 328. WHAT IS PRINTED: for every earthquake of the net, the strike before and
 *      after and where the new one came from, the modelled dead before and
 *      after against the record, whether the row is still inside its band, and
 *      the two bias-and-σ pairs; the list of presets, which must be empty of
 *      movement; and the bytes a reader loads for one click.
 */

/**
 * THE OUTCOME OF THE HARNESS HALF, measured on 20 September 2026. Rules 322 to
 * 328 were pushed in 8788d73 and the candidate in c6185fb, both before one toll
 * was read.
 *
 * ACCEPTED on rules 326(a) and (b) — and it moves NOTHING, which is the result
 * and needs explaining rather than celebrating.
 *
 * | row              | strike before | after | source  | dead before | after | record |
 * |------------------|--------------:|------:|---------|------------:|------:|-------:|
 * | Kokoxili 2001    |          95°  |   95° | preset  |           0 |     0 |      0 |
 * | Northridge 1994  |         north |  293° | crustal |          29 |    29 |     57 |
 * | L'Aquila 2009    |         north |  130° | crustal |          42 |    42 |    309 |
 * | Amatrice 2016    |         north |  329° | crustal |           1 |     1 |    299 |
 * | Gorkha 2015      |         290°  |  290° | preset  |       5 356 | 5 356 |  8 964 |
 * | Tōhoku 2011      |         200°  |  200° | preset  |       7 997 | 7 997 | 18 500 |
 * | Sumatra 2004     |         330°  |  330° | preset  |       4 263 | 4 263 |227 898 |
 * | Christchurch 2011|         north |   79° | crustal |           1 |     1 |    185 |
 * | Kumamoto 2016    |         north |   54° | crustal |         199 |   199 |    273 |
 * | Kaikōura 2016    |         north |  248° | crustal |           0 |     0 |      2 |
 * | Pohang 2017      |         north | north | unknown |         129 |   129 |      0 |
 * | Durrës 2019      |         north |  338° | crustal |          15 |    15 |     51 |
 *
 *   326(a) rows leaving their band: 0        — inside
 *   326(b) bias 0.129 → 0.129, σ 2.127 → 2.127 — inside, unchanged
 *   rows whose toll moved: 0 of 12
 *
 * WHY NOTHING MOVED, and it is not that the lookup failed: seven of the eight
 * rows that pointed north now point somewhere real, and the eighth (Pohang)
 * honestly finds nothing. The tolls do not move because THOSE SEVEN ROWS ARE
 * POINT SOURCES. A scenario is drawn as an extended rupture from Mw 7.5, or
 * when it is marked a subduction interface; below that the stadium degenerates
 * to a disc, and a disc has no orientation to get wrong. Northridge is Mw 6.7,
 * L'Aquila 6.3, Amatrice 6.2, Christchurch 6.2, Durrës 6.4, Kumamoto 7.0. The
 * one extended row among them, Kaikōura at Mw 7.8, kills nobody in the model
 * and nobody in the record either, so its footprint moved over ground with no
 * one on it.
 *
 * RULE 326(e), RUN RATHER THAN ASSUMED: the globe audit was re-run against the
 * dev server after both halves of the wiring and after rule 325's change to
 * what is drawn where no strike is known — thirty scenarios, every ellipse and
 * polygon the renderer hands to Cesium read back through the probe and checked
 * against the numbers the store holds. **Zero findings.** The megathrust
 * scenario is the one that exercises this round: four ellipses, two polygons
 * and twenty-one quantities compared.
 *
 * A CORRECTION, WRITTEN THE SAME EVENING AND BEFORE ANYONE ELSE FOUND IT. The
 * commit that carried this round said `docs/VALIDATION_REPORT.md` "regenerates
 * identical". IT DOES NOT, and the claim was made from a measurement that
 * looked at the wrong set: rule 328's harness reads the twelve rows of the
 * calibration net, where nothing moves for the reason given above, while the
 * report also scores the 406 rows held out by rule 11 — and those are full of
 * the extended ruptures this round turns. Regenerated from a clean tree:
 *
 * | row (held out by rule)      | dead before | after  | record |
 * |-----------------------------|------------:|-------:|-------:|
 * | Tōhoku 2011                 |         426 | 23 299 |  1 474 |
 * | Sichuan 2008                |      29 787 |326 385 | 87 652 |
 * | Chile, Maule 2010           |       1 346 |  2 422 |    402 |
 * | Türkiye–Syria 2023          |       1 422 |  5 851 |      0 |
 *
 *   all sizes   bias 0.91× → 1.10×, σ 2.44 → 2.50, scored 125 → 126
 *   Mw ≥ 7.5    bias 1.94× → 6.47×, σ 2.35 → 2.12, scored 18 → 19
 *
 * The cause is the one rule 308 measured and is not a defect: turned along its
 * fault, Tōhoku's footprint runs down the coast of Japan instead of out to
 * sea. The consequence is that on the held-out set the great earthquakes go
 * from under-counting by two to over-counting by six and a half.
 *
 * THREE THINGS FOLLOW, and the third is the one that matters.
 *
 *   1. Rule 326(d) foresaw exactly this — "they will change, because the
 *      figures they report change, and a report that did not change would mean
 *      the wiring did nothing" — so the round is not invalidated by the report
 *      moving. It is the ACCOUNT that was wrong, and it is corrected here and
 *      in the commit that carries the regenerated report.
 *   2. Rule 326(a) and (b) speak of the calibration net, and on the net they
 *      hold exactly as recorded. They say nothing about the held-out set,
 *      which is where this round's effect actually lands. That is a hole in a
 *      rule I wrote, and naming it is the only repair available: a clause that
 *      decides a wiring on twelve rows, none of which can feel it, decides
 *      nothing.
 *   3. The direction of the move is now known and is not comfortable: with the
 *      faults pointing the right way, the model over-counts the great
 *      earthquakes of the held-out set by 6.5× where it under-counted them by
 *      2×. Read beside the same day's other two measurements — we paint MMI
 *      VII on nine tenths of the maps that hold none, and counting the dead
 *      cell by cell makes the shortfall worse — the picture is of a model
 *      whose errors are large and whose geometry was hiding part of them.
 *
 * WHAT THAT SAYS ABOUT THE NET, and it is worth saying before anyone reads
 * "accepted" as "vindicated": THE CALIBRATION NET CANNOT MEASURE THIS CHANGE.
 * It holds twelve earthquakes, four of them presets that keep their published
 * strike, seven point sources, and one extended row with no dead. There is no
 * row in it where the orientation of an extended rupture decides a toll. Rule
 * 308 measured, with ShakeMap, that the orientation moves 18 % to 68 % of an
 * MMI VII footprint and takes Sumatra's exposed population from 7.35 M to
 * 19.93 M — and none of that reaches a single figure this net prints.
 *
 * So the wiring is accepted because it breaks nothing and because rules 295 to
 * 303 already measured that it is right. It is NOT accepted on the strength of
 * a toll that improved, and no such claim is made here. What it changes is what
 * a reader sees and counts when he places a great earthquake himself, which is
 * the other half of the wiring and the round after this one.
 */
/** Rule 324: what ships, measured before the round. */
export const WIRED_STRIKE_PAYLOAD = {
  faultBytes: 2_875_030,
  worstFaultTileBytes: 92_373,
  slabBytes: 218_911,
  worstSlabTileBytes: 7_267,
} as const;

/** Rule 326(b): the two numbers the net is judged on, before and after. */
export interface TollBias {
  /** Geometric mean of modelled over recorded. */
  bias: number;
  /** Scatter of ln(modelled / recorded). */
  sigma: number;
  rows: number;
}

/** Rule 326(b): the amendment's test, applied to a pair of readings. */
export function amendmentHolds(before: TollBias, after: TollBias): boolean {
  const closer = Math.abs(Math.log(after.bias)) <= Math.abs(Math.log(before.bias));
  return closer && after.sigma <= before.sigma;
}

/** Rule 322: a reader's own strike wins over the lookup's. */
export function strikeForScenario(
  typedByReader: number | undefined,
  found: number | null
): { strikeDeg: number | null; source: 'reader' | 'lookup' | 'unknown' } {
  if (typedByReader !== undefined && Number.isFinite(typedByReader)) {
    return { strikeDeg: typedByReader, source: 'reader' };
  }
  if (found !== null && Number.isFinite(found)) return { strikeDeg: found, source: 'lookup' };
  return { strikeDeg: null, source: 'unknown' };
}
