import { describe, expect, it } from 'vitest';
import {
  bandFromPlans,
  exposureCurve,
  populationWithin,
  resampleResult,
  sampleScenarioPlans,
  sampledTollBand,
  samplingFootprints,
  withPredictiveBand,
  type ExposurePoint,
} from './tollBand.js';
import {
  blastCasualtyPlan,
  estimateCasualties,
  nuclearFireballRadius,
  type CasualtyPlan,
} from '../casualties.js';
import { mulberry32 } from '../montecarlo/sampling.js';
import { m } from '../units.js';
import {
  EXPLOSION_PRESETS,
  simulateExplosion,
  type ExplosionScenarioInput,
} from '../events/explosion/simulate.js';
import {
  casualtyPlanForResult,
  configureCountryLookup,
  type ActiveResult,
} from '../../store/useAppStore.js';
import { EARTHQUAKE_PRESETS, simulateEarthquake } from '../events/earthquake/simulate.js';

const explosion = (
  input: ExplosionScenarioInput = EXPLOSION_PRESETS.HIROSHIMA_1945.input
): ActiveResult => ({
  type: 'explosion',
  data: simulateExplosion(input),
});

/** The application's blast plan, without going through the store. */
const planFor = (result: ActiveResult): CasualtyPlan | null => {
  if (result.type !== 'explosion') return null;
  const d = result.data;
  return blastCasualtyPlan({
    blastEnergy: d.yield.joules,
    overpressure5psiRadius: d.blast.overpressure5psiRadiusHob,
    overpressure1psiRadius: d.blast.overpressure1psiRadiusHob,
    thirdDegreeBurnRadius: d.thermal.thirdDegreeBurnRadius,
    secondDegreeBurnRadius: d.thermal.secondDegreeBurnRadius,
    firestormRadius: d.firestorm.sustainRadius,
    fireballRadius: nuclearFireballRadius(d.yield.joules),
    ...(d.inputs.chargeType !== undefined && { chargeType: d.inputs.chargeType }),
  });
};

/** A city of uniform density: the answer the interpolation should
 *  reproduce exactly, since a uniform disc is linear in r². */
const uniform =
  (perKm2: number) =>
  (radiusM: number): number =>
    perKm2 * Math.PI * (radiusM / 1000) ** 2;

describe('populationWithin', () => {
  const curve: ExposurePoint[] = [
    { radiusM: 1_000, exposed: 1_000 },
    { radiusM: 2_000, exposed: 4_000 },
    { radiusM: 4_000, exposed: 8_000 },
  ];

  it('returns the measurement itself at a measured radius', () => {
    for (const p of curve) expect(populationWithin(curve, p.radiusM)).toBeCloseTo(p.exposed, 6);
  });

  it('spreads an annulus at one density — linear in r²', () => {
    // Half way in r² between 1 km and 2 km is √2.5 km ≈ 1581 m, and
    // half the annulus's 3 000 people.
    expect(populationWithin(curve, Math.sqrt(2.5) * 1000)).toBeCloseTo(2_500, 6);
  });

  it('carries the innermost density inward as a uniform disc', () => {
    expect(populationWithin(curve, 500)).toBeCloseTo(250, 6);
    expect(populationWithin(curve, 0)).toBe(0);
  });

  it('carries the outermost annulus density outward', () => {
    // 4 000 people across the 2–4 km annulus is 4 000 / (12π km²);
    // the same density from 4 km to 6 km adds 4 000 · 20/12.
    expect(populationWithin(curve, 6_000)).toBeCloseTo(8_000 + (4_000 * 20) / 12, 6);
  });

  it('reproduces a uniform city exactly, from any two points', () => {
    const density = uniform(3_000);
    const two = exposureCurve([
      { radiusM: 5_000, exposed: density(5_000) },
      { radiusM: 20_000, exposed: density(20_000) },
    ]);
    for (const r of [1_000, 7_500, 12_000, 40_000]) {
      expect(populationWithin(two, r) / density(r)).toBeCloseTo(1, 6);
    }
  });

  it('is empty for an empty curve', () => {
    expect(populationWithin([], 1_000)).toBe(0);
  });
});

describe('exposureCurve', () => {
  it('sorts, deduplicates and refuses to go down', () => {
    const curve = exposureCurve([
      { radiusM: 4_000, exposed: 900 },
      { radiusM: 1_000, exposed: 1_000 },
      { radiusM: 4_000, exposed: 950 },
      { radiusM: 2_000, exposed: 4_000 },
      { radiusM: -5, exposed: 7 },
      { radiusM: 3_000, exposed: Number.NaN },
    ]);
    expect(curve.map((p) => p.radiusM)).toEqual([1_000, 2_000, 4_000]);
    // The raster handed back fewer people inside 4 km than inside
    // 2 km; a cumulative count that falls is noise, not a curve.
    expect(curve.map((p) => p.exposed)).toEqual([1_000, 4_000, 4_000]);
  });
});

describe('resampleResult', () => {
  it('keeps every input the sampler does not draw', () => {
    const beirut = explosion({
      yieldMegatons: 0.00275,
      chargeType: 'chemical',
      heightOfBurst: m(0),
    });
    const rng = mulberry32('beirut');
    for (let i = 0; i < 20; i++) {
      const draw = resampleResult(beirut, rng);
      expect(draw?.type).toBe('explosion');
      // A chemical charge that came back nuclear would be a
      // different weapon, and every band under it a different law.
      if (draw?.type === 'explosion') expect(draw.data.inputs.chargeType).toBe('chemical');
    }
  });

  it('has no sampler for a landslide and says so', () => {
    const rng = mulberry32(1);
    expect(
      sampleScenarioPlans({ result: { type: 'landslide' } as ActiveResult, planFor, seed: 1 })
    ).toHaveLength(0);
    expect(resampleResult({ type: 'landslide' } as ActiveResult, rng)).toBeNull();
  });
});

describe('samplingFootprints', () => {
  it('brackets every radius the draws ask for', () => {
    const plans = sampleScenarioPlans({ result: explosion(), planFor, seed: 'hiroshima' });
    expect(plans.length).toBeGreaterThan(150);
    const [inner, outer] = samplingFootprints(plans);
    expect(inner).toBeDefined();
    expect(outer).toBeDefined();
    // Five per cent of the draws may fall outside on each side; the
    // point is that the measured range covers the bulk, not that it
    // covers every last draw.
    const innermost = plans.map((p) => p.bands[0]?.outerRadiusM ?? 0).sort((a, b) => a - b);
    const outermost = plans
      .map((p) => p.bands[p.bands.length - 1]?.outerRadiusM ?? 0)
      .sort((a, b) => a - b);
    expect(inner?.radiusM).toBeLessThanOrEqual(innermost[Math.floor(plans.length * 0.1)] ?? 0);
    expect(outer?.radiusM).toBeGreaterThanOrEqual(outermost[Math.floor(plans.length * 0.9)] ?? 0);
  });
});

describe('sampledTollBand', () => {
  const result = explosion();

  it('brackets the median estimate', () => {
    const population = uniform(3_000);
    const band = sampledTollBand({ result, planFor, populationAt: population, seed: 'x' });
    expect(band).not.toBeNull();
    const plan = planFor(result);
    expect(plan).not.toBeNull();
    const central = estimateCasualties(
      plan!,
      plan!.bands.map((b) => population(b.outerRadiusM))
    );
    expect(band?.low.deaths).toBeLessThanOrEqual(central.deaths);
    expect(band?.high.deaths).toBeGreaterThanOrEqual(central.deaths);
  });

  it('is a narrower claim than the vulnerability table it replaces', () => {
    const population = uniform(3_000);
    const plan = planFor(result)!;
    const central = estimateCasualties(
      plan,
      plan.bands.map((b) => population(b.outerRadiusM))
    );
    const band = sampledTollBand({ result, planFor, populationAt: population, seed: 'x' });
    const span = (lo: number, hi: number): number => Math.log10(Math.max(hi, 1) / Math.max(lo, 1));
    expect(span(band?.low.deaths ?? 0, band?.high.deaths ?? 0)).toBeLessThan(
      span(central.deathsLow, central.deathsHigh)
    );
  });

  it('does not move between two draws of the same picture', () => {
    const population = uniform(3_000);
    const a = sampledTollBand({ result, planFor, populationAt: population, seed: 'same' });
    const b = sampledTollBand({ result, planFor, populationAt: population, seed: 'same' });
    expect(a?.low.deaths).toBe(b?.low.deaths);
    expect(a?.high.deaths).toBe(b?.high.deaths);
  });

  it('is empty where there is no sampler', () => {
    expect(bandFromPlans([], () => 1_000)).toBeNull();
  });
});

describe('withPredictiveBand', () => {
  it('makes the rows total to the ends of the band', () => {
    const population = uniform(3_000);
    const plan = planFor(explosion())!;
    const central = estimateCasualties(
      plan,
      plan.bands.map((b) => population(b.outerRadiusM))
    );
    const band = sampledTollBand({
      result: explosion(),
      planFor,
      populationAt: population,
      seed: 'total',
    });
    expect(band).not.toBeNull();
    const merged = withPredictiveBand(central, band!);
    const sum = (f: (b: (typeof merged.bands)[number]) => number): number =>
      merged.bands.reduce((acc, b) => acc + f(b), 0);
    // Rounding is per row, so a few people of slack; the point is
    // that the column adds up, which a set of per-band percentiles
    // would not — the low ends come from one realisation, whole.
    expect(sum((b) => b.deathsLow)).toBeCloseTo(merged.deathsLow, -1);
    expect(sum((b) => b.deathsHigh)).toBeCloseTo(merged.deathsHigh, -1);
    expect(merged.deaths).toBe(central.deaths);
  });
});

/**
 * The case that broke it: a draw whose rings the median has not got.
 *
 * At the ninety-fifth percentile of L'Aquila the MMI VIII contour
 * runs three times further out than the median's, so matching the
 * realisation's rings to the median's by name left its dead with
 * nowhere to land. The panel printed 24 to 1 700 under the headline
 * while the counter rising along the shaking front ended on 27 to
 * 360 — two numbers for one claim, in the same view.
 */
describe('a realisation with more rings than the median', () => {
  it('still totals to the ends of the band', () => {
    configureCountryLookup(() => 'IT');
    const result: ActiveResult = {
      type: 'earthquake',
      data: simulateEarthquake(EARTHQUAKE_PRESETS.L_AQUILA_2009.input),
    };
    const location = { latitude: 42.3498, longitude: 13.3995 };
    const quakePlan = (r: ActiveResult): CasualtyPlan | null => casualtyPlanForResult(r, location);
    const plan = quakePlan(result);
    expect(plan).not.toBeNull();
    const population = uniform(200);
    const central = estimateCasualties(
      plan!,
      plan!.bands.map((b) => population(b.outerRadiusM))
    );
    const band = sampledTollBand({
      result,
      planFor: quakePlan,
      populationAt: population,
      seed: 'aquila',
    });
    expect(band).not.toBeNull();

    // The high draw really does carry a ring the median has not: it
    // is the whole point of the row.
    expect(band!.high.bands.length).toBeGreaterThan(central.bands.length);

    const merged = withPredictiveBand(central, band!, population);
    const rows = merged.bands;
    const sum = (f: (b: (typeof rows)[number]) => number): number =>
      rows.reduce((acc, b) => acc + f(b), 0);
    const near = (got: number, want: number): void => {
      // Each row is rounded on its own, so the column can miss the
      // total by a person a row.
      expect(Math.abs(got - want)).toBeLessThanOrEqual(rows.length);
    };
    near(
      sum((b) => b.deathsLow),
      merged.deathsLow
    );
    near(
      sum((b) => b.deathsHigh),
      merged.deathsHigh
    );
    // And the hazards inside a row total to the row, because the
    // sweep on the globe adds them up one front at a time.
    for (const row of rows) {
      near(
        row.byHazard.reduce((a, h) => a + h.deathsLow, 0),
        row.deathsLow
      );
      near(
        row.byHazard.reduce((a, h) => a + h.deathsHigh, 0),
        row.deathsHigh
      );
    }
  });
});
