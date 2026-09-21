import { describe, expect, it } from 'vitest';
import { simulateImpact, type ImpactScenarioInput } from '../simulate.js';
import { HELD_OUT_SWEEP_SEED } from './blastShrinkRules.js';

/**
 * Rules 638 to 646 — REFUSED on 21 September 2026.
 *
 * THE RUN, 5 000 impact scenarios drawn the sweep's way on a seed no run had
 * used, `benchmark-2026-09-21-heldout-impact`, under the law in place
 * (`benchmark/results/invariants-2026-09-21-3.json`):
 *
 *   blast rings shrinking as a body grows by 1 %          318
 *     explained, from the air to the ground               174
 *     explained, height of burst                          140
 *     with neither cause                                    4
 *
 * Rule 642 refuses the statement on a single ring with neither cause, and
 * there are four, in two scenarios. Rule 646 forbids rewriting the two causes
 * to take them in, and they are not. The harness does not read the causes;
 * every shrinking ring counts, as before.
 *
 * WHAT THE REFUSAL FOUND. Neither scenario is physics the two causes missed.
 * Both are the model jumping:
 *
 *   B-089, the entry. A 30 m iron at 17° from the horizon. Between a body
 *   0.5 % and one 1 % larger than it, the share of its energy reaching the
 *   ground falls from 0.628 to 0.558 and Eq. 18's altitude sinks 1.5 km at
 *   once; every blast ring halves. A body does not change what reaches the
 *   ground by a tenth for half a per cent of its size.
 *
 *   B-090, the blast. A 6.8 m iron bursting near a kilometre. Its burst
 *   altitude and its yield both rise smoothly, and its 1 psi ring falls from
 *   5 271 m to 3 093 m over a 1.2 % range of size: as the edge of the Mach
 *   region moves out past the ring, the program's linear blend between
 *   regular and Mach reflection lets the ring collapse. Glasstone & Dolan's
 *   height-of-burst curves are smooth, with one optimum for each overpressure;
 *   this one has a dip the world does not. It is also why rule 640's cause (i)
 *   could not see it: its "optimum height" assumed a curve with one peak.
 *
 * So the statement is refused, and two defects are registered in its place.
 * A statement that is right about the physics can be tested again only on a
 * seed nobody has read, and only after the model stops jumping under it.
 */

const B089 = {
  impactorDiameter: 30.35083106505634,
  impactVelocity: 13632.485304726288,
  impactorDensity: 9127.968714106828,
  targetDensity: 2456.329144537449,
  impactAngle: 0.2988136637231071,
  impactAzimuthDeg: 18.744597191689536,
} as unknown as ImpactScenarioInput;

const B090 = {
  impactorDiameter: 6.775448268956815,
  impactVelocity: 9247.191035188735,
  impactorDensity: 7234.419007087126,
  targetDensity: 1010.1746190339327,
  impactAngle: 1.0018638518184344,
  impactAzimuthDeg: 84.49035208928399,
} as unknown as ImpactScenarioInput;

const grown = (input: ImpactScenarioInput, k: number): ReturnType<typeof simulateImpact> =>
  simulateImpact({ ...input, impactorDiameter: (Number(input.impactorDiameter) * k) as never });

describe('rules 638 to 646: refused, and what the refusal found', () => {
  it('was run on a seed no run had used', () => {
    expect(HELD_OUT_SWEEP_SEED).toBe('benchmark-2026-09-21-heldout-impact');
  });

  it('B-089: the entry jumps, and every blast ring halves', () => {
    const a = grown(B089, 1.005);
    const b = grown(B089, 1.01);
    expect(a.entry.regime).toBe('PARTIAL_AIRBURST');
    expect(b.entry.regime).toBe('PARTIAL_AIRBURST');
    expect(a.entry.energyFractionToGround).toBeCloseTo(0.6281, 3);
    expect(b.entry.energyFractionToGround).toBeCloseTo(0.5584, 3);
    expect(
      Number(b.entry.virtualBurstAltitude) - Number(a.entry.virtualBurstAltitude)
    ).toBeLessThan(-1_000);
    expect(Number(b.damage.overpressure1psi) / Number(a.damage.overpressure1psi)).toBeLessThan(
      0.55
    );
  });

  it('B-090: the blast collapses while the burst rises smoothly', () => {
    const a = grown(B090, 1.007);
    const b = grown(B090, 1.01);
    expect(a.entry.regime).toBe('COMPLETE_AIRBURST');
    expect(b.entry.regime).toBe('COMPLETE_AIRBURST');
    // The source moves by little ...
    expect(Number(b.entry.burstAltitude) / Number(a.entry.burstAltitude)).toBeLessThan(1.05);
    expect(b.entry.blastYieldMegatons).toBeGreaterThan(a.entry.blastYieldMegatons);
    // ... and the ring loses two fifths.
    expect(Number(a.damage.overpressure1psi)).toBeCloseTo(5_271, -1);
    expect(Number(b.damage.overpressure1psi)).toBeCloseTo(3_093, -1);
  });

  it('leaves the causes unread by the harness', async () => {
    const { HAZARDS } = await import('../../../scripts/benchmark/invariants.js');
    const impact = HAZARDS.find((h) => h.name === 'impact');
    expect(impact?.explainShrink).toBeUndefined();
  });
});
