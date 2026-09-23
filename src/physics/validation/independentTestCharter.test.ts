import { describe, expect, it } from 'vitest';
import { FRAGMENTATION_CLAUSE, S_FIRST_PHASE_LOSS } from './fragmentationRoundRules.js';
import { CHARTER, CHARTER_ROLES, charterReading } from './independentTestCharter.js';
import { THIRD_SET_EVENTS, THIRD_SET_MIN_ENTRY_BODIES } from './levelBThirdSetRules.js';

describe('rules 1038 to 1047: the charter of the independent test', () => {
  it('borrows the round’s clause where it says it does', () => {
    expect(CHARTER.outcomeGain).toBe(FRAGMENTATION_CLAUSE.observedOutcomeGain);
    expect(CHARTER.rightOutcomeShare).toBe(FRAGMENTATION_CLAUSE.rightOutcomeShare);
    expect(CHARTER.bandWidening).toBe(FRAGMENTATION_CLAUSE.bandWidening);
    expect(CHARTER.minObservablesImproved).toBe(FRAGMENTATION_CLAUSE.minMetricsImproved);
    expect(CHARTER.minBodies).toBe(THIRD_SET_MIN_ENTRY_BODIES);
  });

  it('judges S at the f1 its specification named', () => {
    expect(CHARTER.sFirstPhaseLoss).toBe(S_FIRST_PHASE_LOSS);
  });

  it('decides on O1, O2 and O5, and reads the others as diagnostics', () => {
    expect(
      Object.entries(CHARTER_ROLES)
        .filter(([, r]) => r === 'decisive')
        .map(([o]) => o)
    ).toEqual(['O1', 'O2', 'O5']);
  });

  it('counts only the ordinary chondrites unless a model declares priors for a type', () => {
    expect(charterReading('ordinaryChondrite')).toBe('counted');
    expect(charterReading('other')).toBe('robustnessControl');
    expect(charterReading('other', true)).toBe('counted');
    expect(charterReading('unknown')).toBe('sensitivity');
  });

  it('adds no event to the third set', () => {
    expect(Object.keys(THIRD_SET_EVENTS)).toHaveLength(13);
  });
});
