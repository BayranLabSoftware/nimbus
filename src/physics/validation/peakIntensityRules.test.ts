import { describe, expect, it } from 'vitest';
import { ATLAS_EARTHQUAKES } from './atlasSetData.js';
import { widerJury } from './widerFootprintRules.js';
import {
  displacesOnPeak,
  PEAK_MARGIN_MMI,
  readPeaks,
  type PeakReading,
} from './peakIntensityRules.js';

const row = (id: string, model: number, record: number) => ({
  id,
  modelPeakMmi: model,
  recordPeakMmi: record,
});

describe('rule 461: the reading', () => {
  it('measures the model against the record, in whole degrees', () => {
    const r = readPeaks([row('a', 8.3, 6.3), row('b', 8.3, 7.3)]);
    expect(r.events).toBe(2);
    expect(r.meanBias).toBeCloseTo(1.5, 10);
    expect(r.worst?.id).toBe('a');
    expect(r.worst?.bias).toBeCloseTo(2, 10);
  });

  it('counts how often the model is within a degree', () => {
    const r = readPeaks([row('a', 8, 7.5), row('b', 8, 6), row('c', 7, 7.2)]);
    expect(r.withinOne).toBeCloseTo(2 / 3, 10);
  });

  it('drops a pair it cannot read rather than scoring it as agreement', () => {
    // A ShakeMap with no peak is not a ShakeMap that peaked at nothing.
    expect(readPeaks([row('a', 8, 0), row('b', 8, Number.NaN)]).events).toBe(0);
    expect(readPeaks([]).events).toBe(0);
  });
});

describe('rule 462: what displaces the shipped law', () => {
  const base: PeakReading = {
    events: 100,
    meanBias: 1.33,
    sdBias: 0.8,
    withinOne: 0.4,
    worst: null,
  };
  const like = (mean: number, sd: number): PeakReading => ({ ...base, meanBias: mean, sdBias: sd });

  it('asks for a quarter of a degree and not a hair', () => {
    expect(displacesOnPeak(base, like(1.33 - PEAK_MARGIN_MMI + 0.01, 0.8))).toBe(false);
    expect(displacesOnPeak(base, like(1.33 - PEAK_MARGIN_MMI, 0.8))).toBe(true);
  });

  it('refuses a candidate that is closer on average but wilder', () => {
    expect(displacesOnPeak(base, like(0.2, 1.4))).toBe(false);
  });

  it('counts being too cold as being wrong', () => {
    // A law that undershoots by 1.33 is exactly as wrong as one that
    // overshoots by it, and must not displace on the sign alone.
    expect(displacesOnPeak(base, like(-1.33, 0.8))).toBe(false);
    expect(displacesOnPeak(base, like(-0.5, 0.8))).toBe(true);
  });
});

describe('rule 459: the set carries what this round reads', () => {
  it('has a ShakeMap peak for every one of the 116', () => {
    const jury = widerJury();
    expect(jury.length).toBe(116);
    for (const e of jury) expect(e.maxMmi, e.comcat).toBeGreaterThan(0);
  });

  it('carries it for the whole atlas, which no rule has read', () => {
    const withPeak = ATLAS_EARTHQUAKES.filter((e) => Number.isFinite(e.maxMmi) && e.maxMmi > 0);
    expect(withPeak.length).toBeGreaterThan(1000);
  });
});
