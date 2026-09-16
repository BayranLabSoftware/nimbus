import { ISOTROPIC_RING, windDriftAsymmetry, type RingAsymmetry } from '../../effects/asymmetry.js';
import {
  firestormArea,
  firestormSustainRadius,
  flammableIgnitionArea,
  flammableIgnitionRadius,
} from '../../effects/firestorm.js';
import { OVERPRESSURE_LIGHT_DAMAGE, distanceForOverpressure } from '../impact/damageRings.js';
import { NUCLEAR_CRATER_COEFFICIENT, nuclearApparentCraterDiameter } from './cratering.js';
import { electromagneticPulse, type EmpResult } from './emp.js';
import {
  BURIED_AIR_BLAST_MAX_SCALED_DEPTH_FT,
  hobBlastFactor,
  hobRegime,
  scaledHeightOfBurst,
  underwaterAirBlastFactor,
  type HobRegime,
} from './hob.js';
import { peakOverpressure } from './overpressure.js';
import { peakWindAtRange } from './peakWind.js';
import { initialRadiationRadii, type RadiationDoseResult } from './radiation.js';
import { computeSeaCoupling, type SeaCoupling } from '../../effects/seaCoupling.js';
import type { BurnExposureSource, BurnSkin } from '../../effects/burnExposure.js';
import type { RadiationSource } from '../../effects/initialRadiation.js';
import {
  firstDegreeBurnRadius,
  secondDegreeBurnRadius,
  thermalPartitionForHeight,
  thirdDegreeBurnRadius,
} from './thermal.js';
import { explosionTsunami, type ExplosionTsunamiResult } from './underwaterBurst.js';
import type { Joules, Meters, MetersPerSecond, Pascals, SquareMeters } from '../../units.js';
import { J, Mt, Pa, m, megatonsToJoules, mps, sqm } from '../../units.js';

/**
 * Ground-type preset used to drive the nuclear-crater coefficient.
 * Maps directly to keys in {@link NUCLEAR_CRATER_COEFFICIENT}.
 */
export type ExplosionGroundType = keyof typeof NUCLEAR_CRATER_COEFFICIENT;

/**
 * What made the blast. A nuclear device and a warehouse of ammonium
 * nitrate can release the same energy and kill very different numbers
 * of people: the nuclear one adds a thermal flash that burns and sets
 * fire to what the shock has already broken, and the casualty bands
 * of OTA 1979 were read off two cities where that is exactly what
 * happened. A chemical detonation has no such flash, so the deaths
 * come from the shock and from what it brings down.
 *
 * The physics reads it too. At the few thousand degrees of a chemical
 * explosion the thermal radiation is comparatively small and nearly
 * all the energy goes into the blast, where a nuclear burst puts about
 * half there and a third into heat (Glasstone & Dolan 1977, §1.23–1.25):
 * a chemical charge has no burn or fire radii, no initial nuclear
 * radiation, no electromagnetic pulse, and the blast of its whole yield.
 */
export type ExplosionChargeType = 'nuclear' | 'chemical';

export interface ExplosionScenarioInput {
  /** TNT-equivalent yield (megatons). Callers holding kilotons should
   *  pass e.g. 0.015 for a 15 kt Hiroshima-class device. */
  yieldMegatons: number;
  /** Nuclear unless said otherwise — the shipped conventional
   *  disasters (Beirut, Halifax, Texas City) say otherwise. */
  chargeType?: ExplosionChargeType;
  /** Which radiant exposure the burn rings are drawn at (rule 81 of
   *  validation/burnRules.ts): the project's fixed 8, 5 and 2 cal/cm², or
   *  Glasstone & Dolan's curves, where the exposure that burns grows with
   *  the yield. Omitted, {@link DEFAULT_BURN_EXPOSURE}. */
  burnExposure?: BurnExposureSource;
  /** Which of the book's three skin pigmentations its curves are read at.
   *  Omitted, the middle one — the average exposed population. Rule 83 of
   *  validation/burnRules.ts prints the other two beside it. */
  burnSkin?: BurnSkin;
  /** Which law draws the initial-radiation rings (rule 86 of
   *  validation/doseRules.ts): the project's yield^0.18 fit, or Glasstone &
   *  Dolan's own dose–range figures. Omitted,
   *  {@link DEFAULT_RADIATION_SOURCE}. */
  radiationSource?: RadiationSource;
  /** Distance from the burst point to the nearest usable sea (m).
   *  Zero or omitted means the burst is over the water. A surface
   *  burst beside the sea is not a burst in it, and this is what
   *  tells the two apart — see {@link computeSeaCoupling}. */
  shoreDistance?: Meters;
  /** Nuclear-crater ground preset. Defaults to 'FIRM_GROUND'. */
  groundType?: ExplosionGroundType;
  /** Height of burst above the target surface (m). 0 = contact surface
   *  burst. Undefined is treated as 0. Drives the Needham/Glasstone
   *  HOB correction applied on top of the baseline blast radii.
   *  Negative is a depth below the water surface: a burst within the
   *  water when it is over open water no deeper than the sea, and a
   *  buried burst — which the model does not have — anywhere else. */
  heightOfBurst?: Meters;
  /** Water depth at the burst site (m). 0 or omitted → land/airburst,
   *  no tsunami cascade. A positive value lets a burst within the water
   *  make the waves Glasstone & Dolan give (§6.119–6.121). */
  waterDepth?: Meters;
  /** Mean basin depth used for tsunami travel-time (m). Defaults to
   *  4 000 m global-ocean mean. */
  meanOceanDepth?: Meters;
  /** Ambient wind speed at burst altitude (m s⁻¹). 0 or omitted →
   *  calm, no wind drift on the thermal-pulse contour. Drives the
   *  Glasstone §7.20 thermal-pulse drift envelope applied to the
   *  thermal-burn ring's rendering geometry. */
  windSpeed?: MetersPerSecond;
  /** Compass azimuth (° clockwise from geographic North) the wind
   *  is blowing TOWARD (meteorological "wind to" convention). Only
   *  consulted when {@link windSpeed} is positive. */
  windDirectionDeg?: number;
  /** Beach slope (rad) for the Synolakis (1987) coastal run-up in
   *  the underwater-burst tsunami branch. Defaults to `atan(0.01)`
   *  (1:100 plane beach) when omitted. The store auto-derives a
   *  DEM-driven value when the click point is on land with a
   *  meaningful slope. */
  coastalBeachSlopeRad?: number;
}

/** Where the charge is when it goes off, which decides what reaches whom. */
export type BurstMedium = 'air' | 'surface' | 'water' | 'buried';

export interface BurstPlacement {
  /** In the air (a positive height), on the surface (zero), within the
   *  water (a negative height over open water, no deeper than the sea),
   *  or buried — under land or under the sea floor. A buried burst is an
   *  underground explosion, which this model does not have; it is drawn
   *  as a burst on the surface, and this says so. */
  medium: BurstMedium;
  /** Depth below the water surface (m), for a burst within the water. */
  depth?: Meters;
  /** What the depth leaves of the air blast's reach, for a burst within
   *  the water (Glasstone & Dolan §6.81, §6.53). */
  airBlastDepthFactor?: number;
  /** Whether the scaled depth is inside the 252 ft·kt^(−1/3) the §6.81
   *  relation was given for. */
  airBlastWithinStatedRange?: boolean;
}

export interface ExplosionBlastResult {
  /** Ground range at which peak overpressure drops to 5 psi (≈ 34.5 kPa),
   *  the Glasstone & Dolan residential-collapse threshold. */
  overpressure5psiRadius: Meters;
  /** Ground range at which peak overpressure drops to 1 psi (≈ 6.9 kPa),
   *  the window-breakage threshold. */
  overpressure1psiRadius: Meters;
  /** Ground range at which peak overpressure drops to 0.5 psi
   *  (≈ 3.45 kPa), the scattered-window-breakage threshold. Always
   *  greater than {@link overpressure1psiRadius}. */
  lightDamageRadius: Meters;
  /** Peak overpressure at 1 km ground range (Pa). */
  peakAt1km: Pascals;
  /** Peak overpressure at 5 km ground range (Pa). */
  peakAt5km: Pascals;
  /** HOB-corrected 5 psi ring radius — accounts for Mach reflection at
   *  optimum airburst and ground losses at surface. */
  overpressure5psiRadiusHob: Meters;
  /** HOB-corrected 1 psi ring radius. */
  overpressure1psiRadiusHob: Meters;
  /** HOB-corrected 0.5 psi (light-damage) ring radius. Phase 17 — added
   *  so the on-globe damage cascade renders the HOB-amplified 0.5 psi
   *  ring alongside its 5 / 1 psi siblings, instead of mixing
   *  surface-burst light damage with HOB-corrected blast tiers. */
  lightDamageRadiusHob: Meters;
  /** Scaled HOB z = HOB / W^(1/3), in m·kt⁻¹ᐟ³. */
  hobScaled: number;
  /** Qualitative HOB regime (surface / low / optimum / high / stratospheric). */
  hobRegime: HobRegime;
  /** Dimensionless HOB correction factor applied to the radii above. */
  hobFactor: number;
}

export interface ExplosionScenarioResult {
  inputs: ExplosionScenarioInput;
  /** Where the burst was, and what that did to its effects. */
  placement: BurstPlacement;
  yield: {
    joules: Joules;
    kilotons: number;
    megatons: number;
  };
  blast: ExplosionBlastResult;
  thermal: {
    /** Unshielded 3rd-degree-burn fluence radius (m, 8 cal/cm²). */
    thirdDegreeBurnRadius: Meters;
    /** Unshielded 2nd-degree-burn fluence radius (m, 5 cal/cm²) —
     *  full-thickness dermal blistering. Always > thirdDegreeBurnRadius. */
    secondDegreeBurnRadius: Meters;
    /** Unshielded 1st-degree-burn fluence radius (m, 2 cal/cm²) —
     *  sunburn-like erythema. Outermost burn contour. */
    firstDegreeBurnRadius: Meters;
  };
  /** Peak particle (wind) velocity at fixed reference ground ranges,
   *  derived from the Rankine–Hugoniot relation in still sea-level air
   *  (Glasstone & Dolan 1977 §3.55). Strong context for the
   *  popular-science display: a 1 Mt detonation at 5 km drives the
   *  air at category-5-hurricane speeds for a few seconds. */
  peakWind: {
    /** Peak wind speed (m s⁻¹) at 1 km from ground zero. */
    at1km: MetersPerSecond;
    /** Peak wind speed (m s⁻¹) at 5 km. */
    at5km: MetersPerSecond;
    /** Peak wind speed (m s⁻¹) at 10 km. */
    at10km: MetersPerSecond;
    /** Peak wind speed (m s⁻¹) at 50 km. */
    at50km: MetersPerSecond;
  };
  firestorm: {
    /** Radius at which flammable kindling ignites (~10 cal/cm²). */
    ignitionRadius: Meters;
    /** Radius at which the fluence can sustain a self-drawing
     *  firestorm column (~6 cal/cm²). */
    sustainRadius: Meters;
    /** Ground-disc area inside the ignition radius (m²). */
    ignitionArea: SquareMeters;
    /** Ground-disc area inside the sustain radius (m²). */
    sustainArea: SquareMeters;
  };
  crater: {
    /** Apparent (post-collapse) crater diameter for a contact surface
     *  burst on the chosen ground type (m). */
    apparentDiameter: Meters;
  };
  /** How the burst reached the sea, when it was near one. Absent when
   *  no water was in range at all. */
  seaCoupling?: SeaCoupling;
  /** Initial-radiation lethal-dose radii (Glasstone §8 / UNSCEAR 2000). */
  radiation: RadiationDoseResult;
  /** Electromagnetic-pulse footprint (Glasstone §11 / IEC 61000-2-9). */
  emp: EmpResult;
  /** Underwater / contact-water burst tsunami source. Present only
   *  when the input specifies waterDepth > 0. */
  tsunami?: ExplosionTsunamiResult;
  /** True when the burst put its energy into the water: a burst within
   *  it, which is exactly when {@link tsunami} exists. Glasstone &
   *  Dolan §6 documents that for this geometry the atmospheric
   *  pressure radii are far below the equivalent-yield land surface
   *  burst: water absorbs the bulk of the energy as compression
   *  heating and gas-bubble pulsation (only 2–5 % of the yield ends
   *  up in the surface waves, §6.54), the thermal pulse cannot escape
   *  the water column,
   *  and there is no crater. The renderer uses this flag to fade the
   *  on-globe overpressure / thermal / crater rings so the eye reads
   *  the tsunami branch as the dominant story rather than "5 psi at
   *  20 km" — a number which is misleadingly large for a contact-
   *  water detonation. The published radii are emitted unchanged so
   *  callers that want the land-equivalent reference can still read
   *  them. Glasstone & Dolan give no factor to scale them by; the
   *  "Table 6.31" this comment once promised is not in the 1977
   *  edition. */
  isContactWaterBurst: boolean;
  /** Per-ring rendering asymmetry. Conventional / nuclear surface
   *  bursts in still air are rotationally symmetric to within a few
   *  per cent — these entries default to the isotropic ring when no
   *  wind input is supplied. With a positive windSpeed the thermal
   *  contour drifts downwind per Glasstone & Dolan §7.20 (see
   *  {@link windDriftAsymmetry}); the overpressure rings stay
   *  effectively circular because the shock-front travel time is
   *  much shorter than the wind drift timescale. The crater is
   *  always isotropic — surface-burst nuclear craters are circular
   *  to within ±5 % in instrumented Plowshare data. */
  asymmetry: {
    crater: RingAsymmetry;
    thermal: RingAsymmetry;
    secondDegreeBurn: RingAsymmetry;
    overpressure5psi: RingAsymmetry;
    overpressure1psi: RingAsymmetry;
    lightDamage: RingAsymmetry;
  };
}

/**
 * Overpressure thresholds (re-exported as SI Pascals) used by
 * {@link simulateExplosion}. Kept alongside the simulator so callers
 * can inject alternative thresholds from presets without reaching
 * into the impact module.
 */
const FIVE_PSI = Pa(34_474);
const ONE_PSI = Pa(6_895);

/**
 * Composite explosion scenario — wraps the Glasstone & Dolan / Kinney-
 * Graham / Nordyke primitives into a single deterministic snapshot.
 * Surface-burst formulas are used throughout; airburst-optimum heights
 * would boost the 5 psi contour outward, but the popular-science
 * display envelope treats contact detonations as the headline case.
 *
 * No new physics — see overpressure.ts, thermal.ts, cratering.ts, and
 * impact/damageRings.ts for equation-level citations.
 */
/**
 * Above this height of burst the ground-path damage families — blast,
 * burns, firestorm, initial radiation — are zero: ambient pressure is
 * below 1% of sea level and the fitted curves are outside their
 * domain. Glasstone & Dolan (1977), §1.36 (high-altitude bursts).
 * Metres.
 */
export const HIGH_ALTITUDE_CUTOFF_M = 30_000;

export function simulateExplosion(input: ExplosionScenarioInput): ExplosionScenarioResult {
  const groundType = input.groundType ?? 'FIRM_GROUND';
  const yieldJoules = megatonsToJoules(Mt(input.yieldMegatons));
  const yieldKilotons = input.yieldMegatons * 1_000;

  const requestedHob = input.heightOfBurst === undefined ? 0 : (input.heightOfBurst as number);
  const seaDepthM = (input.waterDepth as number | undefined) ?? 0;
  const overOpenWater = seaDepthM > 0 && ((input.shoreDistance as number | undefined) ?? 0) <= 0;
  const medium: BurstMedium =
    requestedHob > 0
      ? 'air'
      : requestedHob === 0
        ? 'surface'
        : overOpenWater && -requestedHob <= seaDepthM
          ? 'water'
          : 'buried';
  // A charge below land or below the sea floor is an underground burst,
  // which this model does not have: it is drawn as a burst on the
  // surface, and the placement says so rather than inventing its effects.
  const hobMeters = medium === 'buried' ? 0 : requestedHob;
  // A burst within the water. Glasstone & Dolan: "much of the thermal
  // radiation and of the initial nuclear radiation will be absorbed
  // within a short distance of the explosion", and the fireball of the
  // BAKER shot was visible for a few thousandths of a second, until the
  // bubble reached the surface (§2.64) — so no flash, no fires, no
  // initial radiation here. Its air blast is the surface burst's at a
  // range shortened by the depth (§6.81, §6.53).
  const inWater = medium === 'water';
  const burstDepthM = inWater ? -requestedHob : 0;
  const depthFactor = inWater ? underwaterAirBlastFactor(burstDepthM, yieldKilotons) : 1;

  /* Above ~30 km there is no meaningful air path to the ground:
     ambient pressure is under 1% of sea level, and Glasstone & Dolan
     (1977, §1.36) class these as HIGH-ALTITUDE bursts with
     qualitatively different phenomenology — HEMP and auroral display,
     not blast and burns. The scaled-HOB blast curves, the
     Beer-Lambert thermal attenuation and the initial-radiation range
     tables are all fitted INSIDE the atmosphere; feeding them a
     400 km burst quietly saturates them at their domain edge and
     reports 5 psi rings and third-degree burns that never happened.
     Starfish Prime's ground-level record is street lamps failing on
     Oahu — an EMP story, which is exactly the family left running. */
  const exoatmospheric = hobMeters >= HIGH_ALTITUDE_CUTOFF_M;
  const grounded = (radius: Meters): Meters => (exoatmospheric ? m(0) : radius);

  const z = scaledHeightOfBurst(hobMeters, yieldKilotons);
  const regime = hobRegime(z);
  const factor = exoatmospheric ? 0 : inWater ? depthFactor : hobBlastFactor(z);
  const absorbed = (radius: Meters): Meters => (inWater ? m(0) : grounded(radius));

  const chemical = input.chargeType === 'chemical';
  // The blast. Kinney & Graham fit a TNT charge in free air, and a
  // charge on the ground, reflecting perfectly, makes the hemispherical
  // wave of twice its yield in free air (Takazawa, Kim & Garcés 2023,
  // Seismol. Res. Lett. 94: 2514). A chemical charge puts essentially
  // its whole yield into the blast, so its surface burst is the fit at
  // twice the yield; a nuclear burst puts about half (Glasstone & Dolan
  // §1.25), which the reflection restores, so its surface burst is the
  // fit at the yield itself. The height-of-burst factor starts from
  // that surface burst either way.
  const blastYield = J((yieldJoules as number) * (chemical ? 2 : 1));
  const r5psi = distanceForOverpressure(blastYield, FIVE_PSI);
  const r1psi = distanceForOverpressure(blastYield, ONE_PSI);
  const rLight = distanceForOverpressure(blastYield, OVERPRESSURE_LIGHT_DAMAGE);

  // Phase-17 thermal calibration. Pass `heightOfBurst` so the burn-
  // radius helpers solve self-consistently with a Beer-Lambert
  // atmospheric attenuation τ(R) = exp(−R / L_eff(HOB)). Without this,
  // the inverse-square envelope was overshooting the published
  // Glasstone clear-day reference values by 90–160 % at megaton scale
  // (Castle Bravo 3°-burn 72 km computed vs 28 km reference; Tsar
  // Bomba 132 km vs 55 km). With it, every benchmark scenario from
  // Hiroshima to Tsar Bomba lands within ±30 % of the published curves.
  //
  // The partition of the yield that radiates falls from 0.35 for an air
  // burst to 0.18 for a burst on the ground (Glasstone & Dolan §7.101;
  // see thermalPartitionForHeight). A chemical charge has no flash.
  const thermalPartition = thermalPartitionForHeight(hobMeters, yieldKilotons);
  const flash = (radius: Meters): Meters => (chemical ? m(0) : radius);
  const burnInput = {
    yieldEnergy: yieldJoules,
    heightOfBurst: hobMeters,
    thermalPartition,
    ...(input.burnExposure === undefined ? {} : { burnExposure: input.burnExposure }),
    ...(input.burnSkin === undefined ? {} : { burnSkin: input.burnSkin }),
  };
  const burn3 = flash(thirdDegreeBurnRadius(burnInput));
  const burn2 = flash(secondDegreeBurnRadius(burnInput));
  const burn1 = flash(firstDegreeBurnRadius(burnInput));
  const fireInput = { yieldEnergy: yieldJoules, thermalPartition };

  const result: ExplosionScenarioResult = {
    inputs: input,
    placement: {
      medium,
      ...(inWater && {
        depth: m(burstDepthM),
        airBlastDepthFactor: depthFactor,
        airBlastWithinStatedRange:
          burstDepthM / 0.3048 / Math.cbrt(yieldKilotons) <= BURIED_AIR_BLAST_MAX_SCALED_DEPTH_FT,
      }),
    },
    yield: {
      joules: yieldJoules,
      kilotons: yieldKilotons,
      megatons: input.yieldMegatons,
    },
    blast: {
      overpressure5psiRadius: r5psi,
      overpressure1psiRadius: r1psi,
      lightDamageRadius: rLight,
      peakAt1km: peakOverpressure({ distance: m(1_000), yieldEnergy: blastYield }),
      peakAt5km: peakOverpressure({ distance: m(5_000), yieldEnergy: blastYield }),
      overpressure5psiRadiusHob: m((r5psi as number) * factor),
      overpressure1psiRadiusHob: m((r1psi as number) * factor),
      lightDamageRadiusHob: m((rLight as number) * factor),
      hobScaled: z,
      hobRegime: inWater ? 'UNDERWATER' : regime,
      hobFactor: factor,
    },
    thermal: {
      thirdDegreeBurnRadius: absorbed(burn3),
      secondDegreeBurnRadius: absorbed(burn2),
      firstDegreeBurnRadius: absorbed(burn1),
    },
    peakWind: {
      at1km: peakWindAtRange({ distance: m(1_000), yieldEnergy: blastYield }),
      at5km: peakWindAtRange({ distance: m(5_000), yieldEnergy: blastYield }),
      at10km: peakWindAtRange({ distance: m(10_000), yieldEnergy: blastYield }),
      at50km: peakWindAtRange({ distance: m(50_000), yieldEnergy: blastYield }),
    },
    firestorm: {
      ignitionRadius: absorbed(flash(flammableIgnitionRadius(fireInput))),
      sustainRadius: absorbed(flash(firestormSustainRadius(fireInput))),
      ignitionArea:
        exoatmospheric || inWater || chemical ? sqm(0) : flammableIgnitionArea(fireInput),
      sustainArea: exoatmospheric || inWater || chemical ? sqm(0) : firestormArea(fireInput),
    },
    crater: {
      // Glasstone & Dolan §6.10: a nuclear airburst at sufficient
      // height produces NO crater — the shock wave reaches the
      // ground attenuated and the high-pressure region never
      // touches the surface. For Hiroshima (HOB = 580 m, scaled
      // z = 235 m/kt^(1/3)) the regime is HIGH_AIRBURST and the
      // observed crater was zero. The Brode/Glasstone scaling
      // K · W^0.3 only applies in the SURFACE / contact-burst
      // regime; emit 0 for any airburst regime.
      apparentDiameter:
        regime === 'SURFACE' && !inWater
          ? nuclearApparentCraterDiameter({
              yieldEnergy: yieldJoules,
              groundCoefficient: NUCLEAR_CRATER_COEFFICIENT[groundType],
            })
          : m(0),
    },
    radiation:
      exoatmospheric || inWater || chemical
        ? { ld50Radius: m(0), ld100Radius: m(0), arsThresholdRadius: m(0) }
        : initialRadiationRadii(input.yieldMegatons, {
            heightOfBurstM: hobMeters,
            ...(input.radiationSource === undefined ? {} : { source: input.radiationSource }),
          }),
    emp: chemical
      ? { regime: 'NEGLIGIBLE', peakField: 0, affectedRadius: m(0) }
      : electromagneticPulse(input.yieldMegatons, hobMeters),
    isContactWaterBurst: false,
    asymmetry: {
      crater: ISOTROPIC_RING,
      thermal: windDriftAsymmetry({
        nominalRadius: absorbed(burn3),
        yieldKilotons,
        windSpeed: input.windSpeed ?? mps(0),
        windDirectionDeg: input.windDirectionDeg ?? 0,
      }),
      secondDegreeBurn: windDriftAsymmetry({
        nominalRadius: absorbed(burn2),
        yieldKilotons,
        windSpeed: input.windSpeed ?? mps(0),
        windDirectionDeg: input.windDirectionDeg ?? 0,
      }),
      overpressure5psi: ISOTROPIC_RING,
      overpressure1psi: ISOTROPIC_RING,
      lightDamage: ISOTROPIC_RING,
    },
  };

  // Underwater / contact-water burst tsunami branch. Fires only for a
  // TRUE contact-water burst — geometrically at or near the water
  // surface. Two gates apply:
  //
  //   (a) Scaled-HOB regime SURFACE (z = HOB / W^(1/3) < 50 m·kt⁻¹ᐟ³)
  //       — the existing Glasstone Mach-stem boundary.
  //
  //   (b) Absolute HOB ≤ CONTACT_WATER_BURST_MAX_HOB_M (30 m). Without
  //       this gate a 50 Mt warhead at 500 m HOB qualifies as
  //       "SURFACE" by scaled-HOB (z = 13.6 < 50) because the cube-
  //       root scaling makes the relative HOB tiny — but the burst
  //       point is still 500 m above the water, so the air shock
  //       arrives as a low-amplitude pressure pulse with essentially
  //       zero coupling to the water column. The 8 % coupling
  //       fraction in {@link explosionTsunami} is meant for SHALLOW
  //       UNDERWATER bursts (z < 0) — a figure of this project's, once
  //       misattributed to a Glasstone table that does not exist;
  //       applying it to a 500 m airburst over water inflates the source
  //       amplitude by orders of magnitude, then the bathymetric
  //       pipeline propagates that inflated source across the basin
  //       and produces metres of wave at trans-oceanic distances.
  //       Hiroshima 580 m HOB / Tsar Bomba historical 4 km HOB /
  //       any Mt-scale airburst over water all correctly drop out
  //       under this gate, matching observation (no recorded test
  //       has produced a measurable trans-oceanic wave from an
  //       airburst, including atmospheric-test-era Mt detonations).
  //
  // Underwater bursts (HOB < 0) were out of scope for that gate. They
  // are modelled now, through Glasstone & Dolan's relations below.
  const waterDepth = (input.waterDepth as number | undefined) ?? 0;
  // The gate used to be a threshold — surface regime, height of burst
  // between zero and thirty metres. Then it was a depth-of-burst curve
  // of the project's own. Now it is what Glasstone & Dolan say: their
  // wave relations are for a burst within the water, at any depth in
  // it (§6.119), so a charge in the air, resting on the surface or
  // buried in the seabed makes none, and one anywhere in the water
  // makes the wave its yield and the water's depth give it.
  const isContactBurst = waterDepth > 0;
  if (isContactBurst) {
    // How much of this reaches the water at all. The same law the
    // impacts use, asked the same question: the crater is the hole
    // being dug, and if the shoreline is inside it the water is part
    // of the excavation. A burst on a quay two hundred metres from a
    // crater fifty metres across lifts the sea by whatever it throws
    // that far, which for a charge with no ejecta model is nothing.
    const seaCoupling = computeSeaCoupling({
      shoreDistanceM: (input.shoreDistance as number | undefined) ?? 0,
      craterRimRadiusM: (result.crater.apparentDiameter as number) / 2,
      cavityAtFullCouplingM: 0,
    });
    result.seaCoupling = seaCoupling;
    const tsunami = explosionTsunami({
      yieldEnergy: J((yieldJoules as number) * seaCoupling.fraction),
      waterDepth: m(waterDepth),
      // A burst above the water is at negative depth; one on it, or
      // one buried below it, is at zero. None of them is within the
      // water, and none makes a wave.
      burstDepth: m(inWater ? burstDepthM : -Math.max(hobMeters, 0)),
      ...(input.meanOceanDepth !== undefined && { meanOceanDepth: input.meanOceanDepth }),
      ...(input.coastalBeachSlopeRad !== undefined && {
        coastalBeachSlopeRad: input.coastalBeachSlopeRad,
      }),
    });
    // The flag means "this burst put energy into the water", so it
    // follows whether a source actually came out — not whether there
    // happened to be a sea nearby.
    if (tsunami !== null) result.tsunami = tsunami;
    result.isContactWaterBurst = tsunami !== null;
  }

  return result;
}

/** Maximum absolute height-of-burst (m) that still counts as a
 *  contact-water burst for tsunami coupling. Above this the air
 *  shock dissipates over the water surface as a brief pressure
 *  pulse with negligible mechanical coupling to the water column.
 *  No nuclear test in the historical record has produced a
 *  measurable open-ocean tsunami from an airburst > 30 m HOB. */
export const CONTACT_WATER_BURST_MAX_HOB_M = 30;

/**
 * Canonical nuclear-explosion presets used for the UI gallery and CLI.
 * Yields taken from the standard historical references (Rhodes 1986
 * for Hiroshima/Nagasaki; Khariton 2005 for Tsar Bomba; USDoE Plowshare
 * archive for Castle Bravo).
 */
export const EXPLOSION_PRESETS = {
  /** Little Boy, Hiroshima, 6 August 1945 — uranium-gun, ≈15 kt. */
  HIROSHIMA_1945: {
    name: 'Hiroshima 1945',
    note: '"Little Boy", uranium-gun device; airburst at 580 m',
    input: {
      yieldMegatons: 0.015,
      groundType: 'FIRM_GROUND',
      heightOfBurst: m(580),
    } satisfies ExplosionScenarioInput,
  },
  /** Fat Man, Nagasaki, 9 August 1945 — implosion, ≈21 kt. */
  NAGASAKI_1945: {
    name: 'Nagasaki 1945',
    note: '"Fat Man", plutonium-implosion device; airburst at 503 m',
    input: {
      yieldMegatons: 0.021,
      groundType: 'FIRM_GROUND',
      heightOfBurst: m(503),
    } satisfies ExplosionScenarioInput,
  },
  /** Castle Bravo, Bikini Atoll, 1 March 1954 — ≈15 Mt thermonuclear
   *  surface burst on a coral reef. */
  CASTLE_BRAVO_1954: {
    name: 'Castle Bravo 1954',
    note: 'Bikini Atoll thermonuclear surface burst, wet coral target',
    input: {
      yieldMegatons: 15,
      groundType: 'WET_SOIL',
      heightOfBurst: m(0),
    } satisfies ExplosionScenarioInput,
  },
  /** Tsar Bomba, Severny Island, 30 October 1961 — ≈50 Mt, airburst. */
  TSAR_BOMBA_1961: {
    name: 'Tsar Bomba 1961',
    note: 'Largest human-made explosion to date; airburst at 4 000 m',
    input: {
      yieldMegatons: 50,
      groundType: 'HARD_ROCK',
      heightOfBurst: m(4_000),
    } satisfies ExplosionScenarioInput,
  },
  /** Starfish Prime, Johnston Atoll, 9 July 1962 — 1.4 Mt exoatmospheric
   *  HEMP test at 400 km altitude. Ground-level blast is negligible
   *  (strato regime) but the E1 pulse disabled street lighting on Oahu,
   *  ≈1 450 km from the burst point. Canonical HEMP validation event. */
  STARFISH_PRIME_1962: {
    name: 'Starfish Prime 1962',
    note: 'Exoatmospheric HEMP test: 1.4 Mt @ 400 km altitude — Oahu street-lamp outages at 1 450 km',
    input: {
      yieldMegatons: 1.4,
      groundType: 'FIRM_GROUND',
      heightOfBurst: m(400_000),
    } satisfies ExplosionScenarioInput,
  },
  /** One-megaton reference device, for clean "what does 1 Mt look
   *  like" comparisons in the gallery. */
  ONE_MEGATON: {
    name: '1 Mt reference',
    note: 'Generic 1 Mt device — "what does a megaton look like?"',
    input: {
      yieldMegatons: 1,
      groundType: 'FIRM_GROUND',
      heightOfBurst: m(0),
    } satisfies ExplosionScenarioInput,
  },
  /** Beirut port explosion, 4 August 2020 — ≈ 2 750 t of ammonium
   *  nitrate detonating in Hangar 12, equivalent to ≈ 0.5 kt TNT
   *  (Rigby et al. 2020, Shock Waves 30: 671–675; Diaz 2021, Earth-
   *  Science Reviews 220, 103745). Contact surface burst on a wet-
   *  reclaimed quay; canonical reference for non-nuclear conventional
   *  detonation in an urban-coastal setting. */
  BEIRUT_2020: {
    name: 'Beirut port 2020',
    note: '≈ 2 750 t NH₄NO₃, ≈ 0.5 kt TNT-equivalent surface burst on a portside quay',
    input: {
      yieldMegatons: 0.0005,
      groundType: 'WET_SOIL',
      heightOfBurst: m(0),
      chargeType: 'chemical',
    } satisfies ExplosionScenarioInput,
  },
  /** Ivy Mike, Enewetak Atoll, 1 November 1952 — first full-scale
   *  thermonuclear test, 10.4 Mt yield from a cryogenic-deuterium
   *  Teller-Ulam device. Detonated atop the islet of Elugelab, which
   *  was vapourised; the surge crater is 1.9 km wide and 50 m deep.
   *  Documented in the LASL "Mike" series (LA-1854) and reviewed in
   *  Hansen (1995) "U.S. Nuclear Weapons: The Secret History" §3.
   *  Headline fact: this is the device that proved hydrogen-fusion
   *  weapons were a buildable class, not just a paper concept. */
  IVY_MIKE_1952: {
    name: 'Ivy Mike 1952',
    note: 'First full-scale thermonuclear device, 10.4 Mt — Enewetak Atoll, 1 Nov 1952. Vapourised the islet of Elugelab; 1.9 km × 50 m surge crater (Hansen 1995, LASL LA-1854).',
    input: {
      yieldMegatons: 10.4,
      groundType: 'WET_SOIL',
      heightOfBurst: m(0),
    } satisfies ExplosionScenarioInput,
  },
  /** Halifax explosion, 6 December 1917 — collision of the SS Mont-
   *  Blanc (laden with picric acid, TNT, gun cotton and benzol) with
   *  the SS Imo in Halifax Harbour. The resulting fire detonated
   *  the cargo, releasing ≈ 2.9 kt TNT-equivalent in the largest
   *  accidental explosion before the nuclear era. ≈ 2 000 fatalities,
   *  9 000 injured, 1 600 buildings destroyed. The shock wave was
   *  recorded on a Halifax-Truro railway seismograph. Reference:
   *  Bird & MacDonald (2001) "The Halifax Explosion." */
  HALIFAX_1917: {
    name: 'Halifax 1917',
    note: '≈ 2.9 kt TNT-equivalent — SS Mont-Blanc cargo detonation, 6 Dec 1917, Halifax NS. Largest pre-nuclear accidental explosion; ≈ 2 000 fatalities (Bird & MacDonald 2001).',
    input: {
      yieldMegatons: 0.0029,
      groundType: 'WET_SOIL',
      heightOfBurst: m(0),
      chargeType: 'chemical',
    } satisfies ExplosionScenarioInput,
  },
  /** Texas City disaster, 16 April 1947 — French freighter SS Grand-
   *  camp's ammonium-nitrate cargo (≈ 2 100 t) ignited and detonated
   *  in port. Triggered a chain of secondary fires and a follow-on
   *  explosion on the SS High Flyer the next day. ≈ 581 fatalities,
   *  ≈ 5 000 injured. Equivalent yield ≈ 2.7 kt TNT (Bjork & Stuart
   *  1948 reanalysis cited in Marsh 2010 "Texas City: The Forgotten
   *  Disaster"). One of the worst industrial accidents in US history. */
  TEXAS_CITY_1947: {
    name: 'Texas City 1947',
    note: '≈ 2.7 kt TNT-equivalent — SS Grandcamp ammonium-nitrate detonation, 16 Apr 1947, Texas City TX. ≈ 581 fatalities (Marsh 2010).',
    input: {
      yieldMegatons: 0.0027,
      groundType: 'WET_SOIL',
      heightOfBurst: m(0),
      chargeType: 'chemical',
    } satisfies ExplosionScenarioInput,
  },
} as const;

export type ExplosionPresetId = keyof typeof EXPLOSION_PRESETS;
