/**
 * One run of the blast solver (rules 1254 and 1255 of
 * `src/physics/validation/blastSolverRules.ts`): a burst at one height, the
 * peak overpressure read along the ground until the incident wave has passed
 * the farthest range asked for. Used by the scripts of tests T2 to T5, one
 * process per run.
 *
 *   pnpm exec tsx scripts/blast2d-run.ts '<case as JSON>' <out.json>
 */

import { writeFileSync } from 'node:fs';
import {
  isothermalAtmosphere,
  uniformAtmosphere,
  type Atmosphere,
} from '../src/physics/solvers/blast2d/atmosphere.js';
import { BlastSolver2D } from '../src/physics/solvers/blast2d/solver.js';

export interface BlastCase {
  readonly atmosphere:
    | { kind: 'uniform'; rho0: number; p0: number }
    | { kind: 'isothermal'; rho0: number; p0: number; g: number };
  /** Energy (J). */
  readonly energy: number;
  /** Height of the source's centre (m). */
  readonly height: number;
  /** Radius of the source's sphere (m). */
  readonly radius: number;
  readonly kineticShare?: number;
  /** Cell size (m). */
  readonly dx: number;
  /** Farthest ground range read (m). */
  readonly rMax: number;
  /** Height of the domain (m). */
  readonly zMax: number;
}

export interface BlastRun {
  readonly case: BlastCase;
  readonly nr: number;
  readonly nz: number;
  readonly steps: number;
  readonly seconds: number;
  readonly time: number;
  readonly fallbacks: number;
  /** Ground ranges (m) of the first row's cells and their peak overpressure (Pa). */
  readonly ranges: number[];
  readonly peaks: number[];
}

export function atmosphereOf(c: BlastCase): Atmosphere {
  return c.atmosphere.kind === 'uniform'
    ? uniformAtmosphere(c.atmosphere.rho0, c.atmosphere.p0)
    : isothermalAtmosphere(c.atmosphere.rho0, c.atmosphere.p0, c.atmosphere.g);
}

export function runCase(c: BlastCase): BlastRun {
  const started = Date.now();
  // The domain reaches a little past the farthest range read, so the open
  // boundary's small reflection comes back after the reading is made.
  const nr = Math.ceil((1.15 * c.rMax) / c.dx);
  const nz = Math.ceil(c.zMax / c.dx);
  const solver = new BlastSolver2D({ nr, nz, dx: c.dx }, atmosphereOf(c));
  solver.deposit({
    energy: c.energy,
    height: c.height,
    radius: c.radius,
    kineticShare: c.kineticShare ?? 0,
  });
  const last = Math.min(nr - 1, Math.floor(c.rMax / c.dx));
  const p0 = solver.backgroundPressure(0);
  // Run until the incident wave has passed the farthest range read: its peak
  // set there, and the overpressure there fallen below a third of it.
  const guard = 1e6;
  while (solver.steps < guard) {
    solver.step();
    const peak = solver.groundPeak[last] ?? 0;
    if (peak > 0 && solver.pressure(last, 0) - p0 < peak / 3) break;
  }
  return {
    case: c,
    nr,
    nz,
    steps: solver.steps,
    seconds: (Date.now() - started) / 1000,
    time: solver.time,
    fallbacks: solver.fallbacks,
    ranges: Array.from({ length: last + 1 }, (_, i) => solver.radius(i)),
    peaks: Array.from(solver.groundPeak.subarray(0, last + 1)),
  };
}

/** The farthest ground range (m) at which the peak reaches a threshold (Pa),
 *  interpolated between cells; 0 where it is reached nowhere. */
export function reachOf(run: BlastRun, threshold: number): number {
  const { ranges, peaks } = run;
  for (let i = peaks.length - 1; i >= 0; i--) {
    const p = peaks[i] ?? 0;
    if (p >= threshold) {
      if (i === peaks.length - 1) return ranges[i] ?? 0;
      const q = peaks[i + 1] ?? 0;
      const a = ranges[i] ?? 0;
      const b = ranges[i + 1] ?? 0;
      return a + ((p - threshold) / (p - q)) * (b - a);
    }
  }
  return 0;
}

if (process.argv[1]?.endsWith('blast2d-run.ts')) {
  const [json, out] = process.argv.slice(2);
  if (json === undefined || out === undefined)
    throw new Error('usage: blast2d-run.ts <case> <out>');
  const run = runCase(JSON.parse(json) as BlastCase);
  writeFileSync(out, `${JSON.stringify(run)}\n`);
}
