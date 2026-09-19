import {
  interfaceDepthToleranceM,
  interfaceHostsAnyway,
  isOnInterface,
  slabStrikeDeg,
  type SlabField,
  type SlabSample,
  type StrikeSource,
} from '../../validation/slabStrikeRules.js';
import { findFault, type DecodedFault, type FaultMatch } from './faultLookup.js';

/**
 * Which structure an earthquake points along, when two could answer.
 *
 * Rule 300 of `validation/slabStrikeRules.ts`, and nothing else: an interface
 * under rule 296 or rule 297, else a crustal fault that can host the rupture
 * under rules 286 to 288 and 299, else nothing — and nothing is an answer,
 * which rule 290 says how to draw.
 *
 * The first round was refused for lacking exactly this: it asked for the
 * nearest trace and got the nearest trace, which for Valdivia 1960 was a
 * crustal fault 22 km away carrying an earthquake only a megathrust can make.
 */

/** What is asked. */
export interface StrikeQuery {
  latitude: number;
  longitude: number;
  /** Hypocentral depth (m, positive down). */
  hypocentreDepthM: number;
  /** The rupture this earthquake lays down (m) — the window rules 287 and 298
   *  read a strike over, and the length rule 299 asks a structure to host. */
  ruptureLengthM: number;
}

/** What answered, and everything rule 303 prints about it. */
export interface StrikeAnswer {
  source: StrikeSource;
  /** Degrees from north, [0, 360), or null where nothing answered. */
  strikeDeg: number | null;
  /** The slab at the epicentre, where there is one. */
  slab: SlabSample | null;
  /** Rule 296(c)'s tolerance at that point, where there is a slab. */
  depthToleranceM: number | null;
  /** The crustal fault that could host the rupture, where one could. */
  fault: FaultMatch | null;
  /** Why nothing answered, where nothing did. */
  refusal: string | null;
}

/**
 * Rule 300, in the order it is written.
 *
 * `field` is Slab2 as rule 298 walks it, or null where no slab tile is loaded;
 * `faults` are the GEM traces of the tile the epicentre falls in.
 */
export function chooseStrike(
  query: StrikeQuery,
  field: SlabField | null,
  faults: readonly DecodedFault[]
): StrikeAnswer {
  const { latitude, longitude, hypocentreDepthM, ruptureLengthM } = query;
  const slab = field === null ? null : field(latitude, longitude);
  const depthToleranceM = slab === null ? null : interfaceDepthToleranceM(slab.depthUncertaintyM);

  // 300(a), first clause: rule 296 — the hypocentre is on the interface.
  if (field !== null && isOnInterface(slab, hypocentreDepthM)) {
    const strikeDeg = slabStrikeDeg(field, latitude, longitude, ruptureLengthM);
    if (strikeDeg !== null) {
      return {
        source: 'interface-depth',
        strikeDeg,
        slab,
        depthToleranceM,
        fault: null,
        refusal: null,
      };
    }
  }

  // Rule 299: only the traces that can host the rupture are candidates, and
  // rule 297 turns on whether any can.
  const fault = findFault(faults, latitude, longitude, ruptureLengthM, { requireCapacity: true });

  // 300(a), second clause: rule 297 — no crustal structure in reach can hold a
  // break this long, and the slab there is seismogenic.
  if (field !== null && fault === null && interfaceHostsAnyway(slab)) {
    const strikeDeg = slabStrikeDeg(field, latitude, longitude, ruptureLengthM);
    if (strikeDeg !== null) {
      return {
        source: 'interface-capacity',
        strikeDeg,
        slab,
        depthToleranceM,
        fault: null,
        refusal: null,
      };
    }
  }

  // 300(b): the crustal fault.
  if (fault !== null) {
    return {
      source: 'crustal',
      strikeDeg: fault.strikeDeg,
      slab,
      depthToleranceM,
      fault,
      refusal: null,
    };
  }

  // 300(c): nothing, and why.
  const refusal =
    slab === null
      ? 'no slab under the epicentre and no mapped fault in reach that can host the rupture'
      : slab.depthM > 0 && !interfaceHostsAnyway(slab)
        ? 'the slab there is deeper than the interface seismogenic zone (rule 296(b)) and no mapped fault in reach can host the rupture'
        : 'no strike could be read from the slab, and no mapped fault in reach can host the rupture';
  return { source: 'unknown', strikeDeg: null, slab, depthToleranceM, fault: null, refusal };
}
