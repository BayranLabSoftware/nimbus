import type { MosaicBounds, TileBlock } from './mercator.js';
import {
  EQUATORIAL_CIRCUMFERENCE_M,
  geoToMosaicUV,
  tileBlockAround,
  zoomForSpan,
} from './mercator.js';
import type { NormalisedElevation } from './terrarium.js';
import { decodeTerrarium, normaliseElevation, sampleElevation } from './terrarium.js';

/**
 * Streaming tile mosaics for the impact renderer.
 *
 * The render study shipped its geography baked into the page as data
 * URIs, because an Artifact cannot reach the network. The app can, and
 * this is the layer that does it: given a point and a ground span, it
 * picks a zoom, pulls the block, stitches it, and hands back one
 * imagery texture plus one filterable elevation channel.
 *
 * Two sources, both keyless and CORS-enabled, both already trusted by
 * this project:
 *   - Esri World Imagery — the same basemap the Cesium globe uses.
 *   - AWS Terrain Tiles (terrarium) — elevation AND bathymetry, which
 *     matters because half the interesting impact sites are coastal.
 *
 * Network policy is deliberate: fetches are bounded, failures are
 * per-tile and non-fatal (a missing tile leaves a hole, it does not
 * abort the scene), and every mosaic is cached by request so orbiting
 * or scrubbing never re-fetches.
 */

/** Tile-URL template. Note the axis order differs between providers —
 *  a mismatch here shows up as a mosaic that is silently transposed. */
export interface TileSource {
  readonly id: string;
  readonly attribution: string;
  readonly maxZoom: number;
  url(x: number, y: number, z: number): string;
}

/** Esri World Imagery. Path order is {z}/{y}/{x} — row before column. */
export const ESRI_WORLD_IMAGERY: TileSource = {
  id: 'esri-world-imagery',
  attribution: 'Esri, Maxar, Earthstar Geographics, and the GIS User Community',
  maxZoom: 19,
  url: (x, y, z) =>
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${String(z)}/${String(y)}/${String(x)}`,
};

/** AWS Terrain Tiles, terrarium encoding. Path order is {z}/{x}/{y}. */
export const AWS_TERRARIUM: TileSource = {
  id: 'aws-terrarium',
  attribution: 'AWS Terrain Tiles (Mapzen / NASA / NOAA / USGS)',
  maxZoom: 15,
  url: (x, y, z) =>
    `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${String(z)}/${String(x)}/${String(y)}.png`,
};

export interface MosaicRequest {
  readonly latitude: number;
  readonly longitude: number;
  /** Ground span the mosaic must cover, in metres. */
  readonly spanMeters: number;
  /** Block side, in tiles. Higher = sharper but more requests (n²). */
  readonly tiles: number;
  /** Force a zoom instead of deriving one from the span. A pyramid
   *  wants exact, evenly-spaced levels; letting the planner round each
   *  span to the nearest zoom makes the steps between levels uneven,
   *  which shows up as one blurry band and one sharp one. */
  readonly zoom?: number;
}

/** Everything the renderer needs to bind one site. */
export interface LoadedMosaic {
  readonly imagery: HTMLCanvasElement;
  readonly elevation: NormalisedElevation;
  readonly bounds: MosaicBounds;
  readonly imageryBlock: TileBlock;
  readonly elevationBlock: TileBlock;
  /** Terrain height at the requested point (m). The local scene frame
   *  puts y = 0 here, so the impact sits on the ground and not on the
   *  ellipsoid. */
  readonly elevationAtOrigin: number;
  /** Tiles that failed to load, per layer. Non-zero means holes. */
  readonly missing: { imagery: number; elevation: number };
  /** Mean linear colour of the imagery. Each zoom level is a different
   *  photograph with its own exposure, so without matching them the
   *  boundary between two levels reads as a bright rectangle drawn on
   *  the landscape — which is exactly how a tile block gets mistaken
   *  for "the map is a square". */
  readonly meanColor: readonly [number, number, number];
  readonly attribution: readonly string[];
}

/** Injectable so tests do not need a network or a browser. */
export type ImageLoader = (url: string) => Promise<CanvasImageSource>;

const TILE_PX = 256;

/** Default loader: an `Image` with CORS enabled. */
export const defaultImageLoader: ImageLoader = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      reject(new Error(`tile fetch failed: ${url}`));
    };
    img.src = url;
  });

/**
 * Plan a mosaic without fetching anything: which zoom, which block,
 * how many requests. Pure, so the choice of zoom is testable and a
 * regression that quietly asks for 400 tiles is visible.
 */
export function planMosaic(
  request: MosaicRequest,
  source: TileSource
): { block: TileBlock; requests: number } {
  const z =
    request.zoom === undefined
      ? zoomForSpan(request.latitude, request.spanMeters, request.tiles, source.maxZoom)
      : Math.min(Math.max(Math.round(request.zoom), 0), source.maxZoom);
  const block = tileBlockAround(request.longitude, request.latitude, z, request.tiles);
  return { block, requests: block.tiles * block.tiles };
}

/** Average linear colour of a canvas, sampled at 16x16. */
function meanColorOf(canvas: HTMLCanvasElement): [number, number, number] {
  const small = document.createElement('canvas');
  small.width = 16;
  small.height = 16;
  const ctx = small.getContext('2d', { willReadFrequently: true });
  if (ctx === null) return [0.5, 0.46, 0.38];
  ctx.drawImage(canvas, 0, 0, 16, 16);
  const { data } = ctx.getImageData(0, 0, 16, 16);
  let r = 0;
  let g = 0;
  let b = 0;
  const n = 16 * 16;
  for (let i = 0; i < n; i++) {
    // Average in LINEAR light: averaging sRGB bytes biases dark.
    r += ((data[i * 4] ?? 0) / 255) ** 2.2;
    g += ((data[i * 4 + 1] ?? 0) / 255) ** 2.2;
    b += ((data[i * 4 + 2] ?? 0) / 255) ** 2.2;
  }
  return [Math.max(r / n, 1e-4), Math.max(g / n, 1e-4), Math.max(b / n, 1e-4)];
}

async function stitch(
  block: TileBlock,
  source: TileSource,
  load: ImageLoader
): Promise<{ canvas: HTMLCanvasElement; missing: number }> {
  const side = block.tiles * TILE_PX;
  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (ctx === null) throw new Error('tileMosaic: 2D canvas context unavailable');

  const jobs: Promise<void>[] = [];
  let missing = 0;
  for (let j = 0; j < block.tiles; j++) {
    for (let i = 0; i < block.tiles; i++) {
      const url = source.url(block.x0 + i, block.y0 + j, block.z);
      jobs.push(
        load(url)
          .then((img) => {
            ctx.drawImage(img, i * TILE_PX, j * TILE_PX, TILE_PX, TILE_PX);
          })
          .catch(() => {
            // A hole is survivable; an exception mid-scene is not.
            missing += 1;
          })
      );
    }
  }
  await Promise.all(jobs);
  return { canvas, missing };
}

const cache = new Map<string, Promise<LoadedMosaic>>();

function cacheKey(r: MosaicRequest): string {
  return [
    r.latitude.toFixed(5),
    r.longitude.toFixed(5),
    Math.round(r.spanMeters),
    r.tiles,
    r.zoom ?? 'auto',
  ].join('|');
}

/**
 * Fetch and stitch one site. Imagery and elevation are planned
 * independently — terrarium tops out three zoom levels below Esri, so
 * forcing them onto a shared grid would either blur the photograph or
 * ask the elevation provider for tiles it does not have. They are
 * resampled onto a common UV space by {@link geoToMosaicUV} instead.
 */
export async function loadMosaic(
  request: MosaicRequest,
  options: {
    imageLoader?: ImageLoader;
    imagerySource?: TileSource;
    elevationSource?: TileSource;
  } = {}
): Promise<LoadedMosaic> {
  const key = cacheKey(request);
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  const load = options.imageLoader ?? defaultImageLoader;
  const imagerySource = options.imagerySource ?? ESRI_WORLD_IMAGERY;
  const elevationSource = options.elevationSource ?? AWS_TERRARIUM;

  const task = (async (): Promise<LoadedMosaic> => {
    const imageryPlan = planMosaic(request, imagerySource);
    const elevationPlan = planMosaic(request, elevationSource);

    const [img, dem] = await Promise.all([
      stitch(imageryPlan.block, imagerySource, load),
      stitch(elevationPlan.block, elevationSource, load),
    ]);

    const demCtx = dem.canvas.getContext('2d', { willReadFrequently: true });
    if (demCtx === null) throw new Error('tileMosaic: 2D canvas context unavailable');
    const px = demCtx.getImageData(0, 0, dem.canvas.width, dem.canvas.height);
    const field = decodeTerrarium(px.data, dem.canvas.width, dem.canvas.height);
    const elevation = normaliseElevation(field);

    const uv = geoToMosaicUV(request.longitude, request.latitude, elevationPlan.block.bounds);
    const elevationAtOrigin = sampleElevation(field, uv.u, uv.v);

    return {
      imagery: img.canvas,
      elevation,
      // The imagery block is the one the renderer samples for colour;
      // the shader maps both layers through their own bounds.
      bounds: imageryPlan.block.bounds,
      imageryBlock: imageryPlan.block,
      elevationBlock: elevationPlan.block,
      elevationAtOrigin,
      missing: { imagery: img.missing, elevation: dem.missing },
      meanColor: meanColorOf(img.canvas),
      attribution: [imagerySource.attribution, elevationSource.attribution],
    };
  })();

  cache.set(key, task);
  // A failed load must not poison the cache for the rest of the session.
  task.catch(() => cache.delete(key));
  return task;
}

/**
 * Zoom level of the world-covering fallback. Level 3 is 8x8 tiles —
 * 2048 px around the equator, roughly 20 km per pixel. Coarse, but it
 * is real geography, and it means that however far the camera pulls
 * back there is map all the way to the horizon instead of a square of
 * terrain floating in flat colour.
 */
export const WORLD_ZOOM = 3;

/**
 * The whole planet, once. Cached like any other mosaic, so switching
 * scenarios re-uses it rather than re-fetching 128 tiles.
 */
export function loadWorldMosaic(
  options: { imageLoader?: ImageLoader } = {}
): Promise<LoadedMosaic> {
  const tiles = 2 ** WORLD_ZOOM;
  return loadMosaic(
    {
      latitude: 0,
      longitude: 0,
      // Exactly the equator: with `tiles` = 2^WORLD_ZOOM the planner
      // lands on WORLD_ZOOM and the block clamps to the full grid.
      // Asking for a larger span drops it to zoom 1 — a 512 px planet,
      // which is 78 km per pixel and reads as flat colour.
      spanMeters: EQUATORIAL_CIRCUMFERENCE_M,
      tiles,
    },
    options
  );
}

/** Drop every cached mosaic. Exposed for tests and for a hard reset. */
export function clearMosaicCache(): void {
  cache.clear();
}
