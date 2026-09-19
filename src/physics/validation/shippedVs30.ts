import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeSiteLookup, type Vs30TileIndex } from '../events/earthquake/vs30Lookup.js';
import type { SiteReading } from '../events/earthquake/shakingField.js';
import { decodePng } from './png.js';

/**
 * The shipped Vs30 tiles, read from disk instead of fetched — the same files
 * the browser gets through `fetch` and an `OffscreenCanvas`, decoded with
 * nothing but zlib, handed to the same lookup.
 *
 * Null where the tiles have not been built. They come from
 * `scripts/build-vs30.py` and the USGS grid, which is an input and not a file
 * of this project.
 */

const DATA_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'public',
  'data',
  'vs30'
);

let index: Vs30TileIndex | null | undefined;
const tiles = new Map<string, Uint8Array | null>();

export function shippedVs30Index(): Vs30TileIndex | null {
  if (index !== undefined) return index;
  const path = join(DATA_DIR, 'index.json');
  index = existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as Vs30TileIndex) : null;
  return index;
}

function loadTile(key: string): Uint8Array | null {
  const cached = tiles.get(key);
  if (cached !== undefined) return cached;
  const path = join(DATA_DIR, `${key}.png`);
  if (!existsSync(path)) {
    tiles.set(key, null);
    return null;
  }
  const tile = decodePng(readFileSync(path)).red;
  tiles.set(key, tile);
  return tile;
}

/** Rule 310's ground over the shipped tiles, or null where none are built. */
export function shippedSiteLookup(
  fallback?: (latitude: number, longitude: number) => number | null
): ((latitude: number, longitude: number) => SiteReading) | null {
  const idx = shippedVs30Index();
  if (idx === null) return null;
  return makeSiteLookup(idx, loadTile, fallback);
}
