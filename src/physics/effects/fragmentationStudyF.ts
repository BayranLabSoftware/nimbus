import { DRAG_COEFFICIENT, GRAVITY, H_SCALE, RHO_0 } from './entryConstants.js';
import {
  collinsBreakupAltitude,
  collinsBurstIntegral,
  collinsGroundIntegral,
  collinsPancakeGeometry,
  collinsPancakeSpeedAt,
  collinsPaperIf,
  collinsWholeSpeed,
  entryDensity,
  type CollinsBody,
  type PancakeStart,
} from './collinsClosedForms.js';
import {
  F_MASS_FLOOR_KG,
  F_MAX_COMPONENTS,
  F_PROFILE_BIN_M,
  F_STRENGTH_CEILING_PA,
} from '../validation/fragmentationStudyFRules.js';

/**
 * The study of F (rules 1063 to 1091, validation/fragmentationStudyFRules.ts):
 * fragments that slow and break by their own size, and clouds of debris — a
 * study of development that the product never reads. On Collins, Melosh &
 * Marcus (2005)'s exponential atmosphere and closed forms:
 *
 * - the whole body moves by Eq. 8 down to the breakup the baseline finds,
 *   Eq. 11 at the main strength S2 — the very functions the baseline runs
 *   (`collinsClosedForms.ts`, rule 1088);
 * - there, and wherever a fragment's pressure ρv² reaches its strength, a
 *   parent breaks into two fragments, y and 1 − y of the mass that is not a
 *   cloud, and one cloud of the share f_c (rule 1079); a child's strength is
 *   S_p (m_p/m_c)^α, never above 330 MPa; a child already past it breaks at
 *   once, at the same altitude, breadth-first (rule 1087 (a));
 * - a fragment flies on its own diameter by Eq. 8 started from its birth — its
 *   drag equation's exact solution, since without ablation its diameter never
 *   changes (rule 1091 (a)) — and reaches the ground never below its terminal
 *   speed, the floor's work written as gravity's (rules 1026 and 1090);
 * - a cloud is closed by the baseline's pancake started from its state, a
 *   burst or a swarm on the ground, ending on Eq. 19's or Eq. 20's speed;
 * - a piece under the floor leaves the flight at once: its mass to the dust's
 *   account, its energy and momentum given to the air apart from drag's
 *   (rule 1085);
 * - past 10⁵ components, counted at every creation, the draw stops and is
 *   declared not completed (rules 1083, 1087 (b) and 1090 (c)).
 *
 * The ablated mass is none by the model's assumption (rule 1023 (b)).
 */

export interface StudyFPriors {
  /** f_c, the cloud's share of a parent's mass at each break. */
  cloudShare: number;
  /** y, the larger fragment's share of the mass that is not a cloud. */
  largerSplit: number;
  /** α, the strength's scaling exponent. */
  strengthScaling: number;
}

export interface StudyFOptions {
  /** The profile's bin (m), rule 1091 (b). */
  binM?: number;
  /** The lightest fragment followed (kg), rule 1065 (d). */
  floorKg?: number;
  /** The bound on the components, rule 1083. */
  maxComponents?: number;
}

/** A piece that reaches the ground, at the instant before contact. */
export interface StudyFPiece {
  mass: number;
  speed: number;
  /** True where the terminal floor raised its speed. */
  floorActed: boolean;
}

export interface StudyFResult {
  /** False where the bound was passed: the draw enters no comparison. */
  completed: boolean;
  /** Every fragment and cloud created. */
  components: number;
  /** m0 (kg). */
  mass: number;
  /** Where the whole body broke (m), or null where it never did. */
  breakupAltitude: number | null;
  /** The first break's cloud: its burst altitude (null for a swarm) and its
   *  speed at the end — with f_c = 1, the baseline's own pancake. */
  primaryCloud: { burstAltitude: number | null; endSpeed: number } | null;
  /** Rule 1091 (c). */
  regime: 'INTACT' | 'COMPLETE_AIRBURST' | 'PARTIAL_AIRBURST';
  releaseAltitude: number | null;
  energyFractionToGround: number;
  pieces: StudyFPiece[];
  largestPiece: StudyFPiece | null;
  survivingMass: number;
  swarm: { mass: number; energy: number };
  clouds: { count: number; burstMass: number; swarmMass: number };
  dust: { mass: number; perBin: number[] };
  /** Energy and momentum given to the air per bin (J, kg m/s), index = bin
   *  from the ground; the last bin holds all above 150 km. */
  energyPerBin: number[];
  momentumPerBin: number[];
  budget: StudyFBudget;
}

/** Rules 1078 and 1086, with every term apart. */
export interface StudyFBudget {
  massResidual: number;
  energyIn: number;
  energyDrag: number;
  energyDust: number;
  energyGround: number;
  energyFloor: number;
  /** ((E0 + W_g) − (E_drag + E_dust + E_ground)) / (E0 + |W_g|). */
  energyResidual: number;
  /** |p0 + J_g − J_drag − J_dust − p_ground| / |p0|, the vector's norm. */
  momentumResidual: number;
  /** The same test on the projection on the path: equal to the vector's by
   *  these equations, checked (rule 1090 (b)). */
  momentumProjectionResidual: number;
}

/** The top of the profile: losses above it go to its last bin, as S laid them. */
export const STUDY_F_TOP_M = 150_000;
const TOP_M = STUDY_F_TOP_M;

/** Neumaier's compensated sum, so that thousands of terms close to 10⁻¹². */
class Sum {
  private s = 0;
  private c = 0;
  add(x: number): void {
    const t = this.s + x;
    this.c += Math.abs(this.s) >= Math.abs(x) ? this.s - t + x : x - t + this.s;
    this.s = t;
  }
  get value(): number {
    return this.s + this.c;
  }
}

/** Rule 1090 (b): a momentum kept as a vector in the entry's vertical plane,
 *  each impulse written by its components along the direction it acts on. */
class Vector {
  readonly x = new Sum();
  readonly z = new Sum();
  constructor(
    private readonly ux: number,
    private readonly uz: number
  ) {}
  /** An impulse of size p along the direction (ux, uz). */
  add(p: number): void {
    this.x.add(p * this.ux);
    this.z.add(p * this.uz);
  }
}

interface Fragment {
  mass: number;
  strength: number;
  z: number;
  v: number;
}

/** Aborts a draw that passes the bound. */
class Bound extends Error {}

export function studyF(
  body: CollinsBody,
  mainStrength: number,
  priors: StudyFPriors,
  options: StudyFOptions = {}
): StudyFResult {
  const binM = options.binM ?? F_PROFILE_BIN_M;
  const floor = options.floorKg ?? F_MASS_FLOOR_KG;
  const cap = options.maxComponents ?? F_MAX_COMPONENTS;
  const { density: rhoI, sinTheta, diameter: L0, velocity: v0 } = body;
  const cosTheta = Math.sqrt(Math.max(1 - sinTheta * sinTheta, 0));
  const { cloudShare: fc, largerSplit: y, strengthScaling: alpha } = priors;
  const m0 = (Math.PI / 6) * rhoI * L0 ** 3;
  const nBins = Math.ceil(TOP_M / binM) + 1;
  const binOf = (z: number): number => Math.min(Math.max(Math.floor(z / binM), 0), nBins - 1);
  const energyPerBin = new Array<number>(nBins).fill(0);
  const momentumPerBin = new Array<number>(nBins).fill(0);
  const dustPerBin = new Array<number>(nBins).fill(0);
  const eDrag = new Sum();
  const eDust = new Sum();
  const eGround = new Sum();
  const eFloor = new Sum();
  // Every path keeps the entry's line (rule 1090 (b)): u = (cos θ, −sin θ).
  const pDrag = new Vector(cosTheta, -sinTheta);
  const pDust = new Vector(cosTheta, -sinTheta);
  const pGround = new Vector(cosTheta, -sinTheta);
  const pFloor = new Vector(cosTheta, -sinTheta);
  const massGround = new Sum();
  const massDust = new Sum();
  const massBurst = new Sum();
  const massSwarm = new Sum();
  const pieces: StudyFPiece[] = [];
  let components = 0;
  let cloudCount = 0;
  let swarmEnergy = 0;

  const diameterOf = (mass: number): number => L0 * Math.cbrt(mass / m0);
  const terminalOf = (diameter: number): number =>
    Math.sqrt((4 * rhoI * diameter * GRAVITY) / (3 * entryDensity(0) * DRAG_COEFFICIENT));

  /** Drag's losses of a mass carried from zTop down to zBottom on a speed
   *  law, laid down bin by bin; `last` overrides the speed at zBottom. */
  const lay = (
    mass: number,
    zTop: number,
    zBottom: number,
    speedAt: (z: number) => number,
    last?: number
  ): void => {
    let zA = zTop;
    let vA = speedAt(zTop);
    while (zA > zBottom) {
      const edge = Math.ceil(zA / binM) * binM - binM;
      const zB = Math.max(edge < zA ? edge : zA - binM, zBottom);
      const vB = zB === zBottom && last !== undefined ? last : speedAt(zB);
      const b = binOf((zA + zB) / 2);
      const e = 0.5 * mass * (vA * vA - vB * vB);
      const p = mass * (vA - vB);
      energyPerBin[b] = (energyPerBin[b] ?? 0) + e;
      momentumPerBin[b] = (momentumPerBin[b] ?? 0) + p;
      eDrag.add(e);
      pDrag.add(p);
      zA = zB;
      vA = vB;
    }
  };

  const count = (): void => {
    components += 1;
    if (components > cap) throw new Bound();
  };

  const dust = (mass: number, z: number, v: number): void => {
    const b = binOf(z);
    const e = 0.5 * mass * v * v;
    energyPerBin[b] = (energyPerBin[b] ?? 0) + e;
    momentumPerBin[b] = (momentumPerBin[b] ?? 0) + mass * v;
    dustPerBin[b] = (dustPerBin[b] ?? 0) + mass;
    eDust.add(e);
    pDust.add(mass * v);
    massDust.add(mass);
  };

  const cloud = (mass: number, z: number, v: number): { burst: number | null; end: number } => {
    cloudCount += 1;
    const start: PancakeStart = {
      diameter: diameterOf(mass),
      density: rhoI,
      sinTheta,
      altitude: z,
      speed: v,
    };
    const { l, zBurst, k } = collinsPancakeGeometry(start);
    const speedAt = (zz: number): number => (zz >= z ? v : collinsPancakeSpeedAt(start, zz));
    if (zBurst > 0) {
      const end = v * Math.exp(-k * collinsBurstIntegral(start.diameter, l, 0));
      lay(mass, z, zBurst, speedAt, end);
      const b = binOf(zBurst);
      const e = 0.5 * mass * end * end;
      energyPerBin[b] = (energyPerBin[b] ?? 0) + e;
      momentumPerBin[b] = (momentumPerBin[b] ?? 0) + mass * end;
      eDrag.add(e);
      pDrag.add(mass * end);
      massBurst.add(mass);
      return { burst: zBurst, end };
    }
    const end = v * Math.exp(-k * Math.max(collinsGroundIntegral(start.diameter, l, z, true), 0));
    lay(mass, z, 0, speedAt, end);
    const e = 0.5 * mass * end * end;
    eGround.add(e);
    pGround.add(mass * end);
    massSwarm.add(mass);
    swarmEnergy += e;
    return { burst: null, end };
  };

  const flights: Fragment[] = [];
  let primaryCloud: StudyFResult['primaryCloud'] = null;

  /** Rule 1079 and 1087 (a): a break and its cascade, breadth-first. */
  const breakAll = (first: Fragment): void => {
    const queue: Fragment[] = [first];
    while (queue.length > 0) {
      const p = queue.shift();
      if (p === undefined) break;
      const mc = fc * p.mass;
      const rest = p.mass - mc;
      const children = [y * rest, rest - y * rest];
      if (mc > 0) {
        count();
        const c = cloud(mc, p.z, p.v);
        primaryCloud ??= { burstAltitude: c.burst, endSpeed: c.end };
      }
      for (const mass of children) {
        if (!(mass > 0)) continue;
        count();
        if (mass < floor) {
          dust(mass, p.z, p.v);
          continue;
        }
        const strength = Math.min(p.strength * (p.mass / mass) ** alpha, F_STRENGTH_CEILING_PA);
        const child = { mass, strength, z: p.z, v: p.v };
        if (entryDensity(p.z) * p.v * p.v >= strength) queue.push(child);
        else flights.push(child);
      }
    }
  };

  /** Rule 1091 (a): a fragment's flight, Eq. 8 from its birth; where its
   *  pressure reaches its strength, the altitude by bisection on ρ. */
  const fly = (f: Fragment): void => {
    const L = diameterOf(f.mass);
    const a = (3 * DRAG_COEFFICIENT * H_SCALE) / (4 * rhoI * L * sinTheta);
    const xb = entryDensity(f.z);
    const speedOfX = (x: number): number => f.v * Math.exp(-a * (x - xb));
    const speedAt = (z: number): number => (z >= f.z ? f.v : speedOfX(entryDensity(z)));
    const pressure = (x: number): number => {
      const s = speedOfX(x);
      return x * s * s;
    };
    const top = Math.min(RHO_0, Math.max(1 / (2 * a), xb));
    if (pressure(top) >= f.strength && top > xb) {
      let lo = xb;
      let hi = top;
      for (let i = 0; i < 200; i++) {
        const mid = (lo + hi) / 2;
        if (pressure(mid) < f.strength) lo = mid;
        else hi = mid;
      }
      const zBreak = Math.min(Math.max(-H_SCALE * Math.log(hi / RHO_0), 0), f.z);
      const vBreak = speedAt(zBreak);
      lay(f.mass, f.z, zBreak, speedAt, vBreak);
      breakAll({ mass: f.mass, strength: f.strength, z: zBreak, v: vBreak });
      return;
    }
    const vGround = speedAt(0);
    lay(f.mass, f.z, 0, speedAt, vGround);
    const terminal = Math.min(terminalOf(L), v0);
    const speed = Math.max(vGround, terminal);
    const floorActed = speed > vGround;
    if (floorActed) {
      eFloor.add(0.5 * f.mass * (speed * speed - vGround * vGround));
      pFloor.add(f.mass * (speed - vGround));
    }
    eGround.add(0.5 * f.mass * speed * speed);
    pGround.add(f.mass * speed);
    massGround.add(f.mass);
    pieces.push({ mass: f.mass, speed, floorActed });
  };

  let completed = true;
  let breakupAltitude: number | null = null;
  const If = collinsPaperIf(body, mainStrength);
  const whole = (z: number): number =>
    z >= TOP_M ? collinsWholeSpeed(body, TOP_M) : collinsWholeSpeed(body, z);
  // Above the top bin the losses go to it, as S laid them (rule 1020).
  const topLoss = (mass: number): void => {
    const vTop = collinsWholeSpeed(body, TOP_M);
    const b = nBins - 1;
    const e = 0.5 * mass * (v0 * v0 - vTop * vTop);
    energyPerBin[b] = (energyPerBin[b] ?? 0) + e;
    momentumPerBin[b] = (momentumPerBin[b] ?? 0) + mass * (v0 - vTop);
    eDrag.add(e);
    pDrag.add(mass * (v0 - vTop));
  };
  topLoss(m0);
  try {
    if (If >= 1) {
      // Rule 1091 (c): never breaks — the whole body, as the baseline has it.
      const vGround = collinsWholeSpeed(body, 0);
      lay(m0, TOP_M, 0, whole, vGround);
      const speed = Math.max(vGround, Math.min(terminalOf(L0), v0));
      if (speed > vGround) {
        eFloor.add(0.5 * m0 * (speed * speed - vGround * vGround));
        pFloor.add(m0 * (speed - vGround));
      }
      eGround.add(0.5 * m0 * speed * speed);
      pGround.add(m0 * speed);
      massGround.add(m0);
      pieces.push({ mass: m0, speed, floorActed: speed > vGround });
    } else {
      const zStar = collinsBreakupAltitude(mainStrength, v0, If);
      const vStar = collinsWholeSpeed(body, zStar);
      breakupAltitude = zStar;
      lay(m0, TOP_M, zStar, whole, vStar);
      breakAll({ mass: m0, strength: mainStrength, z: zStar, v: vStar });
      while (flights.length > 0) {
        const f = flights.pop();
        if (f !== undefined) fly(f);
      }
    }
  } catch (e) {
    if (!(e instanceof Bound)) throw e;
    completed = false;
  }

  const E0 = 0.5 * m0 * v0 * v0;
  const p0 = m0 * v0;
  const energyResidual =
    (E0 + eFloor.value - eDrag.value - eDust.value - eGround.value) / (E0 + Math.abs(eFloor.value));
  // Rule 1086: p0 + J_g − J_drag − J_dust − (p_flight + p_ground), component by
  // component (nothing is in flight at the end); rule 1090 (b): its norm
  // decides, its projection on u is checked against it.
  const rx = p0 * cosTheta + pFloor.x.value - pDrag.x.value - pDust.x.value - pGround.x.value;
  const rz = -p0 * sinTheta + pFloor.z.value - pDrag.z.value - pDust.z.value - pGround.z.value;
  const momentumResidual = Math.hypot(rx, rz) / p0;
  const along = rx * cosTheta - rz * sinTheta;
  const massResidual =
    (m0 - massGround.value - massDust.value - massBurst.value - massSwarm.value) / m0;
  let peak = -1;
  let releaseAltitude: number | null = null;
  energyPerBin.forEach((e, i) => {
    if (i < nBins - 1 && e > peak) {
      peak = e;
      releaseAltitude = (i + 0.5) * binM;
    }
  });
  const largestPiece = pieces.reduce<StudyFPiece | null>(
    (best, p) => (best === null || p.mass > best.mass ? p : best),
    null
  );
  const regime =
    breakupAltitude === null
      ? 'INTACT'
      : pieces.length === 0 && massSwarm.value === 0
        ? 'COMPLETE_AIRBURST'
        : 'PARTIAL_AIRBURST';
  return {
    completed,
    components,
    mass: m0,
    breakupAltitude,
    primaryCloud,
    regime,
    releaseAltitude,
    energyFractionToGround: eGround.value / E0,
    pieces,
    largestPiece,
    survivingMass: massGround.value,
    swarm: { mass: massSwarm.value, energy: swarmEnergy },
    clouds: { count: cloudCount, burstMass: massBurst.value, swarmMass: massSwarm.value },
    dust: { mass: massDust.value, perBin: dustPerBin },
    energyPerBin,
    momentumPerBin,
    budget: {
      massResidual,
      energyIn: E0,
      energyDrag: eDrag.value,
      energyDust: eDust.value,
      energyGround: eGround.value,
      energyFloor: eFloor.value,
      energyResidual,
      momentumResidual,
      momentumProjectionResidual: Math.abs(along) / p0,
    },
  };
}
