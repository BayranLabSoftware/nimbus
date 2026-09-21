/**
 * Rules 647 to 653 — the final crater does not shrink as its transient
 * grows. 21 September 2026, IMP-2 of ROADMAP.md M11, written and pushed
 * before the candidate runs.
 *
 * RULE 647. WHAT IS OPEN. Collins, Melosh & Marcus (2005) give the final
 * crater two fits that do not meet: 1.25 · D_tc while that stays under the
 * transition diameter D_c (Eq. 22), and 1.17 · D_tc^1.13 / D_c^0.13 above it
 * (Eq. 27). At D_tc = 2.56 km, where 1.25 · D_tc reaches D_c = 3.2 km, the
 * first gives 3.20 km and the second 2.91 km, so a body whose transient
 * crosses 2.56 km cuts a final crater nine per cent SMALLER than one a hair
 * smaller. G5 counts it twice on the sweep, the rim and the final diameter
 * (`events/impact/craterTransition.test.ts`). A crater's final diameter does
 * not shrink as its transient grows — the collapse of a complex crater widens
 * the transient cavity, it does not narrow it — so this is the two fits'
 * seam, not physics.
 *
 * RULE 648. THE DEPARTURE. Where the complex fit applies, the final crater is
 * the larger of that fit and D_c: it holds at the transition diameter until
 * the complex fit reaches it. On Earth that is a transient from 2 560 m to
 * 2 784.9 m, and nowhere else does anything change.
 *
 * RULE 649. WHY THIS JOIN. It is the smallest change that makes the final
 * diameter non-decreasing: it touches nothing outside the gap, adds no
 * parameter, and holds the diameter at which the paper itself says the
 * morphology changes. A blend across the transition would move craters on
 * both sides of it, and there is no measurement that would say how wide.
 *
 * RULE 650. WHAT IS NOT TOUCHED. The crater's depth. It drops at the
 * transition because a complex crater's floor rebounds and its walls
 * collapse — the physics, not a seam — and inside the gap it is the complex
 * depth at the held diameter.
 *
 * RULE 651. WHAT MUST HOLD, any failure refusing the candidate:
 *
 *   (a) none of the 57 crater rows of the I1 grid moves — none has a
 *       transient in the gap;
 *   (b) no preset moves — none has a transient in the gap;
 *   (c) the report changes only in this round's lines;
 *   (d) the sweep's two failures at the transition are gone, and no new
 *       failure appears in the crater, the rim or the ejecta.
 *
 * RULE 652. I1. A named departure on the crater clause, inside the gap only,
 * carried in I1's evidence.
 *
 * RULE 653. ONE RUN, the sweep before and after on one commit; no
 * re-tuning of the join.
 */

/** Rule 648: the transient-crater range (m) on Earth where the join holds. */
export const CRATER_JOIN_RANGE_EARTH_M = [2_560, 2_784.9] as const;

export const CRATER_JOIN_RULES = 'rules 647 to 653, fixed 21 September 2026';
