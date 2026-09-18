import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from '@playwright/test';
import { SWEEP_SCENARIOS, type Scenario } from './sweepScenarios.js';

/**
 * What the globe draws, against what the model said.
 *
 *   pnpm exec tsx scripts/benchmark/globe-audit.ts [base URL] [out.json]
 *
 * `report-sweep.ts` reads what the report page *says* about thirty scenarios.
 * This reads what the globe *draws* for the same thirty — the geometry the
 * renderer actually hands to Cesium, through the `?probe` hook that was built
 * for exactly this and never used: every ellipse's axes, centre, rotation and
 * caption, beside the numbers the store holds for the same event.
 *
 * Nothing is asserted about how a ring should look. What is checked is that
 * the picture and the numbers are the same claim:
 *
 *   1. every radius the model publishes above zero is on the globe, and
 *      nothing is on the globe that the model did not publish;
 *   2. a ring's caption states the model's number;
 *   3. a ring's drawn axes bracket the radius it is captioned with — equal to
 *      it where the ring is circular, longer one way and shorter the other
 *      where the scenario elongates it;
 *   4. rings nest on screen in the order their radii do;
 *   5. every ring is centred on the event, or offset only as far as its own
 *      asymmetry declares.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BASE = process.argv[2] ?? 'http://localhost:5178';
const OUT = process.argv[3] ?? join(ROOT, 'benchmark', 'results', 'globe-audit-2026-09-18.json');

/** An ellipse the renderer handed to Cesium. */
interface DrawnRing {
  id: string;
  semiMajorM: number;
  semiMinorM: number;
  rotationRad: number;
  latDeg: number;
  lonDeg: number;
  label: string | null;
}

/** A contour the renderer drew as a polygon rather than an ellipse: the
 *  stadium a great earthquake's shaking makes around its rupture. */
interface DrawnPolygon {
  id: string;
  vertices: { latDeg: number; lonDeg: number }[];
  label: string | null;
}

/** A line: the dashed isopach around an ash plume, a beacon's shaft. */
interface DrawnLine {
  id: string;
  vertices: { latDeg: number; lonDeg: number; heightM: number }[];
}

/** An hour line of the wave, read against the field it was drawn from. The
 *  sampling happens in the page: the arrival field is half a million numbers
 *  and has no business crossing to Node. */
interface DrawnIsochrone {
  id: string;
  hours: number;
  vertices: number;
  /** The worst distance, in seconds, between the hour the line claims and the
   *  hour the solver's field gives where the line was drawn. */
  worstS: number;
  /** How many vertices are more than a minute from the hour they claim, and
   *  where the worst of them sits: one vertex adrift in four hundred is a
   *  different statement from half the line being adrift. */
  offCount: number;
  worstAt: string;
  /** Vertices that fell outside the field, on no cell at all. */
  offField: number;
}

interface Drawn {
  rings: DrawnRing[];
  polygons: DrawnPolygon[];
  lines: DrawnLine[];
  isochrones: DrawnIsochrone[];
  /** Captions belonging to no contour: an altitude beacon's. */
  labels: { id: string; text: string; heightM: number }[];
  /** Entity ids with no ellipse — polylines, billboards, the rupture. */
  others: string[];
  /** The store's own view of the same event. */
  eventType: string | null;
  location: { lat: number; lon: number } | null;
  result: Record<string, unknown> | null;
}

/** Which published number each ring id is drawn from. Rings whose radius the
 *  renderer takes from a field of the result are listed here by that path;
 *  the audit reads the path out of the store and compares. */
const RING_SOURCE: Record<string, string> = {
  // An explosion's rings, read off Globe.tsx line by line.
  'explosion-crater': 'crater.apparentDiameter/2',
  'explosion-thermal': 'thermal.thirdDegreeBurnRadius',
  'explosion-thermal-2nd': 'thermal.secondDegreeBurnRadius',
  'explosion-5psi': 'blast.overpressure5psiRadiusHob',
  'explosion-1psi': 'blast.overpressure1psiRadiusHob',
  'explosion-light-damage': 'blast.lightDamageRadiusHob',
  'explosion-radiation-ld50': 'radiation.ld50Radius',
  'explosion-emp': 'emp.affectedRadius',
  // An impact's, which the renderer takes from `damage` and not from the
  // blast and thermal blocks the report prints.
  'damage-ring-craterRim': 'damage.craterRim',
  'damage-ring-thirdDegreeBurn': 'damage.thirdDegreeBurn',
  'damage-ring-secondDegreeBurn': 'damage.secondDegreeBurn',
  'damage-ring-overpressure5psi': 'damage.overpressure5psi',
  'damage-ring-overpressure1psi': 'damage.overpressure1psi',
  'damage-ring-lightDamage': 'damage.lightDamage',
  // An earthquake's: a disc about the epicentre, or a stadium about the
  // rupture for a great one.
  'mmi-ring-7': 'shaking.mmi7Radius',
  'mmi-ring-8': 'shaking.mmi8Radius',
  'mmi-ring-9': 'shaking.mmi9Radius',
  'mmi-stadium-7': 'shaking.mmi7Radius',
  'mmi-stadium-8': 'shaking.mmi8Radius',
  'mmi-stadium-9': 'shaking.mmi9Radius',
  // A volcano's pyroclastic reach, and the cavity every family's wave
  // leaves — a slide's, a collapse's, a burst's, an impact's.
  'pyroclastic-ring': 'pyroclasticRunout',
  'lahar-ring': 'laharRunout',
};

/**
 * Rings whose radius is not a field but a derivation, with the expression the
 * product uses. The wave's cavity is the case: a volcano, a slide, a burst
 * and an impact each publish `tsunami.cavityRadius`, and an earthquake does
 * not — its source disc is half the down-dip width, which is what
 * `seismicSourceCavityRadiusM` gives the veil and the solver.
 */
const RING_DERIVED: Record<
  string,
  (r: Record<string, unknown> | null, eventType: string | null) => number | undefined
> = {
  'tsunami-cavity': (r, eventType) => {
    if (eventType !== 'earthquake') return at(r, 'tsunami.cavityRadius');
    // A dry earthquake raises no wave and leaves no cavity: the derivation
    // is only a number when there is a wave to be the source of.
    if (at(r, 'tsunami.initialAmplitude') === undefined) return undefined;
    return Math.max((at(r, 'ruptureWidth') ?? 0) / 2, 10_000);
  },
};

/** What a ring must measure, whether it is read or derived. */
function expectedRadius(
  id: string,
  result: Record<string, unknown> | null,
  eventType: string | null
): number | undefined {
  const derived = RING_DERIVED[id];
  if (derived !== undefined) return derived(result, eventType);
  const path = RING_SOURCE[id];
  return path === undefined ? undefined : at(result, path);
}

/** Which family's event type each ring belongs to, for the other direction
 *  of check: a number published and nothing drawn. */
const RING_FAMILY: Record<string, string> = {
  explosion: 'explosion',
  'damage-ring': 'impact',
  'mmi-ring': 'earthquake',
  'mmi-stadium': 'earthquake',
  pyroclastic: 'volcano',
  lahar: 'volcano',
  // The cavity belongs to whichever event raised the wave.
  'tsunami-cavity': '*',
};

/** Metres between two points on a sphere. */
function greatCircleM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_008.8;
  const toRad = (d: number): number => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Initial bearing from one point to another, degrees clockwise from north. */
function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number): number => (d * Math.PI) / 180;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * The ellipses a scenario elongates on purpose, and what their axes must be.
 * An ash plume is the clear case: `Globe.tsx` draws it with a semi-major of
 * half the downwind range and a semi-minor of the crosswind half-width, its
 * centre pushed half the downwind range along the wind, so the shape runs
 * from the vent to the far edge of the deposit. The caption carries the
 * downwind range, not the semi-major.
 */
const SHAPED: Record<
  string,
  (r: Record<string, unknown> | null) => {
    semiMajorM: number;
    semiMinorM: number;
    offsetM: number;
    captionM: number;
  } | null
> = {
  'ashfall-plume': (r) => {
    const down = at(r, 'windAdvectedAshfall.downwindRange');
    const cross = at(r, 'windAdvectedAshfall.crosswindHalfWidth');
    if (down === undefined || cross === undefined || !(down > 0)) return null;
    return { semiMajorM: down / 2, semiMinorM: cross, offsetM: down / 2, captionM: down };
  },
};

/** The lines whose enclosed area is a published number. */
const LINE_AREA: Record<string, string> = {
  'ashfall-isopach-1mm': 'windAdvectedAshfall.area',
};

/** A beacon's top, against the height the model published. */
const BEACON_HEIGHT: Record<string, string> = {
  'beacon-volcano-column-top': 'plumeHeight',
  'beacon-airburst-top': 'entry.burstAltitude',
};

/** What a family publishes and the globe draws nothing for. Named here so
 *  the silence is counted rather than assumed. */
const NEVER_DRAWN: { field: string; eventType: string; what: string }[] = [
  { field: 'characteristicLength', eventType: 'landslide', what: 'the slide’s own length' },
];

/** Area of a closed ring of lat/lon points, on a sphere (m²). */
function ringAreaM2(vertices: readonly { latDeg: number; lonDeg: number }[]): number {
  if (vertices.length < 3) return 0;
  const R = 6_371_008.8;
  const toRad = (d: number): number => (d * Math.PI) / 180;
  const lat0 = toRad(vertices[0]?.latDeg ?? 0);
  const lon0 = toRad(vertices[0]?.lonDeg ?? 0);
  // A local equirectangular frame is enough: these contours are small
  // against the Earth, and the check is a factor, not a survey.
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    if (a === undefined || b === undefined) continue;
    const xa = R * (toRad(a.lonDeg) - lon0) * Math.cos(lat0);
    const ya = R * (toRad(a.latDeg) - lat0);
    const xb = R * (toRad(b.lonDeg) - lon0) * Math.cos(lat0);
    const yb = R * (toRad(b.latDeg) - lat0);
    area += xa * yb - xb * ya;
  }
  return Math.abs(area) / 2;
}

function at(result: Record<string, unknown> | null, path: string): number | undefined {
  if (result === null) return undefined;
  const half = path.endsWith('/2');
  let node: unknown = result;
  for (const key of (half ? path.slice(0, -2) : path).split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  if (typeof node !== 'number') return undefined;
  return half ? node / 2 : node;
}

async function readGlobe(page: Page): Promise<Drawn> {
  return page.evaluate(() => {
    const w = window as unknown as {
      __nimbusViewer?: {
        entities: { values: unknown[] };
        clock: { currentTime: unknown };
      };
      __nimbusStore?: { getState: () => Record<string, unknown> };
      Cesium?: {
        Cartographic: { fromCartesian: (c: unknown) => { latitude: number; longitude: number } };
      };
    };
    const viewer = w.__nimbusViewer;
    const rings: DrawnRing[] = [];
    const polygons: DrawnPolygon[] = [];
    const lines: DrawnLine[] = [];
    const isochrones: DrawnIsochrone[] = [];
    const labels: { id: string; text: string; heightM: number }[] = [];
    const others: string[] = [];
    if (viewer !== undefined) {
      const now = viewer.clock.currentTime;
      const value = (p: unknown): unknown => {
        if (p === undefined || p === null) return undefined;
        const prop = p as { getValue?: (t: unknown) => unknown };
        return typeof prop.getValue === 'function' ? prop.getValue(now) : p;
      };
      const toLatLon = (q: {
        x: number;
        y: number;
        z: number;
      }): { latDeg: number; lonDeg: number; heightM: number } => {
        const A = 6378137;
        const E2 = 6.69437999014e-3;
        const p = Math.sqrt(q.x * q.x + q.y * q.y);
        let lat = Math.atan2(q.z, p * (1 - E2));
        let height = 0;
        for (let i = 0; i < 6; i++) {
          const sn = Math.sin(lat);
          const N = A / Math.sqrt(1 - E2 * sn * sn);
          height = p / Math.cos(lat) - N;
          lat = Math.atan2(q.z, p * (1 - (E2 * N) / (N + height)));
        }
        return {
          latDeg: (lat * 180) / Math.PI,
          lonDeg: (Math.atan2(q.y, q.x) * 180) / Math.PI,
          heightM: height,
        };
      };
      for (const raw of viewer.entities.values) {
        const entity = raw as {
          id: string;
          ellipse?: Record<string, unknown>;
          position?: unknown;
          label?: { text?: unknown };
        };
        if (entity.ellipse === undefined) {
          const hierarchy = value(
            (entity as { polygon?: { hierarchy?: unknown } }).polygon?.hierarchy
          ) as { positions?: { x: number; y: number; z: number }[] } | undefined;
          if (hierarchy?.positions !== undefined) {
            polygons.push({
              id: entity.id,
              vertices: hierarchy.positions.map((q) => toLatLon(q)),
              label: null,
            });
            continue;
          }
          const line = value(
            (entity as { polyline?: { positions?: unknown } }).polyline?.positions
          ) as { x: number; y: number; z: number }[] | undefined;
          if (line !== undefined) {
            lines.push({ id: entity.id, vertices: line.map((q) => toLatLon(q)) });
            continue;
          }
          const loose = value((entity as { label?: { text?: unknown } }).label?.text);
          const where = value(entity.position) as { x: number; y: number; z: number } | undefined;
          if (typeof loose === 'string' && where !== undefined) {
            labels.push({ id: entity.id, text: loose, heightM: toLatLon(where).heightM });
          }
          others.push(entity.id);
          continue;
        }
        const a = value(entity.ellipse.semiMajorAxis);
        const b = value(entity.ellipse.semiMinorAxis);
        const rot = value(entity.ellipse.rotation);
        const pos = value(entity.position) as { x: number; y: number; z: number } | undefined;
        let latDeg = Number.NaN;
        let lonDeg = Number.NaN;
        if (pos !== undefined) {
          const ll = toLatLon(pos);
          latDeg = ll.latDeg;
          lonDeg = ll.lonDeg;
        }
        rings.push({
          id: entity.id,
          semiMajorM: typeof a === 'number' ? a : Number.NaN,
          semiMinorM: typeof b === 'number' ? b : Number.NaN,
          rotationRad: typeof rot === 'number' ? rot : 0,
          latDeg,
          lonDeg,
          label: null,
        });
      }
      // Captions live on their own entities, id `${ringId}-label`.
      for (const raw of viewer.entities.values) {
        const entity = raw as { id: string; label?: { text?: unknown } };
        if (entity.label === undefined) continue;
        const text = value(entity.label.text);
        const owner = entity.id.replace(/-label$/, '');
        if (typeof text !== 'string') continue;
        const ring = rings.find((r) => r.id === owner);
        if (ring !== undefined) ring.label = text;
        const polygon = polygons.find((r) => r.id === owner);
        if (polygon !== undefined) polygon.label = text;
      }
    }
    const state = w.__nimbusStore?.getState();
    // The hour lines of the wave, against the solver's own arrival field.
    // `Globe.tsx` extracts them at hours × 3 600 s over the planetary raster
    // between 85° south and 85° north, so the audit samples that same raster
    // where each line was drawn: a line that says "+4 h" must lie where the
    // field says four hours.
    const bathy = state?.bathymetricTsunami as
      | { global?: { field?: { arrivalTimes: ArrayLike<number>; nLat: number; nLon: number } } }
      | null
      | undefined;
    const field = bathy?.global?.field;
    if (field !== undefined) {
      const { arrivalTimes, nLat, nLon } = field;
      const minLat = -85;
      const maxLat = 85;
      const minLon = -180;
      const maxLon = 180;
      const dLat = (maxLat - minLat) / (nLat - 1);
      const dLon = (maxLon - minLon) / (nLon - 1);
      const sample = (latDeg: number, lonDeg: number): number => {
        const y = (maxLat - latDeg) / dLat;
        const x = (lonDeg - minLon) / dLon;
        const i = Math.floor(y);
        const j = Math.floor(x);
        if (i < 0 || j < 0 || i >= nLat - 1 || j >= nLon - 1) return Number.NaN;
        const fy = y - i;
        const fx = x - j;
        const v = (r: number, c: number): number => arrivalTimes[r * nLon + c] ?? Number.NaN;
        const nw = v(i, j);
        const ne = v(i, j + 1);
        const sw = v(i + 1, j);
        const se = v(i + 1, j + 1);
        if (![nw, ne, sw, se].every((n) => Number.isFinite(n))) return Number.NaN;
        return nw * (1 - fx) * (1 - fy) + ne * fx * (1 - fy) + sw * (1 - fx) * fy + se * fx * fy;
      };
      for (const line of lines) {
        const match = /^tsunami-isochrone-(\d+)h-\d+$/.exec(line.id);
        if (match === null) continue;
        const hours = Number(match[1]);
        let worstS = 0;
        let offField = 0;
        let offCount = 0;
        let worstAt = '';
        for (const vertex of line.vertices) {
          const t = sample(vertex.latDeg, vertex.lonDeg);
          if (!Number.isFinite(t)) {
            offField += 1;
            continue;
          }
          const off = Math.abs(t - hours * 3_600);
          if (off > 60) offCount += 1;
          if (off > worstS) {
            worstS = off;
            worstAt = `lat ${vertex.latDeg.toFixed(2)}, lon ${vertex.lonDeg.toFixed(2)}, field ${(
              t / 3_600
            ).toFixed(2)} h`;
          }
        }
        isochrones.push({
          id: line.id,
          hours,
          vertices: line.vertices.length,
          worstS,
          offCount,
          worstAt,
          offField,
        });
      }
    }
    const active = state?.result as { type?: string; data?: Record<string, unknown> } | null;
    const loc = state?.location as { latitude: number; longitude: number } | null;
    return {
      rings,
      polygons,
      lines,
      isochrones,
      labels,
      others,
      eventType: active?.type ?? null,
      location: loc === null ? null : { lat: loc.latitude, lon: loc.longitude },
      result: active?.data ?? null,
    };
  });
}

interface Finding {
  scenario: string;
  what: string;
  detail: string;
}

/** A contradiction: the picture and the numbers disagree. */
const findings: Finding[] = [];
/** A silence: the model published a quantity and the globe draws nothing for
 *  it. Not a contradiction — the picture says nothing rather than something
 *  false — but counted, so it cannot pass for coverage. */
const silences: Finding[] = [];
const rows: {
  scenario: string;
  family: string;
  eventType: string | null;
  ringsDrawn: number;
  polygonsDrawn: number;
  checked: number;
}[] = [];

function link(s: Scenario): string {
  // `m=globe` because a link only runs itself outside the landing view
  // (`maybeAutoEvaluate`), and `probe` because the viewer is handed out to
  // nobody else.
  const params = new URLSearchParams({ v: '1', p: 'CUSTOM', m: 'globe', probe: '1' });
  for (const [key, value] of Object.entries(s.params)) params.set(key, String(value));
  return `${BASE}/?${params.toString()}`;
}

/** The radius a caption states, back in metres. The page is opened in
 *  English, where `formatRingRadius` groups thousands with a comma and marks
 *  a decimal with a dot: "1,305 km" is thirteen hundred kilometres, not one
 *  and a third. Reading it the other way is what made this audit's first run
 *  accuse five correct captions. */
function radiusFromLabel(label: string): number | null {
  const match = /([\d.,\u202f\u00a0\s]+)\s*(m|km)\b/.exec(label);
  if (match === null) return null;
  const digits = (match[1] ?? '').replace(/[\u202f\u00a0\s,]/g, '');
  const value = Number(digits);
  if (!Number.isFinite(value)) return null;
  return match[2] === 'km' ? value * 1_000 : value;
}

async function main(): Promise<void> {
  const browser = await chromium.launch();
  for (const scenario of SWEEP_SCENARIOS) {
    // A page of its own for each scenario. Sharing one across thirty left the
    // ring cascade of a later scenario unstarted — a cavity read at a
    // millimetre where the model published three hundred metres — and a
    // reading that depends on how many scenarios ran before it is not a
    // reading. Reopening costs a second and buys the zero its meaning.
    const page = await browser.newPage({ viewport: { width: 1_440, height: 900 } });
    // The bundler this script runs under keeps function names by rewriting
    // them through a `__name` helper, which exists in Node and not in the
    // page: an evaluated closure that carries one throws `__name is not
    // defined` before it reads anything. The page gets a no-op copy.
    await page.addInitScript('globalThis.__name = globalThis.__name || ((f) => f);');
    const url = link(scenario);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    try {
      await page.waitForFunction(
        () =>
          (window as unknown as { __nimbusViewer?: unknown }).__nimbusViewer !== undefined &&
          ((
            window as unknown as { __nimbusStore?: { getState: () => { result?: unknown } } }
          ).__nimbusStore?.getState().result ?? null) !== null,
        undefined,
        { timeout: 40_000 }
      );
    } catch {
      findings.push({
        scenario: scenario.id,
        what: 'nothing was drawn',
        detail: 'the probe never saw a viewer with a result on it',
      });
      rows.push({
        scenario: scenario.id,
        family: scenario.family,
        eventType: null,
        ringsDrawn: 0,
        polygonsDrawn: 0,
        checked: 0,
      });
      await page.close();
      continue;
    }
    // The rings grow into place, and the store re-runs the scenario when the
    // terrain tile arrives — which purges every ring and starts the growth
    // again. A fixed wait can land in the middle of either, and then the
    // audit reads a ring at nothing and calls the product wrong. So: read
    // until two readings a second and a half apart agree on every radius.
    let drawn = await readGlobe(page);
    for (let settle = 0; settle < 12; settle++) {
      await page.waitForTimeout(1_500);
      const again = await readGlobe(page);
      const shape = (d: Drawn): string =>
        [
          ...d.rings.map((r) => `${r.id}:${r.semiMajorM.toFixed(0)}:${r.semiMinorM.toFixed(0)}`),
          ...d.polygons.map((r) => `${r.id}:${r.vertices.length.toString()}`),
        ]
          .sort((a, b) => a.localeCompare(b))
          .join('|');
      // Two readings agreeing is not enough on its own: the cascade staggers
      // each ring's start by its own radius, so two reads taken before a far
      // ring begins agree at nothing. A ring is only added when its radius is
      // positive, so a settled globe has no ellipse still at zero.
      // A ring begins its growth at RING_INITIAL_RADIUS_M, which is a
      // millimetre — so "every ring is positive" is true before anything has
      // moved, and two reads taken during a camera flight agree at a
      // millimetre. A metre is the floor that means "arrived".
      const settled =
        shape(drawn) === shape(again) &&
        again.rings.length > 0 &&
        again.rings.every((r) => r.semiMajorM >= 1);
      drawn = again;
      if (settled) break;
    }
    let checked = 0;

    // (1) and (2): what is drawn, against what was published.
    for (const ring of drawn.rings) {
      if (RING_SOURCE[ring.id] === undefined && RING_DERIVED[ring.id] === undefined) continue;
      const published = expectedRadius(ring.id, drawn.result, drawn.eventType);
      checked += 1;
      if (published === undefined) {
        findings.push({
          scenario: scenario.id,
          what: `${ring.id} is drawn from a number the result does not carry`,
          detail: ring.id,
        });
        continue;
      }
      if (!(published > 0)) {
        findings.push({
          scenario: scenario.id,
          what: `${ring.id} is on the globe with nothing behind it`,
          detail: `nothing published, drawn at ${ring.semiMajorM.toFixed(0)} m`,
        });
        continue;
      }
      // (3) the axes. A ring the scenario elongates on purpose is held to
      // the shape its own numbers describe; every other ring must bracket
      // the radius it was drawn from.
      const shape = SHAPED[ring.id]?.(drawn.result) ?? null;
      const lo = Math.min(ring.semiMinorM, ring.semiMajorM);
      const hi = Math.max(ring.semiMinorM, ring.semiMajorM);
      if (shape !== null) {
        const wantHi = Math.max(shape.semiMajorM, shape.semiMinorM);
        const wantLo = Math.min(shape.semiMajorM, shape.semiMinorM);
        if (
          Math.abs(hi - wantHi) > Math.max(500, 0.02 * wantHi) ||
          Math.abs(lo - wantLo) > Math.max(500, 0.02 * wantLo)
        ) {
          findings.push({
            scenario: scenario.id,
            what: `${ring.id} is not the shape its numbers describe`,
            detail: `drawn ${(lo / 1_000).toFixed(1)} × ${(hi / 1_000).toFixed(1)} km, wanted ${(wantLo / 1_000).toFixed(1)} × ${(wantHi / 1_000).toFixed(1)} km`,
          });
        }
      } else if (published < lo * 0.999 || published > hi * 1.001) {
        findings.push({
          scenario: scenario.id,
          what: `${ring.id} is drawn away from its own number`,
          detail: `published ${published.toFixed(0)} m, drawn ${lo.toFixed(0)}–${hi.toFixed(0)} m`,
        });
      }
      // (2) the caption states it — the downwind range for a plume, the
      // radius for a ring.
      const captionWants = shape?.captionM ?? published;
      if (ring.label !== null) {
        const said = radiusFromLabel(ring.label);
        if (said !== null && Math.abs(said - captionWants) > Math.max(60, 0.06 * captionWants)) {
          findings.push({
            scenario: scenario.id,
            what: `${ring.id} is captioned with a number that is not its own`,
            detail: `caption "${ring.label}" (${said.toFixed(0)} m) against ${captionWants.toFixed(0)} m`,
          });
        }
      }
      // (5) centred on the event.
      if (drawn.location !== null && Number.isFinite(ring.latDeg)) {
        const dLat = (ring.latDeg - drawn.location.lat) * 111_000;
        const dLon =
          (ring.lonDeg - drawn.location.lon) *
          111_000 *
          Math.cos((drawn.location.lat * Math.PI) / 180);
        const offset = Math.hypot(dLat, dLon);
        const wantOffset = shape?.offsetM ?? 0;
        const slack = Math.max(2_000, 0.5 * (shape === null ? published : wantOffset));
        if (Math.abs(offset - wantOffset) > slack) {
          findings.push({
            scenario: scenario.id,
            what: `${ring.id} is not where its own numbers put it`,
            detail: `${(offset / 1_000).toFixed(1)} km from the event, wanted ${(wantOffset / 1_000).toFixed(1)} km`,
          });
        }
      }
    }

    // (3b) a great earthquake draws its shaking as a stadium around the
    // rupture, not as a disc about the epicentre, and the statement it makes
    // is exactly this: every point of the contour is the published radius
    // away from the rupture rectangle. So each vertex is carried back into
    // the rupture's own frame — along strike, across strike — and its
    // distance to that rectangle is compared with the radius.
    //
    // The first reading of this audit asked instead for the nearest vertex to
    // sit at half the width plus the radius, and called eight correct
    // stadiums wrong: the polygon has vertices only at its four corner caps,
    // so the nearest vertex is not the nearest point of the boundary. The
    // check below has no such blind spot — it holds at every vertex.
    const halfLength = (at(drawn.result, 'ruptureLength') ?? 0) / 2;
    const halfWidth = (at(drawn.result, 'ruptureWidth') ?? 0) / 2;
    const strikeDeg = at(drawn.result, 'inputs.strikeAzimuthDeg') ?? 0;
    for (const polygon of drawn.polygons) {
      const source = RING_SOURCE[polygon.id];
      if (source === undefined || drawn.location === null) continue;
      const published = at(drawn.result, source);
      if (published === undefined || !(published > 0)) {
        findings.push({
          scenario: scenario.id,
          what: `${polygon.id} is on the globe with nothing behind it`,
          detail: `${source} = ${String(published)}`,
        });
        continue;
      }
      checked += 1;
      const centre = drawn.location;
      let worst = 0;
      let worstAt = '';
      for (const vertex of polygon.vertices) {
        const d = greatCircleM(centre.lat, centre.lon, vertex.latDeg, vertex.lonDeg);
        const az = bearingDeg(centre.lat, centre.lon, vertex.latDeg, vertex.lonDeg);
        const fromStrike = ((az - strikeDeg) * Math.PI) / 180;
        const alongStrike = Math.abs(d * Math.cos(fromStrike));
        const acrossStrike = Math.abs(d * Math.sin(fromStrike));
        const dx = Math.max(0, alongStrike - halfLength);
        const dy = Math.max(0, acrossStrike - halfWidth);
        const toRupture = Math.hypot(dx, dy);
        const off = Math.abs(toRupture - published);
        if (off > worst) {
          worst = off;
          worstAt = `${(toRupture / 1_000).toFixed(1)} km from the rupture where the contour is ${(published / 1_000).toFixed(1)} km`;
        }
      }
      if (worst > Math.max(1_000, 0.04 * published)) {
        findings.push({
          scenario: scenario.id,
          what: `${polygon.id} is not the contour its radius describes`,
          detail: `worst vertex ${worstAt}`,
        });
      }
      if (polygon.label !== null) {
        const said = radiusFromLabel(polygon.label);
        if (said !== null && Math.abs(said - published) > Math.max(60, 0.06 * published)) {
          findings.push({
            scenario: scenario.id,
            what: `${polygon.id} is captioned with a radius that is not its own`,
            detail: `caption "${polygon.label}" (${said.toFixed(0)} m) against ${published.toFixed(0)} m`,
          });
        }
      }
    }

    // (3c) a line whose enclosed area is a published number: the dashed
    // isopach the ash plume carries.
    for (const line of drawn.lines) {
      const source = LINE_AREA[line.id];
      if (source === undefined) continue;
      const published = at(drawn.result, source);
      if (published === undefined || !(published > 0)) continue;
      checked += 1;
      const drawnArea = ringAreaM2(line.vertices);
      const ratio = drawnArea / published;
      if (ratio < 0.95 || ratio > 1.05) {
        findings.push({
          scenario: scenario.id,
          what: `${line.id} encloses an area its own number does not`,
          detail: `${(drawnArea / 1e6).toFixed(0)} km² drawn against ${(published / 1e6).toFixed(0)} km² published (${ratio.toFixed(3)}×)`,
        });
      }
    }

    // (3c-bis) an hour line lies where the solver says that hour is.
    for (const iso of drawn.isochrones) {
      if (iso.vertices === 0) continue;
      checked += 1;
      // The line is a crossing of the same raster, so agreement should be
      // near exact; a tolerance of a minute leaves room for the chaining and
      // for the float the field is stored in.
      if (iso.worstS > 60) {
        findings.push({
          scenario: scenario.id,
          what: `${iso.id} is drawn where the wave is not at that hour`,
          detail: `${iso.offCount.toString()} of ${iso.vertices.toString()} vertices off, worst by ${(
            iso.worstS / 60
          ).toFixed(1)} min — ${iso.worstAt}`,
        });
      }
      if (iso.offField > iso.vertices / 2) {
        findings.push({
          scenario: scenario.id,
          what: `${iso.id} is drawn mostly off the field it came from`,
          detail: `${iso.offField.toString()} of ${iso.vertices.toString()} vertices on no cell`,
        });
      }
    }

    // (3d) a beacon stands at the height the model published.
    for (const label of drawn.labels) {
      const source = BEACON_HEIGHT[label.id];
      if (source === undefined) continue;
      const published = at(drawn.result, source);
      if (published === undefined || !(published > 0)) continue;
      checked += 1;
      if (Math.abs(label.heightM - published) > Math.max(200, 0.03 * published)) {
        findings.push({
          scenario: scenario.id,
          what: `${label.id} stands at a height the model did not give it`,
          detail: `${(label.heightM / 1_000).toFixed(1)} km drawn against ${(published / 1_000).toFixed(1)} km published`,
        });
      }
      const said = radiusFromLabel(label.text);
      if (said !== null && Math.abs(said - published) > Math.max(200, 0.06 * published)) {
        findings.push({
          scenario: scenario.id,
          what: `${label.id} is captioned with a height that is not its own`,
          detail: `caption "${label.text}" against ${published.toFixed(0)} m`,
        });
      }
    }

    // (3e) what the model published and the globe says nothing about.
    for (const silent of NEVER_DRAWN) {
      if (silent.eventType !== drawn.eventType) continue;
      const published = at(drawn.result, silent.field);
      if (published === undefined || !(published > 0)) continue;
      silences.push({
        scenario: scenario.id,
        what: `${silent.what} is published and the globe draws nothing for it`,
        detail: `${silent.field} = ${(published / 1_000).toFixed(1)} km`,
      });
    }

    // (1) the other way: a published radius with no ring on the globe.
    for (const id of [...Object.keys(RING_SOURCE), ...Object.keys(RING_DERIVED)]) {
      const published = expectedRadius(id, drawn.result, drawn.eventType);
      if (published === undefined || !(published > 0)) continue;
      const key = Object.keys(RING_FAMILY).find((k) => id.startsWith(k));
      if (key === undefined) continue;
      if (RING_FAMILY[key] !== '*' && RING_FAMILY[key] !== drawn.eventType) continue;
      // A great earthquake draws stadiums instead of discs, and a small one
      // discs instead of stadiums: either shape answers for the number.
      const twin = id.startsWith('mmi-ring-')
        ? id.replace('mmi-ring-', 'mmi-stadium-')
        : id.startsWith('mmi-stadium-')
          ? id.replace('mmi-stadium-', 'mmi-ring-')
          : id;
      const somewhere = (i: string): boolean =>
        drawn.rings.some((r) => r.id === i) || drawn.polygons.some((r) => r.id === i);
      if (!somewhere(id) && !somewhere(twin)) {
        findings.push({
          scenario: scenario.id,
          what: `${id} was published and is not on the globe`,
          detail: `${(published / 1_000).toFixed(1)} km`,
        });
      }
    }

    // (4) nesting: the drawn order is the published order.
    const family = drawn.rings
      .filter((r) => RING_SOURCE[r.id] !== undefined || RING_DERIVED[r.id] !== undefined)
      .map((r) => ({
        ring: r,
        published: expectedRadius(r.id, drawn.result, drawn.eventType) ?? 0,
      }))
      .filter((r) => r.published > 0)
      .sort((a, b) => a.published - b.published);
    for (let i = 1; i < family.length; i++) {
      const inner = family[i - 1];
      const outer = family[i];
      if (inner === undefined || outer === undefined) continue;
      if (outer.ring.semiMajorM < inner.ring.semiMajorM * 0.999) {
        findings.push({
          scenario: scenario.id,
          what: 'two rings are drawn in the wrong order',
          detail: `${inner.ring.id} (${inner.published.toFixed(0)} m) is drawn at ${inner.ring.semiMajorM.toFixed(
            0
          )} m, outside ${outer.ring.id} (${outer.published.toFixed(0)} m) at ${outer.ring.semiMajorM.toFixed(0)} m`,
        });
      }
    }

    rows.push({
      scenario: scenario.id,
      family: scenario.family,
      eventType: drawn.eventType,
      ringsDrawn: drawn.rings.length,
      polygonsDrawn: drawn.polygons.length,
      checked,
    });
    console.log(
      `${scenario.id.padEnd(26)} ${String(drawn.eventType).padEnd(10)} ${String(drawn.rings.length).padStart(3)} ellissi ${String(drawn.polygons.length).padStart(2)} poligoni, ${String(checked).padStart(2)} confrontate`
    );
    await page.close();
  }
  await browser.close();

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify({ base: BASE, rows, findings, silences }, null, 1)}\n`);
  console.log(`\n${String(findings.length)} findings`);
  for (const f of findings) console.log(`  ${f.scenario}: ${f.what} — ${f.detail}`);
  console.log(`${String(silences.length)} silences — published, and the globe says nothing`);
  for (const f of silences) console.log(`  ${f.scenario}: ${f.what} — ${f.detail}`);
  console.log(`wrote ${OUT}`);
}

await main();
