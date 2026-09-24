import { describe, expect, it } from 'vitest';
import {
  F_FRAGMENTS_PER_BREAK,
  F_MASS_FLOOR_KG,
  F_MASS_FLOOR_SENSITIVITY_KG,
  F_PRIORS,
  F_STRENGTH_CEILING_PA,
} from './fragmentationStudyFRules.js';

describe('rules 1063 to 1073: the specification of F', () => {
  it('draws its priors on intervals that span the two sources', () => {
    for (const [lo, hi] of Object.values(F_PRIORS)) expect(lo).toBeLessThan(hi);
    // Register et al. (2017) §2.7: clouds of 3 to 75 %; Wheeler et al. (2018)
    // §4.1: 75 to 85 % for Chelyabinsk.
    expect(F_PRIORS.cloudShare[0]).toBeLessThanOrEqual(0.05);
    expect(F_PRIORS.cloudShare[1]).toBeGreaterThanOrEqual(0.85);
    // Wheeler et al. (2018) §4.1: α from about 0.07 to 0.5.
    expect(F_PRIORS.strengthScaling[0]).toBeLessThanOrEqual(0.07);
    expect(F_PRIORS.strengthScaling[1]).toBeGreaterThanOrEqual(0.5);
  });

  it('breaks in two with a cloud, under the ceiling of 330 MPa, down to a gram', () => {
    expect(F_FRAGMENTS_PER_BREAK).toBe(2);
    expect(F_STRENGTH_CEILING_PA).toBe(330e6);
    expect(F_MASS_FLOOR_KG).toBe(1e-3);
    expect(F_MASS_FLOOR_SENSITIVITY_KG).toBe(F_MASS_FLOOR_KG / 10);
  });
});
