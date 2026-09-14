import { describe, expect, it } from 'vitest';
import {
  makeElevationGrid,
  sampleElevation,
  sampleSlope,
  type ElevationGrid,
} from '../elevation/index.js';
import {
  fetchTerrainGridForLocation,
  TERRAIN_TILE_ZOOM,
  tileBounds,
  type TerrainSourceSpan,
} from '../../scene/terrainSampling.js';
import { measureTerrainSite } from './terrainSite.js';

/**
 * Rule 20 reads a site on the tiles the slope needs rather than every
 * tile the browser fetches. This holds the thrift to the whole grid, on
 * synthetic terrain with coasts in it: the same elevation and the same
 * slope, to the bit, on a single tile, on a block of nine, on a strip,
 * at a tile's edge and at the antimeridian.
 */

const PIXELS = 256;

/** Hills and sea floor, varying over a fraction of a tile. */
function terrain(lat: number, lon: number): number {
  return (
    2_600 * Math.sin(lat * 2.3) * Math.cos(lon * 1.7) + 700 * Math.sin(lat * 41 + lon * 29) - 1_900
  );
}

function syntheticTile(x: number, y: number): ElevationGrid {
  const b = tileBounds(x, y, TERRAIN_TILE_ZOOM);
  const samples = new Float32Array(PIXELS * PIXELS);
  for (let i = 0; i < PIXELS; i++) {
    const lat = b.maxLat - (i * (b.maxLat - b.minLat)) / (PIXELS - 1);
    for (let j = 0; j < PIXELS; j++) {
      samples[i * PIXELS + j] = terrain(lat, b.minLon + (j * (b.maxLon - b.minLon)) / (PIXELS - 1));
    }
  }
  return makeElevationGrid({ ...b, nLat: PIXELS, nLon: PIXELS, samples });
}

const loadAll = (x: number, y: number) => Promise.resolve(syntheticTile(x, y));

async function whole(latitude: number, longitude: number, span?: TerrainSourceSpan) {
  const grid = await fetchTerrainGridForLocation(latitude, longitude, span, loadAll);
  return {
    elevationM: sampleElevation(grid, latitude, longitude),
    slopeRad: sampleSlope(grid, latitude, longitude),
  };
}

describe('a site read on the tiles its slope needs', () => {
  const picks: { latitude: number; longitude: number; span?: TerrainSourceSpan }[] = [];
  for (let k = 0; k < 40; k++) {
    picks.push({ latitude: -50 + 2.61 * k, longitude: -170 + 8.37 * k });
  }
  // On the corner of a tile of sea, where the block's slope reads four
  // tiles; at the antimeridian; and along two ruptures.
  const corner = tileBounds(7, 60, TERRAIN_TILE_ZOOM);
  picks.push({ latitude: corner.minLat + 1e-4, longitude: corner.maxLon - 1e-4 });
  picks.push({ latitude: -38.6, longitude: 179.99 });
  picks.push({ latitude: 38.3, longitude: 142.4, span: { strikeDeg: 200, lengthM: 600_000 } });
  picks.push({ latitude: 51.5, longitude: 179.5, span: { strikeDeg: 90, lengthM: 800_000 } });

  it('is the whole grid, to the bit, whichever grid the browser builds', async () => {
    const kinds = new Set<string>();
    let mostRead = 0;
    for (const p of picks) {
      const thrifty = await measureTerrainSite(p.latitude, p.longitude, p.span, loadAll);
      const full = await whole(p.latitude, p.longitude, p.span);
      expect(thrifty.elevationM, `${p.latitude.toString()}, ${p.longitude.toString()}`).toBe(
        full.elevationM
      );
      expect(thrifty.slopeRad, `${p.latitude.toString()}, ${p.longitude.toString()}`).toBe(
        full.slopeRad
      );
      expect(thrifty.tilesRead).toBeLessThanOrEqual(thrifty.tiles);
      mostRead = Math.max(mostRead, thrifty.tilesRead);
      kinds.add(thrifty.tiles === 1 ? 'tile' : thrifty.tiles === 9 ? 'block' : 'strip');
    }
    // Every path of the browser's choice was taken.
    expect([...kinds].sort()).toEqual(['block', 'strip', 'tile']);
    // And a slope that first read a stand-in was read again on the tiles
    // around it.
    expect(mostRead).toBe(4);
  }, 60_000);
});
