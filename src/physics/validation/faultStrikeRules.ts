/**
 * An earthquake points where its fault points, or it says it does not know.
 *
 * The renderer builds the right shape. `scene/stadiumPolygon.ts` inflates the
 * surface projection of the rupture rectangle by the Joyner–Boore distance at
 * which an MMI level is reached, and the rounded rectangle that comes out is
 * not a stylistic choice: the locus of points at a fixed r_jb from a rectangle
 * IS that rectangle widened by a disc, exactly. Given a ground motion that
 * depends on r_jb, Mw and Vs30, the contour is a rounded rectangle and nothing
 * else. The builder takes a strike and lays the shape out on the sphere.
 *
 * It is the strike that is invented. Two lines, in two files:
 *
 *   scene/globe/Globe.tsx:2132       strikeAzimuthDeg = ...strikeAzimuthDeg ?? 0
 *   validation/recordedTolls.ts:415  ...strikeAzimuthDeg ?? 0
 *
 * Seven presets carry a published strike, and they are right — Tōhoku 200°,
 * Sumatra–Andaman 330°, Alaska 245°, Valdivia 10°, Gorkha 290°, Kokoxili 95°,
 * Lisbon 70°. Every other earthquake — every one a reader places himself —
 * is drawn and counted as a fault striking due north, anywhere on Earth. The
 * panel offers no control to say otherwise (ui/components/EarthquakeCustomInputs
 * .tsx exposes the fault's TYPE and not its orientation).
 *
 * That is not an approximation. An approximation is a quantity carried with a
 * known error; this is an assertion about the tectonics of a place, made
 * silently, and it is wrong almost everywhere. And it is not cosmetic, because
 * the second line above is the one that counts the dead: the population is
 * summed inside that north–south rectangle. For Mw 9, with a rupture 1 000 km
 * long, turning the fault ninety degrees moves the MMI VII footprint over
 * entirely different cities.
 *
 * WHAT WAS LOOKED AT before these rules were written, and is therefore not
 * held out:
 *
 *   - The GEM Global Active Faults Database, harmonized GeoJSON, 13 696
 *     traces: its fields, their formats (dip as a '(preferred,min,max)'
 *     string, dip_dir as a compass letter or a bearing), and how much of it
 *     is filled — slip_type 97.7 %, average_dip 40.0 %, dip_dir 26.7 %,
 *     lower_seis_depth 24.2 %, upper_seis_depth 40.2 %. Its own README's
 *     statement of where it does not reach.
 *   - The seven preset strikes as the project carries them, above.
 *   - The epicentres the project already records, and three read from the
 *     USGS catalogue for presets that had none.
 *   - The shipped-tile pattern of `public/data/population-2p5`.
 *
 * NOT looked at, and what rule 292 turns on: whether the database's nearest
 * fault reproduces any preset's strike. No lookup was run before these rules
 * were fixed.
 *
 * The rules, fixed on 20 September 2026, before the candidate was written, and
 * numbered after the two hundred and eighty-five before them:
 *
 * 286. The candidate. An earthquake's strike comes from the mapped fault it
 *      would break, in this order: a preset keeps its own published strike;
 *      otherwise the nearest mapped active fault whose surface projection
 *      could hold the epicentre (rule 288), its strike read from its trace
 *      (rule 287); and where none is in range, the strike is UNKNOWN and the
 *      model says so (rule 290). Due north stops being a default anywhere.
 *
 * 287. How a trace becomes a strike. A trace is a polyline, and a fault a
 *      thousand kilometres long that bends is not one azimuth. The strike is
 *      the azimuth of the chord between the two points of the trace one
 *      half-rupture-length either side of the point nearest the epicentre,
 *      clipped to the trace's ends — so a 30 km rupture reads 30 km of fault
 *      and a 500 km rupture reads 500. The 180° ambiguity is not resolved and
 *      does not need to be: a rupture's surface projection is unchanged by
 *      θ → θ + 180, and so is the population inside it. dip_dir, which would
 *      resolve it and is present on a quarter of the traces, is left for the
 *      round that needs a hanging wall.
 *
 * 288. What "in range" means, and why it is not a round number. A point lies
 *      on a fault's surface projection if it is within that projection's
 *      horizontal reach, which the fault's own geometry gives:
 *
 *          reach = margin + z_lower / tan δ
 *
 *      from the trace's own lower seismogenic depth and dip. That is ~0 for a
 *      vertical strike-slip, ~15 km for a 45° reverse fault 15 km deep, and
 *      ~190 km for a megathrust dipping 15° to 50 km — the physics of what a
 *      dipping plane covers, not a preference. The margin is 25 km, the scale
 *      of both the seismogenic thickness and the precision with which a trace
 *      is mapped and a reader clicks. The reach is capped at 300 km, beyond
 *      which "the nearest fault" says nothing about a point.
 *
 * 289. Where the fallbacks come from. Where the database leaves a dip or a
 *      depth empty — six traces in ten, and three in four — rule 288 uses the
 *      database's OWN median for that slip type, computed when the tiles are
 *      built and written into the tile index, so the number is a property of
 *      the published data and not a constant invented here. No dip is taken
 *      from a textbook in this round.
 *
 * 290. The unknown strike, and what a picture may not do. Where no fault is in
 *      range the model may not draw an oriented rectangle, because it has
 *      nothing to orient it by. It draws the envelope over every orientation —
 *      the disc of radius L/2 + r_jb, which is the union of the stadium over
 *      all strikes and is the honest statement "the shaking reaches this far,
 *      in a direction nobody here knows". The panel gains a strike control, and
 *      a strike the reader sets is his: the rectangle returns, marked as an
 *      assumption and not as a reading.
 *
 * 291. The toll follows the picture, and the uncertainty goes where uncertainty
 *      goes. `recordedTolls.ts` stops defaulting to north. Where the strike is
 *      known the toll is counted in the oriented footprint. Where it is not,
 *      the central estimate is the median over a sweep of orientations and the
 *      band is that sweep's 5th and 95th percentile — an unknown orientation
 *      enters as a band, which is what the band is for, and never as a silent
 *      choice of north.
 *
 * 292. What decides.
 *      (a) On the six presets that have both a published strike and an
 *          instrumentally determined epicentre, the strike the database gives
 *          is within 25° of the published one, modulo 180°. Twenty-five degrees
 *          is where cos Δ = 0.91: the rupture still lays nine tenths of its
 *          length along the mapped structure, and beyond it the two are no
 *          longer the same fault. One preset outside refuses the candidate.
 *      (b) Every preset found is closer to its published strike than due north
 *          is. North is the thing being replaced, so it is the thing to beat,
 *          and beating it on five of six while losing on one is not an
 *          improvement, it is a trade.
 *      (c) At least four of the six find a fault in range. Fewer, and the
 *          database is not carrying the method, and the round is refused
 *          rather than shipped as an improvement to something it cannot do.
 *      (d) No preset's toll, wave, replay or golden figure moves at all,
 *          because a preset keeps its own strike (rule 286). Anything that
 *          moves is a defect of the wiring, not a result.
 *      (e) The release gate stays PASS in strict mode and the two audits it
 *          reads stay clean.
 *      (f) The shipped fault data stays under 3 MB in total and under 200 kB
 *          for any one tile a reader's click loads, so that a globe that opens
 *          today still opens.
 *
 * 293. What may not happen. No strike is invented to make a preset match, and
 *      no preset's published strike is changed. Rule 287's window and rule
 *      288's margin, reach and cap are fixed HERE, before any preset is
 *      measured, and are not moved afterwards (rules 5 and 6). If a preset's
 *      published strike is not reproduced, that is the result and it is
 *      printed with the strike the database gave and the distance to it.
 *
 * 294. What is printed: for each of the six, the published strike, the strike
 *      found, the fault's name and catalogue, the distance to its trace, and
 *      the error against north beside the error against the database; the
 *      count of presets with no fault in range, by name; and every toll of the
 *      calibration net that moves, which rule 292(d) says is none.
 *
 * WHAT THESE RULES CANNOT SETTLE. Whether the database is right where it is
 * sparse — its own README says it does not reach the Malay Archipelago,
 * Madagascar or Canada, so rule 290's unknown is a real state and not a
 * formality. Whether the fault mapped at a point is the fault that would
 * break there. Whether a single planar strike describes a rupture that
 * jumped between segments, as Kaikōura did across at least twelve. And the
 * thing under all of it, which no database closes: a reader's click is not an
 * earthquake, and nothing can say which fault breaks next.
 *
 * Lisbon 1755 is left out of rule 292 and the reason is not that it fails. It
 * has no instrumentally determined epicentre and its source is still argued
 * over — the Marquês de Pombal fault, the Gorringe Bank, the Horseshoe
 * abyssal plain. A fault lookup cannot be tested at a point nobody agrees on.
 */

import { bearingBetween, destination, distanceBetween } from '../tsunami/ruptureGeometry.js';

/** The database rule 286 reads, and what it is. */
export const GEM_GAF_DB = {
  name: 'GEM Global Active Faults Database',
  citation:
    'Styron, R. & Pagani, M. (2020). "The GEM Global Active Faults Database." Earthquake Spectra 36(1_suppl), 160–180.',
  doi: '10.1177/8755293020944182',
  licence: 'CC-BY-SA-4.0',
  source: 'gem_active_faults_harmonized.geojson (GEMScienceTools/gem-global-active-faults)',
  traces: 13_696,
  /** The README's own statement of where the database does not reach.
   *  Rule 290's unknown is a real state because of this list. */
  doesNotReach: ['Malay Archipelago', 'Madagascar', 'Canada'],
} as const;

/** Rule 288: the margin added to every fault's own reach — the scale of the
 *  seismogenic thickness, of a trace's mapping precision, and of a click. */
export const FAULT_SEARCH_MARGIN_M = 25_000;

/** Rule 288: beyond this, "the nearest fault" says nothing about a point. */
export const FAULT_SEARCH_REACH_CAP_M = 300_000;

/** Rule 292(a): where cos Δ = 0.91 and a rupture still lays nine tenths of its
 *  length along the mapped structure. */
export const PRESET_STRIKE_TOLERANCE_DEG = 25;

/** Rule 292(c): fewer than this and the database is not carrying the method. */
export const PRESET_MINIMUM_FOUND = 4;

/** Rule 292(f): the budget a reader's globe has for knowing where faults are. */
export const FAULT_DATA_BUDGET = { totalBytes: 3_000_000, perTileBytes: 200_000 } as const;

/**
 * Rule 288: the horizontal reach of a dipping plane's surface projection,
 * from the fault's own lower seismogenic depth and dip.
 */
export function surfaceProjectionReachM(dipDeg: number, lowerSeisDepthM: number): number {
  const z = Number.isFinite(lowerSeisDepthM) ? Math.max(0, lowerSeisDepthM) : 0;
  const d = Number.isFinite(dipDeg) ? Math.min(90, Math.max(1, dipDeg)) : 90;
  const horizontal = z / Math.tan((d * Math.PI) / 180);
  return Math.min(FAULT_SEARCH_REACH_CAP_M, FAULT_SEARCH_MARGIN_M + horizontal);
}

/**
 * Rule 287: the angle between two strikes, as an undirected line and not a
 * direction — 10° and 190° are the same fault. In [0, 90].
 */
export function strikeDifferenceDeg(aDeg: number, bDeg: number): number {
  if (!Number.isFinite(aDeg) || !Number.isFinite(bDeg)) return Number.NaN;
  const d = (((aDeg - bDeg) % 180) + 180) % 180;
  return d > 90 ? 180 - d : d;
}

/** A point of a fault trace. */
export interface TracePoint {
  latitude: number;
  longitude: number;
}

/** Where a trace passes closest to a point: which segment, how far along it,
 *  and how far away. */
export interface TraceApproach {
  /** Index of the segment's first vertex. */
  index: number;
  /** Fraction along that segment, in [0, 1]. */
  t: number;
  /** Distance from the point to the trace (m). */
  distanceM: number;
  /** The closest point itself. */
  at: TracePoint;
}

/**
 * The point of a polyline nearest a given place, walked segment by segment.
 * Each segment is short beside the Earth, so the closest point on it is taken
 * by projecting onto the segment in the local tangent plane and the distance
 * is then measured on the sphere, which keeps it exact where it matters.
 */
export function nearestPointOnTrace(
  trace: readonly TracePoint[],
  latitude: number,
  longitude: number
): TraceApproach | null {
  if (trace.length === 0) return null;
  const first = trace[0];
  if (first === undefined) return null;
  if (trace.length === 1) {
    return {
      index: 0,
      t: 0,
      distanceM: distanceBetween(latitude, longitude, first.latitude, first.longitude),
      at: first,
    };
  }
  let best: TraceApproach | null = null;
  const cosLat = Math.cos((latitude * Math.PI) / 180);
  for (let i = 0; i + 1 < trace.length; i += 1) {
    const a = trace[i];
    const b = trace[i + 1];
    if (a === undefined || b === undefined) continue;
    // Local tangent plane about the query point: degrees of longitude are
    // shortened by cos(latitude) so that the projection is metric.
    const ax = (a.longitude - longitude) * cosLat;
    const ay = a.latitude - latitude;
    const bx = (b.longitude - longitude) * cosLat;
    const by = b.latitude - latitude;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.min(1, Math.max(0, -(ax * dx + ay * dy) / len2)) : 0;
    const at: TracePoint = {
      latitude: a.latitude + t * (b.latitude - a.latitude),
      longitude: a.longitude + t * (b.longitude - a.longitude),
    };
    const distanceM = distanceBetween(latitude, longitude, at.latitude, at.longitude);
    if (best === null || distanceM < best.distanceM) best = { index: i, t, distanceM, at };
  }
  return best;
}

/** Walk a polyline from a point on it by an arc length, forward (+) or back
 *  (−), stopping at the trace's end. Returns where it stopped. */
export function walkTrace(
  trace: readonly TracePoint[],
  from: TraceApproach,
  distanceM: number
): TracePoint {
  const forward = distanceM >= 0;
  let remaining = Math.abs(distanceM);
  let here = from.at;
  let i = forward ? from.index + 1 : from.index;
  while (remaining > 0 && i >= 0 && i < trace.length) {
    const next = trace[i];
    if (next === undefined) break;
    const step = distanceBetween(here.latitude, here.longitude, next.latitude, next.longitude);
    if (step >= remaining) {
      const bearing = bearingBetween(here.latitude, here.longitude, next.latitude, next.longitude);
      return destination(here.latitude, here.longitude, bearing, remaining);
    }
    remaining -= step;
    here = next;
    i += forward ? 1 : -1;
  }
  return here;
}

/**
 * Rule 287: the strike a trace gives a rupture of a given length, centred on
 * the point of the trace nearest the epicentre. The chord between the two
 * ends of that window, as a bearing from north, in [0, 360).
 *
 * Returns null when the window collapses — a trace of one point, or two
 * coincident ones — because a strike is not readable from it.
 */
export function traceStrikeDeg(
  trace: readonly TracePoint[],
  latitude: number,
  longitude: number,
  ruptureLengthM: number
): number | null {
  const approach = nearestPointOnTrace(trace, latitude, longitude);
  if (approach === null) return null;
  const half = Math.max(0, ruptureLengthM) / 2;
  const ahead = walkTrace(trace, approach, half);
  const behind = walkTrace(trace, approach, -half);
  const span = distanceBetween(behind.latitude, behind.longitude, ahead.latitude, ahead.longitude);
  if (!(span > 0)) return null;
  const bearing = bearingBetween(
    behind.latitude,
    behind.longitude,
    ahead.latitude,
    ahead.longitude
  );
  return ((bearing % 360) + 360) % 360;
}

/**
 * Rule 292(a) and (b): the six presets the round is decided on. The strike is
 * the project's own, from the published finite-fault models its presets cite;
 * the epicentre is the one the project already records, or, for the three it
 * did not, the USGS catalogue's.
 *
 * Lisbon 1755 is absent on purpose. See the head of this file.
 */
export const STRIKE_PRESETS: readonly {
  preset: string;
  name: string;
  latitude: number;
  longitude: number;
  publishedStrikeDeg: number;
  epicentreSource: string;
}[] = [
  {
    preset: 'TOHOKU_2011',
    name: 'Tōhoku 2011',
    latitude: 38.297,
    longitude: 142.373,
    publishedStrikeDeg: 200,
    epicentreSource: 'recordedTolls.ts',
  },
  {
    preset: 'KUNLUN_2001',
    name: 'Kokoxili (Kunlun) 2001',
    latitude: 35.946,
    longitude: 90.541,
    publishedStrikeDeg: 95,
    epicentreSource: 'USGS ComCat iscgem2331800',
  },
  {
    preset: 'SUMATRA_2004',
    name: 'Sumatra–Andaman 2004',
    latitude: 3.316,
    longitude: 95.854,
    publishedStrikeDeg: 330,
    epicentreSource: 'recordedTolls.ts',
  },
  {
    preset: 'VALDIVIA_1960',
    name: 'Valdivia 1960',
    latitude: -38.143,
    longitude: -73.407,
    publishedStrikeDeg: 10,
    epicentreSource: 'USGS ComCat iscgem879136',
  },
  {
    preset: 'ALASKA_1964',
    name: 'Great Alaska 1964',
    latitude: 60.908,
    longitude: -147.339,
    publishedStrikeDeg: 245,
    epicentreSource: 'USGS ComCat iscgem869809',
  },
  {
    preset: 'NEPAL_2015',
    name: 'Nepal Gorkha 2015',
    latitude: 28.2305,
    longitude: 84.7314,
    publishedStrikeDeg: 290,
    epicentreSource: 'recordedTolls.ts',
  },
];

/** Rule 292(d) and (e): what may not move while the strike changes. */
export const FAULT_STRIKE_GUARDS: readonly string[] = [
  'no preset earthquake toll of the calibration net moves by a single death',
  'no wave, replay or golden figure moves',
  'the release gate stays PASS in strict mode',
  'the globe audit stays at thirty scenarios with no finding',
  'the terrain derivation stays inside rules 243 and 250(b)',
  'the shipped fault data stays inside rule 292(f)’s budget',
];
