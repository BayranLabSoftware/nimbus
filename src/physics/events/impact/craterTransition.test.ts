import { describe, expect, it } from 'vitest';
import { m } from '../../units.js';
import { finalCraterDiameter } from './crater.js';
import { simulateImpact } from '../../simulate.js';

/**
 * Two of the sixteen impact G5 failures rules 555 to 562 left undiagnosed
 * are the published discontinuity at the simple-to-complex crater
 * transition, which `crater.ts` has documented since it was written: "The
 * two fits do not join: at D_tc = 2.56 km the simple rule gives 3.20 km and
 * the complex one 2.91 km."
 *
 * So a one per cent larger impactor that carries the transient crater across
 * 2.56 km makes a final crater seven per cent SMALLER, and the rim with it.
 * It is Collins, Melosh & Marcus's own Eqs. 22 and 27 and their own test —
 * not this project's, and not a defect. This test says which two of the
 * sixteen they are, so the count that remains is honest.
 *
 * The scenario below is from the sweep's own seed: a 50.88 m body at
 * 52.7 km/s. Grown by one per cent its transient crater goes 2 555.3 m to
 * 2 591.0 m — across the 2 560 m where 1.25·D_tc reaches the 3 200 m
 * transition — and its final diameter goes 3 194.1 m to 2 949.4 m.
 */

describe('the simple-to-complex transition, and the two G5 failures it owns', () => {
  it('has a discontinuity the module already declares', () => {
    // The module's default transition diameter for Earth, read through the
    // function rather than imported, since it is not exported.
    const justBelow = Number(finalCraterDiameter(m(2_559)));
    expect(justBelow).toBeLessThan(3_200);
    expect(Number(finalCraterDiameter(m(2_561)))).toBeLessThan(justBelow);
    // Either side of D_tc = 2 560 m, where 1.25·D_tc reaches D_c.
    const below = Number(finalCraterDiameter(m(2_559)));
    const above = Number(finalCraterDiameter(m(2_561)));
    expect(below).toBeCloseTo(1.25 * 2_559, 6);
    expect(above).toBeCloseTo((1.17 * 2_561 ** 1.13) / 3_200 ** 0.13, 6);
    // A two-metre step in the transient, a nine per cent step in the final.
    expect(above).toBeLessThan(below);
    expect(below / above).toBeCloseTo(1.1, 1);
  });

  it('is what makes a bigger impactor cut a smaller crater, on the sweep’s own scenario', () => {
    const input = {
      impactorDiameter: 50.88474335340288,
      impactVelocity: 52_667.18393936753,
      impactorDensity: 6_494.265721412376,
      targetDensity: 1_175.919302739203,
      impactAngle: 1.4879430361408708,
    } as const;
    const a = simulateImpact(input as never);
    const b = simulateImpact({
      ...input,
      impactorDiameter: input.impactorDiameter * 1.01,
    } as never);
    // The transient grows, as it must.
    expect(Number(b.crater.transientDiameter)).toBeGreaterThan(Number(a.crater.transientDiameter));
    // And crosses the transition.
    expect(Number(a.crater.transientDiameter)).toBeLessThan(2_560);
    expect(Number(b.crater.transientDiameter)).toBeGreaterThan(2_560);
    // So the final falls.
    expect(Number(a.crater.finalDiameter)).toBeCloseTo(3_194.1, 0);
    expect(Number(b.crater.finalDiameter)).toBeCloseTo(2_949.4, 0);
    expect(Number(b.damage.craterRim)).toBeLessThan(Number(a.damage.craterRim));
  });

  it('is the reference’s, so nothing here proposes to smooth it', () => {
    // Collins et al. apply Eq. 27 when D_tc exceeds 2.56 km — the same test
    // this module makes. Joining the two fits would be a departure from the
    // reference, which I1 holds this crater to on eleven clauses, and would
    // need its own rules and its own reason.
    expect(Number(finalCraterDiameter(m(2_560)))).toBeCloseTo(
      (1.17 * 2_560 ** 1.13) / 3_200 ** 0.13,
      6
    );
  });
});
