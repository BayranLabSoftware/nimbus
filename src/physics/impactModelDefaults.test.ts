import { describe, expect, it } from 'vitest';
import { DEFAULT_GROUND_BLAST } from './effects/airburstBlast.js';
import { DEFAULT_AIRBURST_RADIATION } from './effects/atapRadiation.js';
import {
  DEFAULT_AIR_FLASH,
  DEFAULT_ENTRY_ATMOSPHERE,
  DEFAULT_ENTRY_BOUNDARY,
  DEFAULT_ENTRY_EQUATIONS,
  DEFAULT_LOW_BURST_CRATER,
  DEFAULT_LOW_BURST_FLASH,
  DEFAULT_PANCAKE_GROWTH,
  DEFAULT_STRENGTH_LAW,
} from './effects/atmosphericEntry.js';
import { DEFAULT_AIRBURST_SEISMIC } from './events/impact/airburstSeismic.js';
import { DEFAULT_CRATER_DOMAIN } from './events/impact/crater.js';
import { DEFAULT_CRATER_FIELD } from './events/impact/craterField.js';
import { DEFAULT_IRON_CRATER_FIELD } from './events/impact/ironCraterField.js';
import {
  CONSISTENCY_PRESETS,
  IMPACT_MODEL_DEFAULTS,
  IMPACT_PRESETS,
  impactModelSwitches,
} from './simulate.js';

/**
 * Rule 1213: the printed report names the configuration that made it, from
 * one table of the switches' defaults. The table must be the defaults the
 * simulator reads, each held to its own constant, or the page would print a
 * configuration the code does not run.
 */
describe("the model's switches, as a report prints them", () => {
  it('are the defaults the simulator reads, one by one', () => {
    expect(IMPACT_MODEL_DEFAULTS).toEqual({
      strengthLaw: DEFAULT_STRENGTH_LAW,
      entryAtmosphere: DEFAULT_ENTRY_ATMOSPHERE,
      pancakeGrowth: DEFAULT_PANCAKE_GROWTH,
      entryEquations: DEFAULT_ENTRY_EQUATIONS,
      entryBoundary: DEFAULT_ENTRY_BOUNDARY,
      craterDomain: DEFAULT_CRATER_DOMAIN,
      groundBlast: DEFAULT_GROUND_BLAST,
      airFlash: DEFAULT_AIR_FLASH,
      lowBurstFlash: DEFAULT_LOW_BURST_FLASH,
      lowBurstCrater: DEFAULT_LOW_BURST_CRATER,
      ironCraterField: DEFAULT_IRON_CRATER_FIELD,
      craterField: DEFAULT_CRATER_FIELD,
      airburstRadiation: DEFAULT_AIRBURST_RADIATION,
      airburstSeismic: DEFAULT_AIRBURST_SEISMIC,
    });
  });

  it('read every preset as the defaults, and mark a switch set away from its own', () => {
    for (const preset of Object.values(IMPACT_PRESETS)) {
      const switches = impactModelSwitches(preset.input);
      expect(switches).toHaveLength(Object.keys(IMPACT_MODEL_DEFAULTS).length);
      expect(switches.every((s) => s.isDefault)).toBe(true);
    }
    const density = impactModelSwitches({
      ...IMPACT_PRESETS.TUNGUSKA.input,
      strengthLaw: 'density',
    }).find((s) => s.key === 'strengthLaw');
    expect(density).toEqual({ key: 'strengthLaw', value: 'density', isDefault: false });
  });
});

/** Rule 1219: the presets labelled "consistency" are those whose own note
 *  says the diameter is back-solved from the crater, and no other. */
describe('the back-solved presets', () => {
  it('are exactly those whose note says their crater is circular', () => {
    for (const [id, preset] of Object.entries(IMPACT_PRESETS)) {
      expect(CONSISTENCY_PRESETS.has(id as keyof typeof IMPACT_PRESETS), id).toBe(
        preset.note.includes('circular, not a check')
      );
    }
  });
});
