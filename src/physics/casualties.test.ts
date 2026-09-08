import { describe, expect, it } from 'vitest';
import {
  PAGER_VULNERABILITY,
  blastCasualtyPlan,
  estimateCasualties,
  normalCdf,
  pagerFatalityRate,
  pyroclasticCasualtyPlan,
  shakingCasualtyPlan,
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
    expect(plan.bands.map((b) => b.key)).toEqual([
      'blast12psi',
      'blast5psi',
      'blast2psi',
      'blast1psi',
    ]);
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
    expect(est.deaths).toBe(9_800 + 20_000 + 5_000);
    // 10 000·0.02 + 40 000·0.4 + 100 000·0.45 + 250 000·0.25
    expect(est.injured).toBe(200 + 16_000 + 45_000 + 62_500);
    expect(est.deathsLow).toBeLessThan(est.deaths);
    expect(est.deathsHigh).toBeGreaterThan(est.deaths);
    expect(est.bands[1]?.population).toBe(40_000);
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
