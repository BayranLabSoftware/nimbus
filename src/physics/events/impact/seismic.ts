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

/**
 * Which energy an impact's magnitude is read from.
 *
 * - `project`: the kinetic energy delivered to the ground, none for an
 *   airburst, whose seismic effects Collins et al. (2005) do not report.
 * - `program`: as the Earth Impact Effects Program computes it (rules 154 to
 *   157 of validation/impactSeismicRules.ts): the same for a body or swarm
 *   that reaches the ground, and for an airburst the kinetic energy it keeps
 *   at its burst altitude.
 */
export type ImpactSeismicSource = 'project' | 'program';

/** What an impact that names no seismic source uses. */
export const DEFAULT_IMPACT_SEISMIC_SOURCE: ImpactSeismicSource = 'program';

export interface ImpactSeismicEnergyInput {
  kineticEnergy: Joules;
  /** The share of the kinetic energy that reaches the ground (0 for an airburst). */
  energyFractionToGround: number;
  airburst: boolean;
  /** The speed at the top of the atmosphere and where entry ends (m/s). */
  entryVelocity: number;
  endVelocity: number;
}

/** The energy the seismic magnitude is read from (J). */
export function impactSeismicEnergy(
  input: ImpactSeismicEnergyInput,
  source: ImpactSeismicSource = DEFAULT_IMPACT_SEISMIC_SOURCE
): Joules {
  const ke = input.kineticEnergy as number;
  if (source === 'program' && input.airburst) {
    const v0 = input.entryVelocity;
    return (v0 > 0 ? ke * Math.min(1, (input.endVelocity / v0) ** 2) : 0) as Joules;
  }
  return (ke * Math.max(input.energyFractionToGround, 0)) as Joules;
}

/** The Mercalli intensities the program draws a ring for, and the effective
 *  magnitude each ring is drawn at (Collins et al. 2005, Table 3). */
export const PROGRAM_SHAKING_LEVELS: readonly { mercalli: string; magnitude: number }[] = [
  { mercalli: 'III', magnitude: 3 },
  { mercalli: 'V', magnitude: 4 },
  { mercalli: 'VII', magnitude: 6 },
  { mercalli: 'IX', magnitude: 7 },
  { mercalli: 'XII', magnitude: 9 },
];

const PROGRAM_EARTH_RADIUS_KM = 6_371;
const NEAR_SLOPE = 1 / 42;
const MID_SLOPE = 1 / 208;
const MID_OFFSET = 1.1644;
const FAR_SLOPE = 1.66;
const FAR_OFFSET = 6.399;

const midAttenuation = (km: number): number => km * MID_SLOPE + MID_OFFSET;
const farAttenuation = (km: number): number =>
  FAR_SLOPE * Math.log10(km / PROGRAM_EARTH_RADIUS_KM) + FAR_OFFSET;

/** Where the program passes from Eq. 41* to Eq. 42* (km): where they cross. */
export const PROGRAM_NEAR_EDGE_KM = MID_OFFSET / (NEAR_SLOPE - MID_SLOPE);

/** Where it passes from Eq. 42* to Eq. 43* (km): where they cross. */
export const PROGRAM_FAR_EDGE_KM = ((): number => {
  let lo = 700;
  let hi = 900;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (midAttenuation(mid) < farAttenuation(mid)) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
})();

/**
 * How far the program's effective magnitude falls below the magnitude at a
 * range (km), read off the rings it draws (rules 154 to 157): Collins et al.
 * 2005's Eqs. 41* to 43*, with 1/42 and 1/208 where the paper prints 0.0238
 * and 0.0048, the distance Δ of Eq. 43* in radians, and each equation in force
 * out to where it meets the next, so the effective magnitude is continuous.
 */
export function programSeismicAttenuation(rangeKm: number): number {
  if (rangeKm < PROGRAM_NEAR_EDGE_KM) return rangeKm * NEAR_SLOPE;
  if (rangeKm < PROGRAM_FAR_EDGE_KM) return midAttenuation(rangeKm);
  return farAttenuation(rangeKm);
}

/** The range (km) at which the program's effective magnitude falls to
 *  `effectiveMagnitude`; 0 where the magnitude does not reach it. */
export function programShakingRadiusKm(magnitude: number, effectiveMagnitude: number): number {
  const drop = magnitude - effectiveMagnitude;
  if (!(drop > 0)) return 0;
  if (drop < PROGRAM_NEAR_EDGE_KM * NEAR_SLOPE) return drop / NEAR_SLOPE;
  if (drop < midAttenuation(PROGRAM_FAR_EDGE_KM)) return (drop - MID_OFFSET) / MID_SLOPE;
  return PROGRAM_EARTH_RADIUS_KM * 10 ** ((drop - FAR_OFFSET) / FAR_SLOPE);
}
