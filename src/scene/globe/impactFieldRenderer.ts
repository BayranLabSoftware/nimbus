/**
 * Hands an impact's map (`impactFieldMap.ts`) to Cesium: the ground as one or
 * two textured rectangles, each isoline as the model's own ellipse with its
 * value written on it, and the crater as the hole it is. Every entity it adds
 * carries the `impact-field-` prefix, which `visualContracts.ts` ties to the
 * contract that says what the map claims (`impactFieldMap`).
 */
import {
  Cartesian2,
  Cartesian3,
  Color,
  HeightReference,
  ImageMaterialProperty,
  LabelStyle,
  PolylineDashMaterialProperty,
  PolylineOutlineMaterialProperty,
  Rectangle,
  type ImageryLayer,
  type Viewer,
} from 'cesium';
import type { ImpactScenarioResult } from '../../physics/simulate.js';
import {
  familyShapes,
  formatRange,
  isolinePointAtBearing,
  levelGeometry,
  markGroundField,
  markLabelRadius,
  rasterizeGround,
  type GeoPoint,
  type GroundField,
  type FamilyShape,
  type ImpactMapLayer,
} from './impactFieldMap.js';
import { ringOutlinePositions } from './ringPresentation.js';
import type { IsolineHoverInfo } from './RingTooltip.js';

export const IMPACT_FIELD_PREFIX = 'impact-field-';

/** One line with its own light edge, drawn once: two ground polylines laid
 *  one over the other alternate where they are rasterised and read as a
 *  dashed line, the look Andrea did not want. */
const ISOLINE_MATERIAL = new PolylineOutlineMaterialProperty({
  color: Color.fromCssColorString('#141414'),
  outlineColor: Color.WHITE.withAlpha(0.78),
  outlineWidth: 1,
});
const LABEL_OUTLINE = Color.fromCssColorString('#0A0E16').withAlpha(0.9);
/** Rule 1030 (3): a limit of the model — a thick dash-dot line of a neutral
 *  colour, never an isoline's black. */
const LIMIT_MATERIAL = new PolylineDashMaterialProperty({
  color: Color.fromCssColorString('#E4E4E4').withAlpha(0.95),
  gapColor: Color.TRANSPARENT,
  dashLength: 36,
  // A dash, a gap, a dot, a gap.
  dashPattern: 0b1111111100011000,
});
/** The words of a state (rule 1030): set apart from the values, in italics. */
const STATE_LABEL_FONT = 'italic 600 12px Inter, system-ui, sans-serif';
const STATE_LABEL_COLOR = Color.fromCssColorString('#ECECEC').withAlpha(0.95);
const CRATER_FILL = Color.fromCssColorString('#050505').withAlpha(0.88);
const CRATER_RIM = Color.fromCssColorString('#F4F1EA').withAlpha(0.9);

/** The imagery's tone as the viewer sets it up (Globe.tsx), and the greys it
 *  turns to under an impact's map, as ShakeMap's topography is grey: the
 *  colour then belongs to the data alone (IMP-7b). */
export const BASE_TONE = {
  saturation: 0.82,
  contrast: 1.08,
  brightness: 0.92,
  gamma: 1.05,
} as const;
export const MAP_TONE = {
  saturation: 0.06,
  contrast: 1.12,
  brightness: 0.62,
  gamma: 1.05,
} as const;

export function setImageryTone(
  layer: ImageryLayer | undefined,
  tone: typeof BASE_TONE | typeof MAP_TONE
): void {
  if (layer === undefined) return;
  layer.saturation = tone.saturation;
  layer.contrast = tone.contrast;
  layer.brightness = tone.brightness;
  layer.gamma = tone.gamma;
}

/** Remove every entity of the map; the ids go too, so the caller can drop
 *  their tooltips. */
export function clearImpactFieldLayer(viewer: Viewer): string[] {
  const stale = viewer.entities.values.filter(
    (e) => typeof e.id === 'string' && e.id.startsWith(IMPACT_FIELD_PREFIX)
  );
  for (const e of stale) viewer.entities.remove(e);
  return stale.map((e) => e.id);
}

/**
 * Draw one layer of an impact's map about `anchor`. Returns the entities'
 * tooltips by id; the ground itself carries none, the isolines do.
 */
export function drawImpactFieldLayer(
  viewer: Viewer,
  result: ImpactScenarioResult,
  layer: ImpactMapLayer,
  anchor: GeoPoint,
  language: string,
  craterLabel: string,
  /** Without its words: the report's photographs of the globe carry none,
   *  so that they read the same in either language (IMP-7c). */
  options: { labels?: boolean } = {}
): Map<string, IsolineHoverInfo> {
  const labels = options.labels !== false;
  const hover = new Map<string, IsolineHoverInfo>();
  const shapes = familyShapes(result);

  if (layer.field !== null) {
    addGround(viewer, 'ground', layer.field, shapes[layer.field.family], anchor);
  }

  // Rule 1030 (2)–(4): past the field's edge, what the model says there — a
  // faint band where it goes on below the threshold, a dash-dot line where it
  // stops, a hatch where it computes nothing — each with its state's words.
  for (const mark of layer.marks) {
    const shape = shapes[mark.family];
    const base = `${IMPACT_FIELD_PREFIX}mark-${mark.id}`;
    const ground = markGroundField(mark);
    if (ground !== null)
      addGround(
        viewer,
        `mark-${mark.id}-ground`,
        ground,
        shape,
        anchor,
        // An area can reach the antipode: its hatch as fine as a tile holds.
        mark.state === 'notModelled' ? 4_096 : undefined
      );
    if (mark.state === 'modelLimit') {
      const positions = ringOutlinePositions(levelGeometry(anchor, shape, mark.fromM));
      if (positions.length >= 3)
        viewer.entities.add({
          id: `${base}-line`,
          polyline: { positions, width: 4, material: LIMIT_MATERIAL, clampToGround: true },
        });
    }
    const at = isolinePointAtBearing(anchor, shape, markLabelRadius(mark), mark.labelBearingDeg);
    if (labels)
      viewer.entities.add({
        id: `${base}-label`,
        position: Cartesian3.fromDegrees(at.lonDeg, at.latDeg),
        label: {
          text: mark.label,
          font: STATE_LABEL_FONT,
          fillColor: STATE_LABEL_COLOR,
          outlineColor: LABEL_OUTLINE,
          outlineWidth: 3,
          style: LabelStyle.FILL_AND_OUTLINE,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          // Rule 1056 (b): the fixed words out of the domain on a dark ground,
          // set below the point, clear of the rings' values and the coast's
          // names at any zoom.
          ...(mark.id === 'out-of-domain' && {
            showBackground: true,
            backgroundColor: LABEL_OUTLINE.withAlpha(0.82),
            backgroundPadding: new Cartesian2(8, 5),
            pixelOffset: new Cartesian2(0, 78),
          }),
        },
      });
    const info: IsolineHoverInfo = {
      type: 'isoline',
      title: mark.label.replace(/\s*\n\s*/g, ' '),
      meta: mark.card.extent,
      description: mark.description,
      source: mark.card.source,
      color: '#E4E4E4',
    };
    for (const suffix of ['-line', '-label']) hover.set(`${base}${suffix}`, info);
  }

  // The crater, where there is one: the hole itself, on every layer.
  const craterRim = result.damage.craterRim as number;
  if (craterRim > 0) {
    const g = levelGeometry(anchor, shapes.crater, craterRim);
    viewer.entities.add({
      id: `${IMPACT_FIELD_PREFIX}crater`,
      position: Cartesian3.fromDegrees(g.centerLonDeg, g.centerLatDeg),
      ellipse: {
        semiMajorAxis: Math.max(g.semiMajorM, g.semiMinorM),
        semiMinorAxis: Math.min(g.semiMajorM, g.semiMinorM),
        rotation: g.rotationRad,
        material: CRATER_FILL,
        heightReference: HeightReference.CLAMP_TO_GROUND,
      },
    });
    viewer.entities.add({
      id: `${IMPACT_FIELD_PREFIX}crater-rim`,
      polyline: {
        positions: ringOutlinePositions(g),
        width: 1.4,
        material: CRATER_RIM,
        clampToGround: true,
      },
    });
    if (labels)
      viewer.entities.add({
        id: `${IMPACT_FIELD_PREFIX}crater-label`,
        position: Cartesian3.fromDegrees(g.centerLonDeg, g.centerLatDeg),
        label: {
          text: craterLabel,
          font: '600 12px Inter, system-ui, sans-serif',
          fillColor: Color.WHITE.withAlpha(0.95),
          outlineColor: LABEL_OUTLINE,
          outlineWidth: 3,
          style: LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cartesian2(0, 18),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
  }

  for (const line of layer.isolines) {
    const shape = shapes[line.family];
    const g = levelGeometry(anchor, shape, line.radiusM);
    const positions = ringOutlinePositions(g);
    if (positions.length < 3) continue;
    const base = `${IMPACT_FIELD_PREFIX}isoline-${line.id}`;
    // Rule 1031 (a): thresholds pressed against a limit of the model are no
    // isoline of damage: the limit's own line stands there, and they are
    // written as one callout on it.
    const atLimit = line.state === 'modelLimit';
    if (!atLimit)
      viewer.entities.add({
        id: `${base}-line`,
        polyline: { positions, width: 3, material: ISOLINE_MATERIAL, clampToGround: true },
      });
    const at = isolinePointAtBearing(anchor, shape, line.radiusM, line.labelBearingDeg);
    if (labels)
      viewer.entities.add({
        id: `${base}-label`,
        position: Cartesian3.fromDegrees(at.lonDeg, at.latDeg),
        label: {
          text: atLimit ? (line.atLimit ?? line.label) : line.label,
          font: atLimit ? STATE_LABEL_FONT : 'bold 13px "JetBrains Mono", monospace',
          fillColor: atLimit ? STATE_LABEL_COLOR : Color.WHITE.withAlpha(0.95),
          outlineColor: LABEL_OUTLINE,
          outlineWidth: 3,
          style: LabelStyle.FILL_AND_OUTLINE,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    const info: IsolineHoverInfo = {
      type: 'isoline',
      title: line.title,
      meta: `${line.label} · ${formatRange(line.radiusM, language)}`,
      description: line.description,
      source: line.source,
      color: '#F4F1EA',
    };
    for (const suffix of ['-line', '-label']) hover.set(`${base}${suffix}`, info);
  }
  viewer.scene.requestRender();
  return hover;
}

/** A field painted on the ground as one or two textured rectangles. */
function addGround(
  viewer: Viewer,
  name: string,
  field: GroundField,
  shape: FamilyShape,
  anchor: GeoPoint,
  texelsAcross?: number
): void {
  const tiles = rasterizeGround(field, shape, anchor, texelsAcross);
  tiles.forEach((tile, i) => {
    const canvas = document.createElement('canvas');
    canvas.width = tile.width;
    canvas.height = tile.height;
    const ctx = canvas.getContext('2d');
    if (ctx === null) return;
    ctx.putImageData(new ImageData(tile.data, tile.width, tile.height), 0, 0);
    viewer.entities.add({
      id: `${IMPACT_FIELD_PREFIX}${name}-${i.toString()}`,
      rectangle: {
        coordinates: Rectangle.fromDegrees(tile.west, tile.south, tile.east, tile.north),
        material: new ImageMaterialProperty({ image: canvas, transparent: true }),
        heightReference: HeightReference.CLAMP_TO_GROUND,
      },
    });
  });
}

/** Wait until the imagery under the camera has loaded and every entity has
 *  its geometry, or `timeoutMs` has passed, rendering as it goes. */
export function settleScene(viewer: Viewer, timeoutMs = 6_000): Promise<void> {
  const start = performance.now();
  let frames = 0;
  return new Promise((resolve) => {
    const tick = (): void => {
      if (viewer.isDestroyed()) {
        resolve();
        return;
      }
      viewer.scene.requestRender();
      frames += 1;
      const ready = viewer.scene.globe.tilesLoaded && viewer.dataSourceDisplay.ready;
      if ((ready && frames > 4) || performance.now() - start > timeoutMs) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

/** The scene rendered now, the square at its centre, `side` pixels a side:
 *  read in the same task as the render, while the drawing buffer holds it. */
export function grabSquare(viewer: Viewer, side: number): string | null {
  viewer.render();
  const source = viewer.canvas;
  const s = Math.min(source.width, source.height);
  const out = document.createElement('canvas');
  out.width = side;
  out.height = side;
  const ctx = out.getContext('2d');
  if (ctx === null || s === 0) return null;
  ctx.drawImage(source, (source.width - s) / 2, (source.height - s) / 2, s, s, 0, 0, side, side);
  return out.toDataURL('image/jpeg', 0.85);
}
