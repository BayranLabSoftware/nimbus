/**
 * THE ADOPTION OF 20 SEPTEMBER 2026 — the first this line of rounds has
 * made, and it was made by the project's owner and not by a clause.
 *
 * Fourteen rounds, rules 405 to 494, adopted nothing. Rule 491 said why
 * that would keep happening and what to do instead: where no cell of the
 * factorial dominates the shipped model, no clause may choose, the
 * frontier is published, and the choice belongs to whoever owns the
 * project. He chose the best-areas cell; the gate of B-083 was repaired
 * first because the old one could not see a tenfold seam; the frontier
 * was re-filtered; the cell held every property; it ships.
 *
 * WHAT IS ADOPTED, three defaults and nothing else:
 *
 *   stadiumWidth          downDip     ->  surfaceProjection   (rule 419)
 *   topBand               midpoint    ->  toPeak              (rule 440)
 *   pointSourceDistance   epicentral  ->  thompsonWorden2018  (rule 51)
 *
 * NOT adopted, and still reachable by name: `campbellBozorgnia2014`,
 * `extendedSource: 'always'`, the structure dip. The contour law is still
 * Boore et al. 2014 and the extended-source threshold is still Mw 7.5.
 *
 * WHAT IT IS MEASURED AT, from the factorial of rules 488 to 494 and its
 * re-filter:
 *
 *   | objective                     | before  | after     |
 *   | ----------------------------- | ------- | --------- |
 *   | areas, |ln bias| on the 116   | 0.935   | **0.022** |
 *   | peak, |mean bias| on 1 100    | 1.956   | 1.956     |
 *   | the dead, interval score      | 204.1   | **198.2** |
 *   | the quiet, interval score     | 1 195   | 1 547     |
 *   | worst area step, P-CONT-AREA  | x9.19   | **x1.87** |
 *
 *   The map is centred: a geometric mean area ratio of 1.022 against
 *   0.393. The dead are better. The peak is untouched, because R_JB is
 *   horizontal and no correction to it carries depth — that defect is
 *   measured, published and NOT fixed here. The quiet earthquakes cost
 *   29 %, which is the price the owner chose to pay and which this file
 *   records as a price and not as a detail.
 *
 * AND IT CLOSES B-083. The seam at Mw 7.5 — 622 km2 of ground at Mw 7.4
 * and 6 323 at Mw 7.5, a factor of ten for a tenth of a magnitude — is
 * now a factor of 1.87, inside what P-CONT-AREA allows. The worst step in
 * the whole magnitude range has moved to Mw 5.2, which is the second seam
 * the repaired gate found and which nobody has diagnosed.
 *
 * WHAT MOVED THAT A READER SHOULD KNOW, rule 44's figures and three of
 * them are more than figures:
 *
 *   1. THE LAW IN PLACE NOW SEES THE DEPTH, BARELY. Thompson & Worden's
 *      distance is computed from the magnitude AND the depth, so Boore's
 *      ring moves with it: 15 911 m at 10 km against 15 830 at 35, half a
 *      per cent. It does not close the depth defect — a law that carries
 *      the depth draws no MMI VII ring at all at 35 km — but the claim
 *      "the law in place does not see the depth" is no longer true and
 *      its test says so.
 *
 *   2. RULE 18 WOULD NOW CHOOSE A DIFFERENT LAW. Re-run on the adopted
 *      geometry, its comparison picks `boore2014FromMw7.5` over the one
 *      that ships. Rule 44 keeps rule 19's verdict and moves its figures,
 *      so nothing changes; but the law and the geometry were each chosen
 *      against the other, and a round that re-opens rule 18 on this
 *      geometry now has a reason to.
 *
 *   3. THE SIX FIXTURES DO NOT ALL IMPROVE. Northridge goes 0.32 to 0.733
 *      and 0.0831 to 0.484; Kokoxili gets worse; L'Aquila goes 2.03 to
 *      6.822 and Amatrice 6.08 to 17.451. Those two are the Apennine
 *      normal faults both laws already overdrew, and a wider ring
 *      overdraws them further. The 116 are the jury and the six are not,
 *      but a reader who looks at the six should find that said rather
 *      than discover it.
 *
 * AND THREE COUPLINGS THE DEFAULTS INTRODUCE, each recorded in the test
 * that found it. The point-source distance is read only where a scenario
 * is NOT extended and NOT deep, and the surface projection only where it
 * is not deep and not a marked interface — so `extendedSource`,
 * `interfaceStadium` and `deepLaw` now each flip a second convention
 * along with their own. The tests that assert "this flag changes only
 * that" name the old conventions on both sides and say why.
 */

export const ADOPTION = {
  on: '2026-09-20',
  chosenBy: 'the project owner, from the re-filtered frontier of rules 488 to 494',
  defaults: {
    stadiumWidth: 'surfaceProjection',
    topBand: 'toPeak',
    pointSourceDistance: 'thompsonWorden2018',
  },
  before: { areas: 0.935, peak: 1.956, dead: 204.1, quiet: 1195, worstAreaStep: 9.19 },
  after: { areas: 0.022, peak: 1.956, dead: 198.2, quiet: 1547, worstAreaStep: 1.87 },
} as const;
