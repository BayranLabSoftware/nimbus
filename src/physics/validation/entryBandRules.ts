/**
 * Rules 739 to 747 — the band of an impact's entry altitude, built on the
 * fireballs already read and frozen before any new one is. For impacts,
 * 21 September 2026, IMP-4 of ROADMAP.md M11; written and pushed before any
 * percentile of any cell has been computed.
 *
 * RULE 739. WHAT THIS ROUND IS. G3 asks that each quantity a domain's rules
 * name carry a band that holds about nine records in ten of a held-out set.
 * For an impact the quantity is I2's, the altitude at which the entry spends
 * the body's energy. The band is the model's burst altitude plus the 5th and
 * the 95th percentile of the model's error — the altitude of peak brightness
 * the sensors recorded, less the model's burst altitude — over the fireballs
 * of the scenario's measured cell (rules 722 to 729). The error is sampled,
 * not modelled: no distribution is fitted to it.
 *
 * RULE 740. THE ROWS IT IS BUILT ON. The 357 fireballs of rules 76 to 79, run
 * as rule 77 runs them (the default body), the 356 the model bursts in the air.
 * They were held out once, for I2, on 16 September 2026; IMP-0 made them the
 * band's development data, and G3's held-out set is the fireballs the catalogue
 * publishes after the freeze. The percentiles are the linear interpolation
 * between order statistics (type 7 of Hyndman & Fan 1996, R's default).
 *
 * RULE 741. THE CELLS. The four cells of twenty rows or more take their own
 * rows. The two cells above 3 kT, of 13 and 15 rows, are pooled into one of
 * 28, the rows of the same energy: a percentile of thirteen rows is its second
 * value, and the band would be the sample's.
 *
 * RULE 742. WHERE THERE IS NO BAND. Outside the measured cells, and for a
 * body the model does not burst in the air, the product prints no band and
 * says why: the error was measured only there, and only for a burst. The low
 * edge is never below the ground.
 *
 * RULE 743. THE FREEZE. The band's ten numbers — two for each of the four
 * cells and two for the pool, in kilometres — are committed in `entryBand.ts` with the date of
 * the freeze, and `entryBandRules.test.ts` recomputes them from
 * `fireballSetData.ts` and the model as it runs: a change of the model that
 * moves them fails in CI, and the band is then frozen again only by rules that
 * say so, before any fireball after the first freeze is read. Nothing is
 * tuned to a record after this commit.
 *
 * RULE 744. WHERE IT IS SAID. The result carries `entryAltitudeBand`; the
 * panel prints it under the burst altitude; the globe draws it on the burst's
 * beacon, the shaft between the band's edges marked apart from the rest
 * (IMP-7's check 3 for this quantity), and a visual contract says so; the
 * report prints the ten numbers, and G3 cell by cell as "not read" until
 * IMP-6.
 *
 * RULE 745. WHAT IMP-6 WILL READ, and what these rules leave to it. The band
 * is scored on the fireballs of NASA JPL's catalogue published after the
 * freeze that carry an altitude, a speed and an energy, first when there are
 * eight; its coverage by G3 as the amendment of 18 September 2026 reads it.
 * G3's width bound is written for a quantity's σ_ln; the altitude is read in
 * kilometres, and how the bound reads it is IMP-6's to fix, with Andrea,
 * before the first held-out fireball is scored.
 *
 * RULE 746. WHAT IS EXPECTED, written before the numbers are computed:
 *
 *   (a) in CI: the ten numbers recomputed from the rows; the band on a
 *       scenario inside each cell is the burst altitude plus its cell's pair,
 *       none outside, none for a body that reaches the ground;
 *   (b) no other number of any scenario moves: the band is said beside the
 *       altitude, not applied to it;
 *   (c) the panel and the beacon show it, in both languages, read headless on
 *       a scenario inside a cell and on one outside;
 *   (d) the report regenerated keeps the release gate at PASS.
 *
 * RULE 747. WHAT IT DOES NOT CLAIM. That the band holds nine in ten of the
 * fireballs to come: that is G3's reading, in IMP-6. That the altitude of
 * peak brightness is where the energy is deposited: the band is on the
 * quantity I2 reads, the record the sensors give. Nor that the band says
 * anything outside the cells: there it is not drawn.
 */

/*
 * ===========================================================================
 * The outcome, written after the band was built, 21 September 2026: FROZEN
 * ===========================================================================
 *
 * The rules were pushed in `5e9e951`; the percentiles were computed after,
 * and are `ENTRY_ALTITUDE_BAND` in `entryBand.ts`: from −22.1 to +2.7 km below
 * 0.3 kt and 17 km/s (96 fireballs), −29.5 to +6.4 from 17 km/s (103), −22.2
 * to +2.2 from 0.3 to 3 kt below 17 km/s (59), −23.6 to −3.4 from 17 km/s
 * (70), and −21.9 to +3.4 above 3 kt (28, the two cells pooled). The model
 * bursts a body higher than the sky does, as the program does, and the band
 * lies mostly below its burst altitude.
 *
 * (a) HOLDS. `entryBandRules.test.ts` recomputes the ten numbers from the rows
 *     to 1e-9 km, bands a burst inside every cell with its group's pair, and
 *     none for a body that reaches the ground or any preset (all outside).
 * (b) HOLDS. Nothing else moves: the result gains `entryAltitudeBand`, and
 *     every other number is the same.
 * (c) HOLDS. Read headless on a 1 kt stone at 20 km/s, bursting at 45.8 km:
 *     the panel prints "22,2 km – 42,3 km" in Italian and "22.2 km – 42.3 km"
 *     in English, and the beacon draws the shaft between the two wider; on
 *     Chelyabinsk, outside, "— none: outside the measured cells, or no burst
 *     in the air" and no band on the shaft.
 * (d) HOLDS. The report, regenerated with the band beside I2's cells, keeps
 *     the release gate at PASS.
 *
 * So the band is frozen, and IMP-6 scores it when the catalogue has eight
 * fireballs published after 21 September 2026.
 */

export const ENTRY_BAND_RULES = 'rules 739 to 747, fixed 21 September 2026';
