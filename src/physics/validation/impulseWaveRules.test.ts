import { describe, expect, it } from 'vitest';
import {
  IMPULSE_WAVE_ADDENDUM_MIN_ANGLE_DEG,
  IMPULSE_WAVE_TESTED,
  impulseWaveDimensionless,
  outsideTestedRange,
  type ImpulseWaveSlide,
} from '../effects/impulseWave.js';
import { DEFAULT_LANDSLIDE_WAVE_LAW } from '../events/landslide/simulate.js';
import {
  IMPULSE_WAVE_MIN_NIMBUS_CASES,
  IMPULSE_WAVE_MIN_TOOL_CASES,
  IMPULSE_WAVE_SEED,
  IMPULSE_WAVE_TOLERANCE,
  IMPULSE_WAVE_TOOL_RANGES,
  impulseWaveAgrees,
  impulseWaveHeldOutCases,
  impulseWaveL2Scenarios,
  impulseWaveToolOutside,
  impulseWaveVerdict,
} from './impulseWaveRules.js';
import { SLIDE_WAVE_EVENTS } from './slideWaveSetData.js';

describe('rules 162 to 167: the impulse wave manual against its own tool', () => {
  it('draws the same hundred cases at every call, from the seed the rules name', () => {
    expect(IMPULSE_WAVE_SEED).toBe(1_709_026);
    const a = impulseWaveHeldOutCases();
    const b = impulseWaveHeldOutCases();
    expect(a).toEqual(b);
    expect(a.tool).toHaveLength(60);
    expect(a.nimbus).toHaveLength(40);
  });

  it("draws the tool's slides across the ranges rule 164 names", () => {
    for (const { slide } of impulseWaveHeldOutCases().tool) {
      expect(slide.impactVelocityMS).toBeGreaterThanOrEqual(0.5);
      expect(slide.impactVelocityMS).toBeLessThanOrEqual(150);
      expect(slide.volumeM3).toBeGreaterThanOrEqual(1e2);
      expect(slide.volumeM3).toBeLessThanOrEqual(1e11);
      expect(slide.depthM).toBeGreaterThanOrEqual(1);
      expect(slide.depthM).toBeLessThanOrEqual(1_000);
      expect(slide.angleDeg).toBeGreaterThanOrEqual(5);
      expect(slide.angleDeg).toBeLessThanOrEqual(90);
    }
  });

  it("runs Nimbus's scenarios under the candidate, subaerial, in open water", () => {
    for (const { scenario } of impulseWaveHeldOutCases().nimbus) {
      expect(scenario.regime).toBe('subaerial');
      expect(scenario.waveLaw).toBe('impulseWaveManual');
      expect(scenario).not.toHaveProperty('confinedBasinArea');
    }
  });

  it("runs L2's forty-three rows on their inputs, and carries no record", () => {
    const rows = impulseWaveL2Scenarios();
    expect(rows).toHaveLength(SLIDE_WAVE_EVENTS.length);
    expect(rows).toHaveLength(43);
    for (const { scenario } of rows) {
      for (const record of ['waveHeightM', 'runUpM', 'peakHeightM']) {
        expect(scenario).not.toHaveProperty(record);
      }
    }
  });

  it("colours the tool's ranges as the module's limits, and reads the angle as the addendum does", () => {
    expect(IMPULSE_WAVE_TOOL_RANGES.F).toEqual(IMPULSE_WAVE_TESTED.froude);
    expect(IMPULSE_WAVE_TOOL_RANGES.S).toEqual(IMPULSE_WAVE_TESTED.relativeThickness);
    expect(IMPULSE_WAVE_TOOL_RANGES.M).toEqual(IMPULSE_WAVE_TESTED.relativeMass);
    expect(IMPULSE_WAVE_TOOL_RANGES.V).toEqual(IMPULSE_WAVE_TESTED.relativeVolume);
    expect(IMPULSE_WAVE_TOOL_RANGES.D).toEqual(IMPULSE_WAVE_TESTED.relativeDensity);
    expect(IMPULSE_WAVE_TOOL_RANGES.B).toEqual(IMPULSE_WAVE_TESTED.relativeWidth);
    expect(IMPULSE_WAVE_TOOL_RANGES.P).toEqual(IMPULSE_WAVE_TESTED.impulseProduct);
    expect(IMPULSE_WAVE_ADDENDUM_MIN_ANGLE_DEG).toBe(15);
    const slide: ImpulseWaveSlide = {
      froude: 2,
      thicknessM: 20,
      widthM: 150,
      volumeM3: 600_000,
      densityKgM3: 1_600,
      angleDeg: 22,
      depthM: 60,
    };
    const n = impulseWaveDimensionless(slide);
    expect(impulseWaveToolOutside({ ...n, angleDeg: slide.angleDeg })).toEqual(
      outsideTestedRange(slide)
    );
  });

  it("holds a number to the tool within G1's 1 %, zero to zero", () => {
    expect(IMPULSE_WAVE_TOLERANCE).toBe(0.01);
    expect(impulseWaveAgrees(10.09, 10)).toBe(true);
    expect(impulseWaveAgrees(10.11, 10)).toBe(false);
    expect(impulseWaveAgrees(0, 0)).toBe(true);
    expect(impulseWaveAgrees(1e-9, 0)).toBe(false);
    expect(impulseWaveAgrees(Number.NaN, 1)).toBe(false);
  });

  it('adopts only on enough answered cases, every number and every limit agreeing', () => {
    const ok = { numbers: [true, true], limits: true };
    const cases = (n: number, c = ok): (typeof ok | null)[] => Array.from({ length: n }, () => c);
    const pass = impulseWaveVerdict({
      tool: cases(IMPULSE_WAVE_MIN_TOOL_CASES),
      nimbus: cases(IMPULSE_WAVE_MIN_NIMBUS_CASES),
      l2: cases(43),
      l2RowsExpected: 43,
    });
    expect(pass.heldOutPasses).toBe(true);
    expect(
      impulseWaveVerdict({
        tool: [...cases(IMPULSE_WAVE_MIN_TOOL_CASES - 1), null],
        nimbus: cases(40),
        l2: cases(43),
        l2RowsExpected: 43,
      }).heldOutPasses
    ).toBe(false);
    expect(
      impulseWaveVerdict({
        tool: cases(60),
        nimbus: cases(40),
        l2: [...cases(42), null],
        l2RowsExpected: 43,
      }).heldOutPasses
    ).toBe(false);
    expect(
      impulseWaveVerdict({
        tool: [...cases(59), { numbers: [true, false], limits: true }],
        nimbus: cases(40),
        l2: cases(43),
        l2RowsExpected: 43,
      }).heldOutPasses
    ).toBe(false);
    expect(
      impulseWaveVerdict({
        tool: cases(60),
        nimbus: [...cases(39), { numbers: [true], limits: false }],
        l2: cases(43),
        l2RowsExpected: 43,
      }).heldOutPasses
    ).toBe(false);
  });

  it('is not yet the default: the rules are pushed before the tool is run', () => {
    expect(DEFAULT_LANDSLIDE_WAVE_LAW).toBe('project');
  });
});
