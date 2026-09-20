import {
  EARTHQUAKE_PRESETS,
  intensityLawOf,
  simulateEarthquake,
  type ContourLaw,
  type EarthquakeScenarioInput,
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
import { cellsThatFlippedSign } from '../src/physics/validation/surfaceProjectionRules.js';
import { countMagnitudeInversions } from '../src/physics/validation/propertyPrecedenceRules.js';
import {
  compareWithRecord,
  RECORDED_EVENTS,
  type RecordedEvent,
} from '../src/physics/validation/recordedTolls.js';
import type { Meters } from '../src/physics/units.js';

/**
 * The round of rules 419 to 426: the stadium laid on the rupture's surface
 * projection.
 *
 * Three arms, one run. Nothing here chooses anything — it measures and
 * prints, and the verdict is read off rule 424's six clauses, which were
 * written and pushed first.
 *
 * Usage:
 *   pnpm exec tsx scripts/surface-projection-round.ts
 */

/** Rule 420's arms. The first is the geometry in place. */
const ARMS = [
  { key: 'in place', settings: {} },
  { key: 'A projection', settings: { stadiumWidth: 'surfaceProjection' } },
  {
    key: 'B projection+always',
    settings: { stadiumWidth: 'surfaceProjection', extendedSource: 'always' },
  },
] as const satisfies readonly {
  key: string;
  settings: Partial<Pick<EarthquakeScenarioInput, 'stadiumWidth' | 'extendedSource'>>;
}[];
type ArmKey = (typeof ARMS)[number]['key'];

const LAWS: readonly ContourLaw[] = ['boore2014', 'campbellBozorgnia2014'];
/** Rule 422: the geometry is decided on the law the product draws. */
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

type Key = `${ContourLaw}|${ArmKey}`;
const keyOf = (law: ContourLaw, arm: ArmKey): Key => `${law}|${arm}`;

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
    halfWidthM: result.isExtendedSource ? (result.ruptureFootprintWidth as number) / 2 : 0,
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

function biasByCell(bands: readonly Band[]): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const cell of EXTENDED_SOURCE_CELLS) {
    const s = score(bands.filter((b) => b.cell === cell.label));
    out[cell.label] = Number.isFinite(s.bias) ? s.bias : null;
  }
  return out;
}

function scenarioFor(
  event: AtlasEarthquake,
  law: ContourLaw,
  settings: Partial<EarthquakeScenarioInput>
): EarthquakeScenarioInput {
  return {
    magnitude: event.magnitude,
    depth: (Math.max(0, event.depthKm) * 1_000) as Meters,
    faultType: event.faultType,
    contourLaw: law,
    ...settings,
  };
}

function withSettings(
  event: RecordedEvent,
  settings: Partial<EarthquakeScenarioInput>
): RecordedEvent {
  const run = event.run;
  return {
    ...event,
    run: () => {
      const result = run();
      if (result.type !== 'earthquake') return result;
      return {
        type: 'earthquake',
        data: simulateEarthquake({ ...result.data.inputs, ...settings }),
      };
    },
  };
}

const NET_ROW_NAME: Readonly<Record<string, string>> = {
  'Gorkha 2015': 'Gorkha (Nepal) 2015',
  'Kokoxili 2001': 'Kokoxili (Kunlun) 2001',
};

/** Rule 424(d), on every arm. */
function theDead(): void {
  console.log('\n### rule 424(d) — the dead, on the net rows');
  const base = RECORDED_EVENTS.map((row) => compareWithRecord(row));
  const inPlaceIn = base.filter((c) => c.contains).length;
  for (const arm of ARMS) {
    if (arm.key === 'in place') continue;
    const lost: string[] = [];
    const gained: string[] = [];
    let moved = 0;
    let inside = 0;
    RECORDED_EVENTS.forEach((row, i) => {
      const a = base[i];
      if (a === undefined) return;
      const b = compareWithRecord(withSettings(row, arm.settings));
      if (a.deaths !== b.deaths) moved += 1;
      if (b.contains) inside += 1;
      if (a.contains && !b.contains) lost.push(row.name);
      if (!a.contains && b.contains) gained.push(row.name);
    });
    const pass = inside >= inPlaceIn && lost.length === 0;
    console.log(
      `  ${arm.key.padEnd(20)} moves ${moved.toString().padStart(2)} rows, inside ${inside.toString()} ` +
        `against ${inPlaceIn.toString()} · lost ${lost.length === 0 ? 'none' : lost.join(', ')} · ` +
        `gained ${gained.length === 0 ? 'none' : gained.join(', ')} → ${pass ? 'PASS' : 'FAIL'}`
    );
  }
}

function main(): void {
  const site = shippedSiteLookup();
  if (site === null) {
    console.error('The shipped Vs30 tiles are absent; rule 422 asks for the ground the browser');
    console.error('reads. Build public/data/vs30 first.');
    process.exit(1);
  }
  const jury = widerJury();
  const wide = new Map<Key, Band[]>();
  const six = new Map<Key, Band[]>();
  for (const law of LAWS)
    for (const arm of ARMS) {
      wide.set(keyOf(law, arm.key), []);
      six.set(keyOf(law, arm.key), []);
    }

  let done = 0;
  for (const event of jury) {
    const cell = magnitudeCell(event.magnitude);
    for (const law of LAWS)
      for (const arm of ARMS) {
        const areas = fieldAreasKm2(
          scenarioFor(event, law, arm.settings),
          event.latitude,
          event.longitude,
          site
        );
        if (areas === null) continue;
        for (const t of THRESHOLDS)
          wide.get(keyOf(law, arm.key))?.push({
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
      for (const arm of ARMS) {
        const areas = fieldAreasKm2(
          { ...preset.input, contourLaw: law, ...arm.settings },
          spot.latitude,
          spot.longitude,
          site
        );
        if (areas === null) continue;
        for (const t of THRESHOLDS)
          six.get(keyOf(law, arm.key))?.push({
            event: f.name,
            cell,
            threshold: t,
            observedKm2: f.areaKm2[t],
            modelKm2: areas[t],
          });
      }
  }

  const table = (title: string, by: Map<Key, Band[]>): void => {
    const cells = EXTENDED_SOURCE_CELLS.map((c) => c.label);
    console.log(`\n### ${title}`);
    console.log(`| law | arm | bands | mean | scatter | ${cells.join(' | ')} |`);
    console.log(`| --- | --- | --- | --- | --- | ${cells.map(() => '---').join(' | ')} |`);
    for (const law of LAWS)
      for (const arm of ARMS) {
        const bands = by.get(keyOf(law, arm.key)) ?? [];
        const s = score(bands);
        const cb = biasByCell(bands);
        const cols = cells.map((c) => {
          const v = cb[c];
          return v === null || v === undefined ? '—' : `${v.toFixed(2)}x`;
        });
        console.log(
          `| ${law} | ${arm.key} | ${s.bands.toString()} | ${s.bias.toFixed(3)}x | ` +
            `${s.sdLn.toFixed(3)} | ${cols.join(' | ')} |`
        );
      }
  };

  table(`the jury of ${jury.length.toString()} — rules 419 to 424`, wide);
  table('the six fixtures, deciding nothing', six);

  const inPlace = wide.get(keyOf(DECIDING_LAW, 'in place')) ?? [];
  const cellsIn = biasByCell(inPlace);
  const worstIn = worstCell(cellsIn);
  const sIn = score(inPlace);
  console.log(`\n### rule 424, clause by clause (${DECIDING_LAW})`);
  for (const arm of ARMS) {
    if (arm.key === 'in place') continue;
    const bands = wide.get(keyOf(DECIDING_LAW, arm.key)) ?? [];
    const cellsOut = biasByCell(bands);
    const worstOut = worstCell(cellsOut);
    const s = score(bands);
    console.log(`\n  ${arm.key}`);
    const a =
      worstIn !== null &&
      worstOut !== null &&
      worstIn.distance - worstOut.distance >= EXTENDED_SOURCE_MARGIN;
    console.log(
      `    (a) worst cell ${worstIn?.label ?? '—'} ${worstIn?.distance.toFixed(3) ?? '—'} → ` +
        `${worstOut?.label ?? '—'} ${worstOut?.distance.toFixed(3) ?? '—'} → ${a ? 'PASS' : 'FAIL'}`
    );
    const worsened: string[] = [];
    for (const cell of EXTENDED_SOURCE_CELLS.map((c) => c.label)) {
      const x = cellsIn[cell];
      const y = cellsOut[cell];
      if (x === null || x === undefined || y === null || y === undefined) continue;
      const grew = Math.abs(Math.log(y)) - Math.abs(Math.log(x));
      console.log(
        `        ${cell}: ${x.toFixed(3)}x → ${y.toFixed(3)}x  (|ln| ${grew >= 0 ? '+' : ''}${grew.toFixed(3)})`
      );
      if (grew > EXTENDED_SOURCE_MARGIN) worsened.push(cell);
    }
    console.log(
      `    (b) no cell worse: ${worsened.length === 0 ? 'none → PASS' : `${worsened.join(', ')} → FAIL`}`
    );
    const centred = Math.abs(Math.log(s.bias)) <= Math.abs(Math.log(sIn.bias));
    console.log(
      `    (c) overall ${sIn.bias.toFixed(3)}x/${sIn.sdLn.toFixed(3)} → ${s.bias.toFixed(3)}x/${s.sdLn.toFixed(3)} → ` +
        (centred && s.sdLn <= sIn.sdLn ? 'PASS' : 'FAIL')
    );
    const flipped = cellsThatFlippedSign(cellsIn, cellsOut);
    console.log(
      `    (f) no cell trades under for over: ${flipped.length === 0 ? 'none → PASS' : `${flipped.join(', ')} → FAIL`}`
    );
    const mono = countMagnitudeInversions(
      (magnitude) =>
        simulateEarthquake({ magnitude, contourLaw: DECIDING_LAW, ...arm.settings }).shaking
          .mmi7Radius || 0
    );
    console.log(`    (e) monotonicity: ${mono.inversions.toString()} inversions`);
  }

  theDead();
}

main();
