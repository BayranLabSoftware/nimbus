import { describe, expect, it } from 'vitest';

import { simulateEarthquake } from '../events/earthquake/simulate.js';
import { m } from '../units.js';
import {
  COHERENT_RING_INTENSITIES,
  readPeakIntensities,
  type PeakIntensityPair,
} from './epicentralIntensityRules.js';
import type { ContourLaw } from '../events/earthquake/simulate.js';

/**
 * Guard (a) of rule 194: over the corners of the input space, an MMI k ring
 * exists exactly when the intensity at the epicentre reaches k.
 *
 * This is the whole point of the round. Until 18 September 2026 the two came
 * from different laws and contradicted each other in the open: a Mw 7.5 three
 * hundred kilometres down printed MMI 9.3 at its epicentre and drew no MMI VII
 * ring anywhere, because Joyner & Boore 1981 at distance zero does not know
 * what a depth is.
 */

const MAGNITUDES = [4.5, 5.5, 6.5, 7.0, 7.5, 8.2, 9.0] as const;
const DEPTHS_KM = [5, 10, 20, 35, 60, 90, 150, 300] as const;
const FAULTS = ['normal', 'reverse', 'strike-slip'] as const;

describe('the epicentre and the rings say one thing', () => {
  it('draws a ring of intensity k exactly when the epicentre reaches k', () => {
    let checked = 0;
    for (const magnitude of MAGNITUDES) {
      for (const depthKm of DEPTHS_KM) {
        for (const faultType of FAULTS) {
          for (const subductionInterface of [false, true]) {
            // An interface is a thrust (B-046), so the fault type is not a
            // free axis there; run it once.
            if (subductionInterface && faultType !== 'reverse') continue;
            const r = simulateEarthquake({
              magnitude,
              depth: m(depthKm * 1_000),
              faultType,
              ...(subductionInterface ? { subductionInterface } : {}),
            });
            const radii: Record<number, number> = {
              7: r.shaking.mmi7Radius,
              8: r.shaking.mmi8Radius,
              9: r.shaking.mmi9Radius,
            };
            for (const k of COHERENT_RING_INTENSITIES) {
              const hasRing = (radii[k] ?? 0) > 0;
              const reachesIt = r.shaking.mmiAtEpicenter >= k;
              expect(
                hasRing,
                `Mw ${magnitude.toString()} at ${depthKm.toString()} km, ${faultType}${
                  subductionInterface ? ' interface' : ''
                }: MMI ${r.shaking.mmiAtEpicenter.toFixed(2)} at the epicentre, ring ${k.toString()} ${
                  hasRing ? 'drawn' : 'absent'
                }`
              ).toBe(reachesIt);
              checked += 1;
            }
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(400);
  });

  it('holds under every law the rings can be drawn with, and under a residual', () => {
    const laws: ContourLaw[] = [
      'boore2014',
      'joynerBoore1981',
      'allen2012Hypocentral',
      'allen2012HypocentralBelowMw7.5',
      'boore2014FromMw7.5',
      'abrahamson2016Interface',
      'parker2022Interface',
    ];
    for (const contourLaw of laws) {
      for (const magnitude of [5.5, 7.0, 8.5]) {
        for (const residual of [-1, 0, 1]) {
          const r = simulateEarthquake({
            magnitude,
            depth: m(15_000),
            faultType: 'reverse',
            contourLaw,
            groundMotionResidualLn: residual,
            ...(contourLaw.includes('Interface') ? { subductionInterface: true } : {}),
          });
          const radii: Record<number, number> = {
            7: r.shaking.mmi7Radius,
            8: r.shaking.mmi8Radius,
            9: r.shaking.mmi9Radius,
          };
          for (const k of COHERENT_RING_INTENSITIES) {
            expect(
              (radii[k] ?? 0) > 0,
              `${contourLaw} Mw ${magnitude.toString()} residual ${residual.toString()}: MMI ${r.shaking.mmiAtEpicenter.toFixed(2)}, ring ${k.toString()}`
            ).toBe(r.shaking.mmiAtEpicenter >= k);
          }
        }
      }
    }
  });

  it('holds when the rings are drawn on velocity, and at PAGER’s band edges', () => {
    for (const magnitude of [5.5, 6.8, 8.0]) {
      const r = simulateEarthquake({
        magnitude,
        depth: m(12_000),
        faultType: 'strike-slip',
        intensityMeasure: 'pgv',
      });
      // A band edge of k − ½ draws its ring wherever the epicentre reaches
      // that edge, so the statement to check is the banding's own.
      const banded = simulateEarthquake({
        magnitude,
        depth: m(12_000),
        faultType: 'strike-slip',
        intensityBanding: 'pager',
      });
      for (const [result, edge] of [
        [r, 0],
        [banded, -0.5],
      ] as const) {
        const radii: Record<number, number> = {
          7: result.shaking.mmi7Radius,
          8: result.shaking.mmi8Radius,
          9: result.shaking.mmi9Radius,
        };
        for (const k of COHERENT_RING_INTENSITIES) {
          expect((radii[k] ?? 0) > 0).toBe(result.shaking.mmiAtEpicenter >= k + edge);
        }
      }
    }
  });

  it('reads a deep event quieter at its epicentre than a shallow one', () => {
    // The defect in one line: the law in place gave these two the same
    // epicentral intensity, because it took no depth at all.
    const shallow = simulateEarthquake({ magnitude: 7.5, depth: m(10_000), faultType: 'reverse' });
    const deep = simulateEarthquake({ magnitude: 7.5, depth: m(300_000), faultType: 'reverse' });
    expect(deep.shaking.mmiAtEpicenter).toBeLessThan(shallow.shaking.mmiAtEpicenter - 2);
  });

  it('reads a pair the way rule 195 says', () => {
    const pairs: PeakIntensityPair[] = [
      { comcat: 'a', magnitude: 6, depthKm: 10, mapMmi: 7, modelMmi: 8 },
      { comcat: 'b', magnitude: 6, depthKm: 10, mapMmi: 7, modelMmi: 6 },
      { comcat: 'c', magnitude: 6, depthKm: 10, mapMmi: 7, modelMmi: 9.5 },
    ];
    const reading = readPeakIntensities(pairs);
    expect(reading.events).toBe(3);
    expect(reading.meanDifference).toBeCloseTo((1 - 1 + 2.5) / 3, 10);
    expect(reading.withinOne).toBeCloseTo(2 / 3, 10);
    expect(readPeakIntensities([]).events).toBe(0);
  });
});
