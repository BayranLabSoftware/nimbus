import { describe, expect, it } from 'vitest';
import { AIRBURST_BAND, airburstBlastBand } from '../effects/airburstBlast.js';
import { IMPACT_PRESETS, simulateImpact, type ImpactScenarioInput } from '../simulate.js';
import { m, type Joules, type Pascals } from '../units.js';
import {
  CHELYABINSK_WINDOWS_RADIUS_KM,
  RUNS_HELD_SEEN,
  TREE_DAMAGE_RANGE_KPA,
  WINDOW_DAMAGE_RANGE_KPA,
} from './airburstBandProductRules.js';
import { TUNGUSKA_FELLED } from './airburstBandRules.js';
import {
  AGREEMENT_BURST_HEIGHTS,
  LINE_SOURCE_FACTOR_ABSTRACT,
  MOVING_SOURCE_FACTOR,
} from './airburstThreeModelRules.js';
import { COLLINS_2017_TABLE_2, TABLE_2_BURST_ALTITUDE_KM } from './collins2017Table2.js';

/** Rules 706 to 713: I3's band, carried by the product, and I3 read. */

const MT = 4.184e15;
const RINGS = ['overpressure5psi', 'overpressure1psi', 'lightDamage'] as const;

/** Rule 707: the union of the bands over a footprint's threshold range, km. */
function unionBandKm(
  input: ImpactScenarioInput,
  [lowKPa, highKPa]: readonly [number, number]
): { low: number; high: number } {
  const r = simulateImpact(input);
  const z = r.entry.burstAltitude;
  const w = (r.entry.blastYieldMegatons * MT) as Joules;
  const atHigh = airburstBlastBand((highKPa * 1_000) as Pascals, z, w);
  const atLow = airburstBlastBand((lowKPa * 1_000) as Pascals, z, w);
  return { low: Number(atHigh.low) / 1_000, high: Number(atLow.high) / 1_000 };
}

describe('rules 706 to 713: I3’s band', () => {
  it('is the reference’s own construction (rule 709)', () => {
    expect(AIRBURST_BAND.movingSourceFactor).toBe(MOVING_SOURCE_FACTOR);
    expect(AIRBURST_BAND.lineSourceFactor).toBe(LINE_SOURCE_FACTOR_ABSTRACT);
    expect(AIRBURST_BAND.agreementBurstHeights).toBe(AGREEMENT_BURST_HEIGHTS);
  });

  it('(c) is carried by every complete airburst, holding its rings, and by nothing else', () => {
    const bodies: ImpactScenarioInput[] = [
      ...Object.values(IMPACT_PRESETS).map((p) => p.input as ImpactScenarioInput),
      ...[5, 12, 20, 35, 60, 90, 150, 400].flatMap((d) =>
        [12_000, 25_000, 50_000].flatMap((v) =>
          [800, 3_000, 7_800].map(
            (rho) =>
              ({
                impactorDiameter: d,
                impactVelocity: v,
                impactorDensity: rho,
                targetDensity: 2_500,
                impactAngle: Math.PI / 4,
              }) as unknown as ImpactScenarioInput
          )
        )
      ),
    ];
    let airbursts = 0;
    let others = 0;
    for (const input of bodies) {
      const r = simulateImpact(input);
      if (r.entry.regime !== 'COMPLETE_AIRBURST') {
        expect(r.airburstBand).toBeNull();
        others += 1;
        continue;
      }
      airbursts += 1;
      const band = r.airburstBand;
      if (band === null) throw new Error('a complete airburst with no band');
      for (const ring of RINGS) {
        expect(Number(band[ring].low)).toBeLessThanOrEqual(Number(r.damage[ring]));
        expect(Number(band[ring].high)).toBeGreaterThanOrEqual(Number(r.damage[ring]));
        expect(Number(band[ring].low)).toBeGreaterThanOrEqual(0);
      }
    }
    expect(airbursts).toBeGreaterThan(10);
    expect(others).toBeGreaterThan(10);
  });

  it('(a) holds Tunguska’s felled forest over the tree-damage range', () => {
    const b = unionBandKm(IMPACT_PRESETS.TUNGUSKA.input, TREE_DAMAGE_RANGE_KPA);
    expect(b.low).toBeCloseTo(4.0, 0);
    expect(b.high).toBeCloseTo(29.4, 0);
    expect(TUNGUSKA_FELLED.equivalentRadiusKm).toBeGreaterThanOrEqual(b.low);
    expect(TUNGUSKA_FELLED.equivalentRadiusKm).toBeLessThanOrEqual(b.high);
  });

  it('(a) holds Chelyabinsk’s broken windows over the window-damage range', () => {
    const b = unionBandKm(IMPACT_PRESETS.CHELYABINSK.input, WINDOW_DAMAGE_RANGE_KPA);
    expect(b.low).toBe(0);
    expect(CHELYABINSK_WINDOWS_RADIUS_KM).toBeGreaterThanOrEqual(b.low);
    expect(CHELYABINSK_WINDOWS_RADIUS_KM).toBeLessThanOrEqual(b.high);
  });

  it('(b) holds 27 of the 43 scorable runs at the altitudes the paper prints', () => {
    let held = 0;
    let scored = 0;
    for (const row of COLLINS_2017_TABLE_2) {
      const z = m((TABLE_2_BURST_ALTITUDE_KM[row.energyMt] ?? NaN) * 1_000);
      const w = (row.energyMt * MT) as Joules;
      for (const kPa of ['1', '10', '20', '35'] as const) {
        const band = airburstBlastBand((Number(kPa) * 1_000) as Pascals, z, w);
        for (const entry of row.rangeKm[kPa]) {
          if (entry === 'offMesh') continue;
          const km = entry ?? 0;
          scored += 1;
          if (km >= Number(band.low) / 1_000 - 1e-9 && km <= Number(band.high) / 1_000 + 1e-9)
            held += 1;
        }
      }
    }
    expect({ held, of: scored }).toEqual(RUNS_HELD_SEEN);
  });
});
