import { describe, expect, it } from 'vitest';
import { bandFor, fieldBounds, INTENSITY_BANDS, shakingContours } from './shakingOverlay.js';
import {
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
