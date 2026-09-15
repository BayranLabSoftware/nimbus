import { describe, expect, it } from 'vitest';
import {
  chooseResidual,
  intervalScore,
  RESIDUAL_BESIDE,
  RESIDUAL_CANDIDATE,
  RESIDUAL_GUARD_COVERAGE_ROOM,
  RESIDUAL_GUARD_SCORE_ROOM,
  RESIDUAL_IN_PLACE,
  RESIDUAL_MIN_COVERAGE,
  type ResidualReading,
} from './residualRules.js';

/**
 * Rules 71 to 75 of residualRules.ts, before any band is drawn with the
 * candidate: the score and the choice do what rules 72 to 74 say.
 */

describe('rule 72: the interval score', () => {
  it('is the width where the record is inside, plus twenty times the gap where it is not', () => {
    const l = (x: number): number => Math.log10(x + 1);
    expect(intervalScore(50, 10, 500)).toBeCloseTo(l(500) - l(10), 12);
    expect(intervalScore(0, 0, 0)).toBe(0);
    expect(intervalScore(5, 20, 300)).toBeCloseTo(l(300) - l(20) + 20 * (l(20) - l(5)), 12);
    expect(intervalScore(900, 0, 99)).toBeCloseTo(l(99) + 20 * (l(900) - l(99)), 12);
  });
});

const reading = (meanIntervalScore: number, held: number, rows: number): ResidualReading => ({
  meanIntervalScore,
  held,
  rows,
});

describe('rules 73 and 74: the choice', () => {
  it('names the candidate, the residual in place and what is printed beside', () => {
    expect(RESIDUAL_IN_PLACE).toBe('onePerScenario');
    expect(RESIDUAL_CANDIDATE).toBe('betweenAndWithin');
    expect(RESIDUAL_BESIDE).toBe('lawTotal');
    expect(RESIDUAL_MIN_COVERAGE).toBe(0.85);
    expect(RESIDUAL_GUARD_SCORE_ROOM).toBe(0.05);
    expect(RESIDUAL_GUARD_COVERAGE_ROOM).toBe(0.05);
  });

  const guards = {
    rule45: { inPlace: reading(1, 90, 100), candidate: reading(1.05, 85, 100) },
    rule61: { inPlace: reading(2, 70, 100), candidate: reading(1.9, 66, 100) },
  };

  it('adopts a candidate no worse by the score, covering 85 %, within both guards', () => {
    const choice = chooseResidual({
      rule11: { inPlace: reading(1.2, 250, 270), candidate: reading(1.2, 230, 270) },
      ...guards,
    });
    expect(choice).toEqual({
      adopted: true,
      score: true,
      coverage: true,
      rule45: true,
      rule61: true,
    });
  });

  it('keeps the residual in place on a worse score, a coverage below 85 % or a guard lost', () => {
    const worse = chooseResidual({
      rule11: { inPlace: reading(1.2, 250, 270), candidate: reading(1.2001, 260, 270) },
      ...guards,
    });
    expect(worse.adopted).toBe(false);
    expect(worse.score).toBe(false);
    const uncovered = chooseResidual({
      rule11: { inPlace: reading(1.2, 250, 270), candidate: reading(1.0, 229, 270) },
      ...guards,
    });
    expect(uncovered.coverage).toBe(false);
    expect(uncovered.adopted).toBe(false);
    const guardLost = chooseResidual({
      rule11: { inPlace: reading(1.2, 250, 270), candidate: reading(1.0, 250, 270) },
      rule45: { inPlace: reading(1, 90, 100), candidate: reading(1.051, 90, 100) },
      rule61: { inPlace: reading(2, 70, 100), candidate: reading(2, 64, 100) },
    });
    expect(guardLost).toEqual({
      adopted: false,
      score: true,
      coverage: true,
      rule45: false,
      rule61: false,
    });
  });
});
