import { describe, expect, it } from 'vitest';
import { m } from '../units.js';
import { ALLEN_TOLL_BESIDE, ALLEN_TOLL_CANDIDATES } from './allenTollRules.js';
import { smallDeepEarthquakeEvent, withAllenToll } from './allenTollRun.js';
import { SMALL_DEEP_EARTHQUAKES } from './smallDeepSetData.js';
import { SMALL_DEEP_SITES } from './smallDeepSiteData.js';

/**
 * How rules 61 to 65 of allenTollRules.ts are run, held before any toll is:
 * rule 61's earthquakes go through the net's harness as rule 11's rows do, on
 * the browser's ground, and a toll changes the scenario's law and count
 * below MMI VII and nothing else it was given.
 */

describe('rule 61: an earthquake of the set, as the harness runs it', () => {
  it('has inputs by rules 1 to 3 and the record by rule 13, on the browser’s ground', () => {
    const sites = new Map(SMALL_DEEP_SITES.map((s) => [s.key, s]));
    for (const row of SMALL_DEEP_EARTHQUAKES) {
      const event = smallDeepEarthquakeEvent(row);
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

  it('runs every toll as scenario inputs and moves nothing else', () => {
    const row = SMALL_DEEP_EARTHQUAKES[0];
    if (row === undefined) throw new Error('empty set');
    const event = smallDeepEarthquakeEvent(row);
    const plain = event.run();
    if (plain.type !== 'earthquake') throw new Error(row.comcat);
    for (const toll of [...ALLEN_TOLL_CANDIDATES, ...ALLEN_TOLL_BESIDE]) {
      const run = withAllenToll(event, toll);
      expect({ ...run, run: undefined }).toEqual({ ...event, run: undefined });
      const result = run.run();
      if (result.type !== 'earthquake') throw new Error(row.comcat);
      expect(result.data.inputs).toEqual({
        ...plain.data.inputs,
        contourLaw: toll.law,
        lowIntensityDeaths: toll.low,
      });
    }
  });
});
