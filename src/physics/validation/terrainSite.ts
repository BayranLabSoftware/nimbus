import {
  makeElevationGrid,
  sampleElevation,
  sampleSlope,
  waldAllen2007Vs30FromSlope,
  type ElevationGrid,
} from '../elevation/index.js';
import {
  fetchTerrainGridForLocation,
  lonLatToTile,
  TERRAIN_TILE_ZOOM,
  tileBounds,
  type TerrainSourceSpan,
  type TerrainTileLoader,
} from '../../scene/terrainSampling.js';

/**
 * Rule 20's site: the Vs30 the store gives the simulator for a pick,
 * read on the tiles the browser would read it on.
 *
 * `fetchTerrainGridForLocation` chooses the tiles and resamples them;
 * the store reads `sampleSlope` at the pick and gives the simulator
 * Wald & Allen's Vs30 of it. Both run here unchanged, handed a loader.
 * What this adds is thrift: a block the browser builds from nine tiles,
 * or a strip from forty, is read at one point, and the slope there
 * takes a handful of samples from one tile or two. Every tile but the
 * one under the pick, which the land test reads in full, starts as a
 * stand-in with the tile's bounds and not-a-number in every sample. A
 * slope or an elevation that reads a stand-in comes out not-a-number;
 * then the tiles around the pick are read in and the grid is built
 * again. A finite answer read no stand-in, so it is the browser's.
 */

export interface TerrainSite {
  /** Tiles the browser fetches for this pick: one, the nine of a
   *  block, or a strip's. */
  tiles: number;
  /** Tiles read to measure the site. */
  tilesRead: number;
  /** Elevation at the pick on the browser's grid, m. */
  elevationM: number;
  /** Slope at the pick on the browser's grid, radians. */
  slopeRad: number;
  /** `waldAllen2007Vs30FromSlope` of that slope, m/s. */
  vs30: number;
}

const TILE_PIXELS = 256;

function standIn(x: number, y: number): ElevationGrid {
  return makeElevationGrid({
    ...tileBounds(x, y, TERRAIN_TILE_ZOOM),
    nLat: TILE_PIXELS,
    nLon: TILE_PIXELS,
    samples: new Float32Array(TILE_PIXELS * TILE_PIXELS).fill(Number.NaN),
  });
}

export async function measureTerrainSite(
  latitude: number,
  longitude: number,
  span: TerrainSourceSpan | undefined,
  readTile: TerrainTileLoader
): Promise<TerrainSite> {
  const key = (x: number, y: number): string => `${x.toString()}/${y.toString()}`;
  const pick = lonLatToTile(latitude, longitude, TERRAIN_TILE_ZOOM);
  const wanted = new Set([key(pick.x, pick.y)]);
  const read = new Map<string, Promise<ElevationGrid>>();
  for (;;) {
    const asked = new Set<string>();
    const loader: TerrainTileLoader = (x, y) => {
      const k = key(x, y);
      asked.add(k);
      if (!wanted.has(k)) return Promise.resolve(standIn(x, y));
      let tile = read.get(k);
      if (tile === undefined) {
        tile = readTile(x, y);
        read.set(k, tile);
      }
      return tile;
    };
    const grid = await fetchTerrainGridForLocation(latitude, longitude, span, loader);
    const elevationM = sampleElevation(grid, latitude, longitude);
    const slopeRad = sampleSlope(grid, latitude, longitude);
    if (Number.isFinite(elevationM) && Number.isFinite(slopeRad)) {
      return {
        tiles: asked.size,
        tilesRead: read.size,
        elevationM,
        slopeRad,
        vs30: waldAllen2007Vs30FromSlope(slopeRad),
      };
    }
    // The slope reads its neighbours one sample away, each of them
    // between two samples: every tile the grid asked for within three
    // samples of the pick is read in.
    const dLat = (3 * (grid.maxLat - grid.minLat)) / (grid.nLat - 1);
    const dLon = (3 * (grid.maxLon - grid.minLon)) / (grid.nLon - 1);
    const before = wanted.size;
    for (const lat of [latitude - dLat, latitude + dLat]) {
      for (const lon of [longitude - dLon, longitude + dLon]) {
        const t = lonLatToTile(lat, lon, TERRAIN_TILE_ZOOM);
        if (asked.has(key(t.x, t.y))) wanted.add(key(t.x, t.y));
      }
    }
    if (wanted.size === before) {
      throw new Error(
        `the slope at ${latitude.toString()}, ${longitude.toString()} reads a tile that is not around it`
      );
    }
  }
}
