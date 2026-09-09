import { describe, expect, it } from 'vitest';
import {
  bearingBetween,
  bearingFromRupture,
  destination,
  distanceBetween,
  nearestPointOnRupture,
} from './ruptureGeometry.js';

/**
 * A rupture is a line, and the bearing a wave leaves it on is taken
 * from the nearest point of that line rather than from its centre.
 *
 * The case this exists for is Banda Aceh: 250 km up a 1 300 km fault
 * striking 330°, square across the strike, where a megathrust
 * radiates hardest. Measured from the epicentre at the southern end
 * it comes out lying almost straight along the strike instead, and
 * the beam hands it the incoherent floor that belongs off a fault's
 * end.
 */
const sunda = { latitude: 3.316, longitude: 95.854, strikeDeg: 330, lengthM: 1_300_000 };

describe('nearestPointOnRupture', () => {
  it('a place abreast of the fault gets an interior point, and a perpendicular', () => {
    // Banda Aceh, up the line and a little west of it.
    const bearing = bearingFromRupture(sunda, 5.55, 95.32);
    const offStrike = Math.abs(Math.cos(((bearing - sunda.strikeDeg) * Math.PI) / 180));
    // Square across the fault: the cosine of the angle off the strike
    // is what the array factor squares, and here it is near zero.
    expect(offStrike).toBeLessThan(0.35);
    // From the epicentre it would have been nearly along strike.
    const fromCentre = bearingBetween(sunda.latitude, sunda.longitude, 5.55, 95.32);
    expect(Math.abs(Math.cos(((fromCentre - sunda.strikeDeg) * Math.PI) / 180))).toBeGreaterThan(
      0.9
    );
  });

  it('a place past one end gets the end, and a bearing along the strike', () => {
    // Far to the south-south-east, off the tail of the fault.
    const p = nearestPointOnRupture(sunda, -12.19, 96.83);
    const half = distanceBetween(sunda.latitude, sunda.longitude, p.latitude, p.longitude);
    expect(half).toBeCloseTo(sunda.lengthM / 2, -4);
    const bearing = bearingFromRupture(sunda, -12.19, 96.83);
    // Still strongly along strike, and a little less so than from the
    // centre — which is right: the end of the fault is 650 km nearer.
    expect(Math.abs(Math.cos(((bearing - sunda.strikeDeg) * Math.PI) / 180))).toBeGreaterThan(0.7);
  });

  it('a rupture with no length or no orientation is its own centre', () => {
    const flat = { ...sunda, lengthM: 0 };
    const p = nearestPointOnRupture(flat, 10, 90);
    expect(p.latitude).toBe(sunda.latitude);
    expect(p.longitude).toBe(sunda.longitude);
    expect(bearingFromRupture(flat, 10, 90)).toBeCloseTo(
      bearingBetween(sunda.latitude, sunda.longitude, 10, 90),
      9
    );
  });

  it('agrees with the point source wherever the rupture is short', () => {
    // A sixty-kilometre rupture seen from two thousand kilometres out
    // is a point, and the two bearings must not disagree.
    const short = { ...sunda, lengthM: 60_000 };
    for (const [lat, lon] of [
      [20, 80],
      [-15, 110],
      [3, 60],
    ] as const) {
      const line = bearingFromRupture(short, lat, lon);
      const point = bearingBetween(sunda.latitude, sunda.longitude, lat, lon);
      expect(Math.abs(line - point)).toBeLessThan(1);
    }
  });

  it('destination and distance are each other’s inverse', () => {
    for (const [bearing, d] of [
      [0, 100_000],
      [95, 500_000],
      [330, 650_000],
      [200, -650_000],
    ] as const) {
      const p = destination(sunda.latitude, sunda.longitude, bearing, d);
      expect(distanceBetween(sunda.latitude, sunda.longitude, p.latitude, p.longitude)).toBeCloseTo(
        Math.abs(d),
        -2
      );
    }
  });
});
