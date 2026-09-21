/**
 * Rules 621 to 629 — G5's harness read by the protocol's own definition,
 * for impacts. 21 September 2026, IMP-1 of ROADMAP.md M11, written and
 * pushed before the corrected harness is run.
 *
 * WHY. GOLD_STANDARD.md, "Three decisions of 21 September 2026": G5 asks
 * that five thousand scenarios finish, give finite numbers, stay inside the
 * Earth and the antipode, and are monotone wherever the physics is. It asks
 * nothing of continuity. Continuity belongs to the benchmark's invariants
 * track, which BENCHMARK_PROTOCOL.md defines as "continuity at regime
 * switches", and `scripts/benchmark/invariants.ts` applied it to every ring
 * at every point: a 0.1 % larger body may not move any ring by more than
 * 5 %. A threshold contour cannot pass that where it is born — it grows as
 * the square root of the excess, so its elasticity is unbounded there
 * (`events/impact/ringBirth.test.ts`) — and the thirteen impact failures it
 * counted are all of that kind, each at an unchanged regime.
 *
 * RULE 621. WHAT THIS ROUND IS. It changes the harness, not the model's
 * numbers: no ring, no preset, no row and no figure of the report may move.
 * It is read on impacts only. The module rule of 21 September forbids opening
 * another domain without Andrea's order, so every other hazard keeps the
 * check it has, and what the sweep prints for them in this run is not read.
 *
 * RULE 622. TWO KINDS OF OUTPUT, fixed now for impacts.
 *
 *   - A CONTOUR is the range at which a threshold is crossed: the crater
 *     rim, the two burn rings, the three overpressure rings and the two edges
 *     of the ejecta blanket.
 *   - Everything else the sweep reads is a VALUE of the model: the final
 *     crater, the seismic magnitude, the wave at 1 000 and 5 000 km, and the
 *     field samples of rule 624.
 *
 * RULE 623. CONTOURS ARE CHECKED FOR CONTINUITY AT A REGIME SWITCH, as the
 * protocol says. An impact's regime is its entry regime (intact, partial
 * airburst, complete airburst) together with its crater's morphology (simple
 * or complex). Where the grown body's regime differs from the base body's, a
 * contour may not move by more than 5 %, exactly as before; where it does not
 * differ, a contour is not checked for continuity. It is still checked for
 * monotonicity everywhere, as G5 asks.
 *
 * RULE 624. THE FIELD IS CHECKED EVERYWHERE, and this is what makes the
 * harness stricter rather than looser. The model publishes, from the same
 * closures it draws its rings from, the overpressure and the thermal
 * exposure at seven fixed ground ranges from the point of impact — 1, 3, 10,
 * 30, 100, 300 and 1 000 km. Under the same 0.1 % step each may not move by
 * more than 5 %, at every scenario, regime switch or not. Nothing reads the
 * field today; after this round a jump in the physics can no longer hide
 * behind a contour's conditioning, and a contour's conditioning can no longer
 * pass for a jump in the physics.
 *
 * RULE 625. WHERE A FIELD SAMPLE IS TOO SMALL TO MATTER, it is not compared:
 * an overpressure below 100 Pa in both runs — a thirty-fourth of the
 * lightest damage the product draws, 3 447 Pa (the rule as pushed said "a
 * twentieth"; the number was always 100 Pa) — and a thermal exposure below 1 000 J/m² in both,
 * about a two-hundredth of the lowest burn threshold. The same reason the
 * harness has never compared a ring under a millimetre.
 *
 * RULE 626. THE FIELD IS THE MODEL'S OWN, and a test says so. The samples
 * are computed inside `simulateImpact` from the variables its rings are drawn
 * from, and `events/impact/impactField.test.ts` requires that at the radius of
 * each overpressure ring the published field equals that ring's threshold,
 * on scenarios of every entry regime. A field the harness reads that is not
 * the field the product draws would check nothing.
 *
 * RULE 627. ONE RUN, reading both checks side by side. The impact family's
 * 5 000 scenarios, the sweep's own seed, the continuity check as it was and
 * as corrected, in the same run — the guard of BENCHMARK_PROTOCOL.md's
 * Conduct, a reading taken together and never a count carried from another
 * day.
 *
 * RULE 628. WHAT IS EXPECTED, written before the run so that the run can
 * contradict it:
 *
 *   (a) the thirteen contour failures at an unchanged regime are no longer
 *       counted;
 *   (b) the two failures at the simple-to-complex crater transition still
 *       are, because the morphology switches there — that is a regime switch
 *       and a real discontinuity, and IMP-2 owns it;
 *   (c) every monotonicity failure is counted as before, since this round
 *       does not touch monotonicity;
 *   (d) the field is continuous: none of its fourteen samples jumps. Any that
 *       does is a discontinuity of the physics the old check could not see,
 *       and it is registered for IMP-2, not explained away.
 *
 * RULE 629. WHAT IT DOES NOT CLAIM. G5 is not met by this round. It is met
 * when a run of this harness reads no failure on impacts, which needs IMP-2
 * first. And every other domain keeps the old reading until its own domain
 * is opened by Andrea's order.
 */

/** Rule 624: the fixed ground ranges the field is sampled at, in metres. */
export const FIELD_RANGES_M = [1e3, 3e3, 1e4, 3e4, 1e5, 3e5, 1e6] as const;

/** Rule 625: below these in both runs a field sample is not compared. */
export const FIELD_FLOOR = {
  overpressurePa: 100,
  thermalExposureJm2: 1_000,
} as const;

/** Rules 623 and 624: the step and the tolerance, unchanged from the harness. */
export const CONTINUITY_STEP = 1.001;
export const CONTINUITY_TOLERANCE = 0.05;

export const CONTINUITY_RULES = 'rules 621 to 629, fixed 21 September 2026';
