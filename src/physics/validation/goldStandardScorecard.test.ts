import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  CITABILITY,
  GOLD_STANDARD_SCORECARD,
  domainCount,
  ruleCredit,
  ruleHolds,
} from './goldStandardScorecard.js';

const GOLD_STANDARD = readFileSync(
  fileURLToPath(new URL('../../../docs/GOLD_STANDARD.md', import.meta.url)),
  'utf8'
);

describe('the count toward a 9', () => {
  it("scores every rule each domain's section of docs/GOLD_STANDARD.md names", () => {
    const sections: Record<string, string> = {
      Earthquakes: 'E',
      'Waves from earthquakes': 'T',
      'Waves from landslides': 'L',
      Impacts: 'I',
      Explosions: 'N',
      Volcanoes: 'V',
    };
    for (const d of GOLD_STANDARD_SCORECARD) {
      const letter = sections[d.domain];
      expect(letter, d.domain).toBeDefined();
      const named = [
        ...GOLD_STANDARD.matchAll(new RegExp(`\\*\\*(${letter ?? '?'}\\d)\\.`, 'g')),
      ].map((m) => m[1]);
      expect(named.length, d.domain).toBeGreaterThan(0);
      const scored = d.rules.map((r) => r.rule);
      for (const rule of named) expect(scored, `${d.domain} ${rule ?? ''}`).toContain(rule);
    }
    expect(CITABILITY.map((r) => r.rule)).toEqual(['C1', 'C2', 'C3']);
  });

  it('counts G5, G6 and G7 for every domain, and each generic rule once', () => {
    for (const d of GOLD_STANDARD_SCORECARD) {
      const covered = d.rules.flatMap((r) => [r.rule, ...(r.standsFor ?? [])]);
      for (const g of ['G1', 'G3', 'G4', 'G5', 'G6', 'G7']) {
        expect(
          covered.filter((x) => x === g),
          `${d.domain} ${g}`
        ).toHaveLength(1);
      }
      expect(covered, d.domain).not.toContain('G2');
    }
  });

  it('gives a rule with clauses the share that holds, and holds it only when all do', () => {
    const rule = {
      rule: 'X1',
      evidence: '',
      clauses: [
        { name: 'a', status: 'met' as const, evidence: '' },
        { name: 'b', status: 'pending' as const, evidence: '' },
      ],
    };
    expect(ruleCredit(rule)).toBe(0.5);
    expect(ruleHolds(rule)).toBe(false);
    expect(ruleCredit({ rule: 'X2', status: 'pending', evidence: '' })).toBe(0);
  });

  it('reads a 9 only when everything holds', () => {
    for (const d of GOLD_STANDARD_SCORECARD) {
      const c = domainCount(d);
      expect(c.reading).toBeLessThanOrEqual(9);
      expect(c.reading === 9, d.domain).toBe(c.held === c.rules);
      for (const m of [c.fidelity, c.beyond]) {
        expect(m.reading).toBeLessThanOrEqual(9);
        expect(m.reading === 9, d.domain).toBe(m.held === m.rules);
      }
    }
  });
});

describe('the two measures beside the count', () => {
  // The amendment of 16 September 2026, evening: fidelity is verification,
  // I4's exact count and every bound the first amendment read against a tool
  // of the field on the same rows; everything else is beyond.
  const FIDELITY = ['G1', 'E1', 'E2', 'E3', 'T1', 'T2', 'T3', 'L1', 'L2', 'I1', 'I2', 'I4'];
  const FIDELITY_TOO = ['N1', 'N2', 'V1', 'V2', 'V3', 'V4'];

  it('puts every rule of a domain under one measure, as the amendment lists them', () => {
    for (const d of GOLD_STANDARD_SCORECARD) {
      for (const r of d.rules) {
        const fidelity = [...FIDELITY, ...FIDELITY_TOO].includes(r.rule);
        expect(r.measure, `${d.domain} ${r.rule}`).toBe(fidelity ? 'fidelity' : 'beyond');
      }
    }
  });

  it('never counts a band, the input space, robustness, gaps or method as fidelity', () => {
    for (const d of GOLD_STANDARD_SCORECARD) {
      for (const r of d.rules) {
        const generic = [r.rule, ...(r.standsFor ?? [])].filter((x) =>
          ['G3', 'G4', 'G5', 'G6', 'G7'].includes(x)
        );
        if (generic.length > 0 && r.rule !== 'L1') {
          expect(r.measure, `${d.domain} ${r.rule}`).toBe('beyond');
        }
      }
    }
  });

  it('splits the count without changing it', () => {
    for (const d of GOLD_STANDARD_SCORECARD) {
      const c = domainCount(d);
      expect(c.fidelity.rules + c.beyond.rules, d.domain).toBe(c.rules);
      expect(c.fidelity.held + c.beyond.held, d.domain).toBe(c.held);
      expect(c.fidelity.credit + c.beyond.credit, d.domain).toBeCloseTo(c.credit, 12);
    }
  });
});
