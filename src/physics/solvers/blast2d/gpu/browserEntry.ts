/**
 * The blast solver's GPU runs, in a browser (rule 1270): one case at a time,
 * the same grid, source and stop as `scripts/blast2d-run.ts` on the CPU, and
 * the checks G0 (rest) and G2 (conservation) of rule 1270 (d).
 */

import { isothermalAtmosphere, uniformAtmosphere, type Atmosphere } from '../atmosphere.js';
import { BlastSolver2D } from '../solver.js';
import { BlastSolverGpu } from './solverGpu.js';
import type { Gpu, GpuDevice } from './webgpu.js';

export interface GpuCase {
  readonly atmosphere:
    | { kind: 'uniform'; rho0: number; p0: number }
    | { kind: 'isothermal'; rho0: number; p0: number; g: number };
  readonly energy: number;
  readonly height: number;
  readonly radius: number;
  readonly kineticShare?: number;
  readonly dx: number;
  readonly rMax: number;
  readonly zMax: number;
  /** Rule 1274's floor, as `scripts/blast2d-run.ts` reads it. */
  readonly soundFloor?: number;
  /** Rule 1277's limiter. */
  readonly limiter?: 'has';
}

let device: GpuDevice | null = null;
let adapterName = '';

async function gpuDevice(): Promise<GpuDevice> {
  if (device !== null) return device;
  const gpu = (navigator as unknown as { gpu?: Gpu }).gpu;
  if (gpu === undefined) throw new Error('no WebGPU');
  const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' });
  if (adapter === null) throw new Error('no WebGPU adapter');
  adapterName = `${adapter.info?.vendor ?? ''} ${adapter.info?.architecture ?? ''}`.trim();
  device = await adapter.requestDevice();
  return device;
}

function atmosphereOf(c: GpuCase): Atmosphere {
  return c.atmosphere.kind === 'uniform'
    ? uniformAtmosphere(c.atmosphere.rho0, c.atmosphere.p0)
    : isothermalAtmosphere(c.atmosphere.rho0, c.atmosphere.p0, c.atmosphere.g);
}

function reference(c: GpuCase, withSource = true): BlastSolver2D {
  const nr = Math.ceil((1.15 * c.rMax) / c.dx);
  const nz = Math.ceil(c.zMax / c.dx);
  const solver = new BlastSolver2D({ nr, nz, dx: c.dx }, atmosphereOf(c));
  if (withSource)
    solver.deposit({
      energy: c.energy,
      height: c.height,
      radius: c.radius,
      kineticShare: c.kineticShare ?? 0,
    });
  return solver;
}

function limiterOf(c: GpuCase): { limiter?: 'has' } {
  return c.limiter === undefined ? {} : { limiter: c.limiter };
}

/** Rule 1272: a solver is used only once its GPU's error-free sum and
 *  product came back exact. */
async function trusted(solver: BlastSolverGpu): Promise<BlastSolverGpu> {
  const check = await solver.errorFreeCheck();
  if (check.sumBad > 0 || check.prodBad > 0)
    throw new Error(
      `blast2d gpu: error-free arithmetic inexact (${String(check.sumBad)} sums, ${String(check.prodBad)} products of ${String(check.pairs)})`
    );
  return solver;
}

/** One run, as `scripts/blast2d-run.ts` does on the CPU. */
export async function runCaseGpu(c: GpuCase, tEnd?: number): Promise<Record<string, unknown>> {
  const started = performance.now();
  const ref = reference(c);
  const solver = await trusted(new BlastSolverGpu(await gpuDevice(), ref, limiterOf(c)));
  const last = Math.min(ref.nr - 1, Math.floor(c.rMax / c.dx));
  const p0 = ref.backgroundPressure(0);
  // Rule 1274: not before the floor (0 without one).
  const floor =
    c.soundFloor === undefined
      ? 0
      : (c.soundFloor * ref.radius(last)) / Math.sqrt((ref.gamma * p0) / ref.backgroundDensity(0));
  while (solver.steps < 1e6) {
    // A diagnostic may ask for a fixed end instead of rule 1263's stop.
    if (tEnd !== undefined) {
      if (solver.time >= tEnd) break;
      await solver.step(tEnd - solver.time);
      continue;
    }
    await solver.step();
    const probe = await solver.probe(last);
    // Rule 1263: a peak above rounding, then fallen below a third of it.
    if (solver.time >= floor && probe.peak > 1e-4 * p0 && probe.now < probe.peak / 3) break;
  }
  const { peak } = await solver.groundPeaks();
  return {
    case: c,
    engine: 'gpu',
    adapter: adapterName,
    nr: ref.nr,
    nz: ref.nz,
    steps: solver.steps,
    seconds: (performance.now() - started) / 1000,
    time: solver.time,
    fallbacks: await solver.fallbacks(),
    ...(solver.has
      ? { limitedFaces: await solver.fallbacks(), scaledFaces: await solver.scaledFaces() }
      : {}),
    redone: solver.redone,
    halvings: solver.halvings,
    ranges: Array.from({ length: last + 1 }, (_, i) => ref.radius(i)),
    peaks: Array.from(peak.subarray(0, last + 1)),
  };
}

/** A diagnostic: run until the GPU fails, then list the unsound cells (ρ,
 *  p, velocities, their background) and the time. */
export async function probeFailure(c: GpuCase): Promise<Record<string, unknown>> {
  const ref = reference(c);
  const solver = await trusted(new BlastSolverGpu(await gpuDevice(), ref, limiterOf(c)));
  let message = '';
  let last: Float64Array | null = null;
  try {
    for (;;) {
      last = await solver.state();
      await solver.step();
    }
  } catch (error) {
    message = String(error);
  }
  const after = await solver.state();
  const cells = [];
  for (let j = 0; j < ref.nz; j++)
    for (let i = 0; i < ref.nr; i++) {
      const k = ref.index(i, j);
      const rhoBar = ref.backgroundDensity(j);
      const pBar = ref.backgroundPressure(j);
      const at = (s: Float64Array | null): Record<string, number> => {
        if (s === null) return {};
        const rho = rhoBar + (s[4 * k] ?? 0);
        const mr = s[4 * k + 1] ?? 0;
        const mz = s[4 * k + 2] ?? 0;
        const p = pBar + 0.4 * ((s[4 * k + 3] ?? 0) - (0.5 * (mr * mr + mz * mz)) / rho);
        return { rho, p, u: mr / rho, v: mz / rho };
      };
      const now = at(after);
      if (!((now.rho ?? 0) > 0 && (now.p ?? 0) > 0))
        cells.push({ i, j, rhoBar, pBar, before: at(last), after: now });
    }
  return { message, time: solver.time, steps: solver.steps, cells: cells.slice(0, 10) };
}

/** A diagnostic: the GPU stepped with imposed time steps (the reference's);
 *  returns its state (both halves added) after each of the listed counts. */
export async function stepsWithDt(
  c: GpuCase,
  dts: number[],
  at: number[]
): Promise<Record<number, number[]>> {
  const ref = reference(c);
  const solver = await trusted(new BlastSolverGpu(await gpuDevice(), ref, limiterOf(c)));
  const out: Record<number, number[]> = {};
  for (const [n, dt] of dts.entries()) {
    await solver.step(dt, true);
    if (at.includes(n + 1)) out[n + 1] = Array.from(await solver.state());
  }
  return out;
}

/** A diagnostic: n steps with imposed Δt, then the next step's first stage
 *  up to its fluxes, before and after the limiter. */
export async function fluxesAfter(
  c: GpuCase,
  dts: number[],
  next: number
): Promise<{ before: number[]; after: number[]; ar: number; az: number }> {
  const ref = reference(c);
  const solver = await trusted(new BlastSolverGpu(await gpuDevice(), ref, limiterOf(c)));
  for (const dt of dts) await solver.step(dt, true);
  const r = await solver.debugFirstStage(next);
  return { before: Array.from(r.before), after: Array.from(r.after), ar: r.ar, az: r.az };
}

/** G0: the atmosphere at rest, no source, for a number of steps; the
 *  largest speed at the end (m/s). */
export async function restCheck(c: GpuCase, steps: number): Promise<Record<string, number>> {
  const ref = reference(c, false);
  const solver = await trusted(new BlastSolverGpu(await gpuDevice(), ref, limiterOf(c)));
  for (let n = 0; n < steps; n++) await solver.step();
  const state = await solver.state();
  let top = 0;
  for (let j = 0; j < ref.nz; j++) {
    const rhoBar = ref.backgroundDensity(j);
    for (let i = 0; i < ref.nr; i++) {
      const k = ref.index(i, j);
      const rho = rhoBar + (state[4 * k] ?? 0);
      const speed = Math.hypot(state[4 * k + 1] ?? 0, state[4 * k + 2] ?? 0) / rho;
      if (speed > top) top = speed;
    }
  }
  return { steps, time: solver.time, maxSpeed: top };
}

/** G2: the mass and the energy (internal, kinetic and, with gravity,
 *  potential) of the domain after some steps, against the start. */
export async function conservationCheck(
  c: GpuCase,
  steps: number
): Promise<Record<string, number>> {
  const ref = reference(c);
  const solver = await trusted(new BlastSolverGpu(await gpuDevice(), ref, limiterOf(c)));
  const g = c.atmosphere.kind === 'isothermal' ? c.atmosphere.g : 0;
  const totals = (state: Float64Array): { mass: number; energy: number } => {
    let mass = 0;
    let energy = 0;
    for (let j = 0; j < ref.nz; j++) {
      const z = (j + 0.5) * ref.dx;
      for (let i = 0; i < ref.nr; i++) {
        const k = ref.index(i, j);
        const v = ref.cellVolume(i);
        const dRho = state[4 * k] ?? 0;
        mass += dRho * v;
        energy += ((state[4 * k + 3] ?? 0) + dRho * g * z) * v;
      }
    }
    return { mass, energy };
  };
  const before = totals(await solver.state());
  let domainMass = 0;
  for (let j = 0; j < ref.nz; j++)
    for (let i = 0; i < ref.nr; i++) domainMass += ref.backgroundDensity(j) * ref.cellVolume(i);
  for (let n = 0; n < steps; n++) await solver.step();
  const after = totals(await solver.state());
  return {
    steps,
    time: solver.time,
    massChange: (after.mass - before.mass) / domainMass,
    energyChange: (after.energy - before.energy) / c.energy,
  };
}

declare global {
  interface Window {
    blast2dGpu?: {
      runCaseGpu: typeof runCaseGpu;
      restCheck: typeof restCheck;
      conservationCheck: typeof conservationCheck;
      probeFailure: typeof probeFailure;
      stepsWithDt: typeof stepsWithDt;
      fluxesAfter: typeof fluxesAfter;
    };
  }
}
window.blast2dGpu = {
  runCaseGpu,
  restCheck,
  conservationCheck,
  probeFailure,
  stepsWithDt,
  fluxesAfter,
};
