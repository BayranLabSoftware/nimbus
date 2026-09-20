import { describe, expect, it } from 'vitest';
import { simulateLandslide, type LandslideScenarioInput } from '../events/landslide/simulate.js';
import { mulberry32 } from '../montecarlo/sampling.js';
import { m, type SquareMeters } from '../units.js';

/**
 * B-084, pinned as it is — not as it should be.
 *
 * This is a characterisation test. It records a defect in the law this
 * product **ships**, so that the day somebody repairs it these numbers go
 * red and they have to say so deliberately, rather than the impossibility
 * quietly becoming something else.
 *
 * The impulse wave manual's generation has no upper bound outside the ranges
 * it was fitted on, and the product draws it there anyway. The cause is
 * dated: a 0.4h ceiling used to be applied to a supplied amplitude, and rule
 * 163 removed it on 17 September 2026 — correctly, because the manual
 * reaches 0.94h INSIDE its experiments and the ceiling was cutting the
 * field's method where the field had measured it. Nothing replaced it
 * outside that range.
 *
 * Found on 21 September 2026 by rules 532 to 540, which were measuring a
 * candidate for the confined basin and ran the fair comparison against the
 * shipped subaerial branch.
 */

const sourceAmplitude = (input: LandslideScenarioInput): number =>
  Number(simulateLandslide(input).tsunami?.sourceAmplitude ?? 0);

describe('B-084: a wave taller than its water', () => {
  it('draws 594 m of wave in 30 m of water, and says it is extrapolating', () => {
    const input: LandslideScenarioInput = {
      volumeM3: 3e8,
      regime: 'subaerial',
      slopeAngleDeg: 35,
      meanOceanDepth: m(30),
    };
    const a = sourceAmplitude(input);
    expect(a).toBeCloseTo(593.9, 1);
    expect(a / 30).toBeGreaterThan(19);
    // The product is not silent about it: every limit it is outside of is
    // named. A declared impossibility is still an impossibility.
    expect(simulateLandslide(input).impulseWave?.outsideTestedRange).toEqual([
      'F',
      'S',
      'M',
      'V',
      'D',
      'B',
      'P',
    ]);
  });

  it('gets worse as the slide grows, without limit', () => {
    const at = (volumeM3: number): number =>
      sourceAmplitude({ volumeM3, regime: 'subaerial', slopeAngleDeg: 45, meanOceanDepth: m(15) });
    expect(at(1e9) / 15).toBeGreaterThan(100);
    expect(at(1e11) / 15).toBeGreaterThan(1_000);
  });

  it('is 278 of the 1 827 subaerial scenarios of the sweep, worst at 1 102x', () => {
    // The same 5 000 scenarios `scripts/benchmark/invariants.ts` draws, with
    // its own seed, so this counts what that sweep walks past.
    const lin = (u: number, a: number, b: number): number => a + (b - a) * u;
    const logU = (u: number, a: number, b: number): number =>
      Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * u);
    const pick = <T>(u: number, xs: readonly T[]): T =>
      xs[Math.min(xs.length - 1, Math.floor(u * xs.length))] as T;
    const scientific = (u1: number, u2: number, e: readonly number[]): number =>
      lin(u1, 1, 9.9) * 10 ** pick(u2, e);
    const rng = mulberry32('benchmark-2026-09-15-inv-landslide');
    const u = (): number => rng.next();
    let subaerial = 0;
    let over = 0;
    let worst = 0;
    for (let i = 0; i < 5_000; i++) {
      const input: Record<string, unknown> = {
        volumeM3: scientific(u(), u(), [4, 5, 6, 7, 8, 9, 10, 11, 12, 13]),
        regime: pick(u(), ['subaerial', 'submarine']),
        slopeAngleDeg: lin(u(), 1, 89),
        meanOceanDepth: u() < 0.1 ? 0 : lin(u(), 0, 11_000),
      };
      const basin = logU(u(), 1e5, 1e11);
      const factor = lin(u(), 0.1, 10);
      const footprint = logU(u(), 1e3, 1e11);
      if (u() < 0.2) {
        input.confinedBasinArea = basin;
        input.confinementDynamicFactor = factor;
      }
      if (u() < 0.2) input.slideFootprintArea = footprint;
      const r = simulateLandslide(input as unknown as LandslideScenarioInput);
      if (r.impulseWave === undefined) continue;
      subaerial++;
      const h = Number(input.meanOceanDepth);
      const a = Number(r.tsunami?.sourceAmplitude ?? 0);
      if (h > 0 && a > h) {
        over++;
        worst = Math.max(worst, a / h);
      }
    }
    expect(subaerial).toBe(1_827);
    expect(over).toBe(278);
    expect(worst).toBeCloseTo(1_102.3, 0);
  });

  it('is absent from the branch the manual is replacing, which capped', () => {
    // Worth recording plainly: the tuned, unprincipled basin-fill form did
    // one thing right that the field's own relation does not. It capped the
    // wave at the water column, by construction.
    const confined: LandslideScenarioInput = {
      volumeM3: 3e8,
      regime: 'subaerial',
      slopeAngleDeg: 35,
      meanOceanDepth: m(30),
      confinedBasinArea: 1e6 as SquareMeters,
    };
    expect(sourceAmplitude(confined)).toBeLessThanOrEqual(30);
  });
});
