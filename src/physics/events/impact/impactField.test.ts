import { describe, expect, it } from 'vitest';
import { thermalHorizonRadius } from '../../casualties.js';
import { SECOND_DEGREE_BURN_FLUENCE, THIRD_DEGREE_BURN_FLUENCE } from '../../constants.js';
import { EARTH_RADIUS } from '../../constants.js';
import { impactFireballRadius } from '../../effects/blastWave.js';
import { mulberry32 } from '../../montecarlo/sampling.js';
import { simulateImpact } from '../../simulate.js';
import { FIELD_RANGES_M } from '../../validation/continuityRules.js';
import { SWEEP_SEED } from '../../validation/physicalInvariantRules.js';
import { J } from '../../units.js';
import {
  OVERPRESSURE_BUILDING_COLLAPSE,
  OVERPRESSURE_LIGHT_DAMAGE,
  OVERPRESSURE_WINDOW_BREAK,
} from './damageRings.js';
import {
  IMPACT_FIELD_RANGES_M,
  impactFieldKey,
  impactFieldReach,
  impactOverpressureAt,
  impactThermalExposureAt,
} from './impactField.js';
import { IMPACT_PRESETS } from '../../simulate.js';

/**
 * Rule 626 of `validation/continuityRules.ts`: the field G5's harness reads
 * must be the field the product draws its rings from. A field computed beside
 * the model would check a second model and nothing about this one.
 *
 * So, on the invariant sweep's own impact scenarios — every entry regime,
 * bodies from a metre to a hundred thousand kilometres — the overpressure at
 * the radius of each overpressure ring is that ring's threshold, and the
 * thermal exposure at the radius of each burn ring the fireball's horizon did
 * not cut is that burn's threshold.
 */

const RINGS = [
  ['overpressure5psi', OVERPRESSURE_BUILDING_COLLAPSE],
  ['overpressure1psi', OVERPRESSURE_WINDOW_BREAK],
  ['lightDamage', OVERPRESSURE_LIGHT_DAMAGE],
] as const;

const BURNS = [
  ['thirdDegreeBurn', THIRD_DEGREE_BURN_FLUENCE],
  ['secondDegreeBurn', SECOND_DEGREE_BURN_FLUENCE],
] as const;

describe('rule 626: the field is the one the rings are drawn from', () => {
  it('samples the ranges the rules fixed', () => {
    expect([...IMPACT_FIELD_RANGES_M]).toEqual([...FIELD_RANGES_M]);
  });

  it('meets every ring at its threshold, on every entry regime', async () => {
    const { HAZARDS } = await import('../../../../scripts/benchmark/invariants.js');
    const impact = HAZARDS.find((h) => h.name === 'impact');
    if (impact === undefined) throw new Error('the sweep has no impact family');
    const rng = mulberry32(SWEEP_SEED('impact'));
    const u = (): number => rng.next();
    const checkedByRegime = new Map<string, number>();
    let burnsChecked = 0;
    for (let i = 0; i < 400; i++) {
      const input = impact.sample(u);
      let r: ReturnType<typeof simulateImpact>;
      try {
        r = simulateImpact(input as never);
      } catch {
        continue;
      }
      const regime = r.entry.regime;
      const antipode = Math.PI * (EARTH_RADIUS as number);
      for (const [ring, threshold] of RINGS) {
        const radius = Number(r.damage[ring]);
        // A ring at the antipode holds the whole planet: it is cut there by
        // the sphere, not drawn where its threshold is crossed.
        if (!(radius > 1) || radius >= antipode - 1) continue;
        const p = impactOverpressureAt(r, radius);
        expect(p / Number(threshold), `${regime} ${ring} at ${radius.toFixed(1)} m`).toBeCloseTo(
          1,
          3
        );
        checkedByRegime.set(regime, (checkedByRegime.get(regime) ?? 0) + 1);
      }
      const flashReach = Math.min(
        thermalHorizonRadius(impactFireballRadius(J(Number(r.impactor.kineticEnergy)))),
        Math.PI * (EARTH_RADIUS as number)
      );
      for (const [burn, threshold] of BURNS) {
        const radius = Number(r.damage[burn]);
        // A ring the horizon cut is drawn at the horizon, not at its fluence.
        if (!(radius > 1) || radius >= flashReach - 1) continue;
        const q = impactThermalExposureAt(r, radius);
        expect(q / threshold, `${regime} ${burn} at ${radius.toFixed(1)} m`).toBeCloseTo(1, 3);
        burnsChecked++;
      }
      // What the result publishes is what the functions give.
      for (const range of IMPACT_FIELD_RANGES_M) {
        expect(r.field[impactFieldKey('overpressure', range)]).toBe(impactOverpressureAt(r, range));
        expect(r.field[impactFieldKey('thermalExposure', range)]).toBe(
          impactThermalExposureAt(r, range)
        );
      }
    }
    // Every regime is reached, or the check is not the check it says it is.
    for (const regime of ['INTACT', 'PARTIAL_AIRBURST', 'COMPLETE_AIRBURST']) {
      expect(checkedByRegime.get(regime) ?? 0, regime).toBeGreaterThan(20);
    }
    expect(burnsChecked).toBeGreaterThan(100);
  }, 60_000);
});

describe('impactFieldReach: a level of the field is found where the field says', () => {
  it('finds every overpressure ring of the presets where the result publishes it', () => {
    for (const key of ['METEOR_CRATER', 'TUNGUSKA', 'CHICXULUB', 'SIKHOTE_ALIN_1947'] as const) {
      const input = IMPACT_PRESETS[key].input;
      const r = simulateImpact(input);
      const source = {
        inputs: input,
        impactor: { kineticEnergy: r.impactor.kineticEnergy },
        entry: r.entry,
        radiantHeat: r.radiantHeat,
      };
      for (const [ring, threshold] of RINGS) {
        const published = r.damage[ring] as number;
        if (!(published > 0)) continue;
        const found = impactFieldReach(
          (range) => impactOverpressureAt(source, range),
          threshold,
          1,
          Math.max(published * 4, 1e4)
        );
        expect(Math.abs(found / published - 1), `${key} ${ring}`).toBeLessThan(1e-6);
      }
    }
  });

  it('says nowhere where the field never reaches the level, and the far end where it still does', () => {
    const flat = (): number => 5;
    expect(impactFieldReach(flat, 10, 1, 1e5)).toBe(0);
    expect(impactFieldReach(flat, 1, 1, 1e5)).toBe(1e5);
    expect(impactFieldReach(flat, 0, 1, 1e5)).toBe(0);
  });
});
