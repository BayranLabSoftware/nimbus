import { Color } from 'cesium';
import type { ImpactDamageRadii } from '../../physics/events/impact/damageRings.js';
import type { ActiveMonteCarlo } from '../../store/index.js';

/**
 * The palette and the metric picker for the Monte Carlo P10/P90 halos
 * `Globe.tsx` draws and `RingLegend.tsx` (rule 1201) names. Split out of
 * `Globe.tsx` itself so the legend — a plain React component, not a Cesium
 * scene — can call `pickFuzzyMetrics` without pulling in every other Cesium
 * entity builder that file has no need of: `Globe.tsx` exporting a function
 * used by `RingLegend.tsx` tripped `react-refresh/only-export-components`,
 * which is the linter's own way of saying that sharing code between
 * components wants a file that is not itself a component.
 */

/** Rule 1201: the nominal-ring colours a Monte Carlo halo borrows, so the
 *  halo reads as "uncertainty around this ring" rather than a colour of
 *  its own to learn. Exported (moved here from `Globe.tsx`, which reads
 *  it for every OTHER impact ring too) so both files share one table
 *  instead of two that could drift apart; mirrors `RingLegend.tsx`'s
 *  SWATCH table exactly — moving a colour wants moving it in both. */
export const RING_COLORS: Record<keyof ImpactDamageRadii, Color> = {
  craterRim: Color.fromCssColorString('#B91C1C'),
  thirdDegreeBurn: Color.fromCssColorString('#F97316'),
  secondDegreeBurn: Color.fromCssColorString('#FB923C'),
  overpressure5psi: Color.fromCssColorString('#FACC15'),
  overpressure1psi: Color.fromCssColorString('#FDE047'),
  lightDamage: Color.fromCssColorString('#FEF3C7'),
};

export const MMI_RING_COLORS = {
  mmi9: Color.fromCssColorString('#7F1D1D'),
  mmi8: Color.fromCssColorString('#DC2626'),
  mmi7: Color.fromCssColorString('#FB923C'),
} as const;

export const PYROCLASTIC_RING_COLOR = Color.fromCssColorString('#E11D48');

/** Chosen, for an impact, to draw a P10/P90 halo and the underlying
 *  probability heatmap. Exported so `RingLegend.tsx` can name exactly the
 *  metrics this function chose, from the same call, rather than guessing
 *  at a second copy of this switch. */
export interface FuzzyMetric {
  p10: number;
  p90: number;
  color: Color;
  /** Sorted ascending raw samples behind this metric. Optional —
   *  only populated when the MC engine returned them (Phase 8c).
   *  Used to render the radial ECDF heatmap underneath the
   *  deterministic ring. */
  samples?: readonly number[];
  /** True when the metric is a *radius* in metres, false when it is
   *  a diameter (e.g. finalCraterDiameter). Drives the per-sample
   *  ÷2 transform used for the ECDF bitmap. */
  scale: 'radius' | 'diameter';
  /** Rule 1201: the Monte Carlo metric's own field name
   *  (`mc.data.metrics.<metricKey>`), so a caller that only wants to
   *  NAME what is drawn — the legend — does not need this switch's
   *  own logic duplicated to know which two metrics were picked. */
  metricKey: string;
}

/**
 * Choose up to two representative MC metrics whose P10/P90 percentiles
 * are worth painting as fuzzy uncertainty bands on the globe. Each
 * spec carries the radius pair (m) and the colour to use; the colour
 * matches the nominal-result ring of the same physical quantity so
 * the eye reads "halo around the deterministic ring" rather than
 * "extra rings to memorise".
 *
 * Why two and not all of them: rendering P10/P90 for every metric
 * blows past visual budget — four impact metrics × two percentiles
 * = eight extra rings on a busy globe. We pick the metric the user
 * most often asks "how confident are we about this?" about.
 */
export function pickFuzzyMetrics(mc: ActiveMonteCarlo): FuzzyMetric[] {
  switch (mc.type) {
    case 'impact':
      return [
        {
          p10: mc.data.metrics.finalCraterDiameter.p10 / 2,
          p90: mc.data.metrics.finalCraterDiameter.p90 / 2,
          color: RING_COLORS.craterRim,
          ...(mc.data.rawSamples.finalCraterDiameter !== undefined && {
            samples: mc.data.rawSamples.finalCraterDiameter,
          }),
          scale: 'diameter',
          metricKey: 'finalCraterDiameter',
        },
        {
          p10: mc.data.metrics.firestormIgnition.p10,
          p90: mc.data.metrics.firestormIgnition.p90,
          color: RING_COLORS.thirdDegreeBurn,
          ...(mc.data.rawSamples.firestormIgnition !== undefined && {
            samples: mc.data.rawSamples.firestormIgnition,
          }),
          scale: 'radius',
          metricKey: 'firestormIgnition',
        },
      ];
    case 'explosion':
      return [
        {
          p10: mc.data.metrics.fivePsiRadius.p10,
          p90: mc.data.metrics.fivePsiRadius.p90,
          color: RING_COLORS.overpressure5psi,
          ...(mc.data.rawSamples.fivePsiRadius !== undefined && {
            samples: mc.data.rawSamples.fivePsiRadius,
          }),
          scale: 'radius',
          metricKey: 'fivePsiRadius',
        },
        {
          p10: mc.data.metrics.onePsiRadius.p10,
          p90: mc.data.metrics.onePsiRadius.p90,
          color: RING_COLORS.overpressure1psi,
          ...(mc.data.rawSamples.onePsiRadius !== undefined && {
            samples: mc.data.rawSamples.onePsiRadius,
          }),
          scale: 'radius',
          metricKey: 'onePsiRadius',
        },
      ];
    case 'earthquake':
      return [
        {
          p10: mc.data.metrics.mmi8Radius.p10,
          p90: mc.data.metrics.mmi8Radius.p90,
          color: MMI_RING_COLORS.mmi8,
          ...(mc.data.rawSamples.mmi8Radius !== undefined && {
            samples: mc.data.rawSamples.mmi8Radius,
          }),
          scale: 'radius',
          metricKey: 'mmi8Radius',
        },
        {
          p10: mc.data.metrics.liquefactionRadius.p10,
          p90: mc.data.metrics.liquefactionRadius.p90,
          color: MMI_RING_COLORS.mmi7,
          ...(mc.data.rawSamples.liquefactionRadius !== undefined && {
            samples: mc.data.rawSamples.liquefactionRadius,
          }),
          scale: 'radius',
          metricKey: 'liquefactionRadius',
        },
      ];
    case 'volcano':
      return [
        {
          p10: mc.data.metrics.pyroclasticRunout.p10,
          p90: mc.data.metrics.pyroclasticRunout.p90,
          color: PYROCLASTIC_RING_COLOR,
          ...(mc.data.rawSamples.pyroclasticRunout !== undefined && {
            samples: mc.data.rawSamples.pyroclasticRunout,
          }),
          scale: 'radius',
          metricKey: 'pyroclasticRunout',
        },
      ];
  }
}
