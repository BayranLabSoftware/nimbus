import { describe, expect, it } from 'vitest';
import {
  blastCasualtyPlan,
  combineMortality,
  DELAYED_DEATH_FRACTION,
  estimateCasualties,
  FIRESTORM_MORTALITY,
  impactFireballRadius,
  normalCdf,
  nuclearFireballRadius,
  PAGER_VULNERABILITY,
  pagerFatalityRate,
  pyroclasticCasualtyPlan,
  shakingCasualtyPlan,
  THERMAL_EXPOSED_FRACTION,
  thermalHorizonRadius,
  THIRD_DEGREE_MORTALITY,
  WHOLE_PLANET_RADIUS_M,
  type CasualtyPlan,
} from './casualties.js';
import { J, m as meters } from './units.js';

describe('normalCdf', () => {
  it('matches tabulated values', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 3);
    expect(normalCdf(3)).toBeCloseTo(0.99865, 4);
  });
});

describe('blastCasualtyPlan (OTA 1979)', () => {
  // Hiroshima-class: 15 kt, drawn radii ≈ 1.7 km (5 psi) and 5 km (1 psi).
  const plan = blastCasualtyPlan({
    blastEnergy: J(15 * 4.184e12),
    overpressure5psiRadius: meters(1_700),
    overpressure1psiRadius: meters(5_000),
  });

  it('builds four contiguous annuli inside the drawn 1 psi ring', () => {
    expect(plan).not.toBeNull();
    if (plan === null) return;
    expect(plan.model).toBe('blast');
    expect(plan.bands.map((b) => b.psiBand)).toEqual([
      'blast12psi',
      'blast5psi',
      'blast2psi',
      'blast1psi',
    ]);
    expect(new Set(plan.bands.map((b) => b.key)).size).toBe(4);
    for (let i = 1; i < plan.bands.length; i++) {
      expect(plan.bands[i]?.innerRadiusM).toBe(plan.bands[i - 1]?.outerRadiusM);
    }
    expect(plan.bands[3]?.outerRadiusM).toBe(5_000);
    // The 12 psi contour lies inside the 5 psi one, the 2 psi between 5 and 1.
    const r12 = plan.bands[0]?.outerRadiusM ?? 0;
    const r2 = plan.bands[2]?.outerRadiusM ?? 0;
    expect(r12).toBeGreaterThan(0);
    expect(r12).toBeLessThan(1_700);
    expect(r2).toBeGreaterThan(1_700);
    expect(r2).toBeLessThan(5_000);
  });

  it('carries the OTA mortality and injury rates', () => {
    if (plan === null) throw new Error('plan');
    expect(plan.bands.map((b) => b.mortality)).toEqual([0.98, 0.5, 0.05, 0]);
    expect(plan.bands.map((b) => b.injuryRate)).toEqual([0.02, 0.4, 0.45, 0.25]);
  });

  it('rejects degenerate radii', () => {
    expect(
      blastCasualtyPlan({
        blastEnergy: J(1e13),
        overpressure5psiRadius: meters(0),
        overpressure1psiRadius: meters(1_000),
      })
    ).toBeNull();
  });
});

describe('pagerFatalityRate (Jaiswal & Wald 2010)', () => {
  it('rises with intensity and with vulnerability', () => {
    const mid = PAGER_VULNERABILITY.mid;
    expect(pagerFatalityRate(7.5, mid)).toBeLessThan(pagerFatalityRate(8.5, mid));
    expect(pagerFatalityRate(8.5, mid)).toBeLessThan(pagerFatalityRate(9.5, mid));
    expect(pagerFatalityRate(9.5, PAGER_VULNERABILITY.low)).toBeLessThan(
      pagerFatalityRate(9.5, PAGER_VULNERABILITY.high)
    );
  });

  it('is a per-cent-scale rate at MMI IX for the central parameters, not a rounding error and not a massacre', () => {
    const rate = pagerFatalityRate(9.5, PAGER_VULNERABILITY.mid);
    expect(rate).toBeGreaterThan(0.01);
    expect(rate).toBeLessThan(0.2);
  });
});

describe('shakingCasualtyPlan', () => {
  it('produces IX / VIII / VII annuli with decreasing mortality outward', () => {
    const plan = shakingCasualtyPlan({
      mmi7Radius: meters(60_000),
      mmi8Radius: meters(35_000),
      mmi9Radius: meters(20_000),
    });
    expect(plan).not.toBeNull();
    if (plan === null) return;
    expect(plan.bands.map((b) => b.key)).toEqual(['mmi9', 'mmi8', 'mmi7']);
    expect(plan.bands[0]?.mortality).toBeGreaterThan(plan.bands[1]?.mortality ?? 0);
    expect(plan.bands[1]?.mortality).toBeGreaterThan(plan.bands[2]?.mortality ?? 0);
    expect(plan.bands[2]?.outerRadiusM).toBe(60_000);
  });

  it('drops empty annuli (no MMI IX zone for a moderate quake)', () => {
    const plan = shakingCasualtyPlan({
      mmi7Radius: meters(15_000),
      mmi8Radius: meters(4_000),
      mmi9Radius: meters(0),
    });
    expect(plan?.bands.map((b) => b.key)).toEqual(['mmi8', 'mmi7']);
  });
});

describe('pyroclasticCasualtyPlan (Auker 2013)', () => {
  it('weights the lateral-blast annulus by its sector', () => {
    const plan = pyroclasticCasualtyPlan({
      pyroclasticRunout: meters(10_000),
      lateralBlastRunout: meters(26_000),
      lateralBlastSectorDeg: 180,
    });
    expect(plan?.bands).toHaveLength(2);
    expect(plan?.bands[0]?.mortality).toBe(0.9);
    expect(plan?.bands[1]?.mortality).toBeCloseTo(0.45, 9);
    expect(plan?.bands[1]?.innerRadiusM).toBe(10_000);
  });

  it('is null without any runout', () => {
    expect(pyroclasticCasualtyPlan({ pyroclasticRunout: meters(0) })).toBeNull();
  });
});

describe('estimateCasualties', () => {
  it('turns cumulative counts into annulus populations and sums deaths, injured and exposed', () => {
    const plan = blastCasualtyPlan({
      blastEnergy: J(15 * 4.184e12),
      overpressure5psiRadius: meters(1_700),
      overpressure1psiRadius: meters(5_000),
    });
    if (plan === null) throw new Error('plan');
    // Cumulative population inside r12, r5, r2, r1.
    const est = estimateCasualties(plan, [10_000, 50_000, 150_000, 400_000]);
    expect(est.exposed).toBe(400_000);
    // 10 000·0.98 + 40 000·0.5 + 100 000·0.05 + 250 000·0
    expect(est.promptDeaths).toBe(9_800 + 20_000 + 5_000);
    // 10 000·0.02 + 40 000·0.4 + 100 000·0.45 + 250 000·0.25
    expect(est.injured).toBe(200 + 16_000 + 45_000 + 62_500);
    // Later deaths: the central share of the injured, dated in the sweep.
    expect(est.delayedDeaths).toBe(Math.round(est.injured * DELAYED_DEATH_FRACTION.mid));
    expect(est.deaths).toBe(est.promptDeaths + est.delayedDeaths);
    expect(est.deathsLow).toBeLessThan(est.deaths);
    expect(est.deathsHigh).toBeGreaterThan(est.deaths);
    expect(est.bands[1]?.population).toBe(40_000);
    expect(est.bands[1]?.hazards).toEqual(['blast', 'delayed']);
  });

  it('clamps non-monotonic cumulative counts instead of producing negative people', () => {
    const plan = shakingCasualtyPlan({
      mmi7Radius: meters(60_000),
      mmi8Radius: meters(35_000),
      mmi9Radius: meters(20_000),
    });
    if (plan === null) throw new Error('plan');
    const est = estimateCasualties(plan, [1_000, 800, 5_000]);
    expect(est.bands[1]?.population).toBe(0);
    expect(est.exposed).toBe(5_000);
    expect(est.deaths).toBeGreaterThanOrEqual(0);
  });
});

describe('blastCasualtyPlan — burns, mass fire, later deaths', () => {
  const plan = blastCasualtyPlan({
    blastEnergy: J(15 * 4.184e12),
    overpressure5psiRadius: meters(1_700),
    overpressure1psiRadius: meters(5_000),
    thirdDegreeBurnRadius: meters(2_500),
    secondDegreeBurnRadius: meters(3_400),
    firestormRadius: meters(1_900),
  });

  it('splits the OTA annuli wherever a thermal or fire radius falls, and stays contiguous', () => {
    if (plan === null) throw new Error('plan');
    const edges = plan.bands.map((b) => b.outerRadiusM);
    expect(edges).toContain(1_900);
    expect(edges).toContain(2_500);
    expect(edges).toContain(3_400);
    expect(edges).toContain(5_000);
    for (let i = 1; i < plan.bands.length; i++) {
      expect(plan.bands[i]?.innerRadiusM).toBe(plan.bands[i - 1]?.outerRadiusM);
    }
    expect(plan.bands[0]?.innerRadiusM).toBe(0);
  });

  it('every annulus carries exactly the hazards that reach it', () => {
    if (plan === null) throw new Error('plan');
    const hazardsAt = (r: number): string[] =>
      plan.bands
        .find((b) => r >= b.innerRadiusM && r < b.outerRadiusM)
        ?.components?.map((c) => c.hazard) ?? [];
    expect(hazardsAt(500)).toEqual(['blast', 'thermal', 'firestorm']);
    expect(hazardsAt(1_800)).toEqual(['blast', 'thermal', 'firestorm']);
    expect(hazardsAt(2_000)).toEqual(['blast', 'thermal']);
    expect(hazardsAt(3_000)).toEqual(['blast', 'thermal']);
    expect(hazardsAt(4_000)).toEqual(['blast']);
    // Beyond the second-degree radius only the blast remains; beyond
    // 1 psi nothing — so the plan ends at the 1 psi ring here.
    expect(Math.max(...plan.bands.map((b) => b.outerRadiusM))).toBe(5_000);
  });

  it('combines the hazards of an annulus as sequential risks, never above 100 %', () => {
    if (plan === null) throw new Error('plan');
    const inner = plan.bands[0];
    if (inner === undefined) throw new Error('band');
    const expected = combineMortality([
      0.98,
      THERMAL_EXPOSED_FRACTION.mid * THIRD_DEGREE_MORTALITY.mid,
      FIRESTORM_MORTALITY.mid,
    ]);
    expect(inner.mortality).toBeCloseTo(expected, 12);
    expect(inner.mortality).toBeGreaterThan(0.98);
    expect(inner.mortalityHigh).toBeLessThanOrEqual(1);
    expect(combineMortality([0.5, 0.5])).toBeCloseTo(0.75, 12);
    expect(combineMortality([1, 0.3])).toBe(1);
  });

  it('a thermal radius past the antipode is the whole planet, not an error', () => {
    const planet = blastCasualtyPlan({
      blastEnergy: J(1e23),
      overpressure5psiRadius: meters(2_300_000),
      overpressure1psiRadius: meters(6_750_000),
      thirdDegreeBurnRadius: meters(50_000_000),
      secondDegreeBurnRadius: meters(80_000_000),
    });
    if (planet === null) throw new Error('plan');
    const outermost = Math.max(...planet.bands.map((b) => b.outerRadiusM));
    expect(outermost).toBeCloseTo(WHOLE_PLANET_RADIUS_M, 3);
    expect(outermost).toBeLessThan(20_100_000);
  });

  it('beyond the 1 psi ring the burns alone reach out, when the thermal radius is larger', () => {
    const wide = blastCasualtyPlan({
      blastEnergy: J(1e6 * 4.184e12), // a megatonne
      overpressure5psiRadius: meters(6_000),
      overpressure1psiRadius: meters(14_000),
      thirdDegreeBurnRadius: meters(12_000),
      secondDegreeBurnRadius: meters(18_000),
    });
    if (wide === null) throw new Error('plan');
    const outermost = wide.bands[wide.bands.length - 1];
    if (outermost === undefined) throw new Error('band');
    expect(outermost.outerRadiusM).toBe(18_000);
    expect(outermost.innerRadiusM).toBe(14_000);
    expect(outermost.components?.map((c) => c.hazard)).toEqual(['thermal']);
    expect(outermost.mortality).toBe(0); // second-degree burns injure, they do not kill
    expect(outermost.psiBand).toBeUndefined();
  });

  it('burns kill the exposed survivors of the blast and injure the rest of the exposed', () => {
    if (plan === null) throw new Error('plan');
    const est = estimateCasualties(
      plan,
      plan.bands.map((b) => 5_000 * Math.PI * (b.outerRadiusM / 1_000) ** 2)
    );
    const thermal = est.bands.flatMap((b) => b.byHazard.filter((h) => h.hazard === 'thermal'));
    const thermalDeaths = thermal.reduce((a, h) => a + h.deaths, 0);
    expect(thermalDeaths).toBeGreaterThan(0);
    // Between 2.5 and 3.4 km the burns are second-degree: injuries only.
    const secondDegree = est.bands.find((b) => b.innerRadiusM === 2_500);
    if (secondDegree === undefined) throw new Error('band');
    expect(secondDegree.byHazard.find((h) => h.hazard === 'thermal')?.deaths).toBe(0);
    expect(secondDegree.injured).toBeGreaterThan(
      secondDegree.population * 0.45 // the OTA 2–5 psi injury rate alone
    );
    expect(est.delayedDeaths).toBeGreaterThan(0);
    expect(est.deaths).toBe(est.promptDeaths + est.delayedDeaths);
    // Nobody dies twice: prompt deaths never exceed the population of a band.
    for (const band of est.bands) expect(band.promptDeaths).toBeLessThanOrEqual(band.population);
  });
});

describe('the fireball sets: burns stop at the horizon', () => {
  const CHICXULUB_CLASS = J(1.06e24); // a 15 km stone at 20 km/s

  it('a fireball two hundred kilometres across is seen to about sixteen hundred', () => {
    const rf = impactFireballRadius(CHICXULUB_CLASS) as number;
    expect(rf).toBeGreaterThan(190_000);
    expect(rf).toBeLessThan(215_000);
    const horizon = thermalHorizonRadius(meters(rf));
    expect(horizon).toBeGreaterThan(1_500_000);
    expect(horizon).toBeLessThan(1_700_000);
    // Nothing to see, nothing to cut.
    expect(thermalHorizonRadius(meters(0))).toBe(Number.POSITIVE_INFINITY);
  });

  it('a nuclear fireball sets far beyond anything it can burn, so nothing is cut', () => {
    const hiroshima = nuclearFireballRadius(J(15 * 4.184e12)) as number;
    expect(hiroshima).toBeGreaterThan(120);
    expect(hiroshima).toBeLessThan(220);
    expect(thermalHorizonRadius(meters(hiroshima))).toBeGreaterThan(40_000);
    // Tsar Bomba: 50 Mt, a 4 km fireball seen to a couple of hundred km,
    // still past its ~100 km third-degree radius.
    const tsar = nuclearFireballRadius(J(5e4 * 4.184e12)) as number;
    expect(thermalHorizonRadius(meters(tsar))).toBeGreaterThan(200_000);
  });

  it('an impact-scale plan loses its antipodal burns and keeps the near ones', () => {
    const shared = {
      blastEnergy: J(CHICXULUB_CLASS * 0.5),
      overpressure5psiRadius: meters(2_298_500),
      overpressure1psiRadius: meters(6_754_800),
      thirdDegreeBurnRadius: meters(27_488_100),
      secondDegreeBurnRadius: meters(34_801_200),
      firestormRadius: meters(31_756_400),
    };
    const unbounded = blastCasualtyPlan(shared);
    const bounded = blastCasualtyPlan({
      ...shared,
      fireballRadius: impactFireballRadius(CHICXULUB_CLASS),
    });
    if (unbounded === null || bounded === null) throw new Error('plan');
    const horizon = thermalHorizonRadius(impactFireballRadius(CHICXULUB_CLASS));

    // Without the horizon the burns reach the whole planet: the
    // outermost band lies past the 1 psi ring and still kills.
    const farUnbounded = unbounded.bands[unbounded.bands.length - 1];
    if (farUnbounded === undefined) throw new Error('band');
    expect(farUnbounded.innerRadiusM).toBeGreaterThan(6_000_000);
    expect(farUnbounded.mortality).toBeGreaterThan(0.3);

    // With it, no band beyond the horizon carries heat at all, and the
    // plan stops where the blast does.
    for (const band of bounded.bands) {
      const heat = (band.components ?? []).filter(
        (c) => c.hazard === 'thermal' || c.hazard === 'firestorm'
      );
      if (0.5 * (band.innerRadiusM + band.outerRadiusM) > horizon) {
        expect(heat).toHaveLength(0);
      }
    }
    const farBounded = bounded.bands[bounded.bands.length - 1];
    if (farBounded === undefined) throw new Error('band');
    expect(farBounded.outerRadiusM).toBeCloseTo(6_754_800, 0);

    // Close in, the flash still arrives and still kills.
    const near = bounded.bands[0];
    if (near === undefined) throw new Error('band');
    expect((near.components ?? []).some((c) => c.hazard === 'thermal')).toBe(true);

    // And the toll falls by the antipodal bands, not by a rounding.
    const uniform = (plan: CasualtyPlan): number =>
      estimateCasualties(
        plan,
        plan.bands.map((b) => 20 * Math.PI * (b.outerRadiusM / 1_000) ** 2)
      ).deaths;
    expect(uniform(bounded)).toBeLessThan(0.4 * uniform(unbounded));
  });
});
