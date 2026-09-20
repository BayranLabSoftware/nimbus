import { describe, expect, it } from 'vitest';
import {
  AREA_STEP_LIMIT,
  radiusInversionsWithinRegime,
  shakenAreaKm2,
  walkArea,
} from './areaPropertyRules.js';

/**
 * The new gate, and what it says about the model that ships.
 *
 * These are CHARACTERISATION tests where the incumbent fails. A gate
 * written to let something through does not begin by failing the thing
 * already in place, and this one does — twice.
 */
describe('P-MONO-AREA — the ground never shrinks as the earthquake grows', () => {
  it('holds for the shipped model', () => {
    expect(walkArea().inversions).toBe(0);
  });

  it('holds for every geometry the frontier offers', () => {
    for (const settings of [
      { extendedSource: 'always' as const },
      { stadiumWidth: 'surfaceProjection' as const },
      { pointSourceDistance: 'thompsonWorden2018' as const },
      { contourLaw: 'campbellBozorgnia2014' as const },
      { contourLaw: 'allen2012Hypocentral' as const },
    ]) {
      expect(walkArea(settings).inversions, JSON.stringify(settings)).toBe(0);
    }
  });
});

describe('P-CONT-AREA — B-083, recorded as it is', () => {
  it('the SHIPPED model fails it, by a factor of nine', () => {
    const w = walkArea();
    expect(w.jumps).toBeGreaterThan(0);
    expect(w.worst.ratio).toBeGreaterThan(9);
    expect(w.worst.atMw).toBeCloseTo(7.5, 2);
    // And the scale of the offence: a typical step multiplies the ground
    // by one per cent, the seam by nine hundred.
    expect(w.medianRatio).toBeLessThan(1.02);
  });

  it('Thompson & Worden reduces the seam without closing it', () => {
    const tw = walkArea({ pointSourceDistance: 'thompsonWorden2018' });
    expect(tw.worst.ratio).toBeLessThan(walkArea().worst.ratio);
    expect(tw.worst.ratio).toBeGreaterThan(AREA_STEP_LIMIT);
    expect(tw.worst.atMw).toBeCloseTo(7.5, 2);
  });

  it('one shape at every magnitude closes it, which is the diagnosis', () => {
    const always = walkArea({ extendedSource: 'always' });
    expect(always.jumps).toBe(0);
    expect(always.worst.ratio).toBeLessThan(AREA_STEP_LIMIT);
  });

  it('and there is a SECOND seam at Mw 5.2 that nobody was looking for', () => {
    // Found by the gate on its first outing, in a configuration whose
    // Mw 7.5 seam is closed. Not diagnosed here; recorded.
    const always = walkArea({ extendedSource: 'always' });
    expect(always.worst.atMw).toBeGreaterThan(5);
    expect(always.worst.atMw).toBeLessThan(5.5);
  });
});

describe('the repair does not unblock what prompted it', () => {
  it('Thompson & Worden passes the narrowed radius gate and fails the new one', () => {
    // The honest test of a repaired instrument: the candidate that rule
    // 398 blocked is still blocked, for a reason that is true.
    const inv = radiusInversionsWithinRegime({ pointSourceDistance: 'thompsonWorden2018' });
    expect(inv.belowThreshold + inv.atOrAbove).toBe(0);
    expect(walkArea({ pointSourceDistance: 'thompsonWorden2018' }).jumps).toBeGreaterThan(0);
  });
});

describe('the area the gate reads', () => {
  it('is the disc below the threshold and the stadium above it', () => {
    const below = shakenAreaKm2({ magnitude: 7, vs30: 760 });
    const above = shakenAreaKm2({ magnitude: 7.5, vs30: 760 });
    expect(below).toBeGreaterThan(0);
    expect(above).toBeGreaterThan(below);
  });

  it('is nothing where no ring is drawn', () => {
    expect(shakenAreaKm2({ magnitude: 3, vs30: 760 })).toBe(0);
  });
});
