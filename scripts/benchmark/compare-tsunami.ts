import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STANDARD_GRAVITY } from '../../src/physics/constants.js';
import { simulateEarthquake } from '../../src/physics/events/earthquake/simulate.js';
import { veilLaw } from '../../src/physics/tsunami/amplitudeField.js';
import { dispersionFactor } from '../../src/physics/tsunami/dispersion.js';
import { megathrustSourceRadius, spreadingFactor } from '../../src/physics/tsunami/spreading.js';
import { m } from '../../src/physics/units.js';
import { printStats, summarise, type Pair } from './stats.js';

/**
 * Track TSU of the benchmark protocol: Nimbus's open-ocean tsunami against
 * GeoClaw 5.14 (shallow water on the sphere, flat bathymetry, no friction),
 * on every case of benchmark/matrices/tsunami.json the GeoClaw runs finished.
 *
 *   pnpm exec tsx scripts/benchmark/compare-tsunami.ts <geoclaw reference.json> [<pairs.json>]
 *
 * - Gaussian humps: the globe's own law (`veilLaw` in amplitudeField.ts)
 *   for a source of the hump's peak and radius over the basin depth, at
 *   each gauge's travel time, against GeoClaw's largest crest there.
 * - Megathrusts: the amplitude the earthquake module publishes broadside
 *   to the fault (seismicTsunami.ts: the initial amplitude, the ring
 *   spreading from half the down-dip width, the dispersion of a 2·W
 *   wave; the beam is one across the fault), against GeoClaw fed Nimbus's
 *   rupture two ways — Nimbus's uniform uplift, which tests the
 *   propagation, and an Okada deformation of the same slip, which tests
 *   the source as well.
 * - Arrival: the gauge's range over √(g·h), against GeoClaw's first
 *   crossing of a tenth of the crest.
 *
 * The megathrust maxima of the reference are not converged: the crest of
 * an Okada source is a spike a finite-volume grid smears (the run records
 * the exact linear, non-dispersive limit alongside, compared here as its
 * own quantity), and a uniform uplift's leading step keeps half the uplift
 * in an ever-thinner spike, which no grid resolves. Gauges over the uplifted
 * sea floor record the offset and are left out.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

interface Gauge {
  distanceKm: number;
  maxEtaM: number;
  arrivalS: number;
}

interface GeoclawCase {
  id: string;
  variant: 'gaussian' | 'okada' | 'uplift';
  basinDepthM: number;
  gauges: Gauge[];
  notes?: string;
}

/**
 * The exact linear, non-dispersive solution the reference run records for
 * an Okada source (Poisson's formula on the flat plane), by gauge distance.
 */
export function exactOkadaLimits(notes: string): Map<number, number> {
  const out = new Map<number, number>();
  const m =
    /peaks at 100 km ([\d.]+) m \(arrival \d+ s\); 300 km ([\d.]+) m \(arrival \d+ s\); 1000 km ([\d.]+) m \(arrival \d+ s\); 3000 km ([\d.]+) m/.exec(
      notes
    );
  if (m === null) return out;
  [100, 300, 1000, 3000].forEach((km, i) => out.set(km, Number(m[i + 1])));
  return out;
}

interface TsunamiCase {
  id: string;
  kind: 'gaussian' | 'megathrust';
  basinDepthM: number;
  amplitudeM?: number;
  radiusKm?: number;
  magnitude?: number;
}

export function comparePairs(referencePath: string): Pair[] {
  const cases = new Map(
    (
      JSON.parse(
        readFileSync(join(ROOT, 'benchmark', 'matrices', 'tsunami.json'), 'utf8')
      ) as TsunamiCase[]
    ).map((c) => [c.id, c])
  );
  const reference = JSON.parse(readFileSync(referencePath, 'utf8')) as { cases: GeoclawCase[] };
  const pairs: Pair[] = [];
  for (const g of reference.cases) {
    const c = cases.get(g.id);
    if (c === undefined) continue;
    const h = c.basinDepthM;
    const celerity = Math.sqrt(STANDARD_GRAVITY * h);
    let amplitudeAt: (rangeM: number) => number;
    let sourceHalfWidthM = 0;
    if (c.kind === 'gaussian') {
      const law = veilLaw({
        sourceAmplitudeM: c.amplitudeM ?? 0,
        sourceCavityRadiusM: (c.radiusKm ?? 0) * 1_000,
        sourceDepthM: h,
      });
      amplitudeAt = (rangeM) => law(rangeM / celerity, h);
    } else {
      const r = simulateEarthquake({
        magnitude: c.magnitude ?? 0,
        depth: m(20_000),
        faultType: 'reverse',
        subductionInterface: true,
        waterDepth: m(h),
      });
      const A0 = (r.tsunami?.initialAmplitude as number | undefined) ?? 0;
      const W = (r.tsunami?.ruptureWidth as number | undefined) ?? r.ruptureWidth;
      const R0 = megathrustSourceRadius(W);
      sourceHalfWidthM = W / 2;
      amplitudeAt = (rangeM) =>
        A0 *
        spreadingFactor(R0, rangeM, 0.5, true) *
        dispersionFactor({ rangeM, depthM: h, wavelengthM: 2 * W });
    }
    const label =
      c.kind === 'gaussian'
        ? 'Gaussian'
        : g.variant === 'okada'
          ? 'MegathrustOkada'
          : 'MegathrustUplift';
    for (const gauge of g.gauges) {
      const base = {
        track: 'TSU',
        caseId: `${g.id}${c.kind === 'megathrust' ? ` (${g.variant})` : ''}`,
        source: 'custom' as const,
        cls: 'C' as const,
        detail: `${gauge.distanceKm.toString()} km`,
        bin: `${gauge.distanceKm.toString()} km`,
      };
      // A gauge over the uplifted sea floor records the offset, not a wave.
      const inside = c.kind === 'megathrust' && gauge.distanceKm * 1_000 <= sourceHalfWidthM;
      pairs.push({
        ...base,
        quantity: `maxAmplitude${label}`,
        nimbus: amplitudeAt(gauge.distanceKm * 1_000),
        reference: inside ? null : gauge.maxEtaM,
        ...(inside ? { note: 'the gauge lies over the uplifted sea floor' } : {}),
      });
      const exact =
        g.variant === 'okada' ? exactOkadaLimits(g.notes ?? '').get(gauge.distanceKm) : undefined;
      if (exact !== undefined) {
        pairs.push({
          ...base,
          quantity: 'maxAmplitudeMegathrustOkadaExactLinear',
          nimbus: amplitudeAt(gauge.distanceKm * 1_000),
          reference: inside ? null : exact,
          ...(inside ? { note: 'the gauge lies over the uplifted sea floor' } : {}),
        });
      }
      pairs.push({
        ...base,
        quantity: `arrivalTime${c.kind === 'gaussian' ? 'Gaussian' : 'Megathrust'}`,
        nimbus: (gauge.distanceKm * 1_000) / celerity,
        reference: gauge.arrivalS,
      });
    }
  }
  return pairs;
}

const referencePath = process.argv[2];
if (referencePath !== undefined) {
  const pairs = comparePairs(referencePath);
  const stats = summarise(pairs);
  const reference = JSON.parse(readFileSync(referencePath, 'utf8')) as {
    status: string;
    cases: unknown[];
  };
  mkdirSync(join(ROOT, 'benchmark', 'results'), { recursive: true });
  writeFileSync(
    join(ROOT, 'benchmark', 'results', 'tsunami.json'),
    `${JSON.stringify({ track: 'TSU', reference: 'GeoClaw 5.14.0 (Clawpack), flat ocean on the sphere', referenceStatus: reference.status, runs: reference.cases.length, stats }, null, 1)}\n`
  );
  const pairsOut = process.argv[3];
  if (pairsOut !== undefined) writeFileSync(pairsOut, JSON.stringify(pairs));
  printStats(stats);
}
