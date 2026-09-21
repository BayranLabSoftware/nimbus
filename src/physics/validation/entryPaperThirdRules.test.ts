import { describe, expect, it } from 'vitest';
import { DEFAULT_ENTRY_EQUATIONS } from '../effects/atmosphericEntry.js';
import { impactOverpressureAt } from '../events/impact/impactField.js';
import { simulateImpact, type ImpactScenarioInput } from '../simulate.js';
import { ENTRY_THIRD_HELD_OUT_SEED } from './entryPaperThirdRules.js';
import { searchFieldJump } from './fieldJump.js';
import { FIELD_JUMP_SHARE } from './fieldJumpRules.js';

/** Rules 691 to 697: the paper's entry as the default, and B-089 gone. */

const B089 = {
  impactorDiameter: 30.35083106505634,
  impactVelocity: 13632.485304726288,
  impactorDensity: 9127.968714106828,
  targetDensity: 2456.329144537449,
  impactAngle: 0.2988136637231071,
} as unknown as ImpactScenarioInput;

const grown = (k: number): ReturnType<typeof simulateImpact> =>
  simulateImpact({ ...B089, impactorDiameter: (Number(B089.impactorDiameter) * k) as never });

describe('rules 691 to 697: the entry on its paper’s equations', () => {
  it('reads its unseen seed from the rules', () => {
    expect(ENTRY_THIRD_HELD_OUT_SEED).toBe('benchmark-2026-09-21-heldout-entry-3');
  });

  it('is the default', () => {
    expect(DEFAULT_ENTRY_EQUATIONS).toBe('paper');
  });

  it('(g) grows B-089’s body through the old seam with no step', () => {
    // The share of the energy at the ground, in steps of 0.005 %, from 1.004
    // to 1.010 times the body: the program's entry falls by a ninth at once.
    let previous: number | undefined;
    let worst = 1;
    for (let i = 0; i <= 120; i++) {
      const f = grown(1.004 + 0.00005 * i).entry.energyFractionToGround;
      if (previous !== undefined) worst = Math.max(worst, f / previous, previous / f);
      previous = f;
    }
    expect(worst).toBeLessThan(1.0001);
    // And the field at 1 km, across a 0.1 % step with the old seam at its
    // middle: rule 662's search finds no jump.
    const base = 1.00608705494897;
    const at1km = (k: number): number => impactOverpressureAt(grown(base * k), 1_000);
    const a = at1km(1);
    const b = at1km(1.001);
    const found = searchFieldJump(at1km, 1, 1.001, a, b, FIELD_JUMP_SHARE * Math.max(a, b));
    expect(found.kind).toBe('steep');
  }, 60_000);
});
