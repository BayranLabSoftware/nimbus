/**
 * Rules 363 to 369 of `src/physics/validation/interfaceMarkRules.ts`: what it
 * costs to let Slab2 say an earthquake is a megathrust.
 *
 *   pnpm exec tsx scripts/benchmark/interface-mark.ts
 *
 * One run, three sides in one process, no re-tuning: `RULE_EARTHQUAKES` as
 * the report reads it today (rules 356 to 362, no mark), and the two
 * candidates of rule 364 — the one the moment tensor may refuse, and the one
 * the slab's geometry decides alone.
 *
 * Rule 367 is measured WHERE THE CHANGE ACTS: on the rows a candidate marks,
 * not over the whole cell, because a cell is mostly rows the candidate never
 * touched and their stillness would drown the signal. The rows it does NOT
 * mark are measured too, and rule 367(c) says they may not move at all.
 */

import { writeFileSync } from 'node:fs';
import {
  RULE_EARTHQUAKES,
  RULE_EARTHQUAKES_GEOMETRY_DECIDES,
  RULE_EARTHQUAKES_TENSOR_MAY_REFUSE,
  type RuleEarthquake,
} from '../../src/physics/validation/heldOutByRule.js';
import { compareWithRecord } from '../../src/physics/validation/recordedTolls.js';
import {
  isInformative,
  scoreStats,
  type ScoreRowInput,
} from '../../src/physics/validation/scorecard.js';
import {
  BIAS_TIE_DECIMALS,
  INTERFACE_MARK_ROWS,
} from '../../src/physics/validation/interfaceMarkRules.js';

interface Side {
  name: string;
  set: readonly RuleEarthquake[];
}

const SIDES: Side[] = [
  { name: 'tensorMayRefuse', set: RULE_EARTHQUAKES_TENSOR_MAY_REFUSE },
  { name: 'geometryDecides', set: RULE_EARTHQUAKES_GEOMETRY_DECIDES },
];

function scoreOf(quake: RuleEarthquake): {
  score: ScoreRowInput;
  contains: boolean;
  deaths: number;
} {
  const toll = compareWithRecord(quake.event);
  return {
    score: {
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
    },
    contains: toll.contains,
    deaths: toll.deaths,
  };
}

function cell(rows: readonly ScoreRowInput[]): {
  rows: number;
  withSomething: number;
  bias: number | null;
  scatterLn: number | null;
  inside: number;
} {
  const informative = rows.filter((r) => isInformative(r));
  const stats = scoreStats(informative);
  return {
    rows: rows.length,
    withSomething: informative.length,
    bias: stats.bias,
    scatterLn: stats.scatterLn,
    inside: stats.inside,
  };
}

const fmt = (x: number | null, d = 2): string => (x === null ? '—' : x.toFixed(d));
const absLn = (b: number | null): number | null => (b === null ? null : Math.abs(Math.log(b)));

function main(): void {
  console.log('Rules 363 to 369 — letting Slab2 say an earthquake is a megathrust.\n');
  console.log(`Rule 364 as written: ${JSON.stringify(INTERFACE_MARK_ROWS.geometryDecides)}`);
  console.log(
    `                     tensorMayRefuse ${INTERFACE_MARK_ROWS.tensorMayRefuse.all.toString()}\n`
  );

  // The side the report reads today, scored once and reused for both.
  const base = RULE_EARTHQUAKES.map((quake) => scoreOf(quake));

  const results: Record<string, unknown> = {};
  const verdicts: { name: string; met: boolean; absLnBias: number | null }[] = [];

  for (const side of SIDES) {
    const after = side.set.map((quake) => scoreOf(quake));
    const markedIndex: number[] = [];
    for (const [index, quake] of side.set.entries()) {
      const result = quake.event.run();
      if (result.type !== 'earthquake') continue;
      if (result.data.inputs.subductionInterface === true) markedIndex.push(index);
    }
    const isMarked = new Set(markedIndex);

    const markedBefore = base.filter((_, i) => isMarked.has(i)).map((r) => r.score);
    const markedAfter = after.filter((_, i) => isMarked.has(i)).map((r) => r.score);
    const restBefore = base.filter((_, i) => !isMarked.has(i)).map((r) => r.score);
    const restAfter = after.filter((_, i) => !isMarked.has(i)).map((r) => r.score);

    // Rule 367(c): the rows it does not mark may not move by one figure.
    let untouchedMoved = 0;
    for (const [i, b] of base.entries()) {
      if (isMarked.has(i)) continue;
      const a = after[i];
      if (a === undefined) continue;
      if (a.deaths !== b.deaths || a.score.bandHigh !== b.score.bandHigh) untouchedMoved += 1;
    }
    // Rule 367(a): no row that was inside its band falls outside it.
    const leavers: string[] = [];
    for (const [i, b] of base.entries()) {
      const a = after[i];
      if (a === undefined) continue;
      if (b.contains && !a.contains) leavers.push(b.score.name);
    }

    const mb = cell(markedBefore);
    const ma = cell(markedAfter);
    const rb = cell(restBefore);
    const ra = cell(restAfter);

    const biasHolds =
      absLn(mb.bias) !== null &&
      absLn(ma.bias) !== null &&
      (absLn(ma.bias) ?? 0) <= (absLn(mb.bias) ?? 0);
    const insideHolds = ma.inside >= mb.inside;
    const met = leavers.length === 0 && untouchedMoved === 0 && biasHolds && insideHolds;

    console.log(`\n=== ${side.name} — ${markedIndex.length.toString()} rows marked ===\n`);
    console.log(`  on the MARKED rows (where the change acts):`);
    console.log(
      `    with something : ${mb.withSomething.toString()} -> ${ma.withSomething.toString()}`
    );
    console.log(`    bias           : ${fmt(mb.bias)}x -> ${fmt(ma.bias)}x`);
    console.log(`    |ln bias|      : ${fmt(absLn(mb.bias), 3)} -> ${fmt(absLn(ma.bias), 3)}`);
    console.log(`    scatter        : ${fmt(mb.scatterLn)} -> ${fmt(ma.scatterLn)}`);
    console.log(
      `    inside         : ${mb.inside.toString()}/${mb.withSomething.toString()} -> ${ma.inside.toString()}/${ma.withSomething.toString()}`
    );
    console.log(`  on the rows it does NOT mark:`);
    console.log(`    bias           : ${fmt(rb.bias)}x -> ${fmt(ra.bias)}x (must not move)`);
    console.log(`    rows moved     : ${untouchedMoved.toString()}`);
    console.log(
      `\n  367(a) none left their band : ${leavers.length === 0 ? 'MET' : `NOT MET — ${leavers.join('; ')}`}`
    );
    console.log(`  367(b) bias on marked       : ${biasHolds ? 'MET' : 'NOT MET'}`);
    console.log(`  367(b) inside on marked     : ${insideHolds ? 'MET' : 'NOT MET'}`);
    console.log(`  367(c) unmarked unmoved     : ${untouchedMoved === 0 ? 'MET' : 'NOT MET'}`);
    console.log(`  ==> ${met ? 'SURVIVES' : 'OUT'}`);

    verdicts.push({ name: side.name, met, absLnBias: absLn(ma.bias) });
    results[side.name] = {
      marked: markedIndex.length,
      markedRows: { before: mb, after: ma },
      unmarkedRows: { before: rb, after: ra },
      untouchedMoved,
      leavers,
      met,
    };
  }

  // Rule 367(f): the choice.
  const survivors = verdicts.filter((v) => v.met);
  let winner = 'none';
  if (survivors.length === 1) winner = survivors[0]?.name ?? 'none';
  else if (survivors.length === 2) {
    const [a, b] = survivors as [(typeof survivors)[number], (typeof survivors)[number]];
    const ra = Number((a.absLnBias ?? Infinity).toFixed(BIAS_TIE_DECIMALS));
    const rb = Number((b.absLnBias ?? Infinity).toFixed(BIAS_TIE_DECIMALS));
    // A tie at two decimals goes to the narrower claim, which is (a).
    winner = ra === rb ? 'tensorMayRefuse' : ra < rb ? a.name : b.name;
  }
  console.log(`\n\nRule 367(f): survivors ${survivors.length.toString()}, adopted: ${winner}`);

  const out = 'benchmark/results/interface-mark-2026-09-21.json';
  writeFileSync(
    out,
    `${JSON.stringify({ rules: '363 to 369', winner, sides: results }, null, 2)}\n`
  );
  console.log(`Wrote ${out}`);
}

main();
