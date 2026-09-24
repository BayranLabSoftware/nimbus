import { describe, expect, it } from 'vitest';
import {
  FCM_AGGREGATED_TAIL,
  FCM_DEV_PRIORS,
  FCM_DEV_RUN,
  FCM_DOMAIN_MAP,
  FCM_FLOOR_BODY,
  FCM_PEAKS,
  FCM_ROUND1_VERDICT,
  FCM_TUNING,
} from './fcmRound1Rules.js';
import { FCM_DOMAIN, FCM_GATE1 } from './fcmRoundRules.js';

describe('rules 1148 to 1159: round 1 of the FCM branch, on the reviewer’s leave', () => {
  it('maps the perimeter with every corner, its centre and a Halton design (rule 1149)', () => {
    const points = 2 ** 4 + 1 + FCM_DOMAIN_MAP.halton;
    expect(points * FCM_DOMAIN_MAP.configurations.length).toBe(1_028);
    expect(FCM_DOMAIN_MAP.bases).toEqual([2, 3, 5, 7]);
    expect(FCM_DOMAIN.diameterM).toEqual([0.1, 300]);
  });

  it('tries the aggregated tail largest first (rule 1150)', () => {
    expect([...FCM_AGGREGATED_TAIL].sort((a, b) => b - a)).toEqual([...FCM_AGGREGATED_TAIL]);
  });

  it('marks nearly equal peaks well above the numerical error (rule 1151)', () => {
    expect(1 - FCM_PEAKS.secondaryShare).toBeCloseTo(2.5 * FCM_GATE1.convergence, 12);
  });

  it('keeps M2’s groups inside the body and above the release (rule 1152)', () => {
    const p = FCM_DEV_PRIORS;
    const most = p.m2.rubble[1] + p.m2.strong[1] + p.m2.debris[1];
    const least = p.m2.rubble[0] + p.m2.strong[0] + p.m2.debris[0];
    expect(1 - most).toBeCloseTo(0.807, 3);
    expect(1 - least).toBeCloseTo(0.95, 3);
    expect(p.secondStagePa[0]).toBeGreaterThan(p.firstStagePa[1]);
  });

  it('builds the floor’s body to cascade: α 0, two floors (rule 1155)', () => {
    expect(FCM_FLOOR_BODY.alpha).toBe(0);
    expect(FCM_FLOOR_BODY.floorsKg).toEqual([1e-3, 1e-4]);
  });

  it('judges the development runs with margins fixed now (rule 1156)', () => {
    expect(FCM_DEV_RUN.releaseMarginM).toBe(1_000);
    expect(FCM_DEV_RUN.shareMargin).toBe(0.1);
    expect(Object.keys(FCM_DEV_RUN.w18Cases)).toEqual(['Košice', 'Benešov', 'Tagish Lake']);
  });
});

describe('rule 1160: one registered tuning', () => {
  it('declares its objective and two candidates before any tuned run', () => {
    expect(Object.keys(FCM_TUNING.candidates)).toEqual(['T1', 'T2']);
    const [lo, hi] = FCM_TUNING.objective.Chelyabinsk;
    expect(hi / 5_000).toBeCloseTo(3, 12);
    expect(5_000 / lo).toBeCloseTo(3, 2);
  });
});

describe('rule 1161: the verdict on round 1', () => {
  it('tests the release only, adopts nothing, and leaves the product as it is', () => {
    expect(FCM_ROUND1_VERDICT.adoption).toBe(false);
    expect(FCM_ROUND1_VERDICT.classB).toBe(false);
    expect(FCM_ROUND1_VERDICT.productUnchanged).toBe(true);
    expect(FCM_ROUND1_VERDICT.domainUpperBoundM).toBe(10);
  });
});
