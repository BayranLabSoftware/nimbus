import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dispersionFactor } from '../../src/physics/tsunami/dispersion.js';

/**
 * The score of BM-05 (docs/BENCHMARK_PROTOCOL.md, "After the campaign: the far
 * wave of a megathrust", as amended on 15 September 2026). For each of the
 * four readings of the records: for each model and record ln(model / observed)
 * of the crest; an event's score is the median over its records; a model's
 * bias is the median of the events' scores and its scatter their standard
 * deviation; the decision rule picks C0 or C1. A model is chosen only if all
 * four readings pick it. The ranges, C1 with Nimbus's dispersion and the
 * records pooled by distance are reported beside and decide nothing.
 *
 *   pnpm exec tsx scripts/benchmark/dart-score.ts
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = join(ROOT, 'benchmark', 'dart');
const BASIN_DEPTH_M = 4_000;
const HEADLINE = 'bracketed-2cm';
const BANDS: readonly (readonly [number, number])[] = [
  [0, 1_000],
  [1_000, 3_000],
  [3_000, 7_000],
  [7_000, Number.POSITIVE_INFINITY],
];

interface ObsRec {
  station: string;
  distanceKm: number;
  crestM: number;
  rangeM: number;
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
  rangeM?: number;
}
interface ModelEvent {
  id: string;
  rupture?: { widthM: number };
  records: ModelRec[];
}

const read = (name: string): unknown => JSON.parse(readFileSync(join(DIR, name), 'utf8'));
const observed = read('records.json') as { variants: string[]; events: ObsEvent[] };
const c0 = new Map((read('c0.json') as { events: ModelEvent[] }).events.map((e) => [e.id, e]));
const c1 = new Map((read('c1.json') as { events: ModelEvent[] }).events.map((e) => [e.id, e]));

const median = (xs: readonly number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  const upper = s[mid] ?? Number.NaN;
  const lower = s[s.length % 2 === 1 ? mid : mid - 1] ?? Number.NaN;
  return (lower + upper) / 2;
};
const sd = (xs: readonly number[]): number => {
  const mu = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - mu) ** 2, 0) / Math.max(xs.length - 1, 1));
};
const factor = (ln: number | undefined): string => `${Math.exp(ln ?? Number.NaN).toFixed(2)}×`;

type Row = 'C0' | 'C1' | 'C1 dispersed' | 'C1 range';
const ROWS: readonly Row[] = ['C0', 'C1', 'C1 dispersed', 'C1 range'];

interface Pair {
  distanceKm: number;
  logs: Record<Row, number>;
}

function pairsOf(ev: ObsEvent, reading: string): Pair[] {
  const m0 = c0.get(ev.id);
  const m1 = c1.get(ev.id);
  if (m0 === undefined || m1 === undefined) throw new Error(`missing model for ${ev.id}`);
  const width = m0.rupture?.widthM ?? Number.NaN;
  return ev.records
    .filter((rec) => rec.keptBy[reading] === true)
    .map((rec) => {
      const a = m0.records.find((r) => r.station === rec.station);
      const b = m1.records.find((r) => r.station === rec.station);
      if (a === undefined || b === undefined)
        throw new Error(`missing record ${ev.id} ${rec.station}`);
      const disp = dispersionFactor({
        rangeM: rec.distanceKm * 1_000,
        depthM: BASIN_DEPTH_M,
        wavelengthM: 2 * width,
      });
      return {
        distanceKm: rec.distanceKm,
        logs: {
          C0: Math.log(a.crestM / rec.crestM),
          C1: Math.log(b.crestM / rec.crestM),
          'C1 dispersed': Math.log((b.crestM * disp) / rec.crestM),
          'C1 range': Math.log((b.rangeM ?? Number.NaN) / rec.rangeM),
        },
      };
    });
}

function score(reading: string) {
  const events = observed.events.filter((e) => e.keptBy[reading] === true);
  const perEvent: Record<Row, number[]> = { C0: [], C1: [], 'C1 dispersed': [], 'C1 range': [] };
  const pooled: Pair[] = [];
  const table = events.map((ev) => {
    const pairs = pairsOf(ev, reading);
    pooled.push(...pairs);
    const medianLn = {} as Record<Row, number>;
    for (const row of ROWS) {
      medianLn[row] = median(pairs.map((p) => p.logs[row]));
      perEvent[row].push(medianLn[row]);
    }
    return {
      id: ev.id,
      date: ev.origin.slice(0, 10),
      place: ev.place,
      magnitude: ev.magnitude,
      records: pairs.length,
      medianLn,
    };
  });
  const summary = {} as Record<Row, { events: number; biasLn: number; scatterLn: number }>;
  for (const row of ROWS) {
    summary[row] = {
      events: perEvent[row].length,
      biasLn: median(perEvent[row]),
      scatterLn: sd(perEvent[row]),
    };
  }
  const b0 = Math.abs(summary.C0.biasLn);
  const b1 = Math.abs(summary.C1.biasLn);
  const decided =
    Math.abs(b0 - b1) > Math.log(1.25)
      ? b1 < b0
        ? 'C1'
        : 'C0'
      : summary.C1.scatterLn < summary.C0.scatterLn
        ? 'C1'
        : 'C0';
  const bands = BANDS.map(([lo, hi]) => {
    const inBand = pooled.filter((p) => p.distanceKm >= lo && p.distanceKm < hi);
    return {
      fromKm: lo,
      toKm: Number.isFinite(hi) ? hi : null,
      records: inBand.length,
      medianLn: {
        C0: median(inBand.map((p) => p.logs.C0)),
        C1: median(inBand.map((p) => p.logs.C1)),
      },
    };
  });
  return { decided, summary, events: table, bands };
}

const readings = Object.fromEntries(observed.variants.map((reading) => [reading, score(reading)]));
const choices = [...new Set(Object.values(readings).map((r) => r.decided))];
const decision = choices.length === 1 ? (choices[0] ?? 'undecided') : 'undecided';

writeFileSync(
  join(DIR, 'score.json'),
  `${JSON.stringify({ headline: HEADLINE, decision, readings }, null, 1)}\n`
);

for (const [reading, r] of Object.entries(readings)) {
  console.log(`\n## ${reading}${reading === HEADLINE ? ' (headline)' : ''}: ${r.decided}\n`);
  console.log('| Date | Event | Mw | Records | C0 | C1 | C1 dispersed | C1 range |');
  console.log('| --- | --- | --: | --: | --: | --: | --: | --: |');
  for (const e of r.events) {
    const cells = ROWS.map((row) => factor(e.medianLn[row])).join(' | ');
    console.log(
      `| ${e.date} | ${e.place} | ${e.magnitude.toFixed(1)} | ${e.records.toString()} | ${cells} |`
    );
  }
  for (const row of ROWS) {
    const s = r.summary[row];
    console.log(
      `${row}: bias ${factor(s.biasLn)} (ln ${s.biasLn.toFixed(3)}), scatter ln ${s.scatterLn.toFixed(3)}, ${s.events.toString()} events`
    );
  }
  for (const b of r.bands) {
    const to = b.toKm === null ? '∞' : b.toKm.toString();
    console.log(
      `  ${b.fromKm.toString()}–${to} km: ${b.records.toString()} records, C0 ${factor(b.medianLn.C0)}, C1 ${factor(b.medianLn.C1)}`
    );
  }
}
console.log(`\ndecision: ${decision}`);
