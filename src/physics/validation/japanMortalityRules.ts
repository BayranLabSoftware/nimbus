/**
 * The only two cities there are, read per head instead of per city.
 *
 * Hiroshima's row in the calibration net reads 0.89 × the record, and its
 * caveat says the model must OVERSHOOT, because the raster counts the
 * 1.2 million who live there now against the 350 000 who were there in 1945.
 * That reading was taken as a mortality too low by a factor of four. It is
 * not. The rings reach 4.49 km, which is 63 km² of a city of 906, and the
 * people inside them are of the same order as the 256 300 Glasstone & Dolan's
 * Table 12.09 puts at risk. The caveat compares a city with a footprint.
 *
 * Measured per head, against the book's own populations, the model kills too
 * many. Table 12.09 (page 544 of the 1977 edition, computed from Oughterson &
 * Warren 1956, "Medical Effects of the Atomic Bomb in Japan", ch. 4) resolves
 * both cities by distance, which no aggregate toll can do:
 *
 *                    people    killed   killed per head
 *   Hiroshima
 *     0 – 0.6 mile    31 200    26 700        85.6 %
 *     0.6 – 1.6        144 800    39 600        27.3 %
 *     1.6 – 3.1         80 300     1 700         2.1 %
 *     all              256 300    68 000        26.5 %
 *   Nagasaki
 *     0 – 0.6 mile    30 900    27 300        88.3 %
 *     0.6 – 1.6         27 700     9 500        34.3 %
 *     1.6 – 3.1        115 200     1 300         1.1 %
 *     all              173 800    38 000        21.9 %
 *
 * Against those, the model's own bands, area-weighted into the book's three
 * zones and applied to the book's own populations, layer by layer:
 *
 *                       0–0.6    0.6–1.6   1.6–3.1   all     against record
 *   Hiroshima
 *     blast              98.0 %   20.0 %    0.1 %   23.3 %      0.88 ×
 *     + burns            98.3 %   26.4 %    0.1 %   26.9 %      1.01 ×
 *     + mass fire        98.8 %   36.3 %    0.1 %   32.6 %      1.23 ×
 *     recorded           85.6 %   27.3 %    2.1 %   26.5 %      1.00 ×
 *   Nagasaki
 *     blast              98.0 %   23.0 %    0.2 %   21.2 %      0.97 ×
 *     + burns            98.3 %   32.4 %    0.2 %   22.8 %      1.04 ×
 *     + mass fire        98.8 %   48.1 %    0.2 %   25.4 %      1.16 ×
 *     recorded           88.3 %   34.3 %    1.1 %   21.9 %      1.00 ×
 *
 * Blast and burns together land on both cities — 1.01 × and 1.04 × — and the
 * middle zone, where most of the dead are, is nearly exact: 26.4 against 27.3,
 * 32.4 against 34.3. The mass fire on top of them is what breaks it, and it
 * breaks Nagasaki worst, where Glasstone & Dolan §7.72 records that NO fire
 * storm occurred at all. The model puts one there because it has no fuel map,
 * no wind and no terrain, which is the limitation rules 227 to 234 declared
 * three rounds ago. This is what that limitation costs: sixteen points of
 * mortality in Nagasaki's middle zone.
 *
 * What the field says about the layer itself. OTA 1979 stacks the same way —
 * its Table 5 computes burn casualties among "survivors of blast effects" —
 * and it does NOT add fire deaths to its Detroit case, because it concludes
 * (page 36) that "it is probable that fire spread would be slow and there
 * would be no firestorm". It holds a firestorm to want a fuel loading of at
 * least 8 lb/ft², where Hamburg had 32 and a typical U.S. city has 2, and it
 * says a firestorm "is likely to kill a high proportion of the people in the
 * area of the fire". So the field neither denies the hazard nor asserts it:
 * it asserts it only where the fuel says so, and Nimbus asserts it wherever
 * the fluence says so, which is not the same test.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out: Table 12.09 and §§12.08–12.17 of Glasstone & Dolan; OTA 1979
 * chapter II, its figure 1, its table 5 and its Detroit case; every number in
 * the two tables above, which is the finding; and the fact that the model
 * carries no initial-radiation hazard at all, where §12.16 puts 5 to 15 % of
 * Japan's fatalities.
 *
 * The rules, fixed on 19 September 2026, before the candidate was written, and
 * numbered after the two hundred and sixty before them:
 *
 * 261. The candidate. The mass fire stops adding deaths to the central
 *      estimate and widens the band upward instead: its mortality becomes
 *      0 at the low end and 0 in the middle, and keeps 0.8 at the high end.
 *      The hazard stays in the band it belongs to, so a reader still sees it
 *      named among the causes and still sees what it would cost if it
 *      happened; what goes is the model asserting that it did.
 *
 * 262. Why that and not a smaller number. Choosing a mortality that makes the
 *      two cities fit is tuning on the set being read, which rule 5 forbids.
 *      What can be said without tuning is structural: the model cannot tell
 *      whether a fire storm forms — §7.58 says nobody can, and three of its
 *      four requirements are outside anything this model holds — and on the
 *      one city in the record where one certainly did not, the model asserts
 *      one. A hazard the model cannot decide belongs in the band and not in
 *      the point estimate.
 *
 * 263. What decides. The two cities, per head, against Table 12.09.
 *      (a) Each city's total mortality within 25 % of the record.
 *      (b) The middle zone of each city — 0.6 to 1.6 miles, where two thirds
 *          of Hiroshima's dead and a quarter of Nagasaki's are — within 25 %.
 *      (c) The high end of the band still above the record on both cities:
 *          the fire storm must remain possible, not be deleted.
 *      (d) No constant other than FIRESTORM_MORTALITY is touched.
 *      (e) The release gate stays PASS.
 *      Any of these failing refuses the candidate.
 *
 * 264. What is printed and NOT gated, because each is a separate round:
 *      the innermost zone, where the model kills 98.3 % against a recorded
 *      85.6 % and 88.3 % — OTA's own figure 1 puts 98 % above 12 psi and Japan
 *      did not; the outermost, where the model kills 0.1 % against 2.1 % and
 *      1.1 %, because below 2 psi it carries no hazard at all; and the
 *      initial radiation, which §12.16 makes 5 to 15 % of Japan's fatalities
 *      and which this model does not count among an explosion's dead.
 *
 * 265. What is recorded whichever way it falls: every toll of the calibration
 *      net that moves, with its band and whether the record is still inside,
 *      and the release gate's verdict. An impact's mass fire is the same
 *      layer and moves the same way; it is stated rather than scored, because
 *      rule 263's rows are the two Japanese cities and there is no third.
 *
 * 266. What may not happen. No re-tuning to catch a toll that moves (rules 5
 *      and 6). The burn fluences, the exposed fraction, the third-degree
 *      mortality, the OTA bands, the delayed fraction and the two fire radii
 *      of rules 227 to 234 all stay exactly where they are.
 *
 * What these rules cannot settle. Whether blast-and-burns landing on both
 * cities is a fact about the model or a coincidence of two numbers pulling
 * opposite ways: the layers were not fitted here, but they were chosen by
 * people who knew Japan, and two cities is two cities. Whether a fire storm
 * adds deaths at all over a population already counted by an empirical
 * vulnerability curve — the record leaves no room for them at Hiroshima, and
 * "no room in the record" is not the same as "did not happen". And the whole
 * of rule 264, which is three findings this round is not allowed to touch.
 */

/** Table 12.09's zone edges, in metres: 0.6, 1.6 and 3.1 miles. */
export const JAPAN_ZONE_EDGES_M: readonly number[] = [
  0,
  0.6 * 1_609.344,
  1.6 * 1_609.344,
  3.1 * 1_609.344,
];

/** Table 12.09 itself, city by city: the people in each zone and the killed. */
export const JAPAN_ZONE_RECORD: Readonly<
  Record<'Hiroshima' | 'Nagasaki', { population: readonly number[]; killed: readonly number[] }>
> = {
  Hiroshima: { population: [31_200, 144_800, 80_300], killed: [26_700, 39_600, 1_700] },
  Nagasaki: { population: [30_900, 27_700, 115_200], killed: [27_300, 9_500, 1_300] },
};

/** Rule 263(a) and (b): the band a city's total and its middle zone must land
 *  in, as a fraction of the record. */
export const JAPAN_MORTALITY_TOLERANCE = 0.25;

/** The zone rule 263(b) is scored on — 0.6 to 1.6 miles. */
export const JAPAN_DECIDING_ZONE = 1;

/**
 * The outcome of the round, written after the candidate was measured, on
 * 19 September 2026. The rules above were pushed in commit 07f081d before the
 * candidate was written.
 *
 * ADOPTED. Rule 263 holds on every clause.
 *
 *   city        zone          recorded   model    ratio
 *   Hiroshima   0 – 0.6 mi      85.6 %   98.3 %   1.15 ×   (rule 264, not gated)
 *               0.6 – 1.6 mi    27.3 %   26.4 %   0.97 ×
 *               1.6 – 3.1 mi     2.1 %    0.1 %   0.05 ×   (rule 264, not gated)
 *               all             26.5 %   26.9 %   1.01 ×
 *   Nagasaki    0 – 0.6 mi      88.3 %   98.3 %   1.11 ×   (rule 264, not gated)
 *               0.6 – 1.6 mi    34.3 %   32.4 %   0.94 ×
 *               1.6 – 3.1 mi     1.1 %    0.2 %   0.22 ×   (rule 264, not gated)
 *               all             21.9 %   22.8 %   1.04 ×
 *
 * (a) Both totals inside a quarter, at 1.01 × and 1.04 ×, where before the
 *     round they were 1.23 × and 1.16 ×.
 * (b) Both middle zones inside a quarter, at 0.97 × and 0.94 × — the zone
 *     that holds two thirds of Hiroshima's dead and a quarter of Nagasaki's.
 * (c) The high end of the band still runs above the record on both cities, so
 *     the fire storm is still possible and still named; it is no longer
 *     asserted.
 * (d) FIRESTORM_MORTALITY is the only constant touched.
 * (e) Gate PASS in strict mode.
 *
 * Rule 265, recorded. One toll of the calibration net moved: Hiroshima, from
 * 93 466 to 81 885, on a band that went from 77 893 – 119 850 to
 * 65 756 – 100 886. The recorded range, 70 000 to 140 000, still meets it.
 * Nothing else in the net moved by one person, and no impact preset is in the
 * net to move. An impact's mass fire is the same layer and moved the same way.
 *
 * And a fourth finding, which is not a number but a sentence. The Hiroshima
 * row's caveat said the model must OVERSHOOT its record because the raster
 * counts 1.2 million where the city held 350 000. That is false and this round
 * is what shows it: the rings reach 4.49 km, 63 km² of a city of 906, and
 * Table 12.09 puts 256 300 people inside the same 3.1 miles in 1945. There is
 * no factor of three between the two populations; there is a city and a
 * footprint. The caveat is corrected with the round, because leaving a false
 * sentence in the report would cost more than the round gained.
 *
 * What the round did not settle, and named in advance (rule 264). The
 * innermost zone: the model kills 98.3 % where Japan recorded 85.6 and 88.3,
 * which is OTA's own figure 1 putting 98 % above 12 psi and Japan not. The
 * outermost: 0.1 % and 0.2 % against 2.1 and 1.1, because below 2 psi the
 * model carries no hazard at all. And the initial radiation, which §12.16
 * makes 5 to 15 % of Japan's fatalities and which an explosion's toll does
 * not count. Three rounds, and the second and third pull opposite ways from
 * the first.
 */
export const JAPAN_MORTALITY_OUTCOME =
  'ADOPTED 19 September 2026: the mass fire left the central estimate for the top of the band. Read per head against Table 12.09, Hiroshima goes from 1.23× to 1.01× and Nagasaki from 1.16× to 1.04×, with the middle zones at 0.97× and 0.94×. One toll moved, Hiroshima from 93 466 to 81 885, and its record still meets its band.';
