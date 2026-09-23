import { DEFAULT_STRENGTH_LAW, twoStageCovers } from '../effects/atmosphericEntry.js';
import { ENTRY_ATMOSPHERE_CRITERION, type EntryAtmosphere } from './entryAtmosphereRules.js';
import { FIREBALL_BODIES } from './fireballRules.js';
import { fireballRow, readFireball } from './fireballRun.js';
import { FIREBALL_EVENTS } from './fireballSetData.js';

/**
 * Rule 914 of `entryAtmosphereRules.ts`: a branch of the entry's atmosphere
 * read on I2's development set — rule 78's median absolute miss and mean
 * miss, and the share of the fireballs inside the band of S2's 80 % prior —
 * and the comparison that adopts one branch over another or not.
 */

export interface AtmosphereReading {
  atmosphere: EntryAtmosphere;
  rows: number;
  toTheGround: number;
  medianAbsoluteErrorKm: number | null;
  meanErrorKm: number | null;
  /** Rule 914(iii): the share inside the band, in points (0 to 100). */
  coveragePoints: number;
}

/** Rule 914 (i) to (iii) on one branch: rule 77's default body, the product's
 *  law, every fireball of I2's set. */
export function readAtmosphere(atmosphere: EntryAtmosphere): AtmosphereReading {
  const body = FIREBALL_BODIES[0];
  const law = DEFAULT_STRENGTH_LAW;
  const rows = FIREBALL_EVENTS.map((event) => fireballRow(event, body, law, { atmosphere }));
  const reading = readFireball(rows);
  const [weak, strong] = ENTRY_ATMOSPHERE_CRITERION.bandStrengthsPa;
  // The default body gives no strength: under the two-stage law it is drawn.
  const banded = law === 'twoStage' && twoStageCovers(body.densityKgM3);
  let inside = 0;
  for (const [i, event] of FIREBALL_EVENTS.entries()) {
    const row = rows[i];
    if (row === undefined) continue;
    const high = banded
      ? fireballRow(event, body, law, { atmosphere, strengthPa: weak }).burstKm
      : row.burstKm;
    const low = banded
      ? fireballRow(event, body, law, { atmosphere, strengthPa: strong }).burstKm
      : row.burstKm;
    if (row.observedKm >= (low ?? 0) && row.observedKm <= (high ?? 0)) inside += 1;
  }
  return {
    atmosphere,
    rows: reading.rows,
    toTheGround: reading.toTheGround,
    medianAbsoluteErrorKm: reading.medianAbsoluteErrorKm,
    meanErrorKm: reading.meanErrorKm,
    coveragePoints: (100 * inside) / Math.max(rows.length, 1),
  };
}

const EPSILON = 1e-9;

export interface AtmosphereVerdict {
  improved: string[];
  worsened: string[];
  /** Rule 914's first clause: two improved and none worsened materially. */
  metricsAdopt: boolean;
}

/** Rule 914: what the candidate improves over the legacy branch, and what it
 *  worsens materially. */
export function compareAtmospheres(
  legacy: AtmosphereReading,
  candidate: AtmosphereReading
): AtmosphereVerdict {
  const { improve, worsen } = ENTRY_ATMOSPHERE_CRITERION;
  // The thresholds are decimal: a difference that is one in floating point
  // counts as it (5.3 − 5.2 is 0.0999… in binary).
  const atLeast = (d: number, bar: number): boolean => d >= bar - EPSILON;
  const beyond = (d: number, bar: number): boolean => d > bar + EPSILON;
  const improved: string[] = [];
  const worsened: string[] = [];
  const la = legacy.medianAbsoluteErrorKm ?? Number.POSITIVE_INFINITY;
  const ca = candidate.medianAbsoluteErrorKm ?? Number.POSITIVE_INFINITY;
  if (atLeast(la - ca, improve.medianAbsoluteKm)) improved.push('absolute error');
  if (beyond(ca - la, worsen.medianAbsoluteKm)) worsened.push('absolute error');
  const lb = Math.abs(legacy.meanErrorKm ?? Number.POSITIVE_INFINITY);
  const cb = Math.abs(candidate.meanErrorKm ?? Number.POSITIVE_INFINITY);
  if (atLeast(lb - cb, improve.biasKm)) improved.push('bias');
  if (beyond(cb - lb, worsen.biasKm)) worsened.push('bias');
  const dc = candidate.coveragePoints - legacy.coveragePoints;
  if (atLeast(dc, improve.coveragePoints)) improved.push('coverage');
  if (beyond(-dc, worsen.coveragePoints)) worsened.push('coverage');
  if (candidate.toTheGround - legacy.toTheGround > worsen.moreToTheGround) {
    worsened.push('to the ground');
  }
  return { improved, worsened, metricsAdopt: improved.length >= 2 && worsened.length === 0 };
}
