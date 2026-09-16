import { describe, expect, it } from 'vitest';
import { _internals } from '../../scene/populationLookup.js';
import {
  chooseRingCount,
  RING_COUNT_BAR,
  RING_COUNT_CANDIDATE_SUBSAMPLES,
  RING_COUNT_RADII_M,
  type RingCountReading,
} from './ringCountRules.js';
import { cellWidthM, exactCircleCount, ringCountCentres } from './ringCountRun.js';
import { shippedCoarseView } from './shippedPopulation.js';

const inside: RingCountReading = {
  scored: 10,
  belowACell: 0,
  medianError: 0.001,
  ninetiethError: 0.01,
  worstError: 0.02,
  meetsBar: true,
};
const outside: RingCountReading = { ...inside, worstError: 0.1, meetsBar: false };

describe('rule 94: the circles', () => {
  it('are built from the raster by a fixed rule, not chosen', () => {
    const view = shippedCoarseView();
    const a = ringCountCentres(view);
    const b = ringCountCentres(view);
    expect(a).toEqual(b);
    expect(a).toHaveLength(28);
    expect(a.map((c) => c.name)).toContain('antimeridian');
    expect(a.map((c) => c.name)).toContain('southern ocean');
    expect(RING_COUNT_RADII_M[0]).toBe(20_000);
    expect(RING_COUNT_RADII_M[RING_COUNT_RADII_M.length - 1]).toBe(5_000_000);
  });

  it('knows a cell’s width, which is narrower where the meridians close', () => {
    const view = shippedCoarseView();
    expect(cellWidthM(view, 70)).toBeLessThan(cellWidthM(view, 0));
    expect(cellWidthM(view, 0)).toBeCloseTo((0.125 * Math.PI * 6_371_000) / 180, 6);
  });
});

describe('rule 95: the exact count', () => {
  it('is the same geometry with a finer sub-grid, and converges', () => {
    const view = shippedCoarseView();
    const at = (n: number): number => exactCircleCount(view, 35.6875, 139.6875, 200_000, n);
    const coarse = at(48);
    const finer = at(96);
    expect(coarse).toBeGreaterThan(1_000_000);
    expect(Math.abs(finer - coarse) / coarse).toBeLessThan(RING_COUNT_BAR / 10);
    // The product's own count is the same function at its own sub-grid.
    expect(_internals.sumGridCircle(view, 35.6875, 139.6875, 200_000)).toBe(
      exactCircleCount(view, 35.6875, 139.6875, 200_000, _internals.CIRCLE_EDGE_SUBSAMPLES)
    );
  });
});

describe('rule 97: the choice', () => {
  it('changes nothing when every circle is already inside the bar', () => {
    const d = chooseRingCount({
      referenceConverged: true,
      inPlace: inside,
      candidate: inside,
      timeFactor: 1,
      gatePasses: true,
    });
    expect(d).toEqual({
      changes: false,
      adopted: false,
      reason: 'every circle is already within the bar (rule 97)',
    });
  });

  it('adopts the finer sub-grid when it works, is affordable and keeps the gate', () => {
    const d = chooseRingCount({
      referenceConverged: true,
      inPlace: outside,
      candidate: inside,
      timeFactor: 1.5,
      gatePasses: true,
    });
    expect(d.changes).toBe(true);
    expect(d.adopted).toBe(true);
    expect(RING_COUNT_CANDIDATE_SUBSAMPLES).toBe(12);
  });

  it('refuses when it costs too much, when it does not work, or when a gated row leaves', () => {
    const base = { referenceConverged: true, inPlace: outside } as const;
    expect(
      chooseRingCount({ ...base, candidate: inside, timeFactor: 9, gatePasses: true }).adopted
    ).toBe(false);
    expect(
      chooseRingCount({ ...base, candidate: outside, timeFactor: 1, gatePasses: true }).adopted
    ).toBe(false);
    const gated = chooseRingCount({
      ...base,
      candidate: inside,
      timeFactor: 1,
      gatePasses: false,
    });
    expect(gated.adopted).toBe(false);
    expect(gated.reason).toContain('gated row');
  });

  it('scores nothing when the reference has not converged', () => {
    const d = chooseRingCount({
      referenceConverged: false,
      inPlace: outside,
      candidate: inside,
      timeFactor: 1,
      gatePasses: true,
    });
    expect(d.changes).toBe(false);
    expect(d.reason).toContain('did not converge');
  });
});
