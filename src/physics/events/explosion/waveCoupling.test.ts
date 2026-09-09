import { describe, expect, it } from 'vitest';
import { waveCouplingEfficiency, OPTIMUM_SCALED_DEPTH } from './underwaterBurst.js';

/**
 * What the depth-of-burst curve has to do, written before it existed.
 *
 * None of these assertions needs a number out of a book. They are the
 * shape of the thing: where the maximum is, where it goes to nothing,
 * that it never doubles back, and that a charge sitting on the water
 * couples less than one hung at the depth the literature calls
 * optimum. The one thing they pin hard is the peak, and that is the
 * scaled depth this module has cited from Glasstone §6.40 since long
 * before this test.
 */

describe('waveCouplingEfficiency', () => {
  it('peaks at the scaled depth the sources call optimum', () => {
    expect(waveCouplingEfficiency(OPTIMUM_SCALED_DEPTH)).toBeCloseTo(1, 9);
    for (const lambda of [0.5, 1, 2, 3, 5, 8, 16, 40]) {
      expect(waveCouplingEfficiency(lambda)).toBeLessThan(1);
    }
  });

  it('gives nothing to a charge that never entered the water', () => {
    for (const above of [0, -1, -10, -1_000]) {
      expect(waveCouplingEfficiency(above)).toBe(0);
    }
  });

  it('rises to the optimum and falls away from it, without doubling back', () => {
    let previous = 0;
    for (let l = 0.05; l <= OPTIMUM_SCALED_DEPTH; l += 0.05) {
      const e = waveCouplingEfficiency(l);
      expect(e).toBeGreaterThanOrEqual(previous - 1e-12);
      previous = e;
    }
    previous = 1;
    for (let l = OPTIMUM_SCALED_DEPTH; l <= 60; l += 0.25) {
      const e = waveCouplingEfficiency(l);
      expect(e).toBeLessThanOrEqual(previous + 1e-12);
      previous = e;
    }
  });

  it('leaves a charge at the surface far below one hung at the optimum', () => {
    // The mechanism is venting: at the surface the gas globe opens to
    // the atmosphere and the energy that would have lifted water
    // leaves as air shock and spray. This is the same reason the
    // module has always given an airburst nothing.
    const surface = waveCouplingEfficiency(0.05);
    expect(surface).toBeLessThan(0.05);
    expect(surface).toBeGreaterThan(0);
  });

  it('leaves a deeply buried charge below the optimum too, for the opposite reason', () => {
    // Too deep and the bubble oscillates without breaking through.
    expect(waveCouplingEfficiency(40)).toBeLessThan(0.05);
    expect(waveCouplingEfficiency(40)).toBeGreaterThan(0);
  });

  it('is finite for anything it is handed', () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const e = waveCouplingEfficiency(bad);
      expect(Number.isFinite(e)).toBe(true);
      expect(e).toBeGreaterThanOrEqual(0);
      expect(e).toBeLessThanOrEqual(1);
    }
  });
});
