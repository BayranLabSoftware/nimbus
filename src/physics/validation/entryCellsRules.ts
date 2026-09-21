/**
 * Rules 722 to 729 — the cells an impact's entry was measured in (G4). For
 * impacts, 21 September 2026, IMP-5 of ROADMAP.md M11, written and pushed
 * before the machinery is built or any figure of a cell is read.
 *
 * RULE 722. WHAT THIS ROUND IS. G4 asks that the product say, for every input
 * the form accepts, whether the scenario lies inside the cells the held-out
 * sets measured, that the report give each quantity's G2 and G3 figures cell
 * by cell, and that nothing be printed outside the measured cells without
 * that warning. For impacts one quantity has a held-out set: the altitude at
 * which the entry spends the body's energy (I2), measured on the 357 bolides
 * of rules 76 to 79. The machinery is generic (`measuredCells.ts`): named
 * axes cut at edges, the rows each crossed cell holds, the conditions the
 * rows were run under, and for any point a verdict — inside a cell, with its
 * rows and whether they are the twenty G2 scores a cell alone from, or
 * outside, with the axis or condition that puts it out. Its first instance is
 * I2's (`entryCells.ts`).
 *
 * RULE 723. THE CELLS. Rule 78's axes, fixed on 16 September 2026 before the
 * model was run on any bolide — energy below 0.3 kt, from 0.3 to 3, from 3;
 * speed below 17 km/s and from 17 — crossed, because a scenario has an energy
 * and a speed at once, and closed by the set: the cells run from the least to
 * the greatest energy of the 357, 0.048 to 49 kt, and speed, 9.8 to
 * 71.1 km/s, because a cell named "from 3 kt" measured nothing above 49. The
 * rows were run as one body, 3 000 kg/m³ with Collins et al.'s Eq. 9
 * strength (rule 77, "the body a scenario with no class carries"), at angles
 * from 0.68 to 88.35 degrees: a scenario is inside only with that density, no
 * strength of its own, and an angle in that span. Looked at before these
 * rules, and nothing else: the ranges, and the rows of the six cells — 96 and
 * 104 below 0.3 kt (below 17 km/s, and from it), 59 and 70 from 0.3 to 3 kt,
 * 13 and 15 from 3 kt; and the presets' inputs, every one outside (Chicxulub,
 * Popigai, Boltysh, Tunguska and Chelyabinsk by energy, Meteor Crater by
 * energy and composition, Sikhote-Alin, 2.8 kt, by composition). No figure of
 * the model or the program in any crossed cell.
 *
 * RULE 724. THE VERDICT THE PRODUCT CARRIES. `simulateImpact` returns
 * `measuredCells.entry`, the verdict of rule 722 for the scenario's kinetic
 * energy, speed, density, strength and angle. The scenario's numbers do not
 * move: the verdict is said beside them, not applied to them.
 *
 * RULE 725. WHERE IT IS SAID. In the panel, in the entry's section, beside
 * the figures it concerns; on the globe, under the label of the burst
 * altitude's beacon, and in the legend for every impact, which is IMP-7's
 * check 5 for this quantity. In English and Italian, naming the cell and its
 * rows, or what puts the scenario out and the set's bound on it.
 *
 * RULE 726. WHAT THE REPORT PRINTS. The six cells, each with its rows; the
 * model's burst altitude against the sky there (median |Δh|, mean Δh) and the
 * program's on the same rows (`benchmark/results/eiep-fireballs-2026-09-16.json`);
 * the agreement of rule 127, cell by cell; G2's verdict of rule 128 for every
 * cell of twenty rows or more, read there for the first time; and G3's, which
 * is "not read" in every cell until IMP-6 reads a band on held-out fireballs.
 * A cell whose verdict fails is printed as failing, and I2 then reads not met
 * in that cell, as G2's own words say.
 *
 * RULE 727. WHAT IS EXPECTED, written before the machinery exists:
 *
 *   (a) a test in CI: the edges and rows of rule 723 recomputed from
 *       `fireballSetData.ts`; the verdict inside every cell, at every edge,
 *       just outside every bound, and for each condition;
 *   (b) every preset's verdict as rule 723 lists it, in a test;
 *   (c) the report's cells add up to the whole: 357 rows, and the agreement
 *       counts to those rules 126 to 128 print for the set;
 *   (d) the globe, read headless on Chelyabinsk and on a scenario inside a
 *       cell, carries the verdict on the beacon and in the legend, and a
 *       visual contract says so;
 *   (e) no number of any scenario moves, and the report keeps the release
 *       gate at PASS.
 *
 * RULE 728. WHAT DECIDES. G4 is met for impacts when (a) to (e) hold. Its G3
 * column is empty until G3 is read, and says so: G4 reads that the table
 * exists and where a scenario lies, and G3's figures fill the same table when
 * a band has been read on held-out fireballs. Where any of (a) to (e) fails,
 * G4 stays not met and the failure is printed.
 *
 * RULE 729. WHAT IT DOES NOT CLAIM. That a scenario inside a cell is right:
 * the cells say where the entry was measured, and I2's figures how well. Nor
 * that anything else of an impact was measured: its craters, flash, blast and
 * waves have no held-out set, G4 has no cell to give them, and the report's
 * gaps and the rule that nothing is printed where no verified relation holds
 * speak for them. A cell of 13 rows was measured, and the verdict says it
 * holds fewer than the twenty G2 scores a cell alone from.
 */

/*
 * ===========================================================================
 * The outcome, written after the machinery was built, 21 September 2026: G4
 * MET for impacts
 * ===========================================================================
 *
 * The rules were pushed in `b9303c2`, before `measuredCells.ts`,
 * `entryCells.ts` or `entryCellsReading.ts` existed.
 *
 * (a) HOLDS. `entryCells.test.ts` recomputes every edge and count from the
 *     set — 0.048, 0.3, 3 and 49 kt, 9.8, 17 and 71.1 km/s, 96, 104, 59, 70,
 *     13 and 15 fireballs — and the span of angles, which the constants widen
 *     by 5e-5 and 8e-5 of a degree; it places a body in every cell and at
 *     every edge, and puts one out past every bound and for each condition.
 * (b) HOLDS. Chicxulub (both), Popigai, Boltysh, Tunguska, Chelyabinsk and
 *     Meteor Crater read outside by energy, above 49 kt; Sikhote-Alin by its
 *     density. Rule 723 named Chelyabinsk's energy only: its 3 300 kg/m³ and
 *     2 MPa put it out as well, and the verdict names the first it reads,
 *     the axes before the conditions.
 * (c) HOLDS. `entryCellsReading.test.ts`: the cells hold 357 fireballs, as
 *     rule 723 counted them, and their agreement adds up to the set's, 352
 *     within 1 %, 4 through BM-13, one refused. The model as it runs now
 *     gives the burst altitudes the program was compared with on
 *     16 September to the bit, on all 357.
 * (d) HOLDS. Read headless on Chelyabinsk and Tunguska and on a 1 kt body at
 *     20 km/s, in English and Italian: the beacon reads "27 km / outside the
 *     measured cells" and "46 km / in una cella misurata", the legend and
 *     the panel the sentence; the altitude beacon's visual contract says so.
 * (e) HOLDS. The verdict is added to the result and moves nothing in it; the
 *     report, regenerated with its new table, keeps the release gate at PASS.
 *
 * So G4 is met for impacts. Found while reading the globe, and not these
 * rules' to fix: a scenario that draws no ring — Chelyabinsk's, whose flash and
 * blast reach nothing on the ground — had the legend ask the reader to click
 * the globe and press Simulate, as if nothing had been run.
 */

export const ENTRY_CELLS_RULES = 'rules 722 to 729, fixed 21 September 2026';
