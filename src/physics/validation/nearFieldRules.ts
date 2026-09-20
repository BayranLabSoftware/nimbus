/**
 * Near field and far field: one question, but only a law that can hear it.
 *
 * Rules 465 to 471 left a sentence to answer: "one equation is being asked
 * two questions... the one in Joyner-Boore distance has the far field and
 * saturates at the source; the one in hypocentral distance has the source
 * and spreads the far field three times too wide."
 *
 * THE FIRST CANDIDATE THIS ROUND TRIED IS REFUTED BY A PROPERTY TEST,
 * BEFORE ANY EVIDENCE WAS SPENT, and the refutation is the finding.
 *
 * The obvious fix looked like a distance. Boore et al. 2014 takes R_JB and
 * this model hands it ZERO at the epicentre of a point source. Thompson &
 * Worden (2018) average R_JB over every rupture a hypocentre could belong
 * to; ShakeMap 4.0 to 4.2 drew every map without a finite rupture on them;
 * `pointSourceDistance.ts` carries them, held to ps2ff by its test; and
 * `simulate.ts` line 930 already reads them into the epicentral distance
 * where a scenario asks. So the fix appeared to be one input away.
 *
 * It is not, and the reason is definitional. R_JB IS A HORIZONTAL
 * DISTANCE — the distance to the SURFACE PROJECTION of the rupture. A site
 * at the epicentre of an earthquake ten kilometres down stands directly
 * above that projection, so its R_JB is zero, and Thompson & Worden agree
 * it is zero. They are right. Turning the correction on changes the
 * epicentral intensity by NOTHING, at any magnitude and any depth, which a
 * test in this file records.
 *
 * What Boore has instead is `h`, a fixed coefficient inside
 * sqrt(R_JB² + h²) — about 4.5 km for every earthquake it has ever been
 * asked about. Its nearest possible site is 4.5 km away whether the
 * rupture is at 5 km or at 35. NO CHOICE OF DISTANCE CAN GIVE A LAW A
 * DEPTH ITS DISTANCE DOES NOT MEASURE.
 *
 * SO THE NEAR FIELD AND THE FAR FIELD ARE ONE QUESTION, AND THE ANSWER IS
 * A LAW AND NOT A DISTANCE. Only a relation whose distance carries the
 * source can be asked about the source: R_rup, which at the epicentre is
 * the depth to the top of the rupture, or R_hyp, which is the hypocentral
 * depth. The repository has both — Campbell & Bozorgnia 2014 and Allen et
 * al. 2012 — and rules 465 to 471 measured them at +1.35 and +0.58 against
 * the shipped law's +1.96.
 *
 * AND THE AREAS THAT REFUSED CB14 FOUR TIMES WERE NEVER MEASURED WITH THE
 * GEOMETRY THAT WORKS. Every round changed one thing, faithfully, and the
 * consequence is a combination nobody has run: rules 405 to 411 scored CB14
 * on the geometry of that day; rules 427 to 434 fixed the geometry and
 * scored it with `boore2014` deciding. The figures each round printed
 * beside its own verdict, deciding nothing, are:
 *
 *   boore2014, geometry in place     0.393x   0.56x  0.22x  1.27x
 *   CB14, geometry of rules 427-434  1.376x   1.62x  1.36x  1.16x
 *
 * Every cell of the second is closer to 1 than the cell above it,
 * INCLUDING the Mw >= 7.5 cell that refused CB14 in the round before
 * this one. That reading was printed as a side figure in the dip round and
 * no rule has ever scored it. This round scores it.
 *
 * The rules, fixed on 20 September 2026, numbered after the 471 before
 * them:
 *
 *  472. The candidate: `campbellBozorgnia2014` — a law whose distance is
 *       R_rup and therefore carries the depth to the epicentre — TOGETHER
 *       WITH the geometry of rules 427 to 434: the surface projection, the
 *       stadium at every magnitude, and the dip of the structure the
 *       strike came from. The pair, because the peak needs the law and the
 *       areas need the geometry, and four rounds have now shown that
 *       neither alone survives the other's clause.
 *
 *  473. Run beside it and deciding nothing: `allen2012Hypocentral` on the
 *       same geometry, which reads the peak best of anything here and the
 *       rings worst; and the shipped pairing, which is the baseline. And
 *       `boore2014` with Thompson & Worden's distance, printed to show it
 *       moves the peak by nothing, so that nobody tries it again.
 *
 *  474. What may not be claimed. This round changes the law AND the
 *       geometry, so it cannot attribute. It says whether the PAIR is
 *       better than what ships, and the rounds that isolated each half are
 *       cited rather than repeated. A pair adopted here is adopted as a
 *       pair.
 *
 *  475. The measurements, both, from the rounds that established them and
 *       neither weakened:
 *
 *       (a) THE PEAK on rule 465's 1 100, whose jury passes rule 466's
 *           gate, with the split by the record's own peak that rule 468
 *           asks for — because a candidate that fixes the average while
 *           leaving the slope is a candidate that has not fixed
 *           saturation;
 *       (b) THE AREAS on rule 405's 116, by rule 424's cells.
 *
 *  476. The verdict, and it is the same conjunction that has refused
 *       everything since rule 405, kept deliberately:
 *
 *       (a) the mean peak bias closer to zero by `PEAK_MARGIN_MMI` and no
 *           wider a spread;
 *       (b) the areas no worse by more than `PEAK_AREA_MARGIN` in any
 *           cell, and no further from 1 overall.
 *
 *       It is kept, though this candidate moves two things, because the
 *       two defects it addresses are the two the conjunction measures. A
 *       conjunction deadlocks when each change fixes one clause and breaks
 *       another; it does not deadlock when a change fixes both. Ten rounds
 *       have adopted nothing. If this pair passes, the conjunction was
 *       never the obstacle and the coupling was. If it fails, the
 *       conjunction itself is the next thing on trial and those ten rounds
 *       will have earned the right to put it there.
 *
 *  477. One run, no re-tuning. If it fails, the shipped law stays and the
 *       peak stays wrong by a published amount.
 */

export const NEAR_FIELD_RULES = 'rules 472 to 477, fixed 20 September 2026';

/**
 * Rule 476's reading of a slope: how much the peak bias falls per degree
 * of the record's own peak.
 *
 * A saturating law reads a steep negative slope — very hot where the
 * record is cold, about right where the record is hot. A law that carries
 * the source reads flat. Rules 465 to 471 measured the shipped law at
 * roughly -1.0 a degree, from +3.68 below MMI 5 to -0.38 above MMI 8.
 *
 * Least squares on the band means, which is what the published table is.
 */
export function saturationSlope(
  bands: readonly { recordMmi: number; meanBias: number }[]
): number | null {
  const usable = bands.filter((b) => Number.isFinite(b.recordMmi) && Number.isFinite(b.meanBias));
  if (usable.length < 2) return null;
  const n = usable.length;
  const mx = usable.reduce((a, b) => a + b.recordMmi, 0) / n;
  const my = usable.reduce((a, b) => a + b.meanBias, 0) / n;
  let num = 0;
  let den = 0;
  for (const b of usable) {
    num += (b.recordMmi - mx) * (b.meanBias - my);
    den += (b.recordMmi - mx) ** 2;
  }
  return den > 0 ? num / den : null;
}
