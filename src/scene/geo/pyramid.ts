import type { TileBlock } from './mercator.js';
import { tileBlockAround, tileToLonLat } from './mercator.js';

/**
 * Which blocks of imagery the renderer should be holding right now.
 *
 * The pyramid follows the CAMERA, not the event. That is the whole
 * point of this module, and it is worth being explicit about why,
 * because the obvious arrangement is the wrong one.
 *
 * Centring every level on ground zero looks reasonable — that is
 * where the viewer is looking — but it cannot be sharp. Sharpness is
 * bounded by how many pixels a block has: covering a two-kilometre
 * radius at half a metre per pixel needs an eight-thousand-pixel
 * square, a quarter of a gigabyte for one level. So the sharp levels
 * have to be small, and small blocks centred on ground zero are
 * invisible the moment the camera backs off far enough to see the
 * event at all.
 *
 * What actually decides the sharpness a pixel needs is its distance
 * from the CAMERA, not from the explosion. Anchoring the levels there
 * puts the small sharp block exactly where the small sharp pixels
 * are, and the coarse levels — which are cheap per unit of ground —
 * take the distance. Total memory stays fixed while the ground under
 * the viewer stays at the source's native resolution.
 */
export interface PyramidLevel {
  /** 0 is the sharpest. Matches the renderer's array-texture slot. */
  readonly level: number;
  readonly zoom: number;
  readonly block: TileBlock;
  /**
   * Centre of the block, in degrees.
   *
   * Requests are addressed by this rather than by the camera's own
   * position: the camera moves continuously, the block moves in
   * whole-tile jumps, and keying the cache on a continuous value
   * would make every frame a cache miss for the same four tiles.
   */
  readonly latitude: number;
  readonly longitude: number;
  /** Stable identity of the block, for spotting what actually changed. */
  readonly key: string;
}

export interface PyramidRequest {
  /** Where the camera is, in degrees — not where the event is. */
  readonly latitude: number;
  readonly longitude: number;
  /** Zoom of the sharpest level. */
  readonly zoomFine: number;
  /** Zoom levels between one pyramid level and the next. */
  readonly step: number;
  /** Slots the renderer has. */
  readonly levels: number;
  /** Block side, in tiles. */
  readonly tiles: number;
  /** Stop once a level is at least this coarse; the skyline needs no more. */
  readonly zoomCoarse: number;
}

/**
 * The levels to hold for one camera position.
 *
 * Levels run sharpest first and one `step` apart, because the pixel
 * footprint grows linearly with distance while one zoom step doubles
 * the ground a block covers: a wider step leaves a band where the
 * pixel has outrun the data, which is exactly what a blurry middle
 * distance is.
 */
export function planPyramid(request: PyramidRequest): PyramidLevel[] {
  const { latitude, longitude, tiles } = request;
  const step = Math.max(1, Math.round(request.step));
  const levels: PyramidLevel[] = [];

  for (let level = 0; level < request.levels; level++) {
    const zoom = request.zoomFine - level * step;
    if (zoom < 0) break;
    const block = tileBlockAround(longitude, latitude, zoom, tiles);
    // The block's own centre, so the same block always asks the same
    // question however the camera drifted inside it.
    const nw = tileToLonLat(block.x0, block.y0, zoom);
    const se = tileToLonLat(block.x0 + block.tiles, block.y0 + block.tiles, zoom);
    levels.push({
      level,
      zoom,
      block,
      latitude: (nw.lat + se.lat) / 2,
      longitude: (nw.lon + se.lon) / 2,
      key: `${String(zoom)}/${String(block.x0)}/${String(block.y0)}/${String(block.tiles)}`,
    });
    if (zoom <= request.zoomCoarse) break;
  }

  return levels;
}

/**
 * Levels whose block has changed since the last plan.
 *
 * Orbiting drags the sharpest level across a new block every few
 * metres while the coarsest has not moved in a hundred kilometres, so
 * re-fetching the whole pyramid on every camera nudge would spend
 * hundreds of requests to replace four tiles.
 */
export function changedLevels(
  plan: readonly PyramidLevel[],
  loaded: ReadonlyMap<number, string>
): PyramidLevel[] {
  return plan.filter((entry) => loaded.get(entry.level) !== entry.key);
}
