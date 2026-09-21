/**
 * Rules 748 to 755 — an impact that reaches the ground bursts at the ground.
 * For impacts, 21 September 2026, IMP-8 of ROADMAP.md M11 (G6), by Andrea's
 * order of that evening to close G6; written and pushed with the option
 * plumbed and not the default, before the default moves or any sweep is run.
 *
 * RULE 748. WHAT THIS ROUND IS. `DEFAULT_GROUND_BLAST` goes from `programHeld`
 * to `surface`. The air blast of a body or swarm that reaches the ground is
 * the program's own law on the program's own energy, W = E₀ · max(f, 1 − f),
 * read at the ground, z₁ = 0, where the program reads it at Eq. 18's altitude
 * below the ground: the Mach relation with r_x = 290 scaled metres. Nothing
 * else moves: not an airburst's blast, not the crater, the entry, the flash,
 * the magnitude or the waves.
 *
 * RULE 749. WHY: THE GAP. The report declares it (IMP-0 classified it work of
 * its own, not a ceiling): the program reads an impact's blast from under the
 * ground, and no paper derives a burst below the surface. The deeper Eq. 18
 * puts that altitude, the shorter the crossover and the weaker the blast, so
 * a steeper or a larger body blasts less: on the own seed the blast rings of
 * 77 bodies that reach the ground fall as the body grows by 1 %, which rules
 * 683 to 690 explained by that altitude and did not make physical. A body
 * that reaches the ground releases its energy there.
 *
 * RULE 750. THE SOURCE. Collins, Melosh & Marcus (2005), Eq. 54: the program's
 * relation for a burst on the surface, 75 kPa at 290 m for a kiloton, scaled
 * by the cube root of the energy — what the Earth Impact Effects Program drew
 * for an impact on the ground before Collins et al. (2017) read their airburst
 * law at Eq. 18's altitude below it. It is the airburst law of
 * `effects/airburstBlast.ts` at z₁ = 0, so a complete airburst whose burst
 * altitude falls to zero meets it. Kring (1997, MAPS 32) scaled Meteor
 * Crater's air blast from nuclear surface bursts in the same way, and put the
 * flattened trees within 14 to 19 km.
 *
 * RULE 751. WHAT WAS LOOKED AT BEFORE THESE RULES, on one commit, by a script
 * outside the product. The presets: Chicxulub's rings grow by 3 % (5 psi 2 678
 * to 2 759 km), Popigai's by 5 %, Boltysh's by 20 %, and Meteor Crater's by 4.4
 * in range (5 psi 1.94 to 8.45 km, 1 psi 5.21 to 22.74 km, 0.5 psi 8.75 to
 * 38.18 km); the three airbursts not at all. The own seed: of 3 903 bodies
 * that reach the ground, the blast rings of 77 fall as the body grows under
 * the held law and of none at the surface; no ring jumps at a regime switch;
 * the 1 psi ring moves by ×1.000 in the median, ×1.65 at the 95th percentile
 * and ×5.47 at most.
 *
 * RULE 752. WHAT IT COSTS, DECLARED. I1's clause for the air blast of ground
 * impacts departs from the program, named, with rule 749 as its reason (G1
 * allows it); the program's held law stays as `groundBlast: 'programHeld'`
 * and keeps its 69 checked points. The rings of crater-forming impacts grow,
 * and the toll inside them with them, which no record can judge (an impact's
 * toll is a ceiling). And a burst on the surface couples its energy to the air
 * as a nuclear surface burst does, which is Collins et al.'s assumption and
 * Kring's; no impact on the ground has been measured.
 *
 * RULE 753. WHAT IS EXPECTED, written before the runs:
 *
 *   (a) on one commit, on the I1 grid, the presets and 5 000 impacts of the
 *       own seed and of `SURFACE_BLAST_HELD_OUT_SEED`, which no run has used:
 *       no ring or overpressure sample of a complete airburst moves, and every
 *       blast ring of a body that reaches the ground is the law at z₁ = 0 on
 *       W — a test in CI;
 *   (b) G5 on both seeds: no key G5 reads appears under the surface law that
 *       the held law's run on the same seed does not print; the scenarios
 *       whose failures differ are listed;
 *   (c) `impactField.test.ts` passes: at each blast ring the field is the
 *       ring's threshold;
 *   (d) the presets move as rule 751 lists them, and no other;
 *   (e) the report regenerated on the new default keeps the release gate at
 *       PASS.
 *
 * RULE 754. WHAT DECIDES. Adopted when (a) to (e) hold. Otherwise refused, the
 * default stays `programHeld`, and the failing items are printed.
 *
 * RULE 755. WHAT IT DOES NOT CLAIM. That an impact's air blast is right: the
 * energy it couples to the air has not been measured for any impact on the
 * ground. Only that a body that reaches the ground bursts at the ground, by
 * the relation the field wrote for it, and that its blast then grows with it.
 */

/*
 * ===========================================================================
 * The outcome, written after the runs of 21 September 2026: ADOPTED
 * ===========================================================================
 *
 * The rules were pushed in `3bd4650` and the four sweeps made on that commit
 * (`benchmark/results/invariants-2026-09-21-36.json` and `-37` on the own
 * seed, the held law and the surface; `-38` and `-39` on
 * `benchmark-2026-09-21-heldout-surface`). Then the default moved.
 *
 * (a) HOLDS. `surfaceBlastRules.test.ts`: no ring or overpressure sample of a
 *     complete airburst moves, and every blast ring of a body that reaches the
 *     ground is the law at z₁ = 0 on W, to the bit.
 * (b) HOLDS. G5 reads 0 on the own seed under both laws, and 8 on the unseen
 *     seed under both, the same keys and the same scenarios: two slow irons
 *     near I_f = 1 whose magnitude and burns fall as the breakup rises with
 *     their size (B-091's neighbourhood), and a 19.8 m iron whose crater
 *     vanishes at the strewn field's cut (B-098). The blast rings the harness
 *     explains by their source's altitude fall from 142, 118 and 132 to 65,
 *     41 and 55 on the own seed, and from 124, 97 and 114 to 66, 39 and 56 on
 *     the unseen one: what is left is airbursts, whose source is in the air.
 * (c) HOLDS. `impactField.test.ts` passes on the new default.
 * (d) HOLDS. The presets move as rule 751 lists them, and no other.
 * (e) HOLDS. The report regenerated on the new default: release gate PASS.
 *
 * Three tests of the rounds that read the program's held law now ask for it
 * (`groundBlast: 'programHeld'`): B-089's halving rings in
 * `blastShrinkRules.test.ts`, its field jump in `fieldJumpRules.test.ts`, and
 * the default named in `airburstBlast.test.ts`. So `DEFAULT_GROUND_BLAST` is
 * `surface`, and the gap of an impact's blast read from under the ground is
 * closed.
 */

/** Rule 753 (a): the seed of the run on scenarios nobody has seen. */
export const SURFACE_BLAST_HELD_OUT_SEED = 'benchmark-2026-09-21-heldout-surface';

export const SURFACE_BLAST_RULES = 'rules 748 to 755, fixed 21 September 2026';
