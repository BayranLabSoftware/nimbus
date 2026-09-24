import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  FCM_ROUND3,
  FCM_ROUND3_LIST,
  FCM_ROUND3_OBSERVABLES,
  FCM_ROUND3_SEAL,
  FCM_ROUND3_STRUCTURAL_A,
} from './fcmRound3Charter.js';
import { FOURTH_SET_CANDIDATES } from './fourthSetRegister.js';

describe('rules 1162 to 1168: the opening document of round 3', () => {
  it('seals the candidate: its files are the ones the round judges (rule 1162)', () => {
    for (const [path, sha] of Object.entries(FCM_ROUND3_SEAL)) {
      const got = createHash('sha256').update(readFileSync(path)).digest('hex');
      expect(got, `${path} changed: another version, not the candidate of round 3`).toBe(sha);
    }
  });

  it('names each candidate’s observable from its metadata alone (rule 1164 (d))', () => {
    for (const c of FOURTH_SET_CANDIDATES) {
      const expected = c.mentions.includes('deposition')
        ? 'primary'
        : c.mentions.includes('trajectory') &&
            (c.mentions.includes('flare') || c.mentions.includes('lightCurve'))
          ? 'proxy'
          : 'diagnostic';
      expect(FCM_ROUND3_OBSERVABLES[c.event], c.event).toBe(expected);
    }
    expect(Object.keys(FCM_ROUND3_OBSERVABLES).length).toBe(FOURTH_SET_CANDIDATES.length);
  });

  it('keeps the proxy at half a primary and the severe misses beyond the margins', () => {
    expect(FCM_ROUND3.verdict.proxyWeight).toBe(0.5);
    expect(FCM_ROUND3.severe.primaryKm).toBeGreaterThan(FCM_ROUND3.margins.primaryKm);
    expect(FCM_ROUND3.severe.proxyKm).toBeGreaterThan(FCM_ROUND3.margins.proxyKm);
    expect(FCM_ROUND3.weights.mixture.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(FCM_ROUND3.weights.rotated.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });

  it('freezes the list as the primary and proxy candidates, and nothing else (rule 1173)', () => {
    const strong = Object.entries(FCM_ROUND3_OBSERVABLES).filter(([, k]) => k !== 'diagnostic');
    expect(strong.map(([e]) => e).sort()).toEqual(
      [...FCM_ROUND3_LIST.primary, ...FCM_ROUND3_LIST.proxy].sort()
    );
    for (const e of FCM_ROUND3_LIST.primary) expect(FCM_ROUND3_OBSERVABLES[e]).toBe('primary');
    for (const e of FCM_ROUND3_LIST.proxy) expect(FCM_ROUND3_OBSERVABLES[e]).toBe('proxy');
    expect(FOURTH_SET_CANDIDATES.some((c) => c.status === 'to check')).toBe(false);
    expect(FCM_ROUND3_STRUCTURAL_A.severeOnPrimaryA).toBe(1);
  });
});
