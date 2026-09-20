/**
 * Drawing an earthquake the way the field draws one.
 *
 * Until now the globe has drawn a shaken earthquake as three rings: MMI VII,
 * VIII and IX, each a circle or a rupture stadium, each a single closed
 * curve at a published radius. That is what the model publishes and it is
 * honest, but it is not what a reader has seen before. USGS ShakeMap, the
 * EMSC, the JMA and every national agency draw the same quantity as a FIELD:
 * an irregular patch of colour whose edges bend where the ground is soft and
 * where the rupture points, with the contours labelled and a legend beside
 * them.
 *
 * Everything needed for that already exists in this repository and nothing
 * joins it up:
 *
 *   - `physics/events/earthquake/shakingField.ts` evaluates the intensity on
 *     a 257 x 257 grid in the rupture's own frame, reading the ground under
 *     every cell, and `contourRings` walks marching squares over it;
 *   - `scene/heatmap.ts` renders a scalar field to a canvas and draws
 *     contour segments over it, which is how the tsunami veil is drawn;
 *   - `frameToGeographic` turns a frame point into a latitude and longitude.
 *
 * This module is the join: it turns a `ShakingField` into the two things a
 * canvas needs — the discrete colour bands of the fill, and the contour
 * rings in geographic coordinates — and it does no drawing itself, so it can
 * be tested without a globe.
 *
 * WHAT IS A CHOICE HERE, and is not from a standard. The colours. USGS
 * publishes an instrumental-intensity palette and this is NOT it: the three
 * bands the globe already draws (MMI VII orange, VIII red, IX wine) are kept
 * so that a reader who has seen a Nimbus earthquake still recognises one,
 * and the lower bands continue that ramp downwards into cooler hues. Nobody
 * has checked these against the published palette, and the day somebody
 * wants the real one it is a table to swap, not a rewrite.
 */

import {
  contourRings,
  frameToGeographic,
  type ShakingField,
} from '../../physics/events/earthquake/shakingField.js';

/** A band of the fill: everything at or above `minValue`, up to the next. */
export interface IntensityBand {
  /** The Mercalli level the band starts at. */
  minValue: number;
  /** Roman numeral, for the legend and the contour label. */
  label: string;
  /** CSS colour of the fill. */
  css: string;
  /** CSS colour of the contour line that bounds it, which is darker so the
   *  edge reads against its own fill. */
  lineCss: string;
}

/**
 * The bands the globe fills, inside out.
 *
 * Roman numerals because that is how the scale is written everywhere a
 * reader will have met it. Below V nothing is drawn: the model publishes no
 * radius there for most scenarios, the field is unreliable that far out, and
 * a continent-wide wash of pale blue would say "we know this" about ground
 * nobody has measured.
 */
export const INTENSITY_BANDS: readonly IntensityBand[] = [
  {
    minValue: 5,
    label: 'V',
    css: 'rgba(125, 211, 252, 0.45)',
    lineCss: 'rgba(56, 132, 189, 0.85)',
  },
  {
    minValue: 6,
    label: 'VI',
    css: 'rgba(163, 230, 53, 0.45)',
    lineCss: 'rgba(101, 143, 33, 0.85)',
  },
  { minValue: 7, label: 'VII', css: 'rgba(251, 146, 60, 0.50)', lineCss: 'rgba(180, 95, 30, 0.9)' },
  { minValue: 8, label: 'VIII', css: 'rgba(220, 38, 38, 0.55)', lineCss: 'rgba(140, 20, 20, 0.9)' },
  { minValue: 9, label: 'IX', css: 'rgba(127, 29, 29, 0.60)', lineCss: 'rgba(70, 12, 12, 0.95)' },
  { minValue: 10, label: 'X', css: 'rgba(69, 10, 10, 0.65)', lineCss: 'rgba(30, 5, 5, 0.95)' },
] as const;

/**
 * What the field reads along the edge of its own box.
 *
 * `contourRings` hands back a ring that runs off the edge as an OPEN ring,
 * and says in as many words that the caller decides what to do with it. A
 * picture that closes such a ring draws a straight line along the side of the
 * box and a right angle at its corner — a boundary the ground does not have,
 * and the most confident-looking thing on the map. So the picture asks this
 * first.
 *
 * `minVs30` is the softest ground the edge touches, which is how far out the
 * box must reach to contain the band: the level is set by the law on the
 * softest ground, not on the average or on rock.
 */
export function edgeReading(field: ShakingField): { maxMmi: number; minVs30: number } {
  const n = field.points;
  let maxMmi = -Infinity;
  let minVs30 = Infinity;
  const look = (index: number): void => {
    const mmi = field.mmi[index];
    const vs30 = field.vs30[index];
    if (mmi !== undefined && mmi > maxMmi) maxMmi = mmi;
    if (vs30 !== undefined && vs30 < minVs30) minVs30 = vs30;
  };
  for (let col = 0; col < n; col += 1) {
    look(col);
    look((n - 1) * n + col);
  }
  for (let row = 1; row < n - 1; row += 1) {
    look(row * n);
    look(row * n + n - 1);
  }
  return { maxMmi, minVs30 };
}

/** One contour, in geographic coordinates, ready to be drawn. */
export interface GeographicContour {
  level: number;
  label: string;
  css: string;
  /** Closed rings; each is a list of points in degrees. */
  rings: { latitude: number; longitude: number }[][];
  /** Where to put the label: the northernmost point of the longest ring,
   *  which is the one a reader's eye lands on first. */
  labelAt: { latitude: number; longitude: number } | null;
}

/**
 * The contours of a field, in degrees, for every band the field reaches.
 *
 * A level the field never reaches yields no ring and is dropped rather than
 * drawn empty — the report's own rule that no band is painted at an
 * intensity its event never reached, applied to the picture.
 *
 * A level that runs off the EDGE of the field is dropped too, for the
 * opposite reason: its ring is open, and closing it would draw the side of
 * the box as though it were the edge of the shaking. Widen the field and the
 * level comes back.
 */
export function shakingContours(
  field: ShakingField,
  bands: readonly IntensityBand[] = INTENSITY_BANDS
): GeographicContour[] {
  const out: GeographicContour[] = [];
  // A level the field does not contain is not drawn: see `edgeReading`.
  const edge = edgeReading(field);
  for (const band of bands) {
    if (band.minValue <= edge.maxMmi) continue;
    const rings = contourRings(field, band.minValue);
    if (rings.length === 0) continue;
    const geographic = rings.map((ring) =>
      ring.map((point) => {
        const here = frameToGeographic(field.rupture, point);
        return { latitude: here.latitude, longitude: here.longitude };
      })
    );
    let labelAt: { latitude: number; longitude: number } | null = null;
    let longest = -1;
    for (const ring of geographic) {
      if (ring.length <= longest) continue;
      longest = ring.length;
      labelAt = ring.reduce<{ latitude: number; longitude: number } | null>(
        (best, p) => (best === null || p.latitude > best.latitude ? p : best),
        null
      );
    }
    out.push({
      level: band.minValue,
      label: band.label,
      css: band.lineCss,
      rings: geographic,
      labelAt,
    });
  }
  return out;
}

/**
 * The bounding box the fill canvas covers, in degrees.
 *
 * The field is square in the rupture's frame, so its geographic box is the
 * box of its four corners — which is not square, and is wider in longitude
 * the further from the equator it sits.
 */
export function fieldBounds(field: ShakingField): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} {
  const half = field.halfSpanM;
  let minLat = 90;
  let maxLat = -90;
  let minLon = 180;
  let maxLon = -180;
  for (const [x, y] of [
    [-half, -half],
    [-half, half],
    [half, -half],
    [half, half],
  ] as const) {
    const p = frameToGeographic(field.rupture, { x, y });
    minLat = Math.min(minLat, p.latitude);
    maxLat = Math.max(maxLat, p.latitude);
    minLon = Math.min(minLon, p.longitude);
    maxLon = Math.max(maxLon, p.longitude);
  }
  return { minLat, maxLat, minLon, maxLon };
}

/**
 * The band a value falls in, or null below the lowest.
 *
 * `renderScalarFieldHeatmap` wants discrete bands to colour a field by; this
 * is the same decision in one place, so the fill and the contours cannot
 * disagree about where VII begins.
 */
export function bandFor(
  value: number,
  bands: readonly IntensityBand[] = INTENSITY_BANDS
): IntensityBand | null {
  let found: IntensityBand | null = null;
  for (const band of bands) {
    if (value >= band.minValue) found = band;
  }
  return found;
}
