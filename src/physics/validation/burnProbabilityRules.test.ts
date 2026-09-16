import { describe, expect, it } from 'vitest';
import {
  BURN_PROBABILITY_CURVES,
  BURN_PROBABILITY_WORKED_EXAMPLE_1MT,
  BURN_PROBABILITY_YIELDS_KT,
} from '../effects/burnProbabilityData.js';
import {
  BURN_PROBABILITY_CANDIDATE,
  BURN_PROBABILITY_IN_PLACE,
  burnProbabilityChecks,
  burnProbabilityTracePasses,
  chooseBurnProbability,
} from './burnProbabilityRules.js';

describe('rule 114: the figure, traced', () => {
  it('passes its own three checks and the book’s worked example', () => {
    const checks = burnProbabilityChecks();
    expect(checks).toEqual({ three: true, rising: true, ordered: true, workedExample: true });
    expect(burnProbabilityTracePasses(checks)).toBe(true);
  });

  it('reproduces §12.65’s example, which the book reads as 4.5 to 6', () => {
    const [low, high] = BURN_PROBABILITY_WORKED_EXAMPLE_1MT;
    expect(low).toBeCloseTo(4.71, 2);
    expect(high).toBeCloseTo(6.25, 2);
  });

  it('is read at the same nine yields as Figure 12.64', () => {
    expect([...BURN_PROBABILITY_YIELDS_KT]).toEqual([1, 3, 10, 30, 100, 300, 1000, 3000, 10000]);
  });
});

describe('rule 115: a broken line is two lines at once', () => {
  it('shares the first degree’s 82 % line with the second degree’s 18 %', () => {
    // The whole reading turns on this: the "18 % second-degree, 82 % first"
    // curve is one curve, and it bounds both degrees. If the two ever differ,
    // the table was built from a different reading of the labels.
    const first = BURN_PROBABILITY_CURVES.find(([d]) => d === 'first');
    const second = BURN_PROBABILITY_CURVES.find(([d]) => d === 'second');
    const third = BURN_PROBABILITY_CURVES.find(([d]) => d === 'third');
    expect(first?.[4]).toEqual(second?.[2]);
    expect(second?.[4]).toEqual(third?.[2]);
  });

  it('carries the third degree’s upper line as 100 %, which is what the figure draws', () => {
    const shares = BURN_PROBABILITY_CURVES.map(([degree, upper]) => [degree, upper]);
    expect(shares).toEqual([
      ['first', 0.82],
      ['second', 0.82],
      ['third', 1],
    ]);
  });

  it('puts every degree’s three lines in order at every yield', () => {
    for (const [degree, , lo, mid, hi] of BURN_PROBABILITY_CURVES) {
      for (let i = 0; i < lo.length; i++) {
        expect(
          lo[i] ?? 0,
          `${degree} at ${(BURN_PROBABILITY_YIELDS_KT[i] ?? 0).toString()} kt`
        ).toBeLessThan(mid[i] ?? 0);
        expect(
          mid[i] ?? 0,
          `${degree} at ${(BURN_PROBABILITY_YIELDS_KT[i] ?? 0).toString()} kt`
        ).toBeLessThan(hi[i] ?? 0);
      }
    }
  });
});

describe('rule 117: the choice', () => {
  const pass = { three: true, rising: true, ordered: true, workedExample: true };
  const day = {
    checks: pass,
    gatePasses: true,
    worstRingMove: 1.07,
    invariantsInPlace: 222,
    invariantsWithCandidate: 222,
  };

  it('adopts unless the trace, the gate, a ring or the invariants say otherwise', () => {
    expect(chooseBurnProbability(day).adopted).toBe(true);
    expect(
      chooseBurnProbability({ ...day, checks: { ...pass, workedExample: false } }).adopted
    ).toBe(false);
    expect(chooseBurnProbability({ ...day, gatePasses: false }).adopted).toBe(false);
    expect(chooseBurnProbability({ ...day, worstRingMove: 2.5 }).adopted).toBe(false);
    expect(chooseBurnProbability({ ...day, invariantsWithCandidate: 223 }).adopted).toBe(false);
  });

  it('compares the invariants within one run, never against another day', () => {
    // The correction of 16 September: a guard on the invariants names the
    // reading under the law in place, taken in the same run. A candidate that
    // holds a count steady is adopted whatever that count happens to be.
    expect(
      chooseBurnProbability({ ...day, invariantsInPlace: 500, invariantsWithCandidate: 500 })
        .adopted
    ).toBe(true);
    expect(
      chooseBurnProbability({ ...day, invariantsInPlace: 500, invariantsWithCandidate: 499 })
        .adopted
    ).toBe(true);
  });

  it('names the source in place and the source it measures', () => {
    expect(BURN_PROBABILITY_IN_PLACE).toBe('glasstone1977');
    expect(BURN_PROBABILITY_CANDIDATE).toBe('glasstone1977probability');
  });
});
