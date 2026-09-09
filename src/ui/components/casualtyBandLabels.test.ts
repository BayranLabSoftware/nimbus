import { describe, expect, it } from 'vitest';
import enLocale from '../../i18n/locales/en.json';
import itLocale from '../../i18n/locales/it.json';
import {
  blastCasualtyPlan,
  estimateCasualties,
  nuclearFireballRadius,
  type CasualtyPlan,
} from '../../physics/casualties.js';
import { simulateExplosion } from '../../physics/events/explosion/simulate.js';
import { m } from '../../physics/units.js';
import { bandLabelKey } from './casualtyBandLabel.js';

/**
 * Every band a scenario can produce must have a name.
 *
 * Bands past the OTA overpressure rings carry a generated key — `b6`,
 * `b7` — meant to be replaced by a label chosen from the band's
 * hazards. When no rule matched, the generated key reached i18n
 * unchanged and the report printed `casualties.band.b6` where a name
 * belonged. It was not a corner case: for a 500 Mt burst that annulus
 * runs from the second-degree burn radius to the fireball horizon and
 * holds two thirds of the dead.
 *
 * This sweeps the yield range and asserts that whatever comes out of
 * it has a name, in both languages.
 */
const EN: Record<string, string> = enLocale.casualties.band;
const IT: Record<string, string> = itLocale.casualties.band;

function labelsOf(plan: CasualtyPlan | null): string[] {
  if (plan === null) return [];
  // A rising population profile, so every band holds people and none
  // is dropped for being empty.
  const cumulative = plan.bands.map((_, i) => 10_000 * (i + 1) ** 2);
  const estimate = estimateCasualties(plan, cumulative);
  return estimate.bands.map((band) => bandLabelKey(band, estimate.model));
}

describe('every casualty band has a name in both languages', () => {
  const seen = new Set<string>();

  for (const megatons of [0.0005, 0.015, 1, 50, 500, 5_000]) {
    it(`explosion of ${megatons.toString()} Mt`, () => {
      const r = simulateExplosion({
        yieldMegatons: megatons,
        heightOfBurst: m(580),
        groundType: 'FIRM_GROUND',
      });
      const keys = labelsOf(
        blastCasualtyPlan({
          blastEnergy: r.yield.joules,
          overpressure5psiRadius: r.blast.overpressure5psiRadiusHob,
          overpressure1psiRadius: r.blast.overpressure1psiRadiusHob,
          thirdDegreeBurnRadius: r.thermal.thirdDegreeBurnRadius,
          secondDegreeBurnRadius: r.thermal.secondDegreeBurnRadius,
          firestormRadius: r.firestorm.sustainRadius,
          fireballRadius: nuclearFireballRadius(r.yield.joules),
        })
      );
      expect(keys.length).toBeGreaterThan(0);
      for (const key of keys) {
        seen.add(key);
        expect(EN[key], `en: ${key}`).toBeDefined();
        expect(IT[key], `it: ${key}`).toBeDefined();
      }
    });
  }

  it('a chemical charge, which has no thermal band at all', () => {
    const r = simulateExplosion({
      yieldMegatons: 0.0005,
      heightOfBurst: m(0),
      groundType: 'FIRM_GROUND',
      chargeType: 'chemical',
    });
    const keys = labelsOf(
      blastCasualtyPlan({
        blastEnergy: r.yield.joules,
        overpressure5psiRadius: r.blast.overpressure5psiRadiusHob,
        overpressure1psiRadius: r.blast.overpressure1psiRadiusHob,
        thirdDegreeBurnRadius: r.thermal.thirdDegreeBurnRadius,
        secondDegreeBurnRadius: r.thermal.secondDegreeBurnRadius,
        firestormRadius: r.firestorm.sustainRadius,
        fireballRadius: nuclearFireballRadius(r.yield.joules),
        chargeType: 'chemical',
      })
    );
    for (const key of keys) {
      seen.add(key);
      expect(EN[key], `en: ${key}`).toBeDefined();
      expect(IT[key], `it: ${key}`).toBeDefined();
    }
  });

  it('no band ever fell back on its generated key', () => {
    expect(seen.size).toBeGreaterThan(3);
    for (const key of seen) expect(key, `${key} is a generated key`).not.toMatch(/^b\d+$/);
  });
});
