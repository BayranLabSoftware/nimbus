import { geoToLocal, geoToMosaicUV, lonLatToTile, tileToLonLat } from '../geo/mercator.js';
import { sampleNormalised } from '../geo/terrarium.js';
import { loadMosaic, type LoadedMosaic } from '../geo/tileMosaic.js';
import {
  BUILDING_ZOOM,
  loadBuildingTile,
  type BinaryLoader,
  type BuildingFootprint,
  type TileRef,
} from '../geo/vectorTiles.js';
import {
  extrudeBuildings,
  mergeMeshes,
  type BuildingMesh,
  type LocalBuilding,
} from '../geo/extrude.js';

/**
 * The building layer for one site: which tiles, which foundations,
 * how much of the city the budget admits.
 *
 * Buildings are loaded around GROUND ZERO, not around the camera the
 * way the terrain pyramid is. The asymmetry is deliberate: imagery is
 * useful at every distance, so it follows the eye — but a building is
 * metres tall and disappears into a pixel a few kilometres out, and
 * the only place the viewer studies from close up is the event
 * itself. A GZ disc covers that with a fixed, cacheable request set.
 */

/** Where extruded buildings stop mattering visually. */
export const BUILDING_DISC_MIN_M = 2_000;
export const BUILDING_DISC_MAX_M = 6_000;

/**
 * Hard ceiling on geometry. Central Rome measures ~18k wall edges per
 * z14 tile; a full disc lands near 1.4M triangles, so the cap trims
 * only the smallest sheds of the densest cities.
 */
export const MAX_BUILDING_TRIANGLES = 1_500_000;

/** Buildings per extrusion slice; one slice per macrotask keeps a
 *  dense city from freezing the main thread while it triangulates. */
const SLICE = 3_000;

/**
 * Radius of the loaded disc. Follows the 5 psi contour — the ring the
 * legend already calls "building collapse" — with headroom, so the
 * whole zone the event visibly rearranges has geometry in it.
 */
export function buildingDiscRadius(r5psiMeters: number): number {
  return Math.min(BUILDING_DISC_MAX_M, Math.max(BUILDING_DISC_MIN_M, 1.3 * r5psiMeters));
}

/** z14 tiles whose nearest point lies within the disc. */
export function planBuildingTiles(
  latitude: number,
  longitude: number,
  radiusMeters: number
): TileRef[] {
  const centre = lonLatToTile(longitude, latitude, BUILDING_ZOOM);
  const n = 2 ** BUILDING_ZOOM;
  const eastOf = (lon: number): number => geoToLocal(lon, latitude, latitude, longitude).eastM;
  const northOf = (lat: number): number => geoToLocal(longitude, lat, latitude, longitude).northM;

  // How many tiles the radius spans, from this row's actual tile size.
  const nw0 = tileToLonLat(centre.x, centre.y, BUILDING_ZOOM);
  const se0 = tileToLonLat(centre.x + 1, centre.y + 1, BUILDING_ZOOM);
  const reachX = Math.ceil(radiusMeters / Math.max(Math.abs(eastOf(se0.lon) - eastOf(nw0.lon)), 1));
  const reachY = Math.ceil(
    radiusMeters / Math.max(Math.abs(northOf(nw0.lat) - northOf(se0.lat)), 1)
  );

  const out: TileRef[] = [];
  for (let dy = -reachY; dy <= reachY; dy++) {
    for (let dx = -reachX; dx <= reachX; dx++) {
      const x = centre.x + dx;
      const y = centre.y + dy;
      if (x < 0 || y < 0 || x >= n || y >= n) continue;
      const nw = tileToLonLat(x, y, BUILDING_ZOOM);
      const se = tileToLonLat(x + 1, y + 1, BUILDING_ZOOM);
      const eastMin = Math.min(eastOf(nw.lon), eastOf(se.lon));
      const eastMax = Math.max(eastOf(nw.lon), eastOf(se.lon));
      const northMin = Math.min(northOf(nw.lat), northOf(se.lat));
      const northMax = Math.max(northOf(nw.lat), northOf(se.lat));
      // Nearest point of the tile rectangle to ground zero (at 0, 0).
      const nx = Math.min(Math.max(0, eastMin), eastMax);
      const ny = Math.min(Math.max(0, northMin), northMax);
      if (Math.hypot(nx, ny) <= radiusMeters) out.push({ x, y, z: BUILDING_ZOOM });
    }
  }
  return out;
}

export interface BuildingSite {
  readonly latitude: number;
  readonly longitude: number;
  /** 5 psi ground range (m); 0 when the event has no blast ring. */
  readonly r5psiMeters: number;
}

export interface BuildingLoadOptions {
  readonly loader?: BinaryLoader;
  readonly isCancelled?: () => boolean;
}

/** Yield the main thread between slices. */
const breathe = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Fetch, seat, and extrude every building the site's disc holds.
 * Resolves null where the world has no footprints — open ocean,
 * deserts, tundra — which is a state, not a failure.
 */
export async function loadBuildingsForSite(
  site: BuildingSite,
  options: BuildingLoadOptions = {}
): Promise<BuildingMesh | null> {
  const cancelled = options.isCancelled ?? ((): boolean => false);
  const radius = buildingDiscRadius(site.r5psiMeters);
  const tiles = planBuildingTiles(site.latitude, site.longitude, radius);

  // Foundations come from the site's own mosaic, so every base and the
  // datum at ground zero are read from the SAME field: the camera
  // pyramid refines under the viewer and would move the ground under
  // the houses. The wall skirt absorbs what remains.
  const demTask = loadMosaic({
    latitude: site.latitude,
    longitude: site.longitude,
    spanMeters: radius * 2.6,
    tiles: 4,
  }).catch(() => null);

  const settled = await Promise.allSettled(
    tiles.map((tile) => loadBuildingTile(tile, options.loader))
  );
  if (cancelled()) return null;
  const footprints: BuildingFootprint[] = [];
  for (const result of settled) {
    if (result.status === 'fulfilled') footprints.push(...result.value);
  }
  if (footprints.length === 0) return null;

  const dem = await demTask;
  if (cancelled()) return null;
  const sampleRoof = roofSampler(dem);

  const locals: (LocalBuilding & { area: number })[] = [];
  for (const footprint of footprints) {
    const local = toLocal(footprint, site, dem, radius, sampleRoof);
    if (local !== null) locals.push(local);
  }
  // Largest first, so the triangle budget trims garden sheds, not
  // cathedrals. Deterministic: ties broken by position.
  locals.sort((a, b) => b.area - a.area);

  const parts: BuildingMesh[] = [];
  let budget = MAX_BUILDING_TRIANGLES;
  for (let start = 0; start < locals.length; start += SLICE) {
    if (cancelled()) return null;
    const part = extrudeBuildings(locals.slice(start, start + SLICE), budget);
    budget -= part.triangleCount;
    parts.push(part);
    if (budget <= 0) break;
    await breathe();
  }
  const mesh = mergeMeshes(parts);
  return mesh.triangleCount === 0 ? null : mesh;
}

/**
 * Roof colours straight from the orthophoto: getImageData once over
 * the whole mosaic, then every footprint indexes it. Roofs sampled
 * from the same photograph as the ground blend with the map instead
 * of sitting on it — the difference between a model placed on a
 * picture and a picture standing up.
 *
 * Returns null where a 2D context is unavailable (tests, contexts
 * without canvas readback): the sentinel path, not an error.
 */
function roofSampler(
  mosaic: LoadedMosaic | null
): ((lon: number, lat: number) => readonly [number, number, number] | null) | null {
  if (mosaic === null) return null;
  let pixels: ImageData;
  try {
    const context = mosaic.imagery.getContext('2d', { willReadFrequently: true });
    if (context === null) return null;
    pixels = context.getImageData(0, 0, mosaic.imagery.width, mosaic.imagery.height);
  } catch {
    return null;
  }
  const { data, width, height } = pixels;
  const bounds = mosaic.imageryBlock.bounds;
  return (lon, lat) => {
    const uv = geoToMosaicUV(lon, lat, bounds);
    if (uv.u < 0 || uv.u > 1 || uv.v < 0 || uv.v > 1) return null;
    const x = Math.min(width - 1, Math.round(uv.u * (width - 1)));
    const y = Math.min(height - 1, Math.round(uv.v * (height - 1)));
    const i = (y * width + x) * 4;
    // sRGB bytes to linear light, the only currency the shader takes.
    return [
      ((data[i] ?? 128) / 255) ** 2.2,
      ((data[i + 1] ?? 118) / 255) ** 2.2,
      ((data[i + 2] ?? 104) / 255) ** 2.2,
    ];
  };
}

function toLocal(
  footprint: BuildingFootprint,
  site: BuildingSite,
  dem: LoadedMosaic | null,
  radiusMeters: number,
  sampleRoof: ReturnType<typeof roofSampler>
): (LocalBuilding & { area: number }) | null {
  const toKm = (lon: number, lat: number): [number, number] => {
    const p = geoToLocal(lon, lat, site.latitude, site.longitude);
    return [p.eastM / 1_000, p.northM / 1_000];
  };
  const outerPoints = footprint.outer.points.map((p) => toKm(p.lon, p.lat));

  // Centroid, for the foundation sample and the disc test.
  let cx = 0;
  let cz = 0;
  for (const p of outerPoints) {
    cx += p[0];
    cz += p[1];
  }
  cx /= Math.max(outerPoints.length, 1);
  cz /= Math.max(outerPoints.length, 1);
  if (Math.hypot(cx, cz) * 1_000 > radiusMeters) return null;

  let area = 0;
  for (let i = 0; i < outerPoints.length; i++) {
    const a = outerPoints[i];
    const b = outerPoints[(i + 1) % outerPoints.length];
    if (a === undefined || b === undefined) continue;
    area += a[0] * b[1] - b[0] * a[1];
  }
  area = Math.abs(area) / 2;

  let roofColor: readonly [number, number, number] | undefined;
  let baseKm = 0;
  if (dem !== null) {
    if (footprint.outer.points.length > 0) {
      const geo = { lon: 0, lat: 0 };
      for (const p of footprint.outer.points) {
        geo.lon += p.lon;
        geo.lat += p.lat;
      }
      geo.lon /= footprint.outer.points.length;
      geo.lat /= footprint.outer.points.length;
      const uv = geoToMosaicUV(geo.lon, geo.lat, dem.elevationBlock.bounds);
      if (uv.u >= 0 && uv.u <= 1 && uv.v >= 0 && uv.v <= 1) {
        baseKm = (sampleNormalised(dem.elevation, uv.u, uv.v) - dem.elevationAtOrigin) / 1_000;
      }
      roofColor = sampleRoof?.(geo.lon, geo.lat) ?? undefined;
    }
  }

  return {
    outer: { points: outerPoints, walls: footprint.outer.walls },
    holes: footprint.holes.map((h) => ({
      points: h.points.map((p) => toKm(p.lon, p.lat)),
      walls: h.walls,
    })),
    baseKm,
    heightKm: footprint.heightMeters / 1_000,
    minHeightKm: footprint.minHeightMeters / 1_000,
    area,
    ...(roofColor === undefined ? {} : { roofColor }),
  };
}
