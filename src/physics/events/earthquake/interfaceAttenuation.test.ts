import { describe, expect, it } from 'vitest';
import { STANDARD_GRAVITY } from '../../constants.js';
import { INTERFACE_REFERENCE } from '../../validation/interfaceReference.js';
import { EARTHQUAKE_PRESETS, simulateEarthquake } from './index.js';
import { pgaFromMercalliIntensity } from './intensity.js';
import {
  abrahamson2016InterfacePga,
  distanceForInterfacePga,
  parker2022InterfacePga,
} from './interfaceAttenuation.js';

/**
 * Rule 36 of validation/interfaceRules.ts: each interface candidate held to
 * OpenQuake's implementation within 0.1 %, before any score, at magnitudes
 * 6 to 9.5, rupture distances 1 to 1 000 km and Vs30 150 to 1 500 m/s.
 */

const MODELS = {
  abrahamson2016: abrahamson2016InterfacePga,
  parker2022: parker2022InterfacePga,
} as const;

describe('the interface candidates against OpenQuake', () => {
  for (const [name, pga] of Object.entries(MODELS)) {
    it(`${name} matches OpenQuake's median PGA within 0.1 % on its grid`, () => {
      const rows = INTERFACE_REFERENCE[name as keyof typeof MODELS];
      expect(rows.length).toBe(1_050);
      let worst = 0;
      for (const [magnitude, rrupKm, vs30, reference] of rows) {
        const ratio = pga({ magnitude, rrupKm, vs30 }) / reference;
        worst = Math.max(worst, Math.abs(ratio - 1));
        expect(
          Math.abs(ratio - 1),
          `M ${magnitude.toString()}, ${rrupKm.toString()} km, ${vs30.toString()} m/s`
        ).toBeLessThan(0.001);
      }
      expect(worst).toBeLessThan(0.001);
    });
  }
});

describe('the ring of an interface earthquake', () => {
  it('stands where the median at the rupture distance falls to the threshold', () => {
    for (const model of ['abrahamson2016', 'parker2022'] as const) {
      const input = { magnitude: 8.8, depthKm: 25, vs30: 760 };
      const target = 0.2;
      const xKm = (distanceForInterfacePga(model, input, target) as number) / 1_000;
      expect(xKm).toBeGreaterThan(0);
      const pga = MODELS[model];
      expect(pga({ magnitude: 8.8, rrupKm: Math.hypot(xKm, 25), vs30: 760 }) / target).toBeCloseTo(
        1,
        6
      );
    }
  });

  it('draws no ring at an intensity the median never reaches', () => {
    expect(distanceForInterfacePga('parker2022', { magnitude: 6, depthKm: 30, vs30: 760 }, 2)).toBe(
      0
    );
  });
});

describe('the interface laws in the simulator', () => {
  const pgaG = (mmi: number): number =>
    (pgaFromMercalliIntensity(mmi) as number) / STANDARD_GRAVITY;

  it('draw a scenario marked a subduction interface with their model', () => {
    const preset = EARTHQUAKE_PRESETS.TOHOKU_2011.input;
    for (const [law, model] of [
      ['abrahamson2016Interface', 'abrahamson2016'],
      ['parker2022Interface', 'parker2022'],
    ] as const) {
      const r = simulateEarthquake({ ...preset, contourLaw: law });
      const input = {
        magnitude: preset.magnitude,
        depthKm: (preset.depth as number) / 1_000,
        vs30: r.shaking.siteVs30,
      };
      expect(r.shaking.mmi7Radius).toBe(distanceForInterfacePga(model, input, pgaG(7)));
      expect(r.shaking.mmi8Radius).toBe(distanceForInterfacePga(model, input, pgaG(8)));
    }
  });

  it('leave any other scenario to Boore et al. 2014', () => {
    const northridge = EARTHQUAKE_PRESETS.NORTHRIDGE_1994.input;
    const inPlace = simulateEarthquake({ ...northridge, contourLaw: 'boore2014' }).shaking;
    for (const law of ['abrahamson2016Interface', 'parker2022Interface'] as const) {
      const shaking = simulateEarthquake({ ...northridge, contourLaw: law }).shaking;
      expect([shaking.mmi7Radius, shaking.mmi8Radius, shaking.mmi9Radius]).toEqual([
        inPlace.mmi7Radius,
        inPlace.mmi8Radius,
        inPlace.mmi9Radius,
      ]);
    }
  });
});
