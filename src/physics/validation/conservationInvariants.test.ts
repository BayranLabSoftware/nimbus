import { describe, expect, it } from 'vitest';
import { simulateEarthquake } from '../events/earthquake/simulate.js';
import {
  megathrustRuptureLength,
  megathrustRuptureWidth,
  surfaceRuptureLength,
  surfaceRuptureWidth,
} from '../events/earthquake/ruptureLength.js';
import { m } from '../units.js';
import {
  CONSERVATION_QUESTIONS,
  CRUSTAL_RIGIDITY_PA,
  MAX_CREDIBLE_SLIP_M,
  radiatedSeismicEnergy,
  seismicMomentOf,
} from './conservationRules.js';

/**
 * Rules 605 to 612 — the possibility lens on accounting, run.
 *
 * THE FULL RUN, 21 September 2026, over the sweep's 25 000 scenarios with
 * the sweep's own seeds — `scripts/benchmark/conservation.ts`:
 *
 *   question                                   asked   failed    worst
 *   ashLandsNoDeeperThanItErupted               5 000        0        —
 *   laharDepositsNoMoreThanItsVolume            1 435    1 435   7.320×
 *   airGetsNoMoreThanTheBodyHad                 9 808        0        —
 *   seismicImpliesNoMoreThanTheEventHad         4 987        0        —
 *   blanketHoldsNoMoreThanTheCraterLost         4 015        0        —
 *   aftershocksReleaseNoMoreThanTheMainshock    8 884        0        —
 *   aFaultSlipsWhatAFaultCanSlip                5 000       53   1.862×
 *
 * FIVE CLEAN, and they were asked of four to nine thousand scenarios each,
 * so they mean something. Nothing in this product puts more ash on the
 * ground than the volcano erupted, gives the air more energy than the body
 * carried, radiates more seismic energy than the event had, throws more
 * rock than the crater lost, or releases more moment in an aftershock
 * sequence than the mainshock.
 *
 * ONE WITHDRAWN, and it is the round's own mistake and not the model's.
 * `laharDepositsNoMoreThanItsVolume` multiplied the model's cross-section
 * by its runout, and `inundationArea.ts` documents that cross-section as
 * "the largest cross-section it fills on the way". The largest, held over
 * the whole length, has to overshoot a tapering flow, and 7.3× is what that
 * overshoot looks like. Rule 607 called all seven laws; that one was not.
 * Read in the direction that IS a law — a flow has to fit in the channel it
 * fills, V ≤ B_max · L — it passes with a factor of 7 to spare, on all
 * 1 435. That reading was made after the run and is recorded as such.
 *
 * ONE REAL, registered as B-087 rather than fixed, as rule 611 requires —
 * and then closed in its own round the same night, by rules 613 to 620,
 * which gave the rupture area a floor of M₀/(μ·D_max). The 53 went to
 * none, with ten readings sitting ON the bound and over it by 3 × 10⁻¹⁴ m,
 * which is the square root's own rounding. What the round found was: 53 of 5 000 earthquakes imply a fault slip above 100 m, the
 * worst 186.2 m — where the largest slip ever measured is Tōhoku's ≈ 50 to
 * 60 m and the bound was set at twice it so that it could only fire on the
 * impossible. Every one of the 53 is a NORMAL fault, off the subduction
 * interface, at Mw 9.6 and above.
 */

const slipOf = (moment: number, length: number, width: number): number =>
  moment / (CRUSTAL_RIGIDITY_PA * length * width);

describe('rules 605 to 612: what comes out is not more than what went in', () => {
  it('has not grown a question since the rules were pushed', () => {
    expect([...CONSERVATION_QUESTIONS]).toEqual([
      'ashLandsNoDeeperThanItErupted',
      'laharDepositsNoMoreThanItsVolume',
      'airGetsNoMoreThanTheBodyHad',
      'seismicImpliesNoMoreThanTheEventHad',
      'blanketHoldsNoMoreThanTheCraterLost',
      'aftershocksReleaseNoMoreThanTheMainshock',
      'aFaultSlipsWhatAFaultCanSlip',
    ]);
    expect(MAX_CREDIBLE_SLIP_M).toBe(100);
    expect(CRUSTAL_RIGIDITY_PA).toBe(3e10);
  });

  it('uses the field’s own identities for moment and radiated energy', () => {
    // Hanks & Kanamori 1979 and Gutenberg & Richter: an Mw 9.0 is
    // 4.0×10²² N·m and radiates 2.0×10¹⁸ J.
    expect(seismicMomentOf(9)).toBeCloseTo(3.981e22, -20);
    expect(radiatedSeismicEnergy(9)).toBeCloseTo(1.995e18, -15);
    // Two magnitude units is a thousand times the moment.
    expect(seismicMomentOf(9) / seismicMomentOf(7)).toBeCloseTo(1_000, 0);
  });

  it('keeps a megathrust’s moment and its geometry agreeing, all the way up', () => {
    // Where the round found nothing: the interface scaling stays consistent
    // to the top of the sweep's range.
    for (const magnitude of [8, 9, 9.2, 9.5, 9.83, 9.9]) {
      const r = simulateEarthquake({
        magnitude,
        depth: m(30_000),
        faultType: 'reverse',
        subductionInterface: true,
      } as never);
      const slip = slipOf(Number(r.seismicMoment), Number(r.ruptureLength), Number(r.ruptureWidth));
      expect(slip, `Mw ${String(magnitude)}`).toBeLessThan(MAX_CREDIBLE_SLIP_M);
    }
    // Tōhoku-class, and the slip it implies is the one that was measured.
    const tohoku = simulateEarthquake({
      magnitude: 9.1,
      depth: m(30_000),
      faultType: 'reverse',
      subductionInterface: true,
    } as never);
    expect(
      slipOf(
        Number(tohoku.seismicMoment),
        Number(tohoku.ruptureLength),
        Number(tohoku.ruptureWidth)
      )
    ).toBeCloseTo(13, 0);
  });

  it('B-087: a normal fault that was slipping further than any fault has', () => {
    // CLOSED by rules 613 to 620, the same night. What the audit found is
    // kept here as the nominal geometry — the rupture the scaling relation
    // returns, before `simulate.ts` applies the area floor — because that is
    // what the 53 readings were.
    const magnitude = 9.833853679476306;
    const nominalLength = Number(surfaceRuptureLength({ magnitude, faultType: 'normal' }));
    const nominalWidth = Number(surfaceRuptureWidth({ magnitude, faultType: 'normal' }));
    expect(nominalLength / 1_000).toBeCloseTo(807, 0);
    expect(nominalWidth / 1_000).toBeCloseTo(200, 0);

    const r = simulateEarthquake({
      magnitude,
      depth: m(608_577.5586776435),
      vs30: 138.09486301080557,
      faultType: 'normal',
      subductionInterface: false,
    } as never);
    // On that geometry the moment needed 146.2 m of slip.
    expect(slipOf(Number(r.seismicMoment), nominalLength, nominalWidth)).toBeCloseTo(146.2, 1);
    // On the geometry the product now uses, it needs the bound and no more.
    const slip = slipOf(Number(r.seismicMoment), Number(r.ruptureLength), Number(r.ruptureWidth));
    expect(slip).toBeCloseTo(MAX_CREDIBLE_SLIP_M, 6);
    expect(slip).not.toBeGreaterThan(MAX_CREDIBLE_SLIP_M + 1e-9);

    // And it is the relation being outside its box, not the moment being
    // wrong: the interface scaling at the same magnitude gives a rupture
    // four times the area and a slip a fault could have, with no floor
    // needed at all.
    const interfaceArea =
      Number(megathrustRuptureLength(magnitude)) * Number(megathrustRuptureWidth(magnitude));
    expect(interfaceArea / (nominalLength * nominalWidth)).toBeGreaterThan(4);
    expect(
      slipOf(
        Number(r.seismicMoment),
        Number(megathrustRuptureLength(magnitude)),
        Number(megathrustRuptureWidth(magnitude))
      )
    ).toBeCloseTo(33.74, 1);
  });

  it('leaves everything a fault really does alone', () => {
    // The bound only fires on the impossible: nothing at or below Mw 9.5,
    // the largest earthquake ever recorded, comes near it on any fault
    // type.
    for (const faultType of ['normal', 'reverse', 'strike-slip']) {
      for (const magnitude of [6, 7, 8, 8.5, 9, 9.5]) {
        const r = simulateEarthquake({
          magnitude,
          depth: m(20_000),
          faultType,
          subductionInterface: false,
        } as never);
        const slip = slipOf(
          Number(r.seismicMoment),
          Number(r.ruptureLength),
          Number(r.ruptureWidth)
        );
        expect(slip, `${faultType} Mw ${String(magnitude)}`).toBeLessThan(MAX_CREDIBLE_SLIP_M);
      }
    }
  });
});
