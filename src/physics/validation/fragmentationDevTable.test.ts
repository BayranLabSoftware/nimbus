import { describe, expect, it } from 'vitest';
import baseline from './fragmentationBaseline.json';
import baselineV1 from './fragmentationBaseline.v1.json';
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

  it('counts what rules 980 and 986 say, and m4 nowhere', () => {
    const counted = (metric: string): string[] =>
      DEV_TABLE.filter((r) => r.metric === metric && r.counted).map((r) => r.case);
    // Rule 986.
    expect(counted('m1')).toEqual(['2018 LA', '2023 CX1', '2024 BX1']);
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
    ]);
    expect(counted('m4')).toEqual([]);
  });
});

interface Band {
  median: number;
  p5: number;
  p95: number;
  width: number;
}
/** The shape the script writes, whatever the committed values let JSON infer. */
interface BaselineCase {
  case: string;
  m1: { pFirstStage: number; altitude: Band | null; miss: number | null; counted: boolean };
  m2: { pBurst: number; altitude: Band | null; miss: number | null; counted: boolean };
  m3: { observedOutcome: number | null; counted: boolean };
  diagnostic: { singleBreakup: Band | null };
}

describe('rules 981 to 986: the baseline, as committed', () => {
  const cases = baseline.cases as readonly BaselineCase[];
  const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;

  it('reads every case of the table, in its order, and keeps version 1', () => {
    expect(cases.map((c) => c.case)).toEqual(DEV_CASES.map((c) => c.case));
    expect(baseline.version).toBe(2);
    // Rule 982: the first version, as it was (b1bf097).
    expect(baselineV1.summary.m1MeanMissM).toBeCloseTo(31_239.66, 1);
    expect(baselineV1.summary.m2MeanMissM).toBeCloseTo(10_129.67, 1);
  });

  it('reads no absence as an altitude (rules 983 and 984)', () => {
    for (const c of cases) {
      if (c.m1.altitude !== null) expect(c.m1.altitude.p5, c.case).toBeGreaterThan(0);
      if (c.m2.altitude !== null) expect(c.m2.altitude.p5, c.case).toBeGreaterThan(0);
      expect(c.m1.altitude === null, c.case).toBe(c.m1.pFirstStage === 0);
      expect(c.m2.altitude === null, c.case).toBe(c.m2.pBurst === 0);
    }
    const tc3 = cases.find((c) => c.case === '2008 TC3');
    expect(tc3?.m1.miss).toBeNull();
    expect(tc3?.diagnostic.singleBreakup).not.toBeNull();
  });

  it('sums its counted cases as its summary says', () => {
    const counted = (metric: 'm1' | 'm2') =>
      cases.filter((c) => c[metric].counted && c[metric].miss !== null);
    expect(baseline.summary.m1Cases).toEqual(counted('m1').map((c) => c.case));
    expect(baseline.summary.m1MeanMissM).toBeCloseTo(
      mean(counted('m1').map((c) => c.m1.miss ?? 0)),
      6
    );
    expect(baseline.summary.m2MeanMissM).toBeCloseTo(
      mean(counted('m2').map((c) => c.m2.miss ?? 0)),
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
