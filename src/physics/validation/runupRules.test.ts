import { describe, expect, it } from 'vitest';
import {
  meetsT2,
  RUNUP_BIAS_BOUND,
  RUNUP_MATCH_RADIUS_M,
  RUNUP_MIN_BINS,
  RUNUP_MIN_EVENTS,
  RUNUP_SEED_RADIUS_M,
  RUNUP_SIGMA_BOUND,
  type RunupReading,
} from './runupRules.js';
import {
  RUNUP_ALREADY_READ,
  RUNUP_DEEP_OCEAN_GAUGE,
  RUNUP_EVENTS,
  RUNUP_MIN_OBSERVATIONS,
  RUNUP_OBSERVATIONS,
} from './runupSetData.js';

const good: RunupReading = {
  bins: 2_000,
  events: 40,
  observations: 5_000,
  unmatched: 100,
  bias: 1.2,
  sigmaLn: 0.6,
  withinTwo: 0.8,
};

describe('rule 102: the observations', () => {
  it('are NCEI’s, filtered as the rule says, and big enough for T2', () => {
    expect(RUNUP_EVENTS.length).toBeGreaterThanOrEqual(RUNUP_MIN_EVENTS);
    expect(RUNUP_OBSERVATIONS.length).toBeGreaterThanOrEqual(RUNUP_MIN_BINS);
    // Every observation belongs to an event of the set, carries a height and
    // is not the deep-ocean gauge the rule excludes.
    const ids = new Set(RUNUP_EVENTS.map((e) => e.id));
    for (const o of RUNUP_OBSERVATIONS) {
      expect(ids.has(o.eventId)).toBe(true);
      expect(o.heightM).toBeGreaterThan(0);
      expect(o.typeId).not.toBe(3);
    }
    expect(RUNUP_DEEP_OCEAN_GAUGE).toBeGreaterThan(0);
  });

  it('keeps only events with enough observations to fill a coastal bin', () => {
    const per = new Map<number, number>();
    for (const o of RUNUP_OBSERVATIONS) per.set(o.eventId, (per.get(o.eventId) ?? 0) + 1);
    for (const e of RUNUP_EVENTS)
      expect(per.get(e.id) ?? 0).toBeGreaterThanOrEqual(RUNUP_MIN_OBSERVATIONS);
  });

  it('leaves out the waves this project has already read, and says how many', () => {
    expect(RUNUP_ALREADY_READ.length).toBeGreaterThan(0);
    const why = RUNUP_ALREADY_READ.map(([w]) => w).join(' | ');
    expect(why).toContain('Tōhoku');
    expect(why).toContain('Sumatra');
    expect(why).toContain('BM-05');
    for (const [, n] of RUNUP_ALREADY_READ) expect(n).toBeGreaterThan(0);
    // None of them survived into the set.
    for (const e of RUNUP_EVENTS) {
      expect(e.year >= 2006 && e.magnitude >= 7.7).toBe(false);
    }
  });

  it('gives every event a place, a magnitude and a depth', () => {
    for (const e of RUNUP_EVENTS) {
      expect(Number.isFinite(e.latitude)).toBe(true);
      expect(Number.isFinite(e.longitude)).toBe(true);
      expect(e.magnitude).toBeGreaterThan(0);
      expect(e.depthKm).toBeGreaterThanOrEqual(0);
      expect(e.year).toBeGreaterThanOrEqual(1900);
    }
  });
});

describe('rule 104: the bar is T2’s own', () => {
  it('holds the bounds the gold standard sets', () => {
    expect(RUNUP_BIAS_BOUND).toBe(1.5);
    expect(RUNUP_SIGMA_BOUND).toBe(0.8);
    expect(RUNUP_MIN_BINS).toBe(500);
    expect(RUNUP_MIN_EVENTS).toBe(10);
    expect(RUNUP_SEED_RADIUS_M).toBe(300_000);
    expect(RUNUP_MATCH_RADIUS_M).toBe(50_000);
  });

  it('fails a reading that is too biased, too scattered or too small', () => {
    expect(meetsT2(good)).toBe(true);
    expect(meetsT2({ ...good, bias: 1.6 })).toBe(false);
    expect(meetsT2({ ...good, bias: 1 / 1.6 })).toBe(false);
    expect(meetsT2({ ...good, sigmaLn: 0.81 })).toBe(false);
    expect(meetsT2({ ...good, bins: 499 })).toBe(false);
    expect(meetsT2({ ...good, events: 9 })).toBe(false);
  });
});
