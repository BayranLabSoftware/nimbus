import { deepLawFor, type EarthquakeScenarioInput } from '../events/earthquake/simulate.js';

/**
 * The ground-motion residual of an earthquake realisation, in the parts its
 * ground-motion models give it — rule 71 of validation/residualRules.ts.
 *
 * A ground-motion model's scatter about its median has two parts: the
 * between-event τ, which moves every place of one earthquake together, and
 * the within-event φ, which differs from place to place and is correlated
 * over distances of tens of kilometres. A toll is counted over a footprint,
 * so what moves it is the between-event part and the within-event part
 * averaged over that footprint — much less of φ than one place sees.
 *
 *  - Boore, D. M., Stewart, J. P., Seyhan, E. & Atkinson, G. M. (2014).
 *    NGA-West2 equations for predicting PGA, PGV and 5 %-damped PSA for
 *    shallow crustal earthquakes. Earthquake Spectra 30 (3): 1057–1085.
 *    Equations 14 to 17: τ and φ for PGA, with φ's distance and site terms.
 *  - Abrahamson, N., Gregor, N. & Addo, K. (2016). BC Hydro ground motion
 *    prediction equations for subduction earthquakes. Earthquake Spectra 32
 *    (1): 23–44. The ergodic τ = 0.43 and φ = 0.60.
 *  - Jayaram, N. & Baker, J. W. (2009). Correlation model for spatially
 *    distributed ground-motion intensities. Earthquake Engineering and
 *    Structural Dynamics 38: 1687–1708. Equation 20, ρ(h) = exp(−3h/b), with
 *    b from equation 17 (Vs30 not clustered) or 18 (clustered).
 *
 * All three are coded as OpenQuake implements them (BooreEtAl2014,
 * AbrahamsonEtAl2015SSlab, jbcorrelation) and held to it in
 * groundMotionResidual.test.ts.
 */

/** How a realisation draws its ground-motion residual. `onePerScenario`: one
 *  draw of σ 0.60 in ln PGA for every place and every quantity, in place until
 *  rules 71 to 75 decide; `betweenAndWithin`: the law's τ shared, its φ
 *  averaged over the footprint for the rings and whole for a single place;
 *  `lawTotal`: one draw of the law's own √(τ² + φ²), printed beside. */
export type GroundMotionResidual = 'onePerScenario' | 'betweenAndWithin' | 'lawTotal';

/** What a realisation draws where its scenario names no residual; rules 73
 *  and 74 of validation/residualRules.ts say what it is. */
export const DEFAULT_GROUND_MOTION_RESIDUAL: GroundMotionResidual = 'onePerScenario';

export interface TauPhi {
  tau: number;
  phi: number;
}

/** Boore et al. 2014's PGA row: τ₁, τ₂, φ₁, φ₂, R₁, R₂ (km), ΔφR, ΔφV, and
 *  the site-term corners V₁, V₂ (m/s). */
const BSSA14_PGA = {
  tau1: 0.398,
  tau2: 0.348,
  phi1: 0.695,
  phi2: 0.495,
  r1: 110,
  r2: 270,
  dPhiR: 0.1,
  dPhiV: 0.07,
  v1: 225,
  v2: 300,
} as const;

/** Boore et al. 2014, PGA: τ(M) and φ(M, R_JB, Vs30). */
export function boore2014PgaTauPhi(magnitude: number, rjbKm: number, vs30: number): TauPhi {
  const k = BSSA14_PGA;
  const byMagnitude = (low: number, high: number): number =>
    magnitude <= 4.5 ? low : magnitude >= 5.5 ? high : low + (high - low) * (magnitude - 4.5);
  let phi = byMagnitude(k.phi1, k.phi2);
  if (rjbKm > k.r2) phi += k.dPhiR;
  else if (rjbKm > k.r1) phi += (k.dPhiR * Math.log(rjbKm / k.r1)) / Math.log(k.r2 / k.r1);
  if (vs30 <= k.v1) phi -= k.dPhiV;
  else if (vs30 <= k.v2) phi -= (k.dPhiV * Math.log(k.v2 / vs30)) / Math.log(k.v2 / k.v1);
  return { tau: byMagnitude(k.tau1, k.tau2), phi };
}

/** Abrahamson, Gregor & Addo 2016, intraslab, ergodic: τ and φ at every
 *  magnitude, distance and site. */
export const ABRAHAMSON_2016_SLAB_TAU_PHI: TauPhi = { tau: 0.43, phi: 0.6 };

/** Jayaram & Baker 2009's range b (km) for PGA: 8.5 where Vs30 is not
 *  clustered (case 1), 40.7 where it is (case 2). */
export const JB2009_PGA_RANGE_KM = { notClustered: 8.5, clustered: 40.7 } as const;

/** Jayaram & Baker 2009, equation 20. */
export function jb2009Correlation(distanceKm: number, rangeKm: number): number {
  return Math.exp((-3 * distanceKm) / rangeKm);
}

/** Gauss–Legendre nodes and weights on [−1, 1], by Newton's method on the
 *  Legendre polynomial. */
function gaussLegendre(n: number): { nodes: number[]; weights: number[] } {
  const nodes: number[] = [];
  const weights: number[] = [];
  for (let i = 1; i <= n; i++) {
    let x = Math.cos((Math.PI * (i - 0.25)) / (n + 0.5));
    let derivative = 0;
    for (let iter = 0; iter < 100; iter++) {
      let p0 = 1;
      let p1 = x;
      for (let j = 2; j <= n; j++) {
        const p2 = ((2 * j - 1) * x * p1 - (j - 1) * p0) / j;
        p0 = p1;
        p1 = p2;
      }
      derivative = (n * (x * p1 - p0)) / (x * x - 1);
      const step = p1 / derivative;
      x -= step;
      if (Math.abs(step) < 1e-16) break;
    }
    nodes.push(x);
    weights.push(2 / ((1 - x * x) * derivative * derivative));
  }
  return { nodes, weights };
}

const GL = gaussLegendre(16);
const PANELS = 256;

/**
 * The mean of Jayaram & Baker's correlation between two points drawn
 * independently and uniformly in a disc of radius `radiusKm`: the integral
 * over their distance u of 2πu·g(u)·ρ(u) / A², g being the disc's set
 * covariance, 2R²·acos(u/2R) − (u/2)·√(4R² − u²). One for a disc of no size.
 */
export function meanCorrelationInDisc(radiusKm: number, rangeKm: number): number {
  if (!(radiusKm > 0)) return 1;
  const r = radiusKm;
  const area = Math.PI * r * r;
  const k = 3 / rangeKm;
  // Beyond 50/k the correlation is below 2e-22 of its value at zero.
  const upper = Math.min(2 * r, 50 / k);
  const integrand = (u: number): number => {
    const x = Math.min(1, u / (2 * r));
    const covariance =
      2 * r * r * Math.acos(x) - (u / 2) * Math.sqrt(Math.max(0, 4 * r * r - u * u));
    return 2 * Math.PI * u * covariance * Math.exp(-k * u);
  };
  let sum = 0;
  const h = upper / PANELS;
  for (let p = 0; p < PANELS; p++) {
    const mid = (p + 0.5) * h;
    for (let i = 0; i < GL.nodes.length; i++) {
      sum += (GL.weights[i] ?? 0) * integrand(mid + (GL.nodes[i] ?? 0) * (h / 2));
    }
  }
  return Math.min(1, (sum * (h / 2)) / (area * area));
}

/** The parts of a realisation's residual rule 71 draws for one scenario. */
export interface ResidualParts {
  tau: number;
  phi: number;
  /** Mean within-event correlation over the median MMI VII footprint. */
  meanCorrelation: number;
}

/**
 * Rule 71's parts for the scenario the realisations are drawn about, or null
 * where its rings are drawn by a law or a measure rule 71 does not name —
 * which keep the residual in place. `footprintKm2` is the area of the
 * scenario's median MMI VII footprint, disc or stadium; zero where it draws
 * none.
 */
export function residualParts(
  input: Pick<
    EarthquakeScenarioInput,
    | 'magnitude'
    | 'vs30'
    | 'depth'
    | 'deepLaw'
    | 'contourLaw'
    | 'intensityMeasure'
    | 'subductionInterface'
  >,
  footprintKm2: number
): ResidualParts | null {
  if (input.intensityMeasure === 'pgv') return null;
  const deep = deepLawFor(input);
  let tauPhi: TauPhi | null = null;
  if (deep === 'abrahamson2016Slab') tauPhi = ABRAHAMSON_2016_SLAB_TAU_PHI;
  else if (deep === null && (input.contourLaw ?? 'boore2014') === 'boore2014') {
    tauPhi = boore2014PgaTauPhi(input.magnitude, 0, input.vs30 ?? 760);
  }
  if (tauPhi === null) return null;
  const radiusKm = footprintKm2 > 0 ? Math.sqrt(footprintKm2 / Math.PI) : 0;
  return {
    ...tauPhi,
    meanCorrelation: meanCorrelationInDisc(radiusKm, JB2009_PGA_RANGE_KM.clustered),
  };
}

/** The area (km²) of a result's MMI VII footprint: a disc of its radius, or
 *  the stadium round its rupture, as the casualty plan counts it. */
export function mmi7FootprintKm2(result: {
  isExtendedSource: boolean;
  ruptureLength: number;
  ruptureWidth: number;
  shaking: { mmi7Radius: number };
}): number {
  const r = result.shaking.mmi7Radius / 1_000;
  if (!(r > 0)) return 0;
  if (!result.isExtendedSource) return Math.PI * r * r;
  const l = result.ruptureLength / 1_000;
  const w = result.ruptureWidth / 1_000;
  return l * w + 2 * r * (l + w) + Math.PI * r * r;
}
