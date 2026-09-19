import { describe, expect, it } from 'vitest';
import {
  areaAbove,
  contourRings,
  evaluateShakingField,
  frameDistanceM,
  frameToGeographic,
  type RuptureFootprint,
} from './shakingField.js';
import { intensityLawOf, simulateEarthquake } from './simulate.js';

/**
 * Rules 309 and 312 on fields whose answer is known in advance: a law that is
 * a straight line in distance, ground that is uniform, and a rupture whose
 * geometry gives the contour analytically.
 */

const POINT: RuptureFootprint = {
  latitude: 35,
  longitude: 139,
  strikeDeg: 0,
  halfLengthM: 0,
  halfWidthM: 0,
};

/** A law that falls by one unit every 10 km and ignores the site. */
const linear = (distanceM: number): number => 10 - distanceM / 10_000;

/** Ground that is the same everywhere. */
const rock = () => ({ vs30: 760, provenance: 'rock' as const });

describe('rule 309 — the field', () => {
  it('puts a point of the grid on the epicentre, and the frame is metric', () => {
    const field = evaluateShakingField({
      rupture: POINT,
      intensityAt: linear,
      siteAt: rock,
      halfSpanM: 100_000,
      points: 101,
    });
    const middle = (field.points - 1) / 2;
    expect(field.mmi[middle * field.points + middle]).toBeCloseTo(10, 6);
    expect(field.stepM).toBeCloseTo(2_000, 6);
    // …and a point 50 km along the strike is 50 km away.
    expect(frameDistanceM(POINT, { x: 50_000, y: 0 })).toBeCloseTo(50_000, 6);
  });

  it('measures a rupture’s Joyner–Boore distance, which is zero on it', () => {
    const extended: RuptureFootprint = { ...POINT, halfLengthM: 100_000, halfWidthM: 30_000 };
    expect(frameDistanceM(extended, { x: 0, y: 0 })).toBe(0);
    expect(frameDistanceM(extended, { x: 90_000, y: 20_000 })).toBe(0);
    expect(frameDistanceM(extended, { x: 150_000, y: 0 })).toBeCloseTo(50_000, 6);
    expect(frameDistanceM(extended, { x: 0, y: -50_000 })).toBeCloseTo(20_000, 6);
    // The corner is a corner, not a cross.
    expect(frameDistanceM(extended, { x: 130_000, y: 70_000 })).toBeCloseTo(
      Math.hypot(30_000, 40_000),
      6
    );
  });

  it('places the frame on the sphere: x along the strike, y to its right', () => {
    const east: RuptureFootprint = { ...POINT, strikeDeg: 90 };
    const ahead = frameToGeographic(east, { x: 111_195, y: 0 });
    // A great circle leaving east from 35°N bends towards the equator: a degree
    // along it loses six thousandths of a degree of latitude, and that is the
    // sphere and not a defect.
    expect(ahead.latitude).toBeCloseTo(35, 1);
    expect(ahead.latitude).toBeLessThan(35);
    expect(ahead.longitude).toBeGreaterThan(139);
    const right = frameToGeographic(east, { x: 0, y: 111_195 });
    expect(right.latitude).toBeLessThan(35);
    expect(right.longitude).toBeCloseTo(139, 1);
  });

  it('rule 312: on uniform ground a point source contours to a circle', () => {
    const field = evaluateShakingField({
      rupture: POINT,
      intensityAt: linear,
      siteAt: rock,
      halfSpanM: 100_000,
      points: 201,
    });
    // The law reaches MMI 7 at exactly 30 km.
    const rings = contourRings(field, 7);
    expect(rings.length).toBe(1);
    const ring = rings[0] ?? [];
    for (const p of ring) {
      expect(Math.hypot(p.x, p.y)).toBeGreaterThan(29_000);
      expect(Math.hypot(p.x, p.y)).toBeLessThan(31_000);
    }
    // …and its area is the circle's, within a cell.
    expect(areaAbove(field, 7) / (Math.PI * 30_000 ** 2)).toBeGreaterThan(0.97);
    expect(areaAbove(field, 7) / (Math.PI * 30_000 ** 2)).toBeLessThan(1.03);
  });

  it('rule 312: an extended rupture contours to a stadium', () => {
    const extended: RuptureFootprint = { ...POINT, halfLengthM: 60_000, halfWidthM: 10_000 };
    const field = evaluateShakingField({
      rupture: extended,
      intensityAt: linear,
      siteAt: rock,
      halfSpanM: 150_000,
      points: 201,
    });
    const rings = contourRings(field, 7);
    expect(rings.length).toBe(1);
    for (const p of rings[0] ?? []) {
      expect(frameDistanceM(extended, p)).toBeGreaterThan(28_000);
      expect(frameDistanceM(extended, p)).toBeLessThan(32_000);
    }
  });

  it('rule 309: soft ground pushes the contour out on that side, and only there', () => {
    // The law now carries a site term: a lower Vs30 raises the intensity.
    const withSite = (distanceM: number, vs30: number): number =>
      10 - distanceM / 10_000 + Math.log(760 / vs30);
    const field = evaluateShakingField({
      rupture: POINT,
      intensityAt: withSite,
      // Soft basin east of the epicentre (y > 0 is to the right of a strike of
      // 0°, which is east).
      siteAt: (_lat, lon) => ({ vs30: lon > 139 ? 200 : 760, provenance: 'grid' as const }),
      halfSpanM: 120_000,
      points: 201,
    });
    const rings = contourRings(field, 7);
    const ring = rings.flat();
    const east = ring.filter((p) => p.y > 20_000);
    const west = ring.filter((p) => p.y < -20_000);
    const reach = (ps: typeof ring): number =>
      ps.reduce((best, p) => Math.max(best, Math.hypot(p.x, p.y)), 0);
    expect(reach(east)).toBeGreaterThan(reach(west) * 1.2);
    expect(field.provenance.grid).toBe(201 * 201);
  });

  it('rule 314(c): a real scenario’s field is evaluated inside the budget', () => {
    const result = simulateEarthquake({ magnitude: 7.5, depth: 15_000 } as Parameters<
      typeof simulateEarthquake
    >[0]);
    const field = evaluateShakingField({
      rupture: {
        latitude: 35,
        longitude: 139,
        strikeDeg: 200,
        halfLengthM: (result.ruptureLength as number) / 2,
        halfWidthM: (result.ruptureWidth as number) / 2,
      },
      intensityAt: intensityLawOf(result) ?? (() => Number.NaN),
      siteAt: rock,
      halfSpanM: 300_000,
    });
    expect(field.points).toBe(257);
    // The budget is 250 ms; this is the same arithmetic the browser would do.
    expect(field.elapsedMs).toBeLessThan(250);
    expect(contourRings(field, 7).length).toBeGreaterThan(0);
  });
});
