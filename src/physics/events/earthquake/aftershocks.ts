import { mulberry32 } from '../../montecarlo/sampling.js';
import type { Meters, Seconds } from '../../units.js';
import { m, s } from '../../units.js';
import { distanceForPga } from './attenuation.js';
import { pgaFromMercalliIntensity } from './intensity.js';

/**
 * Aftershock sequence generator — Reasenberg-Jones / Båth / Omori-Utsu /
 * Gutenberg-Richter combination, deterministic given a seed.
 *
 * This is a popular-science model: it generates a representative
 * realisation of the post-mainshock seismicity, not a forecast. The
 * numbers and locations should be read as "what a typical sequence of
 * this magnitude looks like" — fault-specific aftershock zones (e.g.
 * Tōhoku 2011's offshore Japan Trench distribution) are reproduced
 * only in their bulk statistics, not in their individual epicentres.
 *
 * Physics layered together:
 *   - **Båth's law** (1965): the largest aftershock is ≈ 1.2 magnitude
 *     units below the mainshock. The catalogue holds the aftershocks
 *     between the completeness cutoff M_c and that ceiling,
 *     M_max = M_main − 1.2, and none when the ceiling is at or below the
 *     cutoff (up to Mw 3.7 with the default cutoff).
 *   - **Gutenberg-Richter** (1954): the per-magnitude exceedance is
 *     log₁₀ N(M ≥ m) = a − b·m. Magnitudes are drawn by inverse-CDF on
 *     the law cut to [M_c, M_max),
 *     m = M_c − log₁₀(1 − U·(1 − 10^(−b·(M_max − M_c)))) / b, with the
 *     b the count below uses, so the catalogue follows the law that
 *     sized it. Until 15 September 2026 magnitudes were drawn above M_c
 *     and drawn again when above the ceiling; with the ceiling at or
 *     under the cutoff no draw could be kept, and an earthquake of
 *     Mw 3.13 to 3.70 never returned (B-027).
 *   - **Omori-Utsu** (1894 / 1961): the rate decays as (t + c)^(−p).
 *     Occurrence times are drawn by inverse-CDF on its integral.
 *   - **Reasenberg & Jones** (1989) give the rate of aftershocks at or
 *     above M on day t as λ(t, M) = 10^(a + b·(M_main − M))·(t + c)^(−p),
 *     with generic California parameters a = −1.67, b = 0.91,
 *     p = 1.08, c = 0.05 d — the values used here for all four, so the
 *     count, the magnitudes and the times come from one fitted model.
 *     The count over T days is that rate integrated,
 *     10^(a + b·(M_main − M_c))·∫₀ᵀ (t + c)^(−p) dt: about 6.4 times the
 *     amplitude for 30 days. Until 14 September 2026 the amplitude alone
 *     was used as the count, which drew some six times too few. Of those,
 *     the share 1 − 10^(−b·(M_max − M_c)) lies under Båth's ceiling and
 *     is kept: 99.7 % from Mw 6.5 up, half at Mw 4, none at Mw 3.7.
 *
 * Spatial distribution: epicentres scatter uniformly inside a square
 * of side `ruptureLength` centred on the mainshock — a coarse proxy
 * for the rupture-zone Gaussian observed in real catalogues. Sufficient
 * for the on-globe point-cloud render; not a substitute for a real
 * fault-plane projection.
 *
 * References:
 *   Båth, M. (1965). "Lateral inhomogeneities of the upper mantle."
 *     Tectonophysics 2 (6), 483–514.
 *   Gutenberg, B. & Richter, C. F. (1954). "Seismicity of the Earth
 *     and Associated Phenomena" (2nd ed.). Princeton.
 *   Utsu, T. (1961). "A statistical study on the occurrence of
 *     aftershocks." Geophys. Mag. 30, 521–605.
 *   Reasenberg, P. A. & Jones, L. M. (1989). "Earthquake hazard after
 *     a mainshock in California." Science 243 (4895), 1173–1176.
 *     DOI: 10.1126/science.243.4895.1173.
 */

/** Båth-law magnitude gap between mainshock and largest aftershock. */
export const BATH_GAP = 1.2;
/** Reasenberg-Jones a coefficient (generic California, 1989). */
export const RJ_A_COEFF = -1.67;
/** Reasenberg-Jones b coefficient (generic California, 1989). */
export const RJ_B_COEFF = 0.91;
/** Gutenberg-Richter b-value for magnitude sampling: the model's own. */
export const GR_B_VALUE = RJ_B_COEFF;
/** Omori-Utsu p exponent (Reasenberg & Jones generic, 1989). */
export const OMORI_P = 1.08;
/** Omori-Utsu c parameter, days (Reasenberg & Jones generic, 1989). */
export const OMORI_C_DAYS = 0.05;
/** Hard cap on the number of generated events — keeps the renderer
 *  responsive on extreme megathrust scenarios. */
export const MAX_AFTERSHOCKS = 500;

export interface AftershockEvent {
  /** Moment magnitude of the aftershock. */
  magnitude: number;
  /** Time since the mainshock (s). */
  timeAfterMainshock: Seconds;
  /** North offset from the mainshock epicentre (m, +N). */
  northOffsetM: Meters;
  /** East offset from the mainshock epicentre (m, +E). */
  eastOffsetM: Meters;
}

export interface AftershockSequenceInput {
  /** Mainshock moment magnitude. */
  magnitude: number;
  /** Length of the rupture surface (m). Drives the spatial scatter
   *  of generated aftershocks. */
  ruptureLength: Meters;
  /** Length of the post-mainshock observation window (days). Defaults
   *  to 30 — covers the bulk of the Omori decay envelope. */
  durationDays?: number;
  /** Magnitude completeness cutoff. Defaults to max(2.5, M_main − 4)
   *  so even an Mw 9 megathrust generates a tractable number of
   *  events for the renderer. */
  completenessCutoff?: number;
  /** Deterministic seed. Same seed → identical sequence (required by
   *  the URL-shareable simulation contract). */
  seed: string | number;
}

export interface AftershockSequenceResult {
  /** Generated events, sorted by occurrence time. */
  events: AftershockEvent[];
  /** Largest aftershock magnitude actually drawn. */
  maxMagnitude: number;
  /** Total count of events at or above completenessCutoff. */
  totalCount: number;
  /** Båth-law upper bound on aftershock magnitude
   *  (M_main − BATH_GAP). */
  bathCeiling: number;
  /** Echo of the completeness cutoff used. */
  completenessCutoff: number;
  /** Echo of the observation window in days. */
  durationDays: number;
}

/**
 * Generate the aftershock catalogue for a mainshock. Pure deterministic
 * function — same input + seed always produces the same sequence.
 */
export function generateAftershockSequence(
  input: AftershockSequenceInput
): AftershockSequenceResult {
  const Mc = input.completenessCutoff ?? Math.max(2.5, input.magnitude - 4);
  const Mmax = input.magnitude - BATH_GAP;
  const durationDays = input.durationDays ?? 30;
  const bathCeiling = Mmax;

  // The Omori integral over the window, ∫₀ᵀ (t + c)^(−p) dt =
  // ((c + T)^(1−p) − c^(1−p)) / (1 − p) for p ≠ 1. It sizes the count
  // and, normalised, is the inverse CDF the times are drawn from.
  const c = OMORI_C_DAYS;
  const p = OMORI_P;
  const T = durationDays;
  const cExp = Math.pow(c, 1 - p);
  const cTExp = Math.pow(c + T, 1 - p);
  const span = cTExp - cExp;
  const omoriIntegral = span / (1 - p);

  // Reasenberg & Jones 1989: the rate amplitude at M_c, times the days,
  // times the share of Gutenberg-Richter between the cutoff and Båth's
  // ceiling — nothing when the ceiling is at or below the cutoff.
  const log10Amplitude = RJ_A_COEFF + RJ_B_COEFF * (input.magnitude - Mc);
  const window = Mmax - Mc;
  const underCeiling = window > 0 ? 1 - Math.pow(10, -GR_B_VALUE * window) : 0;
  const predictedN = Math.pow(10, log10Amplitude) * omoriIntegral * underCeiling;
  const targetCount = Math.min(MAX_AFTERSHOCKS, Math.round(predictedN));

  const rng = mulberry32(input.seed);
  const events: AftershockEvent[] = [];
  // Inverse CDF for occurrence time given uniform U ∈ [0, 1):
  //   t(U) = ((c^(1-p) + U · ((c+T)^(1-p) − c^(1-p)))^(1/(1-p))) − c

  for (let i = 0; i < targetCount; i++) {
    // Magnitude — Gutenberg-Richter inverse CDF on [M_c, M_max): one
    // draw, always kept. The argument of the logarithm stays at or above
    // 10^(−b·(M_max − M_c)), so it is never zero.
    const magnitude = Mc - Math.log10(1 - rng.next() * underCeiling) / GR_B_VALUE;

    // Occurrence time — Omori-Utsu inverse CDF.
    const u = rng.next();
    const tDays = Math.pow(cExp + u * span, 1 / (1 - p)) - c;
    const tSeconds = tDays * 86_400;

    // Spatial — uniform within ±ruptureLength/2 of epicentre.
    const dx = (rng.next() - 0.5) * (input.ruptureLength as number);
    const dy = (rng.next() - 0.5) * (input.ruptureLength as number);

    events.push({
      magnitude,
      timeAfterMainshock: s(Math.max(tSeconds, 0)),
      northOffsetM: m(dy),
      eastOffsetM: m(dx),
    });
  }

  events.sort((a, b) => (a.timeAfterMainshock as number) - (b.timeAfterMainshock as number));

  const maxMagnitude = events.reduce(
    (max, e) => (e.magnitude > max ? e.magnitude : max),
    -Infinity
  );

  return {
    events,
    maxMagnitude: Number.isFinite(maxMagnitude) ? maxMagnitude : Mc,
    totalCount: events.length,
    bathCeiling,
    completenessCutoff: Mc,
    durationDays,
  };
}

/**
 * Felt-intensity contour radii (MMI V / VI / VII) around an aftershock
 * of given moment magnitude. Computed via the same Joyner–Boore +
 * Worden 2012 pipeline as the mainshock, just at lower MMI thresholds —
 * aftershocks are bounded above by `M_main − BATH_GAP` (Båth 1965), so
 * an Mw 8 mainshock's largest aftershock peaks at ≈ Mw 6.8 and
 * routinely fails to reach MMI VIII / IX outside the immediate rupture
 * area. The V / VI / VII band ("light → strong felt shaking") is the
 * useful pedagogical range for an aftershock click-through.
 *
 * Pure function — can be called from the UI on demand without a
 * worker round-trip. Returns {@link m}(0) for any contour the
 * magnitude is too small to sustain at the epicentre, mirroring the
 * convention in `simulateEarthquake`.
 */
export interface AftershockShakingFootprint {
  /** Ground range to the MMI V contour ("widely felt"). */
  mmi5Radius: Meters;
  /** Ground range to the MMI VI contour ("strongly felt"). */
  mmi6Radius: Meters;
  /** Ground range to the MMI VII contour ("strong shaking"). */
  mmi7Radius: Meters;
}

export function aftershockShakingFootprint(magnitude: number): AftershockShakingFootprint {
  return {
    mmi5Radius: distanceForPga(magnitude, pgaFromMercalliIntensity(5)),
    mmi6Radius: distanceForPga(magnitude, pgaFromMercalliIntensity(6)),
    mmi7Radius: distanceForPga(magnitude, pgaFromMercalliIntensity(7)),
  };
}
