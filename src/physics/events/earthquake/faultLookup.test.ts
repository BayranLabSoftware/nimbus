import { describe, expect, it } from 'vitest';
import { destination } from '../../tsunami/ruptureGeometry.js';
import { strikeDifferenceDeg } from '../../validation/faultStrikeRules.js';
import {
  decodeFault,
  faultTileKey,
  findFault,
  type FaultTileIndex,
  type PackedFault,
} from './faultLookup.js';

/** An index of the shape `scripts/build-faults.ts` writes. */
const index: FaultTileIndex = {
  source: 'test',
  citation: 'test',
  doi: '10.1177/8755293020944182',
  licence: 'CC-BY-SA-4.0',
  doesNotReach: [],
  traces: 2,
  tileDeg: 10,
  coordUnitsPerDeg: 10_000,
  slipTypes: ['Normal', 'Reverse', 'Subduction_Thrust', 'Unknown'],
  medianDipDeg: { Normal: 53, Reverse: 45, Subduction_Thrust: 30 },
  medianLowerDepthKm: { Normal: 14.5, Reverse: 20, Subduction_Thrust: 40 },
  fallbackDipDeg: 60,
  fallbackLowerDepthKm: 18,
  tiles: [],
};

/** A packed trace running east from a place, in the tiles' own encoding. */
function packEastward(lat: number, lon: number, lengthM: number, k: number): PackedFault {
  const end = destination(lat, lon, 90, lengthM);
  const u = index.coordUnitsPerDeg;
  const l0 = Math.round(lon * u);
  const a0 = Math.round(lat * u);
  return {
    t: [l0, a0, Math.round(end.longitude * u) - l0, Math.round(end.latitude * u) - a0],
    k,
  };
}

describe('the fault a lookup finds, and the one it refuses to invent', () => {
  it('puts a place in the tile that holds it, on both sides of every seam', () => {
    expect(faultTileKey(0, 0, 10)).toBe('18_9');
    expect(faultTileKey(-90, -180, 10)).toBe('0_0');
    expect(faultTileKey(89.999, 179.999, 10)).toBe('35_17');
    // The antimeridian and the poles land inside the grid rather than off it.
    expect(faultTileKey(90, 180, 10)).toBe('0_17');
    expect(faultTileKey(-89.999, 179.999, 10)).toBe('35_0');
    expect(faultTileKey(38.297, 142.373, 10)).toBe('32_12');
  });

  it('decodes a trace back to where it was packed from', () => {
    const packed = packEastward(35, 90, 200_000, 1);
    const decoded = decodeFault(packed, index);
    expect(decoded).not.toBeNull();
    expect(decoded?.trace).toHaveLength(2);
    expect(decoded?.trace[0]?.latitude ?? 0).toBeCloseTo(35, 3);
    expect(decoded?.trace[0]?.longitude ?? 0).toBeCloseTo(90, 3);
    expect(decoded?.slipType).toBe('Reverse');
    // The database gave neither a dip nor a depth, so rule 289's medians did,
    // and the fault says so rather than pretending they were measured.
    expect(decoded?.dipDeg).toBe(45);
    expect(decoded?.dipFromDatabase).toBe(false);
    expect(decoded?.lowerDepthKm).toBe(20);
    expect(decoded?.depthFromDatabase).toBe(false);
    // What the database does carry is carried.
    const withDip = decodeFault({ ...packed, d: 12, z: 55 }, index);
    expect(withDip?.dipDeg).toBe(12);
    expect(withDip?.dipFromDatabase).toBe(true);
    expect(withDip?.lowerDepthKm).toBe(55);
  });

  it('refuses a trace it cannot read instead of returning a degenerate one', () => {
    expect(decodeFault({ t: [], k: 0 }, index)).toBeNull();
    expect(decodeFault({ t: [1, 2], k: 0 }, index)).toBeNull();
    expect(decodeFault({ t: [1, 2, 3, 4], k: 0 }, { ...index, coordUnitsPerDeg: 0 })).toBeNull();
  });

  it('finds a fault within its reach and none beyond it', () => {
    const fault = decodeFault(packEastward(0, 0, 400_000, 1), index);
    expect(fault).not.toBeNull();
    if (fault === null) return;
    const mid = destination(0, 0, 90, 200_000);
    // A reverse fault at 45° over 20 km reaches 45 km from its trace.
    const near = destination(mid.latitude, mid.longitude, 0, 30_000);
    const hit = findFault([fault], near.latitude, near.longitude, 50_000);
    expect(hit).not.toBeNull();
    expect(strikeDifferenceDeg(hit?.strikeDeg ?? Number.NaN, 90)).toBeLessThan(2);
    expect(hit?.distanceM ?? 0).toBeCloseTo(30_000, -3);
    // Sixty kilometres out is past its reach, and the answer is nothing.
    const far = destination(mid.latitude, mid.longitude, 0, 60_000);
    expect(findFault([fault], far.latitude, far.longitude, 50_000)).toBeNull();
    expect(findFault([], 0, 0, 50_000)).toBeNull();
  });

  it('takes the nearer of two in reach — which is what refused the first candidate', () => {
    // Two faults, one crustal and close, one an interface and far. The lookup
    // takes the near one. Valdivia 1960 is why that is recorded as a defect of
    // rule 286 and not as a property to rely on.
    const crustal = decodeFault(packEastward(0, 0, 400_000, 1), index);
    const interfaceTrace = decodeFault(
      { ...packEastward(0.9, 0, 400_000, 2), d: 10, z: 50 },
      index
    );
    expect(crustal).not.toBeNull();
    expect(interfaceTrace).not.toBeNull();
    if (crustal === null || interfaceTrace === null) return;
    const at = destination(destination(0, 0, 90, 200_000).latitude, 0.9 * 0 + 1.8, 0, 0);
    const hit = findFault([crustal, interfaceTrace], at.latitude + 0.1, 1.8, 900_000);
    expect(hit).not.toBeNull();
    expect(hit?.slipType).toBe('Reverse');
  });
});
