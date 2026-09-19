import { describe, expect, it } from 'vitest';
import { destination } from '../../tsunami/ruptureGeometry.js';
import { strikeDifferenceDeg, type TracePoint } from '../../validation/faultStrikeRules.js';
import type { SlabField, SlabSample } from '../../validation/slabStrikeRules.js';
import type { DecodedFault } from './faultLookup.js';
import { chooseStrike } from './strikeSource.js';

/**
 * Rule 300 of `validation/slabStrikeRules.ts`, on structures built here.
 *
 * The cases are the ones the first round got wrong, in miniature and with
 * every number chosen in advance: a hypocentre on an interface, a rupture no
 * crustal fault can host above a slab, a crustal earthquake that must keep its
 * own fault, and a place where the honest answer is nothing.
 */

/** A straight trace of a given length running from a place at a bearing. */
function straightTrace(
  lat: number,
  lon: number,
  bearingDeg: number,
  lengthM: number
): TracePoint[] {
  const a = destination(lat, lon, bearingDeg + 180, lengthM / 2);
  const b = destination(lat, lon, bearingDeg, lengthM / 2);
  return [
    { latitude: a.latitude, longitude: a.longitude },
    { latitude: b.latitude, longitude: b.longitude },
  ];
}

/** A crustal fault with a wide enough reach to be in range at all. */
function crustalFault(trace: TracePoint[], name: string): DecodedFault {
  return {
    trace,
    slipType: 'Sinistral',
    dipDeg: 60,
    dipFromDatabase: true,
    lowerDepthKm: 15,
    depthFromDatabase: true,
    name,
    catalogId: null,
  };
}

function uniformSlab(sample: SlabSample): SlabField {
  return () => sample;
}

describe('rule 300 — who answers, when both could', () => {
  const lat = -38;
  const lon = -73.5;

  it('300(a)/296: a hypocentre on the interface takes the interface', () => {
    const slab = uniformSlab({ strikeDeg: 10, depthM: 30_000, depthUncertaintyM: 8_000 });
    const answer = chooseStrike(
      { latitude: lat, longitude: lon, hypocentreDepthM: 25_000, ruptureLengthM: 400_000 },
      slab,
      [crustalFault(straightTrace(lat, lon + 0.2, 325, 900_000), 'a long crustal fault')]
    );
    expect(answer.source).toBe('interface-depth');
    expect(strikeDifferenceDeg(answer.strikeDeg ?? 0, 10)).toBeLessThan(1);
    // Even with a crustal fault right there that could host it: a surface that
    // holds the hypocentre beats a trace that only reaches it.
    expect(answer.fault).toBeNull();
  });

  it('300(a)/297: a break no crustal fault can hold is the interface anyway', () => {
    // Valdivia in miniature: Mw 9.5 is 1 204 km of rupture, the slab is deeper
    // than any tolerance covers because a 1960 depth is a guess, and the only
    // fault in reach maps 90 km.
    const slab = uniformSlab({ strikeDeg: 10, depthM: 45_000, depthUncertaintyM: 4_000 });
    const answer = chooseStrike(
      { latitude: lat, longitude: lon, hypocentreDepthM: 8_000, ruptureLengthM: 1_204_000 },
      slab,
      [crustalFault(straightTrace(lat, lon + 0.1, 325, 90_000), 'Falla-like')]
    );
    expect(answer.source).toBe('interface-capacity');
    expect(strikeDifferenceDeg(answer.strikeDeg ?? 0, 10)).toBeLessThan(1);
    expect(answer.fault).toBeNull();
  });

  it('300(b): a crustal earthquake keeps its crustal fault', () => {
    const answer = chooseStrike(
      { latitude: 35.9, longitude: 90.5, hypocentreDepthM: 15_000, ruptureLengthM: 167_000 },
      null,
      [crustalFault(straightTrace(35.9, 90.55, 95, 300_000), 'a long strike-slip')]
    );
    expect(answer.source).toBe('crustal');
    expect(strikeDifferenceDeg(answer.strikeDeg ?? 0, 95)).toBeLessThan(2);
    expect(answer.fault?.name).toBe('a long strike-slip');
  });

  it('300(b)/299: a fault too short for the break is not the fault', () => {
    // The same crustal setting, and a rupture twenty times the mapped trace.
    const answer = chooseStrike(
      { latitude: 35.9, longitude: 90.5, hypocentreDepthM: 15_000, ruptureLengthM: 600_000 },
      null,
      [crustalFault(straightTrace(35.9, 90.55, 95, 30_000), 'a short segment')]
    );
    expect(answer.source).toBe('unknown');
    expect(answer.strikeDeg).toBeNull();
    expect(answer.refusal).not.toBeNull();
  });

  it('300(c): where there is neither, there is no strike and a reason', () => {
    const answer = chooseStrike(
      { latitude: 0, longitude: 0, hypocentreDepthM: 10_000, ruptureLengthM: 50_000 },
      null,
      []
    );
    expect(answer.source).toBe('unknown');
    expect(answer.slab).toBeNull();
    expect(answer.refusal).toContain('no slab');
  });

  it('296(b): a slab deeper than the seismogenic zone does not answer', () => {
    // An intraslab earthquake at 200 km, sitting exactly on the surface: the
    // interface is not what breaks there, and no crustal fault is in reach.
    const slab = uniformSlab({ strikeDeg: 10, depthM: 200_000, depthUncertaintyM: 10_000 });
    const answer = chooseStrike(
      { latitude: lat, longitude: lon, hypocentreDepthM: 200_000, ruptureLengthM: 60_000 },
      slab,
      []
    );
    expect(answer.source).toBe('unknown');
    expect(answer.refusal).toContain('seismogenic');
  });
});
