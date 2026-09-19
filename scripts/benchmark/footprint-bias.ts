/**
 * The amendment of 16 September 2026, applied to the footprint: is our MMI VII
 * area further from the published one than the REFERENCE's is, on the same
 * rows, and is our scatter wider?
 *
 * That amendment fixed what a validation bar may ask — "the bias no further
 * from one and σ no wider than the reference's, on the same held-out rows
 * against the same record" — and the footprint had never been read that way.
 * Rule 314(a) asked for closeness to the published area outright, which is a
 * bar the reference itself misses by up to twenty-two.
 *
 * Runs on the six events already spent by rules 309 to 315, whose numbers are
 * therefore READ, and says so. It is arithmetic on figures already committed,
 * not a new measurement: `scripts/benchmark/shaking-field.ts` produced ours and
 * `scripts/benchmark/area-against-scenario.ts` the reference's.
 *
 *   pnpm exec tsx scripts/benchmark/footprint-bias.ts <ours.json> <grids.json>
 */

import { readFileSync } from 'node:fs';
import { SHAKEMAP_FOOTPRINTS } from '../../src/physics/validation/shakemapFixtures.js';

const EARTH_RADIUS_M = 6_371_000;
const LEVEL = 7;

interface Grid {
  id: string;
  ok: boolean;
  nx: number;
  ny: number;
  xmin: number;
  ymax: number;
  dx: number;
  dy: number;
  mmi10: string;
}

interface OurRow {
  name: string;
  singleRatio: number;
  fieldRatio: number;
}

function areaKm2(grid: Grid): number {
  const bytes = Buffer.from(grid.mmi10, 'base64');
  let area = 0;
  for (let row = 0; row < grid.ny; row += 1) {
    const latitude = grid.ymax - row * grid.dy;
    const cell =
      ((grid.dy * Math.PI) / 180) *
      EARTH_RADIUS_M *
      ((grid.dx * Math.PI) / 180) *
      EARTH_RADIUS_M *
      Math.cos((latitude * Math.PI) / 180);
    for (let col = 0; col < grid.nx; col += 1) {
      if ((bytes[row * grid.nx + col] ?? 0) >= LEVEL * 10) area += cell;
    }
  }
  return area / 1e6;
}

/** Geometric bias and the scatter about it, in natural logs. */
function stats(ratios: readonly number[]): { bias: number; sigma: number; n: number } {
  const ln = ratios.filter((r) => r > 0).map(Math.log);
  const mean = ln.reduce((a, b) => a + b, 0) / ln.length;
  const variance = ln.reduce((a, b) => a + (b - mean) ** 2, 0) / (ln.length - 1);
  return { bias: Math.exp(mean), sigma: Math.sqrt(variance), n: ln.length };
}

const oursPath = process.argv[2];
const gridsPath = process.argv[3];
if (oursPath === undefined || gridsPath === undefined) {
  console.error('usage: footprint-bias.ts <ours.json> <grids.json>');
  process.exit(2);
}
const ours = (JSON.parse(readFileSync(oursPath, 'utf8')) as { rows: OurRow[] }).rows;
const grids = (JSON.parse(readFileSync(gridsPath, 'utf8')) as { rows: Grid[] }).rows;

const single: number[] = [];
const field: number[] = [];
const reference: number[] = [];
for (const footprint of SHAKEMAP_FOOTPRINTS) {
  const published = footprint.areaKm2[7];
  if (!(published > 0)) continue;
  const mine = ours.find((r) => r.name === footprint.name);
  const grid = grids.find((g) => g.id === footprint.preset.toLowerCase());
  if (mine === undefined || grid?.ok !== true) continue;
  single.push(mine.singleRatio);
  field.push(mine.fieldRatio);
  reference.push(areaKm2(grid) / published);
}

const a = stats(single);
const b = stats(field);
const c = stats(reference);
const closer = Math.abs(Math.log(b.bias)) <= Math.abs(Math.log(c.bias));
const tighter = b.sigma <= c.sigma;

console.log(`sulle stesse ${b.n.toString()} righe, contro l'area MMI VII pubblicata:`);
console.log(`  noi, un Vs30     bias ${a.bias.toFixed(3)}×   σ ${a.sigma.toFixed(3)}`);
console.log(`  noi, col campo   bias ${b.bias.toFixed(3)}×   σ ${b.sigma.toFixed(3)}`);
console.log(`  ShakeMap cieco   bias ${c.bias.toFixed(3)}×   σ ${c.sigma.toFixed(3)}`);
console.log('');
console.log('emendamento del 16 settembre: bias non più lontano da 1 E σ non più largo');
console.log(
  `  bias  |ln| ${Math.abs(Math.log(b.bias)).toFixed(3)} contro ${Math.abs(Math.log(c.bias)).toFixed(3)}  ->  ${closer ? 'SODDISFATTO' : 'NON soddisfatto'}`
);
console.log(
  `  σ     ${b.sigma.toFixed(3)} contro ${c.sigma.toFixed(3)}  ->  ${tighter ? 'SODDISFATTO' : 'NON soddisfatto'}`
);
console.log('');
console.log(
  'sei righe già lette: questo è un conto su numeri committati, non una validazione su righe tenute fuori.'
);
