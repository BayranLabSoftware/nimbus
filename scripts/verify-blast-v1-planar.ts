/**
 * Rule 1296 (`src/physics/validation/blastSolverRules.ts`), a diagnostic for
 * V1: the same pulse planar along z (uniform in r), exact p' = ½[g(z − ct) +
 * g(z + ct)] with g evenly extended (the ground mirrors).
 *
 *   pnpm exec tsx scripts/verify-blast-v1-planar.ts
 */
import { uniformAtmosphere } from '../src/physics/solvers/blast2d/atmosphere.js';
import { BlastSolver2D } from '../src/physics/solvers/blast2d/solver.js';
const RHO = 1.225,
  P0 = 101_325,
  GAMMA = 1.4,
  C = Math.sqrt((GAMMA * P0) / RHO),
  A = 1e-6 * P0,
  W = 100,
  T = 0.6,
  L = 700;
const g = (s: number) => A * Math.exp(-((s / W) ** 2));
const GX = [
  0.5 - 0.5 * 0.8611363115940526,
  0.5 - 0.5 * 0.3399810435848563,
  0.5 + 0.5 * 0.3399810435848563,
  0.5 + 0.5 * 0.8611363115940526,
];
const GW = [0.3478548451374538, 0.6521451548625461, 0.6521451548625461, 0.3478548451374538].map(
  (w) => w / 2
);
const avgZ = (j: number, dx: number, f: (z: number) => number) =>
  GX.reduce((s, a, q) => s + (GW[q] ?? 0) * f((j + a) * dx), 0);
let prev = NaN;
for (const cells of [4, 8, 16, 32]) {
  const dx = W / cells,
    nz = Math.round(L / dx),
    nr = 8;
  const s = new BlastSolver2D({ nr, nz, dx }, uniformAtmosphere(RHO, P0), { limiter: 'has' });
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nr; i++) {
      const p = avgZ(j, dx, (z) => g(z));
      const k = s.index(i, j);
      s.rho[k] = RHO + p / (C * C);
      s.mr[k] = 0;
      s.mz[k] = 0;
      s.en[k] = (P0 + p) / (GAMMA - 1);
    }
  while (s.time < T) s.step(T - s.time);
  let e = 0,
    nrm = 0;
  for (let j = 0; j < nz; j++) {
    const want = avgZ(j, dx, (z) => 0.5 * (g(Math.abs(z - C * s.time)) + g(z + C * s.time)));
    const got = s.pressure(3, j) - P0;
    e += Math.abs(got - want);
    nrm += Math.abs(want);
  }
  const l1 = e / nrm;
  console.log(
    `${String(cells)} cells per width: L1 ${l1.toExponential(3)}${Number.isNaN(prev) ? '' : ', order ' + Math.log2(prev / l1).toFixed(2)}`
  );
  prev = l1;
}
