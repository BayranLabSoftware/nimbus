import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_BASIN_DEPTH_M,
  longWaveSpeed,
  readCrestSpeeds,
  type CrestSpeedRow,
} from '../../src/physics/validation/basinDepthRules.js';

/**
 * Rule 190 of validation/basinDepthRules.ts: how fast a wave actually
 * travelled, against the celerity the basin depth implies.
 *
 *   pnpm exec tsx scripts/benchmark/crest-speeds.ts [out.json]
 *
 * The records are BM-05's own: the deep-ocean buoys it kept, each with a
 * distance from the source and the time its crest arrived. Distance over time
 * is a **lower bound** on the leading wave's celerity, because a crest lags
 * the first arrival — so a model below it is certainly too slow, and one above
 * it may be right. Nothing here is tuned: DART has been read (rule 5).
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

interface DartRecord {
  station: string;
  distanceKm: number;
  crestAfterS?: number;
  waterDepthM?: number;
  keptBy?: Record<string, boolean>;
}
interface DartEvent {
  id: string;
  place: string;
  records: DartRecord[];
}

const raw = JSON.parse(readFileSync(join(ROOT, 'benchmark', 'dart', 'records.json'), 'utf8')) as {
  readOn: string;
  events: DartEvent[];
};

const rows: CrestSpeedRow[] = [];
for (const event of raw.events) {
  for (const record of event.records) {
    const kept = Object.values(record.keptBy ?? {}).some(Boolean);
    if (!kept) continue;
    const t = record.crestAfterS;
    if (t === undefined || !(t > 0) || !(record.distanceKm > 0)) continue;
    rows.push({
      event: event.place,
      station: record.station,
      distanceKm: record.distanceKm,
      crestAfterS: t,
      impliedSpeed: (record.distanceKm * 1_000) / t,
      buoyDepthM: record.waterDepthM ?? Number.NaN,
    });
  }
}

const atDefault = readCrestSpeeds(rows, () => longWaveSpeed(DEFAULT_BASIN_DEPTH_M));
const withBuoyDepth = rows.filter((r) => Number.isFinite(r.buoyDepthM));
const atBuoy = readCrestSpeeds(withBuoyDepth, (r) => longWaveSpeed(r.buoyDepthM));

const out = {
  rule: '190',
  readOn: raw.readOn,
  what: 'the celerity a basin depth implies, against the speed a crest actually made',
  defaultBasinDepthM: DEFAULT_BASIN_DEPTH_M,
  defaultCelerity: longWaveSpeed(DEFAULT_BASIN_DEPTH_M),
  atDefault,
  atBuoy,
  medianBuoyDepthM: withBuoyDepth.map((r) => r.buoyDepthM).sort((a, b) => a - b)[
    Math.floor(withBuoyDepth.length / 2)
  ],
  medianImpliedSpeed: rows.map((r) => r.impliedSpeed).sort((a, b) => a - b)[
    Math.floor(rows.length / 2)
  ],
  rows: rows.map((r) => [
    r.event,
    r.station,
    Math.round(r.distanceKm),
    r.crestAfterS,
    Number(r.impliedSpeed.toFixed(2)),
    Math.round(r.buoyDepthM),
  ]),
};

const target =
  process.argv[2] ?? join(ROOT, 'benchmark', 'results', 'crest-speeds-2026-09-18.json');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(out, null, 1)}\n`);

console.log(
  `${String(atDefault.records)} records, ${String(atDefault.events)} events; median implied speed ${out.medianImpliedSpeed?.toFixed(1) ?? '—'} m/s, median buoy depth ${out.medianBuoyDepthM?.toFixed(0) ?? '—'} m`
);
console.log(
  `basin ${String(DEFAULT_BASIN_DEPTH_M)} m → ${longWaveSpeed(DEFAULT_BASIN_DEPTH_M).toFixed(1)} m/s: median ratio ${atDefault.medianRatio.toFixed(3)}, certainly too slow on ${(100 * atDefault.certainlySlowShare).toFixed(1)} % of records`
);
console.log(
  `the buoy's own depth: median ratio ${atBuoy.medianRatio.toFixed(3)}, certainly too slow on ${(100 * atBuoy.certainlySlowShare).toFixed(1)} %`
);
// What the defect looked like: the shelf a scenario of the sweep sat on.
for (const shelf of [18, 60, 200]) {
  const reading = readCrestSpeeds(rows, () => longWaveSpeed(shelf));
  console.log(
    `source depth ${String(shelf).padStart(4)} m → ${longWaveSpeed(shelf).toFixed(1).padStart(5)} m/s: median ratio ${reading.medianRatio.toFixed(3)}, certainly too slow on ${(100 * reading.certainlySlowShare).toFixed(1)} %`
  );
}
console.log(`wrote ${target}`);
