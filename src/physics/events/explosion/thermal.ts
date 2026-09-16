import { NUCLEAR_THERMAL_PARTITION } from '../../constants.js';
import {
  burnFluenceThreshold,
  DEFAULT_BURN_EXPOSURE,
  type BurnDegree,
  type BurnExposureSource,
  type BurnSkin,
} from '../../effects/burnExposure.js';
import type { Joules, Meters } from '../../units.js';
import { m } from '../../units.js';

/**
 * Inputs for {@link thermalFluence}.
 */
export interface ThermalFluenceInput {
  /** Slant range from the fireball centre (m). */
  distance: Meters;
  /** Total explosive yield (J). */
  yieldEnergy: Joules;
  /**
   * Fraction of total yield emitted as thermal radiation. Defaults to
   * 0.35 — Glasstone & Dolan's value for a nuclear air burst (§1.25);
   * they give 0.18 for a contact surface burst (§7.101).
   */
  thermalPartition?: number;
  /**
   * Fractional atmospheric transmission between the fireball and the
   * receiver. 1 = vacuum/clear line of sight; real clear-air values fall
   * to ~0.7 at ~10 km and ~0.3 at ~100 km. Supply a distance-dependent
   * value from the caller when modelling attenuation; defaults to 1 so
   * the bare formula returns the unshielded inverse-square envelope.
   */
  atmosphericTransmission?: number;
}

/**
 * Thermal radiation fluence (energy per unit receiver area) from a point
 * source, assuming isotropic emission and a user-supplied atmospheric
 * transmission factor:
 *
 *     Q = f · τ · W / (4π · R²)
 *
 * where f is the thermal partition and τ the transmission factor.
 *
 * Source: Glasstone & Dolan (1977), "The Effects of Nuclear Weapons"
 * (3rd ed.), §7.94–7.96. The inverse-square form is exact for a point
 * source; the partition and transmission factors bundle the real
 * spectrum, geometry, and atmospheric attenuation.
 *
 * Returns: fluence in J/m². (No dedicated branded unit — fluence is the
 * reference quantity used to evaluate burn thresholds downstream.)
 */
export function thermalFluence(input: ThermalFluenceInput): number {
  const R = input.distance as number;
  const W = input.yieldEnergy as number;
  const f = input.thermalPartition ?? NUCLEAR_THERMAL_PARTITION;
  const tau = input.atmosphericTransmission ?? 1;
  return (f * tau * W) / (4 * Math.PI * R ** 2);
}

/**
 * Inputs for {@link thirdDegreeBurnRadius}.
 */
export interface BurnRadiusInput {
  /** Total explosive yield (J). */
  yieldEnergy: Joules;
  /** Which radiant exposure the ring is drawn at (rule 81 of
   *  validation/burnRules.ts): the project's fixed fluences, or Glasstone &
   *  Dolan's own curves for this yield. Omitted,
   *  {@link DEFAULT_BURN_EXPOSURE}. `fluenceThreshold` overrides both. */
  burnExposure?: BurnExposureSource;
  /** Which of the book's three skin pigmentations its curves are read at.
   *  Omitted, the middle one. */
  burnSkin?: BurnSkin;
  /** Thermal partition; defaults to 0.35 (low-altitude nuclear burst). */
  thermalPartition?: number;
  /** Atmospheric transmission factor; defaults to 1 (unshielded). */
  atmosphericTransmission?: number;
  /**
   * Height of burst above the surface (m). When supplied, the burn
   * radius is solved self-consistently with a Beer-Lambert atmospheric
   * transmission τ(R) = exp(−R / L_eff(HOB)) so the radius reflects
   * the realistic attenuation of the thermal pulse along the slant
   * path to the receiver. Takes priority over `atmosphericTransmission`
   * when both are present.
   */
  heightOfBurst?: number;
  /**
   * Fluence threshold (J/m²). Defaults to 3.35 × 10⁵ J/m² — Glasstone &
   * Dolan's 8 cal/cm² third-degree burn line on exposed skin. Pass 1.26 ×
   * 10⁵ J/m² (3 cal/cm²) for second-degree, 4.19 × 10⁴ (1 cal/cm²) for
   * first-degree, etc.
   */
  fluenceThreshold?: number;
}

/** Thermal partition of a contact surface burst: Glasstone & Dolan
 *  (1977) §7.101 represent one by an effective 0.18. */
export const CONTACT_SURFACE_BURST_THERMAL_PARTITION = 0.18;

const FOOT_M = 0.3048;

/**
 * Thermal partition of a nuclear burst at a height of burst.
 *
 * Glasstone & Dolan give 0.18 for a contact surface burst (§7.101) and
 * 0.35 for an air burst below about 15 000 ft (Table 7.88), and derive
 * the values between — their Table 7.101 — by interpolating between the
 * two. Nimbus interpolates linearly in height, from the ground up to
 * 200·W^0.4 ft, the burst height their air-burst exposure curves assume
 * (§7.42); a burst above that height is an air burst. The linear form
 * is Nimbus's, not a transcription of Table 7.101.
 */
export function thermalPartitionForHeight(heightOfBurstM: number, yieldKilotons: number): number {
  const airBurst = NUCLEAR_THERMAL_PARTITION;
  if (!Number.isFinite(yieldKilotons) || yieldKilotons <= 0) return airBurst;
  const h = Number.isFinite(heightOfBurstM) ? Math.max(0, heightOfBurstM) : 0;
  const airBurstHeightM = 200 * yieldKilotons ** 0.4 * FOOT_M;
  if (h >= airBurstHeightM) return airBurst;
  const contact = CONTACT_SURFACE_BURST_THERMAL_PARTITION;
  return contact + (airBurst - contact) * (h / airBurstHeightM);
}

/**
 * Effective Beer-Lambert attenuation length (m) for thermal radiation
 * along a horizontal path through the lower atmosphere on a "moderately
 * clear" day (visibility ≈ 56 km). A project calibration: back-fit to
 * 1 Mt clear-day burn radii (3rd-degree ≈ 9.7 km, 2nd-degree ≈ 14 km)
 * that the code attributed to a Glasstone & Dolan figure; neither those
 * radii nor the anchors below (Castle Bravo 28 km, Hiroshima 2 km) were
 * found when the sources were rechecked in September 2026.
 * Higher-altitude bursts traverse less low-density atmosphere and the
 * effective L lengthens with HOB — see
 * {@link effectiveAtmosphericTransmittanceLength}.
 */
const THERMAL_TRANSMITTANCE_LENGTH_M = 14_000;

/**
 * Effective atmospheric attenuation length for a thermal pulse
 * radiating from a fireball at height-of-burst `hobM` and reaching a
 * surface receiver. A surface burst (HOB = 0) traverses the full
 * lower-troposphere column and uses the baseline L; a high-altitude
 * detonation bypasses part of it, so the effective L grows linearly
 * with HOB. The slope (HOB / 4 km) is calibrated to recover the
 * Tsar-Bomba 50 Mt / 4 km airburst clear-day burn radii (≈ 55 km
 * 3rd-degree, ≈ 80 km 2nd-degree, Sakharov / Glasstone).
 */
function effectiveAtmosphericTransmittanceLength(hobM: number): number {
  const hobKm = Math.max(0, hobM) / 1_000;
  return THERMAL_TRANSMITTANCE_LENGTH_M * (1 + hobKm / 4);
}

/**
 * Solve the burn radius `R` of the implicit equation
 *
 *     R · exp( R / (2 · L) ) = R_0
 *
 * where R_0 = √( f · W / (4π · Q) ) is the unshielded inverse-square
 * radius and L is the effective Beer-Lambert attenuation length. Newton
 * iteration converges quadratically; six iterations are enough to nail
 * the answer to floating-point precision for every yield from 1 kt to
 * a Chicxulub-class impact.
 */
function solveAttenuatedBurnRadius(R0: number, L: number): number {
  if (R0 <= 0) return 0;
  const halfInvL = 1 / (2 * L);
  let R = R0;
  for (let i = 0; i < 12; i++) {
    const e = Math.exp(R * halfInvL);
    const f = R * e - R0;
    const fp = e * (1 + R * halfInvL);
    if (fp === 0) break;
    const dR = f / fp;
    R = Math.max(0, R - dR);
    if (Math.abs(dR) < 1e-3) break;
  }
  return R;
}

/**
 * Slant distance at which the thermal fluence equals a given threshold —
 * the "burn radius". Inverts {@link thermalFluence} for R:
 *
 *     R = √[ f · τ · W / (4π · Q_threshold) ]
 *
 * Default threshold is the third-degree-burn line (8 cal/cm² on exposed
 * skin, a project value — see constants.ts).
 *
 * Two atmospheric-transmission modes are supported:
 *
 *   1. Caller passes `atmosphericTransmission` directly (legacy /
 *      non-iterative path). Used by unit tests that need a fixed τ.
 *
 *   2. Caller passes `heightOfBurst` (m). The function then solves
 *      self-consistently for R under Beer-Lambert attenuation
 *      τ(R) = exp(−R / L_eff(HOB)) so τ shrinks with range, reproducing
 *      the published Glasstone clear-day envelopes within ±30 % across
 *      the entire Hiroshima → Tsar-Bomba range. Phase 17 of the
 *      simulator's calibration.
 *
 *   3. Neither: τ = 1 (vacuum line of sight) — the original behaviour,
 *      retained so existing callers and tests don't break.
 */
export function thirdDegreeBurnRadius(
  input: BurnRadiusInput,
  degree: BurnDegree = 'third'
): Meters {
  const W = input.yieldEnergy as number;
  const f = input.thermalPartition ?? NUCLEAR_THERMAL_PARTITION;
  const Q =
    input.fluenceThreshold ??
    burnFluenceThreshold(degree, W, input.burnExposure ?? DEFAULT_BURN_EXPOSURE, input.burnSkin);
  const R0 = Math.sqrt((f * W) / (4 * Math.PI * Q));
  if (input.heightOfBurst !== undefined) {
    const L = effectiveAtmosphericTransmittanceLength(input.heightOfBurst);
    return m(solveAttenuatedBurnRadius(R0, L));
  }
  const tau = input.atmosphericTransmission ?? 1;
  return m(R0 * Math.sqrt(tau));
}

/**
 * Slant distance at which the thermal fluence equals the second-degree
 * burn threshold (5 cal/cm² ≈ 2.09 × 10⁵ J/m²) on exposed skin —
 * full-thickness dermal blistering, painful but typically survivable
 * without grafting in a healthy adult. Same inverse-square inversion
 * as {@link thirdDegreeBurnRadius}, with the lower fluence threshold
 * pre-baked.
 *
 * Threshold: 5 cal/cm², a project value (see constants.ts).
 */
export function secondDegreeBurnRadius(input: BurnRadiusInput): Meters {
  return thirdDegreeBurnRadius(input, 'second');
}

/**
 * Slant distance at which the thermal fluence equals the first-degree
 * burn threshold (2 cal/cm² ≈ 8.37 × 10⁴ J/m²) on exposed skin —
 * sunburn-like erythema, no blistering. Outermost burn contour in the
 * three-tier Glasstone & Dolan thermal-injury palette.
 */
export function firstDegreeBurnRadius(input: BurnRadiusInput): Meters {
  return thirdDegreeBurnRadius(input, 'first');
}
