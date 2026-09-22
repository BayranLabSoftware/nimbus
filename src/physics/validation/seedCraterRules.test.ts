import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { makeElevationGrid, type ElevationGrid } from '../elevation/index.js';
import {
  findPropagationSeeds,
  seedsFromCraterSea,
  waterWithinRadius,
} from '../tsunami/sourcePlacement.js';
import { SEED_CRATER_OUTCOME } from './seedCraterRules.js';

/**
 * Rule 821(a) of validation/seedCraterRules.ts, on maps made for the purpose,
 * and 821(d)'s gate in the store. Rules 821(b) and (c) want the real terrain
 * and are the table in SEED_CRATER_OUTCOME, read on the running app.
 *
 * The rules were fixed and pushed (commit 34d6f12) before the candidate was
 * written.
 */

function grid(elevation: (lat: number, lon: number) => number): ElevationGrid {
  const n = 241;
  const half = 1.2;
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

const LATTICE = {
  lattice: 33,
  minDepthM: 1,
  tileBodyCells: 200,
  mosaicBodyCells: 24,
  seaMaskNeighbourhoodCells: 1,
};
const R = 30_000;
const craterSea = (g: ElevationGrid) => waterWithinRadius(g, null, 0, 0, R, LATTICE).waterPoints;
const search = (g: ElevationGrid) => findPropagationSeeds(g, 0, 0, { maxRadiusM: 120_000 });

describe('rule 821(a) — the wave leaves from the crater’s own sea', () => {
  it('seeds only inside a crater half in a sea 30 m deep, and nowhere on the sea’s other coasts', () => {
    // A sea to the east, and a second sea 90 km to the west that the crater
    // never touches.
    const g = grid((_, lon) => (lon > 0 ? -30 : lon < -0.8 ? -30 : 20));
    const all = search(g);
    expect(all.some((s) => s.distanceM > 80_000)).toBe(true);
    const seeds = seedsFromCraterSea(craterSea(g), g, all);
    expect(seeds.length).toBeGreaterThan(10);
    for (const s of seeds) {
      expect(s.distanceM).toBeLessThanOrEqual(R + 1);
      expect(s.longitude).toBeGreaterThanOrEqual(0);
    }
  });

  it('seeds the one nearest deep water where the crater’s sea is too shallow for the solver', () => {
    // A lagoon 3 m deep inside the crater, deep sea 60 km east of it.
    const g = grid((_, lon) => (lon > 0.55 ? -40 : lon > 0 ? -3 : 20));
    const sea = craterSea(g);
    expect(sea.length).toBeGreaterThan(0);
    const all = search(g);
    const seeds = seedsFromCraterSea(sea, g, all);
    expect(seeds).toHaveLength(1);
    const nearest = [...all].sort((a, b) => a.distanceM - b.distanceM)[0];
    expect(seeds[0]).toEqual(nearest);
  });

  it('keeps one seed per cell, nearest first', () => {
    const g = grid((_, lon) => (lon > 0 ? -30 : 20));
    const seeds = seedsFromCraterSea(craterSea(g), g, search(g));
    const cells = new Set(seeds.map((s) => `${s.latitude.toFixed(4)},${s.longitude.toFixed(4)}`));
    expect(cells.size).toBe(seeds.length);
    for (let i = 1; i < seeds.length; i++) {
      expect(seeds[i]?.distanceM ?? 0).toBeGreaterThanOrEqual(seeds[i - 1]?.distanceM ?? 0);
    }
  });
});

describe('rule 821(d) — only a land impact’s crater wave is re-seeded', () => {
  it('is gated in the store on an impact whose wave rises in its crater, on ground', () => {
    const store = readFileSync(
      fileURLToPath(new URL('../../store/useAppStore.ts', import.meta.url)),
      'utf8'
    );
    const gate = store.indexOf("result.data.tsunami?.seaCoupling.mechanism === 'crater'");
    expect(gate).toBeGreaterThan(0);
    const block = store.slice(store.lastIndexOf('if (', gate), gate);
    expect(block).toContain("result.type === 'impact'");
    expect(store.slice(gate, gate + 400)).toContain('shoreDistance');
    expect(SEED_CRATER_OUTCOME).toContain('ADOPTED');
  });
});
