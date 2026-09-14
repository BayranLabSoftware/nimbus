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
import type {
  Joules,
  KilogramPerCubicMeter,
  Meters,
  MetersPerSecond,
  Pascals,
  Radians,
} from '../units.js';
import { J, kgPerM3, m, mps, Pa } from '../units.js';

/**
 * Atmospheric entry of a cosmic impactor: Collins, Melosh & Marcus
 * (2005), "Earth Impact Effects Program", Meteoritics & Planetary
 * Science 40 (6): 817–840, "Atmospheric entry", Eqs. 5–20, with their
 * constants — an exponential atmosphere of scale height 8 km and surface
 * density 1 kg/m³, a drag coefficient of 2 and a pancake factor of 7.
 *
 * The body flies a straight line and slows by drag (Eq. 8) until the
 * ram pressure exceeds its strength (Eqs. 10–12, their analytic
 * approximation of the breakup altitude). A body too strong to break
 * reaches the ground whole. A broken body flattens into a pancake that
 * spreads until it is seven times its size (Eqs. 15–16): if that happens
 * above the ground it is an airburst (Eq. 18); otherwise the swarm
 * strikes the ground at the speed the drag on the spreading pancake
 * leaves it (Eqs. 17, 19, 20).
 *
 * Until 14 September 2026 this was a classifier tuned on Chelyabinsk and
 * Tunguska — a burst two scale heights below breakup, less a
 * logarithmic correction for size, and at most three tenths of the
 * energy left for the ground once a body broke. Against the Earth Impact
 * Effects Program, run by Collins et al., it burst in the air bodies of
 * 100 m to 1 km that their equations bring to the ground with nearly all
 * their energy (validation/eiepComparison.ts). These are their
 * equations, and the same grid holds them to the program.
 *
 * Other references: Chyba, Thomas & Zahnle (1993), Nature 361: 40–44
 * (the pancake model); Popova et al. (2011), M&PS 46: 1525–1550 (the
 * strength classes); Popova et al. (2013), Science 342: 1069–1073
 * (Chelyabinsk).
 */

/** Surface atmospheric density, as Collins et al. take it (kg/m³). */
const RHO_0 = 1;
/** Atmospheric scale height (m). */
const H_SCALE = 8_000;
/** Drag coefficient. */
const DRAG_COEFFICIENT = 2;
/** Pancake factor: the spread, as a multiple of the body's diameter, at
 *  which the fragments go their own ways and the airburst is declared. */
const PANCAKE_FACTOR = 7;
/** Standard gravity, for the terminal velocity (m/s²). */
const GRAVITY = 9.81;

/**
 * Collins et al. 2005 Eq. 9: the yield strength an impactor of this
 * density is given when no strength class is chosen,
 * log₁₀ Y = 2.107 + 0.0624 √ρ, fitted from comets to irons between 1000
 * and 8000 kg/m³.
 */
export function collinsStrength(density: KilogramPerCubicMeter): Pascals {
  const rho = Math.max(density, 0);
  return Pa(10 ** (2.107 + 0.0624 * Math.sqrt(rho)));
}

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
  /** Airburst altitude (m), Collins et al. Eq. 18; 0 when the body or
   *  its swarm reaches the ground. */
  burstAltitude: Meters;
  /** Breakup altitude (m), Eq. 11; 0 for a body that never breaks. */
  breakupAltitude: Meters;
  /** INTACT: never breaks. PARTIAL_AIRBURST: breaks, and the swarm
   *  still strikes the ground. COMPLETE_AIRBURST: the swarm spreads to
   *  seven times its size above the ground. */
  regime: EntryRegime;
  /** Speed where entry ends (m/s): at the ground for a body or swarm
   *  that reaches it (Eqs. 8, 17, 20, never below the terminal velocity
   *  of a body that stays whole), at the burst altitude for an airburst
   *  (Eqs. 17, 19). */
  endVelocity: MetersPerSecond;
  /**
   * Fraction of the kinetic energy at the top of the atmosphere that
   * reaches the ground: (v_end / v₀)² for a body or swarm that strikes
   * it, 0 for an airburst, whose fragments Collins et al. leave without
   * a crater. The complement is deposited in the air.
   */
  energyFractionToGround: number;
  /** Yield deposited in the atmosphere as the entry-phase fireball
   *  and shock pulse, in TNT-equivalent megatons: all the kinetic energy
   *  for a COMPLETE_AIRBURST, `(1 − energyFractionToGround) · KE` for a
   *  swarm that still strikes the ground, and none counted for a body
   *  that stays whole, whose drag is spread along its path. Drives the
   *  entry-damage radii below. */
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
   *  the Chelyabinsk preset, bursting at 29.0 km, the 0.5 psi ring is
   *  183 km, beyond the 108 km to which Popova et al. (2013) model
   *  window damage — and at their damage threshold, 500 Pa, the
   *  amplified model reaches ≈ 1 230 km: not a validation. 0 for
   *  INTACT. */
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
   *  bursts and INTACT events; 2.2 for the Tunguska preset (burst at
   *  9.8 km), 13.3 for the Chelyabinsk preset (29.0 km). Surfaced in
   *  the report panel so the user sees how big the altitude correction
   *  is. */
  airburstAmplificationFactor: number;
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
 * What the events say. β was fitted when a tuned classifier burst the
 * Chelyabinsk preset at 22.1 km (f = 7.0, a 0.5 psi ring at 96 km) and
 * Tunguska at 11.8 km (f = 2.6, a 5 psi ring at 19.3 km). On Collins et
 * al.'s entry equations, since 14 September 2026, Chelyabinsk bursts at
 * 29.0 km, where f = 13.3 and the 0.5 psi ring reaches 183 km; Popova et
 * al. (2013, Science 342, 1069–1073) model window damage out to 108 km,
 * for an overpressure above 500 Pa that the amplified model carries
 * ≈ 1 230 km (92 km without the factor). Tunguska bursts at 9.8 km, where
 * f = 2.2 and the 5 psi ring is 16.7 km. The factor was not refitted:
 * treat it as an order-of-magnitude correction that no record validates.
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
 * Collins et al. 2005's atmospheric entry for one impactor. `impactAngle`
 * is from the horizontal, 45° when not given; `impactorStrength` falls
 * back to {@link collinsStrength} of the density.
 */
export function atmosphericEntry(
  impactorDiameter: Meters,
  impactVelocity: MetersPerSecond,
  impactorStrength?: Pascals,
  impactorDensity: KilogramPerCubicMeter = kgPerM3(3_000),
  kineticEnergy?: Joules,
  impactAngle: Radians = (Math.PI / 4) as Radians
): AtmosphericEntryResult {
  const v0 = impactVelocity as number;
  const L0 = impactorDiameter as number;
  const rhoI = impactorDensity as number;
  const sinTheta = Math.sin(impactAngle);
  const totalKE = (kineticEnergy as number | undefined) ?? 0;
  const Y = (impactorStrength ?? collinsStrength(impactorDensity)) as number;

  const whole = (endVelocity: number, breakupAltitude = 0): AtmosphericEntryResult => ({
    burstAltitude: m(0),
    breakupAltitude: m(breakupAltitude),
    regime: 'INTACT',
    endVelocity: mps(endVelocity),
    energyFractionToGround: v0 > 0 ? Math.min(1, (endVelocity / v0) ** 2) : 1,
    atmosphericYieldMegatons: 0,
    ...ZERO_ENTRY_DAMAGE,
  });

  if (
    ![v0, L0, rhoI, Y, sinTheta].every(Number.isFinite) ||
    v0 <= 0 ||
    L0 <= 0 ||
    rhoI <= 0 ||
    sinTheta <= 0
  ) {
    return whole(Math.max(v0, 0));
  }

  const density = (z: number): number => RHO_0 * Math.exp(-z / H_SCALE);
  // Eq. 8: the speed of the body, still whole, at altitude z.
  const wholeSpeed = (z: number): number =>
    v0 * Math.exp((-3 * density(z) * DRAG_COEFFICIENT * H_SCALE) / (4 * rhoI * L0 * sinTheta));

  // Eq. 12.
  const If = (4.07 * DRAG_COEFFICIENT * H_SCALE * Y) / (rhoI * L0 * v0 * v0 * sinTheta);
  if (If >= 1) {
    // Never breaks. The speed at the ground, never below the terminal
    // velocity of the body.
    const terminal = Math.sqrt((4 * rhoI * L0 * GRAVITY) / (3 * RHO_0 * DRAG_COEFFICIENT));
    return whole(Math.max(wholeSpeed(0), Math.min(terminal, v0)));
  }

  // Eq. 11: the breakup altitude.
  const zStar = Math.max(
    -H_SCALE * (Math.log(Y / (RHO_0 * v0 * v0)) + 1.308 - 0.314 * If - 1.303 * Math.sqrt(1 - If)),
    0
  );
  const rhoStar = density(zStar);
  const vStar = wholeSpeed(zStar);
  // Eq. 16: the dispersion length; Eq. 18: the airburst altitude.
  const l = L0 * sinTheta * Math.sqrt(rhoI / (DRAG_COEFFICIENT * rhoStar));
  const alpha = Math.sqrt(PANCAKE_FACTOR * PANCAKE_FACTOR - 1);
  const zBurst = zStar - 2 * H_SCALE * Math.log(1 + (l / (2 * H_SCALE)) * alpha);
  // Eq. 17's coefficient on the integral of e^((z*−z)/H) L(z)².
  const k = (0.75 * DRAG_COEFFICIENT * rhoStar) / (rhoI * L0 ** 3 * sinTheta);

  if (zBurst > 0) {
    // Eq. 19: the integral from the airburst to the breakup.
    const integral =
      ((l * L0 * L0) / 24) *
      alpha *
      (8 * (3 + alpha * alpha) + 3 * alpha * (l / H_SCALE) * (2 + alpha * alpha));
    const endVelocity = vStar * Math.exp(-k * integral);
    const atmosphericYieldJ = totalKE;
    return {
      burstAltitude: m(zBurst),
      breakupAltitude: m(zStar),
      regime: 'COMPLETE_AIRBURST',
      endVelocity: mps(endVelocity),
      energyFractionToGround: 0,
      atmosphericYieldMegatons: atmosphericYieldJ / JOULES_PER_MEGATON_TNT,
      ...computeEntryDamage(atmosphericYieldJ, zBurst),
    };
  }

  // Eq. 20: the integral from the ground to the breakup.
  const r = l / H_SCALE;
  const integral =
    ((H_SCALE ** 3 * L0 * L0) / (3 * l * l)) *
    (3 * (4 + r * r) * Math.exp(zStar / H_SCALE) +
      6 * Math.exp((2 * zStar) / H_SCALE) -
      16 * Math.exp((3 * zStar) / (2 * H_SCALE)) -
      3 * r * r -
      2);
  const endVelocity = vStar * Math.exp(-k * Math.max(integral, 0));
  const energyFractionToGround = Math.min(1, (endVelocity / v0) ** 2);
  const atmosphericYieldJ = (1 - energyFractionToGround) * totalKE;
  return {
    burstAltitude: m(0),
    breakupAltitude: m(zStar),
    regime: 'PARTIAL_AIRBURST',
    endVelocity: mps(endVelocity),
    energyFractionToGround,
    atmosphericYieldMegatons: atmosphericYieldJ / JOULES_PER_MEGATON_TNT,
    ...computeEntryDamage(atmosphericYieldJ, 0),
  };
}
