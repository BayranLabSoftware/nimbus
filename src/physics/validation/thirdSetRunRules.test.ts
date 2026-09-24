import { describe, expect, it } from 'vitest';
import {
  HAMBURG_TABLE4_MASSES_G,
  THIRD_SET_O1_MIN_PAIRED,
  THIRD_SET_O1_WIDENING_M,
  THIRD_SET_RUN_DRAWS,
  THIRD_SET_STRESS_MASS_FACTOR,
  thirdSetOutcome,
} from './thirdSetRunRules.js';

describe('rule 1126: the one paired run, fixed before it', () => {
  it('draws as the rounds drew, and reads O1 with the frozen bars', () => {
    expect(THIRD_SET_RUN_DRAWS).toBe(1_000);
    expect(THIRD_SET_O1_MIN_PAIRED).toBe(50);
    expect(THIRD_SET_O1_WIDENING_M).toBe(5_000);
    expect(THIRD_SET_STRESS_MASS_FACTOR).toBe(3);
  });

  it('holds Hamburg’s 25 single masses, the largest 102.6 g', () => {
    expect(HAMBURG_TABLE4_MASSES_G).toHaveLength(25);
    expect(Math.max(...HAMBURG_TABLE4_MASSES_G)).toBe(102.6);
  });

  it('fixes the words of the outcome', () => {
    expect(thirdSetOutcome('non adottabile')).toContain('nessuna classe B');
  });
});
