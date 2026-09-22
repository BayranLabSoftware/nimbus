import { describe, expect, it } from 'vitest';
import { eiepRatios, simulateEiepRow, type EiepQuantity } from './eiepComparison.js';
import { EIEP_REFERENCE } from './eiepReference.js';
import { IMPACT_WIND_TOLERANCE } from './impactWindRules.js';

/**
 * The impact pipeline against the Earth Impact Effects Program, on the
 * grid scripts/eiep-reference.py fixed.
 *
 * Gated where the two codes are meant to be the same equations — the
 * energy, the atmospheric entry, the craters, the ejecta blanket and the
 * fireball — to the program's own rounding: it prints two or three
 * significant figures; the air blast, of an airburst, low and high end,
 * and of an impact that reaches the ground, within 1 %; the breakup and
 * burst altitudes, which the program prints to the metre, within 0.2 %
 * on the program's own entry, which doubles I_f (BM-13, rule 144 of
 * entryProgramRules.ts). The complex crater's depth differs by design, and
 * the report says how much.
 *
 * The relations are held to the program on the program's entry, named, so
 * that they stay held whichever entry is the default; and the paper's entry
 * is held to the departure rule 671 of entryPaperRules.ts measured.
 */

const PROGRAM = { entryEquations: 'program' } as const;
const PAPER = { entryEquations: 'paper' } as const;
const ratios = eiepRatios(EIEP_REFERENCE, PROGRAM);
const answered = EIEP_REFERENCE.filter((row) => row.error === null);

const TOLERANCE: Readonly<Record<Exclude<EiepQuantity, 'finalDepth'>, number>> = {
  energy: 0.03,
  breakupAltitude: 0.002,
  burstAltitude: 0.002,
  overpressure: 0.01,
  groundVelocity: 0.05,
  transientDiameter: 0.05,
  finalDiameter: 0.05,
  ejectaEdge: 0.02,
  fireballRadius: 0.02,
  airburstOverpressure: 0.01,
  airburstOverpressureHigh: 0.01,
  // Rules 788 to 792: the peak wind, G1's 1 %.
  wind: IMPACT_WIND_TOLERANCE,
};

describe('the impact pipeline agrees with its reference implementation where it means to', () => {
  it('bursts in the air exactly the impacts the program bursts, and digs the same kind of crater', () => {
    for (const row of answered) {
      // On both entries: the departure moves no body between the air and
      // the ground.
      for (const r of [simulateEiepRow(row, PROGRAM), simulateEiepRow(row, PAPER)]) {
        const label = `${row.diameterM.toString()} m at ${row.velocityKmS.toString()} km/s, ${row.angleDeg.toString()}°, ${row.densityKgM3.toString()} kg/m³`;
        const programAirburst = row.burstAltitudeM !== null && row.burstAltitudeM !== undefined;
        expect(r.entry.regime === 'COMPLETE_AIRBURST', label).toBe(programAirburst);
        const crater = (r.crater.finalDiameter as number) > 0 ? r.crater.morphology : 'none';
        if (programAirburst && row.craterType === null) {
          // The program's third answer, which the page's parser records as
          // neither kind: "Large fragments strike the surface and may create a
          // crater strewn field", printed for an iron's airburst (the grid's
          // 30 m iron, read again on 21 September 2026), with no size; its map
          // draws the ejecta of the whole body's crater at its residual speed.
          // Since rules 764 to 771 an iron that breaks up digs, and that
          // crater's blanket is held to the map's below, within 2 %.
          expect(crater, label).not.toBe('none');
        } else {
          expect(crater, label).toBe(row.craterType ?? 'none');
        }
      }
    }
  }, 60_000);

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

  it('breaks and bursts a body where the program does, on its doubled I_f (BM-13, rule 144)', () => {
    // Until 16 September 2026 the model kept Eq. 12's I_f and this test
    // rebuilt the program's altitudes from it; since rule 144 of
    // validation/entryProgramRules.ts the entry doubles I_f as the program
    // does, and its altitudes are the program's own.
    let checked = 0;
    for (const row of answered) {
      const programBreakup = row.breakupAltitudeM ?? null;
      if (programBreakup === null) continue;
      const r = simulateEiepRow(row, PROGRAM);
      const label = `${row.diameterM.toString()} m at ${row.velocityKmS.toString()} km/s, ${row.angleDeg.toString()}°, ${row.densityKgM3.toString()} kg/m³`;
      expect(
        Math.abs(Math.log((r.entry.breakupAltitude as number) / programBreakup)),
        label
      ).toBeLessThan(0.001);
      const programBurst = row.burstAltitudeM ?? null;
      if (programBurst !== null) {
        expect(
          Math.abs(Math.log((r.entry.burstAltitude as number) / programBurst)),
          label
        ).toBeLessThan(0.001);
      }
      checked++;
    }
    expect(checked).toBeGreaterThan(60);
  }, 30_000);
});

describe('the paper’s entry departs from the program through BM-13 alone (rule 671)', () => {
  const onDefault = eiepRatios(EIEP_REFERENCE, PAPER);
  /** Rule 671: what the departure was measured to cost, rounded up. */
  const DEPARTURE: Readonly<Partial<Record<EiepQuantity, number>>> = {
    breakupAltitude: 0.01,
    burstAltitude: 0.05,
  };

  for (const [quantity, tolerance] of Object.entries(TOLERANCE)) {
    const bound = DEPARTURE[quantity as EiepQuantity] ?? tolerance;
    it(`keeps the ${quantity} within ${(bound * 100).toFixed(0)} %`, () => {
      const pairs = onDefault.filter((r) => r.quantity === quantity);
      expect(pairs.length).toBeGreaterThan(15);
      for (const r of pairs) {
        expect(
          Math.abs(Math.log(r.model / r.reference)),
          `${quantity} ${String(r.detail ?? '')} for ${r.row.diameterM.toString()} m at ${r.row.velocityKmS.toString()} km/s, ${r.row.angleDeg.toString()}°`
        ).toBeLessThan(bound);
      }
    });
  }
});
