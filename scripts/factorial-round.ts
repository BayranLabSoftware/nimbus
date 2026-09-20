import { writeFileSync } from 'node:fs';
import {
  intensityLawOf,
  simulateEarthquake,
  type ContourLaw,
  type EarthquakeScenarioInput,
} from '../src/physics/events/earthquake/simulate.js';
import { areaAbove, type RuptureFootprint } from '../src/physics/events/earthquake/shakingField.js';
import { fitShakingField } from '../src/scene/globe/shakingOverlay.js';
import { shippedDipAnswer, shippedStrikeAnswer } from '../src/physics/validation/shippedFaults.js';
import { shippedSiteLookup } from '../src/physics/validation/shippedVs30.js';
import { widerJury } from '../src/physics/validation/widerFootprintRules.js';
import { wholeAtlasPeakJury } from '../src/physics/validation/wholeAtlasPeakRules.js';
import { atlasGround } from '../src/physics/validation/atlasRun.js';
import { readPeaks } from '../src/physics/validation/peakIntensityRules.js';
import {
  compareWithRecord,
  RECORDED_EVENTS,
  sampleToll,
  type RecordedEvent,
} from '../src/physics/validation/recordedTolls.js';
import { UNSEEN_EARTHQUAKES } from '../src/physics/validation/unseenSetData.js';
import { UNSEEN_SITES } from '../src/physics/validation/unseenSiteData.js';
import { siteVs30 } from '../src/physics/validation/siteVs30.js';
import { isQuiet } from '../src/physics/validation/depthRules.js';
import { unseenEarthquakeEvent } from '../src/physics/validation/unseenSet.js';
import { intervalScore } from '../src/physics/validation/intervalScoreRules.js';
import {
  dominatesShipped,
  frontierOf,
  minimaxRegret,
  OBJECTIVE_KEYS,
  relativeChange,
  type Objectives,
} from '../src/physics/validation/factorialRules.js';
import type { Meters } from '../src/physics/units.js';

/**
 * The round of rules 488 to 494: ninety-six cells, four objectives, one
 * frontier.
 *
 * Usage:
 *   pnpm exec tsx scripts/factorial-round.ts [out.json]
 */

const LAWS: ContourLaw[] = ['boore2014', 'campbellBozorgnia2014', 'allen2012Hypocentral'];
const EXTENDED = ['fromMw7.5', 'always'] as const;
const WIDTH = ['downDip', 'surfaceProjection'] as const;
const DIP = ['style', 'structure'] as const;
const TOP = ['midpoint', 'toPeak'] as const;
const DISTANCE = ['epicentral', 'thompsonWorden2018'] as const;

interface Cell {
  id: number;
  law: ContourLaw;
  extendedSource: (typeof EXTENDED)[number];
  stadiumWidth: (typeof WIDTH)[number];
  dip: (typeof DIP)[number];
  topBand: (typeof TOP)[number];
  distance: (typeof DISTANCE)[number];
}

const CELLS: Cell[] = [];
let id = 0;
for (const law of LAWS)
  for (const extendedSource of EXTENDED)
    for (const stadiumWidth of WIDTH)
      for (const dip of DIP)
        for (const topBand of TOP)
          for (const distance of DISTANCE)
            CELLS.push({ id: id++, law, extendedSource, stadiumWidth, dip, topBand, distance });

const SITES = new Map(UNSEEN_SITES.map((s) => [s.key, s]));
const THRESHOLDS = [7, 8, 9] as const;
const label = (c: Cell): string =>
  `${c.law}|${c.extendedSource}|${c.stadiumWidth}|${c.dip}|${c.topBand}|${c.distance}`;

function inputFor(cell: Cell, base: EarthquakeScenarioInput, lat: number, lon: number) {
  const withSettings: EarthquakeScenarioInput = {
    ...base,
    contourLaw: cell.law,
    extendedSource: cell.extendedSource,
    stadiumWidth: cell.stadiumWidth,
    topBand: cell.topBand,
    ...(cell.distance === 'thompsonWorden2018'
      ? { pointSourceDistance: 'thompsonWorden2018' as const }
      : {}),
  };
  if (cell.dip === 'style') return withSettings;
  const first = simulateEarthquake(withSettings);
  const answer = shippedDipAnswer(
    lat,
    lon,
    (first.inputs.depth as number | undefined) ?? 10_000,
    first.ruptureLength
  );
  return answer === null ? withSettings : { ...withSettings, dipDeg: answer.dipDeg };
}

function mapObjectives(cell: Cell, site: NonNullable<ReturnType<typeof shippedSiteLookup>>) {
  const peaks: { id: string; modelPeakMmi: number; recordPeakMmi: number }[] = [];
  for (const e of wholeAtlasPeakJury()) {
    const vs30 = atlasGround(e);
    const r = simulateEarthquake(
      inputFor(
        cell,
        {
          magnitude: e.magnitude,
          depth: (Math.max(0, e.depthKm) * 1_000) as Meters,
          faultType: e.faultType,
          ...(vs30 === undefined ? {} : { vs30 }),
        },
        e.latitude,
        e.longitude
      )
    );
    peaks.push({ id: e.comcat, modelPeakMmi: r.shaking.mmiAtEpicenter, recordPeakMmi: e.maxMmi });
  }
  const logs: number[] = [];
  for (const e of widerJury()) {
    const r = simulateEarthquake(
      inputFor(
        cell,
        {
          magnitude: e.magnitude,
          depth: (Math.max(0, e.depthKm) * 1_000) as Meters,
          faultType: e.faultType,
        },
        e.latitude,
        e.longitude
      )
    );
    const f = intensityLawOf(r);
    if (f === null) continue;
    const a = shippedStrikeAnswer(e.latitude, e.longitude, e.depthKm * 1000, r.ruptureLength);
    const rupture: RuptureFootprint = {
      latitude: e.latitude,
      longitude: e.longitude,
      strikeDeg: r.inputs.strikeAzimuthDeg ?? a.strikeDeg ?? 0,
      halfLengthM: r.isExtendedSource ? (r.ruptureLength as number) / 2 : 0,
      halfWidthM: r.isExtendedSource ? (r.ruptureFootprintWidth as number) / 2 : 0,
    };
    const { field } = fitShakingField({
      rupture,
      intensityAt: f,
      siteAt: (la, lo) => ({ vs30: site(la, lo).vs30, provenance: 'grid' as const }),
    });
    for (const t of THRESHOLDS) {
      const rec = e.areaKm2[t];
      const mod = areaAbove(field, t) / 1e6;
      if (rec > 0 && mod > 0) logs.push(Math.log(mod / rec));
    }
  }
  const mean = logs.length > 0 ? logs.reduce((a, b) => a + b, 0) / logs.length : Number.NaN;
  return { peak: Math.abs(readPeaks(peaks).meanBias), areas: Math.abs(mean) };
}

function asCell(event: RecordedEvent, cell: Cell): RecordedEvent {
  const run = event.run;
  return {
    ...event,
    run: () => {
      const r = run();
      if (r.type !== 'earthquake') return r;
      return {
        type: 'earthquake',
        data: simulateEarthquake(inputFor(cell, r.data.inputs, event.latitude, event.longitude)),
      };
    },
  };
}

function tollObjectives(cell: Cell): { dead: number; quiet: number } {
  let dead = 0;
  for (const row of RECORDED_EVENTS) {
    const c = compareWithRecord(asCell(row, cell));
    dead += intervalScore(c.low, c.high, row.recordedDeaths);
  }
  let quiet = 0;
  for (const row of UNSEEN_EARTHQUAKES.filter(isQuiet)) {
    const vs30 = siteVs30('pick', SITES.get(row.comcat));
    const band = sampleToll(asCell(unseenEarthquakeEvent(row, { vs30 }), cell));
    if (band === null) continue;
    quiet += intervalScore(band.low.deaths, band.high.deaths, 0);
  }
  return { dead, quiet };
}

function main(): void {
  const site = shippedSiteLookup();
  if (site === null) {
    console.error('The shipped Vs30 tiles are absent.');
    process.exit(1);
  }
  const out = process.argv[2] ?? 'factorial.json';
  console.log(`rule 488: ${CELLS.length.toString()} cells\n`);

  // The map objectives do not read `topBand`, so they are computed once
  // per distinct setting of the other five and shared. Rule 493 asks for
  // duplicates to be found, not for the grid to be pruned.
  const mapCache = new Map<string, { peak: number; areas: number }>();
  const results: { cell: Cell; objectives: Objectives }[] = [];
  const started = Date.now();
  for (const cell of CELLS) {
    const mapKey = `${cell.law}|${cell.extendedSource}|${cell.stadiumWidth}|${cell.dip}|${cell.distance}`;
    let map = mapCache.get(mapKey);
    if (map === undefined) {
      map = mapObjectives(cell, site);
      mapCache.set(mapKey, map);
    }
    const tolls = tollObjectives(cell);
    results.push({ cell, objectives: { ...map, ...tolls } });
    const done = results.length;
    const each = (Date.now() - started) / done;
    console.log(
      `  ${done.toString().padStart(2)}/${CELLS.length.toString()} ${label(cell).padEnd(78)} ` +
        `peak ${map.peak.toFixed(3)} areas ${map.areas.toFixed(3)} dead ${tolls.dead.toFixed(0)} quiet ${tolls.quiet.toFixed(0)}` +
        ` · ${(((CELLS.length - done) * each) / 60000).toFixed(0)} min left`
    );
  }

  writeFileSync(out, JSON.stringify(results, null, 1));
  console.log(`\nwritten to ${out}`);

  const shipped = results.find(
    (r) =>
      r.cell.law === 'boore2014' &&
      r.cell.extendedSource === 'fromMw7.5' &&
      r.cell.stadiumWidth === 'downDip' &&
      r.cell.dip === 'style' &&
      r.cell.topBand === 'midpoint' &&
      r.cell.distance === 'epicentral'
  );
  if (shipped === undefined) throw new Error('the shipped cell is not in the grid');
  console.log(
    `\n### the shipped model: peak ${shipped.objectives.peak.toFixed(3)} · areas ${shipped.objectives.areas.toFixed(3)} · ` +
      `dead ${shipped.objectives.dead.toFixed(1)} · quiet ${shipped.objectives.quiet.toFixed(0)}`
  );

  const front = frontierOf(results);
  console.log(
    `\n### rule 490 — the frontier: ${front.length.toString()} of ${results.length.toString()} cells`
  );
  console.log('| law | extended | width | dip | band | distance | peak | areas | dead | quiet |');
  console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const f of [...front].sort((a, b) => a.objectives.quiet - b.objectives.quiet)) {
    const c = f.cell;
    console.log(
      `| ${c.law} | ${c.extendedSource} | ${c.stadiumWidth} | ${c.dip} | ${c.topBand} | ${c.distance} | ` +
        `${f.objectives.peak.toFixed(3)} | ${f.objectives.areas.toFixed(3)} | ${f.objectives.dead.toFixed(1)} | ${f.objectives.quiet.toFixed(0)} |`
    );
  }

  const dominating = results.filter((r) => dominatesShipped(shipped.objectives, r.objectives));
  console.log(
    `\n### rule 491(a) — cells that dominate the shipped model: ${dominating.length.toString()}`
  );
  for (const d of dominating) console.log(`  ${label(d.cell)}`);

  if (dominating.length === 0) {
    const rec = minimaxRegret(shipped.objectives, front);
    if (rec !== null) {
      const rel = relativeChange(shipped.objectives, rec.objectives);
      console.log('\n### rule 491(b) — the recommendation, by minimax regret');
      console.log(`  ${label(rec.cell)}`);
      console.log(
        '  relative change: ' +
          OBJECTIVE_KEYS.map(
            (k) => `${k} ${rel[k] >= 0 ? '+' : ''}${(100 * rel[k]).toFixed(0)} %`
          ).join(' · ')
      );
    }
  }

  console.log('\n### rule 492(a) — main effects (mean change in each objective)');
  const factors = [
    {
      name: 'law: CB14 vs boore',
      on: (c: Cell) => c.law === 'campbellBozorgnia2014',
      off: (c: Cell) => c.law === 'boore2014',
    },
    {
      name: 'law: allen vs boore',
      on: (c: Cell) => c.law === 'allen2012Hypocentral',
      off: (c: Cell) => c.law === 'boore2014',
    },
    {
      name: 'extendedSource always',
      on: (c: Cell) => c.extendedSource === 'always',
      off: (c: Cell) => c.extendedSource === 'fromMw7.5',
    },
    {
      name: 'surfaceProjection',
      on: (c: Cell) => c.stadiumWidth === 'surfaceProjection',
      off: (c: Cell) => c.stadiumWidth === 'downDip',
    },
    {
      name: 'structure dip',
      on: (c: Cell) => c.dip === 'structure',
      off: (c: Cell) => c.dip === 'style',
    },
    {
      name: 'topBand toPeak',
      on: (c: Cell) => c.topBand === 'toPeak',
      off: (c: Cell) => c.topBand === 'midpoint',
    },
    {
      name: 'Thompson-Worden',
      on: (c: Cell) => c.distance === 'thompsonWorden2018',
      off: (c: Cell) => c.distance === 'epicentral',
    },
  ];
  console.log(`| factor | ${OBJECTIVE_KEYS.join(' | ')} |`);
  console.log(`| --- | ${OBJECTIVE_KEYS.map(() => '---').join(' | ')} |`);
  const meanOf = (rows: typeof results, k: keyof Objectives): number =>
    rows.length === 0 ? Number.NaN : rows.reduce((a, r) => a + r.objectives[k], 0) / rows.length;
  for (const f of factors) {
    const on = results.filter((r) => f.on(r.cell));
    const off = results.filter((r) => f.off(r.cell));
    console.log(
      `| ${f.name} | ` +
        OBJECTIVE_KEYS.map((k) => {
          const d = meanOf(on, k) - meanOf(off, k);
          return `${d >= 0 ? '+' : ''}${d.toFixed(k === 'dead' || k === 'quiet' ? 0 : 3)}`;
        }).join(' | ') +
        ' |'
    );
  }

  console.log('\n### rule 492(b) — the interactions that matter');
  for (const f of factors) {
    for (const g of factors) {
      if (f === g) continue;
      for (const k of OBJECTIVE_KEYS) {
        const within = (pick: (c: Cell) => boolean): number =>
          meanOf(
            results.filter((r) => f.on(r.cell) && pick(r.cell)),
            k
          ) -
          meanOf(
            results.filter((r) => f.off(r.cell) && pick(r.cell)),
            k
          );
        const a = within(g.on);
        const b = within(g.off);
        if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
        const main = (a + b) / 2;
        const differ = Math.abs(a - b);
        if (differ > Math.abs(main) / 2 && differ > 1e-9) {
          console.log(
            `  ${k}: ${f.name} gives ${a >= 0 ? '+' : ''}${a.toFixed(k === 'dead' || k === 'quiet' ? 0 : 3)} with ${g.name}, ` +
              `${b >= 0 ? '+' : ''}${b.toFixed(k === 'dead' || k === 'quiet' ? 0 : 3)} without`
          );
        }
      }
    }
  }

  console.log('\n### rule 493 — duplicate cells');
  const seen = new Map<string, Cell>();
  let dupes = 0;
  for (const r of results) {
    const key = OBJECTIVE_KEYS.map((k) => r.objectives[k].toFixed(6)).join('/');
    const first = seen.get(key);
    if (first === undefined) seen.set(key, r.cell);
    else dupes += 1;
  }
  console.log(
    `  ${dupes.toString()} of ${results.length.toString()} cells duplicate another cell's four numbers`
  );
}

main();
