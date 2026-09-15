import { describe, expect, it } from 'vitest';
import { compareWithRecord } from './recordedTolls.js';
import { intervalScore } from './residualRules.js';
import { readResidual, residualSets, withResidual, type ResidualRow } from './residualRun.js';

/**
 * How rules 71 to 75 of residualRules.ts are run, held before any band is
 * drawn with the candidate: the sets are the ones rule 72 names, a residual
 * changes how the realisations draw and nothing else, and a set is read as
 * rule 72 reads it.
 */

describe('rule 72: the sets', () => {
  it('are rule 11’s 406 held-out earthquakes, rule 45’s 298 and rule 61’s 194', () => {
    const sets = residualSets();
    expect(sets.rule11).toHaveLength(406);
    expect(sets.rule45).toHaveLength(298);
    expect(sets.rule61).toHaveLength(194);
  });

  it('run a residual as a scenario input, the median scenario and the residual in place unmoved', () => {
    const first = residualSets().rule11[0];
    if (first === undefined) throw new Error('empty set');
    const plain = first.event.run();
    const named = withResidual(first.event, 'betweenAndWithin').run();
    if (plain.type !== 'earthquake' || named.type !== 'earthquake')
      throw new Error(first.event.name);
    expect(named.data.inputs).toEqual({
      ...plain.data.inputs,
      groundMotionResidual: 'betweenAndWithin',
    });
    expect(named.data.shaking).toEqual(plain.data.shaking);
    const inPlace = compareWithRecord(withResidual(first.event, 'onePerScenario'));
    const unnamed = compareWithRecord(first.event);
    expect([inPlace.deaths, inPlace.low, inPlace.high]).toEqual([
      unnamed.deaths,
      unnamed.low,
      unnamed.high,
    ]);
  });
});

describe('rule 72: a set read', () => {
  it('scores every row, and holds and counts only the rows with something', () => {
    const rows: ResidualRow[] = [
      { name: 'a', magnitude: 6.1, record: 0, central: 0, low: 0, high: 0, inside: true },
      { name: 'b', magnitude: 6.2, record: 12, central: 5, low: 1, high: 40, inside: true },
      { name: 'c', magnitude: 7.0, record: 300, central: 20, low: 2, high: 90, inside: false },
      { name: 'd', magnitude: 8.0, record: 0, central: 3, low: 0, high: 30, inside: true },
    ];
    const reading = readResidual(rows);
    const mean =
      rows.reduce((acc, r) => acc + intervalScore(r.record, r.low, r.high), 0) / rows.length;
    expect(reading.meanIntervalScore).toBeCloseTo(mean, 12);
    expect(reading.rows).toBe(3);
    expect(reading.held).toBe(2);
    expect(reading.cells.map((c) => [c.held, c.rows])).toEqual([
      [1, 1],
      [0, 1],
      [1, 1],
    ]);
  });
});
