/**
 * Rule 1286 (`src/physics/validation/blastSolverRules.ts`): T1's case on rule
 * 1277's limiter, the shock read at the density's peak (a parabola through
 * the top three cells) against Sedov's exact radius.
 *
 *   pnpm exec tsx scripts/blast2d-t1-peak.ts [cells]
 */
import { uniformAtmosphere } from '../src/physics/solvers/blast2d/atmosphere.js';
import { BlastSolver2D } from '../src/physics/solvers/blast2d/solver.js';
const XI = 1.033,
  RHO = 1,
  P = 1e-6,
  E = 1,
  L = 1.2;
const cells = Number(process.argv[2] ?? 200);
const dx = L / cells;
const s = new BlastSolver2D({ nr: cells, nz: cells, dx }, uniformAtmosphere(RHO, P), {
  limiter: 'has',
});
s.deposit({ energy: E, height: 0, radius: 3 * dx });
const marks = [0.05, 0.08, 0.12, 0.18, 0.25, 0.35, 0.45, 0.55].map((r) => ({
  r,
  t: Math.sqrt((r ** 5 * RHO) / (XI ** 5 * 2 * E)),
}));
const peakOn = (at: (n: number) => number, n: number): number => {
  let best = 1,
    bi = 1;
  for (let k = 1; k < n - 1; k++) {
    const v = at(k);
    if (v > best) {
      best = v;
      bi = k;
    }
  }
  const a = at(bi - 1),
    b = at(bi),
    c = at(bi + 1);
  const off = (a - c) / (2 * (a - 2 * b + c));
  return (bi + 0.5 + (Number.isFinite(off) ? off : 0)) * dx;
};
for (const m of marks) {
  while (s.time < m.t) s.step(m.t - s.time);
  const exact = XI * ((2 * E * s.time ** 2) / RHO) ** 0.2;
  const ground = peakOn((k) => s.rho[s.index(k, 0)] ?? 0, cells);
  const axis = peakOn((k) => s.rho[s.index(0, k)] ?? 0, cells);
  console.log(
    `r ${m.r.toFixed(2)} (${(exact / dx).toFixed(1)} cells): density peak on the ground ${(100 * (ground / exact - 1)).toFixed(2)} %, on the axis ${(100 * (axis / exact - 1)).toFixed(2)} % (${((ground - exact) / dx).toFixed(2)} cells)`
  );
}
