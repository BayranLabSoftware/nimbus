import { describe, expect, it } from 'vitest';
import {
  MC_GIVEN_MIN_DRAWS,
  MC_QUANTILE_Z,
  MC_SHARE_OUTCOME,
  MC_SHARE_SHOWN_WHOLE,
  MC_SHARE_SIGMAS,
} from './monteCarloShareRules.js';

describe('rules 890 to 895: how often, and how large when it happens', () => {
  it('fixes its figures before the candidate', () => {
    expect(MC_SHARE_SHOWN_WHOLE).toBe(0.9);
    expect(MC_GIVEN_MIN_DRAWS).toBe(10);
    expect(MC_QUANTILE_Z).toBe(2.576);
    expect(MC_SHARE_SIGMAS).toBe(3);
  });

  it('records its adoption', () => {
    expect(MC_SHARE_OUTCOME).toMatch(/^ADOPTED 23 September 2026/);
  });
});
