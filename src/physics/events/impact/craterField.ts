/**
 * Whether a body that reaches the ground as a swarm digs one crater or a
 * crater field (B-123: rules 838 to 845 of validation/craterFieldRules.ts, and
 * 846 to 853 of validation/craterFieldJoinedRules.ts).
 *
 * - `single`: one crater of the whole swarm at its speed at the ground,
 *   however wide the swarm has spread — what the model did until then.
 * - `field`: as Collins, Melosh & Marcus (2005, p. 821) and their program
 *   decide it, a crater field wherever the swarm's spread at the ground, L(0),
 *   is at least the transient crater the whole swarm would dig; the crater is
 *   then the largest fragment's, half of it, as the program prints it.
 *   Refused by rules 838 to 845: the halving steps, and a body 0.1 % larger
 *   can dig a crater half as wide. Kept by name, for the record.
 * - `joined`: the same test and the same half from twice the crater on, with
 *   the crater shrinking as D_tc² / L between once and twice it — no step
 *   (rules 846 to 853).
 */
import {
  CRATER_FIELD_LARGEST_FRAGMENT,
  CRATER_FIELD_THRESHOLD,
} from '../../validation/craterFieldRules.js';

export type CraterField = 'single' | 'field' | 'joined';

/** What an impact that names no crater field uses. */
export const DEFAULT_CRATER_FIELD: CraterField = 'single';

/**
 * The share of the whole swarm's transient crater the crater keeps: one for a
 * single crater, the largest fragment's for a field.
 */
export function craterFieldShare(law: CraterField, spreadM: number, wholeCraterM: number): number {
  if (law === 'single') return 1;
  if (!(wholeCraterM > 0) || !(spreadM > 0)) return 1;
  if (law === 'field')
    return spreadM >= CRATER_FIELD_THRESHOLD * wholeCraterM ? CRATER_FIELD_LARGEST_FRAGMENT : 1;
  // Rule 846 (i): whole up to the threshold, the program's half from twice
  // it, and the whole crater shrinking as the spread passes it between.
  const joined = (CRATER_FIELD_THRESHOLD * wholeCraterM) / spreadM;
  return Math.min(1, Math.max(CRATER_FIELD_LARGEST_FRAGMENT, joined));
}
