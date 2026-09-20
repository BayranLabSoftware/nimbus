import {
  makeSiteLookup,
  vs30PixelAt,
  type Vs30TileIndex,
} from '../physics/events/earthquake/vs30Lookup.js';
import type { SiteReading } from '../physics/events/earthquake/shakingField.js';
import { decodePngPlanes } from './populationLookup.js';

/**
 * The ground under a point, in the browser.
 *
 * The offline harness reads `public/data/vs30/` with node's zlib
 * (`validation/shippedVs30.ts`); this reads the same files over `fetch`, and
 * both go through the same `makeSiteLookup`, so a scenario's ground is one
 * answer and not two. It is the shape `strikeTiles.ts` already uses for the
 * fault and slab tiles, for the same reason.
 *
 * Nothing is fetched until an earthquake is placed, and a lookup before the
 * tiles arrive reads reference rock rather than waiting — a map that appears
 * a moment later on real ground is better than one that does not appear.
 *
 * The tiles are 60° by 30° and 214 kB on average, so a click loads one:
 * `docs/GOLD_STANDARD.md` records what that costs beside the fault and slab
 * budgets.
 */

let index: Vs30TileIndex | null = null;
let indexPromise: Promise<void> | null = null;
const tiles = new Map<string, Uint8Array | null>();
const inFlight = new Map<string, Promise<void>>();

function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base.endsWith('/') ? base : `${base}/`}${path}`;
}

async function loadIndex(): Promise<void> {
  if (indexPromise !== null) return indexPromise;
  indexPromise = (async () => {
    try {
      const response = await fetch(assetUrl('data/vs30/index.json'));
      if (response.ok) index = (await response.json()) as Vs30TileIndex;
    } catch (err) {
      console.warn('[vs30] index unavailable:', err);
    }
  })();
  return indexPromise;
}

async function loadTile(key: string): Promise<void> {
  if (tiles.has(key)) return;
  const already = inFlight.get(key);
  if (already !== undefined) return already;
  const idx = index;
  if (idx === null) return;
  const job = (async () => {
    try {
      const response = await fetch(assetUrl(`data/vs30/${key}.png`));
      if (!response.ok) {
        tiles.set(key, null);
        return;
      }
      const planes = await decodePngPlanes(
        await response.blob(),
        idx.tileWidthPx,
        idx.tileHeightPx
      );
      tiles.set(key, planes.red);
    } catch (err) {
      console.warn(`[vs30] tile ${key} failed:`, err);
      tiles.set(key, null);
    } finally {
      inFlight.delete(key);
    }
  })();
  inFlight.set(key, job);
  return job;
}

/**
 * Fetch what a scenario at this place will read, and everything a field
 * around it will read: a map spans degrees, and the tiles are wide enough
 * that a rupture can straddle two of them.
 */
export async function loadVs30TilesFor(
  latitude: number,
  longitude: number,
  reachDeg = 0
): Promise<void> {
  await loadIndex();
  const idx = index;
  if (idx === null) return;
  const wanted = new Set<string>();
  for (const dLat of [-reachDeg, 0, reachDeg]) {
    for (const dLon of [-reachDeg, 0, reachDeg]) {
      const pixel = vs30PixelAt(
        idx,
        Math.max(-89.9, Math.min(89.9, latitude + dLat)),
        longitude + dLon
      );
      if (pixel !== null) wanted.add(pixel.key);
    }
  }
  await Promise.all([...wanted].map((key) => loadTile(key)));
}

/**
 * The ground under a point, from whatever has arrived.
 *
 * Reference rock where the tiles are missing or the grid has no value —
 * `provenance` says which, so a caller can tell a reading from a default.
 */
export function siteAt(latitude: number, longitude: number): SiteReading {
  const idx = index;
  if (idx === null) return { vs30: 760, provenance: 'rock' };
  return makeSiteLookup(idx, (key) => tiles.get(key) ?? null)(latitude, longitude);
}

/** Whether a real grid reading is available here — the globe asks before
 *  drawing a field, because on rock the field is a smooth ellipse and the
 *  three rings already say that. */
export function hasGroundFor(latitude: number, longitude: number): boolean {
  const idx = index;
  if (idx === null) return false;
  const pixel = vs30PixelAt(idx, latitude, longitude);
  return pixel !== null && (tiles.get(pixel.key) ?? null) !== null;
}

/** For tests: forget everything fetched. */
export const _internals = {
  reset(): void {
    index = null;
    indexPromise = null;
    tiles.clear();
    inFlight.clear();
  },
};
