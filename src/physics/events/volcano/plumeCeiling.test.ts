import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../montecarlo/sampling.js';
import { m } from '../../units.js';
import { CEILING_REFUSAL_FLOOR, RECORDED_PLUME_TOPS } from '../../validation/plumeCeilingRules.js';
import {
  MASTIN_2009_COEFFICIENT,
  MASTIN_2009_EXPONENT,
  PLUME_CEILING_ABOVE_VENT_M,
  plumeCeilingAboveVent,
  plumeHeight,
} from './plumeHeight.js';
import { simulateVolcano } from './simulate.js';

/**
 * B-085, closed by rules 593 to 604 on 21 September 2026.
 *
 * WHAT IT WAS. `plumeHeight` is Mastin et al. 2009's H = 2.00 V̇^0.241,
 * fitted against 34 historical eruptions, and it had no upper bound at all.
 * It passed the highest plume ever measured at the largest eruption the
 * input schema knows the name of — 82.3 km at the 5×10⁶ m³/s it calls
 * "the largest known eruption (Tambora 1815)" — reached the Kármán line at
 * 1.12×10⁷, and returned 512.8 km at the top of the invariant sweep's own
 * sampler. G5 walked past all of it because its clauses read finiteness,
 * area and the antipode, and 512 km is a finite length.
 *
 * WHY THE OBVIOUS REPAIR WAS REFUSED. B-084 was closed by capping at the
 * largest value its relation gives inside the box it was fitted in. That
 * does not transfer: Mastin's Table 1 tops out near 4×10⁸ kg/s, which at
 * this project's DRE density is 1.6×10⁵ m³/s and 35.9 km — BELOW Pinatubo
 * 1991's ≈ 40 km and Hunga Tonga's ≈ 57 km. Capping there would cut the
 * field's method where the world has already gone past it, which is the
 * mistake rule 163 undid for the impulse wave. That reading is still
 * measured below, because it is the reason the ceiling is not statistical.
 *
 * WHAT CLOSED IT. A plume rises because it is lighter than the air around
 * it, and expanding as it rises cools it, so there is a height at which it
 * stops being lighter. That height belongs to the atmosphere, not to a
 * dataset. Rule 595 computes it with every parameter taken at the value
 * that puts it HIGHER — pure water vapour at 1 700 K, entraining nothing
 * and radiating nothing — so what comes out is a bound: 71.89 km above the
 * vent, with 14.9 km of margin over the highest plume ever measured.
 *
 * It bites above 2.85×10⁶ m³/s, eighteen times the top of the box the
 * relation was fitted in, and it was not chosen: it falls where it falls.
 */

const km = (v: number): number => Number(plumeHeight({ volumeEruptionRate: v })) / 1_000;

describe('B-085: the ceiling is the atmosphere', () => {
  it('stands above every plume the world has recorded (rule 597)', () => {
    for (const [name, top] of Object.entries(RECORDED_PLUME_TOPS)) {
      expect(PLUME_CEILING_ABOVE_VENT_M, name).toBeGreaterThan(top);
    }
    // Hunga Tonga–Hunga Haʻapai, January 2022, is the highest ever measured
    // and the margin over it is the room rule 596 leaves for the overshoot
    // it does not model.
    expect((PLUME_CEILING_ABOVE_VENT_M - RECORDED_PLUME_TOPS.hungaTonga2022) / 1_000).toBeCloseTo(
      14.9,
      1
    );
    // Rule 600(a) would have refused it below 60 km.
    expect(PLUME_CEILING_ABOVE_VENT_M).toBeGreaterThan(CEILING_REFUSAL_FLOOR);
    expect(PLUME_CEILING_ABOVE_VENT_M / 1_000).toBeCloseTo(71.89, 2);
  });

  it('is a height above the vent, and barely cares where the vent is (rule 601)', () => {
    expect(Number(plumeCeilingAboveVent(m(0))) / 1_000).toBeCloseTo(71.89, 2);
    expect(Number(plumeCeilingAboveVent(m(3_000))) / 1_000).toBeCloseTo(71.8, 1);
    expect(Number(plumeCeilingAboveVent(m(7_000))) / 1_000).toBeCloseTo(72.0, 1);
  });

  it('leaves the relation untouched inside the box it was fitted in (rule 598)', () => {
    expect(MASTIN_2009_COEFFICIENT).toBe(2.0);
    expect(MASTIN_2009_EXPONENT).toBe(0.241);
    // Mastin's Table 1, at this project's DRE density: 2.4 to 1.6×10⁵ m³/s.
    for (const v of [2.4, 1e2, 4e3, 2e4, 1.6e5]) {
      expect(km(v), `${v.toExponential(1)} m³/s`).toBeCloseTo(2.0 * v ** 0.241, 9);
    }
    // And well past it, up to where the ceiling actually bites.
    expect(km(2e6)).toBeCloseTo(2.0 * 2e6 ** 0.241, 9);
  });

  it('cuts the two readings B-085 was registered on (rule 598)', () => {
    // 82.3 km at what the schema calls Tambora, and 512.8 at the top of the
    // sweep's own sampler.
    expect(2.0 * 5e6 ** 0.241).toBeCloseTo(82.3, 1);
    expect(2.0 * 9.9e9 ** 0.241).toBeCloseTo(512.8, 1);
    expect(km(5e6)).toBeCloseTo(71.89, 2);
    expect(km(9.9e9)).toBeCloseTo(71.89, 2);
    const r = simulateVolcano({ volumeEruptionRate: 9.9e9, totalEjectaVolume: 1e10 });
    expect(Number(r.plumeHeight) / 1_000).toBeCloseTo(71.89, 2);
  });

  it('bites where it falls, and that is far outside the fit (rule 599)', () => {
    const crossing = (PLUME_CEILING_ABOVE_VENT_M / 1_000 / 2.0) ** (1 / 0.241);
    expect(crossing).toBeCloseTo(2.85e6, -5);
    // Eighteen times the top of the box the relation was fitted in.
    expect(crossing / 1.6e5).toBeGreaterThan(15);
  });

  it("does not cap at the fit's own top, which is below eruptions that happened", () => {
    // The reason the ceiling is physical and not statistical, kept measured.
    const topOfFit = 4e8 / 2_500;
    expect(topOfFit).toBeCloseTo(1.6e5, -3);
    expect(km(topOfFit)).toBeCloseTo(35.9, 1);
    expect(km(topOfFit)).toBeLessThan(RECORDED_PLUME_TOPS.pinatubo1991 / 1_000);
    expect(km(topOfFit)).toBeLessThan(RECORDED_PLUME_TOPS.hungaTonga2022 / 1_000);
  });

  it('holds over the sweep that used to walk past the Kármán line', () => {
    // Drawn the way `invariants.ts` draws it. Before the ceiling, more than
    // fifty of four hundred stood above 100 km and the highest was past 300.
    const lin = (u: number, a: number, b: number): number => a + (b - a) * u;
    const pick = <T>(u: number, xs: readonly T[]): T =>
      xs[Math.min(xs.length - 1, Math.floor(u * xs.length))] as T;
    const sci = (u1: number, u2: number, e: readonly number[]): number =>
      lin(u1, 1, 9.9) * 10 ** pick(u2, e);
    const rng = mulberry32('benchmark-2026-09-15-inv-volcano');
    const u = (): number => rng.next();
    let atCeiling = 0;
    let highest = 0;
    for (let i = 0; i < 400; i++) {
      const rate = sci(u(), u(), [3, 4, 5, 6, 7, 8, 9]);
      u();
      u();
      u();
      u();
      const h = km(rate);
      highest = Math.max(highest, h);
      if (h >= PLUME_CEILING_ABOVE_VENT_M / 1_000 - 1e-9) atCeiling++;
    }
    expect(highest).toBeCloseTo(71.89, 2);
    // The ones that used to be impossible are now all sitting on the bound,
    // which is what a bound looks like when a fit runs past it.
    expect(atCeiling).toBeGreaterThan(50);
  });
});
