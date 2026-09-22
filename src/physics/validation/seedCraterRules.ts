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
