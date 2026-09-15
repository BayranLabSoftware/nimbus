import { describe, expect, it } from 'vitest';
import { eiepRatios, simulateEiepRow, type EiepQuantity } from './eiepComparison.js';
import { EIEP_REFERENCE } from './eiepReference.js';

/**
 * The impact pipeline against the Earth Impact Effects Program, on the
 * grid scripts/eiep-reference.py fixed.
 *
 * Gated where the two codes are meant to be the same equations — the
 * energy, the atmospheric entry, the craters, the ejecta blanket and the
 * fireball — to the program's own rounding: it prints two or three
 * significant figures, and a burst altitude of a kilometre or two to
 * the metre but from inputs rounded before it; the air blast of an
 * airburst, low and high end, within 1 %. The complex crater's depth and
 * the air blast of an impact that reaches the ground differ by design, and
 * the report says how much.
 */

const ratios = eiepRatios();
const answered = EIEP_REFERENCE.filter((row) => row.error === null);

const TOLERANCE: Readonly<Record<Exclude<EiepQuantity, 'finalDepth' | 'overpressure'>, number>> = {
  energy: 0.03,
  breakupAltitude: 0.02,
  burstAltitude: 0.06,
  groundVelocity: 0.05,
  transientDiameter: 0.05,
  finalDiameter: 0.05,
  ejectaEdge: 0.02,
  fireballRadius: 0.02,
  airburstOverpressure: 0.01,
  airburstOverpressureHigh: 0.01,
};

describe('the impact pipeline agrees with its reference implementation where it means to', () => {
  it('bursts in the air exactly the impacts the program bursts, and digs the same kind of crater', () => {
    for (const row of answered) {
      const r = simulateEiepRow(row);
      const label = `${row.diameterM.toString()} m at ${row.velocityKmS.toString()} km/s, ${row.angleDeg.toString()}°, ${row.densityKgM3.toString()} kg/m³`;
      const programAirburst = row.burstAltitudeM !== null && row.burstAltitudeM !== undefined;
      expect(r.entry.regime === 'COMPLETE_AIRBURST', label).toBe(programAirburst);
      const crater = (r.crater.finalDiameter as number) > 0 ? r.crater.morphology : 'none';
      expect(crater, label).toBe(row.craterType ?? 'none');
    }
  });

  for (const [quantity, tolerance] of Object.entries(TOLERANCE)) {
    it(`matches the ${quantity} within ${(tolerance * 100).toFixed(0)} %`, () => {
      const pairs = ratios.filter((r) => r.quantity === quantity);
      expect(pairs.length).toBeGreaterThan(15);
      for (const r of pairs) {
        expect(
          Math.abs(Math.log(r.model / r.reference)),
          `${quantity} ${String(r.detail ?? '')} for ${r.row.diameterM.toString()} m at ${r.row.velocityKmS.toString()} km/s, ${r.row.angleDeg.toString()}°`
        ).toBeLessThan(tolerance);
      }
    });
  }
});
