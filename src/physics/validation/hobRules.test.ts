import { describe, expect, it } from 'vitest';
import { DEFAULT_HOB_BLAST_SOURCE, DEFAULT_WATER_BLAST_SOURCE } from '../events/explosion/hob.js';
import {
  HOB_CANDIDATE,
  HOB_GUARD_HEIGHTS_M,
  HOB_GUARD_YIELDS_KT,
  HOB_IN_PLACE,
  HOB_NUKEMAP_KEPT,
  HOB_WATERLINE_TOLERANCE,
  chooseHobBlastSource,
  waterlinePasses,
} from './hobRules.js';
import { hobTracePasses } from './hobRun.js';

describe('rules 168 to 173: an air burst drawn from the book', () => {
  it('names the factor in place and the curves as the candidate', () => {
    expect(HOB_IN_PLACE).toBe('project');
    expect(HOB_CANDIDATE).toBe('glasstone1977');
  });

  it('runs its guard from a ton to fifty megatons and from the ground to thirty kilometres', () => {
    expect(HOB_GUARD_YIELDS_KT[0]).toBe(0.001);
    expect(HOB_GUARD_YIELDS_KT[HOB_GUARD_YIELDS_KT.length - 1]).toBe(50_000);
    expect(HOB_GUARD_HEIGHTS_M[0]).toBe(0);
    expect(HOB_GUARD_HEIGHTS_M[HOB_GUARD_HEIGHTS_M.length - 1]).toBeLessThan(30_000);
  });

  it('carries the five NUKEMAP rings the campaign kept, all at 1 psi', () => {
    expect(HOB_NUKEMAP_KEPT).toHaveLength(5);
    expect(HOB_NUKEMAP_KEPT.every((k) => k.psi === 1)).toBe(true);
  });

  it('has a trace that passes its own checks', () => {
    expect(hobTracePasses()).toBe(true);
  });

  it('adopts only when every guard holds', () => {
    const clean = { cases: 288, notFinite: 0, outOfOrder: 0, shrinksWithYield: 0 };
    expect(
      chooseHobBlastSource({ traceChecksPass: true, releaseGatePasses: true, guard: clean })
    ).toBe('glasstone1977');
    expect(
      chooseHobBlastSource({ traceChecksPass: false, releaseGatePasses: true, guard: clean })
    ).toBe('project');
    expect(
      chooseHobBlastSource({ traceChecksPass: true, releaseGatePasses: false, guard: clean })
    ).toBe('project');
    expect(
      chooseHobBlastSource({
        traceChecksPass: true,
        releaseGatePasses: true,
        guard: { ...clean, shrinksWithYield: 1 },
      })
    ).toBe('project');
  });

  it('is the default since rule 171 adopted it', () => {
    // Pushed in 7aeac70 with the default still 'project'.
    expect(DEFAULT_HOB_BLAST_SOURCE).toBe('glasstone1977');
  });
});

describe('rules 174 to 176: a burst in the water, from the same curves', () => {
  it('allows no step across the waterline beyond the depth factor', () => {
    expect(HOB_WATERLINE_TOLERANCE).toBe(1e-6);
    expect(waterlinePasses(0)).toBe(true);
    expect(waterlinePasses(0.12)).toBe(false);
    expect(waterlinePasses(Number.NaN)).toBe(false);
  });

  it('is the default since rule 176 adopted it', () => {
    // Pushed in fb0e2f7 with the default still 'surfaceRelation'.
    expect(DEFAULT_WATER_BLAST_SOURCE).toBe('glasstone1977');
  });
});
