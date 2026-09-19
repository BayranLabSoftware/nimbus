/**
 * Rule 329 of `src/physics/validation/footprintE1Rules.ts`: the set E1 is read
 * on, built from maps nobody here has seen.
 *
 * Two queries whose bounds no earlier rule reached — the 40 to 70 km band that
 * rule 23 stops short of and rule 66 starts after, and the window after
 * 1 January 2026 that rule 23's query ends before — less every ComCat
 * identifier any data file of this repository already carries. Up to three
 * hundred rows, every one of query B first because it alone carries both
 * shallow and deep.
 *
 * For each: its preferred origin, magnitude and moment tensor (rules 1 to 3),
 * and its preferred ShakeMap's low-resolution MMI coverage summed as rule 18
 * sums it. The rows are written into `footprintE1SetData.ts` and committed
 * before any candidate is scored on them.
 *
 *   pnpm exec tsx scripts/build-e1-set.ts
 *
 * One request every 1.2 s, as the fireball campaign asked of EIEP. Nothing
 * here runs Nimbus.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FaultType } from '../src/physics/events/earthquake/ruptureLength.js';
import { E1_QUERIES, E1_SET_SIZE } from '../src/physics/validation/footprintE1Rules.js';
import { areasAbove, type Coverage } from './build-shakemap-fixtures.js';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const FDSN = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const COVERAGE = 'download/coverage_mmi_low_res.covjson';
const PAUSE_MS = 1_200;
/** Responses are kept outside the repository so that a rerun — which rule
 *  329(d) forces when a listed event turns out to have no coverage — costs
 *  nothing and asks USGS for nothing it has already answered. */
const CACHE = join(tmpdir(), 'nimbus-e1-cache');

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function json(url: string, cacheKey?: string): Promise<unknown> {
  const cached =
    cacheKey === undefined ? null : join(CACHE, `${cacheKey.replace(/[^a-z0-9._-]/gi, '_')}.json`);
  if (cached !== null && existsSync(cached)) {
    return JSON.parse(readFileSync(cached, 'utf8'));
  }
  // One request every 1.2 s, and only for what is not already in hand.
  await sleep(PAUSE_MS);
  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'nimbus-validation' } });
      if (response.status === 404 || response.status === 409) throw new Error(`gone ${url}`);
      if (!response.ok) throw new Error(`fetch ${url}: ${response.status.toString()}`);
      const body: unknown = await response.json();
      if (cached !== null) {
        mkdirSync(CACHE, { recursive: true });
        writeFileSync(cached, JSON.stringify(body));
      }
      return body;
    } catch (error) {
      if (attempt >= 3) throw error;
      await sleep(2_000 * (attempt + 1));
    }
  }
}

/** Rule 2's bins for one nodal plane's rake. */
function rakeBin(rake: number): FaultType {
  const r = ((((rake + 180) % 360) + 360) % 360) - 180;
  if (r >= -30 && r <= 30) return 'strike-slip';
  if (r >= 150 || r <= -150) return 'strike-slip';
  if (r > 30 && r < 150) return 'reverse';
  return 'normal';
}

/** Rule 329(c): every identifier the repository's data files already carry. */
function seenIdentifiers(): Set<string> {
  const ids = new Set<string>();
  const dir = join(ROOT, 'src', 'physics', 'validation');
  const pattern =
    /'((?:us|ci|nc|nn|hv|ak|at|pt|uw|mb|se|tx|ok|usp|official|iscgem|atlas|duputel|choy|gcmt)[a-z0-9_]{3,})'/g;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.ts')) continue;
    for (const match of readFileSync(join(dir, name), 'utf8').matchAll(pattern)) {
      const id = match[1];
      if (id !== undefined) ids.add(id);
    }
  }
  return ids;
}

interface Feature {
  id: string;
  properties: { mag: number; place: string; time: number; ids?: string };
  geometry: { coordinates: [number, number, number] };
}

interface Detail {
  id: string;
  properties: {
    mag: number;
    magType: string;
    place: string;
    time: number;
    ids?: string;
    products: {
      shakemap?: {
        contents: Record<string, { url?: string }>;
        properties: Record<string, string>;
      }[];
      'moment-tensor'?: {
        preferredWeight?: number;
        properties: Record<string, string>;
      }[];
    };
  };
  geometry: { coordinates: [number, number, number] };
}

export interface E1Row {
  comcat: string;
  time: string;
  place: string;
  magnitude: number;
  magnitudeType: string;
  depthKm: number;
  latitude: number;
  longitude: number;
  faultType: FaultType;
  maxMmi: number;
  areaKm2: Record<7 | 8 | 9, number>;
  /** How the map was drawn, for rule 332(b)'s second clause. */
  stations: number;
  finiteRupture: boolean;
}

const clean = (x: number): number => Math.round(x * 10_000) / 10_000;

async function listing(params: Record<string, string>): Promise<Feature[]> {
  const query = new URLSearchParams({ format: 'geojson', orderby: 'time', ...params });
  const body = (await json(`${FDSN}?${query.toString()}`)) as { features: Feature[] };
  return body.features;
}

/** Rows a previous run already built, read back from the generated file so a
 *  rerun costs USGS nothing. Empty on the first run. */
async function alreadyBuilt(): Promise<Map<string, E1Row>> {
  const path = join(ROOT, 'src', 'physics', 'validation', 'footprintE1SetData.ts');
  if (!existsSync(path)) return new Map();
  const module = (await import(path)) as {
    E1_EARTHQUAKES: readonly (Omit<E1Row, 'finiteRupture'> & { stations: number })[];
  };
  return new Map(
    module.E1_EARTHQUAKES.map((row): [string, E1Row] => [
      row.comcat,
      { ...row, finiteRupture: true },
    ])
  );
}

async function main(): Promise<void> {
  const seen = seenIdentifiers();
  console.log(`identificatori già letti nel repository: ${seen.size.toString()}`);

  const [deep, recent] = await Promise.all([
    listing(E1_QUERIES.deepBand),
    listing(E1_QUERIES.after2026),
  ]);
  console.log(`query A (40–70 km, 1973–2026): ${deep.length.toString()}`);
  console.log(`query B (dopo il 2026-01-01):  ${recent.length.toString()}`);

  /** Rule 329(c): an event is excluded by its own id or any associated id. */
  const unseen = (f: Feature): boolean => {
    if (seen.has(f.id)) return false;
    for (const id of (f.properties.ids ?? '').split(',')) {
      if (id !== '' && seen.has(id)) return false;
    }
    return true;
  };
  const byId = (a: Feature, b: Feature): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const fromB = recent.filter(unseen).sort(byId);
  const fromA = deep.filter(unseen).sort(byId);
  // Rule 329(d) takes up to three hundred, and rule 329(f) drops the ones
  // whose ShakeMap has no coverage. Rule 332 wants three hundred SCORED, so
  // the queue is walked in its own order until three hundred have one: the
  // order was fixed before anything was fetched, and taking the next event in
  // it is not choosing an event.
  const queue = [...fromB, ...fromA];
  console.log(
    `dopo la sottrazione: B ${fromB.length.toString()}, A ${fromA.length.toString()}; coda di ${queue.length.toString()}`
  );

  const built = await alreadyBuilt();
  if (built.size > 0)
    console.log(`righe già costruite da un giro precedente: ${built.size.toString()}`);
  const rows: E1Row[] = [];
  const withoutCoverage: string[] = [];
  for (const [index, feature] of queue.entries()) {
    if (rows.length >= E1_SET_SIZE) break;
    const done = built.get(feature.id);
    if (done !== undefined) {
      rows.push(done);
      continue;
    }
    let detail: Detail;
    try {
      detail = (await json(
        `${FDSN}?eventid=${feature.id}&format=geojson`,
        `detail-${feature.id}`
      )) as Detail;
    } catch {
      withoutCoverage.push(feature.id);
      continue;
    }
    const properties = detail.properties;
    const [lon, lat, depth] = detail.geometry.coordinates;
    const shakemap = properties.products.shakemap?.[0];
    const url = shakemap?.contents[COVERAGE]?.url;
    if (shakemap === undefined || url === undefined) {
      withoutCoverage.push(detail.id);
      continue;
    }
    let faultType: FaultType = 'all';
    const tensors = properties.products['moment-tensor'] ?? [];
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
    const coverage = (await json(url, `cov-${detail.id}`)) as Coverage;
    const areas = areasAbove(coverage);
    rows.push({
      comcat: detail.id,
      time: new Date(properties.time).toISOString().replace(/\.\d{3}Z$/, 'Z'),
      place: properties.place.replace(/\s+/g, ' ').trim(),
      magnitude: clean(properties.mag),
      magnitudeType: properties.magType,
      depthKm: clean(depth),
      latitude: clean(lat),
      longitude: clean(lon),
      faultType,
      maxMmi: Number(shakemap.properties.maxmmi ?? 'NaN'),
      areaKm2: { 7: areas[7] ?? 0, 8: areas[8] ?? 0, 9: areas[9] ?? 0 },
      stations: Number(shakemap.properties['num-stations'] ?? '0'),
      finiteRupture: (shakemap.properties['event-type'] ?? '') === 'SCENARIO' ? false : true,
    });
    if ((index + 1) % 25 === 0) {
      console.log(
        `  ${(index + 1).toString()} letti, ${rows.length.toString()}/${E1_SET_SIZE.toString()} con mappa …`
      );
    }
  }

  const body = rows
    .map(
      (r) =>
        `  [${JSON.stringify(r.comcat)}, ${JSON.stringify(r.time)}, ${JSON.stringify(r.place)}, ${r.magnitude.toString()}, ${JSON.stringify(r.magnitudeType)}, ${r.depthKm.toString()}, ${r.latitude.toString()}, ${r.longitude.toString()}, ${JSON.stringify(r.faultType)}, ${Number.isFinite(r.maxMmi) ? r.maxMmi.toFixed(2) : 'Number.NaN'}, ${r.areaKm2[7].toFixed(0)}, ${r.areaKm2[8].toFixed(0)}, ${r.areaKm2[9].toFixed(0)}, ${r.stations.toString()}],`
    )
    .join('\n');

  const file = `// Generated by scripts/build-e1-set.ts on ${new Date().toISOString().slice(0, 10)}.
// Do not edit by hand: rule 329 of footprintE1Rules.ts says what these are and
// how they were read. USGS ComCat and ShakeMap
// (download/coverage_mmi_low_res.covjson), public domain.

import type { FaultType } from '../events/earthquake/ruptureLength.js';

export const E1_SET_READ_ON = '${new Date().toISOString().slice(0, 10)}';

/** Events the queries of rule 329 returned, less every identifier the
 *  repository already carried. */
export const E1_SET_LISTED = ${(rows.length + withoutCoverage.length).toString()};

/** Listed events whose preferred ShakeMap has no low-resolution coverage, or
 *  which ComCat no longer serves: rule 329(f) lists them and leaves them out. */
export const E1_SET_WITHOUT_COVERAGE: readonly string[] = [
${withoutCoverage.map((id) => `  ${JSON.stringify(id)},`).join('\n')}
];

type Line = readonly [
  string, string, string, number, string, number, number, number, FaultType,
  number, number, number, number, number,
];

const LINES: readonly Line[] = [
${body}
];

export interface E1Earthquake {
  comcat: string;
  time: string;
  place: string;
  magnitude: number;
  magnitudeType: string;
  depthKm: number;
  latitude: number;
  longitude: number;
  faultType: FaultType;
  maxMmi: number;
  areaKm2: Readonly<Record<7 | 8 | 9, number>>;
  /** Stations the published map was drawn with — rule 332(b)'s second clause. */
  stations: number;
}

export const E1_EARTHQUAKES: readonly E1Earthquake[] = LINES.map((l) => ({
  comcat: l[0],
  time: l[1],
  place: l[2],
  magnitude: l[3],
  magnitudeType: l[4],
  depthKm: l[5],
  latitude: l[6],
  longitude: l[7],
  faultType: l[8],
  maxMmi: l[9],
  areaKm2: { 7: l[10], 8: l[11], 9: l[12] },
  stations: l[13],
}));
`;
  writeFileSync(join(ROOT, 'src', 'physics', 'validation', 'footprintE1SetData.ts'), file);
  console.log(
    `scritte ${rows.length.toString()} righe; senza coverage ${withoutCoverage.length.toString()}`
  );
}

void main();
