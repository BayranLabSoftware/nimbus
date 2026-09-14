import type { Joules } from '../../units.js';

/** Fraction of an impact's kinetic energy radiated as seismic waves,
 *  as Collins et al. (2005) take it: one part in ten thousand, "the most
 *  commonly accepted figure" from experiments (Schultz & Gault 1975). */
export const SEISMIC_EFFICIENCY = 1e-4;

/** The range Collins et al. (2005) give that efficiency. */
export const SEISMIC_EFFICIENCY_RANGE = { low: 1e-5, high: 1e-3 } as const;

/**
 * Seismic magnitude of an impact from the kinetic energy it delivers to
 * the ground.
 *
 *     M = 0.67 · log10(E) − 5.87     (E in joules)
 *
 * Source: Collins, Melosh & Marcus (2005), "Earth Impact Effects Program",
 * Meteoritics & Planetary Science 40 (6), 817–840, Eq. 40*
 * (DOI: 10.1111/j.1945-5100.2005.tb00157.x): the Gutenberg–Richter
 * magnitude–energy relation (Melosh 1989, p. 67) applied to the
 * seismic energy radiated at an efficiency of 10⁻⁴ (Schultz & Gault 1975,
 * DOI: 10.1007/BF00577875).
 *
 * Another efficiency k scales the radiated energy by k / 10⁻⁴, so the
 * magnitude moves by 0.67 · log10(k / 10⁻⁴): ±0.67 across the 10⁻⁵–10⁻³
 * range Collins et al. give. For comparison, Teanby & Wookey (2011)
 * assumed 2 × 10⁻⁵ for impacts on Mars; Teanby (2015, Icarus 256, 49–62,
 * DOI: 10.1016/j.icarus.2015.04.012) found their predictions agreed with
 * his far better at 5 × 10⁻⁴, near the upper end of laboratory studies.
 *
 * M is an energy magnitude. Reading 10⁻⁴·E as a seismic moment instead,
 * and converting with Hanks & Kanamori, gives about 2.9 units less for
 * every impact: an earthquake's moment is some 2 × 10⁴ times the energy
 * it radiates (Kanamori 1977), so that reading is not the same efficiency.
 */
export function seismicMagnitude(energy: Joules, seismicEfficiency = SEISMIC_EFFICIENCY): number {
  const E = energy as number;
  if (!Number.isFinite(E) || E <= 0) return 0;
  if (!Number.isFinite(seismicEfficiency) || seismicEfficiency <= 0) return 0;
  return 0.67 * Math.log10(E * (seismicEfficiency / SEISMIC_EFFICIENCY)) - 5.87;
}
