import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FaultType } from '../src/physics/events/earthquake/ruptureLength.js';
import type { UnseenEarthquake } from '../src/physics/validation/depthRules.js';
import { NCEI_EARTHQUAKE_ROWS } from '../src/physics/validation/heldOutByRuleData.js';
import { areasAbove, type Coverage } from './build-shakemap-fixtures.js';

/**
 * The earthquakes of rule 23 of `src/physics/validation/depthRules.ts`.
 *
 * Every M ≥ 6 event of 2008 to 2025, no deeper than 40 km, that USGS
 * ComCat holds a ShakeMap for and rule 11's set does not hold: its
 * preferred origin, magnitude and moment tensor (rules 1 to 3), its
 * ShakeMap's ground at MMI VII, VIII and IX (summed as
 * `pnpm shakemap:build` sums it), and the NCEI records within two
 * minutes and 200 km of it. Only those numbers are written. Nothing
 * here runs the simulator.
 *
 * Usage:
 *   pnpm exec tsx scripts/build-unseen-set.ts
 *
 * ComCat and ShakeMap revise their products, and NCEI its records; the
 * file in the repository is the one the rules were applied to, and it
 * records the day it was read.
 */

const COMCAT = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const LIST = `${COMCAT}?format=geojson&starttime=2008-01-01&endtime=2026-01-01&minmagnitude=6&maxdepth=40&producttype=shakemap&orderby=time-asc`;
const NCEI =
  'https://www.ngdc.noaa.gov/hazel/hazard-service/api/v1/earthquakes?minYear=2008&maxYear=2025';
const COVERAGE = 'download/coverage_mmi_low_res.covjson';
const CONCURRENCY = 4;
const MATCH_SECONDS = 120;
const MATCH_KM = 200;

let bytes = 0;

async function json(url: string): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'nimbus-validation' } });
      if (!res.ok) throw new Error(`fetch ${url}: ${res.status.toString()}`);
      const text = await res.text();
      bytes += text.length;
      return JSON.parse(text) as unknown;
    } catch (error) {
      if (attempt >= 4) throw error;
      await new Promise((r) => setTimeout(r, 2_000 * (attempt + 1)));
    }
  }
}

/** A float without its binary noise, as the Python row script writes it. */
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

async function one(
  id: string,
  ncei: readonly NceiItem[]
): Promise<{ row: UnseenEarthquake } | { missing: string }> {
  const d = (await json(`${COMCAT}?eventid=${id}&format=geojson`)) as Detail;
  const p = d.properties;
  const [lon, lat, depth] = d.geometry.coordinates;
  const shakemap = p.products.shakemap?.[0];
  const url = shakemap?.contents[COVERAGE]?.url;
  if (shakemap === undefined || url === undefined) return { missing: d.id };
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
  const coverage = (await json(url)) as Coverage;
  const areas = areasAbove(coverage);
  const records = ncei.filter((item) => withinWindow(item, p.time, lat, lon));
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
    },
  };
}

function rowText(r: UnseenEarthquake): string {
  return `  [${JSON.stringify(r.comcat)}, ${JSON.stringify(r.time)}, ${JSON.stringify(r.place)}, ${r.magnitude.toString()}, ${JSON.stringify(r.magnitudeType)}, ${r.depthKm.toString()}, ${r.latitude.toString()}, ${r.longitude.toString()}, ${JSON.stringify(r.faultType)}, ${Number.isFinite(r.maxMmi) ? r.maxMmi.toFixed(2) : 'Number.NaN'}, ${r.areaKm2[7].toFixed(0)}, ${r.areaKm2[8].toFixed(0)}, ${r.areaKm2[9].toFixed(0)}, [${r.ncei.join(', ')}], ${r.deaths.toString()}, ${r.missing.toString()}],`;
}

async function main(): Promise<void> {
  const seen = new Set(NCEI_EARTHQUAKE_ROWS.map((r) => r.comcat));
  const listed = ((await json(LIST)) as { features: ListFeature[] }).features;
  const unseen = listed.filter(
    (f) => !seen.has(f.id) && !f.properties.ids.split(',').some((id) => id !== '' && seen.has(id))
  );
  const ncei = await nceiItems();
  const rows = new Map<string, UnseenEarthquake>();
  const missing: string[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < unseen.length) {
        const feature = unseen[next++];
        if (feature === undefined) break;
        const result = await one(feature.id, ncei);
        if ('row' in result) rows.set(feature.id, result.row);
        else missing.push(result.missing);
      }
    })
  );
  const order = new Map(unseen.map((f, i) => [f.id, i]));
  const sorted = [...rows.entries()]
    .sort(([a], [b]) => (order.get(a) ?? 0) - (order.get(b) ?? 0))
    .map(([, row]) => row);
  missing.sort();
  const readOn = new Date().toISOString().slice(0, 10);
  const body = `// Generated by scripts/build-unseen-set.ts on ${readOn}. Do not edit by
// hand: rule 23 of depthRules.ts says what these are and how they were
// read. USGS ComCat and ShakeMap (${COVERAGE}), public domain; NOAA
// NCEI/WDS Global Significant Earthquake Database, doi:10.7289/V5TD9V7K.

import type { FaultType } from '../events/earthquake/ruptureLength.js';
import type { UnseenEarthquake } from './depthRules.js';

export const UNSEEN_READ_ON = '${readOn}';

/** Events the ComCat query of rule 23 returned on that day, before rule
 *  11's were taken out. */
export const UNSEEN_LISTED = ${listed.length.toString()};

type Line = readonly [
  string, string, string, number, string, number, number, number, FaultType,
  number, number, number, number, readonly number[], number, number,
];

const quake = ([
  comcat, time, place, magnitude, magnitudeType, depthKm, latitude, longitude, faultType,
  maxMmi, a7, a8, a9, ncei, deaths, missing,
]: Line): UnseenEarthquake => ({
  comcat, time, place, magnitude, magnitudeType, depthKm, latitude, longitude, faultType,
  maxMmi, areaKm2: { 7: a7, 8: a8, 9: a9 }, ncei, deaths, missing,
});

/** Columns: ComCat event, origin time, place, magnitude and its type,
 *  depth (km), latitude, longitude, fault type, ShakeMap peak MMI, km² at
 *  or above MMI VII, VIII and IX, NCEI records in the window, their
 *  deaths and missing. */
// prettier-ignore
const LINES: readonly Line[] = [
${sorted.map(rowText).join('\n')}
];

export const UNSEEN_EARTHQUAKES: readonly UnseenEarthquake[] = LINES.map(quake);

/** Events of the set whose preferred ShakeMap has no low-resolution MMI
 *  coverage, left out by rule 23. */
export const UNSEEN_WITHOUT_COVERAGE: readonly string[] = [
${missing.map((id) => `  ${JSON.stringify(id)},`).join('\n')}
];
`;
  const out = join(
    resolve(dirname(fileURLToPath(import.meta.url)), '..'),
    'src',
    'physics',
    'validation',
    'unseenSetData.ts'
  );
  writeFileSync(out, body);
  console.error(
    `listed ${listed.length.toString()}, unseen ${unseen.length.toString()}: wrote ${sorted.length.toString()} (${sorted.filter((r) => r.ncei.length === 0).length.toString()} quiet), ${missing.length.toString()} without coverage; ${(bytes / 1e6).toFixed(1)} MB read → ${out}`
  );
}

await main();
