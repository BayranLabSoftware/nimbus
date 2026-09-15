import { describe, expect, it } from 'vitest';
import { simulateEarthquake, type EarthquakeScenarioInput } from '../events/earthquake/simulate.js';
import { earthquakeSampler } from '../montecarlo/earthquakeMonteCarlo.js';
import { mulberry32, sampleNormal } from '../montecarlo/sampling.js';
import { m } from '../units.js';
import { RESIDUAL_REFERENCE } from '../validation/residualReference.js';
import { EARTHQUAKE_INPUT_SIGMA } from './conventions.js';
import {
  ABRAHAMSON_2016_SLAB_TAU_PHI,
  boore2014PgaTauPhi,
  JB2009_PGA_RANGE_KM,
  jb2009Correlation,
  meanCorrelationInDisc,
  mmi7FootprintKm2,
  residualParts,
} from './groundMotionResidual.js';

/**
 * Rule 71 of validation/residualRules.ts, held before any band is drawn with
 * it: τ, φ and the correlation against OpenQuake's implementations, the mean
 * correlation over a disc against SciPy's integral, and the sampler drawing
 * the parts rule 71 names — with every other draw unchanged.
 */

describe('the parts against OpenQuake and SciPy', () => {
  it("Boore et al. 2014's τ and φ for PGA match OpenQuake's on its grid", () => {
    const rows = RESIDUAL_REFERENCE.boore2014;
    expect(rows.length).toBe(9 * 6 * 8);
    for (const [magnitude, rjbKm, vs30, tau, phi] of rows) {
      const got = boore2014PgaTauPhi(magnitude, rjbKm, vs30);
      expect(Math.abs(got.tau - tau)).toBeLessThan(1e-9);
      expect(Math.abs(got.phi - phi)).toBeLessThan(1e-9);
    }
  });

  it("Abrahamson, Gregor & Addo 2016's intraslab τ and φ match OpenQuake's", () => {
    for (const [, , tau, phi] of RESIDUAL_REFERENCE.abrahamson2016Slab) {
      expect(Math.abs(ABRAHAMSON_2016_SLAB_TAU_PHI.tau - tau)).toBeLessThan(1e-9);
      expect(Math.abs(ABRAHAMSON_2016_SLAB_TAU_PHI.phi - phi)).toBeLessThan(1e-9);
    }
  });

  it("Jayaram & Baker 2009's correlation for PGA matches OpenQuake's, in both cases", () => {
    for (const [clustered, distanceKm, reference] of RESIDUAL_REFERENCE.jb2009) {
      const range =
        clustered === 1 ? JB2009_PGA_RANGE_KM.clustered : JB2009_PGA_RANGE_KM.notClustered;
      expect(Math.abs(jb2009Correlation(distanceKm, range) - reference)).toBeLessThan(1e-12);
    }
  });

  it('the mean correlation over a disc matches the integral within one part in a million', () => {
    for (const [radiusKm, rangeKm, reference] of RESIDUAL_REFERENCE.discMeanCorrelation) {
      expect(Math.abs(meanCorrelationInDisc(radiusKm, rangeKm) / reference - 1)).toBeLessThan(1e-6);
    }
    // A disc of no size is one place, and a correlation that never decays
    // leaves the whole within-event part.
    expect(meanCorrelationInDisc(0, 40.7)).toBe(1);
    expect(meanCorrelationInDisc(50, 1e12)).toBeCloseTo(1, 9);
  });
});

describe("rule 71's parts for a scenario", () => {
  const shallow: EarthquakeScenarioInput = {
    magnitude: 6.8,
    depth: m(12_000),
    faultType: 'reverse',
    vs30: 400,
  };

  it('takes Boore et al. 2014 above 70 km, the intraslab model below, and nothing else', () => {
    const footprint = mmi7FootprintKm2(simulateEarthquake(shallow));
    const parts = residualParts(shallow, footprint);
    expect(parts?.tau).toBe(0.348);
    expect(parts?.phi).toBeCloseTo(0.495, 12);
    expect(parts?.meanCorrelation).toBe(
      meanCorrelationInDisc(Math.sqrt(footprint / Math.PI), JB2009_PGA_RANGE_KM.clustered)
    );
    const deep = { ...shallow, depth: m(120_000) };
    expect(residualParts(deep, 1_000)).toMatchObject(ABRAHAMSON_2016_SLAB_TAU_PHI);
    expect(residualParts({ ...deep, deepLaw: 'parker2022Slab' }, 1_000)).toBeNull();
    expect(residualParts({ ...shallow, intensityMeasure: 'pgv' }, 1_000)).toBeNull();
    expect(residualParts({ ...shallow, contourLaw: 'allen2012Hypocentral' }, 1_000)).toBeNull();
    expect(residualParts(shallow, 0)?.meanCorrelation).toBe(1);
  });

  it('counts a disc and a stadium as the casualty plan does', () => {
    const disc = simulateEarthquake(shallow);
    const r = (disc.shaking.mmi7Radius as number) / 1_000;
    expect(mmi7FootprintKm2(disc)).toBeCloseTo(Math.PI * r * r, 9);
    const great = simulateEarthquake({ ...shallow, magnitude: 8.2 });
    const R = (great.shaking.mmi7Radius as number) / 1_000;
    const L = (great.ruptureLength as number) / 1_000;
    const W = (great.ruptureWidth as number) / 1_000;
    expect(great.isExtendedSource).toBe(true);
    expect(mmi7FootprintKm2(great)).toBeCloseTo(L * W + 2 * R * (L + W) + Math.PI * R * R, 6);
  });
});

describe("the sampler's residual", () => {
  const nominal: EarthquakeScenarioInput = {
    magnitude: 7,
    depth: m(15_000),
    faultType: 'strike-slip',
    vs30: 500,
  };

  it('draws exactly what it drew before where the scenario names no residual', () => {
    const rng = mulberry32('same');
    const draw = earthquakeSampler(nominal)(rng);
    const replay = mulberry32('same');
    sampleNormal(replay, 0, 1); // magnitude
    sampleNormal(replay, 0, 1); // depth
    sampleNormal(replay, 0, 1); // Vs30
    expect(draw.groundMotionResidualLn).toBe(
      sampleNormal(replay, 0, EARTHQUAKE_INPUT_SIGMA.groundMotion.sigma)
    );
    expect(draw.groundMotionSiteResidualLn).toBeUndefined();
  });

  it('keeps every other draw and the between-event draw, and adds the within-event parts from their own stream', () => {
    const parts = residualParts(nominal, mmi7FootprintKm2(simulateEarthquake(nominal)));
    if (parts === null) throw new Error('no parts');
    const inPlace = earthquakeSampler(nominal)(mulberry32('world'));
    const within = mulberry32('within');
    const candidate = earthquakeSampler(
      { ...nominal, groundMotionResidual: 'betweenAndWithin' },
      { parts, withinRng: within }
    )(mulberry32('world'));
    expect(candidate.magnitude).toBe(inPlace.magnitude);
    expect(candidate.depth).toBe(inPlace.depth);
    expect(candidate.vs30).toBe(inPlace.vs30);
    const z1 = (inPlace.groundMotionResidualLn ?? 0) / EARTHQUAKE_INPUT_SIGMA.groundMotion.sigma;
    const replay = mulberry32('within');
    const z2 = sampleNormal(replay, 0, 1);
    const z3 = sampleNormal(replay, 0, 1);
    expect(candidate.groundMotionResidualLn).toBeCloseTo(
      parts.tau * z1 + parts.phi * Math.sqrt(parts.meanCorrelation) * z2,
      12
    );
    expect(candidate.groundMotionSiteResidualLn).toBeCloseTo(parts.tau * z1 + parts.phi * z3, 12);
    const total = earthquakeSampler(
      { ...nominal, groundMotionResidual: 'lawTotal' },
      { parts }
    )(mulberry32('world'));
    expect(total.groundMotionResidualLn).toBeCloseTo(Math.hypot(parts.tau, parts.phi) * z1, 12);
    expect(total.groundMotionSiteResidualLn).toBeUndefined();
  });

  it('scatters the footprint by √(τ² + φ²ρ̄) and one place by √(τ² + φ²)', () => {
    const parts = { tau: 0.35, phi: 0.5, meanCorrelation: 0.1 };
    const sample = earthquakeSampler(
      { ...nominal, groundMotionResidual: 'betweenAndWithin' },
      { parts, withinRng: mulberry32('w') }
    );
    const rng = mulberry32('s');
    const footprint: number[] = [];
    const site: number[] = [];
    for (let i = 0; i < 20_000; i++) {
      const draw = sample(rng);
      footprint.push(draw.groundMotionResidualLn ?? 0);
      site.push(draw.groundMotionSiteResidualLn ?? 0);
    }
    const sd = (xs: number[]): number => {
      const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
      return Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length - 1));
    };
    expect(sd(footprint) / Math.sqrt(0.35 ** 2 + 0.5 ** 2 * 0.1)).toBeCloseTo(1, 1);
    expect(sd(site) / Math.hypot(0.35, 0.5)).toBeCloseTo(1, 1);
  });
});

describe('the scenario with a residual for one place', () => {
  it('moves the accelerations at one place and leaves the rings on the footprint residual', () => {
    const base: EarthquakeScenarioInput = {
      magnitude: 6.5,
      depth: m(10_000),
      faultType: 'normal',
      groundMotionResidualLn: 0.2,
    };
    const one = simulateEarthquake(base);
    const apart = simulateEarthquake({ ...base, groundMotionSiteResidualLn: -0.3 });
    expect(apart.shaking.mmi7Radius).toBe(one.shaking.mmi7Radius);
    expect(apart.shaking.liquefactionRadius).toBe(one.shaking.liquefactionRadius);
    expect((apart.shaking.pgaAt20km as number) / (one.shaking.pgaAt20km as number)).toBeCloseTo(
      Math.exp(-0.5),
      12
    );
  });
});
