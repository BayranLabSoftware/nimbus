import { describe, expect, it } from 'vitest';
import { fcmEntry, type FcmBody, type FcmOptions, type FcmResult } from './fcmBranch.js';
import { fcmEntrySettle } from './fcmBranchSettle.js';

/**
 * Rule 1227 (src/physics/validation/porta1Rules.ts): the settle condition
 * made to say what rule 1138 (c) says. Two things are held here: where no
 * cloud is ever born below its settling band the corrected engine is the
 * sealed one to the last bit, and where one is — a large body whose first
 * cloud is born high in thin air — the sealed engine stops it at once and
 * gives most of the entry's energy to the air at that one altitude, while the
 * corrected one flies it down until it has slowed to its terminal speed, its
 * ledger closed as tightly as the sealed one's (rule 1141 (a)).
 */

const OPTIONS: FcmOptions = {
  ablation: 3.1e-9,
  cloudDispersion: 1.21,
  cloudCapRadii: null,
  alpha: 0.53,
  split: { kind: 'mass', fragments: 2, larger: 0.78, cloud: 0.7 },
  stepM: 10,
  binM: 10,
  floorKg: 1e-3,
  maxComponents: 100_000,
};

/** The share of the entry's energy given to the air at stops (rule 1154 (b)'s
 *  ledger: what is deposited that is neither drag's work nor ablated). */
const stopped = (r: FcmResult): number =>
  (r.ledger.deposited -
    r.ledger.dragWork -
    r.ledger.ablatedEnergy -
    r.ledger.flightResidual * r.energy) /
  r.energy;

describe('rule 1227: a cloud settles once it has slowed to its terminal speed', () => {
  it('is the sealed engine to the bit where every cloud is born above its band', () => {
    // A 4 m stony body: its clouds are born fast and low enough that each
    // one's speed exceeds its terminal speed from birth.
    const body: FcmBody = {
      diameter: 4,
      velocity: 17_000,
      density: 3_300,
      angle: (45 * Math.PI) / 180,
      strength: 2e6,
    };
    const sealed = fcmEntry(body, OPTIONS);
    const corrected = fcmEntrySettle(body, OPTIONS);
    expect(corrected.energyPerBin).toEqual(sealed.energyPerBin);
    expect(corrected.ledger).toEqual(sealed.ledger);
    expect(corrected.pieces).toEqual(sealed.pieces);
  }, 60_000);

  it('flies a large body’s first cloud down instead of stopping it at birth', () => {
    // Tunguska's scale: 60 m at 15 km/s, 30° — its first cloud is born near
    // 40 km, where its local terminal speed exceeds its speed.
    const body: FcmBody = {
      diameter: 60,
      velocity: 15_000,
      density: 2_500,
      angle: (30 * Math.PI) / 180,
      strength: 9.2e5,
    };
    const sealed = fcmEntry(body, OPTIONS);
    const corrected = fcmEntrySettle(body, OPTIONS);
    expect(sealed.completed && corrected.completed).toBe(true);
    // The sealed engine gives most of the entry's energy to the air at stops.
    expect(stopped(sealed)).toBeGreaterThan(0.3);
    // The corrected one gives next to none: its clouds settle at their
    // terminal speed, carrying almost nothing.
    expect(stopped(corrected)).toBeLessThan(1e-3);
    // And its ledger closes as the sealed one's does (rule 1141 (a)).
    expect(Math.abs(corrected.ledger.massResidual)).toBeLessThan(1e-12);
    expect(Math.abs(corrected.ledger.energyResidual)).toBeLessThan(1e-12);
  }, 120_000);
});
