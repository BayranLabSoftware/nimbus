import { describe, expect, it } from 'vitest';
import { distanceForPga, distanceForPgaNGAWest2 } from '../events/earthquake/attenuation.js';
import { pgaFromMercalliIntensity } from '../events/earthquake/intensity.js';
import { simulateEarthquake } from '../events/earthquake/simulate.js';
import {
  adoptOnTolls,
  chooseContourLaw,
  CONTOUR_AREA_FLOOR_KM2,
  contourScore,
  scoreContours,
  type ContourCell,
} from './contourLaws.js';

/**
 * The candidates draw what rule 17 says they draw, and rules 18 and 19
 * decide what they say they decide. Nothing here reads a ShakeMap or a
 * toll of the earthquakes held out by rule.
 */

describe('the candidate laws', () => {
  it('leave the shipped rings where they were when none is named', () => {
    const shipped = simulateEarthquake({ magnitude: 7.2, faultType: 'reverse' });
    const named = simulateEarthquake({
      magnitude: 7.2,
      faultType: 'reverse',
      contourLaw: 'joynerBoore1981',
    });
    expect(named.shaking.mmi8Radius).toBe(shipped.shaking.mmi8Radius);
    expect(shipped.shaking.mmi8Radius).toBe(distanceForPga(7.2, pgaFromMercalliIntensity(8)));
  });

  it('draw Boore et al. 2014 with its fault type when asked', () => {
    const r = simulateEarthquake({ magnitude: 6.8, faultType: 'normal', contourLaw: 'boore2014' });
    expect(r.shaking.mmi7Radius).toBe(
      distanceForPgaNGAWest2(
        { magnitude: 6.8, faultType: 'normal', vs30: 760 },
        pgaFromMercalliIntensity(7)
      )
    );
  });

  it('switch at Mw 7.5 for the split law', () => {
    const below = simulateEarthquake({ magnitude: 7.4, contourLaw: 'boore2014FromMw7.5' });
    const above = simulateEarthquake({ magnitude: 7.6, contourLaw: 'boore2014FromMw7.5' });
    expect(below.shaking.mmi7Radius).toBe(
      simulateEarthquake({ magnitude: 7.4 }).shaking.mmi7Radius
    );
    expect(above.shaking.mmi7Radius).toBe(
      simulateEarthquake({ magnitude: 7.6, contourLaw: 'boore2014' }).shaking.mmi7Radius
    );
  });
});

describe('rule 18: a score on shaking', () => {
  it('is half the log of the floored area ratio, and nothing where neither shakes', () => {
    expect(contourScore(0, 0)).toBeNull();
    const f = CONTOUR_AREA_FLOOR_KM2;
    expect(contourScore(400 - f, 100 - f)).toBeCloseTo(Math.log(2), 10);
    expect(contourScore(0, 90)).toBeCloseTo(0.5 * Math.log(f / (90 + f)), 10);
  });

  it('counts invented and missed bands by magnitude cell', () => {
    const cells = scoreContours([
      { magnitude: 6.1, threshold: 9, modelKm2: 500, observedKm2: 0 },
      { magnitude: 6.2, threshold: 8, modelKm2: 0, observedKm2: 40 },
      { magnitude: 7.8, threshold: 7, modelKm2: 1_000, observedKm2: 1_000 },
      { magnitude: 7.9, threshold: 9, modelKm2: 0, observedKm2: 0 },
    ]);
    const small = cells.find((c) => c.sizeBand === 'Mw < 6.5');
    const great = cells.find((c) => c.sizeBand === 'Mw ≥ 7.5');
    expect(small?.invented).toBe(1);
    expect(small?.missed).toBe(1);
    expect(great?.pairs).toBe(1);
    expect(great?.bias).toBeCloseTo(0, 10);
  });

  it('keeps the shipped law unless another beats it by the margin', () => {
    const cells = (bias: number): ContourCell[] =>
      ['Mw < 6.5', 'Mw 6.5–7.5', 'Mw ≥ 7.5'].map((sizeBand) => ({
        sizeBand,
        pairs: 10,
        bias,
        scatter: 0.5,
        invented: 0,
        missed: 0,
      }));
    expect(
      chooseContourLaw({
        joynerBoore1981: cells(0.3),
        boore2014: cells(0.27),
        'boore2014FromMw7.5': cells(0.29),
      }).winner
    ).toBe('joynerBoore1981');
    expect(
      chooseContourLaw({
        joynerBoore1981: cells(0.3),
        boore2014: cells(-0.1),
        'boore2014FromMw7.5': cells(0.2),
      }).winner
    ).toBe('boore2014');
  });
});

describe('rule 19: checked on the dead', () => {
  it('adopts a winner no worse in log bias that holds eight records in ten everywhere', () => {
    const shipped = [{ bias: 1.7 }, { bias: 1 }, { bias: 13.9 }];
    expect(
      adoptOnTolls(shipped, [
        { bias: 1.2, inside: 90, rows: 100 },
        { bias: 0.8, inside: 85, rows: 100 },
        { bias: 2, inside: 30, rows: 34 },
      ])
    ).toBe(true);
    expect(
      adoptOnTolls(shipped, [
        { bias: 1.2, inside: 90, rows: 100 },
        { bias: 0.8, inside: 85, rows: 100 },
        { bias: 2, inside: 20, rows: 34 },
      ])
    ).toBe(false);
  });
});
