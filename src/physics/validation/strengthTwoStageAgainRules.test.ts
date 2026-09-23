import { describe, expect, it } from 'vitest';
import { STRENGTH_TWO_STAGE_AGAIN_OUTCOME } from './strengthTwoStageAgainRules.js';

describe('rules 896 to 902: the two-stage strength, asked again', () => {
  it('records its adoption', () => {
    expect(STRENGTH_TWO_STAGE_AGAIN_OUTCOME).toMatch(/^ADOPTED 23 September 2026/);
  });
});
