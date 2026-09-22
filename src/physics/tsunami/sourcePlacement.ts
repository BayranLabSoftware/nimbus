import type { ElevationGrid } from '../elevation/index.js';
import { sampleElevation } from '../elevation/index.js';
import { destination } from './ruptureGeometry.js';

/**
 * Where does the wave start?
 *
 * The fast-marching solver needs a seed cell it can march from: water
 * at least {@link DEFAULT_MIN_DEPTH_M} deep, connected to enough water
 * to be a basin rather than a pond. Earlier revisions moved an inland
 * source to "the nearest cell below −1 m" — which, in central Florida,
 * is a lake, a river mouth or a bay seven metres deep. The solver
 * could not move from there, the arrival field came out empty and
 * the globe stayed mute while the legend listed a tsunami.
 *
 * This module finds propagation seeds properly, and finds more than
 * one: an inland event couples to every basin within its reach (a
 * Chicxulub-class impact in Florida drops ejecta into the Gulf and
 * the Atlantic in the same minute), so the search is run per compass
 * sector and returns the nearest usable seed in each. The solver
 * takes them all at t = 0 and the arrival field is the minimum.
 *
 * A seed is usable when:
 *   1. its own cell is water at least `minDepthM` deep (the solver's
 *      floor, below which the shallow-water approximation has no
 *      business propagating anything);
 *   2. it belongs to a connected body of at least `minBodyCells` such
 *      cells (rejects ponds, rivers and single-cell artefacts);
 *   3. when a coarse `seaMask` is supplied (the planetary mosaic), the
 *      mask also reads water at that point — a lake the 600 m tile
 *      shows as −19 m is land on the 40 km grid, and it is the
 *      planetary grid that decides what is sea.
 *
 * Pure: no I/O, no Cesium, unit-testable on synthetic grids.
 */

/** Solver floor — must match `fastMarching.ts`'s default minDepth. */
export const DEFAULT_MIN_DEPTH_M = 10;
/** A basin, not a pond: 24 cells is ≈ 9 km² on the local tile and
 *  ≈ 38 000 km² on the planetary mosaic. */
export const DEFAULT_MIN_BODY_CELLS = 24;
const DEFAULT_SECTORS = 8;
/** Candidates kept per sector, nearest first, so a rejected candidate
 *  (lake, pond) falls through to the next one. */
const CANDIDATES_PER_SECTOR = 6;
/** Sea-mask reading at or below this elevation counts as water. The
 *  mask is coarse; a coastal cell averaging land and sea can sit a
 *  little above zero, so the threshold is lenient. */
const SEA_MASK_THRESHOLD_M = 0;

const EARTH_RADIUS_M = 6_371_000;

export interface PropagationSeed {
  latitude: number;
  longitude: number;
  /** Water depth at the seed cell (m, positive). */
  depthM: number;
  /** Ground distance from the search origin (m). 0 for an origin that
   *  is itself usable water. */
  distanceM: number;
  /** Compass bearing from the origin (° clockwise from north). */
  bearingDeg: number;
}

export interface SeedSearchOptions {
  /** How far from the origin the event can still couple to the sea (m). */
  maxRadiusM: number;
  /** Compass sectors to search; one seed per sector at most. */
  sectors?: number;
  minDepthM?: number;
  minBodyCells?: number;
  /** Coarse grid that arbitrates "is this sea?" for candidates found
   *  on a finer grid. */
  seaMask?: ElevationGrid;
  /** Mask cells around the candidate's own cell that may vouch for it
   *  (0 = the cell itself). 1 lets a bay whose coarse cell averages to
   *  land — Tampa Bay on a 40 km grid — count as sea because the open
   *  Gulf sits in the next cell, while an inland lake two cells from
   *  any coast still fails. */
  seaMaskNeighbourhoodCells?: number;
  /** How many of each sector's nearest water cells are tried; the rest are
   *  never looked at. Six unless the caller asks for more (rule 812(a):
   *  an impact's shore search tries them all). */
  candidatesPerSector?: number;
  /** What the mask vouches for: the candidate's own cell, or any cell of the
   *  connected body it belongs to (rule 812(b): an impact's shore search, so
   *  that a bay narrower than the mask's cells counts where the mask sees any
   *  part of it as sea). */
  seaMaskScope?: 'cell' | 'body';
}

/**
 * True when the mask vouches, within `neighbourhoodCells`, for some cell of
 * the connected body (at least `minDepthM` deep) that cell (i, j) belongs to.
 * The search stops at the first vouched cell; `memo` remembers every cell it
 * visited, a body being one answer for all its cells.
 */
function bodyVouched(
  grid: ElevationGrid,
  i: number,
  j: number,
  minDepthM: number,
  mask: ElevationGrid | undefined,
  neighbourhoodCells: number,
  memo: Map<number, boolean>
): boolean {
  const start = i * grid.nLon + j;
  const known = memo.get(start);
  if (known !== undefined) return known;
  const seen = new Set<number>([start]);
  const queue: number[] = [start];
  let head = 0;
  let vouched = false;
  while (head < queue.length) {
    const idx = queue[head++] ?? 0;
    const remembered = memo.get(idx);
    if (remembered === true) {
      vouched = true;
      break;
    }
    const ci = Math.floor(idx / grid.nLon);
    const cj = idx - ci * grid.nLon;
    const c = cellCenter(grid, ci, cj);
    if (seaMaskAllows(mask, c.lat, c.lon, neighbourhoodCells)) {
      vouched = true;
      break;
    }
    const neighbours: [number, number][] = [
      [ci - 1, cj],
      [ci + 1, cj],
      [ci, cj - 1],
      [ci, cj + 1],
    ];
    for (const [ni, nj] of neighbours) {
      if (!isWaterCell(grid, ni, nj, minDepthM)) continue;
      const nidx = ni * grid.nLon + nj;
      if (seen.has(nidx)) continue;
      seen.add(nidx);
      queue.push(nidx);
    }
  }
  for (const idx of seen) memo.set(idx, vouched);
  return vouched;
}

interface Candidate extends PropagationSeed {
  i: number;
  j: number;
}

function covers(grid: ElevationGrid, lat: number, lon: number): boolean {
  return lat >= grid.minLat && lat <= grid.maxLat && lon >= grid.minLon && lon <= grid.maxLon;
}

function cellCenter(grid: ElevationGrid, i: number, j: number): { lat: number; lon: number } {
  const lat = grid.maxLat - (i / Math.max(1, grid.nLat - 1)) * (grid.maxLat - grid.minLat);
  const lon = grid.minLon + (j / Math.max(1, grid.nLon - 1)) * (grid.maxLon - grid.minLon);
  return { lat, lon };
}

function isWaterCell(grid: ElevationGrid, i: number, j: number, minDepthM: number): boolean {
  if (i < 0 || j < 0 || i >= grid.nLat || j >= grid.nLon) return false;
  const z = grid.samples[i * grid.nLon + j];
  return z !== undefined && z <= -minDepthM;
}

/**
 * True when the water body containing cell (i, j) has at least
 * `minCells` cells at or below −minDepthM. Bounded breadth-first
 * search: stops as soon as the count is reached, so a real ocean
 * costs `minCells` visits and a pond costs its own size.
 */
export function waterBodyReaches(
  grid: ElevationGrid,
  i: number,
  j: number,
  minDepthM: number,
  minCells: number
): boolean {
  if (!isWaterCell(grid, i, j, minDepthM)) return false;
  const start = i * grid.nLon + j;
  const seen = new Set<number>([start]);
  const queue: number[] = [start];
  let head = 0;
  while (head < queue.length) {
    if (seen.size >= minCells) return true;
    const idx = queue[head++] ?? 0;
    const ci = Math.floor(idx / grid.nLon);
    const cj = idx - ci * grid.nLon;
    const neighbours: [number, number][] = [
      [ci - 1, cj],
      [ci + 1, cj],
      [ci, cj - 1],
      [ci, cj + 1],
    ];
    for (const [ni, nj] of neighbours) {
      if (!isWaterCell(grid, ni, nj, minDepthM)) continue;
      const nidx = ni * grid.nLon + nj;
      if (seen.has(nidx)) continue;
      seen.add(nidx);
      queue.push(nidx);
    }
  }
  return seen.size >= minCells;
}

function seaMaskAllows(
  mask: ElevationGrid | undefined,
  lat: number,
  lon: number,
  neighbourhoodCells: number
): boolean {
  if (mask === undefined) return true;
  if (!covers(mask, lat, lon)) return true;
  if (sampleElevation(mask, lat, lon) <= SEA_MASK_THRESHOLD_M) return true;
  if (neighbourhoodCells <= 0) return false;
  const dLat = (mask.maxLat - mask.minLat) / Math.max(1, mask.nLat - 1);
  const dLon = (mask.maxLon - mask.minLon) / Math.max(1, mask.nLon - 1);
  for (let di = -neighbourhoodCells; di <= neighbourhoodCells; di++) {
    for (let dj = -neighbourhoodCells; dj <= neighbourhoodCells; dj++) {
      if (di === 0 && dj === 0) continue;
      const nLat = lat + di * dLat;
      const nLon = lon + dj * dLon;
      if (!covers(mask, nLat, nLon)) continue;
      if (sampleElevation(mask, nLat, nLon) <= SEA_MASK_THRESHOLD_M) return true;
    }
  }
  return false;
}

/** The cell of `grid` a point falls in, or null where the grid does not
 *  cover it. */
function cellOf(grid: ElevationGrid, lat: number, lon: number): { i: number; j: number } | null {
  if (!covers(grid, lat, lon)) return null;
  const i = Math.round(((grid.maxLat - lat) / (grid.maxLat - grid.minLat)) * (grid.nLat - 1));
  const j = Math.round(((lon - grid.minLon) / (grid.maxLon - grid.minLon)) * (grid.nLon - 1));
  return { i, j };
}

/** What `waterWithinRadius` read. */
export interface WaterWithinReading {
  /** Lattice points inside the disc. */
  points: number;
  /** Of them, read on the fine tile. */
  onTile: number;
  /** Of them, counted as water. */
  water: number;
  /** The mean depth of those (m); null when none counts. */
  meanDepthM: number | null;
  /** Each point that counts: where it is, how far and which way from the
   *  centre, and how deep (m). */
  waterPoints: PropagationSeed[];
}

/** The terms a point counts as water on (the shoreline search's own). */
export interface WaterWithinOptions {
  /** Points a side over the disc's square. */
  lattice: number;
  minDepthM: number;
  /** The body a tile cell must belong to, in the tile's cells. */
  tileBodyCells: number;
  /** The body a mosaic cell must belong to, in the mosaic's cells. */
  mosaicBodyCells: number;
  /** Mosaic cells about a tile cell that may vouch for it as sea. */
  seaMaskNeighbourhoodCells: number;
}

/**
 * The water within `radiusM` of (lat, lon): rule 798 of
 * `validation/craterWaterDepthRules.ts`, the water a land impact's crater
 * reaches. The disc is read on a lattice of `lattice` points a side over its
 * square, each point inside it placed on the sphere by its range and bearing
 * and read on the finest map that covers it — `tile`, else `mosaic` — at the
 * cell it falls in. A point counts as water on the terms the shoreline search
 * uses on that map: `minDepthM` below the sea at least, in a body of
 * `tileBodyCells` vouched for by the mosaic on the tile, of `mosaicBodyCells`
 * on the mosaic.
 */
export function waterWithinRadius(
  tile: ElevationGrid,
  mosaic: ElevationGrid | null,
  lat: number,
  lon: number,
  radiusM: number,
  options: WaterWithinOptions
): WaterWithinReading {
  const n = Math.max(2, Math.floor(options.lattice));
  let points = 0;
  let onTile = 0;
  let water = 0;
  let depthSum = 0;
  const waterPoints: PropagationSeed[] = [];
  if (!(radiusM > 0) || !Number.isFinite(radiusM)) {
    return { points, onTile, water, meanDepthM: null, waterPoints };
  }
  // A body is the same body for every point that falls in it.
  const bodies = new Map<ElevationGrid, Map<number, boolean>>();
  const inBody = (grid: ElevationGrid, i: number, j: number, cells: number): boolean => {
    let memo = bodies.get(grid);
    if (memo === undefined) {
      memo = new Map<number, boolean>();
      bodies.set(grid, memo);
    }
    const key = i * grid.nLon + j;
    let reaches = memo.get(key);
    if (reaches === undefined) {
      reaches = waterBodyReaches(grid, i, j, options.minDepthM, cells);
      memo.set(key, reaches);
    }
    return reaches;
  };
  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      const east = (-1 + (2 * a) / (n - 1)) * radiusM;
      const north = (-1 + (2 * b) / (n - 1)) * radiusM;
      const range = Math.hypot(east, north);
      if (range > radiusM) continue;
      points++;
      const bearing = ((((Math.atan2(east, north) * 180) / Math.PI) % 360) + 360) % 360;
      const at = destination(lat, lon, bearing, range);
      const pLat = at.latitude;
      const pLon = ((((at.longitude + 180) % 360) + 360) % 360) - 180;
      let depth: number | null = null;
      const fine = cellOf(tile, pLat, pLon);
      if (fine !== null) {
        onTile++;
        if (
          isWaterCell(tile, fine.i, fine.j, options.minDepthM) &&
          inBody(tile, fine.i, fine.j, options.tileBodyCells) &&
          seaMaskAllows(mosaic ?? undefined, pLat, pLon, options.seaMaskNeighbourhoodCells)
        ) {
          depth = -(tile.samples[fine.i * tile.nLon + fine.j] ?? 0);
        }
      } else if (mosaic !== null) {
        const coarse = cellOf(mosaic, pLat, pLon);
        if (
          coarse !== null &&
          isWaterCell(mosaic, coarse.i, coarse.j, options.minDepthM) &&
          inBody(mosaic, coarse.i, coarse.j, options.mosaicBodyCells)
        ) {
          depth = -(mosaic.samples[coarse.i * mosaic.nLon + coarse.j] ?? 0);
        }
      }
      if (depth !== null) {
        water++;
        depthSum += depth;
        waterPoints.push({
          latitude: pLat,
          longitude: pLon,
          depthM: depth,
          distanceM: range,
          bearingDeg: bearing,
        });
      }
    }
  }
  return {
    points,
    onTile,
    water,
    meanDepthM: water > 0 ? depthSum / water : null,
    waterPoints,
  };
}

/**
 * The seeds of a land impact's wave on one grid (rules 819 to 825 of
 * validation/seedCraterRules.ts): the points of its crater's own sea
 * (`craterSea`, rule 798's lattice) at which the solver can march on `grid` —
 * a cell at least `minDepthM` deep in a body of `minBodyCells`, vouched for by
 * `seaMask` when one is given — one seed per cell, nearest first. Where none
 * is, the nearest of `search`, the seeds the ordinary search found, and only
 * that one.
 */
export function seedsFromCraterSea(
  craterSea: readonly PropagationSeed[],
  grid: ElevationGrid,
  search: readonly PropagationSeed[],
  options: { minDepthM?: number; minBodyCells?: number; seaMask?: ElevationGrid } = {}
): PropagationSeed[] {
  const minDepthM = options.minDepthM ?? DEFAULT_MIN_DEPTH_M;
  const minBodyCells = options.minBodyCells ?? DEFAULT_MIN_BODY_CELLS;
  const seen = new Set<number>();
  const seeds: PropagationSeed[] = [];
  for (const point of [...craterSea].sort((a, b) => a.distanceM - b.distanceM)) {
    const cell = cellOf(grid, point.latitude, point.longitude);
    if (cell === null) continue;
    const key = cell.i * grid.nLon + cell.j;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!isWaterCell(grid, cell.i, cell.j, minDepthM)) continue;
    if (!waterBodyReaches(grid, cell.i, cell.j, minDepthM, minBodyCells)) continue;
    if (!seaMaskAllows(options.seaMask, point.latitude, point.longitude, 0)) continue;
    const z = grid.samples[key] ?? 0;
    seeds.push({ ...point, depthM: -z });
  }
  if (seeds.length > 0) return seeds;
  const nearest = [...search].sort((a, b) => a.distanceM - b.distanceM)[0];
  return nearest === undefined ? [] : [nearest];
}

/**
 * Nearest usable propagation seed in each compass sector within
 * `maxRadiusM` of (lat, lon), nearest first. When the origin itself
 * is usable water the answer is the origin alone — the wave starts
 * where the event happened.
 */
export function findPropagationSeeds(
  grid: ElevationGrid,
  lat: number,
  lon: number,
  options: SeedSearchOptions
): PropagationSeed[] {
  const minDepthM = options.minDepthM ?? DEFAULT_MIN_DEPTH_M;
  const minBodyCells = options.minBodyCells ?? DEFAULT_MIN_BODY_CELLS;
  const sectors = Math.max(1, Math.floor(options.sectors ?? DEFAULT_SECTORS));
  const maskCells = Math.max(0, Math.floor(options.seaMaskNeighbourhoodCells ?? 0));
  const budget = options.candidatesPerSector ?? CANDIDATES_PER_SECTOR;
  const bodyScope = options.seaMaskScope === 'body';
  const vouchedMemo = new Map<number, boolean>();
  const maskAllows = (i: number, j: number, cLat: number, cLon: number): boolean =>
    bodyScope
      ? bodyVouched(grid, i, j, minDepthM, options.seaMask, maskCells, vouchedMemo)
      : seaMaskAllows(options.seaMask, cLat, cLon, maskCells);
  const maxRadiusM = options.maxRadiusM;
  if (!Number.isFinite(maxRadiusM) || maxRadiusM <= 0) return [];
  if (grid.nLat < 2 || grid.nLon < 2) return [];

  const metersPerDegLat = (EARTH_RADIUS_M * Math.PI) / 180;
  const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 1e-6);
  const metersPerDegLon = metersPerDegLat * cosLat;
  const dLatDeg = (grid.maxLat - grid.minLat) / Math.max(1, grid.nLat - 1);
  const dLonDeg = (grid.maxLon - grid.minLon) / Math.max(1, grid.nLon - 1);

  // The origin: usable water means the event is in the sea.
  const oi = Math.round(((grid.maxLat - lat) / (grid.maxLat - grid.minLat)) * (grid.nLat - 1));
  const oj = Math.round(((lon - grid.minLon) / (grid.maxLon - grid.minLon)) * (grid.nLon - 1));
  if (
    oi >= 0 &&
    oj >= 0 &&
    oi < grid.nLat &&
    oj < grid.nLon &&
    isWaterCell(grid, oi, oj, minDepthM) &&
    waterBodyReaches(grid, oi, oj, minDepthM, minBodyCells) &&
    maskAllows(oi, oj, lat, lon)
  ) {
    const z = grid.samples[oi * grid.nLon + oj] ?? 0;
    return [{ latitude: lat, longitude: lon, depthM: -z, distanceM: 0, bearingDeg: 0 }];
  }

  // Bounding rows / columns of the search disc, clamped to the grid.
  const rowSpan = Math.ceil(maxRadiusM / metersPerDegLat / dLatDeg) + 1;
  const colSpan = Math.ceil(maxRadiusM / metersPerDegLon / dLonDeg) + 1;
  const i0 = Math.max(0, oi - rowSpan);
  const i1 = Math.min(grid.nLat - 1, oi + rowSpan);
  const j0 = Math.max(0, oj - colSpan);
  const j1 = Math.min(grid.nLon - 1, oj + colSpan);
  if (i1 < i0 || j1 < j0) return [];

  const sectorWidth = 360 / sectors;
  const perSector: Candidate[][] = Array.from({ length: sectors }, () => []);
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      if (!isWaterCell(grid, i, j, minDepthM)) continue;
      const c = cellCenter(grid, i, j);
      const dy = (c.lat - lat) * metersPerDegLat;
      const dx = (c.lon - lon) * metersPerDegLon;
      const dist = Math.hypot(dx, dy);
      if (dist > maxRadiusM || dist === 0) continue;
      const bearing = ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360;
      const sector = Math.min(sectors - 1, Math.floor(bearing / sectorWidth));
      const bucket = perSector[sector];
      if (bucket === undefined) continue;
      const z = grid.samples[i * grid.nLon + j] ?? 0;
      const candidate: Candidate = {
        latitude: c.lat,
        longitude: c.lon,
        depthM: -z,
        distanceM: dist,
        bearingDeg: bearing,
        i,
        j,
      };
      if (!Number.isFinite(budget)) {
        bucket.push(candidate);
        continue;
      }
      // Keep the bucket sorted by distance, bounded in size.
      let k = bucket.length;
      while (k > 0 && (bucket[k - 1]?.distanceM ?? 0) > dist) k--;
      if (k < budget) {
        bucket.splice(k, 0, candidate);
        if (bucket.length > budget) bucket.length = budget;
      }
    }
  }
  if (!Number.isFinite(budget)) {
    for (const bucket of perSector) bucket.sort((a, b) => a.distanceM - b.distanceM);
  }

  const seeds: PropagationSeed[] = [];
  for (const bucket of perSector) {
    for (const candidate of bucket) {
      if (bodyScope) {
        if (!waterBodyReaches(grid, candidate.i, candidate.j, minDepthM, minBodyCells)) continue;
        if (!maskAllows(candidate.i, candidate.j, candidate.latitude, candidate.longitude)) {
          continue;
        }
      } else {
        if (!maskAllows(candidate.i, candidate.j, candidate.latitude, candidate.longitude)) {
          continue;
        }
        if (!waterBodyReaches(grid, candidate.i, candidate.j, minDepthM, minBodyCells)) continue;
      }
      seeds.push({
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        depthM: candidate.depthM,
        distanceM: candidate.distanceM,
        bearingDeg: candidate.bearingDeg,
      });
      break;
    }
  }
  seeds.sort((a, b) => a.distanceM - b.distanceM);
  return seeds;
}

/**
 * Where along the source the wave starts.
 *
 * One point for anything compact — a crater, a caldera, a charge. For a
 * rupture, points every fifty kilometres along its length, so the arrival
 * field measures travel time from the nearest part of the fault rather than
 * from one end of it. Fifty kilometres is finer than any grid this field runs
 * on, and the count is capped so a fifteen-hundred-kilometre megathrust costs a
 * bounded number of seed searches.
 *
 * This lived in the store until 19 September 2026, where a harness could not
 * reach it: rule 211 of `validation/farFieldReferenceRules.ts` asks when Nimbus
 * says the wave arrives at a DART buoy, and the answer has to be the product's
 * own and not a copy — the difference is not small, because an epicentre that a
 * 40 km raster calls land (three of BM-05's nine) radiates from whichever water
 * touches that cell, which on the Alaska Peninsula is the wrong ocean.
 */
export const RUPTURE_SEED_SPACING_M = 50_000;
export const MAX_RUPTURE_SEEDS = 31;

export function ruptureOrigins(
  centre: { latitude: number; longitude: number },
  source: { strikeDeg?: number; ruptureLengthM?: number }
): { latitude: number; longitude: number }[] {
  const origin = { latitude: centre.latitude, longitude: centre.longitude };
  const strikeDeg = source.strikeDeg;
  const lengthM = source.ruptureLengthM ?? 0;
  if (strikeDeg === undefined || !(lengthM > RUPTURE_SEED_SPACING_M)) return [origin];
  const steps = Math.min(MAX_RUPTURE_SEEDS, Math.round(lengthM / RUPTURE_SEED_SPACING_M) | 1);
  const half = lengthM / 2;
  const out: { latitude: number; longitude: number }[] = [];
  for (let i = 0; i < steps; i++) {
    const t = -half + (lengthM * i) / (steps - 1);
    out.push(destination(origin.latitude, origin.longitude, strikeDeg, t));
  }
  return out;
}
