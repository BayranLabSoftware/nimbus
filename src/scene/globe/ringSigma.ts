/**
 * Per-ring 1σ scatter expressed as a fractional half-range on the
 * radius. Sourced from the same papers cited in
 * src/physics/uq/conventions.ts and src/physics/confidence.ts —
 * single source-of-truth, just expressed in linear-radius form
 * because the visual band is rendered in metres.
 *
 * Phase 8b of the defensibility plan: render an "upper σ" band ring
 * at R(1+σ) for every entity in this table so the published scatter
 * is visually proportional to the band width. A 1.5 km MMI VII ring
 * with σ=0.25 shows a soft halo extending out to 1.875 km; the same
 * ring at σ=0.7 (e.g. pyroclastic runout) shows a halo nearly twice
 * the inner radius — visible at a glance. Rings with σ < 0.18 do not
 * qualify (the halo would be < 1 mm at typical zoom, not legible).
 *
 * The lower-bound R(1−σ) is implicit in the visualisation: the user
 * reads the inner solid ring as "the wave at least gets here" and
 * the outer halo as "but might extend this far". A symmetrical
 * inner halo would double entity count without adding clarity.
 */
export const RING_RADIUS_SIGMA: Readonly<Record<string, number>> = {
  // Impact damage rings (Collins 2005 ± Glasstone)
  craterRim: 0.1,
  thirdDegreeBurn: 0.3,
  secondDegreeBurn: 0.3,
  // Table 7.40's own footnote: ±50 % in the field, which the inverse square
  // carries onto a radius as ×0.82 to ×1.41.
  massFire: 0.3,
  fireIgnition: 0.3,
  overpressure5psi: 0.18,
  overpressure1psi: 0.18,
  // MMI shaking radii — Worden 2012 GMICE ±0.5 MMI ≈ ±25 % radius.
  mmi7: 0.25,
  mmi8: 0.25,
  mmi9: 0.3,
  // Radiation / EMP
  radiationLD50: 0.25,
  empAffected: 0.4,
  // Volcanic
  pyroclasticRunout: 0.7,
  // A factor-two band, as `uq/conventions.ts` declares for this runout.
  laharRunout: 1.0,
  lateralBlast: 0.5,
  ashfallPlume: 1.0,
  // Ejecta + tsunami cavity
  ejectaBlanket: 0.5,
  tsunamiCavity: 0.3,
};
