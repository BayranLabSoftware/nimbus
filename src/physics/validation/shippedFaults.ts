import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  decodeFault,
  faultTileKey,
  type DecodedFault,
  type FaultTileIndex,
  type PackedFault,
} from '../events/earthquake/faultLookup.js';
import { chooseStrike, type StrikeAnswer } from '../events/earthquake/strikeSource.js';
import { shippedSlabField } from './shippedSlab2.js';
import { dipFor, type DipSource } from './dipRules.js';

/**
 * The shipped fault tiles, read from disk instead of fetched, and the strike
 * they and Slab2 give an earthquake.
 *
 * Rule 322 of `wiredStrikeRules.ts` says the three call sites must have ONE
 * answer behind them. This is that answer on the Node side — the harness, the
 * benchmarks and the tests; the browser reaches the same function through
 * `fetch` and its own tile cache.
 */

const DATA_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'public',
  'data',
  'faults'
);

let index: FaultTileIndex | null | undefined;
const tiles = new Map<string, DecodedFault[]>();

export function shippedFaultIndex(): FaultTileIndex | null {
  if (index !== undefined) return index;
  const path = join(DATA_DIR, 'index.json');
  index = existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as FaultTileIndex) : null;
  return index;
}

/** The faults of the tile a place falls in, decoded once and kept. */
export function shippedFaultsAt(latitude: number, longitude: number): DecodedFault[] {
  const idx = shippedFaultIndex();
  if (idx === null) return [];
  const key = faultTileKey(latitude, longitude, idx.tileDeg);
  const cached = tiles.get(key);
  if (cached !== undefined) return cached;
  const path = join(DATA_DIR, `${key}.json`);
  if (!existsSync(path)) {
    tiles.set(key, []);
    return [];
  }
  const packed = (JSON.parse(readFileSync(path, 'utf8')) as { faults: PackedFault[] }).faults;
  const decoded = packed.map((f) => decodeFault(f, idx)).filter((f) => f !== null);
  tiles.set(key, decoded);
  return decoded;
}

/**
 * Rule 300's answer for a place, from the shipped tiles: an interface, a
 * crustal fault that can host the rupture, or nothing.
 */
/**
 * Rule 428: the dip, from the same one answer the strike comes from.
 *
 * `simulate.ts` cannot reach a tile — the strike gets to it as an input and
 * so does this. One exported function, so the globe, the harness and the
 * benchmarks cannot each find their own dip for the same spot.
 *
 * Returns null where no structure answered, which is rule 427's third case:
 * the caller then passes nothing and the simulator keeps its style constant.
 */
export function shippedDipAnswer(
  latitude: number,
  longitude: number,
  hypocentreDepthM: number,
  ruptureLengthM: number
): { dipDeg: number; source: DipSource } | null {
  const answer = shippedStrikeAnswer(latitude, longitude, hypocentreDepthM, ruptureLengthM);
  const chosen = dipFor({
    slabDipDeg: answer.slab?.dipDeg ?? null,
    faultDipDeg: answer.fault?.dipDeg ?? null,
    strikeFromSlab: answer.source.startsWith('interface'),
    strikeFromFault: answer.source === 'crustal',
    // Rule 427's third case is "keep what the scenario has", and the
    // simulator owns that number; NaN here can never be chosen, because it
    // is reached only when both structures declined, and then this returns
    // null rather than a dip.
    styleDipDeg: Number.NaN,
  });
  return chosen.source === 'style' ? null : chosen;
}

export function shippedStrikeAnswer(
  latitude: number,
  longitude: number,
  hypocentreDepthM: number,
  ruptureLengthM: number
): StrikeAnswer {
  return chooseStrike(
    { latitude, longitude, hypocentreDepthM, ruptureLengthM },
    shippedSlabField(),
    shippedFaultsAt(latitude, longitude)
  );
}
