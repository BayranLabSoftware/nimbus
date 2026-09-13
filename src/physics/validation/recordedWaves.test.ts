import { describe, expect, it } from 'vitest';
import { compareWave, RECORDED_WAVES } from './recordedWaves.js';

/**
 * The other half of the calibration net.
 *
 * The toll harness asks what the model does to people. This one asks
 * what it does to water, and it exists because the first thing the
 * toll harness could not reach — a charge on the Beirut quay — was
 * wrong by a factor of three hundred and stayed wrong until it was
 * live on the site.
 */

describe('waves that were measured', () => {
  const rows = RECORDED_WAVES.map(compareWave);

  it('prints where the model puts every wave that was written down', () => {
    const line = (r: (typeof rows)[number]): string => {
      const w = r.wave;
      const km =
        w.observed.atRangeM >= 1_000
          ? `${(w.observed.atRangeM / 1_000).toFixed(0)} km`
          : `${w.observed.atRangeM.toFixed(0)} m`;
      const obs =
        w.observed.low === 0 && w.observed.high === 0
          ? 'no wave'
          : `${w.observed.low.toString()} – ${w.observed.high.toString()} m`;
      return `${w.gated ? 'gate ' : 'note '} ${w.name.padEnd(42)} at ${km.padStart(8)}  observed ${obs.padStart(14)}  model ${r.model.toFixed(2).padStart(9)} m  ${r.contains ? 'contains' : 'MISSES'}`;
    };
    console.log(['', ...rows.map(line)].join('\n'));
    expect(rows).toHaveLength(RECORDED_WAVES.length);
  });

  it('pins which records the globe misses where it draws a different law', () => {
    // The harness figure and the figure on the globe are not always
    // the same number. For an underwater burst the veil spreads with
    // the energy normalisation of a ring and the harness does not, and
    // at Crossroads Baker that is the difference between inside both
    // records and outside both. Pinned, like the MMI bands the model
    // invents: a list that can only be driven to empty, and that fails
    // the moment it changes in either direction, so whoever decides
    // which law is right has to say so here.
    const globeMisses = rows
      .filter((r) => r.globeContains === false)
      .map((r) => `${r.wave.name}: globe ${r.globe?.toFixed(2) ?? '—'} m`);
    console.log(['', 'globe draws, where different:', ...globeMisses].join('\n'));
    expect(rows.filter((r) => r.globeContains === false).map((r) => r.wave.name)).toEqual([
      'Crossroads Baker 1946, near field',
      'Crossroads Baker 1946, five kilometres out',
    ]);
  });

  for (const wave of RECORDED_WAVES.filter((w) => w.gated)) {
    const obs =
      wave.observed.low === 0 && wave.observed.high === 0
        ? 'made no wave'
        : `made ${wave.observed.low.toString()}–${wave.observed.high.toString()} m`;
    it(`${wave.name} ${obs}`, () => {
      const r = compareWave(wave);
      expect(r.contains).toBe(true);
    });
  }
});
