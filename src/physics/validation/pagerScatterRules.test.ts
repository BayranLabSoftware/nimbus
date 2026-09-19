import { describe, expect, it } from 'vitest';

import { NCEI_EARTHQUAKE_ROWS } from './heldOutByRuleData.js';
import {
  MINIMUM_ROWS_WITH_PAGER,
  PAGER_CALIBRATION_WINDOW,
  meetsE3Scatter,
} from './pagerScatterRules.js';

/**
 * Rules 215 to 219, before PAGER's own scatter is read: the arithmetic of the
 * bound, and the one property of the set the reading rests on — that no row of
 * it lies inside the window PAGER's fatality curves were fitted on, so the
 * reference is being read out of sample.
 */

describe('the bar the toll will be held to', () => {
  it('reads E3 after the amendment: no worse than PAGER, with no allowance', () => {
    expect(meetsE3Scatter(2.4, 2.44)).toBe(true);
    expect(meetsE3Scatter(2.44, 2.44)).toBe(true);
    expect(meetsE3Scatter(2.45, 2.44)).toBe(false);
    // The 0.25 the rule was written with is gone: a scatter a quarter wider
    // than the reference's no longer passes.
    expect(meetsE3Scatter(2.69, 2.44)).toBe(false);
  });

  it('is read on a set no row of which PAGER was fitted on', () => {
    expect(PAGER_CALIBRATION_WINDOW).toEqual({ fromYear: 1973, toYear: 2007 });
    const years = NCEI_EARTHQUAKE_ROWS.map((r) => Number(r.date.slice(0, 4)));
    expect(Math.min(...years)).toBeGreaterThan(PAGER_CALIBRATION_WINDOW.toYear);
    expect(NCEI_EARTHQUAKE_ROWS.length).toBeGreaterThan(MINIMUM_ROWS_WITH_PAGER);
  });
});
