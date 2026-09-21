import { describe, expect, it } from 'vitest';
import {
  CONTINUITY_STEP,
  CONTINUITY_TOLERANCE,
  FIELD_FLOOR,
  FIELD_RANGES_M,
} from './continuityRules.js';

/**
 * Rules 621 to 629 — G5's harness read by the protocol's own definition, for
 * impacts. IMP-1 of ROADMAP.md, M11.
 *
 * THE RUN, 21 September 2026, the impact family's 5 000 scenarios on the
 * sweep's own seed, both checks read in the same run
 * (`benchmark/results/invariants-2026-09-21.json`):
 *
 *   monotone in size        408 blast rings, 38 magnitudes, 2 wave
 *                           amplitudes, 1 burn ring, 1 crater rim,
 *                           1 final crater                          451
 *   continuous, as it was   13 contours — 5 at 1 psi, 4 at 5 psi,
 *                           4 of light damage                        13
 *   continuous (contour)    none at a regime switch                   0
 *   continuous (field)      14 samples                               14
 *
 * Against what rule 628 wrote before the run:
 *
 *   (a) HELD. The thirteen contours at an unchanged regime are no longer
 *       counted, and the old check, in the same run, still finds all of them.
 *   (b) WRONG, and the rule's own mistake. It expected the two failures at the
 *       simple-to-complex crater transition to remain as continuity failures.
 *       They were never continuity failures: they are the 1 % step of the
 *       monotonicity check crossing the transition — which is how
 *       `events/impact/craterTransition.test.ts` found them — and they are
 *       counted, under monotonicity, as before.
 *   (c) HELD. Every monotonicity count is the one of 16 September.
 *   (d) CONTRADICTED. The field is not continuous everywhere. Fourteen samples
 *       jump by more than 5 % for a body 0.1 % larger: the thermal exposure at
 *       1 000 km in five scenarios, of bodies 2 to 18 km across; the
 *       overpressure at 100 km in four, airbursts of 23 to 46 m; and two
 *       single bodies whose whole field moves at once — 814 m at 3.3 km/s,
 *       from 1 to 30 km, and 155 m at 9.7° from the horizon, at 1 km. The old
 *       check could not have seen any of them, since it read no field.
 *
 * So the corrected harness is stricter than the old one, as rule 624 meant it
 * to be: it drops thirteen readings no correct model can pass and finds
 * fourteen it had never looked for. What those fourteen are — a field that
 * jumps, or one that is continuous and ill-conditioned the way the fireball
 * rises over a far observer's horizon from nothing — is IMP-2's to settle, by
 * refining the step, and rule 628(d) forbids explaining them away here.
 */
describe('rules 621 to 629: the harness as the protocol defines it', () => {
  it('keeps the step and the tolerance the harness always had', () => {
    expect(CONTINUITY_STEP).toBe(1.001);
    expect(CONTINUITY_TOLERANCE).toBe(0.05);
  });

  it('samples the field at the seven ranges and floors the rules fixed', () => {
    expect([...FIELD_RANGES_M]).toEqual([1e3, 3e3, 1e4, 3e4, 1e5, 3e5, 1e6]);
    expect(FIELD_FLOOR.overpressurePa).toBe(100);
    expect(FIELD_FLOOR.thermalExposureJm2).toBe(1_000);
  });

  it('gives impacts a regime, their contours and their field, and no other hazard', async () => {
    const { HAZARDS } = await import('../../../scripts/benchmark/invariants.js');
    const impact = HAZARDS.find((h) => h.name === 'impact');
    expect(impact?.regime).toBeTypeOf('function');
    expect(impact?.contours).toHaveLength(8);
    // Rule 756 of lowBurstCraterRules.ts: the final crater's birth only.
    expect(impact?.births).toEqual(['crater.finalDiameter']);
    expect(impact?.fields).toHaveLength(14);
    // The module rule of 21 September: no other domain is opened here.
    for (const h of HAZARDS.filter((x) => x.name !== 'impact')) {
      expect(h.regime, h.name).toBeUndefined();
      expect(h.fields, h.name).toBeUndefined();
    }
  });
});
