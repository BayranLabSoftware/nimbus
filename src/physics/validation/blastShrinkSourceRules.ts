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

/** Rule 688: the seed of the run on scenarios nobody has seen. */
export const BLAST_SOURCE_HELD_OUT_SEED = 'benchmark-2026-09-21-heldout-blast';

export const BLAST_SHRINK_SOURCE_RULES = 'rules 683 to 690, fixed 21 September 2026';
