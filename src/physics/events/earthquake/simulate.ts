import { STANDARD_GRAVITY } from '../../constants.js';
import { nehrpClassFromVs30, type NEHRPClass } from '../../elevation/index.js';
import type { Meters, MetersPerSecondSquared, NewtonMeters } from '../../units.js';
import { m, mps, mps2 } from '../../units.js';
import { topOfRuptureKm } from '../../validation/topOfRuptureRules.js';
import { generateAftershockSequence, type AftershockSequenceResult } from './aftershocks.js';
import {
  campbellBozorgnia2014PgaAtEpicentralDistance,
  epicentralDistanceForCampbellBozorgnia2014,
} from './campbellBozorgnia2014.js';
import {
  distanceForPga,
  distanceForPgaNGAWest2,
  distanceForPgvNGAWest2,
  vs30SiteFactor,
  peakGroundAcceleration,
  peakGroundAccelerationNGAWest2,
  peakGroundVelocityNGAWest2,
  type NGAFaultType,
} from './attenuation.js';
import {
  MMI_PER_LN_PGA,
  mercalliIntensityFromPgv,
  mmiFromPgaEuropean,
  modifiedMercalliIntensity,
  pgaFromMercalliIntensity,
  pgvFromMercalliIntensity,
} from './intensity.js';
import {
  allen2012HypocentralMmi,
  epicentralDistanceForIntensityAllen2012,
} from './intensityPrediction.js';
import {
  distanceForInterfacePga,
  epicentralDistanceForInterfacePga,
  interfacePga,
  type InterfaceMotionModel,
} from './interfaceAttenuation.js';
import { liquefactionRadius } from './liquefaction.js';
import { pointSourceDistances } from './pointSourceDistance.js';
import { epicentralDistanceForSlabPga, slabPga, type SlabMotionModel } from './slabAttenuation.js';
import type { GroundMotionResidual } from '../../uq/groundMotionResidual.js';
import {
  megathrustRuptureLength,
  megathrustRuptureWidth,
  surfaceRuptureLength,
  surfaceRuptureWidth,
  type FaultType,
} from './ruptureLength.js';
import { seismicMomentFromMagnitude } from './seismicMoment.js';
import { seismicTsunamiFromMegathrust, type SeismicTsunamiResult } from './seismicTsunami.js';

/**
 * Free inputs for an earthquake scenario. `depth` does not reach the
 * shaking: Boore et al. 2014, which draws the rings, is a relation in
 * the Joyner–Boore distance with a fixed 4.5 km near-source term and no
 * depth of its own, so a source 35 km down shakes the ground above it as
 * a shallow one does. It seeds the aftershock catalogue and is echoed in
 * the report. Held out by rule, the rings paint MMI VII about all 190 of
 * the 370 earthquakes whose ShakeMaps hold none, the validation page's
 * `inventedShaking` gap; a relation in rupture distance, with the depth
 * to the top of the rupture, is the kind that would honour it.
 */
export interface EarthquakeScenarioInput {
  magnitude: number;
  depth?: Meters;
  faultType?: FaultType;
  /** Vs30 (m/s) — upper-30 m shear-wave velocity at the reference
   *  site. Defaults to 760 (rock). Soft soils amplify PGA ~1.5×. */
  vs30?: number;
  /** When true, use the Strasser 2010 interface rupture-length
   *  scaling instead of Wells & Coppersmith. */
  subductionInterface?: boolean;
  /**
   * Rule 370 of validation/interfaceLawRules.ts: which scaling law gives the
   * rupture its size, said out loud.
   *
   * `subductionInterface` used to decide this AND which ground-motion law
   * runs, and the two are independent — one says how the ground shakes at a
   * distance, the other how long the break is. They were one input because
   * they were written as one, and rule 35 carried the coupling into the
   * measurement: when rule 38 refused Parker et al. 2022 on the dead, what it
   * refused was Parker WITH Strasser. On rule 11's extended interface rows
   * Parker with Wells & Coppersmith reads 2.26x its record where Parker with
   * Strasser reads 4.12x and the shipped law reads 6.48x.
   *
   * Omitted, this changes nothing: the scaling is Strasser's for a scenario
   * that ticks `subductionInterface` and Wells & Coppersmith's otherwise,
   * exactly as before.
   */
  ruptureScaling?: 'wellsCoppersmith' | 'strasser';
  /**
   * Rule 377 of validation/ruptureCentreRules.ts: how far along strike the
   * centre of the rupture sits from the hypocentre, in metres.
   *
   * The epicentre is where the rupture STARTED, not its middle — Tohoku's is
   * roughly at one end of its slip — so laying the stadium down centred on
   * it is an assumption, and a wrong one for every earthquake. It is also
   * the term the predictive band was missing: a realisation drew its
   * magnitude, its depth, its ground and its residual, and the footprint
   * never moved, so a footprint that reached nobody reached nobody in all
   * two hundred worlds and the band came out [0, 0] — "nobody dies,
   * certainly" rather than "I do not know".
   *
   * Omitted or zero, nothing changes: the central estimate keeps the centre
   * on the epicentre, and so does every picture the globe draws. Only a
   * realisation of the band draws it (rule 378, uniform on [-L/2, +L/2]).
   */
  ruptureCentreOffsetM?: Meters;
  /** Water depth at the epicentre (m). 0 or omitted → continental /
   *  intra-plate scenario. Any positive value flags the event as
   *  submarine: the felt-intensity contours are still emitted (a
   *  shoreline at 100 km still shakes), but the result carries an
   *  `isSubmarine` flag the renderer uses to fade them out and the
   *  tsunami auto-trigger fires for any shallow thrust/normal event
   *  with Mw ≥ 6.5 — without forcing the user to manually toggle
   *  `subductionInterface`. */
  waterDepth?: Meters;
  /** Mean depth of the ocean the wave crosses (m) — rule 188 of
   *  validation/basinDepthRules.ts.
   *
   *  Not {@link waterDepth}. That one is the water over the source and
   *  answers whether the seafloor lifts any water at all; this one
   *  carries the celerity, the travel time, the dominant period and
   *  the dispersion of the far-field rows, which are properties of the
   *  path and not of the epicentre. Until 18 September 2026 the source
   *  depth was passed for both, so a Mw 9.0 on a shelf crossed 1 000 km
   *  at 13 m/s (B-052). Omitted → the module's 4 000 m, which is what
   *  the globe's own solver already used for every earthquake. */
  basinDepth?: Meters;
  /** Beach slope (rad) for the Synolakis (1987) coastal run-up in
   *  the seismic-source tsunami block. Defaults to `atan(0.01)`
   *  (1:100 plane beach) when omitted. The store auto-derives a
   *  DEM-driven value when the click point is on land with a
   *  meaningful slope. */
  coastalBeachSlopeRad?: number;
  /** Strike azimuth (degrees clockwise from geographic North). Drives
   *  the orientation of the extended-source rupture rectangle used by
   *  the stadium MMI contours for Mw ≥ 7.5 / megathrust events. When
   *  omitted, defaults to 0 (rupture aligned N–S) — fine for the small
   *  point-source events where the stadium degenerates to a circle. */
  strikeAzimuthDeg?: number;
  /** How long after the source a tsunami warning reaches the coast
   *  (s), or `Infinity` for a basin with no system at all. Left
   *  unset, the scenario is a modern one and the warning centres
   *  bulletin within minutes — which is true today of every ocean,
   *  and was not true of the Indian Ocean before 2006 or of the
   *  Pacific before 1965. A preset that predates its own basin's
   *  system says so here, and the coastal toll then stops assuming a
   *  warning nobody could have given. */
  warningIssueS?: number;
  /** Optional override for the surface rupture length L (m). Use when
   *  the empirical Wells-Coppersmith / Strasser-Arango-Bommer fits
   *  underpredict for an outlier event with documented finite-fault
   *  inversions.
   *
   *  Calibration anchor: Sumatra-Andaman 2004 had ~1300 km observed
   *  surface rupture (Lay et al. 2005, Science 308:1127) but the
   *  Strasser median fit at Mw 9.2 gives only 803 km — the empirical
   *  scaling laws saturate above Mw 9.0 because their datasets are
   *  weighted by typical-magnitude events; fault-geometry-constrained
   *  outliers like Sumatra (Sunda Trench is 6000 km long, plenty of
   *  room) cannot be captured by a single regression. The Sumatra
   *  preset sets this to 1.3 × 10⁶ m to honour the observation; for
   *  custom user inputs without an override, the Strasser median
   *  remains the best available estimate (factor ~2 scatter at
   *  Mw > 9 per Strasser 2010 §4 "Residuals"). */
  ruptureLengthOverride?: Meters;
  /** Optional override for the down-dip rupture width W (m). Symmetric
   *  to {@link ruptureLengthOverride} for events where the observed W
   *  diverges from the Strasser/Wells-Coppersmith median. */
  ruptureWidthOverride?: Meters;
  /** Ground-motion aleatory residual in natural-log units (default 0).
   *  Applied as a multiplicative factor exp(residual) to EVERY PGA
   *  value, and propagated consistently to the epicentral MMI and to
   *  the MMI-contour / liquefaction radii (which move outward for a
   *  positive residual). This is the hook the Monte-Carlo wrapper uses
   *  to sample the GMPE's intrinsic σ_lnY ≈ 0.60 scatter
   *  ({@link EARTHQUAKE_INPUT_SIGMA.groundMotion}); the deterministic
   *  pipeline leaves it at 0, so the median scenario is unchanged. */
  groundMotionResidualLn?: number;
  /** Where a realisation draws the within-event part of the residual apart
   *  for one place and for the footprint (rule 71 of
   *  validation/residualRules.ts), the residual of the accelerations the
   *  scenario prints at one distance and at the epicentre; the rings and the
   *  liquefaction radius keep `groundMotionResidualLn`. Omitted, every
   *  quantity takes `groundMotionResidualLn`. */
  groundMotionSiteResidualLn?: number;
  /** How the Monte Carlo realisations of this scenario draw their
   *  ground-motion residual (rule 71 of validation/residualRules.ts,
   *  uq/groundMotionResidual.ts); the scenario itself draws nothing.
   *  Omitted, `DEFAULT_GROUND_MOTION_RESIDUAL`. */
  groundMotionResidual?: GroundMotionResidual;
  /** Which law draws the intensity rings. Not a setting a scenario
   *  offers: the candidates of rule 17 in validation/contourLaws.ts and
   *  of rule 24 in validation/depthRules.ts, compared on USGS ShakeMaps
   *  before any of them replaces the shipped one. Omitted, the rings are
   *  the shipped law's. */
  contourLaw?: ContourLaw;
  /** Which ground motion the rings take intensity from (rule 31 of
   *  validation/pagerChain.ts): Worden et al. 2012 on Boore et al.
   *  2014's median PGA (`pga`, shipped) or on its median PGV (`pgv`,
   *  PAGER's chain). Read by the Boore et al. 2014 laws; Joyner & Boore
   *  1981 has no PGV and Allen et al. 2012 no ground motion at all.
   *  Omitted, `pga`. */
  intensityMeasure?: IntensityMeasure;
  /** Where the rings stand (rule 31 of validation/pagerChain.ts): at
   *  intensity 7.0, 8.0 and 9.0 (`rings`, shipped), or at the lower
   *  edge of PAGER's bands — intensity k from k − ½ to k + ½ — for V to
   *  IX (`pager`), where the result also carries the V and VI rings.
   *  Omitted, `rings`. */
  intensityBanding?: IntensityBanding;
  /** Whether a scenario marked a subduction interface is a rupture
   *  stadium at every magnitude (`always`) or, as every other scenario,
   *  from Mw 7.5 only, a disc about the epicentre below (`fromMw7.5`):
   *  rule 41 of validation/interfaceStadiumRules.ts. Nothing else moves,
   *  the interface rupture included. Omitted, `fromMw7.5`, which rules 42
   *  and 43 adopted on 15 September 2026; `always` was the geometry until
   *  then. */
  interfaceStadium?: InterfaceStadium;
  /** Whether an UNMARKED scenario — not a subduction interface, not deeper
   *  than 70 km — is a rupture stadium at every magnitude (`always`) or
   *  from Mw 7.5 only, a disc about the epicentre below (`fromMw7.5`):
   *  rule 412 of validation/extendedSourceRules.ts. Only the SHAPE moves;
   *  every ring keeps its radius. A marked scenario is governed by
   *  {@link interfaceStadium} and a deep one by rules 66 to 70, and
   *  neither reads this. Omitted, `fromMw7.5`. */
  extendedSource?: ExtendedSource;
  /** Whether the footprint laid on the ground is built from the rupture's
   *  true DOWN-DIP width (`downDip`) or from its surface projection,
   *  W·cos δ (`surfaceProjection`): rule 419 of
   *  validation/surfaceProjectionRules.ts. A vertical fault outcrops as a
   *  line and projects no width at all. {@link ruptureWidth} is unchanged
   *  either way — it is a real down-dip width and the tsunami source reads
   *  it; what moves is {@link EarthquakeScenarioResult.ruptureFootprintWidth}.
   *  A scenario marked a subduction interface and one deeper than 70 km do
   *  not read this (rule 421). Omitted, `downDip`. */
  stadiumWidth?: StadiumWidth;
  /** Rule 440 of validation/topBandRules.ts: whether the casualty plan's
   *  topmost band is charged a fixed midpoint or the middle of what it
   *  actually spans. Carried here so a scenario can say it and the store
   *  can read it; the simulator itself draws no casualties. Omitted,
   *  `midpoint`. */
  topBand?: 'midpoint' | 'toPeak';
  /** The dip of the structure this scenario is drawn along, degrees from
   *  horizontal: rule 427 of validation/dipRules.ts. It reaches the
   *  simulator the way the strike does, as an input, because the tiles are
   *  a lookup the CALLER makes — `shippedDipAnswer` is the one answer
   *  behind it. Omitted, the style constant below: 90 strike-slip, 55
   *  normal, 45 reverse. Rule 430: one dip, read by the footprint's
   *  projection, by rule 399's top of rupture and by CB14's dip and
   *  hanging-wall terms alike. */
  dipDeg?: number;
  /** Whether the toll counts the dead below MMI VII (rule 46 of
   *  validation/lowIntensityRules.ts): not at all (`none`), or in the V
   *  and VI bands the rings draw at 5.0 and 6.0, at PAGER's rates for the
   *  bands' middles (`midBand`) or their integers (`pager`). On the
   *  shipped rings only; PAGER's banding counts its own. Omitted, `none`. */
  lowIntensityDeaths?: LowIntensityDeaths;
  /** How far the ground of a scenario drawn as a disc stands from its
   *  rupture (rule 51 of validation/pointSourceRules.ts): as far as from the
   *  epicentre (`epicentral`), or at Thompson & Worden 2018's average over
   *  the ruptures its hypocentre can belong to (`thompsonWorden2018`,
   *  events/earthquake/pointSourceDistance.ts). Read by Boore et al. 2014's
   *  rings and the interface models'; a stadium keeps its distances.
   *  Omitted, `epicentral`. */
  pointSourceDistance?: PointSourceDistance;
  /** Which law draws the rings of a scenario deeper than 70 km (rule 67 of
   *  validation/slabRules.ts): the law any other scenario draws (`none`), or
   *  an intraslab model at the hypocentral distance, the scenario a disc
   *  about its epicentre at every magnitude (`abrahamson2016Slab`,
   *  `parker2022Slab`, events/earthquake/slabAttenuation.ts). Omitted,
   *  `abrahamson2016Slab`, which rules 68 and 69 adopted on 15 September
   *  2026; `none` keeps the rings the rules that ran before drew. */
  deepLaw?: DeepLaw;
}

/** Rule 51 of validation/pointSourceRules.ts: the distance a disc's rings
 *  are drawn at. */
export type PointSourceDistance = 'epicentral' | 'thompsonWorden2018';

/** Rule 67 of validation/slabRules.ts: the law of a scenario deeper than
 *  {@link DEEP_LAW_FROM_KM}. */
export type DeepLaw = 'none' | SlabMotionModel;

/** Rule 67: the depth (km) below which `deepLaw` draws the rings. */
export const DEEP_LAW_FROM_KM = 70;

/** Rules 68 and 69 of validation/slabRules.ts: the deep law a scenario
 *  that names none draws, since 15 September 2026. */
export const DEFAULT_DEEP_LAW: DeepLaw = 'abrahamson2016Slab';

/** The intraslab model that draws a scenario's rings, or null where the
 *  scenario is no deeper than {@link DEEP_LAW_FROM_KM} or names `none`. */
export function deepLawFor(
  input: Pick<EarthquakeScenarioInput, 'depth' | 'deepLaw'>
): SlabMotionModel | null {
  const depthKm = ((input.depth as number | undefined) ?? DEFAULT_HYPOCENTRE_DEPTH_M) / 1_000;
  const law = input.deepLaw ?? DEFAULT_DEEP_LAW;
  return law !== 'none' && depthKm > DEEP_LAW_FROM_KM ? law : null;
}

/** Rule 41 of validation/interfaceStadiumRules.ts: the geometry of a
 *  scenario marked a subduction interface below Mw 7.5. */
export type InterfaceStadium = 'always' | 'fromMw7.5';

/** Rule 412 of validation/extendedSourceRules.ts: the geometry of a
 *  scenario that is NOT marked a subduction interface and not deeper than
 *  70 km, below Mw 7.5. */
export type ExtendedSource = 'always' | 'fromMw7.5';

/** Rule 419 of validation/surfaceProjectionRules.ts: which width the
 *  footprint laid on the ground is built from. */
export type StadiumWidth = 'downDip' | 'surfaceProjection';

/** Rule 46 of validation/lowIntensityRules.ts: the dead below MMI VII. */
export type LowIntensityDeaths = 'none' | 'midBand' | 'pager';

/** Rule 31 of validation/pagerChain.ts: the ground motion intensity is
 *  drawn from. */
export type IntensityMeasure = 'pga' | 'pgv';

/** Rule 31 of validation/pagerChain.ts: where a band of intensity
 *  begins. */
export type IntensityBanding = 'rings' | 'pager';

/** The intensity at which band k begins: k itself on the shipped rings,
 *  k − ½ as PAGER and ShakeMap's legend band it. */
/**
 * Rule 309 of validation/shakingFieldRules.ts: each result's own contour law,
 * read forwards, kept BESIDE the result and not inside it.
 *
 * A scenario result is data: several tests compare two of them whole, to say
 * that a change moved the rings and nothing else, and a closure in the object
 * makes two identical results unequal for ever. So the law lives in a weak map
 * keyed by the result — it disappears when the result does, and a result that
 * has been copied or serialised simply has no law, which `intensityLawOf`
 * reports by returning null rather than by guessing one.
 */
const INTENSITY_LAWS = new WeakMap<
  EarthquakeScenarioResult,
  (distanceM: number, siteVs30: number) => number
>();

/** The law a result was drawn with, or null for a result that was copied. */
export function intensityLawOf(
  result: EarthquakeScenarioResult
): ((distanceM: number, siteVs30: number) => number) | null {
  return INTENSITY_LAWS.get(result) ?? null;
}

export function bandEdge(k: number, banding: IntensityBanding = 'rings'): number {
  return banding === 'pager' ? k - 0.5 : k;
}

/**
 * The laws the intensity rings can be drawn with (rule 17 of
 * validation/contourLaws.ts):
 *
 *  - `joynerBoore1981`: Joyner & Boore 1981's median PGA with Boore et
 *    al. 2014's site term, shipped until 14 September 2026;
 *  - `boore2014`: Boore et al. 2014's median PGA, with its own
 *    fault-type and site terms — tried on 9 September 2026, and the
 *    default since rule 19 adopted it;
 *  - `boore2014FromMw7.5`: the first below Mw 7.5 and the second from
 *    it, the magnitude at which the rings become a rupture stadium.
 *
 * All three take a PGA for each intensity from Worden et al. 2012. Rule
 * 24 of validation/depthRules.ts adds two that carry the depth of the
 * source, written before either was scored:
 *
 *  - `allen2012Hypocentral`: Allen, Wald & Worden 2012's intensity
 *    prediction equation in hypocentral distance, the ring drawn where
 *    the intensity at the ground falls to the threshold for a source at
 *    the scenario's depth (15 km when none is set, as the band assumes);
 *  - `allen2012HypocentralBelowMw7.5`: that below Mw 7.5 and Boore et
 *    al. 2014 from it, where the rings become a stadium and a hypocentre
 *    no longer stands for the rupture.
 *
 * Those two take the intensity straight from the equation, with no site
 * term, and read a ground-motion residual drawn in ln PGA as a shift
 * along Worden et al. 2012's upper slope, 3.70 / ln 10 intensity units a
 * unit: a σ of 0.60 becomes 0.96, within the 0.82 to 1.19 the equation
 * gives.
 *
 * Rule 36 of validation/interfaceRules.ts adds two for a scenario marked a
 * subduction interface, Boore et al. 2014 for any other, written before
 * either was scored:
 *
 *  - `abrahamson2016Interface`: Abrahamson, Gregor & Addo 2016 (BC Hydro),
 *    interface, central magnitude scaling, forearc;
 *  - `parker2022Interface`: Parker et al. 2022 (NGA-Subduction), the
 *    global interface model.
 *
 * Both take each intensity's PGA from Worden et al. 2012 and stand the
 * ring at the Joyner–Boore distance x from the rupture's stadium where the
 * median at the rupture distance √(x² + h²) falls to it, h the depth
 * (effects/interfaceAttenuation.ts); they read PGA whatever
 * `intensityMeasure` asks.
 */
export type ContourLaw =
  | 'joynerBoore1981'
  | 'boore2014'
  | 'boore2014FromMw7.5'
  | 'allen2012Hypocentral'
  | 'allen2012HypocentralBelowMw7.5'
  | 'campbellBozorgnia2014'
  | 'abrahamson2016Interface'
  | 'parker2022Interface';

/** The depth a scenario that sets none is drawn at, as the earthquake
 *  Monte Carlo already assumes. */
const DEFAULT_HYPOCENTRE_DEPTH_M = 15_000;

/**
 * Felt-intensity and PGA summary emitted for every earthquake scenario.
 * The three `mmi*` radii collapse to 0 m when the magnitude is too low
 * to sustain that intensity at the epicentre — callers should hide
 * rings with a zero radius.
 */
export interface EarthquakeShakingResult {
  /** Peak ground acceleration 20 km from the epicentre (m/s²). */
  pgaAt20km: MetersPerSecondSquared;
  /** Peak ground acceleration 100 km from the epicentre (m/s²). */
  pgaAt100km: MetersPerSecondSquared;
  /** BSSA14 PGA @ 20 km (NGA-West2 modern estimator, Vs30 aware). */
  pgaAt20kmNGA: MetersPerSecondSquared;
  /** BSSA14 PGA @ 100 km. */
  pgaAt100kmNGA: MetersPerSecondSquared;
  /** Epicentral MMI (Worden 2012 California fit), clamped to [1, 12]. */
  mmiAtEpicenter: number;
  /** Epicentral MMI using the Faenza & Michelini (2010) Italian /
   *  European calibration — use this for events on the Eurasian plate. */
  mmiAtEpicenterEurope: number;
  /** Ground range to where MMI V begins, on PAGER's banding or when the
   *  toll counts the dead below VII. */
  mmi5Radius?: Meters;
  /** Ground range to where MMI VI begins, on PAGER's banding or when the
   *  toll counts the dead below VII. */
  mmi6Radius?: Meters;
  /** Ground range to the MMI VII contour (strong shaking): intensity
   *  7.0 on the shipped rings, 6.5 on PAGER's banding. */
  mmi7Radius: Meters;
  /** Ground range to the MMI VIII contour (severe shaking). */
  mmi8Radius: Meters;
  /** Ground range to the MMI IX contour (violent shaking). */
  mmi9Radius: Meters;
  /** Ground-range radius within which liquefaction on saturated sandy
   *  soil is likely (Youd & Idriss 2001 magnitude-scaling threshold). */
  liquefactionRadius: Meters;
  /** Vs30 (m/s) used for the NGA-West2 site factor. Echoes the user's
   *  override when set, otherwise the default rock reference (760). */
  siteVs30: number;
  /** NEHRP site class corresponding to {@link siteVs30}. */
  siteClass: NEHRPClass;
}

export interface EarthquakeScenarioResult {
  inputs: EarthquakeScenarioInput;
  /** The fault the model ran, which is the scenario's own unless a subduction
   *  interface was asked for: an interface is a thrust (B-046). */
  faultTypeUsed: FaultType;
  seismicMoment: NewtonMeters;
  ruptureLength: Meters;
  /** Down-dip rupture width W (m) — Wells & Coppersmith 1994 Table 2A
   *  for crustal events, Strasser 2010 for explicit megathrusts. A true
   *  distance along the dipping plane, not a distance on the map: what
   *  the stadium is laid on is {@link ruptureFootprintWidth}. Until rule
   *  419 this field was used for both, and the comment here called the
   *  result a "surface-projection rectangle" while handing it a down-dip
   *  width. */
  ruptureWidth: Meters;
  /** The width (m) of the rectangle the footprint is laid on: what the
   *  rupture covers ON THE MAP. Equal to {@link ruptureWidth} under the
   *  geometry in place, and to W·cos δ where rule 419's
   *  `surfaceProjection` applies. Everything that draws or counts inside
   *  a stadium — the field, the harness footprint, the casualty counter,
   *  the globe — reads this one. */
  ruptureFootprintWidth: Meters;
  /** True when the renderer should treat this event as an extended
   *  source (rupture rectangle ≫ point) for the MMI contours. Set
   *  whenever Mw ≥ 7.5 OR the user toggled `subductionInterface`.
   *  At smaller magnitudes the rupture is inside the MMI VII
   *  point-source radius and the stadium degenerates to a circle, so
   *  the existing point-source ring is kept. */
  isExtendedSource: boolean;
  shaking: EarthquakeShakingResult;
  /** Cross-module bridge: when the event is a subduction-interface
   *  megathrust OR a shallow submarine thrust/normal at Mw ≥ 6.5,
   *  the earthquake feeds the tsunami pipeline and emits a
   *  seismic-source tsunami block. Omitted otherwise. */
  tsunami?: SeismicTsunamiResult;
  /** True when {@link EarthquakeScenarioInput.waterDepth} was
   *  supplied positive — i.e. the epicentre lies on the seafloor.
   *  The renderer uses this to fade the on-globe MMI contour rings
   *  (felt-intensity is a land-coupled scale; the contour radii
   *  remain physically valid where they cross the shoreline, but
   *  must NOT be read as ground-shaking levels on open water). */
  isSubmarine: boolean;
  /** Echo of the water depth at the epicentre (m), or 0 when the
   *  scenario is continental. Surfaces in the report panel as the
   *  "submarine epicentre" detail. */
  submarineDepth: Meters;
  /** Reasenberg-Jones / Båth / Omori-Utsu / Gutenberg-Richter
   *  aftershock catalogue. Generated for every result with a seed
   *  derived from the inputs so the same scenario produces the same
   *  sequence (URL-shareable contract). */
  aftershocks: AftershockSequenceResult;
}

/**
 * Deterministic Layer-2 earthquake scenario: bundles the Hanks–Kanamori
 * seismic moment, Wells–Coppersmith rupture length, and Joyner–Boore +
 * Worden ground-motion pipeline into a single snapshot for the UI.
 *
 * No randomness, no I/O, no framework imports — runs unchanged from
 * the Node CLI, a Comlink worker, or a Vitest unit. See the individual
 * formula modules for equation-level citations.
 */
export function simulateEarthquake(input: EarthquakeScenarioInput): EarthquakeScenarioResult {
  // A subduction interface is a thrust. A scenario could name a strike-slip
  // fault and tick the interface at once, and the two then ran different parts
  // of the model — Strasser's scaling for the rupture, the named fault for the
  // ground motion (B-046 of docs/BUG_REGISTRY.md). The interface wins, and the
  // result says which fault the model actually ran.
  const faultType: FaultType =
    input.subductionInterface === true ? 'reverse' : (input.faultType ?? 'all');
  const vs30 = input.vs30 ?? 760;
  const seismicMoment = seismicMomentFromMagnitude(input.magnitude);
  // Rule 370: the scaling is its own input, and defaults to what the
  // interface flag used to decide alone.
  const megathrustScaling =
    (input.ruptureScaling ??
      (input.subductionInterface === true ? 'strasser' : 'wellsCoppersmith')) === 'strasser';
  const ruptureLength =
    input.ruptureLengthOverride ??
    (megathrustScaling
      ? megathrustRuptureLength(input.magnitude)
      : surfaceRuptureLength({ magnitude: input.magnitude, faultType }));
  const ruptureWidth =
    input.ruptureWidthOverride ??
    (megathrustScaling
      ? megathrustRuptureWidth(input.magnitude)
      : surfaceRuptureWidth({ magnitude: input.magnitude, faultType }));
  // Extended-source threshold: 7.5 sits at the elbow where the W&C
  // surface-rupture length (≈ 50 km) starts to exceed the MMI VII
  // point-source attenuation radius (≈ 35–55 km depending on faultType
  // & Vs30). Below 7.5 the stadium contour collapses inside the
  // existing point-source ring, so there is nothing to gain by
  // upgrading the geometry; we keep the simpler renderer in that
  // regime to avoid spurious "the circle squashed itself" visuals on
  // small events. A scenario marked a subduction interface was a stadium
  // at every magnitude until 15 September 2026, when rules 40 to 44 of
  // validation/interfaceStadiumRules.ts found the disc below Mw 7.5 closer
  // to the ShakeMaps of 64 deep interface earthquakes no rule had read
  // (0.99 against 2.29) and no worse on their dead; `interfaceStadium`
  // keeps the old geometry for the rules that ran on it.
  const depthKm = ((input.depth as number | undefined) ?? DEFAULT_HYPOCENTRE_DEPTH_M) / 1_000;
  // Rules 66 to 70 of validation/slabRules.ts: an intraslab model for a
  // scenario deeper than 70 km, a disc about the epicentre at every
  // magnitude. Abrahamson, Gregor & Addo 2016 since 15 September 2026, when
  // it scored 0.86 against Boore et al. 2014's 0.00 on 618 ShakeMaps no rule
  // had read and read the dead of 62 deep earthquakes nearer their records
  // (0.80 against 1.09), though its band held fewer of them (38 against 58).
  const deepModel = deepLawFor(input);
  // Rule 412 of validation/extendedSourceRules.ts: an unmarked scenario may
  // be a stadium at every magnitude. Which input decides depends on what the
  // scenario IS — a marked one keeps rule 44's geometry, a deep one is a disc
  // by rules 66 to 70 and reads neither — so that widening the shape of a
  // crustal earthquake cannot reach into a decision made on other evidence.
  const isExtendedSource =
    deepModel === null &&
    (input.magnitude >= 7.5 ||
      (input.subductionInterface === true
        ? (input.interfaceStadium ?? 'fromMw7.5') === 'always'
        : (input.extendedSource ?? 'fromMw7.5') === 'always'));

  // Ground-motion aleatory residual: exp(residual) scales every PGA.
  // Default 0 → gm = 1 → median scenario unchanged. The Monte-Carlo
  // wrapper samples `residual ~ N(0, σ_lnY)` so the displayed bands
  // fold in the GMPE's intrinsic scatter, not just the input spread.
  const residual = input.groundMotionResidualLn ?? 0;
  const gm = Number.isFinite(residual) ? Math.exp(residual) : 1;
  // Rule 71 of validation/residualRules.ts: a place's accelerations may
  // draw their own within-event part; the footprint keeps `gm`.
  const siteResidual = input.groundMotionSiteResidualLn ?? residual;
  const siteGm = Number.isFinite(siteResidual) ? Math.exp(siteResidual) : 1;
  const scalePga = (p: MetersPerSecondSquared): MetersPerSecondSquared =>
    mps2((p as number) * siteGm);
  // A given fixed PGA target is reached, under the perturbed field,
  // where the MEDIAN PGA equals target / gm — so contour radii inflate
  // for gm > 1 and shrink for gm < 1.
  const target = (pga: MetersPerSecondSquared): MetersPerSecondSquared =>
    mps2((pga as number) / gm);

  const pgaAt20km = scalePga(
    peakGroundAcceleration({ magnitude: input.magnitude, distance: m(20_000) })
  );
  const pgaAt100km = scalePga(
    peakGroundAcceleration({ magnitude: input.magnitude, distance: m(100_000) })
  );
  const ngaFault: NGAFaultType =
    faultType === 'strike-slip' || faultType === 'normal' || faultType === 'reverse'
      ? faultType
      : 'unspecified';
  const pgaAt20kmNGA = scalePga(
    peakGroundAccelerationNGAWest2({
      magnitude: input.magnitude,
      distance: m(20_000),
      faultType: ngaFault,
      vs30,
    })
  );
  const pgaAt100kmNGA = scalePga(
    peakGroundAccelerationNGAWest2({
      magnitude: input.magnitude,
      distance: m(100_000),
      faultType: ngaFault,
      vs30,
    })
  );

  // The contours, until 14 September 2026: Joyner–Boore 1981 for the
  // shape, and the published BSSA14 site term for the ground it stands
  // on. Since then Boore et al. 2014 outright (`law` below), chosen by
  // rule 18 of validation/contourLaws.ts on 370 USGS ShakeMaps and
  // checked on the dead by rule 19; the older law stays a candidate.
  //
  // `vs30` was an input the simulator accepted, fed to the reported
  // accelerations, and dropped on the floor before the rings were
  // drawn — Joyner–Boore takes a magnitude and nothing else, so a
  // Northridge run at Vs30 760, 500, 400, 300 and 250 gave the same
  // 17.0 km MMI VII ring every time, where soft ground is worth a
  // factor of two in radius. A contour is now the range at which the
  // *site-amplified* median reaches the threshold, which is the same
  // thing as asking for a lower median on softer ground.
  //
  // The assumption, stated because it is one: the 1981 median is
  // taken to stand for the reference-rock site the site term is
  // written against. It is not exactly that — JB81 was fitted across
  // a mix of sites with no site term of its own — so this is a
  // correction relative to whatever that mix was. At Vs30 = 760 the
  // factor is one by construction and nothing moves, which is every
  // preset in the calibration net.
  //
  // Drawing the contours with NGA-West2 outright was tried and
  // measured on 9 September and reverted then on those three rows: it
  // takes Northridge's toll from 38 dead against 57 to 13, L'Aquila's
  // from 227 against 309 to 40, and pushes Amatrice out of its gate.
  // Three tuned rows were the wrong jury; rules 17 to 19 are the jury
  // since. See docs/ROADMAP.md, M9 move 4.
  const siteGain = vs30SiteFactor(
    vs30,
    (peakGroundAcceleration({ magnitude: input.magnitude, distance: m(10_000) }) as number) /
      STANDARD_GRAVITY
  );
  // Boore et al. 2014 since 14 September 2026, chosen by rule 18 of
  // validation/contourLaws.ts on 370 USGS ShakeMaps and checked on the
  // dead by rule 19.
  const law = input.contourLaw ?? 'boore2014';
  const allen =
    law === 'allen2012Hypocentral' ||
    (law === 'allen2012HypocentralBelowMw7.5' && input.magnitude < 7.5);
  // Rule 384: Campbell & Bozorgnia 2014, the NGA-West2 model that carries
  // the hypocentral depth Boore et al. 2014 has no room for.
  const campbell = law === 'campbellBozorgnia2014';
  // CB14 knows three styles and nothing else: an unspecified fault is drawn
  // as strike-slip, whose style term is zero — the model's own neutral case.
  const cbStyle: 'reverse' | 'normal' | 'strike-slip' =
    faultType === 'reverse' || faultType === 'normal' ? faultType : 'strike-slip';
  /**
   * Depth to the top of the rupture, which is what R_rup is measured to.
   *
   * A rupture reaches UP from its hypocentre by about half its width along
   * dip, so Northridge's focus at 18 km sits under a rupture whose top is
   * near 5 — a factor of three on the distance to every site above it, and
   * the difference between drawing its MMI VIII band and losing it. Zero
   * where the rupture reaches the surface.
   */
  // Rule 427: the dip of the structure the scenario is drawn along where a
  // caller found one, and the style constant where nothing answered. A
  // megathrust handed 90° here is what gave eleven of the jury's twenty
  // largest earthquakes a surface projection of exactly zero.
  const styleDipDeg = cbStyle === 'strike-slip' ? 90 : cbStyle === 'normal' ? 55 : 45;
  const dipDeg =
    input.dipDeg !== undefined && Number.isFinite(input.dipDeg) && input.dipDeg > 0
      ? Math.min(90, input.dipDeg)
      : styleDipDeg;
  const dipRad = dipDeg * (Math.PI / 180);
  // Rule 399: the NGA-West2 estimate of Chiou & Youngs 2014 as a FLOOR,
  // bounded by the rupture the scenario has. Hanging the rupture
  // symmetrically about its focus — what this did until rules 399 to 404
  // ran — put Northridge's top at 14.2 km where the real one reached about
  // 5, and cost the candidate its MMI VIII band. The estimator alone would
  // have been worse: it depends on magnitude and style and nothing else,
  // so every depth would give the same distance and the depth would leave
  // the model by the back door.
  const ztorKm = topOfRuptureKm({
    magnitude: input.magnitude,
    hypocentreDepthKm: depthKm,
    ruptureWidthKm: (ruptureWidth as number) / 1_000,
    dipDeg,
    style: cbStyle,
  });
  /** Half the rupture's surface projection across strike (km). */
  const halfWidthKm = ((ruptureWidth as number) / 2_000) * Math.cos(dipRad);
  // Rule 419: the width the footprint is laid on. The projection is the
  // one directly above — the same number CB14's R_x has used since rule
  // 391 — so there is one expression for it and not two that can drift.
  // Rule 421's domain: a marked interface keeps its width, because the dip
  // table here has no megathrust in it and would hand one 45° where it
  // dips 15 to 25; a deep scenario is a disc at every magnitude anyway.
  const ruptureFootprintWidth: Meters =
    deepModel === null &&
    input.subductionInterface !== true &&
    (input.stadiumWidth ?? 'surfaceProjection') === 'surfaceProjection'
      ? m(halfWidthKm * 2_000)
      : ruptureWidth;
  // Rule 36 of validation/interfaceRules.ts: an interface model for a
  // scenario marked a subduction interface, Boore et al. 2014 otherwise.
  //
  //
  // The flag stays the gate, and that is deliberate: an interface relation on
  // a crustal earthquake is a relation outside its domain, and
  // `interfaceAttenuation.test.ts` holds the model to refusing it. Rule 370
  // separates the SCALING from the flag (see `ruptureScaling` above), which
  // is the coupling rule 35 measured through; it does not open the law to
  // scenarios that are not interfaces.
  const interfaceModel: InterfaceMotionModel | null =
    input.subductionInterface !== true
      ? null
      : law === 'abrahamson2016Interface'
        ? 'abrahamson2016'
        : law === 'parker2022Interface'
          ? 'parker2022'
          : null;
  const boore =
    !allen &&
    !campbell &&
    (law === 'boore2014' ||
      law === 'allen2012HypocentralBelowMw7.5' ||
      law === 'abrahamson2016Interface' ||
      law === 'parker2022Interface' ||
      (law === 'boore2014FromMw7.5' && input.magnitude >= 7.5));
  // Rule 31 of validation/pagerChain.ts: PGV where the chain asks for
  // it, and the rings at the edges of PAGER's bands where it asks for
  // those. A residual scales PGV as it scales PGA.
  const byPgv = boore && input.intensityMeasure === 'pgv';
  const banding = input.intensityBanding ?? 'rings';
  // Rule 51 of validation/pointSourceRules.ts: a disc's rings at Thompson
  // & Worden 2018's average distances to the rupture, where asked.
  const toRupture =
    deepModel === null &&
    !isExtendedSource &&
    (input.pointSourceDistance ?? 'thompsonWorden2018') === 'thompsonWorden2018'
      ? pointSourceDistances(input.magnitude, depthKm)
      : null;
  const fromJoynerBoore = (rjb: Meters): Meters =>
    toRupture === null ? rjb : m(toRupture.epicentralForRjbKm((rjb as number) / 1_000) * 1_000);
  const contourAt = (mmi: number): Meters =>
    deepModel !== null
      ? epicentralDistanceForSlabPga(
          deepModel,
          { magnitude: input.magnitude, depthKm, vs30 },
          (target(pgaFromMercalliIntensity(mmi)) as number) / STANDARD_GRAVITY
        )
      : interfaceModel !== null
        ? toRupture === null
          ? distanceForInterfacePga(
              interfaceModel,
              { magnitude: input.magnitude, depthKm, vs30 },
              (target(pgaFromMercalliIntensity(mmi)) as number) / STANDARD_GRAVITY
            )
          : epicentralDistanceForInterfacePga(
              interfaceModel,
              { magnitude: input.magnitude, vs30 },
              (target(pgaFromMercalliIntensity(mmi)) as number) / STANDARD_GRAVITY,
              toRupture.rrupKm
            )
        : campbell
          ? m(
              epicentralDistanceForCampbellBozorgnia2014(
                {
                  magnitude: input.magnitude,
                  vs30,
                  hypocentreDepth: m(depthKm * 1_000),
                  topOfRuptureDepth: m(ztorKm * 1_000),
                  style: cbStyle,
                },
                (target(pgaFromMercalliIntensity(mmi)) as number) / STANDARD_GRAVITY
              )
            )
          : allen
            ? epicentralDistanceForIntensityAllen2012(
                input.magnitude,
                depthKm,
                mmi,
                Number.isFinite(residual) ? residual * MMI_PER_LN_PGA : 0
              )
            : byPgv
              ? fromJoynerBoore(
                  distanceForPgvNGAWest2(
                    { magnitude: input.magnitude, faultType: ngaFault, vs30 },
                    mps((pgvFromMercalliIntensity(mmi) as number) / gm)
                  )
                )
              : boore
                ? fromJoynerBoore(
                    distanceForPgaNGAWest2(
                      { magnitude: input.magnitude, faultType: ngaFault, vs30 },
                      target(pgaFromMercalliIntensity(mmi))
                    )
                  )
                : distanceForPga(
                    input.magnitude,
                    mps2((target(pgaFromMercalliIntensity(mmi)) as number) / siteGain)
                  );
  /**
   * Rule 309 of validation/shakingFieldRules.ts: the intensity this scenario's
   * own law gives at a distance and at a site — `contourAt` read forwards.
   *
   * The distance means what the radius `contourAt` returns means, so that a
   * field evaluated with this function and a contour drawn from that radius are
   * the same statement: the Joyner–Boore distance from the rupture where the
   * source is extended, the epicentral distance where it is a point. The site
   * is a parameter and not the scenario's `vs30`, because that is the whole
   * point of a field: the ground under a city three hundred kilometres away is
   * not the ground under the epicentre.
   *
   * Every branch mirrors the branch of `contourAt` above it, and the test
   * `intensityAt(contourAt(mmi)) === mmi` holds them together — a law that
   * drifted between the two would draw contours the field disagrees with.
   */
  const intensityAt = (distanceM: number, siteVs30: number, acrossStrikeM?: number): number => {
    const dKm = Math.max(0, distanceM) / 1_000;
    const v = Number.isFinite(siteVs30) && siteVs30 > 0 ? siteVs30 : vs30;
    if (deepModel !== null) {
      const pgaG = slabPga(deepModel, {
        magnitude: input.magnitude,
        hypocentralKm: Math.hypot(dKm, depthKm),
        depthKm,
        vs30: v,
      });
      return modifiedMercalliIntensity(mps2(pgaG * STANDARD_GRAVITY * gm));
    }
    if (interfaceModel !== null) {
      const rrupKm = toRupture === null ? Math.hypot(dKm, depthKm) : toRupture.rrupKm(dKm);
      const pgaG = interfacePga(interfaceModel, {
        magnitude: input.magnitude,
        rrupKm,
        vs30: v,
      });
      return modifiedMercalliIntensity(mps2(pgaG * STANDARD_GRAVITY * gm));
    }
    if (campbell) {
      // Rule 391: the hanging wall, where the caller says which side of the
      // trace this is. `acrossStrikeM` is the field's own y — signed, and
      // positive where the plane dips — so a cell on the upthrown side gets
      // the term and a ring, which has no side, gets nothing.
      const hangingWall =
        acrossStrikeM === undefined
          ? undefined
          : {
              rxKm: acrossStrikeM / 1_000,
              rjbKm: Math.max(0, Math.abs(acrossStrikeM) / 1_000 - halfWidthKm),
              ztorKm,
              widthKm: (ruptureWidth as number) / 1_000,
            };
      const pgaG = campbellBozorgnia2014PgaAtEpicentralDistance(
        {
          magnitude: input.magnitude,
          vs30: v,
          hypocentreDepth: m(depthKm * 1_000),
          topOfRuptureDepth: m(ztorKm * 1_000),
          style: cbStyle,
          ...(hangingWall === undefined ? {} : { hangingWall }),
        },
        distanceM
      );
      return modifiedMercalliIntensity(mps2(pgaG * STANDARD_GRAVITY * gm));
    }
    if (allen) {
      // Allen et al. 2012 predicts intensity directly and carries no site term.
      return (
        allen2012HypocentralMmi(input.magnitude, Math.hypot(dKm, depthKm)) +
        (Number.isFinite(residual) ? residual * MMI_PER_LN_PGA : 0)
      );
    }
    const rjbKm = toRupture === null ? dKm : toRupture.rjbKm(dKm);
    if (byPgv) {
      const pgv = peakGroundVelocityNGAWest2({
        magnitude: input.magnitude,
        faultType: ngaFault,
        vs30: v,
        distance: m(rjbKm * 1_000),
      });
      return mercalliIntensityFromPgv(mps((pgv as number) * gm));
    }
    if (boore) {
      const pga = peakGroundAccelerationNGAWest2({
        magnitude: input.magnitude,
        faultType: ngaFault,
        vs30: v,
        distance: m(rjbKm * 1_000),
      });
      return modifiedMercalliIntensity(mps2((pga as number) * gm));
    }
    // Joyner & Boore 1981 with the site term `siteGain` applies to the
    // scenario's own vs30; at another site the same correction is taken there.
    const rock =
      (peakGroundAcceleration({ magnitude: input.magnitude, distance: m(10_000) }) as number) /
      STANDARD_GRAVITY;
    const pga = peakGroundAcceleration({ magnitude: input.magnitude, distance: m(dKm * 1_000) });
    return modifiedMercalliIntensity(mps2((pga as number) * vs30SiteFactor(v, rock) * gm));
  };

  // Rule 193 of validation/epicentralIntensityRules.ts: the intensity at the
  // epicentre is the ring law's own value at epicentral distance zero.
  //
  // Every inverse above starts by evaluating its law at zero and returns a
  // radius of zero when that value is below the threshold — so reading the
  // same laws here makes the two statements one. Until 18 September 2026 the
  // epicentre was Joyner & Boore 1981 at distance zero, a law that takes a
  // magnitude and a distance and *no depth*: a slab event three hundred
  // kilometres down read MMI 9.3 at its epicentre and drew no MMI VII ring
  // anywhere (B-051).
  //
  // The scaling is the rings': a contour stands where the median reaches
  // `target`, the threshold over `gm`, so the field the rings describe is the
  // median times `gm`. The site residual of rule 71, which is a place's own
  // draw and not the footprint's, stays out of it.
  const epicentralRjbKm = toRupture === null ? 0 : toRupture.rjbKm(0);
  const epicentralRrupKm = toRupture === null ? depthKm : toRupture.rrupKm(0);
  // The acceleration at the epicentre where the law gives one, in m/s².
  const epicentralPgaFromLaw: MetersPerSecondSquared | null =
    deepModel !== null
      ? mps2(
          slabPga(deepModel, {
            magnitude: input.magnitude,
            hypocentralKm: depthKm,
            depthKm,
            vs30,
          }) *
            STANDARD_GRAVITY *
            gm
        )
      : interfaceModel !== null
        ? mps2(
            interfacePga(interfaceModel, {
              magnitude: input.magnitude,
              rrupKm: epicentralRrupKm,
              vs30,
            }) *
              STANDARD_GRAVITY *
              gm
          )
        : campbell
          ? mps2(
              campbellBozorgnia2014PgaAtEpicentralDistance(
                {
                  magnitude: input.magnitude,
                  vs30,
                  hypocentreDepth: m(depthKm * 1_000),
                  topOfRuptureDepth: m(ztorKm * 1_000),
                  style: cbStyle,
                },
                0
              ) *
                STANDARD_GRAVITY *
                gm
            )
          : allen || byPgv
            ? null
            : boore
              ? mps2(
                  (peakGroundAccelerationNGAWest2({
                    magnitude: input.magnitude,
                    distance: m(epicentralRjbKm * 1_000),
                    faultType: ngaFault,
                    vs30,
                  }) as number) * gm
                )
              : mps2(
                  (peakGroundAcceleration({
                    magnitude: input.magnitude,
                    distance: m(0),
                  }) as number) *
                    siteGain *
                    gm
                );
  // The intensity itself. Two laws speak intensity rather than acceleration:
  // Allen 2012, which is an intensity prediction equation, and the rings drawn
  // on velocity by rule 31.
  const mmiAtEpicenter = allen
    ? Math.max(
        1,
        Math.min(
          12,
          allen2012HypocentralMmi(input.magnitude, depthKm) +
            (Number.isFinite(residual) ? residual * MMI_PER_LN_PGA : 0)
        )
      )
    : byPgv
      ? mercalliIntensityFromPgv(
          mps(
            (peakGroundVelocityNGAWest2({
              magnitude: input.magnitude,
              distance: m(epicentralRjbKm * 1_000),
              faultType: ngaFault,
              vs30,
            }) as number) * gm
          )
        )
      : modifiedMercalliIntensity(epicentralPgaFromLaw ?? mps2(0));
  // Rule 193: where the law gives no acceleration, the European reading is
  // taken from the acceleration Worden's relation puts under the intensity —
  // a stated convention, not a measurement.
  const epicentralPga = epicentralPgaFromLaw ?? pgaFromMercalliIntensity(mmiAtEpicenter);

  const mmi7Radius = contourAt(bandEdge(7, banding));
  const mmi8Radius = contourAt(bandEdge(8, banding));
  const mmi9Radius = contourAt(bandEdge(9, banding));
  // The V and VI rings: PAGER's banding draws them at its edges, and a
  // toll that counts the dead below VII (rule 46 of
  // validation/lowIntensityRules.ts) at 5.0 and 6.0.
  const lowRings = banding === 'pager' || (input.lowIntensityDeaths ?? 'none') !== 'none';
  const pagerRings = lowRings
    ? { mmi5Radius: contourAt(bandEdge(5, banding)), mmi6Radius: contourAt(bandEdge(6, banding)) }
    : {};

  const waterDepthM = (input.waterDepth as number | undefined) ?? 0;
  const isSubmarine = Number.isFinite(waterDepthM) && waterDepthM > 0;

  const result: EarthquakeScenarioResult = {
    inputs: input,
    faultTypeUsed: faultType,
    seismicMoment,
    ruptureLength,
    ruptureWidth,
    ruptureFootprintWidth,
    isExtendedSource,
    shaking: {
      pgaAt20km,
      pgaAt100km,
      pgaAt20kmNGA,
      pgaAt100kmNGA,
      mmiAtEpicenter,
      mmiAtEpicenterEurope: mmiFromPgaEuropean(epicentralPga),
      ...pagerRings,
      mmi7Radius,
      mmi8Radius,
      mmi9Radius,
      liquefactionRadius: liquefactionRadius(input.magnitude, gm),
      siteVs30: vs30,
      siteClass: nehrpClassFromVs30(vs30),
    },
    isSubmarine,
    submarineDepth: m(isSubmarine ? waterDepthM : 0),
    // Seed derived from the deterministic input set so the URL-
    // sharing contract holds: same scenario → same catalogue.
    aftershocks: generateAftershockSequence({
      magnitude: input.magnitude,
      ruptureLength,
      seed: `eq:${input.magnitude.toString()}:${faultType}:${(input.depth as number | undefined)?.toString() ?? 'd?'}`,
    }),
  };

  // Cross-module bridge: tsunami source. Three trigger paths share
  // the same {@link seismicTsunamiFromMegathrust} closed-form chain:
  //   1. Explicit subduction-interface megathrust flag (Tōhoku,
  //      Sumatra, Lisbon presets).
  //   2. Submarine epicentre with Mw ≥ 6.5 on a thrust or normal
  //      fault — the dip-slip component lifts the seafloor and
  //      generates a wave even without the megathrust label.
  //      Strike-slip events at this scale tend to displace the
  //      seafloor laterally and only marginally vertically, so we
  //      conservatively skip them (a Nimbus choice).
  //   3. (Future) shallow large normal-fault on flexural bulge.
  const submarineTsunamiTrigger =
    isSubmarine && input.magnitude >= 6.5 && (faultType === 'reverse' || faultType === 'normal');
  // Path 1 is a statement about the FAULT, and it used to be enough on its
  // own — so a reader who ticked the interface box on a preset and then
  // moved the epicentre inland kept the wave. A Mw 7.9 placed on the San
  // Andreas at San Bernardino, 100 km from the sea, published a tsunami
  // source and the globe drew its cavity and a trans-oceanic propagation
  // (B-079, found by a reader looking at his own map).
  //
  // The guard is NOT `isSubmarine`. The megathrust presets — Tohoku,
  // Sumatra, Lisbon — carry no `waterDepth` of their own: it is derived
  // from the bathymetry by the store, and every test that runs the model
  // without a store would lose its wave, T1's 93 DART records included.
  // So the wave is refused only where the geography is KNOWN and says dry
  // land: `waterDepth` present and not positive, which the store now
  // writes as zero when the elevation grid puts the epicentre above sea
  // level. Absent still means "nobody looked", and the flag still decides.
  const onConfirmedLand = input.waterDepth !== undefined && (input.waterDepth as number) <= 0;
  if ((input.subductionInterface === true && !onConfirmedLand) || submarineTsunamiTrigger) {
    result.tsunami = seismicTsunamiFromMegathrust({
      magnitude: input.magnitude,
      ruptureLength,
      // The width this result publishes, not a second one derived
      // from an aspect ratio inside the tsunami module. Both existed
      // until 9 September 2026 and the gap was 37 % for Tōhoku and a
      // factor 2.6 for Sumatra, whose length is overridden to the
      // observed 1 300 km and whose width was then read as L / 2.5 =
      // 520 km — wider than the whole forearc.
      ruptureWidth,
      faultType,
      ...(input.subductionInterface !== undefined && {
        subductionInterface: input.subductionInterface,
      }),
      // Rule 188: the ocean the wave crosses, when the caller knows it.
      // The water over the source is not it, and passing it here is what
      // made a shelf event's wave take 21 hours to go 1 000 km (B-052).
      ...(input.basinDepth !== undefined ? { basinDepth: input.basinDepth } : {}),
      ...(input.coastalBeachSlopeRad !== undefined && {
        coastalBeachSlopeRad: input.coastalBeachSlopeRad,
      }),
    });
  }

  // Rule 309: the law that drew these contours, kept beside the result.
  INTENSITY_LAWS.set(result, intensityAt);
  return result;
}

/**
 * Canonical earthquake presets used for the UI gallery and CLI.
 */
export const EARTHQUAKE_PRESETS = {
  /** 17 January 1994 Northridge, California — blind-thrust (reverse),
   *  Mw 6.7, hypocenter ≈19 km. */
  NORTHRIDGE_1994: {
    name: 'Northridge 1994',
    note: 'Blind-thrust rupture beneath the San Fernando Valley',
    input: {
      magnitude: 6.7,
      depth: m(19_000),
      faultType: 'reverse',
    } satisfies EarthquakeScenarioInput,
  },
  /** 11 March 2011 Tōhoku-Oki — subduction megathrust, Mw 9.1,
   *  hypocenter ≈29 km below the Japan Trench. */
  TOHOKU_2011: {
    name: 'Tōhoku 2011',
    note: 'Subduction megathrust rupture offshore northeast Honshū',
    input: {
      magnitude: 9.1,
      depth: m(29_000),
      faultType: 'reverse',
      subductionInterface: true,
      // Japan Trench strike ≈ 200° (NNE-SSW), Hayes USGS finite-fault.
      strikeAzimuthDeg: 200,
    } satisfies EarthquakeScenarioInput,
  },
  /** 14 November 2001 Kokoxili, Tibet — strike-slip, Mw 7.8, shallow. */
  KUNLUN_2001: {
    name: 'Kokoxili (Kunlun) 2001',
    note: 'Strike-slip rupture on the Kunlun Fault, Tibetan Plateau',
    input: {
      magnitude: 7.8,
      depth: m(10_000),
      faultType: 'strike-slip',
      // Kunlun fault trace strikes ≈ 95° (almost due E–W). 400 km
      // surface rupture documented by Lin et al. 2002, Science 296.
      strikeAzimuthDeg: 95,
    } satisfies EarthquakeScenarioInput,
  },
  /** 26 December 2004 Sumatra–Andaman — Sunda subduction megathrust,
   *  Mw 9.1–9.3, hypocentre ≈ 30 km. Generated the deadliest tsunami
   *  in modern record (≈ 230 000 fatalities Indian-Ocean basin-wide).
   *  Lay et al. 2005 Science 308 (5725): 1127–1133. */
  SUMATRA_2004: {
    name: 'Sumatra–Andaman 2004',
    note: 'Sunda megathrust rupture; basin-wide tsunami across the Indian Ocean. Strasser median scaling under-predicts L by ~40 % at this magnitude — the preset overrides L to the Lay 2005 observation.',
    input: {
      magnitude: 9.2,
      depth: m(30_000),
      faultType: 'reverse',
      subductionInterface: true,
      // Sunda Trench strike ≈ 330° (NW–SE), 1300 km rupture from
      // northern Sumatra into the Andaman Islands (Lay 2005, Science
      // 308:1127). Strasser at Mw 9.2 gives only 803 km — the
      // saturation issue is documented in `ruptureLength.ts` and
      // covered by `ruptureLengthOverride` here.
      strikeAzimuthDeg: 330,
      ruptureLengthOverride: m(1_300_000),
      // The Indian Ocean had no warning system in December 2004; it
      // got one in 2006. Its far coasts had two hours of travel time
      // and no warning whatsoever, and Sri Lanka and India lost more
      // than fifty thousand people at distances where the Pacific
      // would have been emptied twice over.
      warningIssueS: Number.POSITIVE_INFINITY,
      ruptureWidthOverride: m(200_000),
    } satisfies EarthquakeScenarioInput,
  },
  /** 1 November 1755 Lisbon — Mw ≈ 8.5–9.0, source debated between
   *  the Gorringe Bank thrust and a deeper Azores–Gibraltar fracture-
   *  zone segment. Triggered the trans-Atlantic tsunami documented
   *  on Iberian, Moroccan, and West-Indies coasts (Baptista & Miranda
   *  2009 Nat. Hazards Earth Syst. Sci. 9: 25–42). */
  LISBON_1755: {
    name: 'Lisbon 1755',
    note: 'Atlantic megathrust on the Azores–Gibraltar fracture zone; trans-oceanic tsunami',
    input: {
      magnitude: 8.7,
      depth: m(20_000),
      faultType: 'reverse',
      subductionInterface: true,
      // Azores–Gibraltar fracture zone strikes ≈ 70° (ENE-WSW;
      // Baptista & Miranda 2009, NHESS 9: 25, Fig. 5).
      strikeAzimuthDeg: 70,
      // Two centuries before any warning system anywhere.
      warningIssueS: Number.POSITIVE_INFINITY,
    } satisfies EarthquakeScenarioInput,
  },
  /** Valdivia, Chile — 22 May 1960. The largest earthquake ever
   *  recorded by instruments: Mw 9.5, Nazca-South America subduction
   *  interface, ≈ 1 000 km rupture length. Triggered a Pacific-wide
   *  tsunami (16 m at Hilo HI, 5 m at Sendai JP — 22 hours after
   *  the rupture). Reference: Cifuentes (1989) "The 1960 Chilean
   *  earthquakes." JGR 94 (B1): 665–680. DOI: 10.1029/JB094iB01p00665. */
  VALDIVIA_1960: {
    name: 'Valdivia 1960',
    note: 'Largest instrumentally recorded earthquake (Mw 9.5). Chilean subduction megathrust; Pacific-wide tsunami (Cifuentes 1989, JGR 94: 665).',
    input: {
      magnitude: 9.5,
      depth: m(33_000),
      faultType: 'reverse',
      subductionInterface: true,
      // Chile Trench strikes ≈ 10° (almost due N–S), 1000 km rupture
      // from Concepción south to the Taitao Peninsula.
      strikeAzimuthDeg: 10,
      // Five years before the Pacific warning system, which this
      // earthquake and the 1964 Alaska one are the reason for.
      warningIssueS: Number.POSITIVE_INFINITY,
    } satisfies EarthquakeScenarioInput,
  },
  /** Great Alaska earthquake, 27 March 1964 — Mw 9.2, Aleutian
   *  megathrust, ≈ 700 km rupture, 5–11 m of interface slip. Second-
   *  largest recorded earthquake. Triggered the most damaging tsunami
   *  in North-American history (10 m runup at Valdez AK, 4.5 m at
   *  Crescent City CA). Reference: Plafker (1965) "Tectonic
   *  deformation associated with the 1964 Alaska earthquake."
   *  Science 148 (3678): 1675–1687. DOI: 10.1126/science.148.3678.1675. */
  ALASKA_1964: {
    name: 'Great Alaska 1964',
    note: 'Mw 9.2 megathrust, Good Friday earthquake — Plafker 1965, Science 148: 1675. 10 m tsunami runup at Valdez; the simulator reproduces the basin-crossing wave train.',
    input: {
      magnitude: 9.2,
      depth: m(25_000),
      faultType: 'reverse',
      subductionInterface: true,
      // Aleutian Megathrust strike ≈ 245° (W-SW from Prince William
      // Sound to Kodiak), Plafker 1965 Fig. 2.
      strikeAzimuthDeg: 245,
      // A year before the Pacific warning system existed.
      warningIssueS: Number.POSITIVE_INFINITY,
    } satisfies EarthquakeScenarioInput,
  },
  /** L'Aquila, Italy — 6 April 2009. Mw 6.3 normal-fault earthquake
   *  on the Paganica fault, central Apennines. Hypocentre ≈ 9 km;
   *  309 fatalities, ≈ 60 000 displaced; one of the most extensively
   *  instrumented Italian crustal events. Notable for the criminal-
   *  trial controversy over earthquake-prediction communication.
   *  Reference: Chiarabba et al. (2009) "The 2009 L'Aquila (central
   *  Italy) MW 6.3 earthquake: main shock and aftershocks."
   *  Geophys. Res. Lett. 36, L18308. DOI: 10.1029/2009GL039627. */
  L_AQUILA_2009: {
    name: "L'Aquila 2009",
    note: 'Mw 6.3 normal-fault rupture, central Apennines — Chiarabba et al. 2009, GRL 36: L18308. Reference Italian crustal event.',
    input: {
      magnitude: 6.3,
      depth: m(9_000),
      faultType: 'normal',
    } satisfies EarthquakeScenarioInput,
  },
  /** Amatrice (Norcia sequence), Italy — 24 August 2016. Mw 6.2
   *  normal-fault earthquake on the Mt Vettore-Laga system, central
   *  Apennines. Followed by the Mw 6.6 Norcia event on 30 October
   *  (the largest Italian earthquake since Irpinia 1980). The August
   *  shock killed 299, the sequence destroyed Amatrice and Accumoli.
   *  Reference: Chiaraluce et al. (2017) "The 2016 Central Italy
   *  Seismic Sequence." Seismol. Res. Lett. 88 (3): 757–771.
   *  DOI: 10.1785/0220160221. */
  AMATRICE_2016: {
    name: 'Amatrice 2016',
    note: 'Mw 6.2 normal-fault rupture, Mt Vettore-Laga system — Chiaraluce et al. 2017, SRL 88: 757. First main shock of the 2016 central-Italy sequence.',
    input: {
      magnitude: 6.2,
      depth: m(8_000),
      faultType: 'normal',
    } satisfies EarthquakeScenarioInput,
  },
  /** Gorkha (Nepal) earthquake — 25 April 2015. Mw 7.8 on the Main
   *  Himalayan Thrust beneath the Lesser Himalaya, ≈ 150 km rupture
   *  with 3–6 m of slip. ≈ 9 000 fatalities, severe damage in
   *  Kathmandu valley; followed by the Mw 7.3 Dolakha aftershock on
   *  12 May. Reference: Avouac et al. (2015) "Lower edge of locked
   *  Main Himalayan Thrust unzipped by the 2015 Gorkha earthquake."
   *  Nat. Geosci. 8 (9): 708–711. DOI: 10.1038/ngeo2518. */
  NEPAL_2015: {
    name: 'Nepal Gorkha 2015',
    note: 'Mw 7.8 megathrust rupture, Main Himalayan Thrust — Avouac et al. 2015, Nat. Geosci. 8: 708. Continental thrust without a tsunami branch.',
    input: {
      magnitude: 7.8,
      depth: m(8_000),
      faultType: 'reverse',
      // Main Himalayan Thrust strikes ≈ 290° (WNW–ESE) along the
      // arc; rupture propagated ~150 km eastward (Avouac 2015 Fig. 2).
      strikeAzimuthDeg: 290,
    } satisfies EarthquakeScenarioInput,
  },
} as const;

export type EarthquakePresetId = keyof typeof EARTHQUAKE_PRESETS;
