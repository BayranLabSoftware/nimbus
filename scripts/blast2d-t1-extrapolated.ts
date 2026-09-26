/**
 * Rule 1258 (`src/physics/validation/blastSolverRules.ts`): T1 judged again on
 * the radius extrapolated from its three grids (rule 1256 (c)), from
 * `blast2dT1Sedov.json` — no new run. A criterion written after T1's outcome.
 *
 *   pnpm exec tsx scripts/blast2d-t1-extrapolated.ts
 *
 * Writes src/physics/validation/blast2dT1Extrapolated.json.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { converge } from './blast2d-hob-judge.js';

interface T1 {
  results: {
    cells: number;
    dx: number;
    sourceRadius: number;
    readings: { t: number; exact: number; ground: number; axis: number; diagonal: number }[];
  }[];
}
const t1 = JSON.parse(readFileSync('src/physics/validation/blast2dT1Sedov.json', 'utf8')) as T1;
const grids = [...t1.results].sort((a, b) => b.dx - a.dx);
const L = 1.2;
const rows = [];
const marks = grids[0]?.readings.length ?? 0;
for (let m = 0; m < marks; m++) {
  const exact = grids[0]?.readings[m]?.exact ?? NaN;
  const inRange = grids.every((g) => exact >= g.sourceRadius + 10 * g.dx) && exact <= L / 2 + 1e-12;
  for (const ray of ['ground', 'axis', 'diagonal'] as const) {
    const radii = grids.map((g) => g.readings[m]?.[ray] ?? NaN);
    const c = converge(radii);
    const value = c.extrapolated ?? radii[radii.length - 1] ?? NaN;
    const deviation = value / exact - 1;
    rows.push({
      exact,
      ray,
      radii,
      order: c.order,
      extrapolated: c.extrapolated,
      error: c.error,
      deviation,
      judged: inRange,
      within: Math.abs(deviation) <= 0.02 && (c.extrapolated !== null || c.error / exact <= 0.02),
    });
  }
}
const judged = rows.filter((r) => r.judged);
const passes = judged.length > 0 && judged.every((r) => r.within);
const worst = Math.max(...judged.map((r) => Math.abs(r.deviation)));
writeFileSync(
  'src/physics/validation/blast2dT1Extrapolated.json',
  `${JSON.stringify({ rule: '1258', criterion: 0.02, judged: judged.length, worst, passes, rows }, null, 1)}\n`
);
for (const r of rows)
  console.log(
    `R=${r.exact.toFixed(3)} ${r.ray.padEnd(8)} ${r.radii.map((x) => x.toFixed(4)).join(' ')} order ${r.order === null ? '—' : r.order.toFixed(2)} ext ${r.extrapolated === null ? '—' : r.extrapolated.toFixed(4)} dev ${(100 * r.deviation).toFixed(2)} % ${r.judged ? (r.within ? 'ok' : 'MISS') : '(not judged)'}`
  );
console.log({ judged: judged.length, worst, passes });
