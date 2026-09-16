import { describe, expect, it } from 'vitest';
import {
  meetsL2,
  SLIDE_WAVE_BIAS_BOUND,
  SLIDE_WAVE_CALIBRATED_ON,
  SLIDE_WAVE_DEPTH_RADIUS_M,
  SLIDE_WAVE_DEPTH_SOURCE,
  SLIDE_WAVE_DEPTH_SOURCE_REJECTED,
  SLIDE_WAVE_MARINE,
  SLIDE_WAVE_MIN_EVENTS,
  SLIDE_WAVE_PEAK_BAND,
  SLIDE_WAVE_PEAK_MIDPOINT,
  SLIDE_WAVE_RUNUP_AMPLIFICATION,
  meetsL2AgainstPeak,
  SLIDE_WAVE_PRINTED_WHILE_COUNTING,
  SLIDE_WAVE_SEEN_WHILE_LOOKING,
  SLIDE_WAVE_SIGMA_BOUND,
  SLIDE_WAVE_SOURCE_SHA256,
} from './slideWaveRules.js';

describe('rule 118: the set is arithmetic on a file, not a list somebody wrote', () => {
  it('names the catalogue by its checksum, so the file cannot be swapped', () => {
    expect(SLIDE_WAVE_SOURCE_SHA256).toHaveLength(64);
    expect(SLIDE_WAVE_SOURCE_SHA256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('drops every event this project is calibrated on', () => {
    // Anak Krakatau set the subaerial prefactor, Storegga the submarine one,
    // Vaiont the confined-basin factor; Lituya ships as a preset. None of the
    // four can score a model they chose.
    expect([...SLIDE_WAVE_CALIBRATED_ON].sort()).toEqual([
      'krakatau',
      'lituya',
      'storegga',
      'vaiont',
      'vajont',
    ]);
  });

  it('keeps only water a bathymetry mosaic can reach', () => {
    expect([...SLIDE_WAVE_MARINE].sort()).toEqual(['EM', 'OM']);
    expect(SLIDE_WAVE_MARINE).not.toContain('IW');
  });
});

describe('rule 119: the depth, and the instrument that was replaced', () => {
  it('names GMRT, and names what it replaced and why', () => {
    expect(SLIDE_WAVE_DEPTH_SOURCE).toContain('GMRT');
    expect(SLIDE_WAVE_DEPTH_SOURCE).toContain('10.1029/2008GC002332');
    expect(SLIDE_WAVE_DEPTH_SOURCE_REJECTED).toContain('Terrain Tiles');
    expect(SLIDE_WAVE_DEPTH_SOURCE_REJECTED).toContain('Sognefjord');
  });

  it('searches five kilometres around the event', () => {
    expect(SLIDE_WAVE_DEPTH_RADIUS_M).toBe(5_000);
  });
});

describe('what was seen before the rules were fixed, and is declared', () => {
  it('names the thirty NCEI events whose largest height was printed', () => {
    expect(SLIDE_WAVE_SEEN_WHILE_LOOKING).toHaveLength(30);
    // Lituya Bay 1958 is among them and is also calibrated on: doubly out.
    expect(SLIDE_WAVE_SEEN_WHILE_LOOKING.some(([y]) => y === 1958)).toBe(true);
  });

  it('names the four catalogue rows whose values were printed while counting', () => {
    expect(SLIDE_WAVE_PRINTED_WHILE_COUNTING).toHaveLength(4);
    expect(SLIDE_WAVE_PRINTED_WHILE_COUNTING).toContain('LTT_GrandBanks_1929');
  });
});

describe("rule 121: L2's bounds", () => {
  const reading = (rows: number, bias: number, sigmaLn: number) => ({
    rows,
    bias,
    sigmaLn,
    withinTwo: 0.5,
  });

  it('asks for ten events, a bias within ×1.5 either way, and σ_ln no more than 0.7', () => {
    expect(SLIDE_WAVE_BIAS_BOUND).toBe(1.5);
    expect(SLIDE_WAVE_SIGMA_BOUND).toBe(0.7);
    expect(SLIDE_WAVE_MIN_EVENTS).toBe(10);
    expect(meetsL2(reading(26, 1.2, 0.6))).toBe(true);
    expect(meetsL2(reading(26, 1 / 1.4, 0.6))).toBe(true);
  });

  it('fails on too few rows, a bias either side, or too much scatter', () => {
    expect(meetsL2(reading(9, 1.0, 0.1))).toBe(false);
    expect(meetsL2(reading(26, 1.6, 0.6))).toBe(false);
    expect(meetsL2(reading(26, 1 / 1.6, 0.6))).toBe(false);
    expect(meetsL2(reading(26, 1.0, 0.71))).toBe(false);
  });

  it('is symmetric: too small misses exactly as far as too large', () => {
    expect(meetsL2(reading(26, SLIDE_WAVE_BIAS_BOUND, 0.5))).toBe(true);
    expect(meetsL2(reading(26, 1 / SLIDE_WAVE_BIAS_BOUND, 0.5))).toBe(true);
    expect(meetsL2(reading(26, SLIDE_WAVE_BIAS_BOUND * 1.001, 0.5))).toBe(false);
    expect(meetsL2(reading(26, 1 / (SLIDE_WAVE_BIAS_BOUND * 1.001), 0.5))).toBe(false);
  });
});

describe('rules 122 to 125: the height L2 actually asks for', () => {
  const reading = (rows: number, bias: number, sigmaLn: number) => ({
    rows,
    bias,
    sigmaLn,
    withinTwo: 0.5,
  });

  it('takes its band from a constant the project already shipped', () => {
    // Not fitted to the set: it is the cap this project's own coastal chain
    // puts on a run-up over the wave that made it.
    expect(SLIDE_WAVE_RUNUP_AMPLIFICATION).toBe(4);
    expect(SLIDE_WAVE_PEAK_BAND).toEqual([0.25, 1]);
    expect(SLIDE_WAVE_PEAK_MIDPOINT).toBeCloseTo(0.5, 10);
  });

  it('asks for a bias below one, because a run-up is bigger than its wave', () => {
    // A model reading 1.0 against a peak run-up is a model whose source wave
    // equals the run-up, which is two to four times too big.
    expect(meetsL2AgainstPeak(reading(26, 0.5, 0.6))).toBe(true);
    expect(meetsL2AgainstPeak(reading(26, 0.34, 0.6))).toBe(true);
    expect(meetsL2AgainstPeak(reading(26, 0.74, 0.6))).toBe(true);
    expect(meetsL2AgainstPeak(reading(26, 1.0, 0.6))).toBe(false);
    expect(meetsL2AgainstPeak(reading(26, 0.3, 0.6))).toBe(false);
  });

  it('keeps L2’s other two clauses exactly as rule 121 had them', () => {
    expect(meetsL2AgainstPeak(reading(9, 0.5, 0.6))).toBe(false);
    expect(meetsL2AgainstPeak(reading(26, 0.5, 0.71))).toBe(false);
  });

  it('is a different question from rule 121, not a looser one', () => {
    // The band is 1.5 either way around its midpoint, the same width rule 121
    // allows around one. Only the centre moved, and it moved for a reason
    // written down before the run.
    const width = (lo: number, hi: number) => Math.log(hi / lo);
    expect(width(SLIDE_WAVE_PEAK_MIDPOINT / 1.5, SLIDE_WAVE_PEAK_MIDPOINT * 1.5)).toBeCloseTo(
      width(1 / 1.5, 1.5),
      10
    );
  });
});
