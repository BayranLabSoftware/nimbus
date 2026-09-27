/**
 * Rules 1333 (c) and 1334 (e) (`src/physics/validation/blastSolverRules.ts`):
 * the free-air burst of 1 kt for C1–C3, on the one-dimensional solver. The
 * source a hot sphere of air at rest at ambient density holding W = 1 kt
 * (4.184·10¹² J) — radius 35, 40 or 45 m; a share f_b of W is this run read
 * at ranges R/f_b^(1/3) and times t/f_b^(1/3) (the cube-root scaling without
 * gravity). Sea level (ρ₀ = 1.225 kg/m³, p₀ = 101 325 Pa), 2.7 km of cells;
 * probes every 5 m from 20 m to 2.6 km (the foot's ladder, the impulse); the
 * energy beyond the equation of state's effective edge every 200 steps. Runs
 * until the first positive phase has ended at 2.6 km.
 *
 *   pnpm exec tsx scripts/blast1d-c1-runs.ts <dr m> <radius m> [air|ideal]
 *
 * Writes scripts/tmp/blast1d-c1/c1-<eos>-<dr>-<radius>.json.
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { BlastSolver1D } from '../src/physics/solvers/blast1d/solver.js';

const [drArg = '5', radiusArg = '40', eosArg = 'air'] = process.argv.slice(2);
const dr = Number(drArg);
const radius = Number(radiusArg);
const eos = eosArg === 'ideal' ? 'ideal' : 'air';
const W = 4.184e12;
const LENGTH = 2700;
const LAST = 2600;
const probes = Array.from({ length: Math.round((LAST - 20) / 5) + 1 }, (_, k) => 20 + 5 * k);
const dir = 'scripts/tmp/blast1d-c1';
mkdirSync(dir, { recursive: true });
const file = `${dir}/c1-${eos}-${String(dr)}-${String(radius)}.json`;
if (existsSync(file)) {
  console.log(`${file} exists`);
  process.exit(0);
}

const solver = new BlastSolver1D(
  { n: Math.round(LENGTH / dr), dr },
  { rho0: 1.225, p0: 101_325 },
  { eos, probes }
);
const put = solver.depositHotSphere(W, radius);
let beyond = 0;
const started = performance.now();
while (!solver.positivePhaseEnded(LAST) && solver.time < 20) {
  solver.step();
  if (solver.steps % 200 === 0) beyond = Math.max(beyond, solver.beyondEdgeEnergy() / W);
  if (solver.steps % 20_000 === 0)
    console.log(`${String(solver.steps)} steps, t ${solver.time.toFixed(3)} s`);
}
const cells = Array.from({ length: solver.n }, (_, i) => [
  solver.radius(i),
  solver.peak[i] ?? 0,
  solver.peakTime[i] ?? 0,
]);
writeFileSync(
  file,
  JSON.stringify({
    rule: '1333 (c), 1334 (e)',
    dr,
    radius,
    eos,
    energy: W,
    put,
    energyEnd: solver.excessEnergy(),
    steps: solver.steps,
    time: solver.time,
    fallbacks: solver.fallbacks,
    faceIterations: solver.faceIterations,
    beyondShareMax: beyond,
    probes: probes.map((r) => ({ r, ...solver.probe(r) })),
    cells,
  })
);
console.log(
  `${file}: ${String(solver.steps)} steps, t ${solver.time.toFixed(3)} s, ${((performance.now() - started) / 1000).toFixed(0)} s, beyond Z_h at most ${(beyond * 100).toFixed(3)} % of W, fall-backs ${String(solver.fallbacks)}`
);
