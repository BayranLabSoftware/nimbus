import { describe, expect, it } from 'vitest';
import { LEVEL_B_EVENTS } from './levelBProtocolRules.js';
import {
  LEVEL_B_CONSISTENCY_EVENTS,
  LEVEL_B_CRATER_EVENTS,
  LEVEL_B_ENTRY_EVENTS,
  LEVEL_B_SEEN_EVENTS,
  LEVEL_B_SOURCES,
} from './levelBSources.js';

const ALL = [
  ...LEVEL_B_ENTRY_EVENTS,
  ...LEVEL_B_SEEN_EVENTS,
  ...LEVEL_B_CRATER_EVENTS,
  ...LEVEL_B_CONSISTENCY_EVENTS,
];

/**
 * Step 2 of level B pins the sources. Nothing here runs the model: the
 * predictions are step 3, and a test that ran it now would make them.
 */
describe('level B, step 2: the sources pinned (rules 866 to 874)', () => {
  it('pins each event in its set, each value to a source it names', () => {
    const ids = new Set(LEVEL_B_SOURCES.map((s) => s.id));
    const sets: [readonly { event: string }[], string][] = [
      [LEVEL_B_ENTRY_EVENTS, 'entry'],
      [LEVEL_B_SEEN_EVENTS, 'seen'],
      [LEVEL_B_CRATER_EVENTS, 'crater'],
      [LEVEL_B_CONSISTENCY_EVENTS, 'consistency'],
    ];
    for (const [events, set] of sets)
      for (const e of events) expect(LEVEL_B_EVENTS[e.event], e.event).toBe(set);
    for (const e of ALL) {
      for (const input of Object.values(e.inputs))
        expect(ids.has(input.source), e.event).toBe(true);
      for (const target of e.targets) expect(ids.has(target.source), e.event).toBe(true);
    }
  });

  it('gives every input a well-formed value', () => {
    for (const e of ALL) {
      for (const [name, input] of Object.entries(e.inputs)) {
        const v = input.value;
        if (v.kind === 'normal') expect(v.sigma, `${e.event} ${name}`).toBeGreaterThan(0);
        else if (v.kind === 'fixed') expect(v.value, `${e.event} ${name}`).toBeGreaterThan(0);
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

  it('counts nothing of the rows I2 already read (rule 867)', () => {
    for (const e of LEVEL_B_SEEN_EVENTS)
      for (const t of e.targets) expect(t.scored, `${e.event} ${t.id}`).toBe(false);
  });

  it('ranks every counted target, and counts no target an input was fitted to (rules 860(c) and 868)', () => {
    for (const e of [
      ...LEVEL_B_ENTRY_EVENTS,
      ...LEVEL_B_CRATER_EVENTS,
      ...LEVEL_B_CONSISTENCY_EVENTS,
    ])
      for (const t of e.targets)
        if (t.scored) expect(['primary', 'secondary'], `${e.event} ${t.id}`).toContain(t.priority);
    const carancas = LEVEL_B_CRATER_EVENTS.find((e) => e.event === 'Carancas');
    expect(carancas?.targets.find((t) => t.id === 'K2')?.scored).toBe(false);
    for (const e of LEVEL_B_ENTRY_EVENTS) {
      expect(e.targets.find((t) => t.id === 'E3')?.priority, e.event).toBe('secondary');
      expect(e.targets.find((t) => t.id === 'E3')?.measures, e.event).toMatch(/^compatibility/);
    }
  });

  it('says of every input whether it leans on a scored target (rule 872)', () => {
    const leaning = ALL.flatMap((e) =>
      Object.entries(e.inputs)
        .filter(([, input]) => input.dependsOnTarget)
        .map(([name]) => `${e.event} ${name}`)
    );
    expect(leaning).toEqual(['Carancas diameter']);
  });

  it('widens the angles that are not measurements (rule 869)', () => {
    expect(LEVEL_B_CRATER_EVENTS[0]?.inputs.angle.value).toEqual({
      kind: 'uniform',
      low: 45,
      high: 75,
    });
    expect(LEVEL_B_CONSISTENCY_EVENTS[0]?.inputs.angle.value).toEqual({
      kind: 'sin2theta',
      low: 30,
      high: 75,
    });
  });

  it('pins every event but the development set and 2022 EB5, which no source here reports', () => {
    const pinned = ALL.map((e) => e.event).sort();
    const wanted = Object.entries(LEVEL_B_EVENTS)
      .filter(([name, set]) => set !== 'development' && name !== '2022 EB5')
      .map(([name]) => name)
      .sort();
    expect(pinned).toEqual(wanted);
  });

  it('writes no target value before the predictions (rule 855(3))', () => {
    for (const e of ALL)
      for (const t of e.targets) expect(Object.keys(t).sort()).not.toContain('value');
  });
});
