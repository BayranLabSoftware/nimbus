import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  C2_GUARDS,
  T1_BOUNDS,
  noWorseThanReference,
} from '../../src/physics/validation/farFieldReferenceRules.js';

/**
 * Rules 210 to 212: C2 beside C0 and C1 on the rows C2 survives on.
 *
 *   pnpm exec tsx scripts/benchmark/dart-c2-score.ts
 *
 * Reads benchmark/dart/{records,c0,c1,c2-raw}.json and writes
 * benchmark/dart/c2-score.json. It does not touch score.json: the round of
 * 15 September decided between C0 and C1 and its numbers do not move.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = join(ROOT, 'benchmark', 'dart');
const read = (name: string): unknown => JSON.parse(readFileSync(join(DIR, name), 'utf8'));

interface ObsRec {
  station: string;
  distanceKm: number;
  crestM: number;
  crestAfterS: number;
  waterDepthM: number;
  keptBy: Record<string, boolean>;
}
interface ObsEvent {
  id: string;
  origin: string;
  magnitude: number;
  place: string;
  keptBy: Record<string, boolean>;
  records: ObsRec[];
}
interface ModelRec {
  station: string;
  crestM: number;
}
interface C2Run {
  crestM: number;
  crestAfterS: number;
  covered: boolean;
  depthM: number;
}
interface C2Rec {
  station: string;
  rasterDepthM: number;
  reportedDepthM: number | null;
  coarse: C2Run | null;
  fine: C2Run | null;
}
interface C2Event {
  id: string;
  runs: Record<string, { ok: boolean; cells: number[]; seconds: number } | null>;
  records: C2Rec[];
}

const observed = read('records.json') as { variants: string[]; events: ObsEvent[] };
const c0 = new Map(
  (read('c0.json') as { events: { id: string; records: ModelRec[] }[] }).events.map((e) => [
    e.id,
    new Map(e.records.map((r) => [r.station, r.crestM])),
  ])
);
const c1 = new Map(
  (read('c1.json') as { events: { id: string; records: ModelRec[] }[] }).events.map((e) => [
    e.id,
    new Map(e.records.map((r) => [r.station, r.crestM])),
  ])
);
const c2 = new Map((read('c2-raw.json') as { events: C2Event[] }).events.map((e) => [e.id, e]));

const median = (xs: readonly number[]): number => {
  if (xs.length === 0) return Number.NaN;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? (s[mid] ?? Number.NaN) : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
};
const sd = (xs: readonly number[]): number => {
  if (xs.length < 2) return Number.NaN;
  const mu = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - mu) ** 2, 0) / (xs.length - 1));
};
const factor = (ln: number): string => `${Math.exp(ln).toFixed(2)}×`;

/** Rule 210: why a gauge is not in C2, or null if it is. */
function excluded(rec: C2Rec): string | null {
  if (rec.fine === null) return 'no gauge series in the window';
  if (!rec.fine.covered) return 'the run stopped before the window closed';
  if (-rec.rasterDepthM > C2_GUARDS.minimumGaugeDepthM) return 'the gauge is not in water';
  if (rec.coarse === null) return 'no coarse run to test it against';
  const drift = Math.abs(rec.fine.crestM - rec.coarse.crestM) / Math.abs(rec.fine.crestM);
  if (!(drift <= C2_GUARDS.convergenceTolerance))
    return `not converged: ${(100 * drift).toFixed(0)} % between the two grids`;
  return null;
}

type Row = 'C0' | 'C1' | 'C2';
const ROWS: readonly Row[] = ['C0', 'C1', 'C2'];

interface Pair {
  station: string;
  distanceKm: number;
  logs: Record<Row, number>;
  arrivalLn: number;
  reason: string | null;
}

function pairsOf(ev: ObsEvent, reading: string): Pair[] {
  const m0 = c0.get(ev.id);
  const m1 = c1.get(ev.id);
  const m2 = c2.get(ev.id);
  return ev.records
    .filter((rec) => rec.keptBy[reading] === true)
    .map((rec) => {
      const r2 = m2?.records.find((r) => r.station === rec.station);
      const reason = r2 === undefined ? 'the event was not run' : excluded(r2);
      return {
        station: rec.station,
        distanceKm: rec.distanceKm,
        logs: {
          C0: Math.log((m0?.get(rec.station) ?? Number.NaN) / rec.crestM),
          C1: Math.log((m1?.get(rec.station) ?? Number.NaN) / rec.crestM),
          C2: Math.log((r2?.fine?.crestM ?? Number.NaN) / rec.crestM),
        },
        arrivalLn: Math.log((r2?.fine?.crestAfterS ?? Number.NaN) / rec.crestAfterS),
        reason,
      };
    });
}

function score(reading: string) {
  const events = observed.events.filter((e) => e.keptBy[reading] === true);
  const perEvent: Record<Row, number[]> = { C0: [], C1: [], C2: [] };
  const far: Record<Row, number[]> = { C0: [], C1: [], C2: [] };
  const arrivals: number[] = [];
  const exclusions: { id: string; station: string; reason: string }[] = [];
  let kept = 0;
  let looked = 0;
  const table = [];
  for (const ev of events) {
    const all = pairsOf(ev, reading);
    looked += all.length;
    const inC2 = all.filter((p) => p.reason === null);
    for (const p of all.filter((p) => p.reason !== null))
      exclusions.push({ id: ev.id, station: p.station, reason: p.reason ?? '' });
    kept += inC2.length;
    if (inC2.length === 0) continue;
    const medianLn = {} as Record<Row, number>;
    for (const row of ROWS) {
      medianLn[row] = median(inC2.map((p) => p.logs[row]));
      perEvent[row].push(medianLn[row]);
      far[row].push(
        ...inC2.filter((p) => p.distanceKm >= T1_BOUNDS.farFieldFromKm).map((p) => p.logs[row])
      );
    }
    arrivals.push(...inC2.map((p) => p.arrivalLn));
    table.push({
      id: ev.id,
      date: ev.origin.slice(0, 10),
      place: ev.place,
      magnitude: ev.magnitude,
      inC2: inC2.length,
      ofRecords: all.length,
      medianLn,
    });
  }
  const summary = {} as Record<
    Row,
    { events: number; biasLn: number; scatterLn: number; farLn: number }
  >;
  for (const row of ROWS) {
    summary[row] = {
      events: perEvent[row].length,
      biasLn: median(perEvent[row]),
      scatterLn: sd(perEvent[row]),
      farLn: median(far[row]),
    };
  }
  const exists = summary.C2.events >= C2_GUARDS.minimumEvents && kept >= C2_GUARDS.minimumRecords;
  const noWorse = noWorseThanReference(summary.C0.biasLn, summary.C2.biasLn);
  const ownBounds =
    Math.abs(summary.C0.biasLn) <= Math.log(T1_BOUNDS.medianEventFactor) &&
    summary.C0.scatterLn <= T1_BOUNDS.sigmaLn &&
    Math.abs(summary.C0.farLn) <= Math.log(T1_BOUNDS.farFieldFactor);
  return {
    reading,
    looked,
    kept,
    c2Exists: exists,
    noWorseThanReference: noWorse,
    ownBoundsMet: ownBounds,
    t1Met: exists && noWorse && ownBounds,
    summary,
    arrival: {
      records: arrivals.filter(Number.isFinite).length,
      medianLn: median(arrivals.filter(Number.isFinite)),
      within5pc:
        arrivals.filter((a) => Number.isFinite(a) && Math.abs(a) <= Math.log(1.05)).length /
        Math.max(arrivals.filter(Number.isFinite).length, 1),
    },
    events: table,
    exclusions,
  };
}

const readings = observed.variants.map((v) => score(v));
const headline = readings[0];
writeFileSync(
  join(DIR, 'c2-score.json'),
  `${JSON.stringify({ headline: 'bracketed-2cm', readings }, null, 1)}\n`
);

for (const r of readings) {
  console.log(`\n## ${r.reading}: ${r.kept.toString()} of ${r.looked.toString()} records in C2\n`);
  console.log('| Date | Event | Mw | in C2 | C0 | C1 | C2 |');
  console.log('| --- | --- | --: | --: | --: | --: | --: |');
  for (const e of r.events)
    console.log(
      `| ${e.date} | ${e.place} | ${e.magnitude.toFixed(1)} | ${e.inC2.toString()}/${e.ofRecords.toString()} | ${ROWS.map((row) => factor(e.medianLn[row])).join(' | ')} |`
    );
  for (const row of ROWS) {
    const s = r.summary[row];
    console.log(
      `${row}: bias ${factor(s.biasLn)} (ln ${s.biasLn.toFixed(3)}), scatter ln ${s.scatterLn.toFixed(3)}, beyond ${T1_BOUNDS.farFieldFromKm.toString()} km ${factor(s.farLn)}, ${s.events.toString()} events`
    );
  }
  console.log(
    `C2 exists: ${String(r.c2Exists)}; no worse than the reference: ${String(r.noWorseThanReference)}; own bounds: ${String(r.ownBoundsMet)} → T1 ${r.t1Met ? 'MET' : 'not met'}`
  );
  console.log(
    `arrival of the crest: ${factor(r.arrival.medianLn)} on ${r.arrival.records.toString()} records, ${(100 * r.arrival.within5pc).toFixed(0)} % within 5 %`
  );
}
const why = new Map<string, number>();
for (const e of headline?.exclusions ?? [])
  why.set(e.reason.replace(/\d+ %/, 'n %'), (why.get(e.reason.replace(/\d+ %/, 'n %')) ?? 0) + 1);
console.log('\nwhy rows are out of C2 (headline reading):');
for (const [reason, n] of [...why].sort((a, b) => b[1] - a[1]))
  console.log(`  ${n.toString()}: ${reason}`);
