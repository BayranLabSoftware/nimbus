/**
 * Rule 306 of `src/physics/validation/strikeAgainstShakemapRules.ts`: does the
 * ShakeMap USGS published for each preset point where the strike lookup points?
 *
 * For each of the six presets the strike round is decided on, this fetches the
 * preferred ShakeMap's low-resolution MMI coverage from ComCat — the same
 * product and the same field `scripts/build-rule-shakemaps.ts` already reads —
 * measures the principal axis of its MMI VII footprint (rule 305), and puts it
 * beside the strike rules 295 to 303 find and beside due north.
 *
 * This answers question (a) of rule 304. Question (b), which runs ShakeMap
 * itself, is `scripts/benchmark/strike-scenario.ts` and rule 307.
 *
 *   pnpm exec tsx scripts/benchmark/strike-against-shakemap.ts [<out.json>]
 */

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  STRIKE_PRESETS,
  strikeDifferenceDeg,
} from '../../src/physics/validation/faultStrikeRules.js';
import {
  FOOTPRINT_MMI,
  MINIMUM_ASPECT_RATIO,
  footprintOrientation,
  type FootprintCell,
} from '../../src/physics/validation/strikeAgainstShakemapRules.js';
import { shippedSlabField } from '../../src/physics/validation/shippedSlab2.js';
import {
  decodeFault,
  faultTileKey,
  type FaultTileIndex,
  type PackedFault,
} from '../../src/physics/events/earthquake/faultLookup.js';
import { chooseStrike } from '../../src/physics/events/earthquake/strikeSource.js';
import {
  EARTHQUAKE_PRESETS,
  simulateEarthquake,
} from '../../src/physics/events/earthquake/simulate.js';
import type { Coverage } from '../build-shakemap-fixtures.js';

const EARTH_RADIUS_M = 6_371_000;

/** The day each preset happened, so its ComCat event can be found by time and
 *  place rather than by an identifier typed from memory. */
const WHEN: Record<string, { from: string; to: string; radiusKm: number }> = {
  TOHOKU_2011: { from: '2011-03-11', to: '2011-03-12', radiusKm: 200 },
  KUNLUN_2001: { from: '2001-11-14', to: '2001-11-15', radiusKm: 300 },
  SUMATRA_2004: { from: '2004-12-26', to: '2004-12-27', radiusKm: 300 },
  VALDIVIA_1960: { from: '1960-05-22', to: '1960-05-23', radiusKm: 400 },
  ALASKA_1964: { from: '1964-03-27', to: '1964-03-29', radiusKm: 400 },
  NEPAL_2015: { from: '2015-04-25', to: '2015-04-26', radiusKm: 200 },
};

async function json(url: string): Promise<unknown> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'nimbus-validation' } });
      if (!res.ok) throw new Error(`fetch ${url}: ${res.status.toString()}`);
      return await res.json();
    } catch (error) {
      if (attempt >= 3) throw error;
      await new Promise((r) => setTimeout(r, 2_000 * (attempt + 1)));
    }
  }
}

interface ComcatFeature {
  id: string;
  properties: { mag: number; place: string; time: number; products?: Record<string, unknown> };
}

/** The ComCat event of a preset, and its ShakeMap coverage URL, or null. */
async function findCoverageUrl(
  preset: string,
  latitude: number,
  longitude: number
): Promise<{ id: string; url: string; version: string } | null> {
  const when = WHEN[preset];
  if (when === undefined) return null;
  const search =
    `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson` +
    `&starttime=${when.from}&endtime=${when.to}&minmagnitude=7` +
    `&latitude=${latitude.toString()}&longitude=${longitude.toString()}` +
    `&maxradiuskm=${when.radiusKm.toString()}&orderby=magnitude`;
  const found = (await json(search)) as { features: ComcatFeature[] };
  for (const feature of found.features) {
    const detail = (await json(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&eventid=${feature.id}`
    )) as {
      properties: {
        products?: {
          shakemap?: {
            contents?: Record<string, { url?: string }>;
            properties?: Record<string, string>;
          }[];
        };
      };
    };
    const shakemap = detail.properties.products?.shakemap?.[0];
    const url = shakemap?.contents?.['download/coverage_mmi_low_res.covjson']?.url;
    if (url !== undefined) {
      return {
        id: feature.id,
        url,
        version: shakemap?.properties?.['process-timestamp'] ?? 'unknown',
      };
    }
  }
  return null;
}

/** Rule 305's cells: every coverage cell at or above MMI VII, with its area. */
function footprintCells(cov: Coverage, threshold: number): FootprintCell[] {
  const { x, y } = cov.domain.axes;
  const dx = (x.stop - x.start) / (x.num - 1);
  const dy = (y.stop - y.start) / (y.num - 1);
  const values = cov.ranges.MMI.values;
  const cells: FootprintCell[] = [];
  const latM = Math.abs(dy) * (Math.PI / 180) * EARTH_RADIUS_M;
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (v === null || v === undefined || v < threshold) continue;
    const row = Math.floor(i / x.num);
    const col = i - row * x.num;
    const latitude = y.start + row * dy;
    const longitude = x.start + col * dx;
    const areaM2 =
      latM * Math.abs(dx) * (Math.PI / 180) * EARTH_RADIUS_M * Math.cos((latitude * Math.PI) / 180);
    cells.push({ latitude, longitude, areaM2 });
  }
  return cells;
}

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const FAULT_DIR = join(ROOT, 'public', 'data', 'faults');
const faultIndex = JSON.parse(
  readFileSync(join(FAULT_DIR, 'index.json'), 'utf8')
) as FaultTileIndex;
const field = shippedSlabField();
if (field === null) throw new Error('no slab tiles: run scripts/build-slab2.py first');

const rows: Record<string, unknown>[] = [];
console.log(
  '| preset | evento | asse ShakeMap | allungamento | strike trovato | Δ strike | Δ nord | vince |'
);
console.log('| --- | --- | --: | --: | --: | --: | --: | --- |');

let elongated = 0;
let closer = 0;
const missing: string[] = [];

for (const p of STRIKE_PRESETS) {
  const presets = EARTHQUAKE_PRESETS as unknown as Record<
    string,
    { input: Parameters<typeof simulateEarthquake>[0] }
  >;
  const preset = presets[p.preset];
  if (preset === undefined) throw new Error(`no preset ${p.preset}`);
  const sim = simulateEarthquake(preset.input);
  const ruptureLengthM = sim.ruptureLength as number;
  const hypocentreDepthM = (preset.input.depth as number | undefined) ?? 10_000;

  const key = faultTileKey(p.latitude, p.longitude, faultIndex.tileDeg);
  const tilePath = join(FAULT_DIR, `${key}.json`);
  const packed = existsSync(tilePath)
    ? (JSON.parse(readFileSync(tilePath, 'utf8')) as { faults: PackedFault[] }).faults
    : [];
  const faults = packed.map((f) => decodeFault(f, faultIndex)).filter((f) => f !== null);
  const answer = chooseStrike(
    { latitude: p.latitude, longitude: p.longitude, hypocentreDepthM, ruptureLengthM },
    field,
    faults
  );

  const found = await findCoverageUrl(p.preset, p.latitude, p.longitude);
  if (found === null) {
    missing.push(p.name);
    console.log(`| ${p.name} | — | — | — | — | — | — | nessuna ShakeMap pubblicata |`);
    rows.push({ preset: p.preset, name: p.name, shakemap: null });
    continue;
  }
  const cov = (await json(found.url)) as Coverage;
  const orientation = footprintOrientation(footprintCells(cov, FOOTPRINT_MMI));
  if (orientation === null) {
    missing.push(`${p.name} (nessuna cella sopra MMI ${FOOTPRINT_MMI.toString()})`);
    console.log(`| ${p.name} | ${found.id} | — | — | — | — | — | nessun contorno MMI VII |`);
    rows.push({ preset: p.preset, name: p.name, event: found.id, footprint: null });
    continue;
  }

  const dStrike =
    answer.strikeDeg === null
      ? Number.NaN
      : strikeDifferenceDeg(answer.strikeDeg, orientation.axisDeg);
  const dNorth = strikeDifferenceDeg(0, orientation.axisDeg);
  const isElongated = orientation.aspectRatio >= MINIMUM_ASPECT_RATIO;
  if (isElongated) {
    elongated += 1;
    if (dStrike < dNorth) closer += 1;
  }
  console.log(
    `| ${p.name} | ${found.id} | ${orientation.axisDeg.toFixed(1)}° | ${orientation.aspectRatio.toFixed(2)} | ${answer.strikeDeg?.toFixed(1) ?? '—'}° | **${dStrike.toFixed(1)}°** | ${dNorth.toFixed(1)}° | ${isElongated ? (dStrike < dNorth ? 'strike' : 'NORD') : '(tondo)'} |`
  );
  rows.push({
    preset: p.preset,
    name: p.name,
    event: found.id,
    shakemapProcessed: found.version,
    axisDeg: orientation.axisDeg,
    aspectRatio: orientation.aspectRatio,
    cells: orientation.cells,
    areaKm2: orientation.areaM2 / 1e6,
    strikeDeg: answer.strikeDeg,
    strikeSource: answer.source,
    publishedStrikeDeg: p.publishedStrikeDeg,
    deltaStrikeDeg: dStrike,
    deltaNorthDeg: dNorth,
    elongated: isElongated,
  });
}

console.log('');
console.log(
  `306(a) più vicino del nord su ${closer.toString()}/${elongated.toString()} allungate  ->  ${closer === elongated && elongated > 0 ? 'DENTRO' : 'FUORI'}`
);
if (missing.length > 0) console.log(`senza mappa o senza contorno: ${missing.join('; ')}`);

const out = process.argv[2];
if (out !== undefined) {
  writeFileSync(out, `${JSON.stringify({ readOn: new Date().toISOString(), rows }, null, 1)}\n`);
  console.log(`scritto ${out}`);
}
