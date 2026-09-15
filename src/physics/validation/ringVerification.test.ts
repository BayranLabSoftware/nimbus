import { describe, expect, it } from 'vitest';
import { residualAgainstReference, verifyRings } from './ringVerification.js';

/**
 * The intensity rings' relations agree with their authors' own code.
 *
 * OpenQuake's tests allow Boore et al. 2014 two per cent and Allen, Wald &
 * Worden 2012 a tenth of one. Coded as the papers write them, ours agree
 * to within a thousandth of a per cent, the rounding of the tables; the
 * gate here is a hundredth, so a changed coefficient anywhere in the
 * median, the fault-type terms or the non-linear site term fails it. The
 * two interface candidates of rule 36 are held the same way to OpenQuake's
 * implementation.
 */

describe('the rings against their authors’ code', () => {
  const rows = verifyRings();

  it('prints how far apart they are', () => {
    console.log(
      [
        '',
        ...rows.map(
          (r) =>
            `${r.relation.padEnd(40)} ${r.quantity.padEnd(44)} ${r.rows.toString().padStart(4)} rows  worst ${(r.worstRelative * 100).toFixed(5)} %  at ${r.worstAt}`
        ),
      ].join('\n')
    );
    expect(rows).toHaveLength(8);
  });

  for (const row of rows) {
    it(`${row.relation}, ${row.quantity}: within 0.01 % of ${row.rows.toString()} reference rows`, () => {
      expect(row.rows).toBeGreaterThan(20);
      expect(row.worstRelative, row.worstAt).toBeLessThan(1e-4);
    });
  }

  it('draws a ground-motion residual of the total σ the Fortran program gives', () => {
    const r = residualAgainstReference();
    expect(r.rows).toBeGreaterThan(50);
    // One number over the range: √(0.348² + 0.495²) = 0.6051.
    expect(r.min).toBeCloseTo(0.6051, 4);
    expect(r.max).toBeCloseTo(0.6051, 4);
    expect(Math.abs(r.convention - r.max)).toBeLessThan(0.01);
  });
});
