import { DRAG_COEFFICIENT, H_SCALE, PANCAKE_FACTOR, RHO_0 } from './entryConstants.js';
import {
  EQ14_STEP_M,
  EQ14_STEPS_PER_DISPERSION_LENGTH,
} from '../validation/fragmentationRoundRules.js';

/**
 * Variant P of the round on fragmentation (rules 992 to 998,
 * validation/fragmentationRoundRules.ts): the pancake's diameter after the
 * breakup as the solution of Collins, Melosh & Marcus (2005)'s Eq. 14,
 *
 *     L d²L/dz² = C_D ρ(z) / (ρ_i sin²θ),    L(z*) = L0,  dL/dz(z*) = 0,
 *
 * on the exponential atmosphere ρ(z) = ρ0 e^(−z/H), where the product reads
 * their Eq. 15*, "an analytic approximation to the full solution of this
 * equation" (p. 821). Beside L it carries Eq. 17*'s integral,
 * I(z) = ∫ from z to z* of e^((z*−z′)/H) L(z′)² dz′, so the speed is
 * v(z) = v(z*) e^(−k I(z)) as today. The classical fourth-order Runge–Kutta
 * in altitude, from z* down, a step of the smaller of 10 m (rule 993) and
 * l/200, l the dispersion length of Eq. 16* (rule 999).
 */

/** One node of the solution. */
export interface Eq14Node {
  /** Altitude (m). */
  altitude: number;
  /** The pancake's diameter (m). */
  diameter: number;
  /** Eq. 17*'s integral from the node to the breakup (m³). */
  integral: number;
}

export interface Eq14Solution {
  /** The nodes, from the breakup down to the burst or the ground: one a step
   *  apart, the last where the solution stops. */
  nodes: Eq14Node[];
  /** The step between the nodes (m). */
  step: number;
  /** Where L reaches f_p L0 (m), found inside its step by Newton's method on
   *  a partial step (rule 999); null where the swarm reaches the ground first. */
  burstAltitude: number | null;
  /** Eq. 17*'s integral at the burst, or at the ground (m³). */
  endIntegral: number;
  /** The diameter at the ground (m), where the swarm reaches it — or, with
   *  `throughBurst`, wherever the solution is carried to the ground. */
  groundDiameter: number;
}

export interface Eq14Body {
  /** The body's diameter at the breakup, L0 (m). */
  diameter: number;
  /** ρ_i (kg/m³). */
  density: number;
  sinTheta: number;
  /** The breakup altitude z* (m). */
  breakupAltitude: number;
}

/** Rules 993 and 999: the step (m) — the smaller of 10 m and l/200. */
export function eq14Step(body: Eq14Body): number {
  const zStar = Math.max(body.breakupAltitude, 0);
  const rhoStar = RHO_0 * Math.exp(-zStar / H_SCALE);
  // Eq. 16*.
  const l = body.diameter * body.sinTheta * Math.sqrt(body.density / (DRAG_COEFFICIENT * rhoStar));
  return Math.min(EQ14_STEP_M, l / EQ14_STEPS_PER_DISPERSION_LENGTH);
}

/**
 * Eq. 14 solved from the breakup. By default the solution stops where L
 * reaches f_p L0 (the burst, Eq. 18's condition) or at the ground; with
 * `throughBurst` it is carried on to the ground, as Eq. 15* gives L(0) for any
 * breakup. `step` replaces the rules' step, `stepScale` multiplies it — for
 * the verification only.
 */
export function solveEq14(
  body: Eq14Body,
  options: { step?: number; stepScale?: number; throughBurst?: boolean; to?: number } = {}
): Eq14Solution {
  const step = options.step ?? eq14Step(body) * (options.stepScale ?? 1);
  const L0 = body.diameter;
  const zStar = Math.max(body.breakupAltitude, 0);
  const a = DRAG_COEFFICIENT / (body.density * body.sinTheta * body.sinTheta);
  const limit = PANCAKE_FACTOR * L0;
  // (dL/dz, dP/dz, dI/dz) at (z, L, P), P = dL/dz.
  const slope = (z: number, L: number, P: number): [number, number, number] => [
    P,
    (a * RHO_0 * Math.exp(-z / H_SCALE)) / L,
    -Math.exp((zStar - z) / H_SCALE) * L * L,
  ];
  /** One Runge–Kutta step of length h from (z, L, P, I). */
  const advance = (
    z: number,
    L: number,
    P: number,
    I: number,
    h: number
  ): [number, number, number] => {
    const k1 = slope(z, L, P);
    const k2 = slope(z + h / 2, L + (h / 2) * k1[0], P + (h / 2) * k1[1]);
    const k3 = slope(z + h / 2, L + (h / 2) * k2[0], P + (h / 2) * k2[1]);
    const k4 = slope(z + h, L + h * k3[0], P + h * k3[1]);
    return [
      L + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
      P + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
      I + (h / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
    ];
  };
  const floor = Math.max(options.to ?? 0, 0);
  const nodes: Eq14Node[] = [{ altitude: zStar, diameter: L0, integral: 0 }];
  let z = zStar;
  let L = L0;
  let P = 0;
  let I = 0;
  let burstAltitude: number | null = null;
  let endIntegral = 0;
  while (z > floor) {
    const h = -Math.min(step, z - floor);
    const [nextL, nextP, nextI] = advance(z, L, P, I, h);
    const nextZ = z + h;
    if (burstAltitude === null && nextL >= limit) {
      // Rule 999: where L reaches f_p L0 inside the step, by Newton's method
      // on a partial step from its start.
      let t = (limit - L) / (nextL - L);
      let partial = advance(z, L, P, I, t * h);
      for (let i = 0; i < 8; i++) {
        const dLdt = partial[1] * h;
        if (!(Math.abs(dLdt) > 0)) break;
        const next = Math.min(1, Math.max(0, t + (limit - partial[0]) / dLdt));
        if (Math.abs(next - t) < 1e-13) break;
        t = next;
        partial = advance(z, L, P, I, t * h);
      }
      burstAltitude = z + t * h;
      endIntegral = partial[2];
      if (options.throughBurst !== true) {
        nodes.push({ altitude: burstAltitude, diameter: limit, integral: endIntegral });
        return { nodes, step, burstAltitude, endIntegral, groundDiameter: Number.NaN };
      }
    }
    z = nextZ;
    L = nextL;
    P = nextP;
    I = nextI;
    nodes.push({ altitude: z, diameter: L, integral: I });
  }
  return {
    nodes,
    step,
    burstAltitude,
    endIntegral: burstAltitude === null ? I : endIntegral,
    groundDiameter: L,
  };
}

/** The solution read at an altitude between its nodes, linearly. */
export function eq14At(solution: Eq14Solution, altitude: number): Eq14Node {
  const nodes = solution.nodes;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (first === undefined || last === undefined) {
    return { altitude, diameter: Number.NaN, integral: Number.NaN };
  }
  if (altitude >= first.altitude) return first;
  if (altitude <= last.altitude) return last;
  const i = Math.min(Math.floor((first.altitude - altitude) / solution.step), nodes.length - 2);
  const hi = nodes[i] ?? first;
  const lo = nodes[i + 1] ?? last;
  const t = (hi.altitude - altitude) / (hi.altitude - lo.altitude);
  return {
    altitude,
    diameter: hi.diameter + t * (lo.diameter - hi.diameter),
    integral: hi.integral + t * (lo.integral - hi.integral),
  };
}
