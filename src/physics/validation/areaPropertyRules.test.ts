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

/** The geometry that shipped until B-083 was closed. */
const BEFORE = { stadiumWidth: 'downDip', pointSourceDistance: 'epicentral' } as const;

describe('P-CONT-AREA — B-083, before and after', () => {
  it('the model that shipped until 20 September failed it by a factor of nine', () => {
    const w = walkArea(BEFORE);
    expect(w.jumps).toBeGreaterThan(0);
    expect(w.worst.ratio).toBeGreaterThan(9);
    expect(w.worst.atMw).toBeCloseTo(7.5, 2);
    // And the scale of the offence: a typical step multiplies the ground
    // by one per cent, the seam by nine hundred.
    expect(w.medianRatio).toBeLessThan(1.02);
  });

  it('Thompson & Worden alone reduced the seam without closing it', () => {
    const tw = walkArea({ stadiumWidth: 'downDip', pointSourceDistance: 'thompsonWorden2018' });
    expect(tw.worst.ratio).toBeLessThan(walkArea(BEFORE).worst.ratio);
    expect(tw.worst.ratio).toBeGreaterThan(AREA_STEP_LIMIT);
    expect(tw.worst.atMw).toBeCloseTo(7.5, 2);
  });

  it('and WHAT SHIPS NOW holds it', () => {
    // The adopted cell: the surface projection with that distance. This
    // is the assertion the whole repair was for.
    const now = walkArea();
    expect(now.inversions).toBe(0);
    expect(now.jumps).toBe(0);
    expect(now.worst.ratio).toBeLessThan(AREA_STEP_LIMIT);
  });

  it('one shape at every magnitude also closes it, which was the diagnosis', () => {
    const always = walkArea({ extendedSource: 'always', stadiumWidth: 'downDip' });
    expect(always.jumps).toBe(0);
    expect(always.worst.ratio).toBeLessThan(AREA_STEP_LIMIT);
  });

  it('and there is a SECOND seam at Mw 5.2 that nobody was looking for', () => {
    // Found by the gate on its first outing, in a configuration whose
    // Mw 7.5 seam is closed. Not diagnosed here; recorded.
    const always = walkArea({ extendedSource: 'always', stadiumWidth: 'downDip' });
    expect(always.worst.atMw).toBeGreaterThan(5);
    expect(always.worst.atMw).toBeLessThan(5.5);
  });
});

describe('what the repaired gate did and did not let through', () => {
  it('Thompson & Worden ALONE still fails it', () => {
    const settings = {
      stadiumWidth: 'downDip',
      pointSourceDistance: 'thompsonWorden2018',
    } as const;
    const inv = radiusInversionsWithinRegime(settings);
    expect(inv.belowThreshold + inv.atOrAbove).toBe(0);
    expect(walkArea(settings).jumps).toBeGreaterThan(0);
  });

  it('and WITH the surface projection it passes, which is what was adopted', () => {
    // The correction I owe: when the gate was committed I said the repair
    // did not unblock what prompted it. That was true of the correction
    // alone and false of the cell, which carried the projection too.
    expect(walkArea().jumps).toBe(0);
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
