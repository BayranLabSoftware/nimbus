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

interface Drawn {
  rings: DrawnRing[];
  polygons: DrawnPolygon[];
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
  // A volcano's one circular claim. Its ash is a wind-blown polygon and its
  // lahars follow valleys, so neither is an ellipse and neither is read here.
  'pyroclastic-ring': 'pyroclasticRunout',
};

/** Which family's event type each ring belongs to, for the other direction
 *  of check: a number published and nothing drawn. */
const RING_FAMILY: Record<string, string> = {
  explosion: 'explosion',
  'damage-ring': 'impact',
  'mmi-ring': 'earthquake',
  'mmi-stadium': 'earthquake',
  pyroclastic: 'volcano',
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
      }): { latDeg: number; lonDeg: number } => {
        const A = 6378137;
        const E2 = 6.69437999014e-3;
        const p = Math.sqrt(q.x * q.x + q.y * q.y);
        let lat = Math.atan2(q.z, p * (1 - E2));
        for (let i = 0; i < 5; i++) {
          const sn = Math.sin(lat);
          const N = A / Math.sqrt(1 - E2 * sn * sn);
          const h = p / Math.cos(lat) - N;
          lat = Math.atan2(q.z, p * (1 - (E2 * N) / (N + h)));
        }
        return { latDeg: (lat * 180) / Math.PI, lonDeg: (Math.atan2(q.y, q.x) * 180) / Math.PI };
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
          } else {
            others.push(entity.id);
          }
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
    const active = state?.result as { type?: string; data?: Record<string, unknown> } | null;
    const loc = state?.location as { latitude: number; longitude: number } | null;
    return {
      rings,
      polygons,
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

const findings: Finding[] = [];
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
  const page = await browser.newPage({ viewport: { width: 1_440, height: 900 } });
  // The bundler this script runs under keeps function names by rewriting them
  // through a `__name` helper, which exists in Node and not in the page: an
  // evaluated closure that carries one throws `__name is not defined` before
  // it reads anything. The page gets a no-op copy.
  await page.addInitScript('globalThis.__name = globalThis.__name || ((f) => f);');
  for (const scenario of SWEEP_SCENARIOS) {
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
      continue;
    }
    // The rings grow into place; read them once they have arrived.
    await page.waitForTimeout(9_000);
    const drawn = await readGlobe(page);
    let checked = 0;

    // (1) and (2): what is drawn, against what was published.
    for (const ring of drawn.rings) {
      const source = RING_SOURCE[ring.id];
      if (source === undefined) continue;
      const published = at(drawn.result, source);
      checked += 1;
      if (published === undefined) {
        findings.push({
          scenario: scenario.id,
          what: `${ring.id} is drawn from a number the result does not carry`,
          detail: source,
        });
        continue;
      }
      if (!(published > 0)) {
        findings.push({
          scenario: scenario.id,
          what: `${ring.id} is on the globe with nothing behind it`,
          detail: `${source} = ${String(published)}, drawn at ${ring.semiMajorM.toFixed(0)} m`,
        });
        continue;
      }
      // (3) the axes bracket the published radius.
      const lo = Math.min(ring.semiMinorM, ring.semiMajorM);
      const hi = Math.max(ring.semiMinorM, ring.semiMajorM);
      if (published < lo * 0.999 || published > hi * 1.001) {
        findings.push({
          scenario: scenario.id,
          what: `${ring.id} is drawn away from its own number`,
          detail: `published ${published.toFixed(0)} m, drawn ${lo.toFixed(0)}–${hi.toFixed(0)} m`,
        });
      }
      // (2) the caption states it.
      if (ring.label !== null) {
        const said = radiusFromLabel(ring.label);
        if (said !== null && Math.abs(said - published) > Math.max(60, 0.06 * published)) {
          findings.push({
            scenario: scenario.id,
            what: `${ring.id} is captioned with a radius that is not its own`,
            detail: `caption "${ring.label}" (${said.toFixed(0)} m) against ${published.toFixed(0)} m`,
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
        if (offset > Math.max(2_000, 0.5 * published)) {
          findings.push({
            scenario: scenario.id,
            what: `${ring.id} is not centred on the event`,
            detail: `${(offset / 1_000).toFixed(1)} km away, on a ring of ${(published / 1_000).toFixed(1)} km`,
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

    // (1) the other way: a published radius with no ring on the globe.
    for (const [id, source] of Object.entries(RING_SOURCE)) {
      const published = at(drawn.result, source);
      if (published === undefined || !(published > 0)) continue;
      const key = Object.keys(RING_FAMILY).find((k) => id.startsWith(k));
      if (key === undefined || RING_FAMILY[key] !== drawn.eventType) continue;
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
          detail: `${source} = ${published.toFixed(0)} m`,
        });
      }
    }

    // (4) nesting: the drawn order is the published order.
    const family = drawn.rings
      .filter((r) => RING_SOURCE[r.id] !== undefined)
      .map((r) => ({ ring: r, published: at(drawn.result, RING_SOURCE[r.id] ?? '') ?? 0 }))
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
  }
  await browser.close();

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify({ base: BASE, rows, findings }, null, 1)}\n`);
  console.log(`\n${String(findings.length)} findings`);
  for (const f of findings) console.log(`  ${f.scenario}: ${f.what} — ${f.detail}`);
  console.log(`wrote ${OUT}`);
}

await main();
