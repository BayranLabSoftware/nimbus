import { describe, expect, it } from 'vitest';
import { widerJury } from './widerFootprintRules.js';
import {
  JURY_NEEDS_BELOW_SEVEN,
  juryCanSeeSaturation,
  shapeOf,
  wholeAtlasPeakJury,
} from './wholeAtlasPeakRules.js';

describe('rule 466: a jury must be able to see what it is asked about', () => {
  it('refuses the jury that failed last round', () => {
    // Rule 405's 116 admit an earthquake only if its ShakeMap reaches
    // MMI 7, so not one record sits below the saturation the model is
    // accused of. This is the test that would have stopped rules 459 to
    // 464 before they ran.
    const shape = shapeOf(widerJury());
    expect(shape.shareBelowSeven).toBe(0);
    expect(juryCanSeeSaturation(shape)).toBe(false);
  });

  it('accepts the atlas entire, whose criteria never mention intensity', () => {
    const shape = shapeOf(wholeAtlasPeakJury());
    expect(shape.events).toBeGreaterThanOrEqual(1_000);
    expect(shape.shareBelowSeven).toBeGreaterThan(JURY_NEEDS_BELOW_SEVEN);
    // The spread a saturating model cannot hide inside.
    expect(shape.minMmi).toBeLessThan(5);
    expect(shape.medianMmi).toBeLessThan(7);
    expect(shape.maxMmi).toBeGreaterThan(9);
  });

  it('reports the shape it was handed and invents nothing', () => {
    const fake = [3, 5, 7, 9].map((maxMmi, i) => ({ maxMmi, comcat: `e${i.toString()}` }));
    const shape = shapeOf(fake as unknown as Parameters<typeof shapeOf>[0]);
    expect(shape.events).toBe(4);
    expect(shape.minMmi).toBe(3);
    expect(shape.maxMmi).toBe(9);
    expect(shape.medianMmi).toBe(6);
    expect(shape.shareBelowSeven).toBe(0.5);
  });

  it('says nothing about an empty jury rather than passing it', () => {
    const shape = shapeOf([]);
    expect(shape.events).toBe(0);
    expect(juryCanSeeSaturation(shape)).toBe(false);
  });
});

describe('rule 465: the set', () => {
  it('takes every atlas row with a peak, and drops only those without', () => {
    const jury = wholeAtlasPeakJury();
    for (const e of jury) expect(e.maxMmi).toBeGreaterThan(0);
    expect(jury.length).toBeGreaterThanOrEqual(1_000);
  });
});
