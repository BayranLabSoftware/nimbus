import { USSA_1976_PROFILE } from './ussa1976Entry.js';
import { H_SCALE, RHO_0 } from './entryConstants.js';

/**
 * The fragment-cloud entry branch of round 1 (rules 1137 to 1147,
 * validation/fcmRoundRules.ts) — DEVELOPMENT, begun before the reviewer has
 * read the round's dossier (rule 1147), and not read by the product. Every
 * component — the body, each fragment, each cloud — flies numerically after
 * Register, Mathias & Wheeler (2017, «R17»), Eqs. 1 to 5, 8 to 11 and 15, and
 * Wheeler et al. (2018, «W18»):
 *
 *   dv/dt = −½ C_d A ρ v² / m + g sin γ        (γ below the horizontal)
 *   dγ/dt = (g / v − v / (R_E + h)) cos γ
 *   dm/dt = −½ σ ρ A v³
 *   dh/dt = −v sin γ,     g = g₀ (R_E / (R_E + h))²
 *
 * integrated in altitude — each step a fixed drop Δh (R17's Eq. 4) — by the
 * classical Runge–Kutta, or by R17's explicit scheme to compare with it. A
 * solid piece breaks where ρ v² first reaches its strength (R17 Eq. 8), found by
 * bisection inside the step; a cloud spreads at v (C_disp ρ / ρ_b)^½ (Eq. 10)
 * under one bow shock and ablates on its area. Each step's energy given to the
 * air is the kinetic energy the component lost plus gravity's work on it —
 * drag and the ablated mass's energy (Eq. 15 with gravity kept) — so that the
 * ledger closes by construction; the integrator is checked by the limits and
 * by convergence (rule 1141).
 */

const G0 = 9.806_65;
const EARTH_RADIUS_M = 6.371e6;

/** The 1976 standard's density, tabulated every metre from 0 to 120 km as its
 *  logarithm and interpolated linearly in it: the same numbers as
 *  `ussaState` to far below the step's error, at a fraction of its cost. */
let ussaTable: Float64Array | null = null;
const USSA_TABLE_TOP_M = 120_000;
function ussaDensity(h: number): number {
  if (ussaTable === null) {
    ussaTable = new Float64Array(USSA_TABLE_TOP_M + 1);
    for (let i = 0; i <= USSA_TABLE_TOP_M; i++)
      ussaTable[i] = Math.log(USSA_1976_PROFILE.density(i));
  }
  if (h >= USSA_TABLE_TOP_M) return USSA_1976_PROFILE.density(h);
  const x = Math.max(h, 0);
  const i = Math.floor(x);
  const a = ussaTable[i] ?? 0;
  const b = ussaTable[i + 1] ?? a;
  return Math.exp(a + (x - i) * (b - a));
}

export type FcmAtmosphere = 'ussa1976' | 'exponential';
export type FcmScheme = 'rk4' | 'euler';

/** How a break divides its parent (rule 1138 (b)). */
export type FcmSplit =
  /** N fragments — the first takes `larger` of the non-cloud mass, the rest
   *  share the remainder equally — and a cloud of `cloud` of the parent. */
  | { kind: 'mass'; fragments: number; larger: number; cloud: number }
  /** R17's combination: two spheres whose radii are f and 1 − f of the
   *  parent's, the cloud 1 − f³ − (1 − f)³. */
  | { kind: 'radius'; f: number }
  /** R17's pancake: the whole parent becomes one cloud. */
  | { kind: 'cloud' };

export interface FcmOptions {
  /** C_d in R17's ½ C_d convention (rule 1138 (a)). */
  dragCoefficient?: number;
  /** σ (s²/m²): dm/dt = −½ σ ρ A v³ (R17's σ_ab C_d, W18's σ). */
  ablation: number;
  /** C_disp of the clouds' spreading (R17 Eq. 10). */
  cloudDispersion: number;
  /** A cloud's radius capped at this multiple of its first; null, unlimited. */
  cloudCapRadii?: number | null;
  /** The children's strength S_p (m_p / m_c)^α. */
  alpha: number;
  split: FcmSplit;
  atmosphere?: FcmAtmosphere;
  scheme?: FcmScheme;
  stepM?: number;
  binM?: number;
  startAltitudeM?: number;
  floorKg?: number;
  maxComponents?: number;
  strengthCeilingPa?: number;
  gravity?: boolean;
  curvature?: boolean;
  /** Identical fragments born together fly as one with their number (exact;
   *  false flies each member apart, to check it). */
  bundle?: boolean;
}

/** W18's structured body (rule 1140, M2): groups released at an initial
 *  strength, each piece with its own. */
export interface FcmStructure {
  initialStrength: number;
  /** The groups' shares of the mass; the remainder is the initial debris,
   *  released as one cloud (W18). They may not exceed 1. */
  groups: readonly { massShare: number; pieces: number; strength: number }[];
}

export interface FcmBody {
  diameter: number;
  velocity: number;
  /** Bulk density of the body (kg/m³); the material density of its pieces
   *  and clouds unless `materialDensity` says otherwise. */
  density: number;
  materialDensity?: number;
  /** Entry angle below the horizontal (rad). */
  angle: number;
  /** The monolith's strength (M1), ignored where a structure is given. */
  strength: number;
  structure?: FcmStructure;
}

export interface FcmPiece {
  /** Identical pieces, born together, counted once with their number. */
  count: number;
  mass: number;
  speed: number;
  /** The speed is within 1 % of the piece's terminal speed at the ground. */
  atTerminal: boolean;
}

export interface FcmResult {
  completed: boolean;
  components: number;
  mass: number;
  energy: number;
  /** Energy given to the air per bin (J); index = floor(h / binM). */
  energyPerBin: number[];
  binM: number;
  /** The first break's altitude (m), or null. */
  firstBreakAltitude: number | null;
  pieces: FcmPiece[];
  /** Clouds that reached the ground: their mass and kinetic energy. */
  swarm: { mass: number; energy: number };
  ledger: {
    vapourMass: number;
    dustMass: number;
    settledCloudMass: number;
    groundMass: number;
    gravityWork: number;
    deposited: number;
    groundEnergy: number;
    massResidual: number;
    energyResidual: number;
    momentumResidual: number;
  };
}

interface Component {
  cloud: boolean;
  /** Identical members flying as one (born together, same mass and state). */
  n: number;
  mass: number;
  v: number;
  gamma: number;
  h: number;
  /** A cloud's radius (m); a solid's follows its mass. */
  radius: number;
  radiusCap: number;
  strength: number;
}

/** The state carried through a step: v, γ, m, r, gravity's work W and its
 *  impulse J (per unit of the vertical), and the time t. */
type State = [number, number, number, number, number, number, number];

class Bound extends Error {}

/** Neumaier's compensated sum. */
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

/** Rule 1138: the branch's flight of one body, to the ground. */
export function fcmEntry(body: FcmBody, options: FcmOptions): FcmResult {
  const Cd = options.dragCoefficient ?? 1.0;
  const sigma = options.ablation;
  const cDisp = options.cloudDispersion;
  const capRadii = options.cloudCapRadii ?? null;
  const step = options.stepM ?? 10;
  const binM = options.binM ?? 1_000;
  const top = options.startAltitudeM ?? 100_000;
  const floor = options.floorKg ?? 1e-3;
  const cap = options.maxComponents ?? 100_000;
  const ceiling = options.strengthCeilingPa ?? 330e6;
  const withGravity = options.gravity ?? true;
  const withCurvature = options.curvature ?? true;
  const euler = (options.scheme ?? 'rk4') === 'euler';
  const rhoMat = body.materialDensity ?? body.density;
  const density =
    (options.atmosphere ?? 'ussa1976') === 'exponential'
      ? (h: number): number => RHO_0 * Math.exp(-h / H_SCALE)
      : ussaDensity;
  const gravityAt = (h: number): number =>
    withGravity ? G0 * (EARTH_RADIUS_M / (EARTH_RADIUS_M + h)) ** 2 : 0;
  const solidArea = (m: number): number =>
    Math.PI * Math.cbrt((3 * m) / (4 * Math.PI * rhoMat)) ** 2;

  const m0 = (Math.PI / 6) * body.density * body.diameter ** 3;
  const E0 = 0.5 * m0 * body.velocity ** 2;
  const nBins = Math.ceil(top / binM) + 1;
  const energyPerBin = new Array<number>(nBins).fill(0);
  const binOf = (h: number): number => Math.min(Math.max(Math.floor(h / binM), 0), nBins - 1);

  const vapour = new Sum();
  const dust = new Sum();
  const settled = new Sum();
  const ground = new Sum();
  const deposited = new Sum();
  const gravityWork = new Sum();
  const groundEnergy = new Sum();
  // The momentum ledger, horizontal (x) and vertical (downward, y).
  const px0 = m0 * body.velocity * Math.cos(body.angle);
  const py0 = m0 * body.velocity * Math.sin(body.angle);
  const airX = new Sum();
  const airY = new Sum();
  const gravityImpulse = new Sum();
  const groundX = new Sum();
  const groundY = new Sum();
  const pieces: FcmPiece[] = [];
  const swarm = { mass: 0, energy: 0 };
  let components = 1;
  let firstBreak: number | null = null;

  const count = (members: number): void => {
    components += members;
    if (components > cap) throw new Bound();
  };

  /** d(state)/dh for a component at altitude h, written into `out`. */
  const derivative = (cloud: boolean, radiusCap: number, h: number, y: State, out: State): void => {
    const v = y[0];
    const gamma = y[1];
    const m = y[2];
    const r = y[3];
    const rho = density(h);
    const g = gravityAt(h);
    const area = cloud ? Math.PI * r * r : solidArea(m);
    const sinG = Math.sin(gamma);
    const cosG = Math.cos(gamma);
    const inv = -1 / (v * sinG);
    out[0] = ((-0.5 * Cd * area * rho * v * v) / m + g * sinG) * inv;
    out[1] = (g / v - (withCurvature ? v / (EARTH_RADIUS_M + h) : 0)) * cosG * inv;
    out[2] = -0.5 * sigma * rho * area * v * v * v * inv;
    out[3] = cloud && r < radiusCap ? v * Math.sqrt((cDisp * rho) / rhoMat) * inv : 0;
    out[4] = m * g * v * sinG * inv;
    out[5] = m * g * inv;
    out[6] = inv;
  };

  const k1: State = [0, 0, 0, 0, 0, 0, 0];
  const k2: State = [0, 0, 0, 0, 0, 0, 0];
  const k3: State = [0, 0, 0, 0, 0, 0, 0];
  const k4: State = [0, 0, 0, 0, 0, 0, 0];
  const tmp: State = [0, 0, 0, 0, 0, 0, 0];

  /** out = y + a·k, component by component. */
  const axpy = (out: State, y: State, a: number, k: State): void => {
    out[0] = y[0] + a * k[0];
    out[1] = y[1] + a * k[1];
    out[2] = y[2] + a * k[2];
    out[3] = y[3] + a * k[3];
    out[4] = y[4] + a * k[4];
    out[5] = y[5] + a * k[5];
    out[6] = y[6] + a * k[6];
  };

  /** One step from h down by dh (> 0), by the chosen scheme. */
  const advance = (c: Component, h: number, y: State, dh: number): State => {
    const out: State = [0, 0, 0, 0, 0, 0, 0];
    derivative(c.cloud, c.radiusCap, h, y, k1);
    if (euler) {
      axpy(out, y, -dh, k1);
      return out;
    }
    axpy(tmp, y, -dh / 2, k1);
    derivative(c.cloud, c.radiusCap, h - dh / 2, tmp, k2);
    axpy(tmp, y, -dh / 2, k2);
    derivative(c.cloud, c.radiusCap, h - dh / 2, tmp, k3);
    axpy(tmp, y, -dh, k3);
    derivative(c.cloud, c.radiusCap, h - dh, tmp, k4);
    // k1 + 2 k2 + 2 k3 + k4, gathered in k1.
    k1[0] += 2 * k2[0] + 2 * k3[0] + k4[0];
    k1[1] += 2 * k2[1] + 2 * k3[1] + k4[1];
    k1[2] += 2 * k2[2] + 2 * k3[2] + k4[2];
    k1[3] += 2 * k2[3] + 2 * k3[3] + k4[3];
    k1[4] += 2 * k2[4] + 2 * k3[4] + k4[4];
    k1[5] += 2 * k2[5] + 2 * k3[5] + k4[5];
    k1[6] += 2 * k2[6] + 2 * k3[6] + k4[6];
    axpy(out, y, -dh / 6, k1);
    return out;
  };

  /** The ledger of one step's change, laid in the bin of its middle. */
  const record = (h0: number, y0: State, h1: number, y1: State, n: number): void => {
    const ke0 = 0.5 * y0[2] * y0[0] * y0[0];
    const ke1 = 0.5 * y1[2] * y1[0] * y1[0];
    const work = y1[4] - y0[4];
    const e = n * (ke0 - ke1 + work);
    energyPerBin[binOf((h0 + h1) / 2)] = (energyPerBin[binOf((h0 + h1) / 2)] ?? 0) + e;
    deposited.add(e);
    gravityWork.add(n * work);
    vapour.add(n * (y0[2] - y1[2]));
    const impulse = y1[5] - y0[5];
    gravityImpulse.add(n * impulse);
    // The air's impulse: what the component lost, gravity's impulse counted.
    airX.add(n * (y0[2] * y0[0] * Math.cos(y0[1]) - y1[2] * y1[0] * Math.cos(y1[1])));
    airY.add(n * (y0[2] * y0[0] * Math.sin(y0[1]) - y1[2] * y1[0] * Math.sin(y1[1]) + impulse));
  };

  /** Give a component's whole kinetic energy and momentum to the air here. */
  const stopHere = (c: Component, into: Sum): void => {
    const e = c.n * 0.5 * c.mass * c.v * c.v;
    energyPerBin[binOf(c.h)] = (energyPerBin[binOf(c.h)] ?? 0) + e;
    deposited.add(e);
    airX.add(c.n * c.mass * c.v * Math.cos(c.gamma));
    airY.add(c.n * c.mass * c.v * Math.sin(c.gamma));
    into.add(c.n * c.mass);
  };

  const children = (p: Component): Component[] => {
    const cloudOf = (mass: number): Component => {
      const r = Math.cbrt((3 * mass) / (4 * Math.PI * rhoMat));
      return {
        cloud: true,
        n: p.n,
        mass,
        v: p.v,
        gamma: p.gamma,
        h: p.h,
        radius: r,
        radiusCap: capRadii === null ? Infinity : capRadii * r,
        strength: Infinity,
      };
    };
    const solid = (mass: number, k: number): Component => ({
      cloud: false,
      n: p.n * k,
      mass,
      v: p.v,
      gamma: p.gamma,
      h: p.h,
      radius: 0,
      radiusCap: 0,
      strength: Math.min(p.strength * (p.mass / mass) ** options.alpha, ceiling),
    });
    const s = options.split;
    if (s.kind === 'cloud') return [cloudOf(p.mass)];
    let fragments: number[];
    let cloudMass: number;
    if (s.kind === 'radius') {
      const a = s.f ** 3 * p.mass;
      const b = (1 - s.f) ** 3 * p.mass;
      fragments = [a, b];
      cloudMass = p.mass - a - b;
    } else {
      cloudMass = s.cloud * p.mass;
      const rest = p.mass - cloudMass;
      const first = s.larger * rest;
      const others = s.fragments > 1 ? (rest - first) / (s.fragments - 1) : 0;
      fragments = [first, ...Array.from({ length: s.fragments - 1 }, () => others)];
    }
    const out: Component[] = [];
    if (cloudMass > 0) out.push(cloudOf(cloudMass));
    // Fragments of the same mass, born together, fly as one with their number.
    if (options.bundle === false) {
      for (const f of fragments)
        if (f > 0) for (let i = 0; i < p.n; i++) out.push({ ...solid(f, 1), n: 1 });
      return out;
    }
    const byMass = new Map<number, number>();
    for (const f of fragments) if (f > 0) byMass.set(f, (byMass.get(f) ?? 0) + 1);
    for (const [f, k] of byMass) out.push(solid(f, k));
    return out;
  };

  const queue: Component[] = [];
  const release = (list: Component[], parentForDust: Component): void => {
    for (const c of list) {
      count(c.n);
      if (c.mass < floor) {
        stopHere({ ...c, v: parentForDust.v }, dust);
        continue;
      }
      queue.push(c);
    }
  };

  /** A step's end is physical: speed and mass positive, the mass never
   *  growing, the path still descending, the speed not halved in one step. */
  const physical = (a: State, b: State): boolean =>
    b.every(Number.isFinite) &&
    b[0] > 0 &&
    b[2] > 0 &&
    b[2] <= a[2] &&
    b[1] > 0 &&
    b[1] < Math.PI &&
    Math.abs(b[0] - a[0]) <= 0.5 * a[0];

  /** A cloud's terminal speed at a state: where it settles (rule 1138 (c)). */
  const cloudTerminal = (h: number, y: State): number =>
    Math.sqrt((2 * y[2] * gravityAt(h)) / (Cd * density(h) * Math.PI * y[3] * y[3]));

  /** Fly a component to its end: the ground, a break, the floor, rest. */
  const fly = (c: Component): void => {
    let y: State = [c.v, c.gamma, c.mass, c.radius, 0, 0, 0];
    let h = c.h;
    const pressure = (hh: number, st: State): number => density(hh) * st[0] * st[0];
    for (;;) {
      const here = (): Component => ({ ...c, v: y[0], gamma: y[1], mass: y[2], radius: y[3], h });
      // A cloud slowed to its terminal speed settles where it is.
      if (c.cloud && withGravity && y[0] <= cloudTerminal(h, y)) {
        stopHere(here(), settled);
        return;
      }
      let dh = Math.min(step, h - Math.floor((h - 1e-9) / step) * step || step, h);
      if (dh <= 0) break;
      let next = advance(c, h, y, dh);
      // Rule 1141 (a): a step whose end is not physical is halved.
      while (!physical(y, next) && dh > 1e-6) {
        dh /= 2;
        next = advance(c, h, y, dh);
      }
      if (!physical(y, next)) {
        stopHere(here(), c.cloud ? settled : dust);
        return;
      }
      let hNext = h - dh;
      // A break inside the step (solid pieces only).
      if (!c.cloud && pressure(hNext, next) >= c.strength) {
        let lo = 0;
        let hi = dh;
        for (let i = 0; i < 40; i++) {
          const mid = (lo + hi) / 2;
          if (pressure(h - mid, advance(c, h, y, mid)) >= c.strength) hi = mid;
          else lo = mid;
        }
        next = advance(c, h, y, hi);
        hNext = h - hi;
        record(h, y, hNext, next, c.n);
        const parent: Component = {
          ...c,
          mass: next[2],
          v: next[0],
          gamma: next[1],
          h: hNext,
        };
        firstBreak ??= hNext;
        release(children(parent), parent);
        return;
      }
      record(h, y, hNext, next, c.n);
      y = next;
      h = hNext;
      if (y[2] < floor) {
        stopHere(here(), dust);
        return;
      }
      if (h <= 0) {
        const ke = 0.5 * y[2] * y[0] * y[0];
        groundEnergy.add(c.n * ke);
        ground.add(c.n * y[2]);
        groundX.add(c.n * y[2] * y[0] * Math.cos(y[1]));
        groundY.add(c.n * y[2] * y[0] * Math.sin(y[1]));
        if (c.cloud) {
          swarm.mass += c.n * y[2];
          swarm.energy += c.n * ke;
        } else {
          const area = solidArea(y[2]);
          const terminal = Math.sqrt((2 * y[2] * gravityAt(0)) / (Cd * density(0) * area));
          pieces.push({
            count: c.n,
            mass: y[2],
            speed: y[0],
            atTerminal: y[0] <= terminal * 1.01,
          });
        }
        return;
      }
    }
  };

  let completed = true;
  try {
    const start: Component = {
      cloud: false,
      n: 1,
      mass: m0,
      v: body.velocity,
      gamma: body.angle,
      h: top,
      radius: 0,
      radiusCap: 0,
      strength: body.structure?.initialStrength ?? body.strength,
    };
    if (body.structure === undefined) {
      queue.push(start);
    } else {
      // M2: fly the whole body to its initial disruption, then its groups.
      const s = body.structure;
      const groupsSplit = (p: Component): Component[] => {
        const out: Component[] = [];
        const shares = s.groups.reduce((a, g) => a + g.massShare, 0);
        if (shares > 1 + 1e-12) throw new Error('FCM: the groups exceed the body');
        const grouped = s.groups.map((g) => (g.massShare * p.mass) / g.pieces);
        const groupedMass = s.groups.reduce((a, g, k) => a + (grouped[k] ?? 0) * g.pieces, 0);
        if (p.mass - groupedMass > 0) {
          const mass = p.mass - groupedMass;
          const r = Math.cbrt((3 * mass) / (4 * Math.PI * rhoMat));
          out.push({
            cloud: true,
            n: 1,
            mass,
            v: p.v,
            gamma: p.gamma,
            h: p.h,
            radius: r,
            radiusCap: capRadii === null ? Infinity : capRadii * r,
            strength: Infinity,
          });
        }
        // A group's identical pieces fly as one with their number.
        s.groups.forEach((g, k) =>
          out.push({
            cloud: false,
            n: g.pieces,
            mass: grouped[k] ?? 0,
            v: p.v,
            gamma: p.gamma,
            h: p.h,
            radius: 0,
            radiusCap: 0,
            strength: g.strength,
          })
        );
        return out;
      };
      // The first flight: the body as one solid, broken into its groups.
      let y: State = [start.v, start.gamma, start.mass, 0, 0, 0, 0];
      let h = start.h;
      let disrupted: Component | null = null;
      while (h > 0) {
        const dh = Math.min(step, h);
        const next = advance(start, h, y, dh);
        if (density(h - dh) * next[0] * next[0] >= start.strength) {
          let lo = 0;
          let hi = dh;
          for (let i = 0; i < 40; i++) {
            const mid = (lo + hi) / 2;
            const s2 = advance(start, h, y, mid);
            if (density(h - mid) * s2[0] * s2[0] >= start.strength) hi = mid;
            else lo = mid;
          }
          const at = advance(start, h, y, hi);
          record(h, y, h - hi, at, 1);
          disrupted = { ...start, mass: at[2], v: at[0], gamma: at[1], h: h - hi };
          break;
        }
        record(h, y, h - dh, next, 1);
        y = next;
        h -= dh;
      }
      if (disrupted === null) {
        // Never disrupted: the whole body reaches the ground.
        queue.push({ ...start, v: y[0], gamma: y[1], mass: y[2], h: 0 });
      } else {
        firstBreak = disrupted.h;
        release(groupsSplit(disrupted), disrupted);
      }
    }
    while (queue.length > 0) {
      const c = queue.shift();
      if (c === undefined) break;
      if (c.h <= 0) {
        // A body landing whole from the structured branch's first flight.
        fly({ ...c, h: 1e-9 });
        continue;
      }
      fly(c);
    }
  } catch (e) {
    if (!(e instanceof Bound)) throw e;
    completed = false;
  }

  const massResidual = (m0 - vapour.value - dust.value - settled.value - ground.value) / m0;
  const energyResidual =
    (E0 + gravityWork.value - deposited.value - groundEnergy.value) /
    (E0 + Math.abs(gravityWork.value));
  const rx = px0 - airX.value - groundX.value;
  const ry = py0 + gravityImpulse.value - airY.value - groundY.value;
  const momentumResidual = Math.hypot(rx, ry) / Math.hypot(px0, py0);
  return {
    completed,
    components,
    mass: m0,
    energy: E0,
    energyPerBin,
    binM,
    firstBreakAltitude: firstBreak,
    pieces,
    swarm,
    ledger: {
      vapourMass: vapour.value,
      dustMass: dust.value,
      settledCloudMass: settled.value,
      groundMass: ground.value,
      gravityWork: gravityWork.value,
      deposited: deposited.value,
      groundEnergy: groundEnergy.value,
      massResidual,
      energyResidual,
      momentumResidual,
    },
  };
}

/** The deposition profile in kt/km at the result's bins, and its main peak. */
export function fcmProfile(r: FcmResult): {
  altitudeKm: number[];
  ktPerKm: number[];
  peak: { altitudeKm: number; ktPerKm: number };
} {
  const KT = 4.184e12;
  const altitudeKm = r.energyPerBin.map((_, i) => ((i + 0.5) * r.binM) / 1_000);
  const ktPerKm = r.energyPerBin.map((e) => e / KT / (r.binM / 1_000));
  let best = 0;
  ktPerKm.forEach((x, i) => {
    if (x > (ktPerKm[best] ?? 0)) best = i;
  });
  return {
    altitudeKm,
    ktPerKm,
    peak: { altitudeKm: altitudeKm[best] ?? 0, ktPerKm: ktPerKm[best] ?? 0 },
  };
}
