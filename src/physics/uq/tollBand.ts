import {
  estimateCasualties,
  type BandEstimate,
  type CasualtyEstimate,
  type CasualtyHazard,
} from '../casualties.js';
import type { CasualtyBand, CasualtyPlan } from '../casualties.js';
import { mulberry32, type Rng } from '../montecarlo/sampling.js';
import { earthquakeSampler } from '../montecarlo/earthquakeMonteCarlo.js';
import { explosionSampler } from '../montecarlo/explosionMonteCarlo.js';
import { impactSampler } from '../montecarlo/impactMonteCarlo.js';
import { volcanoSampler } from '../montecarlo/volcanoMonteCarlo.js';
import { simulateEarthquake } from '../events/earthquake/simulate.js';
import { simulateExplosion } from '../events/explosion/simulate.js';
import { simulateVolcano } from '../events/volcano/simulate.js';
import { simulateImpact } from '../simulate.js';
import type { ActiveResult } from '../../store/useAppStore.js';

/**
 * The death toll's band, as a predictive interval rather than a range
 * of parameters.
 *
 * The model prints one number and a pair beside it. Until now that
 * pair was the gentlest and the harshest setting of the vulnerability
 * table — for shaking, PAGER's best and worst building stock, three
 * orders of magnitude apart. A pair like that is not a claim about
 * this event. It contains almost any number, so it can hardly be
 * wrong, and a band that cannot be wrong tells a reader nothing.
 *
 * What a band should say is: the earth will run this scenario once,
 * and here is the range that single run is likely to land in. That
 * range comes from the scatter the literature already publishes — the
 * magnitude an agency reports, the depth a catalogue gives, the yield
 * a device actually delivers — and, for shaking, above all from the
 * ground-motion residual sigma_lnY ~ 0.5, which is the difference
 * between a median prediction and one draw of the earth.
 *
 * So: draw the scenario a few hundred times from that scatter, run
 * each draw through the same plan builder the application uses, and
 * report the fifth and ninety-fifth percentiles.
 *
 * Two things are held fixed and neither is sampled here:
 *
 *   - **The people.** Every realisation reads the same population
 *     curve, so what is sampled is the physics and not the census.
 *     The census has its own error and it belongs in its own band.
 *   - **The footprint's shape.** A realisation's contours move in and
 *     out; the shape they hug — a circle, or the stadium around a
 *     rupture — is the median event's. Second order beside a factor
 *     of two in radius, and stated rather than hidden.
 */

/** How many realisations a band is drawn from. Enough that the fifth
 *  and ninety-fifth percentiles are stable to the digit anyone reads,
 *  and few enough that a browser spends about ten milliseconds on it. */
export const TOLL_BAND_SAMPLES = 200;

/** The percentiles the band reports. */
export const TOLL_BAND_LOW_Q = 0.05;
export const TOLL_BAND_HIGH_Q = 0.95;

/** One measured point of the cumulative-population curve: the people
 *  inside the footprint whose contour radius is `radiusM`. */
export interface ExposurePoint {
  radiusM: number;
  exposed: number;
}

/** A footprint to count the people inside: a contour radius, and the
 *  polygon that radius describes when the source is not a point. */
export interface SamplingFootprint {
  radiusM: number;
  polygon?: readonly { latDeg: number; lonDeg: number }[];
}

/**
 * Cumulative population inside a contour of radius `radiusM`,
 * interpolated from the lookups that were actually made.
 *
 * The product queries the population backend once per band — three or
 * four footprints, tens of seconds each. It cannot afford one query
 * per realisation, and it does not need to: between two measured
 * radii the only thing a realisation asks is how many people live in
 * the annulus, and the honest reading of two measurements is that the
 * annulus between them has one density throughout. That makes the
 * cumulative count linear in r-squared, which is what this is.
 *
 * Outside the measured range the same rule continues: the innermost
 * disc keeps its own mean density inward, the outermost annulus keeps
 * its density outward. Extrapolating like that is where this loses
 * its grip — a volcano measured only across its own flanks will not
 * know about the city on the plain — so the caller is expected to
 * measure the range its realisations actually reach. See
 * {@link samplingFootprints}.
 */
export function populationWithin(curve: readonly ExposurePoint[], radiusM: number): number {
  if (curve.length === 0 || radiusM <= 0) return 0;
  const first = curve[0];
  if (first === undefined) return 0;
  if (curve.length === 1 || radiusM <= first.radiusM) {
    // A uniform disc of the innermost measured density.
    if (first.radiusM <= 0) return first.exposed;
    return first.exposed * (radiusM / first.radiusM) ** 2;
  }
  for (let i = 1; i < curve.length; i++) {
    const a = curve[i - 1];
    const b = curve[i];
    if (a === undefined || b === undefined) continue;
    const span = b.radiusM ** 2 - a.radiusM ** 2;
    if (span <= 0) continue;
    if (radiusM <= b.radiusM || i === curve.length - 1) {
      // Linear in r-squared: one density across the annulus.
      const density = (b.exposed - a.exposed) / span;
      return Math.max(0, a.exposed + density * (radiusM ** 2 - a.radiusM ** 2));
    }
  }
  return curve[curve.length - 1]?.exposed ?? 0;
}

/** Sort, deduplicate and make monotone the points a lookup produced.
 *  Raster noise can hand back a smaller count for a larger circle;
 *  a cumulative curve that goes down is not a curve. */
export function exposureCurve(points: readonly ExposurePoint[]): ExposurePoint[] {
  const sorted = [...points]
    .filter((p) => Number.isFinite(p.radiusM) && p.radiusM > 0 && Number.isFinite(p.exposed))
    .sort((a, b) => a.radiusM - b.radiusM);
  const curve: ExposurePoint[] = [];
  let running = 0;
  for (const p of sorted) {
    running = Math.max(running, p.exposed);
    const last = curve[curve.length - 1];
    if (last?.radiusM === p.radiusM) {
      last.exposed = running;
      continue;
    }
    curve.push({ radiusM: p.radiusM, exposed: running });
  }
  return curve;
}

/**
 * One realisation of a scenario, drawn from the published input
 * scatter in `conventions.ts`.
 *
 * The samplers are the ones the Monte-Carlo page already uses — one
 * law per quantity, so the band under the headline and the
 * percentiles on the uncertainty page cannot drift apart. Landslides
 * have no sampler yet and return `null`, which leaves their pair as
 * it was.
 */
export function resampleResult(result: ActiveResult, rng: Rng): ActiveResult | null {
  switch (result.type) {
    case 'earthquake':
      return {
        type: 'earthquake',
        data: simulateEarthquake(earthquakeSampler(result.data.inputs)(rng)),
      };
    case 'explosion':
      return {
        type: 'explosion',
        data: simulateExplosion(explosionSampler(result.data.inputs)(rng)),
      };
    case 'impact':
      return { type: 'impact', data: simulateImpact(impactSampler(result.data.inputs)(rng)) };
    case 'volcano':
      return { type: 'volcano', data: simulateVolcano(volcanoSampler(result.data.inputs)(rng)) };
    case 'landslide':
      return null;
  }
}

/**
 * The plans of a few hundred realisations of one scenario.
 *
 * Sampled once and kept, because two different questions are asked of
 * the same draws: which radii the population has to be measured at,
 * and, once it has been, what the toll does. Drawing twice would
 * answer the second question about a different set of worlds from the
 * first.
 */
export function sampleScenarioPlans(options: {
  result: ActiveResult;
  planFor: (result: ActiveResult) => CasualtyPlan | null;
  /** Anything stable about this scenario. The band must not move
   *  between two renders of the same picture. */
  seed: string | number;
  samples?: number;
}): CasualtyPlan[] {
  const rng = mulberry32(options.seed);
  const plans: CasualtyPlan[] = [];
  const wanted = options.samples ?? TOLL_BAND_SAMPLES;
  for (let i = 0; i < wanted; i++) {
    const realisation = resampleResult(options.result, rng);
    if (realisation === null) return [];
    const plan = options.planFor(realisation);
    if (plan !== null) plans.push(plan);
  }
  return plans;
}

/**
 * The radii the population has to be measured at, beyond the ones the
 * median scenario already asks for.
 *
 * A realisation's rings sit inside and outside the median's, and past
 * the outermost measurement the curve is guessing: it carries the
 * density of the last annulus outward, which on a volcano is the
 * density of its own empty flanks. Measured against the raster, that
 * cost Pinatubo's high end a factor of 2.7 — the band was a statement
 * about the interpolation rather than about the eruption.
 *
 * Two more lookups fix it. The innermost ring's fifth percentile and
 * the outermost ring's ninety-fifth bracket every radius the draws
 * ask for, so nothing outside the measured range is ever consulted
 * and every realisation reads an interpolation between two counts.
 * Measured again with those two in place, Pinatubo's band moves by
 * nothing at all and the worst row left is 1.37x.
 */
export function samplingFootprints(plans: readonly CasualtyPlan[]): SamplingFootprint[] {
  if (plans.length === 0) return [];
  const inner: CasualtyBand[] = [];
  const outer: CasualtyBand[] = [];
  for (const plan of plans) {
    const first = plan.bands[0];
    const last = plan.bands[plan.bands.length - 1];
    if (first !== undefined) inner.push(first);
    if (last !== undefined) outer.push(last);
  }
  const byRadius = (a: CasualtyBand, b: CasualtyBand): number => a.outerRadiusM - b.outerRadiusM;
  inner.sort(byRadius);
  outer.sort(byRadius);
  const pick = (bands: CasualtyBand[], q: number): SamplingFootprint | null => {
    if (bands.length === 0) return null;
    const i = Math.min(bands.length - 1, Math.max(0, Math.round(q * (bands.length - 1))));
    const band = bands[i];
    if (band === undefined || !(band.outerRadiusM > 0)) return null;
    // The same footprint the band would have had — a stadium round a
    // rupture is not the circle of its own contour radius, and a
    // curve mixing the two would not be a curve.
    return {
      radiusM: band.outerRadiusM,
      ...(band.polygon !== undefined && { polygon: band.polygon }),
    };
  };
  return [pick(inner, TOLL_BAND_LOW_Q), pick(outer, TOLL_BAND_HIGH_Q)].filter(
    (f): f is SamplingFootprint => f !== null
  );
}

/** The two realisations that bracket the middle 90 % of the toll. */
export interface PredictiveBand {
  low: CasualtyEstimate;
  high: CasualtyEstimate;
  samples: number;
}

/**
 * The fifth and ninety-fifth percentile realisations of a scenario.
 *
 * Note what is returned: not the fifth percentile of every column
 * taken separately, but *the realisation* whose total sits at the
 * fifth percentile, whole. Percentiles do not add up — the fifth
 * percentiles of four bands are not the fifth percentile of their
 * sum — so a table built column by column would print rows that
 * refuse to total. A realisation always totals, because it happened.
 */
export function bandFromPlans(
  plans: readonly CasualtyPlan[],
  populationAt: (radiusM: number) => number
): PredictiveBand | null {
  if (plans.length === 0) return null;
  const draws = plans.map((plan) =>
    estimateCasualties(
      plan,
      plan.bands.map((band) => populationAt(band.outerRadiusM))
    )
  );
  draws.sort((a, b) => a.deaths - b.deaths);
  const at = (q: number): CasualtyEstimate | undefined =>
    draws[Math.min(draws.length - 1, Math.max(0, Math.round(q * (draws.length - 1))))];
  const low = at(TOLL_BAND_LOW_Q);
  const high = at(TOLL_BAND_HIGH_Q);
  if (low === undefined || high === undefined) return null;
  return { low, high, samples: draws.length };
}

/** Draw the realisations and read the band off them in one call, for
 *  callers that can measure the population at any radius. */
export function sampledTollBand(options: {
  result: ActiveResult;
  planFor: (result: ActiveResult) => CasualtyPlan | null;
  populationAt: (radiusM: number) => number;
  seed: string | number;
  samples?: number;
}): PredictiveBand | null {
  return bandFromPlans(sampleScenarioPlans(options), options.populationAt);
}

/**
 * Graft a predictive band onto the median estimate.
 *
 * The central column — deaths, injured, population, mortality — stays
 * the median's. Only the low and high slots change, and they take the
 * whole of their realisation: the total, the delayed deaths, each
 * band, each hazard within it. The counter that ticks up along the
 * blast front therefore ends exactly on the panel's figure, because
 * the two are reading the same three worlds.
 */
export function withPredictiveBand(
  central: CasualtyEstimate,
  band: PredictiveBand,
  populationWithinM?: (radiusM: number) => number
): CasualtyEstimate {
  const weightBetween =
    populationWithinM === undefined
      ? (fromM: number, toM: number): number => Math.max(0, toM ** 2 - fromM ** 2)
      : (fromM: number, toM: number): number =>
          Math.max(0, populationWithinM(toM) - populationWithinM(fromM));
  const low = foldOnto(central.bands, band.low, weightBetween);
  const high = foldOnto(central.bands, band.high, weightBetween);
  const sum = (m: Map<CasualtyHazard, number>): number => {
    let acc = 0;
    for (const v of m.values()) acc += v;
    return Math.round(acc);
  };
  return {
    ...central,
    predictiveBand: true,
    deathsLow: band.low.deaths,
    deathsHigh: band.high.deaths,
    delayedDeathsLow: band.low.delayedDeaths,
    delayedDeathsHigh: band.high.delayedDeaths,
    bands: central.bands.map((b, i) => {
      const l = low[i] ?? new Map<CasualtyHazard, number>();
      const h = high[i] ?? new Map<CasualtyHazard, number>();
      const hazards: CasualtyHazard[] = [...b.byHazard.map((x) => x.hazard)];
      for (const hz of [...l.keys(), ...h.keys()]) {
        if (!hazards.includes(hz)) hazards.push(hz);
      }
      return {
        ...b,
        deathsLow: sum(l),
        deathsHigh: sum(h),
        byHazard: hazards.map((hz) => ({
          hazard: hz,
          deaths: b.byHazard.find((x) => x.hazard === hz)?.deaths ?? 0,
          deathsLow: Math.round(l.get(hz) ?? 0),
          deathsHigh: Math.round(h.get(hz) ?? 0),
        })),
      };
    }),
  };
}

/**
 * Spread one realisation's rings over the median's, by where they
 * are rather than by what they are called.
 *
 * A larger draw carries rings the median has not got and a smaller
 * one is missing rings the median has: at the ninety-fifth percentile
 * of L'Aquila the MMI VIII contour runs three times further out than
 * the median's, so there is no row to put its dead in. Matching by
 * name drops them, and the rows then fall short of the total they are
 * meant to add up to — the panel printed 24 to 1 700 under the
 * headline while the counter rising along the shaking front ended on
 * 27 to 360.
 *
 * So every ring is spread across the median bands it overlaps, in
 * proportion to the people living in each overlap, and whatever
 * reaches past the outermost band is counted there. The dead are
 * placed at about the radius they died at, nothing is lost, and the
 * column totals to the end of the band.
 */
function foldOnto(
  central: readonly BandEstimate[],
  realisation: CasualtyEstimate,
  weightBetween: (fromM: number, toM: number) => number
): Map<CasualtyHazard, number>[] {
  const folded: Map<CasualtyHazard, number>[] = central.map(
    () => new Map<CasualtyHazard, number>()
  );
  const last = central.length - 1;
  if (last < 0) return folded;
  for (const ring of realisation.bands) {
    const a = Math.max(0, ring.innerRadiusM);
    const b = Math.max(a, ring.outerRadiusM);
    const weights = central.map((target, i) => {
      const lo = Math.max(a, i === 0 ? 0 : target.innerRadiusM);
      const hi = i === last ? b : Math.min(b, target.outerRadiusM);
      return hi > lo ? weightBetween(lo, hi) : 0;
    });
    let total = 0;
    for (const w of weights) total += w;
    // An empty overlap — every band beyond this ring, or nobody
    // living in it — still has to land somewhere: the band holding
    // its middle takes it whole.
    if (!(total > 0)) {
      const mid = (a + b) / 2;
      let i = central.findIndex((t) => mid < t.outerRadiusM);
      if (i < 0) i = last;
      weights.fill(0);
      weights[i] = 1;
      total = 1;
    }
    const parts =
      ring.byHazard.length > 0
        ? ring.byHazard.map((h) => ({ hazard: h.hazard, deaths: h.deaths }))
        : ring.hazards.slice(0, 1).map((hazard) => ({ hazard, deaths: ring.deaths }));
    for (let i = 0; i <= last; i++) {
      const share = (weights[i] ?? 0) / total;
      if (share <= 0) continue;
      const target = folded[i];
      if (target === undefined) continue;
      for (const part of parts) {
        target.set(part.hazard, (target.get(part.hazard) ?? 0) + part.deaths * share);
      }
    }
  }
  return folded;
}
