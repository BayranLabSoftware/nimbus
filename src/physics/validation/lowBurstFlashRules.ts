/**
 * Rules 714 to 721 — a low airburst's flash, where its fireball meets the
 * ground. For impacts, 21 September 2026, IMP-2 of ROADMAP.md M11, written and
 * pushed before the default moves or the sweeps are run. B-093.
 *
 * RULE 714. WHAT THIS ROUND IS. `DEFAULT_LOW_BURST_FLASH` goes from `air` to
 * `fireball`. A complete airburst whose burst altitude z is below the fireball
 * radius R of the energy it keeps at its burst — R = 0.002 E^(1/3), Collins et
 * al. 2005 Eq. 32*, the fireball the model's horizon cut uses and the globe
 * draws — radiates a share 1 − z/R of that kept energy as the program's
 * fireball on the ground (Eq. 35 into the half-space, dimmed by Eq. 36*'s
 * horizon), and the rest of its energy as the flash at its burst altitude;
 * its burn and fire rings are read on that sum. Nothing else moves: not a
 * burst at or above R, not a partial airburst or an impact on the ground, not
 * the luminous efficiency, the exposures or the horizon's cut. At z = 0 the
 * sum is, term by term, the partial airburst's the body becomes: its flash in
 * the air at the ground, and the energy it keeps on the ground.
 *
 * RULE 715. WHY: THE STEP (B-093). At the switch from a complete airburst to a
 * partial one the kept energy passes from one law to the other at once. B-093's
 * body, 115.5 m of iron at 71.6 km/s and 16.4 degrees, becomes a partial
 * airburst at 1.0020368 times its size: its second-degree ring falls from
 * 138 441 m to 135 357 m, its third-degree ring rises from 109 349 m to
 * 109 798 m, and its thermal field jumps at 10, 50 and 100 km (rule 662's
 * search). It is the one burn ring G5 reads on the own seed. The unseen seed of
 * rules 698 to 705 (`benchmark-2026-09-21-heldout-flash`) prints the same step
 * for a 130.3 m iron at 59.5 km/s and 16.0 degrees, at 1.0024134 times its
 * size: 128 481 m to 126 333 m.
 *
 * RULE 716. THE SOURCE. The field draws the passage where a fireball meets the
 * ground, not where a burst altitude reaches zero. Glasstone & Dolan (1977)
 * §2.18 call a burst a surface burst when its fireball, growing, touches the
 * surface; §7.42 has bursts lower than 180 W^0.4 ft, "essentially surface
 * bursts" (§2.128), computed by the surface-burst procedures of §7.101 et
 * seq. Their procedure switches at that height, and a switch anywhere is a
 * step; the form between is this project's, and declared as such. The share
 * of a sphere's surface below a plane that cuts it at a depth z under its
 * centre is (R − z)/2R — Archimedes: a zone of a sphere has the area of the
 * band of its circumscribed cylinder, 2πR times its height, so the share is
 * linear in z — a half at contact, the hemisphere of a burst on the ground,
 * and none once the sphere clears it; 1 − z/R is that share over contact's.
 * The radius is the model's own fireball, not Glasstone's 180 W^0.4 ft — a
 * nuclear fireball near its second maximum, 2.7 times larger at 1 Mt — because
 * the model draws one fireball, and its horizon cut already uses this one.
 *
 * RULE 717. WHAT WAS LOOKED AT BEFORE THESE RULES, on one commit, the option
 * against the default. Both bodies of rule 715 keep their rings across their
 * switch (109 798 and 135 357 m; 102 077 and 126 333 m) and their thermal
 * field is steep, not a jump, at 10, 50 and 100 km. No preset moves; no row of
 * the I1 grid (0 of 81). On the own seed the rings of 20 bodies move, every
 * one a complete airburst bursting below its fireball: from −4.8 % (a 200.8 m
 * iron at 69.7 km/s bursting at 1 546 m, second-degree burns 304.05 to
 * 289.54 km) to +3.8 % (a 42.9 m body bursting at 67 m, third-degree burns
 * 12.83 to 13.32 km). The far rings fall, where the horizon dims a fireball on
 * the ground; the near ones rise, where the half-space doubles it.
 *
 * RULE 718. WHAT IT COSTS, DECLARED. The two laws meet; their normalisations
 * stay what they were. At the same energy and range the fireball on the ground
 * puts up to twice the exposure of the flash in the air (the program's
 * half-space, 2π, against the project's sphere, 4π), where Glasstone & Dolan
 * §7.20 have a surface burst deliver half to three-fourths of an air burst's
 * at a given distance. The taper joins the model's two laws; it does not
 * reconcile them with the field's, and the flash in the air stays B-095's.
 *
 * RULE 719. WHAT IS EXPECTED, written before the runs:
 *
 *   (a) on one commit, on the I1 grid, the presets and 5 000 impacts of the
 *       own seed and of `LOW_BURST_HELD_OUT_SEED`, which no run has used: no
 *       burn ring, fire ring or thermal field sample moves of a body that is
 *       not a complete airburst bursting below its fireball radius;
 *   (b) the law is continuous where it switches: across the switch of both
 *       bodies of rule 715 their burn and fire rings agree to 1e-6 and their
 *       thermal field is steep at 10, 50 and 100 km; a burst at or above its
 *       fireball radius keeps the flash in the air to the bit; a test in CI;
 *   (c) `impactField.test.ts` passes on the new default;
 *   (d) G5, on both seeds: B-093's burn ring is not printed under the taper on
 *       the own seed; no key G5 reads appears under the taper that the
 *       default's run on the same seed does not print; the scenarios whose
 *       failures differ are listed;
 *   (e) the report regenerated on the new default keeps the release gate at
 *       PASS;
 *   (f) no preset moves.
 *
 * RULE 720. WHAT DECIDES. Adopted when (a) to (f) hold. Otherwise refused, the
 * default stays `air`, and the failing items are printed.
 *
 * RULE 721. WHAT IT DOES NOT CLAIM. That the taper is how a low burst
 * radiates: the field has no published form between its two procedures. Only
 * that the model's two laws meet where the model's fireball meets the ground,
 * so that a body a hair larger no longer burns less far for the switch alone.
 * It does not close B-095.
 */

/** Rule 719: the seed of the run on scenarios nobody has seen. */
export const LOW_BURST_HELD_OUT_SEED = 'benchmark-2026-09-21-heldout-lowburst';

export const LOW_BURST_FLASH_RULES = 'rules 714 to 721, fixed 21 September 2026';
