/**
 * Rules 638 to 646 — why an impact's blast ring may shrink as the body
 * grows, and a test on scenarios nobody has looked at. 21 September 2026,
 * IMP-2b of ROADMAP.md M11, written and pushed before the run.
 *
 * RULE 638. WHAT IS OPEN. Under the ground blast held by rules 630 to 637,
 * G5's harness counts 396 blast rings of the impact sweep that shrink when
 * the body grows by 1 %. G5 asks for monotonicity "wherever the physics is",
 * so a shrinking ring is a failure only where the physics is monotone.
 * Rules 555 to 562 said these were physics — a bigger body bursts lower,
 * below the optimum height — and were refused by one case in 408, a body
 * that bursts HIGHER.
 *
 * RULE 639. THE TWO CAUSES, each a statement about the world and not about
 * this model.
 *
 *   (i) THE HEIGHT OF BURST. For a given overpressure a burst has an optimum
 *       height at which that ring is widest (Glasstone & Dolan 1977, §3.73 and
 *       the height-of-burst curves of Chapter III). Moving the burst AWAY from
 *       it — lower when it is below, higher when it is above — shrinks the
 *       ring, and a body 1 % larger gains 3 % in energy, which the height can
 *       outweigh. The case that refused rules 555 to 562 is this cause on the
 *       other side of the optimum: it bursts higher, and it was already above.
 *  (ii) FROM THE AIR TO THE GROUND. A body that sends a larger share of its
 *       energy to the ground puts it where far less of it becomes blast: an
 *       airburst couples its energy into the air, and an impact on the ground
 *       into a crater. Tunguska's ten to fifteen megatonnes in the air felled
 *       some 2 000 km² of forest; the same energy on the ground digs a crater
 *       and blasts far less. Across that passage the physics is not
 *       monotone in size.
 *
 * RULE 640. HOW THE HARNESS READS THEM. A blast ring — 5 psi, 1 psi, light
 * damage — that shrinks under the monotone step counts as a G5 failure only
 * if neither cause holds in that scenario, and each cause is read from the
 * model's own laws, which I1 and I2 hold to the field's tool:
 *
 *   (i) both runs are airbursts, and the grown body's burst altitude is
 *       farther from that ring's optimum height — the altitude at which the
 *       model's own airburst law, at the grown body's yield, reaches that
 *       threshold farthest — than the base body's was;
 *  (ii) the grown body's share of its energy reaching the ground, the entry's
 *       own f, is larger than the base body's.
 *
 * A ring explained is printed under its cause and is not counted, so a
 * reader sees every one of them.
 *
 * RULE 641. WHAT WAS SEEN BEFORE THESE RULES. The statement was found by
 * reading the sweep's own seed: of its 396 shrinking blast rings, 159 are
 * cause (i), 237 cause (ii), none both and none neither. A statement found on
 * a set cannot be tested on it. So it is tested where nobody has looked.
 *
 * RULE 642. THE TEST. Five thousand impact scenarios drawn exactly as the
 * sweep draws them, on a seed no run has used —
 * `benchmark-2026-09-21-heldout-impact` — under the law in place. The
 * statement is REFUSED if a single blast ring shrinks there with neither
 * cause. It is kept if every one has one, however many there are.
 *
 * RULE 643. WHAT IT DOES NOT TOUCH. Every other monotonicity reading stays
 * as it is: the 38 airburst magnitudes, the two wave amplitudes, the burn
 * ring, the crater rim and the final crater are IMP-2's other rounds.
 *
 * RULE 644. WHAT IT DOES NOT CLAIM. It checks that each shrinkage has a
 * cause under which the physics is not monotone. It does not check that the
 * amount is right: no measurement exists of an air blast across a body's
 * passage from the air to the ground, and the amount is the program's (I1).
 *
 * RULE 645. ONE RUN, on the fresh seed, published whatever it gives, and
 * then the sweep's own seed read the same way for the scorecard.
 *
 * RULE 646. NO RE-TUNING. The two causes and their reading are fixed above.
 * A ring the fresh seed shows without either refuses them, and they are not
 * rewritten to take it in.
 */

/** Rule 642: the seed of the scenarios nobody has looked at. */
export const HELD_OUT_SWEEP_SEED = 'benchmark-2026-09-21-heldout-impact';

/** Rule 640: the rings the two causes are read for. */
export const BLAST_RINGS = [
  'damage.overpressure5psi',
  'damage.overpressure1psi',
  'damage.lightDamage',
] as const;

export const BLAST_SHRINK_RULES = 'rules 638 to 646, fixed 21 September 2026';
