import {
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  DistanceDisplayCondition,
  EllipseOutlineGeometry,
  HeightReference,
  HorizontalOrigin,
  LabelStyle,
  Math as CesiumMath,
  PolylineDashMaterialProperty,
  VerticalOrigin,
  type Entity,
  type Viewer,
} from 'cesium';

/**
 * How a damage contour is drawn once its radius is known: a crisp
 * ground polyline for the boundary, a short label at the rim naming
 * the threshold and its radius, and (optionally) a dashed line at the
 * upper 1σ radius. Everything the fill shader cannot do well —
 * a hairline is not a contour, and a legend across the screen is not
 * a label.
 *
 * The boundary is sampled with Cesium's own `EllipseOutlineGeometry`,
 * so it follows the ellipse entity's rotation convention exactly
 * (empirically: rotation 0 puts the major axis east–west, rotation
 * π/2 north–south — counter-clockwise from east, whatever the doc
 * comment says) and matches the animated fill to the metre.
 */

export interface RingOutlineSpec {
  centerLatDeg: number;
  centerLonDeg: number;
  semiMajorM: number;
  semiMinorM: number;
  /** Cesium ellipse rotation (rad), same value handed to the entity. */
  rotationRad: number;
}

/** Sample the ellipse boundary as a closed loop of surface points. */
export function ringOutlinePositions(spec: RingOutlineSpec, granularityRad = 0.02): Cartesian3[] {
  const a = Math.max(spec.semiMajorM, spec.semiMinorM, 1);
  const b = Math.max(Math.min(spec.semiMajorM, spec.semiMinorM), 1);
  const geometry = EllipseOutlineGeometry.createGeometry(
    new EllipseOutlineGeometry({
      center: Cartesian3.fromDegrees(spec.centerLonDeg, spec.centerLatDeg),
      semiMajorAxis: a,
      semiMinorAxis: b,
      rotation: spec.rotationRad,
      granularity: granularityRad,
    })
  );
  if (geometry === undefined) return [];
  const values = geometry.attributes.position?.values;
  if (values === undefined) return [];
  const out: Cartesian3[] = [];
  for (let i = 0; i + 2 < values.length; i += 3) {
    out.push(new Cartesian3(values[i] ?? 0, values[i + 1] ?? 0, values[i + 2] ?? 0));
  }
  const first = out[0];
  if (first !== undefined) out.push(Cartesian3.clone(first));
  return out;
}

/**
 * Point of the outline closest to the requested compass bearing from
 * the centre (clockwise from north). Used to anchor the label.
 */
export function outlinePointAtBearing(
  positions: readonly Cartesian3[],
  centerLatDeg: number,
  centerLonDeg: number,
  bearingDeg: number
): Cartesian3 | null {
  if (positions.length === 0) return null;
  const target = CesiumMath.toRadians(((bearingDeg % 360) + 360) % 360);
  const lat0 = CesiumMath.toRadians(centerLatDeg);
  const lon0 = CesiumMath.toRadians(centerLonDeg);
  let best: Cartesian3 | null = null;
  let bestDelta = Infinity;
  for (const p of positions) {
    const c = Cartographic.fromCartesian(p);
    const dLon = c.longitude - lon0;
    const y = Math.sin(dLon) * Math.cos(c.latitude);
    const x =
      Math.cos(lat0) * Math.sin(c.latitude) -
      Math.sin(lat0) * Math.cos(c.latitude) * Math.cos(dLon);
    const bearing = Math.atan2(y, x);
    let delta = Math.abs(bearing - target);
    if (delta > Math.PI) delta = 2 * Math.PI - delta;
    if (delta < bestDelta) {
      bestDelta = delta;
      best = p;
    }
  }
  return best;
}

/**
 * Radius caption: metres below a kilometre, one decimal below 100 km,
 * whole kilometres beyond, thousands grouped by the locale.
 */
export function formatRingRadius(radiusM: number, language: string): string {
  if (!Number.isFinite(radiusM) || radiusM <= 0) return '—';
  const locale = language.toLowerCase().startsWith('it') ? 'it-IT' : 'en-US';
  if (radiusM < 1_000) return `${radiusM.toLocaleString(locale, { maximumFractionDigits: 0 })} m`;
  const km = radiusM / 1_000;
  const digits = km < 100 ? 1 : 0;
  return `${km.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })} km`;
}

/**
 * Bearings for the rim captions of a nested family of contours, in
 * ascending radius order. Captions are spread around the family like
 * the spokes of a pinwheel — each successive contour prints one step
 * further around — so two contours whose radii are close never stack
 * their captions on the same diagonal. The step is 360°/N clamped to
 * [36°, 120°]: three MMI contours sit 120° apart, eight blast rings
 * 45° apart.
 */
export function spreadLabelBearings(count: number, baseBearingDeg = 35): number[] {
  if (!Number.isFinite(count) || count <= 0) return [];
  const step = Math.min(120, Math.max(36, 360 / count));
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push((baseBearingDeg + step * i) % 360);
  return out;
}

const EDGE_SHADOW = Color.fromCssColorString('#0A0E16');

export interface RingEdgeOptions {
  /** Entity id prefix; `-edge` / `-edge-shadow` are appended. */
  id: string;
  color: Color;
  /** Core line width in pixels. */
  width?: number;
  /** Alpha of the core line. */
  alpha?: number;
}

/**
 * The contour: a dark under-line for contrast on bright terrain and a
 * coloured core line on top, both clamped to the ground. Returns the
 * two entities so the caller can bind their visibility and tooltip.
 */
export function addRingEdge(
  viewer: Viewer,
  positions: readonly Cartesian3[],
  options: RingEdgeOptions
): Entity[] {
  if (positions.length < 2) return [];
  const width = options.width ?? 2.2;
  const alpha = options.alpha ?? 0.95;
  const shadow = viewer.entities.add({
    id: `${options.id}-edge-shadow`,
    polyline: {
      positions: [...positions],
      width: width + 2.4,
      material: EDGE_SHADOW.withAlpha(0.42),
      clampToGround: true,
    },
  });
  const core = viewer.entities.add({
    id: `${options.id}-edge`,
    polyline: {
      positions: [...positions],
      width,
      material: options.color.withAlpha(alpha),
      clampToGround: true,
    },
  });
  return [shadow, core];
}

/** Dashed line at the upper 1σ radius — "the contour might extend
 *  this far" — replacing the filled halo disc of earlier revisions. */
export function addSigmaBandLine(
  viewer: Viewer,
  id: string,
  positions: readonly Cartesian3[],
  color: Color
): Entity | null {
  if (positions.length < 2) return null;
  return viewer.entities.add({
    id: `${id}-sigma-band`,
    polyline: {
      positions: [...positions],
      width: 1.6,
      clampToGround: true,
      material: new PolylineDashMaterialProperty({
        color: color.withAlpha(0.55),
        gapColor: Color.TRANSPARENT,
        dashLength: 10,
      }),
    },
  });
}

export interface RingLabelOptions {
  id: string;
  text: string;
  color: Color;
  position: Cartesian3;
  /** Radius (m) of the ring the label belongs to: the label is hidden
   *  when the camera is so far that the ring itself is a few pixels. */
  radiusM: number;
}

/** How far the camera may be, in multiples of the ring radius, before
 *  the caption is dropped: at 40 radii the ring spans ≈ 60 px on a
 *  1 440 px viewport, the smallest disc on which a caption still reads
 *  as belonging to a contour rather than floating over the centre. */
const LABEL_VISIBLE_RANGE_RADII = 40;

/**
 * Threshold caption at the rim: mono, in the ring's colour, with a
 * dark outline so it survives both ocean and desert underneath.
 */
export function addRingLabel(viewer: Viewer, options: RingLabelOptions): Entity {
  const far = Math.max(50_000, options.radiusM * LABEL_VISIBLE_RANGE_RADII);
  return viewer.entities.add({
    id: `${options.id}-label`,
    position: options.position,
    label: {
      text: options.text,
      font: '500 12px "JetBrains Mono", ui-monospace, monospace',
      fillColor: options.color.withAlpha(1),
      style: LabelStyle.FILL,
      // A dark pill behind the caption, like a map callout: reads on
      // ocean, desert and ice alike without an outline muddying the
      // small mono glyphs.
      showBackground: true,
      backgroundColor: EDGE_SHADOW.withAlpha(0.74),
      backgroundPadding: new Cartesian2(6, 4),
      pixelOffset: new Cartesian2(6, -5),
      horizontalOrigin: HorizontalOrigin.LEFT,
      verticalOrigin: VerticalOrigin.BOTTOM,
      heightReference: HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: 300_000,
      distanceDisplayCondition: new DistanceDisplayCondition(0, far),
    },
  });
}
