import { describe, expect, it } from 'vitest';
import { makeElevationGrid, type ElevationGrid } from '../elevation/index.js';
import { computeTsunamiArrivalField } from './fastMarching.js';
import { findPropagationSeeds, waterBodyReaches } from './sourcePlacement.js';

/**
 * A synthetic peninsula: 101 × 101 cells over ±2° (≈ ±222 km), land
 * (+20 m) in a north–south band |lon| ≤ 0.6°, deep ocean (−3 000 m)
 * on both sides, with a shallow 5 m bay biting into the west coast
 * and an inland lake (−19 m, 3 × 3 cells) at the centre — the Florida
 * traps, in miniature.
 */
function peninsula(): ElevationGrid {
  const N = 101;
  const samples = new Float32Array(N * N);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const lon = -2 + (j / (N - 1)) * 4;
      const lat = 2 - (i / (N - 1)) * 4;
      let z = -3_000;
      if (Math.abs(lon) <= 0.6) z = 20;
      // Shallow bay on the west coast, 0.2° wide, 5 m deep.
      if (lon > -0.8 && lon <= -0.6 && Math.abs(lat) < 0.3) z = -5;
      // Inland lake at the centre.
      if (Math.abs(lon) <= 0.06 && Math.abs(lat) <= 0.06) z = -19;
      samples[i * N + j] = z;
    }
  }
  return makeElevationGrid({
    minLat: -2,
    maxLat: 2,
    minLon: -2,
    maxLon: 2,
    nLat: N,
    nLon: N,
    samples,
  });
}

/** Coarse mask on which the whole land band, lake included, is +20 m. */
function coarseMask(): ElevationGrid {
  const N = 21;
  const samples = new Float32Array(N * N);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const lon = -2 + (j / (N - 1)) * 4;
      samples[i * N + j] = Math.abs(lon) <= 0.7 ? 20 : -3_000;
    }
  }
  return makeElevationGrid({
    minLat: -2,
    maxLat: 2,
    minLon: -2,
    maxLon: 2,
    nLat: N,
    nLon: N,
    samples,
  });
}

describe('waterBodyReaches', () => {
  it('accepts the ocean and rejects the lake and the shallow bay', () => {
    const grid = peninsula();
    // Ocean cell far west.
    expect(waterBodyReaches(grid, 50, 5, 10, 24)).toBe(true);
    // Lake: 3 × 3 = 9 cells < 24.
    expect(waterBodyReaches(grid, 50, 50, 10, 24)).toBe(false);
    // Bay: 5 m < 10 m floor.
    expect(waterBodyReaches(grid, 50, 32, 10, 24)).toBe(false);
  });
});

describe('findPropagationSeeds', () => {
  it('an origin in the sea is its own single seed', () => {
    const seeds = findPropagationSeeds(peninsula(), 0, -1.5, { maxRadiusM: 500_000 });
    expect(seeds).toHaveLength(1);
    expect(seeds[0]?.distanceM).toBe(0);
    expect(seeds[0]?.depthM).toBe(3_000);
  });

  it('an inland origin gets one seed on each coast, not the lake, not the bay', () => {
    const seeds = findPropagationSeeds(peninsula(), 0, 0.2, {
      maxRadiusM: 500_000,
      sectors: 8,
    });
    expect(seeds.length).toBeGreaterThanOrEqual(2);
    // Every seed is deep water.
    for (const s of seeds) expect(s.depthM).toBeGreaterThanOrEqual(10);
    // Both coasts represented: some seeds west of the land band, some east.
    expect(seeds.some((s) => s.longitude < -0.6)).toBe(true);
    expect(seeds.some((s) => s.longitude > 0.6)).toBe(true);
    // No seed inside the lake (|lon| ≤ 0.06).
    expect(seeds.some((s) => Math.abs(s.longitude) <= 0.06)).toBe(false);
    // Sorted nearest first: the east coast is closer to lon 0.2.
    expect(seeds[0]?.longitude).toBeGreaterThan(0.6);
  });

  it('the sea mask vetoes tile water the planetary grid calls land', () => {
    // A grid where the "lake" is big and deep enough to pass the body
    // test on its own (9 × 9 cells at −50 m) — only the mask can reject it.
    const N = 101;
    const samples = new Float32Array(N * N);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const lon = -2 + (j / (N - 1)) * 4;
        const lat = 2 - (i / (N - 1)) * 4;
        let z = Math.abs(lon) <= 0.6 ? 20 : -3_000;
        if (Math.abs(lon) <= 0.18 && Math.abs(lat) <= 0.18) z = -50;
        samples[i * N + j] = z;
      }
    }
    const grid = makeElevationGrid({
      minLat: -2,
      maxLat: 2,
      minLon: -2,
      maxLon: 2,
      nLat: N,
      nLon: N,
      samples,
    });
    const unmasked = findPropagationSeeds(grid, 0, 0.3, { maxRadiusM: 500_000 });
    expect(unmasked.some((s) => Math.abs(s.longitude) <= 0.18)).toBe(true);
    const masked = findPropagationSeeds(grid, 0, 0.3, {
      maxRadiusM: 500_000,
      seaMask: coarseMask(),
    });
    expect(masked.some((s) => Math.abs(s.longitude) <= 0.18)).toBe(false);
    expect(masked.length).toBeGreaterThan(0);
  });

  it('returns nothing when the sea is beyond the reach', () => {
    // From the centre the coast is ≈ 0.6° ≈ 67 km away; a 20 km reach finds nothing.
    expect(findPropagationSeeds(peninsula(), 0, 0, { maxRadiusM: 20_000 })).toEqual([]);
  });

  it('seeds feed the solver: every basin gets an arrival field', () => {
    const grid = peninsula();
    const seeds = findPropagationSeeds(grid, 0, 0.2, { maxRadiusM: 500_000 });
    const field = computeTsunamiArrivalField({
      grid,
      sourceLatitude: 0,
      sourceLongitude: 0.2,
      sources: seeds,
    });
    // Far west and far east cells are both reached.
    const west = field.arrivalTimes[50 * 101 + 3];
    const east = field.arrivalTimes[50 * 101 + 97];
    expect(west).toBeDefined();
    expect(east).toBeDefined();
    expect(Number.isFinite(west)).toBe(true);
    expect(Number.isFinite(east)).toBe(true);
    expect(field.reachableCount).toBeGreaterThan(1_000);
    // Whereas the old single land source reaches nothing.
    const single = computeTsunamiArrivalField({ grid, sourceLatitude: 0, sourceLongitude: 0.2 });
    expect(single.reachableCount).toBe(1);
  });
});
