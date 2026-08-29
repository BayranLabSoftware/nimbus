/**
 * Cesium's EllipseGeometry throws — and with it stops the globe's
 * rendering, permanently — unless semiMajorAxis >= semiMinorAxis at
 * construction time. That invariant is violated BY CONSTRUCTION by
 * physically legitimate footprints: a lateral blast's crosswind width
 * is runout * sin(sector/2) against a downrange semi-axis of half the
 * runout, so any sector wider than 60 degrees breaks it — Mount
 * St Helens' ~180-degree fan by a factor of two. This is why the
 * St Helens and Pelee presets killed the globe.
 *
 * The cure is geometry, not clamping: an ellipse with swapped axes
 * turned a quarter turn is the SAME ellipse. Nothing is distorted.
 */
export interface OrientedEllipse {
  readonly semiMajorAxis: number;
  readonly semiMinorAxis: number;
  readonly rotation: number;
}

/**
 * Axes as the physics states them — `along` downrange, `across` to the
 * side — plus the rotation that puts `along` on its bearing. Returns
 * the equivalent ellipse that satisfies Cesium's invariant.
 */
export function orientedEllipse(along: number, across: number, rotation: number): OrientedEllipse {
  if (along >= across) {
    return { semiMajorAxis: along, semiMinorAxis: across, rotation };
  }
  return { semiMajorAxis: across, semiMinorAxis: along, rotation: rotation + Math.PI / 2 };
}
