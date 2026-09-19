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
