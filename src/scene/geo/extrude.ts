import earcut from 'earcut';

/**
 * Footprints → triangles, in the local scene frame (km east, km up,
 * km north). Pure geometry: no GL, no network, no degrees — which is
 * what makes every branch of it unit-testable.
 *
 * Conventions, enforced rather than assumed:
 *  - outer rings are normalised to counter-clockwise seen from above
 *    (+y), holes to clockwise, whatever winding the data arrived in;
 *  - wall indices wind counter-clockwise seen from OUTSIDE the solid,
 *    so back-face culling is free to drop the interior;
 *  - roof triangles are flipped where earcut hands them face-down.
 *
 * Walls carry a skirt: the bottom edge sits WALL_SKIRT_KM below the
 * sampled base, because the base is read from one DEM level at one
 * point while the shader drapes the ground from whichever level is
 * finest right now — metres of daylight between the two would show as
 * floating houses on every slope. Bridges (minHeight > 0) get no
 * skirt: their whole point is the gap underneath.
 */

export const WALL_SKIRT_KM = 0.006;

export interface LocalRing {
  /** Open ring of [east km, north km] pairs. */
  readonly points: readonly (readonly [number, number])[];
  /** walls[i] covers points[i] → points[(i+1) % n]; false on tile cuts. */
  readonly walls: readonly boolean[];
}

export interface LocalBuilding {
  readonly outer: LocalRing;
  readonly holes: readonly LocalRing[];
  /** Terrain elevation at the footprint, km, in the scene's datum. */
  readonly baseKm: number;
  readonly heightKm: number;
  readonly minHeightKm: number;
}

export interface BuildingMesh {
  /** 3 floats per vertex: east, up, north — km. */
  readonly positions: Float32Array;
  /** 4 normalised bytes per vertex: nx, ny, nz, part (0 wall, 127 roof). */
  readonly normals: Int8Array;
  /** 1 float per vertex: index of the building it belongs to. */
  readonly ids: Float32Array;
  readonly indices: Uint32Array;
  readonly vertexCount: number;
  readonly triangleCount: number;
  readonly buildingCount: number;
  /** Buildings the triangle budget refused. */
  readonly dropped: number;
}

/** Twice the signed area; positive = counter-clockwise seen from +y. */
export function signedArea2(points: readonly (readonly [number, number])[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    if (a === undefined || b === undefined) continue;
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum;
}

/**
 * Reverse a ring, keeping each wall flag glued to its edge.
 * Edge i of the reversed ring is edge (n-2-i mod n) of the original,
 * walked backwards — off-by-ones here surface as missing facades, so
 * this is pinned by its own test.
 */
export function reverseRing(ring: LocalRing): LocalRing {
  const n = ring.points.length;
  const points = [...ring.points].reverse();
  const walls = points.map((_, i) => ring.walls[(2 * n - 2 - i) % n] ?? true);
  return { points, walls };
}

function orient(ring: LocalRing, counterClockwise: boolean): LocalRing {
  const ccw = signedArea2(ring.points) > 0;
  return ccw === counterClockwise ? ring : reverseRing(ring);
}

interface Sink {
  pos: number[];
  nrm: number[];
  ids: number[];
  idx: number[];
  vertices: number;
  triangles: number;
}

function pushVertex(
  sink: Sink,
  x: number,
  y: number,
  z: number,
  nx: number,
  ny: number,
  nz: number,
  part: number,
  id: number
): number {
  sink.pos.push(x, y, z);
  sink.nrm.push(Math.round(nx * 127), Math.round(ny * 127), Math.round(nz * 127), part);
  sink.ids.push(id);
  return sink.vertices++;
}

function extrudeWalls(sink: Sink, ring: LocalRing, bottom: number, top: number, id: number): void {
  const n = ring.points.length;
  for (let i = 0; i < n; i++) {
    if (ring.walls[i] !== true) continue;
    const p = ring.points[i];
    const q = ring.points[(i + 1) % n];
    if (p === undefined || q === undefined) continue;
    const dx = q[0] - p[0];
    const dz = q[1] - p[1];
    const len = Math.hypot(dx, dz);
    if (len < 1e-9) continue;
    // Outward for a CCW outer ring; the same formula points INTO a
    // courtyard for a CW hole, which is where that wall faces.
    const nx = dz / len;
    const nz = -dx / len;
    const a = pushVertex(sink, p[0], bottom, p[1], nx, 0, nz, 0, id);
    const b = pushVertex(sink, q[0], bottom, q[1], nx, 0, nz, 0, id);
    const c = pushVertex(sink, q[0], top, q[1], nx, 0, nz, 0, id);
    const d = pushVertex(sink, p[0], top, p[1], nx, 0, nz, 0, id);
    // Wound so cross(v1-v0, v2-v0) agrees with the outward normal —
    // the invariant the tests assert on every wall.
    sink.idx.push(a, c, b, a, d, c);
    sink.triangles += 2;
  }
}

function extrudeRoof(sink: Sink, building: LocalBuilding, top: number, id: number): void {
  const rings = [building.outer, ...building.holes];
  const flat: number[] = [];
  const holeStarts: number[] = [];
  for (let r = 0; r < rings.length; r++) {
    const ring = rings[r];
    if (ring === undefined) continue;
    if (r > 0) holeStarts.push(flat.length / 2);
    for (const p of ring.points) flat.push(p[0], p[1]);
  }
  const tris = earcut(flat, holeStarts.length > 0 ? holeStarts : null, 2);

  const base = sink.vertices;
  for (let v = 0; v < flat.length; v += 2) {
    pushVertex(sink, flat[v] ?? 0, top, flat[v + 1] ?? 0, 0, 1, 0, 127, id);
  }
  for (let t = 0; t < tris.length; t += 3) {
    const ia = tris[t];
    const ib = tris[t + 1];
    const ic = tris[t + 2];
    if (ia === undefined || ib === undefined || ic === undefined) continue;
    const ax = flat[ia * 2] ?? 0;
    const az = flat[ia * 2 + 1] ?? 0;
    const bx = flat[ib * 2] ?? 0;
    const bz = flat[ib * 2 + 1] ?? 0;
    const cx = flat[ic * 2] ?? 0;
    const cz = flat[ic * 2 + 1] ?? 0;
    // Face the sky: cross(b-a, c-a).y > 0. Earcut's output winding
    // follows its input's, which we did not promise it.
    const up = (bz - az) * (cx - ax) - (bx - ax) * (cz - az);
    if (up > 0) sink.idx.push(base + ia, base + ib, base + ic);
    else sink.idx.push(base + ia, base + ic, base + ib);
    sink.triangles++;
  }
}

/**
 * Extrude buildings, in the order given, until the triangle budget is
 * spent. Callers sort largest-first so the budget trims garden sheds,
 * not cathedrals.
 */
export function extrudeBuildings(
  buildings: readonly LocalBuilding[],
  maxTriangles = 1_500_000
): BuildingMesh {
  const sink: Sink = { pos: [], nrm: [], ids: [], idx: [], vertices: 0, triangles: 0 };
  let built = 0;
  let dropped = 0;

  for (const raw of buildings) {
    if (sink.triangles >= maxTriangles) {
      dropped++;
      continue;
    }
    const outer = orient(raw.outer, true);
    if (outer.points.length < 3) continue;
    const holes = raw.holes.map((h) => orient(h, false)).filter((h) => h.points.length >= 3);
    const building: LocalBuilding = { ...raw, outer, holes };

    const top = raw.baseKm + raw.heightKm;
    const bottom = raw.minHeightKm > 0 ? raw.baseKm + raw.minHeightKm : raw.baseKm - WALL_SKIRT_KM;
    const id = built;
    extrudeWalls(sink, outer, bottom, top, id);
    for (const hole of holes) extrudeWalls(sink, hole, bottom, top, id);
    extrudeRoof(sink, building, top, id);
    built++;
  }

  return {
    positions: new Float32Array(sink.pos),
    normals: new Int8Array(sink.nrm),
    ids: new Float32Array(sink.ids),
    indices: new Uint32Array(sink.idx),
    vertexCount: sink.vertices,
    triangleCount: sink.triangles,
    buildingCount: built,
    dropped,
  };
}

/**
 * Concatenate partial meshes into one. The orchestrator extrudes in
 * slices between frames so a dense city never blocks the main thread;
 * the GPU still wants a single buffer and a single draw.
 */
export function mergeMeshes(parts: readonly BuildingMesh[]): BuildingMesh {
  let vertices = 0;
  let triangles = 0;
  let buildings = 0;
  let dropped = 0;
  for (const p of parts) {
    vertices += p.vertexCount;
    triangles += p.triangleCount;
    buildings += p.buildingCount;
    dropped += p.dropped;
  }
  const positions = new Float32Array(vertices * 3);
  const normals = new Int8Array(vertices * 4);
  const ids = new Float32Array(vertices);
  const indices = new Uint32Array(triangles * 3);
  let vo = 0;
  let io = 0;
  let idOffset = 0;
  for (const p of parts) {
    positions.set(p.positions, vo * 3);
    normals.set(p.normals, vo * 4);
    for (let i = 0; i < p.vertexCount; i++) {
      ids[vo + i] = (p.ids[i] ?? 0) + idOffset;
    }
    for (let i = 0; i < p.indices.length; i++) {
      indices[io + i] = (p.indices[i] ?? 0) + vo;
    }
    vo += p.vertexCount;
    io += p.indices.length;
    idOffset += p.buildingCount;
  }
  return {
    positions,
    normals,
    ids,
    indices,
    vertexCount: vertices,
    triangleCount: triangles,
    buildingCount: buildings,
    dropped,
  };
}
