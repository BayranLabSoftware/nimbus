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
    }
  });
});
