/**
 * Rule 1254 (c) T2 (and T5 on it): the solver at 1 kt against Glasstone &
 * Dolan's height-of-burst map, as digitised under rule 1251 (the solid curves
 * of `porta1Hob250MtFigure.json`). A sea-level uniform atmosphere; 1 kt as
 * blast, one for one, in Collins et al. (2017)'s nominal 45 m source; the
 * reach at 1, 2, 4 and 10 psi at the figure's 26 heights; three grids of 20,
 * 10 and 5 m. Criterion: every judged reach within 10 %, the median within
 * 5 % (rule 1256 for what is judged).
 *
 *   pnpm exec tsx scripts/blast2d-t2-gd1kt.ts [parallel]
 *
 * Writes src/physics/validation/blast2dT2.json and docs/BLAST2D_T2.md.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import type { BlastCase } from './blast2d-run.js';
import { judge, verdict, type Reading } from './blast2d-hob-judge.js';
import { runPool } from './blast2d-pool.js';

interface Figure {
  heightsKm1kt: number[];
  curves: Record<string, { glasstoneDolan1kt: Reading[] }>;
}
const figure = JSON.parse(
  readFileSync('src/physics/validation/porta1Hob250MtFigure.json', 'utf8')
) as Figure;

const KT = 4.184e12;
const GRIDS = [20, 10, 5];
const heights = figure.heightsKm1kt;
const parallel = Number(process.argv[2] ?? 4);

const caseAt = (hKm: number, dx: number): BlastCase => ({
  atmosphere: { kind: 'uniform', rho0: 1.225, p0: 101_325 },
  energy: KT,
  height: hKm * 1_000,
  radius: 45,
  dx,
  rMax: 2_600,
  zMax: Math.max(1_500, hKm * 1_000 + 1_200),
});

const cases = GRIDS.flatMap((dx) => heights.map((h) => caseAt(h, dx)));
const runs = await runPool(cases, 'scripts/tmp/blast2d-cache', parallel);
const byGrid = GRIDS.map((_, g) => runs.slice(g * heights.length, (g + 1) * heights.length));

const thresholds = [1, 2, 4, 10].map((psi) => {
  const ref = figure.curves[`${String(psi)} psi`]?.glasstoneDolan1kt;
  if (ref === undefined) throw new Error('no reference');
  const rows = judge(psi, heights, ref, byGrid, 1);
  return { psi, verdict: verdict(rows), rows };
});
const all = thresholds.flatMap((t) => t.rows);
const overall = verdict(all);
const fallbacks = runs.reduce((n, r) => n + r.fallbacks, 0);
const out = {
  rule: '1254 (c) T2, T5',
  grids: GRIDS,
  overall,
  fallbacks,
  seconds: runs.reduce((n, r) => n + r.seconds, 0),
  thresholds,
};
writeFileSync('src/physics/validation/blast2dT2.json', `${JSON.stringify(out, null, 1)}\n`);

const f = (x: number | null, d = 3): string => (x === null ? '—' : x.toFixed(d));
const lines = [
  '# Blast solver — T2: 1 kt against Glasstone & Dolan (rules 1254, 1256)',
  '',
  `Overall: ${String(overall.judged)} readings judged, ${String(overall.left)} left out; worst ${f(overall.worst)}, median ${f(overall.median)} — **${overall.passes ? 'PASSES' : 'FAILS'}** (every judged reach within 0.10, median within 0.05). First-order fall-backs: ${String(fallbacks)}.`,
  '',
];
for (const t of thresholds) {
  lines.push(
    `## ${String(t.psi)} psi — worst ${f(t.verdict.worst)}, median ${f(t.verdict.median)}, ${String(t.verdict.judged)} judged`,
    '',
    '| Height (km) | G&D (km) | Solver 5 m (km) | Ratio | Judged | Grids 20/10/5 m | Order | Extrapolated | Error |',
    '| --: | --: | --: | --: | --- | --- | --: | --: | --: |',
    ...t.rows.map(
      (x) =>
        `| ${String(x.h)} | ${f(x.reference)} | ${f(x.solver)} | ${f(x.ratio)} | ${x.left} | ${x.convergence.reaches.map((r) => r.toFixed(3)).join(' / ')} | ${f(x.convergence.order, 2)} | ${f(x.convergence.extrapolated)} | ${f(x.convergence.error)} |`
    ),
    ''
  );
}
writeFileSync('docs/BLAST2D_T2.md', lines.join('\n'));
console.log(
  JSON.stringify(
    { overall, perPsi: thresholds.map((t) => ({ psi: t.psi, ...t.verdict })) },
    null,
    1
  )
);
