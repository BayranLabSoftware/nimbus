/**
 * The wave a land impact makes comes from the hole it digs, not from a column
 * it never fell through.
 *
 * Rule 249, written on 19 September 2026 before the round that preceded this
 * one and left standing by it on purpose: "A land impact is still handed a
 * water column it does not have. `oceanCouplingPartition` answers 'an
 * impactor of this size falling through this much water — how much energy
 * reaches the seafloor', and over dry ground the honest answer is all of it."
 *
 * What that costs, measured. For an impact on ground near a coast the chain
 * runs: `waterDepth` is the shore's own depth, `oceanCouplingPartition` turns
 * it into a water fraction, the wave is built on `ke · gf · f_water`, and
 * `computeSeaCoupling` multiplies by a reach fraction that is 1 whenever the
 * crater or the cavity reaches the shore. For Andrea's 1 km stone at Miami
 * the reach fraction IS 1, so the only thing setting the size of that wave is
 * f_water(4.2 m) = 0.0048 — a number that answers a question nobody asked.
 *
 * And the reach it is 1 for is a fiction. At Miami the shore is 5.06 km away.
 * The transient crater's radius is 3.35 km and the final rim's is 4.30: neither
 * reaches the sea. What reaches is `cavityAtFullCouplingM` = 5.87 km, the water
 * cavity the impact would have dug IF IT HAD HAPPENED IN THE SEA. A land
 * impact's wave is currently justified by a hole in water that is not there,
 * and sized by a coupling to water that is not over it.
 *
 * The geometry that IS there, and it needs no constant. A crater of radius R
 * whose centre lies a distance d from a straight coastline puts a circular
 * segment of itself beyond the shore:
 *
 *     f(R, d) = (θ − sin θ cos θ) / π,   θ = arccos(d / R),   0 ≤ d < R
 *
 * which is 0.5 when the centre is on the water's edge, 0.195 at d = R/2,
 * 0.019 at d = 0.9 R and 0 at d ≥ R. A land impact can never put more than
 * half its crater in the sea, which is the sanity the fiction lacked.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out: the whole chain above; the three radii at Miami; the closed form
 * and the table of f(R, d) it gives; and that `computeSeaCoupling`'s fraction
 * is 1 for every case where the crater or the cavity reaches the shore.
 *
 * The rules, fixed on 19 September 2026, before the candidate was written, and
 * numbered after the two hundred and sixty-six before them:
 *
 * 267. The candidate, first part. A land impact's crater is a land crater.
 *      The water column over the impact point is none, so
 *      `oceanCouplingPartition` is given none: the seafloor fraction is 1, the
 *      water fraction 0, and the crater, the dust and the seismic magnitude
 *      follow from the whole ground-coupled energy. This is rule 249's
 *      sentence and nothing more.
 *
 * 268. The candidate, second part. Where the crater reaches the sea, the
 *      wave's source is the part of the crater that is in the sea: the
 *      circular segment above, taken on the TRANSIENT crater, which is the
 *      cavity the excavation opens, and handed to the far field as the
 *      equal-area circular source of that segment. Everything downstream is
 *      untouched — the cap at the water depth, the shallow-or-deep regime,
 *      Ward & Asphaug, Wünnemann, Collins & Weiss, the run-up, the damping.
 *
 * 269. The candidate, third part, and the one that costs. Where the crater
 *      does not reach the sea, the model raises no wave. The ejecta do reach
 *      it — at Miami the 1 m isopach runs to 26 km — and a curtain of rock
 *      falling into water does raise something, but no published law sizes
 *      it, and the code's present answer routes it through the water column
 *      that is not there. A hazard the model cannot size is declared, not
 *      invented: the same treatment rules 261 to 266 gave the mass fire, for
 *      the same reason. It is written into the methodology page, the visual
 *      contract and the report, and it is named as a round of its own.
 *
 * 270. What decides. Nothing about the world: there is no coastal impact in
 *      the record, and these rules will not pretend otherwise. What is
 *      checked is exact.
 *      (a) The segment fraction equals the closed form at every distance,
 *          gives 0.5 at d = 0, 0 at d ≥ R, and never exceeds 0.5.
 *      (b) A land impact's crater, stratospheric dust and seismic magnitude
 *          are identical, to the bit, to the same body with no sea within
 *          reach at all. A sea five kilometres away may not shrink a crater.
 *      (c) An impact in open water is unchanged to the bit: same depth, same
 *          coupling, same cavity, same amplitudes, same toll.
 *      (d) The wave grows without a step as the shore nears and as the body
 *          grows: monotone in both, across a sweep.
 *      (e) The release gate stays PASS.
 *      Any of these failing refuses the candidate.
 *
 * 271. What is printed. Miami and Lisbon, and a sweep of shore distances for
 *      a 1 km stone: the crater, whether it reaches, the segment fraction, the
 *      cavity, the amplitude at a thousand kilometres and the drowned, before
 *      and after. Every toll of the calibration net that moves, with its band.
 *
 * 272. What may not happen. No constant is introduced — the segment is
 *      geometry and the rest is what was already there. No wave law, no
 *      run-up, no damping, no dispersion and no reach is re-tuned (rules 5
 *      and 6). If a toll falls to nothing, that is the result.
 *
 * What these rules cannot settle, and it is most of the subject. Whether an
 * ejecta curtain falling into the sea raises a wave worth counting: it surely
 * raises something, nobody has published how much, and after this round the
 * model says nothing where it used to say a number it could not justify —
 * which is a smaller error than the number, and is still an error. Whether a
 * crater breaching a lagoon four metres deep makes a tsunami or a surge that
 * dies against the first bank. And whether any of this is right, which no
 * measurement can say, because the Earth has not run the experiment where
 * anyone was counting.
 */

/**
 * The fraction of a crater of radius `R` lying beyond a straight coastline a
 * distance `d` from its centre — the circular segment, in closed form.
 *
 * Half when the centre is on the water's edge, nothing when the crater stops
 * short. There is no constant in it and nothing to tune.
 */
export function shoreSegmentFraction(radiusM: number, shoreDistanceM: number): number {
  if (!Number.isFinite(radiusM) || radiusM <= 0) return 0;
  if (!Number.isFinite(shoreDistanceM)) return 0;
  if (shoreDistanceM <= 0) return 0.5;
  if (shoreDistanceM >= radiusM) return 0;
  const theta = Math.acos(shoreDistanceM / radiusM);
  return (theta - Math.sin(theta) * Math.cos(theta)) / Math.PI;
}

/** The equal-area circular source of that segment, as a fraction of `R`. */
export function shoreSegmentEquivalentRadius(radiusM: number, shoreDistanceM: number): number {
  return radiusM * Math.sqrt(shoreSegmentFraction(radiusM, shoreDistanceM));
}

/** Rule 270(a): a land impact can never put more than half its crater in the
 *  sea, and the fraction is checked against this at d = 0. */
export const MAX_SHORE_SEGMENT_FRACTION = 0.5;

/**
 * The outcome of the round, written after the candidate was measured, on
 * 19 September 2026. The rules above were pushed in commit 9d966e6 before the
 * candidate was written.
 *
 * ADOPTED. Rule 270 holds on every clause.
 *
 * (a) The segment is the closed form to twelve places, a half at the water's
 *     edge, nothing at and past the rim, never more than a half, and falling
 *     without a step.
 *
 * (b) A sea five kilometres away no longer shrinks a crater. At every shore
 *     distance tried, a Chicxulub-class body's transient crater, final
 *     crater, stratospheric dust and seismic magnitude are identical to the
 *     bit to the same body with no sea in reach at all. At Miami the transient
 *     crater goes from 6.70 km to 7.17 and the dust from 49.1 Mt to 62.0 —
 *     the fifth of its energy it was losing to a sea it never touched.
 *
 * (c) An impact in open water is untouched: the column still suppresses the
 *     crater, the mechanism is still "water", the coupling still 1.
 *
 * (d) Monotone. Chicxulub, transient radius 45.8 km, against the shore:
 *
 *       shore     in the sea    cavity      A at 1 000 km
 *        1 km       48.61 %     31.90 km      14.562 m
 *       10 km       36.20 %     27.53 km      10.845 m
 *       20 km       23.09 %     21.99 km       6.917 m
 *       30 km       11.48 %     15.51 km       3.440 m
 *       40 km        2.63 %      7.42 km       0.788 m
 *       44 km        0.45 %      3.07 km       0.135 m
 *       46 km          —           —          no wave
 *       70 km          —           —          no wave
 *
 * (e) Gate PASS in strict mode, and no toll of the calibration net moved by
 *     one person: the net has no coastal impact row, which is the fourth
 *     round running that its silence has been the answer.
 *
 * What it cost, and rule 272 said it would be the result. Miami's 1 km stone
 * raises no wave at all now, where it drowned 895 642 people before the round
 * of the shore depth and 3 152 after it. Its transient crater's radius is
 * 3.58 km and Biscayne Bay is 5.06 km away: the hole does not reach the water.
 * Chicxulub seventy kilometres inland likewise, where the old model gave full
 * coupling on the strength of a final rim that slumping leaves behind after
 * the wave would have been made.
 *
 * The three things that are wrong with that, said plainly because the round
 * cannot fix them. The ejecta do reach the sea — at Miami the 1 m isopach runs
 * to 26 km — and a curtain of rock falling into water raises something; nobody
 * has published how much. A final crater whose rim encloses the coast drains
 * the sea into itself, which is a resurge, has its own literature in the
 * deposits at Chicxulub and Lockne, and has no law here. And the air blast
 * pushes on the water like a meteotsunami, which this model has never
 * counted. Each of the three makes the model understate a coastal land
 * impact; the number it printed before understated nothing and meant nothing.
 */
export const COASTAL_WAVE_OUTCOME =
  'ADOPTED 19 September 2026: a land impact keeps its whole energy and its whole crater, and its wave is the circular segment of the transient cavity that lies in the sea — half at the water\u2019s edge, nothing when the cavity stops short. No constant was introduced. Miami raises no wave, because its hole does not reach the water; the ejecta wave, the resurge and the meteotsunami are declared and unsized.';
