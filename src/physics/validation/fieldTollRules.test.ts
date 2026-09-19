import { describe, expect, it } from 'vitest';
import {
  FIELD_TOLL_BUDGET_MS,
  bandOfIntensity,
  peopleInCell,
  tollAmendmentHolds,
  type TollReading,
} from './fieldTollRules.js';
import { FIELD_BUDGET_MS } from './shakingFieldRules.js';

/**
 * Rules 335 to 341 before the candidate: the arithmetic of a cell, which band
 * a cell belongs to, and that the bar is the amendment and not a hope.
 */

describe('rules 335 to 341 — the dead where the shaking is', () => {
  it('rule 335: a cell holds its density times its own area', () => {
    // 100 people per km² over a cell of 4 km² is 400 people.
    expect(peopleInCell(100, 4e6)).toBeCloseTo(400, 9);
    // A field finer than the raster does not multiply anyone: half the area,
    // half the people.
    expect(peopleInCell(100, 2e6)).toBeCloseTo(200, 9);
    expect(peopleInCell(0, 4e6)).toBe(0);
    expect(peopleInCell(100, 0)).toBe(0);
    expect(peopleInCell(Number.NaN, 4e6)).toBe(0);
  });

  it('rule 336: a cell belongs to the band its own intensity falls in', () => {
    expect(bandOfIntensity(9.4, 5)).toBe('mmi9');
    expect(bandOfIntensity(9, 5)).toBe('mmi9');
    expect(bandOfIntensity(8.99, 5)).toBe('mmi8');
    expect(bandOfIntensity(7.0, 5)).toBe('mmi7');
    expect(bandOfIntensity(6.5, 5)).toBe('mmi6');
    expect(bandOfIntensity(5.0, 5)).toBe('mmi5');
    expect(bandOfIntensity(4.99, 5)).toBeNull();
    // A plan that carries no low bands drops everything under VII.
    expect(bandOfIntensity(6.9, 7)).toBeNull();
    expect(bandOfIntensity(7.1, 7)).toBe('mmi7');
    expect(bandOfIntensity(Number.NaN, 5)).toBeNull();
  });

  it('rule 338: the amendment wants both clauses, on the dead as on anything else', () => {
    const before: TollReading = { bias: 0.4, sigma: 1.9, rows: 12 };
    expect(tollAmendmentHolds(before, { bias: 0.6, sigma: 1.8, rows: 12 })).toBe(true);
    expect(tollAmendmentHolds(before, { ...before })).toBe(true);
    // Closer bias, wider scatter: refused.
    expect(tollAmendmentHolds(before, { bias: 0.9, sigma: 2.0, rows: 12 })).toBe(false);
    // Tighter scatter, bias further away: refused.
    expect(tollAmendmentHolds(before, { bias: 0.2, sigma: 1.0, rows: 12 })).toBe(false);
    // Overshooting the record by as much as it undershot is no improvement,
    // and the test is on the distance from one, not on the direction.
    expect(
      tollAmendmentHolds({ bias: 0.5, sigma: 1, rows: 5 }, { bias: 2.1, sigma: 1, rows: 5 })
    ).toBe(false);
  });

  it('rule 340: a toll costs what a field costs, and not more', () => {
    expect(FIELD_TOLL_BUDGET_MS).toBe(FIELD_BUDGET_MS);
  });
});
