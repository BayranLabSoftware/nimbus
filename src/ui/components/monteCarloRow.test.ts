import { describe, expect, it } from 'vitest';
import { percentileSummary } from '../../physics/montecarlo/engine.js';
import { monteCarloRow } from './monteCarloRow.js';

/** A thousand draws, `above` of them above zero (1 km, 2 km, …). */
function draws(above: number): number[] {
  return Array.from({ length: 1000 }, (_, i) => (i < above ? (i + 1) * 1000 : 0));
}

describe('rule 905: a rare event shown under a warning', () => {
  it('below 1 %: no cells, how many runs, the percentiles of those runs apart', () => {
    const samples = draws(3);
    const row = monteCarloRow(percentileSummary([...samples]), samples, 1000);
    expect(row).toEqual({
      kind: 'rare',
      happened: 3,
      runs: 1000,
      given: { p10: 1000, p50: 2000, p90: 3000 },
    });
  });

  it('one run in a thousand is still rare, and counted', () => {
    const samples = draws(1);
    const row = monteCarloRow(percentileSummary([...samples]), samples, 1000);
    expect(row.kind).toBe('rare');
    if (row.kind === 'rare') expect(row.happened).toBe(1);
  });

  it('at 1 % and above, rule 890 as it was', () => {
    const samples = draws(10);
    const row = monteCarloRow(percentileSummary([...samples]), samples, 1000);
    expect(row.kind).toBe('share');
  });

  it('above 0.9, every draw; at zero, no run', () => {
    expect(monteCarloRow(percentileSummary(draws(950)), undefined, 1000).kind).toBe('whole');
    expect(monteCarloRow(percentileSummary(draws(0)), undefined, 1000)).toEqual({ kind: 'never' });
  });

  it('without the draws, the count is read from the share', () => {
    const row = monteCarloRow(percentileSummary(draws(4)), undefined, 1000);
    expect(row.kind === 'rare' && row.happened).toBe(4);
  });
});
