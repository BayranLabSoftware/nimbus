import type { PercentileSummary } from '../../physics/montecarlo/engine.js';
import {
  MC_RARE_SHARE,
  MC_SHARE_SHOWN_WHOLE,
} from '../../physics/validation/monteCarloShareRules.js';

export interface McCells {
  p10: number;
  p50: number;
  p90: number;
}

/**
 * How the Monte Carlo panel shows one row (validation/monteCarloShareRules.ts):
 *   - `whole`: above rule 890's share, the P10, P50 and P90 of every draw;
 *   - `share`: how often it happens and the percentiles of those runs;
 *   - `rare`: rule 905 — below 1 %, no percentile in the cells, how many runs
 *     it happened in, and their percentiles on a line of their own;
 *   - `never`: in no run.
 */
export type McRow =
  | { kind: 'whole'; cells: McCells }
  | { kind: 'share'; share: number; cells: McCells | null }
  | { kind: 'rare'; happened: number; runs: number; given: McCells | null }
  | { kind: 'never' };

/**
 * The row of one quantity. `samples` are the engine's finite draws of it
 * (`rawSamples`); where they are missing the count is read from the share
 * over `iterations`.
 */
export function monteCarloRow(
  band: PercentileSummary,
  samples: readonly number[] | undefined,
  iterations: number
): McRow {
  if (band.share > MC_SHARE_SHOWN_WHOLE) return { kind: 'whole', cells: band };
  if (band.share <= 0) return { kind: 'never' };
  if (band.share < MC_RARE_SHARE) {
    const runs = samples?.length ?? iterations;
    const happened =
      samples === undefined
        ? Math.max(1, Math.round(band.share * iterations))
        : samples.filter((x) => x > 0).length;
    return { kind: 'rare', happened, runs, given: band.given };
  }
  return { kind: 'share', share: band.share, cells: band.given };
}
