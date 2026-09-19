import { describe, expect, it } from 'vitest';
import { strikeDifferenceDeg } from '../../validation/faultStrikeRules.js';
import {
  encodeDepthByte,
  encodeStrikeByte,
  encodeUncertaintyByte,
} from '../../validation/slabStrikeRules.js';
import {
  makeSlabField,
  nearestNode,
  nodeAddress,
  slabTileKey,
  type SlabTile,
  type SlabTileIndex,
} from './slabLookup.js';

/**
 * The reader of rules 295 to 303, on tiles built here so that what comes out is
 * known before it goes in. No Slab2 file is read by this test.
 */

const TILE_PX = 100;

const INDEX: SlabTileIndex = {
  source: 'test',
  citation: '',
  doi: '',
  dataDoi: '',
  licence: '',
  zones: ['tst'],
  cellDeg: 0.1,
  tileDeg: 10,
  tilePx: TILE_PX,
  rowsFromNorth: true,
  strikeStepDeg: 360 / 256,
  depthStepM: 3_000,
  uncertaintyStepM: 1_000,
  nodes: 0,
  tiles: [],
};

/** A tile whose every cell carries the same slab, or a given patch of it. */
function tileOf(
  fill: { strikeDeg: number; depthM: number; uncertaintyM: number } | null,
  patch?: (
    x: number,
    y: number
  ) => { strikeDeg: number; depthM: number; uncertaintyM: number } | null
): SlabTile {
  const n = TILE_PX * TILE_PX;
  const tile: SlabTile = {
    strike: new Uint8Array(n),
    depth: new Uint8Array(n),
    uncertainty: new Uint8Array(n),
  };
  for (let y = 0; y < TILE_PX; y += 1) {
    for (let x = 0; x < TILE_PX; x += 1) {
      const v = patch?.(x, y) ?? fill;
      if (v === null) continue;
      const at = y * TILE_PX + x;
      tile.strike[at] = encodeStrikeByte(v.strikeDeg);
      tile.depth[at] = encodeDepthByte(v.depthM);
      tile.uncertainty[at] = encodeUncertaintyByte(v.uncertaintyM);
    }
  }
  return tile;
}

describe('the Slab2 reader', () => {
  it('addresses a node by the tile the faults already use', () => {
    // 0°N 0°E: the antimeridian is column zero, the south pole row zero, so the
    // Greenwich equator is column 18 of 36 and row 9 of 18.
    expect(slabTileKey(0, 0)).toBe('18_9');
    // Tōhoku's tile, from the epicentre the presets record.
    expect(slabTileKey(38.297, 142.373)).toBe('32_12');
    // The antimeridian wraps instead of falling off.
    expect(slabTileKey(0, -180)).toBe(slabTileKey(0, 180));
  });

  it('puts row zero of the image at the north edge', () => {
    const top = nearestNode(19.94, 5); // the top node of tile row 10
    const bottom = nearestNode(10.01, 5);
    const a = nodeAddress(top.gi, top.gj, TILE_PX);
    const b = nodeAddress(bottom.gi, bottom.gj, TILE_PX);
    expect(a.key).toBe(b.key);
    expect(a.y).toBeLessThan(b.y);
    expect(a.y).toBe(0);
    expect(b.y).toBe(TILE_PX - 1);
  });

  it('reads back the slab that was written', () => {
    const tile = tileOf({ strikeDeg: 200, depthM: 24_000, uncertaintyM: 7_000 });
    const field = makeSlabField(INDEX, (key) => (key === slabTileKey(38.3, 142.4) ? tile : null));
    const sample = field(38.3, 142.4);
    expect(sample).not.toBeNull();
    expect(strikeDifferenceDeg(sample?.strikeDeg ?? 0, 200)).toBeLessThan(1);
    expect(sample?.depthM ?? 0).toBeCloseTo(24_000, -3);
    expect(sample?.depthUncertaintyM ?? 0).toBeCloseTo(7_000, -3);
  });

  it('says nothing where the clipping mask said nothing', () => {
    const field = makeSlabField(INDEX, () => null);
    expect(field(38.3, 142.4)).toBeNull();
    // …and a tile that exists but holds an empty cell is just as empty.
    const empty = tileOf(null);
    const field2 = makeSlabField(INDEX, () => empty);
    expect(field2(38.3, 142.4)).toBeNull();
  });

  it('interpolates inside the mask and does not spill over its edge', () => {
    // A tile whose western half is slab and whose eastern half is not.
    const tile = tileOf(null, (x) =>
      x < 50 ? { strikeDeg: 90, depthM: 30_000, uncertaintyM: 5_000 } : null
    );
    const field = makeSlabField(INDEX, () => tile);
    // Tile 18_9 is 0°E to 10°E, 0°N to 10°N, row 0 at the north edge: column 49
    // is 4.9°E and the mask ends there.
    const inside = field(5, 4.5);
    expect(inside).not.toBeNull();
    const outside = field(5, 5.5);
    expect(outside).toBeNull();
  });

  it('averages a strike across the wrap, not through it', () => {
    // Two columns, 359° and 1°: a point between them is 0°, never 180°.
    const tile = tileOf(null, (x) =>
      x < 50
        ? { strikeDeg: 359, depthM: 30_000, uncertaintyM: 5_000 }
        : { strikeDeg: 1, depthM: 30_000, uncertaintyM: 5_000 }
    );
    const field = makeSlabField(INDEX, () => tile);
    const sample = field(5, 4.95);
    expect(sample).not.toBeNull();
    expect(strikeDifferenceDeg(sample?.strikeDeg ?? 0, 0)).toBeLessThan(2);
  });
});
