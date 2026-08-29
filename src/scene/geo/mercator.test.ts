import { describe, expect, it } from 'vitest';
import {
  EQUATORIAL_CIRCUMFERENCE_M,
  MERCATOR_MAX_LAT,
  geoToMosaicUV,
  greatCircleDistance,
  inverseMercatorY,
  localToGeo,
  lonLatToTile,
  mercatorY,
  tileBlockAround,
  tileSpanMeters,
  zoomForTexel,
  tileToLonLat,
  zoomForSpan,
} from './mercator.js';

describe('Web Mercator projection', () => {
  it('puts the origin at the centre of the zoom-0 tile', () => {
    const t = lonLatToTile(0, 0, 0);
    expect(t.x).toBeCloseTo(0.5, 12);
    expect(t.y).toBeCloseTo(0.5, 12);
  });

  it('puts the antimeridian and the cut-off latitude on the grid corners', () => {
    const nw = lonLatToTile(-180, MERCATOR_MAX_LAT, 4);
    expect(nw.x).toBeCloseTo(0, 9);
    expect(nw.y).toBeCloseTo(0, 6);
    const se = lonLatToTile(180, -MERCATOR_MAX_LAT, 4);
    expect(se.x).toBeCloseTo(16, 9);
    expect(se.y).toBeCloseTo(16, 6);
  });

  it('round-trips tile → lon/lat → tile', () => {
    for (const z of [3, 8, 14]) {
      const ll = tileToLonLat(11, 7, z);
      const back = lonLatToTile(ll.lon, ll.lat, z);
      expect(back.x).toBeCloseTo(11, 6);
      expect(back.y).toBeCloseTo(7, 6);
    }
  });

  it('mercatorY inverts exactly', () => {
    for (const lat of [-84, -30, 0, 21.4, 45, 84]) {
      expect(inverseMercatorY(mercatorY(lat))).toBeCloseTo(lat, 9);
    }
  });

  it('clamps beyond the Mercator cut-off instead of returning infinity', () => {
    expect(Number.isFinite(mercatorY(90))).toBe(true);
    expect(Number.isFinite(mercatorY(-90))).toBe(true);
  });
});

describe('tile spans and zoom selection', () => {
  it('gives the full equator at zoom 0', () => {
    expect(tileSpanMeters(0, 0)).toBeCloseTo(EQUATORIAL_CIRCUMFERENCE_M, 3);
  });

  it('halves the span for every zoom level', () => {
    const a = tileSpanMeters(35, 12);
    const b = tileSpanMeters(35, 13);
    expect(a / b).toBeCloseTo(2, 12);
  });

  it('picks a zoom whose block actually covers the requested span', () => {
    for (const [lat, spanKm, tiles] of [
      [35.03, 16, 8],
      [37.1, 47, 6],
      [21.4, 2915, 5],
      [0, 100, 4],
    ] as const) {
      const z = zoomForSpan(lat, spanKm * 1_000, tiles);
      expect(tiles * tileSpanMeters(lat, z)).toBeGreaterThanOrEqual(spanKm * 1_000);
      // and one level sharper would NOT cover it — i.e. it is the best fit
      expect(tiles * tileSpanMeters(lat, z + 1)).toBeLessThan(spanKm * 1_000);
    }
  });

  it('never returns a negative or absurd zoom', () => {
    expect(zoomForSpan(0, 1e12, 1)).toBe(0);
    expect(zoomForSpan(0, 0, 4)).toBe(0);
    expect(zoomForSpan(45, 1, 1, 16)).toBe(16);
  });
});

describe('tileBlockAround', () => {
  it('brackets the requested point inside its bounds', () => {
    const b = tileBlockAround(-111.0225, 35.0272, 14, 8);
    expect(b.bounds.lonWest).toBeLessThan(-111.0225);
    expect(b.bounds.lonEast).toBeGreaterThan(-111.0225);
    expect(b.bounds.latSouth).toBeLessThan(35.0272);
    expect(b.bounds.latNorth).toBeGreaterThan(35.0272);
  });

  it('covers roughly the expected ground span', () => {
    const b = tileBlockAround(-111.0225, 35.0272, 14, 8);
    const span = 8 * tileSpanMeters(35.0272, 14);
    expect(span / 1_000).toBeGreaterThan(12);
    expect(span / 1_000).toBeLessThan(20);
    expect(b.tiles).toBe(8);
  });

  it('clamps at the grid edge rather than requesting a negative tile', () => {
    const b = tileBlockAround(-179.9, 84.9, 3, 4);
    expect(b.x0).toBeGreaterThanOrEqual(0);
    expect(b.y0).toBeGreaterThanOrEqual(0);
    expect(b.x0 + b.tiles).toBeLessThanOrEqual(8);
    expect(b.y0 + b.tiles).toBeLessThanOrEqual(8);
  });
});

describe('geoToMosaicUV', () => {
  const block = tileBlockAround(-89.5, 21.4, 6, 5);

  it('maps the block corners to (0,0) and (1,1)', () => {
    const nw = geoToMosaicUV(block.bounds.lonWest, block.bounds.latNorth, block.bounds);
    const se = geoToMosaicUV(block.bounds.lonEast, block.bounds.latSouth, block.bounds);
    expect(nw.u).toBeCloseTo(0, 9);
    expect(nw.v).toBeCloseTo(0, 9);
    expect(se.u).toBeCloseTo(1, 9);
    expect(se.v).toBeCloseTo(1, 9);
  });

  it('is NOT linear in latitude — that is the point of the Mercator v', () => {
    const midLat = (block.bounds.latNorth + block.bounds.latSouth) / 2;
    const uv = geoToMosaicUV(-89.5, midLat, block.bounds);
    // A linear-in-latitude mapping would give exactly 0.5; Mercator does not.
    expect(uv.v).not.toBeCloseTo(0.5, 5);
    expect(uv.v).toBeGreaterThan(0.45);
    expect(uv.v).toBeLessThan(0.55);
  });
});

describe('localToGeo', () => {
  it('is the identity at the origin', () => {
    const g = localToGeo(0, 0, 35.0272, -111.0225);
    expect(g.lat).toBeCloseTo(35.0272, 12);
    expect(g.lon).toBeCloseTo(-111.0225, 12);
  });

  it('agrees with the geodesic to better than 0.1 % across a scene-sized frame', () => {
    // The local frame is a tangent plane, so it CANNOT match the
    // geodesic exactly — the residual is the honest cost of working in
    // flat metres near ground zero. Pin the relative error, not an
    // absolute one: at 23 km the gap is ~12 m (0.05 %), well under a
    // pixel at any camera distance the renderer uses, and the bound
    // makes a future regression to a cruder mapping visible.
    const lat0 = 37.1;
    const lon0 = -116.05;
    for (const [e, n] of [
      [5_000, 0],
      [0, 5_000],
      [-20_000, 12_000],
    ] as const) {
      const g = localToGeo(e, n, lat0, lon0);
      const d = greatCircleDistance(lat0, lon0, g.lat, g.lon);
      const expected = Math.hypot(e, n);
      expect(Math.abs(d - expected) / expected).toBeLessThan(1e-3);
    }
  });

  it('degrades gracefully rather than silently over a continental frame', () => {
    // Chicxulub's frame is ~1 500 km across. The tangent plane is
    // measurably wrong there; the test records HOW wrong so nobody
    // later mistakes the mapping for a geodesic one.
    const g = localToGeo(700_000, 700_000, 21.4, -89.5);
    const d = greatCircleDistance(21.4, -89.5, g.lat, g.lon);
    const expected = Math.hypot(700_000, 700_000);
    expect(Math.abs(d - expected) / expected).toBeLessThan(0.02);
  });

  it('takes the longitude scale at the destination latitude', () => {
    // 500 km north of 60°N the meridians have converged noticeably; a
    // mapping that used cos(lat0) would place the point too far east.
    const naive = -20 + 200_000 / (((Math.PI * 6_371_008) / 180) * Math.cos((60 * Math.PI) / 180));
    const actual = localToGeo(200_000, 500_000, 60, -20).lon;
    expect(actual).toBeGreaterThan(naive);
  });
});

describe('greatCircleDistance — haversine, not acos(dot)', () => {
  it('is accurate at short range where acos(dot) collapses', () => {
    // 100 m north. The renderer measures distances like this on most
    // pixels; the acos form quantises here in 32-bit arithmetic.
    const d = greatCircleDistance(
      35.0272,
      -111.0225,
      35.0272 + 100 / ((Math.PI * 6_371_008) / 180),
      -111.0225
    );
    expect(d).toBeCloseTo(100, 3);
  });

  it('gives a quarter circumference from equator to pole', () => {
    const d = greatCircleDistance(0, 0, 90, 0);
    expect(d).toBeCloseTo((Math.PI / 2) * 6_371_008, 0);
  });

  it('is symmetric and zero for coincident points', () => {
    expect(greatCircleDistance(21.4, -89.5, 21.4, -89.5)).toBe(0);
    expect(greatCircleDistance(10, 20, -30, 40)).toBeCloseTo(
      greatCircleDistance(-30, 40, 10, 20),
      9
    );
  });

  it('never exceeds half the circumference', () => {
    const antipodal = greatCircleDistance(0, 0, 0, 180);
    expect(antipodal).toBeCloseTo(Math.PI * 6_371_008, 0);
  });
});

describe('tileBlockAround at world scale', () => {
  it('never asks for more tiles than the grid has', () => {
    // Requesting a 6x6 block at zoom 0 used to reach for tiles that do
    // not exist; every one of them came back as a hole.
    for (const z of [0, 1, 2, 3]) {
      const block = tileBlockAround(0, 0, z, 8);
      expect(block.tiles).toBeLessThanOrEqual(2 ** z);
      expect(block.x0 + block.tiles).toBeLessThanOrEqual(2 ** z);
      expect(block.y0 + block.tiles).toBeLessThanOrEqual(2 ** z);
    }
  });

  it('covers the whole world when the block fills the grid', () => {
    const block = tileBlockAround(0, 0, 3, 8);
    expect(block.tiles).toBe(8);
    expect(block.bounds.lonWest).toBeCloseTo(-180, 6);
    expect(block.bounds.lonEast).toBeCloseTo(180, 6);
    expect(block.bounds.latNorth).toBeCloseTo(MERCATOR_MAX_LAT, 5);
    expect(block.bounds.latSouth).toBeCloseTo(-MERCATOR_MAX_LAT, 5);
  });
});

describe('zoomForTexel', () => {
  it('asks for the zoom whose texel is at least as sharp as requested', () => {
    // Rome. Esri World Imagery tops out at z19 there, which is
    // 0.222 m/px — measured, not assumed.
    expect(zoomForTexel(41.9028, 0.222)).toBe(19);
    expect(zoomForTexel(41.9028, 1.78)).toBe(16);
    expect(zoomForTexel(41.9028, 28.5)).toBe(12);
  });

  it('never promises data the source does not have', () => {
    // A camera pressed against the ground would want centimetres.
    expect(zoomForTexel(41.9028, 0.001)).toBe(19);
    expect(zoomForTexel(41.9028, 0.001, 15)).toBe(15);
  });

  it('accounts for the Mercator stretch with latitude', () => {
    // The same zoom covers less ground per texel further from the
    // equator, so a polar site reaches a given sharpness sooner.
    expect(zoomForTexel(70, 10)).toBeLessThan(zoomForTexel(0, 10));
  });

  it('degrades rather than throwing on a nonsense request', () => {
    expect(zoomForTexel(41.9, 0)).toBe(19);
    expect(zoomForTexel(41.9, -5)).toBe(19);
  });
});
