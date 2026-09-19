/**
 * Rules 377 to 383 of `src/physics/validation/ruptureCentreRules.ts`: what it
 * costs to stop assuming the hypocentre is the centre of the rupture.
 *
 *   pnpm exec tsx scripts/benchmark/rupture-centre.ts
 *
 * One run, both sides in one process. The band is drawn twice for every one
 * of rule 11's 408 rows: once as it is drawn today, and once with the centre
 * of the rupture drawn per realisation (rule 378, uniform on [-L/2, +L/2]).
 * Nothing else differs, and the central estimate is the same object on both
 * sides — rule 381(d) is checked, not assumed.
 */

import { writeFileSync } from 'node:fs';
import { RULE_EARTHQUAKES } from '../../src/physics/validation/heldOutByRule.js';
import { centralEstimate, sampleToll } from '../../src/physics/validation/recordedTolls.js';
import {
  FALSIFIED_BANDS_TODAY,
  MEDIAN_WIDTH_TODAY_DECADES,
  WIDTH_CEILING_DECADES,
} from '../../src/physics/validation/ruptureCentreRules.js';

interface Row {
  name: string;
  record: number;
  central: number;
  low: number;
  high: number;
}

const median = (xs: readonly number[]): number => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 === 1 ? (s[mid] ?? 0) : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
};

function side(draw: boolean): Row[] {
  return RULE_EARTHQUAKES.map((quake) => {
    const central = centralEstimate(quake.event);
    const band = sampleToll(quake.event, undefined, true, undefined, draw);
    return {
      name: quake.event.name,
      record: quake.event.recordedDeaths,
      central: central?.deaths ?? 0,
      low: band?.low.deaths ?? central?.deathsLow ?? 0,
      high: band?.high.deaths ?? central?.deathsHigh ?? 0,
    };
  });
}

const falsified = (rows: readonly Row[]): Row[] =>
  rows.filter((r) => r.record > 0 && r.low === 0 && r.high === 0);

const widths = (rows: readonly Row[]): number[] =>
  rows
    .filter((r) => !(r.low === 0 && r.high === 0))
    .map((r) => Math.log10(Math.max(r.high, 1) / Math.max(r.low, 1)));

const holds = (r: Row): boolean => {
  const lo = Math.min(r.low, r.high);
  const hi = Math.max(r.low, r.high);
  return lo <= r.record && r.record <= hi;
};

function main(): void {
  console.log('Rules 377 to 383 — the hypocentre is not the centre of the rupture.\n');

  const before = side(false);
  const after = side(true);

  const fb = falsified(before);
  const fa = falsified(after);
  console.log(`381(a) falsified bands — [0, 0] beside a record above zero:`);
  console.log(
    `  before: ${fb.length.toString()} (rule 381(a) wrote ${FALSIFIED_BANDS_TODAY.toString()})`
  );
  console.log(`  after : ${fa.length.toString()}\n`);
  for (const r of fb) {
    const now = after.find((x) => x.name === r.name);
    console.log(
      `  ${r.name.slice(0, 44).padEnd(45)} record ${String(r.record).padStart(3)}  ` +
        `[0, 0] -> [${Math.round(now?.low ?? 0).toString()}, ${Math.round(now?.high ?? 0).toString()}]`
    );
  }

  // 381(b): nobody leaves their band.
  let left = 0;
  const leavers: string[] = [];
  let moved = 0;
  let unchanged = 0;
  let centralMoved = 0;
  for (const [i, b] of before.entries()) {
    const a = after[i];
    if (a === undefined) continue;
    if (holds(b) && !holds(a)) {
      left += 1;
      leavers.push(b.name);
    }
    if (a.low !== b.low || a.high !== b.high) moved += 1;
    else unchanged += 1;
    if (a.central !== b.central) centralMoved += 1;
  }

  const wb = median(widths(before));
  const wa = median(widths(after));
  const insideBefore = before.filter((r) => holds(r)).length;
  const insideAfter = after.filter((r) => holds(r)).length;

  console.log(
    `\n381(b) rows that left their band : ${left.toString()}${leavers.length === 0 ? '' : ` — ${leavers.slice(0, 5).join('; ')}`}`
  );
  console.log(
    `381(c) median band width         : 10^${wb.toFixed(2)} -> 10^${wa.toFixed(2)}  ` +
      `(ceiling +${WIDTH_CEILING_DECADES.toFixed(2)}, written as 10^${MEDIAN_WIDTH_TODAY_DECADES.toFixed(2)})`
  );
  console.log(`381(d) central estimates moved   : ${centralMoved.toString()}`);
  console.log(`383    bands that moved / stood  : ${moved.toString()} / ${unchanged.toString()}`);
  console.log(
    `       rows inside their band    : ${insideBefore.toString()} -> ${insideAfter.toString()} of ${before.length.toString()}`
  );

  const a381 = fa.length < fb.length;
  const b381 = left === 0;
  const c381 = wa - wb <= WIDTH_CEILING_DECADES;
  const d381 = centralMoved === 0;
  console.log(
    `\n  381(a) falsified fall  : ${a381 ? 'MET' : 'NOT MET'}\n` +
      `  381(b) none left band  : ${b381 ? 'MET' : 'NOT MET'}\n` +
      `  381(c) width ceiling   : ${c381 ? 'MET' : 'NOT MET'}\n` +
      `  381(d) centrals still  : ${d381 ? 'MET' : 'NOT MET'}\n` +
      `  ==> ${a381 && b381 && c381 && d381 ? 'ADOPT' : 'REFUSE'}`
  );

  const out = 'benchmark/results/rupture-centre-2026-09-21.json';
  writeFileSync(
    out,
    `${JSON.stringify(
      {
        rules: '377 to 383',
        falsified: { before: fb.length, after: fa.length, names: fb.map((r) => r.name) },
        leftTheirBand: { rows: left, names: leavers },
        medianWidthDecades: { before: wb, after: wa, ceiling: WIDTH_CEILING_DECADES },
        centralMoved,
        bands: { moved, unchanged },
        inside: { before: insideBefore, after: insideAfter, rows: before.length },
        met: { a: a381, b: b381, c: c381, d: d381 },
      },
      null,
      2
    )}\n`
  );
  console.log(`Wrote ${out}`);
}

main();
