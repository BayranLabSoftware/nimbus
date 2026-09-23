import {
  ENTRY_ATMOSPHERE_FLOOR_M,
  ENTRY_ATMOSPHERE_STEP_M,
  ENTRY_ATMOSPHERE_TOP_M,
  type EntryAtmosphere,
} from '../validation/entryAtmosphereRules.js';
import { DRAG_COEFFICIENT, H_SCALE, PANCAKE_FACTOR, RHO_0 } from './entryConstants.js';
import { USSA_1976_PROFILE } from './ussa1976Entry.js';

/**
 * Collins, Melosh & Marcus (2005)'s atmospheric entry integrated on a profile
 * of the atmosphere, as rule 909 of validation/entryAtmosphereRules.ts writes
 * it: Eq. 7 through the column mass, Eq. 10 solved for the breakup, Eq. 15
 * written for any profile — L² = L0² + τ², τ the integral from the breakup of
 * √(C_D ρ / ρi) / sin θ, the spread of fragments moving apart at
 * v √(C_D ρ / ρi) — the burst where L reaches f_p L0 (Eq. 18's condition),
 * and Eq. 17 with its integral of ρ L² taken on the profile. On Collins's
 * exponential it is his closed forms, with Eq. 10's root where Eq. 11
 * approximates it (rule 910).
 */

/** A profile of the atmosphere: density (kg/m³) at a geometric altitude (m),
 *  continued below the ground by its lowest layer's law (rule 909(d)). */
export interface EntryProfile {
  readonly name: string;
  readonly density: (altitude: number) => number;
}

/** Collins et al.'s exponential, ρ0 e^(−z/H), its own continuation below the
 *  ground. */
export const COLLINS_EXPONENTIAL_PROFILE: EntryProfile = {
  name: 'Collins exponential',
  density: (z) => RHO_0 * Math.exp(-z / H_SCALE),
};

/** Rule 909(g): a profile tabulated on a grid from the floor to the top. */
export interface EntryTable {
  readonly profile: EntryProfile;
  readonly step: number;
  readonly floor: number;
  readonly top: number;
  readonly n: number;
  /** ρ at the nodes (kg/m³), and its logarithm. */
  readonly rho: Float64Array;
  readonly lnRho: Float64Array;
  /** The column mass above each node (kg/m²), with the tail above the top at
   *  the top layer's local scale height. */
  readonly mass: Float64Array;
  /** The integral of √ρ from each node to the top. */
  readonly root: Float64Array;
}

const TABLES = new Map<EntryProfile, Map<number, EntryTable>>();

/** Rule 909(g): the profile's table on a grid of `step` metres, built once. */
export function entryTable(profile: EntryProfile, step = ENTRY_ATMOSPHERE_STEP_M): EntryTable {
  let byStep = TABLES.get(profile);
  if (byStep === undefined) {
    byStep = new Map();
    TABLES.set(profile, byStep);
  }
  const cached = byStep.get(step);
  if (cached !== undefined) return cached;
  const floor = ENTRY_ATMOSPHERE_FLOOR_M;
  const top = ENTRY_ATMOSPHERE_TOP_M;
  const n = Math.round((top - floor) / step) + 1;
  const rho = new Float64Array(n);
  const lnRho = new Float64Array(n);
  const mass = new Float64Array(n);
  const root = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    rho[i] = profile.density(floor + i * step);
    lnRho[i] = Math.log(rho[i] ?? 0);
  }
  const last = rho[n - 1] ?? 0;
  const scale = step / ((lnRho[n - 2] ?? 0) - (lnRho[n - 1] ?? 0));
  mass[n - 1] = last * scale;
  root[n - 1] = 0;
  // Simpson's rule on each segment, the profile read at its middle (mended by
  // rule 910(e) from rule 909(g)'s trapezoid, with the reading between nodes
  // below: the verification's first run).
  for (let i = n - 2; i >= 0; i--) {
    const a = rho[i] ?? 0;
    const b = rho[i + 1] ?? 0;
    const mid = profile.density(floor + (i + 0.5) * step);
    mass[i] = (mass[i + 1] ?? 0) + (step * (a + 4 * mid + b)) / 6;
    root[i] = (root[i + 1] ?? 0) + (step * (Math.sqrt(a) + 4 * Math.sqrt(mid) + Math.sqrt(b))) / 6;
  }
  const table: EntryTable = { profile, step, floor, top, n, rho, lnRho, mass, root };
  byStep.set(step, table);
  return table;
}

/** The profile a branch of rule 908 integrates on; null for the closed forms. */
export function entryProfileOf(atmosphere: EntryAtmosphere): EntryProfile | null {
  if (atmosphere === 'integratedExponential') return COLLINS_EXPONENTIAL_PROFILE;
  if (atmosphere === 'integratedUssa') return USSA_1976_PROFILE;
  return null;
}

/**
 * A tabulated integral read between nodes: its value at the node above, and
 * the integral from the altitude up to that node by Simpson's rule (rule
 * 909(g), mended by rule 910(e): read linearly, the column mass put the speed
 * of a cloud just below its burst 4e-5 off).
 */
function readAt(
  t: EntryTable,
  values: Float64Array,
  of: (rho: number) => number,
  z: number
): number {
  const x = (z - t.floor) / t.step;
  if (x <= 0) return values[0] ?? 0;
  if (x >= t.n - 1) return values[t.n - 1] ?? 0;
  const j = Math.ceil(x);
  const zj = t.floor + j * t.step;
  const h = zj - z;
  if (!(h > 0)) return values[j] ?? 0;
  const d = t.profile.density;
  return (values[j] ?? 0) + (h / 6) * (of(d(z)) + 4 * of(d((z + zj) / 2)) + of(t.rho[j] ?? 0));
}

const identity = (rho: number): number => rho;

/** The column mass above an altitude (kg/m²). */
export function massAbove(t: EntryTable, z: number): number {
  return readAt(t, t.mass, identity, z);
}

/** The integral of √ρ from an altitude to the top. */
export function rootAbove(t: EntryTable, z: number): number {
  return readAt(t, t.root, Math.sqrt, z);
}

/** The altitude of a node. */
const nodeAltitude = (t: EntryTable, i: number): number => t.floor + i * t.step;

/** A body as rule 909 flies it. */
export interface EntryBody {
  diameter: number;
  velocity: number;
  density: number;
  sinTheta: number;
}

/** Rule 909(a): the whole body's drag coefficient on the column mass. */
const wholeDrag = (b: EntryBody): number =>
  (3 * DRAG_COEFFICIENT) / (4 * b.density * b.diameter * b.sinTheta);

/** Rule 909(a): the whole body's speed at an altitude. */
export function integratedWholeSpeed(t: EntryTable, b: EntryBody, z: number): number {
  return b.velocity * Math.exp(-wholeDrag(b) * massAbove(t, z));
}

/**
 * Rule 909(b) and (f): the highest altitude at or above the ground at which
 * the whole body's dynamic pressure ρ v² reaches `strength`; null where it
 * never does. The nodes are scanned from the top down, and the crossing
 * found between two of them by bisection.
 */
export function integratedFirstCrossing(
  t: EntryTable,
  b: EntryBody,
  strength: number
): number | null {
  const a = wholeDrag(b);
  const v2 = b.velocity * b.velocity;
  // ln ρ − 2a M ≥ ln(S / v²): no exponential in the scan.
  const bar = Math.log(strength / v2);
  const ground = Math.round(-t.floor / t.step);
  for (let i = t.n - 1; i >= ground; i--) {
    if ((t.lnRho[i] ?? 0) - 2 * a * (t.mass[i] ?? 0) < bar) continue;
    if (i === t.n - 1) return t.top;
    let high = nodeAltitude(t, i + 1);
    let low = nodeAltitude(t, i);
    const pressure = (z: number): number =>
      t.profile.density(z) * v2 * Math.exp(-2 * a * massAbove(t, z));
    for (let k = 0; k < 60; k++) {
      const mid = (low + high) / 2;
      if (pressure(mid) >= strength) low = mid;
      else high = mid;
    }
    return low;
  }
  return null;
}

/** Rule 909(c): the pancake's reach, K = √(C_D / ρi) / sin θ. */
const spreadRate = (b: EntryBody): number => Math.sqrt(DRAG_COEFFICIENT / b.density) / b.sinTheta;

/** Rule 909(e): Eq. 17's coefficient on the integral of ρ L². */
const pancakeDrag = (b: EntryBody): number =>
  (3 * DRAG_COEFFICIENT) / (4 * b.density * b.diameter ** 3 * b.sinTheta);

/** A point of the path where the pancake's integrand is read. */
interface PancakePoint {
  z: number;
  rho: number;
  root: number;
}

/**
 * Rule 909(e): the integral of ρ L² over one segment, from `a` down to `b`,
 * by Simpson's rule — the profile read at the segment's middle, and the
 * integral of √ρ carried there from `a`. (Mended by rule 910(e): the
 * trapezoid of rule 909(g) overstated the integral of this convex integrand
 * by up to 9e-5 of the speed it gives — the verification's first run.)
 */
function pancakeSegment(
  t: EntryTable,
  f: (rho: number, root: number) => number,
  a: PancakePoint,
  b: PancakePoint
): number {
  const h = a.z - b.z;
  if (!(h > 0)) return 0;
  const zm = (a.z + b.z) / 2;
  const rhoM = t.profile.density(zm);
  const rootM = a.root + ((h / 2) * (Math.sqrt(a.rho) + Math.sqrt(rhoM))) / 2;
  return (h / 6) * (f(a.rho, a.root) + 4 * f(rhoM, rootM) + f(b.rho, b.root));
}

/** The integrand of rule 909(e), ρ (L0² + τ²), for a body broken at `breakup`. */
function pancakeIntegrand(
  t: EntryTable,
  b: EntryBody,
  breakup: number
): (rho: number, root: number) => number {
  const K = spreadRate(b);
  const L0 = b.diameter;
  const rootAtBreakup = rootAbove(t, breakup);
  return (rho, root) => {
    const tau = K * (root - rootAtBreakup);
    return rho * (L0 * L0 + tau * tau);
  };
}

const pointAt = (t: EntryTable, z: number): PancakePoint => ({
  z,
  rho: t.profile.density(z),
  root: rootAbove(t, z),
});

const nodePoint = (t: EntryTable, i: number): PancakePoint => ({
  z: nodeAltitude(t, i),
  rho: t.rho[i] ?? 0,
  root: t.root[i] ?? 0,
});

/** Rule 909(e): the integral of ρ L² from `low` up to the breakup, segment by
 *  segment on the table's nodes between them. */
function pancakeIntegral(t: EntryTable, b: EntryBody, breakup: number, low: number): number {
  const f = pancakeIntegrand(t, b, breakup);
  let sum = 0;
  let prev = pointAt(t, breakup);
  for (let i = Math.ceil((breakup - t.floor) / t.step) - 1; i >= 0; i--) {
    const node = nodePoint(t, i);
    if (node.z >= breakup) continue;
    if (node.z <= low) break;
    sum += pancakeSegment(t, f, prev, node);
    prev = node;
  }
  return sum + pancakeSegment(t, f, prev, pointAt(t, low));
}

/**
 * The same integral from every altitude between `low` and the breakup: summed
 * once down the nodes, then read at an altitude as the sum to the node above
 * it and the segment from there.
 */
function pancakeIntegrals(
  t: EntryTable,
  b: EntryBody,
  breakup: number,
  low: number
): (z: number) => number {
  const f = pancakeIntegrand(t, b, breakup);
  const top = pointAt(t, breakup);
  const first = Math.ceil((breakup - t.floor) / t.step) - 1;
  const sums = new Map<number, number>();
  let sum = 0;
  let prev = top;
  for (let i = first; i >= 0; i--) {
    const node = nodePoint(t, i);
    if (node.z >= breakup) continue;
    sum += pancakeSegment(t, f, prev, node);
    sums.set(i, sum);
    prev = node;
    if (node.z <= low) break;
  }
  return (z: number): number => {
    const above = Math.ceil((z - t.floor) / t.step);
    const reached = above <= first ? sums.get(above) : undefined;
    if (reached === undefined) return pancakeSegment(t, f, top, pointAt(t, z));
    return reached + pancakeSegment(t, f, nodePoint(t, above), pointAt(t, z));
  };
}

/** Rule 909(d): the altitude at which the pancake reaches f_p L0. */
function burstAltitude(t: EntryTable, b: EntryBody, breakup: number): number {
  const target =
    rootAbove(t, breakup) +
    (b.diameter * Math.sqrt(PANCAKE_FACTOR * PANCAKE_FACTOR - 1)) / spreadRate(b);
  if (target >= (t.root[0] ?? 0)) return t.floor;
  // root falls with altitude: the last node whose root is at least the target.
  let lo = 0;
  let hi = Math.min(t.n - 1, Math.ceil((breakup - t.floor) / t.step));
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((t.root[mid] ?? 0) >= target) lo = mid;
    else hi = mid;
  }
  const a = t.root[lo] ?? 0;
  const c = t.root[lo + 1] ?? 0;
  return nodeAltitude(t, lo) + (t.step * (a - target)) / (a - c);
}

/** What rule 909 gives for one body. */
export interface IntegratedBreakup {
  /** Null where the body stays whole down to the ground. */
  breakup: number | null;
  /** The burst altitude, below the ground where the swarm lands first. */
  burst: number;
  speedAtBreakup: number;
  /** The speed at the burst, or at the ground where there is none; the
   *  whole body's at the ground where it does not break. */
  endVelocity: number;
}

/** Rule 909 (a) to (e) for one body and one strength. */
export function integratedBreakup(
  t: EntryTable,
  b: EntryBody,
  strength: number
): IntegratedBreakup {
  const breakup = integratedFirstCrossing(t, b, strength);
  if (breakup === null) {
    return {
      breakup: null,
      burst: 0,
      speedAtBreakup: integratedWholeSpeed(t, b, 0),
      endVelocity: integratedWholeSpeed(t, b, 0),
    };
  }
  const speedAtBreakup = integratedWholeSpeed(t, b, breakup);
  const burst = burstAltitude(t, b, breakup);
  const end = Math.max(burst, 0);
  const endVelocity =
    speedAtBreakup * Math.exp(-pancakeDrag(b) * pancakeIntegral(t, b, breakup, end));
  return { breakup, burst, speedAtBreakup, endVelocity };
}

/** Rule 909(f): the swarm's spread at the ground, L(0) of rule 909(c). */
export function integratedSpreadAtGround(t: EntryTable, b: EntryBody, breakup: number): number {
  const tau = spreadRate(b) * (rootAbove(t, 0) - rootAbove(t, breakup));
  return Math.sqrt(b.diameter * b.diameter + tau * tau);
}

/** A point of the path, as `entryPath` gives it. */
export interface IntegratedPathSample {
  altitude: number;
  velocity: number;
  /** The pancake's diameter, or the body's, or the cloud's (m). */
  diameter: number;
}

/**
 * Rule 909 along a path: the speed and the spread at each altitude — the
 * whole body above the breakup, the pancake down to the burst, and below it
 * the cloud held at f_p L0 and slowed by the drag on it (rule 909(e)).
 */
export function integratedPath(
  t: EntryTable,
  b: EntryBody,
  strength: number,
  altitudes: readonly number[]
): IntegratedPathSample[] {
  const breakup = integratedFirstCrossing(t, b, strength);
  const L0 = b.diameter;
  if (breakup === null) {
    return altitudes.map((z) => ({
      altitude: z,
      velocity: integratedWholeSpeed(t, b, z),
      diameter: L0,
    }));
  }
  const speedAtBreakup = integratedWholeSpeed(t, b, breakup);
  const burst = burstAltitude(t, b, breakup);
  const K = spreadRate(b);
  const k = pancakeDrag(b);
  const rootAtBreakup = rootAbove(t, breakup);
  const integral = pancakeIntegrals(t, b, breakup, Math.max(burst, 0));
  const burstSpeed = burst > 0 ? speedAtBreakup * Math.exp(-k * integral(burst)) : 0;
  const cloudDrag =
    (3 * DRAG_COEFFICIENT * PANCAKE_FACTOR ** 2) / (4 * b.density * L0 * b.sinTheta);
  return altitudes.map((z) => {
    if (z >= breakup) {
      return { altitude: z, velocity: integratedWholeSpeed(t, b, z), diameter: L0 };
    }
    if (burst <= 0 || z >= burst) {
      const tau = K * (rootAbove(t, z) - rootAtBreakup);
      return {
        altitude: z,
        velocity: speedAtBreakup * Math.exp(-k * integral(z)),
        diameter: Math.sqrt(L0 * L0 + tau * tau),
      };
    }
    return {
      altitude: z,
      velocity: burstSpeed * Math.exp(-cloudDrag * (massAbove(t, z) - massAbove(t, burst))),
      diameter: PANCAKE_FACTOR * L0,
    };
  });
}
