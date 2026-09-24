import { describe, expect, it } from 'vitest';
import {
  A_SIGMA_BASELINE_S2_M2,
  A_SIGMA_PRIOR_S2_M2,
  A_SIGMA_SENSITIVITY_S2_M2,
  ablatedMass,
} from './ablationStudyRules.js';

describe('rules 1129 to 1136: the specification of A', () => {
  it('draws σ between the sources’ ends, the baseline inside, the outlier apart', () => {
    const [lo, hi] = A_SIGMA_PRIOR_S2_M2;
    expect(lo).toBe(1e-9);
    expect(hi).toBe(1.6e-8);
    expect(A_SIGMA_BASELINE_S2_M2).toBeGreaterThan(lo);
    expect(A_SIGMA_BASELINE_S2_M2).toBeLessThan(hi);
    expect(A_SIGMA_SENSITIVITY_S2_M2).toBeGreaterThan(hi);
  });

  it('keeps the mass where σ = 0, and loses it as the speed falls', () => {
    expect(ablatedMass(10, 15_000, 3_000, 0)).toBe(10);
    // σ = 10⁻⁸ s²/m², from 15 to 3 km/s: exp(−1.08) of the mass remains.
    expect(ablatedMass(10, 15_000, 3_000, 1e-8)).toBeCloseTo(10 * Math.exp(-1.08), 12);
  });
});
