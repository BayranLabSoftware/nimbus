/**
 * Web-Mercator tile arithmetic and the local-frame ↔ geographic
 * mapping the impact renderer needs.
 *
 * All of it is pure: no fetch, no canvas, no WebGL. The IO layer that
 * actually pulls tiles lives in `tileMosaic.ts` and calls into here,
 * so every coordinate decision in the renderer can be unit-tested in
 * Node without a browser.
 *
 * Conventions, fixed here once so nothing downstream has to guess:
 *   - Tile grid is XYZ / "slippy map": x eastward from −180°, y
 *     southward from +85.0511°, both 0-based, 2^z per side.
 *   - Local scene frame is metres, right-handed, ORIGIN AT GROUND
 *     ZERO: +x east, +y up, +z north.
 *   - Latitude is clamped to ±85.0511° (the Mercator cut-off) rather
 *     than allowed to run off to infinity.
 *
 * References:
 *   OGC 07-057r7 (WMTS 1.0), Annex E — WebMercatorQuad.
 *   EPSG:3857 definition; Snyder, J. P. (1987), USGS PP 1395, §7.
 */

/** Mercator latitude cut-off: the projection is square at this value. */
export const MERCATOR_MAX_LAT = 85.05112877980659;

/** Equatorial circumference, WGS-84 semi-major axis a = 6 378 137 m. */
export const EQUATORIAL_CIRCUMFERENCE_M = 2 * Math.PI * 6_378_137;

/** Mean-Earth metres per degree of latitude (spherical, R = 6 371 008 m).
 *  Matches `stadiumPolygon.ts` so the two never disagree by a metre. */
export const METERS_PER_DEG_LAT = (Math.PI * 6_371_008) / 180;

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

const clampLat = (lat: number): number =>
  Math.min(Math.max(lat, -MERCATOR_MAX_LAT), MERCATOR_MAX_LAT);

/** Mercator northing for a latitude, in the natural (unscaled) units
 *  `ln(tan(π/4 + φ/2))`. Used for the vertical texture mapping. */
export function mercatorY(latDeg: number): number {
  const lat = clampLat(latDeg) * RAD;
  return Math.log(Math.tan(Math.PI / 4 + lat / 2));
}

/** Inverse of {@link mercatorY}. */
export function inverseMercatorY(y: number): number {
  return Math.atan(Math.sinh(y)) * DEG;
}

export interface TileCoord {
  readonly x: number;
  readonly y: number;
}

/** Fractional tile coordinates of a geographic point at zoom `z`. */
export function lonLatToTile(lonDeg: number, latDeg: number, z: number): TileCoord {
  const n = 2 ** z;
  const x = ((lonDeg + 180) / 360) * n;
  const y = (0.5 - mercatorY(latDeg) / (2 * Math.PI)) * n;
  return { x, y };
}

/** North-west corner of a tile, in degrees. */
export function tileToLonLat(x: number, y: number, z: number): { lon: number; lat: number } {
  const n = 2 ** z;
  return {
    lon: (x / n) * 360 - 180,
    lat: inverseMercatorY(Math.PI * (1 - (2 * y) / n)),
  };
}

/** Ground width of one tile at a given latitude and zoom, in metres. */
export function tileSpanMeters(latDeg: number, z: number): number {
  return (EQUATORIAL_CIRCUMFERENCE_M * Math.cos(clampLat(latDeg) * RAD)) / 2 ** z;
}

/**
 * Largest zoom whose `tiles × tiles` block still covers `spanMeters`
 * of ground at this latitude — i.e. the sharpest mosaic that fits.
 * Clamped to [0, maxZoom] so a very small span cannot ask a provider
 * for a level it does not serve.
 */
export function zoomForSpan(
  latDeg: number,
  spanMeters: number,
  tiles: number,
  maxZoom = 16
): number {
  if (!(spanMeters > 0) || !(tiles > 0)) return 0;
  const ratio =
    (tiles * EQUATORIAL_CIRCUMFERENCE_M * Math.cos(clampLat(latDeg) * RAD)) / spanMeters;
  if (!(ratio > 1)) return 0;
  return Math.min(maxZoom, Math.max(0, Math.floor(Math.log2(ratio))));
}

export interface MosaicBounds {
  readonly lonWest: number;
  readonly lonEast: number;
  readonly latNorth: number;
  readonly latSouth: number;
}

export interface TileBlock {
  readonly z: number;
  /** Tile x of the north-west corner. */
  readonly x0: number;
  /** Tile y of the north-west corner. */
  readonly y0: number;
  /** Side length of the block, in tiles. */
  readonly tiles: number;
  readonly bounds: MosaicBounds;
}

/**
 * The `tiles × tiles` block centred (as nearly as the grid allows) on
 * a point, with the geographic bounds it actually covers. Tile indices
 * are clamped into the valid range so a request near a pole or the
 * antimeridian degrades instead of asking for tile −1.
 */
export function tileBlockAround(
  lonDeg: number,
  latDeg: number,
  z: number,
  tiles: number
): TileBlock {
  const n = 2 ** z;
  // Never ask for more tiles than the grid has: at low zoom a 6x6
  // request would reach for tiles that do not exist and come back as
  // holes. Clamping here keeps the world-covering case honest.
  const side = Math.min(Math.max(1, Math.floor(tiles)), n);
  const c = lonLatToTile(lonDeg, latDeg, z);
  const x0 = Math.min(Math.max(Math.floor(c.x - side / 2), 0), Math.max(0, n - side));
  const y0 = Math.min(Math.max(Math.floor(c.y - side / 2), 0), Math.max(0, n - side));
  const nw = tileToLonLat(x0, y0, z);
  const se = tileToLonLat(x0 + side, y0 + side, z);
  return {
    z,
    x0,
    y0,
    tiles: side,
    bounds: { lonWest: nw.lon, lonEast: se.lon, latNorth: nw.lat, latSouth: se.lat },
  };
}

/**
 * Texture coordinates of a geographic point inside a mosaic. `u` is
 * linear in longitude; `v` goes through the Mercator northing, which
 * is what makes the imagery line up with the terrain instead of
 * drifting north-south across the tile block.
 */
export function geoToMosaicUV(
  lonDeg: number,
  latDeg: number,
  bounds: MosaicBounds
): { u: number; v: number } {
  const lonSpan = bounds.lonEast - bounds.lonWest;
  const u = lonSpan === 0 ? 0 : (lonDeg - bounds.lonWest) / lonSpan;
  const north = mercatorY(bounds.latNorth);
  const south = mercatorY(bounds.latSouth);
  const span = north - south;
  const v = span === 0 ? 0 : (north - mercatorY(latDeg)) / span;
  return { u, v };
}

/**
 * Local scene frame (metres east / north of ground zero) to geographic
 * degrees. The longitude scale is taken at the DESTINATION latitude,
 * not the origin's: over a Chicxulub-scale frame the two differ by
 * enough to shear the coastline visibly.
 */
export function localToGeo(
  eastM: number,
  northM: number,
  lat0Deg: number,
  lon0Deg: number
): { lon: number; lat: number } {
  const lat = lat0Deg + northM / METERS_PER_DEG_LAT;
  const cos = Math.max(Math.cos(clampLat(lat) * RAD), 1e-6);
  return { lon: lon0Deg + eastM / (METERS_PER_DEG_LAT * cos), lat };
}

/**
 * Great-circle distance between two points, in metres, via the
 * haversine formula.
 *
 * NOT `acos(dot(n1, n2)) · R`. That form loses catastrophically for
 * short separations: the dot product approaches 1, the subtraction
 * inside `acos` cancels, and in 32-bit arithmetic the result
 * quantises into visible steps below ~50 km. The renderer measures
 * distance from ground zero on every pixel, most of them close in, so
 * this is the form that has to be used — on the GPU too.
 */
export function greatCircleDistance(
  lat1Deg: number,
  lon1Deg: number,
  lat2Deg: number,
  lon2Deg: number,
  radiusM = 6_371_008
): number {
  const dLat = (lat2Deg - lat1Deg) * RAD;
  const dLon = (lon2Deg - lon1Deg) * RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Deg * RAD) * Math.cos(lat2Deg * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * radiusM * Math.asin(Math.min(1, Math.sqrt(a)));
}
