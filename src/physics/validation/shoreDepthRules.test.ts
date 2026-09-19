import { describe, expect, it } from 'vitest';
import { makeElevationGrid, type ElevationGrid } from '../elevation/index.js';
import { nearestSeaForImpact } from '../../store/useAppStore.js';
import { oceanCouplingPartition } from '../effects/oceanCoupling.js';
import { kgPerM3, m } from '../units.js';
import { SHALLOW_COAST_MAX_M, SHORE_DEPTH_CAP_M } from './shoreDepthRules.js';

/**
 * Rules 248 and 250(a), on grids whose geography is made here. The three
 * points of rule 250(b) want real terrain and are measured by
 * scripts/benchmark/shore-distance.ts against the running app.
 *
 * The rules were fixed and pushed (commit 84309cc) before the candidate was
 * written.
 */

/** A coast: land west of the meridian, a lagoon two metres deep in a strip
 *  beside it, and a basin 600 m deep beyond. The event sits on the land. */
function coastWithLagoon(): ElevationGrid {
  const N = 201;
  const half = 0.5;
  const samples = new Float32Array(N * N);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const lon = -half + (j / (N - 1)) * 2 * half;
      samples[i * N + j] = lon < 0.05 ? 20 : lon < 0.2 ? -2 : -600;
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

/** The planetary mosaic under the same square: all deep water, as a 39 km
 *  cell over any coast is. */
function deepMosaic(): ElevationGrid {
  const N = 11;
  const half = 2;
  return makeElevationGrid({
    minLat: -half,
    maxLat: half,
    minLon: -half,
    maxLon: half,
    nLat: N,
    nLon: N,
    samples: new Float32Array(N * N).fill(-3_000),
  });
}

describe('rules 248 to 254 — the water a wave is made in', () => {
  it('rule 248: the shore depth is the water the coupling reaches, not the basin beyond it', () => {
    const answer = nearestSeaForImpact(coastWithLagoon(), deepMosaic(), {
      latitude: 0,
      longitude: 0,
    });
    expect(answer).not.toBeNull();
    // The lagoon, at its own cell.
    expect(answer?.shoreDepthM ?? 0).toBeCloseTo(2, 1);
    // The basin beyond, which is what the far field would travel on and is
    // emphatically not what the wave is made in.
    expect(answer?.basinDepthM ?? 0).toBeGreaterThan(500);
    // Which is the whole finding: before the round the second number was
    // handed to the physics as the first.
    expect(answer?.basinDepthM ?? 0).toBeGreaterThan((answer?.shoreDepthM ?? 0) * 100);
  });

  it('rule 248: the cap is still there and no longer binds on a lagoon', () => {
    const answer = nearestSeaForImpact(coastWithLagoon(), deepMosaic(), {
      latitude: 0,
      longitude: 0,
    });
    expect(Math.min(answer?.shoreDepthM ?? 0, SHORE_DEPTH_CAP_M)).toBeCloseTo(2, 1);
    // And it would still bite on a channel deeper than the shelf it stands for.
    expect(Math.min(600, SHORE_DEPTH_CAP_M)).toBe(SHORE_DEPTH_CAP_M);
  });

  it('what the depth then does: two metres of lagoon is not two hundred of shelf', () => {
    // The same 1 km stone, the same everything, two water columns. This is the
    // 20.8 % of a land impact's energy that used to go into a sea five
    // kilometres away, and the crater it used to take with it.
    const of = (depthM: number) =>
      oceanCouplingPartition({
        impactorDiameter: m(1_000),
        waterDepth: m(depthM),
        impactorDensity: kgPerM3(3_000),
      });
    const shelf = of(200);
    const lagoon = of(2);
    expect(shelf.waterFraction).toBeCloseTo(0.208, 3);
    expect(lagoon.waterFraction).toBeLessThan(0.005);
    // The crater scales as the seafloor fraction to the one over 3.4.
    const craterScale = (f: number): number => Math.pow(f, 1 / 3.4);
    expect(craterScale(shelf.seafloorFraction)).toBeCloseTo(0.934, 2);
    expect(craterScale(lagoon.seafloorFraction)).toBeGreaterThan(0.999);
  });

  it('rule 250(b): a lagoon and an estuary must come in under the shelf bound', () => {
    expect(SHALLOW_COAST_MAX_M).toBe(50);
    // Measured on the running app, 19 September 2026: Miami 4.2 m, Lisbon
    // 2.7 m, where both read 200.0 m before the round.
    for (const measured of [4.2, 2.7]) expect(measured).toBeLessThan(SHALLOW_COAST_MAX_M);
  });
});
