import { describe, expect, it } from 'vitest';
import { swarmSpreadAtGround } from '../effects/atmosphericEntry.js';
import { craterFieldShare, DEFAULT_CRATER_FIELD } from '../events/impact/craterField.js';
import { simulateImpact as simulateModel, type ImpactScenarioInput } from '../simulate.js';
/** Rule 951: a record of an earlier round, read on the crater it was measured
 *  on — Eq. 21 at any speed; under the domain of rules 945 to 952 its slow
 *  swarms are not resolved. */
const simulateImpact = (input: ImpactScenarioInput): ReturnType<typeof simulateModel> =>
  simulateModel({ ...input, craterDomain: 'legacy' });
import { deg, degreesToRadians, kgPerM3, m, mps } from '../units.js';

/**
 * Rules 846 to 853 (B-123, asked again): the joined candidate, verified before
 * any score is computed.
 */

// Rule 847's body, which the sharp law halved across the burst-to-ground switch.
const SWITCH: ImpactScenarioInput = {
  impactorDiameter: m(522.5806782326731),
  impactVelocity: mps(19087.368003791198),
  impactorDensity: kgPerM3(4244.179881061427),
  targetDensity: kgPerM3(2544.8118755593896),
  impactAngle: 0.08980449376398124 as ImpactScenarioInput['impactAngle'],
  impactAzimuthDeg: 338.28827671008185,
  // Rule 847's record, measured under Eq. 9: pinned to it (rule 898(b)).
  strengthLaw: 'density',
};

const at = (k: number, craterField: NonNullable<ImpactScenarioInput['craterField']>): number =>
  simulateImpact({
    ...SWITCH,
    impactorDiameter: m((SWITCH.impactorDiameter as number) * k),
    craterField,
  }).crater.finalDiameter;

describe('rules 846 to 853: the crater field, joined', () => {
  it('keeps the whole crater up to the threshold, the half from twice it, and D_tc / L between', () => {
    expect(craterFieldShare('joined', 900, 1_000)).toBe(1);
    expect(craterFieldShare('joined', 1_000, 1_000)).toBe(1);
    expect(craterFieldShare('joined', 1_500, 1_000)).toBeCloseTo(1_000 / 1_500, 12);
    expect(craterFieldShare('joined', 2_000, 1_000)).toBe(0.5);
    expect(craterFieldShare('joined', 9_000, 1_000)).toBe(0.5);
    // The refused sharp law, kept by name, still steps.
    expect(craterFieldShare('field', 1_000, 1_000)).toBe(0.5);
    expect(craterFieldShare('single', 9_000, 1_000)).toBe(1);
  });

  it('is the default since its adoption (rule 853)', () => {
    expect(DEFAULT_CRATER_FIELD).toBe('joined');
  });

  it('keeps rule 847’s crater joined across the switch where the burst reaches the ground', () => {
    const below = simulateImpact({
      ...SWITCH,
      impactorDiameter: m((SWITCH.impactorDiameter as number) * 1.001),
    });
    const above = simulateImpact({
      ...SWITCH,
      impactorDiameter: m((SWITCH.impactorDiameter as number) * 1.002),
    });
    expect(below.entry.regime).toBe('COMPLETE_AIRBURST');
    expect(above.entry.regime).toBe('PARTIAL_AIRBURST');
    const a = at(1.001, 'joined');
    const b = at(1.002, 'joined');
    expect(b).toBeGreaterThanOrEqual(a);
    expect(b / a - 1).toBeLessThan(0.01);
    // The sharp law halved it there.
    expect(at(1.002, 'field') / at(1.001, 'field')).toBeLessThan(0.6);
  });

  it('grows rule 847’s crater with the body, at every size read', () => {
    let previous = 0;
    for (const k of [0.95, 0.99, 0.999, 1, 1.001, 1.002, 1.005, 1.01, 1.05, 1.1, 1.3, 1.6, 2]) {
      const d = at(k, 'joined');
      expect(d, `×${String(k)}`).toBeGreaterThanOrEqual(previous);
      previous = d;
    }
  });

  it('is the swarm’s crater times D_tc / L between once and twice the crater', () => {
    // Rule 841's body: s = 1.33 on the program's grid.
    const input: ImpactScenarioInput = {
      impactorDiameter: m(100),
      impactorDensity: kgPerM3(1_500),
      impactVelocity: mps(12_000),
      impactAngle: degreesToRadians(deg(60)),
      targetDensity: kgPerM3(2_500),
    };
    const single = simulateImpact({ ...input, craterField: 'single' });
    const joined = simulateImpact({ ...input, craterField: 'joined' });
    const spread = swarmSpreadAtGround({
      impactorDiameter: 100,
      impactorDensity: 1_500,
      impactAngle: input.impactAngle,
      breakupAltitude: single.entry.breakupAltitude,
    }) as number;
    const whole = single.crater.transientDiameter as number;
    expect(spread / whole).toBeGreaterThan(1);
    expect(spread / whole).toBeLessThan(2);
    expect(
      (joined.crater.transientDiameter as number) / ((whole * whole) / spread) - 1
    ).toBeLessThan(1e-9);
    expect(joined.crater.origin).toBe('craterField');
  });
});
