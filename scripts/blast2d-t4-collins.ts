/**
 * Rule 1254 (c) T4 with rule 1260's source (and T5 on it): the solver against
 * Collins et al. (2017)'s Table 2 — their static (S) and moving (M) sources,
 * 0.5, 5, 15 and 50 Mt at 21.5, 14, 10 and 11 km, in their isothermal
 * atmosphere (1 kg/m³ and 10⁵ Pa at the base). The source's specific energy
 * 8.968 MJ/kg (rule 1260 (b)); the literal 45 m·W^(1/3) radius as a
 * sensitivity for the static source. Every number of the table that is a
 * number within 15 %, on the finest of three grids (20, 10 and 5 m scaled to
 * 1 kt).
 *
 *   pnpm exec tsx scripts/blast2d-t4-collins.ts [parallel]
 *
 * Writes src/physics/validation/blast2dT4.json and docs/BLAST2D_T4.md.
 */

import { writeFileSync } from 'node:fs';
import { converge } from './blast2d-hob-judge.js';
import { runPool } from './blast2d-pool.js';
import { reachOf, type BlastCase, type BlastRun } from './blast2d-run.js';

const RHO0 = 1;
const P0 = 1e5;
const G = 9.80665;
const H = P0 / (RHO0 * G);
const KT = 4.184e12;
const SPECIFIC = 8.968e6;
const GRIDS_1KT = [20, 10, 5];
const parallel = Number(process.argv[2] ?? 4);

type Cell = number | null;
interface Row {
  mt: number;
  zb: number;
  gz: [Cell, Cell];
  at3zb: [Cell, Cell];
  r1: [Cell, Cell];
  r10: [Cell, Cell];
  r20: [Cell, Cell];
  r35: [Cell, Cell];
}
/** Collins et al. (2017), Table 2: S and M columns (kPa; km). */
const TABLE: Row[] = [
  {
    mt: 0.5,
    zb: 21.5,
    gz: [3.81, 5.27],
    at3zb: [0.786, 0.811],
    r1: [52.3, 54.8],
    r10: [null, null],
    r20: [null, null],
    r35: [null, null],
  },
  {
    mt: 5,
    zb: 14,
    gz: [21.6, 35.2],
    at3zb: [4.16, 4.41],
    r1: [142, 140],
    r10: [18.7, 22.4],
    r20: [4.48, 11.8],
    r35: [null, 1.16],
  },
  {
    mt: 15,
    zb: 10,
    gz: [65.8, 143],
    at3zb: [11.8, 13.0],
    r1: [257, 236],
    r10: [34.4, 36.2],
    r20: [19.2, 22.1],
    r35: [11.1, 14.9],
  },
  {
    mt: 50,
    zb: 11,
    gz: [116, 326],
    at3zb: [19.6, 20.5],
    r1: [null, null],
    r10: [57.0, 54.3],
    r20: [32.4, 33.5],
    r35: [20.4, 23.3],
  },
];

type Variant = 'S' | 'M' | 'S45';
const radiusOf = (row: Row, v: Variant): number => {
  const e = row.mt * 1e3 * KT;
  if (v === 'S45') return 45 * Math.cbrt(row.mt * 1e3);
  const rho = RHO0 * Math.exp((-row.zb * 1_000) / H);
  return Math.cbrt((3 * (e / SPECIFIC)) / (4 * Math.PI * rho));
};

const caseOf = (row: Row, v: Variant, dx1kt: number): BlastCase => {
  const listed = [row.r1, row.r10, row.r20, row.r35].flatMap((x) =>
    x.filter((y): y is number => y !== null)
  );
  const far = Math.max(3 * row.zb, ...listed) * 1_000;
  return {
    atmosphere: { kind: 'isothermal', rho0: RHO0, p0: P0, g: G },
    energy: row.mt * 1e3 * KT,
    height: row.zb * 1_000,
    radius: radiusOf(row, v),
    kineticShare: v === 'M' ? 1 / 3 : 0,
    dx: dx1kt * Math.cbrt(row.mt * 1e3),
    rMax: 1.2 * far,
    zMax: row.zb * 1_000 + 20_000,
  };
};

const variants: Variant[] = ['S', 'M'];
const cases: BlastCase[] = [];
for (const dx of GRIDS_1KT)
  for (const row of TABLE) for (const v of variants) cases.push(caseOf(row, v, dx));
for (const row of TABLE) cases.push(caseOf(row, 'S45', 5));
const runs = await runPool(cases, 'scripts/tmp/blast2d-cache', parallel);
const runOf = (row: Row, v: Variant, dx: number): BlastRun => {
  const i = cases.findIndex((c) => JSON.stringify(c) === JSON.stringify(caseOf(row, v, dx)));
  const r = runs[i];
  if (r === undefined) throw new Error('missing run');
  return r;
};

/** Peak overpressure (kPa) at a ground range (m), interpolated. */
const peakAt = (run: BlastRun, range: number): number => {
  const { ranges, peaks } = run;
  if (range <= (ranges[0] ?? 0)) return (peaks[0] ?? 0) / 1_000;
  for (let i = 0; i < ranges.length - 1; i++) {
    const a = ranges[i] ?? 0;
    const b = ranges[i + 1] ?? 0;
    if (range >= a && range <= b)
      return (
        ((peaks[i] ?? 0) + ((range - a) / (b - a)) * ((peaks[i + 1] ?? 0) - (peaks[i] ?? 0))) /
        1_000
      );
  }
  return NaN;
};

interface Check {
  mt: number;
  source: Variant;
  quantity: string;
  collins: number;
  solver: number;
  ratio: number;
  within: boolean;
  grids: number[];
  order: number | null;
  extrapolated: number | null;
}
const checks: Check[] = [];
const sensitivity: { mt: number; quantity: string; s: number; s45: number }[] = [];
for (const row of TABLE)
  for (const [k, v] of (['S', 'M'] as const).entries()) {
    const measures: [string, Cell, (run: BlastRun) => number][] = [
      ['peak at ground zero (kPa)', row.gz[k] ?? null, (run) => peakAt(run, 0)],
      ['peak at 3 z_b (kPa)', row.at3zb[k] ?? null, (run) => peakAt(run, 3 * row.zb * 1_000)],
      ['1 kPa range (km)', row.r1[k] ?? null, (run) => reachOf(run, 1_000) / 1_000],
      ['10 kPa range (km)', row.r10[k] ?? null, (run) => reachOf(run, 10_000) / 1_000],
      ['20 kPa range (km)', row.r20[k] ?? null, (run) => reachOf(run, 20_000) / 1_000],
      ['35 kPa range (km)', row.r35[k] ?? null, (run) => reachOf(run, 35_000) / 1_000],
    ];
    for (const [quantity, collins, read] of measures) {
      const grids = GRIDS_1KT.map((dx) => read(runOf(row, v, dx)));
      const solver = grids[grids.length - 1] ?? NaN;
      if (v === 'S')
        sensitivity.push({ mt: row.mt, quantity, s: solver, s45: read(runOf(row, 'S45', 5)) });
      if (collins === null) continue;
      const c = converge(grids);
      checks.push({
        mt: row.mt,
        source: v,
        quantity,
        collins,
        solver,
        ratio: solver / collins,
        within: Math.abs(solver / collins - 1) <= 0.15,
        grids,
        order: c.order,
        extrapolated: c.extrapolated,
      });
    }
  }
const passes = checks.every((c) => c.within);
const fallbacks = runs.reduce((s, r) => s + r.fallbacks, 0);
writeFileSync(
  'src/physics/validation/blast2dT4.json',
  `${JSON.stringify({ rule: '1254 (c) T4, 1260', criterion: 0.15, passes, fallbacks, checks, sensitivity }, null, 1)}\n`
);
const f = (x: number | null, d = 3): string =>
  x === null || !Number.isFinite(x) ? '—' : x.toFixed(d);
const lines = [
  "# Blast solver — T4: Collins et al. (2017)'s Table 2 (rules 1254, 1260)",
  '',
  `${String(checks.filter((c) => c.within).length)} of ${String(checks.length)} numbers within 15 % — **${passes ? 'PASSES' : 'FAILS'}**. First-order fall-backs: ${String(fallbacks)}.`,
  '',
  '| Mt | Source | Quantity | Collins | Solver (5 m) | Ratio | Within | Grids 20/10/5 m | Order | Extrapolated |',
  '| --: | --- | --- | --: | --: | --: | --- | --- | --: | --: |',
  ...checks.map(
    (c) =>
      `| ${String(c.mt)} | ${c.source} | ${c.quantity} | ${String(c.collins)} | ${f(c.solver)} | ${f(c.ratio, 2)} | ${c.within ? 'yes' : 'no'} | ${c.grids.map((g) => f(g)).join(' / ')} | ${f(c.order, 2)} | ${f(c.extrapolated)} |`
  ),
  '',
  '## Sensitivity: the literal 45 m·W^(1/3) radius (static source, finest grid)',
  '',
  '| Mt | Quantity | 8.968 MJ/kg | 45 m·W^(1/3) |',
  '| --: | --- | --: | --: |',
  ...sensitivity.map((s) => `| ${String(s.mt)} | ${s.quantity} | ${f(s.s)} | ${f(s.s45)} |`),
  '',
];
writeFileSync('docs/BLAST2D_T4.md', lines.join('\n'));
console.log(
  JSON.stringify(
    { passes, within: checks.filter((c) => c.within).length, of: checks.length },
    null,
    1
  )
);
