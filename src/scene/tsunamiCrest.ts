import type { IsochroneSegment } from '../physics/tsunami/isochrones.js';

/**
 * The travelling crest — «la cresta, non la coperta» from the approved
 * tsunami art direction. The FMM arrival-time field already knows
 * where the wave front sits at every instant; this module resamples
 * it into a small set of animation frames, each holding the iso-time
 * contour of the front stitched into drawable polyline chains.
 *
 * Everything here is pure geometry on typed arrays so it unit-tests
 * without Cesium; the Globe layer turns chains into ground polylines
 * with a glow material and steps through frames on a rAF clock.
 */

export interface CrestPoint {
  lat: number;
  lon: number;
}

export interface CrestFrame {
  /** Arrival-time threshold this frame represents (s). */
  timeSeconds: number;
  /** Contour stitched into polyline chains, ready to draw. */
  chains: CrestPoint[][];
}

export interface CrestFramesInput {
  arrivalTimes: ArrayLike<number>;
  nLat: number;
  nLon: number;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  /** Number of animation frames (default 28). */
  frameCount?: number;
  /** Percentile of finite arrival times that maps to the last frame
   *  (default 0.95 — the tail of the field is asymptotic and would
   *  park the crest on the far shore for most of the loop). */
  endPercentile?: number;
  /** Sampling stride over the grid (default 1). Stride 2 quarters the
   *  marching-squares cost on the 1024² global field at a resolution
   *  loss the glow width swallows anyway. */
  stride?: number;
  /** Drop chains with fewer points than this (default 4) — specks of
   *  contour around single cells read as noise, not as a front. */
  minChainPoints?: number;
}

/**
 * Marching squares specialised for the TRAVELLING FRONT. The generic
 * contour extractor treats land / unreachable cells (NaN, ∞) as
 * "outside", which makes every iso-time contour also trace the whole
 * coastline of the already-reached region — the drawn line is then
 * 90% static coast outline and 10% moving front. Here a cell square
 * is skipped outright unless all four corners are finite water, so
 * the contour exists only in open water and simply dies at the coast,
 * as a wave front does.
 */
export function extractFrontContour(input: {
  values: ArrayLike<number>;
  nLat: number;
  nLon: number;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
  threshold: number;
}): IsochroneSegment[] {
  const { values, nLat, nLon, minLat, maxLat, minLon, maxLon, threshold } = input;
  const dLat = (maxLat - minLat) / (nLat - 1);
  const dLon = (maxLon - minLon) / (nLon - 1);
  const segments: IsochroneSegment[] = [];

  const cross = (
    v1: number,
    v2: number,
    latA: number,
    lonA: number,
    latB: number,
    lonB: number
  ): CrestPoint => {
    const t = Math.max(0, Math.min(1, (threshold - v1) / (v2 - v1)));
    return { lat: latA + t * (latB - latA), lon: lonA + t * (lonB - lonA) };
  };

  for (let i = 0; i < nLat - 1; i++) {
    const latN = maxLat - i * dLat;
    const latS = latN - dLat;
    for (let j = 0; j < nLon - 1; j++) {
      const lonW = minLon + j * dLon;
      const lonE = lonW + dLon;
      const vNW = values[i * nLon + j] ?? Number.NaN;
      const vNE = values[i * nLon + (j + 1)] ?? Number.NaN;
      const vSE = values[(i + 1) * nLon + (j + 1)] ?? Number.NaN;
      const vSW = values[(i + 1) * nLon + j] ?? Number.NaN;
      if (
        !Number.isFinite(vNW) ||
        !Number.isFinite(vNE) ||
        !Number.isFinite(vSE) ||
        !Number.isFinite(vSW)
      ) {
        continue;
      }
      const mask =
        (vNW < threshold ? 8 : 0) |
        (vNE < threshold ? 4 : 0) |
        (vSE < threshold ? 2 : 0) |
        (vSW < threshold ? 1 : 0);
      if (mask === 0 || mask === 15) continue;

      const north = (): CrestPoint => cross(vNW, vNE, latN, lonW, latN, lonE);
      const east = (): CrestPoint => cross(vNE, vSE, latN, lonE, latS, lonE);
      const south = (): CrestPoint => cross(vSW, vSE, latS, lonW, latS, lonE);
      const west = (): CrestPoint => cross(vNW, vSW, latN, lonW, latS, lonW);

      const emit = (a: CrestPoint, b: CrestPoint): void => {
        segments.push({ lat1: a.lat, lon1: a.lon, lat2: b.lat, lon2: b.lon });
      };

      switch (mask) {
        case 1:
        case 14:
          emit(west(), south());
          break;
        case 2:
        case 13:
          emit(south(), east());
          break;
        case 3:
        case 12:
          emit(west(), east());
          break;
        case 4:
        case 11:
          emit(north(), east());
          break;
        case 5:
          emit(west(), north());
          emit(south(), east());
          break;
        case 6:
        case 9:
          emit(north(), south());
          break;
        case 7:
        case 8:
          emit(west(), north());
          break;
        case 10:
          emit(north(), east());
          emit(west(), south());
          break;
        default:
          break;
      }
    }
  }
  return segments;
}

/** Quantise an endpoint so shared segment ends hash identically. */
function keyOf(lat: number, lon: number): string {
  return `${Math.round(lat * 5000).toString()}:${Math.round(lon * 5000).toString()}`;
}

/**
 * Stitch loose marching-squares segments into ordered chains by
 * walking shared endpoints. Greedy and linear: each segment is used
 * once, chains grow from both ends. Antimeridian-jumping segments are
 * discarded up front (they would draw across the whole planet).
 */
export function stitchSegmentsIntoChains(
  segments: readonly IsochroneSegment[],
  minChainPoints = 4
): CrestPoint[][] {
  interface Node {
    seg: IsochroneSegment;
    used: boolean;
  }
  const nodes: Node[] = [];
  const byEnd = new Map<string, Node[]>();
  for (const seg of segments) {
    if (Math.abs(seg.lon2 - seg.lon1) > 180) continue;
    const node: Node = { seg, used: false };
    nodes.push(node);
    for (const k of [keyOf(seg.lat1, seg.lon1), keyOf(seg.lat2, seg.lon2)]) {
      const list = byEnd.get(k);
      if (list === undefined) byEnd.set(k, [node]);
      else list.push(node);
    }
  }

  const takeNeighbour = (lat: number, lon: number): Node | undefined => {
    const list = byEnd.get(keyOf(lat, lon));
    if (list === undefined) return undefined;
    for (const node of list) {
      if (!node.used) return node;
    }
    return undefined;
  };

  const chains: CrestPoint[][] = [];
  for (const start of nodes) {
    if (start.used) continue;
    start.used = true;
    const chain: CrestPoint[] = [
      { lat: start.seg.lat1, lon: start.seg.lon1 },
      { lat: start.seg.lat2, lon: start.seg.lon2 },
    ];
    // Grow forward from the tail, then backward from the head.
    for (const dir of ['tail', 'head'] as const) {
      for (;;) {
        const end = dir === 'tail' ? chain[chain.length - 1] : chain[0];
        if (end === undefined) break;
        const next = takeNeighbour(end.lat, end.lon);
        if (next === undefined) break;
        next.used = true;
        const k = keyOf(end.lat, end.lon);
        const fromP1 = keyOf(next.seg.lat1, next.seg.lon1) === k;
        const point: CrestPoint = fromP1
          ? { lat: next.seg.lat2, lon: next.seg.lon2 }
          : { lat: next.seg.lat1, lon: next.seg.lon1 };
        if (dir === 'tail') chain.push(point);
        else chain.unshift(point);
      }
    }
    if (chain.length >= minChainPoints) chains.push(chain);
  }
  return chains;
}

/** Percentile of the finite values in a field (p ∈ [0, 1]). */
export function finitePercentile(values: ArrayLike<number>, p: number): number {
  const finite: number[] = [];
  for (const v of Array.prototype.slice.call(values) as number[]) {
    if (Number.isFinite(v)) finite.push(v);
  }
  if (finite.length === 0) return 0;
  finite.sort((a, b) => a - b);
  const idx = Math.min(finite.length - 1, Math.max(0, Math.round(p * (finite.length - 1))));
  return finite[idx] ?? 0;
}

/**
 * Resample the arrival-time field into crest animation frames.
 * Frame times sit on QUANTILES of the finite arrival distribution, so
 * every frame advances the front across an equal share of the reached
 * ocean: the crossing of the source basin gets as many frames as the
 * slow trans-oceanic tail, instead of being swallowed by frame one.
 */
export function buildCrestFrames(input: CrestFramesInput): CrestFrame[] {
  const frameCount = input.frameCount ?? 28;
  const endPercentile = input.endPercentile ?? 0.95;
  const stride = Math.max(1, Math.floor(input.stride ?? 1));
  const minChainPoints = input.minChainPoints ?? 4;

  let values: ArrayLike<number> = input.arrivalTimes;
  let nLat = input.nLat;
  let nLon = input.nLon;
  if (stride > 1) {
    const sLat = Math.max(2, Math.floor(input.nLat / stride));
    const sLon = Math.max(2, Math.floor(input.nLon / stride));
    const sampled = new Float32Array(sLat * sLon);
    for (let i = 0; i < sLat; i++) {
      for (let j = 0; j < sLon; j++) {
        sampled[i * sLon + j] =
          input.arrivalTimes[i * stride * input.nLon + j * stride] ?? Number.POSITIVE_INFINITY;
      }
    }
    values = sampled;
    nLat = sLat;
    nLon = sLon;
  }

  // One sort serves all quantiles — 28 independent percentile calls
  // would re-sort the ~10^5-cell field every time.
  const finite: number[] = [];
  for (const v of Array.prototype.slice.call(values) as number[]) {
    if (Number.isFinite(v)) finite.push(v);
  }
  if (finite.length === 0) return [];
  finite.sort((a, b) => a - b);
  const quantile = (q: number): number =>
    finite[Math.min(finite.length - 1, Math.max(0, Math.round(q * (finite.length - 1))))] ?? 0;
  if (quantile(endPercentile) <= 0) return [];
  const thresholds: number[] = [];
  for (let k = 1; k <= frameCount; k++) {
    thresholds.push(quantile((k / frameCount) * endPercentile));
  }

  return thresholds.map((threshold) => ({
    timeSeconds: threshold,
    chains: stitchSegmentsIntoChains(
      extractFrontContour({
        values,
        nLat,
        nLon,
        minLat: input.minLat,
        maxLat: input.maxLat,
        minLon: input.minLon,
        maxLon: input.maxLon,
        threshold,
      }),
      minChainPoints
    ),
  }));
}
