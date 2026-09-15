import { describe, expect, it } from 'vitest';
import { simulateEarthquake } from '../events/earthquake/simulate.js';
import { m } from '../units.js';
import { smallDeepEarthquakeEvent } from './allenTollRun.js';
import { contourPairs } from './contourComparison.js';
import { footprintAreaKm2 } from './shakemapFootprint.js';
import { SLAB_CANDIDATES } from './slabRules.js';
import {
  readSlabDead,
  SLAB_GUARD_EARTHQUAKES,
  slabGround,
  slabInputs,
  withSlabCandidate,
} from './slabRun.js';
import { SLAB_EARTHQUAKES } from './slabSetData.js';
import { SLAB_SITES } from './slabSiteData.js';
import { SMALL_DEEP_EARTHQUAKES } from './smallDeepSetData.js';

/**
 * How rules 66 to 70 of slabRules.ts are run, held before any score is:
 * rule 66's earthquakes stand on the browser's ground, a candidate changes
 * the scenario's deep law and nothing else it was given, the maps are read
 * with the candidate's rings, and rule 69's guard reads rule 61's
 * earthquakes deeper than 70 km as rule 63 runs them.
 */

describe('rule 66: an earthquake of the deep set, as the harness runs it', () => {
  it('stands on the ground the browser reads under its epicentre', () => {
    const sites = new Map(SLAB_SITES.map((s) => [s.key, s]));
    for (const row of SLAB_EARTHQUAKES) {
      expect(slabGround(row)).toBe(sites.get(row.comcat)?.vs30);
    }
  });
});

describe('rule 68: the maps read with a candidate’s rings', () => {
  it('draws each row with the candidate’s deep law, at the row’s depth and ground', () => {
    // A made-up row and map, so that no earthquake of the set is drawn.
    const row = {
      comcat: 'made-up',
      magnitude: 7.2,
      depthKm: 120,
      faultType: 'normal' as const,
    };
    const map = { comcat: 'made-up', maxMmi: 7.5, areaKm2: { 7: 900, 8: 0, 9: 0 } };
    for (const candidate of SLAB_CANDIDATES) {
      const pairs = contourPairs(
        'boore2014',
        [map],
        () => 400,
        [row],
        'pga',
        false,
        undefined,
        undefined,
        candidate.deepLaw
      );
      const result = simulateEarthquake({
        magnitude: row.magnitude,
        depth: m(row.depthKm * 1_000),
        faultType: row.faultType,
        contourLaw: 'boore2014',
        vs30: 400,
        deepLaw: candidate.deepLaw,
      });
      expect(pairs.map((p) => p.modelKm2)).toEqual([
        footprintAreaKm2(result, 7),
        footprintAreaKm2(result, 8),
        footprintAreaKm2(result, 9),
      ]);
      expect(pairs.map((p) => p.observedKm2)).toEqual([900, 0, 0]);
    }
  });
});

describe('rule 69: rule 61’s earthquakes deeper than 70 km, under a candidate', () => {
  it('are the 62 of rule 61’s set whose depth is more than 70 km', () => {
    expect(SLAB_GUARD_EARTHQUAKES).toHaveLength(62);
    expect(SLAB_GUARD_EARTHQUAKES).toEqual(SMALL_DEEP_EARTHQUAKES.filter((q) => q.depthKm > 70));
  });

  it('run every candidate as scenario inputs and move nothing else', () => {
    const row = SLAB_GUARD_EARTHQUAKES[0];
    if (row === undefined) throw new Error('no guard earthquakes');
    const event = smallDeepEarthquakeEvent(row);
    const plain = event.run();
    if (plain.type !== 'earthquake') throw new Error(row.comcat);
    for (const candidate of SLAB_CANDIDATES) {
      const run = withSlabCandidate(event, candidate);
      expect({ ...run, run: undefined }).toEqual({ ...event, run: undefined });
      const result = run.run();
      if (result.type !== 'earthquake') throw new Error(row.comcat);
      expect(result.data.inputs).toEqual({ ...plain.data.inputs, ...slabInputs(candidate) });
    }
  });

  it('draw the law in place exactly as a scenario that names nothing', () => {
    const inPlace = SLAB_CANDIDATES[0];
    const row = SLAB_GUARD_EARTHQUAKES[0];
    if (inPlace === undefined || row === undefined) throw new Error('empty');
    const event = smallDeepEarthquakeEvent(row);
    const plain = event.run();
    const named = withSlabCandidate(event, inPlace).run();
    if (plain.type !== 'earthquake' || named.type !== 'earthquake') throw new Error(row.comcat);
    expect(named.data.shaking).toEqual(plain.data.shaking);
    expect(named.data.isExtendedSource).toBe(plain.data.isExtendedSource);
  });

  it('are read by rule 47’s score and the records each band holds, by cell', () => {
    const reading = readSlabDead([
      { comcat: 'a', magnitude: 6, record: 0, central: 0, low: 0, high: 2, inside: true },
      { comcat: 'b', magnitude: 7, record: 9, central: 0, low: 0, high: 0, inside: false },
      { comcat: 'c', magnitude: 8, record: 99, central: 9, low: 1, high: 120, inside: true },
    ]);
    expect(reading.score).toBeCloseTo((Math.log(10) + Math.log(10)) / 3, 12);
    expect(reading.held).toBe(2);
    expect(reading.rows).toBe(3);
    expect(reading.cells.map((c) => [c.held, c.rows])).toEqual([
      [1, 1],
      [0, 1],
      [1, 1],
    ]);
  });
});
