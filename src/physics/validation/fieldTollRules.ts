/**
 * Counting the dead where the shaking is, not where the ring is.
 *
 * WHAT IS BEING COUNTED TODAY. `shakingCasualtyPlan` lays five annuli around
 * the epicentre — MMI V to IX — gives each one PAGER's fatality rate at a
 * single representative intensity, and multiplies by the people inside it.
 * Two approximations are folded into that, and the field makes both
 * unnecessary:
 *
 *   1. THE INTENSITY IS TAKEN AS CONSTANT ON AN ANNULUS. It is not. The
 *      annulus between the MMI VII and VIII contours holds ground at 7.0 and
 *      ground at 7.99, and PAGER's fatality rate is a lognormal in intensity —
 *      between those two it changes by a factor of several. The band's single
 *      rate is a stand-in for an average nobody computed.
 *   2. THE ANNULUS IS THE SAME SHAPE AS THE CONTOUR. With the ground read at
 *      every point (rules 309 to 321) it is not: the MMI VII contour bulges
 *      over a basin and pinches over rock, and the people in the bulge are
 *      counted at the rate of the ring they are geometrically inside rather
 *      than the rate of the shaking they actually get.
 *
 * Rule 313 declared this as a debt on the day the field was adopted. This is
 * the round that pays it, and it is the first of the series to move every
 * published figure of the calibration net at once.
 *
 * WHAT WAS LOOKED AT before these rules were fixed: `shakingCasualtyPlan` and
 * the shape of `CasualtyPlan`; `pagerFatalityRate`, which is continuous in
 * intensity and can be asked for any MMI; `shippedLandDensity`, which gives
 * people per square kilometre at a point; and everything rules 309 to 321
 * already measured. NOT looked at: any toll computed cell by cell, for any
 * row, at any resolution.
 *
 * 335. THE COUNT. The dead of an earthquake are the sum, over the cells of the
 *      field rule 312 evaluates, of the people in the cell times PAGER's
 *      fatality rate at THAT CELL'S intensity, with the vulnerability the
 *      country curve gives. The people in a cell are its land population
 *      density times its ground area, so that a field finer than the
 *      population raster does not count the same village twice and a field
 *      coarser than it does not miss one.
 *
 * 336. THE BANDS SURVIVE, because a reader reads them and the report prints
 *      them: every cell belongs to the band its intensity falls in, and a
 *      band's dead are the sum over its own cells. The bands' radii and
 *      polygons stay what rules 290 and 325 make them. What changes is that a
 *      band's toll is no longer people × one rate.
 *
 * 337. WHAT DOES NOT CHANGE, so that what moves can be attributed to this and
 *      to nothing else: PAGER's curves and the vulnerability triplet; the
 *      country, which is still the one under the epicentre for the whole
 *      footprint — a real defect where a footprint crosses a border, declared
 *      here and left to its own round; the ground-motion model; the contour
 *      law; the strike; the field's own resolution and extent.
 *
 * 338. WHAT DECIDES, and it is the amendment of 16 September applied to the
 *      dead, not a hope that they improve:
 *      (a) every gated row of the calibration net stays inside its band;
 *      (b) on the net's earthquakes, the bias of the modelled dead against the
 *          recorded dead is no further from 1 than it is today and σ_ln is no
 *          wider, measured on the same rows;
 *      (c) on rule 11's held-out set, the same two quantities, likewise;
 *      (d) the release gate stays PASS in strict mode;
 *      (e) `docs/VALIDATION_REPORT.md` and its JSON are regenerated and
 *          committed with the round. They WILL change, and a report that did
 *          not change would mean the round did nothing.
 *
 * 339. WHAT MAY NOT HAPPEN. No curve is retuned, no band widened, no row
 *      dropped, and no resolution chosen after the numbers are seen: the field
 *      is rule 312's 257 × 257, fixed before this round and not touched by it.
 *      If the dead get worse, the round is refused and the debt stays declared
 *      — a more faithful count that reads worse against the record is telling
 *      us something about the curves, and it will be heard in the round that
 *      is about the curves.
 *
 * 340. THE COST IN TIME is part of what decides: a toll must still be computed
 *      inside the budget rule 314(c) set for a field, 250 ms, because the
 *      product computes one on every click. Measured and printed.
 *
 * 341. WHAT IS PRINTED: for every row of the net and of rule 11's set, the
 *      dead before and after against the record, the band before and after,
 *      and whether the row is still inside it; the two bias-and-σ pairs; the
 *      share of each footprint's cells that fell back for want of ground or
 *      population data; and the time one toll takes.
 *
 * WHAT THIS CANNOT SETTLE. Whether PAGER's curves are right — they are fitted
 * to recorded losses and carry their own scatter, which E3 reads. Whether one
 * country's curve should serve a footprint that crosses two. And the
 * resolution: a 12 km cell at Mw 9 cannot resolve a city, and the round that
 * needs it will say so and pay for it.
 */

/**
 * THE OUTCOME, measured on 20 September 2026. Rules 335 to 341 were pushed in
 * 15a3229, the arithmetic in e49ea2a and the harness in 4ccb567 — all three
 * before one toll was read from any of them.
 *
 * **REFUSED on rule 338(b)**, and rule 339 said in advance what that means:
 * the debt stays declared, and the round that answers this is about the
 * curves.
 *
 * | row              | record | today | over the field | today | over the field |
 * |------------------|-------:|------:|---------------:|------:|---------------:|
 * | Northridge 1994  |     57 |    29 |             18 | 0.51  |          0.32  |
 * | L'Aquila 2009    |    309 |    42 |             26 | 0.14  |          0.08  |
 * | Amatrice 2016    |    299 |     1 |              1 | 0.00  |          0.00  |
 * | Gorkha 2015      |  8 964 | 5 356 |          2 405 | 0.60  |          0.27  |
 * | Tōhoku 2011      | 18 500 | 7 997 |          5 648 | 0.43  |          0.31  |
 * | Sumatra 2004     |227 898 | 4 263 |          6 917 | 0.02  |          0.03  |
 * | Kumamoto 2016    |    273 |   199 |             36 | 0.73  |          0.13  |
 * | Durrës 2019      |     51 |    15 |              8 | 0.29  |          0.15  |
 *
 *   338(b) bias 0.103 → 0.064, σ 2.123 → 1.817 on ten rows — OUTSIDE
 *   340    slowest toll 21 ms against 250                  — inside
 *
 * THE SCATTER TIGHTENS AND THE BIAS GETS WORSE, which is exactly the pair the
 * amendment refuses: a count that agrees with itself more and with the record
 * less. We were a tenth of the recorded dead; cell by cell we are a
 * sixteenth.
 *
 * IT IS NOT A DEFECT OF THE COUNT, and that was checked before this was
 * written rather than assumed:
 *
 *   - the field's own MMI VII area on Northridge, with the scenario's single
 *     Vs30, is 903 km² against the 904 km² of the published radius — the field
 *     reproduces the ring it replaces to one part in nine hundred;
 *   - the people that field holds, summed by density times cell area, are
 *     1.517 M against the 1.516 M the shipped counter reads in the same circle
 *     — one part in fifteen hundred.
 *
 * So the arithmetic is right and the answer is smaller. Two things make it
 * smaller, and both are the count becoming MORE faithful:
 *
 *   1. THE GROUND AT THE EPICENTRE IS SOFTER THAN THE GROUND AROUND IT. The
 *      store reads Wald & Allen's Vs30 from the slope under the pick — 247 m/s
 *      at Northridge, a soft-basin value — and hands it to the whole
 *      footprint. The USGS grid, which carries California's own regional map,
 *      gives harder ground over much of that footprint: the MMI VII area falls
 *      from 903 km² to 646. Every row whose epicentre sits on the softest
 *      patch of its own footprint has been counting the whole footprint on
 *      that patch.
 *   2. A BAND'S RATE IS NOT ITS AVERAGE. The annulus between MMI VII and VIII
 *      is charged at 7.5, and most of its area — and most of its people, where
 *      they are spread evenly — lies near its outer edge, at 7.0 to 7.3, where
 *      PAGER's rate is several times lower. Counting each cell at its own
 *      intensity removes that subsidy.
 *
 * WHAT THIS SETTLES. The toll's tenfold shortfall against the record was being
 * masked, in part, by two generous approximations, and removing them makes it
 * a sixteenfold shortfall. The deficit is not in the geometry of the count: it
 * is in what the model says the ground does, or in what PAGER's curves say
 * that shaking does to people — and this round cannot tell which, because rule
 * 337 froze both.
 *
 * READ WITH E1's OUTCOME OF THE SAME DAY, the two are one statement: we paint
 * MMI VII on nine tenths of the earthquakes whose published map holds none,
 * and we kill a sixteenth of the people the record counts. Too much area at
 * low intensity, too little intensity where the people are.
 *
 * NOTHING IS WIRED. `shakingCasualtyPlan` still lays annuli, every published
 * figure still comes from them, the report is untouched, and rule 313's debt
 * stands with this measurement written under it.
 */
export const FIELD_TOLL_CANDIDATE =
  'REFUSED 20 September 2026 on rule 338(b): counting the dead cell by cell takes the bias from 0.103 to 0.064 of the record while tightening σ from 2.123 to 1.817 — agreeing with itself more and with the record less. The count was checked first and is right to one part in nine hundred on area and one in fifteen hundred on people; it is smaller because it is more faithful. The epicentre\u2019s Vs30 (247 m/s at Northridge) is softer than the ground around it, so the field\u2019s MMI VII area falls from 903 km\u00b2 to 646; and a band charged at 7.5 subsidises people who are mostly at 7.0 to 7.3. The tenfold shortfall in the dead was masked by two generous approximations and is really sixteenfold.';

/** Rule 338(b) and (c): the pair a set is judged on, before and after. */
export interface TollReading {
  bias: number;
  sigma: number;
  rows: number;
}

/** Rule 338: the amendment, applied to the dead. Both clauses, or neither. */
export function tollAmendmentHolds(before: TollReading, after: TollReading): boolean {
  const closer = Math.abs(Math.log(after.bias)) <= Math.abs(Math.log(before.bias));
  return closer && after.sigma <= before.sigma;
}

/** Rule 335: the people in one cell of the field. */
export function peopleInCell(densityPerKm2: number, cellAreaM2: number): number {
  if (!Number.isFinite(densityPerKm2) || densityPerKm2 <= 0) return 0;
  if (!Number.isFinite(cellAreaM2) || cellAreaM2 <= 0) return 0;
  return densityPerKm2 * (cellAreaM2 / 1e6);
}

/** Rule 336: which band a cell's intensity belongs to, as the bands are keyed
 *  today. Null below the lowest band the plan carries. */
export function bandOfIntensity(mmi: number, lowest: 5 | 7): string | null {
  if (!Number.isFinite(mmi)) return null;
  if (mmi >= 9) return 'mmi9';
  if (mmi >= 8) return 'mmi8';
  if (mmi >= 7) return 'mmi7';
  if (lowest === 7) return null;
  if (mmi >= 6) return 'mmi6';
  if (mmi >= 5) return 'mmi5';
  return null;
}

/** Rule 340: what a toll may cost, which is what a field may cost. */
export const FIELD_TOLL_BUDGET_MS = 250;
