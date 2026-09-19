import { describe, expect, it } from 'vitest';
import { strikeDifferenceDeg } from './faultStrikeRules.js';
import {
  MINIMUM_ASPECT_RATIO,
  footprintOrientation,
  intersectionOverUnion,
  type FootprintCell,
} from './strikeAgainstShakemapRules.js';

/**
 * Rules 305 and 307, on shapes whose orientation is known before they are
 * measured. This is the pre-registration of the ShakeMap comparison: no
 * coverage has been fetched and no scenario has been run.
 */

/** A band of cells `lengthDeg` long at a bearing, `widthDeg` across. */
function band(bearingDeg: number, lengthDeg: number, widthDeg: number, lat = 0): FootprintCell[] {
  const cells: FootprintCell[] = [];
  const r = (bearingDeg * Math.PI) / 180;
  const cosLat = Math.cos((lat * Math.PI) / 180);
  for (let s = -lengthDeg / 2; s <= lengthDeg / 2; s += 0.05) {
    for (let t = -widthDeg / 2; t <= widthDeg / 2; t += 0.05) {
      // s along the bearing, t across it.
      const north = s * Math.cos(r) - t * Math.sin(r);
      const east = s * Math.sin(r) + t * Math.cos(r);
      cells.push({
        latitude: lat + north,
        longitude: east / cosLat,
        areaM2: 1_000_000,
      });
    }
  }
  return cells;
}

describe('rules 304 to 307 — asking ShakeMap whether the strike is right', () => {
  it('rule 305: a band points where the band points', () => {
    for (const bearing of [0, 20, 45, 95, 200, 330]) {
      const orientation = footprintOrientation(band(bearing, 4, 0.6));
      expect(orientation).not.toBeNull();
      expect(strikeDifferenceDeg(orientation?.axisDeg ?? 0, bearing)).toBeLessThan(2);
      expect(orientation?.aspectRatio ?? 0).toBeGreaterThan(MINIMUM_ASPECT_RATIO);
    }
  });

  it('rule 305: an axis is undirected, so it never leaves [0, 180)', () => {
    for (const bearing of [0, 45, 95, 200, 330]) {
      const orientation = footprintOrientation(band(bearing, 4, 0.6));
      expect(orientation?.axisDeg ?? -1).toBeGreaterThanOrEqual(0);
      expect(orientation?.axisDeg ?? 999).toBeLessThan(180);
    }
  });

  it('rule 306(a): a round footprint has no orientation to be right about', () => {
    const disc: FootprintCell[] = [];
    for (let dLat = -1; dLat <= 1; dLat += 0.05) {
      for (let dLon = -1; dLon <= 1; dLon += 0.05) {
        if (dLat * dLat + dLon * dLon > 1) continue;
        disc.push({ latitude: dLat, longitude: dLon, areaM2: 1_000_000 });
      }
    }
    const orientation = footprintOrientation(disc);
    expect(orientation).not.toBeNull();
    expect(orientation?.aspectRatio ?? 99).toBeLessThan(MINIMUM_ASPECT_RATIO);
  });

  it('rule 305: cells with no area, and no cells at all, orient nothing', () => {
    expect(footprintOrientation([])).toBeNull();
    expect(footprintOrientation([{ latitude: 0, longitude: 0, areaM2: 0 }])).toBeNull();
  });

  it('rule 305: the centroid and the area are the footprint’s own', () => {
    const cells = band(90, 2, 0.2, 38);
    const orientation = footprintOrientation(cells);
    expect(orientation?.centroid.latitude ?? 0).toBeCloseTo(38, 6);
    expect(orientation?.cells ?? 0).toBe(cells.length);
    expect(orientation?.areaM2 ?? 0).toBeCloseTo(cells.length * 1_000_000, 3);
  });

  it('rule 307(a): agreement is intersection over union', () => {
    const a = new Set(['1', '2', '3']);
    const b = new Set(['2', '3', '4']);
    expect(intersectionOverUnion(a, a)).toBe(1);
    expect(intersectionOverUnion(a, b)).toBeCloseTo(2 / 4, 12);
    expect(intersectionOverUnion(a, new Set(['9']))).toBe(0);
    expect(intersectionOverUnion(new Set(), new Set())).toBeNaN();
  });
});
