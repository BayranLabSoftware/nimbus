import { describe, expect, it } from 'vitest';
import { m } from '../units.js';
import { ATLAS_CANDIDATES } from './atlasRules.js';
import { atlasGround, atlasInputs, withAtlasCandidate } from './atlasRun.js';
import { ATLAS_EARTHQUAKES } from './atlasSetData.js';
import { ATLAS_SITES } from './atlasSiteData.js';
import { unseenEarthquakeEvent } from './unseenSet.js';

/**
 * How rules 56 to 60 of atlasRules.ts are run, held before any score is:
 * rule 56's earthquakes go through the harness as rule 23's do, on the
 * browser's ground, and a candidate changes the scenario's rings and nothing
 * else it was given.
 */

describe('rule 56: an earthquake of the Atlas set, as the harness runs it', () => {
  it('stands on the ground the browser reads under its epicentre', () => {
    const sites = new Map(ATLAS_SITES.map((s) => [s.key, s]));
    for (const row of ATLAS_EARTHQUAKES) {
      expect(atlasGround(row)).toBe(sites.get(row.comcat)?.vs30);
    }
  });

  it('runs every candidate as scenario inputs and moves nothing else', () => {
    const row = ATLAS_EARTHQUAKES.find((q) => q.magnitude >= 6.5 && q.magnitude < 7.5);
    if (row === undefined) throw new Error('no earthquake in the middle cell');
    const event = unseenEarthquakeEvent(row, { vs30: atlasGround(row) });
    const plain = event.run();
    if (plain.type !== 'earthquake') throw new Error(row.comcat);
    expect(plain.data.inputs).toEqual({
      magnitude: row.magnitude,
      depth: m(row.depthKm * 1_000),
      faultType: row.faultType,
      vs30: atlasGround(row),
    });
    for (const candidate of ATLAS_CANDIDATES) {
      const run = withAtlasCandidate(event, candidate);
      expect({ ...run, run: undefined }).toEqual({ ...event, run: undefined });
      const result = run.run();
      if (result.type !== 'earthquake') throw new Error(row.comcat);
      expect(result.data.inputs).toEqual({ ...plain.data.inputs, ...atlasInputs(candidate) });
    }
  });

  it('draws the law in place exactly as a scenario that names nothing', () => {
    const inPlace = ATLAS_CANDIDATES[0];
    if (inPlace === undefined) throw new Error('no candidates');
    const row = ATLAS_EARTHQUAKES[0];
    if (row === undefined) throw new Error('empty set');
    const event = unseenEarthquakeEvent(row, { vs30: atlasGround(row) });
    const plain = event.run();
    const named = withAtlasCandidate(event, inPlace).run();
    if (plain.type !== 'earthquake' || named.type !== 'earthquake') throw new Error(row.comcat);
    expect(named.data.shaking).toEqual(plain.data.shaking);
  });
});
