/**
 * Rule 315 of `src/physics/validation/shakingFieldRules.ts`: what the field
 * does to the footprint, measured against the published ShakeMap areas the
 * project already carries.
 *
 * For each of the six events of `SHAKEMAP_FOOTPRINTS`, the MMI VII area of the
 * same scenario evaluated twice on the same grid with the same law: once with
 * the single Vs30 the simulator runs on today, once with rule 310's ground at
 * every point. Both against the published area.
 *
 * Needs the tiles `scripts/build-vs30.py` writes into `public/data/vs30/`.
 *
 *   pnpm exec tsx scripts/benchmark/shaking-field.ts [<out.json>]
 */

import { writeFileSync } from 'node:fs';
import { SHAKEMAP_FOOTPRINTS } from '../../src/physics/validation/shakemapFixtures.js';
import { RECORDED_EVENTS } from '../../src/physics/validation/recordedTolls.js';
import { shippedSiteLookup } from '../../src/physics/validation/shippedVs30.js';
import {
  FIELD_BUDGET_MS,
  WORST_RATIO_REGRESSION,
} from '../../src/physics/validation/shakingFieldRules.js';
import {
  areaAbove,
  contourRings,
  evaluateShakingField,
  type RuptureFootprint,
} from '../../src/physics/events/earthquake/shakingField.js';
import {
  EARTHQUAKE_PRESETS,
  intensityLawOf,
  simulateEarthquake,
} from '../../src/physics/events/earthquake/simulate.js';

/** The published areas are summed at MMI ≥ 7.0, so the field is read there. */
const LEVEL = 7;

const site = shippedSiteLookup();
if (site === null) throw new Error('no Vs30 tiles: run scripts/build-vs30.py first');

/** Where each event happened, from the net the project already records.
 *
 *  Matched by PRESET and not by name: the fixture calls one event "Gorkha 2015"
 *  and the net calls it "Gorkha (Nepal) 2015", and a prefix match silently
 *  dropped two of the six from the first run of this benchmark. */
const EPICENTRE_BY_PRESET: Record<string, string> = {
  NORTHRIDGE_1994: 'Northridge 1994',
  L_AQUILA_2009: "L'Aquila 2009",
  AMATRICE_2016: 'Amatrice 2016',
  NEPAL_2015: 'Gorkha (Nepal) 2015',
  TOHOKU_2011: 'Tōhoku 2011',
  KUNLUN_2001: 'Kokoxili (Kunlun) 2001',
};

function epicentreOf(preset: string): { latitude: number; longitude: number } | null {
  const wanted = EPICENTRE_BY_PRESET[preset];
  if (wanted === undefined) return null;
  for (const event of RECORDED_EVENTS) {
    if (event.name === wanted) {
      return { latitude: event.latitude, longitude: event.longitude };
    }
  }
  return null;
}

interface Row {
  name: string;
  publishedKm2: number;
  singleKm2: number;
  fieldKm2: number;
  singleRatio: number;
  fieldRatio: number;
  vs30Single: number;
  provenance: Record<string, number>;
  elapsedMs: number;
  stepKm: number;
  rings: { single: number; field: number };
}

/** Rule 314(b): the ShakeMap scenario of each event, same source and same
 *  rupture as ours, written for `strike-shakemap-scenario.py`. */
const WHEN: Record<string, string> = {
  NORTHRIDGE_1994: '1994-01-17T12:30:55Z',
  L_AQUILA_2009: '2009-04-06T01:32:39Z',
  AMATRICE_2016: '2016-08-24T01:36:32Z',
  NEPAL_2015: '2015-04-25T06:11:25Z',
  TOHOKU_2011: '2011-03-11T05:46:24Z',
  KUNLUN_2001: '2001-11-14T09:26:10Z',
};
const scenarioCases: Record<string, unknown>[] = [];

const rows: Row[] = [];
console.log(
  '| evento | area pubblicata | area con un Vs30 | area col campo | rapporto prima | rapporto dopo | Vs30 unico | celle dal grigliato | passo | ms |'
);
console.log('| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: |');

for (const footprint of SHAKEMAP_FOOTPRINTS) {
  if (!(footprint.areaKm2[7] > 0)) continue;
  const presets = EARTHQUAKE_PRESETS as unknown as Record<
    string,
    { input: Parameters<typeof simulateEarthquake>[0] }
  >;
  const preset = presets[footprint.preset];
  if (preset === undefined) {
    console.log(`| ${footprint.name} | — | preset assente | | | | | | | |`);
    continue;
  }
  const where = epicentreOf(footprint.preset);
  if (where === null) {
    console.log(`| ${footprint.name} | — | epicentro assente dalla rete | | | | | | | |`);
    continue;
  }
  const result = simulateEarthquake(preset.input);
  const law = intensityLawOf(result);
  if (law === null) throw new Error('no law for this result');
  const vs30Single = preset.input.vs30 ?? 760;
  const rupture: RuptureFootprint = {
    latitude: where.latitude,
    longitude: where.longitude,
    strikeDeg: preset.input.strikeAzimuthDeg ?? 0,
    halfLengthM: result.isExtendedSource ? (result.ruptureLength as number) / 2 : 0,
    halfWidthM: result.isExtendedSource ? (result.ruptureWidth as number) / 2 : 0,
  };
  // Rule 312: wide enough to hold the outermost contour and then some, because
  // soft ground pushes it out.
  const halfSpanM =
    rupture.halfLengthM + Math.max(30_000, 2.5 * (result.shaking.mmi7Radius as number));

  const single = evaluateShakingField({
    rupture,
    intensityAt: law,
    siteAt: () => ({ vs30: vs30Single, provenance: 'rock' as const }),
    halfSpanM,
  });
  const field = evaluateShakingField({
    rupture,
    intensityAt: law,
    siteAt: site,
    halfSpanM,
  });

  const singleKm2 = areaAbove(single, LEVEL) / 1e6;
  const fieldKm2 = areaAbove(field, LEVEL) / 1e6;
  const publishedKm2 = footprint.areaKm2[7];
  const row: Row = {
    name: footprint.name,
    publishedKm2,
    singleKm2,
    fieldKm2,
    singleRatio: singleKm2 / publishedKm2,
    fieldRatio: fieldKm2 / publishedKm2,
    vs30Single,
    provenance: field.provenance,
    elapsedMs: field.elapsedMs,
    stepKm: field.stepM / 1000,
    rings: {
      single: contourRings(single, LEVEL).length,
      field: contourRings(field, LEVEL).length,
    },
  };
  rows.push(row);
  scenarioCases.push({
    id: footprint.preset.toLowerCase(),
    preset: footprint.preset,
    variant: 'strike',
    lat: where.latitude,
    lon: where.longitude,
    magnitude: preset.input.magnitude,
    depthKm: ((preset.input.depth as number | undefined) ?? 10_000) / 1000,
    time: WHEN[footprint.preset] ?? '2020-01-01T00:00:00Z',
    place: footprint.name,
    mech: preset.input.subductionInterface === true ? 'RS' : 'ALL',
    strikeDeg: rupture.strikeDeg,
    dipDeg: preset.input.subductionInterface === true ? 15 : 90,
    lengthKm: (result.ruptureLength as number) / 1000,
    widthKm: (result.ruptureWidth as number) / 1000,
    ...(preset.input.subductionInterface === true
      ? { gmpe: 'subduction_interface_nshmp2014' }
      : {}),
  });
  const fromGrid = field.provenance.grid / (field.points * field.points);
  console.log(
    `| ${row.name} | ${publishedKm2.toFixed(0)} km² | ${singleKm2.toFixed(0)} km² | ${fieldKm2.toFixed(0)} km² | ${row.singleRatio.toFixed(3)} | **${row.fieldRatio.toFixed(3)}** | ${vs30Single.toFixed(0)} | ${(100 * fromGrid).toFixed(0)} % | ${row.stepKm.toFixed(1)} km | ${row.elapsedMs.toString()} |`
  );
}

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 === 1 ? (s[mid] ?? Number.NaN) : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
};
const distance = (r: number): number => Math.abs(Math.log(r));
const beforeMedian = median(rows.map((r) => r.singleRatio));
const afterMedian = median(rows.map((r) => r.fieldRatio));
const worsened = rows.filter(
  (r) => distance(r.fieldRatio) > distance(r.singleRatio) + Math.log(WORST_RATIO_REGRESSION)
);
const slowest = Math.max(...rows.map((r) => r.elapsedMs));

console.log('');
console.log(
  `314(a) mediana del rapporto: ${beforeMedian.toFixed(3)} -> ${afterMedian.toFixed(3)}  ->  ${
    distance(afterMedian) < distance(beforeMedian) ? 'PIÙ VICINA A 1' : 'PIÙ LONTANA DA 1'
  }`
);
console.log(
  `314(a) nessuna riga peggiora di più di ${WORST_RATIO_REGRESSION.toFixed(1)}×  ->  ${worsened.length === 0 ? 'DENTRO' : `FUORI (${worsened.map((r) => r.name).join(', ')})`}`
);
console.log(
  `314(c) campo più lento: ${slowest.toString()} ms contro ${FIELD_BUDGET_MS.toString()}  ->  ${slowest <= FIELD_BUDGET_MS ? 'DENTRO' : 'FUORI'}`
);
console.log(
  `anelli per livello: ${rows.map((r) => `${r.name} ${r.rings.single.toString()}→${r.rings.field.toString()}`).join(', ')}`
);

const out = process.argv[2];
if (out !== undefined) {
  writeFileSync(out, `${JSON.stringify({ level: LEVEL, rows }, null, 1)}\n`);
  console.log(`scritto ${out}`);
}
const cases = process.argv[3];
if (cases !== undefined) {
  writeFileSync(cases, `${JSON.stringify(scenarioCases, null, 1)}\n`);
  console.log(`scritti ${scenarioCases.length.toString()} casi ShakeMap in ${cases}`);
}
