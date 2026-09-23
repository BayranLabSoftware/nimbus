/**
 * Whether a body that reaches the ground as a swarm digs one crater or a
 * crater field (B-123, rules 838 to 845 of validation/craterFieldRules.ts).
 *
 * - `single`: one crater of the whole swarm at its speed at the ground,
 *   however wide the swarm has spread — what the model did until then.
 * - `field`: as Collins, Melosh & Marcus (2005, p. 821) and their program
 *   decide it, a crater field wherever the swarm's spread at the ground, L(0),
 *   is at least the transient crater the whole swarm would dig; the crater is
 *   then the largest fragment's, half of it, as the program prints it.
 */
import {
  CRATER_FIELD_LARGEST_FRAGMENT,
  CRATER_FIELD_THRESHOLD,
} from '../../validation/craterFieldRules.js';

export type CraterField = 'single' | 'field';

/** What an impact that names no crater field uses. */
export const DEFAULT_CRATER_FIELD: CraterField = 'single';

/**
 * The share of the whole swarm's transient crater the crater keeps: one for a
 * single crater, the largest fragment's for a field.
 */
export function craterFieldShare(law: CraterField, spreadM: number, wholeCraterM: number): number {
  if (law !== 'field') return 1;
  if (!(wholeCraterM > 0) || !(spreadM > 0)) return 1;
  return spreadM >= CRATER_FIELD_THRESHOLD * wholeCraterM ? CRATER_FIELD_LARGEST_FRAGMENT : 1;
}
