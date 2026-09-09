import { describe, expect, it } from 'vitest';
import { computeSeaCoupling } from './seaCoupling.js';

/**
 * One law, and it has to hold for both the events that ask it.
 *
 * The temptation when a single scenario reads wrong is to special-case
 * that scenario. These tests exist so the law can be checked as a law:
 * continuous where it should be, zero where it should be, and the same
 * shape whether the thing digging the hole was a stone from space or a
 * warehouse of ammonium nitrate.
 */

const crater = { craterRimRadiusM: 1_000, cavityAtFullCouplingM: 0, ejectaReachM: 10_000 };

describe('computeSeaCoupling', () => {
  it('the sea underneath takes everything', () => {
    const c = computeSeaCoupling({ ...crater, shoreDistanceM: 0 });
    expect(c.mechanism).toBe('water');
    expect(c.fraction).toBe(1);
  });

  it('a shoreline inside the crater is part of the excavation', () => {
    for (const shore of [1, 500, 999]) {
      const c = computeSeaCoupling({ ...crater, shoreDistanceM: shore });
      expect(c.mechanism).toBe('crater');
      expect(c.fraction).toBe(1);
    }
  });

  it('past the rim the blanket carries it, falling as the inner reach over the distance', () => {
    const c = computeSeaCoupling({ ...crater, shoreDistanceM: 4_000 });
    expect(c.mechanism).toBe('ejecta');
    expect(c.fraction).toBeCloseTo(1_000 / 4_000, 12);
  });

  it('is continuous at the rim rather than stepping', () => {
    const inside = computeSeaCoupling({ ...crater, shoreDistanceM: 999.999 }).fraction;
    const outside = computeSeaCoupling({ ...crater, shoreDistanceM: 1_000.001 }).fraction;
    expect(Math.abs(inside - outside)).toBeLessThan(1e-5);
  });

  it('never rises with distance', () => {
    let previous = Number.POSITIVE_INFINITY;
    for (let shore = 0; shore <= 12_000; shore += 100) {
      const f = computeSeaCoupling({ ...crater, shoreDistanceM: shore }).fraction;
      expect(f).toBeLessThanOrEqual(previous + 1e-12);
      previous = f;
    }
  });

  it('stops where the blanket stops, and stays stopped', () => {
    expect(computeSeaCoupling({ ...crater, shoreDistanceM: 9_999 }).fraction).toBeGreaterThan(0);
    expect(computeSeaCoupling({ ...crater, shoreDistanceM: 10_001 }).fraction).toBe(0);
    expect(computeSeaCoupling({ ...crater, shoreDistanceM: 1e9 }).fraction).toBe(0);
  });

  it('an event with no ejecta model stops at its crater, and is not told it was simplified', () => {
    const noEjecta = { craterRimRadiusM: 60, cavityAtFullCouplingM: 0, shoreDistanceM: 0 };
    expect(computeSeaCoupling({ ...noEjecta, shoreDistanceM: 30 }).fraction).toBe(1);
    expect(computeSeaCoupling({ ...noEjecta, shoreDistanceM: 61 }).fraction).toBe(0);
    // …which is the Beirut case: a 124 m crater on a quay lifts the
    // water it swallows and nothing beyond it.
    expect(computeSeaCoupling({ ...noEjecta, shoreDistanceM: 300 }).mechanism).toBe('ejecta');
    expect(computeSeaCoupling({ ...noEjecta, shoreDistanceM: 300 }).fraction).toBe(0);
  });

  it('takes the larger of the rim and the cavity as the reach of full coupling', () => {
    const deepWater = {
      craterRimRadiusM: 100,
      cavityAtFullCouplingM: 5_000,
      ejectaReachM: 1_000,
      shoreDistanceM: 3_000,
    };
    const c = computeSeaCoupling(deepWater);
    expect(c.mechanism).toBe('crater');
    expect(c.fraction).toBe(1);
    expect(c.reach).toBe(5_000);
  });

  it('survives nonsense without producing it', () => {
    const bad = computeSeaCoupling({
      shoreDistanceM: Number.NaN,
      craterRimRadiusM: Number.NaN,
      cavityAtFullCouplingM: Number.POSITIVE_INFINITY,
      ejectaReachM: -5,
    });
    expect(Number.isFinite(bad.fraction)).toBe(true);
    expect(bad.fraction).toBeGreaterThanOrEqual(0);
    expect(bad.fraction).toBeLessThanOrEqual(1);
  });
});
