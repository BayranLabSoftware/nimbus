import { describe, expect, it } from 'vitest';
import baseline from './fragmentationBaseline.json';
import { M3_V2_STATUS } from './fragmentationRoundRules.js';
import { scoreVariant, type ScoreCase, type ScoreRun } from './fragmentationScore.js';

const BASE = baseline as unknown as ScoreRun;

/** A variant made from the baseline, one case changed. */
const withCase = (name: string, change: (c: ScoreCase) => ScoreCase): ScoreRun => ({
  ...BASE,
  cases: BASE.cases.map((c) => (c.case === name ? change(c) : c)),
});

describe('the verdict of a variant, written before P ran', () => {
  it('reads nothing improved and every right outcome kept on the baseline itself', () => {
    const v = scoreVariant(BASE, BASE);
    expect(v.improvedCount).toBe(0);
    expect(v.rightKept.every((r) => r.kept)).toBe(true);
    expect(v.holds).toBe(false);
    expect(v.m1.apart).toEqual([]);
  });

  it('credits a gain on m2 only where the observed outcome does not fall (rule 985)', () => {
    const better = (c: ScoreCase): ScoreCase => ({
      ...c,
      m2: { ...c.m2, miss: 0 },
    });
    const kept = scoreVariant(BASE, withCase('2018 LA', better));
    expect(kept.m2.credits.find((c) => c.case === '2018 LA')?.credited).toBeGreaterThan(0);
    const fell = scoreVariant(
      BASE,
      withCase('2018 LA', (c) => ({
        ...better(c),
        m3: { ...c.m3, observedOutcome: (c.m3.observedOutcome ?? 0) - 0.2 },
      }))
    );
    expect(fell.m2.credits.find((c) => c.case === '2018 LA')?.credited).toBe(0);
  });

  it('voids a gain whose band widens by more than half (rule 976)', () => {
    const v = scoreVariant(
      BASE,
      withCase('2023 CX1', (c) => ({
        ...c,
        m2: {
          ...c.m2,
          miss: 0,
          altitude:
            c.m2.altitude === null ? null : { ...c.m2.altitude, width: c.m2.altitude.width * 1.6 },
        },
      }))
    );
    expect(v.m2.credits.find((c) => c.case === '2023 CX1')?.credited).toBe(0);
  });

  it('keeps a loss wherever it falls, and loses an outcome already right', () => {
    const v = scoreVariant(
      BASE,
      withCase('2024 BX1', (c) => ({
        ...c,
        m2: { ...c.m2, miss: (c.m2.miss ?? 0) + 5_000 },
        m3: { ...c.m3, observedOutcome: 0.5 },
      }))
    );
    expect(v.m2.credits.find((c) => c.case === '2024 BX1')?.credited).toBe(-5_000);
    expect(v.rightKept.find((r) => r.case === '2024 BX1')?.kept).toBe(false);
    expect(v.holds).toBe(false);
  });

  it('rules 1010 and 1011: m3-v2 decides nothing', () => {
    expect(M3_V2_STATUS).toBe('unfit');
    // Every case's observed outcome raised to certainty: m3 would gain far
    // more than 0.10, and still improves nothing.
    const v = scoreVariant(BASE, {
      ...BASE,
      cases: BASE.cases.map((c) => ({ ...c, m3: { ...c.m3, observedOutcome: 1 } })),
    });
    expect(v.m3.meanGain).toBeGreaterThan(0.1);
    expect(v.m3.improved).toBe(false);
  });
});
