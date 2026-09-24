import { DRAG_COEFFICIENT, H_SCALE, PANCAKE_FACTOR, RHO_0 } from './entryConstants.js';

/**
 * Collins, Melosh & Marcus (2005)'s closed forms for a body that breaks up and
 * spreads as a pancake: the breakup (Eqs. 8, 11 and 12) and the pancake from
 * any state (Eqs. 16 to 20). `atmosphericEntry.ts` runs them for the whole
 * body; the study of F (rules 1063 to 1091 of validation/
 * fragmentationStudyFRules.ts) runs the very same functions for its clouds, so
 * that its limit f_c = 1 is the baseline by construction (rules 1081 and 1088).
 * Moved here from `atmosphericEntry.ts` expression by expression: the seal
 * checks that no number moved.
 */

/** √(f_p² − 1), the pancake factor's constant of Eqs. 18 and 19. */
export const PANCAKE_ALPHA = Math.sqrt(PANCAKE_FACTOR * PANCAKE_FACTOR - 1);

/** The exponential atmosphere, ρ(z) = ρ0 e^(−z/H). */
export function entryDensity(z: number): number {
  return RHO_0 * Math.exp(-z / H_SCALE);
}

/** A body at the top of the atmosphere. */
export interface CollinsBody {
  /** L0 (m). */
  diameter: number;
  /** v0 (m/s). */
  velocity: number;
  /** ρ_i (kg/m³). */
  density: number;
  sinTheta: number;
}

/** Eq. 8: the speed of the body, still whole, at altitude z. */
export function collinsWholeSpeed(body: CollinsBody, z: number): number {
  const { velocity: v0, density: rhoI, diameter: L0, sinTheta } = body;
  return (
    v0 * Math.exp((-3 * entryDensity(z) * DRAG_COEFFICIENT * H_SCALE) / (4 * rhoI * L0 * sinTheta))
  );
}

/** Eq. 12, the paper's: the parameter that says whether the body breaks. */
export function collinsPaperIf(body: CollinsBody, strength: number): number {
  const { velocity: v0, density: rhoI, diameter: L0, sinTheta } = body;
  return (4.07 * DRAG_COEFFICIENT * H_SCALE * strength) / (rhoI * L0 * v0 * v0 * sinTheta);
}

/** Eq. 11: the breakup altitude, for I_f < 1. */
export function collinsBreakupAltitude(strength: number, velocity: number, If: number): number {
  return Math.max(
    -H_SCALE *
      (Math.log(strength / (RHO_0 * velocity * velocity)) +
        1.308 -
        0.314 * If -
        1.303 * Math.sqrt(1 - If)),
    0
  );
}

/** Where a pancake starts: a spread of mass with the diameter of the body it
 *  comes from, at an altitude and a speed. */
export interface PancakeStart {
  /** Its diameter as it starts (m). */
  diameter: number;
  /** ρ_i (kg/m³). */
  density: number;
  sinTheta: number;
  /** z* (m). */
  altitude: number;
  /** v(z*) (m/s). */
  speed: number;
}

/** Eqs. 16 to 18 from a pancake's start: the air's density there, the
 *  dispersion length, the airburst altitude, and Eq. 17's coefficient. */
export function collinsPancakeGeometry(start: PancakeStart): {
  rhoStar: number;
  l: number;
  zBurst: number;
  k: number;
} {
  const { diameter: L0, density: rhoI, sinTheta, altitude: zStar } = start;
  const rhoStar = entryDensity(zStar);
  const l = L0 * sinTheta * Math.sqrt(rhoI / (DRAG_COEFFICIENT * rhoStar));
  const zBurst = zStar - 2 * H_SCALE * Math.log(1 + (l / (2 * H_SCALE)) * PANCAKE_ALPHA);
  const k = (0.75 * DRAG_COEFFICIENT * rhoStar) / (rhoI * L0 ** 3 * sinTheta);
  return { rhoStar, l, zBurst, k };
}

/** Eq. 19: the integral from the airburst to the breakup, plus what the
 *  program adds to it where it takes its Eq. 20 there (`extra`). */
export function collinsBurstIntegral(L0: number, l: number, extra: number): number {
  const alpha = PANCAKE_ALPHA;
  return (
    ((l * L0 * L0) / 24) *
      alpha *
      (8 * (3 + alpha * alpha) + 3 * alpha * (l / H_SCALE) * (2 + alpha * alpha)) +
    extra
  );
}

/** Eq. 20: the integral from the ground to the breakup; `withLTerm` keeps the
 *  paper's −3(l/H)², which the program drops. */
export function collinsGroundIntegral(
  L0: number,
  l: number,
  zStar: number,
  withLTerm: boolean
): number {
  const r = l / H_SCALE;
  return (
    ((H_SCALE ** 3 * L0 * L0) / (3 * l * l)) *
    (3 * (4 + r * r) * Math.exp(zStar / H_SCALE) +
      6 * Math.exp((2 * zStar) / H_SCALE) -
      16 * Math.exp((3 * zStar) / (2 * H_SCALE)) -
      (withLTerm ? 3 * r * r : 0) -
      2)
  );
}

/**
 * Eq. 17 in closed form: the pancake's speed at any altitude z below its start
 * and above its burst — the paper's Eq. 19 read at z instead of at the burst.
 * At the burst it equals `collinsBurstIntegral`'s speed to rounding; the study
 * of F lays a cloud's energy down along it, and ends it on Eq. 19's or 20's
 * own speed, so that its budget closes on the baseline's numbers.
 */
export function collinsPancakeSpeedAt(start: PancakeStart, z: number): number {
  const { l, k } = collinsPancakeGeometry(start);
  const L0 = start.diameter;
  const c = (2 * H_SCALE) / l;
  const w = Math.exp((start.altitude - z) / (2 * H_SCALE));
  const integral =
    2 *
    H_SCALE *
    L0 *
    L0 *
    ((w * w - 1) / 2 + c * c * (w ** 4 / 4 - (2 * w ** 3) / 3 + (w * w) / 2 - 1 / 12));
  return start.speed * Math.exp(-k * integral);
}
