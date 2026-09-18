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
 *       the rings are, and by Faccioli's European relation for the row
 *       printed beside it. Where the law gives an intensity and not an
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
