import { describe, expect, it } from 'vitest';
import { buildRuptureStadiumLatLon } from '../../scene/stadiumPolygon.js';
import {
  shippedPopulationInPolygon,
  shippedStadiumCounter,
  shippedStadiumSweep,
} from './shippedPopulation.js';

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

/**
 * One pass over the raster, six orientations.
 *
 * `shippedStadiumSweep` exists because rule 291's sweep asked for six
 * counters and got six passes over the population raster, of which only the
 * last step — resolving the azimuth onto the strike — differed. The pass is
 * now made once with north as the first axis and each orientation is a rigid
 * rotation of it.
 *
 * What has to be true is that it answers what six separate counters answer.
 * It is a rotation composed with a rotation where there used to be one, so
 * the agreement is floating-point and not bit-for-bit.
 */
describe('shippedStadiumSweep — one pass, several strikes', () => {
  const at = { latitude: 38.297, longitude: 142.373 };
  const strikes = [0, 30, 60, 90, 120, 150];
  const reachM = 400_000;

  it('answers what one counter per strike answers', () => {
    const swept = shippedStadiumSweep(at.latitude, at.longitude, strikes, reachM);
    expect(swept).toHaveLength(strikes.length);
    for (const [i, strike] of strikes.entries()) {
      const alone = shippedStadiumCounter(at.latitude, at.longitude, strike, reachM);
      const together = swept[i];
      expect(together).toBeDefined();
      if (together === undefined) continue;
      for (const [halfL, halfW, radius] of [
        [0, 0, 50_000],
        [200_000, 60_000, 30_000],
        [350_000, 100_000, 80_000],
      ] as const) {
        const a = alone(halfL, halfW, radius);
        const b = together(halfL, halfW, radius);
        // A relative 1e-9: the same arithmetic reached two ways.
        expect(Math.abs(a - b)).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(a)));
      }
    }
  });

  it('carries the offset of rule 377 through the rotation', () => {
    const [swept] = shippedStadiumSweep(at.latitude, at.longitude, [200], reachM);
    const alone = shippedStadiumCounter(at.latitude, at.longitude, 200, reachM);
    expect(swept).toBeDefined();
    if (swept === undefined) return;
    for (const offset of [-150_000, 0, 150_000]) {
      const a = alone(150_000, 50_000, 40_000, offset);
      const b = swept(150_000, 50_000, 40_000, offset);
      expect(Math.abs(a - b)).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(a)));
    }
  });
});
