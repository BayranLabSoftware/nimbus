/**
 * Rule 1126 — the one paired run on the third set, fixed before it is run. The
 * reviewer, 24 September 2026, approved the table of eligibility (rules 1120
 * to 1125), the inputs pinned and one paired run of the baseline and S under
 * the second version of the judge, F run and published as a diagnostic only;
 * no adoption before he reads the full account, no class B from this set.
 * Andrea's word: the rule, the run, the account. Written and pushed before the
 * run; it chooses nothing on any output, none existing.
 *
 * RULE 1126. THE RUN.
 *   (a) THE DRAWS. Every admitted body — Winchcombe as a control, counted in
 *       no decision — 1 000 draws of its pinned inputs on the rounds' stream
 *       (FNV-1a and mulberry32) seeded "third-set-v2/" and the body's name,
 *       drawn in the rounds' order: speed, angle, diameter, density, the
 *       ground's density (`drawnInputs`, as rule 978 drew). The same draws for
 *       every model: the run is paired by index.
 *   (b) THE MODELS, as rule 1098 (a) froze them. The baseline: the product
 *       (`simulateImpact`), its crater's state its own. S: its study as it ran
 *       (0c59e87, unchanged since), f1 = 0.50, the first stage at the
 *       product's S1 and the second phase on 0.9–5 MPa. F, as a diagnostic:
 *       its study as it ran on the development cases (9eeed0a), its priors on
 *       the stream "study F/" and the body's name, its main strength the
 *       product's (rule 1096 (a)).
 *   (c) THE ARRIVALS (rules 1107, 1116). The baseline's arrival is its body
 *       where it comes down whole, at its end speed — in dark flight where
 *       that is its terminal speed — or its swarm where it bursts only in
 *       part; a crater only where the product computes one. S's are its core
 *       and its shares that reach the ground as swarms; F's its fragments and
 *       its swarm, at √(2E/m); neither computes a crater: an arrival of theirs
 *       at 5 km/s or more is fast.
 *   (d) O1 (rules 868, 930, 1053, 1061, 1104, 1111, 1125). The release is the
 *       baseline's burst altitude and S's m2 — the mass-weighted altitude of
 *       its bursting shares, as its study read it. Each draw is counted
 *       produced, excluded by the selection, not produced, or not convergent.
 *       A model is compatible on a body where the 5–95 % band of its produced
 *       draws meets the body's interval widened by 5 km each way. A body is
 *       comparable where at least 50 draws are produced under both models,
 *       paired by index; the widths are compared on those paired draws, a
 *       model's band voiding the body's gain where it is wider than the larger
 *       of 1.5 times the baseline's and 0.5 km. O1 is assessable where at
 *       least three bodies in the priors' domain are comparable; it improves
 *       where the model gains at least one body the baseline did not hold,
 *       unvoided, and loses none it held; it worsens where it loses one.
 *   (e) THE GROUND (rules 1103, 1108 to 1110). D1 on every body, J on none
 *       (not admissible, rule 1123), D2's worsening on the five whose «no
 *       crater» is documented, read on the share of draws with an arrival at
 *       the law's speeds; D3 and the classes counted, as descriptions
 *       (`groundVerdict`, `arrivalBreakdown`). Assessable where D1 is read on
 *       at least three bodies for both models.
 *   (f) THE VERDICT (rules 1115, 1119): `verdictV2` on O1 and the ground
 *       outcome — «adoptable under version 2», «not adoptable» with its reason,
 *       or «adoption not assessable under version 2» where either decisive
 *       observable is not assessable. It adopts nothing: the reviewer reads the
 *       account first.
 *   (g) THE DIAGNOSTICS, published beside and deciding nothing: O2 — the share
 *       of draws with a piece at the ground, and over them the median and the
 *       5–95 % band of the largest piece's mass, beside the recovered mass and
 *       its class; O3 on Hamburg — the model's median number of pieces
 *       heavier than each quartile of the 25 single masses of its Table 4 (the
 *       row of «multiple specimens» left out, «~60 g» read as 60 g); F's
 *       readings — the same, and its release altitude at 50, 100 and 200 m
 *       with its convergence (rule 1094), no aggregate of it comparable.
 *   (h) THE STRESS RUN (rule 934 (c)): every body's size leans on a target, so
 *       the same draws are run again with the mass three times and a third —
 *       the diameter times 3^(1/3) and divided by it — for the baseline and S;
 *       O1's compatibility and D1 reported, never scored.
 *   (i) ONCE, AS IT COMES. The script checks its engine (Node 22.20.0 on
 *       darwin-arm64), runs once, writes src/physics/validation/
 *       thirdSetRun.json and docs/THIRD_SET_RUN.md, and the account is
 *       published whatever it shows — the counts of O1's draws, every
 *       unfavourable result, F's diagnostics. No body replaced, no criterion
 *       revised. The words of the outcome, fixed now: «Terzo insieme, versione
 *       2 del giudice: S <verdict>. Nessuna adozione prima della lettura del
 *       revisore; nessuna classe B da questo insieme.»
 */

/** Rule 1126 (a): the draws per body, and the prefix of their seed. */
export const THIRD_SET_RUN_DRAWS = 1_000;
export const THIRD_SET_RUN_SEED = 'third-set-v2/';

/** Rule 1126 (d): the paired produced draws a comparable body needs. */
export const THIRD_SET_O1_MIN_PAIRED = 50;

/** Rule 1126 (d): the widening of a body's flare interval each way (m). */
export const THIRD_SET_O1_WIDENING_M = 5_000;

/** Rule 1126 (h): the stress run's factor in mass. */
export const THIRD_SET_STRESS_MASS_FACTOR = 3;

/** Rule 1126 (g): Hamburg's single recovered masses, Table 4, pp. 36–37 (g). */
export const HAMBURG_TABLE4_MASSES_G = [
  12, 15.83, 26, 3, 0.301, 10.43, 20, 11, 20, 2, 1, 17.5, 60, 59.4, 102.6, 37, 6.5, 13.8, 12.6,
  11.5, 55.92, 0.2, 0.008, 50, 20.6,
] as const;

/** Rule 1126 (i): the words of the outcome, fixed before the run. */
export function thirdSetOutcome(verdict: string): string {
  return `Terzo insieme, versione 2 del giudice: S ${verdict}. Nessuna adozione prima della lettura del revisore; nessuna classe B da questo insieme.`;
}
