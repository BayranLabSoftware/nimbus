import { describe, expect, it } from 'vitest';
import { atmosphericEntry } from '../effects/atmosphericEntry.js';
import {
  DEFAULT_IMPACT_TSUNAMI_LAW,
  programTsunamiAmplitude,
  programTsunamiReferenceAmplitude,
  programWaterCraterDiameter,
} from '../events/tsunami/impactProgram.js';
import { deg, degreesToRadians, J, kgPerM3, m, mps } from '../units.js';
import {
  IMPACT_TSUNAMI_BODIES,
  impactTsunamiVerdict,
  tsunamiRingAgreement,
} from './impactTsunamiRules.js';

const body = (L: number, rho: number, vKmS: number, angleDeg: number) => {
  const v0 = vKmS * 1_000;
  const angle = degreesToRadians(deg(angleDeg));
  const e = atmosphericEntry(
    m(L),
    mps(v0),
    undefined,
    kgPerM3(rho),
    J(0.5 * (Math.PI / 6) * L ** 3 * rho * v0 * v0),
    angle
  );
  return programWaterCraterDiameter({
    impactorDiameter: m(L),
    impactorDensity: kgPerM3(rho),
    impactVelocity: e.endVelocity,
    impactAngle: angle,
  });
};

describe("rule 150: the program's wave, held to what it drew", () => {
  it('draws the 1, 10 and 100 m rings of a 500 m stone in 4 km of water', () => {
    // The program: 7 670.96, 767.10 and 76.71 km, and no 1 000 m ring.
    const crater = body(500, 3_000, 20, 45);
    const at = (km: number) => programTsunamiAmplitude(crater, m(4_000), m(km * 1_000)) as number;
    expect(at(7_670.958613)).toBeCloseTo(1, 4);
    expect(at(767.0958613)).toBeCloseTo(10, 3);
    expect(at(76.70958613)).toBeCloseTo(100, 2);
    expect(programTsunamiReferenceAmplitude(crater, m(4_000)) as number).toBeLessThan(1_000);
  });

  it('holds the wave to the water column in shallow water, and so to its depth', () => {
    // The program: 1 046.75 km for a metre in 100 m of water, 10.47 in 1 000.
    const crater = body(500, 3_000, 20, 45);
    const at = (km: number) => programTsunamiAmplitude(crater, m(100), m(km * 1_000)) as number;
    expect(at(1_046.746972)).toBeCloseTo(1, 3);
    expect(programTsunamiReferenceAmplitude(crater, m(100)) as number).toBe(100);
  });

  it('is not the default until rule 153 says so', () => {
    expect(DEFAULT_IMPACT_TSUNAMI_LAW).toBe('wunnemann');
  });
});

describe('rules 152 and 153', () => {
  it('draws fourteen bodies', () => {
    expect(IMPACT_TSUNAMI_BODIES).toHaveLength(14);
  });

  it('compares a ring beyond the crater, expects none inside it, and sets the cap apart', () => {
    expect(tsunamiRingAgreement(76_709, 10_468, 76_710)).toBe('agrees');
    expect(tsunamiRingAgreement(76_709, 10_468, 78_000)).toBe('departs');
    expect(tsunamiRingAgreement(10_468, 10_468, 0)).toBe('agrees');
    expect(tsunamiRingAgreement(10_468, 10_468, 10_468)).toBe('departs');
    expect(tsunamiRingAgreement(22_856_386, 18_070, 2_211)).toBe('apart');
  });

  it('passes only when enough is compared and nothing departs', () => {
    const body3 = ['agrees', 'agrees', 'agrees'] as const;
    const ten = Array.from({ length: 10 }, () => [...body3]);
    expect(impactTsunamiVerdict(ten).heldOutPasses).toBe(true);
    expect(impactTsunamiVerdict([...ten.slice(1), null]).heldOutPasses).toBe(false);
    expect(impactTsunamiVerdict([...ten, ['departs']]).heldOutPasses).toBe(false);
  });
});
