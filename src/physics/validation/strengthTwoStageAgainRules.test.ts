import { describe, expect, it } from 'vitest';
import { STRENGTH_TWO_STAGE_AGAIN_OUTCOME } from './strengthTwoStageAgainRules.js';

describe('rules 896 to 902: the two-stage strength, asked again', () => {
  it('has no outcome before its run', () => {
    expect(STRENGTH_TWO_STAGE_AGAIN_OUTCOME).toBeNull();
  });
});
