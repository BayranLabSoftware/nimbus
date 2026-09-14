import { describe, expect, it } from 'vitest';
import { makeElevationGrid } from '../elevation/grid.js';
import { computeTsunamiArrivalField } from '../tsunami/fastMarching.js';
import { computeAmplitudeField } from '../tsunami/amplitudeField.js';
import { extractTsunamiMeta } from '../../store/useAppStore.js';
import {
  amplitudeFromCrestToTrough,
  BAKER_ONE_OVER_R_TO_YARDS,
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
    const meta = extractTsunamiMeta(bakerResult());
    expect(meta).not.toBeNull();
    if (meta === null) return;
    // The store hands the solver the burst's period, so the fronts move
    // at its group velocity; the harness has to ask on the same speeds.
    const arrivalField = computeTsunamiArrivalField({
      grid,
      sourceLatitude: 0,
      sourceLongitude: 0,
      ...(meta.sourcePeriodS !== undefined && { periodS: meta.sourcePeriodS }),
    });
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

  it("reads Glasstone & Dolan's shallow-water relation at every range, with nothing fitted to Baker", () => {
    // §6.121: H·R = 150·d_w·W^0.25 ft², and the globe draws half of it.
    const FT = 0.3048;
    const kilotons = CROSSROADS_BAKER.yieldMegatons * 1_000;
    const heightTimesRange =
      150 * (CROSSROADS_BAKER.lagoonDepthM / FT) * kilotons ** 0.25 * FT * FT;
    for (const row of BAKER_TABLE_6_57) {
      const rangeM = row.yards * YARD_M;
      const drawn = globeVeilAt(bakerResult(), rangeM, { depthM: CROSSROADS_BAKER.lagoonDepthM });
      expect(drawn / (heightTimesRange / (2 * rangeM))).toBeCloseTo(1, 9);
    }
  });

  it('gates where its own table falls as 1/R, and says why it stops', () => {
    const first = BAKER_TABLE_6_57[0];
    expect(first).toBeDefined();
    if (first === undefined) return;
    for (const row of BAKER_TABLE_6_57) {
      // H·R from the table itself, relative to its first row.
      const ratio = (row.feet * row.yards) / (first.feet * first.yards);
      const gated = RECORDED_WAVES.filter((w) => w.observed.atRangeM === row.yards * YARD_M).map(
        (w) => w.gated
      );
      expect(gated).toHaveLength(1);
      if (row.yards <= BAKER_ONE_OVER_R_TO_YARDS) {
        // Constant within 3 %: the record is 1/R, and the gate holds.
        expect(ratio).toBeLessThan(1.035);
        expect(gated[0]).toBe(true);
      } else {
        // 13–17 % higher: the maximum has passed back into the train.
        expect(ratio).toBeGreaterThan(1.12);
        expect(gated[0]).toBe(false);
      }
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
