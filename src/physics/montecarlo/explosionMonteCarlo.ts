import { simulateExplosion, type ExplosionScenarioInput } from '../events/explosion/index.js';
import { m } from '../units.js';
import { EXPLOSION_INPUT_SIGMA } from '../uq/conventions.js';
import type { MonteCarloOutput } from './engine.js';
import { runMonteCarlo } from './engine.js';
import { sampleLognormal, sampleNormal, type Rng } from './sampling.js';

/**
 * Monte-Carlo wrapper for the nuclear / conventional-explosion
 * pipeline. The two physically-uncertain inputs are:
 *
 *   yieldMegatons   — design-stated yield ±10 % (Cold War weapons
 *                     tests have ~±10 % actual/design spread, e.g.
 *                     Castle Bravo's 15 Mt came from a 6 Mt design).
 *   heightOfBurst   — for an air burst only: normal, σ = 50 m or 5 %
 *                     whichever is larger (Hiroshima's HOB was
 *                     580 ± 40 m per Penney et al. 1970
 *                     reconstruction). A draw below the ground is a
 *                     burst on the surface.
 *
 * Ground type is NOT sampled — it's a site property, not a random
 * variable, and the project's K coefficients carry no stated scatter
 * to sample. Nor is the placement of a burst on the surface or under
 * the water: a charge in a warehouse does not go off 50 m up, and
 * nothing publishes the scatter of a placed depth.
 */

const DEFAULT_ITERATIONS = 200;

export interface ExplosionMonteCarloInput {
  nominal: ExplosionScenarioInput;
  rng: Rng;
  iterations?: number;
}

export interface ExplosionMonteCarloMetrics extends Record<string, number> {
  /** Yield in megatons (echoed — should match nominal within σ=10 %). */
  yieldMt: number;
  /** HOB-corrected 5 psi ring radius (m). */
  fivePsiRadius: number;
  /** HOB-corrected 1 psi ring radius (m). */
  onePsiRadius: number;
  /** Third-degree burn radius (m). */
  burn3rdDegree: number;
  /** Firestorm ignition radius (m). */
  firestormIgnition: number;
  /** Apparent surface-burst crater (m). */
  craterDiameter: number;
  /** LD50 initial-radiation radius (m). */
  ld50Radius: number;
}

export function explosionSampler(
  nominal: ExplosionScenarioInput
): (rng: Rng) => ExplosionScenarioInput {
  return (rng: Rng): ExplosionScenarioInput => {
    const yieldMt = Math.max(
      sampleLognormal(rng, nominal.yieldMegatons, EXPLOSION_INPUT_SIGMA.yield.sigma),
      1e-6
    );
    const hobNominal = nominal.heightOfBurst === undefined ? 0 : (nominal.heightOfBurst as number);
    // Only an air burst's height is drawn. Until 14 September 2026 every
    // burst was, and clamped at zero: a charge 40 m under the sea came
    // out on the surface in four draws of five and in the air in the
    // fifth, never in the water, and a charge on a quay went off up to
    // a hundred metres above it.
    const hob =
      hobNominal > 0
        ? Math.max(
            sampleNormal(
              rng,
              hobNominal,
              Math.max(EXPLOSION_INPUT_SIGMA.heightOfBurst.sigma, 0.05 * hobNominal)
            ),
            0
          )
        : hobNominal;
    // Everything the caller set that is not sampled stays set: a
    // conventional charge stays conventional, a burst beside the sea
    // keeps its shore. Rebuilding the input from scratch used to drop
    // those, so the Monte-Carlo of Beirut ran a nuclear device.
    return { ...nominal, yieldMegatons: yieldMt, heightOfBurst: m(hob) };
  };
}

export function runExplosionMonteCarlo(
  input: ExplosionMonteCarloInput
): MonteCarloOutput<ExplosionMonteCarloMetrics> {
  return runMonteCarlo<
    ExplosionScenarioInput,
    ReturnType<typeof simulateExplosion>,
    ExplosionMonteCarloMetrics
  >({
    iterations: input.iterations ?? DEFAULT_ITERATIONS,
    rng: input.rng,
    sampler: explosionSampler(input.nominal),
    simulate: simulateExplosion,
    extractMetrics: (r) => ({
      yieldMt: r.yield.megatons,
      fivePsiRadius: r.blast.overpressure5psiRadiusHob,
      onePsiRadius: r.blast.overpressure1psiRadiusHob,
      burn3rdDegree: r.thermal.thirdDegreeBurnRadius,
      firestormIgnition: r.firestorm.ignitionRadius,
      craterDiameter: r.crater.apparentDiameter,
      ld50Radius: r.radiation.ld50Radius,
    }),
  });
}
