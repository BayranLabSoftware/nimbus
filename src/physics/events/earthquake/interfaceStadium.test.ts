import { describe, expect, it } from 'vitest';
import { footprintAreaKm2 } from '../../validation/shakemapFootprint.js';
import { m } from '../../units.js';
import { simulateEarthquake, type EarthquakeScenarioInput } from './simulate.js';

/**
 * Rule 41 of validation/interfaceStadiumRules.ts, held before any score:
 * the candidate geometry draws what the stadium in place draws at Mw 7.5
 * and above and on any scenario not marked a subduction interface, and
 * below Mw 7.5 a disc of the same ring radii, with nothing else moved.
 */

const scenario = (magnitude: number, extra: Partial<EarthquakeScenarioInput> = {}) => ({
  magnitude,
  depth: m(45_000),
  faultType: 'reverse' as const,
  ...extra,
});

describe('an interface scenario below Mw 7.5, drawn from Mw 7.5 only', () => {
  it('is a disc of the same ring radii below Mw 7.5, the rupture and the tsunami untouched', () => {
    for (const magnitude of [6, 6.5, 7, 7.4]) {
      const always = simulateEarthquake(scenario(magnitude, { subductionInterface: true }));
      const disc = simulateEarthquake(
        scenario(magnitude, { subductionInterface: true, interfaceStadium: 'fromMw7.5' })
      );
      expect(always.isExtendedSource).toBe(true);
      expect(disc.isExtendedSource).toBe(false);
      expect(disc.shaking).toEqual(always.shaking);
      expect(disc.ruptureLength).toBe(always.ruptureLength);
      expect(disc.ruptureWidth).toBe(always.ruptureWidth);
      expect(disc.tsunami).toEqual(always.tsunami);
      const r = (disc.shaking.mmi7Radius as number) / 1_000;
      expect(r).toBeGreaterThan(0);
      expect(footprintAreaKm2(disc, 7)).toBeCloseTo(Math.PI * r * r, 9);
      expect(footprintAreaKm2(always, 7)).toBeGreaterThan(footprintAreaKm2(disc, 7));
    }
  });

  it('draws what the stadium in place draws from Mw 7.5, and on a scenario not marked', () => {
    for (const magnitude of [7.5, 8.2, 9.1]) {
      const always = simulateEarthquake(scenario(magnitude, { subductionInterface: true }));
      const from = simulateEarthquake(
        scenario(magnitude, { subductionInterface: true, interfaceStadium: 'fromMw7.5' })
      );
      expect(from).toEqual({ ...always, inputs: from.inputs });
    }
    for (const magnitude of [6.5, 8]) {
      const plain = simulateEarthquake(scenario(magnitude));
      const from = simulateEarthquake(scenario(magnitude, { interfaceStadium: 'fromMw7.5' }));
      expect(from).toEqual({ ...plain, inputs: from.inputs });
    }
  });
});
