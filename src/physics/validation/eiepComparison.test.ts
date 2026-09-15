import { describe, expect, it } from 'vitest';
import { collinsStrength } from '../effects/atmosphericEntry.js';
import { kgPerM3 } from '../units.js';
import { eiepRatios, simulateEiepRow, type EiepQuantity } from './eiepComparison.js';
import { EIEP_REFERENCE } from './eiepReference.js';

/**
 * The impact pipeline against the Earth Impact Effects Program, on the
 * grid scripts/eiep-reference.py fixed.
 *
 * Gated where the two codes are meant to be the same equations — the
 * energy, the atmospheric entry, the craters, the ejecta blanket and the
 * fireball — to the program's own rounding: it prints two or three
 * significant figures; the air blast of an airburst, low and high end,
 * within 1 %. The breakup and burst altitudes are gated wider because the
 * program's I_f is twice Eq. 12's (BM-13): it breaks bodies up to 0.8 %
 * lower on this grid, and bursts them up to 4.7 % lower — the 30 m iron
 * body at 20 km/s — and the last test shows that factor is the whole of
 * it. The complex crater's depth and the air blast of an impact that
 * reaches the ground differ by design, and the report says how much.
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

  it("parts from the program's breakup and burst altitudes only by its I_f, twice Eq. 12's (BM-13)", () => {
    // The program's breakup altitude is Eq. 11 on twice the I_f Eq. 12
    // prints, and its burst altitude Eqs. 16 and 18 from there, every other
    // constant as printed. The simulator keeps Eq. 12, the I_f whose Eq. 11
    // approximates the root of Eq. 10 (atmosphericEntry.test.ts).
    const H = 8_000;
    let checked = 0;
    for (const row of answered) {
      const programBreakup = row.breakupAltitudeM ?? null;
      if (programBreakup === null) continue;
      const r = simulateEiepRow(row);
      const v = row.velocityKmS * 1_000;
      const sinTheta = Math.sin((row.angleDeg * Math.PI) / 180);
      const strength = collinsStrength(kgPerM3(row.densityKgM3)) as number;
      const If = (4.07 * 2 * H * strength) / (row.densityKgM3 * row.diameterM * v * v * sinTheta);
      // Eq. 11 at 2 I_f less Eq. 11 at I_f.
      const breakup =
        (r.entry.breakupAltitude as number) +
        H * (0.314 * If + 1.303 * (Math.sqrt(1 - 2 * If) - Math.sqrt(1 - If)));
      const label = `${row.diameterM.toString()} m at ${row.velocityKmS.toString()} km/s, ${row.angleDeg.toString()}°, ${row.densityKgM3.toString()} kg/m³`;
      expect(Math.abs(Math.log(breakup / programBreakup)), label).toBeLessThan(0.001);
      const programBurst = row.burstAltitudeM ?? null;
      if (programBurst !== null) {
        const spread =
          row.diameterM * sinTheta * Math.sqrt(row.densityKgM3 / (2 * Math.exp(-breakup / H)));
        const burst = breakup - 2 * H * Math.log(1 + (spread * Math.sqrt(7 * 7 - 1)) / (2 * H));
        expect(Math.abs(Math.log(burst / programBurst)), label).toBeLessThan(0.001);
      }
      checked++;
    }
    expect(checked).toBeGreaterThan(60);
  });
});
