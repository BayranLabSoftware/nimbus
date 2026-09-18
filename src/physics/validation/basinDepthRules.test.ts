import { describe, expect, it } from 'vitest';

import { simulateEarthquake } from '../events/earthquake/simulate.js';
import { DEFAULT_BASIN_DEPTH } from '../events/earthquake/seismicTsunami.js';
import { m } from '../units.js';
import {
  BASIN_MIN_DEPTH_M,
  DEFAULT_BASIN_DEPTH_M,
  basinDepthFromSample,
  longWaveSpeed,
  readCrestSpeeds,
  type CrestSpeedRow,
} from './basinDepthRules.js';

/**
 * Guards of rule 189: the depth a wave travels on is the path's, the water
 * over the source is the source's, and the row the report prints, the travel
 * time it implies and the depth the globe's veil shoals from are one number.
 *
 * Until 18 September 2026 they were not: `simulateEarthquake` passed the water
 * over the epicentre as the basin, so a Mw 9.0 on an eighteen-metre shelf put
 * its wave 1 000 km away in 20 h 54 min — 13.3 m/s (B-052).
 */

const megathrust = (waterDepthM: number, basinDepthM?: number) =>
  simulateEarthquake({
    magnitude: 9,
    depth: m(20_000),
    faultType: 'reverse',
    subductionInterface: true,
    waterDepth: m(waterDepthM),
    ...(basinDepthM === undefined ? {} : { basinDepth: m(basinDepthM) }),
  });

describe('the ocean a wave crosses', () => {
  it('does not change with the water over the source', () => {
    const shelf = megathrust(18);
    const deep = megathrust(6_000);
    for (const wave of [shelf.tsunami, deep.tsunami]) {
      expect(wave).toBeDefined();
    }
    expect(shelf.tsunami?.basinDepth).toStrictEqual(deep.tsunami?.basinDepth);
    expect(shelf.tsunami?.travelTimeTo1000km).toStrictEqual(deep.tsunami?.travelTimeTo1000km);
    expect(shelf.tsunami?.deepWaterCelerity).toStrictEqual(deep.tsunami?.deepWaterCelerity);
    expect(shelf.tsunami?.dominantPeriod).toStrictEqual(deep.tsunami?.dominantPeriod);
    // And the water over the source still does the job it can answer for.
    expect(shelf.isSubmarine).toBe(true);
    expect(shelf.submarineDepth as number).toBe(18);
  });

  it('is 4 000 m when nobody says otherwise, and is what the caller says when they do', () => {
    expect(DEFAULT_BASIN_DEPTH_M).toBe(DEFAULT_BASIN_DEPTH);
    expect(megathrust(2_000).tsunami?.basinDepth as number).toBe(DEFAULT_BASIN_DEPTH_M);
    expect(megathrust(2_000, 1_500).tsunami?.basinDepth as number).toBe(1_500);
  });

  it('carries the travel time, the celerity and the period, and they agree with it', () => {
    for (const basinDepthM of [800, 2_000, DEFAULT_BASIN_DEPTH_M, 5_500]) {
      const wave = megathrust(3_000, basinDepthM).tsunami;
      expect(wave).toBeDefined();
      if (wave === undefined) continue;
      const celerity = wave.deepWaterCelerity as number;
      expect(celerity).toBeCloseTo(longWaveSpeed(basinDepthM), 6);
      // The travel time to 1 000 km is that celerity's, and no other's.
      expect(1_000_000 / (wave.travelTimeTo1000km as number)).toBeCloseTo(celerity, 6);
      // And the period is the source wavelength over the same celerity.
      expect((wave.sourceWavelength as number) / celerity).toBeCloseTo(wave.dominantPeriod, 6);
    }
  });

  it('takes a basin only from a sample deep enough to be one', () => {
    expect(basinDepthFromSample(null)).toBeUndefined();
    expect(basinDepthFromSample(undefined)).toBeUndefined();
    expect(basinDepthFromSample(Number.NaN)).toBeUndefined();
    expect(basinDepthFromSample(BASIN_MIN_DEPTH_M - 1)).toBeUndefined();
    expect(basinDepthFromSample(BASIN_MIN_DEPTH_M) as number).toBe(BASIN_MIN_DEPTH_M);
    expect(basinDepthFromSample(3_800) as number).toBe(3_800);
  });

  it('reads a crest’s speed the way rule 190 says', () => {
    const rows: CrestSpeedRow[] = [
      {
        event: 'a',
        station: '1',
        distanceKm: 1_000,
        crestAfterS: 5_000,
        impliedSpeed: 200,
        buoyDepthM: 5_000,
      },
      {
        event: 'a',
        station: '2',
        distanceKm: 2_000,
        crestAfterS: 20_000,
        impliedSpeed: 100,
        buoyDepthM: 4_000,
      },
      {
        event: 'b',
        station: '3',
        distanceKm: 1_000,
        crestAfterS: 2_500,
        impliedSpeed: 400,
        buoyDepthM: 4_000,
      },
    ];
    const reading = readCrestSpeeds(rows, () => 200);
    expect(reading.records).toBe(3);
    expect(reading.events).toBe(2);
    // Ratios 1.0, 2.0, 0.5 → median 1.0, one of three below the bound.
    expect(reading.medianRatio).toBeCloseTo(1, 10);
    expect(reading.certainlySlowShare).toBeCloseTo(1 / 3, 10);
    expect(longWaveSpeed(4_000)).toBeCloseTo(Math.sqrt(9.80665 * 4_000), 10);
  });
});
