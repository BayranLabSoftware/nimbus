import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FaultType } from '../src/physics/events/earthquake/ruptureLength.js';
import { DEEP_INTERFACE_EARTHQUAKES } from '../src/physics/validation/deepInterfaceSetData.js';
import { NCEI_EARTHQUAKE_ROWS } from '../src/physics/validation/heldOutByRuleData.js';
import { MODERATE_EARTHQUAKES } from '../src/physics/validation/moderateSetData.js';
import { ATLAS_SEEN, type AtlasEarthquake } from '../src/physics/validation/atlasRules.js';
import { POINT_SOURCE_SEEN } from '../src/physics/validation/pointSourceRules.js';
import { POINT_SOURCE_EARTHQUAKES } from '../src/physics/validation/pointSourceSetData.js';
import { UNSEEN_EARTHQUAKES } from '../src/physics/validation/unseenSetData.js';
import { areasAbove, type Coverage } from './build-shakemap-fixtures.js';

/**
 * The earthquakes of rule 56 of `src/physics/validation/atlasRules.ts`.
 *
 * Every M 6 or larger event of 1973 to 1999, no deeper than 40 km, that USGS
 * ComCat holds a ShakeMap for, less the earthquakes the project had already
 * read: its preferred origin, magnitude and moment tensor (rules 1 to 3), its
 * ShakeMap's ground at MMI VII, VIII and IX (summed as `pnpm shakemap:build`
 * sums it), the weight the map's ground-motion model gave its
 * subduction-interface models (rule 35), how the map was drawn (stations,
 * intensity reports, a finite rupture or a point, the ShakeMap revision), and
 * the NCEI records within two minutes and 200 km of it (rule 23). Only those
 * numbers are written. Nothing here runs the simulator.
 *
 * Usage:
 *   pnpm exec tsx scripts/build-atlas-set.ts [cache directory]
 *
 * Every response is kept in the cache directory, named by the SHA-256 of its
 * URL as scripts/build-unseen-set.ts names it.
 */

const COMCAT = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const LIST = `${COMCAT}?format=geojson&starttime=1973-01-01&endtime=2000-01-01&minmagnitude=6&maxdepth=40&producttype=shakemap&orderby=time-asc`;
const NCEI =
  'https://www.ngdc.noaa.gov/hazel/hazard-service/api/v1/earthquakes?minYear=1973&maxYear=1999';
const COVERAGE = 'download/coverage_mmi_low_res.covjson';
const INFO = 'download/info.json';
const CONCURRENCY = 2;
const CACHE = resolve(process.argv[2] ?? join(tmpdir(), 'nimbus-atlas-set'));
const MATCH_SECONDS = 120;
const MATCH_KM = 200;

let bytes = 0;

class Gone extends Error {}

async function json(url: string): Promise<unknown> {
  const file = join(CACHE, `${createHash('sha256').update(url).digest('hex')}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')) as unknown;
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'nimbus-validation' } });
      if (res.status === 404 || res.status === 409) {
        throw new Gone(`fetch ${url}: ${res.status.toString()}`);
      }
      if (!res.ok) throw new Error(`fetch ${url}: ${res.status.toString()}`);
      const text = await res.text();
      const parsed = JSON.parse(text) as unknown;
      bytes += text.length;
      mkdirSync(CACHE, { recursive: true });
      writeFileSync(file, text);
      return parsed;
    } catch (error) {
      if (error instanceof Gone || attempt >= 8) throw error;
      await new Promise((r) => setTimeout(r, 15_000 * (attempt + 1)));
    }
  }
}

const clean = (x: number): number => Number(x.toPrecision(12));

function kmBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = p2 - p1;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

/** Rule 2's bins for one nodal plane's rake. */
function rakeBin(rake: number): FaultType {
  const r = ((((rake + 180) % 360) + 360) % 360) - 180;
  if (Math.abs(r) <= 30 || Math.abs(r) >= 150) return 'strike-slip';
  return r > 0 ? 'reverse' : 'normal';
}

interface ListFeature {
  id: string;
  properties: { ids: string; time: number };
}

interface Product {
  preferredWeight?: number;
  properties: Record<string, string | undefined>;
  contents: Record<string, { url: string } | undefined>;
}

interface Detail {
  id: string;
  geometry: { coordinates: [number, number, number] };
  properties: {
    time: number;
    mag: number;
    magType: string;
    place: string | null;
    products: Record<string, Product[] | undefined>;
  };
}

interface Info {
  input?: { event_information?: Record<string, unknown> };
  multigmpe?: { PGA?: { gmpes?: { name?: string }[]; weights?: number[] } };
  processing?: { shakemap_versions?: { shakemap_revision?: string } };
}

interface NceiItem {
  id: number;
  year: number;
  month: number;
  day: number;
  hour?: number | null;
  minute?: number | null;
  second?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  deaths?: number | null;
  missing?: number | null;
}

async function nceiItems(): Promise<NceiItem[]> {
  const items: NceiItem[] = [];
  for (let page = 1; ; page++) {
    const d = (await json(`${NCEI}&itemsPerPage=200&page=${page.toString()}`)) as {
      items: NceiItem[];
      totalPages: number;
    };
    items.push(...d.items);
    if (page >= d.totalPages) return items;
  }
}

/** Rule 23's window: two minutes and 200 km, or the same day and 200 km
 *  where the record gives no time of day. */
function withinWindow(item: NceiItem, timeMs: number, lat: number, lon: number): boolean {
  if (item.latitude == null || item.longitude == null) return false;
  if (kmBetween(item.latitude, item.longitude, lat, lon) > MATCH_KM) return false;
  if (item.hour == null) {
    const day = new Date(timeMs).toISOString().slice(0, 10);
    const recordDay = `${item.year.toString().padStart(4, '0')}-${item.month.toString().padStart(2, '0')}-${item.day.toString().padStart(2, '0')}`;
    return day === recordDay;
  }
  const t = Date.UTC(
    item.year,
    item.month - 1,
    item.day,
    item.hour,
    item.minute ?? 0,
    0,
    Math.round((item.second ?? 0) * 1_000)
  );
  return Math.abs(t - timeMs) <= MATCH_SECONDS * 1_000;
}

type Outcome =
  | { row: AtlasEarthquake }
  | { missing: string }
  | { noModel: string }
  | { gone: string };

async function one(id: string, ncei: readonly NceiItem[]): Promise<Outcome> {
  let d: Detail;
  try {
    d = (await json(`${COMCAT}?eventid=${id}&format=geojson`)) as Detail;
  } catch (error) {
    if (error instanceof Gone) return { gone: id };
    throw error;
  }
  const p = d.properties;
  const [lon, lat, depth] = d.geometry.coordinates;
  const shakemap = p.products.shakemap?.[0];
  const coverageUrl = shakemap?.contents[COVERAGE]?.url;
  const infoUrl = shakemap?.contents[INFO]?.url;
  if (shakemap === undefined || coverageUrl === undefined) return { missing: d.id };
  if (infoUrl === undefined) return { noModel: d.id };
  const info = (await json(infoUrl)) as Info;
  const sets = info.multigmpe?.PGA?.gmpes;
  if (sets === undefined) return { noModel: d.id };
  const weights = info.multigmpe?.PGA?.weights ?? [];
  let interfaceWeight = 0;
  const interfaceSets: string[] = [];
  sets.forEach((g, i) => {
    const name = g.name ?? '';
    if (!name.startsWith('subduction_interface')) return;
    interfaceWeight += weights[i] ?? 0;
    interfaceSets.push(name);
  });
  const tensors = p.products['moment-tensor'] ?? [];
  let faultType: FaultType = 'all';
  if (tensors.length > 0) {
    const best = tensors.reduce((a, b) =>
      (b.preferredWeight ?? 0) > (a.preferredWeight ?? 0) ? b : a
    );
    const r1 = best.properties['nodal-plane-1-rake'];
    const r2 = best.properties['nodal-plane-2-rake'];
    if (r1 !== undefined && r2 !== undefined) {
      const bins = new Set([rakeBin(Number(r1)), rakeBin(Number(r2))]);
      faultType = bins.size === 1 ? ([...bins][0] ?? 'all') : 'all';
    }
  }
  const coverage = (await json(coverageUrl)) as Coverage;
  const areas = areasAbove(coverage);
  const records = ncei.filter((item) => withinWindow(item, p.time, lat, lon));
  const event = info.input?.event_information ?? {};
  const count = (v: unknown): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  // A point rupture's reference is its origin; a finite one cites its source.
  const faultRef = typeof event.fault_ref === 'string' ? event.fault_ref.trim() : '';
  return {
    row: {
      comcat: d.id,
      time: new Date(p.time).toISOString().replace(/\.\d{3}Z$/, 'Z'),
      place: (p.place ?? '').replace(/\s+/g, ' ').trim(),
      magnitude: clean(p.mag),
      magnitudeType: p.magType,
      depthKm: clean(depth),
      latitude: clean(lat),
      longitude: clean(lon),
      faultType,
      maxMmi: Number(shakemap.properties.maxmmi ?? 'NaN'),
      areaKm2: { 7: areas[7] ?? 0, 8: areas[8] ?? 0, 9: areas[9] ?? 0 },
      ncei: records.map((r) => r.id).sort((a, b) => a - b),
      deaths: records.reduce((a, r) => a + (r.deaths ?? 0), 0),
      missing: records.reduce((a, r) => a + (r.missing ?? 0), 0),
      interfaceWeight: Number(interfaceWeight.toPrecision(6)),
      interfaceSet: interfaceSets.join('+'),
      stations: count(event.seismic_stations),
      reports: count(event.intensity_observations),
      finiteFault: faultRef !== '' && faultRef !== 'Origin',
      revision: info.processing?.shakemap_versions?.shakemap_revision ?? '',
    },
  };
}

function rowText(r: AtlasEarthquake): string {
  return `  [${JSON.stringify(r.comcat)}, ${JSON.stringify(r.time)}, ${JSON.stringify(r.place)}, ${r.magnitude.toString()}, ${JSON.stringify(r.magnitudeType)}, ${r.depthKm.toString()}, ${r.latitude.toString()}, ${r.longitude.toString()}, ${JSON.stringify(r.faultType)}, ${Number.isFinite(r.maxMmi) ? r.maxMmi.toFixed(2) : 'Number.NaN'}, ${r.areaKm2[7].toFixed(0)}, ${r.areaKm2[8].toFixed(0)}, ${r.areaKm2[9].toFixed(0)}, [${r.ncei.join(', ')}], ${r.deaths.toString()}, ${r.missing.toString()}, ${r.interfaceWeight.toString()}, ${JSON.stringify(r.interfaceSet)}, ${r.stations.toString()}, ${r.reports.toString()}, ${r.finiteFault.toString()}, ${JSON.stringify(r.revision)}],`;
}

async function main(): Promise<void> {
  const seen = new Set([
    ...NCEI_EARTHQUAKE_ROWS.map((r) => r.comcat),
    ...UNSEEN_EARTHQUAKES.map((q) => q.comcat),
    ...DEEP_INTERFACE_EARTHQUAKES.map((q) => q.comcat),
    ...MODERATE_EARTHQUAKES.map((q) => q.comcat),
    ...POINT_SOURCE_SEEN.map((s) => s.comcat),
    ...POINT_SOURCE_EARTHQUAKES.map((q) => q.comcat),
    ...ATLAS_SEEN.map((s) => s.comcat),
  ]);
  const listed = ((await json(LIST)) as { features: ListFeature[] }).features;
  const fresh = listed.filter(
    (f) => !seen.has(f.id) && !f.properties.ids.split(',').some((id) => id !== '' && seen.has(id))
  );
  const ncei = await nceiItems();
  const rows = new Map<string, AtlasEarthquake>();
  const missing: string[] = [];
  const noModel: string[] = [];
  const gone: string[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < fresh.length) {
        const feature = fresh[next++];
        if (feature === undefined) break;
        const result = await one(feature.id, ncei);
        if ('row' in result) rows.set(feature.id, result.row);
        else if ('missing' in result) missing.push(result.missing);
        else if ('noModel' in result) noModel.push(result.noModel);
        else gone.push(result.gone);
      }
    })
  );
  const order = new Map(fresh.map((f, i) => [f.id, i]));
  const sorted = [...rows.entries()]
    .sort(([a], [b]) => (order.get(a) ?? 0) - (order.get(b) ?? 0))
    .map(([, row]) => row);
  missing.sort();
  noModel.sort();
  gone.sort();
  const readOn = new Date().toISOString().slice(0, 10);
  const body = `// Generated by scripts/build-atlas-set.ts on ${readOn}. Do not edit by
// hand: rule 56 of atlasRules.ts says what these are and how they were
// read. USGS ComCat and ShakeMap (${COVERAGE}, ${INFO}), public domain;
// NOAA NCEI/WDS Global Significant Earthquake Database, doi:10.7289/V5TD9V7K.

import type { FaultType } from '../events/earthquake/ruptureLength.js';
import type { AtlasEarthquake } from './atlasRules.js';

export const ATLAS_READ_ON = '${readOn}';

/** Events rule 56's ComCat query returned on that day, before the
 *  earthquakes already read were taken out. */
export const ATLAS_LISTED = ${listed.length.toString()};

type Line = readonly [
  string, string, string, number, string, number, number, number, FaultType,
  number, number, number, number, readonly number[], number, number,
  number, string, number, number, boolean, string,
];

const quake = ([
  comcat, time, place, magnitude, magnitudeType, depthKm, latitude, longitude, faultType,
  maxMmi, a7, a8, a9, ncei, deaths, missing, interfaceWeight, interfaceSet, stations, reports,
  finiteFault, revision,
]: Line): AtlasEarthquake => ({
  comcat, time, place, magnitude, magnitudeType, depthKm, latitude, longitude, faultType,
  maxMmi, areaKm2: { 7: a7, 8: a8, 9: a9 }, ncei, deaths, missing,
  interfaceWeight, interfaceSet, stations, reports, finiteFault, revision,
});

/** Columns: ComCat event, origin time, place, magnitude and its type,
 *  depth (km), latitude, longitude, fault type, ShakeMap peak MMI, km² at
 *  or above MMI VII, VIII and IX, NCEI records in the window, their deaths
 *  and missing, the weight of the map's interface models and their names,
 *  seismic stations, intensity reports, whether the map was drawn on a
 *  finite rupture, and the ShakeMap revision. */
// prettier-ignore
const LINES: readonly Line[] = [
${sorted.map(rowText).join('\n')}
];

export const ATLAS_EARTHQUAKES: readonly AtlasEarthquake[] = LINES.map(quake);

/** Listed events whose preferred ShakeMap has no low-resolution MMI
 *  coverage, left out by rule 56. */
export const ATLAS_WITHOUT_COVERAGE: readonly string[] = ${JSON.stringify(missing)};

/** Listed events whose ShakeMap carries no model weights, left out. */
export const ATLAS_WITHOUT_MODEL: readonly string[] = ${JSON.stringify(noModel)};

/** Listed events ComCat would not serve that day, left out. */
export const ATLAS_UNREADABLE: readonly string[] = ${JSON.stringify(gone)};
`;
  const out = join(
    resolve(dirname(fileURLToPath(import.meta.url)), '..'),
    'src',
    'physics',
    'validation',
    'atlasSetData.ts'
  );
  writeFileSync(out, body);
  console.error(
    `listed ${listed.length.toString()}, fresh ${fresh.length.toString()}: wrote ${sorted.length.toString()}, ${missing.length.toString()} without coverage, ${noModel.length.toString()} without model weights, ${gone.length.toString()} unreadable; ${(bytes / 1e6).toFixed(1)} MB read → ${out}`
  );
}

await main();
