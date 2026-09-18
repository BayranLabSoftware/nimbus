/**
 * How much ground a flow covers, and how wide its swath is.
 *
 * Griswold, J. P. & Iverson, R. M. (2008), "Mobility Statistics and Automated
 * Hazard Mapping for Debris Flows and Rock Avalanches", USGS Scientific
 * Investigations Report 2007-5276, Table 6: for a fixed 2/3 slope, the maximum
 * inundated cross-sectional area A and the total inundated planimetric area B
 * of a flow of volume V are
 *
 *     A = α₁ · V^(2/3)        B = α₂ · V^(2/3)
 *
 * with (α₁, α₂) = (0.05, 200) for lahars — that row is Iverson, Schilling &
 * Vallance (1998)'s — (0.1, 20) for non-volcanic debris flows and (0.2, 20)
 * for rock avalanches. A lahar of a given volume covers ten times the ground
 * a rock avalanche of the same volume does.
 *
 * This is the quantity the field publishes. It does not publish a runout
 * length: LaharZ does not predict a distance, it fills a valley from a DEM
 * until the accumulated area reaches B. Nimbus's own `laharRunout` is a recast
 * of the same relation read as a length and calibrated on Mount St Helens
 * 1980; the two together give the swath width, which is the width of ground a
 * flow of that reach and that area implies.
 *
 * Rules 202 to 207 of validation/inundationAreaRules.ts, which re-derived
 * these coefficients from the report's own Appendix A — 207 events — as the
 * check on the transcription. The rules name these functions; they live here,
 * with the physics, because a physics module has no business importing a
 * validation one.
 */

/** The flow types the field distinguishes: volcanic mud, the same physics
 *  without a volcano, and dry rock. */
export type FlowType = 'lahar' | 'debrisFlow' | 'rockAvalanche';

/** Griswold & Iverson (2008), Table 6. */
export const INUNDATION_COEFFICIENTS: Readonly<
  Record<FlowType, { crossSection: number; planimetric: number }>
> = {
  lahar: { crossSection: 0.05, planimetric: 200 },
  debrisFlow: { crossSection: 0.1, planimetric: 20 },
  rockAvalanche: { crossSection: 0.2, planimetric: 20 },
};

/** The ground a flow of this volume covers (m², V in m³). */
export function inundatedPlanimetricArea(volumeM3: number, flow: FlowType): number {
  if (!Number.isFinite(volumeM3) || volumeM3 <= 0) return 0;
  return INUNDATION_COEFFICIENTS[flow].planimetric * Math.cbrt(volumeM3 * volumeM3);
}

/** The largest cross-section it fills on the way (m²). */
export function inundatedCrossSection(volumeM3: number, flow: FlowType): number {
  if (!Number.isFinite(volumeM3) || volumeM3 <= 0) return 0;
  return INUNDATION_COEFFICIENTS[flow].crossSection * Math.cbrt(volumeM3 * volumeM3);
}

/** The width of the swath a runout of `lengthM` implies, given the area the
 *  flow covers. Zero where either is zero: a flow that goes nowhere has no
 *  swath. */
export function swathWidth(volumeM3: number, lengthM: number, flow: FlowType): number {
  if (!Number.isFinite(lengthM) || lengthM <= 0) return 0;
  return inundatedPlanimetricArea(volumeM3, flow) / lengthM;
}
