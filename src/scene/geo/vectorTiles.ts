import { PbfReader } from 'pbf';
import { VectorTile, classifyRings } from '@mapbox/vector-tile';
import { tileToLonLat } from './mercator.js';

/**
 * Building footprints from OpenStreetMap, via OpenFreeMap's vector
 * tiles.
 *
 * Everything numeric in here was measured before it was written down
 * (2026-08-29, planet build 20260823):
 *
 *  - the planet is served to z14 with CORS `*`, no key, production
 *    use explicitly welcomed;
 *  - the tile URL carries a dated path segment, so the template MUST
 *    be resolved from the TileJSON at runtime — a hardcoded URL dies
 *    at the next planet rebuild;
 *  - `render_height` was present on 100% of the probed features
 *    (Rome, Milan, Hiroshima): real where OSM tags it, a schema
 *    default elsewhere — always a number, honest to the metre only
 *    where mapped;
 *  - at z14 buildings arrive MERGED per block as multipolygons, so a
 *    "building" for us is one outer ring, carrying its block's height;
 *  - geometry is clipped to the tile plus a 64/4096 buffer — about
 *    28 m of overlap on every side. A building straddling a border
 *    therefore exists in BOTH tiles, and drawing both copies z-fights.
 *    Rings are re-clipped here to the tile proper so neighbours meet
 *    at a shared plane instead of overlapping, and the walls born on
 *    that cut are flagged so the extruder can skip them: the cut is
 *    interior to the building, and a wall there would be a fake facade
 *    through its middle.
 */

/** The one zoom with per-block footprints; also the source's ceiling. */
export const BUILDING_ZOOM = 14;

/** ODbL requires this to ship wherever the footprints render. */
export const OSM_ATTRIBUTION = '© OpenStreetMap contributors · OpenFreeMap';

const TILEJSON_URL = 'https://tiles.openfreemap.org/planet';

/** Schema default when OSM has no height tag at all. */
const DEFAULT_HEIGHT_M = 8;
/** Sanity clamp: taller than anything real is a data error, not a fact. */
const MAX_HEIGHT_M = 350;

export interface RingPoint {
  readonly lon: number;
  readonly lat: number;
}

export interface BuildingRing {
  /** Open ring: last point connects back to the first. */
  readonly points: readonly RingPoint[];
  /**
   * walls[i] covers the edge points[i] → points[(i+1) % n].
   * False exactly where the ring was cut on the tile border.
   */
  readonly walls: readonly boolean[];
}

export interface BuildingFootprint {
  readonly outer: BuildingRing;
  readonly holes: readonly BuildingRing[];
  readonly heightMeters: number;
  /** Non-zero for bridges and skyways: the walls start up here. */
  readonly minHeightMeters: number;
}

export interface TileRef {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** Injectable so tests need neither a network nor a browser. */
export type BinaryLoader = (url: string) => Promise<ArrayBuffer>;

export const defaultBinaryLoader: BinaryLoader = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`vectorTiles: ${url} answered ${String(response.status)}`);
  }
  return response.arrayBuffer();
};

// ---- clipping ------------------------------------------------------

interface XY {
  x: number;
  y: number;
}

/**
 * Sutherland-Hodgman against one axis-aligned half-plane.
 * `keep(p)` is true on the inside; `cut(a, b)` returns the crossing.
 */
function clipHalfPlane(
  ring: readonly XY[],
  keep: (p: XY) => boolean,
  cut: (a: XY, b: XY) => XY
): XY[] {
  const out: XY[] = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    if (a === undefined || b === undefined) continue;
    const ka = keep(a);
    const kb = keep(b);
    if (ka) out.push(a);
    if (ka !== kb) out.push(cut(a, b));
  }
  return out;
}

/** Clip a ring to [0, extent]². May return fewer than 3 points. */
export function clipRingToTile(ring: readonly XY[], extent: number): XY[] {
  const lerp = (a: XY, b: XY, t: number): XY => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  });
  let r: XY[] = [...ring];
  r = clipHalfPlane(
    r,
    (p) => p.x >= 0,
    (a, b) => lerp(a, b, (0 - a.x) / (b.x - a.x))
  );
  r = clipHalfPlane(
    r,
    (p) => p.x <= extent,
    (a, b) => lerp(a, b, (extent - a.x) / (b.x - a.x))
  );
  r = clipHalfPlane(
    r,
    (p) => p.y >= 0,
    (a, b) => lerp(a, b, (0 - a.y) / (b.y - a.y))
  );
  r = clipHalfPlane(
    r,
    (p) => p.y <= extent,
    (a, b) => lerp(a, b, (extent - a.y) / (b.y - a.y))
  );
  return r;
}

/** An edge whose endpoints both sit on the same tile border is a cut. */
function isBorderEdge(a: XY, b: XY, extent: number): boolean {
  const eps = 1e-6;
  return (
    (Math.abs(a.x) < eps && Math.abs(b.x) < eps) ||
    (Math.abs(a.x - extent) < eps && Math.abs(b.x - extent) < eps) ||
    (Math.abs(a.y) < eps && Math.abs(b.y) < eps) ||
    (Math.abs(a.y - extent) < eps && Math.abs(b.y - extent) < eps)
  );
}

// ---- decoding ------------------------------------------------------

function asHeight(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, MAX_HEIGHT_M);
}

/**
 * Tile coords → an open ring in degrees, with per-edge wall flags.
 * Returns null when clipping leaves nothing worth extruding.
 */
function toRing(raw: readonly XY[], extent: number, tile: TileRef): BuildingRing | null {
  const clipped = clipRingToTile(raw, extent);
  // Drop consecutive duplicates (clipping creates them on corners),
  // and a closing point identical to the first.
  const pts: XY[] = [];
  for (const p of clipped) {
    const last = pts[pts.length - 1];
    if (last !== undefined && Math.abs(last.x - p.x) < 1e-9 && Math.abs(last.y - p.y) < 1e-9) {
      continue;
    }
    pts.push(p);
  }
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (
    pts.length > 1 &&
    first !== undefined &&
    last !== undefined &&
    Math.abs(first.x - last.x) < 1e-9 &&
    Math.abs(first.y - last.y) < 1e-9
  ) {
    pts.pop();
  }
  if (pts.length < 3) return null;

  const points = pts.map((p) => {
    const g = tileToLonLat(tile.x + p.x / extent, tile.y + p.y / extent, tile.z);
    return { lon: g.lon, lat: g.lat };
  });
  const walls = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    return q === undefined ? false : !isBorderEdge(p, q, extent);
  });
  return { points, walls };
}

/**
 * Decode one tile's building layer into per-ring footprints.
 * A tile with no building layer — open ocean, desert, tundra — is an
 * empty list, never an error: buildings are an addition, not a
 * dependency.
 */
export function decodeBuildingTile(buffer: ArrayBuffer, tile: TileRef): BuildingFootprint[] {
  const decoded = new VectorTile(new PbfReader(new Uint8Array(buffer)));
  const layer = decoded.layers.building;
  if (layer === undefined) return [];

  const out: BuildingFootprint[] = [];
  for (let i = 0; i < layer.length; i++) {
    const feature = layer.feature(i);
    if (feature.type !== 3) continue; // polygons only
    const height = asHeight(feature.properties.render_height, DEFAULT_HEIGHT_M);
    const minHeight = Math.min(
      Math.max(asHeight(feature.properties.render_min_height, 0), 0),
      height
    );
    // classifyRings groups an outer ring with the holes that belong to
    // it — the winding bookkeeping the MVT spec defines and nobody
    // should re-derive.
    for (const polygon of classifyRings(feature.loadGeometry())) {
      const rawOuter = polygon[0];
      if (rawOuter === undefined) continue;
      const outer = toRing(rawOuter, feature.extent, tile);
      if (outer === null) continue;
      const holes: BuildingRing[] = [];
      for (let h = 1; h < polygon.length; h++) {
        const rawHole = polygon[h];
        if (rawHole === undefined) continue;
        const hole = toRing(rawHole, feature.extent, tile);
        if (hole !== null) holes.push(hole);
      }
      out.push({ outer, holes, heightMeters: height, minHeightMeters: minHeight });
    }
  }
  return out;
}

// ---- fetching ------------------------------------------------------

let templateTask: Promise<string> | null = null;

/**
 * Resolve the tile URL template from the TileJSON, once per session.
 * The dated path segment inside it is exactly why this cannot be a
 * constant.
 */
export function tileTemplate(load: BinaryLoader = defaultBinaryLoader): Promise<string> {
  templateTask ??= (async (): Promise<string> => {
    const raw = await load(TILEJSON_URL);
    const json: unknown = JSON.parse(new TextDecoder().decode(raw));
    const tiles = (json as { tiles?: unknown }).tiles;
    const first = Array.isArray(tiles) ? (tiles as unknown[])[0] : undefined;
    if (typeof first !== 'string' || !first.includes('{z}')) {
      throw new Error('vectorTiles: TileJSON carries no usable tile template');
    }
    return first;
  })();
  // A failed resolve must not wedge the session on a transient error.
  templateTask.catch(() => {
    templateTask = null;
  });
  return templateTask;
}

/** Test hook: forget the cached template. */
export function resetTileTemplate(): void {
  templateTask = null;
}

/**
 * Decoded tiles, most-recently-used last. One site is ~15 tiles; the
 * cap keeps a session that hops between presets from accumulating
 * every city it ever visited.
 */
const CACHE_LIMIT = 48;
const cache = new Map<string, Promise<BuildingFootprint[]>>();

export async function loadBuildingTile(
  tile: TileRef,
  load: BinaryLoader = defaultBinaryLoader
): Promise<BuildingFootprint[]> {
  const key = `${String(tile.z)}/${String(tile.x)}/${String(tile.y)}`;
  const hit = cache.get(key);
  if (hit !== undefined) {
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  const task = (async (): Promise<BuildingFootprint[]> => {
    const template = await tileTemplate(load);
    const url = template
      .replace('{z}', String(tile.z))
      .replace('{x}', String(tile.x))
      .replace('{y}', String(tile.y));
    return decodeBuildingTile(await load(url), tile);
  })();
  cache.set(key, task);
  task.catch(() => cache.delete(key));
  while (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next();
    if (oldest.done === true) break;
    cache.delete(oldest.value);
  }
  return task;
}
