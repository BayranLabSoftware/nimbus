import { describe, expect, it } from 'vitest';
import {
  STRENGTH_TWO_STAGE_OUTCOME,
  TWO_STAGE_DENSITY_RANGE,
  TWO_STAGE_FIRST_MAJOR_SHARE,
  TWO_STAGE_S1_PA,
  TWO_STAGE_S1_RANGE_PA,
  TWO_STAGE_S2_PA,
  TWO_STAGE_S2_RANGE_PA,
} from './strengthTwoStageRules.js';

describe('rules 881 to 889: a body’s strength in two stages', () => {
  it('takes the source’s intervals and their geometric midpoints (rule 882(c))', () => {
    expect(TWO_STAGE_S1_RANGE_PA).toEqual([40_000, 120_000]);
    expect(TWO_STAGE_S2_RANGE_PA).toEqual([900_000, 5_000_000]);
    expect(TWO_STAGE_S1_PA).toBeCloseTo(69_282, 0);
    expect(TWO_STAGE_S2_PA).toBeCloseTo(2_121_320, 0);
    expect(TWO_STAGE_FIRST_MAJOR_SHARE).toBeCloseTo(2 / 3, 15);
    expect(TWO_STAGE_DENSITY_RANGE).toEqual([2_500, 5_000]);
  });

  it('has no outcome before its run', () => {
    expect(STRENGTH_TWO_STAGE_OUTCOME).toBeNull();
  });
});
