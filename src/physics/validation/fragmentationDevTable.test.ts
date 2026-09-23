import { describe, expect, it } from 'vitest';
import baseline from './fragmentationBaseline.json';
import { DEV_CASES, DEV_TABLE } from './fragmentationDevTable.js';
import { FRAGMENTATION_CLAUSE } from './fragmentationRoundRules.js';

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

describe('rule 981: the baseline, as committed', () => {
  const cases = baseline.cases;
  const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;

  it('reads every case of the table, in its order', () => {
    expect(cases.map((c) => c.case)).toEqual(DEV_CASES.map((c) => c.case));
  });

  it('sums its counted cases as its summary says', () => {
    expect(baseline.summary.m1MeanMissM).toBeCloseTo(
      mean(cases.filter((c) => c.m1.counted).map((c) => c.m1.miss ?? 0)),
      6
    );
    expect(baseline.summary.m2MeanMissM).toBeCloseTo(
      mean(cases.filter((c) => c.m2.counted).map((c) => c.m2.miss ?? 0)),
      6
    );
    expect(baseline.summary.m3MeanObservedOutcome).toBeCloseTo(
      mean(cases.filter((c) => c.m3.counted).map((c) => c.m3.observedOutcome ?? 0)),
      9
    );
    expect(baseline.summary.rightOutcomes).toEqual(
      cases
        .filter(
          (c) =>
            c.m3.counted && (c.m3.observedOutcome ?? 0) >= FRAGMENTATION_CLAUSE.rightOutcomeShare
        )
        .map((c) => c.case)
    );
  });
});
