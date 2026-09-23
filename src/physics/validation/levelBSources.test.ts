import { describe, expect, it } from 'vitest';
import { LEVEL_B_EVENTS } from './levelBProtocolRules.js';
import { LEVEL_B_ENTRY_EVENTS, LEVEL_B_SOURCES } from './levelBSources.js';

/**
 * Step 2 of level B pins the sources. Nothing here runs the model: the
 * predictions are step 3, and a test that ran it now would make them.
 */
describe('level B, step 2: the sources pinned (rule 866)', () => {
  it('pins only events of the entry set, each to a source it names', () => {
    const ids = new Set(LEVEL_B_SOURCES.map((s) => s.id));
    for (const e of LEVEL_B_ENTRY_EVENTS) {
      expect(LEVEL_B_EVENTS[e.event], e.event).toBe('entry');
      for (const input of Object.values(e.inputs))
        expect(ids.has(input.source), e.event).toBe(true);
      for (const target of e.targets) expect(ids.has(target.source), e.event).toBe(true);
    }
  });

  it('gives every input a well-formed interval', () => {
    for (const e of LEVEL_B_ENTRY_EVENTS) {
      for (const [name, input] of Object.entries(e.inputs)) {
        const v = input.value;
        if (v.kind === 'normal') expect(v.sigma, `${e.event} ${name}`).toBeGreaterThan(0);
        else expect(v.high, `${e.event} ${name}`).toBeGreaterThan(v.low);
      }
    }
  });

  it('turns 2024 BX1’s brightness into a diameter as rule 866(c) says', () => {
    const bx1 = LEVEL_B_ENTRY_EVENTS.find((e) => e.event === '2024 BX1');
    const d = bx1?.inputs.diameter.value;
    expect(d?.kind).toBe('uniform');
    if (d?.kind !== 'uniform') return;
    // H = 32.84 ± its half-unit, p = 0.50 ± 20 %: 0.463 to 0.570 m.
    expect(d.low).toBeCloseTo(0.4629, 4);
    expect(d.high).toBeCloseTo(0.5695, 4);
  });

  it('scores no altitude the repository already holds (rule 858)', () => {
    const la = LEVEL_B_ENTRY_EVENTS.find((e) => e.event === '2018 LA');
    expect(la?.targets.find((t) => t.id === 'E3')?.scored).toBe(false);
  });

  it('writes no target value before the predictions (rule 855(3))', () => {
    for (const e of LEVEL_B_ENTRY_EVENTS)
      for (const t of e.targets) expect(Object.keys(t).sort()).not.toContain('value');
  });
});
