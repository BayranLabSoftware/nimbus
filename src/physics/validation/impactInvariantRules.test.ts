import { describe, expect, it } from 'vitest';
import {
  combineImpactFlashes,
  DEFAULT_IMPACT_FLASH_COMBINER,
} from '../events/impact/damageRings.js';
import { thirdDegreeBurnRadius } from '../events/explosion/thermal.js';
import { DEFAULT_SEAFLOOR_CUTOFF, oceanCouplingPartition } from '../effects/oceanCoupling.js';
import { IMPACT_LUMINOUS_EFFICIENCY } from '../constants.js';
import { J, kgPerM3, m } from '../units.js';
import {
  FLASH_RINGS,
  TAPER_CEILING,
  TSUNAMI_RING_PREFIX,
  flashPresetHolds,
  ringOf,
  sweepGuard,
  taperPresetHolds,
} from './impactInvariantRules.js';

describe('rule 133: the candidates', () => {
  it('A: the ring where two inverse-square flashes add is the ring of their energy together', () => {
    const flash = (joules: number) =>
      thirdDegreeBurnRadius({
        yieldEnergy: J(joules),
        thermalPartition: IMPACT_LUMINOUS_EFFICIENCY,
        burnExposure: 'project',
      });
    const ground = flash(2.35e16);
    const air = flash(2.14e17);
    expect(combineImpactFlashes(ground, air, 'sum') as number).toBeCloseTo(
      flash(2.35e16 + 2.14e17),
      6
    );
    expect(combineImpactFlashes(ground, air, 'larger')).toBe(air);
    expect(combineImpactFlashes(m(0), air, 'sum')).toBe(air);
  });

  it('B: the taper starts from all of the energy on the seafloor and ends at none, without a step', () => {
    const at = (depth: number, cutoff: 'step' | 'taper') =>
      oceanCouplingPartition({
        impactorDiameter: m(100),
        waterDepth: m(depth),
        impactorDensity: kgPerM3(3_000),
        cutoff,
      }).seafloorFraction;
    // d_d = 1.5 · 100 · √(3000/1025) = 256.6 m.
    expect(at(1e-6, 'taper')).toBeCloseTo(1, 6);
    expect(at(256.5, 'taper')).toBeLessThan(1e-3);
    expect(at(256.7, 'taper')).toBe(0);
    expect(at(256.5, 'step')).toBeGreaterThan(0.049);
    for (let d = 1; d < 300; d += 1) {
      expect(at(d + 1, 'taper')).toBeLessThanOrEqual(at(d, 'taper'));
    }
  });
});

describe('rules 135 and 136: what decides', () => {
  const inPlace = {
    'monotone in size: damage.lightDamage': 68,
    'monotone in size: damage.thirdDegreeBurn': 3,
    'monotone in size: tsunami.amplitudeAt1000km': 2,
  };
  const isFlash = (ring: string) => FLASH_RINGS.includes(ring);
  const isTsunami = (ring: string) => ring.startsWith(TSUNAMI_RING_PREFIX);

  it('reads the ring off an invariant name', () => {
    expect(ringOf('continuous: damage.secondDegreeBurn')).toBe('damage.secondDegreeBurn');
  });

  it('holds when the candidate clears its own rings and nothing else grows or appears', () => {
    const g = sweepGuard(
      inPlace,
      {
        'monotone in size: damage.lightDamage': 68,
        'monotone in size: tsunami.amplitudeAt1000km': 2,
      },
      isFlash
    );
    expect(g.held).toBe(true);
  });

  it('fails on a ring left, a count grown or a failure new', () => {
    expect(sweepGuard(inPlace, inPlace, isFlash).targetsLeft).toBe(3);
    expect(
      sweepGuard(inPlace, { 'monotone in size: damage.lightDamage': 69 }, isTsunami).grown
    ).toEqual(['monotone in size: damage.lightDamage']);
    expect(sweepGuard(inPlace, { 'continuous: crater.finalDiameter': 1 }, isTsunami).held).toBe(
      false
    );
  });

  it('holds the presets to their bounds', () => {
    expect(flashPresetHolds(4_660, 4_660, false)).toBe(true);
    expect(flashPresetHolds(4_660, 4_661, false)).toBe(false);
    expect(flashPresetHolds(4_660, 5_450, true)).toBe(true);
    expect(flashPresetHolds(4_660, 4_600, true)).toBe(false);
    expect(flashPresetHolds(4_660, 6_600, true)).toBe(false);
    expect(TAPER_CEILING).toBeCloseTo(1.0524, 4);
    expect(taperPresetHolds(10, 10.5)).toBe(true);
    expect(taperPresetHolds(10, 10.6)).toBe(false);
    expect(taperPresetHolds(0, 0)).toBe(true);
  });
});

describe('the outcome of 16 September 2026', () => {
  it('adopted the flashes that add and refused the taper — which rules 654 to 659 then adopted', () => {
    expect(DEFAULT_IMPACT_FLASH_COMBINER).toBe('sum');
    // Refused on 16 September on rule 136 (b) alone, a crater moved onto the
    // simple-to-complex step; adopted on 21 September, with that step joined
    // by rules 647 to 653 and rule 136's bar unchanged.
    expect(DEFAULT_SEAFLOOR_CUTOFF).toBe('taper');
  });
});
