import { describe, expect, it } from 'vitest';
import { scorecard, scoreStats, sizeBandOf, type ScoreRowInput } from './scorecard.js';

const row = (over: Partial<ScoreRowInput>): ScoreRowInput => ({
  name: 'row',
  quantity: 'toll',
  family: 'earthquake',
  size: 7,
  role: 'heldOut',
  record: 100,
  model: 100,
  inside: true,
  bandDecades: 2,
  ...over,
});

describe('the scorecard scores a ratio, and counts what a ratio cannot hold', () => {
  it('is the geometric mean of model over record, and its scatter in ln', () => {
    const s = scoreStats([row({ model: 200 }), row({ model: 50 })]);
    expect(s.scored).toBe(2);
    expect(s.bias).toBeCloseTo(1, 10);
    expect(s.scatterLn).toBeCloseTo(Math.log(2), 10);
  });

  it('says nothing about bias or scatter from a single row', () => {
    const s = scoreStats([row({ model: 300 })]);
    expect(s.bias).toBeNull();
    expect(s.scatterLn).toBeNull();
    expect(s.inside).toBe(1);
  });

  it('keeps zeros out of the ratio and names each kind', () => {
    const s = scoreStats([
      row({ record: 0, model: 0 }),
      row({ record: 0, model: 35, inside: false }),
      row({ record: 185, model: 0, inside: false }),
      row({ model: 100 }),
      row({ model: 100 }),
    ]);
    expect(s.rows).toBe(5);
    expect(s.scored).toBe(2);
    expect(s.bothZero).toBe(1);
    expect(s.falseAlarms).toBe(1);
    expect(s.missedToZero).toBe(1);
    expect(s.inside).toBe(3);
  });

  it('reads the median band width only where rows have a band', () => {
    const s = scoreStats([
      row({ bandDecades: 1 }),
      row({ bandDecades: 4 }),
      row({ bandDecades: null }),
    ]);
    expect(s.medianBandDecades).toBe(2.5);
    expect(scoreStats([row({ bandDecades: null })]).medianBandDecades).toBeNull();
  });
});

describe('the scorecard splits by family and size', () => {
  it('puts an event in the band its size falls in', () => {
    expect(sizeBandOf('earthquake', 6.1)).toBe('Mw < 6.5');
    expect(sizeBandOf('earthquake', 7.5)).toBe('Mw ≥ 7.5');
    expect(sizeBandOf('volcano', 6e5)).toBe('< 10⁸ m³');
    expect(sizeBandOf('explosion', 4.184e15)).toBe('≥ 1 Mt');
  });

  it('scores the held-out rows apart from all of them', () => {
    const cells = scorecard([
      row({ role: 'heldOut', model: 200, size: 6 }),
      row({ role: 'heldOut', model: 50, size: 6.2 }),
      row({ role: 'tuned', model: 100, size: 8 }),
    ]);
    const family = cells.find((c) => c.quantity === 'toll' && c.sizeBand === null);
    expect(family?.heldOut.rows).toBe(2);
    expect(family?.all.rows).toBe(3);
    const small = cells.find((c) => c.sizeBand === 'Mw < 6.5');
    expect(small?.heldOut.bias).toBeCloseTo(1, 10);
    const large = cells.find((c) => c.sizeBand === 'Mw ≥ 7.5');
    expect(large?.heldOut.rows).toBe(0);
    expect(large?.all.rows).toBe(1);
    // A size band with no rows at all has no cell.
    expect(cells.some((c) => c.sizeBand === 'Mw 6.5–7.5')).toBe(false);
  });
});
