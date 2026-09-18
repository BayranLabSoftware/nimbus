/**
 * The intensity at the epicentre, and the rings that should follow from it.
 *
 * Thirty scenarios were opened on the product's own report page on 18
 * September 2026. A Mw 7.5 three hundred kilometres down prints MMI 9.3 at
 * the epicentre and does not draw an MMI VII ring anywhere. A Mw 9.0 on an
 * interface prints 10.7 and draws no MMI IX ring. A Mw 7.8 prints 9.6 and
 * draws no MMI IX ring. Both statements are on the same page and they cannot
 * both be true: an intensity of 9.3 at the epicentre *is* a region of
 * intensity IX around it.
 *
 * They come from different laws. The rings are drawn by the law rules 17 to
 * 19 chose on 370 ShakeMaps — Boore et al. 2014 — or, where the scenario says
 * so, by the interface model of rules 35 and 36 or the intraslab model of
 * rules 66 to 70, each with the site term of rule 20 and the residual of rule
 * 71, and each inverted for the acceleration Worden et al. 2012 puts under an
 * intensity. The epicentral intensity is Joyner & Boore 1981 evaluated at
 * distance zero, with no site term, and — this is the part that shows at 300
 * km — **no depth at all**: `peakGroundAcceleration` takes a magnitude and a
 * distance and nothing else, so a slab event three hundred kilometres down
 * shakes its epicentre exactly as hard as a crustal one ten kilometres down.
 *
 * Every one of those inverses already computes the number this round wants.
 * `epicentralDistanceForSlabPga`, `distanceForInterfacePga`,
 * `epicentralDistanceForInterfacePga` and
 * `epicentralDistanceForIntensityAllen2012` each begin by evaluating their
 * own law at epicentral distance zero and return a radius of zero when that
 * value is below the threshold. The ring already knows what the ground does
 * at the epicentre; the report simply asks somebody else.
 *
 * The rules, fixed on 18 September 2026 and numbered after the hundred and
 * ninety-one before them, pushed before anything is measured:
 *
 *  192. **What was looked at.** The thirty reports of 18 September; the five
 *       scenarios reproduced above; `events/earthquake/simulate.ts` and the
 *       four attenuation modules behind its rings; and which parts of the
 *       product read the epicentral intensity, which are the panel, the
 *       report and the Monte-Carlo summary — no toll is counted in it. The
 *       ShakeMap peak intensities of the atlas set have **not** been compared
 *       with a model number for this round.
 *
 *  193. **The candidate (`ringLawAtZero`).** The intensity at the epicentre
 *       is read from the law that draws the rings, at epicentral distance
 *       zero, with the same site term and the same event residual the rings
 *       carry: the `at(0)` each ring's own inverse already evaluates.
 *       Concretely, the intraslab model at a hypocentral distance equal to
 *       the depth; the interface model at the rupture distance its own ring
 *       stands on; Allen, Wald & Worden 2012's intensity at a hypocentral
 *       distance equal to the depth; Boore et al. 2014's acceleration, or its
 *       velocity where rule 31 draws the rings on velocity, at the Joyner–
 *       Boore distance a point source has above itself; and Joyner & Boore
 *       1981 times the site factor where that is still the law. The
 *       acceleration is turned into an intensity by Worden et al. 2012, as
 *       the rings are, and by Faenza & Michelini 2010's European relation for
 *       the row printed beside it — which this rule first named after the
 *       wrong author, corrected the same evening and recorded in the outcome
 *       below rather than quietly. Where the law gives an intensity and not an
 *       acceleration — Allen 2012 — the European row is taken from the
 *       acceleration Worden's relation puts under that intensity, and this is
 *       a stated convention, not a measurement.
 *
 *       The rings themselves are not touched. Not one line of `contourAt`
 *       changes, and guard (b) is what proves it.
 *
 *  194. **What decides.** Coherence is not a candidate: a page that says the
 *       ground reached intensity 9.3 and draws no region of intensity IX is
 *       wrong whatever a set says, and the candidate is the only reading of
 *       the epicentre that cannot contradict the rings. So the change lands
 *       if its guards hold:
 *       (a) over a declared grid of magnitudes, depths, fault types and laws,
 *           an MMI k ring exists exactly when the epicentral intensity is at
 *           least k, for k = 7, 8, 9 — by construction, and pinned by a test;
 *       (b) no ring radius moves: no number of `docs/VALIDATION_REPORT.json`
 *           changes, and the contour, interface, slab and atlas rules stay
 *           exactly where they are;
 *       (c) the release gate stays PASS and the suite stays green.
 *
 *  195. **What is measured, and what the reading decides.** The 1 101 events
 *       of the atlas set carry their ShakeMap's peak intensity (`maxMmi`,
 *       read on 15 September 2026 for rules 56 and after, and therefore not
 *       held out). Each is run as the atlas rules run it — its magnitude,
 *       depth and fault type, the Vs30 of its site from `ATLAS_SITES`, an
 *       interface scenario where `isInterfaceEvent` says the map used one —
 *       and the model's own peak, which is its epicentral intensity, is put
 *       beside the map's. Reading, for the law in place and for the
 *       candidate: the mean of model minus map in intensity units, its σ, and
 *       the share within one intensity unit.
 *
 *       What the reading decides is what the product **says**, not whether
 *       the change lands. If the candidate reads nearer the maps, the report
 *       says the epicentral intensity was wrong and is now measured. If it
 *       reads further, the report says so in the same breath as the fix: the
 *       epicentral intensity is now coherent with the rings and is biased by
 *       the amount measured, which is a property of the ring law and belongs
 *       to the rules that chose it. Nothing is tuned either way — no
 *       threshold, no site term and no law is moved to improve this number
 *       (rule 5).
 *
 *  196. **What these rules cannot settle.** A ShakeMap's peak intensity is
 *       not an observation: for an event of 1973 it is that program's own
 *       ground-motion model, drawn on no stations and no felt reports, and
 *       the atlas says for each row how many of each it had. It is also a
 *       peak over a map, which for a long rupture is somewhere along the
 *       fault rather than above the hypocentre, while the model's peak is at
 *       the epicentre by construction because its rings are concentric. What
 *       this reading measures is the agreement of two models at the strongest
 *       point of each, and that is what it will be called.
 */

/*
 * ===========================================================================
 * The outcome of rules 192 to 196, 18 September 2026: DONE
 * ===========================================================================
 *
 * The rules were pushed in `af73931`, before a number was measured.
 *
 * The cure. The epicentre is the ring law at zero. A Mw 7.5 three hundred
 * kilometres down reads MMI 5.0 where it read 9.3, and draws no MMI VII ring,
 * which is now the same statement twice. A Mw 9.0 on an interface reads 8.6
 * where it read 10.7, with an MMI VIII ring and no IX. A Mw 4.5 at 10 km reads
 * 4.9 where it read 6.6.
 *
 * The guards.
 * (a) Over 224 scenarios — seven magnitudes, eight depths from 5 to 300 km,
 *     three fault types, and an interface at each magnitude and depth — that
 *     is 672 statements, and again over every contour law, three residuals,
 *     the velocity measure and PAGER's banding: a ring of intensity k exists
 *     exactly when the epicentre reaches k
 *     (`epicentralIntensityRules.test.ts`).
 * (b) No ring radius moved: no number of `docs/VALIDATION_REPORT.json`
 *     changed, and the contour, interface, slab and atlas rules are where they
 *     were. Two tests had to change, and they are the interesting ones: both
 *     asserted that a law which moves the rings "changes only the rings", and
 *     that assumption *was* the defect. They now say that the epicentre moves
 *     with the rings, and why.
 * (c) The gate stays PASS and the suite is green.
 *
 * The reading (rule 195, `scripts/benchmark/peak-intensity.ts`,
 * `benchmark/results/peak-intensity-2026-09-18.json`). 1 100 events of the
 * atlas carry a ShakeMap peak intensity; the model's peak against it, in
 * intensity units:
 *
 *                            mean      σ     within 1
 *   in place (JB81 at zero)  +2.14   1.08     15.2 %
 *   candidate (ring law)     +1.96   1.12     15.7 %
 *
 * and where it moves most, Mw ≥ 7.5: +2.85 → +1.78, within one 9.2 % → 20.0 %.
 * The candidate reads nearer the maps on the mean everywhere and is a little
 * wider in σ. The slab law is not exercised at all: rule 56's query stopped at
 * 71 km, so the atlas holds no event deeper than that, and the reading says
 * nothing about the case the defect was loudest on.
 *
 * What the reading does **not** say, and this matters more than the numbers
 * above. A bias of +2 intensity units is not a model reading two units hot: it
 * is dominated by rows where the two peaks are not in the same place. The
 * worst are Tonga, Fiji, Kermadec, the Azores — epicentres in open ocean,
 * where a ShakeMap's peak is the intensity at the nearest land and the model's
 * is at the epicentre. Splitting the set on the elevation the atlas read under
 * each epicentre gives +1.19 on the 491 events on land and +2.58 on the 609 at
 * sea.
 *
 * **That split is a diagnostic and not a score.** It was found after the
 * reading, by looking at which rows were worst, and rule 195 declared the
 * whole set. It is recorded because the alternative is to let the report say
 * "biased +2 against ShakeMaps", which would be a false statement about the
 * model; a round that wants to stand on a land-only reading must declare it
 * first and read it again.
 *
 * One correction to the rules above, made after they were pushed: rule 193
 * called the European conversion Faccioli's. It is Faenza & Michelini 2010,
 * as `intensity.ts` has always said and as the report prints. The rule's text
 * is fixed; nothing it requires changed.
 *
 * What is left open, and named in docs/SCIENCE.md: on land the model's
 * strongest shaking still reads about one intensity unit above the map's. The
 * rings are drawn in Joyner–Boore distance, and a point source's own distance
 * above itself is zero unless rule 51's averages are switched on — which they
 * are not by default. Whether turning them on closes that unit is a question
 * for a round with its rules written first, and it was not asked here, because
 * asking it now would be choosing a law after seeing a set (rule 5).
 */

/** Rule 193: where the intensity at the epicentre comes from. */
export type EpicentralIntensityLaw = 'joynerBoore1981Point' | 'ringLawAtZero';

/** The law in place until 18 September 2026 and the candidate. */
export const EPICENTRAL_INTENSITY_IN_PLACE: EpicentralIntensityLaw = 'joynerBoore1981Point';
export const EPICENTRAL_INTENSITY_CANDIDATE: EpicentralIntensityLaw = 'ringLawAtZero';

/** Rule 194 (a): the intensities whose rings must follow the epicentre. */
export const COHERENT_RING_INTENSITIES: readonly number[] = [7, 8, 9];

/** Rule 195: one event's two peaks. */
export interface PeakIntensityPair {
  comcat: string;
  magnitude: number;
  depthKm: number;
  /** The ShakeMap's peak intensity. */
  mapMmi: number;
  /** The model's peak, which is its epicentral intensity. */
  modelMmi: number;
}

/** Rule 195: the reading over a set of events. */
export interface PeakIntensityReading {
  events: number;
  /** Mean of model minus map, in intensity units. */
  meanDifference: number;
  sigma: number;
  /** The share of events the model puts within one intensity unit. */
  withinOne: number;
}

export function readPeakIntensities(pairs: readonly PeakIntensityPair[]): PeakIntensityReading {
  const diffs = pairs.map((p) => p.modelMmi - p.mapMmi);
  const n = diffs.length;
  const mean = n === 0 ? 0 : diffs.reduce((a, b) => a + b, 0) / n;
  const variance = n < 2 ? 0 : diffs.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
  return {
    events: n,
    meanDifference: mean,
    sigma: Math.sqrt(variance),
    withinOne: n === 0 ? 0 : diffs.filter((d) => Math.abs(d) <= 1).length / n,
  };
}
