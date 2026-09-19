/**
 * Rules 329 to 334 of `src/physics/validation/footprintE1Rules.ts`: E1 read on
 * the set nobody here had seen, against the reference E1 names.
 *
 * Three steps, because the middle one is three hundred runs of a program:
 *
 *   pnpm exec tsx scripts/benchmark/e1-footprint.ts --cases <cases.json>
 *   <venv>/bin/python scripts/benchmark/strike-shakemap-scenario.py \
 *       --cases <part.json> --work <dir> --config <install/config> --out <grids.json>
 *   pnpm exec tsx scripts/benchmark/e1-footprint.ts --score <cases.json> <grids…>
 *
 * The scenarios are split into parts by `--cases`, so that several can run at
 * once: ShakeMap uses about one core, and the machine has more than one.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import {
  E1_BAND_FLOOR_KM2,
  E1_SET_SIZE,
  E1_WRITTEN_BAR,
  anchoredBarHolds,
  peirceSkill,
  type BandOutcome,
} from '../../src/physics/validation/footprintE1Rules.js';
import { E1_EARTHQUAKES } from '../../src/physics/validation/footprintE1SetData.js';
import { shippedSiteLookup } from '../../src/physics/validation/shippedVs30.js';
import { shippedStrikeAnswer } from '../../src/physics/validation/shippedFaults.js';
import {
  areaAbove,
  evaluateShakingField,
  type RuptureFootprint,
} from '../../src/physics/events/earthquake/shakingField.js';
import {
  intensityLawOf,
  simulateEarthquake,
  type EarthquakeScenarioInput,
} from '../../src/physics/events/earthquake/simulate.js';

const EARTH_RADIUS_M = 6_371_000;
const HARNESS_DIP_DEG = 30;
const DEG = Math.PI / 180;
/** Rule 331: the two bands rule 28 scores. */
const BANDS = [7, 8] as const;

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
}

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

function inputFor(row: (typeof E1_EARTHQUAKES)[number]): EarthquakeScenarioInput {
  return {
    magnitude: row.magnitude,
    depth: (row.depthKm * 1000) as NonNullable<EarthquakeScenarioInput['depth']>,
    faultType: row.faultType,
  };
}

/** Rule 331: our MMI area on a field, in km², with the ground given. */
function ourAreas(
  row: (typeof E1_EARTHQUAKES)[number],
  strikeDeg: number,
  site: ((latitude: number, longitude: number) => { vs30: number }) | null,
  uniformVs30: number
): Record<number, number> {
  const result = simulateEarthquake(inputFor(row));
  const law = intensityLawOf(result);
  if (law === null) return { 7: 0, 8: 0 };
  const rupture: RuptureFootprint = {
    latitude: row.latitude,
    longitude: row.longitude,
    strikeDeg,
    halfLengthM: result.isExtendedSource ? result.ruptureLength / 2 : 0,
    halfWidthM: result.isExtendedSource ? result.ruptureWidth / 2 : 0,
  };
  const halfSpanM = rupture.halfLengthM + Math.max(30_000, 2.5 * result.shaking.mmi7Radius);
  const field = evaluateShakingField({
    rupture,
    intensityAt: law,
    siteAt: (latitude, longitude) =>
      site === null
        ? { vs30: uniformVs30, provenance: 'rock' as const }
        : { vs30: site(latitude, longitude).vs30, provenance: 'grid' as const },
    halfSpanM,
  });
  const out: Record<number, number> = {};
  for (const band of BANDS) out[band] = areaAbove(field, band) / 1e6;
  return out;
}

/** The reference's MMI areas, in km², from one scenario grid. */
function referenceAreas(grid: Grid): Record<number, number> {
  const bytes = Buffer.from(grid.mmi10, 'base64');
  const out: Record<number, number> = { 7: 0, 8: 0 };
  for (let row = 0; row < grid.ny; row += 1) {
    const latitude = grid.ymax - row * grid.dy;
    const cell =
      grid.dy * DEG * EARTH_RADIUS_M * grid.dx * DEG * EARTH_RADIUS_M * Math.cos(latitude * DEG);
    for (let col = 0; col < grid.nx; col += 1) {
      const value = (bytes[row * grid.nx + col] ?? 0) / 10;
      for (const band of BANDS) if (value >= band) out[band] = (out[band] ?? 0) + cell / 1e6;
    }
  }
  return out;
}

/** Rule 331(a): the equivalent radius of an area (km). */
const equivalentRadiusKm = (areaKm2: number): number => Math.sqrt(areaKm2 / Math.PI);

const mode = process.argv[2];

if (mode === '--cases') {
  const out = process.argv[3];
  const parts = Number.parseInt(process.argv[4] ?? '1', 10);
  if (out === undefined) throw new Error('usage: --cases <out.json> [parts]');
  const cases: Case[] = [];
  for (const row of E1_EARTHQUAKES) {
    const result = simulateEarthquake(inputFor(row));
    const answer = shippedStrikeAnswer(
      row.latitude,
      row.longitude,
      row.depthKm * 1000,
      result.ruptureLength
    );
    cases.push({
      id: row.comcat.toLowerCase(),
      comcat: row.comcat,
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
      lengthKm: result.ruptureLength / 1000,
      widthKm: result.ruptureWidth / 1000 / Math.cos(HARNESS_DIP_DEG * DEG),
    });
  }
  writeFileSync(out, `${JSON.stringify(cases, null, 1)}\n`);
  console.log(`scritti ${cases.length.toString()} casi in ${out}`);
  if (parts > 1) {
    const size = Math.ceil(cases.length / parts);
    for (let i = 0; i < parts; i += 1) {
      const slice = cases.slice(i * size, (i + 1) * size);
      const name = out.replace(/\.json$/, `-${(i + 1).toString()}.json`);
      writeFileSync(name, `${JSON.stringify(slice, null, 1)}\n`);
      console.log(`  parte ${(i + 1).toString()}: ${slice.length.toString()} casi in ${name}`);
    }
  }
  const sources = new Map<string, number>();
  for (const c of cases) sources.set(c.strikeSource, (sources.get(c.strikeSource) ?? 0) + 1);
  console.log(`strike: ${[...sources].map(([k, v]) => `${k} ${v.toString()}`).join(', ')}`);
} else if (mode === '--score') {
  const casesPath = process.argv[3];
  const gridPaths = process.argv.slice(4);
  if (casesPath === undefined || gridPaths.length === 0) {
    throw new Error('usage: --score <cases.json> <grids…>');
  }
  const cases = JSON.parse(readFileSync(casesPath, 'utf8')) as Case[];
  const byId = new Map<string, Grid>();
  for (const path of gridPaths) {
    for (const grid of (JSON.parse(readFileSync(path, 'utf8')) as { rows: Grid[] }).rows) {
      byId.set(grid.id, grid);
    }
  }
  const site = shippedSiteLookup();
  if (site === null) throw new Error('no Vs30 tiles: run scripts/build-vs30.py first');

  const blank = (): BandOutcome => ({ hits: 0, misses: 0, falseAlarms: 0, silences: 0 });
  const outcomes = {
    reference: { 7: blank(), 8: blank() } as Record<number, BandOutcome>,
    single: { 7: blank(), 8: blank() } as Record<number, BandOutcome>,
    field: { 7: blank(), 8: blank() } as Record<number, BandOutcome>,
  };
  const sharpness = { reference: [] as number[], single: [] as number[], field: [] as number[] };
  const ratios = { reference: [] as number[], single: [] as number[], field: [] as number[] };
  let scored = 0;
  let noGrid = 0;

  for (const row of E1_EARTHQUAKES) {
    const one = cases.find((c) => c.comcat === row.comcat);
    const grid = byId.get(row.comcat.toLowerCase());
    if (one === undefined || grid?.ok !== true) {
      noGrid += 1;
      continue;
    }
    scored += 1;
    const published = row.areaKm2;
    const reference = referenceAreas(grid);
    const single = ourAreas(row, one.strikeDeg, null, 760);
    const field = ourAreas(row, one.strikeDeg, site, 760);

    for (const band of BANDS) {
      const mapReaches = published[band] >= E1_BAND_FLOOR_KM2;
      const sides = { reference, single, field };
      for (const [name, areas] of Object.entries(sides) as [
        keyof typeof sides,
        typeof reference,
      ][]) {
        const ours = (areas[band] ?? 0) >= E1_BAND_FLOOR_KM2;
        const outcome = outcomes[name][band];
        if (outcome === undefined) continue;
        if (mapReaches && ours) outcome.hits += 1;
        else if (mapReaches) outcome.misses += 1;
        else if (ours) outcome.falseAlarms += 1;
        else outcome.silences += 1;
      }
    }
    // Sharpness and bias, where the map and that side both reach MMI VII.
    if (published[7] >= E1_BAND_FLOOR_KM2) {
      const publishedR = equivalentRadiusKm(published[7]);
      for (const [name, areas] of Object.entries({ reference, single, field }) as [
        keyof typeof sharpness,
        Record<number, number>,
      ][]) {
        const area = areas[7] ?? 0;
        if (area < E1_BAND_FLOOR_KM2) continue;
        sharpness[name].push(Math.abs(Math.log(equivalentRadiusKm(area) / publishedR)));
        ratios[name].push(area / published[7]);
      }
    }
  }

  const median = (xs: number[]): number => {
    const s = [...xs].sort((a, b) => a - b);
    const mid = s.length >> 1;
    return s.length === 0
      ? Number.NaN
      : s.length % 2 === 1
        ? (s[mid] ?? Number.NaN)
        : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
  };
  const stats = (xs: number[]): { bias: number; sigma: number } => {
    const ln = xs.filter((x) => x > 0).map(Math.log);
    const mean = ln.reduce((a, b) => a + b, 0) / ln.length;
    const variance =
      ln.length > 1 ? ln.reduce((a, b) => a + (b - mean) ** 2, 0) / (ln.length - 1) : 0;
    return { bias: Math.exp(mean), sigma: Math.sqrt(variance) };
  };
  const scoreOf = (side: Record<number, BandOutcome>): number => {
    const skills: number[] = [];
    for (const band of BANDS) {
      const outcome = side[band];
      if (outcome === undefined) continue;
      // Rule 28: a band counts when the maps reach it at least five times.
      if (outcome.hits + outcome.misses < 5) continue;
      const skill = peirceSkill(outcome);
      if (skill !== null) skills.push(skill);
    }
    return skills.length === 0 ? Number.NaN : skills.reduce((a, b) => a + b, 0) / skills.length;
  };

  console.log(`righe scorate: ${scored.toString()} (senza scenario: ${noGrid.toString()})`);
  console.log('');
  console.log('| lato | VII H/M/F/S | VIII H/M/F/S | punteggio | nitidezza | bias area | σ |');
  console.log('| --- | --- | --- | --: | --: | --: | --: |');
  for (const name of ['reference', 'single', 'field'] as const) {
    const o = outcomes[name];
    const label =
      name === 'reference'
        ? 'ShakeMap cieco'
        : name === 'single'
          ? 'noi, un Vs30'
          : 'noi, col campo';
    const cell = (b: number): string => {
      const x = o[b];
      return x === undefined
        ? '—'
        : `${x.hits.toString()}/${x.misses.toString()}/${x.falseAlarms.toString()}/${x.silences.toString()}`;
    };
    const s = stats(ratios[name]);
    console.log(
      `| ${label} | ${cell(7)} | ${cell(8)} | ${scoreOf(o).toFixed(3)} | ${median(sharpness[name]).toFixed(3)} | ${s.bias.toFixed(3)}× | ${s.sigma.toFixed(3)} |`
    );
  }

  const reference = { score: scoreOf(outcomes.reference), sharpness: median(sharpness.reference) };
  const field = { score: scoreOf(outcomes.field), sharpness: median(sharpness.field) };
  const single = { score: scoreOf(outcomes.single), sharpness: median(sharpness.single) };
  console.log('');
  console.log(
    `332(a) sbarra ancorata, col campo: punteggio ${field.score.toFixed(3)} contro ${reference.score.toFixed(3)}, nitidezza ${field.sharpness.toFixed(3)} contro ${reference.sharpness.toFixed(3)}  ->  ${anchoredBarHolds(field, reference) ? 'DENTRO' : 'FUORI'}`
  );
  console.log(
    `332(a) idem, con un Vs30:          punteggio ${single.score.toFixed(3)}, nitidezza ${single.sharpness.toFixed(3)}  ->  ${anchoredBarHolds(single, reference) ? 'DENTRO' : 'FUORI'}`
  );
  console.log(
    `332(b) sbarra scritta (${E1_WRITTEN_BAR.score.toString()} / ${E1_WRITTEN_BAR.sharpness.toString()}): col campo ${field.score >= E1_WRITTEN_BAR.score && field.sharpness <= E1_WRITTEN_BAR.sharpness ? 'DENTRO' : 'FUORI'}; il riferimento ${reference.score >= E1_WRITTEN_BAR.score && reference.sharpness <= E1_WRITTEN_BAR.sharpness ? 'DENTRO' : 'FUORI'}`
  );
  console.log(
    `329: insieme di ${E1_EARTHQUAKES.length.toString()} righe contro le ${E1_SET_SIZE.toString()} chieste`
  );
} else {
  console.error('usage: --cases <out.json> [parts] | --score <cases.json> <grids…>');
  process.exit(2);
}
