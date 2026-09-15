import { describe, expect, it } from 'vitest';
import {
  FIREBALL_BODIES,
  FIREBALL_DEFAULT_ANGLE_RAD,
  FIREBALL_MEAN_ERROR_KM,
  FIREBALL_MEDIAN_ERROR_KM,
  fireballDiameterM,
  fireballEntryAngle,
  meetsFireballBar,
  type FireballEvent,
  type FireballReading,
} from './fireballRules.js';
import {
  FIREBALL_EVENTS,
  FIREBALL_LISTED,
  FIREBALL_SEEN,
  FIREBALL_WITHOUT_ALTITUDE,
  FIREBALL_WITHOUT_PLACE,
  FIREBALL_WITHOUT_SPEED,
} from './fireballSetData.js';

/**
 * Rules 76 to 79 of fireballRules.ts, before the entry model is run on any
 * bolide: the set is the one rule 76 names, and rule 77's body and angle are
 * what it says.
 */

describe('rule 76: the bolides of the fireball catalogue', () => {
  it('holds what the rule says, and not the one the project has read', () => {
    expect(FIREBALL_LISTED).toBe(1_072);
    expect(FIREBALL_EVENTS).toHaveLength(357);
    expect(FIREBALL_WITHOUT_ALTITUDE).toBe(472);
    expect(FIREBALL_WITHOUT_SPEED).toBe(242);
    expect(FIREBALL_WITHOUT_PLACE).toBe(0);
    expect(FIREBALL_SEEN).toHaveLength(1);
    expect(FIREBALL_SEEN[0]?.startsWith('2013-02-15')).toBe(true);
    for (const e of FIREBALL_EVENTS) {
      expect(e.altitudeKm).toBeGreaterThan(0);
      expect(e.speedKmS).toBeGreaterThan(0);
      expect(e.energyKt).toBeGreaterThan(0);
      expect(Math.abs(e.latitude)).toBeLessThanOrEqual(90);
      expect(Math.abs(e.longitude)).toBeLessThanOrEqual(180);
      expect(e.date.startsWith('2013-02-15')).toBe(false);
    }
  });

  it('counts 200, 129 and 28 by energy and 189 at 17 km/s or more', () => {
    const by = (f: (e: FireballEvent) => boolean): number => FIREBALL_EVENTS.filter(f).length;
    expect([
      by((e) => e.energyKt < 0.3),
      by((e) => e.energyKt >= 0.3 && e.energyKt < 3),
      by((e) => e.energyKt >= 3),
    ]).toEqual([200, 129, 28]);
    expect(by((e) => e.speedKmS >= 17)).toBe(189);
  });
});

describe('rule 77: the body and the angle', () => {
  it('names the body a scenario with no class carries, and the two read beside', () => {
    expect(FIREBALL_BODIES.map((b) => [b.key, b.densityKgM3, b.strengthPa])).toEqual([
      ['default', 3_000, null],
      ['stony', 3_000, 1e6],
      ['iron', 7_800, 5e7],
    ]);
  });

  it('builds the diameter from the energy, the speed and the density', () => {
    // 1 kt at 20 km/s: m = 2E/v², d = (6m/πρ)^⅓.
    const joules = 4.184e12;
    const mass = (2 * joules) / 20_000 ** 2;
    expect(fireballDiameterM(1, 20, 3_000)).toBeCloseTo(
      Math.cbrt((6 * mass) / (Math.PI * 3_000)),
      9
    );
    expect(fireballDiameterM(1, 20, 7_800)).toBeLessThan(fireballDiameterM(1, 20, 3_000));
    expect(fireballDiameterM(0, 20, 3_000)).toBe(0);
  });

  it('reads the angle from the velocity and the place', () => {
    const at = (
      latitude: number,
      longitude: number,
      v: [number, number, number]
    ): FireballEvent => ({
      date: '2020-01-01T00:00:00Z',
      latitude,
      longitude,
      altitudeKm: 30,
      speedKmS: Math.hypot(...v),
      vxKmS: v[0],
      vyKmS: v[1],
      vzKmS: v[2],
      energyKt: 1,
    });
    // Straight down over the equator at the prime meridian: −x is down.
    expect(fireballEntryAngle(at(0, 0, [-10, 0, 0]))).toBeCloseTo(Math.PI / 2, 12);
    // Horizontal there: nothing points downward, so the model's own 45°.
    expect(fireballEntryAngle(at(0, 0, [0, 10, 0]))).toBe(FIREBALL_DEFAULT_ANGLE_RAD);
    // Straight down over the north pole is −z.
    expect(fireballEntryAngle(at(90, 0, [0, 0, -10]))).toBeCloseTo(Math.PI / 2, 12);
    // Forty-five degrees: equal parts down and along.
    expect((fireballEntryAngle(at(0, 0, [-7, 7, 0])) * 180) / Math.PI).toBeCloseTo(45, 9);
    // Pointing upward from its own place: the model's own default.
    expect(fireballEntryAngle(at(0, 0, [10, 0, 0]))).toBe(FIREBALL_DEFAULT_ANGLE_RAD);
    expect(fireballEntryAngle(at(0, 0, [0, 0, 0]))).toBe(FIREBALL_DEFAULT_ANGLE_RAD);
  });

  it('gives the set five rows whose components point upward, and nothing steeper than vertical', () => {
    const angles = FIREBALL_EVENTS.map((e) => (fireballEntryAngle(e) * 180) / Math.PI);
    expect(angles.filter((a) => a === 45).length).toBe(5);
    for (const a of angles) {
      expect(a).toBeGreaterThan(0);
      expect(a).toBeLessThanOrEqual(90);
    }
  });
});

describe('rule 79: the bar of the gold standard', () => {
  const reading = (
    medianAbsoluteErrorKm: number | null,
    meanErrorKm: number | null,
    rows = 357
  ): FireballReading => ({
    rows,
    burst: rows,
    toTheGround: 0,
    medianAbsoluteErrorKm,
    meanErrorKm,
    withinFiveKm: 0,
  });

  it('asks 5 km in the median and 3 km in the mean, on 300 bolides or more', () => {
    expect(FIREBALL_MEDIAN_ERROR_KM).toBe(5);
    expect(FIREBALL_MEAN_ERROR_KM).toBe(3);
    expect(meetsFireballBar(reading(5, -3))).toBe(true);
    expect(meetsFireballBar(reading(5.01, 0))).toBe(false);
    expect(meetsFireballBar(reading(1, 3.01))).toBe(false);
    expect(meetsFireballBar(reading(1, 1, 299))).toBe(false);
    expect(meetsFireballBar(reading(null, null))).toBe(false);
  });
});
