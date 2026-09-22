import { describe, expect, it } from 'vitest';
import { _internals } from '../../scene/populationLookup.js';
import {
  choosePolygonCount,
  POLYGON_COUNT_BAR,
  POLYGON_COUNT_CANDIDATE_SUBSAMPLES,
  POLYGON_COUNT_SHAPES,
  POLYGON_COUNT_STRIKE_STEP_DEG,
  type PolygonCountReading,
} from './polygonCountRules.js';
import { polygonCountCases, ringOf } from './polygonCountRun.js';
import { shippedCoarseView } from './shippedPopulation.js';

const inside: PolygonCountReading = {
  scored: 30,
  medianError: 0.001,
  ninetiethError: 0.01,
  worstError: 0.02,
  meetsBar: true,
};
const outside: PolygonCountReading = { ...inside, worstError: 0.1, meetsBar: false };

describe('rule 98: the stadiums', () => {
  it('are built by a fixed rule, ten centres by three shapes', () => {
    const view = shippedCoarseView();
    const a = polygonCountCases(view);
    expect(a).toEqual(polygonCountCases(view));
    expect(a).toHaveLength(30);
    expect(new Set(a.map((c) => c.shape.name))).toEqual(
      new Set(POLYGON_COUNT_SHAPES.map((s) => s.name))
    );
    expect(a.map((c) => c.name).some((n) => n.startsWith('antimeridian'))).toBe(true);
    expect(a.map((c) => c.name).some((n) => n.startsWith('70 N'))).toBe(true);
    // No two share an orientation until the strike has been round once.
    expect(a[1]?.strikeDeg).toBe(POLYGON_COUNT_STRIKE_STEP_DEG);
    expect(new Set(a.slice(0, 9).map((c) => c.strikeDeg)).size).toBe(9);
  });

  it('draws each with the very ring the simulator draws', () => {
    const one = polygonCountCases(shippedCoarseView())[0];
    expect(one).toBeDefined();
    if (one === undefined) return;
    const ring = ringOf(one);
    expect(ring.length).toBeGreaterThan(20);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });
});

describe('rule 99: the exact count', () => {
  it('is the same counter with a finer sub-grid, and converges', () => {
    const view = shippedCoarseView();
    const one = polygonCountCases(view)[1];
    expect(one).toBeDefined();
    if (one === undefined) return;
    const ring = ringOf(one);
    const coarse = _internals.sumGridRing(view, ring, 32);
    const finer = _internals.sumGridRing(view, ring, 48);
    expect(coarse).toBeGreaterThan(0);
    expect(Math.abs(finer - coarse) / coarse).toBeLessThan(POLYGON_COUNT_BAR / 10);
    // The product's own count is the same function at its own sub-grid.
    expect(_internals.sumGridRing(view, ring)).toBe(
      _internals.sumGridRing(view, ring, _internals.RING_EDGE_SUBSAMPLES)
    );
  }, 30_000);
});

describe('rule 101: the choice', () => {
  const base = { referenceConverged: true, gatePasses: true } as const;

  it('changes nothing when every polygon is already inside the bar', () => {
    const d = choosePolygonCount({ ...base, inPlace: inside, candidate: inside, timeFactor: 1 });
    expect(d.changes).toBe(false);
    expect(d.reason).toContain('already within the bar');
  });

  it('adopts the finer sub-grid when it works, is affordable and keeps the gate', () => {
    const d = choosePolygonCount({ ...base, inPlace: outside, candidate: inside, timeFactor: 4 });
    expect(d).toMatchObject({ changes: true, adopted: true });
    expect(POLYGON_COUNT_CANDIDATE_SUBSAMPLES).toBe(12);
  });

  it('refuses on cost, on a miss, on a gated row, and scores nothing unconverged', () => {
    expect(
      choosePolygonCount({ ...base, inPlace: outside, candidate: inside, timeFactor: 9 }).adopted
    ).toBe(false);
    expect(
      choosePolygonCount({ ...base, inPlace: outside, candidate: outside, timeFactor: 1 }).adopted
    ).toBe(false);
    const gated = choosePolygonCount({
      referenceConverged: true,
      gatePasses: false,
      inPlace: outside,
      candidate: inside,
      timeFactor: 1,
    });
    expect(gated.adopted).toBe(false);
    expect(gated.reason).toContain('gated row');
    const unconverged = choosePolygonCount({
      referenceConverged: false,
      gatePasses: true,
      inPlace: outside,
      candidate: inside,
      timeFactor: 1,
    });
    expect(unconverged.changes).toBe(false);
    expect(unconverged.reason).toContain('did not converge');
  });
});
