import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import type { ActiveMonteCarlo } from '../../store/index.js';
import {
  ECDF_MAX_ALPHA,
  MMI_RING_COLORS,
  RING_COLORS,
  ecdfDiscs,
  monteCarloCards,
  pickFuzzyMetrics,
} from './monteCarloHalos.js';

/**
 * Rule 1201: `RingLegend.tsx` names exactly the metrics this function
 * chose, from the same call — these tests pin the impact case's own two
 * metrics and their colours so a future edit to `pickFuzzyMetrics` cannot
 * silently drift the legend out of step with the globe it describes
 * without a test noticing.
 */

const summary = (
  p10: number,
  p90: number
): {
  p10: number;
  p50: number;
  p90: number;
  mean: number;
  share: number;
  given: null;
} => ({ p10, p50: (p10 + p90) / 2, p90, mean: (p10 + p90) / 2, share: 1, given: null });

describe('pickFuzzyMetrics', () => {
  it('rule 1201: an impact draw names finalCraterDiameter and firestormIgnition, in that order, with the nominal ring colours', () => {
    const mc: ActiveMonteCarlo = {
      type: 'impact',
      data: {
        iterations: 1_000,
        metrics: {
          kineticEnergy: summary(1, 2),
          kineticEnergyMt: summary(1, 2),
          finalCraterDiameter: summary(1_000, 2_000),
          ejectaEdge1m: summary(1, 2),
          firestormIgnition: summary(500, 900),
          seismicMagnitude: summary(1, 2),
          craterOutOfDomain: summary(0, 0),
        },
        rawSamples: {
          finalCraterDiameter: [1_000, 1_500, 2_000],
        },
      },
    };
    const picked = pickFuzzyMetrics(mc);
    expect(picked.map((m) => m.metricKey)).toEqual(['finalCraterDiameter', 'firestormIgnition']);
    expect(picked[0]?.color).toBe(RING_COLORS.craterRim);
    expect(picked[1]?.color).toBe(RING_COLORS.thirdDegreeBurn);
    // finalCraterDiameter is a diameter: the halo radius is half the
    // metric's own p10/p90, which firestormIgnition (already a radius)
    // is not.
    expect(picked[0]?.p10).toBeCloseTo(500, 9);
    expect(picked[0]?.p90).toBeCloseTo(1_000, 9);
    expect(picked[0]?.scale).toBe('diameter');
    expect(picked[1]?.p10).toBe(500);
    expect(picked[1]?.p90).toBe(900);
    expect(picked[1]?.scale).toBe('radius');
    // Only finalCraterDiameter carried raw samples in this fixture.
    expect(picked[0]?.samples).toEqual([1_000, 1_500, 2_000]);
    expect(picked[1]?.samples).toBeUndefined();
  });

  it('an earthquake draw uses the MMI ring colours, not the impact palette', () => {
    const mc: ActiveMonteCarlo = {
      type: 'earthquake',
      data: {
        iterations: 200,
        metrics: {
          magnitude: summary(6, 7),
          ruptureLength: summary(1, 2),
          pgaAt20kmNGA: summary(1, 2),
          mmiAtEpicenter: summary(1, 2),
          mmi8Radius: summary(10_000, 20_000),
          liquefactionRadius: summary(1_000, 3_000),
        },
        rawSamples: {},
      },
    };
    const picked = pickFuzzyMetrics(mc);
    expect(picked.map((m) => m.metricKey)).toEqual(['mmi8Radius', 'liquefactionRadius']);
    expect(picked[0]?.color).toBe(MMI_RING_COLORS.mmi8);
    expect(picked[1]?.color).toBe(MMI_RING_COLORS.mmi7);
  });
});

describe('rule 1217: the glow as geodesic discs, and every halo with its card', () => {
  /** The opacity the stacked discs give at a distance r. */
  const stackedAlpha = (discs: { radiusM: number; alpha: number }[], r: number): number =>
    1 - discs.filter((d) => d.radiusM > r).reduce((keep, d) => keep * (1 - d.alpha), 1);

  it('reads the peak where every draw reaches, nothing where none does, and falls in between', () => {
    const samples = Array.from({ length: 1_000 }, (_, i) => 100_000 + i * 1_000);
    const discs = ecdfDiscs(samples);
    expect(stackedAlpha(discs, 0)).toBeCloseTo(ECDF_MAX_ALPHA, 9);
    expect(stackedAlpha(discs, 2_000_000)).toBe(0);
    let last = Infinity;
    for (let r = 0; r <= 1_200_000; r += 50_000) {
      const a = stackedAlpha(discs, r);
      expect(a).toBeLessThanOrEqual(last);
      last = a;
    }
    // Half the draws reach the median: the stack reads 1 − (1 − peak)^½.
    expect(stackedAlpha(discs, 599_000)).toBeCloseTo(1 - Math.sqrt(1 - ECDF_MAX_ALPHA), 1);
  });

  it('keeps a draw that reaches nowhere in the count, and draws no disc for it', () => {
    const samples = [0, 0, 0, 0, 0, 1_000, 2_000, 3_000, 4_000, 5_000];
    const discs = ecdfDiscs(samples, 10);
    expect(discs.every((d) => d.radiusM > 0)).toBe(true);
    // Half the draws reach nothing, so the centre is half as dark.
    expect(stackedAlpha(discs, 0)).toBeCloseTo(1 - Math.sqrt(1 - ECDF_MAX_ALPHA), 9);
  });

  it('gives each halo and each glow a card, exploratory, in metres on the ellipsoid', () => {
    const mc: ActiveMonteCarlo = {
      type: 'impact',
      data: {
        iterations: 1_000,
        metrics: {
          kineticEnergy: summary(1, 2),
          kineticEnergyMt: summary(1, 2),
          finalCraterDiameter: summary(1_000, 2_000),
          ejectaEdge1m: summary(1, 2),
          firestormIgnition: summary(500, 900),
          seismicMagnitude: summary(1, 2),
          craterOutOfDomain: summary(0, 0),
        },
        rawSamples: { finalCraterDiameter: [1_000, 1_500, 2_000] },
      },
    };
    const keyOnly = ((key: string) => key) as unknown as TFunction;
    const cards = monteCarloCards(mc, pickFuzzyMetrics(mc), keyOnly, 'en');
    expect(cards.map((c) => c.id)).toEqual([
      'finalCraterDiameter-halo',
      'finalCraterDiameter-glow',
      'firestormIgnition-halo',
    ]);
    expect(cards.every((c) => c.card.state === 'exploratory')).toBe(true);
    expect(cards[1]?.card.beyond).toBe('computedZero');
    expect(cards[0]?.card.beyond).toBe('notApplicable');
  });
});
