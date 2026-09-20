/**
 * A crustal law that carries the depth: the rules, written before the
 * candidate.
 *
 * The defect and the three measurements that disagree about what to do
 * with it are in `docs/DEPTH_AND_THE_CONTOUR_LAW.md`, measured on 20
 * September 2026 and written down before this file. In short: a Mw 7.0 at
 * 3 km and one at 65 km draw the same rings to the last digit, because
 * Boore et al. 2014 works in Joyner-Boore distance and carries no depth at
 * all; the law already in the repository that does carry it, Allen et al.
 * 2012, makes the areas worse and — in the variant rule 59 adopts — drops
 * the MMI VII radius by two thirds between Mw 7.4 and 7.5, which fails the
 * monotonicity property.
 *
 * So the candidate is neither: Campbell & Bozorgnia (2014), the NGA-West2
 * model fitted on the same database as Boore et al. 2014 and carrying the
 * hypocentral depth (equations 21 to 23) and the depth to the top of
 * rupture. If it is to replace the shipped law it has to be better on the
 * ground the shipped law was chosen on, not only on the question that
 * motivated the change — which is why the rules below measure areas, dead
 * and monotonicity TOGETHER, the comparison neither rule 19 nor rule 59
 * made.
 *
 *   Campbell, K. W. & Bozorgnia, Y. (2014). "NGA-West2 Ground Motion Model
 *     for the Average Horizontal Components of PGA, PGV, and 5% Damped
 *     Linear Acceleration Response Spectra." Earthquake Spectra 30 (3),
 *     1087–1115. DOI: 10.1193/062913EQS175M.
 *
 * The equation and its PGA coefficients are read from OpenQuake's
 * implementation, `CampbellBozorgnia2014` in openquake.hazardlib (GEM
 * Foundation), which cites the paper; the paper itself was not read here,
 * and the validation page says so — the same provenance, and the same
 * admission, as Allen et al. 2012 already carries.
 *
 * WHAT THIS PROJECT CANNOT FEED IT, declared before any number is run:
 * CB14 has a hanging-wall term that needs R_x and the rupture's dip
 * geometry, and a basin term that needs Z_2.5, the depth to the 2.5 km/s
 * shear-wave horizon. Neither is available here for an arbitrary point on
 * Earth. Both are set to zero, which is what the model does where the
 * data is absent, and both are declared in the visual contract and the
 * report rather than quietly dropped. A candidate that wins because a term
 * is missing has not won, so rule 386 checks the size of what is left out.
 *
 * The rules, fixed on 20 September 2026, before the candidate was written
 * and before any of its numbers were seen, numbered after the 383 before
 * them:
 *
 *  384. The candidate. Campbell & Bozorgnia (2014) for PGA, as
 *       `campbellBozorgnia2014` in `ContourLaw`, with the hanging-wall and
 *       basin terms at zero, the depth to the top of rupture from the
 *       scenario's own rupture geometry, and the hypocentral depth from its
 *       input. Its ground-motion value goes through the same Worden et al.
 *       2012 conversion to intensity that every other law here goes
 *       through, so what changes between candidates is the ground motion
 *       and nothing else.
 *
 *  385. Faithful to its source. On a grid of magnitudes 4.0 to 8.0 in steps
 *       of 0.5, rupture distances 1, 5, 10, 20, 50, 100 and 200 km, Vs30
 *       180, 360, 760 and 1100 m/s, hypocentral depths 5, 15 and 30 km and
 *       each of the three styles of faulting, this implementation agrees
 *       with the reference implementation to within one part in ten
 *       thousand of the predicted PGA. Where the reference cannot be run on
 *       this machine, the check is against the values it prints for the
 *       same grid, recorded in `campbellBozorgnia2014Reference.ts` and
 *       committed with their provenance. A disagreement anywhere on the
 *       grid stops the round: an implementation that is not its source is
 *       not a candidate.
 *
 *  386. What is left out is small where it matters. With the hanging-wall
 *       and basin terms at zero, the candidate is run on the six ShakeMap
 *       anchors of rule 56 and on rule 11's tolls. The report prints, for
 *       each, how far the omitted terms could move the answer at the sites
 *       that decide it — the hanging-wall term's published maximum is a
 *       factor of about 1.5 on PGA at short distances on the upthrown side,
 *       the basin term's about 2 in deep basins. A round that cannot say
 *       this is not decided.
 *
 *  387. The three measurements together, on the sets each was chosen on.
 *       A candidate replaces the shipped law only if ALL THREE hold:
 *
 *       (a) Areas, on the ShakeMap footprints of rule 56: the geometric
 *           mean of the model-over-record area ratio is no further from 1
 *           than the shipped law's 0.81x, and the scatter is no wider than
 *           its sigma_ln of 1.32. Losing a band the shipped law draws and
 *           the record has — Northridge's MMI VIII — fails this clause
 *           outright, whatever the means say.
 *
 *       (b) The dead, on rule 11's held-out tolls: the count of records
 *           inside their predictive band is no lower than the shipped
 *           law's, and no row that the shipped law contains is lost.
 *
 *       (c) Monotonicity, P-MONO-MW: over magnitudes 4.0 to 9.0 in steps
 *           of 0.05 at 10 km depth, the MMI VII radius never decreases.
 *           Zero inversions, not "few" — this is the clause the law rule 59
 *           adopted fails, and it is written here in the form it failed in.
 *
 *  388. And the depth does something. Over magnitudes 5.5, 6.5 and 7.5 at
 *       depths 5, 15, 30, 50 and 65 km, the MMI VII radius is strictly
 *       decreasing in depth at every magnitude, and the epicentral
 *       intensity falls by at least one whole MMI degree between 5 km and
 *       50 km. A law that carries the depth in its equations and not in its
 *       answers has not fixed what this round is for.
 *
 *  389. One run, no re-tuning. The candidate is run once on each set above.
 *       If it fails a clause of rule 387 the shipped law stays, the numbers
 *       are published anyway, and what was learned is written down. No
 *       coefficient of the candidate is fitted, adjusted or chosen here: it
 *       is the published model or it is nothing.
 */

/**
 * THE OUTCOME, run once on 20 September 2026 under rule 389 and published
 * as it came out: the candidate is REFUSED. The shipped law stays.
 *
 * Rule 385 — faithful to its source: PASSED. 2 268 cases, worst
 * disagreement 1.8e-15. The check earned its place twice over: it caught
 * the magnitude term read as clamped (a factor of 2.5 at Mw 8.0), and
 * running the round caught a second mistake of mine that no unit test
 * would have — R_rup was being measured to the HYPOCENTRE rather than to
 * the top of the rupture. A rupture reaches up from its focus by about
 * half its width, so Northridge's focus at 18 km sits under a rupture
 * whose top is near 5: a factor of three on the distance to every site
 * above it. With that corrected the candidate's areas moved from 0.51x to
 * 1.04x, which is the difference between a broken candidate and a real
 * one.
 *
 * Rule 387(a) — areas, on the six ShakeMap anchors: FAILED, on the clause
 * that matters most and by a single band.
 *
 *   | law        | geometric mean | scatter    | bands |
 *   | ---------- | -------------- | ---------- | ----- |
 *   | boore2014  | 0.81x          | sigma 1.32 | 10    |
 *   | CB14       | **1.04x**      | sigma 1.33 | 9     |
 *
 *   CB14 is BETTER CENTRED than the shipped law — 1.04x against 0.81x,
 *   with the same scatter — and it still fails, because it loses
 *   Northridge's MMI VIII band: 823 km² recorded, 68 km² from Boore, none
 *   at all from CB14. Rule 387(a) says losing a band the shipped law draws
 *   and the record has fails the clause outright whatever the means say,
 *   and it was written that way before any of this was run.
 *
 * Rule 387(c) — monotonicity in magnitude: PASSED. Zero inversions over
 * 101 magnitudes, the same as the shipped law, and unlike the law rule 59
 * adopts, which drops 38.8 km at Mw 7.5.
 *
 * Rule 388 — the depth does something: HALF PASSED, and the half that
 * failed is a rule written badly rather than a candidate behaving badly.
 *
 *   The epicentral intensity falls by 1.9 to 2.8 MMI degrees between 5 km
 *   and 50 km, where the rule asked for at least one. That is the defect
 *   this round set out to fix, and the candidate fixes it.
 *
 *   The MMI VII radius is NOT strictly decreasing in depth: at Mw 6.5 it
 *   reads 12.9 km at 5 km deep and 13.1 km at 15 km. The reason is in the
 *   model and was measured before the round: CB14's depth term is positive
 *   — at equal distance a deeper source shakes harder, because less of the
 *   path spends itself in the slow top of the crust — and between 7 and
 *   20 km it briefly beats the geometry. Rule 388 was written before that
 *   was known, and it asked for a monotonicity the model does not have and
 *   does not claim. It is not amended here: an outcome measured against a
 *   rule written afterwards is worth nothing, and this one is published as
 *   it stands.
 *
 * WHAT THIS ROUND LEAVES. The shipped law keeps drawing the rings, and a
 * hypocentre depth still does nothing to them below 70 km. What is now
 * known that was not:
 *
 *   - A law that carries the depth is here, written, checked against its
 *     source, and reachable as `campbellBozorgnia2014` for anyone who asks
 *     for it by name.
 *   - It is better centred on the recorded areas than the law that ships,
 *     and it is refused on one band of one event — which is a much
 *     narrower defeat than the 2.58x of the other candidate.
 *   - The band it loses is Northridge's MMI VIII, a shallow rupture close
 *     under a city: exactly the case where the hanging-wall term rule 386
 *     declares missing would be largest, since its published maximum is
 *     about a factor of 1.5 on PGA at short distance on the upthrown side.
 *     Whether feeding that term would recover the band is the next round's
 *     question, not this one's, and answering it needs R_x and a fault
 *     plane the product does not have today.
 */

export const DEPTH_CARRYING_LAW_RULES = 'rules 384 to 389, fixed 20 September 2026';
