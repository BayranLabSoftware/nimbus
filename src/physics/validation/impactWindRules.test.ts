import { describe, expect, it } from 'vitest';
import {
  impactOverpressureAt,
  impactPeakWindAt,
  programPeakWind,
  type ImpactFieldSource,
} from '../events/impact/impactField.js';
import { peakWindFromOverpressure } from '../events/explosion/peakWind.js';
import { simulateImpact } from '../simulate.js';
import { eiepRowInput } from './eiepComparison.js';
import { EIEP_REFERENCE } from './eiepReference.js';
import { IMPACT_WIND_TOLERANCE } from './impactWindRules.js';

/**
 * Rules 793 to 797 (`impactWindRules.ts`): an impact's peak wind. Rule 795,
 * the relation against the program on the overpressure the comparison gates,
 * is held in `eiepComparison.test.ts` with every other clause of I1; here is
 * rule 796, the wind the globe draws.
 */

const rows = EIEP_REFERENCE.filter(
  (row) =>
    row.error === null && row.windMs !== null && row.windMs !== undefined && row.overpressurePa
);

const sourceOf = (input: ReturnType<typeof eiepRowInput>): ImpactFieldSource => {
  const r = simulateImpact(input);
  return {
    inputs: input,
    impactor: { kineticEnergy: r.impactor.kineticEnergy },
    entry: r.entry,
    radiantHeat: r.radiantHeat,
  };
};

describe('rules 793 to 797: the peak wind of an impact', () => {
  it('reads the relation with the round constants the program uses, not the sea level an explosion reads', () => {
    // Rule 790: 1 bar and 330 m/s. At 5 psi the program's constants give
    // 71.4 m/s where Glasstone & Dolan's sea level gives 72.8.
    const fivePsi = 34_473.8;
    expect(programPeakWind(fivePsi)).toBeCloseTo(71.43, 1);
    expect(Number(peakWindFromOverpressure(fivePsi as never))).toBeCloseTo(72.8, 0);
    expect(programPeakWind(0)).toBe(0);
    expect(programPeakWind(-5)).toBe(0);
  });

  it('draws an airburst the program’s wind within 1 %, on both entries (rule 796)', () => {
    let checked = 0;
    for (const row of rows) {
      if (row.burstAltitudeM === null || row.burstAltitudeM === undefined) continue;
      for (const options of [{ entryEquations: 'program' } as const, {}]) {
        const source = sourceOf(eiepRowInput(row, options));
        const wind = impactPeakWindAt(source, row.distanceKm * 1_000);
        expect(
          Math.abs(Math.log(wind / (row.windMs ?? Number.NaN))),
          `${row.diameterM.toString()} m at ${row.velocityKmS.toString()} km/s, ${row.angleDeg.toString()}°`
        ).toBeLessThan(IMPACT_WIND_TOLERANCE);
        checked++;
      }
    }
    expect(checked).toBe(48);
  }, 60_000);

  it('draws a body that reaches the ground the wind of the blast it draws, and no other (rule 796)', () => {
    let checked = 0;
    for (const row of rows) {
      if (row.burstAltitudeM !== null && row.burstAltitudeM !== undefined) continue;
      const source = sourceOf(eiepRowInput(row));
      const range = row.distanceKm * 1_000;
      expect(impactPeakWindAt(source, range)).toBe(
        programPeakWind(impactOverpressureAt(source, range))
      );
      checked++;
    }
    expect(checked).toBe(57);
  }, 60_000);
});
