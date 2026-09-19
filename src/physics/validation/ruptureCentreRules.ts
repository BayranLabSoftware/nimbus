/**
 * The hypocentre is not the centre of the rupture.
 *
 * WHAT THE DEFECT IS, and it is one line of geometry. The model lays the
 * rupture stadium down centred on the epicentre. But the epicentre is where
 * the rupture STARTED — the point the first energy came from — and a rupture
 * propagates away from it, for tens or hundreds of kilometres. Tohoku's
 * epicentre is roughly at one end of its 500 km of slip, not in the middle of
 * it. Putting the centre on the hypocentre is an assumption nobody has
 * written down, and it is wrong for every earthquake.
 *
 * It is also the missing term in the band. A realisation draws its magnitude
 * (sigma 0.15), its depth (20 %), its ground (30 %), the ground-motion
 * residual (0.60), the fatality curve's scatter and the vulnerability's — and
 * the FOOTPRINT NEVER MOVES. It sits on the same square metre in all two
 * hundred worlds. So when a footprint reaches nobody, it reaches nobody two
 * hundred times, and the band is [0, 0]: not "I do not know", but "nobody
 * dies, certainly".
 *
 * MEASURED ON RULE 11'S 408 ROWS, 21 September 2026, before these rules were
 * fixed: SEVEN rows carry a band of [0, 0] beside a record of one or more —
 * Hindu Kush 2009 (5 dead), Cagayan 2012 (1), Gulf of Fonseca 2014 (1),
 * Taipei 2015 (1), Melilla 2016 (1), Batanes 2019 (9), Concepcion 2019 (1).
 * Those are not imprecise predictions, they are FALSIFIED ones: the interval
 * excludes what happened. A further 129 rows have [0, 0] about a record of
 * nothing, which is legitimate and is not touched here. And the bands that
 * are not zero span a median of 10^2.49 — a factor of three hundred.
 *
 * Too certain where they are wrong, too vague everywhere else.
 *
 * WHY IT IS WORTH A ROUND TONIGHT. The same defect refused two rounds hours
 * ago: rules 356 to 362 lost a row to a [0, 0] band, and rules 370 to 376
 * were refused on rule 19(b) because Parker et al. 2022's smaller rings on
 * small interfaces sent their bands to zero. That refusal is standing
 * between this project and a toll of 1.01x its record on the great ruptures,
 * which is the best figure that cell has ever had.
 *
 * WHAT WAS SEEN BEFORE THESE RULES WERE FIXED: the counts above; the whole of
 * tonight's four rounds; and that the sampler in `uq/tollBand.ts` draws no
 * position of any kind. NOT seen: any figure of the candidate below.
 *
 * 377. THE RUPTURE'S CENTRE IS DRAWN, NOT ASSUMED. A realisation places the
 *      centre of the rupture at a distance along strike from the hypocentre,
 *      drawn per realisation. The central estimate does NOT move: it keeps
 *      the centre on the epicentre, so every published figure, every picture
 *      the globe draws and every preset stay exactly as they are. This block
 *      changes what the BAND knows, and nothing else.
 *
 * 378. HOW FAR, and this is a choice of this project declared as a choice,
 *      not a measurement. The offset is uniform on [-L/2, +L/2], L being the
 *      rupture's own length: the hypocentre may sit anywhere along the break,
 *      and nothing in the inputs says where. Where a rupture is a point
 *      (below the extended-source threshold) the offset is zero, because a
 *      point has no length to slide along — the epicentre's own location
 *      error is real, is smaller, and is NOT drawn here; one change at a
 *      time.
 *
 *      Published studies of where hypocentres sit on finite-fault models
 *      exist and are not read here: using one would make this a measurement
 *      and would need the set and the citation fixed first. Uniform is the
 *      widest honest statement of ignorance, and rule 381 is what stops
 *      ignorance from being used to buy coverage.
 *
 * 379. WHAT IT COSTS TO COMPUTE, because a band is drawn two hundred times.
 *      Sliding the stadium along strike is a translation in the frame the
 *      counter already works in, so it is one subtraction per cell and not a
 *      second pass over the population raster. If this block ever needs a
 *      pass per realisation it is refused on cost alone: the CI pays for
 *      every band at every push.
 *
 * 380. WHAT IS TRUE IF IT WORKS. A footprint that reaches nobody when
 *      centred may reach somebody when slid, so a band that was [0, 0]
 *      becomes [0, something] — and one that already reached people moves
 *      very little, because the population it sweeps is similar. The
 *      prediction is that the falsified bands fall and the median width
 *      barely moves. If instead every band widens, the term is being used as
 *      a fudge and rule 381(c) refuses it.
 *
 * 381. WHAT DECIDES.
 *      (a) The falsified bands — [0, 0] beside a record above zero — fall
 *          below today's SEVEN. A round that leaves them all is a round that
 *          did nothing, and one that adds any is refused outright.
 *      (b) No row that was inside its band falls outside it, over all rows.
 *          This is rule 358(d), which has earned its place twice tonight.
 *      (c) The median band width over the rows with something grows by no
 *          more than 0.3 decades — a factor of two. Beyond that the coverage
 *          is being bought with informativeness, which is the trade a
 *          predictive interval exists to refuse. Fixed here, before the run,
 *          at a number chosen for what it means and not for what it lets
 *          through.
 *      (d) No central estimate moves, anywhere, by one figure: rule 377 says
 *          the centre of the central estimate does not move, and anything
 *          that moves is a defect of the wiring.
 *      (e) No preset, no row of the calibration net, no replay and no golden
 *          figure moves — except through a BAND, which may widen, and which
 *          the gate must still pass in strict mode.
 *
 * 382. WHAT MAY NOT HAPPEN. The offset is not tuned: [-L/2, +L/2] is fixed
 *      here and is not narrowed or widened after the run (rules 5 and 6). No
 *      band is widened by any other means, no row is dropped, no threshold
 *      of rule 296 or rule 19 moves. The refusal of rules 370 to 376 is NOT
 *      reversed here: if this block is adopted, that law may be re-run under
 *      its own rules in a block of its own, and this one does not prejudge
 *      it.
 *
 * 383. WHAT IS PRINTED: the seven falsified bands by name, before and after,
 *      with what each one's band becomes; the median width and the share
 *      inside, before and after, over all rows and over the rows with
 *      something; every central estimate that moved, which rule 381(d) says
 *      is none; and the count of rows whose band did not change at all,
 *      because a term that moves everything is as suspect as one that moves
 *      nothing.
 *
 * WHAT THIS BLOCK CANNOT SETTLE. Where hypocentres actually sit on ruptures,
 * which is a measurable thing this block declines to measure. Whether a band
 * that contains the record for the right reason is better than one that
 * contains it for the wrong one — sliding a footprint until it finds people
 * is a mechanism, and mechanisms can be right for one event and wrong for
 * the next. And whether the remaining width, a factor of three hundred, is
 * the ground-motion residual being honest or the model being vague.
 */

/*
 * ===========================================================================
 * THE OUTCOME, 21 September 2026: REFUSED on rules 381(a) and 381(b)
 * ===========================================================================
 *
 * Rules 377 to 383 were pushed in ed5d7d4 and the candidate in 1c4e89c, both
 * before one band was read. One run, both sides in one process:
 * `scripts/benchmark/rupture-centre.ts`,
 * `benchmark/results/rupture-centre-2026-09-21.json`.
 *
 *   381(a) falsified bands      : 6 -> 6                            NOT MET
 *   381(b) rows leaving a band  : 1 — Chile (central), 16 Sep 2015  NOT MET
 *   381(c) median band width    : 10^2.56 -> 10^2.57, ceiling +0.30     MET
 *   381(d) central estimates    : 0 moved                               MET
 *   bands that moved at all     : 63 of 408
 *
 * WHY IT FAILS, and it is a mistake in rule 380 rather than in the code. The
 * rule predicted that "a footprint that reaches nobody when centred may
 * reach somebody when slid". It cannot, for these rows: FIVE OF THE SIX
 * falsified bands belong to POINT SOURCES — Taipei 2015 at Mw 6.4, Melilla
 * 2016 at 6.3, Batanes 2019 at 6.0, Gulf of Fonseca 2014 at 7.3, Cagayan
 * 2012 being the one extended row — and rule 378 sets the offset to zero for
 * a point source, because a point has no length to slide along. The
 * candidate could not move the rows it was built to move, and the run says
 * so: not one of the six changes by a single person.
 *
 * I did not check, before writing rule 380, that the rows to be cured were
 * extended. That is the same mistake as rule 351(b) earlier tonight, made
 * again with the run to catch it this time instead of a clause.
 *
 * AND A DEFECT IN THE DIAGNOSIS ITSELF, found by the discrepancy between the
 * 7 written into rule 381(a) and the 6 the run reads. They are not the same
 * six-plus-one: the diagnosis counted Hindu Kush 2009 (Mw 6.2, 5 dead) as a
 * falsified band, and it is not one. That row has NO CASUALTY PLAN at all —
 * `centralEstimate` returns null — and `compareWithRecord` reports [0, 0] in
 * that case as much as it does for a real band of zero. A silence and a
 * prediction of nothing are printed identically, and the diagnosis read one
 * as the other. `sampleToll` on that row gives [1, 21].
 *
 * So the count of genuinely falsified bands is SIX, and the seventh was a
 * measurement error of mine. That the run exposed it is the only reason it
 * is known.
 *
 * WHAT THIS LEAVES, for a block that is not written here. The cure for a
 * [0, 0] band on a POINT SOURCE cannot be the rupture's centre. It has to be
 * the epicentre's own location error — which rule 378 named, measured at
 * nothing, and deliberately left out under "one change at a time". That
 * decision was right procedurally and wrong empirically: the change that was
 * left out is the one that was needed. A block for it needs the location
 * errors themselves, which ComCat publishes per event and this project does
 * not carry, and it needs to face what this run also showed — that the
 * offset moved only 63 bands of 408 and cost a row, so position terms are
 * not free.
 *
 * The candidate stays reachable and drawn by nothing:
 * `sampleScenarioPlans({ drawRuptureCentre })` is false everywhere, and the
 * validation report does not move by one figure.
 */

/** Rule 378's offset, as a fraction of the rupture's own length: uniform on
 *  [-1/2, +1/2] of L along strike. A project's choice, declared. */
export const CENTRE_OFFSET_FRACTION = 0.5;

/** Rule 381(a)'s count, read on 21 September 2026 before the candidate ran:
 *  rows of rule 11 whose band is [0, 0] beside a record above zero. */
export const FALSIFIED_BANDS_TODAY = 7;

/** Rule 381(c)'s ceiling on how much the median band may widen, in decades. */
export const WIDTH_CEILING_DECADES = 0.3;

/** The median width of the non-zero bands today, in decades. */
export const MEDIAN_WIDTH_TODAY_DECADES = 2.49;
