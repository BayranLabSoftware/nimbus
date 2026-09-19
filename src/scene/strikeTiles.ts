import {
  decodeFault,
  faultTileKey,
  type DecodedFault,
  type FaultTileIndex,
  type PackedFault,
} from '../physics/events/earthquake/faultLookup.js';
import {
  makeSlabField,
  type SlabTile,
  type SlabTileIndex,
} from '../physics/events/earthquake/slabLookup.js';
import { chooseStrike, type StrikeAnswer } from '../physics/events/earthquake/strikeSource.js';
import type { SlabField } from '../physics/validation/slabStrikeRules.js';

/**
 * Which way the fault under a click points, in the browser.
 *
 * Rule 322 of `physics/validation/wiredStrikeRules.ts`: the globe, the store's
 * stadium and the toll all get ONE answer, and this is where the browser gets
 * it. The same `chooseStrike` the harness calls, over the same shipped tiles,
 * fetched one at a time and kept.
 *
 * Nothing is fetched until an earthquake is placed (rule 324), and a lookup
 * before the tiles arrive returns null rather than a guess — the caller then
 * has an unknown strike, which rule 325 says must be drawn as an unknown and
 * not as north.
 */

interface Tiles {
  faultIndex: FaultTileIndex | null;
  slabIndex: SlabTileIndex | null;
}

const loaded: Tiles = { faultIndex: null, slabIndex: null };
let indexPromise: Promise<void> | null = null;
const faultTiles = new Map<string, DecodedFault[] | null>();
const slabTiles = new Map<string, SlabTile | null>();
const inFlight = new Map<string, Promise<void>>();

function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base.endsWith('/') ? base : `${base}/`}${path}`;
}

async function loadIndexes(): Promise<void> {
  if (indexPromise !== null) return indexPromise;
  indexPromise = (async () => {
    const [faults, slabs] = await Promise.allSettled([
      fetch(assetUrl('data/faults/index.json')).then((r) => (r.ok ? r.json() : null)),
      fetch(assetUrl('data/slab2/index.json')).then((r) => (r.ok ? r.json() : null)),
    ]);
    if (faults.status === 'fulfilled' && faults.value !== null) {
      loaded.faultIndex = faults.value as FaultTileIndex;
    }
    if (slabs.status === 'fulfilled' && slabs.value !== null) {
      loaded.slabIndex = slabs.value as SlabTileIndex;
    }
  })();
  return indexPromise;
}

/** Decode a slab tile's three channels through a canvas. */
async function decodeSlabTile(blob: Blob, size: number): Promise<SlabTile> {
  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = new OffscreenCanvas(size, size);
    const context = canvas.getContext('2d');
    if (context === null) throw new Error('2D context unavailable');
    context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, size, size).data;
    const strike = new Uint8Array(size * size);
    const depth = new Uint8Array(size * size);
    const uncertainty = new Uint8Array(size * size);
    for (let i = 0; i < strike.length; i += 1) {
      strike[i] = pixels[i * 4] ?? 0;
      depth[i] = pixels[i * 4 + 1] ?? 0;
      uncertainty[i] = pixels[i * 4 + 2] ?? 0;
    }
    return { strike, depth, uncertainty };
  } finally {
    bitmap.close();
  }
}

/** Fetch the one fault tile and the one slab tile that hold a place. */
export async function loadStrikeTilesFor(latitude: number, longitude: number): Promise<void> {
  await loadIndexes();
  const jobs: Promise<void>[] = [];

  const faultIndex = loaded.faultIndex;
  if (faultIndex !== null) {
    const key = faultTileKey(latitude, longitude, faultIndex.tileDeg);
    if (!faultTiles.has(key)) {
      const job =
        inFlight.get(`f${key}`) ??
        fetch(assetUrl(`data/faults/${key}.json`))
          .then(async (response) => {
            if (!response.ok) {
              faultTiles.set(key, null);
              return;
            }
            const body = (await response.json()) as { faults: PackedFault[] };
            faultTiles.set(
              key,
              body.faults.map((f) => decodeFault(f, faultIndex)).filter((f) => f !== null)
            );
          })
          .catch(() => {
            faultTiles.set(key, null);
          })
          .finally(() => {
            inFlight.delete(`f${key}`);
          });
      inFlight.set(`f${key}`, job);
      jobs.push(job);
    }
  }

  const slabIndex = loaded.slabIndex;
  if (slabIndex !== null) {
    const key = slabTileKeyFor(slabIndex, latitude, longitude);
    if (!slabTiles.has(key)) {
      const job =
        inFlight.get(`s${key}`) ??
        fetch(assetUrl(`data/slab2/${key}.png`))
          .then(async (response) => {
            if (!response.ok) {
              slabTiles.set(key, null);
              return;
            }
            slabTiles.set(key, await decodeSlabTile(await response.blob(), slabIndex.tilePx));
          })
          .catch(() => {
            slabTiles.set(key, null);
          })
          .finally(() => {
            inFlight.delete(`s${key}`);
          });
      inFlight.set(`s${key}`, job);
      jobs.push(job);
    }
  }

  await Promise.all(jobs);
}

/** The slab tile a place falls in, in the builder's naming. */
function slabTileKeyFor(index: SlabTileIndex, latitude: number, longitude: number): string {
  const nodes = Math.round(1 / index.cellDeg);
  const gi = Math.min(180 * nodes - 1, Math.max(0, Math.round((latitude + 90) * nodes)));
  const gj = Math.round(((((longitude + 180) % 360) + 360) % 360) * nodes) % (360 * nodes);
  const row = Math.floor(gi / index.tilePx);
  const col = Math.floor(gj / index.tilePx);
  return `${col.toString()}_${row.toString()}`;
}

function slabFieldFromCache(): SlabField | null {
  const index = loaded.slabIndex;
  if (index === null) return null;
  return makeSlabField(index, (key) => slabTiles.get(key) ?? null);
}

/**
 * Rule 300's answer for a place, from whatever tiles have arrived. Null while
 * the indexes are still in flight — which is an unknown strike and not north.
 */
export function strikeAnswerAt(
  latitude: number,
  longitude: number,
  hypocentreDepthM: number,
  ruptureLengthM: number
): StrikeAnswer | null {
  const faultIndex = loaded.faultIndex;
  const slabField = slabFieldFromCache();
  if (faultIndex === null && slabField === null) return null;
  const faults =
    faultIndex === null
      ? []
      : (faultTiles.get(faultTileKey(latitude, longitude, faultIndex.tileDeg)) ?? []);
  return chooseStrike({ latitude, longitude, hypocentreDepthM, ruptureLengthM }, slabField, faults);
}

/** For tests: forget everything fetched. */
export const _internals = {
  reset(): void {
    loaded.faultIndex = null;
    loaded.slabIndex = null;
    indexPromise = null;
    faultTiles.clear();
    slabTiles.clear();
    inFlight.clear();
  },
  slabTileKeyFor,
};
