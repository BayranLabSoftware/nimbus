import { describe, expect, it } from 'vitest';
import {
  MINIMUM_BURNING_AREA_M2,
  firestormSustainRadius,
  flammableIgnitionRadius,
} from '../effects/firestorm.js';
import { EXPLOSION_PRESETS, simulateExplosion } from '../events/explosion/simulate.js';
import { simulateImpact } from '../simulate.js';
import { Mt, deg, degreesToRadians, kgPerM3, m, megatonsToJoules, mps } from '../units.js';
import {
  FIELD_BAND_FACTOR,
  HIROSHIMA_BURNT_AREA_M2,
  HIROSHIMA_BURNT_RADIUS_M,
  NAGASAKI_BURNT_AREA_M2,
  withinFieldBand,
} from './massFireRules.js';

/**
 * Rules 230 to 232: the mass fire measured against the ground that burned.
 *
 * The rules were fixed and pushed (commit 6fdf58b) before the candidate was
 * written. This file is the measurement they called for.
 */

/** What the project drew until 19 September 2026: two flat fluences of its
 *  own, 10 cal/cm² for the fire and 6 for the mass fire, in J/m². */
const BEFORE = { tinder: 4.19e5, structural: 2.51e5 };

const NUCLEAR_PARTITION = 0.35;

/** The old radius: the same inverse-square law, at the old threshold, in the
 *  clear vacuum the fire rings used to be solved in. */
function beforeRadius(yieldMegatons: number, which: 'tinder' | 'structural'): number {
  const W = megatonsToJoules(Mt(yieldMegatons)) as number;
  return Math.sqrt((NUCLEAR_PARTITION * W) / (4 * Math.PI * BEFORE[which]));
}

const km = (x: number): string => `${(x / 1_000).toFixed(2)} km`;
const km2 = (x: number): string => `${(x / 1e6).toFixed(1)} km²`;

describe('rules 227 to 234 — the mass fire inside the fire', () => {
  it('rule 230: Hiroshima’s burnt-out ground decides, and the record is 4.4 square miles', () => {
    const hiroshima = simulateExplosion(EXPLOSION_PRESETS.HIROSHIMA_1945.input);
    const massFire = hiroshima.firestorm.sustainRadius as number;
    const ignition = hiroshima.firestorm.ignitionRadius as number;

    const lines = [
      '',
      `§7.62 records 4.4 square miles severely damaged by fire: ${km2(HIROSHIMA_BURNT_AREA_M2)}, a radius of ${km(HIROSHIMA_BURNT_RADIUS_M)}.`,
      `The band is the table's own field footnote through the inverse square: ×${(1 / FIELD_BAND_FACTOR).toFixed(3)} to ×${FIELD_BAND_FACTOR.toFixed(3)}.`,
      '',
      '| ring | before, 19 Sep | after (Table 7.40) | without the atmosphere | record |',
      '| --- | --: | --: | --: | --: |',
      `| mass fire | ${km(beforeRadius(0.015, 'structural'))} | ${km(massFire)} | ${km(firestormSustainRadius({ yieldEnergy: megatonsToJoules(Mt(0.015)) }))} | ${km(HIROSHIMA_BURNT_RADIUS_M)} |`,
      `| ignition | ${km(beforeRadius(0.015, 'tinder'))} | ${km(ignition)} | ${km(flammableIgnitionRadius({ yieldEnergy: megatonsToJoules(Mt(0.015)) }))} | — |`,
      '',
      `mass fire / record = ${(massFire / HIROSHIMA_BURNT_RADIUS_M).toFixed(3)}×  →  rule 230 ${withinFieldBand(massFire, HIROSHIMA_BURNT_RADIUS_M) ? 'MET' : 'NOT met'}`,
      `burning area ${km2(hiroshima.firestorm.sustainArea)} against §7.58's half a square mile, ${km2(MINIMUM_BURNING_AREA_M2)}`,
    ];
    console.log(lines.join('\n'));

    expect(withinFieldBand(massFire, HIROSHIMA_BURNT_RADIUS_M)).toBe(true);
  });

  it('rule 232: Nagasaki beside it, deciding nothing', () => {
    const nagasaki = simulateExplosion(EXPLOSION_PRESETS.NAGASAKI_1945.input);
    const massFire = nagasaki.firestorm.sustainRadius as number;
    const recorded = Math.sqrt(NAGASAKI_BURNT_AREA_M2 / Math.PI);
    console.log(
      [
        '',
        `Nagasaki, 21 kt at 503 m: mass fire ${km(massFire)}, ignition ${km(nagasaki.firestorm.ignitionRadius)}.`,
        `§7.62 puts its burnt ground at roughly a quarter of Hiroshima's — ${km2(NAGASAKI_BURNT_AREA_M2)}, a radius of ${km(recorded)} — and §7.72 records that no definite fire storm occurred there:`,
        'the wind carried the fire up a valley where there was nothing to burn, and the narrow valley held too few dwellings to feed one.',
        `The model reads ${(massFire / recorded).toFixed(2)}× that radius and cannot tell a fire storm from a conflagration: it has no terrain and no fuel map,`,
        'which is three of §7.58’s four requirements and exactly what §7.58 says nobody can predict.',
      ].join('\n')
    );
    // Nothing is asserted against Nagasaki: it is printed, not scored.
    expect(massFire).toBeGreaterThan(0);
  });

  it('rule 231: the mass fire never reaches past the fire, in either family', () => {
    for (const mt of [0.001, 0.015, 0.021, 1, 15, 50, 1_000]) {
      const r = simulateExplosion({
        yieldMegatons: mt,
        groundType: 'FIRM_GROUND',
        heightOfBurst: m(500),
      });
      const ignition = r.firestorm.ignitionRadius as number;
      const massFire = r.firestorm.sustainRadius as number;
      expect(massFire, `explosion ${mt.toString()} Mt`).toBeLessThanOrEqual(ignition);
      expect(r.firestorm.sustainArea as number).toBeLessThanOrEqual(r.firestorm.ignitionArea);
    }
    for (const [diameter, velocity] of [
      [50, 17],
      [300, 20],
      [1_000, 20],
      [10_000, 20],
    ] as const) {
      const r = simulateImpact({
        impactorDiameter: m(diameter),
        impactorDensity: kgPerM3(3_000),
        impactVelocity: mps(velocity * 1_000),
        targetDensity: kgPerM3(2_500),
        impactAngle: degreesToRadians(deg(45)),
      });
      const ignition = r.firestorm.ignitionRadius as number;
      const massFire = r.firestorm.sustainRadius as number;
      expect(massFire, `impact ${diameter.toString()} m`).toBeLessThanOrEqual(ignition);
      expect(r.firestorm.sustainArea as number).toBeLessThanOrEqual(r.firestorm.ignitionArea);
    }
  });

  it('rule 229: below half a square mile of burning ground there is no fire storm', () => {
    const rows: string[] = [
      '',
      '| yield | ignition | mass fire | burning area | fire storm? |',
      '| --- | --: | --: | --: | :-- |',
    ];
    let sawNone = false;
    for (const kt of [0.3, 0.5, 1, 2, 5, 15]) {
      const r = simulateExplosion({
        yieldMegatons: kt / 1_000,
        groundType: 'FIRM_GROUND',
        heightOfBurst: m(100 * Math.cbrt(kt)),
      });
      const area = r.firestorm.sustainArea as number;
      const storm = (r.firestorm.sustainRadius as number) > 0;
      if (!storm) sawNone = true;
      rows.push(
        `| ${kt.toString()} kt | ${km(r.firestorm.ignitionRadius)} | ${km(r.firestorm.sustainRadius)} | ${km2(area)} | ${storm ? 'yes' : 'no — §7.58 (4)'} |`
      );
    }
    console.log(rows.join('\n'));
    expect(sawNone).toBe(true);
  });

  it('rule 232: what the four impact scales read, before and after', () => {
    const rows: string[] = [
      '',
      '| impactor | ignition before | ignition after | mass fire before | mass fire after |',
      '| --- | --: | --: | --: | --: |',
    ];
    for (const [label, diameter] of [
      ['iron 50 m', 50],
      ['stony 300 m', 300],
      ['stony 1 km', 1_000],
      ['Chicxulub 10 km', 10_000],
    ] as const) {
      const r = simulateImpact({
        impactorDiameter: m(diameter),
        impactorDensity: kgPerM3(diameter === 50 ? 7_800 : 3_000),
        impactVelocity: mps(20_000),
        targetDensity: kgPerM3(2_500),
        impactAngle: degreesToRadians(deg(45)),
      });
      const mtOfEvent = (r.impactor.kineticEnergyMegatons as number) || 0;
      rows.push(
        `| ${label} | ${km(beforeRadius(mtOfEvent, 'tinder'))} | ${km(r.firestorm.ignitionRadius)} | ${km(beforeRadius(mtOfEvent, 'structural'))} | ${km(r.firestorm.sustainRadius)} |`
      );
    }
    rows.push(
      '',
      'The "before" columns are the old flat thresholds through the same inverse-square law at the nuclear partition,',
      'which is not how an impact’s rings were drawn — they went through the program’s own fluence law — so they are an order of magnitude, not a like-for-like.'
    );
    console.log(rows.join('\n'));
    expect(rows.length).toBeGreaterThan(4);
  });
});
