/**
 * Two of the impact family's G5 failures, and whether to mend them. G5 of
 * docs/GOLD_STANDARD.md asks five thousand random scenarios to be "monotone
 * wherever the physics is". Neither of the two below is a measurement against
 * a reference: no program computes a partial airburst's burns, and none says
 * where the seafloor stops being struck. They are the model's own assumptions,
 * made consistent with themselves, and they change defaults, so G7 asks for
 * rules first.
 *
 * The rules, numbered after the hundred and thirty-one before them:
 *
 *  132. **What was looked at.** The sweep of 16 September 2026 on the physics
 *       of `8bf7057` (`benchmark/results/invariants-2026-09-16-4.json`): 199
 *       impact failures, each read to its cause on the examples the sweep
 *       keeps.
 *
 *       - 177 blast rings that shrink when the body grows by 1 %, all in the
 *         Mach region: a larger body bursts lower, below its optimum height,
 *         and the Earth Impact Effects Program, asked on one of them, falls
 *         with it (3 453.9 to 3 445.8 Pa at 76.65 km). And 10 blast rings that
 *         jump: 2 at the step rules 129 to 131 have since replaced, 8 where a
 *         ring is born under the burst. The program's physics; not touched.
 *       - 4 crater sizes that shrink, on two bodies at 3.2 km, where Collins
 *         et al. 2005's final diameter passes from 1.25 D_tc to
 *         1.17 D_tc^1.13 / D_c^0.13 and steps down by 9 % (7.7 % and 8.3 % on
 *         the two bodies, which grow on the way). The published law; whether
 *         the program steps there too is not asked here, and nothing is
 *         touched.
 *       - **6 burn rings** that shrink, on three bodies at the passage from a
 *         complete to a partial airburst: the body 1 % larger reaches the
 *         ground with about 10 % of its energy, and the ring — the larger of
 *         the ground fireball's and the air flash's — shrinks by 3.6 % to
 *         5.1 %, because each flash alone is smaller than the two together.
 *       - **2 tsunami amplitudes** that shrink, by 0.66 % and 0.59 %: the
 *         seafloor share of an ocean impact is e^(−d/d_c) up to a disruption
 *         depth and 0 beyond, and at that depth it steps from e^(−3) to 0. The
 *         body 1 % larger sits on the shallow side of its own cutoff and sends
 *         5 % less of its energy into the water.
 *
 *       And one defect found on the way, B-041, fixed before anything here
 *       runs: the air flash drew its rings at Glasstone & Dolan's nuclear
 *       exposure, against rule 81.
 *
 *  133. **The candidates.** A: `ImpactFlashCombiner` `sum` in
 *       events/impact/damageRings.ts — the two flashes' fluences add, so the
 *       ring is √(r_ground² + r_air²). B: `SeafloorCutoff` `taper` in
 *       effects/oceanCoupling.ts — the seafloor share is
 *       (e^(−d/d_c) − e^(−d_d/d_c)) / (1 − e^(−d_d/d_c)), which starts from 1
 *       and reaches 0 at the cutoff. Neither is the default when this is
 *       pushed.
 *
 *  134. **The sweep, three times in one session.** `scripts/benchmark/
 *       invariants.ts 5000 impact`, on one tree: first with both defaults in
 *       place; then with A as the default and B not; then with B as the
 *       default and A not — each default set by the one line that names it,
 *       and put back after. Each run's failures are compared with the first
 *       run's, invariant by invariant (rule 113's same-run reading).
 *
 *  135. **What decides A.** Adopted when all hold: (a) no burn ring fails
 *       either invariant in its run; (b) no other invariant fails more often
 *       than in the first run, and none fails that did not; (c) on the eight
 *       impact presets, the burn rings of an intact impact or a complete
 *       airburst do not move by a millimetre, and those of a partial airburst
 *       do not shrink and grow by no more than √2, the most a sum of two can
 *       exceed the larger; (d) with A as the default, every test of the suite
 *       passes but those that pin a partial airburst's burn ring, which are
 *       read and updated, and the validation report regenerated on it keeps
 *       the release gate at PASS.
 *
 *  136. **What decides B.** Adopted when all hold: (a) no tsunami amplitude
 *       fails either invariant in its run; (b) as 135 (b); (c) the partition's
 *       calibration ends hold — a body under no water strikes the seafloor
 *       with all its energy, and none reaches it from the disruption depth
 *       on — and no number in the crater, damage and tsunami blocks of the
 *       ocean preset moves by more than a factor 1 / (1 − e^(−3)) = 1.052,
 *       the most the taper can add to the water's share; (d) as 135 (d), for
 *       the tests that pin an ocean impact.
 *
 *  137. **What these rules cannot settle.** Whether a partial airburst's two
 *       flashes burn like one: they are seconds and kilometres apart, and the
 *       model already draws both from the point of impact with the same
 *       efficiency, so the sum is what the model's own assumptions say, not
 *       what a measurement does. Whether the seafloor share ends at the cutoff
 *       smoothly or at once: the Eltanin record says no crater is left, not
 *       how the share falls on the way there. A rejected candidate stays
 *       reachable and its failures stay declared.
 */

/*
 * ===========================================================================
 * The outcome, written after the runs of 16 September 2026:
 * A ADOPTED, B REFUSED
 * ===========================================================================
 *
 * The rules were pushed in `92934a9`, with B-041 fixed in the same commit, and
 * the sweep run three times in one session afterwards
 * (`benchmark/results/invariants-2026-09-16-5.json`, `-6` and `-7`).
 *
 * The first run, both defaults in place: **187** impact failures — 167 blast
 * rings that shrink and 8 that jump (177 and 10 before rules 129 to 131
 * replaced the step), 6 burn rings, 4 crater sizes, 2 tsunami amplitudes. The
 * 8 jumps are all rings born under the burst: its peak overpressure on the
 * ground is 0.4 % to 3 % above the threshold, and a ring drawn under a peak
 * that close grows steeply from nothing.
 *
 * **A, the flashes add: ADOPTED.** (a) Its run has no burn-ring failure,
 * 181 in all. (b) Every other invariant fails exactly as often as in the first
 * run, and none is new. (c) Of the eight presets only Meteor Crater's burn
 * rings move, ×1.1716 both — 4.66 to 5.46 km and 5.90 to 6.91 km, the square
 * root of all of the energy over the 72.9 % that reaches the ground — while
 * Chicxulub's, Popigai's and Boltysh's stay at their fireballs' horizons and
 * the three complete airbursts' do not move. (d) With A as the default all
 * 2 120 tests pass and none needed a new number, and the validation report
 * regenerated on it keeps the release gate at PASS and does not change: no
 * row of it reads a partial airburst's burns.
 *
 * **B, the seafloor taper: REFUSED.** (a) held: no tsunami amplitude fails in
 * its run. (b) did not: the crater sizes fail three times each where the first
 * run had two. The new one is an ocean impact, a 139 m body of 4 238 kg/m³ at
 * 67.8 km/s into 51 m of water, whose smaller seafloor share under the taper
 * puts its final crater on Collins et al.'s simple-to-complex step, 3 186 to
 * 2 941 m. It is the published step moved onto another scenario, not a new
 * kind of failure, and the rule does not ask why a count grows. `step` stays
 * the default, `taper` stays reachable, and the two tsunami failures stay
 * declared.
 */

/** Rule 135 (a): the rings candidate A answers for. */
export const FLASH_RINGS: readonly string[] = ['damage.thirdDegreeBurn', 'damage.secondDegreeBurn'];
/** Rule 136 (a): the rings candidate B answers for. */
export const TSUNAMI_RING_PREFIX = 'tsunami.';

/** Failure counts of one sweep, by invariant name as the sweep writes it
 *  (for example "monotone in size: damage.thirdDegreeBurn"). */
export type FailureCounts = Readonly<Record<string, number>>;

/** The ring an invariant name is about. */
export function ringOf(invariant: string): string {
  const colon = invariant.indexOf(': ');
  return colon < 0 ? invariant : invariant.slice(colon + 2);
}

export interface SweepGuard {
  /** Failures left on the candidate's own rings. */
  targetsLeft: number;
  /** Other invariants that fail more often than in the first run. */
  grown: string[];
  /** Invariants that fail in the candidate's run and not in the first. */
  appeared: string[];
  held: boolean;
}

/** Rules 135 (a, b) and 136 (a, b), for one candidate's run against the
 *  first run of the same session. */
export function sweepGuard(
  inPlace: FailureCounts,
  candidate: FailureCounts,
  isTarget: (ring: string) => boolean
): SweepGuard {
  let targetsLeft = 0;
  const grown: string[] = [];
  const appeared: string[] = [];
  for (const [name, count] of Object.entries(candidate)) {
    if (isTarget(ringOf(name))) {
      targetsLeft += count;
      continue;
    }
    const before = inPlace[name];
    if (before === undefined) {
      if (count > 0) appeared.push(name);
    } else if (count > before) {
      grown.push(name);
    }
  }
  return {
    targetsLeft,
    grown,
    appeared,
    held: targetsLeft === 0 && grown.length === 0 && appeared.length === 0,
  };
}

/** Rule 135 (c), for one preset's burn ring: the ring in place and the
 *  candidate's, and whether both flashes burn. */
export function flashPresetHolds(
  inPlace: number,
  candidate: number,
  bothFlashes: boolean
): boolean {
  if (!bothFlashes) return Math.abs(candidate - inPlace) < 1e-3;
  return candidate >= inPlace - 1e-3 && candidate <= Math.SQRT2 * inPlace + 1e-3;
}

/** Rule 136 (c): the most the taper can move an output of the ocean preset. */
export const TAPER_CEILING = 1 / (1 - Math.exp(-3));

/** Rule 136 (c), for one output of the ocean preset. */
export function taperPresetHolds(inPlace: number, candidate: number): boolean {
  if (inPlace === 0) return candidate === 0;
  const ratio = candidate / inPlace;
  return ratio <= TAPER_CEILING + 1e-9 && ratio >= 1 / TAPER_CEILING - 1e-9;
}
