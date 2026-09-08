import { distanceForOverpressure } from './events/impact/damageRings.js';
import type { Joules, Meters } from './units.js';
import { Pa } from './units.js';

/**
 * Casualty estimates — people, not just exposure.
 *
 * The simulator used to stop at "population inside the headline
 * ring" on purpose: a death toll printed to the person conceals the
 * factor-of-several scatter every vulnerability model carries. This
 * module makes the conversion anyway, because the number a reader
 * needs from a catastrophe simulator is "how many people", and does
 * it the only honest way: with published, cited vulnerability
 * functions, a stated low–high band, and the assumptions on the
 * label — prompt effects only, nobody evacuated, no fallout, famine,
 * disease or tsunami. Every function here is pure; the population
 * inside each band comes from the caller (WorldPop, see
 * `src/scene/populationLookup.ts`).
 *
 * Three hazard families, three sources:
 *
 *   BLAST (impacts, explosions) — U.S. Office of Technology Assessment
 *   (1979), *The Effects of Nuclear War*, OTA-NS-89, ch. II, table 2:
 *   the Hiroshima/Nagasaki-derived mortality by peak overpressure
 *   that every civil-defence planning study since has reused.
 *     ≥ 12 psi  98 % dead,  2 % injured
 *     5–12 psi  50 % dead, 40 % injured
 *     2–5 psi    5 % dead, 45 % injured
 *     1–2 psi    0 % dead, 25 % injured
 *   The bands are prompt blast + thermal + collapse together (that is
 *   how the two cities were counted). The 12 and 2 psi radii are not
 *   drawn on the globe; they are derived from the drawn 5 and 1 psi
 *   contours with the Kinney–Graham curve ratio at the event's yield,
 *   so the bands stay consistent with what the map shows.
 *
 *   SHAKING (earthquakes) — Jaiswal & Wald (2010), *An empirical model
 *   for global earthquake fatality estimation*, Earthquake Spectra
 *   26(4), 1017–1037 — the USGS PAGER model. Fatality rate as a
 *   function of shaking intensity S: ν(S) = Φ(ln(S/θ) / β), with
 *   country-specific θ and β fitted on 1973–2007 events. We are not a
 *   country: the central estimate uses an average-stock pair and the
 *   band spans the published national fits, from the best-engineered
 *   stocks (θ ≈ 14.5, narrow β: a few deaths per million at MMI VIII)
 *   to unreinforced masonry (θ ≈ 11.5, wide β: tens of per cent at
 *   IX) — three orders of magnitude, which is the truth of the
 *   matter. Applied to the MMI ≥ VII, ≥ VIII and ≥ IX annuli at their
 *   mid-band intensity.
 *
 *   PYROCLASTIC (volcanoes) — Auker, Sparks, Siebert, Crosweller &
 *   Ewert (2013), *A statistical analysis of the global historical
 *   volcanic fatalities record*, J. Applied Volcanology 2:2: pyroclastic
 *   density currents are the deadliest volcanic hazard on record, and
 *   people caught inside one almost never survive (Saint-Pierre 1902,
 *   Pompeii, Merapi 2010). Mortality inside the runout without
 *   evacuation is taken as 90 %; a lateral blast counts the same
 *   inside its sector. Ashfall at the 1 mm isopach kills nobody.
 *
 *   TSUNAMI — not converted. Counting people in a run-up field needs
 *   a coastal DEM and an inundation model; the globe shows where the
 *   wave lands, the label says the toll is not in the number.
 */

/** One annulus of the casualty model. `outerRadiusM` is what the
 *  caller queries the population for; the population INSIDE the band
 *  is the difference of successive cumulative counts. */
export interface CasualtyBand {
  /** Stable key — also the i18n suffix (`casualties.band.<key>`). */
  key: string;
  innerRadiusM: number;
  outerRadiusM: number;
  /** Optional footprint replacing the circle of `outerRadiusM` — the
   *  rupture stadium of an extended earthquake source, whose MMI
   *  contours hug a 500 km fault rather than a point. Cumulative
   *  semantics are unchanged: the annulus is the difference of
   *  successive footprints. */
  polygon?: readonly { latDeg: number; lonDeg: number }[];
  /** Central mortality inside the band (0–1). */
  mortality: number;
  /** Low / high mortality for the uncertainty band (0–1). */
  mortalityLow: number;
  mortalityHigh: number;
  /** Prompt-injury rate inside the band, when the source gives one. */
  injuryRate?: number;
}

export interface CasualtyPlan {
  /** 'blast' | 'shaking' | 'pyroclastic' — which source the bands come from. */
  model: 'blast' | 'shaking' | 'pyroclastic';
  /** Annuli, inner to outer, contiguous. */
  bands: CasualtyBand[];
}

// ---------------------------------------------------------------------
// Blast — OTA 1979
// ---------------------------------------------------------------------

const PSI = 6_894.757;

/** OTA-NS-89 ch. II table 2 — mortality / injury by overpressure band. */
export const OTA_BLAST_BANDS = [
  { key: 'blast12psi', minPsi: 12, mortality: 0.98, injury: 0.02 },
  { key: 'blast5psi', minPsi: 5, mortality: 0.5, injury: 0.4 },
  { key: 'blast2psi', minPsi: 2, mortality: 0.05, injury: 0.45 },
  { key: 'blast1psi', minPsi: 1, mortality: 0, injury: 0.25 },
] as const;

/** Scatter on the OTA rates: the Hiroshima/Nagasaki mortality at a
 *  given overpressure spans roughly a factor 2 between studies
 *  (Glasstone & Dolan 1977 ch. XII). */
const BLAST_BAND_FACTOR = 2;

export interface BlastCasualtyInput {
  /** Energy driving the air blast (J): explosion yield, or the
   *  impact's blast-coupled kinetic energy. Used only for the
   *  Kinney–Graham radius ratios. */
  blastEnergy: Joules;
  /** 5 psi radius as drawn on the globe (m). */
  overpressure5psiRadius: Meters;
  /** 1 psi radius as drawn on the globe (m). */
  overpressure1psiRadius: Meters;
}

/**
 * Ratio r(P)/r(P_ref) on the Kinney–Graham surface-burst curve at the
 * given yield. Falls back to the far-field scaling (Δp ∝ r^−1.3 ⇒
 * r ∝ Δp^−0.77) when the inversion cannot bracket the target.
 */
function overpressureRadiusRatio(energy: Joules, psi: number, refPsi: number): number {
  try {
    const r = distanceForOverpressure(energy, Pa(psi * PSI)) as number;
    const ref = distanceForOverpressure(energy, Pa(refPsi * PSI)) as number;
    if (Number.isFinite(r) && Number.isFinite(ref) && ref > 0 && r > 0) return r / ref;
  } catch {
    // fall through to the scaling law
  }
  return (psi / refPsi) ** (-1 / 1.3);
}

/** Blast casualty plan: four OTA bands anchored on the drawn rings. */
export function blastCasualtyPlan(input: BlastCasualtyInput): CasualtyPlan | null {
  const r5 = input.overpressure5psiRadius as number;
  const r1 = input.overpressure1psiRadius as number;
  if (!Number.isFinite(r5) || !Number.isFinite(r1) || r5 <= 0 || r1 <= r5) return null;
  const r12 = r5 * overpressureRadiusRatio(input.blastEnergy, 12, 5);
  const r2 = r1 * overpressureRadiusRatio(input.blastEnergy, 2, 1);
  const edges = [0, Math.min(r12, r5), r5, Math.max(r5, Math.min(r2, r1)), r1];
  const bands: CasualtyBand[] = OTA_BLAST_BANDS.map((b, i) => ({
    key: b.key,
    innerRadiusM: edges[i] ?? 0,
    outerRadiusM: edges[i + 1] ?? 0,
    mortality: b.mortality,
    mortalityLow: b.mortality / BLAST_BAND_FACTOR,
    mortalityHigh: Math.min(1, b.mortality * BLAST_BAND_FACTOR),
    injuryRate: b.injury,
  }));
  return { model: 'blast', bands };
}

// ---------------------------------------------------------------------
// Shaking — PAGER (Jaiswal & Wald 2010)
// ---------------------------------------------------------------------

/** Standard normal CDF, Abramowitz & Stegun 7.1.26 (|ε| < 1.5 × 10⁻⁷). */
export function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const poly =
    t *
    (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const density = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  const upper = 1 - density * poly;
  return x >= 0 ? upper : 1 - upper;
}

export interface PagerParameters {
  /** θ — intensity at which half the exposed population dies. */
  theta: number;
  /** β — log-normal width. */
  beta: number;
}

/**
 * Generic PAGER parameter sets. The published national fits (Jaiswal
 * & Wald 2010, table 2) span three orders of magnitude in fatality
 * rate at a given intensity: θ ≈ 14–15 with a narrow β for the best
 * engineered stocks (Japan, the United States, New Zealand — a few
 * deaths per million at MMI VIII), θ ≈ 10–11.5 with a wide β for
 * unreinforced masonry (Iran, Pakistan, Haiti — tens of per cent at
 * MMI IX). The simulator is not a country, so the central estimate
 * is an average building stock and the band deliberately spans the
 * two extremes rather than pretending to a factor of two.
 */
export const PAGER_VULNERABILITY = {
  low: { theta: 14.5, beta: 0.12 },
  mid: { theta: 13.5, beta: 0.22 },
  high: { theta: 11.5, beta: 0.3 },
} as const satisfies Record<'low' | 'mid' | 'high', PagerParameters>;

/** ν(S) = Φ(ln(S/θ)/β) — fatality rate at shaking intensity S. */
export function pagerFatalityRate(mmi: number, params: PagerParameters): number {
  if (!Number.isFinite(mmi) || mmi <= 0) return 0;
  return Math.min(1, Math.max(0, normalCdf(Math.log(mmi / params.theta) / params.beta)));
}

export interface ShakingCasualtyInput {
  mmi7Radius: Meters;
  mmi8Radius: Meters;
  mmi9Radius: Meters;
}

/** Shaking casualty plan: the ≥ IX, VIII–IX and VII–VIII annuli at
 *  their mid-band intensity (9.5, 8.5, 7.5). */
export function shakingCasualtyPlan(input: ShakingCasualtyInput): CasualtyPlan | null {
  const r7 = input.mmi7Radius as number;
  const r8 = input.mmi8Radius as number;
  const r9 = input.mmi9Radius as number;
  if (![r7, r8, r9].every((r) => Number.isFinite(r) && r >= 0)) return null;
  if (r7 <= 0) return null;
  const rings: { key: string; inner: number; outer: number; mmi: number }[] = [
    { key: 'mmi9', inner: 0, outer: r9, mmi: 9.5 },
    { key: 'mmi8', inner: r9, outer: Math.max(r9, r8), mmi: 8.5 },
    { key: 'mmi7', inner: Math.max(r9, r8), outer: Math.max(r9, r8, r7), mmi: 7.5 },
  ];
  const bands: CasualtyBand[] = rings
    .filter((r) => r.outer > r.inner)
    .map((r) => ({
      key: r.key,
      innerRadiusM: r.inner,
      outerRadiusM: r.outer,
      mortality: pagerFatalityRate(r.mmi, PAGER_VULNERABILITY.mid),
      mortalityLow: pagerFatalityRate(r.mmi, PAGER_VULNERABILITY.low),
      mortalityHigh: pagerFatalityRate(r.mmi, PAGER_VULNERABILITY.high),
    }));
  if (bands.length === 0) return null;
  return { model: 'shaking', bands };
}

// ---------------------------------------------------------------------
// Pyroclastic — Auker et al. 2013
// ---------------------------------------------------------------------

/** Mortality inside a pyroclastic density current without evacuation. */
export const PYROCLASTIC_MORTALITY = 0.9;

export interface PyroclasticCasualtyInput {
  pyroclasticRunout: Meters;
  /** Lateral-blast runout (m) and sector width (°), when the eruption
   *  has one. The blast is a wedge: its annulus beyond the pyroclastic
   *  disc is weighted by sector/360. */
  lateralBlastRunout?: Meters;
  lateralBlastSectorDeg?: number;
}

export function pyroclasticCasualtyPlan(input: PyroclasticCasualtyInput): CasualtyPlan | null {
  const runout = input.pyroclasticRunout as number;
  const bands: CasualtyBand[] = [];
  if (Number.isFinite(runout) && runout > 0) {
    bands.push({
      key: 'pyroclastic',
      innerRadiusM: 0,
      outerRadiusM: runout,
      mortality: PYROCLASTIC_MORTALITY,
      mortalityLow: 0.5,
      mortalityHigh: 1,
    });
  }
  const blast = input.lateralBlastRunout as number | undefined;
  const sector = input.lateralBlastSectorDeg ?? 0;
  if (blast !== undefined && Number.isFinite(blast) && blast > Math.max(0, runout) && sector > 0) {
    const weight = Math.min(1, Math.max(0, sector / 360));
    bands.push({
      key: 'lateralBlast',
      innerRadiusM: Math.max(0, runout),
      outerRadiusM: blast,
      mortality: PYROCLASTIC_MORTALITY * weight,
      mortalityLow: 0.5 * weight,
      mortalityHigh: weight,
    });
  }
  if (bands.length === 0) return null;
  return { model: 'pyroclastic', bands };
}

// ---------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------

export interface BandEstimate {
  key: string;
  innerRadiusM: number;
  outerRadiusM: number;
  /** People inside the annulus. */
  population: number;
  mortality: number;
  deaths: number;
  deathsLow: number;
  deathsHigh: number;
  injured: number;
}

export interface CasualtyEstimate {
  model: CasualtyPlan['model'];
  /** People inside the outermost band. */
  exposed: number;
  deaths: number;
  deathsLow: number;
  deathsHigh: number;
  /** Prompt injuries (blast model only; 0 otherwise). */
  injured: number;
  bands: BandEstimate[];
}

/**
 * Turn a plan plus the CUMULATIVE population inside each band's outer
 * radius (same order as `plan.bands`) into an estimate. Cumulative
 * counts are what a circle query returns; the annulus population is
 * the difference, clamped at zero against raster noise.
 */
export function estimateCasualties(
  plan: CasualtyPlan,
  cumulativePopulation: readonly number[]
): CasualtyEstimate {
  const bands: BandEstimate[] = [];
  let previous = 0;
  let deaths = 0;
  let deathsLow = 0;
  let deathsHigh = 0;
  let injured = 0;
  plan.bands.forEach((band, i) => {
    const cumulative = Math.max(previous, cumulativePopulation[i] ?? previous);
    const population = Math.max(0, cumulative - previous);
    previous = cumulative;
    const d = population * band.mortality;
    const dl = population * band.mortalityLow;
    const dh = population * band.mortalityHigh;
    const inj = population * (band.injuryRate ?? 0);
    deaths += d;
    deathsLow += dl;
    deathsHigh += dh;
    injured += inj;
    bands.push({
      key: band.key,
      innerRadiusM: band.innerRadiusM,
      outerRadiusM: band.outerRadiusM,
      population: Math.round(population),
      mortality: band.mortality,
      deaths: Math.round(d),
      deathsLow: Math.round(dl),
      deathsHigh: Math.round(dh),
      injured: Math.round(inj),
    });
  });
  return {
    model: plan.model,
    exposed: Math.round(previous),
    deaths: Math.round(deaths),
    deathsLow: Math.round(deathsLow),
    deathsHigh: Math.round(deathsHigh),
    injured: Math.round(injured),
    bands,
  };
}
