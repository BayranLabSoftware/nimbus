/**
 * Letting Slab2 say that an earthquake is a megathrust.
 *
 * WHAT RULE 302 FORBADE, and why it is being amended rather than deleted.
 * Rules 295 to 303 gave the model a slab and used it for ONE thing: the
 * strike. Rule 302 wrote the fence explicitly — "Slab2 decides WHERE THE
 * STRIKE COMES FROM and nothing else. It does not decide which ground-motion
 * model runs, it does not set the `subductionInterface` flag a reader ticks,
 * and it does not touch the dip. One change at a time, so that what moves can
 * be attributed."
 *
 * That fence did its job and this block takes down one plank of it, with the
 * date and the reason, as the gold standard's scope was amended: Slab2 may set
 * the `subductionInterface` flag. It still does not choose the ground-motion
 * law — rules 35 to 39 chose that and rule 38 refused the interface models on
 * the dead — and it still does not touch the dip.
 *
 * WHY NOW, and not on 20 September when it was first proposed. The diagnosis
 * it was proposed on was WRONG, and that is recorded in
 * `nimbus-ripresa`: "Tohoku paints MMI IX over 98 628 km2 where the published
 * ShakeMap has none" is not true, the report has always printed 0 km2 against
 * 0 km2 for that band, and the model's peak there is 8.88. What is true is
 * that Tohoku's MMI VIII is 2.84 times the ShakeMap's — and the interface
 * ground-motion models make that WORSE, not better, which is one more reason
 * this block leaves the law alone.
 *
 * What changed tonight is the ground under the measurement. Rules 356 to 362
 * (adopted, bf41f1b) made the harness count rule 11's rows in the footprint
 * the shipped tiles orient, as the product does. Before that, marking an
 * interface would have been measured on footprints pointing wherever the
 * sweep put them: two changes at once, which is what rule 302 was written to
 * prevent.
 *
 * WHAT THE MARK DRAGS WITH IT, measured on the 408 rows on 21 September 2026
 * before any of it was scored, and declared here because a flag that changes
 * four things at once must say so:
 *
 *   rows Slab2 calls an interface : 157 of 408 — 31 below Mw 6.5, 96 between
 *                                   6.5 and 7.5, 30 at 7.5 or more
 *   mechanism forced to reverse   : 43 of them — 13 that named none ("all"),
 *                                   14 strike-slip, 16 normal
 *   rupture scaling               : Strasser et al. 2010 instead of Wells &
 *                                   Coppersmith 1994; median L x1.17, W x2.09
 *   extended-source threshold     : unchanged on every row (0 of 157), because
 *                                   `interfaceStadium` stays "fromMw7.5"
 *   tsunami block                 : emitted where there was none, on all 157
 *
 * 363. THE AMENDMENT. Rule 302's clause "it does not set the
 *      `subductionInterface` flag a reader ticks" is amended on 21 September
 *      2026: where rule 296 or rule 297 places the hypocentre on a slab
 *      interface, the harness and the product may mark the scenario as one. A
 *      strike a reader typed still wins over the lookup (rule 322), and a
 *      reader's own tick still wins over both. The rest of rule 302 stands
 *      untouched: no ground-motion law is chosen here, and no dip is moved.
 *
 * 364. THE TWO CANDIDATES, because the model and the observation disagree on
 *      thirty rows and this block does not guess which wins.
 *      (a) OBSERVATION MAY REFUSE. The mark is set where rule 296 or 297
 *          answers AND the moment tensor does not contradict it — that is,
 *          where the mechanism is reverse or was never named. A megathrust is
 *          a thrust; an earthquake at interface depth that broke strike-slip
 *          or normal is more likely inside the slab or on the outer rise, and
 *          a model of a surface does not overrule a measurement of the event.
 *          127 rows.
 *      (b) GEOMETRY DECIDES. The mark is set wherever rule 296 or 297
 *          answers, and the mechanism is forced to reverse as B-046 requires
 *          of any interface scenario. 157 rows.
 *      Both are coded before either is scored, and one run measures both.
 *
 * 365. THE ORDER, because the flag and the lookup are circular: the mark
 *      changes the rupture length, and rule 287 reads the strike over a
 *      window as long as the rupture. The lookup is asked ONCE, with the
 *      UNMARKED rupture, and its answer is then used to decide the mark. The
 *      circularity is real and it is small: re-asking with Strasser's rupture
 *      moves the strike by a median of 0.03 degrees and at most 2.81, changes
 *      no row's clause, and makes no row gain or lose an answer — measured on
 *      all 157 before this rule was fixed. Fixing the order here means the
 *      number cannot be chosen later.
 *
 * 366. THE SET. Rule 11's 408 rows, and rule 345 applies to them here exactly
 *      as it did tonight: they are NOT held out, the report has scored them at
 *      every push for a week, and a set this read cannot be evidence that the
 *      model predicts better. It can show what the mark does and what it
 *      costs. Rule 23's quiet set and rule 329's E1 rows are not spent here.
 *
 * 367. WHAT DECIDES, and it is measured WHERE THE CHANGE ACTS, which is the
 *      marked rows and not the whole cell — the mistake `nimbus-rileggi-le-
 *      regole` was written about.
 *      (a) No row that was inside its band falls outside it, in any cell,
 *          read over all rows. This is rule 358(d), which earned its place
 *          tonight by catching B-077.
 *      (b) On the rows a candidate marks, |ln bias| is no larger than it is
 *          today, and the share of those rows whose band holds their record
 *          does not fall.
 *      (c) The rows a candidate does NOT mark do not move by one figure.
 *          Nothing touches them, so anything that moves is contamination.
 *      (d) No preset, and no row of the calibration net, moves at all: the
 *          presets carry their own `subductionInterface` (rule 286) and the
 *          net's rows are not rule 11's.
 *      (e) The release gate stays PASS in strict mode and its audits stay
 *          clean, with the report regenerated and committed alongside.
 *      (f) THE CHOICE BETWEEN THEM: a candidate that fails any of (a) to (e)
 *          is out. If both survive, the one adopted is the one with the
 *          smaller |ln bias| on the rows it marks; if that is a tie to two
 *          decimals, (a)'s narrower claim wins, because marking fewer rows
 *          asserts less. If neither survives, neither is adopted and rule
 *          302's clause goes back up with the measurement written beside it.
 *
 * 368. WHAT MAY NOT HAPPEN. No ground-motion law changes: rule 38 refused the
 *      interface models on the dead and this block does not reopen that, nor
 *      does it read their scores again. No dip moves (rule 302, still
 *      standing). No bound of rules 286 to 303 is touched, no band widened, no
 *      row dropped for getting worse, and no threshold of rule 296 — the 60 km
 *      seismogenic depth, the two-sigma depth tolerance — is moved after the
 *      measurement (rules 5 and 6). The tsunami blocks the mark emits are
 *      reported and decide nothing here: no wave figure of this set is scored,
 *      because rule 11's rows carry no wave record.
 *
 * 369. WHAT IS PRINTED, whatever the outcome: for each candidate, the rows it
 *      marks by cell; the bias, the scatter and the share inside the band on
 *      the marked rows, before and after; the same three on the rows it does
 *      not mark, which rule 367(c) says are unmoved; every row that leaves its
 *      band, which 367(a) says is none; and, by name, the thirty rows where
 *      the moment tensor and Slab2 disagree, with what each candidate did to
 *      them.
 *
 * WHAT THIS BLOCK CANNOT SETTLE. Whether an earthquake at interface depth
 * with a normal mechanism is an outer-rise event, an intraslab one, or a
 * megathrust whose tensor is poorly resolved — candidate (a) assumes the
 * tensor knows and candidate (b) assumes the slab knows, and the dead are a
 * poor referee between them on rows that mostly killed nobody. Whether
 * Strasser's scaling is right for a rupture this model places by magnitude
 * alone. And whether the interface ground-motion models would help, which
 * rule 38 answered once, before the strike was wired, and which is not
 * reopened here.
 */

/*
 * ===========================================================================
 * THE OUTCOME, 21 September 2026: BOTH CANDIDATES REFUSED
 * ===========================================================================
 *
 * Rules 363 to 369 were pushed in bc6089e and both candidates in 10a6320,
 * both before one toll was read. One run, three sides in one process, no
 * re-tuning: `scripts/benchmark/interface-mark.ts`,
 * `benchmark/results/interface-mark-2026-09-21.json`.
 *
 *                              | tensorMayRefuse | geometryDecides |
 *   rows marked                |             127 |             157 |
 *   MARKED rows, bias          |  2.96x -> 4.05x |  2.66x -> 3.18x |
 *   MARKED rows, |ln bias|     |  1.084 -> 1.400 |  0.978 -> 1.158 |
 *   MARKED rows, scatter       |    2.22 -> 2.35 |    2.22 -> 2.37 |
 *   MARKED rows, inside        |   69/73 → 68/73 |   82/87 → 82/87 |
 *   UNMARKED rows              |   0 moved, 0.63x unchanged        |
 *   367(a) none left its band  |  NOT MET — Chile (central), 16 September
 *                              |  2015, on both sides              |
 *   367(c) unmarked unmoved    |  MET on both                      |
 *
 * Neither survives rule 367(a), and neither would have survived 367(b): the
 * mark makes the dead WORSE on exactly the rows it marks, on both readings
 * of who is an interface event. By rule 367(f) neither is adopted, and rule
 * 302's clause goes back up — nothing in the shipped model marks an
 * interface from Slab2. Rule 363's amendment stands as written and as
 * measured: the permission was granted, exercised, and returned unused.
 *
 * WHY IT FAILS, which the numbers say without needing a theory. Strasser's
 * interface scaling gives a rupture 2.09 times as wide (median, rule 363's
 * table), the footprint grows with it, and more people fall inside a
 * footprint whose toll was ALREADY 2.66 times its record. A model that
 * over-counts does not improve by being given more ground.
 *
 * READ AFTER THE RUN, and acted on by nothing here, because it is the most
 * useful thing this round produced:
 *
 *   THE ROWS SLAB2 CALLS AN INTERFACE ARE ALREADY THE WORST ROWS WE HAVE.
 *   Before any mark, their toll is 2.66x their record where the rows the
 *   slab does not answer for read 0.63x — over-counting by nearly three on
 *   one set and under-counting by a third on the other, in the same run,
 *   with the same law. That gap is four and a half times, it is the largest
 *   split this harness has printed between two halves of one set, and no
 *   rule has been written about it.
 *
 *   It also puts rule 38 in a new light. Rule 38 refused the interface
 *   ground-motion models because their bands held fewer records — but those
 *   models draw LOWER near the rupture and fall off more slowly, and the
 *   defect measured here is over-counting on precisely their events. Whether
 *   they would cure this split is not something this block may answer: it
 *   did not measure them, rule 368 forbade it, and rule 38's refusal stands
 *   until a block written for that question re-opens it on a set that has
 *   not been spent.
 */

/** What rule 364's two candidates are, by name, so the run cannot quietly
 *  become a third one. */
export type InterfaceMarkCandidate =
  /** Rule 364(a): the moment tensor may refuse the mark. */
  | 'tensorMayRefuse'
  /** Rule 364(b): the slab's geometry decides alone. */
  | 'geometryDecides';

/** Rule 364's reading of the 408 rows, written before any was scored. */
export const INTERFACE_MARK_ROWS = {
  readOn: '2026-09-21',
  /** Rows rule 296 or 297 answers for. */
  geometryDecides: { all: 157, belowMw65: 31, mw65to75: 96, fromMw75: 30 },
  /** Those, less the rows whose moment tensor contradicts a thrust. */
  tensorMayRefuse: { all: 127 },
  /** The disagreement itself: mechanisms Slab2 would overrule. */
  contradicting: { strikeSlip: 14, normal: 16, unnamed: 13 },
} as const;

/** Rule 365's measurement of the circularity, fixed before the order was
 *  used: re-asking the lookup with Strasser's rupture instead of Wells &
 *  Coppersmith's moves the strike this much, and no more. */
export const CIRCULARITY_DEG = { median: 0.03, worst: 2.81, overFiveDeg: 0 } as const;

/** Rule 367(f)'s tie-break precision. */
export const BIAS_TIE_DECIMALS = 2;
