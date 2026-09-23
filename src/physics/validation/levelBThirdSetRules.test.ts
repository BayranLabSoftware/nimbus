import { describe, expect, it } from 'vitest';
import { LEVEL_B_EVENTS } from './levelBProtocolRules.js';
import { LEVEL_B2_EVENTS } from './levelBSecondRules.js';
import { FIREBALL_EVENTS } from './fireballSetData.js';
import {
  THIRD_SET_DATES,
  THIRD_SET_EVENTS,
  THIRD_SET_GROUND_CASES,
  THIRD_SET_MIN_ENTRY_BODIES,
  THIRD_SET_MIN_GROUND_CASES,
} from './levelBThirdSetRules.js';

/** Rules 933 to 944: the third set, frozen before the model it judges. */
describe('rules 933 to 944: the third set', () => {
  const kept = Object.entries(THIRD_SET_EVENTS)
    .filter(([, role]) => role !== 'excluded')
    .map(([name]) => name);

  it('shares no event with level B’s first and second rounds', () => {
    for (const name of kept) {
      expect(LEVEL_B_EVENTS[name], name).toBeUndefined();
      expect(LEVEL_B2_EVENTS[name], name).toBeUndefined();
    }
  });

  it('holds no day of I2’s CNEOS fireballs (rule 936)', () => {
    const days = new Set(FIREBALL_EVENTS.map((e) => e.date.slice(0, 10)));
    for (const name of kept) {
      const date = THIRD_SET_DATES[name];
      expect(date, name).toBeDefined();
      expect(days.has(date ?? ''), name).toBe(false);
    }
    // Ådalen, excluded, is one of them.
    expect(days.has('2020-11-07')).toBe(true);
  });

  it('holds enough entry bodies to ask, but no ground case yet (rule 941(c))', () => {
    const entry = kept.filter((n) => THIRD_SET_EVENTS[n] === 'entry');
    expect(entry.length).toBeGreaterThanOrEqual(THIRD_SET_MIN_ENTRY_BODIES);
    expect(THIRD_SET_GROUND_CASES.length).toBeLessThan(THIRD_SET_MIN_GROUND_CASES);
  });
});
