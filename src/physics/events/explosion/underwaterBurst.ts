import { STANDARD_GRAVITY, TNT_SPECIFIC_ENERGY } from '../../constants.js';
import { synolakisRunup } from '../tsunami/extendedEffects.js';
import { propagationSpeed, wavelengthForPeriod } from '../../tsunami/linearWaves.js';
import type { Joules, Meters, MetersPerSecond, Seconds } from '../../units.js';
import { m } from '../../units.js';

/**
 * The waves of a nuclear burst in water, as Glasstone & Dolan (1977)
 * give them.
 *
 * Until 14 September 2026 this module built the wave the way an impact
 * builds one — a Ward & Asphaug cavity dug by 8 % of the yield, scaled
 * by a log-normal curve in the depth of burst — and every one of those
 * numbers was the project's own, credited to a Glasstone table that
 * does not exist. Against the book's own relation the source was five
 * to nine times under in deep water at its chosen optimum depth and
 * next to nothing at any other. It is now the book's relations, and
 * nothing else where the book has something to say:
 *
 *   - §6.119 — in deep water the train's peak-to-peak height at range R
 *     is H ≈ 40 500·W^0.54 / R (feet, kilotons), "to an accuracy of
 *     about 35 percent", for water from 256·W^0.25 ft (the gas bubble's
 *     maximum diameter, §2.86) to 850·W^0.25 ft deep, and "for any depth
 *     of burst within the water". The peak wave has a period
 *     T ≈ 14.1·W^0.144 s and a length L ≈ 1 010·W^0.288 ft — which is
 *     the deep-water length of a wave of that period, so the two agree.
 *   - §6.121 — a burst in shallow water, d_w < 100·W^0.25 ft, "such as
 *     Bikini BAKER, delivers less energy to the water":
 *     H ≈ 150·d_w·W^0.25 / R.
 *   - §6.120 — the period stays the same as the train runs into shoal
 *     water, and the height changes only once the water is shallower
 *     than about a third of the wavelength.
 *   - §6.54 — the first wave near the burst is too steep to be sustained
 *     and breaks.
 *
 * Where the book is silent the model says what it does, rather than
 * inventing a number:
 *
 *   - **Between the two relations** (100–256·W^0.25 ft of water) the
 *     product H·R is interpolated geometrically from the shallow
 *     relation at its limit to the deep one at its own.
 *   - **Near the burst** the relation is not used inside the radius
 *     where its height would exceed the steepest wave the water can
 *     hold, H_max = 0.142·L·tanh(2πh/L) (Miche 1944), or inside the gas
 *     bubble's maximum radius, whichever is larger; the amplitude is
 *     held there.
 *   - **A burst on or above the water, or buried in the seabed,** is not
 *     a burst within the water, and makes no wave here. The book gives
 *     no relation for it; the surface shots of the 1950s — Bravo on its
 *     reef, Mike on its islet — are remembered for their craters rather
 *     than for waves, but neither was fired on open water.
 *
 * A height is from crest to trough and the model propagates amplitudes,
 * so every amplitude below is half the height. The relation is 1/R and
 * already contains the train's dispersion; the veil is told so, and
 * spreads and shoals it on the group velocity of the peak period
 * (`tsunami/linearWaves.ts`) instead of the long-wave speed.
 *
 * References:
 *   Glasstone, S. & Dolan, P. J. (1977). "The Effects of Nuclear
 *     Weapons" (3rd ed.), §2.63–§2.70, §6.54–§6.59 and §6.119–§6.121,
 *     Table 6.57. U.S. DoD / DoE.
 *   Miche, R. (1944). "Mouvements ondulatoires de la mer en profondeur
 *     constante ou décroissante." Annales des Ponts et Chaussées 114,
 *     25–78.
 *   Synolakis, C. E. (1987). "The runup of solitary waves." J. Fluid
 *     Mech. 185, 523–545.
 */

const FOOT_M = 0.3048;

/** §6.119: H·R in deep water, in ft², is this times W^0.54. */
export const GLASSTONE_DEEP_HEIGHT_RANGE = 40_500;
export const GLASSTONE_DEEP_YIELD_EXPONENT = 0.54;
/** §6.121: H·R in shallow water, in ft², is this times d_w·W^0.25. */
export const GLASSTONE_SHALLOW_HEIGHT_RANGE = 150;
/** §6.119: the deep relation holds from this water depth, in feet per
 *  W^0.25 — the maximum diameter of the gas bubble (§2.86) … */
export const DEEP_WATER_FROM_SCALED_DEPTH = 256;
/** … to this one. */
export const DEEP_WATER_TO_SCALED_DEPTH = 850;
/** §6.121: a shallow burst is one in water shallower than this. */
export const SHALLOW_WATER_BELOW_SCALED_DEPTH = 100;
/** §6.119: "an accuracy of about 35 percent" for the deep relation. */
export const GLASSTONE_DEEP_HEIGHT_ACCURACY = 0.35;
/** §6.119: the peak wave's period is this many seconds times W^0.144. */
export const GLASSTONE_PEAK_PERIOD_S = 14.1;
export const GLASSTONE_PEAK_PERIOD_YIELD_EXPONENT = 0.144;
/** Miche (1944): the steepest a wave in water of depth h can stand is
 *  H = 0.142·L·tanh(2πh/L) — 1/7 of its length in deep water, and
 *  about 0.89 of the depth in shallow water. */
export const MICHE_LIMITING_STEEPNESS = 0.142;

/** Which of Glasstone & Dolan's relations a burst's water puts it in. */
export type ExplosionWaveRegime = 'deep' | 'shallow' | 'between';

export interface ExplosionWave {
  regime: ExplosionWaveRegime;
  /** H·R (m²): the train's height from crest to trough at range R is
   *  this divided by R. */
  heightTimesRangeM2: number;
  /** Whether the water depth lies where the relation used was stated
   *  to hold. False between the two relations and in water deeper than
   *  850·W^0.25 ft, where it is extrapolated. */
  withinStatedRange: boolean;
  /** Period of the peak wave (s), §6.119. */
  peakPeriodS: number;
  /** Maximum radius of the gas bubble (m): half the 256·W^0.25 ft
   *  §6.119 gives as its diameter. */
  bubbleRadiusM: number;
}

/**
 * Glasstone & Dolan's wave for a burst of this yield in water of this
 * depth. Null when either is not a positive number.
 */
export function explosionWave(yieldKilotons: number, waterDepthM: number): ExplosionWave | null {
  if (!(yieldKilotons > 0) || !Number.isFinite(yieldKilotons)) return null;
  if (!(waterDepthM > 0) || !Number.isFinite(waterDepthM)) return null;
  const w025 = yieldKilotons ** 0.25;
  const depthFt = waterDepthM / FOOT_M;
  const scaledDepth = depthFt / w025;
  const deep = GLASSTONE_DEEP_HEIGHT_RANGE * yieldKilotons ** GLASSTONE_DEEP_YIELD_EXPONENT;
  const shallow = (dFt: number): number => GLASSTONE_SHALLOW_HEIGHT_RANGE * dFt * w025;

  let regime: ExplosionWaveRegime;
  let heightRangeFt2: number;
  let withinStatedRange: boolean;
  if (scaledDepth >= DEEP_WATER_FROM_SCALED_DEPTH) {
    regime = 'deep';
    heightRangeFt2 = deep;
    withinStatedRange = scaledDepth <= DEEP_WATER_TO_SCALED_DEPTH;
  } else if (scaledDepth <= SHALLOW_WATER_BELOW_SCALED_DEPTH) {
    regime = 'shallow';
    heightRangeFt2 = shallow(depthFt);
    withinStatedRange = true;
  } else {
    // The book's two relations stop at 100 and start at 256; between
    // them the product is carried geometrically from one to the other,
    // so neither end jumps.
    regime = 'between';
    const from = Math.log(shallow(SHALLOW_WATER_BELOW_SCALED_DEPTH * w025));
    const to = Math.log(deep);
    const along =
      Math.log(scaledDepth / SHALLOW_WATER_BELOW_SCALED_DEPTH) /
      Math.log(DEEP_WATER_FROM_SCALED_DEPTH / SHALLOW_WATER_BELOW_SCALED_DEPTH);
    heightRangeFt2 = Math.exp(from + (to - from) * along);
    withinStatedRange = false;
  }

  return {
    regime,
    heightTimesRangeM2: heightRangeFt2 * FOOT_M * FOOT_M,
    withinStatedRange,
    peakPeriodS: GLASSTONE_PEAK_PERIOD_S * yieldKilotons ** GLASSTONE_PEAK_PERIOD_YIELD_EXPONENT,
    bubbleRadiusM: (DEEP_WATER_FROM_SCALED_DEPTH * w025 * FOOT_M) / 2,
  };
}

export interface ExplosionTsunamiInput {
  /** Total explosion yield (J). */
  yieldEnergy: Joules;
  /** Depth of the burst point below the water surface (m), positive
   *  downward. Zero for a burst sitting on the surface and negative
   *  for one in the air; neither is a burst within the water, and
   *  neither makes a wave here. Omitted means somewhere within it. */
  burstDepth?: Meters;
  /** Water depth at the burst site (m). Must be > 0 for a wave to
   *  form; the caller decides the threshold. */
  waterDepth: Meters;
  /** Mean basin depth the wave crosses (m), for its speed and arrival
   *  times. Defaults to the global ocean mean of 4 km. */
  meanOceanDepth?: Meters;
  /** Beach slope (rad) for the Synolakis run-up. Defaults to
   *  `atan(1/100)` when omitted; the caller (typically the store)
   *  should pass a DEM-driven value when the click point is on a
   *  real coastal slope. */
  coastalBeachSlopeRad?: number;
}

export interface ExplosionTsunamiResult {
  /** Which of Glasstone & Dolan's relations the water puts the burst in. */
  regime: ExplosionWaveRegime;
  /** Whether the water depth is inside the range the book states for
   *  that relation. */
  withinStatedRange: boolean;
  /** H·R (m²): the height from crest to trough at range R is this over R. */
  heightTimesRange: number;
  /** Water depth at the burst (m): where the wave is made, and the
   *  depth the globe shoals it from. */
  waterDepth: Meters;
  /** Radius inside which the relation is not used (m): where its height
   *  would exceed the steepest wave the water can hold (Miche 1944), or
   *  the gas bubble's maximum radius, whichever is larger. The globe
   *  holds the amplitude flat inside it and draws it as the source. */
  cavityRadius: Meters;
  /** Amplitude at that radius (m): half the height the relation gives
   *  there. */
  sourceAmplitude: Meters;
  /** Amplitude at 100 km (m), half the relation's height there, in
   *  water like the burst's. */
  amplitudeAt100km: Meters;
  /** Amplitude at 1 000 km (m) — far beyond any range the relation was
   *  measured at, and printed as the relation's extrapolation. */
  amplitudeAt1000km: Meters;
  /** Travel time to the 100 km contour (s), at the group velocity of
   *  the peak wave over the basin. */
  travelTimeTo100km: Seconds;
  /** Travel time to the 1 000 km contour (s), likewise. */
  travelTimeTo1000km: Seconds;
  /** Echo of the basin depth used for speed and travel time. */
  meanOceanDepth: Meters;
  /** Speed at which the peak wave's energy crosses the basin (m/s):
   *  its group velocity at the basin depth. For a megatonne over 4 km
   *  of ocean that is about 30 m/s, where a long wave would make 198. */
  deepWaterCelerity: MetersPerSecond;
  /** Length of the peak wave (m) in the water it was made in. */
  sourceWavelength: Meters;
  /** Period of the peak wave (s), Glasstone & Dolan §6.119. */
  dominantPeriod: Seconds;
  /** Synolakis (1987) run-up on a 1:100 plane beach with 10 m
   *  offshore depth, using the 100 km amplitude as the incident
   *  wave. Illustrative coastal-inundation estimate. */
  runupAt100km: Meters;
  /** Estimated inland inundation distance at the 100 km contour
   *  (m). Geometric `runup × cot(slope)` envelope on a 1:100
   *  reference beach (FEMA 55 §3.4). */
  inundationDistanceAt100km: Meters;
  /** Beach slope (rad) actually consumed by the Synolakis run-up. */
  beachSlopeRadUsed: number;
  /** True when {@link beachSlopeRadUsed} came from a DEM sample at
   *  the click site (rather than the 1:100 reference fallback). */
  beachSlopeFromDEM: boolean;
}

/**
 * The wave of a burst within the water. Null when there is none: no
 * yield, no water, or a burst that is not in the water — on it, above
 * it, or below its floor.
 */
export function explosionTsunami(input: ExplosionTsunamiInput): ExplosionTsunamiResult | null {
  const yieldJ = input.yieldEnergy as number;
  const depth = input.waterDepth as number;
  if (!Number.isFinite(yieldJ) || yieldJ <= 0) return null;
  if (!Number.isFinite(depth) || depth <= 0) return null;
  const burstDepth = input.burstDepth === undefined ? depth / 2 : (input.burstDepth as number);
  if (!Number.isFinite(burstDepth) || burstDepth <= 0 || burstDepth > depth) return null;

  const kilotons = yieldJ / (TNT_SPECIFIC_ENERGY * 1e6);
  const wave = explosionWave(kilotons, depth);
  if (wave === null) return null;
  const meanOceanDepth = input.meanOceanDepth ?? m(4_000);
  const heightTimesRange = wave.heightTimesRangeM2;
  const period = wave.peakPeriodS;

  // Near the burst the train is not yet a train. Inside the radius at
  // which the relation's height would be steeper than the water can
  // hold, or inside the bubble itself, the amplitude is held.
  const wavelength = wavelengthForPeriod(period, depth, STANDARD_GRAVITY);
  const steepest =
    MICHE_LIMITING_STEEPNESS * wavelength * Math.tanh((2 * Math.PI * depth) / wavelength);
  const cavityRadius = Math.max(wave.bubbleRadiusM, heightTimesRange / steepest);
  const amplitudeAt = (rangeM: number): number =>
    heightTimesRange / (2 * Math.max(rangeM, cavityRadius));
  const amp100 = m(amplitudeAt(100_000));
  const amp1000 = m(amplitudeAt(1_000_000));

  const celerity = propagationSpeed(meanOceanDepth, period, STANDARD_GRAVITY);
  // Use the 100 km contour as the runup anchor for explosions — the
  // wave falls as 1/R, so the 100 km headline is more useful than a
  // 1 000 km figure that is often a few centimetres. Beach slope:
  // caller-supplied DEM value when in the [1:1000, 1:3] envelope, else
  // 1:100 reference.
  const FALLBACK_SLOPE_RAD = Math.atan(1 / 100);
  const SLOPE_LOWER = Math.atan(1 / 1000);
  const SLOPE_UPPER = Math.atan(1 / 3);
  const supplied = input.coastalBeachSlopeRad;
  const slopeFromDEM =
    supplied !== undefined &&
    Number.isFinite(supplied) &&
    supplied >= SLOPE_LOWER &&
    supplied <= SLOPE_UPPER;
  const beachSlopeRad = slopeFromDEM ? supplied : FALLBACK_SLOPE_RAD;
  const runup100 = synolakisRunup(amp100, beachSlopeRad, m(10));
  const inundation100 = m((runup100 as number) / Math.tan(beachSlopeRad));

  return {
    regime: wave.regime,
    withinStatedRange: wave.withinStatedRange,
    heightTimesRange,
    waterDepth: m(depth),
    cavityRadius: m(cavityRadius),
    sourceAmplitude: m(amplitudeAt(cavityRadius)),
    amplitudeAt100km: amp100,
    amplitudeAt1000km: amp1000,
    travelTimeTo100km: (100_000 / celerity) as Seconds,
    travelTimeTo1000km: (1_000_000 / celerity) as Seconds,
    meanOceanDepth,
    deepWaterCelerity: celerity as MetersPerSecond,
    sourceWavelength: m(wavelength),
    dominantPeriod: period as Seconds,
    runupAt100km: runup100,
    inundationDistanceAt100km: inundation100,
    beachSlopeRadUsed: beachSlopeRad,
    beachSlopeFromDEM: slopeFromDEM,
  };
}
