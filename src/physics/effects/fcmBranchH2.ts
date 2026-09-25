import { USSA_1976_PROFILE } from './ussa1976Entry.js';
import { H_SCALE, RHO_0 } from './entryConstants.js';

/**
 * H2 (rule 1186, src/physics/validation/fcmSurvivalLightRules.ts): a fork of
 * the sealed `fcmBranch.ts` — round 3's frozen candidate (rule 1162) is
 * untouched by this file, and this file does not touch it. The one physical
 * change: instead of one σ drawn per whole draw and shared by every
 * component of the cascade, each *solid* fragment draws its own σ
 * independently, from the same unnarrowed prior (rule 1131's 1·10⁻⁹ to
 * 1.6·10⁻⁸ s²/m², log-uniform), at the moment it is born; a cloud keeps the σ
 * of the solid piece it broke from; the unbroken body draws once, as before.
 * Everything else — the equations, the breaks, the ledger, the atmosphere,
 * the peaks — is the same code as fcmBranch.ts, copied rather than imported
 * so that a later change to the sealed file cannot silently reach this one.
 */

const G0 = 9.806_65;
const EARTH_RADIUS_M = 6.371e6;

let ussaTable: Float64Array | null = null;
const USSA_TABLE_TOP_M = 120_000;
const USSA_R0 = 6_356_766;
const USSA_KINKS = new Set(
  [11_000, 20_000, 32_000, 47_000, 51_000, 71_000]
    .map((hp) => Math.floor((USSA_R0 * hp) / (USSA_R0 - hp)))
    .concat([85_999])
);
function ussaDensity(h: number): number {
  if (ussaTable === null) {
    ussaTable = new Float64Array(USSA_TABLE_TOP_M + 1);
    for (let i = 0; i <= USSA_TABLE_TOP_M; i++)
      ussaTable[i] = Math.log(USSA_1976_PROFILE.density(i));
  }
  if (h >= USSA_TABLE_TOP_M) return USSA_1976_PROFILE.density(h);
  const x = Math.max(h, 0);
  const i = Math.floor(x);
  if (USSA_KINKS.has(i)) return USSA_1976_PROFILE.density(x);
  const a = ussaTable[i] ?? 0;
  const b = ussaTable[i + 1] ?? a;
  return Math.exp(a + (x - i) * (b - a));
}

export type FcmAtmosphere = 'ussa1976' | 'exponential';
export type FcmScheme = 'rk4' | 'euler';

export type FcmSplit =
  | { kind: 'mass'; fragments: number; larger: number; cloud: number }
  | { kind: 'radius'; f: number }
  | { kind: 'cloud' };

export interface FcmH2Options {
  dragCoefficient?: number;
  /** Rule 1186: the range each solid fragment's σ is drawn from
   *  independently, log-uniform, at birth. */
  sigmaRange: readonly [number, number];
  /** The seeded draw H2 reads σ from: one call per new solid component. */
  sigmaDraw: () => number;
  cloudDispersion: number;
  cloudCapRadii?: number | null;
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
  bundle?: boolean;
  aggregateBelowShare?: number;
  maxChangePerStep?: number;
  settleWithin?: number;
}

export interface FcmGroup {
  massShare: number;
  pieces: number;
  strength: number;
  materialDensity?: number;
  alpha?: number;
  split?: FcmSplit;
}

export interface FcmStructure {
  initialStrength: number;
  groups: readonly FcmGroup[];
}

export interface FcmBody {
  diameter: number;
  velocity: number;
  density: number;
  materialDensity?: number;
  angle: number;
  strength: number;
  structure?: FcmStructure;
}

export interface FcmPiece {
  count: number;
  mass: number;
  speed: number;
  atTerminal: boolean;
  group: number;
}

export interface FcmResult {
  completed: boolean;
  components: number;
  mass: number;
  energy: number;
  energyPerBin: number[];
  binM: number;
  firstBreakAltitude: number | null;
  firstBreakByGroup: (number | null)[];
  pieces: FcmPiece[];
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
    dragWork: number;
    ablatedEnergy: number;
    flightResidual: number;
    flightAbsResidual: number;
  };
  steps: number;
  aggregated: number;
}

interface Component {
  cloud: boolean;
  n: number;
  mass: number;
  v: number;
  gamma: number;
  h: number;
  radius: number;
  radiusCap: number;
  strength: number;
  rho: number;
  whole: boolean;
  group: number;
  alpha: number;
  split: FcmSplit;
  /** Rule 1186: this component's own σ, drawn at birth (solids) or inherited
   *  from the solid parent it broke from (clouds). */
  sigma: number;
}

type State = [number, number, number, number, number, number, number, number, number];
const zero = (): State => [0, 0, 0, 0, 0, 0, 0, 0, 0];

class Bound extends Error {}

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

/** Rule 1186: one σ, log-uniform on `sigmaRange`, drawn on `draw`. */
function drawSigma(range: readonly [number, number], draw: () => number): number {
  if (range[0] === range[1]) return range[0];
  return range[0] * (range[1] / range[0]) ** draw();
}

/** H2's flight of one body, to the ground — the σ of each solid fragment its
 *  own, drawn at birth. */
export function fcmEntryH2(body: FcmBody, options: FcmH2Options): FcmResult {
  const Cd = options.dragCoefficient ?? 1.0;
  const cDisp = options.cloudDispersion;
  const capRadii = options.cloudCapRadii ?? null;
  const step = options.stepM ?? 10;
  const binM = options.binM ?? 1_000;
  const top = options.startAltitudeM ?? 100_000;
  const floor = options.floorKg ?? 1e-3;
  const cap = options.maxComponents ?? 100_000;
  const ceiling = options.strengthCeilingPa ?? 330e6;
  const maxChange = options.maxChangePerStep ?? 0.5;
  const settleAbove = 1 + (options.settleWithin ?? 0.01);
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
  const solidArea = (m: number, rho: number): number =>
    Math.PI * Math.cbrt((3 * m) / (4 * Math.PI * rho)) ** 2;

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
  const px0 = m0 * body.velocity * Math.cos(body.angle);
  const py0 = m0 * body.velocity * Math.sin(body.angle);
  const airX = new Sum();
  const airY = new Sum();
  const gravityImpulse = new Sum();
  const groundX = new Sum();
  const groundY = new Sum();
  const dragWork = new Sum();
  const stoppedEnergy = new Sum();
  const ablatedEnergy = new Sum();
  const flightAbs = new Sum();
  let steps = 0;
  let aggregated = 0;
  const aggregateBelow =
    options.aggregateBelowShare === undefined ? 0 : options.aggregateBelowShare * m0;
  const pieces: FcmPiece[] = [];
  const swarm = { mass: 0, energy: 0 };
  let components = 1;
  let firstBreak: number | null = null;
  const firstBreakByGroup: (number | null)[] = (body.structure?.groups ?? []).map(() => null);

  const count = (members: number): void => {
    components += members;
    if (components > cap) throw new Bound();
  };

  const derivative = (c: Component, h: number, y: State, out: State): void => {
    const v = y[0];
    const gamma = y[1];
    const m = y[2];
    const r = y[3];
    const rho = density(h);
    const g = gravityAt(h);
    const cloud = c.cloud;
    const area = cloud ? Math.PI * r * r : solidArea(m, c.rho);
    const sinG = Math.sin(gamma);
    const cosG = Math.cos(gamma);
    const inv = -1 / (v * sinG);
    out[0] = ((-0.5 * Cd * area * rho * v * v) / m + g * sinG) * inv;
    out[1] = (g / v - (withCurvature ? v / (EARTH_RADIUS_M + h) : 0)) * cosG * inv;
    out[2] = -0.5 * c.sigma * rho * area * v * v * v * inv;
    out[3] = cloud && r < c.radiusCap ? v * Math.sqrt((cDisp * rho) / c.rho) * inv : 0;
    out[4] = m * g * v * sinG * inv;
    out[5] = m * g * inv;
    out[6] = inv;
    out[7] = 0.5 * Cd * area * rho * v * v * v * inv;
    out[8] = 0.25 * c.sigma * rho * area * v * v * v * v * v * inv;
  };

  const k1 = zero();
  const k2 = zero();
  const k3 = zero();
  const k4 = zero();
  const tmp = zero();

  const axpy = (out: State, y: State, a: number, k: State): void => {
    out[0] = y[0] + a * k[0];
    out[1] = y[1] + a * k[1];
    out[2] = y[2] + a * k[2];
    out[3] = y[3] + a * k[3];
    out[4] = y[4] + a * k[4];
    out[5] = y[5] + a * k[5];
    out[6] = y[6] + a * k[6];
    out[7] = y[7] + a * k[7];
    out[8] = y[8] + a * k[8];
  };

  const advance = (c: Component, h: number, y: State, dh: number): State => {
    const out = zero();
    derivative(c, h, y, k1);
    if (euler) {
      axpy(out, y, -dh, k1);
      return out;
    }
    axpy(tmp, y, -dh / 2, k1);
    derivative(c, h - dh / 2, tmp, k2);
    axpy(tmp, y, -dh / 2, k2);
    derivative(c, h - dh / 2, tmp, k3);
    axpy(tmp, y, -dh, k3);
    derivative(c, h - dh, tmp, k4);
    k1[0] += 2 * k2[0] + 2 * k3[0] + k4[0];
    k1[1] += 2 * k2[1] + 2 * k3[1] + k4[1];
    k1[2] += 2 * k2[2] + 2 * k3[2] + k4[2];
    k1[3] += 2 * k2[3] + 2 * k3[3] + k4[3];
    k1[4] += 2 * k2[4] + 2 * k3[4] + k4[4];
    k1[5] += 2 * k2[5] + 2 * k3[5] + k4[5];
    k1[6] += 2 * k2[6] + 2 * k3[6] + k4[6];
    k1[7] += 2 * k2[7] + 2 * k3[7] + k4[7];
    k1[8] += 2 * k2[8] + 2 * k3[8] + k4[8];
    axpy(out, y, -dh / 6, k1);
    return out;
  };

  const record = (h0: number, y0: State, h1: number, y1: State, n: number): void => {
    const ke0 = 0.5 * y0[2] * y0[0] * y0[0];
    const ke1 = 0.5 * y1[2] * y1[0] * y1[0];
    const work = y1[4] - y0[4];
    const e = n * (ke0 - ke1 + work);
    energyPerBin[binOf((h0 + h1) / 2)] = (energyPerBin[binOf((h0 + h1) / 2)] ?? 0) + e;
    deposited.add(e);
    gravityWork.add(n * work);
    vapour.add(n * (y0[2] - y1[2]));
    const drag = n * (y1[7] - y0[7]);
    const ablated = n * (y1[8] - y0[8]);
    dragWork.add(drag);
    ablatedEnergy.add(ablated);
    flightAbs.add(Math.abs(e - drag - ablated));
    steps += 1;
    const impulse = y1[5] - y0[5];
    gravityImpulse.add(n * impulse);
    airX.add(n * (y0[2] * y0[0] * Math.cos(y0[1]) - y1[2] * y1[0] * Math.cos(y1[1])));
    airY.add(n * (y0[2] * y0[0] * Math.sin(y0[1]) - y1[2] * y1[0] * Math.sin(y1[1]) + impulse));
  };

  const stopHere = (c: Component, into: Sum): void => {
    const e = c.n * 0.5 * c.mass * c.v * c.v;
    stoppedEnergy.add(e);
    energyPerBin[binOf(c.h)] = (energyPerBin[binOf(c.h)] ?? 0) + e;
    deposited.add(e);
    airX.add(c.n * c.mass * c.v * Math.cos(c.gamma));
    airY.add(c.n * c.mass * c.v * Math.sin(c.gamma));
    into.add(c.n * c.mass);
  };

  /** A cloud of a parent's debris: keeps the parent's σ (rule 1186). */
  const cloudOf = (p: Component, mass: number, n: number, rho: number): Component => {
    const r = Math.cbrt((3 * mass) / (4 * Math.PI * rho));
    return {
      ...p,
      whole: false,
      cloud: true,
      n,
      mass,
      radius: r,
      radiusCap: capRadii === null ? Infinity : capRadii * r,
      strength: Infinity,
      rho,
    };
  };

  const children = (p: Component): Component[] => {
    const rho = p.whole ? rhoMat : p.rho;
    if (p.mass < aggregateBelow) {
      aggregated += p.n;
      return [cloudOf(p, p.mass, p.n, rho)];
    }
    // Rule 1186: σ is redrawn once per break, shared by every solid child
    // that break produces — fragments born together, identical in mass and
    // now in σ too, still bundle exactly as one component with its count.
    const brokenSigma = drawSigma(options.sigmaRange, options.sigmaDraw);
    const solid = (mass: number, k: number): Component => ({
      ...p,
      whole: false,
      cloud: false,
      n: p.n * k,
      mass,
      radius: 0,
      radiusCap: 0,
      strength: Math.min(p.strength * (p.mass / mass) ** p.alpha, ceiling),
      rho,
      sigma: brokenSigma,
    });
    const s = p.split;
    if (s.kind === 'cloud') return [cloudOf(p, p.mass, p.n, rho)];
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
    if (cloudMass > 0) out.push(cloudOf(p, cloudMass, p.n, rho));
    // Fragments of the same mass, born together, fly as one with their number
    // (exact: they share both mass and σ).
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

  const physical = (a: State, b: State): boolean =>
    b.every(Number.isFinite) &&
    b[0] > 0 &&
    b[2] > 0 &&
    b[2] <= a[2] &&
    b[1] > 0 &&
    b[1] < Math.PI &&
    Math.abs(b[0] - a[0]) <= maxChange * a[0] &&
    a[2] - b[2] <= maxChange * a[2] &&
    Math.abs(b[3] - a[3]) <= maxChange * Math.max(a[3], 1e-300);

  const cloudTerminal = (h: number, y: State): number =>
    Math.sqrt((2 * y[2] * gravityAt(h)) / (Cd * density(h) * Math.PI * y[3] * y[3]));

  const fly = (c: Component): void => {
    let y: State = [c.v, c.gamma, c.mass, c.radius, 0, 0, 0, 0, 0];
    let h = c.h;
    const pressure = (hh: number, st: State): number => density(hh) * st[0] * st[0];
    for (;;) {
      const here = (): Component => ({ ...c, v: y[0], gamma: y[1], mass: y[2], radius: y[3], h });
      if (c.cloud && withGravity && y[0] <= settleAbove * cloudTerminal(h, y)) {
        stopHere(here(), settled);
        return;
      }
      let dh = Math.min(step, h - Math.floor((h - 1e-9) / step) * step || step, h);
      if (dh <= 0) break;
      let next = advance(c, h, y, dh);
      while (!physical(y, next) && dh > 1e-6) {
        dh /= 2;
        next = advance(c, h, y, dh);
      }
      if (!physical(y, next)) {
        stopHere(here(), c.cloud ? settled : dust);
        return;
      }
      let hNext = h - dh;
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
        if (c.group >= 0) firstBreakByGroup[c.group] ??= hNext;
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
          const area = solidArea(y[2], c.rho);
          const terminal = Math.sqrt((2 * y[2] * gravityAt(0)) / (Cd * density(0) * area));
          pieces.push({
            count: c.n,
            mass: y[2],
            speed: y[0],
            atTerminal: y[0] <= terminal * 1.01,
            group: c.group,
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
      rho: body.density,
      whole: true,
      group: -1,
      alpha: options.alpha,
      split: options.split,
      sigma: drawSigma(options.sigmaRange, options.sigmaDraw),
    };
    if (body.structure === undefined) {
      queue.push(start);
    } else {
      const s = body.structure;
      const groupsSplit = (p: Component): Component[] => {
        const out: Component[] = [];
        const shares = s.groups.reduce((a, g) => a + g.massShare, 0);
        if (shares > 1 + 1e-12) throw new Error('FCM H2: the groups exceed the body');
        const grouped = s.groups.map((g) => (g.massShare * p.mass) / g.pieces);
        const groupedMass = s.groups.reduce((a, g, k) => a + (grouped[k] ?? 0) * g.pieces, 0);
        if (p.mass - groupedMass > 0) out.push(cloudOf(p, p.mass - groupedMass, 1, rhoMat));
        // Rule 1186: one σ per structural group — its pieces are identical
        // and still fly bundled as one component with their count.
        s.groups.forEach((g, k) =>
          out.push({
            ...p,
            whole: false,
            cloud: false,
            n: g.pieces,
            mass: grouped[k] ?? 0,
            radius: 0,
            radiusCap: 0,
            strength: g.strength,
            rho: g.materialDensity ?? rhoMat,
            group: k,
            alpha: g.alpha ?? p.alpha,
            split: g.split ?? p.split,
            sigma: drawSigma(options.sigmaRange, options.sigmaDraw),
          })
        );
        return out;
      };
      let y: State = [start.v, start.gamma, start.mass, 0, 0, 0, 0, 0, 0];
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
    firstBreakByGroup,
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
      dragWork: dragWork.value,
      ablatedEnergy: ablatedEnergy.value,
      flightResidual:
        (deposited.value - stoppedEnergy.value - dragWork.value - ablatedEnergy.value) / E0,
      flightAbsResidual: flightAbs.value / E0,
    },
    steps,
    aggregated,
  };
}
