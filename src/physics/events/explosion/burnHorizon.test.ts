import { describe, expect, it } from 'vitest';
import { thermalHorizonRadius } from '../../casualties.js';
import { nuclearFireballRadius } from '../../effects/blastWave.js';
import { mulberry32 } from '../../montecarlo/sampling.js';
import { m } from '../../units.js';
import { simulateExplosion } from './simulate.js';

/**
 * B-086, pinned as it is — not as it should be.
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
 * NOT FIXED HERE. Applying the sibling's ceiling moves shipped radii above
 * about a thousand megatons, which is a default change and needs rules
 * written before it.
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
  it('is inside the horizon up to a thousand megatons and outside it above two', () => {
    expect(burnKm(100)).toBeLessThan(horizonKm(100));
    expect(burnKm(1_000)).toBeLessThan(horizonKm(1_000));
    expect(burnKm(2_000)).toBeGreaterThan(horizonKm(2_000));
    expect(burnKm(10_000) / horizonKm(10_000)).toBeCloseTo(2.36, 1);
  });

  it('draws 1 653 km of first-degree burn where the fireball sets at 700', () => {
    expect(burnKm(1e4)).toBeCloseTo(1_653, -1);
    expect(horizonKm(1e4)).toBeCloseTo(700, -1);
  });

  it('is reached by the sweep, 156 rings of 5 000 scenarios', () => {
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
    // A smaller draw than the sweep's, so the count is its own; what it
    // holds is that the defect is common rather than a single corner.
    expect(over).toBeGreaterThan(10);
    expect(worst).toBeGreaterThan(2);
  });

  it('is absent from the impact path, which has the ceiling the explosion lacks', () => {
    // The asymmetry is the finding. `simulate.ts` cuts at the horizon and
    // `events/explosion/simulate.ts` has no such cut, so a 10 000 Mt burst
    // burns past where its own fireball can be seen while an impact of the
    // same energy does not.
    expect(burnKm(1e4)).toBeGreaterThan(horizonKm(1e4));
  });
});
