import { describe, expect, it } from 'vitest';
import {
  ANCHORED_FILTER,
  ANCHORED_LEVEL,
  ANCHORED_ROWS,
  ANCHORED_SHAPE_MINIMUM,
  ANCHORED_WORST_REGRESSION,
} from './anchoredFootprintRules.js';
import { UNSEEN_EARTHQUAKES } from './unseenSetData.js';
import { SHAKEMAP_FOOTPRINTS } from './shakemapFixtures.js';
import { WORST_RATIO_REGRESSION } from './shakingFieldRules.js';

/**
 * Rules 316 to 321 before the candidate: that the rows are the rows the filter
 * picks, that they are not the rows already spent, and that the clause kept
 * from rule 314(a) is kept word for word.
 */

describe('rules 316 to 321 — the bar the reference can reach', () => {
  it('rule 317: the named rows are exactly what the filter picks', () => {
    const eligible = UNSEEN_EARTHQUAKES.filter(
      (e) =>
        e.areaKm2[7] > 0 &&
        e.depthKm < ANCHORED_FILTER.maximumDepthKm &&
        e.magnitude >= ANCHORED_FILTER.minimumMagnitude
    );
    const picked: string[] = [];
    for (const [lo, hi] of ANCHORED_FILTER.bands) {
      const band = eligible
        .filter((e) => e.magnitude >= lo && e.magnitude < hi)
        .sort((a, b) => (a.comcat < b.comcat ? -1 : a.comcat > b.comcat ? 1 : 0));
      picked.push(...band.slice(0, ANCHORED_FILTER.perBand).map((e) => e.comcat));
    }
    expect(picked).toEqual([...ANCHORED_ROWS]);
    expect(ANCHORED_ROWS.length).toBe(12);
  });

  it('rule 317: none of them is one of the six already spent', () => {
    const spent = new Set(SHAKEMAP_FOOTPRINTS.map((f) => f.eventId));
    for (const row of ANCHORED_ROWS) expect(spent.has(row)).toBe(false);
  });

  it('rule 317: they span what they say they span, and no further', () => {
    const rows = ANCHORED_ROWS.map((id) => UNSEEN_EARTHQUAKES.find((e) => e.comcat === id));
    for (const row of rows) expect(row).toBeDefined();
    const magnitudes = rows.map((r) => r?.magnitude ?? 0);
    expect(Math.min(...magnitudes)).toBeGreaterThanOrEqual(6);
    expect(Math.max(...magnitudes)).toBeLessThan(7.5);
    for (const row of rows) expect(row?.depthKm ?? 999).toBeLessThan(70);
  });

  it('rule 319(c): rule 314(a)’s clause is kept word for word', () => {
    expect(ANCHORED_WORST_REGRESSION).toBe(WORST_RATIO_REGRESSION);
  });

  it('rule 319(b): the shape bar is two thirds of the set, not a majority of one', () => {
    expect(ANCHORED_SHAPE_MINIMUM).toBe(8);
    expect(ANCHORED_SHAPE_MINIMUM / ANCHORED_ROWS.length).toBeGreaterThan(0.6);
    expect(ANCHORED_LEVEL).toBe(7);
  });
});
