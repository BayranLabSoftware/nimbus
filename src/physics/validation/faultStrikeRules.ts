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

/**
 * THE OUTCOME OF THE FIRST CANDIDATE, measured on 20 September 2026. The rules
 * above were pushed in commit 0a11a7a before it was written.
 *
 * REFUSED, on all three clauses of rule 292 that decide. Rule 293 forbids
 * moving a bound to catch it, and no bound was moved.
 *
 * | preset      |  L km | published | found  |    Δ |  Δ from N | fault found              |
 * |-------------|------:|----------:|-------:|-----:|----------:|--------------------------|
 * | Tōhoku      |   702 |      200° |      — |    — |     20.0° | none in reach            |
 * | Kokoxili    |   167 |       95° |  83.5° | 11.5°|     85.0° | unnamed sinistral, 8 km  |
 * | Sumatra     | 1 300 |      330° |      — |    — |     30.0° | none in reach            |
 * | Valdivia    | 1 204 |       10° | 324.9° | 45.1°|     10.0° | Falla Lanalhue, 22 km    |
 * | Alaska      |   804 |      245° |      — |    — |     65.0° | none in reach            |
 * | Gorkha      |   113 |      290° |      — |    — |     70.0° | none in reach            |
 *
 *   292(a) worst Δ 45.1° against 25°        — outside
 *   292(b) beats north on 1 of 2 found      — outside
 *   292(c) found 2 of 6 against 4           — outside
 *
 * THE CAUSE, and it is two causes and not one.
 *
 * (1) The database does not carry the geometry of a subduction interface. Its
 *     1 181 Subduction_Thrust traces are plate-boundary lines, and almost none
 *     carries a dip or a seismogenic depth of its own, so rule 289's median
 *     fills them: 30° and 40 km, which give rule 288 a reach of 94 km. A real
 *     shallow megathrust dips nearer 10° over a seismogenic zone reaching
 *     50 km, whose surface projection is 284 km wide — which is why Tōhoku's
 *     rupture ran two hundred kilometres landward of the Japan Trench. The
 *     reach law is not wrong; the numbers fed to it are, and they are wrong
 *     because the database was built for crustal faults.
 *
 *     Measured, the interface was there and out of reach every time: Tōhoku's
 *     at 137 km against 94, Sumatra's at 151, Alaska's at 202. Valdivia's at
 *     73 km was the one inside, and cause (2) then threw it away.
 *
 * (2) "The nearest trace" is the wrong fault where several are in reach.
 *     Valdivia 1960 is Mw 9.5 on 1 204 km of rupture — an earthquake only a
 *     subduction interface can make — and rule 286 handed it to Falla
 *     Lanalhue, a crustal sinistral-reverse fault 22 km away, because 22 is
 *     less than 73. Nearest is a proximity, not a plausibility. A magnitude
 *     no crustal fault can produce must not be assigned to one.
 *
 *     This is a defect of the rules as written and not of their implementation.
 *     Rule 286 says "the nearest", and the nearest is what it got.
 *
 * And one gap that is neither: Gorkha 2015 sits on the Main Himalayan Thrust,
 * which this database does not carry as a thrust at all. Within 90 km of the
 * epicentre it maps an anticline, a syncline and a normal fault — folds above
 * the structure, not the structure. Its nearest Subduction_Thrust is 742 km
 * away and is a different plate boundary entirely. No reach law reaches a
 * fault that is not in the file, and rule 290's UNKNOWN is the honest answer
 * for Gorkha whatever else changes.
 *
 * WHAT THIS REFUSAL SETTLES, and it is worth more than a pass would have been.
 * The blocks were ordered wrongly. Slab2 (Hayes et al. 2018) was to be the
 * second block's data, a refinement of the dip after the strike worked; the
 * measurement says it is a PREREQUISITE of the strike, because four of the six
 * presets are subduction earthquakes and the strike of a subduction earthquake
 * cannot be read from a database of crustal faults. The order is now Slab2
 * first, and the strike lookup measured again after it, under rules of its own
 * that say what happens when a megathrust and a crustal fault are both in
 * reach.
 *
 * WHAT WAS NOT DONE, so that nobody reads more into this than it says. Nothing
 * is wired: the globe, the toll and the panel still read `strikeAzimuthDeg ??
 * 0` exactly as they did, so no published figure has moved and none was
 * allowed to. The defect the rules were written against is still open. The
 * fault tiles are not shipped, because shipping 2.88 MB for a candidate that
 * was refused would put weight on a reader for nothing.
 *
 * WHAT DID HOLD, and it is the part that says the method is sound rather than
 * the data: Kokoxili, the one crustal earthquake among the six, found its
 * fault 8 km away and read its strike to 11.5° where north is wrong by 85°.
 * That is the database doing exactly what it was built to do, on exactly the
 * kind of fault it was built for.
 */
export const FAULT_STRIKE_FIRST_CANDIDATE =
  'REFUSED 20 September 2026: the strike read from the GEM database alone finds a fault for two of six presets and the right one for one, because the database carries no subduction-interface geometry (its median dip and depth give a megathrust a 94 km reach where the real surface projection is 284 km) and because "the nearest trace" handed Valdivia\u2019s Mw 9.5 to a crustal fault 22 km away over the interface at 73. No bound was moved and nothing was wired. Slab2 becomes a prerequisite of the strike and not a refinement after it.';

/** Rule 292(d) and (e): what may not move while the strike changes. */
export const FAULT_STRIKE_GUARDS: readonly string[] = [
  'no preset earthquake toll of the calibration net moves by a single death',
  'no wave, replay or golden figure moves',
  'the release gate stays PASS in strict mode',
  'the globe audit stays at thirty scenarios with no finding',
  'the terrain derivation stays inside rules 243 and 250(b)',
  'the shipped fault data stays inside rule 292(f)’s budget',
];
