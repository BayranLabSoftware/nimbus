/**
 * The ground under the whole footprint, not under the epicentre.
 *
 * WHAT IS WRONG TODAY, and it is one line of the store. With no Vs30 typed in,
 * `useAppStore.ts` reads the slope of the terrain tile under the pick, turns it
 * into a Vs30 by Wald & Allen 2007, and hands that ONE NUMBER to the simulator
 * (rule 20 of `siteVs30.ts` fixed it, measured it and shipped it). Every
 * contour, every ring and every toll of that earthquake then stands on the
 * ground at the epicentre — for Tōhoku, on the slope of a patch of sea floor
 * 130 km off Sendai. Tokyo, 380 km away on the soft fill of the Kantō basin,
 * is shaken on the sea floor's Vs30, and so is every city inside the footprint.
 *
 * That is not a small error in the right place. It is the reason the contours
 * are SMOOTH. A rounded rectangle is the exact locus of a fixed r_jb from a
 * rupture — but only if nothing else varies, and the one thing that varies most
 * is the ground. The published maps of the field are not smooth: the ShakeMap
 * of any earthquake is a set of ragged closed curves that bulge over basins and
 * pinch over rock, and they are ragged because the site term is evaluated
 * everywhere and not once.
 *
 * It is also, in part, WHY WE ARE TOO SMALL. `docs/SHAKEMAP_SETUP.md` records
 * it from ShakeMap's own scenarios: where both draw an MMI VII our ring is 0.46
 * of ShakeMap's equivalent radius on rock, and about 0.7 at a soft-basin Vs30.
 * ShakeMap stands on the ground's own Vs30 at every cell. We stand on one
 * number, and on rock it is the wrong one nearly everywhere people live.
 *
 * WHAT WAS LOOKED AT before these rules were written:
 *
 *   - `scripts/build-vs30.py`, written in an earlier session and not committed,
 *     and what it produces from the USGS grid already on this machine: 30 tiles,
 *     7.0 MB in all, 831 kB for the largest, 2.5′ cells, the geometric mean of
 *     the 5 × 5 grid points in each.
 *   - The store's derivation above, and `vs30SiteFactor` — Boore et al. 2014's
 *     site term, linear and non-linear halves, already implemented and already
 *     held to the published table by its test.
 *   - `SHAKEMAP_FOOTPRINTS` in `shakemapFixtures.ts`: the ground area at or
 *     above MMI VII, VIII and IX of the PUBLISHED ShakeMap of six events —
 *     Northridge 1994, L'Aquila 2009, Amatrice 2016, Gorkha 2015, Tōhoku 2011
 *     and Kokoxili 2001 —
 *     read from ComCat in an earlier session and committed. This is a published
 *     reference already in the repository, and it needs no network.
 *   - That ShakeMap runs on this machine as of today, so a scenario can be run
 *     for the shape of a footprint and not only for its area.
 *
 * NOT looked at: what our own MMI VII area is, on any of those six events, on
 * the ground the store gives them or on any other. The ratio of the two is the
 * measurement, and rule 314 is written against it before it is taken.
 *
 * The rules, fixed on 20 September 2026, numbered after the three hundred and
 * eight before them.
 *
 * 309. The field, not the number. The shaking of an earthquake is evaluated at
 *      every point of a grid over its own footprint, each point standing on the
 *      Vs30 of THAT point. The one number at the epicentre stops being the
 *      ground for everybody.
 *
 * 310. Where the ground comes from: the USGS global Vs30 grid
 *      (`global_vs30.grd`, public domain) — Allen & Wald's topographic-slope
 *      proxy on 30″ GMTED with the regional maps merged in for California,
 *      Washington and Oregon, Utah, Japan and Taiwan. It is the grid ShakeMap
 *      and PAGER themselves read, which is the point: a comparison against
 *      ShakeMap that stood on a different site map would be measuring the site
 *      map. Cut to 2.5′ cells, the lattice the population already ships on, so
 *      one cell of ground answers for one cell of people.
 *
 *      Where the grid has no value — it stops at 56° S and 84° N, and it has
 *      none at sea — the field falls back to the store's own derivation for
 *      that point, and where that is unavailable, to rock. The fallback is
 *      named in what is printed, never silent.
 *
 * 311. What does NOT change in this round, so that what moves can be
 *      attributed. The ground-motion model is the one already chosen and
 *      already measured — BSSA14 and the subduction families rule 35 picks
 *      between — and the site term is `vs30SiteFactor`, unchanged, evaluated at
 *      more places. No coefficient moves. The rupture geometry, the strike of
 *      rules 295 to 303, the magnitude scaling: unchanged.
 *
 * 312. The grid the field is evaluated on. A square of 257 × 257 points
 *      centred on the rupture, wide enough to hold the outermost contour the
 *      product draws plus one cell. The count is fixed and the spacing
 *      therefore follows the earthquake: about 300 m for an Mw 5.5 and about
 *      12 km for Tōhoku, which is finer than the 2.5′ ground data in the first
 *      case and coarser in the second. Both are stated rather than hidden: a
 *      contour drawn on a 12 km grid cannot resolve a 5 km basin, and the round
 *      that needs it will say so and pay for it.
 *
 *      Contours are taken by marching squares with linear interpolation along
 *      each cell edge, which is what the field's own contouring does, and are
 *      emitted as closed rings — several per level where the ground breaks a
 *      level into pieces, which is exactly what a smooth stadium could not say.
 *
 * 313. THE TOLL DOES NOT MOVE IN THIS ROUND. `recordedTolls.ts` keeps counting
 *      inside the stadium it counts inside today. The picture will therefore
 *      show ragged contours while the dead are still counted on a smooth one:
 *      that is a DECLARED DEBT, written here on the day it is taken, and the
 *      next round closes it by summing population cell by cell over the field.
 *      It is declared rather than fixed in the same round because moving the
 *      toll moves every published figure of the calibration net at once, and a
 *      round that changes two things cannot say which one did it.
 *
 * 314. What decides this round.
 *      (a) THE AREA GETS CLOSER TO THE PUBLISHED AREA. On the six events of
 *          `SHAKEMAP_FOOTPRINTS`, the median ratio of our MMI VII area to the
 *          published ShakeMap's is closer to 1 with the field than it is with
 *          the single number, and no event's ratio moves further from 1 by
 *          more than a factor of 1.2 — a round that lifts the median by
 *          wrecking one event has not improved anything.
 *      (b) THE SHAPE GETS CLOSER TO SHAKEMAP'S SHAPE. On the same six, run
 *          as ShakeMap scenarios here with the same source and the same
 *          rupture, the intersection over union of our MMI VII footprint with
 *          ShakeMap's is larger with the field than with the single number, on
 *          the median and on at least four of the six.
 *      (c) It costs what a browser can pay: the Vs30 tiles stay under 8 MB in
 *          total and under 1 MB for any one tile a click loads — the same order
 *          as the population tiles already shipped, and loaded the same way,
 *          only the ones a footprint touches — and one field is evaluated in
 *          under 250 ms on this machine, measured and printed.
 *      (d) Rule 313 holds exactly: no toll, wave, replay or golden figure
 *          moves by one unit, and `docs/VALIDATION_REPORT.md` regenerates
 *          identical.
 *      (e) The release gate stays PASS in strict mode.
 *
 * 315. What is printed, whatever the outcome: for each of the six, the
 *      published MMI VII area, ours with the single number, ours with the
 *      field, both ratios, and the intersection over union against the
 *      ShakeMap scenario for both; the fraction of the field's cells that fell
 *      back for want of ground data, by event; the size of the tiles and the
 *      time one field takes; and every figure that moved, which rule 313 says
 *      is none.
 *
 * WHAT THESE RULES CANNOT SETTLE. Whether the site term is right: BSSA14's site
 * factor is a function of Vs30 alone, and a basin's response depends on its
 * depth as well — ShakeMap's own models take a basin depth this project does
 * not carry, so some of the raggedness of a published map will still be missing
 * from ours. Whether the slope proxy is right where no regional map was merged:
 * Allen & Wald themselves report it as a proxy and not a measurement. And the
 * amplitude gap is not promised closed by this round — only measured before and
 * after.
 */

/**
 * THE OUTCOME, measured on 20 September 2026. Rules 309 to 315 were pushed in
 * 8b744b5 and the candidate in 8d23afb, both before one area was measured.
 *
 * REFUSED on rule 314(a), and the refusal is not the whole of what was found.
 *
 * THE AREA, against the published ShakeMap of each event (MMI ≥ 7):
 *
 * | event      | published | one Vs30 |  field | ratio before | ratio after | step |
 * |------------|----------:|---------:|-------:|-------------:|------------:|-----:|
 * | Northridge |     2 824 |      319 |    646 |        0.113 |       0.229 | 0.2 km |
 * | L'Aquila   |        61 |      116 |    173 |        1.902 |       2.830 | 0.2 km |
 * | Amatrice   |        26 |      107 |    133 |        4.124 |       5.111 | 0.2 km |
 * | Gorkha     |    40 767 |   10 885 | 10 651 |        0.267 |       0.261 | 0.8 km |
 * | Tōhoku     |   199 742 |  243 942 | 270 032|        1.221 |       1.352 | 3.7 km |
 * | Kokoxili   |    51 427 |   11 850 | 16 732 |        0.230 |       0.325 | 1.0 km |
 *
 *   314(a) median ratio 0.744 → 0.839                      — closer to 1
 *   314(a) L'Aquila worsens by 1.49×, Amatrice by 1.24×     — OUTSIDE (1.2× bound)
 *   314(c) slowest field 30 ms against 250                  — inside
 *
 * THE SHAPE, against ShakeMap scenarios run here on the same source and the
 * same rupture, intersection over union of the MMI VII masks on a 0.02°
 * lattice:
 *
 * | event      | one Vs30 | field | better |
 * |------------|---------:|------:|--------|
 * | Northridge |    0.408 | 0.561 | yes    |
 * | L'Aquila   |    0.176 | 0.269 | yes    |
 * | Amatrice   |    0.178 | 0.248 | yes    |
 * | Gorkha     |    0.804 | 0.767 | NO     |
 * | Tōhoku     |    0.687 | 0.758 | yes    |
 * | Kokoxili   |    0.679 | 0.885 | yes    |
 *
 *   314(b) median 0.544 → 0.659, better on 5 of 6 against 4 — inside
 *
 * WHAT THIS MEANS, and it is worth more than the verdict. The ground is not
 * the cause of the area gap, and the measurement says so in one line: the gap
 * DOES NOT HAVE ONE SIGN. Northridge is 0.11 of its published area, Kokoxili
 * 0.23, Gorkha 0.27 — and L'Aquila is 1.9, Amatrice 4.1, Tōhoku 1.2. The field
 * amplifies, because real ground is softer than the 760 m/s rock the harness
 * runs on nearly everywhere people live, so it enlarges every footprint. That
 * closes the three that were too small and opens the three that were too large.
 * No multiplicative correction can close a gap that points both ways, and the
 * ground is a multiplicative correction.
 *
 * So the area gap at Mw 6.2 to 6.3 is a defect of the CONTOUR LAW at moderate
 * magnitudes, not of the site term, and that is a different block with a
 * different reference. Rule 314(a) is what caught it, and it caught it by
 * refusing a round whose median improved — which is exactly what the clause was
 * written for.
 *
 * AND THE SHAPE IS A SEPARATE FINDING, measured against the field's own program
 * and not against our own idea of a shape: with the ground under every point,
 * our MMI VII mask agrees with ShakeMap's on five of six events, by a median
 * intersection over union of 0.659 against 0.544. At Kokoxili it goes from
 * 0.679 to 0.885. The one that does not improve is Gorkha, and for a reason
 * that is not a flaw: the Himalaya is rock, our field reads it as rock, the
 * footprint contracts — while the ShakeMap scenario it is compared against ran
 * on its configuration's DEFAULT Vs30 and not on the real ground, because that
 * installation carries a Californian Vs30 grid and nothing else (rule 308(c)).
 * On that one event the comparison is measuring the reference's own missing
 * ground.
 *
 * WHAT WAS NOT DONE. Rule 314(d) and (e) are untested here because nothing was
 * wired: the toll still counts inside the stadium (rule 313) and no published
 * figure moved. Nothing is adopted. The field, its reader and its tiles stay in
 * the tree, measured and refused, for whichever round takes up the contour law.
 *
 * A DEFECT IN THE HARNESS, found between the first run and this table, recorded
 * because the first numbers were printed and were incomplete: the benchmark
 * matched an event to its epicentre by name, and the fixture calls one event
 * "Gorkha 2015" where the net calls it "Gorkha (Nepal) 2015". Two of the six
 * were silently dropped, and the median over the remaining four read 1.562 →
 * 2.091 — the opposite verdict on that clause. The matching is now by preset.
 * The candidate was not touched; only the rows it was measured on were
 * completed.
 */
export const SHAKING_FIELD_CANDIDATE =
  'REFUSED 20 September 2026 on rule 314(a): with the ground under every point the median area ratio improves (0.744 \u2192 0.839) but L\u2019Aquila worsens by 1.49\u00d7 and Amatrice by 1.24\u00d7, past the 1.2\u00d7 bound. The reason is that the area gap has no single sign \u2014 three events are at a fifth of their published area and three at one to four times it \u2014 and the ground is a multiplicative correction, which cannot close a gap that points both ways. The shape, separately, DOES improve: against ShakeMap scenarios run here, the median intersection over union goes 0.544 \u2192 0.659 and five of six improve. The area gap at moderate magnitude belongs to the contour law, not to the site term.';

/**
 * READ AFTER THE RUN, 20 September 2026, and it changes what rule 314(a) was
 * measuring. Declared as read after, under the protocol's fourth rule.
 *
 * The amendment of 16 September says a validation bar is worth what the
 * reference reaches on the same rows. Rule 314(a) was not asked that question
 * before it was written, and the answer was available: ShakeMap runs here, so
 * the same six scenarios that rule 314(b) needed could also be summed against
 * the same published areas. They were, with
 * `scripts/benchmark/area-against-scenario.ts`:
 *
 * | event      | published | ShakeMap, no stations | the REFERENCE's ratio | ours (field) | ours / reference |
 * |------------|----------:|----------------------:|----------------------:|-------------:|-----------------:|
 * | Northridge |     2 824 |                   778 |                  0.28 |         0.23 |             0.83 |
 * | L'Aquila   |        61 |                   675 |                 11.06 |         2.83 |             0.26 |
 * | Amatrice   |        26 |                   573 |                 22.03 |         5.11 |             0.23 |
 * | Gorkha     |    40 767 |                13 562 |                  0.33 |         0.26 |             0.79 |
 * | Tōhoku     |   199 742 |               354 521 |                  1.77 |         1.35 |             0.76 |
 * | Kokoxili   |    51 427 |                17 699 |                  0.34 |         0.33 |             0.95 |
 *
 * THE REFERENCE MISSES THE PUBLISHED AREA BY UP TO A FACTOR OF TWENTY-TWO. Not
 * because ShakeMap is wrong — because a published ShakeMap of an Italian
 * earthquake is drawn with a dense network of stations and thousands of felt
 * reports, which pull the MMI VII contour in to the few tens of square
 * kilometres that actually reached it, and a scenario with no stations cannot
 * know that. Rule 314(a) therefore measured, in large part, THE ABSENCE OF
 * STATIONS, and it refused a round for missing a bar that the field's own
 * program misses by more.
 *
 * Against the reference on the same rows, our footprint with the ground under
 * every point is 0.77 of its area at the median (0.23 to 0.95), and with the
 * single Vs30 it was 0.53. So the ground moves us TOWARDS the reference on the
 * anchored comparison while it moved us away on the unanchored one.
 *
 * THE VERDICT ABOVE IS NOT CHANGED BY THIS, and that matters: rule 293 forbids
 * moving a bound after a measurement, and this is a bound being shown to have
 * been the wrong bound, which is not a licence to re-score the round that
 * already failed it. The candidate stands refused under rule 314(a) as written.
 * What follows from this is a NEW round with an anchored bar and rows that have
 * not been read — rules 316 and after — and the six events above are spent:
 * they were read here and cannot be held out again.
 */
/** Rule 310: the grid rule 309 stands on. */
export const USGS_VS30 = {
  name: 'USGS global Vs30',
  source: 'global_vs30.grd',
  url: 'https://apps.usgs.gov/shakemap_geodata/vs30/global_vs30.grd',
  citation:
    'Allen, T. I. & Wald, D. J. (2009). "On the use of high-resolution topographic data as a proxy for seismic site conditions (VS30)." Bulletin of the Seismological Society of America 99(2A), 935–943.',
  licence: 'public domain (U.S. Geological Survey)',
  /** The regional maps merged into the proxy. */
  regionalMaps: ['California', 'Washington and Oregon', 'Utah', 'Japan', 'Taiwan'],
  /** Where the grid itself stops. */
  coverage: { minLatitude: -56, maxLatitude: 84, atSea: false },
} as const;

/** Rule 310: the lattice the tiles carry, which is the population's. */
export const VS30_CELL_DEG = 2.5 / 60;

/** Rule 312: the side of the square the field is evaluated on. Odd, so that a
 *  point sits on the epicentre. */
export const FIELD_GRID_POINTS = 257;

/** Rule 314(c): what a reader's browser may pay for the ground. */
export const VS30_DATA_BUDGET = { totalBytes: 8_000_000, perTileBytes: 1_000_000 } as const;

/** Rule 314(c): and what it may pay in time, for one field. */
export const FIELD_BUDGET_MS = 250;

/** Rule 314(a): a ratio may not move this much further from one. */
export const WORST_RATIO_REGRESSION = 1.2;

/** Rule 314(b): the shape must improve on at least this many of the six. */
export const SHAPE_MINIMUM_IMPROVED = 4;

/** Where a cell's Vs30 came from, which rule 310 says is never silent. */
export type Vs30Provenance = 'grid' | 'slope' | 'rock';
