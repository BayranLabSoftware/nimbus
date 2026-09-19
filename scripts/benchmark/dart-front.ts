import { writeFileSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchGlobalBathymetricMosaic } from '../../src/scene/terrainSampling.js';
import { makeTerrariumCache, terrariumTile } from '../../src/physics/validation/terrariumTiles.js';
import { computeTsunamiArrivalField } from '../../src/physics/tsunami/fastMarching.js';
import { findPropagationSeeds, ruptureOrigins } from '../../src/physics/tsunami/sourcePlacement.js';

/**
 * Rule 211's other half: when Nimbus says the wave arrives, at the same buoys.
 *
 *   pnpm exec tsx scripts/benchmark/dart-front.ts <terrarium cache> [zoom]
 *
 * This asks the product's own question and not a copy of it: the eikonal
 * arrival field of `tsunami/fastMarching.ts`, marched over the planetary mosaic
 * the globe propagates over, from the seeds the store seeds it with — points
 * every fifty kilometres along the rupture (`ruptureOrigins`), each moved to
 * usable water by `findPropagationSeeds` — and sampled at each buoy's position.
 * Seeding the epicentre instead would answer a different question badly: three
 * of these nine epicentres fall on land on a 40 km raster, and a land cell
 * radiates into whatever water touches it, which on the Alaska Peninsula is the
 * Bering Sea. Seeded that way the 2021 Chignik front reads 2 h 36 min to a buoy
 * 302 km away instead of 25. It is the time the *front* reaches the buoy — the long-wave speed
 * √(g·h) integrated along the fastest path — which is not the time of the
 * crest, and the crest is what a DART record's `crestAfterS` holds. So this
 * column is compared with GeoClaw's front and not with the record.
 *
 * Writes benchmark/dart/fronts.json.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const cacheDir = process.argv[2];
const zoom = process.argv[3] === undefined ? undefined : Number(process.argv[3]);
if (cacheDir === undefined) {
  console.error('usage: dart-front.ts <terrarium cache> [zoom]');
  process.exit(2);
}

interface Rec {
  station: string;
  lat: number;
  lon: number;
  distanceKm: number;
  keptBy: Record<string, boolean>;
}
interface Ev {
  id: string;
  lat: number;
  lon: number;
  strikeDeg: number;
  keptBy: Record<string, boolean>;
  records: Rec[];
}
const set = JSON.parse(readFileSync(join(ROOT, 'benchmark', 'dart', 'records.json'), 'utf8')) as {
  events: Ev[];
};
/** The ruptures model C0 built, which is what the store would be seeding. */
const ruptures = new Map(
  (
    JSON.parse(readFileSync(join(ROOT, 'benchmark', 'dart', 'c0.json'), 'utf8')) as {
      events: { id: string; rupture: { lengthM: number; strikeDeg: number } }[];
    }
  ).events.map((e) => [e.id, e.rupture])
);

const cache = makeTerrariumCache(cacheDir);
const grid = await fetchGlobalBathymetricMosaic(
  async (z, x, y) => (await terrariumTile(cache, z, x, y)).samples as Float32Array,
  zoom
);
console.log(
  `mosaic ${grid.nLat.toString()} x ${grid.nLon.toString()}; tiles ${cache.hits.toString()} cached, ${cache.fetched.toString()} fetched`
);

/** Nearest node of the mosaic, on the product's own convention. */
function sampleAt(field: Float32Array, lat: number, lon: number): number {
  const i = Math.round(((grid.maxLat - lat) / (grid.maxLat - grid.minLat)) * (grid.nLat - 1));
  const j = Math.round(((lon - grid.minLon) / (grid.maxLon - grid.minLon)) * (grid.nLon - 1));
  const ii = Math.min(Math.max(i, 0), grid.nLat - 1);
  const jj = ((j % grid.nLon) + grid.nLon) % grid.nLon;
  return field[ii * grid.nLon + jj] ?? Number.POSITIVE_INFINITY;
}

const out = [];
for (const ev of set.events) {
  if (ev.keptBy['bracketed-2cm'] !== true) continue;
  const t0 = Date.now();
  const rupture = ruptures.get(ev.id);
  if (rupture === undefined) throw new Error(`no rupture for ${ev.id}`);
  const origins = ruptureOrigins(
    { latitude: ev.lat, longitude: ev.lon },
    { strikeDeg: rupture.strikeDeg, ruptureLengthM: rupture.lengthM }
  );
  const seen = new Set<string>();
  const seeds = [];
  for (const o of origins) {
    for (const seed of findPropagationSeeds(grid, o.latitude, o.longitude, {
      maxRadiusM: Math.max(50_000, rupture.lengthM),
    })) {
      const key = `${seed.latitude.toFixed(3)},${seed.longitude.toFixed(3)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      seeds.push({ latitude: seed.latitude, longitude: seed.longitude });
    }
  }
  const field = computeTsunamiArrivalField({
    grid,
    sourceLatitude: seeds[0]?.latitude ?? ev.lat,
    sourceLongitude: seeds[0]?.longitude ?? ev.lon,
    sources: seeds,
  });
  const records = ev.records
    .filter((r) => r.keptBy['bracketed-2cm'] === true)
    .map((r) => {
      const frontS = sampleAt(field.arrivalTimes, r.lat, r.lon);
      return {
        station: r.station,
        frontAfterS: Number.isFinite(frontS) ? frontS : null,
        /** The straight-line answer, for a reader who wants to see what the
         *  bathymetry did to the path: the great-circle range over the
         *  long-wave speed of a 4 km ocean. */
        flatOceanS: (r.distanceKm * 1_000) / Math.sqrt(9.81 * 4_000),
      };
    });
  const reached = records.filter((r) => r.frontAfterS !== null).length;
  console.log(
    `${ev.id}: ${seeds.length.toString()} seeds from ${origins.length.toString()} points along the rupture, ${reached.toString()}/${records.length.toString()} buoys reached, ${((Date.now() - t0) / 1000).toFixed(1)} s`
  );
  out.push({ id: ev.id, seeds: seeds.length, records });
}

writeFileSync(
  join(ROOT, 'benchmark', 'dart', 'fronts.json'),
  `${JSON.stringify({ model: 'Nimbus eikonal front', zoom: zoom ?? 2, events: out }, null, 1)}\n`
);
console.log(`wrote benchmark/dart/fronts.json`);
