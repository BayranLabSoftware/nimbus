import { describe, expect, it } from 'vitest';
import { MMI_PER_LN_PGA } from '../events/earthquake/intensity.js';
import { epicentralDistanceForIntensityAllen2012 } from '../events/earthquake/intensityPrediction.js';
import { simulateEarthquake } from '../events/earthquake/simulate.js';
import { m } from '../units.js';
import {
  DEPTH_CANDIDATES,
  falseAlarmShare,
  passesOnQuiet,
  QUIET_DEATHS_BELOW,
} from './depthRules.js';

/**
 * Rule 24's candidates draw what they say they draw, and rule 25's test
 * on the quiet earthquakes decides what it says it decides. Nothing here
 * reads an earthquake of rule 23's set, a ShakeMap or a toll.
 */

describe("rule 24's candidates", () => {
  it('are the law in place and the two that carry depth', () => {
    expect(DEPTH_CANDIDATES).toEqual([
      'boore2014',
      'allen2012Hypocentral',
      'allen2012HypocentralBelowMw7.5',
    ]);
  });

  it('draw the hypocentral equation at the depth the scenario sets', () => {
    // Since 20 September the point-source distance defaults to Thompson &
    // Worden's, so the ring is the EPICENTRAL distance whose average R_JB
    // meets the threshold, not the R_JB itself. This test is about which
    // LAW is drawn, so it names the old convention and keeps asking that.
    const shallow = simulateEarthquake({
      magnitude: 6.5,
      depth: m(10_000),
      faultType: 'reverse',
      contourLaw: 'allen2012Hypocentral',
      pointSourceDistance: 'epicentral',
    });
    expect(shallow.shaking.mmi7Radius).toBe(epicentralDistanceForIntensityAllen2012(6.5, 10, 7));
    const deep = simulateEarthquake({
      magnitude: 6.5,
      depth: m(35_000),
      faultType: 'reverse',
      contourLaw: 'allen2012Hypocentral',
      pointSourceDistance: 'epicentral',
    });
    // The ground above a source 35 km down never reaches MMI VII.
    expect(deep.shaking.mmi7Radius).toBe(0);
    // And the law in place STILL barely sees the depth — but no longer
    // not at all. Since 20 September the point-source distance defaults
    // to Thompson & Worden's, which is computed from the magnitude AND
    // the depth, so Boore's ring now moves with it: 15 911 m at 10 km
    // against 15 830 at 35, half a per cent. A law that carries the depth
    // draws no MMI VII ring at 35 km whatsoever, which is the gap rules
    // 24 and 384 onward were written about and which this does not close.
    const inPlace = (depthM: number) =>
      simulateEarthquake({ magnitude: 6.5, depth: m(depthM), faultType: 'reverse' }).shaking
        .mmi7Radius as number;
    expect(inPlace(10_000)).not.toBe(inPlace(35_000));
    expect(Math.abs(inPlace(10_000) / inPlace(35_000) - 1)).toBeLessThan(0.01);
    // Named the old way, it is exactly as blind as it was.
    const blind = (depthM: number) =>
      simulateEarthquake({
        magnitude: 6.5,
        depth: m(depthM),
        faultType: 'reverse',
        pointSourceDistance: 'epicentral',
      }).shaking.mmi7Radius;
    expect(blind(10_000)).toBe(blind(35_000));
  });

  it('draw a scenario with no depth at 15 km, as the band assumes', () => {
    const none = simulateEarthquake({ magnitude: 6.8, contourLaw: 'allen2012Hypocentral' });
    expect(none.shaking.mmi7Radius).toBe(epicentralDistanceForIntensityAllen2012(6.8, 15, 7));
  });

  it('have no site term, and read a residual along Worden et al.’s upper slope', () => {
    const rock = simulateEarthquake({
      magnitude: 6.5,
      depth: m(10_000),
      contourLaw: 'allen2012Hypocentral',
    });
    const soft = simulateEarthquake({
      magnitude: 6.5,
      depth: m(10_000),
      vs30: 250,
      contourLaw: 'allen2012Hypocentral',
    });
    expect(soft.shaking.mmi7Radius).toBe(rock.shaking.mmi7Radius);
    const drawn = simulateEarthquake({
      magnitude: 6.5,
      depth: m(10_000),
      groundMotionResidualLn: 0.6,
      contourLaw: 'allen2012Hypocentral',
    });
    expect(drawn.shaking.mmi7Radius).toBe(
      epicentralDistanceForIntensityAllen2012(6.5, 10, 7, 0.6 * MMI_PER_LN_PGA)
    );
    expect(0.6 * MMI_PER_LN_PGA).toBeCloseTo(0.964, 3);
  });

  it('switch to Boore et al. 2014 at Mw 7.5 for the split law', () => {
    const at = (
      magnitude: number,
      contourLaw: 'boore2014' | 'allen2012Hypocentral' | 'allen2012HypocentralBelowMw7.5'
    ) =>
      simulateEarthquake({ magnitude, depth: m(20_000), faultType: 'reverse', contourLaw }).shaking
        .mmi7Radius;
    expect(at(7.4, 'allen2012HypocentralBelowMw7.5')).toBe(at(7.4, 'allen2012Hypocentral'));
    expect(at(7.6, 'allen2012HypocentralBelowMw7.5')).toBe(at(7.6, 'boore2014'));
  });
});

describe("rule 25's test on the quiet earthquakes", () => {
  it('counts the medians of ten or more', () => {
    expect(QUIET_DEATHS_BELOW).toBe(10);
    expect(falseAlarmShare([0, 3, 9.9, 10, 250])).toBeCloseTo(0.4, 10);
    expect(falseAlarmShare([])).toBe(0);
  });

  it('passes a winner that raises no more false alarms than the law in place', () => {
    expect(passesOnQuiet(0.12, 0.12)).toBe(true);
    expect(passesOnQuiet(0.12, 0.05)).toBe(true);
    expect(passesOnQuiet(0.12, 0.13)).toBe(false);
  });
});
