import type { ElevationGrid } from '../elevation/index.js';
import { sampleElevation } from '../elevation/index.js';

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
    seaMaskAllows(options.seaMask, lat, lon, maskCells)
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
      // Keep the bucket sorted by distance, bounded in size.
      let k = bucket.length;
      while (k > 0 && (bucket[k - 1]?.distanceM ?? 0) > dist) k--;
      if (k < CANDIDATES_PER_SECTOR) {
        bucket.splice(k, 0, candidate);
        if (bucket.length > CANDIDATES_PER_SECTOR) bucket.length = CANDIDATES_PER_SECTOR;
      }
    }
  }

  const seeds: PropagationSeed[] = [];
  for (const bucket of perSector) {
    for (const candidate of bucket) {
      if (!seaMaskAllows(options.seaMask, candidate.latitude, candidate.longitude, maskCells)) {
        continue;
      }
      if (!waterBodyReaches(grid, candidate.i, candidate.j, minDepthM, minBodyCells)) continue;
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
