import {
  HARKRIDER_ALTITUDES_KM,
  HARKRIDER_MS,
  HARKRIDER_YIELDS_KT,
  harkriderMs,
  type HarkriderEarth,
} from '../events/impact/airburstSeismic.js';
import { ALTITUDE_FLOOR_M, type BlastSource } from './blastSource.js';
import { searchFieldJump } from './fieldJump.js';

/**
 * Rule 735 of `airburstSeismicRules.ts`: why an airburst's seismic magnitude
 * fell between a body and a larger one, if its source says so — the same
 * question rules 683 to 690 ask of a blast ring (`blastSource.ts`), for the
 * air's term of rule 730, whose source is the same blast yield and burst
 * altitude.
 */
export type MagnitudeFallCause = 'the source altitude' | "the table's period";

const KT = 4.184e12;

/** Whether Harkrider et al.'s table itself falls with the yield between two
 *  yields, on a row the altitude is read from: the only cells where it does
 *  are two of its continental rows, from 1 to 3 MT. */
function tableFallsInYield(
  earth: HarkriderEarth,
  altitudeKm: number,
  fromKt: number,
  toKt: number
): boolean {
  const rows = HARKRIDER_ALTITUDES_KM.flatMap((h, i) => {
    const next = HARKRIDER_ALTITUDES_KM[i + 1];
    if (h === altitudeKm) return [i];
    return next !== undefined && h < altitudeKm && altitudeKm < next ? [i, i + 1] : [];
  });
  return rows.some((i) =>
    HARKRIDER_YIELDS_KT.some((w, j) => {
      const previous = HARKRIDER_YIELDS_KT[j - 1];
      if (previous === undefined || w <= fromKt || previous >= toKt) return false;
      const row = HARKRIDER_MS[earth][i] ?? [];
      return (row[j] ?? Number.NaN) < (row[j - 1] ?? Number.NaN);
    })
  );
}

/**
 * Why the magnitude fell, or null.
 *
 * - The air's term must decide the smaller body's magnitude: it is the
 *   magnitude, to the bit.
 * - Its source must move without a step between the two bodies (rule 662's
 *   search, on the yield and on the altitude, as for a blast ring).
 * - Then at the larger body's yield and the smaller body's altitude, the term
 *   either does not fall — the altitude moved it — or it does, where the
 *   table itself falls with the yield: the peak's longer period.
 */
export function explainMagnitudeFall(
  magnitudeBefore: number,
  before: BlastSource,
  after: BlastSource,
  earth: HarkriderEarth,
  sourceAt: (k: number) => BlastSource,
  step: number
): MagnitudeFallCause | null {
  const air = harkriderMs(before.energy / KT, before.altitude / 1_000, earth);
  if (air === null || Math.abs(air - magnitudeBefore) > 1e-9) return null;
  const energy = searchFieldJump(
    (k) => sourceAt(k).energy,
    1,
    step,
    before.energy,
    after.energy,
    0.01 * Math.max(before.energy, after.energy)
  );
  const altitude = searchFieldJump(
    (k) => sourceAt(k).altitude,
    1,
    step,
    before.altitude,
    after.altitude,
    0.01 * Math.max(Math.abs(before.altitude), Math.abs(after.altitude), ALTITUDE_FLOOR_M)
  );
  if (energy.kind !== 'steep' || altitude.kind !== 'steep') return null;
  const held = harkriderMs(after.energy / KT, before.altitude / 1_000, earth);
  if (held === null) return null;
  if (held >= magnitudeBefore) return 'the source altitude';
  if (
    after.energy >= before.energy &&
    tableFallsInYield(earth, before.altitude / 1_000, before.energy / KT, after.energy / KT)
  )
    return "the table's period";
  return null;
}
