import { describe, expect, it } from 'vitest';
import { simulateLandslide, type LandslideScenarioInput } from '../events/landslide/simulate.js';
import { mulberry32 } from '../montecarlo/sampling.js';
import { m, type SquareMeters } from '../units.js';

/**
 * B-084, found and CLOSED the same night.
 *
 * It was a defect in the law this product ships: the impulse wave manual's
 * generation had no upper bound outside the ranges it was fitted on, and the
 * product drew it there anyway — 594 m of wave in 30 m of water, and 278 of
 * the invariant sweep's 1 827 subaerial scenarios above their own water
 * depth, the worst at 1 102 times.
 *
 * Rules 541 to 547 closed it with the manual's own ceiling on the first
 * crest, 0.939651 h — the largest Eq. (3.26) can produce anywhere inside
 * Table 3-3's box, so it cuts nothing the field has measured. The figures
 * below are what the defect WAS, kept beside what the repair leaves, so the
 * size of it stays on the record.
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
  it('drew 594 m of wave in 30 m of water, and now draws the ceiling', () => {
    const input: LandslideScenarioInput = {
      volumeM3: 3e8,
      regime: 'subaerial',
      slopeAngleDeg: 35,
      meanOceanDepth: m(30),
    };
    const a = sourceAmplitude(input);
    // Was 593.9 m, twenty times the column. Is the manual's own maximum.
    expect(a).toBeCloseTo(0.939651 * 30, 3);
    expect(a).toBeLessThan(30);
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

  it('no longer grows without limit as the slide does', () => {
    const at = (volumeM3: number): number =>
      sourceAmplitude({ volumeM3, regime: 'subaerial', slopeAngleDeg: 45, meanOceanDepth: m(15) });
    // 108x and 1 077x the water column before the repair.
    expect(at(1e9) / 15).toBeCloseTo(0.939651, 6);
    expect(at(1e11) / 15).toBeCloseTo(0.939651, 6);
  });

  it('was 278 of the 1 827 subaerial scenarios of the sweep; it is now none', () => {
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
    expect(over).toBe(0);
    expect(worst).toBe(0);
  });

  it('was absent from the branch the manual would have replaced, which capped', () => {
    // Worth recording plainly: the tuned, unprincipled basin-fill form did
    // one thing right that the field's own relation did not. It capped the
    // wave at the water column, by construction — and noticing that it did
    // is what found B-084.
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
