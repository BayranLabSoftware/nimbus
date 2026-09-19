/**
 * The strike we already know, used where we actually measure.
 *
 * WHAT IS TRUE TODAY, and is the whole reason for this block. Rule 322 of
 * `wiredStrikeRules.ts` named three call sites and said all three "stop
 * defaulting to north": the globe, the store's stadium, and `recordedTolls.ts`.
 * Two of them do. The third does it for TWELVE ROWS.
 *
 * `RECORDED_EVENTS` — the calibration net — is built by mapping
 * `pointingWhereTheFaultPoints` over the net's rows, and that decorator is
 * where the lookup of rule 300 is called. Rule 11's held-out earthquakes are
 * not built that way: `RULE_EARTHQUAKES` in `heldOutByRule.ts` calls
 * `ruleEarthquakeEvent`, which builds its scenario from magnitude, depth,
 * focal mechanism and Vs30 and names no strike at all. Nothing decorates it.
 * So every one of those 408 rows is counted as an earthquake whose
 * orientation nobody knows — today under rule 291's sweep, and before
 * 286c061 under a stadium pointing due north.
 *
 * That is the same mistake rule 322's round was measured by, and
 * `nimbus-rileggi-le-regole` already named it once: the wiring was validated
 * on the twelve rows of the net, where SEVEN of the eight rows that pointed
 * north are point sources and a strike cannot move them, and the round
 * honestly reported "0 of 12 moved". The rows where an orientation decides
 * who is inside the footprint are not in the net. They are here, and they
 * were never given the answer the model already has.
 *
 * WHAT WAS LOOKED AT before these rules were fixed, and is therefore not held
 * out by anything:
 *
 *  - what the lookup answers for all 408 rows, by source and by magnitude
 *    cell, read on 21 September 2026 (rule 343 below prints it). This is a
 *    property of the rows' geometry, not a score of the model against their
 *    records, and no toll was read to obtain it;
 *  - the toll table those 408 rows produce today, which the validation report
 *    has printed at every push for a week and which commit 286c061 moved:
 *    bias 0.92x and sigma_ln 2.43 over all sizes, and 1.98x and 2.29 on
 *    Mw >= 7.5;
 *  - Tohoku's MMI areas against its ShakeMap (199 742 / 67 625 / 0 km^2
 *    published, 304 870 / 192 279 / 0 km^2 drawn), and that the model reaches
 *    MMI IX nowhere on it under any of the three laws;
 *  - everything rules 286 to 334 already recorded.
 *
 * NOT looked at: any toll, band or report figure computed with the lookup
 * wired into rule 11's rows. Not one row has been run that way.
 *
 * 342. THE FOURTH CALL SITE. `RULE_EARTHQUAKES` asks the lookup of rule 300
 *      the same question the net's rows ask, through the same decorator, and
 *      counts its dead in the footprint that answer orients. A row whose
 *      lookup answers UNKNOWN keeps exactly what it has today, which is rule
 *      291's sweep: this block adds a source of knowledge, it does not remove
 *      the honest statement of ignorance that stands where there is none.
 *
 * 343. WHAT THE LOOKUP ANSWERS on those rows, read on 21 September 2026 and
 *      written here before any of it is counted:
 *
 *      | cell        | rows | interface | crustal | unknown |
 *      |-------------|-----:|----------:|--------:|--------:|
 *      | all         |  408 |       157 |     201 |      50 |
 *      | Mw < 6.5    |  154 |        31 |     104 |      19 |
 *      | Mw 6.5-7.5  |  196 |        96 |      81 |      19 |
 *      | Mw >= 7.5   |   58 |        30 |      16 |      12 |
 *
 *      The last line is the one that matters, and it is why this block is
 *      worth a round: 58 rows are extended sources — every scenario of Mw 7.5
 *      or more is — and 46 of them have a strike the model can state and does
 *      not use. Below Mw 7.5 the rupture is a point and the strike changes
 *      nothing, which rule 346(c) turns into a check rather than a hope.
 *
 * 344. WHAT MAY DECIDE, and it is not new physics. The candidate is the
 *      decorator that already exists and is already shipped — rule 300's
 *      lookup, rule 299's capacity test, rule 298's slab walk — applied to
 *      one more list of events. No law, no threshold, no bound of rules 286
 *      to 303 moves. If a figure moves, it moves because the footprint points
 *      somewhere else, and nothing else in the model can have moved it.
 *
 * 345. THE SET, AND WHAT IT IS WORTH. Rule 11's 408 rows. It is NOT held out
 *      and this block may not call it so: the validation report has scored it
 *      at every push since 14 September 2026 and its table is quoted above.
 *      What that costs is stated rather than hidden — a set already read
 *      cannot refute a candidate chosen with it in view, so this round can
 *      show that the wiring is consistent and can show what it costs, and it
 *      cannot be evidence that the model predicts better. The evidence for
 *      that is rule 23's quiet set and rule 329's E1 set, and neither is spent
 *      here.
 *
 * 346. WHAT DECIDES.
 *      (a) Every gated row stays inside its band. The calibration net is
 *          untouched by construction — it already calls the lookup — so any
 *          movement there at all is a defect of the wiring and refuses the
 *          round outright.
 *      (b) On Mw >= 7.5, where the whole of the change lives: |ln bias| is no
 *          larger than today's |ln 1.98| = 0.683, and the share of rows with
 *          something whose band holds the record does not fall below today's
 *          31 of 34. A round that points the footprints at the mapped
 *          structures and then counts the dead worse is telling us the
 *          structures are not what we think they are, and is refused.
 *      (c) The cells below Mw 7.5 do not move by one figure. Nothing there is
 *          an extended source, so a strike cannot reach them; anything that
 *          moves is a defect.
 *      (d) No preset's toll, wave, replay or golden figure moves at all
 *          (rules 286 and 323).
 *      (e) The release gate stays PASS in strict mode and the audits it reads
 *          stay clean.
 *
 * 347. WHAT MAY NOT HAPPEN. No strike is invented, no bound of rules 286 to
 *      303 is moved after the measurement (rules 5 and 6), no band is widened
 *      to keep a row inside it, and no row is dropped from the set because it
 *      got worse. The ground-motion model, the contour law, the site term and
 *      the rupture scaling stay exactly as they are: this block changes WHERE
 *      the footprint points on the rows we measure on, and nothing else. In
 *      particular it does not set `subductionInterface` on a row the lookup
 *      calls an interface — that is rule 302's ban, it is still standing, and
 *      it is a separate block with its own measurement.
 *
 * 348. WHAT IS PRINTED, whatever the outcome: the four-cell table of rule 343
 *      as the run itself reads it; for every row of Mw >= 7.5, the strike the
 *      lookup gives and where it came from, the dead before and after against
 *      the record, and whether the band still holds it; the two bias-and-sigma
 *      pairs per cell, before and after; and the count of rows that moved,
 *      which rule 346(c) says is zero below Mw 7.5.
 *
 * WHAT THESE RULES CANNOT SETTLE. Whether the structure the lookup finds is
 * the structure that broke — for these rows, unlike the six presets of rule
 * 292, there is no published strike to check against, which is exactly why
 * rule 346(b) judges them on the dead and not on the angle. Whether counting
 * the dead in a correctly oriented footprint is the same thing as counting
 * them correctly: rule 291's sweep and a mapped strike can agree on a median
 * and disagree about every individual row. And the thing under all of it,
 * unchanged since rule 294: a reader's click is not an earthquake.
 */

/** Rule 343's reading of the lookup over rule 11's rows, written down before
 *  any of those rows was counted with it. `heldOutStrike.test.ts` holds the
 *  run to these counts, so a change in the shipped fault or slab tiles that
 *  silently moves them fails rather than passes unnoticed. */
export const LOOKUP_ON_RULE_11_ROWS = {
  readOn: '2026-09-21',
  all: { rows: 408, interface: 157, crustal: 201, unknown: 50 },
  belowMw65: { rows: 154, interface: 31, crustal: 104, unknown: 19 },
  mw65to75: { rows: 196, interface: 96, crustal: 81, unknown: 19 },
  fromMw75: { rows: 58, interface: 30, crustal: 16, unknown: 12 },
} as const;

/** Rule 346(b)'s bar, fixed here before the candidate runs: today's bias on
 *  the Mw >= 7.5 cell, as commit 286c061's report prints it. */
export const MW75_BIAS_TODAY = 1.98;

/** Rule 346(b)'s second bar: the rows with something whose band holds the
 *  record today, in that same cell. */
export const MW75_INSIDE_TODAY = { inside: 31, withSomething: 34 } as const;
