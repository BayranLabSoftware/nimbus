import { describe, expect, it } from 'vitest';
import {
  FIELD_BUDGET_MS,
  FIELD_GRID_POINTS,
  SHAPE_MINIMUM_IMPROVED,
  USGS_VS30,
  VS30_CELL_DEG,
  VS30_DATA_BUDGET,
  WORST_RATIO_REGRESSION,
} from './shakingFieldRules.js';
import { SHAKEMAP_FOOTPRINTS } from './shakemapFixtures.js';

/**
 * Rules 309 to 315 as they stand before the candidate: the set they are decided
 * on, the lattice they stand on, and the budgets they are held to. No field has
 * been evaluated and no Vs30 tile has been read.
 */

describe('rules 309 to 315 — the ground under the whole footprint', () => {
  it('rule 314: the set is the published one already in the repository', () => {
    expect(SHAKEMAP_FOOTPRINTS.length).toBe(6);
    expect(SHAPE_MINIMUM_IMPROVED).toBeLessThanOrEqual(SHAKEMAP_FOOTPRINTS.length);
    // Every row carries a published MMI VII area to be measured against, and an
    // event id to trace it back to.
    for (const row of SHAKEMAP_FOOTPRINTS) {
      expect(row.eventId.length).toBeGreaterThan(0);
      expect(row.areaKm2[7]).toBeGreaterThanOrEqual(0);
    }
    // …and at least four of them actually reached MMI VII, or there would be
    // no areas to compare.
    expect(SHAKEMAP_FOOTPRINTS.filter((r) => r.areaKm2[7] > 0).length).toBeGreaterThanOrEqual(4);
  });

  it('rule 312: the grid is odd, so a point sits on the epicentre', () => {
    expect(FIELD_GRID_POINTS % 2).toBe(1);
    expect(FIELD_GRID_POINTS).toBeGreaterThan(64);
  });

  it('rule 310: the ground is the grid ShakeMap itself reads, and it says where it stops', () => {
    expect(USGS_VS30.url).toContain('global_vs30.grd');
    expect(USGS_VS30.coverage.atSea).toBe(false);
    expect(USGS_VS30.coverage.minLatitude).toBe(-56);
    expect(USGS_VS30.coverage.maxLatitude).toBe(84);
    expect([...USGS_VS30.regionalMaps]).toContain('Japan');
    // The lattice is the population's, so one cell of ground answers for one
    // cell of people.
    expect(VS30_CELL_DEG).toBeCloseTo(2.5 / 60, 12);
  });

  it('rule 314(c): the budget is set against what was built, before it is spent', () => {
    // 30 tiles, 7.0 MB in all, 831 kB the largest — counted before this bound
    // was written and named in the head of the rules file.
    expect(7_230_658).toBeLessThan(VS30_DATA_BUDGET.totalBytes);
    expect(830_915).toBeLessThan(VS30_DATA_BUDGET.perTileBytes);
    expect(FIELD_BUDGET_MS).toBeLessThanOrEqual(250);
  });

  it('rule 314(a): a ratio may not be traded away to lift a median', () => {
    expect(WORST_RATIO_REGRESSION).toBeGreaterThan(1);
    expect(WORST_RATIO_REGRESSION).toBeLessThan(2);
  });
});
