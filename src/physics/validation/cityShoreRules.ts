/**
 * Near a city the shore search gives up before it reaches the sea.
 *
 * Found on 22 September 2026 in the audit Andrea asked for (ROADMAP IMP-7f).
 * An impact on ground is handed the nearest sea a wave could cross by
 * `nearestSeaForImpact`, which asks the fine tile first and the planetary
 * mosaic only where the tile has no answer (rules 241 to 247). On the tile,
 * `findPropagationSeeds` keeps the six nearest water cells of each compass
 * sector and accepts the first that belongs to a body of 200 cells and whose
 * own position the mosaic, within one of its cells, calls sea. Near a city
 * both tests fail the sea.
 *
 * Measured at Tokyo, 35.68° N, 139.69° E, before these rules were written and
 * therefore not held out. The six nearest water cells of the eastern sector
 * are canals, a river and single cells the terrain reads 108 to 121 m deep in
 * the middle of the city — none in a body of 200 cells — and the first that is
 * lies at 12.9 km, beyond the six. In the south-eastern sector the sixth,
 * at 12.6 km in Tokyo Bay, is in a body of 1 907 cells; but the mosaic's cells
 * are 18.5 by 31.8 km there and average the bay with the city, and at the
 * bay's northern shore they read 36 to 39 m above the sea, 20 to 29 m at the
 * lowest within one cell: the bay is refused as a lake would be. Of those
 * 1 907 cells the mosaic does call 404 sea, the bay's southern part, and the
 * body runs out of the tile. The tile gives no answer; the mosaic's nearest
 * sea is at 41.1 km, and a 1 km stone on Tokyo is handed a shore more than
 * three times farther than the bay. At New Orleans no sector of the tile holds
 * a body of 200 cells at all — its water is bayous, canals and districts
 * below the sea — and the answer is the mosaic's, which these rules do not
 * touch.
 *
 * The rules, fixed on 22 September 2026, before the candidate was written, and
 * numbered after the eight hundred and eleven before them:
 *
 * 812. The candidate, for an impact's shore search only. (a) In each sector
 *      the nearest water cell that passes is taken, however many nearer ones
 *      fail, instead of the first of the six nearest. (b) The mosaic vouches
 *      for a body, not a cell: a tile cell counts as sea when the mosaic,
 *      within one of its cells, calls sea any cell of the connected body it
 *      belongs to. The depth floor of 1 m, the body of 200 cells, the
 *      mosaic's neighbourhood of one cell, the mosaic's own search where the
 *      tile has no answer, and the floor of half a cell are unchanged.
 *
 * 813. What is not in the candidate. A polder of 200 cells below the sea that
 *      the mosaic calls sea anywhere is taken for sea, as it could be before
 *      wherever the mosaic vouched for its own cells (rule 799(c)); a lake shown
 *      by its surface stays land; the explosion path keeps the search as it is
 *      (one module at a time); the propagation's own seed search, for the
 *      wave's march, is not changed.
 *
 * 814. What decides.
 *      (a) Exact, on maps made for the purpose: a bay narrower than a mosaic
 *          cell, open to water the mosaic calls sea, is found; a lake the
 *          mosaic calls sea nowhere is not; a sector whose nearest six water
 *          cells are ponds still finds the sea behind them.
 *      (b) Tokyo reads a shore between 8 and 16 km: the bay's northern shore
 *          lies about ten kilometres from the point, beyond the city's canals.
 *      (c) Rules 243 and 250(b)'s four points — Miami, Lisbon, Madrid and
 *          Kansas City — stay inside their bounds.
 *      (d) New Orleans keeps its answer: its tile holds no body of 200 cells.
 *      (e) An impact in the sea, and every explosion, are unchanged to the
 *          bit.
 *      (f) The release gate stays PASS, and the validation report is
 *          regenerated once.
 *      Any of these failing refuses the candidate.
 *
 * 815. What is printed. For Tokyo, New Orleans, Miami, Lisbon, Madrid, Kansas
 *      City, San Francisco and Rio de Janeiro: the shore's distance and depth
 *      before and after, and which map answered; for a 1 km and a 3 km stone
 *      on Tokyo, whether the crater reaches the sea, the source and the
 *      drowned, before and after.
 *
 * 816. What an adoption does. The registry takes the row; the terrain
 *      artefact the gate reads is regenerated; the methodology entry of the
 *      sea search says how a body is vouched for.
 *
 * 817. What is not touched. The tile and the mosaic, their floors and their
 *      body sizes; the crater's water of rule 798; the wave's laws; the
 *      propagation's seeds (rules 805 to 811).
 *
 * 818. What may not happen. No constant is introduced or changed. If a coast
 *      moves nearer and a wave appears where there was none, or a toll moves,
 *      that is the result.
 */

/**
 * The outcome of the round, written after the candidate was measured, on
 * 22 September 2026. The rules above were pushed in commit 4044331 before the
 * candidate was written.
 *
 * ADOPTED. Rule 814 holds on every clause.
 *
 * (a) On made maps a bay 0.2° wide, narrower than the mosaic's half-degree
 *     cells and open to the sea the mosaic sees, is found at its own 33 km
 *     where the search of before went to the mosaic, past 100 km; a lake the
 *     mosaic calls sea nowhere is still refused; the sea 40 km behind eight
 *     ponds of one cell is found.
 * (b) Tokyo reads 12.59 km, 1.57 m deep: Tokyo Bay, inside the 8 to 16 km the
 *     rule fixed. It read 41.07 km, 15.85 m, the mosaic's.
 * (c) Miami 5.06 km, Lisbon 3.47 km, Madrid 331.87 km and Kansas City
 *     1 033.62 km are unchanged, inside their bounds.
 * (d) New Orleans is unchanged, 9.24 km and 1.17 m: its tile still has no
 *     body of 200 cells, and the mosaic still answers.
 * (e) The explosion path does not ask for the city shore, and the search
 *     with no options is the search of before (tested).
 * (f) See the commit that adopts this.
 *
 * Rule 815's table, read on the running app with the function in both of its
 * modes on the same maps:
 *
 *                     before                 after
 *   Tokyo             41.07 km, 15.85 m      12.59 km, 1.57 m   (the bay)
 *   San Francisco     59.07 km, 142.3 m       3.26 km, 5.0 m    (the bay)
 *   New Orleans        9.24 km, 1.17 m       unchanged
 *   Miami              5.06 km, 4.16 m       unchanged
 *   Lisbon             3.47 km, 2.66 m       unchanged
 *   Madrid           331.87 km, 36.76 m      unchanged
 *   Kansas City     1033.62 km, 2.1 m        unchanged
 *   Rio de Janeiro     1.20 km, 1.75 m       unchanged
 *
 *   On Tokyo a 1 km stone's crater (5.5 km) reaches neither shore; a 3 km
 *   stone's (13.0 km) did not reach the mosaic's and now reaches the bay,
 *   with a wave of 6 mm at the source and no one drowned. On San Francisco a
 *   1 km stone now reaches the bay, 0.74 m at the source, where it raised no
 *   wave.
 *
 * What it means. Two of the eight cities were handed a shore on the far side
 * of the city, or out in the ocean, because their bay was narrower than a
 * cell of the planetary map; they now read their bay, a few metres deep, and
 * the waves an impact raises in it are small, as rule 798 said they would
 * be. Rule 813 stands: a polder the mosaic calls sea anywhere can pass for
 * sea, and a lake shown by its surface is still land.
 */
export const CITY_SHORE_OUTCOME =
  'ADOPTED 22 September 2026: an impact’s shore search tries every water cell of a sector in turn and lets the mosaic vouch for a body, not a cell. Tokyo 41.07 → 12.59 km (the bay), San Francisco 59.07 → 3.26 km (the bay); New Orleans, Miami, Lisbon, Madrid, Kansas City and Rio unchanged.';
