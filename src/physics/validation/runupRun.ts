import type { ElevationGrid } from '../elevation/index.js';
import { simulateEarthquake } from '../events/earthquake/simulate.js';
import { computeBathymetricTsunami } from '../tsunami/bathymetricTsunami.js';
import { findPropagationSeeds } from '../tsunami/sourcePlacement.js';
import type { RunupCell } from '../tsunami/runupField.js';
import { shoreHeight } from '../tsunamiCasualties.js';
import { extractTsunamiMeta, type ActiveResult } from '../../store/useAppStore.js';
import { m } from '../units.js';
import {
  meetsT2,
  RUNUP_MATCH_RADIUS_M,
  RUNUP_SEED_RADIUS_M,
  type RunupReading,
} from './runupRules.js';
import {
  RUNUP_EVENTS,
  RUNUP_OBSERVATIONS,
  type RunupEvent,
  type RunupObservation,
} from './runupSetData.js';

/**
 * Rules 102 to 105 of runupRules.ts, run: each event of the set put through
 * the product's own earthquake and its own bathymetric wave on the planetary
 * mosaic, every observation matched to the coastal cell that answers for it,
 * and T2 read for the first time.
 *
 * The mosaic is handed in rather than built here, because building it needs
 * tiles and tiles need either a network or a cache; `scripts/benchmark/runup.ts`
 * builds it once and passes it to every event.
 */

const EARTH_RADIUS_M = 6_371_000;

function greatCircleM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

export interface RunupBin {
  eventId: number;
  /** The coastal cell that answers for the observations. */
  latitude: number;
  longitude: number;
  /** Median of the observations matched to this cell (m). */
  recordM: number;
  observations: number;
  /** The model's Synolakis run-up at the cell (m). */
  modelM: number;
  /** The shore height the product derives from the same cell (m). */
  shoreM: number;
  /** NCEI measurement types behind the bin. */
  typeIds: number[];
}

export interface RunupEventRow {
  event: RunupEvent;
  /** Seeds `findPropagationSeeds` gave, and the water the earthquake got. */
  seeds: number;
  waterDepthM: number;
  /** The wave the earthquake published, m at the source. */
  sourceAmplitudeM: number;
  coastalCells: number;
  bins: number;
  observations: number;
  unmatched: number;
  /** Geometric mean of model over record over this event's bins. */
  bias: number;
}

export interface RunupRunResult {
  events: RunupEventRow[];
  bins: RunupBin[];
  overall: RunupReading;
  /** Rule 104, beside: the same bins read against the shore height the
   *  product derives from the run-up, which is the quantity a tide gauge
   *  measures. Decides nothing. */
  overallShore: RunupReading;
  byType: { typeId: number; reading: RunupReading; shore: RunupReading }[];
  /** Events that raised no wave at all, and so no bin. */
  silent: RunupEvent[];
  meetsBar: boolean;
}

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  if (n === 0) return Number.NaN;
  return n % 2 === 1 ? (s[(n - 1) / 2] ?? Number.NaN) : ((s[n / 2 - 1] ?? 0) + (s[n / 2] ?? 0)) / 2;
};

function reading(
  bins: readonly RunupBin[],
  unmatched: number,
  pick: (b: RunupBin) => number = (b) => b.modelM
): RunupReading {
  const scored = bins.filter((b) => b.recordM > 0 && pick(b) > 0);
  const logs = scored.map((b) => Math.log(pick(b) / b.recordM));
  const mean = logs.length === 0 ? 0 : logs.reduce((a, b) => a + b, 0) / logs.length;
  const variance =
    logs.length < 2 ? 0 : logs.reduce((a, b) => a + (b - mean) ** 2, 0) / (logs.length - 1);
  return {
    bins: scored.length,
    events: new Set(scored.map((b) => b.eventId)).size,
    observations: scored.reduce((a, b) => a + b.observations, 0),
    unmatched,
    bias: Math.exp(mean),
    sigmaLn: Math.sqrt(variance),
    withinTwo:
      scored.length === 0
        ? 0
        : scored.filter((b) => Math.abs(Math.log(pick(b) / b.recordM)) <= Math.log(2)).length /
          scored.length,
  };
}

/** One event: the product's earthquake, its wave, and the coast it reaches. */
export function runOneEvent(
  globalGrid: ElevationGrid,
  event: RunupEvent,
  observations: readonly RunupObservation[]
): { row: RunupEventRow; bins: RunupBin[]; unmatched: number } | null {
  const seeds = findPropagationSeeds(globalGrid, event.latitude, event.longitude, {
    maxRadiusM: RUNUP_SEED_RADIUS_M,
  });
  if (seeds.length === 0) return null;
  const waterDepthM = Math.max(...seeds.map((s) => s.depthM));
  const data = simulateEarthquake({
    magnitude: event.magnitude,
    depth: m(event.depthKm * 1_000),
    faultType: 'reverse',
    waterDepth: m(waterDepthM),
  });
  const meta = extractTsunamiMeta({ type: 'earthquake', data } as unknown as ActiveResult);
  if (meta === null) return null;
  const out = computeBathymetricTsunami({
    grid: globalGrid,
    globalGrid,
    sourceLatitude: event.latitude,
    sourceLongitude: event.longitude,
    seeds,
    globalSeeds: seeds,
    ...meta,
  });
  const field = out.global?.runup ?? out.runup;
  const cells: readonly RunupCell[] = field?.cells ?? [];

  // Every observation to the nearest coastal cell within the rule's radius.
  const matched = new Map<number, { cell: RunupCell; heights: number[]; types: number[] }>();
  let unmatched = 0;
  for (const obs of observations) {
    let best = -1;
    let bestD = RUNUP_MATCH_RADIUS_M;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      if (c === undefined) continue;
      const d = greatCircleM(obs.latitude, obs.longitude, c.latitude, c.longitude);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    const cell = best < 0 ? undefined : cells[best];
    if (cell === undefined) {
      unmatched += 1;
      continue;
    }
    const got = matched.get(best) ?? { cell, heights: [], types: [] };
    got.heights.push(obs.heightM);
    got.types.push(obs.typeId);
    matched.set(best, got);
  }

  const bins: RunupBin[] = [...matched.values()].map((g) => ({
    eventId: event.id,
    latitude: g.cell.latitude,
    longitude: g.cell.longitude,
    recordM: median(g.heights),
    observations: g.heights.length,
    modelM: g.cell.runupM,
    shoreM: shoreHeight(g.cell.runupM, g.cell.amplitudeM),
    typeIds: [...new Set(g.types)].sort((a, b) => a - b),
  }));
  const scored = bins.filter((b) => b.recordM > 0 && b.modelM > 0);
  const logs = scored.map((b) => Math.log(b.modelM / b.recordM));
  return {
    row: {
      event,
      seeds: seeds.length,
      waterDepthM,
      sourceAmplitudeM: meta.sourceAmplitudeM,
      coastalCells: cells.length,
      bins: bins.length,
      observations: observations.length,
      unmatched,
      bias:
        logs.length === 0 ? Number.NaN : Math.exp(logs.reduce((a, b) => a + b, 0) / logs.length),
    },
    bins,
    unmatched,
  };
}

export function runRunup(globalGrid: ElevationGrid): RunupRunResult {
  const byEvent = new Map<number, RunupObservation[]>();
  for (const obs of RUNUP_OBSERVATIONS) {
    const list = byEvent.get(obs.eventId) ?? [];
    list.push(obs);
    byEvent.set(obs.eventId, list);
  }
  const events: RunupEventRow[] = [];
  const bins: RunupBin[] = [];
  const silent: RunupEvent[] = [];
  let unmatched = 0;
  for (const event of RUNUP_EVENTS) {
    const observations = byEvent.get(event.id) ?? [];
    const got = runOneEvent(globalGrid, event, observations);
    if (got === null) {
      silent.push(event);
      continue;
    }
    events.push(got.row);
    bins.push(...got.bins);
    unmatched += got.unmatched;
  }
  const overall = reading(bins, unmatched);
  const overallShore = reading(bins, unmatched, (b) => b.shoreM);
  const types = [...new Set(bins.flatMap((b) => b.typeIds))].sort((a, b) => a - b);
  return {
    events,
    bins,
    overall,
    overallShore,
    byType: types.map((typeId) => {
      const only = bins.filter((b) => b.typeIds.length === 1 && b.typeIds[0] === typeId);
      return {
        typeId,
        reading: reading(only, 0),
        shore: reading(only, 0, (b) => b.shoreM),
      };
    }),
    silent,
    meetsBar: meetsT2(overall),
  };
}
