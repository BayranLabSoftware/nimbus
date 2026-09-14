/**
 * Topographic slope → Vs30, the proxy of Wald & Allen (2007) with the
 * active-tectonic table USGS uses today.
 *
 *   Wald, D. J. & Allen, T. I. (2007). "Topographic Slope as a Proxy
 *     for Seismic Site Conditions and Amplification." BSSA 97 (5),
 *     1379–1395. DOI: 10.1785/0120060267.
 *   Allen, T. I. & Wald, D. J. (2009). "On the Use of High-Resolution
 *     Topographic Data as a Proxy for Seismic Site Conditions (VS30)."
 *     BSSA 99 (2A), 935–943. DOI: 10.1785/0120080255.
 *
 * Competent rock tends to stand in steep ground and soft sediment to
 * settle into flat basins, so the gradient of the terrain predicts the
 * shear-wave speed of the top 30 m well enough for a first site term.
 *
 * The bins below are the active-tectonic table of USGS's own
 * implementation, `grad2vs30.c` in the earthquake-global_vs30
 * repository, which follows Allen & Wald (2009); values between the
 * bin edges are interpolated in log slope and log Vs30, as that program
 * does. Below the first edge the site is held at 180 m/s and above the
 * last at 760 m/s: the proxy says soft soil or rock there, not how soft
 * or how hard.
 *
 * Until 14 September 2026 this module carried ten bins that neither
 * paper prints, and any slope past 0.138 came out as 685 m/s — the
 * last bin reached for the logarithm of infinity — where the table
 * says rock.
 *
 * The slope is measured on the terrain tile under the click, about
 * 0.6 km a pixel at zoom 8, which is the scale of the 30 arc-second
 * grids the table was fitted on.
 */

/** Active-tectonic bin edges: slope (m/m) and the Vs30 (m/s) at it. */
const ACTIVE_TECTONIC_EDGES: readonly { slope: number; vs30: number }[] = [
  { slope: 3.0e-4, vs30: 180 },
  { slope: 3.5e-3, vs30: 240 },
  { slope: 0.01, vs30: 300 },
  { slope: 0.018, vs30: 360 },
  { slope: 0.05, vs30: 490 },
  { slope: 0.1, vs30: 620 },
  { slope: 0.14, vs30: 760 },
];

/**
 * Vs30 (m/s) from topographic slope (radians), active-tectonic regime.
 * The slope is converted to a gradient (tan) and read off the bins in
 * log–log space.
 */
export function waldAllen2007Vs30FromSlope(slopeRad: number): number {
  if (!Number.isFinite(slopeRad) || slopeRad < 0) return 760;
  const gradient = Math.tan(slopeRad);
  const first = ACTIVE_TECTONIC_EDGES[0];
  const last = ACTIVE_TECTONIC_EDGES[ACTIVE_TECTONIC_EDGES.length - 1];
  if (first === undefined || last === undefined) return 760;
  if (!(gradient > first.slope)) return first.vs30;
  if (gradient >= last.slope) return last.vs30;
  for (let i = 1; i < ACTIVE_TECTONIC_EDGES.length; i++) {
    const lower = ACTIVE_TECTONIC_EDGES[i - 1];
    const upper = ACTIVE_TECTONIC_EDGES[i];
    if (lower === undefined || upper === undefined) continue;
    if (gradient < upper.slope) {
      const t = Math.log(gradient / lower.slope) / Math.log(upper.slope / lower.slope);
      return Math.exp(Math.log(lower.vs30) + t * Math.log(upper.vs30 / lower.vs30));
    }
  }
  return last.vs30;
}

/** NEHRP site-class bins for Vs30 (FEMA 2015 / NEHRP 2003). */
export type NEHRPClass = 'A' | 'B' | 'C' | 'D' | 'E';

export function nehrpClassFromVs30(vs30: number): NEHRPClass {
  if (!Number.isFinite(vs30) || vs30 <= 0) return 'E';
  if (vs30 >= 1_500) return 'A'; // Hard rock
  if (vs30 >= 760) return 'B'; // Rock
  if (vs30 >= 360) return 'C'; // Very dense soil / soft rock
  if (vs30 >= 180) return 'D'; // Stiff soil
  return 'E'; // Soft clay / saturated alluvium
}
