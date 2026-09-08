import type { Meters } from '../../units.js';
import { m } from '../../units.js';

/**
 * Impact-tsunami far-field model of Wünnemann, Collins & Weiss (2010).
 *
 * Ward & Asphaug (2000) propagate the water-column cavity with linear
 * dispersive theory and obtain a 1/r envelope for the peak amplitude.
 * Hydrocode work in the following decade (Gisler et al. 2004,
 * Wünnemann et al. 2007) found that an oceanic impact actually
 * radiates two different waves whose decay depends on how deep the
 * water is compared with the impactor:
 *
 *   - the **rim wave**, thrown outward by the uplifted cavity rim and
 *     the ejecta curtain — a shallow-water wave that dominates when
 *     the impactor is comparable to (or larger than) the water depth;
 *   - the **collapse wave**, produced when the cavity refills — a
 *     short, steep deep-water wave that breaks near the source and
 *     therefore attenuates much faster (r^−2.7 … r^−3.3 in the
 *     Wünnemann 2007 runs).
 *
 * Reviewing every study available, Wünnemann et al. 2010 §5.3
 * condense the state of the art into an upper and a lower bound on
 * the wave height at distance r in water of constant depth h
 * (their equations 7–10; the same pair is what the Earth Impact
 * Effects Program reports as "tsunami wave amplitude between … and
 * …"):
 *
 *     A_up(r)  = min(0.28 R_w, h) · (R_w / r)                       (7)
 *     A_low(r) = min{ A_r(r), A_c(r) }                               (8)
 *     A_r(r)   = min(0.14 R_w, h) · (R_w / r)^q_r                    (9a)
 *     A_c(r)   = 0.06 · min(R_w / 3, h) · (5 R_w / r)^q_c            (9b)
 *     q_r      = min(1.2, 0.5 + 2 · e^(−1.75 L/h))                   (10a)
 *     q_c      = 3 · e^(−0.8 L/h)                                    (10b)
 *
 * with R_w the water-cavity radius from a crater-scaling law, L the
 * impactor diameter and h the water depth at the impact site.
 * Equation 9b describes the collapse wave, which "is not generated
 * in shallow water impacts"; the paper's stated validity range
 * (h/L < 2) is a typo for the deep-water side — the exponent q_c it
 * quotes (2.7–3.3) is only reached for small L/h, i.e. deep water —
 * so this module includes the collapse-wave branch for h/L ≥ 2 and
 * documents the choice here.
 *
 * What the simulator uses:
 *
 *   - **Best estimate = the rim wave (9a).** In the shallow-water
 *     limit q_r → 0.5 (pure cylindrical spreading, the classical
 *     tsunami case), in deep water q_r → 1.2, slightly steeper than
 *     Ward & Asphaug's 1/r. The rim wave is the shallow-water-type
 *     wave that survives into the far field, the paper calls its
 *     0.14 R_w source height "the more conservative" choice, and the
 *     exponent is the one that goes into the bathymetric
 *     propagation on the globe (`tsunami/amplitudeField.ts`).
 *   - **Bounds (7) and (8)** are reported alongside so the UI can show
 *     the published envelope instead of a single false-precision
 *     number. Note that for shallow impacts the two bounds cross at
 *     r = 4 R_w (the rim wave decays as r^−0.5, the upper bound as
 *     r^−1); {@link wunnemannFarField} therefore orders them.
 *
 * Reference:
 *   Wünnemann, K., Collins, G. S., & Weiss, R. (2010). "Impact of a
 *   cosmic body into Earth's ocean and the generation of a large
 *   tsunami wave: insight from numerical modeling." Reviews of
 *   Geophysics 48, RG4006. DOI: 10.1029/2009RG000308. §5.3, eqs. 7–10.
 *   Wünnemann, K., Weiss, R., & Hofmann, K. (2007). Meteoritics &
 *   Planetary Science 42(11), 1893–1903 — the hydrocode runs behind
 *   the attenuation exponents.
 */

/** Rim-wave height at the cavity rim as a fraction of R_w — the
 *  "more conservative" transient-crater rim height that assumes
 *  volume conservation (Collins et al. 2005). Equation 9a. */
export const WUNNEMANN_RIM_WAVE_FRACTION = 0.14;
/** Upper-bound wave height at the cavity rim as a fraction of R_w.
 *  Equation 7. */
export const WUNNEMANN_UPPER_BOUND_FRACTION = 0.28;
/** Depth-to-impactor ratio h/L from which a collapse wave forms.
 *  Below it the impactor reaches the sea floor before the cavity can
 *  refill coherently and only the rim wave is radiated. */
export const WUNNEMANN_DEEP_WATER_RATIO = 2;
/** Radial distance (in cavity radii) inside which the collapse-wave
 *  fit is undefined — closer in, the wave is still breaking. */
const COLLAPSE_WAVE_REFERENCE_RADII = 5;

export interface WunnemannRegimeInput {
  /** Impactor diameter L (m). */
  impactorDiameter: Meters;
  /** Water depth h at the impact site (m). */
  waterDepth: Meters;
}

export interface WunnemannAttenuation {
  /** h / L — the ratio that selects the wave regime. */
  depthToImpactorRatio: number;
  /** q_r (eq. 10a): 0.5 in the shallow-water limit, 1.2 in deep water. */
  rimWaveExponent: number;
  /** q_c (eq. 10b): up to 3 in deep water. */
  collapseWaveExponent: number;
  /** True when h/L ≥ {@link WUNNEMANN_DEEP_WATER_RATIO}. */
  collapseWaveForms: boolean;
}

/**
 * Attenuation exponents and regime for an impactor of diameter L into
 * water of depth h (equations 10a / 10b). Degenerate inputs (no
 * water, no impactor) fall back to the shallow-water limit q_r = 0.5.
 */
export function wunnemannAttenuation(input: WunnemannRegimeInput): WunnemannAttenuation {
  const L = input.impactorDiameter as number;
  const h = input.waterDepth as number;
  if (!Number.isFinite(L) || !Number.isFinite(h) || L <= 0 || h <= 0) {
    return {
      depthToImpactorRatio: 0,
      rimWaveExponent: 0.5,
      collapseWaveExponent: 0,
      collapseWaveForms: false,
    };
  }
  const LoverH = L / h;
  const rimWaveExponent = Math.min(1.2, 0.5 + 2 * Math.exp(-1.75 * LoverH));
  const collapseWaveExponent = 3 * Math.exp(-0.8 * LoverH);
  const depthToImpactorRatio = h / L;
  return {
    depthToImpactorRatio,
    rimWaveExponent,
    collapseWaveExponent,
    collapseWaveForms: depthToImpactorRatio >= WUNNEMANN_DEEP_WATER_RATIO,
  };
}

/**
 * Rim-wave height at the cavity rim, min(0.14 R_w, h): the wave can be
 * no taller than the water column it is made of. This is the source
 * amplitude the simulator propagates for impact sources.
 */
export function wunnemannRimWaveSourceAmplitude(cavityRadius: Meters, waterDepth: Meters): Meters {
  const Rw = cavityRadius as number;
  const h = waterDepth as number;
  if (!Number.isFinite(Rw) || Rw <= 0 || !Number.isFinite(h) || h <= 0) return m(0);
  return m(Math.min(WUNNEMANN_RIM_WAVE_FRACTION * Rw, h));
}

export interface WunnemannAmplitudeInput extends WunnemannRegimeInput {
  /** Water-cavity radius R_w (m) — Ward & Asphaug eq. 3 in this
   *  simulator, "the most appropriate crater scaling law" in the
   *  paper's words. */
  cavityRadius: Meters;
  /** Ground-range distance r from the impact point (m). */
  distance: Meters;
}

/** Equation 9a — rim-wave amplitude at distance r. Clamped to the
 *  source height inside the cavity. */
export function wunnemannRimWaveAmplitude(input: WunnemannAmplitudeInput): Meters {
  const Rw = input.cavityRadius as number;
  const r = input.distance as number;
  const A0 = wunnemannRimWaveSourceAmplitude(input.cavityRadius, input.waterDepth) as number;
  if (A0 <= 0) return m(0);
  if (!Number.isFinite(r) || r <= Rw) return m(A0);
  const { rimWaveExponent } = wunnemannAttenuation(input);
  return m(A0 * (Rw / r) ** rimWaveExponent);
}

/** Equation 7 — the upper-bound envelope min(0.28 R_w, h) · R_w / r. */
export function wunnemannUpperBoundAmplitude(input: WunnemannAmplitudeInput): Meters {
  const Rw = input.cavityRadius as number;
  const h = input.waterDepth as number;
  const r = input.distance as number;
  if (!Number.isFinite(Rw) || Rw <= 0 || !Number.isFinite(h) || h <= 0) return m(0);
  const A0 = Math.min(WUNNEMANN_UPPER_BOUND_FRACTION * Rw, h);
  if (!Number.isFinite(r) || r <= Rw) return m(A0);
  return m(A0 * (Rw / r));
}

/**
 * Equation 9b — collapse-wave amplitude at distance r, or null when
 * the water is too shallow for a collapse wave to form. The fit is
 * only defined outside ≈ 5 R_w; closer in it is held at its 5 R_w
 * value rather than extrapolated into the breaking zone.
 */
export function wunnemannCollapseWaveAmplitude(input: WunnemannAmplitudeInput): Meters | null {
  const attenuation = wunnemannAttenuation(input);
  if (!attenuation.collapseWaveForms) return null;
  const Rw = input.cavityRadius as number;
  const h = input.waterDepth as number;
  const r = input.distance as number;
  if (!Number.isFinite(Rw) || Rw <= 0) return null;
  const A0 = 0.06 * Math.min(Rw / 3, h);
  const reference = COLLAPSE_WAVE_REFERENCE_RADII * Rw;
  if (!Number.isFinite(r) || r <= reference) return m(A0);
  return m(A0 * (reference / r) ** attenuation.collapseWaveExponent);
}

export interface WunnemannFarFieldEstimate {
  /** Best estimate — the rim wave, eq. 9a. */
  rimWave: Meters;
  /** Collapse wave, eq. 9b; null for shallow-water impacts. */
  collapseWave: Meters | null;
  /** Published upper bound, eq. 7. */
  eq7: Meters;
  /** Published lower bound, eq. 8. */
  eq8: Meters;
  /** max(eq. 7, eq. 8) — the two bounds cross beyond 4 R_w for
   *  shallow impacts, so the envelope is re-ordered before display. */
  upper: Meters;
  /** min(eq. 7, eq. 8). */
  lower: Meters;
}

/** Full Wünnemann 2010 envelope at one distance. */
export function wunnemannFarField(input: WunnemannAmplitudeInput): WunnemannFarFieldEstimate {
  const rimWave = wunnemannRimWaveAmplitude(input);
  const collapseWave = wunnemannCollapseWaveAmplitude(input);
  const eq7 = wunnemannUpperBoundAmplitude(input);
  const eq8 = collapseWave === null ? rimWave : m(Math.min(rimWave, collapseWave));
  return {
    rimWave,
    collapseWave,
    eq7,
    eq8,
    upper: m(Math.max(eq7, eq8)),
    lower: m(Math.min(eq7, eq8)),
  };
}
