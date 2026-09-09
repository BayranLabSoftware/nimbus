/**
 * On-demand terrain sampler that feeds the ElevationGrid pipeline.
 * Replaces the "ship a decimated ETOPO binary at app boot" strategy
 * with per-click fetch of the public AWS Terrain Tiles dataset
 * (terrarium PNG format, global coverage, CC0 licence, no API key).
 *
 * The tile at zoom 8 covers ≈ 156 km × 156 km near the equator with
 * 256 × 256 pixels — so slope at the event coordinates is computed
 * over a ≈ 0.6 km sample spacing, which is adequate for the
 * Wald & Allen (2007) slope-to-Vs30 proxy (originally calibrated on
 * 30 arc-second ≈ 1 km DEMs).
 *
 * Terrarium encoding: each RGB pixel encodes elevation in metres as
 *     elev = (R · 256 + G + B / 256) − 32 768
 *
 * Reference: https://github.com/tilezen/joerd/blob/master/docs/formats.md
 *
 * This module lives in Layer-4 (UI/scene) and writes into the store
 * via `setElevationGrid`. The physics layer still never touches
 * fetch/PNG APIs; it only sees the parsed {@link ElevationGrid}.
 */

import { makeElevationGrid, type ElevationGrid } from '../physics/elevation/index.js';
import { destination } from '../physics/tsunami/ruptureGeometry.js';

const TERRAIN_TILE_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
const TILE_ZOOM = 8;
const TILE_PIXELS = 256;
const MAX_CACHE = 16;

/** (lat, lon) → tile (x, y) at a given OSM zoom level. */
function lonLatToTile(lat: number, lon: number, z: number): { x: number; y: number } {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x: ((x % n) + n) % n, y: Math.max(0, Math.min(n - 1, y)) };
}

/** Tile (x, y) → geographic bounds at a given zoom. */
function tileBounds(
  x: number,
  y: number,
  z: number
): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
  const n = 2 ** z;
  const lonLeft = (x / n) * 360 - 180;
  const lonRight = ((x + 1) / n) * 360 - 180;
  const latTop = (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
  const latBottom = (Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 1)) / n))) * 180) / Math.PI;
  return {
    minLat: Math.min(latTop, latBottom),
    maxLat: Math.max(latTop, latBottom),
    minLon: lonLeft,
    maxLon: lonRight,
  };
}

interface CachedTile {
  key: string;
  grid: ElevationGrid;
}

const cache: CachedTile[] = [];
/** Tiles being fetched right now, keyed like the cache. Two callers
 *  asking for the same tile in the same second — the globe reacting
 *  to a click and a Launch pressed straight after it — share one
 *  request and one decode instead of racing each other. */
const inflight = new Map<string, Promise<ElevationGrid>>();

function lookupCache(key: string): ElevationGrid | null {
  const hit = cache.find((t) => t.key === key);
  return hit ? hit.grid : null;
}

function pushCache(key: string, grid: ElevationGrid): void {
  cache.unshift({ key, grid });
  if (cache.length > MAX_CACHE) cache.pop();
}

/**
 * Decode a 256 × 256 terrarium PNG into a Float32Array of elevations.
 * Uses the browser ImageBitmap + OffscreenCanvas path — no need to
 * ship a PNG decoder, the engine already has one.
 */
async function decodeTerrariumTile(url: string): Promise<Float32Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`terrain tile fetch failed: ${response.status.toString()} ${url}`);
  }
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = new OffscreenCanvas(TILE_PIXELS, TILE_PIXELS);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('terrain tile: 2D context unavailable');
    ctx.drawImage(bitmap, 0, 0);
    const img = ctx.getImageData(0, 0, TILE_PIXELS, TILE_PIXELS);
    const samples = new Float32Array(TILE_PIXELS * TILE_PIXELS);
    for (let i = 0; i < TILE_PIXELS * TILE_PIXELS; i++) {
      const r = img.data[i * 4] ?? 0;
      const g = img.data[i * 4 + 1] ?? 0;
      const b = img.data[i * 4 + 2] ?? 0;
      samples[i] = r * 256 + g + b / 256 - 32_768;
    }
    return samples;
  } finally {
    bitmap.close();
  }
}

/** Fetch and decode one terrarium tile as a grid of its own. */
async function fetchTile(x: number, y: number): Promise<ElevationGrid> {
  const key = `${TILE_ZOOM.toString()}/${x.toString()}/${y.toString()}`;
  const cached = lookupCache(key);
  if (cached !== null) return cached;
  const pending = inflight.get(key);
  if (pending !== undefined) return pending;

  const url = TERRAIN_TILE_URL.replace('{z}', TILE_ZOOM.toString())
    .replace('{x}', x.toString())
    .replace('{y}', y.toString());

  const request = (async (): Promise<ElevationGrid> => {
    const samples = await decodeTerrariumTile(url);
    const bounds = tileBounds(x, y, TILE_ZOOM);
    // The terrarium PNG is north-to-south row-major, same convention
    // as ElevationGrid — no transpose needed.
    const grid = makeElevationGrid({
      minLat: bounds.minLat,
      maxLat: bounds.maxLat,
      minLon: bounds.minLon,
      maxLon: bounds.maxLon,
      nLat: TILE_PIXELS,
      nLon: TILE_PIXELS,
      samples,
    });
    pushCache(key, grid);
    return grid;
  })();
  inflight.set(key, request);
  try {
    return await request;
  } finally {
    inflight.delete(key);
  }
}

/** Does this grid contain any land at all? */
/**
 * Enough land in a tile to resolve the coast the wave will hit.
 *
 * A single zoom-8 tile is about 156 km across. A pick offshore can
 * land in one whose corner clips a coastline and no more, and one
 * corner of coast is not a coast: the Sumatra 2004 epicentre, which is
 * 150 km out to sea, produced forty-three coastal cells out of the
 * fourteen thousand the run-up field ended up with, and every one of
 * the coasts that drowned in 2004 came off the planetary mosaic
 * instead. Testing for any land at all let that through, because there
 * was some.
 *
 * A quarter is the line. Below it the tile is mostly water and the
 * nine-tile block is worth its eight extra fetches; above it there is
 * a coastline in here to work with.
 */
const MIN_TILE_LAND_FRACTION = 0.25;

function landFraction(grid: ElevationGrid): number {
  let land = 0;
  for (const v of grid.samples) if (v > 0) land++;
  return grid.samples.length > 0 ? land / grid.samples.length : 0;
}

/** Side of the resampled block, in samples. Three zoom-8 tiles span
 *  about 4.2°, so this keeps a little under a kilometre per sample —
 *  forty times finer than the planetary mosaic, which is the whole
 *  reason for going and getting the neighbours. */
const BLOCK_SAMPLES = 512;

/** The total a resampled block may spend, whatever its shape. Held
 *  fixed so the fast-marching pass over this grid costs the same for
 *  a crater and for a fifteen-hundred-kilometre rupture; what changes
 *  is how the budget is split between rows and columns, and with it
 *  the metres per sample. */
const BLOCK_SAMPLE_BUDGET = BLOCK_SAMPLES * BLOCK_SAMPLES;

/** Tiles a block may fetch. Nine is the old square; a long rupture
 *  wants a strip, and forty at ninety to a hundred and twenty
 *  kilobytes apiece is about four megabytes — the same order as the
 *  fine population tiles, and only for the events that need it. */
const MAX_BLOCK_TILES = 40;

/**
 * Nine tiles around (x, y), resampled onto one uniform lat/lon grid.
 *
 * Web-mercator tiles are equal in mercator height and therefore
 * unequal in degrees, so they cannot simply be laid side by side into
 * an `ElevationGrid`, which is uniform by construction. Each output
 * sample is taken from whichever tile covers its coordinates.
 */
async function fetchTileRange(
  x0: number,
  x1: number,
  y0: number,
  y1: number
): Promise<ElevationGrid> {
  const coords: { x: number; y: number }[] = [];
  const span = 1 << TILE_ZOOM;
  for (let ty = y0; ty <= y1; ty++) {
    if (ty < 0 || ty >= span) continue;
    for (let tx = x0; tx <= x1; tx++) {
      coords.push({ x: ((tx % span) + span) % span, y: ty });
    }
  }
  const tiles = await Promise.all(coords.map((c) => fetchTile(c.x, c.y)));
  const minLat = Math.min(...tiles.map((t) => t.minLat));
  const maxLat = Math.max(...tiles.map((t) => t.maxLat));
  const minLon = Math.min(...tiles.map((t) => t.minLon));
  const maxLon = Math.max(...tiles.map((t) => t.maxLon));

  // The sample budget is fixed, and the block's own shape spends it.
  // A square block gets the 512 × 512 it always had; a rupture's long
  // thin block gets more rows than columns for the same total, so the
  // fast-marching pass that runs on this grid costs what it always
  // did however far the fault reaches.
  const latM = (maxLat - minLat) * 111_320;
  const midLat = ((maxLat + minLat) / 2) * (Math.PI / 180);
  const lonM = (maxLon - minLon) * 111_320 * Math.max(Math.cos(midLat), 0.05);
  const ratio = Math.sqrt(Math.max(latM, 1) / Math.max(lonM, 1));
  const nLat = Math.round(Math.min(2048, Math.max(64, Math.sqrt(BLOCK_SAMPLE_BUDGET) * ratio)));
  const nLon = Math.round(Math.min(2048, Math.max(64, BLOCK_SAMPLE_BUDGET / nLat)));

  const samples = new Float32Array(nLat * nLon);
  const dLat = (maxLat - minLat) / Math.max(1, nLat - 1);
  const dLon = (maxLon - minLon) / Math.max(1, nLon - 1);
  for (let i = 0; i < nLat; i++) {
    const lat = maxLat - i * dLat;
    for (let j = 0; j < nLon; j++) {
      const lon = minLon + j * dLon;
      let value = 0;
      for (const tile of tiles) {
        if (lat < tile.minLat || lat > tile.maxLat || lon < tile.minLon || lon > tile.maxLon) {
          continue;
        }
        const tLat = (tile.maxLat - tile.minLat) / (tile.nLat - 1);
        const tLon = (tile.maxLon - tile.minLon) / (tile.nLon - 1);
        const ti = Math.min(tile.nLat - 1, Math.max(0, Math.round((tile.maxLat - lat) / tLat)));
        const tj = Math.min(tile.nLon - 1, Math.max(0, Math.round((lon - tile.minLon) / tLon)));
        value = tile.samples[ti * tile.nLon + tj] ?? 0;
        break;
      }
      samples[i * nLon + j] = value;
    }
  }
  return makeElevationGrid({ minLat, maxLat, minLon, maxLon, nLat, nLon, samples });
}

/**
 * The terrain under a pick, as a grid the simulator can run on.
 *
 * One tile, when one tile will do — which it does whenever the pick
 * is well inside a coastline, and that is most picks. When the tile is
 * mostly water it will not do: a run-up field needs a coast to run up,
 * and a tile centred on an offshore epicentre has none. Tōhoku's
 * local tile was 120 km of open Pacific with the Sanriku coast a
 * degree outside it, so the entire Japanese shoreline was left to the
 * planetary mosaic at forty kilometres a cell while a one-kilometre
 * grid sat empty beside it.
 *
 * So the rule is about what the grid is for rather than about which
 * event asked: if there is no land in it, fetch the ring around it
 * and resample the nine together. For a pick on land nothing changes
 * and nothing extra is fetched.
 *
 * And when the source is a rupture, the block follows the fault
 * rather than the pick. A square around one end of a thirteen-hundred
 * kilometre megathrust resolved seventy-four kilometres of the coast
 * that drowned in 2004 and left the other nine hundred to the
 * planetary mosaic at thirty kilometres a sample. A strip along the
 * fault reaches all of it, for a fetch that grows with the fault and
 * a grid that does not: the sample budget is fixed, so a long thin
 * block spends it on rows instead of columns and the fast-marching
 * pass costs what it always did.
 */
export interface TerrainSourceSpan {
  /** Strike of the rupture (° from north). */
  strikeDeg: number;
  /** Length along strike (m), centred on the pick. */
  lengthM: number;
}

export async function fetchTerrainGridForLocation(
  latitude: number,
  longitude: number,
  span?: TerrainSourceSpan
): Promise<ElevationGrid> {
  const { x, y } = lonLatToTile(latitude, longitude, TILE_ZOOM);
  const range = span === undefined ? null : tileRangeForSpan(latitude, longitude, span);
  if (range !== null) return fetchTileRange(range.x0, range.x1, range.y0, range.y1);
  const centre = await fetchTile(x, y);
  if (landFraction(centre) >= MIN_TILE_LAND_FRACTION) return centre;
  return fetchTileRange(x - 1, x + 1, y - 1, y + 1);
}

/**
 * The tiles a rupture needs: the ones its two ends fall in, everything
 * between, and a ring around the lot so the coast on either side is in
 * the grid too. Null when the rupture is short enough that the square
 * block already covers it, which keeps every small event on the path
 * it had before.
 */
function tileRangeForSpan(
  latitude: number,
  longitude: number,
  span: TerrainSourceSpan
): { x0: number; x1: number; y0: number; y1: number } | null {
  if (!Number.isFinite(span.strikeDeg) || !(span.lengthM > 0)) return null;
  const half = span.lengthM / 2;
  const a = destination(latitude, longitude, span.strikeDeg, half);
  const b = destination(latitude, longitude, span.strikeDeg, -half);
  const ta = lonLatToTile(a.latitude, a.longitude, TILE_ZOOM);
  const tb = lonLatToTile(b.latitude, b.longitude, TILE_ZOOM);
  let x0 = Math.min(ta.x, tb.x) - 1;
  let x1 = Math.max(ta.x, tb.x) + 1;
  let y0 = Math.min(ta.y, tb.y) - 1;
  let y1 = Math.max(ta.y, tb.y) + 1;
  // A rupture that fits inside the ordinary block asks for nothing
  // special.
  if (x1 - x0 <= 2 && y1 - y0 <= 2) return null;
  // Bounded: trim the long axis first, from both ends, so the fault
  // stays centred on the pick.
  while ((x1 - x0 + 1) * (y1 - y0 + 1) > MAX_BLOCK_TILES) {
    if (x1 - x0 >= y1 - y0) {
      x0 += 1;
      x1 -= 1;
    } else {
      y0 += 1;
      y1 -= 1;
    }
    if (x1 <= x0 || y1 <= y0) return null;
  }
  return { x0, x1, y0, y1 };
}

/**
 * Phase 11 — global low-resolution bathymetric mosaic.
 *
 * Fetches the 16 zoom-2 terrarium tiles that cover the whole planet
 * and stitches them into a single 1024 × 1024 ElevationGrid spanning
 * (-85°, +85°) latitude and (-180°, +180°) longitude.
 *
 * Resolution: ~40 km/pixel at the equator — coarse compared to the
 * zoom-8 local tiles (~600 m/pixel) but sufficient for trans-oceanic
 * tsunami propagation (typical wavelengths 100–1000 km in deep
 * water; coastline topology resolved at continental scale).
 *
 * Bandwidth: ~16 × 50 KB = 800 KB total, fetched in parallel and
 * decoded once at app startup. Subsequent simulations reuse the
 * cached grid; per-click banwdith is unchanged.
 *
 * The global grid is the engine that finally lets a Chicxulub-class
 * tsunami draw its 5 m / 1 m / 0.3 m iso-amplitude contours over
 * thousands of kilometres without truncating at the local tile
 * boundary. Without this layer the Phase 7a iso-contours were
 * cosmetically correct but truncated at ~75 km from the source.
 */

const GLOBAL_ZOOM = 2;
const GLOBAL_GRID_DIMENSION = 4 * TILE_PIXELS; // 1024 × 1024
let globalMosaicCache: ElevationGrid | null = null;
let globalMosaicInflight: Promise<ElevationGrid> | null = null;

export function getCachedGlobalBathymetricMosaic(): ElevationGrid | null {
  return globalMosaicCache;
}

/**
 * Phase 16 — reproject a Web-Mercator-aligned raster (rows spaced
 * uniformly in Mercator Y) into an equirectangular raster (rows
 * spaced uniformly in geographic latitude). Pure: no I/O, no Cesium,
 * unit-testable from Node.
 *
 * Why this matters: every Terrarium tile arrives in Web Mercator (the
 * standard XYZ tile scheme), so the row index of a stitched mosaic is
 * linear in Mercator Y, NOT in latitude. Downstream pipeline
 * (`computeTsunamiArrivalField`, `sampleElevation`, the Globe.tsx
 * arrow loop) all assume `samples[i * nLon + j]` is at lat = maxLat −
 * i · (maxLat − minLat) / (nLat − 1) — i.e. linear in latitude. On a
 * 170°-tall global mosaic that mismatch puts the FMM source up to 24°
 * off in latitude (a Chicxulub source at lat 44° gets sampled in
 * Greenland), so the FMM bails on land and produces an empty
 * arrival-time field. Reprojecting once at load time fixes the
 * mismatch for every consumer.
 *
 * Implementation: for each output row in lat-linear space, compute
 * the corresponding Mercator-Y fractional row, bilinear-interpolate
 * along the Mercator column. Longitude is linear in both projections,
 * so columns map 1:1.
 */
export function reprojectMercatorToLinearLat(
  mercatorSamples: Float32Array,
  nLat: number,
  nLon: number,
  minLat: number,
  maxLat: number
): Float32Array {
  const out = new Float32Array(nLat * nLon);
  // Web Mercator: y_norm = (1 − asinh(tan(lat·π/180)) / π) / 2,
  // 0 at the top (latMax), 1 at the bottom (latMin). Inverse:
  //   lat = atan(sinh(π · (1 − 2·y_norm))).
  for (let outI = 0; outI < nLat; outI++) {
    const lat = maxLat - (outI / (nLat - 1)) * (maxLat - minLat);
    // Mercator-Y normalised in [0, 1] (0 = north).
    const tanArg = Math.tan((Math.PI / 4) * (1 + lat / 90));
    const yNorm = (Math.PI - Math.log(tanArg)) / (2 * Math.PI);
    const mercFrac = yNorm * (nLat - 1);
    const m0 = Math.max(0, Math.min(nLat - 1, Math.floor(mercFrac)));
    const m1 = Math.max(0, Math.min(nLat - 1, m0 + 1));
    const t = mercFrac - m0;
    for (let j = 0; j < nLon; j++) {
      const v0 = mercatorSamples[m0 * nLon + j] ?? 0;
      const v1 = mercatorSamples[m1 * nLon + j] ?? 0;
      out[outI * nLon + j] = v0 * (1 - t) + v1 * t;
    }
  }
  return out;
}

export async function fetchGlobalBathymetricMosaic(): Promise<ElevationGrid> {
  if (globalMosaicCache !== null) return globalMosaicCache;
  if (globalMosaicInflight !== null) return globalMosaicInflight;

  globalMosaicInflight = (async (): Promise<ElevationGrid> => {
    const n = 2 ** GLOBAL_ZOOM;
    const mercatorSamples = new Float32Array(GLOBAL_GRID_DIMENSION * GLOBAL_GRID_DIMENSION);

    const tilePromises: Promise<{ x: number; y: number; tile: Float32Array }>[] = [];
    for (let ty = 0; ty < n; ty++) {
      for (let tx = 0; tx < n; tx++) {
        const url = TERRAIN_TILE_URL.replace('{z}', GLOBAL_ZOOM.toString())
          .replace('{x}', tx.toString())
          .replace('{y}', ty.toString());
        tilePromises.push(decodeTerrariumTile(url).then((tile) => ({ x: tx, y: ty, tile })));
      }
    }

    const results = await Promise.all(tilePromises);

    // Splice each tile into its quadrant of the Mercator-aligned
    // mosaic. Rows are uniform in Web Mercator Y at this stage.
    for (const { x: tx, y: ty, tile } of results) {
      for (let py = 0; py < TILE_PIXELS; py++) {
        for (let px = 0; px < TILE_PIXELS; px++) {
          const mosaicRow = ty * TILE_PIXELS + py;
          const mosaicCol = tx * TILE_PIXELS + px;
          mercatorSamples[mosaicRow * GLOBAL_GRID_DIMENSION + mosaicCol] =
            tile[py * TILE_PIXELS + px] ?? 0;
        }
      }
    }

    // Reproject to a lat-linear grid so every downstream consumer
    // (FMM, elevation sampler, Globe arrows) can use the standard
    // `lat → row` linear formula. See `reprojectMercatorToLinearLat`
    // for the bug rationale.
    const MERCATOR_LIMIT_LAT = 85.05112878;
    const samples = reprojectMercatorToLinearLat(
      mercatorSamples,
      GLOBAL_GRID_DIMENSION,
      GLOBAL_GRID_DIMENSION,
      -MERCATOR_LIMIT_LAT,
      MERCATOR_LIMIT_LAT
    );

    const grid = makeElevationGrid({
      minLat: -MERCATOR_LIMIT_LAT,
      maxLat: MERCATOR_LIMIT_LAT,
      minLon: -180,
      maxLon: 180,
      nLat: GLOBAL_GRID_DIMENSION,
      nLon: GLOBAL_GRID_DIMENSION,
      samples,
    });
    globalMosaicCache = grid;
    return grid;
  })();
  // Whatever happens, the next caller must be able to retry: a failed
  // fetch left `globalMosaicInflight` pointing at a rejected promise
  // for the rest of the session, so a Launch after a transient
  // network error could never get the planetary layer back.
  globalMosaicInflight = globalMosaicInflight.finally(() => {
    globalMosaicInflight = null;
  });
  return globalMosaicInflight;
}
