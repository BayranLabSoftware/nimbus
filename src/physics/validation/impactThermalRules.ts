/**
 * The thermal exposure of an impact, one of I1's clauses, read against the
 * Earth Impact Effects Program. Class A: the program is the reference (G1).
 *
 * The rules, numbered after the hundred and forty-five before them:
 *
 *  146. **What was looked at, and the law read off it.** The program's /map page
 *       prints no exposure; it draws three radii for an impact that reaches the
 *       ground — the fireball, the clothing-ignition ring and the fireball's
 *       horizon. The validation grid holds them for 49 bodies, read on
 *       14 September 2026, and the campaign compared the ignition ring as a
 *       class-B quantity: 1.10× on the geometric mean, scatter 0.45, as far as
 *       3.9× for the largest impacts. Read again on 16 September 2026, before
 *       this was written, against Collins et al. 2005: the exposure at a range
 *       Δ is Φ = f · η · E / (2π Δ²), η = 3 × 10⁻³, E the energy that reaches
 *       the ground, f the share of the fireball above the horizon (Eq. 36*,
 *       with Eqs. 32* and 37*), and the ring lies where Φ = 1 MJ/m² · E_Mt^⅙.
 *       That law gives all 49 within 1 % or 200 m, whichever is larger —
 *       44 within 1 %, the other five, the smallest rings (2.7 to 8.1 km),
 *       within 114 m. The program's radii differ from the law by 9 m to 1.4 km,
 *       by no more than 114 m below 10 km, so they carry a resolution of about a
 *       hundred metres where a ring is small. The model's
 *       exposure in place — a sphere, 4π Δ², at every range — gives none within
 *       1 %, and the sphere with the half-space (2π) but without the visible
 *       fraction, 2 of 49. That law is `ImpactThermal` `program` in
 *       events/impact/damageRings.ts, not the default, with
 *       effects/impactThermal.ts.
 *
 *  147. **The candidate.** An impact's burn rings and fire rings are drawn
 *       where the program's exposure of the fireball on the ground, plus the
 *       project's flash of the energy left in the air (which the program does
 *       not compute; rule 135's sum), reaches the project's exposures (rule
 *       81). The exposures a burn or a fire needs do not change.
 *
 *  148. **The held-out check.** Sixteen bodies nobody has asked the program
 *       about, drawn by `scripts/benchmark/impact-thermal-bodies.ts` (seed
 *       1 460 916: diameter log-uniform from 20 m to 20 km, density from
 *       1 000 to 8 000 kg/m³, speed from 11.2 to 72 km/s, angle from 10 to 90°,
 *       a sedimentary or crystalline target at even odds; kept where Nimbus's
 *       entry brings the swarm to the ground, until sixteen):
 *       `IMPACT_THERMAL_BODIES` below. The program is asked once for each, at
 *       100 km. A body **agrees** when the clothing-ignition ring of
 *       `impactThermalExposure`, on Nimbus's own entry, is within 1 % or
 *       200 m, whichever is larger, of the program's. A body the program
 *       bursts in the air, or answers with an error, is counted apart.
 *
 *  149. **What decides.** Adopted when at least 12 bodies are compared, every
 *       one agrees, and the validation report regenerated with the candidate
 *       keeps the release gate at PASS. Otherwise refused. Adopted, the impact
 *       family's sweep is run in the same session under both and printed; it
 *       does not decide.
 *
 * What these rules cannot settle. That a burn needs the exposure the project
 * chose (rule 81) rather than the one the program scales with the energy: the
 * program's ring is clothing, and a burn ring is not drawn by it. And whether
 * the program is right to dim the flash by the fireball's visible share and
 * not by the atmosphere between: that is what the field's tool computes.
 */

/*
 * ===========================================================================
 * The outcome, written after the run of 16 September 2026: ADOPTED
 * ===========================================================================
 *
 * The rules were pushed in `6bcd10f` and the program asked afterwards
 * (`benchmark/results/impact-thermal-eiep-2026-09-16.json`, scored in
 * `impact-thermal-against-eiep-2026-09-16.json`). It answered all sixteen, on
 * the ground. **Every ring agrees**, from 12.1 to 2 425 km, and every one
 * within 1 % as well as within 200 m: the worst ×1.0065, 131 m on a ring of
 * 20 km. The release gate stays PASS.
 *
 * What moves. An impact that reaches the ground burns and lights fires
 * farther where its flash is far from the horizon — Meteor Crater's
 * third-degree ring 5.46 to 7.13 km, its ignition ring 4.88 to 6.38 km — and
 * less far where the horizon dims it: Boltysh's third-degree burns from
 * 523 km, the horizon, to 462 km, Popigai's from 1 186 to 1 170 km. Airbursts do
 * not move: with nothing at the ground the two laws are one flash, and the
 * project's closed form is kept to the bit. Three tests changed with it: the
 * default's name, and B-028 and B-038, which held the largest impacts' rings to
 * the horizon itself; the flash now fades out just short of it and still
 * never passes it.
 *
 * The sweep, in the same session (`invariants-2026-09-16-10.json` under the
 * sphere, `-11` under the program's law): 425 and 426. The one more is a
 * second-degree ring at the passage from a complete to a partial airburst, 138
 * to 137 km: the fireball the ground gets is dimmed by its own horizon, the
 * flash left in the air — the project's, which the program does not draw — is
 * not, and where the first takes over from the second the ring steps back by
 * 0.85 %. Declared; it does not decide.
 *
 * `DEFAULT_IMPACT_THERMAL` is `program`. I1's thermal clause holds.
 */

/** Rule 148: G1's tolerance, and the resolution of the program's radii (m). */
export const IMPACT_THERMAL_TOLERANCE = 0.01;
export const IMPACT_THERMAL_RESOLUTION_M = 200;
/** Rule 149. */
export const IMPACT_THERMAL_MIN_BODIES = 12;

export interface ImpactThermalBody {
  diameterM: number;
  densityKgM3: number;
  velocityKmS: number;
  angleDeg: number;
  target: 'sedimentary' | 'crystalline';
}

/** Rule 148: the sixteen bodies, as `scripts/benchmark/impact-thermal-bodies.ts`
 *  drew them on 16 September 2026 (23 drawn, 16 kept). */
export const IMPACT_THERMAL_BODIES: readonly ImpactThermalBody[] = [
  {
    diameterM: 4218.102,
    densityKgM3: 1192,
    velocityKmS: 70.541,
    angleDeg: 10.81,
    target: 'crystalline',
  },
  {
    diameterM: 12182.528,
    densityKgM3: 6663.4,
    velocityKmS: 70.586,
    angleDeg: 18.38,
    target: 'sedimentary',
  },
  {
    diameterM: 901.236,
    densityKgM3: 2541.5,
    velocityKmS: 55.909,
    angleDeg: 11.06,
    target: 'sedimentary',
  },
  {
    diameterM: 218.586,
    densityKgM3: 5091.4,
    velocityKmS: 31.865,
    angleDeg: 39.32,
    target: 'crystalline',
  },
  {
    diameterM: 6108.262,
    densityKgM3: 1970.3,
    velocityKmS: 54.374,
    angleDeg: 22.53,
    target: 'sedimentary',
  },
  {
    diameterM: 103.249,
    densityKgM3: 6949.5,
    velocityKmS: 38.419,
    angleDeg: 64,
    target: 'crystalline',
  },
  {
    diameterM: 10186.949,
    densityKgM3: 1170.7,
    velocityKmS: 42.426,
    angleDeg: 50.21,
    target: 'crystalline',
  },
  {
    diameterM: 106.151,
    densityKgM3: 2253.1,
    velocityKmS: 57.173,
    angleDeg: 79.88,
    target: 'crystalline',
  },
  {
    diameterM: 664.994,
    densityKgM3: 4960.6,
    velocityKmS: 36.789,
    angleDeg: 84.34,
    target: 'sedimentary',
  },
  {
    diameterM: 2780.936,
    densityKgM3: 5076.4,
    velocityKmS: 70.035,
    angleDeg: 43.5,
    target: 'sedimentary',
  },
  {
    diameterM: 242.975,
    densityKgM3: 2645.4,
    velocityKmS: 64.096,
    angleDeg: 65.97,
    target: 'sedimentary',
  },
  {
    diameterM: 3176.663,
    densityKgM3: 6407.7,
    velocityKmS: 52.436,
    angleDeg: 64.14,
    target: 'sedimentary',
  },
  {
    diameterM: 589.177,
    densityKgM3: 2506.3,
    velocityKmS: 35.691,
    angleDeg: 54.03,
    target: 'crystalline',
  },
  {
    diameterM: 982.415,
    densityKgM3: 6124.1,
    velocityKmS: 14.727,
    angleDeg: 62.96,
    target: 'crystalline',
  },
  {
    diameterM: 178.157,
    densityKgM3: 6419.5,
    velocityKmS: 12.958,
    angleDeg: 63.85,
    target: 'crystalline',
  },
  {
    diameterM: 677.686,
    densityKgM3: 1162.4,
    velocityKmS: 45.365,
    angleDeg: 28.32,
    target: 'sedimentary',
  },
];

/** Rule 148, for one ring. */
export function impactThermalAgrees(programM: number, modelM: number): boolean {
  return (
    Math.abs(modelM - programM) <=
    Math.max(IMPACT_THERMAL_TOLERANCE * programM, IMPACT_THERMAL_RESOLUTION_M)
  );
}

export interface ImpactThermalVerdict {
  compared: number;
  agree: number;
  apart: number;
  /** Rule 149, before the release gate is read. */
  heldOutPasses: boolean;
}

/** Rule 149, the held-out part: one entry per body, null where it is apart. */
export function impactThermalVerdict(
  agreements: readonly (boolean | null)[]
): ImpactThermalVerdict {
  const compared = agreements.filter((a): a is boolean => a !== null);
  const agree = compared.filter((a) => a).length;
  return {
    compared: compared.length,
    agree,
    apart: agreements.length - compared.length,
    heldOutPasses: compared.length >= IMPACT_THERMAL_MIN_BODIES && agree === compared.length,
  };
}
