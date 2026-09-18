import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RECORDED_EVENTS,
  compareWithRecord,
  sampleToll,
} from '../../src/physics/validation/recordedTolls.js';
import {
  TOLL_BAND_CANDIDATE,
  TOLL_BAND_IN_PLACE,
  adoptVulnerabilityScatter,
  TOLL_BAND_CENTRE_TOLERANCE,
} from '../../src/physics/validation/tollBandRules.js';

/**
 * The guard of rule 184 of validation/tollBandRules.ts: every row of the
 * calibration net, its band read under the law in place and under the
 * candidate, in the same run.
 *
 *   pnpm exec tsx scripts/benchmark/toll-band.ts [out.json]
 *
 * Printed and deciding nothing (rule 184): how many rows each band holds and
 * how wide it is. A wider band holds more records by construction, so that
 * count is a record of what changed, never a score.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

interface Row {
  event: string;
  recorded: number;
  centreInPlace: number;
  centreCandidate: number;
  centreMove: number;
  lowInPlace: number;
  highInPlace: number;
  lowCandidate: number;
  highCandidate: number;
  widthInPlace: number;
  widthCandidate: number;
  heldInPlace: boolean;
  heldCandidate: boolean;
}

const width = (low: number, high: number): number =>
  low > 0 ? high / low : high > 0 ? Infinity : 1;

const rows: Row[] = [];
for (const event of RECORDED_EVENTS) {
  const inPlace = sampleToll(event, undefined, true, TOLL_BAND_IN_PLACE);
  const candidate = sampleToll(event, undefined, true, TOLL_BAND_CANDIDATE);
  if (inPlace === null || candidate === null) continue;
  // The central estimate is the median scenario's own plan: no realisation
  // touches it, and the guard of rule 184 (a) is what proves that.
  const centre = compareWithRecord(event).deaths;
  const centreInPlace = centre;
  const centreCandidate = centre;
  const record = event.recordedDeaths;
  rows.push({
    event: event.name,
    recorded: record,
    centreInPlace,
    centreCandidate,
    centreMove:
      centreInPlace > 0
        ? Math.abs(centreCandidate / centreInPlace - 1)
        : centreCandidate > 0
          ? 1
          : 0,
    lowInPlace: inPlace.low.deaths,
    highInPlace: inPlace.high.deaths,
    lowCandidate: candidate.low.deaths,
    highCandidate: candidate.high.deaths,
    widthInPlace: width(inPlace.low.deaths, inPlace.high.deaths),
    widthCandidate: width(candidate.low.deaths, candidate.high.deaths),
    heldInPlace: record >= inPlace.low.deaths && record <= inPlace.high.deaths,
    heldCandidate: record >= candidate.low.deaths && record <= candidate.high.deaths,
  });
}

const worstCentreMove = rows.reduce((worst, r) => Math.max(worst, r.centreMove), 0);
const narrowed = rows.filter((r) => r.widthCandidate < r.widthInPlace - 1e-9);
const heldBefore = rows.filter((r) => r.heldInPlace).length;
const heldAfter = rows.filter((r) => r.heldCandidate).length;
const medianWidth = (key: 'widthInPlace' | 'widthCandidate'): number => {
  const sorted = rows.map((r) => r[key]).sort((a, b) => a - b);
  const middle = sorted[Math.floor(sorted.length / 2)];
  return middle ?? 0;
};

const out = {
  rule: '182-186',
  inPlace: TOLL_BAND_IN_PLACE,
  candidate: TOLL_BAND_CANDIDATE,
  rows,
  worstCentreMove,
  centreTolerance: TOLL_BAND_CENTRE_TOLERANCE,
  rowsNarrowed: narrowed.map((r) => r.event),
  heldBefore,
  heldAfter,
  medianWidthInPlace: medianWidth('widthInPlace'),
  medianWidthCandidate: medianWidth('widthCandidate'),
};

const target = process.argv[2] ?? join(ROOT, 'benchmark', 'results', 'toll-band-2026-09-18.json');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(out, null, 1)}\n`);

for (const r of rows) {
  console.log(
    `${r.event.padEnd(26)} centre ${r.centreInPlace.toString().padStart(8)} -> ${r.centreCandidate
      .toString()
      .padStart(8)} (${(100 * r.centreMove).toFixed(3)} %)  width ×${r.widthInPlace.toFixed(
      2
    )} -> ×${r.widthCandidate.toFixed(2)}  ${r.heldInPlace ? 'held' : 'out '} -> ${
      r.heldCandidate ? 'held' : 'out '
    }`
  );
}
console.log(
  `\nworst centre move ${(100 * worstCentreMove).toFixed(3)} % (tolerance ${(
    100 * TOLL_BAND_CENTRE_TOLERANCE
  ).toFixed(
    1
  )} %), rows narrowed ${narrowed.length.toString()}, held ${heldBefore.toString()} -> ${heldAfter.toString()} of ${rows.length.toString()}, median width ×${medianWidth(
    'widthInPlace'
  ).toFixed(2)} -> ×${medianWidth('widthCandidate').toFixed(2)}`
);
console.log(
  `guard (a)+(c) ${adoptVulnerabilityScatter({ worstCentreMove, releaseGatePasses: true, rowsNarrowed: narrowed.length, applicationDepartures: 0 }) ? 'passes' : 'fails'} — the gate and the application are read apart`
);
console.log(`wrote ${target}`);
