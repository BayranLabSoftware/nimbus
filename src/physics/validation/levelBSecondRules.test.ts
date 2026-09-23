import { describe, expect, it } from 'vitest';
import { LEVEL_B_EVENTS } from './levelBProtocolRules.js';
import {
  LEVEL_B2_EVENTS,
  LEVEL_B2_MIN_ENTRY_BODIES,
  LEVEL_B2_OUTCOME,
} from './levelBSecondRules.js';

/**
 * Rules 875 to 880: the second round's sets, frozen before phase 4 writes the
 * physics they will test. Nothing here reads a source of them.
 */
describe('rules 875 to 880: the second round of level B, frozen first', () => {
  it('shares no counted event with the first round', () => {
    for (const [name, set] of Object.entries(LEVEL_B2_EVENTS)) {
      if (set === 'excluded') continue;
      expect(LEVEL_B_EVENTS[name], name).toBeUndefined();
    }
  });

  it('counts a body of the entry and a crater, and keeps the rest conditional or out', () => {
    const of = (set: string): string[] =>
      Object.entries(LEVEL_B2_EVENTS)
        .filter(([, s]) => s === set)
        .map(([name]) => name)
        .sort();
    expect(of('entry')).toEqual(['2022 WJ1']);
    expect(of('entry-conditional')).toEqual(['2024 UQ', '2024 XA1', '2026 RW1']);
    expect(of('crater')).toEqual(['Sterlitamak']);
    expect(LEVEL_B2_MIN_ENTRY_BODIES).toBe(2);
  });

  it('has no outcome before its own step 4', () => {
    expect(LEVEL_B2_OUTCOME).toBeNull();
  });
});
