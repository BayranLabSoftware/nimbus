import { describe, expect, it } from 'vitest';
import { airburstOverpressure, airburstReach } from '../../effects/airburstBlast.js';
import { J, m } from '../../units.js';
import { OVERPRESSURE_BUILDING_COLLAPSE, OVERPRESSURE_WINDOW_BREAK } from './damageRings.js';

/**
 * The last thirteen of the 464 impact G5 failures rules 555 to 562
 * measured, and what they are.
 *
 * G5 asks that a body one per mille larger move no output by more than five
 * per cent. Thirteen readings of the impact sweep break it, all three of
 * them overpressure rings — 1 psi, 5 psi and light damage — and the first
 * guess was that a regime had switched under them. It had not.
 *
 * WHAT WAS ALREADY KNOWN. The mechanism below is not new. Reading the same
 * sweep on 16 September, GOLD_STANDARD.md's G5 row already named "8 rings
 * born under the burst, whose peak overpressure is within 3 % of the
 * threshold, growing steeply from nothing". This file adds three things to
 * that reading: that ALL THIRTEEN are it and not eight, that the two
 * explanations one would reach for first are both false, and that the thing
 * has a closed form, which is what makes it a characterisation rather than
 * an observation.
 *
 * Measured on 21 September 2026:
 *
 *   - the entry regime is UNCHANGED in all thirteen (ten COMPLETE_AIRBURST,
 *     three PARTIAL_AIRBURST);
 *   - the branch is unchanged too. `simulate.ts` takes the larger of the
 *     surface ring and the air ring, and the winner never flips: ten are
 *     the air ring throughout, three the ground ring throughout;
 *   - all thirteen are reproduced EXACTLY by calling `airburstReach` (ten)
 *     or `groundImpactReach` (three) with the altitude and energy the model
 *     hands them, so nothing between the ring and the result is involved.
 *
 * What is involved is the ring formula's own conditioning. Differentiating
 * the reach the model calls, d ln R / d ln E runs from 9.1 to 392.6 across
 * the thirteen, with a median of 39.4 — where a blast curve far from its
 * burst gives 1/3. And the reason is in the pressure curve: at the ring,
 * d ln P / d ln r measures −0.002 to −0.059, against −0.62 at eight times
 * the radius. Under a high burst the overpressure lies on a shelf, nearly
 * flat in range, so the range at which it crosses a threshold is
 * ill-conditioned.
 *
 * At the limit the shelf's peak IS the threshold, and there the ring is
 * being born. This file pins that limit, because it is the whole of the
 * mechanism and it has a closed form: just above birth the ring grows as
 * the SQUARE ROOT of the excess energy, so its elasticity is 1/(2·excess)
 * and rises without bound as the excess goes to zero. A threshold contour
 * genuinely appears with infinite slope; the thirteen sit close enough to a
 * birth for a per-mille of energy to move them by per cents.
 *
 * So they are the reference's behaviour and not a defect — the same finding
 * the earthquake sweep reached for its ten MMI IX rings, by the same
 * arithmetic. What they do show is that G5's continuity clause is ill-posed
 * AT a threshold contour's birth, which is a statement about the rule and is
 * recorded as one. Nothing here proposes to smooth the ring: a ring that is
 * born is what the field's own curves do.
 *
 * With these thirteen and the two of `craterTransition.test.ts`, all 464 of
 * the impact G5 failures have a cause.
 */

const MEGATON_J = 4.184e15;

/** The worst-conditioned of the thirteen: a 5 psi ring under a 9.6 km burst
 *  whose elasticity measured 392.6. */
const BURST_ALTITUDE_M = 9_600;

/** Solved by bisection on the peak at ground zero: below this energy the
 *  5 psi ring under that burst does not exist at all. */
const BIRTH_MEGATONS = 4.612121;

const reach = (megatons: number): number =>
  Number(
    airburstReach(
      OVERPRESSURE_BUILDING_COLLAPSE,
      m(BURST_ALTITUDE_M),
      J(megatons * MEGATON_J),
      'low'
    )
  );

const peakAtGroundZero = (megatons: number): number =>
  Number(
    airburstOverpressure({
      groundRange: m(0),
      burstAltitude: m(BURST_ALTITUDE_M),
      blastYield: J(megatons * MEGATON_J),
    })
  );

describe('a threshold ring at its birth', () => {
  it('is born where the shelf’s peak reaches the threshold, and not before', () => {
    expect(peakAtGroundZero(BIRTH_MEGATONS)).toBeCloseTo(Number(OVERPRESSURE_BUILDING_COLLAPSE), 1);
    // A hair below, there is no ring at all.
    expect(reach(BIRTH_MEGATONS * (1 - 1e-6))).toBe(0);
    expect(peakAtGroundZero(BIRTH_MEGATONS * (1 - 1e-4))).toBeLessThan(
      Number(OVERPRESSURE_BUILDING_COLLAPSE)
    );
    // And a hair above, there is.
    expect(reach(BIRTH_MEGATONS * (1 + 1e-6))).toBeGreaterThan(0);
  });

  it('grows as the square root of the excess, over five decades of it', () => {
    // R = C·√(E/E_b − 1), with C constant to under one per cent from a
    // millionth of an excess to a tenth of one.
    const c = (excess: number): number => reach(BIRTH_MEGATONS * (1 + excess)) / Math.sqrt(excess);
    for (const excess of [1e-6, 1e-5, 1e-4, 1e-3, 1e-2]) {
      expect(c(excess), `excess ${excess.toExponential(0)}`).toBeCloseTo(7_838, -2);
    }
    // The drift at a tenth of an excess is 0.55 per cent, which is the fit
    // leaving the neighbourhood of the birth, not the law failing. (The
    // probe that found this printed 0.8 per cent, reading the birth energy
    // unrounded; the constant above is rounded to six figures, and the
    // difference between the two is the whole of the gap.)
    expect(c(1e-1) / c(1e-6)).toBeCloseTo(0.9945, 3);
  });

  it('so its elasticity is one half over the excess, and unbounded', () => {
    // d ln R / d ln E = 1/(2·excess) to leading order.
    const elasticity = (excess: number): number => {
      const e = BIRTH_MEGATONS * (1 + excess);
      const step = Math.min(1e-4, excess / 20);
      return (
        (Math.log(reach(e * (1 + step))) - Math.log(reach(e / (1 + step)))) /
        (2 * Math.log(1 + step))
      );
    };
    expect(elasticity(1e-2)).toBeCloseTo(50, -1);
    expect(elasticity(1e-3)).toBeCloseTo(500, -2);
    expect(elasticity(1e-4)).toBeCloseTo(5_000, -3);
    // A healthy blast curve gives a third; every one of these is orders
    // above it, which is what G5 read as a discontinuity.
    expect(elasticity(1e-2)).toBeGreaterThan(100 / 3);
  });

  it('is flat in range where the ring sits, and steep far from it', () => {
    // The second of the thirteen, a 1 psi ring under a 16 km burst.
    const yieldMegatons = 1.44;
    const altitude = 16_000;
    const r = Number(
      airburstReach(OVERPRESSURE_WINDOW_BREAK, m(altitude), J(yieldMegatons * MEGATON_J), 'low')
    );
    expect(r).toBeCloseTo(1_727.9, 0);
    const p = (range: number): number =>
      Number(
        airburstOverpressure({
          groundRange: m(range),
          burstAltitude: m(altitude),
          blastYield: J(yieldMegatons * MEGATON_J),
        })
      );
    const slopeAt = (range: number): number =>
      (Math.log(p(range * 1.001)) - Math.log(p(range * 0.999))) / (2 * Math.log(1.001));
    expect(slopeAt(r)).toBeCloseTo(-0.018, 3);
    expect(slopeAt(r * 8)).toBeCloseTo(-0.617, 3);
    // Which is a ring within one per cent of its own birth.
    expect(p(0) / Number(OVERPRESSURE_WINDOW_BREAK)).toBeLessThan(1.01);
    // And an energy three per mille larger — a body one per mille bigger —
    // moves it eight per cent.
    const grown = Number(
      airburstReach(
        OVERPRESSURE_WINDOW_BREAK,
        m(altitude),
        J(yieldMegatons * 1.003 * MEGATON_J),
        'low'
      )
    );
    expect(grown / r - 1).toBeCloseTo(0.083, 2);
  });
});
