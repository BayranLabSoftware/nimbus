import { describe, expect, it } from 'vitest';
import {
  LEVEL_B_BARS,
  LEVEL_B_DAMAGE_BANDS,
  LEVEL_B_DRAWS,
  LEVEL_B_EVENTS,
  LEVEL_B_FROZEN_MODEL,
  LEVEL_B_OUTCOME,
  LEVEL_B_SEED,
} from './levelBProtocolRules.js';

describe('rules 855 to 874: level B, preregistered', () => {
  it('keeps the development cases out of every scored set (rules 857 and 858)', () => {
    const development = Object.entries(LEVEL_B_EVENTS)
      .filter(([, set]) => set === 'development')
      .map(([name]) => name)
      .sort();
    expect(development).toEqual(['Chelyabinsk 2013', 'Sikhote-Alin 1947', 'Tunguska 1908']);
    expect(LEVEL_B_EVENTS['Meteor Crater']).toBe('consistency');
    expect(
      Object.entries(LEVEL_B_EVENTS)
        .filter(([, set]) => set === 'entry')
        .map(([name]) => name)
    ).toEqual(['2023 CX1', '2024 BX1']);
    // Rule 867: the rows of I2 are checks, never counted.
    expect(
      Object.entries(LEVEL_B_EVENTS)
        .filter(([, set]) => set === 'seen')
        .map(([name]) => name)
    ).toEqual(['2008 TC3', '2018 LA', '2022 EB5']);
    expect(LEVEL_B_EVENTS.Carancas).toBe('crater');
  });

  it('fixes the model, the draw and the bars before any source is pinned (rules 859 and 863)', () => {
    expect(LEVEL_B_FROZEN_MODEL).toBe('2c2c2f5');
    expect(LEVEL_B_SEED).toBe('level-b-2026-09-23');
    expect(LEVEL_B_DRAWS).toBe(1_000);
    // Rule 868, the reviewer's bars.
    expect(LEVEL_B_BARS.outcomeShare).toBe(0.9);
    expect(LEVEL_B_BARS.morphologyShare).toBe(0.8);
    expect(LEVEL_B_BARS.fragmentationRelative).toBe(0.3);
    expect(LEVEL_B_BARS.fragmentationMinimumM).toBe(5_000);
    expect(LEVEL_B_BARS.flareWideningM).toBe(5_000);
    expect(LEVEL_B_BARS.depthRatioRelative).toBe(0.2);
    expect(Math.exp(LEVEL_B_BARS.biasLogRatio)).toBeCloseTo(1.3, 12);
    // The glass bands meet where sporadic breakage ends and extensive begins.
    expect(LEVEL_B_DAMAGE_BANDS.glassSporadicPa[1]).toBe(LEVEL_B_DAMAGE_BANDS.glassExtensivePa[0]);
  });

  it('has no outcome until step 4', () => {
    expect(LEVEL_B_OUTCOME).toBeNull();
  });
});
