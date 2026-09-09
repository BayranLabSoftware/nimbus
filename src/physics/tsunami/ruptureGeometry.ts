/**
 * A rupture is a line, and until now this model treated it as a dot.
 *
 * Every bearing the wave field asks for was measured from one point —
 * the epicentre — and for a short rupture that is fine, because a
 * short rupture is very nearly a point. For a long one it is wrong in
 * a way that costs the model its worst row. The 2004 Sumatra–Andaman
 * rupture ran thirteen hundred kilometres north, and most of its dead
 * were in Banda Aceh, two hundred and fifty kilometres up that line.
 * Aceh is not off the end of that fault; it is beside the middle of
 * it, square across the strike, where a megathrust radiates hardest.
 * Measured from the epicentre it came out lying almost straight along
 * the strike instead, and the beam handed it the incoherent floor
 * that belongs off a fault's end — 0.46 where the answer is 1.
 *
 * So the bearing is taken from the nearest point of the rupture
 * rather than from its centre. A cell abreast of the fault gets a
 * perpendicular and the full beam; a cell off one end gets the end,
 * and the bearing from there runs along the strike as it should. The
 * two agree wherever the rupture is short compared with the distance,
 * which is every scenario that was right before.
 *
 * The rupture is taken as centred on the source point, because which
 * way a rupture propagated is not something a scenario knows. That is
 * an approximation and it is the honest one: it puts Aceh inside the
 * line for Sumatra, and it costs nothing for an event whose epicentre
 * really is its middle.
 */

const EARTH_RADIUS_M = 6_371_008.8;
const RAD = Math.PI / 180;

/** Initial bearing from one point to another (° from north). */
export function bearingBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p1 = lat1 * RAD;
  const p2 = lat2 * RAD;
  const dl = (lon2 - lon1) * RAD;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return (((Math.atan2(y, x) / RAD) % 360) + 360) % 360;
}

/** Great-circle distance between two points (m). */
export function distanceBetween(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p1 = lat1 * RAD;
  const p2 = lat2 * RAD;
  const dp = (lat2 - lat1) * RAD;
  const dl = (lon2 - lon1) * RAD;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** The point `distanceM` from (lat, lon) along `bearingDeg`; a
 *  negative distance runs the other way along the same line. */
export function destination(
  lat: number,
  lon: number,
  bearingDeg: number,
  distanceM: number
): { latitude: number; longitude: number } {
  const d = Math.abs(distanceM) / EARTH_RADIUS_M;
  if (!(d > 0)) return { latitude: lat, longitude: lon };
  const b = (distanceM < 0 ? bearingDeg + 180 : bearingDeg) * RAD;
  const p1 = lat * RAD;
  const l1 = lon * RAD;
  const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(b));
  const l2 =
    l1 +
    Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
  return { latitude: p2 / RAD, longitude: ((l2 / RAD + 540) % 360) - 180 };
}

export interface RuptureSegment {
  /** Centre of the rupture (°). */
  latitude: number;
  longitude: number;
  /** Strike (° from north). */
  strikeDeg: number;
  /** Length along strike (m). */
  lengthM: number;
}

/**
 * The point of the rupture nearest a place: the source itself when
 * the rupture has no length or no orientation, an interior point when
 * the place is abreast of the fault, and an end when it is past one.
 */
export function nearestPointOnRupture(
  segment: RuptureSegment,
  lat: number,
  lon: number
): { latitude: number; longitude: number } {
  const { latitude, longitude, strikeDeg, lengthM } = segment;
  if (!(lengthM > 0) || !Number.isFinite(strikeDeg)) return { latitude, longitude };
  const bearing = bearingBetween(latitude, longitude, lat, lon);
  const range = distanceBetween(latitude, longitude, lat, lon);
  if (!(range > 0)) return { latitude, longitude };
  // How far along the fault the place sits, projected onto it, and
  // clamped to the fault's own ends.
  const along = range * Math.cos((bearing - strikeDeg) * RAD);
  const half = lengthM / 2;
  const t = Math.max(-half, Math.min(half, along));
  return destination(latitude, longitude, strikeDeg, t);
}

/** The bearing a wave leaves the rupture on to reach a place: from
 *  the nearest point of the fault, not from its centre. */
export function bearingFromRupture(segment: RuptureSegment, lat: number, lon: number): number {
  const p = nearestPointOnRupture(segment, lat, lon);
  return bearingBetween(p.latitude, p.longitude, lat, lon);
}
