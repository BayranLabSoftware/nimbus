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
