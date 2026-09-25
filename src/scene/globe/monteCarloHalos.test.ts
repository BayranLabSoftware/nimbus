import { describe, expect, it } from 'vitest';
import type { ActiveMonteCarlo } from '../../store/index.js';
import { MMI_RING_COLORS, RING_COLORS, pickFuzzyMetrics } from './monteCarloHalos.js';

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
