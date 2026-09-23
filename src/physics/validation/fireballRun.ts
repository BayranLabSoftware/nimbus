import {
  atmosphericEntry,
  DEFAULT_STRENGTH_LAW,
  mainStageStrength,
  type EntryRegime,
  type StrengthLaw,
} from '../effects/atmosphericEntry.js';
import { J, kgPerM3, m, mps, Pa, rad } from '../units.js';
import {
  FIREBALL_BODIES,
  FIREBALL_ENERGY_CELLS,
  FIREBALL_SPEED_SPLIT_KMS,
  fireballDiameterM,
  fireballEntryAngle,
  meetsFireballBar,
  type FireballBody,
  type FireballEvent,
  type FireballReading,
} from './fireballRules.js';
import { FIREBALL_EVENTS } from './fireballSetData.js';

/**
 * Rules 76 to 79 of fireballRules.ts, run: every bolide of rule 76's set
 * through the entry model as rule 77 builds its body, and rule 78's reading
 * of what the model's burst altitude does against the altitude the sensors
 * measured. One computation for the script that first runs them, the report
 * that prints them and the test that keeps the report honest about them.
 */

/** One bolide under one body. */
export interface FireballRow {
  date: string;
  energyKt: number;
  speedKmS: number;
  angleDeg: number;
  diameterM: number;
  observedKm: number;
  /** The model's burst altitude (km), or null where it brings the body to
   *  the ground. */
  burstKm: number | null;
  regime: EntryRegime;
}

/** Rule 77: one bolide as the model runs it — under the product's law of
 *  strength, or the one named (rule 885(b) reads both). */
export function fireballRow(
  event: FireballEvent,
  body: FireballBody,
  law: StrengthLaw = DEFAULT_STRENGTH_LAW
): FireballRow {
  const angle = fireballEntryAngle(event);
  const diameter = fireballDiameterM(event.energyKt, event.speedKmS, body.densityKgM3);
  const entry = atmosphericEntry(
    m(diameter),
    mps(event.speedKmS * 1_000),
    mainStageStrength(
      law,
      body.strengthPa === null ? undefined : Pa(body.strengthPa),
      body.densityKgM3
    ),
    kgPerM3(body.densityKgM3),
    J(event.energyKt * 4.184e12),
    rad(angle)
  );
  const burst = (entry.burstAltitude as number) / 1_000;
  return {
    date: event.date,
    energyKt: event.energyKt,
    speedKmS: event.speedKmS,
    angleDeg: (angle * 180) / Math.PI,
    diameterM: diameter,
    observedKm: event.altitudeKm,
    burstKm: burst > 0 ? burst : null,
    regime: entry.regime,
  };
}

export function fireballRows(
  body: FireballBody,
  events: readonly FireballEvent[] = FIREBALL_EVENTS,
  law: StrengthLaw = DEFAULT_STRENGTH_LAW
): FireballRow[] {
  return events.map((event) => fireballRow(event, body, law));
}

const median = (xs: readonly number[]): number | null => {
  if (xs.length === 0) return null;
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[mid] ?? null)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
};

/** Rule 78: what the model's burst altitudes do against the record. */
export function readFireball(rows: readonly FireballRow[]): FireballReading {
  const burst = rows.filter((r) => r.burstKm !== null);
  const errors = burst.map((r) => (r.burstKm ?? 0) - r.observedKm);
  return {
    rows: rows.length,
    burst: burst.length,
    toTheGround: rows.length - burst.length,
    medianAbsoluteErrorKm: median(errors.map(Math.abs)),
    meanErrorKm: errors.length === 0 ? null : errors.reduce((a, b) => a + b, 0) / errors.length,
    withinFiveKm: errors.filter((e) => Math.abs(e) <= 5).length,
  };
}

export interface FireballRunResult {
  events: {
    bolides: number;
    byEnergy: number[];
    fast: number;
  };
  /** Rule 78's reading for every body of rule 77, the default first. */
  readings: Record<string, FireballReading>;
  /** The same, by energy cell and by speed. */
  cells: Record<string, { label: string; reading: FireballReading }[]>;
  /** Rule 79: whether the default body's reading meets the bar of I2. */
  meetsBar: boolean;
  rows: Record<string, FireballRow[]>;
}

export function runFireball(law: StrengthLaw = DEFAULT_STRENGTH_LAW): FireballRunResult {
  const rows: Record<string, FireballRow[]> = {};
  const readings: Record<string, FireballReading> = {};
  const cells: FireballRunResult['cells'] = {};
  for (const body of FIREBALL_BODIES) {
    const all = fireballRows(body, undefined, law);
    rows[body.key] = all;
    readings[body.key] = readFireball(all);
    let lower = 0;
    const byCell = FIREBALL_ENERGY_CELLS.map((cell) => {
      const inCell = all.filter((r) => r.energyKt >= lower && r.energyKt < cell.max);
      lower = cell.max;
      return { label: cell.label, reading: readFireball(inCell) };
    });
    cells[body.key] = [
      ...byCell,
      {
        label: `below ${FIREBALL_SPEED_SPLIT_KMS.toString()} km/s`,
        reading: readFireball(all.filter((r) => r.speedKmS < FIREBALL_SPEED_SPLIT_KMS)),
      },
      {
        label: `from ${FIREBALL_SPEED_SPLIT_KMS.toString()} km/s`,
        reading: readFireball(all.filter((r) => r.speedKmS >= FIREBALL_SPEED_SPLIT_KMS)),
      },
    ];
  }
  const first = FIREBALL_BODIES[0];
  const defaultReading = readings[first.key];
  let lower = 0;
  const byEnergy = FIREBALL_ENERGY_CELLS.map((cell) => {
    const count = FIREBALL_EVENTS.filter(
      (e) => e.energyKt >= lower && e.energyKt < cell.max
    ).length;
    lower = cell.max;
    return count;
  });
  return {
    events: {
      bolides: FIREBALL_EVENTS.length,
      byEnergy,
      fast: FIREBALL_EVENTS.filter((e) => e.speedKmS >= FIREBALL_SPEED_SPLIT_KMS).length,
    },
    readings,
    cells,
    meetsBar: defaultReading !== undefined && meetsFireballBar(defaultReading),
    rows,
  };
}
