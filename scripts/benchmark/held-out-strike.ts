/**
 * Rules 342 to 348 of `src/physics/validation/heldOutStrikeRules.ts`: what it
 * costs to count rule 11's held-out earthquakes in the footprint the model
 * can already orient.
 *
 * One run, both sides, no re-tuning:
 *
 *   pnpm exec tsx scripts/benchmark/held-out-strike.ts
 *
 * The two sides are `RULE_EARTHQUAKES` (what the report reads today: no
 * strike, so rule 291's sweep) and `RULE_EARTHQUAKES_POINTED` (rule 344's
 * candidate: the lookup of rule 300, through the same decorator the
 * calibration net uses). Everything else — magnitude, depth, ground,
 * mechanism, law, rupture scaling — is identical, and
 * `heldOutStrike.test.ts` holds it so.
 *
 * Rule 346(c) says the cells below Mw 7.5 may not move by one figure, and
 * nothing there is an extended source, so those rows are compared on the
 * central estimate alone, which is cheap. The Mw >= 7.5 cell is the whole of
 * the change and is run with its band, on both sides, which is not.
 */

import { writeFileSync } from 'node:fs';
import {
  RULE_EARTHQUAKES,
  RULE_EARTHQUAKES_WITHOUT_STRIKE_LOOKUP,
} from '../../src/physics/validation/heldOutByRule.js';
import {
  centralEstimate,
  compareWithRecord,
  type RecordedEvent,
} from '../../src/physics/validation/recordedTolls.js';
import { shippedStrikeAnswer } from '../../src/physics/validation/shippedFaults.js';
import {
  isInformative,
  scoreStats,
  type ScoreRowInput,
} from '../../src/physics/validation/scorecard.js';
import { LOOKUP_ON_RULE_11_ROWS } from '../../src/physics/validation/heldOutStrikeRules.js';
import { ALIGNMENT_STOP_LN_BIAS } from '../../src/physics/validation/alignedHarnessRules.js';

const GREAT = 7.5;

function scoreOf(
  event: RecordedEvent,
  magnitude: number,
  role: 'tuned' | 'heldOut'
): ScoreRowInput {
  const toll = compareWithRecord(event);
  return {
    name: event.name,
    quantity: 'toll',
    family: 'earthquake',
    size: magnitude,
    role,
    record: event.recordedDeaths,
    model: toll.deaths,
    inside: toll.contains,
    bandDecades: Math.log10(Math.max(toll.high, 1) / Math.max(toll.low, 1)),
    bandHigh: toll.high,
  };
}

/** Rule 348's cell summary, in the report's own statistics. */
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

const fmt = (x: number | null, digits = 2): string => (x === null ? '—' : x.toFixed(digits));

function main(): void {
  const great = RULE_EARTHQUAKES_WITHOUT_STRIKE_LOOKUP.map((quake, index) => ({
    quake,
    pointed: RULE_EARTHQUAKES[index],
  })).filter((pair) => pair.quake.row.magnitude >= GREAT);

  console.log(`Rules 342 to 348 — rule 11's rows, counted where the model can point.\n`);
  console.log(`Rule 343 as written: ${JSON.stringify(LOOKUP_ON_RULE_11_ROWS.fromMw75)}\n`);

  // ---- Rule 346(c), and rules 358(b), (c) and (d) of alignedHarnessRules.ts,
  // over EVERY row. 358(d) cannot be read off a cell, because one row leaving
  // its band and another entering would cancel.
  let movedBelow = 0;
  let checkedBelow = 0;
  let bandsMovedBelow = 0;
  let leftTheirBand = 0;
  const leavers: string[] = [];
  for (const [index, quake] of RULE_EARTHQUAKES_WITHOUT_STRIKE_LOOKUP.entries()) {
    const pointed = RULE_EARTHQUAKES[index];
    if (pointed === undefined) continue;
    const b = compareWithRecord(quake.event);
    const a = compareWithRecord(pointed.event);
    if (b.contains && !a.contains) {
      leftTheirBand += 1;
      leavers.push(`${quake.event.name} (record ${quake.event.recordedDeaths.toString()})`);
    }
    if (quake.row.magnitude >= GREAT) continue;
    checkedBelow += 1;
    const beforeCentral = centralEstimate(quake.event)?.deaths ?? 0;
    const afterCentral = centralEstimate(pointed.event)?.deaths ?? 0;
    if (beforeCentral !== afterCentral) {
      movedBelow += 1;
      console.log(
        `  358(b) VIOLATED: ${quake.event.name}: ${beforeCentral.toString()} -> ${afterCentral.toString()}`
      );
    }
    if (b.low !== a.low || b.high !== a.high) bandsMovedBelow += 1;
  }
  console.log(
    `Rule 358(b): ${checkedBelow.toString()} rows below Mw ${GREAT.toString()}, ` +
      `${movedBelow.toString()} central estimates moved.\n` +
      `Rule 358(c): ${bandsMovedBelow.toString()} of those rows have a band that moved.\n` +
      `Rule 358(d): ${leftTheirBand.toString()} rows fell out of their band` +
      `${leavers.length === 0 ? '' : ` — ${leavers.join('; ')}`}.\n`
  );

  // ---- The cell that carries the change, with its band, on both sides.
  const rowsOut: Record<string, unknown>[] = [];
  const before: ScoreRowInput[] = [];
  const after: ScoreRowInput[] = [];
  console.log('Rule 348, row by row (Mw >= 7.5):\n');
  console.log(
    '  ' +
      'event'.padEnd(46) +
      'Mw'.padStart(5) +
      'source'.padStart(21) +
      'strike'.padStart(8) +
      'dead before'.padStart(13) +
      'after'.padStart(11) +
      'record'.padStart(9) +
      '  band'
  );
  for (const { quake, pointed } of great) {
    if (pointed === undefined) continue;
    const plain = quake.event.run();
    const answer = shippedStrikeAnswer(
      quake.row.latitude,
      quake.row.longitude,
      quake.row.depthKm * 1_000,
      plain.type === 'earthquake' ? plain.data.ruptureLength : 0
    );
    const b = scoreOf(quake.event, quake.row.magnitude, quake.role);
    const a = scoreOf(pointed.event, quake.row.magnitude, quake.role);
    before.push(b);
    after.push(a);
    const held = `${b.inside ? 'in' : 'OUT'}->${a.inside ? 'in' : 'OUT'}`;
    console.log(
      '  ' +
        quake.event.name.slice(0, 45).padEnd(46) +
        quake.row.magnitude.toFixed(1).padStart(5) +
        answer.source.padStart(21) +
        (answer.strikeDeg === null ? '—' : `${Math.round(answer.strikeDeg).toString()}°`).padStart(
          8
        ) +
        Math.round(b.model).toLocaleString('en-GB').padStart(13) +
        Math.round(a.model).toLocaleString('en-GB').padStart(11) +
        (b.record ?? 0).toLocaleString('en-GB').padStart(9) +
        `  ${held}`
    );
    rowsOut.push({
      event: quake.event.name,
      comcat: quake.row.comcat,
      magnitude: quake.row.magnitude,
      source: answer.source,
      strikeDeg: answer.strikeDeg,
      record: b.record,
      before: { model: b.model, inside: b.inside, bandDecades: b.bandDecades },
      after: { model: a.model, inside: a.inside, bandDecades: a.bandDecades },
    });
  }

  const cb = cell(before);
  const ca = cell(after);
  console.log(`\nRule 346(b), the Mw >= ${GREAT.toString()} cell:\n`);
  console.log(
    `  rows with something : ${cb.withSomething.toString()} -> ${ca.withSomething.toString()}`
  );
  console.log(`  bias                : ${fmt(cb.bias)}x -> ${fmt(ca.bias)}x`);
  console.log(
    `  |ln bias|           : ${fmt(cb.bias === null ? null : Math.abs(Math.log(cb.bias)), 3)} -> ${fmt(ca.bias === null ? null : Math.abs(Math.log(ca.bias)), 3)}`
  );
  console.log(`  scatter sigma_ln    : ${fmt(cb.scatterLn)} -> ${fmt(ca.scatterLn)}`);
  console.log(
    `  inside              : ${cb.inside.toString()}/${cb.withSomething.toString()} -> ${ca.inside.toString()}/${ca.withSomething.toString()}`
  );

  const biasOk =
    cb.bias !== null &&
    ca.bias !== null &&
    Math.abs(Math.log(ca.bias)) <= Math.abs(Math.log(cb.bias));
  const insideOk = ca.inside >= cb.inside;
  console.log(
    `\n  346(b) bias   : ${biasOk ? 'MET' : 'NOT MET'}\n` +
      `  346(b) inside : ${insideOk ? 'MET' : 'NOT MET'}\n` +
      `  346(c)        : ${movedBelow === 0 ? 'MET' : 'NOT MET'}`
  );

  // Rules 356 to 362 put the same change to a different question: identity
  // decides, and the dead may only trip rule 359's stop.
  const drift =
    cb.bias === null || ca.bias === null
      ? null
      : Math.abs(Math.log(ca.bias)) - Math.abs(Math.log(cb.bias));
  const stopped = drift !== null && Math.abs(drift) > ALIGNMENT_STOP_LN_BIAS;
  console.log(
    `\n  358(b) central below Mw ${GREAT.toString()} : ${movedBelow === 0 ? 'MET' : 'NOT MET'}\n` +
      `  358(c) bands there moved      : ${bandsMovedBelow.toString()}, expected and allowed\n` +
      `  358(d) none left their band   : ${leftTheirBand === 0 ? 'MET' : 'NOT MET'}\n` +
      `  359  drift in |ln bias|       : ${drift === null ? '—' : drift.toFixed(3)} against a stop at ${ALIGNMENT_STOP_LN_BIAS.toFixed(2)}\n` +
      `  359  stop                     : ${stopped ? 'TRIGGERED — hold the change' : 'not triggered'}`
  );

  const out = 'benchmark/results/held-out-strike-2026-09-21.json';
  writeFileSync(
    out,
    `${JSON.stringify(
      {
        rules: '342 to 348',
        set: "rule 11's 408 rows, already read — not held out (rule 345)",
        belowGreat: { checked: checkedBelow, moved: movedBelow },
        cell: { before: cb, after: ca },
        bar: { bias: biasOk, inside: insideOk, below: movedBelow === 0 },
        belowBands: bandsMovedBelow,
        leftTheirBand: { rows: leftTheirBand, names: leavers },
        bar356: {
          centralBelowHolds: movedBelow === 0,
          noneLeftTheirBand: leftTheirBand === 0,
          drift,
          stop: ALIGNMENT_STOP_LN_BIAS,
          stopTriggered: stopped,
        },
        rows: rowsOut,
      },
      null,
      2
    )}\n`
  );
  console.log(`\nWrote ${out}`);
}

main();
