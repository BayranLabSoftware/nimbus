/**
 * The wave of an impact on land leaves from its crater's own sea — second
 * round.
 *
 * Rules 805 to 811 kept a land impact's seeds in the compass sectors that hold
 * some of its crater's sea, and were refused by 807(b): within Chicxulub's
 * 45.8 km on the Yucatán the crater reaches water in almost every sector, the
 * coastal waters included, so every sector kept its seed — the nearest water
 * the solver can march from, 214 to 312 km away across the peninsula. What
 * that round measured is not held out: the seeds, the arrival times and the
 * drowned at the Yucatán, New Orleans, Tampa and Lisbon before and after, and
 * that Tampa's drowned fall from 1 537 to 2 once the Atlantic side of Florida
 * no longer starts the wave. No candidate of this round was written or run.
 *
 * The rules, fixed on 22 September 2026, before the candidate was written, and
 * numbered after the eight hundred and eighteen before them:
 *
 * 819. The candidate. For an impact on ground whose wave rises in its crater,
 *      the wave's seeds are the points of rule 798's lattice that count as
 *      water and at which the solver can march — a cell of the grid the
 *      solver runs on, at least the solver's floor deep, in a body the size
 *      the seed search asks — each at its own place, distance and bearing,
 *      at t = 0. Where no point of the crater's sea is deep enough, the seed
 *      is the one nearest seed the search finds, and only that one: the
 *      nearest water the wave can be carried from. Everything else of the
 *      seed search — its reach, its floor, its bodies, its mask — and every
 *      other event's seeds are unchanged.
 *
 * 820. What is not in the candidate. Where the crater's sea is shallower than
 *      the solver's floor, the wave still starts at t = 0 at the nearest deep
 *      water, and the time it takes to cross the shallows is not counted —
 *      named, not changed. The ejecta's wave, the resurge and the air blast
 *      on the water stay unsized (rule 269).
 *
 * 821. What decides.
 *      (a) Exact, on maps made for the purpose: a crater half in a sea 30 m
 *          deep seeds only inside the crater; a crater in water 3 m deep
 *          seeds only the nearest deep water beyond it; the sea's other coasts
 *          seed nothing.
 *      (b) On the Yucatán no seed lies farther from the point of impact than
 *          the transient crater's radius, the wave still propagates, and the
 *          Caribbean coast of Quintana Roo is reached later than the 0.4 h it
 *          was.
 *      (c) New Orleans, Tampa and Lisbon still propagate; no seed of Tampa
 *          lies on the Atlantic side of Florida and none of Lisbon's in the
 *          Bay of Biscay.
 *      (d) An impact in the sea, and every other module's wave, keep their
 *          seeds exactly.
 *      (e) The physics result is unchanged to the bit: only the seeds move.
 *      (f) The release gate stays PASS, and the validation report is
 *          regenerated once.
 *      Any of these failing refuses the candidate.
 *
 * 822. What is printed. Rule 808's table again, the seeds, the arrival times
 *      and the drowned before and after, for the Yucatán, New Orleans, Tampa
 *      and Lisbon.
 *
 * 823. What an adoption does. The registry takes the row; the methodology
 *      entry of the coupling says where the wave's seeds stand.
 *
 * 824. What is not touched. The solver, its floor and its bodies; the reach;
 *      rule 798's lattice; the amplitude, the run-up and the damping.
 *
 * 825. What may not happen. No constant is introduced: the floor and the body
 *      are the solver's and the search's, the lattice rule 798's. If the
 *      drowned move, that is the result.
 */

/**
 * The outcome of the round, written after the candidate was measured, on
 * 22 September 2026. The rules above were pushed in commit 34d6f12 before the
 * candidate was written.
 *
 * ADOPTED. Rule 821 holds on every clause.
 *
 * (a) On made maps a crater half in a sea 30 m deep seeds only inside itself
 *     and never the second sea 90 km away; a crater in a lagoon 3 m deep
 *     seeds the one nearest deep water; one seed per cell, nearest first.
 * (b) On the Yucatán every seed lies within the transient crater's 45.8 km —
 *     354 on the tile and 9 on the mosaic, all in the Gulf the crater opens
 *     on — the wave propagates, and the Caribbean coast of Quintana Roo is
 *     reached at 3.24 h instead of 0.40 h: the wave goes round the peninsula
 *     through the Yucatán Channel, as it must.
 * (c) New Orleans propagates from two points of its crater's sea, 34 and
 *     41 km east; Tampa, whose crater's sea (Tampa Bay) is nowhere 10 m deep,
 *     from the one nearest deep water on each map, 48 and 63 km south and
 *     south-west, none on the Atlantic side; Lisbon from 211 points within
 *     46 km, none in the Bay of Biscay.
 * (d) Only an impact on ground whose wave rises in its crater is re-seeded:
 *     the gate in the store is tested; the sea and every other module keep
 *     the search's seeds.
 * (e) The physics does not read the seeds: its result is the same object.
 * (f) See the commit that adopts this.
 *
 * Rule 822's table (scripts in the session's scratchpad, as for rule 808):
 *
 *                  seeds (farthest)              Quintana Roo   drowned
 *   Yucatán        13 (312 km) → 363 (46 km)     0.40 → 3.24 h  137 869 → 3 307
 *   New Orleans     5 (122 km) → 2 (41 km)       2.97 → 7.59 h       20 → 1
 *   Tampa           9 (264 km) → 2 (63 km)       3.68 → 3.95 h    1 537 → 1
 *   Lisbon         12 (738 km) → 211 (46 km)                  3 231 344 → 3 210 737
 *
 *   The Yucatán's arrivals, before → after: the Gulf north of the crater
 *   1.15 → 0.69 h, Cancún 0.63 → 2.98, Havana 1.47 → 2.80, the Straits of
 *   Florida 1.87 → 3.18, New York 7.56 → 9.77.
 *
 * What it means. The drowned of a Chicxulub on the Yucatán fall forty-fold
 * because the wave no longer starts on the Caribbean coast at the moment of
 * impact: Cancún and the Riviera Maya are reached three hours later, round the
 * peninsula, by a lower wave. Tampa's fall to one because its crater's sea is
 * Tampa Bay, a few metres deep, and the wave it raises is small (rule 798);
 * the fifteen hundred drowned before were a wave that started, at the moment
 * of impact, on the Atlantic coast of Florida. Rule 820 stands: where the
 * crater's sea is too shallow for the solver, the wave starts at the nearest
 * deep water at t = 0, and the time to cross the shallows is not counted.
 */
export const SEED_CRATER_OUTCOME =
  'ADOPTED 22 September 2026: a land impact whose wave rises in its crater is seeded from the points of its crater’s own sea the solver can march at, else from the one nearest deep water. The Yucatán’s seeds all within 46 km instead of out to 312 km across the peninsula; Quintana Roo reached at 3.2 h instead of 0.4; the drowned 137 869 → 3 307, Tampa 1 537 → 1.';
