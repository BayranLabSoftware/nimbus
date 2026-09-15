/**
 * The statistics of the benchmark protocol (docs/BENCHMARK_PROTOCOL.md,
 * "Metrics and acceptance"), shared by every track.
 */

export type ComparisonClass = 'A' | 'B' | 'C';

export interface Pair {
  track: string;
  quantity: string;
  cls: ComparisonClass;
  caseId: string;
  source: 'preset' | 'custom';
  /** The scorecard's size band of the case (validation/scorecard.ts), where the family has one. */
  band?: string;
  /** What else identifies the pair within the case (a distance, a threshold). */
  detail: string;
  /** A grouping within the quantity the statistics are also given for (a distance, a threshold). */
  bin?: string;
  nimbus: number | null;
  reference: number | null;
  /** Relative half-width of the rounding the reference printed its value with. */
  resolution?: number;
  /** A yes/no quantity: the two sides agree or they do not. */
  categorical?: boolean;
  /** Why a pair has no ratio, when it has none. */
  note?: string;
}

export interface Worst {
  caseId: string;
  detail: string;
  nimbus: number;
  reference: number;
  ratio: number;
}

export interface QuantityStats {
  track: string;
  quantity: string;
  cls: ComparisonClass;
  /** 'all', 'preset', 'custom', 'band: <label>' or 'bin: <label>'. */
  subset: string;
  rows: number;
  pairs: number;
  bothZero: number;
  /** Rows with no ratio, by reason. */
  unpaired: Record<string, number>;
  geometricMeanRatio: number | null;
  scatterLn: number | null;
  medianAbsLn: number | null;
  maxRelative: number | null;
  within1pct: number | null;
  /** Class A: within 1 % plus the reference's printed rounding. */
  withinTolerance: number | null;
  within125: number | null;
  within2: number | null;
  within10: number | null;
  /** Categorical quantities: the share of rows where the two sides agree. */
  agreement: number | null;
  flagged: boolean;
  worst: Worst[];
}

const finitePositive = (x: number | null): x is number => x !== null && Number.isFinite(x) && x > 0;

function unpairedReason(p: Pair): string {
  if (p.note !== undefined) return p.note;
  if (p.nimbus === null || !Number.isFinite(p.nimbus)) return 'Nimbus gives no value';
  if (p.reference === null || !Number.isFinite(p.reference)) return 'the reference gives no value';
  if (p.nimbus <= 0) return 'Nimbus zero';
  return 'reference zero';
}

function statsOf(rows: readonly Pair[], subset: string): QuantityStats {
  const first = rows[0];
  if (first === undefined) throw new Error(`no rows for ${subset}`);
  const cls = first.cls;
  if (first.categorical === true) {
    const agree = rows.filter((p) => p.nimbus === p.reference).length;
    return {
      track: first.track,
      quantity: first.quantity,
      cls,
      subset,
      rows: rows.length,
      pairs: rows.length,
      bothZero: 0,
      unpaired: {},
      geometricMeanRatio: null,
      scatterLn: null,
      medianAbsLn: null,
      maxRelative: null,
      within1pct: null,
      withinTolerance: null,
      within125: null,
      within2: null,
      within10: null,
      agreement: agree / rows.length,
      flagged: agree < rows.length,
      worst: [],
    };
  }
  const paired = rows.filter((p) => finitePositive(p.nimbus) && finitePositive(p.reference));
  const zeroOrAbsent = (x: number | null): boolean => x === null || x === 0;
  const bothZero = rows.filter(
    (p) => p.note === undefined && zeroOrAbsent(p.nimbus) && zeroOrAbsent(p.reference)
  ).length;
  const unpaired: Record<string, number> = {};
  for (const p of rows) {
    if (paired.includes(p)) continue;
    if (p.note === undefined && zeroOrAbsent(p.nimbus) && zeroOrAbsent(p.reference)) continue;
    const reason = unpairedReason(p);
    unpaired[reason] = (unpaired[reason] ?? 0) + 1;
  }
  const value = (x: number | null): number => x ?? Number.NaN;
  const ratio = (p: Pair): number => value(p.nimbus) / value(p.reference);
  const lns = paired.map((p) => Math.log(ratio(p)));
  const n = lns.length;
  const mean = n > 0 ? lns.reduce((a, b) => a + b, 0) / n : null;
  const sd =
    mean !== null && n > 1
      ? Math.sqrt(lns.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1))
      : null;
  const abs = lns.map(Math.abs).sort((a, b) => a - b);
  const median =
    n === 0
      ? null
      : n % 2 === 1
        ? (abs[(n - 1) / 2] ?? null)
        : ((abs[n / 2 - 1] ?? 0) + (abs[n / 2] ?? 0)) / 2;
  const share = (limit: number): number | null =>
    n === 0 ? null : lns.filter((l) => Math.abs(l) <= Math.log(limit)).length / n;
  const relative = paired.map((p) => Math.abs(ratio(p) - 1));
  const maxRelative = n === 0 ? null : Math.max(...relative);
  const inTolerance = paired.filter(
    (p, i) => (relative[i] ?? Number.POSITIVE_INFINITY) <= 0.01 + (p.resolution ?? 0)
  ).length;
  const worst = paired
    .map((p) => ({
      caseId: p.caseId,
      detail: p.detail,
      nimbus: value(p.nimbus),
      reference: value(p.reference),
      ratio: ratio(p),
    }))
    .sort((a, b) => Math.abs(Math.log(b.ratio)) - Math.abs(Math.log(a.ratio)))
    .slice(0, 5);
  const gm = mean === null ? null : Math.exp(mean);
  const flagged =
    n > 0 &&
    (cls === 'A'
      ? inTolerance < n
      : cls === 'B'
        ? (median ?? 0) > Math.log(1.25)
        : gm !== null && (gm > 2 || gm < 0.5));
  return {
    track: first.track,
    quantity: first.quantity,
    cls,
    subset,
    rows: rows.length,
    pairs: n,
    bothZero,
    unpaired,
    geometricMeanRatio: gm,
    scatterLn: sd,
    medianAbsLn: median,
    maxRelative,
    within1pct: share(1.01),
    withinTolerance: n === 0 ? null : inTolerance / n,
    within125: share(1.25),
    within2: share(2),
    within10: share(10),
    agreement: null,
    flagged,
    worst,
  };
}

/** Every quantity of the pairs, for all cases, presets, custom cases, each size band and each bin. */
export function summarise(pairs: readonly Pair[]): QuantityStats[] {
  const keys = [...new Set(pairs.map((p) => `${p.track}\u0000${p.quantity}`))];
  const out: QuantityStats[] = [];
  for (const key of keys) {
    const [track, quantity] = key.split('\u0000');
    const group = pairs.filter((p) => p.track === track && p.quantity === quantity);
    out.push(statsOf(group, 'all'));
    for (const source of ['preset', 'custom'] as const) {
      const rows = group.filter((p) => p.source === source);
      if (rows.length > 0) out.push(statsOf(rows, source));
    }
    for (const [key, prefix] of [
      ['band', 'band'],
      ['bin', 'bin'],
    ] as const) {
      const labels = [
        ...new Set(group.map((p) => p[key]).filter((b): b is string => b !== undefined)),
      ];
      for (const label of labels) {
        out.push(
          statsOf(
            group.filter((p) => p[key] === label),
            `${prefix}: ${label}`
          )
        );
      }
    }
  }
  return out;
}

/**
 * The relative half-width of the rounding a printed value carries: a
 * value read as 3.1 × 10²⁰ was printed to two significant figures, so it
 * stands for anything within ±0.05 × 10²⁰. Never fewer than `minDigits`
 * significant figures are assumed, since trailing zeros may be printed
 * digits.
 */
export function printedResolution(x: number | null | undefined, minDigits = 2): number {
  if (x === null || x === undefined || !Number.isFinite(x) || x === 0) return 0;
  const mantissa = Math.abs(x)
    .toPrecision(15)
    .split('e')[0]
    ?.replace('.', '')
    .replace(/^0+/, '')
    .replace(/0+$/, '');
  const digits = Math.max(minDigits, mantissa?.length ?? minDigits);
  const exponent = Math.floor(Math.log10(Math.abs(x)));
  return (0.5 * 10 ** (exponent - digits + 1)) / Math.abs(x);
}

export function printStats(stats: readonly QuantityStats[]): void {
  const f = (x: number | null, d = 3): string => (x === null ? '—' : x.toFixed(d));
  for (const s of stats.filter((x) => x.subset === 'all')) {
    const unpaired = Object.entries(s.unpaired)
      .map(([k, v]) => `${k}: ${v.toString()}`)
      .join('; ');
    console.log(
      `${s.track} ${s.quantity.padEnd(30)} ${s.cls} n=${String(s.pairs).padStart(4)}/${String(s.rows).padStart(4)} ` +
        (s.agreement !== null
          ? `agree=${f(s.agreement)}`
          : `gm=${f(s.geometricMeanRatio)} σ=${f(s.scatterLn)} med|ln|=${f(s.medianAbsLn)} tol=${f(s.withinTolerance, 2)} ×1.25=${f(s.within125, 2)} ×2=${f(s.within2, 2)}`) +
        `${s.flagged ? ' FLAG' : ''}${unpaired === '' ? '' : ` [${unpaired}]`}`
    );
  }
}
