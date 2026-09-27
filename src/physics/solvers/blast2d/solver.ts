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
 * - the third-order strong-stability-preserving Runge–Kutta of Shu & Osher;
 * - positivity kept either by rules 1262, 1264 and 1268's yes-or-no
 *   fall-backs ('mood', the default) or by rule 1277's continuous limiter
 *   ('has'): Hu, Adams & Shu (2013)'s blend of each face's flux with the
 *   Lax–Friedrichs flux, and the face states blended towards their cell
 *   (rule 1280).
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

/**
 * Rule 1297: Mignone's (2014) reconstruction weights for r-weighted cell
 * averages (his Eqs. 16 and 21, the cylindrical Jacobian), in units of the
 * cell: cell j spans [j, j + 1], the mirrored ghosts across the axis with
 * their signed coordinates; the moments centred on the reconstructing cell.
 * Returns the weights of the cells `cells` for the point value at `x`
 * (relative to that cell's centre `c`).
 */
function cylindricalWeights(cells: readonly number[], c: number, x: number): number[] {
  const p = cells.length;
  // β[s][n] = (1/ΔV)∫(ξ − c)ⁿ ξ dξ over cell s; ∫(ξ − c)ⁿξ = (ξ − c)ⁿ⁺²/(n + 2) + c(ξ − c)ⁿ⁺¹/(n + 1).
  const moment = (a: number, b: number, n: number): number => {
    const f = (xi: number): number =>
      (xi - c) ** (n + 2) / (n + 2) + (c * (xi - c) ** (n + 1)) / (n + 1);
    return f(b) - f(a);
  };
  const m: number[][] = cells.map((j) => {
    const volume = (Math.pow(j + 1, 2) - Math.pow(j, 2)) / 2;
    return Array.from({ length: p }, (_, n) => moment(j, j + 1, n) / volume);
  });
  // Solve Bᵀw = (1, x, x², …) by Gaussian elimination with partial pivoting.
  const a: number[][] = Array.from({ length: p }, (_, n) => [
    ...cells.map((_, q) => m[q]?.[n] ?? 0),
    x ** n,
  ]);
  for (let col = 0; col < p; col++) {
    let pivot = col;
    for (let r = col + 1; r < p; r++)
      if (Math.abs(a[r]?.[col] ?? 0) > Math.abs(a[pivot]?.[col] ?? 0)) pivot = r;
    const tmp = a[col];
    a[col] = a[pivot] ?? [];
    a[pivot] = tmp ?? [];
    const rowC = a[col] ?? [];
    for (let r = 0; r < p; r++) {
      if (r === col) continue;
      const rowR = a[r] ?? [];
      const factor = (rowR[col] ?? 0) / (rowC[col] ?? 1);
      for (let q = col; q <= p; q++) rowR[q] = (rowR[q] ?? 0) - factor * (rowC[q] ?? 0);
    }
  }
  return a.map((row, q) => (row[p] ?? 0) / (row[q] ?? 1));
}

/**
 * Rule 1297's per-column coefficients: for the upper (+) and lower (−) face
 * of cell i, each three-cell candidate's weights and the linear weights that
 * make the three reproduce the five-cell reconstruction; and the weights of
 * the centred three-cell stencil for the value at the cell's centre.
 */
export interface RadialCoefficients {
  /** [side][k][q]: side 0 upper, 1 lower; candidate k on cells i − 2 + k … i + k. */
  readonly candidate: number[][][];
  /** [side][k]. */
  readonly linear: number[][];
  /** Cells i − 1, i, i + 1. */
  readonly centre: number[];
}

export function radialCoefficients(i: number): RadialCoefficients {
  const c = i + 0.5;
  const candidate: number[][][] = [];
  const linear: number[][] = [];
  for (const x of [0.5, -0.5]) {
    const cand = [0, 1, 2].map((k) => cylindricalWeights([i - 2 + k, i - 1 + k, i + k], c, x));
    const full = cylindricalWeights([i - 2, i - 1, i, i + 1, i + 2], c, x);
    // Least squares on the 5 × 3 system Σₖ dₖ·(candidate k placed on its cells) = full.
    const col = (k: number, row: number): number => {
      const q = row - k;
      return q >= 0 && q < 3 ? (cand[k]?.[q] ?? 0) : 0;
    };
    const ata = [0, 1, 2].map((k1) =>
      [0, 1, 2].map((k2) =>
        [0, 1, 2, 3, 4].reduce((sum, row) => sum + col(k1, row) * col(k2, row), 0)
      )
    );
    const atb = [0, 1, 2].map((k) =>
      [0, 1, 2, 3, 4].reduce((sum, row) => sum + col(k, row) * (full[row] ?? 0), 0)
    );
    // 3 × 3 solve by Cramer's rule (well conditioned: the columns are near-disjoint).
    const det = (m: number[][]): number =>
      (m[0]?.[0] ?? 0) *
        ((m[1]?.[1] ?? 0) * (m[2]?.[2] ?? 0) - (m[1]?.[2] ?? 0) * (m[2]?.[1] ?? 0)) -
      (m[0]?.[1] ?? 0) *
        ((m[1]?.[0] ?? 0) * (m[2]?.[2] ?? 0) - (m[1]?.[2] ?? 0) * (m[2]?.[0] ?? 0)) +
      (m[0]?.[2] ?? 0) *
        ((m[1]?.[0] ?? 0) * (m[2]?.[1] ?? 0) - (m[1]?.[1] ?? 0) * (m[2]?.[0] ?? 0));
    const d0 = det(ata);
    const d = [0, 1, 2].map(
      (k) => det(ata.map((row, r) => row.map((v, q) => (q === k ? (atb[r] ?? 0) : v)))) / d0
    );
    candidate.push(cand);
    linear.push(d);
  }
  return { candidate, linear, centre: cylindricalWeights([i - 1, i, i + 1], c, 0) };
}

/** x clamped to [0, 1] (NaN to 0). */
function clamp01(x: number): number {
  return x > 1 ? 1 : x > 0 ? x : 0;
}

/**
 * Rule 1297: the fifth-order WENO-Z value at a face of cell c (from the cells
 * a, b, c, d, e in order of r) with Mignone's weights for r-weighted averages
 * — each candidate's own, and linear weights that reproduce the five-cell
 * reconstruction — and Jiang and Shu's smoothness indicators; side 0 the
 * upper face, 1 the lower.
 */
export function weno5zCylindrical(
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  k: RadialCoefficients,
  side: 0 | 1
): number {
  const cand = k.candidate[side] ?? [];
  const lin = k.linear[side] ?? [];
  const v = [a, b, c, d, e];
  const q = [0, 1, 2].map((s) => {
    const w = cand[s] ?? [];
    return (
      (w[0] ?? 0) * (v[s] ?? 0) + (w[1] ?? 0) * (v[s + 1] ?? 0) + (w[2] ?? 0) * (v[s + 2] ?? 0)
    );
  });
  const b0 = (13 / 12) * (a - 2 * b + c) ** 2 + 0.25 * (a - 4 * b + 3 * c) ** 2;
  const b1 = (13 / 12) * (b - 2 * c + d) ** 2 + 0.25 * (b - d) ** 2;
  const b2 = (13 / 12) * (c - 2 * d + e) ** 2 + 0.25 * (3 * c - 4 * d + e) ** 2;
  const tau = Math.abs(b0 - b2);
  const w0 = (lin[0] ?? 0) * (1 + tau / (b0 + 1e-40));
  const w1 = (lin[1] ?? 0) * (1 + tau / (b1 + 1e-40));
  const w2 = (lin[2] ?? 0) * (1 + tau / (b2 + 1e-40));
  return (w0 * (q[0] ?? 0) + w1 * (q[1] ?? 0) + w2 * (q[2] ?? 0)) / (w0 + w1 + w2);
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
  /** How positivity is kept (rule 1277); 'mood' by default. */
  readonly limiter?: 'mood' | 'has';
  /** Rules 1304–1306: the ground's ghosts of p/β with the slope the vertical
   *  momentum equation imposes at the wall ('momentum', the default), or the
   *  plain mirror of the runs made before rule 1306. */
  readonly groundSlope?: 'mirror' | 'momentum';
}

/** Rule 1277's work arrays: each face's high-order and Lax–Friedrichs flux
 *  (mass, radial and vertical momentum, energy; radial faces first, face f
 *  of row j at j(nr + 1) + f, then vertical faces, face g of column i at
 *  (nr + 1)nz + g·nr + i), each cell's sources, and the floors ε. */
interface HasWork {
  readonly high: Float64Array;
  readonly lf: Float64Array;
  readonly source: Float64Array;
  epsRho: number;
  epsP: number;
}

/** A stage that could not restore positivity (rules 1264, 1268). */
class PositivityError extends Error {}

export class BlastSolver2D {
  readonly nr: number;
  readonly nz: number;
  readonly dx: number;
  readonly gamma: number;
  readonly cfl: number;
  readonly atmosphere: Atmosphere;
  readonly limiter: 'mood' | 'has';
  /** Rules 1304–1306: the ground's ghosts of p/β. */
  readonly groundSlope: 'mirror' | 'momentum';

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
  /** Steps done again with half the time step (rule 1268). */
  halvings = 0;
  /** Rule 1277: faces whose flux was blended (θ < 1), and reconstructed
   *  face pairs scaled towards their cell, summed over the stages. */
  limitedFaces = 0;
  scaledFaces = 0;

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
  private readonly work: HasWork | undefined;
  /** Rule 1297: per column i ∈ [−1, nr], the radial reconstruction's coefficients. */
  private readonly radial: RadialCoefficients[] | undefined;
  // Rule 1277's scratch: two cells' states and fluxes, and a limited flux.
  private readonly stL = new Float64Array(4);
  private readonly stR = new Float64Array(4);
  private readonly fxL = new Float64Array(4);
  private readonly fxR = new Float64Array(4);
  private readonly star = new Float64Array(4);

  constructor(grid: BlastGrid, atmosphere: Atmosphere, options: BlastOptions = {}) {
    const { nr, nz, dx } = grid;
    if (!(nr >= 4 && nz >= 4 && dx > 0)) throw new Error('blast2d: bad grid');
    this.nr = nr;
    this.nz = nz;
    this.dx = dx;
    this.gamma = options.gamma ?? 1.4;
    this.cfl = options.cfl ?? 0.4;
    this.limiter = options.limiter ?? 'mood';
    this.groundSlope = options.groundSlope ?? 'momentum';
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
    const faces = (nr + 1) * nz + nr * (nz + 1);
    this.work =
      this.limiter === 'has'
        ? {
            high: new Float64Array(4 * faces),
            lf: new Float64Array(4 * faces),
            source: new Float64Array(4 * n),
            epsRho: NaN,
            epsP: NaN,
          }
        : undefined;
    this.radial =
      this.limiter === 'has'
        ? Array.from({ length: nr + 2 }, (_, q) => radialCoefficients(q - 1))
        : undefined;
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
    // Rules 1304–1306: at the wall ∂p/∂z = −ρg, so q = p/(p₀β) has the slope
    // (q − ρ/(ρ₀α))/H there; the mirror corrected by it, q and ρ/(ρ₀α) taken
    // at the wall from the first two rows (rule 1316 (a)).
    const lift = this.groundSlope === 'momentum' ? (rho0 * this.atmosphere.g) / p0 : 0;
    for (let i = -G; i < nr + G; i++) {
      const first = G * stride + (i + G);
      const second = first + stride;
      const qw = 1.5 * (this.q4[first] ?? 0) - 0.5 * (this.q4[second] ?? 0);
      const rw = 1.5 * (this.q1[first] ?? 0) - 0.5 * (this.q1[second] ?? 0);
      const slope = lift * (qw - rw);
      for (let g = 1; g <= G; g++) {
        const inner = (G + (g - 1)) * stride + (i + G);
        const ghost = (G - g) * stride + (i + G);
        this.q1[ghost] = this.q1[inner] ?? 0;
        this.vu[ghost] = this.vu[inner] ?? 0;
        this.vv[ghost] = -(this.vv[inner] ?? 0);
        this.q4[ghost] =
          lift === 0
            ? (this.q4[inner] ?? 0)
            : (this.q4[inner] ?? 0) - 2 * slope * (g - 0.5) * this.dx;
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
    const { nr, nz } = this;
    const iLo = step === 1 ? -1 : 0;
    const iHi = step === 1 ? nr : nr - 1;
    const jLo = step === 1 ? 0 : -1;
    const jHi = step === 1 ? nz - 1 : nz;
    if (this.limiter !== 'has') {
      this.reconstructCells(step, iLo, iHi, jLo, jHi);
      return;
    }
    // Rule 1309 (e): the first and the last cell of each line have one face
    // no stencil reaches; those two stay componentwise (no flux reads them).
    if (step === 1) {
      this.reconstructCells(step, iLo, iLo, jLo, jHi);
      this.reconstructCells(step, iHi, iHi, jLo, jHi);
    } else {
      this.reconstructCells(step, iLo, iHi, jLo, jLo);
      this.reconstructCells(step, iLo, iHi, jHi, jHi);
    }
    this.reconstructCharacteristic(step);
    // Rule 1317 (e): the ghost below the wall (and beside the axis) takes as
    // its outer face the mirror of the first cell's, so rule 1280's ramp,
    // which reads both faces, treats the wall's face and its mirror alike.
    const { stride } = this;
    if (step === 1)
      for (let j = 0; j < nz; j++) {
        const inner = (j + G) * stride + G;
        const ghost = inner - 1;
        this.t1[ghost] = this.s1[inner] ?? 0;
        this.tu[ghost] = -(this.su[inner] ?? 0);
        this.tv[ghost] = this.sv[inner] ?? 0;
        this.t4[ghost] = this.s4[inner] ?? 0;
      }
    else
      for (let i = 0; i < nr; i++) {
        const inner = G * stride + (i + G);
        const ghost = inner - stride;
        this.t1[ghost] = this.s1[inner] ?? 0;
        this.tu[ghost] = this.su[inner] ?? 0;
        this.tv[ghost] = -(this.sv[inner] ?? 0);
        this.t4[ghost] = this.s4[inner] ?? 0;
      }
  }

  /** Each variable of w reconstructed on its own (the scheme before rule 1309). */
  private reconstructCells(step: number, iLo: number, iHi: number, jLo: number, jHi: number): void {
    const { stride } = this;
    const vars: [Float64Array, Float64Array, Float64Array][] = [
      [this.q1, this.s1, this.t1],
      [this.vu, this.su, this.tu],
      [this.vv, this.sv, this.tv],
      [this.q4, this.s4, this.t4],
    ];
    const s2 = 2 * step;
    const radial = step === 1 ? this.radial : undefined;
    for (let j = jLo; j <= jHi; j++)
      for (let i = iLo; i <= iHi; i++) {
        const k = (j + G) * stride + (i + G);
        const coefficients = radial?.[i + 1];
        for (const [w, up, down] of vars) {
          const a = w[k - s2] ?? 0;
          const b = w[k - step] ?? 0;
          const c = w[k] ?? 0;
          const d = w[k + step] ?? 0;
          const e = w[k + s2] ?? 0;
          if (coefficients === undefined) {
            up[k] = weno5z(a, b, c, d, e);
            down[k] = weno5z(e, d, c, b, a);
          } else {
            up[k] = weno5zCylindrical(a, b, c, d, e, coefficients, 0);
            down[k] = weno5zCylindrical(a, b, c, d, e, coefficients, 1);
          }
        }
      }
  }

  /**
   * Rule 1309 (e): the reconstruction in characteristic fields. At each face
   * between cells kl and kr = kl + step, the six cells' w are turned into
   * ρ = Aq₁ and p = Bq₄ (A = ρ₀α, B = p₀β of the row along r, of the face
   * along z) and projected on the left eigenvectors of the Euler equations
   * in primitive form at the face's mean state — p − ρ̄c̄uₙ, c̄²ρ − p, u_t,
   * p + ρ̄c̄uₙ — each field reconstructed by WENO-Z (rule 1297's weights along
   * r), and the two face values projected back.
   */
  private reconstructCharacteristic(step: number): void {
    const { nr, nz, stride, gamma } = this;
    const { rho0, p0 } = this.atmosphere;
    const radialDir = step === 1;
    const lines = radialDir ? nz : nr;
    const faces = radialDir ? nr : nz;
    const normal = radialDir ? this.vu : this.vv;
    const tangent = radialDir ? this.vv : this.vu;
    const upN = radialDir ? this.su : this.sv;
    const upT = radialDir ? this.sv : this.su;
    const downN = radialDir ? this.tu : this.tv;
    const downT = radialDir ? this.tv : this.tu;
    const { q1, q4, s1, s4, t1, t4 } = this;
    const x = [new Float64Array(6), new Float64Array(6), new Float64Array(6), new Float64Array(6)];
    const left = new Float64Array(4);
    const right = new Float64Array(4);
    for (let line = 0; line < lines; line++)
      for (let f = 0; f <= faces; f++) {
        let kl: number;
        let a: number;
        let b: number;
        if (radialDir) {
          kl = (line + G) * stride + (f - 1 + G);
          a = rho0 * (this.alphaC[line] ?? 0);
          b = p0 * (this.betaC[line] ?? 0);
        } else {
          kl = (f - 1 + G) * stride + (line + G);
          a = rho0 * (this.alphaF[f] ?? 0);
          b = p0 * (this.betaF[f] ?? 0);
        }
        const kr = kl + step;
        const rhoBar = 0.5 * a * ((q1[kl] ?? 0) + (q1[kr] ?? 0));
        const pBar = 0.5 * b * ((q4[kl] ?? 0) + (q4[kr] ?? 0));
        const c = Math.sqrt((gamma * pBar) / rhoBar);
        const z = rhoBar * c;
        const c2 = c * c;
        for (let m = 0; m < 6; m++) {
          const k = kl + (m - 2) * step;
          const p = b * (q4[k] ?? 0);
          const un = normal[k] ?? 0;
          (x[0] as Float64Array)[m] = p - z * un;
          (x[1] as Float64Array)[m] = c2 * a * (q1[k] ?? 0) - p;
          (x[2] as Float64Array)[m] = tangent[k] ?? 0;
          (x[3] as Float64Array)[m] = p + z * un;
        }
        const cl = radialDir ? this.radial?.[f] : undefined;
        const cr = radialDir ? this.radial?.[f + 1] : undefined;
        for (let q = 0; q < 4; q++) {
          const v = x[q] as Float64Array;
          const v0 = v[0] ?? 0;
          const v1 = v[1] ?? 0;
          const v2 = v[2] ?? 0;
          const v3 = v[3] ?? 0;
          const v4 = v[4] ?? 0;
          const v5 = v[5] ?? 0;
          left[q] =
            cl === undefined
              ? weno5z(v0, v1, v2, v3, v4)
              : weno5zCylindrical(v0, v1, v2, v3, v4, cl, 0);
          right[q] =
            cr === undefined
              ? weno5z(v5, v4, v3, v2, v1)
              : weno5zCylindrical(v1, v2, v3, v4, v5, cr, 1);
        }
        const pl = 0.5 * ((left[0] ?? 0) + (left[3] ?? 0));
        s1[kl] = ((left[1] ?? 0) + pl) / (c2 * a);
        upN[kl] = ((left[3] ?? 0) - (left[0] ?? 0)) / (2 * z);
        upT[kl] = left[2] ?? 0;
        s4[kl] = pl / b;
        const pr = 0.5 * ((right[0] ?? 0) + (right[3] ?? 0));
        t1[kr] = ((right[1] ?? 0) + pr) / (c2 * a);
        downN[kr] = ((right[3] ?? 0) - (right[0] ?? 0)) / (2 * z);
        downT[kr] = right[2] ?? 0;
        t4[kr] = pr / b;
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
    if (this.work !== undefined) return this.stepHas(this.work, maxDt);
    const { nr, nz, stride } = this;
    const sets: [Float64Array, Float64Array, Float64Array, Float64Array][] = [
      [this.rho, this.k0, this.d0, this.pre0],
      [this.mr, this.k1, this.d1, this.pre1],
      [this.mz, this.k2, this.d2, this.pre2],
      [this.en, this.k3, this.d3, this.pre3],
    ];
    this.low.fill(0);
    const speed = this.rhs();
    let dt = Math.min(this.cfl / speed, maxDt);
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
          throw new PositivityError('blast2d: a cell stays without positive density or pressure');
        }
        if (attempt >= 4)
          throw new PositivityError('blast2d: positivity not restored after five tries');
        this.redone += marked;
        for (const [u, , , pre] of sets) u.set(pre);
        this.rhs();
      }
    };
    for (const [u, k0] of sets) k0.set(u);
    // Rule 1268: a step whose stage cannot restore positivity starts again
    // from Uⁿ with half the time step, up to eight times.
    for (let halving = 0; ; halving++) {
      try {
        if (halving > 0) {
          for (const [u, k0] of sets) u.set(k0);
          this.low.fill(0);
          this.rhs();
        }
        stage(0, 1);
        this.rhs();
        stage(0.75, 0.25);
        this.rhs();
        stage(1 / 3, 2 / 3);
        break;
      } catch (error) {
        if (!(error instanceof PositivityError) || halving >= 8) throw error;
        dt /= 2;
        this.halvings++;
      }
    }
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

  // ---- rule 1277: Hu, Adams & Shu's continuous positivity limiter ----

  /** Rule 1280 (b), in place of rule 1277 (c)(3): each cell's two
   *  reconstructed faces of ρ/α and of p/β blended towards the cell's own
   *  value, y_c + t(y − y_c), t = 1 where the smaller face m is at least
   *  half the cell's value, 0 where m ≤ 0, 2m/y_c between; the velocities
   *  are not touched. */
  private scaleFaces(step: number): void {
    const { nr, nz, stride } = this;
    const iLo = step === 1 ? -1 : 0;
    const iHi = step === 1 ? nr : nr - 1;
    const jLo = step === 1 ? 0 : -1;
    const jHi = step === 1 ? nz - 1 : nz;
    const pairs: [Float64Array, Float64Array, Float64Array][] = [
      [this.q1, this.s1, this.t1],
      [this.q4, this.s4, this.t4],
    ];
    for (let j = jLo; j <= jHi; j++)
      for (let i = iLo; i <= iHi; i++) {
        const k = (j + G) * stride + (i + G);
        for (const [w, up, down] of pairs) {
          const c = w[k] ?? 0;
          const a = up[k] ?? 0;
          const b = down[k] ?? 0;
          const lo = Math.min(a, b);
          if (lo >= 0.5 * c) continue;
          const t = lo > 0 ? (2 * lo) / c : 0;
          up[k] = c + t * (a - c);
          down[k] = c + t * (b - c);
          this.scaledFaces++;
        }
      }
  }

  /** The flux of the Euler equations of a cell's state, along r (dir 0) or
   *  z (dir 1), into out[o..o+3]; returns the state's |normal velocity| + c. */
  private cellFlux(
    rho: number,
    mr: number,
    mz: number,
    en: number,
    dir: 0 | 1,
    out: Float64Array,
    o: number
  ): number {
    const u = mr / rho;
    const v = mz / rho;
    const p = (this.gamma - 1) * (en - 0.5 * rho * (u * u + v * v));
    const un = dir === 0 ? u : v;
    out[o] = rho * un;
    out[o + 1] = mr * un + (dir === 0 ? p : 0);
    out[o + 2] = mz * un + (dir === 1 ? p : 0);
    out[o + 3] = (en + p) * un;
    return Math.abs(un) + Math.sqrt((this.gamma * p) / rho);
  }

  /**
   * Rule 1277: the high-order flux (HLLC on the face states, scaled where
   * needed) and the Lax–Friedrichs flux (Hu, Adams & Shu's Eq. 12, with the
   * direction's largest |u| + c) at every face, and every cell's sources,
   * from the current state. Returns the interior's largest |u| + c and
   * |v| + c.
   */
  private fluxesHas(work: HasWork): { ar: number; az: number } {
    const { nr, nz, stride, dx, gamma } = this;
    const { rho0, p0 } = this.atmosphere;
    this.primitives();
    let ar = 0;
    let az = 0;
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nr; i++) {
        const k = (j + G) * stride + (i + G);
        const r = this.rho[k] ?? 0;
        const u = (this.mr[k] ?? 0) / r;
        const v = (this.mz[k] ?? 0) / r;
        const p = (gamma - 1) * ((this.en[k] ?? 0) - 0.5 * r * (u * u + v * v));
        const c = Math.sqrt((gamma * p) / r);
        if (Math.abs(u) + c > ar) ar = Math.abs(u) + c;
        if (Math.abs(v) + c > az) az = Math.abs(v) + c;
      }
    const out = this.flux;
    const { stL, stR } = this;

    // Radial faces: face f of row j between cells f − 1 and f; the axis face
    // (weight 0) is not needed, the outer ghost copies the last cell.
    this.reconstruct(1);
    this.scaleFaces(1);
    for (let j = 0; j < nz; j++) {
      const a = rho0 * (this.alphaC[j] ?? 0);
      const b = p0 * (this.betaC[j] ?? 0);
      const row = (j + G) * stride + G;
      for (let f = 1; f <= nr; f++) {
        const kl = row + f - 1;
        const kr = row + f;
        this.hllc(
          a * (this.s1[kl] ?? 0),
          this.su[kl] ?? 0,
          this.sv[kl] ?? 0,
          b * (this.s4[kl] ?? 0),
          a * (this.t1[kr] ?? 0),
          this.tu[kr] ?? 0,
          this.tv[kr] ?? 0,
          b * (this.t4[kr] ?? 0)
        );
        const o = 4 * (j * (nr + 1) + f);
        work.high[o] = out[0] ?? 0;
        work.high[o + 1] = out[1] ?? 0;
        work.high[o + 2] = out[2] ?? 0;
        work.high[o + 3] = out[3] ?? 0;
        this.loadState(kl, stL, false);
        this.loadState(f < nr ? kr : kl, stR, false);
        this.laxFriedrichs(work, o, ar, 0);
      }
    }

    // Vertical faces: face g of column i between cells g − 1 and g; the
    // ground's ghost mirrors the first cell, the top's copies the last.
    // Rules 1297–1298: the axisymmetric source p/R as a volume average — the
    // parabola through the cell's two radial face values that keeps its
    // r-weighted average, integrated plainly over the cell.
    for (let j = 0; j < nz; j++) {
      const b = p0 * (this.betaC[j] ?? 0);
      for (let i = 0; i < nr; i++) {
        const k = (j + G) * stride + (i + G);
        const radius = this.rC[i] ?? 0;
        const kappa = dx / radius;
        const lower = this.t4[k] ?? 0;
        const upper = this.s4[k] ?? 0;
        const c1 = upper - lower;
        const c2 = 6 * ((lower + upper) / 2 - (this.q4[k] ?? 0) + (kappa * c1) / 12);
        const c0 = (lower + upper) / 2 - c2 / 4;
        work.source[4 * k + 1] = (b * (c0 + c2 / 12)) / radius;
      }
    }

    this.reconstruct(stride);
    this.scaleFaces(stride);
    const off = (nr + 1) * nz;
    for (let g = 0; g <= nz; g++) {
      const a = rho0 * (this.alphaF[g] ?? 0);
      const b = p0 * (this.betaF[g] ?? 0);
      for (let i = 0; i < nr; i++) {
        const kl = (g - 1 + G) * stride + (i + G);
        const kr = kl + stride;
        this.hllc(
          a * (this.s1[kl] ?? 0),
          this.sv[kl] ?? 0,
          this.su[kl] ?? 0,
          b * (this.s4[kl] ?? 0),
          a * (this.t1[kr] ?? 0),
          this.tv[kr] ?? 0,
          this.tu[kr] ?? 0,
          b * (this.t4[kr] ?? 0)
        );
        const o = 4 * (off + g * nr + i);
        work.high[o] = out[0] ?? 0;
        work.high[o + 1] = out[2] ?? 0;
        work.high[o + 2] = out[1] ?? 0;
        work.high[o + 3] = out[3] ?? 0;
        if (g === 0) {
          this.loadState(kr, stR, false);
          this.loadState(kr, stL, true);
        } else {
          this.loadState(kl, stL, false);
          this.loadState(g < nz ? kr : kl, stR, false);
        }
        this.laxFriedrichs(work, o, az, 1);
      }
    }

    // Sources: the axisymmetric term, and gravity in the well-balanced form.
    const pr = p0 / rho0;
    for (let j = 0; j < nz; j++) {
      const lift =
        (pr * ((this.betaF[j + 1] ?? 0) - (this.betaF[j] ?? 0))) / (dx * (this.alphaC[j] ?? 0));
      for (let i = 0; i < nr; i++) {
        const k = (j + G) * stride + (i + G);
        const force = (this.rho[k] ?? 0) * lift;
        work.source[4 * k] = 0;
        work.source[4 * k + 2] = force;
        work.source[4 * k + 3] = (this.vv[k] ?? 0) * force;
      }
    }
    return { ar, az };
  }

  /** A cell's conserved state into out, its vertical momentum mirrored for
   *  the ground's ghost. */
  private loadState(k: number, out: Float64Array, mirror: boolean): void {
    out[0] = this.rho[k] ?? 0;
    out[1] = this.mr[k] ?? 0;
    out[2] = (mirror ? -1 : 1) * (this.mz[k] ?? 0);
    out[3] = this.en[k] ?? 0;
  }

  /** Hu, Adams & Shu's Eq. 12 between the states in stL and stR, with the
   *  direction's largest |u| + c, into work.lf[o..o+3]. */
  private laxFriedrichs(work: HasWork, o: number, a: number, dir: 0 | 1): void {
    const { stL, stR, fxL, fxR } = this;
    this.cellFlux(stL[0] ?? 0, stL[1] ?? 0, stL[2] ?? 0, stL[3] ?? 0, dir, fxL, 0);
    this.cellFlux(stR[0] ?? 0, stR[1] ?? 0, stR[2] ?? 0, stR[3] ?? 0, dir, fxR, 0);
    for (let q = 0; q < 4; q++)
      work.lf[o + q] =
        0.5 * ((fxL[q] ?? 0) + (fxR[q] ?? 0)) - 0.5 * a * ((stR[q] ?? 0) - (stL[q] ?? 0));
  }

  /** A piece's pressure: Uₖ + σF + ΔtSₖ, F read at flux[at..at+3]. */
  private piecePressure(
    work: HasWork,
    k: number,
    sigma: number,
    flux: Float64Array,
    at: number,
    dt: number
  ): number {
    const s = 4 * k;
    const r = (this.rho[k] ?? 0) + sigma * (flux[at] ?? 0);
    const a = (this.mr[k] ?? 0) + sigma * (flux[at + 1] ?? 0) + dt * (work.source[s + 1] ?? 0);
    const b = (this.mz[k] ?? 0) + sigma * (flux[at + 2] ?? 0) + dt * (work.source[s + 2] ?? 0);
    const e = (this.en[k] ?? 0) + sigma * (flux[at + 3] ?? 0) + dt * (work.source[s + 3] ?? 0);
    return r > 0 ? (this.gamma - 1) * (e - (0.5 * (a * a + b * b)) / r) : -Infinity;
  }

  /**
   * Rule 1277: Hu, Adams & Shu's two limiters at one face, in place: θ from
   * density, then from pressure (with the sources), from the cells on either
   * side (−1 for a ghost), the pieces Uₖ ∓ 2λF; the face's flux becomes
   * (1 − θ)F_LF + θF̂.
   */
  private limitFace(
    work: HasWork,
    o: number,
    lambda: number,
    kl: number,
    kr: number,
    dt: number
  ): void {
    const { high, lf } = work;
    const star = this.star;
    const two = 2 * lambda;
    // Density: the left cell's piece is Uₖ − 2λF, the right's Uₖ + 2λF.
    let thetaRho = 1;
    for (let side = 0; side < 2; side++) {
      const k = side === 0 ? kl : kr;
      if (k < 0) continue;
      const sigma = side === 0 ? -two : two;
      const rho = this.rho[k] ?? 0;
      const hi = rho + sigma * (high[o] ?? 0);
      if (hi >= work.epsRho) continue;
      const low = rho + sigma * (lf[o] ?? 0);
      thetaRho = Math.min(thetaRho, clamp01((low - work.epsRho) / (low - hi)));
    }
    for (let q = 0; q < 4; q++) {
      const l = lf[o + q] ?? 0;
      star[q] = l + thetaRho * ((high[o + q] ?? 0) - l);
    }
    // Pressure, on the flux so limited, each piece with its cell's source.
    let thetaP = 1;
    for (let side = 0; side < 2; side++) {
      const k = side === 0 ? kl : kr;
      if (k < 0) continue;
      const sigma = side === 0 ? -two : two;
      const pStar = this.piecePressure(work, k, sigma, star, 0, dt);
      if (pStar >= work.epsP) continue;
      const pLow = this.piecePressure(work, k, sigma, lf, o, dt);
      thetaP = Math.min(thetaP, clamp01((pLow - work.epsP) / (pLow - pStar)));
    }
    if (thetaRho * thetaP < 1) this.limitedFaces++;
    for (let q = 0; q < 4; q++) {
      const l = lf[o + q] ?? 0;
      high[o + q] = l + thetaP * ((star[q] ?? 0) - l);
    }
  }

  /** Rule 1277: limit every face, gather the right-hand side and take the
   *  stage U = keep·K0 + add·(PRE + ΔtL); a cell left unsound fails the run. */
  private stageHas(
    work: HasWork,
    dt: number,
    keep: number,
    add: number,
    ar: number,
    az: number
  ): void {
    const { nr, nz, stride, dx } = this;
    const lambdaR = (dt * (ar + az)) / (ar * dx);
    const lambdaZ = (dt * (ar + az)) / (az * dx);
    for (let j = 0; j < nz; j++)
      for (let f = 1; f <= nr; f++) {
        const row = (j + G) * stride + G;
        this.limitFace(
          work,
          4 * (j * (nr + 1) + f),
          lambdaR,
          row + f - 1,
          f < nr ? row + f : -1,
          dt
        );
      }
    const off = (nr + 1) * nz;
    for (let g = 0; g <= nz; g++)
      for (let i = 0; i < nr; i++) {
        const kl = (g - 1 + G) * stride + (i + G);
        this.limitFace(
          work,
          4 * (off + g * nr + i),
          lambdaZ,
          g > 0 ? kl : -1,
          g < nz ? kl + stride : -1,
          dt
        );
      }
    // The divergence of the limited fluxes, written out per component (no
    // iterators in the loops: they cost more than the arithmetic).
    const { d0, d1, d2, d3, rho, mr, mz, en, k0, k1, k2, k3 } = this;
    const h = work.high;
    const src = work.source;
    d0.fill(0);
    d1.fill(0);
    d2.fill(0);
    d3.fill(0);
    for (let j = 0; j < nz; j++) {
      const row = (j + G) * stride + G;
      for (let f = 1; f <= nr; f++) {
        const o = 4 * (j * (nr + 1) + f);
        const area = this.rF[f] ?? 0;
        const kl = row + f - 1;
        const kr = row + f;
        const left = area / ((this.rC[f - 1] ?? 0) * dx);
        const x0 = h[o] ?? 0;
        const x1 = h[o + 1] ?? 0;
        const x2 = h[o + 2] ?? 0;
        const x3 = h[o + 3] ?? 0;
        d0[kl] = (d0[kl] ?? 0) - x0 * left;
        d1[kl] = (d1[kl] ?? 0) - x1 * left;
        d2[kl] = (d2[kl] ?? 0) - x2 * left;
        d3[kl] = (d3[kl] ?? 0) - x3 * left;
        if (f < nr) {
          const right = area / ((this.rC[f] ?? 0) * dx);
          d0[kr] = (d0[kr] ?? 0) + x0 * right;
          d1[kr] = (d1[kr] ?? 0) + x1 * right;
          d2[kr] = (d2[kr] ?? 0) + x2 * right;
          d3[kr] = (d3[kr] ?? 0) + x3 * right;
        }
      }
    }
    for (let g = 0; g <= nz; g++)
      for (let i = 0; i < nr; i++) {
        const o = 4 * (off + g * nr + i);
        const kl = (g - 1 + G) * stride + (i + G);
        const kr = kl + stride;
        const x0 = (h[o] ?? 0) / dx;
        const x1 = (h[o + 1] ?? 0) / dx;
        const x2 = (h[o + 2] ?? 0) / dx;
        const x3 = (h[o + 3] ?? 0) / dx;
        if (g > 0) {
          d0[kl] = (d0[kl] ?? 0) - x0;
          d1[kl] = (d1[kl] ?? 0) - x1;
          d2[kl] = (d2[kl] ?? 0) - x2;
          d3[kl] = (d3[kl] ?? 0) - x3;
        }
        if (g < nz) {
          d0[kr] = (d0[kr] ?? 0) + x0;
          d1[kr] = (d1[kr] ?? 0) + x1;
          d2[kr] = (d2[kr] ?? 0) + x2;
          d3[kr] = (d3[kr] ?? 0) + x3;
        }
      }
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nr; i++) {
        const k = (j + G) * stride + (i + G);
        const s = 4 * k;
        rho[k] = keep * (k0[k] ?? 0) + add * ((rho[k] ?? 0) + dt * ((d0[k] ?? 0) + (src[s] ?? 0)));
        mr[k] =
          keep * (k1[k] ?? 0) + add * ((mr[k] ?? 0) + dt * ((d1[k] ?? 0) + (src[s + 1] ?? 0)));
        mz[k] =
          keep * (k2[k] ?? 0) + add * ((mz[k] ?? 0) + dt * ((d2[k] ?? 0) + (src[s + 2] ?? 0)));
        en[k] =
          keep * (k3[k] ?? 0) + add * ((en[k] ?? 0) + dt * ((d3[k] ?? 0) + (src[s + 3] ?? 0)));
      }
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nr; i++)
        if (!this.sound((j + G) * stride + (i + G)))
          throw new Error(
            `blast2d: rule 1277 -- cell (${String(i)}, ${String(j)}) left without positive density or pressure at t = ${String(this.time)} s`
          );
  }

  /** One step with rule 1277's limiter; returns Δt (s). */
  private stepHas(work: HasWork, maxDt: number): number {
    const { nr, nz, stride } = this;
    if (Number.isNaN(work.epsRho)) {
      // ε = min(10⁻¹³, the initial minimum), density and pressure (SI).
      let rhoMin = Infinity;
      let pMin = Infinity;
      for (let j = 0; j < nz; j++)
        for (let i = 0; i < nr; i++) {
          rhoMin = Math.min(rhoMin, this.rho[(j + G) * stride + (i + G)] ?? 0);
          pMin = Math.min(pMin, this.pressure(i, j));
        }
      work.epsRho = Math.min(1e-13, rhoMin);
      work.epsP = Math.min(1e-13, pMin);
    }
    let { ar, az } = this.fluxesHas(work);
    const dt = Math.min((this.cfl * this.dx) / (ar + az), maxDt);
    if (!(dt > 0 && Number.isFinite(dt))) throw new Error(`blast2d: time step ${String(dt)}`);
    this.k0.set(this.rho);
    this.k1.set(this.mr);
    this.k2.set(this.mz);
    this.k3.set(this.en);
    // U¹ = Uⁿ + ΔtL(Uⁿ); U² = ¾Uⁿ + ¼(U¹ + ΔtL(U¹)); Uⁿ⁺¹ = ⅓Uⁿ + ⅔(U² + ΔtL(U²)),
    // each stage's fluxes limited on its own state and speeds.
    this.stageHas(work, dt, 0, 1, ar, az);
    ({ ar, az } = this.fluxesHas(work));
    this.stageHas(work, dt, 0.75, 0.25, ar, az);
    ({ ar, az } = this.fluxesHas(work));
    this.stageHas(work, dt, 1 / 3, 2 / 3, ar, az);
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
