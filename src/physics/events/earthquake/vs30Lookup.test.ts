import { describe, expect, it } from 'vitest';
import {
  VS30_HIGH,
  VS30_LOW,
  decodeVs30Byte,
  makeSiteLookup,
  vs30PixelAt,
  vs30TileKey,
  type Vs30TileIndex,
} from './vs30Lookup.js';

/** The index the builder writes, as the builder writes it. */
const INDEX: Vs30TileIndex = {
  source: 'test',
  url: '',
  cellDeg: 2.5 / 60,
  tileWidthDeg: 60,
  tileHeightDeg: 30,
  tileCols: 6,
  tileRows: 6,
  tileWidthPx: 1440,
  tileHeightPx: 720,
  minLat: -90,
  maxLat: 90,
  minLon: -180,
  maxLon: 180,
  aggregation: '',
  encoding: '',
  tiles: [],
};

describe('rule 310 — the ground, and where it comes from', () => {
  it('decodes the byte the builder wrote, and its two ends', () => {
    expect(decodeVs30Byte(0)).toBeNull();
    expect(decodeVs30Byte(1)).toBeCloseTo(VS30_LOW, 9);
    expect(decodeVs30Byte(255)).toBeCloseTo(VS30_HIGH, 6);
    // A step is 1.3 % — finer than anything a site term does with it.
    const a = decodeVs30Byte(100) ?? 0;
    const b = decodeVs30Byte(101) ?? 0;
    expect(b / a - 1).toBeLessThan(0.014);
    expect(b / a - 1).toBeGreaterThan(0.012);
  });

  it('finds the tile and the pixel of a place', () => {
    // 0°N 0°E: the third tile across (120° of longitude before it), the third
    // down (60° of latitude above it).
    expect(vs30TileKey(INDEX, 0, 0)).toBe('3_3');
    expect(vs30TileKey(INDEX, 89, -179)).toBe('0_0');
    expect(vs30TileKey(INDEX, -89, 179)).toBe('5_5');
    const pixel = vs30PixelAt(INDEX, 60, -180);
    expect(pixel?.key).toBe('0_1');
    expect(pixel?.at).toBe(0); // the tile's north-west corner
  });

  it('takes the grid first, the fallback next, and says which', () => {
    const tile = new Uint8Array(INDEX.tileWidthPx * INDEX.tileHeightPx);
    const inGrid = vs30PixelAt(INDEX, 35.5, 139.5);
    if (inGrid !== null) tile[inGrid.at] = 100;
    const site = makeSiteLookup(
      INDEX,
      (key) => (key === inGrid?.key ? tile : null),
      (lat) => (lat < 0 ? 300 : null)
    );
    const fromGrid = site(35.5, 139.5);
    expect(fromGrid.provenance).toBe('grid');
    expect(fromGrid.vs30).toBeCloseTo(decodeVs30Byte(100) ?? 0, 9);
    // A cell the mask left empty falls through to the caller's own derivation…
    const fromSlope = site(-10, 20);
    expect(fromSlope.provenance).toBe('slope');
    expect(fromSlope.vs30).toBe(300);
    // …and to rock where there is none.
    const fromRock = site(10, 20);
    expect(fromRock.provenance).toBe('rock');
    expect(fromRock.vs30).toBe(760);
  });
});
