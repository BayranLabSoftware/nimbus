/**
 * Which country a point is in, from the city index the globe already
 * ships.
 *
 * The shaking casualty model needs a country, because the PAGER
 * fatality curves differ by three orders of magnitude between
 * building stocks. Countries are polygons and this project ships
 * none: what it ships is four thousand populated places with a code
 * apiece, and the nearest of those is a serviceable answer for a
 * quantity that is about how people build rather than about where a
 * border runs.
 *
 * It is a guess and the model treats it as one. Near a border, well
 * offshore, or in the empty middle of a continent it can pick the
 * wrong side, which is why the uncertainty band around the answer
 * stays the whole world's range of building stocks rather than
 * narrowing to the country's own fit.
 *
 * Great-circle distance on a sphere, no index: four thousand
 * comparisons is nothing next to the population lookups this runs
 * beside.
 */

export interface CountryPoint {
  lat: number;
  lon: number;
  /** ISO 3166-1 alpha-2, or "" where Natural Earth has none. */
  cc: string;
}

const EARTH_RADIUS_M = 6_371_008.8;
const RAD = Math.PI / 180;

/** Squared chord length between two points on the unit sphere —
 *  monotone in great-circle distance, and cheaper. */
function chord2(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p1 = lat1 * RAD;
  const p2 = lat2 * RAD;
  const dp = (lat2 - lat1) * RAD;
  const dl = (lon2 - lon1) * RAD;
  return Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
}

export interface NearestCountry {
  cc: string;
  /** Great-circle distance to the city that decided it (m). */
  distanceM: number;
}

/**
 * The country of the nearest place with a code, or null when the
 * index is empty or holds no coded place.
 */
export function nearestCountry(
  places: readonly CountryPoint[],
  lat: number,
  lon: number
): NearestCountry | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  let best: CountryPoint | null = null;
  let bestChord = Infinity;
  for (const p of places) {
    if (p.cc.length !== 2) continue;
    const d = chord2(lat, lon, p.lat, p.lon);
    if (d < bestChord) {
      bestChord = d;
      best = p;
    }
  }
  if (best === null) return null;
  return {
    cc: best.cc,
    distanceM: 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(bestChord))),
  };
}
