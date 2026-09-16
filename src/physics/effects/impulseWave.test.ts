import { describe, expect, it } from 'vitest';
import {
  IMPULSE_WAVE_EXAMPLE_ONE_MANUAL,
  IMPULSE_WAVE_EXAMPLE_ONE_SLIDE,
  IMPULSE_WAVE_TESTED,
  impulseProduct,
  impulseWaveAmplitudes,
  impulseWaveExampleOne,
  outsideTestedRange,
  type ImpulseWaveSlide,
} from './impulseWave.js';

/**
 * Rule L1 of docs/GOLD_STANDARD.md: "the relation that makes the wave is held
 * to its source's worked examples within 1 % ... by a test that runs in CI".
 * This is that test.
 */
describe('Heller, Hager & Minor 2009, Example 1', () => {
  it('reproduces every number the manual prints, within 1 %', () => {
    const got = impulseWaveExampleOne();
    const within1pct = (ours: number, manual: number): number => Math.abs(ours / manual - 1);
    expect(
      within1pct(got.impulseProduct, IMPULSE_WAVE_EXAMPLE_ONE_MANUAL.impulseProduct)
    ).toBeLessThan(0.01);
    expect(within1pct(got.firstCrest, IMPULSE_WAVE_EXAMPLE_ONE_MANUAL.firstCrest)).toBeLessThan(
      0.01
    );
    expect(within1pct(got.firstTrough, IMPULSE_WAVE_EXAMPLE_ONE_MANUAL.firstTrough)).toBeLessThan(
      0.01
    );
    expect(within1pct(got.secondCrest, IMPULSE_WAVE_EXAMPLE_ONE_MANUAL.secondCrest)).toBeLessThan(
      0.01
    );
  });

  it('pins the numbers themselves, so a rewrite has to mean the same thing', () => {
    const got = impulseWaveExampleOne();
    expect(got.impulseProduct).toBeCloseTo(0.6373, 4);
    expect(got.firstCrest).toBeCloseTo(14.3959, 4);
    expect(got.firstTrough).toBeCloseTo(22.7157, 4);
    expect(got.secondCrest).toBeCloseTo(10.0879, 4);
  });

  it('is a slide the manual’s own experiments cover', () => {
    expect(outsideTestedRange(IMPULSE_WAVE_EXAMPLE_ONE_SLIDE)).toEqual([]);
  });
});

describe('the impulse product parameter', () => {
  const base = IMPULSE_WAVE_EXAMPLE_ONE_SLIDE;

  it('grows with the speed, the thickness, the mass and a steeper entry', () => {
    const P = impulseProduct(base);
    expect(impulseProduct({ ...base, froude: base.froude * 2 })).toBeGreaterThan(P);
    expect(impulseProduct({ ...base, thicknessM: base.thicknessM * 2 })).toBeGreaterThan(P);
    expect(impulseProduct({ ...base, volumeM3: base.volumeM3 * 2 })).toBeGreaterThan(P);
    // cos(6α/7) falls as α rises, so a steeper slide has the smaller P: the
    // manual's own form, and not an error. A shallower entry carries more of
    // its momentum along the water.
    expect(impulseProduct({ ...base, angleDeg: 80 })).toBeLessThan(P);
  });

  it('is linear in the Froude number, as Eq. 3.19 has it', () => {
    expect(impulseProduct({ ...base, froude: base.froude * 3 })).toBeCloseTo(
      3 * impulseProduct(base),
      10
    );
  });
});

describe('the amplitudes', () => {
  const base = IMPULSE_WAVE_EXAMPLE_ONE_SLIDE;

  it('put the first trough deeper than the first crest is high, as the experiments do', () => {
    const a = impulseWaveAmplitudes(base);
    expect(a.firstTrough).toBeGreaterThan(a.firstCrest);
    expect(a.secondCrest).toBeLessThan(a.firstCrest);
  });

  it('grow with a faster slide', () => {
    const slow = impulseWaveAmplitudes(base).firstCrest;
    const fast = impulseWaveAmplitudes({ ...base, froude: base.froude * 2 }).firstCrest;
    expect(fast).toBeGreaterThan(slow);
  });
});

describe('what the experiments did not cover', () => {
  const base = IMPULSE_WAVE_EXAMPLE_ONE_SLIDE;

  it('names each range a slide falls outside of', () => {
    expect(outsideTestedRange({ ...base, froude: 10 })).toContain('F');
    expect(outsideTestedRange({ ...base, angleDeg: 5 })).toContain('α');
    expect(outsideTestedRange({ ...base, thicknessM: 0.1 })).toContain('S');
    expect(outsideTestedRange({ ...base, widthM: 10_000 })).toContain('B');
  });

  it('carries the ranges the campaign recorded, unchanged', () => {
    expect(IMPULSE_WAVE_TESTED.froude).toEqual([0.4, 3.4]);
    expect(IMPULSE_WAVE_TESTED.relativeThickness).toEqual([0.15, 0.6]);
    expect(IMPULSE_WAVE_TESTED.relativeMass).toEqual([0.25, 1]);
    expect(IMPULSE_WAVE_TESTED.relativeWidth).toEqual([0.83, 5]);
    expect(IMPULSE_WAVE_TESTED.angleDeg).toEqual([30, 90]);
    expect(IMPULSE_WAVE_TESTED.impulseProduct).toEqual([0.13, 2.08]);
  });

  it('says nothing is outside when everything is inside', () => {
    const inside: ImpulseWaveSlide = { ...base };
    expect(outsideTestedRange(inside)).toEqual([]);
  });
});
