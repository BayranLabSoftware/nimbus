import {
  DEFAULT_STRENGTH_LAW,
  FIRST_STAGE_STRENGTH_RANGE,
  MAIN_STAGE_STRENGTH_RANGE,
  twoStageCovers,
} from '../effects/atmosphericEntry.js';
import { simulateImpact, type ImpactScenarioInput } from '../simulate.js';
import { kgPerM3, m, mps, Pa } from '../units.js';
import { IMPACT_INPUT_SIGMA } from '../uq/conventions.js';
import type { MonteCarloOutput } from './engine.js';
import { runMonteCarlo } from './engine.js';
import { sampleLognormal, sampleNormal, type Rng } from './sampling.js';

/**
 * Monte-Carlo wrapper for the cosmic-impact pipeline. Samples the
 * known-uncertain inputs from published distributions and reports
 * P10/P50/P90 bands on the headline outputs: kinetic energy, final
 * crater, ejecta-blanket edge, and firestorm ignition reach.
 *
 * Input distributions (all centred on the caller's nominal input,
 * so the median of the MC run closely tracks the deterministic
 * {@link simulateImpact} output):
 *
 *   impactorDiameter  — log-normal with σ_log = 0.15 (~±15 % around
 *                       the central guess; stays within the factor-1.4
 *                       size-estimation band for NEOWISE-class survey
 *                       data, Mainzer 2019).
 *   impactVelocity    — normal, σ = 10 % of the nominal velocity
 *                       (typical orbital-solution uncertainty for a
 *                       well-observed NEO).
 *   impactorDensity   — log-normal with σ_log = 0.15 (a project value).
 *
 * We deliberately do NOT re-sample `surfaceGravity`, `waterDepth`,
 * `impactorStrength`, or, since rule 1194 (an outside audit found the
 * band ran on a random angle the caller never chose, `impactMonteCarlo.ts`
 * A3/A11 of the audit), `impactAngle`: gravity is known exactly for a
 * chosen body, water depth is a site property the user picks, strength is
 * absorbed into the atmospheric-entry classifier's already-coarse
 * INTACT/AIRBURST branches, and the angle is the scenario's own chosen
 * geometry — the same category as water depth, not a measured orbital
 * parameter like diameter, velocity or density. A population-level
 * question ("across every angle an unknown impactor might arrive at, sin
 * 2θ-weighted, Collins et al. 2005 after Shoemaker 1962") is a different
 * question from "given this scenario's angle, how uncertain is the
 * outcome", and this wrapper answers only the second.
 */

const DEFAULT_ITERATIONS = 200;

export interface ImpactMonteCarloInput {
  /** Nominal inputs — the distribution medians. */
  nominal: ImpactScenarioInput;
  /** Seeded PRNG. Same seed ⇒ same percentiles. */
  rng: Rng;
  /** Number of iterations to run. Defaults to 200. */
  iterations?: number;
}

export interface ImpactMonteCarloMetrics extends Record<string, number> {
  /** Impactor kinetic energy (J). */
  kineticEnergy: number;
  /** Kinetic energy in TNT megatons. */
  kineticEnergyMt: number;
  /** Final crater diameter (m). */
  finalCraterDiameter: number;
  /** Ejecta blanket outer-edge @ 1 m thickness (m). */
  ejectaEdge1m: number;
  /** Firestorm ignition radius (m). */
  firestormIgnition: number;
  /** Seismic magnitude (Collins et al. 2005 Eq. 40*). */
  seismicMagnitude: number;
  /** Rule 949: 1 where the crater is out of the domain of its law, 0
   *  elsewhere — its mean is the share of such draws, whose crater and
   *  ejecta are not numbers and so leave those rows. */
  craterOutOfDomain: number;
}

/** A draw log-uniform between the bounds. */
function sampleLogUniform(rng: Rng, [low, high]: readonly [number, number]): number {
  return Math.exp(Math.log(low) + (Math.log(high) - Math.log(low)) * rng.next());
}

export function impactSampler(nominal: ImpactScenarioInput): (rng: Rng) => ImpactScenarioInput {
  return (rng: Rng): ImpactScenarioInput => {
    const diameter = sampleLognormal(
      rng,
      nominal.impactorDiameter,
      IMPACT_INPUT_SIGMA.diameter.sigma
    );
    const velocity = Math.max(
      sampleNormal(
        rng,
        nominal.impactVelocity,
        IMPACT_INPUT_SIGMA.velocity.sigma * (nominal.impactVelocity as number)
      ),
      500 // physical lower bound — below ~500 m/s we leave the hypervelocity regime
    );
    const impactorDensity = sampleLognormal(
      rng,
      nominal.impactorDensity,
      IMPACT_INPUT_SIGMA.density.sigma
    );
    // Rule 882(c), done by rule 896(i): under the two-stage law, for a body
    // it covers and no strength given, the two phases' strengths are drawn
    // log-uniform over their intervals. Under today's law nothing more is
    // drawn, so its runs keep their stream.
    const law = nominal.strengthLaw ?? DEFAULT_STRENGTH_LAW;
    const strengths =
      law === 'twoStage' &&
      nominal.impactorStrength === undefined &&
      twoStageCovers(impactorDensity)
        ? {
            impactorStrength: Pa(sampleLogUniform(rng, MAIN_STAGE_STRENGTH_RANGE)),
            firstStageStrength: Pa(sampleLogUniform(rng, FIRST_STAGE_STRENGTH_RANGE)),
          }
        : {};
    // Target density is ground-fixed and not sampled; the angle is the
    // scenario's own chosen geometry (rule 1194) and every other unsampled
    // field rides through untouched.
    return {
      ...nominal,
      impactorDiameter: m(diameter),
      impactVelocity: mps(velocity),
      impactorDensity: kgPerM3(impactorDensity),
      ...strengths,
    };
  };
}

export function runImpactMonteCarlo(
  input: ImpactMonteCarloInput
): MonteCarloOutput<ImpactMonteCarloMetrics> {
  return runMonteCarlo<
    ImpactScenarioInput,
    ReturnType<typeof simulateImpact>,
    ImpactMonteCarloMetrics
  >({
    iterations: input.iterations ?? DEFAULT_ITERATIONS,
    rng: input.rng,
    sampler: impactSampler(input.nominal),
    simulate: simulateImpact,
    extractMetrics: (r) => ({
      kineticEnergy: r.impactor.kineticEnergy,
      kineticEnergyMt: r.impactor.kineticEnergyMegatons,
      finalCraterDiameter: r.crater.finalDiameter,
      ejectaEdge1m: r.ejecta.blanketEdge1m,
      firestormIgnition: r.firestorm.ignitionRadius,
      // No magnitude where no relation covers the burst (rule 730): the
      // engine drops what is not a number.
      seismicMagnitude: r.seismic.magnitude ?? Number.NaN,
      craterOutOfDomain: r.crater.state === 'outOfDomain' ? 1 : 0,
    }),
  });
}
