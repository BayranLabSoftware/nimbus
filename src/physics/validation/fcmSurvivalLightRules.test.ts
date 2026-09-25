import { describe, expect, it } from 'vitest';
import {
  FCM_CUSTODY_PROTOCOL,
  FCM_H2_SIGMA_RANGE,
  FCM_H4_SIGMA_S2_M2,
  FCM_H5_DOMINANCE_MARGIN,
  FCM_H5_RETAINED_FRACTION,
  FCM_LUMINOUS_EFFICIENCY,
  FCM_PERMANENT_DEVELOPMENT_SOURCES,
  FCM_SURVIVAL_EXCESS,
} from './fcmSurvivalLightRules.js';

describe('rules 1178 to 1185: the survival–light round’s opening document', () => {
  it('fixes the light law’s midpoints from the cited ranges, before any run (rule 1180 (a))', () => {
    const [lo1, hi1] = FCM_LUMINOUS_EFFICIENCY.beforeFragmentationRange;
    const [lo2, hi2] = FCM_LUMINOUS_EFFICIENCY.afterFragmentationRange;
    expect(FCM_LUMINOUS_EFFICIENCY.beforeFragmentation).toBeCloseTo(Math.sqrt(lo1 * hi1), 12);
    expect(FCM_LUMINOUS_EFFICIENCY.afterFragmentation).toBeCloseTo(Math.sqrt(lo2 * hi2), 12);
    expect(FCM_LUMINOUS_EFFICIENCY.beforeFragmentation).toBeGreaterThan(
      FCM_LUMINOUS_EFFICIENCY.afterFragmentation
    );
    // Never so large that a synthetic light energy could exceed the mechanical deposit.
    expect(FCM_LUMINOUS_EFFICIENCY.beforeFragmentation).toBeLessThan(1);
  });

  it('names the excess round 1 found, each far above its reference (rule 1178 (a))', () => {
    for (const [, x] of Object.entries(FCM_SURVIVAL_EXCESS)) {
      const ref = 'referenceKg' in x ? x.referenceKg : x.referenceKgRange[0];
      expect(x.medianKgRange[0]).toBeGreaterThan(ref);
    }
  });

  it('closes round 3’s five events and Jenniskens’s 75 to any future held-out set (rule 1179)', () => {
    expect(FCM_PERMANENT_DEVELOPMENT_SOURCES.some((s) => s.includes('75 falls'))).toBe(true);
    expect(FCM_PERMANENT_DEVELOPMENT_SOURCES.some((s) => s.includes('round 3'))).toBe(true);
  });

  it('keeps the custody protocol to the reviewer’s five steps, in order (rule 1184)', () => {
    expect(FCM_CUSTODY_PROTOCOL.length).toBe(5);
    expect(FCM_CUSTODY_PROTOCOL[0]).toMatch(/hash/);
    expect(FCM_CUSTODY_PROTOCOL[3]).toMatch(/predictions produced/);
  });
});

describe('rule 1186: H2 redraws σ per solid fragment, from the same unnarrowed prior', () => {
  it('keeps the range identical to rule 1131’s, chosen before H1/H3’s results were read', () => {
    expect(FCM_H2_SIGMA_RANGE).toEqual([1e-9, 1.6e-8]);
  });
});

describe('rule 1187: H4 uses rule 1131’s own sensitivity value, not a new one', () => {
  it('matches the value already named apart before this round', () => {
    expect(FCM_H4_SIGMA_S2_M2).toBe(3.5e-7);
    expect(FCM_H4_SIGMA_S2_M2).toBeGreaterThan(FCM_H2_SIGMA_RANGE[1]);
  });
});

describe('rule 1188: H5’s classification is fixed — round thresholds, no new free parameter', () => {
  it('splits retained mass at one half, symmetric, not fitted to any case', () => {
    expect(FCM_H5_RETAINED_FRACTION).toBe(0.5);
  });

  it('requires a bucket to lead by 2× before deciding the round', () => {
    expect(FCM_H5_DOMINANCE_MARGIN).toBe(2);
  });
});
