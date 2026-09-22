import { describe, expect, it } from 'vitest';
import {
  buildCrestFrames,
  finitePercentile,
  pickRunupPeaks,
  stitchSegmentsIntoChains,
  runupCellsBeyondTile,
} from './tsunamiCrest.js';

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

  it('B-118 gives the source basin its frames when the wave crosses a planet', () => {
    // A basin five cells across, crossed in two hours, opening on an ocean
    // a hundred cells across that the wave takes a day to fill: the basin is
    // under 1 % of the reached cells, which the old quantiles gave no frame.
    const N = 101;
    const field = new Float32Array(N * N);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const r = Math.hypot(i - 50, j - 50);
        field[i * N + j] = r <= 5 ? r * 1_440 : 7_200 + (r - 5) * 1_200;
      }
    }
    const frames = buildCrestFrames({
      arrivalTimes: field,
      nLat: N,
      nLon: N,
      minLat: -50,
      maxLat: 50,
      minLon: -50,
      maxLon: 50,
      frameCount: 28,
      endPercentile: 0.85,
    });
    expect(frames).toHaveLength(28);
    const inBasin = frames.filter((f) => f.timeSeconds < 7_200);
    expect(inBasin.length).toBeGreaterThanOrEqual(5);
    const first = frames.find((f) => f.chains.length > 0);
    const reach = Math.max(...(first?.chains.flat().map((p) => Math.hypot(p.lat, p.lon)) ?? [99]));
    expect(reach).toBeLessThan(5);
    // A logarithmic clock: the same ratio between each frame and the next.
    const ratio = (frames[1]?.timeSeconds ?? 0) / (frames[0]?.timeSeconds ?? 1);
    expect((frames[20]?.timeSeconds ?? 0) / (frames[19]?.timeSeconds ?? 1)).toBeCloseTo(ratio, 9);
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

describe('pickRunupPeaks', () => {
  it('keeps only the strongest cell per bin, sorted descending', () => {
    const peaks = pickRunupPeaks(
      [
        { latitude: 10.1, longitude: 20.1, runupM: 3 },
        { latitude: 10.4, longitude: 20.3, runupM: 7 }, // stesso bin 2°, vince
        { latitude: 40.0, longitude: -5.0, runupM: 4 },
      ],
      { binDeg: 2, minRunupM: 2, maxCount: 10 }
    );
    expect(peaks.map((p) => p.runupM)).toEqual([7, 4]);
  });

  it('drops cells below the threshold and honours maxCount', () => {
    const cells = Array.from({ length: 30 }, (_, i) => ({
      latitude: i * 3,
      longitude: 0,
      runupM: i * 0.5,
    }));
    const peaks = pickRunupPeaks(cells, { binDeg: 2, minRunupM: 2, maxCount: 5 });
    expect(peaks).toHaveLength(5);
    expect(peaks[0]!.runupM).toBeCloseTo(14.5);
    expect(peaks.every((p) => p.runupM >= 2)).toBe(true);
  });

  it('ignores non-finite run-ups', () => {
    expect(
      pickRunupPeaks([{ latitude: 0, longitude: 0, runupM: Number.NaN }], {
        binDeg: 2,
        minRunupM: 1,
        maxCount: 5,
      })
    ).toEqual([]);
  });
});

describe('runupCellsBeyondTile — the planet leaves the tile its own area (B-116)', () => {
  // New Orleans' tile, which ends at 90° W, east of which lie Lake Borgne and
  // the Mississippi coast.
  const tile = { minLat: 29.535, maxLat: 30.751, minLon: -91.406, maxLon: -90 };
  const cells = [
    { latitude: 30, longitude: -90.5, runupM: 5 },
    { latitude: 30.2, longitude: -89.5, runupM: 6 },
    { latitude: 29, longitude: -90.5, runupM: 7 },
  ];

  it('drops the cells the tile covers and keeps the coast beyond it, however near', () => {
    expect(runupCellsBeyondTile(cells, tile).map((c) => c.runupM)).toEqual([6, 7]);
  });

  it('keeps every cell where there is no tile run-up to stand in for them', () => {
    expect(runupCellsBeyondTile(cells, null)).toHaveLength(3);
  });

  it('reads a tile written past 180° in its own frame', () => {
    const wrapped = { minLat: -10, maxLat: 10, minLon: 170, maxLon: 200 };
    const across = [
      { latitude: 0, longitude: -170, runupM: 1 },
      { latitude: 0, longitude: 150, runupM: 2 },
    ];
    expect(runupCellsBeyondTile(across, wrapped).map((c) => c.runupM)).toEqual([2]);
  });
});
