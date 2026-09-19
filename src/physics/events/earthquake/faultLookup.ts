import {
  FAULT_SEARCH_MARGIN_M,
  nearestPointOnTrace,
  surfaceProjectionReachM,
  traceStrikeDeg,
  type TracePoint,
} from '../../validation/faultStrikeRules.js';

/**
 * Which mapped fault an earthquake would break, and which way it points.
 *
 * Rules 286 to 294 of `validation/faultStrikeRules.ts`. The data is the GEM
 * Global Active Faults Database cut into ten-degree tiles by
 * `scripts/build-faults.ts`; this module reads one tile and answers, or says
 * it cannot.
 *
 * Nothing here guesses. Where no mapped fault reaches the point, the answer is
 * null, and rule 290 says what a picture must then do with it: draw the
 * envelope over every orientation, not a rectangle pointing north.
 */

/** The index `scripts/build-faults.ts` writes beside the tiles. */
export interface FaultTileIndex {
  source: string;
  citation: string;
  doi: string;
  licence: string;
  doesNotReach: readonly string[];
  traces: number;
  tileDeg: number;
  coordUnitsPerDeg: number;
  slipTypes: readonly string[];
  medianDipDeg: Record<string, number>;
  medianLowerDepthKm: Record<string, number>;
  fallbackDipDeg: number;
  fallbackLowerDepthKm: number;
  tiles: readonly string[];
}

/** A fault as a tile carries it. */
export interface PackedFault {
  t: number[];
  k: number;
  d?: number;
  z?: number;
  n?: string;
  i?: string;
}

/** A fault with its trace decoded, ready to be measured against. */
export interface DecodedFault {
  trace: TracePoint[];
  slipType: string;
  /** Degrees, the database's own where it has one, its slip type's median
   *  otherwise. `dipFromDatabase` says which. */
  dipDeg: number;
  dipFromDatabase: boolean;
  lowerDepthKm: number;
  depthFromDatabase: boolean;
  name: string | null;
  catalogId: string | null;
}

/** Which tile holds a place. */
export function faultTileKey(latitude: number, longitude: number, tileDeg: number): string {
  const lon = (((longitude + 180) % 360) + 360) % 360;
  const lat = Math.min(179.999_999, Math.max(0, latitude + 90));
  const col = Math.min(Math.floor(360 / tileDeg) - 1, Math.floor(lon / tileDeg));
  const row = Math.min(Math.floor(180 / tileDeg) - 1, Math.floor(lat / tileDeg));
  return `${col.toString()}_${row.toString()}`;
}

/** Undo the integer-delta packing of a trace. */
export function decodeFault(packed: PackedFault, index: FaultTileIndex): DecodedFault | null {
  const unit = index.coordUnitsPerDeg;
  const flat = packed.t;
  if (!(unit > 0) || flat.length < 4) return null;
  const trace: TracePoint[] = [];
  let lon = 0;
  let lat = 0;
  for (let i = 0; i + 1 < flat.length; i += 2) {
    const a = flat[i] ?? 0;
    const b = flat[i + 1] ?? 0;
    if (i === 0) {
      lon = a;
      lat = b;
    } else {
      lon += a;
      lat += b;
    }
    trace.push({ latitude: lat / unit, longitude: lon / unit });
  }
  if (trace.length < 2) return null;
  const slipType = index.slipTypes[packed.k] ?? 'Unknown';
  const dipFromDatabase = packed.d !== undefined;
  const depthFromDatabase = packed.z !== undefined;
  return {
    trace,
    slipType,
    dipDeg: packed.d ?? index.medianDipDeg[slipType] ?? index.fallbackDipDeg,
    dipFromDatabase,
    lowerDepthKm: packed.z ?? index.medianLowerDepthKm[slipType] ?? index.fallbackLowerDepthKm,
    depthFromDatabase,
    name: packed.n ?? null,
    catalogId: packed.i ?? null,
  };
}

/** What a lookup found, when it found one. */
export interface FaultMatch {
  /** Rule 287's strike, degrees from north, in [0, 360). */
  strikeDeg: number;
  /** How far the epicentre is from the fault's mapped trace (m). */
  distanceM: number;
  /** Rule 288's reach for this fault, which the distance is inside (m). */
  reachM: number;
  slipType: string;
  dipDeg: number;
  dipFromDatabase: boolean;
  lowerDepthKm: number;
  depthFromDatabase: boolean;
  name: string | null;
  catalogId: string | null;
}

/**
 * Rules 287 and 288: the nearest mapped fault whose surface projection could
 * hold this point, and the strike it gives a rupture of this length.
 *
 * Null where none reaches — which is an answer and not a failure.
 */
export function findFault(
  faults: readonly DecodedFault[],
  latitude: number,
  longitude: number,
  ruptureLengthM: number
): FaultMatch | null {
  let best: FaultMatch | null = null;
  for (const fault of faults) {
    const approach = nearestPointOnTrace(fault.trace, latitude, longitude);
    if (approach === null) continue;
    const reachM = surfaceProjectionReachM(fault.dipDeg, 1_000 * fault.lowerDepthKm);
    if (approach.distanceM > reachM) continue;
    if (best !== null && approach.distanceM >= best.distanceM) continue;
    const strikeDeg = traceStrikeDeg(fault.trace, latitude, longitude, ruptureLengthM);
    if (strikeDeg === null) continue;
    best = {
      strikeDeg,
      distanceM: approach.distanceM,
      reachM,
      slipType: fault.slipType,
      dipDeg: fault.dipDeg,
      dipFromDatabase: fault.dipFromDatabase,
      lowerDepthKm: fault.lowerDepthKm,
      depthFromDatabase: fault.depthFromDatabase,
      name: fault.name,
      catalogId: fault.catalogId,
    };
  }
  return best;
}

/** The smallest reach any fault can have, for callers that need to know how
 *  far a tile must be searched at all. */
export const MINIMUM_FAULT_REACH_M = FAULT_SEARCH_MARGIN_M;
