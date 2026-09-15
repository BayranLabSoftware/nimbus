import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { casualtyPlanForResult, configureCountryLookup } from '../../../store/useAppStore.js';
import { estimateCasualties, pagerFatalityRate, shakingCasualtyPlan } from '../../casualties.js';
import { earthquakeSampler } from '../../montecarlo/earthquakeMonteCarlo.js';
import { mulberry32 } from '../../montecarlo/sampling.js';
import { pagerVulnerabilityFor } from '../../pagerVulnerability.js';
import { m } from '../../units.js';
import { distanceForPgaNGAWest2, type NGAFaultType } from './attenuation.js';
import { pgaFromMercalliIntensity } from './intensity.js';
import {
  simulateEarthquake,
  type EarthquakeScenarioInput,
  type EarthquakeScenarioResult,
  type LowIntensityDeaths,
} from './simulate.js';

/**
 * Rule 46 of validation/lowIntensityRules.ts, held before any score: each
 * candidate toll draws the V and VI rings at 5.0 and 6.0 as the rings at
 * 7, 8 and 9 are drawn, counts above VII exactly the deaths the toll in
 * place counts, and below it the rate its rule names — 5.5 and 6.5 for
 * `midBand`, 5 and 6 for `pager`. A scenario that names no toll counts the
 * one in place.
 */

const CANDIDATES = ['midBand', 'pager'] as const satisfies readonly LowIntensityDeaths[];

const RATE_AT: Readonly<Record<(typeof CANDIDATES)[number], { v: number; vi: number }>> = {
  midBand: { v: 5.5, vi: 6.5 },
  pager: { v: 5, vi: 6 },
};

const SCENARIOS: readonly EarthquakeScenarioInput[] = [
  { magnitude: 5.0, depth: m(10_000), faultType: 'strike-slip' },
  { magnitude: 5.4, depth: m(8_000), faultType: 'normal', vs30: 300 },
  { magnitude: 6.4, depth: m(20_000), faultType: 'reverse', vs30: 450 },
  { magnitude: 7.1, depth: m(15_000), faultType: 'all' },
  { magnitude: 7.8, depth: m(25_000), faultType: 'reverse', vs30: 350, strikeAzimuthDeg: 40 },
  { magnitude: 9.0, depth: m(30_000), faultType: 'reverse', subductionInterface: true },
];

/** Somewhere in Iran, whose country curve is PAGER's own. */
const HERE = { latitude: 35.7, longitude: 51.4 };
const VULNERABILITY = pagerVulnerabilityFor('IR');

beforeAll(() => {
  configureCountryLookup(() => 'IR');
});
afterAll(() => {
  configureCountryLookup(null);
});

const planOf = (data: EarthquakeScenarioResult) =>
  casualtyPlanForResult({ type: 'earthquake', data }, HERE);

const ngaFault = (s: EarthquakeScenarioInput): NGAFaultType =>
  s.faultType === undefined || s.faultType === 'all' ? 'unspecified' : s.faultType;

/** A hundred people to the square kilometre, everywhere. */
const evenly = (radiiM: readonly number[]): number[] =>
  radiiM.map((r) => (100 * Math.PI * r * r) / 1e6);

describe('rule 46: the dead below MMI VII', () => {
  it('draws V and VI at 5.0 and 6.0 as it draws VII to IX, and moves nothing else', () => {
    for (const s of SCENARIOS) {
      const none = simulateEarthquake(s);
      expect(none.shaking.mmi5Radius).toBeUndefined();
      expect(none.shaking.mmi6Radius).toBeUndefined();
      const site = { magnitude: s.magnitude, faultType: ngaFault(s), vs30: s.vs30 ?? 760 };
      const at = (mmi: number): number =>
        distanceForPgaNGAWest2(site, pgaFromMercalliIntensity(mmi));
      for (const toll of CANDIDATES) {
        const low = simulateEarthquake({ ...s, lowIntensityDeaths: toll });
        const { mmi5Radius, mmi6Radius, ...above } = low.shaking;
        expect({ ...low, inputs: none.inputs, shaking: above }).toEqual(none);
        expect(mmi5Radius).toBe(at(5));
        expect(mmi6Radius).toBe(at(6));
        expect(low.shaking.mmi7Radius).toBe(at(7));
        expect(low.shaking.mmi9Radius).toBe(at(9));
        expect(mmi5Radius as number).toBeGreaterThan(mmi6Radius as number);
      }
    }
  });

  it('counts above VII exactly the deaths in place, and below it the rate its rule names', () => {
    let belowCounted = 0;
    for (const s of SCENARIOS) {
      const none = simulateEarthquake(s);
      const inPlace = planOf(none);
      const inPlaceBands = inPlace?.bands ?? [];
      const inPlaceDeaths = estimateCasualties(
        { model: 'shaking', bands: inPlaceBands },
        evenly(inPlaceBands.map((b) => b.outerRadiusM))
      );
      for (const toll of CANDIDATES) {
        const low = simulateEarthquake({ ...s, lowIntensityDeaths: toll });
        const plan = planOf(low);
        expect(plan).not.toBeNull();
        if (plan === null) continue;
        const above = plan.bands.filter((b) => ['mmi9', 'mmi8', 'mmi7'].includes(b.key));
        expect(above).toEqual(inPlaceBands);
        expect(plan.bands.slice(0, above.length)).toEqual(above);

        const r7 = Math.max(low.shaking.mmi7Radius, low.shaking.mmi8Radius, low.shaking.mmi9Radius);
        const r6 = Math.max(r7, low.shaking.mmi6Radius as number);
        const r5 = Math.max(r6, low.shaking.mmi5Radius as number);
        const below = plan.bands.slice(above.length);
        const expected = [
          { key: 'mmi6', inner: r7, outer: r6, rate: RATE_AT[toll].vi },
          { key: 'mmi5', inner: r6, outer: r5, rate: RATE_AT[toll].v },
        ].filter((b) => b.outer > b.inner);
        expect(below.map((b) => [b.key, b.innerRadiusM, b.outerRadiusM])).toEqual(
          expected.map((b) => [b.key, b.inner, b.outer])
        );
        for (const [i, b] of below.entries()) {
          const rate = expected[i]?.rate ?? Number.NaN;
          expect(b.mortality).toBe(pagerFatalityRate(rate, VULNERABILITY.mid));
          expect(b.mortalityLow).toBe(pagerFatalityRate(rate, VULNERABILITY.low));
          expect(b.mortalityHigh).toBe(pagerFatalityRate(rate, VULNERABILITY.high));
        }

        const cumulative = evenly(plan.bands.map((b) => b.outerRadiusM));
        const deaths = estimateCasualties(plan, cumulative);
        expect(deaths.bands.slice(0, above.length)).toEqual(inPlaceDeaths.bands);
        for (const [i, b] of deaths.bands.entries()) {
          if (i < above.length) continue;
          const people = (cumulative[i] ?? 0) - (cumulative[i - 1] ?? 0);
          const rate = expected[i - above.length]?.rate ?? Number.NaN;
          expect(b.deaths).toBe(Math.round(people * pagerFatalityRate(rate, VULNERABILITY.mid)));
          belowCounted += b.deaths;
        }
      }
    }
    expect(belowCounted).toBeGreaterThan(0);
  });

  it('gives an earthquake with a V ring and no VII ring a toll', () => {
    const quiet = simulateEarthquake(SCENARIOS[0]!);
    expect(quiet.shaking.mmi7Radius).toBe(0);
    expect(planOf(quiet)).toBeNull();
    for (const toll of CANDIDATES) {
      const low = simulateEarthquake({
        ...SCENARIOS[0]!,
        lowIntensityDeaths: toll,
      });
      expect(low.shaking.mmi5Radius as number).toBeGreaterThan(0);
      expect(planOf(low)?.bands.map((b) => b.key)).toEqual(['mmi6', 'mmi5']);
      expect(
        shakingCasualtyPlan({
          mmi5Radius: m(9_000),
          mmi6Radius: m(0),
          mmi7Radius: m(0),
          mmi8Radius: m(0),
          mmi9Radius: m(0),
          lowIntensity: toll,
        })?.bands.map((b) => [b.key, b.innerRadiusM, b.outerRadiusM])
      ).toEqual([['mmi5', 0, 9_000]]);
    }
    expect(
      shakingCasualtyPlan({
        mmi5Radius: m(9_000),
        mmi6Radius: m(3_000),
        mmi7Radius: m(0),
        mmi8Radius: m(0),
        mmi9Radius: m(0),
      })
    ).toBeNull();
  });

  it('counts the toll in place when the scenario names none, and on PAGER’s banding its own', () => {
    for (const s of SCENARIOS) {
      const unnamed = simulateEarthquake(s);
      const named = simulateEarthquake({ ...s, lowIntensityDeaths: 'none' });
      expect(unnamed).toEqual({ ...named, inputs: unnamed.inputs });
      expect(planOf(unnamed)).toEqual(planOf(named));
      const pager = simulateEarthquake({ ...s, intensityBanding: 'pager' });
      for (const toll of CANDIDATES) {
        const both = simulateEarthquake({
          ...s,
          intensityBanding: 'pager',
          lowIntensityDeaths: toll,
        });
        expect(both).toEqual({ ...pager, inputs: both.inputs });
        expect(planOf(both)).toEqual(planOf(pager));
      }
    }
  });

  it('is kept by every realisation the toll band draws', () => {
    const rng = mulberry32('rule 46');
    for (const toll of CANDIDATES) {
      const nominal = { ...SCENARIOS[2]!, lowIntensityDeaths: toll };
      expect(earthquakeSampler(nominal)(rng).lowIntensityDeaths).toBe(toll);
    }
  });
});
