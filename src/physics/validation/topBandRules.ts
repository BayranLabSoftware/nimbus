/**
 * Geometry and curves together: the footprint that is right, and a band
 * that stops charging an intensity the earthquake never reaches.
 *
 * WHAT WAS LOOKED AT BEFORE THESE RULES WERE WRITTEN, all of it from runs
 * already published, and two new measurements named as such.
 *
 * Rules 427 to 434 built a geometry — the surface projection, the stadium
 * at every magnitude, the dip of the structure the strike came from — that
 * reads 1.15x at MMI VII and 1.11x at MMI VIII against 110 and 59 of the
 * jury's ShakeMaps, where the geometry in place reads 0.51x and 0.24x. It
 * was refused on the dead. Rules 435 to 439 then measured what it costs on
 * rule 23's 805 quiet earthquakes: the count raised to a toll of ten goes
 * from 23 to 51.
 *
 * Their joint conclusion was that the vulnerability curves had been
 * absorbing the geometric error. Before writing a round on that, three
 * things were checked, and the first two say it is NOT so:
 *
 *   1. The shape the toll counts in. The tolls count people inside a
 *      STADIUM while the map is measured on a FIELD, so the two could have
 *      disagreed. Measured on the same 116: the stadium reads 0.206x where
 *      the field reads 0.393x, and 0.843x where the field reads 1.137x.
 *      The stadium is SMALLER, so nothing is over-counted by it; if
 *      anything the toll chain has been fed an exposure five times too
 *      small, not two and a half.
 *
 *   2. The band's representative intensity, against the area-weighted mean
 *      of PAGER's own curve across that band. For Korea, Haiti, Chile and
 *      the Philippines at Mw 6.2 the midpoint is 0.8x to 1.1x of the true
 *      mean. The banding is sound and was not the compensation.
 *
 *   3. The TOP band, which has no ceiling. `casualties.ts` charges the
 *      topmost ring a fixed midpoint — 9.5, 8.5 or 7.5 — whatever the
 *      earthquake actually reaches. Every other band is bounded above by
 *      the next ring and its midpoint is right. The top one is bounded by
 *      the event's own peak, and nothing bounds it.
 *
 * WHAT THAT COSTS, measured on the six loudest quiet earthquakes — the
 * ones the last round named, where the model kills people who did not die:
 *
 *   usp000h60j  Mw 6.0  Haiti       peak MMI 8.25, charged 8.5
 *   us6000rcnw  Mw 6.2  Venezuela   peak MMI 8.33, charged 8.5
 *   us7000pn9z  Mw 6.7  Myanmar     peak MMI 8.21, charged 8.5
 *   us20002bi4  Mw 6.1  Nepal       peak MMI 8.02, charged 8.5
 *   us6000hz9v  Mw 6.0  Iran        peak MMI 8.19, charged 8.5
 *   us20004zp9  Mw 6.3  Indonesia   peak MMI 8.33, charged 8.5
 *
 *   Not one of them reaches 8.5 anywhere, and every person in their
 *   topmost band is charged the fatality rate of 8.5. On Haiti's curve
 *   (theta 10.50, beta 0.169) that is 1.6 times the rate its true middle
 *   of 8.12 deserves; on Korea's (beta 0.10) it is more than three.
 *
 *   It bites hardest exactly where the false alarms are. A great
 *   earthquake's peak sits well above its top threshold and the midpoint is
 *   about right; a moderate one's peak sits just above, and the model
 *   charges half a degree of shaking that does not exist. With a footprint
 *   five times too small that error was carried by few people. With the
 *   footprint right it is carried by all of them.
 *
 * SO THIS IS NOT A RE-FIT. Nothing here touches PAGER's theta, beta or g.
 * The curve is PAGER's, unchanged; what changes is that the model stops
 * evaluating it at an intensity it has itself said does not occur.
 *
 * The rules, fixed on 20 September 2026, numbered after the 439 before
 * them:
 *
 *  440. The band's candidate, with no free parameter. The representative
 *       intensity of the TOPMOST band of a shaking plan is the middle of
 *       what that band actually spans: (threshold + peak) / 2, where the
 *       peak is the intensity the scenario's own law gives at the
 *       epicentre, on the ground the scenario stands on. Every other band
 *       keeps threshold + 0.5, because the ring above it is its ceiling and
 *       that midpoint is already the middle of what it spans.
 *
 *       Both directions, not one. Where the peak is below threshold + 1 the
 *       rate falls; where a great earthquake's peak is above it the rate
 *       RISES, and the round does not get to keep only the half that
 *       flatters it. A candidate written to lower tolls would have capped
 *       it at threshold + 0.5; this one does not.
 *
 *  441. And nothing else about the plan moves. The bands' radii, the
 *       population, the hazards, the delayed dead, the scatter drawn from
 *       PAGER's g: all unchanged. A test holds a plan whose peak is exactly
 *       threshold + 1 to be identical to the plan built today, to the last
 *       digit, so that what moves is only what rule 440 says.
 *
 *  442. The arms, four, in one run, because this round changes two things
 *       and has to show each on its own:
 *
 *         in place  the geometry and the bands as they ship;
 *         C         the geometry of rules 427 to 434, bands as they ship;
 *         D         the band of rule 440, geometry as it ships;
 *         E         both — the proposal.
 *
 *       C is already measured and is run again here so that all four come
 *       from one run. D is what isolates the band.
 *
 *  443. Judged on all three sets, in the same run, because the whole point
 *       is that they cannot be judged apart:
 *
 *       (a) THE MAP, on rule 405's 116 ShakeMaps: rule 424's six clauses,
 *           unchanged, with `boore2014` deciding.
 *       (b) THE DEAD, on the net rows: no fewer records inside their
 *           predictive band than the geometry in place, and none lost.
 *       (c) THE QUIET, on rule 23's 805: the count raised to a toll of ten
 *           no higher than the 23 the geometry in place reads.
 *
 *  444. Adoption. An arm is adopted only if it passes (a), (b) and (c)
 *       together. If arm E passes and the others do not, the pair is
 *       adopted as a pair and the report says that neither half would have
 *       passed alone — which is the finding this round exists to test.
 *
 *  445. What is printed whatever happens: all four arms on all three sets,
 *       the six quiet earthquakes above by name and toll under each arm,
 *       and — because rules 435 to 439 found the bands uninformative — the
 *       median log width of the quiet bands under each arm, deciding
 *       nothing.
 *
 *  446. One run, no re-tuning. No threshold, bound, dip or curve is
 *       adjusted after a number is seen. If every arm fails, what ships
 *       stays and the numbers are published as they came.
 *
 *  447. And what this round may not do. It may not change PAGER's theta,
 *       beta or g, nor which country borrows which curve, nor the
 *       population raster. If the tolls are still wrong when the footprint
 *       is right and the band is bounded, that is a finding about the
 *       vulnerability table, and it belongs to a round that says so before
 *       it runs.
 */

export const TOP_BAND_RULES = 'rules 440 to 447, fixed 20 September 2026';

/**
 * Rule 440: the intensity the topmost band is charged at.
 *
 * `threshold` is the band's own MMI — 7, 8 or 9 — and `peakMmi` what the
 * scenario reaches at its epicentre. A band that is not the topmost one
 * has the next ring above it and keeps the midpoint it has today, which
 * this function gives when the peak is a whole degree above or more.
 */
export function topBandIntensity(threshold: number, peakMmi: number): number {
  if (!Number.isFinite(peakMmi)) return threshold + 0.5;
  // A peak below the band's own threshold means the band should not exist;
  // charging less than the threshold would be inventing gentleness, so the
  // floor is the threshold itself.
  const top = Math.max(threshold, peakMmi);
  return (threshold + top) / 2;
}
