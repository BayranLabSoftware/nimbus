import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULE_SHAKEMAPS } from '../src/physics/validation/ruleShakemapData.js';
import { UNSEEN_EARTHQUAKES } from '../src/physics/validation/unseenSetData.js';

/**
 * What USGS says each earthquake of the two ShakeMap sets is, for rule 35
 * of `src/physics/validation/interfaceRules.ts`.
 *
 * For every earthquake of rule 11's set with a ShakeMap footprint and of
 * rule 23's set, the preferred ShakeMap's `download/info.json`, from the
 * same product the footprint was summed from: the weight the map's
 * ground-motion model gave its subduction-interface model set, which
 * ShakeMap's select module sets from STREC (the Seismo-Tectonic Regime
 * Earth Calculator, with the Slab2 model), and that set's name; STREC's
 * probabilities of being crustal, on the interface or in the slab, where
 * the map carries them (maps drawn since ShakeMap wrote them there); the
 * depth and dip of the slab below the event; and how many seismic stations
 * and intensity reports the map used. Only those are written. Nothing here
 * reads a footprint or runs the simulator.
 *
 * Usage:
 *   pnpm exec tsx scripts/build-interface-set.ts [cache directory]
 *
 * Every response is kept in the cache directory (default: the system's
 * temporary directory), named as scripts/build-unseen-set.ts names it.
 * ShakeMaps are revised; the file in the repository is the one the rules
 * were applied to, and it records the day it was read.
 */

const COMCAT = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const INFO = 'download/info.json';
const CONCURRENCY = 2;
const CACHE = resolve(process.argv[2] ?? join(tmpdir(), 'nimbus-interface-set'));

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

interface Detail {
  id: string;
  properties: {
    products: Record<
      string,
      { contents: Record<string, { url: string } | undefined> }[] | undefined
    >;
  };
}

interface Info {
  strec?: Record<string, number | string | boolean | null | undefined>;
  input?: { event_information?: Record<string, unknown> };
  multigmpe?: {
    PGA?: { gmpes?: { name?: string }[]; weights?: number[] };
  };
}

/** One earthquake as the rules read it. */
interface Row {
  comcat: string;
  set: 'rule11' | 'rule23';
  interfaceWeight: number;
  interfaceSet: string;
  interface: number | null;
  crustal: number | null;
  intraslab: number | null;
  region: string;
  slabDepthKm: number | null;
  slabDipDeg: number | null;
  stations: number;
  reports: number;
}

const clean = (x: number): number => Number(x.toPrecision(6));

function numberOr(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function one(
  comcat: string,
  set: Row['set']
): Promise<{ row: Row } | { noInfo: string } | { noModel: string }> {
  let detail: Detail;
  try {
    detail = (await json(`${COMCAT}?eventid=${comcat}&format=geojson`)) as Detail;
  } catch (error) {
    if (error instanceof Gone) return { noInfo: comcat };
    throw error;
  }
  const url = detail.properties.products.shakemap?.[0]?.contents[INFO]?.url;
  if (url === undefined) return { noInfo: comcat };
  let info: Info;
  try {
    info = (await json(url)) as Info;
  } catch (error) {
    if (error instanceof Gone) return { noInfo: comcat };
    throw error;
  }
  const sets = info.multigmpe?.PGA?.gmpes;
  const weights = info.multigmpe?.PGA?.weights ?? [];
  if (sets === undefined) return { noModel: comcat };
  let interfaceWeight = 0;
  const interfaceSets: string[] = [];
  sets.forEach((g, i) => {
    const name = g.name ?? '';
    if (!name.startsWith('subduction_interface')) return;
    interfaceWeight += weights[i] ?? 0;
    interfaceSets.push(name);
  });
  const s = info.strec ?? {};
  const probability = (key: string): number | null => {
    const v = s[key];
    return typeof v === 'number' && Number.isFinite(v) ? clean(v) : null;
  };
  const event = info.input?.event_information ?? {};
  const slabDepth = numberOr(s.SlabModelDepth, Number.NaN);
  const slabDip = numberOr(s.SlabModelDip, Number.NaN);
  return {
    row: {
      comcat,
      set,
      interfaceWeight: clean(interfaceWeight),
      interfaceSet: interfaceSets.join('+'),
      interface: probability('ProbabilitySubductionInterface'),
      crustal: probability('ProbabilitySubductionCrustal'),
      intraslab: probability('ProbabilitySubductionIntraslab'),
      region: String(s.TectonicRegion ?? ''),
      slabDepthKm: Number.isFinite(slabDepth) ? clean(slabDepth) : null,
      slabDipDeg: Number.isFinite(slabDip) ? clean(slabDip) : null,
      stations: numberOr(event.seismic_stations, 0),
      reports: numberOr(event.intensity_observations, 0),
    },
  };
}

function rowText(r: Row): string {
  const n = (x: number | null): string => (x === null ? 'null' : x.toString());
  return `  [${JSON.stringify(r.comcat)}, ${JSON.stringify(r.set)}, ${r.interfaceWeight.toString()}, ${JSON.stringify(r.interfaceSet)}, ${n(r.interface)}, ${n(r.crustal)}, ${n(r.intraslab)}, ${JSON.stringify(r.region)}, ${n(r.slabDepthKm)}, ${n(r.slabDipDeg)}, ${r.stations.toString()}, ${r.reports.toString()}],`;
}

async function main(): Promise<void> {
  const events: { comcat: string; set: Row['set'] }[] = [
    ...RULE_SHAKEMAPS.map((s) => ({ comcat: s.comcat, set: 'rule11' as const })),
    ...UNSEEN_EARTHQUAKES.map((q) => ({ comcat: q.comcat, set: 'rule23' as const })),
  ];
  const rows = new Map<string, Row>();
  const noInfo: string[] = [];
  const noModel: string[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < events.length) {
        const event = events[next++];
        if (event === undefined) break;
        const result = await one(event.comcat, event.set);
        if ('row' in result) rows.set(`${event.set}:${event.comcat}`, result.row);
        else if ('noInfo' in result) noInfo.push(result.noInfo);
        else noModel.push(result.noModel);
      }
    })
  );
  const sorted = events
    .map((e) => rows.get(`${e.set}:${e.comcat}`))
    .filter((r): r is Row => r !== undefined);
  noInfo.sort();
  noModel.sort();
  const readOn = new Date().toISOString().slice(0, 10);
  const body = `// Generated by scripts/build-interface-set.ts on ${readOn}. Do not edit by
// hand: rule 35 of interfaceRules.ts says what these are and how they were
// read. USGS ShakeMap (${INFO}: STREC and the Slab2 model), public domain.

import type { InterfaceClass } from './interfaceRules.js';

export const INTERFACE_SET_READ_ON = '${readOn}';

type Line = readonly [
  comcat: string,
  set: InterfaceClass['set'],
  interfaceWeight: number,
  interfaceSet: string,
  interfaceProbability: number | null,
  crustalProbability: number | null,
  intraslabProbability: number | null,
  region: string,
  slabDepthKm: number | null,
  slabDipDeg: number | null,
  stations: number,
  reports: number,
];

const LINES: readonly Line[] = [
${sorted.map(rowText).join('\n')}
];

export const INTERFACE_CLASSES: readonly InterfaceClass[] = LINES.map(
  ([comcat, set, interfaceWeight, interfaceSet, interfaceProbability, crustalProbability, intraslabProbability, region, slabDepthKm, slabDipDeg, stations, reports]) => ({
    comcat,
    set,
    interfaceWeight,
    interfaceSet,
    interfaceProbability,
    crustalProbability,
    intraslabProbability,
    region,
    slabDepthKm,
    slabDipDeg,
    stations,
    reports,
  })
);

/** Events whose preferred ShakeMap has no info.json, left out by rule 35. */
export const INTERFACE_WITHOUT_INFO: readonly string[] = ${JSON.stringify(noInfo)};

/** Events whose info.json carries no ground-motion model weights, left
 *  out by rule 35. */
export const INTERFACE_WITHOUT_MODEL: readonly string[] = ${JSON.stringify(noModel)};
`;
  const out = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'src',
    'physics',
    'validation',
    'interfaceSetData.ts'
  );
  writeFileSync(out, body);
  const interfaceCount = (set: Row['set']): number =>
    sorted.filter((r) => r.set === set && r.interfaceWeight >= 0.5).length;
  console.log(
    `wrote ${out}: ${sorted.length.toString()} rows (rule 11 ${interfaceCount('rule11').toString()} interface, rule 23 ${interfaceCount('rule23').toString()}), ${noInfo.length.toString()} without info.json, ${noModel.length.toString()} without model weights; ${(bytes / 1e6).toFixed(2)} MB downloaded`
  );
}

void main();
