/**
 * The far wave against the field's own tool, on the rows both can be asked.
 *
 * T1 of `docs/GOLD_STANDARD.md` reads, in full: "×1.25 at the median event,
 * σ_ln ≤ 0.50, ×1.5 beyond 7 000 km", against "GeoClaw on real bathymetry, on
 * the same DART records". Its status has been *pending* since the clause was
 * written, and the reason is not the numbers. Nimbus's own reading on those
 * records is published: **1.00× at the median event, σ_ln 0.44, 0.84× beyond
 * 7 000 km** — inside every one of the three bounds. What is missing is the
 * second column. The bound was met against the records; the clause asks for it
 * to be met against the reference, and GeoClaw has only ever run here over a
 * flat ocean, as the fixtures of `noaaBenchmarkFixtures.ts` say in their own
 * words.
 *
 * On 19 September 2026 that changed: GeoClaw 5.14.0 builds and runs on this
 * machine, and its own Chile 2010 example reproduces the fixture committed
 * from another platform to 0.27 % and the same second
 * (`benchmark/results/geoclaw-chile2010-macos.json`). So the column can be
 * computed, and this round computes it.
 *
 * The amendment of 16 September governs what the column is for: **a model
 * meets a bound when it is no worse than the reference on the same rows.** A
 * round that put Nimbus's 1.00× beside a reference reading 0.6× would have
 * measured a gap; one that puts it beside a reference reading 1.4× has closed
 * a clause. Neither is known while these rules are being written, and nothing
 * in them may be changed once it is.
 *
 * The rules, fixed on 19 September 2026 and numbered after the two hundred and
 * seven before them, written and pushed before any GeoClaw run over real
 * seafloor is read:
 *
 *  208. **What is looked at, and what it costs.** The rows are the records of
 *       `benchmark/dart/records.json` that the headline reading keeps: 113
 *       deep-ocean records of nine megathrusts of Mw 7.8 to 9.1, read from
 *       NOAA NDBC on 15 September 2026 and scored the same day (BM-05). They
 *       are **not held out** and reading them again spends nothing: the
 *       outcome of C0 against C1 is already published, in
 *       `benchmark/dart/score.json` and in the report. No set is spent by this
 *       round, and none of the project's unread sets is touched by it.
 *
 *  209. **The reference, and what both models are given.** A third model, C2:
 *       GeoClaw 5.14.0 (the source release, gfortran, this Mac), the `geoclaw`
 *       solver — the nonlinear shallow-water equations in spherical
 *       coordinates with adaptive refinement — over real seafloor.
 *
 *       Its source is C1's, exactly: Okada's deformation of a uniform slip
 *       over **Nimbus's own rectangle**, the length, width and mean slip that
 *       `benchmark/dart/c0.json` already publishes per event, on the thrust
 *       plane's strike and dip, rake 90°, the top at 5 km, centred on the
 *       epicentre, computed by `clawpack.geoclaw.dtopotools` as C1's own
 *       deformation is. C2 therefore differs from C1 in the propagation and in
 *       nothing else: real bathymetry and the nonlinear equations with
 *       refinement, in place of a flat ocean and Poisson's formula.
 *
 *       Its seafloor is the one the product propagates over, at a resolution
 *       the reference can be run at honestly: the AWS Terrain Tiles the app
 *       already fetches (terrarium encoding, keyless), mosaicked and
 *       reprojected by the product's own `terrainSampling.ts` — not a copy of
 *       it — and written out as a GeoClaw topotype-3 file. The zoom the globe
 *       itself uses, 2, is about 40 km a pixel; the reference is run at zoom 4,
 *       about 10 km, which is finer than the 10-arcmin ETOPO that GeoClaw's own
 *       example ships with. The run declares the zoom it used, and a reading at
 *       the globe's own 40 km is reported beside it where it was computed.
 *
 *       Its output is a GeoClaw gauge at each buoy's NDBC position, and its
 *       crest is taken from the gauge series by **the record's own rule**: the
 *       largest surface elevation in the window that runs from the arrival at
 *       250 m/s along the great circle less 30 min, never before 20 min after
 *       the origin, to 3 h after the arrival at 150 m/s.
 *
 *  210. **What makes a run a reference rather than a number.** A gauge of C2
 *       counts only if all three hold, and every exclusion is named:
 *       (a) the run finishes, with a gauge series covering the record's whole
 *           window — a run that stops early is declared and its event drops
 *           out of C2 by name, never by quietly leaving eight events;
 *       (b) it is converged: the event is run again with one further level of
 *           refinement over the source and the gauges, and a crest counts only
 *           if the two runs agree within **25 %**;
 *       (c) the buoy is in water on the raster: a gauge whose topography is
 *           above −50 m is excluded, because a 10 km raster can put a buoy on
 *           a shelf or on land, and a gauge on land is not a measurement of
 *           anything.
 *       C2 exists as a column only if it survives on at least **seven** of the
 *       nine events and **sixty** of the records. Below that the round reports
 *       what it has and T1 stays pending; it does not get scored on a handful
 *       of gauges.
 *
 *  211. **What is measured.** For each model and record, ln(model / observed)
 *       of the crest; an event's score is the median over its records; a
 *       model's bias is the median over events of those scores and its scatter
 *       their standard deviation — BM-05's own reading, unchanged, on all four
 *       of its variants, with C2 as a third column beside C0 and C1. The band
 *       beyond 7 000 km is read the same way as BM-05 reads its bands.
 *
 *       And, free from the same runs because a gauge series carries a time:
 *       the arrival, ln(time of the model's crest / the record's `crestAfterS`)
 *       for C2 and for Nimbus's own arrival-time solver at the same buoys.
 *       That is T3's quantity. It is *reported* here and decides nothing in
 *       this round: T3 asks for 90 % of the records within 5 % or 5 min, and
 *       whether that holds is a reading of its own.
 *
 *  212. **What decides T1.** Nothing in the physics is adopted by this round
 *       and no Nimbus number may move in it: the round measures a bar. T1 is
 *       **met** when both hold:
 *       (a) C2 exists by rule 210; and
 *       (b) |bias(C0)| ≤ |bias(C2)| + ln 1.25 on the headline reading, and the
 *           same on the other three — Nimbus no worse than the field's own
 *           tool, to within a quarter, on the same rows; together with the
 *           bound T1 already states and Nimbus already satisfies against the
 *           records (×1.25 at the median event, σ_ln ≤ 0.50, ×1.5 beyond
 *           7 000 km).
 *       If (b) fails, T1 stays open and this round's result is a gap with a
 *       measured size, which is what BM-05's row in the benchmark report
 *       becomes. Whichever way it falls the numbers are published: no reading
 *       is dropped for being unflattering, no variant is promoted after the
 *       fact, and this rule is not amended once the first C2 crest is read.
 *
 *  213. **What an outcome licenses.** If C2 beats C0 by more than ln 1.25,
 *       BM-05's own clause already says what follows and it is repeated here:
 *       Nimbus replaces the ring spreading with a propagation of that source,
 *       and the replacement is held to C2 within 15 % on these records before
 *       it ships. What no outcome licenses is a coefficient fitted to C2 on
 *       these rows. Rule 5 stands. These 113 records are the only deep-ocean
 *       set the project has, and a factor tuned on them would spend it for
 *       nothing — C2 is a reference to be matched, not data to be fitted.
 *
 *  214. **What these rules cannot settle.** Three things, said now rather than
 *       found later.
 *
 *       The source is a rectangle with uniform slip, not a finite-fault
 *       inversion. Davies 2019 (GJI 218: 1939) tested that family — Strasser
 *       et al. 2010 areas, uniform slip — against DART buoys with a full
 *       propagation model and found it biased low. A bias that C1 and C2 share
 *       is the source's and not the propagation's, and this round cannot tell
 *       the two apart. It is not meant to: it asks what the propagation does
 *       with the source Nimbus builds.
 *
 *       The seafloor is 10 km, and a tsunami modeller doing this for a living
 *       would refine to arcseconds at the coast. C2 is a reference for the
 *       deep-ocean propagation on a 10 km ocean, which is the question these
 *       buoys ask, and not a statement about the best GeoClaw can do.
 *
 *       And the run-up is not here. These are deep-ocean buoys in four to six
 *       kilometres of water; T2 asks about the wave at the shore, needs a coast
 *       resolved to something far finer than 10 km, and stays where it is —
 *       not met, at 3.69×, and declared.
 */

/*
 * One thing rule 210 left unsaid, fixed here before the first crest of a run
 * over real seafloor was read, and recorded so that it cannot later look like a
 * choice made after the fact.
 *
 * Rule 210(b) asks for two runs per event — the base, and one further level of
 * refinement over the source and the gauges — and says a crest counts only if
 * they agree within 25 %. It does not say which of the two C2 is. **C2 is the
 * refined run**: the base exists to test it, not to be averaged with it. In
 * this project's shape that is the run at 0.031° over the source and the
 * gauges, with 0.125° elsewhere, and the base is the same case at 0.125°
 * throughout.
 *
 * Two smaller things, for the same reason. The reference is run as its own
 * example configures it, so Coriolis is off and Manning's coefficient is 0.025
 * with GeoClaw's own `friction_depth` — deviating from the tool's own
 * configuration to make it look better or worse would be the whole point
 * missed. And where the raster the reference is given differs from what the
 * buoy reports, the raster's own depth at the gauge is recorded beside the
 * record's, so a reader can see it.
 */

/** T1's bounds, as `docs/GOLD_STANDARD.md` states them. */
export const T1_BOUNDS = {
  /** The median event's bias, as a factor either way. */
  medianEventFactor: 1.25,
  /** The scatter of the events' medians, in ln. */
  sigmaLn: 0.5,
  /** The band beyond 7 000 km, as a factor either way. */
  farFieldFactor: 1.5,
  farFieldFromKm: 7_000,
} as const;

/**
 * The amendment of 16 September 2026: a model meets a bound when it is no
 * worse than the reference on the same rows. "No worse" is a quarter, the same
 * margin BM-05 uses to decide between two models of its own.
 */
export const NO_WORSE_MARGIN_LN = Math.log(1.25);

/**
 * Rule 212(b). True when a bias of ours is no worse than the reference's on
 * the same rows — both as ln(model / observed), so the comparison is between
 * their distances from zero and the sign of neither matters.
 */
export function noWorseThanReference(oursLn: number, referenceLn: number): boolean {
  return Math.abs(oursLn) <= Math.abs(referenceLn) + NO_WORSE_MARGIN_LN;
}

/** Rule 210's guards, as numbers, so the harness cannot quietly relax one. */
export const C2_GUARDS = {
  /** (b) The two refinements must agree within this fraction at a gauge. */
  convergenceTolerance: 0.25,
  /** (c) A gauge whose raster topography is above this is on land. */
  minimumGaugeDepthM: -50,
  /** The column exists only above both of these. */
  minimumEvents: 7,
  minimumRecords: 60,
} as const;

/**
 * Rule 209. The reference, named precisely enough that someone else can run
 * the same thing.
 */
export const GEOCLAW_REFERENCE = {
  tool: 'GeoClaw',
  version: '5.14.0',
  solver: 'geoclaw (nonlinear shallow water, spherical coordinates, AMR)',
  builtOn: 'macOS 27, gfortran 16.2 (Homebrew), source release',
  reproduces: 'benchmark/results/geoclaw-chile2010-macos.json',
  bathymetry: 'AWS Terrain Tiles (terrarium), zoom 4, ~10 km, via terrainSampling.ts',
  source: "Okada on Nimbus's own rectangle (benchmark/dart/c0.json), as model C1",
} as const;

/**
 * Rule 209. The window a crest is read in, which is the record's own:
 * `docs/BENCHMARK_PROTOCOL.md`, "After the campaign: the far wave of a
 * megathrust". Returned in seconds after the origin.
 */
export function crestWindowS(distanceKm: number): { fromS: number; toS: number } {
  const rangeM = distanceKm * 1_000;
  return {
    fromS: Math.max(20 * 60, rangeM / 250 - 30 * 60),
    toS: rangeM / 150 + 3 * 3_600,
  };
}
