/**
 * The interface law without the interface rupture — separating a flag that
 * has always done two jobs.
 *
 * WHAT THE DEFECT IS. `subductionInterface` decides two independent things at
 * once: WHICH GROUND-MOTION LAW runs (rule 36 allows an interface model only
 * for a scenario carrying the flag) and HOW BIG THE RUPTURE IS (Strasser et
 * al. 2010 instead of Wells & Coppersmith 1994). Nothing in the physics ties
 * them: a relation fitted on interface earthquakes describes how the ground
 * shakes at a distance, and a scaling law describes how long the break is.
 * They are one input because they were written as one input.
 *
 * That coupling was carried into rule 35, which fixed the set "with the
 * scenario marked a subduction interface — Strasser et al. 2010's interface
 * rupture, drawn as its stadium — FOR EVERY LAW ALIKE". So when rule 38
 * refused Parker et al. 2022 on the dead on 15 September 2026, what it
 * refused was Parker WITH Strasser. Parker with Wells & Coppersmith has never
 * been measured by anything.
 *
 * WHY IT MATTERS, measured on 21 September 2026 on the 30 rows of rule 11
 * that the slab calls an interface and that are extended sources, with the
 * strike wired (rules 356 to 362) and B-077 fixed:
 *
 *   | configuration                        | bias   | sigma | inside |
 *   |--------------------------------------|-------:|------:|-------:|
 *   | shipped: Boore 2014 + W&C            |  6.48x |  1.57 |  20/20 |
 *   | the SCALING alone: Boore + Strasser  | 14.72x |  1.50 |  19/20 |
 *   | the LAW alone: Parker + W&C          |  2.26x |  1.41 |  16/18 |
 *   | the LAW alone: BC Hydro + W&C        |  6.95x |  1.28 |  20/21 |
 *   | both: Parker + Strasser              |  4.12x |  1.44 |  15/19 |
 *   | both: BC Hydro + Strasser            | 11.27x |  1.03 |  17/21 |
 *
 * Strasser's scaling is not the cure, it is a second defect: alone it takes
 * the toll from over-counting by six and a half to over-counting by fifteen,
 * which is why rules 363 to 369 refused the interface mark hours earlier.
 * Parker's law alone takes it to 2.26x and tightens the scatter. Coupled to
 * Strasser it gives back most of that. Rule 38 measured the coupled figure.
 *
 * AND WHY IT IS WORTH A ROUND AT ALL: those same interface rows are the worst
 * half of the set. Under one law, in one run, the rows the slab answers for
 * read 2.66x their record and the rows it does not read 0.63x — a split of
 * four and a half, the largest this harness has printed, and the reason the
 * Mw >= 7.5 cell reads a mild 1.99x while hiding a 6.48x and a 0.46x inside
 * it.
 *
 * WHAT WAS SEEN BEFORE THESE RULES WERE FIXED, in full, because this round is
 * NOT blind and pretending otherwise would be worthless:
 *
 *  - the table above, on rule 11's 30 extended interface rows;
 *  - the 2.66x / 0.63x split and its breakdown by depth, magnitude and Vs30;
 *  - everything rules 35 to 39 recorded in 2026-09-15's run, including that
 *    Parker won the shaking in all four readings and that its bands then held
 *    0 of 5, 8 of 22 and 11 of 16 of rule 11's records with something;
 *  - Tohoku's MMI areas under all three laws.
 *
 * NOT seen: any figure of this candidate below Mw 7.5, any figure on rule
 * 23's quiet earthquakes, and the share inside the band cell by cell, which
 * is what rule 374 decides on and which no one has read for Parker + W&C.
 *
 * 370. THE SEPARATION. The rupture scaling becomes an input of its own. A
 *      scenario may name an interface ground-motion law and keep Wells &
 *      Coppersmith's rupture, or take Strasser's, or both, and the three are
 *      distinguishable. Nothing about the default changes: a scenario that
 *      ticks `subductionInterface` and says nothing else keeps exactly the
 *      rupture and the law it has today, so no preset, no reader's scenario
 *      and no published figure moves by separating them. B-046's rule stands:
 *      an interface scenario is a thrust, whatever fault type it names.
 *
 * 371. THE CANDIDATE, corrected on 21 September 2026 BEFORE anything was run,
 *      because as first written this rule described a candidate the
 *      diagnosis had not measured. Parker et al. 2022's global interface
 *      model — implemented, held to OpenQuake within 0.1 % by rule 36, and
 *      the winner on the shaking by rule 37 — drawing the rings of a row
 *      rule 296 or 297 places on the interface, with Wells & Coppersmith's
 *      rupture scaling named explicitly under rule 370.
 *
 *      Such a row therefore CARRIES `subductionInterface`, and with it the
 *      thrust mechanism B-046 requires and the tsunami block the flag emits.
 *      Both were present in the 2.26x measured above, and both are declared
 *      here rather than wished away: the flag stays the gate on the law,
 *      because an interface relation on a crustal earthquake is outside its
 *      domain and `interfaceAttenuation.test.ts` holds the model to refusing
 *      it. What rule 370 separates is the SCALING — the coupling rule 35
 *      measured through — not the mechanism and not the wave.
 *
 *      ONE DIFFERENCE FROM THE DIAGNOSIS, declared before the run.
 *      Wells & Coppersmith's scaling is per fault type, and the flag makes
 *      the scenario a thrust (B-046). The diagnosis above held the rupture
 *      byte for byte with `ruptureLengthOverride`, which is a harness trick;
 *      the candidate computes W&C on the thrust mechanism instead, which is
 *      what a scenario can actually express. On a row that named another
 *      mechanism the rupture therefore differs from the diagnosed one by
 *      about one and a half per cent in length. The 2.26x is a reading of
 *      the configuration, not a prediction of this run's figure.
 *
 *      BC Hydro is not a candidate: on the same rows it reads 6.95x against
 *      the shipped 6.48x, and a law that does not move the defect does not
 *      get a round.
 *
 * 372. WHAT DECIDES IS RULE 19, UNCHANGED, as rule 38 applies it. Not a bar
 *      written for this round: the bar the project already uses to adopt a
 *      contour law, and the bar that refused this very law in September. It
 *      replaces the shipped law only if
 *      (a) its mean absolute log bias over the three magnitude cells of the
 *          tolls is no larger than the shipped law's, and
 *      (b) its band holds at least eight records in ten, among the rows with
 *          something, IN EVERY CELL.
 *      Rule 25's clause comes with it, as rule 38 has it: the candidate may
 *      raise no larger a share of rule 23's quiet earthquakes to a median
 *      toll of ten.
 *
 * 373. WHERE IT APPLIES, and this is the part that is genuinely new. Rule 38
 *      would have given an adopted law to "every scenario marked a subduction
 *      interface". The mark is now something the slab can propose (rule 363)
 *      and something rules 363 to 369 refused to let it propose, so the law
 *      follows the SAME test the mark would have used: rule 296 or 297 places
 *      the hypocentre on the interface. The scaling does NOT follow it — that
 *      is the whole point of rule 370 — and stays Wells & Coppersmith's,
 *      named explicitly, which is the configuration the diagnosis measured
 *      at 2.26x and which rule 38 never saw.
 *
 * 374. THE SET. Rule 11's tolls, as rule 19 prescribes, and rule 23's quiet
 *      earthquakes for rule 25's clause. Both are read: rule 345 applies and
 *      this round may not be reported as evidence that the model predicts
 *      better on unseen data. What it can show is whether a law the project
 *      already chose on the shaking survives the bar the project already
 *      wrote, when it is not carrying a scaling law that was never part of
 *      the question.
 *
 * 375. WHAT MAY NOT HAPPEN. Rule 19's bar is not touched, in either clause,
 *      and least of all the eight-in-ten: that is the clause that refused
 *      this law before. Rule 38's verdict is not reversed by assertion — it
 *      is superseded only if the candidate passes rule 19 as written. No
 *      threshold of rule 296 moves. Strasser's scaling is not deleted, and no
 *      preset loses it. The interface mark of rules 363 to 369 stays refused;
 *      this block gives the LAW and Wells & Coppersmith's rupture to the rows
 *      the slab recognises. The mechanism and the tsunami come with the flag
 *      that gates the law, as rule 371 now says and as the diagnosis
 *      measured; what these rows do NOT get is Strasser's rupture, which is
 *      the defect rules 363 to 369 refused. And if the bar is missed, the
 *      shipped law stays and the 6.48x is written into the declared gaps
 *      instead of being fixed quietly.
 *
 * 376. WHAT IS PRINTED, whatever the outcome: rule 19's two clauses cell by
 *      cell, for the candidate and for the shipped law, on the interface rows
 *      and on all rows; rule 25's share of quiet earthquakes raised to ten;
 *      the 2.66x / 0.63x split before and after, because closing it is the
 *      point; every row of the calibration net that moves, which must be
 *      none; and Tohoku's MMI VII and VIII areas against its ShakeMap under
 *      both laws, since that is where the defect was first visible.
 *
 * WHAT THIS BLOCK CANNOT SETTLE. Whether Parker's relation is right — it is
 * fitted on subduction data the model does not have for these events, and
 * agreeing with a ShakeMap partly made of it is the circularity rule 39
 * already printed and did not correct. Whether the remaining 2.26x is the
 * law's fault or the fatality curve's. Whether the rows the slab calls an
 * interface are interface earthquakes, which rules 363 to 369 could not
 * settle either. And whether a set this thoroughly read can support any
 * conclusion at all beyond "the bar was met" or "it was not".
 */

/** Rule 371's candidate, by name, so a run cannot become a different one. */
export const INTERFACE_LAW_CANDIDATE = 'parker2022Interface' as const;

/** The reading of 21 September 2026 that this block was written on, on the 30
 *  extended interface rows of rule 11. Declared, not held out. */
export const SEPARATION_DIAGNOSIS = {
  readOn: '2026-09-21',
  rows: 30,
  shipped: { bias: 6.48, scatterLn: 1.57 },
  strasserAlone: { bias: 14.72, scatterLn: 1.5 },
  parkerWithWellsCoppersmith: { bias: 2.26, scatterLn: 1.41 },
  bcHydroWithWellsCoppersmith: { bias: 6.95, scatterLn: 1.28 },
  parkerWithStrasser: { bias: 4.12, scatterLn: 1.44 },
} as const;

/** Rule 372(b)'s clause, as rule 19 fixed it. */
export const BAND_HOLDS_AT_LEAST = 0.8;
