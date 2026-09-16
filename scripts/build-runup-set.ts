import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The coastal observations of rule 102 of
 * `src/physics/validation/runupRules.ts`.
 *
 * NOAA's National Centers for Environmental Information publish the Global
 * Historical Tsunami Database: every tsunami anyone has recorded, and every
 * height anyone measured on a coast because of one. This reads both of its
 * tables through the public HazEL service, keeps the rows rule 102 asks for,
 * and writes them out. Nothing here runs Nimbus.
 *
 * Usage:
 *   pnpm exec tsx scripts/build-runup-set.ts [cache directory]
 *
 * The responses are kept in the cache directory, named by the SHA-256 of
 * their URL, as the other set builders keep theirs.
 */

const BASE = 'https://www.ngdc.noaa.gov/hazel/hazard-service/api/v1';
const PER_PAGE = 200;
const CACHE = resolve(process.argv[2] ?? join(tmpdir(), 'nimbus-runup-set'));

/** Rule 102: a run-up counts only if the database gives it a height, does
 *  not mark it doubtful, and did not measure it in the deep ocean. */
const DEEP_OCEAN_GAUGE = 3;

/** Rule 102: how many usable observations an event must carry to be worth
 *  running the whole planet's bathymetry for. */
const MIN_OBSERVATIONS = 30;

/** Rule 102: the tsunamis whose waves this project has already read, and
 *  the rule that selects them. BM-05 chose its far-field law on every
 *  ComCat earthquake of 2006 to 2025 at magnitude 7.7 or more and depth
 *  71 km or less; Tōhoku 2011 is tuned on besides, and Sumatra 2004's far
 *  coasts are quoted in the validation report's own gaps. */
const READ_FROM_YEAR = 2006;
const READ_FROM_MAGNITUDE = 7.7;
const READ_BY_NAME: readonly { year: number; minMagnitude: number; why: string }[] = [
  { year: 2011, minMagnitude: 8.5, why: 'Tōhoku 2011, tuned on (B-034, the wave rows)' },
  { year: 2004, minMagnitude: 8.5, why: "Sumatra 2004, read in the report's declared gaps" },
];

interface Paged<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalItems?: number;
}

interface NceiEvent {
  id: number;
  year?: number;
  month?: number;
  day?: number;
  causeCode?: number;
  latitude?: number;
  longitude?: number;
  eqMagnitude?: number;
  eqDepth?: number;
  country?: string;
  locationName?: string;
  deathsTotal?: number;
  maxWaterHeight?: number;
}

interface NceiRunup {
  id: number;
  tsunamiEventId?: number;
  latitude?: number;
  longitude?: number;
  runupHt?: number;
  doubtful?: string;
  typeMeasurementId?: number;
  distFromSource?: number;
  country?: string;
  locationName?: string;
}

async function page<T>(path: string, n: number): Promise<Paged<T>> {
  const url = `${BASE}/${path}?itemsPerPage=${PER_PAGE.toString()}&page=${n.toString()}`;
  const file = join(CACHE, `${createHash('sha256').update(url).digest('hex')}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')) as Paged<T>;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`fetch ${url}: ${res.status.toString()}`);
  const text = await res.text();
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(file, text);
  await new Promise((r) => setTimeout(r, 250));
  return JSON.parse(text) as Paged<T>;
}

async function all<T>(path: string): Promise<T[]> {
  const first = await page<T>(path, 1);
  const out = [...first.items];
  for (let n = 2; n <= first.totalPages; n++) out.push(...(await page<T>(path, n)).items);
  return out;
}

const num = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const clean = (x: number): number => Number(x.toPrecision(10));

function readAlready(event: NceiEvent): string | null {
  const year = event.year;
  const magnitude = event.eqMagnitude;
  if (!num(year) || !num(magnitude)) return null;
  for (const row of READ_BY_NAME) {
    if (year === row.year && magnitude >= row.minMagnitude) return row.why;
  }
  if (year >= READ_FROM_YEAR && magnitude >= READ_FROM_MAGNITUDE) {
    return "BM-05's own selection: ComCat 2006 to 2025, magnitude 7.7 or more";
  }
  return null;
}

async function main(): Promise<void> {
  const events = await all<NceiEvent>('tsunamis/events');
  const runups = await all<NceiRunup>('tsunamis/runups');
  const byId = new Map(events.map((e) => [e.id, e]));

  let noHeight = 0;
  let doubtful = 0;
  let deepOcean = 0;
  let noPlace = 0;
  let notAnEarthquake = 0;
  let noSource = 0;
  const readNames = new Map<string, number>();

  const kept = new Map<number, NceiRunup[]>();
  for (const r of runups) {
    if (!num(r.runupHt) || r.runupHt <= 0) {
      noHeight += 1;
      continue;
    }
    if (r.doubtful === 'y') {
      doubtful += 1;
      continue;
    }
    if (r.typeMeasurementId === DEEP_OCEAN_GAUGE) {
      deepOcean += 1;
      continue;
    }
    if (!num(r.latitude) || !num(r.longitude)) {
      noPlace += 1;
      continue;
    }
    const event = r.tsunamiEventId === undefined ? undefined : byId.get(r.tsunamiEventId);
    if (event?.causeCode !== 1) {
      notAnEarthquake += 1;
      continue;
    }
    if (
      !num(event.latitude) ||
      !num(event.longitude) ||
      !num(event.eqMagnitude) ||
      !num(event.eqDepth) ||
      !num(event.year) ||
      event.year < 1900
    ) {
      noSource += 1;
      continue;
    }
    const why = readAlready(event);
    if (why !== null) {
      readNames.set(why, (readNames.get(why) ?? 0) + 1);
      continue;
    }
    const list = kept.get(event.id) ?? [];
    list.push(r);
    kept.set(event.id, list);
  }

  const chosen = [...kept.entries()]
    .filter(([, list]) => list.length >= MIN_OBSERVATIONS)
    .sort((a, b) => {
      const ea = byId.get(a[0]);
      const eb = byId.get(b[0]);
      return (ea?.year ?? 0) - (eb?.year ?? 0) || a[0] - b[0];
    });

  const eventLines: string[] = [];
  const obsLines: string[] = [];
  for (const [id, list] of chosen) {
    const e = byId.get(id);
    if (e === undefined) continue;
    const name = `${(e.country ?? '').toLowerCase()} ${(e.locationName ?? '').toLowerCase()}`
      .trim()
      .replace(/\s+/g, ' ');
    eventLines.push(
      `  [${id.toString()}, ${(e.year ?? 0).toString()}, ${(e.month ?? 0).toString()}, ${(e.day ?? 0).toString()}, ${clean(e.latitude ?? 0).toString()}, ${clean(e.longitude ?? 0).toString()}, ${clean(e.eqMagnitude ?? 0).toString()}, ${clean(e.eqDepth ?? 0).toString()}, ${(e.deathsTotal ?? -1).toString()}, ${JSON.stringify(name)}],`
    );
    for (const r of list.sort((a, b) => a.id - b.id)) {
      obsLines.push(
        `  [${id.toString()}, ${clean(r.latitude ?? 0).toString()}, ${clean(r.longitude ?? 0).toString()}, ${clean(r.runupHt ?? 0).toString()}, ${(r.typeMeasurementId ?? 0).toString()}],`
      );
    }
  }

  const readOn = new Date().toISOString().slice(0, 10);
  const body = `// Generated by scripts/build-runup-set.ts on ${readOn}. Do not edit by
// hand: rule 102 of runupRules.ts says what these are and how they were
// read. NOAA National Centers for Environmental Information, Global
// Historical Tsunami Database (https://www.ngdc.noaa.gov/hazard/tsu_db.shtml),
// read through the public HazEL service. NCEI's data are in the public
// domain.

export const RUNUP_READ_ON = '${readOn}';

/** Rows the database gave, before rule 102's filters. */
export const RUNUP_LISTED = ${runups.length.toString()};
export const RUNUP_EVENTS_LISTED = ${events.length.toString()};

/** Observations left out, and why. */
export const RUNUP_WITHOUT_HEIGHT = ${noHeight.toString()};
export const RUNUP_DOUBTFUL = ${doubtful.toString()};
export const RUNUP_DEEP_OCEAN_GAUGE = ${deepOcean.toString()};
export const RUNUP_WITHOUT_PLACE = ${noPlace.toString()};
export const RUNUP_NOT_AN_EARTHQUAKE = ${notAnEarthquake.toString()};
export const RUNUP_WITHOUT_A_SOURCE = ${noSource.toString()};

/** Observations left out because this project has read their wave. */
export const RUNUP_ALREADY_READ: readonly (readonly [string, number])[] = [
${[...readNames].map(([why, n]) => `  [${JSON.stringify(why)}, ${n.toString()}],`).join('\n')}
];

/** Events that carried fewer than rule 102's minimum and were dropped. */
export const RUNUP_EVENTS_TOO_SMALL = ${(kept.size - chosen.length).toString()};
export const RUNUP_MIN_OBSERVATIONS = ${MIN_OBSERVATIONS.toString()};

export interface RunupEvent {
  id: number;
  year: number;
  month: number;
  day: number;
  latitude: number;
  longitude: number;
  magnitude: number;
  depthKm: number;
  /** The database's total dead, or −1 where it holds none. */
  deaths: number;
  name: string;
}

export interface RunupObservation {
  eventId: number;
  latitude: number;
  longitude: number;
  /** The height the database records, m. */
  heightM: number;
  /** NCEI's type of measurement; 3, the deep-ocean gauge, is left out. */
  typeId: number;
}

type EventLine = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  string,
];
type ObsLine = readonly [number, number, number, number, number];

// prettier-ignore
const EVENT_LINES: readonly EventLine[] = [
${eventLines.join('\n')}
];

// prettier-ignore
const OBS_LINES: readonly ObsLine[] = [
${obsLines.join('\n')}
];

export const RUNUP_EVENTS: readonly RunupEvent[] = EVENT_LINES.map((l) => ({
  id: l[0],
  year: l[1],
  month: l[2],
  day: l[3],
  latitude: l[4],
  longitude: l[5],
  magnitude: l[6],
  depthKm: l[7],
  deaths: l[8],
  name: l[9],
}));

export const RUNUP_OBSERVATIONS: readonly RunupObservation[] = OBS_LINES.map((l) => ({
  eventId: l[0],
  latitude: l[1],
  longitude: l[2],
  heightM: l[3],
  typeId: l[4],
}));
`;
  const out = join(
    resolve(dirname(fileURLToPath(import.meta.url)), '..'),
    'src',
    'physics',
    'validation',
    'runupSetData.ts'
  );
  writeFileSync(out, body);
  console.error(
    `listed ${runups.length.toString()} observations of ${events.length.toString()} tsunamis: kept ${obsLines.length.toString()} of ${chosen.length.toString()} events → ${out}`
  );
}

await main();
