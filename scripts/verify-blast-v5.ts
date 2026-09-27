/**
 * Rule 1309 (d) V5 (`src/physics/validation/blastSolverRules.ts`): the peak
 * a cell records behind a moving shock. (1) A planar shock along z in
 * uniform air, the shocked air above moving down into air at rest, at
 * M = 1.02 to 5 on 400 cells: each cell's largest pressure in time against
 * the exact post-shock pressure, the excess at most 0.5 % of the exact
 * overpressure. (2) The radial direction, on the GPU: T2's 1 kt ground burst
 * in uniform air on 5 m cells, the ground's recorded peaks from λ = 1 to 2.8,
 * the largest |second difference| between neighbours at most 0.5 % of the
 * local peak.
 *
 *   pnpm exec tsx scripts/verify-blast-v5.ts [planar | radial | both]
 *
 * Writes src/physics/validation/verifyBlastV5.json.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { uniformAtmosphere } from '../src/physics/solvers/blast2d/atmosphere.js';
import { BlastSolver2D } from '../src/physics/solvers/blast2d/solver.js';
import { withGpuPage } from './blast2d-gpu.js';

const RHO = 1.225;
const P0 = 101_325;
const GAMMA = 1.4;
const C0 = Math.sqrt((GAMMA * P0) / RHO);
const MACHS = [1.02, 1.05, 1.125, 1.3, 2, 5];
const NZ = 400;
const DZ = 1;
const START = 320;
const OUT = 'src/physics/validation/verifyBlastV5.json';
const LIMIT = 0.005;

interface PlanarRow {
  mach: number;
  steps: number;
  largestExcess: number;
  smallestExcess: number;
  passes: boolean;
}

function planar(mach: number): PlanarRow {
  const g = GAMMA;
  const p1 = P0 * (1 + ((2 * g) / (g + 1)) * (mach * mach - 1));
  const rho1 = (RHO * (g + 1) * mach * mach) / ((g - 1) * mach * mach + 2);
  const d = mach * C0;
  const v1 = d * (1 - RHO / rho1);
  const solver = new BlastSolver2D({ nr: 4, nz: NZ, dx: DZ }, uniformAtmosphere(RHO, P0), {
    limiter: 'has',
  });
  for (let j = START; j < NZ; j++)
    for (let i = 0; i < 4; i++) {
      const k = solver.index(i, j);
      solver.rho[k] = rho1;
      solver.mr[k] = 0;
      solver.mz[k] = -rho1 * v1;
      solver.en[k] = p1 / (g - 1) + 0.5 * rho1 * v1 * v1;
    }
  // Read from 20 cells below the start to 20 above the ground; stop with the
  // shock 10 cells above the ground.
  const lo = 20;
  const hi = START - 20;
  const tEnd = ((START - 10) * DZ) / d;
  const record = new Float64Array(NZ).fill(-Infinity);
  while (solver.time < tEnd) {
    solver.step(tEnd - solver.time);
    for (let j = lo; j < hi; j++) {
      const p = solver.pressure(0, j);
      if (p > (record[j] ?? -Infinity)) record[j] = p;
    }
  }
  let largest = -Infinity;
  let smallest = Infinity;
  for (let j = lo; j < hi; j++) {
    const excess = ((record[j] ?? NaN) - p1) / (p1 - P0);
    largest = Math.max(largest, excess);
    smallest = Math.min(smallest, excess);
  }
  return {
    mach,
    steps: solver.steps,
    largestExcess: largest,
    smallestExcess: smallest,
    passes: largest <= LIMIT,
  };
}

interface RadialResult {
  cells: number;
  largestSecondDifference: number;
  atLambda: number;
  passes: boolean;
}

async function radial(): Promise<RadialResult> {
  const c = {
    atmosphere: { kind: 'uniform', rho0: RHO, p0: P0 },
    energy: 4.184e12,
    height: 0,
    radius: 45,
    dx: 5,
    rMax: 1_250,
    zMax: 1_250,
    soundFloor: 1.1,
    limiter: 'has',
  };
  const run = await withGpuPage(async (page) =>
    page.evaluate(async (cc) => window.blast2dGpu?.runCaseGpu(cc as never), c)
  );
  const { ranges, peaks } = run as unknown as { ranges: number[]; peaks: number[] };
  // Brode's ε for the mirrored free-air burst of 2 kt.
  const eps = Math.cbrt((2 * c.energy) / P0);
  let worst = 0;
  let at = NaN;
  let cells = 0;
  for (let i = 1; i + 1 < peaks.length; i++) {
    const lambda = (ranges[i] ?? 0) / eps;
    if (lambda < 1 || lambda > 2.8) continue;
    cells++;
    const p = peaks[i] ?? 0;
    const second = Math.abs((peaks[i - 1] ?? 0) - 2 * p + (peaks[i + 1] ?? 0)) / p;
    if (second > worst) {
      worst = second;
      at = lambda;
    }
  }
  return { cells, largestSecondDifference: worst, atLambda: at, passes: worst <= LIMIT };
}

const mode = process.argv[2] ?? 'both';
const previous: Record<string, unknown> = existsSync(OUT)
  ? (JSON.parse(readFileSync(OUT, 'utf8')) as Record<string, unknown>)
  : {};
const out: Record<string, unknown> = { ...previous, rule: '1309 (d) V5', limit: LIMIT };
if (mode === 'planar' || mode === 'both') {
  const rows = MACHS.map((m) => {
    const row = planar(m);
    console.log(
      `M ${m.toFixed(3)}: largest excess ${(row.largestExcess * 100).toFixed(3)} % of the overpressure, smallest ${(row.smallestExcess * 100).toFixed(3)} %, ${String(row.steps)} steps — ${row.passes ? 'within' : 'beyond'}`
    );
    return row;
  });
  out.planar = rows;
}
if (mode === 'radial' || mode === 'both') {
  const r = await radial();
  console.log(
    `radial: largest |second difference| ${(r.largestSecondDifference * 100).toFixed(3)} % of the peak at λ = ${r.atLambda.toFixed(3)} over ${String(r.cells)} cells — ${r.passes ? 'within' : 'beyond'}`
  );
  out.radial = r;
}
const planarRows = (out.planar as PlanarRow[] | undefined) ?? [];
const radialResult = out.radial as RadialResult | undefined;
out.passes =
  planarRows.length === MACHS.length &&
  planarRows.every((r) => r.passes) &&
  radialResult?.passes === true;
console.log(`V5 ${out.passes === true ? 'PASSES' : 'FAILS'}`);
writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
