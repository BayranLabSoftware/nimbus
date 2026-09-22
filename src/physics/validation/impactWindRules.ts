/**
 * Rules 788 to 792 — an impact's peak wind, as the program prints it. For
 * impacts, 22 September 2026, IMP-7b of ROADMAP.md M11, B-106; by Andrea's
 * order of that morning that the globe draw the wind behind the shock front
 * as a layer of its own. A verification round: the reference is the Earth
 * Impact Effects Program, and the rows it is read on are the grid every
 * clause of I1 is gated on, so no held-out data is spent. Written and pushed
 * before the candidate exists.
 *
 * RULE 788. WHAT THIS ROUND IS. The impact domain computes no wind. The
 * program prints, beside the peak overpressure at the distance it is asked
 * about, the maximum wind velocity behind the shock front, and the grid of
 * `validation/eiepReference.ts` holds it: 81 rows print both, 57 bodies that
 * reach the ground and 24 airbursts. The candidate gives an impact the
 * program's wind at every ground range, so that the globe can draw it.
 *
 * RULE 789. WHAT WAS LOOKED AT BEFORE THESE RULES, by a script outside the
 * product, on the program's own printed numbers and on nothing of the model's.
 * The product's wind relation (`events/explosion/peakWind.ts`, Glasstone &
 * Dolan 1977 §3.55 at the ISA sea level, P₀ = 101 325 Pa and
 * c₀ = √(1.4 P₀ / 1.225) = 340.3 m/s), applied to the overpressure the
 * program prints, reads the program's wind at 1.016× to 1.024× (median
 * 1.021 for the bodies that reach the ground, 1.018 for the airbursts). Where
 * the program prints an airburst's overpressure as a range, three rows of 24,
 * its wind is the low end's: the high end reads 2.03× and 2.04×. The same
 * relation with the round constants of Collins, Melosh & Marcus (2005),
 * P₀ = 10⁵ Pa and c₀ = 330 m/s, reads it at 0.9987× to 1.0011×, median
 * 1.0000, on all 81 rows; what is left is the program's rounding, which
 * prints 0.254 m/s to three figures. No wind of the model has been computed.
 *
 * RULE 790. THE CANDIDATE. `impactPeakWindAt(source, range)` in
 * `events/impact/impactField.ts`: u = (5p / 7P₀) · c₀ / √(1 + 6p / 7P₀) with
 * P₀ = 10⁵ Pa and c₀ = 330 m/s, on the impact's own overpressure at that
 * range, `impactOverpressureAt` — the field the blast rings are drawn from,
 * which for a complete airburst is the static source, the program's low end.
 * An explosion keeps Glasstone & Dolan's constants, which its own rule N1
 * holds: each domain implements its own field's tool.
 *
 * RULE 791. THE CHECK. Every row of the grid that prints a wind and whose
 * overpressure the comparison reads: |ln(model / program)| < 0.01, G1's 1 %,
 * on the program's entry, as every clause of I1 is held, and on the default
 * entry, where rule 671's departure names no bound for the wind and G1's
 * 1 % stands. The wind is compared at the overpressure the comparison
 * already reads for that row — the ground impact's, or an airburst's low end.
 * A wind outside 1 % can come only through the overpressure, gated at 1 % on
 * the same rows, or through the relation, which rule 789 read at 0.13 %: a
 * failure is a defect of the candidate, and the round is refused.
 *
 * RULE 792. WHAT DECIDES, AND WHAT MOVES. Adopted when every row passes on
 * both entries and the report, regenerated once, keeps the release gate at
 * PASS: I1 gains a twelfth clause, the peak wind, and the globe's wind layer
 * draws it. Refused, the wind layer is not drawn and the legend says that no
 * verified relation gives an impact's wind. Nothing the model already prints
 * moves: the wind is new, and no ring, preset, toll or figure is computed
 * from it.
 */

/*
 * ===========================================================================
 * The outcome of rules 788 to 792, written after the run of 22 September
 * 2026: REFUSED by rule 791
 * ===========================================================================
 *
 * The rules were pushed in `e1bcaca` before the candidate existed. Run on the
 * 81 rows on both entries: the 24 airbursts within 1 % (0.9989× to 1.0013× on
 * the program's entry, 0.9982× to 1.0058× on the default), and all 57 bodies
 * that reach the ground outside it, 1.021× to 5.89×, median 1.19×. Rule 791
 * refuses the round, and the wind is not drawn on its reading.
 *
 * The rule was false on the mechanism. It said the overpressure the
 * comparison gates for a body that reaches the ground is the impact's own
 * field. It is not, since 21 September 2026: the product bursts such a body at
 * the ground (rules 748 to 755), I1's named departure from the program, which
 * reads its law at the altitude Eq. 18 gives below the ground; the comparison
 * gates the program's reading, and the product draws its own. The wind carried
 * that departure through the relation, as it must.
 *
 * ===========================================================================
 * Rules 793 to 797 — the same wind, asked again with the check stated as I1
 * holds the blast. Written the same morning, after the run above.
 * ===========================================================================
 *
 * RULE 793. WHAT THIS ROUND IS. The candidate of rule 790, unchanged: the
 * program's relation, with its constants, on the impact's own overpressure.
 * The globe draws the wind of the blast it draws, and for a body that reaches
 * the ground that is the burst at the ground of rules 748 to 755. The wind of
 * such a body carries I1's named departure for the ground blast, declared with
 * it; it is not a departure of its own.
 *
 * RULE 794. WHAT WAS READ AFTER THE RUN OF RULES 788 TO 792, BEFORE THESE
 * RULES. On the overpressure the comparison gates for each row — the program's
 * law as the program reads it for a body that reaches the ground, an
 * airburst's low end — the relation reads the program's wind at 0.9999× to
 * 1.0008× on the program's entry and at 0.9999× to 1.0017× on the default, on
 * all 81 rows. Everything the check below reads has been read: it is written
 * as a verdict CI holds from now on, not as a question still open.
 *
 * RULE 795. THE CHECK OF THE RELATION. On every row that prints a wind, the
 * relation on the overpressure the comparison gates for that row within 1 % of
 * the program's wind, on both entries: G1's 1 %, the bar of rule 791, not
 * moved.
 *
 * RULE 796. THE CHECK OF WHAT IS DRAWN. For every airburst of those rows the
 * impact's own wind, `impactPeakWindAt`, within 1 % of the program's on both
 * entries, as rule 791 read it. For every body of those rows that reaches the
 * ground, the impact's own wind is the relation on the impact's own
 * overpressure to the last digit — the ground blast's named departure and
 * nothing else — and never a wind the relation would not give for it.
 *
 * RULE 797. WHAT DECIDES, AND WHAT MOVES. Adopted when rules 795 and 796
 * hold and the report, regenerated once, keeps the release gate at PASS: I1
 * gains a twelfth clause, the peak wind, met, with the ground blast's named
 * departure; the globe's wind layer draws the wind of the blast it draws.
 * Nothing the model already prints moves.
 */

/*
 * ===========================================================================
 * The outcome of rules 793 to 797: ADOPTED
 * ===========================================================================
 *
 * Rule 795 holds on all 81 rows on both entries (`eiepComparison.test.ts`,
 * the quantity `wind`), and rule 796 on the 24 airbursts, on both entries, and
 * on the 57 bodies that reach the ground (`impactWindRules.test.ts`). I1 has
 * a twelfth clause, the peak wind; B-106 is closed; the globe's wind layer
 * draws `impactPeakWindAt`. The report was regenerated once, with its gate at
 * PASS.
 */

/** Rules 791 and 795: G1's bound on the peak wind, in |ln(model / program)|. */
export const IMPACT_WIND_TOLERANCE = 0.01;

/** Rule 790: the round constants Collins et al. (2005) and the program use. */
export const PROGRAM_AMBIENT_PRESSURE_PA = 1e5;
export const PROGRAM_SOUND_SPEED_M_S = 330;
