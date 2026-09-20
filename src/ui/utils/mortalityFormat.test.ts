import { describe, expect, it } from 'vitest';
import { formatMortality } from './mortalityFormat.js';

/**
 * The column that said nobody dies beside the column that said 330 did.
 *
 * A reader looked at a report where 6 700 000 people stood at MMI VIII,
 * 330 of them died, and the mortality column read "0 %". The rate was
 * 0.0049 %, rounded to one decimal place. Nothing was wrong with the
 * arithmetic and everything was wrong with the table: it looked like a
 * model contradicting itself, which is exactly what a reader should not
 * have to talk themselves out of.
 */
const oneIn = (n: string): string => `1 in ${n}`;

describe('a mortality rate a reader can believe', () => {
  it('never prints zero for a rate that kills somebody', () => {
    for (const rate of [4.9e-5, 1e-4, 2.7e-5, 8.3e-5, 1e-6]) {
      const shown = formatMortality(rate, 'en-US', oneIn);
      expect(shown, `rate ${rate.toExponential(1)}`).not.toMatch(/^0 %/);
      expect(shown).toMatch(/1 in/);
    }
  });

  it('gives the small rates two significant figures and a one-in-N', () => {
    // PAGER's best-stock countries at MMI VIII and a half: the case that
    // started this.
    expect(formatMortality(4.86e-5, 'en-US', oneIn)).toBe('0.0049 % · 1 in 20,000');
    // PAGER's global median at the same intensity.
    expect(formatMortality(4.34e-3, 'en-US', oneIn)).toBe('0.43 % · 1 in 200');
  });

  it('leaves the big rates as plain percentages', () => {
    // Above one per cent the percentage is the readable form, and a
    // "1 in 2" beside it would be noise.
    expect(formatMortality(0.585, 'en-US', oneIn)).toBe('58.5 %');
    expect(formatMortality(0.15, 'en-US', oneIn)).toBe('15 %');
  });

  it('a rate of nothing is nothing', () => {
    expect(formatMortality(0, 'en-US', oneIn)).toBe('0 %');
    expect(formatMortality(Number.NaN, 'en-US', oneIn)).toBe('0 %');
  });
});
