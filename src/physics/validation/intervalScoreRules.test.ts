import { describe, expect, it } from 'vitest';
import { INTERVAL_ALPHA, intervalScore, tollAxis } from './intervalScoreRules.js';

/**
 * Rule 450: the properties the score must have before any arm is scored
 * with it.
 *
 * These are checked on constructed cases, never on a candidate. The point
 * of a proper scoring rule is that its behaviour is a theorem; what a test
 * can do is confirm this implementation has it.
 */
describe('rule 450: the score behaves as a proper one must', () => {
  it('(a) never improves when a band that already contains is widened', () => {
    // The theorem, checked: widening is always paid for.
    const record = 300;
    let previous = -Infinity;
    for (const high of [400, 1_000, 10_000, 100_000, 1_000_000]) {
      const score = intervalScore(100, high, record);
      expect(score).toBeGreaterThan(previous);
      previous = score;
    }
    // And widening downwards costs too.
    expect(intervalScore(1, 1000, record)).toBeGreaterThan(intervalScore(100, 1000, record));
  });

  it('(b) prefers a narrow band that contains to a wide one that contains', () => {
    expect(intervalScore(200, 500, 300)).toBeLessThan(intervalScore(1, 100_000, 300));
  });

  it('(c) prefers a small miss to a large one at equal width', () => {
    // Two bands of the same width in logs, one just under the record and
    // one far under it.
    const near = intervalScore(100, 250, 300);
    const far = intervalScore(1, 2.5, 300);
    expect(near).toBeLessThan(far);
  });

  it('(d) prefers containing to missing at equal width', () => {
    const contains = intervalScore(100, 1000, 300);
    const misses = intervalScore(1000, 10_000, 300);
    expect(contains).toBeLessThan(misses);
  });

  it('(e) is exactly the width where the record is inside', () => {
    expect(intervalScore(10, 1000, 300)).toBeCloseTo(tollAxis(1000) - tollAxis(10), 12);
  });

  it('gives a record of zero a place on the axis', () => {
    // Most of rule 23's 805 records are zero, and a plain log would put
    // them at minus infinity.
    expect(tollAxis(0)).toBe(0);
    expect(Number.isFinite(intervalScore(0, 100, 0))).toBe(true);
    // A band that cannot reach zero is penalised for it, which is the
    // thing two rounds turned on.
    expect(intervalScore(1, 100, 0)).toBeGreaterThan(intervalScore(0, 100, 0));
  });

  it('reads alpha from the band these are, and not from a choice', () => {
    expect(INTERVAL_ALPHA).toBe(0.1);
    // 2/alpha = 20: a miss of one natural log costs twenty.
    expect(intervalScore(0, 1, Math.E * 2 - 1) - intervalScore(0, 1, Math.E - 1)).toBeCloseTo(
      20 * (tollAxis(Math.E * 2 - 1) - tollAxis(Math.E - 1)),
      9
    );
  });
});

describe('the two failures that made this round', () => {
  it('says the wide band that "contained" Sumatra was not good', () => {
    // 4 263 predicted against 227 898, inside only because the band ran
    // from 115 to 277 275 — a factor of 2 400.
    const shipped = intervalScore(115, 277_275, 227_898);
    // A band a tenth as wide that still contains would score far better.
    const sharper = intervalScore(50_000, 500_000, 227_898);
    expect(sharper).toBeLessThan(shipped);
  });

  it('does not reward arm C for a band that cannot reach a record of zero', () => {
    // Pohang: [0-37746] contains its record of none; [1-81833] does not.
    expect(intervalScore(0, 37_746, 0)).toBeLessThan(intervalScore(1, 81_833, 0));
  });
});
