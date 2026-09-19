import {
  SLAB_CELL_DEG,
  SLAB_TILE_DEG,
  decodeDepthByte,
  decodeStrikeByte,
  decodeUncertaintyByte,
  meanDirectionDeg,
  type SlabField,
  type SlabSample,
} from '../../validation/slabStrikeRules.js';

/**
 * Where the slab is, how deep, and which way it points.
 *
 * Rules 295 to 303 of `validation/slabStrikeRules.ts`. The data is Slab2 cut
 * into ten-degree tiles by `scripts/build-slab2.py` — one PNG a tile, strike in
 * the red channel, depth in green, Slab2's own depth uncertainty in blue, and a
 * green of zero for a cell the clipping mask excludes.
 *
 * This module turns tiles into the field rule 298 walks. It reads; it decides
 * nothing. What is done with a sample is rules 296, 297 and 300, and those live
 * in `strikeSource.ts`.
 */

/** The index `scripts/build-slab2.py` writes beside the tiles. */
export interface SlabTileIndex {
  source: string;
  citation: string;
  doi: string;
  dataDoi: string;
  licence: string;
  zones: readonly string[];
  cellDeg: number;
  tileDeg: number;
  tilePx: number;
  rowsFromNorth: boolean;
  strikeStepDeg: number;
  depthStepM: number;
  uncertaintyStepM: number;
  nodes: number;
  tiles: readonly string[];
}

/** A tile as its three channels, row-major from the north edge. */
export interface SlabTile {
  strike: Uint8Array;
  depth: Uint8Array;
  uncertainty: Uint8Array;
}

/** How many lattice nodes there are around the planet, and up it. */
const NODES_PER_DEG = Math.round(1 / SLAB_CELL_DEG);
const N_LON = Math.round(360 * NODES_PER_DEG);
const N_LAT = Math.round(180 * NODES_PER_DEG);

/** Where a lattice node lives: which tile, and which pixel of it. */
export interface NodeAddress {
  key: string;
  /** Pixel column, west to east. */
  x: number;
  /** Pixel row, north to south. */
  y: number;
}

/** The address of lattice node (gi, gj), counted from the south pole and the
 *  antimeridian. Longitude wraps; latitude clamps at the poles, where there is
 *  no slab in any case. */
export function nodeAddress(gi: number, gj: number, tilePx: number): NodeAddress {
  const i = Math.min(N_LAT - 1, Math.max(0, gi));
  const j = ((gj % N_LON) + N_LON) % N_LON;
  const row = Math.floor(i / tilePx);
  const col = Math.floor(j / tilePx);
  return {
    key: `${col.toString()}_${row.toString()}`,
    x: j - col * tilePx,
    y: tilePx - 1 - (i - row * tilePx),
  };
}

/** Where a place falls on the lattice, in nodes from the south pole and from
 *  the antimeridian — the origin `faultTileKey` counts tiles from, so that one
 *  click reads tile `c_r` of each. */
export function latticePosition(latitude: number, longitude: number): { fi: number; fj: number } {
  const lon = (((longitude + 180) % 360) + 360) % 360;
  return { fi: (latitude + 90) * NODES_PER_DEG, fj: lon * NODES_PER_DEG };
}

/** The lattice node nearest a place, as a pair of indices. */
export function nearestNode(latitude: number, longitude: number): { gi: number; gj: number } {
  const { fi, fj } = latticePosition(latitude, longitude);
  return { gi: Math.round(fi), gj: Math.round(fj) };
}

/** What one node carries, or nothing where the clipping mask excluded it. */
function nodeSample(
  getTile: (key: string) => SlabTile | null,
  index: SlabTileIndex,
  gi: number,
  gj: number
): SlabSample | null {
  if (gi < 0 || gi >= N_LAT) return null;
  const { key, x, y } = nodeAddress(gi, gj, index.tilePx);
  const tile = getTile(key);
  if (tile === null) return null;
  const at = y * index.tilePx + x;
  const depthM = decodeDepthByte(tile.depth[at] ?? 0);
  if (depthM === null) return null;
  return {
    strikeDeg: decodeStrikeByte(tile.strike[at] ?? 0),
    depthM,
    depthUncertaintyM: decodeUncertaintyByte(tile.uncertainty[at] ?? 0),
  };
}

/**
 * Rule 298's field: a slab sampled at a place.
 *
 * The mask is the nearest node — a point whose nearest node the model excluded
 * is outside the model, and no neighbour makes it otherwise. Inside it, the
 * value is interpolated bilinearly over the four surrounding nodes, counting
 * only the ones the mask kept and renormalising the weights, so the field is
 * smooth in the interior and does not invent a slab at the edge. The strike is
 * averaged on the unit vector (rule 298); depth and uncertainty are scalars and
 * are averaged as they are.
 */
export function makeSlabField(
  index: SlabTileIndex,
  getTile: (key: string) => SlabTile | null
): SlabField {
  return (latitude: number, longitude: number): SlabSample | null => {
    const nearest = nearestNode(latitude, longitude);
    if (nodeSample(getTile, index, nearest.gi, nearest.gj) === null) return null;

    const { fi, fj } = latticePosition(latitude, longitude);
    const i0 = Math.floor(fi);
    const j0 = Math.floor(fj);
    const ti = fi - i0;
    const tj = fj - j0;

    const corners: { sample: SlabSample; weight: number }[] = [];
    for (const [di, wi] of [
      [0, 1 - ti],
      [1, ti],
    ] as const) {
      for (const [dj, wj] of [
        [0, 1 - tj],
        [1, tj],
      ] as const) {
        const w = wi * wj;
        if (w <= 0) continue;
        const sample = nodeSample(getTile, index, i0 + di, j0 + dj);
        if (sample === null) continue;
        corners.push({ sample, weight: w });
      }
    }
    if (corners.length === 0) return null;
    let total = 0;
    let depthM = 0;
    let uncertaintyM = 0;
    for (const c of corners) {
      total += c.weight;
      depthM += c.weight * c.sample.depthM;
      uncertaintyM += c.weight * c.sample.depthUncertaintyM;
    }
    if (!(total > 0)) return null;
    const strikeDeg = meanDirectionDeg(
      corners.map((c) => ({ deg: c.sample.strikeDeg, weight: c.weight }))
    );
    if (strikeDeg === null) return null;
    return {
      strikeDeg,
      depthM: depthM / total,
      depthUncertaintyM: uncertaintyM / total,
    };
  };
}

/** Which tile holds a place — the same ten-degree grid the faults use. */
export function slabTileKey(latitude: number, longitude: number): string {
  const { gi, gj } = nearestNode(latitude, longitude);
  return nodeAddress(gi, gj, Math.round(SLAB_TILE_DEG / SLAB_CELL_DEG)).key;
}
