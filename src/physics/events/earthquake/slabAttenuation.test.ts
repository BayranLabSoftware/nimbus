import { describe, expect, it } from 'vitest';
import { STANDARD_GRAVITY } from '../../constants.js';
import { m } from '../../units.js';
import { SLAB_REFERENCE } from '../../validation/slabReference.js';
import { pgaFromMercalliIntensity } from './intensity.js';
import {
  abrahamson2016SlabPga,
  epicentralDistanceForSlabPga,
  parker2022SlabPga,
} from './slabAttenuation.js';
import { DEEP_LAW_FROM_KM, simulateEarthquake, type EarthquakeScenarioInput } from './simulate.js';

/**
 * Rule 67 of validation/slabRules.ts, held before any score: each slab
 * candidate against OpenQuake's implementation within 1e-9 of the median,
 * its ring where that median falls to the threshold, and the simulator
 * drawing a scenario deeper than 70 km with it — a disc at every magnitude,
 * nothing else moved — only where asked.
 */

const MODELS = {
  abrahamson2016Slab: abrahamson2016SlabPga,
  parker2022Slab: parker2022SlabPga,
} as const;

describe('the slab candidates against OpenQuake', () => {
  for (const [name, pga] of Object.entries(MODELS)) {
    it(`${name} matches OpenQuake's median PGA within 1e-9 on its grid`, () => {
      const rows = SLAB_REFERENCE[name as keyof typeof MODELS];
      expect(rows.length).toBe(960);
      let worst = 0;
      for (const [magnitude, depthKm, hypocentralKm, vs30, reference] of rows) {
        const ratio = pga({ magnitude, hypocentralKm, depthKm, vs30 }) / reference;
        worst = Math.max(worst, Math.abs(ratio - 1));
      }
      expect(worst).toBeLessThan(1e-9);
    });
  }
});

describe('the ring of a slab earthquake', () => {
  it('stands where the median at the hypocentral distance falls to the threshold', () => {
    for (const model of ['abrahamson2016Slab', 'parker2022Slab'] as const) {
      for (const [magnitude, depthKm, vs30] of [
        [6.5, 90, 300],
        [7.8, 160, 760],
      ] as const) {
        const target = 0.05;
        const xKm =
          (epicentralDistanceForSlabPga(model, { magnitude, depthKm, vs30 }, target) as number) /
          1_000;
        expect(xKm).toBeGreaterThan(0);
        const median = MODELS[model]({
          magnitude,
          hypocentralKm: Math.hypot(xKm, depthKm),
          depthKm,
          vs30,
        });
        expect(median / target).toBeCloseTo(1, 6);
      }
    }
  });

  it('draws no ring at an intensity the median never reaches above the hypocentre', () => {
    for (const model of ['abrahamson2016Slab', 'parker2022Slab'] as const) {
      expect(
        epicentralDistanceForSlabPga(model, { magnitude: 6, depthKm: 250, vs30: 760 }, 2)
      ).toBe(0);
    }
  });

  it('shrinks as the threshold rises', () => {
    for (const model of ['abrahamson2016Slab', 'parker2022Slab'] as const) {
      const input = { magnitude: 7.5, depthKm: 100, vs30: 400 };
      const radii = [0.02, 0.05, 0.1].map(
        (target) => epicentralDistanceForSlabPga(model, input, target) as number
      );
      expect(radii[0]).toBeGreaterThan(radii[1] ?? Infinity);
      expect(radii[1]).toBeGreaterThan(radii[2] ?? Infinity);
    }
  });
});

describe('the deep law in the simulator', () => {
  const pgaG = (mmi: number): number =>
    (pgaFromMercalliIntensity(mmi) as number) / STANDARD_GRAVITY;
  const scenario = (
    magnitude: number,
    depthKm: number,
    extra: Partial<EarthquakeScenarioInput> = {}
  ): EarthquakeScenarioInput => ({
    magnitude,
    depth: m(depthKm * 1_000),
    faultType: 'normal',
    vs30: 350,
    ...extra,
  });

  it('draws a scenario deeper than 70 km as a disc with its model at every magnitude', () => {
    for (const deepLaw of ['abrahamson2016Slab', 'parker2022Slab'] as const) {
      for (const [magnitude, depthKm] of [
        [6.2, 71],
        [7.1, 130],
        [8.2, 110],
      ] as const) {
        const r = simulateEarthquake(scenario(magnitude, depthKm, { deepLaw }));
        const input = { magnitude, depthKm, vs30: 350 };
        expect(r.isExtendedSource).toBe(false);
        expect(r.shaking.mmi7Radius).toBe(epicentralDistanceForSlabPga(deepLaw, input, pgaG(7)));
        expect(r.shaking.mmi8Radius).toBe(epicentralDistanceForSlabPga(deepLaw, input, pgaG(8)));
        expect(r.shaking.mmi9Radius).toBe(epicentralDistanceForSlabPga(deepLaw, input, pgaG(9)));
      }
    }
  });

  it('moves the threshold with a ground-motion residual as every law does', () => {
    const r = simulateEarthquake(
      scenario(7.1, 130, { deepLaw: 'parker2022Slab', groundMotionResidualLn: 0.4 })
    );
    expect(r.shaking.mmi7Radius).toBe(
      epicentralDistanceForSlabPga(
        'parker2022Slab',
        { magnitude: 7.1, depthKm: 130, vs30: 350 },
        pgaG(7) / Math.exp(0.4)
      )
    );
  });

  it('changes only the rings and the geometry, and only deeper than 70 km', () => {
    for (const [magnitude, depthKm] of [
      [6.2, 71],
      [8.2, 110],
    ] as const) {
      const plain = simulateEarthquake(scenario(magnitude, depthKm));
      const deep = simulateEarthquake(
        scenario(magnitude, depthKm, { deepLaw: 'abrahamson2016Slab' })
      );
      expect({
        ...deep,
        shaking: undefined,
        isExtendedSource: undefined,
        inputs: undefined,
      }).toEqual({ ...plain, shaking: undefined, isExtendedSource: undefined, inputs: undefined });
      const { mmi7Radius, mmi8Radius, mmi9Radius, ...rest } = deep.shaking;
      const {
        mmi7Radius: plain7,
        mmi8Radius: plain8,
        mmi9Radius: plain9,
        ...plainRest
      } = plain.shaking;
      expect(rest).toEqual(plainRest);
      expect([mmi7Radius, mmi8Radius, mmi9Radius]).not.toEqual([plain7, plain8, plain9]);
    }
    for (const deepLaw of ['none', 'abrahamson2016Slab', 'parker2022Slab'] as const) {
      for (const [magnitude, depthKm] of [
        [6.5, 10],
        [7.8, 45],
        [7, DEEP_LAW_FROM_KM],
      ] as const) {
        const plain = simulateEarthquake(scenario(magnitude, depthKm));
        const named = simulateEarthquake(scenario(magnitude, depthKm, { deepLaw }));
        expect(named).toEqual({ ...plain, inputs: named.inputs });
      }
    }
  });

  it('draws as before where it names none, deep or not', () => {
    for (const depthKm of [30, 100, 250]) {
      const plain = simulateEarthquake(scenario(7.6, depthKm));
      const none = simulateEarthquake(scenario(7.6, depthKm, { deepLaw: 'none' }));
      expect(none).toEqual({ ...plain, inputs: none.inputs });
      expect(plain.isExtendedSource).toBe(true);
    }
  });
});
