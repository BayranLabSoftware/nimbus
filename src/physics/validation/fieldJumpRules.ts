/**
 * Rules 660 to 666 — the field's continuity, read as the limit it is. For
 * impacts, 21 September 2026, IMP-2 of ROADMAP.md M11, written and pushed
 * before the harness they describe is run.
 *
 * RULE 660. WHAT THIS ROUND IS. It changes how `scripts/benchmark/
 * invariants.ts` reads the field of rules 624 and 625, and nothing else: no
 * number of the model, no ring, no preset, no row of the report moves, and
 * the contours (rule 623) and every monotonicity check are read as they are.
 * It is read on impacts only, the one domain open.
 *
 * RULE 661. WHY, AND WHAT WAS SEEN BEFORE IT WAS WRITTEN. Rule 624 counts a
 * field sample as a jump when a body 0.1 % larger moves it by more than 5 %.
 * On the sweep's own seed at `4c0e1c7` (`benchmark/results/invariants-
 * 2026-09-21-7.json`) ten samples did. Probed afterwards on the same
 * scenarios, nine moved in proportion to the step from a thousandth down to a
 * millionth of the size — elasticities of 60 to 150, where the model is
 * steep: the fireball rising over the horizon, whose visible share grows as
 * the three-halves power of its excess, and the program's straight line from
 * regular reflection to the Mach stem, which a fixed ground range crosses as
 * the burst sinks. The tenth, the 39.4 m body's overpressure at 100 km, was
 * read that morning as the one true jump; it is not. Scanned at twenty sizes
 * across the step, it is continuous, and its elasticity turns from 1.4 to 70
 * at 1.00025 times the body, where that range enters the Mach blend: a kink.
 * A 5 % bound on a 0.1 % step is a bound on the slope, an elasticity of 50,
 * and continuity bounds no slope. That is the kind of gate Andrea asked on
 * 21 September to be found: one that blocks for no physical reason. All of
 * this was seen before the rule, so nothing on the own seed is evidence for
 * it; rule 665's seed is.
 *
 * RULE 662. THE DEFINITION. A field sample a 0.1 % larger body moves by more
 * than `FIELD_JUMP_GATE` of its scale (the larger of its two values) is
 * searched for a jump: the interval of sizes from the body to the body 0.1 %
 * larger is halved, and every half over which the sample still moves by more
 * than `FIELD_JUMP_SHARE` of that scale is halved again, down to
 * `FIELD_JUMP_HALVINGS` halvings — an interval of 9.3e-13 of the body's size,
 * which a double resolves with four thousand units in the last place to
 * spare. The sample JUMPS if an interval that deep still moves it by more
 * than the share: then it is counted, one failure as before, and the harness
 * prints where the jump lies. It is CONTINUOUS, and not counted, if the
 * search ends within `FIELD_JUMP_STEEP_DEPTH` halvings, and then the harness
 * prints it apart as steep. A search that ends deeper than that and short of
 * the bottom, or that cannot compute a value, or that needs more than
 * `FIELD_JUMP_MAX_EVALUATIONS` runs, is UNRESOLVED and counted as a jump.
 *
 * Why these numbers. The gate is 1 %, not rule 624's 5 %: with the search
 * deciding, the gate only chooses what is searched, and a lower one lets a
 * smaller jump be found — the check becomes stricter, not looser. A jump
 * under 1 % is not read, as a jump under 5 % was not. A field of elasticity e
 * moves by e × 9.3e-13 over the deepest interval, and one born as a power of
 * one half of its excess by about 1e-6 of its scale; so a continuous field
 * ends its search within 20 halvings unless its elasticity passes about 1e7,
 * which no relation of the model has, and a jump of 1 % or more never ends it.
 *
 * RULE 663. WHAT IS UNCHANGED. The floors of rule 625: a sample under its
 * floor at both ends of the step is not compared. The seven ranges of rule
 * 624. The contours of rule 623, checked at regime switches at 5 %. And rule
 * 627's side-by-side reading: the harness prints, in the same run, the field
 * as rule 624 read it, under a key G5 does not read.
 *
 * RULE 664. WHAT G5 READS on impacts, from this round: every key the sweep
 * prints but those that begin "continuous, as it was", "continuous (field),
 * as rule 624 read it" and "steep, not a jump (field)". The first two are the
 * checks as they were, printed beside the corrected ones; the third is what
 * the search found continuous.
 *
 * RULE 665. THE TEST ON SCENARIOS NOBODY HAS SEEN, written before the run.
 * One commit, two runs of 5 000 impact scenarios: the sweep's own seed, and
 * `FIELD_HELD_OUT_SEED`, which no run has used. Expected:
 *
 *   (a) no sample is unresolved: every search either ends within 20
 *       halvings or reaches the bottom still moving by more than 1 %. One
 *       that does neither says the definition is not clean on the model, and
 *       the round is refused;
 *   (b) the own seed's ten samples of rule 661 are all read as steep — known
 *       before the rule, and so not evidence;
 *   (c) a jump, on either seed, is a discontinuity of the physics: it is
 *       registered as a defect for IMP-2 and not explained away. None is
 *       expected, and none being found is what the unseen seed tests;
 *   (d) every count but the field's is the one rule 624's harness gives on
 *       the same seed, since nothing else is read differently.
 *
 * RULE 666. WHAT DECIDES. Adopted if (a) holds on both seeds and the
 * positive controls of `fieldJumpRules.test.ts` hold in CI: synthetic steps
 * of 1.2 % and 30 % are found as jumps, a kink, an exponential of elasticity
 * 150 and a square-root birth are read as steep, and B-089 — the one jump of
 * the model's physics on record, the entry's seam — is found as a jump in
 * the field when a body 0.1 % short of it grows across it. Refused
 * otherwise, and the harness goes back to rule 624's reading. Adopted, G5's
 * impact count is read on the own seed under rule 664, and rule 629 still
 * holds: G5 is met only by a run with no failure.
 */

/*
 * ===========================================================================
 * The outcome, written after the runs of 21 September 2026: ADOPTED
 * ===========================================================================
 *
 * The rules were pushed in `646dbe1` and the two runs made on that commit,
 * with the default in place (`benchmark/results/invariants-2026-09-21-8.json`
 * on the sweep's own seed, `-9` on `benchmark-2026-09-21-heldout-field`).
 *
 *                                        own seed     unseen seed
 *   field samples the 1 % gate searched       167             150
 *     read as steep                            167             150
 *     jumps                                      0               0
 *     unresolved                                 0               0
 *   field samples rule 624 counted              10               7
 *   impact failures G5 reads                   435             383
 *
 * (a) holds on both seeds: no search was unresolved, and none reached the
 * bottom, so none was a jump; the deepest of the examples the harness keeps
 * ended at the third halving. (b) holds: rule 661's ten are read as steep.
 * (c) no jump on either seed, so nothing is registered. (d) holds: on the own
 * seed every other count is the one of the run at `4c0e1c7` (`-7`), key for
 * key — 145, 133 and 118 blast rings, 38 magnitudes, one second-degree burn,
 * and the contours as they were, 4, 3 and 3. The positive controls of rule
 * 666 are `fieldJumpRules.test.ts`, in CI at `646dbe1`.
 *
 * So the field is continuous on ten thousand impacts, where rule 624 read
 * ten and seven jumps, and G5's impact count on the own seed goes from 445 to
 * 435: the 396 blast rings that shrink as a body grows by 1 %, the 38
 * magnitudes, one burn. Rule 629 holds, and G5 is not met.
 *
 * What the unseen seed shows besides, which these rules did not ask: three
 * bodies whose crater vanishes as they grow by 1 % — 168.8 m to nothing — a
 * body that reaches the ground whole beside one a hair larger that breaks
 * high enough to burst in the air. They are counted, as monotonicity
 * failures, and they are IMP-2's.
 */

/** Rule 662: the share of its scale a 0.1 % step must move a sample by
 *  for it to be searched. */
export const FIELD_JUMP_GATE = 0.01;

/** Rule 662: the share of its scale an interval must still move a sample by,
 *  at the bottom of the search, for the sample to jump. */
export const FIELD_JUMP_SHARE = 0.01;

/** Rule 662: how many times the step is halved. */
export const FIELD_JUMP_HALVINGS = 30;

/** Rule 662: the depth within which a continuous sample's search ends. */
export const FIELD_JUMP_STEEP_DEPTH = 20;

/** Rule 662: the most runs one search may take. */
export const FIELD_JUMP_MAX_EVALUATIONS = 20_000;

/** Rule 665: the seed of the run on scenarios nobody has seen. */
export const FIELD_HELD_OUT_SEED = 'benchmark-2026-09-21-heldout-field';

export const FIELD_JUMP_RULES = 'rules 660 to 666, fixed 21 September 2026';
