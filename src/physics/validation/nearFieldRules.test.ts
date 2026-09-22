import { describe, expect, it } from 'vitest';
import { simulateEarthquake } from '../events/earthquake/simulate.js';
import type { Meters } from '../units.js';
import { saturationSlope } from './nearFieldRules.js';

const km = (v: number): Meters => (v * 1_000) as Meters;

describe('rule 474: where the correction can reach', () => {
  it('is the shipped law exactly above Mw 7.5, where the source is extended', () => {
    for (const magnitude of [7.5, 8.0, 8.8]) {
      const plain = simulateEarthquake({ magnitude, depth: km(15) });
      const fixed = simulateEarthquake({
        magnitude,
        depth: km(15),
        pointSourceDistance: 'thompsonWorden2018',
      });
      expect(fixed.shaking.mmiAtEpicenter, `Mw ${magnitude.toString()}`).toBe(
        plain.shaking.mmiAtEpicenter
      );
      expect(fixed.shaking.mmi7Radius).toBe(plain.shaking.mmi7Radius);
    }
  });

  it('CANNOT cool the peak, because R_JB is a horizontal distance', () => {
    // This is the test that refuted this round's first candidate before
    // any evidence was spent. A site at the epicentre stands directly
    // above the surface projection of the rupture, so its R_JB is zero
    // however deep the earthquake is, and Thompson & Worden agree it is
    // zero. They are right; the distance is simply not where the depth
    // lives.
    for (const magnitude of [5.5, 6.0, 6.8, 7.2]) {
      for (const depthKm of [5, 10, 30]) {
        const plain = simulateEarthquake({ magnitude, depth: km(depthKm) });
        const fixed = simulateEarthquake({
          magnitude,
          depth: km(depthKm),
          pointSourceDistance: 'thompsonWorden2018',
        });
        expect(fixed.isExtendedSource).toBe(false);
        expect(
          fixed.shaking.mmiAtEpicenter,
          `Mw ${magnitude.toString()} at ${depthKm.toString()} km`
        ).toBe(plain.shaking.mmiAtEpicenter);
      }
    }
  }, 30_000);

  it('and a law whose distance DOES carry the depth cools with it', () => {
    // Campbell & Bozorgnia take R_rup, which at the epicentre is the depth
    // to the top of the rupture; Allen take R_hyp, which is the depth.
    // Both must fall as the earthquake goes down, and the shipped law
    // must not.
    const peak = (law: 'boore2014' | 'campbellBozorgnia2014' | 'allen2012Hypocentral', d: number) =>
      simulateEarthquake({ magnitude: 6.2, depth: km(d), contourLaw: law }).shaking.mmiAtEpicenter;
    expect(peak('boore2014', 35)).toBeCloseTo(peak('boore2014', 5), 6);
    expect(peak('campbellBozorgnia2014', 35)).toBeLessThan(peak('campbellBozorgnia2014', 5));
    expect(peak('allen2012Hypocentral', 35)).toBeLessThan(peak('allen2012Hypocentral', 5));
  });

  it('is off by default, so nothing moves until a rule adopts it', () => {
    const plain = simulateEarthquake({ magnitude: 6.2, depth: km(10) });
    const named = simulateEarthquake({
      magnitude: 6.2,
      depth: km(10),
      pointSourceDistance: 'epicentral',
    });
    expect(named.shaking.mmiAtEpicenter).toBe(plain.shaking.mmiAtEpicenter);
  });
});

describe('the slope that says whether saturation is gone', () => {
  it('reads the shipped law as steeply negative', () => {
    // The published table of rules 465 to 471.
    const slope = saturationSlope([
      { recordMmi: 4.5, meanBias: 3.68 },
      { recordMmi: 5.5, meanBias: 2.66 },
      { recordMmi: 6.5, meanBias: 1.79 },
      { recordMmi: 7.5, meanBias: 0.87 },
      { recordMmi: 8.5, meanBias: -0.38 },
    ]);
    expect(slope).not.toBeNull();
    expect(slope!).toBeLessThan(-0.9);
  });

  it('reads a law that carries the source as flat', () => {
    const slope = saturationSlope([
      { recordMmi: 4.5, meanBias: 0.1 },
      { recordMmi: 8.5, meanBias: 0.1 },
    ]);
    expect(slope).toBeCloseTo(0, 10);
  });

  it('says nothing where there is nothing to fit', () => {
    expect(saturationSlope([])).toBeNull();
    expect(saturationSlope([{ recordMmi: 5, meanBias: 1 }])).toBeNull();
  });
});
