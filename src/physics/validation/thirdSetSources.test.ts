import { describe, expect, it } from 'vitest';
import { THIRD_SET_EVENTS } from './levelBThirdSetRules.js';
import {
  THIRD_SET_BODIES,
  THIRD_SET_NOT_ADMITTED,
  THIRD_SET_SOURCES,
  thirdSetCounts,
} from './thirdSetSources.js';

describe('rule 1122: every candidate of rule 941 admitted or kept with its reason', () => {
  it('covers the set’s entry bodies, none added', () => {
    const candidates = Object.entries(THIRD_SET_EVENTS)
      .filter(([, role]) => role !== 'excluded')
      .map(([name]) => name)
      .sort();
    const read = [
      ...THIRD_SET_BODIES.map((b) => b.event),
      ...THIRD_SET_NOT_ADMITTED.map((b) => b.event),
    ].sort();
    expect(read).toEqual(candidates);
    expect(THIRD_SET_NOT_ADMITTED.map((b) => b.event).sort()).toEqual(['Arpu Kuilpu', 'Kindberg']);
  });

  it('cites a pinned source for every value', () => {
    const ids = new Set(THIRD_SET_SOURCES.map((s) => s.id));
    for (const b of THIRD_SET_BODIES)
      for (const input of Object.values(b.inputs)) expect(ids.has(input.source)).toBe(true);
    for (const b of THIRD_SET_NOT_ADMITTED) expect(ids.has(b.source)).toBe(true);
  });
});

describe('rule 1121: the intervals', () => {
  it('are well formed, and O1’s holds the principal flares', () => {
    for (const b of THIRD_SET_BODIES) {
      for (const { value } of Object.values(b.inputs)) {
        if (value.kind === 'uniform') expect(value.low).toBeLessThan(value.high);
        if (value.kind === 'normal') expect(value.sigma).toBeGreaterThan(0);
      }
      const [lo, hi] = b.o1.intervalKm;
      expect(lo).toBeLessThan(hi);
    }
  });

  it('turns a mass into a diameter through the source’s density (Madura Cave)', () => {
    const madura = THIRD_SET_BODIES.find((b) => b.event === 'Madura Cave');
    const d = madura?.inputs.diameter.value;
    expect(d?.kind).toBe('uniform');
    if (d?.kind !== 'uniform') return;
    expect(d.low).toBeCloseTo(0.251, 3);
    expect(d.high).toBeCloseTo(0.352, 3);
  });
});

describe('rule 1123: the table of eligibility', () => {
  it('counts five bodies in the priors’ domain for O1 and the ground outcome', () => {
    expect(thirdSetCounts()).toEqual({
      o1: 5,
      recovery: 5,
      noCrater: 5,
      regime: 0,
      o3: 1,
      counted: 5,
    });
  });

  it('keeps Winchcombe a control, and every largest mass a lower bound', () => {
    const winchcombe = THIRD_SET_BODIES.find((b) => b.event === 'Winchcombe');
    expect(winchcombe?.reading).toBe('robustnessControl');
    expect(THIRD_SET_BODIES.every((b) => b.o2.class === 'lowerBound')).toBe(true);
  });
});

describe('rule 1125: the table made precise before any prediction', () => {
  it('says for every body which peaks enter O1 and why, the ends unmoved', () => {
    for (const b of THIRD_SET_BODIES) expect(b.o1.selection.length).toBeGreaterThan(40);
    const golden = THIRD_SET_BODIES.find((b) => b.event === 'Golden');
    expect(golden?.o1.intervalKm).toEqual([29.5, 34.5]);
    const traspena = THIRD_SET_BODIES.find((b) => b.event === 'Traspena');
    expect(traspena?.o1.intervalKm).toEqual([28.535, 35.325]);
  });

  it('keeps Hamburg’s angle from the horizontal, its ambiguity on record', () => {
    const hamburg = THIRD_SET_BODIES.find((b) => b.event === 'Hamburg');
    expect(hamburg?.inputs.angle.value).toEqual({ kind: 'normal', mean: 66.14, sigma: 0.29 });
    expect(hamburg?.recorded?.[0]).toContain('editorial ambiguity');
  });
});
