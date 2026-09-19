import type { Vs30Provenance } from '../../validation/shakingFieldRules.js';
import type { SiteReading } from './shakingField.js';

/**
 * The ground at a place: the USGS global Vs30 grid, as the tiles
 * `scripts/build-vs30.py` writes it.
 *
 * Rule 310 of `validation/shakingFieldRules.ts`. One 8-bit grey PNG a tile,
 * on the 2.5′ lattice the population already ships on, a byte a cell:
 *
 *     v = 0            no value — outside the grid, or at sea
 *     v = 1 … 255      Vs30 = 90 · exp((v − 1) · ln(2300 / 90) / 254)
 *
 * so a step is 1.3 % of Vs30 and a site term read off it moves by under 1 %.
 *
 * This module decodes; it decides nothing. What happens where the grid has no
 * value is rule 310's fallback, and the caller supplies it — the store's own
 * slope derivation where it has one, rock where it has not — so that the
 * fallback is visible in what is printed instead of hidden in a lookup.
 */

/** The index `scripts/build-vs30.py` writes beside the tiles. */
export interface Vs30TileIndex {
  source: string;
  url: string;
  cellDeg: number;
  tileWidthDeg: number;
  tileHeightDeg: number;
  tileCols: number;
  tileRows: number;
  tileWidthPx: number;
  tileHeightPx: number;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  aggregation: string;
  encoding: string;
  tiles: readonly string[];
}

/** The two ends of the encoding, which the builder and this must agree on. */
export const VS30_LOW = 90;
export const VS30_HIGH = 2300;

/** Undo the byte. Null where the grid had no value. */
export function decodeVs30Byte(byte: number): number | null {
  if (byte <= 0) return null;
  return VS30_LOW * Math.exp(((byte - 1) * Math.log(VS30_HIGH / VS30_LOW)) / 254);
}

/** Which tile holds a place, in the builder's `<col>_<row>` naming. */
export function vs30TileKey(index: Vs30TileIndex, latitude: number, longitude: number): string {
  const col = Math.floor(((((longitude + 180) % 360) + 360) % 360) / index.tileWidthDeg);
  const row = Math.min(
    index.tileRows - 1,
    Math.max(0, Math.floor((index.maxLat - latitude) / index.tileHeightDeg))
  );
  return `${col.toString()}_${row.toString()}`;
}

/** Where in a tile a place falls. Row 0 is the tile's north edge. */
export function vs30PixelAt(
  index: Vs30TileIndex,
  latitude: number,
  longitude: number
): { key: string; at: number } | null {
  const key = vs30TileKey(index, latitude, longitude);
  const [colText, rowText] = key.split('_');
  const col = Number.parseInt(colText ?? '', 10);
  const row = Number.parseInt(rowText ?? '', 10);
  if (!Number.isFinite(col) || !Number.isFinite(row)) return null;
  const west = -180 + col * index.tileWidthDeg;
  const north = index.maxLat - row * index.tileHeightDeg;
  let dLon = longitude - west;
  while (dLon < 0) dLon += 360;
  while (dLon >= 360) dLon -= 360;
  const x = Math.floor(dLon / index.cellDeg);
  const y = Math.floor((north - latitude) / index.cellDeg);
  if (x < 0 || x >= index.tileWidthPx || y < 0 || y >= index.tileHeightPx) return null;
  return { key, at: y * index.tileWidthPx + x };
}

/**
 * Rule 310: the ground at a place, with the fallback named.
 *
 * `getTile` returns a tile's grey plane, or null where the tile is not
 * shipped (no land, or outside the grid's own reach). `fallback` is what the
 * caller knows about the site otherwise — the store's slope-derived Vs30 — and
 * `rockVs30` is the last resort.
 */
export function makeSiteLookup(
  index: Vs30TileIndex,
  getTile: (key: string) => Uint8Array | null,
  fallback?: (latitude: number, longitude: number) => number | null,
  rockVs30 = 760
): (latitude: number, longitude: number) => SiteReading {
  return (latitude: number, longitude: number): SiteReading => {
    const pixel = vs30PixelAt(index, latitude, longitude);
    if (pixel !== null) {
      const tile = getTile(pixel.key);
      const vs30 = tile === null ? null : decodeVs30Byte(tile[pixel.at] ?? 0);
      if (vs30 !== null) return { vs30, provenance: 'grid' satisfies Vs30Provenance };
    }
    const derived = fallback?.(latitude, longitude) ?? null;
    if (derived !== null && Number.isFinite(derived) && derived > 0) {
      return { vs30: derived, provenance: 'slope' };
    }
    return { vs30: rockVs30, provenance: 'rock' };
  };
}
