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
