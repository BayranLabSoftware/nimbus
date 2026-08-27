import { describe, expect, it } from 'vitest';
import { buildCrestFrames, finitePercentile, stitchSegmentsIntoChains } from './tsunamiCrest.js';

describe('stitchSegmentsIntoChains', () => {
  it('joins segments sharing endpoints into one ordered chain', () => {
    const chains = stitchSegmentsIntoChains(
      [
        { lat1: 0, lon1: 0, lat2: 0, lon2: 1 },
        { lat1: 0, lon1: 1, lat2: 1, lon2: 1 },
        { lat1: 1, lon1: 1, lat2: 1, lon2: 2 },
      ],
      2
    );
    expect(chains).toHaveLength(1);
    expect(chains[0]).toHaveLength(4);
    const lats = chains[0]!.map((p) => p.lat);
    const lons = chains[0]!.map((p) => p.lon);
    expect(lats[0]).toBe(0);
    expect(lons[0]).toBe(0);
    expect(lats[3]).toBe(1);
    expect(lons[3]).toBe(2);
  });

  it('grows a chain in both directions from the seed segment', () => {
    // Seed order puts the middle segment first: stitching must extend
    // both head and tail.
    const chains = stitchSegmentsIntoChains(
      [
        { lat1: 0, lon1: 1, lat2: 0, lon2: 2 },
        { lat1: 0, lon1: 0, lat2: 0, lon2: 1 },
        { lat1: 0, lon1: 2, lat2: 0, lon2: 3 },
      ],
      2
    );
    expect(chains).toHaveLength(1);
    expect(chains[0]).toHaveLength(4);
    expect(chains[0]!.map((p) => p.lon)).toEqual([0, 1, 2, 3]);
  });

  it('keeps disconnected islands as separate chains and drops specks', () => {
    const chains = stitchSegmentsIntoChains(
      [
        { lat1: 0, lon1: 0, lat2: 0, lon2: 1 },
        { lat1: 0, lon1: 1, lat2: 1, lon2: 1 },
        // Disconnected two-point speck, below minChainPoints=3.
        { lat1: 40, lon1: 40, lat2: 40, lon2: 41 },
      ],
      3
    );
    expect(chains).toHaveLength(1);
  });

  it('discards segments that jump the antimeridian', () => {
    const chains = stitchSegmentsIntoChains([{ lat1: 0, lon1: -179, lat2: 0, lon2: 179 }], 2);
    expect(chains).toHaveLength(0);
  });
});

describe('finitePercentile', () => {
  it('ignores Infinity and NaN', () => {
    const v = new Float32Array([1, 2, 3, 4, Number.POSITIVE_INFINITY, Number.NaN]);
    expect(finitePercentile(v, 1)).toBe(4);
    expect(finitePercentile(v, 0)).toBe(1);
  });

  it('returns 0 on a field with no finite values', () => {
    expect(finitePercentile(new Float32Array([Number.NaN]), 0.5)).toBe(0);
  });
});

describe('buildCrestFrames', () => {
  // Radial travel-time bowl: t = distance from grid centre, land
  // (NaN) in one corner. Iso-time contours are concentric arcs.
  const n = 41;
  const times = new Float32Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const di = i - 20;
      const dj = j - 20;
      times[i * n + j] = Math.sqrt(di * di + dj * dj) * 100;
    }
  }
  times[0] = Number.NaN;

  const bounds = { minLat: -20, maxLat: 20, minLon: -20, maxLon: 20 };

  it('produces the requested number of frames with ascending times', () => {
    const frames = buildCrestFrames({
      arrivalTimes: times,
      nLat: n,
      nLon: n,
      ...bounds,
      frameCount: 8,
    });
    expect(frames).toHaveLength(8);
    for (let k = 1; k < frames.length; k++) {
      expect(frames[k]!.timeSeconds).toBeGreaterThan(frames[k - 1]!.timeSeconds);
    }
  });

  it('draws closed-ish ring chains around the source', () => {
    const frames = buildCrestFrames({
      arrivalTimes: times,
      nLat: n,
      nLon: n,
      ...bounds,
      frameCount: 6,
    });
    const mid = frames[2]!;
    expect(mid.chains.length).toBeGreaterThan(0);
    // Every chain point sits at roughly the same radius from centre.
    const radii = mid.chains.flat().map((p) => Math.hypot(p.lat, p.lon));
    const min = Math.min(...radii);
    const max = Math.max(...radii);
    expect(max - min).toBeLessThan(2.5);
  });

  it('returns [] when the field has no finite arrivals', () => {
    const dead = new Float32Array(9).fill(Number.POSITIVE_INFINITY);
    expect(
      buildCrestFrames({
        arrivalTimes: dead,
        nLat: 3,
        nLon: 3,
        minLat: 0,
        maxLat: 1,
        minLon: 0,
        maxLon: 1,
      })
    ).toEqual([]);
  });

  it('stride sampling still yields contours', () => {
    const frames = buildCrestFrames({
      arrivalTimes: times,
      nLat: n,
      nLon: n,
      ...bounds,
      frameCount: 5,
      stride: 2,
    });
    expect(frames).toHaveLength(5);
    expect(frames[2]!.chains.length).toBeGreaterThan(0);
  });
});
