/**
 * Rule 1348 (c) (`src/physics/validation/blastSolverRules.ts`): V6's cases (a)
 * and (b) — the same densities and pressures — in the ideal gas (γ = 1.4),
 * against Toro's exact solution, on the same scheme and grids: whether the
 * L1 order of density below 0.8 belongs to real air or to the waves.
 *
 *   pnpm exec tsx scripts/verify-blast-v6-ideal.ts
 *
 * Writes src/physics/validation/verifyBlastV6Ideal.json.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { uniformAtmosphere } from '../src/physics/solvers/blast2d/atmosphere.js';
import { BlastSolver2D } from '../src/physics/solvers/blast2d/solver.js';
import { riemann } from './riemann-toro.js';

interface V6Case {
  case: string;
  left: { rho: number; p: number };
  right: { rho: number; p: number };
}
const v6 = JSON.parse(readFileSync('src/physics/validation/verifyBlastV6.json', 'utf8')) as {
  cases: V6Case[];
};
const GAUSS8 = [
  [0.1834346424956498, 0.362683783378362],
  [0.525532409916329, 0.3137066458778873],
  [0.7966664774136267, 0.2223810344533745],
  [0.9602898564975363, 0.1012285362903763],
] as const;
const Z0 = 0.45;
const CELLS = [100, 200, 400, 800];

const results = v6.cases.slice(0, 2).map((cs) => {
  const l = { rho: cs.left.rho, u: 0, p: cs.left.p };
  const r = { rho: cs.right.rho, u: 0, p: cs.right.p };
  const ex = riemann(l, r, 1.4);
  const tEnd = 0.4 / Math.max(...ex.waves.map(Math.abs));
  const l1 = CELLS.map((nz) => {
    const dz = 1 / nz;
    const s = new BlastSolver2D({ nr: 4, nz, dx: dz }, uniformAtmosphere(r.rho, r.p), {
      limiter: 'has',
    });
    for (let j = 0; j < nz; j++) {
      const st = (j + 0.5) * dz < Z0 ? l : r;
      for (let i = 0; i < 4; i++) {
        const k = s.index(i, j);
        s.rho[k] = st.rho;
        s.mr[k] = 0;
        s.mz[k] = 0;
        s.en[k] = st.p / 0.4;
      }
    }
    while (s.time < tEnd) s.step(tEnd - s.time);
    let sum = 0;
    for (let j = 0; j < nz; j++) {
      const a = j * dz;
      const b = (j + 1) * dz;
      const cuts = [a, ...ex.waves.map((w) => Z0 + w * s.time).filter((x) => x > a && x < b), b];
      let avg = 0;
      for (let q = 0; q + 1 < cuts.length; q++) {
        const lo = cuts[q] ?? a;
        const hi = cuts[q + 1] ?? b;
        const mid = 0.5 * (lo + hi);
        const half = 0.5 * (hi - lo);
        for (const [x, w] of GAUSS8)
          for (const sign of [-1, 1])
            avg += w * half * ex.density((mid + sign * x * half - Z0) / s.time);
      }
      sum += Math.abs((s.rho[s.index(0, j)] ?? 0) - avg / dz) * dz;
    }
    return sum;
  });
  const orders = l1.slice(1).map((x, k) => Math.log2((l1[k] ?? NaN) / x));
  console.log(
    `(${cs.case}) ideal gas: L1 ${l1.map((x) => x.toExponential(3)).join(', ')}; orders ${orders.map((o) => o.toFixed(2)).join(', ')}`
  );
  return { case: cs.case, cells: CELLS, l1, orders };
});
writeFileSync(
  'src/physics/validation/verifyBlastV6Ideal.json',
  `${JSON.stringify({ rule: '1348 (c)', cases: results }, null, 2)}\n`
);
