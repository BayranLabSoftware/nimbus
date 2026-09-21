import type { Meters } from '../../units.js';
import { m } from '../../units.js';

/**
 * Fault slip regimes supported by {@link surfaceRuptureLength}. Use
 * 'all' when the mechanism is unknown or when the caller wants the
 * aggregated Wells–Coppersmith regression.
 */
export type FaultType = 'strike-slip' | 'reverse' | 'normal' | 'all';

/**
 * Wells & Coppersmith (1994) "log₁₀(SRL) = a + b·M" coefficients
 * (Table 2A, Surface Rupture Length). SRL in km, Mw moment magnitude.
 * The relations become optimistic for Mw > 8 (known saturation); the
 * simulator still applies them to keep headline numbers consistent.
 *
 * Source: Wells & Coppersmith (1994), "New empirical relationships
 * among magnitude, rupture length, rupture width, rupture area, and
 * surface displacement", BSSA 84(4), pp. 974–1002.
 */
export const WELLS_COPPERSMITH_1994_SRL: Record<FaultType, { a: number; b: number }> = {
  'strike-slip': { a: -3.55, b: 0.74 },
  reverse: { a: -2.86, b: 0.63 },
  normal: { a: -2.01, b: 0.5 },
  all: { a: -3.22, b: 0.69 },
};

/**
 * Wells & Coppersmith (1994) "log₁₀(RW) = a + b·M" coefficients
 * (Table 2A, Rupture Width). RW (down-dip rupture width) in km. Used
 * to infer the across-strike extent of the rupture rectangle so the
 * extended-source MMI contour rendering can build a stadium / rounded-
 * rectangle polygon instead of a point-source disk for big events.
 */
export const WELLS_COPPERSMITH_1994_RW: Record<FaultType, { a: number; b: number }> = {
  'strike-slip': { a: -0.76, b: 0.27 },
  reverse: { a: -1.61, b: 0.41 },
  normal: { a: -1.14, b: 0.35 },
  all: { a: -1.01, b: 0.32 },
};

export interface SurfaceRuptureLengthInput {
  /** Moment magnitude Mw. */
  magnitude: number;
  /** Defaults to 'all' (aggregated regression) when omitted. */
  faultType?: FaultType;
}

/**
 * Surface rupture length L (m) from the Wells & Coppersmith (1994)
 * empirical regression against moment magnitude:
 *
 *     log₁₀(SRL_km) = a + b · Mw
 *
 * Input Mw should lie in [4.8, 8.1] for the best-fit regime; outside
 * that range the simulator extrapolates, which Wells–Coppersmith
 * explicitly flag as unreliable but which we still render for the
 * popular-science display envelope.
 *
 * **Uncertainty (published).** Wells & Coppersmith (1994) Table 2A
 * reports σ_log10(SRL) = 0.22–0.34 across fault types (mean ≈ 0.28),
 * i.e. ±factor 1.91 in surface rupture length at 1-σ. The aggregated
 * "all" coefficients carry the largest scatter because they pool
 * tectonically distinct events; per-fault coefficients are tighter.
 * NOTE: the earthquake Monte-Carlo path currently samples only the
 * INPUT Mw (and depth, Vs30), not this regression σ_log10(SRL); the
 * displayed rupture band therefore reflects magnitude uncertainty alone
 * and is a lower bound on the full published scatter.
 */
export function surfaceRuptureLength(input: SurfaceRuptureLengthInput): Meters {
  const { magnitude, faultType = 'all' } = input;
  const { a, b } = WELLS_COPPERSMITH_1994_SRL[faultType];
  const srlKm = 10 ** (a + b * magnitude);
  return m(srlKm * 1_000);
}

/**
 * Megathrust (subduction-interface) rupture-length scaling from
 * Strasser, Arango & Bommer (2010):
 *
 *     log₁₀(L_km) = −2.477 + 0.585 · Mw    (interface events)
 *
 * Wells & Coppersmith over-predicts rupture length at Mw ≥ 8 for
 * subduction interface events because their dataset was
 * continental-crust dominated. Strasser et al. 2010 fit interface and
 * intraslab events separately (their dataset predates Tōhoku 2011),
 * producing saner estimates for megathrusts. Use this helper
 * when the event is explicitly a subduction-zone thrust.
 *
 * **Uncertainty (published).** Strasser et al. (2010) Table 2 reports
 * σ_log10(L) ≈ 0.18 for interface events — tighter than Wells &
 * Coppersmith (σ ≈ 0.28) because the subduction-event population is
 * more homogeneous. ±factor 1.51 in length at 1-σ.
 *
 * Source: Strasser, F. O., Arango, M. C. & Bommer, J. J. (2010).
 * "Scaling of the source dimensions of interface and intraslab
 * subduction-zone earthquakes with moment magnitude." Seismological
 * Research Letters 81 (6): 941–950. DOI: 10.1785/gssrl.81.6.941.
 */
export function megathrustRuptureLength(magnitude: number): Meters {
  if (!Number.isFinite(magnitude) || magnitude <= 0) return m(0);
  const LkmLog = -2.477 + 0.585 * magnitude;
  return m(10 ** LkmLog * 1_000);
}

/**
 * Down-dip rupture width W (m) from Wells & Coppersmith (1994):
 *
 *     log₁₀(RW_km) = a + b · Mw
 *
 * Companion to {@link surfaceRuptureLength}. Returned as a true
 * down-dip distance (NOT the surface projection). For megathrusts
 * with shallow dip the surface projection W·cos(δ) is within ~5 % of
 * W; the renderer uses W directly when laying out the stadium
 * polygon and absorbs the small projection mismatch into the contour
 * caveat list.
 */
export function surfaceRuptureWidth(input: SurfaceRuptureLengthInput): Meters {
  const { magnitude, faultType = 'all' } = input;
  if (!Number.isFinite(magnitude) || magnitude <= 0) return m(0);
  const { a, b } = WELLS_COPPERSMITH_1994_RW[faultType];
  return m(10 ** (a + b * magnitude) * 1_000);
}

/**
 * Megathrust (subduction-interface) down-dip rupture width from
 * Strasser et al. (2010) Table 2:
 *
 *     log₁₀(W_km) = −0.882 + 0.351 · Mw    (interface events)
 *
 * Companion to {@link megathrustRuptureLength}. For Mw 9.1 Tōhoku
 * this returns ≈ 200 km, matching Hayes et al. 2011 finite-fault
 * inversions.
 */
export function megathrustRuptureWidth(magnitude: number): Meters {
  if (!Number.isFinite(magnitude) || magnitude <= 0) return m(0);
  const WkmLog = -0.882 + 0.351 * magnitude;
  return m(10 ** WkmLog * 1_000);
}

/**
 * Rules 613 to 620 — a rupture big enough for its own moment.
 *
 * M₀ = μ·L·W·D ties the moment, the rupture and the slip together, so a
 * rupture that comes back too small for its moment makes the slip
 * impossible rather than making itself bigger. B-087 is what that looks
 * like: Wells & Coppersmith's normal-fault regressions, five magnitude
 * units past their own dataset, returning 807 × 200 km at Mw 9.83 for a
 * moment that then needs 146.2 m of slip out of it.
 *
 * So the area has a floor, M₀ / (μ · D_max), and the scaling relations are
 * used unchanged below it. The rules name these functions; they live here,
 * with the physics, because a physics module has no business importing a
 * validation one.
 */

/** Crustal rigidity, Pa. The same value rules 605 to 612 fixed. */
export const CRUSTAL_RIGIDITY_PA = 3e10;

/**
 * The largest slip this product will let a rupture imply, in metres —
 * twice Tōhoku's measured 50 to 60 m, the largest ever recorded. Rule 614
 * takes it from rules 605 to 612, where it was fixed before any of this
 * was measured; `conservationInvariants.test.ts` holds the two equal.
 */
export const MAX_CREDIBLE_SLIP_M = 100;

/** The smallest rupture area a moment can be carried on, m². */
export function ruptureAreaFloor(seismicMomentNm: number): number {
  if (!Number.isFinite(seismicMomentNm) || seismicMomentNm <= 0) return 0;
  return seismicMomentNm / (CRUSTAL_RIGIDITY_PA * MAX_CREDIBLE_SLIP_M);
}

/**
 * Rule 615: grow a rupture to its own moment's floor, keeping the aspect
 * ratio the scaling relation gave it. Returns the factor L and W are each
 * multiplied by — 1 whenever the rupture is already big enough, which is
 * everything at or below Mw 9.5 on every fault type.
 */
export function ruptureGrowthForMoment(
  lengthM: number,
  widthM: number,
  seismicMomentNm: number
): number {
  const area = lengthM * widthM;
  if (!Number.isFinite(area) || area <= 0) return 1;
  const floor = ruptureAreaFloor(seismicMomentNm);
  return floor > area ? Math.sqrt(floor / area) : 1;
}
