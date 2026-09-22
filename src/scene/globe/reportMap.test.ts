import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { IMPACT_PRESETS, simulateImpact } from '../../physics/simulate.js';
import {
  availableImpactLayers,
  buildImpactLayer,
  familyShapes,
  isolinePointAtBearing,
  nominalRangeFromPolar,
} from './impactFieldMap.js';
import {
  aeqdForward,
  aeqdInverse,
  graticuleStep,
  gridSampler,
  isolineInPlane,
  PAPER_GROUND,
  placeCities,
  rasterizeReportMap,
  reportMapBox,
  reportMapDrawing,
  reportMapHalfWidth,
  roundLength,
} from './reportMap.js';

const keyOnly = ((key: string) => key) as unknown as TFunction;
const ctx = { t: keyOnly, language: 'en' };
const meteor = simulateImpact(IMPACT_PRESETS.METEOR_CRATER.input);
const anchor = { latDeg: 35.0275, lonDeg: -111.0225 };

describe("the report's map of an impact (IMP-7c)", () => {
  it('is the azimuthal equidistant plane: distances from the centre are true', () => {
    for (const [lat, lon] of [
      [35.2, -111.65],
      [-33.9, 18.4],
      [60.9, 101.9],
      [35.0275, -111.0225],
    ] as const) {
      const [x, y] = aeqdForward(anchor, lat, lon);
      const back = aeqdInverse(anchor, x, y);
      expect(back.latDeg).toBeCloseTo(lat, 9);
      expect(back.lonDeg).toBeCloseTo(lon, 9);
    }
    // 1° of latitude due north is 111.195 km on the model's sphere.
    const [, north] = aeqdForward(anchor, anchor.latDeg + 1, anchor.lonDeg);
    expect(north / 1_000).toBeCloseTo(111.195, 2);
  });

  it('draws the isolines the globe draws, at the globe’s own bearings', () => {
    const shapes = familyShapes(meteor);
    for (const layer of availableImpactLayers(meteor, ctx)) {
      for (const line of layer.isolines) {
        const shape = shapes[line.family];
        for (const bearing of [0, 45, 133, 270, 359]) {
          const [x, y] = isolineInPlane(shape, line.radiusM, bearing);
          const onSphere = isolinePointAtBearing(anchor, shape, line.radiusM, bearing);
          const [xs, ys] = aeqdForward(anchor, onSphere.latDeg, onSphere.lonDeg);
          expect(Math.hypot(x - xs, y - ys) / line.radiusM).toBeLessThan(1e-5);
          // And the point lies on the level: the nominal radius there is the line's.
          expect(
            nominalRangeFromPolar(shape, Math.hypot(x, y), Math.atan2(x, y)) / line.radiusM
          ).toBeCloseTo(1, 6);
        }
      }
    }
  });

  it('frames the outermost isoline with room to spare, and never past the antipode', () => {
    const blast = buildImpactLayer(meteor, 'overpressure', ctx);
    expect(blast).not.toBeNull();
    if (blast === null) return;
    const half = reportMapHalfWidth(meteor, blast);
    const drawing = reportMapDrawing(meteor, blast, anchor);
    expect(drawing.halfWidthM).toBe(half);
    const reach = Math.max(
      ...drawing.isolines.flatMap((l) =>
        l.points.map(([x, y]) => Math.max(Math.abs(x), Math.abs(y)))
      )
    );
    expect(half).toBeGreaterThan(reach);
    expect(half).toBeLessThan(reach * 1.2);
    const chicxulub = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    const shaking = buildImpactLayer(chicxulub, 'shaking', ctx);
    if (shaking !== null)
      expect(reportMapHalfWidth(chicxulub, shaking)).toBeLessThan(Math.PI * 6_371_000);
  });

  it('paints each pixel with the colour the globe gives its range, over the paper', () => {
    const layer = buildImpactLayer(meteor, 'overpressure', ctx);
    if (layer?.field == null) throw new Error('no field');
    const shape = familyShapes(meteor)[layer.field.family];
    const half = reportMapHalfWidth(meteor, layer);
    const px = 64;
    const data = rasterizeReportMap(layer.field, shape, anchor, half, px, null);
    let checked = 0;
    for (const [qx, py] of [
      [32, 32],
      [40, 30],
      [20, 44],
      [50, 12],
    ] as const) {
      const x = (((qx + 0.5) / px) * 2 - 1) * half;
      const y = (1 - ((py + 0.5) / px) * 2) * half;
      const r = nominalRangeFromPolar(shape, Math.hypot(x, y), Math.atan2(x, y));
      const c = layer.field.colorAt(r);
      const o = (py * px + qx) * 4;
      if (c === null || r > layer.field.maxRangeM) {
        expect([data[o], data[o + 1], data[o + 2]]).toEqual([...PAPER_GROUND.land]);
        continue;
      }
      const a = c[3] / 255;
      const expected = [0, 1, 2].map(
        (k) => (PAPER_GROUND.land[k] ?? 0) * (1 - a) + (c[k] ?? 0) * a
      );
      // The table in the logarithm of the range is 2 048 entries across.
      for (let k = 0; k < 3; k++)
        expect(Math.abs((data[o + k] ?? 0) - (expected[k] ?? 0))).toBeLessThan(3);
      checked += 1;
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('leaves white what lies past the antipode', () => {
    const data = rasterizeReportMap(null, null, anchor, Math.PI * 6_371_000 * 0.98, 16, null);
    expect([data[0], data[1], data[2]]).toEqual([255, 255, 255]);
    const mid = (8 * 16 + 8) * 4;
    expect([data[mid], data[mid + 1], data[mid + 2]]).toEqual([...PAPER_GROUND.land]);
  });

  it('reads people and land off a grid, bilinearly in the logarithm', () => {
    const grid = {
      cellDeg: 1,
      nLon: 360,
      nLat: 180,
      maxLat: 90,
      minLon: -180,
      cellAt: (row: number, col: number) => ({
        people: col === 180 ? 1_000_000 : 0,
        landFraction: row < 90 ? 1 : 0,
      }),
    };
    const sample = gridSampler(grid);
    expect(sample(45.5, 0.5).land).toBeCloseTo(1, 9);
    expect(sample(-45.5, 0.5).land).toBeCloseTo(0, 9);
    expect(sample(45.5, 0.5).density).toBeGreaterThan(50);
    expect(sample(45.5, 30.5).density).toBe(0);
  });

  it('chooses round steps, lengths and boxes', () => {
    expect(graticuleStep(0.9)).toBe(0.2);
    expect(graticuleStep(4.4)).toBe(1);
    expect(roundLength(21_000)).toBe(20_000);
    expect(roundLength(4_900)).toBe(2_000);
    const box = reportMapBox({ latDeg: 10, lonDeg: 179 }, 300_000);
    expect(box.minLon).toBeLessThan(179);
    expect(box.maxLon).toBeGreaterThan(180);
    expect(reportMapBox({ latDeg: 88, lonDeg: 0 }, 400_000)).toMatchObject({
      minLon: -180,
      maxLon: 180,
    });
  });

  it('names the largest cities first, and none over another name or the map’s marks', () => {
    const cities = [
      { name: 'Small', x: 104, y: 100, popMax: 1_000 },
      { name: 'Large', x: 100, y: 100, popMax: 1_000_000 },
      { name: 'Covered', x: 200, y: 200, popMax: 5_000 },
    ];
    const placed = placeCities(cities, 300, [[190, 185, 290, 215]], 5.6);
    expect(placed[0]?.name).toBe('Large');
    expect(placed[0]?.label).not.toBeNull();
    const covered = placed.find((c) => c.name === 'Covered');
    expect(covered?.label === null || (covered?.label?.x ?? 0) < 190).toBe(true);
  });
});
