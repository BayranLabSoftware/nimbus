/**
 * How far the REFERENCE is from the published map, on the same rows.
 *
 * Rule 314(a) held our MMI VII area against the area of each event's published
 * ShakeMap and refused the round on it. This asks the question the amendment of
 * 16 September 2026 says must be asked before any such bar is believed: what
 * does the reference itself score against that same published area, run the way
 * we are run — no stations, no intensity reports, one source and one rupture?
 *
 * The scenarios are the ones `strike-shakemap-scenario.py` already produced for
 * rule 314(b); this only sums them.
 *
 *   pnpm exec tsx scripts/benchmark/area-against-scenario.ts <grids.json> [<ours.json>]
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

const gridsPath = process.argv[2];
if (gridsPath === undefined) {
  console.error('usage: area-against-scenario.ts <grids.json> [<ours.json>]');
  process.exit(2);
}
const grids = (JSON.parse(readFileSync(gridsPath, 'utf8')) as { rows: Grid[] }).rows;
const oursPath = process.argv[3];
const ours =
  oursPath === undefined
    ? []
    : (JSON.parse(readFileSync(oursPath, 'utf8')) as { rows: OurRow[] }).rows;

/** Ground area at or above the level in a scenario's grid (km²). */
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

console.log(
  '| evento | area pubblicata | ShakeMap senza stazioni | rapporto del riferimento | nostro con un Vs30 | nostro col campo | noi / riferimento |'
);
console.log('| --- | --: | --: | --: | --: | --: | --: |');

const referenceRatios: number[] = [];
const againstReference: number[] = [];

for (const footprint of SHAKEMAP_FOOTPRINTS) {
  const grid = grids.find((g) => g.id === footprint.preset.toLowerCase());
  if (grid?.ok !== true) continue;
  const scenario = areaKm2(grid);
  const published = footprint.areaKm2[7];
  if (!(published > 0)) continue;
  const referenceRatio = scenario / published;
  referenceRatios.push(referenceRatio);
  const mine = ours.find((r) => r.name === footprint.name);
  const relative = mine === undefined ? Number.NaN : (mine.fieldRatio * published) / scenario;
  if (Number.isFinite(relative)) againstReference.push(relative);
  console.log(
    `| ${footprint.name} | ${published.toFixed(0)} km² | ${scenario.toFixed(0)} km² | **${referenceRatio.toFixed(2)}** | ${mine?.singleRatio.toFixed(2) ?? '—'} | ${mine?.fieldRatio.toFixed(2) ?? '—'} | ${Number.isFinite(relative) ? relative.toFixed(2) : '—'} |`
  );
}

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 === 1 ? (s[mid] ?? Number.NaN) : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
};

console.log('');
console.log(
  `il riferimento senza stazioni: mediana ${median(referenceRatios).toFixed(2)}× l'area pubblicata, da ${Math.min(...referenceRatios).toFixed(2)} a ${Math.max(...referenceRatios).toFixed(2)}`
);
if (againstReference.length > 0) {
  console.log(
    `noi contro il riferimento, sulle stesse righe: mediana ${median(againstReference).toFixed(2)}, da ${Math.min(...againstReference).toFixed(2)} a ${Math.max(...againstReference).toFixed(2)}`
  );
}
