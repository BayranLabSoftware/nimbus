import { describe, expect, it } from 'vitest';
import { m } from '../units.js';
import { pointSourceGround, withPointSourceRings } from './pointSourceRun.js';
import { POINT_SOURCE_EARTHQUAKES } from './pointSourceSetData.js';
import { POINT_SOURCE_SITES } from './pointSourceSiteData.js';
import { unseenEarthquakeEvent } from './unseenSet.js';

/**
 * How rules 50 to 55 of pointSourceRules.ts are run, held before any score
 * is: rule 50's earthquakes go through the harness as rule 23's do, on the
 * browser's ground, and a way of drawing the rings changes the scenario's
 * rings and nothing else it was given.
 */

describe('rule 50: an earthquake of the set, as the harness runs it', () => {
  it('stands on the ground the browser reads under its epicentre', () => {
    const sites = new Map(POINT_SOURCE_SITES.map((s) => [s.key, s]));
    for (const row of POINT_SOURCE_EARTHQUAKES) {
      expect(pointSourceGround(row)).toBe(sites.get(row.comcat)?.vs30);
    }
  });

  it('runs a distance, a law and the interface mark as scenario inputs and moves nothing else', () => {
    const row = POINT_SOURCE_EARTHQUAKES.find((q) => q.magnitude >= 6.5 && q.magnitude < 7.5);
    if (row === undefined) throw new Error('no earthquake in the middle cell');
    const event = unseenEarthquakeEvent(row, { vs30: pointSourceGround(row) });
    const plain = event.run();
    if (plain.type !== 'earthquake') throw new Error(row.comcat);
    expect(plain.data.inputs).toEqual({
      magnitude: row.magnitude,
      depth: m(row.depthKm * 1_000),
      faultType: row.faultType,
      vs30: pointSourceGround(row),
    });
    for (const distance of ['epicentral', 'thompsonWorden2018'] as const) {
      const run = withPointSourceRings(event, { distance });
      expect({ ...run, run: undefined }).toEqual({ ...event, run: undefined });
      const result = run.run();
      if (result.type !== 'earthquake') throw new Error(row.comcat);
      expect(result.data.inputs).toEqual({ ...plain.data.inputs, pointSourceDistance: distance });
      const marked = withPointSourceRings(event, {
        distance,
        law: 'parker2022Interface',
        marked: true,
      }).run();
      if (marked.type !== 'earthquake') throw new Error(row.comcat);
      expect(marked.data.inputs).toEqual({
        ...plain.data.inputs,
        pointSourceDistance: distance,
        contourLaw: 'parker2022Interface',
        subductionInterface: true,
      });
    }
  });
});
