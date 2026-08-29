import { describe, expect, it } from 'vitest';
import {
  WALL_SKIRT_KM,
  extrudeBuildings,
  mergeMeshes,
  reverseRing,
  signedArea2,
  type BuildingMesh,
  type LocalBuilding,
  type LocalRing,
} from './extrude.js';

const ring = (
  points: readonly (readonly [number, number])[],
  walls?: readonly boolean[]
): LocalRing => ({
  points,
  walls: walls ?? points.map(() => true),
});

/** 10 m square, counter-clockwise, 10 m tall. */
const square = (height = 0.01): LocalBuilding => ({
  outer: ring([
    [0, 0],
    [0.01, 0],
    [0.01, 0.01],
    [0, 0.01],
  ]),
  holes: [],
  baseKm: 0,
  heightKm: height,
  minHeightKm: 0,
});

const vert = (m: BuildingMesh, i: number): [number, number, number] => [
  m.positions[i * 3] ?? NaN,
  m.positions[i * 3 + 1] ?? NaN,
  m.positions[i * 3 + 2] ?? NaN,
];
const normal = (m: BuildingMesh, i: number): [number, number, number] => [
  (m.normals[i * 4] ?? 0) / 127,
  (m.normals[i * 4 + 1] ?? 0) / 127,
  (m.normals[i * 4 + 2] ?? 0) / 127,
];
const part = (m: BuildingMesh, i: number): number => m.normals[i * 4 + 3] ?? -1;

/** cross(b-a, c-a) — the face normal direction of triangle (a, b, c). */
function faceNormal(
  a: [number, number, number],
  b: [number, number, number],
  c: [number, number, number]
): [number, number, number] {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  return [
    (u[1] ?? 0) * (v[2] ?? 0) - (u[2] ?? 0) * (v[1] ?? 0),
    (u[2] ?? 0) * (v[0] ?? 0) - (u[0] ?? 0) * (v[2] ?? 0),
    (u[0] ?? 0) * (v[1] ?? 0) - (u[1] ?? 0) * (v[0] ?? 0),
  ];
}

function eachTriangle(m: BuildingMesh, visit: (ia: number, ib: number, ic: number) => void): void {
  for (let t = 0; t < m.indices.length; t += 3) {
    visit(m.indices[t] ?? 0, m.indices[t + 1] ?? 0, m.indices[t + 2] ?? 0);
  }
}

describe('extrudeBuildings', () => {
  it('turns a square into four walls and a roof, with the skirt below grade', () => {
    const m = extrudeBuildings([square()]);
    // 4 walls x 4 verts + 4 roof verts; 4 walls x 2 tris + 2 roof tris.
    expect(m.vertexCount).toBe(20);
    expect(m.triangleCount).toBe(10);
    expect(m.buildingCount).toBe(1);
    for (let i = 0; i < m.vertexCount; i++) {
      const [, y] = vert(m, i);
      if (part(m, i) > 0) expect(y).toBeCloseTo(0.01, 9);
      else if (y < 0) expect(y).toBeCloseTo(-WALL_SKIRT_KM, 6);
      else expect(y).toBeCloseTo(0.01, 6);
    }
  });

  it('winds every triangle to agree with its stored normal', () => {
    // The invariant that lets the renderer cull back faces: for every
    // triangle, cross(b-a, c-a) points the way the vertex normal says.
    const m = extrudeBuildings([square()]);
    eachTriangle(m, (ia, ib, ic) => {
      const f = faceNormal(vert(m, ia), vert(m, ib), vert(m, ic));
      const n = normal(m, ia);
      const dot = f[0] * n[0] + f[1] * n[1] + f[2] * n[2];
      expect(dot).toBeGreaterThan(0);
    });
  });

  it('points wall normals away from the footprint centre', () => {
    const m = extrudeBuildings([square()]);
    for (let i = 0; i < m.vertexCount; i++) {
      if (part(m, i) > 0) continue;
      const [x, , z] = vert(m, i);
      const n = normal(m, i);
      expect(n[1]).toBe(0);
      // Outward: the normal agrees with centre → vertex.
      expect(n[0] * (x - 0.005) + n[2] * (z - 0.005)).toBeGreaterThanOrEqual(0);
    }
  });

  it('produces identical facades whichever way the source ring winds', () => {
    const ccw = extrudeBuildings([square()]);
    const cw: LocalBuilding = {
      ...square(),
      outer: ring([
        [0, 0.01],
        [0.01, 0.01],
        [0.01, 0],
        [0, 0],
      ]),
    };
    const m = extrudeBuildings([cw]);
    expect(m.vertexCount).toBe(ccw.vertexCount);
    eachTriangle(m, (ia, ib, ic) => {
      const f = faceNormal(vert(m, ia), vert(m, ib), vert(m, ic));
      const n = normal(m, ia);
      expect(f[0] * n[0] + f[1] * n[1] + f[2] * n[2]).toBeGreaterThan(0);
    });
  });

  it('faces courtyard walls into the courtyard and pierces the roof', () => {
    const b: LocalBuilding = {
      ...square(),
      holes: [
        ring([
          [0.004, 0.004],
          [0.006, 0.004],
          [0.006, 0.006],
          [0.004, 0.006],
        ]),
      ],
    };
    const m = extrudeBuildings([b]);
    // 8 walls x 2 + roof: 8 ring verts, earcut on a square ring with a
    // square hole gives 8 triangles.
    expect(m.triangleCount).toBe(16 + 8);
    for (let i = 0; i < m.vertexCount; i++) {
      if (part(m, i) > 0) continue;
      const [x, , z] = vert(m, i);
      const inner = x > 0.003 && x < 0.007 && z > 0.003 && z < 0.007;
      if (!inner) continue;
      const n = normal(m, i);
      // Courtyard facade: normal looks at the courtyard centre.
      expect(n[0] * (0.005 - x) + n[2] * (0.005 - z)).toBeGreaterThan(-1e-9);
    }
  });

  it('drops the wall on a tile cut but keeps the roof whole', () => {
    const cut: LocalBuilding = {
      ...square(),
      outer: ring(
        [
          [0, 0],
          [0.01, 0],
          [0.01, 0.01],
          [0, 0.01],
        ],
        [true, true, true, false]
      ),
    };
    const m = extrudeBuildings([cut]);
    expect(m.vertexCount).toBe(12 + 4); // one wall of four gone
    expect(m.triangleCount).toBe(6 + 2);
  });

  it('starts bridge walls at min height, without a skirt', () => {
    const bridge: LocalBuilding = { ...square(), minHeightKm: 0.004 };
    const m = extrudeBuildings([bridge]);
    let lowest = Infinity;
    for (let i = 0; i < m.vertexCount; i++) {
      const [, y] = vert(m, i);
      if (y < lowest) lowest = y;
    }
    expect(lowest).toBeCloseTo(0.004, 9);
  });

  it('spends the triangle budget largest-first and reports the refusals', () => {
    const m = extrudeBuildings([square(), square()], 4);
    expect(m.buildingCount).toBe(1);
    expect(m.dropped).toBe(1);
  });

  it('skips degenerate rings without throwing', () => {
    const bad: LocalBuilding = {
      ...square(),
      outer: ring([
        [0, 0],
        [0.01, 0],
      ]),
    };
    const m = extrudeBuildings([bad]);
    expect(m.buildingCount).toBe(0);
    expect(m.triangleCount).toBe(0);
  });
});

describe('reverseRing', () => {
  it('keeps each wall flag glued to its geometric edge', () => {
    // One missing wall between two known points; after reversal, the
    // edge between those SAME two points must still be the missing one.
    const r = ring(
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
      [true, false, true, true] // (1,0) → (1,1) has no wall
    );
    const rev = reverseRing(r);
    expect(signedArea2(rev.points)).toBeCloseTo(-signedArea2(r.points), 12);
    const n = rev.points.length;
    for (let i = 0; i < n; i++) {
      const a = rev.points[i];
      const b = rev.points[(i + 1) % n];
      if (a === undefined || b === undefined) continue;
      const isTheEdge =
        Math.min(a[0], b[0]) === 1 && Math.min(a[1], b[1]) === 0 && Math.max(a[1], b[1]) === 1;
      expect(rev.walls[i]).toBe(!isTheEdge);
    }
  });
});

describe('mergeMeshes', () => {
  it('offsets indices and building ids so parts stay distinct', () => {
    const a = extrudeBuildings([square()]);
    const b = extrudeBuildings([square()]);
    const merged = mergeMeshes([a, b]);
    expect(merged.vertexCount).toBe(a.vertexCount * 2);
    expect(merged.triangleCount).toBe(a.triangleCount * 2);
    expect(merged.buildingCount).toBe(2);
    expect(merged.ids[a.vertexCount] ?? -1).toBe(1);
    let max = 0;
    for (const i of merged.indices) max = Math.max(max, i);
    expect(max).toBe(merged.vertexCount - 1);
  });
});
