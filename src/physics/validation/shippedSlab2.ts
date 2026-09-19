import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  makeSlabField,
  type SlabTile,
  type SlabTileIndex,
} from '../events/earthquake/slabLookup.js';
import { decodePng } from './png.js';
import type { SlabField } from './slabStrikeRules.js';

/**
 * The shipped Slab2 tiles, read from disk instead of fetched.
 *
 * The browser gets these through `fetch` and an `OffscreenCanvas`; a test and a
 * benchmark have neither, and must not have a network either. This module reads
 * the very same PNGs out of `public/data/slab2/` with nothing but zlib and
 * hands them to the very same field the browser walks — `makeSlabField` is not
 * reimplemented here.
 *
 * Returns null when the tiles have not been built. They are built by
 * `scripts/build-slab2.py` from the Slab2 distribution, which is an input and
 * not a file of this project.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(HERE, '..', '..', '..', 'public', 'data', 'slab2');

let index: SlabTileIndex | null | undefined;
const tiles = new Map<string, SlabTile | null>();

export function shippedSlabIndex(): SlabTileIndex | null {
  if (index !== undefined) return index;
  const path = join(DATA_DIR, 'index.json');
  index = existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as SlabTileIndex) : null;
  return index;
}

function loadTile(key: string): SlabTile | null {
  const cached = tiles.get(key);
  if (cached !== undefined) return cached;
  const path = join(DATA_DIR, `${key}.png`);
  if (!existsSync(path)) {
    tiles.set(key, null);
    return null;
  }
  const png = decodePng(readFileSync(path));
  const tile: SlabTile = { strike: png.red, depth: png.green, uncertainty: png.blue };
  tiles.set(key, tile);
  return tile;
}

/** Rule 298's field over the shipped tiles, or null where none are built. */
export function shippedSlabField(): SlabField | null {
  const idx = shippedSlabIndex();
  if (idx === null) return null;
  return makeSlabField(idx, loadTile);
}
