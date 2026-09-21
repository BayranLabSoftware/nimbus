import { describe, expect, it } from 'vitest';
import {
  OVERPRESSURE_BUILDING_COLLAPSE,
  OVERPRESSURE_LIGHT_DAMAGE,
  OVERPRESSURE_WINDOW_BREAK,
} from '../events/impact/damageRings.js';
import { groundImpactReach } from '../effects/airburstBlast.js';
import { IMPACT_PRESETS, simulateImpact, type ImpactScenarioInput } from '../simulate.js';
import { J, m } from '../units.js';
import { SURFACE_BLAST_HELD_OUT_SEED } from './surfaceBlastRules.js';

/** Rules 748 to 755: an impact that reaches the ground bursts at the ground. */

type Result = ReturnType<typeof simulateImpact>;
const RINGS = [
  ['overpressure5psi', OVERPRESSURE_BUILDING_COLLAPSE],
  ['overpressure1psi', OVERPRESSURE_WINDOW_BREAK],
  ['lightDamage', OVERPRESSURE_LIGHT_DAMAGE],
] as const;
const blastRings = (r: Result): number[] => RINGS.map(([k]) => Number(r.damage[k]));
const overpressureField = (r: Result): number[] =>
  Object.entries(r.field)
    .filter(([key]) => key.startsWith('overpressure'))
    .map(([, value]) => value);

/** Bodies of every entry regime the form draws, and the presets. */
const BODIES: ImpactScenarioInput[] = [
  ...Object.values(IMPACT_PRESETS).map((p) => p.input as ImpactScenarioInput),
  ...[10, 40, 120, 400, 1_500, 8_000].flatMap((d) =>
    [12_000, 25_000, 50_000].flatMap((v) =>
      [1_500, 3_000, 7_800].map(
        (rho) =>
          ({
            impactorDiameter: d,
            impactVelocity: v,
            impactorDensity: rho,
            targetDensity: 2_500,
            impactAngle: Math.PI / 4,
          }) as unknown as ImpactScenarioInput
      )
    )
  ),
];

describe('rules 748 to 755: an impact that reaches the ground bursts at the ground', () => {
  it('reads its unseen seed from the rules', () => {
    expect(SURFACE_BLAST_HELD_OUT_SEED).toBe('benchmark-2026-09-21-heldout-surface');
  });

  it('(a) moves nothing of a complete airburst', () => {
    let airbursts = 0;
    for (const input of BODIES) {
      const held = simulateImpact({ ...input, groundBlast: 'programHeld' });
      if (held.entry.regime !== 'COMPLETE_AIRBURST') continue;
      const surface = simulateImpact({ ...input, groundBlast: 'surface' });
      expect(blastRings(surface)).toEqual(blastRings(held));
      expect(overpressureField(surface)).toEqual(overpressureField(held));
      airbursts += 1;
    }
    expect(airbursts).toBeGreaterThan(5);
  });

  it('(a) draws a ground impact’s rings from the law at the ground, on the program’s energy', () => {
    let ground = 0;
    for (const input of BODIES) {
      const r = simulateImpact({ ...input, groundBlast: 'surface' });
      if (r.entry.regime === 'COMPLETE_AIRBURST') continue;
      const f = r.entry.energyFractionToGround;
      const energy = J(Number(r.impactor.kineticEnergy) * Math.max(f, 1 - f));
      RINGS.forEach(([key, threshold]) => {
        expect(Number(r.damage[key])).toBe(
          Number(groundImpactReach(threshold, m(0), energy, false))
        );
      });
      ground += 1;
    }
    expect(ground).toBeGreaterThan(20);
  });

  it('(d) moves the presets as rule 751 lists them', () => {
    const ring = (id: keyof typeof IMPACT_PRESETS, law: 'surface' | 'programHeld') =>
      Number(
        simulateImpact({ ...IMPACT_PRESETS[id].input, groundBlast: law }).damage.overpressure1psi
      ) / 1_000;
    expect(ring('METEOR_CRATER', 'programHeld')).toBeCloseTo(5.21, 2);
    expect(ring('METEOR_CRATER', 'surface')).toBeCloseTo(22.74, 2);
    expect(ring('CHICXULUB', 'surface') / ring('CHICXULUB', 'programHeld')).toBeCloseTo(1.03, 2);
    for (const id of ['TUNGUSKA', 'CHELYABINSK', 'SIKHOTE_ALIN_1947'] as const) {
      expect(ring(id, 'surface')).toBe(ring(id, 'programHeld'));
    }
  });
});
