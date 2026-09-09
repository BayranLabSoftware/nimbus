import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Build the on-globe city index (`public/data/cities.json`) from the
 * Natural Earth 1:10m "Populated Places" dataset.
 *
 * Natural Earth is public domain (no attribution required, though we
 * list it in docs/ASSETS.md anyway). The full GeoJSON is ~19 MB with
 * 137 columns per place; the simulator only needs a name in each of
 * its two UI languages, a position, a population and the zoom tier
 * the Natural Earth cartographers assigned for label placement. This
 * script boils it down to a compact array-of-arrays (~180 KB raw,
 * ~60 KB gzipped) served as a static asset — it is NOT part of the
 * JS bundle, so the bundle-size guard is unaffected.
 *
 * Usage:
 *   pnpm cities:build [path/to/ne_10m_populated_places.geojson]
 *
 * Without a path the script downloads the file from the Natural Earth
 * vector mirror on GitHub (nvkelso/natural-earth-vector). Re-run only
 * when upgrading the Natural Earth release; the output is committed.
 *
 * Row format (see src/scene/globe/cityLabels.ts for the reader):
 *   [nameEn, nameIt, lat, lon, popMax, minZoom, capital]
 *     nameEn   — English label (Natural Earth NAME_EN, falls back to NAME)
 *     nameIt   — Italian exonym when it differs from nameEn, else ""
 *     lat, lon — degrees, 3 decimals (~100 m — labels, not geodesy)
 *     popMax   — Natural Earth POP_MAX (metro-area upper estimate)
 *     minZoom  — Natural Earth MIN_ZOOM: the web-map zoom level at which
 *                the label first appears without colliding. Drives the
 *                per-label distance display condition on the globe.
 *     capital  — 1 for a national capital (ADM0CAP), else 0
 *     cc       — ISO 3166-1 alpha-2 country code (Natural Earth
 *                ISO_A2, falling back to ADM0_A3's own two-letter
 *                sibling where the dataset leaves it as "-99"), or ""
 *                when Natural Earth has none. It is here because the
 *                shaking casualty model needs a country: the PAGER
 *                fatality parameters differ by three orders of
 *                magnitude between building stocks, and the nearest
 *                city is the cheapest thing this project already
 *                ships that knows where a place is.
 */

const SOURCE_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places.geojson';

/** Places smaller than this are only kept when they are a national
 *  capital or when Natural Earth already labels them at a coarse zoom
 *  (regional reference points such as Ushuaia or Nome). */
const MIN_POPULATION = 100_000;
/** Zoom tier at or below which a place is kept regardless of size. */
const COARSE_ZOOM_KEEP = 6;

interface NeProperties {
  NAME?: string;
  NAME_EN?: string;
  NAME_IT?: string;
  FEATURECLA?: string;
  LATITUDE?: number;
  LONGITUDE?: number;
  POP_MAX?: number;
  MIN_ZOOM?: number;
  ADM0CAP?: number;
  ISO_A2?: string;
  ADM0_A3?: string;
  SOV_A3?: string;
}

interface NeFeature {
  properties: NeProperties;
  geometry?: { type: string; coordinates: [number, number] } | null;
}

interface NeCollection {
  features: NeFeature[];
}

export type CityRow = [
  nameEn: string,
  nameIt: string,
  lat: number,
  lon: number,
  popMax: number,
  minZoom: number,
  capital: 0 | 1,
  cc: string,
];

/** Pure transform, exported for the unit test. */
export function selectCityRows(collection: NeCollection): CityRow[] {
  const rows: CityRow[] = [];
  for (const feature of collection.features) {
    const p = feature.properties;
    const featurecla = (p.FEATURECLA ?? '').toLowerCase();
    // Antarctic research bases and weather stations carry a coarse
    // Natural Earth zoom tier (they are the only labels down there)
    // but they are not cities; a scale reference at −77° is not what
    // the simulator needs.
    if (featurecla.includes('station')) continue;
    const nameEn = (p.NAME_EN ?? p.NAME ?? '').trim();
    if (nameEn.length === 0) continue;
    const lat = p.LATITUDE ?? feature.geometry?.coordinates[1];
    const lon = p.LONGITUDE ?? feature.geometry?.coordinates[0];
    if (lat === undefined || lon === undefined || !Number.isFinite(lat) || !Number.isFinite(lon))
      continue;
    const pop = Math.max(0, Math.round(p.POP_MAX ?? 0));
    const minZoom = p.MIN_ZOOM ?? 10;
    const capital = p.ADM0CAP === 1 ? 1 : 0;
    const iso = (p.ISO_A2 ?? '').trim().toUpperCase();
    const cc = /^[A-Z]{2}$/.test(iso) ? iso : '';
    if (pop < MIN_POPULATION && capital === 0 && minZoom > COARSE_ZOOM_KEEP) continue;
    const nameItRaw = (p.NAME_IT ?? '').trim();
    const nameIt = nameItRaw.length > 0 && nameItRaw !== nameEn ? nameItRaw : '';
    rows.push([
      nameEn,
      nameIt,
      Number(lat.toFixed(3)),
      Number(lon.toFixed(3)),
      pop,
      Number(minZoom.toFixed(1)),
      capital,
      cc,
    ]);
  }
  // Largest first: the reader can bail out early when it only wants
  // the top tier, and the file diff stays stable between rebuilds.
  rows.sort((a, b) => b[4] - a[4] || a[0].localeCompare(b[0]));
  return rows;
}

async function loadSource(pathArg: string | undefined): Promise<NeCollection> {
  if (pathArg !== undefined) {
    return JSON.parse(readFileSync(pathArg, 'utf8')) as NeCollection;
  }
  console.error(`downloading ${SOURCE_URL} …`);
  const response = await fetch(SOURCE_URL);
  if (!response.ok) {
    throw new Error(`Natural Earth download failed: ${response.status.toString()}`);
  }
  return (await response.json()) as NeCollection;
}

async function main(): Promise<void> {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const source = await loadSource(process.argv[2]);
  const rows = selectCityRows(source);
  const outPath = join(repoRoot, 'public', 'data', 'cities.json');
  mkdirSync(dirname(outPath), { recursive: true });
  const payload = {
    source: 'Natural Earth 1:10m Populated Places (public domain)',
    url: 'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/',
    columns: ['nameEn', 'nameIt', 'lat', 'lon', 'popMax', 'minZoom', 'capital', 'cc'],
    rows,
  };
  // One row per line keeps the committed diff reviewable while the
  // file stays compact (no per-value indentation).
  const body = `{\n"source":${JSON.stringify(payload.source)},\n"url":${JSON.stringify(payload.url)},\n"columns":${JSON.stringify(payload.columns)},\n"rows":[\n${rows
    .map((r) => JSON.stringify(r))
    .join(',\n')}\n]\n}\n`;
  writeFileSync(outPath, body);
  console.error(
    `wrote ${rows.length.toString()} cities → ${outPath} (${body.length.toString()} bytes)`
  );
}

const invokedDirectly =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
