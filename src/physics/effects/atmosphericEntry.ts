import { ussaPressure, USSA_SEA_LEVEL_PRESSURE } from '../atmosphere/ussa1976.js';
import { IMPACT_BLAST_COUPLING, IMPACT_LUMINOUS_EFFICIENCY } from '../constants.js';
import {
  OVERPRESSURE_LIGHT_DAMAGE,
  OVERPRESSURE_WINDOW_BREAK,
  OVERPRESSURE_BUILDING_COLLAPSE,
  distanceForOverpressure,
} from '../events/impact/damageRings.js';
import {
  firstDegreeBurnRadius,
  secondDegreeBurnRadius,
  thirdDegreeBurnRadius,
} from '../events/explosion/thermal.js';
import type { Joules, KilogramPerCubicMeter, Meters, MetersPerSecond, Pascals } from '../units.js';
import { J, m, Pa } from '../units.js';

/**
 * Atmospheric-entry airburst classifier for cosmic impactors, based on
 * the Chyba, Thomas & Zahnle (1993) "pancake" fragmentation model.
 *
 * References:
 *   Chyba, C. F., Thomas, P. J., & Zahnle, K. J. (1993).
 *   "The 1908 Tunguska explosion: atmospheric disruption of a stony
 *    asteroid." Nature 361 (6407): 40–44. DOI: 10.1038/361040a0.
 *   Collins, G. S., Melosh, H. J., & Marcus, R. A. (2005). "Earth
 *    Impact Effects Program." Meteoritics & Planetary Science 40 (6),
 *    817–840, "Atmospheric entry", Eqs. 5–20.
 *   Popova, O. P., Jenniskens, P., Emel'yanenko, V., et al. (2013).
 *    "Chelyabinsk airburst, damage assessment, meteorite recovery,
 *    and characterization." Science 342 (6162): 1069–1073.
 *    DOI: 10.1126/science.1242642.
 *
 * Physical picture: as the impactor descends, ram pressure q = ρ_air·v²
 * grows exponentially. When q exceeds the object's tensile strength Y
 * it fragments; the fragment cloud ("pancake") continues to
 * decelerate while spreading laterally, and deposits its energy lower
 * down (larger bodies penetrate deeper).
 *
 * The implementation is a simplified classifier, not Collins et al.'s
 * pancake integration: the breakup altitude is the leading term of
 * their Eq. 11*, the burst sits two scale heights lower less a
 * diameter-dependent penetration correction, and both the correction
 * and the ground-energy ramp are Nimbus choices tuned against
 * Chelyabinsk 2013 (burst at 27.0 km, Popova et al. 2013) and Tunguska
 * 1908. Collins et al. apply their entry model only to impactors under
 * 1 km across; this classifier runs for every size.
 */

/** Sea-level atmospheric density (ICAO Standard Atmosphere, ISO 2533). */
const RHO_0 = 1.225;
/** Atmospheric scale height (ISA, low-atmosphere fit). */
const H_SCALE = 8_000;
/** Empirical diameter-penetration coefficient — tuned against
 *  Tunguska + Chelyabinsk observations. */
const PENETRATION_COEFFICIENT = 1.2;
/** Diameter below which the pancake has no extra penetration. */
const PENETRATION_REFERENCE_DIAMETER = 10;

/**
 * Tensile-strength ranges for the main impactor classes. Values from
 * Popova et al. (2011), "Very low strengths of interplanetary
 * meteoroids and small asteroids", M&PS 46 (10), Table 2 / §6.
 * Pascals.
 */
export const IMPACTOR_STRENGTH = {
  COMETARY: Pa(1e4),
  C_TYPE: Pa(1e5),
  STONY: Pa(1e6),
  S_TYPE: Pa(2e6),
  IRON: Pa(5e7),
} as const;

export type ImpactorStrengthClass = keyof typeof IMPACTOR_STRENGTH;

/** Outcome of the atmospheric-entry pass. */
export type EntryRegime = 'INTACT' | 'PARTIAL_AIRBURST' | 'COMPLETE_AIRBURST';

export interface AtmosphericEntryResult {
  /** Altitude of peak energy deposition (m). 0 for INTACT. */
  burstAltitude: Meters;
  /** Fragmentation-onset altitude (m). 0 for INTACT. */
  breakupAltitude: Meters;
  regime: EntryRegime;
  /**
   * Fraction of the original kinetic energy that reaches the ground
   * as cratering / seismic work. Complement (1 − this) is deposited
   * in the atmosphere as thermal + blast.
   *
   * NOTE: the ramp that maps burst altitude → ground fraction
   * (≈ 0.02 for a complete airburst ≥ 15 km, rising to ≈ 0.30 near the
   * surface) is a Nimbus HEURISTIC, not a Chyba/Collins equation. The
   * trend is physically correct (higher burst → less ground coupling);
   * the specific break points / slopes are uncited engineering choices.
   */
  energyFractionToGround: number;
  /** Penetration-depth bonus added to the breakup-to-burst gap by the
   *  pancake's mass. The CONCEPT — that larger bodies penetrate deeper
   *  before peak energy deposition — is from Chyba et al. (1993) /
   *  Collins et al. (2005); the specific functional form
   *  `1.2 · ln(D/10) · H_scale` and its coefficient are a Nimbus tuning
   *  calibrated against Tunguska + Chelyabinsk (see
   *  {@link PENETRATION_COEFFICIENT}), NOT a transcribed equation. For
   *  very large bodies (D ≫ 10 m) this can exceed the breakup altitude
   *  itself, so the body never bursts in the atmosphere and the
   *  simulator flags it `INTACT` even though fragmentation began at high
   *  altitude. 0 for objects below the 10 m reference diameter. */
  penetrationBonus: Meters;
  /** Yield deposited in the atmosphere as the entry-phase fireball
   *  and shock pulse — `(1 − energyFractionToGround) · KE`, expressed
   *  in TNT-equivalent megatons. 0 for INTACT events (all the kinetic
   *  energy reaches the ground); 98 % of the kinetic energy for a
   *  COMPLETE_AIRBURST (gf = 0.02). Drives the entry-damage radii below. */
  atmosphericYieldMegatons: number;
  /** Thermal-flash burn radii at ground level, from the explosion
   *  module's burn fluences with the impact luminous efficiency. Not
   *  calibrated on an event: for the Chelyabinsk preset the first-degree
   *  radius is ≈ 2 km, while Popova et al. (2013) report a mild sunburn,
   *  from ultraviolet, 30 km from the point of peak brightness. 0 for
   *  INTACT. */
  flashBurnRadii: {
    /** Ground range to 2 cal/cm² fluence (sunburn-like erythema). */
    firstDegree: Meters;
    /** Ground range to 5 cal/cm² fluence (full-thickness blistering). */
    secondDegree: Meters;
    /** Ground range to 8 cal/cm² fluence (charring-grade burn). */
    thirdDegree: Meters;
  };
  /** Shock-wave overpressure radii at ground level, from the Kinney &
   *  Graham scaling applied to half the airburst yield AND multiplied by
   *  {@link airburstAmplificationFactor} for the burst's altitude. For
   *  the Chelyabinsk preset the 0.5 psi ring is 96 km, near the 108 km
   *  to which Popova et al. (2013) model window damage — but at their
   *  damage threshold, 500 Pa, the amplified model reaches ≈ 640 km: not
   *  a validation. 0 for INTACT. */
  shockWaveRadii: {
    /** 5 psi (≈ 34.5 kPa, residential collapse). */
    fivePsi: Meters;
    /** 1 psi (≈ 6.9 kPa, window breakage + minor injury). */
    onePsi: Meters;
    /** 0.5 psi (≈ 3.45 kPa, scattered-window damage and shopfront
     *  injury — the "Chelyabinsk reach"). */
    lightDamage: Meters;
  };
  /** Empirical Kinney-Graham → bolide-airburst amplification factor
   *  applied to the SHOCK-WAVE radii only (the argument is about a
   *  blast wave; see {@link bolideAirburstAmplification}).
   *  Thermal-flash radii are NOT amplified by it. 1.0 for surface
   *  bursts and INTACT events; 2.6 for the Tunguska preset (burst at
   *  11.8 km), 7.0 for the Chelyabinsk preset (22.1 km). Surfaced in
   *  the report panel so the user sees how big the altitude correction
   *  is. */
  airburstAmplificationFactor: number;
}

/** Return true when the atmosphere lets the object reach the surface
 *  intact (ram pressure never exceeds the impactor's strength). */
function survivesIntact(velocity: number, strength: number): boolean {
  const qGround = RHO_0 * velocity * velocity;
  return qGround < strength;
}

/**
 * Empty entry-damage block — used for INTACT regimes where no energy
 * is deposited in the atmosphere as flash + shock.
 */
const ZERO_ENTRY_DAMAGE = {
  flashBurnRadii: {
    firstDegree: m(0),
    secondDegree: m(0),
    thirdDegree: m(0),
  },
  shockWaveRadii: {
    fivePsi: m(0),
    onePsi: m(0),
    lightDamage: m(0),
  },
  airburstAmplificationFactor: 1,
} as const;

/**
 * Altitude amplification factor that lifts the Kinney-Graham (1985)
 * surface-burst overpressure radii to a burst at altitude. It is
 * applied only to the shock-wave radii — NOT to the thermal-flash
 * radii, whose line-of-sight geometry gains nothing from a higher
 * burst.
 *
 * The factor is a Nimbus plausibility argument, not a derivation from
 * a source:
 *
 * 1. It supposes a weak shock keeps its fractional overpressure
 *    ΔP / P_amb on the way down through the stratified atmosphere, so
 *    the absolute overpressure grows by P_ground / P_amb(h_b).
 * 2. It turns that gain into distance with a decay ΔP ∝ R^(−β), where
 *    β lies between the weak-shock (≈ 1) and strong-shock (≈ 3)
 *    limits. β = 5/3 is a fitted value, chosen so that Chelyabinsk and
 *    Tunguska land near their damage.
 * 3. P(h) comes from the U.S. Standard Atmosphere 1976 (NOAA-S/T
 *    76-1562) via {@link ussaPressure}.
 *
 * Together, for a fixed ground-level threshold ΔP*, an airburst at
 * altitude h_b reaches the threshold at a radius larger than a
 * sea-level burst by
 *
 *     f(h_b) = (P_ground / P_amb(h_b))^(1/β),   β = 5/3.
 *
 * What the events say. For the Chelyabinsk preset (burst at 22.1 km)
 * f = 7.0 and the 0.5 psi ring reaches 96 km. Popova et al. (2013,
 * Science 342, 1069–1073) model window damage out to 108 km, but for
 * an overpressure above 500 Pa, which the amplified model reaches
 * ≈ 640 km out (92 km without the factor): the fit to Chelyabinsk
 * compares two different thresholds and does not validate the factor.
 * For the Tunguska preset (11.8 km) f = 2.6 and the 5 psi ring is
 * 19.3 km. Treat the factor as an order-of-magnitude correction.
 *
 * The formula is capped at 15× to prevent run-away predictions for
 * synthetic stratospheric scenarios (P_amb < 1 Pa at h > 80 km
 * gives algebraic enhancements > 10⁴× that are not observationally
 * supported).
 *
 * Background reading, not the source of the formula: Whitham, G. B.
 * (1974), "Linear and Nonlinear Waves", Wiley, ISBN 978-0-471-94090-6
 * (weak shocks); Sachs, R. G. (1944), "The dependence of blast on
 * ambient pressure and temperature", BRL Report 466; ReVelle, D. O.
 * (1976), "On meteor-generated infrasound", JGR 81 (7): 1217–1230,
 * DOI: 10.1029/JA081i007p01217.
 *
 * The factor is exposed on
 * {@link AtmosphericEntryResult.airburstAmplificationFactor} so the
 * UI can surface it alongside the thermal and shock-wave radii.
 */
/** Shock decay exponent of the amplification, between the weak-shock
 *  (β ≈ 1) and strong-shock spherical (β ≈ 3) limits. A fitted value,
 *  not one taken from the literature. */
const SACHS_BETA = 5 / 3;
/** Maximum amplification factor we'll allow. Even high-altitude
 *  bursts couple to the troposphere imperfectly; without this cap a
 *  burst near the mesopause (≈ 80 km, P_amb ≈ 1 Pa) would predict a
 *  > 10⁴× enhancement that has no observational support. */
const MAX_AIRBURST_AMPLIFICATION = 15;

export function bolideAirburstAmplification(burstAltitudeM: number): number {
  if (!Number.isFinite(burstAltitudeM) || burstAltitudeM <= 0) return 1;
  const pressureAtBurst = ussaPressure(burstAltitudeM);
  if (!Number.isFinite(pressureAtBurst) || pressureAtBurst <= 0) return MAX_AIRBURST_AMPLIFICATION;
  const pressureRatio = USSA_SEA_LEVEL_PRESSURE / pressureAtBurst;
  if (pressureRatio <= 1) return 1;
  const factor = Math.pow(pressureRatio, 1 / SACHS_BETA);
  return Math.min(factor, MAX_AIRBURST_AMPLIFICATION);
}

/**
 * Compute the ground-level thermal-flash and shock-wave radii from the
 * fraction of the impactor's kinetic energy deposited in the atmosphere.
 * Reuses the Glasstone & Dolan §7 burn-fluence and §3 overpressure
 * formulas, then applies the {@link bolideAirburstAmplification} factor
 * to lift the surface-burst Kinney-Graham reach to the observed bolide-
 * entry geometry. The `distanceForOverpressure` bisector throws when
 * the requested threshold is below the value at 10⁸ m (effectively
 * infinite reach); we catch and floor to 0 so a sub-kt airburst's
 * "1 psi" reach doesn't break the pipeline.
 */
function computeEntryDamage(
  atmosphericYieldJ: number,
  burstAltitudeM: number
): Pick<
  AtmosphericEntryResult,
  'flashBurnRadii' | 'shockWaveRadii' | 'airburstAmplificationFactor'
> {
  if (!Number.isFinite(atmosphericYieldJ) || atmosphericYieldJ <= 0) {
    return ZERO_ENTRY_DAMAGE;
  }
  const yieldEnergy = J(atmosphericYieldJ);
  // Phase-17 calibration. The Kinney-Graham over-pressure inverter
  // assumes the FULL energy partitions into the air-shock; for an
  // impact only ≈ 50 % does (the rest goes into thermal radiation,
  // crater excavation, ejecta KE, ground-coupled seismic waves). See
  // `IMPACT_BLAST_COUPLING` in `src/physics/constants.ts` for the
  // citation chain. This brings the Tunguska 1 psi forest-blowdown
  // ring from +43 % to +13 % of the published value (Svetsov 1996,
  // Boslough & Crawford 2008).
  const blastEnergy = J(atmosphericYieldJ * IMPACT_BLAST_COUPLING);
  const factor = bolideAirburstAmplification(burstAltitudeM);
  // The altitude amplification is a BLAST-WAVE argument (overpressure
  // carried down through a stratified atmosphere). It applies
  // ONLY to the shock-wave radii. Thermal fluence is governed by
  // line-of-sight inverse-square geometry plus atmospheric transmission;
  // a burst at altitude has a LONGER slant path to a ground observer, so
  // the burn radius does not grow with altitude the way the shock reach
  // does. Multiplying the thermal radii by `factor` (the old behaviour)
  // was physically backwards — it inflated the high-altitude flash-burn
  // reach by up to 7×. Thermal radii therefore use the bare inverse-
  // square envelope (τ = 1) here; HOB-dependent attenuation is the
  // separate `heightOfBurst` path in thermal.ts.
  const scaleShock = (raw: Meters): Meters => m((raw as number) * factor);
  const safeDistance = (target: Pascals): Meters => {
    try {
      return scaleShock(distanceForOverpressure(blastEnergy, target));
    } catch {
      return m(0);
    }
  };
  return {
    flashBurnRadii: {
      // The atmospheric-entry flash-burn radii are an impact phenomenon
      // (thermal pulse from a meteor / bolide entry, not a nuclear
      // detonation), so the burn-radius helpers are passed the impact
      // luminous efficiency rather than the nuclear default. See the
      // matching note in `damageRings.ts` for the citation chain
      // (Collins-Melosh-Marcus 2005 / Toon 1997). No blast-amplification
      // factor is applied (see the note above).
      firstDegree: firstDegreeBurnRadius({
        yieldEnergy,
        thermalPartition: IMPACT_LUMINOUS_EFFICIENCY,
      }),
      secondDegree: secondDegreeBurnRadius({
        yieldEnergy,
        thermalPartition: IMPACT_LUMINOUS_EFFICIENCY,
      }),
      thirdDegree: thirdDegreeBurnRadius({
        yieldEnergy,
        thermalPartition: IMPACT_LUMINOUS_EFFICIENCY,
      }),
    },
    shockWaveRadii: {
      fivePsi: safeDistance(OVERPRESSURE_BUILDING_COLLAPSE),
      onePsi: safeDistance(OVERPRESSURE_WINDOW_BREAK),
      lightDamage: safeDistance(OVERPRESSURE_LIGHT_DAMAGE),
    },
    airburstAmplificationFactor: factor,
  };
}

/** TNT specific energy used for kt / Mt conversions throughout the
 *  simulator (4.184 × 10⁶ J/kg · 1 000 kg/t · 1 000 t/kt = 4.184 × 10¹²
 *  J/kt). Mirrors the constant in `events/explosion/simulate.ts` /
 *  `units.ts`. */
const JOULES_PER_MEGATON_TNT = 4.184e15;

/**
 * Decide whether a cosmic impactor airbursts in the atmosphere,
 * reaches the ground intact, or partially detonates. See the module
 * header for references and tuning procedure.
 */
export function atmosphericEntry(
  impactorDiameter: Meters,
  impactVelocity: MetersPerSecond,
  impactorStrength: Pascals = IMPACTOR_STRENGTH.STONY,
  _impactorDensity?: KilogramPerCubicMeter,
  kineticEnergy?: Joules
): AtmosphericEntryResult {
  void _impactorDensity; // reserved for a future density-aware pancake model
  const v = impactVelocity as number;
  const D = impactorDiameter as number;
  const Y = impactorStrength as number;
  const totalKE = (kineticEnergy as number | undefined) ?? 0;
  const intactYieldMegatons = 0; // INTACT regime deposits nothing in atmosphere

  if (!Number.isFinite(v) || !Number.isFinite(D) || !Number.isFinite(Y) || v <= 0 || D <= 0) {
    return {
      burstAltitude: m(0),
      breakupAltitude: m(0),
      regime: 'INTACT',
      energyFractionToGround: 1,
      penetrationBonus: m(0),
      atmosphericYieldMegatons: intactYieldMegatons,
      ...ZERO_ENTRY_DAMAGE,
    };
  }

  const penetrationBonus = Math.max(
    PENETRATION_COEFFICIENT * Math.log(D / PENETRATION_REFERENCE_DIAMETER) * H_SCALE,
    0
  );

  if (survivesIntact(v, Y)) {
    return {
      burstAltitude: m(0),
      breakupAltitude: m(0),
      regime: 'INTACT',
      energyFractionToGround: 1,
      penetrationBonus: m(penetrationBonus),
      atmosphericYieldMegatons: intactYieldMegatons,
      ...ZERO_ENTRY_DAMAGE,
    };
  }

  const qGround = RHO_0 * v * v;
  const hBreakup = H_SCALE * Math.log(qGround / Y);
  const hBurst = Math.max(hBreakup - 2 * H_SCALE - penetrationBonus, 0);

  if (hBurst <= 0) {
    return {
      burstAltitude: m(0),
      breakupAltitude: m(hBreakup),
      regime: 'INTACT',
      energyFractionToGround: 1,
      penetrationBonus: m(penetrationBonus),
      atmosphericYieldMegatons: intactYieldMegatons,
      ...ZERO_ENTRY_DAMAGE,
    };
  }

  const completeRegime = hBurst >= 15_000;
  const energyFractionToGround = completeRegime
    ? 0.02
    : (() => {
        const ramp = (hBurst - 5_000) / 10_000;
        const clamped = Math.max(0, Math.min(1, ramp));
        return 0.3 - 0.28 * clamped;
      })();
  const atmosphericYieldJ = (1 - energyFractionToGround) * totalKE;

  return {
    burstAltitude: m(hBurst),
    breakupAltitude: m(hBreakup),
    regime: completeRegime ? 'COMPLETE_AIRBURST' : 'PARTIAL_AIRBURST',
    energyFractionToGround,
    penetrationBonus: m(penetrationBonus),
    atmosphericYieldMegatons: atmosphericYieldJ / JOULES_PER_MEGATON_TNT,
    ...computeEntryDamage(atmosphericYieldJ, hBurst),
  };
}
