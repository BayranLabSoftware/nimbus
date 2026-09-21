/**
 * Rules 667 to 675 — the entry on its paper's equations, and B-089 closed.
 * 21 September 2026, IMP-2 of ROADMAP.md M11, written and pushed before the
 * default moves, the report is regenerated or the sweep is run.
 *
 * RULE 667. WHAT THIS ROUND IS. `DEFAULT_ENTRY_EQUATIONS` goes from
 * `program` to `paper`: the breakup altitude from Collins et al.'s Eq. 11 on
 * Eq. 12's I_f, not twice it, and the speed of a broken body from Eq. 20
 * with its −3(l/H)² term. It undoes, for the default, the choice rules 141
 * to 145 of `entryProgramRules.ts` made on 16 September. The program's
 * equations stay in the code, and every test that holds a relation to what
 * the program prints runs on them. It is a deliberate departure from the
 * reference, which G1 allows where the report names it and gives the
 * reason; the reasons are rules 668 to 670.
 *
 * RULE 668. THE MODEL'S OWN PHYSICS. Eqs. 8 to 10 — a body slowed by drag
 * in an exponential atmosphere breaks where its ram pressure ρ(z)v(z)² first
 * reaches its strength Y — have an exact answer. With a = 3 C_D H /
 * (4 ρ_i L₀ sin θ), the ram pressure of Eq. 8 peaks at v₀² / (2 a e), so the
 * body breaks if and only if (3e/2) C_D H Y / (ρ_i L₀ v₀² sin θ) ≤ 1, and
 * 3e/2 = 4.0774 is Eq. 12's 4.07 to three figures: Eq. 12's I_f is the
 * condition itself, and Eq. 11 a fit to the altitude. On Eq. 12 as printed,
 * Eq. 11 lies within 40 m of the exact root at every I_f up to 0.98. Above
 * that the altitude goes as the square root of 1 − I_f, and the printed
 * constant, 0.18 % low, tells: the breakup rises above the root, 82 m at
 * 0.99 and up to 0.49 km at the fold; and for I_f from 0.99818 to 1 the
 * model breaks a body whose ram pressure peaks short of its strength by
 * 0.18 % at most, within 0.49 km of the altitude of that peak. The printed
 * constant is the paper's, and it is kept. On twice Eq. 12's I_f, Eq. 11
 * puts the breakup below the exact root, where the ram pressure has already
 * passed the strength, at every I_f: 65 m at 0.01, 332 m at 0.1, 1.36 km at
 * 0.3, 6.1 km at ½; and from ½ to 1, where the body does reach its
 * strength, it has no answer. On the bodies read before these rules: rule
 * 143's fifth (I_f 0.108) breaks 360 m below its root, at 1.044 Y, and
 * Meteor Crater's iron (0.072) 240 m below, at 1.030 Y; on the paper's I_f
 * both, and the other fifteen of rule 143 and four presets, lie within 40 m,
 * at 0.998 to 1.005 Y. A body does not hold together after its ram pressure
 * has passed its strength. That is the question the possibility lens asks,
 * and the doubled I_f fails it.
 *
 * RULE 669. THE OBSERVATION. Sikhote-Alin, 1947 (Krinov 1966): an iron of
 * about 70 t at 14.5 km/s, which broke near 5.8 km into the 122 craters of
 * its strewn field. Its I_f is 0.936. The paper's equations break it at
 * 6.02 km, the exact root at 6.03; the doubled I_f, 1.87, has no breakup at
 * all. Rule 145 put it on the paper's equations for that reason.
 *
 * RULE 670. THE SEAM. Rule 145 used the program's equations where its
 * doubled I_f is under 1 and the paper's where it is not. At that seam, I_f
 * = ½, the program's Eq. 11 gives the breakup of a body with I_f = 1 and the
 * paper's that of I_f = ½: 0.76 H apart, about 6 km, for a hair of size.
 * B-089 is that seam — a 30 m iron whose share of energy at the ground falls
 * by a ninth for 0.05 % of its size, every blast ring halving. On the
 * paper's equations the worst step of that share across the seam, in steps
 * of 0.005 %, is 1.00001×. No other choice is both continuous and possible:
 * carrying the program past the seam as a body that never breaks
 * (`EntryBoundary` `joined`, measured this morning) is continuous, but it
 * fails rule 668 over the whole of I_f from ½ to 1 and rule 669 at
 * Sikhote-Alin.
 *
 * RULE 671. WHAT WAS LOOKED AT BEFORE THESE RULES, and what the departure
 * costs. On the I1 grid, against what the program prints: the 81 breakup
 * altitudes go from within 0.01 % to within 0.82 %; the 24 burst altitudes
 * from 0.02 % to 4.94 %, one of them beyond 1 %; the 24 airburst
 * overpressures, both ends, from 0.02 % to 0.56 %; the 57 ground
 * overpressures from 0.09 % to 0.18 %; the 57 fireball radii from 0.02 % to
 * 0.07 %; nothing else moves. Rule 143's sixteen bodies: fifteen still agree
 * within its 1 %; the fifth departs, its breakup by +3.8 % and its five
 * overpressures by +4.1 % to +9.2 %. Of the presets only Meteor Crater
 * moves: breakup +2.4 %, share at the ground +1.7 %, crater +0.37 %, 1 psi
 * ring +7.0 %. And I2: rescored on the default in place, its script reads
 * NOT MET, because it converts the model's breakup to the program's I_f by
 * BM-13's formula and the model has been on the program's I_f since rule
 * 144 — converted twice. On the paper's equations the model reproduces the
 * burst altitudes rules 76 to 79 stored for the 357 fireballs, 356 of 356
 * within 0.1 % (the worst 1.0001×), where the default in place moves 157 of
 * them by more than that. I2's evidence was always the paper's model's.
 *
 * RULE 672. HOW G1, I1 AND I2 READ IT. Every relation stays held to the
 * program: the tests holding the program's printed numbers — the grid's
 * altitudes and ground overpressures at their gates, rule 143's sixteen
 * bodies at 1 %, rules 138 to 140's points — run on `entryEquations:
 * 'program'` and must pass there, their tolerances unchanged. The default
 * departs from the program through Eq. 12's I_f and Eq. 20's term alone, and
 * the report names the departure, BM-13, with rules 668 to 670 as its
 * reason. I2 is scored as it was written.
 *
 * RULE 673. WHAT IS EXPECTED, written before the runs:
 *
 *   (a) the validation report regenerated on the new default keeps the
 *       release gate at PASS, with Meteor Crater's gated crater in its band;
 *   (b) I2's script, rerun on the new default against the program's stored
 *       answers, reads 352 fireballs within 1 %, 4 through BM-13 and 1
 *       refused by the program, and I2 MET;
 *   (c) every test that holds the program's printed numbers passes on the
 *       program's arm with its tolerance unchanged;
 *   (d) a test in CI holds the default to rule 668, on every body of the
 *       I1 grid, of rule 143 and of the presets, and on a scan of irons
 *       through the fold: where the ram pressure of Eq. 8 reaches the
 *       strength above the ground, the breakup lies within
 *       `ENTRY_EXACT_TOLERANCE_M` of the exact first crossing, found by
 *       bisection, for an I_f up to `ENTRY_FOLD_IF`, and within
 *       `ENTRY_FOLD_TOLERANCE_M` above it; where it never does, the body
 *       does not break, or its I_f lies in the sliver the printed 4.07
 *       leaves. The program's arm, which fails it, is not held to it;
 *   (e) the sweep's own seed, 5 000 impacts under the harness of rules 660
 *       to 666, read against the run rule 665 makes on the same seed with
 *       the default in place: no key appears that that run did not print,
 *       and the count G5 reads does not rise;
 *   (f) B-089's body grows through its old seam with no step: rule 662's
 *       search reads its overpressure at 1 km there as continuous, where on
 *       the program's arm it finds the jump.
 *
 * RULE 674. WHAT DECIDES. Adopted when (a) to (f) all hold; B-089 is then
 * closed. Otherwise refused: the default goes back to `program`, the failing
 * items are printed, and B-089 stays open.
 *
 * RULE 675. WHAT THIS DOES NOT CLAIM. That Eq. 11 is right for real bodies:
 * it is a fit to a drag law with one strength, and I2 measures how far it
 * misses the sky. Only that, of the program's reading of Eq. 12 and the
 * paper's, the paper's is the one the equations themselves and the one fall
 * that separates them agree with. And G5 is not met by this round.
 */

/*
 * ===========================================================================
 * The outcome, written after the runs of 21 September 2026: REFUSED, by the
 * letter of rule 673 (e)
 * ===========================================================================
 *
 * The rules were pushed in `646dbe1`; the default was then moved to `paper`
 * in the working tree and read.
 *
 * (a) HOLDS. The validation report regenerated on the paper's entry: release
 *     gate PASS (strict), tolls 13 of 18, waves 10 of 16, replay 3 of 3,
 *     golden 12 of 12. It moves where rule 671 said: the grid's breakup
 *     altitudes to 1.00–1.01× of the program, burst altitudes 1.00–1.05×,
 *     airburst overpressures 1.00–1.01×. And one thing rule 671 did not
 *     name: on the 357 bolides the entry misses the sky a little more — the
 *     body with no class by +12.8 km on average where it was +12.7; the
 *     panel's stony class by a median of 8.3 km where it was 8.1, 99 within
 *     5 km where there were 105. Twice Eq. 12's I_f breaks a body lower, and
 *     a model that bursts too high is helped by anything that lowers it; that
 *     is not a reason for a relation, and it is printed.
 * (b) HOLDS. I2's script on the paper's entry: 352 within 1 %, 4 through
 *     BM-13, none beyond, 1 refused by the program — the model implements the
 *     reference, I2 MET — where on the default in place it reads NOT MET.
 * (c) HOLDS. Eight test files moved onto `entryEquations: 'program'` where
 *     they hold what the program prints or pin a scenario read on its entry,
 *     their tolerances unchanged; every test of every project passes, 2 770.
 * (d) HOLDS. `effects/entryExactBreakup.test.ts`: every body of the grid,
 *     rule 143, the presets, a scan of irons and ten irons placed through the
 *     fold, within 50 m of the exact root up to I_f 0.98 and within 500 m
 *     above; the program's arm 350 m and more below it on rule 143's fifth
 *     body and Meteor Crater.
 * (e) FAILS, BY ITS LETTER. On the own seed (`benchmark/results/invariants-
 *     2026-09-21-10.json`, against `-8`), the count G5 reads falls from 435 to
 *     431 — the light-damage rings 145 to 142, the 1 psi rings 133 to 132 —
 *     and no key G5 reads appears. But one key appears that `-8` did not
 *     print: `continuous (field), as rule 624 read it: field.overpressureAt10km`,
 *     the retired check printed beside the corrected one, on an 18.8 m body at
 *     2.9 km/s whose overpressure at 10 km the corrected check reads as steep.
 *     The rule says no key, and a key is a key. It meant a kind of failure,
 *     and it did not say so.
 * (f) HOLDS. At B-089's old seam, a body half a step short of it: on the
 *     paper's entry the overpressure at 1 km moves 0.27 % across the step,
 *     below the gate; on the program's it falls 77.6 % and rule 662's search
 *     finds the jump at the step's middle.
 *
 * So the round is refused as rule 674 says: the default goes back to
 * `program`, and B-089 stays open. The tests of (c) stay on the program's
 * arm, where they hold what they held; (d) holds the paper's equations
 * explicitly, which is rule 668 whatever the default. Nothing read here is
 * carried: the round that asks again reads everything again, on its own
 * commit, with its criterion written as meant and read on a seed no run has
 * used.
 */

/** Rule 673 (d): how far the breakup may lie from the exact first crossing
 *  (m) for an I_f up to {@link ENTRY_FOLD_IF}; Eq. 11 on Eq. 12 as printed is
 *  within 40 m there. */
export const ENTRY_EXACT_TOLERANCE_M = 50;

/** Rule 673 (d): the I_f above which the breakup is read at the fold. */
export const ENTRY_FOLD_IF = 0.98;

/** Rule 673 (d): how far the breakup may lie from the exact first crossing
 *  (m) at the fold; the printed 4.07 puts it up to 488 m above. */
export const ENTRY_FOLD_TOLERANCE_M = 500;

/** Rule 668: Eq. 12's printed 4.07 over the exact 3e/2. Below 1, and above
 *  this, the model breaks a body whose ram pressure peaks short of its
 *  strength. */
export const PRINTED_OVER_EXACT_IF = 4.07 / (1.5 * Math.E);

export const ENTRY_PAPER_RULES = 'rules 667 to 675, fixed 21 September 2026';
