/**
 * A coastline is not nearer than the map that finds it.
 *
 * Nimbus decides an impact's relation to the sea twice, from two different
 * maps, and on 19 September 2026 the two disagreed on the same event.
 *
 * Andrea ran a 1 km stone at 7.5 km/s into Miami — 25.790° N, 80.226° W, some
 * kilometres inland of Biscayne Bay — and the store answered:
 *
 *   firestorm.ignitionRadius   167 km      (so: land. An open-water strike has
 *                                           its fire zeroed by the terrain
 *                                           gate, and this one was not)
 *   inputs.waterDepth          200 m
 *   inputs.shoreDistance       0 m
 *   tsunami.seaCoupling        mechanism "water", fraction 1, shore 0
 *   tsunami.cavityRadius       5.87 km
 *
 * Land for the fire, open sea for the wave, on one event. The report printed
 * "Water depth at impact 200 m" over an inland city, which is the sentence
 * B-044 was about, and counted 900 000 of its 6.9 million dead as drowned.
 *
 * Where the zero comes from. `findPropagationSeeds` in tsunami/sourcePlacement
 * has a shortcut at the top: if the grid cell that contains the point reads
 * water, it returns one seed at that point, `distanceM: 0`, and stops. For
 * placing a wave source that is the right semantics — the source cell is
 * water, the wave starts there. As a shore distance it is a claim about the
 * world, and the grid it is read from is the planetary bathymetric mosaic at
 * zoom 2: 1 024 cells around the equator, a little over 39 km each. The cell
 * that contains Miami contains the Atlantic. Every point within tens of
 * kilometres of any coast gets the sea at zero and the whole wave.
 *
 * `nearestSeaForImpact` builds its seeds from two searches — the per-click
 * Terrarium tile, which is finer by orders of magnitude and is vouched for by
 * the planetary mask, and the planetary mosaic itself — then sorts them all
 * together by distance and takes the nearest. The mosaic's zero always wins.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out: the store's two branches and the gate; `findPropagationSeeds` in
 * full; the reading above, reproduced headless at Andrea's coordinates; and
 * the fact that `IMPACT_SEA_SEARCH_M` is 2 500 km and the planetary grid's
 * zoom is 2. No run of any candidate was seen before these rules were fixed,
 * and no row of the calibration net was re-read.
 *
 * The rules, fixed on 19 September 2026, before the candidate was written, and
 * numbered after the two hundred and forty before them:
 *
 * 241. The candidate, which Andrea chose between four on 19 September 2026.
 *      (a) The fine map decides. Where the per-click tile's own search returns
 *          any sea, its nearest is the answer; the planetary mosaic answers
 *          only where the tile has nothing to say. The mosaic keeps the role
 *          the code's own comment already gives it, vouching for the tile's
 *          cells through the sea mask.
 *      (b) No answer is nearer than the map it came from. Every candidate
 *          distance is floored at half the cell of the grid that produced it —
 *          a feature inside a cell cannot be located better than that — so the
 *          planetary mosaic can no longer say nought metres from a cell 39 km
 *          wide, and the fine tile's floor is a few tens of metres and changes
 *          nothing it says.
 *
 * 242. Where it goes, and where it does not. In `nearestSeaForImpact`, which
 *      is where a seed distance becomes a claim about a shore.
 *      `findPropagationSeeds` keeps its zero: there it means "this cell is
 *      water", which is what placing a wave source needs, and the rupture
 *      seeding of an earthquake's wave reads it that way. Nothing in the wave
 *      solver, the veil, the run-up or the arrival times is touched.
 *
 * 243. What decides, and this one can be scored against the world, because a
 *      distance from a place to the sea is a fact. Four points, their true
 *      nearest sea a wave could cross stated here as bounds rather than as
 *      figures, because bounds are what the geography supports:
 *
 *        Miami        25.790 N,  80.226 W   between 1 and 20 km (Biscayne Bay)
 *        Lisbon       38.722 N,   9.139 W   between 0.2 and 15 km (the Tagus)
 *        Madrid       40.417 N,   3.704 W   between 250 and 400 km
 *        Kansas City  39.100 N,  94.580 W   over 800 km, or nothing found
 *
 *      The candidate must put all four inside their bounds. A point that reads
 *      zero, or that reads a distance outside its bound, refuses it.
 *
 * 244. The guard that is not negotiable. One event, one answer about the sea.
 *      No scenario may be land for the terrain gate — its fire and its
 *      liquefaction alive — and at the same time be handed a sea coupling of
 *      one with the shore at zero. Checked on Miami and on the three above.
 *
 * 245. The guard against over-correcting. A strike in open water must still
 *      couple fully: the store's own open-water branch reads the depth under
 *      the click and never calls this function, and a deep-ocean scenario must
 *      come through with its wave unchanged, the same cavity and the same
 *      amplitudes to the bit.
 *
 * 246. What is printed. For each of the four points: what the tile says, what
 *      the mosaic says, the floor each carries, the answer before and after,
 *      the depth, the coupling mechanism and fraction, the cavity. For the
 *      calibration net: every toll that moves, with its band and whether the
 *      record is still inside. The release gate's verdict either way.
 *
 * 247. What an adoption does, and what it may not do. The registry takes the
 *      row; the report and the methodology page say that a shore distance is
 *      floored at the resolution that found it. What it may not do is
 *      re-tune anything to catch a toll that moves — rules 5 and 6 — and the
 *      wave's own calibration, its run-up, its Manning damping and its
 *      dispersion stay exactly where they are.
 *
 * What these rules cannot settle. Whether the nearest sea a wave could cross
 * is the right question at all: a bay a few metres deep is where a crater rim
 * meets the sea, and it is also a bay, and what a 5 km cavity does in three
 * metres of water over a lagoon is not what this model computes. Nor whether
 * the planetary mosaic at zoom 2 should be used for a shore at all — it is
 * what is loaded, the finer tile covers only the click, and beyond the tile
 * the answer is as coarse as the floor now admits. The round makes the model
 * stop claiming a precision it does not have; it does not give it the
 * precision.
 */

/** Half a cell is the best a grid can place a feature inside one. */
export const RESOLUTION_FLOOR_CELLS = 0.5;

/** Rule 243's rows: a point, and the bounds its true nearest sea lies in. */
export const SHORE_TEST_POINTS: readonly {
  name: string;
  latitude: number;
  longitude: number;
  minM: number;
  maxM: number | null;
  why: string;
}[] = [
  {
    name: 'Miami',
    latitude: 25.79,
    longitude: -80.226,
    minM: 1_000,
    maxM: 20_000,
    why: 'inland of Biscayne Bay, which is sea-connected and is what a wave would cross',
  },
  {
    name: 'Lisbon',
    latitude: 38.7223,
    longitude: -9.1393,
    minM: 200,
    maxM: 15_000,
    why: 'on the Tagus estuary, open to the Atlantic',
  },
  {
    name: 'Madrid',
    latitude: 40.4168,
    longitude: -3.7038,
    minM: 250_000,
    maxM: 400_000,
    why: 'the middle of the Iberian meseta; Valencia and Bilbao are the nearest coasts',
  },
  {
    name: 'Kansas City',
    latitude: 39.1,
    longitude: -94.58,
    minM: 800_000,
    maxM: null,
    why: 'the middle of North America; the Gulf is the nearest sea and it is far',
  },
];

/**
 * The outcome of the round, written after the candidate was measured and not
 * before. Left null until then, so a reader can tell a rule from a result.
 */
export const SHORE_DISTANCE_OUTCOME: string | null = null;
