import { describe, expect, it } from 'vitest';
import { GROUND_BLAST_MIN_CROSSOVER, groundImpactOverpressure } from '../effects/airburstBlast.js';
import { impactOverpressureAt } from '../events/impact/impactField.js';
import { IMPACT_PRESETS, simulateImpact, type ImpactScenarioInput } from '../simulate.js';
import { J, m } from '../units.js';
import { EIEP_REFERENCE } from './eiepReference.js';
import { simulateEiepRow } from './eiepComparison.js';
import { GROUND_BLAST_BODIES } from './groundBlastRules.js';
import { VERIFIED_MIN_CROSSOVER } from './groundBlastFloorRules.js';

/**
 * Rules 630 to 637 — B-088, an impact that reaches the ground and makes no
 * air blast. ADOPTED on 21 September 2026: `DEFAULT_GROUND_BLAST` is
 * `programHeld`.
 *
 * THE RUN, the impact sweep's 5 000 scenarios under both laws on one commit
 * in one session (`benchmark/results/invariants-2026-09-21-1.json` for the
 * law in place, `-2` for the held law):
 *
 *                                             in place    held
 *   ground impacts above 1 kt with no blast         46       0
 *   blast rings shrinking as a body grows          408     396
 *   field samples jumping under a 0.1 % step        14      10
 *
 * Every prediction of rule 635 held: (a) none of the 69 checked points
 * moves, (b) no preset moves, (c) the report changes in this round's lines
 * only, (d) the 46 are none, (e) the 814 m body's four field samples no
 * longer jump and the held law adds no jump of its own — its ten are among
 * the law in place's fourteen. And what was expected without deciding came
 * true: the twelve rings that shrank below the held crossover went, and the
 * dip above it, where the program has been checked, stayed — IMP-2b's.
 */

const crossover = (virtualBurstAltitude: number, blastYield: number): number =>
  290 + (0.65 * Math.min(virtualBurstAltitude, 0)) / Math.cbrt(blastYield / 4.184e12);

/** Every point at which the program's ground blast has been checked here:
 *  the I1 grid's ground rows, and the twelve held-out bodies of rule 139 at
 *  each of their ranges. */
function checkedPoints(): { input: ImpactScenarioInput; rangeM: number }[] {
  const out: { input: ImpactScenarioInput; rangeM: number }[] = [];
  for (const row of EIEP_REFERENCE) {
    if (row.error !== null) continue;
    const airburst = row.burstAltitudeM !== null && row.burstAltitudeM !== undefined;
    if (airburst || row.overpressurePa === null || row.overpressurePa === undefined) continue;
    const r = simulateEiepRow(row);
    if (r.entry.regime === 'COMPLETE_AIRBURST') continue;
    out.push({ input: r.inputs, rangeM: row.distanceKm * 1_000 });
  }
  for (const b of GROUND_BLAST_BODIES) {
    const input = {
      impactorDiameter: m(b.diameterM),
      impactVelocity: b.velocityKmS * 1_000,
      impactorDensity: b.densityKgM3,
      targetDensity: b.target === 'sedimentary' ? 2_500 : 2_750,
      impactAngle: (b.angleDeg * Math.PI) / 180,
    } as unknown as ImpactScenarioInput;
    const r = simulateImpact(input);
    if (r.entry.regime === 'COMPLETE_AIRBURST') continue;
    for (const km of b.rangesKm) out.push({ input, rangeM: km * 1_000 });
  }
  return out;
}

describe('rules 630 to 637: no ground impact without an air blast', () => {
  it('holds the crossover at the shortest the program has been checked at (rule 632)', () => {
    expect(GROUND_BLAST_MIN_CROSSOVER).toBe(VERIFIED_MIN_CROSSOVER);
    let shortest = Infinity;
    let rows = 0;
    // One reading per grid row and one per held-out body: the 69 of rule 632
    // (a body's crossover does not depend on the range it is read at).
    const bodies = new Set<string>();
    const readings = checkedPoints().filter(({ input }) => {
      const key = JSON.stringify(input);
      if (!GROUND_BLAST_BODIES.some((b) => b.diameterM === Number(input.impactorDiameter)))
        return true;
      if (bodies.has(key)) return false;
      bodies.add(key);
      return true;
    });
    for (const { input } of readings) {
      rows++;
      const r = simulateImpact(input);
      const f = r.entry.energyFractionToGround;
      const w = Number(r.impactor.kineticEnergy) * Math.max(f, 1 - f);
      shortest = Math.min(shortest, crossover(Number(r.entry.virtualBurstAltitude), w));
    }
    // 57 grid rows and 12 bodies.
    expect(rows).toBe(69);
    expect(shortest).toBeCloseTo(VERIFIED_MIN_CROSSOVER, 8);
  });

  it('moves none of the checked points (rule 635 a)', () => {
    let points = 0;
    for (const { input, rangeM } of checkedPoints()) {
      const r = simulateImpact(input);
      const f = r.entry.energyFractionToGround;
      const blast = (held: boolean): number =>
        Number(
          groundImpactOverpressure({
            groundRange: m(rangeM),
            virtualBurstAltitude: r.entry.virtualBurstAltitude,
            blastYield: J(Number(r.impactor.kineticEnergy) * Math.max(f, 1 - f)),
            held,
          })
        );
      expect(blast(true), `${JSON.stringify(input)} at ${String(rangeM)} m`).toBe(blast(false));
      points++;
    }
    expect(points).toBeGreaterThanOrEqual(69);
  });

  it('moves no preset (rule 635 b)', () => {
    for (const [name, preset] of Object.entries(IMPACT_PRESETS)) {
      const held = simulateImpact({ ...preset.input, groundBlast: 'programHeld' });
      const program = simulateImpact({ ...preset.input, groundBlast: 'program' });
      for (const ring of ['overpressure5psi', 'overpressure1psi', 'lightDamage'] as const) {
        expect(Number(held.damage[ring]), `${name} ${ring}`).toBe(Number(program.damage[ring]));
      }
    }
  });

  it('gives the 663 Mt impact the blast it lacked (rule 635 d)', () => {
    const body = {
      impactorDiameter: m(417.13418122547324),
      impactVelocity: 3969.9988020583987,
      impactorDensity: 9261.443808092736,
      targetDensity: 1657.6030226424336,
      impactAngle: 1.4864339020819193,
      impactAzimuthDeg: 85.946339039132,
    } as unknown as ImpactScenarioInput;
    const program = simulateImpact({ ...body, groundBlast: 'program' });
    const held = simulateImpact({ ...body, groundBlast: 'programHeld' });
    expect(Number(program.impactor.kineticEnergyMegatons)).toBeCloseTo(662.9, 0);
    expect(Number(program.damage.lightDamage)).toBe(0);
    expect(Number(held.damage.lightDamage)).toBeGreaterThan(1_000);
    expect(Number(held.damage.overpressure5psi)).toBeGreaterThan(0);
  });

  it('keeps the 814 m body’s field from jumping (rule 635 e)', () => {
    const body = {
      impactorDiameter: m(814.1068200627946),
      impactVelocity: 3300.5234468728304,
      impactorDensity: 965.6114737736061,
      targetDensity: 2048.5515948385,
      impactAngle: 1.0776739843550667,
      impactAzimuthDeg: 167.28971947240643,
    } as unknown as ImpactScenarioInput;
    const move = (law: 'program' | 'programHeld'): number => {
      const a = simulateImpact({ ...body, groundBlast: law });
      const b = simulateImpact({
        ...body,
        impactorDiameter: m(Number(body.impactorDiameter) * 1.001),
        groundBlast: law,
      });
      const pa = impactOverpressureAt(a, 1e4);
      const pb = impactOverpressureAt(b, 1e4);
      return Math.abs(pb - pa) / Math.max(pa, pb);
    };
    // What IMP-1 found under the law in place: 6.2 % at 10 km.
    expect(move('program')).toBeGreaterThan(0.05);
    expect(move('programHeld')).toBeLessThan(0.05);
  });
});
