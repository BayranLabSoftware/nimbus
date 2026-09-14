/**
 * Validation fixtures — published observations against which the
 * simulator predictions are compared.
 *
 * Each entry carries a citation (paper or open-data DOI) and an
 * uncertainty band so tolerance assertions can be honest. Fixtures
 * are intentionally hand-curated and tiny (~10 KB total); they sit
 * next to the test code rather than as binary blobs because raw
 * binary archives age poorly and would inflate the repo.
 *
 * The validation contract: if a future formula change drifts the
 * predicted value outside the documented tolerance band, the test
 * fails — pointing the contributor at the mismatched paper.
 */

import { HELD_OUT_PLUMES } from './heldOutEvents.js';

/* ==========================================================================
 * Tsunami arrival times — far-field DART / tide-gauge reconstructions
 * ==========================================================================
 *
 * Each entry: distance from epicentre (m) and observed first-wave
 * arrival (minutes after origin time). Validation regime: deep-ocean,
 * far-field (≥ 2 000 km). The naive Lamb 1932 celerity over a
 * uniform-depth ocean is a poor predictor in the near field where
 * continental-shelf shallowing dominates the apparent travel time;
 * we restrict the fixtures to stations where the linear shallow-water
 * model is the right tool.
 *
 * Sources — UNVERIFIED, and the tests that read these are skipped.
 *
 * On 14 September 2026 the citation audit found that this block
 * cited, for Tōhoku, "Rabinovich et al. 2013, 'The 2011 Tōhoku
 * tsunami: a global perspective', Pure & Applied Geophysics 170,
 * 1003-1018", with a DOI. No such paper is in Crossref, and the DOI
 * given belongs to an article on rock physics. For
 * Sumatra it cited Table 4 of Rabinovich & Eblé 2015, "Deep-ocean
 * Measurements of Tsunami Waves" (PAGEOPH 172, 3281–3312, DOI
 * 10.1007/s00024-015-1058-1), a real paper on deep-ocean records
 * that is not a source of these tide-gauge times. The distances were
 * wrong as well, by up to 130 %.
 *
 * The distances below are now great circles from the USGS epicentres
 * (Tōhoku 38.297 °N 142.373 °E; Sumatra 3.316 °N 95.854 °E) to the
 * DART positions NOAA NCEI lists for 2011 and to the tide-gauge towns.
 * The arrival times are what was there before and have no source.
 * They have to be read from a published analysis of the records —
 * Heidarzadeh & Satake 2013, PAGEOPH 170, 1275–1293, DOI
 * 10.1007/s00024-012-0558-5, works through the DART records of this
 * tsunami — before these can test anything.
 *
 * The simulator-side comparison uses the analytical shallow-water
 * arrival time — `t = r / sqrt(g · h_mean)` — over a 4 500 m mean
 * depth, which is the ocean-volume-weighted average of the Pacific /
 * Indian basins (Charette & Smith 2010 Oceanography 23.2, Table 1).
 * Far-field tolerance is ±20 % on the predicted travel time, which
 * captures the bathymetric spread between the chosen mean depth and
 * the actual along-track average (Pacific basins range 3 800–5 200 m).
 */

export interface DartBuoyObservation {
  station: string;
  /** Great-circle distance from epicentre (m). */
  distanceFromEpicentreM: number;
  /** First-wave arrival relative to origin time (min). */
  observedArrivalMin: number;
  /** ±1σ measurement uncertainty on the arrival time (min). */
  observedArrivalUncertaintyMin: number;
}

export const TOHOKU_2011_DART: readonly DartBuoyObservation[] = [
  {
    station: 'DART 21401',
    distanceFromEpicentreM: 987_000,
    observedArrivalMin: 175,
    observedArrivalUncertaintyMin: 5,
  },
  {
    station: 'DART 51407 (HI offshore)',
    distanceFromEpicentreM: 6_181_000,
    observedArrivalMin: 480,
    observedArrivalUncertaintyMin: 10,
  },
  {
    station: 'DART 46411 (CA offshore)',
    distanceFromEpicentreM: 7_481_000,
    observedArrivalMin: 620,
    observedArrivalUncertaintyMin: 12,
  },
  {
    station: 'DART 32412 (Chile)',
    distanceFromEpicentreM: 14_800_000,
    observedArrivalMin: 1_240,
    observedArrivalUncertaintyMin: 20,
  },
] as const;

export const SUMATRA_2004_TIDE_GAUGES: readonly DartBuoyObservation[] = [
  {
    station: 'Cocos Is.',
    distanceFromEpicentreM: 1_720_000,
    observedArrivalMin: 130,
    observedArrivalUncertaintyMin: 8,
  },
  {
    station: 'Salalah',
    distanceFromEpicentreM: 4_811_000,
    observedArrivalMin: 380,
    observedArrivalUncertaintyMin: 15,
  },
  {
    station: 'Mombasa',
    distanceFromEpicentreM: 6_296_000,
    observedArrivalMin: 430,
    observedArrivalUncertaintyMin: 15,
  },
] as const;

/* ==========================================================================
 * Earthquake MMI rings — USGS ShakeMap reconstructions
 * ==========================================================================
 *
 * MMI VII (very strong / damaging) intensity contour radii. The
 * simulator's ring is where the Joyner & Boore 1981 PGA, with the
 * Boore et al. 2014 site term, reaches the PGA that the Worden et al.
 * 2012 California conversion gives for MMI VII.
 *
 * Sources:
 *   - Tōhoku 2011 is not in the list below: a megathrust's footprint
 *     is a stadium, not a ring, and it is compared by area in
 *     shakemapFixtures.ts.
 *   - Northridge 1994: Wald et al. 1999 EQ Spectra 15(3), Fig. 6
 *     California reference event; MMI VII observed at ~25 km.
 *   - L'Aquila 2009: Galli & Camassi 2009 macroseismic survey
 *     (Quad. Geofis. INGV 65), MMI VIII patch ~5 km, MMI VII ~15 km.
 *
 * The simulator-side comparison uses the MMI 7 ring radius from the
 * earthquake pipeline — so what this checks is Joyner & Boore's
 * distance decay and Worden's conversion together.
 */

export interface ShakemapObservation {
  event: string;
  magnitudeMw: number;
  /** Hypocentre depth (m). */
  depthM: number;
  /** Observed MMI VII radius (m, distance to the contour line). */
  observedMmi7RadiusM: number;
  /** ±1σ tolerance on the radius, m. */
  toleranceM: number;
  source: string;
}

export const SHAKEMAP_OBSERVATIONS: readonly ShakemapObservation[] = [
  {
    event: 'Northridge 1994',
    magnitudeMw: 6.7,
    depthM: 18_000,
    observedMmi7RadiusM: 25_000,
    toleranceM: 8_000,
    source: 'Wald et al. 1999 EQ Spectra Fig. 6',
  },
  {
    event: "L'Aquila 2009",
    magnitudeMw: 6.3,
    depthM: 9_000,
    observedMmi7RadiusM: 15_000,
    toleranceM: 5_000,
    source: 'Galli & Camassi 2009 INGV macroseismic survey',
  },
] as const;

/* ==========================================================================
 * Volcanic plume — observed heights vs Mastin 2009 prediction
 * ==========================================================================
 *
 * Sources:
 *   - Mastin et al. 2009, JVGR 186, Table 1 + Fig. 2.
 *   - Pinatubo 1991: Holasek et al. 1996, JGR 101 (D7) — peak plume
 *     height 35 km observed by AVHRR.
 *   - Mount St Helens 1980: Carey & Sigurdsson 1985 — ~25 km column.
 *
 * The Mastin 2009 fit has factor-2 scatter at any given V̇, so the
 * tolerance band is wide on purpose.
 */

export interface PlumeHeightObservation {
  event: string;
  /** Volume eruption rate (m³ DRE / s). */
  volumeEruptionRate: number;
  observedPlumeHeightKm: number;
  /** ±1σ tolerance on the observed height, km. */
  toleranceKm: number;
  source: string;
  /** Whether a miss fails the suite (default true). Held-out rows are
   *  measured and printed without a gate. */
  gated?: boolean;
  caveat?: string;
}

/** Mastin 2009 fits the plume height to V̇ in m³/s of DRE (dense-rock-
 *  equivalent magma), NOT bulk tephra. Bulk-to-DRE conversion uses the
 *  ~2 500 kg/m³ DRE density and the deposit's bulk porosity. The values
 *  below come from Mastin et al. 2009 Table 1 directly (column
 *  "Volume flux at vent (m³/s DRE)"). */
export const PLUME_HEIGHT_OBSERVATIONS: readonly PlumeHeightObservation[] = [
  {
    event: 'Pinatubo 1991',
    volumeEruptionRate: 1.7e5,
    observedPlumeHeightKm: 35,
    toleranceKm: 8,
    source: 'Mastin et al. 2009 Table 1 + Holasek et al. 1996',
  },
  {
    event: 'Mount St Helens 1980',
    volumeEruptionRate: 5.0e4,
    observedPlumeHeightKm: 25,
    toleranceKm: 5,
    source: 'Mastin et al. 2009 Table 1 + Carey & Sigurdsson 1985',
  },
  {
    event: 'Krakatau 1883',
    volumeEruptionRate: 5.0e5,
    observedPlumeHeightKm: 40,
    toleranceKm: 10,
    source: 'Self & Rampino 1981 reconstruction',
  },
  // Held out of every fit, and written down before they were run:
  // heldOutEvents.ts has the rules they came in under.
  ...HELD_OUT_PLUMES,
];

/* ==========================================================================
 * Tunguska energy budget — Boslough & Crawford 2008
 * ==========================================================================
 *
 * Reconstructed yield from the tree-fall pattern + reported airblast
 * spans 3–30 Mt TNT depending on the model: Boslough & Crawford's
 * 2008 hydrocode reconstruction prefers 5–15 Mt; Boslough 2008b's
 * "low-altitude airbursts" regime extends the range upward to 30 Mt
 * for the same observed tree-fall ground footprint.
 *
 * The simulator's Tunguska preset must reproduce a yield in the
 * commonly-cited 3–30 Mt envelope. This is the single safeguard
 * against the preset drifting outside the literature range.
 *
 * Sources:
 *   - Boslough M., Crawford D. (2008). "Low-altitude airbursts and
 *     the impact threat", International Journal of Impact Engineering
 *     35, 1441-1448. DOI: 10.1016/j.ijimpeng.2008.07.053.
 *   - Chyba, C. F., Thomas, P. J. & Zahnle, K. J. (1993). "The 1908
 *     Tunguska explosion: atmospheric disruption of a stony asteroid",
 *     Nature 361, 40-44. (gives 10-15 Mt central estimate)
 */

export const TUNGUSKA_ENERGY_OBSERVATION = {
  event: 'Tunguska 1908',
  yieldMtLow: 3,
  yieldMtHigh: 30,
  source: 'Boslough & Crawford 2008 IJIE 35 + Chyba et al. 1993 Nature 361',
} as const;
