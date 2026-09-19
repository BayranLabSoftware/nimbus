import { describe, expect, it } from 'vitest';
import { makeElevationGrid, type ElevationGrid } from '../elevation/index.js';
import { nearestSeaForImpact } from '../../store/useAppStore.js';
import { RESOLUTION_FLOOR_CELLS } from './shoreDistanceRules.js';

/**
 * Rules 241 and 242, on grids whose geography is known because it is made
 * here. The four real points of rule 243 want real terrain tiles and are
 * measured by scripts/benchmark/shore-distance.ts against the running app;
 * what is held here is the arithmetic those readings rest on.
 *
 * The rules were fixed and pushed (commit 9f1178f) before the candidate was
 * written.
 */

const EARTH_RADIUS_M = 6_371_000;
const degToM = (deg: number): number => (deg * Math.PI * EARTH_RADIUS_M) / 180;

/** A coarse mosaic: the whole square is deep water except one land cell at the
 *  centre, which is where the event is. At this spacing the cell is enormous,
 *  which is the point. */
function coarseMosaic(spacingDeg: number): ElevationGrid {
  const N = 11;
  const half = (spacingDeg * (N - 1)) / 2;
  const samples = new Float32Array(N * N).fill(-3_000);
  return makeElevationGrid({
    minLat: -half,
    maxLat: half,
    minLon: -half,
    maxLon: half,
    nLat: N,
    nLon: N,
    samples,
  });
}

/** A fine tile over the same centre: land everywhere except a strip of sea
 *  `seaAtDeg` to the east. */
function fineTile(seaAtDeg: number): ElevationGrid {
  const N = 201;
  const half = 0.5;
  const samples = new Float32Array(N * N);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const lon = -half + (j / (N - 1)) * 2 * half;
      samples[i * N + j] = lon >= seaAtDeg ? -50 : 20;
    }
  }
  return makeElevationGrid({
    minLat: -half,
    maxLat: half,
    minLon: -half,
    maxLon: half,
    nLat: N,
    nLon: N,
    samples,
  });
}

describe('rules 241 to 247 — a coastline is not nearer than its map', () => {
  it('rule 241(b): a mosaic cannot say nought metres from a cell tens of kilometres wide', () => {
    // The planetary grid is zoom 2: 1 024 cells around the equator, a little
    // over 39 km each. Before the round this returned distance 0 for any point
    // whose own cell read water, which is every coastal point on Earth.
    const spacingDeg = 360 / 1_024;
    const mosaic = coarseMosaic(spacingDeg);
    const answer = nearestSeaForImpact(mosaic, mosaic, { latitude: 0, longitude: 0 });
    expect(answer).not.toBeNull();
    const floor = RESOLUTION_FLOOR_CELLS * degToM(spacingDeg);
    expect(floor / 1_000).toBeCloseTo(19.6, 0);
    expect(answer?.distanceM ?? 0).toBeGreaterThanOrEqual(floor * 0.999);
  });

  it('rule 241(a): the fine tile answers where it has anything to say', () => {
    // The mosaic would claim the sea is under the event. The tile knows it is
    // a tenth of a degree east, about 11 km, and that is the answer.
    const spacingDeg = 360 / 1_024;
    const mosaic = coarseMosaic(spacingDeg);
    const tile = fineTile(0.1);
    const answer = nearestSeaForImpact(tile, mosaic, { latitude: 0, longitude: 0 });
    expect(answer).not.toBeNull();
    const d = answer?.distanceM ?? 0;
    expect(d / 1_000).toBeGreaterThan(9);
    expect(d / 1_000).toBeLessThan(14);
    // And it is nowhere near the mosaic's floor, which would have been 19.6 km.
    expect(d).toBeLessThan(RESOLUTION_FLOOR_CELLS * degToM(spacingDeg));
  });

  it('rule 241(a): the mosaic answers only where the tile has nothing to say', () => {
    // A tile that is land from edge to edge: the sea is beyond it, and the
    // mosaic is all there is — floored to its own cell.
    const spacingDeg = 360 / 1_024;
    const mosaic = coarseMosaic(spacingDeg);
    const allLand = fineTile(2);
    const answer = nearestSeaForImpact(allLand, mosaic, { latitude: 0, longitude: 0 });
    expect(answer).not.toBeNull();
    expect(answer?.distanceM ?? 0).toBeGreaterThanOrEqual(
      RESOLUTION_FLOOR_CELLS * degToM(spacingDeg) * 0.999
    );
  });

  it('rule 241(b): the fine tile’s own floor is small enough to change nothing it says', () => {
    // 201 cells over one degree: the floor is under 300 m, where the answers
    // this map gives are kilometres.
    const tileSpacingDeg = 1 / 200;
    expect(RESOLUTION_FLOOR_CELLS * degToM(tileSpacingDeg)).toBeLessThan(300);
  });
});
