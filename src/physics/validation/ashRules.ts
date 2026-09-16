import type { AshSpreadLaw } from '../events/volcano/ashfall.js';

/**
 * How wide the ash cloud is, against the model the field runs.
 *
 * The campaign of 15 September 2026 scored Nimbus's tephra against Tephra2 on
 * seventy eruptions and found the worst number in the whole project: on the
 * wind axis the loading came out 0.51× the reference, and **across** the wind,
 * fifty kilometres downwind, 0.008× — a hundred and twenty-five times too
 * little, with a scatter of 31.8 in the log. Thirty kilometres off the axis
 * the ratio was zero to two decimals. The diagnosis it recorded was "plume too
 * narrow across the wind", and BM-07 has been open since.
 *
 * Rule V1 of docs/GOLD_STANDARD.md asks that the ash be held to Tephra2 on its
 * own grid where the model is Tephra2's, so this is a verification and not a
 * validation: the reference is an implementation of the same physics, not a
 * measurement of the world, and agreeing with it is the whole aim. Closing the
 * gap costs no held-out data, because there is none to spend.
 *
 * Why it is narrow. Nimbus spreads a release by σ_y = max(0.3·H, 500 m)·√(1 +
 * x / 10H): the downwind distance and the plume height, and nothing else. A
 * 32 µm ash grain that takes a day to reach the ground therefore spreads
 * exactly as much as an 8 mm lapillus that takes four minutes. In an
 * advection-diffusion model — which is what Tephra2 is — it is the *fall time*
 * that earns the spread, and the fine tail is what makes a cloud wide.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out. Tephra2 itself, built from its own repository at the commit the
 * campaign used and run on the same seventy eruptions
 * (`docs/TEPHRA2_SETUP.md`, `scripts/benchmark/tephra2-reference.ts`); the
 * regenerated reference reproduces the campaign's crosswind figure to three
 * decimals, 0.008 at σ 31.83 against 31.84, which is what says the generator
 * is faithful. And `tephra2_calc.c`'s own arithmetic, which is where rule
 * 107's closure is read from rather than from a paper's summary of it.
 *
 * And the thing to weigh: **the candidate's form was arrived at by scoring it
 * twice.** The first attempt added the diffusion to Nimbus's source width in
 * quadrature and came out nine times too wide across the wind; reading the
 * reference again showed why — Tephra2's own plume-diffusion time already
 * carries the source's size, so the first attempt counted it twice — and the
 * second attempt dropped the quadrature. Both scores are printed by the run.
 * A round whose candidate is fitted to a reference cannot be pre-registered in
 * the strict sense, because choosing the form *is* the fitting; what can be
 * fixed in advance, and is fixed here, is what counts as an improvement, and
 * rule 108's guard is the strict one — every figure must get better, none may
 * get worse.
 *
 * The rules, fixed on 16 September 2026, and numbered after the hundred and
 * five before them:
 *
 *  106. The reference. Tephra2 at commit ff621c6, built as
 *       docs/TEPHRA2_SETUP.md says and run by
 *       `scripts/benchmark/tephra2-reference.ts` on the seventy eruptions of
 *       `benchmark/matrices/volcano.json`, with the choices the protocol
 *       recorded: Nimbus's plume height, the case's bulk volume at Nimbus's
 *       deposit density for the erupted mass, the case's wind held constant
 *       with height, Nimbus's four grain classes as a Gaussian in φ, and
 *       everything Nimbus has no equivalent for taken from Tephra2's Colima
 *       example unchanged. The campaign's own result file is not overwritten:
 *       a later run writes beside it, named by its day.
 *
 *  107. The candidate (`tephra2`). A release's spread is the one its own fall
 *       time earns, by the closure `tephra2_calc.c` computes: above a
 *       fall-time threshold σ² = (8/5)·C·(t + (0.2·h²)^(2/5))^(5/2), below it
 *       σ² = 4·K·(t + 0.0032·h²/K), with h the release height above the vent,
 *       C the eddy constant and K the diffusion coefficient — both of them
 *       Tephra2's example values, which is what the reference runs on, and
 *       both declared as such rather than fitted here. Tephra2's spread is
 *       isotropic and already carries the plume's own size in its diffusion
 *       time, so the candidate uses it for the along-wind and the crosswind
 *       spread alike and does not add Nimbus's source width on top. Everything
 *       else is untouched: the Suzuki release profile, the Ganser terminal
 *       velocities, the grain classes, the mass.
 *
 *  108. What decides. The candidate is adopted only if **every** figure the
 *       comparison prints improves and none gets worse — on the wind axis and
 *       across it alike, the geometric mean moves towards one, the scatter
 *       falls and the share within a factor of two rises — and if the release
 *       gate stays PASS and the invariants of rule 19 are no worse than the
 *       221 failures of 16 September. A law that mends the crosswind by
 *       spoiling the axis is not an improvement and is refused.
 *
 *  109. What is printed, and what an adoption does. Both attempts of rule
 *       107, the figures on the axis and across the wind under each law, and
 *       the 1 mm isopach reach, which neither attempt was aimed at. An
 *       adoption makes `tephra2` the default in `ashfall.ts`, names the
 *       closure and its constants in the methodology page and the report, and
 *       leaves the campaign's BM-07 numbers where they are with the new ones
 *       beside them. The rules that decided before keep their verdicts and
 *       their printed figures move, as rule 44 has it, and nothing is re-tuned
 *       (rules 5 and 6).
 *
 * What these rules cannot settle. Agreeing with Tephra2 is not agreeing with a
 * deposit: the reference is a model, its constants come from one inversion of
 * one eruption at Colima, and V3 — ten eruptions with a published isopach map
 * — is the rule that would read the world, and is not measured. Tephra2 runs a
 * wind that changes with height and Nimbus holds one constant, so part of what
 * remains between them is a wind and not a spread. And a closure read off a C
 * file is only as right as the reading: what protects it is that the reference
 * and the candidate are run against each other on seventy eruptions, where a
 * misread exponent would show at once.
 *
 * ---
 *
 * **The outcome, written after the run of 16 September 2026: REFUSED.**
 *
 * Every figure of the comparison improved, and by a long way — across the wind
 * 0.008× became 0.299× with the scatter down from 31.8 to 4.1, on the axis
 * 0.466× became 0.686× with 59 % of points within a factor of two against
 * 23 %. The release gate stayed PASS. Rule 108's other clause is what refused
 * it: rule 19's invariants came back at **222** failures against the 221 the
 * rule names.
 *
 * The 222nd failure is not the candidate's, and the run says so plainly: the
 * sweep was taken with the candidate switched off, under the law in place and
 * nothing else changed, and it still came back at 222. The extra one is
 * `continuous: radiation.ld50Radius` in the explosion, which never calls this
 * file at all.
 *
 * It is not a defect either. A 1.258 Mt burst at 2 751.65 m reaches 450 rad at
 * a slant range of 2 752.18 m — the lethal sphere touches the ground with
 * fifty-three centimetres to spare — and the ring it cuts there is
 * √(slant² − h²) = 53.9 m. A 0.1 % step in yield moves that slant range by
 * 0.017 % and the ring by 37 %, amplified by (slant/ground)² = 2 606, which is
 * exactly the derivative of a sphere meeting a plane. One airburst in two
 * hundred thousand is that steep. Rule 19's continuity check assumes the rings
 * are smooth in size; this one genuinely is not, at the single point where the
 * dose only just arrives. Smoothing it would be lying about a sphere.
 *
 * What it is, is a number written down carelessly. 221 was read on 16
 * September at commit 116dfdb, before the burn round (rules 80 to 84) and the
 * radiation round (rules 85 to 89) changed the explosion's own physics, and
 * neither of those rounds re-read rule 19. Rules 85 to 89 gave the radiation
 * rings a height of burst — the project fit ignored it and was smooth in
 * consequence — and with it this cliff. So rule 108's bound was stale when it
 * was written, and it was written by the same hand it now binds.
 *
 * That changes nothing here. The protocol does not loosen a bound after a
 * figure has failed it, and a guard re-read as "no worse than the law in
 * place" the moment it bites is the exact failure the protocol exists to
 * prevent. The candidate stays in the file, reachable by name and measured;
 * `DEFAULT_ASH_SPREAD` stays `project`; V1 stays not met; and the refusal
 * stands as this round's verdict and is not revised.
 *
 * A later round may put the same candidate to a baseline that is not stale.
 * It would not be a pre-registration and should not be dressed as one — the
 * figures above are already known. What such a round can offer instead is
 * three things a reader can check: that the candidate is the one refused here,
 * unchanged to the constant; that the test of improvement is `improves()`
 * below, unchanged; and that its baseline is a measurement anyone can
 * reproduce by running the sweep.
 */

/** Rule 107's candidate and the law in place. */
export const ASH_IN_PLACE: AshSpreadLaw = 'project';
export const ASH_CANDIDATE: AshSpreadLaw = 'tephra2';

/**
 * Rule 108: the invariants may not be worse than the day's reading.
 *
 * Read on 16 September 2026 at commit 116dfdb, and — this is what refused the
 * candidate — read *before* rules 80 to 84 and 85 to 89 changed the
 * explosion's own physics, neither of which re-read rule 19. The sweep under
 * the law in place now gives 222. The number stays as the rule fixed it: a
 * bound is not moved after a figure has failed it.
 */
export const ASH_INVARIANT_FAILURES = 221;

/** What the sweep of 16 September 2026 gives under the law in place, with the
 *  candidate switched off — which is what says the 222nd failure is not the
 *  candidate's. `benchmark/results/invariants-2026-09-16-1.json`. */
export const ASH_INVARIANTS_MEASURED = 222;

export interface AshReading {
  /** Points compared. */
  pairs: number;
  /** Geometric mean of Nimbus over Tephra2. */
  bias: number;
  sigmaLn: number;
  /** Share of points within a factor of two. */
  withinTwo: number;
}

/** How far a reading stands from agreement: |ln(bias)|, so smaller is better
 *  whichever side of one it falls. */
export function distanceFromAgreement(reading: AshReading): number {
  return reading.bias > 0 ? Math.abs(Math.log(reading.bias)) : Number.POSITIVE_INFINITY;
}

/** Rule 108: one quantity improves when it moves towards agreement, its
 *  scatter falls and its share within a factor of two does not fall. */
export function improves(before: AshReading, after: AshReading): boolean {
  return (
    distanceFromAgreement(after) < distanceFromAgreement(before) &&
    after.sigmaLn < before.sigmaLn &&
    after.withinTwo >= before.withinTwo
  );
}

/** Rule 108: whether the candidate is adopted. */
export function chooseAshSpread(input: {
  axis: { before: AshReading; after: AshReading };
  crosswind: { before: AshReading; after: AshReading };
  gatePasses: boolean;
  invariantFailures: number;
}): { adopted: boolean; axis: boolean; crosswind: boolean; gate: boolean; invariants: boolean } {
  const axis = improves(input.axis.before, input.axis.after);
  const crosswind = improves(input.crosswind.before, input.crosswind.after);
  const invariants = input.invariantFailures <= ASH_INVARIANT_FAILURES;
  return {
    adopted: axis && crosswind && input.gatePasses && invariants,
    axis,
    crosswind,
    gate: input.gatePasses,
    invariants,
  };
}
