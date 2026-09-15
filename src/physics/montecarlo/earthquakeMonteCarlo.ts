import { simulateEarthquake, type EarthquakeScenarioInput } from '../events/earthquake/index.js';
import { m } from '../units.js';
import { EARTHQUAKE_INPUT_SIGMA } from '../uq/conventions.js';
import {
  DEFAULT_GROUND_MOTION_RESIDUAL,
  mmi7FootprintKm2,
  residualParts,
  type ResidualParts,
} from '../uq/groundMotionResidual.js';
import type { MonteCarloOutput } from './engine.js';
import { runMonteCarlo } from './engine.js';
import { sampleNormal, type Rng } from './sampling.js';

/**
 * Monte-Carlo wrapper for the earthquake pipeline. The
 * physically-uncertain inputs are:
 *
 *   magnitude  — reporting uncertainty on Mw is ±0.1 for
 *                modern USGS solutions, stretched to ±0.2 for
 *                older events. We sample N(Mw, 0.15).
 *   depth      — ISC-GEM hypocentre depths carry σ ≈ ±5 km for
 *                intermediate/deep events; we use 20 % of the
 *                nominal depth with a 2 km minimum.
 *   vs30       — N(760, 300) on the rock-reference baseline; or
 *                ±30 % lognormal when the caller supplied one.
 *
 * We ALSO sample the ground-motion aleatory residual — the GMPE's
 * intrinsic σ_lnY ≈ 0.60 scatter about the median (Boore et al. 2014).
 * Without it the PGA / MMI / contour-radius bands reflected only the
 * input spread and materially UNDER-stated the true predictive scatter
 * (the regression σ dominates). It is sampled as `N(0, σ_lnY)` in
 * ln-space and threaded through `simulateEarthquake` as
 * `groundMotionResidualLn`, which applies exp(residual) consistently to
 * every PGA-derived quantity.
 *
 * We do not re-sample the fault type — it's a categorical input
 * picked by the user from a dropdown, not an uncertain measurement.
 */

const DEFAULT_ITERATIONS = 200;

export interface EarthquakeMonteCarloInput {
  nominal: EarthquakeScenarioInput;
  rng: Rng;
  iterations?: number;
}

export interface EarthquakeMonteCarloMetrics extends Record<string, number> {
  /** Moment magnitude Mw (echoed — sanity check). */
  magnitude: number;
  /** Rupture length (m). */
  ruptureLength: number;
  /** NGA-West2 PGA @ 20 km (m/s²). */
  pgaAt20kmNGA: number;
  /** MMI at the epicentre (Worden 2012 California). */
  mmiAtEpicenter: number;
  /** MMI VIII ring radius (m). */
  mmi8Radius: number;
  /** Liquefaction radius (m). */
  liquefactionRadius: number;
}

/** What a sampler may be handed about the scenario it draws about, so that
 *  rule 71's residual is not recomputed for every realisation. */
export interface EarthquakeSamplerOptions {
  /** Rule 71's parts for the median scenario; computed from it when absent. */
  parts?: ResidualParts | null;
  /** The stream the within-event draws take, so that a realisation's other
   *  draws are the same whichever residual it draws. Absent, `rng`. */
  withinRng?: Rng;
}

export function earthquakeSampler(
  nominal: EarthquakeScenarioInput,
  options: EarthquakeSamplerOptions = {}
): (rng: Rng) => EarthquakeScenarioInput {
  const mode = nominal.groundMotionResidual ?? DEFAULT_GROUND_MOTION_RESIDUAL;
  let parts: ResidualParts | null | undefined = options.parts;
  const partsFor = (): ResidualParts | null => {
    if (parts === undefined) {
      parts = residualParts(
        nominal,
        mmi7FootprintKm2(simulateEarthquake({ ...nominal, groundMotionResidualLn: 0 }))
      );
    }
    return parts;
  };
  return (rng: Rng): EarthquakeScenarioInput => {
    const magnitude = Math.max(
      sampleNormal(rng, nominal.magnitude, EARTHQUAKE_INPUT_SIGMA.magnitude.sigma),
      1
    );
    const depthNominal = nominal.depth === undefined ? 15_000 : (nominal.depth as number);
    const depthSigma = Math.max(2_000, EARTHQUAKE_INPUT_SIGMA.depth.sigma * depthNominal);
    const depth = Math.max(sampleNormal(rng, depthNominal, depthSigma), 1_000);
    const vs30Nominal = nominal.vs30 ?? 760;
    const vs30Sigma = EARTHQUAKE_INPUT_SIGMA.vs30.sigma * vs30Nominal;
    const vs30 = Math.max(sampleNormal(rng, vs30Nominal, vs30Sigma), 100);
    // GMPE aleatory residual in ln-space: N(0, σ_lnY). Threaded into
    // simulateEarthquake, which scales every PGA by exp(residual).
    const sigmaInPlace =
      nominal.intensityMeasure === 'pgv'
        ? EARTHQUAKE_INPUT_SIGMA.groundMotionPgv.sigma
        : EARTHQUAKE_INPUT_SIGMA.groundMotion.sigma;
    const residualInPlace = sampleNormal(rng, 0, sigmaInPlace);
    // Rule 71 of validation/residualRules.ts: the same draw, read as the
    // between-event part, and the within-event part apart for the
    // footprint and for one place.
    const law = mode === 'onePerScenario' ? null : partsFor();
    let groundMotionResidualLn = residualInPlace;
    let site: number | undefined;
    if (law !== null) {
      const z1 = residualInPlace / sigmaInPlace;
      if (mode === 'lawTotal') {
        groundMotionResidualLn = Math.hypot(law.tau, law.phi) * z1;
      } else {
        const within = options.withinRng ?? rng;
        const z2 = sampleNormal(within, 0, 1);
        const z3 = sampleNormal(within, 0, 1);
        groundMotionResidualLn = law.tau * z1 + law.phi * Math.sqrt(law.meanCorrelation) * z2;
        site = law.tau * z1 + law.phi * z3;
      }
    }
    // Everything not sampled stays as the caller set it — the strike
    // the stadium is drawn around, a documented rupture-length
    // override, whether the basin had a warning system. Rebuilding
    // the input from scratch used to drop those, so a realisation of
    // Sumatra ran on the 803 km the regression gives rather than on
    // the 1 300 km that was observed.
    return {
      ...nominal,
      magnitude,
      depth: m(depth),
      vs30,
      groundMotionResidualLn,
      ...(site === undefined ? {} : { groundMotionSiteResidualLn: site }),
    };
  };
}

export function runEarthquakeMonteCarlo(
  input: EarthquakeMonteCarloInput
): MonteCarloOutput<EarthquakeMonteCarloMetrics> {
  return runMonteCarlo<
    EarthquakeScenarioInput,
    ReturnType<typeof simulateEarthquake>,
    EarthquakeMonteCarloMetrics
  >({
    iterations: input.iterations ?? DEFAULT_ITERATIONS,
    rng: input.rng,
    sampler: earthquakeSampler(input.nominal),
    simulate: simulateEarthquake,
    extractMetrics: (r) => ({
      magnitude: r.inputs.magnitude,
      ruptureLength: r.ruptureLength,
      pgaAt20kmNGA: r.shaking.pgaAt20kmNGA,
      mmiAtEpicenter: r.shaking.mmiAtEpicenter,
      mmi8Radius: r.shaking.mmi8Radius,
      liquefactionRadius: r.shaking.liquefactionRadius,
    }),
  });
}
