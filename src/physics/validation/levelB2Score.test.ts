import { describe, expect, it } from 'vitest';
import { scoreLevelB2 } from './levelB2Score.js';

/**
 * Level B's second round, step 4, recomputed from the committed predictions
 * (aaec9bf) and the observed values on every commit: the outcome written in
 * levelBSecondRules.ts must stay what the files give.
 */
describe('level B, second round: the score', () => {
  const r = scoreLevelB2();
  const counted = (target: string) => r.counted.find((c) => c.target === target);

  it('2022 WJ1: E1 fails, E3 meets on the draws that dig no crater — incompatible', () => {
    expect(counted('E1')?.pass).toBe(false);
    expect(counted('E3')?.pass).toBe(true);
    expect(r.verdict).toBe('incompatible with 2022 WJ1; no class B');
  });

  it('the standard atmosphere, a sensitivity, fails E1 too', () => {
    expect(r.standardAtmosphere.find((c) => c.target === 'E1')?.pass).toBe(false);
  });

  it('Sterlitamak: a simple crater on every ground, its depth ratio outside the observed', () => {
    for (const checks of Object.values(r.sterlitamak)) {
      expect(checks.find((c) => c.target === 'K1')?.pass).toBe(true);
      expect(checks.find((c) => c.target === 'K4')?.pass).toBe(true);
      expect(checks.find((c) => c.target === 'K3')?.pass).toBe(false);
    }
    expect(Object.keys(r.sterlitamak).sort()).toEqual(['1800', '2200', '2700']);
  });

  it('the first round’s bodies, reported as regression cases', () => {
    const of = (event: string, target: string) =>
      r.regression.find((c) => c.event === event && c.target === target)?.pass;
    expect(of('2024 BX1', 'E1')).toBe(true);
    expect(of('2024 BX1', 'E3')).toBe(true);
    expect(of('2023 CX1', 'E3')).toBe(false);
    expect(of('Carancas', 'K1')).toBe(false);
  });
});
