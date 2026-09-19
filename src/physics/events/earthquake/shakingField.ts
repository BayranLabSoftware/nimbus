import { FIELD_GRID_POINTS, type Vs30Provenance } from '../../validation/shakingFieldRules.js';

/**
 * The shaking of an earthquake as a field, evaluated on the ground each point
 * actually stands on.
 *
 * Rules 309 to 315 of `validation/shakingFieldRules.ts`. What is new here is
 * not a law — `intensityAt` comes from the scenario and is the very law its
 * contours are drawn by, rule 311 — but WHERE the law is read: at every point
 * of a grid, each with its own Vs30, instead of once with the epicentre's.
 *
 * The grid lives in the rupture's own frame: x along the strike, y across it,
 * metres, square cells. A rounded rectangle in that frame is a rectangle
 * inflated by a disc, so the Joyner–Boore distance is two subtractions and a
 * hypotenuse, and a point source falls out of it as the case where the
 * rectangle has no size at all.
 */

const EARTH_MEAN_RADIUS_M = 6_371_008;
const DEG = Math.PI / 180;

/** The rupture a field is drawn around, as its surface projection. */
export interface RuptureFootprint {
  latitude: number;
  longitude: number;
  /** Degrees from north; the x axis of the field's frame. */
  strikeDeg: number;
  /** Half the surface length along strike (m). Zero for a point source. */
  halfLengthM: number;
  /** Half the surface width across strike (m). Zero for a point source. */
  halfWidthM: number;
}

/** What the ground answers at a place. */
export interface SiteReading {
  vs30: number;
  provenance: Vs30Provenance;
}

export interface ShakingFieldInput {
  rupture: RuptureFootprint;
  /** Rule 311: the scenario's own law, read forwards. */
  intensityAt: (distanceM: number, vs30: number) => number;
  /** Rule 310: the ground, wherever it comes from. */
  siteAt: (latitude: number, longitude: number) => SiteReading;
  /** Half the side of the square the field covers (m). */
  halfSpanM: number;
  /** Rule 312: odd, so that a point sits on the epicentre. */
  points?: number;
}

export interface ShakingField {
  points: number;
  halfSpanM: number;
  /** Spacing between grid points (m). */
  stepM: number;
  rupture: RuptureFootprint;
  /** Intensity at each point, row-major, row 0 at y = −halfSpan. */
  mmi: Float32Array;
  /** The ground each point stood on. */
  vs30: Float32Array;
  /** How many points took their Vs30 from where. */
  provenance: Record<Vs30Provenance, number>;
  /** How long the evaluation took (ms). */
  elapsedMs: number;
}

/** A point of the field's frame, in metres from the rupture's centre. */
export interface FramePoint {
  x: number;
  y: number;
}

/** Where a point of the frame is on the sphere. */
export function frameToGeographic(
  rupture: RuptureFootprint,
  point: FramePoint
): { latitude: number; longitude: number } {
  const distance = Math.hypot(point.x, point.y);
  if (distance === 0) return { latitude: rupture.latitude, longitude: rupture.longitude };
  // Azimuth of (x along strike, y across strike) measured from north.
  const azimuth = rupture.strikeDeg * DEG + Math.atan2(point.y, point.x);
  const delta = distance / EARTH_MEAN_RADIUS_M;
  const lat0 = rupture.latitude * DEG;
  const lon0 = rupture.longitude * DEG;
  const sinLat =
    Math.sin(lat0) * Math.cos(delta) + Math.cos(lat0) * Math.sin(delta) * Math.cos(azimuth);
  const latitude = Math.asin(Math.min(1, Math.max(-1, sinLat)));
  const longitude =
    lon0 +
    Math.atan2(
      Math.sin(azimuth) * Math.sin(delta) * Math.cos(lat0),
      Math.cos(delta) - Math.sin(lat0) * sinLat
    );
  return {
    latitude: latitude / DEG,
    longitude: ((longitude / DEG + 540) % 360) - 180,
  };
}

/** The Joyner–Boore distance of a frame point from the rupture rectangle —
 *  and, where the rectangle has no size, the epicentral distance. */
export function frameDistanceM(rupture: RuptureFootprint, point: FramePoint): number {
  const dx = Math.max(0, Math.abs(point.x) - Math.max(0, rupture.halfLengthM));
  const dy = Math.max(0, Math.abs(point.y) - Math.max(0, rupture.halfWidthM));
  return Math.hypot(dx, dy);
}

/**
 * Rule 309: the field. One pass over the grid, one site reading and one law
 * evaluation a point.
 */
export function evaluateShakingField(input: ShakingFieldInput): ShakingField {
  const points = input.points ?? FIELD_GRID_POINTS;
  const started = Date.now();
  const stepM = (2 * input.halfSpanM) / (points - 1);
  const mmi = new Float32Array(points * points);
  const vs30 = new Float32Array(points * points);
  const provenance: Record<Vs30Provenance, number> = { grid: 0, slope: 0, rock: 0 };

  for (let row = 0; row < points; row += 1) {
    const y = -input.halfSpanM + row * stepM;
    for (let col = 0; col < points; col += 1) {
      const x = -input.halfSpanM + col * stepM;
      const here = frameToGeographic(input.rupture, { x, y });
      const site = input.siteAt(here.latitude, here.longitude);
      const at = row * points + col;
      vs30[at] = site.vs30;
      provenance[site.provenance] += 1;
      mmi[at] = input.intensityAt(frameDistanceM(input.rupture, { x, y }), site.vs30);
    }
  }

  return {
    points,
    halfSpanM: input.halfSpanM,
    stepM,
    rupture: input.rupture,
    mmi,
    vs30,
    provenance,
    elapsedMs: Date.now() - started,
  };
}

/** A closed ring of a contour, in the field's frame. */
export type ContourRing = FramePoint[];

/**
 * Rule 312: the contours of a level, by marching squares with linear
 * interpolation along each cell edge.
 *
 * Segments are walked into rings by matching their ends, so a level broken
 * into several pieces by the ground comes back as several rings — which is
 * exactly what a single stadium could not say. Rings that fail to close (the
 * level runs off the edge of the field) are returned as they are, open, and the
 * caller decides: a picture clips them, a measurement counts cells instead.
 */
export function contourRings(field: ShakingField, level: number): ContourRing[] {
  const n = field.points;
  const value = (row: number, col: number): number => field.mmi[row * n + col] ?? Number.NaN;
  const coord = (index: number): number => -field.halfSpanM + index * field.stepM;

  const segments: [FramePoint, FramePoint][] = [];
  const interpolate = (
    xa: number,
    ya: number,
    va: number,
    xb: number,
    yb: number,
    vb: number
  ): FramePoint => {
    const t = Math.abs(vb - va) < 1e-12 ? 0.5 : (level - va) / (vb - va);
    const clamped = Math.min(1, Math.max(0, t));
    return { x: xa + clamped * (xb - xa), y: ya + clamped * (yb - ya) };
  };

  for (let row = 0; row + 1 < n; row += 1) {
    for (let col = 0; col + 1 < n; col += 1) {
      // Corners, counter-clockwise from the bottom left.
      const v00 = value(row, col);
      const v10 = value(row, col + 1);
      const v11 = value(row + 1, col + 1);
      const v01 = value(row + 1, col);
      if (
        !Number.isFinite(v00) ||
        !Number.isFinite(v10) ||
        !Number.isFinite(v11) ||
        !Number.isFinite(v01)
      )
        continue;
      const x0 = coord(col);
      const x1 = coord(col + 1);
      const y0 = coord(row);
      const y1 = coord(row + 1);

      // Strictly above, not "at or above": a node that lands exactly on the
      // level — which happens whenever a law is linear and a level round —
      // would otherwise open a ring of zero perimeter at that node.
      let code = 0;
      if (v00 > level) code |= 1;
      if (v10 > level) code |= 2;
      if (v11 > level) code |= 4;
      if (v01 > level) code |= 8;
      if (code === 0 || code === 15) continue;

      const bottom = (): FramePoint => interpolate(x0, y0, v00, x1, y0, v10);
      const right = (): FramePoint => interpolate(x1, y0, v10, x1, y1, v11);
      const top = (): FramePoint => interpolate(x0, y1, v01, x1, y1, v11);
      const left = (): FramePoint => interpolate(x0, y0, v00, x0, y1, v01);

      // Every segment is oriented with the INSIDE — the ground at or above the
      // level — on its left. Without that the pieces cannot be walked into a
      // ring: a contour cut into 22 open arcs is what an unoriented table
      // gives, and it was what this gave before 20 September 2026.
      switch (code) {
        case 1:
          segments.push([bottom(), left()]);
          break;
        case 14:
          segments.push([left(), bottom()]);
          break;
        case 2:
          segments.push([right(), bottom()]);
          break;
        case 13:
          segments.push([bottom(), right()]);
          break;
        case 4:
          segments.push([top(), right()]);
          break;
        case 11:
          segments.push([right(), top()]);
          break;
        case 8:
          segments.push([left(), top()]);
          break;
        case 7:
          segments.push([top(), left()]);
          break;
        case 3:
          segments.push([right(), left()]);
          break;
        case 12:
          segments.push([left(), right()]);
          break;
        case 6:
          segments.push([top(), bottom()]);
          break;
        case 9:
          segments.push([bottom(), top()]);
          break;
        // The two saddles: the mean of the four corners says whether the middle
        // belongs to the inside, and that decides which pair of corners the
        // contour keeps together.
        case 5: {
          if ((v00 + v10 + v11 + v01) / 4 > level) {
            segments.push([bottom(), right()], [top(), left()]);
          } else {
            segments.push([bottom(), left()], [top(), right()]);
          }
          break;
        }
        case 10: {
          if ((v00 + v10 + v11 + v01) / 4 > level) {
            segments.push([left(), bottom()], [right(), top()]);
          } else {
            segments.push([right(), bottom()], [left(), top()]);
          }
          break;
        }
        default:
          break;
      }
    }
  }
  const perimeter = (ring: ContourRing): number => {
    let total = 0;
    for (let i = 0; i + 1 < ring.length; i += 1) {
      const a = ring[i];
      const b = ring[i + 1];
      if (a === undefined || b === undefined) continue;
      total += Math.hypot(b.x - a.x, b.y - a.y);
    }
    return total;
  };
  // A ring shorter than one cell is not a contour; it is a node that fell on
  // the level. Kept out rather than drawn as a speck.
  return stitch(segments, field.stepM * 1e-3).filter((ring) => perimeter(ring) >= field.stepM);
}

/** Walk segments into rings by matching their ends. */
function stitch(segments: readonly [FramePoint, FramePoint][], tolerance: number): ContourRing[] {
  const key = (p: FramePoint): string =>
    `${Math.round(p.x / tolerance).toString()}:${Math.round(p.y / tolerance).toString()}`;
  const starts = new Map<string, number[]>();
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    if (segment === undefined) continue;
    const k = key(segment[0]);
    const list = starts.get(k);
    if (list === undefined) starts.set(k, [i]);
    else list.push(i);
  }
  const used = new Array<boolean>(segments.length).fill(false);
  const rings: ContourRing[] = [];
  for (let i = 0; i < segments.length; i += 1) {
    if (used[i] === true) continue;
    const first = segments[i];
    if (first === undefined) continue;
    used[i] = true;
    const ring: ContourRing = [first[0], first[1]];
    for (;;) {
      const tail = ring[ring.length - 1];
      if (tail === undefined) break;
      const candidates = starts.get(key(tail));
      let next = -1;
      if (candidates !== undefined) {
        for (const c of candidates) {
          if (used[c] !== true) {
            next = c;
            break;
          }
        }
      }
      if (next < 0) break;
      const segment = segments[next];
      if (segment === undefined) break;
      used[next] = true;
      ring.push(segment[1]);
      const head = ring[0];
      if (head !== undefined && key(segment[1]) === key(head)) break;
    }
    if (ring.length > 2) rings.push(ring);
  }
  return rings;
}

/** The ground area at or above a level (m²), counted cell by cell — the
 *  quantity rule 314(a) compares against a published ShakeMap. */
export function areaAbove(field: ShakingField, level: number): number {
  const n = field.points;
  const cell = field.stepM * field.stepM;
  let cells = 0;
  for (let row = 0; row + 1 < n; row += 1) {
    for (let col = 0; col + 1 < n; col += 1) {
      // A cell counts when its centre — the mean of its corners — is above.
      const v =
        ((field.mmi[row * n + col] ?? 0) +
          (field.mmi[row * n + col + 1] ?? 0) +
          (field.mmi[(row + 1) * n + col] ?? 0) +
          (field.mmi[(row + 1) * n + col + 1] ?? 0)) /
        4;
      if (v >= level) cells += 1;
    }
  }
  return cells * cell;
}
