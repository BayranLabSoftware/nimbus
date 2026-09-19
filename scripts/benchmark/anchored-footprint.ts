/**
 * Rules 316 to 321 of `src/physics/validation/anchoredFootprintRules.ts`: our
 * MMI VII footprint against the reference's, on twelve rows nobody has read.
 *
 *   pnpm exec tsx scripts/benchmark/anchored-footprint.ts --cases <cases.json>
 *   <venv>/bin/python scripts/benchmark/strike-shakemap-scenario.py \
 *       --cases <cases.json> --work <dir> --config <install/config> --out <grids.json>
 *   pnpm exec tsx scripts/benchmark/anchored-footprint.ts --compare <cases.json> <grids.json>
 *
 * Two choices of the harness, declared here because they are choices:
 *
 *  - ShakeMap is given a rupture whose SURFACE PROJECTION is the rectangle our
 *    stadium inflates — dip 30° and a down-dip width of W / cos 30° — so that
 *    the two footprints are grown from the same shape on the ground. Any other
 *    dip would compare our geometry with a different one.
 *  - Both run on the configuration's default ground-motion set. Our own
 *    scenarios are not marked as subduction interfaces (rule 320 forbids
 *    touching that here), so marking the reference's would compare two
 *    different families.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ANCHORED_LEVEL,
  ANCHORED_ROWS,
  ANCHORED_SHAPE_MINIMUM,
  ANCHORED_WORST_REGRESSION,
} from '../../src/physics/validation/anchoredFootprintRules.js';
import { UNSEEN_EARTHQUAKES } from '../../src/physics/validation/unseenSetData.js';
import { intersectionOverUnion } from '../../src/physics/validation/strikeAgainstShakemapRules.js';
import { shippedSiteLookup } from '../../src/physics/validation/shippedVs30.js';
import { shippedSlabField } from '../../src/physics/validation/shippedSlab2.js';
import {
  decodeFault,
  faultTileKey,
  type FaultTileIndex,
  type PackedFault,
} from '../../src/physics/events/earthquake/faultLookup.js';
import { chooseStrike } from '../../src/physics/events/earthquake/strikeSource.js';
import {
  frameDistanceM,
  type RuptureFootprint,
} from '../../src/physics/events/earthquake/shakingField.js';
import {
  intensityLawOf,
  simulateEarthquake,
  type EarthquakeScenarioInput,
} from '../../src/physics/events/earthquake/simulate.js';

const EARTH_RADIUS_M = 6_371_008;
const DEG = Math.PI / 180;
const LATTICE_DEG = 0.02;
const HARNESS_DIP_DEG = 30;

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const FAULT_DIR = join(ROOT, 'public', 'data', 'faults');

interface Case {
  id: string;
  comcat: string;
  lat: number;
  lon: number;
  magnitude: number;
  depthKm: number;
  time: string;
  place: string;
  mech: string;
  strikeDeg: number;
  strikeSource: string;
  dipDeg: number;
  lengthKm: number;
  widthKm: number;
  vs30Single: number;
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
}

function inputFor(row: (typeof UNSEEN_EARTHQUAKES)[number]): EarthquakeScenarioInput {
  return {
    magnitude: row.magnitude,
    depth: (row.depthKm * 1000) as NonNullable<EarthquakeScenarioInput['depth']>,
    faultType: row.faultType,
  };
}

function buildCases(): Case[] {
  const faultIndex = JSON.parse(
    readFileSync(join(FAULT_DIR, 'index.json'), 'utf8')
  ) as FaultTileIndex;
  const field = shippedSlabField();
  const cases: Case[] = [];
  for (const comcat of ANCHORED_ROWS) {
    const row = UNSEEN_EARTHQUAKES.find((e) => e.comcat === comcat);
    if (row === undefined) throw new Error(`row ${comcat} not in UNSEEN_EARTHQUAKES`);
    const result = simulateEarthquake(inputFor(row));
    const lengthKm = (result.ruptureLength as number) / 1000;
    const widthKm = (result.ruptureWidth as number) / 1000;

    // Rule 316: the strike rules 295 to 303 find, north where they find none.
    const key = faultTileKey(row.latitude, row.longitude, faultIndex.tileDeg);
    let packed: PackedFault[] = [];
    try {
      packed = (
        JSON.parse(readFileSync(join(FAULT_DIR, `${key}.json`), 'utf8')) as {
          faults: PackedFault[];
        }
      ).faults;
    } catch {
      packed = [];
    }
    const faults = packed.map((f) => decodeFault(f, faultIndex)).filter((f) => f !== null);
    const answer = chooseStrike(
      {
        latitude: row.latitude,
        longitude: row.longitude,
        hypocentreDepthM: row.depthKm * 1000,
        ruptureLengthM: lengthKm * 1000,
      },
      field,
      faults
    );

    cases.push({
      id: comcat.toLowerCase(),
      comcat,
      lat: row.latitude,
      lon: row.longitude,
      magnitude: row.magnitude,
      depthKm: row.depthKm,
      time: row.time,
      place: row.place,
      mech:
        row.faultType === 'strike-slip'
          ? 'SS'
          : row.faultType === 'reverse'
            ? 'RS'
            : row.faultType === 'normal'
              ? 'NM'
              : 'ALL',
      strikeDeg: answer.strikeDeg ?? 0,
      strikeSource: answer.source,
      dipDeg: HARNESS_DIP_DEG,
      lengthKm,
      // The down-dip width whose surface projection is our own W.
      widthKm: widthKm / Math.cos(HARNESS_DIP_DEG * DEG),
      vs30Single: 760,
    });
  }
  return cases;
}

/** Where a place falls in the rupture's frame. */
function toFrame(
  rupture: RuptureFootprint,
  latitude: number,
  longitude: number
): { x: number; y: number } {
  const lat0 = rupture.latitude * DEG;
  const phi = latitude * DEG;
  const dLambda = longitude * DEG - rupture.longitude * DEG;
  const h =
    Math.sin((phi - lat0) / 2) ** 2 + Math.cos(lat0) * Math.cos(phi) * Math.sin(dLambda / 2) ** 2;
  const d = 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
  const azimuth = Math.atan2(
    Math.sin(dLambda) * Math.cos(phi),
    Math.cos(lat0) * Math.sin(phi) - Math.sin(lat0) * Math.cos(phi) * Math.cos(dLambda)
  );
  const theta = rupture.strikeDeg * DEG;
  return { x: d * Math.cos(azimuth - theta), y: d * Math.sin(azimuth - theta) };
}

const mode = process.argv[2];
if (mode === '--cases') {
  const out = process.argv[3];
  if (out === undefined) throw new Error('usage: --cases <out.json>');
  const cases = buildCases();
  writeFileSync(out, `${JSON.stringify(cases, null, 1)}\n`);
  console.log(`scritti ${cases.length.toString()} casi in ${out}`);
  for (const c of cases) {
    console.log(
      `  ${c.id.padEnd(12)} Mw ${c.magnitude.toFixed(1)}  ${c.depthKm.toFixed(0)} km  L ${c.lengthKm.toFixed(0)}  W ${c.widthKm.toFixed(0)}  strike ${c.strikeDeg.toFixed(0)}° (${c.strikeSource})`
    );
  }
} else if (mode === '--compare') {
  const casesPath = process.argv[3];
  const gridsPath = process.argv[4];
  if (casesPath === undefined || gridsPath === undefined) {
    throw new Error('usage: --compare <cases.json> <grids.json>');
  }
  const cases = JSON.parse(readFileSync(casesPath, 'utf8')) as Case[];
  const grids = (JSON.parse(readFileSync(gridsPath, 'utf8')) as { rows: Grid[] }).rows;
  const byId = new Map(grids.map((g) => [g.id, g]));
  const site = shippedSiteLookup();
  if (site === null) throw new Error('no Vs30 tiles: run scripts/build-vs30.py first');

  console.log(
    '| evento | Mw | rif. km² | un Vs30 | campo | rapporto prima | rapporto dopo | IoU prima | IoU dopo | pubblicata | strike |'
  );
  console.log('| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --- |');

  const beforeRatios: number[] = [];
  const afterRatios: number[] = [];
  const beforeIou: number[] = [];
  const afterIou: number[] = [];
  let shapeImproved = 0;
  const worsened: string[] = [];

  for (const one of cases) {
    const grid = byId.get(one.id);
    if (grid?.ok !== true) {
      console.log(
        `| ${one.place} | ${one.magnitude.toFixed(1)} | scenario non riuscito | | | | | | | | |`
      );
      continue;
    }
    const row = UNSEEN_EARTHQUAKES.find((e) => e.comcat === one.comcat);
    if (row === undefined) throw new Error(`row ${one.comcat} not in UNSEEN_EARTHQUAKES`);
    const result = simulateEarthquake(inputFor(row));
    const law = intensityLawOf(result);
    if (law === null) continue;
    const rupture: RuptureFootprint = {
      latitude: one.lat,
      longitude: one.lon,
      strikeDeg: one.strikeDeg,
      halfLengthM: result.isExtendedSource ? (result.ruptureLength as number) / 2 : 0,
      halfWidthM: result.isExtendedSource ? (result.ruptureWidth as number) / 2 : 0,
    };

    const bytes = Buffer.from(grid.mmi10, 'base64');
    const reference = new Set<string>();
    const single = new Set<string>();
    const withField = new Set<string>();
    let referenceArea = 0;
    let singleArea = 0;
    let fieldArea = 0;
    const i0 = Math.ceil(grid.ymin / LATTICE_DEG);
    const i1 = Math.floor(grid.ymax / LATTICE_DEG);
    const j0 = Math.ceil(grid.xmin / LATTICE_DEG);
    const j1 = Math.floor(grid.xmax / LATTICE_DEG);
    for (let i = i0; i <= i1; i += 1) {
      const latitude = i * LATTICE_DEG;
      const gridRow = Math.round((grid.ymax - latitude) / grid.dy);
      if (gridRow < 0 || gridRow >= grid.ny) continue;
      const cellM2 =
        ((LATTICE_DEG * Math.PI) / 180) *
        EARTH_RADIUS_M *
        ((LATTICE_DEG * Math.PI) / 180) *
        EARTH_RADIUS_M *
        Math.cos(latitude * DEG);
      for (let j = j0; j <= j1; j += 1) {
        const longitude = j * LATTICE_DEG;
        const col = Math.round((longitude - grid.xmin) / grid.dx);
        if (col < 0 || col >= grid.nx) continue;
        const key = `${i.toString()}:${j.toString()}`;
        if ((bytes[gridRow * grid.nx + col] ?? 0) >= ANCHORED_LEVEL * 10) {
          reference.add(key);
          referenceArea += cellM2;
        }
        const distance = frameDistanceM(rupture, toFrame(rupture, latitude, longitude));
        if (law(distance, one.vs30Single) >= ANCHORED_LEVEL) {
          single.add(key);
          singleArea += cellM2;
        }
        if (law(distance, site(latitude, longitude).vs30) >= ANCHORED_LEVEL) {
          withField.add(key);
          fieldArea += cellM2;
        }
      }
    }

    if (!(referenceArea > 0)) {
      console.log(
        `| ${one.place} | ${one.magnitude.toFixed(1)} | il riferimento non raggiunge MMI VII | | | | | | | ${row.areaKm2[7].toFixed(0)} | ${one.strikeSource} |`
      );
      continue;
    }
    const before = singleArea / referenceArea;
    const after = fieldArea / referenceArea;
    const iouBefore = intersectionOverUnion(single, reference);
    const iouAfter = intersectionOverUnion(withField, reference);
    beforeRatios.push(before);
    afterRatios.push(after);
    beforeIou.push(iouBefore);
    afterIou.push(iouAfter);
    if (iouAfter > iouBefore) shapeImproved += 1;
    if (
      Math.abs(Math.log(after)) >
      Math.abs(Math.log(before)) + Math.log(ANCHORED_WORST_REGRESSION)
    ) {
      worsened.push(one.place);
    }
    console.log(
      `| ${one.place} | ${one.magnitude.toFixed(1)} | ${(referenceArea / 1e6).toFixed(0)} | ${(singleArea / 1e6).toFixed(0)} | ${(fieldArea / 1e6).toFixed(0)} | ${before.toFixed(2)} | **${after.toFixed(2)}** | ${iouBefore.toFixed(3)} | **${iouAfter.toFixed(3)}** | ${row.areaKm2[7].toFixed(0)} | ${one.strikeSource} |`
    );
  }

  const median = (xs: number[]): number => {
    const s = [...xs].sort((a, b) => a - b);
    const mid = s.length >> 1;
    return s.length % 2 === 1 ? (s[mid] ?? Number.NaN) : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
  };
  const distance = (r: number): number => Math.abs(Math.log(r));
  const beforeMedian = median(beforeRatios);
  const afterMedian = median(afterRatios);

  console.log('');
  console.log(
    `319(a) mediana del rapporto con il riferimento: ${beforeMedian.toFixed(3)} -> ${afterMedian.toFixed(3)}  ->  ${distance(afterMedian) < distance(beforeMedian) ? 'DENTRO' : 'FUORI'}`
  );
  console.log(
    `319(b) IoU mediana ${median(beforeIou).toFixed(3)} -> ${median(afterIou).toFixed(3)}, migliora su ${shapeImproved.toString()}/${beforeIou.length.toString()} (minimo ${ANCHORED_SHAPE_MINIMUM.toString()})  ->  ${median(afterIou) > median(beforeIou) && shapeImproved >= ANCHORED_SHAPE_MINIMUM ? 'DENTRO' : 'FUORI'}`
  );
  console.log(
    `319(c) nessuna riga peggiora oltre ${ANCHORED_WORST_REGRESSION.toFixed(1)}×  ->  ${worsened.length === 0 ? 'DENTRO' : `FUORI (${worsened.join(', ')})`}`
  );
} else {
  console.error('usage: --cases <out.json> | --compare <cases.json> <grids.json>');
  process.exit(2);
}
