/**
 * Level A of the certification plan of 22 September 2026: implementation
 * verified. The impact pipeline held to the reference implementation of the
 * equations it cites — the Earth Impact Effects Program as its authors run it
 * — case by case, on the wide grid `scripts/eiep-grid.py` fixed before any of
 * its answers was read, beside the 84 of `scripts/eiep-reference.py`.
 *
 * The bars are the reviewing astrophysicist's, written here before the grid's
 * answers were read:
 *
 * - ε = |X − ref| / ref for every pair where both answer a number above zero;
 * - under 2 %: excellent;
 * - 2 to 10 %: to be explained in writing, per quantity;
 * - over 10 %: audited, or a documented difference of design — each case
 *   named by a declared cause in {@link LEVEL_A_DIFFERENCES}, or level A is
 *   not met for its quantity;
 * - a constant sign — every pair outside the 2 % on the same side, at least
 *   ten of them — is a possible bug and is flagged, whatever its size.
 *
 * Nothing here moves a number of the model. A difference found is written
 * down or repaired in a round of its own; it is never tuned away here.
 */

import { eiepRatios, type EiepQuantity, type EiepRatio } from './eiepComparison.js';
import type { EiepRow } from './eiepReference.js';

export const LEVEL_A_BARS = { excellent: 0.02, audit: 0.1 } as const;

export type EpsilonBand = 'excellent' | 'explain' | 'audit';

export function epsilonOf(pair: EiepRatio): number {
  return Math.abs(pair.model / pair.reference - 1);
}

export function bandOf(epsilon: number): EpsilonBand {
  if (epsilon < LEVEL_A_BARS.excellent) return 'excellent';
  if (epsilon <= LEVEL_A_BARS.audit) return 'explain';
  return 'audit';
}

/**
 * A difference of design: a cause, named where it lives, that makes the
 * simulator part from the program on the pairs `applies` selects. Written
 * after the grid was read, and each says so; none moves a number.
 */
export interface LevelADifference {
  readonly id: string;
  readonly quantity: EiepQuantity;
  readonly applies: (pair: EiepRatio) => boolean;
  /** Why, specifically enough for a reader to check it in the code. */
  readonly why: string;
}

/** The documented differences. Empty until the grid is read. */
export const LEVEL_A_DIFFERENCES: readonly LevelADifference[] = [];

export interface LevelASummary {
  quantity: EiepQuantity;
  pairs: number;
  medianPercent: number;
  p90Percent: number;
  maxPercent: number;
  excellent: number;
  explain: number;
  audit: number;
  /** Audits no documented difference covers. */
  unexplained: number;
  /** Pairs outside the excellent band on each side. */
  above: number;
  below: number;
  constantSign: boolean;
}

export interface LevelARun {
  cases: number;
  /** Cases the program itself failed on (its own answer). */
  programFailed: number;
  /** Cases the simulator could not run, with its message. */
  modelFailed: { row: EiepRow; error: string }[];
  pairs: EiepRatio[];
  summaries: LevelASummary[];
  /** Every pair over the audit bar, with the difference that covers it. */
  audits: { pair: EiepRatio; epsilon: number; difference: string | null }[];
}

function quantile(sorted: readonly number[], q: number): number {
  return sorted[Math.round(q * (sorted.length - 1))] ?? Number.NaN;
}

export function summariseLevelA(pairs: readonly EiepRatio[]): LevelASummary[] {
  const quantities = [...new Set(pairs.map((p) => p.quantity))];
  return quantities.map((quantity) => {
    const own = pairs.filter((p) => p.quantity === quantity);
    const eps = own.map(epsilonOf).sort((a, b) => a - b);
    let excellent = 0;
    let explain = 0;
    let audit = 0;
    let unexplained = 0;
    let above = 0;
    let below = 0;
    for (const p of own) {
      const e = epsilonOf(p);
      const b = bandOf(e);
      if (b === 'excellent') excellent++;
      else if (b === 'explain') explain++;
      else {
        audit++;
        if (!LEVEL_A_DIFFERENCES.some((d) => d.quantity === quantity && d.applies(p)))
          unexplained++;
      }
      if (b !== 'excellent') {
        if (p.model > p.reference) above++;
        else below++;
      }
    }
    return {
      quantity,
      pairs: own.length,
      medianPercent: quantile(eps, 0.5) * 100,
      p90Percent: quantile(eps, 0.9) * 100,
      maxPercent: (eps[eps.length - 1] ?? Number.NaN) * 100,
      excellent,
      explain,
      audit,
      unexplained,
      above,
      below,
      constantSign: above + below >= 10 && (above === 0 || below === 0),
    };
  });
}

function finish(
  rows: readonly EiepRow[],
  pairs: EiepRatio[],
  modelFailed: { row: EiepRow; error: string }[],
  programFailed: number
): LevelARun {
  const audits = pairs
    .map((pair) => ({ pair, epsilon: epsilonOf(pair) }))
    .filter((a) => bandOf(a.epsilon) === 'audit')
    .map((a) => ({
      ...a,
      difference:
        LEVEL_A_DIFFERENCES.find((d) => d.quantity === a.pair.quantity && d.applies(a.pair))?.id ??
        null,
    }));
  return {
    cases: rows.length,
    programFailed,
    modelFailed,
    pairs,
    summaries: summariseLevelA(pairs),
    audits,
  };
}

/** One case: its pairs, or why the simulator could not run it. */
function readCase(
  row: EiepRow,
  pairs: EiepRatio[],
  modelFailed: { row: EiepRow; error: string }[]
): void {
  try {
    pairs.push(...eiepRatios([row]));
  } catch (e) {
    modelFailed.push({ row, error: String(e).slice(0, 200) });
  }
}

/** The whole comparison, in one go — for the validation report's generator. */
export function runLevelASync(rows: readonly EiepRow[]): LevelARun {
  const pairs: EiepRatio[] = [];
  const modelFailed: { row: EiepRow; error: string }[] = [];
  let programFailed = 0;
  for (const row of rows) {
    if (row.error !== null) programFailed++;
    else readCase(row, pairs, modelFailed);
  }
  return finish(rows, pairs, modelFailed, programFailed);
}

/**
 * The same comparison, awaiting `step` every 25 cases so that a caller in a
 * test worker can hand its event loop back (a synchronous minute makes
 * vitest's worker miss its runner — the CI of da51c86).
 */
export async function runLevelA(
  rows: readonly EiepRow[],
  step: () => Promise<void> = () => Promise.resolve()
): Promise<LevelARun> {
  const pairs: EiepRatio[] = [];
  const modelFailed: { row: EiepRow; error: string }[] = [];
  let programFailed = 0;
  for (const [i, row] of rows.entries()) {
    if (i % 25 === 0) await step();
    if (row.error !== null) programFailed++;
    else readCase(row, pairs, modelFailed);
  }
  return finish(rows, pairs, modelFailed, programFailed);
}
