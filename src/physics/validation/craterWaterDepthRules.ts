/**
 * The wave of an impact on land is raised in the water its crater reaches.
 *
 * Andrea asked on 22 September 2026 why Chicxulub on New Orleans raised no
 * tsunami. Part of the answer was the drawing — the wave map lay under the
 * field of the layer chosen (B-113). The rest is the number. Rule 268 raises
 * a land impact's wave in the circular segment of its transient crater that
 * lies beyond the shore; everything downstream was left as it was, and that
 * includes the depth the wave is built in, which rule 248 had fixed a round
 * earlier as the nearest sea's own cell. At the time the source was a cavity
 * at the shore, and the shore's cell was the water it reached. Since rule 268
 * the source is a segment of crater that runs from the shore out to the
 * transient rim, and the shore's cell is only its landward edge — the
 * shallowest water it has. The program's law caps its wave at the depth of
 * the water it rises in, so the cap binds on the edge.
 *
 * At New Orleans the edge is not even water. The fine tile under the city
 * (0.53 km to the cell, 29.54° to 30.75° N, 91.41° to 90.00° W) holds no
 * seed the shoreline search accepts, so the answer comes from the planetary
 * mosaic, 18.5 km to the cell, and the mosaic's cell under the city itself
 * averages to 1.17 m below the sea: the model is handed a sea at the floor of
 * half a cell, 9.24 km, 1.17 m deep. A Chicxulub-class body there digs a
 * transient crater 45.8 km in radius, of which the segment puts 37 % beyond
 * that shore, and the program's wave is min(0.07 D, h) times that share, D
 * its water crater: the cap of 1.17 m gives 0.44 m at the source.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out. The chain above, and `nearestSeaForImpact`, `findPropagationSeeds`,
 * `waterBodyReaches` and the program's `programTsunamiReferenceAmplitude` in
 * full. The seed search at New Orleans (no seed on the tile; the mosaic's cell
 * at the origin, 1.17 m). The source at five depths with the rest held: 0.436 m
 * at 1.17 m of water, 0.745 at 2, 1.489 at 4, 2.122 at 5.7 and 3.723 at 10 —
 * the cap is linear in the depth and nothing else moves. A reading taken by
 * random sampling of the transient disc, which is this round's candidate asked
 * loosely: the tile covers 59.9 % of the disc, and only 1.3 to 1.7 % of what it
 * covers reads water 1 m deep or more, at a mean of 2.0 to 5.3 m (river and
 * polder, most of it, since the tile shows a lake by its surface); the 41 %
 * outside the tile reads 64.8 % water on the mosaic, at a mean of 5.7 m; the
 * final rim, 82.8 km, 27.7 % water at a mean of 7.4 m. That a coastal
 * Chicxulub costs 7.0 ms a run in Node, and that the Monte Carlo runs on the
 * panel's inputs, without the coast. No candidate code was written or run
 * before these rules were fixed.
 *
 * The rules, fixed on 22 September 2026, before the candidate was written, and
 * numbered after the seven hundred and ninety-seven before them:
 *
 * 798. The candidate. For an impact on ground whose transient crater reaches
 *      the sea — the physics raises a wave, rule 268's segment is not empty —
 *      the depth the wave is built in is the mean depth of the water within
 *      the transient crater's radius of the point of impact. The disc is read
 *      on a fixed lattice of points, 33 by 33 over its square, those inside
 *      the radius kept, each placed on the sphere by its range and bearing.
 *      Every point is read on the finest map that covers it — the local tile,
 *      else the planetary mosaic — at the cell it falls in, and counts as
 *      water on the terms the shoreline search already uses on that map: at
 *      least 1 m below the sea, in a body of at least 200 such cells vouched
 *      for by the mosaic within one of its cells on the tile, of at least 24
 *      on the mosaic. The mean is over the points that count, capped at rule
 *      248's 200 m. Where none counts, rule 248's depth stays. The crater is
 *      the result's own: the store runs the physics once to read it, and again
 *      with the depth, only when the first run raises a wave.
 *
 * 799. What is not in the candidate, and is named so it is not forgotten.
 *      (a) The share of the crater in the sea stays rule 268's segment of a
 *          straight coast at the shore distance; the lattice could measure the
 *          share too, and that is a change of its own.
 *      (b) Rule 269's three waves — the ejecta falling into the sea, the sea
 *          draining into a crater that encloses the coast, the air blast on
 *          the water — stay unsized. At New Orleans they are most of the
 *          answer to Andrea's question and this round does not touch them.
 *      (c) The maps' own limits: the tile shows a lake by its surface and a
 *          polder by its floor, so Lake Pontchartrain reads land and the
 *          city's districts below the sea read water; the body test keeps
 *          small polders out and no test here keeps a large one out. The
 *          mosaic's cell averages its land and its sea. The candidate reads
 *          what the maps say and cannot read past them.
 *      (d) The explosion path, which reads the same shore search, keeps rule
 *          248's depth: one module at a time.
 *      (e) The Monte Carlo keeps running on the panel's inputs, with no coast
 *          and so no wave for a land impact. Named, not touched.
 *
 * 800. What decides.
 *      (a) Exact: the depth handed to the physics is the lattice mean of rule
 *          798 on synthetic maps whose answer is known — a disc half sea of
 *          one depth, a disc read partly on the tile and partly on the
 *          mosaic, a pond and a polder that the body test must drop, a disc
 *          with no water — to within a millimetre.
 *      (b) Where the crater does not reach the sea, nothing moves, to the bit:
 *          a 1 km stone at Miami, and Chicxulub seventy kilometres inland.
 *      (c) An impact in open water is unchanged to the bit.
 *      (d) Of a land impact, every output but the wave is unchanged to the
 *          bit — crater, dust, magnitude, blast, heat, ejecta — since the
 *          depth reaches none of them (rule 267).
 *      (e) Against the world, at New Orleans: the depth read lies above the
 *          1.17 m of the cell under the city and under 10 m. The water within
 *          46 km of the city is lakes, marsh and sounds a few metres deep —
 *          Lake Borgne, the west end of Mississippi Sound, the head of Breton
 *          Sound — and the open shelf lies beyond. A reading past 10 m says the
 *          lattice found a channel or a map's artefact, and refuses.
 *      (f) The release gate stays PASS, and the validation report is
 *          regenerated once.
 *      Any of these failing refuses the candidate.
 *
 * 801. What is printed. For Chicxulub at New Orleans, at Tampa and at Lisbon,
 *      and for rule 250's 1 km stone at Lisbon: the shore's distance and
 *      depth, the lattice's points, the share of them on the tile and the
 *      share that counts as water, the depth before and after, the segment,
 *      the source, the wave at 1 000 km as the program and Wünnemann print
 *      it, and the drowned. For the calibration net, every toll that moves.
 *
 * 802. What an adoption does. The registry takes the row. The legend's note
 *      and the report's row of the nearest sea say, for a land impact that
 *      raises a wave, that its depth is the mean of the water within the
 *      crater; the methodology page says it where it tells rules 248 and 268.
 *
 * 803. What is not touched. The wave's laws — the program's, Ward & Asphaug,
 *      Wünnemann, Collins & Weiss — the segment, the run-up, the damping, the
 *      dispersion; rule 248's cap and its shore search; the far field's
 *      4 000 m; the open-water path; the explosion path.
 *
 * 804. What may not happen. No constant is tuned to make the wave larger: the
 *      lattice's 33 points a side is a sampling choice, fixed here, and every
 *      other number is one the shoreline search already uses. If the source
 *      at New Orleans stays near two metres, that is the result, and it is
 *      recorded as the result (rules 5 and 6).
 *
 * What these rules cannot settle. Whether the program's cap, written for a
 * crater in water of one depth, is the right law for a segment over a floor
 * that deepens from the shore; the mean is the depth that holds the same water
 * over the same area, which is a choice and not a derivation. Whether a wave
 * raised in a few metres of lake and sound is a tsunami or a surge that dies
 * against the first bank. And rule 799(b), which is the larger part of the
 * question Andrea asked.
 */

/** Rule 798: the lattice is this many points a side over the disc's square. */
export const CRATER_WATER_LATTICE = 33;

/** Rule 800(e): the depth read at New Orleans must come in under this, in
 *  metres; the cell under the city, 1.17 m, is the floor it must pass. */
export const NEW_ORLEANS_WATER_MAX_M = 10;
export const NEW_ORLEANS_SHORE_DEPTH_M = 1.17;

/**
 * The outcome of the round, written after the candidate was measured, on
 * 22 September 2026. The rules above were pushed in commit aa5a591 before the
 * candidate was written.
 *
 * ADOPTED. Rule 800 holds on every clause.
 *
 * (a) On maps made for the purpose the lattice reads a disc half sea of 8 m
 *     as 8 m, a disc read partly on the tile and partly on the mosaic as the
 *     mosaic's 30 m, drops a pond and a polder of a hundred cells, keeps a
 *     polder of four hundred (rule 799(c): nothing here can tell it from a
 *     bay), and reads no water as none — each to 10⁻⁹ m.
 *
 * (b) A 1 km stone five kilometres from Biscayne Bay and Chicxulub seventy
 *     kilometres inland raise no wave, so nothing is read and the physics
 *     does not run again: nothing moves.
 *
 * (c) An impact in open water is never read again.
 *
 * (d) Of Chicxulub on New Orleans, the whole result but the wave and the
 *     depth itself is identical to the bit at 1.17 m and at 5.76 m of water;
 *     the source moves by the ratio of the depths and by nothing else.
 *
 * (e) New Orleans reads 5.76 m: 207 of the lattice's 797 points count as
 *     water. The 477 read on the tile hold none the search accepts — the tile
 *     shows Lake Pontchartrain by its surface, and ends at 90° W — so every
 *     one of the 207 is the mosaic's, east of the tile, over Lake Borgne and
 *     the sounds beyond the city. Above the 1.17 m of the cell under the city
 *     and under the 10 m the rule fixed.
 *
 * (f) See the commit that adopts this: the gate in strict mode, and the
 *     validation report regenerated once.
 *
 * Rule 801's table, read on the running app (scripts/benchmark/
 * crater-water.ts). The far field of all four rows is the program's, which
 * the result prints; Ward & Asphaug's row, the historical reference, does
 * not depend on the depth and does not move.
 *
 *                       shore    depth    lattice       depth     segment  source          A @ 1 000 km      drowned
 *                                before   pts/tile/wet  after
 *   Chicxulub  N. Orl.  9.24 km  1.17 m   797/477/207    5.76 m   37.2 %   0.436 → 2.144 m  0.065 → 0.321 m        0 → 20
 *   Chicxulub  Tampa    8.55 km  4.35 m   797/770/127    4.46 m   38.2 %   1.660 → 1.703 m  0.249 → 0.255 m    1 413 → 1 537
 *   Chicxulub  Lisbon   3.47 km  2.66 m   797/508/252  200    m*  45.2 %   1.20  → 90.3  m  0.180 → 13.5  m    1 235 → 3 231 344
 *   1 km stone Lisbon   3.47 km  2.66 m   797/797/12     1.99 m    0.33 %  0.0087 → 0.0065 m  (10⁻⁴ m)          0 → 0
 *
 *   * the mean read is 249.9 m; rule 248's cap of 200 m binds.
 *
 * What it means, said plainly. At New Orleans the source is five times what
 * it was and the wave is still small: two metres at the source, a third of a
 * metre at a thousand kilometres, twenty people drowned. The water within the
 * crater is a few metres of lake and sound, and the cap that holds the
 * program's wave to its depth is doing what it was written to do. What
 * Andrea saw missing at New Orleans is mostly rule 799(b) — the ejecta, the
 * resurge and the air blast on the water, which nobody has sized — and this
 * round was never going to supply it.
 *
 * At Lisbon the round corrects the defect at its largest. A crater 91 km
 * across on the Tagus spans the estuary, the shelf and the slope beyond it —
 * the tile alone reads 225 of the points as water at a mean of 234 m — and
 * until today it was handed the Tagus's own 2.66 m: a 1.2 m wave for a body
 * that excavates the open Atlantic. It is now handed the
 * Atlantic, to the cap: 90 m at the source, 13.5 m at a thousand kilometres,
 * three million drowned. The 1 km stone at Lisbon moves the other way, from
 * the shore's cell to the 1.99 m of the estuary within its 3.6 km crater.
 * Tampa barely moves, because the water in its crater is Tampa Bay and the
 * shelf beside it, which are about as deep as the shore's cell said.
 */
export const CRATER_WATER_OUTCOME =
  'ADOPTED 22 September 2026: a land impact whose crater reaches the sea raises its wave in the mean depth of the water within its transient crater, read on the finest map at each point with the shoreline search\u2019s own tests, capped at 200 m. New Orleans 1.17 m to 5.76 (source 0.44 m to 2.14), Tampa 4.35 to 4.46, Chicxulub at Lisbon 2.66 m to the cap (source 1.2 m to 90 m, 1 235 drowned to 3.2 million); every output but the wave unchanged to the bit.';
