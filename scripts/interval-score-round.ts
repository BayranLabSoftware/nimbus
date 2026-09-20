import {
  intensityLawOf,
  simulateEarthquake,
  type EarthquakeScenarioInput,
} from '../src/physics/events/earthquake/simulate.js';
import { areaAbove, type RuptureFootprint } from '../src/physics/events/earthquake/shakingField.js';
import { fitShakingField } from '../src/scene/globe/shakingOverlay.js';
import { shippedDipAnswer, shippedStrikeAnswer } from '../src/physics/validation/shippedFaults.js';
import { shippedSiteLookup } from '../src/physics/validation/shippedVs30.js';
import { widerJury } from '../src/physics/validation/widerFootprintRules.js';
import {
  EXTENDED_SOURCE_CELLS,
  EXTENDED_SOURCE_MARGIN,
  magnitudeCell,
  worstCell,
} from '../src/physics/validation/extendedSourceRules.js';
import { cellsThatFlippedSign } from '../src/physics/validation/surfaceProjectionRules.js';
import { medianOf, QUIET_TOLL_THRESHOLD } from '../src/physics/validation/quietBandRules.js';
import { intervalScore } from '../src/physics/validation/intervalScoreRules.js';
import { bandWidthLn } from '../src/physics/validation/quietBandRules.js';
import {
  centralEstimate,
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
import type { Meters } from '../src/physics/units.js';

/**
 * The round of rules 448 to 454: the same four arms, judged by the
 * interval score instead of by band membership — with the old clause
 * printed beside the new one, as rule 452 requires.
 *
 * Usage:
 *   pnpm exec tsx scripts/interval-score-round.ts
 */

type Settings = Partial<
  Pick<EarthquakeScenarioInput, 'stadiumWidth' | 'extendedSource' | 'topBand'>
>;

const ARMS = [
  { key: 'in place', settings: {} as Settings, dip: false },
  {
    key: 'C geometry',
    settings: { stadiumWidth: 'surfaceProjection', extendedSource: 'always' } as Settings,
    dip: true,
  },
  { key: 'D top band', settings: { topBand: 'toPeak' } as Settings, dip: false },
  {
    key: 'E both',
    settings: {
      stadiumWidth: 'surfaceProjection',
      extendedSource: 'always',
      topBand: 'toPeak',
    } as Settings,
    dip: true,
  },
] as const;
type Arm = (typeof ARMS)[number];

const THRESHOLDS = [7, 8, 9] as const;
const SITES = new Map(UNSEEN_SITES.map((s) => [s.key, s]));

function withDip(base: EarthquakeScenarioInput, lat: number, lon: number, ask: boolean) {
  if (!ask) return base;
  const first = simulateEarthquake(base);
  const answer = shippedDipAnswer(
    lat,
    lon,
    (first.inputs.depth as number | undefined) ?? 10_000,
    first.ruptureLength
  );
  return answer === null ? base : { ...base, dipDeg: answer.dipDeg };
}

function asArm(event: RecordedEvent, arm: Arm): RecordedEvent {
  const run = event.run;
  return {
    ...event,
    run: () => {
      const result = run();
      if (result.type !== 'earthquake') return result;
      return {
        type: 'earthquake',
        data: simulateEarthquake(
          withDip(
            { ...result.data.inputs, ...arm.settings },
            event.latitude,
            event.longitude,
            arm.dip
          )
        ),
      };
    },
  };
}

// --- the map -----------------------------------------------------------
interface Band {
  cell: string;
  observedKm2: number;
  modelKm2: number;
}

function score(bands: readonly Band[]): { bias: number; sdLn: number; bands: number } {
  const logs = bands
    .filter((b) => b.observedKm2 > 0 && b.modelKm2 > 0)
    .map((b) => Math.log(b.modelKm2 / b.observedKm2));
  if (logs.length < 2) return { bias: Number.NaN, sdLn: Number.NaN, bands: logs.length };
  const mean = logs.reduce((a, b) => a + b, 0) / logs.length;
  return {
    bias: Math.exp(mean),
    sdLn: Math.sqrt(logs.reduce((a, b) => a + (b - mean) ** 2, 0) / (logs.length - 1)),
    bands: logs.length,
  };
}

function biasByCell(bands: readonly Band[]): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const cell of EXTENDED_SOURCE_CELLS) {
    const s = score(bands.filter((b) => b.cell === cell.label));
    out[cell.label] = Number.isFinite(s.bias) ? s.bias : null;
  }
  return out;
}

function mapFor(arm: Arm, site: NonNullable<ReturnType<typeof shippedSiteLookup>>): Band[] {
  const bands: Band[] = [];
  for (const e of widerJury()) {
    const input = withDip(
      {
        magnitude: e.magnitude,
        depth: (Math.max(0, e.depthKm) * 1_000) as Meters,
        faultType: e.faultType,
        contourLaw: 'boore2014',
        ...arm.settings,
      },
      e.latitude,
      e.longitude,
      arm.dip
    );
    const r = simulateEarthquake(input);
    const law = intensityLawOf(r);
    if (law === null) continue;
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
      intensityAt: law,
      siteAt: (la, lo) => ({ vs30: site(la, lo).vs30, provenance: 'grid' as const }),
    });
    const cell = magnitudeCell(e.magnitude);
    for (const t of THRESHOLDS) {
      bands.push({ cell, observedKm2: e.areaKm2[t], modelKm2: areaAbove(field, t) / 1e6 });
    }
  }
  return bands;
}

function main(): void {
  const site = shippedSiteLookup();
  if (site === null) {
    console.error('The shipped Vs30 tiles are absent.');
    process.exit(1);
  }

  // Rule 443(a). Arms D and E share a geometry with `in place` and C, so
  // the map is computed once per geometry and named for both.
  console.log('### rule 443(a) — the map, on 116 ShakeMaps');
  const cells = EXTENDED_SOURCE_CELLS.map((c) => c.label);
  console.log(`| geometry | bands | mean | scatter | ${cells.join(' | ')} |`);
  console.log(`| --- | --- | --- | --- | ${cells.map(() => '---').join(' | ')} |`);
  const maps = new Map<string, Band[]>();
  for (const arm of ARMS) {
    const key = arm.dip ? 'C geometry' : 'in place';
    if (!maps.has(key)) maps.set(key, mapFor(arm, site));
  }
  for (const [key, bands] of maps) {
    const s = score(bands);
    const cb = biasByCell(bands);
    console.log(
      `| ${key} | ${s.bands.toString()} | ${s.bias.toFixed(3)}x | ${s.sdLn.toFixed(3)} | ` +
        cells
          .map((c) => {
            const v = cb[c];
            return v === null || v === undefined ? '—' : `${v.toFixed(2)}x`;
          })
          .join(' | ') +
        ' |'
    );
  }
  const inPlaceMap = maps.get('in place') ?? [];
  const cMap = maps.get('C geometry') ?? [];
  const wa = worstCell(biasByCell(inPlaceMap));
  const wb = worstCell(biasByCell(cMap));
  const flipped = cellsThatFlippedSign(biasByCell(inPlaceMap), biasByCell(cMap));
  const sA = score(inPlaceMap);
  const sC = score(cMap);
  console.log(
    `  rule 424 on the C geometry: worst ${wa?.distance.toFixed(3) ?? '—'} → ${wb?.distance.toFixed(3) ?? '—'} ` +
      (wa !== null && wb !== null && wa.distance - wb.distance >= EXTENDED_SOURCE_MARGIN
        ? 'PASS'
        : 'FAIL') +
      ` · overall ${sA.bias.toFixed(3)}x/${sA.sdLn.toFixed(3)} → ${sC.bias.toFixed(3)}x/${sC.sdLn.toFixed(3)}` +
      ` · sign ${flipped.length === 0 ? 'PASS' : flipped.join(', ')}`
  );

  // Rule 443(b) — the dead.
  console.log('\n### rule 443(b) — the dead, on the net rows');
  const base = RECORDED_EVENTS.map((row) => compareWithRecord(row));
  const inside0 = base.filter((c) => c.contains).length;
  const netScores = new Map<string, number>();
  const netRows = new Map<string, Map<string, number>>();
  for (const arm of ARMS) {
    const lost: string[] = [];
    const gained: string[] = [];
    let inside = 0;
    let score = 0;
    RECORDED_EVENTS.forEach((row, i) => {
      const a = base[i];
      if (a === undefined) return;
      const b = arm.key === 'in place' ? a : compareWithRecord(asArm(row, arm));
      if (b.contains) inside += 1;
      if (a.contains && !b.contains) lost.push(row.name);
      if (!a.contains && b.contains) gained.push(row.name);
      const s = intervalScore(b.low, b.high, row.recordedDeaths);
      score += s;
      const seen = netRows.get(row.name) ?? new Map<string, number>();
      seen.set(arm.key, s);
      netRows.set(row.name, seen);
    });
    netScores.set(arm.key, score);
    console.log(
      `  ${arm.key.padEnd(12)} SCORE ${score.toFixed(1).padStart(7)} · old clause inside ${inside.toString()}/${inside0.toString()} · ` +
        `lost ${lost.length === 0 ? 'none' : lost.join(', ')} · ` +
        `gained ${gained.length === 0 ? 'none' : gained.join(', ')} → ` +
        (inside >= inside0 && lost.length === 0 ? 'PASS' : 'FAIL')
    );
  }

  console.log('\n  the rows that decided the last two rounds, by score:');
  for (const name of ['Sumatra–Andaman 2004', 'Pohang 2017', 'Amatrice 2016']) {
    const seen = netRows.get(name);
    if (seen === undefined) continue;
    console.log(
      `    ${name.padEnd(22)} ` +
        ARMS.map((a) => `${a.key} ${(seen.get(a.key) ?? 0).toFixed(1).padStart(6)}`).join(' · ')
    );
  }

  // Rule 443(c) — the quiet.
  console.log('\n### rule 443(c) — the quiet, on 805 earthquakes');
  const quiet = UNSEEN_EARTHQUAKES.filter(isQuiet);
  const named = [
    'usp000h60j',
    'us6000rcnw',
    'us7000pn9z',
    'us20002bi4',
    'us6000hz9v',
    'us20004zp9',
  ];
  const namedTolls = new Map<string, Record<string, number>>();
  console.log('| arm | SCORE | toll >= 10 | band reaches zero | median band width (ln) |');
  console.log('| --- | --- | --- | --- | --- |');
  const quietScores = new Map<string, number>();
  for (const arm of ARMS) {
    let loud = 0;
    let zero = 0;
    let banded = 0;
    let score = 0;
    const widths: number[] = [];
    for (const row of quiet) {
      const vs30 = siteVs30('pick', SITES.get(row.comcat));
      const evt = unseenEarthquakeEvent(row, { vs30 });
      const event = arm.key === 'in place' ? evt : asArm(evt, arm);
      const deaths = centralEstimate(event)?.deaths ?? 0;
      if (deaths >= QUIET_TOLL_THRESHOLD) loud += 1;
      if (named.includes(row.comcat)) {
        const seen = namedTolls.get(row.comcat) ?? {};
        seen[arm.key] = deaths;
        namedTolls.set(row.comcat, seen);
      }
      const band = sampleToll(event);
      if (band === null) continue;
      banded += 1;
      if (band.low.deaths <= 0) zero += 1;
      // Rule 23: a quiet earthquake's record, as `unseenEarthquakeEvent`
      // sets it, is zero dead.
      score += intervalScore(band.low.deaths, band.high.deaths, 0);
      const w = bandWidthLn(band.low.deaths, band.high.deaths);
      if (w !== null) widths.push(w);
    }
    quietScores.set(arm.key, score);
    const width = medianOf(widths);
    console.log(
      `| ${arm.key} | ${score.toFixed(0)} | ${loud.toString()} | ${zero.toString()} of ${banded.toString()} | ` +
        `${width === null ? '—' : width.toFixed(2)} |`
    );
  }

  console.log('\n### rule 451 — the verdict on the score');
  const netBase = netScores.get('in place') ?? Number.POSITIVE_INFINITY;
  const quietBase = quietScores.get('in place') ?? Number.POSITIVE_INFINITY;
  for (const arm of ARMS) {
    if (arm.key === 'in place') continue;
    const n = netScores.get(arm.key) ?? Number.POSITIVE_INFINITY;
    const q = quietScores.get(arm.key) ?? Number.POSITIVE_INFINITY;
    console.log(
      `  ${arm.key.padEnd(12)} net ${n.toFixed(1)} vs ${netBase.toFixed(1)} ${n < netBase ? 'BETTER' : 'worse '} · ` +
        `quiet ${q.toFixed(0)} vs ${quietBase.toFixed(0)} ${q < quietBase ? 'BETTER' : 'worse '} → ` +
        (n < netBase && q < quietBase ? 'PASSES rule 451(a)' : 'fails rule 451(a)')
    );
  }

  console.log('\n### rule 445 — the six, by name');
  for (const id of named) {
    const seen = namedTolls.get(id) ?? {};
    console.log(
      `  ${id.padEnd(11)} ` +
        ARMS.map((a) => `${a.key} ${(seen[a.key] ?? 0).toFixed(0).padStart(6)}`).join(' · ')
    );
  }
}

main();
