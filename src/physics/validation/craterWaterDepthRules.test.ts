import { describe, expect, it } from 'vitest';
import { makeElevationGrid, type ElevationGrid } from '../elevation/index.js';
import { craterWaterDepth } from '../../store/useAppStore.js';
import { IMPACT_PRESETS, simulateImpact, type ImpactScenarioResult } from '../simulate.js';
import { waterWithinRadius } from '../tsunami/sourcePlacement.js';
import { STANDARD_GRAVITY } from '../constants.js';
import { deg, degreesToRadians, kgPerM3, m, mps } from '../units.js';
import { SHORE_DEPTH_CAP_M } from './shoreDepthRules.js';
import {
  CRATER_WATER_LATTICE,
  CRATER_WATER_OUTCOME,
  NEW_ORLEANS_SHORE_DEPTH_M,
  NEW_ORLEANS_WATER_MAX_M,
} from './craterWaterDepthRules.js';

/**
 * Rules 798 to 800 of validation/craterWaterDepthRules.ts, on maps whose
 * geography is made here. Rule 800(e) wants the real terrain and is measured
 * by scripts/benchmark/crater-water.ts against the running app.
 *
 * The rules were fixed and pushed (commit aa5a591) before the candidate was
 * written.
 */

const SHORELINE = {
  lattice: CRATER_WATER_LATTICE,
  minDepthM: 1,
  tileBodyCells: 200,
  mosaicBodyCells: 24,
  seaMaskNeighbourhoodCells: 1,
};

/** A square about the equator and the meridian, one elevation per cell. */
function grid(
  half: number,
  n: number,
  elevation: (lat: number, lon: number) => number,
  lonRange: [number, number] = [-half, half]
): ElevationGrid {
  const samples = new Float32Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const lat = half - (i / (n - 1)) * 2 * half;
      const lon = lonRange[0] + (j / (n - 1)) * (lonRange[1] - lonRange[0]);
      samples[i * n + j] = elevation(lat, lon);
    }
  }
  return makeElevationGrid({
    minLat: -half,
    maxLat: half,
    minLon: lonRange[0],
    maxLon: lonRange[1],
    nLat: n,
    nLon: n,
    samples,
  });
}

/** The planetary mosaic under the square: deep water, as over any coast. */
const deepMosaic = grid(3, 31, () => -3_000);
const origin = { latitude: 0, longitude: 0 };
const R = 30_000;

describe('rule 800(a) — the lattice mean, on maps whose answer is known', () => {
  it('reads a disc half sea of one depth as that depth', () => {
    const tile = grid(1, 201, (_, lon) => (lon < 0 ? 20 : -8));
    const reading = waterWithinRadius(tile, deepMosaic, 0, 0, R, SHORELINE);
    expect(reading.points).toBeGreaterThan(780);
    expect(reading.onTile).toBe(reading.points);
    // The eastern half and the meridian itself.
    expect(reading.water / reading.points).toBeGreaterThan(0.5);
    expect(reading.water / reading.points).toBeLessThan(0.55);
    expect(reading.meanDepthM ?? 0).toBeCloseTo(8, 9);
  });

  it('reads each point on the finest map that covers it', () => {
    // The tile covers the western half only, and it is land; the mosaic
    // beyond it is sea thirty metres deep.
    const tile = grid(1, 201, () => 20, [-1, 0]);
    const mosaic = grid(3, 61, () => -30);
    const reading = waterWithinRadius(tile, mosaic, 0, 0, R, SHORELINE);
    expect(reading.onTile).toBeGreaterThan(reading.points / 2);
    expect(reading.water).toBe(reading.points - reading.onTile);
    expect(reading.meanDepthM ?? 0).toBeCloseTo(30, 9);
  });

  it('drops a pond and a small polder, and keeps a sea', () => {
    const tile = grid(1, 201, (lat, lon) => {
      if (lon > 0.1) return -10;
      // A polder 11 km a side, a hundred cells: below the sea, but no sea.
      if (lat > 0.02 && lat < 0.12 && lon > -0.15 && lon < -0.05) return -2;
      // A pond, sixteen cells.
      if (lat < -0.05 && lat > -0.09 && lon > -0.1 && lon < -0.06) return -3;
      return 20;
    });
    const reading = waterWithinRadius(tile, deepMosaic, 0, 0, R, SHORELINE);
    expect(reading.water).toBeGreaterThan(0);
    expect(reading.meanDepthM ?? 0).toBeCloseTo(10, 9);
  });

  it('keeps a large polder, as rule 799(c) says it cannot help', () => {
    // Four hundred cells below the sea, and the mosaic says sea around it:
    // the map cannot tell this from a bay, and neither can the test.
    const tile = grid(1, 201, (lat, lon) =>
      lat > -0.1 && lat < 0.1 && lon > -0.2 && lon < 0 ? -2 : 20
    );
    const reading = waterWithinRadius(tile, deepMosaic, 0, 0, R, SHORELINE);
    expect(reading.water).toBeGreaterThan(0);
    expect(reading.meanDepthM ?? 0).toBeCloseTo(2, 9);
  });

  it('reads nothing where there is no water, and says so', () => {
    const land = grid(1, 201, () => 20);
    const reading = waterWithinRadius(land, deepMosaic, 0, 0, R, SHORELINE);
    expect(reading.water).toBe(0);
    expect(reading.meanDepthM).toBeNull();
    // And with no mosaic behind it the tile is taken at its word, as the
    // shoreline search takes it.
    const alone = grid(1, 201, (_, lon) => (lon < 0 ? 20 : -8));
    expect(waterWithinRadius(alone, null, 0, 0, R, SHORELINE).meanDepthM).toBeCloseTo(8, 9);
    expect(waterWithinRadius(land, null, 0, 0, 0, SHORELINE).points).toBe(0);
  });
});

describe('rules 798 and 800(b)–(d) — where the depth is read, and what it moves', () => {
  // Chicxulub on New Orleans as the store handed it before the round.
  const before = simulateImpact({
    ...IMPACT_PRESETS.CHICXULUB.input,
    waterDepth: m(NEW_ORLEANS_SHORE_DEPTH_M),
    shoreDistance: m(9_245),
  });
  const sea = grid(1, 201, (_, lon) => (lon < 0.05 ? 20 : -6));

  it('rule 798: a land impact whose crater reaches the sea reads the water within it', () => {
    expect(before.tsunami).toBeDefined();
    const crater = craterWaterDepth(before, sea, deepMosaic, origin);
    expect(crater?.depthM ?? 0).toBeCloseTo(6, 9);
    // The crater's own radius, read from the result.
    const direct = waterWithinRadius(
      sea,
      deepMosaic,
      0,
      0,
      (before.crater.transientDiameter as number) / 2,
      SHORELINE
    );
    expect(crater?.reading).toEqual(direct);
  });

  it('rule 798: capped at rule 248’s 200 m', () => {
    const abyss = grid(1, 201, (_, lon) => (lon < 0.05 ? 20 : -600));
    expect(craterWaterDepth(before, abyss, deepMosaic, origin)?.depthM).toBe(SHORE_DEPTH_CAP_M);
  });

  it('rule 800(b): where the crater stops short of the sea, nothing is read', () => {
    // Rule 250's body: a 1 km stone at 7.5 km/s and 45°, five kilometres
    // from Biscayne Bay; and Chicxulub seventy kilometres inland. No wave, so
    // no second run and nothing moves.
    const miami = simulateImpact({
      impactorDiameter: m(1_000),
      impactVelocity: mps(7_500),
      impactorDensity: kgPerM3(3_000),
      targetDensity: kgPerM3(2_700),
      impactAngle: degreesToRadians(deg(45)),
      surfaceGravity: STANDARD_GRAVITY,
      waterDepth: m(4.2),
      shoreDistance: m(5_060),
    });
    expect(miami.tsunami).toBeUndefined();
    expect(craterWaterDepth(miami, sea, deepMosaic, origin)).toBeNull();
    const inland = simulateImpact({
      ...IMPACT_PRESETS.CHICXULUB.input,
      waterDepth: m(4.2),
      shoreDistance: m(70_000),
    });
    expect(inland.tsunami).toBeUndefined();
    expect(craterWaterDepth(inland, sea, deepMosaic, origin)).toBeNull();
  });

  it('rule 800(c): an impact in open water is not read again', () => {
    const ocean = simulateImpact({ ...IMPACT_PRESETS.CHICXULUB.input, waterDepth: m(3_000) });
    expect(ocean.tsunami).toBeDefined();
    expect(craterWaterDepth(ocean, sea, deepMosaic, origin)).toBeNull();
  });

  it('rule 800(d): of a land impact, every output but the wave is unchanged to the bit', () => {
    const after = simulateImpact({
      ...IMPACT_PRESETS.CHICXULUB.input,
      waterDepth: m(5.76),
      shoreDistance: m(9_245),
    });
    const rest = (r: ImpactScenarioResult): unknown => {
      const { tsunami: _wave, inputs, ...others } = r;
      const { waterDepth: _depth, ...otherInputs } = inputs;
      return { ...others, inputs: otherInputs };
    };
    expect(rest(after)).toEqual(rest(before));
    // And the wave is what moved, by the depth.
    expect(after.tsunami?.rimWaveSourceAmplitude as number).toBeCloseTo(
      ((before.tsunami?.rimWaveSourceAmplitude as number) * 5.76) / NEW_ORLEANS_SHORE_DEPTH_M,
      9
    );
  });

  it('rule 800(e): at New Orleans the water read is above the cell under the city and under 10 m', () => {
    // Measured on the running app, 22 September 2026 (rule 801's table in
    // CRATER_WATER_OUTCOME): 207 of the lattice's 797 points count as water,
    // 477 of them read on the tile, at a mean of 5.76 m.
    const measured = 5.76;
    expect(measured).toBeGreaterThan(NEW_ORLEANS_SHORE_DEPTH_M);
    expect(measured).toBeLessThan(NEW_ORLEANS_WATER_MAX_M);
    expect(CRATER_WATER_OUTCOME).toContain('ADOPTED');
  });
});
