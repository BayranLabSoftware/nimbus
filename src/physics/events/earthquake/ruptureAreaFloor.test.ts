import { describe, expect, it } from 'vitest';
import {
  CRUSTAL_RIGIDITY_PA,
  MAX_CREDIBLE_SLIP_M,
  megathrustRuptureLength,
  megathrustRuptureWidth,
  ruptureAreaFloor,
  ruptureGrowthForMoment,
  surfaceRuptureLength,
  surfaceRuptureWidth,
} from './ruptureLength.js';
import { simulateEarthquake } from './simulate.js';
import { m } from '../../units.js';
import {
  CRUSTAL_RIGIDITY_PA as RULE_RIGIDITY,
  MAX_CREDIBLE_SLIP_M as RULE_SLIP,
} from '../../validation/conservationRules.js';
import { RUPTURE_FLOOR_REFUSAL_MAGNITUDE } from '../../validation/ruptureAreaRules.js';

/**
 * B-087, closed by rules 613 to 620 on 21 September 2026.
 *
 * WHAT IT WAS. `ruptureLength.ts` evaluates Wells & Coppersmith (1994)'s
 * normal-fault regressions wherever the magnitude goes, and their
 * normal-faulting dataset stops near Mw 7.3. At Mw 9.83 they returned an
 * 807 × 200 km rupture, and the moment 7.09 × 10²³ N·m had to fill it with
 * 146.2 m of slip — where the largest ever measured is Tōhoku's ≈ 50 to
 * 60 m. 53 of the 5 000 earthquakes the sweep draws implied more than
 * 100 m, the worst 186.2.
 *
 * WHAT CLOSED IT. Not a new scaling relation and not a refusal of the
 * magnitude. M₀ = μ·L·W·D ties the three together, so a rupture that comes
 * back too small for its moment makes the SLIP impossible rather than
 * making itself bigger. The area therefore has a floor, M₀/(μ·D_max), and
 * below it nothing changes at all.
 *
 * D_max is the 100 m rules 605 to 612 had already fixed, twice the record,
 * and rule 614 did not move it for this round — it was chosen before any of
 * this was measured, which is the whole reason it could be used.
 *
 * WHAT THE RUN SAID. Rule 616 held: 448 combinations of fault type,
 * interface flag and magnitude from Mw 4.0 to 9.5, and not one rupture
 * moved. It bites only on normal faults above Mw 9.6 — reverse and
 * strike-slip at Mw 10 imply 49.3 and 68.1 m and are untouched. The 53
 * went to none: ten readings still sit ON the bound, exceeding it by
 * 3 × 10⁻¹⁴ m, which is the square root's own rounding and not a slip.
 *
 * Rule 618 stands: this does not make a normal-faulting Mw 9.8 a real
 * earthquake. No normal fault makes one. It makes the geometry and the
 * moment agree, which is the only part of it arithmetic can fix.
 */

const slipOf = (moment: number, length: number, width: number): number =>
  moment / (CRUSTAL_RIGIDITY_PA * length * width);

describe('rules 613 to 620: a rupture big enough for its own moment', () => {
  it('takes its bound from the round that fixed it before any of this was measured', () => {
    expect(CRUSTAL_RIGIDITY_PA).toBe(RULE_RIGIDITY);
    expect(MAX_CREDIBLE_SLIP_M).toBe(RULE_SLIP);
    expect(MAX_CREDIBLE_SLIP_M).toBe(100);
  });

  it('is M₀ over μ D, and nothing else', () => {
    const moment = 7.09e23;
    expect(ruptureAreaFloor(moment)).toBeCloseTo(moment / (3e10 * 100), -6);
    expect(ruptureAreaFloor(0)).toBe(0);
    expect(ruptureAreaFloor(Number.NaN)).toBe(0);
  });

  it('leaves every rupture at or below the largest earthquake ever recorded (rule 616)', () => {
    expect(RUPTURE_FLOOR_REFUSAL_MAGNITUDE).toBe(9.5);
    let checked = 0;
    for (const faultType of ['normal', 'reverse', 'strike-slip', 'all'] as const) {
      for (const subductionInterface of [false, true]) {
        for (let tenths = 40; tenths <= 95; tenths++) {
          const magnitude = tenths / 10;
          const r = simulateEarthquake({
            magnitude,
            depth: m(20_000),
            faultType,
            subductionInterface,
          });
          const used = subductionInterface ? 'reverse' : faultType;
          const nominalLength = Number(
            subductionInterface
              ? megathrustRuptureLength(magnitude)
              : surfaceRuptureLength({ magnitude, faultType: used })
          );
          const nominalWidth = Number(
            subductionInterface
              ? megathrustRuptureWidth(magnitude)
              : surfaceRuptureWidth({ magnitude, faultType: used })
          );
          checked++;
          expect(Number(r.ruptureLength), `${faultType} ${String(magnitude)}`).toBeCloseTo(
            nominalLength,
            6
          );
          expect(Number(r.ruptureWidth), `${faultType} ${String(magnitude)}`).toBeCloseTo(
            nominalWidth,
            6
          );
        }
      }
    }
    expect(checked).toBe(448);
  }, 60_000);

  it('closes B-087 on the scenario it was registered from', () => {
    const magnitude = 9.833853679476306;
    const r = simulateEarthquake({
      magnitude,
      depth: m(608_577.5586776435),
      vs30: 138.09486301080557,
      faultType: 'normal',
      subductionInterface: false,
    } as never);
    // The rupture grew, keeping its own aspect ratio.
    const nominalLength = Number(surfaceRuptureLength({ magnitude, faultType: 'normal' }));
    const nominalWidth = Number(surfaceRuptureWidth({ magnitude, faultType: 'normal' }));
    const growth = ruptureGrowthForMoment(nominalLength, nominalWidth, Number(r.seismicMoment));
    expect(growth).toBeGreaterThan(1);
    expect(Number(r.ruptureLength) / Number(r.ruptureWidth)).toBeCloseTo(
      nominalLength / nominalWidth,
      9
    );
    // And the slip it implies is the bound, not 146.2 m.
    const slip = slipOf(Number(r.seismicMoment), Number(r.ruptureLength), Number(r.ruptureWidth));
    expect(slip).toBeCloseTo(MAX_CREDIBLE_SLIP_M, 6);
    expect(slipOf(Number(r.seismicMoment), nominalLength, nominalWidth)).toBeCloseTo(146.2, 1);
  });

  it('bites only where the slip was impossible', () => {
    // Reverse and strike-slip at Mw 10 are already big enough for their own
    // moments, so the floor never reaches them.
    for (const faultType of ['reverse', 'strike-slip'] as const) {
      for (const magnitude of [9.6, 9.83, 10]) {
        const length = Number(surfaceRuptureLength({ magnitude, faultType }));
        const width = Number(surfaceRuptureWidth({ magnitude, faultType }));
        const moment = 10 ** (1.5 * magnitude + 9.1);
        expect(
          ruptureGrowthForMoment(length, width, moment),
          `${faultType} ${String(magnitude)}`
        ).toBe(1);
        expect(slipOf(moment, length, width)).toBeLessThan(MAX_CREDIBLE_SLIP_M);
      }
    }
    // Normal faults above Mw 9.6 are the ones that were not.
    for (const magnitude of [9.6, 9.83, 10]) {
      const length = Number(surfaceRuptureLength({ magnitude, faultType: 'normal' }));
      const width = Number(surfaceRuptureWidth({ magnitude, faultType: 'normal' }));
      const moment = 10 ** (1.5 * magnitude + 9.1);
      expect(ruptureGrowthForMoment(length, width, moment)).toBeGreaterThan(1);
    }
  });
});
