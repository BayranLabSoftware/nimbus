import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MINIMUM_ROWS_WITH_PAGER,
  PUBLISHED_RULE_11_TOLL,
  meetsE3Scatter,
} from '../../src/physics/validation/pagerScatterRules.js';
import {
  RULE_EARTHQUAKES,
  ruleEarthquakeEvent,
  ruleSiteVs30,
} from '../../src/physics/validation/heldOutByRule.js';
import { compareWithRecord } from '../../src/physics/validation/recordedTolls.js';
import {
  isInformative,
  scoreStats,
  type ScoreRowInput,
} from '../../src/physics/validation/scorecard.js';
import { PAGER_COUNTRIES } from '../../src/physics/pagerCountries.js';

/**
 * Rules 215 to 219 of src/physics/validation/pagerScatterRules.ts, run: our
 * central toll and PAGER's own published estimate beside the same NCEI record,
 * on the rows rule 11's set holds out, read with the report's own statistic.
 *
 *   pnpm exec tsx scripts/benchmark/pager-scatter.ts <pager.jsonl> [<out.json>]
 *
 * The jsonl is what scripts/benchmark/pager-bench.ts writes.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const jsonl = process.argv[2];
if (jsonl === undefined) {
  console.error('usage: pager-scatter.ts <pager.jsonl> [<out.json>]');
  process.exit(2);
}

interface Losses {
  empirical_fatality?: { total_fatalities?: number };
  empirical_economic?: unknown;
}
interface PagerRow {
  comcat: string;
  status: string;
  alertlevel?: string | null;
  losses?: Losses | null;
}

const pager = new Map<string, PagerRow>();
for (const line of readFileSync(jsonl, 'utf8').split('\n')) {
  if (line.trim() === '') continue;
  const row = JSON.parse(line) as PagerRow;
  pager.set(row.comcat, row);
}
console.log(`${pager.size.toString()} PAGER rows read`);

interface Row {
  name: string;
  comcat: string;
  date: string;
  magnitude: number;
  record: number;
  ours: number;
  pager: number | null;
  why: string | null;
  gnorm: number | null;
}

const rows: Row[] = [];
for (const q of RULE_EARTHQUAKES) {
  if (q.role !== 'heldOut') continue;
  const result = compareWithRecord(ruleEarthquakeEvent(q.row, { vs30: ruleSiteVs30(q.row) }));
  const p = pager.get(q.row.comcat);
  const total = p?.losses?.empirical_fatality?.total_fatalities;
  rows.push({
    name: q.event.name,
    comcat: q.row.comcat,
    date: q.row.date,
    magnitude: q.row.magnitude,
    record: q.event.recordedDeaths,
    ours: result.deaths,
    pager: typeof total === 'number' ? total : null,
    why:
      p === undefined
        ? 'not fetched'
        : p.status !== 'ok'
          ? p.status
          : typeof total === 'number'
            ? null
            : 'no fatality estimate',
    gnorm: null,
  });
}
console.log(`${rows.length.toString()} held-out rows of rule 11`);

/**
 * Rule 217: one set of rows for both columns — and that has to mean the rows
 * `scoreStats` actually scores, not the rows handed to it. The statistic only
 * uses a row where the record and the model are both above zero, so handing it
 * every row PAGER answers reads the two columns on two different sets: on the
 * first run of this script ours was scored on 64 rows and PAGER's on 55, which
 * is not a comparison. The set is therefore the intersection — a record above
 * zero and both models above zero — and what each column loses to the other is
 * counted and printed.
 */
const answered = rows.filter((r) => r.why === null && r.pager !== null);
const shared = answered.filter((r) => r.record > 0 && r.ours > 0 && (r.pager ?? 0) > 0);
const onlyOurs = answered.filter((r) => r.record > 0 && r.ours > 0 && (r.pager ?? 0) <= 0);
const onlyPager = answered.filter((r) => r.record > 0 && r.ours <= 0 && (r.pager ?? 0) > 0);
const missing = rows.filter((r) => r.why !== null);

const scoreRow = (r: Row, model: number): ScoreRowInput => ({
  name: r.name,
  quantity: 'toll',
  family: 'earthquake',
  size: r.magnitude,
  role: 'heldOut',
  record: r.record,
  model,
  inside: false,
  bandDecades: null,
});
const asScoreRows = (pick: (r: Row) => number): ScoreRowInput[] =>
  shared.map((r) => scoreRow(r, pick(r)));

const ourAll = scoreStats(rows.map((r) => scoreRow(r, r.ours)));
const ours = scoreStats(asScoreRows((r) => r.ours));
const theirs = scoreStats(asScoreRows((r) => r.pager ?? 0));

const informative = rows.filter((r) => isInformative(scoreRow(r, r.ours))).length;

/** Rule 218(a), read from the report itself rather than from a copy of it:
 *  the cell the report regenerates for exactly these rows. */
const published = (
  JSON.parse(readFileSync(resolve(ROOT, 'docs/VALIDATION_REPORT.json'), 'utf8')) as {
    calibration: {
      byRule: {
        earthquakes: {
          cells: { all: { rows: number; scored: number; bias: number; scatterLn: number } }[];
        };
      };
    };
  }
).calibration.byRule.earthquakes.cells[0]?.all;
const guardA =
  published !== undefined &&
  ourAll.bias !== null &&
  ourAll.scatterLn !== null &&
  ourAll.scored === published.scored &&
  rows.length === published.rows &&
  Math.abs(ourAll.bias - published.bias) < 0.001 &&
  Math.abs(ourAll.scatterLn - published.scatterLn) < 0.005;
const guardB = answered.length >= MINIMUM_ROWS_WITH_PAGER;
const decided =
  guardA && guardB && ours.scatterLn !== null && theirs.scatterLn !== null
    ? meetsE3Scatter(ours.scatterLn, theirs.scatterLn)
    : null;

const out = {
  track: 'E3',
  readOn: '2026-09-19',
  rows: rows.length,
  informative,
  answered: answered.length,
  shared: shared.length,
  scoredByOursOnly: onlyOurs.length,
  scoredByPagerOnly: onlyPager.length,
  missing: missing.map((r) => ({ comcat: r.comcat, name: r.name, why: r.why })),
  ourColumnOnEveryRow: { bias: ourAll.bias, scatterLn: ourAll.scatterLn, scored: ourAll.scored },
  onSharedRows: {
    ours: { bias: ours.bias, scatterLn: ours.scatterLn, scored: ours.scored },
    pager: { bias: theirs.bias, scatterLn: theirs.scatterLn, scored: theirs.scored },
  },
  guards: { reproducesPublished: guardA, hundredRows: guardB },
  e3ScatterMet: decided,
  /** Rule 216, beside and deciding nothing: how wide PAGER says its own answer
   *  is, across the countries this project carries. */
  gnormRange: [
    Math.min(...Object.values(PAGER_COUNTRIES).map((c) => c.g)),
    Math.max(...Object.values(PAGER_COUNTRIES).map((c) => c.g)),
  ],
  perRow: shared.map((r) => ({
    comcat: r.comcat,
    date: r.date,
    magnitude: r.magnitude,
    record: r.record,
    ours: r.ours,
    pager: r.pager,
  })),
};

const f = (x: number | null, d = 3): string => (x === null ? '—' : x.toFixed(d));
console.log(
  `\nour column on every held-out row: bias ${f(ourAll.bias, 2)}×, σ_ln ${f(ourAll.scatterLn, 2)} on ${ourAll.scored.toString()} scored rows`
);
console.log(
  `published, for the guard: ${PUBLISHED_RULE_11_TOLL.bias.toFixed(2)}×, σ_ln ${PUBLISHED_RULE_11_TOLL.scatterLn.toFixed(2)}`
);
console.log(
  `\n${answered.length.toString()} rows carry a PAGER estimate (${missing.length.toString()} do not). The statistic scores a row only where the record and the model are both above zero, so both columns are read on the ${shared.length.toString()} rows where that holds for both — ${onlyOurs.length.toString()} more are scored by ours alone, ${onlyPager.length.toString()} by PAGER's alone:`
);
console.log(
  `  Nimbus: bias ${f(ours.bias, 3)}×, σ_ln ${f(ours.scatterLn)} on ${ours.scored.toString()} scored`
);
console.log(
  `  PAGER : bias ${f(theirs.bias, 3)}×, σ_ln ${f(theirs.scatterLn)} on ${theirs.scored.toString()} scored`
);
console.log(
  `\nguards: reproduces the published column ${String(guardA)}; a hundred rows ${String(guardB)}`
);
console.log(
  `E3's scatter clause: ${decided === null ? 'not read (a guard failed)' : decided ? 'MET' : 'not met'}`
);
const why = new Map<string, number>();
for (const r of missing) why.set(r.why ?? '', (why.get(r.why ?? '') ?? 0) + 1);
for (const [reason, n] of [...why].sort((a, b) => b[1] - a[1]))
  console.log(`  ${n.toString()} rows left out: ${reason}`);

const target = process.argv[3];
if (target !== undefined) {
  writeFileSync(resolve(ROOT, target), `${JSON.stringify(out, null, 1)}\n`);
  console.log(`\nwrote ${target}`);
}
