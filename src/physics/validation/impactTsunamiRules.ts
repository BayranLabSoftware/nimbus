/**
 * The tsunami of an impact, the last of I1's clauses the Earth Impact Effects
 * Program prints (BM-09). Class A: the program is the reference (G1).
 *
 * The rules, numbered after the hundred and forty-nine before them:
 *
 *  150. **What was looked at, and the law read off it.** The program's map
 *       draws, for an impact in water, the ranges at which the wave is 1, 10,
 *       100 and 1 000 m, and prints the crater it opens in the water to two
 *       figures. The campaign compared those ranges as a class-C quantity:
 *       0.86× on the geometric mean, scatter 1.0, with 55 of the program's
 *       rings drawn where Nimbus made no wave at all. On 16 September 2026,
 *       before this was written, the program was asked about nineteen bodies
 *       in water — a 500 m stone at 20 km/s and 45° in 100 to 8 000 m of water,
 *       and the same body varied in size (100 m to 3 km), speed (12 and 40
 *       km/s), angle (90°) and density (1 000 and 8 000 kg/m³). What they show:
 *
 *       - the wave falls exactly as 1/r: the product of level and range is the
 *         same at every level, to twelve digits;
 *       - that product is h · D_w in shallow water and 0.07 · D_w² in deep,
 *         the two meeting where h = 0.07 · D_w, with D_w =
 *         0.82581965 · (ρᵢ/ρ_w)^⅓ · L^0.78 · v^0.44 · sin^⅓ θ — the form of
 *         Collins et al.'s Eq. 21, v the speed at the water from the program's
 *         entry — fitted to 10⁻⁹ in the logarithm on the fourteen deep bodies,
 *         and D_w printed as the water crater to its two figures on all;
 *       - a ring nearer than D_w is not drawn, and a ring past a quarter of the
 *         Earth's circumference is replaced by a small placeholder.
 *
 *       With Nimbus's own entry that law gives the 53 rings the nineteen drawn
 *       within 7.9 × 10⁻⁵. It is `ImpactTsunamiLaw` `program` in
 *       events/tsunami/impactProgram.ts, not the default.
 *
 *  151. **The candidate.** An impact that reaches the water, however much of
 *       its energy it brings (the gate at half the energy goes, BM-09), makes
 *       the program's wave: the far-field rows, the veil on the globe and what
 *       is drawn from them — damping, run-up, inundation — stand on
 *       A(r) = min(0.07 D_w, h) · D_w / r, held at its value inside D_w, with
 *       no dispersion on top of a 1/r that already carries it. An inland strike
 *       keeps the project's reach to the sea and scales the wave by it.
 *
 *  152. **The held-out check.** Fourteen impacts in water nobody has asked the
 *       program about, drawn by `scripts/benchmark/impact-tsunami-bodies.ts`
 *       (seed 1 500 916: diameter log-uniform from 20 m to 5 km, density from
 *       1 000 to 8 000 kg/m³, speed from 11.2 to 72 km/s, angle from 10 to 90°,
 *       depth log-uniform from 50 to 8 000 m; kept where Nimbus's entry brings
 *       the body to the water): `IMPACT_TSUNAMI_BODIES` below. The program is
 *       asked once for each. At every level, the candidate's ring is
 *       min(0.07 D_w, h) · D_w / level on Nimbus's own entry. Where that ring
 *       lies beyond D_w and within a quarter of the circumference, the
 *       program's ring **agrees** within 1 %; where it does not lie beyond
 *       D_w, the program must draw none; a ring at or past a quarter of the
 *       circumference is counted apart. A body the program bursts in the air,
 *       or answers with an error, is counted apart.
 *
 *  153. **What decides.** Adopted when at least 10 bodies and 25 rings are
 *       compared, every one agrees, and the validation report regenerated with
 *       the candidate keeps the release gate at PASS. Otherwise refused.
 *
 * What these rules cannot settle. Whether an impact's wave falls as 1/r from
 * one crater diameter out: Wünnemann et al.'s hydrocode fits make it fall
 * faster in deep water, and no ocean has recorded one. It is what the field's
 * tool draws. And how an inland strike's wave scales with the sea's distance,
 * which the program does not compute.
 */

/** Rule 152: G1's tolerance. */
export const IMPACT_TSUNAMI_TOLERANCE = 0.01;
/** Rule 153. */
export const IMPACT_TSUNAMI_MIN_BODIES = 10;
export const IMPACT_TSUNAMI_MIN_RINGS = 25;
/** The levels the program draws (m). */
export const IMPACT_TSUNAMI_LEVELS: readonly number[] = [1, 10, 100, 1_000];

export interface ImpactTsunamiBody {
  diameterM: number;
  densityKgM3: number;
  velocityKmS: number;
  angleDeg: number;
  waterDepthM: number;
}

/** Rule 152: the fourteen bodies, as `scripts/benchmark/impact-tsunami-bodies.ts`
 *  drew them on 16 September 2026 (19 drawn, 14 kept). */
export const IMPACT_TSUNAMI_BODIES: readonly ImpactTsunamiBody[] = [
  {
    diameterM: 216.693,
    densityKgM3: 2591.5,
    velocityKmS: 42.88,
    angleDeg: 74.77,
    waterDepthM: 412.3,
  },
  {
    diameterM: 3528.53,
    densityKgM3: 1206.2,
    velocityKmS: 65.986,
    angleDeg: 72.46,
    waterDepthM: 1134.3,
  },
  {
    diameterM: 93.117,
    densityKgM3: 7233.8,
    velocityKmS: 44.339,
    angleDeg: 83.79,
    waterDepthM: 346.5,
  },
  {
    diameterM: 65.963,
    densityKgM3: 7615.1,
    velocityKmS: 13.518,
    angleDeg: 75.5,
    waterDepthM: 239.8,
  },
  {
    diameterM: 87.084,
    densityKgM3: 5088.7,
    velocityKmS: 26.724,
    angleDeg: 35.69,
    waterDepthM: 82.9,
  },
  {
    diameterM: 104.165,
    densityKgM3: 6752.5,
    velocityKmS: 16.225,
    angleDeg: 35.48,
    waterDepthM: 374.4,
  },
  {
    diameterM: 48.921,
    densityKgM3: 6274.4,
    velocityKmS: 60.116,
    angleDeg: 57.03,
    waterDepthM: 138.1,
  },
  {
    diameterM: 1056.243,
    densityKgM3: 7254.4,
    velocityKmS: 42.068,
    angleDeg: 16.16,
    waterDepthM: 304.4,
  },
  {
    diameterM: 180.607,
    densityKgM3: 4019.2,
    velocityKmS: 44.973,
    angleDeg: 44.24,
    waterDepthM: 520.7,
  },
  {
    diameterM: 99.319,
    densityKgM3: 6013.5,
    velocityKmS: 57.845,
    angleDeg: 32.05,
    waterDepthM: 2009.7,
  },
  {
    diameterM: 264.802,
    densityKgM3: 6320,
    velocityKmS: 47.672,
    angleDeg: 11.93,
    waterDepthM: 1092.6,
  },
  {
    diameterM: 758.921,
    densityKgM3: 6825.1,
    velocityKmS: 34.29,
    angleDeg: 61.89,
    waterDepthM: 4006.4,
  },
  {
    diameterM: 173.27,
    densityKgM3: 5971.1,
    velocityKmS: 71.329,
    angleDeg: 69.83,
    waterDepthM: 189.7,
  },
  {
    diameterM: 566.728,
    densityKgM3: 1740.7,
    velocityKmS: 58.753,
    angleDeg: 28.02,
    waterDepthM: 2267.3,
  },
];

const QUARTER_CIRCUMFERENCE = (Math.PI * 6_371_000) / 2;

export type RingAgreement = 'agrees' | 'departs' | 'apart';

/** Rule 152, for one level: the candidate's ring (m), the water crater it
 *  stands beyond (m), and the ring the program drew (m, 0 for none). */
export function tsunamiRingAgreement(
  modelRingM: number,
  waterCraterM: number,
  programRingM: number
): RingAgreement {
  if (modelRingM >= QUARTER_CIRCUMFERENCE) return 'apart';
  if (!(modelRingM > waterCraterM)) return programRingM === 0 ? 'agrees' : 'departs';
  return Math.abs(programRingM - modelRingM) <= IMPACT_TSUNAMI_TOLERANCE * modelRingM
    ? 'agrees'
    : 'departs';
}

export interface ImpactTsunamiVerdict {
  bodies: number;
  rings: number;
  departs: number;
  heldOutPasses: boolean;
}

/** Rule 153, the held-out part: the agreements, body by body. */
export function impactTsunamiVerdict(
  bodies: readonly (readonly RingAgreement[] | null)[]
): ImpactTsunamiVerdict {
  const answered = bodies.filter((b): b is readonly RingAgreement[] => b !== null);
  const rings = answered.flat().filter((a) => a !== 'apart');
  const departs = rings.filter((a) => a === 'departs').length;
  return {
    bodies: answered.length,
    rings: rings.length,
    departs,
    heldOutPasses:
      answered.length >= IMPACT_TSUNAMI_MIN_BODIES &&
      rings.length >= IMPACT_TSUNAMI_MIN_RINGS &&
      departs === 0,
  };
}
