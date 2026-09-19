/**
 * The bar the reference can reach, and the footprint measured against it.
 *
 * WHY THIS ROUND EXISTS. Rule 314(a) held our MMI VII area against the
 * PUBLISHED ShakeMap of six events and refused the field for missing it. Read
 * after that run, with the scenarios already on disk: ShakeMap itself, run the
 * way we are run — one source, one rupture, no stations, no felt reports —
 * misses those same published areas by 0.28 at Northridge and by TWENTY-TWO at
 * Amatrice. A published ShakeMap of an Italian earthquake is pulled in to a few
 * tens of square kilometres by a dense network and thousands of felt reports;
 * no blind model can know that, and the field's own program does not.
 *
 * So rule 314(a) measured, for the most part, the absence of stations. The
 * amendment of 16 September 2026 says exactly what to do about a bar like
 * that: anchor it to what the reference reaches on the same rows. That is this
 * round, and it is run on rows nobody here has read, because the six of rule
 * 314 are spent.
 *
 * WHAT WAS LOOKED AT before these rules were fixed: the six spent events and
 * everything measured on them (rules 309 to 315 and their outcome); that
 * ShakeMap runs here and how long it takes; the fields of `UNSEEN_EARTHQUAKES`
 * — its 809 rows, their columns, and how many pass the filter of rule 317
 * (152), band by band (0, 93, 53, 6). NOT looked at: the published area, the
 * peak intensity or the toll of any of the twelve rows of rule 317, and no
 * scenario has been run for any of them.
 *
 * 316. THE REFERENCE, and why it is not the published map. ShakeMap 4 in
 *      scenario mode, run on this machine, on the same source and the same
 *      finite rupture we draw: same magnitude, same depth, same mechanism, same
 *      length and width, same strike — the strike rules 295 to 303 find, and
 *      due north where they find none, given to BOTH so that the comparison is
 *      of footprints and not of orientations. Its version, configuration and
 *      ground-motion model set are recorded with the result.
 *
 *      The published map is still printed beside it, because the distance
 *      between the two is a real quantity — it is what stations are worth — but
 *      no clause of rule 319 is decided on it.
 *
 * 317. THE ROWS, fixed here and named, from `UNSEEN_EARTHQUAKES` — the set
 *      built for rule 23 and never scored on a footprint. The filter: a
 *      published ShakeMap with a non-zero MMI VII area, a depth under 70 km
 *      (the field touches the shallow branch), and Mw 5.5 or more; then the
 *      first four by ComCat identifier in each of the magnitude bands
 *      5.5–6.0, 6.0–6.5, 6.5–7.0 and 7.0 and over. The first band is empty and
 *      the last holds six, so the set is twelve:
 *
 *        hv72748782  Mw 6.2, 35 km — 27 km SSE of Naalehu, Hawaii
 *        us100048hc  Mw 6.1, 14 km — 37 km N of Tarakan, Indonesia
 *        us10008mgu  Mw 6.3,  3 km — 48 km NW of Mosquito Lake, Alaska
 *        us20005e01  Mw 6.2,  6 km — 119 km NE of Angoram, Papua New Guinea
 *        nn00725272  Mw 6.5,  3 km — Monte Cristo Range, Nevada
 *        us10002bpw  Mw 6.8, 10 km — 159 km ESE of Kirakira, Solomon Islands
 *        us100031me  Mw 6.5,  6 km — 177 km SE of Gizo, Solomon Islands
 *        us10003x9g  Mw 6.9, 10 km — 85 km NW of Coquimbo, Chile
 *        us6000rsy1  Mw 7.0, 10 km — Hubbard Glacier, Alaska, 2025
 *        us7000j2yw  Mw 7.0, 29 km — 23 km WNW of Port-Olry, Vanuatu
 *        us7000j553  Mw 7.0, 30 km — 156 km NW of Tobelo, Indonesia
 *        us7000l9h4  Mw 7.1,  6 km — Banda Sea
 *
 *      They span Mw 6.1 to 7.1 and no further: the great earthquakes are in the
 *      six already spent, and this set does not speak for them. Said here
 *      rather than discovered later.
 *
 * 318. WHAT IS MEASURED, twice for each row — once with the single Vs30 the
 *      simulator runs on today, once with rule 310's ground at every point, and
 *      nothing else different:
 *      (a) the ratio of our MMI VII area to the REFERENCE's, on the same row;
 *      (b) the intersection over union of the two MMI VII masks, on one 0.02°
 *          lattice, as rule 308 computes it;
 *      (c) beside them, for the record and for no clause: the same two against
 *          the published map.
 *
 * 319. WHAT DECIDES whether the field is adopted.
 *      (a) The median of (a) is closer to 1 with the field than without it.
 *      (b) The median of (b) is larger with the field than without it, and it
 *          is larger on at least eight of the twelve.
 *      (c) No row's area ratio moves further from 1 by more than a factor of
 *          1.2 — the clause of rule 314(a), kept word for word, because it is a
 *          good clause that was pointed at the wrong quantity.
 *      (d) Nothing else moves: no toll, no wave, no replay, no golden figure,
 *          and `docs/VALIDATION_REPORT.md` regenerates identical. The toll
 *          keeps counting inside the stadium (rule 313's debt stands).
 *      (e) The release gate stays PASS in strict mode.
 *
 * 320. WHAT THIS ROUND MAY NOT DO. It may not touch the ground-motion model,
 *      the contour law, the rupture geometry or the strike. It decides ONE
 *      thing: whether the site term is read at every point or once. If the
 *      field is refused again under an anchored bar, the defect is in the law
 *      and the next round is the law's; if it is adopted, the residual gap to
 *      the reference is the law's too, and it is then stated in the same
 *      breath and left to that round.
 *
 * 321. WHAT IS PRINTED, whatever the outcome: for each of the twelve, the
 *      reference's area and ours both ways, both ratios, both agreements, the
 *      published area beside them, the strike used and where it came from, the
 *      share of field cells that fell back for want of ground data, and the
 *      time one field took; then the three medians and the clause each decides.
 *
 * WHAT THIS CANNOT SETTLE. Whether ShakeMap's scenario mode is right — it is
 * the reference, not the truth, and on the one Italian-style row (Nevada) it
 * will be as blind as we are. Whether twelve rows of Mw 6.1 to 7.1 say anything
 * about a Mw 9. And the amplitude of the ground motion itself, which is a
 * different debt in a different block: this round moves the site term to every
 * point and nothing else.
 */

/**
 * THE OUTCOME, measured on 20 September 2026 with ShakeMap 4 (`shakemap-modules`
 * 1.2.4, `esi-shakelib` 1.2.6), its own test configuration, gmpe
 * `active_crustal_nshmp2014`, gmice WGRW12, ipe AllenEtAl2012, no stations.
 * Rules 316 to 321 were pushed in dd071fe and the harness in the commit after
 * it, both before one scenario was run.
 *
 * THE FIELD IS ADOPTED: rule 319 (a), (b) and (c) are all inside.
 *
 * | row (Mw)                        | reference km² | one Vs30 | field | ratio before | ratio after | IoU before | IoU after |
 * |---------------------------------|--------------:|---------:|------:|-------------:|------------:|-----------:|----------:|
 * | Mosquito Lake, Alaska (6.3)     |           952 |      258 |   293 |         0.27 |        0.31 |      0.272 |     0.308 |
 * | Angoram, Papua New Guinea (6.2) |           592 |      222 |   321 |         0.37 |        0.54 |      0.375 |     0.542 |
 * | Monte Cristo Range, Nevada (6.5)|         1 419 |      280 |   599 |         0.20 |        0.42 |      0.197 |     0.422 |
 * | Kirakira, Solomon Islands (6.8) |         2 087 |      388 |   558 |         0.19 |        0.27 |      0.186 |     0.267 |
 * | Gizo, Solomon Islands (6.5)     |         1 230 |      288 |   415 |         0.23 |        0.34 |      0.234 |     0.337 |
 * | Coquimbo, Chile (6.9)           |         2 651 |      383 |   551 |         0.14 |        0.21 |      0.144 |     0.208 |
 * | Hubbard Glacier, Alaska (7.0)   |         3 305 |      419 |   561 |         0.13 |        0.17 |      0.127 |     0.170 |
 * | Banda Sea (7.1)                 |         4 807 |      506 |   727 |         0.11 |        0.15 |      0.105 |     0.151 |
 *
 *   319(a) median ratio 0.192 → 0.288                  — inside, closer to 1
 *   319(b) median IoU 0.192 → 0.288, better on 8 of 8  — inside
 *   319(c) no row worsens at all                       — inside
 *
 * FOUR OF THE TWELVE COULD NOT BE DECIDED, and the clause that asked for eight
 * therefore passed with NO MARGIN AT ALL: on Naalehu (Mw 6.2 at 35 km), Tarakan
 * (6.1), Port-Olry (7.0) and Tobelo (7.0) the reference's own scenario never
 * reaches MMI VII, so there is no reference footprint to compare against.
 * Rule 317's filter required a published MMI VII area and could not require
 * what a scenario would produce, which is only knowable by running it. Eight of
 * eight improved, so the clause is met as written; had one of the eight gone
 * the other way it would have failed for want of rows rather than for want of
 * quality. Said here because a bar met with no margin is not the same as a bar
 * met, and the next set of rows should filter on the reference and not only on
 * the published map.
 *
 * WHAT THE NUMBERS SAY BEYOND THE VERDICT, and it is the finding that matters.
 * AGAINST THE REFERENCE WITH THE SAME INFORMATION — same source, same rupture,
 * same strike, no stations for either — OUR MMI VII FOOTPRINT IS BETWEEN A
 * NINTH AND A HALF OF ITS AREA, and 0.29 of it at the median even with the
 * ground under every point. On the six larger events read earlier the same
 * ratio was 0.77. So the gap is real, it is not the absence of stations, and it
 * widens as the magnitude falls: this is the contour law at Mw 6 to 7, measured
 * against a reference that can be run again whenever it is needed.
 *
 * That is the next round, and it now has a bar that the reference reaches by
 * construction, rows that can be generated without a download, and a number to
 * beat: 0.288.
 *
 * A BREAK IN THE PROTOCOL, recorded because it happened. The rules were pushed
 * before the round (dd071fe) and the harness was written before it — but the
 * harness's own commit FAILED on a lint error, in a command launched in the
 * background whose result was not read, and it went unnoticed until after the
 * measurement. So `scripts/benchmark/anchored-footprint.ts` is pushed after the
 * numbers it produced, not before. The file was not edited between the run and
 * that push except to satisfy the linter, and the comparison was rerun
 * afterwards to the same three verdicts and the same medians to the third
 * decimal. The bars, which are what a reader must be able to check were fixed
 * in advance, were pushed in advance. The timing proof of the harness was not,
 * and no wording here can put it back.
 *
 * WHAT DID NOT MOVE, checked and not assumed: the full suite is green (232
 * files), nothing is wired into the globe or the toll, rule 313's debt stands,
 * and `docs/VALIDATION_REPORT.md` is untouched.
 */
export const ANCHORED_FOOTPRINT_OUTCOME =
  'ADOPTED 20 September 2026 under rules 319(a), (b) and (c): with Slab2\u2019s strike and the USGS ground under every point, our MMI VII area goes from 0.192 to 0.288 of the reference\u2019s and the shape from 0.192 to 0.288 in intersection over union, better on all eight decidable rows of twelve. Four rows could not be decided \u2014 the reference\u2019s own scenario never reaches MMI VII there \u2014 so the eight-of-twelve clause passed with no margin, and that is recorded. The finding beyond the verdict: against a reference with the same information our footprint is between a ninth and a half of its area, 0.29 at the median, where on six larger events it was 0.77. The residual gap is the contour law at Mw 6 to 7.';

/** Rule 317: the rows, by ComCat identifier, in the order the filter picked
 *  them. Named here so that a reader can check the set was not chosen after
 *  the numbers were seen. */
export const ANCHORED_ROWS: readonly string[] = [
  'hv72748782',
  'us100048hc',
  'us10008mgu',
  'us20005e01',
  'nn00725272',
  'us10002bpw',
  'us100031me',
  'us10003x9g',
  'us6000rsy1',
  'us7000j2yw',
  'us7000j553',
  'us7000l9h4',
];

/** Rule 317: the filter that picked them, kept so the choice can be rerun. */
export const ANCHORED_FILTER = {
  set: 'UNSEEN_EARTHQUAKES',
  minimumMagnitude: 5.5,
  maximumDepthKm: 70,
  requiresPublishedMmi7: true,
  bands: [
    [5.5, 6.0],
    [6.0, 6.5],
    [6.5, 7.0],
    [7.0, 10],
  ],
  perBand: 4,
  orderedBy: 'comcat identifier, ascending',
} as const;

/** Rule 319(b): the shape must improve on at least this many of the twelve. */
export const ANCHORED_SHAPE_MINIMUM = 8;

/** Rule 319(c): rule 314(a)'s clause, kept word for word. */
export const ANCHORED_WORST_REGRESSION = 1.2;

/** Rule 316: the intensity the footprints are compared at. */
export const ANCHORED_LEVEL = 7;
