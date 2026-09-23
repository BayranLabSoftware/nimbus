import { describe, expect, it } from 'vitest';
import {
  IRON_FIELD_MULTIPLE_KG,
  IRON_FIELD_SINGLE_KG,
  type IronCraterField,
} from '../events/impact/ironCraterField.js';
import {
  IMPACT_PRESETS,
  simulateImpact as simulateModel,
  type ImpactScenarioInput,
} from '../simulate.js';
/** Rule 951: a record of an earlier round, read on the crater it was measured
 *  on — Eq. 21 at any speed; under the domain of rules 945 to 952 its slow
 *  swarms are not resolved. */
const simulateImpact = (input: ImpactScenarioInput): ReturnType<typeof simulateModel> =>
  simulateModel({ ...input, craterDomain: 'legacy' });
import { IRON_FIELD_HELD_OUT_SEED } from './ironCraterFieldRules.js';

/** Rules 764 to 771: an iron's crater field ends where its fragments dig as
 *  one (B-098). */

type Result = ReturnType<typeof simulateImpact>;
const craterOf = (r: Result): number[] => [
  Number(r.crater.transientDiameter),
  Number(r.crater.finalDiameter),
  Number(r.damage.craterRim),
  Number(r.ejecta.blanketEdge1m),
];
// Craters, which no flash moves: read without the radiation's integral since
// rules 780 to 787.
const run = (input: ImpactScenarioInput, law: IronCraterField): Result =>
  simulateImpact({ ...input, ironCraterField: law, airburstRadiation: 'efficiency' });
const final = (input: ImpactScenarioInput, law: IronCraterField): number =>
  Number(run(input, law).crater.finalDiameter);

/** A body of a given mass (kg), density, speed (km/s) and angle (degrees). */
const body = (
  massKg: number,
  density: number,
  speedKmS: number,
  angleDeg: number
): ImpactScenarioInput =>
  ({
    impactorDiameter: Math.cbrt((6 * massKg) / (Math.PI * density)),
    impactVelocity: speedKmS * 1_000,
    impactorDensity: density,
    targetDensity: 2_500,
    impactAngle: (angleDeg * Math.PI) / 180,
  }) as unknown as ImpactScenarioInput;

/** B-098's body. */
const B098 = {
  impactorDiameter: 19.82551930417886,
  impactVelocity: 39435.23839209229,
  impactorDensity: 9776.086683617905,
  targetDensity: 4006.4838798716664,
  impactAngle: 1.2670616969611002,
} as unknown as ImpactScenarioInput;

describe('rules 764 to 771: an iron’s crater field ends where its fragments dig as one', () => {
  it('reads its unseen seed from the rules', () => {
    expect(IRON_FIELD_HELD_OUT_SEED).toBe('benchmark-2026-09-21-heldout-iron');
  });

  it('(a) moves no crater but an iron’s that breaks up', () => {
    let moved = 0;
    for (const d of [3, 10, 25, 60, 150, 400])
      for (const v of [12_000, 25_000, 50_000])
        for (const rho of [1_500, 3_000, 5_900, 6_000, 7_800, 9_800])
          for (const angle of [20, 45, 80]) {
            const input = {
              impactorDiameter: d,
              impactVelocity: v,
              impactorDensity: rho,
              targetDensity: 2_500,
              impactAngle: (angle * Math.PI) / 180,
            } as unknown as ImpactScenarioInput;
            const cut = run(input, 'cut');
            const mass = run(input, 'mass');
            const ironBreaks = rho >= 6_000 && Number(cut.entry.breakupAltitude) > 0;
            if (!ironBreaks) expect(craterOf(mass)).toEqual(craterOf(cut));
            else if (craterOf(mass)[1] !== craterOf(cut)[1]) moved += 1;
          }
    expect(moved).toBeGreaterThan(0);
  });

  it('(a) keeps B-098’s crater across 20 m', () => {
    const at = (d: number) => ({ ...B098, impactorDiameter: d }) as ImpactScenarioInput;
    // The cut: a crater that vanishes.
    expect(final(at(19.99), 'cut')).toBeGreaterThan(150);
    expect(final(at(20.01), 'cut')).toBe(0);
    // By mass: one crater either side.
    const below = final(at(19.99), 'mass');
    const above = final(at(20.01), 'mass');
    expect(below).toBeGreaterThan(0);
    expect(Math.abs(above - below)).toBeLessThanOrEqual(0.01 * above);
  });

  it('(a) is continuous at both masses and grows across them, on a grid of speeds and angles', () => {
    for (const density of [7_800, 9_800])
      for (const speed of [15, 20, 30, 45])
        for (const angle of [25, 45, 75]) {
          for (const edge of [IRON_FIELD_MULTIPLE_KG, IRON_FIELD_SINGLE_KG]) {
            const before = final(body(edge * 0.9999, density, speed, angle), 'mass');
            const after = final(body(edge * 1.0001, density, speed, angle), 'mass');
            expect(Math.abs(after - before), `${String(edge)} kg`).toBeLessThanOrEqual(
              0.01 * after
            );
          }
          let previous = 0;
          for (let k = 0; k <= 40; k++) {
            const massKg =
              IRON_FIELD_MULTIPLE_KG * (IRON_FIELD_SINGLE_KG / IRON_FIELD_MULTIPLE_KG) ** (k / 40);
            const d = final(body(massKg, density, speed, angle), 'mass');
            expect(
              d,
              `${String(speed)} km/s, ${String(angle)}°, ${massKg.toExponential(2)} kg`
            ).toBeGreaterThanOrEqual(previous);
            previous = d;
          }
        }
  });

  it('(a) digs Bland & Artemieva’s 10⁸ kg iron within a quarter of their craters', () => {
    // Their Fig. 2: about 1 km at 90 degrees and 0.9 km at 45, at 18 km/s.
    const vertical = final(body(1e8, 7_800, 18, 90), 'mass');
    const oblique = final(body(1e8, 7_800, 18, 45), 'mass');
    expect(Math.abs(vertical - 1_000) / 1_000).toBeLessThanOrEqual(0.25);
    expect(Math.abs(oblique - 900) / 900).toBeLessThanOrEqual(0.25);
    // The cut draws the second as an airburst, with no crater at all.
    expect(final(body(1e8, 7_800, 18, 45), 'cut')).toBe(0);
  });

  it('(c) moves no preset', () => {
    for (const preset of Object.values(IMPACT_PRESETS)) {
      const input = preset.input as ImpactScenarioInput;
      expect(craterOf(run(input, 'mass'))).toEqual(craterOf(run(input, 'cut')));
    }
  });
});
