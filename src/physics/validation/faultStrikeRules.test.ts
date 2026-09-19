import { describe, expect, it } from 'vitest';
import { destination, distanceBetween } from '../tsunami/ruptureGeometry.js';
import {
  FAULT_SEARCH_MARGIN_M,
  FAULT_SEARCH_REACH_CAP_M,
  GEM_GAF_DB,
  PRESET_MINIMUM_FOUND,
  PRESET_STRIKE_TOLERANCE_DEG,
  STRIKE_PRESETS,
  nearestPointOnTrace,
  strikeDifferenceDeg,
  surfaceProjectionReachM,
  traceStrikeDeg,
  walkTrace,
  type TracePoint,
} from './faultStrikeRules.js';

/**
 * Rules 287 and 288, exercised on geometry that is known in advance.
 *
 * This is the pre-registration: it tests what the rules themselves say, before
 * the candidate exists and before any fault database has been read. Rule 292's
 * measurement comes with the candidate.
 */

/** A straight trace of `n` points running from a place at a fixed bearing. */
function straightTrace(
  lat: number,
  lon: number,
  bearingDeg: number,
  lengthM: number,
  n = 2
): TracePoint[] {
  const out: TracePoint[] = [];
  for (let i = 0; i < n; i += 1) {
    const d = (lengthM * i) / (n - 1);
    const p = destination(lat, lon, bearingDeg, d);
    out.push({ latitude: p.latitude, longitude: p.longitude });
  }
  return out;
}

describe('rules 286 to 294 — an earthquake points where its fault points', () => {
  it('rule 287: a strike is an undirected line, so 10° and 190° are one fault', () => {
    expect(strikeDifferenceDeg(10, 190)).toBeCloseTo(0, 12);
    expect(strikeDifferenceDeg(200, 20)).toBeCloseTo(0, 12);
    expect(strikeDifferenceDeg(0, 90)).toBeCloseTo(90, 12);
    expect(strikeDifferenceDeg(350, 10)).toBeCloseTo(20, 12);
    expect(strikeDifferenceDeg(95, 275)).toBeCloseTo(0, 12);
    expect(strikeDifferenceDeg(330, 145)).toBeCloseTo(5, 12);
    // Never outside [0, 90], whatever comes in.
    for (let a = -720; a <= 720; a += 37) {
      for (let b = -720; b <= 720; b += 53) {
        const d = strikeDifferenceDeg(a, b);
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeLessThanOrEqual(90);
      }
    }
    expect(strikeDifferenceDeg(Number.NaN, 10)).toBeNaN();
  });

  it('rule 288: the reach is the horizontal extent of a dipping plane', () => {
    // A vertical fault covers no ground beyond its trace: the margin alone.
    expect(surfaceProjectionReachM(90, 15_000)).toBeCloseTo(FAULT_SEARCH_MARGIN_M, 6);
    // 45° over 15 km of seismogenic crust reaches 15 km from the trace.
    expect(surfaceProjectionReachM(45, 15_000)).toBeCloseTo(FAULT_SEARCH_MARGIN_M + 15_000, 3);
    // A megathrust at 15° to 50 km reaches 186.6 km, which is why a click far
    // inland can still be on the interface.
    expect(surfaceProjectionReachM(15, 50_000)).toBeCloseTo(FAULT_SEARCH_MARGIN_M + 186_602, -1);
    // The cap holds, and a shallower dip cannot walk past it.
    expect(surfaceProjectionReachM(2, 60_000)).toBe(FAULT_SEARCH_REACH_CAP_M);
    // Nonsense in, the margin out — never a negative or a NaN reach.
    expect(surfaceProjectionReachM(Number.NaN, Number.NaN)).toBe(FAULT_SEARCH_MARGIN_M);
    expect(surfaceProjectionReachM(45, -1)).toBe(FAULT_SEARCH_MARGIN_M);
  });

  it('rule 287: a straight trace gives back the bearing it was built at', () => {
    for (const bearing of [0, 30, 95, 200, 290, 330]) {
      const trace = straightTrace(35, 90, bearing, 200_000, 9);
      const mid = trace[4];
      expect(mid).toBeDefined();
      const strike = traceStrikeDeg(trace, mid?.latitude ?? 0, mid?.longitude ?? 0, 100_000);
      expect(strike).not.toBeNull();
      expect(strikeDifferenceDeg(strike ?? Number.NaN, bearing)).toBeLessThan(1);
    }
  });

  it('rule 287: the window is the rupture, so a bend beyond it is not read', () => {
    // A trace that runs 100 km due east and then turns hard north.
    const east = straightTrace(20, 100, 90, 100_000, 11);
    const corner = east[east.length - 1];
    expect(corner).toBeDefined();
    const north = straightTrace(
      corner?.latitude ?? 0,
      corner?.longitude ?? 0,
      0,
      100_000,
      11
    ).slice(1);
    const bent = [...east, ...north];
    const start = bent[2];
    expect(start).toBeDefined();
    // A short rupture near the start reads the east-west limb alone.
    const short = traceStrikeDeg(bent, start?.latitude ?? 0, start?.longitude ?? 0, 30_000);
    expect(strikeDifferenceDeg(short ?? Number.NaN, 90)).toBeLessThan(2);
    // A rupture long enough to span the corner reads the chord across it, which
    // is neither limb — the point of rule 287 being a window and not a tangent.
    const long = traceStrikeDeg(bent, corner?.latitude ?? 0, corner?.longitude ?? 0, 200_000);
    expect(strikeDifferenceDeg(long ?? Number.NaN, 90)).toBeGreaterThan(20);
    expect(strikeDifferenceDeg(long ?? Number.NaN, 0)).toBeGreaterThan(20);
  });

  it('rule 287: a trace with nothing to read gives null, not a number', () => {
    expect(traceStrikeDeg([], 0, 0, 10_000)).toBeNull();
    expect(traceStrikeDeg([{ latitude: 1, longitude: 2 }], 1, 2, 10_000)).toBeNull();
    const same = [
      { latitude: 1, longitude: 2 },
      { latitude: 1, longitude: 2 },
    ];
    expect(traceStrikeDeg(same, 1, 2, 10_000)).toBeNull();
    // A rupture of no length has no window and so no strike to read.
    expect(traceStrikeDeg(straightTrace(0, 0, 45, 100_000, 5), 0, 0, 0)).toBeNull();
  });

  it('rule 288: the nearest point on a trace is the one a distance is measured to', () => {
    const trace = straightTrace(0, 0, 90, 400_000, 5);
    // A point due north of the middle of an east-west trace is that far away,
    // and the foot of the perpendicular is on the trace.
    const mid = trace[2];
    expect(mid).toBeDefined();
    const off = destination(mid?.latitude ?? 0, mid?.longitude ?? 0, 0, 40_000);
    const approach = nearestPointOnTrace(trace, off.latitude, off.longitude);
    expect(approach).not.toBeNull();
    expect(approach?.distanceM ?? 0).toBeCloseTo(40_000, -2);
    expect(
      distanceBetween(
        approach?.at.latitude ?? 0,
        approach?.at.longitude ?? 0,
        mid?.latitude ?? 0,
        mid?.longitude ?? 0
      )
    ).toBeLessThan(1_000);
    // Past the end, the nearest point is the end itself.
    const end = trace[trace.length - 1];
    expect(end).toBeDefined();
    const beyond = destination(end?.latitude ?? 0, end?.longitude ?? 0, 90, 50_000);
    const past = nearestPointOnTrace(trace, beyond.latitude, beyond.longitude);
    expect(past?.distanceM ?? 0).toBeCloseTo(50_000, -2);
    expect(nearestPointOnTrace([], 0, 0)).toBeNull();
  });

  it('rule 287: walking a trace stops at its end instead of running off it', () => {
    const trace = straightTrace(0, 0, 90, 100_000, 3);
    const start = trace[0];
    expect(start).toBeDefined();
    const approach = nearestPointOnTrace(trace, start?.latitude ?? 0, start?.longitude ?? 0);
    expect(approach).not.toBeNull();
    if (approach === null) return;
    // Forty kilometres along is forty kilometres along.
    const forty = walkTrace(trace, approach, 40_000);
    expect(distanceBetween(0, 0, forty.latitude, forty.longitude)).toBeCloseTo(40_000, -2);
    // Two hundred is a hundred, because the trace ends.
    const past = walkTrace(trace, approach, 200_000);
    expect(distanceBetween(0, 0, past.latitude, past.longitude)).toBeCloseTo(100_000, -2);
    // And backwards from the start goes nowhere.
    const back = walkTrace(trace, approach, -50_000);
    expect(distanceBetween(0, 0, back.latitude, back.longitude)).toBeLessThan(1);
  });

  it('rule 292: the six presets are the ones a fault lookup can be tested on', () => {
    expect(STRIKE_PRESETS).toHaveLength(6);
    expect(PRESET_MINIMUM_FOUND).toBeLessThanOrEqual(STRIKE_PRESETS.length);
    for (const p of STRIKE_PRESETS) {
      expect(Math.abs(p.latitude), p.name).toBeLessThanOrEqual(90);
      expect(Math.abs(p.longitude), p.name).toBeLessThanOrEqual(180);
      expect(p.publishedStrikeDeg, p.name).toBeGreaterThanOrEqual(0);
      expect(p.publishedStrikeDeg, p.name).toBeLessThan(360);
      expect(p.epicentreSource.length, p.name).toBeGreaterThan(0);
    }
    // Lisbon has no instrumental epicentre and is deliberately absent.
    expect(STRIKE_PRESETS.some((p) => p.preset === 'LISBON_1755')).toBe(false);
    // The tolerance and the database are the ones the rules fixed.
    expect(PRESET_STRIKE_TOLERANCE_DEG).toBe(25);
    expect(Math.cos((PRESET_STRIKE_TOLERANCE_DEG * Math.PI) / 180)).toBeCloseTo(0.91, 2);
    expect(GEM_GAF_DB.doesNotReach.length).toBeGreaterThan(0);
  });
});
