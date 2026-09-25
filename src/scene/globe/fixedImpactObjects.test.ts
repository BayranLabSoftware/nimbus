import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import { IMPACT_PRESETS, simulateImpact } from '../../physics/simulate.js';
import { COLLINS_GRAVITY_REGIME_MIN_DIAMETER_M } from '../../physics/validation/craterDomainRules.js';
import { fixedImpactObjects } from './impactFieldMap.js';

const keyOnly = ((key: string) => key) as unknown as TFunction;

/**
 * Rule 1216: the crater and the tsunami's source cavity are drawn on every
 * layer and are not layers, so each carries a card of its own — or the
 * globe would draw an object nobody can ask the provenance of.
 */
describe('what the globe draws on every layer carries its card', () => {
  it('for every preset: the crater where there is a rim, the cavity where there is a wave', () => {
    for (const [id, preset] of Object.entries(IMPACT_PRESETS)) {
      const result = simulateImpact(preset.input);
      const objects = fixedImpactObjects(result, { t: keyOnly, language: 'en' });
      const crater = objects.find((o) => o.id === 'crater');
      const cavity = objects.find((o) => o.id === 'cavity');
      expect(crater !== undefined, id).toBe((result.damage.craterRim as number) > 0);
      expect(cavity !== undefined, id).toBe(
        ((result.tsunami?.cavityRadius as number | undefined) ?? 0) > 0
      );
      if (crater !== undefined) {
        expect(crater.card.state, id).toBe(
          result.crater.state === 'outOfDomain'
            ? 'outOfDomain'
            : (result.crater.finalDiameter as number) < COLLINS_GRAVITY_REGIME_MIN_DIAMETER_M
              ? 'exploratory'
              : 'verified'
        );
        expect(crater.card.beyond).toBe('notApplicable');
        expect(crater.card.source).toBe('globe.tooltip.source.impactCrater');
      }
      if (cavity !== undefined) {
        expect(cavity.card.state).toBe('exploratory');
        expect(cavity.card.source).toBe('globe.tooltip.source.impactCavity');
      }
    }
  });

  it('draws nothing of the kind for an airburst that digs nothing', () => {
    const result = simulateImpact(IMPACT_PRESETS.TUNGUSKA.input);
    expect(fixedImpactObjects(result, { t: keyOnly, language: 'en' })).toEqual([]);
  });
});
