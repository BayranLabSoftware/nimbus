/**
 * Rules 630 to 637 — B-088, an impact that reaches the ground and makes no
 * air blast. 21 September 2026, IMP-2a of ROADMAP.md M11, written and pushed
 * before the candidate runs.
 *
 * RULE 630. WHAT WAS FOUND. IMP-2's diagnosis of the impact sweep, reading
 * why 246 blast rings of bodies that reach the ground shrink as the body
 * grows, counted the impacts that make no air blast at all: of the 3 904
 * scenarios of the sweep's 5 000 that reach the ground, **46 above one
 * kilotonne draw no overpressure ring** — the largest a 417 m body of 663 Mt
 * at 85° from the horizon. No impact of 663 megatonnes leaves the air still.
 *
 * RULE 631. THE CAUSE. The program's ground blast (rules 138 to 145) reads
 * its Mach relation, 2005 Eq. 54, with a crossover r_x = 290 + 0.65 z₁ that
 * shortens as Eq. 18's altitude z₁ goes below the ground. Where r_x ≤ 0 the
 * program returns an error, and rule 138 chose what to draw there: no blast,
 * "the limit the program's own relation falls to". The collapse toward that
 * limit is not physics either: the same construct is what makes the 814 m
 * body of IMP-1's field check move its whole field 7 % for a body 0.1 %
 * larger, at r_x ≈ 3.
 *
 * RULE 632. WHAT IS KEPT. The program's law, exactly, wherever its crossover
 * is at least the shortest at which it has been checked here — every ground
 * point of the I1 grid (57, `validation/eiepReference.ts`) and the twelve
 * held-out bodies of rule 139, 69 points — whose shortest crossover is
 * **53.0467685789 m/kt^⅓**. Its angle dependence (BM-21), its dip where a
 * body turns from an airburst into a ground impact, and every number checked
 * against the program stay as they are.
 *
 * RULE 633. THE DEPARTURE. Below that, the crossover is held at 53.0468 and
 * the energy stays the program's own, E₀ · max(f, 1 − f). It is a departure
 * from the program, named in the report, and its reason is this: past the
 * shortest crossover it has been checked at, the construct heads to an error
 * the program returns and to an impossibility this product drew.
 *
 * RULE 634. WHAT THE NUMBER IS NOT. It is not physics. It is the edge of
 * where the field's tool has been checked, and the product declines to follow
 * it past its own checks into an impossibility — as B-084's ceiling declined
 * to follow a relation past the box it was fitted in. A physical model of how
 * much of a steep ground impact's energy reaches the air as blast would
 * replace it. None is in hand, and these rules say so.
 *
 * RULE 635. WHAT MUST HOLD, fixed before the run; any one that fails refuses
 * the candidate:
 *
 *   (a) none of the 69 checked points moves — every one has a crossover of
 *       at least 53.0468, and the one at 53.0468 is held at itself;
 *   (b) no preset moves: the ground-reaching presets' crossovers run from
 *       62.5 (Meteor Crater) to 281.5 (Chicxulub), and the rest are
 *       airbursts, which this does not touch;
 *   (c) the validation report regenerates byte-identical but for the lines
 *       this round writes;
 *   (d) on the sweep, no impact that reaches the ground with more than one
 *       kilotonne draws no blast: 46 become none;
 *   (e) the 814 m body's field no longer moves 7 % under a 0.1 % step, and no
 *       field sample jumps under the held law that did not under the law in
 *       place.
 *
 * And what is expected without deciding: the ground blast's monotonicity
 * failures below the held crossover go, and those above it — the dip — stay,
 * because they are the program's law where it has been checked, and IMP-2b
 * owns them.
 *
 * RULE 636. ONE RUN. The impact sweep's 5 000 scenarios under the law in
 * place and under the held law, on the same commit in the same session, both
 * published.
 *
 * RULE 637. NO RE-TUNING. 53.0468 is fixed by the checked points. If a
 * prediction fails it is published as failed, and the number is not moved.
 */

/** Rule 632: the shortest crossover (m/kt^⅓) at which the program's ground
 *  blast has been checked here. */
export const VERIFIED_MIN_CROSSOVER = 53.0467685789;

export const GROUND_BLAST_FLOOR_RULES = 'rules 630 to 637, fixed 21 September 2026';
