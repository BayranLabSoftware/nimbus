import { afterEach, describe, expect, it } from 'vitest';
import { PbfWriter } from 'pbf';
import {
  clipRingToTile,
  decodeBuildingTile,
  loadBuildingTile,
  resetTileTemplate,
  tileTemplate,
  type BinaryLoader,
  type TileRef,
} from './vectorTiles.js';
import { tileToLonLat } from './mercator.js';

/*
 * The fixture tile is ENCODED here with pbf's own writer instead of
 * committing a binary: the test then documents the wire format it
 * exercises, and a failure diffs as numbers, not as hex.
 */

type Pt = readonly [number, number];

const zig = (v: number): number => (v << 1) ^ (v >> 31);

/** Σ(x2−x1)(y1+y2) > 0 marks an exterior ring for the decoder we use. */
function windingSum(ring: readonly Pt[]): number {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    if (a === undefined || b === undefined) continue;
    sum += (b[0] - a[0]) * (a[1] + b[1]);
  }
  return sum;
}

function wound(ring: readonly Pt[], exterior: boolean): Pt[] {
  const positive = windingSum(ring) > 0;
  return positive === exterior ? [...ring] : [...ring].reverse();
}

function polygonCommands(rings: readonly (readonly Pt[])[]): number[] {
  const out: number[] = [];
  let cx = 0;
  let cy = 0;
  for (const ring of rings) {
    const first = ring[0];
    if (first === undefined) continue;
    out.push(1 | (1 << 3), zig(first[0] - cx), zig(first[1] - cy));
    cx = first[0];
    cy = first[1];
    out.push(2 | ((ring.length - 1) << 3));
    for (let i = 1; i < ring.length; i++) {
      const p = ring[i];
      if (p === undefined) continue;
      out.push(zig(p[0] - cx), zig(p[1] - cy));
      cx = p[0];
      cy = p[1];
    }
    out.push(7 | (1 << 3)); // ClosePath
  }
  return out;
}

interface FixtureFeature {
  readonly type: number;
  readonly tags: readonly number[];
  readonly geometry: readonly number[];
}

function encodeTile(
  layerName: string,
  keys: readonly string[],
  values: readonly number[],
  features: readonly FixtureFeature[]
): ArrayBuffer {
  const writer = new PbfWriter();
  writer.writeMessage(
    3,
    (_, pbf) => {
      pbf.writeVarintField(15, 2); // version
      pbf.writeStringField(1, layerName);
      pbf.writeVarintField(5, 4096); // extent
      for (const key of keys) pbf.writeStringField(3, key);
      for (const value of values) {
        pbf.writeMessage(
          4,
          (v, vp) => {
            vp.writeDoubleField(3, v);
          },
          value
        );
      }
      for (const feature of features) {
        pbf.writeMessage(
          2,
          (f, fp) => {
            fp.writeVarintField(3, f.type);
            fp.writePackedVarint(2, [...f.tags]);
            fp.writePackedVarint(4, [...f.geometry]);
          },
          feature
        );
      }
    },
    null
  );
  const bytes = writer.finish();
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

const TILE: TileRef = { x: 8760, y: 6087, z: 14 };

const squareBuilding = (height: number): ArrayBuffer =>
  encodeTile(
    'building',
    ['render_height', 'render_min_height'],
    [height],
    [
      {
        type: 3,
        tags: [0, 0],
        geometry: polygonCommands([
          wound(
            [
              [1000, 1000],
              [1200, 1000],
              [1200, 1200],
              [1000, 1200],
            ],
            true
          ),
        ]),
      },
    ]
  );

describe('decodeBuildingTile', () => {
  it('reads a footprint back in degrees, at the tile corners it was written to', () => {
    const out = decodeBuildingTile(squareBuilding(21), TILE);
    expect(out.length).toBe(1);
    const building = out[0];
    expect(building?.heightMeters).toBe(21);
    expect(building?.outer.points.length).toBe(4);
    expect(building?.outer.walls.every((w) => w)).toBe(true);
    const expected = tileToLonLat(TILE.x + 1000 / 4096, TILE.y + 1000 / 4096, TILE.z);
    const got = building?.outer.points.find(
      (p) => Math.abs(p.lon - expected.lon) < 1e-9 && Math.abs(p.lat - expected.lat) < 1e-9
    );
    expect(got).toBeDefined();
  });

  it('assigns a hole to its outer ring', () => {
    const buffer = encodeTile(
      'building',
      ['render_height'],
      [10],
      [
        {
          type: 3,
          tags: [0, 0],
          geometry: polygonCommands([
            wound(
              [
                [0, 0],
                [400, 0],
                [400, 400],
                [0, 400],
              ],
              true
            ),
            wound(
              [
                [100, 100],
                [300, 100],
                [300, 300],
                [100, 300],
              ],
              false
            ),
          ]),
        },
      ]
    );
    const out = decodeBuildingTile(buffer, TILE);
    expect(out.length).toBe(1);
    expect(out[0]?.holes.length).toBe(1);
  });

  it('clips the tile-buffer overlap away and drops the wall on the cut', () => {
    // A building reaching 64 units past the west edge — exactly the
    // overlap measured on the real planet build. The copy in THIS tile
    // must stop at x = 0 and put no facade on the cut, or the copy in
    // the neighbouring tile z-fights it.
    const buffer = encodeTile(
      'building',
      ['render_height'],
      [10],
      [
        {
          type: 3,
          tags: [0, 0],
          geometry: polygonCommands([
            wound(
              [
                [-64, 500],
                [200, 500],
                [200, 700],
                [-64, 700],
              ],
              true
            ),
          ]),
        },
      ]
    );
    const out = decodeBuildingTile(buffer, TILE);
    const building = out[0];
    expect(building).toBeDefined();
    if (building === undefined) return;
    const westEdge = tileToLonLat(TILE.x, TILE.y, TILE.z).lon;
    for (const p of building.outer.points) {
      expect(p.lon).toBeGreaterThanOrEqual(westEdge - 1e-12);
    }
    // Exactly one edge lies on the cut, and exactly one wall is off.
    expect(building.outer.walls.filter((w) => !w).length).toBe(1);
  });

  it('returns an empty list, not an error, where the layer does not exist', () => {
    const buffer = encodeTile('landuse', [], [], []);
    expect(decodeBuildingTile(buffer, TILE)).toEqual([]);
  });

  it('ignores features that are not polygons', () => {
    const buffer = encodeTile(
      'building',
      ['render_height'],
      [10],
      [{ type: 1, tags: [0, 0], geometry: [1 | (1 << 3), zig(50), zig(50)] }]
    );
    expect(decodeBuildingTile(buffer, TILE)).toEqual([]);
  });

  it('falls back to the schema default when the height is missing', () => {
    const buffer = encodeTile(
      'building',
      [],
      [],
      [
        {
          type: 3,
          tags: [],
          geometry: polygonCommands([
            wound(
              [
                [0, 0],
                [100, 0],
                [100, 100],
                [0, 100],
              ],
              true
            ),
          ]),
        },
      ]
    );
    expect(decodeBuildingTile(buffer, TILE)[0]?.heightMeters).toBe(8);
  });
});

describe('clipRingToTile', () => {
  it('leaves an interior ring untouched and empties an exterior one', () => {
    const inside = [
      { x: 10, y: 10 },
      { x: 20, y: 10 },
      { x: 20, y: 20 },
    ];
    expect(clipRingToTile(inside, 4096)).toEqual(inside);
    const outside = [
      { x: -30, y: -30 },
      { x: -10, y: -30 },
      { x: -10, y: -10 },
    ];
    expect(clipRingToTile(outside, 4096).length).toBeLessThan(3);
  });
});

describe('loadBuildingTile', () => {
  afterEach(() => {
    resetTileTemplate();
  });

  it('resolves the dated template from the TileJSON, then substitutes', async () => {
    const urls: string[] = [];
    const loader: BinaryLoader = (url) => {
      urls.push(url);
      if (url.includes('openfreemap')) {
        const json = JSON.stringify({ tiles: ['https://example.test/dated_123/{z}/{x}/{y}.pbf'] });
        return Promise.resolve(new TextEncoder().encode(json).buffer);
      }
      return Promise.resolve(squareBuilding(15));
    };
    const out = await loadBuildingTile({ x: 1, y: 2, z: 14 }, loader);
    expect(out.length).toBe(1);
    expect(urls[1]).toBe('https://example.test/dated_123/14/1/2.pbf');

    // Second request for the same tile: served from cache, no fetch.
    const before = urls.length;
    await loadBuildingTile({ x: 1, y: 2, z: 14 }, loader);
    expect(urls.length).toBe(before);
  });

  it('refuses a TileJSON with no usable template', async () => {
    const loader: BinaryLoader = () =>
      Promise.resolve(new TextEncoder().encode(JSON.stringify({ tiles: [] })).buffer);
    await expect(tileTemplate(loader)).rejects.toThrow(/template/);
  });
});
