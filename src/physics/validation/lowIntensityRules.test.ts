import { describe, expect, it } from 'vitest';
import { DEEP_INTERFACE_EARTHQUAKES } from './deepInterfaceSetData.js';
import { NCEI_EARTHQUAKE_ROWS } from './heldOutByRuleData.js';
import {
  chooseLowIntensityToll,
  guardLowIntensityToll,
  lowIntensityScore,
  type LowIntensityToll,
  type TollRun,
} from './lowIntensityRules.js';
import {
  MODERATE_EARTHQUAKES,
  MODERATE_EXCLUDED,
  MODERATE_RECORDS,
  MODERATE_UNMATCHED,
  MODERATE_UNREADABLE,
} from './moderateSetData.js';
import { MODERATE_SITES } from './moderateSiteData.js';
import { UNSEEN_EARTHQUAKES } from './unseenSetData.js';

/**
 * Rules 45 to 49 of lowIntensityRules.ts, before either candidate runs: the
 * set is the one the rules name, and the choice and the guards do what the
 * rules say.
 */

describe('rule 45: the moderate set', () => {
  it('holds what the rules say, and none of the earlier sets’ earthquakes', () => {
    expect(MODERATE_RECORDS).toBe(302);
    expect(MODERATE_EARTHQUAKES).toHaveLength(298);
    expect(MODERATE_UNMATCHED).toHaveLength(3);
    expect(MODERATE_EXCLUDED).toHaveLength(1);
    expect(MODERATE_UNREADABLE).toHaveLength(0);
    const earlier = new Set([
      ...NCEI_EARTHQUAKE_ROWS.map((r) => r.comcat),
      ...UNSEEN_EARTHQUAKES.map((q) => q.comcat),
      ...DEEP_INTERFACE_EARTHQUAKES.map((q) => q.comcat),
    ]);
    const rule11 = new Set(NCEI_EARTHQUAKE_ROWS.flatMap((r) => r.nceiIds));
    for (const q of MODERATE_EARTHQUAKES) {
      expect(earlier.has(q.comcat), q.comcat).toBe(false);
      for (const id of q.nceiIds) expect(rule11.has(id)).toBe(false);
      expect(q.depthKm).toBeLessThanOrEqual(70);
    }
    expect(MODERATE_EARTHQUAKES.filter((q) => q.deaths > 0)).toHaveLength(120);
    expect(MODERATE_EARTHQUAKES.filter((q) => q.deaths >= 10)).toHaveLength(21);
    expect(MODERATE_EARTHQUAKES.filter((q) => q.magnitude < 5)).toHaveLength(9);
  });

  it('has the browser’s ground under every earthquake', () => {
    expect(MODERATE_SITES.map((s) => s.key)).toEqual(MODERATE_EARTHQUAKES.map((q) => q.comcat));
  });
});

const run = (comcat: string, record: number, central: number, inside: boolean): TollRun => ({
  comcat,
  record,
  central,
  inside,
});

describe('rule 47: selection on the dead', () => {
  it('scores with both sides plus one, and asks ln 1.25 and no fewer records held', () => {
    expect(lowIntensityScore([run('a', 9, 0, false)])).toBeCloseTo(Math.log(10), 12);
    const none = [run('a', 9, 0, false), run('b', 0, 0, true)];
    const runs: Record<LowIntensityToll, TollRun[]> = {
      none,
      midBand: [run('a', 9, 8, true), run('b', 0, 3, true)],
      pager: [run('a', 9, 4, true), run('b', 0, 0, true)],
    };
    const choice = chooseLowIntensityToll(runs);
    // none: ln 10 / 2 = 1.151; midBand: (|ln 0.9| + ln 4) / 2 = 0.746;
    // pager: ln 2 / 2 = 0.347.
    expect(choice.eligible).toEqual(['midBand', 'pager']);
    expect(choice.winner).toBe('pager');
    const fewer = { ...runs, pager: [run('a', 9, 4, true), run('b', 0, 1, false)] };
    // pager now holds 1 record against none's 1: still eligible; midBand holds 2.
    expect(chooseLowIntensityToll(fewer).eligible).toEqual(['midBand', 'pager']);
    const worse = { ...runs, pager: [run('a', 9, 0, false), run('b', 0, 0, false)] };
    expect(chooseLowIntensityToll(worse).eligible).toEqual(['midBand']);
  });
});

describe('rule 48: the guards', () => {
  const inPlace = [{ bias: 1.46 }, { bias: 0.33 }, { bias: 1.94 }];
  it('allows 0.10 on the log bias and one in a hundred more quiet earthquakes', () => {
    const winner = [
      { bias: 1.6, inside: 9, rows: 10 },
      { bias: 0.36, inside: 9, rows: 10 },
      { bias: 2.1, inside: 8, rows: 10 },
    ];
    expect(
      guardLowIntensityToll({ inPlace, winner }, { inPlaceShare: 0.029, winnerShare: 0.039 })
    ).toEqual({ adopted: true, tolls: true, quiet: true });
    expect(
      guardLowIntensityToll({ inPlace, winner }, { inPlaceShare: 0.029, winnerShare: 0.041 })
        .adopted
    ).toBe(false);
    const fewer = winner.map((c, i) => (i === 2 ? { ...c, inside: 7 } : c));
    expect(
      guardLowIntensityToll({ inPlace, winner: fewer }, { inPlaceShare: 0.029, winnerShare: 0.03 })
    ).toEqual({ adopted: false, tolls: false, quiet: true });
  });
});
