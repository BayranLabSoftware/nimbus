import { describe, expect, it } from 'vitest';
import { FAULT_DATA_BUDGET } from './faultStrikeRules.js';
import { SLAB_DATA_BUDGET } from './slabStrikeRules.js';
import {
  WIRED_STRIKE_PAYLOAD,
  amendmentHolds,
  strikeForScenario,
  type TollBias,
} from './wiredStrikeRules.js';

/**
 * Rules 322 to 328 before the wiring: what a reader pays, who wins when a
 * reader has typed a strike, and how rule 326(b) reads a pair of tolls.
 */

describe('rules 322 to 328 — the strike in the picture and in the count', () => {
  it('rule 324: what ships is inside the budgets fixed before it', () => {
    expect(WIRED_STRIKE_PAYLOAD.faultBytes).toBeLessThan(FAULT_DATA_BUDGET.totalBytes);
    expect(WIRED_STRIKE_PAYLOAD.worstFaultTileBytes).toBeLessThan(FAULT_DATA_BUDGET.perTileBytes);
    expect(WIRED_STRIKE_PAYLOAD.slabBytes).toBeLessThan(SLAB_DATA_BUDGET.totalBytes);
    expect(WIRED_STRIKE_PAYLOAD.worstSlabTileBytes).toBeLessThan(SLAB_DATA_BUDGET.perTileBytes);
  });

  it('rule 322: a reader’s own strike wins over the lookup’s', () => {
    expect(strikeForScenario(200, 15)).toEqual({ strikeDeg: 200, source: 'reader' });
    expect(strikeForScenario(0, 15)).toEqual({ strikeDeg: 0, source: 'reader' });
    expect(strikeForScenario(undefined, 15)).toEqual({ strikeDeg: 15, source: 'lookup' });
    expect(strikeForScenario(undefined, null)).toEqual({ strikeDeg: null, source: 'unknown' });
    // Due north typed by a reader is a statement, not a default.
    expect(strikeForScenario(0, null).source).toBe('reader');
  });

  it('rule 326(b): the amendment’s test, both clauses and neither alone', () => {
    const before: TollBias = { bias: 0.6, sigma: 1.4, rows: 12 };
    expect(amendmentHolds(before, { bias: 0.8, sigma: 1.3, rows: 12 })).toBe(true);
    // Closer bias but a wider scatter is not an improvement.
    expect(amendmentHolds(before, { bias: 0.9, sigma: 1.5, rows: 12 })).toBe(false);
    // Tighter scatter but a bias further from one is not either.
    expect(amendmentHolds(before, { bias: 0.4, sigma: 1.1, rows: 12 })).toBe(false);
    // Unchanged passes: the clause says "no further" and "no wider".
    expect(amendmentHolds(before, { ...before })).toBe(true);
    // And a bias the other side of 1 is judged by distance, not by sign.
    expect(amendmentHolds({ bias: 0.5, sigma: 1, rows: 3 }, { bias: 1.9, sigma: 1, rows: 3 })).toBe(
      true
    );
  });
});
