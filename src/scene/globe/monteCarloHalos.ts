import { Color } from 'cesium';
import type { TFunction } from 'i18next';
import type { ImpactDamageRadii } from '../../physics/events/impact/damageRings.js';
import { IMPACT_INPUT_SIGMA } from '../../physics/uq/conventions.js';
import type { ActiveMonteCarlo } from '../../store/index.js';
import { formatRange, rangeUnit } from './impactFieldMap.js';
import type { ProvenanceCard } from './mapGrammarRules.js';

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

/** Rule 1217: how many discs the glow is drawn as, and its peak opacity —
 *  the opacity the old canvas painted where every draw reached. */
export const ECDF_DISC_STEPS = 16;
export const ECDF_MAX_ALPHA = 0.35;

/**
 * Rule 1217: the glow under a halo as geodesic discs, not a canvas stretched
 * over degrees. One disc at each (j − ½)/N quantile of the draws, every disc
 * of the one opacity a that stacks to `maxAlpha` where all N overlap, so at a
 * distance reached by a share E of the draws the stack reads
 * 1 − (1 − maxAlpha)^E: the peak where every draw reaches, nothing where
 * none does. A disc of no radius — a draw that reaches nowhere, a crater
 * that is not dug — is left out, and keeps its place in the count.
 */
export function ecdfDiscs(
  samples: readonly number[],
  steps: number = ECDF_DISC_STEPS,
  maxAlpha: number = ECDF_MAX_ALPHA
): { radiusM: number; alpha: number }[] {
  const sorted = samples.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (sorted.length === 0 || steps < 1) return [];
  const alpha = 1 - Math.pow(1 - maxAlpha, 1 / steps);
  const out: { radiusM: number; alpha: number }[] = [];
  for (let j = 1; j <= steps; j++) {
    const at = Math.round(((j - 0.5) / steps) * (sorted.length - 1));
    const radiusM = sorted[Math.min(sorted.length - 1, Math.max(0, at))] ?? 0;
    if (radiusM > 0) out.push({ radiusM, alpha });
  }
  return out;
}

/** Rule 1217: one halo, or its glow, with rule 1029's five fields. */
export interface MonteCarloCard {
  id: string;
  label: string;
  card: ProvenanceCard;
}

/** Rule 1217: the cards of what an impact's Monte Carlo draws on the globe —
 *  each halo, and its glow where the draws are there to draw it. */
export function monteCarloCards(
  mc: ActiveMonteCarlo,
  metrics: readonly FuzzyMetric[],
  t: TFunction,
  language: string
): MonteCarloCard[] {
  const km = (m: number): string => formatRange(m, language);
  const sigma = {
    diameter: IMPACT_INPUT_SIGMA.diameter.sigma.toLocaleString(language),
    density: IMPACT_INPUT_SIGMA.density.sigma.toLocaleString(language),
    speed: (IMPACT_INPUT_SIGMA.velocity.sigma * 100).toLocaleString(language),
  };
  const out: MonteCarloCard[] = [];
  for (const metric of metrics) {
    const name = t(`globe.legend.monteCarlo.metric.${metric.metricKey}`);
    out.push({
      id: `${metric.metricKey}-halo`,
      label: name,
      card: {
        quantity: t('globe.legend.monteCarlo.card.haloQuantity', { metric: name }),
        unit: rangeUnit(metric.p90),
        state: 'exploratory',
        source: t('globe.legend.monteCarlo.card.source', {
          runs: mc.data.iterations.toLocaleString(language),
          ...sigma,
        }),
        extent: t('globe.legend.monteCarlo.card.haloExtent', {
          p10: km(metric.p10),
          p90: km(metric.p90),
        }),
        beyond: 'notApplicable',
      },
    });
    if (metric.samples === undefined || metric.samples.length === 0) continue;
    const radii = metric.scale === 'diameter' ? metric.samples.map((x) => x / 2) : metric.samples;
    const max = Math.max(...radii.filter((x) => Number.isFinite(x)));
    out.push({
      id: `${metric.metricKey}-glow`,
      label: t('globe.legend.monteCarlo.card.glowLabel', { metric: name }),
      card: {
        quantity: t('globe.legend.monteCarlo.card.glowQuantity', { metric: name }),
        unit: rangeUnit(max),
        state: 'exploratory',
        source: t('globe.legend.monteCarlo.card.source', {
          runs: mc.data.iterations.toLocaleString(language),
          ...sigma,
        }),
        extent: t('globe.legend.monteCarlo.card.glowExtent', {
          max: km(max),
          steps: ECDF_DISC_STEPS.toLocaleString(language),
        }),
        beyond: 'computedZero',
      },
    });
  }
  return out;
}
