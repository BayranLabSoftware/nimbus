import { describe, expect, it } from 'vitest';
import { CONTOUR_LAW_MARGIN } from './contourLaws.js';
import {
  EXTENDED_SOURCE_CELLS,
  EXTENDED_SOURCE_MARGIN,
  magnitudeCell,
  worstCell,
} from './extendedSourceRules.js';

/**
 * Rule 416's bookkeeping, pinned before the run.
 *
 * Small things, but they are the things a verdict is read off, and a
 * verdict read off a wrong cell boundary would be worse than no verdict.
 */
describe('rules 412 to 418: the cells and the margin', () => {
  it('uses the repository three cells and not new ones', () => {
    expect(EXTENDED_SOURCE_CELLS.map((c) => c.label)).toEqual([
      'Mw < 6.5',
      'Mw 6.5–7.5',
      'Mw ≥ 7.5',
    ]);
    // The margin is rule 18's, imported, so it cannot drift apart from it.
    expect(EXTENDED_SOURCE_MARGIN).toBe(CONTOUR_LAW_MARGIN);
  });

  it('puts each magnitude in the cell the label claims', () => {
    expect(magnitudeCell(6.0)).toBe('Mw < 6.5');
    expect(magnitudeCell(6.49)).toBe('Mw < 6.5');
    // The boundaries are the ones the hole sits between.
    expect(magnitudeCell(6.5)).toBe('Mw 6.5–7.5');
    expect(magnitudeCell(7.49)).toBe('Mw 6.5–7.5');
    expect(magnitudeCell(7.5)).toBe('Mw ≥ 7.5');
    expect(magnitudeCell(9.1)).toBe('Mw ≥ 7.5');
  });

  it('finds the worst cell by distance from centred, either way', () => {
    // Under-drawing by three and over-drawing by three are equally wrong;
    // a worst cell measured on the ratio alone would call 0.33x worse than
    // 3.0x, and the clause would then reward overshooting.
    const worst = worstCell({ a: 1 / 3, b: 3.0, c: 1.1 });
    expect(worst?.distance).toBeCloseTo(Math.log(3), 12);
    expect(['a', 'b']).toContain(worst?.label);
    // And the one that is further out wins, whichever side it is on.
    expect(worstCell({ under: 0.5, over: 4 })?.label).toBe('over');
    expect(worstCell({ under: 0.1, over: 4 })?.label).toBe('under');
  });

  it('leaves an empty cell out instead of scoring it as centred', () => {
    // A cell with no band must not be able to win the verdict by default.
    expect(worstCell({ a: null, b: 0.5 })?.label).toBe('b');
    expect(worstCell({ a: null })).toBeNull();
    expect(worstCell({})).toBeNull();
  });
});
