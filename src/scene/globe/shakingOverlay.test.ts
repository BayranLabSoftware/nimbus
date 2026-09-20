import { describe, expect, it } from 'vitest';
import {
  bandFor,
  edgeReading,
  fieldBounds,
  INTENSITY_BANDS,
  shakingContours,
} from './shakingOverlay.js';
import {
  areaAbove,
  contourRings,
  evaluateShakingField,
  type RuptureFootprint,
} from '../../physics/events/earthquake/shakingField.js';
import {
  EARTHQUAKE_PRESETS,
  intensityLawOf,
  simulateEarthquake,
} from '../../physics/events/earthquake/simulate.js';

/**
 * The join between the field the physics evaluates and the canvas the globe
 * draws on. No globe here: what is tested is that the contours come out
 * where the field says they are, in degrees, and that the fill and the
 * lines cannot disagree about where a band begins.
 */
describe('the shaking overlay', () => {
  /** Tōhoku's own scenario, on rock, so the field is reproducible without
   *  the shipped Vs30 tiles. */
  const result = simulateEarthquake(EARTHQUAKE_PRESETS.TOHOKU_2011.input);
  const law = intensityLawOf(result);
  const rupture: RuptureFootprint = {
    latitude: 38.297,
    longitude: 142.373,
    strikeDeg: 200,
    halfLengthM: (result.ruptureLength as number) / 2,
    halfWidthM: (result.ruptureWidth as number) / 2,
  };
  const field =
    law === null
      ? null
      : evaluateShakingField({
          rupture,
          intensityAt: law,
          siteAt: () => ({ vs30: 760, provenance: 'rock' as const }),
          halfSpanM: rupture.halfLengthM + 2.5 * (result.shaking.mmi7Radius as number),
        });

  it('the bands are ordered and a value lands in exactly one', () => {
    for (const [i, band] of INTENSITY_BANDS.entries()) {
      const next = INTENSITY_BANDS[i + 1];
      if (next !== undefined) expect(next.minValue).toBeGreaterThan(band.minValue);
    }
    expect(bandFor(4.9)).toBeNull();
    expect(bandFor(5)?.label).toBe('V');
    expect(bandFor(7.4)?.label).toBe('VII');
    expect(bandFor(9.99)?.label).toBe('IX');
    expect(bandFor(12)?.label).toBe('X');
  });

  it('draws a contour only where the field reaches that level', () => {
    expect(field).not.toBeNull();
    if (field === null) return;
    let peak = 0;
    for (const v of field.mmi) if (v > peak) peak = v;
    const contours = shakingContours(field);
    expect(contours.length).toBeGreaterThan(0);
    for (const contour of contours) {
      // The report's own rule, applied to the picture: no band is painted at
      // an intensity its event never reached.
      expect(contour.level).toBeLessThanOrEqual(peak);
      expect(contour.rings.length).toBeGreaterThan(0);
      for (const ring of contour.rings) expect(ring.length).toBeGreaterThan(2);
    }
    // And nothing above the peak is drawn at all.
    expect(contours.some((c) => c.level > peak)).toBe(false);
  });

  it('the contours lie inside the field, and the inner ones inside the outer', () => {
    expect(field).not.toBeNull();
    if (field === null) return;
    const bounds = fieldBounds(field);
    expect(bounds.maxLat).toBeGreaterThan(bounds.minLat);
    expect(bounds.maxLon).toBeGreaterThan(bounds.minLon);
    const contours = shakingContours(field);
    const spread = (c: (typeof contours)[number]): number => {
      let lo = 90;
      let hi = -90;
      for (const ring of c.rings)
        for (const p of ring) {
          lo = Math.min(lo, p.latitude);
          hi = Math.max(hi, p.latitude);
          expect(p.latitude).toBeGreaterThanOrEqual(bounds.minLat - 1e-6);
          expect(p.latitude).toBeLessThanOrEqual(bounds.maxLat + 1e-6);
        }
      return hi - lo;
    };
    // A higher intensity cannot cover more ground than a lower one.
    for (const [i, contour] of contours.entries()) {
      const next = contours[i + 1];
      if (next === undefined) continue;
      expect(spread(next)).toBeLessThanOrEqual(spread(contour) + 1e-6);
    }
  });

  /**
   * The straight edge is the lie this guards against.
   *
   * `contourRings` hands back an OPEN ring for a level that runs off the
   * side of the field. Drawing it means closing it, and a closed open ring
   * is a straight line along the side of the box with a right angle at the
   * corner — the most confident-looking boundary on the map, belonging to
   * the box rather than to the ground. So a level that escapes is not drawn
   * at all, and a field wide enough to contain it draws it again.
   */
  it('does not draw a level that runs off the edge of the field', () => {
    const tight = evaluateShakingField({
      rupture,
      intensityAt: law ?? ((): number => 0),
      siteAt: () => ({ vs30: 760, provenance: 'rock' as const }),
      // A third of the way to MMI VII: every band below it escapes.
      halfSpanM: rupture.halfLengthM + (result.shaking.mmi7Radius as number) / 3,
    });
    const edge = edgeReading(tight);
    expect(edge.maxMmi).toBeGreaterThanOrEqual(5);
    const drawn = shakingContours(tight).map((c) => c.level);
    // Nothing at or below what the edge itself reads may be drawn.
    for (const level of drawn) expect(level).toBeGreaterThan(edge.maxMmi);
    // And the level the tight field cuts through is exactly what the wide
    // field draws and this one does not: the rule removes bands, and
    // widening the field brings them back.
    expect(field).not.toBeNull();
    if (field === null) return;
    const wide = shakingContours(field).map((c) => c.level);
    expect(wide.length).toBeGreaterThan(drawn.length);
    for (const level of drawn) expect(wide).toContain(level);
  });

  it('the edge reading looks at the perimeter and nothing else', () => {
    // A field whose interior is hot and whose border is cold: if the
    // reading peeked inside, it would report the interior.
    const n = 5;
    const mmi = new Float32Array(n * n);
    const vs30 = new Float32Array(n * n).fill(760);
    for (let row = 0; row < n; row += 1)
      for (let col = 0; col < n; col += 1) {
        const border = row === 0 || col === 0 || row === n - 1 || col === n - 1;
        mmi[row * n + col] = border ? 3 : 9;
        if (border) vs30[row * n + col] = 200 + col;
      }
    const reading = edgeReading({
      points: n,
      halfSpanM: 1000,
      stepM: 500,
      rupture,
      mmi,
      vs30,
      provenance: { grid: 0, slope: 0, rock: n * n },
      elapsedMs: 0,
    });
    expect(reading.maxMmi).toBe(3);
    expect(reading.minVs30).toBe(200);
  });

  it('every contour carries a label and somewhere to put it', () => {
    expect(field).not.toBeNull();
    if (field === null) return;
    for (const contour of shakingContours(field)) {
      expect(contour.label).toMatch(/^[IVX]+$/);
      expect(contour.labelAt).not.toBeNull();
      expect(contour.css).toContain('rgba');
    }
  });
});

/**
 * The contours and the report must be measuring the same thing.
 *
 * `areaAbove` counts cells whose centre is above a level; `shakingContours`
 * walks marching squares round the same level and hands back polygons. Those
 * are two different arithmetics over one field, and the report quotes the
 * first while the picture shows the second. If they disagree, one of them is
 * lying to a reader — so this holds them together.
 */
describe('the contours agree with the area the report quotes', () => {
  const result = simulateEarthquake(EARTHQUAKE_PRESETS.TOHOKU_2011.input);
  const law = intensityLawOf(result);
  const rupture: RuptureFootprint = {
    latitude: 38.297,
    longitude: 142.373,
    strikeDeg: 200,
    halfLengthM: (result.ruptureLength as number) / 2,
    halfWidthM: (result.ruptureWidth as number) / 2,
  };
  const field =
    law === null
      ? null
      : evaluateShakingField({
          rupture,
          intensityAt: law,
          siteAt: () => ({ vs30: 760, provenance: 'rock' as const }),
          halfSpanM: rupture.halfLengthM + 3 * (result.shaking.mmi7Radius as number),
        });

  /** Signed area of a ring in the field's own frame, by the shoelace. */
  const ringArea = (ring: readonly { x: number; y: number }[]): number => {
    let twice = 0;
    for (let i = 0; i < ring.length; i += 1) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      if (a === undefined || b === undefined) continue;
      twice += a.x * b.y - b.x * a.y;
    }
    return twice / 2;
  };

  it('the polygons enclose the area the cells count, within a cell of it', () => {
    expect(field).not.toBeNull();
    if (field === null) return;
    for (const level of [7, 8]) {
      const cells = areaAbove(field, level);
      if (cells === 0) continue;
      // The rings come back in the frame, before any projection: compare
      // there, so nothing in this test depends on the map projection.
      const rings = contourRings(field, level);
      const polygons = rings.reduce((sum, ring) => sum + Math.abs(ringArea(ring)), 0);
      // One row of cells around a perimeter is the honest tolerance between
      // "centre is above" and "the line the corners interpolate to".
      const perimeterSlack = 4 * Math.sqrt(cells) * field.stepM;
      expect(Math.abs(polygons - cells)).toBeLessThanOrEqual(perimeterSlack);
    }
  });
});
