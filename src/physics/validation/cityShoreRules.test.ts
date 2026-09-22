import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { makeElevationGrid, type ElevationGrid } from '../elevation/index.js';
import { nearestSeaForImpact } from '../../store/useAppStore.js';
import { CITY_SHORE_OUTCOME } from './cityShoreRules.js';

/**
 * Rule 814(a) and (e) of validation/cityShoreRules.ts, on maps made for the
 * purpose. Rules 814(b) to (d) want the real terrain and are the table in
 * CITY_SHORE_OUTCOME, read on the running app.
 *
 * The rules were fixed and pushed (commit 4044331) before the candidate was
 * written.
 */

function grid(
  half: number,
  n: number,
  elevation: (lat: number, lon: number) => number
): ElevationGrid {
  const samples = new Float32Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      samples[i * n + j] = elevation(
        half - (i / (n - 1)) * 2 * half,
        -half + (j / (n - 1)) * 2 * half
      );
    }
  }
  return makeElevationGrid({
    minLat: -half,
    maxLat: half,
    minLon: -half,
    maxLon: half,
    nLat: n,
    nLon: n,
    samples,
  });
}

const origin = { latitude: 0, longitude: 0 };
/** A mosaic of half-degree cells: land, and the open sea past 1.6° E. */
const mosaic = grid(3, 13, (_, lon) => (lon > 1.6 ? -100 : 30));

describe('rule 814(a) — near a city the search reaches the sea', () => {
  it('finds a bay narrower than a mosaic cell where the mosaic sees any part of it as sea', () => {
    // A bay 0.2° wide from 0.3° E to the tile's edge, open to the mosaic's sea.
    const tile = grid(1.2, 241, (lat, lon) => (lon > 0.3 && Math.abs(lat) < 0.1 ? -8 : 20));
    const before = nearestSeaForImpact(tile, mosaic, origin);
    const after = nearestSeaForImpact(tile, mosaic, origin, { cityShore: true });
    expect(after?.distanceM ?? 0).toBeGreaterThan(30_000);
    expect(after?.distanceM ?? 0).toBeLessThan(36_000);
    expect(after?.shoreDepthM ?? 0).toBeCloseTo(8, 6);
    // The search of before refused the bay and went to the mosaic.
    expect(before?.distanceM ?? 0).toBeGreaterThan(100_000);
  });

  it('still refuses a lake the mosaic calls sea nowhere', () => {
    const land = grid(3, 13, () => 30);
    const tile = grid(1.2, 241, (lat, lon) => (Math.hypot(lat, lon - 0.4) < 0.12 ? -5 : 20));
    expect(nearestSeaForImpact(tile, land, origin, { cityShore: true })).toBeNull();
  });

  it('finds the sea behind a sector whose nearest six water cells are ponds', () => {
    // Eight ponds of one cell between 10 and 15 km east, and the sea from
    // 40 km east; the mosaic calls all of the east sea.
    const sea = grid(3, 13, (_, lon) => (lon > 0.2 ? -100 : 30));
    const tile = grid(1.2, 241, (lat, lon) => {
      if (lon > 0.36) return -20;
      const pond = [0.09, 0.1, 0.11, 0.12, 0.13, 0.14, 0.1, 0.12].some(
        (p, k) => Math.abs(lon - p) < 0.004 && Math.abs(lat - (k < 6 ? 0 : 0.02)) < 0.004
      );
      return pond ? -3 : 20;
    });
    const after = nearestSeaForImpact(tile, sea, origin, { cityShore: true });
    expect(after?.distanceM ?? 0).toBeGreaterThan(39_000);
    expect(after?.distanceM ?? 0).toBeLessThan(42_000);
    expect(after?.shoreDepthM ?? 0).toBeCloseTo(20, 6);
  });
});

describe('rule 814(e) — the explosion path keeps the search', () => {
  it('asks for the city shore only for an impact', () => {
    const store = readFileSync(
      fileURLToPath(new URL('../../store/useAppStore.ts', import.meta.url)),
      'utf8'
    );
    const calls = [...store.matchAll(/const sea = nearestSeaForImpact\(([\s\S]*?)\);/g)].map(
      (m) => m[1] ?? ''
    );
    expect(calls).toHaveLength(2);
    expect(calls.filter((c) => c.includes('cityShore: true'))).toHaveLength(1);
    const impact = store.indexOf('Impatto sulla terraferma');
    const cityCall = store.indexOf('{ cityShore: true }');
    expect(cityCall).toBeGreaterThan(impact);
    expect(cityCall - impact).toBeLessThan(1_500);
    expect(CITY_SHORE_OUTCOME).toContain('ADOPTED');
  });
});
