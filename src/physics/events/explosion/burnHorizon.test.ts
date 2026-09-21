import { describe, expect, it } from 'vitest';
import { thermalHorizonRadius } from '../../casualties.js';
import { nuclearFireballRadius } from '../../effects/blastWave.js';
import { mulberry32 } from '../../montecarlo/sampling.js';
import { m } from '../../units.js';
import { simulateExplosion } from './simulate.js';

/**
 * B-086, found and CLOSED the same night.
 *
 * The flash travels in straight lines, so nothing burns past the range at
 * which the fireball sets below the horizon. `src/physics/simulate.ts` cuts
 * an impact's fire and burn radii at that horizon and says why — it was
 * B-028 and B-038, closed on 15 September 2026, when Chicxulub's fire reached
 * 24 579 km and Boltysh's third-degree burns 936 km where its fireball sets
 * at 523. `events/explosion/simulate.ts` does not mention the horizon at all.
 *
 * Of the 5 000 explosions the invariant sweep draws, 156 burn rings lie past
 * their own fireball's horizon: 103 first-degree, 41 second, 12 third. The
 * worst is 2.32×.
 *
 * G5 walked past it for the same reason it walked past B-084 and B-085:
 * 1 606 km is a finite length well inside the antipode.
 *
 * Closed by rules 579 to 585: the sibling's own expression, unchanged,
 * applied to the sibling's problem. The figures below are what the defect
 * WAS, kept beside what the repair leaves.
 *
 * Every prediction rule 582 carried held. Nothing below about a thousand
 * megatons moved, no preset, no recorded event, no row of the calibration
 * net, no figure of the report, and no other domain. The only tests that
 * went red were the four that had been pinning the defect.
 */

/** The horizon from the top of a surface fireball, as the impact path
 *  computes it: the model's own two functions, not a formula written here. */
const horizonKm = (yieldMegatons: number, burstAltitudeM = 0): number =>
  thermalHorizonRadius(m(nuclearFireballRadius(yieldMegatons * 1_000) + burstAltitudeM)) / 1_000;

const burnKm = (yieldMegatons: number, burstAltitudeM = 0): number =>
  (
    simulateExplosion({
      yieldMegatons,
      burstAltitude: m(burstAltitudeM),
    } as never) as unknown as { thermal: { firstDegreeBurnRadius: number } }
  ).thermal.firstDegreeBurnRadius / 1_000;

describe("B-086: burn rings past the fireball's horizon", () => {
  it('leaves alone every yield that was already inside its horizon', () => {
    // Rule 583: the ceiling only shortens. Below the crossing nothing moved.
    expect(burnKm(100)).toBeLessThan(horizonKm(100));
    expect(burnKm(1_000)).toBeLessThan(horizonKm(1_000));
    expect(burnKm(100)).toBeCloseTo(42.9, 1);
  });

  it('cuts at the horizon above it: 1 653 km becomes 700', () => {
    // Was 1 653 km of first-degree burn where the fireball sets at 700.
    expect(horizonKm(1e4)).toBeCloseTo(700.4, 1);
    expect(burnKm(1e4)).toBeCloseTo(horizonKm(1e4), 6);
    expect(burnKm(2_000)).toBeCloseTo(horizonKm(2_000), 6);
  });

  it('was reached by the sweep in 156 rings of 5 000; it is now none', () => {
    // The sweep's own explosion sampler draws the yield over 1e-4 to 1e4 Mt,
    // so the top of its range is where this lives.
    const logU = (u: number, a: number, b: number): number =>
      Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * u);
    const rng = mulberry32('counting B-086');
    let over = 0;
    let worst = 0;
    for (let i = 0; i < 400; i++) {
      const y = logU(rng.next(), 1e-4, 1e4);
      const b = burnKm(y);
      const h = horizonKm(y);
      if (b > h) {
        over++;
        worst = Math.max(worst, b / h);
      }
    }
    // A smaller draw than the sweep's, but the answer is the same: none.
    expect(over).toBe(0);
    expect(worst).toBe(0);
  });

  it('now has the same ceiling as the impact path, which is where it came from', () => {
    // The asymmetry WAS the finding: `simulate.ts` cut at the horizon and
    // this module did not. Both do now, with the same expression.
    for (const y of [2_000, 5_000, 1e4]) {
      expect(burnKm(y), `${String(y)} Mt`).toBeLessThanOrEqual(horizonKm(y) * (1 + 1e-9));
    }
  });
});
