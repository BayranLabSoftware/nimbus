import { describe, expect, it } from 'vitest';
import {
  adoptPagerChain,
  GUARD_TOLERANCE,
  PEOPLE_FLOOR,
  PEOPLE_MARGIN,
  pagerPeopleAtLeast,
  peopleScore,
  peopleScoreOf,
  scorePeople,
  type ChainEvidence,
  type PagerProduct,
} from './pagerChain.js';
import { PAGER_PRODUCTS } from './pagerProductsData.js';

/**
 * Rules 32 and 33 decide what they say they decide. Nothing here runs a
 * chain on an earthquake of the set.
 */

describe('the stored PAGER products', () => {
  it('are the 187 earthquakes the campaign scored, each with ten bins', () => {
    expect(PAGER_PRODUCTS).toHaveLength(187);
    expect(new Set(PAGER_PRODUCTS.map((p) => p.comcat)).size).toBe(187);
    for (const p of PAGER_PRODUCTS) {
      expect(p.exposure).toHaveLength(10);
      expect(p.exposure.every((n) => Number.isInteger(n) && n >= 0)).toBe(true);
      expect(p.fatalities).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('rule 32: people against PAGER', () => {
  const product: PagerProduct = {
    comcat: 'x',
    alert: 'yellow',
    maxMmi: 8,
    exposure: [0, 0, 10, 100, 1_000, 2_000, 3_000, 4_000, 5_000, 6_000],
    fatalities: 3,
  };

  it('counts PAGER from a bin up, IX taking X with it', () => {
    expect(pagerPeopleAtLeast(product, 7)).toBe(18_000);
    expect(pagerPeopleAtLeast(product, 8)).toBe(15_000);
    expect(pagerPeopleAtLeast(product, 9)).toBe(11_000);
  });

  it('scores a floored log ratio, and nothing where neither side reaches the floor', () => {
    expect(peopleScore(999, 0)).toBeNull();
    expect(peopleScore(0, PEOPLE_FLOOR)).toBeCloseTo(Math.log(1_000 / 2_000), 12);
    expect(peopleScore(9_000, 4_000)).toBeCloseTo(Math.log(10_000 / 5_000), 12);
  });

  it('averages by intensity and magnitude cell, and scores the cells with five pairs', () => {
    const pairs = [6.0, 6.1, 6.2, 6.3, 6.4].map((magnitude) => ({
      magnitude,
      level: 7 as const,
      model: 1_000,
      pager: 3_000,
    }));
    const cells = scorePeople([...pairs, { magnitude: 7.0, level: 7, model: 99_000, pager: 0 }]);
    const small = cells.find((c) => c.level === 7 && c.sizeBand === 'Mw < 6.5');
    const middle = cells.find((c) => c.level === 7 && c.sizeBand === 'Mw 6.5–7.5');
    expect(small?.pairs).toBe(5);
    expect(small?.bias).toBeCloseTo(Math.log(2_000 / 4_000), 12);
    expect(middle?.pairs).toBe(1);
    // The one-pair cell is not scored.
    expect(peopleScoreOf(cells)).toBeCloseTo(Math.log(2), 12);
  });
});

describe('rule 33: adoption', () => {
  const cells = (bias: number, inside: number) => [
    { bias, inside, rows: 10 },
    { bias, inside, rows: 10 },
    { bias, inside, rows: 10 },
  ];
  const inPlace: ChainEvidence = { people: 2, tolls: cells(1.5, 9), shaking: 0.9 };

  it('adopts a chain that counts PAGER much better and does no worse on the dead and the maps', () => {
    const pager: ChainEvidence = {
      people: 2 - PEOPLE_MARGIN - 0.01,
      tolls: cells(Math.exp(Math.log(1.5) + GUARD_TOLERANCE - 0.01), 8),
      shaking: 0.9 + GUARD_TOLERANCE - 0.01,
    };
    expect(adoptPagerChain(inPlace, pager)).toEqual({
      adopted: true,
      people: true,
      tolls: true,
      shaking: true,
    });
  });

  it('keeps the chain in place when any condition fails', () => {
    const better = { people: 1, tolls: cells(1.5, 9), shaking: 0.9 };
    expect(adoptPagerChain(inPlace, { ...better, people: 2 - PEOPLE_MARGIN + 0.01 }).adopted).toBe(
      false
    );
    expect(adoptPagerChain(inPlace, { ...better, tolls: cells(2.5, 9) }).tolls).toBe(false);
    expect(adoptPagerChain(inPlace, { ...better, tolls: cells(1.5, 7) }).tolls).toBe(false);
    expect(adoptPagerChain(inPlace, { ...better, shaking: 1.01 }).shaking).toBe(false);
  });
});
