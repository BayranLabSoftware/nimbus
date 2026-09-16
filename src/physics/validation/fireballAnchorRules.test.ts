import { describe, expect, it } from 'vitest';
import {
  FIREBALL_ANCHOR_TOLERANCE,
  fireballAgreement,
  fireballAnchorVerdict,
  type FireballAnchorRow,
} from './fireballAnchorRules.js';

const row = (over: Partial<FireballAnchorRow>): FireballAnchorRow => ({
  date: '2020-01-01',
  observedKm: 30,
  nimbusBurstKm: 49.23,
  eiepBurstKm: 49.16,
  eiepError: null,
  nimbusOnEiepIfKm: null,
  ...over,
});

describe('rule 126: the model implements the reference on a fireball', () => {
  it('agrees within G1’s 1 %, which is where the hand-tried fireball sits', () => {
    // 49.23 against 49.16: 0.14 %. A bare comparison of errors would fail the
    // model by 70 m on a body it reproduces to that.
    expect(fireballAgreement(row({}))).toBe('within');
    expect(FIREBALL_ANCHOR_TOLERANCE).toBe(0.01);
  });

  it('agrees through BM-13 when the program’s I_f brings it inside 1 %', () => {
    expect(fireballAgreement(row({ nimbusBurstKm: 52, nimbusOnEiepIfKm: 49.2 }))).toBe('bm13');
  });

  it('departs when neither does', () => {
    expect(fireballAgreement(row({ nimbusBurstKm: 52, nimbusOnEiepIfKm: 51.5 }))).toBe('departs');
    expect(fireballAgreement(row({ nimbusBurstKm: 52, nimbusOnEiepIfKm: null }))).toBe('departs');
  });
});

describe('rule 127: bursting against reaching the ground, and refusals', () => {
  it('does not agree where one bursts and the other reaches the ground', () => {
    expect(fireballAgreement(row({ nimbusBurstKm: null }))).toBe('regime');
    expect(fireballAgreement(row({ eiepBurstKm: null }))).toBe('regime');
  });

  it('agrees where both reach the ground, and sets aside what the program refused', () => {
    expect(fireballAgreement(row({ nimbusBurstKm: null, eiepBurstKm: null }))).toBe('within');
    expect(fireballAgreement(row({ eiepError: 'HTTP 500' }))).toBe('unanswered');
  });
});

describe('rule 128: what decides', () => {
  it('is met when the model is the field’s tool on every fireball, whatever the miss', () => {
    // Both 19 km too high: the field misses, and the model with it.
    const v = fireballAnchorVerdict([row({}), row({ nimbusBurstKm: 40.1, eiepBurstKm: 40.0 })]);
    expect(v.implementsReference).toBe(true);
    expect(v.met).toBe(true);
    expect(v.nimbus.medianAbsKm).toBeGreaterThan(v.eiep.medianAbsKm);
  });

  it('falls back to the bare comparison when a fireball departs', () => {
    const worse = fireballAnchorVerdict([
      row({}),
      row({ nimbusBurstKm: 60, eiepBurstKm: 40, nimbusOnEiepIfKm: 59 }),
    ]);
    expect(worse.implementsReference).toBe(false);
    expect(worse.met).toBe(false);
    const better = fireballAnchorVerdict([
      row({ nimbusBurstKm: 31, eiepBurstKm: 45, nimbusOnEiepIfKm: 44 }),
      row({ nimbusBurstKm: 32, eiepBurstKm: 46, nimbusOnEiepIfKm: 45 }),
    ]);
    expect(better.implementsReference).toBe(false);
    expect(better.met).toBe(true);
  });

  it('never lets a regime disagreement through the first branch', () => {
    const v = fireballAnchorVerdict([row({}), row({ nimbusBurstKm: null })]);
    expect(v.implementsReference).toBe(false);
  });
});
