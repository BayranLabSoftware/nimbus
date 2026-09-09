import { readFileSync, existsSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { _internals } from '../../scene/populationLookup.js';

/**
 * The shipped population rasters, read from disk instead of fetched.
 *
 * The browser gets these through `fetch` and an `OffscreenCanvas`;
 * a test has neither, and must not have a network either. This module
 * reads the very same files out of `public/data/`, decodes their PNGs
 * with nothing but zlib, and hands them to the very same summation
 * geometry the browser uses — `sumGridCircle`, `sumGridRing` and
 * `landDensityAt` come from `src/scene/populationLookup.ts` and are
 * not reimplemented here. What is reimplemented is only the choosing:
 * which tiles a footprint touches, and when the 0.125° planet answers
 * instead.
 *
 * So a calibration run measures the model against the raster backend,
 * which is what ships as the fallback and as the provisional figure.
 * It does not measure the WorldPop zonal-statistics API, which no
 * offline test can reach; that backend is finer over a city and its
 * absence is stated wherever these numbers are reported.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(HERE, '..', '..', '..', 'public', 'data');

// ---- PNG decoding ----------------------------------------------------

interface DecodedPng {
  width: number;
  height: number;
  /** Red plane — the log-scale population. */
  red: Uint8Array;
  /** Green plane — the land fraction, 0–255. */
  green: Uint8Array;
}

/** Undo one PNG scanline filter in place. `bpp` is bytes per pixel. */
function unfilter(type: number, row: Uint8Array, previous: Uint8Array, bpp: number): void {
  const n = row.length;
  switch (type) {
    case 0:
      return;
    case 1:
      for (let i = bpp; i < n; i++) row[i] = ((row[i] ?? 0) + (row[i - bpp] ?? 0)) & 0xff;
      return;
    case 2:
      for (let i = 0; i < n; i++) row[i] = ((row[i] ?? 0) + (previous[i] ?? 0)) & 0xff;
      return;
    case 3:
      for (let i = 0; i < n; i++) {
        const left = i >= bpp ? (row[i - bpp] ?? 0) : 0;
        row[i] = ((row[i] ?? 0) + ((left + (previous[i] ?? 0)) >> 1)) & 0xff;
      }
      return;
    case 4:
      for (let i = 0; i < n; i++) {
        const a = i >= bpp ? (row[i - bpp] ?? 0) : 0;
        const b = previous[i] ?? 0;
        const c = i >= bpp ? (previous[i - bpp] ?? 0) : 0;
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        row[i] = ((row[i] ?? 0) + pred) & 0xff;
      }
      return;
    default:
      throw new Error(`unknown PNG filter ${type.toString()}`);
  }
}

/** Decode an 8-bit RGB PNG into its red and green planes. */
function decodePng(bytes: Buffer): DecodedPng {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8; // signature
  let width = 0;
  let height = 0;
  let channels = 3;
  const idat: Buffer[] = [];
  while (offset < bytes.length) {
    const length = view.getUint32(offset);
    const type = bytes.toString('latin1', offset + 4, offset + 8);
    const body = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
      const depth = bytes[offset + 16];
      const colour = bytes[offset + 17];
      if (depth !== 8) throw new Error(`unsupported bit depth ${String(depth)}`);
      channels = colour === 2 ? 3 : colour === 0 ? 1 : colour === 6 ? 4 : 0;
      if (channels === 0) throw new Error(`unsupported colour type ${String(colour)}`);
    } else if (type === 'IDAT') {
      idat.push(Buffer.from(body));
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const red = new Uint8Array(width * height);
  const green = new Uint8Array(width * height);
  let previous = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const start = y * (stride + 1);
    const filter = raw[start] ?? 0;
    const row = new Uint8Array(raw.subarray(start + 1, start + 1 + stride));
    unfilter(filter, row, previous, channels);
    for (let x = 0; x < width; x++) {
      red[y * width + x] = row[x * channels] ?? 0;
      green[y * width + x] = channels >= 3 ? (row[x * channels + 1] ?? 0) : 255;
    }
    previous = row;
  }
  return { width, height, red, green };
}

// ---- the two rasters -------------------------------------------------

interface CoarseMeta {
  cellDeg: number;
  nLon: number;
  nLat: number;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  pMax: number;
  source: string;
  channels?: { population: string; landFraction: string };
}

interface FineIndex {
  source: string;
  cellDeg: number;
  tileWidthDeg: number;
  tileHeightDeg: number;
  tileCols: number;
  tileRows: number;
  tileWidthPx: number;
  tileHeightPx: number;
  pMax: number;
  tiles: string[];
}

let coarse: { meta: CoarseMeta; values: Uint8Array; land: Uint8Array } | null = null;
let fineIndex: FineIndex | null = null;
const fineTiles = new Map<string, { values: Uint8Array; land: Uint8Array } | null>();

function loadCoarse(): typeof coarse {
  if (coarse !== null) return coarse;
  const meta = JSON.parse(
    readFileSync(join(DATA_DIR, 'population-0p125.json'), 'utf8')
  ) as CoarseMeta;
  const png = decodePng(readFileSync(join(DATA_DIR, 'population-0p125.png')));
  coarse = { meta, values: png.red, land: png.green };
  return coarse;
}

function loadFineIndex(): FineIndex | null {
  if (fineIndex !== null) return fineIndex;
  const path = join(DATA_DIR, 'population-2p5', 'index.json');
  if (!existsSync(path)) return null;
  fineIndex = JSON.parse(readFileSync(path, 'utf8')) as FineIndex;
  return fineIndex;
}

function loadTile(name: string): { values: Uint8Array; land: Uint8Array } | null {
  const cached = fineTiles.get(name);
  if (cached !== undefined) return cached;
  const path = join(DATA_DIR, 'population-2p5', `${name}.png`);
  if (!existsSync(path)) {
    fineTiles.set(name, null);
    return null;
  }
  const png = decodePng(readFileSync(path));
  const tile = { values: png.red, land: png.green };
  fineTiles.set(name, tile);
  return tile;
}

function tileNameFor(index: FineIndex, latitude: number, longitude: number): string {
  const col = Math.floor(((((longitude + 180) % 360) + 360) % 360) / index.tileWidthDeg);
  const row = Math.min(
    index.tileRows - 1,
    Math.max(0, Math.floor((90 - latitude) / index.tileHeightDeg))
  );
  return `${col.toString()}_${row.toString()}`;
}

/** Every tile a circle of `radiusM` around the point can touch. */
function tilesAround(
  index: FineIndex,
  latitude: number,
  longitude: number,
  radiusM: number
): string[] {
  const dLat = ((radiusM / 6_371_000) * 180) / Math.PI;
  const dLon = dLat / Math.max(Math.cos((latitude * Math.PI) / 180), 1e-6);
  const names = new Set<string>();
  for (const lat of [latitude - dLat, latitude, latitude + dLat]) {
    for (const lon of [longitude - dLon, longitude, longitude + dLon]) {
      names.add(tileNameFor(index, Math.max(-89.9, Math.min(89.9, lat)), lon));
    }
  }
  return [...names].filter((n) => index.tiles.includes(n));
}

const FINE_MAX_RADIUS_M = 1_500_000;

/**
 * People inside a circle, from the shipped rasters: the 2.5′ tiles
 * where they cover the footprint, the 0.125° planet beyond.
 */
export function shippedPopulationInRadius(
  latitude: number,
  longitude: number,
  radiusM: number
): { exposed: number; source: string; fine: boolean } {
  const { coarseView, fineView, sumGridCircle } = _internals;
  const index = loadFineIndex();
  if (index !== null && radiusM <= FINE_MAX_RADIUS_M) {
    const names = tilesAround(index, latitude, longitude, radiusM);
    const tiles = new Map<string, { values: Uint8Array; land: Uint8Array }>();
    let complete = true;
    for (const name of names) {
      const tile = loadTile(name);
      if (tile === null) complete = false;
      else tiles.set(name, tile);
    }
    if (complete && tiles.size > 0) {
      const view = fineView(index, tiles);
      return {
        exposed: sumGridCircle(view, latitude, longitude, radiusM),
        source: index.source,
        fine: true,
      };
    }
  }
  const planet = loadCoarse();
  if (planet === null) throw new Error('no population raster on disk');
  const view = coarseView({ meta: planet.meta, values: planet.values, land: planet.land });
  return {
    exposed: sumGridCircle(view, latitude, longitude, radiusM),
    source: planet.meta.source,
    fine: false,
  };
}

/** Land population density (people per km² of land) around a point. */
export function shippedLandDensity(latitude: number, longitude: number): number {
  const { coarseView, fineView, landDensityAt } = _internals;
  const index = loadFineIndex();
  if (index !== null) {
    const name = tileNameFor(index, latitude, longitude);
    if (index.tiles.includes(name)) {
      const tile = loadTile(name);
      if (tile !== null) {
        return landDensityAt(fineView(index, new Map([[name, tile]])), latitude, longitude);
      }
    }
  }
  const planet = loadCoarse();
  if (planet === null) return 0;
  return landDensityAt(
    coarseView({ meta: planet.meta, values: planet.values, land: planet.land }),
    latitude,
    longitude
  );
}

/** Total people on the planet according to the shipped coarse raster —
 *  a decoder self-check: it must match the sidecar's own total. */
export function shippedPlanetTotal(): { decoded: number; sidecar: number } {
  const planet = loadCoarse();
  if (planet === null) throw new Error('no population raster on disk');
  const { meta, values } = planet;
  let total = 0;
  for (const v of values) {
    if (v > 0) total += Math.exp((v * Math.log(1 + meta.pMax)) / 255) - 1;
  }
  const sidecar = (
    JSON.parse(readFileSync(join(DATA_DIR, 'population-0p125.json'), 'utf8')) as {
      totalPopulation: number;
    }
  ).totalPopulation;
  return { decoded: total, sidecar };
}
