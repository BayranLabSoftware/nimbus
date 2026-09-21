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
 * WHAT THE REFUSAL FOUND. One defect, and one mistake of the causes' own.
 *
 *   B-089, the entry. A 30 m iron at 17° from the horizon. Between a body
 *   0.5 % and one 1 % larger than it, the share of its energy reaching the
 *   ground falls from 0.628 to 0.558 and Eq. 18's altitude sinks 1.5 km at
 *   once; every blast ring halves. A body does not change what reaches the
 *   ground by a tenth for half a per cent of its size.
 *
 *   B-090, registered the same hour and WITHDRAWN: not a defect. A 6.8 m iron
 *   bursting near a kilometre; its burst altitude and yield rise smoothly and
 *   its 1 psi ring falls from 5 271 m to 3 093 m. This file first called that
 *   a dip Glasstone & Dolan's height-of-burst curves do not have. They have
 *   it: read against the project's own trace of Figure 3.73c, the book's 5 psi
 *   ring falls 32 % between scaled heights of 300 and 350, the knee of §3.73
 *   where the Mach contour folds back. The curve has ONE optimum; the body's
 *   1 % step carried its burst across it onto the steep side, and cause (i),
 *   which read the distance to the optimum and not the side of it, missed
 *   that. So this ring is the height of burst after all — and the causes as
 *   written could not say so, which is a fault of theirs.
 *
 * So the statement is refused, one defect is registered, and one flaw of the
 * causes is on record. A statement that is right about the physics can be
 * tested again only on a seed nobody has read, and only after the model
 * stops jumping under it (B-089).
 */

// Both were read on the program's entry equations, and are pinned there
// whichever entry is the default (rules 667 to 675, `entryPaperRules.ts`).
const B089 = {
  entryEquations: 'program',
  impactorDiameter: 30.35083106505634,
  impactVelocity: 13632.485304726288,
  impactorDensity: 9127.968714106828,
  targetDensity: 2456.329144537449,
  impactAngle: 0.2988136637231071,
  impactAzimuthDeg: 18.744597191689536,
} as unknown as ImpactScenarioInput;

const B090 = {
  entryEquations: 'program',
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

  it('B-090, withdrawn: the ring crosses the knee, which the book has too', () => {
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

  it('leaves its causes unread by the harness, which reads rule 685’s statement instead', async () => {
    const { HAZARDS, explainImpactBlastShrink } =
      await import('../../../scripts/benchmark/invariants.js');
    const impact = HAZARDS.find((h) => h.name === 'impact');
    expect(impact?.explainShrink).toBeDefined();
    expect(impact?.explainShrink).not.toBe(explainImpactBlastShrink);
  });
});
