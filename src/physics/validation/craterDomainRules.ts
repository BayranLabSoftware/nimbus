/**
 * Rules 945 to 952 — the crater below the hypervelocity domain (B-124).
 * Written on 23 September 2026, evening, on Andrea's word («Sì, procedi»),
 * after the third set was frozen (a92f2ac) and in the order the reviewer set:
 * this defect alone, before the round on fragmentation, so that it is known
 * which change mends which error. Written before any line of the change.
 *
 * RULE 945. THE DEFECT. The model evaluates Collins, Melosh & Marcus (2005)'s
 * Eq. 21 — a law built on hypervelocity experiments and explosions — at
 * whatever speed its body reaches the ground, down to its terminal velocity.
 * Level B's second round found it (91e4eb5): 2022 WJ1, kept whole, reaches
 * the ground at about 0.1 km/s and is given a crater of 2.3 to 3.4 m. It is
 * a fault of the crater's domain, not of the law of fragmentation, and it is
 * mended first and apart (the reviewer). Registered as B-124.
 *
 * RULE 946. THE DOMAIN, from the sources, fixed before any code and chosen on
 * no event. French (1998), Traces of Catastrophe (LPI Contribution 954):
 * a hypervelocity impact crater forms where the projectile strikes at
 * velocities "much greater than the speed of sound in the target rocks", its
 * crater dug by shock waves (§3.1, p. 17); smaller projectiles strike "at
 * speeds of no more than a few hundred meters per second", penetrate, and
 * excavate "a pit that is slightly larger than the projectile itself" —
 * "strictly a mechanical" process, with no shock waves — pits "typically less
 * than a few tens of meters in diameter" (p. 17); the speed of sound in the
 * target rocks is "typically 5–8 km/s" (p. 18). Brown et al. (2008, §1) call
 * such craters strength-dominated; Collins et al. (2005, p. 820) write that
 * their program "should not be used" for small objects that "drop small
 * meteorites to the surface at terminal velocity". So Eq. 21 is inside its
 * domain where the speed it is evaluated at is at least 5 km/s — the lowest
 * speed of sound French gives for target rocks — and outside it below.
 *
 * RULE 947. THE THREE STATES — and the only thing that changes. A new field,
 * `crater.state`:
 *   `computed`     Eq. 21 inside its domain, and every law built on it — the
 *                  final crater, the depth, the morphology, the ejecta — as
 *                  today, to the bit;
 *   `none`         nothing reaches the ground to dig (`crater.origin` `none`),
 *                  as today;
 *   `outOfDomain`  a body, a swarm or a share of it reaches the ground, but
 *                  Eq. 21 would be evaluated below 5 km/s for a term that
 *                  weighs in the crater: no transient or final diameter, no
 *                  depth and no ejecta blanket are given — they are not
 *                  numbers — and the crater is "not resolved: a local
 *                  penetration pit is possible".
 * The iron's strewn field keeps its own law, its largest crater calibrated on
 * Sikhote-Alin at the speed of entry (rules 764 to 771): where it alone
 * digs, the state is `computed`, as today. The third state is never read as
 * "no crater" and never as a crater: it is neither a success nor a failure
 * (the reviewer).
 *
 * RULE 948. WHAT DOES NOT CHANGE: every output of the entry — altitudes,
 * speeds, masses, the energy that reaches the ground; every effect read from
 * that energy — the fireball at the ground, the blast, the flash, the seismic
 * magnitude; level A, its harness and every check against the program, which
 * run with the legacy crater (`craterDomain: 'legacy'`) because the program
 * evaluates Eq. 21 at any speed; and every crater computed at 5 km/s or more,
 * to the bit.
 *
 * RULE 949. WHAT THE PRODUCT SAYS in the third state: the panel, the report
 * and the globe say the crater is not resolved and a local penetration pit is
 * possible, and draw no crater or ejecta ring; the Monte Carlo counts the
 * draws out of the domain apart — its crater and ejecta rows read over the
 * resolved draws, with the share out of the domain beside them, never merged
 * with the draws that dig nothing; the evidence card of the crater says where
 * its law holds.
 *
 * RULE 950. WHAT VERIFIES IT, on development and seen cases only, as a
 * diagnostic (the reviewer) — none of the third set is run: 2022 WJ1 on the
 * frozen draws of the second round (whole at about 0.1 km/s: out of the
 * domain, never "none"); Sterlitamak's draws (an iron at about 0.9 km/s: out
 * of the domain, where a penetration crater of about 10 m was observed);
 * Carancas (the model bursts it: unchanged); Ådalen (a row of I2's CNEOS set,
 * diagnostic: reported, its CNEOS altitude not counted); Meteor Crater,
 * Chicxulub and every preset whose crater is computed at 5 km/s or more
 * (unchanged to the bit); the Sikhote-Alin preset (its strewn field
 * unchanged). No threshold is chosen on any of them: it is rule 946's.
 *
 * RULE 951. WHAT DECIDES, and what an adoption may update.
 *   (a) every crater computed at 5 km/s or more is identical to the bit: the
 *       seal moves only in scenarios whose crater falls out of the domain,
 *       each listed;
 *   (b) no output of the entry moves, and level A does not move;
 *   (c) G5 reads nothing new;
 *   (d) 2022 WJ1's draws that reach the ground read `outOfDomain`, none reads
 *       `none` because of the change (rule 940); B-124's regression test
 *       passes;
 *   (e) typecheck, lint, format, the whole suite, the strict gate, and
 *       Chromium's end-to-end suite.
 * An adoption may update, each for its reason written in the outcome: a check
 * against the program, pinned to the legacy crater; a record or test that
 * asserts a crater number for a body reaching the ground below 5 km/s,
 * rewritten to the three states; the seal, re-taken. Any other test that
 * fails refuses the change.
 *
 * RULE 952. WHAT MAY NOT HAPPEN. The 5 km/s is French's and stays. One run of
 * rule 951. No event of the third set is read. The round on fragmentation
 * does not start until this one's outcome is written.
 */

/** Rule 946: the lowest speed at which Eq. 21 is inside its domain (m/s). */
export const CRATER_DOMAIN_MIN_SPEED_MS = 5_000;

/** Rule 948: the legacy crater (Eq. 21 at any speed) or the domain of 946. */
export type CraterDomain = 'legacy' | 'hypervelocity';

/** Rule 947: the crater's three states. */
export type CraterState = 'computed' | 'none' | 'outOfDomain';

/** The outcome, written after the one run of rule 951. */
export const CRATER_DOMAIN_OUTCOME: string | null = null;
