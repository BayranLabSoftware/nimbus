/**
 * Rule 314(b) of `src/physics/validation/shakingFieldRules.ts`: does the field
 * give our footprint the shape of ShakeMap's footprint, where the single
 * number did not?
 *
 * ShakeMap is run here on the same source and the same rupture
 * (`strike-shakemap-scenario.py`); our own intensity is then evaluated on the
 * nodes of one common lattice — the same law, once with the single Vs30 the
 * simulator runs on and once with rule 310's ground at each node — and the two
 * masks at MMI VII are compared by intersection over union.
 *
 *   pnpm exec tsx scripts/benchmark/shaking-field.ts <out.json> <cases.json>
 *   <venv>/bin/python scripts/benchmark/strike-shakemap-scenario.py \
 *       --cases <cases.json> --work <dir> --config <install/config> --out <grids.json>
 *   pnpm exec tsx scripts/benchmark/shaking-field-shape.ts <cases.json> <grids.json>
 */

import { readFileSync } from 'node:fs';
import { SHAPE_MINIMUM_IMPROVED } from '../../src/physics/validation/shakingFieldRules.js';
import { intersectionOverUnion } from '../../src/physics/validation/strikeAgainstShakemapRules.js';
import { shippedSiteLookup } from '../../src/physics/validation/shippedVs30.js';
import {
  frameDistanceM,
  type RuptureFootprint,
} from '../../src/physics/events/earthquake/shakingField.js';
import {
  EARTHQUAKE_PRESETS,
  intensityLawOf,
  simulateEarthquake,
} from '../../src/physics/events/earthquake/simulate.js';

const LEVEL = 7;
/** The same lattice the strike comparison uses, finer than either grid. */
const LATTICE_DEG = 0.02;
const EARTH_MEAN_RADIUS_M = 6_371_008;
const DEG = Math.PI / 180;

interface Case {
  id: string;
  preset: string;
  lat: number;
  lon: number;
  strikeDeg: number;
  lengthKm: number;
  widthKm: number;
  place: string;
}

interface Grid {
  id: string;
  ok: boolean;
  nx: number;
  ny: number;
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
  dx: number;
  dy: number;
  mmi10: string;
  stderr?: string;
}

const site = shippedSiteLookup();
if (site === null) throw new Error('no Vs30 tiles: run scripts/build-vs30.py first');

const casesPath = process.argv[2];
const gridsPath = process.argv[3];
if (casesPath === undefined || gridsPath === undefined) {
  console.error('usage: shaking-field-shape.ts <cases.json> <grids.json>');
  process.exit(2);
}
const cases = JSON.parse(readFileSync(casesPath, 'utf8')) as Case[];
const grids = (JSON.parse(readFileSync(gridsPath, 'utf8')) as { rows: Grid[] }).rows;
const byId = new Map(grids.map((g) => [g.id, g]));

/** Where a place falls in the rupture's frame: x along strike, y across it. */
function toFrame(
  rupture: RuptureFootprint,
  latitude: number,
  longitude: number
): { x: number; y: number } {
  const lat0 = rupture.latitude * DEG;
  const lon0 = rupture.longitude * DEG;
  const phi = latitude * DEG;
  const dLambda = longitude * DEG - lon0;
  const h =
    Math.sin((phi - lat0) / 2) ** 2 + Math.cos(lat0) * Math.cos(phi) * Math.sin(dLambda / 2) ** 2;
  const d = 2 * EARTH_MEAN_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
  const azimuth = Math.atan2(
    Math.sin(dLambda) * Math.cos(phi),
    Math.cos(lat0) * Math.sin(phi) - Math.sin(lat0) * Math.cos(phi) * Math.cos(dLambda)
  );
  const theta = rupture.strikeDeg * DEG;
  return { x: d * Math.cos(azimuth - theta), y: d * Math.sin(azimuth - theta) };
}

console.log(
  '| evento | IoU con un Vs30 | IoU col campo | migliora | celle ShakeMap | nostre (unico/campo) |'
);
console.log('| --- | --: | --: | --- | --: | --: |');

let improved = 0;
let scored = 0;
const singles: number[] = [];
const fields: number[] = [];

for (const one of cases) {
  const grid = byId.get(one.id);
  if (grid?.ok !== true) {
    console.log(`| ${one.place} | — | — | scenario non riuscito | | |`);
    continue;
  }
  const presets = EARTHQUAKE_PRESETS as unknown as Record<
    string,
    { input: Parameters<typeof simulateEarthquake>[0] }
  >;
  const preset = presets[one.preset];
  if (preset === undefined) continue;
  const result = simulateEarthquake(preset.input);
  const law = intensityLawOf(result);
  if (law === null) continue;
  const vs30Single = preset.input.vs30 ?? 760;
  const rupture: RuptureFootprint = {
    latitude: one.lat,
    longitude: one.lon,
    strikeDeg: one.strikeDeg,
    halfLengthM: result.isExtendedSource ? (result.ruptureLength as number) / 2 : 0,
    halfWidthM: result.isExtendedSource ? (result.ruptureWidth as number) / 2 : 0,
  };

  const bytes = Buffer.from(grid.mmi10, 'base64');
  const shakemap = new Set<string>();
  const ourSingle = new Set<string>();
  const ourField = new Set<string>();
  const i0 = Math.ceil(grid.ymin / LATTICE_DEG);
  const i1 = Math.floor(grid.ymax / LATTICE_DEG);
  const j0 = Math.ceil(grid.xmin / LATTICE_DEG);
  const j1 = Math.floor(grid.xmax / LATTICE_DEG);
  for (let i = i0; i <= i1; i += 1) {
    const latitude = i * LATTICE_DEG;
    const row = Math.round((grid.ymax - latitude) / grid.dy);
    if (row < 0 || row >= grid.ny) continue;
    for (let j = j0; j <= j1; j += 1) {
      const longitude = j * LATTICE_DEG;
      const col = Math.round((longitude - grid.xmin) / grid.dx);
      if (col < 0 || col >= grid.nx) continue;
      const key = `${i.toString()}:${j.toString()}`;
      if ((bytes[row * grid.nx + col] ?? 0) >= LEVEL * 10) shakemap.add(key);
      const distance = frameDistanceM(rupture, toFrame(rupture, latitude, longitude));
      if (law(distance, vs30Single) >= LEVEL) ourSingle.add(key);
      if (law(distance, site(latitude, longitude).vs30) >= LEVEL) ourField.add(key);
    }
  }

  const iouSingle = intersectionOverUnion(ourSingle, shakemap);
  const iouField = intersectionOverUnion(ourField, shakemap);
  const better = iouField > iouSingle;
  if (Number.isFinite(iouSingle) && Number.isFinite(iouField)) {
    scored += 1;
    singles.push(iouSingle);
    fields.push(iouField);
    if (better) improved += 1;
  }
  console.log(
    `| ${one.place} | ${iouSingle.toFixed(3)} | **${iouField.toFixed(3)}** | ${better ? 'sì' : 'NO'} | ${shakemap.size.toString()} | ${ourSingle.size.toString()} / ${ourField.size.toString()} |`
  );
}

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 === 1 ? (s[mid] ?? Number.NaN) : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
};

console.log('');
console.log(
  `314(b) mediana IoU: ${median(singles).toFixed(3)} -> ${median(fields).toFixed(3)}; migliora su ${improved.toString()}/${scored.toString()} (minimo ${SHAPE_MINIMUM_IMPROVED.toString()})  ->  ${
    median(fields) > median(singles) && improved >= SHAPE_MINIMUM_IMPROVED ? 'DENTRO' : 'FUORI'
  }`
);
