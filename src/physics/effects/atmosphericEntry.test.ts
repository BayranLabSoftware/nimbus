import { describe, expect, it } from 'vitest';
import { CHONDRITIC_DENSITY } from '../constants.js';
import { impactorMass, kineticEnergy } from '../events/impact/kinetic.js';
import { deg, degreesToRadians, kgPerM3, m, mps, Pa } from '../units.js';
import { IMPACTOR_STRENGTH, atmosphericEntry, collinsStrength } from './atmosphericEntry.js';

/**
 * Collins, Melosh & Marcus 2005's atmospheric entry. The grid in
 * validation/eiepComparison.test.ts holds these equations to the Earth
 * Impact Effects Program itself; these are the events and the limits.
 */

const entry = (
  diameterM: number,
  velocityMs: number,
  angleDeg: number,
  density: number,
  strength?: number
) => {
  const D = m(diameterM);
  const v = mps(velocityMs);
  const rho = kgPerM3(density);
  return atmosphericEntry(
    D,
    v,
    strength === undefined ? undefined : Pa(strength),
    rho,
    kineticEnergy(impactorMass(D, rho), v),
    degreesToRadians(deg(angleDeg))
  );
};

describe('atmospheric entry — Collins, Melosh & Marcus 2005', () => {
  it("takes Eq. 9's strength from density when no class is chosen", () => {
    expect(collinsStrength(kgPerM3(3_000)) as number).toBeCloseTo(3.35e5, -4);
    expect(collinsStrength(kgPerM3(8_000)) as number).toBeGreaterThan(4e7);
  });

  it('breaks a body up where the ram pressure on the speed Eq. 8 leaves it reaches its strength (Eq. 10)', () => {
    // Eq. 11 is Collins et al.'s approximation to the root of Eq. 10. With
    // I_f as Eq. 12 prints it, it lands within the 40 m its constants
    // leave at small I_f (8 km × (1.308 − 1.303)). The Earth Impact
    // Effects Program's breakup altitudes are Eq. 11 on twice that I_f
    // (BM-13): 480 m below the root for the 10 m iron body, 3.8 km for
    // the 3 m one, and the 2 m one never breaks, where Eq. 10 breaks it at
    // 13.8 km. The simulator keeps the paper's.
    const H = 8_000;
    for (const [diameterM, velocityMs, angleDeg, density] of [
      [10, 20_000, 45, 8_000],
      [50, 12_800, 45, 7_800],
      [3, 20_000, 45, 8_000],
      [2, 20_000, 45, 8_000],
      [30, 20_000, 45, 8_000],
      [19.8, 19_160, 18.3, 3_300],
      [100, 20_000, 45, 3_000],
      [1_000, 50_000, 90, 1_000],
    ] as const) {
      const strength = collinsStrength(kgPerM3(density)) as number;
      // Eq. 8: v = v₀ exp(−k ρ(z)), with ρ₀ = 1 kg/m³ and C_D = 2.
      const k = (3 * 2 * H) / (4 * density * diameterM * Math.sin((angleDeg * Math.PI) / 180));
      const ramPressure = (z: number): number => {
        const rho = Math.exp(-z / H);
        return rho * (velocityMs * Math.exp(-k * rho)) ** 2;
      };
      // It rises as the body descends until ρ = 1 / 2k, then falls: the
      // breakup is the crossing above that peak, or above the ground.
      let low = Math.max(0, H * Math.log(2 * k));
      let high = 200_000;
      expect(ramPressure(low)).toBeGreaterThan(strength);
      for (let i = 0; i < 100; i++) {
        const mid = (low + high) / 2;
        if (ramPressure(mid) >= strength) low = mid;
        else high = mid;
      }
      const label = `${diameterM.toString()} m at ${velocityMs.toString()} m/s`;
      const r = entry(diameterM, velocityMs, angleDeg, density);
      expect(r.regime, label).not.toBe('INTACT');
      expect(Math.abs((r.breakupAltitude as number) - low), label).toBeLessThan(50);
    }
  });

  it('bursts Chelyabinsk near the 27.0 km Popova et al. 2013 measured', () => {
    // The preset: Popova et al.'s 19.8 m of 3.3 g/cm³ at 19.16 km/s, 18.3°
    // from the horizontal, at the S-type class's 2 MPa. Nothing in the
    // equations was tuned on it.
    const r = entry(19.8, 19_160, 18.3, 3_300, IMPACTOR_STRENGTH.S_TYPE);
    expect(r.regime).toBe('COMPLETE_AIRBURST');
    expect(r.burstAltitude as number).toBeGreaterThan(25_000);
    expect(r.burstAltitude as number).toBeLessThan(29_000);
    expect(r.energyFractionToGround).toBe(0);
    // All of the 0.59 Mt goes into the air.
    expect(r.atmosphericYieldMegatons).toBeGreaterThan(0.55);
    expect(r.atmosphericYieldMegatons).toBeLessThan(0.62);
  });

  it('bursts Tunguska between 6 and 12 km, with its strength from density', () => {
    const r = entry(60, 15_000, 30, CHONDRITIC_DENSITY);
    expect(r.regime).toBe('COMPLETE_AIRBURST');
    expect(r.burstAltitude as number).toBeGreaterThan(6_000);
    expect(r.burstAltitude as number).toBeLessThan(12_000);
  });

  it('brings a broken 100 m stony body to the ground, slowed to 7.7 km/s', () => {
    // A case the tuned classifier burst in the air. The Earth Impact
    // Effects Program strikes it at 7.7 km/s with 15 % of its energy and
    // digs a 1.6 km crater.
    const r = entry(100, 20_000, 45, 3_000);
    expect(r.regime).toBe('PARTIAL_AIRBURST');
    expect(r.burstAltitude as number).toBe(0);
    expect(r.endVelocity as number).toBeGreaterThan(7_300);
    expect(r.endVelocity as number).toBeLessThan(8_100);
    expect(r.energyFractionToGround).toBeGreaterThan(0.13);
    expect(r.energyFractionToGround).toBeLessThan(0.17);
  });

  it('lets a kilometre-scale body through with nearly all its energy', () => {
    const r = entry(1_000, 50_000, 45, 3_000);
    expect(r.energyFractionToGround).toBeGreaterThan(0.9);
    const chicxulub = entry(15_000, 20_000, 45, 3_000);
    expect(chicxulub.energyFractionToGround).toBeGreaterThan(0.99);
    // A swarm that strikes the ground blasts its air share like a ground
    // impact: no range between a static and a moving source.
    expect(chicxulub.shockWaveRadiiHigh).toEqual(chicxulub.shockWaveRadii);
  });

  it('keeps a body too strong to break whole, with no entry damage', () => {
    const r = entry(10, 12_000, 90, 7_800, 5e9);
    expect(r.regime).toBe('INTACT');
    expect(r.breakupAltitude as number).toBe(0);
    expect(r.burstAltitude as number).toBe(0);
    expect(r.atmosphericYieldMegatons).toBe(0);
    expect(r.shockWaveRadii.lightDamage as number).toBe(0);
    expect(r.endVelocity as number).toBeLessThanOrEqual(12_000);
  });

  it('bursts a larger body lower, at the same speed and angle', () => {
    const small = entry(20, 18_000, 45, 3_000);
    const larger = entry(40, 18_000, 45, 3_000);
    expect(small.regime).toBe('COMPLETE_AIRBURST');
    expect(larger.burstAltitude as number).toBeLessThan(small.burstAltitude);
  });

  it("gives an airburst's blast the larger of the energy kept and the energy lost at the burst", () => {
    // Collins et al. 2017: W = E₀ · max(f, 1 − f), f = (v_b / v₀)².
    for (const r of [
      entry(60, 15_000, 30, CHONDRITIC_DENSITY),
      entry(17, 19_000, 18, CHONDRITIC_DENSITY, 2e6),
      entry(30, 20_000, 45, 3_000),
    ]) {
      expect(r.regime).toBe('COMPLETE_AIRBURST');
      expect(r.blastYieldMegatons).toBeGreaterThanOrEqual(r.atmosphericYieldMegatons / 2 - 1e-12);
      expect(r.blastYieldMegatons).toBeLessThanOrEqual(r.atmosphericYieldMegatons);
    }
    // The 30 m stony body at 20 km/s keeps 27 % of its energy at the
    // 15.3 km burst, so the blast is given the 73 % it lost.
    const grid = entry(30, 20_000, 45, 3_000);
    const f = ((grid.endVelocity as number) / 20_000) ** 2;
    expect(grid.blastYieldMegatons / grid.atmosphericYieldMegatons).toBeCloseTo(
      Math.max(f, 1 - f),
      12
    );
  });

  it("draws an airburst's rings at the high end at least as far as at the low end", () => {
    const r = entry(60, 15_000, 30, CHONDRITIC_DENSITY);
    const low = r.shockWaveRadii;
    const high = r.shockWaveRadiiHigh;
    expect(high.fivePsi as number).toBeGreaterThan(low.fivePsi);
    expect(high.onePsi as number).toBeGreaterThanOrEqual(low.onePsi);
    expect(high.lightDamage as number).toBeGreaterThanOrEqual(low.lightDamage);
    // Beyond three burst altitudes the two ends agree.
    const threeHeights = 3 * (r.burstAltitude as number);
    if ((low.lightDamage as number) > threeHeights) {
      expect(high.lightDamage).toBe(low.lightDamage);
    }
  });

  it('falls back to a whole body with no burst on inputs it cannot use', () => {
    const r = atmosphericEntry(m(0), mps(0), Pa(1e6));
    expect(r.regime).toBe('INTACT');
    expect(r.burstAltitude as number).toBe(0);
  });
});
