import { describe, expect, it } from 'vitest';
import {
  BUILDING_DISC_MAX_M,
  BUILDING_DISC_MIN_M,
  buildingDiscRadius,
  planBuildingTiles,
} from './buildings.js';
import { lonLatToTile } from '../geo/mercator.js';
import { BUILDING_ZOOM } from '../geo/vectorTiles.js';

const ROME = { lat: 41.9028, lon: 12.4964 };

describe('buildingDiscRadius', () => {
  it('tracks the 5 psi ring inside its clamps', () => {
    // Hiroshima-class: 1.69 km of 5 psi → the disc reaches past it.
    expect(buildingDiscRadius(1_690)).toBeCloseTo(2_197, 0);
    // No blast ring at all still buys the close-in city.
    expect(buildingDiscRadius(0)).toBe(BUILDING_DISC_MIN_M);
    // A megatonne event does not buy the whole region: beyond the cap
    // a building is smaller than the pixel that would show it.
    expect(buildingDiscRadius(50_000)).toBe(BUILDING_DISC_MAX_M);
  });
});

describe('planBuildingTiles', () => {
  it('always includes the tile under ground zero', () => {
    const centre = lonLatToTile(ROME.lon, ROME.lat, BUILDING_ZOOM);
    const tiles = planBuildingTiles(ROME.lat, ROME.lon, BUILDING_DISC_MIN_M);
    expect(tiles.some((t) => t.x === centre.x && t.y === centre.y)).toBe(true);
  });

  it('trims the corners of the scan square to the disc', () => {
    // A z14 tile at Rome is ~1.8 km. A 2.2 km disc fits in a 5x5
    // square of candidates but must not KEEP all 25: the corner tiles
    // sit over 3 km out.
    const tiles = planBuildingTiles(ROME.lat, ROME.lon, 2_197);
    expect(tiles.length).toBeGreaterThanOrEqual(9);
    expect(tiles.length).toBeLessThan(25);
  });

  it('is deterministic and duplicate-free', () => {
    const a = planBuildingTiles(ROME.lat, ROME.lon, 4_000);
    const b = planBuildingTiles(ROME.lat, ROME.lon, 4_000);
    expect(a).toEqual(b);
    const keys = new Set(a.map((t) => `${String(t.x)}/${String(t.y)}`));
    expect(keys.size).toBe(a.length);
  });

  it('grows monotonically with the radius', () => {
    const small = planBuildingTiles(ROME.lat, ROME.lon, 2_000);
    const large = planBuildingTiles(ROME.lat, ROME.lon, 6_000);
    const largeKeys = new Set(large.map((t) => `${String(t.x)}/${String(t.y)}`));
    for (const t of small) {
      expect(largeKeys.has(`${String(t.x)}/${String(t.y)}`)).toBe(true);
    }
  });
});
