import { describe, expect, it } from 'vitest';
import { easeTowards, hasSettled, physicalTimeAt } from './casualtyCounterClock.js';

describe('casualtyCounterClock', () => {
  it('maps progress 0 → 0 s and 1 → the end of the sweep', () => {
    expect(physicalTimeAt(0, 600)).toBe(0);
    expect(physicalTimeAt(1, 600)).toBe(600);
    expect(physicalTimeAt(2, 600)).toBe(600);
    expect(physicalTimeAt(0.5, 0)).toBe(0);
  });

  it('is monotonic and gives the first seconds room', () => {
    let previous = 0;
    for (let i = 1; i <= 100; i++) {
      const t = physicalTimeAt(i / 100, 20_000);
      expect(t).toBeGreaterThanOrEqual(previous);
      previous = t;
    }
    // Half the animation covers the first ~2.5 minutes of a 5.5 h sweep.
    expect(physicalTimeAt(0.5, 20_000)).toBeGreaterThan(60);
    expect(physicalTimeAt(0.5, 20_000)).toBeLessThan(300);
  });

  it('eases towards the target and knows when it has arrived', () => {
    let shown = 0;
    for (let i = 0; i < 60; i++) shown = easeTowards(shown, 97_000, 16);
    expect(shown).toBeGreaterThan(96_000);
    expect(hasSettled(shown, 97_000)).toBe(true);
    expect(hasSettled(0, 97_000)).toBe(false);
    expect(hasSettled(0, 0)).toBe(true);
  });
});
