import {
  EARTHQUAKE_PRESETS,
  intensityLawOf,
  simulateEarthquake,
  type ContourLaw,
  type EarthquakeScenarioInput,
  type ExtendedSource,
} from '../src/physics/events/earthquake/simulate.js';
import { areaAbove, type RuptureFootprint } from '../src/physics/events/earthquake/shakingField.js';
import { fitShakingField } from '../src/scene/globe/shakingOverlay.js';
import type { AtlasEarthquake } from '../src/physics/validation/atlasRules.js';
import { shippedStrikeAnswer } from '../src/physics/validation/shippedFaults.js';
import { shippedSiteLookup } from '../src/physics/validation/shippedVs30.js';
import { SHAKEMAP_FOOTPRINTS } from '../src/physics/validation/shakemapFixtures.js';
import { NET_SITES } from '../src/physics/validation/siteVs30Data.js';
import { widerJury } from '../src/physics/validation/widerFootprintRules.js';
import {
  EXTENDED_SOURCE_CELLS,
  EXTENDED_SOURCE_MARGIN,
  magnitudeCell,
  worstCell,
} from '../src/physics/validation/extendedSourceRules.js';
import { countMagnitudeInversions } from '../src/physics/validation/propertyPrecedenceRules.js';
import {
  compareWithRecord,
  RECORDED_EVENTS,
  type RecordedEvent,
} from '../src/physics/validation/recordedTolls.js';
import type { Meters } from '../src/physics/units.js';

/**
 * The round of rules 412 to 418: the rupture stadium at every magnitude,
 * against the disc below Mw 7.5.
 *
 * Nothing here chooses anything. It measures and prints; the verdict is
 * read off rule 416's five clauses, which were written and pushed first.
 *
 * Usage:
 *   pnpm exec tsx scripts/extended-source-round.ts [--dead-only]
 */

const GEOMETRIES: readonly ExtendedSource[] = ['fromMw7.5', 'always'];
const LAWS: readonly ContourLaw[] = ['boore2014', 'campbellBozorgnia2014'];
/** Rule 415: the geometry is decided on the law the product draws. */
const DECIDING_LAW: ContourLaw = 'boore2014';
const THRESHOLDS = [7, 8, 9] as const;
type Threshold = (typeof THRESHOLDS)[number];

interface Band {
  event: string;
  cell: string;
  threshold: Threshold;
  observedKm2: number;
  modelKm2: number;
}

type Key = `${ContourLaw}/${ExtendedSource}`;
const keyOf = (law: ContourLaw, geometry: ExtendedSource): Key => `${law}/${geometry}`;

function fieldAreasKm2(
  input: EarthquakeScenarioInput,
  latitude: number,
  longitude: number,
  site: NonNullable<ReturnType<typeof shippedSiteLookup>>
): Record<Threshold, number> | null {
  const result = simulateEarthquake(input);
  const law = intensityLawOf(result);
  if (law === null) return null;
  const answer = shippedStrikeAnswer(
    latitude,
    longitude,
    (result.inputs.depth as number | undefined) ?? 10_000,
    result.ruptureLength
  );
  const rupture: RuptureFootprint = {
    latitude,
    longitude,
    strikeDeg: result.inputs.strikeAzimuthDeg ?? answer.strikeDeg ?? 0,
    halfLengthM: result.isExtendedSource ? (result.ruptureLength as number) / 2 : 0,
    halfWidthM: result.isExtendedSource ? (result.ruptureWidth as number) / 2 : 0,
  };
  const { field } = fitShakingField({
    rupture,
    intensityAt: law,
    siteAt: (lat, lon) => ({ vs30: site(lat, lon).vs30, provenance: 'grid' as const }),
  });
  const out = {} as Record<Threshold, number>;
  for (const t of THRESHOLDS) out[t] = areaAbove(field, t) / 1e6;
  return out;
}

/** Rule 409's statistic, unchanged: the geometric mean of the AREA ratio
 *  with the sample standard deviation of its logarithm. */
function score(bands: readonly Band[]): { bands: number; bias: number; sdLn: number } {
  const logs = bands
    .filter((b) => b.observedKm2 > 0 && b.modelKm2 > 0)
    .map((b) => Math.log(b.modelKm2 / b.observedKm2));
  if (logs.length < 2) return { bands: logs.length, bias: Number.NaN, sdLn: Number.NaN };
  const mean = logs.reduce((a, b) => a + b, 0) / logs.length;
  return {
    bands: logs.length,
    bias: Math.exp(mean),
    sdLn: Math.sqrt(logs.reduce((a, b) => a + (b - mean) ** 2, 0) / (logs.length - 1)),
  };
}

/** Rule 416(a) and (b): the bias in each of the repository's three cells. */
function biasByCell(bands: readonly Band[]): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const cell of EXTENDED_SOURCE_CELLS) {
    const s = score(bands.filter((b) => b.cell === cell.label));
    out[cell.label] = Number.isFinite(s.bias) ? s.bias : null;
  }
  return out;
}

/** Rule 412: the scenario the product builds for a ComCat row. */
function scenarioFor(
  event: AtlasEarthquake,
  law: ContourLaw,
  geometry: ExtendedSource
): EarthquakeScenarioInput {
  return {
    magnitude: event.magnitude,
    depth: (Math.max(0, event.depthKm) * 1_000) as Meters,
    faultType: event.faultType,
    contourLaw: law,
    extendedSource: geometry,
  };
}

/** Rule 416(d): the same row, drawn as a stadium at every magnitude. */
function asAStadiumAtEveryMagnitude(event: RecordedEvent): RecordedEvent {
  const run = event.run;
  return {
    ...event,
    run: () => {
      const result = run();
      if (result.type !== 'earthquake') return result;
      return {
        type: 'earthquake',
        data: simulateEarthquake({ ...result.data.inputs, extendedSource: 'always' }),
      };
    },
  };
}

const NET_ROW_NAME: Readonly<Record<string, string>> = {
  'Gorkha 2015': 'Gorkha (Nepal) 2015',
  'Kokoxili 2001': 'Kokoxili (Kunlun) 2001',
};

function theDead(): void {
  console.log('\n### rule 416(d) — the dead, on the net rows of rule 11');
  const rows = RECORDED_EVENTS;
  let inPlaceIn = 0;
  let candidateIn = 0;
  const lost: string[] = [];
  const gained: string[] = [];
  let moved = 0;
  for (const row of rows) {
    const a = compareWithRecord(row);
    const b = compareWithRecord(asAStadiumAtEveryMagnitude(row));
    if (a.deaths !== b.deaths) moved += 1;
    if (a.contains) inPlaceIn += 1;
    if (b.contains) candidateIn += 1;
    if (a.contains && !b.contains) lost.push(row.name);
    if (!a.contains && b.contains) gained.push(row.name);
  }
  console.log(`  rows ${rows.length.toString()}, of which the geometry moves ${moved.toString()}`);
  console.log(
    `  inside their band: in place ${inPlaceIn.toString()}, candidate ${candidateIn.toString()}`
  );
  console.log(`  lost:   ${lost.length === 0 ? 'none' : lost.join(', ')}`);
  console.log(`  gained: ${gained.length === 0 ? 'none' : gained.join(', ')}`);
  const pass = candidateIn >= inPlaceIn && lost.length === 0;
  console.log(`  rule 416(d) → ${pass ? 'PASS' : 'FAIL'}`);
}

function main(): void {
  const site = shippedSiteLookup();
  if (site === null) {
    console.error('The shipped Vs30 tiles are absent; rule 414 asks for the ground the browser');
    console.error('reads. Build public/data/vs30 first.');
    process.exit(1);
  }
  if (process.argv.includes('--dead-only')) {
    theDead();
    return;
  }

  const jury = widerJury();
  const wide = new Map<Key, Band[]>();
  const six = new Map<Key, Band[]>();
  for (const law of LAWS)
    for (const g of GEOMETRIES) {
      wide.set(keyOf(law, g), []);
      six.set(keyOf(law, g), []);
    }

  let done = 0;
  for (const event of jury) {
    const cell = magnitudeCell(event.magnitude);
    for (const law of LAWS)
      for (const g of GEOMETRIES) {
        const areas = fieldAreasKm2(
          scenarioFor(event, law, g),
          event.latitude,
          event.longitude,
          site
        );
        if (areas === null) continue;
        for (const t of THRESHOLDS)
          wide.get(keyOf(law, g))?.push({
            event: event.comcat,
            cell,
            threshold: t,
            observedKm2: event.areaKm2[t],
            modelKm2: areas[t],
          });
      }
    done += 1;
    if (done % 25 === 0) console.log(`  … ${done.toString()} of ${jury.length.toString()}`);
  }

  for (const f of SHAKEMAP_FOOTPRINTS) {
    const preset = EARTHQUAKE_PRESETS[f.preset as keyof typeof EARTHQUAKE_PRESETS];
    const spot = NET_SITES.find((s) => s.key === (NET_ROW_NAME[f.name] ?? f.name));
    if (spot === undefined) continue;
    const cell = magnitudeCell(preset.input.magnitude);
    for (const law of LAWS)
      for (const g of GEOMETRIES) {
        const areas = fieldAreasKm2(
          { ...preset.input, contourLaw: law, extendedSource: g },
          spot.latitude,
          spot.longitude,
          site
        );
        if (areas === null) continue;
        for (const t of THRESHOLDS)
          six.get(keyOf(law, g))?.push({
            event: f.name,
            cell,
            threshold: t,
            observedKm2: f.areaKm2[t],
            modelKm2: areas[t],
          });
      }
  }

  const table = (title: string, by: Map<Key, Band[]>): void => {
    console.log(`\n### ${title}`);
    const cells = EXTENDED_SOURCE_CELLS.map((c) => c.label);
    console.log(`| law | geometry | bands | mean | scatter | ${cells.join(' | ')} |`);
    console.log(`| --- | --- | --- | --- | --- | ${cells.map(() => '---').join(' | ')} |`);
    for (const law of LAWS)
      for (const g of GEOMETRIES) {
        const bands = by.get(keyOf(law, g)) ?? [];
        const s = score(bands);
        const cellBias = biasByCell(bands);
        const cols = cells.map((c) => {
          const v = cellBias[c];
          return v === null || v === undefined ? '—' : `${v.toFixed(2)}x`;
        });
        console.log(
          `| ${law} | ${g} | ${s.bands.toString()} | ${s.bias.toFixed(3)}x | ` +
            `${s.sdLn.toFixed(3)} | ${cols.join(' | ')} |`
        );
      }
  };

  table(`the jury of ${jury.length.toString()} — rules 412 to 416`, wide);
  table('the six fixtures, deciding nothing', six);

  // --- rule 416, clause by clause, on the deciding law -------------------
  const a = wide.get(keyOf(DECIDING_LAW, 'fromMw7.5')) ?? [];
  const b = wide.get(keyOf(DECIDING_LAW, 'always')) ?? [];
  const wa = worstCell(biasByCell(a));
  const wb = worstCell(biasByCell(b));
  console.log(`\n### rule 416, clause by clause (${DECIDING_LAW})`);
  console.log(
    `  (a) worst cell: in place ${wa?.label ?? '—'} ${wa?.distance.toFixed(3) ?? '—'}, ` +
      `candidate ${wb?.label ?? '—'} ${wb?.distance.toFixed(3) ?? '—'} → ` +
      (wa !== null && wb !== null && wa.distance - wb.distance >= EXTENDED_SOURCE_MARGIN
        ? 'PASS'
        : 'FAIL')
  );
  const cellA = biasByCell(a);
  const cellB = biasByCell(b);
  const worsened: string[] = [];
  for (const cell of EXTENDED_SOURCE_CELLS.map((c) => c.label)) {
    const x = cellA[cell];
    const y = cellB[cell];
    if (x === null || x === undefined || y === null || y === undefined) continue;
    const grew = Math.abs(Math.log(y)) - Math.abs(Math.log(x));
    console.log(
      `      ${cell}: ${x.toFixed(3)}x → ${y.toFixed(3)}x  (|ln| ${grew >= 0 ? '+' : ''}${grew.toFixed(3)})`
    );
    if (grew > EXTENDED_SOURCE_MARGIN) worsened.push(cell);
  }
  console.log(
    `  (b) no cell worse by more than ${EXTENDED_SOURCE_MARGIN.toFixed(2)}: ` +
      (worsened.length === 0 ? 'none worsened → PASS' : `${worsened.join(', ')} → FAIL`)
  );
  const sa = score(a);
  const sb = score(b);
  const centred = Math.abs(Math.log(sb.bias)) <= Math.abs(Math.log(sa.bias));
  console.log(
    `  (c) overall: ${sa.bias.toFixed(3)}x/${sa.sdLn.toFixed(3)} → ${sb.bias.toFixed(3)}x/${sb.sdLn.toFixed(3)} → ` +
      (centred && sb.sdLn <= sa.sdLn ? 'PASS' : 'FAIL') +
      `${centred ? '' : ' (bias)'}${sb.sdLn <= sa.sdLn ? '' : ' (scatter)'}`
  );

  // (e) monotonicity, on the radius as P-MONO-MW reads it and on the area,
  // which no test has ever asked.
  for (const g of GEOMETRIES) {
    const radius = (magnitude: number): number =>
      simulateEarthquake({ magnitude, contourLaw: DECIDING_LAW, extendedSource: g }).shaking
        .mmi7Radius || 0;
    const area = (magnitude: number): number => {
      const r = simulateEarthquake({ magnitude, contourLaw: DECIDING_LAW, extendedSource: g });
      const rad = ((r.shaking.mmi7Radius as number) || 0) / 1_000;
      if (!(rad > 0)) return 0;
      if (!r.isExtendedSource) return Math.PI * rad * rad;
      const l = (r.ruptureLength as number) / 1_000;
      const w = (r.ruptureWidth as number) / 1_000;
      return l * w + 2 * rad * (l + w) + Math.PI * rad * rad;
    };
    const mr = countMagnitudeInversions(radius);
    const ma = countMagnitudeInversions(area);
    console.log(
      `  (e) ${g.padEnd(10)} radius ${mr.inversions.toString()} inversions, ` +
        `area ${ma.inversions.toString()} inversions (worst jump ${ma.worstDropKm.toFixed(0)})`
    );
  }

  theDead();
}

main();
