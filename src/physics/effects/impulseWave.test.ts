import { describe, expect, it } from 'vitest';
import {
  IMPULSE_WAVE_ADDENDUM_MIN_ANGLE_DEG,
  IMPULSE_WAVE_EXAMPLE_ONE_MANUAL,
  IMPULSE_WAVE_EXAMPLE_ONE_SLIDE,
  IMPULSE_WAVE_EXAMPLE_TWO_MANUAL,
  IMPULSE_WAVE_EXAMPLE_TWO_SLIDE,
  IMPULSE_WAVE_SLIDE_FRICTION,
  IMPULSE_WAVE_TESTED,
  impulseProduct,
  impulseWaveAmplitudes,
  impulseWaveDimensionless,
  impulseWaveExampleOne,
  outsideTestedRange,
  slideFromVolume,
  slideImpactVelocity,
  type ImpulseWaveSlide,
} from './impulseWave.js';

/**
 * Rule L1 of docs/GOLD_STANDARD.md: "the relation that makes the wave is held
 * to its source's worked examples within 1 % ... by a test that runs in CI".
 * These are those tests, on the impulse wave manual's second edition (Evers
 * et al. 2019, version 2.1 of 2023), which is the file that was read.
 */
const within1pct = (ours: number, manual: number): number => Math.abs(ours / manual - 1);
/** G1: within 1 %, or within the rounding of the digits the manual prints. */
const agreesWithPrinted = (ours: number, printed: number, decimals: number): boolean =>
  within1pct(ours, printed) <= 0.01 || Math.abs(ours - printed) <= 0.5 * 10 ** -decimals + 1e-12;

describe('the impulse wave manual, Example 1', () => {
  it('reproduces every number the manual prints, within 1 %', () => {
    const got = impulseWaveExampleOne();
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

  it('prints the dimensionless numbers of its Table 5-3', () => {
    const n = impulseWaveDimensionless(IMPULSE_WAVE_EXAMPLE_ONE_SLIDE);
    expect(n.F).toBeCloseTo(2.07, 2);
    expect(n.S).toBeCloseTo(0.15, 10);
    expect(n.D).toBeCloseTo(1.7, 10);
    expect(n.V).toBeCloseTo(0.34, 2);
    expect(n.M).toBeCloseTo(0.58, 2);
    expect(n.B).toBeCloseTo(1.25, 10);
  });

  it('reaches 58 m/s down its two slopes by Eq. 3.5, as the manual computes it', () => {
    // 100 m of drop at 70° to the slope change, then 150 m at 40°, a dynamic
    // bed friction angle of 20° on both: 41.3 m/s at the change, 58.0 at the
    // water (Eqs. 3.5 and 3.9).
    const tanDelta = Math.tan((20 * Math.PI) / 180);
    const atChange = slideImpactVelocity(100, 70, tanDelta);
    expect(within1pct(atChange, 41.3)).toBeLessThan(0.01);
    const atWater = Math.hypot(atChange, slideImpactVelocity(150, 40, tanDelta));
    expect(within1pct(atWater, 58.0)).toBeLessThan(0.01);
  });
});

describe('the impulse wave manual, Example 2', () => {
  it('reproduces every number the manual prints for the icefall, within 1 % or its rounding', () => {
    const P = impulseProduct(IMPULSE_WAVE_EXAMPLE_TWO_SLIDE);
    const a = impulseWaveAmplitudes(IMPULSE_WAVE_EXAMPLE_TWO_SLIDE);
    // P = 0.4252 prints as 0.43: 1.1 % from the printed figure, inside its
    // rounding. Every amplitude is inside both.
    expect(agreesWithPrinted(P, IMPULSE_WAVE_EXAMPLE_TWO_MANUAL.impulseProduct, 2)).toBe(true);
    expect(within1pct(a.firstCrest, IMPULSE_WAVE_EXAMPLE_TWO_MANUAL.firstCrest)).toBeLessThan(0.01);
    expect(within1pct(a.firstTrough, IMPULSE_WAVE_EXAMPLE_TWO_MANUAL.firstTrough)).toBeLessThan(
      0.01
    );
    expect(within1pct(a.secondCrest, IMPULSE_WAVE_EXAMPLE_TWO_MANUAL.secondCrest)).toBeLessThan(
      0.01
    );
    expect(agreesWithPrinted(a.firstCrest, IMPULSE_WAVE_EXAMPLE_TWO_MANUAL.firstCrest, 1)).toBe(
      true
    );
    expect(agreesWithPrinted(a.firstTrough, IMPULSE_WAVE_EXAMPLE_TWO_MANUAL.firstTrough, 1)).toBe(
      true
    );
    expect(agreesWithPrinted(a.secondCrest, IMPULSE_WAVE_EXAMPLE_TWO_MANUAL.secondCrest, 1)).toBe(
      true
    );
  });

  it('reaches 32.2 m/s from a 110 m drop at 35° with δ = 20°, by Eq. 3.5', () => {
    const v = slideImpactVelocity(110, 35, Math.tan((20 * Math.PI) / 180));
    expect(within1pct(v, 32.2)).toBeLessThan(0.01);
  });

  it('says what its own limitations table says: the density is outside', () => {
    // Table 5-10: D = 0.50 against 0.59 to 1.72, "No". Every other limit of
    // the generation is satisfied.
    expect(outsideTestedRange(IMPULSE_WAVE_EXAMPLE_TWO_SLIDE)).toEqual(['D']);
  });
});

describe('the impulse wave manual, Example 3', () => {
  it('gives P = 0.49 at Lake Askja from the dimensionless numbers it prints', () => {
    // F = 0.82, S = 0.26, M = 1.91 at α = 10.4° (§5.3). P is Eq. 3.12, shared
    // by the 2D and 3D methods; the rest of the example is the 2D one.
    const slide: ImpulseWaveSlide = {
      froude: 0.82,
      thicknessM: 0.26,
      widthM: 1,
      volumeM3: 1.91,
      densityKgM3: 1_000,
      angleDeg: 10.4,
      depthM: 1,
    };
    expect(within1pct(impulseProduct(slide), 0.49)).toBeLessThan(0.01);
  });
});

describe('the speed of a slide (Eq. 3.5)', () => {
  it('is zero where the bed friction holds the slide', () => {
    const delta = (Math.atan(IMPULSE_WAVE_SLIDE_FRICTION) * 180) / Math.PI;
    expect(slideImpactVelocity(100, delta - 0.01)).toBe(0);
    expect(slideImpactVelocity(100, delta + 0.5)).toBeGreaterThan(0);
    expect(slideImpactVelocity(0, 45)).toBe(0);
  });

  it('falls the vertical drop, not the drop along the slope', () => {
    // A frictionless slide reaches √(2gΔz) whatever the slope: the energy
    // equation Eq. 3.1 is solved on the vertical drop of the centre of gravity.
    for (const angle of [20, 45, 80]) {
      expect(slideImpactVelocity(200, angle, 0)).toBeCloseTo(Math.sqrt(2 * 9.81 * 200), 9);
    }
  });

  it('is what a closure reports it used', () => {
    const c = slideFromVolume({
      volumeM3: 1e6,
      angleDeg: 40,
      depthM: 50,
      densityKgM3: 2_000,
      dropHeightM: 300,
    });
    expect(c.closed.velocity).toBe('fromDropHeight');
    expect(c.impactVelocityMS).toBeCloseTo(slideImpactVelocity(300, 40), 12);
    expect(c.slide.froude).toBeCloseTo(c.impactVelocityMS / Math.sqrt(9.81 * 50), 12);
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

  it('is linear in the Froude number, as Eq. 3.12 has it', () => {
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
    expect(outsideTestedRange({ ...base, densityKgM3: 2_500 })).toContain('D');
    expect(outsideTestedRange({ ...base, volumeM3: 1_000_000 })).toContain('V');
  });

  it("carries Table 3-3's limits, with the density range of §3.2.4.3", () => {
    expect(IMPULSE_WAVE_TESTED.froude).toEqual([0.4, 3.4]);
    expect(IMPULSE_WAVE_TESTED.relativeThickness).toEqual([0.15, 0.6]);
    expect(IMPULSE_WAVE_TESTED.relativeMass).toEqual([0.25, 1]);
    expect(IMPULSE_WAVE_TESTED.relativeVolume).toEqual([0.187, 0.75]);
    expect(IMPULSE_WAVE_TESTED.relativeDensity).toEqual([0.59, 1.72]);
    expect(IMPULSE_WAVE_TESTED.relativeWidth).toEqual([0.83, 5]);
    expect(IMPULSE_WAVE_TESTED.angleDeg).toEqual([30, 90]);
    expect(IMPULSE_WAVE_TESTED.impulseProduct).toEqual([0.13, 2.08]);
  });

  it('reads the angle as the addendum of 2023 does', () => {
    // From 15° where P is inside its range; not below 15°, and not at 20°
    // once P has left it.
    expect(IMPULSE_WAVE_ADDENDUM_MIN_ANGLE_DEG).toBe(15);
    expect(outsideTestedRange({ ...base, angleDeg: 20 })).toEqual([]);
    expect(outsideTestedRange({ ...base, angleDeg: 14 })).toContain('α');
    const fast = { ...base, angleDeg: 20, froude: 8 };
    expect(outsideTestedRange(fast)).toContain('P');
    expect(outsideTestedRange(fast)).toContain('α');
  });

  it('says nothing is outside when everything is inside', () => {
    const inside: ImpulseWaveSlide = { ...base };
    expect(outsideTestedRange(inside)).toEqual([]);
  });
});
