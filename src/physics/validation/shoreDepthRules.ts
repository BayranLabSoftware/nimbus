/**
 * The water a wave is made in is the water that is there.
 *
 * When an impact lands on ground near a coast, the store finds the nearest sea
 * a wave could cross and hands the physics a depth for it. That depth is the
 * median of every water sample in a nine-by-nine lattice over a square of
 * radius max(50 km, twice the shore distance), capped at 200 m. For a point on
 * the Florida coast the lattice reaches into the Straits of Florida; for one on
 * the Tagus it reaches the Atlantic shelf. Both come back over the cap, and
 * both are handed 200 m.
 *
 * Measured on 19 September 2026, a 1 km stone at 7.5 km/s, 45°:
 *
 *   Miami    shore 5 060 m   depth 200.0 m   f_water 0.208   crater 8.62 km
 *            cavity 5.87 km  source amplitude 904.7 m   A@1000 km 4.12 m
 *            895 642 drowned
 *   Lisbon   shore 3 474 m   depth 200.0 m   f_water 0.208   crater 8.62 km
 *            cavity 5.87 km  source amplitude 904.7 m   A@1000 km 4.12 m
 *            420 445 drowned
 *
 * Every figure but the shore distance and the toll is identical, because the
 * depth is the cap and not a measurement. Biscayne Bay is a lagoon, one to
 * four metres over most of its area with dredged channels to about twelve; the
 * Tagus estuary is a channel of tens of metres. The model cannot tell them
 * apart, and gives each the two-hundred-metre shelf neither of them is.
 *
 * What the depth then does. It is the water column `oceanCouplingPartition`
 * divides the energy across: with β = 0.5 a 1 km stone at 3 000 kg/m³ has a
 * characteristic depth of 855 m, so 200 m of water sends 20.8 % of the
 * post-atmospheric energy into the sea and shrinks the crater by the cube root
 * of the rest — a land crater 6.7 % smaller because there is a sea five
 * kilometres away. And it is the depth the tsunami source is built in, which
 * sets the shallow-or-deep regime and, for the Earth Impact Effects Program's
 * own row, caps the source amplitude at the depth itself.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out: `findNearbyOceanDepth` and `nearestSeaForImpact` in full;
 * `oceanCouplingPartition` and its two constants; the readings above, taken
 * from the running app at the three points; and the geography of Biscayne Bay
 * and the Tagus. No candidate was run before these rules were fixed.
 *
 * The rules, fixed on 19 September 2026, before the candidate was written, and
 * numbered after the two hundred and forty-seven before them:
 *
 * 248. The candidate. For an impact on ground, the depth handed to the physics
 *      is the depth of the water the coupling actually reaches — the water body
 *      the shore distance points at, at its own cell — and not the median of
 *      every water sample within fifty kilometres. The cap of 200 m stays, and
 *      stays declared: it is there so a seed in a deep channel cannot stand for
 *      a shore, and with the shore's own depth in hand it will rarely bind.
 *
 * 249. What is not in the candidate, and is the larger thing. A land impact is
 *      still handed a water column it does not have.
 *      `oceanCouplingPartition` answers "an impactor of this size falling
 *      through this much water — how much energy reaches the seafloor", and
 *      over dry ground the honest answer is all of it. Feeding it the shore's
 *      depth instead of the basin's makes the number smaller and more
 *      plausible; it does not make the question the right one. Correcting that
 *      means deciding where a coastal wave's energy comes from instead — the
 *      excavation that reaches the water, not a column the body fell through —
 *      and there is no measured coastal impact to anchor it. It is a round of
 *      its own and it is named here so it cannot be forgotten.
 *
 * 250. What decides.
 *      (a) Exact: the depth used is the depth of the water body the shore
 *          distance points at, and no longer a median over a fifty-kilometre
 *          square.
 *      (b) Against the world, in bounds the geography supports: at Miami the
 *          depth used must be under 50 m, because Biscayne Bay is a lagoon and
 *          not a shelf; at Lisbon under 50 m, for the Tagus. Two coasts that
 *          differ in nature must no longer read the same figure, unless the
 *          map cannot resolve them — in which case the reading is recorded as
 *          the map's limit and not as the model's answer.
 *      (c) A strike in open water is unchanged to the bit: same depth, same
 *          coupling, same cavity, same amplitudes, same toll.
 *      (d) The release gate stays PASS.
 *      Any of these failing refuses the candidate.
 *
 * 251. What is printed. For Miami, Lisbon and an open-ocean strike: the shore
 *      distance, the depth before and after, the water fraction, the crater,
 *      the cavity, the source amplitude, the amplitude at a thousand
 *      kilometres, and the drowned. For the calibration net: every toll that
 *      moves, with its band and whether the record is still inside.
 *
 * 252. What an adoption does. The registry takes the row; the report and the
 *      methodology page say which depth the wave is built in and which the far
 *      field travels on.
 *
 * 253. What is not touched. The wave's own laws — Ward & Asphaug, Wünnemann,
 *      Collins & Weiss, the run-up, the Manning damping, the dispersion — and
 *      the two constants of the coupling partition, β = 0.5 and the disruption
 *      ratio 1.5. The far field still travels on the default mean ocean depth
 *      of 4 000 m, which the store does not set and this round does not start
 *      setting: the basin's own depth is the right number for it and wiring
 *      that is a change of its own.
 *
 * 254. What may not happen. Nothing is re-tuned to catch a toll that moves
 *      (rules 5 and 6). If the drowned at Miami fall by an order of magnitude,
 *      that is the result and it is recorded as the result.
 *
 * What these rules cannot settle. Whether a wave raised in three metres of
 * lagoon is a tsunami at all, or a surge that dies against the first bank.
 * Whether the grid knows the difference: Terrarium encodes bathymetry from
 * ETOPO1 and a lagoon may not survive into it, so the model may still be
 * handed a shelf where there is a bay, and then the honest statement is about
 * the map and not about the sea. And the whole of rule 249, which is the
 * question this round is a corner of.
 */

/** §248's cap on the depth a shore may stand for, in metres. */
export const SHORE_DEPTH_CAP_M = 200;

/** Rule 250(b): the depth a coast's own water must come in under, in metres.
 *  A lagoon and an estuary are not a continental shelf. */
export const SHALLOW_COAST_MAX_M = 50;

/**
 * The outcome of the round, written after the candidate was measured and not
 * before. Left null until then, so a reader can tell a rule from a result.
 */
export const SHORE_DEPTH_OUTCOME: string | null = null;
