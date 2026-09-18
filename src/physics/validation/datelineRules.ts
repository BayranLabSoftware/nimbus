/**
 * The wall at the antimeridian.
 *
 * The globe prints hour lines across an ocean, and on 18 September 2026 the
 * audit of `scripts/benchmark/globe-audit.ts` sampled the solver's own arrival
 * field under every vertex of every one of them. They agree everywhere but in
 * one place: two scenarios, independently, put a single vertex of their "+8 h"
 * line — one of 199, one of 186 — at longitude −180.00 exactly, where the field
 * says forty hours.
 *
 * The drawing is not the defect. `tsunami/fastMarching.ts` walks its
 * neighbours with `j + 1 < nLon` and `j - 1 >= 0`: the planetary raster is a
 * wall at ±180°, and a front reaches the other side only by going the long way
 * round the globe. On a uniform ocean of 4 000 m with the source at 0°N 170°E
 * the model reads 1.41 h at 179°E, against the 1.40 the arc gives, and
 * **30.31 h at 179°W against 1.72**. Two degrees of longitude, thirty hours.
 * The stray vertex is the same thing seen from the picture: the field is
 * discontinuous along the seam, so the contour extractor finds a crossing
 * there that is not a front.
 *
 * Every trans-Pacific arrival the product computes is affected — Tōhoku to
 * Hawaii, Chile to Japan, the two paths the field was built for — and so is
 * anything that propagates on it, the run-up rule of rules 102 to 105
 * included.
 *
 * **These rules are written before the round is run, and before it is
 * approved.** Nothing here has been measured against any set; no candidate has
 * been built. They exist so that whoever runs it — and the last word on when is
 * Andrea's, because reading the run-up set again means fetching the planetary
 * mosaic tile by tile, which is a download — runs it against a bar that was
 * fixed beforehand.
 *
 * The rules, fixed on 18 September 2026 and numbered after the hundred and
 * ninety-six before them:
 *
 *  197. **What was looked at.** The isochrone reading of the globe audit, the
 *       neighbour walk of `tsunami/fastMarching.ts`, and one reproduction that
 *       needs no network: `computeTsunamiArrivalField` on an all-ocean global
 *       grid of 4 000 m, source at 0°N 170°E, read at five longitudes east of
 *       it. No recorded wave and no run-up observation has been compared with
 *       a model number for this round.
 *
 *  198. **The candidate (`wrapInLongitude`).** When a grid spans the whole
 *       globe, the march's east neighbour of the last column is the first
 *       column and the west neighbour of the first is the last, so the front
 *       crosses the seam as it crosses any other meridian. A grid that does
 *       not span the globe — every local tile — is untouched, and the test of
 *       "spans the globe" is the grid's own bounds, not a guess:
 *       {@link spansTheGlobe}. Where the two edge columns are the same
 *       meridian, the wrap steps over the duplicate rather than through it,
 *       so the spacing at the seam is the spacing everywhere else.
 *
 *  199. **What decides.** The wall is not a candidate to be scored: a wave
 *       that takes thirty hours to travel two degrees is wrong whatever a set
 *       says. What the guards decide is that the cure is the cure and costs
 *       nothing else:
 *       (a) on the uniform ocean of rule 197, every reading east of the source
 *           is within {@link UNIFORM_OCEAN_TOLERANCE} of the arc over the
 *           celerity, on both sides of the seam;
 *       (b) no scenario whose front never reaches the seam moves at all — the
 *           arrival field is identical, cell for cell, on a local tile and on
 *           a global raster the front does not cross;
 *       (c) the release gate stays PASS, the suite stays green, and no number
 *           of `docs/VALIDATION_REPORT.json` moves, because the report
 *           propagates on local grids and never on the planetary mosaic;
 *       (d) the globe audit's isochrone reading comes back with no vertex off
 *           its own hour, the seam included.
 *
 *  200. **What must be read again, and what that costs.** The run-up rule
 *       (rules 102 to 105) propagates every one of its events on the planetary
 *       mosaic, so its bias and σ are a reading taken through this wall. After
 *       the fix they must be read again and **declared whichever way they
 *       fall** — a defect fix is not an improvement claim, and rule 5 forbids
 *       tuning on a set that has been read. That reading needs the mosaic
 *       fetched tile by tile: it is a download, it is Andrea's to authorise,
 *       and until it happens the standing figures of T2 carry a note saying
 *       which side of this fix they come from.
 *
 *  201. **What these rules cannot settle.** Two things.
 *       - Whether a raster is the right shape for a planet at all. Wrapping
 *         the longitude closes the seam; it does not close the poles, where
 *         the same walk meets `i - 1 >= 0` and `i + 1 < nLat` and a front that
 *         should pass over the Arctic stops at 85°. The audit's own reading is
 *         silent there because no isochrone of the thirty scenarios reaches
 *         it.
 *       - How much of the run-up rule's scatter was this. The set's events are
 *         mostly Pacific, and a wall down the middle of the Pacific is the
 *         kind of thing that lands in σ rather than in bias; but which part
 *         was the wall and which part is the coast is not something a
 *         before-and-after on one set can separate.
 */

/*
 * ===========================================================================
 * The outcome of rules 197 to 201, 18 September 2026: DONE
 * ===========================================================================
 *
 * The rules were pushed in `e6a6e0d`, before anything was measured. Andrea
 * authorised the download the reading needed; it turned out not to be needed
 * at all — the sixteen planetary tiles were still in the cache from an earlier
 * session, and both run-up readings below touched no network.
 *
 * The cure. `spansTheGlobe` decides whether a raster wraps, and on one that
 * does, the march steps over the seam as over any other meridian. It lives in
 * `tsunami/fastMarching.ts` and not in this file, which is a correction to
 * rule 198: a physics module has no business importing a validation one, and
 * one definition read from both places was the point.
 *
 * It took two cuts. The first closed the seam, and guard (d) then caught what
 * was left: the hour line at −180° still sat 2.4 minutes off its own hour,
 * because the raster holds its edge meridian twice and the two columns had
 * marched there from opposite sides. They are one place, so finalising one now
 * finalises the other. After that the two columns agree to a hundredth of a
 * second and the uniform ocean reads a flat 0.28 % everywhere — the marcher's
 * own discretisation, the same on both sides of the dateline. A guard that
 * finds the second defect after the first is fixed is a guard doing its job,
 * and it is recorded rather than smoothed over.
 *
 * The guards.
 * (a) The uniform ocean of rule 197: 175°E 1.0028×, 179°E 1.0028×, 179°W
 *     1.0028×, 170°W 1.0028×, 150°W 1.0028×. Where the wall stood, 179°W read
 *     30.31 h against an arc of 1.72; it reads 1.720.
 * (b) A front that never reaches the seam moves not one cell. Of the 64 events
 *     of the run-up set, 27 — every Atlantic, Mediterranean and Indian-Ocean
 *     one — come back within a thousandth of where they were. The ones that
 *     move are Pacific without exception: Andreanof ×2.02, the Rat Islands
 *     ×1.36, the Kurils ×1.69, Kamchatka ×1.33, Vanuatu ×1.74, Japan ×1.45,
 *     the South American coast ×1.30. A local tile is untouched by
 *     construction: `spansTheGlobe` is false and nothing wraps.
 * (c) The suite is green and no number of `docs/VALIDATION_REPORT.json` moves:
 *     the report propagates on local grids and never on the planetary mosaic.
 * (d) The globe audit comes back with no vertex off its own hour — the seam
 *     included, where the worst vertex now reads 8.00 h on an 8 h line.
 *
 * The re-reading of T2 (rule 200), declared whichever way it falls, and it
 * falls the wrong way:
 *
 *                      bias      σ_ln     within ×2
 *   through the wall   3.162×    1.365      23 %
 *   with it closed     3.685×    1.354      22 %
 *
 * over the same 2 468 bins, 64 events and 5 602 observations. T2 was not met
 * before and is not met after; what changed is that the model now
 * over-predicts a coastal run-up by a factor of 3.7 where it over-predicted by
 * 3.2.
 *
 * That is worth saying plainly, because it is the interesting part: **the wall
 * was cancelling part of an error the model already had.** A wave that reached
 * a far Pacific coast the long way round the globe had spread over a far
 * longer path and arrived smaller, which flattered a model that runs high. The
 * fix removes a cancellation, not an accuracy: the arrival times are right now
 * where they were absurd, and the heights are as wrong as they always were,
 * one sixth more visibly. The run-up over-prediction is T2's own open problem
 * (docs/GOLD_STANDARD.md, 16 September), and rule 5 forbids touching it on a
 * set that has been read.
 *
 * What stays open: the poles, which rule 201 named and this round does not
 * touch. The march still stops a front at 85°, and no isochrone of the thirty
 * scenarios reaches far enough to show it. It was measured afterwards rather
 * than left as a worry: on the same uniform ocean, a front from 80°N 0° reaches
 * 80°N 180° in 3.54 h where a path straight over the pole would take 3.12 —
 * **1.1×**, not the 17.7× the dateline cost, because the raster reaches to 85°
 * and the front simply goes round inside that band. The cap it cannot enter at
 * all is 0.38 % of the Earth's surface, and it is under permanent ice. The
 * limitation is real and it is small; saying which is the point of measuring
 * it.
 */

/** Rule 198: a grid spans the globe when its longitude bounds cover 360°,
 *  within a cell. It is the solver's own function, re-exported here so the
 *  rule names the thing that decides rather than a copy of it — the copy is
 *  what B-053 was made of. */
export { spansTheGlobe } from '../tsunami/fastMarching.js';

/** Rule 199 (a): how far a uniform-ocean arrival may sit from the arc over
 *  the celerity. The march is first-order and walks a lat–lon raster, so it
 *  cannot be exact; a tenth is the accuracy the same reading already shows
 *  well away from the seam. */
export const UNIFORM_OCEAN_TOLERANCE = 0.1;

/** Rule 197's reproduction, as numbers: the source, and the longitudes read
 *  east of it. The two past the dateline are the ones the wall answers
 *  wrongly today — 17.7× and 9.7× late. */
export const UNIFORM_OCEAN_PROBE = {
  sourceLatitude: 0,
  sourceLongitude: 170,
  depthM: 4_000,
  readAtLongitudes: [175, 179, -179, -170, -150] as const,
  /** What the model said on 18 September 2026, before any fix (hours). */
  before: [0.78, 1.41, 30.31, 30.19, 29.92] as const,
  /** The arc over √(g·h), for the same points (hours). */
  arc: [0.78, 1.4, 1.72, 3.12, 6.24] as const,
} as const;
