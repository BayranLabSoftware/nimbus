import { OUTPUT_SIGMA } from './uq/conventions.js';

/**
 * Confidence-band metadata for outputs whose published 1σ scatter is
 * large enough that rendering a single sharp number — or a crisp ring
 * on a map — is scientifically misleading.
 *
 * **Single source of truth.** The per-quantity σ (and its *kind* —
 * symmetric linear vs. multiplicative log-normal) lives in
 * {@link OUTPUT_SIGMA} in `src/physics/uq/conventions.ts`, alongside the
 * citation for each value. This module consumes that table and turns a
 * point estimate into the ±band the UI should draw. It deliberately
 * holds no σ numbers of its own so the two can never drift apart again
 * (they used to: this file previously declared a *linear* σ = 1.0 / 2.0
 * for the factor-2 / factor-3 quantities, which drove the lower bound to
 * **zero** — implying e.g. that the far-field tsunami amplitude could
 * vanish. See the band semantics below.)
 *
 * **Band semantics.**
 *   - `linear-fraction` (σ a fraction of the value): a symmetric band
 *     `[value·(1 − σ), value·(1 + σ)]`, clamped at zero on the low side.
 *     Used for moderately scattered, near-symmetric quantities
 *     (firestorm radii ±30 %, run-up ±30 %, pyroclastic runout ±70 %).
 *   - `lognormal` (σ in natural-log units): a *multiplicative* band
 *     `[value·e^(−σ), value·e^(+σ)]` — the physically correct shape for
 *     scale-spanning, "factor-of-N" quantities. A factor-2 band
 *     (σ = ln 2) becomes `[value/2, 2·value]`; a factor-3 band
 *     (σ = ln 3) becomes `[value/3, 3·value]`. The low side is strictly
 *     positive, never zero.
 *
 * The physics modules still emit point estimates; this module only
 * declares the band the UI draws around each value.
 */

export type ConfidenceField = keyof typeof OUTPUT_SIGMA;

/**
 * Effective 1σ magnitude for each field (natural-log units for
 * log-normal quantities, fractional for linear ones). Mirrors the σ
 * carried by {@link OUTPUT_SIGMA}; retained for back-compat with
 * callers that only need the scalar (e.g. sanity-bound tests).
 */
export const CONFIDENCE_SIGMA: Record<ConfidenceField, number> = Object.fromEntries(
  (Object.keys(OUTPUT_SIGMA) as ConfidenceField[]).map((field) => [
    field,
    OUTPUT_SIGMA[field].sigma,
  ])
) as Record<ConfidenceField, number>;

export interface ConfidenceBand {
  value: number;
  low: number;
  high: number;
  sigma: number;
}

/** Wrap a point estimate with its declared confidence band. */
export function bandFor(value: number, field: ConfidenceField): ConfidenceBand {
  const convention = OUTPUT_SIGMA[field];
  const sigma = convention.sigma;
  if (!Number.isFinite(value) || value <= 0) {
    return { value: 0, low: 0, high: 0, sigma };
  }
  if (convention.kind === 'lognormal') {
    // Multiplicative band: [value/k, value·k] with k = e^σ.
    return {
      value,
      low: value * Math.exp(-sigma),
      high: value * Math.exp(sigma),
      sigma,
    };
  }
  // linear-fraction (and the unused linear-absolute fallback): symmetric
  // band clamped at zero on the low side.
  return {
    value,
    low: Math.max(value * (1 - sigma), 0),
    high: value * (1 + sigma),
    sigma,
  };
}
