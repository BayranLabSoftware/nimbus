import { describe, expect, it } from 'vitest';
import { IMPACT_PRESETS } from '../simulate.js';
import {
  MC_GIVEN_MIN_DRAWS,
  MC_QUANTILE_Z,
  MC_SHARE_SHOWN_WHOLE,
  MC_SHARE_SIGMAS,
} from '../validation/monteCarloShareRules.js';
import { pickQuantile } from './engine.js';
import { mulberry32 } from './sampling.js';
import { runImpactMonteCarlo } from './impactMonteCarlo.js';

/** Hands the worker's event loop back between cases, so a long test never
 *  holds it past vitest's one-minute call to the runner (a slow CI runner
 *  with coverage is several times slower than a Mac). */
const breathe = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

/**
 * Coverage and self-consistency tests for the Monte-Carlo engine, as
 * flagged by the audit (NUM-002). The headline question: is N=200
 * (the popular-science default) actually enough samples to nail the
 * P10/P90 bands within the band width itself?
 *
 * The strategy is to use a high-N reference run as ground truth and
 * compare the production-default run against it:
 *
 *   - Reference: same seed, N=2 000.
 *   - Production: same seed, N=200.
 *
 * Acceptance: the P10/P90 of the 200-sample run lies within 15 % of
 * the P10/P90 of the 2 000-sample reference for the four headline
 * metrics (energy, crater, ejecta edge, firestorm ignition). The 15 %
 * threshold is below the published per-quantity 1σ scatter (see the
 * master table in docs/SCIENCE.md), so a Monte-Carlo bin shift below
 * that is invisible to the user.
 *
 * A separate test asserts seed determinism — re-running the same MC
 * twice with the same seed must yield bit-identical percentiles. This
 * is the contract that lets us hash a seed into a shareable URL.
 *
 * Both tests run on the Tunguska preset. Its small size kept the
 * simulator below 0.5 ms per iteration; since rules 780 to 787 its
 * flash is integrated along the entry's path, about 5 ms an iteration,
 * so the N=2 000 reference takes some ten seconds and the tests that
 * draw two more runs have a minute.
 */

const NOMINAL = IMPACT_PRESETS.TUNGUSKA.input;

describe('Monte-Carlo coverage — N=200 vs N=2000 reference (Tunguska)', () => {
  const referenceRng = mulberry32('coverage-reference');
  const reference = runImpactMonteCarlo({
    nominal: NOMINAL,
    rng: referenceRng,
    iterations: 2_000,
  });
  const productionRng = mulberry32('coverage-reference');
  const production = runImpactMonteCarlo({
    nominal: NOMINAL,
    rng: productionRng,
    iterations: 200,
  });

  const FIELDS = [
    'kineticEnergy',
    'finalCraterDiameter',
    'ejectaEdge1m',
    'firestormIgnition',
  ] as const;

  for (const f of FIELDS) {
    // Rule 892 (validation/monteCarloShareRules.ts): the reference's share
    // of draws above zero decides which claims the field is held to.
    const s = reference.metrics[f].share;

    it(`${f}: share of draws above zero within three binomial deviations of N=2000 reference (rule 892(a))`, () => {
      const tolerance = MC_SHARE_SIGMAS * Math.sqrt((s * (1 - s)) / 200);
      expect(Math.abs(production.metrics[f].share - s)).toBeLessThanOrEqual(tolerance);
    });

    if (s > MC_SHARE_SHOWN_WHOLE) {
      it(`${f}: P10 within 15 % of N=2000 reference`, () => {
        const ref = reference.metrics[f].p10;
        const prod = production.metrics[f].p10;
        const tolerance = 0.15;
        // Both must be > 0 for ratio to make sense; otherwise both must
        // be 0 (zero output is a stable signal — Tunguska firestorm
        // ignition is correctly zero with high probability).
        if (ref === 0) {
          expect(prod).toBe(0);
        } else {
          expect(Math.abs(prod - ref) / ref).toBeLessThan(tolerance);
        }
      });
      it(`${f}: P90 within 15 % of N=2000 reference`, () => {
        const ref = reference.metrics[f].p90;
        const prod = production.metrics[f].p90;
        if (ref === 0) {
          expect(prod).toBe(0);
        } else {
          expect(Math.abs(prod - ref) / ref).toBeLessThan(0.15);
        }
      });
      it(`${f}: median within 10 % of N=2000 reference`, () => {
        const ref = reference.metrics[f].p50;
        const prod = production.metrics[f].p50;
        // Empirically a 200-sample median is unbiased but has a few-
        // percent sampling envelope around the high-N reference.
        // 10 % is below every published 1σ in the master table.
        if (ref === 0) {
          expect(prod).toBe(0);
        } else {
          expect(Math.abs(prod - ref) / ref).toBeLessThan(0.1);
        }
      });
    } else if (s > 0) {
      const above = (reference.rawSamples[f] ?? []).filter((x) => x > 0);
      const n = (production.rawSamples[f] ?? []).filter((x) => x > 0).length;
      it.skipIf(n < MC_GIVEN_MIN_DRAWS)(
        `${f}: P10, P50 and P90 of the draws above zero within their 99 % intervals (rule 892(c))`,
        () => {
          const given = production.metrics[f].given;
          expect(given).not.toBeNull();
          if (given === null) return;
          for (const [p, value] of [
            [0.1, given.p10],
            [0.5, given.p50],
            [0.9, given.p90],
          ] as const) {
            const half = MC_QUANTILE_Z * Math.sqrt((p * (1 - p)) / n);
            const low = pickQuantile(above, Math.max(0, p - half));
            const high = pickQuantile(above, Math.min(1, p + half));
            expect(value, `P${String(p * 100)}`).toBeGreaterThanOrEqual(low);
            expect(value, `P${String(p * 100)}`).toBeLessThanOrEqual(high);
          }
        }
      );
    }
  }
});

describe('Monte-Carlo determinism — same seed produces identical percentiles', () => {
  it('two N=200 runs with the same seed return bit-identical percentiles', async () => {
    const a = runImpactMonteCarlo({
      nominal: NOMINAL,
      rng: mulberry32('determinism-test'),
      iterations: 200,
    });
    await breathe();
    const b = runImpactMonteCarlo({
      nominal: NOMINAL,
      rng: mulberry32('determinism-test'),
      iterations: 200,
    });
    expect(a.iterations).toBe(b.iterations);
    for (const k of Object.keys(a.metrics)) {
      const fa = a.metrics[k as keyof typeof a.metrics];
      const fb = b.metrics[k as keyof typeof b.metrics];
      if (!fa || !fb) {
        throw new Error(`metric ${k} missing on one side`);
      }
      expect(fa.p10).toBe(fb.p10);
      expect(fa.p50).toBe(fb.p50);
      expect(fa.p90).toBe(fb.p90);
      expect(fa.mean).toBe(fb.mean);
    }
  }, 90_000);

  it('different seeds produce different percentiles (sanity)', async () => {
    const a = runImpactMonteCarlo({
      nominal: NOMINAL,
      rng: mulberry32('seed-A'),
      iterations: 200,
    });
    await breathe();
    const b = runImpactMonteCarlo({
      nominal: NOMINAL,
      rng: mulberry32('seed-B'),
      iterations: 200,
    });
    // P50 will be close — that's the point of medians — but the P10
    // and P90 tails should disagree by *something* between two
    // independent 200-sample runs. Use the energy metric (largest
    // dynamic range, so any drift shows up).
    const a10 = a.metrics.kineticEnergy.p10;
    const b10 = b.metrics.kineticEnergy.p10;
    expect(a10).not.toBe(b10);
  }, 90_000);
});
