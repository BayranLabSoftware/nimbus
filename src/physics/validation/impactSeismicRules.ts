/**
 * The seismic magnitude of an impact, the last of I1's clauses. Class A: the
 * Earth Impact Effects Program is the reference (G1).
 *
 * The rules, numbered after the hundred and fifty-three before them:
 *
 *  154. **What was looked at, and the law read off it.** The program's map
 *       prints no magnitude. It draws, for an impact, the ranges at which the
 *       shaking reaches Mercalli III, V, VII, IX and XII. The validation grid
 *       holds those rings for 70 bodies, 24 of them airbursts, read on
 *       14 September 2026; on 16 September 2026, before this was written, the
 *       program was asked about 24 more, a stone at 20 km/s and 45° sized to put
 *       a ring where one of Collins et al. 2005's equations hands over to the
 *       next (`benchmark/results/impact-seismic-looked-at-2026-09-16.json`).
 *       What they show:
 *
 *       - the rings lie where M − A(r) is 3, 4, 6, 7 and 9, with
 *         M = 0.67 log₁₀ E − 5.87 (Eq. 40*) and A(r) Eqs. 41* to 43*, with
 *         1/42 and 1/208 where the paper prints 0.0238 and 0.0048, the Δ of
 *         Eq. 43* in radians, and each equation in force out to where it meets
 *         the next, 61.28 and 772.39 km, so that the effective magnitude is
 *         continuous. The map's radii are Δ, in radians;
 *       - E is the kinetic energy at the ground for a body or swarm that
 *         reaches it, as Nimbus reads it already, and for an airburst the
 *         kinetic energy the body keeps at its burst altitude, where Nimbus
 *         reads none;
 *       - that speed is not Eq. 19's: it is the program's Eq. 20 between the
 *         burst and the breakup, without the −3(l/H)² it lacks at the ground
 *         (rules 141 to 145), which is Eq. 19's integral plus H·L₀²;
 *       - a ring past a quarter of the Earth's circumference is replaced by a
 *         placeholder.
 *
 *       On Nimbus's entry that law puts the 310 rings the 94 bodies draw within
 *       1.1 × 10⁻⁵ in magnitude; with Eq. 19's burst speed the airbursts' are
 *       within 0.0053, and a ring 1.2 % off. It is `ImpactSeismicSource`
 *       `program` in events/impact/seismic.ts with `BurstSpeed` `program` in
 *       effects/atmosphericEntry.ts, neither the default.
 *
 *  155. **The candidate.** An impact's magnitude is read, as the program reads
 *       it, from the kinetic energy it brings to the ground or, for an
 *       airburst, the kinetic energy it keeps at its burst altitude; and the
 *       speed an airburst keeps there is the program's, wherever the program's
 *       entry is in place (rule 145). The seismic efficiency range, the
 *       liquefaction ring and everything else drawn from the magnitude follow.
 *
 *  156. **The held-out check.** Sixteen impacts nobody has asked the program
 *       about, drawn by `scripts/benchmark/impact-seismic-bodies.ts` (seed
 *       1 540 916: diameter log-uniform from 10 m to 10 km, density from 1 000
 *       to 8 000 kg/m³, speed from 11.2 to 72 km/s, angle from 10 to 90°, a
 *       sedimentary or crystalline target at even odds; the first eight the
 *       candidate bursts in the air and the first eight it brings to the
 *       ground, each of magnitude at least 3.2): `IMPACT_SEISMIC_BODIES` below.
 *       The program is asked once for each, at 100 km. At every level, the
 *       program's ring is read back to a magnitude through A(r), and the level
 *       **agrees** when that magnitude is within 0.01 of the candidate's — a
 *       third of 1 % of the smallest magnitude a ring is drawn at; where the
 *       program draws none, the candidate's magnitude may pass the level by
 *       0.01 at most. A level whose ring, on the candidate's magnitude, lies at
 *       or past a quarter of the circumference is counted apart, and so is a
 *       body the program answers with an error.
 *
 *  157. **What decides.** Adopted when at least 12 bodies and 30 rings are
 *       compared, every level agrees, and the validation report regenerated
 *       with the candidate keeps the release gate at PASS. Otherwise refused.
 *       Adopted, the impact family's sweep is run in the same session under
 *       both and printed; it does not decide.
 *
 * What these rules cannot settle. Whether an airburst shakes the ground as a
 * body that strikes it with the energy it kept would: the program says so, and
 * Collins et al. report no seismic effects for airbursts. Tunguska's shaking
 * reached seismographs; nothing here compares against a record. And a
 * magnitude read from 10⁻⁴ of the energy, which is Collins et al.'s choice and
 * the program's.
 */

/*
 * ===========================================================================
 * The outcome, written after the run of 16 September 2026: ADOPTED
 * ===========================================================================
 *
 * The rules were pushed in `dc0c09d` and the program asked afterwards
 * (`benchmark/results/impact-seismic-eiep-2026-09-16.json`, scored in
 * `impact-seismic-against-eiep-2026-09-16.json`). It answered all sixteen, and
 * burst in the air the same eight the candidate bursts. **Every level
 * agrees**: 45 rings, from 3.6 to 4 129 km, each read back within 9.1 × 10⁻⁷
 * of the candidate's magnitude, and 35 levels where neither draws one. The
 * release gate stays PASS.
 *
 * What moves. An airburst shakes: Tunguska at magnitude 4.70 (4.03 to 5.37
 * across the seismic efficiency), Chelyabinsk at 4.24, Sikhote-Alin at 2.08 —
 * whose entry is the paper's (rule 145), so its speed does not move — where
 * each had none. An airburst keeps a little less speed at its burst altitude:
 * Chelyabinsk 13.638 to 13.594 km/s, its blast 0.298 to 0.296 Mt, Tunguska's
 * rings by 0.01 %; and the report's airburst overpressures against the program,
 * which the blast takes from that speed, go from 0.999–1.003× to 1.000×.
 * Nothing that reaches the ground moves. Two tests changed
 * with it: the default's name, and B-011, which held an airburst's magnitude
 * at zero.
 *
 * The sweep, in the same session (`invariants-2026-09-16-16.json` under the
 * project's source and Eq. 19, `-17` under the program's): 426 and 464. The 38
 * more are an airburst's magnitude falling, by a few ten-thousandths, when the
 * body grows by 1 %: it bursts lower and keeps less of its energy. Asked on
 * the first of them, the program's own rings fall the same way, 5.51187 to
 * 5.51167 (`impact-seismic-monotone-eiep-2026-09-16.json`). Among the blast
 * rings, which the burst speed moves, one more shrinks and one fewer jumps.
 * Declared; it does not decide.
 *
 * `DEFAULT_IMPACT_SEISMIC_SOURCE` and `DEFAULT_BURST_SPEED` are `program`.
 * I1's last clause holds, and I1 is met.
 */

import { atmosphericEntry, type BurstSpeed } from '../effects/atmosphericEntry.js';
import {
  impactSeismicEnergy,
  PROGRAM_SHAKING_LEVELS,
  programSeismicAttenuation,
  programShakingRadiusKm,
  seismicMagnitude,
} from '../events/impact/seismic.js';
import { deg, degreesToRadians, J, kgPerM3, m, mps } from '../units.js';

/** Rule 156: the tolerance, in magnitude. */
export const IMPACT_SEISMIC_TOLERANCE = 0.01;
/** Rule 157. */
export const IMPACT_SEISMIC_MIN_BODIES = 12;
export const IMPACT_SEISMIC_MIN_RINGS = 30;

/** The program's map radii are angles in radians; its page multiplies them by
 *  this many metres to draw them, and scripts/eiep-reference.py does too. */
export const EIEP_MAP_RADIUS_M = 1.274e7 * 0.5;
const PROGRAM_EARTH_RADIUS_KM = 6_371;
const QUARTER_CIRCUMFERENCE_KM = (Math.PI * PROGRAM_EARTH_RADIUS_KM) / 2;

export interface ImpactSeismicBody {
  diameterM: number;
  densityKgM3: number;
  velocityKmS: number;
  angleDeg: number;
  target: 'sedimentary' | 'crystalline';
}

/** Rule 156: the sixteen bodies, as `scripts/benchmark/impact-seismic-bodies.ts`
 *  drew them on 16 September 2026 (32 drawn, 16 kept): eight airbursts, then
 *  eight that reach the ground. */
export const IMPACT_SEISMIC_BODIES: readonly ImpactSeismicBody[] = [
  {
    diameterM: 18.77,
    densityKgM3: 5510.1,
    velocityKmS: 25.298,
    angleDeg: 22.65,
    target: 'sedimentary',
  },
  {
    diameterM: 30.946,
    densityKgM3: 4677.8,
    velocityKmS: 34.286,
    angleDeg: 81.43,
    target: 'crystalline',
  },
  {
    diameterM: 50.461,
    densityKgM3: 4871.2,
    velocityKmS: 30.85,
    angleDeg: 57.55,
    target: 'sedimentary',
  },
  {
    diameterM: 12.514,
    densityKgM3: 5713.1,
    velocityKmS: 51.409,
    angleDeg: 42.01,
    target: 'sedimentary',
  },
  {
    diameterM: 16.176,
    densityKgM3: 7475.4,
    velocityKmS: 60.339,
    angleDeg: 83.8,
    target: 'crystalline',
  },
  {
    diameterM: 60.142,
    densityKgM3: 4578.9,
    velocityKmS: 13.764,
    angleDeg: 25.51,
    target: 'sedimentary',
  },
  {
    diameterM: 28.968,
    densityKgM3: 4930.7,
    velocityKmS: 59.231,
    angleDeg: 36.11,
    target: 'crystalline',
  },
  {
    diameterM: 12.203,
    densityKgM3: 1975.3,
    velocityKmS: 37.446,
    angleDeg: 43.39,
    target: 'crystalline',
  },
  {
    diameterM: 1014.879,
    densityKgM3: 3003.1,
    velocityKmS: 52.924,
    angleDeg: 43.46,
    target: 'sedimentary',
  },
  {
    diameterM: 1821.964,
    densityKgM3: 7133.4,
    velocityKmS: 17.46,
    angleDeg: 69.12,
    target: 'crystalline',
  },
  {
    diameterM: 143.235,
    densityKgM3: 1993.8,
    velocityKmS: 22.09,
    angleDeg: 38.09,
    target: 'sedimentary',
  },
  {
    diameterM: 1079.297,
    densityKgM3: 5800.4,
    velocityKmS: 45.026,
    angleDeg: 69.12,
    target: 'sedimentary',
  },
  {
    diameterM: 2353.622,
    densityKgM3: 1365.5,
    velocityKmS: 67.444,
    angleDeg: 81.35,
    target: 'crystalline',
  },
  {
    diameterM: 90.443,
    densityKgM3: 3167,
    velocityKmS: 31.413,
    angleDeg: 78.34,
    target: 'sedimentary',
  },
  {
    diameterM: 1723.887,
    densityKgM3: 6643.6,
    velocityKmS: 38.261,
    angleDeg: 57.61,
    target: 'sedimentary',
  },
  {
    diameterM: 1117.875,
    densityKgM3: 4323.1,
    velocityKmS: 63.362,
    angleDeg: 65.1,
    target: 'crystalline',
  },
];

/** Rule 155: the candidate's magnitude for a body, on Nimbus's entry with the
 *  program's equations (`burstSpeed` 'paper' reads the airburst's speed off
 *  Eq. 19 instead), and whether the candidate bursts it in the air. */
export function candidateSeismicMagnitude(
  body: Pick<ImpactSeismicBody, 'diameterM' | 'densityKgM3' | 'velocityKmS' | 'angleDeg'>,
  burstSpeed: BurstSpeed = 'program'
): { magnitude: number; airburst: boolean } {
  const v0 = body.velocityKmS * 1_000;
  const ke = 0.5 * body.densityKgM3 * (Math.PI / 6) * body.diameterM ** 3 * v0 * v0;
  const entry = atmosphericEntry(
    m(body.diameterM),
    mps(v0),
    undefined,
    kgPerM3(body.densityKgM3),
    J(ke),
    degreesToRadians(deg(body.angleDeg)),
    'program',
    burstSpeed
  );
  const airburst = entry.regime === 'COMPLETE_AIRBURST';
  const energy = impactSeismicEnergy(
    {
      kineticEnergy: J(ke),
      energyFractionToGround: entry.energyFractionToGround,
      airburst,
      entryVelocity: v0,
      endVelocity: entry.endVelocity,
    },
    'program'
  );
  return { magnitude: seismicMagnitude(energy), airburst };
}

export type SeismicLevelAgreement = 'agrees' | 'departs' | 'apart' | 'neither';

/** Rule 156, for one level: the candidate's magnitude, the effective magnitude
 *  the level is drawn at, and the ring the program drew (m on its map, 0 for
 *  none). 'neither' is a level neither draws, which agrees and is not a ring. */
export function seismicLevelAgreement(
  candidateMagnitude: number,
  levelMagnitude: number,
  programRingM: number
): SeismicLevelAgreement {
  if (programShakingRadiusKm(candidateMagnitude, levelMagnitude) >= QUARTER_CIRCUMFERENCE_KM) {
    return 'apart';
  }
  if (programRingM === 0) {
    if (candidateMagnitude - levelMagnitude <= 0) return 'neither';
    return candidateMagnitude - levelMagnitude <= IMPACT_SEISMIC_TOLERANCE ? 'agrees' : 'departs';
  }
  const programKm = (programRingM / EIEP_MAP_RADIUS_M) * PROGRAM_EARTH_RADIUS_KM;
  const programMagnitude = levelMagnitude + programSeismicAttenuation(programKm);
  return Math.abs(programMagnitude - candidateMagnitude) <= IMPACT_SEISMIC_TOLERANCE
    ? 'agrees'
    : 'departs';
}

/** Rule 156, for one body: the program's rings in its order (III, V, VII, IX, XII). */
export function seismicBodyAgreements(
  candidateMagnitude: number,
  programRingsM: readonly number[]
): SeismicLevelAgreement[] {
  return PROGRAM_SHAKING_LEVELS.map((level, i) =>
    seismicLevelAgreement(candidateMagnitude, level.magnitude, programRingsM[i] ?? 0)
  );
}

export interface ImpactSeismicVerdict {
  bodies: number;
  rings: number;
  departs: number;
  heldOutPasses: boolean;
}

/** Rule 157, the held-out part: the agreements, body by body, null for a body
 *  counted apart. */
export function impactSeismicVerdict(
  bodies: readonly (readonly SeismicLevelAgreement[] | null)[]
): ImpactSeismicVerdict {
  const answered = bodies.filter((b): b is readonly SeismicLevelAgreement[] => b !== null);
  const levels = answered.flat();
  const rings = levels.filter((a) => a === 'agrees' || a === 'departs').length;
  const departs = levels.filter((a) => a === 'departs').length;
  return {
    bodies: answered.length,
    rings,
    departs,
    heldOutPasses:
      answered.length >= IMPACT_SEISMIC_MIN_BODIES &&
      rings >= IMPACT_SEISMIC_MIN_RINGS &&
      departs === 0,
  };
}
