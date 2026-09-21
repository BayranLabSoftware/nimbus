import { describe, expect, it } from 'vitest';
import { DEFAULT_ENTRY_BOUNDARY } from './atmosphericEntry.js';
import { IMPACT_PRESETS, simulateImpact, type ImpactScenarioInput } from '../simulate.js';

/**
 * B-089, the entry's seam: the continuous candidate, measured on
 * 21 September 2026 and NOT adopted.
 *
 * Rule 145 follows the program's equations, whose Eq. 12 doubles the paper's
 * I_f (BM-13), wherever that doubled value is under 1, and the paper's
 * equations with the paper's I_f where it is not. At the seam a 30 m iron at
 * 17° loses a ninth of the energy it sends to the ground for a twentieth of a
 * per cent of its size.
 *
 * `joined` takes the program's doubled I_f everywhere, restores Eq. 20's
 * −3(l/H)² so that a body breaking at the ground arrives as a whole one does,
 * and gives a body that never breaks the virtual altitude of a breakup on the
 * ground. It is continuous, and it moves the I1 grid little. It also makes
 * Sikhote-Alin arrive whole, with a crater five times the largest the fall
 * left — and the fall broke up near 5.8 km into 122 craters (Krinov 1966),
 * as the model in place has it. The doubled I_f is the program's, and for
 * that iron it is wrong; B-089 is a choice between the two I_f, to be made on
 * observed fragmentation.
 *
 * Rules 667 to 675 (`validation/entryPaperRules.ts`) take up that choice.
 * Both options here belong to the program's equations, and are read on them.
 */

const B089 = {
  impactorDiameter: 30.35083106505634,
  impactVelocity: 13632.485304726288,
  impactorDensity: 9127.968714106828,
  targetDensity: 2456.329144537449,
  impactAngle: 0.2988136637231071,
} as unknown as ImpactScenarioInput;

/** The largest ratio between the ground shares of two bodies 0.05 % apart,
 *  from 1.004 to 1.010 times the B-089 body. */
const worstStep = (boundary: 'switch' | 'joined'): number => {
  let previous: number | undefined;
  let worst = 1;
  for (let i = 0; i <= 12; i++) {
    const k = 1.004 + 0.0005 * i;
    const f = simulateImpact({
      ...B089,
      impactorDiameter: (Number(B089.impactorDiameter) * k) as never,
      entryBoundary: boundary,
      entryEquations: 'program',
    }).entry.energyFractionToGround;
    if (previous !== undefined) worst = Math.max(worst, f / previous, previous / f);
    previous = f;
  }
  return worst;
};

describe('B-089: the joined entry, measured and not adopted', () => {
  it('is not the default', () => {
    expect(DEFAULT_ENTRY_BOUNDARY).toBe('switch');
  });

  it('removes the seam', () => {
    expect(worstStep('switch')).toBeGreaterThan(1.12);
    expect(worstStep('joined')).toBeLessThan(1.001);
  });

  it('makes Sikhote-Alin arrive whole, which the fall did not', () => {
    const preset = IMPACT_PRESETS.SIKHOTE_ALIN_1947.input;
    const inPlace = simulateImpact({ ...preset, entryEquations: 'program' });
    const joined = simulateImpact({
      ...preset,
      entryEquations: 'program',
      entryBoundary: 'joined',
    });
    expect(inPlace.entry.regime).toBe('COMPLETE_AIRBURST');
    expect(Number(inPlace.entry.breakupAltitude)).toBeCloseTo(6_016, -1);
    expect(Number(inPlace.crater.finalDiameter)).toBeCloseTo(26.7, 1);
    expect(joined.entry.regime).toBe('INTACT');
    expect(Number(joined.entry.breakupAltitude)).toBe(0);
    expect(Number(joined.crater.finalDiameter)).toBeCloseTo(129.3, 1);
  });
});
