import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SLIDE_WAVE_CALIBRATED_ON,
  SLIDE_WAVE_DEPTH_RADIUS_M,
  SLIDE_WAVE_DEPTH_SOURCE,
  SLIDE_WAVE_MARINE,
  SLIDE_WAVE_SOURCE,
  SLIDE_WAVE_SOURCE_SHA256,
} from '../src/physics/validation/slideWaveRules.js';

/**
 * The held-out landslides of rules 118 and 119 of
 * `src/physics/validation/slideWaveRules.ts`.
 *
 * The filter is arithmetic on the catalogue file: no row is chosen or dropped
 * by hand. The water depth, which the catalogue does not give, is the deepest
 * water within 5 km of the event in the GMRT synthesis, read through its
 * public GridServer. Nothing here runs Nimbus.
 *
 *   pnpm exec tsx scripts/build-slide-wave-set.ts <catalogue.tsv> [grid cache]
 *
 * Rule 119 first read the depth from the browser's terrain tiles, and they
 * turned out to carry no bathymetry inside a fjord — Kitimat Arm came back at
 * one metre. The rule says so; this script is the amended one.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EARTH_RADIUS_M = 6_371_000;
const GRID_SERVER = 'https://www.gmrt.org/services/GridServer';

interface Row {
  event: string;
  latitude: number;
  longitude: number;
  country: string;
  waterBody: string;
  cause: string;
  year: number;
  volumeM3: number;
  waveHeightM: number;
  runUpM: number;
  peakHeightM: number;
  widthM: number | null;
  dropHeightM: number | null;
  slidingDistanceM: number | null;
}

/** The catalogue's headers carry a parenthesised gloss; match on the prefix. */
function indexOfPrefix(header: string[], prefix: string): number {
  const i = header.findIndex((name) => name.trim().startsWith(prefix));
  if (i < 0) throw new Error(`the catalogue has no column starting "${prefix}"`);
  return i;
}

function parse(tsv: string): Row[] {
  const body = tsv.includes('*/\n') ? tsv.split('*/\n')[1] : tsv;
  if (body === undefined) throw new Error('the catalogue has no data block');
  const lines = body.split('\n').filter((l) => l.trim().length > 0);
  const headerLine = lines[0];
  if (headerLine === undefined) throw new Error('the catalogue has no header');
  const header = headerLine.split('\t');
  const at = {
    event: indexOfPrefix(header, 'Event'),
    lat: indexOfPrefix(header, 'Latitude ('),
    lon: indexOfPrefix(header, 'Longitude ('),
    country: indexOfPrefix(header, 'Country'),
    body: indexOfPrefix(header, 'Water Body'),
    cause: indexOfPrefix(header, 'Landslide cause'),
    date: indexOfPrefix(header, 'Landslide date'),
    volume: indexOfPrefix(header, 'Landslide vol'),
    wave: indexOfPrefix(header, 'Wave h max'),
    runup: indexOfPrefix(header, 'Run-up h'),
    peak: indexOfPrefix(header, 'Peak height'),
    width: indexOfPrefix(header, 'Landslide w '),
    height: indexOfPrefix(header, 'Landslide h '),
    distance: indexOfPrefix(header, 'Landslide dist'),
    status: indexOfPrefix(header, 'Status'),
  };
  const num = (cells: string[], i: number): number | null => {
    const v = Number((cells[i] ?? '').trim());
    return Number.isFinite(v) ? v : null;
  };
  const out: Row[] = [];
  for (const line of lines.slice(1)) {
    const cells = line.split('\t');
    if (!(cells[at.status] ?? '').trim().toLowerCase().startsWith('okay')) continue;
    const volume = num(cells, at.volume);
    const wave = num(cells, at.wave);
    const runup = num(cells, at.runup);
    const peak = num(cells, at.peak);
    const lat = num(cells, at.lat);
    const lon = num(cells, at.lon);
    if (volume === null || volume <= 0) continue;
    // Rule 122 replaces rule 118's wave clause: the peak height is what
    // selects a row now, and the other two ride along for rule 123.
    if (peak === null || peak <= 0) continue;
    if (lat === null || lon === null) continue;
    const waterBody = (cells[at.body] ?? '').trim();
    if (!SLIDE_WAVE_MARINE.includes(waterBody)) continue;
    const event = (cells[at.event] ?? '').trim();
    if (SLIDE_WAVE_CALIBRATED_ON.some((k) => event.toLowerCase().includes(k))) continue;
    out.push({
      event,
      latitude: lat,
      longitude: lon,
      country: (cells[at.country] ?? '').trim(),
      waterBody,
      cause: (cells[at.cause] ?? '').trim(),
      year: Number((cells[at.date] ?? '').trim().slice(0, 4)) || 0,
      volumeM3: volume,
      waveHeightM: wave ?? 0,
      runUpM: runup ?? 0,
      peakHeightM: peak,
      widthM: num(cells, at.width),
      dropHeightM: num(cells, at.height),
      slidingDistanceM: num(cells, at.distance),
    });
  }
  return out;
}

/** One GMRT grid around a point, cached on disk by its query. */
async function gmrtGrid(cacheDir: string, lat: number, lon: number): Promise<number[]> {
  const degLat = (SLIDE_WAVE_DEPTH_RADIUS_M / EARTH_RADIUS_M) * (180 / Math.PI);
  const degLon = degLat / Math.max(Math.cos((lat * Math.PI) / 180), 1e-6);
  const url =
    `${GRID_SERVER}?minlongitude=${(lon - degLon).toFixed(6)}` +
    `&maxlongitude=${(lon + degLon).toFixed(6)}` +
    `&minlatitude=${(lat - degLat).toFixed(6)}` +
    `&maxlatitude=${(lat + degLat).toFixed(6)}` +
    `&format=esriascii&resolution=high&layer=topo`;
  const file = join(cacheDir, `${createHash('sha256').update(url).digest('hex')}.asc`);
  let text: string;
  if (existsSync(file)) {
    text = readFileSync(file, 'utf8');
  } else {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GMRT ${url}: ${res.status.toString()}`);
    text = await res.text();
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(file, text);
    await new Promise((r) => setTimeout(r, 500));
  }
  const values: number[] = [];
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (t.length === 0) continue;
    if (/^[A-Za-z]/.test(t)) continue; // the six header lines
    for (const piece of t.split(/\s+/)) {
      const v = Number(piece);
      if (Number.isFinite(v) && v > -1e9) values.push(v);
    }
  }
  return values;
}

async function main(): Promise<void> {
  const cataloguePath = process.argv[2];
  if (cataloguePath === undefined) {
    console.error('usage: build-slide-wave-set.ts <catalogue.tsv> [grid cache]');
    process.exit(2);
  }
  const bytes = readFileSync(cataloguePath);
  const sha = createHash('sha256').update(bytes).digest('hex');
  if (sha !== SLIDE_WAVE_SOURCE_SHA256) {
    throw new Error(`the catalogue is not the file rule 118 names: ${sha}`);
  }
  const rows = parse(bytes.toString('utf8'));
  process.stderr.write(`${rows.length.toString()} rows pass rule 118's filter\n`);

  const cacheDir = process.argv[3] ?? join(ROOT, '.cache', 'gmrt-slide-wave');
  const kept: (Row & { depthM: number })[] = [];
  let noWater = 0;
  for (const r of rows) {
    const values = await gmrtGrid(cacheDir, r.latitude, r.longitude);
    const wet = values.filter((v) => v < 0);
    if (wet.length === 0) {
      noWater++;
      process.stderr.write(`  ${r.event}: no water within 5 km — dropped\n`);
      continue;
    }
    const depthM = -Math.min(...wet);
    kept.push({ ...r, depthM });
    process.stderr.write(
      `  ${r.event.padEnd(38)} depth ${depthM.toFixed(0).padStart(6)} m  (${wet.length.toString()}/${values.length.toString()} wet)\n`
    );
  }

  const readOn = new Date().toISOString().slice(0, 10);
  const line = (r: (typeof kept)[number]): string =>
    `  [${JSON.stringify(r.event)}, ${r.year.toString()}, ${r.latitude.toString()}, ${r.longitude.toString()}, ${JSON.stringify(r.waterBody)}, ${JSON.stringify(r.cause)}, ${r.volumeM3.toString()}, ${r.waveHeightM.toString()}, ${r.runUpM.toString()}, ${r.peakHeightM.toString()}, ${r.depthM.toFixed(1)}, ${(r.widthM ?? 0).toString()}, ${(r.dropHeightM ?? 0).toString()}, ${(r.slidingDistanceM ?? 0).toString()}, ${JSON.stringify(r.country)}],`;

  const body = `// Generated by scripts/build-slide-wave-set.ts on ${readOn}. Do not edit by
// hand: rules 118 and 119 of slideWaveRules.ts say what these are and how they
// were read.
//
// ${SLIDE_WAVE_SOURCE}
// Depths: ${SLIDE_WAVE_DEPTH_SOURCE}
// The deepest water within ${(SLIDE_WAVE_DEPTH_RADIUS_M / 1000).toString()} km of each event.

export const SLIDE_WAVE_READ_ON = '${readOn}';

/** Rows the catalogue holds that passed rule 118's filter. */
export const SLIDE_WAVE_FILTERED = ${rows.length.toString()};
/** Of those, dropped because no water was found within the radius. */
export const SLIDE_WAVE_NO_WATER = ${noWater.toString()};

export interface SlideWaveEvent {
  event: string;
  year: number;
  latitude: number;
  longitude: number;
  /** OM open marine, EM enclosed marine. */
  waterBody: string;
  /** EQ earthquake, V volcanic, PA paraglacial, PR precipitation, A
   *  anthropogenic, U unknown — the cause of the slide, not of the wave. */
  cause: string;
  volumeM3: number;
  /** The catalogue's maximum tsunami wave HEIGHT (m), not an amplitude. Zero
   *  where it gives none; often a height at a distant gauge (rule 120). */
  waveHeightM: number;
  /** The catalogue's maximum run-up height (m), zero where it gives none. */
  runUpM: number;
  /** The catalogue's own maximum of the two — what rule 122 selects on and
   *  rule 125 decides on. */
  peakHeightM: number;
  /** Rule 119's depth (m). */
  depthM: number;
  /** Zero where the catalogue gives none. */
  widthM: number;
  dropHeightM: number;
  slidingDistanceM: number;
  country: string;
}

type Line = readonly [
  string, number, number, number, string, string,
  number, number, number, number, number, number, number, number, string,
];

// prettier-ignore
const LINES: readonly Line[] = [
${kept.map(line).join('\n')}
];

export const SLIDE_WAVE_EVENTS: readonly SlideWaveEvent[] = LINES.map((l) => ({
  event: l[0],
  year: l[1],
  latitude: l[2],
  longitude: l[3],
  waterBody: l[4],
  cause: l[5],
  volumeM3: l[6],
  waveHeightM: l[7],
  runUpM: l[8],
  peakHeightM: l[9],
  depthM: l[10],
  widthM: l[11],
  dropHeightM: l[12],
  slidingDistanceM: l[13],
  country: l[14],
}));
`;
  const out = join(ROOT, 'src', 'physics', 'validation', 'slideWaveSetData.ts');
  writeFileSync(out, body);
  console.error(
    `kept ${kept.length.toString()} of ${rows.length.toString()} (${noWater.toString()} found no water) → ${out}`
  );
}

await main();
