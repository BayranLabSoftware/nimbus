import { describe, expect, it } from 'vitest';

import { Pa } from '../units.js';
import {
  KINGERY_BULMASH_GRID,
  KINGERY_BULMASH_IATG_CHECK,
} from '../validation/kingeryBulmashReference.js';
import {
  KINGERY_BULMASH_MAX_SCALED,
  KINGERY_BULMASH_MIN_SCALED,
  TNT_KG_PER_KILOTON,
  kingeryBulmashIncidentPressure,
  kingeryBulmashIncidentPressureEnglish,
  kingeryBulmashRange,
  kingeryBulmashScaledRange,
  scaledMetricToEnglish,
} from './kingeryBulmash.js';

/**
 * The transcription of Swisdak (1994) Table 1, held three ways: to the worked
 * examples another body of the field publishes, to the paper's own second
 * printing of the same curves in English units, and to itself at the joins.
 * G1 of docs/GOLD_STANDARD.md asks a relation be held to its reference within
 * 1 % or the reference's printed rounding; the 1 % is what Swisdak's paper
 * claims against the original Kingery & Bulmash curves, and it is what the
 * examples below are read at.
 */
describe('Kingery–Bulmash, the hemispherical TNT surface burst', () => {
  it('gives the pressures IATG 01.80 (2021), Table 5, prints for a charge at 50 m', () => {
    // The United Nations' International Ammunition Technical Guideline prints
    // these from the original 1984 polynomials, in bars: 0.43, 2.02 and 11.5.
    const examples = [
      { kilograms: 1_000, kPa: 43 },
      { kilograms: 10_000, kPa: 202 },
      { kilograms: 100_000, kPa: 1_150 },
    ];
    for (const { kilograms, kPa } of examples) {
      const scaled = 50 / Math.cbrt(kilograms);
      const pressure = (kingeryBulmashIncidentPressure(scaled) as number) / 1_000;
      expect(Math.abs(pressure / kPa - 1)).toBeLessThan(0.01);
    }
  });

  it('agrees with an implementation of the same fits written by somebody else', () => {
    // The black box of rules 177 to 181, read after the adoption at Andrea's
    // request: the MIT-licensed `kingery-bulmash` package, run over eight
    // charges and sixty-one scaled distances each by
    // scripts/benchmark/kb-grid.py. Its answers are in the fixture; its code
    // is not read, and the relation here is written from Swisdak's table.
    expect(KINGERY_BULMASH_GRID.length).toBeGreaterThan(400);
    let worst = 0;
    for (const point of KINGERY_BULMASH_GRID) {
      const ours = (kingeryBulmashIncidentPressure(point.scaled) as number) / 1_000;
      expect(Number.isFinite(ours)).toBe(true);
      worst = Math.max(worst, Math.abs(ours / point.kPa - 1));
    }
    expect(worst).toBeLessThan(1e-4);
  });

  it('inherits the package’s own distance from the printed examples', () => {
    // The chain the fixture records: the package sits 0.53 % from IATG's
    // printed bars, and this relation sits 2 × 10⁻⁶ from the package.
    for (const check of KINGERY_BULMASH_IATG_CHECK) {
      expect(Math.abs(check.relative)).toBeLessThan(0.01);
    }
  });

  it('agrees with the paper’s own English-unit coefficients', () => {
    for (let scaled = 0.25; scaled < 190; scaled *= 1.2) {
      const metric = kingeryBulmashIncidentPressure(scaled) as number;
      const english = kingeryBulmashIncidentPressureEnglish(
        scaledMetricToEnglish(scaled)
      ) as number;
      expect(Math.abs(metric / english - 1)).toBeLessThan(0.001);
    }
  });

  it('joins its three ranges without a step', () => {
    for (const join of [2.9, 23.8]) {
      const below = kingeryBulmashIncidentPressure(join * (1 - 1e-9)) as number;
      const above = kingeryBulmashIncidentPressure(join * (1 + 1e-9)) as number;
      expect(Math.abs(below / above - 1)).toBeLessThan(0.01);
    }
  });

  it('falls with distance inside each of the three ranges', () => {
    const bands: [number, number][] = [
      [KINGERY_BULMASH_MIN_SCALED, 2.9],
      [2.9, 23.8],
      [23.8, KINGERY_BULMASH_MAX_SCALED],
    ];
    for (const [edge, to] of bands) {
      // A band's lower edge belongs to the band below it, which is where the
      // table's ranges meet: 2.9 and 23.8 are read on the fit that ends there.
      const from = edge * (1 + 1e-9);
      let previous = Infinity;
      for (let scaled = from; scaled <= to; scaled = Math.min(scaled * 1.005, scaled + 0.01)) {
        const pressure = kingeryBulmashIncidentPressure(scaled) as number;
        expect(pressure).toBeLessThan(previous);
        previous = pressure;
        if (scaled === to) break;
      }
    }
  });

  it('steps up by less than a percent where the third range begins, and no ring sits there', () => {
    // The two fits meet at 23.8 m·kg⁻¹ᐟ³ at 4.895 and 4.929 kPa: the curve is
    // not monotone across that join, and a target between the two has a
    // crossing on either side of it, half a percent apart in range. The three
    // rings the product draws — 34.5, 6.9 and 3.4 kPa — are nowhere near it.
    const below = kingeryBulmashIncidentPressure(23.8) as number;
    const above = kingeryBulmashIncidentPressure(23.8 * (1 + 1e-9)) as number;
    expect(above).toBeGreaterThan(below);
    expect(above / below - 1).toBeLessThan(0.01);
    for (const pascals of [34_474, 6_895, 3_447]) {
      expect(pascals < below || pascals > above).toBe(true);
    }
  });

  it('says nothing outside the range the table prints', () => {
    expect(kingeryBulmashIncidentPressure(0.1)).toBeNaN();
    expect(kingeryBulmashIncidentPressure(250)).toBeNaN();
    expect(kingeryBulmashScaledRange(Pa(1e9))).toBeNaN();
    expect(kingeryBulmashScaledRange(Pa(10))).toBeNaN();
  });

  it('inverts its own curve', () => {
    for (const pascals of [34_474, 6_895, 3_447, 100_000, 1_000]) {
      const scaled = kingeryBulmashScaledRange(Pa(pascals));
      expect(scaled).toBeGreaterThan(KINGERY_BULMASH_MIN_SCALED);
      expect(scaled).toBeLessThan(KINGERY_BULMASH_MAX_SCALED);
      expect((kingeryBulmashIncidentPressure(scaled) as number) / pascals).toBeCloseTo(1, 6);
    }
  });

  it('draws the three rings the product draws, and they scale with the cube root', () => {
    const rings = [34_474, 6_895, 3_447].map(
      (pascals) => kingeryBulmashRange(TNT_KG_PER_KILOTON, Pa(pascals)) as number
    );
    const [five = 0, one = 0, light = 0] = rings;
    expect(five).toBeLessThan(one);
    expect(one).toBeLessThan(light);
    const eight = kingeryBulmashRange(8 * TNT_KG_PER_KILOTON, Pa(34_474)) as number;
    expect(eight / five).toBeCloseTo(2, 9);
  });

  it('draws nothing without a charge', () => {
    expect(kingeryBulmashRange(0, Pa(34_474))).toBe(0);
    expect(kingeryBulmashRange(-1, Pa(34_474))).toBe(0);
  });
});
