import { SEAWATER_DENSITY, STANDARD_GRAVITY } from '../../constants.js';
import type { Joules, KilogramPerCubicMeter, Meters } from '../../units.js';
import { m } from '../../units.js';

export interface ImpactCavityInput {
  /** Impactor kinetic energy (J). */
  kineticEnergy: Joules;
  /** Seawater density; defaults to 1 025 kg/m³. */
  waterDensity?: KilogramPerCubicMeter;
  /** Surface gravity; defaults to Earth standard. */
  surfaceGravity?: number;
}

/**
 * Initial cavity radius left in the water column by a deep-water
 * impact:
 *
 *     R_C = (3 · E_k / (2π · ρ_w · g))^(1/4)
 *
 * where E_k is the energy that goes into the water, ρ_w the water
 * density and g the surface gravity. It is Ward & Asphaug's (2000)
 * eq. 12 — the tsunami energy (1/3)·π·ρ_w·g·(D_C·R_C)² of a lipped
 * cavity, eq. 9 — for a cavity as deep as its radius (D_C = R_C) holding
 * half the impact energy. Ward & Asphaug themselves take about 15 %
 * and a diameter 2.5–3 times the depth, which gives a cavity 9–17 %
 * narrower. The formula is within 2 % of the Gault & Sonett law
 * R_w = 121 · E^(1/4) m (E in kt) that Wünnemann et al. (2010, p. 18)
 * quote, and is the R_w their rim wave starts from.
 *
 * Source: Ward & Asphaug (2000), "Asteroid Impact Tsunami:
 * A Probabilistic Hazard Assessment", Icarus 145(1), pp. 64–78,
 * eqs. 9–12. DOI: 10.1006/icar.1999.6336.
 */
export function impactCavityRadius(input: ImpactCavityInput): Meters {
  const E = input.kineticEnergy as number;
  const rhoW = (input.waterDensity ?? SEAWATER_DENSITY) as number;
  const g = input.surfaceGravity ?? STANDARD_GRAVITY;
  return m(((3 * E) / (2 * Math.PI * rhoW * g)) ** 0.25);
}

/**
 * Source amplitude of the Ward & Asphaug reference row — a project
 * calibration, not their relation. Ward & Asphaug (2000) start the
 * wave at the cavity depth, limited by the water depth, min(D_C, h)
 * (their eq. 18). An earlier version took half the cavity radius,
 * which for a Chicxulub-size cavity is tens of kilometres of water;
 * the damped form below caps it instead.
 *
 * Phase-17 audit. The previous fit
 *
 *     η(R_C) = 0.5 / (1 + (R_C / 5 km)²)
 *
 * had a fatal monotonicity bug: A₀(R_C) = R_C · η(R_C) reaches a
 * maximum at R_C = 5 km (≈ 1.25 km source amplitude) and then
 * *decreases* for larger cavities. So a Boltysh-class impact
 * (R_C ≈ 16 km) was predicted to make a bigger source amplitude
 * than a Chicxulub-class one (R_C ≈ 84 km) — physically backwards.
 *
 * Replacement: linear damping at the denominator instead of
 * quadratic.
 *
 *     η(R_C) = 0.5 / (1 + R_C / R_ref)
 *     A₀(R_C) = 0.5 · R_C · R_ref / (R_ref + R_C)
 *
 * dA₀/dR_C = 0.5 · R_ref² / (R_ref + R_C)² > 0 for every R_C > 0,
 * so the source amplitude is now strictly monotonic in cavity
 * radius. A₀ asymptotes to 0.5 · R_ref for very large impacts.
 *
 * R_ref = 3 km is the project's calibration:
 *
 *   R_C =  1 km → η ≈ 0.375 → A₀ ≈ 375 m  (Eltanin-class)
 *   R_C =  3 km → η = 0.250 → A₀ = 750 m
 *   R_C = 11 km → η ≈ 0.107 → A₀ ≈ 1.18 km (Boltysh-on-water)
 *   R_C = 53 km → η ≈ 0.027 → A₀ ≈ 1.42 km (Popigai-on-water)
 *   R_C = 84 km → η ≈ 0.017 → A₀ ≈ 1.45 km (Chicxulub-on-water)
 *   R_C → ∞     → A₀ → 1.5 km                (asymptote)
 */
const WARD_REFERENCE_CAVITY_M = 3_000;

export function impactSourceAmplitude(cavityRadius: Meters): Meters {
  const RC = cavityRadius as number;
  if (!Number.isFinite(RC) || RC <= 0) return m(0);
  // η(R_C) = 0.5 / (1 + R_C / R_ref) — linearly damped coupling
  // produces A₀(R_C) = 0.5·R_C·R_ref/(R_ref+R_C), monotonically
  // increasing and asymptoting to 0.5·R_ref for large cavities.
  return m((0.5 * RC * WARD_REFERENCE_CAVITY_M) / (WARD_REFERENCE_CAVITY_M + RC));
}

export interface ImpactAmplitudeAtDistanceInput {
  /** Ward–Asphaug source amplitude (m). */
  sourceAmplitude: Meters;
  /** Cavity radius that seeded the wave (m). */
  cavityRadius: Meters;
  /** Ground-range distance from the impact point (m). */
  distance: Meters;
}

/**
 * Far-field tsunami amplitude from a Ward–Asphaug impact source, using
 * a 1/r decay:
 *
 *     A(r) = A₀ · R_C / r        (r ≥ R_C)
 *
 * Inside the cavity (r < R_C) we clamp to the source amplitude — the
 * simulator is not interested in the near-field detail there.
 *
 * IMPORTANT — terminology and the spreading laws in this repo.
 * Purely geometric *cylindrical* (radial 2-D) spreading conserves
 * energy flux around a growing ring and gives amplitude ∝ 1/√r — the
 * law the bathymetric pipeline (`tsunami/amplitudeField.ts`) applies
 * to seismic, volcanic and landslide sources. The 1/r used HERE is
 * faster than cylindrical: it is the Ward & Asphaug impact-source
 * envelope, where the extra 1/√r over geometric spreading stands in
 * for the frequency dispersion that makes short-wavelength impact
 * waves decay faster than classical seismic tsunamis (Melosh 2003;
 * Wünnemann 2007 — the "impact tsunamis are over-rated" result). It
 * is kept as the historical Ward & Asphaug reference row, and it
 * simplifies their own decay (eq. 17), which runs from r^−1/2 for a
 * cavity much wider than the water is deep to r^−1.075 for a much
 * narrower one. The
 * simulator's best estimate for impact sources — in the readouts AND
 * in the on-globe field — is the Wünnemann, Collins & Weiss (2010)
 * rim wave (`./wunnemann.ts`), whose exponent spans r^−0.5 (shallow
 * shelf) to r^−1.2 (deep ocean) around this 1/r.
 *
 * Source: Ward & Asphaug (2000), eqs. 17–18 for the decay it
 * simplifies; their Section 4 uses u ≈ D_C² / r for the far field.
 */
export function impactAmplitudeAtDistance(input: ImpactAmplitudeAtDistanceInput): Meters {
  const A0 = input.sourceAmplitude as number;
  const RC = input.cavityRadius as number;
  const r = input.distance as number;
  if (r <= RC) return m(A0);
  return m((A0 * RC) / r);
}
