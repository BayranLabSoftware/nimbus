import { describe, expect, it } from 'vitest';
import { waldAllen2007Vs30FromSlope } from '../elevation/index.js';
import { isQuiet } from './depthRules.js';
import { NCEI_EARTHQUAKE_ROWS } from './heldOutByRuleData.js';
import { unseenEarthquakeEvent } from './unseenSet.js';
import { UNSEEN_EARTHQUAKES, UNSEEN_LISTED, UNSEEN_WITHOUT_COVERAGE } from './unseenSetData.js';
import { UNSEEN_SITES } from './unseenSiteData.js';

/**
 * Rule 23's set is what the rule says it is, and its ground is rule
 * 20's. Nothing here scores a candidate on it.
 */

describe("rule 23's set, as stored", () => {
  it('holds none of rule 11’s earthquakes', () => {
    const seen = new Set(NCEI_EARTHQUAKE_ROWS.map((r) => r.comcat));
    for (const q of UNSEEN_EARTHQUAKES) expect(seen.has(q.comcat), q.comcat).toBe(false);
    expect(new Set(UNSEEN_EARTHQUAKES.map((q) => q.comcat)).size).toBe(UNSEEN_EARTHQUAKES.length);
  });

  it('is the query rule 23 names, less rule 11 and the maps without a coverage', () => {
    expect(UNSEEN_EARTHQUAKES.length + UNSEEN_WITHOUT_COVERAGE.length).toBeLessThanOrEqual(
      UNSEEN_LISTED
    );
    for (const q of UNSEEN_EARTHQUAKES) {
      expect(q.magnitude, q.comcat).toBeGreaterThanOrEqual(6);
      expect(q.depthKm, q.comcat).toBeLessThanOrEqual(40);
      expect(q.time >= '2008-01-01' && q.time < '2026-01-01', q.comcat).toBe(true);
      expect(q.areaKm2[7], q.comcat).toBeGreaterThanOrEqual(q.areaKm2[8]);
      expect(q.areaKm2[8], q.comcat).toBeGreaterThanOrEqual(q.areaKm2[9]);
    }
  });

  it('reads a quiet earthquake as fewer than ten dead, and a recorded one as NCEI does', () => {
    for (const q of UNSEEN_EARTHQUAKES) {
      const event = unseenEarthquakeEvent(q);
      if (isQuiet(q)) {
        expect(q.deaths, q.comcat).toBe(0);
        expect(event.recordedDeaths).toBe(0);
        expect(event.recordedDeathsHigh).toBe(9);
      } else {
        expect(event.recordedDeaths).toBe(q.deaths);
      }
    }
  });
});

describe("rule 23's ground", () => {
  it('is one site for every earthquake, each the Vs30 of its own slope', () => {
    expect(UNSEEN_SITES.map((s) => s.key)).toEqual(UNSEEN_EARTHQUAKES.map((q) => q.comcat));
    for (const [site, quake] of UNSEEN_SITES.map((s, i) => [s, UNSEEN_EARTHQUAKES[i]] as const)) {
      expect(site.latitude, site.key).toBe(quake?.latitude);
      expect(site.longitude, site.key).toBe(quake?.longitude);
      expect(
        Math.abs(site.vs30 - waldAllen2007Vs30FromSlope(site.slopeRad)),
        site.key
      ).toBeLessThan(0.01);
    }
  });
});
