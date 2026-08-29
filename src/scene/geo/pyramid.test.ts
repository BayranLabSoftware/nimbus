import { describe, expect, it } from 'vitest';
import { changedLevels, planPyramid } from './pyramid.js';
import { tileSpanMeters } from './mercator.js';

const ROME = { latitude: 41.9028, longitude: 12.4964 };
const ROME_ANCHOR = { latitude: ROME.latitude, longitude: ROME.longitude };

const base = {
  ...ROME,
  zoomFine: 19,
  zoomCoarse: 6,
  step: 1,
  levels: 16,
  tiles: 2,
};

describe('planPyramid', () => {
  it('runs sharpest first, one step apart', () => {
    const plan = planPyramid(base);
    expect(plan[0]?.zoom).toBe(19);
    expect(plan.map((l) => l.level)).toEqual(plan.map((_, i) => i));
    for (let i = 1; i < plan.length; i++) {
      expect((plan[i - 1]?.zoom ?? 0) - (plan[i]?.zoom ?? 0)).toBe(1);
    }
  });

  it('stops once a level reaches the skyline instead of filling every slot', () => {
    const plan = planPyramid(base);
    expect(plan.at(-1)?.zoom).toBe(6);
    expect(plan.length).toBe(14);
  });

  it('widens the step rather than dropping the far end', () => {
    // Sixteen slots cannot hold z19 down to z1 one at a time.
    const plan = planPyramid({ ...base, zoomCoarse: 1, step: 2 });
    expect(plan.at(-1)?.zoom).toBeLessThanOrEqual(1);
    expect(plan.length).toBeLessThanOrEqual(16);
  });

  it('addresses each block by its own centre, not by the camera', () => {
    // Two camera positions a few metres apart inside the same z19 tile
    // block must produce the identical request, or every frame is a
    // cache miss for the same four tiles.
    const dLat = 1 / 111_320; // one metre
    const a = planPyramid(base);
    const b = planPyramid({ ...base, latitude: ROME.latitude + dLat });
    expect(b[0]?.key).toBe(a[0]?.key);
    expect(b[0]?.latitude).toBe(a[0]?.latitude);
    expect(b[0]?.longitude).toBe(a[0]?.longitude);
  });

  it('moves the sharp level when the camera leaves its block', () => {
    // Half a z19 block at this latitude, in degrees of latitude.
    const jump = (tileSpanMeters(ROME.latitude, 19) * 2) / 111_320;
    const a = planPyramid(base);
    const b = planPyramid({ ...base, latitude: ROME.latitude + jump });
    expect(b[0]?.key).not.toBe(a[0]?.key);
    // ...and leaves the coarse levels exactly where they were: a
    // hundred metres is nothing to a level that spans a thousand
    // kilometres, and re-fetching it would be pure waste.
    expect(b.at(-1)?.key).toBe(a.at(-1)?.key);
  });

  it('never asks for a negative zoom', () => {
    const plan = planPyramid({ ...base, zoomFine: 3, zoomCoarse: 0, step: 1 });
    expect(plan.every((l) => l.zoom >= 0)).toBe(true);
  });
});

describe('changedLevels', () => {
  it('reports only what actually moved', () => {
    const plan = planPyramid(base);
    const loaded = new Map(plan.map((l) => [l.level, l.key]));
    expect(changedLevels(plan, loaded)).toEqual([]);

    loaded.set(0, 'stale');
    expect(changedLevels(plan, loaded).map((l) => l.level)).toEqual([0]);
  });

  it('treats a level that has never loaded as changed', () => {
    const plan = planPyramid(base);
    expect(changedLevels(plan, new Map()).length).toBe(plan.length);
  });
});

describe('per-level anchors', () => {
  it('puts each level over its own anchor', () => {
    // Fine level over the near ground, coarse level 30 km away over
    // the view centre — the map-altitude case that motivated this.
    const far = { latitude: ROME.latitude + 0.27, longitude: ROME.longitude };
    const plan = planPyramid({
      ...base,
      anchors: Array.from({ length: 16 }, (_, i) => (i < 4 ? ROME_ANCHOR : far)),
    });
    const fine = plan[0];
    const coarse = plan.find((l) => l.zoom === 10);
    expect(fine).toBeDefined();
    expect(coarse).toBeDefined();
    if (fine === undefined || coarse === undefined) return;
    expect(Math.abs(fine.latitude - ROME.latitude)).toBeLessThan(0.01);
    // A z10 block is two ~38 km tiles: the centre can sit half a
    // block from the anchor. What matters is that it moved to the far
    // anchor's neighbourhood, thirty kilometres from Rome's.
    expect(Math.abs(coarse.latitude - far.latitude)).toBeLessThan(0.4);
    expect(Math.abs(coarse.latitude - ROME.latitude)).toBeGreaterThan(0.1);
  });

  it('falls back to the request point where anchors run short', () => {
    const plan = planPyramid({ ...base, anchors: [] });
    expect(plan[0]?.key).toBe(planPyramid(base)[0]?.key);
  });
});
