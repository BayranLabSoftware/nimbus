import { describe, expect, it } from 'vitest';
import { _internals } from './populationLookup.js';

const { circleAreaKm2, circleGeoJson, greatCircleM, decodeCell, sumCoarseRaster } = _internals;

describe('populationLookup geometry', () => {
  it('a 178 km circle is just under the WorldPop 100 000 km² allowance', () => {
    expect(circleAreaKm2(178_000)).toBeLessThan(100_000);
    expect(circleAreaKm2(180_000)).toBeGreaterThan(100_000);
  });

  it('the polygon has 49 vertices (closed ring) inside the map', () => {
    const gj = circleGeoJson(25.77, -80.19, 50_000) as {
      features: { geometry: { coordinates: [number, number][][] } }[];
    };
    const ring = gj.features[0]?.geometry.coordinates[0] ?? [];
    expect(ring).toHaveLength(49);
    expect(ring[0]).toEqual(ring[48]);
    for (const [lon, lat] of ring) {
      expect(Math.abs(lon)).toBeLessThanOrEqual(180);
      expect(Math.abs(lat)).toBeLessThanOrEqual(90);
    }
  });

  it('haversine: Rome–Naples ≈ 188 km', () => {
    expect(greatCircleM(41.9, 12.5, 40.85, 14.27)).toBeGreaterThan(180_000);
    expect(greatCircleM(41.9, 12.5, 40.85, 14.27)).toBeLessThan(195_000);
  });

  it('the log-scale cell encoding round-trips within its 7 % quantisation', () => {
    const pMax = 2e7;
    for (const p of [0, 1, 100, 12_345, 1_000_000, 2e7]) {
      const v = Math.min(255, Math.round((255 * Math.log(1 + p)) / Math.log(1 + pMax)));
      const back = decodeCell(v, pMax);
      if (p === 0) expect(back).toBe(0);
      else expect(Math.abs(back - p) / p).toBeLessThan(0.07);
    }
  });

  it('sums coarse cells inside the circle and wraps across the antimeridian', () => {
    // 1° cells, 360 × 180, one person per cell encoded on the log scale.
    const meta = {
      cellDeg: 1,
      nLon: 360,
      nLat: 180,
      minLat: -90,
      maxLat: 90,
      minLon: -180,
      maxLon: 180,
      pMax: 2e7,
      source: 'test',
    };
    const one = Math.round((255 * Math.log(2)) / Math.log(1 + meta.pMax));
    const values = new Uint8Array(360 * 180).fill(one);
    const raster = { meta, values };
    // 250 km circle on the equator ≈ 20 cells of 111 km × 111 km.
    const equator = sumCoarseRaster(raster, 0, 0, 250_000);
    expect(equator).toBeGreaterThan(10);
    expect(equator).toBeLessThan(30);
    // The same circle straddling the antimeridian must count the same cells.
    const dateline = sumCoarseRaster(raster, 0, 179.9, 250_000);
    expect(Math.abs(dateline - equator)).toBeLessThanOrEqual(2);
  });
});

describe('populationLookup polygons', () => {
  const { ringAreaKm2, pointInRing, sumCoarseRasterRing } = _internals;

  it('shoelace area of a 1° × 1° square at the equator ≈ 12 400 km²', () => {
    const ring: [number, number][] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ];
    expect(ringAreaKm2(ring)).toBeGreaterThan(12_000);
    expect(ringAreaKm2(ring)).toBeLessThan(12_800);
  });

  it('ray casting: inside / outside / on the far side', () => {
    const ring: [number, number][] = [
      [10, 40],
      [12, 40],
      [12, 42],
      [10, 42],
      [10, 40],
    ];
    expect(pointInRing(11, 41, ring)).toBe(true);
    expect(pointInRing(13, 41, ring)).toBe(false);
    expect(pointInRing(11, 43, ring)).toBe(false);
  });

  it('a stadium along the coast counts the coastal cells a circle at sea misses', () => {
    // 1° cells; people only on the "coast" column lon ∈ [0, 1).
    const meta = {
      cellDeg: 1,
      nLon: 360,
      nLat: 180,
      minLat: -90,
      maxLat: 90,
      minLon: -180,
      maxLon: 180,
      pMax: 2e7,
      source: 'test',
    };
    const values = new Uint8Array(360 * 180);
    const thousand = Math.round((255 * Math.log(1_001)) / Math.log(1 + meta.pMax));
    for (let r = 0; r < 180; r++) values[r * 360 + 180] = thousand; // lon 0…1
    const raster = { meta, values };
    // A 2°-wide strip along the coast from lat 0 to 5.
    const strip: [number, number][] = [
      [-0.5, 0],
      [1.5, 0],
      [1.5, 5],
      [-0.5, 5],
      [-0.5, 0],
    ];
    const counted = sumCoarseRasterRing(raster, strip);
    expect(counted).toBeGreaterThan(4 * 900);
    expect(counted).toBeLessThan(6 * 1_100);
  });
});

describe('populationLookup sub-cell circles', () => {
  const { sumCoarseRaster } = _internals;
  const meta = {
    cellDeg: 1,
    nLon: 360,
    nLat: 180,
    minLat: -90,
    maxLat: 90,
    minLon: -180,
    maxLon: 180,
    pMax: 2e7,
    source: 'test',
  };
  const thousand = Math.round((255 * Math.log(1_001)) / Math.log(1 + meta.pMax));

  it('a city-scale ring inside one cell is the cell density times the ring area', () => {
    const values = new Uint8Array(360 * 180).fill(thousand);
    const raster = { meta, values };
    // 1.6 km ring in a 111 km cell of 1 000 people: ≈ 0.065 % of the cell.
    const people = sumCoarseRaster(raster, 0.5, 0.5, 1_600);
    const expected = (1_000 * Math.PI * 1.6 ** 2) / 111.2 ** 2;
    expect(people).toBeGreaterThan(expected * 0.85);
    expect(people).toBeLessThan(expected * 1.15);
  });

  it('a ring a few cells wide follows the area, with edge cells counted by their share', () => {
    const values = new Uint8Array(360 * 180).fill(thousand);
    const raster = { meta, values };
    // 150 km ring on the equator: π · 150² / 111.2² ≈ 5.7 cells.
    const people = sumCoarseRaster(raster, 0, 0, 150_000);
    expect(people).toBeGreaterThan(5.7 * 1_000 * 0.9);
    expect(people).toBeLessThan(5.7 * 1_000 * 1.1);
  });
});

describe('populationLookup grid views — land fraction and fine tiles', () => {
  const { sumGridCircle, tilesForBbox, fineView, coarseView } = _internals;
  const meta = {
    cellDeg: 1,
    nLon: 360,
    nLat: 180,
    minLat: -90,
    maxLat: 90,
    minLon: -180,
    maxLon: 180,
    pMax: 2e7,
    source: 'test',
  };
  const thousand = Math.round((255 * Math.log(1_001)) / Math.log(1 + meta.pMax));

  it('a coastal cell spreads its people over its land, not over the sea it also covers', () => {
    const values = new Uint8Array(360 * 180).fill(thousand);
    const allLand = coarseView({ meta, values });
    const halfSea = coarseView({ meta, values, land: new Uint8Array(360 * 180).fill(128) });
    const ring = 1_600;
    const onLand = sumGridCircle(allLand, 0.5, 0.5, ring);
    const onCoast = sumGridCircle(halfSea, 0.5, 0.5, ring);
    expect(onCoast / onLand).toBeGreaterThan(1.9);
    expect(onCoast / onLand).toBeLessThan(2.1);
    // The share never exceeds the whole cell.
    const tiny = coarseView({ meta, values, land: new Uint8Array(360 * 180).fill(1) });
    expect(sumGridCircle(tiny, 0.5, 0.5, 50_000)).toBeLessThanOrEqual(1_000 * 1.07); // one cell, log-quantised
  });

  const index = {
    source: 'fine test',
    cellDeg: 1 / 24,
    tileWidthDeg: 60,
    tileHeightDeg: 30,
    tileCols: 6,
    tileRows: 6,
    tileWidthPx: 1440,
    tileHeightPx: 720,
    pMax: 2e7,
    tiles: ['3_1', '3_2', '3_3', '0_1', '5_1'],
  };

  it('picks the tiles a bounding box touches and wraps across the antimeridian', () => {
    // Naples: lon 14 → col 3, lat 40.8 → row 1.
    expect(tilesForBbox(index, { minLat: 40, maxLat: 41.5, minLon: 13, maxLon: 15 })).toEqual([
      '3_1',
    ]);
    // Straddling the equator: rows 2 (30…0) and 3 (0…−30).
    expect(tilesForBbox(index, { minLat: -2, maxLat: 2, minLon: 10, maxLon: 12 })).toEqual([
      '3_2',
      '3_3',
    ]);
    // Across the antimeridian: columns 5 and 0, only the listed ones.
    expect(tilesForBbox(index, { minLat: 40, maxLat: 45, minLon: 178, maxLon: 182 })).toEqual([
      '5_1',
      '0_1',
    ]);
    // A tile the index does not list holds nobody and is not asked for.
    expect(tilesForBbox(index, { minLat: -80, maxLat: -75, minLon: 10, maxLon: 12 })).toEqual([]);
  });

  it('a fine view reads the right tile cell and counts a ring by area', () => {
    // One tile, uniform 100 people per 2.5′ cell on land.
    const hundred = Math.round((255 * Math.log(101)) / Math.log(1 + index.pMax));
    const tile = {
      values: new Uint8Array(1440 * 720).fill(hundred),
      land: new Uint8Array(1440 * 720).fill(255),
    };
    const view = fineView(index, new Map([['3_1', tile]]));
    // Naples (40.85 N, 14.27 E): row from the top, col from −180.
    const row = Math.floor((90 - 40.85) / index.cellDeg);
    const col = Math.floor((14.27 + 180) / index.cellDeg);
    expect(view.cellAt(row, col).people).toBeGreaterThan(95);
    expect(view.cellAt(row, col).people).toBeLessThan(105);
    // A cell in a tile that is not loaded holds nobody.
    expect(view.cellAt(row + 720, col).people).toBe(0);
    // 50 km ring: π · 50² km² / (4.63 × 3.5 km² per cell at 41 N) cells × 100.
    const cellKm2 = (111.2 / 24) * ((111.2 / 24) * Math.cos((40.85 * Math.PI) / 180));
    const expected = (100 * Math.PI * 50 ** 2) / cellKm2;
    const counted = sumGridCircle(view, 40.85, 14.27, 50_000);
    expect(counted).toBeGreaterThan(expected * 0.95);
    expect(counted).toBeLessThan(expected * 1.05);
  });
});

describe('populationLookup land density', () => {
  const { landDensityAt, coarseView } = _internals;
  const meta = {
    cellDeg: 1,
    nLon: 360,
    nLat: 180,
    minLat: -90,
    maxLat: 90,
    minLon: -180,
    maxLon: 180,
    pMax: 2e7,
    source: 'test',
  };
  const encode = (p: number): number =>
    Math.round((255 * Math.log(1 + p)) / Math.log(1 + meta.pMax));

  it('is people over land in the 3 × 3 neighbourhood, sea cells adding no land', () => {
    // A coast: column lon 0…1 holds 10 000 people on half-land cells,
    // west of it sea (no people, no land), east of it empty land.
    const values = new Uint8Array(360 * 180);
    const land = new Uint8Array(360 * 180);
    for (let r = 0; r < 180; r++) {
      values[r * 360 + 180] = encode(10_000);
      land[r * 360 + 180] = 128; // half land
      land[r * 360 + 181] = 255; // empty land east
      land[r * 360 + 182] = 255;
    }
    const view = coarseView({ meta, values, land });
    const cellKm2 = 111.19 * 111.19 * Math.cos((0.5 * Math.PI) / 180);
    // At the coast cell: 3 rows × (half cell + one land cell) of land, 3 × 10 000 people.
    const atCoast = landDensityAt(view, 0.5, 0.5);
    const expectedCoast = (3 * 10_000) / (3 * (0.5 + 1) * cellKm2);
    expect(atCoast / expectedCoast).toBeGreaterThan(0.9);
    expect(atCoast / expectedCoast).toBeLessThan(1.1);
    // On the sea cell west of the coast the neighbourhood still sees the coast.
    const offshore = landDensityAt(view, 0.5, -0.5);
    expect(offshore).toBeGreaterThan(0);
    expect(offshore).toBeCloseTo((3 * 10_000) / (3 * 0.5 * cellKm2), -1);
    // Far at sea: nobody, no land.
    expect(landDensityAt(view, 0.5, -20)).toBe(0);
  });
});
