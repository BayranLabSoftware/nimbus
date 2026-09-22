/**
 * The wave of an impact on land leaves from the sea its crater reaches.
 *
 * Found on 22 September 2026 in the audit Andrea asked for (ROADMAP IMP-7f).
 * Rule 268 raises a land impact's wave in the segment of its transient crater
 * that lies in the sea; rule 269 raises none from the ejecta, whose wave no
 * published law sizes. But the wave's arrival field is marched from seeds the
 * store finds in eight compass sectors out to `propagationReachFor`, which for
 * an impact is the coupling's reach — the largest of the crater and the 1 m
 * ejecta isopach. For Chicxulub that is 856 km, and on the Yucatán every
 * sector with water within it gets a seed at t = 0: thirteen, at 4 to 46 km in
 * the Gulf the crater reaches, and one at 214 km on the Caribbean coast of
 * Quintana Roo, on the far side of the peninsula, which no part of the crater
 * touches. The wave's height comes from the crater and its start, in part,
 * from the ejecta's reach.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out: the audit's reading at 21.40° N, 89.52° W — the thirteen seeds and
 * their distances, the reach of 856 km, the arrival times at ten points of
 * the Gulf, the Caribbean and the Atlantic — and `propagationReachFor`,
 * `findPropagationSeeds`, `ruptureOrigins` and `computeSeaCoupling` in full.
 * No candidate was written or run.
 *
 * The rules, fixed on 22 September 2026, before the candidate was written, and
 * numbered after the eight hundred and four before them:
 *
 * 805. The candidate. For an impact on ground whose wave rises in its crater
 *      (the coupling's mechanism is the crater), a propagation seed is kept
 *      only in a compass sector that holds some of the crater's sea: a sector
 *      of the eight the seed search uses in which at least one point of rule
 *      798's lattice counts as water. Where the lattice counts none, the
 *      sector of the nearest seed found stands for the crater's sea. The
 *      reach, the seed search, the solver's floor and t = 0 are unchanged.
 *
 * 806. What is not in the candidate. Seeds still start at t = 0 wherever the
 *      nearest propagable water is, even when the crater's own water is too
 *      shallow for the solver and the wave would take time to reach them; and
 *      the reach still runs out to the ejecta's, so a sector the crater meets
 *      may seed far beyond the crater. Both are named, not changed. The
 *      ejecta's wave, the resurge and the air blast on the water stay
 *      unsized (rule 269).
 *
 * 807. What decides.
 *      (a) Exact, on maps made for the purpose: a coast with sea to the north
 *          only keeps seeds to the north only; a point with sea on two sides
 *          keeps both; a lattice that counts no water keeps the nearest
 *          seed's sector.
 *      (b) On the Yucatán the seed on the Caribbean coast is gone, and every
 *          seed left lies in a sector of the crater's sea; the wave still
 *          propagates.
 *      (c) Chicxulub on New Orleans, Tampa and Lisbon still propagate, every
 *          seed in a sector of the crater's sea.
 *      (d) An impact in the sea, and every other module's wave, keep their
 *          seeds exactly.
 *      (e) The physics result is unchanged to the bit: only the seeds move.
 *      (f) The release gate stays PASS, and the validation report is
 *          regenerated once.
 *      Any of these failing refuses the candidate.
 *
 * 808. What is printed. For the Yucatán, New Orleans, Tampa and Lisbon: the
 *      seeds before and after, with their distances and sectors; on the
 *      Yucatán the arrival times before and after at the Gulf north of the
 *      crater, Cancún, the Caribbean coast of Quintana Roo, Havana, the
 *      Straits of Florida and New York; and the drowned before and after.
 *
 * 809. What an adoption does. The registry takes the row; the methodology
 *      entry of the coupling says where the wave's seeds are kept.
 *
 * 810. What is not touched. The seed search itself, the reach, the solver,
 *      the amplitude, the run-up, the damping; rules 798's lattice; every
 *      other module's seeds.
 *
 * 811. What may not happen. No constant is introduced: the eight sectors are
 *      the search's own and the lattice is rule 798's. If the drowned move,
 *      that is the result.
 */
