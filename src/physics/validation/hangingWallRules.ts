/**
 * The hanging wall, and the measurement that can carry it: the rules,
 * written before the candidate.
 *
 * Rules 384 to 389 ran Campbell & Bozorgnia 2014 with its hanging-wall
 * term at zero, because the product has no fault plane, and the round
 * refused it on ONE band: Northridge's MMI VIII, 823 km² recorded, 68 from
 * the shipped law, none from the candidate. That band is a shallow reverse
 * rupture under a city — the case where the missing term is largest, since
 * its published maximum is about a factor of 1.5 on PGA at short distance
 * on the upthrown side. The refusal came with a question attached, and
 * this round asks it.
 *
 * TWO THINGS HAVE TO CHANGE TOGETHER, and the second is the interesting
 * one.
 *
 * The term needs R_x, the horizontal distance from the site to the surface
 * trace of the fault measured perpendicular to strike, SIGNED: positive on
 * the side the fault dips towards, which is the hanging wall, and zero or
 * negative on the other. That signed quantity is not a property of a
 * scenario. It is a property of a PLACE, and it differs between two sites
 * at the same distance on opposite sides of the trace.
 *
 * So a ring cannot carry it. A ring is one radius, the same in every
 * direction; the hanging-wall term makes the shaking asymmetric about the
 * trace, and averaging it into a radius would be inventing a scenario
 * where the model describes a geography. The field CAN carry it: it
 * evaluates the law cell by cell, and every cell has its own R_x.
 *
 * Which exposes something this project has been measuring past for a
 * while. The validation report scores the AREAS from the rings — from
 * `footprintAreaKm2`, which is a stadium or a disc — while the product has
 * drawn a field since 20 September 2026 and the reader sees the field.
 * Those are two different geometries and the report quotes the one nobody
 * looks at. Rule 393 moves the measurement onto the field for BOTH
 * contenders, which is both the only way to measure a hanging wall and the
 * end of an inconsistency that predates it.
 *
 * The rules, fixed on 20 September 2026, before the candidate was written
 * and before any of its numbers were seen, numbered after the 389 before
 * them:
 *
 *  390. The geometry the product can feed. A scenario's fault plane is
 *       built from what the product already has: the strike from the
 *       shipped GEM tiles (rule 322), the rupture length and width from
 *       the scaling law the scenario runs, the dip from the style of
 *       faulting (45° reverse, 55° normal, 90° strike-slip — the model's
 *       own convention where a scenario names no dip), and the depth to
 *       the top of rupture from the hypocentre and the width along dip.
 *       Nothing here is fitted or chosen to suit a result.
 *
 *  391. R_x, signed. For a site at a point on the sphere, R_x is the
 *       horizontal distance from the rupture's surface trace, measured
 *       perpendicular to strike, positive on the side the plane dips
 *       towards. The dip direction is strike + 90° by the right-hand rule,
 *       which is the convention the strike in the tiles is written in. A
 *       vertical plane (strike-slip, dip 90°) has no hanging wall and the
 *       term is zero everywhere, as the model's own dip factor
 *       (90 − dip)/45 says.
 *
 *  392. Faithful to its source, with the term in. The grid of rule 385,
 *       crossed with R_x of −30, −5, 0, 5, 20 and 60 km, dips of 30, 45,
 *       60 and 90°, and depths to the top of rupture of 0, 3 and 10 km.
 *       Agreement with the reference implementation within one part in ten
 *       thousand of the predicted PGA, as before. A disagreement anywhere
 *       stops the round.
 *
 *  393. The areas are measured on the FIELD, for both contenders. The area
 *       at or above an intensity is the ground the field covers at that
 *       intensity — `areaAbove` on the same 257 × 257 grid the globe
 *       paints, with the shipped Vs30 under every cell — and not the area
 *       of a ring. The shipped law is re-measured the same way in the same
 *       run, so the comparison is between two laws and not between two
 *       geometries. Both numbers are published, and the ring-based figures
 *       the report has quoted until now are published beside them with the
 *       difference named.
 *
 *  394. The three measurements together, as rule 387 had them, on the new
 *       metric. A candidate replaces the shipped law only if ALL hold:
 *
 *       (a) Areas on the field: the geometric mean of the model-over-record
 *           area ratio is no further from 1 than the shipped law's, on the
 *           same metric and the same run, and the scatter is no wider.
 *           Losing a band the shipped law draws and the record has fails
 *           outright.
 *
 *       (b) The dead, on rule 11's held-out tolls: no fewer records inside
 *           their predictive band than the shipped law, and no row the
 *           shipped law contains is lost.
 *
 *       (c) Monotonicity in magnitude, P-MONO-MW: zero inversions of the
 *           MMI VII radius over magnitudes 4.0 to 9.0 in steps of 0.05.
 *
 *  395. And the depth still does something, as rule 388 asked: the
 *       epicentral intensity falls by at least one whole MMI degree
 *       between 5 km and 50 km at Mw 5.5, 6.5 and 7.5. The clause rule 388
 *       got wrong — a strictly decreasing MMI VII radius in depth — is NOT
 *       carried over: CB14's depth term is positive and beats the geometry
 *       between 7 and 20 km, which is a property of the model, measured
 *       before this round, and not a fault to be demanded away.
 *
 *  396. The hanging wall is not allowed to be the whole answer. The report
 *       prints, for each ShakeMap anchor, the area the candidate draws
 *       with the term and without it. A candidate that passes rule 394
 *       only with the term, on an event whose geometry the product had to
 *       infer rather than read, is adopted with that stated in the
 *       contract and the report.
 *
 *  397. One run, no re-tuning. As rule 389. If a clause of rule 394 fails,
 *       the shipped law stays, the numbers are published anyway, and what
 *       was learned is written down.
 */

/**
 * THE OUTCOME, run once on 20 September 2026 under rule 397 and published
 * as it came out: the candidate is REFUSED again, on the same band, and
 * the run says something about the clause that refused it.
 *
 * Rule 392 — faithful to its source with the term in: PASSED. 864 cases
 * across R_x, dip, Z_tor and width, worst disagreement 9.9e-16.
 *
 * Rule 393 — the areas, measured on the FIELD for both:
 *
 *   | measurement                  | geometric mean | scatter    | bands |
 *   | ---------------------------- | -------------- | ---------- | ----- |
 *   | rings, as the report quoted  | 0.81x          | sigma 1.32 | 10    |
 *   | boore2014 on the field       | 0.73x          | sigma 1.34 | 10    |
 *   | CB14 on the field, with HW   | **1.08x**      | sigma 1.39 | 9     |
 *
 *   The first two lines are the inconsistency this rule was written to
 *   end: the same shipped law, measured two ways, is 0.81x from its rings
 *   and 0.73x from the field the reader actually sees. Neither is wrong;
 *   they are different geometries, and the report has been quoting the one
 *   nobody looks at.
 *
 * Rule 394(a) — areas: FAILED, twice over. The scatter is wider (1.39
 * against 0.73x's 1.34), and Northridge's MMI VIII band is still lost.
 *
 * Rule 394(c) — monotonicity in magnitude: PASSED, zero inversions.
 * Rule 395 — the depth still does something: PASSED, 1.9 to 2.8 MMI
 * degrees between 5 km and 50 km.
 *
 * Rule 396 — with the term and without it, on Northridge: MMI VII goes
 * from 2 373 km² to 2 477, and the peak intensity from 7.60 to 7.73. The
 * term is real and it is working. It is not enough, and the reason is
 * geometric rather than seismological: MMI VIII needs 8.0, and CB14 puts
 * Northridge's peak at 7.73 because the closest the rupture gets to the
 * city, in the geometry rule 390 infers, is 14.2 km.
 *
 * WHY THAT NUMBER IS WHAT IT IS, and it is the finding of this round.
 * Rule 390 builds the plane by hanging the rupture symmetrically about its
 * hypocentre: Z_tor = depth − (W/2)·sin(dip), which for Northridge's focus
 * at 19 km and a 13.7 km width gives 14.2 km. The real Northridge ruptured
 * UPWARD from its focus and its top reached about 5 km. A rupture is not
 * centred on its hypocentre, and no scaling law knows which way a
 * particular one grew. The product cannot read it either — the shipped
 * tiles carry a strike and nothing about where a rupture would nucleate on
 * the plane.
 *
 * So the candidate loses a band because the product cannot know a piece of
 * geometry, not because its physics is worse. And the law that wins that
 * band wins it by ignoring depth altogether: Boore et al. 2014 reads R_jb
 * = 0 above the rupture whatever the depth, so it draws MMI VIII — 79 km²
 * of it, against the 823 the ShakeMap recorded, which is a tenth of the
 * truth. The clause as written credits that and refuses 1.08x. It is
 * published as written: a clause read after the fact is not a clause.
 *
 * WHAT WOULD SETTLE IT, for whoever picks this up: a rupture's top is a
 * quantity the NGA-West2 programme itself estimates from magnitude and
 * style when it is not known — Chiou & Youngs 2014 equations 4 and 5, which
 * OpenQuake carries as `estimate_ztor`. Adopting that estimator is a
 * change to rule 390's geometry, which means a round of its own with its
 * own rules written first, and it must be adopted for BOTH contenders or
 * it is a thumb on the scale.
 */

export const HANGING_WALL_RULES = 'rules 390 to 397, fixed 20 September 2026';
