import { describe, expect, it } from 'vitest';
import { makeElevationGrid } from '../elevation/grid.js';
import { computeTsunamiArrivalField } from '../tsunami/fastMarching.js';
import { computeAmplitudeField, veilLaw } from '../tsunami/amplitudeField.js';
import { STANDARD_GRAVITY } from '../constants.js';
import { extractTsunamiMeta } from '../../store/useAppStore.js';
import {
  amplitudeFromCrestToTrough,
  BAKER_TABLE_6_57,
  burstResult,
  compareWave,
  CROSSROADS_BAKER,
  globeVeilAt,
  RECORDED_WAVES,
} from './recordedWaves.js';

/**
 * The other half of the calibration net.
 *
 * The toll harness asks what the model does to people. This one asks
 * what it does to water, and it exists because the first thing the
 * toll harness could not reach — a charge on the Beirut quay — was
 * wrong by a factor of three hundred and stayed wrong until it was
 * live on the site.
 */

const YARD_M = 0.9144;

const bakerResult = (): ReturnType<typeof burstResult> =>
  burstResult(
    CROSSROADS_BAKER.yieldMegatons,
    -CROSSROADS_BAKER.burstDepthM,
    CROSSROADS_BAKER.lagoonDepthM
  );

describe('waves that were measured', () => {
  const rows = RECORDED_WAVES.map(compareWave);

  it('prints where the model puts every wave that was written down', () => {
    const line = (r: (typeof rows)[number]): string => {
      const w = r.wave;
      const km =
        w.observed.atRangeM >= 1_000
          ? `${(w.observed.atRangeM / 1_000).toFixed(1)} km`
          : `${w.observed.atRangeM.toFixed(0)} m`;
      const obs =
        w.observed.low === 0 && w.observed.high === 0
          ? 'no wave'
          : `${w.observed.low.toFixed(2)} – ${w.observed.high.toFixed(2)} m`;
      return `${w.gated ? 'gate ' : 'note '} ${w.name.padEnd(48)} at ${km.padStart(10)}  observed ${obs.padStart(16)}  model ${r.model.toFixed(2).padStart(9)} m  ${r.contains ? 'contains' : 'MISSES'}`;
    };
    console.log(['', ...rows.map(line)].join('\n'));
    expect(rows).toHaveLength(RECORDED_WAVES.length);
  });

  it('draws on the globe every record it is gated on', () => {
    // A list that can only be driven to empty. Until 14 September 2026
    // it held both Crossroads Baker rows: the harness spread a burst
    // without the energy of a ring and passed, while the globe, which
    // spreads with it, missed. Both were being compared with heights
    // from crest to trough. Read as amplitudes the globe is inside
    // every Baker figure and the burst rows now ask the globe's own
    // law, so a row that differs from the globe is one that says why
    // — Storegga's published row — and it may not miss.
    const globeMisses = rows.filter((r) => r.globeContains === false).map((r) => r.wave.name);
    expect(globeMisses).toEqual([]);
  });

  for (const wave of RECORDED_WAVES.filter((w) => w.gated)) {
    const obs =
      wave.observed.low === 0 && wave.observed.high === 0
        ? 'made no wave'
        : `made ${wave.observed.low.toFixed(2)}–${wave.observed.high.toFixed(2)} m`;
    it(`${wave.name} ${obs}`, () => {
      const r = compareWave(wave);
      expect(r.contains).toBe(true);
    });
  }
});

describe('Crossroads Baker, read as Glasstone & Dolan printed it', () => {
  it('asks the question the globe asks: the field on a flat lagoon gives the same wave', () => {
    // The harness calls the veil's per-cell law with the arrival time
    // of flat water. Here the whole field is drawn on a lagoon of
    // Baker's depth — fast marching and all — and read along the
    // east axis, so if the harness ever stops asking what the globe
    // draws, this says so.
    const depth = CROSSROADS_BAKER.lagoonDepthM;
    const N = 161;
    const spanDeg = 0.036; // ±4 km
    const samples = new Float32Array(N * N);
    samples.fill(-depth);
    const grid = makeElevationGrid({
      minLat: -spanDeg,
      maxLat: spanDeg,
      minLon: -spanDeg,
      maxLon: spanDeg,
      nLat: N,
      nLon: N,
      samples,
    });
    const arrivalField = computeTsunamiArrivalField({
      grid,
      sourceLatitude: 0,
      sourceLongitude: 0,
    });
    const meta = extractTsunamiMeta(bakerResult());
    expect(meta).not.toBeNull();
    if (meta === null) return;
    const field = computeAmplitudeField({ arrivalField, grid, ...meta });
    const metresPerDegree = (Math.PI / 180) * 6_371_000;
    const dLon = (2 * spanDeg) / (N - 1);
    const centre = (N - 1) / 2;
    for (const cellsEast of [15, 40, 80]) {
      const rangeM = cellsEast * dLon * metresPerDegree;
      const drawn = field.amplitudes[centre * N + centre + cellsEast];
      expect(drawn).toBeDefined();
      const asked = globeVeilAt(bakerResult(), rangeM, { depthM: depth });
      expect(Math.abs((drawn ?? 0) / asked - 1)).toBeLessThan(0.03);
    }
  });

  it('is inside every height of Table 6.57, and the law without the energy of a ring is above all of them', () => {
    // The decision, kept where it can be re-run. A caller that gives
    // the veil its own exponent gets the bare (R₀/r)^q with no ring
    // energy, which is the law the harness used to gate Baker on.
    // Against the heights read as amplitudes, the globe's law sits
    // near eight tenths of every range and the bare law above the
    // reference's own 35 % at every one.
    const meta = extractTsunamiMeta(bakerResult());
    expect(meta).not.toBeNull();
    if (meta === null) return;
    const depth = CROSSROADS_BAKER.lagoonDepthM;
    const globe = veilLaw(meta);
    const bare = veilLaw({ ...meta, spreadingExponent: 0.5 });
    for (const row of BAKER_TABLE_6_57) {
      const t = (row.yards * YARD_M) / Math.sqrt(STANDARD_GRAVITY * depth);
      const band = amplitudeFromCrestToTrough(row.feet);
      expect(globe(t, depth)).toBeGreaterThan(band.low);
      expect(globe(t, depth)).toBeLessThan(band.high);
      expect(bare(t, depth)).toBeGreaterThan(band.high);
    }
  });

  it('halves a height from crest to trough, and keeps the foot it was rounded to', () => {
    const band = amplitudeFromCrestToTrough(94);
    // 94 ft is 28.65 m from crest to trough: 14.3 m of amplitude.
    expect(band.low).toBeCloseTo((93.5 * 0.3048 * 0.65) / 2, 9);
    expect(band.high).toBeCloseTo((94.5 * 0.3048 * 1.35) / 2, 9);
    expect(band.low).toBeLessThan(14.33);
    expect(band.high).toBeGreaterThan(14.33);
  });
});
