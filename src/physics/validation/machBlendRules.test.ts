import { describe, expect, it } from 'vitest';
import {
  MACH_BLEND_BODIES,
  MACH_BLEND_MIN_BODIES,
  MACH_BLEND_MIN_POINTS,
  machBlendAgrees,
  machBlendRangesKm,
  machBlendScale,
  machBlendSpan,
  machBlendVerdict,
  type MachBlendPoint,
} from './machBlendRules.js';

describe('rule 130: the held-out check', () => {
  it('draws twelve bodies with six ranges each', () => {
    expect(MACH_BLEND_BODIES).toHaveLength(12);
    for (const b of MACH_BLEND_BODIES) {
      expect(b.fractions).toHaveLength(6);
      for (const t of b.fractions) {
        expect(t).toBeGreaterThanOrEqual(0);
        expect(t).toBeLessThanOrEqual(1);
      }
    }
  });

  it('recovers the scale the program printed at its anchor', () => {
    // The 28.139 m body of rule 129, asked at 10 m: 784 830.884 Pa under a
    // burst at 2 302.791 m. Its points at 0.5 and 1 km give 15.611072.
    expect(machBlendScale(0.01, 2_302.791, 784_830.884)).toBeCloseTo(15.611072, 5);
    expect(machBlendScale(0.01, 2_302.791, 0)).toBeNaN();
  });

  it('spans the blend from half its inner end to a half-width past its outer end', () => {
    // z₁ = 293.854 m: r_m1 525.80, half-width 283.23 scaled m.
    const span = machBlendSpan(293.854);
    expect(span?.inner).toBeCloseTo(242.58, 1);
    expect(span?.outer).toBeCloseTo(809.03, 1);
    const [start, end] = machBlendRangesKm(6_446.252, 21.936946, [0, 1]);
    expect(start).toBeCloseTo((242.58 / 2) * 0.021936946, 3);
    expect(end).toBeCloseTo((809.03 + 283.23) * 0.021936946, 3);
    expect(machBlendSpan(550)).toBeNull();
    expect(machBlendRangesKm(20_000, 10, [0.5])).toEqual([]);
  });

  it('agrees within 1 % plus half the last printed digit', () => {
    expect(machBlendAgrees(1_000, 1_010)).toBe(true);
    expect(machBlendAgrees(1_000, 1_010.001)).toBe(false);
    expect(machBlendAgrees(0.01, 0.0105)).toBe(true);
  });
});

describe('rule 131: what decides', () => {
  const point = (body: number, over: Partial<MachBlendPoint> = {}): MachBlendPoint => ({
    body,
    rangeKm: 10,
    programPa: 1_000,
    blendPa: 1_000.5,
    stepPa: 1_400,
    ...over,
  });
  const full = Array.from({ length: MACH_BLEND_MIN_POINTS }, (_, i) =>
    point(i % MACH_BLEND_MIN_BODIES)
  );

  it('adopts the blend when enough is answered and every point agrees', () => {
    const v = machBlendVerdict(full);
    expect(v.adopted).toBe(true);
    expect(v.stepAgrees).toBe(0);
  });

  it('refuses on one point outside', () => {
    expect(machBlendVerdict([...full, point(0, { blendPa: 1_100 })]).adopted).toBe(false);
  });

  it('refuses when too little is answered, and does not count what was not', () => {
    const short = full.slice(1);
    expect(machBlendVerdict(short).enough).toBe(false);
    expect(machBlendVerdict([...short, point(1, { programPa: null })]).adopted).toBe(false);
    const fewBodies = full.map((p) => ({ ...p, body: p.body % (MACH_BLEND_MIN_BODIES - 1) }));
    expect(machBlendVerdict(fewBodies).adopted).toBe(false);
  });
});
