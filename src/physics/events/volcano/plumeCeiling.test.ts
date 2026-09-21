import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../montecarlo/sampling.js';
import { MASTIN_2009_COEFFICIENT, MASTIN_2009_EXPONENT, plumeHeight } from './plumeHeight.js';
import { simulateVolcano } from './simulate.js';

/**
 * B-085, pinned as it is — not as it should be.
 *
 * A characterisation test. It records a defect in a law this product ships,
 * so that the day somebody puts a ceiling on it these numbers go red and
 * they have to say so deliberately.
 *
 * `plumeHeight` is Mastin et al. 2009's H = 2.00 V̇^0.241, fitted against 34
 * historical eruptions, and it has no upper bound. Where that leaves it:
 *
 *   V̇ = 2×10⁵ m³/s    37.9 km   the largest point of the fit this
 *                                repository's own note cites
 *   V̇ = 1.09×10⁶      57 km     Hunga Tonga–Hunga Haʻapai, January 2022,
 *                                the highest plume ever measured
 *   V̇ = 5×10⁶         82.3 km   what `inputSchema.ts` calls "the largest
 *                                known eruption (Tambora 1815)"
 *   V̇ = 1.12×10⁷      100 km    the Kármán line
 *   V̇ = 9.9×10⁹       512.8 km  the top of the invariant sweep's own
 *                                volcano sampler
 *
 * So the relation is already above every plume ever observed at the largest
 * eruption the input schema knows the name of, and the sweep runs five
 * orders of magnitude past the fit. The schema warns above 10⁷ m³/s and
 * caps nothing.
 *
 * G5 walked past all of it for the same reason it walked past B-084: its
 * clauses read finiteness, area and the antipode, and 512 km is a finite
 * length. Found on 21 September 2026 by looking for more of B-084's kind —
 * a bound that was never put in place outside the range a relation was
 * fitted on.
 *
 * NOT FIXED HERE. The ceiling has to be derived, from Mastin's own fitted
 * range or from a published maximum, and not chosen; the paper did not
 * download tonight; and a fix bundled with the search that found it can be
 * reviewed as neither.
 */

const km = (v: number): number => Number(plumeHeight({ volumeEruptionRate: v })) / 1_000;

describe('B-085: a plume with no ceiling', () => {
  it('is Mastin 2009 exactly, with nothing above it', () => {
    expect(MASTIN_2009_COEFFICIENT).toBe(2.0);
    expect(MASTIN_2009_EXPONENT).toBe(0.241);
    for (const v of [1e3, 1e6, 1e9, 1e12]) {
      expect(km(v)).toBeCloseTo(2.0 * v ** 0.241, 9);
    }
  });

  it('passes the highest plume ever measured at the largest eruption the schema names', () => {
    // Hunga Tonga–Hunga Haʻapai reached about 57 km in January 2022, the
    // highest ever recorded. `inputSchema.ts` calls 5×10⁶ m³/s "the largest
    // known eruption (Tambora 1815)".
    expect(km(5e6)).toBeCloseTo(82.3, 1);
    expect(km(5e6)).toBeGreaterThan(57);
  });

  it('passes the Kármán line inside the range the form accepts', () => {
    expect(km(1.12e7)).toBeCloseTo(100, 0);
    // And the schema only warns there, so nothing stops it.
    expect(km(1e8)).toBeGreaterThan(150);
  });

  it('reaches 512.8 km at the top of the invariant sweep’s own sampler', () => {
    // `scripts/benchmark/invariants.ts` draws the volume eruption rate over
    // 10^3 to 9.9×10^9 m³/s.
    expect(km(9.9e9)).toBeCloseTo(512.8, 1);
    const r = simulateVolcano({ volumeEruptionRate: 9.9e9, totalEjectaVolume: 1e10 });
    expect(Number(r.plumeHeight) / 1_000).toBeCloseTo(512.8, 1);
  });

  it('is five orders of magnitude past the largest point of its own fit', () => {
    // The module's own note: "Reproduces the Krakatoa-class
    // (V̇ ≈ 2 × 10⁵ m³/s) ≈ 38 km plume".
    expect(km(2e5)).toBeCloseTo(37.9, 1);
    expect(9.9e9 / 2e5).toBeGreaterThan(1e4);
  });

  it('is reached by the sweep, not only by a hand-built scenario', () => {
    // Drawn the way `invariants.ts` draws it, so this is what the sweep has
    // been walking past rather than a corner nobody visits.
    const lin = (u: number, a: number, b: number): number => a + (b - a) * u;
    const pick = <T>(u: number, xs: readonly T[]): T =>
      xs[Math.min(xs.length - 1, Math.floor(u * xs.length))] as T;
    const sci = (u1: number, u2: number, e: readonly number[]): number =>
      lin(u1, 1, 9.9) * 10 ** pick(u2, e);
    const rng = mulberry32('benchmark-2026-09-15-inv-volcano');
    const u = (): number => rng.next();
    let aboveKarman = 0;
    let highest = 0;
    for (let i = 0; i < 400; i++) {
      const rate = sci(u(), u(), [3, 4, 5, 6, 7, 8, 9]);
      u();
      u();
      u();
      u();
      const h = km(rate);
      highest = Math.max(highest, h);
      if (h > 100) aboveKarman++;
    }
    expect(aboveKarman).toBeGreaterThan(50);
    expect(highest).toBeGreaterThan(300);
  });
});
