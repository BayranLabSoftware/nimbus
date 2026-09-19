/**
 * Rules 370 to 376 of `src/physics/validation/interfaceLawRules.ts`: Parker
 * et al. 2022 on the rows the slab calls an interface, WITHOUT Strasser's
 * rupture — the configuration rule 38 never saw.
 *
 *   pnpm exec tsx scripts/benchmark/interface-law.ts
 *
 * One run, both laws, no re-tuning. What decides is rule 19 as rule 38
 * applies it, unchanged and not written for this round:
 *
 *   (a) mean absolute log bias over the three magnitude cells no larger than
 *       the shipped law's, and
 *   (b) the band holds at least eight records in ten, among the rows with
 *       something, IN EVERY CELL.
 *
 * plus rule 25's clause: no larger a share of rule 23's quiet earthquakes
 * raised to a median toll of ten.
 *
 * Rule 19's cells are read on the rows the law actually reaches — the
 * interface rows — and printed over all 408 as well, because a law that
 * fixed its own rows by breaking the others would pass a test read only on
 * its own.
 */

import { writeFileSync } from 'node:fs';
import {
  RULE_EARTHQUAKES,
  RULE_EARTHQUAKES_INTERFACE_LAW,
  type RuleEarthquake,
} from '../../src/physics/validation/heldOutByRule.js';
import { compareWithRecord, centralEstimate } from '../../src/physics/validation/recordedTolls.js';
import { shippedStrikeAnswer } from '../../src/physics/validation/shippedFaults.js';
import {
  isInformative,
  scoreStats,
  type ScoreRowInput,
} from '../../src/physics/validation/scorecard.js';
import { BAND_HOLDS_AT_LEAST } from '../../src/physics/validation/interfaceLawRules.js';
import { UNSEEN_EARTHQUAKES } from '../../src/physics/validation/unseenSetData.js';
import { unseenEarthquakeEvent } from '../../src/physics/validation/unseenSet.js';
import { isQuiet } from '../../src/physics/validation/depthRules.js';
import { drawingTheInterfaceLaw } from '../../src/physics/validation/recordedTolls.js';

const CELLS: { label: string; lo: number; hi: number }[] = [
  { label: 'Mw < 6.5', lo: 0, hi: 6.5 },
  { label: 'Mw 6.5-7.5', lo: 6.5, hi: 7.5 },
  { label: 'Mw >= 7.5', lo: 7.5, hi: 99 },
];

function scoreOf(quake: RuleEarthquake): ScoreRowInput {
  const toll = compareWithRecord(quake.event);
  return {
    name: quake.event.name,
    quantity: 'toll',
    family: 'earthquake',
    size: quake.row.magnitude,
    role: quake.role,
    record: quake.event.recordedDeaths,
    model: toll.deaths,
    inside: toll.contains,
    bandDecades: Math.log10(Math.max(toll.high, 1) / Math.max(toll.low, 1)),
    bandHigh: toll.high,
  };
}

interface CellRead {
  label: string;
  withSomething: number;
  bias: number | null;
  scatterLn: number | null;
  inside: number;
  share: number | null;
}

function read(rows: readonly ScoreRowInput[], label: string): CellRead {
  const informative = rows.filter((r) => isInformative(r));
  const s = scoreStats(informative);
  return {
    label,
    withSomething: informative.length,
    bias: s.bias,
    scatterLn: s.scatterLn,
    inside: s.inside,
    share: informative.length === 0 ? null : s.inside / informative.length,
  };
}

const fmt = (x: number | null, d = 2): string => (x === null ? '—' : x.toFixed(d));
const absLn = (b: number | null): number | null => (b === null ? null : Math.abs(Math.log(b)));

/** Rule 19(a): the mean of |ln bias| over the cells that have one. */
function meanAbsLogBias(cells: readonly CellRead[]): number | null {
  const xs = cells.map((c) => absLn(c.bias)).filter((x): x is number => x !== null);
  return xs.length === 0 ? null : xs.reduce((a, b) => a + b, 0) / xs.length;
}

function main(): void {
  console.log('Rules 370 to 376 — Parker et al. 2022 without Strasser.\n');

  const shipped = RULE_EARTHQUAKES.map((q) => scoreOf(q));
  const candidate = RULE_EARTHQUAKES_INTERFACE_LAW.map((q) => scoreOf(q));

  // Which rows the law reaches.
  const onInterface: boolean[] = RULE_EARTHQUAKES.map((quake) => {
    const r = quake.event.run();
    if (r.type !== 'earthquake') return false;
    return shippedStrikeAnswer(
      quake.row.latitude,
      quake.row.longitude,
      quake.row.depthKm * 1_000,
      r.data.ruptureLength
    ).source.startsWith('interface');
  });
  const interfaceRows = onInterface.filter(Boolean).length;
  console.log(
    `rows the law reaches: ${interfaceRows.toString()} of ${shipped.length.toString()}\n`
  );

  const pick = (
    scores: readonly ScoreRowInput[],
    only: 'interface' | 'rest' | 'all',
    cellIndex: number
  ): ScoreRowInput[] =>
    scores.filter((s, i) => {
      const c = CELLS[cellIndex];
      if (c === undefined) return false;
      if (s.size < c.lo || s.size >= c.hi) return false;
      if (only === 'all') return true;
      return only === 'interface' ? onInterface[i] === true : onInterface[i] !== true;
    });

  const results: Record<string, unknown> = {};
  for (const scope of ['interface', 'all'] as const) {
    const only = scope === 'interface' ? 'interface' : 'all';
    const before: CellRead[] = [];
    const after: CellRead[] = [];
    console.log(
      `\n=== rule 19, on the ${scope === 'interface' ? 'INTERFACE rows' : 'WHOLE set'} ===\n`
    );
    console.log(
      '  cell          shipped bias   candidate bias   shipped inside   candidate inside'
    );
    for (const [index, c] of CELLS.entries()) {
      const b = read(pick(shipped, only, index), c.label);
      const a = read(pick(candidate, only, index), c.label);
      before.push(b);
      after.push(a);
      console.log(
        `  ${c.label.padEnd(12)} ${`${fmt(b.bias)}x`.padStart(12)} ${`${fmt(a.bias)}x`.padStart(16)}` +
          `   ${`${b.inside.toString()}/${b.withSomething.toString()}`.padStart(14)}` +
          `   ${`${a.inside.toString()}/${a.withSomething.toString()}`.padStart(16)}`
      );
    }
    const mb = meanAbsLogBias(before);
    const ma = meanAbsLogBias(after);
    const biasOk = mb !== null && ma !== null && ma <= mb;
    const failing = after.filter((c) => c.share !== null && c.share < BAND_HOLDS_AT_LEAST);
    console.log(
      `\n  19(a) mean |ln bias| : ${fmt(mb, 3)} -> ${fmt(ma, 3)}  ${biasOk ? 'MET' : 'NOT MET'}`
    );
    console.log(
      `  19(b) eight in ten   : ${failing.length === 0 ? 'MET' : `NOT MET in ${failing.map((c) => `${c.label} (${fmt((c.share ?? 0) * 100, 0)} %)`).join(', ')}`}`
    );
    results[scope] = {
      before,
      after,
      meanAbsLogBias: { before: mb, after: ma },
      biasOk,
      failing: failing.map((c) => c.label),
    };
  }

  // Rule 25: the quiet earthquakes of rule 23.
  const quiet = UNSEEN_EARTHQUAKES.filter((row) => isQuiet(row));
  let raisedShipped = 0;
  let raisedCandidate = 0;
  for (const row of quiet) {
    const plain = unseenEarthquakeEvent(row);
    const withLaw = drawingTheInterfaceLaw(plain);
    if ((centralEstimate(plain)?.deaths ?? 0) >= 10) raisedShipped += 1;
    if ((centralEstimate(withLaw)?.deaths ?? 0) >= 10) raisedCandidate += 1;
  }
  const shareShipped = quiet.length === 0 ? 0 : raisedShipped / quiet.length;
  const shareCandidate = quiet.length === 0 ? 0 : raisedCandidate / quiet.length;
  console.log(`\n=== rule 25, the quiet earthquakes ===\n`);
  console.log(`  ${quiet.length.toString()} quiet rows; raised to a median toll of ten:`);
  console.log(`    shipped   : ${raisedShipped.toString()} (${fmt(shareShipped * 100, 1)} %)`);
  console.log(`    candidate : ${raisedCandidate.toString()} (${fmt(shareCandidate * 100, 1)} %)`);
  const quietOk = shareCandidate <= shareShipped;
  console.log(`  rule 25 : ${quietOk ? 'MET' : 'NOT MET'}`);

  const interfaceScope = results.interface as { biasOk: boolean; failing: string[] };
  const adopted = interfaceScope.biasOk && interfaceScope.failing.length === 0 && quietOk;
  console.log(
    `\n\nRule 19 as rule 38 applies it: ${adopted ? 'the candidate REPLACES the shipped law' : 'the shipped law STAYS'}`
  );

  const out = 'benchmark/results/interface-law-2026-09-21.json';
  writeFileSync(
    out,
    `${JSON.stringify(
      {
        rules: '370 to 376',
        interfaceRows,
        scopes: results,
        quiet: { rows: quiet.length, raisedShipped, raisedCandidate, quietOk },
        adopted,
      },
      null,
      2
    )}\n`
  );
  console.log(`Wrote ${out}`);
}

main();
