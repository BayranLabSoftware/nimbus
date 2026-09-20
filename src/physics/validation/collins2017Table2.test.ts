import { describe, expect, it } from 'vitest';
import { airburstOverpressure, airburstReach } from '../effects/airburstBlast.js';
import { m, type Joules, type Pascals } from '../units.js';
import { burstAltitudeKm, PUBLISHED, TREE_DAMAGE_KPA } from './airburstBandRules.js';
import {
  ALTITUDE_ASSIGNMENTS,
  COLLINS_2017_TABLE_2,
  TABLE_2_MODELS,
  type TableEntry,
} from './collins2017Table2.js';

/**
 * Rule 577 said I3's other half needed Table 2, that it does not come out of
 * any text extractor here, and that reading it off the page was "a careful
 * hour, not a guess at four in the morning". The hour was taken. The table
 * is in `collins2017Table2.ts` and this holds it to two things the paper's
 * own prose says about it, so a transcription error cannot pass.
 *
 * And the hour's real finding is that the table is NOT ENOUGH. It carries no
 * burst altitude, and the three models are run at one. Three assignments
 * were tried and none stands up, so I3's "ninety per cent of the
 * shock-physics runs" is still not scorable — what is missing is one column,
 * and now the repository says exactly which.
 */

const MT = 4.184e15;
const num = (e: TableEntry): number | undefined => (typeof e === 'number' ? e : undefined);

describe('the transcription of Table 2 is right', () => {
  it('has four energies and three models', () => {
    expect(COLLINS_2017_TABLE_2.map((r) => r.energyMt)).toEqual([0.5, 5, 15, 50]);
    expect(TABLE_2_MODELS).toEqual(['static', 'moving', 'cylindricalLine']);
    for (const r of COLLINS_2017_TABLE_2) {
      expect(r.peakKPa).toHaveLength(3);
      expect(r.atThreeBurstHeightsKPa).toHaveLength(3);
      for (const v of Object.values(r.rangeKm)) expect(v).toHaveLength(3);
    }
  });

  it("agrees with the paper's own sentence about Tunguska at 15 Mt", () => {
    // "the nominal conditions for extensive tree damage (40 m s-1 winds;
    // 20 kPa over pressure) are achieved to a radial distance of 16-22 km
    // for all of the source approximations".
    const row = COLLINS_2017_TABLE_2.find((r) => r.energyMt === 15);
    expect(row).toBeDefined();
    const at20 = (row?.rangeKm['20'] ?? []).map(num).filter((v): v is number => v !== undefined);
    expect(at20).toHaveLength(3);
    expect(Math.min(...at20)).toBeCloseTo(16.0, 1);
    expect(Math.max(...at20)).toBeCloseTo(22.1, 1);
    const p = PUBLISHED.tunguska15MtAt20kPa;
    expect(Math.min(...at20)).toBeGreaterThanOrEqual(p.lowKm - 0.5);
    expect(Math.max(...at20)).toBeLessThanOrEqual(p.highKm + 0.5);
  });

  it("agrees with the paper's own sentence about Chelyabinsk", () => {
    // "all three energy deposition approximations predict a ~50 km radius
    // damage zone".
    const row = COLLINS_2017_TABLE_2.find((r) => r.energyMt === 0.5);
    const at1 = (row?.rangeKm['1'] ?? []).map(num).filter((v): v is number => v !== undefined);
    expect(at1).toHaveLength(3);
    for (const v of at1) expect(Math.abs(v - 50)).toBeLessThan(6);
  });

  it('keeps the moving source above the static and the line source below it', () => {
    // The paper's central claim about its own three models, which the table
    // must show if it has been read correctly.
    for (const r of COLLINS_2017_TABLE_2) {
      const [s, mv, c] = r.peakKPa;
      expect(mv, `${String(r.energyMt)} Mt: moving above static`).toBeGreaterThan(s);
      expect(c, `${String(r.energyMt)} Mt: line below static`).toBeLessThan(s);
    }
  });

  it('distinguishes "no such overpressure" from "off the mesh"', () => {
    // n/a and the em dash mean opposite things — nothing that small, versus
    // something too far out to see — and merging them would turn a 50 Mt
    // airburst's 1 kPa ring into a ring that does not exist.
    const big = COLLINS_2017_TABLE_2.find((r) => r.energyMt === 50);
    expect(big?.rangeKm['1']).toEqual(['offMesh', 'offMesh', 'offMesh']);
    const small = COLLINS_2017_TABLE_2.find((r) => r.energyMt === 0.5);
    expect(small?.rangeKm['20']).toEqual([null, null, null]);
  });
});

describe('and the table is not enough: no row carries its burst altitude', () => {
  const reachKm = (energyMt: number, kPa: number, altitudeKm: number): number =>
    Number(
      airburstReach((kPa * 1_000) as Pascals, m(altitudeKm * 1_000), (energyMt * MT) as Joules)
    ) / 1_000;
  const peakKPa = (energyMt: number, altitudeKm: number): number =>
    Number(
      airburstOverpressure({
        groundRange: m(0),
        burstAltitude: m(altitudeKm * 1_000),
        blastYield: (energyMt * MT) as Joules,
      })
    ) / 1_000;

  it('the four stated altitudes in order match one radius in eleven', () => {
    const alts = ALTITUDE_ASSIGNMENTS.statedInOrder.altitudesKm;
    let within = 0;
    let total = 0;
    for (const [i, r] of COLLINS_2017_TABLE_2.entries()) {
      const z = alts[i] ?? 0;
      for (const [kPa, entries] of Object.entries(r.rangeKm)) {
        const want = num(entries[0]);
        if (want === undefined) continue;
        total++;
        const got = reachKm(r.energyMt, Number(kPa), z);
        if (got / want >= 0.9 && got / want <= 1.1) within++;
      }
    }
    expect(total).toBe(ALTITUDE_ASSIGNMENTS.statedInOrder.of);
    expect(within).toBe(ALTITUDE_ASSIGNMENTS.statedInOrder.radiiWithinTenPercent);
  });

  it("the text's own rule matches the 15 Mt peak to 1.6 % and nothing else as well", () => {
    const halfway = (energyMt: number): number =>
      (burstAltitudeKm(energyMt, 1) + burstAltitudeKm(energyMt, 50)) / 2;
    const row = COLLINS_2017_TABLE_2.find((r) => r.energyMt === 15);
    const z = halfway(15);
    expect(z).toBeCloseTo(ALTITUDE_ASSIGNMENTS.halfwayOfEq6.altitudesKm[2], 1);
    expect(peakKPa(15, z) / (row?.peakKPa[0] ?? 1)).toBeCloseTo(1.016, 2);
    // The 0.5 Mt row under the same rule is 27 % low, so the agreement at
    // 15 Mt does not carry.
    const small = COLLINS_2017_TABLE_2.find((r) => r.energyMt === 0.5);
    expect(peakKPa(0.5, halfway(0.5)) / (small?.peakKPa[0] ?? 1)).toBeLessThan(0.8);
  });

  it('the least-squares altitudes are not monotone in energy, which they must be', () => {
    const z = ALTITUDE_ASSIGNMENTS.leastSquares.altitudesKm;
    expect(ALTITUDE_ASSIGNMENTS.leastSquares.monotoneInEnergy).toBe(false);
    // A bigger airburst bursts lower, so an altitude recovered per row must
    // fall with energy. It does for the first three and rises at 50 Mt.
    expect(z[0]).toBeGreaterThan(z[1]);
    expect(z[1]).toBeGreaterThan(z[2]);
    expect(z[3]).toBeGreaterThan(z[2]);
    // And even at the best altitude per row the residual does not close.
    for (const r of ALTITUDE_ASSIGNMENTS.leastSquares.residual) expect(r).toBeGreaterThan(1.1);
  });

  it("so I3's ninety per cent is not scorable, and the report should say so", () => {
    // Nothing here scores it. The test exists to stop a later reader
    // assuming the table alone closed the clause.
    const scorable = COLLINS_2017_TABLE_2.every(
      (r) => 'burstAltitudeKm' in (r as unknown as Record<string, unknown>)
    );
    expect(scorable).toBe(false);
    expect(TREE_DAMAGE_KPA.lower).toBe(10);
  });
});
