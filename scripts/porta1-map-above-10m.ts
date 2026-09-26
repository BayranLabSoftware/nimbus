/**
 * Rule 1231 (`src/physics/validation/porta1Rules.ts`): round 1's map of the
 * perimeter (rule 1149, `scripts/fcm-domain-map.ts`) re-read above 10 m, where
 * rule 1227's defect acts most — every point of the map whose diameter is 10 m
 * or more, the same inputs and the same draws of the priors, each flown at the
 * reference alone (rule 1149 (b); the 10⁶ bound where the reference's is
 * passed) by the sealed engine and by the corrected settle condition. No
 * variation of step or bins: the convergence of the bodies the correction
 * changes was rule 1229 (f)'s, and it held (rule 1230 (e)).
 *
 *   pnpm exec tsx scripts/porta1-map-above-10m.ts shard k K
 *   pnpm exec tsx scripts/porta1-map-above-10m.ts merge K
 *
 * Writes src/physics/validation/porta1MapAbove10m.json and
 * docs/PORTA1_MAP_ABOVE_10M.md.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fcmEntry, type FcmResult } from '../src/physics/effects/fcmBranch.js';
import { fcmEntrySettle } from '../src/physics/effects/fcmBranchSettle.js';
import { FCM_DOMAIN } from '../src/physics/validation/fcmRoundRules.js';
import { FCM_DOMAIN_MAP } from '../src/physics/validation/fcmRound1Rules.js';
import { stream } from './fragmentationRun.js';
import {
  CONFIGURATIONS,
  KT,
  REFERENCE,
  drawFcm,
  quantities,
  round,
  type EntryInputs,
} from './fcmRound1Common.js';

const SHARDS_DIR = join(tmpdir(), 'nimbus-porta1-map-above-10m');
const THRESHOLD_M = 10;

/** The Halton sequence's i-th value in base b (as `fcm-domain-map.ts`). */
function halton(i: number, b: number): number {
  let f = 1;
  let r = 0;
  let n = i;
  while (n > 0) {
    f /= b;
    r += f * (n % b);
    n = Math.floor(n / b);
  }
  return r;
}

function place(u: readonly [number, number, number, number]): EntryInputs {
  const [d0, d1] = FCM_DOMAIN.diameterM;
  const lin = (r: readonly [number, number], x: number): number => r[0] + (r[1] - r[0]) * x;
  return {
    diameterM: d0 * (d1 / d0) ** u[0],
    speedMS: lin(FCM_DOMAIN.speedMS, u[1]),
    densityKgM3: lin(FCM_DOMAIN.densityKgM3, u[2]),
    angleRad: (lin(FCM_DOMAIN.angleDeg, u[3]) * Math.PI) / 180,
  };
}

/** Rule 1149 (a)'s points, in the map's own order and index. */
function points(): { index: number; kind: string; inputs: EntryInputs }[] {
  const out: { index: number; kind: string; inputs: EntryInputs }[] = [];
  for (let m = 0; m < 16; m++)
    out.push({
      index: out.length,
      kind: 'corner',
      inputs: place([m & 1, (m >> 1) & 1, (m >> 2) & 1, (m >> 3) & 1]),
    });
  out.push({ index: out.length, kind: 'centre', inputs: place([0.5, 0.5, 0.5, 0.5]) });
  const [b0, b1, b2, b3] = FCM_DOMAIN_MAP.bases;
  for (let i = 1; i <= FCM_DOMAIN_MAP.halton; i++)
    out.push({
      index: out.length,
      kind: 'halton',
      inputs: place([halton(i, b0), halton(i, b1), halton(i, b2), halton(i, b3)]),
    });
  return out;
}

/** Rule 1154 (b)'s ledger: the energy given to the air at stops, over E0. */
const stoppedShare = (r: FcmResult): number =>
  (r.ledger.deposited -
    r.ledger.dragWork -
    r.ledger.ablatedEnergy -
    r.ledger.flightResidual * r.energy) /
  r.energy;

interface Reading {
  completed: boolean;
  peakKtKm: number | null;
  peakAltitudeKm: number | null;
  stoppedShare: number | null;
  settledShare: number | null;
  groundEnergyShare: number | null;
  energyResidual: number | null;
}

function read(r: FcmResult): Reading {
  if (!r.completed)
    return {
      completed: false,
      peakKtKm: null,
      peakAltitudeKm: null,
      stoppedShare: null,
      settledShare: null,
      groundEnergyShare: null,
      energyResidual: null,
    };
  const q = quantities(r);
  return {
    completed: true,
    peakKtKm: round(q.peakKtKm, 5),
    peakAltitudeKm: round(q.peakAltitudeKm, 5),
    stoppedShare: round(stoppedShare(r), 6),
    settledShare: round(r.ledger.settledCloudMass / r.mass, 6),
    groundEnergyShare: round(q.groundEnergyShare, 6),
    energyResidual: r.ledger.energyResidual,
  };
}

interface Row {
  point: number;
  kind: string;
  configuration: string;
  inputs: { diameterM: number; speedKmS: number; densityKgM3: number; angleDeg: number };
  entryKt: number;
  identical: boolean;
  sealed: Reading;
  corrected: Reading;
}

function flyPoint(p: { index: number; kind: string; inputs: EntryInputs }): Row[] {
  return CONFIGURATIONS.map(({ structure, cloud }) => {
    const u = stream(`${FCM_DOMAIN_MAP.seed}/${String(p.index)}/${structure}/${cloud}`);
    const d = drawFcm(p.inputs, structure, cloud, u);
    const fly = (f: typeof fcmEntry): FcmResult => {
      const r = f(d.body, { ...d.options, ...REFERENCE });
      return r.completed
        ? r
        : f(d.body, { ...d.options, ...REFERENCE, maxComponents: FCM_DOMAIN_MAP.retryComponents });
    };
    const a = fly(fcmEntry);
    const b = fly(fcmEntrySettle);
    return {
      point: p.index,
      kind: p.kind,
      configuration: `${structure}/${cloud}`,
      inputs: {
        diameterM: round(p.inputs.diameterM, 5),
        speedKmS: round(p.inputs.speedMS / 1_000, 5),
        densityKgM3: round(p.inputs.densityKgM3, 5),
        angleDeg: round((p.inputs.angleRad * 180) / Math.PI, 5),
      },
      entryKt: round(a.energy / KT, 5),
      identical:
        a.completed === b.completed &&
        JSON.stringify(a.energyPerBin) === JSON.stringify(b.energyPerBin) &&
        JSON.stringify(a.ledger) === JSON.stringify(b.ledger),
      sealed: read(a),
      corrected: read(b),
    };
  });
}

const above = (): { index: number; kind: string; inputs: EntryInputs }[] =>
  points().filter((p) => p.inputs.diameterM >= THRESHOLD_M);

/** The points shared among K shards by their cost in round 1's map (its
 *  recorded steps, deterministic), the heaviest first to the lightest shard —
 *  a balance of the wall time only; every point is flown once either way. */
function assignment(K: number): Map<number, number> {
  const map = JSON.parse(readFileSync('src/physics/validation/fcmDomainMap.json', 'utf8')) as {
    records: { point: number; steps: number | null }[];
  };
  const cost = new Map<number, number>();
  for (const r of map.records) cost.set(r.point, (cost.get(r.point) ?? 0) + (r.steps ?? 0));
  const load = Array.from({ length: K }, () => 0);
  const out = new Map<number, number>();
  for (const p of [...above()].sort(
    (a, b) => (cost.get(b.index) ?? 0) - (cost.get(a.index) ?? 0) || a.index - b.index
  )) {
    const k = load.indexOf(Math.min(...load));
    out.set(p.index, k);
    load[k] = (load[k] ?? 0) + (cost.get(p.index) ?? 0);
  }
  return out;
}

function shard(k: number, K: number): void {
  const rows: Row[] = [];
  const to = assignment(K);
  for (const p of above()) if (to.get(p.index) === k) rows.push(...flyPoint(p));
  mkdirSync(SHARDS_DIR, { recursive: true });
  writeFileSync(join(SHARDS_DIR, `shard-${String(k)}-of-${String(K)}.json`), JSON.stringify(rows));
}

function merge(K: number): void {
  const rows: Row[] = [];
  for (let k = 0; k < K; k++) {
    const p = join(SHARDS_DIR, `shard-${String(k)}-of-${String(K)}.json`);
    if (!existsSync(p)) throw new Error(`missing ${p}`);
    rows.push(...(JSON.parse(readFileSync(p, 'utf8')) as Row[]));
  }
  rows.sort((a, b) => a.point - b.point || a.configuration.localeCompare(b.configuration));
  writeFileSync(
    'src/physics/validation/porta1MapAbove10m.json',
    `${JSON.stringify({ rule: '1231', thresholdM: THRESHOLD_M, rows }, null, 1)}\n`
  );

  const both = rows.filter((r) => r.sealed.completed && r.corrected.completed);
  const changed = both.filter((r) => !r.identical);
  const heavy = (x: Reading): boolean => (x.stoppedShare ?? 0) > 0.01;
  const med = (xs: number[]): string => {
    if (xs.length === 0) return '—';
    const s = [...xs].sort((a, b) => a - b);
    return (s[Math.floor(s.length / 2)] ?? 0).toFixed(2);
  };
  const byDiameter = (lo: number, hi: number): Row[] =>
    both.filter((r) => r.inputs.diameterM >= lo && r.inputs.diameterM < hi);
  const lines: string[] = [
    '# Porta 1 — round 1’s map re-read above 10 m (rule 1231)',
    '',
    `Every point of round 1's map of the perimeter (rule 1149) whose diameter is ${String(THRESHOLD_M)} m or more — ${String(new Set(rows.map((r) => r.point)).size)} points, four configurations, ${String(rows.length)} runs — flown at the reference by the sealed engine (\`fcmBranch.ts\`, rule 1162) and by the corrected settle condition (\`fcmBranchSettle.ts\`, rule 1227), on the map's own inputs and draws. Development only; no adoption.`,
    '',
    `Completed under both engines: ${String(both.length)} of ${String(rows.length)}. Identical to the bit: ${String(both.length - changed.length)}. Changed: ${String(changed.length)}.`,
    '',
    `Runs whose sealed flight gives more than 1 % of the entry's energy to the air at stops: ${String(both.filter((r) => heavy(r.sealed)).length)}; under the corrected engine: ${String(both.filter((r) => heavy(r.corrected)).length)}.`,
    '',
    '| Diameter | Runs (both completed) | Changed | Median energy at stops, sealed → corrected | Median peak altitude, sealed → corrected |',
    '| --- | --: | --: | --- | --- |',
  ];
  for (const [lo, hi, label] of [
    [10, 30, '10–30 m'],
    [30, 100, '30–100 m'],
    [100, 301, '100–300 m'],
  ] as const) {
    const rs = byDiameter(lo, hi);
    lines.push(
      `| ${label} | ${String(rs.length)} | ${String(rs.filter((r) => !r.identical).length)} | ${med(rs.map((r) => (r.sealed.stoppedShare ?? 0) * 100))} % → ${med(rs.map((r) => (r.corrected.stoppedShare ?? 0) * 100))} % | ${med(rs.map((r) => r.sealed.peakAltitudeKm ?? 0))} → ${med(rs.map((r) => r.corrected.peakAltitudeKm ?? 0))} km |`
    );
  }
  const worst = Math.max(...both.map((r) => Math.abs(r.corrected.energyResidual ?? 0)));
  lines.push(
    '',
    `The corrected engine's ledger, worst over every completed run: ${worst.toExponential(2)} (rule 1141 (a): 10⁻¹²).`,
    ''
  );
  writeFileSync('docs/PORTA1_MAP_ABOVE_10M.md', lines.join('\n'));
  console.log(lines.slice(4, 8).join('\n'));
}

const [mode, a, b] = process.argv.slice(2);
if (mode === 'shard') shard(Number(a), Number(b));
else if (mode === 'merge') merge(Number(a));
else throw new Error('usage: shard k K | merge K');
