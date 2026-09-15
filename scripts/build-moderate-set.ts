import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FaultType } from '../src/physics/events/earthquake/ruptureLength.js';
import { DEEP_INTERFACE_EARTHQUAKES } from '../src/physics/validation/deepInterfaceSetData.js';
import { NCEI_EARTHQUAKE_ROWS } from '../src/physics/validation/heldOutByRuleData.js';
import type { ModerateEarthquake } from '../src/physics/validation/lowIntensityRules.js';
import { UNSEEN_EARTHQUAKES } from '../src/physics/validation/unseenSetData.js';

/**
 * The earthquakes of rule 45 of `src/physics/validation/lowIntensityRules.ts`.
 *
 * Every record of the NCEI/WDS Global Significant Earthquake Database
 * dated 2008 to 2025 whose magnitude in the database is 5.0 or more and
 * below 6.0 and whose focal depth is 40 km or less, matched to a USGS
 * ComCat event of magnitude 4.5 or more as rule 12 matches one — within
 * two minutes and 200 km, closest in time; on the same day and within
 * 200 km, closest in distance, where the record gives no time — with that
 * event's preferred origin, magnitude and moment tensor (rules 1 to 3), and
 * the record's deaths and missing (rule 13). Records that share an event
 * are one row; an event already in rule 11's, rule 23's or rule 40's set is
 * listed and left out. Only those numbers are written. Nothing here runs
 * the simulator.
 *
 * Usage:
 *   pnpm exec tsx scripts/build-moderate-set.ts [cache directory]
 */

const NCEI_QUERY =
  'https://www.ngdc.noaa.gov/hazel/hazard-service/api/v1/earthquakes?minYear=2008&maxYear=2025&minEqMagnitude=5&maxEqMagnitude=5.99&maxEqDepth=40';
const COMCAT = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const MATCH_SECONDS = 120;
const MATCH_KM = 200;
const COMCAT_FLOOR = 4.5;
const CONCURRENCY = 2;
const CACHE = resolve(process.argv[2] ?? join(tmpdir(), 'nimbus-moderate-set'));

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

function rakeBin(rake: number): FaultType {
  const r = ((((rake + 180) % 360) + 360) % 360) - 180;
  if (Math.abs(r) <= 30 || Math.abs(r) >= 150) return 'strike-slip';
  return r > 0 ? 'reverse' : 'normal';
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
  locationName?: string | null;
  deaths?: number | null;
  missing?: number | null;
}

interface ListFeature {
  id: string;
  geometry: { coordinates: [number, number, number] };
  properties: { time: number; mag: number | null };
}

interface Detail {
  id: string;
  geometry: { coordinates: [number, number, number] };
  properties: {
    time: number;
    mag: number;
    magType: string;
    products: Record<
      string,
      { preferredWeight?: number; properties: Record<string, string | undefined> }[] | undefined
    >;
  };
}

async function nceiItems(): Promise<NceiItem[]> {
  const items: NceiItem[] = [];
  for (let page = 1; ; page++) {
    const d = (await json(`${NCEI_QUERY}&itemsPerPage=200&page=${page.toString()}`)) as {
      items: NceiItem[];
      totalPages: number;
    };
    items.push(...d.items);
    if (page >= d.totalPages) return items;
  }
}

/** Rule 12: the ComCat event of a record, or null. */
async function match(item: NceiItem): Promise<string | null> {
  if (item.latitude == null || item.longitude == null) return null;
  const hasTime = item.hour != null;
  const t = hasTime
    ? Date.UTC(
        item.year,
        item.month - 1,
        item.day,
        item.hour ?? 0,
        item.minute ?? 0,
        0,
        Math.round((item.second ?? 0) * 1_000)
      )
    : Date.UTC(item.year, item.month - 1, item.day);
  const start = hasTime ? t - MATCH_SECONDS * 1_000 : t;
  const end = hasTime ? t + MATCH_SECONDS * 1_000 : t + 86_400_000;
  const url = `${COMCAT}?format=geojson&starttime=${new Date(start).toISOString()}&endtime=${new Date(end).toISOString()}&latitude=${item.latitude.toString()}&longitude=${item.longitude.toString()}&maxradiuskm=${MATCH_KM.toString()}&minmagnitude=${COMCAT_FLOOR.toString()}&orderby=time-asc`;
  const features = ((await json(url)) as { features: ListFeature[] }).features;
  let best: { key: [number, number]; id: string } | null = null;
  for (const f of features) {
    const [lon, lat] = f.geometry.coordinates;
    const dist = kmBetween(item.latitude, item.longitude, lat, lon);
    if (dist > MATCH_KM) continue;
    const dt = Math.abs(f.properties.time - t) / 1_000;
    const key: [number, number] = hasTime ? [dt, dist] : [dist, dt];
    if (best === null || key[0] < best.key[0] || (key[0] === best.key[0] && key[1] < best.key[1])) {
      best = { key, id: f.id };
    }
  }
  return best?.id ?? null;
}

async function detail(
  id: string
): Promise<Omit<ModerateEarthquake, 'nceiIds' | 'date' | 'place' | 'deaths' | 'missing'> | null> {
  let d: Detail;
  try {
    d = (await json(`${COMCAT}?eventid=${id}&format=geojson`)) as Detail;
  } catch (error) {
    if (error instanceof Gone) return null;
    throw error;
  }
  const p = d.properties;
  const [lon, lat, depth] = d.geometry.coordinates;
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
  return {
    comcat: d.id,
    time: new Date(p.time).toISOString().replace(/\.\d{3}Z$/, 'Z'),
    magnitude: clean(p.mag),
    magnitudeType: p.magType,
    depthKm: clean(depth),
    latitude: clean(lat),
    longitude: clean(lon),
    faultType,
  };
}

async function main(): Promise<void> {
  const items = await nceiItems();
  const matched = new Map<string, NceiItem[]>();
  const unmatched: number[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < items.length) {
        const item = items[next++];
        if (item === undefined) break;
        const id = await match(item);
        if (id === null) {
          unmatched.push(item.id);
          continue;
        }
        matched.set(id, [...(matched.get(id) ?? []), item]);
      }
    })
  );
  const seen = new Set([
    ...NCEI_EARTHQUAKE_ROWS.map((r) => r.comcat),
    ...UNSEEN_EARTHQUAKES.map((q) => q.comcat),
    ...DEEP_INTERFACE_EARTHQUAKES.map((q) => q.comcat),
  ]);
  const rows: ModerateEarthquake[] = [];
  const excluded: string[] = [];
  const gone: string[] = [];
  const ids = [...matched.keys()];
  next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < ids.length) {
        const id = ids[next++];
        if (id === undefined) break;
        const d = await detail(id);
        if (d === null) {
          gone.push(id);
          continue;
        }
        if (seen.has(d.comcat) || seen.has(id)) {
          excluded.push(d.comcat);
          continue;
        }
        const records = (matched.get(id) ?? []).sort((a, b) => a.id - b.id);
        const first = records[0];
        if (first === undefined) continue;
        rows.push({
          nceiIds: records.map((r) => r.id),
          date: `${first.year.toString().padStart(4, '0')}-${first.month.toString().padStart(2, '0')}-${first.day.toString().padStart(2, '0')}`,
          place: records.map((r) => (r.locationName ?? '').replace(/\s+/g, ' ').trim()).join(' / '),
          ...d,
          deaths: records.reduce((a, r) => a + (r.deaths ?? 0), 0),
          missing: records.reduce((a, r) => a + (r.missing ?? 0), 0),
        });
      }
    })
  );
  rows.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : a.comcat < b.comcat ? -1 : 1));
  unmatched.sort((a, b) => a - b);
  excluded.sort();
  gone.sort();
  const readOn = new Date().toISOString().slice(0, 10);
  const line = (r: ModerateEarthquake): string =>
    `  [[${r.nceiIds.join(', ')}], ${JSON.stringify(r.date)}, ${JSON.stringify(r.place)}, ${JSON.stringify(r.comcat)}, ${JSON.stringify(r.time)}, ${r.magnitude.toString()}, ${JSON.stringify(r.magnitudeType)}, ${r.depthKm.toString()}, ${r.latitude.toString()}, ${r.longitude.toString()}, ${JSON.stringify(r.faultType)}, ${r.deaths.toString()}, ${r.missing.toString()}],`;
  const body = `// Generated by scripts/build-moderate-set.ts on ${readOn}. Do not edit by
// hand: rule 45 of lowIntensityRules.ts says what these are and how they
// were read. NOAA NCEI/WDS Global Significant Earthquake Database,
// doi:10.7289/V5TD9V7K; USGS ComCat, public domain.

import type { FaultType } from '../events/earthquake/ruptureLength.js';
import type { ModerateEarthquake } from './lowIntensityRules.js';

export const MODERATE_READ_ON = '${readOn}';

/** Records rule 45's query returned on that day. */
export const MODERATE_RECORDS = ${items.length.toString()};

type Line = readonly [
  readonly number[], string, string, string, string, number, string, number, number, number,
  FaultType, number, number,
];

const quake = ([
  nceiIds, date, place, comcat, time, magnitude, magnitudeType, depthKm, latitude, longitude,
  faultType, deaths, missing,
]: Line): ModerateEarthquake => ({
  nceiIds, date, place, comcat, time, magnitude, magnitudeType, depthKm, latitude, longitude,
  faultType, deaths, missing,
});

/** Columns: NCEI records, date, place, ComCat event, origin time,
 *  magnitude and its type, depth (km), latitude, longitude, fault type,
 *  deaths, missing. */
// prettier-ignore
const LINES: readonly Line[] = [
${rows.map(line).join('\n')}
];

export const MODERATE_EARTHQUAKES: readonly ModerateEarthquake[] = LINES.map(quake);

/** Records with no ComCat event of magnitude 4.5 or more in rule 12's
 *  window, by NCEI id. */
export const MODERATE_UNMATCHED: readonly number[] = ${JSON.stringify(unmatched)};

/** Events already in rule 11's, rule 23's or rule 40's set, left out. */
export const MODERATE_EXCLUDED: readonly string[] = ${JSON.stringify(excluded)};

/** Events ComCat would not serve that day, left out. */
export const MODERATE_UNREADABLE: readonly string[] = ${JSON.stringify(gone)};
`;
  const out = join(
    resolve(dirname(fileURLToPath(import.meta.url)), '..'),
    'src',
    'physics',
    'validation',
    'moderateSetData.ts'
  );
  writeFileSync(out, body);
  console.error(
    `records ${items.length.toString()}: ${rows.length.toString()} rows (${rows.filter((r) => r.deaths > 0).length.toString()} with deaths), ${unmatched.length.toString()} unmatched, ${excluded.length.toString()} excluded, ${gone.length.toString()} unreadable; ${(bytes / 1e6).toFixed(1)} MB read → ${out}`
  );
}

await main();
