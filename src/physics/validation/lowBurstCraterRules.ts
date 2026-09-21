/**
 * Rules 756 to 763 — a low airburst digs where its kept energy strikes the
 * ground. For impacts, 21 September 2026, IMP-2 of ROADMAP.md M11, B-097, by
 * Andrea's order of that evening; written and pushed with the option plumbed
 * and not the default, before the default moves or any sweep is run.
 *
 * RULE 756. WHAT THIS ROUND IS. `DEFAULT_LOW_BURST_CRATER` goes from `none` to
 * `share`. A complete airburst whose burst altitude z is below the fireball
 * radius R of the energy it keeps at its burst (Collins et al. 2005 Eq. 32*)
 * digs the crater of the share 1 − z/R of the body's mass at its burst speed —
 * the program's π-group crater (Eqs. 21 to 27) on that mass, with the water's
 * share as a partial airburst's — where it dug none; above R it digs none, as
 * before. At a burst altitude of zero the share is one and the crater is the
 * partial airburst's the body becomes. An iron under 20 m keeps its strewn
 * field (B-098's). And the harness reads the final crater's BIRTH as rule 622
 * reads a contour's: on a step where a crater is born from nothing — none
 * under the smaller body, one under the larger — the final crater is read only
 * where the regime switches; on every other step it is read as the value it
 * was, and a move past rule 624's 5 % is searched by halving, as rule 735
 * searches a magnitude, a steep one printed apart under "steep, not a jump
 * (crater)", which G5 does not read.
 *
 * RULE 757. WHY: B-097. A burst above the ground digs nothing, however low,
 * and a swarm that reaches it digs the whole body's crater at its speed
 * there: a 28.3 m iron at 36.8 km/s and 47.1 degrees bursts 2.3 m above the
 * ground and leaves no crater, and 1.00023 times larger digs 1 183.5 m. The
 * swarm there is 198 m wide, a sixth of that crater, and it strikes with its
 * kept energy still moving at 12.7 km/s: it is the burst just above the
 * ground that is wrong.
 *
 * RULE 758. THE SOURCE, and whose each part is. A burst whose fireball touches
 * the ground is a surface burst (Glasstone & Dolan 1977, §2.18 and §7.42), and
 * a surface burst digs; the share of the kept energy that reaches the ground
 * is the one rules 714 to 721 read for the flash and rules 730 to 738 for the
 * magnitude, so the three effects of a low burst turn on together; the crater
 * is the program's own on that share of the mass. The share's form is this
 * project's, as it was for the flash. The birth read as a contour's: a crater
 * born from nothing grows as the power 0.26 of the share that digs it (Eq.
 * 21's L^0.78 on a diameter that grows as the share's cube root), with an
 * infinite slope at its birth; searched by halving, a step across B-097's own
 * birth still moves by more than 1 % at the 24th halving, past rule 662's
 * steep depth of 20, so neither a step nor the search can pass it, as
 * `events/impact/ringBirth.test.ts` proves of the rings. Only the birth: a
 * crater that dies, or that jumps between two sizes, is read everywhere as
 * before, so B-098's cut at 20 m stays in what G5 reads.
 *
 * RULE 759. WHAT WAS LOOKED AT BEFORE THESE RULES, on one commit, by a script
 * outside the product. B-097's body keeps its crater across its switch
 * (1 183.5 m either side) and grows it as its burst falls below its fireball
 * (1 094 m at 102 m up, none at 509 m): its crater is born at 0.9597 of its
 * size, 0.19 m wide, and a step of 0.1 % just past the birth, which moves it by
 * 37 %, is steep by the 6th halving. No preset moves. On the own seed the
 * craters of 18 bodies move, the largest to 3 200 m, none falls as its body
 * grows, and two move by more than 5 % on the step of continuity, both inside
 * the complete regime: a crater born from nothing (0 to 159 m) and one near
 * its birth (737 to 810 m). On the unseen seed of rules 714 to 721, 12 move,
 * and the two craters that fall are B-091's and B-098's, as under `none`.
 *
 * RULE 760. WHAT IT COSTS, DECLARED. Complete airbursts below their fireball
 * dig, and their ejecta fall: a crater where the model drew none. The wave of
 * such a burst over water is not changed here — the impact's wave is drawn for
 * a body that reaches the water, not for an airburst — and where it passes to
 * a partial airburst over water its wave still starts at the switch.
 *
 * RULE 761. WHAT IS EXPECTED, written before the runs:
 *
 *   (a) in CI: no crater moves of a body that is not a complete airburst below
 *       its fireball; B-097's body keeps its crater across its switch to 1e-6;
 *       a burst at or above its fireball digs nothing; and the harness, on one
 *       step each, reads B-097's birth under `share` only as it was and not as
 *       G5 reads, prints the step just past it as steep, counts B-097's switch
 *       under `none` as a jump at a regime switch, and counts B-098's cut at
 *       20 m as a jump under both laws;
 *   (b) on one commit, 5 000 impacts of the own seed and of
 *       `LOW_BURST_CRATER_HELD_OUT_SEED`, which no run has used, both laws
 *       read by the same harness: no key G5 reads appears under `share` that
 *       `none`'s run on the same seed does not print; the scenarios whose
 *       failures differ are listed; and `none`'s run on the own seed reads for
 *       G5 what the last run there read under the harness before this round
 *       (`benchmark/results/invariants-2026-09-21-37.json`: nothing), so the
 *       reading and the law are told apart;
 *   (c) no preset moves;
 *   (d) the report regenerated on the new default keeps the release gate at
 *       PASS.
 *
 * RULE 762. WHAT DECIDES. Adopted when (a) to (d) hold. Otherwise refused, the
 * default stays `none`, the harness reads the final crater as it did before
 * this round, B-097 stays open, and the failing items are printed.
 *
 * RULE 763. WHAT IT DOES NOT CLAIM. That a low airburst's crater is measured:
 * no crater of a swarm arriving just after its burst has been. Only that the
 * model digs where its own energy strikes the ground, by the share its flash
 * and its magnitude already use, and that a crater no longer opens at full
 * size at the switch.
 */

/*
 * ===========================================================================
 * The outcome, written after the runs of 21 September 2026: ADOPTED
 * ===========================================================================
 *
 * The rules were pushed in `45323b8` and the four sweeps made on that commit
 * (`benchmark/results/invariants-2026-09-21-40.json` and `-41` on the own
 * seed, `none` and `share`; `-42` and `-43` on
 * `benchmark-2026-09-21-heldout-crater`). Then the default moved.
 *
 * (a) HOLDS. `lowBurstCraterRules.test.ts`, in CI on `45323b8`: no crater of
 *     a body that is not a complete airburst below its fireball moves;
 *     B-097's crater is 1 183.5 m either side of its switch; a burst at or
 *     above its fireball digs nothing; and the harness reads B-097's birth
 *     only as it was, prints the step just past it as steep, counts B-097's
 *     switch under `none` as a jump at a regime switch, and B-098's cut as a
 *     jump under both laws.
 * (b) HOLDS. G5 reads 0 on the own seed under both laws, as the last run
 *     there read under the harness before this round (`-37`), and 7 on the
 *     unseen seed under both, the same keys. The scenarios whose failures
 *     differ: on the own seed, a 73.3 m iron at 24.3 km/s over 196 m of
 *     water whose crater is born on the step, its burst falling from 803 m to
 *     796 m (nothing to 159.4 m, read only as it was), and a 44.7 m iron at
 *     41.2 km/s near its birth (737.2 m to 810.3 m, steep within 3
 *     halvings); on the unseen seed, a 38.4 m iron at 47.1 km/s near its
 *     birth (60.0 m to 82.2 m, steep within 5 halvings), and a 60.7 m stone
 *     at 3.9 km/s and 5.9 degrees that breaks higher as it grows (B-091's
 *     neighbourhood, 2 452 m to 2 530 m) and so passes from a partial
 *     airburst to a complete one bursting 6 m up: its crater vanished there
 *     under `none` — B-097 the other way round — and falls by 3.6 % under
 *     `share` (247.2 m to 238.3 m), a fall the same key already printed.
 * (c) HOLDS. No preset moves (`lowBurstCraterRules.test.ts`, and every
 *     preset's test passes on the new default).
 * (d) HOLDS. The report regenerated on the new default: release gate PASS.
 *
 * So `DEFAULT_LOW_BURST_CRATER` is `share`, and B-097 is closed. B-098's cut
 * is not touched: the 20 m iron of its record bursts 1 157 m up, above its
 * fireball, and still digs nothing past 20 m.
 */

/** Rule 761 (b): the seed of the run on scenarios nobody has seen. */
export const LOW_BURST_CRATER_HELD_OUT_SEED = 'benchmark-2026-09-21-heldout-crater';

export const LOW_BURST_CRATER_RULES = 'rules 756 to 763, fixed 21 September 2026';
