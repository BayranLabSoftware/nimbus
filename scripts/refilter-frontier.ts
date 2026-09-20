import { readFileSync } from 'node:fs';
import {
  simulateEarthquake,
  type EarthquakeScenarioInput,
} from '../src/physics/events/earthquake/simulate.js';
import { shippedDipAnswer } from '../src/physics/validation/shippedFaults.js';
import { NET_SITES } from '../src/physics/validation/siteVs30Data.js';
import {
  AREA_STEP_LIMIT,
  radiusInversionsWithinRegime,
  shakenAreaKm2,
} from '../src/physics/validation/areaPropertyRules.js';
import { frontierOf, type Objectives } from '../src/physics/validation/factorialRules.js';

/**
 * The 26 frontier cells of rules 488 to 494, put through the gate that
 * `areaPropertyRules.ts` repaired after B-083.
 *
 * A measurement, not a round: it applies a new instrument to cells whose
 * four objectives are already published, and chooses nothing.
 *
 * Usage:
 *   pnpm exec tsx scripts/refilter-frontier.ts
 */

interface Cell {
  law: string;
  extendedSource: string;
  stadiumWidth: string;
  dip: string;
  topBand: string;
  distance: string;
}
const rows = JSON.parse(readFileSync('benchmark/results/factorial-earthquake.json', 'utf8')) as {
  cell: Cell;
  objectives: Objectives;
}[];

/** Where a `structure` dip is looked up. The six the net already holds —
 *  a set this script does not get to choose, because it exists for other
 *  reasons. A cell must hold the properties at every one of them. */
const PLACES = NET_SITES.slice(0, 6).map((s) => ({
  key: s.key,
  lat: s.latitude,
  lon: s.longitude,
}));

const settingsOf = (c: Cell): Omit<EarthquakeScenarioInput, 'magnitude'> =>
  ({
    contourLaw: c.law,
    extendedSource: c.extendedSource,
    stadiumWidth: c.stadiumWidth,
    topBand: c.topBand,
    ...(c.distance === 'thompsonWorden2018' ? { pointSourceDistance: 'thompsonWorden2018' } : {}),
  }) as Omit<EarthquakeScenarioInput, 'magnitude'>;

/** The walk, with the dip looked up per magnitude where the cell asks. */
function walkAt(
  cell: Cell,
  place: { lat: number; lon: number } | null
): { inversions: number; jumps: number; worst: { ratio: number; atMw: number } } {
  const base = settingsOf(cell);
  let inversions = 0;
  let jumps = 0;
  let worst = { ratio: 0, atMw: Number.NaN };
  let previous = Number.NaN;
  for (let mw = 4; mw <= 9 + 1e-9; mw += 0.01) {
    const magnitude = Math.round(mw * 1_000) / 1_000;
    let input: EarthquakeScenarioInput = { ...base, magnitude };
    if (cell.dip === 'structure' && place !== null) {
      const first = simulateEarthquake(input);
      const d = shippedDipAnswer(
        place.lat,
        place.lon,
        (first.inputs.depth as number | undefined) ?? 10_000,
        first.ruptureLength
      );
      if (d !== null) input = { ...input, dipDeg: d.dipDeg };
    }
    const area = shakenAreaKm2(input);
    if (Number.isFinite(previous) && previous > 0) {
      if (area < previous) inversions += 1;
      const ratio = area / previous;
      if (ratio > AREA_STEP_LIMIT) jumps += 1;
      if (ratio > worst.ratio) worst = { ratio, atMw: magnitude };
    }
    previous = area;
  }
  return { inversions, jumps, worst };
}

function main(): void {
  const front = frontierOf(rows);
  const shipped = rows.find(
    (r) =>
      r.cell.law === 'boore2014' &&
      r.cell.extendedSource === 'fromMw7.5' &&
      r.cell.stadiumWidth === 'downDip' &&
      r.cell.dip === 'style' &&
      r.cell.topBand === 'midpoint' &&
      r.cell.distance === 'epicentral'
  );
  console.log(`the frontier of rules 488 to 494: ${front.length.toString()} cells`);
  console.log(
    `the gate: P-MONO-AREA, P-CONT-AREA (no 0.01 step past x${AREA_STEP_LIMIT.toString()}), P-MONO-MW within regime`
  );
  console.log(
    `a structure dip is walked at all ${PLACES.length.toString()} net sites and must hold at every one\n`
  );

  const passing: { cell: Cell; objectives: Objectives; worst: number; atMw: number }[] = [];
  for (const r of front) {
    const places = r.cell.dip === 'structure' ? PLACES : [null];
    let inversions = 0;
    let jumps = 0;
    let worst = { ratio: 0, atMw: Number.NaN };
    for (const p of places) {
      const w = walkAt(r.cell, p);
      inversions += w.inversions;
      jumps += w.jumps;
      if (w.worst.ratio > worst.ratio) worst = w.worst;
    }
    const reg = radiusInversionsWithinRegime(settingsOf(r.cell));
    const radiusOk = reg.belowThreshold + reg.atOrAbove === 0;
    const ok = inversions === 0 && jumps === 0 && radiusOk;
    if (ok)
      passing.push({
        cell: r.cell,
        objectives: r.objectives,
        worst: worst.ratio,
        atMw: worst.atMw,
      });
    const c = r.cell;
    console.log(
      `  ${ok ? 'PASS' : 'FAIL'}  ${c.law}|${c.extendedSource}|${c.stadiumWidth}|${c.dip}|${c.topBand}|${c.distance}` +
        `   worst step x${worst.ratio.toFixed(2)} at Mw ${worst.atMw.toFixed(2)}` +
        (inversions > 0 ? `  [${inversions.toString()} area inversions]` : '') +
        (radiusOk ? '' : '  [radius inversion in regime]')
    );
  }

  console.log(
    `\n${passing.length.toString()} of ${front.length.toString()} frontier cells hold every property.`
  );
  if (shipped !== undefined) {
    const w = walkAt(shipped.cell, null);
    console.log(
      `  and the SHIPPED model: worst step x${w.worst.ratio.toFixed(2)} at Mw ${w.worst.atMw.toFixed(2)} → ` +
        (w.jumps === 0 ? 'holds' : 'FAILS P-CONT-AREA')
    );
  }

  if (passing.length > 0) {
    console.log('\nthe shippable menu, best areas first:');
    console.log('| peak | areas | dead | quiet | worst step | cell |');
    console.log('| --- | --- | --- | --- | --- | --- |');
    for (const p of [...passing].sort((a, b) => a.objectives.areas - b.objectives.areas)) {
      const c = p.cell;
      console.log(
        `| ${p.objectives.peak.toFixed(3)} | ${p.objectives.areas.toFixed(3)} | ${p.objectives.dead.toFixed(1)} | ` +
          `${p.objectives.quiet.toFixed(0)} | x${p.worst.toFixed(2)} | ` +
          `${c.law}/${c.extendedSource}/${c.stadiumWidth}/${c.dip}/${c.topBand}/${c.distance} |`
      );
    }
    if (shipped !== undefined) {
      const o = shipped.objectives;
      console.log(
        `| ${o.peak.toFixed(3)} | ${o.areas.toFixed(3)} | ${o.dead.toFixed(1)} | ${o.quiet.toFixed(0)} | ` +
          `x9.19 | SHIPPED (fails the gate) |`
      );
    }
  }
}

main();
