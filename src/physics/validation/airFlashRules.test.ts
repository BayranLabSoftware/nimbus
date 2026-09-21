import { describe, expect, it } from 'vitest';
import { IMPACT_LUMINOUS_EFFICIENCY } from '../constants.js';
import { DEFAULT_AIR_FLASH, groundRangeAtSlant } from '../effects/atmosphericEntry.js';
import { IMPACT_PRESETS, simulateImpact, type ImpactScenarioInput } from '../simulate.js';
import { AIR_FLASH_HELD_OUT_SEED } from './airFlashRules.js';

/** Rules 698 to 705: an airburst's flash, where the airburst is (B-094). */

type Result = ReturnType<typeof simulateImpact>;
const thermalRings = (r: Result): number[] => [
  Number(r.damage.thirdDegreeBurn),
  Number(r.damage.secondDegreeBurn),
  Number(r.firestorm.ignitionRadius),
  Number(r.firestorm.sustainRadius),
];
const thermalField = (r: Result): number[] =>
  Object.entries(r.field)
    .filter(([key]) => key.startsWith('thermalExposure'))
    .map(([, value]) => value);

/** Airbursts of every size the form draws, far inside the horizon. */
const AIRBURSTS: ImpactScenarioInput[] = [5, 12, 20, 35, 60, 90].flatMap((d) =>
  [12_000, 25_000, 50_000].map(
    (v) =>
      ({
        impactorDiameter: d,
        impactVelocity: v,
        impactorDensity: 2_500,
        targetDensity: 2_500,
        impactAngle: Math.PI / 4,
      }) as unknown as ImpactScenarioInput
  )
);

describe('rules 698 to 705: an airburst’s flash where the airburst is', () => {
  it('is the default, and reads its unseen seed from the rules', () => {
    expect(DEFAULT_AIR_FLASH).toBe('burst');
    expect(AIR_FLASH_HELD_OUT_SEED).toBe('benchmark-2026-09-21-heldout-flash');
  });

  it('(b) draws each ring of a complete airburst at the slant range the flash reaches', () => {
    let complete = 0;
    for (const input of AIRBURSTS) {
      const onGround = simulateImpact({ ...input, airFlash: 'ground' });
      const atBurst = simulateImpact({ ...input, airFlash: 'burst' });
      if (atBurst.entry.regime !== 'COMPLETE_AIRBURST') continue;
      complete += 1;
      const z = Number(atBurst.entry.burstAltitude);
      thermalRings(onGround).forEach((slant, i) => {
        if (i === 3) return; // the mass fire also needs its burning area
        expect(thermalRings(atBurst)[i]).toBeCloseTo(groundRangeAtSlant(slant, z), 3);
      });
      thermalField(onGround).forEach((before, i) => {
        expect(thermalField(atBurst)[i]).toBeLessThanOrEqual(before * (1 + 1e-12));
      });
      // The possibility bound: nowhere more than the flash puts under itself.
      const underneath =
        (IMPACT_LUMINOUS_EFFICIENCY * atBurst.entry.atmosphericYieldMegatons * 4.184e15) /
        (4 * Math.PI * z * z);
      for (const q of thermalField(atBurst)) expect(q).toBeLessThanOrEqual(underneath * 1.000001);
    }
    expect(complete).toBeGreaterThan(8);
  });

  it('(a) moves nothing of a body that is not a complete airburst', () => {
    const bodies = [
      ...AIRBURSTS,
      ...Object.values(IMPACT_PRESETS).map((p) => p.input as ImpactScenarioInput),
    ];
    let checked = 0;
    for (const input of bodies) {
      const onGround = simulateImpact({ ...input, airFlash: 'ground' });
      if (onGround.entry.regime === 'COMPLETE_AIRBURST') continue;
      const atBurst = simulateImpact({ ...input, airFlash: 'burst' });
      expect(thermalRings(atBurst)).toEqual(thermalRings(onGround));
      expect(thermalField(atBurst)).toEqual(thermalField(onGround));
      checked += 1;
    }
    expect(checked).toBeGreaterThan(5);
  });

  it('(f) moves the presets as rule 701 lists them', () => {
    for (const id of ['TUNGUSKA', 'CHELYABINSK', 'SIKHOTE_ALIN_1947'] as const) {
      const r = simulateImpact(IMPACT_PRESETS[id].input);
      expect(r.entry.regime).toBe('COMPLETE_AIRBURST');
      expect(thermalRings(r)).toEqual([0, 0, 0, 0]);
    }
    const tunguska = simulateImpact({ ...IMPACT_PRESETS.TUNGUSKA.input, airFlash: 'ground' });
    expect(Number(tunguska.damage.thirdDegreeBurn)).toBeCloseTo(5_215.5, 0);
  });
});
