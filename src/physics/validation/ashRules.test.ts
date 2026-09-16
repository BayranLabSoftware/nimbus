import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ASH_SPREAD,
  TEPHRA2_DIFFUSION_COEFFICIENT,
  TEPHRA2_EDDY_CONSTANT,
  TEPHRA2_FALL_TIME_THRESHOLD_S,
  tephra2DiffusionSigmaM,
} from '../events/volcano/ashfall.js';
import {
  ASH2_BASELINE_INVARIANTS,
  ASH2_WITH_CANDIDATE,
  ASH_CANDIDATE,
  ASH_IN_PLACE,
  ASH_INVARIANT_FAILURES,
  ASH_INVARIANTS_MEASURED,
  ashRoundTwoInvariantsPass,
  chooseAshSpread,
  chooseAshSpreadAgain,
  distanceFromAgreement,
  improves,
  type AshReading,
} from './ashRules.js';

const reading = (bias: number, sigmaLn: number, withinTwo: number): AshReading => ({
  pairs: 100,
  bias,
  sigmaLn,
  withinTwo,
});

/** The figures the run of 16 September 2026 printed
 *  (`benchmark/results/ash-2026-09-16.json`). */
const AXIS_BEFORE = reading(0.466, 2.873, 0.23);
const AXIS_AFTER = reading(0.686, 1.37, 0.59);
const ACROSS_BEFORE = reading(0.008, 31.828, 0.27);
const ACROSS_AFTER = reading(0.299, 4.081, 0.34);

describe('rule 107: the closure Tephra2 computes', () => {
  it('takes the fine branch above the fall-time threshold and the coarse one below', () => {
    // At the threshold itself the fine branch applies, and either side of it
    // the two branches are the two formulae and not one another.
    const h = 10_000;
    const t = TEPHRA2_FALL_TIME_THRESHOLD_S;
    const fine = Math.sqrt(
      ((8 / 5) * TEPHRA2_EDDY_CONSTANT * (t + Math.pow(0.2 * h * h, 0.4)) ** 2.5) / 2
    );
    expect(tephra2DiffusionSigmaM(t, h)).toBeCloseTo(fine, 6);
    const below = t - 1;
    const coarse = Math.sqrt(
      (4 *
        TEPHRA2_DIFFUSION_COEFFICIENT *
        (below + (0.0032 * h * h) / TEPHRA2_DIFFUSION_COEFFICIENT)) /
        2
    );
    expect(tephra2DiffusionSigmaM(below, h)).toBeCloseTo(coarse, 6);
  });

  it('is what makes a long fall spread more than a short one', () => {
    // The whole point of the round: an hour of falling earns more spread than
    // a minute of it, where the law in place cannot tell them apart.
    const h = 20_000;
    expect(tephra2DiffusionSigmaM(3_600, h)).toBeGreaterThan(tephra2DiffusionSigmaM(60, h));
  });

  it('gives a spread for a release that has not fallen, and never a negative one', () => {
    expect(tephra2DiffusionSigmaM(0, 0)).toBe(0);
    expect(tephra2DiffusionSigmaM(-10, -10)).toBe(0);
    expect(tephra2DiffusionSigmaM(100, 1_000)).toBeGreaterThan(0);
  });
});

describe('rule 108: what counts as an improvement', () => {
  it('reads a distance from agreement the same either side of one', () => {
    expect(distanceFromAgreement(reading(2, 1, 0.5))).toBeCloseTo(
      distanceFromAgreement(reading(0.5, 1, 0.5)),
      12
    );
    expect(distanceFromAgreement(reading(1, 1, 0.5))).toBe(0);
    expect(distanceFromAgreement(reading(0, 1, 0.5))).toBe(Number.POSITIVE_INFINITY);
  });

  it('asks all three of a quantity: nearer one, tighter, and no fewer inside ×2', () => {
    expect(improves(AXIS_BEFORE, AXIS_AFTER)).toBe(true);
    expect(improves(ACROSS_BEFORE, ACROSS_AFTER)).toBe(true);
    // Nearer one but wider is not an improvement.
    expect(improves(reading(0.5, 1, 0.5), reading(0.9, 1.2, 0.6))).toBe(false);
    // Tighter but further from one is not either.
    expect(improves(reading(0.5, 1, 0.5), reading(0.3, 0.8, 0.6))).toBe(false);
    // Nor is losing points from within a factor of two.
    expect(improves(reading(0.5, 1, 0.5), reading(0.9, 0.8, 0.4))).toBe(false);
    // Overshooting the other side of one counts as worse by the same measure.
    expect(improves(reading(0.5, 1, 0.5), reading(9, 0.8, 0.6))).toBe(false);
  });
});

describe('rule 108: the verdict of 16 September 2026', () => {
  const day = {
    axis: { before: AXIS_BEFORE, after: AXIS_AFTER },
    crosswind: { before: ACROSS_BEFORE, after: ACROSS_AFTER },
    gatePasses: true,
  };

  it('refuses the candidate, on the invariants alone', () => {
    const verdict = chooseAshSpread({ ...day, invariantFailures: ASH_INVARIANTS_MEASURED });
    expect(verdict).toEqual({
      adopted: false,
      axis: true,
      crosswind: true,
      gate: true,
      invariants: false,
    });
  });

  it('refuses it on a bound that was stale, and the bound is not moved', () => {
    // 221 was read before the burn and radiation rounds changed the
    // explosion's own physics; the sweep under the law in place now gives
    // 222, which is one more than the rule allows. If this ever reads
    // otherwise, someone has edited the rule after the fact.
    expect(ASH_INVARIANT_FAILURES).toBe(221);
    expect(ASH_INVARIANTS_MEASURED).toBe(222);
    expect(ASH_INVARIANTS_MEASURED).toBeGreaterThan(ASH_INVARIANT_FAILURES);
  });

  it('would have adopted it had the count been the one the rule names', () => {
    // Which is what says the refusal is the guard's doing and not the
    // candidate's: every other clause passes.
    expect(chooseAshSpread({ ...day, invariantFailures: ASH_INVARIANT_FAILURES }).adopted).toBe(
      true
    );
  });

  it('names the law it was measured against, and the law it measured', () => {
    // What this round left in place was `project`. It is no longer what the
    // model draws — rules 110 to 113 adopted the candidate later the same day
    // — and that is asserted below, where it belongs. This round's verdict
    // does not change for it.
    expect(ASH_IN_PLACE).toBe('project');
    expect(ASH_CANDIDATE).toBe('tephra2');
  });

  it('refuses a law that mends the crosswind by spoiling the axis', () => {
    expect(
      chooseAshSpread({
        axis: { before: AXIS_BEFORE, after: reading(0.2, 3.5, 0.2) },
        crosswind: { before: ACROSS_BEFORE, after: ACROSS_AFTER },
        gatePasses: true,
        invariantFailures: ASH_INVARIANT_FAILURES,
      }).adopted
    ).toBe(false);
  });

  it('refuses a law the release gate turns down, whatever its figures', () => {
    expect(
      chooseAshSpread({ ...day, gatePasses: false, invariantFailures: ASH_INVARIANT_FAILURES })
        .adopted
    ).toBe(false);
  });
});

describe('rule 111: the candidate is the one that was refused', () => {
  it('carries Tephra2’s own constants, unmoved', () => {
    // A reader who suspects the candidate was nudged to clear the second
    // round's guard can check here instead of trusting. These are Tephra2's
    // example values, and they are what commit 05b1883 refused.
    expect(TEPHRA2_EDDY_CONSTANT).toBe(0.04);
    expect(TEPHRA2_DIFFUSION_COEFFICIENT).toBe(5_138);
    expect(TEPHRA2_FALL_TIME_THRESHOLD_S).toBe(288);
  });

  it('computes what it computed then, to the metre', () => {
    // Three points of the closure, one either side of the threshold and one
    // far above it. If the function is ever rewritten, these say whether it
    // still means the same thing.
    expect(tephra2DiffusionSigmaM(288, 10_000)).toBeCloseTo(1_159.7532, 3);
    expect(tephra2DiffusionSigmaM(287, 10_000)).toBeCloseTo(1_894.5216, 3);
    expect(tephra2DiffusionSigmaM(86_400, 20_000)).toBeCloseTo(270_551.2055, 3);
  });

  it('steps at the threshold, as the reference itself steps', () => {
    // Tephra2's two branches do not meet: at 288 s the coarse branch gives a
    // wider spread than the fine one. That is the reference's own behaviour
    // and is carried rather than smoothed — rule 107 is a verification, and
    // a closure that agreed with Tephra2 everywhere except at its own
    // threshold would be a different model wearing its name.
    expect(tephra2DiffusionSigmaM(287, 10_000)).toBeGreaterThan(
      tephra2DiffusionSigmaM(288, 10_000)
    );
  });
});

describe('rules 110 and 112: a baseline that measures the candidate', () => {
  const day = {
    axis: { before: AXIS_BEFORE, after: AXIS_AFTER },
    crosswind: { before: ACROSS_BEFORE, after: ACROSS_AFTER },
    gatePasses: true,
  };

  it('names the reading under the law in place, taken in the same run', () => {
    expect(ASH2_BASELINE_INVARIANTS).toBe(ASH_INVARIANTS_MEASURED);
    expect(ashRoundTwoInvariantsPass(222)).toBe(true);
    expect(ashRoundTwoInvariantsPass(221)).toBe(true);
    expect(ashRoundTwoInvariantsPass(223)).toBe(false);
  });

  it('adopts only if the sweep taken WITH the candidate is no worse', () => {
    expect(chooseAshSpreadAgain({ ...day, invariantFailuresWithCandidate: 222 }).adopted).toBe(
      true
    );
    const worse = chooseAshSpreadAgain({ ...day, invariantFailuresWithCandidate: 223 });
    expect(worse.adopted).toBe(false);
    expect(worse.invariants).toBe(false);
    expect(worse.axis).toBe(true);
    expect(worse.crosswind).toBe(true);
  });

  it('adopted the candidate, and the model draws it', () => {
    expect(ASH2_WITH_CANDIDATE).toBe(222);
    expect(ashRoundTwoInvariantsPass(ASH2_WITH_CANDIDATE)).toBe(true);
    expect(
      chooseAshSpreadAgain({ ...day, invariantFailuresWithCandidate: ASH2_WITH_CANDIDATE })
    ).toEqual({ adopted: true, axis: true, crosswind: true, gate: true, invariants: true });
    expect(DEFAULT_ASH_SPREAD).toBe(ASH_CANDIDATE);
  });

  it('keeps every other clause of rule 108 exactly as it was', () => {
    // The second round changes the baseline and nothing else: a law that
    // spoils the axis, or one the gate turns down, is refused as before.
    expect(
      chooseAshSpreadAgain({
        ...day,
        axis: { before: AXIS_BEFORE, after: reading(0.2, 3.5, 0.2) },
        invariantFailuresWithCandidate: 222,
      }).adopted
    ).toBe(false);
    expect(
      chooseAshSpreadAgain({ ...day, gatePasses: false, invariantFailuresWithCandidate: 222 })
        .adopted
    ).toBe(false);
  });
});
