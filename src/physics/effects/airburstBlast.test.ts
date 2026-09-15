import { describe, expect, it } from 'vitest';
import { simulateImpact } from '../simulate.js';
import { deg, degreesToRadians, J, kgPerM3, m, mps, Pa } from '../units.js';
import {
  airburstBlastYield,
  airburstOverpressure,
  airburstOverpressureRange,
  airburstReach,
} from './airburstBlast.js';

/**
 * The Earth Impact Effects Program's air blast of an airburst, held to the
 * program itself: the printed overpressure, low and high ends, at the
 * benchmark campaign's distances (docs/BENCHMARK_PROTOCOL.md, read from
 * https://impact.ese.ic.ac.uk/map on 15 September 2026), for the same body on
 * the same target, through Nimbus's own entry. Class A: within 1 %.
 */

const MEGATON = 4.184e15;

interface ProgramCase {
  label: string;
  diameterM: number;
  densityKgM3: number;
  velocityKmS: number;
  angleDeg: number;
  targetDensity: number;
  /** [distance (km), low (Pa), high (Pa)] as the program prints them. */
  printed: readonly (readonly [number, number, number])[];
}

const CASES: readonly ProgramCase[] = [
  {
    // Tunguska's body: regular reflection out to ~83 km, Mach beyond.
    label: '60 m stony body at 15 km/s, 30°',
    diameterM: 60,
    densityKgM3: 3_000,
    velocityKmS: 15,
    angleDeg: 30,
    targetDensity: 2_750,
    printed: [
      [1, 46_410.324, 92_820.648],
      [10, 22_979.79, 45_959.58],
      [30, 5_788.945, 5_788.945],
      [100, 2_706.265, 2_706.265],
      [1_000, 229.099, 229.099],
    ],
  },
  {
    // Chelyabinsk's body with its strength from density: a burst at 34 km,
    // no Mach region.
    label: '17 m stony body at 19 km/s, 18°',
    diameterM: 17,
    densityKgM3: 3_000,
    velocityKmS: 19,
    angleDeg: 18,
    targetDensity: 2_750,
    printed: [
      [1, 1_080.594, 2_161.188],
      [100, 289.056, 578.112],
      [1_000, 22.57, 22.57],
    ],
  },
  {
    // The blast given the energy lost by the burst, not the energy kept.
    label: '30 m stony body at 20 km/s, 45°',
    diameterM: 30,
    densityKgM3: 3_000,
    velocityKmS: 20,
    angleDeg: 45,
    targetDensity: 2_500,
    printed: [
      [1, 7_581.414, 15_162.828],
      [30, 2_459.725, 4_919.45],
      [100, 640.377, 640.377],
      [3_000, 13.529, 13.529],
    ],
  },
  {
    // A burst at 285 m: the Mach region from a few hundred metres out.
    label: '100 m body of 2 000 kg/m³ at 20 km/s, 45°',
    diameterM: 100,
    densityKgM3: 2_000,
    velocityKmS: 20,
    angleDeg: 45,
    targetDensity: 2_500,
    printed: [
      [1, 13_626_173.474, 13_626_173.474],
      [10, 87_544.47, 87_544.47],
      [100, 2_363.944, 2_363.944],
      [1_000, 204.366, 204.366],
    ],
  },
];

const burst = (c: ProgramCase) => {
  const r = simulateImpact({
    impactorDiameter: m(c.diameterM),
    impactVelocity: mps(c.velocityKmS * 1_000),
    impactorDensity: kgPerM3(c.densityKgM3),
    targetDensity: kgPerM3(c.targetDensity),
    impactAngle: degreesToRadians(deg(c.angleDeg)),
  });
  return {
    regime: r.entry.regime,
    burstAltitude: r.entry.burstAltitude,
    blastYield: J(r.entry.blastYieldMegatons * MEGATON),
  };
};

describe('airburst blast — the Earth Impact Effects Program (Collins et al. 2005, 2017)', () => {
  for (const c of CASES) {
    it(`prints the program's overpressure for a ${c.label}`, () => {
      const b = burst(c);
      expect(b.regime).toBe('COMPLETE_AIRBURST');
      for (const [km, low, high] of c.printed) {
        const p = airburstOverpressureRange({
          groundRange: m(km * 1_000),
          burstAltitude: b.burstAltitude,
          blastYield: b.blastYield,
        });
        expect((p.low as number) / low, `${km.toString()} km, low`).toBeGreaterThan(0.99);
        expect((p.low as number) / low, `${km.toString()} km, low`).toBeLessThan(1.01);
        expect((p.high as number) / high, `${km.toString()} km, high`).toBeGreaterThan(0.99);
        expect((p.high as number) / high, `${km.toString()} km, high`).toBeLessThan(1.01);
      }
    });
  }

  it('gives the blast the larger of the energy kept and the energy lost', () => {
    expect(airburstBlastYield(J(100), 0.2) as number).toBeCloseTo(80, 12);
    expect(airburstBlastYield(J(100), 0.7) as number).toBeCloseTo(70, 12);
    expect(airburstBlastYield(J(100), 0.5) as number).toBeCloseTo(50, 12);
    expect(airburstBlastYield(J(0), 0.3) as number).toBe(0);
    expect(airburstBlastYield(J(100), Number.NaN) as number).toBe(0);
  });

  it('reaches each threshold where its own overpressure falls to it', () => {
    // 7.6 Mt at 9.8 km: 47 kPa under the burst, the Mach region from 86 km.
    const altitude = m(9_806);
    const blastYield = J(3.2e16);
    for (const threshold of [34_474, 20_000, 6_895, 3_447, 1_000, 200]) {
      const reach = airburstReach(Pa(threshold), altitude, blastYield);
      expect(reach as number).toBeGreaterThan(0);
      const at = (r: number) =>
        airburstOverpressure({ groundRange: m(r), burstAltitude: altitude, blastYield }) as number;
      expect(at((reach as number) * 0.999)).toBeGreaterThanOrEqual(threshold);
      expect(at((reach as number) * 1.001)).toBeLessThan(threshold);
    }
  });

  it('keeps the high end at twice the low within three burst altitudes, and equal beyond', () => {
    const input = { burstAltitude: m(20_000), blastYield: J(4e15) };
    const near = airburstOverpressureRange({ ...input, groundRange: m(59_000) });
    expect(near.high as number).toBeCloseTo(2 * (near.low as number), 9);
    const far = airburstOverpressureRange({ ...input, groundRange: m(61_000) });
    expect(far.high).toBe(far.low);
    // The high end's ring reaches at least as far, and no farther than the
    // edge of the zone unless the low end is already beyond it.
    const low = airburstReach(Pa(1_000), input.burstAltitude, input.blastYield, 'low') as number;
    const high = airburstReach(Pa(1_000), input.burstAltitude, input.blastYield, 'high') as number;
    expect(high).toBeGreaterThanOrEqual(low);
  });

  it('draws no ring for a threshold the ground never sees', () => {
    // A 0.3 Mt burst at 34 km: about 1 kPa under the burst.
    expect(airburstReach(Pa(3_447), m(34_000), J(0.3 * MEGATON)) as number).toBe(0);
    expect(airburstReach(Pa(1_000), m(10_000), J(0)) as number).toBe(0);
    expect(airburstReach(Pa(0), m(10_000), J(MEGATON)) as number).toBe(0);
  });

  it('stops a ring at half the circumference of the Earth', () => {
    const reach = airburstReach(Pa(1e-3), m(20_000), J(1e24)) as number;
    expect(reach).toBeCloseTo(Math.PI * 6_371_000, 0);
  });

  it('grows the reach with the energy at a fixed altitude', () => {
    let previous = 0;
    for (const megatons of [0.1, 0.5, 1, 5, 10, 50]) {
      const reach = airburstReach(Pa(6_895), m(12_000), J(megatons * MEGATON)) as number;
      expect(reach).toBeGreaterThanOrEqual(previous);
      previous = reach;
    }
    expect(previous).toBeGreaterThan(0);
  });
});
