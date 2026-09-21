import { airburstReach, groundImpactReach } from '../effects/airburstBlast.js';
import { J, m, Pa } from '../units.js';
import { searchFieldJump } from './fieldJump.js';

/**
 * The static source an impact's blast rings are drawn from, and what moves a
 * ring when the body grows (rules 683 to 690 of `blastShrinkSourceRules.ts`).
 *
 * An impact's three blast rings depend on the body only through two numbers
 * the entry gives: the energy of the static source, W = E₀ · max(f, 1 − f)
 * (Collins et al. 2017), and the altitude it is placed at — the burst
 * altitude of a complete airburst, Eq. 18's altitude below the ground for a
 * body that reaches it. The two laws meet where that altitude passes zero
 * (the air law at z = 0 is the Mach relation with r_x = 290, and so is the
 * program's ground blast), so one altitude, positive in the air and negative
 * below, carries both.
 */
export interface BlastSource {
  /** The energy of the static source (J). */
  energy: number;
  /** Its altitude (m): the burst altitude above the ground, Eq. 18's virtual
   *  altitude below it. */
  altitude: number;
}

interface EntryLike {
  regime: string;
  burstAltitude: number;
  virtualBurstAltitude: number;
  energyFractionToGround: number;
  blastYieldMegatons: number;
}

/** The source of a result's blast rings. */
export function blastSourceOf(result: {
  impactor: { kineticEnergy: number };
  entry: EntryLike;
}): BlastSource {
  const e = result.entry;
  if (e.regime === 'COMPLETE_AIRBURST') {
    return { energy: e.blastYieldMegatons * 4.184e15, altitude: e.burstAltitude };
  }
  const f = e.energyFractionToGround;
  return {
    energy: result.impactor.kineticEnergy * Math.max(f, 1 - f),
    altitude: e.virtualBurstAltitude,
  };
}

/** The ring a source draws for a threshold (m): the air law above the ground,
 *  the program's ground blast, held (rules 630 to 637), at and below it. */
export function blastRingOf(threshold: number, source: BlastSource): number {
  return source.altitude > 0
    ? Number(airburstReach(Pa(threshold), m(source.altitude), J(source.energy), 'low'))
    : Number(groundImpactReach(Pa(threshold), m(source.altitude), J(source.energy), true));
}

export type BlastShrinkCause = 'the source altitude' | 'the source energy';

/**
 * Why a blast ring shrank between a body and a larger one, if its source
 * says so; null if it does not.
 *
 * - The source must move continuously between the two (rule 662's search,
 *   on its energy and on its altitude); a source that jumps explains nothing.
 * - The ring must be the one the source draws, or the source is not its cause.
 * - Then, at the larger body's energy and the smaller body's altitude, the
 *   ring either does not shrink — the altitude moved it — or it does, and
 *   the energy fell: less of the body's energy went into the air.
 *
 * Anything else — the energy grew and the ring still shrank at a held
 * altitude — is not explained.
 */
export function explainBlastShrink(
  threshold: number,
  ringBefore: number,
  before: BlastSource,
  after: BlastSource,
  sourceAt: (k: number) => BlastSource,
  step: number
): BlastShrinkCause | null {
  const energyAt = (k: number): number => sourceAt(k).energy;
  const altitudeAt = (k: number): number => sourceAt(k).altitude;
  const energy = searchFieldJump(
    energyAt,
    1,
    step,
    before.energy,
    after.energy,
    0.01 * Math.max(before.energy, after.energy)
  );
  const altitude = searchFieldJump(
    altitudeAt,
    1,
    step,
    before.altitude,
    after.altitude,
    0.01 * Math.max(Math.abs(before.altitude), Math.abs(after.altitude), ALTITUDE_FLOOR_M)
  );
  if (energy.kind !== 'steep' || altitude.kind !== 'steep') return null;
  const drawn = blastRingOf(threshold, before);
  if (Math.abs(drawn - ringBefore) > 1e-6 * Math.max(ringBefore, 1)) return null;
  const heldAltitude = blastRingOf(threshold, { energy: after.energy, altitude: before.altitude });
  if (heldAltitude >= ringBefore) return 'the source altitude';
  if (after.energy < before.energy) return 'the source energy';
  return null;
}

/** An altitude's scale is never read below this (m): a source a few metres
 *  from the ground moves by more than a per cent of itself for nothing. */
export const ALTITUDE_FLOOR_M = 100;
