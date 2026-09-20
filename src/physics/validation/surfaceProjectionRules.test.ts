import { describe, expect, it } from 'vitest';
import { EXTENDED_SOURCE_CELLS, EXTENDED_SOURCE_MARGIN } from './extendedSourceRules.js';
import {
  cellsThatFlippedSign,
  SURFACE_PROJECTION_CELLS,
  SURFACE_PROJECTION_MARGIN,
} from './surfaceProjectionRules.js';

/**
 * Rule 424(f), the clause rule 416(b) turned out not to be.
 *
 * The case that made it necessary is the first test here, with the real
 * numbers from the round of rules 412 to 418: a cell that went from under
 * by 1.8 to over by 1.8 and was waved through.
 */
describe('rule 424(f): a cell may not trade under-drawing for over-drawing', () => {
  it('catches the cell rule 416(b) let past', () => {
    // Mw < 6.5 under `extendedSource: 'always'`, measured on 20 September.
    const failed = cellsThatFlippedSign({ 'Mw < 6.5': 0.563 }, { 'Mw < 6.5': 1.844 });
    expect(failed).toEqual(['Mw < 6.5']);
  });

  it('allows a flip that genuinely lands closer to centred', () => {
    // 0.30x to 1.05x crosses the line and is plainly better: |ln| falls
    // from 1.20 to 0.05. A clause that refused this would be refusing the
    // fix along with the failure.
    expect(cellsThatFlippedSign({ c: 0.3 }, { c: 1.05 })).toEqual([]);
  });

  it('says nothing about a cell that stays on its own side', () => {
    // Both under: rule 424(b) judges these, not (f).
    expect(cellsThatFlippedSign({ c: 0.2 }, { c: 0.9 })).toEqual([]);
    expect(cellsThatFlippedSign({ c: 0.9 }, { c: 0.2 })).toEqual([]);
    // Both over.
    expect(cellsThatFlippedSign({ c: 3 }, { c: 1.2 })).toEqual([]);
  });

  it('does not judge a cell it cannot see on both sides', () => {
    // A cell with no bands must not pass the clause by being absent.
    expect(cellsThatFlippedSign({ c: 0.5 }, {})).toEqual([]);
    expect(cellsThatFlippedSign({ c: null }, { c: 2 })).toEqual([]);
    expect(cellsThatFlippedSign({ c: 0.5 }, { c: null })).toEqual([]);
  });

  it('reads the same cells and margin as the round before it', () => {
    expect(SURFACE_PROJECTION_CELLS).toBe(EXTENDED_SOURCE_CELLS);
    expect(SURFACE_PROJECTION_MARGIN).toBe(EXTENDED_SOURCE_MARGIN);
  });
});
