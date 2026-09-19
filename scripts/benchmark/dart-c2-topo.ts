import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fetchGlobalBathymetricMosaic } from '../../src/scene/terrainSampling.js';
import { makeTerrariumCache, terrariumTile } from '../../src/physics/validation/terrariumTiles.js';

/**
 * Rule 209's seafloor: the mosaic the product builds, at the zoom a reference
 * tool can be run on honestly, dumped for GeoClaw to read.
 *
 *   pnpm exec tsx scripts/benchmark/dart-c2-topo.ts <cache dir> <out dir> [zoom]
 *
 * The raster is built by `terrainSampling.ts` itself — the same stitch, the
 * same terrarium decoding, the same Mercator-to-latitude reprojection the globe
 * propagates over — with the zoom as a parameter. Zoom 2 is the globe's own
 * 40 km; zoom 4 is about 10 km, finer than the 10-arcmin ETOPO GeoClaw's own
 * example ships with. What comes out is a raw little-endian Float32 raster,
 * row-major from the north, beside a JSON header; `dart-c2.py` cuts the windows
 * and writes them in GeoClaw's own topotype 3 with GeoClaw's own writer, so no
 * header convention is transcribed here.
 */

const cacheDir = process.argv[2];
const outDir = process.argv[3];
const zoom = Number(process.argv[4] ?? 4);
if (cacheDir === undefined || outDir === undefined) {
  console.error('usage: dart-c2-topo.ts <cache dir> <out dir> [zoom]');
  process.exit(2);
}

const cache = makeTerrariumCache(cacheDir);
mkdirSync(outDir, { recursive: true });
const t0 = Date.now();
const grid = await fetchGlobalBathymetricMosaic(
  async (z, x, y) => (await terrariumTile(cache, z, x, y)).samples as Float32Array,
  zoom
);
console.log(
  `zoom ${zoom.toString()}: ${grid.nLat.toString()} x ${grid.nLon.toString()} in ${((Date.now() - t0) / 1000).toFixed(1)} s; tiles ${cache.hits.toString()} cached, ${cache.fetched.toString()} fetched, ${cache.missing.toString()} absent`
);

const stem = join(outDir, `mosaic-z${zoom.toString()}`);
writeFileSync(`${stem}.f32`, Buffer.from(grid.samples.buffer, 0, grid.samples.byteLength));
writeFileSync(
  `${stem}.json`,
  `${JSON.stringify(
    {
      zoom,
      nLat: grid.nLat,
      nLon: grid.nLon,
      minLat: grid.minLat,
      maxLat: grid.maxLat,
      minLon: grid.minLon,
      maxLon: grid.maxLon,
      source: 'AWS Terrain Tiles (terrarium), via src/scene/terrainSampling.ts',
      dtype: 'float32 little-endian, row-major from the north',
      tiles: { cached: cache.hits, fetched: cache.fetched, absent: cache.missing },
    },
    null,
    1
  )}\n`
);
const deg = 360 / grid.nLon;
console.log(
  `wrote ${stem}.f32 (${(grid.samples.byteLength / 1e6).toFixed(0)} MB), ${deg.toFixed(4)}° a cell, about ${(deg * 111.2).toFixed(1)} km at the equator`
);
