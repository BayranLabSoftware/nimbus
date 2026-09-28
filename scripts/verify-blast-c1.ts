/**
 * Rules 1333 (c) and 1349 (`src/physics/validation/blastSolverRules.ts`):
 * step 2's first validation — the free-air burst of 1 kt against the DNA
 * 1-kt standard (Needham & Crepeau 1981, Eq. 7: C1) and Brode 1987's
 * arrival-time fit to test data (Eq. 40: C2); the positive impulse (C3)
 * reported against Brode's Eqs. 33 and 48. The runs are
 * `scripts/blast1d-c1-runs.ts`'s (real air, the hot sphere), converged from
 * the three finest grids by rule 1256 (c) with rule 1318 (d)'s band; f_b a
 * priori from Glasstone & Dolan (rule 1333 (b)).
 *
 *   pnpm exec tsx scripts/verify-blast-c1.ts
 *
 * Writes src/physics/validation/verifyBlastC1.json.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const FT = 0.3048;
const PSI = 6_894.757;
const GRIDS = [0.625, 0.3125, 0.15625];
const SOURCES = [35, 40, 45];
const CENTRAL = 40;
const C1_RANGES = [100, 150, 200, 300, 500, 700, 1_000, 1_500, 2_000];
const C2_RANGES = [300, 500, 700, 1_000];
const REPORTED = [20, 30, 50, 70, 100];
const C1_TOLERANCE = 0.12;
const C2_TOLERANCE = 0.07;

interface Printed {
  printed: string;
  value: number | null;
}
/** A transcribed number: its value, or a printed fraction such as «1/2». */
function num(x: Printed): number {
  if (x.value !== null) return x.value;
  const m = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(x.printed);
  if (m === null) throw new Error(`C1: no number in «${x.printed}»`);
  return Number(m[1]) / Number(m[2]);
}
const A = JSON.parse(
  readFileSync(
    `${process.env.HOME ?? ''}/Desktop/Nimbus-laboratorio/trascrizioni/passo2/amanuense-A.json`,
    'utf8'
  )
) as {
  items: [
    { constants_1981: { rows: { parameter: string; from: Printed; to: Printed }[] } },
    { radius_to_pressure: { rows: { R: Printed; OP: Printed }[] } },
    { constants: Printed[] },
    { constants: Printed[] },
    { constants: Printed[] },
    { f_1kt_lowest_altitude: Printed },
    { shares: { initial_prompt_nuclear_radiation_percent: Printed } },
  ];
};
const [nc, table, eq33, eq40, eq48, gdTable, gdShares] = A.items;

// N&C's Eq. 7: OP = A/R³ + B/R² + C/(R·[ln(R/R₀ + 3 exp(−⅓(R/R₀)^½))]^½).
const eq7 = (a: number, b: number, c: number, r0: number, r: number): number =>
  a / r ** 3 +
  b / r ** 2 +
  c / (r * Math.sqrt(Math.log(r / r0 + 3 * Math.exp(-(1 / 3) * Math.sqrt(r / r0)))));
// A 1981 constant printed «Unchanged» keeps its 1975 value.
const constants = nc.constants_1981.rows.map((x) =>
  /unchanged/i.test(x.to.printed) ? num(x.from) : num(x.to)
);
const rows = table.radius_to_pressure.rows
  .map((x) => ({ r: num(x.R), op: num(x.OP) }))
  .filter((x) => x.r >= 10 && x.r <= 10_000);
// Every assignment of the four constants to (A, B, C, R₀), in MKS (m, Pa) or
// cgs (cm, dyn/cm²): the one that reproduces App. III within 0.5 %.
const perms: number[][] = [];
const permute = (left: number[], done: number[]): void => {
  if (left.length === 0) perms.push(done);
  for (const [k, x] of left.entries())
    permute([...left.slice(0, k), ...left.slice(k + 1)], [...done, x]);
};
permute([0, 1, 2, 3], []);
const fits: { perm: number[]; cgs: boolean }[] = [];
for (const perm of perms)
  for (const cgs of [false, true]) {
    const [a, b, c, r0] = perm.map((k) => constants[k] ?? NaN) as [number, number, number, number];
    const ok = rows.every((x) => {
      const r = cgs ? x.r * 100 : x.r;
      const op = eq7(a, b, c, r0, r) * (cgs ? 0.1 : 1);
      return Math.abs(op / x.op - 1) <= 0.005;
    });
    if (ok) fits.push({ perm, cgs });
  }
if (fits.length !== 1)
  throw new Error(`C1: N&C's constants fit App. III in ${String(fits.length)} ways, not one`);
const fit = fits[0] ?? { perm: [0, 1, 2, 3], cgs: false };
if (process.env.C1_DRY === '1') {
  console.log(`N&C's constants: one assignment fits App. III (${fit.cgs ? 'cgs' : 'MKS'})`);
  process.exit(0);
}
const [kA, kB, kC, kR0] = fit.perm.map((k) => constants[k] ?? NaN) as [
  number,
  number,
  number,
  number,
];
/** N&C's standard peak overpressure at R m (1 kt), Pa. */
const standard = (r: number): number =>
  fit.cgs ? eq7(kA, kB, kC, kR0, r * 100) * 0.1 : eq7(kA, kB, kC, kR0, r);

const c33 = eq33.constants.map(num);
/** B87 Eq. 33: the peak at R m (1 kt), Pa. */
const brode33 = (rm: number): number => {
  const [a1, a2, e1, a3, e2, b0, b1, f, n, d0, d1, m] = c33 as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const r = rm / FT / 1_000;
  const x = f * r;
  return (a1 / r + a2 / r ** e1 + (a3 / r ** e2) * (b0 + (b1 * x ** n) / (d0 + d1 * x ** m))) * PSI;
};
const c40 = eq40.constants.map(num);
/** B87 Eq. 40: the arrival at R m (1 kt, m = 1), s. */
const brode40 = (rm: number): number => {
  const [n3, n2, n1, n0, d1, d0] = c40 as [number, number, number, number, number, number];
  const sr = rm / FT / 1_000;
  return (n3 - n2 * sr + n1 * sr ** 2 + n0 * sr ** 3) / (1 + d1 * sr + d0 * sr ** 2) / 1_000;
};
const c48 = eq48.constants.map(num);
/** B87 Eq. 48 on Eq. 33: the positive impulse at R m (1 kt), Pa s. */
const brode48 = (rm: number): number => {
  const [k, e, one, d, e2] = c48 as [number, number, number, number, number];
  const dp = brode33(rm) / PSI;
  return (((k * dp ** e) / (one + d * dp ** e2)) * PSI) / 1_000;
};

const fTh = num(gdTable.f_1kt_lowest_altitude);
const fN = num(gdShares.shares.initial_prompt_nuclear_radiation_percent) / 100;
const fbCentral = 1 - fTh - fN;
const fbLow = 1 - 1.25 * fTh - 1.5 * fN;
const fbHigh = 1 - 0.5 * fN;

interface Run {
  dr: number;
  cells: [number, number, number][];
  probes: { r: number; foot: number; impulse: number; peak: number }[];
  beyondShareMax: number;
  fallbacks: number;
}
const load = (dr: number, radius: number, eos = 'air'): Run | null => {
  const file = `scripts/tmp/blast1d-c1/c1-${eos}-${String(dr)}-${String(radius)}.json`;
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Run) : null;
};
const between = (xs: number[], ys: number[], x: number): number => {
  let k = 0;
  while (k + 2 < xs.length && (xs[k + 1] ?? Infinity) < x) k++;
  const x0 = xs[k] ?? NaN;
  const x1 = xs[k + 1] ?? NaN;
  return (ys[k] ?? NaN) + (((ys[k + 1] ?? NaN) - (ys[k] ?? NaN)) * (x - x0)) / (x1 - x0);
};
const peakAt = (run: Run, r: number): number =>
  between(
    run.cells.map((c) => c[0]),
    run.cells.map((c) => c[1]),
    r
  );
const probeAt = (run: Run, r: number, key: 'foot' | 'impulse'): number =>
  between(
    run.probes.map((p) => p.r),
    run.probes.map((p) => p[key]),
    r
  );
/** Rule 1256 (c) with rule 1318 (d): value, band, order from three grids. */
function converge(v: number[]): { value: number; band: number; order: number | null } {
  const [r1, r2, r3] = v as [number, number, number];
  const d1 = r1 - r2;
  const d2 = r2 - r3;
  const p = d1 * d2 > 0 ? Math.log2(d1 / d2) : NaN;
  if (p >= 1) return { value: r3 + (r3 - r2) / (2 ** p - 1), band: 0, order: p };
  return {
    value: r3,
    band: Math.max(r1, r2, r3) - Math.min(r1, r2, r3),
    order: Number.isFinite(p) ? p : null,
  };
}

const runsBy = (radius: number, eos = 'air'): Run[] | null => {
  const runs = GRIDS.map((dr) => load(dr, radius, eos));
  return runs.every((r) => r !== null) ? runs : null;
};

/** The readings of a source for a share f_b. */
function readings(runs: Run[], fb: number) {
  const s = Math.cbrt(fb);
  const c1 = C1_RANGES.map((r) => {
    const conv = converge(runs.map((run) => peakAt(run, r / s)));
    const want = standard(r);
    return {
      r,
      standard: want,
      brode33: brode33(r),
      model: conv.value,
      band: conv.band,
      order: conv.order,
      off: conv.value / want - 1,
      within: Math.abs(conv.value / want - 1) + conv.band / want <= C1_TOLERANCE,
    };
  });
  const c2 = C2_RANGES.filter((r) => standard(r) >= 480 && standard(r) <= 119e6).map((r) => {
    const conv = converge(runs.map((run) => probeAt(run, r / s, 'foot') * s));
    const want = brode40(r);
    return {
      r,
      brode40: want,
      model: conv.value,
      band: conv.band,
      order: conv.order,
      off: conv.value / want - 1,
      within: Math.abs(conv.value / want - 1) + conv.band / want <= C2_TOLERANCE,
    };
  });
  const c3 = C1_RANGES.map((r) => {
    const conv = converge(runs.map((run) => probeAt(run, r / s, 'impulse') * s));
    return {
      r,
      brode: brode48(r),
      model: conv.value,
      band: conv.band,
      off: conv.value / brode48(r) - 1,
    };
  });
  const reported = REPORTED.map((r) => {
    const conv = converge(runs.map((run) => peakAt(run, r / s)));
    return {
      r,
      standard: standard(r),
      model: conv.value,
      band: conv.band,
      off: conv.value / standard(r) - 1,
    };
  });
  return { c1, c2, c3, reported };
}

const central = runsBy(CENTRAL);
if (central === null)
  throw new Error('C1: the central source has not run on the three finest grids');
const main = readings(central, fbCentral);
const c1Pass = main.c1.every((x) => x.within);
const c2Pass = main.c2.every((x) => x.within);
const beyond = Math.max(...central.map((r) => r.beyondShareMax));
const undetermined = beyond > 0.01;

// CONSISTENT: one pair (f_b, source) within their intervals for every range.
const others = SOURCES.map((radius) => ({ radius, runs: runsBy(radius) }));
let c1Consistent: { fb: number; radius: number } | null = null;
let c2Consistent: { fb: number; radius: number } | null = null;
// A pair found among the sources already run settles CONSISTENT; FAILS
// needs every source run.
const scanned = others.every((o) => o.runs !== null);
for (const o of others)
  if (o.runs !== null)
    for (let k = 0; k <= 100; k++) {
      const fb = fbLow + ((fbHigh - fbLow) * k) / 100;
      const r = readings(o.runs, fb);
      if (c1Consistent === null && r.c1.every((x) => x.within))
        c1Consistent = { fb, radius: o.radius };
      if (c2Consistent === null && r.c2.every((x) => x.within))
        c2Consistent = { fb, radius: o.radius };
    }
// The shares of the interval that bring C1, C2, or both within, per source.
const windows = others
  .filter((o) => o.runs !== null)
  .map((o) => {
    const ok = { c1: [] as number[], c2: [] as number[], both: [] as number[] };
    for (let k = 0; k <= 100; k++) {
      const fb = fbLow + ((fbHigh - fbLow) * k) / 100;
      const r = readings(o.runs ?? [], fb);
      const a = r.c1.every((x) => x.within);
      const b = r.c2.every((x) => x.within);
      if (a) ok.c1.push(fb);
      if (b) ok.c2.push(fb);
      if (a && b) ok.both.push(fb);
    }
    const span = (v: number[]): [number, number] | null =>
      v.length === 0 ? null : [Math.min(...v), Math.max(...v)];
    return { radius: o.radius, c1: span(ok.c1), c2: span(ok.c2), both: span(ok.both) };
  });
console.log('shares that bring the readings within, per source:', JSON.stringify(windows));

// Rule 1351 (c): the sources' spread at each range (the converged peaks at the
// central share, largest less smallest over the central source's), and real
// air's effect (real air over the ideal gas, the central source and share).
const available = others.filter((o) => o.runs !== null);
const spread = C1_RANGES.map((r) => {
  const peaks = available.map(
    (o) => readings(o.runs ?? [], fbCentral).c1.find((x) => x.r === r)?.model ?? NaN
  );
  const mid = main.c1.find((x) => x.r === r)?.model ?? NaN;
  return {
    r,
    sources: available.map((o) => o.radius),
    spread: (Math.max(...peaks) - Math.min(...peaks)) / mid,
  };
});
const idealRuns = runsBy(CENTRAL, 'ideal');
const realAir =
  idealRuns === null
    ? null
    : readings(idealRuns, fbCentral).c1.map((x) => {
        const air = main.c1.find((y) => y.r === x.r)?.model ?? NaN;
        return { r: x.r, airOverIdeal: air / x.model };
      });
for (const x of spread)
  console.log(
    `sources ${x.sources.join('/')} m at ${String(x.r)} m: spread ${(x.spread * 100).toFixed(1)} % of the central`
  );
if (realAir !== null)
  for (const x of realAir)
    console.log(`real air over the ideal gas at ${String(x.r)} m: ${x.airOverIdeal.toFixed(3)}`);

const verdict = (pass: boolean, consistent: object | null): string =>
  undetermined
    ? 'UNDETERMINED'
    : pass
      ? 'PASSES'
      : consistent !== null
        ? 'CONSISTENT'
        : scanned
          ? 'FAILS'
          : 'NOT YET CONSISTENT (sources still to run)';

const pct = (x: number): string => `${(x * 100).toFixed(1)} %`;
console.log(
  `N&C's constants: assignment ${fit.perm.join(',')} (${fit.cgs ? 'cgs' : 'MKS'}); f_b central ${fbCentral.toFixed(3)}, interval ${fbLow.toFixed(3)}–${fbHigh.toFixed(3)}; beyond Z_h at most ${pct(beyond)} of W`
);
for (const x of main.c1)
  console.log(
    `C1 ${String(x.r)} m: model ${(x.model / 1e3).toFixed(2)} kPa (band ${(x.band / 1e3).toFixed(2)}, order ${x.order?.toFixed(2) ?? '—'}), N&C ${(x.standard / 1e3).toFixed(2)}, B87 ${(x.brode33 / 1e3).toFixed(2)}: ${pct(x.off)} — ${x.within ? 'within' : 'beyond'}`
  );
for (const x of main.c2)
  console.log(
    `C2 ${String(x.r)} m: model ${(x.model * 1e3).toFixed(2)} ms (band ${(x.band * 1e3).toFixed(3)}), B87 Eq. 40 ${(x.brode40 * 1e3).toFixed(2)} ms: ${pct(x.off)} — ${x.within ? 'within' : 'beyond'}`
  );
for (const x of main.c3)
  console.log(
    `C3 ${String(x.r)} m: model ${x.model.toFixed(1)} Pa s, B87 ${x.brode.toFixed(1)}: ${pct(x.off)}`
  );
for (const x of main.reported)
  console.log(
    `(reported) ${String(x.r)} m: model ${(x.model / 1e3).toFixed(1)} kPa, N&C ${(x.standard / 1e3).toFixed(1)}: ${pct(x.off)}`
  );
console.log(`C1 ${verdict(c1Pass, c1Consistent)}; C2 ${verdict(c2Pass, c2Consistent)}`);
writeFileSync(
  'src/physics/validation/verifyBlastC1.json',
  `${JSON.stringify(
    {
      rule: '1333 (c), 1349',
      ncAssignment: { perm: fit.perm, cgs: fit.cgs },
      fb: { central: fbCentral, low: fbLow, high: fbHigh },
      beyondShareMax: beyond,
      central: main,
      consistent: { scanned, c1: c1Consistent, c2: c2Consistent, windows },
      spread,
      realAir,
      c1: verdict(c1Pass, c1Consistent),
      c2: verdict(c2Pass, c2Consistent),
    },
    null,
    2
  )}\n`
);
