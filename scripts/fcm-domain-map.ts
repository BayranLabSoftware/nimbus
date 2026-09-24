/**
 * Rules 1149 and 1150 (src/physics/validation/fcmRound1Rules.ts): the map of
 * the FCM branch's perimeter — every corner, the centre and 240 Halton points,
 * each under both structures and both clouds — and the aggregated tail tried
 * on the cascades past the bound. Writes src/physics/validation/
 * fcmDomainMap.json and docs/FCM_DOMAIN_MAP.md (deterministic), and
 * docs/FCM_COST.md (the times on this machine, dated).
 *
 *   pnpm exec tsx scripts/fcm-domain-map.ts all          # every shard, then the merge
 *   pnpm exec tsx scripts/fcm-domain-map.ts shard k K    # the points i with i % K = k
 *   pnpm exec tsx scripts/fcm-domain-map.ts merge K
 *
 * The points are independent, so the shards run in parallel; the merge reads
 * them back in the points' order.
 */

import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { availableParallelism, cpus, tmpdir } from 'node:os';
import { join } from 'node:path';
import { FCM_DOMAIN } from '../src/physics/validation/fcmRoundRules.js';
import { FCM_AGGREGATED_TAIL, FCM_DOMAIN_MAP } from '../src/physics/validation/fcmRound1Rules.js';
import { stream } from './fragmentationRun.js';
import {
  CONFIGURATIONS,
  KT,
  drawFcm,
  failing,
  quantities,
  round,
  run,
  type DrawnParameters,
  type EntryInputs,
  type Key,
  type Quantities,
} from './fcmRound1Common.js';

const SHARDS_DIR = join(tmpdir(), 'nimbus-fcm-domain-map');

/** The Halton sequence's i-th value in base b. */
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

/** A point of the unit hypercube placed in the perimeter: the diameter on its
 *  logarithm, the rest linearly. */
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

/** Rule 1149 (a): the corners, the centre, the Halton points. */
function points(): { kind: 'corner' | 'centre' | 'halton'; inputs: EntryInputs }[] {
  const out: { kind: 'corner' | 'centre' | 'halton'; inputs: EntryInputs }[] = [];
  for (let m = 0; m < 16; m++)
    out.push({
      kind: 'corner',
      inputs: place([m & 1, (m >> 1) & 1, (m >> 2) & 1, (m >> 3) & 1]),
    });
  out.push({ kind: 'centre', inputs: place([0.5, 0.5, 0.5, 0.5]) });
  const [b0, b1, b2, b3] = FCM_DOMAIN_MAP.bases;
  for (let i = 1; i <= FCM_DOMAIN_MAP.halton; i++)
    out.push({
      kind: 'halton',
      inputs: place([halton(i, b0), halton(i, b1), halton(i, b2), halton(i, b3)]),
    });
  return out;
}

type Status =
  | 'convergent'
  | 'not robust'
  | 'not convergent'
  | 'completed at 10⁶'
  | 'completed by the tail'
  | 'not completed';

interface TailTry {
  share: number;
  completed: boolean;
  /** Against the exact flight, where it completed. */
  failing: Key[] | null;
  quantities: Quantities | null;
}

interface RunRecord {
  point: number;
  kind: string;
  structure: string;
  cloud: string;
  inputs: { diameterM: number; speedKmS: number; densityKgM3: number; angleDeg: number };
  entryKt: number;
  parameters: DrawnParameters;
  completed: boolean;
  /** Completed with 10⁶ components where the reference's 10⁵ did not. */
  completedAtMillion: boolean;
  components: number;
  steps: number;
  quantities: Quantities | null;
  variations: { name: string; completed: boolean; failing: Key[] }[];
  tails: TailTry[];
  status: Status;
  ms: number;
}

function runPoint(index: number, kind: string, x: EntryInputs): RunRecord[] {
  return CONFIGURATIONS.map(({ structure, cloud }) => {
    const u = stream(`${FCM_DOMAIN_MAP.seed}/${String(index)}/${structure}/${cloud}`);
    const d = drawFcm(x, structure, cloud, u);
    const t0 = performance.now();
    let ref = run(d);
    let atMillion = false;
    if (!ref.completed) {
      ref = run(d, { maxComponents: FCM_DOMAIN_MAP.retryComponents });
      atMillion = ref.completed;
    }
    const bound = atMillion ? FCM_DOMAIN_MAP.retryComponents : undefined;
    const entryKt = ref.energy / KT;
    const base = {
      point: index,
      kind,
      structure,
      cloud,
      inputs: {
        diameterM: round(x.diameterM, 5),
        speedKmS: round(x.speedMS / 1_000, 5),
        densityKgM3: round(x.densityKgM3, 5),
        angleDeg: round((x.angleRad * 180) / Math.PI, 5),
      },
      entryKt: round(entryKt, 5),
      parameters: d.parameters,
      completed: ref.completed,
      completedAtMillion: atMillion,
      components: ref.components,
      steps: ref.steps,
    };
    const tails: TailTry[] = [];
    if (!ref.completed) {
      // Rule 1150: the tail tried on the draw past the bound.
      for (const share of FCM_AGGREGATED_TAIL) {
        const t = run(d, {
          aggregateBelowShare: share,
          maxComponents: FCM_DOMAIN_MAP.retryComponents,
        });
        tails.push({
          share,
          completed: t.completed,
          failing: null,
          quantities: t.completed ? quantities(t) : null,
        });
      }
      return {
        ...base,
        quantities: null,
        variations: [],
        tails,
        status: 'not completed' as Status,
        ms: Math.round(performance.now() - t0),
      };
    }
    const q = quantities(ref);
    const variations = FCM_DOMAIN_MAP.variations.map((v) => {
      const r = run(d, { ...v, ...(bound === undefined ? {} : { maxComponents: bound }) });
      const name = 'stepM' in v ? `step ${String(v.stepM)} m` : `bins ${String(v.binM)} m`;
      return {
        name,
        completed: r.completed,
        failing: r.completed ? failing(q, quantities(r), entryKt) : ([] as Key[]),
      };
    });
    // Rule 1150: the tail verified against the exact flight.
    for (const share of FCM_AGGREGATED_TAIL) {
      const t = run(d, {
        aggregateBelowShare: share,
        ...(bound === undefined ? {} : { maxComponents: bound }),
      });
      tails.push({
        share,
        completed: t.completed,
        failing: t.completed ? failing(q, quantities(t), entryKt) : null,
        quantities: null,
      });
    }
    const notConvergent = variations.some((v) => !v.completed || v.failing.length > 0);
    const status: Status = notConvergent
      ? 'not convergent'
      : !q.robust
        ? 'not robust'
        : atMillion
          ? 'completed at 10⁶'
          : 'convergent';
    return {
      ...base,
      quantities: q,
      variations,
      tails,
      status,
      ms: Math.round(performance.now() - t0),
    };
  });
}

function shard(k: number, K: number): void {
  const out: RunRecord[] = [];
  points().forEach((p, i) => {
    if (i % K === k) out.push(...runPoint(i, p.kind, p.inputs));
  });
  mkdirSync(SHARDS_DIR, { recursive: true });
  writeFileSync(join(SHARDS_DIR, `shard-${String(k)}-of-${String(K)}.json`), JSON.stringify(out));
}

/** Rule 1149 (c): the regions. */
function region(r: RunRecord): { diameter: string; speed: string; angle: string; density: string } {
  const D = r.inputs.diameterM;
  const diameter = D < 1 ? '0.1–1 m' : D < 10 ? '1–10 m' : D < 100 ? '10–100 m' : '100–300 m';
  const third = (x: number, [a, b]: readonly [number, number], unit: string): string => {
    const s = (b - a) / 3;
    const i = Math.min(2, Math.floor((x - a) / s));
    return `${String(round(a + i * s, 3))}–${String(round(a + (i + 1) * s, 3))} ${unit}`;
  };
  const speed = third(r.inputs.speedKmS, [11.2, 30], 'km/s');
  const angle = third(r.inputs.angleDeg, FCM_DOMAIN.angleDeg, '°');
  const density = r.inputs.densityKgM3 < 2_750 ? '1 500–2 750 kg/m³' : '2 750–4 000 kg/m³';
  return { diameter, speed, angle, density };
}

function merge(K: number): void {
  const records: RunRecord[] = [];
  for (let k = 0; k < K; k++)
    records.push(
      ...(JSON.parse(
        readFileSync(join(SHARDS_DIR, `shard-${String(k)}-of-${String(K)}.json`), 'utf8')
      ) as RunRecord[])
    );
  records.sort(
    (a, b) =>
      a.point - b.point ||
      CONFIGURATIONS.findIndex((c) => c.structure === a.structure && c.cloud === a.cloud) -
        CONFIGURATIONS.findIndex((c) => c.structure === b.structure && c.cloud === b.cloud)
  );

  // Rule 1150: the largest share whose tail matches every exact flight.
  const exact = records.filter((r) => r.completed);
  const verification = FCM_AGGREGATED_TAIL.map((share) => {
    const tries = exact.map((r) => r.tails.find((t) => t.share === share));
    const failed = exact.filter((_, i) => {
      const t = tries[i];
      return t === undefined || !t.completed || (t.failing?.length ?? 1) > 0;
    });
    return {
      share,
      draws: exact.length,
      failed: failed.length,
      failing: failed.slice(0, 20).map((r) => `${String(r.point)} ${r.structure}/${r.cloud}`),
    };
  });
  const chosen = verification.find((v) => v.failed === 0)?.share ?? null;
  for (const r of records) {
    if (r.completed || chosen === null) continue;
    const t = r.tails.find((x) => x.share === chosen);
    if (t?.completed === true) {
      r.status = 'completed by the tail';
      r.quantities = t.quantities;
    }
  }

  const STATUSES: Status[] = [
    'convergent',
    'not robust',
    'completed at 10⁶',
    'not convergent',
    'completed by the tail',
    'not completed',
  ];
  const count = (rs: readonly RunRecord[]): Record<Status, number> =>
    Object.fromEntries(STATUSES.map((s) => [s, rs.filter((r) => r.status === s).length])) as Record<
      Status,
      number
    >;
  const by = (key: 'diameter' | 'speed' | 'angle' | 'density') => {
    const groups = new Map<string, RunRecord[]>();
    for (const r of records) {
      const g = region(r)[key];
      groups.set(g, [...(groups.get(g) ?? []), r]);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => Number.parseFloat(a) - Number.parseFloat(b))
      .map(([g, rs]) => ({ region: g, runs: rs.length, ...count(rs) }));
  };
  const crossed = (() => {
    const groups = new Map<string, RunRecord[]>();
    for (const r of records) {
      const g = region(r);
      const key = `${g.diameter} · ${g.speed}`;
      groups.set(key, [...(groups.get(key) ?? []), r]);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => Number.parseFloat(a) - Number.parseFloat(b) || a.localeCompare(b))
      .map(([g, rs]) => ({ region: g, runs: rs.length, ...count(rs) }));
  })();
  const byConfiguration = CONFIGURATIONS.map((c) => ({
    configuration: `${c.structure}/${c.cloud}`,
    ...count(records.filter((r) => r.structure === c.structure && r.cloud === c.cloud)),
  }));
  const failingQuantities = Object.fromEntries(
    (
      [
        'peakKtKm',
        'peakAltitudeKm',
        'depositedShare',
        'groundEnergyShare',
        'survivalShare',
        'largestShare',
      ] as Key[]
    ).map((k) => [k, records.filter((r) => r.variations.some((v) => v.failing.includes(k))).length])
  );
  const notCompleted = records
    .filter((r) => !r.completed)
    .map((r) => ({
      point: r.point,
      kind: r.kind,
      configuration: `${r.structure}/${r.cloud}`,
      inputs: r.inputs,
      parameters: r.parameters,
      components: r.components,
      tails: r.tails.map((t) => ({ share: t.share, completed: t.completed })),
      status: r.status,
    }));

  const out = {
    rules: '1149, 1150',
    points: records.length / CONFIGURATIONS.length,
    runs: records.length,
    total: count(records),
    byConfiguration,
    byDiameter: by('diameter'),
    bySpeed: by('speed'),
    byAngle: by('angle'),
    byDensity: by('density'),
    byDiameterAndSpeed: crossed,
    failingQuantities,
    tail: { verification, chosen },
    notCompleted,
    costSteps: {
      median: median(records.map((r) => r.steps)),
      max: Math.max(...records.map((r) => r.steps)),
    },
    records: records.map(({ ms: _ms, tails: _t, ...r }) => ({
      ...r,
      quantities:
        r.quantities === null
          ? null
          : Object.fromEntries(
              Object.entries(r.quantities).map(([k, x]) => [
                k,
                typeof x === 'number' ? round(x, 5) : x,
              ])
            ),
      parameters: Object.fromEntries(
        Object.entries(r.parameters).map(([k, x]) => [
          k,
          typeof x === 'number'
            ? round(x, 5)
            : x === null
              ? null
              : Object.fromEntries(
                  Object.entries(x as Record<string, number>).map(([a, y]) => [a, round(y, 5)])
                ),
        ])
      ),
    })),
  };
  writeFileSync('src/physics/validation/fcmDomainMap.json', `${JSON.stringify(out, null, 1)}\n`);

  const table = (
    title: string,
    head: string,
    rows: readonly ({ region?: string; configuration?: string; runs?: number } & Record<
      Status,
      number
    >)[]
  ): string[] => [
    `### ${title}`,
    '',
    `| ${head} | ${STATUSES.join(' | ')} |`,
    `| --- | ${STATUSES.map(() => '---').join(' | ')} |`,
    ...rows.map(
      (r) =>
        `| ${r.region ?? r.configuration ?? ''} | ${STATUSES.map((s) => String(r[s])).join(' | ')} |`
    ),
    '',
  ];
  const lines = [
    '# FCM round 1 — the map of the perimeter',
    '',
    'Rules 1149 and 1150 (`src/physics/validation/fcmRound1Rules.ts`), run by `scripts/fcm-domain-map.ts`.',
    `${String(out.points)} points — the sixteen corners of the perimeter (1 500–4 000 kg/m³, 0.1–300 m,`,
    '11.2–30 km/s, 15°–90°), its centre and 240 Halton points — each under both structures and both clouds,',
    `${String(out.runs)} runs, each with one draw of rule 1152's priors. Every run is in its region's denominator.`,
    '',
    'The statuses: «convergent» — completed at the reference (10 m steps and bins, a floor of 1 g, a bound of',
    '100 000 components) and every decisional quantity within rule 1141 (c)’s tolerance under the step halved,',
    'the step doubled and bins of 100 m; «not robust» — the same, but two peaks within 95 % of each other',
    '(rule 1151), so the peak’s altitude is no single quantity; «completed at 10⁶» — convergent, but only with',
    'a bound of 1 000 000; «not convergent» — some quantity moves beyond its tolerance; «completed by the tail» —',
    'past 10⁶, completed by rule 1150’s aggregated tail (an extrapolation); «not completed» — past every bound.',
    '',
    ...table('All runs', 'Runs', [{ region: String(out.runs), ...out.total }]),
    ...table('By configuration', 'Configuration', byConfiguration),
    ...table('By diameter', 'Diameter', out.byDiameter),
    ...table('By speed', 'Speed', out.bySpeed),
    ...table('By angle', 'Angle', out.byAngle),
    ...table('By density', 'Density', out.byDensity),
    ...table('By diameter and speed', 'Diameter · speed', out.byDiameterAndSpeed),
    '### Which quantity fails where a run does not converge',
    '',
    ...Object.entries(failingQuantities).map(([k, n]) => `- ${k}: ${String(n)} runs`),
    '',
    '### The aggregated tail (rule 1150)',
    '',
    ...verification.map(
      (v) =>
        `- f_agg = ${String(v.share)}: against the exact flight on ${String(v.draws)} completed runs, ${String(v.failed)} fail${v.failed > 0 ? ` (first: ${v.failing.join('; ')})` : ''}.`
    ),
    '',
    chosen === null
      ? 'No share passes on every exact flight: the tail is not verified, and the runs past the bound stay «not completed» — the domain ready for the test is to be restricted by a rule written before round 3.'
      : `The share ${String(chosen)} passes on every exact flight and completes ${String(records.filter((r) => r.status === 'completed by the tail').length)} of the ${String(notCompleted.length)} runs past the bound — an extrapolation, the tail being small where it was verified.`,
    '',
    '### The runs past the bound',
    '',
    '| Point | Configuration | D (m) | v (km/s) | ρ (kg/m³) | θ (°) | α | larger | cloud | Components | Status |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...notCompleted.map(
      (n) =>
        `| ${String(n.point)} (${n.kind}) | ${n.configuration} | ${String(round(n.inputs.diameterM, 3))} | ${String(round(n.inputs.speedKmS, 3))} | ${String(round(n.inputs.densityKgM3, 3))} | ${String(round(n.inputs.angleDeg, 3))} | ${String(round(n.parameters.alpha, 2))} | ${String(round(n.parameters.larger, 2))} | ${String(round(n.parameters.cloudShare, 2))} | ${String(n.components)} | ${n.status} |`
    ),
    '',
    `The cost, deterministic: a run flies ${String(out.costSteps.median)} steps at the median and ${String(out.costSteps.max)} at most (a step is one component, with its members, over one step). The times on this machine: docs/FCM_COST.md.`,
    '',
  ];
  writeFileSync('docs/FCM_DOMAIN_MAP.md', lines.join('\n'));

  // Rule 1149 (d): the times, dated, apart from the deterministic outputs.
  const ms = records.map((r) => r.ms).sort((a, b) => a - b);
  const q = (p: number): number => ms[Math.min(ms.length - 1, Math.floor(p * ms.length))] ?? 0;
  writeFileSync(
    'docs/FCM_COST.md',
    [
      '# FCM round 1 — the cost on this machine',
      '',
      `Measured by \`scripts/fcm-domain-map.ts\` on ${new Date().toISOString().slice(0, 10)}, ${cpus()[0]?.model ?? 'unknown CPU'}, Node ${process.version}, one run at a time per process: the wall time of a map run — the reference and, where it completed, its three variations and three tails (seven flights), or the retries and tails where it did not. Not deterministic, and not part of any validation output.`,
      '',
      `| Median | 90th percentile | 99th percentile | Largest | Total over ${String(ms.length)} runs |`,
      '| --- | --- | --- | --- | --- |',
      `| ${String(q(0.5))} ms | ${String(q(0.9))} ms | ${String(q(0.99))} ms | ${String(ms[ms.length - 1] ?? 0)} ms | ${String(Math.round(ms.reduce((a, b) => a + b, 0) / 1_000))} s |`,
      '',
    ].join('\n')
  );
  console.log(JSON.stringify({ total: out.total, tail: out.tail }, null, 1));
}

function median(xs: readonly number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? 0;
}

async function all(): Promise<void> {
  const K = Math.max(1, availableParallelism() - 1);
  await Promise.all(
    Array.from(
      { length: K },
      (_, k) =>
        new Promise<void>((resolve, reject) => {
          const child = spawn(
            process.execPath,
            [...process.execArgv, process.argv[1] ?? '', 'shard', String(k), String(K)],
            { stdio: 'inherit' }
          );
          child.on('exit', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`shard ${String(k)} exited ${String(code)}`));
          });
        })
    )
  );
  merge(K);
}

const [mode, a, b] = process.argv.slice(2);
if (mode === 'shard') shard(Number(a), Number(b));
else if (mode === 'merge') merge(Number(a));
else await all();
