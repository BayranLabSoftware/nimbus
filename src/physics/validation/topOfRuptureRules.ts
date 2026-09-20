/**
 * Where the top of a rupture is: the rules, written before the candidate.
 *
 * Rules 390 to 397 refused Campbell & Bozorgnia 2014 on one band —
 * Northridge's MMI VIII — and named the reason. Rule 390 hangs a rupture
 * symmetrically about its hypocentre, so Northridge's focus at 19 km with
 * a 13.7 km width puts the top of the rupture at 14.2 km, and the closest
 * the model lets that earthquake get to the city above it is 14 km. The
 * real one ruptured UPWARD and its top reached about 5. A rupture is not
 * centred on its focus.
 *
 * The NGA-West2 programme estimates the top of rupture from magnitude and
 * style when it is not known — Chiou & Youngs (2014), equations 4 and 5,
 * carried in OpenQuake as `estimate_ztor`:
 *
 *   reverse:  Z_tor = max(2.704 − 1.226·max(M − 5.849, 0), 0)²
 *   other:    Z_tor = max(2.673 − 1.136·max(M − 4.970, 0), 0)²
 *
 * It gives 2.76 km for a reverse Mw 6.7, against the 14.2 the present
 * geometry infers.
 *
 * WHAT THE ESTIMATOR ALONE WOULD DO, AND WHY IT IS NOT USED ALONE. Those
 * equations depend on magnitude and style and on NOTHING ELSE. Taken as
 * they are, a Mw 6.5 at 5 km and one at 60 km would both have their
 * rupture top at 6 km, the distance to every site above them would be the
 * same, and the depth would leave the answer entirely — except through
 * CB14's own depth term, which is POSITIVE, so the deeper earthquake would
 * come out SHAKING HARDER. That is the opposite of the defect this whole
 * line of work set out to fix, and adopting it would be a candidate
 * winning by deleting the question.
 *
 * So the estimator is a FLOOR and not a value, bounded by the rupture the
 * scenario actually has:
 *
 *   Z_tor = min( hypocentre depth, max( CY14 estimate, depth − W·sin δ ) )
 *
 * The middle term is the shallowest a rupture of that width can reach from
 * that focus: it cannot extend past its own width. For Northridge that is
 * 9.3 km — deeper than the estimator's 2.76 and much shallower than
 * today's 14.2. For a Mw 6.5 at 60 km it is 49 km, and the depth goes on
 * meaning what it means.
 *
 * The rules, fixed on 20 September 2026, before the candidate was built
 * and before any of its numbers were seen, numbered after the 398 before
 * them:
 *
 *  399. The geometry. The depth to the top of rupture is the expression
 *       above, with the CY14 estimate by style of faulting, the width from
 *       the scenario's own scaling law, and the dip of rule 390. It
 *       replaces rule 390's symmetric hanging for every law that reads a
 *       top of rupture.
 *
 *  400. Faithful to its source. The estimate agrees with Chiou & Youngs's
 *       equations, as the reference implementation evaluates them, to
 *       within one part in a million over magnitudes 4.0 to 8.5 in steps
 *       of 0.1 and both branches of the style test.
 *
 *  401. The shipped law does not move. Boore et al. 2014 reads no top of
 *       rupture, so its field is identical before and after, and the
 *       report shows that it is — the same numbers to the last digit. A
 *       change of geometry that moved the incumbent would make the
 *       comparison a comparison of two things at once.
 *
 *  402. The measurements of rule 394, unchanged, on the new geometry:
 *
 *       (a) Areas on the FIELD, both contenders, same run: the geometric
 *           mean of the model-over-record area ratio no further from 1
 *           than the shipped law's 0.73x, the scatter no wider than its
 *           1.34, and no band lost that the shipped law draws and the
 *           record has.
 *
 *       (b) The dead, on rule 11's held-out tolls: no fewer records inside
 *           their band than the shipped law, and none lost.
 *
 *       (c) Monotonicity in magnitude, P-MONO-MW: zero inversions over
 *           4.0 to 9.0 in steps of 0.05.
 *
 *  403. And the depth must still do something, as rule 395 asked and for
 *       the same reason: the epicentral intensity falls by at least one
 *       whole MMI degree between 5 km and 50 km at Mw 5.5, 6.5 and 7.5.
 *       This clause is what stops the estimator from buying a pass by
 *       flattening the depth out of the model, and it is checked on the
 *       candidate WITH the new geometry.
 *
 *  404. One run, no re-tuning. If a clause of rule 402 or rule 403 fails,
 *       the shipped law stays and the numbers are published anyway. No
 *       coefficient, bound or branch of the geometry is adjusted after a
 *       number is seen.
 */

/**
 * THE OUTCOME, run once on 20 September 2026 under rule 404 and published
 * as it came out: the candidate is REFUSED. The shipped law stays. This
 * is the third refusal in a row, and the closest of the three.
 *
 * Rule 400 — faithful to its source: PASSED exactly, 0 difference across
 * magnitudes 4.0 to 8.5 on both branches.
 *
 * Rule 401 — the incumbent does not move: PASSED. Boore et al. 2014 reads
 * no top of rupture and its field is identical to the last digit, 0.73x
 * with scatter 1.34 before and after.
 *
 * Rule 402(a) — areas on the field: FAILED, on the second half of the
 * clause.
 *
 *   | law       | geometric mean | scatter    | bands |
 *   | --------- | -------------- | ---------- | ----- |
 *   | boore2014 | 0.73x          | sigma 1.34 | 10    |
 *   | CB14      | **0.92x**      | sigma 1.53 | 10    |
 *
 *   The geometry did what it was meant to. Northridge's MMI VIII band is
 *   BACK — 92 km² against the shipped law's 79, where the ShakeMap has
 *   823 — and no band is lost at all, where the last round lost one. The
 *   bias improves from 0.73x to 0.92x, which is most of the way to
 *   centred.
 *
 *   And the scatter widens, from 1.34 to 1.53, which the clause forbids.
 *   Combining the two into one number does not rescue it: the total error
 *   in log terms, sqrt(ln(bias)² + scatter²), is 1.376 for the shipped law
 *   against 1.532 for the candidate. The clause is not being clever at the
 *   candidate's expense; the candidate is genuinely not better overall on
 *   this set.
 *
 *   Where the scatter comes from is worth having: both laws overdraw the
 *   two small Italian events and the candidate overdraws them more —
 *   L'Aquila 392 km² against 61 recorded (6.4x, where Boore gives 2.8x),
 *   Amatrice 294 against 26 (11x, where Boore gives 5.1x). Both models are
 *   fitted on NGA-West2's mostly Californian data, and both are furthest
 *   from the record on the Apennine normal-faulting earthquakes. The
 *   candidate carries more of the ground motion into the answer, so it
 *   carries more of that error too.
 *
 * Rule 402(c) — monotonicity: PASSED, zero inversions.
 * Rule 403 — the depth still does something: PASSED, and this is what the
 * three rounds were for. The epicentral intensity falls 1.85, 2.45 and
 * 1.46 MMI degrees between 5 km and 50 km at Mw 5.5, 6.5 and 7.5. A law
 * that carries the depth, with a rupture top that is not invented, is
 * here and works.
 *
 * WHAT THE THREE ROUNDS LEAVE. A complete, checked NGA-West2 model with
 * the hanging wall, a defensible rupture geometry and the depth in its
 * answers, reachable as `campbellBozorgnia2014`, refused three times on
 * the areas of six ShakeMaps — the last time by a scatter of 1.53 against
 * 1.34. And a shipped law that keeps the rings while carrying no depth at
 * all, which the panel still has to say out loud.
 *
 * The honest next question is not about the candidate. It is whether six
 * events is enough of a jury to decide a contour law on, when two of them
 * are Apennine normal faults that BOTH laws miss by a factor of three or
 * more, and a seventh event could move the scatter either way. Rule 18
 * chose the shipped law on 370 ShakeMaps; rules 394, 402 and their
 * ancestors decide on six, because six is what the repository carries as
 * fixtures. Widening that set is a round of its own, it needs no new
 * physics, and it would tell us whether this candidate has been refused
 * three times by the evidence or by the sample.
 */

export const TOP_OF_RUPTURE_RULES = 'rules 399 to 404, fixed 20 September 2026';

/**
 * Chiou & Youngs (2014) equations 4 and 5: the depth to the top of a
 * rupture, estimated from magnitude and style, in kilometres.
 *
 * Read from OpenQuake's `estimate_ztor` in
 * `openquake/hazardlib/gsim/campbell_bozorgnia_2014.py` (GEM Foundation),
 * which cites the paper; the paper itself was not read here.
 */
export function chiouYoungs2014TopOfRuptureKm(
  magnitude: number,
  style: 'reverse' | 'normal' | 'strike-slip'
): number {
  const base =
    style === 'reverse'
      ? Math.max(2.704 - 1.226 * Math.max(magnitude - 5.849, 0), 0)
      : Math.max(2.673 - 1.136 * Math.max(magnitude - 4.97, 0), 0);
  return base * base;
}

/**
 * Rule 399's top of rupture: the estimate as a floor, bounded by the
 * rupture the scenario actually has.
 */
export function topOfRuptureKm(input: {
  magnitude: number;
  hypocentreDepthKm: number;
  ruptureWidthKm: number;
  dipDeg: number;
  style: 'reverse' | 'normal' | 'strike-slip';
}): number {
  const reach = input.ruptureWidthKm * Math.sin((input.dipDeg * Math.PI) / 180);
  const shallowestItCanReach = input.hypocentreDepthKm - reach;
  const estimate = chiouYoungs2014TopOfRuptureKm(input.magnitude, input.style);
  return Math.min(input.hypocentreDepthKm, Math.max(estimate, shallowestItCanReach, 0));
}
