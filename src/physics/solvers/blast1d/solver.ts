/**
 * The blast solver in one spherical dimension (rules 1328 and 1333 (c) of
 * `../../validation/blastSolverRules.ts`): the free-air burst, the judged
 * value of step 2's validation. The two-dimensional solver's scheme written
 * for a sphere — rule 1328's surrogate (Eulero's), brought into the project:
 * WENO5-Z (Borges's Z weights) on the characteristic fields at each face (p −
 * ρ̄c̄u, ρ − p/c̄², p + ρ̄c̄u at the face's mean state, rule 1309), HLLC with
 * Davis's speeds, the third-order SSP Runge–Kutta, the geometric term p·ΔA/V
 * (exact for a uniform pressure); a face without positive ρ and p falls back
 * to first order (counted).
 *
 * With eos: 'air' the gas is real air as in the two-dimensional solver (rules
 * 1334 (b), 1343 (a)): the cold branch the ideal gas's own arithmetic, hot
 * states the blended function's table `airTabled` (rule 1347), a face's e by Newton on e(γ̃ − 1) = p/ρ from its cell's
 * e inside [RT₀·10^0.58, p/(0.05ρ)], c̄² = Γ̄p̄/ρ̄ with Γ = ρc²/p.
 *
 * Records, per cell, the largest p − p₀ over the run and its time; at the
 * probes asked for, the crossing times of a ladder of overpressures 2 %
 * apart (for the foot's arrival at a share of the final peak, rule 1327)
 * and the first positive phase's impulse.
 */

import { AIR_COLD_E, AIR_RHO0, airEffectiveEdge, airTabled, rp1181 } from '../blast2d/airEos.js';

const G = 3;

export interface Blast1DOptions {
  readonly gamma?: number;
  readonly cfl?: number;
  readonly eos?: 'ideal' | 'air';
  /** Radii (m) where the foot's ladder and the impulse are recorded. */
  readonly probes?: readonly number[];
}

/** The overpressure ladder: from 10 Pa, 2 % apart, to 10⁹ Pa. */
const LADDER_FROM = 10;
const LADDER_STEP = 1.02;
const LADDER = Math.ceil(Math.log(1e9 / LADDER_FROM) / Math.log(LADDER_STEP)) + 1;

interface Probe {
  readonly radius: number;
  /** The cell below the radius (interpolated with the next). */
  readonly cell: number;
  /** Crossing times of the ladder, for the two cells. */
  readonly cross: [Float64Array, Float64Array];
  next: [number, number];
  /** The first positive phase's impulse, for the two cells (Pa s). */
  impulse: [number, number];
  phase: [0 | 1 | 2, 0 | 1 | 2];
  /** The overpressure at the previous step. */
  previous: [number, number];
}

export class BlastSolver1D {
  readonly n: number;
  readonly dr: number;
  readonly gamma: number;
  readonly cfl: number;
  readonly eos: 'ideal' | 'air';
  readonly rho0: number;
  readonly p0: number;
  readonly rho: Float64Array;
  readonly mom: Float64Array;
  readonly en: Float64Array;
  /** Per cell: the largest p − p₀ over the run (Pa) and its time (s). */
  readonly peak: Float64Array;
  readonly peakTime: Float64Array;
  time = 0;
  steps = 0;
  fallbacks = 0;
  faceIterations = 0;

  private readonly vol: Float64Array;
  private readonly dA: Float64Array;
  private readonly area: Float64Array;
  private readonly wr: Float64Array;
  private readonly wu: Float64Array;
  private readonly wp: Float64Array;
  private readonly wg: Float64Array;
  private readonly we: Float64Array;
  private readonly d0: Float64Array;
  private readonly d1: Float64Array;
  private readonly d2: Float64Array;
  private readonly k0: Float64Array;
  private readonly k1: Float64Array;
  private readonly k2: Float64Array;
  private readonly flux = new Float64Array(3);
  private readonly x1 = new Float64Array(6);
  private readonly x2 = new Float64Array(6);
  private readonly x3 = new Float64Array(6);
  private readonly probes: Probe[];
  private faceC2 = 0;

  constructor(
    grid: { n: number; dr: number },
    air: { rho0: number; p0: number },
    options: Blast1DOptions = {}
  ) {
    const { n, dr } = grid;
    if (!(n >= 8 && dr > 0)) throw new Error('blast1d: bad grid');
    this.n = n;
    this.dr = dr;
    this.gamma = options.gamma ?? 1.4;
    this.cfl = options.cfl ?? 0.4;
    this.eos = options.eos ?? 'ideal';
    this.rho0 = air.rho0;
    this.p0 = air.p0;
    const size = n + 2 * G;
    const f = (): Float64Array => new Float64Array(size);
    this.rho = f();
    this.mom = f();
    this.en = f();
    this.peak = new Float64Array(n);
    this.peakTime = new Float64Array(n);
    this.vol = f();
    this.dA = f();
    this.wr = f();
    this.wu = f();
    this.wp = f();
    this.wg = f();
    this.we = f();
    this.d0 = f();
    this.d1 = f();
    this.d2 = f();
    this.k0 = f();
    this.k1 = f();
    this.k2 = f();
    this.area = new Float64Array(size + 1);
    const face = (i: number): number => (i - G) * dr;
    for (let i = 0; i < size; i++) {
      const a = face(i);
      const b = face(i + 1);
      this.vol[i] = (4 / 3) * Math.PI * (Math.abs(b) ** 3 - Math.abs(a) ** 3) * Math.sign(b);
      this.dA[i] = 4 * Math.PI * (b * b - a * a);
    }
    for (let k = 0; k <= size; k++) this.area[k] = 4 * Math.PI * face(k) ** 2;
    for (let i = G; i < n + G; i++) {
      this.rho[i] = air.rho0;
      this.en[i] = air.p0 / (this.gamma - 1);
    }
    this.probes = (options.probes ?? []).map((radius) => {
      const cell = Math.min(n - 2, Math.max(0, Math.floor(radius / dr - 0.5)));
      return {
        radius,
        cell,
        cross: [new Float64Array(LADDER).fill(NaN), new Float64Array(LADDER).fill(NaN)],
        next: [0, 0],
        impulse: [0, 0],
        phase: [0, 0],
        previous: [0, 0],
      };
    });
  }

  /** Radius of cell i's centre (m). */
  radius(i: number): number {
    return (i + 0.5) * this.dr;
  }

  /** Cell i's volume (m³). */
  cellVolume(i: number): number {
    return this.vol[i + G] ?? NaN;
  }

  /** Energy in the air above its state at rest (J). */
  excessEnergy(): number {
    let sum = 0;
    for (let i = G; i < this.n + G; i++)
      sum += ((this.en[i] ?? 0) - this.p0 / (this.gamma - 1)) * (this.vol[i] ?? 0);
    return sum;
  }

  /**
   * A hot sphere of air at rest at ambient density: `energy` (J) added as
   * internal energy uniform in the sphere of `radius` (m), each cell its exact
   * share of volume inside. Returns the energy put in (J).
   */
  depositHotSphere(energy: number, radius: number): number {
    const density = energy / ((4 / 3) * Math.PI * radius ** 3);
    let put = 0;
    for (let i = G; i < this.n + G; i++) {
      const a = (i - G) * this.dr;
      const b = a + this.dr;
      if (a >= radius) break;
      const share = (Math.min(b, radius) ** 3 - a ** 3) / (b ** 3 - a ** 3);
      this.en[i] = (this.en[i] ?? 0) + share * density;
      put += share * density * (this.vol[i] ?? 0);
    }
    return put;
  }

  /**
   * Rule 1334 (e): the energy above the air at rest held by cells beyond the
   * equation of state's effective edge Z_h (rules 1336–1339), J — C1 and C2
   * are undetermined where it ever exceeds 1 % of the source.
   */
  beyondEdgeEnergy(): number {
    if (this.eos === 'ideal') return 0;
    let sum = 0;
    for (let i = G; i < this.n + G; i++) {
      const r = this.rho[i] ?? 0;
      const m = this.mom[i] ?? 0;
      const e = ((this.en[i] ?? 0) - (0.5 * m * m) / r) / r;
      if (!(e > AIR_COLD_E)) continue;
      const y = Math.log10(r / AIR_RHO0);
      if (Math.log10(e / rp1181.RT0) > airEffectiveEdge(y).z)
        sum += ((this.en[i] ?? 0) - this.p0 / (this.gamma - 1)) * (this.vol[i] ?? 0);
    }
    return sum;
  }

  /** p and c² of a cell's state (rule 1343 (a)'s branches); writes Γ, e. */
  private state(r: number, rhoE: number, k: number): number {
    const g = this.gamma;
    if (this.eos === 'ideal' || rhoE <= r * AIR_COLD_E) {
      const p = (g - 1) * rhoE;
      this.wg[k] = g;
      this.we[k] = rhoE / r;
      this.faceC2 = (g * p) / r;
      return p;
    }
    const hot = airTabled(rhoE / r, r);
    this.wg[k] = (r * hot.c2) / hot.p;
    this.we[k] = rhoE / r;
    this.faceC2 = hot.c2;
    return hot.p;
  }

  /** Pressure of cell i (Pa). */
  pressure(i: number): number {
    const k = i + G;
    const r = this.rho[k] ?? 0;
    const m = this.mom[k] ?? 0;
    const rhoE = (this.en[k] ?? 0) - (0.5 * m * m) / r;
    if (this.eos === 'ideal' || rhoE <= r * AIR_COLD_E) return (this.gamma - 1) * rhoE;
    return airTabled(rhoE / r, r).p;
  }

  /** Rule 1343 (a): a face state's internal energy per volume from (ρ, p). */
  private faceInternal(r: number, p: number, guess: number): number {
    const g = this.gamma;
    const cold = p / (g - 1);
    if (this.eos === 'ideal' || !(cold > r * AIR_COLD_E)) {
      this.faceC2 = (g * p) / r;
      return cold;
    }
    const target = p / r;
    let lo = AIR_COLD_E;
    let hi = target / 0.05;
    let e = guess > lo && guess < hi ? guess : cold / r;
    for (let it = 0; it < 80; it++) {
      const s = airTabled(e, r);
      const f = s.p / r - target;
      if (Math.abs(f) <= 1e-14 * target) {
        this.faceC2 = s.c2;
        return r * e;
      }
      if (f > 0) hi = e;
      else lo = e;
      let next = e - f / s.dpde;
      if (!(next > lo && next < hi)) next = 0.5 * (lo + hi);
      this.faceIterations++;
      e = next;
    }
    this.faceC2 = airTabled(e, r).c2;
    return r * e;
  }

  private hllc(
    rL: number,
    uL: number,
    pL: number,
    gL: number,
    rR: number,
    uR: number,
    pR: number,
    gR: number
  ): void {
    const eL = this.faceInternal(rL, pL, gL) + 0.5 * rL * uL * uL;
    const cL = Math.sqrt(this.faceC2);
    const eR = this.faceInternal(rR, pR, gR) + 0.5 * rR * uR * uR;
    const cR = Math.sqrt(this.faceC2);
    const sL = Math.min(uL - cL, uR - cR);
    const sR = Math.max(uL + cL, uR + cR);
    const F = this.flux;
    if (sL >= 0) {
      F[0] = rL * uL;
      F[1] = rL * uL * uL + pL;
      F[2] = uL * (eL + pL);
      return;
    }
    if (sR <= 0) {
      F[0] = rR * uR;
      F[1] = rR * uR * uR + pR;
      F[2] = uR * (eR + pR);
      return;
    }
    const aL = rL * (sL - uL);
    const aR = rR * (sR - uR);
    const s = (pR - pL + uL * aL - uR * aR) / (aL - aR);
    if (s >= 0) {
      const f = aL / (sL - s);
      F[0] = rL * uL + sL * (f - rL);
      F[1] = rL * uL * uL + pL + sL * (f * s - rL * uL);
      F[2] = uL * (eL + pL) + sL * (f * (eL / rL + (s - uL) * (s + pL / aL)) - eL);
    } else {
      const f = aR / (sR - s);
      F[0] = rR * uR + sR * (f - rR);
      F[1] = rR * uR * uR + pR + sR * (f * s - rR * uR);
      F[2] = uR * (eR + pR) + sR * (f * (eR / rR + (s - uR) * (s + pR / aR)) - eR);
    }
  }

  /** The right-hand side; returns the largest |u| + c. */
  private rhs(): number {
    const { n, wr, wu, wp, wg, we, d0, d1, d2, x1, x2, x3 } = this;
    let fast = 0;
    for (let i = G; i < n + G; i++) {
      const r = this.rho[i] ?? 0;
      const u = (this.mom[i] ?? 0) / r;
      const p = this.state(r, (this.en[i] ?? 0) - 0.5 * r * u * u, i);
      wr[i] = r;
      wu[i] = u;
      wp[i] = p;
      const s = Math.abs(u) + Math.sqrt(this.faceC2);
      if (s > fast) fast = s;
    }
    for (let g = 1; g <= G; g++) {
      const inner = G + g - 1;
      const ghost = G - g;
      const last = n + G - 1;
      const out = n + G - 1 + g;
      for (const w of [wr, wp, wg, we]) {
        w[ghost] = w[inner] ?? 0;
        w[out] = w[last] ?? 0;
      }
      wu[ghost] = -(wu[inner] ?? 0);
      wu[out] = wu[last] ?? 0;
    }
    d0.fill(0);
    d1.fill(0);
    d2.fill(0);
    for (let f = G + 1; f <= n + G; f++) {
      const l = f - 1;
      const r = f;
      const ra = 0.5 * ((wr[l] ?? 0) + (wr[r] ?? 0));
      const pa = 0.5 * ((wp[l] ?? 0) + (wp[r] ?? 0));
      const ga = 0.5 * ((wg[l] ?? 0) + (wg[r] ?? 0));
      const ca = Math.sqrt((ga * pa) / ra);
      const z = ra * ca;
      const cc = ca * ca;
      for (let j = 0; j < 6; j++) {
        const i = l - 2 + j;
        const p = wp[i] ?? 0;
        const u = wu[i] ?? 0;
        x1[j] = p - z * u;
        x2[j] = (wr[i] ?? 0) - p / cc;
        x3[j] = p + z * u;
      }
      const at = (x: Float64Array, k: number): number => x[k] ?? 0;
      const a1 = weno(at(x1, 0), at(x1, 1), at(x1, 2), at(x1, 3), at(x1, 4));
      const a2 = weno(at(x2, 0), at(x2, 1), at(x2, 2), at(x2, 3), at(x2, 4));
      const a3 = weno(at(x3, 0), at(x3, 1), at(x3, 2), at(x3, 3), at(x3, 4));
      const b1 = weno(at(x1, 5), at(x1, 4), at(x1, 3), at(x1, 2), at(x1, 1));
      const b2 = weno(at(x2, 5), at(x2, 4), at(x2, 3), at(x2, 2), at(x2, 1));
      const b3 = weno(at(x3, 5), at(x3, 4), at(x3, 3), at(x3, 2), at(x3, 1));
      let pL = 0.5 * (a1 + a3);
      let uL = (a3 - a1) / (2 * z);
      let rL = a2 + pL / cc;
      let pR = 0.5 * (b1 + b3);
      let uR = (b3 - b1) / (2 * z);
      let rR = b2 + pR / cc;
      if (!(rL > 0 && pL > 0 && rR > 0 && pR > 0)) {
        this.fallbacks++;
        rL = wr[l] ?? 0;
        uL = wu[l] ?? 0;
        pL = wp[l] ?? 0;
        rR = wr[r] ?? 0;
        uR = wu[r] ?? 0;
        pR = wp[r] ?? 0;
      }
      this.hllc(rL, uL, pL, we[l] ?? NaN, rR, uR, pR, we[r] ?? NaN);
      const A = this.area[f] ?? 0;
      const F = this.flux;
      const f0 = (F[0] ?? 0) * A;
      const f1 = (F[1] ?? 0) * A;
      const f2 = (F[2] ?? 0) * A;
      const vl = 1 / (this.vol[l] ?? 1);
      d0[l] = (d0[l] ?? 0) - f0 * vl;
      d1[l] = (d1[l] ?? 0) - f1 * vl;
      d2[l] = (d2[l] ?? 0) - f2 * vl;
      if (r < n + G) {
        const vr = 1 / (this.vol[r] ?? 1);
        d0[r] = (d0[r] ?? 0) + f0 * vr;
        d1[r] = (d1[r] ?? 0) + f1 * vr;
        d2[r] = (d2[r] ?? 0) + f2 * vr;
      }
    }
    for (let i = G; i < n + G; i++)
      d1[i] = (d1[i] ?? 0) + ((wp[i] ?? 0) * (this.dA[i] ?? 0)) / (this.vol[i] ?? 1);
    return fast;
  }

  /** One SSP-RK3 step, at most maxDt; returns Δt (s). */
  step(maxDt = Infinity): number {
    const { n, rho, mom, en, k0, k1, k2, d0, d1, d2 } = this;
    k0.set(rho);
    k1.set(mom);
    k2.set(en);
    const fast = this.rhs();
    const dt = Math.min((this.cfl * this.dr) / fast, maxDt);
    const stages: [number, number][] = [
      [0, 1],
      [0.75, 0.25],
      [1 / 3, 2 / 3],
    ];
    for (const [s, [keep, add]] of stages.entries()) {
      if (s > 0) this.rhs();
      for (let i = G; i < n + G; i++) {
        rho[i] = keep * (k0[i] ?? 0) + add * ((rho[i] ?? 0) + dt * (d0[i] ?? 0));
        mom[i] = keep * (k1[i] ?? 0) + add * ((mom[i] ?? 0) + dt * (d1[i] ?? 0));
        en[i] = keep * (k2[i] ?? 0) + add * ((en[i] ?? 0) + dt * (d2[i] ?? 0));
      }
    }
    this.time += dt;
    this.steps++;
    this.record(dt);
    return dt;
  }

  private record(dt: number): void {
    for (let i = 0; i < this.n; i++) {
      const over = this.pressure(i) - this.p0;
      if (over > (this.peak[i] ?? 0)) {
        this.peak[i] = over;
        this.peakTime[i] = this.time;
      }
    }
    for (const pr of this.probes)
      for (const side of [0, 1] as const) {
        const i = pr.cell + side;
        const over = this.pressure(i) - this.p0;
        const cross = pr.cross[side];
        // Ladder crossings, linear in time within the step (as the
        // surrogate's reading (c)).
        const before = pr.previous[side];
        while (pr.next[side] < LADDER) {
          const level = LADDER_FROM * LADDER_STEP ** pr.next[side];
          if (!(over >= level)) break;
          cross[pr.next[side]] =
            before < level ? this.time - (dt * (over - level)) / (over - before) : this.time;
          pr.next[side]++;
        }
        pr.previous[side] = over;
        // The first positive phase's impulse (over·Δt, a rectangle per step;
        // opened and closed at over > 0 — a threshold against rounding noise
        // at rest is a later mend, the thirteenth review's note).
        if (pr.phase[side] === 0 && over > 0) pr.phase[side] = 1;
        if (pr.phase[side] === 1) {
          if (over > 0) pr.impulse[side] += over * dt;
          else pr.phase[side] = 2;
        }
      }
  }

  /** Whether the first positive phase has ended at both cells of a probe. */
  positivePhaseEnded(radius: number): boolean {
    const pr = this.probes.find((x) => x.radius === radius);
    return pr?.phase[0] === 2 && pr.phase[1] === 2;
  }

  /**
   * At a probe's radius: the foot's arrival, the first time p − p₀ reached
   * `share` of the cell's final peak (from the ladder's crossings, linear
   * between centres), and the first positive phase's impulse.
   */
  probe(radius: number, share = 0.05): { foot: number; impulse: number; peak: number } {
    const pr = this.probes.find((x) => x.radius === radius);
    if (pr === undefined) throw new Error('blast1d: no such probe');
    const w = (radius - this.radius(pr.cell)) / this.dr;
    const at = (side: 0 | 1): { foot: number; impulse: number; peak: number } => {
      const peak = this.peak[pr.cell + side] ?? NaN;
      const level = share * peak;
      const k = Math.ceil(Math.log(level / LADDER_FROM) / Math.log(LADDER_STEP));
      const a = pr.cross[side][Math.max(0, k - 1)] ?? NaN;
      const b = pr.cross[side][k] ?? NaN;
      const la = LADDER_FROM * LADDER_STEP ** Math.max(0, k - 1);
      const lb = LADDER_FROM * LADDER_STEP ** k;
      const foot = a + ((b - a) * Math.log(level / la)) / Math.log(lb / la);
      return { foot, impulse: pr.impulse[side], peak };
    };
    const lo = at(0);
    const hi = at(1);
    return {
      foot: lo.foot + (hi.foot - lo.foot) * w,
      impulse: lo.impulse + (hi.impulse - lo.impulse) * w,
      peak: lo.peak + (hi.peak - lo.peak) * w,
    };
  }
}

function weno(a: number, b: number, c: number, d: number, e: number): number {
  const q0 = (2 * a - 7 * b + 11 * c) / 6;
  const q1 = (-b + 5 * c + 2 * d) / 6;
  const q2 = (2 * c + 5 * d - e) / 6;
  const b0 = (13 / 12) * (a - 2 * b + c) ** 2 + 0.25 * (a - 4 * b + 3 * c) ** 2;
  const b1 = (13 / 12) * (b - 2 * c + d) ** 2 + 0.25 * (b - d) ** 2;
  const b2 = (13 / 12) * (c - 2 * d + e) ** 2 + 0.25 * (3 * c - 4 * d + e) ** 2;
  const tau = Math.abs(b0 - b2);
  const w0 = 0.1 * (1 + tau / (b0 + 1e-40));
  const w1 = 0.6 * (1 + tau / (b1 + 1e-40));
  const w2 = 0.3 * (1 + tau / (b2 + 1e-40));
  return (w0 * q0 + w1 * q1 + w2 * q2) / (w0 + w1 + w2);
}
