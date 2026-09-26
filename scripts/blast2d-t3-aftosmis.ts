/**
 * Rule 1254 (c) T3 (and T5 on it): the solver at 250 Mt against Aftosmis,
 * Mathias & Tarano (2019)'s Cart3D height-of-burst map, as digitised under
 * rule 1251 (the dashed curves of `porta1Hob250MtFigure.json`). Their setup:
 * a perfect gas; an isothermal atmosphere of 1 atm at the ground and
 * 2.7·10⁻³ atm at 40 km (H = 40 km / ln(1/0.0027) = 6.76 km), its density at
 * the ground p₀/(gH) as hydrostatic balance requires; a spherical source of
 * 0.5 km. The reach at 1, 2, 4 and 10 psi at the figure's 26 heights, in km
 * scaled to 1 kt; three grids whose cells are 20, 10 and 5 m scaled to 1 kt
 * (1 260, 630 and 315 m). The sensitivity to a scale height of 7.6 km, their
 * mean value, on the finest grid. Criterion: every judged reach within 10 %,
 * the median within 5 % (rule 1256 for what is judged).
 *
 *   pnpm exec tsx scripts/blast2d-t3-aftosmis.ts [parallel]
 *
 * Writes src/physics/validation/blast2dT3.json and docs/BLAST2D_T3.md.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import type { BlastCase } from './blast2d-run.js';
import { judge, verdict, type Reading } from './blast2d-hob-judge.js';
import { runPool } from './blast2d-pool.js';
import { reachOf } from './blast2d-run.js';

interface Figure {
  heightsKm1kt: number[];
  curves: Record<string, { cartesian3d250Mt: Reading[] }>;
}
const figure = JSON.parse(
  readFileSync('src/physics/validation/porta1Hob250MtFigure.json', 'utf8')
) as Figure;

const G = 9.80665;
const P0 = 101_325;
const ENERGY = 250e6 * 4.184e9;
/** km at 250 Mt per km at 1 kt. */
const SCALE = Math.cbrt(250e3);
const H_FIGURE = 40_000 / Math.log(1 / 2.7e-3);
const H_MEAN = 7_600;
const GRIDS_1KT = [20, 10, 5];
const heights = figure.heightsKm1kt;
const parallel = Number(process.argv[2] ?? 4);

const caseAt = (hKm1kt: number, dx1kt: number, scaleHeight: number): BlastCase => ({
  atmosphere: { kind: 'isothermal', rho0: P0 / (G * scaleHeight), p0: P0, g: G },
  energy: ENERGY,
  height: hKm1kt * 1_000 * SCALE,
  radius: 500,
  dx: dx1kt * SCALE,
  rMax: 3.1 * 1_000 * SCALE,
  zMax: Math.max(1.6, hKm1kt + 1.2) * 1_000 * SCALE,
});

const cases = [
  ...GRIDS_1KT.flatMap((dx) => heights.map((h) => caseAt(h, dx, H_FIGURE))),
  ...heights.map((h) => caseAt(h, 5, H_MEAN)),
];
const runs = await runPool(cases, 'scripts/tmp/blast2d-cache', parallel);
const n = heights.length;
const byGrid = GRIDS_1KT.map((_, g) => runs.slice(g * n, (g + 1) * n));
const sensitivity = runs.slice(3 * n, 4 * n);

const thresholds = [1, 2, 4, 10].map((psi) => {
  const ref = figure.curves[`${String(psi)} psi`]?.cartesian3d250Mt;
  if (ref === undefined) throw new Error('no reference');
  const rows = judge(psi, heights, ref, byGrid, SCALE);
  const atMeanH = sensitivity.map((run) => reachOf(run, psi * 6_894.757) / 1_000 / SCALE);
  return { psi, verdict: verdict(rows), rows, reachAtH76: atMeanH };
});
const overall = verdict(thresholds.flatMap((t) => t.rows));
const fallbacks = runs.reduce((s, r) => s + r.fallbacks, 0);
writeFileSync(
  'src/physics/validation/blast2dT3.json',
  `${JSON.stringify({ rule: '1254 (c) T3, T5', scaleHeights: [H_FIGURE, H_MEAN], grids1kt: GRIDS_1KT, overall, fallbacks, thresholds }, null, 1)}\n`
);

const f = (x: number | null, d = 3): string => (x === null ? '—' : x.toFixed(d));
const lines = [
  '# Blast solver — T3: 250 Mt against Aftosmis, Mathias & Tarano (2019) (rules 1254, 1256)',
  '',
  `Scale height ${(H_FIGURE / 1_000).toFixed(2)} km (their Fig. 3's caption); distances in km scaled to 1 kt (×${SCALE.toFixed(1)} at 250 Mt). Overall: ${String(overall.judged)} judged, ${String(overall.left)} left out; worst ${f(overall.worst)}, median ${f(overall.median)} — **${overall.passes ? 'PASSES' : 'FAILS'}**. First-order fall-backs: ${String(fallbacks)}.`,
  '',
];
for (const t of thresholds) {
  lines.push(
    `## ${String(t.psi)} psi — worst ${f(t.verdict.worst)}, median ${f(t.verdict.median)}, ${String(t.verdict.judged)} judged`,
    '',
    '| Height (km, 1 kt) | Cart3D | Solver (5 m) | Ratio | Judged | Grids 20/10/5 m | Order | Extrapolated | H = 7.6 km |',
    '| --: | --: | --: | --: | --- | --- | --: | --: | --: |',
    ...t.rows.map(
      (x, k) =>
        `| ${String(x.h)} | ${f(x.reference)} | ${f(x.solver)} | ${f(x.ratio)} | ${x.left} | ${x.convergence.reaches.map((r) => r.toFixed(3)).join(' / ')} | ${f(x.convergence.order, 2)} | ${f(x.convergence.extrapolated)} | ${f(t.reachAtH76[k] ?? null)} |`
    ),
    ''
  );
}
writeFileSync('docs/BLAST2D_T3.md', lines.join('\n'));
console.log(
  JSON.stringify(
    { overall, perPsi: thresholds.map((t) => ({ psi: t.psi, ...t.verdict })) },
    null,
    1
  )
);
