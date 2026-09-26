/**
 * Rule 1254 (c) T1 (`src/physics/validation/blastSolverRules.ts`): the
 * Sedov–Taylor blast. A source on the reflecting ground in a uniform,
 * nearly pressureless gas is, by the mirror, a point blast of twice its
 * energy in free space; its shock radius grows as ξ(2E t²/ρ)^(1/5), ξ = 1.033
 * for γ = 1.4. Criterion: within 2 % once the shock is ten cells from the
 * source and until it reaches half the domain, and converging as the grid is
 * refined. Three grids; the radius read along the ground, the axis and the
 * diagonal, where the density crosses half-way from the ambient to its peak
 * on the shock's outer flank.
 *
 *   pnpm exec tsx scripts/blast2d-t1-sedov.ts
 *
 * Writes src/physics/validation/blast2dT1Sedov.json.
 */

import { writeFileSync } from 'node:fs';
import { uniformAtmosphere } from '../src/physics/solvers/blast2d/atmosphere.js';
import { BlastSolver2D } from '../src/physics/solvers/blast2d/solver.js';

const XI = 1.033;
const RHO = 1;
const P = 1e-6;
const E = 1;
const L = 1.2;

/** Where the density crosses half-way to its peak on the outer flank of a ray. */
function shockRadius(solver: BlastSolver2D, ray: 'ground' | 'axis' | 'diagonal'): number {
  const n = Math.min(solver.nr, solver.nz);
  const at = (s: number): number => {
    const i = ray === 'axis' ? 0 : s;
    const j = ray === 'ground' ? 0 : s;
    return solver.rho[solver.index(i, j)] ?? 0;
  };
  const dist = (s: number): number => {
    const c = (s + 0.5) * solver.dx;
    const o = 0.5 * solver.dx;
    return ray === 'diagonal' ? Math.SQRT2 * c : Math.hypot(c, o);
  };
  let peak = 0;
  let sPeak = 0;
  for (let s = 0; s < n; s++)
    if (at(s) > peak) {
      peak = at(s);
      sPeak = s;
    }
  const half = RHO + 0.5 * (peak - RHO);
  for (let s = sPeak; s < n - 1; s++) {
    const a = at(s);
    const b = at(s + 1);
    if (a >= half && b < half) {
      const t = (a - half) / (a - b);
      return dist(s) + t * (dist(s + 1) - dist(s));
    }
  }
  return NaN;
}

const results = [];
const GRIDS = process.argv.slice(2).map(Number);
for (const cells of GRIDS.length > 0 ? GRIDS : [100, 200, 400]) {
  const dx = L / cells;
  const solver = new BlastSolver2D({ nr: cells, nz: cells, dx }, uniformAtmosphere(RHO, P));
  const r0 = 3 * dx;
  solver.deposit({ energy: E, height: 0, radius: r0 });
  const started = Date.now();
  const readings: { t: number; exact: number; ground: number; axis: number; diagonal: number }[] =
    [];
  const marks = [0.05, 0.08, 0.12, 0.18, 0.25, 0.35, 0.45, 0.55, 0.6].map((r) =>
    Math.sqrt((r ** 5 * RHO) / (XI ** 5 * 2 * E))
  );
  for (const t of marks) {
    while (solver.time < t - 1e-15) solver.step(t - solver.time);
    const exact = XI * ((2 * E * t * t) / RHO) ** 0.2;
    readings.push({
      t,
      exact,
      ground: shockRadius(solver, 'ground'),
      axis: shockRadius(solver, 'axis'),
      diagonal: shockRadius(solver, 'diagonal'),
    });
  }
  const judged = readings
    .filter((x) => x.exact >= r0 + 10 * dx && x.exact <= L / 2)
    .map((x) => ({
      exact: x.exact,
      worst: Math.max(...[x.ground, x.axis, x.diagonal].map((r) => Math.abs(r / x.exact - 1))),
    }));
  results.push({
    cells,
    dx,
    sourceRadius: r0,
    steps: solver.steps,
    seconds: (Date.now() - started) / 1000,
    fallbacks: solver.fallbacks,
    readings,
    judged,
    worstJudged: Math.max(...judged.map((x) => x.worst)),
  });
  console.log(
    cells,
    'cells:',
    solver.steps,
    'steps,',
    (Date.now() - started) / 1000,
    's; worst',
    Math.max(...judged.map((x) => x.worst)).toFixed(4),
    'fallbacks',
    solver.fallbacks
  );
}
if (GRIDS.length > 0)
  for (const r of results)
    console.log(
      JSON.stringify(
        r.readings.map((x) => [
          x.exact.toFixed(3),
          x.ground.toFixed(3),
          x.axis.toFixed(3),
          x.diagonal.toFixed(3),
        ])
      )
    );
if (GRIDS.length === 0)
  writeFileSync(
    'src/physics/validation/blast2dT1Sedov.json',
    `${JSON.stringify({ rule: '1254 (c) T1', xi: XI, gamma: 1.4, criterion: 0.02, results }, null, 1)}\n`
  );
