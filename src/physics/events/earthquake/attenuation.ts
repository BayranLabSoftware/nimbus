import { STANDARD_GRAVITY } from '../../constants.js';
import type { Meters, MetersPerSecondSquared } from '../../units.js';
import { m, mps2 } from '../../units.js';

/**
 * Joyner–Boore (1981) saturation depth (km), chosen so that the PGA
 * relation stays finite as the closest-to-rupture distance approaches
 * zero. Published as h = 7.3 km in the original paper.
 */
const JOYNER_BOORE_H = 7.3;

export interface PeakGroundAccelerationInput {
  /** Moment magnitude Mw of the event. */
  magnitude: number;
  /** Joyner–Boore distance: closest horizontal distance from the site
   *  to the surface projection of the rupture (m). */
  distance: Meters;
}

/**
 * Peak horizontal ground acceleration at a site of given distance, via
 * the Joyner & Boore (1981) attenuation relation:
 *
 *     log₁₀(A/g) = −1.02 + 0.249·Mw − log₁₀(D) − 0.00255·D
 *     D = √(R² + h²),  h = 7.3 km
 *
 * R is the Joyner–Boore distance in km, A the peak horizontal
 * acceleration in g. Valid for shallow Western-US crustal events with
 * 5.0 ≤ Mw ≤ 7.7 and R ≤ 370 km; we apply it more broadly for the
 * popular-science display envelope (the headline number is meaningful
 * to one significant figure everywhere).
 *
 * **Uncertainty (published).** Joyner & Boore (1981) Table 4 reports a
 * standard error of σ_log10(A) ≈ 0.26 — i.e. ±factor 1.82 in linear
 * acceleration at a 1-σ confidence level. The popular-science display
 * shows the central value; the earthquake Monte-Carlo path
 * (`montecarlo/earthquakeMonteCarlo.ts`) folds in a representative
 * ground-motion aleatory residual (σ_lnY ≈ 0.50, the NGA-West2 total;
 * {@link EARTHQUAKE_INPUT_SIGMA.groundMotion}) as a multiplicative
 * exp(N(0, σ)) factor on the PGA, on top of the input (Mw, depth, Vs30)
 * spread — so the P10/P90 bands reflect the dominant regression scatter,
 * not just the input contribution. Outside the calibration window
 * (Mw < 5.0, Mw > 7.7, R > 370 km) σ is larger and biases are possible
 * — the V&V suite uses `TOL_SCALING_LAW` (`tolerances.ts`) to absorb
 * the published scatter.
 *
 * Source: Joyner & Boore (1981), "Peak horizontal acceleration and
 * velocity from strong-motion records…", BSSA 71(6), pp. 2011–2038.
 */
export function peakGroundAcceleration(input: PeakGroundAccelerationInput): MetersPerSecondSquared {
  const R_km = (input.distance as number) / 1_000;
  const D = Math.sqrt(R_km * R_km + JOYNER_BOORE_H * JOYNER_BOORE_H);
  const logA = -1.02 + 0.249 * input.magnitude - Math.log10(D) - 0.00255 * D;
  const accelG = 10 ** logA;
  return mps2(accelG * STANDARD_GRAVITY);
}

/**
 * Ground range at which peak horizontal acceleration falls to `target`.
 * Inverts {@link peakGroundAcceleration} by bisection on the Joyner–Boore
 * curve. Because PGA decays monotonically in R, bracketing [0, 10⁷] m
 * (10 000 km — a cap beyond the JB calibration regime) always converges
 * to better than 10 cm precision in 60 iterations.
 *
 * Returns {@link m}(0) when the epicentral PGA — already the saturation
 * value at R = 0 given the 7.3 km h-term — never reaches `target`;
 * callers should interpret that as "this MMI contour doesn't exist for
 * this magnitude" and skip rendering the ring.
 */
export function distanceForPga(magnitude: number, target: MetersPerSecondSquared): Meters {
  const targetAccel = target as number;
  const pgaAtZero = peakGroundAcceleration({ magnitude, distance: m(0) }) as number;
  if (pgaAtZero < targetAccel) return m(0);
  let lo = 0;
  let hi = 1e7;
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi);
    const p = peakGroundAcceleration({ magnitude, distance: m(mid) }) as number;
    if (p > targetAccel) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return m(0.5 * (lo + hi));
}

/**
 * Modern PGA estimator based on Boore, Stewart, Seyhan & Atkinson
 * (2014) "NGA-West2 Equations for Predicting PGA, PGV, and 5 %-Damped
 * PSA for Shallow Crustal Earthquakes", Earthquake Spectra 30 (3):
 * 1057–1085. DOI: 10.1193/070113EQS184M. (Often referred to as BSSA14.)
 *
 * Replaces the 1981-era Joyner–Boore equation with:
 *   1. magnitude-dependent geometric spreading,
 *   2. an explicit near-source saturation term h = 4.5 km (vs. 7.3 km),
 *   3. separate event-scaling constants for strike-slip / normal /
 *      reverse / unspecified faults,
 *   4. a linear Vs30 site term for soft-soil amplification (see
 *      {@link vs30SiteFactor}).
 *
 * Implementation uses the published Table 2 coefficients for PGA at
 * Vs30 = 760 m/s (rock reference). The post-hinge magnitude slope
 * e_6 = −0.1662 is NEGATIVE in the published table: above the hinge
 * magnitude M_h = 5.5 the event term `e + e_6·(M − M_h)` grows more
 * slowly, modelling the well-documented large-magnitude saturation of
 * PGA. (A positive e_6 would make PGA accelerate with magnitude — the
 * opposite of saturation — and roughly trebles the M ≥ 8 PGA.)
 *
 * Valid for shallow crustal events with 3 ≤ Mw ≤ 8.5 and R_JB ≤ 400 km.
 * For megathrust subduction events, callers should prefer the
 * Zhao et al. (2006) / Abrahamson et al. (2016) BC-Hydro families; we
 * still surface the BSSA14 number as the best available upper bound.
 *
 * **Uncertainty (published).** Boore et al. (2014) Table 11 reports
 * total standard deviation σ_lnY ≈ 0.502 for PGA at the rock
 * reference (Vs30 = 760 m/s) — i.e. ±factor 1.65 in PGA at 1-σ. The
 * inter-event component τ ≈ 0.397 and the intra-event component
 * φ ≈ 0.308 combine in quadrature; either alone bounds the
 * site-specific scatter for a known event. Outside the validity
 * window σ_lnY widens by ~30 %.
 */

/** BSSA14 hinge magnitude. */
const BSSA14_MH = 5.5;
/** BSSA14 reference magnitude used in the path term. */
const BSSA14_MREF = 4.5;
/** BSSA14 near-source saturation depth (km). */
const BSSA14_H = 4.5;
/** Reference distance (km) of the published path function. */
const BSSA14_RREF = 1;
/** BSSA14 PGA coefficients (Table 2, Vs30=760, unspecified fault). */
const BSSA14_PGA = {
  e0: 0.4473,
  e1: 0.4856, // strike-slip
  e2: 0.2459, // normal
  e3: 0.4539, // reverse
  e4: 1.431,
  e5: 0.05053,
  e6: -0.1662, // post-hinge magnitude slope (negative → large-M PGA saturation), Boore et al. 2014 Table 2
  c1: -1.134,
  c2: 0.1917,
  c3: -0.008088,
} as const;

export type NGAFaultType = 'strike-slip' | 'normal' | 'reverse' | 'unspecified';

export interface NGAInput extends PeakGroundAccelerationInput {
  faultType?: NGAFaultType;
  /** Vs30 (m/s) — upper 30-m shear-wave velocity. Defaults to 760
   *  (rock reference). Soft soil (Vs30 ≈ 300) amplifies PGA ~1.5×. */
  vs30?: number;
}

/**
 * Ground range at which the NGA-West2 median PGA falls to `target`.
 *
 * The same bisection as {@link distanceForPga}, on the modern law.
 * The MMI contours are drawn with this so that the ground a scenario
 * names, and the fault type it has, reach the rings — Joyner–Boore
 * 1981 takes a magnitude and nothing else, and dropped both.
 *
 * Returns {@link m}(0) when even the saturated near-source value never
 * reaches `target`: that intensity does not occur for this event,
 * which is a thing the 1981 law could not say and needed to.
 */
export function distanceForPgaNGAWest2(
  input: Omit<NGAInput, 'distance'>,
  target: MetersPerSecondSquared
): Meters {
  const targetAccel = target as number;
  const at = (rangeM: number): number =>
    peakGroundAccelerationNGAWest2({ ...input, distance: m(rangeM) });
  if (at(0) < targetAccel) return m(0);
  let lo = 0;
  let hi = 1e7;
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi);
    if (at(mid) > targetAccel) lo = mid;
    else hi = mid;
  }
  return m(0.5 * (lo + hi));
}

/**
 * Site coefficients for PGA, Boore et al. (2014) Table 3 — the
 * published values, taken from the model's own coefficient table.
 */
const BSSA14_SITE = {
  /** Slope of the linear term in ln(Vs30 / V_ref). */
  c: -0.6,
  /** Above this Vs30 the linear term stops steepening (m/s). */
  vc: 1500,
  /** Reference site velocity (m/s). */
  vref: 760,
  f1: 0,
  f3: 0.1,
  f4: -0.15,
  f5: -0.00701,
} as const;

/**
 * Site-response amplification against the Boore 2014 rock reference,
 * as published: a linear term in ln(Vs30) plus a non-linear one that
 * depends on how hard the rock underneath is already shaking.
 *
 *     F_lin = c · ln(min(Vs30, Vc) / V_ref)
 *     F_nl  = f₁ + f₂ · ln((PGA_r + f₃) / f₃)
 *     f₂    = f₄ · [exp(f₅·(min(Vs30, 760) − 360)) − exp(f₅·400)]
 *
 * with PGA_r the median acceleration this event would produce on the
 * reference rock. The non-linear half is the physics that a power law
 * cannot carry: soft ground amplifies a gentle wave and *saturates*
 * under a violent one, because the soil stops behaving elastically.
 * At Vs30 = 300 the published term amplifies 1.71× under weak shaking
 * and 1.18× at half a g, where the surrogate this replaces —
 * `(Vs30/760)^(−0.4)`, and the code said so — gave a flat 1.45×
 * whatever the ground was doing.
 *
 * Zero at the reference velocity by construction, so a scenario that
 * names no site is unaffected.
 */
export function vs30SiteFactor(vs30: number, referencePgaG = 0): number {
  if (!Number.isFinite(vs30) || vs30 <= 0) return 1;
  const { c, vc, vref, f1, f3, f4, f5 } = BSSA14_SITE;
  const fLin = c * Math.log(Math.min(vs30, vc) / vref);
  const f2 = f4 * (Math.exp(f5 * (Math.min(vs30, 760) - 360)) - Math.exp(f5 * (760 - 360)));
  const pgaR = Math.max(0, Number.isFinite(referencePgaG) ? referencePgaG : 0);
  const fNl = f1 + f2 * Math.log((pgaR + f3) / f3);
  return Math.exp(fLin + fNl);
}

export function peakGroundAccelerationNGAWest2(input: NGAInput): MetersPerSecondSquared {
  const M = input.magnitude;
  const R = (input.distance as number) / 1_000; // km
  const mech = input.faultType ?? 'unspecified';
  const { e0, e1, e2, e3, e4, e5, e6, c1, c2, c3 } = BSSA14_PGA;

  // Fault-type coefficient
  const e = mech === 'strike-slip' ? e1 : mech === 'normal' ? e2 : mech === 'reverse' ? e3 : e0;

  // Event function
  const dM = M - BSSA14_MH;
  const F_E = M <= BSSA14_MH ? e + e4 * dM + e5 * dM * dM : e + e6 * dM;

  // Path function (R_JB with near-source saturation). R_ref is 1 km
  // in the published form, which the logarithm swallows and the
  // linear term does not — worth the 0.8 % rather than not.
  const Rprime = Math.sqrt(R * R + BSSA14_H * BSSA14_H);
  const F_P =
    (c1 + c2 * (M - BSSA14_MREF)) * Math.log(Rprime / BSSA14_RREF) + c3 * (Rprime - BSSA14_RREF);

  // Site function: the non-linear half needs the acceleration this
  // event would produce on reference rock, so the rock value is
  // computed first and then amplified.
  const lnRockG = F_E + F_P;
  const F_S = Math.log(vs30SiteFactor(input.vs30 ?? BSSA14_SITE.vref, Math.exp(lnRockG)));

  const lnPGAg = lnRockG + F_S;
  return mps2(Math.exp(lnPGAg) * STANDARD_GRAVITY);
}
