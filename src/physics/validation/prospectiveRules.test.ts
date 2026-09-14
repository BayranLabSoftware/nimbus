import { describe, expect, it } from 'vitest';
import type { ContourPair } from './contourLaws.js';
import {
  bandOutcome,
  displacesLawInPlace,
  peirceSkill,
  PROSPECTIVE_START,
  prospectiveScore,
} from './prospectiveRules.js';

/**
 * Rule 28's score counts what it says it counts, and rule 29's choice
 * decides what it says it decides. Nothing here reads an earthquake: rule
 * 27's set begins after these rules.
 */

const pair = (threshold: 7 | 8, modelKm2: number, observedKm2: number): ContourPair => ({
  magnitude: 6.2,
  threshold,
  modelKm2,
  observedKm2,
});

describe("rule 28's score", () => {
  it('sorts every band of every earthquake into one of four, at the 10 km² floor', () => {
    const o = bandOutcome(
      [
        pair(7, 120, 300), // hit
        pair(7, 0, 50), // miss
        pair(7, 9, 50), // below the floor: a miss
        pair(7, 80, 0), // false alarm
        pair(7, 0, 0), // silence
        pair(7, 5, 9), // both below the floor: a silence
        pair(8, 40, 40), // another band, not counted here
      ],
      7
    );
    expect(o).toEqual({ hits: 1, misses: 2, falseAlarms: 1, silences: 2 });
  });

  it('is the Peirce skill score, and nothing where a band is never or always reached', () => {
    expect(peirceSkill({ hits: 8, misses: 2, falseAlarms: 10, silences: 90 })).toBeCloseTo(0.7, 10);
    expect(peirceSkill({ hits: 0, misses: 0, falseAlarms: 3, silences: 5 })).toBeNull();
    expect(peirceSkill({ hits: 4, misses: 1, falseAlarms: 0, silences: 0 })).toBeNull();
  });

  it('gives a relation that rightly draws nothing the credit rule 18 did not', () => {
    // Ten quiet maps and two strong ones: one law paints VII everywhere,
    // the other only where the map has it.
    const everywhere: ContourPair[] = [];
    const whereDue: ContourPair[] = [];
    for (let i = 0; i < 10; i++) {
      everywhere.push(pair(7, 200, 0));
      whereDue.push(pair(7, 0, 0));
    }
    for (let i = 0; i < 6; i++) {
      everywhere.push(pair(7, 400, 400));
      whereDue.push(pair(7, 350, 400));
    }
    const a = prospectiveScore(everywhere);
    const b = prospectiveScore(whereDue);
    expect(a.score).toBeCloseTo(0, 10);
    expect(b.score).toBeCloseTo(1, 10);
    // Blunter by 0.067 in log radius, within the tenth rule 29 allows.
    expect(b.sharpness).toBeCloseTo(0.5 * Math.log(400 / 350), 10);
    expect(displacesLawInPlace(a, b)).toBe(true);
    // Blunter by 0.29 is not allowed, whatever the skill.
    const blunt = prospectiveScore(
      whereDue.map((p) => (p.modelKm2 > 0 ? { ...p, modelKm2: 225 } : p))
    );
    expect(blunt.sharpness).toBeCloseTo(0.5 * Math.log(400 / 225), 10);
    expect(displacesLawInPlace(a, blunt)).toBe(false);
  });

  it('keeps the law in place unless beaten by 0.10 in score', () => {
    const base = prospectiveScore([
      ...Array.from({ length: 6 }, () => pair(7, 400, 400)),
      ...Array.from({ length: 10 }, () => pair(7, 0, 0)),
      pair(7, 50, 0),
    ]);
    const close = prospectiveScore([
      ...Array.from({ length: 6 }, () => pair(7, 400, 400)),
      ...Array.from({ length: 11 }, () => pair(7, 0, 0)),
    ]);
    expect((close.score ?? 0) - (base.score ?? 0)).toBeLessThan(0.1);
    expect(displacesLawInPlace(base, close)).toBe(false);
  });

  it('starts the day after it was written', () => {
    expect(PROSPECTIVE_START).toBe('2026-09-15');
  });
});
