import { DRAG_COEFFICIENT, GRAVITY, H_SCALE, PANCAKE_FACTOR, RHO_0 } from './entryConstants.js';
import {
  S_SECOND_PHASE_RANGE,
  S_SECOND_PHASE_SHARES,
} from '../validation/fragmentationRoundRules.js';

/**
 * The study of variant S (rules 1001 to 1026, validation/
 * fragmentationRoundRules.ts): a two-phase cascade of fragmentation, run as a
 * study of development — the product never reads it. Collins, Melosh & Marcus
 * (2005)'s equations on their exponential atmosphere, ρ(z) = ρ0 e^(−z/H):
 *
 * - until the second phase the body moves whole, Eq. 8's speed; the first
 *   phase, where its pressure reaches S1, sets only the largest piece's mass
 *   (rules 1015 and 1017);
 * - from the pressure 0.9 MPa on, the core — the unbroken part, a sphere of its
 *   current mass — is slowed by drag on its own diameter, integrated by the
 *   classical fourth-order Runge–Kutta in altitude; its cracks have strengths
 *   log-uniform on [0.9 MPa, the upper edge], a hypothesis of Nimbus (rule
 *   1016), read in N shares at the distribution's quantiles; a share breaks
 *   where the core's pressure first reaches its strength, never twice, and
 *   none after the pressure has passed its largest value (rule 1017);
 * - a broken share is a slice of the core, its mass per unit of frontal area
 *   the core's (rule 1024), closed by Collins et al.'s pancake from the core's
 *   diameter, altitude and speed there: a burst where it reaches f_p times that
 *   diameter, or a swarm on the ground (rule 1019);
 * - what never breaks reaches the ground, never below its terminal speed, the
 *   floor written in the budget as the work of the gravity the equations leave
 *   out (rule 1026).
 *
 * The ablated mass is none by the model's assumption (rule 1023 (b)).
 */

export interface StudyBody {
  /** L0 (m). */
  diameter: number;
  /** At the top of the atmosphere (m/s). */
  velocity: number;
  /** ρ_i (kg/m³). */
  density: number;
  sinTheta: number;
}

export interface StudyOptions {
  /** Rule 1015: the share of the mass the first phase takes. */
  f1: number;
  /** S1 (Pa). */
  firstStrength: number;
  /** Rule 1016: the second phase's strengths, log-uniform (Pa). */
  range?: readonly [number, number];
  /** Rule 1018: the number of shares. */
  shares?: number;
  /** The core's Runge–Kutta step in altitude (m). */
  step?: number;
  /** The spacing of a share's path as its energy is laid down (m). */
  shareStep?: number;
}

/** One broken share's end. */
export interface StudyShare {
  /** Where it broke (m) and at what speed (m/s). */
  breakAltitude: number;
  breakSpeed: number;
  mass: number;
  /** Its pancake's L0: the core's diameter where it broke (m). */
  diameter: number;
  /** The burst altitude (m), or null for a swarm on the ground. */
  burstAltitude: number | null;
  /** Its speed at the burst or at the ground (m/s). */
  endSpeed: number;
}

export interface StudyResult {
  /** The body's mass (kg). */
  mass: number;
  /** Where the whole body's pressure reached S1 (m), or null. */
  firstPhaseAltitude: number | null;
  /** The largest piece's mass after the first phase (kg). */
  firstPhaseLargest: number;
  /** Where the pressure reached the second phase's lower edge (m), or null. */
  secondPhaseAltitude: number | null;
  /** The largest pressure the core reached (Pa) and where (m). */
  maxPressure: number;
  maxPressureAltitude: number;
  shares: StudyShare[];
  /** The core's mass and speed at the ground (0 kg where it broke up). */
  core: { mass: number; groundSpeed: number; floorActed: boolean };
  /** Masses by their end (kg). */
  ends: { burst: number; swarm: number; surviving: number };
  /** The largest piece reaching the ground (rule 1019): mass and speed, or
   *  null where nothing but swarms and bursts is left. */
  largestPiece: { mass: number; speed: number } | null;
  /** Energy given to the air per kilometre of altitude (J), index = km from
   *  the ground; the last bin holds what was given above 150 km. */
  energyPerKm: number[];
  /** Momentum given to the air per kilometre (kg m/s). */
  momentumPerKm: number[];
  /** Rules 1020 and 1026. */
  budget: {
    energyIn: number;
    energyToAir: number;
    energyToGround: number;
    /** The kinetic energy the terminal floor adds: gravity's work. */
    energyFromFloor: number;
    /** (in + floor − air − ground) / in. */
    energyResidual: number;
    momentumIn: number;
    momentumToAir: number;
    momentumToGround: number;
    momentumFromFloor: number;
    momentumResidual: number;
    /** (m0 − Σ shares − core) / m0. */
    massResidual: number;
    ablatedMass: 0;
  };
}

const TOP_KM = 150;
const ALPHA = Math.sqrt(PANCAKE_FACTOR * PANCAKE_FACTOR - 1);
const density = (z: number): number => RHO_0 * Math.exp(-z / H_SCALE);
const binOf = (z: number): number => Math.min(Math.max(Math.floor(z / 1_000), 0), TOP_KM);

/** Eq. 8: the whole body's speed at an altitude. */
function wholeSpeed(body: StudyBody, z: number): number {
  const a = (3 * DRAG_COEFFICIENT * H_SCALE) / (4 * body.density * body.diameter * body.sinTheta);
  return body.velocity * Math.exp(-a * density(z));
}

/** Where the whole body's pressure first reaches a strength (m), or null:
 *  ρ v² = x v0² e^(−2ax) grows with x = ρ up to x = 1/(2a). */
function wholeCrossing(body: StudyBody, strength: number): number | null {
  const a = (3 * DRAG_COEFFICIENT * H_SCALE) / (4 * body.density * body.diameter * body.sinTheta);
  const pressure = (x: number): number => x * body.velocity * body.velocity * Math.exp(-2 * a * x);
  const top = Math.min(RHO_0, 1 / (2 * a));
  if (pressure(top) < strength) return null;
  let lo = 0;
  let hi = top;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (pressure(mid) < strength) lo = mid;
    else hi = mid;
  }
  return Math.max(-H_SCALE * Math.log(hi / RHO_0), 0);
}

/** The terminal speed of a sphere at the ground (m/s). */
function terminalSpeed(diameter: number, rhoI: number): number {
  return Math.sqrt((4 * rhoI * diameter * GRAVITY) / (3 * density(0) * DRAG_COEFFICIENT));
}

/**
 * Collins et al.'s pancake from a breakup (Eqs. 15* to 20): its burst altitude
 * (null for a swarm on the ground) and its speed at any altitude below the
 * breakup, down to the burst or the ground.
 */
export function collinsPancake(input: {
  diameter: number;
  density: number;
  sinTheta: number;
  breakupAltitude: number;
  breakupSpeed: number;
}): { burstAltitude: number | null; speedAt: (z: number) => number } {
  const { diameter: L0, density: rhoI, sinTheta, breakupAltitude: zStar, breakupSpeed } = input;
  const rhoStar = density(zStar);
  const l = L0 * sinTheta * Math.sqrt(rhoI / (DRAG_COEFFICIENT * rhoStar));
  const zBurst = zStar - 2 * H_SCALE * Math.log(1 + (l / (2 * H_SCALE)) * ALPHA);
  const k = (0.75 * DRAG_COEFFICIENT * rhoStar) / (rhoI * L0 ** 3 * sinTheta);
  const c = (2 * H_SCALE) / l;
  const speedAt = (z: number): number => {
    const w = Math.exp((zStar - z) / (2 * H_SCALE));
    const integral =
      2 *
      H_SCALE *
      L0 *
      L0 *
      ((w * w - 1) / 2 + c * c * (w ** 4 / 4 - (2 * w ** 3) / 3 + (w * w) / 2 - 1 / 12));
    return breakupSpeed * Math.exp(-k * integral);
  };
  return { burstAltitude: zBurst > 0 ? zBurst : null, speedAt };
}

/** The drag on a solid sphere, dv/dz = (3/4) C_D ρ v / (ρ_i L sin θ). */
function solidSlope(
  z: number,
  v: number,
  diameter: number,
  rhoI: number,
  sinTheta: number
): number {
  return (0.75 * DRAG_COEFFICIENT * density(z) * v) / (rhoI * diameter * sinTheta);
}

/** One Runge–Kutta step of a solid sphere from z by h (h < 0). */
export function solidStep(
  z: number,
  v: number,
  h: number,
  diameter: number,
  rhoI: number,
  sinTheta: number
): number {
  const k1 = solidSlope(z, v, diameter, rhoI, sinTheta);
  const k2 = solidSlope(z + h / 2, v + (h / 2) * k1, diameter, rhoI, sinTheta);
  const k3 = solidSlope(z + h / 2, v + (h / 2) * k2, diameter, rhoI, sinTheta);
  const k4 = solidSlope(z + h, v + h * k3, diameter, rhoI, sinTheta);
  return v + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
}

/** A solid sphere carried from z0 down to z1 at a step (the core's law). */
export function carrySolid(
  z0: number,
  v0: number,
  z1: number,
  step: number,
  diameter: number,
  rhoI: number,
  sinTheta: number
): number {
  let z = z0;
  let v = v0;
  while (z > z1) {
    const h = -Math.min(step, z - z1);
    v = solidStep(z, v, h, diameter, rhoI, sinTheta);
    z += h;
  }
  return v;
}

export function studyS(body: StudyBody, options: StudyOptions): StudyResult {
  const [lower, upper] = options.range ?? S_SECOND_PHASE_RANGE;
  const N = options.shares ?? S_SECOND_PHASE_SHARES;
  const step = options.step ?? 5;
  const shareStep = options.shareStep ?? 50;
  const { density: rhoI, sinTheta, diameter: L0, velocity: v0 } = body;
  const m0 = (Math.PI / 6) * rhoI * L0 ** 3;
  const energyPerKm = new Array<number>(TOP_KM + 1).fill(0);
  const momentumPerKm = new Array<number>(TOP_KM + 1).fill(0);
  const give = (z: number, energy: number, momentum: number): void => {
    const b = binOf(z);
    energyPerKm[b] = (energyPerKm[b] ?? 0) + energy;
    momentumPerKm[b] = (momentumPerKm[b] ?? 0) + momentum;
  };

  // The whole body, Eq. 8, from above 150 km down to the second phase or the
  // ground: its losses laid down kilometre by kilometre.
  const firstPhaseAltitude = wholeCrossing(body, options.firstStrength);
  const firstPhaseLargest = firstPhaseAltitude === null ? m0 : (1 - options.f1) * m0;
  const secondPhaseAltitude = wholeCrossing(body, lower);
  const wholeEnd = secondPhaseAltitude ?? 0;
  let vPrev = body.velocity;
  let zPrev = Number.POSITIVE_INFINITY;
  for (let km = TOP_KM; km >= 0; km--) {
    const zBottom = Math.max(km * 1_000, wholeEnd);
    if (zBottom >= zPrev) continue;
    const v = wholeSpeed(body, zBottom);
    give(
      Math.min(zPrev, (TOP_KM + 1) * 1_000) - 1,
      0.5 * m0 * (vPrev * vPrev - v * v),
      m0 * (vPrev - v)
    );
    vPrev = v;
    zPrev = zBottom;
    if (zBottom <= wholeEnd) break;
  }

  const shares: StudyShare[] = [];
  let coreMass = m0;
  let z = wholeEnd;
  let v = vPrev;
  let qMax = density(z) * v * v;
  let qMaxAltitude = z;
  let next = 0; // the next share to break, in order of strength
  const strengthOf = (k: number): number => lower * (upper / lower) ** ((k + 0.5) / N);

  if (secondPhaseAltitude !== null) {
    let passedPeak = false;
    while (z > 0 && coreMass > 0) {
      const diameter = L0 * Math.cbrt(coreMass / m0);
      const h = -Math.min(step, z);
      const vNew = solidStep(z, v, h, diameter, rhoI, sinTheta);
      const zNew = z + h;
      const q0 = density(z) * v * v;
      const q1 = density(zNew) * vNew * vNew;
      if (q1 <= qMax) passedPeak = true;
      let broken = 0;
      if (!passedPeak && q1 > qMax) {
        while (next < N && strengthOf(next) <= q1) {
          const Y = strengthOf(next);
          const t = q1 > q0 ? Math.min(Math.max((Y - q0) / (q1 - q0), 0), 1) : 1;
          const share = {
            breakAltitude: z + t * h,
            breakSpeed: v + t * (vNew - v),
            mass: m0 / N,
            diameter,
          };
          // Its losses as part of the core down to where it breaks.
          give(
            (z + share.breakAltitude) / 2,
            0.5 * share.mass * (v * v - share.breakSpeed * share.breakSpeed),
            share.mass * (v - share.breakSpeed)
          );
          const pancake = collinsPancake({
            diameter,
            density: rhoI,
            sinTheta,
            breakupAltitude: share.breakAltitude,
            breakupSpeed: share.breakSpeed,
          });
          const end = pancake.burstAltitude ?? 0;
          // Its losses along the pancake, then, at a burst, what it keeps.
          let zs = share.breakAltitude;
          let vs = share.breakSpeed;
          while (zs > end) {
            const zn = Math.max(zs - shareStep, end);
            const vn = pancake.speedAt(zn);
            give((zs + zn) / 2, 0.5 * share.mass * (vs * vs - vn * vn), share.mass * (vs - vn));
            zs = zn;
            vs = vn;
          }
          if (pancake.burstAltitude !== null)
            give(pancake.burstAltitude, 0.5 * share.mass * vs * vs, share.mass * vs);
          shares.push({ ...share, burstAltitude: pancake.burstAltitude, endSpeed: vs });
          broken += share.mass;
          next += 1;
        }
        qMax = q1;
        qMaxAltitude = zNew;
      }
      // The core's own losses over the step, on the mass it keeps.
      const kept = next === N ? 0 : Math.max(coreMass - broken, 0);
      give(z + h / 2, 0.5 * kept * (v * v - vNew * vNew), kept * (v - vNew));
      coreMass = kept;
      z = zNew;
      v = vNew;
    }
  }

  // What never broke reaches the ground, never below its terminal speed.
  const coreDiameter = L0 * Math.cbrt(coreMass / m0);
  const terminal = coreMass > 0 ? Math.min(terminalSpeed(coreDiameter, rhoI), v0) : 0;
  const floorActed = coreMass > 0 && terminal > v;
  const groundSpeed = coreMass > 0 ? Math.max(v, terminal) : 0;

  const burst = shares.filter((s) => s.burstAltitude !== null).length * (m0 / N);
  const swarmShares = shares.filter((s) => s.burstAltitude === null);
  const swarm = swarmShares.length * (m0 / N);
  const energyToAir = energyPerKm.reduce((a, b) => a + b, 0);
  const momentumToAir = momentumPerKm.reduce((a, b) => a + b, 0);
  const energyToGround =
    0.5 * coreMass * groundSpeed * groundSpeed +
    swarmShares.reduce((a, s) => a + 0.5 * s.mass * s.endSpeed * s.endSpeed, 0);
  const momentumToGround =
    coreMass * groundSpeed + swarmShares.reduce((a, s) => a + s.mass * s.endSpeed, 0);
  const energyFromFloor = floorActed ? 0.5 * coreMass * (groundSpeed * groundSpeed - v * v) : 0;
  const momentumFromFloor = floorActed ? coreMass * (groundSpeed - v) : 0;
  const energyIn = 0.5 * m0 * v0 * v0;
  const momentumIn = m0 * v0;
  const sharesMass = shares.reduce((a, s) => a + s.mass, 0);
  return {
    mass: m0,
    firstPhaseAltitude,
    firstPhaseLargest,
    secondPhaseAltitude,
    maxPressure: qMax,
    maxPressureAltitude: qMaxAltitude,
    shares,
    core: { mass: coreMass, groundSpeed, floorActed },
    ends: { burst, swarm, surviving: coreMass },
    largestPiece:
      coreMass > 0 ? { mass: Math.min(firstPhaseLargest, coreMass), speed: groundSpeed } : null,
    energyPerKm,
    momentumPerKm,
    budget: {
      energyIn,
      energyToAir,
      energyToGround,
      energyFromFloor,
      energyResidual: (energyIn + energyFromFloor - energyToAir - energyToGround) / energyIn,
      momentumIn,
      momentumToAir,
      momentumToGround,
      momentumFromFloor,
      momentumResidual:
        (momentumIn + momentumFromFloor - momentumToAir - momentumToGround) / momentumIn,
      massResidual: (m0 - sharesMass - coreMass) / m0,
      ablatedMass: 0,
    },
  };
}
