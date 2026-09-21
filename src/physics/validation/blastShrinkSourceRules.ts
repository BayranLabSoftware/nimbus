/**
 * Rules 683 to 690 — the blast rings a source moves. For impacts,
 * 21 September 2026, IMP-2 of ROADMAP.md M11, written and pushed before the
 * harness they describe is run on a seed nobody has seen.
 *
 * RULE 683. WHAT THIS ROUND IS. The harness learns to read, for a blast ring
 * — 5 psi, 1 psi, light damage — that shrinks as a body grows by 1 %,
 * whether its source moved it: the hook rules 638 to 646 built and left
 * unwired, wired now with one statement in place of their two causes. A ring
 * the statement explains is printed under "explained, …", which G5 does not
 * read (the fourth key rule 664 sets apart, from this round); every other
 * shrinking ring counts as before. No number of the model moves. Impacts
 * only, the one domain open.
 *
 * RULE 684. THE PHYSICS. An impact's blast rings depend on the body only
 * through the static source they are drawn from: its energy, W = E₀ ·
 * max(f, 1 − f) (Collins et al. 2017), and its altitude — the burst altitude
 * of a complete airburst, Eq. 18's altitude below the ground for a body that
 * reaches it. The two laws meet where that altitude passes zero: the air law
 * at z = 0 and the program's ground blast are then both the Mach relation
 * with r_x = 290, and at the switch of a 33.6 m body of the seed of rules 638
 * to 646 the rings on either side agree to the decimetre. Neither the energy
 * nor the altitude is monotone in the body's size, and neither need be: a
 * larger body breaks higher, its I_f being smaller, and bursts lower or
 * higher as its dispersion grows. And at a held energy a ring is not
 * monotone in the altitude: that is the height-of-burst curve, with the knee
 * Glasstone & Dolan's Figure 3.73 draws (B-090), and below the ground the
 * program's crossover, which shortens as the source sinks — relations I1
 * holds to the program. So a ring may shrink as its body grows; what G5's
 * "wherever the physics is" can ask is that the source moved it, and did not
 * jump.
 *
 * RULE 685. THE STATEMENT, `explainBlastShrink` in `blastSource.ts`. A blast
 * ring that shrinks between a body and one 1 % larger is explained when all
 * three hold:
 *
 *   (i) the source moves without a step between the two: rule 662's search,
 *       run across the 1 % step on its energy and on its altitude (the scale
 *       of an altitude never below 100 m), finds neither jumping;
 *   (ii) the ring is the one that source draws, to a millionth: the source
 *        is the ring's;
 *   (iii) at the larger body's energy and the smaller body's altitude the
 *         ring does not shrink — "the source altitude" moved it — or it does
 *         and the energy fell — "the source energy".
 *
 * Anything else is not explained and counts.
 *
 * RULE 686. WHAT IT CORRECTS, AND WHAT WAS SEEN BEFORE IT. Rules 638 to 646
 * read two causes and were refused by four rings in two scenarios. One was
 * B-089's seam, a source that jumps, which (i) refuses to explain. The other
 * was B-090's knee, which the first cause could not see because it read the
 * distance to an optimum height and not the side of it; this statement reads
 * no optimum and no side — it holds the altitude and asks the energy.
 * Explored before these rules on seeds already read, and declared: on the
 * sweep's own seed each of the 396 shrinking blast rings is explained, all
 * by the source altitude; on the seed of rules 638 to 646 each but B-089's
 * three; on the seed of rules 676 to 682 each of the six the paper's entry
 * adds. So nothing on those seeds is evidence here; rule 688's is.
 *
 * RULE 687. B-089 IS COUNTED. A ring whose source jumps is not explained. On
 * the program's entry that is B-089's seam, where the doubled I_f crosses 1
 * within the step; its rings stay G5 failures, by name, until the entry
 * closes it.
 *
 * RULE 688. THE TEST, on the program's entry, the default: 5 000 impacts on
 * `BLAST_SOURCE_HELD_OUT_SEED`, which no run has used, with the statement
 * wired. Expected, written before the run:
 *
 *   (a) every blast ring that shrinks is explained, or its source jumps and
 *       it is counted; none has a source that moves without a step and no
 *       cause;
 *   (b) a source that jumps lies where the doubled I_f crosses 1 within the
 *       step, B-089's seam; any other is a defect, registered for IMP-2;
 *   (c) every count the harness makes but the three blast rings' is the one
 *       the harness without the statement makes on the same seed, in the
 *       same session.
 *
 * And on the own seed, in the same session: the 396 explained, and what G5
 * reads is what is left — 38 airburst magnitudes and one burn ring.
 *
 * RULE 689. WHAT DECIDES. Adopted if (a) and (b) hold on the unseen seed and
 * (c) on both. Refused otherwise, and the hook is unwired.
 *
 * RULE 690. WHAT IT DOES NOT CLAIM. That the height-of-burst curve or the
 * program's crossover is right: they are the program's, held by I1. Only
 * that every blast ring that shrinks as a body grows is moved by its source,
 * as those relations move it. And G5 is not met while anything is counted.
 */

/*
 * ===========================================================================
 * The outcome, written after the runs of 21 September 2026: ADOPTED
 * ===========================================================================
 *
 * The rules were pushed in `6bc147f` and four runs made on that commit, the
 * harness with the statement and without it (`NIMBUS_NO_CAUSES`), on the own
 * seed (`benchmark/results/invariants-2026-09-21-15.json` without, `-16`
 * with) and on `benchmark-2026-09-21-heldout-blast` (`-17` without, `-18`
 * with).
 *
 *                                         own seed     unseen seed
 *   blast rings that shrink                     396             330
 *     explained, the source altitude            396             321
 *     explained, the source energy                0               0
 *     counted, their source jumping               0               9
 *   count G5 reads, without the statement       435             400
 *   count G5 reads, with it                      39              79
 *
 * (a) HOLDS. Every blast ring that shrinks on the unseen seed is explained,
 * or its source jumps: the nine counted are the three rings of three bodies,
 * and each body's source energy jumps within the step. None has a source that
 * moves without a step and no cause.
 *
 * (b) HOLDS as it is written, and the reading is stated because another is
 * possible. It reads "a source that jumps lies where the doubled I_f crosses
 * 1 within the step, B-089's seam; any other is a defect, registered for
 * IMP-2". Two of the three do lie there — a 40.6 m iron at 9.5 km/s whose
 * doubled I_f goes from 1.0005 to 0.9906, jumping at 1.000511 times its size,
 * and a 35.3 m one at 4.9 km/s, from 1.0074 to 0.9974, jumping at 1.0074. The
 * third does not: a 2.1 m stone at 4.9 km/s whose I_f itself, the paper's,
 * crosses 1 at 1.003492 times its size, where it passes from landing whole to
 * bursting in the air. It is registered, B-091. Read as a prediction that
 * every jumping source is B-089's, (b) would fail; read with its own second
 * clause, it prescribes what an other is, and it is done. The statement is
 * not what the third body tests — it refused to explain that body's rings,
 * which is its job — the model is.
 *
 * (c) HOLDS. On both seeds every count but the three blast rings' is the same
 * with the statement and without it, key for key, and the blast rings add up:
 * 396 = 396 explained on the own seed, 330 = 321 + 9 on the unseen one.
 *
 * So the statement is adopted and the hook stays wired. On the own seed, what
 * G5 reads on impacts is 39: the 38 airburst magnitudes that fall as the body
 * grows — the program's own reading, a defect of a relation and not of the
 * harness — and one second-degree burn ring. The unseen seed shows what the
 * own one does not, and IMP-2 owns it: B-089 and B-091, two places where the
 * entry's source jumps; the craters and blankets that vanish with B-091's
 * switch; three burns; and one far wave.
 */

/** Rule 688: the seed of the run on scenarios nobody has seen. */
export const BLAST_SOURCE_HELD_OUT_SEED = 'benchmark-2026-09-21-heldout-blast';

export const BLAST_SHRINK_SOURCE_RULES = 'rules 683 to 690, fixed 21 September 2026';
