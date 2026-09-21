import { IMPACT_BLAST_COUPLING, IMPACT_LUMINOUS_EFFICIENCY } from '../constants.js';
import { airburstBlastYield, airburstReach } from './airburstBlast.js';
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

/**
 * Which equations the entry is computed with, where Collins et al.'s paper and
 * the Earth Impact Effects Program part.
 *
 * - `paper`: the equations as the 2005 paper prints them.
 * - `program`: as the program computes them (rules 141 to 145 of
 *   validation/entryProgramRules.ts). Two places differ. Eq. 11 takes twice
 *   the I_f of Eq. 12 (BM-13), so a body breaks lower. And Eq. 20, the speed at
 *   the ground of a broken body, lacks the −3(l/H)² inside its bracket, which
 *   only matters for a body that breaks low. Where the doubled I_f reaches 1
 *   the program takes the square root of a negative number and answers with an
 *   error; there the paper's equations are used (rule 145).
 */
export type EntryEquations = 'paper' | 'program';

/** What an entry that names no equations uses: the paper's, since rules 691
 *  to 697 of validation/entryPaperThirdRules.ts (21 September 2026), for
 *  the reasons of rules 668 to 670 of validation/entryPaperRules.ts. Eq. 12's
 *  I_f is the exact condition, in Eqs. 8 to 10, for the ram pressure to reach
 *  the strength; on twice it a body breaks below where its ram pressure
 *  passed its strength, Sikhote-Alin does not break, and the seam with the
 *  paper's equations where the program has no answer was B-089. The
 *  program's equations were the default from rule 144 until then, and every
 *  test that holds what the program prints runs on them by name. */
export const DEFAULT_ENTRY_EQUATIONS: EntryEquations = 'paper';

/**
 * The speed of an airburst at its burst altitude, where the program's
 * equations are in place.
 *
 * - `paper`: Eq. 19's integral from the burst to the breakup.
 * - `program`: as the program computes it (rules 154 to 157 of
 *   validation/impactSeismicRules.ts): the same integral as its Eq. 20, from
 *   the burst to the breakup, without the −3(l/H)² it lacks at the ground —
 *   Eq. 19's integral plus H·L₀². The program reads an airburst's seismic
 *   magnitude from the energy the body keeps there.
 */
export type BurstSpeed = 'paper' | 'program';

/** What an airburst that names no burst speed uses. */
export const DEFAULT_BURST_SPEED: BurstSpeed = 'program';

/**
 * How the entry behaves where the program's own model reaches the edge of
 * breaking up (B-089).
 *
 * - `switch`: rule 145 — where the program's doubled I_f reaches 1, the
 *   paper's equations are used, with the paper's I_f. A body 0.1 % larger can
 *   then break up kilometres lower and send a tenth less of its energy to the
 *   ground.
 * - `joined`: the program's doubled I_f throughout, and where it reaches 1 the
 *   body does not break, as the model the program implements says; Eq. 20 and
 *   the burst speed with the paper's −3(l/H)² restored, so that a body that
 *   breaks at the ground arrives as a whole body does rather than having a
 *   whole body's drag counted twice; and a body that never breaks given the
 *   virtual altitude Eq. 18 gives at a breakup on the ground, so that its blast
 *   joins its neighbour's.
 */
export type EntryBoundary = 'switch' | 'joined';

/** What an entry that names no boundary uses. */
export const DEFAULT_ENTRY_BOUNDARY: EntryBoundary = 'switch';

/**
 * Where the flash of a complete airburst is placed (B-094).
 *
 * - `ground`: under the burst. The burn radii are the slant ranges at which
 *   the flash falls to each exposure (Glasstone & Dolan §7.94–7.96), drawn as
 *   if they were ground ranges from a flash on the ground.
 * - `burst`: at the burst altitude, where it is: a burn ring is the ground
 *   range at which the slant distance to the burst equals the range the flash
 *   reaches, and there is none where the burst is farther than that.
 *
 * A swarm that reaches the ground keeps its flash at the ground either way,
 * where the two meet as a burst altitude goes to zero.
 */
export type AirFlash = 'ground' | 'burst';

/** What an entry that names no flash placement uses. */
export const DEFAULT_AIR_FLASH: AirFlash = 'burst';

/**
 * How the flash of a complete airburst that bursts below its own fireball is
 * drawn (B-093, rules 714 to 721 of validation/lowBurstFlashRules.ts).
 *
 * - `air`: all of it in the air, at the burst altitude. A body a hair larger
 *   that reaches the ground moves the energy it keeps to the fireball on the
 *   ground at once, and its burn rings step.
 * - `fireball`: where the burst altitude z is below the fireball radius R of
 *   the energy the body keeps at its burst (Collins et al. 2005 Eq. 32*), a
 *   share 1 − z/R of that kept energy radiates as the fireball on the ground
 *   (the program's, into the half-space and dimmed by the horizon), the rest
 *   in the air; a burst on the ground is then the partial airburst it becomes.
 *   The field draws the passage where a fireball meets the ground (Glasstone &
 *   Dolan §2.18, §7.42); the share is that of the sphere's surface under the
 *   ground, over contact's.
 */
export type LowBurstFlash = 'air' | 'fireball';

/** What an impact that names no low-burst flash uses: `fireball` since rules
 *  714 to 721. */
export const DEFAULT_LOW_BURST_FLASH: LowBurstFlash = 'fireball';

/** The share of an airburst's kept energy that radiates as a fireball on the
 *  ground (B-093): 1 − z/R, with R = 0.002 · E^(1/3) the fireball radius of
 *  the kept energy E, and 0 for a burst at or above R. */
export function groundFireballShare(burstAltitude: number, keptEnergy: number): number {
  if (!(keptEnergy > 0)) return 0;
  const radius = 0.002 * Math.cbrt(keptEnergy);
  const z = Math.max(burstAltitude, 0);
  return z < radius ? 1 - z / radius : 0;
}

/** The ground range at which the slant distance to a source at `altitude`
 *  is `slant` (m); 0 where the source is farther than that. */
export function groundRangeAtSlant(slant: number, altitude: number): number {
  const z = Math.max(altitude, 0);
  return slant > z ? Math.sqrt(slant * slant - z * z) : 0;
}

export interface AtmosphericEntryResult {
  /** Airburst altitude (m), Collins et al. Eq. 18; 0 when the body or
   *  its swarm reaches the ground. */
  burstAltitude: Meters;
  /** Breakup altitude (m), Eq. 11; 0 for a body that never breaks. */
  breakupAltitude: Meters;
  /** Eq. 18's airburst altitude (m) wherever the body breaks: the burst
   *  altitude of an airburst, and below zero — under the ground — for a
   *  swarm that strikes it, where the Earth Impact Effects Program still
   *  reads its blast from it (rules 138 to 140 of
   *  validation/groundBlastRules.ts). 0 for a body that never breaks. */
  virtualBurstAltitude: Meters;
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
   *  flash radii below, and the shock of a swarm that strikes the
   *  ground; an airburst's shock is computed on {@link blastYieldMegatons}. */
  atmosphericYieldMegatons: number;
  /** Thermal-flash burn radii at ground level, from the explosion
   *  module's burn fluences with the impact luminous efficiency. Not
   *  calibrated on an event: for the Chelyabinsk preset the first-degree
   *  radius is ≈ 2.7 km, while Popova et al. (2013) report a mild sunburn,
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
  /** Shock-wave overpressure radii at ground level. An airburst's are
   *  the Earth Impact Effects Program's static source at the burst
   *  altitude (effects/airburstBlast.ts, Collins et al. 2005 and 2017) on
   *  {@link blastYieldMegatons}; a swarm that strikes the ground blasts
   *  its air share like a ground impact, Kinney & Graham on half of it.
   *  0 for INTACT. */
  shockWaveRadii: EntryShockRadii;
  /** The same rings at the high end of the program's range: within three
   *  burst altitudes of the point under the burst, twice the static
   *  source's overpressure, as Collins et al. (2017) found a moving source
   *  gives. Equal to {@link shockWaveRadii} beyond that, and for a swarm
   *  that strikes the ground. */
  shockWaveRadiiHigh: EntryShockRadii;
  /** Energy the airburst's blast is computed on, in TNT-equivalent
   *  megatons: for an airburst the larger of the kinetic energy the body
   *  keeps at the burst altitude and the energy it has given the air by
   *  then (Collins et al. 2017); for a swarm that strikes the ground, the
   *  atmospheric yield. 0 for INTACT. */
  blastYieldMegatons: number;
}

/** Ground ranges at which the entry's shock reaches three overpressures. */
export interface EntryShockRadii {
  /** 5 psi (≈ 34.5 kPa, residential collapse). */
  fivePsi: Meters;
  /** 1 psi (≈ 6.9 kPa, window breakage + minor injury). */
  onePsi: Meters;
  /** 0.5 psi (≈ 3.45 kPa, scattered-window damage and shopfront
   *  injury). */
  lightDamage: Meters;
}

/** No rings. */
const NO_SHOCK: EntryShockRadii = { fivePsi: m(0), onePsi: m(0), lightDamage: m(0) };

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
  shockWaveRadii: NO_SHOCK,
  shockWaveRadiiHigh: NO_SHOCK,
  blastYieldMegatons: 0,
} as const;

/**
 * The ground-level thermal-flash and shock-wave radii of the energy the
 * entry leaves in the air.
 *
 * The flash takes Glasstone & Dolan's burn fluences (§7) on the
 * atmospheric yield with the impact luminous efficiency, as a bare
 * inverse-square envelope: a higher burst has a longer path to the
 * ground, not a longer reach.
 *
 * The shock of an airburst (burst altitude above 0) is the Earth Impact
 * Effects Program's static source at that altitude on `blastYieldJ`
 * (effects/airburstBlast.ts), with the program's high end beside it. The
 * shock of a swarm that strikes the ground is a ground impact's: Kinney &
 * Graham on the half of the atmospheric yield that goes into the blast
 * (`IMPACT_BLAST_COUPLING`), with no range; a threshold the inversion
 * cannot reach draws no ring.
 *
 * Until 15 September 2026 an airburst's shock was that ground reach
 * multiplied by (P₀ / P(h))^(3/5), capped at 15 — a fitted exponent and
 * an unsourced cap that carried Chelyabinsk's 0.5 psi ring to 183 km, where
 * the program has no blast (B-032).
 */
function computeEntryDamage(
  atmosphericYieldJ: number,
  burstAltitudeM: number,
  blastYieldJ: number,
  airFlash: AirFlash = DEFAULT_AIR_FLASH
): Pick<
  AtmosphericEntryResult,
  'flashBurnRadii' | 'shockWaveRadii' | 'shockWaveRadiiHigh' | 'blastYieldMegatons'
> {
  if (!Number.isFinite(atmosphericYieldJ) || atmosphericYieldJ <= 0) {
    return ZERO_ENTRY_DAMAGE;
  }
  const yieldEnergy = J(atmosphericYieldJ);
  // B-094: the radii below are slant ranges; a flash at the burst altitude
  // reaches the ground only where the slant distance to it is shorter.
  const onGround = (slant: Meters): Meters =>
    airFlash === 'burst' ? m(groundRangeAtSlant(slant, burstAltitudeM)) : slant;
  const slantFlash = {
    // The atmospheric-entry flash-burn radii are an impact phenomenon
    // (thermal pulse from a meteor / bolide entry, not a nuclear
    // detonation), so the burn-radius helpers are passed the impact
    // luminous efficiency rather than the nuclear default. See the
    // matching note in `damageRings.ts` for the citation chain
    // (Collins-Melosh-Marcus 2005 / Toon 1997). And the project's own
    // exposures, as rule 81 of validation/burnRules.ts keeps them for every
    // impact: Glasstone & Dolan's curves are a nuclear fireball's pulse. Until
    // B-041 this named none and followed the explosions' default to them.
    firstDegree: firstDegreeBurnRadius({
      yieldEnergy,
      thermalPartition: IMPACT_LUMINOUS_EFFICIENCY,
      burnExposure: 'project',
    }),
    secondDegree: secondDegreeBurnRadius({
      yieldEnergy,
      thermalPartition: IMPACT_LUMINOUS_EFFICIENCY,
      burnExposure: 'project',
    }),
    thirdDegree: thirdDegreeBurnRadius({
      yieldEnergy,
      thermalPartition: IMPACT_LUMINOUS_EFFICIENCY,
      burnExposure: 'project',
    }),
  };
  const flashBurnRadii = {
    firstDegree: onGround(slantFlash.firstDegree),
    secondDegree: onGround(slantFlash.secondDegree),
    thirdDegree: onGround(slantFlash.thirdDegree),
  };

  if (Number.isFinite(burstAltitudeM) && burstAltitudeM > 0) {
    const blastYield = J(Math.max(blastYieldJ, 0));
    const altitude = m(burstAltitudeM);
    const rings = (end: 'low' | 'high'): EntryShockRadii => ({
      fivePsi: airburstReach(OVERPRESSURE_BUILDING_COLLAPSE, altitude, blastYield, end),
      onePsi: airburstReach(OVERPRESSURE_WINDOW_BREAK, altitude, blastYield, end),
      lightDamage: airburstReach(OVERPRESSURE_LIGHT_DAMAGE, altitude, blastYield, end),
    });
    return {
      flashBurnRadii,
      shockWaveRadii: rings('low'),
      shockWaveRadiiHigh: rings('high'),
      blastYieldMegatons: (blastYield as number) / JOULES_PER_MEGATON_TNT,
    };
  }

  const blastEnergy = J(atmosphericYieldJ * IMPACT_BLAST_COUPLING);
  const groundReach = (target: Pascals): Meters => {
    try {
      return distanceForOverpressure(blastEnergy, target);
    } catch {
      return m(0);
    }
  };
  const shockWaveRadii: EntryShockRadii = {
    fivePsi: groundReach(OVERPRESSURE_BUILDING_COLLAPSE),
    onePsi: groundReach(OVERPRESSURE_WINDOW_BREAK),
    lightDamage: groundReach(OVERPRESSURE_LIGHT_DAMAGE),
  };
  return {
    flashBurnRadii,
    shockWaveRadii,
    shockWaveRadiiHigh: shockWaveRadii,
    blastYieldMegatons: atmosphericYieldJ / JOULES_PER_MEGATON_TNT,
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
  impactAngle: Radians = (Math.PI / 4) as Radians,
  equations: EntryEquations = DEFAULT_ENTRY_EQUATIONS,
  burstSpeed: BurstSpeed = DEFAULT_BURST_SPEED,
  boundary: EntryBoundary = DEFAULT_ENTRY_BOUNDARY,
  airFlash: AirFlash = DEFAULT_AIR_FLASH
): AtmosphericEntryResult {
  const program = equations === 'program';
  const joined = boundary === 'joined';
  const v0 = impactVelocity as number;
  const L0 = impactorDiameter as number;
  const rhoI = impactorDensity as number;
  const sinTheta = Math.sin(impactAngle);
  const totalKE = (kineticEnergy as number | undefined) ?? 0;
  const Y = (impactorStrength ?? collinsStrength(impactorDensity)) as number;

  const whole = (
    endVelocity: number,
    breakupAltitude = 0,
    virtualAltitude = 0
  ): AtmosphericEntryResult => ({
    burstAltitude: m(0),
    breakupAltitude: m(breakupAltitude),
    virtualBurstAltitude: m(virtualAltitude),
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

  // Eq. 12, doubled where the program doubles it (BM-13). Where the doubled
  // value reaches 1 the program takes the square root of a negative number
  // and has no answer, and the paper's equations are used (rule 145 of
  // validation/entryProgramRules.ts).
  const paperIf = (4.07 * DRAG_COEFFICIENT * H_SCALE * Y) / (rhoI * L0 * v0 * v0 * sinTheta);
  const followsProgram = program && (joined || 2 * paperIf < 1);
  const If = followsProgram ? 2 * paperIf : paperIf;
  const alpha = Math.sqrt(PANCAKE_FACTOR * PANCAKE_FACTOR - 1);
  if (If >= 1) {
    // Never breaks. The speed at the ground, never below the terminal
    // velocity of the body.
    const terminal = Math.sqrt((4 * rhoI * L0 * GRAVITY) / (3 * RHO_0 * DRAG_COEFFICIENT));
    // Joined (B-089): the virtual altitude of a breakup on the ground, Eq. 18
    // at z* = 0, which is where a body that only just breaks has it.
    const groundL = L0 * sinTheta * Math.sqrt(rhoI / (DRAG_COEFFICIENT * RHO_0));
    const groundVirtual = joined
      ? -2 * H_SCALE * Math.log(1 + (groundL / (2 * H_SCALE)) * alpha)
      : 0;
    return whole(Math.max(wholeSpeed(0), Math.min(terminal, v0)), 0, groundVirtual);
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
  const zBurst = zStar - 2 * H_SCALE * Math.log(1 + (l / (2 * H_SCALE)) * alpha);
  // Eq. 17's coefficient on the integral of e^((z*−z)/H) L(z)².
  const k = (0.75 * DRAG_COEFFICIENT * rhoStar) / (rhoI * L0 ** 3 * sinTheta);

  if (zBurst > 0) {
    // Eq. 19: the integral from the airburst to the breakup. The program
    // takes its Eq. 20 between the same altitudes, without the −3(l/H)² term,
    // which is Eq. 19 plus H·L₀² (`BurstSpeed`).
    const integral =
      ((l * L0 * L0) / 24) *
        alpha *
        (8 * (3 + alpha * alpha) + 3 * alpha * (l / H_SCALE) * (2 + alpha * alpha)) +
      (followsProgram && burstSpeed === 'program' && !joined ? H_SCALE * L0 * L0 : 0);
    const endVelocity = vStar * Math.exp(-k * integral);
    const atmosphericYieldJ = totalKE;
    // Collins et al. 2017: the blast is given the larger of the energy the
    // body keeps at the burst altitude and the energy it has lost by then.
    const blastYield = airburstBlastYield(J(totalKE), (endVelocity / v0) ** 2);
    return {
      burstAltitude: m(zBurst),
      breakupAltitude: m(zStar),
      virtualBurstAltitude: m(zBurst),
      regime: 'COMPLETE_AIRBURST',
      endVelocity: mps(endVelocity),
      energyFractionToGround: 0,
      atmosphericYieldMegatons: atmosphericYieldJ / JOULES_PER_MEGATON_TNT,
      ...computeEntryDamage(atmosphericYieldJ, zBurst, blastYield, airFlash),
    };
  }

  // Eq. 20: the integral from the ground to the breakup.
  const r = l / H_SCALE;
  const integral =
    ((H_SCALE ** 3 * L0 * L0) / (3 * l * l)) *
    (3 * (4 + r * r) * Math.exp(zStar / H_SCALE) +
      6 * Math.exp((2 * zStar) / H_SCALE) -
      16 * Math.exp((3 * zStar) / (2 * H_SCALE)) -
      (followsProgram && !joined ? 0 : 3 * r * r) -
      2);
  const endVelocity = vStar * Math.exp(-k * Math.max(integral, 0));
  const energyFractionToGround = Math.min(1, (endVelocity / v0) ** 2);
  const atmosphericYieldJ = (1 - energyFractionToGround) * totalKE;
  return {
    burstAltitude: m(0),
    breakupAltitude: m(zStar),
    virtualBurstAltitude: m(zBurst),
    regime: 'PARTIAL_AIRBURST',
    endVelocity: mps(endVelocity),
    energyFractionToGround,
    atmosphericYieldMegatons: atmosphericYieldJ / JOULES_PER_MEGATON_TNT,
    ...computeEntryDamage(atmosphericYieldJ, 0, atmosphericYieldJ, airFlash),
  };
}
