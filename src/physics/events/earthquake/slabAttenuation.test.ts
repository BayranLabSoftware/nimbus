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
import {
  DEEP_LAW_FROM_KM,
  DEFAULT_DEEP_LAW,
  deepLawFor,
  simulateEarthquake,
  type EarthquakeScenarioInput,
} from './simulate.js';

/**
 * Rule 67 of validation/slabRules.ts, held before any score: each slab
 * candidate against OpenQuake's implementation within 1e-9 of the median,
 * its ring where that median falls to the threshold, and the simulator
 * drawing a scenario deeper than 70 km with it — a disc at every magnitude,
 * nothing else moved. Rules 68 and 69 adopted Abrahamson, Gregor & Addo
 * 2016 on 15 September 2026, so it is also what a deep scenario draws when
 * it names no deep law; `none` keeps the rings drawn before.
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
      const plain = simulateEarthquake(scenario(magnitude, depthKm, { deepLaw: 'none' }));
      const deep = simulateEarthquake(
        scenario(magnitude, depthKm, { deepLaw: 'abrahamson2016Slab' })
      );
      expect({
        ...deep,
        shaking: undefined,
        isExtendedSource: undefined,
        inputs: undefined,
      }).toEqual({ ...plain, shaking: undefined, isExtendedSource: undefined, inputs: undefined });
      // The rings, and the epicentre they start from: since rule 193 of
      // validation/epicentralIntensityRules.ts the intensity at the epicentre
      // is this same law at zero distance, so a slab law that moves the rings
      // moves it too. It did not before, and that was the defect — Joyner &
      // Boore 1981 at distance zero knows no depth, so a Mw 7.5 three hundred
      // kilometres down read MMI 9.3 at its epicentre with no MMI VII ring
      // anywhere (B-051).
      const {
        mmi7Radius,
        mmi8Radius,
        mmi9Radius,
        mmiAtEpicenter,
        mmiAtEpicenterEurope: _deepEurope,
        ...rest
      } = deep.shaking;
      const {
        mmi7Radius: plain7,
        mmi8Radius: plain8,
        mmi9Radius: plain9,
        mmiAtEpicenter: plainEpicentre,
        mmiAtEpicenterEurope: _plainEurope,
        ...plainRest
      } = plain.shaking;
      expect(rest).toEqual(plainRest);
      expect([mmi7Radius, mmi8Radius, mmi9Radius]).not.toEqual([plain7, plain8, plain9]);
      // A depth the deep law knows about and the crustal one does not: it
      // reads the epicentre quieter, not louder.
      expect(mmiAtEpicenter).toBeLessThan(plainEpicentre);
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

  it('keeps the rings drawn before where it names none: a stadium from Mw 7.5, deep or not', () => {
    for (const depthKm of [30, 100, 250]) {
      const none = simulateEarthquake(scenario(7.6, depthKm, { deepLaw: 'none' }));
      expect(none.isExtendedSource).toBe(true);
    }
    const shallow = simulateEarthquake(scenario(7.6, 30));
    const shallowNone = simulateEarthquake(scenario(7.6, 30, { deepLaw: 'none' }));
    expect(shallowNone).toEqual({ ...shallow, inputs: shallowNone.inputs });
  });

  it('draws Abrahamson, Gregor & Addo 2016 where a deep scenario names no deep law, since rules 68 and 69 adopted it', () => {
    expect(DEFAULT_DEEP_LAW).toBe('abrahamson2016Slab');
    for (const depthKm of [71, 100, 250, 400]) {
      const unnamed = simulateEarthquake(scenario(7.6, depthKm));
      const named = simulateEarthquake(scenario(7.6, depthKm, { deepLaw: 'abrahamson2016Slab' }));
      expect(unnamed.isExtendedSource).toBe(false);
      expect(unnamed).toEqual({ ...named, inputs: unnamed.inputs });
      expect(deepLawFor(unnamed.inputs)).toBe('abrahamson2016Slab');
    }
    expect(deepLawFor({ depth: m(70_000) })).toBeNull();
    expect(deepLawFor({ depth: m(150_000), deepLaw: 'none' })).toBeNull();
    expect(deepLawFor({})).toBeNull();
  });
});
