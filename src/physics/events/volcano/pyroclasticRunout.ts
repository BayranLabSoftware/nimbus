import type { Meters } from '../../units.js';
import { m } from '../../units.js';

/**
 * Mobility coefficient K (km / km) in the simplified runout relation:
 *
 *     L_km = K · V_km³^(1/3)
 *
 * Default K = 10 is a project value. With it the formula gives
 * Mt St Helens 1980 (V ≈ 1.2 km³) → ≈ 11 km runout, Krakatoa 1883
 * (V ≈ 20 km³) → ≈ 27 km, and Tambora 1815 (V ≈ 140 km³) → ≈ 52 km;
 * the comparison with observed runouts has not been rechecked
 * against sources.
 */
export const PYROCLASTIC_MOBILITY_COEFFICIENT = 10;

export interface PyroclasticRunoutInput {
  /** Bulk ejecta volume (m³). The runout formula is insensitive to
   *  whether this is DRE or deposited tephra beyond the ~2× scatter
   *  already baked into K. */
  ejectaVolume: number;
  /** Override mobility coefficient K. Defaults to 10 (dense-flow H/L
   *  ≈ 0.1). Use a lower value for valley-fill flows with aggressive
   *  interaction, higher for long-runout ignimbrites. */
  mobilityCoefficient?: number;
}

/**
 * Maximum runout distance of a collapse-driven pyroclastic density
 * current, using the H/L ≈ 0.1 mobility approximation:
 *
 *     L = K · V^(1/3)        (V in km³, L in km)
 *
 * A Nimbus volume scaling for PDC reach that does not ask the user
 * for the column collapse height or the slope profile. For rigorous
 * hazard mapping, replace with a two-phase Titan2D-style depth-averaged
 * simulation — outside the M3 popular-science scope.
 *
 * Background, not the source of the equation: Sheridan (1979),
 * "Emplacement of pyroclastic flows: A review", in Ash-Flow Tuffs (GSA
 * Special Paper 180, pp. 125–136, DOI: 10.1130/SPE180-p125); Hayashi &
 * Self (1992), JGR 97 (B6), 9063–9071, on the mobility H/L of
 * pyroclastic flows falling with volume.
 */
export function pyroclasticRunout(input: PyroclasticRunoutInput): Meters {
  const K = input.mobilityCoefficient ?? PYROCLASTIC_MOBILITY_COEFFICIENT;
  const volumeKm3 = input.ejectaVolume / 1e9;
  if (volumeKm3 <= 0) return m(0);
  const lengthKm = K * volumeKm3 ** (1 / 3);
  return m(lengthKm * 1_000);
}
