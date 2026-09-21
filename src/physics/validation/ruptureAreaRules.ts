/**
 * Rules 613 to 620 — a rupture big enough for its own moment,
 * 21 September 2026, written and pushed before the candidate was run.
 *
 * WHY. B-087 is open. `ruptureLength.ts` evaluates Wells & Coppersmith
 * (1994)'s normal-fault regressions wherever the magnitude goes, and their
 * normal-faulting dataset stops near Mw 7.3. At Mw 9.83 they return an
 * 807 × 200 km rupture, and the moment 7.09 × 10²³ N·m then has to fill it
 * with 146.2 m of slip. The largest slip ever measured is Tōhoku's ≈ 50 to
 * 60 m. Of the 5 000 earthquakes the sweep draws, 53 imply more than 100 m.
 *
 * RULE 613. WHAT THE FIX IS. Not a new scaling relation, and not a refusal
 * of the magnitude. The three numbers M₀, L and W are related by
 * M₀ = μ·L·W·D, so if D comes out impossible then L·W is too small for the
 * moment it is being asked to carry. The rupture area therefore has a
 * FLOOR:
 *
 *     L·W  ≥  M₀ / (μ · D_max)
 *
 * and when the scaling relation returns less than that, the rupture is
 * grown to it. Below the floor nothing changes at all.
 *
 * RULE 614. THE BOUND IS THE ONE ALREADY FIXED. D_max is
 * `MAX_CREDIBLE_SLIP_M` = 100 m from rules 605 to 612 — twice Tōhoku's
 * measured 50 to 60 m — and it is not moved for this round. It was chosen
 * before any of this was measured, which is the whole reason it can be
 * used now.
 *
 * RULE 615. HOW IT GROWS. L and W are scaled by the same √(floor / area),
 * so the rupture keeps the aspect ratio its own relation gave it. Growing
 * one and not the other would be choosing a shape, and this round has no
 * grounds to choose one.
 *
 * RULE 616. WHERE IT MAY BITE, fixed before the run. Only where the slip is
 * impossible. The candidate is REFUSED if the rupture changes at or below
 * Mw 9.5 — the largest earthquake ever recorded — on any fault type, at any
 * depth the sweep draws, interface or not.
 *
 * RULE 617. WHAT ELSE REFUSES IT. Any one of these:
 *
 *   (a) any validation row, preset or recorded event moves;
 *   (b) the validation report is not byte-identical;
 *   (c) the suite goes red anywhere;
 *   (d) the 53 readings of rules 605 to 612 do not go to none.
 *
 * RULE 618. WHAT IT DOES NOT CLAIM. It does not make a normal-faulting
 * Mw 9.8 a real earthquake — no normal fault makes one, and the product
 * still draws it because its input form allows it. It makes the geometry
 * and the moment agree, which is a statement about arithmetic and is the
 * only part this round can honestly fix. Whether the form should refuse the
 * magnitude at all is a separate judgement and is left open.
 *
 * RULE 619. NO RE-TUNING. If the floor as written is refused by rule 616 or
 * 617, it is published as refused and D_max is not moved to make it pass.
 *
 * RULE 620. ONE RUN, and the answer is published whatever it is.
 */

/** Rule 616: below and at this magnitude the rupture may not change. */
export const RUPTURE_FLOOR_REFUSAL_MAGNITUDE = 9.5;

export const RUPTURE_AREA_RULES = 'rules 613 to 620, fixed 21 September 2026';
