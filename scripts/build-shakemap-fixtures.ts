import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Build the ShakeMap intensity fixtures
 * (`src/physics/validation/shakemapFixtures.ts`).
 *
 * A death toll is the product of five models — intensity, exposure,
 * vulnerability, geometry, warning — and when it is wrong it does not
 * say which. This anchors the first of them on its own, against the
 * only field measurement of an earthquake's shaking that exists: the
 * USGS ShakeMap, published for every event since 2000 and for the
 * significant ones before, machine-readable and without a key.
 *
 * What is stored is the ground area above each MMI threshold, in km².
 * Area rather than a contour, because the model draws circles and
 * stadiums where the earth draws whatever the geology says, and the
 * comparison that means something between the two is how much ground
 * shook that hard — not what shape it was.
 *
 * Usage:
 *   pnpm shakemap:build
 *
 * Re-run to add events or pick up a ShakeMap revision; the output is
 * committed, because the calibration net runs without a network.
 */

interface EventSpec {
  name: string;
  /** Search window around the origin time (ISO 8601, UTC). */
  from: string;
  to: string;
  minMagnitude: number;
  /** Which preset in `EARTHQUAKE_PRESETS` this anchors. */
  preset: string;
}

const EVENTS: EventSpec[] = [
  {
    name: 'Northridge 1994',
    from: '1994-01-17T12:30:00',
    to: '1994-01-17T12:32:00',
    minMagnitude: 6.5,
    preset: 'NORTHRIDGE_1994',
  },
  {
    name: "L'Aquila 2009",
    from: '2009-04-06T01:32:00',
    to: '2009-04-06T01:34:00',
    minMagnitude: 6,
    preset: 'L_AQUILA_2009',
  },
  {
    name: 'Amatrice 2016',
    from: '2016-08-24T01:36:00',
    to: '2016-08-24T01:37:00',
    minMagnitude: 6,
    preset: 'AMATRICE_2016',
  },
  {
    name: 'Gorkha 2015',
    from: '2015-04-25T06:11:00',
    to: '2015-04-25T06:12:00',
    minMagnitude: 7.5,
    preset: 'NEPAL_2015',
  },
  {
    name: 'Tōhoku 2011',
    from: '2011-03-11T05:46:00',
    to: '2011-03-11T05:47:00',
    minMagnitude: 8.5,
    preset: 'TOHOKU_2011',
  },
  {
    name: 'Kokoxili 2001',
    from: '2001-11-14T09:26:00',
    to: '2001-11-14T09:27:00',
    minMagnitude: 7.5,
    preset: 'KUNLUN_2001',
  },
];

const EARTH_RADIUS_KM = 6371.0088;
const THRESHOLDS = [7, 8, 9] as const;

interface Coverage {
  domain: {
    axes: {
      x: { start: number; stop: number; num: number };
      y: { start: number; stop: number; num: number };
    };
  };
  ranges: { MMI: { values: (number | null)[] } };
}

/** Ground area (km²) at or above each threshold. */
function areasAbove(cov: Coverage): Record<number, number> {
  const { x, y } = cov.domain.axes;
  const dx = (x.stop - x.start) / (x.num - 1);
  const dy = (y.stop - y.start) / (y.num - 1);
  const values = cov.ranges.MMI.values;
  const out: Record<number, number> = {};
  for (const thr of THRESHOLDS) out[thr] = 0;
  const latKm = Math.abs(dy) * (Math.PI / 180) * EARTH_RADIUS_KM;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v === null || v === undefined) continue;
    const lat = y.start + Math.floor(i / x.num) * dy;
    const cell =
      latKm * Math.abs(dx) * (Math.PI / 180) * EARTH_RADIUS_KM * Math.cos((lat * Math.PI) / 180);
    for (const thr of THRESHOLDS) {
      if (v >= thr) out[thr] = (out[thr] ?? 0) + cell;
    }
  }
  return out;
}

/**
 * A TS string literal quoted the way Prettier would: single quotes,
 * unless the value holds one and no double quote — L'Aquila.
 */
function quoted(value: string): string {
  const escaped = value.replace(/\\/g, '\\\\');
  if (escaped.includes("'") && !escaped.includes('"')) return `"${escaped}"`;
  return `'${escaped.replace(/'/g, "\\'")}'`;
}

async function json(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url}: ${res.status.toString()}`);
  return res.json();
}

interface FixtureRow {
  name: string;
  preset: string;
  eventId: string;
  maxMmi: number;
  areaKm2: Record<number, number>;
}

async function fetchOne(spec: EventSpec): Promise<FixtureRow | null> {
  const search = (await json(
    `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${spec.from}` +
      `&endtime=${spec.to}&minmagnitude=${spec.minMagnitude.toString()}&limit=3`
  )) as { features?: { id: string }[] };
  const id = search.features?.[0]?.id;
  if (id === undefined) return null;
  const detail = (await json(
    `https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=${id}&format=geojson`
  )) as {
    properties: {
      products: {
        shakemap?: { properties: { maxmmi: string }; contents: Record<string, { url: string }> }[];
      };
    };
  };
  const sm = detail.properties.products.shakemap?.[0];
  if (sm === undefined) return null;
  const key = [
    'download/coverage_mmi_high_res.covjson',
    'download/coverage_mmi_medium_res.covjson',
    'download/coverage_mmi_low_res.covjson',
  ].find((k) => sm.contents[k] !== undefined);
  if (key === undefined) return null;
  const url = sm.contents[key]?.url;
  if (url === undefined) return null;
  const cov = (await json(url)) as Coverage;
  return {
    name: spec.name,
    preset: spec.preset,
    eventId: id,
    maxMmi: Number(sm.properties.maxmmi),
    areaKm2: areasAbove(cov),
  };
}

async function main(): Promise<void> {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const rows: FixtureRow[] = [];
  for (const spec of EVENTS) {
    const row = await fetchOne(spec);
    if (row === null) {
      console.error(`no ShakeMap for ${spec.name}`);
      continue;
    }
    rows.push(row);
    console.error(
      `${row.name}: max MMI ${row.maxMmi.toFixed(2)}, ` +
        THRESHOLDS.map((t) => `≥${t.toString()} ${(row.areaKm2[t] ?? 0).toFixed(0)} km²`).join(', ')
    );
  }
  const body = `/**
 * Observed shaking footprints — GENERATED, do not edit by hand.
 *
 * Run \`pnpm shakemap:build\` to regenerate from the USGS event API.
 *
 * The ground area above each MMI threshold, from the ShakeMap of each
 * event: the only field measurement of an earthquake's shaking there
 * is. Area and not a contour, because the model draws circles and
 * stadiums where the earth draws whatever the geology says, and what
 * the two can honestly be compared on is how much ground shook that
 * hard.
 *
 * Source: USGS Earthquake Hazards Program, ShakeMap product
 * (\`coverage_mmi_*.covjson\`), public domain.
 */

export interface ShakemapFootprint {
  /** The event, as the calibration net names it. */
  name: string;
  /** The preset in \`EARTHQUAKE_PRESETS\` this anchors. */
  preset: string;
  /** USGS event id, so the fixture can be traced back. */
  eventId: string;
  /** Highest MMI anywhere in the published map. */
  maxMmi: number;
  /** Ground area (km²) at or above MMI 7, 8 and 9. Zero means the
   *  event never reached that intensity anywhere. */
  areaKm2: { 7: number; 8: number; 9: number };
}

export const SHAKEMAP_FOOTPRINTS: readonly ShakemapFootprint[] = [
${rows
  .map(
    (r) =>
      `  {\n    name: ${quoted(r.name)},\n    preset: ${quoted(r.preset)},\n` +
      `    eventId: ${quoted(r.eventId)},\n    maxMmi: ${r.maxMmi.toFixed(2)},\n` +
      `    areaKm2: { 7: ${(r.areaKm2[7] ?? 0).toFixed(0)}, 8: ${(r.areaKm2[8] ?? 0).toFixed(0)}, 9: ${(r.areaKm2[9] ?? 0).toFixed(0)} },\n  },`
  )
  .join('\n')}
];
`;
  const outPath = join(repoRoot, 'src', 'physics', 'validation', 'shakemapFixtures.ts');
  writeFileSync(outPath, body);
  console.error(`wrote ${rows.length.toString()} footprints → ${outPath}`);
}

const invokedDirectly =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
