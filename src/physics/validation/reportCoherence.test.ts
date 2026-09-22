import { describe, expect, it } from 'vitest';

import { buildExplosionCascade, buildImpactCascade, buildVolcanoCascade } from '../cascade.js';
import { simulateEarthquake } from '../events/earthquake/index.js';
import { simulateExplosion } from '../events/explosion/simulate.js';
import { simulateLandslide } from '../events/landslide/simulate.js';
import { simulateVolcano } from '../events/volcano/simulate.js';
import { simulateImpact } from '../simulate.js';
import { deg, degreesToRadians, kgPerM3, m, mps } from '../units.js';
import { fieldsFor } from '../../ui/pages/SimulationReportPage.js';
import { buildImpactReport } from '../../ui/pages/report/impactReportModel.js';
import type { TFunction } from 'i18next';
import type { ImpactScenarioResult } from '../simulate.js';
import type { ActiveResult } from '../../store/useAppStore.js';

const keyOnly = ((key: string) => key) as unknown as TFunction;
/** An impact's rows as its report prints them, keys for labels. */
const impactRows = (r: ImpactScenarioResult) =>
  buildImpactReport(r, {
    t: keyOnly,
    language: 'en',
    location: null,
    evaluatedAt: null,
    presetName: null,
    uncertaintyKey: null,
    casualties: null,
    nearest: null,
    extras: { bathymetricTsunami: false, monteCarlo: false, predictiveBand: false },
  }).groups.flatMap((g) => g.rows);

/**
 * What the report says about a scenario, checked for the things a reader
 * notices and a number-by-number test does not.
 *
 * Andrea ran four scenarios through the product on 17 September 2026 and found
 * four defects that 2 244 tests had missed: a field that did not apply to the
 * scenario, a timeline that dug a crater where there was none, two inputs that
 * contradicted each other, and a band that claimed four per cent on a number
 * the same page called uncertain by a factor of two. Thirty more scenarios on
 * 18 September found four more. None of them was a wrong number — every one
 * was the report saying something that did not hold together.
 *
 * So these are the checks that generalise, run over the corners of the input
 * space: a field only where it applies, a stage only where the thing happened,
 * rings in order, a band around its own estimate.
 *
 * Two more were left out of this file on the day it was written, because they
 * were defects and not yet fixed and putting them here would have cemented
 * them: the intensity at the epicentre disagreeing with the rings, and an
 * earthquake's wave crossing the ocean at the depth of its own epicentre. Both
 * were closed that evening under rules of their own, and their coherence is
 * pinned where those rules live — `epicentralIntensityRules.test.ts` (B-051)
 * and `basinDepthRules.test.ts` (B-052).
 */

/** An impactor, spelled the way the physics wants it. */
const body = (diameterM: number, speedMS: number, angleDeg: number, densityKgM3: number) => ({
  impactorDiameter: m(diameterM),
  impactVelocity: mps(speedMS),
  impactorDensity: kgPerM3(densityKgM3),
  targetDensity: kgPerM3(2_700),
  impactAngle: degreesToRadians(deg(angleDeg)),
});

/** Every ring a report prints, in the order the physics must keep. */
function ringsInOrder(values: readonly (number | undefined)[]): boolean {
  const seen = values.filter((v): v is number => v !== undefined && v > 0);
  for (let i = 1; i < seen.length; i++) {
    const previous = seen[i - 1];
    const current = seen[i];
    if (previous === undefined || current === undefined) continue;
    if (current < previous) return false;
  }
  return true;
}

describe('what a report says holds together', () => {
  it('an explosion prints every ring at its own height, and none of them out of order', () => {
    const bursts = [
      simulateExplosion({ yieldMegatons: 1, heightOfBurst: m(0) }),
      simulateExplosion({ yieldMegatons: 1, heightOfBurst: m(2_000) }),
      simulateExplosion({ yieldMegatons: 1, heightOfBurst: m(40_000) }),
      simulateExplosion({ yieldMegatons: 0.02, heightOfBurst: m(-30), waterDepth: m(60) }),
      simulateExplosion({ yieldMegatons: 0.0005, heightOfBurst: m(0), chargeType: 'chemical' }),
    ];
    for (const burst of bursts) {
      expect(
        ringsInOrder([
          burst.blast.overpressure5psiRadius as number,
          burst.blast.overpressure1psiRadius as number,
          burst.blast.lightDamageRadius as number,
        ])
      ).toBe(true);
      expect(
        ringsInOrder([
          burst.blast.overpressure5psiRadiusHob as number,
          burst.blast.overpressure1psiRadiusHob as number,
          burst.blast.lightDamageRadiusHob as number,
        ])
      ).toBe(true);
      // A burst whose rings reach nothing drives no wind at the ground, and
      // one whose rings reach drives some (B-050).
      const wind = burst.peakWind.at1km as number;
      expect(wind >= 0).toBe(true);
      if ((burst.blast.overpressure1psiRadiusHob as number) === 0) expect(wind).toBe(0);
      // Every ring the report prints is finite.
      const fields = fieldsFor({ type: 'explosion', data: burst } as never);
      for (const field of [...fields.inputs, ...fields.outputs]) {
        expect(field.value).not.toMatch(/NaN|Infinity|undefined|null/);
      }
    }
  });

  it('nothing digs a crater, or times one, where the event leaves none', () => {
    const airburst = simulateImpact(body(20, 19_200, 18, 3_300));
    expect(airburst.crater.finalDiameter as number).toBe(0);
    expect(buildImpactCascade(airburst).map((s) => s.key)).not.toContain('cascade.impact.crater');
    expect(impactRows(airburst).map((row) => row.id)).not.toContain('craterMorphology');

    const high = simulateExplosion({ yieldMegatons: 1, heightOfBurst: m(40_000) });
    expect(high.crater.apparentDiameter as number).toBe(0);
    expect(buildExplosionCascade(high).map((s) => s.key)).not.toContain('cascade.explosion.crater');
  });

  it('an eruption raises a wave only when something collapses into water', () => {
    const plinian = simulateVolcano({ volumeEruptionRate: 150_000, totalEjectaVolume: 2.5e9 });
    expect(plinian.tsunami).toBeUndefined();
    const labels = fieldsFor({ type: 'volcano', data: plinian } as never).outputs.map(
      (f) => f.label
    );
    expect(labels.some((l) => /tsunami|wave/i.test(l))).toBe(false);
    expect(buildVolcanoCascade(plinian).map((s) => s.key)).not.toContain('cascade.volcano.tsunami');

    const collapsing = simulateVolcano({
      volumeEruptionRate: 150_000,
      totalEjectaVolume: 2.5e9,
      flankCollapse: { volumeM3: 2e8, slopeAngleDeg: 30, meanOceanDepth: m(50) },
    });
    expect(collapsing.tsunami).toBeDefined();
  });

  it('a slide that cannot move says so, and claims no wave', () => {
    const held = simulateLandslide({
      volumeM3: 5e7,
      slopeAngleDeg: 10,
      regime: 'subaerial',
      meanOceanDepth: m(200),
    });
    const fields = fieldsFor({ type: 'landslide', data: held } as never).outputs;
    const source = fields.find((f) => f.label === 'Wave source');
    expect(source?.value).toMatch(/none/i);
    expect(held.tsunami?.sourceAmplitude ?? 0).toBe(0);
  });

  it('an earthquake prints no ring it does not have, and every printed number is finite', () => {
    const quakes = [
      simulateEarthquake({ magnitude: 4.5, depth: m(10_000), faultType: 'normal' }),
      simulateEarthquake({ magnitude: 6.5, depth: m(8_000), faultType: 'strike-slip' }),
      simulateEarthquake({
        magnitude: 9,
        depth: m(20_000),
        faultType: 'reverse',
        subductionInterface: true,
        waterDepth: m(2_000),
      }),
    ];
    for (const quake of quakes) {
      expect(
        ringsInOrder([
          quake.shaking.mmi9Radius as number,
          quake.shaking.mmi8Radius as number,
          quake.shaking.mmi7Radius as number,
        ])
      ).toBe(true);
      const fields = fieldsFor({ type: 'earthquake', data: quake } as never);
      for (const field of [...fields.inputs, ...fields.outputs]) {
        expect(field.value).not.toMatch(/NaN|Infinity|undefined|null/);
      }
      // An interface is a thrust, whatever the scenario said (B-046).
      if (quake.inputs.subductionInterface === true) expect(quake.faultTypeUsed).toBe('reverse');
    }
  });

  it('a report names the water it used, and never calls a distant sea the water under the event', () => {
    const inland = simulateExplosion({
      yieldMegatons: 1,
      heightOfBurst: m(400),
      waterDepth: m(168),
      shoreDistance: m(24_900),
    });
    const labels = fieldsFor({ type: 'explosion', data: inland } as never).inputs.map(
      (f) => f.label
    );
    expect(labels).not.toContain('Water depth at burst');
    expect(labels.some((l) => /nearest sea/i.test(l))).toBe(true);

    const inWater = simulateExplosion({
      yieldMegatons: 0.02,
      heightOfBurst: m(-30),
      waterDepth: m(60),
    });
    expect(
      fieldsFor({ type: 'explosion', data: inWater } as never).inputs.map((f) => f.label)
    ).toContain('Water depth at burst');
  });

  it('every scenario of the corners prints a finite value for every field', () => {
    const results: ActiveResult[] = [
      { type: 'impact', data: simulateImpact(body(10_000, 20_000, 45, 3_000)) },
      {
        type: 'explosion',
        data: simulateExplosion({ yieldMegatons: 50, heightOfBurst: m(4_000) }),
      },
      {
        type: 'volcano',
        data: simulateVolcano({ volumeEruptionRate: 1e7, totalEjectaVolume: 1e12, windSpeed: 20 }),
      },
      {
        type: 'landslide',
        data: simulateLandslide({ volumeM3: 1e10, slopeAngleDeg: 3, regime: 'submarine' }),
      },
      {
        type: 'earthquake',
        data: simulateEarthquake({ magnitude: 9.2, depth: m(15_000), faultType: 'reverse' }),
      },
    ];
    for (const result of results) {
      const values =
        result.type === 'impact'
          ? impactRows(result.data).map((row) => row.value)
          : [...fieldsFor(result).inputs, ...fieldsFor(result).outputs].map((f) => f.value);
      expect(values.length).toBeGreaterThan(0);
      for (const value of values) expect(value).not.toMatch(/NaN|Infinity|undefined|null/);
    }
  });
});
