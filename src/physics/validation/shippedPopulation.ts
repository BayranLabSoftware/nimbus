import { nearestCountry, type CountryPoint } from '../countryLookup.js';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { _internals } from '../../scene/populationLookup.js';
import { decodePng } from './png.js';

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

/** The browser's limits for reading a polygon off the fine tiles
 *  (populationLookup.ts): beyond them it reads the planet. */
const FINE_MAX_SPAN_DEG = 40;
const FINE_MAX_TILES = 8;

type GridView = ReturnType<(typeof _internals)['coarseView']>;

/** The raster a footprint in this box is read from, chosen as the
 *  browser chooses for a polygon: the fine tiles when the box is small
 *  enough for them, the planet otherwise. */
function viewForBox(bbox: { minLat: number; maxLat: number; minLon: number; maxLon: number }): {
  view: GridView;
  source: string;
  fine: boolean;
} {
  const { coarseView, fineView, tilesForBbox } = _internals;
  const index = loadFineIndex();
  if (
    index !== null &&
    Math.max(bbox.maxLat - bbox.minLat, bbox.maxLon - bbox.minLon) <= FINE_MAX_SPAN_DEG
  ) {
    const names = tilesForBbox(index, bbox);
    if (names.length > 0 && names.length <= FINE_MAX_TILES) {
      const tiles = new Map<string, { values: Uint8Array; land: Uint8Array }>();
      for (const name of names) {
        const tile = loadTile(name);
        if (tile !== null) tiles.set(name, tile);
      }
      if (tiles.size === names.length) {
        return { view: fineView(index, tiles), source: index.source, fine: true };
      }
    }
  }
  const planet = loadCoarse();
  if (planet === null) throw new Error('no population raster on disk');
  return {
    view: coarseView({ meta: planet.meta, values: planet.values, land: planet.land }),
    source: planet.meta.source,
    fine: false,
  };
}

/**
 * People inside a polygon — the rupture stadium an extended source is
 * drawn as — from the shipped rasters, summed by the browser's own
 * `sumGridRing` on the ring the browser would build. Until 14 September
 * 2026 the harness counted a stadium band as the circle of its contour
 * radius about the epicentre, which is not what the simulator counts.
 */
export function shippedPopulationInPolygon(
  polygon: readonly { latDeg: number; lonDeg: number }[]
): {
  exposed: number;
  source: string;
  fine: boolean;
} {
  const { sumGridRing, polygonRing, ringBoundingBox } = _internals;
  const ring = polygonRing(polygon);
  const { view, source, fine } = viewForBox(ringBoundingBox(ring));
  return { exposed: sumGridRing(view, ring), source, fine };
}

/** The sphere `buildRuptureStadiumLatLon` lays a stadium out on. */
const STADIUM_EARTH_RADIUS_M = 6_371_008;

/**
 * Every rupture stadium about one epicentre and one strike, counted
 * fast enough for a predictive band.
 *
 * A band asks for the people inside six hundred stadiums — three
 * intensity bands in each of two hundred realisations, each with its own
 * rupture and contour radius — and a polygon summed cell by cell costs
 * a few milliseconds, seconds an event. A stadium is a rectangle along
 * the strike grown by a radius, so whether a point lies inside it is a
 * distance from the rectangle, not a polygon test. This reads once the
 * populated cells within `reachM` of the epicentre, places in them the
 * sub-samples `sumGridRing` places, in the frame the polygon is laid
 * out in (distance and azimuth from the epicentre on the sphere, the
 * strike as the first axis), and answers a stadium by its sub-samples
 * within the radius of the rectangle; a cell wholly inside or wholly
 * outside is decided by its centre alone. Its agreement with
 * `sumGridRing` on the polygon is tested in shippedPopulation.test.ts.
 */
export function shippedStadiumCounter(
  latitude: number,
  longitude: number,
  strikeDeg: number,
  reachM: number
): (halfLengthM: number, halfWidthM: number, radiusM: number) => number {
  const toRad = Math.PI / 180;
  const dLat = reachM / STADIUM_EARTH_RADIUS_M / toRad;
  const poleward = Math.min(89.9, Math.abs(latitude) + dLat);
  const dLon = Math.min(180, dLat / Math.max(Math.cos(poleward * toRad), 1e-6));
  const bbox = {
    minLat: Math.max(-89.9, latitude - dLat),
    maxLat: Math.min(89.9, latitude + dLat),
    minLon: Math.max(-179.99, longitude - dLon),
    maxLon: Math.min(179.99, longitude + dLon),
  };
  const { view } = viewForBox(bbox);
  const n = _internals.EDGE_SUBSAMPLES;
  const row0 = Math.max(0, Math.floor((view.maxLat - bbox.maxLat) / view.cellDeg));
  const row1 = Math.min(view.nLat - 1, Math.ceil((view.maxLat - bbox.minLat) / view.cellDeg));
  const col0 = Math.max(0, Math.floor((bbox.minLon - view.minLon) / view.cellDeg));
  const col1 = Math.min(view.nLon - 1, Math.ceil((bbox.maxLon - view.minLon) / view.cellDeg));

  const lat0 = latitude * toRad;
  const lon0 = longitude * toRad;
  const theta = strikeDeg * toRad;
  const sinLat0 = Math.sin(lat0);
  const cosLat0 = Math.cos(lat0);
  // (x along strike, y across it) of a point, in metres.
  const frame = (latDeg: number, lonDeg: number): [number, number] => {
    const phi = latDeg * toRad;
    const dLambda = lonDeg * toRad - lon0;
    const h =
      Math.sin((phi - lat0) / 2) ** 2 + cosLat0 * Math.cos(phi) * Math.sin(dLambda / 2) ** 2;
    const d = 2 * STADIUM_EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
    const azimuth = Math.atan2(
      Math.sin(dLambda) * Math.cos(phi),
      cosLat0 * Math.sin(phi) - sinLat0 * Math.cos(phi) * Math.cos(dLambda)
    );
    return [d * Math.cos(azimuth - theta), d * Math.sin(azimuth - theta)];
  };

  const centres: number[] = [];
  const reach: number[] = [];
  const people: number[] = [];
  const samples: number[] = [];
  for (let r = row0; r <= row1; r++) {
    const cellLat = view.maxLat - (r + 0.5) * view.cellDeg;
    for (let c = col0; c <= col1; c++) {
      const cell = view.cellAt(r, c);
      if (cell.people === 0) continue;
      const cellLon = view.minLon + (c + 0.5) * view.cellDeg;
      const [cx, cy] = frame(cellLat, cellLon);
      let farthest = 0;
      for (let a = 0; a < n; a++) {
        const sLat = cellLat + ((a + 0.5) / n - 0.5) * view.cellDeg;
        for (let b = 0; b < n; b++) {
          const sLon = cellLon + ((b + 0.5) / n - 0.5) * view.cellDeg;
          const [sx, sy] = frame(sLat, sLon);
          samples.push(sx, sy);
          farthest = Math.max(farthest, Math.hypot(sx - cx, sy - cy));
        }
      }
      centres.push(cx, cy);
      reach.push(farthest);
      people.push(cell.people);
    }
  }
  const C = Float64Array.from(centres);
  const R = Float64Array.from(reach);
  const P = Float64Array.from(people);
  const S = Float64Array.from(samples);
  const perCell = n * n;

  // Distance from a point to the rectangle ±a along strike, ±b across.
  const outside = (x: number, y: number, a: number, b: number): number => {
    const ex = Math.abs(x) - a;
    const ey = Math.abs(y) - b;
    return Math.hypot(ex > 0 ? ex : 0, ey > 0 ? ey : 0);
  };

  return (halfLengthM, halfWidthM, radiusM) => {
    const a = Math.max(0, halfLengthM);
    const b = Math.max(0, halfWidthM);
    let sum = 0;
    for (let i = 0; i < P.length; i++) {
      const d = outside(C[2 * i] ?? 0, C[2 * i + 1] ?? 0, a, b);
      const spread = R[i] ?? 0;
      if (d - spread > radiusM) continue;
      const cellPeople = P[i] ?? 0;
      if (d + spread <= radiusM) {
        sum += cellPeople;
        continue;
      }
      let inside = 0;
      const base = 2 * i * perCell;
      for (let k = 0; k < perCell; k++) {
        if (outside(S[base + 2 * k] ?? 0, S[base + 2 * k + 1] ?? 0, a, b) <= radiusM) inside += 1;
      }
      sum += (cellPeople * inside) / perCell;
    }
    return sum;
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

/**
 * The country of the nearest city to a point, read from the same
 * `public/data/cities.json` the globe fetches.
 *
 * The calibration net runs in node with no network, and without this
 * every historical row would fall back to the median building stock —
 * which is what the model did until 9 September 2026, and what made
 * Northridge read 12 546 dead against 57. The harness has to see the
 * same country the browser sees or it is not measuring the model.
 */
let cityRows: CountryPoint[] | null = null;

export function shippedCountryAt(latitude: number, longitude: number): string | null {
  if (cityRows === null) {
    const path = join(DATA_DIR, 'cities.json');
    if (!existsSync(path)) {
      cityRows = [];
    } else {
      const file = JSON.parse(readFileSync(path, 'utf8')) as {
        rows: [string, string, number, number, number, number, number, string?][];
      };
      cityRows = file.rows
        .filter((r) => typeof r[7] === 'string' && r[7].length === 2)
        .map((r) => ({ lat: r[2], lon: r[3], cc: r[7] ?? '' }));
    }
  }
  return nearestCountry(cityRows, latitude, longitude)?.cc ?? null;
}
