import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeElevationGrid, type ElevationGrid } from '../elevation/index.js';
import {
  terrariumElevation,
  tileBounds,
  TERRAIN_TILE_ZOOM,
  type TerrainTileLoader,
} from '../../scene/terrainSampling.js';
import { decodePng } from './png.js';

/**
 * The bathymetry the browser reads, read in Node instead.
 *
 * `terrainSampling.ts` says what this is for in its own words: the
 * browser fetches and decodes the terrarium tiles, and "the validation
 * harness hands in a loader that reads them in Node, so the tiles it
 * measures a site on are chosen and resampled by this module and not by a
 * copy of it". `terrainSite.ts` already does that for one point on
 * synthetic terrain. This does it for the real tiles, so a coastal run-up
 * can be measured offline against what the product actually draws.
 *
 * The tiles are AWS Terrain Tiles, terrarium encoding: an ordinary RGB PNG
 * holding a signed elevation, keyless and open
 * (https://registry.opendata.aws/terrain-tiles/). They are cached on disk
 * by zoom, column and row; a cached tile is never fetched again, and a run
 * with a full cache touches no network at all.
 *
 * What is reimplemented here is only the reading: the PNG comes apart with
 * `validation/png.ts`, which the population rasters already use, and each
 * pixel goes through `terrariumElevation` from the browser's own module.
 * The choosing and the resampling stay where they are.
 */

const TILE_PIXELS = 256;
const TILE_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';

export interface TerrariumCache {
  /** Where the PNGs live. */
  directory: string;
  /** Tiles read from disk this run. */
  hits: number;
  /** Tiles fetched from AWS this run. */
  fetched: number;
  /** Tiles the service had none of — ocean beyond the mosaic's edge, a
   *  row outside the Mercator square. They read as one flat sea. */
  missing: number;
}

export function makeTerrariumCache(directory: string): TerrariumCache {
  mkdirSync(directory, { recursive: true });
  return { directory, hits: 0, fetched: 0, missing: 0 };
}

const wrap = (x: number, n: number): number => ((x % n) + n) % n;

/** One tile's PNG bytes, from the cache or from AWS. Null where the
 *  service has no such tile. */
async function tileBytes(
  cache: TerrariumCache,
  zoom: number,
  x: number,
  y: number
): Promise<Buffer | null> {
  const n = 2 ** zoom;
  if (y < 0 || y >= n) return null;
  const col = wrap(x, n);
  const file = join(cache.directory, `${zoom.toString()}_${col.toString()}_${y.toString()}.png`);
  if (existsSync(file)) {
    const bytes = readFileSync(file);
    if (bytes.length === 0) {
      cache.missing += 1;
      return null;
    }
    cache.hits += 1;
    return bytes;
  }
  const url = `${TILE_URL}/${zoom.toString()}/${col.toString()}/${y.toString()}.png`;
  const response = await fetch(url, { headers: { 'User-Agent': 'nimbus-validation' } });
  if (!response.ok) {
    writeFileSync(file, Buffer.alloc(0));
    cache.missing += 1;
    return null;
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  writeFileSync(file, bytes);
  cache.fetched += 1;
  return bytes;
}

/** A tile of nothing but deep water, for the rows the service has none of. */
function openSea(zoom: number, x: number, y: number, depthM: number): ElevationGrid {
  return makeElevationGrid({
    ...tileBounds(x, y, zoom),
    nLat: TILE_PIXELS,
    nLon: TILE_PIXELS,
    samples: new Float32Array(TILE_PIXELS * TILE_PIXELS).fill(depthM),
  });
}

/** The elevations of one terrarium tile, decoded as the browser decodes
 *  them: `terrariumElevation` of each pixel, in metres. */
export async function terrariumTile(
  cache: TerrariumCache,
  zoom: number,
  x: number,
  y: number
): Promise<ElevationGrid> {
  const bytes = await tileBytes(cache, zoom, x, y);
  if (bytes === null) return openSea(zoom, x, y, -4_000);
  const png = decodePng(bytes);
  if (png.width !== TILE_PIXELS || png.height !== TILE_PIXELS) {
    throw new Error(
      `terrarium tile ${zoom.toString()}/${x.toString()}/${y.toString()} is ${png.width.toString()}x${png.height.toString()}, not ${TILE_PIXELS.toString()} square`
    );
  }
  const samples = new Float32Array(TILE_PIXELS * TILE_PIXELS);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = terrariumElevation(png.red[i] ?? 0, png.green[i] ?? 0, png.blue[i] ?? 0);
  }
  return makeElevationGrid({
    ...tileBounds(x, y, zoom),
    nLat: TILE_PIXELS,
    nLon: TILE_PIXELS,
    samples,
  });
}

/** The loader `fetchTerrainGridForLocation` asks for, reading the real
 *  tiles at the zoom the browser uses. */
export function terrariumLoader(cache: TerrariumCache): TerrainTileLoader {
  return (x, y) => terrariumTile(cache, TERRAIN_TILE_ZOOM, x, y);
}
