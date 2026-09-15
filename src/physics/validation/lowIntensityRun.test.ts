import { describe, expect, it } from 'vitest';
import { m } from '../units.js';
import { moderateEarthquakeEvent, withLowIntensity } from './lowIntensityRun.js';
import { MODERATE_EARTHQUAKES } from './moderateSetData.js';
import { MODERATE_SITES } from './moderateSiteData.js';

/**
 * How rules 45 to 49 of lowIntensityRules.ts are run, held before any toll
 * is: rule 45's earthquakes go through the net's harness as rule 11's rows
 * do, on the browser's ground, and a toll changes the scenario's toll and
 * nothing else it was given.
 */

describe('rule 45: an earthquake of the moderate set, as the harness runs it', () => {
  it('has inputs by rules 1 to 3 and the record by rule 13, on the browser’s ground', () => {
    const sites = new Map(MODERATE_SITES.map((s) => [s.key, s]));
    for (const row of MODERATE_EARTHQUAKES) {
      const event = moderateEarthquakeEvent(row);
      expect(event.latitude).toBe(row.latitude);
      expect(event.longitude).toBe(row.longitude);
      expect(event.recordedDeaths).toBe(row.deaths);
      expect(event.recordedDeathsHigh).toBe(row.missing > 0 ? row.deaths + row.missing : undefined);
      expect(event.gated).toBe(false);
      expect(event.source).toContain(row.comcat);
      const result = event.run();
      if (result.type !== 'earthquake') throw new Error(row.comcat);
      expect(result.data.inputs).toEqual({
        magnitude: row.magnitude,
        depth: m(row.depthKm * 1_000),
        faultType: row.faultType,
        vs30: sites.get(row.comcat)?.vs30,
      });
    }
  });

  it('runs a toll as a scenario input and moves nothing else', () => {
    const row = MODERATE_EARTHQUAKES[0];
    if (row === undefined) throw new Error('empty set');
    const event = moderateEarthquakeEvent(row);
    const plain = event.run();
    for (const toll of ['none', 'midBand', 'pager'] as const) {
      const run = withLowIntensity(event, toll);
      expect({ ...run, run: undefined }).toEqual({ ...event, run: undefined });
      const result = run.run();
      if (result.type !== 'earthquake' || plain.type !== 'earthquake') throw new Error(row.comcat);
      expect(result.data.inputs).toEqual({ ...plain.data.inputs, lowIntensityDeaths: toll });
    }
  });
});
