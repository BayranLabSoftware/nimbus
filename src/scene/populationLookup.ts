/**
 * Client-side population lookup: how many people live inside a circle.
 *
 * Three backends, tried in this order:
 *
 *   1. **Operator COG** — when `VITE_POPULATION_COG_URL` points at a
 *      CORS-enabled Cloud-Optimised GeoTIFF (a WorldPop / GHSL mirror),
 *      geotiff.js fetches only the bytes covering the circle's bounding
 *      box with HTTP Range requests and sums the pixels inside the
 *      radius. Best resolution, but it needs infrastructure the
 *      project does not run: `data.worldpop.org` itself sends no
 *      `Access-Control-Allow-Origin` header, so the fallback URL of
 *      earlier revisions failed from every browser and the exposure
 *      row stayed at "—" on the live site.
 *
 *   2. **WorldPop zonal-statistics API** — `api.worldpop.org/v1/services/stats`
 *      computes the population inside a GeoJSON polygon server-side
 *      on the WorldPop 2020 global grid (`wpgppop`, 100 m constrained
 *      to 1 km). It answers with `Access-Control-Allow-Origin: *`, needs
 *      no key, and is free; it takes 15–45 s per polygon and refuses
 *      polygons above 100 000 km² (a circle of ≈ 178 km). Every damage
 *      ring of a city-scale event fits.
 *
 *   3. **Coarse population raster** — for rings the API refuses (the
 *      5 psi ring of a Chicxulub-class impact is 2 300 km), a 0.125°
 *      (≈ 14 km) global grid of 2020 population counts shipped as an
 *      8-bit log-scale PNG under `public/data/` (built by
 *      `scripts/build-population.ts` from the JRC GHS-POP 2020
 *      30 arc-second grid, CC-BY 4.0 — the same kind of per-cell
 *      count as WorldPop, whose 870 MB mosaic is the alternative
 *      input) and summed in the browser. Also the fallback when the
 *      API is unreachable. The sidecar names the source and the UI
 *      prints it.
 *
 * Every result says which backend produced it, so the UI can label a
 * coarse-raster number as such. Circles are summed by cell centre;
 * partial cells at the rim are the ±few-percent noise floor.
 *
 * References:
 *   Tatem, A. J. (2017). "WorldPop, open data for spatial demography."
 *     Scientific Data 4: 170004. DOI: 10.1038/sdata.2017.4.
 *   WorldPop (2018). Global High Resolution Population Denominators
 *     Project — Funded by the Bill and Melinda Gates Foundation
 *     (OPP1134076). School of Geography and Environmental Science,
 *     University of Southampton. DOI: 10.5258/SOTON/WP00647.
 *   Schiavina, M., Freire, S., MacManus, K. (2023). "GHS-POP R2023A."
 *     European Commission JRC. DOI: 10.2905/2FF68A52-5B5B-4A22-8F40-C41DA8332CFE.
 */

import { fromUrl, type GeoTIFF } from 'geotiff';

/** Mean Earth radius for the great-circle bbox conversion. Matches
 *  src/physics/earthScale.ts. */
const EARTH_RADIUS_M = 6_371_000;

/** Hard cap on the geographic radius any backend is asked for. Beyond
 *  a hemisphere the question "people inside the circle" stops meaning
 *  anything a damage threshold could imply. */
const MAX_QUERY_RADIUS_M = 10_000_000;

/** WorldPop's zonal-statistics allowance is 100 000 km²; stay under it
 *  with a margin for the polygon's own discretisation. */
const WORLDPOP_API_MAX_AREA_KM2 = 95_000;
const WORLDPOP_STATS_URL = 'https://api.worldpop.org/v1/services/stats';
const WORLDPOP_TASKS_URL = 'https://api.worldpop.org/v1/tasks/';
const WORLDPOP_DATASET = 'wpgppop';
const WORLDPOP_YEAR = 2020;
/** The synchronous call holds the connection while the server works;
 *  observed 15–45 s. Give it two minutes before switching backend. */
const WORLDPOP_TIMEOUT_MS = 120_000;
const WORLDPOP_POLL_MS = 3_000;
const WORLDPOP_POLL_MAX = 40;
/** Parallel API requests in flight at once — a simulation asks for
 *  three or four rings, the service is shared with other users. */
const WORLDPOP_CONCURRENCY = 4;

const COARSE_RASTER_META = 'data/population-0p125.json';
const COARSE_RASTER_IMAGE = 'data/population-0p125.png';

export type PopulationLookupMethod = 'cog' | 'worldpop-api' | 'coarse-raster';

/** A closed ring of (lat, lon) vertices — the rupture stadium of an
 *  extended earthquake source. When given, it replaces the circle. */
export type PopulationPolygon = readonly { latDeg: number; lonDeg: number }[];

export interface PopulationLookupResult {
  /** Sum of population (people) inside the supplied circle. */
  exposed: number;
  /** Human-readable source for the report tooltip. */
  source: string;
  /** Which backend answered. */
  method: PopulationLookupMethod;
  /** Echo of the radius in metres for which this exposure was
   *  computed. */
  radiusM: number;
  /** Bounding box actually queried (lat/lon degrees). */
  bbox: { minLat: number; maxLat: number; minLon: number; maxLon: number };
}

// ---------------------------------------------------------------------
// Shared geometry
// ---------------------------------------------------------------------

/**
 * Convert a geographic-radius circle into a [west, south, east, north]
 * bbox in degrees. Δlat = r / R_E, Δlon = r / (R_E · cos φ); standard
 * spherical-Earth approximation, accurate to ≤ 0.5 % below the polar
 * circles which is well inside the population-data scatter.
 */
function circleBoundingBox(
  lat: number,
  lon: number,
  radiusM: number
): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
  const dLat = ((radiusM / EARTH_RADIUS_M) * 180) / Math.PI;
  const dLon =
    ((radiusM / (EARTH_RADIUS_M * Math.max(Math.cos((lat * Math.PI) / 180), 1e-6))) * 180) /
    Math.PI;
  return {
    minLat: Math.max(-90, lat - dLat),
    maxLat: Math.min(90, lat + dLat),
    minLon: lon - dLon,
    maxLon: lon + dLon,
  };
}

/** Great-circle distance (m) — haversine. */
function greatCircleM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Area of a spherical cap of radius r (km²). */
function circleAreaKm2(radiusM: number): number {
  const R = EARTH_RADIUS_M;
  return (2 * Math.PI * R * R * (1 - Math.cos(radiusM / R))) / 1e6;
}

/** Ring of (lon, lat) pairs approximating the circle, 48 vertices,
 *  longitudes clamped to the map (a polygon across the antimeridian
 *  would be read as wrapping the other way round the planet). */
function circleRing(lat: number, lon: number, radiusM: number, vertices = 48): [number, number][] {
  const ring: [number, number][] = [];
  const mLat = (EARTH_RADIUS_M * Math.PI) / 180;
  const mLon = mLat * Math.max(Math.cos((lat * Math.PI) / 180), 1e-6);
  for (let k = 0; k <= vertices; k++) {
    const a = (2 * Math.PI * k) / vertices;
    const pLat = Math.max(-89.9, Math.min(89.9, lat + (radiusM * Math.cos(a)) / mLat));
    const pLon = Math.max(-179.99, Math.min(179.99, lon + (radiusM * Math.sin(a)) / mLon));
    ring.push([Number(pLon.toFixed(4)), Number(pLat.toFixed(4))]);
  }
  return ring;
}

function polygonRing(polygon: PopulationPolygon): [number, number][] {
  const ring: [number, number][] = polygon.map((v) => [
    Number(Math.max(-179.99, Math.min(179.99, v.lonDeg)).toFixed(4)),
    Number(Math.max(-89.9, Math.min(89.9, v.latDeg)).toFixed(4)),
  ]);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first !== undefined && last !== undefined && (first[0] !== last[0] || first[1] !== last[1])) {
    ring.push([first[0], first[1]]);
  }
  return ring;
}

function ringGeoJson(ring: [number, number][]): unknown {
  return {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } },
    ],
  };
}

function circleGeoJson(lat: number, lon: number, radiusM: number, vertices = 48): unknown {
  return ringGeoJson(circleRing(lat, lon, radiusM, vertices));
}

/** Planar shoelace area of a (lon, lat) ring in km², scaled by the
 *  cosine of its mean latitude — enough to decide whether the WorldPop
 *  allowance is respected. */
function ringAreaKm2(ring: readonly [number, number][]): number {
  if (ring.length < 3) return 0;
  const meanLat = ring.reduce((acc, p) => acc + p[1], 0) / ring.length;
  const kmLat = (EARTH_RADIUS_M * Math.PI) / 180 / 1_000;
  const kmLon = kmLat * Math.max(Math.cos((meanLat * Math.PI) / 180), 1e-6);
  let twice = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i];
    const b = ring[i + 1];
    if (a === undefined || b === undefined) continue;
    twice += a[0] * kmLon * (b[1] * kmLat) - b[0] * kmLon * (a[1] * kmLat);
  }
  return Math.abs(twice) / 2;
}

/** Ray-casting point-in-polygon on a (lon, lat) ring. */
function pointInRing(lon: number, lat: number, ring: readonly [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const pi = ring[i];
    const pj = ring[j];
    if (pi === undefined || pj === undefined) continue;
    const [xi, yi] = pi;
    const [xj, yj] = pj;
    const crosses = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

function ringBoundingBox(ring: readonly [number, number][]): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} {
  let minLat = 90;
  let maxLat = -90;
  let minLon = 180;
  let maxLon = -180;
  for (const [lon, lat] of ring) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  }
  return { minLat, maxLat, minLon, maxLon };
}

// ---------------------------------------------------------------------
// Backend 1 — operator COG (unchanged behaviour)
// ---------------------------------------------------------------------

let cachedTiff: GeoTIFF | null = null;
let cachedUrl: string | null = null;
let cogFailureCount = 0;

function resolveCogUrl(): string | null {
  const fromEnv = import.meta.env.VITE_POPULATION_COG_URL as string | undefined;
  return fromEnv !== undefined && fromEnv.length > 0 ? fromEnv : null;
}

async function getTiff(url: string): Promise<GeoTIFF> {
  if (cachedTiff !== null && cachedUrl === url) return cachedTiff;
  cachedTiff = await fromUrl(url);
  cachedUrl = url;
  return cachedTiff;
}

async function populationFromCog(
  url: string,
  lat: number,
  lon: number,
  radiusM: number
): Promise<PopulationLookupResult | null> {
  if (cogFailureCount > 0) return null;
  const bbox = circleBoundingBox(lat, lon, radiusM);
  if (bbox.minLon < -180 || bbox.maxLon > 180) return null;
  let tiff: GeoTIFF;
  try {
    tiff = await getTiff(url);
  } catch (err) {
    const wasFirst = cogFailureCount === 0;
    cogFailureCount += 1;
    if (wasFirst) {
      console.info(
        '[populationLookup] operator COG unreachable (CORS or network); using the WorldPop API / coarse raster instead:',
        err
      );
    }
    return null;
  }
  let sum = 0;
  try {
    const image = await tiff.getImage();
    const [originX, originY] = image.getOrigin();
    const [resX, resY] = image.getResolution();
    const width = image.getWidth();
    const height = image.getHeight();
    if (
      typeof originX !== 'number' ||
      typeof originY !== 'number' ||
      typeof resX !== 'number' ||
      typeof resY !== 'number'
    ) {
      return null;
    }
    const x0 = Math.max(0, Math.floor((bbox.minLon - originX) / resX));
    const x1 = Math.min(width, Math.ceil((bbox.maxLon - originX) / resX));
    const y0 = Math.max(0, Math.floor((bbox.maxLat - originY) / resY));
    const y1 = Math.min(height, Math.ceil((bbox.minLat - originY) / resY));
    if (x1 <= x0 || y1 <= y0) return null;
    const rasters = await image.readRasters({ window: [x0, y0, x1, y1], samples: [0] });
    const band = Array.isArray(rasters) ? rasters[0] : rasters;
    if (band === undefined) return null;
    const flat = band as ArrayLike<number>;
    const cellW = x1 - x0;
    const cellH = y1 - y0;
    for (let yi = 0; yi < cellH; yi++) {
      const cellLat = bbox.maxLat - (yi + 0.5) * Math.abs(resY);
      for (let xi = 0; xi < cellW; xi++) {
        const cellLon = bbox.minLon + (xi + 0.5) * Math.abs(resX);
        if (greatCircleM(lat, lon, cellLat, cellLon) > radiusM) continue;
        const v = flat[yi * cellW + xi];
        if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) continue;
        sum += v;
      }
    }
  } catch (err) {
    console.warn('[populationLookup] raster read failed:', err);
    return null;
  }
  return { exposed: Math.round(sum), source: url, method: 'cog', radiusM, bbox };
}

// ---------------------------------------------------------------------
// Backend 2 — WorldPop zonal statistics API
// ---------------------------------------------------------------------

interface WorldPopResponse {
  status?: string;
  error?: boolean;
  error_message?: string | null;
  taskid?: string;
  data?: { total_population?: number | string | null } | null;
}

const apiCache = new Map<string, Promise<number>>();
let apiFailureCount = 0;
let apiInFlight = 0;
const apiQueue: (() => void)[] = [];

function apiSlot(): Promise<() => void> {
  return new Promise((resolve) => {
    const release = (): void => {
      apiInFlight -= 1;
      const next = apiQueue.shift();
      if (next !== undefined) next();
    };
    const start = (): void => {
      apiInFlight += 1;
      resolve(release);
    };
    if (apiInFlight < WORLDPOP_CONCURRENCY) start();
    else apiQueue.push(start);
  });
}

function readTotal(body: WorldPopResponse): number | null {
  const raw = body.data?.total_population;
  if (raw === undefined || raw === null) return null;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function worldPopApiTotal(ring: [number, number][]): Promise<number> {
  const geojson = JSON.stringify(ringGeoJson(ring));
  const url = `${WORLDPOP_STATS_URL}?dataset=${WORLDPOP_DATASET}&year=${WORLDPOP_YEAR.toString()}&runasync=false&geojson=${encodeURIComponent(geojson)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, WORLDPOP_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`WorldPop API HTTP ${response.status.toString()}`);
    const body = (await response.json()) as WorldPopResponse;
    if (body.error === true) throw new Error(body.error_message ?? 'WorldPop API error');
    const direct = readTotal(body);
    if (direct !== null) return direct;
    if (body.taskid === undefined) throw new Error('WorldPop API returned neither data nor task');
    for (let attempt = 0; attempt < WORLDPOP_POLL_MAX; attempt++) {
      await sleep(WORLDPOP_POLL_MS);
      const poll = await fetch(`${WORLDPOP_TASKS_URL}${body.taskid}`);
      if (!poll.ok) continue;
      const task = (await poll.json()) as WorldPopResponse;
      if (task.error === true) throw new Error(task.error_message ?? 'WorldPop task error');
      const total = readTotal(task);
      if (total !== null) return total;
      if (task.status === 'finished') throw new Error('WorldPop task finished without data');
    }
    throw new Error('WorldPop task timed out');
  } finally {
    clearTimeout(timer);
  }
}

function populationFromApi(key: string, ring: [number, number][]): Promise<number> {
  const cached = apiCache.get(key);
  if (cached !== undefined) return cached;
  const task = (async (): Promise<number> => {
    const release = await apiSlot();
    try {
      return await worldPopApiTotal(ring);
    } finally {
      release();
    }
  })();
  apiCache.set(key, task);
  task.catch(() => {
    apiCache.delete(key);
  });
  return task;
}

// ---------------------------------------------------------------------
// Backend 3 — coarse WorldPop raster shipped with the site
// ---------------------------------------------------------------------

interface CoarseRasterMeta {
  cellDeg: number;
  nLon: number;
  nLat: number;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  pMax: number;
  source: string;
}

interface CoarseRaster {
  meta: CoarseRasterMeta;
  /** 8-bit log-scale values, row-major north to south. */
  values: Uint8Array;
}

let coarseRasterPromise: Promise<CoarseRaster | null> | null = null;

function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base.endsWith('/') ? base : `${base}/`}${path}`;
}

function loadCoarseRaster(): Promise<CoarseRaster | null> {
  if (coarseRasterPromise !== null) return coarseRasterPromise;
  coarseRasterPromise = (async (): Promise<CoarseRaster | null> => {
    try {
      const metaResponse = await fetch(assetUrl(COARSE_RASTER_META));
      if (!metaResponse.ok) throw new Error(`meta HTTP ${metaResponse.status.toString()}`);
      const meta = (await metaResponse.json()) as CoarseRasterMeta;
      const imageResponse = await fetch(assetUrl(COARSE_RASTER_IMAGE));
      if (!imageResponse.ok) throw new Error(`image HTTP ${imageResponse.status.toString()}`);
      const bitmap = await createImageBitmap(await imageResponse.blob());
      try {
        const canvas = new OffscreenCanvas(meta.nLon, meta.nLat);
        const ctx = canvas.getContext('2d');
        if (ctx === null) throw new Error('2D context unavailable');
        ctx.drawImage(bitmap, 0, 0);
        const pixels = ctx.getImageData(0, 0, meta.nLon, meta.nLat).data;
        const values = new Uint8Array(meta.nLon * meta.nLat);
        for (let i = 0; i < values.length; i++) values[i] = pixels[i * 4] ?? 0;
        return { meta, values };
      } finally {
        bitmap.close();
      }
    } catch (err) {
      console.warn('[populationLookup] coarse raster unavailable:', err);
      coarseRasterPromise = null;
      return null;
    }
  })();
  return coarseRasterPromise;
}

function decodeCell(v: number, pMax: number): number {
  if (v <= 0) return 0;
  return Math.exp((v * Math.log(1 + pMax)) / 255) - 1;
}

function sumCoarseRaster(raster: CoarseRaster, lat: number, lon: number, radiusM: number): number {
  const { meta, values } = raster;
  const bbox = circleBoundingBox(lat, lon, radiusM);
  const row0 = Math.max(0, Math.floor((meta.maxLat - bbox.maxLat) / meta.cellDeg));
  const row1 = Math.min(meta.nLat - 1, Math.ceil((meta.maxLat - bbox.minLat) / meta.cellDeg));
  const colSpan = Math.ceil((bbox.maxLon - bbox.minLon) / meta.cellDeg) + 1;
  const colStart = Math.floor((bbox.minLon - meta.minLon) / meta.cellDeg);
  let sum = 0;
  for (let r = row0; r <= row1; r++) {
    const cellLat = meta.maxLat - (r + 0.5) * meta.cellDeg;
    for (let k = 0; k <= colSpan; k++) {
      // Wrap columns across the antimeridian.
      const c = (((colStart + k) % meta.nLon) + meta.nLon) % meta.nLon;
      const cellLon = meta.minLon + (c + 0.5) * meta.cellDeg;
      if (greatCircleM(lat, lon, cellLat, cellLon) > radiusM) continue;
      sum += decodeCell(values[r * meta.nLon + c] ?? 0, meta.pMax);
    }
  }
  return sum;
}

function sumCoarseRasterRing(raster: CoarseRaster, ring: readonly [number, number][]): number {
  const { meta, values } = raster;
  const bbox = ringBoundingBox(ring);
  const row0 = Math.max(0, Math.floor((meta.maxLat - bbox.maxLat) / meta.cellDeg));
  const row1 = Math.min(meta.nLat - 1, Math.ceil((meta.maxLat - bbox.minLat) / meta.cellDeg));
  const col0 = Math.max(0, Math.floor((bbox.minLon - meta.minLon) / meta.cellDeg));
  const col1 = Math.min(meta.nLon - 1, Math.ceil((bbox.maxLon - meta.minLon) / meta.cellDeg));
  let sum = 0;
  for (let r = row0; r <= row1; r++) {
    const cellLat = meta.maxLat - (r + 0.5) * meta.cellDeg;
    for (let c = col0; c <= col1; c++) {
      const cellLon = meta.minLon + (c + 0.5) * meta.cellDeg;
      if (!pointInRing(cellLon, cellLat, ring)) continue;
      sum += decodeCell(values[r * meta.nLon + c] ?? 0, meta.pMax);
    }
  }
  return sum;
}

// ---------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------

/**
 * Population inside a circle, from the best backend available. Returns
 * null only when no backend can answer (offline, and the coarse raster
 * asset missing); the store renders that as "—" and the simulation is
 * untouched.
 */
export async function populationInRadius(
  lat: number,
  lon: number,
  radiusM: number,
  polygon?: PopulationPolygon
): Promise<PopulationLookupResult | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(radiusM)) return null;
  if (radiusM <= 0 || radiusM > MAX_QUERY_RADIUS_M) return null;
  const ring = polygon !== undefined && polygon.length >= 3 ? polygonRing(polygon) : null;
  const bbox = ring !== null ? ringBoundingBox(ring) : circleBoundingBox(lat, lon, radiusM);

  const cogUrl = resolveCogUrl();
  if (cogUrl !== null && ring === null) {
    const fromCog = await populationFromCog(cogUrl, lat, lon, radiusM);
    if (fromCog !== null) return fromCog;
  }

  const areaKm2 = ring !== null ? ringAreaKm2(ring) : circleAreaKm2(radiusM);
  if (areaKm2 <= WORLDPOP_API_MAX_AREA_KM2 && apiFailureCount < 2) {
    try {
      const key =
        ring !== null
          ? `poly:${ring.map((pt) => `${pt[0].toFixed(3)},${pt[1].toFixed(3)}`).join(';')}`
          : `${lat.toFixed(3)},${lon.toFixed(3)},${Math.round(radiusM / 50).toString()}`;
      const exposed = await populationFromApi(key, ring ?? circleRing(lat, lon, radiusM));
      return {
        exposed: Math.round(exposed),
        source: 'WorldPop 2020 (api.worldpop.org zonal statistics)',
        method: 'worldpop-api',
        radiusM,
        bbox,
      };
    } catch (err) {
      apiFailureCount += 1;
      console.warn('[populationLookup] WorldPop API failed, using the coarse raster:', err);
    }
  }

  const raster = await loadCoarseRaster();
  if (raster === null) return null;
  const exposed =
    ring !== null ? sumCoarseRasterRing(raster, ring) : sumCoarseRaster(raster, lat, lon, radiusM);
  return {
    exposed: Math.round(exposed),
    source: raster.meta.source,
    method: 'coarse-raster',
    radiusM,
    bbox,
  };
}

/** Test helper — clears every cache and re-enables every backend. */
export function _resetPopulationLookupCache(): void {
  cachedTiff = null;
  cachedUrl = null;
  cogFailureCount = 0;
  apiCache.clear();
  apiFailureCount = 0;
  coarseRasterPromise = null;
}

/** Exposed for unit tests of the geometry helpers. */
export const _internals = {
  circleAreaKm2,
  circleGeoJson,
  greatCircleM,
  decodeCell,
  sumCoarseRaster,
  sumCoarseRasterRing,
  ringAreaKm2,
  pointInRing,
};
