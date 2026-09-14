import { describe, expect, it } from 'vitest';
import { buildRuptureStadiumLatLon } from '../../scene/stadiumPolygon.js';
import { shippedPopulationInPolygon, shippedStadiumCounter } from './shippedPopulation.js';

/**
 * The fast stadium count a predictive band uses against the polygon
 * the browser sums: the same raster, the same sub-samples, one test of
 * a distance where the other tests a ring.
 */

const STADIUMS = [
  // An inland crustal rupture through a populated basin.
  { name: 'Sichuan', lat: 31.0, lon: 103.4, strike: 229, halfL: 120_000, halfW: 20_000, r: 60_000 },
  // A megathrust off a coast, its stadium along the shore.
  { name: 'Honshu', lat: 38.3, lon: 142.4, strike: 200, halfL: 250_000, halfW: 75_000, r: 90_000 },
  // A strike left unset, as a custom scenario leaves it.
  { name: 'Anatolia', lat: 37.2, lon: 37.0, strike: 0, halfL: 90_000, halfW: 15_000, r: 40_000 },
];

describe('the stadium count agrees with the polygon the browser sums', () => {
  for (const s of STADIUMS) {
    it(s.name, () => {
      const polygon = buildRuptureStadiumLatLon({
        centerLatDeg: s.lat,
        centerLonDeg: s.lon,
        strikeAzimuthDeg: s.strike,
        halfLengthAlongStrikeM: s.halfL,
        halfWidthAcrossStrikeM: s.halfW,
        contourRadiusM: s.r,
      });
      const ring = shippedPopulationInPolygon(polygon).exposed;
      const counter = shippedStadiumCounter(s.lat, s.lon, s.strike, 2 * (s.halfL + s.halfW + s.r));
      const fast = counter(s.halfL, s.halfW, s.r);
      expect(ring).toBeGreaterThan(10_000);
      expect(Math.abs(fast - ring) / ring).toBeLessThan(0.02);
      // A smaller stadium from the same counter, as a band's inner
      // contour asks for.
      const inner = shippedPopulationInPolygon(
        buildRuptureStadiumLatLon({
          centerLatDeg: s.lat,
          centerLonDeg: s.lon,
          strikeAzimuthDeg: s.strike,
          halfLengthAlongStrikeM: s.halfL / 2,
          halfWidthAcrossStrikeM: s.halfW,
          contourRadiusM: s.r / 3,
        })
      ).exposed;
      const innerFast = counter(s.halfL / 2, s.halfW, s.r / 3);
      expect(Math.abs(innerFast - inner) / Math.max(inner, 1)).toBeLessThan(0.03);
    });
  }
});
