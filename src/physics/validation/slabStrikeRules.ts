/**
 * Where a megathrust points, and who answers when two structures could.
 *
 * THE ROUND BEFORE THIS ONE WAS REFUSED, and the refusal is the reason this
 * file exists. Rules 286 to 294 of `faultStrikeRules.ts` read an earthquake's
 * strike from the GEM Global Active Faults Database alone. Measured on the six
 * presets that carry both a published strike and an instrumental epicentre, it
 * found a fault for two and the right one for one. Two causes, written there in
 * full and not repeated here beyond what these rules turn on:
 *
 *   1. The database carries no subduction-interface geometry. Its plate-boundary
 *      traces have neither dip nor seismogenic depth, so rule 289's medians —
 *      30°, 40 km — gave a megathrust a 94 km reach where the real surface
 *      projection is 284 km wide. The interface was in the file and out of
 *      reach every time: 137 km away at Tōhoku, 151 at Sumatra, 202 at Alaska.
 *   2. "The nearest trace" is the wrong fault where several are in reach.
 *      Valdivia 1960, Mw 9.5 on 1 204 km of rupture, went to Falla Lanalhue,
 *      a crustal fault 22 km away, over the interface at 73 km. Nearest is a
 *      proximity, not a plausibility.
 *
 * So Slab2 stops being the next block's refinement of the dip and becomes the
 * prerequisite of the strike, and these rules say what happens when a megathrust
 * and a crustal fault are both in reach — the question the refusal left open.
 *
 * WHAT WAS LOOKED AT before these rules were fixed, and is therefore not held
 * out:
 *
 *   - Slab2's own README: five grids a zone (dep, str, dip, thk, unc), 0.05°
 *     sampling, NaN outside each model's clipping mask, four zones that overturn
 *     and are distributed as nodes instead of a surface (izu, ker, man, sol).
 *   - The shape of the distribution, read with netCDF4: 27 zones, 135 grids,
 *     COARDS/CF-1.5, x in [0, 360), y ascending, z float32 with NaN fill. The
 *     step is 0.05° in 22 zones and 0.02° in five (hin, man, mue, pam, puy).
 *     Every zone's bounding box. Strike in [0, 360). Depth NEGATIVE, from
 *     −0.01 km to −701.16 km. Depth uncertainty from 0 to 63.95 km.
 *   - How many nodes carry a value: 1 022 096 over the planet at full step,
 *     230 889 of them on a 0.1° lattice. That is what rule 301(f)'s budget is
 *     set against, and it was counted before the budget was written.
 *   - Which zone's BOUNDING BOX holds each of the six presets — kur, sum, sam,
 *     alu, him, him — read on 20 September 2026. A bounding box is not a
 *     clipping mask: whether the model has a value AT any of those six points
 *     is not known here, because the mask puts NaN inside the box too.
 *   - The 2.5′ shipped-tile pattern of `public/data/population-2p5`: a PNG a
 *     tile, one channel a quantity, decoded through a canvas.
 *
 * NOT looked at, and this is the measurement: no strike, no depth and no
 * uncertainty value of Slab2 was read at any of the six epicentres, or anywhere
 * near them. Not one lookup was run before this file was pushed.
 *
 * The rules, fixed on 20 September 2026, numbered after the two hundred and
 * ninety-four before them.
 *
 * 295. The geometry of the interfaces comes from Slab2 — Hayes, G. P., Moore,
 *      G. L., Portner, D. E., Hearne, M., Flamme, H., Furtney, M. & Smoczyk,
 *      G. M. (2018), "Slab2, a comprehensive subduction zone geometry model",
 *      Science 362(6410), 58–61, doi:10.1126/science.aat4723; distribution
 *      doi:10.5066/F7PV6JNV, USGS, public domain. It is the model the field
 *      uses for the three-dimensional shape of a subducting slab, and it is
 *      what the USGS itself reads. Nothing about a subduction interface is
 *      taken from a textbook in this round, exactly as rule 289 took no dip
 *      from one.
 *
 * 296. When an earthquake is ON the interface. A point belongs to an interface
 *      when all three hold:
 *
 *      (a) it lies inside a Slab2 model's clipping mask — the mask, not the
 *          bounding box, because outside the mask the model's own README says
 *          its values must not be used;
 *      (b) the slab surface there is no deeper than the interface seismogenic
 *          zone reaches, 60 km. Below that the contact is aseismic or the
 *          shaking comes from inside the slab, and the megathrust is not what
 *          breaks. The number is a project choice with margin over the ~50 km
 *          that the compilations of interface seismogenic zones report, and it
 *          is declared as a choice and not as a measurement;
 *      (c) the hypocentre is within tolerance of that surface, and the
 *          tolerance comes from the data and not from preference: Slab2
 *          publishes its own depth uncertainty at every node, and the tolerance
 *          is two of them, floored at 10 km because a global catalogue's depth
 *          is not known better than that — least of all for an earthquake of
 *          1960, whose depth is a historical estimate and not a measurement.
 *
 * 297. …and when it is on the interface ANYWAY. A rupture 1 200 km long above a
 *      subduction zone is the interface, whatever depth a historical catalogue
 *      wrote down for it, because no crustal fault is that long. So an
 *      earthquake also belongs to the interface when 296(a) and 296(b) hold and
 *      no crustal trace in reach can host its rupture under rule 299 — the
 *      clause the refusal asked for, written as physics and not as a magnitude
 *      threshold: it is the length of the break, against the length of the
 *      structure, that decides.
 *
 * 298. How a slab gives a strike. Rule 287 reads a strike as the chord across a
 *      window of trace as long as the rupture. A slab is a field and not a
 *      polyline, so the window is built by walking the field: from the
 *      epicentre, step 2 km in the direction the local strike points, and
 *      again, for half the rupture length; then the same backwards; the strike
 *      is the bearing of the chord between the two ends. It is rule 287's
 *      window on a field — the streamline of the strike field through the
 *      epicentre — and it bends where the trench bends, which a single node's
 *      value cannot do over a thousand kilometres. The walk stops at the edge
 *      of the mask and the window is then short on that side, as rule 287's
 *      window is short at the end of a trace. Interpolation between nodes is
 *      done on the unit vector and never on the angle, because the mean of 359°
 *      and 1° is 0° and not 180°.
 *
 * 299. A rupture does not fit on a fault shorter than itself. A crustal trace
 *      may host a rupture of length L only if the trace maps at least L/2.
 *      Half, and not all of it: ruptures jump between segments and catalogues
 *      cut faults into pieces, so demanding L would refuse real earthquakes.
 *      But a structure twenty times shorter than the break is not the structure
 *      that broke, and this is what rule 286 lacked when it handed Valdivia to
 *      a crustal fault. Where no trace in reach can host the rupture and no
 *      interface is there either, the answer is rule 290's UNKNOWN — never the
 *      best of the ones that cannot.
 *
 * 300. Who answers, when both could. In order:
 *      (a) an interface under rule 296 or rule 297 — its strike from rule 298.
 *          A surface mapped in three dimensions that contains the hypocentre
 *          beats a trace at the surface tens of kilometres away, because the
 *          first holds the point and the second only reaches it by projection;
 *      (b) otherwise the crustal fault of rules 286 to 288, restricted to the
 *          traces that can host the rupture (rule 299), nearest first;
 *      (c) otherwise UNKNOWN, and rule 290 says what a picture may then draw.
 *
 * 301. What decides this round.
 *      (a) On the six presets, every strike found is within 25° of the
 *          published one, modulo 180. The tolerance is rule 292(a)'s, unmoved:
 *          where cos Δ = 0.91 and the rupture still lays nine tenths of its
 *          length along the mapped structure.
 *      (b) Every preset found is closer to its published strike than due north
 *          is. North is what is being replaced, so north is what must be beaten,
 *          on every one and not on average.
 *      (c) At least FIVE of the six find a structure. The first round asked for
 *          four and found two, and said by name why each of the other four was
 *          missing; four of those six are subduction earthquakes and the fifth
 *          is the crustal one the database already answered. Asking for four
 *          again would be to have learnt nothing from the refusal.
 *      (d) No toll, wave, replay or golden figure of the calibration net moves
 *          by one unit, because a preset keeps its own published strike and
 *          because rule 302 keeps this round out of the ground-motion models.
 *      (e) The release gate stays PASS in strict mode and the audits it reads
 *          stay clean.
 *      (f) The shipped slab data stays under 1.5 MB in total and under 120 kB
 *          for any one tile a reader's click loads. 230 889 lattice nodes at
 *          three bytes is 693 kB of payload before compression, so the budget
 *          is a bound on the encoding and not a hope.
 *
 * 302. What this round may NOT do, beyond rule 293's standing ban on moving a
 *      bound after the measurement. Slab2 decides WHERE THE STRIKE COMES FROM
 *      and nothing else. It does not decide which ground-motion model runs, it
 *      does not set the `subductionInterface` flag a reader ticks, and it does
 *      not touch the dip: the rupture keeps the dip it has today. One change at
 *      a time, so that what moves can be attributed. The dip is the next block
 *      and it will be measured on its own.
 *
 * 303. What is printed, whatever the outcome: for each of the six, the
 *      published strike, the strike found, which source answered and under
 *      which clause, the slab depth and the hypocentral depth at the point with
 *      the tolerance between them, the distance to the crustal trace and its
 *      mapped length against the rupture's, the error against north beside the
 *      error against the model; every preset with no answer, by name, with the
 *      clause that refused it; and the size of what would be shipped.
 *
 * WHAT THESE RULES CANNOT SETTLE. Whether Slab2 is right where it is thin —
 * it is a model fitted to earthquake locations, and where there have been few
 * earthquakes there is little to fit. Whether the interface is what breaks at a
 * point where it could. The four overturning zones, which are distributed as
 * nodes and not as a surface and are not read at all here. And the thing under
 * all of it, unchanged since rule 294: a reader's click is not an earthquake,
 * and nothing can say which fault breaks next.
 */

import { bearingBetween, destination, distanceBetween } from '../tsunami/ruptureGeometry.js';
import type { TracePoint } from './faultStrikeRules.js';

/** The model rule 295 reads, and what it is. */
export const SLAB2 = {
  name: 'Slab2',
  citation:
    'Hayes, G. P., Moore, G. L., Portner, D. E., Hearne, M., Flamme, H., Furtney, M. & Smoczyk, G. M. (2018). "Slab2, a comprehensive subduction zone geometry model." Science 362(6410), 58–61.',
  doi: '10.1126/science.aat4723',
  dataDoi: '10.5066/F7PV6JNV',
  licence: 'public domain (U.S. Geological Survey)',
  source: 'Slab2Distribute_Mar2018',
  zones: 27,
  /** Rule 296(a): outside its own clipping mask a model must not be used, and
   *  the distribution writes NaN there. */
  clipped: true,
  /** Distributed as nodes, not as a surface, and not read in this round. */
  overturning: ['izu', 'ker', 'man', 'sol'],
} as const;

/** Rule 296(b): how deep the interface seismogenic zone reaches. A project
 *  choice with margin over the ~50 km the compilations report, declared as a
 *  choice. */
export const INTERFACE_SEISMOGENIC_DEPTH_LIMIT_M = 60_000;

/** Rule 296(c): how many of Slab2's own published uncertainties a hypocentre
 *  may sit from the surface and still be on it. */
export const SLAB_DEPTH_TOLERANCE_SIGMAS = 2;

/** Rule 296(c): and the floor, because a global catalogue's depth is not known
 *  better than this. */
export const HYPOCENTRE_DEPTH_FLOOR_M = 10_000;

/** Rule 298: the step of the walk along the strike field. Under half the
 *  0.05° node spacing, so the walk is limited by the field and not by itself. */
export const SLAB_WALK_STEP_M = 2_000;

/** Rule 299: the fraction of its own length a rupture must find mapped. */
export const MINIMUM_TRACE_FRACTION = 0.5;

/** Rule 301(f): the budget a reader's globe has for knowing where slabs are. */
export const SLAB_DATA_BUDGET = { totalBytes: 1_500_000, perTileBytes: 120_000 } as const;

/** The lattice rule 301(f)'s count was taken on, and the tiles it is cut into —
 *  the same ten-degree grid `faultTileKey` already uses, so that one click
 *  reads one tile of each. */
export const SLAB_TILE_DEG = 10;
export const SLAB_CELL_DEG = 0.1;

/** The quantisation the tiles carry. A byte of strike is 1.41°, far finer than
 *  rule 301(a)'s 25°; a byte of depth at 3 km covers the deepest slab there is
 *  (701 km) and is fine against a tolerance floored at 10 km; a byte of
 *  uncertainty at 1 km covers the largest Slab2 publishes (64 km). Depth 0 is
 *  the empty cell, which no node can be: the shallowest is 10 m. */
export const SLAB_STRIKE_STEP_DEG = 360 / 256;
export const SLAB_DEPTH_STEP_M = 3_000;
export const SLAB_UNCERTAINTY_STEP_M = 1_000;

/** What a tile's pixel carries. */
export interface SlabSample {
  /** Rule 298: the strike of the slab surface, degrees from north, [0, 360). */
  strikeDeg: number;
  /** Depth of the slab surface below the surface (m, positive down). */
  depthM: number;
  /** Slab2's own published uncertainty on that depth (m). */
  depthUncertaintyM: number;
}

/** Rule 298: a slab as the walk sees it — a value at a place, or nothing where
 *  the mask ends. */
export type SlabField = (latitude: number, longitude: number) => SlabSample | null;

/** Rule 296(c): how far from the surface a hypocentre may be and still be on
 *  it, from the model's own uncertainty at that point. */
export function interfaceDepthToleranceM(depthUncertaintyM: number): number {
  const u = Number.isFinite(depthUncertaintyM) ? Math.max(0, depthUncertaintyM) : 0;
  return Math.max(HYPOCENTRE_DEPTH_FLOOR_M, SLAB_DEPTH_TOLERANCE_SIGMAS * u);
}

/** Rule 296: is this hypocentre on this interface? The three clauses, in the
 *  order they are written, with the sample already taken from the field. */
export function isOnInterface(sample: SlabSample | null, hypocentreDepthM: number): boolean {
  if (sample === null) return false;
  if (!(sample.depthM <= INTERFACE_SEISMOGENIC_DEPTH_LIMIT_M)) return false;
  const tolerance = interfaceDepthToleranceM(sample.depthUncertaintyM);
  return Math.abs(hypocentreDepthM - sample.depthM) <= tolerance;
}

/** Rule 297: the interface answers anyway where the slab is seismogenic under
 *  296(a) and (b) — the depth clause set aside, for a rupture no crustal
 *  structure in reach can host. */
export function interfaceHostsAnyway(sample: SlabSample | null): boolean {
  if (sample === null) return false;
  return sample.depthM <= INTERFACE_SEISMOGENIC_DEPTH_LIMIT_M;
}

/** Rule 299: can a structure this long host a rupture that long? */
export function canHostRupture(mappedLengthM: number, ruptureLengthM: number): boolean {
  if (!Number.isFinite(mappedLengthM) || !Number.isFinite(ruptureLengthM)) return false;
  if (ruptureLengthM <= 0) return true;
  return mappedLengthM >= MINIMUM_TRACE_FRACTION * ruptureLengthM;
}

/** Rule 298: the mean of directions, taken on the unit vector. Weights need not
 *  sum to one. Returns null where every weight is zero or the vectors cancel —
 *  and cancel is judged against the weight that went in, because sin(180°) is
 *  1.2 × 10⁻¹⁶ and not zero, and a resultant that small is arithmetic noise and
 *  not a direction. */
export function meanDirectionDeg(
  samples: readonly { deg: number; weight: number }[]
): number | null {
  let x = 0;
  let y = 0;
  let total = 0;
  for (const s of samples) {
    if (!Number.isFinite(s.deg) || !Number.isFinite(s.weight) || s.weight === 0) continue;
    const r = (s.deg * Math.PI) / 180;
    x += s.weight * Math.cos(r);
    y += s.weight * Math.sin(r);
    total += Math.abs(s.weight);
  }
  if (total === 0) return null;
  if (Math.hypot(x, y) <= 1e-12 * total) return null;
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return ((deg % 360) + 360) % 360;
}

/** The byte a tile stores for a strike, and back. */
export function encodeStrikeByte(strikeDeg: number): number {
  const wrapped = ((strikeDeg % 360) + 360) % 360;
  return Math.round(wrapped / SLAB_STRIKE_STEP_DEG) % 256;
}
export function decodeStrikeByte(byte: number): number {
  return (byte % 256) * SLAB_STRIKE_STEP_DEG;
}

/** The byte a tile stores for a depth, and back. Zero is the empty cell. */
export function encodeDepthByte(depthM: number): number {
  if (!Number.isFinite(depthM) || depthM < 0) return 0;
  return Math.min(255, Math.round(depthM / SLAB_DEPTH_STEP_M) + 1);
}
export function decodeDepthByte(byte: number): number | null {
  if (byte <= 0) return null;
  return (byte - 1) * SLAB_DEPTH_STEP_M;
}

/** The byte a tile stores for an uncertainty, and back. */
export function encodeUncertaintyByte(uncertaintyM: number): number {
  if (!Number.isFinite(uncertaintyM) || uncertaintyM < 0) return 0;
  return Math.min(255, Math.round(uncertaintyM / SLAB_UNCERTAINTY_STEP_M));
}
export function decodeUncertaintyByte(byte: number): number {
  return byte * SLAB_UNCERTAINTY_STEP_M;
}

/**
 * Rule 298: the strike a slab gives a rupture of a given length, read as the
 * chord across the streamline of the strike field through the epicentre.
 *
 * Forward means along the local strike, backward against it; each step is taken
 * in the direction the field points where the walker stands, so the window
 * follows the trench where the trench bends. The walk stops where the field
 * stops, and the window is then short on that side.
 *
 * Returns null where the field holds nothing at the epicentre, or where the
 * window collapses to a point and no chord can be read from it.
 */
export function slabStrikeDeg(
  field: SlabField,
  latitude: number,
  longitude: number,
  ruptureLengthM: number
): number | null {
  const here = field(latitude, longitude);
  if (here === null) return null;
  const half = Math.max(0, ruptureLengthM) / 2;

  const walk = (backwards: boolean): TracePoint => {
    let lat = latitude;
    let lon = longitude;
    let travelled = 0;
    while (travelled < half) {
      const sample = field(lat, lon);
      if (sample === null) break;
      const step = Math.min(SLAB_WALK_STEP_M, half - travelled);
      const bearing = backwards ? sample.strikeDeg + 180 : sample.strikeDeg;
      const next = destination(lat, lon, bearing, step);
      const after = field(next.latitude, next.longitude);
      if (after === null) break;
      lat = next.latitude;
      lon = next.longitude;
      travelled += step;
    }
    return { latitude: lat, longitude: lon };
  };

  const ahead = walk(false);
  const behind = walk(true);
  const span = distanceBetween(behind.latitude, behind.longitude, ahead.latitude, ahead.longitude);
  if (!(span > 0)) {
    // A rupture short enough that the window is a point: the node's own strike
    // is the whole answer, and it is an answer.
    return ((here.strikeDeg % 360) + 360) % 360;
  }
  const bearing = bearingBetween(
    behind.latitude,
    behind.longitude,
    ahead.latitude,
    ahead.longitude
  );
  return ((bearing % 360) + 360) % 360;
}

/** Rule 299: how much fault a trace maps, walked vertex to vertex. */
export function traceLengthM(trace: readonly TracePoint[]): number {
  let total = 0;
  for (let i = 0; i + 1 < trace.length; i += 1) {
    const a = trace[i];
    const b = trace[i + 1];
    if (a === undefined || b === undefined) continue;
    total += distanceBetween(a.latitude, a.longitude, b.latitude, b.longitude);
  }
  return total;
}

/**
 * THE OUTCOME OF THE SECOND CANDIDATE, measured on 20 September 2026. The rules
 * above were pushed in commit 2b4bcf8 and the candidate in 5638ae9, both before
 * one value of Slab2 was read at one epicentre.
 *
 * ACCEPTED, on all four clauses of rule 301 that a measurement can decide, and
 * no bound was moved to get there.
 *
 * | preset      |  Mw |     L | published |  found |     Δ | Δ from N | source             | what answered                          |
 * |-------------|----:|------:|----------:|-------:|------:|---------:|--------------------|----------------------------------------|
 * | Tōhoku      | 9.1 |   702 |      200° | 199.5° |  0.5° |    20.0° | interface, rule 296 | slab 33 km, hypocentre 29 km, ±25 km  |
 * | Kokoxili    | 7.8 |   167 |       95° |  83.5° | 11.5° |    85.0° | crustal, rule 300(b)| unnamed sinistral, 157 km of trace, 8 km away |
 * | Sumatra     | 9.2 | 1 300 |      330° | 327.2° |  2.8° |    30.0° | interface, rule 296 | slab 32 km, hypocentre 30 km, ±22 km  |
 * | Valdivia    | 9.5 | 1 204 |       10° |  11.2° |  1.2° |    10.0° | interface, rule 296 | slab 31 km, hypocentre 33 km, ±22 km  |
 * | Alaska      | 9.2 |   804 |      245° | 234.8° | 10.2° |    65.0° | interface, rule 296 | slab 21 km, hypocentre 25 km, ±24 km  |
 * | Gorkha      | 7.8 |   113 |      290° | 281.8° |  8.2° |    70.0° | interface, rule 296 | slab 22 km, hypocentre 8 km, ±19 km   |
 *
 *   301(a) worst Δ 11.5° against 25°              — inside
 *   301(b) beats north on 6 of 6                  — inside
 *   301(c) found 6 of 6 against 5                 — inside
 *   301(f) 218 911 bytes against 1 500 000, worst tile 7 267 against 120 000 — inside
 *
 * WHAT THE MEASUREMENT SAYS, beyond the four INSIDEs.
 *
 * The first round's two causes are both closed, and closed by the DATA and not
 * by a wider bound. Every one of the four subduction presets was answered by
 * rule 296 — the hypocentre within tolerance of the mapped surface — and not by
 * rule 297's capacity clause, which never had to fire. The interfaces the GEM
 * database put 137, 151 and 202 km out of reach are, in Slab2, directly under
 * the epicentres: 33, 32 and 21 km down, against hypocentres at 29, 30 and
 * 25 km. Valdivia, which the first round handed to a crustal fault 22 km away,
 * is 2 km from the surface of the Nazca slab and reads its strike to 1.2°.
 *
 * GORKHA IS THE RESULT THAT WAS NOT EXPECTED, and it is worth saying plainly
 * because the first round wrote the opposite. It recorded that "no reach law
 * reaches a fault that is not in the file, and rule 290's UNKNOWN is the honest
 * answer for Gorkha whatever else changes" — the GEM database maps an
 * anticline, a syncline and a normal fault within 90 km of that epicentre and
 * no thrust. That sentence was true of the GEM database and wrong as a
 * statement about Gorkha: Slab2 carries the Main Himalayan Thrust as its `him`
 * model, 22 km under the epicentre, and reads its strike to 8.2° where north is
 * wrong by 70. What was missing was never the law. It was the file.
 *
 * KOKOXILI IS UNCHANGED, to the decimal: 83.5°, 11.5° from the published strike,
 * from the same unnamed sinistral trace 8 km away, which maps 157 km against the
 * 167 km its rupture asks for and so passes rule 299 by a whisker. The crustal
 * path is the first round's path and it was not touched; that it gives the same
 * number is the check that rule 299 did not quietly change what it filtered.
 *
 * WHAT IT DOES NOT SAY. Six earthquakes are six earthquakes. Five of the six are
 * answered by one model of one kind of structure, so what is measured here is
 * mostly "does Slab2 hold the interfaces of the great megathrusts", to which the
 * answer was never in doubt; the harder question — whether this picks the right
 * structure where the tectonics are ambiguous — has no preset to ask it of. The
 * tolerance of rule 296(c) was never stretched: the closest call was Gorkha, at
 * 14 km inside a 19 km tolerance. And nothing here has been drawn: the numbers
 * above are what the lookup returns, not what a reader sees, until the wiring
 * puts them in the picture and in the toll.
 */
export const SLAB_STRIKE_SECOND_CANDIDATE =
  'ACCEPTED 20 September 2026: with Slab2 under the strike, the six presets are found six of six, the worst error is 11.5\u00b0 against a 25\u00b0 bound, north is beaten on every one, and 218 911 bytes are shipped against a budget of 1 500 000. Four of the six are answered by rule 296 alone — the hypocentre on the mapped interface — and rule 297\u2019s capacity clause never had to fire. Gorkha, which the first round declared permanently UNKNOWN, is answered to 8.2\u00b0: Slab2 carries the Main Himalayan Thrust that the GEM database does not.';

/** Which source answered, and under which clause of rule 300. */
export type StrikeSource = 'interface-depth' | 'interface-capacity' | 'crustal' | 'unknown';
