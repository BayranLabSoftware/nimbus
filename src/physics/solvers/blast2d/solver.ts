/**
 * The blast solver about the vertical (rules 1254 and 1255 of
 * `validation/blastSolverRules.ts`): the compressible Euler equations of an
 * inviscid perfect gas in cylindrical coordinates (r, z), symmetric about the
 * vertical through the burst, with gravity and an atmosphere at rest; the
 * ground a reflecting wall at z = 0.
 *
 * The scheme, written from the papers and never from another code:
 * - finite volumes on a uniform grid, Δr = Δz;
 * - Berberich, Chandrashekar, Klingenberg & Röpke (2019)'s well-balanced
 *   reconstruction: the variables w = (ρ/α, u, v, p/β), constant at rest,
 *   reconstructed to fifth order (WENO, the stencils and smoothness
 *   indicators of Shu's ICASE report 97-65 with the Z weights of Borges et
 *   al. 2008; rule 1262) and turned back with the background at the face,
 *   a face with no positive ρ/α or p/β falling back to first order;
 *   gravity on the vertical momentum
 *   (p₀ρᵢ/(ρ₀αᵢ))·(β_{j+½} − β_{j−½})/Δz, on the energy v times it;
 * - the HLLC Riemann solver (Toro), with Davis's wave-speed estimates;
 * - the axisymmetric term p/r on the radial momentum, rᵢ the midpoint of the
 *   cell's radial faces;
 * - the third-order strong-stability-preserving Runge–Kutta of Shu & Osher.
 *
 * The reference implementation, float64 and SI throughout; its tests are the
 * six of rule 1254 (c).
 */

import type { Atmosphere } from './atmosphere.js';

/** Three ghost layers on every side, for the fifth-order reconstruction. */
const G = 3;

/**
 * The fifth-order WENO value at the face between c and d, from the cells
 * a, b, c, d, e in order: the three third-order candidates and Jiang & Shu's
 * smoothness indicators (Shu, ICASE report 97-65, eqs. 2.51 and 2.63), linear
 * weights 1/10, 6/10, 3/10, and the Z weights of Borges et al. (2008).
 */
function weno5z(a: number, b: number, c: number, d: number, e: number): number {
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

export interface BlastGrid {
  /** Cells along the ground. */
  readonly nr: number;
  /** Cells up the vertical. */
  readonly nz: number;
  /** The cell size (m), the same in r and z. */
  readonly dx: number;
}

export interface BlastSource {
  /** Energy (J) put in: internal, plus kinetic for a moving source. */
  readonly energy: number;
  /** Height of the source's centre above the ground (m). */
  readonly height: number;
  /** Radius of the sphere of air that takes it (m). */
  readonly radius: number;
  /** Share of the energy given as downward motion (Collins et al. 2017's
   *  moving source); 0 for a static source. */
  readonly kineticShare?: number;
}

export interface BlastOptions {
  readonly gamma?: number;
  readonly cfl?: number;
}

export class BlastSolver2D {
  readonly nr: number;
  readonly nz: number;
  readonly dx: number;
  readonly gamma: number;
  readonly cfl: number;
  readonly atmosphere: Atmosphere;

  /** Conserved variables per cell, ghosts included: ρ, ρu, ρv, E (no potential). */
  readonly rho: Float64Array;
  readonly mr: Float64Array;
  readonly mz: Float64Array;
  readonly en: Float64Array;

  /** Peak of p − p̄ over the run in the first row of cells (Pa). */
  readonly groundPeak: Float64Array;
  /** Time (s) at which each ground peak was reached. */
  readonly groundPeakTime: Float64Array;

  time = 0;
  steps = 0;
  /** Faces that fell back to first order (rules 1255 (d), 1262 (a)). */
  fallbacks = 0;
  /** Cells redone at first order after a stage left them without a positive
   *  density or pressure (rule 1264 (b)). */
  redone = 0;

  private readonly stride: number;
  private readonly rC: Float64Array;
  private readonly rF: Float64Array;
  private readonly alphaC: Float64Array;
  private readonly betaC: Float64Array;
  private readonly alphaF: Float64Array;
  private readonly betaF: Float64Array;
  // Primitive w, ghosts included.
  private readonly q1: Float64Array;
  private readonly vu: Float64Array;
  private readonly vv: Float64Array;
  private readonly q4: Float64Array;
  // w at each cell's upper face (s) and lower face (t), one direction at a time.
  private readonly s1: Float64Array;
  private readonly su: Float64Array;
  private readonly sv: Float64Array;
  private readonly s4: Float64Array;
  private readonly t1: Float64Array;
  private readonly tu: Float64Array;
  private readonly tv: Float64Array;
  private readonly t4: Float64Array;
  // Right-hand side, and the state at the start of a step.
  private readonly d0: Float64Array;
  private readonly d1: Float64Array;
  private readonly d2: Float64Array;
  private readonly d3: Float64Array;
  private readonly k0: Float64Array;
  private readonly k1: Float64Array;
  private readonly k2: Float64Array;
  private readonly k3: Float64Array;
  private readonly flux = new Float64Array(4);
  /** Cells whose faces are held at first order for the rest of the step
   *  (rule 1264 (b)), and the state at the start of the current stage. */
  private readonly low: Uint8Array;
  private readonly pre0: Float64Array;
  private readonly pre1: Float64Array;
  private readonly pre2: Float64Array;
  private readonly pre3: Float64Array;

  constructor(grid: BlastGrid, atmosphere: Atmosphere, options: BlastOptions = {}) {
    const { nr, nz, dx } = grid;
    if (!(nr >= 4 && nz >= 4 && dx > 0)) throw new Error('blast2d: bad grid');
    this.nr = nr;
    this.nz = nz;
    this.dx = dx;
    this.gamma = options.gamma ?? 1.4;
    this.cfl = options.cfl ?? 0.4;
    this.atmosphere = atmosphere;
    this.stride = nr + 2 * G;
    const n = this.stride * (nz + 2 * G);
    const f = (): Float64Array => new Float64Array(n);
    this.rho = f();
    this.mr = f();
    this.mz = f();
    this.en = f();
    this.q1 = f();
    this.vu = f();
    this.vv = f();
    this.q4 = f();
    this.s1 = f();
    this.su = f();
    this.sv = f();
    this.s4 = f();
    this.t1 = f();
    this.tu = f();
    this.tv = f();
    this.t4 = f();
    this.d0 = f();
    this.d1 = f();
    this.d2 = f();
    this.d3 = f();
    this.k0 = f();
    this.k1 = f();
    this.k2 = f();
    this.k3 = f();
    this.pre0 = f();
    this.pre1 = f();
    this.pre2 = f();
    this.pre3 = f();
    this.low = new Uint8Array(n);
    this.rC = Float64Array.from({ length: nr }, (_, i) => (i + 0.5) * dx);
    this.rF = Float64Array.from({ length: nr + 1 }, (_, i) => i * dx);
    this.alphaC = Float64Array.from({ length: nz }, (_, j) => atmosphere.alpha((j + 0.5) * dx));
    this.betaC = Float64Array.from({ length: nz }, (_, j) => atmosphere.beta((j + 0.5) * dx));
    this.alphaF = Float64Array.from({ length: nz + 1 }, (_, j) => atmosphere.alpha(j * dx));
    this.betaF = Float64Array.from({ length: nz + 1 }, (_, j) => atmosphere.beta(j * dx));
    this.groundPeak = new Float64Array(nr);
    this.groundPeakTime = new Float64Array(nr);
    this.fillAtRest();
  }

  /** Index of interior cell (i, j), 0 ≤ i < nr, 0 ≤ j < nz; ghosts at −2, −1. */
  index(i: number, j: number): number {
    return (j + G) * this.stride + (i + G);
  }

  /** Radius of a cell's centre (m). */
  radius(i: number): number {
    return this.rC[i] ?? NaN;
  }

  /** The background's pressure at a cell row's centre (Pa). */
  backgroundPressure(j: number): number {
    return this.atmosphere.p0 * (this.betaC[j] ?? NaN);
  }

  /** The background's density at a cell row's centre (kg/m³). */
  backgroundDensity(j: number): number {
    return this.atmosphere.rho0 * (this.alphaC[j] ?? NaN);
  }

  /** Pressure of interior cell (i, j) (Pa). */
  pressure(i: number, j: number): number {
    const k = this.index(i, j);
    const r = this.rho[k] ?? 0;
    const a = this.mr[k] ?? 0;
    const b = this.mz[k] ?? 0;
    return (this.gamma - 1) * ((this.en[k] ?? 0) - (0.5 * (a * a + b * b)) / r);
  }

  /** Volume of a cell of ring i (m³). */
  cellVolume(i: number): number {
    return 2 * Math.PI * (this.rC[i] ?? 0) * this.dx * this.dx;
  }

  /** Total energy in the interior (J), no potential. */
  totalEnergy(): number {
    let sum = 0;
    for (let j = 0; j < this.nz; j++)
      for (let i = 0; i < this.nr; i++)
        sum += (this.en[this.index(i, j)] ?? 0) * this.cellVolume(i);
    return sum;
  }

  /** The largest speed in the interior (m/s). */
  maxSpeed(): number {
    let top = 0;
    for (let j = 0; j < this.nz; j++)
      for (let i = 0; i < this.nr; i++) {
        const k = this.index(i, j);
        const r = this.rho[k] ?? 0;
        const s = Math.hypot(this.mr[k] ?? 0, this.mz[k] ?? 0) / r;
        if (s > top) top = s;
      }
    return top;
  }

  private fillAtRest(): void {
    const { rho0, p0 } = this.atmosphere;
    for (let j = 0; j < this.nz; j++) {
      const r = rho0 * (this.alphaC[j] ?? 0);
      const e = (p0 * (this.betaC[j] ?? 0)) / (this.gamma - 1);
      for (let i = 0; i < this.nr; i++) {
        const k = this.index(i, j);
        this.rho[k] = r;
        this.mr[k] = 0;
        this.mz[k] = 0;
        this.en[k] = e;
      }
    }
  }

  /**
   * Put a source in (rule 1255 (d)): its energy spread over the cells inside
   * the sphere by the share of each cell's volume inside it (sampled on a
   * sub-grid, weighted by radius), scaled so the energy put in is exactly the
   * source's; a moving source's kinetic share given as a common downward
   * speed to the air inside. Returns the energy put in (J).
   */
  deposit(source: BlastSource, samples = 8): number {
    const { energy, height, radius } = source;
    const kinetic = source.kineticShare ?? 0;
    if (!(energy > 0 && radius > 0 && kinetic >= 0 && kinetic < 1))
      throw new Error('blast2d: bad source');
    const dx = this.dx;
    const iMax = Math.min(this.nr - 1, Math.ceil(radius / dx) + 1);
    const jLo = Math.max(0, Math.floor((height - radius) / dx) - 1);
    const jHi = Math.min(this.nz - 1, Math.ceil((height + radius) / dx) + 1);
    const share = new Map<number, number>();
    let volume = 0;
    let mass = 0;
    for (let j = jLo; j <= jHi; j++)
      for (let i = 0; i <= iMax; i++) {
        let inside = 0;
        let weight = 0;
        for (let a = 0; a < samples; a++)
          for (let b = 0; b < samples; b++) {
            const r = (i + (a + 0.5) / samples) * dx;
            const z = (j + (b + 0.5) / samples) * dx;
            weight += r;
            if (r * r + (z - height) * (z - height) <= radius * radius) inside += r;
          }
        if (inside > 0) {
          const v = (inside / weight) * this.cellVolume(i);
          const k = this.index(i, j);
          share.set(k, v);
          volume += v;
          mass += v * (this.rho[k] ?? 0);
        }
      }
    if (!(volume > 0)) throw new Error('blast2d: the source covers no cell');
    const internalDensity = ((1 - kinetic) * energy) / volume;
    const speed = kinetic > 0 ? Math.sqrt((2 * kinetic * energy) / mass) : 0;
    let put = 0;
    for (const [k, v] of share) {
      const f = v / this.cellVolume(this.cellRing(k));
      const r = this.rho[k] ?? 0;
      // The share f of the cell moves down at `speed`; its momentum and the
      // energy are added in proportion.
      this.mz[k] = (this.mz[k] ?? 0) - f * r * speed;
      this.en[k] = (this.en[k] ?? 0) + f * (internalDensity + 0.5 * r * speed * speed);
      put += v * (internalDensity + 0.5 * r * speed * speed);
    }
    // The kinetic energy of a partly covered cell is not ½ρu² of its mean
    // speed; what was put in is counted exactly above.
    return put;
  }

  private cellRing(k: number): number {
    return (k % this.stride) - G;
  }

  /** Fill w for the interior and its ghosts from the conserved state. */
  private primitives(): number {
    const { nr, nz, gamma, stride } = this;
    const { rho0, p0 } = this.atmosphere;
    let fastest = 0;
    for (let j = 0; j < nz; j++) {
      const a = rho0 * (this.alphaC[j] ?? 0);
      const b = p0 * (this.betaC[j] ?? 0);
      for (let i = 0; i < nr; i++) {
        const k = (j + G) * stride + (i + G);
        const r = this.rho[k] ?? 0;
        const u = (this.mr[k] ?? 0) / r;
        const v = (this.mz[k] ?? 0) / r;
        const p = (gamma - 1) * ((this.en[k] ?? 0) - 0.5 * r * (u * u + v * v));
        this.q1[k] = r / a;
        this.vu[k] = u;
        this.vv[k] = v;
        this.q4[k] = p / b;
        const c = Math.sqrt((gamma * p) / r);
        const s = Math.abs(u) + Math.abs(v) + 2 * c;
        if (s > fastest) fastest = s;
      }
    }
    // Ghosts: the axis and the ground reflect; the outer and upper boundaries
    // copy w outward.
    for (let j = 0; j < nz; j++) {
      const row = (j + G) * stride;
      for (let g = 1; g <= G; g++) {
        const inner = row + G + (g - 1);
        const ghost = row + G - g;
        this.q1[ghost] = this.q1[inner] ?? 0;
        this.vu[ghost] = -(this.vu[inner] ?? 0);
        this.vv[ghost] = this.vv[inner] ?? 0;
        this.q4[ghost] = this.q4[inner] ?? 0;
        const last = row + G + nr - 1;
        const out = row + G + nr - 1 + g;
        this.q1[out] = this.q1[last] ?? 0;
        this.vu[out] = this.vu[last] ?? 0;
        this.vv[out] = this.vv[last] ?? 0;
        this.q4[out] = this.q4[last] ?? 0;
      }
    }
    for (let i = -G; i < nr + G; i++) {
      for (let g = 1; g <= G; g++) {
        const inner = (G + (g - 1)) * stride + (i + G);
        const ghost = (G - g) * stride + (i + G);
        this.q1[ghost] = this.q1[inner] ?? 0;
        this.vu[ghost] = this.vu[inner] ?? 0;
        this.vv[ghost] = -(this.vv[inner] ?? 0);
        this.q4[ghost] = this.q4[inner] ?? 0;
        const last = (G + nz - 1) * stride + (i + G);
        const out = (G + nz - 1 + g) * stride + (i + G);
        this.q1[out] = this.q1[last] ?? 0;
        this.vu[out] = this.vu[last] ?? 0;
        this.vv[out] = this.vv[last] ?? 0;
        this.q4[out] = this.q4[last] ?? 0;
      }
    }
    return fastest / this.dx;
  }

  /** w at both faces of every cell along one direction (step 1 or stride),
   *  by the fifth-order WENO reconstruction of rule 1262. */
  private reconstruct(step: number): void {
    const { nr, nz, stride } = this;
    const iLo = step === 1 ? -1 : 0;
    const iHi = step === 1 ? nr : nr - 1;
    const jLo = step === 1 ? 0 : -1;
    const jHi = step === 1 ? nz - 1 : nz;
    const vars: [Float64Array, Float64Array, Float64Array][] = [
      [this.q1, this.s1, this.t1],
      [this.vu, this.su, this.tu],
      [this.vv, this.sv, this.tv],
      [this.q4, this.s4, this.t4],
    ];
    const s2 = 2 * step;
    for (let j = jLo; j <= jHi; j++)
      for (let i = iLo; i <= iHi; i++) {
        const k = (j + G) * stride + (i + G);
        for (const [w, up, down] of vars) {
          const a = w[k - s2] ?? 0;
          const b = w[k - step] ?? 0;
          const c = w[k] ?? 0;
          const d = w[k + step] ?? 0;
          const e = w[k + s2] ?? 0;
          up[k] = weno5z(a, b, c, d, e);
          down[k] = weno5z(e, d, c, b, a);
        }
      }
  }

  /**
   * HLLC flux (Toro) across a face, in the face's frame: normal speed `un`,
   * tangential `ut`. Writes (mass, normal momentum, tangential momentum,
   * energy) into `this.flux`.
   */
  private hllc(
    rL: number,
    unL: number,
    utL: number,
    pL: number,
    rR: number,
    unR: number,
    utR: number,
    pR: number
  ): void {
    const g = this.gamma;
    const cL = Math.sqrt((g * pL) / rL);
    const cR = Math.sqrt((g * pR) / rR);
    const eL = pL / (g - 1) + 0.5 * rL * (unL * unL + utL * utL);
    const eR = pR / (g - 1) + 0.5 * rR * (unR * unR + utR * utR);
    const sL = Math.min(unL - cL, unR - cR);
    const sR = Math.max(unL + cL, unR + cR);
    const out = this.flux;
    if (sL >= 0) {
      out[0] = rL * unL;
      out[1] = rL * unL * unL + pL;
      out[2] = rL * unL * utL;
      out[3] = unL * (eL + pL);
      return;
    }
    if (sR <= 0) {
      out[0] = rR * unR;
      out[1] = rR * unR * unR + pR;
      out[2] = rR * unR * utR;
      out[3] = unR * (eR + pR);
      return;
    }
    const aL = rL * (sL - unL);
    const aR = rR * (sR - unR);
    const sStar = (pR - pL + unL * aL - unR * aR) / (aL - aR);
    if (sStar >= 0) {
      const f = aL / (sL - sStar);
      out[0] = rL * unL + sL * (f - rL);
      out[1] = rL * unL * unL + pL + sL * (f * sStar - rL * unL);
      out[2] = rL * unL * utL + sL * (f * utL - rL * utL);
      const eStar = f * (eL / rL + (sStar - unL) * (sStar + pL / aL));
      out[3] = unL * (eL + pL) + sL * (eStar - eL);
    } else {
      const f = aR / (sR - sStar);
      out[0] = rR * unR + sR * (f - rR);
      out[1] = rR * unR * unR + pR + sR * (f * sStar - rR * unR);
      out[2] = rR * unR * utR + sR * (f * utR - rR * utR);
      const eStar = f * (eR / rR + (sStar - unR) * (sStar + pR / aR));
      out[3] = unR * (eR + pR) + sR * (eStar - eR);
    }
  }

  /** Whether a face's reconstructed ρ/α and p/β are positive on both sides;
   *  where not, the face falls back to first order, counted (rule 1262 (a)). */
  private faceIsPositive(kl: number, kr: number): boolean {
    if ((this.low[kl] ?? 0) !== 0 || (this.low[kr] ?? 0) !== 0) return false;
    if (
      (this.s1[kl] ?? 0) > 0 &&
      (this.s4[kl] ?? 0) > 0 &&
      (this.t1[kr] ?? 0) > 0 &&
      (this.t4[kr] ?? 0) > 0
    )
      return true;
    this.fallbacks++;
    return false;
  }

  /** The right-hand side into d0..d3; returns the fastest signal over Δx. */
  private rhs(): number {
    const { nr, nz, stride, dx } = this;
    const { rho0, p0 } = this.atmosphere;
    const fastest = this.primitives();
    this.d0.fill(0);
    this.d1.fill(0);
    this.d2.fill(0);
    this.d3.fill(0);
    const out = this.flux;

    // Radial faces, row by row: face f lies between cells f − 1 and f.
    this.reconstruct(1);
    for (let j = 0; j < nz; j++) {
      const a = rho0 * (this.alphaC[j] ?? 0);
      const b = p0 * (this.betaC[j] ?? 0);
      const row = (j + G) * stride + G;
      for (let f = 0; f <= nr; f++) {
        const kl = row + f - 1;
        const kr = row + f;
        const high = this.faceIsPositive(kl, kr);
        const rL = a * ((high ? this.s1 : this.q1)[kl] ?? 0);
        const uL = (high ? this.su : this.vu)[kl] ?? 0;
        const vL = (high ? this.sv : this.vv)[kl] ?? 0;
        const pL = b * ((high ? this.s4 : this.q4)[kl] ?? 0);
        const rR = a * ((high ? this.t1 : this.q1)[kr] ?? 0);
        const uR = (high ? this.tu : this.vu)[kr] ?? 0;
        const vR = (high ? this.tv : this.vv)[kr] ?? 0;
        const pR = b * ((high ? this.t4 : this.q4)[kr] ?? 0);
        this.hllc(rL, uL, vL, pL, rR, uR, vR, pR);
        const area = this.rF[f] ?? 0;
        const f0 = (out[0] ?? 0) * area;
        const f1 = (out[1] ?? 0) * area;
        const f2 = (out[2] ?? 0) * area;
        const f3 = (out[3] ?? 0) * area;
        if (f > 0) {
          const inv = 1 / ((this.rC[f - 1] ?? 0) * dx);
          this.d0[kl] = (this.d0[kl] ?? 0) - f0 * inv;
          this.d1[kl] = (this.d1[kl] ?? 0) - f1 * inv;
          this.d2[kl] = (this.d2[kl] ?? 0) - f2 * inv;
          this.d3[kl] = (this.d3[kl] ?? 0) - f3 * inv;
        }
        if (f < nr) {
          const inv = 1 / ((this.rC[f] ?? 0) * dx);
          this.d0[kr] = (this.d0[kr] ?? 0) + f0 * inv;
          this.d1[kr] = (this.d1[kr] ?? 0) + f1 * inv;
          this.d2[kr] = (this.d2[kr] ?? 0) + f2 * inv;
          this.d3[kr] = (this.d3[kr] ?? 0) + f3 * inv;
        }
      }
    }

    // Vertical faces, column by column: face g lies at z = gΔ, between cells
    // g − 1 and g, and is turned back with the background there.
    this.reconstruct(stride);
    const invDx = 1 / dx;
    for (let g = 0; g <= nz; g++) {
      const a = rho0 * (this.alphaF[g] ?? 0);
      const b = p0 * (this.betaF[g] ?? 0);
      for (let i = 0; i < nr; i++) {
        const kl = (g - 1 + G) * stride + (i + G);
        const kr = kl + stride;
        const high = this.faceIsPositive(kl, kr);
        const rL = a * ((high ? this.s1 : this.q1)[kl] ?? 0);
        const uL = (high ? this.su : this.vu)[kl] ?? 0;
        const vL = (high ? this.sv : this.vv)[kl] ?? 0;
        const pL = b * ((high ? this.s4 : this.q4)[kl] ?? 0);
        const rR = a * ((high ? this.t1 : this.q1)[kr] ?? 0);
        const uR = (high ? this.tu : this.vu)[kr] ?? 0;
        const vR = (high ? this.tv : this.vv)[kr] ?? 0;
        const pR = b * ((high ? this.t4 : this.q4)[kr] ?? 0);
        // Normal is v, tangential u: the flux's momenta swap back.
        this.hllc(rL, vL, uL, pL, rR, vR, uR, pR);
        const f0 = (out[0] ?? 0) * invDx;
        const fz = (out[1] ?? 0) * invDx;
        const fr = (out[2] ?? 0) * invDx;
        const f3 = (out[3] ?? 0) * invDx;
        if (g > 0) {
          this.d0[kl] = (this.d0[kl] ?? 0) - f0;
          this.d1[kl] = (this.d1[kl] ?? 0) - fr;
          this.d2[kl] = (this.d2[kl] ?? 0) - fz;
          this.d3[kl] = (this.d3[kl] ?? 0) - f3;
        }
        if (g < nz) {
          this.d0[kr] = (this.d0[kr] ?? 0) + f0;
          this.d1[kr] = (this.d1[kr] ?? 0) + fr;
          this.d2[kr] = (this.d2[kr] ?? 0) + fz;
          this.d3[kr] = (this.d3[kr] ?? 0) + f3;
        }
      }
    }

    // Sources: the axisymmetric term, and gravity in the well-balanced form.
    const pr = p0 / rho0;
    for (let j = 0; j < nz; j++) {
      const lift =
        (pr * ((this.betaF[j + 1] ?? 0) - (this.betaF[j] ?? 0))) / (dx * (this.alphaC[j] ?? 0));
      const b = p0 * (this.betaC[j] ?? 0);
      for (let i = 0; i < nr; i++) {
        const k = (j + G) * stride + (i + G);
        const p = b * (this.q4[k] ?? 0);
        this.d1[k] = (this.d1[k] ?? 0) + p / (this.rC[i] ?? 0);
        const force = (this.rho[k] ?? 0) * lift;
        this.d2[k] = (this.d2[k] ?? 0) + force;
        this.d3[k] = (this.d3[k] ?? 0) + (this.vv[k] ?? 0) * force;
      }
    }
    return fastest;
  }

  /** Whether a cell's density and pressure are positive finite numbers. */
  private sound(k: number): boolean {
    const r = this.rho[k] ?? NaN;
    const a = this.mr[k] ?? NaN;
    const b = this.mz[k] ?? NaN;
    const p = (this.gamma - 1) * ((this.en[k] ?? NaN) - (0.5 * (a * a + b * b)) / r);
    return r > 0 && p > 0 && Number.isFinite(r) && Number.isFinite(p);
  }

  /** One step of the Shu–Osher third-order Runge–Kutta, with rule 1264's a
   *  posteriori fall-back; returns Δt (s). */
  step(maxDt = Infinity): number {
    const { nr, nz, stride } = this;
    const sets: [Float64Array, Float64Array, Float64Array, Float64Array][] = [
      [this.rho, this.k0, this.d0, this.pre0],
      [this.mr, this.k1, this.d1, this.pre1],
      [this.mz, this.k2, this.d2, this.pre2],
      [this.en, this.k3, this.d3, this.pre3],
    ];
    this.low.fill(0);
    const speed = this.rhs();
    const dt = Math.min(this.cfl / speed, maxDt);
    if (!(dt > 0 && Number.isFinite(dt))) throw new Error(`blast2d: time step ${String(dt)}`);
    // U¹ = Uⁿ + Δt L(Uⁿ); U² = ¾Uⁿ + ¼(U¹ + Δt L(U¹)); Uⁿ⁺¹ = ⅓Uⁿ + ⅔(U² + Δt L(U²)).
    // Each stage starts from its own state (`pre`) with L already in d; a
    // stage that leaves a cell unsound marks it, and is done again.
    const stage = (keep: number, add: number): void => {
      for (const [u, , , pre] of sets) pre.set(u);
      for (let attempt = 0; ; attempt++) {
        for (const [u, k0, d, pre] of sets)
          for (let j = 0; j < nz; j++)
            for (let i = 0; i < nr; i++) {
              const k = (j + G) * stride + (i + G);
              u[k] = keep * (k0[k] ?? 0) + add * ((pre[k] ?? 0) + dt * (d[k] ?? 0));
            }
        let marked = 0;
        for (let j = 0; j < nz; j++)
          for (let i = 0; i < nr; i++) {
            const k = (j + G) * stride + (i + G);
            if (!this.sound(k) && (this.low[k] ?? 0) === 0) {
              this.low[k] = 1;
              marked++;
            }
          }
        if (marked === 0) {
          let bad = false;
          for (let j = 0; j < nz && !bad; j++)
            for (let i = 0; i < nr; i++)
              if (!this.sound((j + G) * stride + (i + G))) {
                bad = true;
                break;
              }
          if (!bad) return;
          throw new Error('blast2d: a cell stays without positive density or pressure');
        }
        if (attempt >= 4) throw new Error('blast2d: positivity not restored after five tries');
        this.redone += marked;
        for (const [u, , , pre] of sets) u.set(pre);
        this.rhs();
      }
    };
    for (const [u, k0] of sets) k0.set(u);
    stage(0, 1);
    this.rhs();
    stage(0.75, 0.25);
    this.rhs();
    stage(1 / 3, 2 / 3);
    this.time += dt;
    this.steps++;
    const p0 = this.backgroundPressure(0);
    for (let i = 0; i < nr; i++) {
      const over = this.pressure(i, 0) - p0;
      if (over > (this.groundPeak[i] ?? 0)) {
        this.groundPeak[i] = over;
        this.groundPeakTime[i] = this.time;
      }
    }
    return dt;
  }
}
