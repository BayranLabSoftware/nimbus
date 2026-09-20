import { describe, expect, it } from 'vitest';
import { distanceBetween } from '../tsunami/ruptureGeometry.js';
import { strikeDifferenceDeg } from './faultStrikeRules.js';
import {
  HYPOCENTRE_DEPTH_FLOOR_M,
  INTERFACE_SEISMOGENIC_DEPTH_LIMIT_M,
  MINIMUM_TRACE_FRACTION,
  SLAB2,
  SLAB_DATA_BUDGET,
  SLAB_DEPTH_STEP_M,
  SLAB_STRIKE_STEP_DEG,
  SLAB_WALK_STEP_M,
  canHostRupture,
  decodeDepthByte,
  decodeStrikeByte,
  decodeUncertaintyByte,
  encodeDepthByte,
  encodeStrikeByte,
  encodeUncertaintyByte,
  interfaceDepthToleranceM,
  interfaceHostsAnyway,
  isOnInterface,
  meanDirectionDeg,
  slabStrikeDeg,
  traceLengthM,
  type SlabField,
  type SlabSample,
} from './slabStrikeRules.js';

/**
 * Rules 296 to 299, exercised on geometry that is known in advance.
 *
 * This is the pre-registration of the second round: it tests what the rules
 * themselves say, before the candidate exists and before one value of Slab2 has
 * been read at any epicentre. Rule 301's measurement comes with the candidate,
 * and rule 303 says what it prints.
 */

/** A slab that is the same everywhere: the simplest field there is. */
function uniformField(sample: SlabSample): SlabField {
  return () => sample;
}

describe('rules 295 to 303 — where a megathrust points', () => {
  it('rule 296(c): the tolerance is the model’s own uncertainty, floored', () => {
    // Two sigmas where two sigmas are the larger…
    expect(interfaceDepthToleranceM(9_000)).toBe(18_000);
    expect(interfaceDepthToleranceM(20_000)).toBe(40_000);
    // …and the floor where the model claims to know better than a catalogue can.
    expect(interfaceDepthToleranceM(0)).toBe(HYPOCENTRE_DEPTH_FLOOR_M);
    expect(interfaceDepthToleranceM(2_000)).toBe(HYPOCENTRE_DEPTH_FLOOR_M);
    expect(interfaceDepthToleranceM(Number.NaN)).toBe(HYPOCENTRE_DEPTH_FLOOR_M);
  });

  it('rule 296: outside the mask there is no interface, whatever the depth', () => {
    expect(isOnInterface(null, 25_000)).toBe(false);
    expect(interfaceHostsAnyway(null)).toBe(false);
  });

  it('rule 296(b): below the seismogenic limit the megathrust is not what breaks', () => {
    const deep: SlabSample = {
      strikeDeg: 200,
      depthM: INTERFACE_SEISMOGENIC_DEPTH_LIMIT_M + 1,
      depthUncertaintyM: 5_000,
      dipDeg: null,
    };
    // The hypocentre sits exactly on the surface and it still is not an interface.
    expect(isOnInterface(deep, deep.depthM)).toBe(false);
    expect(interfaceHostsAnyway(deep)).toBe(false);
    const atLimit: SlabSample = { ...deep, depthM: INTERFACE_SEISMOGENIC_DEPTH_LIMIT_M };
    expect(isOnInterface(atLimit, atLimit.depthM)).toBe(true);
    expect(interfaceHostsAnyway(atLimit)).toBe(true);
  });

  it('rule 296(c): the hypocentre is on the surface or it is not', () => {
    const slab: SlabSample = {
      strikeDeg: 200,
      depthM: 30_000,
      depthUncertaintyM: 6_000,
      dipDeg: null,
    };
    // Tolerance is max(2 × 6, 10) = 12 km.
    expect(isOnInterface(slab, 30_000)).toBe(true);
    expect(isOnInterface(slab, 42_000)).toBe(true);
    expect(isOnInterface(slab, 42_001)).toBe(false);
    expect(isOnInterface(slab, 18_000)).toBe(true);
    expect(isOnInterface(slab, 17_999)).toBe(false);
  });

  it('rule 297: the interface answers anyway, depth set aside, seismogenic limit not', () => {
    const slab: SlabSample = {
      strikeDeg: 200,
      depthM: 40_000,
      depthUncertaintyM: 4_000,
      dipDeg: null,
    };
    // A depth no tolerance covers — a historical catalogue's guess.
    expect(isOnInterface(slab, 5_000)).toBe(false);
    expect(interfaceHostsAnyway(slab)).toBe(true);
    // But the limit of rule 296(b) still holds under rule 297.
    expect(interfaceHostsAnyway({ ...slab, depthM: 120_000 })).toBe(false);
  });

  it('rule 299: a rupture does not fit on a fault shorter than half of it', () => {
    expect(MINIMUM_TRACE_FRACTION).toBe(0.5);
    expect(canHostRupture(600_000, 1_204_000)).toBe(false); // Valdivia's length
    expect(canHostRupture(602_000, 1_204_000)).toBe(true);
    expect(canHostRupture(60_000, 100_000)).toBe(true);
    expect(canHostRupture(49_000, 100_000)).toBe(false);
    // A point source asks nothing of the structure.
    expect(canHostRupture(1_000, 0)).toBe(true);
  });

  it('rule 298: a direction is averaged on the vector, so 359° and 1° make 0°', () => {
    const m = meanDirectionDeg([
      { deg: 359, weight: 1 },
      { deg: 1, weight: 1 },
    ]);
    expect(m).not.toBeNull();
    expect(strikeDifferenceDeg(m ?? 0, 0)).toBeLessThan(1e-9);
    // Weights count.
    const w = meanDirectionDeg([
      { deg: 0, weight: 3 },
      { deg: 90, weight: 1 },
    ]);
    expect(w ?? 0).toBeCloseTo((Math.atan2(1, 3) * 180) / Math.PI, 9);
    // Nothing to average is nothing, and opposites cancel to nothing.
    expect(meanDirectionDeg([])).toBeNull();
    expect(
      meanDirectionDeg([
        { deg: 0, weight: 1 },
        { deg: 180, weight: 1 },
      ])
    ).toBeNull();
  });

  it('rule 298: on a slab that points one way, the walk reads that way', () => {
    const field = uniformField({
      strikeDeg: 200,
      depthM: 25_000,
      depthUncertaintyM: 5_000,
      dipDeg: null,
    });
    const strike = slabStrikeDeg(field, 0.5, 100, 300_000);
    expect(strike).not.toBeNull();
    // The chord of a walk at constant bearing is a great circle and the walk is
    // a rhumb line, so the two differ by a little near the equator and more far
    // from it. Rule 298 reads the chord, which is what a rupture lays down.
    expect(strikeDifferenceDeg(strike ?? 0, 200)).toBeLessThan(1);
  });

  it('rule 298: where the trench bends, the window bends with it', () => {
    // A trench that runs east and starts to bend at 100°E, twenty degrees to
    // the degree. The walk goes through the bend on one side and along the
    // straight on the other, and the chord turns with the length of the
    // rupture — which is what a single node's value can never do.
    const field: SlabField = (_lat, lon) => ({
      strikeDeg: lon <= 100 ? 90 : 90 - 20 * (lon - 100),
      depthM: 25_000,
      depthUncertaintyM: 5_000,
      dipDeg: null,
    });
    const local = 90;
    const short = slabStrikeDeg(field, 0, 100, 20_000);
    const long = slabStrikeDeg(field, 0, 100, 800_000);
    expect(strikeDifferenceDeg(short ?? 0, local)).toBeLessThan(1);
    expect(strikeDifferenceDeg(long ?? 0, local)).toBeGreaterThan(10);
    // …and it turns the way the trench turns, not the other way.
    expect(long ?? 0).toBeLessThan(local);
  });

  it('rule 298: on a bend that is symmetric, the chord IS the local strike', () => {
    // Not a defect and worth a test of its own, because it looks like one: the
    // chord of a symmetric arc is parallel to the tangent at its middle. A
    // trench that bends the same amount either side of the epicentre gives back
    // the strike at the epicentre, and the walk is still the thing that decided
    // it — on the arc of a real trench, which is never symmetric about the point
    // a reader clicks, the two part company.
    const field: SlabField = (_lat, lon) => ({
      strikeDeg: 90 - 10 * (lon - 100),
      depthM: 25_000,
      depthUncertaintyM: 5_000,
      dipDeg: null,
    });
    const strike = slabStrikeDeg(field, 0, 100, 800_000);
    expect(strikeDifferenceDeg(strike ?? 0, 90)).toBeLessThan(0.5);
  });

  it('rule 298: the walk stops at the edge of the mask', () => {
    // A slab that exists only west of 100°E: the eastward half of the window is
    // cut, and the strike still reads, from what there is.
    const field: SlabField = (_lat, lon) =>
      lon <= 100 ? { strikeDeg: 90, depthM: 25_000, depthUncertaintyM: 5_000, dipDeg: null } : null;
    const strike = slabStrikeDeg(field, 0, 99.9, 400_000);
    expect(strike).not.toBeNull();
    expect(strikeDifferenceDeg(strike ?? 0, 90)).toBeLessThan(1);
    // And off the mask entirely there is no answer at all.
    expect(slabStrikeDeg(field, 0, 101, 400_000)).toBeNull();
  });

  it('rule 298: the step is finer than the lattice it walks on', () => {
    // 0.05° is 5.5 km at the equator; a step that outran it would skip nodes.
    expect(SLAB_WALK_STEP_M).toBeLessThan(0.05 * 111_320 * 0.5);
  });

  it('rule 299: a trace is as long as its vertices say', () => {
    const trace = [
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 1 },
      { latitude: 0, longitude: 2 },
    ];
    const expected = 2 * distanceBetween(0, 0, 0, 1);
    expect(traceLengthM(trace)).toBeCloseTo(expected, 3);
    expect(traceLengthM([{ latitude: 0, longitude: 0 }])).toBe(0);
    expect(traceLengthM([])).toBe(0);
  });

  it('rule 301(f): the quantisation is finer than anything that reads it', () => {
    // Strike: a byte is 1.41°, against rule 301(a)'s 25°.
    expect(SLAB_STRIKE_STEP_DEG).toBeLessThan(1.5);
    for (const deg of [0, 1, 90, 199.7, 200, 330, 359.9]) {
      const back = decodeStrikeByte(encodeStrikeByte(deg));
      expect(strikeDifferenceDeg(back, deg)).toBeLessThanOrEqual(SLAB_STRIKE_STEP_DEG / 2 + 1e-9);
    }
    // Depth: zero is the empty cell, and nothing else encodes to it.
    expect(decodeDepthByte(0)).toBeNull();
    expect(encodeDepthByte(10)).toBeGreaterThan(0);
    expect(encodeDepthByte(Number.NaN)).toBe(0);
    for (const m of [0, 10, 25_000, 60_000, 300_000, 701_160]) {
      const back = decodeDepthByte(encodeDepthByte(m));
      expect(back).not.toBeNull();
      expect(Math.abs((back ?? 0) - m)).toBeLessThanOrEqual(SLAB_DEPTH_STEP_M / 2 + 1);
    }
    // …and the deepest slab there is still fits in a byte.
    expect(encodeDepthByte(701_160)).toBeLessThan(256);
    // Uncertainty: the largest Slab2 publishes is 64 km.
    expect(decodeUncertaintyByte(encodeUncertaintyByte(63_950))).toBeCloseTo(64_000, 6);
  });

  it('rule 301(f): the budget is a bound on the encoding, set before it', () => {
    // 230 889 lattice nodes at three bytes, counted before the budget was
    // written and named in the head of the rules file.
    expect(230_889 * 3).toBeLessThan(SLAB_DATA_BUDGET.totalBytes);
    expect(SLAB_DATA_BUDGET.perTileBytes).toBeLessThan(SLAB_DATA_BUDGET.totalBytes);
  });

  it('rule 295: the model is named, with its licence and its four exceptions', () => {
    expect(SLAB2.dataDoi).toBe('10.5066/F7PV6JNV');
    expect(SLAB2.zones).toBe(27);
    expect(SLAB2.clipped).toBe(true);
    expect([...SLAB2.overturning]).toEqual(['izu', 'ker', 'man', 'sol']);
  });
});
