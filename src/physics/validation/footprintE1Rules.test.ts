import { describe, expect, it } from 'vitest';
import {
  E1_BAND_FLOOR_KM2,
  E1_COUNTED,
  E1_QUERIES,
  E1_SET_SIZE,
  E1_WRITTEN_BAR,
  anchoredBarHolds,
  peirceSkill,
} from './footprintE1Rules.js';

/**
 * Rules 329 to 334 before the set is fetched: that the queries cannot overlap
 * the sets already read, that the arithmetic of rule 331 is the arithmetic it
 * says, and that the two bars of rule 332 are kept apart.
 */

describe('rules 329 to 334 — E1 on maps nobody has seen', () => {
  it('rule 329: the deep band cannot overlap rule 23 or rule 66', () => {
    // Rule 23 took depths of 40 km and less; rule 66 took deeper than 70.
    expect(Number(E1_QUERIES.deepBand.mindepth)).toBeGreaterThan(40);
    expect(Number(E1_QUERIES.deepBand.maxdepth)).toBeLessThanOrEqual(70);
    // Rule 23's window ends where query B begins, so B is outside it by time.
    expect(E1_QUERIES.after2026.starttime).toBe('2026-01-01');
    expect(E1_QUERIES.deepBand.endtime).toBe('2026-01-01');
    // Both ask for events that actually have a map to be measured against.
    expect(E1_QUERIES.deepBand.producttype).toBe('shakemap');
    expect(E1_QUERIES.after2026.producttype).toBe('shakemap');
  });

  it('rule 329: the set asked for is smaller than what the queries hold', () => {
    expect(E1_SET_SIZE).toBe(300);
    expect(E1_COUNTED.deepBand + E1_COUNTED.after2026).toBeGreaterThan(E1_SET_SIZE);
    // …and E1's own minimum is what the size is set to, not more.
    expect(E1_SET_SIZE).toBeGreaterThanOrEqual(300);
  });

  it('rule 331(a): the Peirce skill is hits over positives less false alarms over negatives', () => {
    expect(peirceSkill({ hits: 10, misses: 0, falseAlarms: 0, silences: 10 })).toBe(1);
    expect(peirceSkill({ hits: 0, misses: 10, falseAlarms: 10, silences: 0 })).toBe(-1);
    expect(peirceSkill({ hits: 5, misses: 5, falseAlarms: 5, silences: 5 })).toBe(0);
    expect(peirceSkill({ hits: 8, misses: 2, falseAlarms: 1, silences: 9 })).toBeCloseTo(0.7, 12);
    // A band with no positives, or none negative, cannot be scored at all.
    expect(peirceSkill({ hits: 0, misses: 0, falseAlarms: 3, silences: 7 })).toBeNull();
    expect(peirceSkill({ hits: 3, misses: 7, falseAlarms: 0, silences: 0 })).toBeNull();
  });

  it('rule 332(a): the anchored bar wants both, and neither alone', () => {
    const reference = { score: 0.4, sharpness: 0.5 };
    expect(anchoredBarHolds({ score: 0.45, sharpness: 0.45 }, reference)).toBe(true);
    expect(anchoredBarHolds({ score: 0.4, sharpness: 0.5 }, reference)).toBe(true);
    // Better score, worse sharpness: no.
    expect(anchoredBarHolds({ score: 0.6, sharpness: 0.55 }, reference)).toBe(false);
    // Better sharpness, worse score: no.
    expect(anchoredBarHolds({ score: 0.3, sharpness: 0.2 }, reference)).toBe(false);
  });

  it('rule 332: the written bar is kept as it was drafted, not adjusted', () => {
    expect(E1_WRITTEN_BAR.score).toBe(0.5);
    expect(E1_WRITTEN_BAR.scoreOnModelled).toBe(0.4);
    expect(E1_WRITTEN_BAR.sharpness).toBe(0.35);
    expect(E1_BAND_FLOOR_KM2).toBe(10);
  });
});
