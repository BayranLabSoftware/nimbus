import { describe, expect, it } from 'vitest';
import { FRAGMENTATION_CLAUSE, S_FIRST_PHASE_LOSS } from './fragmentationRoundRules.js';
import {
  bandVoids,
  CHARTER,
  CHARTER_ROLES,
  charterReading,
  charterVerdict,
  craterAnswer,
  o2Compatible,
  o2Improves,
  o5ComponentShare,
  o5Verdict,
} from './independentTestCharter.js';
import { THIRD_SET_EVENTS, THIRD_SET_MIN_ENTRY_BODIES } from './levelBThirdSetRules.js';

describe('rules 1038 to 1047: the charter of the independent test', () => {
  it('borrows the round’s clause where it says it does', () => {
    expect(CHARTER.outcomeGain).toBe(FRAGMENTATION_CLAUSE.observedOutcomeGain);
    expect(CHARTER.rightOutcomeShare).toBe(FRAGMENTATION_CLAUSE.rightOutcomeShare);
    expect(CHARTER.bandWidening).toBe(FRAGMENTATION_CLAUSE.bandWidening);
    expect(CHARTER.minObservablesImproved).toBe(FRAGMENTATION_CLAUSE.minMetricsImproved);
    expect(CHARTER.minBodies).toBe(THIRD_SET_MIN_ENTRY_BODIES);
  });

  it('judges S at the f1 its specification named', () => {
    expect(CHARTER.sFirstPhaseLoss).toBe(S_FIRST_PHASE_LOSS);
  });

  it('decides on O1, O2 and O5, and reads the others as diagnostics', () => {
    expect(
      Object.entries(CHARTER_ROLES)
        .filter(([, r]) => r === 'decisive')
        .map(([o]) => o)
    ).toEqual(['O1', 'O2', 'O5']);
  });

  it('counts only the ordinary chondrites unless a model declares priors for a type', () => {
    expect(charterReading('ordinaryChondrite')).toBe('counted');
    expect(charterReading('other')).toBe('robustnessControl');
    expect(charterReading('other', true)).toBe('counted');
    expect(charterReading('unknown')).toBe('sensitivity');
  });

  it('adds no event to the third set', () => {
    expect(Object.keys(THIRD_SET_EVENTS)).toHaveLength(13);
  });
});

describe('rules 1049 to 1055: the charter amended, operationally', () => {
  const band = (p5: number, p50: number, p95: number) => ({ p5, p50, p95 });

  it('1050: a lower bound is failed from below and earns no accuracy from above', () => {
    const bound = { kg: 10, kind: 'lowerBound' as const };
    expect(o2Compatible(bound, band(1, 3, 9))).toEqual({ compatible: false, error: null });
    expect(o2Compatible(bound, band(2, 50, 5_000))).toEqual({ compatible: true, error: null });
    // A measured mass: the band widened threefold, and an error in log10.
    const measured = { kg: 10, kind: 'measured' as const };
    expect(o2Compatible(measured, band(20, 25, 28)).compatible).toBe(true);
    expect(o2Compatible(measured, band(31, 40, 50)).compatible).toBe(false);
    expect(o2Compatible(measured, band(5, 100, 200)).error).toBeCloseTo(1, 12);
  });

  it('1051: accuracy only on three measured bodies, never from a baseline within a factor of two', () => {
    const m = (kg: number) => ({ kg, kind: 'measured' as const });
    const close = band(5, 12, 30);
    const far = band(100, 1_000, 5_000);
    // The baseline a factor of 100 out on three measured bodies, the model within 2.
    const better = [1, 2, 3].map(() => ({ recovered: m(10), baseline: far, model: close }));
    expect(o2Improves(better)).toMatchObject({ improves: true, accuracyAssessable: true });
    // The baseline already within a factor of two: no accuracy to claim.
    const already = [1, 2, 3].map(() => ({ recovered: m(10), baseline: close, model: close }));
    expect(o2Improves(already)).toMatchObject({ improves: false, accuracyAssessable: false });
    // Two measured bodies only: accuracy not assessable, whatever the errors.
    expect(o2Improves(better.slice(0, 2)).accuracyAssessable).toBe(false);
    // A compatible body lost voids any gain.
    const lostOne = [
      ...better,
      { recovered: { kg: 10, kind: 'lowerBound' as const }, baseline: far, model: band(1, 2, 3) },
    ];
    expect(o2Improves(lostOne).improves).toBe(false);
  });

  it('1052: out of the domain is never "no crater", and components are never averaged', () => {
    expect(craterAnswer('outOfDomain')).toBe('notAssessable');
    expect(craterAnswer('none')).toBe('right');
    expect(craterAnswer('computed')).toBe('wrong');
    // Fewer than half the draws assessable: the component is not assessable.
    expect(o5ComponentShare(['right', 'notAssessable', 'notAssessable'])).toBeNull();
    expect(o5ComponentShare(['right', 'wrong', 'notAssessable', 'right'])).toBeCloseTo(2 / 3, 12);
    const survival = { baseline: [0.5, 0.6, 0.7], model: [0.7, 0.7, 0.8] };
    expect(o5Verdict([survival], [0, 0, 0])).toEqual({ improves: true, worsens: false });
    // A body falling below 0.90 where the baseline held it worsens O5.
    const regime = { baseline: [0.95, 0.5, 0.5], model: [0.85, 0.9, 0.9] };
    expect(o5Verdict([survival, regime], [0, 0, 0]).worsens).toBe(true);
    // A computed crater in more than a tenth of a body's draws worsens O5.
    expect(o5Verdict([survival], [0, 0.2, 0]).worsens).toBe(true);
  });

  it('1053: the band on its quantity, a floor for a narrow baseline, conditioned draws counted', () => {
    expect(bandVoids('O1', 0, 0.7)).toBe(false);
    expect(bandVoids('O1', 0, 0.8)).toBe(true);
    expect(bandVoids('O2', 0.2, 0.31)).toBe(true);
    expect(bandVoids('O1', 2, 2.5, { baseline: 49, model: 400 })).toBeNull();
  });

  it('1054: eligibility counted per observable, never pooled', () => {
    const three = ['a', 'b', 'c'];
    // O1 and O2 each on three bodies of their own: two assessable observables.
    expect(
      charterVerdict([
        { observable: 'O1', eligible: three, improves: true, worsens: false },
        { observable: 'O2', eligible: ['d', 'e', 'f'], improves: true, worsens: false },
        { observable: 'O5', eligible: ['a'], improves: true, worsens: false },
      ])
    ).toMatchObject({ adoptable: true, assessable: ['O1', 'O2'] });
    // One assessable observable: no adoption, whatever the others show.
    expect(
      charterVerdict([
        { observable: 'O1', eligible: three, improves: true, worsens: false },
        { observable: 'O2', eligible: ['d', 'e'], improves: true, worsens: false },
      ]).reason
    ).toBe('tooFewAssessable');
    // A diagnostic observable never counts, however many bodies it has.
    expect(
      charterVerdict([
        { observable: 'O1', eligible: three, improves: true, worsens: false },
        { observable: 'O3', eligible: three, improves: true, worsens: false },
      ]).reason
    ).toBe('tooFewAssessable');
  });
});
