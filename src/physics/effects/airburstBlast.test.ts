import { describe, expect, it } from 'vitest';
import { simulateImpact } from '../simulate.js';
import { deg, degreesToRadians, J, kgPerM3, m, mps, Pa } from '../units.js';
import {
  airburstBlastYield,
  airburstOverpressure,
  airburstOverpressureRange,
  airburstReach,
  DEFAULT_GROUND_BLAST,
  DEFAULT_MACH_TRANSITION,
  groundImpactOverpressure,
  groundImpactReach,
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

/**
 * The program's passage from regular reflection to the Mach region, held to
 * the overpressures it was read off (rule 129 of
 * validation/machBlendRules.ts, 16 September 2026). Each body is fed the
 * program's own printed burst altitude and the yield scale its innermost
 * printed point gives through 2017 Eq. 7, so what is held here is the blast
 * alone, free of BM-13. These points are code verification, not held out.
 */
interface BlendBody {
  label: string;
  burstAltitudeM: number;
  /** Cube-root yield scale (m per m of a 1 kt burst). */
  scale: number;
  /** [distance (km), low (Pa)] as the program prints them. */
  printed: readonly (readonly [number, number])[];
}

const BLEND_BODIES: readonly BlendBody[] = [
  {
    // z₁ 492.5 m: the blend rises, 46.2 to 69.7 km — the knee.
    label: '29.06 m body of 7 087 kg/m³ at 19.19 km/s, 30.63°',
    burstAltitudeM: 7_264.68,
    scale: 14.749584,
    printed: [
      [25, 4_994.517],
      [44, 2_380.637],
      [46, 2_250.436],
      [48, 2_290.698],
      [50, 2_349.635],
      [61, 2_673.788],
      [68, 2_880.067],
      [70, 2_913.007],
      [76, 2_636.11],
    ],
  },
  {
    // z₁ 147.5 m: the blend falls, 1.51 to 3.74 km.
    label: '28.139 m body of 7 800 kg/m³ at 20 km/s, 45°',
    burstAltitudeM: 2_302.791,
    scale: 15.611072,
    printed: [
      [0.5, 741_294.68],
      [1.9667, 442_429.88],
      [2.6223, 352_238.815],
      [3.409, 244_012.289],
      [3.9334, 178_648.127],
    ],
  },
  {
    // z₁ 293.9 m: the blend falls, 5.32 to 17.75 km.
    label: '53.917 m body of 3 000 kg/m³ at 20 km/s, 45°',
    burstAltitudeM: 6_446.252,
    scale: 21.936946,
    printed: [
      [4.5, 95_105.746],
      [8.6509, 68_281.195],
      [11.5345, 55_562.924],
      [17.3018, 30_125.942],
    ],
  },
  {
    // z₁ 427.8 m: the blend falls, 19.37 to 42.53 km.
    label: '47.904 m body of 3 000 kg/m³ at 20 km/s, 45°',
    burstAltitudeM: 8_251.259,
    scale: 19.287784,
    printed: [
      [12, 20_405.652],
      [23.2103, 10_059.425],
      [35.5892, 8_301.839],
      [46.4207, 6_457.753],
    ],
  },
];

const KILOTON = 4.184e12;
const blendInput = (b: BlendBody) => ({
  burstAltitude: m(b.burstAltitudeM),
  blastYield: J(b.scale ** 3 * KILOTON),
});

describe('airburst blast — the program’s passage to the Mach region (rule 129)', () => {
  for (const b of BLEND_BODIES) {
    it(`prints the program's overpressure across the blend for a ${b.label}`, () => {
      for (const [km, printed] of b.printed) {
        const p = airburstOverpressure({
          ...blendInput(b),
          groundRange: m(km * 1_000),
          machTransition: 'program',
        }) as number;
        expect(Math.abs(p / printed - 1), `${km.toString()} km`).toBeLessThan(1e-4);
      }
    });
  }

  it('steps where the program blends, which is what the published relations do', () => {
    // Either side of the knee's r_m1, 57.94 km: the program prints 2 526 Pa at
    // 56 km and 2 585 Pa at 58; the step gives 0.70 and 1.42 of them.
    const knee = BLEND_BODIES[0];
    if (knee === undefined) throw new Error('no knee');
    const published = (km: number) =>
      airburstOverpressure({
        ...blendInput(knee),
        groundRange: m(km * 1_000),
        machTransition: 'published',
      }) as number;
    expect(published(56) / 2_526.446).toBeLessThan(0.71);
    expect(published(58) / 2_585.383).toBeGreaterThan(1.41);
    // Rule 131 adopted the program's passage.
    expect(DEFAULT_MACH_TRANSITION).toBe('program');
  });

  it('is continuous across both ends of the blend', () => {
    for (const b of BLEND_BODIES) {
      const at = (r: number) =>
        airburstOverpressure({
          ...blendInput(b),
          groundRange: m(r),
          machTransition: 'program',
        }) as number;
      // Sample finely; no neighbouring pair may differ by more than the
      // steepest slope of the relations allows over the step.
      const z1 = b.burstAltitudeM / b.scale;
      const edge = (550 * z1) / (1.2 * (550 - z1));
      const half = 0.00328 * z1 * z1;
      for (const end of [edge - half, edge + half]) {
        const r = end * b.scale;
        const below = at(r * (1 - 1e-9));
        const above = at(r * (1 + 1e-9));
        expect(
          Math.abs(above / below - 1),
          `${b.label} at ${(r / 1_000).toFixed(3)} km`
        ).toBeLessThan(1e-6);
      }
    }
  });

  it('reaches each threshold at the farthest range its own overpressure holds it, on a rising blend too', () => {
    for (const b of BLEND_BODIES) {
      const input = blendInput(b);
      const at = (r: number) =>
        airburstOverpressure({ ...input, groundRange: m(r), machTransition: 'program' }) as number;
      const samples = Array.from({ length: 4_000 }, (_, i) => (i + 1) * 30 * b.scale);
      const peakOutside = (r: number) => samples.filter((x) => x > r * 1.001).map(at);
      for (const threshold of [1e6, 3e5, 6e4, 3e4, 9e3, 6.5e3, 2.9e3, 2.6e3, 2.3e3, 1e3]) {
        const reach = airburstReach(
          Pa(threshold),
          input.burstAltitude,
          input.blastYield,
          'low',
          'program'
        ) as number;
        if (reach === 0) {
          expect(samples.map(at).every((p) => p < threshold)).toBe(true);
          continue;
        }
        expect(at(reach * 0.9999), `${b.label}, ${threshold.toString()} Pa`).toBeGreaterThanOrEqual(
          threshold * (1 - 1e-6)
        );
        expect(
          Math.max(...peakOutside(reach)),
          `${b.label}, ${threshold.toString()} Pa`
        ).toBeLessThan(threshold);
      }
    }
  });
});

/**
 * The program's blast of an impact that reaches the ground, held to the
 * overpressures it was read off (rule 138 of validation/groundBlastRules.ts,
 * 16 September 2026): a 100 m body of 3 000 kg/m³ at 12 km/s on a sedimentary
 * target, fed Nimbus's own entry. Code verification, not held out.
 */
describe('airburst blast — an impact that reaches the ground, as the program reads it (rule 138)', () => {
  const body = (angleDeg: number, diameterM = 100, densityKgM3 = 3_000, speed = 12_000) =>
    simulateImpact({
      impactorDiameter: m(diameterM),
      impactVelocity: mps(speed),
      impactorDensity: kgPerM3(densityKgM3),
      targetDensity: kgPerM3(2_500),
      impactAngle: degreesToRadians(deg(angleDeg)),
    });
  const ground = (r: ReturnType<typeof body>) => {
    const gf = r.entry.energyFractionToGround;
    return {
      virtualBurstAltitude: r.entry.virtualBurstAltitude,
      blastYield: J((r.impactor.kineticEnergy as number) * Math.max(gf, 1 - gf)),
    };
  };
  const PRINTED: readonly (readonly [number, number, number])[] = [
    // [angle (°), range (km), low end (Pa)]
    [45, 100, 1_213.663],
    [60, 100, 633.687],
    [75, 100, 323.847],
    [90, 100, 240.354],
    [90, 0.3, 1_630_234.705],
    [90, 1, 121_059.381],
    [90, 3, 15_703.423],
    [90, 10, 2_866.603],
    [90, 30, 831.993],
    [90, 300, 79.499],
    [60, 0.3, 13_840_568.333],
    [60, 1, 916_448.257],
    [60, 3, 88_751.219],
    [60, 10, 10_408.339],
    [60, 30, 2_383.216],
    [60, 300, 205.785],
  ];

  it("prints the program's overpressure at every angle and range, a steeper impact blasting less", () => {
    for (const [angle, km, printed] of PRINTED) {
      const r = body(angle);
      expect(r.entry.regime).toBe('PARTIAL_AIRBURST');
      expect(r.entry.virtualBurstAltitude as number).toBeLessThan(0);
      const p = groundImpactOverpressure({ ...ground(r), groundRange: m(km * 1_000) }) as number;
      expect(Math.abs(p / printed - 1), `${angle.toString()}° at ${km.toString()} km`).toBeLessThan(
        0.01
      );
    }
  });

  it('draws no blast where the crossover is not positive, which the program answers with an error', () => {
    for (const diameter of [30, 40]) {
      const r = body(90, diameter, 8_000, 11_200);
      expect(groundImpactOverpressure({ ...ground(r), groundRange: m(10_000) }) as number).toBe(0);
      expect(
        groundImpactReach(Pa(3_447), ground(r).virtualBurstAltitude, ground(r).blastYield)
      ).toBe(0);
    }
    // A body that never breaks, which the program refuses too, is read on the ground.
    const whole = body(90, 3, 8_000, 11_200);
    expect(whole.entry.regime).toBe('INTACT');
    expect(whole.entry.virtualBurstAltitude as number).toBe(0);
    expect(
      groundImpactOverpressure({ ...ground(whole), groundRange: m(300) }) as number
    ).toBeGreaterThan(0);
  });

  it('reaches each threshold where its own overpressure falls to it', () => {
    const g = ground(body(60));
    for (const threshold of [34_474, 6_895, 3_447, 200]) {
      const reach = groundImpactReach(
        Pa(threshold),
        g.virtualBurstAltitude,
        g.blastYield
      ) as number;
      const at = (r: number) => groundImpactOverpressure({ ...g, groundRange: m(r) }) as number;
      expect(at(reach * 0.999)).toBeGreaterThanOrEqual(threshold);
      expect(at(reach * 1.001)).toBeLessThan(threshold);
    }
    // Rule 144 of validation/entryProgramRules.ts adopted the program's.
    expect(DEFAULT_GROUND_BLAST).toBe('program');
  });
});
