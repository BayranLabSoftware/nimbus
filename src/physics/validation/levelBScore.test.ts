import { describe, expect, it } from 'vitest';
import { LEVEL_B_OUTCOME } from './levelBProtocolRules.js';
import { scoreLevelB } from './levelBScore.js';

/**
 * Level B, step 4, recomputed on every commit from the two committed files it
 * reads — the predictions (ad08138) and the observed values — so the outcome
 * written in levelBProtocolRules.ts cannot drift from them.
 */
describe('level B, step 4: the score of the frozen model (rules 868 and 870)', () => {
  const score = scoreLevelB();
  const pass = (event: string, target: string): boolean | undefined =>
    score.targets.find((t) => t.event === event && t.target === target)?.pass;

  it('breaks up in the air every counted body that did, and no more', () => {
    expect(pass('2024 BX1', 'E1')).toBe(true);
    expect(pass('2023 CX1', 'E1')).toBe(true);
    // The fragmentation altitudes: both missed.
    expect(pass('2024 BX1', 'E2')).toBe(false);
    expect(pass('2023 CX1', 'E2')).toBe(false);
    expect(pass('2024 BX1', 'E3')).toBe(false);
    expect(pass('2023 CX1', 'E3')).toBe(false);
  });

  it('digs no crater at Carancas, even with its mass widened', () => {
    expect(pass('Carancas', 'K1')).toBe(false);
    expect(pass('Carancas', 'K3')).toBe(false);
    expect(pass('Carancas', 'K4')).toBe(false);
  });

  it('holds Meteor Crater inside its literature ranges, class D', () => {
    expect(pass('Meteor Crater', 'D1')).toBe(true);
    expect(pass('Meteor Crater', 'D2')).toBe(true);
    expect(pass('Meteor Crater', 'D3')).toBe(true);
  });

  it('earns no class B, and says so in the outcome', () => {
    const earns = Object.fromEntries(score.families.map((f) => [f.family, f.earns]));
    expect(earns).toEqual({ entry: 'none', crater: 'none', consistency: 'D' });
    const entry = score.families.find((f) => f.family === 'entry');
    // The model breaks up and deposits its energy too high: a bias of the
    // sign the CNEOS fireballs showed (I2).
    expect(entry?.bias ?? 0).toBeGreaterThan(Math.log(1.3));
    expect(LEVEL_B_OUTCOME).toMatch(/^NOT EARNED/);
  });

  it('counts nothing of the seen rows or the circular diameter', () => {
    for (const t of score.targets) {
      if (['2008 TC3', '2018 LA'].includes(t.event)) expect(t.counted, t.event).toBe(false);
    }
    expect(score.targets.find((t) => t.event === 'Carancas' && t.target === 'K2')?.counted).toBe(
      false
    );
  });
});
