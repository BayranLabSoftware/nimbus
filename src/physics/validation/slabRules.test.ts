import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DEEP_LAW_FROM_KM } from '../events/earthquake/simulate.js';
import { ATLAS_SEEN } from './atlasRules.js';
import { ATLAS_EARTHQUAKES } from './atlasSetData.js';
import { DEEP_INTERFACE_EARTHQUAKES } from './deepInterfaceSetData.js';
import { RULE_EARTHQUAKES } from './heldOutByRule.js';
import { NCEI_EARTHQUAKE_ROWS } from './heldOutByRuleData.js';
import { MODERATE_EARTHQUAKES } from './moderateSetData.js';
import { PAGER_PRODUCTS } from './pagerProductsData.js';
import { isLeastModelled, POINT_SOURCE_SEEN } from './pointSourceRules.js';
import { POINT_SOURCE_EARTHQUAKES } from './pointSourceSetData.js';
import type { ProspectiveScore } from './prospectiveRules.js';
import {
  chooseSlabCandidate,
  guardSlabLaw,
  SLAB_CANDIDATES,
  SLAB_DEAD_ROOM,
  SLAB_MODEL_GROUPS,
  type SlabScores,
} from './slabRules.js';
import {
  SLAB_EARTHQUAKES,
  SLAB_LISTED,
  SLAB_UNREADABLE,
  SLAB_WITHOUT_COVERAGE,
  SLAB_WITHOUT_MODEL,
} from './slabSetData.js';
import { SLAB_SITES } from './slabSiteData.js';
import { SMALL_DEEP_EARTHQUAKES } from './smallDeepSetData.js';
import { UNSEEN_EARTHQUAKES } from './unseenSetData.js';

/**
 * Rules 66 to 70 of slabRules.ts, before any candidate is scored: the set is
 * the one the rules name, and the choice and the guard do what rules 68 and
 * 69 say.
 */

const byCell = (rows: readonly { magnitude: number }[]): number[] => [
  rows.filter((q) => q.magnitude < 6.5).length,
  rows.filter((q) => q.magnitude >= 6.5 && q.magnitude < 7.5).length,
  rows.filter((q) => q.magnitude >= 7.5).length,
];

describe('rule 66: the earthquakes of 1973 to 2025 deeper than 70 km', () => {
  it('holds what the rule says, and no earthquake read before', () => {
    expect(SLAB_LISTED).toBe(737);
    expect(SLAB_EARTHQUAKES).toHaveLength(618);
    expect(SLAB_WITHOUT_COVERAGE).toHaveLength(75);
    expect(SLAB_WITHOUT_MODEL).toHaveLength(0);
    expect(SLAB_UNREADABLE).toHaveLength(0);
    // The 44 already read are the listed events that are neither rows nor
    // listed as left out.
    expect(SLAB_LISTED - SLAB_EARTHQUAKES.length - SLAB_WITHOUT_COVERAGE.length).toBe(44);
    const dart = JSON.parse(
      readFileSync(
        fileURLToPath(new URL('../../../benchmark/dart/records.json', import.meta.url)),
        'utf8'
      )
    ) as { events: { id: string }[] };
    const earlier = new Set([
      ...NCEI_EARTHQUAKE_ROWS.map((r) => r.comcat),
      ...UNSEEN_EARTHQUAKES.map((q) => q.comcat),
      ...DEEP_INTERFACE_EARTHQUAKES.map((q) => q.comcat),
      ...MODERATE_EARTHQUAKES.map((q) => q.comcat),
      ...POINT_SOURCE_SEEN.map((s) => s.comcat),
      ...POINT_SOURCE_EARTHQUAKES.map((q) => q.comcat),
      ...ATLAS_SEEN.map((s) => s.comcat),
      ...ATLAS_EARTHQUAKES.map((q) => q.comcat),
      ...SMALL_DEEP_EARTHQUAKES.map((q) => q.comcat),
      ...PAGER_PRODUCTS.map((p) => p.comcat),
      ...dart.events.map((e) => e.id),
    ]);
    for (const q of [...SLAB_EARTHQUAKES.map((r) => r.comcat), ...SLAB_WITHOUT_COVERAGE]) {
      expect(earlier.has(q), q).toBe(false);
    }
    for (const q of SLAB_EARTHQUAKES) {
      expect(q.magnitude).toBeGreaterThanOrEqual(6);
      expect(q.depthKm).toBeGreaterThan(DEEP_LAW_FROM_KM);
      expect(q.depthKm).toBeLessThanOrEqual(300);
      expect(q.time >= '1973-01-01' && q.time < '2026-01-01', q.time).toBe(true);
    }
  });

  it('counts 427, 180 and 11 by cell, 562 quiet, 212 deeper than 150 km, 22, 9 and 1 least modelled', () => {
    expect(byCell(SLAB_EARTHQUAKES)).toEqual([427, 180, 11]);
    expect(SLAB_EARTHQUAKES.filter((q) => q.ncei.length === 0)).toHaveLength(562);
    expect(SLAB_EARTHQUAKES.filter((q) => q.depthKm > 150)).toHaveLength(212);
    expect(byCell(SLAB_EARTHQUAKES.filter(isLeastModelled))).toEqual([22, 9, 1]);
  });

  it('was drawn with the slab models it names: 615 maps weighting them 0.5 or more, 543 by ShakeMap 4.0.2', () => {
    expect(SLAB_EARTHQUAKES.filter((q) => q.slabWeight >= 0.5)).toHaveLength(615);
    expect(SLAB_EARTHQUAKES.filter((q) => q.interfaceWeight >= 0.5)).toHaveLength(0);
    expect(SLAB_EARTHQUAKES.filter((q) => q.revision.startsWith('4.0.2'))).toHaveLength(543);
    const groups = Object.values(SLAB_MODEL_GROUPS).map(
      (sets) => SLAB_EARTHQUAKES.filter((q) => sets.includes(q.slabSet)).length
    );
    expect(groups).toEqual([490, 21, 107]);
    expect(groups.reduce((a, b) => a + b, 0)).toBe(SLAB_EARTHQUAKES.length);
  });

  it('keeps its own records to the years the country curves were fitted on', () => {
    const recorded = SLAB_EARTHQUAKES.filter((q) => q.ncei.length > 0);
    expect(recorded).toHaveLength(56);
    for (const q of recorded) expect(q.time < '2008-01-01', q.comcat).toBe(true);
  });

  it('has the browser’s ground under every earthquake', () => {
    expect(SLAB_SITES.map((s) => s.key)).toEqual(SLAB_EARTHQUAKES.map((q) => q.comcat));
  });
});

const score = (value: number | null, sharpness: number | null = 0.5): ProspectiveScore => ({
  bands: [],
  score: value,
  sharpness,
});

const scores = (entries: Record<string, [ProspectiveScore, ProspectiveScore]>): SlabScores =>
  Object.fromEntries(
    SLAB_CANDIDATES.map((c) => {
      const [all, leastModelled] = entries[c.key] ?? [score(0.3), score(0.3)];
      return [c.key, { all, leastModelled }];
    })
  );

describe('rule 67: the candidates', () => {
  it('names the law in place first and the two slab models against it, from 70 km', () => {
    expect(SLAB_CANDIDATES).toEqual([
      { key: 'boore2014', deepLaw: 'none' },
      { key: 'abrahamson2016Slab', deepLaw: 'abrahamson2016Slab' },
      { key: 'parker2022Slab', deepLaw: 'parker2022Slab' },
    ]);
    expect(DEEP_LAW_FROM_KM).toBe(70);
  });
});

describe('rule 68: the choice', () => {
  it('asks 0.10 of score, allows 0.10 of sharpness, and takes the higher score', () => {
    const choice = chooseSlabCandidate(
      scores({
        boore2014: [score(0.3, 0.5), score(0.4)],
        abrahamson2016Slab: [score(0.41, 0.6), score(0.4)],
        parker2022Slab: [score(0.45, 0.55), score(0.5)],
      })
    );
    // BC Hydro is up by 0.11 and exactly 0.10 blunter; Parker by 0.15 and 0.05 blunter.
    expect(choice.displacing).toEqual(['abrahamson2016Slab', 'parker2022Slab']);
    expect(choice.winner).toBe('parker2022Slab');
    const blunt = chooseSlabCandidate(
      scores({
        boore2014: [score(0.3, 0.5), score(0.4)],
        abrahamson2016Slab: [score(0.6, 0.61), score(0.5)],
      })
    );
    expect(blunt.displacing).toEqual([]);
    expect(blunt.winner).toBeNull();
  });

  it('takes the sharper where the two scores tie', () => {
    const choice = chooseSlabCandidate(
      scores({
        boore2014: [score(0.1, 0.5), score(0.1)],
        abrahamson2016Slab: [score(0.4, 0.45), score(0.2)],
        parker2022Slab: [score(0.4, 0.4), score(0.2)],
      })
    );
    expect(choice.winner).toBe('parker2022Slab');
  });

  it('guards on the least modelled maps where both scores can be read', () => {
    const lost = chooseSlabCandidate(
      scores({
        boore2014: [score(0.3), score(0.4)],
        abrahamson2016Slab: [score(0.5), score(0.39)],
      })
    );
    expect(lost.displacing).toEqual(['abrahamson2016Slab']);
    expect(lost.guarded).toEqual([]);
    expect(lost.winner).toBeNull();
    const unread = chooseSlabCandidate(
      scores({
        boore2014: [score(0.3), score(null)],
        abrahamson2016Slab: [score(0.5), score(0.1)],
      })
    );
    expect(unread.winner).toBe('abrahamson2016Slab');
  });

  it('keeps the law in place when nothing displaces it', () => {
    expect(chooseSlabCandidate(scores({ boore2014: [score(0.3), score(0.3)] })).winner).toBeNull();
  });
});

describe('rule 69: the guard on the dead', () => {
  it('allows 0.10 of rule 47’s score and no more', () => {
    expect(SLAB_DEAD_ROOM).toBe(0.1);
    expect(guardSlabLaw({ inPlace: 1, winner: 1.1 })).toBe(true);
    expect(guardSlabLaw({ inPlace: 1, winner: 0.4 })).toBe(true);
    expect(guardSlabLaw({ inPlace: 1, winner: 1.1001 })).toBe(false);
  });

  it('reads rule 61’s 62 earthquakes deeper than 70 km, all of 2008 to 2025', () => {
    const deep = SMALL_DEEP_EARTHQUAKES.filter((q) => q.depthKm > DEEP_LAW_FROM_KM);
    expect(deep).toHaveLength(62);
    expect(byCell(deep)).toEqual([21, 19, 22]);
    expect(deep.filter((q) => q.deaths > 0)).toHaveLength(32);
    for (const q of deep) {
      expect(q.window).toBe('deep');
      expect(q.time >= '2008-01-01' && q.time < '2026-01-01', q.time).toBe(true);
    }
  });
});

describe('rule 70: what an adoption would move', () => {
  it('moves two of rule 11’s held-out earthquakes and none of rule 23’s', () => {
    const deepHeldOut = RULE_EARTHQUAKES.filter(
      (q) => q.role === 'heldOut' && q.row.depthKm > DEEP_LAW_FROM_KM
    );
    expect(deepHeldOut).toHaveLength(2);
    expect(UNSEEN_EARTHQUAKES.filter((q) => q.depthKm > DEEP_LAW_FROM_KM)).toHaveLength(0);
  });
});
