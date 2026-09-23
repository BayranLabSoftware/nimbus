import { describe, expect, it } from 'vitest';
import { DEV_CASES, DEV_TABLE } from './fragmentationDevTable.js';

describe('rule 980: the development table of the round on fragmentation', () => {
  it('holds one row for every case and metric', () => {
    for (const { case: c } of DEV_CASES)
      for (const metric of ['m1', 'm2', 'm3', 'm4'] as const)
        expect(
          DEV_TABLE.filter((r) => r.case === c && r.metric === metric),
          `${c} ${metric}`
        ).toHaveLength(1);
    expect(DEV_TABLE).toHaveLength(DEV_CASES.length * 4);
  });

  it('counts only an observed target with its quality, and says why', () => {
    for (const r of DEV_TABLE) {
      expect(r.reason.length, `${r.case} ${r.metric}`).toBeGreaterThan(0);
      if (r.counted) {
        expect(r.observed.kind, `${r.case} ${r.metric}`).not.toBe('none');
        expect(r.quality, `${r.case} ${r.metric}`).not.toBeNull();
        expect(r.source, `${r.case} ${r.metric}`).not.toBe('');
      }
      if (r.observed.kind === 'altitude')
        expect(r.observed.lowM).toBeLessThanOrEqual(r.observed.highM);
    }
  });

  it('counts what rule 980 says, and m4 nowhere', () => {
    const counted = (metric: string): string[] =>
      DEV_TABLE.filter((r) => r.metric === metric && r.counted).map((r) => r.case);
    expect(counted('m1')).toEqual(['2008 TC3', '2018 LA', '2023 CX1', '2024 BX1']);
    expect(counted('m2')).toEqual([
      '2008 TC3',
      '2018 LA',
      '2022 EB5',
      '2023 CX1',
      '2024 BX1',
      '2022 WJ1',
    ]);
    expect(counted('m3')).toEqual([
      'Chelyabinsk',
      'Tunguska',
      '2008 TC3',
      '2018 LA',
      '2023 CX1',
      '2024 BX1',
      '2022 WJ1',
      'Carancas',
    ]);
    expect(counted('m4')).toEqual([]);
  });
});
