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

describe('rules 855 to 865: level B, preregistered', () => {
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
    ).toEqual(['2008 TC3', '2018 LA', '2023 CX1', '2024 BX1']);
    expect(LEVEL_B_EVENTS.Carancas).toBe('crater');
  });

  it('fixes the model, the draw and the bars before any source is pinned (rules 859 and 863)', () => {
    expect(LEVEL_B_FROZEN_MODEL).toBe('2c2c2f5');
    expect(LEVEL_B_SEED).toBe('level-b-2026-09-23');
    expect(LEVEL_B_DRAWS).toBe(1_000);
    expect(Math.exp(LEVEL_B_BARS.continuousLogRatio)).toBeCloseTo(1.2, 12);
    expect(LEVEL_B_BARS.outcomeShare).toBe(0.9);
    expect(LEVEL_B_BARS.magnitude).toBe(0.5);
    // The glass bands meet where sporadic breakage ends and extensive begins.
    expect(LEVEL_B_DAMAGE_BANDS.glassSporadicPa[1]).toBe(LEVEL_B_DAMAGE_BANDS.glassExtensivePa[0]);
  });

  it('has no outcome until step 4', () => {
    expect(LEVEL_B_OUTCOME).toBeNull();
  });
});
