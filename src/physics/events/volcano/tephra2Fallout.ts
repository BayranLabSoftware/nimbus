/**
 * Tephra fall as the field's program computes it: the forward model of Tephra2
 * (Bonadonna, Connor et al. 2005, JGR 110, B03203, DOI 10.1029/2003JB002896;
 * Connor & Connor 2006, "Inversion is the key to dispersion", in Statistics in
 * Volcanology, IAVCEI Publications 1, 231–242), the advection–diffusion model
 * the field runs on isopach maps.
 *
 * Written for Nimbus from the equations those papers give and from what the
 * program does, which was read in its source (GPL-3.0, commit ff621c6) on
 * 16 September 2026 under the rule that the source is read to understand and
 * never transcribed. Rules 158 to 161 of validation/tephra2Rules.ts hold this
 * file to the program's own output.
 *
 * The model, in words.
 *
 * - **Grains.** The erupted mass is spread over `grainSteps` sizes in φ, from
 *   the coarsest to the finest, each size the lower end of its step, weighted
 *   by a normal distribution in φ about the median. A grain of φ is
 *   10⁻³ · 2^(−φ) m across. Its density is the lithic density from φ 7 up, the
 *   pumice density from φ −1 down, and a straight line between.
 * - **Release.** The column is cut into `columnSteps` levels between the vent
 *   and the plume top; the mass released at a level follows a beta
 *   distribution of the height above the vent, as a fraction of the column,
 *   x^(α−1) (1−x)^(β−1). The fraction is carried from level to level by
 *   adding one step each time, and at the top, where it reaches 1, the
 *   distribution is read a thousandth lower.
 * - **Settling.** A grain falls through each level at its terminal speed in
 *   the air at that level's top, of density 1.293 · e^(−z/8 200) kg/m³ and
 *   viscosity 1.8325 × 10⁻⁵ Pa·s: Stokes's law while the Reynolds number is
 *   below 6, the intermediate law of Kunii & Levenspiel below 500, Newton's
 *   law above (Bonadonna, Ernst & Sparks 1998).
 * - **Wind.** The wind blows towards a direction measured from north. Its
 *   speed and direction at each level are interpolated linearly, in degrees,
 *   between the readings above and below; below the lowest reading they are
 *   interpolated towards calm at sea level. A grain drifts, on its way from
 *   its level to the vent's height, by the sum over the levels it crosses of
 *   the time it spends in each and the wind there. Below the vent, down to the
 *   point, it falls through air as dense as at the vent, in the wind of the
 *   vent's level slowed in the ratio of the point's elevation to the vent's.
 * - **Diffusion.** The deposit of a size released at a level is a Gaussian
 *   about where it lands, exp(−r²/S)/(π S), with S = 4 K (t + t_c) for a grain
 *   that falls for less than the fall-time threshold and S = (8/5) C
 *   (t + t_f)^(5/2) for one that falls longer (Suzuki 1983's law for fine
 *   ash), K the diffusion coefficient, C the eddy constant, t the fall time,
 *   and the column's own width carried as the times t_c = 0.0032 h²/K and
 *   t_f = (0.2 h²)^(2/5) at the release height h above the vent.
 *
 * Two things the program does that are kept, because they are what it
 * computes: a mean wind component that comes out exactly zero is taken as
 * 1 mm/s, and a diffusion coefficient below 1 m²/s is taken as 1.
 *
 * One thing it does that is not: where the vent stands at sea level it divides
 * zero by zero and returns no number; this model reads no wind below a vent
 * that has no height.
 */

/** The eruption, as the program's configuration names it. */
export interface Tephra2Eruption {
  /** Vent elevation above sea level (m). */
  ventElevationM: number;
  /** Plume top above sea level (m). */
  plumeTopElevationM: number;
  /** Erupted mass (kg). */
  massKg: number;
  /** The coarsest and finest sizes considered (φ; the coarsest is the smaller number). */
  coarsestPhi: number;
  finestPhi: number;
  /** The grain-size distribution: its median and standard deviation (φ). */
  medianPhi: number;
  sigmaPhi: number;
  /** The shape of the release along the column. */
  releaseAlpha: number;
  releaseBeta: number;
  /** Suzuki's constant for fine ash (as the configuration gives it, before 8/5). */
  eddyConstant: number;
  /** Diffusion coefficient for coarse grains (m²/s). */
  diffusionCoefficientM2S: number;
  /** Fall time past which a grain diffuses as fine ash (s). */
  fallTimeThresholdS: number;
  lithicDensityKgM3: number;
  pumiceDensityKgM3: number;
  columnSteps: number;
  grainSteps: number;
}

/** One reading of the wind: height above sea level (m), speed (m/s), and the
 *  direction it blows towards (degrees clockwise from north). */
export interface WindReading {
  heightM: number;
  speedMS: number;
  towardDeg: number;
}

const GRAVITY = 9.81;
const SEA_LEVEL_AIR_DENSITY = 1.293;
const AIR_DENSITY_SCALE_HEIGHT_M = 8_200;
const AIR_VISCOSITY_PA_S = 1.8325e-5;
const LITHIC_FROM_PHI = 7;
const PUMICE_TO_PHI = -1;
/** How far below the top the release distribution is read (as a fraction). */
const TOP_OFFSET = 0.001;
/** A mean wind component of exactly zero is read as this (m/s). */
const CALM_COMPONENT = 0.001;

/** A grain's terminal speed (m/s) in air of the given density. */
export function tephra2SettlingSpeed(
  diameterM: number,
  grainDensity: number,
  airDensity: number
): number {
  const stokes = (grainDensity * GRAVITY * diameterM * diameterM) / (18 * AIR_VISCOSITY_PA_S);
  const reynolds = (speed: number): number => (diameterM * airDensity * speed) / AIR_VISCOSITY_PA_S;
  if (reynolds(stokes) < 6) return stokes;
  const intermediate =
    diameterM *
    Math.cbrt(
      (4 * GRAVITY * GRAVITY * grainDensity * grainDensity) /
        (225 * AIR_VISCOSITY_PA_S * airDensity)
    );
  if (reynolds(intermediate) < 500) return intermediate;
  return Math.sqrt((3.1 * grainDensity * GRAVITY * diameterM) / airDensity);
}

function airDensityAt(heightM: number): number {
  return SEA_LEVEL_AIR_DENSITY * Math.exp(-heightM / AIR_DENSITY_SCALE_HEIGHT_M);
}

function grainDensity(phi: number, e: Tephra2Eruption): number {
  if (phi >= LITHIC_FROM_PHI) return e.lithicDensityKgM3;
  if (phi <= PUMICE_TO_PHI) return e.pumiceDensityKgM3;
  const share = (phi - LITHIC_FROM_PHI) / (PUMICE_TO_PHI - LITHIC_FROM_PHI);
  return e.lithicDensityKgM3 - (e.lithicDensityKgM3 - e.pumiceDensityKgM3) * share;
}

/** The wind at each column level, from the vent (level 0) to the plume top
 *  (level `columnSteps`): speed (m/s) and direction (radians). */
function windOnLevels(
  e: Tephra2Eruption,
  readings: readonly WindReading[]
): { speed: Float64Array; toward: Float64Array } {
  const n = e.columnSteps;
  const speed = new Float64Array(n + 1);
  const toward = new Float64Array(n + 1);
  const spacing = (e.plumeTopElevationM - e.ventElevationM) / n;
  let level = e.ventElevationM;
  for (let k = 0; k <= n; k++) {
    let below = { heightM: 0, speedMS: 0, towardDeg: 0 };
    let found = false;
    for (const r of readings) {
      if (r.heightM >= level) {
        if (r.heightM === level) {
          speed[k] = r.speedMS;
          toward[k] = r.towardDeg;
        } else {
          const f = (level - below.heightM) / (r.heightM - below.heightM);
          speed[k] = below.speedMS + (r.speedMS - below.speedMS) * f;
          toward[k] = below.towardDeg + (r.towardDeg - below.towardDeg) * f;
        }
        found = true;
        break;
      }
      below = r;
    }
    if (!found) {
      speed[k] = below.speedMS;
      toward[k] = below.towardDeg;
    }
    toward[k] = ((toward[k] ?? 0) * Math.PI) / 180;
    level += spacing;
  }
  return { speed, toward };
}

/** An eruption made ready for points: every (size, level) pair's mass, fall
 *  time, drift and spread, computed once. */
export interface Tephra2Deposit {
  eruption: Tephra2Eruption;
  grains: number;
  levels: number;
  /** Per size: diameter (m) and density (kg/m³). */
  diameterM: Float64Array;
  densityKgM3: Float64Array;
  /** Per (size, level), row by size: the mass (kg), the fall time to the
   *  vent's height (s), the drift north and east (m), and the column-width
   *  times for coarse and fine grains (s). */
  mass: Float64Array;
  fallTime: Float64Array;
  driftNorth: Float64Array;
  driftEast: Float64Array;
  coarseWidthTime: Float64Array;
  fineWidthTime: Float64Array;
  /** The wind at the vent's level: speed (m/s) and direction (rad). */
  ventWindSpeed: number;
  ventWindToward: number;
}

export function prepareTephra2Deposit(
  e: Tephra2Eruption,
  wind: readonly WindReading[]
): Tephra2Deposit {
  const G = e.grainSteps;
  const N = e.columnSteps;
  const K = Math.max(e.diffusionCoefficientM2S, 1);
  const column = e.plumeTopElevationM - e.ventElevationM;
  const layer = column / N;
  const { speed, toward } = windOnLevels(e, wind);

  // The release weights, level by level, with the fraction of the column
  // carried by repeated steps.
  const release = new Float64Array(N);
  const fractionStep = layer / column;
  let fraction = 0;
  let releaseTotal = 0;
  for (let j = 0; j < N; j++) {
    fraction += fractionStep;
    let x = fraction;
    if (x >= 1) x -= TOP_OFFSET;
    else if (x <= 0) x += TOP_OFFSET;
    const w = Math.pow(x, e.releaseAlpha - 1) * Math.pow(1 - x, e.releaseBeta - 1);
    release[j] = w;
    releaseTotal += w;
  }

  // The size weights, size by size, with φ carried by repeated steps.
  const phiStep = (e.finestPhi - e.coarsestPhi) / G;
  const sizeWeight = new Float64Array(G);
  const phiOf = new Float64Array(G);
  let phi = e.coarsestPhi;
  let sizeTotal = 0;
  for (let i = 0; i < G; i++) {
    phiOf[i] = phi;
    const z = phi - e.medianPhi;
    const w = Math.exp((-z * z) / (2 * e.sigmaPhi * e.sigmaPhi)) * phiStep;
    sizeWeight[i] = w;
    sizeTotal += w;
    phi += phiStep;
  }

  const diameterM = new Float64Array(G);
  const densityKgM3 = new Float64Array(G);
  const mass = new Float64Array(G * N);
  const fallTime = new Float64Array(G * N);
  const driftNorth = new Float64Array(G * N);
  const driftEast = new Float64Array(G * N);
  const coarseWidthTime = new Float64Array(G * N);
  const fineWidthTime = new Float64Array(G * N);
  const norm = releaseTotal * sizeTotal;

  for (let i = 0; i < G; i++) {
    const p = phiOf[i] ?? 0;
    const d = 1e-3 * Math.pow(2, -p);
    const rho = grainDensity(p, e);
    diameterM[i] = d;
    densityKgM3[i] = rho;
    let height = e.ventElevationM;
    let time = 0;
    let north = 0;
    let east = 0;
    for (let j = 0; j < N; j++) {
      height += layer;
      const dt = layer / tephra2SettlingSpeed(d, rho, airDensityAt(height));
      const u = speed[j + 1] ?? 0;
      const dir = toward[j + 1] ?? 0;
      north += dt * u * Math.cos(dir);
      east += dt * u * Math.sin(dir);
      time += dt;
      const h = height - e.ventElevationM;
      const at = i * N + j;
      fallTime[at] = time;
      driftNorth[at] = north;
      driftEast[at] = east;
      coarseWidthTime[at] = (0.0032 * h * h) / K;
      fineWidthTime[at] = Math.pow(0.2 * h * h, 0.4);
      mass[at] = (e.massKg * (release[j] ?? 0) * (sizeWeight[i] ?? 0)) / norm;
    }
  }

  return {
    eruption: { ...e, diffusionCoefficientM2S: K },
    grains: G,
    levels: N,
    diameterM,
    densityKgM3,
    mass,
    fallTime,
    driftNorth,
    driftEast,
    coarseWidthTime,
    fineWidthTime,
    ventWindSpeed: speed[0] ?? 0,
    ventWindToward: toward[0] ?? 0,
  };
}

/**
 * The mass loading (kg/m²) at a point `northM` and `eastM` from the vent, at
 * `elevationM` above sea level.
 */
export function tephra2Loading(
  deposit: Tephra2Deposit,
  northM: number,
  eastM: number,
  elevationM: number
): number {
  const e = deposit.eruption;
  const G = deposit.grains;
  const N = deposit.levels;
  const K = e.diffusionCoefficientM2S;
  const C = (8 / 5) * e.eddyConstant;
  const below = e.ventElevationM - elevationM;
  const ventAir = airDensityAt(e.ventElevationM);
  const belowSpeed =
    below > 0 && e.ventElevationM !== 0
      ? (deposit.ventWindSpeed * elevationM) / e.ventElevationM
      : 0;
  const belowNorth = Math.cos(deposit.ventWindToward) * belowSpeed;
  const belowEast = Math.sin(deposit.ventWindToward) * belowSpeed;

  let loading = 0;
  for (let i = 0; i < G; i++) {
    const extraTime =
      below > 0
        ? below /
          tephra2SettlingSpeed(deposit.diameterM[i] ?? 0, deposit.densityKgM3[i] ?? 0, ventAir)
        : 0;
    for (let j = 0; j < N; j++) {
      const at = i * N + j;
      const t = (deposit.fallTime[at] ?? 0) + extraTime;
      let vNorth = ((deposit.driftNorth[at] ?? 0) + belowNorth * extraTime) / t;
      let vEast = ((deposit.driftEast[at] ?? 0) + belowEast * extraTime) / t;
      if (vNorth === 0) vNorth = CALM_COMPONENT;
      if (vEast === 0) vEast = CALM_COMPONENT;
      const S =
        t >= e.fallTimeThresholdS
          ? C * Math.pow(t + (deposit.fineWidthTime[at] ?? 0), 2.5)
          : 4 * K * (t + (deposit.coarseWidthTime[at] ?? 0));
      const dn = northM - vNorth * t;
      const de = eastM - vEast * t;
      loading += ((deposit.mass[at] ?? 0) / (Math.PI * S)) * Math.exp(-(dn * dn + de * de) / S);
    }
  }
  return loading;
}

/**
 * The loading field over points that all stand at one elevation, as a
 * function of the offsets north and east of the vent: every (size, level)
 * pair's landing point, spread and weight computed once, so a point costs one
 * Gaussian per pair. The same numbers as {@link tephra2Loading}, summed in the
 * same order.
 */
export function tephra2Field(
  deposit: Tephra2Deposit,
  elevationM: number
): (northM: number, eastM: number) => number {
  const e = deposit.eruption;
  const G = deposit.grains;
  const N = deposit.levels;
  const K = e.diffusionCoefficientM2S;
  const C = (8 / 5) * e.eddyConstant;
  const below = e.ventElevationM - elevationM;
  const ventAir = airDensityAt(e.ventElevationM);
  const belowSpeed =
    below > 0 && e.ventElevationM !== 0
      ? (deposit.ventWindSpeed * elevationM) / e.ventElevationM
      : 0;
  const belowNorth = Math.cos(deposit.ventWindToward) * belowSpeed;
  const belowEast = Math.sin(deposit.ventWindToward) * belowSpeed;
  const landNorth = new Float64Array(G * N);
  const landEast = new Float64Array(G * N);
  const spread = new Float64Array(G * N);
  const weight = new Float64Array(G * N);
  for (let i = 0; i < G; i++) {
    const extraTime =
      below > 0
        ? below /
          tephra2SettlingSpeed(deposit.diameterM[i] ?? 0, deposit.densityKgM3[i] ?? 0, ventAir)
        : 0;
    for (let j = 0; j < N; j++) {
      const at = i * N + j;
      const t = (deposit.fallTime[at] ?? 0) + extraTime;
      let vNorth = ((deposit.driftNorth[at] ?? 0) + belowNorth * extraTime) / t;
      let vEast = ((deposit.driftEast[at] ?? 0) + belowEast * extraTime) / t;
      if (vNorth === 0) vNorth = CALM_COMPONENT;
      if (vEast === 0) vEast = CALM_COMPONENT;
      const S =
        t >= e.fallTimeThresholdS
          ? C * Math.pow(t + (deposit.fineWidthTime[at] ?? 0), 2.5)
          : 4 * K * (t + (deposit.coarseWidthTime[at] ?? 0));
      landNorth[at] = vNorth * t;
      landEast[at] = vEast * t;
      spread[at] = S;
      weight[at] = (deposit.mass[at] ?? 0) / (Math.PI * S);
    }
  }
  const pairs = G * N;
  return (northM: number, eastM: number): number => {
    let loading = 0;
    for (let at = 0; at < pairs; at++) {
      const dn = northM - (landNorth[at] ?? 0);
      const de = eastM - (landEast[at] ?? 0);
      loading += (weight[at] ?? 0) * Math.exp(-(dn * dn + de * de) / (spread[at] ?? 1));
    }
    return loading;
  };
}
