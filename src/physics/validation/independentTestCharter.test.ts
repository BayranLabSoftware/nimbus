import { describe, expect, it } from 'vitest';
import { FRAGMENTATION_CLAUSE, S_FIRST_PHASE_LOSS } from './fragmentationRoundRules.js';
import {
  bandVoids,
  CHARTER,
  CHARTER_FROZEN,
  CHARTER_ROLES,
  charterReading,
  charterVerdict,
  craterAnswer,
  craterShares,
  craterWorsens,
  o5DomainFlight,
  ELIGIBILITY_COLUMNS,
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

describe('rules 1049 to 1062: the charter amended, operationally', () => {
  const band = (p5: number, p50: number, p95: number) => ({ p5, p50, p95 });

  it('1050, 1058: a lower bound is failed from below, and only «not incompatible» from above', () => {
    const bound = { kg: 10, kind: 'lowerBound' as const };
    expect(o2Compatible(bound, band(1, 3, 9))).toEqual({ verdict: 'incompatible', error: null });
    expect(o2Compatible(bound, band(2, 50, 5_000))).toEqual({
      verdict: 'notIncompatible',
      error: null,
    });
    // A measured mass: the band widened threefold, and an error in log10.
    const measured = { kg: 10, kind: 'measured' as const };
    expect(o2Compatible(measured, band(20, 25, 28)).verdict).toBe('compatible');
    expect(o2Compatible(measured, band(31, 40, 50)).verdict).toBe('incompatible');
    expect(o2Compatible(measured, band(5, 100, 200)).error).toBeCloseTo(1, 12);
  });

  it('1059: the error from the median, whether or not the band crosses; zero is infinite', () => {
    const measured = { kg: 10, kind: 'measured' as const };
    // The band crosses 10 kg: compatible, and the error is still the median's.
    const crossing = o2Compatible(measured, band(1, 100, 1_000));
    expect(crossing.verdict).toBe('compatible');
    expect(crossing.error).toBeCloseTo(1, 12);
    expect(o2Compatible(measured, band(0, 0, 0)).error).toBe(Number.POSITIVE_INFINITY);
  });

  it('1051, 1059: accuracy on three measured bodies, the factor of two on the median', () => {
    const m = (kg: number) => ({ kg, kind: 'measured' as const });
    const close = band(5, 12, 30);
    const far = band(100, 1_000, 5_000);
    const better = [1, 2, 3].map(() => ({ recovered: m(10), baseline: far, model: close }));
    expect(o2Improves(better)).toMatchObject({ improves: true, accuracyAssessable: true });
    const already = [1, 2, 3].map(() => ({ recovered: m(10), baseline: close, model: close }));
    expect(o2Improves(already)).toMatchObject({ improves: false, accuracyAssessable: false });
    expect(o2Improves(better.slice(0, 2)).accuracyAssessable).toBe(false);
    // One body where the baseline is already close does not block the median's clause.
    const mixed = [...better.slice(0, 2), { recovered: m(10), baseline: close, model: close }];
    expect(o2Improves(mixed).accuracyAssessable).toBe(true);
    const lostOne = [
      ...better,
      { recovered: { kg: 10, kind: 'lowerBound' as const }, baseline: far, model: band(1, 2, 3) },
    ];
    expect(o2Improves(lostOne).improves).toBe(false);
  });

  it('1052, 1075: out of the domain is never "no crater", and never a way out', () => {
    expect(craterAnswer('outOfDomain')).toBe('wrong');
    expect(craterAnswer('none')).toBe('right');
    expect(craterAnswer('computed')).toBe('wrong');
    expect(o5ComponentShare(['right', 'notAssessable', 'notAssessable'])).toBeNull();
    expect(o5ComponentShare(['right', 'wrong', 'notAssessable', 'right'])).toBeCloseTo(2 / 3, 12);
    // The three shares on all the paired draws.
    expect(craterShares(['none', 'none', 'computed', 'outOfDomain'])).toEqual({
      computed: 0.25,
      none: 0.5,
      outOfDomain: 0.25,
    });
    // A variant that moves draws out of the domain does not dodge its craters:
    // two computed craters in ten draws, whatever the rest.
    const base: ('computed' | 'none' | 'outOfDomain')[] = Array.from({ length: 10 }, () => 'none');
    const moved: ('computed' | 'none' | 'outOfDomain')[] = [
      ...Array.from({ length: 8 }, () => 'outOfDomain' as const),
      'computed',
      'computed',
    ];
    expect(craterWorsens(base, moved)).toBe(true);
    const one: ('computed' | 'none' | 'outOfDomain')[] = [
      ...Array.from({ length: 9 }, () => 'none' as const),
      'computed',
    ];
    expect(craterWorsens(base, one)).toBe(false);
    expect(() => craterWorsens(base, ['none'])).toThrow();
  });

  it('1060: O5 improves only with C1 and C2 each assessable on three bodies', () => {
    const survival = { baseline: [0.5, 0.6, 0.7], model: [0.7, 0.7, 0.8] };
    const regime = { baseline: [0.4, 0.5, 0.5], model: [0.5, 0.6, 0.6] };
    expect(o5Verdict([survival, regime], [false, false, false])).toEqual({
      improves: true,
      worsens: false,
      improvementClaimable: true,
    });
    // C2 assessable on two bodies only: no claim, though C1 gains.
    const thin = { baseline: [0.4, null, 0.5], model: [0.5, null, 0.6] };
    expect(o5Verdict([survival, thin], [false, false, false])).toMatchObject({
      improves: false,
      improvementClaimable: false,
    });
    // A body below 0.90 where the baseline held it, or a crater in its domain: worse.
    const slip = { baseline: [0.95, 0.5, 0.5], model: [0.85, 0.9, 0.9] };
    expect(o5Verdict([survival, slip], [false, false, false]).worsens).toBe(true);
    expect(o5Verdict([survival, regime], [false, true, false]).worsens).toBe(true);
  });

  it('1053, 1061: the floor stabilizes, it licenses no widened band', () => {
    // Both narrower than the floor: nothing voided.
    expect(bandVoids('O1', 0.1, 0.45)).toBe(false);
    // Past the floor the real baseline width rules: 0.1 km to 0.7 km voids.
    expect(bandVoids('O1', 0.1, 0.7)).toBe(true);
    expect(bandVoids('O2', 0.2, 0.31)).toBe(true);
    expect(bandVoids('O1', 2, 2.9)).toBe(false);
    expect(bandVoids('O1', 2, 2.5, 49)).toBeNull();
  });

  it('1062: the table of eligibility has its columns, published empty', () => {
    expect([...ELIGIBILITY_COLUMNS]).toEqual(['type', 'O1', 'O2', 'C1', 'C2', 'C3']);
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

  it('1076: an observable lost to the variant earns it nothing', () => {
    const three = ['a', 'b', 'c'];
    expect(
      charterVerdict([
        { observable: 'O1', eligible: three, improves: true, worsens: false },
        {
          observable: 'O2',
          eligible: three,
          improves: true,
          worsens: false,
          assessableForVariant: false,
        },
      ]).reason
    ).toBe('tooFewImproved');
  });

  it('1077: two infinite errors compare equal', () => {
    const m = (kg: number) => ({ kg, kind: 'measured' as const });
    const none = band(0, 0, 0);
    const both = [1, 2, 3].map(() => ({ recovered: m(10), baseline: none, model: none }));
    expect(o2Improves(both).improves).toBe(false);
    // An infinite baseline against a finite variant can improve.
    const better = [1, 2, 3].map(() => ({
      recovered: m(10),
      baseline: none,
      model: band(5, 12, 30),
    }));
    expect(o2Improves(better).improves).toBe(true);
  });

  it('1084: a flight out of the domain is no gain, a loss from «no crater», and past 0.10 no credit', () => {
    type St = 'computed' | 'none' | 'outOfDomain';
    const rep = (st: St, k: number): St[] => Array.from({ length: k }, () => st);
    // Baseline: 5 craters, 5 none. Variant: the 5 craters moved out of the domain.
    const baseline = [...rep('computed', 5), ...rep('none', 5)];
    const fled = [...rep('outOfDomain', 5), ...rep('none', 5)];
    const f = o5DomainFlight(baseline, fled);
    expect(f.transitions.computed.outOfDomain).toBe(5);
    expect(f.craterGain).toBe(0);
    expect(f.netFlightOut).toBeCloseTo(0.5, 12);
    expect(f.deniesCredit).toBe(true);
    // The same craters turned into «no crater»: a real gain, no flight.
    const mended = o5DomainFlight(baseline, rep('none', 10));
    expect(mended.craterGain).toBeCloseTo(0.5, 12);
    expect(mended.deniesCredit).toBe(false);
    // A flight that denies the credit, whatever the components gained.
    const survival = { baseline: [0.5, 0.6, 0.7], model: [0.7, 0.7, 0.8] };
    const regime = { baseline: [0.4, 0.5, 0.5], model: [0.5, 0.6, 0.6] };
    expect(
      o5Verdict([survival, regime], [false, false, false], [false, true, false])
    ).toMatchObject({
      improves: false,
      improvementClaimable: false,
    });
    expect(() => o5DomainFlight(baseline, ['none'])).toThrow();
  });

  it('1089: every one of the nine transitions has its score, the veto apart', () => {
    type St = 'computed' | 'none' | 'outOfDomain';
    const states: St[] = ['computed', 'none', 'outOfDomain'];
    const expected: Record<St, Record<St, number>> = {
      computed: { computed: 0, none: 1, outOfDomain: 0 },
      none: { computed: -1, none: 0, outOfDomain: -1 },
      outOfDomain: { computed: 0, none: 1, outOfDomain: 0 },
    };
    for (const b of states)
      for (const v of states) expect(o5DomainFlight([b], [v]).score).toBe(expected[b][v]);
    // The score is the change of the share of «no crater».
    const f = o5DomainFlight(
      ['none', 'none', 'computed', 'outOfDomain'],
      ['outOfDomain', 'none', 'none', 'none']
    );
    expect(f.score).toBeCloseTo(0.25, 12);
    expect(f.worsens).toBe(false);
    // Fleeing out of the domain: the score does not go up, the veto still acts.
    const fled = o5DomainFlight(['computed', 'computed'], ['outOfDomain', 'outOfDomain']);
    expect(fled.score).toBe(0);
    expect(fled.deniesCredit).toBe(true);
    // Losing «no crater» on more than a tenth of the draws worsens O5.
    expect(o5DomainFlight(['none', 'none'], ['outOfDomain', 'none']).worsens).toBe(true);
  });
});

describe('rule 1093: the charter frozen', () => {
  it('is the judge as written, and is not run', () => {
    expect(CHARTER_FROZEN.rule).toBe(1093);
    expect(CHARTER_FROZEN.executionAuthorized).toBe(false);
    expect(CHARTER_FROZEN.rules).toContain('1089');
  });
});
