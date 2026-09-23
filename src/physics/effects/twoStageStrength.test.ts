import { describe, expect, it } from 'vitest';
import { simulateImpact, type ImpactScenarioInput } from '../simulate.js';
import { deg, degreesToRadians, kgPerM3, m, mps, Pa } from '../units.js';
import {
  STRENGTH_TWO_STAGE_OUTCOME,
  TWO_STAGE_DENSITY_RANGE,
  TWO_STAGE_FIRST_MAJOR_SHARE,
  TWO_STAGE_S1_PA,
  TWO_STAGE_S2_PA,
} from '../validation/strengthTwoStageRules.js';
import { STRENGTH_TWO_STAGE_AGAIN_OUTCOME } from '../validation/strengthTwoStageAgainRules.js';
import {
  collinsStrength,
  DEFAULT_STRENGTH_LAW,
  FIRST_STAGE_MAJOR_SHARE,
  FIRST_STAGE_STRENGTH,
  firstFragmentationAltitude,
  MAIN_STAGE_STRENGTH,
  mainStageStrength,
  TWO_STAGE_DENSITIES,
} from './atmosphericEntry.js';

/**
 * Rules 881 to 889, the candidate: the law as the rules write it. Nothing
 * here reads a regression case, a preset or I2 — the run of rule 885 does,
 * once.
 */
describe('a body’s strength in two stages (rules 881 to 889)', () => {
  it('holds the rules’ figures, and stays off until rule 886 decides', () => {
    expect(FIRST_STAGE_STRENGTH as number).toBe(TWO_STAGE_S1_PA);
    expect(MAIN_STAGE_STRENGTH as number).toBe(TWO_STAGE_S2_PA);
    expect(FIRST_STAGE_MAJOR_SHARE).toBe(TWO_STAGE_FIRST_MAJOR_SHARE);
    expect(TWO_STAGE_DENSITIES).toEqual(TWO_STAGE_DENSITY_RANGE);
    // Refused by rule 886(d); asked again by rules 896 to 902, whose outcome
    // decides the default (the candidate's own test, rule 898(c)).
    expect(STRENGTH_TWO_STAGE_OUTCOME).toMatch(/^REFUSED/);
    expect(DEFAULT_STRENGTH_LAW).toBe(
      STRENGTH_TWO_STAGE_AGAIN_OUTCOME?.startsWith('ADOPTED') === true ? 'twoStage' : 'density'
    );
  });

  it('starts the pancake at S2 for a stony body, and leaves irons and light bodies alone', () => {
    expect(mainStageStrength('density', undefined, 3_300)).toBeUndefined();
    expect(mainStageStrength('twoStage', undefined, 3_300)).toBe(MAIN_STAGE_STRENGTH);
    expect(mainStageStrength('twoStage', Pa(1e6), 3_300)).toBe(1e6);
    expect(mainStageStrength('twoStage', undefined, 7_800)).toBeUndefined();
    expect(mainStageStrength('twoStage', undefined, 1_500)).toBeUndefined();
    expect(mainStageStrength('twoStage', undefined, 2_500)).toBe(MAIN_STAGE_STRENGTH);
    expect(mainStageStrength('twoStage', undefined, 5_000)).toBeUndefined();
  });

  it('puts the first fragmentation where the whole body’s dynamic pressure first reaches S1', () => {
    const body = { diameter: 1, velocity: 15_000, density: 3_300, angle: Math.PI / 3 };
    const z = firstFragmentationAltitude({ ...body, strength: FIRST_STAGE_STRENGTH }) as number;
    // Eq. 8's speed and the model's atmosphere (ρ₀ = 1 kg/m³, H = 8 km, C_D = 2).
    const rho = Math.exp(-z / 8_000);
    const a = (3 * 2 * 8_000) / (4 * body.density * body.diameter * Math.sin(body.angle));
    const v = body.velocity * Math.exp(-a * rho);
    expect((rho * v * v) / (FIRST_STAGE_STRENGTH as number)).toBeCloseTo(1, 9);
    // Above it the pressure is lower, so it is the first crossing.
    const above = Math.exp(-(z + 1_000) / 8_000);
    expect(above * (body.velocity * Math.exp(-a * above)) ** 2).toBeLessThan(FIRST_STAGE_STRENGTH);
    // A stronger first stage breaks lower; a body too slow never reaches it.
    expect(
      firstFragmentationAltitude({ ...body, strength: 2 * (FIRST_STAGE_STRENGTH as number) })
    ).toBeLessThan(z);
    expect(firstFragmentationAltitude({ ...body, velocity: 100, strength: 1e5 })).toBe(0);
  });

  it('reports the first stage only under the law, and today’s law answers as before when named', () => {
    const input: ImpactScenarioInput = {
      impactorDiameter: m(1),
      impactVelocity: mps(15_000),
      impactorDensity: kgPerM3(3_300),
      targetDensity: kgPerM3(2_700),
      impactAngle: degreesToRadians(deg(60)),
    };
    const today = simulateImpact({ ...input, strengthLaw: 'density' });
    expect('firstFragmentationAltitude' in today.entry).toBe(false);
    const two = simulateImpact({ ...input, strengthLaw: 'twoStage' });
    expect(two.entry.firstFragmentationMajorShare).toBe(FIRST_STAGE_MAJOR_SHARE);
    expect(two.entry.firstFragmentationAltitude as number).toBeGreaterThan(
      two.entry.breakupAltitude
    );
    // The pancake starts at S2, stronger than Eq. 9 at this density, so lower.
    expect(MAIN_STAGE_STRENGTH as number).toBeGreaterThan(collinsStrength(kgPerM3(3_300)));
    expect(two.entry.breakupAltitude as number).toBeLessThan(today.entry.breakupAltitude);
  });
});

describe('rule 896(i): the Monte Carlo draws the two strengths under the law', () => {
  it('draws S1 and S2 in their intervals for a covered body, and nothing under today’s law', async () => {
    const { impactSampler } = await import('../montecarlo/impactMonteCarlo.js');
    const { mulberry32 } = await import('../montecarlo/sampling.js');
    const nominal: ImpactScenarioInput = {
      impactorDiameter: m(1),
      impactVelocity: mps(15_000),
      impactorDensity: kgPerM3(3_300),
      targetDensity: kgPerM3(2_700),
      impactAngle: degreesToRadians(deg(60)),
    };
    const two = impactSampler({ ...nominal, strengthLaw: 'twoStage' });
    const rng = mulberry32('rule-896');
    for (let i = 0; i < 200; i++) {
      const s = two(rng);
      if (s.impactorStrength === undefined) continue;
      expect(s.impactorStrength as number).toBeGreaterThanOrEqual(900_000);
      expect(s.impactorStrength as number).toBeLessThanOrEqual(5_000_000);
      expect(s.firstStageStrength as number).toBeGreaterThanOrEqual(40_000);
      expect(s.firstStageStrength as number).toBeLessThanOrEqual(120_000);
    }
    const today = impactSampler({ ...nominal, strengthLaw: 'density' })(mulberry32('rule-896'));
    expect(today.impactorStrength).toBeUndefined();
    expect(today.firstStageStrength).toBeUndefined();
  });
});
