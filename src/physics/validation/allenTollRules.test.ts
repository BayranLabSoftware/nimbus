import { describe, expect, it } from 'vitest';
import {
  ALLEN_TOLL_BESIDE,
  ALLEN_TOLL_CANDIDATES,
  chooseAllenToll,
  guardAllenToll,
  type AllenTollReading,
} from './allenTollRules.js';
import { ATLAS_EARTHQUAKES } from './atlasSetData.js';
import { DEEP_INTERFACE_EARTHQUAKES } from './deepInterfaceSetData.js';
import { NCEI_EARTHQUAKE_ROWS } from './heldOutByRuleData.js';
import { MODERATE_EARTHQUAKES } from './moderateSetData.js';
import { PAGER_PRODUCTS } from './pagerProductsData.js';
import { POINT_SOURCE_EARTHQUAKES } from './pointSourceSetData.js';
import {
  SMALL_DEEP_EARTHQUAKES,
  SMALL_DEEP_EXCLUDED,
  SMALL_DEEP_RECORDS,
  SMALL_DEEP_UNMATCHED,
  SMALL_DEEP_UNREADABLE,
} from './smallDeepSetData.js';
import { SMALL_DEEP_SITES } from './smallDeepSiteData.js';
import { UNSEEN_EARTHQUAKES } from './unseenSetData.js';

/**
 * Rules 61 to 65 of allenTollRules.ts, before any toll is run on rule 61's
 * set: the set is the one the rules name, and the choice and the guards do
 * what the rules say.
 */

describe('rule 61: the small and deep set', () => {
  it('holds what the rule says, and no earthquake read before', () => {
    expect(SMALL_DEEP_RECORDS).toBe(241);
    expect(SMALL_DEEP_EARTHQUAKES).toHaveLength(194);
    expect(SMALL_DEEP_UNMATCHED).toHaveLength(2);
    expect(SMALL_DEEP_EXCLUDED).toHaveLength(44);
    expect(SMALL_DEEP_UNREADABLE).toHaveLength(0);
    const earlier = new Set([
      ...NCEI_EARTHQUAKE_ROWS.map((r) => r.comcat),
      ...UNSEEN_EARTHQUAKES.map((q) => q.comcat),
      ...DEEP_INTERFACE_EARTHQUAKES.map((q) => q.comcat),
      ...MODERATE_EARTHQUAKES.map((q) => q.comcat),
      ...POINT_SOURCE_EARTHQUAKES.map((q) => q.comcat),
      ...ATLAS_EARTHQUAKES.map((q) => q.comcat),
      ...PAGER_PRODUCTS.map((p) => p.comcat),
    ]);
    for (const q of SMALL_DEEP_EARTHQUAKES) {
      expect(earlier.has(q.comcat), q.comcat).toBe(false);
      expect(q.date >= '2008-01-01' && q.date < '2026-01-01', q.date).toBe(true);
    }
  });

  it('counts 94 small earthquakes, 31 with deaths, and 100 deep, 44 with deaths', () => {
    const small = SMALL_DEEP_EARTHQUAKES.filter((q) => q.window === 'small');
    const deep = SMALL_DEEP_EARTHQUAKES.filter((q) => q.window === 'deep');
    expect([small.length, small.filter((q) => q.deaths > 0).length]).toEqual([94, 31]);
    expect(small.filter((q) => q.deaths >= 10)).toHaveLength(0);
    expect([deep.length, deep.filter((q) => q.deaths > 0).length]).toEqual([100, 44]);
    expect(deep.filter((q) => q.deaths >= 10)).toHaveLength(8);
    expect([
      deep.filter((q) => q.magnitude < 6.5).length,
      deep.filter((q) => q.magnitude >= 6.5 && q.magnitude < 7.5).length,
      deep.filter((q) => q.magnitude >= 7.5).length,
    ]).toEqual([49, 21, 30]);
    expect(deep.filter((q) => q.depthKm > 70)).toHaveLength(62);
  });

  it('has the browser’s ground under every earthquake', () => {
    expect(SMALL_DEEP_SITES.map((s) => s.key)).toEqual(SMALL_DEEP_EARTHQUAKES.map((q) => q.comcat));
  });
});

const reading = (score: number, cells: [number, number][]): AllenTollReading => ({
  score,
  held: cells.reduce((a, [inside]) => a + inside, 0),
  cells: cells.map(([inside, rows]) => ({ inside, rows })),
});

describe('rule 62: the candidates', () => {
  it('names the toll in place, the equation with V and VI both ways, and three tolls beside', () => {
    expect(ALLEN_TOLL_CANDIDATES).toEqual([
      { key: 'boore2014', law: 'boore2014', low: 'none' },
      { key: 'allenMidBand', law: 'allen2012HypocentralBelowMw7.5', low: 'midBand' },
      { key: 'allenPager', law: 'allen2012HypocentralBelowMw7.5', low: 'pager' },
    ]);
    expect(ALLEN_TOLL_BESIDE.map((t) => t.key)).toEqual([
      'allenNone',
      'booreMidBand',
      'boorePager',
    ]);
  });
});

describe('rule 63: selection on the dead', () => {
  it('asks a score no higher and eight records in ten in every cell with rows', () => {
    const readings = {
      boore2014: reading(1.2, [
        [40, 50],
        [8, 10],
        [3, 4],
      ]),
      allenMidBand: reading(1.1, [
        [40, 50],
        [8, 10],
        [0, 0],
      ]),
      allenPager: reading(1.2, [
        [41, 50],
        [9, 10],
        [4, 5],
      ]),
    };
    expect(chooseAllenToll(readings)).toEqual({
      winner: 'allenMidBand',
      eligible: ['allenMidBand', 'allenPager'],
    });
    const short = {
      ...readings,
      allenMidBand: reading(1.0, [
        [39, 50],
        [8, 10],
        [0, 0],
      ]),
    };
    expect(chooseAllenToll(short)).toEqual({ winner: 'allenPager', eligible: ['allenPager'] });
    const worse = {
      ...short,
      allenPager: reading(1.21, [
        [45, 50],
        [9, 10],
        [5, 5],
      ]),
    };
    expect(chooseAllenToll(worse)).toEqual({ winner: null, eligible: [] });
  });
});

describe('rule 64: the guards', () => {
  const inPlace = [{ bias: 1.46 }, { bias: 0.33 }, { bias: 1.94 }];
  const winner = [
    { bias: 1.6, inside: 9, rows: 10 },
    { bias: 0.4, inside: 8, rows: 10 },
    { bias: 2.0, inside: 10, rows: 10 },
  ];
  it('allows 0.10 of log bias, one in a hundred quiet and 0.10 of the moderate score', () => {
    expect(
      guardAllenToll(
        { inPlace, winner },
        { inPlaceShare: 0.029, winnerShare: 0.039 },
        { inPlaceScore: 1.185, winnerScore: 1.285 }
      )
    ).toEqual({ adopted: true, rule11: true, quiet: true, moderate: true });
    expect(
      guardAllenToll(
        { inPlace, winner },
        { inPlaceShare: 0.029, winnerShare: 0.039 },
        { inPlaceScore: 1.185, winnerScore: 1.3 }
      )
    ).toEqual({ adopted: false, rule11: true, quiet: true, moderate: false });
    const fewer = winner.map((c, i) => (i === 0 ? { ...c, inside: 7 } : c));
    expect(
      guardAllenToll(
        { inPlace, winner: fewer },
        { inPlaceShare: 0.029, winnerShare: 0.02 },
        { inPlaceScore: 1.185, winnerScore: 1.0 }
      )
    ).toEqual({ adopted: false, rule11: false, quiet: true, moderate: true });
  });
});
