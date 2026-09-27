/**
 * The blast solver on the GPU (rule 1270 of `validation/blastSolverRules.ts`):
 * the host of `kernels.ts`. It starts from the reference solver's own initial
 * state (the atmosphere at rest and the source, `../solver.ts`, in double
 * precision), turned into deviations from the atmosphere at rest, and steps it
 * with the reference's logic — the time step from the fastest signal, the
 * third-order Runge–Kutta, rule 1264's a posteriori first-order fall-back and
 * rule 1268's halving of the step — in single precision, the state and its
 * copies within a step held as double-floats (rule 1272).
 */

import type { BlastSolver2D } from '../solver.js';
import { BLAST2D_WGSL, WORKGROUP } from './kernels.js';
import { BUFFER, MAP_READ, type GpuBuffer, type GpuDevice } from './webgpu.js';

const G = 3;
const KERNELS = [
  'primitives',
  'ghostsR',
  'ghostsZ',
  'reconR',
  'reconZ',
  'fluxR',
  'fluxZ',
  'rhs',
  'stage',
  'check',
  'peaks',
  'reduceMax',
  'dfCheck',
  'scaleR',
  'scaleZ',
  'limitR',
  'limitZ',
  'reduceMaxV',
] as const;
type Kernel = (typeof KERNELS)[number];

/** A stage that could not restore positivity (rules 1264, 1268). */
class PositivityError extends Error {}

export class BlastSolverGpu {
  readonly nr: number;
  readonly nz: number;
  readonly dx: number;
  readonly gamma: number;
  readonly cfl: number;
  time = 0;
  steps = 0;
  redone = 0;
  halvings = 0;

  private readonly device: GpuDevice;
  private readonly stride: number;
  private readonly cells: number;
  private readonly interior: number;
  private readonly pipelines: Record<Kernel, unknown>;
  private readonly bind: unknown;
  private readonly params: GpuBuffer;
  private readonly u: GpuBuffer;
  private readonly k0: GpuBuffer;
  private readonly pre: GpuBuffer;
  private readonly uLo: GpuBuffer;
  private readonly k0Lo: GpuBuffer;
  private readonly preLo: GpuBuffer;
  private readonly s: GpuBuffer;
  private readonly t: GpuBuffer;
  private readonly low: GpuBuffer;
  private readonly count: GpuBuffer;
  private readonly peak: GpuBuffer;
  private readonly speed: GpuBuffer;
  private readonly readback: GpuBuffer;
  private readonly partials: number;
  private readonly pBar0: number;

  /** Rule 1277's limiter in place of the fall-backs. */
  readonly has: boolean;
  private readonly speedV: GpuBuffer;
  private readonly flux: GpuBuffer;
  private readonly epsRho: number;
  private readonly epsP: number;
  private lamR = 0;
  private lamZ = 0;
  private ar = 0;
  private az = 0;

  constructor(device: GpuDevice, reference: BlastSolver2D, options: { limiter?: 'has' } = {}) {
    this.device = device;
    this.nr = reference.nr;
    this.nz = reference.nz;
    this.dx = reference.dx;
    this.gamma = reference.gamma;
    this.cfl = reference.cfl;
    const { nr, nz, dx, gamma } = this;
    this.stride = nr + 2 * G;
    this.cells = this.stride * (nz + 2 * G);
    this.interior = nr * nz;
    this.partials = Math.ceil(this.interior / WORKGROUP);
    const atm = reference.atmosphere;
    this.pBar0 = reference.backgroundPressure(0);

    // The initial state as deviations from the atmosphere at rest, each
    // split into its high and low single-precision halves.
    const state = new Float32Array(4 * this.cells);
    const stateLo = new Float32Array(4 * this.cells);
    for (let j = 0; j < nz; j++) {
      const rhoBar = reference.backgroundDensity(j);
      const eBar = reference.backgroundPressure(j) / (gamma - 1);
      for (let i = 0; i < nr; i++) {
        const k = reference.index(i, j);
        const dev = [
          (reference.rho[k] ?? 0) - rhoBar,
          reference.mr[k] ?? 0,
          reference.mz[k] ?? 0,
          (reference.en[k] ?? 0) - eBar,
        ];
        for (let c = 0; c < 4; c++) {
          const x = dev[c] ?? 0;
          const hi = Math.fround(x);
          state[4 * k + c] = hi;
          stateLo[4 * k + c] = x - hi;
        }
      }
    }
    // The background by row (ρ̄, p̄, lift) and by vertical face (ρ̄, p̄).
    const row = new Float32Array(4 * nz);
    for (let j = 0; j < nz; j++) {
      const bf = atm.beta((j + 1) * dx) - atm.beta(j * dx);
      row[4 * j] = atm.rho0 * atm.alpha((j + 0.5) * dx);
      row[4 * j + 1] = atm.p0 * atm.beta((j + 0.5) * dx);
      row[4 * j + 2] = ((atm.p0 / atm.rho0) * bf) / (dx * atm.alpha((j + 0.5) * dx));
    }
    const face = new Float32Array(4 * (nz + 1));
    for (let g = 0; g <= nz; g++) {
      face[4 * g] = atm.rho0 * atm.alpha(g * dx);
      face[4 * g + 1] = atm.p0 * atm.beta(g * dx);
    }

    const storage = BUFFER.STORAGE | BUFFER.COPY_SRC | BUFFER.COPY_DST;
    const make = (bytes: number, usage: number = storage): GpuBuffer =>
      device.createBuffer({ size: Math.max(16, bytes), usage });
    const vec4s = 16 * this.cells;
    this.params = make(80, BUFFER.UNIFORM | BUFFER.COPY_DST);
    this.has = options.limiter === 'has';
    // Rule 1277's floors: min(10⁻¹³, the initial minimum), as the reference.
    let rhoMin = Infinity;
    let pMin = Infinity;
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nr; i++) {
        rhoMin = Math.min(rhoMin, reference.rho[reference.index(i, j)] ?? 0);
        pMin = Math.min(pMin, reference.pressure(i, j));
      }
    this.epsRho = Math.min(1e-13, rhoMin);
    this.epsP = Math.min(1e-13, pMin);
    this.u = make(vec4s);
    const w = make(vec4s);
    this.s = make(vec4s);
    this.t = make(vec4s);
    this.flux = make(16 * ((nr + 1) * nz + nr * (nz + 1)));
    const flux = this.flux;
    const d = make(vec4s);
    this.k0 = make(vec4s);
    this.pre = make(vec4s);
    this.uLo = make(vec4s);
    this.k0Lo = make(vec4s);
    this.preLo = make(vec4s);
    const rowBuffer = make(row.byteLength);
    const faceBuffer = make(face.byteLength);
    this.low = make(4 * this.cells);
    this.speed = make(4 * (this.interior + this.partials));
    this.speedV = make(4 * (this.interior + this.partials));
    this.count = make(16);
    this.peak = make(16 * nr);
    this.readback = make(
      Math.max(4 * this.partials, 16, 16 * nr),
      BUFFER.MAP_READ | BUFFER.COPY_DST
    );
    device.queue.writeBuffer(this.u, 0, state);
    device.queue.writeBuffer(this.uLo, 0, stateLo);
    device.queue.writeBuffer(rowBuffer, 0, row);
    device.queue.writeBuffer(faceBuffer, 0, face);

    const module = device.createShaderModule({ code: BLAST2D_WGSL });
    const pipelines = {} as Record<Kernel, unknown>;
    for (const name of KERNELS)
      pipelines[name] = device.createComputePipeline({
        layout: 'auto',
        compute: { module, entryPoint: name },
      });
    this.pipelines = pipelines;
    // One bind group per pipeline ('auto' layouts differ); the buffers are the same.
    const buffers = [
      this.params,
      this.u,
      w,
      this.s,
      this.t,
      flux,
      d,
      this.k0,
      this.pre,
      rowBuffer,
      faceBuffer,
      this.low,
      this.speed,
      this.count,
      this.peak,
      this.uLo,
      this.k0Lo,
      this.preLo,
      this.speedV,
    ];
    const groups = {} as Record<Kernel, unknown>;
    for (const name of KERNELS) {
      const pipeline = pipelines[name] as { getBindGroupLayout(i: number): unknown };
      groups[name] = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: buffers
          .map((buffer, binding) => ({ binding, resource: { buffer } }))
          .filter((e) => usedBindings(name).includes(e.binding)),
      });
    }
    this.bind = groups;
    this.setParams(0, 0, 0);
  }

  private setParams(dt: number, keep: number, add: number): void {
    const data = new ArrayBuffer(80);
    const ints = new Int32Array(data, 0, 4);
    const floats = new Float32Array(data, 16, 14);
    const flags = new Uint32Array(data, 72, 2);
    ints[0] = this.nr;
    ints[1] = this.nz;
    ints[2] = this.stride;
    // ints[3]: the zero that makes the error-free transformations opaque.
    floats[0] = this.dx;
    floats[1] = this.gamma;
    floats[2] = dt;
    // The stage's weights (3/4, 1/3, …) as double-floats.
    const keepHi = Math.fround(keep);
    const addHi = Math.fround(add);
    floats[3] = keepHi;
    floats[4] = keep - keepHi;
    floats[5] = addHi;
    floats[6] = add - addHi;
    floats[7] = this.time;
    floats[8] = this.lamR;
    floats[9] = this.lamZ;
    floats[10] = this.epsRho;
    floats[11] = this.epsP;
    floats[12] = this.ar;
    floats[13] = this.az;
    flags[0] = this.has ? 1 : 0;
    this.device.queue.writeBuffer(this.params, 0, data);
  }

  private dispatch(names: [Kernel, number][]): void {
    const encoder = this.device.createCommandEncoder();
    const groups = this.bind as Record<Kernel, unknown>;
    for (const [name, threads] of names) {
      const pass = encoder.beginComputePass();
      pass.setPipeline(this.pipelines[name]);
      pass.setBindGroup(0, groups[name]);
      pass.dispatchWorkgroups(Math.ceil(threads / WORKGROUP));
      pass.end();
    }
    this.device.queue.submit([encoder.finish()]);
  }

  /** The right-hand side of the current state (and each cell's signal). */
  private rhs(): void {
    const { nr, nz } = this;
    this.dispatch([
      ['primitives', this.interior],
      ['ghostsR', nz],
      ['ghostsZ', nr + 2 * G],
      ['reconR', (nr + 2) * nz],
      ['fluxR', (nr + 1) * nz],
      ['reconZ', nr * (nz + 2)],
      ['fluxZ', nr * (nz + 1)],
      ['rhs', this.interior],
    ]);
  }

  private async fastest(): Promise<number> {
    this.dispatch([['reduceMax', this.interior]]);
    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(this.speed, 4 * this.interior, this.readback, 0, 4 * this.partials);
    this.device.queue.submit([encoder.finish()]);
    await this.readback.mapAsync(MAP_READ, 0, 4 * this.partials);
    const values = new Float32Array(this.readback.getMappedRange(0, 4 * this.partials).slice(0));
    this.readback.unmap();
    let top = 0;
    for (const v of values) if (v > top || Number.isNaN(v)) top = v;
    return top;
  }

  /** Copies a state, both halves. */
  private copy(from: [GpuBuffer, GpuBuffer], to: [GpuBuffer, GpuBuffer]): void {
    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(from[0], 0, to[0], 0, 16 * this.cells);
    encoder.copyBufferToBuffer(from[1], 0, to[1], 0, 16 * this.cells);
    this.device.queue.submit([encoder.finish()]);
  }

  private get uPair(): [GpuBuffer, GpuBuffer] {
    return [this.u, this.uLo];
  }

  private get prePair(): [GpuBuffer, GpuBuffer] {
    return [this.pre, this.preLo];
  }

  private get k0Pair(): [GpuBuffer, GpuBuffer] {
    return [this.k0, this.k0Lo];
  }

  /**
   * Rule 1272's check, before the kernels are trusted: 4 096 pairs of
   * single-precision numbers through the GPU's error-free sum and product;
   * returns how many came back inexact (each checked in double precision,
   * where both are exact for these magnitudes).
   */
  async errorFreeCheck(): Promise<{ pairs: number; sumBad: number; prodBad: number }> {
    const m = Math.min(4096, Math.floor(this.cells / 4));
    const input = new Float32Array(8 * m);
    let seed = 12345;
    const random = (): number => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let n = 0; n < input.length; n++)
      input[n] = (random() < 0.5 ? -1 : 1) * 10 ** (6 * random() - 3) * (1 + random());
    this.device.queue.writeBuffer(this.s, 0, input);
    this.setParams(0, 0, 0);
    this.dispatch([['dfCheck', m]]);
    const bytes = 64 * m;
    const staging = this.device.createBuffer({
      size: bytes,
      usage: BUFFER.MAP_READ | BUFFER.COPY_DST,
    });
    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(this.t, 0, staging, 0, bytes);
    this.device.queue.submit([encoder.finish()]);
    await staging.mapAsync(MAP_READ);
    const out = new Float32Array(staging.getMappedRange().slice(0));
    staging.unmap();
    staging.destroy();
    let sumBad = 0;
    let prodBad = 0;
    for (let n = 0; n < 4 * m; n++) {
      const a = input[2 * 4 * Math.floor(n / 4) + (n % 4)] ?? 0;
      const b = input[2 * 4 * Math.floor(n / 4) + 4 + (n % 4)] ?? 0;
      const t = 16 * Math.floor(n / 4) + (n % 4);
      const sHi = out[t] ?? 0;
      const sLo = out[t + 4] ?? 0;
      const pHi = out[t + 8] ?? 0;
      const pLo = out[t + 12] ?? 0;
      if (sHi !== Math.fround(a + b) || sHi + sLo !== a + b) sumBad++;
      if (pHi !== Math.fround(a * b) || pHi + pLo !== a * b) prodBad++;
    }
    return { pairs: 4 * m, sumBad, prodBad };
  }

  private async counts(): Promise<[number, number]> {
    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(this.count, 0, this.readback, 0, 16);
    encoder.clearBuffer(this.count, 0, 8);
    this.device.queue.submit([encoder.finish()]);
    await this.readback.mapAsync(MAP_READ, 0, 16);
    const c = new Uint32Array(this.readback.getMappedRange(0, 16).slice(0));
    this.readback.unmap();
    return [c[0] ?? 0, c[1] ?? 0];
  }

  /** A stage from its own starting state, with rule 1264's fall-back. */
  private async stage(dt: number, keep: number, add: number): Promise<void> {
    this.copy(this.uPair, this.prePair);
    for (let attempt = 0; ; attempt++) {
      this.setParams(dt, keep, add);
      this.dispatch([
        ['stage', this.interior],
        ['check', this.interior],
      ]);
      const [marked, stillBad] = await this.counts();
      if (marked === 0) {
        if (stillBad > 0) throw new PositivityError('blast2d gpu: a cell stays unsound');
        return;
      }
      if (attempt >= 4) throw new PositivityError('blast2d gpu: positivity not restored');
      this.redone += marked;
      this.copy(this.prePair, this.uPair);
      this.rhs();
    }
  }

  /** One step; returns Δt (s). */
  /** Rule 1277: the interior's largest |u| + c and |v| + c. */
  private async fastestPair(): Promise<{ ar: number; az: number }> {
    this.dispatch([
      ['reduceMax', this.interior],
      ['reduceMaxV', this.interior],
    ]);
    const bytes = 4 * this.partials;
    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(this.speed, 4 * this.interior, this.readback, 0, bytes);
    this.device.queue.submit([encoder.finish()]);
    await this.readback.mapAsync(MAP_READ, 0, bytes);
    const r = new Float32Array(this.readback.getMappedRange(0, bytes).slice(0));
    this.readback.unmap();
    const encoder2 = this.device.createCommandEncoder();
    encoder2.copyBufferToBuffer(this.speedV, 4 * this.interior, this.readback, 0, bytes);
    this.device.queue.submit([encoder2.finish()]);
    await this.readback.mapAsync(MAP_READ, 0, bytes);
    const z = new Float32Array(this.readback.getMappedRange(0, bytes).slice(0));
    this.readback.unmap();
    let ar = 0;
    let az = 0;
    for (const v of r) if (v > ar || Number.isNaN(v)) ar = v;
    for (const v of z) if (v > az || Number.isNaN(v)) az = v;
    return { ar, az };
  }

  /** One step with rule 1277's limiter: every stage's fluxes blended on its
   *  own state and speeds; a cell left unsound fails the run. Returns Δt (s). */
  private async stepHas(maxDt: number, force = false): Promise<number> {
    const { nr, nz } = this;
    this.clearLow();
    this.setParams(0, 0, 0);
    this.dispatch([['primitives', this.interior]]);
    ({ ar: this.ar, az: this.az } = await this.fastestPair());
    // A diagnostic may impose the step (the reference's), `force`.
    const dt = Math.fround(
      force ? maxDt : Math.min((this.cfl * this.dx) / (this.ar + this.az), maxDt)
    );
    if (!(dt > 0 && Number.isFinite(dt))) throw new Error(`blast2d gpu: time step ${String(dt)}`);
    this.copy(this.uPair, this.k0Pair);
    const stages: [number, number][] = [
      [0, 1],
      [0.75, 0.25],
      [1 / 3, 2 / 3],
    ];
    for (const [n, [keep, add]] of stages.entries()) {
      if (n > 0) {
        this.dispatch([['primitives', this.interior]]);
        ({ ar: this.ar, az: this.az } = await this.fastestPair());
      }
      this.lamR = (dt * (this.ar + this.az)) / (this.ar * this.dx);
      this.lamZ = (dt * (this.ar + this.az)) / (this.az * this.dx);
      this.setParams(dt, keep, add);
      this.copy(this.uPair, this.prePair);
      this.dispatch([
        ['ghostsR', nz],
        ['ghostsZ', nr + 2 * G],
        ['reconR', (nr + 2) * nz],
        ['scaleR', (nr + 2) * nz],
        ['fluxR', (nr + 1) * nz],
        ['reconZ', nr * (nz + 2)],
        ['scaleZ', nr * (nz + 2)],
        ['fluxZ', nr * (nz + 1)],
        ['limitR', nr * nz],
        ['limitZ', nr * (nz + 1)],
        ['rhs', this.interior],
        ['stage', this.interior],
        ['check', this.interior],
      ]);
      const [marked, stillBad] = await this.counts();
      if (marked > 0 || stillBad > 0)
        throw new Error(
          `blast2d gpu: rule 1277 -- ${String(marked + stillBad)} cells left without positive density or pressure at t = ${String(this.time)} s, stage ${String(n + 1)} of step ${String(this.steps + 1)}`
        );
    }
    this.time += dt;
    this.steps++;
    this.setParams(dt, 0, 0);
    this.dispatch([['peaks', this.nr]]);
    return dt;
  }

  /** A diagnostic: the first stage of a step with an imposed Δt, up to the
   *  fluxes; returns the fluxes before and after rule 1277's limiter
   *  (deviation form) and the stage's speeds. */
  async debugFirstStage(
    dt: number,
    stage = 1
  ): Promise<{ before: Float32Array; after: Float32Array; ar: number; az: number }> {
    const { nr, nz } = this;
    this.clearLow();
    this.setParams(0, 0, 0);
    if (stage === 2) {
      // The first stage whole, as stepHas takes it, then the second's fluxes.
      this.dispatch([['primitives', this.interior]]);
      ({ ar: this.ar, az: this.az } = await this.fastestPair());
      this.copy(this.uPair, this.k0Pair);
      this.lamR = (dt * (this.ar + this.az)) / (this.ar * this.dx);
      this.lamZ = (dt * (this.ar + this.az)) / (this.az * this.dx);
      this.setParams(Math.fround(dt), 0, 1);
      this.copy(this.uPair, this.prePair);
      this.dispatch([
        ['ghostsR', nz],
        ['ghostsZ', nr + 2 * G],
        ['reconR', (nr + 2) * nz],
        ['scaleR', (nr + 2) * nz],
        ['fluxR', (nr + 1) * nz],
        ['reconZ', nr * (nz + 2)],
        ['scaleZ', nr * (nz + 2)],
        ['fluxZ', nr * (nz + 1)],
        ['limitR', nr * nz],
        ['limitZ', nr * (nz + 1)],
        ['rhs', this.interior],
        ['stage', this.interior],
      ]);
    }
    this.dispatch([['primitives', this.interior]]);
    ({ ar: this.ar, az: this.az } = await this.fastestPair());
    this.lamR = (dt * (this.ar + this.az)) / (this.ar * this.dx);
    this.lamZ = (dt * (this.ar + this.az)) / (this.az * this.dx);
    this.setParams(Math.fround(dt), stage === 2 ? 0.75 : 0, stage === 2 ? 0.25 : 1);
    this.dispatch([
      ['ghostsR', nz],
      ['ghostsZ', nr + 2 * G],
      ['reconR', (nr + 2) * nz],
      ['scaleR', (nr + 2) * nz],
      ['fluxR', (nr + 1) * nz],
      ['reconZ', nr * (nz + 2)],
      ['scaleZ', nr * (nz + 2)],
      ['fluxZ', nr * (nz + 1)],
    ]);
    const before = await this.readFluxes();
    this.dispatch([
      ['limitR', nr * nz],
      ['limitZ', nr * (nz + 1)],
    ]);
    const after = await this.readFluxes();
    return { before, after, ar: this.ar, az: this.az };
  }

  private async readFluxes(): Promise<Float32Array> {
    const bytes = 16 * ((this.nr + 1) * this.nz + this.nr * (this.nz + 1));
    const staging = this.device.createBuffer({
      size: bytes,
      usage: BUFFER.MAP_READ | BUFFER.COPY_DST,
    });
    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(this.flux, 0, staging, 0, bytes);
    this.device.queue.submit([encoder.finish()]);
    await staging.mapAsync(MAP_READ);
    const out = new Float32Array(staging.getMappedRange().slice(0));
    staging.unmap();
    staging.destroy();
    return out;
  }

  async step(maxDt = Infinity, force = false): Promise<number> {
    if (this.has) return this.stepHas(maxDt, force);
    this.clearLow();
    this.rhs();
    // The step the stages take is the single-precision one, and so is the clock's.
    let dt = Math.fround(Math.min(this.cfl / ((await this.fastest()) / this.dx), maxDt));
    if (!(dt > 0 && Number.isFinite(dt))) throw new Error(`blast2d gpu: time step ${String(dt)}`);
    this.copy(this.uPair, this.k0Pair);
    for (let halving = 0; ; halving++) {
      try {
        if (halving > 0) {
          this.copy(this.k0Pair, this.uPair);
          this.clearLow();
          this.rhs();
        }
        await this.stage(dt, 0, 1);
        this.rhs();
        await this.stage(dt, 0.75, 0.25);
        this.rhs();
        await this.stage(dt, 1 / 3, 2 / 3);
        break;
      } catch (error) {
        if (!(error instanceof PositivityError) || halving >= 8) throw error;
        dt /= 2;
        this.halvings++;
      }
    }
    this.time += dt;
    this.steps++;
    this.setParams(dt, 0, 0);
    this.dispatch([['peaks', this.nr]]);
    return dt;
  }

  private clearLow(): void {
    const encoder = this.device.createCommandEncoder();
    encoder.clearBuffer(this.low);
    this.device.queue.submit([encoder.finish()]);
  }

  /** The ground's peak overpressure at cell i and its overpressure now (Pa). */
  async probe(i: number): Promise<{ peak: number; now: number }> {
    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(this.peak, 16 * i, this.readback, 0, 16);
    this.device.queue.submit([encoder.finish()]);
    await this.readback.mapAsync(MAP_READ, 0, 16);
    const v = new Float32Array(this.readback.getMappedRange(0, 16).slice(0));
    this.readback.unmap();
    return { peak: v[0] ?? 0, now: v[2] ?? 0 };
  }

  /** The ground's peaks (Pa) and their times (s). */
  async groundPeaks(): Promise<{ peak: Float32Array; time: Float32Array }> {
    const bytes = 16 * this.nr;
    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(this.peak, 0, this.readback, 0, bytes);
    this.device.queue.submit([encoder.finish()]);
    await this.readback.mapAsync(MAP_READ, 0, bytes);
    const pairs = new Float32Array(this.readback.getMappedRange(0, bytes).slice(0));
    this.readback.unmap();
    const peak = new Float32Array(this.nr);
    const time = new Float32Array(this.nr);
    for (let i = 0; i < this.nr; i++) {
      peak[i] = pairs[4 * i] ?? 0;
      time[i] = pairs[4 * i + 1] ?? 0;
    }
    return { peak, time };
  }

  /** The state as the GPU holds it, the two halves added in double
   *  precision: vec4(ρ − ρ̄, ρu, ρv, E − Ē) per cell, ghosts included. */
  async state(): Promise<Float64Array> {
    const bytes = 16 * this.cells;
    const staging = this.device.createBuffer({
      size: 2 * bytes,
      usage: BUFFER.MAP_READ | BUFFER.COPY_DST,
    });
    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(this.u, 0, staging, 0, bytes);
    encoder.copyBufferToBuffer(this.uLo, 0, staging, bytes, bytes);
    this.device.queue.submit([encoder.finish()]);
    await staging.mapAsync(MAP_READ);
    const both = new Float32Array(staging.getMappedRange().slice(0));
    staging.unmap();
    staging.destroy();
    const n = 4 * this.cells;
    const out = new Float64Array(n);
    for (let k = 0; k < n; k++) out[k] = (both[k] ?? 0) + (both[n + k] ?? 0);
    return out;
  }

  /** The background pressure of the first row (Pa). */
  get groundPressure(): number {
    return this.pBar0;
  }

  /** Faces that fell back to first order (rules 1262, 1264). */
  async fallbacks(): Promise<number> {
    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(this.count, 8, this.readback, 0, 4);
    this.device.queue.submit([encoder.finish()]);
    await this.readback.mapAsync(MAP_READ, 0, 4);
    const v = new Uint32Array(this.readback.getMappedRange(0, 4).slice(0))[0] ?? 0;
    this.readback.unmap();
    return v;
  }

  /** Rule 1277: cells whose face states were scaled, over the stages (with
   *  the limiter, `fallbacks` counts the faces blended). */
  async scaledFaces(): Promise<number> {
    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(this.count, 12, this.readback, 0, 4);
    this.device.queue.submit([encoder.finish()]);
    await this.readback.mapAsync(MAP_READ, 0, 4);
    const v = new Uint32Array(this.readback.getMappedRange(0, 4).slice(0))[0] ?? 0;
    this.readback.unmap();
    return v;
  }
}

/** The bindings each kernel uses ('auto' layouts keep only these). */
function usedBindings(name: Kernel): number[] {
  switch (name) {
    case 'primitives':
      return [0, 1, 2, 9, 12, 18];
    case 'ghostsR':
    case 'ghostsZ':
      return [0, 2];
    case 'reconR':
    case 'reconZ':
      return [0, 2, 3, 4];
    case 'fluxR':
      return [0, 2, 3, 4, 5, 9, 11, 13];
    case 'fluxZ':
      return [0, 2, 3, 4, 5, 10, 11, 13];
    case 'rhs':
      return [0, 1, 2, 5, 6, 9];
    case 'stage':
      return [0, 1, 6, 7, 8, 15, 16, 17];
    case 'check':
      return [0, 1, 9, 11, 13];
    case 'peaks':
      return [0, 1, 9, 14];
    case 'reduceMax':
      return [0, 12];
    case 'dfCheck':
      return [0, 3, 4];
    case 'scaleR':
    case 'scaleZ':
      return [0, 2, 3, 4, 13];
    case 'limitR':
      return [0, 1, 5, 9, 13];
    case 'limitZ':
      return [0, 1, 5, 9, 10, 13];
    case 'reduceMaxV':
      return [0, 18];
  }
}
