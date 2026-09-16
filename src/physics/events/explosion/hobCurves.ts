import { HOB_CURVE_PSI, HOB_CURVE_RHO_FT, HOB_CURVE_THETA_DEG } from './hobCurvesData.js';

/**
 * The peak overpressure on the ground for a burst at a height, read off the
 * curves the book draws for it.
 *
 * Glasstone & Dolan (1977), Figure 3.73c: for a 1-kiloton burst, contours of
 * peak overpressure at 1, 2, 4, 6, 8, 10 and 15 psi over the distance from
 * ground zero and the height of burst, "after the blast wave has been reflected
 * from the surface", for a standard sea-level atmosphere and nearly ideal
 * surface conditions (§3.73). Distance and height scale as the cube root of
 * the yield (the caption's scaling law). The curves are traced from the public
 * scan by scripts/benchmark/hob-curves.py into `hobCurvesData.ts`, as each
 * curve's scaled slant range along rays of constant angle from ground zero;
 * rule 169 of validation/hobRules.ts says what the trace was checked against.
 *
 * **Between the curves.** Along a ray from ground zero the angle at which the
 * wave meets the ground is fixed, and the overpressure falls as the scaled
 * slant range grows; an overpressure between two drawn curves is read on each
 * ray in the logarithms of both, the book's own curves on either side.
 *
 * **Below 1 psi**, which the figure does not draw, the range on each ray is the
 * 1 psi curve's, times the ratio the project's surface-burst relation gives
 * between the two overpressures (overpressure.ts). That is this project's
 * closure, and says so; the light-damage ring at 0.5 psi is the only ring that
 * reads it.
 *
 * **What a ring is.** For a burst at a scaled height, the ring is the farthest
 * distance at which the burst's contour for that overpressure crosses the
 * height — as §3.74 reads the figure, a horizontal line at the height of burst.
 * Where a curve folds back (the "knee" of §3.73) a nearer crossing exists as
 * well; the ring is drawn at the farther, within which the overpressure is
 * reached. Above a curve's top the overpressure never reaches the ground, and
 * the ring is zero.
 */

const FT_PER_M = 1 / 0.3048;

/** The scaled slant range (ft per cube-root kiloton) of an overpressure `psi`
 *  along each tabulated ray, or null above the figure's range. `belowOnePsi`
 *  is the ratio of the range at `psi` to the range at 1 psi, which a caller
 *  supplies from its surface-burst relation for pressures under 1 psi. */
function rangesAlongRays(psi: number, belowOnePsi: number): readonly number[] | null {
  const levels = HOB_CURVE_PSI;
  const top = levels[levels.length - 1] ?? 15;
  if (!(psi > 0) || psi > top) return null;
  const first = HOB_CURVE_RHO_FT[0];
  if (first === undefined) return null;
  if (psi < 1) return first.map((r) => r * belowOnePsi);
  let i = 0;
  while (i < levels.length - 1 && (levels[i + 1] ?? top) < psi) i++;
  const a = levels[i] ?? 1;
  const b = levels[Math.min(i + 1, levels.length - 1)] ?? top;
  const rowA = HOB_CURVE_RHO_FT[i] ?? first;
  const rowB = HOB_CURVE_RHO_FT[Math.min(i + 1, levels.length - 1)] ?? rowA;
  if (psi === a || a === b) return rowA;
  const t = Math.log(psi / a) / Math.log(b / a);
  return rowA.map((ra, k) => {
    const rb = rowB[k] ?? ra;
    return Math.exp(Math.log(ra) + t * (Math.log(rb) - Math.log(ra)));
  });
}

/**
 * The scaled ground range (ft per cube-root kiloton) out to which a burst at
 * a scaled height of `scaledHeightFt` (ft per cube-root kiloton) puts at least
 * `psi` on the ground: the farthest crossing of that height by the contour.
 * Zero above the contour's top. NaN above 15 psi, which Figure 3.73c does not
 * reach.
 */
export function glasstoneGroundRangeFt(
  psi: number,
  scaledHeightFt: number,
  belowOnePsi = 1
): number {
  const rho = rangesAlongRays(psi, belowOnePsi);
  if (rho === null || !Number.isFinite(scaledHeightFt)) return Number.NaN;
  const H = Math.max(0, scaledHeightFt);
  let farthest = 0;
  let prevD = Number.NaN;
  let prevH = Number.NaN;
  for (let k = 0; k < HOB_CURVE_THETA_DEG.length; k++) {
    const theta = ((HOB_CURVE_THETA_DEG[k] ?? 0) * Math.PI) / 180;
    const r = rho[k] ?? 0;
    const d = r * Math.cos(theta);
    const h = r * Math.sin(theta);
    if (k > 0) {
      const lo = Math.min(prevH, h);
      const hi = Math.max(prevH, h);
      if (H >= lo && H <= hi) {
        const cross =
          hi === lo ? Math.max(prevD, d) : prevD + ((H - prevH) / (h - prevH)) * (d - prevD);
        if (cross > farthest) farthest = cross;
      }
    }
    prevD = d;
    prevH = h;
  }
  return farthest;
}

/**
 * The ground range (m) out to which a burst of `yieldKilotons` at
 * `heightOfBurstM` puts at least `psi` on the ground, by the cube-root scaling
 * of Figure 3.73c's caption.
 */
export function glasstoneGroundRangeM(
  psi: number,
  yieldKilotons: number,
  heightOfBurstM: number,
  belowOnePsi = 1
): number {
  if (!(yieldKilotons > 0)) return 0;
  const s = Math.cbrt(yieldKilotons);
  const scaled = glasstoneGroundRangeFt(psi, (heightOfBurstM * FT_PER_M) / s, belowOnePsi);
  return Number.isFinite(scaled) ? (scaled * s) / FT_PER_M : Number.NaN;
}
