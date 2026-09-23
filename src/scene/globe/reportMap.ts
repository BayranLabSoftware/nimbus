/**
 * An impact's map drawn for the printed report (ROADMAP IMP-7c): the same
 * layer the globe draws (`impactFieldMap.ts`), laid flat in the azimuthal
 * equidistant projection about the point of impact, on a paper ground.
 *
 * That projection is the one the model's families are defined in — each is a
 * set of ellipses scaled about the origin of this very plane
 * (`nominalRangeFromPolar`) — so the field's colour at a pixel is the colour
 * the globe gives the same distance and bearing, the isolines are the model's
 * own curves, and every distance from the centre is true, in every direction,
 * which is what lets the page carry a scale bar. Nothing here needs a GPU or
 * the network: a report opened from a link draws the same pixels.
 */
import { EARTH_RADIUS } from '../../physics/constants.js';
import {
  familyShapes,
  markGroundField,
  nominalRangeFromPolar,
  type FamilyShape,
  type GeoPoint,
  type GroundField,
  type ImpactMapLayer,
} from './impactFieldMap.js';
import type { MapState } from './mapGrammarRules.js';
import type { ImpactScenarioResult } from '../../physics/simulate.js';

const R = EARTH_RADIUS as number;
const RAD = Math.PI / 180;

/** A point of the plane: metres east and north of the point of impact. */
export type PlanePoint = readonly [number, number];

/** The plane coordinates of a point of the sphere. */
export function aeqdForward(anchor: GeoPoint, latDeg: number, lonDeg: number): PlanePoint {
  const f1 = anchor.latDeg * RAD;
  const f = latDeg * RAD;
  const dl = (lonDeg - anchor.lonDeg) * RAD;
  const cosc = Math.sin(f1) * Math.sin(f) + Math.cos(f1) * Math.cos(f) * Math.cos(dl);
  const c = Math.acos(Math.max(-1, Math.min(1, cosc)));
  const k = c < 1e-12 ? 1 : c / Math.sin(c);
  return [
    R * k * Math.cos(f) * Math.sin(dl),
    R * k * (Math.cos(f1) * Math.sin(f) - Math.sin(f1) * Math.cos(f) * Math.cos(dl)),
  ];
}

/** The point of the sphere at plane coordinates (x east, y north, metres). */
export function aeqdInverse(anchor: GeoPoint, x: number, y: number): GeoPoint {
  const p = Math.hypot(x, y);
  if (p < 1e-9) return anchor;
  const f1 = anchor.latDeg * RAD;
  const c = p / R;
  const lat = Math.asin(Math.cos(c) * Math.sin(f1) + (y * Math.sin(c) * Math.cos(f1)) / p);
  const lon =
    anchor.lonDeg * RAD +
    Math.atan2(x * Math.sin(c), p * Math.cos(f1) * Math.cos(c) - y * Math.sin(f1) * Math.sin(c));
  const lonDeg = ((((lon / RAD + 180) % 360) + 360) % 360) - 180;
  return { latDeg: lat / RAD, lonDeg };
}

/** The point of a family's isoline at a compass bearing, in the plane: the
 *  distance along the bearing at which the nominal radius reaches the level. */
export function isolineInPlane(
  shape: FamilyShape,
  nominalRadiusM: number,
  bearingDeg: number
): PlanePoint {
  const bearing = (((bearingDeg % 360) + 360) % 360) * RAD;
  let lo = 0;
  let hi =
    nominalRadiusM *
    (Math.max(shape.majorMult, shape.minorMult) + Math.abs(shape.offsetPerMeter)) *
    2;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (nominalRangeFromPolar(shape, mid, bearing) < nominalRadiusM) lo = mid;
    else hi = mid;
  }
  const d = (lo + hi) / 2;
  return [d * Math.sin(bearing), d * Math.cos(bearing)];
}

export interface ReportIsoline {
  id: string;
  label: string;
  points: PlanePoint[];
  labelAt: PlanePoint;
  /** Rule 1030: a line at a limit of the model is drawn as no isoline, and
   *  its callout (`label`) is written instead (rule 1031 (a)). */
  state: MapState;
}

export interface GraticuleLine {
  kind: 'lat' | 'lon';
  valueDeg: number;
  points: PlanePoint[];
}

export interface ReportMapDrawing {
  /** Half the side of the square the map shows, metres. */
  halfWidthM: number;
  isolines: ReportIsoline[];
  /** Rule 1030 (3): the limits of the model, each a dash-dot line. */
  limits: { id: string; points: PlanePoint[] }[];
  /** The crater's rim, where there is a crater. */
  crater: PlanePoint[] | null;
  graticule: { stepDeg: number; lines: GraticuleLine[] };
  /** A round length for the scale bar, metres. */
  scaleBarM: number;
}

const BEARING_STEP_DEG = 2;

function outline(shape: FamilyShape, nominalRadiusM: number): PlanePoint[] {
  const points: PlanePoint[] = [];
  for (let b = 0; b <= 360; b += BEARING_STEP_DEG)
    points.push(isolineInPlane(shape, nominalRadiusM, b));
  return points;
}

/** The gap between graticule lines: at most six across the map. */
export function graticuleStep(spanDeg: number): number {
  for (const s of [0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10, 15, 30])
    if (spanDeg / s <= 6) return s;
  return 45;
}

/** The longest round length (1, 2 or 5 × 10ⁿ m) within `maxM`. */
export function roundLength(maxM: number): number {
  const e = 10 ** Math.floor(Math.log10(maxM));
  for (const m of [5, 2, 1]) if (m * e <= maxM) return m * e;
  return e;
}

function graticule(anchor: GeoPoint, halfWidthM: number): ReportMapDrawing['graticule'] {
  // The square's reach in degrees, with room for the meridians' convergence.
  const dLat = Math.min((halfWidthM / (R * RAD)) * 1.6, 89);
  const cosLat = Math.max(Math.cos(anchor.latDeg * RAD), 0.05);
  const dLon = Math.min((halfWidthM / (R * RAD * cosLat)) * 1.6, 180);
  const stepDeg = graticuleStep((2 * halfWidthM) / (R * RAD));
  const lines: GraticuleLine[] = [];
  const samples = 96;
  const south = Math.max(anchor.latDeg - dLat, -89.5);
  const north = Math.min(anchor.latDeg + dLat, 89.5);
  for (let v = Math.ceil(south / stepDeg) * stepDeg; v <= north + 1e-9; v += stepDeg) {
    const points: PlanePoint[] = [];
    for (let k = 0; k <= samples; k++) {
      points.push(aeqdForward(anchor, v, anchor.lonDeg - dLon + (2 * dLon * k) / samples));
    }
    lines.push({ kind: 'lat', valueDeg: Number(v.toFixed(6)), points });
  }
  for (
    let v = Math.ceil((anchor.lonDeg - dLon) / stepDeg) * stepDeg;
    v <= anchor.lonDeg + dLon + 1e-9;
    v += stepDeg
  ) {
    const points: PlanePoint[] = [];
    for (let k = 0; k <= samples; k++) {
      points.push(aeqdForward(anchor, south + ((north - south) * k) / samples, v));
    }
    const wrapped = ((((v + 180) % 360) + 360) % 360) - 180;
    lines.push({ kind: 'lon', valueDeg: Number(wrapped.toFixed(6)), points });
  }
  return { stepDeg, lines };
}

/** How much of the plane a layer needs: its outermost isoline with a margin,
 *  or the painted field where it has no isoline. */
export function reportMapHalfWidth(result: ImpactScenarioResult, layer: ImpactMapLayer): number {
  const shapes = familyShapes(result);
  let reach = 0;
  for (const line of layer.isolines) {
    for (const [x, y] of outline(shapes[line.family], line.radiusM)) {
      reach = Math.max(reach, Math.abs(x), Math.abs(y));
    }
  }
  // Rule 1031 (d): a halo from the centre is framed whole.
  for (const mk of layer.marks) {
    if (mk.fromM > 0) continue;
    for (const [x, y] of outline(shapes[mk.family], mk.toM)) {
      reach = Math.max(reach, Math.abs(x), Math.abs(y));
    }
  }
  if (reach === 0 && layer.field !== null) {
    const s = shapes[layer.field.family];
    reach =
      layer.field.maxRangeM * (Math.max(s.majorMult, s.minorMult) + Math.abs(s.offsetPerMeter));
  }
  // A map at least eight kilometres across, and never past the antipode.
  return Math.min(Math.max(reach * 1.16, 4_000), Math.PI * R * 0.98);
}

/** Everything the report's map draws in vector: isolines, crater, graticule,
 *  scale. The ground comes from {@link rasterizeReportMap}. */
export function reportMapDrawing(
  result: ImpactScenarioResult,
  layer: ImpactMapLayer,
  anchor: GeoPoint
): ReportMapDrawing {
  const shapes = familyShapes(result);
  const halfWidthM = reportMapHalfWidth(result, layer);
  const isolines = layer.isolines.map((line) => ({
    id: line.id,
    label: line.state === 'modelLimit' ? (line.atLimit ?? line.label) : line.label,
    points: outline(shapes[line.family], line.radiusM),
    labelAt: isolineInPlane(shapes[line.family], line.radiusM, line.labelBearingDeg),
    state: line.state,
  }));
  const limits = layer.marks
    .filter((mk) => mk.state === 'modelLimit')
    .map((mk) => ({ id: mk.id, points: outline(shapes[mk.family], mk.fromM) }));
  const rim = result.damage.craterRim as number;
  return {
    halfWidthM,
    isolines,
    limits,
    crater: rim > 0 ? outline(shapes.crater, rim) : null,
    graticule: graticule(anchor, halfWidthM),
    scaleBarM: roundLength(halfWidthM * 0.42),
  };
}

/** What a layer paints past its edge on paper (rule 1037 (a)): its marks'
 *  grounds, each in its family's shape. */
export function reportMapOverlays(
  result: ImpactScenarioResult,
  layer: ImpactMapLayer
): { field: GroundField; shape: FamilyShape }[] {
  const shapes = familyShapes(result);
  return layer.marks.flatMap((mk) => {
    const field = markGroundField(mk, 'paper');
    return field === null ? [] : [{ field, shape: shapes[mk.family] }];
  });
}

/** People and land at a point, from the shipped population raster. */
export type GroundSampler = (latDeg: number, lonDeg: number) => { land: number; density: number };

/** The shipped grid's shape (`populationLookup.GridView`). */
export interface PopulationGridLike {
  cellDeg: number;
  nLon: number;
  nLat: number;
  maxLat: number;
  minLon: number;
  cellAt(row: number, col: number): { people: number; landFraction: number };
}

/** A sampler over a population grid: bilinear in the logarithm of the
 *  density (people per km²) and in the land fraction. */
export function gridSampler(grid: PopulationGridLike): GroundSampler {
  const kmPerDeg = (R * RAD) / 1_000;
  return (latDeg, lonDeg) => {
    const fy = (grid.maxLat - latDeg) / grid.cellDeg - 0.5;
    const fx = (lonDeg - grid.minLon) / grid.cellDeg - 0.5;
    const r0 = Math.floor(fy);
    const c0 = Math.floor(fx);
    const ty = fy - r0;
    const tx = fx - c0;
    const area = (grid.cellDeg * kmPerDeg) ** 2 * Math.max(Math.cos(latDeg * RAD), 0.01);
    let logDensity = 0;
    let land = 0;
    for (const [dr, dc, w] of [
      [0, 0, (1 - ty) * (1 - tx)],
      [0, 1, (1 - ty) * tx],
      [1, 0, ty * (1 - tx)],
      [1, 1, ty * tx],
    ] as const) {
      const row = Math.min(grid.nLat - 1, Math.max(0, r0 + dr));
      const col = (((c0 + dc) % grid.nLon) + grid.nLon) % grid.nLon;
      const cell = grid.cellAt(row, col);
      logDensity += w * Math.log10(1 + cell.people / area);
      land += w * cell.landFraction;
    }
    return { land, density: 10 ** logDensity - 1 };
  };
}

/** The paper ground: sea, land, and people as darker land, as a
 *  population map prints them. */
export const PAPER_GROUND = {
  sea: [214, 225, 233],
  land: [241, 240, 235],
  people: [128, 121, 110],
  /** How far the most crowded cell goes toward `people`. */
  peopleMax: 0.6,
} as const;

/** The share of the way to the people's tone a density takes: nothing below
 *  2.5 people per km², all of it from 2 500. */
export function peopleTone(density: number): number {
  return Math.max(0, Math.min(1, (Math.log10(1 + density) - 0.4) / 3));
}

/**
 * The map's ground, pixel by pixel: the paper ground under the layer's field,
 * each pixel's colour the one the globe gives its distance and bearing (the
 * same table in the logarithm of the nominal radius as `rasterizeGround`),
 * over the sea, the land and the people. RGBA, row by row from the top left,
 * opaque.
 */
export function rasterizeReportMap(
  field: GroundField | null,
  shape: FamilyShape | null,
  anchor: GeoPoint,
  halfWidthM: number,
  px: number,
  ground: GroundSampler | null,
  /** Painted over the field, in order: what the layer draws past its edge
   *  (rule 1037 (a)). */
  overlays: readonly { field: GroundField; shape: FamilyShape }[] = []
): Uint8ClampedArray<ArrayBuffer> {
  const data = new Uint8ClampedArray(px * px * 4);
  const lutN = 2_048;
  const painters = [
    ...(field !== null && shape !== null ? [{ field, shape }] : []),
    ...overlays,
  ].map(({ field: f, shape: sh }) => {
    const lut = new Float64Array(lutN * 4);
    const hatch = new Uint8Array(lutN);
    const lo = Math.log(Math.max(f.minRangeM, 1));
    const hi = Math.log(Math.max(f.maxRangeM, f.minRangeM * 1.001, 2));
    for (let i = 0; i < lutN; i++) {
      const r = Math.exp(lo + ((hi - lo) * (i + 0.5)) / lutN);
      const c = f.colorAt(r);
      if (c !== null) lut.set(c, i * 4);
      hatch[i] = f.hatchedAt?.(r) === true ? 1 : 0;
    }
    return { field: f, shape: sh, lut, hatch, lo, hi, hole: f.holeM ?? 0 };
  });
  const P = PAPER_GROUND;
  for (let py = 0; py < px; py++) {
    const y = (1 - ((py + 0.5) / px) * 2) * halfWidthM;
    for (let qx = 0; qx < px; qx++) {
      const x = (((qx + 0.5) / px) * 2 - 1) * halfWidthM;
      const o = (py * px + qx) * 4;
      if (Math.hypot(x, y) > Math.PI * R) {
        // Past the antipode the plane holds no Earth: the sheet's own white.
        data[o] = 255;
        data[o + 1] = 255;
        data[o + 2] = 255;
        data[o + 3] = 255;
        continue;
      }
      let r0: number = P.land[0];
      let g0: number = P.land[1];
      let b0: number = P.land[2];
      if (ground !== null) {
        const at = aeqdInverse(anchor, x, y);
        const g = ground(at.latDeg, at.lonDeg);
        const land = Math.max(0, Math.min(1, g.land));
        r0 = P.sea[0] + (P.land[0] - P.sea[0]) * land;
        g0 = P.sea[1] + (P.land[1] - P.sea[1]) * land;
        b0 = P.sea[2] + (P.land[2] - P.sea[2]) * land;
        const tone = peopleTone(g.density) * land * P.peopleMax;
        r0 += (P.people[0] - r0) * tone;
        g0 += (P.people[1] - g0) * tone;
        b0 += (P.people[2] - b0) * tone;
      }
      const d = Math.hypot(x, y);
      for (const p of painters) {
        const r = nominalRangeFromPolar(p.shape, d, Math.atan2(x, y));
        if (!(r > 0) || r > p.field.maxRangeM || r < p.hole) continue;
        const li = Math.min(
          lutN - 1,
          Math.max(0, Math.floor(((Math.log(Math.max(r, 1)) - p.lo) / (p.hi - p.lo)) * lutN))
        );
        let a = (p.lut[li * 4 + 3] ?? 0) / 255;
        if (a > 0) {
          if (p.hatch[li] === 1 && (qx + py) % 7 >= 2) a *= 0.16;
          r0 = r0 * (1 - a) + (p.lut[li * 4] ?? 0) * a;
          g0 = g0 * (1 - a) + (p.lut[li * 4 + 1] ?? 0) * a;
          b0 = b0 * (1 - a) + (p.lut[li * 4 + 2] ?? 0) * a;
        }
      }
      data[o] = r0;
      data[o + 1] = g0;
      data[o + 2] = b0;
      data[o + 3] = 255;
    }
  }
  return data;
}

/** The box of latitude and longitude a map covers, west to east (the
 *  longitudes may pass ±180°), for loading its population. */
export function reportMapBox(
  anchor: GeoPoint,
  halfWidthM: number
): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
  const corner = Math.SQRT2 * halfWidthM;
  const dLat = Math.min(corner / (R * RAD), 90);
  const minLat = Math.max(anchor.latDeg - dLat, -90);
  const maxLat = Math.min(anchor.latDeg + dLat, 90);
  const polar = maxLat >= 89.9 || minLat <= -89.9 || corner >= (Math.PI / 2) * R;
  if (polar) return { minLat, maxLat, minLon: -180, maxLon: 180 };
  const dLon = Math.asin(Math.min(1, Math.sin(corner / R) / Math.cos(anchor.latDeg * RAD))) / RAD;
  return { minLat, maxLat, minLon: anchor.lonDeg - dLon, maxLon: anchor.lonDeg + dLon };
}

export interface MapCity {
  name: string;
  x: number;
  y: number;
  popMax: number;
}

export interface PlacedCity extends MapCity {
  /** Where the name goes, or null where it would print over something. */
  label: { x: number; y: number; anchor: 'start' | 'end' | 'middle' } | null;
}

/**
 * The cities a map names, largest first, each name placed beside its dot where
 * it prints over no other name, no isoline label and no frame; `occupied` are
 * boxes in pixels already taken. Coordinates in pixels from the top left.
 */
export function placeCities(
  cities: readonly MapCity[],
  sizePx: number,
  occupied: readonly (readonly [number, number, number, number])[],
  charWidthPx: number,
  limit = 12
): PlacedCity[] {
  const boxes = occupied.map((b) => [...b] as [number, number, number, number]);
  const hit = (b: readonly number[]): boolean =>
    boxes.some(
      (c) => (b[0] ?? 0) < c[2] && (b[2] ?? 0) > c[0] && (b[1] ?? 0) < c[3] && (b[3] ?? 0) > c[1]
    );
  const placed: PlacedCity[] = [];
  const inside = [...cities]
    .filter((c) => c.x > 4 && c.y > 14 && c.x < sizePx - 4 && c.y < sizePx - 22)
    .sort((a, b) => b.popMax - a.popMax)
    .slice(0, limit);
  for (const c of inside) {
    const w = c.name.length * charWidthPx + 4;
    const tries = [
      {
        x: c.x + 5,
        y: c.y,
        anchor: 'start' as const,
        box: [c.x + 4, c.y - 7, c.x + 5 + w, c.y + 7],
      },
      { x: c.x - 5, y: c.y, anchor: 'end' as const, box: [c.x - 5 - w, c.y - 7, c.x - 4, c.y + 7] },
      {
        x: c.x,
        y: c.y - 10,
        anchor: 'middle' as const,
        box: [c.x - w / 2, c.y - 17, c.x + w / 2, c.y - 3],
      },
    ];
    const ok = tries.find(
      (tr) => !hit(tr.box) && (tr.box[0] ?? 0) > 0 && (tr.box[2] ?? 0) < sizePx
    );
    if (ok !== undefined) boxes.push(ok.box as [number, number, number, number]);
    placed.push({ ...c, label: ok === undefined ? null : { x: ok.x, y: ok.y, anchor: ok.anchor } });
  }
  return placed;
}
