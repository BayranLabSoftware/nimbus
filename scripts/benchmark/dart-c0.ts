import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { simulateEarthquake } from '../../src/physics/events/earthquake/simulate.js';
import { directivityFactor } from '../../src/physics/tsunami/directivity.js';
import { dispersionFactor } from '../../src/physics/tsunami/dispersion.js';
import { megathrustSourceRadius, spreadingFactor } from '../../src/physics/tsunami/spreading.js';
import { m } from '../../src/physics/units.js';

/**
 * Model C0 of BM-05 (docs/BENCHMARK_PROTOCOL.md, "After the campaign: the far
 * wave of a megathrust"): the amplitude seismicTsunami.ts publishes toward a
 * receiver, at every record of benchmark/dart/records.json that one of the
 * four readings keeps. Also writes the rupture Nimbus builds for each event,
 * which model C1 takes as its source.
 *
 *   pnpm exec tsx scripts/benchmark/dart-c0.ts
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BASIN_DEPTH_M = 4_000;

interface DartRecord {
  station: string;
  distanceKm: number;
  bearingDeg: number;
  keptBy: Record<string, boolean>;
}

interface DartEvent {
  id: string;
  magnitude: number;
  depthKm: number;
  strikeDeg: number;
  dipDeg: number;
  keptBy: Record<string, boolean>;
  records: DartRecord[];
}

const anyReading = (keptBy: Record<string, boolean>): boolean =>
  Object.values(keptBy).some(Boolean);

const data = JSON.parse(readFileSync(join(ROOT, 'benchmark', 'dart', 'records.json'), 'utf8')) as {
  events: DartEvent[];
};

const out = data.events
  .filter((e) => anyReading(e.keptBy))
  .map((e) => {
    const r = simulateEarthquake({
      magnitude: e.magnitude,
      depth: m(e.depthKm * 1_000),
      faultType: 'reverse',
      subductionInterface: true,
      waterDepth: m(BASIN_DEPTH_M),
      strikeAzimuthDeg: e.strikeDeg,
    });
    const t = r.tsunami;
    if (t === undefined) throw new Error(`no tsunami for ${e.id}`);
    const A0 = t.initialAmplitude as number;
    const L = r.ruptureLength as number;
    const W = t.ruptureWidth as number;
    const R0 = megathrustSourceRadius(W);
    const records = e.records
      .filter((rec) => anyReading(rec.keptBy))
      .map((rec) => {
        const range = rec.distanceKm * 1_000;
        const beam = directivityFactor({
          bearingDeg: rec.bearingDeg,
          strikeDeg: e.strikeDeg,
          ruptureLengthM: L,
          wavelengthM: 2 * W,
        });
        const crest =
          A0 *
          spreadingFactor(R0, range, 0.5, true) *
          dispersionFactor({ rangeM: range, depthM: BASIN_DEPTH_M, wavelengthM: 2 * W }) *
          beam;
        return { station: rec.station, crestM: crest, beam };
      });
    return {
      id: e.id,
      rupture: {
        lengthM: L,
        widthM: W,
        meanSlipM: t.meanSlip,
        strikeDeg: e.strikeDeg,
        dipDeg: e.dipDeg,
        initialAmplitudeM: A0,
      },
      records,
    };
  });

writeFileSync(
  join(ROOT, 'benchmark', 'dart', 'c0.json'),
  `${JSON.stringify({ model: 'C0', events: out }, null, 1)}\n`
);
console.log(
  `C0 on ${out.length.toString()} events, ${out.reduce((n, e) => n + e.records.length, 0).toString()} records`
);
