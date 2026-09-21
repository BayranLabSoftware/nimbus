import { describe, expect, it } from 'vitest';
import { simulateImpact, type ImpactScenarioInput } from '../simulate.js';
import { impactOverpressureAt, impactThermalExposureAt } from '../events/impact/impactField.js';
import { searchFieldJump } from './fieldJump.js';
import {
  FIELD_HELD_OUT_SEED,
  FIELD_JUMP_GATE,
  FIELD_JUMP_HALVINGS,
  FIELD_JUMP_SHARE,
  FIELD_JUMP_STEEP_DEPTH,
} from './fieldJumpRules.js';

/**
 * Rules 660 to 666: the positive controls of rule 666, and the cases of
 * rule 661 read by the definition.
 */

/** Rule 662 on a function of the size factor, over the harness's own step. */
const search = (f: (k: number) => number): ReturnType<typeof searchFieldJump> => {
  const a = f(1);
  const b = f(1.001);
  return searchFieldJump(f, 1, 1.001, a, b, FIELD_JUMP_SHARE * Math.max(Math.abs(a), Math.abs(b)));
};

const grownImpact = (input: ImpactScenarioInput, k: number): ReturnType<typeof simulateImpact> =>
  simulateImpact({ ...input, impactorDiameter: (Number(input.impactorDiameter) * k) as never });

describe('rules 660 to 666: the field read as the limit continuity is', () => {
  it('fixes its numbers', () => {
    expect(FIELD_JUMP_GATE).toBe(0.01);
    expect(FIELD_JUMP_SHARE).toBe(0.01);
    expect(FIELD_JUMP_HALVINGS).toBe(30);
    expect(FIELD_JUMP_STEEP_DEPTH).toBe(20);
    expect(FIELD_HELD_OUT_SEED).toBe('benchmark-2026-09-21-heldout-field');
    // The deepest interval, as a share of the size, and what a double holds.
    expect(0.001 / 2 ** FIELD_JUMP_HALVINGS).toBeCloseTo(9.3e-13, 14);
    expect(0.001 / 2 ** FIELD_JUMP_HALVINGS / Number.EPSILON).toBeGreaterThan(4_000);
  });

  it('finds a step of 1.2 % and one of 30 %', () => {
    for (const size of [0.012, 0.3]) {
      const found = search((k) => (k < 1.0004 ? 100 : 100 * (1 + size)));
      expect(found.kind).toBe('jump');
      if (found.kind === 'jump') expect(found.at).toBeCloseTo(1.0004, 9);
    }
  });

  it('finds a step hidden under a steep slope', () => {
    const found = search((k) => 100 * k ** 150 + (k < 1.0007 ? 0 : 2));
    expect(found.kind).toBe('jump');
  });

  it('reads a kink, an elasticity of 150 and a square-root birth as steep', () => {
    const kink = (k: number): number =>
      k < 1.00025 ? 100 * (1 + 1.4 * (k - 1)) : 100 * (1 + 1.4 * 0.00025 + 70 * (k - 1.00025));
    const elastic = (k: number): number => 100 * k ** 150;
    const birth = (k: number): number => 100 * Math.sqrt(Math.max(0, k - 1.0005) / 0.0005);
    for (const f of [kink, elastic, birth]) {
      const found = search(f);
      expect(found.kind).toBe('steep');
      expect(found.depth).toBeLessThanOrEqual(FIELD_JUMP_STEEP_DEPTH);
    }
  });

  it('calls a search that cannot compute a value unresolved', () => {
    const found = search((k) => (k > 1.0003 && k < 1.0006 ? NaN : 100 * k ** 150));
    expect(found.kind).toBe('unresolved');
  });

  it('finds B-089, the entry’s seam, as a jump in the field, on the program’s equations', () => {
    // The seam is the program's equations', and is read on them.
    const b089 = {
      entryEquations: 'program',
      impactorDiameter: 30.35083106505634,
      impactVelocity: 13632.485304726288,
      impactorDensity: 9127.968714106828,
      targetDensity: 2456.329144537449,
      impactAngle: 0.2988136637231071,
    } as unknown as ImpactScenarioInput;
    // Half a step short of the seam, at 1.0065901 times the body.
    const base = grownImpact(b089, 1.00608705494897).inputs;
    const at1km = (k: number): number => impactOverpressureAt(grownImpact(base, k), 1_000);
    expect(Math.abs(at1km(1.001) / at1km(1) - 1)).toBeGreaterThan(0.7);
    const found = search(at1km);
    expect(found.kind).toBe('jump');
    if (found.kind === 'jump') expect(found.at).toBeCloseTo(1.0005, 6);
  });

  it('reads rule 661’s cases as steep: the 39.4 m kink, the Mach blend, the horizon', () => {
    const kink = {
      impactorDiameter: 39.4316621958164,
      impactVelocity: 55107.46375937015,
      impactorDensity: 1580.814961809665,
      targetDensity: 1471.6115202754736,
      impactAngle: 1.2076677922414878,
    } as unknown as ImpactScenarioInput;
    const blend = {
      impactorDiameter: 46.26882162476009,
      impactVelocity: 18413.339075632393,
      impactorDensity: 2042.4971039174125,
      targetDensity: 3188.624498434365,
      impactAngle: 1.157068300869253,
      waterDepth: 7.66550930564781,
    } as unknown as ImpactScenarioInput;
    const horizon = {
      impactorDiameter: 2822.9654428201893,
      impactVelocity: 33730.428830720484,
      impactorDensity: 9605.23999936413,
      targetDensity: 4101.182922720909,
      impactAngle: 1.3206019883151725,
    } as unknown as ImpactScenarioInput;
    const cases: [ImpactScenarioInput, (k: number) => number][] = [
      [kink, (k) => impactOverpressureAt(grownImpact(kink, k), 100_000)],
      [blend, (k) => impactOverpressureAt(grownImpact(blend, k), 100_000)],
      [horizon, (k) => impactThermalExposureAt(grownImpact(horizon, k), 1_000_000)],
    ];
    for (const [, f] of cases) {
      // Each moved by more than rule 624's 5 % ...
      expect(Math.abs(f(1.001) / f(1) - 1)).toBeGreaterThan(0.05);
      // ... and none jumps.
      const found = search(f);
      expect(found.kind).toBe('steep');
      expect(found.depth).toBeLessThanOrEqual(FIELD_JUMP_STEEP_DEPTH);
    }
  });

  it('is what the harness reads, and the keys G5 leaves out', async () => {
    const { NOT_READ_BY_G5 } = await import('../../../scripts/benchmark/invariants.js');
    expect(NOT_READ_BY_G5.slice(0, 3)).toEqual([
      'continuous, as it was',
      'continuous (field), as rule 624 read it',
      'steep, not a jump (field)',
    ]);
  });
});
