/**
 * What the wave does when it reaches the coast, against what was measured
 * there.
 *
 * This is the first reading of a rule that has never been measured. The
 * validation report has said since it began that "the coastal toll needs
 * bathymetry, so no offline test reaches it", and docs/GOLD_STANDARD.md asks
 * of the coast (T2) a bias within ×1.5 and a σ_ln no more than 0.8 against at
 * least 500 run-up and water-height observations of NOAA NCEI's Global
 * Historical Tsunami Database, from at least ten events, the observations
 * within each 50 km of coast read as their median. Of the five domains, waves
 * are the only one where the bar was out of reach rather than missed: nothing
 * could compute the left-hand side.
 *
 * It can now. `validation/terrariumTiles.ts` reads the same bathymetry the
 * browser reads, in Node, and `fetchGlobalBathymetricMosaic` takes a loader,
 * so the planetary mosaic the product propagates a trans-oceanic wave across
 * — sixteen terrarium tiles at zoom 2, about 40 km a cell — can be built
 * offline and handed to `computeBathymetricTsunami` unchanged.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out: the shape of NCEI's two tables and the counts its filters leave
 * (`scripts/build-runup-set.ts` prints them); that the measurement types can
 * be told apart by where they sit, which is how the deep-ocean gauge was
 * found and excluded; and that the chain runs at all — the 1960 Chile
 * earthquake was put through it once, before these rules were written, and
 * gave 14 658 coastal cells with a largest run-up of 122 m. No observation of
 * rule 102's set was compared with a model number before these rules were
 * fixed, and that first run is in the set: its numbers are part of the score
 * and not a guard on it.
 *
 * And, as in the two rounds before this one, the thing that is said rather
 * than hidden: these rules were written in full — the set, the filters, the
 * exclusions, the modelling choices of rule 103, the measure and the bar —
 * and then the set was run, and only then were they committed. A reader has
 * the author's word, and not a commit, that nothing moved in between. Rule
 * 103's choices are the ones to weigh with that in mind, because they are
 * choices and they are mine: a thrust for every event, the deepest seed
 * within 300 km, the planetary mosaic alone, 50 km to match an observation to
 * a cell. None of them was changed after a number was seen.
 *
 * The rules, fixed on 16 September 2026, and numbered after the hundred and
 * one before them:
 *
 *  102. The observations. NCEI's tsunami events and run-ups, read whole
 *       through the public HazEL service on the day the set was built
 *       (`scripts/build-runup-set.ts`, which writes `runupSetData.ts`). A
 *       run-up counts when the database gives it a height above zero, does
 *       not mark it doubtful, did not measure it with a deep-ocean gauge —
 *       that is the DART instrument, whose records belong to T1 and which
 *       this project has read — and gives it a place. Its tsunami counts when
 *       the database calls an earthquake its cause and gives that earthquake
 *       a place, a magnitude, a depth and a year from 1900 on.
 *
 *       Three groups are left out because this project has already read their
 *       wave, and the rule names them by the rule that read them rather than
 *       by hand: every tsunami of 2006 or later whose earthquake reached
 *       magnitude 7.7, which is BM-05's own selection of the events it chose
 *       its far-field law on; Tōhoku 2011, which the wave rows are tuned on;
 *       and Sumatra 2004, whose far coasts the validation report quotes among
 *       its declared gaps. An event is kept only if thirty of its
 *       observations survive all of that, because a whole planet's
 *       bathymetry is propagated for each one and an event with five
 *       observations cannot fill a coastal bin.
 *
 *  103. How each event is run, and every choice it forces. The earthquake is
 *       the product's own, at the database's latitude, longitude, magnitude
 *       and depth. Three things the database does not give are chosen here,
 *       before any score, and each is a declared assumption and not a
 *       measurement:
 *         (a) the fault is read as a thrust for every event. NCEI holds no
 *             mechanism, and Nimbus raises no wave from a strike-slip source;
 *             an earthquake whose tsunami was surveyed at thirty places was
 *             a dip-slip one, but which one is not known row by row.
 *         (b) the water the earthquake is given is the deepest seed
 *             `findPropagationSeeds` returns within 300 km on the planetary
 *             mosaic. NCEI's source coordinates are a place name — 1960
 *             Chile's fall 146 m above the sea — and the product itself
 *             hunts for water this way when a visitor picks a coast.
 *         (c) the wave is propagated on the planetary mosaic alone, which is
 *             what the product uses outside its local tile. A coast within a
 *             tile's reach of the source is drawn finer on screen than this
 *             measures.
 *       Each observation is matched to the nearest coastal run-up cell within
 *       50 km. An observation with no cell that near is counted apart and
 *       scored by nobody: it is a coast the 40 km mosaic does not resolve,
 *       and the number of them is printed.
 *
 *  104. The measure and the bar. T2's own. A bin is a coastal cell of the
 *       mosaic together with the observations matched to it — about 40 km of
 *       coast, near enough to T2's 50 and the only unit the model resolves —
 *       and a bin is scored as the median of its observations against the
 *       model's run-up height there. Over the bins: bias, the geometric mean
 *       of model over record, must lie within ×1.5, and σ_ln must be no more
 *       than 0.8. Every figure is printed by event and by NCEI measurement
 *       type as well, because the database mixes a tide gauge's water height
 *       with a survey's run-up on a slope and the model's run-up is the
 *       larger of the two quantities; the shore height the product derives
 *       from the same cell is printed beside, deciding nothing.
 *
 *  105. What this decides. Nothing is adopted and nothing is tuned: there is
 *       no candidate here, only the first reading of T2. The outcome is
 *       declared whichever way it falls, in the validation report, in
 *       docs/SCIENCE.md and in the standing table of docs/GOLD_STANDARD.md,
 *       and rule 5 forbids tuning on a set that has now been read. Because
 *       the bathymetry is fetched rather than shipped, the run is a script
 *       and not a step of the report's regeneration — the report must rebuild
 *       byte for byte without a network — so its figures enter the report as
 *       a recorded reading with the date and the command that made it, which
 *       is how the browser-measured coastal numbers have always entered it.
 *
 * What these rules cannot settle. A 40 km cell is not a coast: it cannot hold
 * a bay, a headland or a river mouth, and those are what make one village's
 * run-up three times its neighbour's. The model's run-up is Synolakis 1987 on
 * a plane beach whose slope is read from the same 40 km grid, so the slope is
 * a regional average and not a beach. NCEI's own heights carry a century of
 * changing practice and an unrecorded scatter. And the set's events are
 * mostly old, because the recent large ones are the ones this project has
 * already read: what is measured here is the coast of the twentieth century,
 * surveyed as the twentieth century surveyed it.
 */

/** Rule 103: how far from the source a seed may be found (m). */
export const RUNUP_SEED_RADIUS_M = 300_000;

/** Rule 103: how far an observation may be from the coastal cell that
 *  answers for it (m). */
export const RUNUP_MATCH_RADIUS_M = 50_000;

/** Rule 104: T2's bounds. */
export const RUNUP_BIAS_BOUND = 1.5;
export const RUNUP_SIGMA_BOUND = 0.8;

/** Rule 104: what T2 asks of the set's size. */
export const RUNUP_MIN_BINS = 500;
export const RUNUP_MIN_EVENTS = 10;

export interface RunupReading {
  /** Bins scored — a coastal cell with at least one observation. */
  bins: number;
  events: number;
  /** Observations behind those bins. */
  observations: number;
  /** Observations with no coastal cell within rule 103's radius. */
  unmatched: number;
  /** Geometric mean of model over record. */
  bias: number;
  sigmaLn: number;
  /** The share of bins the model puts within a factor of two. */
  withinTwo: number;
}

export function meetsT2(reading: RunupReading): boolean {
  return (
    reading.bins >= RUNUP_MIN_BINS &&
    reading.events >= RUNUP_MIN_EVENTS &&
    reading.bias >= 1 / RUNUP_BIAS_BOUND &&
    reading.bias <= RUNUP_BIAS_BOUND &&
    reading.sigmaLn <= RUNUP_SIGMA_BOUND
  );
}
