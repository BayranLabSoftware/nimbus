/**
 * How far a site is from the rupture of an earthquake known only by its
 * hypocentre: rule 51 of validation/pointSourceRules.ts.
 *
 * A ground-motion relation takes the distance to the rupture — Boore et al.
 * 2014 the Joyner–Boore distance R_JB, the interface models the closest
 * distance R_rup — and a scenario below Mw 7.5 is a point. Taking the
 * epicentral distance for R_JB puts every site as far from the rupture as
 * from the epicentre, which only a site on the rupture's own line ever is.
 * Thompson & Worden (2018) average R_JB and R_rup over the ruptures a
 * hypocentre can belong to — their area from the magnitude and its scatter,
 * their dip, their strike and where on them the hypocentre sits — at each
 * epicentral distance. USGS ShakeMap 4.0 to 4.2 drew every map without a
 * finite rupture on those averages.
 *
 *  - Thompson, E. M. & Worden, C. B. (2018). Estimating rupture distances
 *    without a rupture. Bulletin of the Seismological Society of America
 *    108 (1): 371–379. doi:10.1785/0120170174.
 *
 * `thompsonWorden2018Averages` is `single_event_inner_loop` of ps2ff 1.5.9
 * (USGS, public domain; ps2ff/integration_loops.py) with the parameters
 * ShakeMap 4.0.2 passes for an origin with no tectonic region
 * (shakelib/rupture/point_rupture.py at that tag): Wells & Coppersmith 1994's
 * area for all mechanisms, an aspect ratio of 1.7, dips from 10° to 90° in
 * four steps, the hypocentre over the rupture in seven steps each way,
 * nineteen azimuths, five bins of the area's scatter truncated at two
 * sigma, and a seismogenic zone from the surface. It is held to ps2ff in
 * pointSourceDistance.test.ts.
 *
 * The integral costs about half a millisecond a distance, and a toll band
 * draws two hundred scenarios, so rule 51 fixes where it is computed
 * exactly: at magnitudes a tenth apart, depths a kilometre apart and 49
 * epicentral distances from 0.1 to 1 000 km, twelve a decade. Between them
 * the averages are interpolated — linearly in distance, as ShakeMap
 * interpolates its thirteen, and bilinearly in magnitude and depth — which
 * keeps them within 2 % of the integral where the hypocentre or the site is
 * 3 km or more away, and within 5 % nearer.
 */

/** ShakeMap 4.0.2's parameters for an origin with no tectonic region. */
const TW = {
  /** Wells & Coppersmith 1994, all mechanisms: log10 A = a + b·M, σ. */
  areaA: -3.49,
  areaB: 0.91,
  areaSigma: 0.24,
  aspectRatio: 1.7,
  minDipRad: (10.0 * Math.PI) / 180.0,
  maxDipRad: (90.0 * Math.PI) / 180.0,
  dips: 4,
  nxny: 7,
  azimuths: 19,
  epsilons: 5,
  truncation: 2,
  minSeismogenicDepthKm: 0,
} as const;

/** numpy.linspace with its endpoint. */
function linspace(start: number, stop: number, num: number): number[] {
  if (num === 1) return [start];
  const step = (stop - start) / (num - 1);
  const out = Array.from({ length: num }, (_, i) => i * step + start);
  out[num - 1] = stop;
  return out;
}

/** numpy.trapezoid with a uniform spacing. */
function trapezoid(y: readonly number[], dx: number): number {
  let sum = 0;
  for (let i = 1; i < y.length; i++) sum += (dx * ((y[i] ?? 0) + (y[i - 1] ?? 0))) / 2.0;
  return sum;
}

/** The error function by its Taylor series, exact to rounding for the
 *  |x| ≤ √2 the truncation at two sigma asks of it. */
function erf(x: number): number {
  let term = x;
  let sum = x;
  for (let n = 1; n < 100; n++) {
    term *= (-x * x) / n;
    const add = term / (2 * n + 1);
    sum += add;
    if (Math.abs(add) <= 1e-17 * Math.abs(sum)) break;
  }
  return (2 / Math.sqrt(Math.PI)) * sum;
}

const normalCdf = (x: number): number => 0.5 * (1 + erf(x / Math.SQRT2));

/** ps2ff's compute_epsilon: the bins' middles, their normalised weights and
 *  their width. */
function epsilonBins(): { middles: number[]; weights: number[]; width: number } {
  const edges = linspace(-TW.truncation, TW.truncation, TW.epsilons + 1);
  const middles: number[] = [];
  const weights: number[] = [];
  for (let i = 0; i < TW.epsilons; i++) {
    middles.push(0.5 * ((edges[i + 1] ?? 0) + (edges[i] ?? 0)));
    weights.push(normalCdf(edges[i + 1] ?? 0) - normalCdf(edges[i] ?? 0));
  }
  const width = (2 * TW.truncation) / TW.epsilons;
  const norm = trapezoid(weights, width);
  return { middles, weights: weights.map((w) => w / norm), width };
}

const EPSILON = epsilonBins();

const allClose = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-8 + 1e-5 * Math.abs(b);

export interface RuptureDistanceAverages {
  /** Average Joyner–Boore distance (km). */
  rjbKm: number;
  /** Average closest distance to the rupture (km). */
  rrupKm: number;
}

/**
 * Thompson & Worden 2018's average R_JB and R_rup at one epicentral
 * distance, for a hypocentre `depthKm` deep of an earthquake of
 * `magnitude`: ps2ff 1.5.9's single_event_inner_loop with rule 51's
 * parameters.
 */
export function thompsonWorden2018Averages(
  magnitude: number,
  depthKm: number,
  epicentralKm: number
): RuptureDistanceAverages {
  const dips = linspace(TW.minDipRad, TW.maxDipRad, TW.dips);
  const dDip = (dips[1] ?? 0) - (dips[0] ?? 0);
  const dipNorm = 1.0 / (TW.maxDipRad - TW.minDipRad);
  const theta = linspace(0, 2 * Math.PI, TW.azimuths);
  const dTheta = (theta[1] ?? 0) - (theta[0] ?? 0);
  const cosTheta = theta.map(Math.cos);
  const sinTheta = theta.map(Math.sin);
  const oneOver2Pi = 1.0 / 2.0 / Math.PI;
  const ny = TW.nxny;

  const rrupByArea: number[] = [];
  const rjbByArea: number[] = [];
  const rrupByTheta = new Array<number>(TW.azimuths);
  const rjbByTheta = new Array<number>(TW.azimuths);

  for (const eps of EPSILON.middles) {
    const area = 10 ** (TW.areaA + TW.areaB * magnitude + TW.areaSigma * eps);
    const wPrime = Math.sqrt(area / TW.aspectRatio);
    const rrupByDip: number[] = [];
    const rjbByDip: number[] = [];
    for (const dip of dips) {
      let ztor: number;
      let width: number;
      if (!allClose(dip, 0)) {
        const zw = wPrime * Math.sin(dip);
        ztor = Math.max(depthKm - zw, TW.minSeismogenicDepthKm);
        const zbor = depthKm + zw;
        width = (zbor - ztor) / Math.sin(dip);
      } else {
        ztor = depthKm;
        width = wPrime;
      }
      const length = area / width;
      let sw = width * Math.cos(dip);
      let x: number[];
      let dx: number;
      let wRange: number;
      if (allClose(dip, Math.PI / 2.0) || depthKm === 0) {
        sw = 0;
        wRange = 1;
        x = [0];
        dx = 0;
      } else {
        wRange = Math.min(sw, depthKm / Math.tan(dip));
        x = linspace(0, wRange, TW.nxny);
        dx = (x[1] ?? 0) - (x[0] ?? 0);
      }
      const y = linspace(0, length, ny);
      const dy = (y[1] ?? 0) - (y[0] ?? 0);
      const tanDip = Math.tan(dip);
      const cosDip = Math.cos(dip);
      const sinDip = Math.sin(dip);
      const rrupByX: number[] = [];
      const rjbByX: number[] = [];
      for (const xi of x) {
        const rrupByY: number[] = [];
        const rjbByY: number[] = [];
        for (const yj of y) {
          for (let t = 0; t < TW.azimuths; t++) {
            const xj = xi + epicentralKm * (cosTheta[t] ?? 0);
            const yi = yj + epicentralKm * (sinTheta[t] ?? 0);
            let rjb: number;
            let ry: number;
            if (yi > length) {
              ry = yi - length;
              rjb =
                xj < 0
                  ? Math.sqrt(xj * xj + ry * ry)
                  : xj <= sw
                    ? ry
                    : Math.sqrt((xj - sw) * (xj - sw) + ry * ry);
            } else if (yi >= 0) {
              ry = 0;
              rjb = xj < 0 ? Math.abs(xj) : xj <= sw ? 0 : xj - sw;
            } else {
              ry = Math.abs(yi);
              rjb =
                xj < 0
                  ? Math.sqrt(xj * xj + yi * yi)
                  : xj <= sw
                    ? Math.abs(yi)
                    : Math.sqrt((xj - sw) * (xj - sw) + yi * yi);
            }
            let rrup: number;
            if (dip === Math.PI / 2) {
              rrup = Math.sqrt(rjb * rjb + ztor * ztor);
            } else {
              // Kaklamanos et al. 2011, as ps2ff has it.
              const tmp = ztor * tanDip;
              const rx = xj;
              let rrupPrime: number;
              if (rx < tmp) rrupPrime = Math.sqrt(rx * rx + ztor * ztor);
              else if (rx <= tmp + width / cosDip) rrupPrime = rx * sinDip + ztor * cosDip;
              else {
                rrupPrime = Math.sqrt((rx - width * cosDip) ** 2 + (ztor + width * sinDip) ** 2);
              }
              rrup = Math.sqrt(rrupPrime * rrupPrime + ry * ry);
            }
            rrupByTheta[t] = rrup;
            rjbByTheta[t] = rjb;
          }
          rrupByY.push(oneOver2Pi * trapezoid(rrupByTheta, dTheta));
          rjbByY.push(oneOver2Pi * trapezoid(rjbByTheta, dTheta));
        }
        rrupByX.push((1.0 / length) * trapezoid(rrupByY, dy));
        rjbByX.push((1.0 / length) * trapezoid(rjbByY, dy));
      }
      if (x.length === 1) {
        rrupByDip.push(rrupByX[0] ?? 0);
        rjbByDip.push(rjbByX[0] ?? 0);
      } else {
        rrupByDip.push((1.0 / wRange) * trapezoid(rrupByX, dx));
        rjbByDip.push((1.0 / wRange) * trapezoid(rjbByX, dx));
      }
    }
    rrupByArea.push(dipNorm * trapezoid(rrupByDip, dDip));
    rjbByArea.push(dipNorm * trapezoid(rjbByDip, dDip));
  }
  const weighted = (values: readonly number[]): number =>
    trapezoid(
      values.map((v, i) => (EPSILON.weights[i] ?? 0) * v),
      EPSILON.width
    );
  return { rjbKm: weighted(rjbByArea), rrupKm: weighted(rrupByArea) };
}

/** Rule 51's epicentral distances: 0.1 to 1 000 km, twelve a decade. */
export const POINT_SOURCE_DISTANCES_KM: readonly number[] = Array.from(
  { length: 49 },
  (_, i) => 10 ** (-1 + i / 12)
);

/** Rule 51's steps in magnitude and depth (km). */
export const POINT_SOURCE_MAGNITUDE_STEP = 0.1;
export const POINT_SOURCE_DEPTH_STEP_KM = 1;

/** A node's averages at every distance: R_JB, then R_rup. */
const nodes = new Map<string, Float64Array>();

function nodeTable(magnitudeTenths: number, depthKm: number): Float64Array {
  const key = `${magnitudeTenths.toString()}:${depthKm.toString()}`;
  const known = nodes.get(key);
  if (known !== undefined) return known;
  const n = POINT_SOURCE_DISTANCES_KM.length;
  const table = new Float64Array(2 * n);
  const magnitude = magnitudeTenths / 10;
  POINT_SOURCE_DISTANCES_KM.forEach((r, i) => {
    const a = thompsonWorden2018Averages(magnitude, depthKm, r);
    table[i] = a.rjbKm;
    table[n + i] = a.rrupKm;
  });
  nodes.set(key, table);
  return table;
}

/**
 * Rule 51's averages for one scenario: the four nodes about its magnitude
 * and depth, weighted bilinearly, at every distance. A depth above 1 km is
 * read at 1 km.
 */
export interface PointSourceDistances {
  rjbKm: (epicentralKm: number) => number;
  rrupKm: (epicentralKm: number) => number;
  /** The epicentral distance at which the average R_JB reaches `rjbKm`. */
  epicentralForRjbKm: (rjbKm: number) => number;
}

export function pointSourceDistances(magnitude: number, depthKm: number): PointSourceDistances {
  const n = POINT_SOURCE_DISTANCES_KM.length;
  // A value within a billionth of a node is that node: 6.3 / 0.1 is not 63.
  const snap = (v: number): number => (Math.abs(v - Math.round(v)) < 1e-9 ? Math.round(v) : v);
  const mScaled = snap(magnitude / POINT_SOURCE_MAGNITUDE_STEP);
  const m0 = Math.floor(mScaled);
  const fm = mScaled - m0;
  const zScaled = snap(Math.max(depthKm, 1) / POINT_SOURCE_DEPTH_STEP_KM);
  const z0 = Math.floor(zScaled);
  const fz = zScaled - z0;
  const corners: [number, number, number][] = [
    [m0, z0, (1 - fm) * (1 - fz)],
    [m0, z0 + 1, (1 - fm) * fz],
    [m0 + 1, z0, fm * (1 - fz)],
    [m0 + 1, z0 + 1, fm * fz],
  ];
  const rjb = new Float64Array(n);
  const rrup = new Float64Array(n);
  for (const [mTenths, zSteps, weight] of corners) {
    if (weight === 0) continue;
    const table = nodeTable(mTenths, zSteps * POINT_SOURCE_DEPTH_STEP_KM);
    for (let i = 0; i < n; i++) {
      rjb[i] = (rjb[i] ?? 0) + weight * (table[i] ?? 0);
      rrup[i] = (rrup[i] ?? 0) + weight * (table[n + i] ?? 0);
    }
  }
  const first = POINT_SOURCE_DISTANCES_KM[0] ?? 0.1;
  const last = POINT_SOURCE_DISTANCES_KM[n - 1] ?? 1_000;
  const along = (values: Float64Array, r: number, belowFirst: 'proportional' | 'flat'): number => {
    if (r <= first) {
      return belowFirst === 'flat' ? (values[0] ?? 0) : ((values[0] ?? 0) * r) / first;
    }
    if (r >= last) return ((values[n - 1] ?? 0) * r) / last;
    let i = Math.min(n - 1, Math.max(1, Math.ceil(12 * (Math.log10(r) + 1))));
    // log10 can land a hair either side of a node.
    while (i > 1 && r < (POINT_SOURCE_DISTANCES_KM[i - 1] ?? first)) i--;
    while (i < n - 1 && r > (POINT_SOURCE_DISTANCES_KM[i] ?? last)) i++;
    const lo = POINT_SOURCE_DISTANCES_KM[i - 1] ?? first;
    const hi = POINT_SOURCE_DISTANCES_KM[i] ?? last;
    const f = (r - lo) / (hi - lo);
    return (values[i - 1] ?? 0) + f * ((values[i] ?? 0) - (values[i - 1] ?? 0));
  };
  return {
    rjbKm: (r) => along(rjb, r, 'proportional'),
    rrupKm: (r) => along(rrup, r, 'flat'),
    epicentralForRjbKm: (target) => {
      if (!(target > 0)) return 0;
      if (target <= (rjb[0] ?? 0)) return (first * target) / (rjb[0] ?? 1);
      for (let i = 1; i < n; i++) {
        const hi = rjb[i] ?? 0;
        if (target <= hi) {
          const lo = rjb[i - 1] ?? 0;
          const r0 = POINT_SOURCE_DISTANCES_KM[i - 1] ?? first;
          const r1 = POINT_SOURCE_DISTANCES_KM[i] ?? last;
          return r0 + ((target - lo) / (hi - lo)) * (r1 - r0);
        }
      }
      return (last * target) / (rjb[n - 1] ?? last);
    },
  };
}
