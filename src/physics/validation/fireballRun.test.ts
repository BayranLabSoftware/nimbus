import { describe, expect, it } from 'vitest';
import { atmosphericEntry } from '../effects/atmosphericEntry.js';
import { J, kgPerM3, m, mps, rad } from '../units.js';
import { FIREBALL_BODIES, fireballDiameterM, fireballEntryAngle } from './fireballRules.js';
import { fireballRow, fireballRows, readFireball, type FireballRow } from './fireballRun.js';

/**
 * How rules 76 to 79 of fireballRules.ts are run, held before the model is
 * read on the set: a bolide becomes the scenario rule 77 names, and rule 78's
 * reading counts what it says.
 */

describe('rule 77: a bolide as a scenario', () => {
  it('builds the body from the energy, the speed and the angle, and runs the entry as it is', () => {
    const event = {
      date: '2020-06-01T12:00:00Z',
      latitude: 12.3,
      longitude: -45.6,
      altitudeKm: 31.4,
      speedKmS: 18.2,
      vxKmS: -8,
      vyKmS: 12,
      vzKmS: -4,
      energyKt: 1.7,
    };
    const body = FIREBALL_BODIES[0];
    // Pinned to Eq. 9, as rule 898(a) lists it: the entry below is the one
    // the row must run.
    const row = fireballRow(event, body, 'density');
    const diameter = fireballDiameterM(event.energyKt, event.speedKmS, body.densityKgM3);
    const entry = atmosphericEntry(
      m(diameter),
      mps(event.speedKmS * 1_000),
      undefined,
      kgPerM3(body.densityKgM3),
      J(event.energyKt * 4.184e12),
      rad(fireballEntryAngle(event))
    );
    expect(row.diameterM).toBe(diameter);
    expect(row.observedKm).toBe(event.altitudeKm);
    expect(row.regime).toBe(entry.regime);
    expect(row.burstKm).toBe(
      (entry.burstAltitude as number) > 0 ? (entry.burstAltitude as number) / 1_000 : null
    );
    expect(row.angleDeg).toBeCloseTo((fireballEntryAngle(event) * 180) / Math.PI, 12);
  });

  it('runs every bolide of the set without a figure the model cannot give', () => {
    for (const body of FIREBALL_BODIES) {
      for (const row of fireballRows(body).slice(0, 25)) {
        expect(Number.isFinite(row.diameterM)).toBe(true);
        expect(row.diameterM).toBeGreaterThan(0);
        expect(row.burstKm === null || row.burstKm > 0).toBe(true);
      }
    }
  });
});

describe('rule 78: the reading', () => {
  it('counts the bursts, the bodies brought to the ground, and the differences', () => {
    const row = (burstKm: number | null, observedKm: number): FireballRow => ({
      date: '2020-01-01T00:00:00Z',
      energyKt: 1,
      speedKmS: 18,
      angleDeg: 45,
      diameterM: 4,
      observedKm,
      burstKm,
      regime: burstKm === null ? 'PARTIAL_AIRBURST' : 'COMPLETE_AIRBURST',
    });
    const reading = readFireball([row(30, 28), row(20, 32), row(null, 25), row(41, 30)]);
    expect(reading.rows).toBe(4);
    expect(reading.burst).toBe(3);
    expect(reading.toTheGround).toBe(1);
    // Differences: +2, −12, +11 → median |·| 11, mean 1/3.
    expect(reading.medianAbsoluteErrorKm).toBe(11);
    expect(reading.meanErrorKm).toBeCloseTo(1 / 3, 12);
    expect(reading.withinFiveKm).toBe(1);
  });
});
