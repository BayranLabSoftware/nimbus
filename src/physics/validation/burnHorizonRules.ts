/**
 * Rules 579 to 585 — B-086, the ceiling the explosion never got,
 * 21 September 2026, written and pushed before the candidate ran.
 *
 * WHAT IS BROKEN. An explosion's burn and fire rings reach past the range at
 * which its own fireball sets below the horizon. The flash travels in
 * straight lines; nothing burns where the fireball cannot be seen. Of the
 * 5 000 explosions the invariant sweep draws, 156 rings are outside it, and
 * the worst is 2.32× — a 9 537 Mt surface burst whose first-degree ring is
 * 1 606 km where its fireball sets at 694.
 *
 * WHY THE REPAIR IS NOT A DESIGN. It already exists, in the module next
 * door. `src/physics/simulate.ts` cuts an impact's fire and burn radii at
 *
 *     min( thermalHorizonRadius(impactFireballRadius(ke)), π R_earth )
 *
 * and says why in its own comment: it was B-028 and B-038, closed on
 * 15 September 2026, when Chicxulub's fire reached 24 579 km and Boltysh's
 * third-degree burns 936 km where its fireball sets at 523.
 * `events/explosion/simulate.ts` does not mention the horizon at all. This
 * round applies the sibling's expression, unchanged, to the sibling's
 * problem.
 *
 * RULE 579. WHAT THE CEILING IS, and it is not chosen here.
 * `thermalHorizonRadius`, already in `casualties.ts`, already used by the
 * impact path, already justified. It takes the height of the emitting
 * surface and returns the great-circle range at which that surface sets:
 *
 *     R_earth · arccos(1 − h / R_earth)
 *
 * RULE 580. WHAT HEIGHT IT IS GIVEN. The top of the fireball: the fireball's
 * own radius plus the burst altitude. A surface burst's fireball still has a
 * top, and the first version of the measurement that found this defect got
 * that wrong — it used the burst altitude alone, which is zero at the
 * surface, and flagged every surface burst including the ones the impact
 * path already handles correctly. It nearly registered a defect that had
 * been fixed six days earlier. The rule says the right height in advance so
 * the candidate cannot repeat it.
 *
 * RULE 581. WHICH RINGS. The same ones the impact path cuts, and no others:
 * the three burn radii and the two firestorm radii. Not the blast, which is
 * a pressure wave and bends round the curve; not the radiation, which is a
 * different question this round does not open.
 *
 * RULE 582. WHAT MOVES, predicted before the run so the prediction can be
 * wrong.
 *
 *   (a) Nothing below about 1 000 Mt at a surface burst. The crossing is
 *       between 1 000 and 2 000 Mt, so every real weapon and every
 *       accidental explosion this project holds is untouched — Hiroshima,
 *       Beirut, Tsar Bomba at 50 Mt, all far below.
 *   (b) No recorded event, no preset, no row of the calibration net, no
 *       figure of the validation report.
 *   (c) No impact, no earthquake, no volcano, no landslide, to the bit.
 *   (d) The 156 rings of the sweep become none.
 *
 * If (a), (b) or (c) is wrong the round is refused until it is known why; if
 * (d) is wrong the ceiling is not being applied where it was measured.
 *
 * RULE 583. THE CEILING MAY NOT INVENT A RING. It only ever shortens. A
 * scenario whose ring was already inside the horizon comes out unchanged, to
 * the bit, and no ring that was zero becomes positive.
 *
 * RULE 584. WHAT REFUSES IT.
 *   (a) Anything of rule 582 moving that was predicted not to.
 *   (b) A ring growing anywhere (rule 583).
 *   (c) Any bar green today going red.
 *   (d) A ring still outside the horizon after the change.
 *
 * RULE 585. ONE RUN, NO RE-TUNING. The expression is the sibling's,
 * unchanged; if it is refused, B-086 stays open with the refusal published,
 * and nothing is adjusted to make it pass.
 */

/** Rule 582(a): where the first-degree ring crosses its own horizon at a
 *  surface burst, measured before the round. */
export const CROSSES_BETWEEN_MT = [1_000, 2_000] as const;

/** Rule 582(d): what the sweep reads today, and must read after. */
export const SWEEP_RINGS_OUTSIDE = { before: 156, after: 0 } as const;

/** The breakdown of those 156, by ring. */
export const SWEEP_BY_RING = {
  firstDegreeBurnRadius: 103,
  secondDegreeBurnRadius: 41,
  thirdDegreeBurnRadius: 12,
} as const;

/** Rule 581: the rings this round cuts, and no others. */
export const RINGS_CUT = [
  'thermal.firstDegreeBurnRadius',
  'thermal.secondDegreeBurnRadius',
  'thermal.thirdDegreeBurnRadius',
  'firestorm.ignitionRadius',
  'firestorm.sustainRadius',
] as const;

export const BURN_HORIZON_RULES = 'rules 579 to 585, fixed 21 September 2026';
