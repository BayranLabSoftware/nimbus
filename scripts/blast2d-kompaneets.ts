/**
 * A diagnostic, not a test: the blast solver's strong shock in an exponential
 * atmosphere against the shape of Kompaneets (1960)'s approximation, as
 * restated by Roy, Nath, Sharma & Shchekinov (arXiv 1303.2664, eqs. 7–9):
 * with y the shape parameter, the top z₊ = −2H ln(1 − y/2H), the bottom
 * z₋ = −2H ln(1 + y/2H), the widest radius r_max = 2H arcsin(y/2H). The
 * relations between them do not depend on Kompaneets's constant λ, so y is
 * read from the solver's top and the bottom and the radius predicted from it.
 * Units: H = 1, the air's density at the source 1, the energy 1; gravity so
 * small that the ambient pressure (10⁻⁴ at the source) keeps the shock
 * strong. The source 6 H above the ground, so the ground plays no part.
 *
 *   pnpm exec tsx scripts/blast2d-kompaneets.ts [cells per H]
 */

import { isothermalAtmosphere } from '../src/physics/solvers/blast2d/atmosphere.js';
import { BlastSolver2D } from '../src/physics/solvers/blast2d/solver.js';

const perH = Number(process.argv[2] ?? 40);
const H = 1;
const ZS = 6 * H;
const G = 1e-4;
// Density 1 at the source: at the ground e^(ZS/H); pressure ρgH.
const rho0 = Math.exp(ZS / H);
const air = isothermalAtmosphere(rho0, rho0 * G * H, G);
const dx = H / perH;
const nr = Math.ceil((3 * H) / dx);
const nz = Math.ceil((ZS + 5 * H) / dx);
const solver = new BlastSolver2D({ nr, nz, dx }, air);
solver.deposit({ energy: 1, height: ZS, radius: 0.1 * H });

/** Shocked where the density is 1.2 times the ambient one at that height. */
const shocked = (i: number, j: number): boolean =>
  (solver.rho[solver.index(i, j)] ?? 0) > 1.2 * solver.backgroundDensity(j);

function shape(): { top: number; bottom: number; rMax: number } {
  let top = 0;
  let bottom = 0;
  for (let j = 0; j < nz; j++)
    if (shocked(0, j)) {
      top = Math.max(top, (j + 1) * dx - ZS);
      bottom = Math.max(bottom, ZS - j * dx);
    }
  let rMax = 0;
  for (let j = 0; j < nz; j++)
    for (let i = nr - 1; i >= 0; i--)
      if (shocked(i, j)) {
        rMax = Math.max(rMax, (i + 1) * dx);
        break;
      }
  return { top, bottom, rMax };
}

for (const target of [0.5, 1, 1.5, 2, 2.5, 3]) {
  while (shape().top < target * H && solver.steps < 500_000)
    for (let k = 0; k < 20; k++) solver.step();
  const s = shape();
  const y = 2 * H * (1 - Math.exp(-s.top / (2 * H)));
  const bottom = 2 * H * Math.log(1 + y / (2 * H));
  const rMax = 2 * H * Math.asin(Math.min(1, y / (2 * H)));
  console.log(
    `top ${s.top.toFixed(3)} H (y ${y.toFixed(3)}): bottom ${s.bottom.toFixed(3)} vs ${bottom.toFixed(3)} ` +
      `(${(s.bottom / bottom).toFixed(2)}×); widest ${s.rMax.toFixed(3)} vs ${rMax.toFixed(3)} ` +
      `(${(s.rMax / rMax).toFixed(2)}×); t ${solver.time.toExponential(3)}, redone ${String(solver.redone)}`
  );
}
