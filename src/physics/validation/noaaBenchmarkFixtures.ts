/**
 * NOAA tsunami benchmark problem fixtures.
 *
 * The "Synolakis et al. 2008" suite is the standard validation set
 * used by the National Tsunami Hazard Mitigation Program (NTHMP) to
 * accept or reject numerical tsunami codes — every code that wants
 * to be on the operational forecast list (MOST, GeoClaw, COMCOT,
 * Tsunami-HySEA, etc.) is benchmarked against these problems.
 *
 * Why we use them. Pinning Nimbus output against the analytic /
 * laboratory / field reference values turns "the formula looks
 * reasonable" into "the formula matches the same number a NOAA-
 * accepted solver would produce." The pin tolerance for popular-
 * science is ±20% (Synolakis et al. 2008 §6 reports the typical
 * spread of accepted models for the same benchmark).
 *
 * Contents:
 *   - BP1: solitary wave runup on a 1:19.85 simple beach. Pure
 *     analytic test of synolakisRunup against Carrier-Greenspan
 *     theory + Synolakis 1987 lab data.
 *   - Tōhoku 2011 DART buoy: integration test using
 *     tohoku2011DARTReference and the seismic tsunami pipeline.
 *   - Sumatra-Andaman 2004: integration test using simulateEarthquake
 *     and a known DART-distance reference.
 *
 * BP2 (conical island) and BP4 (Hilo Bay) are 2D problems that need
 * a focusing/refraction-aware solver — out of scope for the
 * closed-form Layer 2.
 *
 * References:
 *   Synolakis, C. E. (1987). "The runup of solitary waves." J. Fluid
 *     Mech. 185: 523-545. Table 1 R/H values.
 *   Synolakis, C. E., Bernard, E. N., Titov, V. V., Kanoglu, U. &
 *     Gonzalez, F. I. (2008). "Validation and verification of tsunami
 *     numerical models." Pure Appl. Geophys. 165: 2197-2228.
 *   NOAA Center for Tsunami Research, Benchmark Problem 1:
 *     https://nctr.pmel.noaa.gov/benchmark/Laboratory/
 *   Satake, K., Fujii, Y., Harada, T. & Namegaya, Y. (2013). "Time
 *     and space distribution of coseismic slip of the 2011 Tōhoku
 *     earthquake as inferred from tsunami waveform data." BSSA 103
 *     (2B): 1473-1492.
 */

/** Pin tolerance for analytic / laboratory benchmarks (Synolakis BP1).
 *  ±20 % covers the Synolakis et al. 2008 model-spread envelope on
 *  the same benchmark and is tight enough to catch gross regressions
 *  in the closed-form runup formula. */
export const NOAA_PIN_TOLERANCE = 0.2;

/** Pin tolerance for seismic far-field benchmarks (DART buoys, tide
 *  gauges). ±25 % reflects the intrinsic measurement scatter on a
 *  single-station record: filtering choice, tidal de-trending, and
 *  bottom-pressure-to-amplitude inversion uncertainty each carry
 *  ±10 %. The Bernard et al. 2006 Cocos record gives a 0.3-0.6 m
 *  envelope around the 0.4 m central value used here, so ±25 % is
 *  the honest pin width — tighter would over-fit the central pick. */
export const NOAA_SEISMIC_PIN_TOLERANCE = 0.25;

/**
 * The far-field megathrust residual, declared rather than absorbed.
 *
 * The cylindrical 1D-radial law over-predicts the deep-water
 * amplitude of a megathrust at buoy range: 1.65× at DART 21413 and
 * 1.80× at Cocos Island, both in the same direction and of the same
 * size. Until 9 September 2026 the two rows read as matches, because
 * a fixed exponential exp(−r / 2 500 km) was applied to them under
 * the name of frequency dispersion. It is not dispersion — Kajiura's
 * parameter for a wave 1 400 km long over 4 km of ocean is near zero,
 * and the correct factor at these ranges is 0.999. What that
 * exponential supplied was the strength a real source loses to
 * directivity and to the finite geometry of a rupture, which a
 * radially symmetric model does not have.
 *
 * These bounds pin the residual so it cannot drift unwatched, and
 * they are deliberately not a pass mark. What closes them is the
 * source-wavelength question in the roadmap: whether a megathrust
 * radiates on 2·L or on 2·W decides both the dispersion and the beam,
 * and the two answers differ by a factor of forty in the parameter.
 */
export const MEGATHRUST_FAR_FIELD_RESIDUAL = { low: 1.3, high: 2.2 } as const;

/**
 * What is left at a buoy inside the main lobe, once the beam is
 * applied: the model reads 1.14× the peak recorded at DART 21413,
 * where the isotropic law read 1.65×.
 *
 * This is a match rather than a residual, and the band is wide enough
 * to be one: a far-field tsunami amplitude reproduced to within about
 * fifteen per cent of a buoy record is at the limit of what the
 * inter-model spread of MOST, GeoClaw and COMCOT allows anyone to
 * claim (Synolakis et al. 2008 §6 puts that spread at ±25–50 %).
 */
export const BEAMED_MAIN_LOBE_RESIDUAL = { low: 0.75, high: 1.5 } as const;

/**
 * What is left at a gauge PAST the first null, once the beam is
 * applied: the model reads 0.33× the 40 cm recorded at Cocos Island.
 *
 * A residual, declared, and not a pass mark — the same standing the
 * far-field row above has.
 *
 * It used to read 0.83×, and that was two errors cancelling. This
 * module derived its own down-dip width as L / 2.5, which for a
 * rupture overridden to Sumatra's observed 1 300 km gave 520 km —
 * wider than the whole forearc — and a mean slip of 2.8 m against
 * inversions of five to ten. The spreading law then gave that too
 * small a source back with too generous a decay. With one width
 * (Strasser's 200 km, slip 7.0 m) and one spreading law, the
 * compensation is gone and what is left is visible: even with no beam
 * at all the model would read 0.71× at this range, so a third of the
 * shortfall is the radiation pattern and two thirds is the source.
 *
 * The main-lobe row moved the other way in the same change — DART
 * 21413 from 4.5× the record to 0.90× — which is the trade this
 * declares: the measurement where the pattern is a prediction is now
 * right, and the one past its null is short by three.
 */
export const BEAMED_PAST_NULL_RESIDUAL = { low: 0.2, high: 0.6 } as const;

export interface NoaaBenchmarkSynolakisCase {
  /** Incident wave height H over depth d (dimensionless). */
  HOverD: number;
  /** Beach slope angle (rad). */
  beachSlopeRad: number;
  /** Offshore depth d (m, lab-scale). */
  offshoreDepthM: number;
  /** Synolakis 1987 published max runup R, normalised by H. Read
   *  from Table 1 (analytic + lab values). */
  publishedROverH: number;
  /** Source for traceability. */
  source: string;
}

/** Synolakis 1987 Table 1 cases that the closed-form runup formula
 *  used in `extendedEffects.ts` is supposed to reproduce.
 *
 *  R/H follows the analytic Carrier-Greenspan / Synolakis 1987 form:
 *
 *      R/H = 2.831 · √(cot β) · (H/d)^(1/4)
 *
 *  For β = atan(1/19.85), cot β = 19.85, √(cot β) = 4.456.
 *  The published R/H = 2.831 · 4.456 · (H/d)^0.25 = 12.616 · (H/d)^0.25.
 *
 *  H/d = 0.019 → R/H = 12.616 · 0.019^0.25 = 4.683
 *  H/d = 0.045 → R/H = 12.616 · 0.045^0.25 = 5.815
 *  H/d = 0.075 → R/H = 12.616 · 0.075^0.25 = 6.604
 *
 *  These are the analytic values. Lab measurements scatter ±10-15 %
 *  around them per Synolakis 1987 Fig. 4. */
export const SYNOLAKIS_1987_CASES: NoaaBenchmarkSynolakisCase[] = [
  {
    HOverD: 0.019,
    beachSlopeRad: Math.atan(1 / 19.85),
    offshoreDepthM: 1,
    publishedROverH: 4.683,
    source: 'Synolakis 1987 Table 1, NOAA BP1',
  },
  {
    HOverD: 0.045,
    beachSlopeRad: Math.atan(1 / 19.85),
    offshoreDepthM: 1,
    publishedROverH: 5.815,
    source: 'Synolakis 1987 Table 1',
  },
  {
    HOverD: 0.075,
    beachSlopeRad: Math.atan(1 / 19.85),
    offshoreDepthM: 1,
    publishedROverH: 6.604,
    source: 'Synolakis 1987 Table 1',
  },
];

export interface NoaaTohokuDARTReference {
  /** Moment magnitude of the event the buoy recorded. The source
   *  scale — and therefore the wavelength the dispersion and the beam
   *  both read — is derived from it, so the reference carries it
   *  rather than the test hard-coding a number beside it. */
  magnitude: number;
  /** DART buoy ID (used in the Satake 2013 inversion). */
  dartId: string;
  /** Distance from rupture centroid to buoy (m). */
  distanceM: number;
  /** Observed peak amplitude (m). Range from Satake et al. 2013
   *  Fig. 6 — DART traces show 0.25-0.40 m at this buoy depending
   *  on filtering; 0.30 m is the central inversion value. */
  observedAmplitudeM: number;
  source: string;
}

export const TOHOKU_2011_DART_REFERENCE: NoaaTohokuDARTReference = {
  magnitude: 9.1,
  dartId: '21413',
  distanceM: 1_500_000,
  observedAmplitudeM: 0.3,
  source: 'Satake et al. 2013 BSSA 103(2B), Fig. 6',
};

export interface NoaaSumatra2004Reference {
  /** Earthquake parameters per Satake et al. 2006 inversion. */
  magnitude: number;
  /** Tide gauge / DART location name. */
  observerName: string;
  /** Distance from source centroid (m). */
  distanceM: number;
  /** Observed peak amplitude (m) in the open ocean (deep-water,
   *  before shoaling — DART-equivalent). */
  observedAmplitudeM: number;
  source: string;
}

export const SUMATRA_2004_COCOS_REFERENCE: NoaaSumatra2004Reference = {
  magnitude: 9.1,
  observerName: 'Cocos Island tide gauge',
  distanceM: 1_700_000,
  // Open-ocean equivalent before shoaling (deep-water amplitude
  // back-derived by Bernard et al. 2006 from the tide-gauge record).
  observedAmplitudeM: 0.4,
  source: 'Bernard, Mofjeld, Titov et al. 2006 Phil. Trans. R. Soc. A 364',
};
