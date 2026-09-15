import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeElevationGrid, type ElevationGrid } from '../src/physics/elevation/index.js';
import { NCEI_EARTHQUAKE_ROWS } from '../src/physics/validation/heldOutByRuleData.js';
import { decodePng } from '../src/physics/validation/png.js';
import { RECORDED_EVENTS } from '../src/physics/validation/recordedTolls.js';
import type { SiteRow } from '../src/physics/validation/siteVs30.js';
import { measureTerrainSite } from '../src/physics/validation/terrainSite.js';
import {
  TERRAIN_TILE_URL,
  TERRAIN_TILE_ZOOM,
  terrariumElevation,
  tileBounds,
  type TerrainSourceSpan,
} from '../src/scene/terrainSampling.js';
import { terrainSpanForEarthquake } from '../src/store/useAppStore.js';

/**
 * The sites of rule 20 of `src/physics/validation/siteVs30.ts`.
 *
 * For every row of rule 11's set and every earthquake of the net, the
 * elevation, slope and Vs30 the browser reads at the epicentre, on the
 * Terrarium tiles it would fetch for that pick (terrainSite.ts). Only
 * those three numbers are written; the tiles stay in a cache directory
 * outside the repository. Nothing here scores an earthquake: the net's
 * rows are run only to read the strike and rupture length that choose
 * their grid.
 *
 * Usage:
 *   pnpm exec tsx scripts/build-site-vs30.ts [tile cache directory]
 *   pnpm exec tsx scripts/build-site-vs30.ts [tile cache directory] --unseen
 *   pnpm exec tsx scripts/build-site-vs30.ts [tile cache directory] --moderate
 *
 * The second reads the earthquakes of rule 23 of depthRules.ts, from
 * unseenSetData.ts, and writes their sites into unseenSiteData.ts; the
 * third those of rule 45 of lowIntensityRules.ts, from moderateSetData.ts,
 * into moderateSiteData.ts.
 *
 * The tiles are revised now and then, so a run on another day can read
 * a different slope; the file in the repository is the one the rules
 * were applied to, and it records the day its tiles were read.
 */

const CONCURRENCY = 6;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ARGS = process.argv.slice(2);
const UNSEEN = ARGS.includes('--unseen');
const MODERATE = ARGS.includes('--moderate');
const CACHE = resolve(ARGS.find((a) => !a.startsWith('--')) ?? join(tmpdir(), 'nimbus-terrarium'));

let downloaded = 0;
let downloadedBytes = 0;

async function tileBytes(x: number, y: number): Promise<Buffer> {
  const file = join(CACHE, TERRAIN_TILE_ZOOM.toString(), x.toString(), `${y.toString()}.png`);
  if (existsSync(file)) return readFileSync(file);
  const url = TERRAIN_TILE_URL.replace('{z}', TERRAIN_TILE_ZOOM.toString())
    .replace('{x}', x.toString())
    .replace('{y}', y.toString());
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'nimbus-validation' } });
      if (!res.ok) throw new Error(`fetch ${url}: ${res.status.toString()}`);
      const bytes = Buffer.from(await res.arrayBuffer());
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, bytes);
      downloaded += 1;
      downloadedBytes += bytes.length;
      return bytes;
    } catch (error) {
      if (attempt >= 4) throw error;
      await new Promise((r) => setTimeout(r, 2_000 * (attempt + 1)));
    }
  }
}

async function readTile(x: number, y: number): Promise<ElevationGrid> {
  const png = decodePng(await tileBytes(x, y));
  const samples = new Float32Array(png.width * png.height);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = terrariumElevation(png.red[i] ?? 0, png.green[i] ?? 0, png.blue[i] ?? 0);
  }
  return makeElevationGrid({
    ...tileBounds(x, y, TERRAIN_TILE_ZOOM),
    nLat: png.height,
    nLon: png.width,
    samples,
  });
}

interface Pick {
  key: string;
  latitude: number;
  longitude: number;
  span: TerrainSourceSpan | undefined;
}

let tilesRead = 0;

async function measureAll(picks: readonly Pick[]): Promise<SiteRow[]> {
  const rows = new Map<number, SiteRow>();
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < picks.length) {
        const i = next++;
        const pick = picks[i];
        if (pick === undefined) break;
        const site = await measureTerrainSite(pick.latitude, pick.longitude, pick.span, readTile);
        tilesRead += site.tilesRead;
        rows.set(i, {
          key: pick.key,
          latitude: pick.latitude,
          longitude: pick.longitude,
          tiles: site.tiles,
          elevationM: site.elevationM,
          slopeRad: site.slopeRad,
          vs30: site.vs30,
        });
      }
    })
  );
  return picks.map((_, i) => {
    const row = rows.get(i);
    if (row === undefined) throw new Error(`site ${i.toString()} was not measured`);
    return row;
  });
}

/** One site as a line: key, latitude, longitude, tiles, elevation (m),
 *  slope (rad), Vs30 (m/s). */
function rowText(r: SiteRow): string {
  return `  [${JSON.stringify(r.key)}, ${r.latitude.toString()}, ${r.longitude.toString()}, ${r.tiles.toString()}, ${r.elevationM.toFixed(1)}, ${r.slopeRad.toPrecision(8)}, ${r.vs30.toFixed(2)}],`;
}

const HEADER = (
  readOn: string,
  rule: string
): string => `// Generated by scripts/build-site-vs30.ts on ${readOn}. Do not edit by
// hand: ${rule} says what these are and how they were read.
// Terrain: Terrarium tiles of the AWS Terrain Tiles open dataset, which
// mix public-domain sources with ones that require attribution; see
// https://github.com/tilezen/joerd/blob/master/docs/attribution.md.`;

/** Rule 23's earthquakes, read from their generated file by path so
 *  that this script compiles before that file exists. */
async function unseenPicks(): Promise<Pick[]> {
  const file = join(ROOT, 'src', 'physics', 'validation', 'unseenSetData.ts');
  const data = (await import(file)) as {
    UNSEEN_EARTHQUAKES: readonly { comcat: string; latitude: number; longitude: number }[];
  };
  // Rule 3 sets no strike here either.
  return data.UNSEEN_EARTHQUAKES.map((q) => ({
    key: q.comcat,
    latitude: q.latitude,
    longitude: q.longitude,
    span: undefined,
  }));
}

async function mainUnseen(): Promise<void> {
  const sites = await measureAll(await unseenPicks());
  const readOn = new Date().toISOString().slice(0, 10);
  const body = `${HEADER(readOn, 'rule 23 of depthRules.ts, with rule 20 of siteVs30.ts,')}

import type { SiteRow } from './siteVs30.js';

export const UNSEEN_SITES_READ_ON = '${readOn}';

type SiteLine = readonly [string, number, number, number, number, number, number];

const site = ([key, latitude, longitude, tiles, elevationM, slopeRad, vs30]: SiteLine): SiteRow => ({
  key,
  latitude,
  longitude,
  tiles,
  elevationM,
  slopeRad,
  vs30,
});

/** Rule 23's earthquakes, keyed by ComCat event: key, latitude,
 *  longitude, tiles, elevation (m), slope (rad), Vs30 (m/s). */
// prettier-ignore
const LINES: readonly SiteLine[] = [
${sites.map(rowText).join('\n')}
];

export const UNSEEN_SITES: readonly SiteRow[] = LINES.map(site);
`;
  const out = join(ROOT, 'src', 'physics', 'validation', 'unseenSiteData.ts');
  writeFileSync(out, body);
  console.error(
    `wrote ${sites.length.toString()} sites → ${out}; ${tilesRead.toString()} tile reads, ${downloaded.toString()} tiles downloaded (${(downloadedBytes / 1e6).toFixed(1)} MB) into ${CACHE}`
  );
}

/** Rule 45's earthquakes, read from their generated file by path. */
async function mainModerate(): Promise<void> {
  const file = join(ROOT, 'src', 'physics', 'validation', 'moderateSetData.ts');
  const data = (await import(file)) as {
    MODERATE_EARTHQUAKES: readonly { comcat: string; latitude: number; longitude: number }[];
  };
  const sites = await measureAll(
    data.MODERATE_EARTHQUAKES.map((q) => ({
      key: q.comcat,
      latitude: q.latitude,
      longitude: q.longitude,
      span: undefined,
    }))
  );
  const readOn = new Date().toISOString().slice(0, 10);
  const body = `${HEADER(readOn, 'rule 45 of lowIntensityRules.ts, with rule 20 of siteVs30.ts,')}

import type { SiteRow } from './siteVs30.js';

export const MODERATE_SITES_READ_ON = '${readOn}';

type SiteLine = readonly [string, number, number, number, number, number, number];

const site = ([key, latitude, longitude, tiles, elevationM, slopeRad, vs30]: SiteLine): SiteRow => ({
  key,
  latitude,
  longitude,
  tiles,
  elevationM,
  slopeRad,
  vs30,
});

/** Rule 45's earthquakes, keyed by ComCat event: key, latitude,
 *  longitude, tiles, elevation (m), slope (rad), Vs30 (m/s). */
// prettier-ignore
const LINES: readonly SiteLine[] = [
${sites.map(rowText).join('\n')}
];

export const MODERATE_SITES: readonly SiteRow[] = LINES.map(site);
`;
  const out = join(ROOT, 'src', 'physics', 'validation', 'moderateSiteData.ts');
  writeFileSync(out, body);
  console.error(
    `wrote ${sites.length.toString()} sites → ${out}; ${tilesRead.toString()} tile reads, ${downloaded.toString()} tiles downloaded (${(downloadedBytes / 1e6).toFixed(1)} MB) into ${CACHE}`
  );
}

async function main(): Promise<void> {
  // Rule 3 sets no strike, so a row of rule 11's set is a pick with none.
  const rulePicks: Pick[] = NCEI_EARTHQUAKE_ROWS.map((r) => ({
    key: r.comcat,
    latitude: r.latitude,
    longitude: r.longitude,
    span: undefined,
  }));
  const netPicks: Pick[] = [];
  for (const event of RECORDED_EVENTS) {
    const result = event.run();
    if (result.type !== 'earthquake') continue;
    netPicks.push({
      key: event.name,
      latitude: event.latitude,
      longitude: event.longitude,
      span: terrainSpanForEarthquake(result.data.inputs),
    });
  }
  const ruleSites = await measureAll(rulePicks);
  const netSites = await measureAll(netPicks);
  const readOn = new Date().toISOString().slice(0, 10);
  const body = `// Generated by scripts/build-site-vs30.ts on ${readOn}. Do not edit by
// hand: rule 20 of siteVs30.ts says what these are and how they were read.
// Terrain: Terrarium tiles of the AWS Terrain Tiles open dataset, which
// mix public-domain sources with ones that require attribution; see
// https://github.com/tilezen/joerd/blob/master/docs/attribution.md.

import type { SiteRow } from './siteVs30.js';

export const SITES_READ_ON = '${readOn}';

type SiteLine = readonly [string, number, number, number, number, number, number];

const site = ([key, latitude, longitude, tiles, elevationM, slopeRad, vs30]: SiteLine): SiteRow => ({
  key,
  latitude,
  longitude,
  tiles,
  elevationM,
  slopeRad,
  vs30,
});

/** Rule 11's rows, keyed by ComCat event: key, latitude, longitude,
 *  tiles, elevation (m), slope (rad), Vs30 (m/s). */
export const RULE_SITES: readonly SiteRow[] = (
  [
${ruleSites.map(rowText).join('\n')}
  ] satisfies SiteLine[]
).map(site);

/** The net's earthquakes, keyed by the row's name, in the same columns. */
export const NET_SITES: readonly SiteRow[] = (
  [
${netSites.map(rowText).join('\n')}
  ] satisfies SiteLine[]
).map(site);
`;
  const out = join(ROOT, 'src', 'physics', 'validation', 'siteVs30Data.ts');
  writeFileSync(out, body);
  console.error(
    `wrote ${ruleSites.length.toString()} + ${netSites.length.toString()} sites → ${out}; ${tilesRead.toString()} tile reads, ${downloaded.toString()} tiles downloaded (${(downloadedBytes / 1e6).toFixed(1)} MB) into ${CACHE}`
  );
}

await (MODERATE ? mainModerate() : UNSEEN ? mainUnseen() : main());
