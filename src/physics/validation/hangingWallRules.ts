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

export const HANGING_WALL_RULES = 'rules 390 to 397, fixed 20 September 2026';
