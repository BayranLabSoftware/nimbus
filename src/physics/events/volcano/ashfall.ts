import { ussaDensity } from '../../atmosphere/ussa1976.js';
import { STANDARD_GRAVITY } from '../../constants.js';
import type { Meters, SquareMeters } from '../../units.js';
import { m, sqm } from '../../units.js';
import { prepareTephra2Deposit, tephra2Field, type Tephra2Eruption } from './tephra2Fallout.js';

/**
 * Wind-advected tephra fallout model — a closed-form advection model
 * built on the Suzuki (1983) release profile. Given a Plinian plume
 * height, a vertical release-height
 * profile, a set of particle size classes with Ganser (1993) terminal
 * velocities, and a constant wind vector, the model returns the ground
 * deposit thickness at an arbitrary (downwind, crosswind) point and
 * derives a 1-mm isopach footprint.
 *
 * This is not a full-blown ATM (HYSPLIT / PUFF / FALL3D). It is a
 * closed-form analytical envelope that reproduces the right
 * qualitative features — elongated downwind lobe, crosswind Gaussian
 * spread, coarse fraction deposited near the vent, fine ash carried
 * hundreds of kilometres — with zero I/O and full determinism. The
 * output is suitable for headline educational display; real hazard
 * mapping still needs HYSPLIT or equivalent.
 *
 * References:
 *   Suzuki, T. (1983). "A theoretical model for dispersion of tephra."
 *    In Arc Volcanism: Physics and Tectonics (Shimozuru & Yokoyama,
 *    eds.), Terra Scientific Publishing, Tokyo, pp. 95–113.
 *    The release-height distribution — here in the two-parameter
 *    form f(z) = S₀·((1-z/H)·exp(A(z/H-1)))^λ of Pfeiffer, Costa &
 *    Macedonio (2005), JVGR 140, 273–294, DOI:
 *    10.1016/j.jvolgeores.2004.09.001, with A = 4 and λ = 1.
 *   Bonadonna, C. & Phillips, J. C. (2003). "Sedimentation from
 *    strong volcanic plumes." Journal of Geophysical Research
 *    108 (B7), 2340. DOI: 10.1029/2002JB002034. Background on plume
 *    sedimentation; the crosswind closure below is Nimbus's own.
 *   Ganser, G. H. (1993). "A rational approach to drag prediction
 *    of spherical and nonspherical particles." Powder Technology
 *    77 (2): 143–152. DOI: 10.1016/0032-5910(93)80051-B.
 *   Pyle, D. M. (1989). "The thickness, volume and grainsize of
 *    tephra fall deposits." Bulletin of Volcanology 51 (1): 1–15.
 *    (used for the deposit → isopach area sanity check).
 *
 * Coordinate convention: origin at the vent, +x aligned with the
 * wind direction (downwind), +y is crosswind. All ranges in metres.
 */

/** Atmospheric kinematic viscosity near the tropopause. Sutherland's
 *  formula gives a slow temperature dependence; the popular-science
 *  ash-settling envelope is dominated by density variation, so we
 *  hold viscosity constant and let {@link ussaDensity} carry the
 *  altitude profile. */
const TROPOPAUSE_AIR_VISCOSITY = 1.5e-5; // m²/s
/** Tephra particle density (vesicular pumice mean). */
const TEPHRA_DENSITY = 1_000; // kg/m³
/** Suzuki column peak-release parameter (A in the Pfeiffer et al.
 *  2005 form) — higher values concentrate release near the plume top.
 *  4 is a project choice. */
export const SUZUKI_LAMBDA = 4;
/** Suzuki column exponent (λ in the Pfeiffer et al. 2005 form), 1. */
export const SUZUKI_K = 1;
/** Along-wind Gaussian source-scale factor. σ_x = ALONG_WIND_SOURCE ·
 *  plumeHeight and does NOT grow with wind, because the spread along
 *  the wind direction is set by the vertical thickness of the source
 *  column (Suzuki 1983 §5). Fixing σ_x is what lets stronger winds
 *  extend the 1-mm isopach downwind instead of diluting it. */
export const ALONG_WIND_SOURCE_FACTOR = 0.5;
/** Crosswind Gaussian turbulent-diffusion factor. σ_y(x) grows as
 *  √(1 + x / (diffusion length)) — a Pasquill-Gifford-INSPIRED
 *  neutral-stability growth (the √-form resembles, but is not, the
 *  literal PG D-class σ_y curve). CROSSWIND_BASE · H is the initial
 *  source width; CROSSWIND_DIFFUSION_SCALE is the downwind distance
 *  at which σ_y has doubled from source width. */
export const CROSSWIND_BASE_FACTOR = 0.3;
export const CROSSWIND_DIFFUSION_SCALE_OVER_H = 10;

/**
 * Which law spreads a release across the wind (rule 107 of
 * validation/ashRules.ts).
 *
 * `project` is the closure above: a spread that grows with the downwind
 * distance and the plume height, and with nothing else. Every grain class
 * therefore spreads alike, and the fine ash that an advection-diffusion model
 * carries for hundreds of kilometres spreads here no more than a lapillus.
 *
 * `tephra2` is the closure Tephra2 uses (Connor & Connor 2006, on Bonadonna
 * et al. 2005 and Suzuki 1983), read from its own source: a release's spread
 * grows with the time that release spends falling, so a small particle that
 * takes a day to reach the ground spreads far more than a large one that
 * takes a minute.
 */
export type AshSpreadLaw = 'project' | 'tephra2';

/**
 * What a scenario that names no law draws: Tephra2's closure, adopted on 16
 * September 2026 by rule 112 of validation/ashRules.ts.
 *
 * It took two rounds, and the first one refused it. Rule 108 asked that rule
 * 19's invariants come back "no worse than the 221 failures of 16 September"
 * and the sweep read 222 — a count that had been taken three rounds earlier,
 * before the burn and radiation rounds changed the explosion's own physics, so
 * the extra failure was a radiation ring this file cannot reach. Every figure
 * of the comparison had improved and the candidate was refused anyway, because
 * a bound is not loosened after a figure has failed it.
 *
 * Rules 110 to 113 then put the same candidate — unchanged to the constant,
 * and `ashRules.test.ts` pins each one — to a baseline that measures the
 * candidate rather than the calendar: the sweep under the law in place, and
 * the sweep again with the candidate in place. Both read 222. The refusal
 * stands as its own round's verdict; this is the law the model draws.
 */
export const DEFAULT_ASH_SPREAD: AshSpreadLaw = 'tephra2';

/**
 * Which model lays the deposit (rules 158 to 161 of validation/tephra2Rules.ts).
 *
 * `closed-form` is this file's own: four grain classes, a Suzuki release and
 * one Gaussian per class and level, with the spread law above.
 *
 * `program` is the forward model of Tephra2, the field's program for tephra
 * fall, in `tephra2Fallout.ts`, given the parameters the campaign's reference
 * run gave it for Nimbus's eruptions ({@link programEruption}). The footprint
 * read off it keeps this file's definitions: the farthest point on the axis
 * above the threshold, the widest half-width, and the ellipse of the two.
 */
export type AshDepositModel = 'closed-form' | 'program';

/** What a scenario that names no deposit model draws. */
export const DEFAULT_ASH_DEPOSIT_MODEL: AshDepositModel = 'closed-form';

/** Tephra2's own example configuration, the one its Colima inversion left and
 *  the one the reference runs on (docs/TEPHRA2_SETUP.md). The eddy constant
 *  is in m²/s^(5/2), the diffusion coefficient in m²/s, the threshold in s. */
export const TEPHRA2_EDDY_CONSTANT = 0.04;
export const TEPHRA2_DIFFUSION_COEFFICIENT = 5_138;
export const TEPHRA2_FALL_TIME_THRESHOLD_S = 288;

/**
 * The Gaussian spread (m) diffusion gives a release that fell for `fallTimeS`
 * from `heightAboveVentM`, as `tephra2_calc.c` computes it.
 *
 * Tephra2 carries a quantity it calls sigma and uses as exp(−r²/σ) over
 * π·σ — so its σ is twice the square of a Gaussian's, and what comes back
 * here is √(σ/2). Above the fall-time threshold the spread is the fine-particle
 * branch, σ = (8/5)·C·(t + t_f)^(5/2) with t_f = (0.2·h²)^(2/5); below it the
 * coarse branch, σ = 4·K·(t + t_c) with t_c = 0.0032·h²/K. The factor 8/5 is
 * applied to the eddy constant when Tephra2 loads its configuration, and is
 * written out here rather than hidden in a constant.
 */
export function tephra2DiffusionSigmaM(fallTimeS: number, heightAboveVentM: number): number {
  const t = Math.max(fallTimeS, 0);
  const h = Math.max(heightAboveVentM, 0);
  const sigma =
    t >= TEPHRA2_FALL_TIME_THRESHOLD_S
      ? (8 / 5) * TEPHRA2_EDDY_CONSTANT * (t + Math.pow(0.2 * h * h, 0.4)) ** 2.5
      : 4 * TEPHRA2_DIFFUSION_COEFFICIENT * (t + (0.0032 * h * h) / TEPHRA2_DIFFUSION_COEFFICIENT);
  return Math.sqrt(Math.max(sigma, 0) / 2);
}

/**
 * Particle size class definition. Diameter is the representative
 * diameter of the class (m), massFraction the share of the total
 * ejecta volume this class carries. The default four-class split
 * below — 40 % coarse, 30 % medium, 20 % fine, 10 % very fine — is a
 * project choice, not a fit from Pyle (1989).
 */
export interface GrainSizeClass {
  /** Representative diameter (m). */
  diameter: number;
  /** Fraction of the total deposit mass carried by this class, [0, 1]. */
  massFraction: number;
}

export const DEFAULT_GRAIN_SPECTRUM: GrainSizeClass[] = [
  { diameter: 8e-3, massFraction: 0.4 }, // 8 mm lapilli / coarse ash
  { diameter: 1e-3, massFraction: 0.3 }, // 1 mm coarse ash
  { diameter: 125e-6, massFraction: 0.2 }, // 125 µm medium ash
  { diameter: 32e-6, massFraction: 0.1 }, // 32 µm fine ash
];

/**
 * Ganser (1993) terminal fall velocity for a spherical particle in a
 * Newtonian fluid. Combines Stokes (Re < 1) and Newton (Re > 1000)
 * regimes via a continuous drag coefficient. Spherical assumption is
 * a first-order approximation; real tephra drag coefficients differ
 * by up to 50 % due to irregular shapes — absorbed in the overall
 * ±factor-2 uncertainty budget on the ashfall map.
 */
export function ganserTerminalVelocity(
  diameter: number,
  particleDensity: number = TEPHRA_DENSITY,
  // Default at the USSA-76 tropopause base (≈ 0.36 kg/m³) — the
  // altitude band where most Plinian fall deposits drift before
  // settling. Replaces the previous hard-coded 0.4 kg/m³ constant.
  airDensity: number = ussaDensity(11_000),
  airKinematicViscosity: number = TROPOPAUSE_AIR_VISCOSITY,
  surfaceGravity: number = STANDARD_GRAVITY
): number {
  if (!Number.isFinite(diameter) || diameter <= 0) return 0;
  const g = surfaceGravity;
  const d = diameter;
  const rhoP = particleDensity;
  const rhoA = airDensity;
  const nu = airKinematicViscosity;

  // Stokes law for starting guess: v = g·d²·(ρ_p − ρ_a) / (18·ρ_a·ν).
  let v = (g * d * d * (rhoP - rhoA)) / (18 * rhoA * nu);

  // Iterate 8× against the Ganser drag law to converge for any Re.
  for (let i = 0; i < 8; i++) {
    const Re = Math.max((v * d) / nu, 1e-6);
    // Ganser 1993 Eq. 18 (spherical): Cd = 24/Re·(1+0.1118·Re^0.6567) + 0.4305/(1+3305/Re)
    const Cd = (24 / Re) * (1 + 0.1118 * Math.pow(Re, 0.6567)) + 0.4305 / (1 + 3_305 / Re);
    v = Math.sqrt((4 * g * d * (rhoP - rhoA)) / (3 * Cd * rhoA));
  }
  return v;
}

export interface AshDepositInput {
  /** Plume height above the vent (m). */
  plumeHeight: Meters;
  /** Total bulk ejecta volume (m³) carried as fall deposit. */
  totalEjectaVolume: number;
  /** Downwind distance from vent (m). */
  downwindDistance: number;
  /** Crosswind distance from plume axis (m). */
  crosswindDistance: number;
  /** Horizontal wind speed (m/s). Must be > 0 for advection to occur. */
  windSpeed: number;
  /** Grain-size spectrum. Defaults to the Pyle 1989 4-class fit. */
  grainSpectrum?: GrainSizeClass[];
  /** Bulk deposit density (kg/m³). Defaults to 1 000 (loose tephra). */
  depositDensity?: number;
  /** Which law spreads a release (rule 107 of validation/ashRules.ts).
   *  Omitted, {@link DEFAULT_ASH_SPREAD}. */
  spreadLaw?: AshSpreadLaw;
  /** Which model lays the deposit. Omitted, {@link DEFAULT_ASH_DEPOSIT_MODEL}. */
  depositModel?: AshDepositModel;
}

/**
 * The eruption Tephra2 is given for one of Nimbus's: the parameters
 * `scripts/benchmark/tephra2-reference.ts` gave it on 15 September 2026, which
 * is what the report's ash comparison reads against. The vent stands a
 * millimetre above the datum, where the program has an answer, and so do the
 * points; the plume top is the vent plus Mastin et al.'s height; the mass is
 * the bulk volume at the deposit density; the grain sizes are Nimbus's classes
 * as a normal distribution in φ, to five decimals; the rest is Tephra2's own
 * example, with a hundred steps each way.
 */
export function programEruption(input: {
  plumeHeight: Meters;
  totalEjectaVolume: number;
  grainSpectrum?: GrainSizeClass[];
  depositDensity?: number;
}): Tephra2Eruption {
  const spectrum = input.grainSpectrum ?? DEFAULT_GRAIN_SPECTRUM;
  const phis = spectrum.map((g) => -Math.log2(g.diameter * 1_000));
  const total = spectrum.reduce((a, g) => a + g.massFraction, 0);
  const mean = spectrum.reduce((a, g, i) => a + g.massFraction * (phis[i] ?? 0), 0) / total;
  const variance =
    spectrum.reduce((a, g, i) => a + g.massFraction * ((phis[i] ?? 0) - mean) ** 2, 0) / total;
  const five = (x: number): number => Number(x.toFixed(5));
  return {
    ventElevationM: PROGRAM_VENT_ELEVATION_M,
    plumeTopElevationM: PROGRAM_VENT_ELEVATION_M + (input.plumeHeight as number),
    massKg: input.totalEjectaVolume * (input.depositDensity ?? TEPHRA_DENSITY),
    coarsestPhi: -7,
    finestPhi: 7,
    medianPhi: five(mean),
    sigmaPhi: five(Math.sqrt(variance)),
    releaseAlpha: 1.04487,
    releaseBeta: 1.46425,
    eddyConstant: TEPHRA2_EDDY_CONSTANT,
    diffusionCoefficientM2S: TEPHRA2_DIFFUSION_COEFFICIENT,
    fallTimeThresholdS: TEPHRA2_FALL_TIME_THRESHOLD_S,
    lithicDensityKgM3: 2_700,
    pumiceDensityKgM3: 1_000,
    columnSteps: 100,
    grainSteps: 100,
  };
}

/** Where the program model puts the vent and the points (m above sea level). */
export const PROGRAM_VENT_ELEVATION_M = 0.001;

/** The program's deposit as a function of the downwind and crosswind distances
 *  (m) from the vent, for a wind constant with height. */
function programDeposit(
  input: Omit<AshDepositInput, 'downwindDistance' | 'crosswindDistance'>
): ((downwind: number, crosswind: number) => number) | null {
  const H = input.plumeHeight as number;
  const V = input.totalEjectaVolume;
  const u = input.windSpeed;
  if (!Number.isFinite(H) || H <= 0) return null;
  if (!Number.isFinite(V) || V <= 0) return null;
  if (!Number.isFinite(u) || u < 0) return null;
  const eruption = programEruption({
    plumeHeight: input.plumeHeight,
    totalEjectaVolume: V,
    ...(input.grainSpectrum !== undefined ? { grainSpectrum: input.grainSpectrum } : {}),
    ...(input.depositDensity !== undefined ? { depositDensity: input.depositDensity } : {}),
  });
  // Blowing towards the east at every height, so that east is downwind.
  const wind = [
    { heightM: 0, speedMS: u, towardDeg: 90 },
    { heightM: eruption.plumeTopElevationM + 1_000, speedMS: u, towardDeg: 90 },
  ];
  const field = tephra2Field(prepareTephra2Deposit(eruption, wind), PROGRAM_VENT_ELEVATION_M);
  return (downwind, crosswind) => field(crosswind, downwind);
}

/**
 * Suzuki 1983 vertical-release weighting at fractional height
 * z̃ = z / H. Normalised numerically so ∫f(z̃) dz̃ = 1 over [0, 1].
 *
 *   f(z̃) = A · [(1 − z̃) · exp(λ · (z̃ − 1))]^k
 *
 * The factor A is computed by trapezoidal integration below.
 */
function suzukiWeight(zTilde: number): number {
  if (zTilde < 0 || zTilde > 1) return 0;
  const base = (1 - zTilde) * Math.exp(SUZUKI_LAMBDA * (zTilde - 1));
  return Math.pow(Math.max(base, 0), SUZUKI_K);
}

/** Pre-computed normalisation constant for {@link suzukiWeight}. */
const SUZUKI_NORMALISATION = (() => {
  const N = 256;
  let sum = 0;
  for (let i = 0; i < N; i++) {
    const z = (i + 0.5) / N;
    sum += suzukiWeight(z);
  }
  return 1 / (sum / N); // so ∫ normalised f dz̃ = 1
})();

/**
 * Deposit mass loading (kg/m²) at the point (downwindDistance,
 * crosswindDistance) from the vent, summed over the full grain-size
 * spectrum and the Suzuki release-height profile.
 *
 * Each (grain class, release height) pair deposits its mass at the
 * downwind range where the fall time at that height equals the wind
 * advection time — a lateral Gaussian spreads the mass crosswind with
 * σ_y(x) = max(H·{@link CROSSWIND_BASE_FACTOR}, 500 m)·√(1 + x/L_diff),
 * a sub-linear turbulent-diffusion growth (NOT the older σ_y = 0.2·x
 * isopach-aspect form — that comment was stale; the √-growth is what is
 * actually computed below).
 */
export function ashfallMassLoading(input: AshDepositInput): number {
  const x = input.downwindDistance;
  if (!Number.isFinite(x)) return 0;
  if ((input.depositModel ?? DEFAULT_ASH_DEPOSIT_MODEL) === 'program') {
    return programDeposit(input)?.(x, input.crosswindDistance) ?? 0;
  }
  return loadingAt(depositPieces(input), x, input.crosswindDistance);
}

/** One (grain class, release height) pair of the deposit: its mass and
 *  the Gaussian it lands in. */
interface DepositPiece {
  /** Mass of the class times the release weight (kg). */
  mass: number;
  /** Downwind centre of the landing (m). */
  xCentre: number;
  sigmaX: number;
  sigmaY: number;
  /** 2π σ_x σ_y. */
  denominator: number;
}

/**
 * The pieces {@link ashfallMassLoading} sums, computed once for an
 * eruption: a search along the deposit asks for thousands of points, and
 * the terminal velocities and release weights do not change between them.
 * Empty where the eruption deposits nothing.
 */
function depositPieces(
  input: Omit<AshDepositInput, 'downwindDistance' | 'crosswindDistance'>
): DepositPiece[] {
  const H = input.plumeHeight as number;
  const V = input.totalEjectaVolume;
  const u = input.windSpeed;
  if (!Number.isFinite(H) || H <= 0) return [];
  if (!Number.isFinite(V) || V <= 0) return [];
  if (!Number.isFinite(u) || u <= 0) return [];

  const depositDensity = input.depositDensity ?? TEPHRA_DENSITY;
  const totalMass = V * depositDensity;
  const spectrum = input.grainSpectrum ?? DEFAULT_GRAIN_SPECTRUM;
  const spreadLaw = input.spreadLaw ?? DEFAULT_ASH_SPREAD;

  // Integrate over N_z release-height points and sum grain classes.
  const N_z = 24;
  const pieces: DepositPiece[] = [];
  for (const grain of spectrum) {
    const vt = ganserTerminalVelocity(grain.diameter);
    if (vt <= 0) continue;
    const massClass = totalMass * grain.massFraction;
    for (let i = 0; i < N_z; i++) {
      const zTilde = (i + 0.5) / N_z;
      const z = zTilde * H;
      const weight = (suzukiWeight(zTilde) * SUZUKI_NORMALISATION) / N_z;
      const fallTime = z / vt;
      const xCentre = u * fallTime;
      // Along-wind σ is set by the source-column vertical extent (not
      // by wind speed or downwind range). This is what lets stronger
      // winds extend the isopach downwind instead of diluting it.
      const sourceX = Math.max(H * ALONG_WIND_SOURCE_FACTOR, 500);
      const sourceY = Math.max(H * CROSSWIND_BASE_FACTOR, 500);
      // Crosswind σ grows sub-linearly with downwind range via a
      // Pasquill-Gifford-style diffusion term.
      const diffusionScale = H * CROSSWIND_DIFFUSION_SCALE_OVER_H;
      // Under Tephra2's closure the spread a release earns comes from the time
      // it spent falling, it is the same across the wind and along it, and it
      // is not added to the source's own size: the diffusion time already
      // carries the plume's extent, so adding it again counts it twice.
      const spread = spreadLaw === 'tephra2' ? tephra2DiffusionSigmaM(fallTime, z) : 0;
      const sigmaX = spreadLaw === 'tephra2' ? spread : sourceX;
      const sigmaY =
        spreadLaw === 'tephra2'
          ? spread
          : sourceY * Math.sqrt(1 + xCentre / Math.max(diffusionScale, 1));
      pieces.push({
        mass: massClass * weight,
        xCentre,
        sigmaX,
        sigmaY,
        denominator: 2 * Math.PI * sigmaX * sigmaY,
      });
    }
  }
  return pieces;
}

/** Mass loading (kg/m²) of the pieces at (x, y). */
function loadingAt(pieces: readonly DepositPiece[], x: number, y: number): number {
  if (x <= 0) return 0; // upwind of the vent — no deposit
  let loading = 0;
  for (const piece of pieces) {
    const dx = (x - piece.xCentre) / piece.sigmaX;
    const dy = y / piece.sigmaY;
    const lateral = Math.exp(-(dx * dx + dy * dy) / 2);
    // Per-cell deposit: mass_slice · lateral_Gauss / (2π σ_x σ_y).
    loading += (piece.mass * lateral) / piece.denominator;
  }
  return loading; // kg/m²
}

/**
 * Convert a mass loading (kg/m²) to a deposit thickness (m) using
 * the bulk density. Default 1 000 kg/m³ is Pyle 1989's median value
 * for compacted-but-uncemented Plinian fall units.
 */
export function massLoadingToThickness(
  loading: number,
  depositDensity: number = TEPHRA_DENSITY
): number {
  if (!Number.isFinite(loading) || loading <= 0) return 0;
  return loading / depositDensity;
}

export interface AshFootprintInput {
  /** Plume height above the vent (m). */
  plumeHeight: Meters;
  /** Total bulk ejecta volume (m³) carried as fall deposit. */
  totalEjectaVolume: number;
  /** Horizontal wind speed (m/s). */
  windSpeed: number;
  /** Threshold thickness for the isopach (m). Defaults to 1 mm. */
  thicknessThreshold?: Meters;
  /** Grain-size spectrum. Defaults to the Pyle 1989 4-class fit. */
  grainSpectrum?: GrainSizeClass[];
  /** Bulk deposit density (kg/m³). Defaults to 1 000. */
  depositDensity?: number;
  /** Which law spreads a release (rule 107 of validation/ashRules.ts).
   *  Omitted, {@link DEFAULT_ASH_SPREAD} — which is what a scenario draws and
   *  what the invariants sweep reads. It is named here so the footprint can be
   *  scored under either law, as the deposit already could. */
  spreadLaw?: AshSpreadLaw;
  /** Which model lays the deposit. Omitted, {@link DEFAULT_ASH_DEPOSIT_MODEL}. */
  depositModel?: AshDepositModel;
}

export interface AshFootprint {
  /** Downwind extent of the threshold isopach (m). */
  downwindRange: Meters;
  /** Maximum crosswind half-width of the threshold isopach (m). */
  crosswindHalfWidth: Meters;
  /** Downwind position of maximum crosswind half-width (m). */
  widestPointDownwind: Meters;
  /** Enclosed area (m²). Approximated as an ellipse with axes equal
   *  to the downwind extent and twice the crosswind half-width. */
  area: SquareMeters;
}

/**
 * Compute the wind-advected 1-mm isopach footprint of a Plinian
 * ashfall: how far downwind the deposit stays above the threshold, and
 * how wide it gets across the wind.
 *
 * Along the wind the deposit is a row of bands — the coarse classes land
 * near the vent, the finest thousands of kilometres out — with the loading
 * falling below the threshold between them. The downwind edge is the far
 * side of the farthest band above the threshold, found by walking the
 * axis in steps of half the along-wind spread (a band cannot hide
 * between two samples) out to six spreads past the farthest landing
 * centre, and refined by bisection inside the last step; a band above
 * the threshold that lands past 5 000 km puts the edge at 5 000 km. The
 * width is measured where the bands are widest, at their landing
 * centres, as well as at 24 points along the reach. Until 15
 * September 2026 the edge was a bisection over the whole axis, which
 * lands on whichever band edge it meets: 1 % more tephra could move the
 * reach from 5 000 km to 4 070 km, and a reach at the 5 000 km bracket
 * came with no width and no area (B-029).
 */
export function ashFootprint(input: AshFootprintInput): AshFootprint {
  const threshold = (input.thicknessThreshold ?? m(1e-3)) as number;
  const depositDensity = input.depositDensity ?? TEPHRA_DENSITY;
  const loadingThreshold = threshold * depositDensity;
  const empty: AshFootprint = {
    downwindRange: m(0),
    crosswindHalfWidth: m(0),
    widestPointDownwind: m(0),
    area: sqm(0),
  };

  if (input.windSpeed <= 0 || input.totalEjectaVolume <= 0) return empty;
  if ((input.depositModel ?? DEFAULT_ASH_DEPOSIT_MODEL) === 'program') {
    const deposit = programDeposit(input);
    return deposit === null ? empty : programFootprint(deposit, loadingThreshold);
  }
  const pieces = depositPieces({
    plumeHeight: input.plumeHeight,
    totalEjectaVolume: input.totalEjectaVolume,
    windSpeed: input.windSpeed,
    ...(input.grainSpectrum !== undefined ? { grainSpectrum: input.grainSpectrum } : {}),
    ...(input.depositDensity !== undefined ? { depositDensity: input.depositDensity } : {}),
    ...(input.spreadLaw !== undefined ? { spreadLaw: input.spreadLaw } : {}),
  });
  if (pieces.length === 0) return empty;

  const atAxis = (x: number): number => loadingAt(pieces, x, 0);
  const reachLimit = 5_000_000; // 5 000 km, the farthest the footprint reports
  const spread = Math.min(...pieces.map((p) => p.sigmaX));
  const farthestCentre = Math.max(...pieces.map((p) => p.xCentre));
  const scanEnd = Math.min(reachLimit, farthestCentre + 6 * spread);
  const samples = Math.min(50_000, Math.max(64, Math.ceil(scanEnd / (spread / 2))));
  const step = scanEnd / samples;
  // Sample positions are counted in steps, not accumulated, so the step
  // after the last one above the threshold is exactly the next sample.
  let lastAboveStep = 0;
  for (let i = 1; i <= samples; i++) {
    if (atAxis(i * step) >= loadingThreshold) lastAboveStep = i;
  }
  const lastAbove = lastAboveStep * step;
  // A band that lands past the limit, above the threshold, reaches the limit.
  const pastLimit = pieces.some(
    (p) => p.xCentre > reachLimit && atAxis(p.xCentre) >= loadingThreshold
  );

  // A band whose peak only just clears the threshold can sit between two
  // samples; its landing centre cannot, and it moves with the band.
  const centresAbove = pieces
    .map((p) => p.xCentre)
    .filter((x) => x > 0 && x <= reachLimit && atAxis(x) >= loadingThreshold);
  const farthestCentreAbove = centresAbove.length > 0 ? Math.max(...centresAbove) : 0;

  let downwindRange: number;
  if (pastLimit || lastAbove >= reachLimit) {
    downwindRange = reachLimit;
  } else if (lastAbove <= 0 && farthestCentreAbove <= 0) {
    return empty;
  } else {
    // The edge lies past the last point found above the threshold and
    // before the next sample, which was below it.
    let lo = lastAbove;
    let hi = (lastAboveStep + 1) * step;
    if (farthestCentreAbove > lastAbove) {
      lo = farthestCentreAbove;
      const next = Math.floor(farthestCentreAbove / step) + 1;
      hi = (next * step > farthestCentreAbove ? next : next + 1) * step;
    }
    for (let i = 0; i < 40; i++) {
      const mid = 0.5 * (lo + hi);
      if (atAxis(mid) >= loadingThreshold) lo = mid;
      else hi = mid;
    }
    // The bracket's upper end can sit past the limit — it is the next sample
    // after the farthest release centre above the threshold — so the solved
    // edge is held to the limit this function says it reports. Without it a
    // footprint could come back at 5 000.26 km where the limit is 5 000, and
    // a larger eruption capped at exactly 5 000 then read as smaller: one
    // failure of rule 19's monotonicity on 16 September 2026.
    downwindRange = Math.min(0.5 * (lo + hi), reachLimit);
  }

  // The crosswind half-width, at 24 points along the reach and at every
  // landing centre above the threshold — where a band is widest — so a
  // band between two of the 24 is not missed, and a band carried past the
  // 5 000 km limit still counts for how wide the deposit gets.
  const stations = [
    ...Array.from({ length: 24 }, (_, i) => ((i + 1) / 24) * downwindRange),
    ...pieces.map((p) => p.xCentre).filter((x) => x > 0 && atAxis(x) >= loadingThreshold),
  ];
  let maxHalfWidth = 0;
  let widestX = 0;
  for (const x of stations) {
    // Bisection in y.
    let yLo = 0;
    let yHi = Math.max(downwindRange * 0.5, 5_000);
    const atXY = (y: number): number => loadingAt(pieces, x, y);
    if (atXY(yHi) >= loadingThreshold) {
      // widen
      yHi = downwindRange * 2;
    }
    if (atXY(yLo) < loadingThreshold) continue;
    for (let j = 0; j < 30; j++) {
      const mid = 0.5 * (yLo + yHi);
      if (atXY(mid) >= loadingThreshold) yLo = mid;
      else yHi = mid;
    }
    const halfWidth = 0.5 * (yLo + yHi);
    if (halfWidth > maxHalfWidth) {
      maxHalfWidth = halfWidth;
      widestX = x;
    }
  }

  // Ellipse area approximation: π · (downwindRange/2) · crosswindHalfWidth.
  const area = Math.PI * (downwindRange / 2) * maxHalfWidth;

  return {
    downwindRange: m(downwindRange),
    crosswindHalfWidth: m(maxHalfWidth),
    widestPointDownwind: m(widestX),
    area: sqm(area),
  };
}

/**
 * The footprint of the program's deposit, with this file's definitions: the
 * downwind edge is the farthest point on the axis above the threshold, found
 * on a geometric row of 240 points from 10 m to the 5 000 km limit and refined
 * by bisection; the half-width is the widest the deposit gets across the wind,
 * searched at 32 stations along the reach and refined around the widest by a
 * golden-section search; the area is the ellipse of the two. Each search stops
 * at a part in ten million of what it measures.
 */
const PRECISION = 1e-7;

function programFootprint(
  deposit: (downwind: number, crosswind: number) => number,
  threshold: number
): AshFootprint {
  const empty: AshFootprint = {
    downwindRange: m(0),
    crosswindHalfWidth: m(0),
    widestPointDownwind: m(0),
    area: sqm(0),
  };
  const reachLimit = 5_000_000;
  const onAxis = (x: number): number => deposit(x, 0);
  const samples = 240;
  const row = Array.from(
    { length: samples },
    (_, k) => 10 * Math.pow(reachLimit / 10, k / (samples - 1))
  );
  let last = -1;
  for (let k = 0; k < samples; k++) if (onAxis(row[k] ?? 0) >= threshold) last = k;
  if (last < 0) return empty;

  let downwindRange: number;
  if (last === samples - 1) {
    downwindRange = reachLimit;
  } else {
    let lo = row[last] ?? 0;
    let hi = row[last + 1] ?? reachLimit;
    while (hi - lo > PRECISION * hi) {
      const mid = 0.5 * (lo + hi);
      if (onAxis(mid) >= threshold) lo = mid;
      else hi = mid;
    }
    downwindRange = 0.5 * (lo + hi);
  }

  const halfWidthAt = (x: number): number => {
    if (onAxis(x) < threshold) return 0;
    let lo = 0;
    let hi = Math.max(1_000, 0.05 * downwindRange);
    for (let i = 0; i < 60 && deposit(x, hi) >= threshold; i++) {
      lo = hi;
      hi *= 2;
    }
    while (hi - lo > PRECISION * hi) {
      const mid = 0.5 * (lo + hi);
      if (deposit(x, mid) >= threshold) lo = mid;
      else hi = mid;
    }
    return 0.5 * (lo + hi);
  };
  const stations = 32;
  let best = 0;
  let bestX = 0;
  let bestIndex = 0;
  for (let k = 1; k <= stations; k++) {
    const x = (k / stations) * downwindRange;
    const w = halfWidthAt(x);
    if (w > best) {
      best = w;
      bestX = x;
      bestIndex = k;
    }
  }
  if (best > 0) {
    // Refine between the stations on either side of the widest.
    let a = (Math.max(bestIndex - 1, 0) / stations) * downwindRange;
    let b = (Math.min(bestIndex + 1, stations) / stations) * downwindRange;
    const golden = (Math.sqrt(5) - 1) / 2;
    let c = b - golden * (b - a);
    let d = a + golden * (b - a);
    let wc = halfWidthAt(c);
    let wd = halfWidthAt(d);
    while (b - a > PRECISION * downwindRange) {
      if (wc >= wd) {
        b = d;
        d = c;
        wd = wc;
        c = b - golden * (b - a);
        wc = halfWidthAt(c);
      } else {
        a = c;
        c = d;
        wc = wd;
        d = a + golden * (b - a);
        wd = halfWidthAt(d);
      }
    }
    const x = 0.5 * (a + b);
    const w = halfWidthAt(x);
    if (w > best) {
      best = w;
      bestX = x;
    }
  }
  return {
    downwindRange: m(downwindRange),
    crosswindHalfWidth: m(best),
    widestPointDownwind: m(bestX),
    area: sqm(Math.PI * (downwindRange / 2) * best),
  };
}
