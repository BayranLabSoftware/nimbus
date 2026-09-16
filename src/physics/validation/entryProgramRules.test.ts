import { describe, expect, it } from 'vitest';
import { atmosphericEntry, DEFAULT_ENTRY_EQUATIONS } from '../effects/atmosphericEntry.js';
import { deg, degreesToRadians, J, kgPerM3, m, mps } from '../units.js';
import {
  ENTRY_PROGRAM_BODIES,
  ENTRY_PROGRAM_MIN_AIRBURSTS,
  ENTRY_PROGRAM_MIN_GROUND_BODIES,
  ENTRY_PROGRAM_MIN_GROUND_POINTS,
  entryProgramAltitudeAgrees,
  entryProgramPressureAgrees,
  entryProgramVerdict,
  type EntryProgramItem,
} from './entryProgramRules.js';

const entry = (D: number, rho: number, vKmS: number, angle: number, eq: 'paper' | 'program') => {
  const v0 = vKmS * 1_000;
  return atmosphericEntry(
    m(D),
    mps(v0),
    undefined,
    kgPerM3(rho),
    J(0.5 * (Math.PI / 6) * D ** 3 * rho * v0 * v0),
    degreesToRadians(deg(angle)),
    eq
  );
};

describe('rule 141: where the program parts from the paper', () => {
  it('breaks the 39 m iron where the program prints, on a doubled I_f (BM-13)', () => {
    // Printed by the program: 11 255 m. The paper's Eq. 11 gives 11 447 m.
    expect(entry(39.146, 7_853, 13.647, 49.88, 'program').breakupAltitude as number).toBeCloseTo(
      11_256,
      -1
    );
    expect(entry(39.146, 7_853, 13.647, 49.88, 'paper').breakupAltitude as number).toBeCloseTo(
      11_447,
      -1
    );
  });

  it('slows a body that breaks low more, without the −3(l/H)² of Eq. 20', () => {
    const program = entry(39.146, 7_853, 13.647, 49.88, 'program').endVelocity as number;
    // What the program's blast implies on that body: 9.688 km/s.
    expect(program / 1_000).toBeCloseTo(9.688, 1);
    // A body that breaks high hardly notices the term.
    const high = (eq: 'paper' | 'program') => entry(100, 3_000, 20, 45, eq).endVelocity as number;
    expect(Math.abs(high('program') / high('paper') - 1)).toBeLessThan(0.002);
  });

  it('is not the default until rule 144 says so', () => {
    expect(DEFAULT_ENTRY_EQUATIONS).toBe('paper');
  });
});

describe('rule 143: the held-out check', () => {
  it('draws eight slow bodies, four general and four airbursts', () => {
    const count = (kind: string) => ENTRY_PROGRAM_BODIES.filter((b) => b.kind === kind).length;
    expect([count('slow'), count('general'), count('airburst')]).toEqual([8, 4, 4]);
  });

  it('agrees within 1 % plus the printed rounding', () => {
    expect(entryProgramPressureAgrees(1_000, 1_010)).toBe(true);
    expect(entryProgramPressureAgrees(1_000, 1_010.001)).toBe(false);
    expect(entryProgramAltitudeAgrees(11_255, 11_367)).toBe(true);
    expect(entryProgramAltitudeAgrees(11_255, 11_369)).toBe(false);
  });
});

describe('rule 144: what decides', () => {
  const item = (body: number, over: Partial<EntryProgramItem> = {}): EntryProgramItem => ({
    body,
    kind: 'slow',
    what: 'overpressure',
    agrees: true,
    ...over,
  });
  const ground = Array.from({ length: ENTRY_PROGRAM_MIN_GROUND_POINTS }, (_, i) =>
    item(1 + (i % ENTRY_PROGRAM_MIN_GROUND_BODIES))
  );
  const airbursts = Array.from({ length: ENTRY_PROGRAM_MIN_AIRBURSTS }, (_, i) =>
    item(20 + i, { kind: 'airburst' })
  );

  it('passes when everything compared agrees and enough is compared', () => {
    expect(entryProgramVerdict([...ground, ...airbursts]).heldOutPasses).toBe(true);
  });

  it('fails on one disagreement, a regime that differs, or too little', () => {
    expect(
      entryProgramVerdict([...ground, ...airbursts, item(1, { agrees: false })]).heldOutPasses
    ).toBe(false);
    expect(
      entryProgramVerdict([...ground, ...airbursts, item(2, { what: 'regime', agrees: false })])
        .heldOutPasses
    ).toBe(false);
    expect(entryProgramVerdict([...ground, ...airbursts.slice(1)]).heldOutPasses).toBe(false);
    expect(
      entryProgramVerdict([...ground.slice(1), ...airbursts, item(3, { agrees: null })])
        .heldOutPasses
    ).toBe(false);
  });
});
