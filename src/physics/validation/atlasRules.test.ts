import { describe, expect, it } from 'vitest';
import {
  ATLAS_CANDIDATES,
  ATLAS_SEEN,
  chooseAtlasCandidate,
  type AtlasScores,
} from './atlasRules.js';
import {
  ATLAS_EARTHQUAKES,
  ATLAS_LISTED,
  ATLAS_UNREADABLE,
  ATLAS_WITHOUT_COVERAGE,
  ATLAS_WITHOUT_MODEL,
} from './atlasSetData.js';
import { ATLAS_SITES } from './atlasSiteData.js';
import { DEEP_INTERFACE_EARTHQUAKES } from './deepInterfaceSetData.js';
import { NCEI_EARTHQUAKE_ROWS } from './heldOutByRuleData.js';
import { MODERATE_EARTHQUAKES } from './moderateSetData.js';
import { isLeastModelled, POINT_SOURCE_SEEN } from './pointSourceRules.js';
import { POINT_SOURCE_EARTHQUAKES } from './pointSourceSetData.js';
import type { ProspectiveScore } from './prospectiveRules.js';
import { UNSEEN_EARTHQUAKES } from './unseenSetData.js';

/**
 * Rules 56 to 60 of atlasRules.ts, before any candidate is scored: the set is
 * the one the rules name, and the choice does what rule 58 says.
 */

const byCell = (rows: readonly { magnitude: number }[]): number[] => [
  rows.filter((q) => q.magnitude < 6.5).length,
  rows.filter((q) => q.magnitude >= 6.5 && q.magnitude < 7.5).length,
  rows.filter((q) => q.magnitude >= 7.5).length,
];

describe('rule 56: the Atlas of 1973 to 1999', () => {
  it('holds what the rule says, and no earthquake read before', () => {
    expect(ATLAS_LISTED).toBe(1_140);
    expect(ATLAS_EARTHQUAKES).toHaveLength(1_101);
    expect(ATLAS_WITHOUT_COVERAGE).toHaveLength(37);
    expect(ATLAS_WITHOUT_MODEL).toHaveLength(0);
    expect(ATLAS_UNREADABLE).toHaveLength(0);
    expect(ATLAS_SEEN.map((s) => s.comcat)).toEqual(['ci3144585', 'usp0008rpa']);
    const earlier = new Set([
      ...NCEI_EARTHQUAKE_ROWS.map((r) => r.comcat),
      ...UNSEEN_EARTHQUAKES.map((q) => q.comcat),
      ...DEEP_INTERFACE_EARTHQUAKES.map((q) => q.comcat),
      ...MODERATE_EARTHQUAKES.map((q) => q.comcat),
      ...POINT_SOURCE_SEEN.map((s) => s.comcat),
      ...POINT_SOURCE_EARTHQUAKES.map((q) => q.comcat),
      ...ATLAS_SEEN.map((s) => s.comcat),
    ]);
    for (const q of ATLAS_EARTHQUAKES) {
      expect(earlier.has(q.comcat), q.comcat).toBe(false);
      expect(q.magnitude).toBeGreaterThanOrEqual(6);
      expect(q.depthKm).toBeLessThanOrEqual(40);
      expect(q.time >= '1973-01-01' && q.time < '2000-01-01', q.time).toBe(true);
      expect(q.revision.startsWith('4.0.2+'), q.revision).toBe(true);
    }
  });

  it('counts 617, 419 and 65 by cell, 691 quiet, 849 of no fault type, 47, 68 and 23 least modelled', () => {
    expect(byCell(ATLAS_EARTHQUAKES)).toEqual([617, 419, 65]);
    expect(ATLAS_EARTHQUAKES.filter((q) => q.ncei.length === 0)).toHaveLength(691);
    expect(ATLAS_EARTHQUAKES.filter((q) => q.faultType === 'all')).toHaveLength(849);
    expect(byCell(ATLAS_EARTHQUAKES.filter(isLeastModelled))).toEqual([47, 68, 23]);
  });

  it('has the browser’s ground under every earthquake', () => {
    expect(ATLAS_SITES.map((s) => s.key)).toEqual(ATLAS_EARTHQUAKES.map((q) => q.comcat));
  });
});

const score = (value: number | null, sharpness: number | null = 0.5): ProspectiveScore => ({
  bands: [],
  score: value,
  sharpness,
});

const scores = (entries: Record<string, [ProspectiveScore, ProspectiveScore]>): AtlasScores =>
  Object.fromEntries(
    ATLAS_CANDIDATES.map((c) => {
      const [all, leastModelled] = entries[c.key] ?? [score(0.3), score(0.3)];
      return [c.key, { all, leastModelled }];
    })
  );

describe('rule 58: the candidates and the choice', () => {
  it('names the law in place first and six ways of drawing the rings against it', () => {
    expect(ATLAS_CANDIDATES.map((c) => c.key)).toEqual([
      'boore2014',
      'joynerBoore1981',
      'boore2014FromMw7.5',
      'allen2012Hypocentral',
      'allen2012HypocentralBelowMw7.5',
      'boore2014Pgv',
      'boore2014ThompsonWorden2018',
    ]);
  });

  it('asks 0.10 of score, allows 0.10 of sharpness, and takes the highest score', () => {
    const choice = chooseAtlasCandidate(
      scores({
        boore2014: [score(0.3, 0.5), score(0.4)],
        joynerBoore1981: [score(0.41, 0.55), score(0.4)],
        allen2012Hypocentral: [score(0.45, 0.6), score(0.5)],
        boore2014Pgv: [score(0.5, 0.61), score(0.5)],
      })
    );
    // JB81 is up by 0.11 and 0.05 blunter; Allen by 0.15 and exactly 0.10 blunter; PGV 0.11 blunter.
    expect(choice.displacing).toEqual(['joynerBoore1981', 'allen2012Hypocentral']);
    expect(choice.winner).toBe('allen2012Hypocentral');
  });

  it('guards on the least modelled maps where both scores can be read', () => {
    const lost = chooseAtlasCandidate(
      scores({
        boore2014: [score(0.3), score(0.4)],
        allen2012Hypocentral: [score(0.5), score(0.39)],
      })
    );
    expect(lost.displacing).toEqual(['allen2012Hypocentral']);
    expect(lost.guarded).toEqual([]);
    expect(lost.winner).toBeNull();
    const unread = chooseAtlasCandidate(
      scores({
        boore2014: [score(0.3), score(null)],
        allen2012Hypocentral: [score(0.5), score(0.1)],
      })
    );
    expect(unread.winner).toBe('allen2012Hypocentral');
  });

  it('keeps the law in place when nothing displaces it', () => {
    expect(chooseAtlasCandidate(scores({ boore2014: [score(0.3), score(0.3)] })).winner).toBeNull();
  });
});
