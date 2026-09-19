import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { surfaceProjectionReachM } from '../src/physics/validation/faultStrikeRules.js';

/**
 * The faults an earthquake can point along: the GEM Global Active Faults
 * Database, cut into the tiles a reader's click loads one of.
 *
 * The source is the harmonized GeoJSON of the GEM GAF-DB (Styron & Pagani
 * 2020, Earthquake Spectra 36(1_suppl), 160-180, doi:10.1177/8755293020944182),
 * CC-BY-SA-4.0:
 *
 *   https://raw.githubusercontent.com/GEMScienceTools/gem-global-active-faults
 *     /master/geojson/gem_active_faults_harmonized.geojson
 *
 * 13 696 traces, of which slip_type is filled on 97.7 %, the dip on 40.0 % and
 * the lower seismogenic depth on 24.2 %. Rule 289 of
 * `src/physics/validation/faultStrikeRules.ts` says what fills the gaps: the
 * database's own median for that slip type, computed here and written into the
 * index, so that the number is a property of the published data.
 *
 * The tiles are ten degrees square. A fault is written into every tile whose
 * bounds, grown by THAT FAULT'S OWN REACH under rule 288, its trace touches —
 * so a click reads one tile and still finds a megathrust whose trace is two
 * hundred kilometres out to sea, while a vertical strike-slip is carried only
 * into the tiles it nearly touches. Growing every fault by the cap instead
 * would be correct and wasteful: it put nine and a third megabytes on a reader
 * who needs three, which is rule 292(f)'s budget, and rule 293 does not permit
 * moving a budget to fit a candidate. The growth is taken in longitude at the
 * tile's own latitude, where a degree is shortest.
 *
 * Traces are simplified to two hundred metres (Douglas-Peucker). Rule 287
 * reads a strike as the chord across a window the length of the rupture, and
 * moving the window's ends by at most 200 m turns that chord by at most
 * 2 x 200/L radians: 0.5 degrees over the fifty kilometres of the shortest
 * rupture drawn as an extended source, and less for every longer one. The
 * saving is most of the file.
 *
 *   pnpm exec tsx scripts/build-faults.ts <gem_active_faults_harmonized.geojson>
 *
 * Writes `public/data/faults/`. Nothing here runs Nimbus.
 */

const REPO_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT_DIR = join(REPO_ROOT, 'public', 'data', 'faults');

/** Rule 288's cap, in metres, and the tile grid. */
const REACH_CAP_M = 300_000;
const TILE_DEG = 10;
/** Rule 287 reads a strike over a window; 200 m turns that chord by half a
 *  degree at the shortest extended-source rupture and less at every longer. */
const SIMPLIFY_TOLERANCE_M = 200;
const M_PER_DEG_LAT = 111_320;
/** Coordinates are kept to four decimals: 11 m, far finer than a mapped trace,
 *  and written as integers in that unit — the first point of a trace absolute,
 *  every later one a step from the one before. A fault trace steps by tens of
 *  units, so the file carries two or three characters a point instead of
 *  nine, and that is what brings 3.84 MB inside rule 292(f)'s three. */
const COORD_UNITS_PER_DEG = 10_000;

/** The kinematic classes the database uses, as the codes a tile stores. */
const SLIP_TYPES = [
  'Normal',
  'Reverse',
  'Dextral',
  'Sinistral',
  'Strike-Slip',
  'Subduction_Thrust',
  'Spreading_Ridge',
  'Dextral_Transform',
  'Sinistral_Transform',
  'Normal-Strike-Slip',
  'Reverse-Strike-Slip',
  'Dextral-Normal',
  'Dextral-Reverse',
  'Sinistral-Normal',
  'Sinistral-Reverse',
  'Anticline',
  'Syncline',
  'Blind_Thrust',
  'Subduction_Thrust_Shallow',
  'Unknown',
] as const;

interface GemFeature {
  geometry: { type: string; coordinates: unknown };
  properties: Record<string, unknown>;
}

/** The database writes a scalar as a '(preferred,min,max)' string. Read the
 *  preferred value, and nothing when there is none. */
function tupleValue(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw !== 'string') return null;
  const first = raw.replace(/^\(/, '').split(',')[0]?.trim() ?? '';
  if (first === '') return null;
  const v = Number.parseFloat(first);
  return Number.isFinite(v) ? v : null;
}

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  if (s.length % 2 === 1) return s[mid] ?? null;
  return ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
}

/** Perpendicular distance from a point to a segment, in metres, in the local
 *  tangent plane about the segment — exact enough over a fault trace. */
function segmentDistanceM(
  p: [number, number],
  a: [number, number],
  b: [number, number],
  cosLat: number
): number {
  const px = (p[0] - a[0]) * cosLat * M_PER_DEG_LAT;
  const py = (p[1] - a[1]) * M_PER_DEG_LAT;
  const bx = (b[0] - a[0]) * cosLat * M_PER_DEG_LAT;
  const by = (b[1] - a[1]) * M_PER_DEG_LAT;
  const len2 = bx * bx + by * by;
  if (!(len2 > 0)) return Math.hypot(px, py);
  const t = Math.min(1, Math.max(0, (px * bx + py * by) / len2));
  return Math.hypot(px - t * bx, py - t * by);
}

/** Douglas-Peucker on a lon/lat trace, to a tolerance in metres. */
function simplify(points: [number, number][], toleranceM: number): [number, number][] {
  if (points.length <= 2) return points;
  const cosLat = Math.max(0.02, Math.cos(((points[0]?.[1] ?? 0) * Math.PI) / 180));
  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length > 0) {
    const span = stack.pop();
    if (span === undefined) continue;
    const [first, last] = span;
    const a = points[first];
    const b = points[last];
    if (a === undefined || b === undefined) continue;
    let worst = -1;
    let worstAt = -1;
    for (let i = first + 1; i < last; i += 1) {
      const p = points[i];
      if (p === undefined) continue;
      const d = segmentDistanceM(p, a, b, cosLat);
      if (d > worst) {
        worst = d;
        worstAt = i;
      }
    }
    if (worst > toleranceM && worstAt > 0) {
      keep[worstAt] = true;
      stack.push([first, worstAt], [worstAt, last]);
    }
  }
  const out: [number, number][] = [];
  for (let i = 0; i < points.length; i += 1) {
    if (keep[i] === true) {
      const p = points[i];
      if (p !== undefined) out.push(p);
    }
  }
  return out;
}

function units(x: number): number {
  return Math.round(x * COORD_UNITS_PER_DEG);
}

/** A fault as a tile carries it: kinematics, geometry, and where it came from. */
interface TileFault {
  /** Trace as integers of 1e-4°, flattened lon, lat, lon, lat …, the first
   *  point absolute and the rest steps from the one before. */
  t: number[];
  /** Index into SLIP_TYPES. */
  k: number;
  /** Dip in degrees, when the database has one. */
  d?: number;
  /** Lower seismogenic depth in km, when the database has one. */
  z?: number;
  /** Fault name, when it has one. */
  n?: string;
  /** The database's own identifier, so a reading can be traced back. */
  i?: string;
}

function main(): void {
  const input = process.argv[2];
  if (input === undefined || !existsSync(input)) {
    console.error('usage: build-faults.ts <gem_active_faults_harmonized.geojson>');
    process.exit(2);
  }

  const raw = JSON.parse(readFileSync(input, 'utf8')) as { features: GemFeature[] };
  const features = raw.features;

  // Rule 289: the database's own medians, by slip type, for the six traces in
  // ten with no dip and the three in four with no depth.
  const dipsBy = new Map<string, number[]>();
  const depthsBy = new Map<string, number[]>();
  for (const f of features) {
    const k = typeof f.properties.slip_type === 'string' ? f.properties.slip_type : 'Unknown';
    const dip = tupleValue(f.properties.average_dip);
    const z = tupleValue(f.properties.lower_seis_depth);
    if (dip !== null && dip > 0 && dip <= 90) {
      const list = dipsBy.get(k) ?? [];
      list.push(dip);
      dipsBy.set(k, list);
    }
    if (z !== null && z > 0) {
      const list = depthsBy.get(k) ?? [];
      list.push(z);
      depthsBy.set(k, list);
    }
  }
  const medianDipDeg: Record<string, number> = {};
  const medianLowerDepthKm: Record<string, number> = {};
  for (const [k, xs] of dipsBy) {
    const m = median(xs);
    if (m !== null) medianDipDeg[k] = Math.round(m * 10) / 10;
  }
  for (const [k, xs] of depthsBy) {
    const m = median(xs);
    if (m !== null) medianLowerDepthKm[k] = Math.round(m * 10) / 10;
  }
  // Everything the database left unclassified falls back to the median over
  // every trace that has one, which is the widest honest statement available.
  const allDips = [...dipsBy.values()].flat();
  const allDepths = [...depthsBy.values()].flat();
  const fallbackDipDeg = Math.round((median(allDips) ?? 90) * 10) / 10;
  const fallbackLowerDepthKm = Math.round((median(allDepths) ?? 15) * 10) / 10;

  // Cut into tiles.
  const cols = 360 / TILE_DEG;
  const rows = 180 / TILE_DEG;
  const tiles = new Map<string, TileFault[]>();
  let kept = 0;
  let dropped = 0;
  let pointsIn = 0;
  let pointsOut = 0;

  for (const f of features) {
    if (f.geometry.type !== 'LineString') {
      dropped += 1;
      continue;
    }
    const coords = f.geometry.coordinates as [number, number][];
    if (!Array.isArray(coords) || coords.length < 2) {
      dropped += 1;
      continue;
    }
    const slip = typeof f.properties.slip_type === 'string' ? f.properties.slip_type : 'Unknown';
    const kIndex = SLIP_TYPES.indexOf(slip as (typeof SLIP_TYPES)[number]);
    const dip = tupleValue(f.properties.average_dip);
    const z = tupleValue(f.properties.lower_seis_depth);
    const name = typeof f.properties.name === 'string' ? f.properties.name : undefined;
    const id = typeof f.properties.catalog_id === 'string' ? f.properties.catalog_id : undefined;

    const clean = coords.filter((c) => Number.isFinite(c[0]) && Number.isFinite(c[1]));
    const simplified = simplify(clean, SIMPLIFY_TOLERANCE_M);
    pointsIn += clean.length;
    pointsOut += simplified.length;
    const flat: number[] = [];
    let minLat = 90;
    let maxLat = -90;
    let minLon = 180;
    let maxLon = -180;
    let prevLon = 0;
    let prevLat = 0;
    for (let i = 0; i < simplified.length; i += 1) {
      const c = simplified[i];
      if (c === undefined) continue;
      const lon = c[0];
      const lat = c[1];
      const ul = units(lon);
      const ua = units(lat);
      if (i === 0) flat.push(ul, ua);
      else flat.push(ul - prevLon, ua - prevLat);
      prevLon = ul;
      prevLat = ua;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
    }
    if (flat.length < 4) {
      dropped += 1;
      continue;
    }

    const fault: TileFault = { t: flat, k: kIndex >= 0 ? kIndex : SLIP_TYPES.length - 1 };
    if (dip !== null && dip > 0 && dip <= 90) fault.d = Math.round(dip * 10) / 10;
    if (z !== null && z > 0) fault.z = Math.round(z * 10) / 10;
    if (name !== undefined && name !== '') fault.n = name;
    if (id !== undefined && id !== '') fault.i = id;

    // Which tiles this trace can be read from: every tile whose own bounds,
    // grown by the reach cap, the trace touches. The growth in longitude is
    // taken at the latitude where a degree is shortest inside the tile, so a
    // tile never misses a fault it could have answered with.
    // Rule 288's reach, for THIS fault: its own dip and depth where the
    // database has them, its slip type's median where it does not.
    const reachM = surfaceProjectionReachM(
      fault.d ?? medianDipDeg[slip] ?? fallbackDipDeg,
      1_000 * (fault.z ?? medianLowerDepthKm[slip] ?? fallbackLowerDepthKm)
    );
    const padLat = reachM / M_PER_DEG_LAT;
    for (let row = 0; row < rows; row += 1) {
      const tileSouth = -90 + row * TILE_DEG;
      const tileNorth = tileSouth + TILE_DEG;
      if (maxLat < tileSouth - padLat || minLat > tileNorth + padLat) continue;
      const worstLat = Math.max(Math.abs(tileSouth), Math.abs(tileNorth));
      const cosLat = Math.max(0.02, Math.cos((worstLat * Math.PI) / 180));
      const padLon = Math.min(180, REACH_CAP_M / (M_PER_DEG_LAT * cosLat));
      for (let col = 0; col < cols; col += 1) {
        const tileWest = -180 + col * TILE_DEG;
        const tileEast = tileWest + TILE_DEG;
        // Longitudes are compared on the circle, so a trace near the
        // antimeridian is not lost by a straight numeric test.
        const west = tileWest - padLon;
        const east = tileEast + padLon;
        const touches = (lo: number, hi: number): boolean => {
          if (east - west >= 360) return true;
          const norm = (x: number): number => (((x + 180) % 360) + 360) % 360;
          const a0 = norm(west);
          const a1 = a0 + (east - west);
          const b0 = norm(lo);
          const b1 = b0 + Math.min(360, hi - lo);
          return a0 <= b1 && b0 <= a1 + 1e-9
            ? true
            : a0 <= b1 + 360 && b0 + 360 <= a1 + 1e-9
              ? true
              : a0 <= b1 - 360 && b0 - 360 <= a1 + 1e-9;
        };
        if (!touches(minLon, maxLon)) continue;
        const key = `${col.toString()}_${row.toString()}`;
        const list = tiles.get(key) ?? [];
        list.push(fault);
        tiles.set(key, list);
      }
    }
    kept += 1;
  }

  if (existsSync(OUT_DIR)) {
    for (const n of readdirSync(OUT_DIR)) rmSync(join(OUT_DIR, n));
  } else {
    mkdirSync(OUT_DIR, { recursive: true });
  }

  let total = 0;
  let worst = 0;
  let worstName = '';
  const names: string[] = [];
  for (const [key, list] of [...tiles.entries()].sort()) {
    const body = JSON.stringify({ faults: list });
    writeFileSync(join(OUT_DIR, `${key}.json`), body);
    total += body.length;
    if (body.length > worst) {
      worst = body.length;
      worstName = key;
    }
    names.push(key);
  }

  const index = {
    source: GEM_SOURCE,
    citation: GEM_CITATION,
    doi: '10.1177/8755293020944182',
    licence: 'CC-BY-SA-4.0',
    doesNotReach: ['Malay Archipelago', 'Madagascar', 'Canada'],
    traces: kept,
    dropped,
    tileDeg: TILE_DEG,
    reachCapM: REACH_CAP_M,
    coordUnitsPerDeg: COORD_UNITS_PER_DEG,
    traceEncoding:
      'integers of 1/coordUnitsPerDeg degrees, flattened lon,lat,…; the first point absolute, every later one a step from the one before',
    simplifyToleranceM: SIMPLIFY_TOLERANCE_M,
    slipTypes: SLIP_TYPES,
    /** Rule 289: the database's own medians, not a constant from a textbook. */
    medianDipDeg,
    medianLowerDepthKm,
    fallbackDipDeg,
    fallbackLowerDepthKm,
    tiles: names,
  };
  const indexBody = JSON.stringify(index, null, 2);
  writeFileSync(join(OUT_DIR, 'index.json'), indexBody);
  total += indexBody.length;

  console.log(`traces kept ${kept.toString()}, dropped ${dropped.toString()}`);
  console.log(`tiles ${names.length.toString()}`);
  console.log(
    `trace points ${pointsIn.toString()} -> ${pointsOut.toString()} (${(100 * (1 - pointsOut / pointsIn)).toFixed(1)} % dropped at ${SIMPLIFY_TOLERANCE_M.toString()} m)`
  );
  console.log(
    `total ${(total / 1e6).toFixed(2)} MB, worst tile ${worstName} ${(worst / 1e3).toFixed(0)} kB`
  );
  console.log(`median dip by slip type: ${JSON.stringify(medianDipDeg)}`);
  console.log(
    `fallback dip ${fallbackDipDeg.toString()}°, lower depth ${fallbackLowerDepthKm.toString()} km`
  );
}

const GEM_SOURCE =
  'https://raw.githubusercontent.com/GEMScienceTools/gem-global-active-faults/master/geojson/gem_active_faults_harmonized.geojson';
const GEM_CITATION =
  'Styron, R. & Pagani, M. (2020). "The GEM Global Active Faults Database." Earthquake Spectra 36(1_suppl), 160–180.';

main();
