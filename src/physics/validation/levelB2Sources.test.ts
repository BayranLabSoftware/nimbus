import { describe, expect, it } from 'vitest';
import {
  LEVEL_B2_COUNTED_ENTRY_BODIES,
  LEVEL_B2_DIAGNOSTIC_EVENTS,
  LEVEL_B2_ENTRY_EVENTS,
  LEVEL_B2_ROWS,
  LEVEL_B2_SOURCES,
} from './levelB2Sources.js';
import { LEVEL_B2_EVENTS, LEVEL_B2_MIN_ENTRY_BODIES } from './levelBSecondRules.js';

/** Rules 904, 921, 922 and 925: step 2 of the second round, as pinned. */
describe('level B, second round, step 2: the sources', () => {
  it('writes rule 904’s row for every candidate of rule 876, and no other', () => {
    const candidates = Object.entries(LEVEL_B2_EVENTS)
      .filter(([, set]) => set !== 'excluded')
      .map(([name]) => name)
      .sort();
    expect(LEVEL_B2_ROWS.map((r) => r.event).sort()).toEqual(candidates);
  });

  it('counts only what rule 876 lets it count', () => {
    for (const row of LEVEL_B2_ROWS) {
      const set = LEVEL_B2_EVENTS[row.event];
      if (set === 'entry') expect(row.decision, row.event).toBe('counted');
      if (set === 'entry-conditional') expect(row.decision, row.event).not.toBe('diagnostic');
      if (set === 'crater') expect(['counted', 'diagnostic']).toContain(row.decision);
      expect(row.inCneosSet, row.event).toBe(false);
      expect(row.inPriorsLiterature, row.event).toBe(false);
    }
    const counted = LEVEL_B2_ROWS.filter(
      (r) => r.decision === 'counted' && LEVEL_B2_EVENTS[r.event] !== 'crater'
    );
    expect(counted.map((r) => r.event)).toEqual(LEVEL_B2_ENTRY_EVENTS.map((e) => e.event));
    expect(counted).toHaveLength(LEVEL_B2_COUNTED_ENTRY_BODIES);
    // Rule 876(e): below two counted bodies the round claims no B of the entry.
    expect(LEVEL_B2_COUNTED_ENTRY_BODIES).toBeLessThan(LEVEL_B2_MIN_ENTRY_BODIES);
  });

  it('cites a pinned source for every input and target, and scores nothing diagnostic', () => {
    const ids = new Set(LEVEL_B2_SOURCES.map((s) => s.id));
    for (const event of [...LEVEL_B2_ENTRY_EVENTS, ...LEVEL_B2_DIAGNOSTIC_EVENTS]) {
      for (const input of Object.values(event.inputs)) expect(ids.has(input.source)).toBe(true);
      for (const target of event.targets) expect(ids.has(target.source)).toBe(true);
    }
    for (const event of LEVEL_B2_DIAGNOSTIC_EVENTS) {
      expect(event.targets.every((t) => !t.scored)).toBe(true);
    }
    for (const row of LEVEL_B2_ROWS) {
      if (row.primarySource !== null) expect(ids.has(row.primarySource)).toBe(true);
    }
  });

  it('scores E1 as primary and E3 as secondary for the counted body; E2 dropped with its reason', () => {
    const [wj1] = LEVEL_B2_ENTRY_EVENTS;
    const target = (id: string) => wj1?.targets.find((t) => t.id === id);
    expect(target('E1')?.priority).toBe('primary');
    expect(target('E3')?.priority).toBe('secondary');
    expect(target('E2')?.scored).toBe(false);
  });
});
